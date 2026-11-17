import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  MAP_CATEGORIES,
  MAP_CIRCUITS,
  MAP_LOCATIONS,
  MAP_HABITATS,
  MAP_ACTIVITIES,
  MAP_ROUTES,
  QUICK_NAV_IDS,
  DEFAULT_VIEW,
  WHATSAPP_NUMBER,
  locationById,
} from '../data/mapData.js';
import { PARK_BOUNDARIES } from '../data/parkBoundaries.js';
import { clusterItems, clusterIconHtml, expansionZoom } from './map/cluster.js';
import { renderBoundaries, boundariesAttribution } from './map/boundaries.js';
import { buildSearchIndex, search, scopedCounts } from './map/search.js';
import { computeDrawerLayout, readViewportFraction, useDrawerViewportSync, useIsMobile } from './map/drawerViewport.js';
import { renderItinerary, highlightLeg, focusLeg } from './map/itinerary.js';
import { BRAND, CLUSTER_MAX_ZOOM, Z } from './map/tokens.js';
import SafariMapDrawer from './map/LocationDrawer.jsx';
import ItineraryPanel from './map/ItineraryPanel.jsx';

/**
 * Optional keyed providers. `envVar` is checked at build time; a provider with
 * no value for its envVar is not rendered at all, so the map keeps working
 * keyless and no broken layer button is ever shown.
 */
const TILE_PROVIDERS = {
  topo: {
    label: 'Safari Topo',
    icon: '🗺️',
    // CARTO serves an identical ~2 KB "API KEY REQUIRED" placeholder PNG to
    // unauthenticated requests — HTTP 200 but the same bytes at every zoom,
    // which is what renders as a blank grid. The public client key (the
    // "cb1_..." form) is appended as ?key=, which returns real, zoom-varying
    // imagery. Note the param is `key`, not `api_key` — `api_key` is ignored
    // by this endpoint and silently returns the placeholder tile again.
    url: () => {
      const key = import.meta.env.VITE_CARTO_API_KEY || '';
      return `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${encodeURIComponent(key)}`;
    },
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 19,
    envVar: 'VITE_CARTO_API_KEY',
  },
  satellite: {
    label: 'Satellite View',
    icon: '🛰️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 18,
    envVar: null,
  },
  relief: {
    label: 'Elevation Relief',
    icon: '🏔️',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap (CC-BY-SA)',
    maxZoom: 17,
    envVar: null,
  },
  // Mapbox is opt-in and requires a genuine Mapbox *public* token ("pk.…").
  // A `validate` guard keeps a credential belonging to some other provider out
  // of this slot: the CARTO key ("cb1_…") returns 401 here for every style, so
  // accepting it would just resurrect a permanently broken layer.
  mapbox: {
    label: 'Mapbox Terrain',
    icon: '🌐',
    url: () => {
      const token = import.meta.env.VITE_MAPBOX_TOKEN || '';
      const style = import.meta.env.VITE_MAPBOX_STYLE || 'mapbox/outdoors-v12';
      return `https://api.mapbox.com/styles/v1/${style}/tiles/256/{z}/{x}/{y}@2x?access_token=${encodeURIComponent(token)}`;
    },
    attribution: '&copy; Mapbox &copy; OpenStreetMap',
    maxZoom: 19,
    envVar: 'VITE_MAPBOX_TOKEN',
    validate: v => /^pk[.$]/.test(v),
  },
};

// Only the layers that are actually usable on this build. Evaluated once at
// module load: import.meta.env is a static object after Vite's build step.
const AVAILABLE_PROVIDERS = Object.entries(TILE_PROVIDERS).filter(([, p]) => {
  if (!p.envVar) return true;
  const value = import.meta.env[p.envVar];
  if (!value) return false;
  return p.validate ? p.validate(value) : true;
});

const resolveUrl = provider =>
  (typeof provider.url === 'function' ? provider.url() : provider.url);

const TILE_ERROR_THRESHOLD = 12;

// A layer that has not produced its first tile by now is treated as dead and
// swapped out. Providers that are merely slow on a cold cache would otherwise
// leave the canvas blank with no indication anything was happening.
const LAYER_TIMEOUT_MS = 5000;

// Backstop for the cross-fade: reveal even if Leaflet never fires 'load'.
const CROSSFADE_MAX_MS = 3000;

// Alternating panes so the outgoing and incoming tile layers never share a DOM
// container. Sharing one pane is what previously made the cross-fade blank the
// map, because fading the shared pane hides both layers at once.
const TILE_PANES = ['safari-tiles-a', 'safari-tiles-b'];
const TILE_PANE_Z = { UNDER: 200, ACTIVE: 201 };

function ensureTilePane(map, name) {
  let pane = map.getPane(name);
  if (!pane) pane = map.createPane(name);
  // Leaflet stamps a default z-index on panes; ours must win so the incoming
  // layer can sit under the outgoing one.
  pane.style.zIndex = String(TILE_PANE_Z.UNDER);
  pane.style.opacity = '';
  return pane;
}

/**
 * Choose the next provider to try after one fails. Walks the available layers
 * in order, skipping the current one and any already known-bad ones, so a
 * repeated failure cannot bounce the user between the same two layers.
 */
function pickFallback(currentKey, isFailed) {
  const keys = AVAILABLE_PROVIDERS.map(([k]) => k);
  if (keys.length < 2) return null;
  const start = Math.max(0, keys.indexOf(currentKey));
  for (let step = 1; step <= keys.length; step++) {
    const candidate = keys[(start + step) % keys.length];
    if (!isFailed(candidate)) return candidate;
  }
  return null;
}

function providerIsConfigured(provider) {
  if (!provider.envVar) return true;
  const key = import.meta.env[provider.envVar];
  const valid = !!key && (!provider.validate || provider.validate(key));
  if (!valid) {
    console.error(
      `[SafariMap] Tile provider "${provider.label}" is unavailable: ${provider.envVar} ` +
        (key ? 'is set but is not valid for this provider' : 'is not set') + '.'
    );
    return false;
  }
  return true;
}

