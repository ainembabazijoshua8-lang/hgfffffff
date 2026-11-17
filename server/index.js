// server/index.js — Express API for Jebri Safaris
// Handles: tours catalog, booking inquiries, contact form, newsletter, reviews
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createDatabaseBackup, db, getBackupConfig, initDb, listBackupFiles } from './db.js';
import { z } from 'zod';
import { getMailerStatus, sendInquiryEmail } from './mailer.js';
import { getActivityById } from './activitiesCatalog.js';
// Single source of truth for per-person pricing, shared verbatim with the
// React frontend so the quoted price can never diverge between screens.
import { tourPricePerPerson } from '../shared-pricing.js';
import { buildCspDirectives } from '../shared-csp-origins.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8787;
const isProd = process.env.NODE_ENV === 'production' || process.argv.includes('--prod');

// Trust the reverse proxy (the documented Nginx deploy) so `req.ip` reflects
// the real client address. Without this, rate limiting and the admin
// brute-force lockout key on the proxy's IP (127.0.0.1), which defeats both
// controls. Defaults to trusting loopback proxies only, so a client cannot
// spoof X-Forwarded-For from outside. Set TRUST_PROXY=false to disable.
const rawTrustProxy = process.env.TRUST_PROXY;
const trustProxy = rawTrustProxy === undefined ? 'loopback' : rawTrustProxy;
app.set('trust proxy', trustProxy === 'false' ? false : trustProxy);

// ─── Admin credential helpers ────────────────────────────────────────────────
// Supports a hashed admin password of the form: scrypt$<saltHex>$<hashHex>
// Generate one with: node -e "console.log(require('./server/hash-admin.js').hashAdminPassword('your-pass'))"
// (see server/hash-admin.js). Plaintext values are still accepted for local dev
// but are discouraged — prefer the hashed form in production.
function hashAdminPassword(password, salt = crypto.randomBytes(16)) {
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

function verifyAdminPassword(stored, input) {
  if (!stored || !input) return false;
  if (stored.startsWith('scrypt$')) {
    const [, saltHex, hashHex] = stored.split('$');
    if (!saltHex || !hashHex) return false;
    const expected = Buffer.from(hashHex, 'hex');
    const actual = crypto.scryptSync(input, Buffer.from(saltHex, 'hex'), 64);
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  }
  // Legacy plaintext fallback (dev only). Constant-time not possible, but fine
  // for local, non-sensitive setups.
  return stored === input;
}

// Init database (creates tables if missing + seeds if empty)
initDb();

// Security guard: a plaintext admin password is acceptable for local dev but
// must never ship to production. Warn loudly if a non-hashed value is set.
// L-6: in production we now REFUSE to start — the warning is easy to miss in
// a scrolling log, and a plaintext password in a single-tenant VPS is
// catastrophic. Set ADMIN_ALLOW_PLAINTEXT=1 in CI / dev only.
if (isProd && process.env.ADMIN_PASSWORD && !process.env.ADMIN_PASSWORD.startsWith('scrypt$')) {
  if (process.env.ADMIN_ALLOW_PLAINTEXT === '1') {
    console.warn(
      '⚠ SECURITY: ADMIN_PASSWORD is stored in plaintext but ADMIN_ALLOW_PLAINTEXT=1 is set. ' +
      'Generate a scrypt hash with `node server/hash-admin.js "<password>"` before deploying for real.'
    );
  } else {
    throw new Error(
      'Refusing to start: ADMIN_PASSWORD is stored in plaintext.\n' +
      'Generate a scrypt hash with `node server/hash-admin.js "<password>"` and set ADMIN_PASSWORD to that value.\n' +
      'If you absolutely need plaintext in this environment, set ADMIN_ALLOW_PLAINTEXT=1 (NOT recommended).'
    );
  }
}

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// --- middleware ---
app.use(helmet({
  // Built from shared-csp-origins.js rather than a hand-written literal. The
  // two used to drift, and every external origin the frontend loads was
  // silently blocked in production (Leaflet, all basemap tiles, Wikimedia
  // photos, the Tripadvisor QR). scripts/verify-csp-origins.mjs now fails the
  // build if the allowlist and the source disagree again.
  contentSecurityPolicy: isProd ? {
    directives: buildCspDirectives(isProd),
  } : false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
  // Strip the default X-Powered-By (Express) and hide tech fingerprints.
  xPoweredBy: false,
  xContentTypeOptions: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  frameguard: { action: 'deny' },
  // Disable browser features we never use; reduces attack surface.
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
    interestCohort: [],
  },
  // Only emit HSTS in production (where TLS terminates at the server or proxy).
  strictTransportSecurity: isProd
    ? { maxAge: 63072000, includeSubDomains: true, preload: true }
    : false,
}));
app.use(compression());
app.use(cors({
  // Must invoke the callback — cors 2.x never reads the return value, so a
  // function that merely returns would hang every request. We echo the
  // specific origin (required when credentials:true) only for allow-listed
  // origins, and allow same-origin/non-browser requests (no Origin header).
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, origin);
    return cb(null, false);
  },
  credentials: true,
  optionsSuccessStatus: 204,
}));

