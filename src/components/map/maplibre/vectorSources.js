/**
 * Vector source (GeoJSON) conversion for the MapLibre migration.
 *
 * Each function takes the same data structures that the Leaflet implementation
 * consumes (MAP_LOCATIONS, MAP_ROUTES, MAP_HABITATS, PARK_BOUNDARIES) and emits
 * a GeoJSON FeatureCollection that MapLibre renders as a `geojson` source.
 *
 * Coordinate convention: the app stores coords as [lat, lng] (Leaflet order).
 * GeoJSON requires [lng, lat]. Every converter below performs the swap explicitly
 * so the output passes MapLibre's validation untransformed.
 */

import { BRAND } from '../tokens.js';

function latLngToLngLat([lat, lng]) {
  return [lng, lat];
}

function latLngArrayToLngLatArray(coords) {
  return coords.map(latLngToLngLat);
}

/**
 * Convert MAP_ROUTES into GeoJSON LineString features.
 *
 * In Leaflet, each route is a separate `L.polyline` in its own layer group
 * (see src/components/map/itinerary.js). In MapLibre a single geojson source
 * holds every leg, and the active/inactive state is driven by a `line-opacity`
 * and `line-width` expression that reads a `highlight` boolean property set
 * per-feature. This avoids tearing down and re-adding layers on every selection.
 *
 * @param {Array} routes - MAP_ROUTES entries (subset already circuit-filtered)
 * @param {string|null} activeLegId
 * @returns {GeoJSON.FeatureCollection}
 */
export function routesToGeoJSON(routes, activeLegId = null) {
  const features = routes.map(route => ({
    type: 'Feature',
    id: route.id,
    properties: {
      routeId: route.id,
      name: route.name,
      subtitle: route.subtitle,
      mode: route.mode,
      color: route.color || (route.mode === 'fly' ? BRAND.gold : BRAND.forest),
      dashed: route.mode === 'fly',
      highlight: route.id === activeLegId,
    },
    geometry: {
      type: 'LineString',
      coordinates: latLngArrayToLngLatArray(route.coords),
    },
  }));

  return { type: 'FeatureCollection', features };
}

/**
 * Convert MAP_HABITATS ranges into GeoJSON Point features with radius.
 *
 * Leaflet rendered these as `L.circle` (SVG). MapLibre uses a `circle` layer;
 * the radius in metres is carried as the `radius` property and mapped to
 * `circle-radius` via a step expression or a property function at render time.
 *
 * @param {Array} habitats - MAP_HABITATS entries
 * @returns {GeoJSON.FeatureCollection}
 */
export function habitatsToGeoJSON(habits = []) {
  const features = [];
  for (const habitat of habits) {
    if (!habitat?.ranges) continue;
    for (const range of habitat.ranges) {
      features.push({
        type: 'Feature',
        properties: {
          habitatId: habitat.id,
          habitatName: habitat.name,
          habitatColor: habitat.color,
          rangeLabel: range.label,
          parkId: range.parkId || null,
          radius: range.radius,
        },
        geometry: {
          type: 'Point',
          coordinates: [range.lng, range.lat],
        },
      });
    }
  }
  return { type: 'FeatureCollection', features };
}

/**
 * Convert MAP_LOCATIONS into GeoJSON Point features suitable for clustering.
 *
 * MapLibre performs clustering natively on a geojson source: set `cluster: true`,
 * `clusterMaxZoom`, and `clusterRadius` on the source, then add three layers
 * (aggregate circles, count labels, and the un-clustered points themselves).
 *
 * @param {Array} locations - MAP_LOCATIONS entries
 * @param {string} activeLocationId
 * @returns {GeoJSON.FeatureCollection}
 */
export function locationsToGeoJSON(locations, activeLocationId = null) {
  const features = locations.map(loc => ({
    type: 'Feature',
    id: loc.id,
    properties: {
      locationId: loc.id,
      name: loc.name,
      shortName: loc.shortName,
      subtitle: loc.subtitle,
      iconType: loc.iconType,
      badge: loc.badge || '',
      color: loc.color,
      circuit: loc.circuit,
      active: loc.id === activeLocationId,
      zoom: loc.zoom,
      kind: 'place',
    },
    geometry: {
      type: 'Point',
      coordinates: [loc.lng, loc.lat],
    },
  }));
  return { type: 'FeatureCollection', features };
}

/**
 * Convert MAP_ACTIVITIES into GeoJSON Point features.
 *
 * Activities are rendered as smaller pins. In MapLibre they share a geojson
 * source with locations but are tagged with `kind: 'activity'` so a filter
 * expression can show/hide them by category.
 *
 * @param {Array} activities
 * @returns {GeoJSON.FeatureCollection}
 */
export function activitiesToGeoJSON(activities = []) {
  const features = activities.map(act => ({
    type: 'Feature',
    id: act.id,
    properties: {
      activityId: act.id,
      name: act.name,
      iconType: act.iconType,
      color: act.color,
      parkId: act.parkId,
      kind: 'activity',
    },
    geometry: {
      type: 'Point',
      coordinates: [act.lng, act.lat],
    },
  }));
  return { type: 'FeatureCollection', features };
}

/**
 * Combine locations and activities into one clustered geojson source.
 * Categories are toggled at the layer level with `filter` expressions
 * rather than by swapping sources — this keeps the cluster math stable
 * when toggling between Places / Activities / Habitats.
 *
 * @returns {GeoJSON.FeatureCollection}
 */
export function poisToGeoJSON(locations, activities, activeLocationId) {
  const locFeatures = locations.map(loc => ({
    type: 'Feature',
    id: `place-${loc.id}`,
    properties: {
      ...loc,
      kind: 'place',
      active: loc.id === activeLocationId,
    },
    geometry: { type: 'Point', coordinates: [loc.lng, loc.lat] },
  }));

  const actFeatures = activities.map(act => ({
    type: 'Feature',
    id: `activity-${act.id}`,
    properties: {
      ...act,
      kind: 'activity',
    },
    geometry: { type: 'Point', coordinates: [act.lng, act.lat] },
  }));

  return {
    type: 'FeatureCollection',
    features: [...locFeatures, ...actFeatures],
  };
}

/**
 * Convert PARK_BOUNDARIES (WDPA GeoJSON FeatureCollection) into a MapLibre
 * geojson source. The data is already GeoJSON; we just pass it through with
 * a stable source id and ensure the fill style properties are present.
 *
 * @param {object|null} fc - FeatureCollection from src/data/parkBoundaries.js
 * @returns {GeoJSON.FeatureCollection|null}
 */
export function boundariesToGeoJSON(fc) {
  if (!fc || !fc.features) return null;
  return { type: 'FeatureCollection', features: fc.features };
}
