/**
 * Protected-area boundaries for the safari atlas.
 *
 * INTENTIONALLY EMPTY.
 *
 * Populating this file requires authoritative boundary geometry. The map must
 * not draw polygons that were hand-drawn or approximated — a "boundary" that
 * does not match the legally defined boundary misrepresents where a protected
 * area starts and stops.
 *
 * Recommended source: UNEP-WCMC World Database on Protected Areas (WDPA),
 * public and CC-BY-SA 4.0. Filter to the parks in src/data/mapData.js, and
 * carry `source` so attribution is rendered automatically.
 *
 * Shape of each entry: a GeoJSON FeatureCollection, one Polygon/MultiPolygon
 * feature per park:
 *
 *   export const PARK_BOUNDARIES = {
 *     attribution: 'WDPA (UNEP-WCMC)',
 *     features: [
 *       {
 *         type: 'Feature',
 *         properties: {
 *           id: 'serengeti',              // must match MAP_LOCATIONS[].id
 *           name: 'Serengeti National Park',
 *           iucn: 'Category II',
 *           source: 'WDPA (UNEP-WCMC)',
 *           // color: '#C9683D',         // optional per-park accent
 *         },
 *         geometry: {
 *           type: 'Polygon',
 *           coordinates: [[[lng, lat], [lng, lat], ...]],
 *         },
 *       },
 *     ],
 *   };
 *
 * While this is null the map keeps the clearly-labelled "indicative core range"
 * circles from MAP_HABITATS, which are honest about being approximations.
 */
export const PARK_BOUNDARIES = null;