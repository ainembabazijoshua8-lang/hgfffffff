import { Link } from 'react-router-dom';
import { SiteIcon } from '../components/Icons.jsx';

const TEAM = [
  {
    name: 'Joshua Ryan Ainembabazi',
    role: 'Co-Founder',
    initials: 'JA',
    email: 'ainembabazijoshua8@gmail.com',
    bio: 'Born in Uganda, raised on safari stories, and building the kind of trip he always wished he could book: transparent, personal, and conservation-led.',
  },
  {
    name: 'Lowasa Gibson',
    role: 'Co-Founder & Bush Operations',
    initials: 'LG',
    email: 'mncblacs@gmail.com',
    bio: 'A Tanzanian-born guide with deep roots in Arusha. Lowasa knows every road, camp, and story that makes a journey feel genuinely local.',
  },
  {
    name: 'Lekule Gibson',
    role: 'Founder & Bush Operations',
    initials: 'LG',
    email: 'lekuleghost@gmail.com',
    bio: 'With 15+ years across Tanzania and Kenya, Lekule turns careful planning into calm, expertly delivered days in the field.',
  },
];

const GUIDES = [
  {
    name: 'Lekule Gibson',
    role: 'Head of Bush Operations',
    experience: '15+ years across Tanzania & Kenya',
    languages: ['English', 'Swahili'],
    specialty: 'Bush logistics & safari operations',
    quote: 'A great safari is built long before the wheels hit the dirt - planned in the details and delivered in the field.',
    email: 'lekuleghost@gmail.com',
  },
];

const VALUES = [
  { icon: '01', t: 'Conservation first', d: 'We measure success by the wildlife and landscapes we help protect, not just the guests we host.' },
  { icon: '02', t: 'Community-led', d: '10% of profits flow back to Maasai villages and anti-poaching initiatives.' },
  { icon: '03', t: 'Craft over scale', d: 'We run small groups, never more than six guests per vehicle, so every day feels considered.' },
  { icon: '04', t: 'Local expertise', d: 'Every guide is Tanzanian-born. You will not get a more authentic read of the land.' },
];

const FIELD_STATS = [
  { value: '2026', label: 'Founded in Arusha', tone: 'terracotta' },
  { value: '6 max', label: 'Guests per vehicle', tone: 'sage' },
  { value: '10%', label: 'Profit to conservation', tone: 'gold' },
  { value: '24/7', label: 'Emergency support', tone: 'teal' },
];

