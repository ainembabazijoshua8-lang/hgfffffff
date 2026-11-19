/**
 * Vector tile style providers for the MapLibre migration.
 *
 * Replaces the raster tile providers in src/components/SafariMap.jsx.
 * Each entry is a MapLibre-compatible Mapbox-style JSON URL. Unlike Leaflet's
 * `{z}/{x}/{y}.png` raster templates, these style documents reference MVT
 * (Mapbox Vector Tile) endpoints that MapLibre fetches and renders client-side
 * via WebGL — no DOM/SVG per tile.
 *
 * Style transitions (cross-fades) between these are handled natively by
 * MapLibre's `setStyle(styleUrl, { transition: ... })` when the `mapStyle` prop
 * changes, replacing the 150-line alternating-pane state machine that Leaflet
 * needed because it had no built-in cross-fade.
 *
 * envVar gating mirrors the Leaflet implementation: a provider whose API key
 * env var is absent is filtered out so a broken/missing layer button is never
 * shown. The CSP hosts for each provider are declared in shared-csp-origins.js.
 */

import { BRAND } from '../tokens.js';

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || '';
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

// Declared up front so the satellite entry can fall back to it. It previously
// read VECTOR_STYLES.carto.url from inside VECTOR_STYLES' own initializer, which
// throws (temporal dead zone) whenever VITE_MAPTILER_KEY is unset — the whole
// map module failed to load and every map showed "Map unavailable".
const CARTO_VOYAGER_URL = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

function mtUrl(path) {
  return MAPTILER_KEY
    ? `https://api.maptiler.com${path}?key=${encodeURIComponent(MAPTILER_KEY)}`
    : '';
}

/**
 * Vector style providers, ordered by preference.
 *
 * - `topo`:       CARTO Voyager GL — a clean, labelled vector style over OSM data.
 * - `satellite`:  Esri WorldImagery via MapTiler's satellite composite (requires key).
 * - `relief`:     OpenTopoMap vector style (hiking-focused).
 */
export const VECTOR_STYLES = {
  carto: {
    id: 'safari-carto',
    label: 'Safari Topo',
    icon: 'map',
    url: CARTO_VOYAGER_URL,
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
    envVar: null,
  },
  satellite: {
    id: 'safari-satellite',
    label: 'Satellite View',
    icon: 'globe',
    url: MAPTILER_KEY
      ? `https://api.maptiler.com/tiles/satellite-gl-style/style.json?key=${encodeURIComponent(MAPTILER_KEY)}`
      : CARTO_VOYAGER_URL,
    attribution: MAPTILER_KEY
      ? '© <a href="https://www.maptiler.com/">MapTiler</a> © <a href="https://openmaptiles.org/">OpenMapTiles</a>'
      : '© OpenStreetMap contributors — demo tiles',
    envVar: 'VITE_MAPTILER_KEY',
  },
  relief: {
    id: 'safari-relief',
    label: 'Elevation Relief',
    icon: 'mountain',
    url: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
    envVar: null,
  },
};

const FALLBACK_STYLE = VECTOR_STYLES.carto;

/**
 * Only styles whose API key env var is satisfied. Providers with `envVar: null`
 * (CARTO, relief) are always available. MapTiler satellite is opt-in.
 */
export const AVAILABLE_VECTOR_STYLES = Object.values(VECTOR_STYLES).filter(provider => {
  if (!provider.envVar) return true;
  const key = import.meta.env[provider.envVar];
  return !!key;
});

export function resolveStyle(id) {
  const provider = VECTOR_STYLES[id];
  if (!provider || (provider.envVar && !import.meta.env[provider.envVar])) {
    return FALLBACK_STYLE.url;
  }
  return provider.url;
}

/**
 * MapLibre applies a uniform fadeDuration across raster sources. 0ms would leave
 * a blank gap during the native style cross-fade; 800ms matches the easing used
 * by the old Leaflet pane transitions, keeping the feel familiar.
 */
export const FADE_DURATION_MS = 800;

export const TRANSITION_DURATION_MS = 800;

export { BRAND, FALLBACK_STYLE };