// Reject requests whose Host header doesn't match an allowed origin. Prevents
// Host-header poisoning of password-reset / admin links and cache poisoning.
if (isProd && ALLOWED_ORIGINS.length) {
  const allowedHosts = new Set(
    ALLOWED_ORIGINS.map(o => { try { return new URL(o).host; } catch { return null; } }).filter(Boolean)
  );
  app.use((req, res, next) => {
    const host = req.get('host');
    if (!host || !allowedHosts.has(host)) {
      return res.status(400).json({ ok: false, error: 'Invalid Host header.' });
    }
    next();
  });
}

app.use(express.json({ limit: '64kb' }));

app.use((req, res, next) => {
  if (!isProd) console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Rate-limit POST endpoints (avoid spam/abuse of contact + booking forms)
const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many requests, please try again later.' },
});

// Stricter rate-limit for admin endpoints (reduce brute-force exposure).
// H-4: split by read vs write so a burst of lightweight read polls
// (`/backup-status`, `/inquiries`) can't lock the operator out of PATCH/POST
// write calls in the same window.
const adminReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 80,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many admin requests, please try again later.' },
});
const adminWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many admin requests, please try again later.' },
});

// --- validation schemas ---
// Every field has a friendly custom message so the API returns human text.
const inquirySchema = z.object({
  name: z.string().trim().min(2, 'Please enter your full name.').max(120),
  email: z.string().trim().email('Please enter a valid email address.').max(180),
  phone: z.string().trim().max(40, 'Phone number is too long.').optional().or(z.literal('')),
  country: z.string().trim().max(80).optional().or(z.literal('')),
  tour_id: z.string().trim().max(40).optional().or(z.literal('')),
  travel_date: z.string().trim().max(40).optional().or(z.literal('')),
  travelers: z.coerce.number({ invalid_type_error: 'Travelers must be a number.' })
    .int('Travelers must be a whole number.').min(1).max(50).optional(),
  message: z.string().trim().min(10, 'Please tell us a bit more — at least 10 characters.').max(4000, 'Message is too long (max 4000 characters).'),
  source: z.enum(['booking', 'contact', 'tour-inquiry']).default('contact'),
  // honeypot — bots fill it; humans don't see it
  website: z.string().max(200).optional().default(''),
});

const newsletterSchema = z.object({
  email: z.string().trim().email('Invalid email.').max(180),
  // Honeypot — bots fill it; humans never see it.
  website: z.string().max(200).optional().default(''),
});

const reviewSchema = z.object({
  author: z.string().trim().min(2).max(120),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().trim().min(20).max(2000),
  tour_id: z.string().trim().max(40).optional().or(z.literal('')),
  // Honeypot — bots fill it; humans never see it. Reviews were the one
  // public POST without this guard: inquiries, plan and newsletter all
  // silent-drop on `website`, so a bot could push straight into the reviews
  // table at the formLimiter budget. There is no review form in the UI yet,
  // so the endpoint is reachable only by direct POST -- which makes this
  // server-side field the complete defence. When a review form is added it
  // must render the matching visually-hidden `website` input.
  website: z.string().max(200).optional().default(''),
});

const plannerDate = z.string().trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Dates must use YYYY-MM-DD format.')
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, 'Please enter a valid calendar date.');
const optionalPlannerDate = plannerDate.optional().or(z.literal(''));

// Planner payload — what the multi-step trip planner posts back.
// IMPORTANT: items only carry an `id` + `kind`. The server looks up title,
// price, detail, duration, and itinerary from its own catalog/DB so a
// malicious client cannot smuggle custom prices, titles, or HTML into the
// founder email.
const plannerItemSchema = z.object({
  id: z.string().trim().max(40),
  kind: z.enum(['tour', 'activity', 'custom']),
});

const plannerSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name.').max(120),
  email: z.string().trim().email('Please enter a valid email address.').max(180),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  country: z.string().trim().max(80).optional().or(z.literal('')),
  start_date: plannerDate,
  end_date: plannerDate,
  flight_date: optionalPlannerDate,
  travel_date: z.string().trim().max(40).optional().or(z.literal('')),
  duration: z.string().trim().max(80).optional().or(z.literal('')),
  travelers: z.coerce.number().int().min(1).max(50).optional(),
  tier: z.enum(['budget', 'mid', 'luxury']).optional().or(z.literal('')),
  budget: z.string().trim().max(40).optional().or(z.literal('')),
  message: z.string().trim().max(4000).optional().or(z.literal('')),
  items: z.array(plannerItemSchema).min(1, 'Please pick at least one tour or activity.').max(20),
  estimate_total: z.number().nonnegative().optional(),
  // Honeypot: bots fill it; humans never see it. Schema accepts anything so we
  // can do the silent-drop in the route handler.
  website: z.string().max(200).optional().default(''),
}).superRefine((data, ctx) => {
  if (data.end_date < data.start_date) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['end_date'], message: 'End date must be on or after the start date.' });
  }
  if (data.flight_date && data.flight_date < data.start_date) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['flight_date'], message: 'Flight date must be on or after the start date.' });
  }
});

