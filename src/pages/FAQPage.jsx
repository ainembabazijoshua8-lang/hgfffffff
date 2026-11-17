import { useState } from 'react';
import { Link } from 'react-router-dom';
import PackingChecklist from '../components/PackingChecklist.jsx';
import { faqJsonLd, JsonLdScript } from '../utils/jsonLd.jsx';

const FAQ = [
  {
    cat: 'Planning',
    items: [
      { q: 'When is the best time to visit Tanzania?', a: 'The Great Migration is usually best viewed in the Serengeti from July–October, while calving season peaks in the southern Serengeti in January–February. Most safari routes are rewarding year-round, and we can match the itinerary to your priorities.' },
      { q: 'How far in advance should I book?', a: 'For peak season (June–October), book 6–12 months ahead. For shoulder seasons, 3 months is usually enough. Last-minute bookings are possible — just message us on WhatsApp.' },
      { q: 'Do I need a visa or vaccinations?', a: 'Most visitors need a visa for Tanzania or Kenya (often available as e-visa on arrival). Yellow fever vaccination is required if arriving from an endemic country. We send a full pre-departure pack including vaccine recommendations.' },
      { q: 'Is East Africa safe for tourists?', a: 'Yes. Tanzania and Kenya are among the safer African countries for travelers. Our guides are first-aid trained, our vehicles are equipped with satellite communicators, and all guests are covered by AMREF Flying Doctors evacuation insurance.' },
    ],
  },
  {
    cat: 'On safari',
    items: [
      { q: 'What should I pack?', a: 'Neutral colors (khaki, olive, beige), a warm layer for early-morning game drives, comfortable walking shoes, sunhat, sunglasses, binoculars, headlamp, and a good camera. Use our interactive packing checklist below to prepare!' },
      { q: 'How close do we get to the wildlife?', a: 'We always stay in the vehicle unless at a designated walking-safari site. Guides follow strict park rules — typically 20+ meters from large mammals — keeping you and the animals safe.' },
      { q: 'What is a typical day like?', a: 'Pre-dawn tea, sunrise game drive, breakfast back at camp, midday rest (it gets hot!), afternoon game drive, sundowners, dinner under the stars. Optional extras: balloon safaris, bush walks, cultural visits.' },
    ],
  },
  {
    cat: 'Booking & payment',
    items: [
      { q: 'How do I pay?', a: 'Secure deposit by credit card, PayPal, or bank transfer. Balance due 30 days before travel. Tanzania residents can pay via mobile money (M-Pesa, Tigo Pesa).' },
      { q: 'What is your cancellation policy?', a: 'Full refund minus non-refundable park fees if you cancel 60+ days out. 50% refund 30–60 days out. Less than 30 days: no refund — but we are flexible where possible. Travel insurance is included in all packages; cancellation claims remain subject to the insurer’s policy terms.' },
      { q: 'Is travel insurance included?', a: 'Yes. Comprehensive travel insurance is included for every traveler for the full booked trip across all packages. Your policy certificate sets out covered events, limits, exclusions, eligibility, and the claims process.' },
    ],
  },
  {
    cat: 'Sustainability',
    items: [
      { q: 'How do you support conservation?', a: '10% of every booking funds partner organizations working across Tanzania, including wildlife monitoring, community projects, and AMREF support.' },
      { q: 'Are the camps eco-friendly?', a: 'Where possible we use solar-powered camps, pack-in/pack-out waste protocols, and locally-owned properties. We do not use camps with exploitative animal interactions.' },
    ],
  },
];

function Item({ q, a, open, onToggle }) {
  return (
    <div className="border-b border-savanna-200/50 last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-300 rounded-lg group"
        aria-expanded={open}
      >
        <span className="font-semibold text-teal-800 text-lg group-hover:text-terracotta-500 transition-colors">{q}</span>
        <span className={`ml-4 text-terracotta-400 text-xl transition-transform duration-300 ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      <div className={`grid transition-all duration-300 ease-out ${open ? 'grid-rows-[1fr] opacity-100 pb-6' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <p className="text-teal-700/80 leading-relaxed pr-8">{a}</p>
        </div>
      </div>
    </div>
  );
}

export default function FAQPage() {
  const [openMap, setOpenMap] = useState({});
  const allKeys = FAQ.flatMap(group => group.items.map((_, index) => `${group.cat}-${index}`));
  const allOpen = allKeys.length > 0 && allKeys.every(key => openMap[key]);

  function toggleAll() {
    setOpenMap(allOpen ? {} : Object.fromEntries(allKeys.map(key => [key, true])));
  }

  return (
    <>
      {/* FAQPage structured data, built from the same FAQ array that renders the
          accordion below, so the schema can never drift from the visible copy. */}
      <JsonLdScript data={faqJsonLd(FAQ)} />
      <section className="relative bg-teal-800 text-cream-50 py-20 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-hero-vignette opacity-50 mix-blend-multiply" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,104,61,0.15),transparent_50%)]" />
        <div className="container-x text-center relative z-10">
          <span className="eyebrow text-terracotta-300 drop-shadow-sm">Frequently Asked</span>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl mt-4 animate-slide-up">Good questions, ready answers</h1>
        </div>
      </section>

      <section className="container-x py-20 max-w-4xl space-y-12">
        <div>
          <div className="mb-8 flex items-center justify-between gap-4 rounded-2xl border border-sage-200 bg-sage-50/70 px-5 py-4">
            <p className="text-sm text-teal-700/80">Find quick answers before you head into the bush.</p>
            <button type="button" onClick={toggleAll} className="btn-ghost shrink-0 px-3 py-2 text-sm text-teal-800" aria-expanded={allOpen}>
              {allOpen ? 'Collapse all' : 'Expand all'}
            </button>
          </div>
          {FAQ.map((group, groupIdx) => (
            <div key={group.cat} className="mb-12 animate-slide-up" style={{ animationDelay: `${groupIdx * 100}ms` }}>
              <h2 className="font-display text-3xl text-teal-800 mb-6 px-2">{group.cat}</h2>
              <div className="glass-card p-6 sm:p-8">
                {group.items.map((it, i) => {
                  const k = `${group.cat}-${i}`;
                  return <Item key={k} q={it.q} a={it.a} open={!!openMap[k]} onToggle={() => setOpenMap(m => ({ ...m, [k]: !m[k] }))} />;
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Interactive Safari Packing List */}
        <div>
          <PackingChecklist />
        </div>

        <div className="glass-card p-10 text-center mt-16 bg-gradient-to-br from-terracotta-50 to-white hover:-translate-y-1 transition-transform duration-300">
          <h3 className="font-display text-3xl text-teal-800">Still curious?</h3>
          <p className="text-teal-700/80 mt-3 text-lg font-light">Our team replies to messages within 24 hours.</p>
          <Link to="/contact" className="btn-primary mt-6 inline-flex shadow-md">Ask Us Anything</Link>
        </div>
      </section>
    </>
  );
}