export default function AboutPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-teal-900 text-cream-50">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1535941339077-2dd1c7963098?auto=format&fit=crop&w=2000&q=80"
            alt="Guide looking across the Serengeti plains"
            className="h-full w-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-teal-900 via-teal-900/85 to-teal-900/30" />
        </div>
        <div className="container-x relative z-10 grid min-h-[560px] items-end gap-10 py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-28">
          <div className="max-w-3xl">
            <span className="eyebrow text-terracotta-300">Our story · Arusha, Tanzania</span>
            <h1 className="mt-5 max-w-3xl font-display text-5xl leading-[0.98] sm:text-6xl lg:text-8xl animate-slide-up">Born on the savanna. Built for travelers.</h1>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-cream-50/85 sm:text-xl animate-slide-up" style={{ animationDelay: '100ms' }}>
              Jebri Safaris started with a Land Cruiser, two friends, and a stubborn belief: safaris should feel personal - not processed.
            </p>
            <div className="mt-9 flex flex-wrap gap-3 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <Link to="/tours" className="btn-primary">See our tours</Link>
              <Link to="/contact" className="btn-outline">Talk to a guide</Link>
            </div>
          </div>
          <div className="hidden justify-self-end lg:block">
            <div className="w-64 border-l border-cream-50/30 pl-6 text-cream-50/85">
              <div className="font-display text-5xl text-terracotta-300">01</div>
              <p className="mt-3 text-sm leading-relaxed">One small team, close to the ground, designing journeys with more room for the unexpected.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container-x relative z-20 -mt-12">
        <div className="grid overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-card backdrop-blur md:grid-cols-4">
          {FIELD_STATS.map((stat, index) => (
            <div key={stat.label} className={`relative p-6 sm:p-8 ${index > 0 ? 'border-t border-savanna-100 md:border-l md:border-t-0' : ''}`}>
              <div className={`mb-3 h-1 w-10 rounded-full ${stat.tone === 'terracotta' ? 'bg-terracotta-400' : stat.tone === 'sage' ? 'bg-sage-600' : stat.tone === 'gold' ? 'bg-gold-400' : 'bg-teal-700'}`} />
              <div className="font-display text-3xl text-teal-800 sm:text-4xl">{stat.value}</div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-teal-700/60">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-x py-24 sm:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <span className="eyebrow">A better way into the wild</span>
            <h2 className="section-title mt-4">Small enough to care. Experienced enough to deliver.</h2>
          </div>
          <div className="space-y-5 text-base leading-relaxed text-teal-700/85">
            <p><strong className="text-teal-800">Joshua</strong> saw friends spend a fortune on safaris that felt rushed and transactional. He knew it could be done better: with operators on the ground, transparent pricing, and itineraries built around people, not spreadsheets.</p>
            <p><strong className="text-teal-800">Lowasa</strong> brought the local network: guides, drivers, lodge owners, and Maasai elders across the country. <strong className="text-teal-800">Lekule</strong> brought 15+ years of bush operations across Tanzania and Kenya.</p>
            <p>Together, they built Jebri Safaris as the company they wished they could book with themselves - personal, practical, and present for every detail.</p>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-linen to-sage-50/60 py-24 sm:py-28">
        <div className="container-x">
          <div className="mb-12 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <span className="eyebrow">What guides the work</span>
              <h2 className="section-title mt-3">Our values, in the field</h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-teal-700/70">The details matter because the land, the communities, and your time matter.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((value) => (
              <article key={value.t} className="group rounded-2xl border border-white/80 bg-white/75 p-7 shadow-card transition-all duration-300 hover:-translate-y-2 hover:shadow-cardHover">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold tracking-[0.2em] text-terracotta-400">{value.icon}</span>
                  <span className="h-2 w-2 rounded-full bg-terracotta-300 transition-transform duration-300 group-hover:scale-150" />
                </div>
                <h3 className="mt-12 font-display text-2xl text-teal-800">{value.t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-teal-700/75">{value.d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x py-24 sm:py-32">
        <div className="mb-12 max-w-2xl">
          <span className="eyebrow">Leadership</span>
          <h2 className="section-title mt-3">The people behind the route</h2>
          <p className="mt-4 leading-relaxed text-teal-700/75">You will know who is planning your trip, who is meeting you at the airport, and who is holding the radio when the road gets interesting.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {TEAM.map((member) => (
            <article key={member.name} className="group rounded-2xl border border-savanna-100 bg-white/70 p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-cardHover">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-terracotta-400 font-display text-xl text-cream-50 shadow-sm transition-transform duration-300 group-hover:rotate-3">{member.initials}</div>
                <span className="rounded-full bg-terracotta-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-terracotta-500">{member.role}</span>
              </div>
              <h3 className="mt-6 font-display text-2xl text-teal-800">{member.name}</h3>
              <p className="mt-3 text-sm leading-relaxed text-teal-700/75">{member.bio}</p>
              <Link to="/contact" className="mt-6 block font-mono text-xs text-teal-600 transition-colors hover:text-terracotta-400">Chat with the team on WhatsApp</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-b from-transparent to-linen py-24 sm:py-28">
        <div className="container-x">
          <div className="mb-12 max-w-2xl">
            <span className="eyebrow">In the field</span>
            <h2 className="section-title mt-3">A guide who knows the quiet places</h2>
          </div>
          {GUIDES.map((guide) => (
            <article key={guide.name} className="grid overflow-hidden rounded-3xl bg-teal-800 text-cream-50 shadow-card lg:grid-cols-[0.85fr_1.15fr]">
              <div className="relative min-h-[300px] bg-teal-900 p-8 sm:p-12">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,104,61,0.4),transparent_58%)]" />
                <div className="relative flex h-full flex-col justify-between">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl border-2 border-terracotta-300/60 bg-terracotta-400 font-display text-3xl shadow-glow">{guide.name.split(' ').map((part) => part[0]).join('')}</div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-terracotta-300">{guide.role}</div>
                    <h3 className="mt-2 font-display text-4xl">{guide.name}</h3>
                  </div>
                </div>
              </div>
              <div className="p-8 sm:p-12">
                <p className="max-w-xl font-accent text-2xl italic leading-relaxed text-cream-50/90">&quot;{guide.quote}&quot;</p>
                <div className="mt-10 grid gap-5 border-t border-cream-50/15 pt-7 sm:grid-cols-3">
                  <div><div className="text-[10px] font-bold uppercase tracking-[0.16em] text-terracotta-300">Experience</div><div className="mt-2 text-sm text-cream-50/80">{guide.experience}</div></div>
                  <div><div className="text-[10px] font-bold uppercase tracking-[0.16em] text-terracotta-300">Specialty</div><div className="mt-2 text-sm text-cream-50/80">{guide.specialty}</div></div>
                  <div><div className="text-[10px] font-bold uppercase tracking-[0.16em] text-terracotta-300">Languages</div><div className="mt-2 flex flex-wrap gap-2">{guide.languages.map((language) => <span key={language} className="rounded-full border border-cream-50/20 px-3 py-1 text-xs text-cream-50/80">{language}</span>)}</div></div>
                </div>
                <Link to="/contact" className="mt-8 inline-block font-mono text-xs text-terracotta-300 transition-colors hover:text-cream-50">Chat with the team on WhatsApp</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="container-x py-24 sm:py-32">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-800 to-acacia p-8 text-cream-50 shadow-glow sm:p-14">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full border-[28px] border-terracotta-400/20" />
          <div className="relative grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <span className="eyebrow text-terracotta-300">Safety & vehicle standards</span>
              <h2 className="mt-3 max-w-2xl font-display text-4xl sm:text-5xl">The calm behind the adventure.</h2>
              <p className="mt-5 max-w-2xl leading-relaxed text-cream-50/80">Every guest is automatically enrolled in emergency aero-medical evacuation insurance through AMREF Flying Doctors. Our vehicles also carry satellite communication and comprehensive trauma first aid kits.</p>
              <div className="mt-8 flex flex-wrap gap-3 text-sm font-medium text-cream-50/85">
                <span className="rounded-full border border-cream-50/20 bg-white/10 px-4 py-2">24/7 air ambulance</span>
                <span className="rounded-full border border-cream-50/20 bg-white/10 px-4 py-2">Satellite tracking</span>
                <span className="rounded-full border border-cream-50/20 bg-white/10 px-4 py-2">First aid equipped</span>
              </div>
            </div>
            <div className="rounded-2xl border border-cream-50/20 bg-white/10 p-7 backdrop-blur-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-terracotta-300">Our promise</div>
              <ul className="mt-5 space-y-4 text-sm leading-relaxed text-cream-50/85">
                <li className="flex gap-3"><SiteIcon name="check" className="mt-1 text-terracotta-300" /> A guaranteed window seat for every guest.</li>
                <li className="flex gap-3"><SiteIcon name="check" className="mt-1 text-terracotta-300" /> Unlimited mileage on game drives.</li>
                <li className="flex gap-3"><SiteIcon name="check" className="mt-1 text-terracotta-300" /> Fair guide compensation and ethical camp policies.</li>
              </ul>
              <Link to="/booking" className="btn-primary mt-7 text-sm">Plan your safari</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
