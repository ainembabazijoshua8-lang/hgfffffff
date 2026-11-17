// Fetches freely-licensed Wikimedia Commons videos for the gallery.
// Writes .gallery-videos.json. One-off generator, not shipped.
//
// Commons search supports filetype:video; videos are almost always .webm
// (VP8/VP9) which every modern browser plays natively.

import fs from 'node:fs';

const UA = { 'User-Agent': 'JebriSafarisGalleryBuilder/1.0 (local dev script)' };
const API = 'https://commons.wikimedia.org/w/api.php';

const CC_URLS = {
  'CC BY 4.0': 'https://creativecommons.org/licenses/by/4.0/',
  'CC BY 3.0': 'https://creativecommons.org/licenses/by/3.0/',
  'CC BY 2.0': 'https://creativecommons.org/licenses/by/2.0/',
  'CC BY-SA 4.0': 'https://creativecommons.org/licenses/by-sa/4.0/',
  'CC BY-SA 3.0': 'https://creativecommons.org/licenses/by-sa/3.0/',
  'CC BY-SA 2.0': 'https://creativecommons.org/licenses/by-sa/2.0/',
  'CC0': 'https://creativecommons.org/publicdomain/zero/1.0/',
  'Public domain': 'https://creativecommons.org/publicdomain/mark/1.0/',
  'GFDL 1.2': 'https://www.gnu.org/licenses/old-licenses/fdl-1.2.html',
};
const ALLOWED = new Set(Object.keys(CC_URLS));

const MIN_GAP_MS = 2500;
let lastRequest = 0;

async function api(params, attempt = 0) {
  const gap = lastRequest + MIN_GAP_MS - Date.now();
  if (gap > 0) await new Promise(r => setTimeout(r, gap));
  lastRequest = Date.now();
  const url = `${API}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`;
  const res = await fetch(url, { headers: UA });
  if (res.status === 429) {
    if (attempt >= 7) throw new Error('HTTP 429 exhausted');
    const backoff = 5000 * Math.pow(1.7, attempt);
    console.error(`   429 -> wait ${Math.round(backoff / 1000)}s`);
    await new Promise(r => setTimeout(r, backoff));
    return api(params, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function searchVideos(term, limit = 20) {
  const data = await api({
    action: 'query',
    list: 'search',
    srsearch: `${term} filetype:video`,
    srnamespace: '6',
    srlimit: String(limit),
  });
  return (data.query?.search || []).map(r => r.title);
}

const SEARCHES = [
  'Serengeti wildlife', 'lion hunting', 'giraffe', 'zebra wildebeest migration',
  'elephant herd', 'cheetah', 'leopard', 'Tarangire', 'Ngorongoro crater',
  'Kilimanjaro', 'hippopotamus', 'crocodile', 'chimpanzee',
  'Zanzibar beach', 'Zanzibar Stone Town', 'dhow sailing', 'coral reef fish',
  'sea turtle', 'safari vehicle game drive', 'bird of prey Africa',
  'waterfall Tanzania', 'baobab', 'flamingo flock', 'baboon troop',
];

const titles = [];
for (const term of SEARCHES) {
  try {
    const got = await searchVideos(term, 20);
    console.error(`   "${term}" -> ${got.length}`);
    titles.push(...got);
  } catch (e) {
    console.error(`   "${term}" FAILED: ${e.message}`);
  }
}

const uniq = [...new Set(titles)];
console.error(`\nresolving metadata for ${uniq.length} video files...`);

const videos = [];
const seen = new Set();
for (let i = 0; i < uniq.length; i += 40) {
  const batch = uniq.slice(i, i + 40);
  let data = null;
  for (let attempt = 0; attempt < 6 && !data; attempt++) {
    try {
      data = await api({
        action: 'query',
        titles: batch.join('|'),
        prop: 'imageinfo',
        iiprop: 'url|size|mime|extmetadata',
        iipropcontinue: '',
      });
    } catch (e) {
      if (attempt === 5) console.error(`   batch FAILED: ${e.message}`);
      await new Promise(r => setTimeout(r, 6000));
    }
  }
  if (!data) continue;
  for (const p of data.query?.pages || []) {
    const ii = p.imageinfo?.[0];
    if (!ii || p.missing) continue;
    if (!/^video\//.test(ii.mime || '')) continue;
    const file = p.title.replace(/^File:/, '');
    if (seen.has(file)) continue;
    if (!/\.(webm|ogv|ogg)$/i.test(file)) continue;
    seen.add(file);
    const m = ii.extmetadata || {};
    const license = (m.LicenseShortName?.value || '').trim();
    if (!ALLOWED.has(license)) continue;
    // Skip very short clips and anything tiny; these are stills or fragments.
    if ((ii.duration || 0) < 8) continue;
    videos.push({
      file,
      mime: ii.mime,
      width: ii.width,
      height: ii.height,
      duration: ii.duration,
      size: ii.size,
      license,
      licenseUrl: CC_URLS[license],
      artist: (m.Artist?.value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60)
        || 'Wikimedia Commons contributor',
      page: `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}`,
      descUrl: ii.descriptionurl,
      url: ii.url,
    });
  }
  await new Promise(r => setTimeout(r, 1500));
}

console.error(`\n${videos.length} usable videos`);
videos.sort((a, b) => (b.duration || 0) - (a.duration || 0));
fs.writeFileSync('.gallery-videos.json', JSON.stringify(videos, null, 2));
console.error('wrote .gallery-videos.json');