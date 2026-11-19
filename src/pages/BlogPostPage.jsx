import { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import ScrollProgressBar from '../components/ScrollProgressBar.jsx';
import TableOfContents from '../components/TableOfContents.jsx';
import ShareButtons from '../components/ShareButtons.jsx';
import { SiteIcon } from '../components/Icons.jsx';

function slugToId(heading) {
  return heading
    .toLowerCase()
    .replace(/[—–]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const POSTS = {
  'great-migration-complete-guide': {
    title: 'The Great Migration: A Complete Guide for 2025',
    excerpt: "When and where to witness nature's greatest show — and how to plan a trip around it.",
    image: '/assets/uploads/wilderbeast.jpeg',
    heroImage: '/assets/uploads/wilderbeast river.jpeg',
    date: 'May 12, 2025',
    read: '8 min',
    tag: 'Wildlife',
    author: { name: 'Joshua Ainembabazi', role: 'Co-founder & Lead Guide' },
    intro:
      "Every year, roughly two million wildebeest, half a million zebra, and three hundred thousand Thomson's gazelle complete a circular journey across the Serengeti and Maasai Mara ecosystems in search of fresh grazing. The Great Migration is the largest terrestrial mammal migration on Earth — and one of the most breathtaking spectacles you can witness.",
    sections: [
      {
        id: 'calving-season',
        month: 'January – March',
        icon: 'egg',
        heading: 'Calving season — where it all begins',
        body: 'Around January, the herds gather on the southern Serengeti plains (Ndutu area). This is calving season — up to 8,000 calves a day for several weeks. Predators are concentrated, action is constant, and the photography is exceptional. Cheetah, leopard, and lion are highly visible as they shadow the birthing herds.',
        highlight: 'Best for: Photography, predator action, fewer crowds',
        weather: 'Dry & warm',
        crowd: 'Moderate',
      },
      {
        id: 'long-march-north',
        month: 'April – May',
        icon: 'cloud-rain',
        heading: 'The long march north — green season magic',
        body: 'The herds begin drifting northwest through the central Serengeti. April and May are the "green season" — fewer tourists, dramatic stormy skies, and lower prices. The landscape turns bright emerald and migratory birds arrive in their thousands. A hidden gem of the calendar for those who want authenticity over crowds.',
        highlight: 'Best for: Budget-conscious travellers, landscape photography',
        weather: 'Long rains',
        crowd: 'Quiet',
      },
      {
        id: 'grumeti-crossings',
        month: 'June – July',
        icon: 'paw',
        heading: 'Western corridor — the Grumeti crossings',
        body: 'By June, the herds reach the Grumeti River in the western Serengeti. The resident crocodiles here are among the largest in Africa, having gorged themselves year after year at these very crossings. The Grumeti crossings are dramatic and far less crowded than the famous Mara, making them a favourite of experienced safari-goers.',
        highlight: 'Best for: Dramatic crossings without the peak-season crowds',
        weather: 'Dry season starts',
        crowd: 'Moderate',
      },
      {
        id: 'mara-crossings',
        month: 'August – October',
        icon: 'waves',
        heading: 'The Mara River crossings — the iconic moment',
        body: 'The most dramatic crossings of the year. Herds mass at the Mara River — sometimes for days — before plunging across in a thunderous rush. Crocodiles, lions, and hyenas wait on the banks. This is the iconic image: a million wildebeest on the riverbanks. August and September are peak season and must be booked 6–12 months ahead.',
        highlight: 'Best for: The bucket-list crossing experience',
        weather: 'Dry & cool nights',
        crowd: 'Peak season',
      },
      {
        id: 'the-return',
        month: 'November – December',
        icon: 'reset',
        heading: 'The return — closing the circle',
        body: 'The herds move south again as the short rains refresh the southern Serengeti plains. The Mara is quieter, the plains come alive with short grass, and we look forward to another calving cycle. An excellent time to visit Ngorongoro Crater and Tarangire, which are at their most vibrant.',
        highlight: 'Best for: Combining Serengeti south with Ngorongoro &amp; Tarangire',
        weather: 'Short rains (Nov)',
        crowd: 'Moderate',
      },
    ],
    tip: {
      heading: 'Expert tip from our guides',
      body:
        'The migration has no guaranteed schedule — it follows the rain, not the calendar. Our guides track herd movements via the Tanzania National Parks radio network and will adjust your itinerary on the ground. Private vehicles are essential for flexibility.',
    },
    cta: { label: 'Plan my migration safari', href: '/booking' },
  },

  'photography-tips-safari': {
    title: '10 Safari Photography Tips from our Guides',
    excerpt: 'How to come home with images you will treasure forever — gear, settings, and timing.',
    image: '/assets/uploads/sunset photography.jpeg',
    heroImage: '/assets/uploads/tourist jeep sunset.jpeg',
    date: 'April 14, 2025',
    read: '5 min',
    tag: 'Photography',
    author: { name: 'Lowasa Gibson', role: 'Co-founder & Field Photographer' },
    intro:
      'Our guides spend hundreds of days a year in the bush with cameras. Here is what they wish every guest knew before the first game drive.',
    sections: [
      {
        id: 'tip-1-golden',
        month: 'Tip 1',
        icon: 'sunset',
        heading: 'Shoot in the golden hours',
        body: 'The hour after sunrise and the hour before sunset give warm light, long shadows, and active wildlife. Midday harsh sun flattens colour and sends animals to shade. Plan your most important sightings for early morning drives.',
        highlight: 'Wake-up call: 5:30am for a 6am departure',
        weather: '',
        crowd: '',
      },
      {
        id: 'tip-2-shutter',
        month: 'Tip 2',
        icon: 'camera',
        heading: 'Know your minimum shutter speed',
        body: 'On a bouncing vehicle, start at 1/1000s for moving animals. Drop only when the vehicle is fully stopped and your subject is still. Image stabilisation helps but cannot replace a fast shutter for running cheetah or flying eagles.',
        highlight: 'For birds in flight: 1/2000s minimum',
        weather: '',
        crowd: '',
      },
      {
        id: 'tip-3-telephoto',
        month: 'Tip 3',
        icon: 'binoculars',
        heading: 'Bring a telephoto — but not only that',
        body: 'A 100–400mm lens covers most wildlife. Pack a wide angle too for landscapes, camps, and Milky Way shots on clear nights over the Serengeti. The skies away from city light pollution are extraordinary.',
        highlight: 'Recommended: 100–400mm + 24–70mm as a pair',
        weather: '',
        crowd: '',
      },
      {
        id: 'tip-4-eyes',
        month: 'Tip 4',
        icon: 'eye',
        heading: 'Watch the eyes — always the eyes',
        body: 'Sharp eyes make a portrait. Use single-point autofocus on the nearest eye, switch to continuous AF for movement, and burst mode when action starts. A tack-sharp eye with soft background bokeh is the difference between a good shot and an unforgettable one.',
        highlight: 'Enable eye-tracking AF if your camera supports it',
        weather: '',
        crowd: '',
      },
      {
        id: 'tip-5-respect',
        month: 'Tip 5',
        icon: 'mute',
        heading: 'Respect distance and silence',
        body: 'Great images come from patience, not chasing. Let the guide position the vehicle — sudden movement, standing up, or loud voices can end a sighting. The closer the animal, the quieter we are. Switch off motor sounds on your camera if possible.',
        highlight: 'Never ask the driver to get closer — trust the guide',
        weather: '',
        crowd: '',
      },
      {
        id: 'tip-6-sensor',
        month: 'Tip 6',
        icon: 'brush',
        heading: 'Clean your sensor before the trip',
        body: 'Dust spots show up most at small apertures (f/8–f/11) on clear skies and is a common frustration on safari. Have your sensor cleaned professionally before you travel, or learn the blower technique so you can do it safely in the field.',
        highlight: 'Check for dust with a sky test shot on arrival',
        weather: '',
        crowd: '',
      },
      {
        id: 'tip-7-batteries',
        month: 'Tip 7',
        icon: 'battery',
        heading: 'Carry spare batteries — cold drains them fast',
        body: 'Early morning crater visits and night drives in the Serengeti can drop temperatures below 10°C. Lithium batteries hold up better in the cold. Bring at least two fully charged spares per camera body and keep them in your jacket pocket close to your body.',
        highlight: 'Bring 3× the batteries you think you need',
        weather: '',
        crowd: '',
      },
      {
        id: 'tip-8-raw',
        month: 'Tip 8',
        icon: 'save',
        heading: 'Shoot RAW if you edit later',
        body: 'RAW files give you latitude to recover highlights, adjust white balance for golden hour warmth, and pull detail from shadows. Modern editing software makes the slight file size penalty worth it. If you must shoot JPEG, at least use the highest quality setting.',
        highlight: 'RAW + JPEG if your camera supports it',
        weather: '',
        crowd: '',
      },
      {
        id: 'tip-9-beanbag',
        month: 'Tip 9',
        icon: 'bean',
        heading: 'Use a bean bag on the roof hatch',
        body: 'A bean bag on the vehicle\'s pop-up roof hatch is far more stable than a tripod in the cramped space, and you can reposition it instantly. Commercial bean bags with a non-slip bottom are ideal, or fill a small sock with rice as a DIY alternative.',
        highlight: 'A bean bag weighs less than your lens cap',
        weather: '',
        crowd: '',
      },
      {
        id: 'tip-10-presence',
        month: 'Tip 10',
        icon: 'eye',
        heading: 'Put the camera down sometimes — be present',
        body: 'A safari is not a photo shoot. Sometimes the most powerful memory is the one stored in your mind, not on a memory card. Put the camera down. Watch a lion yawn. Listen to the sounds of the bush. These moments shape your story more than any megapixel count ever will.',
        highlight: 'Your own memory matters as much as the megapixels',
        weather: '',
        crowd: '',
      },
    ],
    tip: {
      heading: 'Want a photography-focused safari?',
      body:
        'We offer dedicated photography safaris with a specialist guide, private vehicle, and extended stays at prime spots. Maximum 4 photographers per vehicle.',
    },
    cta: { label: 'Enquire about photo safaris', href: '/booking?activity=photography' },
  },

  'maasai-respectful-cultural-tourism': {
    title: 'Visiting Maasai Communities: A Respectful Guide',
    excerpt: 'How to engage with local culture in ways that genuinely benefit the community.',
    image: '/assets/uploads/masai.jpeg',
    heroImage: '/assets/uploads/masai huddle.jpeg',
    date: 'March 30, 2025',
    read: '7 min',
    tag: 'Culture',
    author: { name: 'Joshua Ainembabazi', role: 'Cultural Programme Lead' },
    intro:
      'Cultural visits can be the highlight of a safari — or feel performative and extractive. The difference is almost always in how the visit is arranged and how guests behave.',
    sections: [
      {
        id: 'principle-1',
        month: 'Principle 1',
        icon: 'house',
        heading: 'Choose community-led experiences',
        body: 'We work exclusively with villages and cultural centres where fees go directly to the community and visits are scheduled with local leaders — not drive-by photo stops. Ask your operator how visit fees are distributed before you book.',
        highlight: 'Jebri policy: 100% of cultural visit fees go to the village',
        weather: '',
        crowd: '',
      },
      {
        id: 'principle-2',
        month: 'Principle 2',
        icon: 'camera',
        heading: 'Ask before you photograph',
        body: 'A smile and a gesture go a long way. Some moments are private; honour that. Some elders prefer not to be photographed — respect it without making it awkward. Your guide will help translate and set expectations on both sides before you arrive.',
        highlight: 'Never photograph without consent. It is not negotiable.',
        weather: '',
        crowd: '',
      },
      {
        id: 'principle-3',
        month: 'Principle 3',
        icon: 'shirt',
        heading: 'Dress modestly and listen more than you perform',
        body: 'Long sleeves and covered knees show respect. Participate when invited — dancing, beadwork, fire-making — but avoid treating people as cultural props. The Maasai are not a museum exhibit; they are a living, evolving community.',
        highlight: 'Modest dress, genuine curiosity, open ears',
        weather: '',
        crowd: '',
      },
      {
        id: 'principle-4',
        month: 'Principle 4',
        icon: 'bag',
        heading: 'Buy crafts directly from the maker',
        body: 'Direct purchases support individual families. Fair prices — not hard bargaining — keep community programmes sustainable. The beadwork and carvings you carry home represent hours of skilled work and support school fees and healthcare.',
        highlight: 'Fair prices create long-term community benefit',
        weather: '',
        crowd: '',
      },
    ],
    tip: {
      heading: 'How we arrange cultural visits',
      body:
        'We partner with three Maasai communities near Ngorongoro and Lake Natron. Visit fees are transparent, agreed in advance with community elders, and paid directly to a community bank account — never to us.',
    },
    cta: { label: 'Add a cultural visit to my trip', href: '/activities' },
  },

  'safari-with-kids': {
    title: 'Planning a Safari with Kids: What Works',
    excerpt: 'Age guidelines, ideal itineraries, and how to keep young explorers engaged.',
    image: '/assets/uploads/lion cubs.jpeg',
    heroImage: '/assets/uploads/jeep interior.jpeg',
    date: 'February 24, 2025',
    read: '6 min',
    tag: 'Family',
    author: { name: 'Lowasa Gibson', role: 'Family Safari Specialist' },
    intro:
      'Safaris with children are absolutely doable — and often magical — when the pace, lodges, and expectations match the youngest traveller in the group.',
    sections: [
      {
        id: 'ages-under-6',
        month: 'Ages under 6',
        icon: 'baby',
        heading: 'Toddlers — short drives, private vehicle',
        body: 'Under 6: keep game drives to 2–3 hours maximum. A private vehicle lets you return to camp when nap time hits. Ngorongoro Crater (shorter descent, concentrated wildlife) and Lake Manyara (flamingos, monkeys) work beautifully for the very young.',
        highlight: 'Key: private vehicle, flexible schedule, lodge with pool',
        weather: '',
        crowd: '',
      },
      {
        id: 'ages-6-12',
        month: 'Ages 6–12',
        icon: 'user',
        heading: 'School age — the sweet spot',
        body: 'Ages 6–12 are genuinely the best safari age. Children this age are curious, patient enough for a full game drive, and young enough to be completely awestruck. Mix wildlife with cultural visits, bush walks (with ranger), and downtime at camp. Junior ranger programmes are excellent.',
        highlight: 'Recommended: Tarangire + Ngorongoro 5-night itinerary',
        weather: '',
        crowd: '',
      },
      {
        id: 'teenagers',
        month: 'Teenagers',
        icon: 'user',
        heading: 'Teens — longer days and walking safaris',
        body: 'Teenagers often become the most engaged safari guests of all. Longer game drives, night drives, and walking safaris (from age 12 where allowed) add genuine adventure. Let them carry their own camera — having a creative task transforms the experience.',
        highlight: 'Allow them ownership: camera, binoculars, field guide',
        weather: '',
        crowd: '',
      },
      {
        id: 'lodging',
        month: 'Logistics',
        icon: 'tent',
        heading: 'Picking the right lodges',
        body: 'Fenced camps, swimming pools, and early dinners prevent meltdowns. Avoid back-to-back six-hour drives for families. We stagger activities so children have downtime every afternoon. Properties with "bush picnics" and "sundowner" experiences make every day feel like an event.',
        highlight: 'Ask us for our vetted family-friendly lodge shortlist',
        weather: '',
        crowd: '',
      },
      {
        id: 'engagement',
        month: 'Preparation',
        icon: 'book',
        heading: 'Engage them before you go',
        body: 'Animal checklists, junior ranger books, and a simple camera give kids a sense of ownership and purpose. Our guides love children\'s questions — often the silliest ones lead to the best conversations. Brief them on bush etiquette beforehand: quiet voices and slow movements.',
        highlight: 'Download our free Kids Safari Checklist from the FAQ page',
        weather: '',
        crowd: '',
      },
    ],
    tip: {
      heading: 'Health & safety note',
      body:
        'All our family itineraries are reviewed for age-appropriate activities. We carry first-aid kits on every vehicle and work with AMREF Flying Doctors aero-medical cover, which includes child evacuation. Malaria prophylaxis is essential — consult your doctor 6 weeks before travel.',
    },
    cta: { label: 'Plan a family safari', href: '/booking' },
  },
};

function RelatedPosts({ currentSlug }) {
  const others = Object.entries(POSTS)
    .filter(([slug]) => slug !== currentSlug)
    .slice(0, 3);

  return (
    <div className="space-y-4">
      <h3 className="font-display text-xl text-teal-700 border-b border-cream-200 pb-3">
        More articles
      </h3>
      {others.map(([slug, p]) => (
        <Link
          key={slug}
          to={`/blog/${slug}`}
          className="flex gap-3 group items-start focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-300 rounded-xl"
        >
          <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-cream-100 flex items-center justify-center">
            <img
              src={p.heroImage || p.image}
              alt={p.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition"
            />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-terracotta-500 uppercase tracking-wider">
              {p.tag}
            </span>
            <p className="text-sm font-semibold text-teal-700 group-hover:text-terracotta-400 transition leading-snug mt-0.5">
              {p.title}
            </p>
            <span className="text-xs text-teal-500">{p.read} read</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function BlogPostPage() {
  const { slug } = useParams();
  const post = POSTS[slug];
  const articleRef = useRef(null);

  const sections = useMemo(() => {
    if (!post) return [];
    return post.sections.map((s) => ({
      id: s.id || slugToId(s.heading),
      label: s.heading,
    }));
  }, [post, slug]);

  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    if (!post) {
      document.title = 'Post not found | Jebri Safaris';
      return;
    }
    document.title = `${post.title} | Jebri Safaris`;
  }, [post]);

  useEffect(() => {
    if (!post || sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id.replace('section-', ''));
          }
        });
      },
      { rootMargin: '0% 0% -50% 0px', threshold: 0.1 }
    );

    sections.forEach((s) => {
      const el = document.getElementById(`section-${s.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [post, sections]);

  const scrollToSection = (id) => {
    const el = document.getElementById(`section-${id}`);
    if (!el) return;
    const offset = 100;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  if (!post) {
    return (
      <>
        <ScrollProgressBar />
        <div className="container-x py-32 text-center">
          <SiteIcon name="paw" className="text-6xl mb-4 text-teal-600" />
          <h1 className="font-display text-3xl text-teal-700">Post not found</h1>
          <p className="text-teal-700/70 mt-2">
            This article may have moved or doesn't exist.
          </p>
          <Link to="/blog" className="btn-primary mt-6 inline-flex">
            ← Back to journal
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <ScrollProgressBar containerRef={articleRef} />
      <article
        ref={articleRef}
        className="pb-24"
        style={{ scrollPaddingTop: '120px' }}
      >
        <section
          aria-label="Article hero"
          className="relative h-[65vh] min-h-[420px] overflow-hidden"
        >
          <img
            src={post.heroImage || post.image}
            alt=""
            loading="eager"
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-hero-vignette opacity-60 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-teal-900 via-teal-900/60 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 container-x pb-12 text-cream-50">
            <Link
              to="/blog"
              className="inline-flex items-center gap-1 text-cream-100/80 text-sm hover:text-terracotta-300 transition mb-4"
            >
              ← Back to journal
            </Link>
            <div className="flex flex-wrap gap-3 mb-4 text-xs">
              <span className="bg-terracotta-400 text-cream-50 font-semibold px-3 py-1 rounded-full">
                {post.tag}
              </span>
              <span className="bg-cream-50/15 border border-cream-50/20 text-cream-100 px-3 py-1 rounded-full">
                {post.date} · {post.read} read
              </span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl max-w-4xl leading-tight">
              {post.title}
            </h1>
            <div className="mt-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-terracotta-400 text-cream-50 flex items-center justify-center font-bold text-sm">
                {post.author.name[0]}
              </div>
              <div>
                <div className="font-semibold text-sm text-cream-50">
                  {post.author.name}
                </div>
                <div className="text-xs text-cream-100/70">
                  {post.author.role}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="container-x mt-12 grid lg:grid-cols-3 gap-12">
          <div className="lg:hidden mb-6">
            <TableOfContents
              sections={sections}
              activeSection={activeSection}
              onSectionClick={scrollToSection}
            />
          </div>

          <main className="lg:col-span-2">
            <p
              className="text-teal-700/90 text-lg sm:text-xl leading-relaxed border-l-4 border-terracotta-300 pl-5 mb-10"
              dangerouslySetInnerHTML={{ __html: post.intro }}
            />

            <div className="space-y-8">
              {post.sections.map((s) => {
                const sectionId = s.id || slugToId(s.heading);
                return (
                  <article
                    key={sectionId}
                    id={`section-${sectionId}`}
                    className="glass-card rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-glow"
                  >
                    <header className="bg-gradient-to-r from-cream-100 to-white/60 border-b border-cream-200/60 px-6 sm:px-8 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
                      <SiteIcon name={s.icon} className="text-2xl text-terracotta-500" />
                      <div>
                        <div className="text-xs font-semibold text-terracotta-500 uppercase tracking-wider">
                          {s.month}
                        </div>
                        <h2 className="font-display text-xl text-teal-800">
                          {s.heading}
                        </h2>
                      </div>
                      {(s.weather || s.crowd) && (
                        <div className="ml-auto flex gap-2 text-xs">
                          {s.weather && (
                            <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-full">
                              <SiteIcon name={/rain/i.test(s.weather) ? 'cloud-rain' : 'sun'} />
                              {s.weather}
                            </span>
                          )}
                          {s.crowd && (
                            <span className="inline-flex items-center gap-1.5 bg-cream-100 border border-cream-200 text-teal-700 px-2 py-0.5 rounded-full">
                              <span
                                aria-hidden="true"
                                className={`h-2 w-2 rounded-full ${/peak/i.test(s.crowd) ? 'bg-red-500' : /quiet/i.test(s.crowd) ? 'bg-green-500' : 'bg-amber-400'}`}
                              />
                              {s.crowd}
                            </span>
                          )}
                        </div>
                      )}
                    </header>
                    <div className="px-6 sm:px-8 py-6">
                      <p
                        className="text-teal-700/85 leading-relaxed font-light"
                        dangerouslySetInnerHTML={{ __html: s.body }}
                      />
                      {s.highlight && (
                        <div className="mt-4 flex items-start gap-2 text-sm text-teal-700 bg-teal-50 border border-teal-100 rounded-xl px-4 py-3">
                          <SiteIcon name="lightbulb" className="mt-0.5 text-base" />
                          <span>{s.highlight}</span>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            <aside className="mt-12 p-8 sm:p-10 bg-gradient-to-br from-teal-800 to-teal-900 text-cream-50 rounded-3xl shadow-glow relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
              <div className="relative z-10">
                <h3 className="font-display text-2xl mb-3 flex items-center gap-3">
                  <SiteIcon name="compass" /> {post.tip.heading}
                </h3>
                <p className="text-cream-50/90 leading-relaxed font-light">
                  {post.tip.body}
                </p>
              </div>
            </aside>

            <aside className="mt-10 p-8 glass-card bg-gradient-to-br from-terracotta-50 to-white rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:-translate-y-1 transition-transform duration-300">
              <div>
                <h3 className="font-display text-2xl text-teal-800">
                  Ready to go?
                </h3>
                <p className="text-teal-700/80 text-sm mt-2 font-medium">
                  Tell us your dates and we will build the perfect itinerary.
                </p>
              </div>
              <Link to={post.cta.href} className="btn-primary shrink-0 shadow-md">
                {post.cta.label}
              </Link>
            </aside>

            <aside className="mt-8 pt-8 border-t border-cream-200">
              <ShareButtons
                title={post.title}
                url={typeof window !== 'undefined' ? window.location.href : ''}
                description={post.excerpt}
              />
            </aside>
          </main>

          <aside className="space-y-8">
            <div className="hidden lg:block">
              <TableOfContents
                sections={sections}
                activeSection={activeSection}
                onSectionClick={scrollToSection}
              />
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-terracotta-400 to-terracotta-500 text-cream-50 flex items-center justify-center font-bold text-xl shadow-sm">
                  {post.author.name[0]}
                </div>
                <div>
                  <div className="font-semibold text-teal-800 text-lg">
                    {post.author.name}
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-teal-600 mt-0.5">
                    {post.author.role}
                  </div>
                </div>
              </div>
              <p className="text-sm text-teal-700/80 leading-relaxed font-light">
                Writing from first-hand experience across Tanzania and Kenya's
                national parks.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl bg-gradient-to-br from-cream-50 to-white">
              <h3 className="font-display text-xl text-teal-800 mb-4 flex items-center gap-2">
                <SiteIcon name="compass" /> Plan your trip
              </h3>
              <div className="space-y-2">
                {[
                  { to: '/tours', icon: 'paw', label: 'Browse safari tours' },
                  { to: '/activities', icon: 'balloon', label: 'Add-on activities' },
                  { to: '/booking', icon: 'calendar', label: 'Get a custom quote' },
                  { to: '/contact', icon: 'mail', label: 'Ask a question' },
                ].map(({ to, icon, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className="flex items-center gap-2 text-sm text-teal-700 hover:text-terracotta-500 py-1.5 border-b border-cream-200 last:border-0 transition"
                  >
                    <SiteIcon name={icon} className="text-teal-500" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl bg-gradient-to-br from-terracotta-50 to-white">
              <h3 className="font-display text-xl text-teal-800 mb-3">
                Need a custom quote?
              </h3>
              <p className="text-sm text-teal-700/80 mb-4 leading-relaxed">
                Tell us your dates, group size, and interests. We'll build a
                tailored itinerary and send it within 24 hours.
              </p>
              <Link
                to="/booking"
                className="btn-primary w-full justify-center py-3 text-sm"
              >
                Get a custom quote
              </Link>
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <RelatedPosts currentSlug={slug} />
            </div>
          </aside>
        </div>
      </article>
    </>
  );
}
