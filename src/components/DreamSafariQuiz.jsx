import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fallbackTours } from '../data/fallbackTours.js';
import { useCurrency } from '../context/CurrencyContext.jsx';

const questions = [
  {
    key: 'traveler',
    eyebrow: 'Who is coming?',
    title: 'Choose your kind of journey',
    options: [
      { value: 'couples', label: 'A private escape for two', icon: '◌', tags: ['couples', 'honeymoon'] },
      { value: 'family', label: 'A first safari with family', icon: '⌂', tags: ['family'] },
      { value: 'wildlife', label: 'A deep wildlife immersion', icon: '◉', tags: ['wildlife', 'photography'] },
      { value: 'solo', label: 'A spirited solo expedition', icon: '↗', tags: ['solo', 'group'] },
    ],
  },
  {
    key: 'dream',
    eyebrow: 'What calls you?',
    title: 'Pick your unmissable moment',
    options: [
      { value: 'migration', label: 'The Great Migration', icon: '≈', tags: ['migration', 'wildlife', 'serengeti'] },
      { value: 'big-five', label: 'The Big Five', icon: '✦', tags: ['wildlife', 'ngorongoro', 'tarangire'] },
      { value: 'culture', label: 'People, place and story', icon: '⌁', tags: ['cultural', 'maasai'] },
      { value: 'slow', label: 'Time to breathe deeply', icon: '☼', tags: ['luxury', 'couples', 'relaxation'] },
    ],
  },
  {
    key: 'pace',
    eyebrow: 'How should it feel?',
    title: 'Set the rhythm of your safari',
    options: [
      { value: 'short', label: 'A focused long weekend', icon: '3', tags: ['short', 'budget'] },
      { value: 'classic', label: 'The classic week away', icon: '7', tags: ['classic', 'mid'] },
      { value: 'slow', label: 'A lingering, unrushed escape', icon: '∞', tags: ['long', 'luxury'] },
    ],
  },
];