export default function SafariMap({
  selectedParkId,
  parkIds,
  title = 'Interactive East Africa Safari Map',
  showHeading = true,
}) {
  const [baseLayer, setBaseLayer] = useState('topo');
  const [category, setCategory] = useState('places');
  const [circuit, setCircuit] = useState('all');
  const [activeLocationId, setActiveLocationId] = useState(selectedParkId || 'serengeti');
  const [activeHabitatId, setActiveHabitatId] = useState('black-rhino');
  const [activeActivityId, setActiveActivityId] = useState(null);
  const [status, setStatus] = useState('loading');
  const [loadingLayer, setLoadingLayer] = useState(null);
  const [failedLayers, setFailedLayers] = useState([]);
  const [notice, setNotice] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [activeLegId, setActiveLegId] = useState(null);

  const isMobileRef = useRef(false);

  // Mirrors so the layer-switching effect never closes over stale state.
  const failedRef = useRef(new Set());
  const requestSeq = useRef(0);

  const shellRef = useRef(null);
  const canvasRef = useRef(null);
  const mapRef = useRef(null);
  const tileRef = useRef(null);
  const tilePaneRef = useRef(TILE_PANES[0]);
  // Every tile layer that is currently attached, newest last.
  //
  // A single `tileRef` is not enough: when a switch is superseded before it
  // reveals, its layer stops being anyone's `previous` and is never removed,
  // so rapid clicking leaked orphan layers that kept fetching tiles and
  // painting into the pane. Revealing now purges everything except the
  // incoming layer, so orphans cannot survive.
  const tileStackRef = useRef([]);
  const placeLayerRef = useRef(null);
  const habitatLayerRef = useRef(null);
  const activityLayerRef = useRef(null);
  const boundaryLayerRef = useRef(null);
  const itineraryLayerRef = useRef(null);
  const legLayersRef = useRef(new Map());

  // Read inside Leaflet event handlers registered once at init, so they see
  // current values without being torn down and re-registered on every change.
  const zoomRef = useRef(DEFAULT_VIEW.zoom);
  const visibleLocationsRef = useRef([]);
  const activeLocationRef = useRef(null);
  const categoryRef = useRef('places');
  const markerIndexRef = useRef({});

  // Callers pass parkIds={tourParkIds(tour)} — a fresh array each render.
  // Serialise it so the focusing effect does not re-run on every render and
  // reset the visitor's own selection.
  const parkIdsKey = Array.isArray(parkIds) ? parkIds.join(',') : '';

  const visibleLocations = useMemo(
    () => (circuit === 'all' ? MAP_LOCATIONS : MAP_LOCATIONS.filter(l => l.circuit === circuit)),
    [circuit]
  );

  const visibleRoutes = useMemo(
    () => (circuit === 'all' ? MAP_ROUTES : MAP_ROUTES.filter(r => r.circuit === circuit)),
    [circuit]
  );

  const visibleActivities = useMemo(() => {
    if (circuit === 'all') return MAP_ACTIVITIES;
    return MAP_ACTIVITIES.filter(a => {
      const loc = locationById(a.parkId);
      return loc && loc.circuit === circuit;
    });
  }, [circuit]);

  const activeHabitat = useMemo(
    () => MAP_HABITATS.find(h => h.id === activeHabitatId) || MAP_HABITATS[0],
    [activeHabitatId]
  );

  const activeLocation = useMemo(
    () => locationById(activeLocationId) || visibleLocations[0] || MAP_LOCATIONS[0],
    [activeLocationId, visibleLocations]
  );

  const quickNav = useMemo(
    () => QUICK_NAV_IDS.map(locationById).filter(Boolean),
    []
  );

  // MAP_ROUTES already carries ordered, named routes with a drive/fly mode. They
  // are itineraries, not numbered days, so they are surfaced as route cards.
  const visibleItineraryLegs = useMemo(() => {
    const routes = circuit === 'all' ? MAP_ROUTES : MAP_ROUTES.filter(r => r.circuit === circuit);
    return routes.map(r => ({
      id: r.id,
      label: r.name,
      subtitle: r.subtitle,
      mode: r.mode,
      color: r.color,
      coords: r.coords,
    }));
  }, [circuit]);

  // Keep the init-time event handlers in step with render-time state.
  useEffect(() => {
    visibleLocationsRef.current = visibleLocations;
    activeLocationRef.current = activeLocationId;
    categoryRef.current = category;
    zoomRef.current = mapRef.current?.getZoom() ?? zoomRef.current;
  }, [visibleLocations, activeLocationId, category]);

  // Badge counts reflect the active circuit, so the numbers never claim more
  // items than are actually on screen.
  const counts = useMemo(
    () => scopedCounts(visibleLocations, visibleActivities, MAP_HABITATS, circuit),
    [visibleLocations, visibleActivities, circuit]
  );

  const searchIndex = useMemo(
    () => buildSearchIndex(MAP_LOCATIONS, MAP_ACTIVITIES, MAP_HABITATS),
    []
  );
  const searchResults = useMemo(
    () => (searchQuery.length >= 2 ? search(searchIndex, searchQuery, 6) : []),
    [searchIndex, searchQuery]
  );

  // Drawer ↔ floating-widget coordination. The layout maths is published to
  // <body> as CSS custom properties so the WhatsApp floater can move without
  // this component having to know it exists.
  const isMobile = useIsMobile();
  isMobileRef.current = isMobile;
  const drawerLayout = useMemo(
    () =>
      computeDrawerLayout({
        isMobile,
        drawerOpen,
        // Guarded: this runs during render, where window may not exist.
        // Derived from the CSS sheet token rather than a literal, so the
        // reserved offset matches the height the sheet actually renders at.
        drawerHeight:
          drawerOpen && typeof window !== 'undefined'
            ? Math.round(
                window.innerHeight *
                  readViewportFraction('--map-drawer-sheet-height', 0.58)
              )
            : 0,
        shellHeight: shellRef.current?.getBoundingClientRect().height,
      }),
    [isMobile, drawerOpen]
  );
  useDrawerViewportSync(drawerLayout);

  // Keep the selection valid when the circuit filter hides it.
  useEffect(() => {
    if (!visibleLocations.some(l => l.id === activeLocationId) && visibleLocations[0]) {
      setActiveLocationId(visibleLocations[0].id);
    }
  }, [visibleLocations, activeLocationId]);

  useEffect(() => {
    if (selectedParkId) setActiveLocationId(selectedParkId);
  }, [selectedParkId]);

  useEffect(() => {
    if (!parkIdsKey) return;
    const ids = parkIdsKey.split(',');
    const match = MAP_LOCATIONS.find(l => ids.includes(l.id));
    if (match) {
      setActiveLocationId(match.id);
      setCircuit(match.circuit);
    }
  }, [parkIdsKey]);

  useEffect(() => {
    if (!activeActivityId) return;
    if (category !== 'activities' || !visibleActivities.some(a => a.id === activeActivityId)) {
      setActiveActivityId(null);
    }
  }, [activeActivityId, category, visibleActivities]);

  const focusLocation = useCallback(location => {
    setActiveLocationId(location.id);
    // Opening the drawer on selection is what activates the floating-widget
    // offset maths; without it the WhatsApp shift would never fire.
    setDrawerOpen(true);
    const map = mapRef.current;
    if (!map) return;
    // Bias the target slightly left of centre on desktop so the selected pin is
    // not hidden behind the side-panel drawer.
    const isSide = !isMobileRef.current;
    map.flyTo([location.lat, location.lng], Math.max(map.getZoom(), location.zoom), {
      duration: 1.2,
      easeLinearity: 0.25,
      ...(isSide ? { padding: [80, 380, 80, 80] } : null),
    });
  }, []);

  const resetView = useCallback(() => {
    setCircuit('all');
    setActiveActivityId(null);
    setActiveLegId(null);
    setDrawerOpen(false);
    setActiveLocationId(parkIdsKey ? (locationById(parkIdsKey.split(',')[0])?.id ?? 'serengeti') : 'serengeti');
    mapRef.current?.flyTo(DEFAULT_VIEW.center, DEFAULT_VIEW.zoom, { duration: 1.2 });
  }, [parkIdsKey]);

  // Quick-nav and drawer navigation need to move between parks without
  // re-trigging the drawer's own open animation each time.
  const stepLocation = useCallback(
    delta => {
      const list = visibleLocations;
      if (!list.length) return;
      const i = list.findIndex(l => l.id === activeLocationId);
      const next = list[(i + delta + list.length) % list.length];
      if (next) focusLocation(next);
    },
    [visibleLocations, activeLocationId, focusLocation]
  );

  // --- Marker factory -------------------------------------------------
  const buildIcon = useCallback((L, { iconType, label, selected, size = 40 }) => {
    const pulse = selected
      ? '<span class="safari-pin__pulse absolute -inset-2 rounded-full bg-terracotta-400 opacity-60 animate-ping"></span>'
      : '';
    const face = selected
      ? 'bg-terracotta-400 border-white text-white'
      : 'bg-cream-50 border-teal-800 text-teal-900';
    const html = `
      <div class="safari-pin" style="width:${size}px;height:${size}px">
        ${pulse}
        <span class="relative z-10 flex items-center justify-center w-full h-full rounded-full shadow-lg border-2 ${face}">
          <span style="font-size:${Math.round(size * 0.4)}px;line-height:1">${iconType}</span>
        </span>
        ${label ? `<span class="safari-pin__label">${label}</span>` : ''}
      </div>`;
    return L.divIcon({
      html,
      className: 'custom-safari-marker',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
    });
  }, []);

  // Cluster icon: branded ring + numeric badge, label revealed on hover/focus.
  const buildClusterIcon = useCallback((L, cluster) => {
    const size = cluster.count >= 100 ? 52 : cluster.count >= 25 ? 46 : cluster.count >= 10 ? 42 : 38;
    return L.divIcon({
      html: clusterIconHtml(cluster.count, cluster.kinds),
      className: 'custom-safari-cluster',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }, []);

  const clearLayer = useCallback(layer => {
    if (!layer) return;
    layer.clearLayers();
  }, []);

  const drawPlaces = useCallback(
    (L, layer, locations, selectedId, showLabels) => {
      clearLayer(layer);
      markerIndexRef.current = {};
      if (!locations.length) return;

      const map = mapRef.current;
      const zoom = map ? map.getZoom() : DEFAULT_VIEW.zoom;
      const bounds = map ? map.getBounds() : null;

      // Below CLUSTER_MAX_ZOOM, collapse nearby markers into branded clusters;
      // above it, every park gets its own pin.
      const nodes = clusterItems(locations, { zoom, bounds });

      nodes.forEach(node => {
        if (node.isCluster) {
          const marker = L.marker([node.lat, node.lng], {
            icon: buildClusterIcon(L, node),
            keyboard: true,
            riseOnHover: true,
            title: `${node.count} locations — zoom in to separate`,
          });
          marker.on('click', () => {
            // Zoom just far enough to split the bucket rather than jumping to
            // max zoom, which would overshoot a cluster of two nearby parks.
            map?.flyTo([node.lat, node.lng], expansionZoom(node.count, zoom), { duration: 0.6 });
          });
          marker.addTo(layer);
          return;
        }

        const location = node;
        const marker = L.marker([location.lat, location.lng], {
          icon: buildIcon(L, {
            iconType: location.iconType,
            label: showLabels ? location.shortName || location.name : '',
            selected: location.id === selectedId,
          }),
          title: `${location.name} — ${location.subtitle}`,
          alt: location.name,
          keyboard: true,
          riseOnHover: true,
        });
        marker.on('click', () => focusLocation(location));
        marker.addTo(layer);
        markerIndexRef.current[location.id] = marker;
      });
    },
    [buildIcon, buildClusterIcon, clearLayer, focusLocation]
  );

  const drawHabitats = useCallback(
    (L, layer, habitat) => {
      clearLayer(layer);
      if (!habitat) return;
      habitat.ranges.forEach(range => {
        const circle = L.circle([range.lat, range.lng], {
          radius: range.radius,
          color: habitat.color,
          weight: 2,
          opacity: 0.85,
          fillColor: habitat.color,
          fillOpacity: 0.15,
          interactive: true,
        });
        circle.bindTooltip(`${habitat.iconType} ${habitat.name} — ${range.label}`, { sticky: true });
        if (range.parkId) {
          circle.on('click', () => {
            const loc = locationById(range.parkId);
            if (loc) focusLocation(loc);
          });
        }
        circle.addTo(layer);
      });
    },
    [clearLayer, focusLocation]
  );

  const drawActivities = useCallback(
    (L, layer, activities, selectedId) => {
      clearLayer(layer);
      activities.forEach(activity => {
        const marker = L.marker([activity.lat, activity.lng], {
          icon: buildIcon(L, {
            iconType: activity.iconType,
            label: activity.name,
            selected: activity.id === selectedId,
            size: 36,
          }),
          title: activity.name,
          alt: activity.name,
          keyboard: true,
          riseOnHover: true,
        });
        marker.on('click', () => setActiveActivityId(activity.id));
        marker.addTo(layer);
      });
    },
    [buildIcon, clearLayer]
  );

  // Routes are rendered by renderItinerary into itineraryLayerRef only.
// There used to be a second renderer (drawRoutes) drawing the same MAP_ROUTES
// into routeLayerRef with different stroke weights and dash patterns, so every
// route appeared twice and a highlighted leg sat on a static duplicate.

  // --- Map lifecycle --------------------------------------------------
  useEffect(() => {
    let disposed = false;
    let pollId = null;
    let deadlineId = null;
    let observer = null;
    // Teardown callbacks registered during init, so every listener added to the
    // map or the canvas is removed even if init threw part-way through.
    const cleanupFns = [];

    function init() {
      if (disposed) return;
      const L = window.L;
      if (!L || !canvasRef.current || mapRef.current) return;

      const map = L.map(canvasRef.current, {
        center: DEFAULT_VIEW.center,
        zoom: DEFAULT_VIEW.zoom,
        minZoom: 4,
        maxZoom: 17,
        zoomControl: false,
        attributionControl: true,
        // Wheel zoom over a long scrolling page is a usability trap; the
        // +/- controls on the right provide the same affordance.
        scrollWheelZoom: false,
      });

      mapRef.current = map;

      // +/- controls, right side, inside the clipped shell.
      L.control.zoom({ position: 'topright' }).addTo(map);

      // The base layer is attached by the layer-switch effect below rather than
      // here, so first paint and every later switch go through one path and
      // share the same timeout/fallback handling.
      placeLayerRef.current = L.layerGroup().addTo(map);
      habitatLayerRef.current = L.layerGroup().addTo(map);
      activityLayerRef.current = L.layerGroup().addTo(map);
      boundaryLayerRef.current = L.layerGroup().addTo(map);
      itineraryLayerRef.current = L.layerGroup().addTo(map);

      // Suppress the native context menu over the canvas. The map is a
      // pannable surface where the browser menu is never the useful action;
      // leaving it enabled traps long-press and right-click users in a dead end.
      const canvas = canvasRef.current;
      const onContextMenu = e => e.preventDefault();
      canvas.addEventListener('contextmenu', onContextMenu);
      cleanupFns.push(() => canvas.removeEventListener('contextmenu', onContextMenu));

      // Clusters must be recomputed whenever the zoom crosses the clustering
      // threshold, otherwise markers stay bucketed after zooming in.
      const onZoomEnd = () => {
        const z = map.getZoom();
        if ((zoomRef.current <= CLUSTER_MAX_ZOOM) !== (z <= CLUSTER_MAX_ZOOM)) {
          zoomRef.current = z;
          drawPlaces(L, placeLayerRef.current, visibleLocationsRef.current, activeLocationRef.current, categoryRef.current === 'places');
        }
      };
      map.on('zoomend', onZoomEnd);
      cleanupFns.push(() => map.off('zoomend', onZoomEnd));

      // Single global "something is being pointed at" flag. CSS uses it to hide
      // every other label, which is what stops Places/Habitats/Activities tags
      // from overlapping: no per-label geometry maths, no JS bookkeeping.
      const onPointOver = e => {
        const el = e?.target?.getElement?.();
        canvas.dataset.pointing = 'true';
        const label = el?.querySelector('.safari-pin__label, .safari-cluster__label');
        if (label) label.classList.add('is-pointed');
      };
      const onPointOut = () => {
        canvas.dataset.pointing = 'false';
        canvas.querySelectorAll('.is-pointed').forEach(el => el.classList.remove('is-pointed'));
      };
      map.on('mouseover', onPointOver);
      map.on('mouseout', onPointOut);
      cleanupFns.push(() => {
        map.off('mouseover', onPointOver);
        map.off('mouseout', onPointOut);
      });

      if (typeof ResizeObserver !== 'undefined' && shellRef.current) {
        observer = new ResizeObserver(() => map.invalidateSize({ pan: false }));
        observer.observe(shellRef.current);
      }

      drawPlaces(L, placeLayerRef.current, MAP_LOCATIONS, 'serengeti', true);
      drawHabitats(L, habitatLayerRef.current, MAP_HABITATS[0]);
      drawActivities(L, activityLayerRef.current, MAP_ACTIVITIES, null);

      // No-op until src/data/parkBoundaries.js is populated with authoritative
      // WDPA/TANAPA geometry. See that file for why it ships empty.
      if (PARK_BOUNDARIES) {
        renderBoundaries(L, boundaryLayerRef.current, PARK_BOUNDARIES, {
          onSelect: id => focusLocation(locationById(id)),
        });
        const credit = boundariesAttribution(PARK_BOUNDARIES);
        if (credit) map.attributionControl.addAttribution(credit);
      }

      // Leaflet caches container size at init; re-measure once laid out so the
      // first paint is never a blank or half-drawn grid.
      requestAnimationFrame(() => map.invalidateSize({ pan: false }));
      setStatus('ready');
    }

    if (window.L) {
      init();
    } else {
      pollId = setInterval(() => {
        if (window.L) {
          clearInterval(pollId);
          init();
        }
      }, 100);
      deadlineId = setTimeout(() => {
        if (disposed) return;
        clearInterval(pollId);
        console.error(
          '[SafariMap] Leaflet global (window.L) never appeared. Check the ' +
            'leaflet.js <script> tag in index.html — it is SRI-pinned to unpkg.'
        );
        setStatus('error');
      }, 8000);
    }

    return () => {
      disposed = true;
      if (pollId) clearInterval(pollId);
      if (deadlineId) clearTimeout(deadlineId);
      if (observer) observer.disconnect();
      // Detach listeners before map.remove(), which drops the map's own events.
      cleanupFns.forEach(fn => {
        try {
          fn();
        } catch {
          /* teardown must never mask the original error */
        }
      });
      cleanupFns.length = 0;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      tileRef.current = null;
      placeLayerRef.current = null;
      habitatLayerRef.current = null;
      activityLayerRef.current = null;
      markerIndexRef.current = {};
    };
  }, [drawPlaces, drawHabitats, drawActivities]);

  /**
   * Base-layer attachment, with explicit loading/failed/fallback states.
   *
   * Every switch runs as a small state machine keyed by a sequence number, so a
   * slow layer that resolves after the user has already moved on is ignored
   * instead of clearing the spinner for a layer that is no longer on screen.
   * A layer is abandoned either when it hits the tile-error threshold or when
   * no tile arrives inside LAYER_TIMEOUT_MS; either way the next healthy
   * provider is selected automatically and the map stays usable, rather than
   * blocking the visitor or leaving a blank canvas.
   *
   * Tile pre-loading / tear prevention: the outgoing layer is NOT removed when
   * the switch starts. The incoming layer is added underneath it at zero
   * opacity and only faded in once Leaflet reports 'load' (all visible tiles
   * present), or after CROSSFADE_MAX_MS as a backstop. Removing the old layer
   * up front is what produced the grey "tearing" gap during basemap changes.
   */
  useEffect(() => {
    const L = window.L;
    const map = mapRef.current;
    if (status !== 'ready' || !L || !map) return;

    const provider = TILE_PROVIDERS[baseLayer];
    if (!provider || !providerIsConfigured(provider)) {
      const next = pickFallback(baseLayer, k => failedRef.current.has(k));
      if (next) setBaseLayer(next);
      return;
    }

    const seq = ++requestSeq.current;
    let settled = false;
    let timer = null;
    let revealTimer = null;
    let swapTimer = null;
    let errors = 0;

    const succeed = () => {
      if (settled || seq !== requestSeq.current) return;
      settled = true;
      clearTimeout(timer);
      setLoadingLayer(null);
      // A layer that has just produced tiles is healthy again.
      if (failedRef.current.has(baseLayer)) {
        failedRef.current.delete(baseLayer);
        setFailedLayers([...failedRef.current]);
      }
    };

    const fail = reason => {
      if (settled || seq !== requestSeq.current) return;
      settled = true;
      clearTimeout(timer);
      console.error(
        `[SafariMap] Base layer "${provider.label}" ${reason}. Switching to a working layer.`
      );
      failedRef.current.add(baseLayer);
      setFailedLayers([...failedRef.current]);
      setLoadingLayer(null);
      const next = pickFallback(baseLayer, k => failedRef.current.has(k));
      if (next) {
        setNotice(`“${provider.label}” is unavailable — showing “${TILE_PROVIDERS[next].label}” instead.`);
        setBaseLayer(next);
      } else {
        setNotice(`“${provider.label}” is unavailable and no alternative layer is available.`);
      }
    };

    // Pre-load: the outgoing layer stays mounted and visible while the incoming
    // one fills in underneath it. This is what removes the tearing gap.
    const previous = tileRef.current;

    // Every Leaflet tile layer shares the single `leaflet-tile-pane` unless it is
    // given its own pane. Fading that shared pane would hide the outgoing layer
    // too — i.e. blank the map on every switch, the exact tear this fixes. So
    // the two layers are assigned alternating dedicated panes and the *whole
    // pane* is faded, not individual tiles.
    const prevPaneName = tilePaneRef.current;
    const nextPaneName = prevPaneName === TILE_PANES[1] ? TILE_PANES[0] : TILE_PANES[1];
    const incomingPane = ensureTilePane(map, nextPaneName);
    const previousPane = previous ? ensureTilePane(map, prevPaneName) : null;

    const incoming = L.tileLayer(resolveUrl(provider), {
      attribution: provider.attribution,
      maxZoom: provider.maxZoom,
      crossOrigin: true,
      pane: nextPaneName,
    });

    if (incomingPane && previousPane) {
      // Incoming sits underneath and is fully transparent; it is already
      // fetching tiles, so by reveal time there is nothing to tear.
      incomingPane.style.transition = 'opacity 260ms ease';
      previousPane.style.transition = 'opacity 260ms ease';
      previousPane.style.zIndex = String(TILE_PANE_Z.ACTIVE);
      incomingPane.style.zIndex = String(TILE_PANE_Z.UNDER);
      incomingPane.style.opacity = '0';
      previousPane.style.opacity = '1';
    } else if (incomingPane) {
      // First paint: nothing to cross-fade from, so the layer owns the active
      // pane outright. Keeping the invariant uniform means later switches and
      // the very first render behave identically.
      incomingPane.style.zIndex = String(TILE_PANE_Z.ACTIVE);
    }

    let revealed = false;
    const reveal = () => {
      if (revealed || seq !== requestSeq.current) return;
      revealed = true;
      clearTimeout(revealTimer);
      if (!incomingPane || !previousPane) {
        // No outgoing layer to cross-fade from: purge anything left over so the
        // stack still converges to exactly one layer.
        tileStackRef.current
          .filter(l => l && l !== incoming)
          .forEach(l => map.removeLayer(l));
        tileStackRef.current = [incoming];
        return;
      }
      // Force a reflow so the transition actually runs from the start state.
      void incomingPane.offsetHeight;
      incomingPane.style.opacity = '1';
      previousPane.style.opacity = '0';
      incomingPane.style.zIndex = String(TILE_PANE_Z.ACTIVE);
      swapTimer = setTimeout(() => {
        tileStackRef.current
          .filter(l => l && l !== incoming)
          .forEach(l => map.removeLayer(l));
        tileStackRef.current = [incoming];
      }, 300);
    };

    // Any single tile landing counts as success for the spinner; 'load' (all
    // visible tiles) is what triggers the visible cross-fade.
    incoming.on('tileload', succeed);
    incoming.on('load', reveal);
    incoming.on('tileerror', () => {
      errors += 1;
      if (errors >= TILE_ERROR_THRESHOLD) {
        fail(`failed to load tiles (${errors} errors)`);
      }
    });

    timer = setTimeout(() => fail(`timed out after ${LAYER_TIMEOUT_MS}ms`), LAYER_TIMEOUT_MS);
    // Backstop: never leave the old layer sitting on top of a healthy new one.
    revealTimer = setTimeout(reveal, CROSSFADE_MAX_MS);

    tileRef.current = incoming.addTo(map);
    tileStackRef.current = [...tileStackRef.current, incoming];
    tilePaneRef.current = nextPaneName;
    setLoadingLayer(baseLayer);
    requestAnimationFrame(() => map.invalidateSize({ pan: false }));

    // Clear the pending request when the layer changes or the map unmounts.
    return () => {
      clearTimeout(timer);
      clearTimeout(revealTimer);
      clearTimeout(swapTimer);
      if (requestSeq.current === seq) {
        settled = true;
        setLoadingLayer(null);
        // If we leave before revealing, drop the hidden incoming layer so it
        // cannot accumulate across rapid layer switching.
        if (!revealed && incoming !== tileRef.current) {
          map.removeLayer(incoming);
          tileRef.current = previous || null;
          // The outgoing layer is the live one again, so it must own the
          // active pane again too — otherwise the next switch fades the wrong
          // container.
          if (previous) {
            tilePaneRef.current = prevPaneName;
            const prevPane = ensureTilePane(map, prevPaneName);
            prevPane.style.opacity = '1';
            prevPane.style.zIndex = String(TILE_PANE_Z.ACTIVE);
            if (incomingPane) incomingPane.style.opacity = '';
          }
        }
      } else if (incoming !== tileRef.current) {
        // Superseded mid-flight (a newer effect has already taken over). The
        // layer will never be shown, so detach it immediately instead of
        // leaving it attached and quietly consuming tile bandwidth. Left
        // attached, a burst of fast clicks piled up several hidden layers whose
        // competing tile requests starved the layer the user actually chose,
        // which then hit its own timeout and got marked failed — silently
        // swapping the basemap back out from under them.
        map.removeLayer(incoming);
        if (incomingPane) incomingPane.style.opacity = '';
        tileStackRef.current = tileStackRef.current.filter(l => l !== incoming);
      }
    };
  }, [baseLayer, status]);

  // Category visibility.
  useEffect(() => {
    const L = window.L;
    const map = mapRef.current;
    if (status !== 'ready' || !L || !map) return;

    const wantsPlaces = category === 'places';
    const wantsHabitats = category === 'habitats';
    const wantsActivities = category === 'activities';

    drawPlaces(L, placeLayerRef.current, visibleLocations, activeLocationId, wantsPlaces);
    drawHabitats(L, habitatLayerRef.current, wantsHabitats ? activeHabitat : null);
    drawActivities(L, activityLayerRef.current, wantsActivities ? visibleActivities : [], activeActivityId);
  }, [status, category, visibleLocations, visibleActivities, activeLocationId, activeHabitat, activeActivityId, clearLayer, drawPlaces, drawHabitats, drawActivities]);

  // Itinerary legs: drawn as discrete polylines so one route can be emphasised
  // without redrawing the others. This is now the ONLY renderer of MAP_ROUTES,
  // so it must respect the category filter itself — otherwise switching to
  // Habitats or Activities would leave route lines stranded on the map.
  useEffect(() => {
    const L = window.L;
    const map = mapRef.current;
    if (status !== 'ready' || !L || !map || !itineraryLayerRef.current) return;

    clearLayer(itineraryLayerRef.current);
    const wantsPlaces = category === 'places';
    const built = renderItinerary(
      L,
      itineraryLayerRef.current,
      wantsPlaces ? visibleItineraryLegs : [],
      activeLegId,
      setActiveLegId
    );
    legLayersRef.current = built;
  }, [status, category, visibleItineraryLegs, activeLegId, clearLayer]);

  // Leaving the Places category invalidates any selected route, otherwise the
  // auto-pan effect below would keep firing for a leg that is no longer drawn.
  useEffect(() => {
    if (category !== 'places' && activeLegId) setActiveLegId(null);
  }, [category, activeLegId]);

  // Auto-pan when a day card is chosen.
  useEffect(() => {
    const L = window.L;
    const map = mapRef.current;
    if (!activeLegId || status !== 'ready' || !L || !map) return;
    const leg = visibleItineraryLegs.find(l => l.id === activeLegId);
    if (!leg) return;
    highlightLeg(legLayersRef.current, activeLegId);
    focusLeg(L, map, leg, {
      // Extra bottom padding clears the quick-nav rail; top padding clears the
      // control stack so the line is not hidden under it.
      padding: [96, 96, 120, 96],
    });
  }, [activeLegId, visibleItineraryLegs, status]);

  const openWhatsApp = message =>
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');

  return (
    <div className="bg-cream-100/90 rounded-3xl p-4 sm:p-7 border border-savanna-200 shadow-card">
      {showHeading && (
        <div className="mb-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="min-w-0 lg:flex-1 lg:pr-4">
            <span className="eyebrow">Real Geographic Safari Atlas</span>
            <h3 className="font-display text-2xl sm:text-3xl text-teal-800 mt-1">{title}</h3>
            <p className="text-xs sm:text-sm text-teal-700/80 mt-2 max-w-2xl">
              Explore Tanzania &amp; Kenya&rsquo;s game reserves, mountain peaks and coastal spice
              islands on live satellite and terrain maps.
            </p>
          </div>

          <div
            className="flex flex-wrap gap-1.5 lg:max-w-[52%] lg:justify-end"
            role="group"
            aria-label="Filter by circuit"
          >
            {MAP_CIRCUITS.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCircuit(c.id)}
                aria-pressed={circuit === c.id}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                  circuit === c.id
                    ? 'bg-teal-700 text-cream-50 shadow-sm'
                    : 'bg-cream-50 text-teal-800 border border-savanna-200 hover:bg-cream-200/60'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="safari-map-shell" ref={shellRef}>
        {/* Leaflet canvas: absolutely positioned so it always fills the shell */}
        <div
          ref={canvasRef}
          className="safari-map-canvas safari-map"
          role="application"
          aria-label="Interactive map of East African safari destinations"
        />

        {/* Top-left: base layer + category controls.
            Under 768px these collapse behind a single toggle (see
            .safari-map-controls in index.css) so they do not cover a large
            share of a small viewport. */}
        <div className="safari-map-overlay safari-map-overlay--tl flex flex-col gap-1.5">
          <div className="safari-map-panel safari-map-controls" data-open={controlsOpen}>
            <button
              type="button"
              className="safari-map-controls__toggle px-2 py-1 rounded-lg text-xs font-semibold text-teal-800"
              onClick={() => setControlsOpen(o => !o)}
              aria-expanded={controlsOpen}
              aria-label="Map layers and filters"
            >
              ☰ Layers
            </button>
            <div className="safari-map-controls__body flex flex-wrap items-center gap-1">
            {AVAILABLE_PROVIDERS.map(([key, provider]) => (
              <button
                key={key}
                type="button"
                onClick={() => setBaseLayer(key)}
                aria-pressed={baseLayer === key}
                aria-busy={loadingLayer === key}
                title={
                  failedLayers.includes(key)
                    ? `${provider.label} — unavailable, click to retry`
                    : provider.label
                }
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                  baseLayer === key
                    ? 'bg-teal-800 text-white shadow-sm'
                    : 'text-teal-800 hover:bg-cream-100'
                } ${failedLayers.includes(key) ? 'opacity-50 line-through' : ''}`}
              >
                {loadingLayer === key ? (
                  // Spinner replaces the icon only while this layer is in flight,
                  // so the selected layer is always distinguishable.
                  <span
                    className="inline-block w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <span aria-hidden="true">{provider.icon}</span>
                )}
                <span className="hidden sm:inline">{provider.label}</span>
                <span className="sr-only">
                  {loadingLayer === key ? ' (loading)' : failedLayers.includes(key) ? ' (unavailable)' : ''}
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={resetView}
              className="p-1 rounded-lg text-xs text-teal-700 hover:bg-cream-100 transition border-l border-savanna-200 pl-2 ml-1"
              title="Reset view"
            >
              🔄 <span className="sr-only sm:not-sr-only">Reset</span>
            </button>
            </div>
          </div>

          <div
            className="safari-map-panel flex items-center gap-0.5 p-1 w-fit"
            role="group"
            aria-label="Map layer category"
          >
            {MAP_CATEGORIES.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                aria-pressed={category === c.id}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  category === c.id ? 'bg-teal-800 text-white shadow-sm' : 'text-teal-800 hover:bg-cream-100'
                }`}
              >
                <span aria-hidden="true" className="mr-1">{c.icon}</span>
                {c.label}
                {/* Live badge, scoped to the active circuit so it always
                    matches what is actually rendered. */}
                <span
                  className={`ml-1 px-1.5 rounded-full text-[9px] font-bold tabular-nums ${
                    category === c.id ? 'bg-white/25 text-white' : 'bg-savanna-200 text-teal-700'
                  }`}
                >
                  {counts[c.id] ?? 0}
                </span>
              </button>
            ))}
          </div>

          {/* Autocomplete across parks, activities and habitats. */}
          <div className="safari-map-panel relative w-[min(17rem,calc(100vw-3rem))]">
            <label className="sr-only" htmlFor="safari-map-search">
              Search parks, activities and habitats
            </label>
            <input
              id="safari-map-search"
              type="search"
              value={searchQuery}
              placeholder="Search parks, wildlife…"
              autoComplete="off"
              role="combobox"
              aria-expanded={searchOpen && searchResults.length > 0}
              aria-controls="safari-map-search-results"
              onFocus={() => setSearchOpen(true)}
              onBlur={() => window.setTimeout(() => setSearchOpen(false), 150)}
              onChange={e => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onKeyDown={e => {
                if (e.key === 'Escape') {
                  setSearchQuery('');
                  setSearchOpen(false);
                }
              }}
              className="w-full bg-transparent px-2.5 py-1.5 text-xs text-teal-900 placeholder:text-teal-500/70 focus:outline-none"
            />
            {searchOpen && searchResults.length > 0 && (
              <ul
                id="safari-map-search-results"
                role="listbox"
                className="absolute left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto rounded-lg bg-cream-50 border border-savanna-200 shadow-lg py-1 z-10"
              >
                {searchResults.map(r => (
                  <li key={`${r.kind}-${r.id}`} role="option" aria-selected={false}>
                    <button
                      type="button"
                      className="w-full text-left px-2.5 py-1.5 text-xs text-teal-900 hover:bg-cream-100 flex items-center gap-2"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => {
                        if (r.loc.lat != null) focusLocation(r.loc);
                        else if (r.kind === 'Activity') {
                          setCategory('activities');
                          setActiveActivityId(r.id);
                        } else {
                          setCategory('habitats');
                          setActiveHabitatId(r.id);
                        }
                        setSearchQuery('');
                        setSearchOpen(false);
                      }}
                    >
                      <span aria-hidden="true">{r.icon}</span>
                      <span className="min-w-0">
                        <span className="block font-semibold truncate">{r.title}</span>
                        <span className="block text-[10px] text-teal-500 truncate">
                          {r.kind} · {r.subtitle}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {category === 'places' && visibleItineraryLegs.length > 0 ? (
          <div className="safari-map-overlay safari-map-overlay--tr hidden md:block">
            <ItineraryPanel
              routes={visibleItineraryLegs}
              activeRouteId={activeLegId}
              onSelectRoute={setActiveLegId}
            />
          </div>
        ) : null}

        {/* Bottom-left: routes legend / habitat explainer */}
        {category === 'places' && visibleRoutes.length > 0 ? (
          <div className="safari-map-overlay safari-map-overlay--bl safari-map-panel px-3 py-2 max-w-[14rem]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-teal-500 mb-1.5">
              Routes
            </div>
            <ul className="space-y-1">
              {visibleRoutes.map(route => (
                <li key={route.id} className="flex items-start gap-2 text-[11px] text-teal-800">
                  <span
                    aria-hidden="true"
                    className="inline-block w-6 shrink-0 mt-1 border-t-2"
                    style={{
                      borderColor: route.color,
                      borderTopStyle: route.mode === 'fly' ? 'dotted' : 'dashed',
                    }}
                  />
                  <span>
                    {route.name}
                    <span className="text-[10px] text-teal-500">
                      {' '}({route.mode === 'fly' ? 'flight' : 'drive'})
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {category === 'habitats' ? (
          <div className="safari-map-overlay safari-map-overlay--bl safari-map-panel px-3 py-2 max-w-[16rem]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-teal-500 mb-1">
              {activeHabitat.iconType} {activeHabitat.name} · {activeHabitat.status}
            </div>
            <p className="text-[11px] leading-relaxed text-teal-700/90">{activeHabitat.summary}</p>
            <p className="mt-1.5 text-[9px] uppercase tracking-wider text-teal-400">
              Indicative core range — click a circle to open that park
            </p>
          </div>
        ) : null}

        {/* Bottom: quick-nav tabs */}
        <div className="safari-map-overlay safari-map-overlay--bottom">
          <div className="safari-map-panel bg-teal-900/85 flex gap-2 p-1.5 overflow-x-auto no-scrollbar">
            {category === 'places'
              ? quickNav.map(location => (
                  <button
                    key={location.id}
                    type="button"
                    onClick={() => focusLocation(location)}
                    aria-pressed={location.id === activeLocationId}
                    className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition flex items-center gap-1.5 shrink-0 ${
                      location.id === activeLocationId
                        ? 'bg-terracotta-400 text-cream-50 font-bold shadow'
                        : 'text-cream-100/90 hover:bg-teal-800/80'
                    }`}
                  >
                    <span aria-hidden="true">{location.iconType}</span>
                    <span>{location.shortName}</span>
                  </button>
                ))
              : category === 'habitats'
                ? MAP_HABITATS.map(h => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => setActiveHabitatId(h.id)}
                      aria-pressed={h.id === activeHabitatId}
                      className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition flex items-center gap-1.5 shrink-0 ${
                        h.id === activeHabitatId
                          ? 'bg-terracotta-400 text-cream-50 font-bold shadow'
                          : 'text-cream-100/90 hover:bg-teal-800/80'
                      }`}
                    >
                      <span aria-hidden="true">{h.iconType}</span>
                      <span>{h.name}</span>
                    </button>
                  ))
                : visibleActivities.map(a => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        setActiveActivityId(a.id);
                        const loc = locationById(a.parkId);
                        if (loc) focusLocation(loc);
                      }}
                      aria-pressed={a.id === activeActivityId}
                      className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition flex items-center gap-1.5 shrink-0 ${
                        a.id === activeActivityId
                          ? 'bg-terracotta-400 text-cream-50 font-bold shadow'
                          : 'text-cream-100/90 hover:bg-teal-800/80'
                      }`}
                    >
                      <span aria-hidden="true">{a.iconType}</span>
                      <span>{a.name}</span>
                    </button>
                  ))}
          </div>
        </div>

        {/* Graceful fallbacks */}
        {status === 'loading' ? (
          <div className="safari-map-state">
            <span className="text-3xl animate-pulse" aria-hidden="true">🗺️</span>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-600">Loading map…</p>
          </div>
        ) : null}

        {status === 'error' ? (
          <div className="safari-map-state">
            <span className="text-3xl" aria-hidden="true">🛰️</span>
            <p className="font-display text-lg text-teal-800">Map unavailable offline</p>
            <p className="text-xs text-teal-700/80 max-w-sm">
              Leaflet could not be loaded. Check your connection, then browse the destinations below.
            </p>
          </div>
        ) : null}

        {notice && status === 'ready' ? (
          // Deliberately a dismissible inline strip, not a modal: a provider
          // outage must never block the map, the pins or the booking CTAs.
          <div className="safari-map-overlay safari-map-overlay--bl">
            <div className="safari-map-panel px-3 py-2 max-w-sm flex items-start gap-2" role="status" aria-live="polite">
              <span aria-hidden="true">⚠️</span>
              <p className="text-[11px] text-teal-800 leading-snug">{notice}</p>
              <button
                type="button"
                onClick={() => setNotice(null)}
                className="ml-auto text-teal-500 hover:text-teal-800 text-xs leading-none px-1"
                aria-label="Dismiss map notice"
              >
                ✕
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Detail drawer is portaled to <body> — see components/map/LocationDrawer.jsx
          for why it cannot live inside .safari-map-shell. */}
      <SafariMapDrawer
        location={activeLocation}
        open={drawerOpen}
        isMobile={isMobile}
        onClose={() => setDrawerOpen(false)}
        onPrev={() => stepLocation(-1)}
        onNext={() => stepLocation(1)}
      />

      {/* Detail card sits outside the clipped shell so it can grow naturally */}
      <div className="mt-6 bg-cream-50 rounded-2xl p-6 border border-savanna-200 shadow-card" aria-live="polite">
        {category === 'habitats' ? (
          <div className="mb-4" style={{ borderLeft: `4px solid ${activeHabitat.color}`, paddingLeft: 12 }}>
            <h4 className="font-display text-sm font-bold text-teal-900 mb-1.5">
              {activeHabitat.iconType} {activeHabitat.name}
            </h4>
            <p className="text-[11px] leading-relaxed text-teal-700/90">{activeHabitat.summary}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {activeHabitat.ranges.map(r => (
                <span
                  key={r.label}
                  className="text-[10px] bg-cream-100 text-teal-800 border border-savanna-200 px-2 py-0.5 rounded-full font-medium"
                >
                  {r.label}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {category === 'activities' && activeActivityId ? (
          <div className="mb-4" style={{ borderLeft: '4px solid #2A7B88', paddingLeft: 12 }}>
            <h4 className="font-display text-sm font-bold text-teal-900 mb-1.5">
              {MAP_ACTIVITIES.find(a => a.id === activeActivityId)?.iconType}{' '}
              {MAP_ACTIVITIES.find(a => a.id === activeActivityId)?.name}
            </h4>
            <p className="text-[11px] leading-relaxed text-teal-700/90">
              {MAP_ACTIVITIES.find(a => a.id === activeActivityId)?.detail}
            </p>
          </div>
        ) : null}

        <div className="grid md:grid-cols-[minmax(0,18rem)_1fr] gap-6">
          <div className="relative rounded-xl overflow-hidden h-44 shrink-0">
            <img
              src={activeLocation.image}
              alt={`${activeLocation.name} — ${activeLocation.subtitle}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-teal-950/80 via-transparent to-transparent" />
            <div className="absolute top-3 left-3 bg-teal-800/90 text-cream-50 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              {activeLocation.badge}
            </div>
            <div className="absolute bottom-3 left-3 right-3 text-cream-50">
              <h4 className="font-display text-xl font-bold leading-tight drop-shadow">
                {activeLocation.name}
              </h4>
              <div className="text-xs text-cream-200 font-medium">{activeLocation.subtitle}</div>
            </div>
          </div>

          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-teal-700/85 leading-relaxed mb-4">
              {activeLocation.highlights}
            </p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {activeLocation.animals.map(a => (
                <span
                  key={a}
                  className="bg-cream-100 text-teal-800 border border-savanna-200 px-2.5 py-1 rounded-full text-xs font-medium"
                >
                  {a}
                </span>
              ))}
            </div>
            <dl className="space-y-2 text-xs text-teal-700/90 bg-cream-100/70 p-3.5 rounded-xl border border-savanna-100">
              <div className="flex items-start gap-2">
                <dt className="shrink-0">🗓️</dt>
                <dd><strong>Best time:</strong> {activeLocation.bestMonths}</dd>
              </div>
              <div className="flex items-start gap-2">
                <dt className="shrink-0">🚙</dt>
                <dd><strong>Transit:</strong> {activeLocation.transit}</dd>
              </div>
              <div className="flex items-start gap-2">
                <dt className="shrink-0">🌄</dt>
                <dd><strong>Landscape:</strong> {activeLocation.terrain}</dd>
              </div>
            </dl>
            {activeLocation.credit ? (
              <p className="mt-2 text-[10px] leading-relaxed text-teal-600">
                Photo:{' '}
                <a
                  href={activeLocation.licenseUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="underline hover:text-teal-800"
                >
                  {activeLocation.credit}
                </a>{' '}
                ({activeLocation.license})
              </p>
            ) : null}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activeLocation.tourQuery ? (
                <Link
                  to={`/tours?q=${encodeURIComponent(activeLocation.tourQuery)}`}
                  className="btn-primary py-2.5 px-3 text-center text-xs font-semibold"
                >
                  Browse Tours
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    openWhatsApp(
                      `Hi Jebri Safaris! I'm planning to visit ${activeLocation.name}. Can you build a trip that includes it?`
                    )
                  }
                  className="btn-primary py-2.5 px-3 text-xs font-semibold"
                >
                  Plan This Park
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  openWhatsApp(
                    `Hi Jebri Safaris! I'm interested in an itinerary including *${activeLocation.name}* (${activeLocation.subtitle}).`
                  )
                }
                className="bg-[#25D366] hover:bg-[#1EBE5D] text-white py-2.5 px-3 rounded-full text-xs font-semibold transition flex items-center justify-center gap-1.5"
              >
                <span aria-hidden="true">💬</span> WhatsApp Inquire
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}