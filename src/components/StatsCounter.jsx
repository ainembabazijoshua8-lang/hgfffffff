import { useEffect, useRef, useState } from 'react';

const STATS = [
  { value: 500, suffix: '+', label: 'Safaris completed', icon: '🦁' },
  { value: 12,  suffix: '',  label: 'National parks covered', icon: '🗺️' },
  { value: 98,  suffix: '%', label: 'Five-star guest rating', icon: '⭐' },
  { value: 24,  suffix: 'h', label: 'Quote turnaround', icon: '⚡' },
];

function useCountUp(target, duration = 1600, active = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return undefined;
    let start = null;
    let raf = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    // Without this the rAF chain keeps calling setCount after unmount (and a
    // dep change mid-animation would start a second competing loop).
    return () => { if (raf) cancelAnimationFrame(raf); };
  }, [active, target, duration]);
  return count;
}

function StatItem({ value, suffix, label, icon, active, delay }) {
  const count = useCountUp(value, 1600, active);
  return (
    <div
      className="flex flex-col items-center text-center px-4"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="text-3xl mb-2 animate-float" style={{ animationDelay: `${delay}ms` }}>{icon}</div>
      <div className="font-display text-5xl sm:text-6xl font-bold text-terracotta-400 tabular-nums drop-shadow-[0_0_15px_rgba(201,104,61,0.4)]">
        {count}{suffix}
      </div>
      <div className="mt-2 text-cream-100/85 text-sm font-medium tracking-wide">{label}</div>
    </div>
  );
}

export default function StatsCounter() {
  const ref = useRef(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setActive(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="relative bg-gradient-to-r from-teal-800 to-acacia py-16 sm:py-20 overflow-hidden">
      {/* Dot grid overlay */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #FAF7F2 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      <div className="container-x relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 divide-x-0 lg:divide-x divide-terracotta-400/20">
          {STATS.map((s, i) => (
            <StatItem key={s.label} {...s} active={active} delay={i * 120} />
          ))}
        </div>
      </div>
    </section>
  );
}
