import { useMemo, useState } from 'react';

const TRIPADVISOR_URL =
  'https://www.tripadvisor.com/Attraction_Review-g297913-d34687915-Reviews-Jebrisafaris-Arusha_Arusha_Region.html';

const TRIPADVISOR_AWARD_TEXT = "Tripadvisor Travellers' Choice — Best of the Best";

const QR_LABEL = 'Scan to Review Us on Tripadvisor';

// Tripadvisor brand green.
const TA_GREEN = '#247d38';
const TA_GREEN_HOVER = '#1a632b';

/**
 * Tripadvisor's mark: the two owl eyes from the "oo" of the wordmark, reversed
 * out of the brand green disc. Drawn locally rather than hotlinked so it cannot
 * break when a third-party badge host goes down.
 */
function TaMark({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <circle cx="40" cy="40" r="38" fill={TA_GREEN} />
      <circle cx="27.5" cy="40" r="13.5" fill="#FFFFFF" />
      <circle cx="52.5" cy="40" r="13.5" fill="#FFFFFF" />
      <circle cx="27.5" cy="40" r="5.5" fill={TA_GREEN} />
      <circle cx="52.5" cy="40" r="5.5" fill={TA_GREEN} />
    </svg>
  );
}

/**
 * Global review band. Rendered once from the footer, which the app shell mounts
 * on every route, so the award, badge and QR code reach all current and future
 * pages without per-page work.
 *
 * The sunset scene is decorative only: a dark scrim sits between it and the
 * content so the headline, the QR code and the CTA keep their contrast ratio
 * regardless of what is behind them.
 */
