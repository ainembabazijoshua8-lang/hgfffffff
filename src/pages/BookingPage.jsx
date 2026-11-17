import { Link } from 'react-router-dom';
import TripPlanner from '../components/TripPlanner.jsx';
import TrustStrip from '../components/TrustStrip.jsx';
import LazySafariMap from '../components/LazySafariMap.jsx';
import MigrationCalendar from '../components/MigrationCalendar.jsx';
import BestTimeToVisit from '../components/BestTimeToVisit.jsx';
import PackingChecklist from '../components/PackingChecklist.jsx';

export default function BookingPage() {
  return (
    <>
      <section className="relative bg-teal-800 text-cream-50 py-20 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-hero-vignette opacity-50 mix-blend-multiply" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,104,61,0.15),transparent_50%)]" />
        <div className="container-x text-center relative z-10">
          {/* terracotta-300 (#D98462) on the teal-800 hero measured 4.21:1, just under
              the 4.5:1 AA threshold for small text. terracotta-200 measures
              6.14:1 and stays within the brand hue. */}
          <span className="eyebrow text-terracotta-200 drop-shadow-sm">The safari field guide</span>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl mt-4 animate-slide-up">Know before you go</h1>
          <p className="mt-6 text-cream-50/90 max-w-2xl mx-auto text-lg sm:text-xl font-light leading-relaxed animate-slide-up" style={{ animationDelay: '100ms' }}>
            Explore East Africa's parks, seasons, wildlife and practical travel essentials. When you are ready, shape what you have learned into a trip plan.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <a href="#seasons" className="btn-outline border-white/30 hover:bg-white/10">Choose a season</a>
            <a href="#trip-planner" className="btn-primary">Build your trip</a>
            <Link to="/activities" className="btn-outline border-white/30 hover:bg-white/10">Browse activities</Link>
          </div>
        </div>
      </section>

      <section id="trip-planner" className="container-x scroll-mt-24 py-10 sm:py-14">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <span className="eyebrow">Start planning</span>
            <h2 className="section-title mt-3">Build your safari</h2>
            <p className="mt-3 text-teal-700/75">Choose a tour, add experiences, then share your dates and group details for a tailored quote.</p>
          </div>
          <Link to="/activities" className="text-sm font-semibold text-terracotta-600 hover:text-teal-800">Explore activities <span aria-hidden="true">→</span></Link>
        </div>
        <TripPlanner />
      </section>

      <section className="container-x py-14 sm:py-18">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            ['01', 'Pick your wildlife priority', 'The Great Migration moves through the Serengeti ecosystem. Calving season is usually strongest in the south around January and February; river crossings are most likely in the north from July to October.'],
            ['02', 'Choose parks that work together', 'Serengeti brings vast plains and migration routes. Ngorongoro adds a compact crater experience, while Tarangire is known for elephants and baobab-studded landscapes.'],
            ['03', 'Leave room for the real journey', 'Wildlife is never scheduled. A local guide can adapt the route to recent sightings, road conditions, your pace and the time you have.'],
          ].map(([number, title, detail]) => (
            <article key={number} className="border-t-2 border-terracotta-400 pt-5">
              <span className="text-xs font-semibold tracking-widest text-terracotta-500">{number}</span>
              <h2 className="font-display text-2xl text-teal-800 mt-2">{title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-teal-700/80">{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <div id="seasons" className="scroll-mt-20 bg-cream-100">
        <BestTimeToVisit />
      </div>

      <section className="container-x py-14 sm:py-18">
        <div className="mb-8 max-w-2xl">
          <span className="eyebrow">Find your bearings</span>
          <h2 className="section-title mt-3">A safari is shaped by place</h2>
          <p className="mt-4 text-teal-700/75">Distances are large and habitats change quickly. Use the map to compare parks before deciding how much ground to cover.</p>
        </div>
        <LazySafariMap />
      </section>

      <div className="bg-cream-100">
        <MigrationCalendar />
      </div>

      <section className="container-x py-14 sm:py-18">
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <span className="eyebrow">Practical notes</span>
            <h2 className="section-title mt-3">Prepare for the bush</h2>
            <p className="mt-4 text-teal-700/75 leading-relaxed">Early starts and changing temperatures are normal. Pack light, bring layers, and confirm visa, health and entry requirements with official sources before departure.</p>
            <Link to="/faq" className="mt-5 inline-flex font-semibold text-terracotta-600 hover:text-teal-800">Read travel FAQs <span aria-hidden="true" className="ml-2">→</span></Link>
          </div>
          <PackingChecklist />
        </div>
      </section>

      <TrustStrip />
    </>
  );
}
