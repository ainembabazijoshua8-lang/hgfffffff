import { lazy, Suspense, useEffect, useRef } from 'react';
import { Link, Routes, Route, useLocation, useNavigationType } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import WhatsAppFloater from './components/WhatsAppFloater.jsx';
import NewsletterModal from './components/NewsletterModal.jsx';
import { ToastProvider } from './components/Toast.jsx';
import HomePage from './pages/HomePage.jsx';
import ToursPage from './pages/ToursPage.jsx';
import { CurrencyProvider } from './context/CurrencyContext.jsx';

// Home and /tours stay eager — they are the landing pages. Everything else is
// split out. GalleryPage alone pulls in the 36 KB photo catalog, which
// previously shipped in the main chunk that every visitor downloaded before
// choosing to open the gallery.
const TourDetailPage = lazy(() => import('./pages/TourDetailPage.jsx'));
const AboutPage = lazy(() => import('./pages/AboutPage.jsx'));
const ContactPage = lazy(() => import('./pages/ContactPage.jsx'));
const ActivitiesPage = lazy(() => import('./pages/ActivitiesPage.jsx'));
const GalleryPage = lazy(() => import('./pages/GalleryPage.jsx'));
const BlogPage = lazy(() => import('./pages/BlogPage.jsx'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage.jsx'));
const FAQPage = lazy(() => import('./pages/FAQPage.jsx'));
const TermsPage = lazy(() => import('./pages/TermsPage.jsx'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage.jsx'));
const BookingPage = lazy(() => import('./pages/BookingPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));
const ThankYouPage = lazy(() => import('./pages/ThankYouPage.jsx'));

/**
 * Route-level fallback. Kept deliberately plain and non-flashing: a spinner that
 * flashes for 80 ms on a fast connection reads as a glitch, whereas reserving
 * the viewport height avoids the layout jump without advertising a load.
 */
function RouteFallback() {
  return (
    <div
      className="min-h-[60vh]"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    />
  );
}

const scrollPositions = new Map();

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navType = useNavigationType();
  const previousPathRef = useRef(pathname);

  useEffect(() => {
    const previousPath = previousPathRef.current;
    previousPathRef.current = pathname;

    if (hash) {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (target) {
        target.scrollIntoView({ block: 'start' });
        return;
      }
    }

    // A fresh navigation always starts at the top.
    if (navType === 'PUSH') {
      window.scrollTo(0, 0);
      return;
    }

    // Going back or forward restores where the reader left off.
    if (navType === 'POP' && previousPath !== pathname) {
      const saved = scrollPositions.get(pathname);
      if (typeof saved === 'number') {
        requestAnimationFrame(() => window.scrollTo(0, saved));
        return;
      }
    }

    window.scrollTo(0, 0);
  }, [pathname, hash, navType]);

  useEffect(() => {
    const savePosition = () => scrollPositions.set(pathname, window.scrollY);
    window.addEventListener('beforeunload', savePosition);
    return () => {
      savePosition();
      window.removeEventListener('beforeunload', savePosition);
    };
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <CurrencyProvider>
      <ToastProvider>
        {/* min-h-screen resolves to min-height:100vh, which on iOS Safari measures the
            viewport *including* the area behind the dynamic URL bar. The shell
            then renders taller than the visible area, producing a phantom
            scroll on every short page. 100dvh tracks the real viewport; the
            plain 100vh declaration is kept first as the fallback for engines
            without dvh support. HomePage and ImageLightbox already use
            svh/dvh — this was the one wrapper that did not. */}
        <div className="min-h-screen min-h-[100dvh] flex flex-col">
          <ScrollToTop />
          <Header />
          <main className="flex-1 pb-20 lg:pb-0">
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/tours" element={<ToursPage />} />
                <Route path="/tours/:slug" element={<TourDetailPage />} />
                <Route path="/booking" element={<BookingPage />} />
                <Route path="/activities" element={<ActivitiesPage />} />
                <Route path="/gallery" element={<GalleryPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/faq" element={<FAQPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPolicyPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:slug" element={<BlogPostPage />} />
                <Route path="/thank-you" element={<ThankYouPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </main>
          <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 gap-2 border-t border-savanna-200 bg-cream-50/95 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-lg backdrop-blur lg:hidden">
            <Link to="/booking#trip-planner" className="btn-primary py-3">Plan a Safari</Link>
            <a href="https://wa.me/255657253723" target="_blank" rel="noreferrer" className="btn-ghost border border-teal-200 py-3 text-center">WhatsApp</a>
          </div>
          <Footer />
          <WhatsAppFloater />
          {/* Self-managing: it arms its own delayed/scroll trigger and cleans up on
              unmount, so it is mounted once at the app root. */}
          <NewsletterModal />
        </div>
      </ToastProvider>
    </CurrencyProvider>
  );
}