// 'status is required' is enforced by the schema below, not defaulted here:
// zod's .default() is a fill-in for absent keys, so an empty PATCH body used
// to parse fine and silently reset a closed/archived record back to 'new'.
const adminStatusSchema = z.object({
  status: z.enum(['new', 'contacted', 'quoted', 'closed', 'archived'], {
    required_error: 'status is required.',
  }),
});

// Numeric pagination guard shared by both admin list endpoints.
// Math.max(Number('abc'), 1) is NaN, which slips past the clamp and then hits
// SQLite as a bound LIMIT/OFFSET -> SQLITE_MISMATCH -> 500. Repeated params
// (?limit=1&limit=2) arrive as an array and coerce to NaN the same way.
function parsePagination(query) {
  const rawLimit = Number(query.limit);
  const rawOffset = Number(query.offset);
  const limit = Number.isFinite(rawLimit) && rawLimit > 0
    ? Math.min(Math.floor(rawLimit), 200)
    : 50;
  const offset = Number.isFinite(rawOffset) && rawOffset > 0
    ? Math.floor(rawOffset)
    : 0;
  return { limit, offset };
}

// Same class of bug as parsePagination, different entry point: a non-numeric
// :id arrives as NaN, better-sqlite3 cannot bind it to the INTEGER primary key,
// and the driver throws. The throw is synchronous inside a sync handler, so
// Express converts it into a 500 — an unauthenticated-shaped client error that
// reads like a server fault and pollutes the error log. Reject it as a 400
// instead, and require a positive integer so `0` and `-1` cannot probe ids.
function parseId(raw) {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > Number.MAX_SAFE_INTEGER) return null;
  return n;
}

// Per-IP brute-force lockout for admin auth. Tracks consecutive failures and
// blocks further attempts for a cooldown window. In-memory (per process) —
// sufficient for a single-node deployment; use Redis behind a LB.
//
// C-2: an operator who has previously authenticated from this same network is
// not the threat model the lockout is designed to catch, and locking them out
// is strictly worse. External attackers still get the full 5-strike lockout
// because they have never held the trust grant.
const ADMIN_LOCK_WINDOW_MS = 15 * 60 * 1000;
const ADMIN_MAX_FAILS = 5;
// The lockout table is an unbounded Map keyed by IP. Without a ceiling, a
// distributed source-rotation attack (or X-Forwarded-For rotation behind a
// permissive TRUST_PROXY) inserts one permanent entry per address and the
// process grows until it is OOM-killed — an unauthenticated memory-exhaustion
// DoS. Cap the table and evict the oldest entries past the cap, and sweep
// expired windows periodically so idle entries cannot accumulate either.
const ADMIN_FAILURES_MAX = 10_000;
const adminFailures = new Map(); // ip -> { count, until }
let lastGoodAdminIp = null;      // IP that most recently authenticated
let lastGoodAdminAt = 0;         // timestamp of that authentication
const ADMIN_TRUST_TTL_MS = 6 * 60 * 60 * 1000;

// A previously-authenticated IP is exempt from lockout (C-2), but that
// exemption must not be permanent. An operator's IP changes, gets reassigned,
// or sits behind CGNAT; a stale, never-expiring trust record would silently
// disable brute-force protection for that address indefinitely.
function trustedAdminIp() {
  if (lastGoodAdminIp && Date.now() - lastGoodAdminAt < ADMIN_TRUST_TTL_MS) {
    return lastGoodAdminIp;
  }
  lastGoodAdminIp = null;
  return null;
}

function sweepAdminFailures() {
  const now = Date.now();
  for (const [ip, entry] of adminFailures) {
    if (!entry.until || entry.until <= now) adminFailures.delete(ip);
  }
  // Map preserves insertion order, so the head is the oldest entry.
  while (adminFailures.size > ADMIN_FAILURES_MAX) {
    const oldest = adminFailures.keys().next().value;
    if (oldest === undefined) break;
    adminFailures.delete(oldest);
  }
}

// Sweep at most once per lock window; the interval is unref'd so it never
// holds the event loop open and delay shutdown.
const adminSweepTimer = setInterval(sweepAdminFailures, ADMIN_LOCK_WINDOW_MS);
if (typeof adminSweepTimer.unref === 'function') adminSweepTimer.unref();

// M-10: normalize client IPs so a v4-mapped-v6 / X-Forwarded-For / CGNAT
// rotation doesn't fragment the lockout bucket. We take the leftmost entry
// in X-Forwarded-For (closest to the original client) and strip the v6
// mapping prefix.
function normalizeIp(raw) {
  if (!raw) return '';
  let ip = String(raw).split(',')[0].trim();
  if (ip.startsWith('::ffff:')) ip = ip.slice(7);
  return ip;
}

function recordAdminFailure(ip) {
  const now = Date.now();
  // Read the existing entry BEFORE re-inserting. Deleting first and then
  // reading would always yield undefined, resetting count to 1 on every
  // attempt so the lockout threshold could never be reached.
  const entry = adminFailures.get(ip) || { count: 0, until: 0 };
  // Re-insert so Map iteration order reflects recency for the cap eviction.
  adminFailures.delete(ip);
  entry.count += 1;
  if (entry.count >= ADMIN_MAX_FAILS) {
    entry.until = now + ADMIN_LOCK_WINDOW_MS;
  }
  adminFailures.set(ip, entry);
  if (adminFailures.size > ADMIN_FAILURES_MAX) sweepAdminFailures();
}

