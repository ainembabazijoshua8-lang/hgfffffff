// Curation pass: filter Commons candidates down to 30 genuine field
// photographs per gallery category, then verify every selected file actually
// resolves on upload.wikimedia.org before we write it into the catalog.
// Writes .gallery-selected.json.

import fs from 'node:fs';

const UA = { 'User-Agent': 'JebriSafarisGalleryBuilder/1.0 (local dev script)' };
const PER_CATEGORY = 30;

// Reject anything that is not a real field photograph.
const REJECT_FILE_EXT = /\.(webm|ogv|svg|pdf|tif|tiff|djvu|mid|wav|ogg)$/i;
const REJECT_WORDS = [
  'taxiderm', 'skull', 'skeleton', 'bone', 'museum', 'naturhistoriska', 'specimen',
  'fossil', 'distribution', 'range map', 'location map', 'topograph', 'diagram',
  'chart', 'graph', 'logo', 'coat of arms', 'flag of', 'stamp', 'banknote', 'coin',
  'poster', 'book', 'page ', 'plate ', 'statue', 'sculpture', 'graffiti', 'sign ',
  'portrait of', 'grave', 'cemetery', 'emblem', 'seal of', 'patch', 'tshirt',
  't-shirt', 'cover of', 'drawing', 'illustration', 'painting', 'engraving',
  'lithograph', 'sketch', 'animation', 'cartoon', 'map of', 'old map',
  // Not a genuine Tanzanian field photo:
  'hodenhagen',              // "Serengeti-Park Hodenhagen" is a zoo in Germany
  ' tierpark', 'safari park deutschland',
  'anderson-morshead',       // 1909 archival scan
  'loc ', 'matpc', 'historyofuniver',
  'packet', 'tandoori', 'masala',  // a product shot, not a spice farm
  'a team who', 'group of people', 'tourists', 'visitors', 'volunteers',
  'leopard tortoise',        // mislabelled tortoise
  'elephants in kibo',       // no elephants on the Kilimanjaro summit
  'klipspringer en giraffe', // 1973 slide scan, poor quality
];

// Each category keeps only files that look on-topic.
const MUST_MATCH = {
  wildlife: /(lion|leopard|cheetah|elephant|rhinoceros|rhino|buffalo|giraffe|zebra|wildebeest|gnu|hippo|hippopotamus|crocodile|hyena|jackal|wild ?dog|lycaon|warthog|impala|gazelle|kudu|eland|antelope|baboon|monkey|colobus|lemur|ostrich|sheepwater|waterbuck|duiker|steenbok|hartebeest|topi|oryx|klipspringer)/i,
  parks: /(serengeti|ngorongoro|tarangire|manyara|ruaha|nyerere|selous|kilimanjaro|kibo|mount meru|arusha|natron|ol doinyo|lengai|mara|amboseli|tsavo|gorongosa|katavi|mahale|nyungwe|bwindi|lake victoria|rift valley|acacia|crater|kopje|plain|landscape|vlei|savanna|watershed|baobab)/i,
  zanzibar: /(zanzibar|stone ?town|undu|dhow|forodhani|mnemba|jambiani|matemwe|spice|turmeric|clove|pepper|coconut|ng ?awa|menai bay|paje|nungwi|ione|mafia|blue lagoon|embelemende|makunduchi|jozani|chromodoris)/i,
};

// Subject key, used to cap how many near-duplicate species shots we take.
const SUBJECT = [
  [/lion|panthera leo|melanochaita|lioness/i, 'lion'],
  [/leopard/i, 'leopard'],
  [/cheetah/i, 'cheetah'],
  [/elephant/i, 'elephant'],
  [/giraffe/i, 'giraffe'],
  [/zebra/i, 'zebra'],
  [/wildebeest|\bgnu\b/i, 'wildebeest'],
  [/hippo/i, 'hippo'],
  [/crocodile/i, 'crocodile'],
  [/buffalo|syncerus/i, 'buffalo'],
  [/hyena/i, 'hyena'],
  [/baobab|adansonia/i, 'baobab'],
  [/dhow/i, 'dhow'],
  [/fisher|fish(ing)?\b/i, 'fishing'],
  [/beach/i, 'beach'],
  [/cattle|cows|livestock|goats?/i, 'livestock'],
  [/mosque/i, 'mosque'],
  [/mangrove/i, 'mangrove'],
  [/coastal forest|forest/i, 'forest'],
  [/antelope|eland|impala|gazelle|kudu|waterbuck|topi|oryx|klipspringer/i, 'antelope'],
  [/flamingo/i, 'flamingo'],
  [/rhinoceros|\brhino\b/i, 'rhino'],
  [/monkey|baboon|colobus/i, 'primate'],
  [/mosque/i, 'mosque'],
];

// Same-building / same-subject shots that read as duplicates in a grid.
const SUBJECT_CAP = { wildlife: 3, parks: 4, zanzibar: 3 };
const TIGHT_CAP = { mosque: 2, dhow: 3, fishing: 3, beach: 3, baobab: 3 };

function passes(cat, file) {
  if (REJECT_FILE_EXT.test(file)) return false;
  const lower = file.toLowerCase();
  if (REJECT_WORDS.some(w => lower.includes(w))) return false;
  if (!MUST_MATCH[cat].test(lower)) return false;
  return true;
}

function subjectOf(file) {
  for (const [re, key] of SUBJECT) if (re.test(file)) return key;
  return 'other';
}

