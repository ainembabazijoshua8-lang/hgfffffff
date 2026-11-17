import { BRAND, CLUSTER_CELL, CLUSTER_MAX_ZOOM } from './tokens.js';

/**
 * Grid-based marker clustering.
 *
 * Why not leaflet.markercluster: Leaflet here is loaded as a SRI-pinned CDN
 * global (window.L, see index.html), not as an npm import. Adding the plugin
 * would mean a second CDN script, a second SRI pin, and a load-order
 * dependency — all for behaviour we can express in a small amount of code and
 * keep fully deterministic (cluster state is a pure function of zoom + viewport,
 * which makes it testable and avoids the classic markercluster "markers jump on
 * re-add" artefact).
 *
 * Approach: project every marker to pixel space at the current zoom, bucket by
 * a fixed cell size, then emit one marker per bucket that holds more than one
 * member. Clusters whose members overlap the viewport are kept; distant ones
 * are dropped so we never build markers that are off-screen.
 */

/** Cluster a plain list of {lat, lng, ...} items for the given map view. */
export function clusterItems(items, { zoom, bounds, cell = CLUSTER_CELL, maxZoom = CLUSTER_MAX_ZOOM }) {
  // Above the threshold, clustering only adds noise — show real pins.
  if (zoom > maxZoom) return items.map(item => ({ ...item, isCluster: false, members: [item] }));

  const cellCount = Math.pow(2, zoom);
  const buckets = new Map();

  for (const item of items) {
    const point = project(item.lat, item.lng, zoom, cellCount);
    // Cull anything outside the viewport; it would never be seen.
    if (bounds) {
      if (typeof bounds.contains === 'function') {
        // Support Leaflet bounds and MapLibre bounds
        const pointLike = bounds.getWest ? { lng: item.lng, lat: item.lat } : [item.lng, item.lat];
        if (bounds.contains && !bounds.contains(pointLike)) continue;
      } else if (bounds.getWest) { // leafet fallback
        if(item.lng < bounds.getWest() || item.lng > bounds.getEast() || item.lat < bounds.getSouth() || item.lat > bounds.getNorth()) continue;
      }
    }
    const key = `${point.x}:${point.y}`;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.members.push(item);
      bucket.lat += item.lat;
      bucket.lng += item.lng;
    } else {
      buckets.set(key, { lat: item.lat, lng: item.lng, members: [item] });
    }
  }

  const clusters = [];
  for (const bucket of buckets.values()) {
    if (bucket.members.length === 1) {
      const only = bucket.members[0];
      clusters.push({ ...only, isCluster: false, members: [only] });
      continue;
    }
    const n = bucket.members.length;
    clusters.push({
      id: `cluster-${clusters.length}`,
      lat: bucket.lat / n,
      lng: bucket.lng / n,
      isCluster: true,
      count: n,
      // Keep the layers that are present in the bucket so the cluster chip can
      // show which marker types it aggregates.
      kinds: [...new Set(bucket.members.map(m => m.kind).filter(Boolean))],
      members: bucket.members,
    });
  }
  return clusters;
}

function project(lat, lng, zoom, cellCount) {
  const scale = cellCount * 256;
  const x = ((lng + 180) / 360) * scale;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const y =
    (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
  // Quantise into grid cells so neighbouring markers collapse together.
  return { x: Math.floor(x / CLUSTER_CELL), y: Math.floor(y / CLUSTER_CELL) };
}



/**
 * Cluster icon markup.
 *
 * Sized by count so a 3-marker cluster does not visually outweigh a 40-marker
 * one, and uses a gold ring for the containing-category contrast rather than a
 * second fill colour, which keeps the pin legible against satellite imagery.
 */
export function clusterIconHtml(count, kinds = []) {
  const size = count >= 100 ? 52 : count >= 25 ? 46 : count >= 10 ? 42 : 38;
  const dot = kinds.length > 1
    ? `<span class="safari-cluster__kinds" aria-hidden="true">${kinds.slice(0, 3).join('')}</span>`
    : '';
  return `
    <div class="safari-cluster" style="--cluster-size:${size}px">
      <span class="safari-cluster__ring" aria-hidden="true"></span>
      <span class="safari-cluster__count">${count}</span>
      ${dot}
      <span class="safari-cluster__label">${count} places</span>
    </div>`;
}

/** Zoom level at which a cluster of this size is worth expanding. */
export function expansionZoom(count, currentZoom) {
  // log2 scaling approximates "how far until these markers separate".
  return Math.min(
    CLUSTER_MAX_ZOOM + 1,
    currentZoom + 1 + Math.ceil(Math.log2(Math.max(2, count)) / 2)
  );
}

export { BRAND };