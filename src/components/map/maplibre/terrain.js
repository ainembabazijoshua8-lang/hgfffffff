/**
 * 3D terrain (DEM) configuration for the MapLibre migration.
 *
 * MapLibre GL JS renders 3D terrain by draping vector/raster layers over a
 * per-tile elevation mesh. The elevation mesh is a `raster-dem` source — a
 * tiled height map encoded as RGB. Each provider below serves raster tiles
 * that MapLibre decodes into elevations.
 *
 * The two focal landmarks — Ngorongoro Crater (−3.24, 35.48) and Mount
 * Kilimanjaro (−3.07, 37.36) — both fall under the global coverage of the
 * MapTiler terrain service and the AWS OpenData Copernicus DEM, so a single
 * DEM source covers both.
 *
 * Terrain is enabled/disabled at runtime via `setTerrain({ source, exaggeration })`
 * on the raw maplibre-gl Map instance (obtained through the MapRef from
 * react-map-gl/maplibre's `useMap` hook). When disabled, `setTerrain(null)`
 * returns the map to a flat plane.
 */

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || '';

export const DEM_ENCODING = {
  TERRARIUM: 'terrarium',
  MAPIMAP: 'mapbox',
};

function mtTileUrl(path) {
  return MAPTILER_KEY
    ? `https://api.maptiler.com${path}?key=${encodeURIComponent(MAPTILER_KEY)}`
    : '';
}

/**
 * Elevation sources. All use RGB-encoded raster DEM tiles.
 *
 * - `maptiler`: Global coverage at zoom 0–10, terrarium encoding.
 *   Best for Ngorongoro Crater and Mount Kilimanjaro. Requires a MapTiler key.
 *   Tile URL: https://api.maplibre.org/.../{z}/{x}/{y}.png (placeholder)
 *   In production: https://api.maptiler.com/tiles/terrain-rgb/{z}/{x}/{y}.png?key=...
 *
 * - `copernicus`: AWS OpenData, 30 m resolution, terrarium encoding.
 *   No API key required. Coverage: global.
 *   URL: https://s3.eu-central-1.amazonaws.com/...
 *
 * - `srtm`: NASA SRTM 1-arc-second (~30 m), mapbox encoding. Legacy but free.
 */
export const DEM_SOURCES = {
  maptiler: {
    id: 'dem',
    type: 'raster-dem',
    url: MAPTILER_KEY
      ? `https://api.maptiler.com/tiles/terrain-rgb/{z}/{x}/{y}.png?key=${encodeURIComponent(MAPTILER_KEY)}`
      : DEM_SOURCES.copernicus.url,
    tileSize: 256,
    maxzoom: 14,
    encoding: DEM_ENCODING.MAPIMAP,
    attribution:
      MAPTILER_KEY
        ? '© <a href="https://www.maptiler.com/">MapTiler</a> © <a href="https://www.euvs.esoc.esa.int/">ESA/Copernicus</a>'
        : 'Demo DEM — set VITE_MAPTILER_KEY for production terrain',
  },
  copernicus: {
    id: 'dem',
    type: 'raster-dem',
    url:
      'https://s3.eu-central-1.amazonaws.com/sentinel-cogs/copernicus-dem-30/{z}/{x}/{y}.png',
    tileSize: 256,
    maxzoom: 12,
    encoding: DEM_ENCODING.TERRARIUM,
    attribution:
      '© <a href="https://sentinel.esa.int/">ESA</a> (Copernicus Sentinel-3 L2, DEM 30m)',
  },
};

/**
 * Default active DEM source. Uses MapTiler with a fallback to Copernicus
 * (no key required) when VITE_MAPTILER_KEY is absent.
 */
export const ACTIVE_DEM = MAPTILER_KEY ? DEM_SOURCES.maptiler : DEM_SOURCES.copernicus;

/**
 * Per-region terrain exaggeration settings.
 *
 * Ngorongoro Crater: a 2.5 km wide caldera with ~600 m walls. Exaggeration 1.4
 *   makes the rim clearly readable without making it look artificial.
 *
 * Mount Kilimanjaro: a 5,895 m stratovolcano. The crater rim and Kibo cone are
 *   prominent at natural scale; 1.2 keeps it believable while sharpening the
 *   summit icefield.
 *
 * Default 1.0 is used for the overview so terrain doesn't dominate at low zoom.
 */
export const TERRAIN_EXAGGERATION = {
  ngorongoro: 1.4,
  kilimanjaro: 1.2,
  default: 1.0,
};

/**
 * Determine the terrain exaggeration for the current viewport.
 * Returns 0 when terrain should be disabled (low zoom, no focal landmark in
 * view). Called by MapLibreSafariMap whenever the camera stops.
 *
 * @param {{lng:number,lat:number,zoom:number}} view
 * @param {boolean} terrainEnabled
 * @returns {{ exaggeration: number, demSource: string|null }}
 */
export function terrainForView(view, terrainEnabled) {
  if (!terrainEnabled || view.zoom < 9) {
    return { exaggeration: 0, demSource: null };
  }

  const { lng, lat } = view;
  const KILIMANJARO = { lng: 37.3556, lat: -3.0674 };
  const NGORONGORO = { lng: 35.48, lat: -3.24 };

  const dKili = Math.hypot(lng - KILIMANJARO.lng, lat - KILIMANJARO.lat);
  const dNgo = Math.hypot(lng - NGORONGORO.lng, lat - NGORONGORO.lat);

  if (dNgo < 1.5) return { exaggeration: TERRAIN_EXAGGERATION.ngorongoro, demSource: ACTIVE_DEM.id };
  if (dKili < 1.5) return { exaggeration: TERRAIN_EXAGGERATION.kilimanjaro, demSource: ACTIVE_DEM.id };

  return { exaggeration: TERRAIN_EXAGGERATION.default, demSource: ACTIVE_DEM.id };
}

/**
 * Apply terrain to a MapLibre map instance.
 *
 * @param {import('maplibre-gl').Map} map - raw maplibre-gl Map from `mapRef.getMap()`
 * @param {{ enabled: boolean, exaggeration: number, demSource: string|null }} opts
 */
export function applyTerrain(map, opts) {
  if (!map) return;

  if (!opts.enabled || !opts.demSource || opts.exaggeration <= 0) {
    map.setTerrain(null);
    return;
  }

  if (!map.getSource(opts.demSource)) {
    map.addSource(opts.demSource, ACTIVE_DEM);
  }

  map.setTerrain({
    source: opts.demSource,
    exaggeration: opts.exaggeration,
  });
}

/**
 * Remove terrain and its DEM source from the map.
 * @param {import('maplibre-gl').Map} map
 */
export function clearTerrain(map) {
  if (!map) return;
  map.setTerrain(null);
  if (map.getSource(ACTIVE_DEM.id)) {
    map.removeSource(ACTIVE_DEM.id);
  }
}
