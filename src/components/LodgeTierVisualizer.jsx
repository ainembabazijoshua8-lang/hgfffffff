import { useState } from 'react';
import { Link } from 'react-router-dom';
import { fallbackTours as TOUR_CATALOG } from '../data/fallbackTours.js';
import { SiteIcon } from './Icons.jsx';

// Tier ranges are computed from the live catalog. They used to be hardcoded
// strings, which drifted: "From $5,900" for luxury hid a real $4,000 tour, and
// the mid range capped at $3,900 excluded the $4,650 Kili climb tour.
const TOURS_BY_SLUG = new Map(TOUR_CATALOG.map(t => [t.slug, t]));
const fmtUSD = n => `$${n.toLocaleString('en-US')}`;

function tierPriceGuide(tierId) {
  const prices = TOUR_CATALOG.filter(t => t.tier === tierId).map(t => t.price_usd);
  if (!prices.length) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? `${fmtUSD(min)} / person` : `${fmtUSD(min)} – ${fmtUSD(max)} / person`;
}

function resolveSampleTour(sample) {
  const tour = TOURS_BY_SLUG.get(sample.slug);
  if (!tour) return sample;
  return { slug: sample.slug, title: tour.title, price: fmtUSD(tour.price_usd) };
}

const TIERS = [
  {
    id: 'budget',
    title: 'Budget Safari Camping',
    badge: 'Authentic & Adventure',
    priceNote: 'Group-load pricing applies to the camping itinerary.',
    headline: 'Sleep under African constellations right inside the parks',
    summary: 'For travelers who want raw, immersive wildlife exposure and campfire camaraderie without paying luxury lodge premiums.',
    image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1000&q=80',
    amenities: [
      'High-grade waterproof dome canvas tents',
      'Thick ground mattresses & warm sleeping bags',
      'Dedicated private safari chef on every trip',
      '3 freshly cooked hot meals every day',
      'Shared national park washrooms & showers',
      'Real campfire dinners under star-filled skies',
    ],
    sampleTour: {
      title: '6-Day Budget Group Camping Safari',
      slug: 'budget-group-camping-safari-6-day',
      price: '$1,400',
    },
  },
  {
    id: 'mid',
    title: 'Standard & Mid-Range Comfort',
    badge: 'Most Popular Choice',
    headline: 'Permanent safari lodges & luxury en-suite tented suites',
    summary: 'The sweet spot of Tanzanian safaris. Enjoy the nocturnal sounds of the savanna while sleeping in real beds with private en-suite bathrooms.',
    image: 'https://images.unsplash.com/photo-1547970810-dc1eac37d174?auto=format&fit=crop&w=1000&q=80',
    amenities: [
      'Permanent tented suites on elevated wooden platforms',
      'Private en-suite bathroom with hot running water & flush toilet',
      'King or twin beds with crisp linens & mosquito nets',
      'Full-board buffet & table d’hôte lodge dining',
      'Swimming pools and scenic sunset veranda decks',
      'Solar-powered charging stations in rooms',
    ],
    sampleTour: {
      title: '5-Day Classic Northern Circuit',
      slug: 'classic-northern-circuit-5-day',
      price: '$2,100',
    },
  },
  {
    id: 'luxury',
    title: 'Luxury Fly-In & Bespoke Lodges',
    badge: 'Five-Star Savanna Elegance',
    headline: 'Exclusive light aircraft hops, private suites & gourmet bush dining',
    summary: 'Skip long dusty road transfers. Fly straight into secluded wilderness concessions with open-sided 4x4s, champagne sundowners, and private guides.',
    image: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1000&q=80',
    amenities: [
      'Boutique five-star luxury camps & private villas',
      'Bush flights via light aircraft skipping highway drives',
      'Open-sided 4x4 vehicles for unhindered 360° photography',
      'Multi-course gourmet meals, wine pairings & champagne',
      'Private plunge pools & secluded outdoor bush showers',
      'Included dawn Hot Air Balloon flight (Honeymoon package)',
    ],
    sampleTour: {
      title: '8-Day Luxury Fly-In Safari',
      slug: 'luxury-fly-in-safari-8-day',
      price: '$6,500',
    },
  },
];

