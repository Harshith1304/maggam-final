// The four natural dyes the site was first woven from. They are fixed and can never be edited or removed.
// Each category of writing gets one dye; the same palette drives the swatches,
// the illustrations and the downloadable quote cards.
export const DYES = {
  indigo:    { name: 'Indigo',    bg: '#17224F', c1: '#4F6FD8', c2: '#F2B632', c3: '#E8E4D6', ink: '#0A1030', fg: '#E8E4D6' },
  madder:    { name: 'Madder',    bg: '#7A1D2D', c1: '#C8374B', c2: '#F2B632', c3: '#F4E4D4', ink: '#36091A', fg: '#F4E4D4' },
  myrobalan: { name: 'Myrobalan', bg: '#0E4A43', c1: '#2FA08C', c2: '#F29A32', c3: '#E3EADB', ink: '#04241F', fg: '#E3EADB' },
  turmeric:  { name: 'Turmeric',  bg: '#D99A12', c1: '#F7D26B', c2: '#17224F', c3: '#FFF1C9', ink: '#3A2700', fg: '#3A2700' },
};

export const CATEGORIES = [
  { name: 'Discipline',    dye: 'indigo',    line: 'Showing up, habits, fear' },
  { name: 'People',        dye: 'madder',    line: 'Trust, kindness, boundaries' },
  { name: 'Self',          dye: 'myrobalan', line: 'Solitude, drive, comparison' },
  { name: 'Roots & Roads', dye: 'turmeric',  line: 'Dharma, history, wandering' },
];

export const dyeOf = (category) =>
  CATEGORIES.find((c) => c.name === category)?.dye ?? 'indigo';

/* ---------- your own dyes ----------
   You choose one colour; the rest of the palette is worked out from it, and checked so the text on top
   always reads clearly. A custom dye is addressed as "c-rrggbb". */
const clampN = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function hexToHsl(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
  }
  return { h: Math.round((h * 60 + 360) % 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}
export function hslToHex(h, s, l) {
  s = clampN(s, 0, 100) / 100; l = clampN(l, 0, 100) / 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return '#' + [f(0), f(8), f(4)].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
}
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
export const luminance = (hex) => { const [r, g, b] = hexToRgb(hex); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
export const contrast = (a, b) => { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

const palettes = new Map();
export function paletteFrom(hex) {
  hex = hex.toLowerCase();
  if (palettes.has(hex)) return palettes.get(hex);
  const orig = hexToHsl(hex);
  let { h, s, l } = orig;
  let adjusted = false; // the picked colour is used exactly, unless it has to be nudged for readability
  const lightText = hslToHex(h, Math.min(s, 28), 93);
  const darkText = hslToHex(h, Math.min(s, 55), 8);
  // dark dyes carry light text, light dyes carry dark text; if the chosen shade sits too close to the
  // middle for either, it is nudged a little until the text is comfortably readable
  let bg = hex, mode = null;
  for (let i = 0; i < 40 && !mode; i++) {
    bg = adjusted ? hslToHex(h, s, l) : hex;
    const cl = contrast(bg, lightText), cd = contrast(bg, darkText);
    if (cl >= 4.5 && cl >= cd) mode = 'dark';
    else if (cd >= 4.5) mode = 'light';
    else { l += luminance(bg) < 0.19 ? -2 : 2; adjusted = true; }
  }
  if (!mode) mode = luminance(bg) < 0.19 ? 'dark' : 'light';

  const p = mode === 'dark'
    ? { bg, c1: hslToHex(h, Math.min(s + 8, 92), clampN(l + 26, 50, 64)), c2: '#F2B632', c3: lightText, ink: hslToHex(h, Math.min(s, 60), 6) }
    : { bg, c1: hslToHex(h, Math.min(s + 10, 95), clampN(l + 16, 40, 88)), c2: hslToHex(h, Math.min(s + 10, 85), 16), c3: hslToHex(h, Math.min(s + 20, 95), 94), ink: darkText };
  p.name = 'Custom';
  p.fg = mode === 'dark' ? p.c3 : p.ink;
  palettes.set(hex, p);
  return p;
}

export const dyeKeyForHex = (hex) => 'c-' + hex.replace('#', '').toLowerCase();
/** The palette for any dye key: one of the four built-ins, or "c-rrggbb" for your own. */
export function paletteOf(dye) {
  if (DYES[dye]) return DYES[dye];
  const m = /^c-([0-9a-f]{6})$/.exec(dye || '');
  return m ? paletteFrom('#' + m[1]) : DYES.indigo;
}

/** Built-in themes first, then any custom theme that threads actually use. */
export function themesInUse(threads) {
  const out = CATEGORIES.map((c) => ({ name: c.name, dye: c.dye, line: c.line, builtin: true }));
  for (const t of threads) {
    if (t.dye?.startsWith('c-') && !out.some((o) => o.name === t.category)) out.push({ name: t.category, dye: t.dye, builtin: false });
  }
  return out;
}
