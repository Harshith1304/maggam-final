import { paletteOf } from './dyes';

// Tiny deterministic random so scenes never change between builds.
const rng = (seed) => {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
};
const stars = (p, seed = 3, n = 26, ymax = 200) => {
  const r = rng(seed);
  let out = '';
  for (let i = 0; i < n; i++) {
    out += `<circle cx="${(r() * 800).toFixed(0)}" cy="${(r() * ymax).toFixed(0)}" r="${(0.8 + r() * 1.6).toFixed(1)}" fill="${p.c3}" opacity="${(0.35 + r() * 0.5).toFixed(2)}"/>`;
  }
  return out;
};
const person = (x, y, s, c) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><circle cy="-40" r="11" fill="${c}"/><path d="M-15 0 Q-16 -26 0 -28 Q16 -26 15 0Z" fill="${c}"/></g>`;
const rays = (cx, cy, r1, r2, n, c, w = 5, op = 1) => {
  let o = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    o += `<path d="M${(cx + r1 * Math.cos(a)).toFixed(1)} ${(cy + r1 * Math.sin(a)).toFixed(1)} L${(cx + r2 * Math.cos(a)).toFixed(1)} ${(cy + r2 * Math.sin(a)).toFixed(1)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" opacity="${op}"/>`;
  }
  return o;
};

const SCENES = {
  // 1 - a pack around a fire, one soul turned away
  pack: (p) => {
    const figs = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + 0.3;
      figs.push({ x: 400 + 270 * Math.cos(a), y: 365 + 80 * Math.sin(a) });
    }
    figs.sort((a, b) => a.y - b.y);
    return `${stars(p, 11)}
      <ellipse cx="400" cy="375" rx="360" ry="105" fill="${p.ink}" opacity=".55"/>
      ${figs.map((f) => person(f.x.toFixed(0), f.y.toFixed(0), (0.75 + (f.y - 285) / 260).toFixed(2), p.c3)).join('')}
      <circle cx="400" cy="345" r="62" fill="${p.c2}" opacity=".22"/><circle cx="400" cy="345" r="34" fill="${p.c2}" opacity=".35"/>
      <path d="M400 290 C 428 322 430 340 414 358 C 408 348 404 344 400 346 C 396 344 392 348 386 358 C 370 340 372 322 400 290Z" fill="${p.c2}"/>
      <path d="M400 318 C 412 334 412 346 400 356 C 388 346 388 334 400 318Z" fill="${p.c3}"/>
      ${person(710, 205, 0.9, p.c1)}`;
  },
  // 2 - the real sun vs the tiny sun on the screen
  lens: (p) => `${rays(400, 255, 200, 250, 24, p.c2, 5, 0.55)}<circle cx="400" cy="255" r="170" fill="${p.c2}"/>
      <rect x="318" y="95" width="164" height="330" rx="26" fill="${p.ink}"/>
      <rect x="328" y="112" width="144" height="296" rx="16" fill="${p.bg}"/>
      <circle cx="400" cy="262" r="30" fill="${p.c2}"/>
      <rect x="372" y="104" width="56" height="6" rx="3" fill="${p.bg}"/>`,
  // 3 - desert, plains, and the package between them
  plains: (p) => {
    let sprouts = '';
    for (let r = 0; r < 5; r++) for (let c = 0; c < 9; c++) {
      const x = 440 + c * 40 + (r % 2) * 18, y = 360 + r * 30;
      sprouts += `<path d="M${x} ${y} q-9 -14 -16 -12 M${x} ${y} q9 -16 17 -14 M${x} ${y} v-22" stroke="${p.c3}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    }
    return `<circle cx="210" cy="130" r="54" fill="${p.c3}" opacity=".9"/><circle cx="210" cy="130" r="78" fill="${p.c3}" opacity=".18"/>
      <path d="M0 360 Q110 270 230 345 T400 345 L400 500 L0 500Z" fill="${p.c2}"/>
      <path d="M0 410 Q150 340 280 410 T400 400 L400 500 L0 500Z" fill="${p.c2}" opacity=".7"/>
      <rect x="400" y="330" width="400" height="170" fill="${p.c1}"/>${sprouts}
      <rect x="371" y="285" width="58" height="52" rx="3" fill="${p.c3}"/>
      <path d="M371 306 H429 M400 285 V337" stroke="${p.ink}" stroke-width="7"/>`;
  },
  // 4 - one road, two ends: the crown and the mace
  crossroads: (p) => `<circle cx="400" cy="95" r="120" fill="${p.c2}" opacity=".18"/>${stars(p, 5, 18, 150)}
      <path d="M400 520 L400 350 Q400 300 330 245 L240 175" stroke="${p.c1}" stroke-width="58" fill="none"/>
      <path d="M400 350 Q400 300 470 245 L560 175" stroke="${p.c1}" stroke-width="58" fill="none"/>
      <path d="M400 500 L400 360" stroke="${p.c3}" stroke-width="5" stroke-dasharray="18 16" fill="none"/>
      <path d="M170 150 L170 100 L196 128 L218 88 L240 128 L266 100 L266 150Z" fill="${p.c2}"/>
      <rect x="166" y="150" width="104" height="14" rx="3" fill="${p.c2}"/>
      <g transform="translate(580 110)"><path d="M0 46 L0 130" stroke="${p.c3}" stroke-width="9" stroke-linecap="round"/><circle r="36" cy="14" fill="${p.c3}"/>
      ${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<path d="M0 14 L${(54 * Math.sin((a * Math.PI) / 180)).toFixed(0)} ${(14 - 54 * Math.cos((a * Math.PI) / 180)).toFixed(0)}" stroke="${p.c3}" stroke-width="9" stroke-linecap="round"/>`).join('')}</g>`,
  // 5 - kindness poured to a measured line
  pitcher: (p) => `<g transform="rotate(-24 250 230)"><path d="M180 150 Q180 120 215 118 L285 118 Q320 120 320 150 L335 300 Q335 360 250 360 Q165 360 165 300Z" fill="${p.c1}"/>
      <path d="M200 118 q-24 -4 -30 -26 q36 -4 52 26Z" fill="${p.c1}"/><path d="M180 200 H320" stroke="${p.c3}" stroke-width="5" opacity=".55"/><path d="M174 250 H326" stroke="${p.c3}" stroke-width="5" opacity=".55"/></g>
      <path d="M172 112 Q330 80 390 270" stroke="${p.c3}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".9"/>
      <path d="M340 300 L460 300 L448 420 L352 420Z" fill="${p.ink}"/><path d="M344 345 L456 345 L452 420 L348 420Z" fill="${p.c3}" opacity=".9"/>
      <path d="M470 345 H640" stroke="${p.c2}" stroke-width="4" stroke-dasharray="10 9"/><circle cx="640" cy="345" r="9" fill="${p.c2}"/>
      <ellipse cx="400" cy="440" rx="190" ry="14" fill="${p.ink}" opacity=".5"/>`,
  // 6 - marsh, stepping stones, a low sun
  marsh: (p) => {
    let reeds = '';
    const r = rng(9);
    for (let i = 0; i < 36; i++) {
      const x = r() * 800, h = 70 + r() * 110, y = 340 + r() * 150;
      reeds += `<path d="M${x.toFixed(0)} ${y.toFixed(0)} q${(r() * 16 - 8).toFixed(0)} ${(-h / 2).toFixed(0)} ${(r() * 10 - 5).toFixed(0)} ${(-h).toFixed(0)}" stroke="${p.c3}" stroke-width="3" fill="none" opacity=".7"/><ellipse cx="${x.toFixed(0)}" cy="${(y - h).toFixed(0)}" rx="4" ry="13" fill="${p.c2}"/>`;
    }
    return `<circle cx="400" cy="300" r="120" fill="${p.c2}"/>
      <rect y="300" width="800" height="200" fill="${p.c1}" opacity=".75"/><rect y="300" width="800" height="26" fill="${p.c3}" opacity=".35"/>
      <rect y="250" width="800" height="50" fill="${p.bg}" opacity=".55"/>
      ${[[120, 470, 70], [250, 430, 56], [370, 400, 46], [470, 380, 38], [550, 366, 30], [610, 356, 24]].map(([x, y, w]) => `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${(w / 3.4).toFixed(0)}" fill="${p.c3}"/>`).join('')}${reeds}`;
  },
  // 7 - effort on one pan, optimism on the other, level
  scales: (p) => `<circle cx="400" cy="170" r="150" fill="${p.c2}" opacity=".12"/>
      <rect x="392" y="120" width="16" height="300" fill="${p.c3}"/><rect x="320" y="416" width="160" height="22" rx="6" fill="${p.c3}"/>
      <rect x="150" y="150" width="500" height="12" rx="6" fill="${p.c3}"/><circle cx="400" cy="140" r="20" fill="${p.c2}"/>
      <path d="M180 162 L120 300 M180 162 L240 300 M620 162 L560 300 M620 162 L680 300" stroke="${p.c3}" stroke-width="3"/>
      <path d="M100 300 H260 Q250 346 180 346 Q110 346 100 300Z" fill="${p.c1}"/><path d="M540 300 H700 Q690 346 620 346 Q550 346 540 300Z" fill="${p.c1}"/>
      <ellipse cx="150" cy="286" rx="30" ry="16" fill="${p.ink}"/><ellipse cx="206" cy="288" rx="32" ry="14" fill="${p.ink}" opacity=".85"/><ellipse cx="178" cy="262" rx="28" ry="14" fill="${p.ink}"/>
      <circle cx="620" cy="258" r="36" fill="${p.c2}"/>${rays(620, 258, 48, 62, 9, p.c2, 5)}`,
  // 8 - take the wheel, the day follows
  wheel: (p) => {
    let sp = '';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      sp += `<path d="M${(400 + 40 * Math.cos(a)).toFixed(1)} ${(255 + 40 * Math.sin(a)).toFixed(1)} L${(400 + 190 * Math.cos(a)).toFixed(1)} ${(255 + 190 * Math.sin(a)).toFixed(1)}" stroke="${p.c3}" stroke-width="12" stroke-linecap="round"/><circle cx="${(400 + 204 * Math.cos(a)).toFixed(1)}" cy="${(255 + 204 * Math.sin(a)).toFixed(1)}" r="13" fill="${p.c3}"/>`;
    }
    return `<circle cx="400" cy="330" r="190" fill="${p.c2}"/><rect y="330" width="800" height="170" fill="${p.c1}" opacity=".85"/>
      ${[345, 372, 402, 436, 474].map((y, i) => `<path d="M0 ${y} Q100 ${y - 10} 200 ${y} T400 ${y} T600 ${y} T800 ${y}" stroke="${p.c3}" stroke-width="3" fill="none" opacity="${(0.5 - i * 0.07).toFixed(2)}"/>`).join('')}
      <circle cx="400" cy="255" r="170" fill="none" stroke="${p.c3}" stroke-width="16"/>${sp}
      <circle cx="400" cy="255" r="44" fill="${p.c3}"/><circle cx="400" cy="255" r="16" fill="${p.ink}"/>`;
  },
  // 9 - hit the bull, forget the bull's-eye
  target: (p) => `${[190, 150, 112, 74].map((r, i) => `<circle cx="500" cy="255" r="${r}" fill="${i % 2 ? p.c1 : p.c3}"/>`).join('')}<circle cx="500" cy="255" r="34" fill="${p.c2}"/><circle cx="500" cy="255" r="8" fill="${p.ink}"/>
      <path d="M90 90 L538 300" stroke="${p.c3}" stroke-width="7" stroke-linecap="round"/>
      <path d="M90 90 l44 6 l-36 22Z M70 110 l46 6 l-40 20Z" fill="${p.c2}"/><path d="M538 300 l-14 -26 l30 14Z" fill="${p.ink}"/>
      <path d="M0 450 Q200 400 400 450 T800 450 V500 H0Z" fill="${p.ink}" opacity=".45"/>`,
  // 10 - pull the hesitation out by the root
  sapling: (p) => `<rect y="300" width="800" height="200" fill="${p.ink}" opacity=".75"/><rect y="296" width="800" height="14" fill="${p.c1}"/>
      <path d="M400 300 V170" stroke="${p.c3}" stroke-width="12" stroke-linecap="round"/>
      <path d="M400 210 C 330 210 320 150 330 130 C 390 130 400 170 400 210Z M400 190 C 470 190 485 120 470 100 C 410 105 400 150 400 190Z" fill="${p.c1}"/><path d="M400 245 C 350 245 340 205 348 190 C 390 195 400 215 400 245Z" fill="${p.c2}"/>
      <g stroke="${p.c3}" stroke-width="5" fill="none" stroke-linecap="round"><path d="M400 300 Q380 350 330 380 Q300 395 270 440"/><path d="M400 300 Q420 360 470 395 Q500 415 540 450"/><path d="M400 300 Q400 380 392 460"/><path d="M360 345 Q320 345 290 330"/><path d="M440 350 Q480 345 520 360"/></g>
      <g transform="translate(610 170) rotate(18)"><rect x="-6" y="0" width="12" height="150" fill="${p.c3}"/><path d="M-30 150 L30 150 L22 215 L-22 215Z" fill="${p.c2}"/></g>`,
  // 11 - go and collect the stories
  road: (p) => `<circle cx="560" cy="150" r="64" fill="${p.c2}"/>${stars(p, 21, 12, 100)}
      <path d="M0 340 L150 190 L260 290 L400 130 L560 300 L680 220 L800 330 V500 H0Z" fill="${p.c1}"/>
      <path d="M400 130 L360 180 L392 172 L410 194 L430 168 L455 182Z" fill="${p.c3}"/><path d="M150 190 L124 222 L146 214 L160 230 L176 212Z" fill="${p.c3}" opacity=".9"/>
      <path d="M0 400 L180 300 L330 380 L520 310 L800 420 V500 H0Z" fill="${p.bg}" opacity=".9"/>
      <path d="M330 520 Q250 450 360 420 T440 355 T410 310" stroke="${p.c3}" stroke-width="22" fill="none" stroke-linecap="round" opacity=".92"/>
      <path d="M330 520 Q250 450 360 420 T440 355 T410 310" stroke="${p.ink}" stroke-width="3" stroke-dasharray="14 12" fill="none"/>
      <g transform="translate(655 395)"><circle r="30" fill="none" stroke="${p.c3}" stroke-width="4"/><path d="M0 -24 L7 0 L0 24 L-7 0Z" fill="${p.c2}"/><path d="M-24 0 L0 -6 L24 0 L0 6Z" fill="${p.c3}" opacity=".6"/></g>`,
  // 12 - a hard climb is a good problem
  climb: (p) => `<circle cx="680" cy="110" r="52" fill="${p.c2}" opacity=".9"/>
      <path d="M0 500 L0 400 L170 300 L300 340 L520 120 L800 330 V500Z" fill="${p.c1}"/><path d="M520 120 L470 170 L505 162 L525 190 L548 160 L580 175Z" fill="${p.c3}"/>
      <path d="M60 470 L150 440 L220 405 L330 400 L380 345 L450 300 L480 235 L520 130" stroke="${p.c3}" stroke-width="8" fill="none" stroke-dasharray="3 14" stroke-linecap="round"/>
      <circle cx="200" cy="425" r="30" fill="${p.ink}"/><circle cx="340" cy="388" r="22" fill="${p.ink}"/><circle cx="440" cy="305" r="16" fill="${p.ink}"/>
      <path d="M520 130 V60" stroke="${p.c3}" stroke-width="5"/><path d="M520 60 L580 78 L520 98Z" fill="${p.c2}"/>
      ${person(398, 346, 0.55, p.c3)}<path d="M0 500 L0 460 L180 480 L400 450 L800 485 V500Z" fill="${p.ink}" opacity=".55"/>`,
  // 13 - alone is not lonely
  hill: (p) => `${stars(p, 31, 40, 260)}<circle cx="620" cy="130" r="108" fill="${p.c3}" opacity=".12"/><circle cx="620" cy="130" r="78" fill="${p.c3}"/>
      <path d="M0 380 Q180 290 360 340 T800 330 V500 H0Z" fill="${p.ink}" opacity=".9"/>
      <path d="M430 400 Q600 330 800 380 V500 H430Z" fill="${p.ink}"/>
      ${Array.from({ length: 11 }, (_, i) => `<rect x="${560 + (i % 6) * 24}" y="${400 + Math.floor(i / 6) * 22}" width="9" height="11" fill="${p.c2}" opacity="${(0.55 + (i % 3) * 0.15).toFixed(2)}"/>`).join('')}
      <g transform="translate(205 340)"><circle cy="-34" r="12" fill="${p.c3}"/><path d="M-18 6 Q-20 -24 0 -24 Q20 -24 18 6Z" fill="${p.c3}"/></g>`,
  // 14 - oranges belong in the orange field
  orchard: (p) => {
    const tree = (x, y, s, fruit, op = 1) => `<g transform="translate(${x} ${y}) scale(${s})" opacity="${op}"><rect x="-7" y="-10" width="14" height="70" fill="${p.ink}"/><circle cy="-60" r="62" fill="${p.c1}"/>${fruit ? [[-30, -70], [20, -90], [32, -48], [-8, -42], [-40, -38], [4, -72]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="9" fill="${p.c2}"/>`).join('') : ''}</g>`;
    let paddy = '';
    for (let i = 0; i < 9; i++) paddy += `<path d="M0 ${340 + i * 18} H400" stroke="${p.c3}" stroke-width="2" stroke-dasharray="3 7" opacity=".5"/>`;
    return `<rect y="330" width="400" height="170" fill="${p.c1}" opacity=".55"/>${paddy}
      ${tree(200, 420, 1.1, false, 0.9)}
      <rect x="400" y="330" width="400" height="170" fill="${p.ink}" opacity=".5"/>
      ${tree(480, 400, 0.75, true)}${tree(600, 420, 0.95, true)}${tree(725, 400, 0.75, true)}
      <path d="M400 0 V500" stroke="${p.c3}" stroke-width="3" stroke-dasharray="8 9" opacity=".7"/>
      <circle cx="200" cy="90" r="40" fill="${p.c3}" opacity=".8"/><circle cx="600" cy="90" r="40" fill="${p.c2}"/>`;
  },
  // 15 - the horse-chariot, the tablet, the sun
  chariot: (p) => {
    const horse = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})" fill="${p.c3}"><ellipse cx="0" cy="0" rx="78" ry="34"/><path d="M52 -14 L98 -86 L128 -78 L120 -52 L162 -34 L158 -16 L104 -20 L72 12Z"/><path d="M-72 -12 Q-120 6 -128 70 Q-100 20 -66 12Z"/><path d="M-50 20 L-56 96 M-26 24 L-24 96 M36 24 L42 96 M58 14 L84 88" stroke="${p.c3}" stroke-width="9" stroke-linecap="round" fill="none"/><path d="M98 -86 L92 -112 L110 -90Z"/></g>`;
    return `<circle cx="560" cy="230" r="200" fill="${p.c2}" opacity=".95"/>
      ${horse(470, 285, 0.95)}${horse(420, 300, 0.95)}
      <path d="M230 290 L405 285" stroke="${p.ink}" stroke-width="6"/>
      <path d="M130 235 H235 V318 H110Z" fill="${p.ink}"/><circle cx="170" cy="330" r="52" fill="none" stroke="${p.ink}" stroke-width="10"/>${[0, 45, 90, 135].map((a) => `<path d="M${(170 + 50 * Math.cos((a * Math.PI) / 180)).toFixed(1)} ${(330 + 50 * Math.sin((a * Math.PI) / 180)).toFixed(1)} L${(170 - 50 * Math.cos((a * Math.PI) / 180)).toFixed(1)} ${(330 - 50 * Math.sin((a * Math.PI) / 180)).toFixed(1)}" stroke="${p.ink}" stroke-width="5"/>`).join('')}
      <rect y="395" width="800" height="105" fill="${p.ink}" opacity=".75"/>
      <rect x="470" y="418" width="250" height="60" rx="6" fill="${p.c3}" opacity=".95"/>${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<path d="M${488 + i * 29} 432 l12 0 l-6 16Z M${488 + i * 29} 456 l12 0 l-12 14Z" fill="${p.ink}"/>`).join('')}`;
  },
  // 16 - the lamp: urge becomes light
  diya: (p) => `${stars(p, 41, 30, 220)}${[210, 160, 112].map((r, i) => `<circle cx="400" cy="250" r="${r}" fill="${p.c2}" opacity="${(0.05 + i * 0.05).toFixed(2)}"/>`).join('')}
      <path d="M400 70 C 470 160 480 230 440 290 C 425 270 412 262 400 266 C 388 262 375 270 360 290 C 320 230 330 160 400 70Z" fill="${p.c2}"/>
      <path d="M400 150 C 440 200 440 252 400 290 C 360 252 360 200 400 150Z" fill="${p.c3}"/>
      <path d="M190 330 Q400 300 610 330 Q590 430 400 440 Q210 430 190 330Z" fill="${p.c1}"/><path d="M190 330 Q400 372 610 330 Q400 316 190 330Z" fill="${p.ink}" opacity=".45"/>
      <path d="M170 322 Q140 322 150 350 Q165 352 190 338Z" fill="${p.c1}"/><rect x="330" y="440" width="140" height="24" rx="8" fill="${p.c1}"/>
      ${[[160, 130], [650, 160], [230, 60], [580, 70], [700, 280], [100, 260]].map(([x, y]) => `<path d="M${x} ${y - 9} L${x + 3} ${y - 3} L${x + 9} ${y} L${x + 3} ${y + 3} L${x} ${y + 9} L${x - 3} ${y + 3} L${x - 9} ${y} L${x - 3} ${y - 3}Z" fill="${p.c3}" opacity=".85"/>`).join('')}`,
  // 17 - you and the one in the water
  mirror: (p) => `<rect y="270" width="800" height="230" fill="${p.ink}" opacity=".6"/><circle cx="560" cy="110" r="56" fill="${p.c2}"/><circle cx="560" cy="430" r="56" fill="${p.c2}" opacity=".5"/>
      <path d="M180 270 L330 90 L480 270Z" fill="${p.c1}"/><path d="M180 270 L330 450 L480 270Z" fill="${p.c1}" opacity=".5"/>
      <path d="M330 90 L300 128 L324 122 L338 140 L350 120 L372 130Z" fill="${p.c3}"/>
      ${person(330, 92, 0.8, p.c3)}<path d="M346 38 V6 L378 18 L346 30Z" stroke="${p.c2}" stroke-width="3" fill="${p.c2}"/>
      <g transform="translate(0 540) scale(1 -1)">${person(330, 92, 0.8, p.c3)}</g>
      ${[285, 305, 330, 365, 405].map((y, i) => `<path d="M${120 + i * 14} ${y} Q${220 + i * 6} ${y - 7} 320 ${y} T${520 - i * 14} ${y}" stroke="${p.c3}" stroke-width="3" fill="none" opacity="${(0.45 - i * 0.07).toFixed(2)}"/>`).join('')}
      <path d="M0 270 H800" stroke="${p.c3}" stroke-width="3" opacity=".8"/>`,
  // 18 - the door that stays shut
  door: (p) => `<rect y="400" width="800" height="100" fill="${p.ink}" opacity=".8"/>
      <path d="M300 420 V210 Q300 120 400 120 Q500 120 500 210 V420Z" fill="${p.c1}"/><path d="M322 420 V215 Q322 142 400 142 Q478 142 478 215 V420Z" fill="${p.bg}" opacity=".65"/>
      <path d="M400 142 V420 M322 290 H478" stroke="${p.ink}" stroke-width="5" opacity=".55"/>
      <circle cx="456" cy="320" r="9" fill="${p.c2}"/>
      <path d="M322 420 L296 500 H504 L478 420Z" fill="${p.c2}" opacity=".5"/><rect x="280" y="420" width="240" height="14" fill="${p.c3}" opacity=".85"/>
      <path d="M600 130 V190" stroke="${p.c3}" stroke-width="4"/><path d="M582 190 H618 L612 250 H588Z" fill="${p.c2}"/><circle cx="600" cy="220" r="46" fill="${p.c2}" opacity=".18"/>${stars(p, 7, 14, 110)}`,
  // 19 - never fifty-fifty
  seesaw: (p) => `<circle cx="400" cy="130" r="48" fill="${p.c2}" opacity=".9"/>
      <path d="M370 400 L400 300 L430 400Z" fill="${p.c3}"/><rect x="140" y="410" width="520" height="16" rx="8" fill="${p.ink}" opacity=".7"/>
      <g transform="rotate(-9 400 300)"><rect x="100" y="288" width="600" height="18" rx="9" fill="${p.c3}"/>
      <rect x="130" y="188" width="130" height="100" rx="6" fill="${p.c1}"/><rect x="150" y="128" width="90" height="60" rx="6" fill="${p.c1}" opacity=".85"/><rect x="262" y="228" width="80" height="60" rx="6" fill="${p.c1}" opacity=".7"/>
      <rect x="610" y="256" width="44" height="32" rx="5" fill="${p.c2}"/></g>`,
  // 20 - burn the bridge behind you
  bridge: (p) => `<circle cx="640" cy="250" r="110" fill="${p.c2}" opacity=".9"/><rect y="310" width="800" height="190" fill="${p.ink}" opacity=".7"/>
      <path d="M0 330 Q150 250 300 330" stroke="${p.c3}" stroke-width="18" fill="none"/><path d="M0 330 H300" stroke="${p.c3}" stroke-width="10"/>
      ${[20, 60, 100, 140, 180, 220].map((x) => `<path d="M${x} 330 V380" stroke="${p.c3}" stroke-width="6"/>`).join('')}
      <path d="M20 300 C 40 250 70 262 70 214 C 100 250 110 280 100 300Z" fill="${p.c2}"/><path d="M130 300 C 150 244 180 258 176 200 C 214 246 224 276 212 300Z" fill="${p.c2}"/><path d="M240 318 C 255 280 275 284 272 252 C 298 280 302 300 296 318Z" fill="${p.c2}"/>
      <path d="M40 300 C 52 272 66 278 66 252 C 82 276 86 290 80 300Z" fill="${p.c3}"/><path d="M150 300 C 160 270 176 278 174 244 C 192 272 198 288 190 300Z" fill="${p.c3}"/>
      <path d="M300 330 L560 330 L800 360" stroke="${p.c1}" stroke-width="20" fill="none"/><path d="M330 330 L800 360" stroke="${p.c3}" stroke-width="3" stroke-dasharray="14 14" fill="none"/>
      ${person(540, 330, 0.9, p.c3)}${stars(p, 13, 14, 120)}`,

  // 21 - the loom itself
  loom: (p) => `<circle cx="640" cy="120" r="46" fill="${p.c2}" opacity=".9"/>
      <rect x="150" y="50" width="26" height="410" fill="${p.c3}"/><rect x="624" y="50" width="26" height="410" fill="${p.c3}"/>
      <rect x="150" y="50" width="500" height="26" rx="4" fill="${p.c3}"/><rect x="150" y="434" width="500" height="26" rx="4" fill="${p.c3}"/>
      ${Array.from({ length: 19 }, (_, i) => `<path d="M${196 + i * 22} 76 V434" stroke="${p.c1}" stroke-width="3"/>`).join('')}
      ${Array.from({ length: 7 }, (_, i) => `<path d="M186 ${396 - i * 15} H614" stroke="${p.c2}" stroke-width="9" stroke-dasharray="${i % 2 ? '22 22' : '22 22'}" stroke-dashoffset="${i % 2 ? 0 : 22}" opacity=".95"/>`).join('')}
      <g transform="rotate(-12 400 250)"><ellipse cx="400" cy="250" rx="62" ry="15" fill="${p.c3}"/><path d="M350 250 H450" stroke="${p.c2}" stroke-width="5"/></g>
      <path d="M338 262 Q250 300 200 290" stroke="${p.c2}" stroke-width="4" fill="none"/>`,
  // 22 - the slow hour
  hourglass: (p) => `${stars(p, 51, 22, 140)}<circle cx="400" cy="250" r="190" fill="${p.c2}" opacity=".1"/>
      <rect x="270" y="60" width="260" height="22" rx="6" fill="${p.c3}"/><rect x="270" y="418" width="260" height="22" rx="6" fill="${p.c3}"/>
      <path d="M290 82 H510 Q510 190 410 250 Q510 310 510 418 H290 Q290 310 390 250 Q290 190 290 82Z" fill="${p.c3}" opacity=".18" stroke="${p.c3}" stroke-width="5"/>
      <path d="M330 100 H470 Q460 160 400 200 Q340 160 330 100Z" fill="${p.c2}"/><path d="M400 200 V380" stroke="${p.c2}" stroke-width="4"/>
      <path d="M300 418 Q400 330 500 418Z" fill="${p.c2}"/>`,
  // 23 - hold a steady light
  lighthouse: (p) => `${stars(p, 61, 30, 220)}
      <path d="M400 150 L800 70 L800 230Z" fill="${p.c2}" opacity=".22"/><path d="M400 150 L0 70 L0 230Z" fill="${p.c2}" opacity=".14"/>
      <path d="M355 440 L375 190 H425 L445 440Z" fill="${p.c3}"/><path d="M365 330 L435 330 L440 380 L360 380Z M371 250 H429 L432 285 H368Z" fill="${p.c1}"/>
      <rect x="360" y="165" width="80" height="26" fill="${p.ink}"/><circle cx="400" cy="150" r="22" fill="${p.c2}"/><path d="M372 128 H428 L400 100Z" fill="${p.ink}"/>
      <rect y="430" width="800" height="70" fill="${p.c1}" opacity=".8"/>${[445, 465, 485].map((y, i) => `<path d="M0 ${y} Q100 ${y - 8} 200 ${y} T400 ${y} T600 ${y} T800 ${y}" stroke="${p.c3}" stroke-width="3" fill="none" opacity="${(0.5 - i * 0.12).toFixed(2)}"/>`).join('')}
      <path d="M300 440 Q400 410 500 440Z" fill="${p.ink}"/>`,
  // 24 - books and a rising light
  books: (p) => `${rays(400, 150, 80, 130, 14, p.c2, 4, 0.5)}<circle cx="400" cy="150" r="58" fill="${p.c2}"/>
      <rect x="230" y="380" width="340" height="44" rx="4" fill="${p.c3}"/><rect x="230" y="380" width="340" height="12" fill="${p.c1}" opacity=".85"/>
      <rect x="260" y="332" width="290" height="48" rx="4" fill="${p.c1}"/><rect x="270" y="342" width="270" height="6" fill="${p.c3}" opacity=".7"/>
      <rect x="290" y="288" width="240" height="44" rx="4" fill="${p.c3}"/><rect x="290" y="288" width="240" height="10" fill="${p.ink}" opacity=".5"/>
      <path d="M330 288 Q400 232 470 288 Q400 262 330 288Z" fill="${p.c1}"/><path d="M0 440 H800 V500 H0Z" fill="${p.ink}" opacity=".5"/>`,
  // 25 - keep moving, like water
  river: (p) => `<circle cx="150" cy="110" r="52" fill="${p.c2}"/>
      <path d="M0 300 Q140 200 260 270 T520 250 T800 230 V500 H0Z" fill="${p.c1}"/><path d="M0 360 Q160 290 300 350 T560 330 T800 320 V500 H0Z" fill="${p.ink}" opacity=".55"/>
      <path d="M420 500 Q330 430 440 390 T520 330 T560 270 T610 235" stroke="${p.c3}" stroke-width="46" fill="none" stroke-linecap="round" opacity=".92"/>
      <path d="M420 500 Q330 430 440 390 T520 330 T560 270 T610 235" stroke="${p.bg}" stroke-width="2" stroke-dasharray="3 16" fill="none" opacity=".6"/>
      <path d="M462 366 H526 L514 386 H474Z" fill="${p.c2}"/><path d="M494 366 V322 L526 360Z" fill="${p.c3}"/>`,
  // 26 - deep roots, wide shade
  tree: (p) => `<circle cx="600" cy="110" r="46" fill="${p.c2}"/>${stars(p, 71, 10, 90)}
      <rect y="360" width="800" height="140" fill="${p.ink}" opacity=".7"/>
      <path d="M385 370 Q392 270 372 200 L428 200 Q408 270 415 370Z" fill="${p.c3}"/>
      ${[[400, 150, 120], [310, 190, 90], [490, 190, 90], [350, 120, 70], [450, 120, 70]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${p.c1}"/>`).join('')}
      <g stroke="${p.c3}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"><path d="M400 372 Q350 420 300 430 Q260 436 220 470"/><path d="M400 372 Q450 420 500 430 Q540 436 580 470"/><path d="M400 372 Q398 430 404 490"/></g>
      ${[[170, 130], [215, 105], [250, 140]].map(([x, y]) => `<path d="M${x - 14} ${y} q14 -14 14 0 q0 -14 14 0" stroke="${p.c3}" stroke-width="3" fill="none"/>`).join('')}`,
  // 27 - the pen
  feather: (p) => `${stars(p, 81, 24, 500)}<circle cx="620" cy="120" r="70" fill="${p.c2}" opacity=".18"/>
      <path d="M170 420 C 230 300 330 180 560 80 C 540 190 470 310 330 390 C 280 410 230 420 170 420Z" fill="${p.c3}"/>
      <path d="M170 420 C 270 320 380 210 560 80" stroke="${p.ink}" stroke-width="5" fill="none" opacity=".7"/>
      ${Array.from({ length: 9 }, (_, i) => `<path d="M${230 + i * 36} ${360 - i * 30} l${40 - i * 2} 34" stroke="${p.c1}" stroke-width="3" opacity=".7"/>`).join('')}
      <path d="M150 440 L170 420" stroke="${p.c3}" stroke-width="6" stroke-linecap="round"/><rect x="560" y="400" width="120" height="70" rx="12" fill="${p.ink}"/><rect x="590" y="384" width="60" height="22" rx="4" fill="${p.c2}"/>
      <path d="M120 470 q40 -20 90 -4 t90 -2" stroke="${p.c2}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  // 28 - know your direction
  compass: (p) => `${stars(p, 91, 18, 120)}<circle cx="400" cy="250" r="196" fill="${p.c3}"/><circle cx="400" cy="250" r="176" fill="${p.bg}"/>
      ${Array.from({ length: 36 }, (_, i) => { const a = (i / 36) * Math.PI * 2, r1 = i % 3 ? 164 : 154; return `<path d="M${(400 + r1 * Math.cos(a)).toFixed(1)} ${(250 + r1 * Math.sin(a)).toFixed(1)} L${(400 + 172 * Math.cos(a)).toFixed(1)} ${(250 + 172 * Math.sin(a)).toFixed(1)}" stroke="${p.c3}" stroke-width="3"/>`; }).join('')}
      <path d="M400 80 L430 250 L400 420 L370 250Z" fill="${p.c1}" opacity=".5"/><path d="M230 250 L400 220 L570 250 L400 280Z" fill="${p.c1}" opacity=".5"/>
      <g transform="rotate(35 400 250)"><path d="M400 100 L424 250 L376 250Z" fill="${p.c2}"/><path d="M400 400 L424 250 L376 250Z" fill="${p.c3}"/></g><circle cx="400" cy="250" r="14" fill="${p.ink}"/><circle cx="400" cy="250" r="5" fill="${p.c2}"/>`,
  // 29 - begin again at dawn
  sunrise: (p) => `${rays(400, 330, 130, 330, 22, p.c2, 6, 0.22)}<circle cx="400" cy="330" r="116" fill="${p.c2}"/>
      <rect y="330" width="800" height="170" fill="${p.c1}" opacity=".85"/>${[345, 368, 395, 428, 466].map((y, i) => `<path d="M${320 - i * 40} ${y} H${480 + i * 40}" stroke="${p.c2}" stroke-width="${4 + i}" opacity="${(0.7 - i * 0.12).toFixed(2)}" stroke-linecap="round"/>`).join('')}
      <path d="M0 330 L120 250 L210 310 L300 330Z M520 330 L640 230 L720 290 L800 330Z" fill="${p.ink}" opacity=".85"/>
      ${[[170, 150], [250, 110], [600, 130], [660, 90]].map(([x, y]) => `<path d="M${x - 14} ${y} q14 -12 14 0 q0 -12 14 0" stroke="${p.c3}" stroke-width="3" fill="none"/>`).join('')}`,
  // 30 - let it fly, hold the string
  kite: (p) => `<circle cx="140" cy="110" r="44" fill="${p.c2}" opacity=".85"/><ellipse cx="560" cy="110" rx="70" ry="20" fill="${p.c3}" opacity=".35"/><ellipse cx="620" cy="95" rx="50" ry="16" fill="${p.c3}" opacity=".3"/>
      <path d="M0 440 Q200 360 420 420 T800 400 V500 H0Z" fill="${p.ink}" opacity=".85"/>
      <path d="M520 150 L600 220 L520 330 L440 220Z" fill="${p.c2}"/><path d="M520 150 V330 M440 220 H600" stroke="${p.ink}" stroke-width="3" opacity=".6"/><path d="M520 150 L600 220 L520 220Z" fill="${p.c3}" opacity=".5"/>
      <path d="M520 330 Q500 360 520 380 T500 430 T520 470" stroke="${p.c3}" stroke-width="4" fill="none"/>${[[510, 365], [512, 398], [510, 438]].map(([x, y]) => `<path d="M${x - 12} ${y} L${x + 12} ${y + 10} L${x - 12} ${y + 20}Z" fill="${p.c1}"/>`).join('')}
      <path d="M520 330 Q300 380 230 405" stroke="${p.c3}" stroke-width="2" fill="none" opacity=".7"/>${person(228, 420, 0.75, p.c3)}`,
};

export function sceneSVG(motif, dye, uid = 'a') {
  const p = paletteOf(dye);
  const draw = SCENES[motif] ?? SCENES.pack;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><defs><pattern id="wv-${uid}" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M0 2.5H5" stroke="#fff" stroke-opacity=".07"/><path d="M2.5 0V5" stroke="#000" stroke-opacity=".12"/></pattern></defs><rect width="800" height="500" fill="${p.bg}"/>${draw(p)}<rect width="800" height="500" fill="url(#wv-${uid})"/></svg>`;
}

export const MOTIFS = Object.keys(SCENES);

export const MOTIF_LIST = [
  ['pack', 'Gathered around a fire'], ['lens', 'The sun behind a phone'], ['plains', 'Desert and green plains'],
  ['crossroads', 'A fork: crown and mace'], ['pitcher', 'Water poured to a line'], ['marsh', 'Stepping stones in a marsh'],
  ['scales', 'A balance scale'], ['wheel', "Ship's wheel at sunset"], ['target', 'Arrow and target'],
  ['sapling', 'A sapling and its roots'], ['road', 'Mountain road and compass'], ['climb', 'The climb to a flag'],
  ['hill', 'A lone figure under the moon'], ['orchard', 'Orange trees in two fields'], ['chariot', 'Horse chariot and tablet'],
  ['diya', 'A lamp and its flame'], ['mirror', 'A mountain and its reflection'], ['door', 'A shut door with light'],
  ['seesaw', 'A tilted seesaw'], ['bridge', 'A burning bridge'],
  ['loom', 'The loom itself'], ['hourglass', 'The slow hour'], ['lighthouse', 'A steady light'],
  ['books', 'Books and a rising light'], ['river', 'A river and a small boat'], ['tree', 'Deep roots, wide shade'],
  ['feather', 'The pen and its ink'], ['compass', 'A compass rose'], ['sunrise', 'Dawn over the water'], ['kite', 'A kite and its string'],
];
