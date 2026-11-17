import { useState } from 'react';
import { Link } from 'react-router-dom';

const MONTHS_DATA = [
  {
    month: 'January',
    short: 'Jan',
    phase: 'Calving Season Begins',
    location: 'Southern Serengeti & Ndutu Plains',
    crowd: 'Moderate to High',
    weather: 'Warm & Mostly Dry (28°C / 82°F)',
    highlight: '8,000 wildebeest calves born every single day. Big cats (cheetahs, lions, leopards) stalk the short grass plains in plain sight.',
    predatorRating: 5,
    bestParks: ['Southern Serengeti', 'Ndutu', 'Ngorongoro Crater', 'Tarangire'],
    photography: '⭐⭐⭐⭐⭐ High-contrast predator hunts, baby animals, crystal-clear morning light.',
    recommendedTourSlug: 'serengeti-classic',
  },
  {
    month: 'February',
    short: 'Feb',
    phase: 'Peak Calving Season',
    location: 'Ndutu & Southern Serengeti (Tanzania)',
    crowd: 'High (Book 4+ months ahead)',
    weather: 'Warm & Dry days with occasional brief evening showers',
    highlight: 'The absolute peak of the calving phenomenon. Incredible predator interaction as mothers defend vulnerable calves.',
    predatorRating: 5,
    bestParks: ['Ndutu Plains', 'Central Serengeti (Seronera)', 'Ngorongoro'],
    photography: '⭐⭐⭐⭐⭐ Dramatic hunt sequences, newborn calves running within 10 minutes of birth.',
    recommendedTourSlug: 'serengeti-classic',
  },
  {
    month: 'March',
    short: 'Mar',
    phase: 'Herds Start Marching West',
    location: 'Southern & Western Serengeti Corridor',
    crowd: 'Moderate',
    weather: 'Warm, lush greenery starting to emerge',
    highlight: 'As the calves gain strength, the mega-herds begin their march northwestward in search of fresh rainwater and sweet grass.',
    predatorRating: 4,
    bestParks: ['Western Corridor', 'Central Serengeti', 'Lake Manyara'],
    photography: '⭐⭐⭐⭐ Lush green backgrounds, dramatic cloudscapes, energetic herds.',
    recommendedTourSlug: 'serengeti-classic',
  },
  {
    month: 'April',
    short: 'Apr',
    phase: 'The Green Season (Long Rains)',
    location: 'Central Serengeti & Western Corridor',
    crowd: 'Lowest of the year (Exclusive & Peaceful)',
    weather: 'Afternoon rain showers, lush tropical greenery',
    highlight: 'Safari lodges offer secret green-season rates. Pristine landscapes, zero safari vehicle crowds, and thousands of migratory bird species.',
    predatorRating: 4,
    bestParks: ['Central Serengeti (resident big cats)', 'Ngorongoro Crater'],
    photography: '⭐⭐⭐⭐ Emerald green vistas, moody storm skies, no other tourist vehicles in your frame.',
    recommendedTourSlug: 'ngorongoro-crater-express',
  },
  {
    month: 'May',
    short: 'May',
    phase: 'Grumeti River Staging',
    location: 'Western Serengeti (Grumeti River)',
    crowd: 'Low (Great Value Rates)',
    weather: 'Rains taper off by late May; fresh crisp air',
    highlight: 'Herds mass along the Grumeti River where giant prehistoric Nile crocodiles wait in the deep pools.',
    predatorRating: 4,
    bestParks: ['Grumeti Reserve', 'Western Serengeti', 'Tarangire'],
    photography: '⭐⭐⭐⭐ Wild river encounters, dense columns of wildebeest stretching to the horizon.',
    recommendedTourSlug: 'serengeti-classic',
  },
  {
    month: 'June',
    short: 'Jun',
    phase: 'Moving North Through Central Serengeti',
    location: 'Central & Northern Serengeti',
    crowd: 'Moderate (Rising toward high season)',
    weather: 'Cooler mornings, bright blue skies, zero rain',
    highlight: 'Dry season begins. Animals concentrate around water sources. Excellent visibility as the savannah grass dries down.',
    predatorRating: 5,
    bestParks: ['Central Serengeti', 'Tarangire (elephants arriving)', 'Ngorongoro'],
    photography: '⭐⭐⭐⭐⭐ Classic golden savannah lighting, sharp wildlife visibility.',
    recommendedTourSlug: 'tarangire-elephant-safari',
  },
  {
    month: 'July',
    short: 'Jul',
    phase: 'First Mara River Crossings',
    location: 'Northern Serengeti (Kogatende) & Mara River',
    crowd: 'Peak Season',
    weather: 'Cool dry days, cold safari mornings (fleece recommended)',
    highlight: 'The legendary Mara River crossings commence. Giant herds plunge into the rushing waters braving crocodile currents and steep riverbanks.',
    predatorRating: 5,
    bestParks: ['Northern Serengeti (Kogatende)', 'Mara River', 'Tarangire'],
    photography: '⭐⭐⭐⭐⭐ High-adrenaline river crossings, dust clouds, dramatic survival moments.',
    recommendedTourSlug: 'serengeti-classic',
  },
  {
    month: 'August',
    short: 'Aug',
    phase: 'Peak Mara River Crossings',
    location: 'Northern Serengeti & Maasai Mara (Kenya)',
    crowd: 'Peak Season (Highest demand)',
    weather: 'Clear sunny skies, pleasant temperatures (26°C / 78°F)',
    highlight: 'Multiple daily river crossings across the Northern Serengeti border. The ultimate wildlife spectacle on planet earth.',
    predatorRating: 5,
    bestParks: ['Northern Serengeti', 'Maasai Mara', 'Tarangire'],
    photography: '⭐⭐⭐⭐⭐ Iconic National Geographic river crossing shots and leopard encounters in rocky kopjes.',
    recommendedTourSlug: 'serengeti-classic',
  },
  {
    month: 'September',
    short: 'Sep',
    phase: 'Northern Grazing & Crossings',
    location: 'Northern Serengeti & Maasai Mara',
    crowd: 'High',
    weather: 'Dry, warm, excellent game viewing roads',
    highlight: 'Herds roam between Kenya and Tanzania following localized rain. Big cat territorial battles are frequent.',
    predatorRating: 5,
    bestParks: ['Northern Serengeti', 'Maasai Mara', 'Tarangire baobab riverbeds'],
    photography: '⭐⭐⭐⭐⭐ Pristine golden hour lighting, unobstructed bush views.',
    recommendedTourSlug: 'serengeti-classic',
  },
  {
    month: 'October',
    short: 'Oct',
    phase: 'The Journey Back South',
    location: 'Northern Serengeti heading toward Central',
    crowd: 'Moderate (Tapering off from peak)',
    weather: 'Dry, warm, occasional short rain previews',
    highlight: 'Herds begin their southwards journey back into Tanzania as thunderclouds gather over the southern plains.',
    predatorRating: 4,
    bestParks: ['Central Serengeti', 'Tarangire (peak elephant concentrations)', 'Ngorongoro'],
    photography: '⭐⭐⭐⭐ Superb elephant herd interaction and predator stalking.',
    recommendedTourSlug: 'tarangire-elephant-safari',
  },
  {
    month: 'November',
    short: 'Nov',
    phase: 'Short Rains & Emerald Awakening',
    location: 'Eastern & Central Serengeti Plains',
    crowd: 'Low to Moderate (Great Value)',
    weather: 'Refreshing short afternoon showers, clear mornings',
    highlight: 'Short rains transform the dry dust into a carpet of tender green grass. Eurasian migratory birds arrive in their millions.',
    predatorRating: 4,
    bestParks: ['Eastern Serengeti', 'Central Plains', 'Lake Manyara'],
    photography: '⭐⭐⭐⭐ Intense green landscape contrasts, rainbow skies, incredible bird photography.',
    recommendedTourSlug: 'lake-manyara-day-trip',
  },
  {
    month: 'December',
    short: 'Dec',
    phase: 'Southern Gathering & Holiday Safaris',
    location: 'Southern Serengeti & Ndutu Foothills',
    crowd: 'High (Christmas & New Year)',
    weather: 'Warm and sunny with occasional light showers',
    highlight: 'The entire herd is reunited in the south, grazing heavily and preparing for the upcoming calving cycle.',
    predatorRating: 5,
    bestParks: ['Southern Serengeti', 'Ndutu', 'Ngorongoro Crater'],
    photography: '⭐⭐⭐⭐⭐ Festive season safari memories, lush plains, dense wildlife gatherings.',
    recommendedTourSlug: 'serengeti-classic',
  },
];

