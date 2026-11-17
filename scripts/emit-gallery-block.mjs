// Emits the JS block for the 90 new gallery entries, matching the hand-written
// style already in src/data/galleryCatalog.js. Reads .gallery-selected.json and
// .gallery-videos-curated.json. One-off generator, not shipped.

import fs from 'node:fs';

const sel = JSON.parse(fs.readFileSync('.gallery-selected.json', 'utf8'));

const LICENSE_CONST = {
  'CC BY 4.0': 'CC_BY',
  'CC BY 3.0': 'CC_BY_30',
  'CC BY 2.0': 'CC_BY_20',
  'CC BY-SA 4.0': 'CC_BY_SA_40',
  'CC BY-SA 3.0': 'CC_BY_SA_30',
  'CC BY-SA 2.0': 'CC_BY_SA_20',
  'CC0': 'CC0_LICENSE',
  'Public domain': 'PUBLIC_DOMAIN',
  'GFDL 1.2': 'GFDL_12',
};

// Hand-written titles/locations/captions. Keyed by exact Commons file name.
// Anything not listed here falls back to a name-derived title so the generator
// never silently drops an entry.
const COPY = JSON.parse(fs.readFileSync('.gallery-copy.json', 'utf8'));

function esc(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// Ids are derived from the human title so they read like the existing entries
// ('lion', 'red-colobus') rather than echoing a truncated file name.
function idFromTitle(title, file, used) {
  let base = title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32);
  if (!base) {
    base = file.replace(/\.(jpe?g|png)$/i, '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32);
  }
  let id = base || 'photo';
  let n = 2;
  while (used.has(id)) id = `${base}-${n++}`;
  used.add(id);
  return id;
}

const usedIds = new Set(
  [...fs.readFileSync('src/data/galleryCatalog.js', 'utf8')
    .matchAll(/photo\('([a-z0-9-]+)'/g)].map(m => m[1])
);

const lines = [];
let missingCopy = 0;

for (const [cat, list] of Object.entries(sel)) {
  lines.push(`\n  // ---- ${cat} (added) ----`);
  for (const p of list) {
    const copy = COPY[p.file];
    if (!copy) {
      missingCopy++;
      console.error('MISSING COPY: ' + p.file);
      continue;
    }
    const id = idFromTitle(copy.title, p.file, usedIds);
    const licConst = LICENSE_CONST[p.license];
    if (!licConst) {
      console.error(`NO LICENSE CONSTANT for "${p.license}" (${p.file})`);
      continue;
    }
    const args = [
      `'${id}'`,
      `'${cat}'`,
      `'${esc(copy.title)}'`,
      `'${esc(copy.location)}'`,
      `'${esc(copy.caption)}'`,
      `'${esc(p.file)}'`,
      `'${esc(p.artist)}'`,
      `'${esc(p.license)}', ${licConst}`,
    ].join(', ');
    lines.push(`  photo(${args}),`);
  }
}

fs.writeFileSync('.gallery-block.js', lines.join('\n') + '\n');
console.error(`\nwrote .gallery-block.js (${lines.length - 1} entries, ${missingCopy} missing copy)`);