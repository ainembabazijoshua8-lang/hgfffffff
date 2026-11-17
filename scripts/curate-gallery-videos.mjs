// Strict curation for gallery videos: keeps only real nature/wildlife
// footage from Tanzania / East Africa, of a sane length and file size.
// Merges extra Zanzibar titles, then writes .gallery-videos-curated.json.

import fs from 'node:fs';

const UA = { 'User-Agent': 'JebriSafarisGalleryBuilder/1.0 (local dev script)' };
const API = 'https://commons.wikimedia.org/w/api.php';
let lastRequest = 0;

async function api(params, attempt = 0) {
  const gap = lastRequest + 2500 - Date.now();
  if (gap > 0) await new Promise(r => setTimeout(r, gap));
  lastRequest = Date.now();
  const res = await fetch(`${API}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`, { headers: UA });
  if (res.status === 429) {
    if (attempt >= 7) throw new Error('429 exhausted');
    const b = 5000 * Math.pow(1.7, attempt);
    await new Promise(r => setTimeout(r, b));
    return api(params, attempt + 1);
  }
  return res.json();
}

// Reject talking-head / non-nature footage.
const REJECT = /(conf(erence|érence)|lecture|seminar|interview|speech|remarks? to|press conference|panel|webinar|presentation|keynote|addresses? the|inauguration|ceremony|memorial|funeral|sermon|q&a|talk by|debate|campaign|podcast|trailer|full movie|episode|season \d|official video|music video|song |concert|football|cricket|rugby|olympic|military|soldier|police|protest|election)/i;

const RELEVANT = /(serengeti|ngorongoro|tarangire|manyara|ruaha|nyerere|selous|kilimanjaro|kibo|arusha|natron|lengai|amboseli|tsavo|mara|zanzibar|unguja|stone ?town|pemba|mafia|mnemba|tanzania|kenya|africa|safari|lion|leopard|cheetah|elephant|giraffe|zebra|wildebeest|gnu|hippo|crocodile|hyena|buffalo|antelope|gazelle|impala|ostrich|baboon|monkey|colobus|chimpanzee|gorilla|flamingo|baobab|acacia|waterfall|coral|reef|turtle|dolphin|whale|bird|eagle|vulture|butterfl|rhino|migration)/i;

const MIN_DURATION = 20;
const MAX_DURATION = 900;
const MAX_BYTES = 140e6;

const ALLOWED = new Set(['CC BY 4.0', 'CC BY 3.0', 'CC BY 2.0', 'CC BY-SA 4.0', 'CC BY-SA 3.0', 'CC BY-SA 2.0', 'CC0', 'Public domain', 'GFDL 1.2']);

async function resolve(titles) {
  const out = [];
  for (let i = 0; i < titles.length; i += 40) {
    const batch = titles.slice(i, i + 40);
    let data = null;
    for (let a = 0; a < 6 && !data; a++) {
      try {
        data = await api({ action: 'query', titles: batch.join('|'), prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata' });
      } catch { await new Promise(r => setTimeout(r, 6000)); }
    }
    if (!data) continue;
    for (const p of data.query?.pages || []) {
      const ii = p.imageinfo?.[0];
      if (!ii || p.missing) continue;
      if (!/^video\//.test(ii.mime || '')) continue;
      const file = p.title.replace(/^File:/, '');
      if (!/\.(webm|ogv|ogg)$/i.test(file)) continue;
      out.push({
        file,
        mime: ii.mime,
        width: ii.width,
        height: ii.height,
        duration: ii.duration,
        size: ii.size,
        license: (ii.extmetadata?.LicenseShortName?.value || '').trim(),
        artist: (ii.extmetadata?.Artist?.value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60),
        page: `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}`,
        url: ii.url,
      });
    }
    await new Promise(r => setTimeout(r, 1500));
  }
  return out;
}

const EXTRA_TERMS = ['Zanzibar', 'Unguja', 'Zanzibar spice', 'Pemba island'];
const extraTitles = [];
for (const t of EXTRA_TERMS) {
  try {
    const d = await api({ action: 'query', list: 'search', srsearch: `${t} filetype:video`, srnamespace: '6', srlimit: '20' });
    const n = (d.query?.search || []).length;
    console.error(`extra "${t}" -> ${n}`);
    (d.query?.search || []).forEach(r => extraTitles.push(r.title));
  } catch (e) { console.error(`extra "${t}" FAIL ${e.message}`); }
}

const base = JSON.parse(fs.readFileSync('.gallery-videos.json', 'utf8'));
const extraMeta = await resolve([...new Set(extraTitles)]);

const all = [...base, ...extraMeta];
const seen = new Set();
const kept = [];
const rejected = [];

for (const v of all) {
  if (seen.has(v.file)) continue;
  seen.add(v.file);
  const f = v.file;
  if (REJECT.test(f)) { rejected.push(['reject-word', f]); continue; }
  if (!RELEVANT.test(f)) { rejected.push(['not-relevant', f]); continue; }
  if (!ALLOWED.has(v.license)) { rejected.push(['license', f]); continue; }
  if (!(v.duration >= MIN_DURATION)) { rejected.push(['too-short', f]); continue; }
  if (v.duration > MAX_DURATION) { rejected.push(['too-long', `${f} (${Math.round(v.duration)}s)`]); continue; }
  if (v.size > MAX_BYTES) { rejected.push(['too-big', `${f} (${Math.round(v.size / 1e6)}MB)`]); continue; }
  kept.push(v);
}

console.error(`\nkept ${kept.length} of ${all.length}`);
const byReason = {};
for (const [r] of rejected) byReason[r] = (byReason[r] || 0) + 1;
console.error('rejected:', byReason);

kept.sort((a, b) => b.duration - a.duration);
fs.writeFileSync('.gallery-videos-curated.json', JSON.stringify(kept, null, 2));
console.error('wrote .gallery-videos-curated.json');
for (const v of kept) {
  console.error(`   ${Math.round(v.duration)}s ${(v.size / 1e6).toFixed(1)}MB ${v.file.slice(0, 62)}`);
}