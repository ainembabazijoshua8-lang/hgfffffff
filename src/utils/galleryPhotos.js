import { GALLERY_PHOTOS } from '../data/galleryCatalog.js';

/**
 * Resolves verified, credited gallery photos for a map location.
 *
 * The join is an explicit alias list rather than fuzzy matching on park names.
 * Gallery `location` strings are free text ("Zanzibar coast", "Stone Town,
 * Zanzibar") and map locations use their own labels, so a substring match would
 * eventually put a photo of the wrong place under a pin. Every mapping below
 * was checked by hand against GALLERY_PHOTOS.location.
 *
 * Only photos that carry a credit and a licence are returned: the drawer renders
 * the attribution, so an unattributed record would produce an uncredited image.
 */

// Map location id -> gallery `location` values that genuinely depict it.
const LOCATION_ALIASES = {
  serengeti: ['Serengeti National Park', 'Northern Serengeti'],
  ngorongoro: ['Ngorongoro Conservation Area'],
  tarangire: ['Tarangire National Park'],
  'lake-manyara': ['Lake Manyara National Park'],
  'arusha-gateway': ['Arusha Region', 'Mount Meru'],
  kilimanjaro: ['Kilimanjaro Region'],
  'maasai-mara': ['Maasai Mara, Kenya'],
  zanzibar: [
    'Zanzibar coast',
    'Stone Town, Zanzibar',
    'Zanzibar City',
    'Zanzibar',
    'Jambiani, Zanzibar',
    'Indian Ocean near Zanzibar',
  ],
  ruaha: ['Ruaha National Park'],
  // Nyerere (Selous) and Amboseli have no matching gallery records. They return
  // an empty list rather than borrowing another park's photos.
};

const INDEX = (() => {
  const map = new Map();
  for (const [id, aliases] of Object.entries(LOCATION_ALIASES)) {
    const ids = new Set();
    for (const photo of GALLERY_PHOTOS) {
      if (!aliases.includes(photo.location)) continue;
      if (!photo.credit || !photo.license || !photo.licenseUrl) continue;
      if (!photo.image || !photo.source) continue;
      ids.add(photo.id);
    }
    map.set(id, [...ids]);
  }
  return map;
})();

/**
 * @param {string} locationId e.g. 'serengeti'
 * @param {number} [limit=4]
 * @returns {Array<{id,image,source,credit,license,licenseUrl,caption,title}>}
 */
export function photosForLocation(locationId, limit = 4) {
  const ids = INDEX.get(locationId);
  if (!ids || !ids.length) return [];
  return GALLERY_PHOTOS.filter(p => ids.includes(p.id)).slice(0, limit);
}

/** Distinct credits + licences for a set of photos, for a single attribution line. */
export function attributionFor(photos) {
  const credits = [...new Set(photos.map(p => p.credit))];
  const licenses = [...new Set(photos.map(p => p.license))];
  if (!credits.length) return null;
  return {
    credits,
    licenses,
    // One link per distinct licence; all point at the licence deed.
    licenseUrls: [...new Map(photos.map(p => [p.license, p.licenseUrl])).entries()],
  };
}