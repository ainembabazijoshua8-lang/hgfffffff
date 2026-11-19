import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fallbackTours as TOUR_CATALOG } from '../data/fallbackTours.js';
import { SiteIcon } from './Icons.jsx';

const DESTINATIONS = [
  { value: '', label: 'All Destinations & Parks' },
  { value: 'serengeti', label: 'Serengeti & Ngorongoro Crater' },
  { value: 'tarangire', label: 'Tarangire & Lake Manyara' },
  { value: 'zanzibar', label: 'Serengeti & Zanzibar Beach' },
  { value: 'ruaha', label: 'Southern Circuit (Ruaha & Nyerere)' },
  { value: 'kilimanjaro', label: 'Mount Kilimanjaro & Safari' },
];

// Tier price hints are computed from the catalog so a price change cannot leave
// this control advertising a stale "from $X".
const TIER_PRICE_HINT = TOUR_CATALOG.reduce((acc, tour) => {
  if (!acc[tour.tier] || tour.price_usd < acc[tour.tier]) acc[tour.tier] = tour.price_usd;
  return acc;
}, {});
const fmtUSD = n => `$${n.toLocaleString('en-US')}`;

const STYLES = [
  { value: '', label: 'All Safari Styles' },
  {
    value: 'mid',
    label: TIER_PRICE_HINT.mid
      ? `Standard Comfort (from ${fmtUSD(TIER_PRICE_HINT.mid)})`
      : 'Standard Comfort',
  },
  {
    value: 'luxury',
    label: TIER_PRICE_HINT.luxury
      ? `Luxury & Fly-In (from ${fmtUSD(TIER_PRICE_HINT.luxury)})`
      : 'Luxury & Fly-In',
  },
  {
    value: 'budget',
    label: TIER_PRICE_HINT.budget
      ? `Budget-Friendly & Camping (from ${fmtUSD(TIER_PRICE_HINT.budget)})`
      : 'Budget-Friendly & Camping',
  },
  { value: 'honeymoon', label: 'Honeymoon & Romantic' },
  { value: 'family', label: 'Family Friendly' },
];

export default function HeroQuickSearch() {
  const navigate = useNavigate();
  const [destination, setDestination] = useState('');
  const [style, setStyle] = useState('');

  // There is deliberately no "When?" control. No tour record carries a season
  // attribute (`best_for` is only couples/family/group/honeymoon/photography),
  // so a season selector could not filter anything — it was collected, held in
  // state, then dropped on submit, which silently contradicted the user's
  // choice. Reintroduce it only alongside real seasonal tour data.
  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination) params.set('q', destination);
    if (style === 'budget' || style === 'mid' || style === 'luxury') {
      params.set('tier', style);
    } else if (style) {
      params.set('best_for', style);
    }
    navigate(`/tours?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 sm:mt-10">
      <form
        onSubmit={handleSearch}
        className="backdrop-blur-xl bg-linen/90 border border-white/60 p-3 sm:p-4 rounded-2xl sm:rounded-full shadow-cardHover grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2.5 sm:gap-3 items-center"
      >
        {/* Destination select */}
        <div className="flex items-center gap-2 px-3 py-2 bg-cream-50/70 rounded-xl sm:rounded-full border border-savanna-200/50">
          <SiteIcon name="map-pin" className="text-terracotta-500 text-base" />
          <div className="flex-1 min-w-0">
            <label htmlFor="quick-dest" className="block text-[10px] uppercase font-bold tracking-wider text-teal-600">
              Where to?
            </label>
            <select
              id="quick-dest"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm font-medium text-teal-900 focus:outline-none truncate cursor-pointer"
            >
              {DESTINATIONS.map((d) => (
                <option key={d.value} value={d.value} className="text-teal-900 bg-cream-50">
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Style / Tier select */}
        <div className="flex items-center gap-2 px-3 py-2 bg-cream-50/70 rounded-xl sm:rounded-full border border-savanna-200/50">
          <SiteIcon name="sparkles" className="text-terracotta-500 text-base" />
          <div className="flex-1 min-w-0">
            <label htmlFor="quick-style" className="block text-[10px] uppercase font-bold tracking-wider text-teal-600">
              Safari Tier
            </label>
            <select
              id="quick-style"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm font-medium text-teal-900 focus:outline-none truncate cursor-pointer"
            >
              {STYLES.map((st) => (
                <option key={st.value} value={st.value} className="text-teal-900 bg-cream-50">
                  {st.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          className="btn-primary py-3 sm:py-3.5 px-6 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold tracking-wide w-full sm:w-auto bg-terracotta-500 hover:bg-terracotta-600 border border-terracotta-400/50 shadow-glow flex items-center justify-center gap-2"
        >
          <span>Find Safaris</span>
          <SiteIcon name="arrow-right" />
        </button>
      </form>
    </div>
  );
}
