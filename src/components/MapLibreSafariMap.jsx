import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Map, {
  NavigationControl,
  Marker,
  Source,
  Layer,
  AttributionControl,
} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

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
import { buildSearchIndex, search, scopedCounts } from './map/search.js';
import {
  computeDrawerLayout,
  readViewportFraction,
  useDrawerViewportSync,
  useIsMobile,
} from './map/drawerViewport.js';
import { BRAND, CLUSTER_MAX_ZOOM, Z } from './map/tokens.js';
import {
  AVAILABLE_VECTOR_STYLES,
  resolveStyle,
  FADE_DURATION_MS,
} from './map/maplibre/providers.js';
import {
  applyTerrain,
  clearTerrain,
  terrainForView,
  ACTIVE_DEM,
} from './map/maplibre/terrain.js';
import {
  routesToGeoJSON,
  habitatsToGeoJSON,
  poisToGeoJSON,
  boundariesToGeoJSON,
} from './map/maplibre/vectorSources.js';

import SafariMapDrawer from './map/LocationDrawer.jsx';
import ItineraryPanel from './map/ItineraryPanel.jsx';

function toPadding(arr) {
  if (!arr) return undefined;
  if (typeof arr === 'number') return arr;
  return { top: arr[0], right: arr[1], bottom: arr[2], left: arr[3] };
}

