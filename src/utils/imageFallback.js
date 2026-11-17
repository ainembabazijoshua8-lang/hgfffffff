// Maps local /assets/* paths to Unsplash fallbacks when files are missing from public/
const FALLBACKS = new Map();

export function unsplashUrl(id, w = 1200) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;
}

/** Register a local path with an Unsplash fallback; returns the local path (or fallback if none). */
export function registerImage(localPath, unsplashId, w = 1200) {
  const fallback = unsplashUrl(unsplashId, w);
  if (localPath) FALLBACKS.set(localPath, fallback);
  return localPath || fallback;
}

export function getImageFallback(src) {
  if (!src) return null;
  if (FALLBACKS.has(src)) return FALLBACKS.get(src);
  try {
    if (src.startsWith('http')) return null;
    const path = src.startsWith('/') ? src : new URL(src, window.location.origin).pathname;
    return FALLBACKS.get(path) || null;
  } catch {
    return null;
  }
}

/** Install a capture-phase listener so any broken local image swaps to its fallback. */
export function installImageFallbackHandler() {
  // Static site assets referenced outside the data catalogs
  registerImage('/assets/images/logo.jpg', 'photo-1547471080-7cc2caa01a7e');
  registerImage('/assets/images/hero-backpack.jpg', 'photo-1486325212027-8081e485255e', 1920);
  registerImage('/assets/images/hero-backpack-2.jpg', 'photo-1518684079-3c830dcef090', 1920);
  registerImage('/assets/images/hero-backpack-3.jpg', 'photo-1535083783855-76ae62b2914e', 1920);
  registerImage('/assets/images/instagram-qr.jpg', 'photo-1611162616475-46b635cb6848');

  document.addEventListener('error', (e) => {
    const el = e.target;
    if (el?.tagName !== 'IMG') return;
    const fallback = getImageFallback(el.getAttribute('src'));
    if (fallback && el.src !== fallback) {
      // M-3: also clear srcset candidates so the browser doesn't pick a
      // different broken image after we assign a working fallback. After
      // the swap, the single src IS the truth.
      el.removeAttribute('srcset');
      el.removeAttribute('sizes');
      el.src = fallback;
    }
  }, true);
}
