import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TourCard from '../components/TourCard.jsx';
import TrustStrip from '../components/TrustStrip.jsx';
import StarRating from '../components/StarRating.jsx';
import LazySafariMap from '../components/LazySafariMap.jsx';
import MigrationCalendar from '../components/MigrationCalendar.jsx';
import DreamSafariQuiz from '../components/DreamSafariQuiz.jsx';
import HeroQuickSearch from '../components/HeroQuickSearch.jsx';
import BigFiveTracker from '../components/BigFiveTracker.jsx';
import LodgeTierVisualizer from '../components/LodgeTierVisualizer.jsx';
import MeetTheTeam from '../components/MeetTheTeam.jsx';
import { fallbackFeaturedTours } from '../data/fallbackTours.js';
import { SiteIcon } from '../components/Icons.jsx';

const heroSlides = [
  {
    image: 'https://images.unsplash.com/photo-1756475471671-48813cf5ea5b?auto=format&fit=crop&w=2000&q=80',
    title: 'Experience the wild.',
    italic: 'Unforgettable East African safaris.',
    subtitle: 'Wildlife safaris, cultural journeys, and conservation-led experiences across Tanzania and Kenya.',
    badge: 'Serengeti & Ngorongoro',
    badgeIcon: 'paw',
  },
  {
    image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=2000&q=80',
    title: 'Witness the Migration.',
    italic: '1.5 million animals in motion.',
    subtitle: 'From thunderous Mara River crossings to newborn calves in the southern Serengeti plains.',
    badge: 'The Great Migration',
    badgeIcon: 'paw',
  },
  {
    image: 'https://images.unsplash.com/photo-1547970810-dc1eac37d174?auto=format&fit=crop&w=2000&q=80',
    title: 'Giants beneath Baobabs.',
    italic: 'Tarangire elephant sanctuary.',
    subtitle: 'Hundreds of elephants wandering ancient baobab riverbeds and golden acacia savannas.',
    badge: 'Tarangire Baobabs',
    badgeIcon: 'tree',
  },
];

