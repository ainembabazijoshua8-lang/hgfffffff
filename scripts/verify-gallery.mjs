import { GALLERY_ITEMS, GALLERY_CATEGORIES, GALLERY_PHOTOS, GALLERY_VIDEOS } from '../src/data/galleryCatalog.js';

const fail = [];
const ok = m => console.log('  PASS ' + m);

console.log('counts:');
console.log('  photos', GALLERY_PHOTOS.length, 'videos', GALLERY_VIDEOS.length, 'total', GALLERY_ITEMS.length);
console.log('  per category:');
for (const c of GALLERY_CATEGORIES) {
  const n = GALLERY_ITEMS.filter(p => p.category === c.id).length;
  console.log(`    ${c.id.padEnd(10)} ${n}`);
  if (n === 0) fail.push(`category ${c.id} has no items`);
}

const ids = GALLERY_ITEMS.map(p => p.id);
const dupIds = ids.filter((v, i) => ids.indexOf(v) !== i);
if (dupIds.length) fail.push('duplicate ids: ' + [...new Set(dupIds)].join(', '));
else ok('all ids unique');

const files = GALLERY_ITEMS.map(p => p.source);
const dupFiles = files.filter((v, i) => files.indexOf(v) !== i);
if (dupFiles.length) fail.push('duplicate source files: ' + [...new Set(dupFiles)].join(', '));
else ok('no duplicate source files');

const titles = GALLERY_ITEMS.map(p => p.title.toLowerCase());
const dupTitles = titles.filter((v, i) => titles.indexOf(v) !== i);
if (dupTitles.length) console.log('  NOTE repeated titles: ' + [...new Set(dupTitles)].join(', '));
else ok('no repeated titles');

for (const p of GALLERY_ITEMS) {
  if (!p.licenseUrl) fail.push(`${p.id}: missing licenseUrl`);
  if (!p.credit) fail.push(`${p.id}: missing credit`);
  if (!p.caption || !p.location) fail.push(`${p.id}: missing caption/location`);
  if (p.type === 'video' && !p.video) fail.push(`${p.id}: missing video url`);
  if (!p.image) fail.push(`${p.id}: missing image/poster`);
}
if (!fail.some(f => f.includes('missing'))) ok('every item has image, caption, location, credit and license link');

// Licensing summary
const lic = {};
for (const p of GALLERY_ITEMS) lic[p.license] = (lic[p.license] || 0) + 1;
console.log('\nlicenses in use:');
for (const [k, v] of Object.entries(lic).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(14)} ${v}`);

// Subject coverage for wildlife
const wl = GALLERY_ITEMS.filter(p => p.category === 'wildlife');
console.log(`\nwildlife entries: ${wl.length}`);
console.log(`parks entries:    ${GALLERY_ITEMS.filter(p => p.category === 'parks').length}`);
console.log(`zanzibar entries: ${GALLERY_ITEMS.filter(p => p.category === 'zanzibar').length}`);

console.log('\n' + (fail.length ? 'FAILURES:\n  ' + fail.join('\n  ') : 'ALL CHECKS PASSED'));
process.exit(fail.length ? 1 : 0);