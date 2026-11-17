import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import TourCard from '../components/TourCard.jsx';
import LazySafariMap from '../components/LazySafariMap.jsx';
import MigrationCalendar from '../components/MigrationCalendar.jsx';
import TourCompareDrawer from '../components/TourCompareDrawer.jsx';
import { fallbackTours } from '../data/fallbackTours.js';

const CATEGORIES = ['All', 'Wildlife Safari', 'Cultural Tour'];
const TIERS = [
  { id: 'all', label: 'All budgets' },
  { id: 'budget', label: 'Budget Camping (from $1,250)' },
  { id: 'mid', label: 'Standard Comfort (from $2,100)' },
  { id: 'luxury', label: 'Luxury Fly-In (from $4,000)' },
];
const BEST_FOR = ['couples', 'family', 'group', 'honeymoon', 'photography'];
const SORTS = [
  { id: 'featured', label: 'Recommended' },
  { id: 'price-asc', label: 'Price: low → high' },
  { id: 'price-desc', label: 'Price: high → low' },
  { id: 'duration-asc', label: 'Shortest first' },
];

function getFallbackTours({ category, tier, bestFor, q, sort }) {
  const query = q.trim().toLowerCase();
  const filteredTours = fallbackTours.filter(tour =>
    (category === 'All' || tour.category === category) &&
    (tier === 'all' || tour.tier === tier) &&
    (!bestFor || tour.best_for?.includes(bestFor)) &&
    (!query || [tour.title, tour.summary, tour.location].some(value => value?.toLowerCase().includes(query)))
  );

  return filteredTours.sort((a, b) => {
    if (sort === 'price-asc') return a.price_usd - b.price_usd;
    if (sort === 'price-desc') return b.price_usd - a.price_usd;
    if (sort === 'duration-asc') return a.duration_days - b.duration_days;
    return Number(b.featured) - Number(a.featured) || a.price_usd - b.price_usd;
  });
}

