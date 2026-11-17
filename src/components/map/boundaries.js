import { BRAND } from './tokens.js';

/**
 * GeoJSON boundary rendering.
 *
 * IMPORTANT — data provenance
 * ---------------------------
 * This module renders whatever GeoJSON FeatureCollection it is handed. It ships
 * with NO built-in geometry on purpose.
 *
 * The previous implementation drew habitat/park extents as concentric circles,
 * which are honest only when labelled as *indicative*. Replacing those with
 * polygons requires real protected-area boundaries. Inventing polygons would
 * misstate where a conservation area actually begins and ends, which is a
 * cartographic and legal problem, not a cosmetic one.
 *
 * Authoritative sources to populate src/data/parkBoundaries.js:
 *   - UNEP-WCMC World Database on Protected Areas (WDPA) — public, CC-BY-SA 4.0
 *   - TANAPA / Tanzania Protected Areas dataset
 *   - Kenya National Parks (KWS) open data
 * WDPA is the usual choice; filter by WDPA_ID and IUCN category, and keep the
 * attribution string in `attribution` so the map can credit it.
 *
 * Until that file is populated, `renderBoundaries` is a no-op and the map keeps
 * the clearly-labelled indicative circles it has today.
 */

const DEFAULT_STYLE = {
  color: BRAND.forest,
  weight: 1.5,
  opacity: 0.9,
  fillColor: BRAND.forest,
  fillOpacity: 0.12,
  lineJoin: 'round',
};

const HOVER_STYLE = { weight: 2.5, fillOpacity: 0.22 };

/**
 * Render a FeatureCollection of boundaries into a Leaflet layer group.
 *
 * @param {object} L        Leaflet global
 * @param {object} group    L.layerGroup() to render into (cleared by caller)
 * @param {object|null} fc GeoJSON FeatureCollection, or null
 * @param {object} opts     { onSelect, selectedId, attribution }
 */
export function renderBoundaries(L, group, fc, opts = {}) {
  const { onSelect, selectedId } = opts;
  const layers = [];

  if (!fc || !Array.isArray(fc.features) || fc.features.length === 0) {
    return layers;
  }

  for (const feature of fc.features) {
    if (!feature || !feature.geometry) continue;

    const props = feature.properties || {};
    const isSelected = selectedId && props.id === selectedId;

    // Crisp 1.5px border, soft fill. Per-feature overrides are merged last so
    // each park can carry its own IUCN accent if the dataset provides one.
    const style = {
      ...DEFAULT_STYLE,
      ...(props.color ? { color: props.color, fillColor: props.color } : null),
      ...(isSelected ? { weight: 2.5, fillOpacity: 0.24 } : null),
      ...(props.style || null),
    };

    const layer = L.geoJSON(feature, {
      style,
      interactive: Boolean(onSelect),
      onEachFeature: (feat, lyr) => {
        const name = (feat.properties || {}).name;
        if (name) {
          lyr.bindTooltip(`${name}${props.iucn ? ` · ${props.iucn}` : ''}`, {
            sticky: true,
            className: 'safari-boundary-tooltip',
          });
        }
        if (onSelect) {
          lyr.on({
            mouseover: () => {
              if (!isSelected) lyr.setStyle(HOVER_STYLE);
            },
            mouseout: () => {
              if (!isSelected) lyr.setStyle(style);
            },
            click: () => onSelect(props.id),
          });
        }
      },
    });

    layers.push(layer);
  }

  // Grouping keeps a single handle for the caller to add/remove wholesale.
  const combined = L.featureGroup(layers);
  group.addLayer(combined);
  return layers;
}

/**
 * Attribution string required by WDPA-style datasets. Returns null when there
 * is nothing to credit, so the map control is not left with an empty string.
 */
export function boundariesAttribution(fc) {
  const sources = new Set(
    (fc?.features || []).map(f => f?.properties?.source).filter(Boolean)
  );
  if (!sources.size) return null;
  return [...sources].join(' · ');
}