function clearAdminFailure(ip) {
  adminFailures.delete(ip);
}

function adminLockedUntil(ip) {
  const entry = adminFailures.get(ip);
  if (!entry) return 0;
  if (entry.until && Date.now() < entry.until) return entry.until;
  // Expired lock or below threshold — clear stale state.
  if (entry.until && Date.now() >= entry.until) adminFailures.delete(ip);
  return 0;
}

function requireAdmin(req, res, next) {
  const adminUser = process.env.ADMIN_USERNAME;
  const adminPass = process.env.ADMIN_PASSWORD;

  if (!adminUser || !adminPass) {
    return res.status(503).json({ ok: false, error: 'Admin access is not configured.' });
  }

  const ip = normalizeIp(req.ip || req.socket?.remoteAddress || '');
  // The trusted-IP grant is keyed on the socket address, never on req.ip.
  // req.ip honours X-Forwarded-For, which is attacker-controlled whenever
  // TRUST_PROXY is permissive (e.g. `true`) and the edge proxy appends rather
  // than replaces. Keying trust on a spoofable value would let an attacker
  // claim the operator's address, inherit the C-2 lockout bypass, and brute
  // force unthrottled. The socket address cannot be forged by the client.
  const socketIp = normalizeIp(req.socket?.remoteAddress || '');
  const lockedUntil = adminLockedUntil(ip);
  const isTrustedIp = (() => {
    const trusted = trustedAdminIp();
    return Boolean(trusted && socketIp && socketIp === trusted);
  })();
  if (lockedUntil && !isTrustedIp) {
    const retryAfter = Math.ceil((lockedUntil - Date.now()) / 1000);
    res.set('Retry-After', String(retryAfter));
    return res.status(429).json({ ok: false, error: 'Too many failed attempts. Try again later.' });
  }

  const authHeader = req.get('authorization') || '';
  const [scheme, encoded] = authHeader.split(' ');

  if (scheme !== 'Basic' || !encoded) {
    recordAdminFailure(ip);
    res.set('WWW-Authenticate', 'Basic realm="Admin"');
    return res.status(401).json({ ok: false, error: 'Admin authentication required.' });
  }

  let user = '';
  let pass = '';
  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    const idx = decoded.indexOf(':');
    user = idx === -1 ? decoded : decoded.slice(0, idx);
    pass = idx === -1 ? '' : decoded.slice(idx + 1);
  } catch {
    recordAdminFailure(ip);
    res.set('WWW-Authenticate', 'Basic realm="Admin"');
    return res.status(401).json({ ok: false, error: 'Admin authentication required.' });
  }

  // Constant-time username check. Compare BYTE lengths, not string lengths:
  // String#length counts UTF-16 code units while Buffer.from() counts bytes, so
  // a same-char-count multibyte username (e.g. 5 accented chars = 10 bytes)
  // passed the length guard and made timingSafeEqual throw a RangeError. That
  // throw escaped before recordAdminFailure() below, turning every admin
  // endpoint into an unaccounted 500 that never counted toward the lockout.
  const userBuf = Buffer.from(user, 'utf8');
  const adminBuf = Buffer.from(adminUser, 'utf8');
  const userOk = userBuf.length === adminBuf.length
    ? crypto.timingSafeEqual(userBuf, adminBuf)
    : false;
  const passOk = verifyAdminPassword(adminPass, pass);

  if (userOk && passOk) {
    clearAdminFailure(ip);
    // C-2: mark the socket address as trusted for future lockout bypass. The
    // grant expires after ADMIN_TRUST_TTL_MS so trust cannot become a
    // permanent hole, and it is keyed on a non-spoofable value.
    lastGoodAdminIp = socketIp || ip;
    lastGoodAdminAt = Date.now();
    return next();
  }

  // C-2: don't count failures from a previously-trusted IP either. This
  // means a trusted operator who fat-fingers their password won't
  // self-lock-out, and won't be subjected to a flood of 429s either.
  if (!isTrustedIp) {
    recordAdminFailure(ip);
  }
  res.set('WWW-Authenticate', 'Basic realm="Admin"');
  return res.status(401).json({ ok: false, error: 'Invalid admin credentials.' });
}

// --- helpers ---
// Express 4 only forwards *synchronous* throws to the error handler; it does
// not attach a .catch() to the promise an async handler returns. Without this
// wrapper any throw inside an async handler becomes an unhandled rejection,
// which terminates the process on Node >= 15 and takes the whole API down.
function asyncRoute(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function safeParseJson(raw, fallback = []) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

// --- routes ---

// Health
// Health. Public and unauthenticated, so it deliberately exposes nothing but
  // liveness — the mail transport mode, the destination mailbox and the raw
  // SMTP error string are reconnaissance and belong behind requireAdmin
  // (/api/admin/backup-status already returns getBackupConfig()).
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'jebri-safaris-api', time: new Date().toISOString() });
  });

