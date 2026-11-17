import { lazy, Suspense } from 'react';
import MapErrorBoundary from './MapErrorBoundary.jsx';

const SafariMap = lazy(() => import('./MapLibreSafariMap.jsx'));

function MapSkeleton() {
  return (
    <div
      className="rounded-3xl border border-savanna-200 bg-cream-100/90 shadow-card p-4 sm:p-7"
      aria-hidden="true"
    >
      <div className="rounded-2xl bg-cream-200 min-h-[440px] sm:min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-3xl animate-pulse">🗺️</span>
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-600">
            Loading safari map…
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LazySafariMap(props) {
  return (
    <MapErrorBoundary>
      <Suspense fallback={<MapSkeleton />}>
        <SafariMap {...props} />
      </Suspense>
    </MapErrorBoundary>
  );
}