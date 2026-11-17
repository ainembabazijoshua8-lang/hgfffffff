import { useState } from 'react';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// Park data: weather, crowd, wildlife events, travel tip
const PARKS = [
  {
    id: 'serengeti',
    name: 'Serengeti',
    emoji: '🦁',
    months: [
      { weather: 'dry',   crowd: 'medium', wildlife: 'Calving season — predator action',        tip: 'Best for newborns & big cats' },
      { weather: 'dry',   crowd: 'medium', wildlife: 'Calving continues, cheetah sightings',    tip: 'Excellent predator density' },
      { weather: 'rains', crowd: 'low',    wildlife: 'Herds moving north-west',                 tip: 'Green season, lush scenery' },
      { weather: 'rains', crowd: 'low',    wildlife: 'Long rains, dramatic skies',              tip: 'Low prices, few tourists' },
      { weather: 'rains', crowd: 'low',    wildlife: 'Herds drifting to western corridor',      tip: 'Green season discount' },
      { weather: 'dry',   crowd: 'medium', wildlife: 'Grumeti River crossings begin',           tip: 'Early Mara crossing action' },
      { weather: 'dry',   crowd: 'high',   wildlife: 'Massive Mara River crossings',            tip: 'Peak migration season' },
      { weather: 'dry',   crowd: 'high',   wildlife: 'Peak river crossings — iconic imagery',  tip: 'Book 6–12 months ahead' },
      { weather: 'dry',   crowd: 'high',   wildlife: 'Crossings continue in Mara',             tip: 'Still excellent viewing' },
      { weather: 'rains', crowd: 'medium', wildlife: 'Herds returning south',                  tip: 'Short rains begin Oct' },
      { weather: 'rains', crowd: 'medium', wildlife: 'Short rains, herds on southern plains',  tip: 'Quiet, good photography' },
      { weather: 'dry',   crowd: 'medium', wildlife: 'Southern plains filling with wildebeest', tip: 'Calm, affordable month' },
    ],
  },
  {
    id: 'ngorongoro',
    name: 'Ngorongoro',
    emoji: '🦏',
    months: [
      { weather: 'dry',   crowd: 'medium', wildlife: 'Rhino & lion visible all year',           tip: 'Misty mornings add atmosphere' },
      { weather: 'dry',   crowd: 'medium', wildlife: 'Flamingos on Lake Magadi',                tip: 'Cool, crisp crater mornings' },
      { weather: 'dry',   crowd: 'medium', wildlife: 'Lush crater floor, wildebeest calving',   tip: 'Green and photogenic' },
      { weather: 'rains', crowd: 'low',    wildlife: 'Long rains soften the crater rim roads',  tip: 'Fewer visitors, great rates' },
      { weather: 'rains', crowd: 'low',    wildlife: 'Bright green crater, elephant families',  tip: 'Dramatically beautiful' },
      { weather: 'dry',   crowd: 'medium', wildlife: 'Crater at its clearest and driest',       tip: 'Ideal for full-day descent' },
      { weather: 'dry',   crowd: 'high',   wildlife: 'Peak season — black rhino most active',   tip: 'Cold nights, warm days' },
      { weather: 'dry',   crowd: 'high',   wildlife: 'Lions denning, hippo pools busy',         tip: 'Combine with Serengeti' },
      { weather: 'dry',   crowd: 'high',   wildlife: 'Predators highly active post-migration',  tip: 'Clear skies for photography' },
      { weather: 'rains', crowd: 'medium', wildlife: 'Short rains freshen crater floor',        tip: 'Changing skies, dramatic shots' },
      { weather: 'rains', crowd: 'low',    wildlife: 'Fewer visitors, lush vegetation',         tip: 'Low crowds, good value' },
      { weather: 'dry',   crowd: 'medium', wildlife: 'Plains dry out, animals concentrate',     tip: 'Good all-round month' },
    ],
  },
  {
    id: 'tarangire',
    name: 'Tarangire',
    emoji: '🐘',
    months: [
      { weather: 'dry',   crowd: 'low',    wildlife: 'Elephants near the river',                tip: 'Quiet, authentic bush feel' },
      { weather: 'dry',   crowd: 'low',    wildlife: 'Baobabs with elephant herds',             tip: 'Uncrowded & affordable' },
      { weather: 'rains', crowd: 'low',    wildlife: 'Herds disperse across the park',          tip: 'Green, photogenic rains' },
      { weather: 'rains', crowd: 'low',    wildlife: 'Long rains — birds arrive',               tip: 'Birdwatcher\'s paradise' },
      { weather: 'rains', crowd: 'low',    wildlife: '500+ bird species during migration',      tip: 'Lowest prices of the year' },
      { weather: 'dry',   crowd: 'low',    wildlife: 'Animals return to Tarangire River',       tip: 'Great game viewing begins' },
      { weather: 'dry',   crowd: 'medium', wildlife: 'Elephant superherds concentrate',         tip: 'Hundreds of elephants daily' },
      { weather: 'dry',   crowd: 'high',   wildlife: 'Peak: 3,000 elephants in one park',       tip: 'Most spectacular month' },
      { weather: 'dry',   crowd: 'high',   wildlife: 'Lions and leopard highly visible',        tip: 'Don\'t miss September' },
      { weather: 'rains', crowd: 'medium', wildlife: 'Animals still concentrated pre-rains',    tip: 'Good transition month' },
      { weather: 'rains', crowd: 'low',    wildlife: 'Migratory birds return',                  tip: 'Dramatic skies & greenery' },
      { weather: 'dry',   crowd: 'low',    wildlife: 'Christmas week fills up — book early',    tip: 'Quiet until Dec 20' },
    ],
  },
];

