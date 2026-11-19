/**
 * MapLibre style layer specifications.
 *
 * Each export is a plain layer object (MapLibre LayerSpecification) passed to
 * `map.addLayer()`. These replace the Leaflet equivalents:
 *
 *   - itinerary.js  →  routes-line / routes-label       (LineString line layers)
 *   - boundaries.js →  boundary-fill / boundary-border  (Polygon fill layer)
 *   - cluster.js    →  poi-cluster-*                    (native geojson clustering)
 *   - drawHabitats  →  habitat-circle                   (circle layer)
 *
 * Using a single geojson source per data group and toggling visibility via
 * `setLayoutProperty(layer, 'visibility', …)` or `setFilter` is cheaper than
 * the Leaflet approach of tearing down and re-adding each layer on every
 * category/circuit change.
 */

import { BRAND } from '../tokens.js';

/**
 * Circle layer for clustered point sources.
 * Added for every cluster size tier; the count label is a separate
 * symbol layer that reads `feature.state.cluster`.
 */
export const clusterCircleLayer = {
  id: 'poi-cluster',
  type: 'circle',
  source: 'pois',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': BRAND.forest,
    'circle-radius': [
      'step',
      ['get', 'point_count'],
      18, 10,
      24, 30,
      30, 50,
    ],
    'circle-stroke-width': 2,
    'circle-stroke-color': BRAND.gold,
    'circle-stroke-opacity': 0.8,
    'circle-opacity': 0.85,
  },
};

/**
 * Count label inside cluster circles.
 */
export const clusterCountLayer = {
  id: 'poi-cluster-count',
  type: 'symbol',
  source: 'pois',
  filter: ['has', 'point_count'],
  layout: {
    'text-field': '{point_count_abbreviated}',
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS'],
    'text-size': 12,
  },
  paint: {
    'text-color': '#ffffff',
    'text-halo-color': 'rgba(0, 0, 0, 0.6)',
    'text-halo-width': 1,
  },
};

/**
 * Un-clustered POI markers rendered as circles + symbol labels.
 * A single source holds both places and activities; the `kind` property
 * filters which category is visible.
 */
export const poiSymbolLayer = {
  id: 'poi-label',
  type: 'symbol',
  source: 'pois',
  filter: ['!', ['has', 'point_count']],
  layout: {
    'text-field': ['get', 'shortName', ['get', 'name']],
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS'],
    'text-size': 11,
    'text-offset': [0, 1.4],
    'text-anchor': 'top',
    'icon-image': ['get', 'iconType'],
    'icon-size': 0.9,
  },
  paint: {
    'text-color': BRAND.forest,
    'text-halo-color': 'rgba(255, 255, 255, 0.8)',
    'text-halo-width': 1,
    'text-opacity': 0,
  },
};

/**
 * Route / itinerary legs as LineStrings.
 *
 * Leaflet's itinerary.js used weight + opacity + dashArray to distinguish
 * active vs inactive legs. In MapLibre the same distinction is expressed as
 * paint properties driven by a `highlight` feature property:
 *
 *   line-width:   active=5, inactive=2
 *   line-opacity: active=1,  inactive=0.4
 *   line-dasharray: flights = [2,2], active roads = none, inactive roads = [4,3]
 */
export function routeLineLayer(activeLegId = null) {
  return {
    id: 'routes-line',
    type: 'line',
    source: 'routes',
    'source-layer': 'routes',
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
    paint: {
      'line-color': ['get', 'color'],
      // `step` needs a numeric input; a boolean feature-state needs `case`.
      // The old `step` form failed validation, so the routes layer never drew.
      'line-width': [
        'case',
        ['boolean', ['feature-state', 'highlight'], false],
        5, // active
        2, // default (inactive)
      ],
      'line-opacity': [
        'case',
        ['boolean', ['feature-state', 'highlight'], false],
        1.0, // active
        0.4, // inactive
      ],
      // line-dasharray can depend on feature properties but not feature-state,
      // so flown legs are always dashed and road legs solid.
      'line-dasharray': [
        'match',
        ['get', 'mode'],
        'fly', ['literal', [2, 2]],
        ['literal', [1, 0]],
      ],
    },
  };
}

/**
 * Direction arrow head at the midpoint of each route leg.
 * Rendered as a small symbol layer showing ✈️ or ▲ based on the `mode` property.
 */
export const routeArrowLayer = {
  id: 'routes-arrow',
  type: 'symbol',
  source: 'routes',
  layout: {
    'icon-image': [
      'match',
      ['get', 'mode'],
      'fly', '✈️',
      '◀',
    ],
    'icon-size': 0.7,
    'icon-allow-overlap': true,
    'text-field': ['get', 'name'],
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS'],
    'text-size': 10,
    'text-offset': [0, 0.8],
    'text-anchor': 'top',
  },
  paint: {
    'text-color': BRAND.forest,
    'text-halo-color': 'rgba(255, 255, 255, 0.8)',
    'text-halo-width': 1,
  },
};

/**
 * Habitat range circles. The `radius` property (in metres) is converted to
 * screen pixels via a zoom-dependent property function so circles scale
 * realistically as you zoom.
 */
export const habitatCircleLayer = {
  id: 'habitat-circle',
  type: 'circle',
  source: 'habitats',
  paint: {
    'circle-color': ['get', 'habitatColor'],
    'circle-radius': [
      'interpolate',
      ['linear'],
      ['zoom'],
      4, ['get', 'radius'],  // base radius in px at z4
      10, ['*', ['get', 'radius'], 1.8],
    ],
    'circle-stroke-color': BRAND.forest,
    'circle-stroke-width': 1,
    'circle-opacity': 0,
    'circle-stroke-opacity': 0.85,
    'fill-opacity': 0.15,
  },
};

/**
 * Park boundary polygons (WDPA GeoJSON).
 * When PARK_BOUNDARIES is null (the default), this layer is never added.
 */
export const boundaryFillLayer = {
  id: 'boundary-fill',
  type: 'fill',
  source: 'boundaries',
  paint: {
    'fill-color': ['get', 'color'],
    'fill-opacity': [
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      0.24,
      0.12,
    ],
  },
};

export const boundaryBorderLayer = {
  id: 'boundary-border',
  type: 'line',
  source: 'boundaries',
  paint: {
    'line-color': ['get', 'color'],
    'line-width': [
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      2.5,
      1.5,
    ],
    'line-opacity': 0.9,
  },
};
