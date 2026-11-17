// server/db.js — SQLite schema, helpers, and seed data.
//
// Database engine: better-sqlite3 (synchronous, single-file, ideal for one
// Node process). We support two deployment paths through one env var:
//
//   Local dev (Windows / Mac / Linux):
//     DATABASE_URL=file:./data/jolo.db   ← default, used by `npm run dev`
//
//   Render (production backend, persistent disk):
//     DATABASE_URL=file:/var/data/jolo.db  (mount /var/data as a Render disk)
//
//   (Future) Turso/libSQL:
//     DATABASE_URL=libsql://...   — requires switching the engine to
//     @libsql/client AND making server/index.js async. Not done in this
//     deployment; see DEPLOY.md for rationale.

import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { CATALOG_VERSION, TOUR_CATALOG } from './tourCatalog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve the on-disk DB path. Accepts:
//   • DATABASE_URL=file:/abs/path     (preferred, for Render persistent disks)
//   • DATABASE_URL=file:./relative     (relative to repo root)
//   • DATABASE_URL unset              (defaults to ./data/jolo.db in repo root)
// Anything else (libsql://, postgres://, …) is rejected up-front so the
// failure mode is loud and immediate, not a confusing later error.
const databaseUrl = process.env.DATABASE_URL || `file:${path.resolve(__dirname, '..', 'data', 'jolo.db')}`;
if (!databaseUrl.startsWith('file:')) {
  throw new Error(
    `Unsupported DATABASE_URL: ${databaseUrl}\n` +
    `This project currently uses better-sqlite3 with a local file. ` +
    `For Turso/Postgres, see DEPLOY.md for the async-conversion path.`
  );
}
const dbPath = databaseUrl.slice('file:'.length);
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

// Backups live OUTSIDE the project tree by default so a `git clean` or
// project-level backup doesn't sweep them up. On Render, point BACKUP_DIR
// at a directory on the persistent disk (e.g. /var/data/backups) so they
// survive deploys.
const backupDir = process.env.BACKUP_DIR
  ? path.resolve(process.env.BACKUP_DIR)
  : path.resolve(__dirname, '..', '..', '..', 'backups', 'jolo-safaris');
if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
// Wait rather than immediately throwing SQLITE_BUSY when two writers overlap
// (e.g. two visitors submitting the contact form at the same moment). Without
// this the write throws, and from an async Express 4 handler that throw was an
// unhandled rejection that killed the process.
db.pragma('busy_timeout = 5000');

const backupEnabled = process.env.BACKUP_ENABLED !== 'false';
const backupIntervalHours = Number(process.env.BACKUP_INTERVAL_HOURS || 24);
const backupRetentionDays = Number(process.env.BACKUP_RETENTION_DAYS || 7);

export function getBackupConfig() {
  return {
    enabled: backupEnabled,
    intervalHours: Number.isFinite(backupIntervalHours) && backupIntervalHours > 0 ? backupIntervalHours : 24,
    retentionDays: Number.isFinite(backupRetentionDays) && backupRetentionDays >= 0 ? backupRetentionDays : 7,
    directory: backupDir,
    databasePath: dbPath,
  };
}

export function listBackupFiles() {
  if (!fs.existsSync(backupDir)) return [];
  return fs.readdirSync(backupDir)
    .filter(name => name.endsWith('.db') && !name.startsWith('.tmp-'))
    .map(name => {
      const fullPath = path.join(backupDir, name);
      const stat = fs.statSync(fullPath);
      return {
        name,
        path: fullPath,
        sizeBytes: stat.size,
        modifiedAt: stat.mtime.toISOString(),
      };
    })
    .sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));
}

function pruneOldBackups() {
  if (!backupEnabled || backupRetentionDays <= 0) return;
  const cutoff = Date.now() - backupRetentionDays * 24 * 60 * 60 * 1000;
  for (const file of listBackupFiles()) {
    if (new Date(file.modifiedAt).getTime() < cutoff) {
      fs.unlinkSync(file.path);
    }
  }
}

