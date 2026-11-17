import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { CurrencyProvider } from '../src/context/CurrencyContext.jsx';
import BookingPage from '../src/pages/BookingPage.jsx';
import ToursPage from '../src/pages/ToursPage.jsx';
import TourDetailPage from '../src/pages/TourDetailPage.jsx';
import TripPlanner from '../src/components/TripPlanner.jsx';
import SafariMap from '../src/components/SafariMap.jsx';
import TermsPage from '../src/pages/TermsPage.jsx';
import PrivacyPolicyPage from '../src/pages/PrivacyPolicyPage.jsx';
import Footer from '../src/components/Footer.jsx';
import { TRIPADVISOR_URL } from '../src/components/TripadvisorBadge.jsx';

const results = [];

function check(name, element) {
  try {
    const html = renderToString(element);
    // TourDetailPage fetches in an effect, which SSR never runs, so its
    // correct server output is the loading placeholder.
    const okWaiting = html.includes('Loading safari details');
    const ok = (html && html.length > 200) || okWaiting;
    const note = okWaiting
      ? 'renders loading placeholder (expected — no effects in SSR)'
: ok
          ? `${html.length} chars`
          : `SHORT -> "${html.replace(/<[^>]+>/g, '').trim()}"`;
    // Record the success path too. This was previously only pushed from the
    // catch block, so a component that rendered empty/short was silently
    // dropped from the report and could never fail the run.
    results.push({ name, ok, note });
    return html;
  } catch (err) {
    results.push({ name, ok: false, note: `THREW -> ${err.message}` });
    return '';
  }
}

const wrap = el => (
  <MemoryRouter>
    <CurrencyProvider>{el}</CurrencyProvider>
  </MemoryRouter>
);

check('TripPlanner', wrap(<TripPlanner />));
// Rendered directly, not via LazySafariMap: under SSR the lazy wrapper only
// emits its Suspense fallback, so the real component body never runs and
// render-time crashes inside it would go unnoticed.
check('SafariMap', wrap(<SafariMap />));
check('SafariMap (tour pin focus)', wrap(<SafariMap parkIds={['kilimanjaro', 'tarangire']} />));
check('BookingPage (planner + map)', wrap(<BookingPage />));
check('ToursPage', wrap(<ToursPage />));
check('TourDetailPage', wrap(<TourDetailPage />));
check('TermsPage', wrap(<TermsPage />));
check('PrivacyPolicyPage', wrap(<PrivacyPolicyPage />));

// The footer is mounted once in the app shell, so its review band reaches every
// route without per-page wiring. Assert the pieces that must not regress: the
// award headline, the exact QR label, and three live links to the reviews page
// (badge, QR code, and the Leave a Review button).
const footerHtml = check('Footer (global Tripadvisor band)', wrap(<Footer />));

if (footerHtml) {
  const linkCount = footerHtml.split(TRIPADVISOR_URL).length - 1;
  const expectations = [
    ['links to Tripadvisor x3 (badge, QR, CTA)', linkCount === 3, `found ${linkCount}`],
    ['award headline', /Travellers. Choice/.test(footerHtml) && footerHtml.includes('Best of the Best'), 'heading text'],
    ['QR label', footerHtml.includes('Scan to Review Us on Tripadvisor'), 'label text'],
    ['Leave a Review CTA', footerHtml.includes('Leave a Review'), 'button text'],
    ['QR image present', /<img[^>]+tripadvisor\.com/i.test(footerHtml), 'qr src'],
    // Guards a real regression: the badge once drew a bird-shaped path instead
    // of the Tripadvisor mark, so the mark must be built from circles.
    [
      'Tripadvisor mark is circles, not a stale path',
      !footerHtml.includes('M40 22c-2.2 0-4 1.8-4 4'),
      'mark geometry',
    ],
  ];
  for (const [name, ok, note] of expectations) {
    results.push({ name: `Footer — ${name}`, ok, note });
  }
}

let failed = 0;
for (const r of results) {
  if (!r.ok) failed++;
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}  — ${r.note}`);
}
console.log(failed ? `\n${failed} component(s) failed to render` : '\nAll components rendered.');
process.exit(failed ? 1 : 0);