export default function TripadvisorBadge() {
  // Rendered at 400px so it stays sharp on high-density displays when shown at
  // roughly 200 CSS pixels on desktop.
  const qrSrc = useMemo(
    () =>
      `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
        TRIPADVISOR_URL
      )}&color=000000&bgcolor=FFFFFF&margin=2&qzone=2`,
    []
  );
  const [qrFailed, setQrFailed] = useState(false);

  return (
    <section
      aria-labelledby="tripadvisor-award-heading"
      className="relative isolate overflow-hidden rounded-3xl shadow-card"
    >
      {/* Golden sunset sky */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,#4A3316_0%,#8A5A1E_24%,#C9683D_52%,#D6A84F_78%,#EFC271_100%)]"
      />
      {/* Sun sitting on the horizon */}
      <div
        aria-hidden="true"
        className="absolute left-[62%] top-[52%] h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F7DC9A] opacity-80 blur-2xl md:h-72 md:w-72"
      />
      <div
        aria-hidden="true"
        className="absolute left-[62%] top-[52%] h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FFF3D2] opacity-90 md:h-32 md:w-32"
      />
      {/* Horizon haze */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-[62%] h-24 bg-[#F2C878] opacity-30 blur-xl"
      />

      {/* Serengeti scene: acacia, 4x4, elephant, giraffe. Low opacity so it
          reads as atmosphere and never competes with the copy. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1/2 select-none text-[#241505] opacity-[0.16]"
      >
        {/* Flat-topped acacia */}
        <svg
          viewBox="0 0 120 84"
          fill="currentColor"
          className="absolute bottom-0 left-[2%] h-[86%] w-auto"
        >
          <path d="M57 84V46h5v38z" />
          <path d="M59 48c-13 0-25-4-34-11 6-2 10-6 12-12 4 5 9 8 15 8 4-5 10-8 17-8s13 3 17 8c6 0 11-3 14-8 3 6 6 10 11 12-9 7-21 11-34 11z" />
        </svg>

        {/* Luxury 4x4 safari vehicle, pop-top roof and roof rack */}
        <svg
          viewBox="0 0 200 84"
          fill="currentColor"
          className="absolute bottom-0 left-[22%] h-[74%] w-auto"
        >
          <path d="M62 48V28l6-13h46l6 33z" />
          <rect x="70" y="12" width="42" height="4" rx="2" />
          <path d="M120 48l16-24 22 4 18 20z" />
          <path d="M6 48h180a8 8 0 0 1 8 8v6H0v-8a8 8 0 0 1 6-8z" />
          <rect x="0" y="56" width="200" height="5" rx="2.5" />
          <path
            fillRule="evenodd"
            d="M44 52a13 13 0 1 0 0 26 13 13 0 1 0 0-26Zm0 7a6 6 0 1 1 0 12 6 6 0 1 1 0-12Z"
          />
          <path
            fillRule="evenodd"
            d="M156 52a13 13 0 1 0 0 26 13 13 0 1 0 0-26Zm0 7a6 6 0 1 1 0 12 6 6 0 1 1 0-12Z"
          />
        </svg>

        {/* Elephant */}
        <svg
          viewBox="0 0 170 104"
          fill="currentColor"
          className="absolute bottom-0 left-[56%] h-[70%] w-auto"
        >
          <ellipse cx="66" cy="52" rx="44" ry="34" />
          <circle cx="124" cy="58" r="27" />
          <ellipse cx="112" cy="48" rx="21" ry="25" />
          <path d="M143 70c9 7 14 16 12 25-1 5-7 6-10 3-4-4-7-11-7-18z" />
          <rect x="34" y="76" width="15" height="26" rx="6" />
          <rect x="58" y="80" width="15" height="22" rx="6" />
          <rect x="92" y="80" width="15" height="22" rx="6" />
          <rect x="116" y="76" width="15" height="26" rx="6" />
        </svg>

        {/* Giraffe */}
        <svg
          viewBox="0 0 100 132"
          fill="currentColor"
          className="absolute bottom-0 right-[3%] h-[64%] w-auto"
        >
          <path d="M56 68 72 20l12 4-16 48z" />
          <path d="M72 12l26-2 2 14-26 2z" />
          <rect x="76" y="0" width="3.5" height="12" rx="1.75" />
          <rect x="94" y="0" width="3.5" height="12" rx="1.75" />
          <ellipse cx="44" cy="76" rx="28" ry="19" />
          <rect x="20" y="86" width="8" height="46" rx="4" />
          <rect x="34" y="86" width="8" height="46" rx="4" />
          <rect x="52" y="86" width="8" height="46" rx="4" />
          <rect x="66" y="86" width="8" height="46" rx="4" />
          <path d="M16 74c-8 4-11 14-7 22 2 4 7 4 8 0 2-6 5-11 10-13z" />
        </svg>
      </div>

      {/* Legibility scrim over the scene */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-acacia/90 via-acacia/55 to-acacia/85"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-acacia/70 to-transparent"
      />

      <div className="relative z-10 px-6 py-10 sm:px-10 sm:py-12 lg:px-14">
        <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-14">
          {/* Headline, badge and CTA */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold-400 drop-shadow">
              Tripadvisor travellers say
            </span>
            <h2
              id="tripadvisor-award-heading"
              className="mt-3 font-display text-3xl leading-tight text-cream-50 drop-shadow-lg sm:text-4xl lg:text-5xl"
            >
              <span className="block text-gold-400">Travellers&rsquo; Choice</span>
              <span className="block">Best of the Best</span>
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-cream-100/85 sm:text-base">
              Our travellers rank Jebri Safaris among the best experiences in Arusha. One
              scan or one click leaves a review that helps the next traveller choose.
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-5 lg:justify-start">
              {/* Official green review badge */}
              <a
                href={TRIPADVISOR_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${TRIPADVISOR_AWARD_TEXT} — open our Tripadvisor reviews`}
                className="group inline-flex shrink-0 items-center gap-3 rounded-full bg-white/95 py-2 pl-2 pr-5 shadow-lg transition-transform duration-300 hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-acacia"
              >
                <TaMark />
                <span className="text-left leading-tight">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Tripadvisor
                  </span>
                  <span className="block font-display text-base font-semibold text-neutral-900 sm:text-lg">
                    Read our reviews
                  </span>
                </span>
              </a>

              {/* CTA */}
              <a
                href={TRIPADVISOR_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-acacia sm:text-base"
                style={{ backgroundColor: TA_GREEN }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = TA_GREEN_HOVER;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = TA_GREEN;
                }}
              >
                Leave a Review
                <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </div>

          {/* QR code */}
          <div className="flex shrink-0 flex-col items-center gap-3">
            <a
              href={TRIPADVISOR_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${QR_LABEL} — opens our Tripadvisor reviews`}
              className="rounded-2xl bg-white p-3 shadow-lg ring-4 ring-gold-400/70 transition-transform duration-300 hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-cream-50 focus-visible:ring-offset-2 focus-visible:ring-offset-acacia"
            >
              {qrFailed ? (
                <span className="flex h-[200px] w-[200px] items-center justify-center px-3 text-center text-xs font-semibold text-neutral-800">
                  tripadvisor.com/Attraction_Review-g297913-d34687915
                </span>
              ) : (
                <img
                  src={qrSrc}
                  alt="QR code linking to Jebri Safaris reviews on Tripadvisor"
                  width={200}
                  height={200}
                  decoding="async"
                  onError={() => setQrFailed(true)}
                  className="h-[168px] w-[168px] sm:h-[200px] sm:w-[200px]"
                />
              )}
            </a>
            <span className="text-center text-sm font-semibold text-cream-50 drop-shadow">
              {QR_LABEL}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export { TRIPADVISOR_URL, TRIPADVISOR_AWARD_TEXT };