import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import StarRating from '../components/StarRating.jsx';
import BookingForm from '../components/BookingForm.jsx';
import ImageLightbox from '../components/ImageLightbox.jsx';
import LazySafariMap from '../components/LazySafariMap.jsx';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import { tourJsonLd, JsonLdScript } from '../utils/jsonLd.jsx';
import { tourParkIds } from '../utils/tourParkIds.js';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { estimateTourPricing, maxTravelersFor } from '../../shared-pricing.js';
import { SiteIcon } from '../components/Icons.jsx';

const TIER_LABEL = {
  budget: 'Budget-friendly Camping',
  mid: 'Standard Comfort Lodge',
  luxury: 'Luxury Fly-In Safari',
};

const TAG_ICON = {
  solo: 'compass', couples: 'heart', family: 'users', group: 'users',
  honeymoon: 'gem', photography: 'camera', birding: 'bird',
};

// Pricing rules live in shared-pricing.js so this page, the trip planner and
// the API can never quote three different numbers for the same tour.

// Candidate party sizes offered by the tariff calculator. Each tour filters
// this down to its own bookable maximum (group_size_max).
const TOUR_TRAVELER_OPTIONS = [2, 4, 6];

export default function TourDetailPage() {
  const { slug } = useParams();
  const { formatPrice } = useCurrency();
  const [tour, setTour] = useState(null);
  const [tours, setTours] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState(null);

  // Dynamic pricing calculator state
  const [calcTravelers, setCalcTravelers] = useState(2);
  const [calcSeason, setCalcSeason] = useState('high');

  // Interactive Day-by-Day Accordion: open state (default all open or day 1 open)
  const [openDays, setOpenDays] = useState({});
  const [showStickyBar, setShowStickyBar] = useState(false);
  const heroRef = useRef(null);

  // Must sit above the early returns below: a hook called after a conditional
  // return is skipped on the loading render and then fires on the next one,
  // which throws "Rendered more hooks than during the previous render" and
  // takes the whole tour page (itinerary included) down with it.
  const tourParkIdsMemo = useMemo(() => tourParkIds(tour), [tour]);

  // Inclusions/exclusions come from the catalog per tour. The page previously
  // rendered one hardcoded Northern-Circuit list for every tour, so a Zanzibar
  // or Kilimanjaro itinerary advertised Serengeti/Ngorongoro fees and camps it
  // never visits. There is deliberately NO invented default here: inventing a
  // guarantee (the old fallback asserted travel insurance was included) would
  // put a claim on the page that no catalog record supports. When a tour has no
  // data the panel says so and points at the quote instead.
  const includedItems = useMemo(() => asList(tour?.included), [tour]);
  const hasInclusionData = includedItems.length > 0;

  const excludedItems = useMemo(() => {
    const list = asList(tour?.not_included);
    return list.length ? list : ['International airfare and visas.'];
  }, [tour]);

  useEffect(() => {
    let cancelled = false;
    setTour(null); setError(null);
    const controller = new AbortController();
    fetch(`/api/tours/by-slug/${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        if (!d.ok || !d.tour) { setError('Tour not found.'); return; }
        const t = d.tour;
        setTour(t);
        document.title = `${t.title} | Jebri Safaris`;
        // Don't carry a party size from the previous tour that this one cannot
        // book (e.g. 6 adults selected on the camping tour, then open a tour
        // capped at 2 — the API would reject the booking).
        setCalcTravelers(prev => Math.min(prev, maxTravelersFor(t)));

        // Initialize accordion: day 1 open
        setOpenDays({ 0: true, 1: true });

        // Secondary data (related tours, reviews) is fetched SEPARATELY with its
        // own error handling. It used to be chained off the primary .then(), so a
        // failure there hit the same .catch() and replaced the already-rendered
        // tour page with "Could not load tour."
        fetch('/api/tours', { signal: controller.signal })
          .then(r => r.json())
          .then(catalog => { if (!cancelled && catalog.ok) setTours(catalog.tours); })
          .catch(() => { /* related tours are optional */ });

        fetch('/api/reviews', { signal: controller.signal })
          .then(r => r.json())
          .then(rd => {
            if (!cancelled && rd.ok) setReviews(rd.reviews.filter(r => r.tour_id === t.id));
          })
          .catch(() => { /* reviews are optional */ });
      })
      .catch(error => {
        if (cancelled || error.name === 'AbortError') return;
        setError('Could not load tour.');
      });
    return () => { cancelled = true; controller.abort(); };
  }, [slug]);

  // Monitor scroll for sticky action bar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 480) {
        setShowStickyBar(true);
      } else {
        setShowStickyBar(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleDay = (idx) => {
    setOpenDays(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleAllDays = (expand) => {
    if (!tour?.itinerary) return;
    const newState = {};
    tour.itinerary.forEach((_, i) => {
      newState[i] = expand;
    });
    setOpenDays(newState);
  };

  if (error) {
    return (
      <div className="container-x py-32 text-center">
        <h1 className="font-display text-3xl text-teal-700">{error}</h1>
        <Link to="/tours" className="btn-primary mt-6">Back to all tours</Link>
      </div>
    );
  }
  if (!tour) return <div className="container-x py-32 text-center text-teal-500">Loading safari details…</div>;

  const tourReviews = reviews.filter(r => r.tour_id === tour.id);
  const pricing = estimateTourPricing(tour, calcTravelers, calcSeason);
  const tourMax = maxTravelersFor(tour);
  // TouristTrip structured data. tourJsonLd omits aggregateRating entirely when
  // there are no reviews, so this can never emit a fabricated star rating.
  const tourStructuredData = tourJsonLd(tour, tourReviews);
  // The booking API rejects a party larger than group_size_max, so the
  // estimator must never offer a group size that cannot actually be booked.
  const travelerOptions = TOUR_TRAVELER_OPTIONS.filter(n => n <= tourMax);

  function shareTourWhatsApp() {
    const capNote = calcTravelers > tourMax ? ` Note: this tour is capped at ${tourMax} travellers per 4x4 — please advise on extra vehicles.` : '';
    const text = `Hi Jebri Safaris! I am interested in booking *${tour.title}* (${tour.duration_days} days). Estimated for ${calcTravelers} travelers at approx ${formatPrice(pricing.perPerson)}/person. Could you check date availability and send a customized quote?${capNote} Link: ${window.location.href}`;
    window.open(`https://wa.me/255657253723?text=${encodeURIComponent(text)}`, '_blank');
  }

  function handlePrintItinerary() {
    window.print();
  }

  return (
    <>
      {/* Sticky Bottom Action Bar on Scroll */}
      <div
        className={`fixed bottom-0 inset-x-0 z-40 bg-teal-950/95 backdrop-blur-xl border-t border-teal-800 shadow-2xl transition-all duration-300 transform ${
          showStickyBar ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="container-x py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-terracotta-300 block">
              {tour.duration_days} Days · {tour.location}
            </span>
            <div className="font-display text-xs sm:text-base font-bold text-cream-50 truncate">
              {tour.title}
            </div>
            <div className="text-xs sm:text-sm text-gold-400 font-semibold">
              From {formatPrice(tour.price_usd)} <span className="text-cream-100/70 text-[11px] font-normal">/ person (2 pax base)</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={shareTourWhatsApp}
              className="bg-[#25D366] hover:bg-[#1EBE5D] text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <SiteIcon name="whatsapp" className="text-base" />
              <span className="hidden sm:inline">WhatsApp Us</span>
            </button>
            <a
              href="#booking-sidebar"
              className="btn-primary py-2 sm:py-2.5 px-4 sm:px-5 text-xs font-bold bg-terracotta-500 hover:bg-terracotta-600"
            >
              Book Safari
            </a>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section ref={heroRef} className="relative h-[72vh] min-h-[500px] overflow-hidden">
        <img
          src={tour.hero_image}
          alt={tour.title}
          className="w-full h-full object-cover animate-kenburns"
        />
        <div className="absolute inset-0 bg-hero-vignette mix-blend-multiply opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-teal-950 via-teal-900/50 to-transparent opacity-95" />
        <div className="absolute inset-x-0 bottom-0 container-x pb-12 text-cream-50">
          <div className="flex items-center justify-between gap-4">
            <Link to="/tours" className="text-cream-100/80 text-xs sm:text-sm hover:text-terracotta-300 flex items-center gap-1">
              <span>←</span>
              <span>All 10 Safari Journeys</span>
            </Link>
            <button
              onClick={handlePrintItinerary}
              className="hidden sm:flex items-center gap-1.5 text-xs text-cream-100/80 hover:text-cream-50 bg-white/10 hover:bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 transition"
              title="Print or Save PDF"
            >
              <SiteIcon name="printer" />
              <span>Print / Download PDF</span>
            </button>
          </div>

          <div className="text-xs uppercase tracking-[0.18em] text-terracotta-300 font-semibold mt-4">
            {tour.category} · {tour.location}
            {tour.tier && <> · {TIER_LABEL[tour.tier] || tour.tier}</>}
          </div>

          {/* Supplies the BreadcrumbList JSON-LD for this tour, not just the
              visible trail, so the tour hierarchy is eligible for rich results. */}
          <JsonLdScript data={tourStructuredData} />
          <Breadcrumbs
            items={[
              { label: 'Home', to: '/' },
              { label: 'Tours', to: '/tours' },
              { label: tour.title, to: `/tours/${tour.slug}` },
            ]}
          />

          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl mt-2 max-w-4xl font-bold leading-tight">
            {tour.title}
          </h1>

          {tour.best_for && tour.best_for.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {tour.best_for.map(b => (
                <span key={b} className="inline-flex items-center gap-1.5 text-xs bg-white/20 backdrop-blur-md text-cream-50 border border-white/30 px-3.5 py-1.5 rounded-full shadow-sm">
                  <SiteIcon name={TAG_ICON[b] || 'check'} /> {b}
                </span>
              ))}
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-cream-100/90 items-center text-xs sm:text-sm">
            <span className="font-medium inline-flex items-center gap-1.5"><SiteIcon name="clock" /> {tour.duration_days} {tour.duration_days === 1 ? 'day' : 'days'}</span>
            <span className="inline-flex items-center gap-1.5"><SiteIcon name="users" /> Max {tour.group_size_max || 2} travelers per 4x4</span>
            <span className="font-bold text-gold-400 text-sm sm:text-base inline-flex items-center gap-1.5">
              <SiteIcon name="wallet" /> From {formatPrice(tour.price_usd)} / person
            </span>
            <span className="text-cream-100/75">
              {tour.group_size_max === 6 ? 'Based on 6 pax group load' : 'Double occupancy (2 adults sharing)'}
            </span>
            {tourReviews.length > 0 && (
              <span className="flex items-center gap-2">
                <StarRating rating={Math.round(tourReviews.reduce((s, r) => s + r.rating, 0) / tourReviews.length)} size={14} />
                <span>({tourReviews.length} verified reviews)</span>
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Main Body */}
      <section className="container-x py-16 grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-12">
          {/* Summary */}
          <div className="bg-cream-50 p-6 sm:p-8 rounded-2xl border border-savanna-200/80 shadow-sm">
            <span className="eyebrow text-terracotta-500">Journey Overview</span>
            <p className="text-teal-900 leading-relaxed text-base sm:text-lg mt-2 font-normal">
              {tour.summary}
            </p>
          </div>

          {/* Interactive Day-by-Day Itinerary Accordion */}
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-savanna-200 mb-6">
              <div>
                <span className="eyebrow">The Route</span>
                <h2 className="font-display text-2xl sm:text-3xl text-teal-800 font-bold mt-1">
                  Day-by-Day Itinerary
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => toggleAllDays(true)}
                  className="text-teal-700 hover:text-terracotta-500 px-2 py-1 rounded"
                >
                  Expand all
                </button>
                <span className="text-savanna-300">|</span>
                <button
                  type="button"
                  onClick={() => toggleAllDays(false)}
                  className="text-teal-700 hover:text-terracotta-500 px-2 py-1 rounded"
                >
                  Collapse all
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {tour.itinerary.map((d, idx) => {
                const dayNumber = typeof d.day === 'string'
                  ? Number(d.day.match(/\d+/)?.[0]) || idx + 1
                  : Number.isFinite(Number(d.day)) && Number(d.day) > 0
                    ? d.day
                    : idx + 1;
                const dayLabel = typeof d.day === 'string' ? d.day : `Day ${dayNumber}`;
                const isOpen = openDays[idx];

                return (
                  <div
                    key={idx}
                    className="border border-savanna-200/90 rounded-2xl bg-cream-50 overflow-hidden shadow-sm transition-all duration-200"
                  >
                    <button
                      type="button"
                      onClick={() => toggleDay(idx)}
                      className="w-full text-left p-5 flex items-center justify-between gap-4 hover:bg-cream-100/60 transition-colors"
                      aria-expanded={isOpen}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span className="w-8 h-8 rounded-full bg-teal-800 text-cream-50 text-xs font-bold flex items-center justify-center shrink-0 shadow-sm">
                          {dayNumber}
                        </span>
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-terracotta-500">
                            {dayLabel}
                          </div>
                          <h3 className="font-display text-base sm:text-lg font-bold text-teal-900 truncate">
                            {d.title}
                          </h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-teal-600 hidden sm:inline">
                          {isOpen ? 'Close' : 'Details'}
                        </span>
                        <svg
                          className={`w-5 h-5 text-teal-700 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 border-t border-savanna-100/70 text-sm text-teal-800 animate-fade-up">
                        <p className="leading-relaxed mt-2 text-teal-800/90">
                          {d.detail}
                        </p>

                        {/*
                          Meal/drive badges used to be hardcoded here and
                          rendered on every day. That made Zanzibar leisure days
                          and Kilimanjaro climb days advertise "Unlimited 4x4
                          Game Drives", contradicting the itinerary text and the
                          per-tour `included` list. They are only shown when the
                          day's own record supplies them.
                        */}
                        {asList(d.included).length > 0 && (
                          <div className="mt-4 pt-3 border-t border-dashed border-savanna-200/60 flex flex-wrap gap-4 text-xs text-teal-700">
                            {asList(d.included).map(item => (
                              <span
                                key={item}
                                className="inline-flex items-center gap-1 font-medium bg-cream-100 px-2.5 py-1 rounded-full"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Safari Route Map */}
          <div>
            <span className="eyebrow">Circuit Geography</span>
            <h2 className="font-display text-2xl text-teal-800 font-bold mt-1 mb-4">
              Tour Circuit & Ecosystem Map
            </h2>
            <LazySafariMap
              title={`${tour.title} — Route & Highlights`}
              parkIds={tourParkIdsMemo}
            />
          </div>

          {/* What's Included vs Excluded — Side by Side (Standard Operating Baselines) */}
          <div>
            <span className="eyebrow">Transparent Value</span>
            <h2 className="font-display text-2xl text-teal-800 font-bold mt-1 mb-4">
              Inclusions & Exclusions Breakdown
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-sage-50/70 border border-sage-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-sage-600 text-white flex items-center justify-center text-xs font-bold"><SiteIcon name="check" /></span>
                  <h3 className="font-display text-lg font-bold text-teal-900">What’s Included</h3>
                </div>
                {hasInclusionData ? (
                  <ul className="space-y-2.5 text-xs sm:text-sm text-teal-900">
                    {includedItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <SiteIcon name="check" className="mt-0.5 text-sage-600" />
                        <InclusionLine text={item} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs sm:text-sm text-teal-800/80 leading-relaxed">
                    This itinerary’s exact inclusions depend on your room type and
                    group size, so we confirm them in writing before you pay.
                  </p>
                )}
              </div>

              <div className="bg-cream-100/70 border border-savanna-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-terracotta-400 text-white flex items-center justify-center text-xs font-bold"><SiteIcon name="close" /></span>
                  <h3 className="font-display text-lg font-bold text-teal-900">Standard Exclusions</h3>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-teal-800">
                  {excludedItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <SiteIcon name="close" className="mt-0.5 text-terracotta-500" />
                      <InclusionLine text={item} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Gallery */}
          {tour.gallery?.length > 0 && (
            <div>
              <span className="eyebrow">Visual Preview</span>
              <h2 className="font-display text-2xl text-teal-800 font-bold mt-1 mb-4">
                Savanna & Camp Gallery
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {tour.gallery.map((src, i) => (
                  <ImageLightbox
                    key={i}
                    src={src}
                    alt={`${tour.title} gallery image ${i + 1}`}
                    className="rounded-xl h-44 w-full object-cover hover:scale-105 transition-transform duration-500"
                    buttonClassName="rounded-xl overflow-hidden shadow-sm"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          {tourReviews.length > 0 && (
            <div>
              <span className="eyebrow">Verified Guests</span>
              <h2 className="font-display text-2xl text-teal-800 font-bold mt-1 mb-4">
                Stories from Travelers on this Journey
              </h2>
              <div className="space-y-4">
                {tourReviews.map(r => (
                  <div key={r.id} className="card p-6">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-teal-800">{r.author}</div>
                      <StarRating rating={r.rating} size={14} />
                    </div>
                    <p className="mt-3 text-teal-700/90 leading-relaxed text-sm">“{r.body}”</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Dynamic Pricing Calculator + Booking Form */}
        <aside id="booking-sidebar" className="lg:col-span-4 lg:sticky lg:top-24 lg:self-start space-y-6">
          {/* Dynamic Group Size & Season Price Calculator */}
          <div className="bg-cream-50 border-2 border-terracotta-400/30 rounded-2xl p-5 sm:p-6 shadow-card">
            <span className="text-[10px] uppercase font-bold tracking-wider text-terracotta-500">
              Live Tariff Calculator
            </span>
            <h3 className="font-display text-xl font-bold text-teal-900 mt-1">
              Estimate Your Safari Cost
            </h3>

            <div className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-teal-800 mb-1">
                  Number of Travelers:
                </label>
                <div className={`grid gap-2 ${travelerOptions.length === 1 ? 'grid-cols-1' : 'grid-cols-3'}`}>
                  {travelerOptions.map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCalcTravelers(num)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        calcTravelers === num
                          ? 'bg-teal-800 text-cream-50 border-teal-800 shadow-sm'
                          : 'bg-cream-100 text-teal-800 border-savanna-200 hover:border-terracotta-300'
                      }`}
                    >
                      {num} Adult{num !== 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
                {travelerOptions.length === 1 && (
                  <p className="text-[11px] text-teal-600/80 mt-1.5">
                    This itinerary runs as a private 4x4 for up to {tourMax} travellers. Travelling with more?{' '}
                    <Link to="/contact" className="underline font-semibold">Ask us to add a second vehicle</Link>.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-teal-800 mb-1">
                  Travel Season:
                </label>
                <select
                  value={calcSeason}
                  onChange={(e) => setCalcSeason(e.target.value)}
                  className="w-full bg-cream-100 border border-savanna-200 rounded-xl px-3 py-2 text-xs font-medium text-teal-900 focus:outline-none focus:ring-1 focus:ring-terracotta-400 cursor-pointer"
                >
                  <option value="high">High Season (Jan–Mar, Jun)</option>
                  <option value="peak">Peak Season (Jul–Oct, Festive Dec/Jan)</option>
                  <option value="green">Green Season (Apr–May, Nov) - Low Rates</option>
                </select>
              </div>

              {/* Calculated Output */}
              <div className="p-3.5 bg-linen rounded-xl border border-savanna-200/80 mt-4 text-center">
                <div className="text-[11px] text-teal-600 font-medium">
                  {pricing.seasonLabel} · {calcTravelers} Travelers
                </div>
                <div className="text-2xl sm:text-3xl font-display font-bold text-terracotta-500 mt-1">
                  {formatPrice(pricing.perPerson)}
                  <span className="text-xs text-teal-700 font-normal font-sans ml-1">/ person</span>
                </div>
                <div className="text-xs text-teal-700 mt-1 font-semibold">
                  Estimated Total: {formatPrice(pricing.total)}
                </div>
                <div className="text-[10px] text-teal-600 mt-2 leading-tight">
                  {/* No tariff claim in this footnote. The old text asserted "18% VAT, and
                    travel insurance included", but no tour in tourCatalog lists
                    insurance in `included` and three omit VAT, so it
                    contradicted the inclusions panel directly above. The per-tour
                    list is the single source of truth. */}
                  {tourMax >= 6
                    ? `Group-load pricing: the $${tour.price_usd} rate assumes a full ${tourMax}-person load, so smaller groups pay more per head.`
                    : 'Double occupancy per person sharing. See “What’s Included” above for this tour’s full tariff.'}
                </div>
              </div>
            </div>
          </div>

          {/* Instant WhatsApp Inquiry Button */}
          <button
            type="button"
            onClick={shareTourWhatsApp}
            className="w-full bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold py-3.5 px-4 rounded-xl text-center text-sm transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
            </svg>
            <span>Ask Availability on WhatsApp</span>
          </button>

          {/* Booking Form Card */}
          <BookingForm tours={tours} compact defaultTourId={tour.id} source="tour-inquiry" />

          {/* Trust Guarantees */}
          <div className="bg-cream-100 rounded-2xl p-5 text-xs text-teal-800/80 space-y-2.5 border border-savanna-200">
            <div className="flex items-center gap-2">
              <SiteIcon name="message" className="text-base text-teal-600" />
              <span>Local Arusha team replies within 24 hours</span>
            </div>
            <div className="flex items-center gap-2">
              <SiteIcon name="lock" className="text-base text-teal-600" />
              <span>Zero payment required until itinerary is finalized</span>
            </div>
          </div>
        </aside>
      </section>
    </>
  );
}

// Catalog inclusion/exclusion fields arrive either as JSON arrays or, depending
// on how the row was written, as a JSON-encoded string. Normalise both, and
// tolerate plain strings so a hand-edited row cannot blank the page.
function asList(value) {
  if (!value) return [];
  let parsed = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      return value.split('\n').map(s => s.replace(/^[-\u2022\s]+/, '').trim()).filter(Boolean);
    }
  }
  if (Array.isArray(parsed)) return parsed.map(String).map(s => s.trim()).filter(Boolean);
  return [];
}

// Entries are written as "Label: detail". Render the label in bold when a colon
// is present, otherwise show the whole line as plain text.
function InclusionLine({ text }) {
  const idx = String(text).indexOf(':');
  if (idx === -1) return <span>{text}</span>;
  const label = text.slice(0, idx).trim();
  const detail = text.slice(idx + 1).trim();
  return (
    <span>
      <strong>{label}:</strong> {detail}
    </span>
  );
}