// GET /api/tours — public tour catalog
// Query params:
//   category  — filter by category name
//   tier      — budget | mid | luxury
//   best_for  — solo | couples | family | group | honeymoon | photography | birding
//   q         — free-text search
//   sort      — price-asc | price-desc | duration-asc | featured (default)
app.get('/api/tours', (req, res) => {
  const { category, tier, best_for, q, sort } = req.query;
  let sql = 'SELECT * FROM tours WHERE 1=1';
  const params = [];
  if (category) { sql += ' AND category = ?'; params.push(String(category)); }
  if (tier) { sql += ' AND tier = ?'; params.push(String(tier)); }
  // Escape SQLite LIKE wildcards so user input is matched literally. Without
  // this, `?q=%` returns the entire catalog and `?q=_` matches any single
  // character — a search box that silently ignores the operator's intent.
  // The ESCAPE clause is required for the backslash to be honoured.
  const likeSafe = value => String(value).replace(/[\\%_]/g, m => `\\${m}`);
  if (best_for) {
    sql += " AND best_for LIKE ? ESCAPE '\\'";
    params.push(`%${likeSafe(best_for)}%`);
  }
  if (q) {
    const term = `%${likeSafe(q)}%`;
    sql += " AND (title LIKE ? ESCAPE '\\' OR summary LIKE ? ESCAPE '\\' OR location LIKE ? ESCAPE '\\')";
    params.push(term, term, term);
  }
  switch (sort) {
    case 'price-asc': sql += ' ORDER BY price_usd ASC'; break;
    case 'price-desc': sql += ' ORDER BY price_usd DESC'; break;
    case 'duration-asc': sql += ' ORDER BY duration_days ASC'; break;
    default: sql += ' ORDER BY featured DESC, price_usd ASC';
  }
  const tours = db.prepare(sql).all(...params).map(t => ({
    ...t,
    price_usd: Number(t.price_usd) || 0,
    featured: Boolean(t.featured),
    itinerary: safeParseJson(t.itinerary),
    included: safeParseJson(t.included),
    not_included: safeParseJson(t.not_included),
    gallery: safeParseJson(t.gallery),
    best_for: safeParseJson(t.best_for),
  }));
  res.json({ ok: true, tours });
});

function formatTourRow(t) {
  if (!t) return null;
  return {
    ...t,
    price_usd: Number(t.price_usd) || 0,
    featured: Boolean(t.featured),
    itinerary: safeParseJson(t.itinerary),
    included: safeParseJson(t.included),
    not_included: safeParseJson(t.not_included),
    gallery: safeParseJson(t.gallery),
    best_for: safeParseJson(t.best_for),
  };
}

app.get('/api/tours/by-slug/:slug', (req, res) => {
  const t = db.prepare('SELECT * FROM tours WHERE slug = ?').get(req.params.slug);
  if (!t) return res.status(404).json({ ok: false, error: 'Tour not found' });
  res.json({ ok: true, tour: formatTourRow(t) });
});

app.get('/api/tours/:id', (req, res) => {
  const t = db.prepare('SELECT * FROM tours WHERE id = ?').get(req.params.id);
  if (!t) return res.status(404).json({ ok: false, error: 'Tour not found' });
  res.json({
    ok: true,
    tour: formatTourRow(t),
  });
});

// Admin endpoints for managing inquiries, trip plans, and backups
app.get('/api/admin/backup-status', adminReadLimiter, requireAdmin, (_req, res) => {
  res.json({ ok: true, backup: getBackupConfig(), backups: listBackupFiles(), email: getMailerStatus() });
});

app.post('/api/admin/backup', adminWriteLimiter, requireAdmin, async (_req, res) => {
  try {
    const backup = await createDatabaseBackup({ label: 'manual' });
    res.json({ ok: true, backup });
  } catch (_error) {
    res.status(500).json({ ok: false, error: 'Backup failed.' });
  }
});

app.get('/api/admin/inquiries', adminReadLimiter, requireAdmin, (req, res) => {
  const status = req.query.status ? String(req.query.status) : '';
  const { limit, offset } = parsePagination(req.query);

  let sql = 'SELECT * FROM inquiries';
  const params = [];
  if (status) {
    sql += ' WHERE status = ?';
    params.push(status);
  }
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const inquiries = db.prepare(sql).all(...params);
  const total = status
    ? db.prepare('SELECT COUNT(*) AS n FROM inquiries WHERE status = ?').get(status).n
    : db.prepare('SELECT COUNT(*) AS n FROM inquiries').get().n;

  res.json({ ok: true, inquiries, pagination: { limit, offset, total } });
});

app.get('/api/admin/inquiries/:id', adminReadLimiter, requireAdmin, (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ ok: false, error: 'Inquiry id must be a positive integer.' });
  const inquiry = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(id);
  if (!inquiry) return res.status(404).json({ ok: false, error: 'Inquiry not found.' });
  res.json({ ok: true, inquiry });
});

app.patch('/api/admin/inquiries/:id/status', adminWriteLimiter, requireAdmin, (req, res) => {
  const parsed = adminStatusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.issues[0].message });

  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ ok: false, error: 'Inquiry id must be a positive integer.' });

  const inquiry = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(id);
  if (!inquiry) return res.status(404).json({ ok: false, error: 'Inquiry not found.' });

  db.prepare('UPDATE inquiries SET status = ? WHERE id = ?').run(parsed.data.status, id);
  res.json({ ok: true, inquiry: { ...inquiry, status: parsed.data.status } });
});

