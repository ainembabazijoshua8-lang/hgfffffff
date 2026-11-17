import { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { WHATSAPP_NUMBER } from '../../data/mapData.js';
import { attributionFor, photosForLocation } from '../../utils/galleryPhotos.js';

/**
 * Portaled location detail drawer.
 *
 * Rendered into <body>, not inside .safari-map-shell. The shell sets
 * `isolation: isolate`, which creates a stacking context, so an element inside
 * it can never paint above the z-50 WhatsApp floater or the z-40 sticky CTA no
 * matter how large its z-index. Portaling to body at z-55 puts it above both
 * while staying below the z-60 modal and z-70 lightbox.
 *
 * Layout is coordinated with the global widgets via drawerViewport.js, which
 * publishes body[data-map-drawer] and the --map-drawer-offset custom property.
 * This component only has to declare which mode it is in.
 */

function seasonalBar(months) {
  // months is a human string like "June–October". Rather than guess a parse,
  // render it as a labelled chip; inventing month-level data would be worse
  // than showing the operator's own wording.
  return (
    <div className="flex items-start gap-2 text-xs text-teal-800">
      <span aria-hidden="true">🗓️</span>
      <span>
        <strong>Best time:</strong> {months}
      </span>
    </div>
  );
}

export default function SafariMapDrawer({ location, open, isMobile, onClose, onPrev, onNext }) {
  const closeRef = useRef(null);

  // Hooks must stay above the early return below, or opening/closing the drawer
  // changes the hook count and React throws "rendered fewer hooks than expected".
  // `location` is undefined while closed, so key the memo off the id.
  const locationId = location?.id ?? null;
  const photos = useMemo(() => (locationId ? photosForLocation(locationId, 4) : []), [locationId]);
  const attribution = useMemo(() => attributionFor(photos), [photos]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = e => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    // Move focus into the drawer so keyboard and screen-reader users are not
    // left behind on the map canvas.
    closeRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !location) return null;

  const waMsg = `Hi Jebri Safaris! I'd like to plan a trip including *${location.name}* (${location.subtitle}).`;
  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waMsg)}`;

  const content = (
    <>
      {/* Header image doubles as the sheet grab handle on mobile. */}
      <div className="relative h-32 shrink-0">
        <img
          src={location.image}
          alt={`${location.name} — ${location.subtitle}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-teal-950/90 via-teal-950/25 to-transparent" />
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-cream-50/90 text-teal-900 flex items-center justify-center hover:bg-white transition"
          aria-label="Close location details"
        >
          ✕
        </button>
        <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display text-lg font-bold text-cream-50 leading-tight truncate">
              {location.name}
            </h3>
            <p className="text-[11px] text-cream-200 truncate">{location.subtitle}</p>
          </div>
          <span className="shrink-0 bg-teal-800/90 text-cream-50 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            {location.badge}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Conservation / status tags */}
        <div className="flex flex-wrap gap-1.5">
          {location.status ? (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sage-100 text-sage-800 border border-sage-200">
              {location.status}
            </span>
          ) : null}
          {(location.animals || []).slice(0, 3).map(a => (
            <span
              key={a}
              className="text-[10px] px-2 py-0.5 rounded-full bg-cream-100 text-teal-800 border border-savanna-200"
            >
              {a}
            </span>
          ))}
        </div>

        <p className="text-xs text-teal-700/85 leading-relaxed">{location.highlights}</p>

        <dl className="space-y-2 text-xs text-teal-800 bg-cream-100/70 p-3 rounded-xl border border-savanna-100">
          <div className="flex items-start gap-2">
            <dt aria-hidden="true">🗓️</dt>
            <dd>{seasonalBar(location.bestMonths)}</dd>
          </div>
          <div className="flex items-start gap-2">
            <dt aria-hidden="true">🚙</dt>
            <dd>
              <strong>Transit:</strong> {location.transit}
            </dd>
          </div>
          <div className="flex items-start gap-2">
            <dt aria-hidden="true">🌄</dt>
            <dd>
              <strong>Landscape:</strong> {location.terrain}
            </dd>
          </div>
        </dl>

        {photos.length > 0 && (
          <figure className="m-0">
            <div className="grid grid-cols-4 gap-1.5">
              {photos.map(photo => (
                <a
                  key={photo.id}
                  href={photo.source}
                  target="_blank"
                  rel="noreferrer noopener"
                  title={`${photo.title} — ${photo.credit}`}
                  className="block"
                >
                  <img
                    src={photo.image}
                    alt={photo.caption || photo.title}
                    loading="lazy"
                    className="w-full h-14 object-cover rounded-lg border border-savanna-200 hover:opacity-80 transition"
                  />
                </a>
              ))}
            </div>
            {attribution ? (
              <figcaption className="mt-1 text-[9px] leading-relaxed text-teal-600">
                Photos: {attribution.credits.join(', ')} (
                {attribution.licenseUrls.map(([name, url], i) => (
                  <span key={name}>
                    {i > 0 ? ', ' : ''}
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="underline hover:text-teal-800"
                    >
                      {name}
                    </a>
                  </span>
                ))}
                )
              </figcaption>
            ) : null}
          </figure>
        )}

        <div className="grid grid-cols-2 gap-2">
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer noopener"
            className="bg-[#25D366] hover:bg-[#1EBE5D] text-white py-2.5 px-3 rounded-full text-xs font-semibold transition text-center"
          >
            💬 WhatsApp
          </a>
          <a
            href={`/tours?q=${encodeURIComponent(location.tourQuery || location.name)}`}
            className="btn-primary py-2.5 px-3 rounded-full text-xs font-semibold text-center"
          >
            Browse tours
          </a>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={onPrev}
            className="text-xs font-semibold text-teal-700 hover:text-teal-900 px-2 py-1 rounded-lg hover:bg-cream-100"
          >
            ← Previous
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-teal-500 hover:text-teal-800 px-2 py-1 rounded-lg hover:bg-cream-100"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onNext}
            className="text-xs font-semibold text-teal-700 hover:text-teal-900 px-2 py-1 rounded-lg hover:bg-cream-100"
          >
            Next →
          </button>
        </div>
      </div>
    </>
  );

  return createPortal(
    <>
      {/* Scrim. Click-to-dismiss, but deliberately light so the map stays
          readable and the user keeps their spatial context. */}
      <div
        className="safari-map-drawer__scrim fixed inset-0 bg-teal-950/25 z-[54] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="false"
        aria-label={`${location.name} details`}
        className={`safari-map-drawer flex flex-col ${
          isMobile ? 'safari-map-drawer--sheet' : 'safari-map-drawer--side'
        }`}
      >
        {content}
      </aside>
    </>,
    document.body
  );
}