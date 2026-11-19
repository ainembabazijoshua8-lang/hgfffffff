import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ACTIVITY_CATALOG } from '../data/activitiesCatalog.js';
import { CloseIcon, SearchIcon } from './Icons.jsx';

const SITE_SERVICES = [
  { id: 'all-tours', title: 'All safari tours', description: 'Browse every curated safari journey', to: '/tours', type: 'Service' },
  { id: 'wildlife-safaris', title: 'Wildlife safaris', description: 'Serengeti, Ngorongoro, Tarangire and more', to: '/tours?category=Wildlife+Safari', type: 'Service' },
  { id: 'cultural-tours', title: 'Cultural tours', description: 'Community-led experiences and local culture', to: '/tours?category=Cultural+Tour', type: 'Service' },
  { id: 'activities', title: 'Activities and add-ons', description: 'Build your trip with extra experiences', to: '/activities', type: 'Service' },
  { id: 'trip-planner', title: 'Custom trip planner', description: 'Combine tours, activities, dates and travelers', to: '/booking', type: 'Service' },
  { id: 'quick-enquiry', title: 'Quick enquiry', description: 'Ask the team for a tailored quote', to: '/booking?mode=quick', type: 'Service' },
  { id: 'about', title: 'About Jebri Safaris', description: 'Meet the local team behind the journeys', to: '/about', type: 'Page' },
  { id: 'journal', title: 'Travel journal', description: 'Planning notes and stories from the field', to: '/blog', type: 'Page' },
  { id: 'faq', title: 'Travel FAQ', description: 'Answers about planning, booking and safari', to: '/faq', type: 'Page' },
  { id: 'contact', title: 'Contact us', description: 'Reach the Jebri Safaris team', to: '/contact', type: 'Page' },
];

const normalize = value => String(value || '').toLowerCase();

// The header mounts SiteSearch twice per page view (desktop slot + mobile
// drawer), so a per-instance fetch meant two GET /api/tours on every page.
// Share one in-flight promise across instances instead.
let toursCache = null;
let toursPromise = null;
function loadTours() {
  if (toursCache) return Promise.resolve(toursCache);
  if (!toursPromise) {
    toursPromise = fetch('/api/tours')
      .then(response => response.json())
      .then(data => {
        toursCache = data.ok ? data.tours : [];
        toursPromise = null;
        return toursCache;
      })
      .catch(() => {
        toursPromise = null;
        return [];
      });
  }
  return toursPromise;
}

