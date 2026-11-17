/**
 * East Africa Safari Map — data layer.
 *
 * Kept separate from the component so marker rendering can be mounted and
 * tested against real coordinates without pulling in Leaflet or React.
 *
 * Shape contract (per location):
 *   id        string  stable slug, used as the React key and Leaflet layer key
 *   lat/lng   number  WGS84 decimal degrees
 *   name      string  full display name
 *   category  string  one of MAP_CATEGORIES[].id
 *   iconType  string  emoji glyph used by the custom divIcon marker
 */

export const MAP_CATEGORIES = [
  { id: 'places', label: 'Places', icon: '📍' },
  { id: 'habitats', label: 'Habitats', icon: '🐾' },
  { id: 'activities', label: 'Activities', icon: '🎈' },
];

export const MAP_CIRCUITS = [
  { id: 'all', label: 'All Circuits' },
  { id: 'northern', label: 'Northern Tanzania' },
  { id: 'southern', label: 'Southern Tanzania' },
  { id: 'kenya', label: 'Kenya Circuit' },
  { id: 'coastal', label: 'Coastal & Island' },
];

/** Destinations. `tourQuery` is the exact term sent to the tours search. */
export const MAP_LOCATIONS = [
  {
    id: 'serengeti',
    name: 'Serengeti National Park',
    lat: -2.3333,
    lng: 34.8333,
    category: 'places',
    iconType: '🦁',
    shortName: 'Serengeti',
    subtitle: 'Endless Plains & Great Migration',
    badge: 'World #1 Park',
    zoom: 9,
    circuit: 'northern',
    tourQuery: 'Serengeti',
    image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80',
    animals: ['🦁 Lions', '🐆 Leopards', '🦓 Great Migration', '🐘 Elephants', '🦏 Black Rhino'],
    highlights:
      'Voted Africa’s leading national park, with the highest predator density on earth and the world-famous wildebeest migration.',
    bestMonths: 'Year-round (Jan–Mar calving; Jul–Oct Mara River crossings)',
    transit: '6–7 hours from Arusha, or a 50-minute bush flight to Seronera/Kogatende',
    terrain: 'Acacia savanna, open golden plains, granite kopjes, Grumeti riverine forest.',
    color: '#C9683D',
  },
  {
    id: 'ngorongoro',
    name: 'Ngorongoro Crater',
    lat: -3.24,
    lng: 35.48,
    category: 'places',
    iconType: '🦏',
    shortName: 'Ngorongoro',
    subtitle: 'World Heritage Volcanic Caldera',
    badge: 'UNESCO Wonder',
    zoom: 10,
    circuit: 'northern',
    tourQuery: 'Ngorongoro',
    image: 'https://images.unsplash.com/photo-1534177616072-ef7dc120449d?auto=format&fit=crop&w=800&q=80',
    animals: ['🦏 Black Rhino', '🦁 Crater Lions', '🦩 Flamingos', '🦛 Hippos', '🐃 Cape Buffalo'],
    highlights:
      'The world’s largest intact volcanic caldera, 600m deep, holding 25,000+ large mammals in an enclosed amphitheater.',
    bestMonths: 'Year-round exceptional viewing with resident wildlife',
    transit: '3–3.5 hours on paved tarmac and a scenic rim ascent',
    terrain: '600m caldera walls, Lake Magadi soda lake, Lerai forest, open savanna.',
    color: '#3B4749',
  },
  {
    id: 'tarangire',
    name: 'Tarangire National Park',
    lat: -3.8333,
    lng: 36.0,
    category: 'places',
    iconType: '🐘',
    shortName: 'Tarangire',
    subtitle: 'Elephant Sanctuary & Ancient Baobabs',
    badge: 'Elephant Capital',
    zoom: 9,
    circuit: 'northern',
    tourQuery: 'Tarangire',
    image: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=800&q=80',
    animals: ['🐘 Elephant Herds (up to 300)', '🦁 Tree-climbing Lions', '🐆 Leopards', '🦒 Giraffes', '🦜 550+ Bird Species'],
    highlights:
      'Massive elephant family herds and thousand-year-old baobabs along the Tarangire River corridor.',
    bestMonths: 'June to October (peak dry-season river congregation)',
    transit: '2 hours on a smooth paved highway from Arusha',
    terrain: 'River valleys, baobab woodlands, seasonal Silale swamps, acacia plains.',
    color: '#C9683D',
  },
  {
    id: 'lake-manyara',
    name: 'Lake Manyara National Park',
    lat: -3.6,
    lng: 35.8,
    category: 'places',
    iconType: '🦩',
    shortName: 'Manyara',
    subtitle: 'Flamingo Alkaline Lake & Ground-water Forest',
    badge: 'Scenic Rift Valley',
    zoom: 10,
    circuit: 'northern',
    tourQuery: 'Manyara',
    image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=800&q=80',
    animals: ['🦩 Pink Flamingos', '🦁 Tree-climbing Lions', '🐒 Baboon Troops', '🦛 Hippos', '🐘 Elephants'],
    highlights:
      'Hemingway called it "the loveliest I had seen in Africa" — a Rift Valley escarpment backdrop with lush mahogany canopy.',
    bestMonths: 'Nov–May birding and waterfalls / Jun–Oct large mammals',
    transit: '2.5 hours from Arusha past Mto wa Mbu village',
    terrain: 'Alkaline lake shore, mahogany/fig forest, steep Rift Valley wall.',
    color: '#4A5D5A',
  },
  {
    id: 'arusha-gateway',
    name: 'Arusha & Mt. Meru',
    lat: -3.3869,
    lng: 36.683,
    category: 'places',
    iconType: '🌿',
    shortName: 'Arusha',
    subtitle: 'Safari Capital & Starting Gateway',
    badge: 'Safari Hub',
    zoom: 10,
    circuit: 'northern',
    tourQuery: 'Arusha',
    image: 'https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=800&q=80',
    animals: ['🐒 Black-and-white Colobus', '🦒 Giraffes', '🦓 Zebras', '🦩 Momella Flamingos'],
    highlights:
      'The safari capital of East Africa and the base for northern circuit tours, with coffee estates and Mount Meru (4,562m).',
    bestMonths: 'Year-round departure hub',
    transit: 'Town centre and Kilimanjaro (JRO) gateway',
    terrain: 'Lush volcanic slopes, coffee estate hills, mountain streams.',
    color: '#26332F',
  },
  {
    id: 'kilimanjaro',
    name: 'Mount Kilimanjaro',
    lat: -3.0674,
    lng: 37.3556,
    category: 'places',
    iconType: '🏔️',
    shortName: 'Kilimanjaro',
    subtitle: 'Roof of Africa (5,895m / 19,341ft)',
    badge: 'Highest Peak in Africa',
    zoom: 10,
    circuit: 'northern',
    tourQuery: 'Kilimanjaro',
    image: 'https://images.unsplash.com/photo-1589553416260-f586c8f1514f?auto=format&fit=crop&w=800&q=80',
    animals: ['🐒 Blue Monkeys', '🦅 Verreaux’s Eagles', '🌿 Giant Senecios & Lobelias'],
    highlights:
      'The highest freestanding mountain on earth, crossing five climate zones from rainforest to arctic summit glaciers.',
    bestMonths: 'Dec–Mar and Jul–Oct (clearest trekking skies)',
    transit: '1.5 hours to the Machame / Marangu trailheads',
    terrain: 'Rainforest → heather moorland → alpine desert → summit glaciers.',
    color: '#8A5A36',
  },
  {
    id: 'maasai-mara',
    name: 'Maasai Mara National Reserve',
    lat: -1.49,
    lng: 35.1438,
    category: 'places',
    iconType: '🐆',
    shortName: 'Maasai Mara',
    subtitle: 'Kenya’s Wildlife Crown Jewel',
    badge: 'Kenya Classic',
    zoom: 9,
    circuit: 'kenya',
    tourQuery: null,
    image: 'https://images.unsplash.com/photo-1549366021-9f761d450615?auto=format&fit=crop&w=800&q=80',
    animals: ['🦁 Marsh Pride Lions', '🐊 Mara River Crocodiles', '🐆 Cheetah Coalisations', '🦓 Migration Crossing'],
    highlights:
      'The northern extension of the Serengeti ecosystem, famous for Mara River crossings and dense cheetah territory.',
    bestMonths: 'July to October (Great Migration in Kenya)',
    transit: 'Cross-border via Namanga, or a scheduled flight to Musiara',
    terrain: 'Open rolling grasslands, riverine thickets, iconic acacia.',
    color: '#B85D38',
  },
  {
    id: 'amboseli',
    name: 'Amboseli National Park',
    lat: -2.6527,
    lng: 37.2606,
    category: 'places',
    iconType: '🐘',
    shortName: 'Amboseli',
    subtitle: 'Land of Giants Under Kilimanjaro',
    badge: 'Postcard Views',
    zoom: 9,
    circuit: 'kenya',
    tourQuery: null,
    image:
      'https://upload.wikimedia.org/wikipedia/commons/f/fa/Elephants_at_Amboseli_national_park_against_Mount_Kilimanjaro.jpg',
    credit: 'Amoghavarsha JS',
    license: 'CC BY-SA 3.0',
    licenseUrl:
      'https://commons.wikimedia.org/wiki/File:Elephants_at_Amboseli_national_park_against_Mount_Kilimanjaro.jpg',
    animals: ['🐘 Big Tusker Elephants', '🦁 Lions', '🐆 Cheetahs', '🦩 Lake Amboseli Pelicans'],
    highlights:
      'Enormous "Big Tusker" herds grazing against the snow-capped summit of Kilimanjaro.',
    bestMonths: 'June to October and January to February',
    transit: '3 hours via the Namanga Kenya–Tanzania border',
    terrain: 'Dried Pleistocene lake basin, sulfur springs, open savanna.',
    color: '#3B4749',
  },
  {
    id: 'zanzibar',
    name: 'Zanzibar',
    lat: -6.1659,
    lng: 39.2026,
    category: 'places',
    iconType: '🏝️',
    shortName: 'Zanzibar',
    subtitle: 'Spice Island & Stone Town Heritage',
    badge: 'Beach & Culture',
    zoom: 9,
    circuit: 'coastal',
    tourQuery: 'Zanzibar',
    image: 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=800&q=80',
    animals: ['🐬 Spinner Dolphins', '🐢 Aldabra Tortoises', '🐠 Coral Reef Fish', '🐒 Red Colobus'],
    highlights:
      'The post-safari paradise: white sand beaches, turquoise lagoons, spice plantations and historic Stone Town alleys.',
    bestMonths: 'Year-round (dry sun Jun–Oct and Dec–Feb)',
    transit: '1 hour direct flight from Arusha (ARK) or Kilimanjaro (JRO)',
    terrain: 'Coral rag coastlines, white sand beaches, spice farms, mangroves.',
    color: '#2A7B88',
  },
  {
    id: 'nyerere',
    name: 'Nyerere National Park',
    lat: -7.7,
    lng: 38.05,
    category: 'places',
    iconType: '🐘',
    shortName: 'Nyerere',
    subtitle: 'Selous Wilderness & Rufiji Floodplain',
    badge: 'Africa’s Largest Reserve',
    zoom: 8,
    circuit: 'southern',
    tourQuery: 'Nyerere',
    image:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6e/Giraffe_at_Nyerere_National_Park.jpg/960px-Giraffe_at_Nyerere_National_Park.jpg',
    credit: 'Rwebogora',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://commons.wikimedia.org/wiki/File:Giraffe_at_Nyerere_National_Park.jpg',
    animals: ['🐘 Large Elephant herds', '🐆 Leopard', '🦁 Lion', '🐕 Wild Dog', '🦩 Rufiji flamingos'],
    highlights:
      'Formerly Selous — the largest protected area in Africa, roughly three times the size of the Serengeti, with one of the healthiest elephant populations on the continent.',
    bestMonths: 'June to October; wildlife concentrates along the rivers',
    transit: 'Fly to Dar es Salaam or Kilwa, then 4x4 transfer (no road access from Arusha)',
    terrain: 'Miombo woodland, riverine floodplain, sand banks, hot springs.',
    color: '#26332F',
  },
  {
    id: 'ruaha',
    name: 'Ruaha National Park',
    lat: -7.9,
    lng: 34.9,
    category: 'places',
    iconType: '🌳',
    shortName: 'Ruaha',
    subtitle: 'Baobabs, Giraffes & Great Ruaha Gorges',
    badge: 'Baobab Country',
    zoom: 8,
    circuit: 'southern',
    tourQuery: 'Ruaha',
    image:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d7/Ruaha_National_Park_Panorama.jpg/960px-Ruaha_National_Park_Panorama.jpg',
    credit: 'PJvanErp',
    license: 'CC BY-SA 2.5',
    licenseUrl: 'https://commons.wikimedia.org/wiki/File:Ruaha_National_Park_Panorama.jpg',
    animals: ['🦒 Giraffe (rare elsewhere)', '🐘 Elephants', '🐆 Leopard', '🦁 Lion', '🌳 Giant baobabs'],
    highlights:
      'Tanzania’s best-kept secret, with huge giraffe and elephant numbers along the Great Ruaha River and baobab-studded plains.',
    bestMonths: 'June to October; wildlife gathers along the Great Ruaha',
    transit: 'Fly to Kilimanjaro or Dar, then 4x4 transfer',
    terrain: 'Baobab-dotted plains, miombo woodland, riverine thickets, oxbow gorges.',
    color: '#4A5D5A',
  },
];

