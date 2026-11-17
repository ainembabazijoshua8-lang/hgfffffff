import { useState, useEffect } from 'react';

const STORAGE_KEY = 'jebri_newsletter_dismissed';
const SHOW_DELAY_MS = 45_000; // 45 seconds after page load

export default function NewsletterModal() {
  const [visible, setVisible] = useState(false);
  // Tracked separately from `visible` so dismissing the modal also disarms the
  // pending timer and the scroll trigger. Previously `dismiss()` only hid the
  // modal, so the 45s timer (and the 65%-scroll listener) stayed armed and
  // re-opened it moments after the visitor closed it.
  const [dismissed, setDismissed] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | ok | err

  useEffect(() => {
    if (dismissed) return undefined;
    try {
      if (localStorage.getItem(STORAGE_KEY)) return undefined;
    } catch { /* noop */ }

    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);

    const handleScroll = () => {
      const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      if (scrollPercent > 0.65) {
        setVisible(true);
        window.removeEventListener('scroll', handleScroll);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [dismissed]);

  function dismiss() {
    setDismissed(true);
    setVisible(false);
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* noop */ }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus('ok');
        try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* noop */ }
      } else {
        throw new Error(data.error || 'Could not subscribe');
      }
    } catch (err) {
      console.warn('Newsletter subscription failed:', err);
      setStatus('err');
    }
  }

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm animate-fade-up"
        onClick={dismiss}
      />
      {/* Modal */}
      <div className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-md bg-cream-50 dark:bg-teal-900 rounded-3xl shadow-2xl border border-savanna-200 dark:border-teal-700 overflow-hidden animate-fade-up"
          role="dialog"
          aria-modal="true"
          aria-label="Newsletter signup"
        >
          {/* Header image band */}
          <div className="h-32 bg-gradient-to-br from-teal-800 to-teal-950 relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,104,61,0.25),transparent_50%)]" />
            <span className="text-5xl relative z-10 drop-shadow-lg">🦁</span>
          </div>

          <div className="p-6 sm:p-8">
            {status === 'ok' ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-sage-100 text-sage-700 flex items-center justify-center text-2xl mb-3">✓</div>
                <h3 className="font-display text-2xl text-teal-800 dark:text-cream-50 font-bold">You're on the list!</h3>
                <p className="mt-2 text-teal-700/80 dark:text-cream-100/80 text-sm">Safari tips and migration updates will land in your inbox soon.</p>
                <button onClick={dismiss} className="btn-primary mt-5 text-sm">Continue exploring</button>
              </div>
            ) : (
              <>
                <h3 className="font-display text-2xl text-teal-800 dark:text-cream-50 font-bold text-center">
                  Free Safari Planning Guide
                </h3>
                <p className="mt-2 text-teal-700/80 dark:text-cream-100/80 text-sm text-center">
                  Get our expert packing list, migration calendar, and money-saving tips delivered straight to your inbox.
                </p>
                <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="field text-center"
                  />
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="btn-primary w-full disabled:opacity-50"
                  >
                    {status === 'loading' ? 'Subscribing…' : 'Send Me the Guide 📩'}
                  </button>
                  {status === 'err' && (
                    <p className="text-center text-sm text-red-600 mt-1">
                      Something went wrong. Please try again.
                    </p>
                  )}
                </form>
                <button
                  onClick={dismiss}
                  className="mt-3 w-full text-center text-xs text-teal-500 hover:text-terracotta-500 transition"
                >
                  No thanks, I'll explore on my own
                </button>
              </>
            )}
          </div>

          {/* Close X */}
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center text-sm hover:bg-black/50 transition"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>
    </>
  );
}