// Rank: prefer landscape framing, large images, and recognised photographers
// so the gallery reads as curated rather than scraped.
function score(cat, p) {
  let s = 0;
  const ratio = p.width / p.height;
  if (ratio >= 1.2 && ratio <= 2.2) s += 3;       // landscape framing
  else if (ratio > 0.7 && ratio < 1.2) s += 1;
  if (p.width >= 3000) s += 2; else if (p.width >= 2000) s += 1;
  if (/\b(DD |Giles Laurent|Diego Delso|Charles J\. Sharp|Richard Mortel|Yann Macherez)\b/i.test(p.file)) s += 3;
  if (/serengeti|tarangire|ngorongoro|zanzibar|ruaha|manyara/i.test(p.file)) s += 2;
  if (/panorama|panoramio/i.test(p.file)) s -= 2;
  // Prefer the ones that name both a park and a subject.
  if (/\d{3}\s+\w+.*(Serengeti|Tarangire|Manyara|Ngorongoro)/i.test(p.file)) s += 2;
  return s;
}

const cands = JSON.parse(fs.readFileSync('.gallery-candidates.json', 'utf8'));
const selected = {};

// Cap photos per subject so we don't ship eight giraffes.
const DEFAULT_CAP = 3;

for (const [cat, list] of Object.entries(cands)) {
  const pool = list.filter(p => passes(cat, p.file));
  pool.sort((a, b) => score(cat, b) - score(cat, a) || a.file.localeCompare(b.file));

  const picked = [];
  const usedTokens = new Set();
  const subjectCount = {};
  const deferred = [];
  const cap = SUBJECT_CAP[cat] || DEFAULT_CAP;
  const limitFor = (subject) => TIGHT_CAP[subject] || cap;

  for (const p of pool) {
    const subject = subjectOf(p.file);
    const token = p.file.replace(/\.(jpe?g|png)$/i, '')
      .replace(/\(\d+\)/g, '').replace(/\d+/g, '')
      .replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 34);
    if (usedTokens.has(token)) continue;
    if ((subjectCount[subject] || 0) >= limitFor(subject)) { deferred.push(p); continue; }
    usedTokens.add(token);
    subjectCount[subject] = (subjectCount[subject] || 0) + 1;
    picked.push(p);
    if (picked.length >= PER_CATEGORY) break;
  }
  // If the cap left us short, backfill from the deferred pool.
  if (picked.length < PER_CATEGORY) {
    for (const p of deferred) {
      if (picked.length >= PER_CATEGORY) break;
      usedTokens.add(p.file);
      picked.push(p);
    }
  }
  selected[cat] = picked;
  console.error(`${cat}: ${pool.length} passed, picked ${picked.length}`);
  console.error(`   subjects: ${JSON.stringify(subjectCount)}`);
}

// --- verify every file still exists on Commons ---
// The imageinfo we already hold is proof of existence, but re-confirm in bulk
// via the API (one request per 50 titles) rather than fetching 90 image URLs,
// which gets the IP rate-limited hard.
const API = 'https://commons.wikimedia.org/w/api.php';

async function confirmExists(titles) {
  const present = new Set();
  for (let i = 0; i < titles.length; i += 50) {
    const batch = titles.slice(i, i + 50);
    // titles= must carry the full page title including the namespace prefix,
    // otherwise Commons looks them up as mainspace articles and reports every
    // one as missing.
    const url = `${API}?${new URLSearchParams({
      format: 'json',
      formatversion: '2',
      action: 'query',
      titles: batch.map(t => `File:${t}`).join('|'),
      prop: 'imageinfo',
      iiprop: 'url|size',
    })}`;
    let data = null;
    for (let attempt = 0; attempt < 6 && !data; attempt++) {
      const res = await fetch(url, { headers: UA });
      if (res.status === 429) {
        const backoff = 5000 * Math.pow(1.8, attempt);
        process.stderr.write(`   429 -> wait ${Math.round(backoff / 1000)}s\n`);
        await new Promise(r => setTimeout(r, backoff));
        continue;
      }
      data = await res.json();
    }
    if (!data) throw new Error('could not confirm existence (rate limited)');
    for (const p of data.query?.pages || []) {
      if (!p.missing && p.imageinfo?.length) present.add(p.title.replace(/^File:/, ''));
    }
    await new Promise(r => setTimeout(r, 1500));
  }
  return present;
}

const all = Object.values(selected).flat();
console.error(`\nconfirming ${all.length} files via API...`);
const present = await confirmExists(all.map(p => p.file));

for (const cat of Object.keys(selected)) {
  selected[cat] = selected[cat].filter(p => present.has(p.file));
  console.error(`${cat} final: ${selected[cat].length}`);
}

const missing = all.filter(p => !present.has(p.file));
if (missing.length) console.error('MISSING:\n  ' + missing.map(m => m.file).join('\n  '));

// Sequential spot-check that Special:FilePath actually renders for a sample,
// which is the URL form the catalog uses.
const spot = selected.wildlife.slice(0, 2)
  .concat(selected.parks.slice(0, 2))
  .concat(selected.zanzibar.slice(0, 2));
console.error(`\nspot-checking ${spot.length} Special:FilePath URLs...`);
for (const p of spot) {
  const u = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(p.file.replace(/ /g, '_'))}?width=1200`;
  try {
    const res = await fetch(u, { headers: UA, redirect: 'follow' });
    const type = res.headers.get('content-type') || '';
    console.error(`   ${res.ok && type.startsWith('image/') ? 'OK  ' : 'FAIL'} ${res.status} ${type.split(';')[0]}  ${p.file.slice(0, 55)}`);
  } catch (e) {
    console.error(`   FAIL ${e.message} ${p.file.slice(0, 55)}`);
  }
  await new Promise(r => setTimeout(r, 1200));
}

fs.writeFileSync('.gallery-selected.json', JSON.stringify(selected, null, 2));
console.error('wrote .gallery-selected.json');