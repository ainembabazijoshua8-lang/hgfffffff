import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import SiteSearch from './SiteSearch.jsx';
import CurrencySelector from './CurrencySelector.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { fallbackTours as TOUR_CATALOG } from '../data/fallbackTours.js';
import { ArrowRightIcon, CalendarIcon, PhoneIcon, StarIcon, WhatsAppIcon } from './Icons.jsx';

const nav = [
  { to: '/', label: 'Home' },
  { to: '/tours', label: 'Tours', hasMega: true },
  { to: '/activities', label: 'Activities' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/about', label: 'About' },
  { to: '/blog', label: 'Journal' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' },
];

// The circuit grouping is editorial (the catalog has no `circuit` field), but
// the tour names and prices inside each group are resolved from the catalog at
// render time. They used to be hardcoded strings, so a price_usd change updated
// the cards, filters and detail page while the header kept advertising the old
// figure — and the header also ignored formatPrice, so it showed "$" after a
// currency switch.
const TOURS_BY_SLUG = new Map(TOUR_CATALOG.map(t => [t.slug, t]));

const CIRCUITS = [
  {
    title: 'Northern Circuit',
    tag: 'Iconic Wildlife & Big 5',
    description: 'Serengeti, Ngorongoro Crater, Tarangire & Manyara',
    tourSlugs: [
      'serengeti-ngorongoro-express',
      'classic-northern-circuit-5-day',
      'wildlife-culture-safari-7-day',
      'budget-group-camping-safari-6-day',
    ],
  },
  {
    title: 'Bush & Beach / Luxury Fly-In',
    tag: 'Savanna to Indian Ocean',
    description: 'Direct flights to pristine camps & white sand shores',
    tourSlugs: [
      'serengeti-zanzibar-escape-7-day',
      'luxury-fly-in-safari-8-day',
      'northern-circuit-beach-10-day',
      'honeymoon-safari-beach-10-day',
    ],
  },
  {
    title: 'Southern Wilderness & Kilimanjaro',
    tag: 'Off-the-Beaten-Path & Peaks',
    description: 'Uncrowded untamed reserves & Roof of Africa',
    tourSlugs: ['southern-circuit-untamed-9-day', 'ultimate-kili-safari-14-day'],
  },
];

function MenuButton({ open, onToggle }) {
  return (
    <button
      onClick={onToggle}
      aria-label="Toggle menu"
      aria-expanded={open}
      aria-controls="mobile-navigation"
      className="p-2 text-teal-700 hover:text-terracotta-400 transition rounded-xl hover:bg-cream-100"
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        {open ? (
          <path d="M6 6l12 12M18 6l-12 12" />
        ) : (
          <>
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </>
        )}
      </svg>
    </button>
  );
}

export default function Header() {
  const { formatPrice } = useCurrency();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileMegaOpen, setMobileMegaOpen] = useState(false);
  const [stats, setStats] = useState({ reviews: 0, avg_rating: null });
  const megaTimeoutRef = useRef(null);
  const loc = useLocation();

  useEffect(() => {
    setOpen(false);
    setMegaOpen(false);
    setMobileMegaOpen(false);
  }, [loc.pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setMegaOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 15);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Real review data replaces the old hardcoded "4.9/5 (120+ Reviews)".
  // The claim renders only once approved reviews exist, so the header can never
  // advertise a rating the database cannot back up.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/stats')
      .then(r => r.json())
      .then(d => { if (!cancelled && d.ok) setStats(d.stats); })
      .catch(err => { if (!cancelled) console.error('Header: failed to load stats:', err); });
    return () => { cancelled = true; };
  }, []);

  const handleMouseEnter = () => {
    if (megaTimeoutRef.current) clearTimeout(megaTimeoutRef.current);
    setMegaOpen(true);
  };

  const handleMouseLeave = () => {
    megaTimeoutRef.current = setTimeout(() => {
      setMegaOpen(false);
    }, 200);
  };

  return (
    <>
      {/* Top Trust & Specialist Contact Bar */}
      <div className="bg-teal-900 text-cream-100 text-[11px] sm:text-xs py-1.5 border-b border-teal-800/80 relative z-50">
        <div className="container-x flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <div className="flex items-center gap-2 tracking-wide font-medium">
            <CalendarIcon className="text-terracotta-300 text-[1.1em]" />
            <span>2026/2027 Migration Bookings Open</span>
            {stats.reviews > 0 && stats.avg_rating ? (
              <>
                <span className="hidden sm:inline text-teal-600">·</span>
                <span className="hidden sm:inline-flex items-center gap-1 text-gold-400">
                  <StarIcon /> {stats.avg_rating}/5 Rating ({stats.reviews} Review{stats.reviews === 1 ? '' : 's'})
                </span>
              </>
            ) : null}
          </div>
          <div className="flex items-center gap-4 text-cream-100/90 font-medium">
            <a
              href="https://wa.me/255657253723?text=Hi%20Jebri%20Safaris,%20I%20would%20like%20to%20plan%20a%20safari"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-terracotta-300 transition-colors flex items-center gap-1.5"
            >
              <WhatsAppIcon className="text-[1.05em]" />
              <span>WhatsApp Arusha</span>
            </a>
            <span className="hidden md:inline text-teal-600">·</span>
            <a
              href="tel:+255657253723"
              className="hover:text-terracotta-300 transition-colors hidden md:inline-flex items-center gap-1.5"
            >
              <PhoneIcon className="text-[1.05em]" />
              +255 657 253 723
            </a>
          </div>
        </div>
      </div>

      <header
        className={`sticky top-0 z-40 transition-all duration-500 ease-out ${
          scrolled
            ? 'bg-linen/90 backdrop-blur-xl shadow-card border-b border-savanna-200/60 py-0'
            : 'bg-linen/60 backdrop-blur-md border-b border-transparent py-1'
        }`}
      >
        <div className="container-x grid h-20 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 sm:gap-4">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-2.5 sm:gap-3 group select-none"
            aria-label="Jebri Safaris — Home"
          >
            <img
              src="/assets/images/logo.jpg"
              alt="Jebri Safaris"
              width={52}
              height={52}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-terracotta-400/20 group-hover:ring-terracotta-400/80 group-hover:shadow-glow transition-all duration-300 shrink-0 shadow-sm"
              loading="eager"
            />
            <div className="hidden min-w-0 sm:flex flex-col justify-center leading-tight">
              <div className="font-display text-base 2xl:text-lg font-bold text-teal-800 tracking-tight whitespace-nowrap">
                Jebri Safaris
              </div>
            </div>
          </Link>

          <nav className="hidden min-w-0 xl:flex items-center justify-end gap-0.5">
            {nav.map(item => {
              if (item.hasMega) {
                return (
                  <div
                    key={item.to}
                    className="relative"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        `group relative px-2.5 2xl:px-3.5 py-1.5 rounded-full text-xs 2xl:text-sm font-medium whitespace-nowrap transition-colors duration-300 flex items-center gap-1 ${
                          isActive || megaOpen
                            ? 'text-teal-900 font-semibold'
                            : 'text-teal-700 hover:text-terracotta-500'
                        }`
                      }
                    >
                      <span>{item.label}</span>
                      <svg
                        className={`w-3 h-3 transition-transform duration-300 ${megaOpen ? 'rotate-180 text-terracotta-400' : 'text-teal-500'}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                      {megaOpen && (
                        <span className="absolute inset-0 bg-sage-100/60 rounded-full -z-10" />
                      )}
                    </NavLink>

                    {/* Desktop Mega Menu Dropdown */}
                    {megaOpen && (
                      <div
                        className="absolute left-1/2 -translate-x-1/2 top-full pt-2 w-[780px] z-50 animate-fade-up"
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className="bg-cream-50/95 backdrop-blur-2xl rounded-2xl border border-savanna-200/80 shadow-2xl p-6 overflow-hidden">
                          <div className="grid grid-cols-3 gap-6">
                            {CIRCUITS.map((c) => (
                              <div key={c.title} className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-terracotta-500">
                                  {c.tag}
                                </span>
                                <h4 className="font-display text-base font-bold text-teal-800 mt-1 mb-1">
                                  {c.title}
                                </h4>
                                <p className="text-[11px] text-teal-600/80 mb-3 leading-snug">
                                  {c.description}
                                </p>
                                <div className="flex flex-col gap-2 mt-auto">
                                  {c.tourSlugs.map((slug) => {
                                    const t = TOURS_BY_SLUG.get(slug);
                                    if (!t) return null;
                                    return (
                                      <Link
                                        key={slug}
                                        to={`/tours/${slug}`}
                                        className="group/item flex flex-col p-2 rounded-xl hover:bg-cream-100 transition-all border border-transparent hover:border-savanna-200"
                                        onClick={() => setMegaOpen(false)}
                                      >
                                        <span className="text-xs font-semibold text-teal-800 group-hover/item:text-terracotta-500 transition-colors line-clamp-1">
                                          {t.title}
                                        </span>
                                        <span className="text-[11px] text-terracotta-400 font-medium">
                                          From {formatPrice(t.price_usd)} / person
                                        </span>
                                      </Link>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-6 pt-4 border-t border-savanna-200 flex items-center justify-between bg-cream-100/60 -mx-6 -mb-6 px-6 py-3">
                            <span className="text-xs text-teal-700 font-medium">
                              All 10 packages backed by experienced local guides & private 4x4 Land Cruisers.
                            </span>
                            <Link
                              to="/tours"
                              onClick={() => setMegaOpen(false)}
                              className="text-xs font-bold text-terracotta-500 hover:text-teal-800 transition flex items-center gap-1"
                            >
                              <span>Explore full catalog</span>
                              <ArrowRightIcon />
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `group relative px-2.5 2xl:px-3.5 py-1.5 rounded-full text-xs 2xl:text-sm font-medium whitespace-nowrap transition-colors duration-300 overflow-hidden ${
                      isActive
                        ? 'text-teal-900 font-semibold'
                        : 'text-teal-700 hover:text-terracotta-500'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className="relative z-10">{item.label}</span>
                      {isActive && (
                        <span className="absolute inset-0 bg-sage-100/80 rounded-full -z-10" />
                      )}
                      {!isActive && (
                        <span className="absolute bottom-1 left-3 right-3 h-[2px] bg-terracotta-400/40 scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 ease-out rounded-full" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="flex items-center justify-end gap-2">
            <CurrencySelector />
            <div className="hidden lg:block">
              <SiteSearch />
            </div>
            <Link
              to="/booking#trip-planner"
              className="btn-primary animate-glow-pulse hidden xl:inline-flex py-2 2xl:py-2.5 px-3.5 2xl:px-5 text-xs 2xl:text-sm font-semibold shrink-0 whitespace-nowrap shadow-sm"
            >
              Safari Guide & Trip Planner
            </Link>
            <div className="xl:hidden">
              <MenuButton open={open} onToggle={() => setOpen(o => !o)} />
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {open && (
          <div id="mobile-navigation" className="xl:hidden bg-cream-50 border-t border-savanna-200 shadow-card animate-fade-up max-h-[85vh] overflow-y-auto">
            <div className="container-x py-4 flex flex-col gap-1">
              <div className="mb-3 lg:hidden">
                <SiteSearch isMobile={true} />
              </div>

              {nav.map(item => {
                if (item.hasMega) {
                  return (
                    <div key={item.to} className="flex flex-col">
                      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl hover:bg-cream-100 text-teal-700">
                        <NavLink
                          to={item.to}
                          className="text-sm font-medium flex-1"
                          onClick={() => setOpen(false)}
                        >
                          {item.label}
                        </NavLink>
                        <button
                          type="button"
                          onClick={() => setMobileMegaOpen(prev => !prev)}
                          className="p-1 text-teal-600 hover:text-terracotta-500"
                          aria-label="Expand safari circuits"
                        >
                          <svg
                            className={`w-4 h-4 transition-transform ${mobileMegaOpen ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      {mobileMegaOpen && (
                        <div className="pl-4 pr-2 py-2 flex flex-col gap-3 bg-cream-100/60 rounded-xl mb-2">
                          {CIRCUITS.map((c) => (
                            <div key={c.title} className="flex flex-col gap-1">
                              <span className="text-[11px] font-bold text-terracotta-500 uppercase tracking-wider">
                                {c.title}
                              </span>
                              {c.tourSlugs.map((slug) => {
                                const t = TOURS_BY_SLUG.get(slug);
                                if (!t) return null;
                                return (
                                  <Link
                                    key={slug}
                                    to={`/tours/${slug}`}
                                    className="text-xs text-teal-800 hover:text-terracotta-500 py-1 flex items-center justify-between"
                                    onClick={() => setOpen(false)}
                                  >
                                    <span className="truncate pr-2">{t.title}</span>
                                    <span className="text-terracotta-400 font-semibold shrink-0">
                                      {formatPrice(t.price_usd)}
                                    </span>
                                  </Link>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                        isActive ? 'text-terracotta-500 bg-terracotta-50 font-semibold' : 'text-teal-700 hover:bg-cream-100'
                      }`
                    }
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                );
              })}

              <div className="mt-3 pt-3 border-t border-savanna-200 flex flex-col gap-2">
                <Link
                  to="/booking#trip-planner"
                  className="btn-primary text-center text-sm py-3"
                  onClick={() => setOpen(false)}
                >
                  Safari Guide & Trip Planner
                </Link>
                <a
                  href="https://wa.me/255657253723?text=Hi%20Jebri%20Safaris,%20I%20would%20like%20to%20plan%20a%20safari"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 border border-teal-700/30 text-teal-800 rounded-full text-xs font-semibold py-2.5 hover:bg-teal-700 hover:text-cream-50 transition"
                >
                  <WhatsAppIcon className="text-[1.15em]" />
                  Chat on WhatsApp (+255 657 253 723)
                </a>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