export default function HomePage() {
  const [tours, setTours] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState({ tours: true, reviews: true });
  const [currentSlide, setCurrentSlide] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);

  useEffect(() => {
    document.title = 'Jebri Safaris | East African Adventure & Tours';
    let mounted = true;

    const loadTours = fetch('/api/tours')
      .then(r => r.json())
      .then(d => {
        if (!mounted) return;
        if (d?.ok && Array.isArray(d.tours)) {
          const featuredTours = d.tours.filter(t => t.featured);
          if (featuredTours.length > 0) {
            setTours(featuredTours);
            return;
          }
        }
        setTours(fallbackFeaturedTours);
      })
      .catch(() => {
        if (mounted) setTours(fallbackFeaturedTours);
      });

    const loadReviews = fetch('/api/reviews')
      .then(r => r.json())
      .then(d => {
        if (mounted && d.ok) setReviews(d.reviews.slice(0, 3));
      })
      .catch((err) => {
        if (mounted) console.error('Failed to load reviews:', err);
      });

    Promise.allSettled([loadTours, loadReviews]).finally(() => {
      if (mounted) setLoading({ tours: false, reviews: false });
    });

    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (carouselPaused) return undefined;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    }, 7000);

    return () => {
      clearInterval(interval);
    };
  }, [carouselPaused]);

  function moveSlide(direction) {
    setCurrentSlide(prev => (prev + direction + heroSlides.length) % heroSlides.length);
    setCarouselPaused(true);
  }

  const slide = heroSlides[currentSlide];

  return (
    <>
      {/* Hero with dynamic slide carousel */}
      <section
        className="relative min-h-[720px] lg:h-[88svh] lg:max-h-[920px] overflow-hidden flex flex-col justify-between pb-8 sm:pb-12"
        aria-roledescription="carousel"
        aria-label="Featured safari journeys"
        onMouseEnter={() => setCarouselPaused(true)}
        onMouseLeave={() => setCarouselPaused(false)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') moveSlide(-1);
          if (event.key === 'ArrowRight') moveSlide(1);
        }}
        tabIndex={0}
      >
        {heroSlides.map((s, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              currentSlide === i ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
            aria-hidden="true"
          >
            <img
              src={s.image}
              alt=""
              loading={i === 0 ? 'eager' : 'lazy'}
              // React 18 only recognises the lowercase DOM attribute name; the
              // camelCase spelling logs an unknown-prop warning.
              fetchpriority={i === 0 ? 'high' : 'auto'}
              className={`absolute inset-0 h-full w-full object-cover ${currentSlide === i ? 'animate-kenburns' : ''}`}
            />
            <div className="absolute inset-0 bg-hero-vignette mix-blend-multiply opacity-90" />
            <div className="absolute inset-0 bg-hero-overlay opacity-60" />
          </div>
        ))}

        {/* Hero content */}
        <div className="relative z-20 container-x pt-14 sm:pt-20 text-cream-50">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <span className="eyebrow text-terracotta-300 drop-shadow-md">Adventure & Tours · East Africa</span>
            <span className="inline-flex items-center gap-1.5 text-xs text-cream-50/90 font-medium">
              <SiteIcon name={slide.badgeIcon} className="text-terracotta-300" />
              {slide.badge}
            </span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl mt-4 max-w-4xl leading-[1.05] transition-all duration-700 animate-slide-up drop-shadow-lg" style={{ animationDelay: '200ms' }}>
            {slide.title}
            <span className="block font-accent italic text-terracotta-300 font-normal">{slide.italic}</span>
          </h1>
          <p className="mt-4 max-w-xl text-cream-50/90 text-base sm:text-lg font-light leading-relaxed animate-slide-up transition-all duration-700 drop-shadow" style={{ animationDelay: '300ms' }}>
            {slide.subtitle}
          </p>

          <div className="mt-6 flex flex-wrap gap-3 animate-slide-up" style={{ animationDelay: '400ms' }}>
            <Link to="/tours" className="btn-primary text-sm sm:text-base px-6 py-3 bg-terracotta-500 hover:bg-terracotta-600 border border-terracotta-400">
              Explore 10 Safari Packages
            </Link>
            <Link to="/booking" className="btn-outline text-sm sm:text-base px-6 py-3 backdrop-blur-sm bg-white/10 hover:bg-white/20 border-white/40">
              Build Your Custom Trip
            </Link>
          </div>

          {/* Floating Quick Search Bar right inside hero */}
          <div className="relative z-30 animate-slide-up" style={{ animationDelay: '500ms' }}>
            <HeroQuickSearch />
          </div>
        </div>

        {/* Carousel controls & scroll cue */}
        <div className="relative z-20 container-x flex items-center justify-between mt-4">
          <div className="text-xs text-cream-50/75 font-medium hidden sm:block">
            Tanzania <span className="mx-2 text-terracotta-300">·</span> Kenya <span className="mx-2 text-terracotta-300">·</span> Double Occupancy & Private 4x4
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => moveSlide(-1)} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-black/30 text-cream-50 backdrop-blur transition hover:bg-white/20" aria-label="Previous slide">←</button>
            {heroSlides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => { setCurrentSlide(idx); setCarouselPaused(true); }}
                className={`relative overflow-hidden h-1.5 rounded-full transition-all duration-300 ${
                  currentSlide === idx ? 'w-10 bg-cream-50/20' : 'w-3.5 bg-cream-50/40 hover:bg-cream-50/70'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              >
                {currentSlide === idx && (
                  <span className="absolute top-0 left-0 h-full bg-terracotta-400" style={{ width: '100%', animation: 'fillProgress 7s linear forwards' }} />
                )}
              </button>
            ))}
            <button type="button" onClick={() => moveSlide(1)} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-black/30 text-cream-50 backdrop-blur transition hover:bg-white/20" aria-label="Next slide">→</button>
            <button type="button" onClick={() => setCarouselPaused(prev => !prev)} className="ml-1 flex h-8 min-w-8 items-center justify-center rounded-full border border-white/30 bg-black/30 px-2 text-xs text-cream-50 backdrop-blur transition hover:bg-white/20" aria-label={carouselPaused ? 'Play slides' : 'Pause slides'}>{carouselPaused ? '▶' : 'Ⅱ'}</button>
            <style>{`@keyframes fillProgress { from { width: 0%; } to { width: 100%; } }`}</style>
          </div>
        </div>
      </section>

      <TrustStrip />

      {/* Featured Tours */}
      <section className="container-x py-20 sm:py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="eyebrow">Signature Journeys</span>
          <h2 className="section-title mt-3">Featured Safari Itineraries</h2>
          <p className="mt-4 text-teal-700/80">
            Backed by guaranteed window seats in private 4x4 Land Cruisers, experienced local naturalist guides, and all national park permits included.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading.tours ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div key={`tour-skeleton-${idx}`} className="rounded-2xl border border-cream-200 bg-cream-50 p-5 shadow-card animate-pulse">
                <div className="h-44 rounded-xl bg-cream-200" />
                <div className="mt-4 h-4 w-24 rounded bg-cream-200" />
                <div className="mt-3 h-6 w-3/4 rounded bg-cream-200" />
                <div className="mt-2 h-4 w-full rounded bg-cream-200" />
                <div className="mt-2 h-4 w-5/6 rounded bg-cream-200" />
              </div>
            ))
          ) : tours.length > 0 ? (
            tours.map(t => <TourCard key={t.id} tour={t} />)
          ) : (
            <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-dashed border-teal-200 bg-cream-50 p-8 text-center">
              <h3 className="font-display text-2xl text-teal-700">Featured tours are being updated</h3>
              <p className="mt-2 text-teal-700/70">Browse the full catalog and we’ll have fresh picks ready soon.</p>
              <Link to="/tours" className="btn-primary mt-5 inline-flex">View all tours</Link>
            </div>
          )}
        </div>
        <div className="text-center mt-12">
          <Link to="/tours" className="btn-primary text-base px-8 py-3.5">
            View All 10 Safari Journeys (from $1,250) →
          </Link>
        </div>
      </section>

      {/* Wildlife Sighting Guide: Big 5 & Predator Probability Tracker */}
      <section className="container-x py-8 sm:py-12">
        <BigFiveTracker />
      </section>

      <DreamSafariQuiz />

      {/* Accommodation Tiers: Budget vs Mid-Range vs Luxury */}
      <section className="container-x py-12 sm:py-16">
        <LodgeTierVisualizer />
      </section>

      {/* Interactive Safari Circuit Map Explorer */}
      <section className="container-x py-12">
        <LazySafariMap />
      </section>

      {/* The Great Migration & Wildlife Calendar Explorer */}
      <section className="container-x py-16">
        <MigrationCalendar />
      </section>

      {/* Meet Your Safari Guides & Fleet Showcase */}
      <MeetTheTeam />

      {/* Activities teaser */}
      <section className="bg-cream-100 py-20">
        <div className="container-x max-w-4xl">
          <div>
            <span className="eyebrow">Mix & match</span>
            <h2 className="section-title mt-3">Add a once-in-a-lifetime experience</h2>
            <p className="mt-4 text-teal-700/80 leading-relaxed">
              Hot-air balloon at dawn over the Serengeti with a champagne bush breakfast ($599 net). Walking safari with Maasai trackers. Snorkeling in Zanzibar coral reefs.
            </p>
            <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-teal-800 text-sm font-medium">
              {[
                ['balloon', 'Hot-air balloon flights (~$599/person)'],
                ['plane', 'Light aircraft scenic transfers'],
                ['footprints', 'Guided walking safaris in Tarangire'],
                ['moon', 'Night game drives in Lake Manyara'],
                ['tent', 'Authentic Maasai boma visits'],
                ['sailboat', 'Zanzibar sunset Dhow sailing'],
                ['utensils', 'Bush dinners & sundowners'],
                ['flower', 'Savanna spa & wellness'],
              ].map(([icon, label]) => (
                <li key={label} className="flex items-start gap-2">
                  <SiteIcon name={icon} className="mt-0.5 text-terracotta-500" />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/activities" className="btn-primary inline-flex">Browse all activities</Link>
              <Link to="/gallery" className="btn-ghost inline-flex border border-savanna-300">Explore the photo gallery</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="bg-teal-900 text-cream-100 py-20 sm:py-24">
        <div className="container-x">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="eyebrow text-terracotta-300">Why travelers choose us</span>
            <h2 className="section-title mt-3 text-cream-50">Safari, the way it should be.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: 'compass', t: 'Local Tanzanian guides', d: 'Born-and-raised local guides who read tracks and savanna scent like an open book.' },
              { icon: 'leaf', t: 'Conservation-led', d: 'Community-first ethics supporting local schools, anti-poaching, and village bomas.' },
              { icon: 'star', t: 'No Hidden Park Fees', d: 'All mandatory TANAPA, NCAA Crater, and concession fees pre-calculated in pricing.' },
              { icon: 'shield', t: 'Travel insurance included', d: 'Comprehensive travel insurance on every package, plus AMREF Flying Doctors emergency medical evacuation.' },
            ].map(f => (
              <div key={f.t} className="bg-cream-50/5 backdrop-blur border border-cream-50/10 rounded-2xl p-6 hover:bg-cream-50/10 transition shadow-sm">
                <SiteIcon name={f.icon} className="text-3xl mb-3 text-terracotta-300" />
                <h3 className="font-display text-xl mb-2 text-cream-50">{f.t}</h3>
                <p className="text-cream-100/80 text-sm leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container-x py-20 sm:py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="eyebrow">Stories from the field</span>
          <h2 className="section-title mt-3">What our guests say</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {loading.reviews ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div key={`review-skeleton-${idx}`} className="card p-7 animate-pulse">
                <div className="h-4 w-24 rounded bg-cream-200" />
                <div className="mt-4 h-4 w-full rounded bg-cream-200" />
                <div className="mt-2 h-4 w-5/6 rounded bg-cream-200" />
                <div className="mt-2 h-4 w-4/6 rounded bg-cream-200" />
                <div className="mt-5 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-cream-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 rounded bg-cream-200" />
                    <div className="h-3 w-20 rounded bg-cream-200" />
                  </div>
                </div>
              </div>
            ))
          ) : reviews.length > 0 ? (
            reviews.map(r => (
              <div key={r.id} className="card p-7">
                <StarRating rating={r.rating} />
                <p className="mt-4 text-teal-800 leading-relaxed text-sm sm:text-base">“{r.body}”</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-terracotta-100 text-terracotta-600 flex items-center justify-center font-bold">
                    {r.author.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-teal-900">{r.author}</div>
                    <div className="text-xs text-teal-600">Verified guest · {r.source}</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="md:col-span-3 rounded-2xl border border-dashed border-teal-200 bg-cream-50 p-8 text-center">
              <h3 className="font-display text-2xl text-teal-700">Stories will appear here soon</h3>
              <p className="mt-2 text-teal-700/70">We’re adding fresh guest feedback and travel highlights to this section.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA strip */}
      <section className="bg-sunrise text-cream-50 py-16 sm:py-20 shadow-inner">
        <div className="container-x text-center">
          <h2 className="font-display text-3xl sm:text-5xl font-bold">The savanna is calling. Ready to answer?</h2>
          <p className="mt-4 text-cream-50/95 max-w-2xl mx-auto text-base sm:text-lg font-light leading-relaxed">
            Tell us your preferred dates and group size. We'll send you a customized itemized safari quote within 24 hours.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/booking" className="bg-teal-900 hover:bg-teal-950 text-cream-50 rounded-full px-8 py-4 font-bold shadow-lg transition">
              Get a Custom Safari Quote
            </Link>
            <a
              href="https://wa.me/255657253723?text=Hi%20Jebri%20Safaris,%20I%20have%20a%20question%20about%20your%20tours"
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-cream-50 text-cream-50 hover:bg-cream-50 hover:text-teal-900 rounded-full px-8 py-4 font-bold transition flex items-center gap-2"
            >
              <SiteIcon name="whatsapp" className="text-lg" />
              <span>Ask on WhatsApp</span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