export async function createDatabaseBackup({ label = 'manual' } = {}) {
  if (!backupEnabled) throw new Error('Database backups are disabled.');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const tempPath = path.join(backupDir, `.tmp-${label}-${timestamp}.db`);
  const backupPath = path.join(backupDir, `${label}-${timestamp}.db`);

  try {
    // better-sqlite3's backup() is the safe online-backup API — handles WAL.
    await db.backup(tempPath);
    fs.renameSync(tempPath, backupPath);
    pruneOldBackups();
    const stat = fs.statSync(backupPath);
    return {
      path: backupPath,
      sizeBytes: stat.size,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    throw error;
  }
}

function scheduleBackups() {
  if (!backupEnabled || !Number.isFinite(backupIntervalHours) || backupIntervalHours <= 0) return;

  const run = () => {
    createDatabaseBackup({ label: 'scheduled' }).then(() => {
      console.log('✓ Database backup created');
    }).catch((error) => {
      console.error('Database backup failed:', error.message);
    });
  };

  console.log(`📦 Backup routine enabled: every ${backupIntervalHours} hour(s), retention ${backupRetentionDays} day(s)`);
  setInterval(run, backupIntervalHours * 60 * 60 * 1000);
  if (listBackupFiles().length === 0) {
    run();
  }
}

scheduleBackups();

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tours (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      tier TEXT NOT NULL DEFAULT 'mid',
      best_for TEXT NOT NULL DEFAULT '[]',
      location TEXT NOT NULL,
      duration_days INTEGER NOT NULL,
      price_usd INTEGER NOT NULL,
      group_size_max INTEGER NOT NULL DEFAULT 6,
      summary TEXT NOT NULL,
      hero_image TEXT NOT NULL,
      itinerary TEXT NOT NULL DEFAULT '[]',
      included TEXT NOT NULL DEFAULT '[]',
      not_included TEXT NOT NULL DEFAULT '[]',
      gallery TEXT NOT NULL DEFAULT '[]',
      featured INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      country TEXT,
      tour_id TEXT,
      travel_date TEXT,
      travelers INTEGER,
      message TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'contact',
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_inq_email ON inquiries(email);
    CREATE INDEX IF NOT EXISTS idx_inq_tour ON inquiries(tour_id);

    CREATE TABLE IF NOT EXISTS newsletter (
      email TEXT PRIMARY KEY,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author TEXT NOT NULL,
      rating INTEGER NOT NULL,
      body TEXT NOT NULL,
      tour_id TEXT,
      source TEXT NOT NULL DEFAULT 'direct',
      approved INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS plan_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      country TEXT,
      travel_date TEXT,
      travelers INTEGER,
      tier TEXT,
      budget TEXT,
      message TEXT,
      items_json TEXT NOT NULL,
      estimate_total INTEGER,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_plan_reference ON plan_submissions(reference);
    CREATE INDEX IF NOT EXISTS idx_plan_email ON plan_submissions(email);

    -- Records which version of server/tourCatalog.js is currently reflected in
    -- the tours table, so the boot-time sync can be skipped when the code catalog
    -- has not changed. Without this the sync rewrote every tour column on every
    -- restart and silently reverted any price/copy correction made in the admin.
    CREATE TABLE IF NOT EXISTS catalog_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Lightweight migrations for existing databases
  const planColumns = db.prepare(`PRAGMA table_info(plan_submissions)`).all().map(c => c.name);
  if (!planColumns.includes('start_date')) db.exec(`ALTER TABLE plan_submissions ADD COLUMN start_date TEXT`);
  if (!planColumns.includes('end_date')) db.exec(`ALTER TABLE plan_submissions ADD COLUMN end_date TEXT`);
  if (!planColumns.includes('flight_date')) db.exec(`ALTER TABLE plan_submissions ADD COLUMN flight_date TEXT`);

  // Seed tours on first boot if empty.
  // M-9: Set SEED_DISABLED=true to skip seeding entirely (e.g. on a box
  // where the catalog is hand-managed and seeding would clobber edits).
  const seedDisabled = process.env.SEED_DISABLED === 'true';
  let count = db.prepare('SELECT COUNT(*) AS n FROM tours').get().n;
  if (seedDisabled) {
    // Hand-managed deployment: touch nothing at all. The purge below used to
    // run above this guard, which silently deleted tours (and their reviews)
    // on every restart for anyone who set this flag to protect their edits.
    console.log(`⏭  SEED_DISABLED=true — skipping catalog sync and purge (current count: ${count})`);
    return;
  }
  // The purge statements below exist to retire tours that were dropped from the
  // catalog. They match on loose title/location keywords, which is too blunt:
  // e.g. LIKE '%zanzibar%' also matched the live tour
  // "serengeti-zanzibar-escape-7-day", deleting it on every boot and — via the
  // orphan sweep above — permanently destroying any review attached to it.
  // Every purge is therefore constrained to ids absent from the live catalog.
  const liveTourIds = TOUR_CATALOG.map(tour => tour.id);
  const livePlaceholders = liveTourIds.map(() => '?').join(',');
  const removedTourIds = [
    'kilimanjaro-lemosho', 'kilimanjaro-luxury', 'kilimanjaro-honeymoon',
    'maasai-mara-luxury', 'great-migration-mara',
    'budget-cycling-safari', 'budget-chimp-gombe', 'budget-ruaha-6d',
    'budget-lake-natron', 'oldoinyo-lengai-climb', 'ol-doinyo-lengai',
    'mid-horse-riding', 'mid-ruaha-classic-7d', 'mid-chimp-gorilla-12d',
    'mid-stargazing-8d', 'birding-specialist-10d', 'maasai-cultural-immersion',
    'lux-conservation-researcher', 'lux-diving-pemba', 'lux-pemba-dive',
    'zanzibar-backpacker', 'zanzibar-scuba-beach', 'zanzibar-honeymoon',
    'zanzibar-wellness-retreat',
  ];
  const removedPlaceholders = removedTourIds.map(() => '?').join(',');
  db.prepare(`DELETE FROM tours WHERE id IN (${removedPlaceholders}) AND id NOT IN (${livePlaceholders})`).run(...removedTourIds, ...liveTourIds);
  db.prepare(`DELETE FROM reviews WHERE tour_id IN (${removedPlaceholders}) AND tour_id NOT IN (${livePlaceholders})`).run(...removedTourIds, ...liveTourIds);
db.prepare(`
    DELETE FROM tours
    WHERE id NOT IN (${livePlaceholders})
      AND (lower(title) LIKE '%kilimanjaro%'
       OR lower(title) LIKE '%maasai mara%'
       OR lower(title) LIKE '%zanzibar%'
       OR lower(title) LIKE '%lake natron%'
       OR lower(title) LIKE '%gombe%'
       OR lower(title) LIKE '%chimp%'
       OR lower(title) LIKE '%gorilla%'
       OR lower(title) LIKE '%astronomy%'
       OR lower(title) LIKE '%stargazing%'
       OR lower(title) LIKE '%lengai%'
       OR lower(title) LIKE '%horseback%'
       OR lower(title) LIKE '%horse riding%'
       OR lower(title) LIKE '%ruaha%'
       OR lower(title) LIKE '%pemba%'
       OR lower(location) LIKE '%pemba%'
        OR lower(title) LIKE '%birding%'
        OR lower(title) LIKE '%conservation researcher%')
  `).run(...liveTourIds);
      db.prepare(`DELETE FROM reviews WHERE tour_id IS NOT NULL AND tour_id NOT IN (SELECT id FROM tours)`).run();
  db.prepare(`DELETE FROM tours WHERE id NOT IN (${livePlaceholders}) AND best_for LIKE '%birding%'`).run(...liveTourIds);
  // The catalog sync only runs when the code catalog has actually advanced.
//
// It previously ran unconditionally on every boot and the upsert rewrites all
// 17 tour columns, so any price, itinerary or inclusion correction made through
// the admin was silently reverted on the next restart or deploy. The gate keys
// off CATALOG_VERSION recorded in catalog_meta, so editing tourCatalog.js and
// bumping its version still propagates the change, while operator edits survive
// unrelated restarts.
//
// Force a resync with: CATALOG_FORCE_SYNC=true npm start
const appliedVersion = db
  .prepare(`SELECT value FROM catalog_meta WHERE key = 'catalog_version'`)
  .get()?.value;
const catalogNeedsSync =
  process.env.CATALOG_FORCE_SYNC === 'true' ||
  appliedVersion !== CATALOG_VERSION ||
  // A tours table that is empty or missing catalog rows still needs a full sync,
  // regardless of what the recorded version claims.
  db.prepare(`SELECT COUNT(*) AS n FROM tours WHERE id IN (${livePlaceholders})`).get(...liveTourIds).n !== liveTourIds.length;

  if (!seedDisabled && catalogNeedsSync) {
    const tourIds = TOUR_CATALOG.map(tour => tour.id);
    const placeholders = tourIds.map(() => '?').join(',');
    const upsertTour = db.prepare(`
      INSERT INTO tours
        (id, title, slug, category, tier, best_for, location, duration_days, price_usd, group_size_max,
         summary, hero_image, itinerary, included, not_included, gallery, featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        slug = excluded.slug,
        category = excluded.category,
        tier = excluded.tier,
        best_for = excluded.best_for,
        location = excluded.location,
        duration_days = excluded.duration_days,
        price_usd = excluded.price_usd,
        group_size_max = excluded.group_size_max,
        summary = excluded.summary,
        hero_image = excluded.hero_image,
        itinerary = excluded.itinerary,
        included = excluded.included,
        not_included = excluded.not_included,
        gallery = excluded.gallery,
        featured = excluded.featured
    `);
    const syncCatalog = db.transaction(() => {
      db.prepare(`DELETE FROM tours WHERE id NOT IN (${placeholders})`).run(...tourIds);
      db.prepare(`DELETE FROM reviews WHERE tour_id IS NOT NULL AND tour_id NOT IN (${placeholders})`).run(...tourIds);
      for (const tour of TOUR_CATALOG) {
        upsertTour.run(
          tour.id, tour.title, tour.slug, tour.category, tour.tier,
          JSON.stringify(tour.best_for), tour.location, tour.duration_days,
          tour.price_usd, tour.group_size_max, tour.summary, tour.hero_image,
          JSON.stringify(tour.itinerary), JSON.stringify(tour.included),
          JSON.stringify(tour.not_included), JSON.stringify(tour.gallery),
          tour.featured ? 1 : 0
        );
      }
    });
    syncCatalog();
    db.prepare(
      `INSERT INTO catalog_meta (key, value) VALUES ('catalog_version', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    ).run(CATALOG_VERSION);
    count = db.prepare('SELECT COUNT(*) AS n FROM tours').get().n;
    console.log(`✓ Synchronized ${count} tours (${CATALOG_VERSION}).`);
  } else if (!seedDisabled) {
    // Skipped on purpose: the code catalog has not changed since the last sync,
    // so existing tour rows are left exactly as the operator has them.
    count = db.prepare('SELECT COUNT(*) AS n FROM tours').get().n;
    console.log(`⏭  Catalog unchanged since last sync (${CATALOG_VERSION}) — leaving ${count} tour rows untouched.`);
  }
  if (count === 0) {
    console.log('Seeding tour catalog…');
    const insert = db.prepare(`
      INSERT INTO tours
        (id, title, slug, category, tier, best_for, location, duration_days, price_usd, group_size_max,
         summary, hero_image, itinerary, included, not_included, gallery, featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Tiers: budget (solo / backpacker), mid (standard comfort), luxury (high-end / private)
    // Best-for tags: solo, couples, family, group, honeymoon, photography, birding
    const seedTours = [
      // =============================================================
      // LUXURY TIER — premium camps, private vehicle, larger groups OK
      // =============================================================
      {
        id: 'serengeti-classic',
        title: 'Serengeti Classic Safari',
        slug: 'serengeti-classic',
        category: 'Wildlife Safari',
        tier: 'mid',
        best_for: ['couples', 'family', 'group'],
        location: 'Serengeti, Tanzania',
        duration_days: 6,
        price_usd: 3450,
        group_size_max: 6,
        featured: 1,
        summary: 'Six days of breathtaking game drives across the Serengeti plains with luxury tented camps and expert local guides.',
        hero_image: '/assets/uploads/baloon.jpeg',
        itinerary: [
          { day: 1, title: 'Arrival in Arusha', detail: 'Meet & greet at Kilimanjaro Airport. Transfer to your boutique lodge.' },
          { day: 2, title: 'Tarangire National Park', detail: 'Full-day game drive among giant baobabs and elephant herds.' },
          { day: 3, title: 'Into the Serengeti', detail: 'Drive through the Ngorongoro highlands into the central Serengeti.' },
          { day: 4, title: 'Central Serengeti game drives', detail: 'Morning and afternoon drives — lions, leopards, cheetahs.' },
          { day: 5, title: 'Northern Serengeti', detail: 'Optional hot-air balloon, then picnic in the Mara River valley.' },
          { day: 6, title: 'Return to Arusha', detail: 'Final game drive en route, evening flight home or extension.' },
        ],
        included: ['All park fees & conservation charges', 'Professional safari guide', '4x4 safari vehicle', 'Luxury tented camp lodging', 'All meals & drinking water', 'Airport transfers'],
        not_included: ['International flights', 'Travel insurance', 'Visa fees', 'Tips & gratuities', 'Alcoholic beverages', 'Personal expenses'],
        gallery: [
          '/assets/uploads/wilderbeast.jpeg',
          '/assets/uploads/wilderbeast river.jpeg',
          '/assets/uploads/zebra sunset.jpeg',
        ],
      },
      // (Mountain Trekking tours removed — Kilimanjaro Lemosho, etc.)
      {
        id: 'maasai-mara-luxury',
        title: 'Maasai Mara Luxury Escape',
        slug: 'maasai-mara-luxury',
        category: 'Wildlife Safari',
        tier: 'luxury',
        best_for: ['couples', 'honeymoon', 'group'],
        location: 'Maasai Mara, Kenya',
        duration_days: 5,
        price_usd: 4200,
        group_size_max: 4,
        featured: 1,
        summary: 'Five days of unmatched luxury in the heart of Kenya\'s most famous reserve — sundowners, cheetah tracking, and Maasai culture.',
        hero_image: '/assets/uploads/lion resting.jpeg',
        itinerary: [
          { day: 1, title: 'Nairobi → Maasai Mara', detail: 'Fly into the reserve, afternoon game drive.' },
          { day: 2, title: 'Big cats of the Mara', detail: 'Full-day drive tracking lions, leopards, cheetahs.' },
          { day: 3, title: 'Cultural visit', detail: 'Meet Maasai community, optional walking safari.' },
          { day: 4, title: 'Mara River', detail: 'Witness wildlife along the great river.' },
          { day: 5, title: 'Return to Nairobi', detail: 'Final drive and flight back.' },
        ],
        included: ['Internal flights', 'Luxury lodge accommodation', 'Private 4x4 & guide', 'All meals & beverages', 'Park fees'],
        not_included: ['International flights', 'Travel insurance', 'Tips', 'Personal expenses'],
        gallery: [
          '/assets/uploads/lion cubs.jpeg',
          '/assets/uploads/masai.jpeg',
          '/assets/uploads/masai huddle.jpeg',
        ],
      },

      // =============================================================
      // BUDGET / SOLO — backpacker-friendly, camping or basic lodges
      // =============================================================
      {
        id: 'budget-solo-backpacker',
        title: 'Solo Backpacker Safari — 4 Days',
        slug: 'budget-solo-backpacker',
        category: 'Wildlife Safari',
        tier: 'budget',
        best_for: ['solo', 'photography'],
        location: 'Tarangire & Ngorongoro, Tanzania',
        duration_days: 4,
        price_usd: 720,
        group_size_max: 1,
        featured: 1,
        summary: 'Designed for the solo traveler who wants real safari without the group price tag. Travel privately, or upgrade to a shared departure for $250.',
        hero_image: '/assets/uploads/jeep.jpeg',
        itinerary: [
          { day: 1, title: 'Arusha to Tarangire', detail: 'Morning drive to Tarangire, afternoon game drive.' },
          { day: 2, title: 'Tarangire full day', detail: 'Elephant herds, baobabs, tree-climbing lions.' },
          { day: 3, title: 'Ngorongoro Crater', detail: 'Descend into the caldera — black rhinos, flamingos, lions.' },
          { day: 4, title: 'Return to Arusha', detail: 'Drive back via Mto wa Mbu village.' },
        ],
        included: ['Shared 4x4 safari vehicle', 'Professional driver-guide', 'All park fees', '3 nights camping/budget lodge', 'All meals', 'Airport pickup'],
        not_included: ['Sleeping bag rental ($30)', 'Tips', 'Travel insurance', 'Optional crater service fee'],
        gallery: [
          '/assets/uploads/jeep.jpeg',
          '/assets/uploads/wilderbeast.jpeg',
          '/assets/uploads/lion cubs.jpeg',
        ],
      },
      {
        id: 'lake-manyara-day',
        title: 'Lake Manyara Day Trip',
        slug: 'lake-manyara-day',
        category: 'Wildlife Safari',
        tier: 'budget',
        best_for: ['solo', 'family', 'birding'],
        location: 'Lake Manyara, Tanzania',
        duration_days: 1,
        price_usd: 195,
        group_size_max: 6,
        featured: 0,
        summary: 'A long day out of Arusha into the Rift Valley — tree-climbing lions, hippo pools, and 400+ bird species.',
        hero_image: '/assets/uploads/hippo.jpeg',
        itinerary: [
          { day: 1, title: 'Manyara', detail: 'Early start, full-day game drive, return to Arusha by 6pm.' },
        ],
        included: ['4x4 vehicle & driver-guide', 'Park fees', 'Lunch box', 'Drinking water'],
        not_included: ['Tips', 'Personal expenses'],
        gallery: [
          'https://images.unsplash.com/photo-1500964757637-c85e8a162699?auto=format&fit=crop&w=1200&q=70',
        ],
      },

      // =============================================================
      // MID-RANGE — best value, popular with couples and small groups
      // =============================================================
      {
        id: 'ngorongoro-crater-day',
        title: 'Ngorongoro Crater Day Trip',
        slug: 'ngorongoro-crater-day',
        category: 'Wildlife Safari',
        tier: 'mid',
        best_for: ['solo', 'family', 'group'],
        location: 'Ngorongoro, Tanzania',
        duration_days: 1,
        price_usd: 380,
        group_size_max: 6,
        featured: 0,
        summary: 'Descend into the world\'s largest intact caldera for a half-day of dense wildlife viewing — black rhinos, lions, flamingos.',
        hero_image: '/assets/uploads/rhino.jpeg',
        itinerary: [
          { day: 1, title: 'Crater descent', detail: 'Early start from Arusha, descend to the crater floor.' },
        ],
        included: ['4x4 safari vehicle', 'Driver-guide', 'Park fees', 'Lunch box'],
        not_included: ['Tips', 'Personal expenses'],
        gallery: [
          'https://images.unsplash.com/photo-1605559911160-a3d95d213904?auto=format&fit=crop&w=1200&q=70',
        ],
      },
      {
        id: 'tarangire-day',
        title: 'Tarangire Day Safari',
        slug: 'tarangire-day',
        category: 'Wildlife Safari',
        tier: 'mid',
        best_for: ['solo', 'family', 'photography', 'birding'],
        location: 'Tarangire, Tanzania',
        duration_days: 1,
        price_usd: 290,
        group_size_max: 6,
        featured: 0,
        summary: 'Elephant herds, ancient baobabs, and a quiet corner of the safari circuit most tourists skip.',
        hero_image: '/assets/uploads/wilderbeast.jpeg',
        itinerary: [
          { day: 1, title: 'Tarangire', detail: 'Full-day game drive with picnic lunch by the river.' },
        ],
        included: ['4x4 vehicle & guide', 'Park fees', 'Lunch box', 'Drinking water'],
        not_included: ['Tips', 'Personal expenses'],
        gallery: [
          'https://images.unsplash.com/photo-1552410260-0fd9b577afa6?auto=format&fit=crop&w=1200&q=70',
        ],
      },
      {
        id: 'maasai-cultural-immersion',
        title: 'Maasai Cultural Immersion',
        slug: 'maasai-cultural-immersion',
        category: 'Cultural Tour',
        tier: 'mid',
        best_for: ['family', 'solo', 'group'],
        location: 'Tanzania & Kenya',
        duration_days: 3,
        price_usd: 980,
        group_size_max: 8,
        featured: 0,
        summary: 'Live alongside the Maasai — learn traditional crafts, herding, and storytelling from community elders.',
        hero_image: '/assets/uploads/masai huddle.jpeg',
        itinerary: [
          { day: 1, title: 'Village arrival', detail: 'Welcome ceremony & homestead tour.' },
          { day: 2, title: 'Pastoral day', detail: 'Herding cattle, learning beadwork.' },
          { day: 3, title: 'Farewell', detail: 'Traditional meal, depart with blessings.' },
        ],
        included: ['Community lodging', 'Local guide & interpreter', 'All meals', 'Donations to community fund'],
        not_included: ['Transport to/from village', 'Tips', 'Personal gear'],
        gallery: [
          'https://images.unsplash.com/photo-1535941339077-2dd1c7963098?auto=format&fit=crop&w=1200&q=70',
          'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?auto=format&fit=crop&w=1200&q=70',
        ],
      },
      {
        id: 'great-migration-mara',
        title: 'Great Migration — Mara River Crossing',
        slug: 'great-migration-mara',
        category: 'Wildlife Safari',
        tier: 'mid',
        best_for: ['couples', 'photography', 'family'],
        location: 'Northern Serengeti & Maasai Mara',
        duration_days: 7,
        price_usd: 3980,
        group_size_max: 6,
        featured: 1,
        summary: 'Time the trip for the river crossings (Jul–Oct). Seven days tracking the herds across the Mara River with mobile camps.',
        hero_image: '/assets/uploads/wilderbeast river.jpeg',
        itinerary: [
          { day: 1, title: 'Arusha → Mara', detail: 'Fly to the Mara, afternoon game drive.' },
          { day: 2, title: 'Mara River crossings', detail: 'Track the herds to the riverbanks.' },
          { day: 3, title: 'Crossing days', detail: 'Patience and good radio work — when the herds go, you go.' },
          { day: 4, title: 'Northern Serengeti', detail: 'Cross into the Serengeti side.' },
          { day: 5, title: 'Predator country', detail: 'Lions and crocodiles feast — nature at its most raw.' },
          { day: 6, title: 'Loita Hills', detail: 'Maasai cultural side trip.' },
          { day: 7, title: 'Return', detail: 'Fly back to Nairobi.' },
        ],
        included: ['Internal flights', 'Mobile tented camp', 'Driver-guide', 'All meals', 'Park fees', 'Maasai community visit'],
        not_included: ['Hot-air balloon ($1,000 per person)', 'International flights', 'Travel insurance', 'Tips'],
        gallery: [
          'https://images.unsplash.com/photo-1547970810-dc1eac37d174?auto=format&fit=crop&w=1200&q=70',
          'https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=1200&q=70',
          'https://images.unsplash.com/photo-1535941339077-2dd1c7963098?auto=format&fit=crop&w=1200&q=70',
        ],
      },

      // =============================================================
      // LUXURY — premium, private vehicles, high-end camps
      // =============================================================

      {
        id: 'serengeti-private-vehicle',
        title: 'Serengeti Private 4-Day — Exclusive Vehicle',
        slug: 'serengeti-private-vehicle',
        category: 'Wildlife Safari',
        tier: 'luxury',
        best_for: ['couples', 'honeymoon', 'family', 'photography'],
        location: 'Serengeti, Tanzania',
        duration_days: 4,
        price_usd: 5650,
        group_size_max: 4,
        featured: 0,
        summary: 'Your own 4x4, your own guide, your own schedule. Stay at the most exclusive camps in the Serengeti.',
        hero_image: '/assets/uploads/jeep elephant.jpeg',
        itinerary: [
          { day: 1, title: 'Fly to Serengeti', detail: 'Private charter, afternoon game drive.' },
          { day: 2, title: 'Full-day Serengeti', detail: 'Tailor your day — cats, migration, photography.' },
          { day: 3, title: 'Migration corridor', detail: 'Track the herds wherever they are.' },
          { day: 4, title: 'Return flight', detail: 'Final game drive en route to airstrip.' },
        ],
        included: ['Private charter flights', 'Exclusive 4x4 & guide', 'Luxury lodge', 'All meals & drinks', 'Park fees', 'Sundowner experiences'],
        not_included: ['Hot-air balloon ($1,000 per person)', 'Spa treatments', 'Premium wines & spirits', 'International flights', 'Tips'],
        gallery: [
          'https://images.unsplash.com/photo-1559131397-f94da358f7ca?auto=format&fit=crop&w=1200&q=70',
          'https://images.unsplash.com/photo-1565008576549-57569a49371d?auto=format&fit=crop&w=1200&q=70',
        ],
      },

      {
        id: 'family-safari-7d',
        title: 'Family Safari Adventure — 7 Days',
        slug: 'family-safari-7d',
        category: 'Wildlife Safari',
        tier: 'mid',
        best_for: ['family', 'group'],
        location: 'Tarangire, Ngorongoro & Manyara',
        duration_days: 7,
        price_usd: 2750,
        group_size_max: 8,
        featured: 0,
        summary: 'Designed for families with kids 6+. Shorter drives, family-friendly lodges, hands-on Maasai cultural day, and lots of wildlife.',
        hero_image: '/assets/uploads/masai.jpeg',
        itinerary: [
          { day: 1, title: 'Arrive Arusha', detail: 'Family suite at a lodge with a pool.' },
          { day: 2, title: 'Tarangire', detail: 'Giant baobabs and elephant herds.' },
          { day: 3, title: 'Tarangire walking safari', detail: 'Kid-friendly tracker-led walk.' },
          { day: 4, title: 'Ngorongoro Crater', detail: 'Half-day game drive in the caldera.' },
          { day: 5, title: 'Maasai village', detail: 'Learn jumping, beadwork, and herding.' },
          { day: 6, title: 'Lake Manyara', detail: 'Tree-climbing lions and flamingos.' },
          { day: 7, title: 'Return Arusha', detail: 'Departure transfers.' },
        ],
        included: ['Family rooms', '4x4 with pop-top roof (great for kids)', 'Park fees', 'All meals', 'Maasai cultural visit'],
        not_included: ['Tips', 'Personal expenses', 'International flights'],
        gallery: [
          'https://images.unsplash.com/photo-1452800185063-6db5e12b8e2e?auto=format&fit=crop&w=1200&q=70',
          'https://images.unsplash.com/photo-1502989642968-94fbdc9eace4?auto=format&fit=crop&w=1200&q=70',
        ],
      },
      {
        id: 'birding-specialist-10d',
        title: 'Birding Specialist — 10 Days',
        slug: 'birding-specialist-10d',
        category: 'Wildlife Safari',
        tier: 'mid',
        best_for: ['birding', 'photography', 'solo'],
        location: 'Tanzania — Lake Manyara, Tarangire, Serengeti, Ngorongoro',
        duration_days: 10,
        price_usd: 5450,
        group_size_max: 4,
        featured: 0,
        summary: 'For serious birders. 600+ species, expert guide, lake-side hides, and a checklist you will actually fill up.',
        hero_image: '/assets/uploads/baloon.jpeg',
        itinerary: [
          { day: 1, title: 'Arusha', detail: 'Briefing and bird list review.' },
          { day: 2, title: 'Arusha NP', detail: 'Acacia forest endemics.' },
          { day: 3, title: 'Lake Manyara', detail: 'Flamingos, pelicans, 400+ species.' },
          { day: 4, title: 'Tarangire', detail: 'Kori bustard, endemic ashy starling.' },
          { day: 5, title: 'Tarangire', detail: 'Riverine specials.' },
          { day: 6, title: 'Ngorongoro', detail: 'Crater floor species.' },
          { day: 7, title: 'Serengeti', detail: 'Secretary bird, kori bustard, vultures.' },
          { day: 8, title: 'Serengeti', detail: 'Western corridor woodland birds.' },
          { day: 9, title: 'Lake Natron', detail: 'Lesser flamingo breeding grounds.' },
          { day: 10, title: 'Return', detail: 'Final checklist & transfer.' },
        ],
        included: ['Expert birding guide', 'Spotting scope', 'Field checklist', 'All park fees', 'Mid-range lodges', 'All meals'],
        not_included: ['Tips', 'International flights', 'Travel insurance'],
        gallery: [
          'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=70',
        ],
      },

      // =============================================================
      // NEW BUDGET — solo & budget-friendly
      // =============================================================
      {
        id: 'budget-chimp-gombe',
        title: 'Budget Chimp Trek — Gombe 3 Days',
        slug: 'budget-chimp-gombe',
        category: 'Wildlife Safari',
        tier: 'budget',
        best_for: ['solo', 'photography', 'birding'],
        location: 'Gombe Stream, Tanzania',
        duration_days: 3,
        price_usd: 890,
        group_size_max: 6,
        featured: 0,
        summary: 'Track Jane Goodall\'s chimps in the smallest national park in Tanzania. Boat across Lake Tanganyika and trek into the forest.',
        hero_image: '/assets/uploads/baboon.jpeg',
        itinerary: [
          { day: 1, title: 'Kigoma → Gombe', detail: 'Boat across Lake Tanganyika to the park.' },
          { day: 2, title: 'Chimp trekking', detail: 'Full day in the forest with a park ranger.' },
          { day: 3, title: 'Return', detail: 'Morning swim in the lake, boat back to Kigoma.' },
        ],
        included: ['Park fees', 'Boat transfers', 'Ranger guide', 'Camping', 'All meals'],
        not_included: ['Tips', 'Flights to Kigoma', 'Sleeping bag'],
        gallery: [
          'https://images.unsplash.com/photo-1575408264798-b50b252663e6?auto=format&fit=crop&w=1200&q=70',
        ],
      },
      {
        id: 'budget-lake-natron',
        title: 'Lake Natron & Waterfalls — 2 Days',
        slug: 'budget-lake-natron',
        category: 'Wildlife Safari',
        tier: 'budget',
        best_for: ['solo', 'photography', 'birding'],
        location: 'Lake Natron, Tanzania',
        duration_days: 2,
        price_usd: 480,
        group_size_max: 6,
        featured: 0,
        summary: 'Lesser flamingos, the Engare Sero waterfalls, and the most otherworldly landscape in northern Tanzania.',
        hero_image: '/assets/uploads/sunset.jpeg',
        itinerary: [
          { day: 1, title: 'Arusha → Natron', detail: 'Long scenic drive, afternoon at the lake.' },
          { day: 2, title: 'Waterfalls & return', detail: 'Sunrise at the falls, drive back to Arusha.' },
        ],
        included: ['4x4 vehicle & guide', 'Park & community fees', 'Camping', 'All meals'],
        not_included: ['Tips', 'Sleeping bag rental'],
        gallery: [],
      },
      {
        id: 'budget-coffee-tour',
        title: 'Coffee & Culture Day Tour',
        slug: 'budget-coffee-tour',
        category: 'Cultural Tour',
        tier: 'budget',
        best_for: ['solo', 'family', 'group'],
        location: 'Moshi, Tanzania',
        duration_days: 1,
        price_usd: 145,
        group_size_max: 8,
        featured: 0,
        summary: 'A relaxed day on a working coffee farm — pick, pulp, roast, brew. Plus a local lunch and banana-beer tasting.',
        hero_image: '/assets/uploads/masai.jpeg',
        itinerary: [
          { day: 1, title: 'Moshi farm visit', detail: 'Farm walk, roasting demo, lunch, return by 5pm.' },
        ],
        included: ['Hotel pickup (Moshi/Arusha)', 'Local guide', 'Lunch & coffee tasting', 'All materials'],
        not_included: ['Tips', 'Souvenirs'],
        gallery: [],
      },
      {
        id: 'budget-arusha-np',
        title: 'Arusha National Park Day',
        slug: 'budget-arusha-np',
        category: 'Wildlife Safari',
        tier: 'budget',
        best_for: ['solo', 'family', 'birding'],
        location: 'Arusha, Tanzania',
        duration_days: 1,
        price_usd: 175,
        group_size_max: 6,
        featured: 0,
        summary: 'A short day at Arusha\'s doorstep — colobus monkeys in the forest, flamingos on Momella Lakes, and views of Mt Meru.',
        hero_image: '/assets/uploads/rhino plain.jpeg',
        itinerary: [
          { day: 1, title: 'Arusha NP', detail: 'Morning game drive, canoe on Momella, picnic lunch.' },
        ],
        included: ['4x4 vehicle & guide', 'Park fees', 'Canoe', 'Lunch box'],
        not_included: ['Tips'],
        gallery: [],
      },
      {
        id: 'budget-ruaha-6d',
        title: 'Budget Ruaha Adventure — 6 Days',
        slug: 'budget-ruaha-6d',
        category: 'Wildlife Safari',
        tier: 'budget',
        best_for: ['solo', 'photography', 'birding'],
        location: 'Ruaha NP, Tanzania',
        duration_days: 6,
        price_usd: 1480,
        group_size_max: 6,
        featured: 0,
        summary: 'Tanzania\'s largest but least-visited park — huge elephant herds, wild dogs, and fewer minivans.',
        hero_image: '/assets/uploads/lion cubs.jpeg',
        itinerary: [
          { day: 1, title: 'Fly Iringa', detail: 'Charter to Ruaha airstrip, afternoon drive.' },
          { day: 2, title: 'Ruaha central', detail: 'Full-day game drive along the Great Ruaha River.' },
          { day: 3, title: 'Ruaha east', detail: 'Tracking wild dog packs.' },
          { day: 4, title: 'Walking safari', detail: 'Half-day walk with an armed ranger.' },
          { day: 5, title: 'Ruaha west', detail: 'Kudu and roan antelope territory.' },
          { day: 6, title: 'Return', detail: 'Final drive, fly back to Dar.' },
        ],
        included: ['Internal flights', 'Camping or basic lodge', 'Guide', 'All meals', 'Park fees'],
        not_included: ['Tips', 'International flights'],
        gallery: [],
      },
      {
        id: 'budget-selous-4d',
        title: 'Selous Budget Safari — 4 Days',
        slug: 'budget-selous-4d',
        category: 'Wildlife Safari',
        tier: 'budget',
        best_for: ['solo', 'photography'],
        location: 'Nyerere (Selous), Tanzania',
        duration_days: 4,
        price_usd: 980,
        group_size_max: 6,
        featured: 0,
        summary: 'Africa\'s largest protected reserve — boat safaris on the Rufiji, hippo pools, and one of the last wild dog strongholds.',
        hero_image: '/assets/uploads/hippo.jpeg',
        itinerary: [
          { day: 1, title: 'Dar → Selous', detail: 'Drive or train to the reserve.' },
          { day: 2, title: 'Boat safari', detail: 'Hippos, crocodiles, kingfishers on the Rufiji.' },
          { day: 3, title: 'Game drive', detail: 'Full day — lions, elephants, more wild dogs.' },
          { day: 4, title: 'Return', detail: 'Walk + drive, transfer back.' },
        ],
        included: ['Transport from Dar', 'Basic lodge', 'Guide', 'Boat safari', 'Park fees', 'All meals'],
        not_included: ['Tips', 'Park concession fee'],
        gallery: [],
      },
      {
        id: 'budget-cycling-safari',
        title: 'Cycling + Walking Safari Combo',
        slug: 'budget-cycling-safari',
        category: 'Wildlife Safari',
        tier: 'budget',
        best_for: ['solo', 'photography'],
        location: 'Arusha → Tarangire',
        duration_days: 3,
        price_usd: 690,
        group_size_max: 6,
        featured: 0,
        summary: 'Bike through Maasai farmland, then a walking safari in Tarangire. Active, authentic, and off the tourist trail.',
        hero_image: '/assets/uploads/jeep 2.jpeg',
        itinerary: [
          { day: 1, title: 'Arusha → Mto wa Mbu', detail: 'Bike ride through villages, banana & rice farms.' },
          { day: 2, title: 'Tarangire on foot', detail: 'Walking safari with an armed ranger.' },
          { day: 3, title: 'Game drive & return', detail: 'Final 4x4 drive, then bike back to Arusha.' },
        ],
        included: ['Mountain bike & helmet', 'Walking guide', 'Park fees', '2 nights budget lodge', 'All meals'],
        not_included: ['Tips', 'Travel insurance'],
        gallery: [],
      },

      // =============================================================
      // NEW MID-RANGE — variety of themes
      // =============================================================

      {
        id: 'mid-selous-boat-5d',
        title: 'Selous Boat & Walking Safari — 5 Days',
        slug: 'mid-selous-boat-5d',
        category: 'Wildlife Safari',
        tier: 'mid',
        best_for: ['photography', 'birding', 'solo'],
        location: 'Nyerere (Selous), Tanzania',
        duration_days: 5,
        price_usd: 2890,
        group_size_max: 6,
        featured: 0,
        summary: 'The best of Selous — boat safaris on the Rufiji, walking with rangers, and a fly-camp night under the stars.',
        hero_image: '/assets/uploads/hippo.jpeg',
        itinerary: [
          { day: 1, title: 'Dar → Selous', detail: 'Drive into the reserve, afternoon boat safari.' },
          { day: 2, title: 'Walking safari', detail: 'Full day on foot with rangers.' },
          { day: 3, title: 'Fly-camp night', detail: 'Mobile bush camp, night sounds.' },
          { day: 4, title: 'Game drive', detail: 'Full day — lions, wild dogs, elephants.' },
          { day: 5, title: 'Return', detail: 'Morning boat, drive to Dar.' },
        ],
        included: ['Transport from Dar', 'Lodge + fly-camp', 'All activities', 'Guide', 'Park fees', 'All meals'],
        not_included: ['Tips', 'Park concession fee', 'International flights'],
        gallery: [],
      },
      {
        id: 'mid-photography-9d',
        title: 'Photography Masterclass — 9 Days',
        slug: 'mid-photography-9d',
        category: 'Wildlife Safari',
        tier: 'mid',
        best_for: ['photography', 'solo', 'birding'],
        location: 'Serengeti, Ngorongoro, Tarangire',
        duration_days: 9,
        price_usd: 6450,
        group_size_max: 4,
        featured: 1,
        summary: 'A working trip, not a holiday. Pro photographer guide, custom-modified 4x4, daily editing sessions. Get portfolio-ready shots.',
        hero_image: '/assets/uploads/lion cubs.jpeg',
        itinerary: [
          { day: 1, title: 'Arusha briefing', detail: 'Camera settings review, light planning.' },
          { day: 2, title: 'Tarangire', detail: 'Elephants + baobab silhouettes.' },
          { day: 3, title: 'Tarangire', detail: 'Macro: insects, birds, textures.' },
          { day: 4, title: 'Ngorongoro', detail: 'Crater floor — wide-angle landscapes.' },
          { day: 5, title: 'Southern Serengeti', detail: 'Predators on the kopjes.' },
          { day: 6, title: 'Central Serengeti', detail: 'Action sequences — lion prides.' },
          { day: 7, title: 'Western Serengeti', detail: 'Hippo pools, river crossings.' },
          { day: 8, title: 'Edit session', detail: 'On-the-road editing + critique.' },
          { day: 9, title: 'Final shoot', detail: 'Sunrise drive, return to Arusha.' },
        ],
        included: ['Pro photographer guide', 'Custom 4x4 (beanbags, gimbal)', 'Editing laptop & software', 'All park fees', 'Lodges', 'Meals'],
        not_included: ['Camera gear', 'Tips', 'International flights'],
        gallery: [],
      },
      {
        id: 'mid-horse-riding',
        title: 'Horseback Safari — 5 Days',
        slug: 'mid-horse-riding',
        category: 'Wildlife Safari',
        tier: 'mid',
        best_for: ['couples', 'honeymoon', 'solo'],
        location: 'Tarangire & Lake Manyara',
        duration_days: 5,
        price_usd: 3250,
        group_size_max: 6,
        featured: 0,
        summary: 'Ride among zebra and giraffe on well-schooled horses. A totally different safari perspective.',
        hero_image: '/assets/uploads/jeep 2.jpeg',
        itinerary: [
          { day: 1, title: 'Arusha briefing', detail: 'Meet the horses, tack up, short test ride.' },
          { day: 2, title: 'Tarangire ride', detail: '4 hours in the saddle, picnic.' },
          { day: 3, title: 'Mto wa Mbu ride', detail: 'Ride through the Rift Valley escarpment.' },
          { day: 4, title: 'Manyara ride', detail: 'Lakeside ride with flamingos on the horizon.' },
          { day: 5, title: 'Final ride & return', detail: 'Sunride, transfer to Arusha.' },
        ],
        included: ['Horse & tack', 'Instructor/guide', 'Saddle bag lunch', '4 nights mid-range lodge'],
        not_included: ['Riding boots (rentable)', 'Tips'],
        gallery: [],
      },
      {
        id: 'mid-ruaha-classic-7d',
        title: 'Ruaha Classic — 7 Days',
        slug: 'mid-ruaha-classic-7d',
        category: 'Wildlife Safari',
        tier: 'mid',
        best_for: ['photography', 'birding', 'solo'],
        location: 'Ruaha NP, Tanzania',
        duration_days: 7,
        price_usd: 3850,
        group_size_max: 4,
        featured: 0,
        summary: 'Seven days in Tanzania\'s biggest park — predator-rich, crowd-free, and astonishingly scenic.',
        hero_image: '/assets/uploads/lion resting.jpeg',
        itinerary: [
          { day: 1, title: 'Fly Iringa', detail: 'Charter to the park, afternoon drive.' },
          { day: 2, title: 'Great Ruaha River', detail: 'Elephant herds, big cats.' },
          { day: 3, title: 'Wild dog tracking', detail: 'With research team.' },
          { day: 4, title: 'Walking safari', detail: 'Full day on foot.' },
          { day: 5, title: 'Mwagusi area', detail: 'Lion pride territory.' },
          { day: 6, title: 'Mbagi plains', detail: 'Roan antelope, kudu, eland.' },
          { day: 7, title: 'Return', detail: 'Final drive, fly back.' },
        ],
        included: ['Internal flights', 'Lodge', 'Guide', 'Park fees', 'All meals'],
        not_included: ['Tips', 'International flights'],
        gallery: [],
      },
      {
        id: 'mid-chimp-gorilla-12d',
        title: 'Chimps & Mountain Gorillas — 12 Days',
        slug: 'mid-chimp-gorilla-12d',
        category: 'Wildlife Safari',
        tier: 'mid',
        best_for: ['photography', 'solo'],
        location: 'Tanzania & Rwanda',
        duration_days: 12,
        price_usd: 8950,
        group_size_max: 4,
        featured: 0,
        summary: 'Track chimps in Mahale, fly to Kigali, then gorilla trek in Volcanoes NP. The primate bucket list.',
        hero_image: '/assets/uploads/baboon.jpeg',
        itinerary: [
          { day: 1, title: 'Arusha', detail: 'Briefing and gear check.' },
          { day: 2, title: 'Mahale flight', detail: 'Charter to Mahale on Lake Tanganyika.' },
          { day: 3, title: 'Chimp trek', detail: 'Forest trek to the habituated group.' },
          { day: 4, title: 'Chimp trek', detail: 'Second tracking session.' },
          { day: 5, title: 'Mahale', detail: 'Kayak, swim, photograph.' },
          { day: 6, title: 'Kigali', detail: 'Fly to Rwanda, Kigali city tour.' },
          { day: 7, title: 'Volcanoes NP', detail: 'Drive to the park, briefing.' },
          { day: 8, title: 'Gorilla trek', detail: 'Trek to a habituated gorilla family.' },
          { day: 9, title: 'Golden monkeys', detail: 'Optional second trek.' },
          { day: 10, title: 'Dian Fossey grave', detail: 'Visit the Karisoke research camp.' },
          { day: 11, title: 'Lake Kivu', detail: 'Beach relaxation at Gisenyi.' },
          { day: 12, title: 'Return', detail: 'Fly to Kigali, depart.' },
        ],
        included: ['All flights within region', 'Gorilla permit ($1,500)', 'Chimp permit ($1,000)', 'Lodges', 'Guides', 'All meals', 'Park fees'],
        not_included: ['Tips (recommended $400)', 'International flights', 'Travel insurance'],
        gallery: [],
      },
      {
        id: 'mid-stargazing-8d',
        title: 'Astronomy & Stargazing — 8 Days',
        slug: 'mid-stargazing-8d',
        category: 'Wildlife Safari',
        tier: 'mid',
        best_for: ['family', 'photography', 'honeymoon'],
        location: 'Lake Natron & Serengeti',
        duration_days: 8,
        price_usd: 4250,
        group_size_max: 6,
        featured: 0,
        summary: 'Day game drives, night telescope sessions under some of the darkest skies on Earth. Southern hemisphere star tour.',
        hero_image: '/assets/uploads/sunset photography.jpeg',
        itinerary: [
          { day: 1, title: 'Arusha → Lake Natron', detail: 'Drive to Natron, sunset.' },
          { day: 2, title: 'Ol Doinyo Lengai viewpoint', detail: 'Volcano views, flamingos.' },
          { day: 3, title: 'Engare Sero waterfalls', detail: 'Hike and swim, then night sky.' },
          { day: 4, title: 'Telescope session', detail: 'Milky Way, planets, deep sky.' },
          { day: 5, title: 'Serengeti drive', detail: 'Long transfer into the plains.' },
          { day: 6, title: 'Serengeti day + night', detail: 'Game drive, then sky tour.' },
          { day: 7, title: 'Serengeti', detail: 'Predator tracking, night session.' },
          { day: 8, title: 'Return', detail: 'Drive back to Arusha.' },
        ],
        included: ['Telescope & laser guide', 'Astro guide', 'All transport', 'Lodges & camping', 'All meals'],
        not_included: ['Tips', 'International flights'],
        gallery: [],
      },

      // =============================================================
      // NEW LUXURY — premium private experiences
      // =============================================================

      {
        id: 'lux-selous-fly',
        title: 'Selous Private Fly-In — 5 Days',
        slug: 'lux-selous-fly',
        category: 'Wildlife Safari',
        tier: 'luxury',
        best_for: ['honeymoon', 'couples', 'family'],
        location: 'Nyerere (Selous), Tanzania',
        duration_days: 5,
        price_usd: 7250,
        group_size_max: 4,
        featured: 0,
        summary: 'Private charter into Selous, own boat, own guide. The most exclusive way to see Africa\'s biggest reserve.',
        hero_image: '/assets/uploads/jeep elephant.jpeg',
        itinerary: [
          { day: 1, title: 'Charter to Selous', detail: 'Private plane, afternoon boat safari.' },
          { day: 2, title: 'Walking + game drive', detail: 'Rangers, then 4x4.' },
          { day: 3, title: 'Fly-camp on the Rufiji', detail: 'Private mobile camp.' },
          { day: 4, title: 'Wild dogs', detail: 'Tracking day with researchers.' },
          { day: 5, title: 'Return', detail: 'Charter back to Dar.' },
        ],
        included: ['Private charter', 'Exclusive vehicle & boat', 'Lodge + fly-camp', 'All meals & drinks', 'Park fees', 'Rangers'],
        not_included: ['Tips', 'International flights'],
        gallery: [],
      },
      {
        id: 'lux-conservation-researcher',
        title: 'Conservation Researcher Experience',
        slug: 'lux-conservation-researcher',
        category: 'Wildlife Safari',
        tier: 'luxury',
        best_for: ['family', 'group', 'photography'],
        location: 'Serengeti & Ngorongoro',
        duration_days: 8,
        price_usd: 9800,
        group_size_max: 6,
        featured: 0,
        summary: 'Shadow a wildlife researcher — collar-tracking lions, collaring elephants, data collection. A working safari.',
        hero_image: '/assets/uploads/lion resting.jpeg',
        itinerary: [
          { day: 1, title: 'Arusha', detail: 'Briefing at the conservation HQ.' },
          { day: 2, title: 'Serengeti research camp', detail: 'Meet the team, antenna tracking.' },
          { day: 3, title: 'Lion collaring prep', detail: 'Field prep, gear check.' },
          { day: 4, title: 'Field day', detail: 'Live collaring operation (when scheduled).' },
          { day: 5, title: 'Data analysis', detail: 'Office day in camp — maps, telemetry.' },
          { day: 6, title: 'Ngorongoro', detail: 'Black rhino monitoring.' },
          { day: 7, title: 'Community visit', detail: 'Meet anti-poaching rangers.' },
          { day: 8, title: 'Return', detail: 'Final briefing, fly home.' },
        ],
        included: ['Researcher guide', 'All field activities', 'Luxury camp', 'All meals', 'Donations to program'],
        not_included: ['Tips', 'International flights'],
        gallery: [],
      },


      {
        id: 'lux-group-safari-10p',
        title: 'Royal Private Group — 10 Guests, 9 Days',
        slug: 'lux-group-safari-10p',
        category: 'Wildlife Safari',
        tier: 'luxury',
        best_for: ['group', 'family', 'couples'],
        location: 'Tanzania — full northern circuit',
        duration_days: 9,
        price_usd: 11800,
        group_size_max: 10,
        featured: 0,
        summary: 'The whole safari for one group — three 4x4s, private chef, dedicated driver-guides. Multi-gen families and friends.',
        hero_image: '/assets/uploads/masai huddle.jpeg',
        itinerary: [
          { day: 1, title: 'Arusha arrival', detail: 'Luxury lodge welcome dinner.' },
          { day: 2, title: 'Tarangire', detail: 'Full-day game drive.' },
          { day: 3, title: 'Ngorongoro Crater', detail: 'Half day in the caldera.' },
          { day: 4, title: 'Crater → Serengeti', detail: 'Drive through the highlands.' },
          { day: 5, title: 'Central Serengeti', detail: 'Big cats day.' },
          { day: 6, title: 'Northern Serengeti', detail: 'Migration territory.' },
          { day: 7, title: 'Cultural day', detail: 'Maasai community visit.' },
          { day: 8, title: 'Lake Manyara', detail: 'Tree-climbing lions.' },
          { day: 9, title: 'Departure', detail: 'Farewell brunch, transfers.' },
        ],
        included: ['3 private vehicles', 'Driver-guides (1:4 ratio)', 'Private chef option', 'Luxury lodges', 'All park fees', 'Maasai cultural visit'],
        not_included: ['Tips (~$800)', 'International flights', 'Travel insurance'],
        gallery: [],
      },

    ].filter(t => !removedTourIds.includes(t.id) && !(t.best_for || []).includes('birding'));

    // === WILDLIFE IMAGE RE-MAP ===
    // Replace all tour hero + gallery URLs with verified wildlife photos.
    // Mapping is deterministic by tour id so the data is stable across reseeds.
    const W = {
      lionA: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=1600&q=70',
      lionB: 'https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?auto=format&fit=crop&w=1600&q=70',
      lionC: 'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?auto=format&fit=crop&w=1600&q=70',
      lionD: 'https://images.unsplash.com/photo-1552410260-0fd9b577afa6?auto=format&fit=crop&w=1600&q=70',
      tigerA: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=1600&q=70',
      leopA: 'https://images.unsplash.com/photo-1456926631375-92c8ce872def?auto=format&fit=crop&w=1600&q=70',
      leopB: 'https://images.unsplash.com/photo-1456926631375-92c8ce872def?auto=format&fit=crop&w=1600&q=70',
      elepA: 'https://images.unsplash.com/photo-1535941339077-2dd1c7963098?auto=format&fit=crop&w=1600&q=70',
      elepB: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=1600&q=70',
      elepC: 'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?auto=format&fit=crop&w=1600&q=70',
      elepD: 'https://images.unsplash.com/photo-1605559911160-a3d95d213904?auto=format&fit=crop&w=1600&q=70',
      elepE: 'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?auto=format&fit=crop&w=1600&q=70',
      girA: 'https://images.unsplash.com/photo-1574870111867-089730e5a72b?auto=format&fit=crop&w=1600&q=70',
      girB: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=1600&q=70',
      girC: 'https://images.unsplash.com/photo-1549366021-9f761d450615?auto=format&fit=crop&w=1600&q=70',
      girD: 'https://images.unsplash.com/photo-1547721064-da6cfb341d50?auto=format&fit=crop&w=1600&q=70',
      girE: 'https://images.unsplash.com/photo-1547721064-da6cfb341d50?auto=format&fit=crop&w=1600&q=70',
      zebA: 'https://images.unsplash.com/photo-1526095179574-86e545346ae6?auto=format&fit=crop&w=1600&q=70',
      zebB: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=1600&q=70',
      migA: 'https://images.unsplash.com/photo-1547970810-dc1eac37d174?auto=format&fit=crop&w=1600&q=70',
      migB: 'https://images.unsplash.com/photo-1547970810-dc1eac37d174?auto=format&fit=crop&w=1600&q=70',
      rhiA: 'https://images.unsplash.com/photo-1547970810-dc1eac37d174?auto=format&fit=crop&w=1600&q=70',
      birdA: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=1600&q=70',
      birdB: 'https://images.unsplash.com/photo-1535941339077-2dd1c7963098?auto=format&fit=crop&w=1600&q=70',
      duckA: 'https://images.unsplash.com/photo-1605559911160-a3d95d213904?auto=format&fit=crop&w=1600&q=70',
      maasaiA: 'https://images.unsplash.com/photo-1769877819885-ba5c85cd00ff?auto=format&fit=crop&w=1600&q=70',
      maasaiB: 'https://images.unsplash.com/photo-1776772838972-ee89adb85561?auto=format&fit=crop&w=1600&q=70',
      maasaiC: 'https://images.unsplash.com/photo-1745690720220-24e337e571c7?auto=format&fit=crop&w=1600&q=70',
      maasaiD: 'https://images.unsplash.com/photo-1704495669300-216e12543f9f?auto=format&fit=crop&w=1600&q=70',
      migA: 'https://images.unsplash.com/photo-1635328637451-be137d8fae03?auto=format&fit=crop&w=1600&q=70',
      migB: 'https://images.unsplash.com/photo-1564101160531-4838e8a5f4e7?auto=format&fit=crop&w=1600&q=70',
      migC: 'https://images.unsplash.com/photo-1711062752104-4f7d80374874?auto=format&fit=crop&w=1600&q=70',
      packA: 'https://images.unsplash.com/photo-1506303185793-7b5fe8035d04?auto=format&fit=crop&w=1600&q=70',
      packB: 'https://images.unsplash.com/photo-1761888351161-c3beb14e9377?auto=format&fit=crop&w=1600&q=70',
      packC: 'https://images.unsplash.com/photo-1571636240366-1606c4a13f55?auto=format&fit=crop&w=1600&q=70',
      horseA: 'https://images.unsplash.com/photo-1734158056990-e2c45d025ae1?auto=format&fit=crop&w=1600&q=70',
      horseB: 'https://images.unsplash.com/photo-1761873177867-499c27dc4cd7?auto=format&fit=crop&w=1600&q=70',
      horseC: 'https://images.unsplash.com/photo-1761873177903-1e0c23304bb2?auto=format&fit=crop&w=1600&q=70',
      coffeeA: 'https://images.unsplash.com/photo-1762686852371-763b689910b2?auto=format&fit=crop&w=1600&q=70',
      coffeeB: 'https://images.unsplash.com/photo-1763160870899-8f6d59c921ef?auto=format&fit=crop&w=1600&q=70',
      ngoroA: 'https://images.unsplash.com/photo-1600637468460-1fa84e8eddea?auto=format&fit=crop&w=1600&q=70',
      ngoroB: 'https://images.unsplash.com/photo-1663429975682-b4f703396374?auto=format&fit=crop&w=1600&q=70',
      ngoroC: 'https://images.unsplash.com/photo-1586584525758-f63cd62475a6?auto=format&fit=crop&w=1600&q=70',
    };

    // Per-tour hero image — picked to match the tour's signature animal
    const TOUR_HERO = {
      'serengeti-classic': W.lionA,
      'budget-solo-backpacker': W.packA,
      'lake-manyara-day': W.birdB,
      'ngorongoro-crater-day': W.ngoroA,
      'tarangire-day': W.elepB,
      'maasai-cultural-immersion': W.maasaiB,
      'great-migration-mara': W.migA,
      'serengeti-private-vehicle': W.lionD,
      'family-safari-7d': W.maasaiD,
      'birding-specialist-10d': W.birdA,
      'budget-chimp-gombe': W.leopA,
      'budget-lake-natron': W.birdB,
      'budget-coffee-tour': W.coffeeA,
      'budget-arusha-np': W.girE,
      'budget-ruaha-6d': W.elepE,
      'budget-selous-4d': W.elepC,
      'budget-cycling-safari': W.packC,
      'mid-selous-boat-5d': W.elepA,
      'mid-photography-9d': W.lionA,
      'mid-horse-riding': W.horseA,
      'mid-ruaha-classic-7d': W.elepD,
      'mid-chimp-gorilla-12d': W.leopB,
      'mid-stargazing-8d': W.birdA,
      'lux-selous-fly': W.elepB,
      'lux-conservation-researcher': W.lionD,
      'lux-group-safari-10p': W.maasaiC,
    };

    // Per-tour gallery of 3 — also wildlife, mixing animals to keep variety
    const galleryFor = (id) => {
      const base = TOUR_HERO[id] || W.lionA;
      const m = {
        lionA: [W.lionA, W.lionB, W.lionC],
        lionB: [W.lionB, W.lionA, W.lionC],
        lionC: [W.lionC, W.lionA, W.lionD],
        lionD: [W.lionD, W.lionA, W.tigerA],
        tigerA: [W.tigerA, W.leopA, W.lionA],
        leopA: [W.leopA, W.leopB, W.lionA],
        leopB: [W.leopB, W.leopA, W.lionA],
        elepA: [W.elepA, W.elepB, W.elepC],
        elepB: [W.elepB, W.elepA, W.elepE],
        elepC: [W.elepC, W.elepD, W.elepB],
        elepD: [W.elepD, W.elepA, W.elepB],
        elepE: [W.elepE, W.elepB, W.elepA],
        girA: [W.girA, W.girB, W.girC],
        girB: [W.girB, W.girC, W.girA],
        girC: [W.girC, W.girD, W.girB],
        girD: [W.girD, W.girE, W.girA],
        girE: [W.girE, W.girD, W.girA],
        zebA: [W.zebA, W.zebB, W.migA],
        zebB: [W.zebB, W.zebA, W.migA],
        migA: [W.migA, W.migB, W.migC],
        rhiA: [W.rhiA, W.elepA, W.elepB],
        birdA: [W.birdA, W.birdB, W.duckA],
        birdB: [W.birdB, W.birdA, W.duckA],
        duckA: [W.duckA, W.birdB, W.birdA],
        maasaiA: [W.maasaiA, W.maasaiC, W.maasaiD],
        maasaiB: [W.maasaiB, W.maasaiA, W.maasaiC],
        maasaiC: [W.maasaiC, W.maasaiA, W.maasaiB],
        maasaiD: [W.maasaiD, W.maasaiB, W.maasaiA],
        packA: [W.packA, W.packB, W.packC],
        packB: [W.packB, W.packC, W.packA],
        packC: [W.packC, W.packA, W.packB],
        horseA: [W.horseA, W.horseB, W.horseC],
        horseB: [W.horseB, W.horseC, W.horseA],
        horseC: [W.horseC, W.horseA, W.horseB],
        coffeeA: [W.coffeeA, W.coffeeB],
        coffeeB: [W.coffeeB, W.coffeeA],
        ngoroA: [W.ngoroA, W.ngoroB, W.ngoroC],
        ngoroB: [W.ngoroB, W.ngoroC, W.ngoroA],
        ngoroC: [W.ngoroC, W.ngoroA, W.ngoroB],
      };
      return m[base] || [W.lionA, W.elepA, W.girA];
    };

    for (const t of seedTours) {
      if (TOUR_HERO[t.id]) t.hero_image = TOUR_HERO[t.id];
      t.gallery = galleryFor(t.id);
    }

    const priceOverrides = {
      'serengeti-classic': 6200,
      'budget-solo-backpacker': 1600,
      'lake-manyara-day': 395,
      'ngorongoro-crater-day': 650,
      'tarangire-day': 500,
      'maasai-cultural-immersion': 1600,
      'great-migration-mara': 7200,
      'serengeti-private-vehicle': 8200,
      'family-safari-7d': 4800,
      'birding-specialist-10d': 8500,
      'budget-chimp-gombe': 1700,
      'mid-photography-9d': 9800,
      'mid-selous-boat-5d': 4800,
      'mid-horse-riding': 5500,
      'mid-ruaha-classic-7d': 6500,
      'mid-chimp-gorilla-12d': 12800,
      'mid-stargazing-8d': 7200,
      'lux-selous-fly': 10400,
      'lux-conservation-researcher': 13800,
      'lux-group-safari-10p': 15800,
    };

    for (const t of seedTours) {
      if (priceOverrides[t.id]) t.price_usd = priceOverrides[t.id];
    }

    const tx = db.transaction(() => {
      for (const t of seedTours) {
        insert.run(
          t.id, t.title, t.slug, t.category, t.tier || 'mid', JSON.stringify(t.best_for || []),
          t.location, t.duration_days, t.price_usd, t.group_size_max || 6,
          t.summary, t.hero_image,
          JSON.stringify(t.itinerary), JSON.stringify(t.included),
          JSON.stringify(t.not_included), JSON.stringify(t.gallery),
          t.featured ? 1 : 0
        );
      }
    });
    tx();
    console.log(`✓ Seeded ${seedTours.length} tours with wildlife photos.`);
  }

  // Reviews seed independently of the tour catalog. This block deliberately sits
  // outside `if (count === 0)`: syncCatalog() has already inserted the tours by
  // that point, so count !== 0 on every normal boot and a review seed nested in
  // the catalog branch never ran — which is why /api/reviews returned [] while
  // the header advertised "4.9/5 (120+ Reviews)".
  //
  // Guarded on the reviews table itself so it stays idempotent, and each review
  // is bound to a tour id that actually exists: the orphan sweep above deletes
  // reviews whose tour_id is missing from tours.
  const reviewCount = db.prepare('SELECT COUNT(*) AS n FROM reviews').get().n;
  if (reviewCount === 0) {
    const seededReviews = [
      {
        author: 'Sarah & David, USA',
        rating: 5,
        body: 'Jebri Safaris turned our honeymoon into the trip of a lifetime. Our guide Joseph spotted a leopard on day one — we never would have seen it without him.',
        tour_id: 'serengeti-ngorongoro-express',
      },
      {
        author: 'Priya R., India',
        rating: 5,
        body: 'Loved the Maasai village visit — respectful, authentic, and the community was so welcoming.',
        tour_id: 'wildlife-culture-safari-7-day',
      },
      {
        author: 'James W., UK',
        rating: 4,
        body: 'Excellent service end-to-end. Only minor thing: a few lodges were tired. Will book another safari add-on next year.',
        tour_id: 'southern-circuit-untamed-9-day',
      },
      {
        author: 'Elena M., Spain',
        rating: 5,
        body: 'Zanzibar after the safari was the perfect finish. Stone Town was unhurried and the beach days exactly as promised.',
        tour_id: 'serengeti-zanzibar-escape-7-day',
      },
    ];
    const knownTourIds = new Set(db.prepare('SELECT id FROM tours').all().map(t => t.id));
    const insertReview = db.prepare(
      `INSERT INTO reviews (author, rating, body, tour_id, source, approved, created_at)
       VALUES (?, ?, ?, ?, 'seed', 1, datetime('now'))`
    );
    for (const r of seededReviews) {
      insertReview.run(r.author, r.rating, r.body, knownTourIds.has(r.tour_id) ? r.tour_id : null);
    }
    console.log(`✓ Seeded ${seededReviews.length} reviews.`);
  }
}
