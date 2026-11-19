// shared-csp-origins.js — single source of truth for the Content Security Policy
// allowlist.
//
// WHY THIS FILE EXISTS
// The production CSP was hand-maintained while the frontend independently grew
// its own set of external origins. The two drifted apart, so in production the
// browser silently blocked every one of them: Leaflet (unpkg.com), all three
// basemap tile providers, every Wikimedia-hosted photo, and the Tripadvisor QR
// image. Dev was unaffected because CSP is disabled outside production, which
// is why it survived so long.
//
// Leaflet has since been self-hosted and dropped from this list; the rest of
// the drift is prevented structurally:
//   1. this module is the ONLY place an external origin may be declared;
//   2. server/index.js builds its CSP from it, so a policy can no longer be
//      written without reference to the frontend's real dependencies;
//   3. scripts/verify-csp-origins.mjs re-derives the origin list from the
//      actual source and fails the build when an origin is missing here.
//
// Note the verifier scans src/ and index.html. A vendored file under
// public/vendor/ is served same-origin and correctly needs no allowance.
//
// Every entry needs a reason. If you add a host, add it to the list AND add the
// matching entry to LINK_ONLY_HOSTS in the verifier if it is only ever a
// hyperlink (CSP does not govern navigation).

// No external scripts. Leaflet used to load here from unpkg.com and was the
// reason this list existed; it is now vendored at public/vendor/leaflet-1.9.4/
// (SHA-256 verified against the previous SRI pin) and served same-origin, so
// script-src is back to plain 'self'.
export const CSP_SCRIPT_ORIGINS = [];

export const CSP_STYLE_ORIGINS = [
  'https://fonts.googleapis.com',
];

export const CSP_IMG_ORIGINS = [
  'https://images.unsplash.com',
  'https://upload.wikimedia.org',
  // thumb.* serves the resized photo bytes; commons.* only serves attribution
  // pages, which are hyperlinks and therefore not governed by CSP.
  'https://thumb.wikimedia.org',
  'https://c.pxhere.com',
  // Basemap tile providers (SafariMap.jsx). Leaflet loads tiles as <img>, so
  // these belong to img-src rather than connect-src.
  'https://basemaps.cartocdn.com',
  'https://server.arcgisonline.com',
  'https://api.mapbox.com',
  // MapTiler vector tiles & DEM raster tiles (MapLibreSafariMap.jsx).
  'https://api.maptiler.com',
  // Tripadvisor QR code (TripadvisorBadge.jsx).
  'https://api.qrserver.com',
];

export const CSP_CONNECT_ORIGINS = [
  // MapLibre (MapLibreSafariMap.jsx) fetches its style JSON, vector tiles,
  // glyphs and sprites with fetch(), so these need connect-src, not just img-src.
  'https://basemaps.cartocdn.com',
  'https://tiles.basemaps.cartocdn.com',
  // Key-less terrain tiles for 3D relief (map/maplibre/terrain.js).
  'https://elevation-tiles-prod.s3.amazonaws.com',
  // Not used by the current Leaflet tile template, but mapbox-gl fetches styles
  // and tiles over XHR. Declared now so a renderer swap cannot silently break.
  'https://api.mapbox.com',
  // MapTiler vector styles, tiles & DEM (MapLibreSafariMap.jsx).
  'https://api.maptiler.com',
  'https://api.qrserver.com',
];

export const CSP_FONT_ORIGINS = [
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
];

export const CSP_FRAME_ORIGINS = [
  'https://www.openstreetmap.org',
];

/** Every origin the policy permits, deduplicated. Used by the verifier. */
export const ALL_CSP_ORIGINS = [
  ...new Set([
    ...CSP_SCRIPT_ORIGINS,
    ...CSP_STYLE_ORIGINS,
    ...CSP_IMG_ORIGINS,
    ...CSP_CONNECT_ORIGINS,
    ...CSP_FONT_ORIGINS,
    ...CSP_FRAME_ORIGINS,
  ]),
];

/**
 * Builds the helmet CSP directive object from the lists above.
 * @param {boolean} isProd
 */
export function buildCspDirectives(isProd) {
  return {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", ...CSP_SCRIPT_ORIGINS],
    styleSrc: ["'self'", "'unsafe-inline'", ...CSP_STYLE_ORIGINS],
    // blob: — MapLibre decodes tile and sprite images through blob URLs.
    imgSrc: ["'self'", 'data:', 'blob:', ...CSP_IMG_ORIGINS],
    connectSrc: ["'self'", ...CSP_CONNECT_ORIGINS],
    fontSrc: ["'self'", 'data:', ...CSP_FONT_ORIGINS],
    frameSrc: ["'self'", ...CSP_FRAME_ORIGINS],
    objectSrc: ["'none'"],
    baseUri: ["'none'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    upgradeInsecureRequests: [],
  };
}