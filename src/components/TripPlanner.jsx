// Multi-step Trip Planner — replaces the simple booking form on /booking
// Steps:
//   1. Tour selection — pick from the catalog (multi-select)
//   2. Add activities — pick from ACTIVITY_CATALOG (multi-select)
//   3. Travelers + dates
//   4. Contact + review + send
//
// On submit: posts to /api/plan which emails the founder.

import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ACTIVITY_CATALOG } from '../data/activitiesCatalog.js';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { buildWhatsAppMessage, openWhatsApp } from '../utils/whatsapp.js';
import { tourPricePerPerson, maxTravelersFor } from '../../shared-pricing.js';

const STEPS = ['Tours', 'Activities', 'Travelers', 'Contact & Send'];
const VALID_ACTIVITY_IDS = new Set(ACTIVITY_CATALOG.map(a => a.id));

const TIER_LABEL = { budget: 'Budget', mid: 'Standard', luxury: 'Luxury' };

export default function TripPlanner() {
  const { formatPrice } = useCurrency();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  // H-2: read these reactively (every render) so a programmatic URL change
  // (e.g. user navigates with new query params mid-session) is honoured
  // instead of being ignored after first mount.
  const preselectActivity = searchParams.get('activity') || '';
  const validActivityPreselect = VALID_ACTIVITY_IDS.has(preselectActivity) ? preselectActivity : '';
  // A tour id from the URL is NOT trusted until the catalog resolves: it can
  // only be validated against /api/tours. Until then it is kept out of `picks`
  // so a stale/unknown id can never become a phantom selection.
  const preselectTour = searchParams.get('tour') || '';
  const [step, setStep] = useState(validActivityPreselect ? 2 : 1);
  const [tours, setTours] = useState([]);
  const [toursLoading, setToursLoading] = useState(true);
  const [toursError, setToursError] = useState('');
  const [picks, setPicks] = useState({
    tours: [],
    activities: validActivityPreselect ? [validActivityPreselect] : [],
  });
  const [travel, setTravel] = useState({
    start_date: '', end_date: '', flight_date: '', duration: '', travelers: 2,
    tier: '', country: '',
  });
  const [contact, setContact] = useState({
    name: '', email: '', phone: '', message: '', budget: '',
  });
  const [status, setStatus] = useState({ state: 'idle', msg: '', ref: '' });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/tours')
      .then(r => { if (!r.ok) throw new Error('Could not load tours.'); return r.json(); })
      .then(d => {
        if (!d.ok) throw new Error('Could not load tours.');
        if (!cancelled) setTours(d.tours);
      })
      .catch(() => { if (!cancelled) setToursError('Tours are temporarily unavailable. You can still build an activities-only plan.'); })
      .finally(() => { if (!cancelled) setToursLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // H-2: react to changes in the deep-link params (e.g. user clicks another
  // "Plan this trip" link with a different ?tour=). The tour preselect waits
  // for the catalog to load so the id can be validated; activity ids are
  // checked immediately against the static catalog.
  useEffect(() => {
    const tourReady = !toursLoading && preselectTour && tours.some(t => t.id === preselectTour);
    if (!validActivityPreselect && !tourReady) return;
    setPicks(prev => {
      const nextTours = tourReady && !prev.tours.includes(preselectTour)
        ? [...prev.tours, preselectTour]
        : prev.tours;
      const nextActivities = validActivityPreselect && !prev.activities.includes(validActivityPreselect)
        ? [...prev.activities, validActivityPreselect]
        : prev.activities;
      if (nextTours === prev.tours && nextActivities === prev.activities) return prev;
      return { tours: nextTours, activities: nextActivities };
    });
    // Clear the deep-link params so a refresh doesn't re-preselect.
    const next = new URLSearchParams(searchParams);
    if (preselectTour) next.delete('tour');
    if (preselectActivity) next.delete('activity');
    navigate({
      pathname: location.pathname,
      search: next.toString() ? `?${next.toString()}` : '',
      hash: location.hash,
    }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectTour, validActivityPreselect, tours, toursLoading, location.pathname, location.hash, navigate]);

  const selectedTours = useMemo(
    () => tours.filter(t => picks.tours.includes(t.id)),
    [tours, picks.tours]
  );
  const selectedActivities = useMemo(
    () => ACTIVITY_CATALOG.filter(a => picks.activities.includes(a.id)),
    [picks.activities]
  );
  const travelers = Math.max(1, Number(travel.travelers) || 1);
  const requiresCustomQuote = selectedActivities.some(activity => activity.requires_quote);

  const estimate = useMemo(() => {
    // M-5: tours are always per-person, but activities may be per-activity
    // (helicopter charter, deep-sea fishing) or per-person (balloon, spa).
    // We honor the is_per_person flag from the activity catalog.
    const tourPerPerson = selectedTours.reduce(
      (sum, tour) => sum + (tourPricePerPerson(tour, travelers) || 0), 0
    );
    const perPersonActivityTotal = selectedActivities
      .filter(a => a.is_per_person !== false)
      .reduce((s, a) => s + (a.price_usd || 0), 0);
    const flatActivityTotal = selectedActivities
      .filter(a => a.is_per_person === false)
      .reduce((s, a) => s + (a.price_usd || 0), 0);
    return (tourPerPerson + perPersonActivityTotal) * travelers + flatActivityTotal;
  }, [selectedTours, selectedActivities, travelers]);

  function toggleTour(id) {
    setPicks(p => ({ ...p, tours: p.tours.includes(id) ? p.tours.filter(x => x !== id) : [...p.tours, id] }));
  }
  function toggleActivity(id) {
    setPicks(p => ({ ...p, activities: p.activities.includes(id) ? p.activities.filter(x => x !== id) : [...p.activities, id] }));
  }

  function next() { setStep(s => Math.min(STEPS.length, s + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function back() { setStep(s => Math.max(1, s - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }

  async function submit(e) {
    e.preventDefault();
    setStatus({ state: 'loading', msg: 'Submitting your trip plan to our Arusha team…', ref: '' });

    const items = [
      ...picks.tours.map(id => ({ id, kind: 'tour' })),
      ...picks.activities.map(id => ({ id, kind: 'activity' })),
    ];

    if (items.length === 0) {
      setStatus({ state: 'err', msg: 'Please select at least one safari tour or activity before sending.', ref: '' });
      return;
    }

    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contact.name.trim(),
          email: contact.email.trim(),
          phone: contact.phone.trim() || undefined,
          country: travel.country.trim() || undefined,
          start_date: travel.start_date,
          end_date: travel.end_date,
          flight_date: travel.flight_date || undefined,
          duration: travel.duration.trim() || undefined,
          travelers: travelers,
          tier: travel.tier || undefined,
          budget: contact.budget.trim() || undefined,
          message: contact.message.trim() || undefined,
          items: items,
          estimate_total: estimate,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Submission could not be completed.');
      }

      const reference = data.reference || 'JP-CONFIRMED';
      setStatus({
        state: 'ok',
        msg: data.message || 'Trip plan received — our safari team will email your customized proposal within 24 hours.',
        ref: reference,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setStatus({
        state: 'err',
        msg: `${err.message} You can also send your plan directly via WhatsApp below.`,
        ref: '',
      });
    }
  }

  const isDateRangeValid = travel.start_date && travel.end_date
    ? new Date(travel.start_date) <= new Date(travel.end_date)
    : true;
  const isFlightDateValid = travel.flight_date && travel.start_date
    ? new Date(travel.flight_date) >= new Date(travel.start_date)
    : true;

  const canNext = (s) => {
    // Gate on selections that actually resolve against the catalog/activity
    // list, not on the raw `picks` ids, so an unrecognised id can never let
    // the wizard advance with an empty plan.
    if (s === 1) return selectedTours.length > 0 || selectedActivities.length > 0;
    if (s === 2) return true; // activities are optional when tours are selected
    if (s === 3) return travel.start_date && travel.end_date && travel.travelers && isDateRangeValid && isFlightDateValid;
    return true;
  };

  // Full confirmation view once plan is submitted
  if (status.state === 'ok') {
    return (
      <div className="glass-card p-8 sm:p-12 text-center rounded-3xl animate-fade-up max-w-3xl mx-auto shadow-2xl border border-savanna-200">
        <div className="w-16 h-16 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm font-bold">
          ✓
        </div>
        <span className="eyebrow text-terracotta-500 font-bold">Inquiry Successfully Received</span>
        <h2 className="font-display text-3xl sm:text-4xl text-teal-900 font-bold mt-2">
          Your Safari Itinerary is on Its Way!
        </h2>
        <div className="inline-block bg-teal-900 text-gold-400 font-mono text-sm sm:text-base px-5 py-2.5 rounded-xl mt-4 border border-teal-700 shadow-sm">
          Booking Reference: <strong>#{status.ref}</strong>
        </div>
        <p className="mt-4 text-teal-800 text-base leading-relaxed max-w-xl mx-auto">
          {status.msg}
        </p>

        <div className="mt-6 p-5 bg-cream-100/70 rounded-2xl border border-savanna-200 text-left max-w-lg mx-auto text-xs sm:text-sm text-teal-900 space-y-2">
          <div className="font-bold text-teal-900 pb-1.5 border-b border-savanna-200">Trip Plan Summary</div>
          <div>👤 <strong>Traveler:</strong> {contact.name} ({contact.email})</div>
          <div>👥 <strong>Group Size:</strong> {travelers} traveler{travelers !== 1 ? 's' : ''}</div>
          <div>📅 <strong>Dates:</strong> {travel.start_date} to {travel.end_date}</div>
          <div>🦁 <strong>Selected Tours:</strong> {selectedTours.map(t => t.title).join(', ') || 'Custom itinerary'}</div>
          {selectedActivities.length > 0 && (
            <div>🎈 <strong>Activities:</strong> {selectedActivities.map(a => a.title).join(', ')}</div>
          )}
          <div className="pt-1.5 border-t border-savanna-200 text-terracotta-600 font-bold">
            💰 Estimated Total: {requiresCustomQuote ? 'Custom quote required' : formatPrice(estimate)}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={() => {
              const waMsg = `Hi Jebri Safaris! I just submitted custom trip plan *#${status.ref}* for ${travelers} traveler(s) from ${travel.start_date} to ${travel.end_date}.\nSelected tours: ${selectedTours.map(t => t.title).join(', ') || 'Custom'}.\nCould you confirm availability and send the itemized quote?`;
              window.open(`https://wa.me/255657253723?text=${encodeURIComponent(waMsg)}`, '_blank');
            }}
            className="bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold py-3.5 px-6 rounded-full text-sm transition flex items-center gap-2 shadow-md hover:shadow-lg"
          >
            <span>💬 Continue with Specialist on WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-ghost text-sm border border-savanna-300 bg-white"
          >
            📄 Print Summary
          </button>
          <button
            type="button"
            onClick={() => {
              setStatus({ state: 'idle', msg: '', ref: '' });
              setStep(1);
            }}
            className="btn-primary text-sm bg-teal-800 hover:bg-teal-900"
          >
            Create Another Trip Plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="glass-card overflow-hidden">
      {/* Step header */}
      <div className="bg-gradient-to-r from-teal-800 to-teal-900 text-cream-50 px-6 sm:px-10 py-8 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_40%)]" />
        <div className="flex items-center justify-between flex-wrap gap-4 relative z-10">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-terracotta-300">Step {step} of {STEPS.length}</div>
            <h2 className="font-display text-2xl sm:text-3xl mt-1">{STEPS[step - 1]}</h2>
          </div>
          <div className="text-right text-sm text-cream-100/85">
            <div>{selectedTours.length} tour{selectedTours.length !== 1 ? 's' : ''} selected</div>
            <div>{selectedActivities.length} activit{selectedActivities.length !== 1 ? 'ies' : 'y'} selected</div>
            <div className="text-terracotta-300 font-semibold mt-1">Est. {requiresCustomQuote ? 'Custom quote required' : formatPrice(estimate)}</div>
          </div>
        </div>
        {/* Stepper */}
        <div className="mt-8 flex gap-3 relative z-10">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1 h-2 rounded-full bg-black/20 overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-terracotta-400 to-terracotta-500 transition-all duration-500 ease-out"
                style={{ width: `${step >= i + 1 ? 100 : 0}%` }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Step body */}
      <div className="p-6 sm:p-10">
        {step === 1 && (
          <Step1Tours tours={tours} toursLoading={toursLoading} toursError={toursError} picks={picks.tours} onToggle={toggleTour} tierFilter={travel.tier} />
        )}
        {step === 2 && (
          <Step2Activities picks={picks.activities} onToggle={toggleActivity} tier={travel.tier} />
        )}
        {step === 3 && (
          <Step3Travel travel={travel} setTravel={setTravel} selectedTours={selectedTours} />
        )}
        {step === 4 && (
          <Step4Contact
            contact={contact}
            setContact={setContact}
            selectedTours={selectedTours}
            selectedActivities={selectedActivities}
            travel={travel}
            estimate={estimate}
          />
        )}
      </div>

      {/* Footer nav */}
      <div className="border-t border-savanna-200/50 px-6 sm:px-10 py-6 flex items-center justify-between gap-4 flex-wrap bg-white/40 backdrop-blur-sm">
        <button type="button" onClick={back} disabled={step === 1} className="btn-ghost disabled:opacity-30 hover:bg-white/50">
          ← Back
        </button>

        {step < STEPS.length && (
          <button type="button" onClick={next} disabled={!canNext(step)} className="btn-primary disabled:opacity-40">
            Continue →
          </button>
        )}

        {step === STEPS.length && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="btn-ghost text-xs border border-savanna-300 bg-white"
            >
              🖨️ Print Summary
            </button>
            <button type="submit" disabled={status.state === 'loading' || !contact.name || !contact.email} className="btn-primary disabled:opacity-50">
              {status.state === 'loading' ? 'Submitting…' : 'Send My Trip Plan ➔'}
            </button>
          </div>
        )}
      </div>

      {status.state === 'err' && (
        <div className="m-6 sm:m-10 mt-0 bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 text-sm flex items-center justify-between gap-3">
          <span>{status.msg}</span>
          <button
            type="button"
            onClick={() => {
              const waMsg = `Hi Jebri Safaris! I'd like to plan a trip for ${travelers} traveler(s) from ${travel.start_date || 'Flexible'} to ${travel.end_date || 'Flexible'}.\nTours: ${selectedTours.map(t => t.title).join(', ') || 'Custom'}.\nName: ${contact.name}\nEmail: ${contact.email}\nPhone: ${contact.phone}`;
              window.open(`https://wa.me/255657253723?text=${encodeURIComponent(waMsg)}`, '_blank');
            }}
            className="text-xs font-bold text-teal-900 underline shrink-0"
          >
            Send on WhatsApp Instead
          </button>
        </div>
      )}
    </form>
  );
}

// ---------- Step 1 ----------
function Step1Tours({ tours, toursLoading, toursError, picks, onToggle, tierFilter }) {
  const { formatPrice } = useCurrency();
  const [cat, setCat] = useState('All');
  const [tier, setTier] = useState(tierFilter || 'all');

  // Keep the local tier chip in sync when the user picks a different tier
  // back in Step 3 and then returns here. Without this the filter gets stuck.
  useEffect(() => { setTier(tierFilter || 'all'); }, [tierFilter]);

  const categories = ['All', ...new Set(tours.map(t => t.category))];
  const filtered = tours.filter(t =>
    (cat === 'All' || t.category === cat) &&
    (tier === 'all' || t.tier === tier)
  );

  return (
    <div className="space-y-5">
      <p className="text-teal-700/75">
        Pick one or more tours, or skip ahead if you only want activities. Each tour is per-person; we'll calculate the total in step 4.
        Filter by tier or category to narrow it down.
      </p>

      {toursLoading && <p className="text-sm text-teal-500">Loading tours…</p>}
      {toursError && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{toursError}</div>}

      <div className="flex flex-wrap gap-3">
        <div className="flex flex-wrap gap-2">
          <span className="text-xs uppercase text-teal-500 self-center mr-1 font-semibold">Tier:</span>
          {['all', 'budget', 'mid', 'luxury'].map(t => (
            <button key={t} type="button" onClick={() => setTier(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                tier === t ? 'bg-teal-700 text-cream-50 border-teal-700' : 'bg-cream-50 text-teal-700 border-savanna-200 hover:border-teal-700'
              }`}>
              {t === 'all' ? 'All tiers' : TIER_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="text-xs uppercase text-teal-500 self-center mr-1 font-semibold">Category:</span>
        {categories.map(c => (
          <button key={c} type="button" onClick={() => setCat(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
              cat === c ? 'bg-terracotta-400 text-cream-50 border-terracotta-400' : 'bg-cream-50 text-teal-700 border-savanna-200 hover:border-terracotta-400'
            }`}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4 max-h-[480px] overflow-y-auto pr-2">
        {filtered.map(t => {
          const selected = picks.includes(t.id);
          return (
            <button key={t.id} type="button" onClick={() => onToggle(t.id)}
              className={`text-left card p-4 transition border-2 ${
                selected ? 'border-terracotta-400 bg-terracotta-50' : 'border-transparent hover:border-savanna-200'
              }`}>
              <div className="flex gap-4">
                <img src={t.hero_image} alt="" aria-hidden="true" className="w-20 h-20 rounded-lg object-cover shrink-0" loading="lazy" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-semibold ${
                      t.tier === 'budget' ? 'bg-sage-100 text-sage-700' :
                      t.tier === 'luxury' ? 'bg-teal-700 text-cream-50' :
                      'bg-terracotta-100 text-terracotta-500'
                    }`}>{TIER_LABEL[t.tier]}</span>
                    <span className="text-teal-500">{t.duration_days} days</span>
                  </div>
                  <h3 className="font-display text-base text-teal-700 mt-1 leading-tight">{t.title}</h3>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-teal-500">{t.location}</span>
                      <span className="text-sm font-semibold text-terracotta-400">{formatPrice(t.price_usd)}</span>
                  </div>
                </div>
                <div className={`shrink-0 self-center w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selected ? 'bg-terracotta-400 border-terracotta-400 text-cream-50' : 'border-savanna-200'
                }`}>
                  {selected && '✓'}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {picks.length > 0 && (
        <div className="bg-teal-700/5 border border-teal-700/20 rounded-xl p-4 text-sm">
          <strong className="text-teal-700">{picks.length} tour{picks.length !== 1 ? 's' : ''} selected.</strong>{' '}
          <span className="text-teal-700/75">Add activities in step 2 (optional).</span>
        </div>
      )}
    </div>
  );
}

// ---------- Step 2 ----------
function Step2Activities({ picks, onToggle, tier }) {
  // Map category → which tiers find this activity "recommended"
  const tagsFor = (a) => {
    const t = [a.category];
    if (['air', 'water'].includes(a.category)) t.push('mid', 'luxury');
    if (['wildlife', 'adventure'].includes(a.category)) t.push('budget', 'mid');
    if (['wellness'].includes(a.category)) t.push('luxury');
    if (a.category === 'experience') t.push('mid', 'luxury');
    if (['cultural'].includes(a.category)) t.push('budget', 'mid', 'luxury');
    // Bucket-list markers
    if (['air', 'wildlife', 'water', 'experience'].includes(a.category)) t.push('bucket-list');
    return t;
  };
  const recommended = tier
    ? ACTIVITY_CATALOG.filter(a => tagsFor(a).includes(tier))
    : ACTIVITY_CATALOG;
  const showAll = !tier;
  const list = showAll ? ACTIVITY_CATALOG : recommended;
  const bucket = list.filter(a => tagsFor(a).includes('bucket-list'));
  const otherActivities = tier ? list.filter(a => !bucket.includes(a)) : list;

  return (
    <div className="space-y-5">
      <p className="text-teal-700/75">
        Add experiences from the Activities guide to your plan. Featured activities you chose there are already selected here; you can add more or remove them.
      </p>

      {tier && bucket.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-wider text-terracotta-400 font-semibold mb-3">
            Bucket-list picks for {TIER_LABEL[tier]}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {bucket.map(a => <ActivityCard key={a.id} a={a} selected={picks.includes(a.id)} onToggle={onToggle} />)}
          </div>
        </div>
      )}

      <div>
        <div className="text-xs uppercase tracking-wider text-teal-500 font-semibold mb-3">
          {showAll ? 'All activities' : `More activities that pair with ${TIER_LABEL[tier]}`}
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {otherActivities.map(a => (
            <ActivityCard key={a.id} a={a} selected={picks.includes(a.id)} onToggle={onToggle} />
          ))}
        </div>
      </div>

      {picks.length > 0 && (
        <div className="bg-teal-700/5 border border-teal-700/20 rounded-xl p-4 text-sm">
          <strong className="text-teal-700">{picks.length} activit{picks.length !== 1 ? 'ies' : 'y'} selected.</strong>{' '}
          <span className="text-teal-700/75">Continue when ready.</span>
        </div>
      )}
    </div>
  );
}

// Tier color-coding for the activity badge. Mirrors Step 1's tour-card design
// so the visual language is consistent across the planner.
const ACTIVITY_TIER_STYLE = {
  budget: 'bg-sage-100 text-sage-700',
  mid: 'bg-terracotta-100 text-terracotta-500',
  luxury: 'bg-teal-700 text-cream-50',
};

// Category labels — short, readable, capitalized. Used inside the row card.
const ACTIVITY_CATEGORY_LABEL = {
  air: 'Scenic flight',
  wildlife: 'Game drive',
  water: 'Water safari',
  cultural: 'Local culture',
  experience: 'Bush experience',
};

function ActivityCard({ a, selected, onToggle }) {
  const { formatPrice } = useCurrency();
  const tier = a.tier || 'mid';
  const tierStyle = ACTIVITY_TIER_STYLE[tier] || ACTIVITY_TIER_STYLE.mid;
  const catLabel = ACTIVITY_CATEGORY_LABEL[a.category] || a.category;
  return (
    <button
      type="button"
      onClick={() => onToggle(a.id)}
      aria-pressed={selected}
      className={`relative text-left card transition border-2 w-full h-full ${
        selected
          ? 'border-terracotta-400 bg-terracotta-50 ring-2 ring-terracotta-300/40'
          : 'border-transparent hover:border-savanna-200 bg-cream-50'
      }`}
    >
      <div className="h-32 overflow-hidden bg-teal-900/10">
        <img src={a.image} alt="" aria-hidden="true" loading="lazy" className="h-full w-full object-cover" />
      </div>

      {/* Body — flex column so different-content cards still end at the same height */}
      <div className="p-4 flex flex-col gap-2">
        {/* Top row: icon + tier badge + category label */}
        <div className="flex items-center gap-2 text-xs">
          <span aria-hidden="true" className="text-lg leading-none">{a.icon}</span>
          <span className={`px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide ${tierStyle}`}>
            {tier === 'budget' ? 'Budget' : tier === 'luxury' ? 'Luxury' : 'Standard'}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-teal-500/80">
            {catLabel}
          </span>
        </div>

        {/* Title — allow up to 2 lines, then truncate cleanly */}
        <h3 className="font-display text-base text-teal-700 leading-snug clamp-2">
          {a.title}
        </h3>

        {/* Blurb — up to 3 lines, with comfortable line-height */}
        <p className="text-sm text-teal-700/75 leading-relaxed clamp-3">
          {a.blurb}
        </p>

        {/* Footer — duration (left) · price (right) — fixed at bottom via mt-auto */}
        <div className="mt-auto pt-3 border-t border-savanna-100 flex items-center justify-between gap-2">
          <span className="text-xs text-teal-500 inline-flex items-center gap-1 min-w-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            <span className="truncate">{a.duration}</span>
          </span>
          <span className="text-sm font-semibold text-terracotta-500 shrink-0">
            {a.requires_quote ? 'Custom quote' : `${formatPrice(a.price_usd)}${a.is_per_person === false ? ' flat' : ' / person'}`}
          </span>
        </div>

        {/* Selected check — small pill at the corner of the body, not overlapping text */}
        <div className="absolute top-3 right-3">
          <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs ${
            selected ? 'bg-terracotta-400 border-terracotta-400 text-cream-50 shadow' : 'border-savanna-200 bg-cream-50/90 backdrop-blur'
          }`}>
            {selected ? '✓' : ''}
          </span>
        </div>
      </div>
    </button>
  );
}

// ---------- Step 3 ----------
function Step3Travel({ travel, setTravel, selectedTours }) {
  const update = (k) => (e) => setTravel(t => ({ ...t, [k]: e.target.value }));
  const updateNum = (k) => (e) => setTravel(t => ({ ...t, [k]: Math.max(1, parseInt(e.target.value, 10) || 1) }));
  const travelers = Math.max(1, Number(travel.travelers) || 1);
  // The API hard-rejects a party larger than a tour's group_size_max, so warn
  // here rather than letting the visitor fill the whole form and fail on submit.
  const overCapacityTours = selectedTours.filter(t => travelers > maxTravelersFor(t));
  
  const dateRangeValid = travel.start_date && travel.end_date
    ? new Date(travel.start_date) <= new Date(travel.end_date)
    : true;
  const flightDateValid = travel.flight_date && travel.start_date
    ? new Date(travel.flight_date) >= new Date(travel.start_date)
    : true;

  return (
    <div className="space-y-5">
      <p className="text-teal-700/75">When are you going, and who is coming?</p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="planner-start-date">Start date *</label>
          <input id="planner-start-date" required type="date" value={travel.start_date} onChange={update('start_date')} className="field" />
        </div>
        <div>
          <label className="label" htmlFor="planner-end-date">End date *</label>
          <input id="planner-end-date" required type="date" value={travel.end_date} onChange={update('end_date')} className="field" />
        </div>
        <div>
          <label className="label" htmlFor="planner-flight-date">Flight date</label>
          <input id="planner-flight-date" type="date" value={travel.flight_date} onChange={update('flight_date')} className="field" />
        </div>
        <div>
          <label className="label" htmlFor="planner-travelers">Travelers *</label>
          <input id="planner-travelers" required type="number" min={1} max={50} value={travel.travelers} onChange={updateNum('travelers')} className="field" />
        </div>
      </div>
      <p className="text-sm text-teal-700/75">Enter your trip dates in order: start date first, end date next, and flight date on or after your arrival.</p>

      {!dateRangeValid && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          End date must be the same as or after the start date.
        </div>
      )}
      {!flightDateValid && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Flight date should be on or after your start date.
        </div>
      )}
      {overCapacityTours.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {overCapacityTours.length === 1 ? 'This tour has' : 'These tours have'} a maximum of{' '}
          {Math.min(...overCapacityTours.map(t => maxTravelersFor(t)))} travellers per 4x4, but you entered {travelers}.{' '}
          Reduce the traveller count, remove {overCapacityTours.length === 1 ? 'this tour' : 'these tours'}, or message us and we will arrange extra vehicles.
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="planner-duration">Total trip length</label>
          <input id="planner-duration" placeholder="e.g. 10 days" value={travel.duration} onChange={update('duration')} className="field" />
        </div>
        <div>
          <label className="label" htmlFor="planner-country">Country you're flying from</label>
          <input id="planner-country" placeholder="United States" value={travel.country} onChange={update('country')} className="field" />
        </div>
      </div>

      <div>
        <label className="label">Your preferred tier</label>
        <div className="flex flex-wrap gap-2">
          {[
            { v: '', l: 'No preference' },
            { v: 'budget', l: 'Budget' },
            { v: 'mid', l: 'Standard comfort' },
            { v: 'luxury', l: 'Luxury' },
          ].map(o => (
            <button key={o.v} type="button" onClick={() => setTravel(t => ({ ...t, tier: o.v }))}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                travel.tier === o.v ? 'bg-teal-700 text-cream-50 border-teal-700' : 'bg-cream-50 text-teal-700 border-savanna-200 hover:border-teal-700'
              }`}>
              {o.l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Step 4 ----------
function Step4Contact({ contact, setContact, selectedTours, selectedActivities, travel, estimate }) {
  const { formatPrice } = useCurrency();
  const update = (k) => (e) => setContact(c => ({ ...c, [k]: e.target.value }));
  const travelers = Math.max(1, Number(travel.travelers) || 1);
  const requiresCustomQuote = selectedActivities.some(activity => activity.requires_quote);
  const tourPerPerson = selectedTours.reduce(
    (sum, tour) => sum + (tourPricePerPerson(tour, travelers) || 0), 0
  );
  const activityPerPerson = selectedActivities
    .filter(activity => activity.is_per_person !== false && !activity.requires_quote)
    .reduce((sum, activity) => sum + (Number(activity.price_usd) || 0), 0);
  const flatActivityTotal = selectedActivities
    .filter(activity => activity.is_per_person === false && !activity.requires_quote)
    .reduce((sum, activity) => sum + (Number(activity.price_usd) || 0), 0);

  function shareToWhatsApp() {
    const toursText = selectedTours.map(t => {
      const pricePerPerson = tourPricePerPerson(t, travelers);
      const cap = maxTravelersFor(t);
      const capNote = travelers > cap ? ` — NOTE: this tour takes max ${cap} travellers` : '';
      return `• ${t.title} (${t.duration_days} days): ${formatPrice(pricePerPerson)} per person × ${travelers} = ${formatPrice(pricePerPerson * travelers)}${capNote}`;
    }).join('\n');
    const activitiesText = selectedActivities.map(a => a.requires_quote
      ? `• ${a.title}: custom quote required`
      : `• ${a.title}: ${a.is_per_person === false ? `${formatPrice(a.price_usd)} flat` : `${formatPrice(a.price_usd)} per person × ${travelers} = ${formatPrice((Number(a.price_usd) || 0) * travelers)}`}`
    ).join('\n');
    const text = `*Jebri Safaris Trip Inquiry*
👤 *Name:* ${contact.name || 'Traveler'}
📧 *Email:* ${contact.email || 'Not provided'}
📱 *Phone:* ${contact.phone || 'Not provided'}
👥 *Travelers:* ${travel.travelers || 2}
📅 *Dates:* ${travel.start_date || 'Flexible'} to ${travel.end_date || 'Flexible'}
${travel.tier ? `🎯 *Tier:* ${travel.tier}\n` : ''}${toursText ? `\n*Selected Tours:*\n${toursText}\n` : ''}${activitiesText ? `\n*Selected Activities:*\n${activitiesText}\n` : ''}
💰 *Price breakdown (${travelers} traveler${travelers === 1 ? '' : 's'}):*
• Tour packages: ${formatPrice(tourPerPerson)} per person × ${travelers} = ${formatPrice(tourPerPerson * travelers)}
• Per-person activities: ${formatPrice(activityPerPerson)} per person × ${travelers} = ${formatPrice(activityPerPerson * travelers)}
• Flat activity fees: ${formatPrice(flatActivityTotal)}
• *${requiresCustomQuote ? 'Final total requires a custom quote' : `Estimated group total: ${formatPrice(estimate)}`}*
📝 *Notes:* ${contact.message || 'Please send customized quote.'}`;

    window.open(`https://wa.me/255657253723?text=${encodeURIComponent(text)}`, '_blank');
  }

  return (
    <div className="space-y-6">
      <p className="text-teal-700/75">Almost there — your details and a quick review.</p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="planner-name">Full name *</label>
          <input id="planner-name" required minLength={2} value={contact.name} onChange={update('name')} className="field" placeholder="Jane Doe" />
        </div>
        <div>
          <label className="label" htmlFor="planner-email">Email *</label>
          <input id="planner-email" required type="email" value={contact.email} onChange={update('email')} className="field" placeholder="jane@example.com" />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="planner-phone">Phone / WhatsApp</label>
          <input id="planner-phone" value={contact.phone} onChange={update('phone')} className="field" placeholder="+1 555 123 4567" />
        </div>
        <div>
          <label className="label" htmlFor="planner-budget">Total budget per person (optional)</label>
          <input id="planner-budget" value={contact.budget} onChange={update('budget')} className="field" placeholder="e.g. $5,000" />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="planner-message">Anything else we should know?</label>
        <textarea id="planner-message" rows={4} value={contact.message} onChange={update('message')} className="field" placeholder="Mobility considerations, dietary needs, special occasions…" />
      </div>

      {/* Summary */}
      <div className="bg-cream-100 rounded-2xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl text-teal-700">Your plan summary</h3>
          <button
            type="button"
            onClick={shareToWhatsApp}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#25D366] text-white hover:bg-[#1EBE5D] px-3.5 py-1.5 rounded-full transition shadow-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/></svg>
            Send to WhatsApp
          </button>
        </div>

        {selectedTours.length > 0 && (
          <div>
            <div className="text-xs uppercase tracking-wider text-terracotta-400 font-semibold mb-2">Tours ({selectedTours.length})</div>
            <ul className="space-y-1 text-sm text-teal-700/85">
              {selectedTours.map(t => {
                const pricePerPerson = tourPricePerPerson(t, travelers);
                const overCap = travelers > maxTravelersFor(t);
                return (
                  <li key={t.id} className="flex justify-between gap-3">
                    <span>{t.title} <span className="text-teal-500 text-xs">({t.duration_days} days · {formatPrice(pricePerPerson)} / person{overCap ? ` · max ${maxTravelersFor(t)} travellers` : ''})</span></span>
                    <span className="font-semibold">{formatPrice(pricePerPerson * travelers)} group</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {selectedActivities.length > 0 && (
          <div>
            <div className="text-xs uppercase tracking-wider text-terracotta-400 font-semibold mb-2 mt-3">Activities ({selectedActivities.length})</div>
            <ul className="space-y-1 text-sm text-teal-700/85">
              {selectedActivities.map(a => (
                <li key={a.id} className="flex justify-between gap-3">
                  <span>{a.icon} {a.title} <span className="text-teal-500 text-xs">{a.requires_quote ? '(custom quote)' : a.is_per_person === false ? '(flat fee)' : `(× ${travelers} travelers)`}</span></span>
                  <span className="font-semibold">{a.requires_quote ? 'Quote required' : formatPrice(a.is_per_person === false ? a.price_usd : (Number(a.price_usd) || 0) * travelers)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="border-t border-savanna-200 pt-3 mt-3 space-y-1 text-sm text-teal-700/85">
          <div>📅 Start date: <strong>{travel.start_date || '—'}</strong></div>
          <div>🔚 End date: <strong>{travel.end_date || '—'}</strong></div>
          <div>✈️ Flight date: <strong>{travel.flight_date || '—'}</strong></div>
          <div>👥 Travelers: <strong>{travel.travelers}</strong></div>
          {travel.tier && <div>🎯 Tier: <strong>{TIER_LABEL[travel.tier] || travel.tier}</strong></div>}
          {travel.duration && <div>🗓 Duration: <strong>{travel.duration}</strong></div>}
          {travel.country && <div>🌍 Flying from: <strong>{travel.country}</strong></div>}
        </div>

        <div className="border-t border-savanna-200 pt-4 mt-4 space-y-2 text-sm text-teal-700/85">
          <div className="text-xs uppercase tracking-wider text-teal-500 font-semibold">Price breakdown</div>
          <div className="flex justify-between gap-3"><span>Tour packages ({formatPrice(tourPerPerson)} × {travelers})</span><strong>{formatPrice(tourPerPerson * travelers)}</strong></div>
          <div className="flex justify-between gap-3"><span>Per-person activities ({formatPrice(activityPerPerson)} × {travelers}{selectedActivities.some(activity => activity.requires_quote) ? ', quote items excluded' : ''})</span><strong>{formatPrice(activityPerPerson * travelers)}</strong></div>
          <div className="flex justify-between gap-3"><span>Flat activity fees</span><strong>{formatPrice(flatActivityTotal)}</strong></div>
          <div className="border-t border-savanna-200 pt-3 mt-3 text-center">
          <div className="text-xs uppercase tracking-wider text-teal-500 font-semibold">Estimated group total</div>
          <div className="font-display text-4xl text-terracotta-400 mt-1">{requiresCustomQuote ? 'Quote required' : formatPrice(estimate)}</div>
          <div className="text-xs text-teal-500 mt-1">{requiresCustomQuote ? 'One or more selections require a custom quote; the estimate excludes those items.' : `Indicative estimate for ${travelers} traveler${travelers === 1 ? '' : 's'}; final quote confirmed by our team.`}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
