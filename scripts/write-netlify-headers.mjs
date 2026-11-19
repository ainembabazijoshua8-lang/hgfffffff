// write-netlify-headers.mjs — emits dist/_headers for Netlify.
//
// On Render/Railway the Express server sends the CSP via helmet. On Netlify
// the static files are served without Express, so the same policy has to be
// written as a _headers file. It is generated from shared-csp-origins.js so
// the two hosts can never drift apart.
import { writeFileSync, existsSync } from 'node:fs';
import { buildCspDirectives } from '../shared-csp-origins.js';

const kebab = (s) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

const csp = Object.entries(buildCspDirectives(true))
  .map(([name, values]) => [kebab(name), ...values].join(' '))
  .join('; ');

const headers = `/*
  Content-Security-Policy: ${csp}
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/vendor/*
  Cache-Control: public, max-age=31536000, immutable
`;

if (!existsSync('dist')) {
  console.error('dist/ not found — run `vite build` first.');
  process.exit(1);
}
writeFileSync('dist/_headers', headers);
console.log('Wrote dist/_headers');
