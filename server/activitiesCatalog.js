// server/activitiesCatalog.js — server-side catalog of add-on activities.
// This mirrors the five signature activities in src/data/activitiesCatalog.js.
// The /api/plan endpoint uses this server copy for canonical prices and titles.
//
// The client (`src/data/activitiesCatalog.js`) mirrors the same data for the
// UI. Both files must stay in sync — the server catalog is the source of
// truth for validation. The client copy exists for display (categories, blurbs,
// images) and the planner's running total is recomputed on the server
// regardless of what the client sent.

// `is_per_person: false` means a fixed group price; `requires_quote` marks an
// experience whose price must be confirmed by the safari team.
export const ACTIVITY_CATALOG = [
  { id: 'balloon-breakfast', title: 'Hot-air balloon & bush breakfast', category: 'air', duration: 'First light · around 3 hours', price_usd: 599, is_per_person: true },
  { id: 'private-boat-cruise', title: 'Nyerere River boat safari', category: 'water', duration: '2–3 hours', price_usd: 180, is_per_person: true },
  { id: 'guided-half-day-drive', title: 'Guided half-day game drive', category: 'wildlife', duration: 'Half day', price_usd: 240, is_per_person: true },
  { id: 'community-visit', title: 'Cultural & community visit', category: 'cultural', duration: 'By arrangement', price_usd: 80, is_per_person: true },
  { id: 'bush-sundowner', title: 'Exclusive bush sundowner', category: 'experience', duration: 'At sunset', price_usd: 0, is_per_person: false, requires_quote: true },
];

// Lookup map for fast access in /api/plan validation.
const _byId = new Map(ACTIVITY_CATALOG.map(a => [a.id, a]));
export function getActivityById(id) {
  return _byId.get(id) || null;
}