export default function LodgeTierVisualizer() {
  const [activeTierId, setActiveTierId] = useState('mid');
  const activeTier = TIERS.find((t) => t.id === activeTierId) || TIERS[1];
  const activePriceGuide = tierPriceGuide(activeTier.id);
  const activeSampleTour = resolveSampleTour(activeTier.sampleTour);

  return (
    <div className="bg-cream-50 border border-savanna-200/80 rounded-3xl p-6 sm:p-10 shadow-card">
      <div className="max-w-2xl mx-auto text-center mb-8">
        <span className="eyebrow">Accommodation Transparency</span>
        <h2 className="section-title mt-2">Compare Safari Accommodation Tiers</h2>
        <p className="mt-3 text-teal-700/80 text-sm sm:text-base">
          Every traveler has different comfort preferences. Here is exactly what to expect across each tier of our Tanzania portfolio.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8">
        {TIERS.map((tier) => {
          const isSelected = tier.id === activeTierId;
          return (
            <button
              key={tier.id}
              onClick={() => setActiveTierId(tier.id)}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                isSelected
                  ? 'bg-teal-800 text-cream-50 shadow-glow scale-105'
                  : 'bg-cream-100 text-teal-800 border border-savanna-200 hover:border-terracotta-400'
              }`}
            >
              <span>{tier.title}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold ${
                isSelected ? 'bg-terracotta-400 text-cream-50' : 'bg-savanna-200/60 text-teal-700'
              }`}>
                {tier.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tier Details Card */}
      <div className="grid lg:grid-cols-12 gap-8 items-center bg-linen rounded-2xl p-6 sm:p-8 border border-savanna-200/80 shadow-inner-warm">
        <div className="lg:col-span-6 relative overflow-hidden rounded-2xl h-72 sm:h-96 shadow-md group">
          <img
            src={activeTier.image}
            alt={activeTier.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-teal-900/90 via-teal-900/20 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-cream-50">
            <span className="text-[10px] font-bold uppercase tracking-widest text-terracotta-300">
              {activeTier.badge}
            </span>
            <h4 className="font-display text-xl sm:text-2xl font-bold mt-1">
              {activeTier.title}
            </h4>
            <span className="text-xs sm:text-sm text-gold-400 font-semibold mt-1 block">
              {activePriceGuide}
            </span>
          </div>
        </div>

        <div className="lg:col-span-6 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-terracotta-500">
              {activePriceGuide}
            </span>
            {activeTier.priceNote ? (
              <p className="text-[11px] text-teal-600 mt-0.5">{activeTier.priceNote}</p>
            ) : null}
            <h3 className="font-display text-2xl sm:text-3xl text-teal-800 font-bold mt-1">
              {activeTier.headline}
            </h3>
            <p className="mt-3 text-sm text-teal-700/85 leading-relaxed">
              {activeTier.summary}
            </p>

            <div className="mt-5">
              <span className="block text-xs font-bold uppercase tracking-wider text-teal-900 mb-2">
                <SiteIcon name="sparkles" className="mr-1 align-[-2px]" />What’s Included in This Tier:
              </span>
              <div className="grid sm:grid-cols-2 gap-2 text-xs sm:text-sm text-teal-800">
                {activeTier.amenities.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <SiteIcon name="check" className="mt-0.5 text-terracotta-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-savanna-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[11px] text-teal-600 block">Sample Package:</span>
              <span className="text-sm font-bold text-teal-900">{activeSampleTour.title}</span>
              <span className="ml-2 text-terracotta-500 font-semibold text-xs">({activeSampleTour.price}/person)</span>
            </div>
            <Link
              to={`/tours/${activeSampleTour.slug}`}
              className="btn-primary py-2.5 px-5 text-xs font-bold"
            >
              Explore {activeSampleTour.slug.includes('camping') ? 'Camping' : activeTier.id === 'luxury' ? 'Luxury' : 'Classic'} Safari <SiteIcon name="arrow-right" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
