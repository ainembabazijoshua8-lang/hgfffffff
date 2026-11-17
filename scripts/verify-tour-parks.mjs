import { tourParkIds } from '../src/utils/tourParkIds.js';

const tours = [
  { title: 'The 3-Day Serengeti & Ngorongoro Express', location: 'Serengeti & Ngorongoro, Tanzania' },
  { title: 'The 5-Day Classic Northern Circuit', location: 'Tarangire, Serengeti & Ngorongoro, Tanzania' },
  { title: 'The 7-Day Serengeti & Zanzibar Escape', location: 'Serengeti, Ngorongoro & Zanzibar, Tanzania' },
  { title: 'The 10-Day Honeymoon Safari & Beach Retreat', location: 'Tarangire, Serengeti, Ngorongoro & Zanzibar' },
  { title: 'The 8-Day Luxury Fly-In Safari', location: 'Arusha, Tarangire & Serengeti, Tanzania' },
  { title: 'The 6-Day Budget Group Camping Safari', location: 'Tarangire, Manyara, Serengeti & Ngorongoro, Tanzania' },
  { title: 'The 7-Day Tanzania Wildlife & Culture Safari', location: 'Manyara, Serengeti & Ngorongoro, Tanzania' },
  { title: 'The 10-Day Complete Northern Circuit & Beach', location: 'Northern Tanzania & Zanzibar' },
  { title: 'The 9-Day Southern Circuit Untamed', location: 'Nyerere & Ruaha, Tanzania' },
  { title: 'The 14-Day Ultimate Kili Climb & Safari', location: 'Kilimanjaro, Tarangire, Serengeti & Ngorongoro, Tanzania' },
];

const VALID = new Set([
  'serengeti', 'ngorongoro', 'tarangire', 'lake-manyara', 'arusha-gateway',
  'kilimanjaro', 'maasai-mara', 'amboseli', 'zanzibar', 'nyerere', 'ruaha',
]);

let failures = 0;
for (const tour of tours) {
  const ids = tourParkIds(tour);
  const unknown = ids.filter(id => !VALID.has(id));
  const ok = ids.length > 0 && unknown.length === 0;
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${tour.title}`);
  console.log(`      -> [${ids.join(', ')}]${unknown.length ? '  UNKNOWN: ' + unknown.join(',') : ''}`);
}
console.log(failures ? `\n${failures} FAILURES` : '\nAll tours mapped to valid parks.');
process.exit(failures ? 1 : 0);