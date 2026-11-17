import { Link } from 'react-router-dom';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { SIGNATURE_EXPERIENCES } from '../data/activitiesCatalog.js';

export default function ActivitiesPage() {
  const { formatPrice } = useCurrency();

  return (
    <>
      <section className="relative isolate min-h-[560px] overflow-hidden bg-teal-950 text-cream-50 sm:min-h-[620px]">
        <img
          src={SIGNATURE_EXPERIENCES[0].image}
          alt={SIGNATURE_EXPERIENCES[0].imageAlt}
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-teal-950/95 via-teal-950/65 to-teal-950/15" />
        <div className="container-x flex min-h-[560px] flex-col justify-end pb-14 pt-32 sm:min-h-[620px] sm:pb-20">
          <div className="max-w-3xl">
            <span className="eyebrow text-terracotta-300">The safari activity collection</span>
            <h1 className="mt-5 max-w-2xl font-display text-5xl leading-[1.05] sm:text-6xl">
              Five ways to make the day yours
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-cream-50/85 sm:text-lg">
              Take in the Serengeti from above, meet the landscape at ground level, and leave room for a memorable pause at the end of the day.
            </p>
            <a href="#signature-experiences" className="mt-8 inline-flex items-center gap-3 border-b border-terracotta-300 pb-2 text-sm font-semibold text-cream-50 transition-colors hover:text-terracotta-200">
              Explore the experiences <span aria-hidden="true">↓</span>
            </a>
          </div>
          <p className="mt-12 text-[10px] text-cream-50/70">
            Photo: <a href={SIGNATURE_EXPERIENCES[0].creditUrl} target="_blank" rel="noreferrer" className="underline">{SIGNATURE_EXPERIENCES[0].creditName}</a> · <a href={SIGNATURE_EXPERIENCES[0].licenseUrl} target="_blank" rel="noreferrer" className="underline">{SIGNATURE_EXPERIENCES[0].license}</a> · Wikimedia Commons
          </p>
        </div>
      </section>

      <nav aria-label="Safari experiences" className="border-b border-savanna-200 bg-cream-50">
        <div className="container-x flex gap-7 overflow-x-auto py-5">
          {SIGNATURE_EXPERIENCES.map((experience) => (
            <a key={experience.id} href={`#experience-${experience.id}`} className="shrink-0 text-xs font-semibold text-teal-800 hover:text-terracotta-500">
              <span className="mr-2 font-mono text-terracotta-500">{experience.number}</span>{experience.setting}
            </a>
          ))}
        </div>
      </nav>

      <main id="signature-experiences">
        {SIGNATURE_EXPERIENCES.map((experience, index) => {
          const isDark = index === 1 || index === 3;
          const isReversed = index % 2 === 1;
          const textColor = isDark ? 'text-cream-50' : 'text-teal-900';
          const secondaryColor = isDark ? 'text-cream-50/75' : 'text-teal-800/75';
          const plannerHref = experience.plannerActivityId
            ? `/booking?activity=${encodeURIComponent(experience.plannerActivityId)}#trip-planner`
            : `/contact?experience=${encodeURIComponent(experience.title)}`;
          const actionLabel = experience.plannerActivityId ? 'Add to trip plan' : 'Request a custom quote';

          return (
            <section
              key={experience.id}
              id={`experience-${experience.id}`}
              className={`${isDark ? 'bg-teal-950' : index === 2 ? 'bg-linen' : 'bg-cream-50'} scroll-mt-20 py-14 sm:py-20 lg:py-24`}
            >
              <div className={`container-x grid items-center gap-8 sm:gap-12 lg:grid-cols-12 lg:gap-16 ${isReversed ? '' : ''}`}>
                <figure className={`lg:col-span-7 ${isReversed ? 'lg:order-2' : ''}`}>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-teal-900/10">
                    <img
                      src={experience.image}
                      alt={experience.imageAlt}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute left-4 top-4 bg-teal-950/85 px-3 py-1.5 font-mono text-xs text-white">
                      {experience.number} / 05
                    </span>
                  </div>
                  <figcaption className={`mt-2 text-[10px] ${secondaryColor}`}>
                    Photo: <a href={experience.creditUrl} target="_blank" rel="noreferrer" className="underline">{experience.creditName}</a> (cropped) · <a href={experience.licenseUrl} target="_blank" rel="noreferrer" className="underline">{experience.license}</a> · Wikimedia Commons
                  </figcaption>
                </figure>

                <div className={`lg:col-span-5 ${isReversed ? 'lg:order-1' : ''}`}>
                  <p className="font-mono text-sm text-terracotta-500">{experience.number} <span className="px-2 text-terracotta-500/50">/</span> {experience.setting}</p>
                  <h2 className={`mt-4 max-w-lg font-display text-3xl leading-tight sm:text-4xl ${textColor}`}>
                    {experience.title}
                  </h2>
                  <p className={`mt-3 text-xs font-bold uppercase tracking-[0.12em] ${isDark ? 'text-terracotta-300' : 'text-terracotta-600'}`}>
                    {experience.duration}
                  </p>
                  <p className={`mt-2 text-sm font-semibold ${isDark ? 'text-cream-50' : 'text-teal-900'}`}>
                    {experience.requires_quote ? 'Custom quote' : `${formatPrice(experience.price_usd)} / person`}
                  </p>
                  <p className={`mt-6 max-w-md text-sm leading-relaxed sm:text-base ${secondaryColor}`}>
                    {experience.blurb}
                  </p>
                  <Link
                    to={plannerHref}
                    className={`mt-8 inline-flex items-center gap-3 border-b pb-2 text-sm font-semibold transition-colors ${isDark ? 'border-terracotta-300 text-cream-50 hover:text-terracotta-200' : 'border-teal-800 text-teal-900 hover:text-terracotta-600'}`}
                  >
                    {actionLabel} <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </section>
          );
        })}
      </main>

      <section className="bg-terracotta-500 py-16 text-cream-50 sm:py-20">
        <div className="container-x grid gap-8 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.12em] text-cream-50/75">Plan it together</span>
            <h2 className="mt-3 max-w-2xl font-display text-3xl leading-tight sm:text-4xl">Bring the moments you want. We’ll shape the itinerary around them.</h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-cream-50/85">
              Experiences are arranged as part of a tailored safari package. Final itinerary and pricing are confirmed by our team; official park fees, where applicable, are quoted separately based on residency and route.
            </p>
          </div>
          <Link to="/booking#trip-planner" className="inline-flex items-center justify-center gap-3 border border-cream-50 px-5 py-3 text-sm font-semibold text-cream-50 transition-colors hover:bg-cream-50 hover:text-terracotta-600">
            Plan a safari <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </>
  );
}