const weatherColors = {
  dry:   'bg-amber-100 text-amber-800 border border-amber-200',
  rains: 'bg-sky-100 text-sky-800 border border-sky-200',
};
const weatherLabel = { dry: '☀️ Dry', rains: '🌧️ Rains' };

const crowdColors = {
  low:    'text-emerald-600',
  medium: 'text-amber-600',
  high:   'text-red-500',
};
const crowdBars = { low: 1, medium: 2, high: 3 };
const crowdLabel = { low: 'Quiet', medium: 'Moderate', high: 'Peak' };

export default function BestTimeToVisit() {
  const [parkId, setParkId] = useState('serengeti');
  const [selectedMonth, setSelectedMonth] = useState(null);
  const park = PARKS.find(p => p.id === parkId);

  return (
    <section className="container-x py-16">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="eyebrow">Plan smarter</span>
        <h2 className="section-title mt-3">Best time to visit</h2>
        <p className="mt-4 text-teal-700/75">
          Weather, wildlife events, and crowd levels — month by month — for each major park.
        </p>
      </div>

      {/* Park selector */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        {PARKS.map(p => (
          <button
            key={p.id}
            onClick={() => { setParkId(p.id); setSelectedMonth(null); }}
            className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all ${
              parkId === p.id
                ? 'bg-teal-700 text-cream-50 shadow-md scale-105'
                : 'bg-cream-100 text-teal-700 hover:bg-cream-200'
            }`}
          >
            {p.emoji} {p.name}
          </button>
        ))}
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2 mb-6">
        {MONTHS.map((m, i) => {
          const d = park.months[i];
          const isSelected = selectedMonth === i;
          return (
            <button
              key={m}
              onClick={() => setSelectedMonth(isSelected ? null : i)}
              className={`rounded-xl p-2 text-center transition-all border ${
                isSelected
                  ? 'bg-teal-700 text-cream-50 border-teal-700 shadow-lg scale-105'
                  : 'bg-white border-cream-200 hover:border-teal-300 hover:shadow'
              }`}
            >
              <div className="text-xs font-bold uppercase tracking-wider">{m}</div>
              <div className="mt-1 text-lg">{d.weather === 'dry' ? '☀️' : '🌧️'}</div>
              {/* Crowd dots */}
              <div className="flex justify-center gap-0.5 mt-1">
                {[1, 2, 3].map(n => (
                  <div
                    key={n}
                    className={`w-1.5 h-1.5 rounded-full ${
                      n <= crowdBars[d.crowd]
                        ? isSelected ? 'bg-terracotta-300' : 'bg-terracotta-400'
                        : isSelected ? 'bg-cream-50/30' : 'bg-cream-200'
                    }`}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail card — shows when a month is selected */}
      {selectedMonth !== null && (
        <div className="bg-white rounded-2xl shadow-card border border-cream-200 p-6 sm:p-8 grid sm:grid-cols-3 gap-6 animate-fade-up">
          <div className="sm:col-span-2">
            <div className="flex items-center gap-3 flex-wrap mb-4">
              <span className="font-display text-2xl text-teal-800">
                {park.emoji} {MONTHS[selectedMonth]}
              </span>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${weatherColors[park.months[selectedMonth].weather]}`}>
                {weatherLabel[park.months[selectedMonth].weather]}
              </span>
              <span className={`text-xs font-semibold ${crowdColors[park.months[selectedMonth].crowd]}`}>
                ● {crowdLabel[park.months[selectedMonth].crowd]} crowds
              </span>
            </div>
            <p className="text-teal-700 text-lg leading-relaxed">
              🦁 <strong>Wildlife:</strong> {park.months[selectedMonth].wildlife}
            </p>
            <p className="mt-3 text-teal-700/80">
              💡 <em>{park.months[selectedMonth].tip}</em>
            </p>
          </div>
          <div className="flex flex-col gap-3 justify-center">
            <div className={`text-center py-4 rounded-xl ${weatherColors[park.months[selectedMonth].weather]}`}>
              <div className="text-2xl">{park.months[selectedMonth].weather === 'dry' ? '☀️' : '🌧️'}</div>
              <div className="font-semibold mt-1">{weatherLabel[park.months[selectedMonth].weather]}</div>
            </div>
            <a
              href="https://wa.me/255657253723"
              target="_blank"
              rel="noreferrer"
              className="text-center bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition text-sm"
            >
              📅 Book {MONTHS[selectedMonth]} trip
            </a>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex flex-wrap justify-center gap-6 text-xs text-teal-700/70">
        <span>☀️ = Dry season &nbsp;|&nbsp; 🌧️ = Rains</span>
        <span>● = Quiet &nbsp; ●● = Moderate &nbsp; ●●● = Peak crowds</span>
        <span>Click any month for details</span>
      </div>
    </section>
  );
}
