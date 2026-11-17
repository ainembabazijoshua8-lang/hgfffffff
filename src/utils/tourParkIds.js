const LOCATION_KEYWORDS = [
  ['kilimanjaro', 'kilimanjaro'],
  ['zanzibar', 'zanzibar'],
  ['serengeti', 'serengeti'],
  ['ngorongoro', 'ngorongoro'],
  ['tarangire', 'tarangire'],
  ['manyara', 'lake-manyara'],
  ['nyerere', 'nyerere'],
  ['selous', 'nyerere'],
  ['ruaha', 'ruaha'],
  ['arusha', 'arusha-gateway'],
  ['amboseli', 'amboseli'],
  ['mara', 'maasai-mara'],
];

/**
 * Derive the map pins a tour actually visits from its title, location and
 * summary, so the detail-page map opens on the right destinations.
 * Kept in its own module so importing it does not pull in the map bundle.
 */
export function tourParkIds(tour) {
  if (!tour) return [];
  const haystack =
    `${tour.title || ''} ${tour.location || ''} ${(tour.summary || '').slice(0, 200)}`.toLowerCase();
  const ids = [];
  LOCATION_KEYWORDS.forEach(([keyword, id]) => {
    if (haystack.includes(keyword) && !ids.includes(id)) ids.push(id);
  });
  return ids;
}

export default tourParkIds;