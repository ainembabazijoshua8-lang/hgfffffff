import { useMemo } from 'react';

/**
 * Route cards.
 *
 * The map data models itineraries as discrete named routes (Northern Circuit,
 * Cross-Border, Bush-to-Beach) rather than as numbered days, so this panel
 * lists routes and never fabricates a "Day 1 / Day 2" sequence that the data
 * does not actually contain.
 *
 * Selecting a route highlights its polyline and auto-pans the map to it.
 * This component holds no map state — the parent passes the active id and a
 * handler — so the panel and the map cannot disagree.
 */
export default function ItineraryPanel({ routes, activeRouteId, onSelectRoute }) {
  const active = useMemo(
    () => routes.find(r => r.id === activeRouteId) || null,
    [routes, activeRouteId]
  );

  if (!routes.length) return null;

  return (
    <div className="safari-map-panel px-3 py-2 max-w-[17rem]">
      <div className="text-[10px] font-bold uppercase tracking-wider text-teal-500 mb-1.5 flex items-center justify-between gap-2">
        <span>Routes</span>
        {active ? (
          <button
            type="button"
            onClick={() => onSelectRoute(null)}
            className="text-[9px] font-semibold text-terracotta-500 hover:text-terracotta-700 normal-case tracking-normal"
          >
            clear
          </button>
        ) : null}
      </div>

      <ul className="space-y-1" role="listbox" aria-label="Itinerary routes">
        {routes.map(route => {
          const selected = route.id === activeRouteId;
          return (
            <li key={route.id} role="option" aria-selected={selected}>
              <button
                type="button"
                onClick={() => onSelectRoute(selected ? null : route.id)}
                aria-pressed={selected}
                className={`w-full text-left rounded-lg px-2 py-1.5 transition ${
                  selected ? 'bg-teal-800 text-cream-50' : 'text-teal-800 hover:bg-cream-100'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="inline-block w-3 shrink-0 border-t-2"
                    style={{
                      borderColor: route.color || '#1A362B',
                      borderTopStyle: route.mode === 'fly' ? 'dotted' : 'dashed',
                    }}
                  />
                  <span className="text-[11px] font-semibold leading-tight truncate">
                    {route.label}
                  </span>
                  <span
                    className={`ml-auto shrink-0 text-[9px] uppercase tracking-wide ${
                      selected ? 'text-cream-200' : 'text-teal-400'
                    }`}
                  >
                    {route.mode === 'fly' ? 'flight' : 'drive'}
                  </span>
                </div>
                {selected ? (
                  <p className="mt-1 text-[10px] text-cream-200 leading-snug">
                    {route.coords.length} stops · {route.subtitle || 'Tap again to clear'}
                  </p>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}