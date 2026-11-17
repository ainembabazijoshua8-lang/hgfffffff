import { useEffect, useMemo, useState } from 'react';
import ImageLightbox from '../components/ImageLightbox.jsx';
import { GALLERY_CATEGORIES, GALLERY_ITEMS } from '../data/galleryCatalog.js';

const CATEGORY_LABEL = {
  wildlife: 'Wildlife',
  parks: 'National park',
  zanzibar: 'Zanzibar',
  videos: 'Video',
};

export default function GalleryPage() {
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    document.title = 'Photo Gallery | Jebri Safaris';
  }, []);

  const visiblePhotos = useMemo(() => {
    const search = query.trim().toLowerCase();
    return GALLERY_ITEMS.filter(photo => (
      (category === 'all' || photo.category === category) &&
      (!search || `${photo.title} ${photo.location} ${photo.caption}`.toLowerCase().includes(search))
    ));
  }, [category, query]);

  const countFor = (id) => id === 'all'
    ? GALLERY_ITEMS.length
    : GALLERY_ITEMS.filter(photo => photo.category === id).length;

  return (
    <div className="bg-cream-50 pb-20 pt-10 sm:pt-14">
      <header className="container-x border-b border-savanna-200 pb-8 sm:pb-10">
        <span className="eyebrow">Photo stories from Tanzania</span>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl leading-tight text-teal-900 sm:text-5xl">Wildlife, parks & Zanzibar</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-teal-700/80 sm:text-base">
              Browse savannah species, scenes from Tanzania&rsquo;s national parks, island life in Zanzibar, and a short reel of wildlife video. Every item links to its Wikimedia Commons source and license.
            </p>
          </div>
          <span className="font-mono text-sm text-teal-600">{GALLERY_ITEMS.length} items</span>
        </div>
      </header>

      <section className="container-x pt-6" aria-label="Photo gallery">
        <div className="mb-6 flex flex-col gap-4 border-b border-savanna-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter photos by collection">
            {[{ id: 'all', label: 'All photos' }, ...GALLERY_CATEGORIES.map(({ id, label }) => ({ id, label }))].map(filter => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setCategory(filter.id)}
                aria-pressed={category === filter.id}
                className={`min-h-10 rounded-md border px-3 py-2 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-400 ${
                  category === filter.id
                    ? 'border-teal-800 bg-teal-800 text-cream-50'
                    : 'border-savanna-200 bg-white text-teal-800 hover:border-teal-700'
                }`}
              >
                {filter.label} <span className="ml-1 opacity-70">{countFor(filter.id)}</span>
              </button>
            ))}
          </div>

          <label className="relative block w-full lg:max-w-xs">
            <span className="sr-only">Search gallery</span>
            <input
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search animals, parks, places…"
              className="field min-h-10 bg-white py-2 pr-10 text-sm"
            />
            <span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-teal-600">⌕</span>
          </label>
        </div>

        <p className="mb-4 text-xs text-teal-600" aria-live="polite">
          Showing {visiblePhotos.length} photo{visiblePhotos.length === 1 ? '' : 's'}
        </p>

        {visiblePhotos.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visiblePhotos.map(photo => (
              <article key={photo.id} className="overflow-hidden rounded-md border border-savanna-200 bg-white">
                {photo.type === 'video' ? (
                  <div className="relative aspect-[4/3] w-full bg-linen">
                    {/* preload="none" matters: these clips are 10-100 MB each, so
                        nothing should download until the visitor presses play. */}
                    <video
                      className="h-full w-full object-cover"
                      controls
                      preload="none"
                      poster={photo.image}
                      playsInline
                      aria-label={photo.title}
                    >
                      <source src={photo.video} type="video/webm" />
                      Your browser cannot play this clip. <a href={photo.video}>Download the video</a> instead.
                    </video>
                  </div>
                ) : (
                  <ImageLightbox
                    src={photo.image}
                    alt={`${photo.title} in ${photo.location}`}
                    className="aspect-[4/3] w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                    buttonClassName="w-full overflow-hidden bg-linen"
                    showLabel={false}
                  />
                )}
                <div className="p-3.5">
                  <p className="font-mono text-[10px] uppercase tracking-wide text-terracotta-600">
                    {CATEGORY_LABEL[photo.category] || photo.category}
                  </p>
                  <h2 className="mt-1 font-display text-lg leading-snug text-teal-900">{photo.title}</h2>
                  <p className="mt-1 text-xs text-teal-600">{photo.location}</p>
                  <p className="mt-2 min-h-8 text-xs leading-relaxed text-teal-700/80">{photo.caption}</p>
                  <p className="mt-3 border-t border-savanna-100 pt-2 text-[10px] leading-relaxed text-teal-600">
                    Photo: <a href={photo.source} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-2">{photo.credit}</a>
                    {' · '}
                    <a href={photo.licenseUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">{photo.license}</a>
                    {' · Wikimedia Commons'}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="border-y border-savanna-200 py-16 text-center">
            <p className="font-display text-xl text-teal-900">No photos match that search.</p>
            <button type="button" onClick={() => { setQuery(''); setCategory('all'); }} className="mt-3 text-sm font-semibold text-terracotta-600 underline underline-offset-4">
              Clear filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