export default function ToursPage() {
  const [params, setParams] = useSearchParams();
  const initialCat = params.get('category') || 'All';
  const initialTier = params.get('tier') || 'all';
  const initialBest = params.get('best_for') || '';
  const initialSort = params.get('sort') || 'featured';
  const [category, setCategory] = useState(initialCat);
  const [tier, setTier] = useState(initialTier);
  const [bestFor, setBestFor] = useState(initialBest);
  const [sort, setSort] = useState(initialSort);
  const [q, setQ] = useState(params.get('q') || '');
  // The input is bound to qInput (instant) while `q` — the value that actually
  // drives fetching and the URL — is debounced. Binding the input straight to
  // `q` fired one aborted request per keystroke and, because the render branch
  // flips on `loading`, unmounted the whole results grid on each character.
  const [qInput, setQInput] = useState(params.get('q') || '');
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  // True only for the very first load. Subsequent refetches keep the grid
  // mounted so typing never collapses the results.
  const [initialLoad, setInitialLoad] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [activeExploreTab, setActiveExploreTab] = useState('tours'); // 'tours' | 'map' | 'migration'
  const [compareTours, setCompareTours] = useState([]);

  useEffect(() => {
    document.title = 'Tours & Safari Packages | Jebri Safaris';
  }, []);

  useEffect(() => {
    if (qInput === q) return undefined;
    const timer = setTimeout(() => setQ(qInput), 300);
    return () => clearTimeout(timer);
  }, [qInput, q]);

  useEffect(() => {
    const cat = params.get('category') || 'All';
    const t = params.get('tier') || 'all';
    const bf = params.get('best_for') || '';
    const s = params.get('sort') || 'featured';
    const query = params.get('q') || '';
    setCategory(cat);
    setTier(t);
    setBestFor(bf);
    setSort(s);
    setQ(query);
    setQInput(query);
  }, [params]);

  useEffect(() => {
    // Only the first load shows a full-page spinner; later refetches keep the
    // existing grid on screen so the list never collapses while typing.
    setLoading(true);
    setFetchError(null);
    const controller = new AbortController();
    const queryParams = new URLSearchParams();
    if (category !== 'All') queryParams.set('category', category);
    if (tier !== 'all') queryParams.set('tier', tier);
    if (bestFor) queryParams.set('best_for', bestFor);
    if (q) queryParams.set('q', q);
    if (sort && sort !== 'featured') queryParams.set('sort', sort);

    fetch(`/api/tours?${queryParams.toString()}`, { signal: controller.signal })
      .then(r => {
        if (!r.ok) throw new Error('Could not load tours.');
        return r.json();
      })
      .then(d => {
        if (!d?.ok || !Array.isArray(d.tours)) throw new Error('Could not load tours.');
        setTours(d.tours);
      })
      .catch(error => {
        if (error.name === 'AbortError') return;
        const localTours = getFallbackTours({ category, tier, bestFor, q, sort });
        setTours(localTours);
        setFetchError(localTours.length
          ? 'Showing saved tour listings; live availability is temporarily unavailable.'
          : 'Could not load tours.');
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
          setInitialLoad(false);
        }
      });
    return () => controller.abort();
  }, [category, tier, bestFor, q, sort]);

  useEffect(() => {
    const p = new URLSearchParams();
    if (category !== 'All') p.set('category', category);
    if (tier !== 'all') p.set('tier', tier);
    if (bestFor) p.set('best_for', bestFor);
    if (q) p.set('q', q);
    if (sort && sort !== 'featured') p.set('sort', sort);
    setParams(p, { replace: true });
  }, [category, tier, bestFor, q, sort, setParams]);

  const reset = () => {
    setCategory('All');
    setTier('all');
    setBestFor('');
    setQ('');
    setQInput('');
    setSort('featured');
  };

  const handleToggleCompare = (tour) => {
    setCompareTours(prev => {
      const exists = prev.some(t => t.id === tour.id);
      if (exists) {
        return prev.filter(t => t.id !== tour.id);
      }
      if (prev.length >= 3) {
        alert('You can compare up to 3 safari packages at once.');
        return prev;
      }
      return [...prev, tour];
    });
  };

  const handleRemoveCompare = (tourId) => {
    setCompareTours(prev => prev.filter(t => t.id !== tourId));
  };

  const handleClearCompare = () => {
    setCompareTours([]);
  };

  return (
    <div className="pt-8 pb-24">
      <section className="container-x pt-10 pb-8 text-center">
        <span className="eyebrow">Tanzania Safari Portfolio</span>
        <h1 className="section-title mt-3">Curated Safari Packages</h1>
        <p className="mt-4 text-teal-700/80 max-w-2xl mx-auto leading-relaxed">
          10 real-market Tanzanian itineraries featuring transparent double-occupancy pricing, experienced local guides, and private 4x4 Land Cruisers.
        </p>
        <p className="mt-2 text-xs text-teal-600/75 max-w-2xl mx-auto">
          All packages include mandatory TANAPA / NCAA park and crater fees, 18% VAT, AMREF Flying Doctors evacuation, and comprehensive travel insurance for the booked trip.
        </p>

        {/* View Switcher Tabs */}
        <div className="mt-8 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => setActiveExploreTab('tours')}
            className={`px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 ${
              activeExploreTab === 'tours'
                ? 'bg-teal-800 text-cream-50 shadow-glow'
                : 'bg-cream-50/80 backdrop-blur-md text-teal-800 border border-savanna-200 hover:bg-cream-50 hover:shadow-sm'
            }`}
          >
            📋 Tour Packages ({tours.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveExploreTab('map')}
            className={`px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
              activeExploreTab === 'map'
                ? 'bg-teal-800 text-cream-50 shadow-glow'
                : 'bg-cream-50/80 backdrop-blur-md text-teal-800 border border-savanna-200 hover:bg-cream-50 hover:shadow-sm'
            }`}
          >
            <span>🗺️</span> Circuit Map
          </button>
          <button
            type="button"
            onClick={() => setActiveExploreTab('migration')}
            className={`px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
              activeExploreTab === 'migration'
                ? 'bg-teal-800 text-cream-50 shadow-glow'
                : 'bg-cream-50/80 backdrop-blur-md text-teal-800 border border-savanna-200 hover:bg-cream-50 hover:shadow-sm'
            }`}
          >
            <span>🦓</span> Migration Calendar
          </button>
        </div>
      </section>

      {/* Circuit Map Tab */}
      {activeExploreTab === 'map' && (
        <section className="container-x mb-16 animate-fade-up">
          <LazySafariMap />
        </section>
      )}

      {/* Migration Calendar Tab */}
      {activeExploreTab === 'migration' && (
        <section className="container-x mb-16 animate-fade-up">
          <MigrationCalendar />
        </section>
      )}

      {/* Tours List Tab */}
      {activeExploreTab === 'tours' && (
        <>
          <section className="container-x mb-12">
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {[
                { title: 'Budget Camping', body: 'Authentic campfire nights inside national parks. $1,250 – $1,400 with private safari chef.', accent: 'bg-sage-50 text-sage-700 border-sage-200' },
                { title: 'Standard Comfort', body: 'En-suite canvas tented lodges & safari lodges. $2,100 – $3,900 balanced luxury.', accent: 'bg-terracotta-50 text-terracotta-600 border-terracotta-200' },
                { title: 'Luxury Fly-In', body: 'Light aircraft hops, 5-star secluded bush camps, gourmet bush dining. $4,000 – $6,500.', accent: 'bg-teal-900 text-gold-400 border-gold-400/40 shadow-sm' },
              ].map(card => (
                <div key={card.title} className={`rounded-2xl border p-4 shadow-sm ${card.accent}`}>
                  <div className="text-xs font-bold uppercase tracking-[0.16em]">{card.title}</div>
                  <p className="mt-1.5 text-xs sm:text-sm leading-relaxed">{card.body}</p>
                </div>
              ))}
            </div>

            <div className="glass-card p-6 sm:p-8 space-y-6 animate-slide-up rounded-2xl border border-savanna-200 shadow-sm">
              {/* Tier */}
              <div>
                <div className="text-xs uppercase tracking-widest text-teal-800 mb-3 font-bold">Budget & Accommodation Tier</div>
                <div className="flex flex-wrap gap-2">
                  {TIERS.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTier(t.id)}
                      className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border transition-all duration-300 ${
                        tier === t.id
                          ? 'bg-teal-800 text-cream-50 border-teal-800 shadow-sm'
                          : 'bg-cream-50/70 text-teal-800 border-savanna-200 hover:bg-cream-50'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <div className="text-xs uppercase tracking-widest text-teal-800 mb-3 font-bold">Experience Category</div>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border transition-all duration-300 ${
                        category === c
                          ? 'bg-terracotta-500 text-cream-50 border-terracotta-500 shadow-sm'
                          : 'bg-cream-50/70 text-teal-800 border-savanna-200 hover:bg-cream-50'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Best for */}
              <div>
                <div className="text-xs uppercase tracking-widest text-teal-800 mb-3 font-bold">Traveler Style</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setBestFor('')}
                    className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border transition-all duration-300 ${
                      bestFor === ''
                        ? 'bg-teal-800 text-cream-50 border-teal-800 shadow-sm'
                        : 'bg-cream-50/70 text-teal-800 border-savanna-200 hover:bg-cream-50'
                    }`}
                  >
                    All Styles
                  </button>
                  {BEST_FOR.map(b => (
                    <button
                      key={b}
                      onClick={() => setBestFor(bestFor === b ? '' : b)}
                      className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold capitalize border transition-all duration-300 ${
                        bestFor === b
                          ? 'bg-teal-800 text-cream-50 border-teal-800 shadow-sm'
                          : 'bg-cream-50/70 text-teal-800 border-savanna-200 hover:bg-cream-50'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search + sort */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <input
                  type="search"
                  value={qInput}
                  onChange={e => setQInput(e.target.value)}
                  placeholder="Search by park, safari title, or highlight…"
                  className="field flex-1 bg-cream-50 focus:bg-white"
                  aria-label="Search tours"
                />
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                  className="field sm:w-56 bg-cream-50 focus:bg-white cursor-pointer"
                  aria-label="Sort"
                >
                  {SORTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                {(tier !== 'all' || category !== 'All' || bestFor || q) && (
                  <button
                    onClick={reset}
                    className="btn-ghost whitespace-nowrap text-terracotta-500 hover:text-terracotta-600 font-bold"
                    aria-label="Clear all tour filters"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="container-x">
            {loading && initialLoad ? (
              <div className="text-center py-20 text-teal-600 font-medium">Loading safari packages…</div>
            ) : (
              <>
                {loading && !initialLoad && (
                  <p role="status" className="mb-4 text-xs text-teal-600/80">Updating results…</p>
                )}
                {fetchError && (
                  <p role="status" className="mb-5 rounded-xl border border-savanna-200 bg-cream-100 px-4 py-3 text-sm text-teal-800">
                    {fetchError}
                  </p>
                )}
                {tours.length === 0 ? (
                  <div className="text-center py-20 bg-cream-50 rounded-2xl border border-dashed border-savanna-300 p-8">
                    <p className="text-teal-800 text-lg">No tours match your current filters.</p>
                    <button onClick={reset} className="btn-primary mt-4">Reset filters</button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-xs text-teal-700 font-medium mb-4">
                      <span>Showing {tours.length} safari package{tours.length !== 1 ? 's' : ''}</span>
                      <span className="hidden sm:inline text-teal-600">Tip: Click "+ Compare" to compare packages side-by-side</span>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {tours.map(t => (
                        <TourCard
                          key={t.id}
                          tour={t}
                          onToggleCompare={handleToggleCompare}
                          isComparing={compareTours.some(ct => ct.id === t.id)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </section>
        </>
      )}

      {/* Floating Tour Comparison Drawer */}
      <TourCompareDrawer
        selectedTours={compareTours}
        onRemove={handleRemoveCompare}
        onClear={handleClearCompare}
      />
    </div>
  );
}
