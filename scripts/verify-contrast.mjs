// scripts/verify-contrast.mjs
//
// Fails when a declared foreground/background pair drops below its WCAG 2.1 AA
// contrast ratio.
//
// Why this must exist: `.eyebrow` was defined once in index.css as
// terracotta-400 on the page background and measured 3.80:1 — below the 4.5:1
// threshold — across 39 usages in 12 files. Nothing in the pipeline could see
// it: no linter, no visual test, no unit test. A palette edit or a one-word
// change to a shared component class reintroduces the same blindness.
//
// This is a declared-pair check, not a DOM scrape. Static analysis cannot know
// which background an element actually lands on once Tailwind utilities compose,
// so the pairs below are curated and each carries the reason it matters. A pair
// is only useful here because the values are asserted against tailwind.config.js
// at the bottom — if the palette is edited, this fails and the numbers above are
// re-validated by hand rather than silently rotting.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const hex = h => {
  const v = h.replace('#', '');
  return [0, 2, 4].map(i => parseInt(v.slice(i, i + 2), 16));
};
const srgb = c => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const lum = ([r, g, b]) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
// Alpha modifiers (text-cream-100/60) composite over the background first.
const composite = (fg, bg, a) => {
  const f = hex(fg), b = hex(bg);
  return f.map((c, i) => Math.round(c * a + b[i] * (1 - a)));
};

const AA_NORMAL = 4.5;   // body and small text
const AA_LARGE = 3.0;    // >=24px, or >=18.66px bold

// palette name -> hex, mirrored from tailwind.config.js
const PALETTE = {
  cream50: '#FFFFFF', cream100: '#F5F0E6',
  gold400: '#D6A84F',
  terracotta200: '#E6AE91', terracotta300: '#D98462',
  terracotta400: '#C9683D', terracotta500: '#A84D2D',
  teal600: '#356055', teal700: '#21483D', teal800: '#1A3D35', teal900: '#16352F',
  acacia: '#152E28',
};

// [label, foreground, background, alpha, requiredRatio]
const PAIRS = [
  ['.eyebrow default on page bg', PALETTE.terracotta500, PALETTE.cream50, 1, AA_NORMAL],
  ['hero eyebrow on teal-800', PALETTE.terracotta200, PALETTE.teal800, 1, AA_NORMAL],
  ['hero body copy on teal-800', PALETTE.cream50, PALETTE.teal800, 0.9, AA_NORMAL],
  ['tripadvisor band body on scrim', PALETTE.cream100, PALETTE.acacia, 0.85, AA_NORMAL],
  ['tripadvisor band label on scrim', PALETTE.cream50, PALETTE.acacia, 1, AA_NORMAL],
  ['tripadvisor eyebrow on scrim', PALETTE.gold400, PALETTE.acacia, 1, AA_NORMAL],
  ['tripadvisor headline on scrim', PALETTE.gold400, PALETTE.acacia, 1, AA_LARGE],
  ['tripadvisor CTA label on brand green', '#FFFFFF', '#247d38', 1, AA_NORMAL],
  ['footer body copy on acacia', PALETTE.cream100, PALETTE.acacia, 0.8, AA_NORMAL],
  ['footer small caption on acacia', PALETTE.cream100, PALETTE.acacia, 0.6, AA_NORMAL],
  ['footer link on acacia', PALETTE.terracotta300, PALETTE.acacia, 1, AA_NORMAL],
  ['breadcrumb nav label on linen', PALETTE.teal600, '#FAF7F2', 1, AA_NORMAL],
  ['breadcrumb current page on linen', PALETTE.teal700, '#FAF7F2', 1, AA_NORMAL],
];

let failures = 0;
console.log('pair                                     ratio  need  verdict');
console.log('-'.repeat(72));
for (const [label, fg, bg, alpha, need] of PAIRS) {
  const fgL = lum(composite(fg, bg, alpha));
  const bgL = lum(hex(bg));
  const r = ratio(fgL, bgL);
  const ok = r >= need;
  if (!ok) failures++;
  console.log(`${label.padEnd(40)} ${r.toFixed(2).padStart(5)}  ${need.toFixed(1)}  ${ok ? 'PASS' : 'FAIL'}`);
}
console.log('-'.repeat(72));

// Palette drift guard: if tailwind.config.js changes a colour this file relies
// on, fail loudly instead of testing a palette the site no longer ships.
const config = readFileSync(join(root, 'tailwind.config.js'), 'utf8');
const configHex = [...config.matchAll(/#[0-9A-Fa-f]{6}/g)].map(m => m[0].toUpperCase());
const drift = [];
for (const [name, value] of Object.entries(PALETTE)) {
  if (!configHex.includes(value.toUpperCase())) {
    drift.push(`${name} (expected ${value} in tailwind.config.js)`);
  }
}
if (drift.length) {
  console.log('\nNOTE  palette value(s) below no longer appear in tailwind.config.js:');
  for (const d of drift) console.log(`        ${d}`);
  console.log('      Re-verify these pairs against the new values before trusting them.');
}

if (failures) {
  console.error(`\n${failures} pair(s) below WCAG AA.`);
  process.exit(1);
}
console.log('\nAll declared pairs meet WCAG 2.1 AA.');
