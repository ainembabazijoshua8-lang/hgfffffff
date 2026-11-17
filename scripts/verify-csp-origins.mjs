// scripts/verify-csp-origins.mjs
//
// Fails when the CSP allowlist (shared-csp-origins.js) and the origins the
// frontend actually loads have drifted apart.
//
// Why this must exist: CSP is disabled outside production, so a blocked origin
// is invisible in dev and only breaks the deployed site. That is exactly how
// Leaflet, every basemap tile provider, every Wikimedia photo and the
// Tripadvisor QR code were all blocked at once while dev looked perfect.
//
// Mechanism: scan index.html and every src module for absolute URLs, reduce
// them to hosts, and require each host to be either
//   (a) declared in the CSP allowlist, or
//   (b) listed in LINK_ONLY_HOSTS with a stated reason — because CSP governs
//       subresource loads, not <a href> navigation or JSON-LD context URLs.
//
// Anything else is a latent production outage.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { ALL_CSP_ORIGINS } from '../shared-csp-origins.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Hosts that appear only as hyperlink targets, citation URLs, schema.org
 * context strings, or outbound social links. CSP's img/script/style/connect
 * directives do not govern these, so they are legitimately absent.
 * Keep each reason explicit — an unexplained entry here is how a real
 * subresource gets waved through.
 */
const LINK_ONLY_HOSTS = new Map([
  ['wa.me', 'WhatsApp deep links in <a href>'],
  ['commons.wikimedia.org', 'attribution/citation links; photo bytes come from thumb.wikimedia.org'],
  ['creativecommons.org', 'licence citation links'],
  ['schema.org', 'JSON-LD @context / @type identifiers, never fetched'],
  ['www.gnu.org', 'licence citation links (GFDL)'],
  ['jebrisafaris.com', 'canonical/OG metadata, not a subresource'],
  ['www.instagram.com', 'outbound profile link'],
  ['www.facebook.com', 'outbound profile link'],
  ['twitter.com', 'outbound profile link'],
  ['www.linkedin.com', 'outbound profile link'],
  ['www.tripadvisor.com', 'outbound review link (the CTA target)'],
  ['www.openstreetmap.org', 'iframe src is frame-src allowed; other uses are outbound links'],
]);

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.git' || entry === 'dist' || entry === '.smoke') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (/\.(jsx?|mjs|css|html)$/.test(entry)) acc.push(full);
  }
  return acc;
}

const files = [join(root, 'index.html'), ...walk(join(root, 'src'))];

/** Hosts referenced in the app's own source files, with one example each. */
const found = new Map();
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)) {
    const host = m[1].toLowerCase();
    if (!found.has(host)) {
      found.set(host, `${relative(root, file).replace(/\\/g, '/')}:${text.slice(0, m.index).split('\n').length}`);
    }
  }
}

const allowed = new Set(ALL_CSP_ORIGINS.map(o => {
  try {
    return new URL(o).host.toLowerCase();
  } catch {
    return null;
  }
}).filter(Boolean));

const missing = [...found.keys()]
  .filter(h => !allowed.has(h) && !LINK_ONLY_HOSTS.has(h))
  .sort();

const unusedAllowed = [...allowed].filter(h => !found.has(h)).sort();

console.log(`Scanned ${files.length} files, found ${found.size} distinct external hosts.`);
console.log(`CSP allowlist permits ${allowed.size} origins.\n`);

if (unusedAllowed.length) {
  console.log('NOTE  allowed but not referenced in source (harmless, keeps the policy stable):');
  for (const h of unusedAllowed) console.log(`        ${h}`);
  console.log('');
}

if (missing.length) {
  console.error('FAIL  these hosts are loaded by the app but blocked by the production CSP:');
  for (const h of missing) {
    console.error(`        ${h}  (first used at ${found.get(h)})`);
  }
  console.error('\nAdd each to the correct list in shared-csp-origins.js.');
  console.error('If it is genuinely a hyperlink only, add it to LINK_ONLY_HOSTS with a reason.');
  process.exit(1);
}

console.log('PASS  every external origin is either CSP-allowed or documented as link-only.');
process.exit(0);