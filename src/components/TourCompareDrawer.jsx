import { Link } from 'react-router-dom';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { SiteIcon } from './Icons.jsx';

export default function TourCompareDrawer({ selectedTours, onRemove, onClear }) {
  const { formatPrice } = useCurrency();

  if (!selectedTours || selectedTours.length === 0) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-teal-950/95 backdrop-blur-xl border-t-2 border-terracotta-500 shadow-2xl text-cream-50 animate-slide-up">
      <div className="container-x py-4">
        <div className="flex items-center justify-between pb-3 border-b border-teal-800/80 mb-3">
          <div className="flex items-center gap-2">
            <SiteIcon name="scale" className="text-base sm:text-lg text-terracotta-300" />
            <span className="font-display font-bold text-sm sm:text-base text-cream-50">
              Comparing Safari Packages ({selectedTours.length}/3)
            </span>
          </div>
          <button
            onClick={onClear}
            className="text-xs text-cream-100/70 hover:text-terracotta-300 transition-colors font-medium underline"
          >
            Clear all
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {selectedTours.map((tour) => (
            <div
              key={tour.id}
              className="bg-teal-900/80 rounded-xl p-3 sm:p-4 border border-teal-700/60 relative flex flex-col justify-between"
            >
              <button
                onClick={() => onRemove(tour.id)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-teal-950/80 text-cream-100/70 hover:text-cream-50 flex items-center justify-center text-xs"
                title="Remove from comparison"
              >
                <SiteIcon name="close" />
              </button>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-terracotta-300">
                  {tour.tier} · {tour.duration_days} Days
                </span>
                <h4 className="font-display font-bold text-sm sm:text-base text-cream-50 line-clamp-1 mt-0.5 pr-6">
                  {tour.title}
                </h4>
                <div className="text-xs text-gold-400 font-bold mt-1">
                  From {formatPrice(tour.price_usd)} / person
                </div>
                <div className="text-[11px] text-cream-100/75 mt-1 line-clamp-1">
                  <SiteIcon name="map-pin" className="mr-1 align-[-2px]" />{tour.location}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-teal-800/60 flex items-center gap-2">
                <Link
                  to={`/tours/${tour.slug}`}
                  className="btn-primary py-1.5 px-3 text-xs w-full text-center"
                >
                  View Details
                </Link>
                <Link
                  to={`/booking?tour=${encodeURIComponent(tour.id)}`}
                  className="btn-outline py-1.5 px-3 text-xs w-full text-center border-white/40 hover:bg-white/10"
                >
                  Book Trip
                </Link>
              </div>
            </div>
          ))}

          {selectedTours.length < 3 && (
            <div className="hidden md:flex items-center justify-center border-2 border-dashed border-teal-800/80 rounded-xl p-4 text-center text-xs text-cream-100/50">
              Select another tour to compare side-by-side
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
