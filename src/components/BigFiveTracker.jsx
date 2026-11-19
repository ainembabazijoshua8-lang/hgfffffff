import { useState } from 'react';
import { Link } from 'react-router-dom';
import { fallbackTours as TOUR_CATALOG } from '../data/fallbackTours.js';
import { SiteIcon } from './Icons.jsx';

// Every animal points at a tour slug; the displayed name and price are derived
// from the catalog rather than restated per animal. Restating them meant a price
// change in tourCatalog.js left this card advertising a stale figure.
const TOURS_BY_SLUG = new Map(TOUR_CATALOG.map(t => [t.slug, t]));

function recommendedTourLabel(animal) {
  const tour = TOURS_BY_SLUG.get(animal.recommendedTourSlug);
  if (!tour) return animal.recommendedTourTitle;
  return `${tour.title} ($${tour.price_usd.toLocaleString('en-US')})`;
}

const ANIMALS = [
  {
    id: 'lion',
    name: 'Lion',
    swahili: 'Simba',
    scientific: 'Panthera leo',
    icon: 'paw',
    likelihood: '98%',
    bestParks: ['Central Serengeti (Seronera)', 'Ngorongoro Crater', 'Ruaha (10% world pop)'],
    bestTime: 'Early morning & golden hour sundown',
    status: 'Vulnerable · Common in Serengeti prides',
    image: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=800&q=80',
    fieldNote: 'Lions frequently lounge on rocky granite kopjes (like Simba Kopjes) in the Serengeti to scan the savanna for zebra and wildebeest herds.',
    recommendedTourSlug: 'classic-northern-circuit-5-day',
    recommendedTourTitle: '5-Day Classic Northern Circuit ($2,100)',
  },
  {
    id: 'leopard',
    name: 'Leopard',
    swahili: 'Chui',
    scientific: 'Panthera pardus',
    icon: 'paw',
    likelihood: '85%',
    bestParks: ['Seronera River Valley (Serengeti)', 'Tarangire Baobab Trees'],
    bestTime: 'Early dawn, resting in sausage tree forks midday',
    status: 'Elusive & solitary tree climber',
    image: 'https://images.unsplash.com/photo-1456926631375-92c8ce872def?auto=format&fit=crop&w=800&q=80',
    fieldNote: 'Look up! Leopards haul heavy gazelle and impala kills high into yellow fever tree branches to prevent hyenas and lions from stealing them.',
    recommendedTourSlug: 'serengeti-ngorongoro-express',
    recommendedTourTitle: '3-Day Serengeti & Ngorongoro Express ($1,250)',
  },
  {
    id: 'rhino',
    name: 'Black Rhino',
    swahili: 'Faru',
    scientific: 'Diceros bicornis',
    icon: 'paw',
    likelihood: '92%',
    bestParks: ['Ngorongoro Crater floor', 'Mkomazi Rhino Sanctuary'],
    bestTime: 'Early morning near Lerai Forest & saline lake',
    status: 'Critically Endangered · Heavily protected',
    image: '/assets/uploads/rhino.jpeg',
    fieldNote: 'The 600m deep caldera walls of Ngorongoro create a natural sanctuary protecting one of the highest densities of wild black rhinos in Africa.',
    recommendedTourSlug: 'wildlife-culture-safari-7-day',
    recommendedTourTitle: '7-Day Tanzania Wildlife & Culture ($3,050)',
  },
  {
    id: 'elephant',
    name: 'African Elephant',
    swahili: 'Ndovu / Tembo',
    scientific: 'Loxodonta africana',
    icon: 'paw',
    likelihood: '99%',
    bestParks: ['Tarangire River Corridor', 'Central Serengeti', 'Ruaha National Park'],
    bestTime: 'All day; riverbeds during hot afternoons',
    status: 'Massive matriarchal breeding herds',
    image: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=800&q=80',
    fieldNote: 'Tarangire boasts herds of up to 300 elephants digging for groundwater in dry riverbeds beneath ancient thousand-year-old baobab trees.',
    recommendedTourSlug: 'classic-northern-circuit-5-day',
    recommendedTourTitle: '5-Day Classic Northern Circuit ($2,100)',
  },
  {
    id: 'buffalo',
    name: 'Cape Buffalo',
    swahili: 'Nyati / Mbogo',
    scientific: 'Syncerus caffer',
    icon: 'paw',
    likelihood: '99%',
    bestParks: ['Ngorongoro Crater', 'Tarangire Marshlands', 'Nyerere (Selous)'],
    bestTime: 'Morning grazing & wallowing in waterholes',
    status: 'Unpredictable Big 5 heavyweight',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/B%C3%BAfalo_cafre_%28Syncerus_caffer%29%2C_parque_nacional_de_Tarangire%2C_Tanzania%2C_2024-05-24%2C_DD_31.jpg/960px-B%C3%BAfalo_cafre_%28Syncerus_caffer%29%2C_parque_nacional_de_Tarangire%2C_Tanzania%2C_2024-05-24%2C_DD_31.jpg',
    imageCredit: {
      author: 'Diego Delso',
      authorUrl: 'https://commons.wikimedia.org/wiki/File:B%C3%BAfalo_cafre_(Syncerus_caffer),_parque_nacional_de_Tarangire,_Tanzania,_2024-05-24,_DD_31.jpg',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    },
    fieldNote: 'Often considered the most dangerous of the Big 5 by local hunters, herds of over 500 gather around Ngorongoro swamp edges.',
    recommendedTourSlug: 'budget-group-camping-safari-6-day',
    recommendedTourTitle: '6-Day Budget Group Camping ($1,400)',
  },
  {
    id: 'cheetah',
    name: 'Cheetah',
    swahili: 'Duma',
    scientific: 'Acinonyx jubatus',
    icon: 'paw',
    likelihood: '88%',
    bestParks: ['Southern Serengeti (Ndutu)', 'Grumeti Plains'],
    bestTime: 'Mid-morning & afternoon on termite mounds',
    status: 'Fastest land mammal (up to 110 km/h)',
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/28/Gepard-Serengeti.jpg/960px-Gepard-Serengeti.jpg',
    imageCredit: {
      author: 'Tobi 87',
      authorUrl: 'https://commons.wikimedia.org/wiki/File:Gepard-Serengeti.jpg',
      license: 'CC BY-SA 3.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    },
    fieldNote: 'Unlike leopards and lions, cheetahs hunt during bright daylight. They use termite mounds as lookout vantage points.',
    recommendedTourSlug: 'luxury-fly-in-safari-8-day',
    recommendedTourTitle: '8-Day Luxury Fly-In Safari ($6,500)',
  },
  {
    id: 'wilddog',
    name: 'African Wild Dog',
    swahili: 'Mbwa Mwitu',
    scientific: 'Lycaon pictus',
    icon: 'paw',
    likelihood: '75%',
    bestParks: ['Nyerere National Park (Selous)', 'Ruaha Untamed'],
    bestTime: 'Cool dawn and twilight pack hunts',
    status: 'Endangered "Painted Wolves"',
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f2/Wild_Dogs_%28Lycaon_pictus%29_%2816394165128%29.jpg/960px-Wild_Dogs_%28Lycaon_pictus%29_%2816394165128%29.jpg',
    imageCredit: {
      author: 'Bernard Dupont',
      authorUrl: 'https://commons.wikimedia.org/wiki/File:Wild_Dogs_(Lycaon_pictus)_(16394165128).jpg',
      license: 'CC BY-SA 2.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    },
    fieldNote: 'One of the rarest sightings in East Africa. The vast southern parks (Nyerere & Ruaha) are the premier stronghold for these coordinated pack hunters.',
    recommendedTourSlug: 'southern-circuit-untamed-9-day',
    recommendedTourTitle: '9-Day Southern Circuit Untamed ($4,000)',
  },
];

export default function BigFiveTracker() {
  const [activeId, setActiveId] = useState('lion');
  const activeAnimal = ANIMALS.find((a) => a.id === activeId) || ANIMALS[0];

  return (
    <div className="bg-cream-100/70 border border-savanna-200/80 rounded-3xl p-6 sm:p-10 shadow-card">
      <div className="max-w-2xl mx-auto text-center mb-8">
        <span className="eyebrow">Wildlife Sighting Guide</span>
        <h2 className="section-title mt-2">The "Big 5" & Predator Probability</h2>
        <p className="mt-3 text-teal-700/80 text-sm sm:text-base">
          Our safari routes are designed around seasonal wildlife movements. The
          percentages below are general guidance for where and when these species
          are typically found — sightings are never guaranteed, and your guide
          will advise on the day.
        </p>
      </div>

      {/* Animal selectors */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-8">
        {ANIMALS.map((animal) => {
          const isSelected = animal.id === activeId;
          return (
            <button
              key={animal.id}
              onClick={() => setActiveId(animal.id)}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${
                isSelected
                  ? 'bg-teal-800 text-cream-50 shadow-glow scale-105'
                  : 'bg-cream-50 text-teal-800 border border-savanna-200 hover:border-terracotta-400 hover:bg-cream-100'
              }`}
            >
              <SiteIcon name={animal.icon} className="text-base sm:text-lg" />
              <span>{animal.name}</span>
            </button>
          );
        })}
      </div>

      {/* Spotlight Card */}
      <div className="grid lg:grid-cols-12 gap-6 items-center bg-cream-50 rounded-2xl p-6 sm:p-8 border border-savanna-200/80 shadow-sm">
        <div className="lg:col-span-5">
          <div className="relative overflow-hidden rounded-xl h-64 sm:h-80 shadow-md">
            <img
              src={activeAnimal.image}
              alt={activeAnimal.name}
              className="w-full h-full object-cover animate-fade-up"
            />
            <div className="absolute top-3 left-3 bg-teal-900/85 backdrop-blur-md text-cream-50 text-xs font-semibold px-3 py-1 rounded-full border border-teal-700/50">
              Swahili: <span className="text-gold-400 font-bold">{activeAnimal.swahili}</span>
            </div>
            <div className="absolute bottom-3 right-3 bg-terracotta-500/90 backdrop-blur-md text-cream-50 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
              {activeAnimal.likelihood} Sighting Probability
            </div>
          </div>
          {activeAnimal.id === 'buffalo' && (
            <p className="mt-2 text-[10px] text-teal-700/70">
              Photo: <a href="https://commons.wikimedia.org/wiki/File:B%C3%BAfalo_cafre_(Syncerus_caffer),_parque_nacional_de_Tarangire,_Tanzania,_2024-05-24,_DD_31.jpg" target="_blank" rel="noreferrer" className="underline">Diego Delso</a> / <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer" className="underline">CC BY-SA 4.0</a>
            </p>
          )}
        </div>

        <div className="lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 border-b border-savanna-200 pb-3">
              <div>
                <h3 className="font-display text-2xl sm:text-3xl text-teal-800 font-bold flex items-center gap-2">
                  <SiteIcon name={activeAnimal.icon} className="text-terracotta-500" />
                  <span>{activeAnimal.name}</span>
                </h3>
                <span className="text-xs italic text-teal-600 font-serif">{activeAnimal.scientific}</span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] uppercase tracking-wider text-teal-600 font-bold">Likelihood</span>
                <span className="font-display text-2xl font-bold text-terracotta-500">{activeAnimal.likelihood}</span>
              </div>
            </div>

            <div className="mt-4 grid sm:grid-cols-2 gap-4 text-xs sm:text-sm text-teal-800">
              <div className="p-3 bg-cream-100/60 rounded-xl border border-savanna-200/50">
                <span className="block font-bold text-[11px] uppercase tracking-wider text-terracotta-500 mb-1">
                  <SiteIcon name="map-pin" className="mr-1 align-[-2px]" />Prime Locations
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-teal-700">
                  {activeAnimal.bestParks.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-cream-100/60 rounded-xl border border-savanna-200/50">
                <span className="block font-bold text-[11px] uppercase tracking-wider text-terracotta-500 mb-1">
                  <SiteIcon name="clock" className="mr-1 align-[-2px]" />Peak Activity Hours
                </span>
                <p className="text-teal-700">{activeAnimal.bestTime}</p>
                <div className="mt-2 text-[11px] text-teal-600 font-medium">{activeAnimal.status}</div>
              </div>
            </div>

            <div className="mt-4 p-3.5 bg-amber-50/60 border border-amber-200/60 rounded-xl text-xs sm:text-sm text-teal-900 leading-relaxed">
              <span className="font-bold text-terracotta-500 mr-1.5"><SiteIcon name="compass" className="mr-1 align-[-2px]" />Field Tracker Insight:</span>
              {activeAnimal.fieldNote}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-savanna-200 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-teal-700 font-medium">
              Featured on:{' '}
              <strong className="text-teal-900">{recommendedTourLabel(activeAnimal)}</strong>
            </div>
            <Link
              to={`/tours/${activeAnimal.recommendedTourSlug}`}
              className="btn-primary py-2 px-4 text-xs font-semibold"
            >
              View This Journey <SiteIcon name="arrow-right" className="align-[-2px]" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