/** Curated bottom quick-nav, in the order it should read. */
export const QUICK_NAV_IDS = [
  'serengeti',
  'ngorongoro',
  'tarangire',
  'lake-manyara',
  'arusha-gateway',
  'kilimanjaro',
  'maasai-mara',
];

/**
 * Species core ranges. Radii are metres and deliberately indicative — they
 * show where a species is reliably found, not a surveyed distribution edge.
 */
export const MAP_HABITATS = [
  {
    id: 'black-rhino',
    name: 'Black Rhino',
    iconType: '🦏',
    color: '#4A4A4A',
    status: 'Critically endangered',
    summary:
      'Tanzania’s stronghold is the Ngorongoro Crater, home to the country’s largest intact population. A small remnant survives in the Serengeti.',
    ranges: [
      { lat: -3.24, lng: 35.48, radius: 11000, label: 'Ngorongoro Crater', parkId: 'ngorongoro' },
      { lat: -2.3333, lng: 34.8333, radius: 9000, label: 'Serengeti', parkId: 'serengeti' },
    ],
  },
  {
    id: 'elephant',
    name: 'African Elephant',
    iconType: '🐘',
    color: '#8A5A36',
    status: 'Endangered',
    summary:
      'Tarangire holds some of the largest family herds in East Africa, while Amboseli is famous for big-tusker bulls against Kilimanjaro.',
    ranges: [
      { lat: -3.8333, lng: 36.0, radius: 22000, label: 'Tarangire', parkId: 'tarangire' },
      { lat: -2.6527, lng: 37.2606, radius: 16000, label: 'Amboseli', parkId: 'amboseli' },
      { lat: -3.24, lng: 35.48, radius: 9000, label: 'Ngorongoro Crater', parkId: 'ngorongoro' },
    ],
  },
  {
    id: 'lion',
    name: 'Lion',
    iconType: '🦁',
    color: '#C9683D',
    status: 'Vulnerable',
    summary:
      'Crater lions on the Ngorongoro floor are a distinct, fully enclosed population. Tarangire and Lake Manyara are where to look for lions climbing trees.',
    ranges: [
      { lat: -3.24, lng: 35.48, radius: 10000, label: 'Ngorongoro Crater', parkId: 'ngorongoro' },
      { lat: -2.3333, lng: 34.8333, radius: 30000, label: 'Serengeti', parkId: 'serengeti' },
      { lat: -3.8333, lng: 36.0, radius: 14000, label: 'Tarangire', parkId: 'tarangire' },
      { lat: -3.6, lng: 35.8, radius: 9000, label: 'Lake Manyara', parkId: 'lake-manyara' },
    ],
  },
  {
    id: 'leopard',
    name: 'Leopard',
    iconType: '🐆',
    color: '#8A5A36',
    status: 'Vulnerable',
    summary:
      'The Serengeti supports one of the highest leopard densities on earth, helped by abundant fig and acacia along the riverine belts.',
    ranges: [
      { lat: -2.3333, lng: 34.8333, radius: 28000, label: 'Serengeti', parkId: 'serengeti' },
      { lat: -3.24, lng: 35.48, radius: 8000, label: 'Ngorongoro Crater', parkId: 'ngorongoro' },
      { lat: -1.49, lng: 35.1438, radius: 20000, label: 'Maasai Mara', parkId: 'maasai-mara' },
    ],
  },
  {
    id: 'wild-dog',
    name: 'African Wild Dog',
    iconType: '🐕',
    color: '#B85D38',
    status: 'Endangered',
    summary:
      'One of Africa’s rarest mammals. The Ngorongoro Crater supports one of the continent’s most reliable populations, best sought with an experienced tracker.',
    ranges: [
      { lat: -3.24, lng: 35.48, radius: 9500, label: 'Ngorongoro Crater', parkId: 'ngorongoro' },
      { lat: -2.3333, lng: 34.8333, radius: 22000, label: 'Serengeti', parkId: 'serengeti' },
      { lat: -1.49, lng: 35.1438, radius: 16000, label: 'Maasai Mara', parkId: 'maasai-mara' },
    ],
  },
  {
    id: 'migration',
    name: 'Great Migration',
    iconType: '🦓',
    color: '#C9683D',
    status: 'Seasonal',
    summary:
      'Roughly 1.5M wildebeest, zebra and gazelle loop through the Serengeti, with the famous Mara River crossings peaking around July–October.',
    ranges: [
      { lat: -2.3333, lng: 34.8333, radius: 32000, label: 'Serengeti', parkId: 'serengeti' },
      { lat: -1.65, lng: 34.9, radius: 14000, label: 'Mara River crossings', parkId: 'serengeti' },
      { lat: -1.49, lng: 35.1438, radius: 20000, label: 'Maasai Mara', parkId: 'maasai-mara' },
    ],
  },
  {
    id: 'cheetah',
    name: 'Cheetah',
    iconType: '🐆',
    color: '#4A5D5A',
    status: 'Vulnerable',
    summary:
      'Open, gently sloping grasslands suit a pursuit hunter, making the Serengeti plains and the Mara among the best places in Africa to see cheetah.',
    ranges: [
      { lat: -2.3333, lng: 34.8333, radius: 28000, label: 'Serengeti', parkId: 'serengeti' },
      { lat: -1.49, lng: 35.1438, radius: 18000, label: 'Maasai Mara', parkId: 'maasai-mara' },
    ],
  },
];

