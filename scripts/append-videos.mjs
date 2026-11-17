import fs from 'node:fs';

const target = 'src/data/galleryCatalog.js';
const videos = fs.readFileSync('.gallery-videos-block.js', 'utf8').replace(/\r?\n$/, '');
let src = fs.readFileSync(target, 'utf8');

if (src.includes('export const GALLERY_VIDEOS')) {
  console.log('videos already present — skipping');
  process.exit(0);
}

// GALLERY_PHOTOS is the final array literal in the file; append after it.
const end = src.lastIndexOf('];');
if (end < 0) throw new Error('could not find end of GALLERY_PHOTOS');
src = src.slice(0, end + 2) + '\n\n' + videos + '\n';
fs.writeFileSync(target, src);
console.log('appended video catalog');