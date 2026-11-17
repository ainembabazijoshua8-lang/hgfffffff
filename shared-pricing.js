// Canonical safari pricing rules.
//
// This module is the SINGLE SOURCE OF TRUTH for per-person tour pricing.
// It is imported by both the Express API (server/index.js) and the React
// frontend (src/components/TripPlanner.jsx, src/pages/TourDetailPage.jsx) so
// the price a visitor sees, the price the planner estimates, and the price the
// founder email quotes can never drift apart.
//
// Plain .js (no JSX) so it can be imported from both environments.

export const GROUP_CAMPING_TOUR_ID = 'budget-group-camping-safari-6-day';

// The 6-day budget camping safari is priced on a group-load ladder: the
// $1,400 list price assumes a full six-person load, so smaller groups pay more
// per head. Every other tour is quoted at its list price (double occupancy),
// because its 4x4 is private and its group_size_max is 2.
const CAMPING_TIERS = [
  { maxTravelers: 2, price: 2100 },
  { maxTravelers: 4, price: 1750 },
  { maxTravelers: Infinity, price: 1400 },
];

// Seasonal lodge multiplier applied on the tour detail page's estimator.
const SEASON_FACTORS = {
  peak: { factor: 1.10, label: 'Peak Season (River Crossings / Festive)' },
  green: { factor: 0.92, label: 'Green Season (Low-season discount)' },
  high: { factor: 1.00, label: 'High Season (Jan–Mar, Jun)' },
  standard: { factor: 1.00, label: 'Standard Season' },
};

export function getSeasonMeta(season) {
  return SEASON_FACTORS[season] || SEASON_FACTORS.standard;
}

/**
 * Per-person price for a tour at a given traveller count.
 * Always returns a finite number — never null — so no caller can disagree
 * about whether a price exists.
 */
export function tourPricePerPerson(tour, travelers) {
  const base = Number(tour?.price_usd) || 0;
  if (!base) return 0;
  if (tour?.id !== GROUP_CAMPING_TOUR_ID) return base;

  const count = Math.max(1, Math.floor(Number(travelers) || 1));
  const tier = CAMPING_TIERS.find(t => count <= t.maxTravelers);
  return tier.price;
}

/**
 * Maximum bookable traveller count for a tour. The API rejects submissions
 * above this, so every client-side estimator must respect it too — otherwise
 * the site advertises a price the booking endpoint will refuse.
 */
export function maxTravelersFor(tour) {
  const max = Number(tour?.group_size_max);
  return Number.isFinite(max) && max > 0 ? Math.floor(max) : 2;
}

/**
 * Full estimate for a tour, including the seasonal multiplier.
 * Returns { perPerson, total, seasonLabel, exceedsMax }.
 * `exceedsMax` is true when the requested traveller count is above the tour's
 * bookable maximum — callers should surface that as a warning rather than
 * silently quoting an unbookable total.
 */
export function estimateTourPricing(tour, travelers, season = 'standard') {
  const count = Math.max(1, Math.floor(Number(travelers) || 1));
  const seasonMeta = getSeasonMeta(season);
  const perPerson = Math.round(tourPricePerPerson(tour, count) * seasonMeta.factor);
  return {
    perPerson,
    total: perPerson * count,
    seasonLabel: seasonMeta.label,
    exceedsMax: count > maxTravelersFor(tour),
  };
}