app.get('/api/admin/plan-submissions', adminReadLimiter, requireAdmin, (req, res) => {
  const status = req.query.status ? String(req.query.status) : '';
  const { limit, offset } = parsePagination(req.query);

  let sql = 'SELECT * FROM plan_submissions';
  const params = [];
  if (status) {
    sql += ' WHERE status = ?';
    params.push(status);
  }
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const submissions = db.prepare(sql).all(...params);
  const total = status
    ? db.prepare('SELECT COUNT(*) AS n FROM plan_submissions WHERE status = ?').get(status).n
    : db.prepare('SELECT COUNT(*) AS n FROM plan_submissions').get().n;

  res.json({ ok: true, submissions, pagination: { limit, offset, total } });
});

app.patch('/api/admin/plan-submissions/:id/status', adminWriteLimiter, requireAdmin, (req, res) => {
  const parsed = adminStatusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.issues[0].message });

  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ ok: false, error: 'Trip plan id must be a positive integer.' });

  const submission = db.prepare('SELECT * FROM plan_submissions WHERE id = ?').get(id);
  if (!submission) return res.status(404).json({ ok: false, error: 'Trip plan submission not found.' });

  db.prepare('UPDATE plan_submissions SET status = ? WHERE id = ?').run(parsed.data.status, id);
  res.json({ ok: true, submission: { ...submission, status: parsed.data.status } });
});

// GET /api/reviews — public, only approved
app.get('/api/reviews', (req, res) => {
  const rows = db.prepare(
    `SELECT id, author, rating, body, tour_id, source, created_at
     FROM reviews WHERE approved = 1 ORDER BY created_at DESC LIMIT 50`
  ).all();
  res.json({ ok: true, reviews: rows });
});

// POST /api/reviews — submit review (admin-approved before showing)
app.post('/api/reviews', formLimiter, (req, res) => {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.issues[0].message });
  const { author, rating, body, tour_id, website } = parsed.data;
  // Honeypot: silent accept, never insert, never reveal the trap.
  if (website) {
    return res.json({ ok: true, message: 'Thank you! Your review will appear once approved.' });
  }
  db.prepare(
    `INSERT INTO reviews (author, rating, body, tour_id, source, approved, created_at)
     VALUES (?, ?, ?, ?, 'direct', 0, datetime('now'))`
  ).run(author, rating, body, tour_id || null);
  res.json({ ok: true, message: 'Thank you! Your review will appear once approved.' });
});

// POST /api/inquiries — booking / contact form
app.post('/api/inquiries', formLimiter, asyncRoute(async (req, res) => {
  const parsed = inquirySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.issues[0].message });
  const d = parsed.data;
  if (d.website) return res.status(200).json({ ok: true }); // honeypot: silent accept

  // L-1: enforce group size cap server-side too. A client submitting
  // travelers=4 for a tour that only takes 1 is silently accepted today;
  // we surface a clear error instead.
  if (d.tour_id) {
    const tour = db.prepare('SELECT title, group_size_max FROM tours WHERE id = ?').get(d.tour_id);
    if (!tour) {
      return res.status(400).json({ ok: false, error: 'The selected tour could not be found.' });
    }
    if (d.travelers && d.travelers > tour.group_size_max) {
      return res.status(400).json({
        ok: false,
        error: `Traveler count (${d.travelers}) exceeds the maximum group size for "${tour.title}" (${tour.group_size_max}). Please reduce travelers or pick a different tour.`,
      });
    }
  }

  const result = db.prepare(
    `INSERT INTO inquiries
     (name, email, phone, country, tour_id, travel_date, travelers, message, source, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', datetime('now'))`
  ).run(
    d.name, d.email, d.phone || null, d.country || null, d.tour_id || null,
    d.travel_date || null, d.travelers || null, d.message, d.source
  );

  const ref = `JS-${String(result.lastInsertRowid).padStart(5, '0')}`;

  const emailResult = await sendInquiryEmail({
    reference: ref,
    kind: d.source,
    heading: d.source === 'booking' ? 'New booking enquiry' : (d.source === 'tour-inquiry' ? 'New tour enquiry' : 'New contact message'),
    name: d.name,
    email: d.email,
    phone: d.phone,
    country: d.country,
    travel_date: d.travel_date,
    travelers: d.travelers,
    message: d.message,
  });

  res.json({
    ok: true,
    reference: ref,
    emailDelivered: emailResult.ok,
    message: emailResult.ok
      ? 'Inquiry received — we will reply within 24 hours.'
      : 'Inquiry saved, but email delivery is temporarily unavailable. Our team can still retrieve your request.',
  });
}));

