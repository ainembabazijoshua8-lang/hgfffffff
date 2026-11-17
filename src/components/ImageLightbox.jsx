import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function ImageLightbox({ src, alt, className = '', buttonClassName = '', showLabel = true }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    const trigger = triggerRef.current;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    const closeButton = document.querySelector('[data-lightbox-close]');
    closeButton?.focus();
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (trigger?.isConnected) trigger.focus();
    };
  }, [open]);

  if (!src) return null;

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setOpen(true)}
        className={`relative block cursor-zoom-in ${buttonClassName}`}
        aria-label={`View larger image${alt ? `: ${alt}` : ''}`}
        title="View photo"
      >
        <img src={src} alt={alt} loading="lazy" className={className} />
        <span className={`pointer-events-none absolute ${showLabel ? 'bottom-3 left-3 px-3' : 'bottom-2 left-2 px-2'} inline-flex items-center gap-2 rounded-full bg-teal-900/80 py-1.5 text-xs font-semibold text-cream-50 shadow-lg backdrop-blur transition group-hover:bg-teal-900/95`}>
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h6v6M14 10 21 3M9 21H3v-6M10 14l-7 7" />
          </svg>
          {showLabel && <span className="hidden sm:inline">View photo</span>}
        </span>
      </button>
      {open && (
        createPortal(
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-teal-900/90 p-4 sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-label={alt || 'Image viewer'}
            onClick={() => setOpen(false)}
          >
            <button
              type="button"
              data-lightbox-close
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-cream-50 text-2xl leading-none text-teal-800 shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-300"
              aria-label="Close image viewer"
            >
              ×
            </button>
            <img
              src={src}
              alt={alt}
              className="max-h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)] rounded-lg object-contain shadow-2xl sm:max-h-[calc(100dvh-4rem)] sm:max-w-[calc(100vw-4rem)]"
              onClick={(event) => event.stopPropagation()}
            />
          </div>,
          document.body
        )
      )}
    </>
  );
}