export default function SiteSearch({ isMobile = false }) {
  const instanceId = useId().replace(/:/g, '');
  const inputId = `site-search-${instanceId}`;
  const resultsId = `site-search-results-${instanceId}`;
  const [query, setQuery] = useState('');
  const [tours, setTours] = useState(toursCache || []);
  const [open, setOpen] = useState(false);
  // Desktop shows only an icon button; the field opens in a panel on click so
  // the header keeps its room for navigation. The mobile drawer keeps a full field.
  const compact = !isMobile;
  const [expanded, setExpanded] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const toggleRef = useRef(null);

  useEffect(() => {
    if (expanded) inputRef.current?.focus();
  }, [expanded]);

  function collapse({ restoreFocus = false } = {}) {
    setOpen(false);
    if (!compact) return;
    setExpanded(false);
    if (restoreFocus) toggleRef.current?.focus();
  }

  useEffect(() => {
    let cancelled = false;
    loadTours().then(list => { if (!cancelled) setTours(list); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const closeOnOutsideClick = event => {
      if (searchRef.current && !searchRef.current.contains(event.target)) collapse();
    };
    const closeOnEscape = event => {
      if (event.key === 'Escape' && searchRef.current?.contains(document.activeElement)) collapse({ restoreFocus: true });
      else if (event.key === 'Escape') collapse();
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const term = normalize(query.trim());
  const tourResults = tours
    .filter(tour => [tour.title, tour.location, tour.category, tour.summary].some(value => normalize(value).includes(term)))
    .slice(0, 5)
    .map(tour => ({
      id: tour.id,
      title: tour.title,
      description: `${tour.location} - ${tour.duration_days} ${tour.duration_days === 1 ? 'day' : 'days'}`,
      to: `/tours/${tour.slug}`,
      type: 'Tour',
    }));
  const activityResults = ACTIVITY_CATALOG
    .filter(activity => [activity.title, activity.category, activity.blurb].some(value => normalize(value).includes(term)))
    .slice(0, 5)
    .map(activity => ({
      id: activity.id,
      title: activity.title,
      description: `${activity.duration} - add to your custom trip`,
      to: `/booking?activity=${encodeURIComponent(activity.id)}`,
      type: 'Activity',
    }));
  const serviceResults = SITE_SERVICES
    .filter(service => [service.title, service.description].some(value => normalize(value).includes(term)))
    .slice(0, 5);
  const results = [...tourResults, ...activityResults, ...serviceResults].slice(0, 8);
  const popularResults = [...SITE_SERVICES.slice(0, 5), ...activityResults.slice(0, 3)];
  const visibleResults = term ? results : popularResults;

  const field = (
    <>
      <label htmlFor={inputId} className="sr-only">Search tours, activities and services</label>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-teal-500" />
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          value={query}
          onChange={event => { setQuery(event.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search tours, activities..."
          className="field h-10 rounded-full pl-9 pr-3 text-sm bg-white/90 focus:bg-white border-savanna-200"
          aria-expanded={open}
          aria-controls={resultsId}
          aria-autocomplete="list"
          role="combobox"
        />
      </div>
    </>
  );

  const resultsList = (
    <div
      id={resultsId}
      role="listbox"
      className={compact
        ? 'mt-2 max-h-[min(60vh,26rem)] overflow-y-auto'
        : 'absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 w-full max-h-[min(70vh,28rem)] overflow-y-auto rounded-2xl border border-savanna-200 bg-white p-2 shadow-2xl animate-fade-up'}
    >
      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-teal-500 border-b border-savanna-100 mb-1">
        {term ? `Results for "${query}"` : 'Popular destinations & tours'}
      </div>
      {visibleResults.length > 0 ? visibleResults.map(result => (
        <Link
          key={`${result.type}-${result.id}`}
          to={result.to}
          role="option"
          onClick={() => { collapse(); setQuery(''); }}
          className="block rounded-xl px-3 py-2 hover:bg-cream-100 focus:bg-cream-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-300 transition"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-xs sm:text-sm text-teal-800">{result.title}</span>
            <span className="shrink-0 text-[9px] uppercase font-bold tracking-wider text-terracotta-400 bg-terracotta-50 px-1.5 py-0.5 rounded">{result.type}</span>
          </div>
          <span className="mt-0.5 block text-[11px] text-teal-700/70 truncate">{result.description}</span>
        </Link>
      )) : (
        <div className="px-3 py-4 text-xs text-teal-700/70">No matching tours or activities. Try another search term.</div>
      )}
      {term && (
        <Link
          to={`/tours?q=${encodeURIComponent(query)}`}
          onClick={() => { collapse(); setQuery(''); }}
          className="mt-1 block border-t border-savanna-100 px-3 py-2.5 text-xs font-semibold text-terracotta-400 hover:text-terracotta-500"
        >
          See all results in tour catalog →
        </Link>
      )}
    </div>
  );

  if (!compact) {
    return (
      <div ref={searchRef} className="relative w-full">
        {field}
        {open && resultsList}
      </div>
    );
  }

  return (
    <div ref={searchRef} className="relative shrink-0">
      <button
        ref={toggleRef}
        type="button"
        onClick={() => (expanded ? collapse() : setExpanded(true))}
        aria-expanded={expanded}
        aria-label={expanded ? 'Close search' : 'Search the site'}
        title="Search"
        className={`flex h-9 w-9 xl:h-10 xl:w-10 items-center justify-center rounded-full border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-300 ${
          expanded
            ? 'border-teal-800 bg-teal-800 text-cream-50'
            : 'border-savanna-200 bg-white/90 text-teal-700 hover:border-terracotta-300 hover:text-teal-900'
        }`}
      >
        {expanded ? <CloseIcon className="text-base" /> : <SearchIcon className="text-[17px]" />}
      </button>

      {expanded && (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(24rem,calc(100vw-1.5rem))] rounded-2xl border border-savanna-200 bg-white p-3 shadow-2xl animate-fade-up">
          {field}
          {open && resultsList}
        </div>
      )}
    </div>
  );
}