// POST /api/plan — full trip planner submission with selected items + activities
app.post('/api/plan', formLimiter, asyncRoute(async (req, res) => {
  const parsed = plannerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.issues[0].message });
  const d = parsed.data;
  if (d.website) return res.status(200).json({ ok: true });

  const travelDate = d.travel_date
    || (d.start_date && d.end_date ? `${d.start_date} – ${d.end_date}` : d.start_date || d.end_date || null);

  // Server-side canonical lookup. The client only sends {id, kind} for each
  // item; titles, prices, durations, and itineraries come from our own
  // catalog/DB. This prevents a malicious client from injecting custom
  // prices, titles, or HTML into the founder email body.
  const travelers = Math.max(1, Math.min(50, Number(d.travelers) || 1));
  const canonicalItems = [];
  const itinerary = [];
  let perPersonTotal = 0;   // multiplied by travelers below
  let flatTotal = 0;        // added once, never multiplied
  let requiresCustomQuote = false;
  const skipped = [];

  for (const it of d.items) {
    if (it.kind === 'tour') {
      const row = db.prepare('SELECT id, title, slug, category, location, duration_days, price_usd, itinerary FROM tours WHERE id = ?').get(it.id);
      if (!row) { skipped.push({ id: it.id, kind: 'tour', reason: 'not_found' }); continue; }
      // Canonical pricing lives in shared-pricing.js so this can never drift
      // from what the tour detail page and the planner show the visitor.
      const price = tourPricePerPerson(row, travelers);
      let parsedItin = [];
      try { parsedItin = JSON.parse(row.itinerary || '[]'); } catch { parsedItin = []; }
      perPersonTotal += price;
      canonicalItems.push({
        id: row.id,
        kind: 'tour',
        title: row.title,
        detail: `${row.location} · ${row.duration_days} days · ${row.category}`,
        duration: `${row.duration_days} days`,
        from: price,
        is_per_person: true,
        requires_quote: false,
      });
      for (const day of parsedItin) {
        itinerary.push({
          day: day.day,
          title: `${row.title} — Day ${day.day}: ${day.title}`,
          detail: day.detail,
        });
      }
    } else if (it.kind === 'activity') {
      const a = getActivityById(it.id);
      if (!a) { skipped.push({ id: it.id, kind: 'activity', reason: 'not_found' }); continue; }
      // M-5: per-person activities are multiplied by traveler count below;
      // flat-fee activities (is_per_person === false, e.g. a private
      // helicopter or charter) are added once and not multiplied.
      const isPerPerson = a.is_per_person !== false;
      if (a.requires_quote) requiresCustomQuote = true;
      canonicalItems.push({
        id: a.id,
        kind: 'activity',
        title: a.title,
        detail: a.category,
        duration: a.duration,
        from: a.requires_quote ? null : a.price_usd,
        is_per_person: isPerPerson,
        requires_quote: Boolean(a.requires_quote),
      });
      if (!a.requires_quote) {
        if (isPerPerson) perPersonTotal += a.price_usd;
        else flatTotal += a.price_usd;
      }
    } else {
      // 'custom' — accepted by schema but carries no canonical data.
      // We don't trust any user-supplied details; just acknowledge it.
      canonicalItems.push({ id: it.id, kind: 'custom', title: 'Custom request', detail: '', duration: '', from: 0, is_per_person: false });
    }
  }

  if (canonicalItems.length === 0) {
    return res.status(400).json({ ok: false, error: 'None of the selected items were recognized. Please pick at least one tour or activity from the catalog.' });
  }

  // L-1 + M-5: enforce per-tour group size cap and compute the estimate.
  // For per-person items we multiply by traveler count; for flat-fee items
  // we add once.
  for (const it of canonicalItems) {
    if (it.kind !== 'tour') continue;
    const row = db.prepare('SELECT group_size_max FROM tours WHERE id = ?').get(it.id);
    if (row && travelers > row.group_size_max) {
      return res.status(400).json({
        ok: false,
        error: `Traveler count (${travelers}) exceeds the maximum group size for "${it.title}" (${row.group_size_max}). Please reduce travelers or remove this tour.`,
      });
    }
  }
  const estimateGrandTotal = perPersonTotal * travelers + flatTotal;

  // Persist the canonical items JSON (server-built, not client-supplied).
  const result = db.prepare(
    `INSERT INTO plan_submissions
     (reference, name, email, phone, country, travel_date, start_date, end_date, flight_date, travelers, tier, budget, message, items_json, estimate_total, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', datetime('now'))`
  ).run(
    'pending', d.name, d.email, d.phone || null, d.country || null,
    travelDate, d.start_date || null, d.end_date || null, d.flight_date || null,
    travelers, d.tier || null, d.budget || null,
    d.message || null, JSON.stringify(canonicalItems), estimateGrandTotal
  );

  const id = result.lastInsertRowid;
  const ref = `JP-${String(id).padStart(5, '0')}`;
  db.prepare(`UPDATE plan_submissions SET reference = ? WHERE id = ?`).run(ref, id);

  // Email the founder with the canonical data we just built.
  const emailResult = await sendInquiryEmail({
    reference: ref,
    kind: 'planner',
    heading: `Custom trip plan — ${canonicalItems.length} item${canonicalItems.length !== 1 ? 's' : ''}`,
    name: d.name,
    email: d.email,
    phone: d.phone,
    country: d.country,
    travel_date: travelDate,
    start_date: d.start_date,
    end_date: d.end_date,
    flight_date: d.flight_date,
    duration: d.duration,
    travelers,
    tier: d.tier,
    budget: d.budget,
    message: d.message,
    items: canonicalItems,
    itinerary: itinerary.slice(0, 60), // cap at 60 days in email body
    estimate_total: estimateGrandTotal,
    estimate_label: requiresCustomQuote
      ? 'Estimate excludes one or more quote-required items. Final quote within 24 hours.'
      : 'Indicative — based on selected tours & activities. Final quote within 24 hours.',
  });

  res.json({
    ok: true,
    reference: ref,
    emailDelivered: emailResult.ok,
    message: emailResult.ok
      ? 'Trip plan received — we will email you a tailored quote within 24 hours.'
      : 'Trip plan saved, but email delivery is temporarily unavailable. Our team can still retrieve your request.',
    ...(skipped.length ? { skipped } : {}),
  });
}));

