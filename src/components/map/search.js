/**
 * Autocomplete index for parks, wildlife and activities.
 *
 * Built once per data change rather than per keystroke. Ranking is deliberately
 * simple and predictable: an exact/prefix name match always outranks a
 * substring match, which always outranks a keyword or description hit. For a
 * destination list of this size a full fuzzy matcher adds latency and
 * surprising results for no practical benefit.
 */

export function buildSearchIndex(locations, activities, wildlife = []) {
  const entries = [];

  locations.forEach(l => {
    entries.push({
      id: l.id,
      kind: 'Park',
      icon: l.iconType,
      title: l.name,
      subtitle: l.subtitle,
      haystack: [l.name, l.shortName, l.subtitle, ...(l.animals || [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase(),
      loc: l,
    });
  });

  activities.forEach(a => {
    entries.push({
      id: a.id,
      kind: 'Activity',
      icon: a.iconType,
      title: a.name,
      subtitle: a.detail?.slice(0, 70) || '',
      haystack: [a.name, a.detail].filter(Boolean).join(' ').toLowerCase(),
      loc: a,
    });
  });

  wildlife.forEach(w => {
    entries.push({
      id: w.id,
      kind: 'Wildlife',
      icon: 'paw',
      title: w.name,
      subtitle: w.habitat || '',
      haystack: [w.name, w.habitat].filter(Boolean).join(' ').toLowerCase(),
      loc: w,
    });
  });

  return entries;
}

/**
 * Rank matches against the query. Returns at most `limit` results.
 * Exported separately from the index so it is directly unit-testable.
 */
export function search(index, query, limit = 8) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const scored = [];
  for (const entry of index) {
    const title = entry.title.toLowerCase();
    let score = 0;

    if (title === q) score = 100;
    else if (title.startsWith(q)) score = 80;
    else if (title.includes(q)) score = 60;
    else if (entry.haystack.startsWith(q)) score = 40;
    else if (entry.haystack.includes(q)) score = 20;

    if (score > 0) scored.push({ ...entry, score });
  }

  scored.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  return scored.slice(0, limit);
}

/** Count within the current circuit selection, so the badges reflect the filter. */
export function scopedCounts(locations, activities, habitats, circuit) {
  const inCircuit = item => circuit === 'all' || item.circuit === circuit;
  const parkIds = new Set(locations.filter(inCircuit).map(l => l.id));

  return {
    places: locations.filter(inCircuit).length,
    habitats: habitats.length,
    activities: activities.filter(a => parkIds.has(a.parkId)).length,
  };
}