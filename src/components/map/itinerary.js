/**
 * Directional route polylines for tour itineraries.
 *
 * Each leg is rendered as its own polyline so a day card can highlight exactly
 * the segment it describes, and so the non-active legs can be dimmed without
 * redrawing the whole route.
 */

const LEG_STYLE = {
  active: { weight: 5, opacity: 1, lineCap: 'round' },
  inactive: { weight: 3, opacity: 0.45, lineCap: 'round' },
};

/**
 * Draw an itinerary as ordered legs.
 * @param {object} L
 * @param {object} group  layer group to render into
 * @param {Array}  legs   [{ id, from, to, coords:[[lat,lng],...], color, label }]
 * @param {string|null} activeLegId
 */
export function renderItinerary(L, group, legs, activeLegId, onLegSelect) {
  const layers = new Map();

  legs.forEach((leg, index) => {
    const isActive = leg.id === activeLegId;
    const isFlight = leg.mode === 'fly';

    const line = L.polyline(leg.coords, {
      ...(isActive ? LEG_STYLE.active : LEG_STYLE.inactive),
      color: leg.color || (isFlight ? '#C9A227' : '#1A362B'),
      // Flights are inherently speculative; a dashed line reads as "estimate".
      dashArray: isFlight ? '2, 10' : isActive ? null : '9, 7',
      // Draw later legs first so the active leg is never painted underneath.
      zIndexOffset: isActive ? 1000 : index,
    });

    // Arrowhead at the midpoint conveys direction without an animation.
    if (leg.coords.length > 1) {
      line.bindTooltip(
        `${leg.label || `${leg.from} → ${leg.to}`}${isFlight ? ' · flight' : ''}`,
        { sticky: true, className: 'safari-leg-tooltip' }
      );
      const mid = leg.coords[Math.floor(leg.coords.length / 2)];
      L.marker(mid, {
        interactive: true,
        icon: L.divIcon({
          className: 'safari-leg-arrow',
          html: `<span aria-hidden="true">${isFlight ? '✈️' : '▲'}</span>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        }),
      })
        .on('click', () => onLegSelect?.(leg.id))
        .addTo(group);
    }

    line.on('click', () => onLegSelect?.(leg.id));
    line.addTo(group);
    layers.set(leg.id, line);
  });

  return layers;
}

/** Emphasise one leg and dim the rest without a full redraw. */
export function highlightLeg(layers, activeLegId) {
  layers.forEach((line, id) => {
    line.setStyle(id === activeLegId ? LEG_STYLE.active : LEG_STYLE.inactive);
    line.bringToFront();
  });
}

/**
 * Pan the camera to a leg, framed with padding so the line is not flush to the
 * viewport edge and stays clear of the bottom quick-nav rail.
 */
export function focusLeg(L, map, leg, { padding = [56, 56, 96, 56] } = {}) {
  if (!leg?.coords?.length) return;
  map.flyToBounds(L.latLngBounds(leg.coords), {
    padding,
    duration: 0.9,
    easeLinearity: 0.25,
  });
}