function MapSkeleton() {
  return (
    <div
      className="rounded-3xl border border-savanna-200 bg-cream-100/90 shadow-card p-4 sm:p-7"
      aria-hidden="true"
    >
      <div className="rounded-2xl bg-cream-200 min-h-[440px] sm:min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-3xl animate-pulse" aria-hidden="true">
            🗺️
          </span>
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-600">
            Loading safari map…
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MapLibreSafariMap({
  selectedParkId,
  parkIds,
  title = 'Interactive East Africa Safari Map',
  showHeading = true,
}) {
  const [baseLayer, setBaseLayer] = useState('carto');
  const [category, setCategory] = useState('places');
  const [circuit, setCircuit] = useState('all');
  const [activeLocationId, setActiveLocationId] = useState(selectedParkId || 'serengeti');
  const [activeHabitatId, setActiveHabitatId] = useState('black-rhino');
  const [activeActivityId, setActiveActivityId] = useState(null);
  const [status, setStatus] = useState('loading');
  const [notice, setNotice] = useState(null);
  const [failedLayers, setFailedLayers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [activeLegId, setActiveLegId] = useState(null);
  const [terrainEnabled, setTerrainEnabled] = useState(true);
  const [zoom, setZoom] = useState(DEFAULT_VIEW.zoom);
  const [mapBounds, setMapBounds] = useState(null);
  const [isClient, setIsClient] = useState(false);

  const mapRef = useRef(null);
  const shellRef = useRef(null);
  const isMobileRef = useRef(false);
  const activeLocationRef = useRef(activeLocationId);
  const categoryRef = useRef(category);
  const visibleLocationsRef = useRef(MAP_LOCATIONS);
  const terrainEnabledRef = useRef(terrainEnabled);
  const failedRef = useRef(new Set());

  const parkIdsKey = Array.isArray(parkIds) ? parkIds.join(',') : '';

  const isMobile = useIsMobile();
  isMobileRef.current = isMobile;

  const drawerLayout = useMemo(
    () =>
      computeDrawerLayout({
        isMobile,
        drawerOpen,
        drawerHeight:
          drawerOpen && typeof window !== 'undefined'
            ? Math.round(window.innerHeight * readViewportFraction('--map-drawer-sheet-height', 0.58))
            : 0,
        shellHeight: shellRef.current?.getBoundingClientRect().height,
      }),
    [isMobile, drawerOpen]
  );
  useDrawerViewportSync(drawerLayout);

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

  const quickNav = useMemo(() => QUICK_NAV_IDS.map(locationById).filter(Boolean), []);

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

  const wantsPlaces = category === 'places';
  const wantsHabitats = category === 'habitats';
  const wantsActivities = category === 'activities';

  const counts = useMemo(
    () => scopedCounts(visibleLocations, visibleActivities, MAP_HABITATS, circuit),
    [visibleLocations, visibleActivities, circuit]
  );

  const searchIndex = useMemo(() => buildSearchIndex(MAP_LOCATIONS, MAP_ACTIVITIES, MAP_HABITATS), []);

  const searchResults = useMemo(
    () => (searchQuery.length >= 2 ? search(searchIndex, searchQuery, 6) : []),
    [searchIndex, searchQuery]
  );

  const routesGeoJSON = useMemo(
    () => routesToGeoJSON(wantsPlaces ? visibleItineraryLegs : [], activeLegId),
    [wantsPlaces, visibleItineraryLegs, activeLegId]
  );

  const habitatsGeoJSON = useMemo(
    () => habitatsToGeoJSON(wantsHabitats ? [activeHabitat] : []),
    [wantsHabitats, activeHabitat]
  );

  const boundaryGeoJSON = useMemo(
    () => (wantsPlaces ? boundariesToGeoJSON(PARK_BOUNDARIES) : null),
    [wantsPlaces]
  );

  /* ------------------------------------------------------------------ *
   * Clustering — recomputed when zoom crosses CLUSTER_MAX_ZOOM.        *
   * MapLibre positions Marker elements; we only compute the bucketing. *
   * ------------------------------------------------------------------ */
  const mapItems = useMemo(() => {
    if (category === 'activities') return visibleActivities;
    if (category === 'places') return visibleLocations;
    return [];
  }, [category, visibleLocations, visibleActivities]);

  const clusters = useMemo(() => {
    if (!mapItems.length) return [];
    if (zoom > CLUSTER_MAX_ZOOM) {
      return mapItems.map(item => ({ ...item, isCluster: false }));
    }
    return clusterItems(mapItems, { zoom, bounds: mapBounds });
  }, [mapItems, zoom, mapBounds]);

  /* ------------------------------------------------------------------ *
   * Refs that init-time event handlers need to read without re-binding. *
   * ------------------------------------------------------------------ */
  useEffect(() => {
    visibleLocationsRef.current = visibleLocations;
    activeLocationRef.current = activeLocationId;
    categoryRef.current = category;
    terrainEnabledRef.current = terrainEnabled;
  }, [visibleLocations, activeLocationId, category, terrainEnabled]);

  useEffect(() => setIsClient(true), []);

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

  /* ------------------------------------------------------------------ *
   * Map lifecycle — init, event binding, terrain, cleanup.              *
   *                                                                   *
   * MapLibre loads the maplibre-gl module dynamically via the wrapper. *
   * onLoad fires once the style + initial sources are ready.          *
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (!isClient) return;

    let disposed = false;
    const mapInstanceRef = { current: null };

    const onMapInstance = mapInstance => {
      if (disposed || mapInstanceRef.current) return;
      mapInstanceRef.current = mapInstance;

      mapInstance.setFadeDuration(FADE_DURATION_MS);

      const canvas = mapInstance.getCanvas();
      const shell = canvas.parentElement;

      const onContextMenu = e => e.preventDefault();
      canvas.addEventListener('contextmenu', onContextMenu);

      const onPointOver = e => {
        const target = e?.originalEvent?.target;
        const pin = target && target.closest
          ? target.closest('.safari-pin, .safari-cluster')
          : null;
        shell.dataset.pointing = pin ? 'true' : 'false';
        if (pin) {
          const label = pin.querySelector('.safari-pin__label, .safari-cluster__label');
          if (label) label.classList.add('is-pointed');
        }
      };
      const onPointOut = () => {
        shell.dataset.pointing = 'false';
        shell.querySelectorAll('.is-pointed').forEach(el => el.classList.remove('is-pointed'));
      };
      mapInstance.on('mousemove', onPointOver);
      shell.addEventListener('mouseleave', onPointOut);

      const onMoveEnd = () => {
        if (disposed) return;
        const z = mapInstance.getZoom();
        if (z !== zoomRef.current) {
          zoomRef.current = z;
          setZoom(z);
        }
        const b = mapInstance.getBounds();
        setMapBounds(b);
        updateTerrains(mapInstance);
      };
      mapInstance.on('moveend', onMoveEnd);

      updateTerrains(mapInstance);
      setStatus('ready');
    };

    const zoomRef = { current: DEFAULT_VIEW.zoom };

    const updateTerrains = mapInstance => {
      if (!terrainEnabledRef.current || !mapInstance) return;
      try {
        const center = mapInstance.getCenter();
        const cfg = terrainForView(
          { lng: center.lng, lat: center.lat, zoom: mapInstance.getZoom() },
          terrainEnabledRef.current
        );
        if (cfg.demSource) {
          applyTerrain(mapInstance, {
            enabled: true,
            exaggeration: cfg.exaggeration,
            demSource: cfg.demSource,
          });
        }
      } catch (err) {
        console.warn('[MapLibreSafariMap] terrain update failed:', err);
      }
    };

    let pollId = setInterval(() => {
      if (disposed) {
        clearInterval(pollId);
        return;
      }
      const mapRefValue = mapRef.current;
      if (mapRefValue) {
        clearInterval(pollId);
        const mapInstance = mapRefValue.getMap();
        if (mapInstance) {
          if (onMapReadyCheck(mapInstance)) {
            onMapInstance(mapInstance);
          } else {
            mapInstance.once('load', () => onMapInstance(mapInstance));
          }
        }
      }
    }, 50);

    function onMapReadyCheck(mapInstance) {
      return !!(mapInstance.loaded && mapInstance.loaded());
    }

    const timeoutId = setTimeout(() => {
      if (disposed) return;
      const mapRefValue = mapRef.current;
      if (!mapRefValue || !mapRefValue.getMap()) {
        console.error(
          '[MapLibreSafariMap] Map failed to initialise within 8s. ' +
            'Check maplibre-gl bundling and style URL reachability.'
        );
        setStatus('error');
      }
    }, 8000);

    return () => {
      disposed = true;
      clearInterval(pollId);
      clearTimeout(timeoutId);
      const mapInstance = mapInstanceRef.current;
      if (mapInstance) {
        const canvas = mapInstance.getCanvas();
        const shell = canvas.parentElement;
        mapInstance.off('moveend', updateTerrains);
        canvas.removeEventListener('contextmenu', onContextMenu);
        shell?.removeEventListener('mouseleave', onPointOut);
        clearTerrain(mapInstance);
      }
    };
  }, [isClient]);

  /* ------------------------------------------------------------------ *
   * Base-layer switching — the 150-line alternating-pane state machine  *
   * is replaced by MapLibre's native setStyle() transition.            *
   * ------------------------------------------------------------------ */
  const styleUrl = resolveStyle(baseLayer);

  const handleProviderError = useCallback(
    e => {
      console.error('[MapLibreSafariMap] Provider error:', e?.error);
      if (status !== 'ready') {
        if (baseLayer !== 'carto' && !failedRef.current.has(baseLayer)) {
          failedRef.current.add(baseLayer);
          setFailedLayers([...failedRef.current]);
          setBaseLayer('carto');
        }
      }
    },
    [status, baseLayer]
  );

  /* ------------------------------------------------------------------ *
   * Interaction handlers                                               *
   * ------------------------------------------------------------------ */
  const focusLocation = useCallback(
    location => {
      setActiveLocationId(location.id);
      setDrawerOpen(true);
      const map = mapRef.current;
      if (!map) return;
      const isSide = !isMobileRef.current;
      map.flyTo({
        center: [location.lng, location.lat],
        zoom: Math.max(map.getZoom(), location.zoom || 7),
        duration: 1200,
        easing: t => (--t) * t * t + 1,
        padding: isSide ? toPadding([80, 380, 80, 80]) : undefined,
      });
    },
    []
  );

  const resetView = useCallback(() => {
    setCircuit('all');
    setActiveActivityId(null);
    setActiveLegId(null);
    setDrawerOpen(false);
    const loc = parkIdsKey
      ? locationById(parkIdsKey.split(',')[0])?.id ?? 'serengeti'
      : 'serengeti';
    setActiveLocationId(loc);
    mapRef.current?.flyTo({
      center: [DEFAULT_VIEW.center[1], DEFAULT_VIEW.center[0]],
      zoom: DEFAULT_VIEW.zoom,
      duration: 1200,
    });
  }, [parkIdsKey]);

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

  const openWhatsApp = message =>
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');

  /* ------------------------------------------------------------------ *
   * Style-layer specs for vector layers                                 *
   * ------------------------------------------------------------------ */
  const routeLayerSpec = useMemo(
    () => ({
      id: 'routes-line',
      type: 'line',
      source: 'routes',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': [
          'step',
          ['boolean', ['feature-state', 'highlight'], false],
          2,
          5,
        ],
        'line-opacity': [
          'step',
          ['boolean', ['feature-state', 'highlight'], false],
          0.4,
          1.0,
        ],
        'line-dasharray': [
          'step',
          ['boolean', ['feature-state', 'highlight'], false],
          ['match', ['get', 'mode'], 'fly', ['literal', [2, 2]], ['literal', []]],
          ['literal', []],
        ],
      },
    }),
    []
  );

  const habitatLayerSpec = useMemo(
    () => ({
      id: 'habitat-circle',
      type: 'circle',
      source: 'habitats',
      paint: {
        'circle-color': ['get', 'habitatColor'],
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          4, ['get', 'radius'],
          10, ['*', ['get', 'radius'], 1.8],
        ],
        'circle-stroke-color': BRAND.forest,
        'circle-stroke-width': 1,
        'circle-opacity': 0,
        'circle-stroke-opacity': 0.85,
      },
    }),
    []
  );

  const boundaryFillSpec = useMemo(
    () => ({
      id: 'boundary-fill',
      type: 'fill',
      source: 'boundaries',
      paint: {
        'fill-color': BRAND.forest,
        'fill-opacity': 0.1,
      },
    }),
    []
  );

  const boundaryBorderSpec = useMemo(
    () => ({
      id: 'boundary-border',
      type: 'line',
      source: 'boundaries',
      paint: {
        'line-color': BRAND.forest,
        'line-width': 1.5,
        'line-opacity': 0.9,
      },
    }),
    []
  );

  /* ------------------------------------------------------------------ *
   * Sync feature-state for highlighted route leg                       *
   * ------------------------------------------------------------------ */
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !map.getSource('routes')) return;
    const features = routesGeoJSON.features;
    features.forEach(f => {
      map.setFeatureState(
        { source: 'routes', id: f.properties.routeId },
        { highlight: f.properties.highlight }
      );
    });
  }, [routesGeoJSON, activeLegId]);

  /* ------------------------------------------------------------------ *
   * Render helper — POI markers                                        *
   * ------------------------------------------------------------------ */
  const buildPinHtml = useCallback((iconType, label, selected, size = 40) => {
    const pulse = selected
      ? '<span class="safari-pin__pulse" aria-hidden="true"></span>'
      : '';
    const face = selected
      ? 'bg-terracotta-400 border-white text-white'
      : 'bg-cream-50 border-teal-800 text-teal-900';
    return `
      <div class="safari-pin" style="width:${size}px;height:${size}px">
        ${pulse}
        <span class="safari-pin__core relative z-10 flex items-center justify-center w-full h-full rounded-full shadow-lg border-2 ${face}">
          <span style="font-size:${Math.round(size * 0.4)}px;line-height:1">${iconType}</span>
        </span>
        ${label ? `<span class="safari-pin__label">${label}</span>` : ''}
      </div>`;
  }, []);

  const renderPoiMarkers = () => {
    if (!clusters.length) return null;
    const map = mapRef.current;
    const items = mapItems;

    if (zoom > CLUSTER_MAX_ZOOM) {
      return items.map(item => {
        const isSelected = category === 'places' && item.id === activeLocationId;
        return (
          <Marker
            key={item.id}
            longitude={item.lng}
            latitude={item.lat}
            anchor="center"
            style={{ cursor: 'pointer' }}
          >
            <div
              className="safari-pin-wrapper"
              dangerouslySetInnerHTML={{
                __html: buildPinHtml(
                  item.iconType,
                  category === 'places' ? item.shortName || item.name : '',
                  isSelected,
                  category === 'activities' ? 32 : 40
                ),
              }}
              onClick={() => {
                if (category === 'places') focusLocation(item);
                else if (category === 'activities') {
                  setActiveActivityId(item.id);
                  const loc = locationById(item.parkId);
                  if (loc) focusLocation(loc);
                }
              }}
            />
          </Marker>
        );
      });
    }

    return clusters.map(node => {
      const key = node.id
        ? `cluster-${node.id}`
        : `cluster-${node.lat.toFixed(4)}-${node.lng.toFixed(4)}`;
      if (node.isCluster) {
        return (
          <Marker
            key={key}
            longitude={node.lng}
            latitude={node.lat}
            anchor="center"
            onClick={() => {
              const mapInstance = mapRef.current;
              if (!mapInstance) return;
              mapInstance.flyTo({
                center: [node.lng, node.lat],
                zoom: expansionZoom(node.count, zoom),
                duration: 600,
              });
            }}
          >
            <div
              className="cursor-pointer"
              dangerouslySetInnerHTML={{ __html: clusterIconHtml(node.count, node.kinds) }}
            />
          </Marker>
        );
      }

      const isSelected = category === 'places' && node.id === activeLocationId;
      return (
        <Marker
          key={node.id}
          longitude={node.lng}
          latitude={node.lat}
          anchor="center"
          style={{ cursor: 'pointer' }}
        >
          <div
            className="safari-pin-wrapper"
            dangerouslySetInnerHTML={{
              __html: buildPinHtml(
                node.iconType,
                category === 'places' ? node.shortName || node.name : '',
                isSelected,
                category === 'activities' ? 32 : 40
              ),
            }}
            onClick={() => {
              if (category === 'places') focusLocation(node);
              else if (category === 'activities') {
                setActiveActivityId(node.id);
                const loc = locationById(node.parkId);
                if (loc) focusLocation(loc);
              }
            }}
          />
        </Marker>
      );
    });
  };

  /* ------------------------------------------------------------------ *
   * Render                                                            *
   * ------------------------------------------------------------------ */
  if (!isClient) {
    return <MapSkeleton />;
  }

  return (
    <div className="bg-cream-100/90 rounded-3xl p-4 sm:p-7 border border-savanna-200 shadow-card">
      {showHeading && (
        <div className="mb-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="min-w-0 lg:flex-1 lg:pr-4">
            <span className="eyebrow">Real Geographic Safari Atlas</span>
            <h3 className="font-display text-2xl sm:text-3xl text-teal-800 mt-1">{title}</h3>
            <p className="text-xs sm:text-sm text-teal-700/80 mt-2 max-w-2xl">
              Explore Tanzania &amp; Kenya&rsquo;s game reserves, mountain peaks and coastal spice
              islands on live satellite and vector maps.
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

      <div className="safari-map-shell" ref={shellRef} data-pointing="false">
        <Map
          ref={mapRef}
          id="maplibre-safari-map"
          mapStyle={styleUrl}
          styleDiffing={true}
          initialViewState={{
            longitude: DEFAULT_VIEW.center[1],
            latitude: DEFAULT_VIEW.center[0],
            zoom: DEFAULT_VIEW.zoom,
            pitch: 0,
            bearing: 0,
          }}
          minZoom={4}
          maxZoom={17}
          minPitch={0}
          maxPitch={60}
          scrollZoom={false}
          attributionControl={false}
          onError={handleProviderError}
          style={{ width: '100%', height: '100%' }}
        >
          {/* DEM source for 3D terrain */}
          <Source
            id={ACTIVE_DEM.id}
            type="raster-dem"
            url={ACTIVE_DEM.url}
            tileSize={ACTIVE_DEM.tileSize}
            maxzoom={ACTIVE_DEM.maxzoom}
          />

          {/* Routes as GeoJSON LineString with feature-state highlighting */}
          <Source id="routes" type="geojson" data={routesGeoJSON}>
            <Layer {...routeLayerSpec} />
          </Source>

          {/* Habitat ranges as GeoJSON Point → circle layer */}
          <Source id="habitats" type="geojson" data={habitatsGeoJSON}>
            <Layer {...habitatLayerSpec} />
          </Source>

          {/* Park boundaries (WDPA) */}
          {boundaryGeoJSON && (
            <Source id="boundaries" type="geojson" data={boundaryGeoJSON}>
              <Layer {...boundaryFillSpec} />
              <Layer {...boundaryBorderSpec} />
            </Source>
          )}

          {/* POI / activity markers */}
          {renderPoiMarkers()}

          <NavigationControl position="top-right" />
          <AttributionControl position="bottom-right" />
        </Map>

        {/* Top-left: base layer + category controls */}
        <div className="safari-map-overlay safari-map-overlay--tl flex flex-col gap-1.5">
          <div className="safari-map-panel safari-map-controls" data-open={controlsOpen}>
            <button
              type="button"
              className="safari-map-controls__toggle px-2 py-1 rounded-lg text-xs font-semibold text-teal-800"
              onClick={() => setControlsOpen(o => !o)}
              aria-expanded={controlsOpen}
              aria-label="Map layers and filters"
            >
              {failedLayers.length > 0 ? '⚠️ Layers' : '🗺️ Layers'}
            </button>
            <div className="safari-map-controls__body flex flex-wrap items-center gap-1">
              {AVAILABLE_VECTOR_STYLES.map(provider => {
                const key = provider.id;
                const isFailed = failedLayers.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setBaseLayer(key)}
                    aria-pressed={baseLayer === key}
                    title={isFailed ? `${provider.label} — unavailable` : provider.label}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                      baseLayer === key
                        ? 'bg-teal-800 text-white shadow-sm'
                        : 'text-teal-800 hover:bg-cream-100'
                    } ${isFailed ? 'opacity-50 line-through' : ''}`}
                  >
                    <span aria-hidden="true">{provider.icon}</span>
                    <span className="hidden sm:inline">{provider.label}</span>
                  </button>
                );
              })}

              {/* 3D Terrain toggle */}
              <button
                type="button"
                onClick={() => setTerrainEnabled(!terrainEnabled)}
                aria-pressed={terrainEnabled}
                aria-label={terrainEnabled ? 'Disable 3D terrain' : 'Enable 3D terrain'}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                  terrainEnabled
                    ? 'bg-terracotta-400 text-white shadow-sm'
                    : 'text-terracotta-700 hover:bg-cream-100'
                }`}
                title={terrainEnabled ? 'Disable 3D terrain' : 'Enable 3D terrain'}
              >
                <span aria-hidden="true">🏔️</span>
                <span className="hidden sm:inline">Terrain</span>
              </button>

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

          {/* Category tabs */}
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
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition flex items-center gap-1 ${
                  category === c.id
                    ? 'bg-teal-800 text-white shadow-sm'
                    : 'text-teal-800 hover:bg-cream-100'
                }`}
              >
                <span aria-hidden="true" className="mr-1">
                  {c.icon}
                </span>
                {c.label}
                <span
                  className={`ml-1 px-1.5 rounded-full text-[9px] font-bold tabular-nums ${
                    category === c.id
                      ? 'bg-white/25 text-white'
                      : 'bg-savanna-200 text-teal-700'
                  }`}
                >
                  {counts[c.id] ?? 0}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="safari-map-panel relative w-[min(17rem,_calc(100vw-3rem))]">
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
                        if (r.kind === 'Activity') {
                          setCategory('activities');
                          setActiveActivityId(r.id);
                          const loc = locationById(r.loc.parkId);
                          if (loc) focusLocation(loc);
                        } else if (r.loc.lat != null) {
                          setCategory('places');
                          focusLocation(r.loc);
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

        {/* Top-right: itinerary panel */}
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
              Safari Routes
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
              Indicative core range — zoom in to see detail
            </p>
          </div>
        ) : null}

        {/* Bottom: quick-nav */}
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

        {/* Loading state overlay */}
        {status === 'loading' ? (
          <div className="safari-map-state">
            <span className="text-3xl animate-pulse" aria-hidden="true">
              🗺️
            </span>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-600">
              Loading map…
            </p>
          </div>
        ) : null}

        {/* Error state overlay */}
        {status === 'error' ? (
          <div className="safari-map-state">
            <span className="text-3xl" aria-hidden="true">
              🛰️
            </span>
            <p className="font-display text-lg text-teal-800">Map unavailable</p>
            <p className="text-xs text-teal-700/80 max-w-sm">
              MapLibre GL could not initialise. Check your WebGL support and
              connection, then refresh.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-2 text-xs font-semibold text-teal-700 underline hover:text-teal-900"
            >
              Reload page
            </button>
          </div>
        ) : null}

        {/* Notice banner */}
        {notice && status === 'ready' ? (
          <div className="safari-map-overlay safari-map-overlay--bl">
            <div
              className="safari-map-panel px-3 py-2 max-w-sm flex items-start gap-2"
              role="status"
              aria-live="polite"
            >
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

      {/* Detail drawer (portaled to <body>) */}
      <SafariMapDrawer
        location={activeLocation}
        open={drawerOpen}
        isMobile={isMobile}
        onClose={() => setDrawerOpen(false)}
        onPrev={() => stepLocation(-1)}
        onNext={() => stepLocation(1)}
      />

      {/* Detail card — always visible below the map for context */}
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
                <dd>
                  <strong>Best time:</strong> {activeLocation.bestMonths}
                </dd>
              </div>
              <div className="flex items-start gap-2">
                <dt className="shrink-0">🚙</dt>
                <dd>
                  <strong>Transit:</strong> {activeLocation.transit}
                </dd>
              </div>
              <div className="flex items-start gap-2">
                <dt className="shrink-0">🌄</dt>
                <dd>
                  <strong>Landscape:</strong> {activeLocation.terrain}
                </dd>
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
