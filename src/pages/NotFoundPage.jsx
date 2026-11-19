import { Link } from 'react-router-dom';
import { SiteIcon } from '../components/Icons.jsx';

export default function NotFoundPage() {
  return (
    <section className="relative bg-teal-800 text-cream-50 py-32 text-center min-h-[60vh] flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-hero-vignette opacity-50 mix-blend-multiply" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,104,61,0.15),transparent_50%)]" />
      
      <div className="relative z-10 animate-slide-up max-w-md mx-auto">
        <SiteIcon name="compass" className="text-7xl mb-6 text-terracotta-300 drop-shadow-lg" />
        <h1 className="font-display text-5xl md:text-6xl text-cream-50 drop-shadow-sm mb-4">Lost on the savanna</h1>
        <p className="text-cream-50/90 text-lg font-light leading-relaxed mb-8">
          We can't find the page you're looking for. But the giraffes spotted you.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link to="/" className="btn-primary shadow-md">Back to home</Link>
          <Link to="/tours" className="btn-outline border-white/30 hover:bg-white/10 text-cream-50">Browse tours →</Link>
        </div>
      </div>
    </section>
  );
}
