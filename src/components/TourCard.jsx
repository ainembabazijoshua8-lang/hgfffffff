import { Link } from 'react-router-dom';
import ImageLightbox from './ImageLightbox.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { SiteIcon } from './Icons.jsx';

const TIER_LABEL = {
  budget: 'Budget camping',
  mid: 'Standard comfort',
  luxury: 'Luxury',
};

const TIER_STYLE = {
  budget: 'bg-cream-50 text-sage-700 border border-sage-200',
  mid: 'bg-cream-50 text-terracotta-600 border border-terracotta-200',
  luxury: 'bg-teal-900 text-cream-50 border border-white/25',
};

const TAG_ICON = {
  solo: 'compass',
  couples: 'heart',
  family: 'users',
  group: 'users',
  honeymoon: 'gem',
  photography: 'camera',
  birding: 'bird',
};

export default function TourCard({ tour, onToggleCompare, isComparing }) {
  const { formatPrice } = useCurrency();
  const isGroupCamping = tour.id === 'budget-group-camping-safari-6-day';

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-savanna-200 bg-cream-50 shadow-sm transition-shadow duration-300 hover:shadow-cardHover">
      <div className="relative h-52 shrink-0 overflow-hidden rounded-t-lg">
        <ImageLightbox
          src={tour.hero_image}
          alt={tour.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          buttonClassName="h-full w-full"
        />
        <div className={`absolute left-3 top-3 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${TIER_STYLE[tour.tier] || TIER_STYLE.mid}`}>
          {TIER_LABEL[tour.tier] || tour.tier}
        </div>

        {onToggleCompare && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleCompare(tour);
            }}
            className={`absolute right-3 top-3 flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${
              isComparing
                ? 'bg-terracotta-500 text-cream-50'
                : 'bg-teal-950/85 text-cream-50 hover:bg-teal-900'
            }`}
            aria-pressed={Boolean(isComparing)}
            aria-label={`${isComparing ? 'Remove' : 'Add'} ${tour.title} ${isComparing ? 'from' : 'to'} comparison`}
          >
            <span className="inline-flex items-center gap-1">{isComparing ? <><SiteIcon name="check" /> Comparing</> : '+ Compare'}</span>
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="truncate text-[11px] font-semibold uppercase tracking-wide text-terracotta-600" title={tour.location}>
          {tour.location}
        </div>
        <h3 className="mt-1 min-h-12 line-clamp-2 font-display text-xl font-bold leading-snug text-teal-900 group-hover:text-terracotta-600">
          <Link to={`/tours/${tour.slug}`} className="rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-300">
            {tour.title}
          </Link>
        </h3>
        <p className="mt-2 min-h-10 clamp-2 text-sm leading-relaxed text-teal-700/85">{tour.summary}</p>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-savanna-200 pt-3 text-xs text-teal-700">
          <span className="font-semibold">{tour.duration_days || 0} {(tour.duration_days || 0) === 1 ? 'day' : 'days'}</span>
          <span className="truncate text-right">{tour.category}</span>
        </div>

        <div className="mt-3 flex min-h-6 flex-wrap gap-1.5">
          {tour.best_for?.slice(0, 3).map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 rounded-sm bg-mist px-2 py-1 text-[10px] font-medium capitalize text-teal-800">
              <SiteIcon name={TAG_ICON[tag] || 'check'} />{tag}
            </span>
          ))}
        </div>

        <div className="mt-4 border-y border-savanna-200 py-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-teal-700">Price per person</span>
            <span className="font-display text-xl font-bold text-terracotta-600">{formatPrice(tour.price_usd)}</span>
          </div>
          <p className="mt-0.5 text-xs text-teal-700/75">
            {isGroupCamping ? 'Based on 6 travelers' : 'Based on 2 adults sharing'}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <Link
            to={`/tours/${tour.slug}`}
            className="inline-flex min-h-10 items-center rounded-md px-2 text-xs font-semibold text-teal-800 hover:text-terracotta-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-300"
          >
            Itinerary & map <span aria-hidden="true">→</span>
          </Link>
          <Link
            to={`/booking?tour=${encodeURIComponent(tour.id)}`}
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-teal-800 px-3 text-xs font-semibold text-cream-50 transition-colors hover:bg-teal-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-300 focus-visible:ring-offset-2"
          >
            Plan safari
          </Link>
        </div>
      </div>
    </article>
  );
}