/** Activities tied to a named place rather than generic safari days. */
export const MAP_ACTIVITIES = [
  {
    id: 'balloon',
    name: 'Hot-air balloon safari',
    lat: -2.6,
    lng: 34.82,
    category: 'activities',
    iconType: '🎈',
    color: '#C9683D',
    parkId: 'serengeti',
    detail: 'Dawn launch over the short-grass plains, followed by a bush breakfast and a landing “surprise”.',
  },
  {
    id: 'crater-sunrise',
    name: 'Crater rim sunrise',
    lat: -3.19,
    lng: 35.54,
    category: 'activities',
    iconType: '🌅',
    color: '#3B4749',
    parkId: 'ngorongoro',
    detail: 'Early descent to the crater floor to be on the plain when wildlife wakes, ahead of the day game drives.',
  },
  {
    id: 'tree-lions',
    name: 'Tree-climbing lions',
    lat: -3.6,
    lng: 35.8,
    category: 'activities',
    iconType: '🌳',
    color: '#8A5A36',
    parkId: 'lake-manyara',
    detail: 'A defining Manyara and Tarangire experience — big cats resting high in the mahogany and acacia canopy.',
  },
  {
    id: 'night-drive',
    name: 'Night game drive',
    lat: -3.75,
    lng: 36.05,
    category: 'activities',
    iconType: '🌙',
    color: '#26332F',
    parkId: 'tarangire',
    detail: 'Spotlighting for genet, civet, aardvark and hunting leopard after dark. Not permitted inside the Ngorongoro Crater.',
  },
  {
    id: 'maasai-village',
    name: 'Maasai village visit',
    lat: -3.29,
    lng: 35.51,
    category: 'activities',
    iconType: '🪘',
    color: '#B85D38',
    parkId: 'ngorongoro',
    detail: 'A hosted visit to a boma beside the crater rim, with a walk-through of the enclosures and livestock traditions.',
  },
  {
    id: 'mara-crossing',
    name: 'River crossing season',
    lat: -1.5,
    lng: 35.0,
    category: 'activities',
    iconType: '🌊',
    color: '#2A7B88',
    parkId: 'maasai-mara',
    detail: 'July–October is the window for wildebeest pouring across the Mara River, with crocodile waits and a relentless game drive.',
  },
  {
    id: 'kili-trek',
    name: 'Kilimanjaro trek start',
    lat: -3.15,
    lng: 37.42,
    category: 'activities',
    iconType: '🎒',
    color: '#4A5D5A',
    parkId: 'kilimanjaro',
    detail: 'Trailheads at Marangu, Machame and Lemosho sit within a few hours of Arusha, usually paired with a short northern safari.',
  },
  {
    id: 'birding',
    name: 'Birding hotspot',
    lat: -3.53,
    lng: 35.82,
    category: 'activities',
    iconType: '🦜',
    color: '#4A5D5A',
    parkId: 'lake-manyara',
    detail: 'The Rift Valley lake and its ground-water forest draw a rich mix of Rift Valley and coastal species.',
  },
  {
    id: 'stone-town',
    name: 'Stone Town heritage walk',
    lat: -6.162,
    lng: 39.189,
    category: 'activities',
    iconType: '🕌',
    color: '#2A7B88',
    parkId: 'zanzibar',
    detail: 'A guided walk through the old Arab quarter, the old slave-market site, the fort and the Sultan’s Palace.',
  },
  {
    id: 'dolphins',
    name: 'Dolphin & snorkelling trip',
    lat: -6.45,
    lng: 39.5,
    category: 'activities',
    iconType: '🐬',
    color: '#2A7B88',
    parkId: 'zanzibar',
    detail: 'South-east Zanzibar waters are the reliable place to swim with spinner dolphins and see the reef from a dhow.',
  },
];