function normalizeText(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function containsPhrase(text, phrase) {
  const normalizedPhrase = normalizeText(phrase);
  return normalizedPhrase.length > 0 && ` ${text} `.includes(` ${normalizedPhrase} `);
}

function tourText(tour) {
  return normalizeText([
    tour.title,
    tour.summary,
    tour.category,
    tour.location,
    ...(tour.best_for || []),
    tour.slug,
  ].join(' '));
}

function scoreTour(tour, answers) {
  const haystack = tourText(tour);
  let score = 0;
  for (const answer of Object.values(answers)) {
    for (const tag of answer.tags) {
      if (containsPhrase(haystack, tag)) score += 3;
    }
  }
  const duration = Number(tour.duration_days);
  if (Number.isFinite(duration)) {
    if (answers.pace?.value === 'short' && duration <= 5) score += 5;
    if (answers.pace?.value === 'classic' && duration >= 5 && duration <= 8) score += 5;
    if (answers.pace?.value === 'slow' && duration >= 8) score += 5;
  }
  if (answers.dream?.value === 'slow' && tour.tier === 'luxury') score += 4;
  return score;
}

function matchingPreferences(tour, answers) {
  const haystack = tourText(tour);
  const labels = [];
  for (const question of questions) {
    const answer = answers[question.key];
    if (answer && answer.tags.some(tag => containsPhrase(haystack, tag))) labels.push(answer.label);
  }
  const duration = Number(tour.duration_days);
  if (answers.pace?.value === 'short' && Number.isFinite(duration) && duration <= 5) labels.push('a shorter trip');
  if (answers.pace?.value === 'classic' && Number.isFinite(duration) && duration >= 5 && duration <= 8) labels.push('a classic week');
  if (answers.pace?.value === 'slow' && Number.isFinite(duration) && duration >= 8) labels.push('an unhurried trip');
  if (answers.dream?.value === 'slow' && tour.tier === 'luxury') labels.push('a relaxed, higher-comfort stay');
  return labels;
}

export default function DreamSafariQuiz() {
  const { formatPrice } = useCurrency();
  const [tours, setTours] = useState(fallbackTours);
  const [answers, setAnswers] = useState({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch('/api/tours')
      .then(response => response.json())
      .then(data => {
        if (mounted && data.ok && Array.isArray(data.tours) && data.tours.length > 0) setTours(data.tours);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const recommendations = useMemo(() => (
    [...tours]
      .map(tour => ({ tour, score: scoreTour(tour, answers), reasons: matchingPreferences(tour, answers) }))
      .sort((left, right) => right.score - left.score)
      .slice(0, 2)
  ), [answers, tours]);

  const question = questions[questionIndex];
  const selected = answers[question?.key]?.value;

  function choose(option) {
    const nextAnswers = { ...answers, [question.key]: option };
    setAnswers(nextAnswers);
    if (questionIndex === questions.length - 1) setShowResults(true);
    else setQuestionIndex(current => current + 1);
  }

  function restart() {
    setAnswers({});
    setQuestionIndex(0);
    setShowResults(false);
  }

  return (
    <section className="container-x py-16 sm:py-20">
      <div className="relative overflow-hidden rounded-3xl bg-acacia text-cream-50 shadow-cardHover">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(214,168,79,0.22),transparent_34%),linear-gradient(115deg,rgba(21,46,40,0.98),rgba(33,72,61,0.88))]" />
        <div className="relative grid lg:grid-cols-[0.9fr_1.1fr] gap-10 p-7 sm:p-10 lg:p-14">
          <div className="flex flex-col justify-center">
            <span className="eyebrow text-terracotta-300">A tailored safari match</span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl mt-3 leading-tight">Find the journey that feels like you.</h2>
            <p className="mt-5 max-w-lg text-cream-100/75 leading-relaxed">
              Share what matters to you and compare tours matched against your interests, trip length and travel style.
            </p>
            <div className="mt-8 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-cream-100/55">
              <span className="h-px w-10 bg-terracotta-300" />
              {showResults ? 'Your shortlist' : `Portrait ${questionIndex + 1} of ${questions.length}`}
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-5 sm:p-7 backdrop-blur-md min-h-[320px]">
            {!showResults ? (
              <div key={question.key} className="animate-fade-up">
                <div className="text-sm text-terracotta-300">{question.eyebrow}</div>
                <h3 className="font-display text-2xl sm:text-3xl mt-2">{question.title}</h3>
                <div className="mt-6 grid sm:grid-cols-2 gap-3">
                  {question.options.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => choose(option)}
                      aria-pressed={selected === option.value}
                      className="group min-h-24 rounded-xl border border-white/15 bg-white/5 p-4 text-left transition hover:-translate-y-0.5 hover:border-terracotta-300 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-300"
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="text-2xl text-gold-400" aria-hidden="true">{option.icon}</span>
                        <span className="text-xs text-cream-100/50 transition group-hover:text-cream-50">Choose</span>
                      </span>
                      <span className="mt-3 block text-sm font-medium leading-snug">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="animate-fade-up">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm text-terracotta-300">A considered beginning</div>
                    <h3 className="font-display text-2xl sm:text-3xl mt-2">Your two best matches</h3>
                  </div>
                  <button type="button" onClick={restart} className="text-xs text-cream-100/65 hover:text-cream-50 underline underline-offset-4">Start again</button>
                </div>
                <div className="mt-6 grid sm:grid-cols-2 gap-4">
                  {recommendations.map(({ tour, reasons }) => (
                    <article key={tour.id} className="overflow-hidden rounded-xl border border-white/15 bg-black/10">
                      <img src={tour.hero_image} alt="" className="h-28 w-full object-cover" loading="lazy" />
                      <div className="p-4">
                        <div className="text-[10px] uppercase tracking-[0.16em] text-terracotta-300">{tour.location}</div>
                        <h4 className="font-display text-xl mt-1 leading-tight">{tour.title}</h4>
                        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-cream-100/70">
                          <span>{tour.duration_days} days</span>
                          <span>{formatPrice(tour.price_usd)} / person</span>
                        </div>
                        <p className="mt-3 text-xs leading-relaxed text-cream-100/70">
                          {reasons.length ? `A match for ${reasons.join(', ')}.` : 'A starting point from our safari collection.'}
                        </p>
                        <Link to={`/booking?tour=${encodeURIComponent(tour.id)}`} className="mt-4 inline-flex text-sm font-semibold text-terracotta-300 hover:text-cream-50">Plan this journey →</Link>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
