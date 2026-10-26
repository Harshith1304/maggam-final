'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/*
  The 3D background: a real plain-weave. Warp threads run up the cloth, weft threads run across,
  and each one passes over/under its neighbours (z = ±cos(pi * (i + j))). The sheet breathes like
  hanging cloth, ripples around the pointer, and a "shuttle" lights each weft row as it is laid.
  Raw three.js, one draw call, ~60k vertices.
*/

const VERT = /* glsl */ `
uniform float uTime;
uniform vec2 uMouse;
uniform float uW;
attribute float aType;
attribute float aRow;
varying float vType;
varying float vGlow;
varying float vShade;
varying float vFade;
void main() {
  vec3 p = position;
  float t = uTime;
  float wave = sin(p.x * 0.34 + t * 0.32) * 0.55 + cos(p.y * 0.5 - t * 0.26) * 0.5 + sin((p.x + p.y) * 0.21 + t * 0.18) * 0.7;
  p.z += wave;
  float d = distance(p.xy, uMouse);
  p.z += exp(-d * d * 0.05) * 0.9 * sin(d * 1.9 - t * 2.2);

  float glow = 0.0;
  if (aType > 0.5) {
    float tt = mod(t * 0.9 - aRow * 0.55, 26.0);
    float prog = (position.x / uW) + 0.5;
    float front = tt / 2.6;
    float head = exp(-pow((prog - front) * 16.0, 2.0)) * step(tt, 2.6);
    float trail = step(prog, front) * (1.0 - smoothstep(2.6, 9.0, tt)) * exp(-(front - prog) * 2.4) * 0.5;
    glow = head + trail;
  }
  vGlow = glow;
  vType = aType;
  vShade = 0.5 + 0.5 * sin(wave * 1.4 + 1.0);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  vFade = 1.0 - smoothstep(0.7, 1.35, length(gl_Position.xy / gl_Position.w));
}
`;

const FRAG = /* glsl */ `
uniform vec3 uWarp;
uniform vec3 uWeft;
uniform vec3 uHot;
uniform float uAlpha;
varying float vType;
varying float vGlow;
varying float vShade;
varying float vFade;
void main() {
  vec3 base = mix(uWarp, uWeft, vType);
  vec3 col = mix(base, uHot, clamp(vGlow, 0.0, 1.0));
  float a = (0.2 + 0.38 * vShade + 0.9 * vGlow) * vFade * uAlpha;
  gl_FragColor = vec4(col, a);
}
`;

function start(THREE, canvas, host) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch {
    host.dataset.fallback = 'true';
    return () => {};
  }
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

  const COLS = 130, ROWS = 84, SEG = 140, W = 34, H = 22, A = 0.07;
  const pos = [], type = [], row = [];
  const push = (x, y, z, t, r) => { pos.push(x, y, z); type.push(t); row.push(r); };
  for (let i = 0; i < COLS; i++) {
    const x = (i / (COLS - 1) - 0.5) * W;
    for (let s = 0; s < SEG; s++) {
      const ya = (s / SEG - 0.5) * H, yb = ((s + 1) / SEG - 0.5) * H;
      const va = (ya / H + 0.5) * (ROWS - 1), vb = (yb / H + 0.5) * (ROWS - 1);
      push(x, ya, A * Math.cos(Math.PI * (va + i)), 0, 0);
      push(x, yb, A * Math.cos(Math.PI * (vb + i)), 0, 0);
    }
  }
  for (let j = 0; j < ROWS; j++) {
    const y = (j / (ROWS - 1) - 0.5) * H;
    for (let s = 0; s < SEG; s++) {
      const xa = (s / SEG - 0.5) * W, xb = ((s + 1) / SEG - 0.5) * W;
      const ua = (xa / W + 0.5) * (COLS - 1), ub = (xb / W + 0.5) * (COLS - 1);
      push(xa, y, -A * Math.cos(Math.PI * (ua + j)), 1, j);
      push(xb, y, -A * Math.cos(Math.PI * (ub + j)), 1, j);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aType', new THREE.Float32BufferAttribute(type, 1));
  geo.setAttribute('aRow', new THREE.Float32BufferAttribute(row, 1));

  const uniforms = {
    uTime: { value: 3 },
    uMouse: { value: new THREE.Vector2(99, 99) },
    uW: { value: W },
    uWarp: { value: new THREE.Vector3(0.36, 0.49, 1) },
    uWeft: { value: new THREE.Vector3(0.95, 0.71, 0.2) },
    uHot: { value: new THREE.Vector3(1, 0.95, 0.79) },
    uAlpha: { value: 0.9 },
  };
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false });
  const mesh = new THREE.LineSegments(geo, material);
  mesh.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(mesh);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);

  const css = () => getComputedStyle(document.documentElement);
  // Colours are fed to the shader as plain sRGB so they match the CSS tokens exactly.
  const rgb = (v, fallback) => {
    let h = (v || fallback).trim().replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  };
  const applyTheme = () => {
    const s = css();
    const dark = document.documentElement.dataset.theme !== 'light';
    uniforms.uWarp.value.set(...rgb(s.getPropertyValue('--loom-warp'), '#5C7CFF'));
    uniforms.uWeft.value.set(...rgb(s.getPropertyValue('--loom-weft'), '#F2B632'));
    uniforms.uHot.value.set(...rgb(s.getPropertyValue('--loom-hot'), '#FFF1C9'));
    uniforms.uAlpha.value = parseFloat(s.getPropertyValue('--loom-alpha')) || 0.9;
    material.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
    material.needsUpdate = true;
  };
  applyTheme();
  const mo = new MutationObserver(() => { applyTheme(); renderOnce(); });
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const onMove = (e) => {
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = -((e.clientY / window.innerHeight) * 2 - 1);
  };
  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderOnce();
  };
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let last = performance.now();
  let raf = 0, running = true;

  function frame() {
    const scroll = window.scrollY || 0;
    camera.position.set(pointer.x * 1.6, -11 + pointer.y * 0.8, 8 - Math.min(scroll / 1800, 1) * 1.6);
    camera.lookAt(0, 0.8, 0);
    uniforms.uMouse.value.set(pointer.x * W * 0.32, pointer.y * H * 0.32 + 1.5);
    renderer.render(scene, camera);
  }
  function renderOnce() { if (reduce || !running) frame(); }
  function loop() {
    raf = requestAnimationFrame(loop);
    if (document.hidden) return;
    const now = performance.now();
    uniforms.uTime.value += Math.min((now - last) / 1000, 0.05);
    last = now;
    pointer.x += (pointer.tx - pointer.x) * 0.04;
    pointer.y += (pointer.ty - pointer.y) * 0.04;
    frame();
  }

  window.addEventListener('resize', resize);
  resize();
  if (reduce) frame();
  else {
    window.addEventListener('pointermove', onMove, { passive: true });
    loop();
  }

  return () => {
    running = false;
    cancelAnimationFrame(raf);
    mo.disconnect();
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointermove', onMove);
    geo.dispose();
    material.dispose();
    renderer.dispose();
  };
}

export default function LoomBackground() {
  const canvasRef = useRef(null);
  const hostRef = useRef(null);
  const pathname = usePathname() || '';
  const calm = pathname.includes('/threads/') || pathname.includes('/admin');

  useEffect(() => {
    let disposed = false;
    let stop = () => {};
    import('three').then((THREE) => {
      if (disposed || !canvasRef.current) return;
      stop = start(THREE, canvasRef.current, hostRef.current);
    });
    return () => { disposed = true; stop(); };
  }, []);

  return (
    <div className="loom-bg" ref={hostRef} data-calm={calm} aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