/** Route polylines. `mode` separates overland legs from scheduled flights. */
export const MAP_ROUTES = [
  {
    id: 'northern-circuit',
    name: 'Classical Northern Safari Circuit',
    category: 'places',
    mode: 'drive',
    circuit: 'northern',
    color: '#C9683D',
    coords: [
      [-3.3869, 36.683],
      [-3.8333, 36.0],
      [-3.6, 35.8],
      [-3.24, 35.48],
      [-2.3333, 34.8333],
    ],
  },
  {
    id: 'cross-border',
    name: 'Cross-Border Migration Corridor',
    category: 'places',
    mode: 'drive',
    circuit: 'kenya',
    color: '#4A5D5A',
    coords: [
      [-2.3333, 34.8333],
      [-1.49, 35.1438],
      [-2.6527, 37.2606],
      [-3.0674, 37.3556],
      [-3.3869, 36.683],
    ],
  },
  {
    id: 'bush-to-beach',
    name: 'Bush to Beach Safari Flight',
    category: 'places',
    mode: 'fly',
    circuit: 'coastal',
    color: '#2A7B88',
    coords: [
      [-3.3869, 36.683],
      [-6.1659, 39.2026],
    ],
  },
];

export const DEFAULT_VIEW = { center: [-4.6, 36.9], zoom: 5 };

export const WHATSAPP_NUMBER = '255657253723';

export function locationById(id) {
  return MAP_LOCATIONS.find(l => l.id === id) || null;
}