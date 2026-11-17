// One-off generator: pulls real Wikimedia Commons files per gallery category,
// de-duplicates against the existing catalog, and writes candidate metadata to
// .gallery-candidates.json. Not shipped — run manually to regenerate.
//
// Commons rate-limits hard from shared IPs (HTTP 429), so this uses one search
// request per term and then batches title lookups, all heavily throttled.

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

// Files already referenced by the catalog, so we never re-add them.
const existingSrc = fs.readFileSync('src/data/galleryCatalog.js', 'utf8');
const seen = new Set();
for (const m of existingSrc.matchAll(/'((?:[^'\\\n]|\\.)*?\.(?:jpg|jpeg|png|JPG|JPEG|PNG))'/g)) {
  seen.add(m[1].replace(/\\'/g, "'"));
}
console.error(`existing files excluded: ${seen.size}`);

async function searchFiles(term, limit = 40) {
  const data = await api({
    action: 'query',
    list: 'search',
    srsearch: term,
    srnamespace: '6',
    srlimit: String(limit),
  });
  return (data.query?.search || []).map(r => r.title);
}

async function fetchInfo(titles) {
  const out = [];
  for (let i = 0; i < titles.length; i += 40) {
    const batch = titles.slice(i, i + 40);
    const data = await api({
      action: 'query',
      titles: batch.join('|'),
      prop: 'imageinfo',
      iiprop: 'url|size|extmetadata',
      iiurlwidth: '1200',
    });
    for (const p of data.query?.pages || []) {
      const ii = p.imageinfo?.[0];
      if (!ii || p.missing) continue;
      const m = ii.extmetadata || {};
      const license = (m.LicenseShortName?.value || '').trim();
      if (!ALLOWED.has(license)) continue;
      if ((ii.width || 0) < 1600) continue;
      const file = p.title.replace(/^File:/, '');
      if (seen.has(file)) continue;
      seen.add(file);
      out.push({
        file,
        width: ii.width,
        height: ii.height,
        license,
        licenseUrl: CC_URLS[license],
        artist: (m.Artist?.value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60)
          || 'Wikimedia Commons contributor',
        page: `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}`,
        descUrl: ii.descriptionurl,
      });
    }
  }
  return out;
}

const SEARCHES = {
  wildlife: [
    'Serengeti lion', 'Serengeti leopard', 'Tarangire elephant',
    'Serengeti giraffe', 'Serengeti zebra wildebeest', 'Tanzania antelope',
    'Serengeti cheetah hyena', 'Tarangire buffalo', 'Tanzania hippo crocodile',
    'Serengeti bird', 'Tanzania monkey', 'Serengeti wildebeest migration',
  ],
  parks: [
    'Serengeti National Park landscape', 'Ngorongoro Crater landscape',
    'Tarangire National Park baobab', 'Lake Manyara National Park',
    'Ruaha National Park', 'Nyerere Selous National Park',
    'Kilimanjaro landscape', 'Lake Natron flamingos', 'Arusha National Park',
    'Serengeti plains landscape', 'Ngorongoro highlands',
    'Tarangire river landscape',
  ],
  zanzibar: [
    'Zanzibar Stone Town', 'Zanzibar beach', 'Zanzibar dhow',
    'Zanzibar market', 'Zanzibar spice plantation', 'Zanzibar coral reef',
    'Zanzibar fishing boat', 'Jozani Zanzibar forest', 'Zanzibar sunset',
    'Mnemba Atoll Zanzibar', 'Zanzibar mosque', 'Zanzibar turtle',
  ],
};

const result = {};
for (const [cat, terms] of Object.entries(SEARCHES)) {
  const titles = [];
  console.error(`\n== ${cat} ==`);
  for (const term of terms) {
    try {
      const got = await searchFiles(term, 30);
      console.error(`   "${term}" -> ${got.length}`);
      titles.push(...got);
    } catch (e) {
      console.error(`   "${term}" FAILED: ${e.message}`);
    }
  }
  const uniqTitles = [...new Set(titles)];
  try {
    const infos = await fetchInfo(uniqTitles);
    result[cat] = infos;
    console.error(`   => ${infos.length} usable new files`);
  } catch (e) {
    console.error(`   info fetch FAILED: ${e.message}`);
    result[cat] = [];
  }
}

fs.writeFileSync('.gallery-candidates.json', JSON.stringify(result, null, 2));
console.error('\nwrote .gallery-candidates.json');