export default function MigrationCalendar({ className = '' }) {
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(1); // Default to Feb (Calving)
  const currentMonth = MONTHS_DATA[selectedMonthIndex];

  return (
    <div className={`rounded-3xl border border-savanna-200 bg-cream-50 p-5 sm:p-8 shadow-card ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-savanna-100">
        <div>
          <span className="eyebrow">Wildlife Timing & Seasons</span>
          <h3 className="font-display text-2xl sm:text-4xl text-teal-700 mt-1">
            The Great Migration & Best Time to Visit
          </h3>
          <p className="text-sm text-teal-700/75 mt-1.5 max-w-2xl">
            1.5 million wildebeest, zebras, and gazelles move in an endless 1,000-km annual loop. Select a month to see where the herds are and what to pack.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto bg-cream-100 px-4 py-2 rounded-2xl border border-savanna-200 text-xs">
          <span className="text-terracotta-400 font-bold">🦁 Pro Tip:</span>
          <span className="text-teal-800">Every month in East Africa offers premier Big 5 viewing.</span>
        </div>
      </div>

      {/* Month Selection Tabs */}
      <div className="mt-6">
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5">
          {MONTHS_DATA.map((item, index) => {
            const isSelected = selectedMonthIndex === index;
            return (
              <button
                key={item.month}
                type="button"
                onClick={() => setSelectedMonthIndex(index)}
                className={`py-2.5 px-2 rounded-xl text-center transition-all duration-200 flex flex-col items-center justify-center ${
                  isSelected
                    ? 'bg-terracotta-400 text-cream-50 font-bold shadow-md scale-105 ring-2 ring-terracotta-300'
                    : 'bg-white hover:bg-cream-100 border border-savanna-200 text-teal-800'
                }`}
              >
                <span className="text-xs font-bold uppercase">{item.short}</span>
                <span className={`text-[9px] mt-0.5 ${isSelected ? 'text-cream-100' : 'text-teal-500'}`}>
                  {item.predatorRating === 5 ? '🔥 Peak' : '🌿 Good'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Month Details Spotlight Card */}
      <div className="mt-6 bg-white rounded-2xl border border-savanna-200 p-6 sm:p-7 shadow-sm animate-fade-up">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-savanna-100">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-terracotta-50 text-terracotta-500 px-3 py-1 rounded-full border border-terracotta-200">
                {currentMonth.phase}
              </span>
              <span className="text-xs font-semibold bg-cream-100 text-teal-800 px-3 py-1 rounded-full">
                📍 {currentMonth.location}
              </span>
            </div>
            <h4 className="font-display text-3xl text-teal-800 mt-2">
              Safari in {currentMonth.month}
            </h4>
            <p className="text-base text-teal-700/85 mt-2 leading-relaxed max-w-3xl">
              {currentMonth.highlight}
            </p>
          </div>

          <div className="lg:w-72 shrink-0 bg-cream-50 rounded-xl p-4 border border-savanna-100 space-y-3 text-xs">
            <div>
              <div className="text-teal-500 font-semibold uppercase text-[10px] tracking-wider">Predator Action Index</div>
              <div className="text-terracotta-400 font-bold text-base mt-0.5">
                {'⭐'.repeat(currentMonth.predatorRating)} ({currentMonth.predatorRating}/5)
              </div>
            </div>
            <div>
              <div className="text-teal-500 font-semibold uppercase text-[10px] tracking-wider">Crowd & Demand Level</div>
              <div className="text-teal-800 font-medium mt-0.5">{currentMonth.crowd}</div>
            </div>
            <div>
              <div className="text-teal-500 font-semibold uppercase text-[10px] tracking-wider">Weather Conditions</div>
              <div className="text-teal-800 font-medium mt-0.5">{currentMonth.weather}</div>
            </div>
          </div>
        </div>

        {/* Bottom Recommendation Row */}
        <div className="mt-5 grid md:grid-cols-2 gap-4 items-center">
          <div className="text-xs space-y-1.5">
            <div>
              <strong className="text-teal-800">Top Recommended Parks for {currentMonth.month}:</strong>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {currentMonth.bestParks.map(park => (
                <span key={park} className="bg-cream-100 text-teal-800 px-2.5 py-1 rounded-lg text-xs font-medium border border-savanna-100">
                  ✓ {park}
                </span>
              ))}
            </div>
            <div className="text-teal-700/70 pt-1">
              📷 <strong>Photography Note:</strong> {currentMonth.photography}
            </div>
          </div>

          <div className="flex items-center justify-start md:justify-end gap-3 pt-3 md:pt-0">
            <Link
              to={`/booking?travel_month=${encodeURIComponent(currentMonth.month)}`}
              className="btn-primary text-xs px-5 py-2.5 shadow-sm"
            >
              Plan a {currentMonth.month} Safari →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
