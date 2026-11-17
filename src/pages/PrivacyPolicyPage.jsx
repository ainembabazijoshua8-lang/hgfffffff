const SECTIONS = [
  {
    title: '1. Who we are and how to contact us',
    body: [
      'Jebri Safaris organises tailor-made and scheduled wildlife, cultural and beach travel in Tanzania and Kenya. This policy explains what happens to the information you give us when you make an enquiry, submit a trip plan, or book a tour.',
      'Questions about this policy can be sent to our team at any time and we will respond in writing.',
    ],
  },
  {
    title: '2. What we collect',
    body: [
      'We only collect what we need in order to plan and deliver your trip:',
      'Contact details you provide — name, email address, phone or WhatsApp number, and your country of residence.',
      'Travel details — dates, party size and size of rooms, and any dietary, accessibility or medical requirements you choose to tell us.',
      'Enquiry content — the messages, tour selections and trip plans you submit through our forms.',
    ],
  },
  {
    title: '3. How we use your information',
    body: [
      'We use your information to respond to your enquiry, prepare and confirm your itinerary, arrange accommodation, transfers, park permits and guides, process payment, and send your pre-departure documents.',
      'We do not sell your personal information, and we do not share it with third parties for their own marketing.',
    ],
  },
  {
    title: '4. Sharing with trusted suppliers',
    body: [
      'To deliver your booking we necessarily pass the relevant details to our suppliers — lodges, camp operators, airlines and ferries, park authorities, and our transfer partners. They receive only what they need to service your booking, such as your name, lead guest name, arrival date and party size.',
      'Some of these suppliers operate outside Tanzania and Kenya, so parts of your booking data may be processed in another country. Where we do so, we use suppliers we have assessed and, where available, contracts that limit their use of your data.',
    ],
  },
  {
    title: '5. Reviews and testimonials',
    body: [
      'If you submit a review, we store it and publish it only after it has been approved. Reviews are published alongside the author name and rating you supplied. You can ask us to correct or remove your review at any time by contacting our team.',
    ],
  },
  {
    title: '6. Cookies and analytics',
    body: [
      'Our site uses essential storage to remember preferences such as your selected display currency. If we introduce analytics or advertising cookies we will update this policy and, where the law requires it, ask for your consent before setting non-essential cookies.',
    ],
  },
  {
    title: '7. Retention',
    body: [
      'We keep enquiry and booking records only for as long as they are needed for the purpose they were collected for, and to meet legal, tax and accounting obligations. Records that carry no ongoing obligation are deleted or anonymised on a periodic basis.',
    ],
  },
  {
    title: '8. Your rights',
    body: [
      'Depending on where you live, you may have the right to access the personal information we hold about you, to ask us to correct or delete it, to object to certain processing, and to withdraw consent where you gave it.',
      'To exercise any of these rights, contact our team and we will respond within a reasonable period. If you are unhappy with our response you may be entitled to complain to your local data protection authority.',
    ],
  },
  {
    title: '9. Security',
    body: [
      'We take reasonable technical and organisational precautions to protect your information against unauthorised access, loss or disclosure, including restricting access to the systems that hold booking data and using encrypted connections.',
      'No method of transmission or storage is completely secure, so we cannot guarantee absolute security.',
    ],
  },
  {
    title: '10. Changes to this policy',
    body: [
      'We may update this policy as our services or legal obligations change. The date below always reflects the current version, and material changes will be highlighted on this page.',
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <>
      <section className="relative bg-teal-800 text-cream-50 py-20 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-hero-vignette opacity-50 mix-blend-multiply" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,104,61,0.15),transparent_50%)]" />
        <div className="container-x text-center relative z-10">
          <span className="eyebrow text-terracotta-300 drop-shadow-sm">Legal</span>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl mt-4 animate-slide-up">Privacy Policy</h1>
          <p className="mt-4 text-cream-200/90 max-w-2xl mx-auto">
            How we collect, use and protect the personal information you share with us.
          </p>
        </div>
      </section>

      <section className="container-x py-20 max-w-3xl">
        <div className="glass-card p-6 sm:p-10">
          {SECTIONS.map((s, i) => (
            <div key={s.title} className={i ? 'mt-8' : ''}>
              <h2 className="font-display text-xl sm:text-2xl text-teal-800">{s.title}</h2>
              {s.body.map((p, j) => (
                <p key={j} className="mt-3 text-teal-700/85 leading-relaxed">{p}</p>
              ))}
            </div>
          ))}
          <p className="mt-10 pt-6 border-t border-savanna-200 text-sm text-teal-600">
            Last updated 2 October 2026.
          </p>
        </div>
      </section>
    </>
  );
}
