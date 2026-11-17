import { useEffect, useState } from 'react';

export default function TrustStrip() {
  const [stats, setStats] = useState({ inquiries: 0, tours: 0, reviews: 0, avg_rating: null, years: 0 });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/stats')
      .then(r => r.json())
      .then(d => { if (!cancelled && d.ok) setStats(d.stats); })
      .catch((err) => { if (!cancelled) console.error('Failed to load stats:', err); });
    // Abort/ignore on unmount so a route change mid-request cannot call
    // setStats on a dead component.
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="bg-gradient-to-b from-cream-100 to-linen py-10 border-y border-savanna-100">
      <div className="container-x">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center mb-10">
          <Stat
            n={stats.reviews ? stats.reviews : '—'}
            label={stats.reviews ? 'Verified Guest Reviews' : 'Reviews Coming Soon'}
          />
          <Stat n={stats.tours || 'Curated'} label="Curated Tours" />
          <Stat
            n={stats.avg_rating ? `${stats.avg_rating}★` : '—'}
            label="Average Rating"
          />
          <Stat n={`${stats.years >= 1 ? stats.years : 'New'}`} label="Years of Service" />
        </div>
      </div>
    </section>
  );
}

function Stat({ n, label }) {
  return (
    <div>
      <div className="font-display text-4xl text-terracotta-400">{n}</div>
      <div className="text-sm text-teal-700/80 mt-1">{label}</div>
    </div>
  );
}