// POST /api/newsletter
app.post('/api/newsletter', formLimiter, (req, res) => {
  const parsed = newsletterSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: 'Invalid email.' });
  if (parsed.data.website) return res.status(200).json({ ok: true }); // honeypot: silent accept
  const email = parsed.data.email.toLowerCase();
  try {
    db.prepare(
      `INSERT INTO newsletter (email, created_at) VALUES (?, datetime('now'))`
    ).run(email);
    res.json({ ok: true, message: 'Subscribed — see you on the next dispatch.' });
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) {
      return res.json({ ok: true, message: 'You are already subscribed.' });
    }
    throw e;
  }
});

// GET /api/stats — public summary (counts for trust badges)
app.get('/api/stats', (_req, res) => {
    // These are *enquiries* (form + plan submissions), not completed trips.
    // Reported under an honest key so no surface can present them as
    // "Happy Travelers" — that overstated unbooked interest as delivered trips.
    const inquiries = db.prepare(`
      SELECT
        COALESCE((SELECT SUM(travelers) FROM inquiries), 0) +
        COALESCE((SELECT SUM(travelers) FROM plan_submissions), 0) AS n
    `).get().n || 0;
    const tours = db.prepare(`SELECT COUNT(*) AS n FROM tours`).get().n;
    const reviews = db.prepare(`SELECT COUNT(*) AS n FROM reviews WHERE approved=1`).get().n;
    const avgRatingRow = db.prepare(`SELECT ROUND(AVG(rating), 1) AS avg FROM reviews WHERE approved=1`).get();
    // null, never a fabricated fallback: an invented 4.9 is a false claim and
    // also produced a rating above an empty testimonial list.
    const avg_rating = avgRatingRow?.avg ?? null;
  // M-1: configurable founding year so the trust badge stays correct
  // without touching code. Default 2026 matches the live Header/Footer copy.
  const founded = Number(process.env.COMPANY_FOUNDED_YEAR) || 2026;
  const years = Math.max(0, new Date().getFullYear() - founded);
  res.json({ ok: true, stats: { inquiries, tours, reviews, avg_rating, years } });
});

// --- in production, serve the built SPA ---
if (isProd) {
  const dist = path.resolve(__dirname, '..', 'dist');
  // Cache policy is split by mutability, because a single maxAge cannot be
  // correct for both kinds of file in dist/:
  //
  //   /assets/*  Vite emits content-hashed names (index-<hash>.js). A change
  //              produces a new URL, so these are safe to pin immutably.
  //   /vendor/*  Self-hosted third-party libraries under public/vendor/. The
  //              library version is part of the path (leaflet-1.9.4/...), so
  //              upgrading changes the URL and the same immutability argument
  //              holds. If you ever vendor something at a *stable* path, move
  //              it out of this mount or it will be pinned for a year.
  //   dist/*     public/ passthrough (logo.jpg, og-cover.jpg, favicon.png).
  //              These keep stable names, so an immutable year would strand
  //              users on a stale logo after a replace.
  //   index.html the document that points at the current hashed assets. It MUST
  //              NOT be cached: a 7-day maxAge here pins every repeat visitor to
  //              an old build whose asset URLs no longer exist -> blank page
  //              after deploy.
  const immutableMount = { maxAge: '1y', immutable: true };
  app.use('/assets', express.static(path.join(dist, 'assets'), immutableMount));
  app.use('/vendor', express.static(path.join(dist, 'vendor'), immutableMount));
  app.use(express.static(dist, {
    index: false,
    maxAge: '1h',
    setHeaders(res, filePath) {
      if (path.basename(filePath) === 'index.html') {
        res.setHeader('Cache-Control', 'no-cache, must-revalidate');
      }
    },
  }));
  // SPA fallback for any non-/api GET so unknown API paths still 404 with
  // a proper JSON error (M-4). React Router handles the rest on the client.
  app.get(/^(?!\/api(\/|$)).*/, (_req, res) => {
    res.set('Cache-Control', 'no-cache, must-revalidate');
    res.sendFile(path.join(dist, 'index.html'));
  });
}

// --- error handler ---
app.use((err, _req, res, _next) => {
  if (isProd) {
    // Never leak stack traces or internal messages to clients in production.
    console.error('API error:', err.message);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
  console.error('API error:', err);
  res.status(500).json({ ok: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`✓ Jebri Safaris API listening on http://localhost:${PORT}`);
});
