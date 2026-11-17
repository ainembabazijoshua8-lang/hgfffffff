import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

export default function ThankYouPage() {
  const [params] = useSearchParams();
  const ref = params.get('ref') || '';
  const kind = params.get('kind') || 'inquiry';
  const emailDelivered = params.get('mail') !== '0';

  useEffect(() => {
    document.title = ref
      ? `Thank you — ${ref} | Jebri Safaris`
      : 'Thank you | Jebri Safaris';
  }, [ref]);

  return (
    <section className="relative bg-teal-800 text-cream-50 py-20 sm:py-24 min-h-[60vh] flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-hero-vignette opacity-50 mix-blend-multiply" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,104,61,0.15),transparent_50%)]" />
      <div className="container-x text-center max-w-2xl relative z-10 animate-slide-up">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-terracotta-400 to-terracotta-500 text-cream-50 flex items-center justify-center text-4xl mb-8 shadow-glow">✓</div>
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl drop-shadow-sm">Thank you — we got it.</h1>
        {ref && (
          <p className="mt-6 text-cream-50/90 text-lg">
            Reference: <span className="font-mono text-terracotta-300 bg-black/20 px-3 py-1 rounded-md">{ref}</span>
          </p>
        )}
        <p className="mt-5 text-cream-50/90 text-lg font-light leading-relaxed">
          {emailDelivered
            ? (kind === 'planner'
              ? 'Your custom trip plan is in our inbox. We will email you a tailored quote within 24 hours.'
              : 'Your message is in our inbox. We reply within 24 hours — usually much faster.')
            : 'Your request was saved successfully, but our email service is temporarily unavailable. Our team can still retrieve it and will follow up as soon as delivery is restored.'}
        </p>
        {!emailDelivered && (
          <div className="mx-auto mt-6 max-w-xl rounded-xl border border-terracotta-300/40 bg-black/20 p-4 text-sm text-cream-50/85">
            Please also contact us on WhatsApp if your request is urgent.
          </div>
        )}
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <Link to="/" className="btn-primary text-base shadow-md">Back to home</Link>
          <Link to="/tours" className="btn-outline border-white/30 hover:bg-white/10 text-base">Browse tours</Link>
        </div>
      </div>
    </section>
  );
}