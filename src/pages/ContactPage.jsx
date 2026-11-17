import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { buildWhatsAppMessage, openWhatsApp } from '../utils/whatsapp.js';

const initial = { name: '', email: '', phone: '', message: '', website: '' };

export default function ContactPage() {
  const [searchParams] = useSearchParams();
  const experience = searchParams.get('experience') || '';
  const [data, setData] = useState(() => ({
    ...initial,
    message: experience ? `I'm interested in ${experience}. Please include it in a custom safari itinerary.` : '',
  }));
  const [status, setStatus] = useState({ state: 'idle', msg: '' });

  function update(k) { return e => setData(d => ({ ...d, [k]: e.target.value })); }

  async function submit(e) {
    e.preventDefault();
    setStatus({ state: 'loading', msg: 'Sending your message…', ref: '' });

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name.trim(),
          email: data.email.trim(),
          phone: data.phone.trim() || undefined,
          message: data.message.trim(),
          source: 'contact',
          website: data.website || undefined,
        }),
      });

      const resData = await res.json();
      if (!res.ok || !resData.ok) {
        throw new Error(resData.error || 'Could not send message.');
      }

      const refCode = resData.reference || 'JS-MSG';
      setStatus({
        state: 'ok',
        msg: `Message successfully sent (Ref: #${refCode}). Our team will reply to your email within 24 hours.`,
        ref: refCode,
      });

      openWhatsApp(buildWhatsAppMessage(`New contact enquiry [Ref: #${refCode}]`, {
        Reference: refCode,
        Name: data.name,
        Email: data.email,
        'Phone / WhatsApp': data.phone,
        Message: data.message,
      }));
    } catch (err) {
      openWhatsApp(buildWhatsAppMessage('New contact enquiry', {
        Name: data.name,
        Email: data.email,
        'Phone / WhatsApp': data.phone,
        Message: data.message,
      }));
      setStatus({ state: 'ok', msg: 'WhatsApp opened with your enquiry ready to send.' });
    }
  }

  return (
    <>
      <section className="relative bg-teal-800 text-cream-50 py-20 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-hero-vignette opacity-50 mix-blend-multiply" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,104,61,0.15),transparent_50%)]" />
        <div className="container-x text-center relative z-10">
          <span className="eyebrow text-terracotta-300 drop-shadow-sm">Get in touch</span>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl mt-4 animate-slide-up">We'd love to hear from you</h1>
          <p className="mt-6 text-cream-50/90 max-w-2xl mx-auto text-lg sm:text-xl font-light leading-relaxed animate-slide-up" style={{ animationDelay: '100ms' }}>
            Questions, custom itineraries, group bookings — we reply to every message within 24 hours.
          </p>
        </div>
      </section>

      <section className="container-x py-20 grid lg:grid-cols-5 gap-12">
        <div className="lg:col-span-3">
          <form onSubmit={submit} className="glass-card p-6 sm:p-10 grid gap-6 animate-slide-up">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="c-name">Name *</label>
                <input id="c-name" required minLength={2} value={data.name} onChange={update('name')} className="field bg-white/80 focus:bg-white backdrop-blur-sm" />
              </div>
              <div>
                <label className="label" htmlFor="c-email">Your email *</label>
                <input id="c-email" required type="email" value={data.email} onChange={update('email')} className="field bg-white/80 focus:bg-white backdrop-blur-sm" />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="c-phone">Phone / WhatsApp</label>
              <input id="c-phone" value={data.phone} onChange={update('phone')} className="field bg-white/80 focus:bg-white backdrop-blur-sm" />
            </div>
            <div>
              <label className="label" htmlFor="c-msg">Message *</label>
              <textarea id="c-msg" required minLength={10} rows={6} value={data.message} onChange={update('message')} className="field bg-white/80 focus:bg-white backdrop-blur-sm" placeholder="Tell us what you have in mind…" />
            </div>
            <div style={{ position: 'absolute', left: '-10000px' }} aria-hidden="true">
              <label>Website<input tabIndex={-1} autoComplete="off" value={data.website} onChange={update('website')} /></label>
            </div>
            <p className="text-sm text-teal-700/80 bg-acacia/20 border border-acacia/30 rounded-xl p-4 leading-relaxed">
              Your message opens directly in WhatsApp with the details filled in. Review it and tap Send.
            </p>
            <button type="submit" className="btn-primary">
              Open WhatsApp
            </button>
            {status.state === 'ok' && <div className="rounded-xl border border-sage-200 bg-sage-50 p-4 text-sm text-sage-700">{status.msg}</div>}
            {status.state === 'err' && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 text-sm">{status.msg}</div>
            )}
          </form>
        </div>

        <aside className="lg:col-span-2 space-y-6">
          {/* Quick line: phone + WhatsApp + office */}
          <div className="glass-card p-8 hover:-translate-y-1 transition-transform duration-300">
            <h3 className="font-display text-2xl text-teal-800 mb-5">Reach us directly</h3>
            <ul className="space-y-5 text-teal-700/85">
              <li className="flex gap-4">
                <span className="text-terracotta-400 shrink-0 mt-0.5 text-xl">📞</span>
                <div className="min-w-0">
                  <div className="font-semibold">Phone</div>
                  <a href="tel:+255657253723" className="hover:text-terracotta-400 break-all">+255 657 253 723</a>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="text-terracotta-400 shrink-0 mt-0.5 text-xl">💬</span>
                <div className="min-w-0">
                  <div className="font-semibold text-teal-800">WhatsApp</div>
                  <a href="https://wa.me/255657253723" className="hover:text-terracotta-400">+255 657 253 723</a>
                  <div className="text-sm text-teal-500 mt-0.5">
                    also: <a href="https://wa.me/255787996608" className="hover:text-terracotta-400">+255 787 996 608</a>
                  </div>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="text-terracotta-400 shrink-0 mt-0.5 text-xl">📍</span>
                <div>
                  <div className="font-semibold text-teal-800">Office</div>
                  <span className="text-sm">Old Moshi Road, Arusha, Tanzania</span>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="text-terracotta-400 shrink-0 mt-0.5 text-xl">🕐</span>
                <div>
                  <div className="font-semibold text-teal-800">Office hours</div>
                  <span className="text-sm">Mon–Sat · 8:00–18:00 EAT (UTC+3)</span>
                </div>
              </li>
            </ul>
          </div>

          <div className="glass-card bg-gradient-to-br from-teal-700 to-teal-900 p-8 text-cream-50 hover:-translate-y-1 transition-transform duration-300">
            <h3 className="font-display text-2xl mb-2">Chat with the team</h3>
            <p className="text-sm leading-relaxed text-cream-50/85">WhatsApp is the fastest way to share dates, ask questions, and start shaping your safari.</p>
            <a href="https://wa.me/255657253723" target="_blank" rel="noreferrer" className="btn-outline mt-6 w-full border-white/30 text-center hover:bg-white/10">Open WhatsApp</a>
          </div>

          {/* QR card — quick IG follow */}
          <div className="glass-card overflow-hidden hover:-translate-y-1 transition-transform duration-300">
            <div className="p-8 pb-5">
              <h3 className="font-display text-2xl text-teal-800 mb-1">Follow our journeys</h3>
              <p className="text-sm text-teal-700/70">
                Scan to see what we're posting this week on Instagram.
              </p>
            </div>
            <div className="px-8 pb-8 flex items-center gap-5">
              <img
                src="/assets/images/instagram-qr.jpg"
                alt="Scan to open Jebri Safaris on Instagram"
                 width={124}
                 height={124}
                 loading="lazy"
                 className="rounded-xl ring-1 ring-cream-200 w-[124px] h-[124px]"
              />
              <div className="min-w-0">
                <a
                  href="https://www.instagram.com/jebri_safaris?utm_source=qr&igsi=MWwzZDIydXp5aDl6bQ=="
                  target="_blank" rel="noreferrer"
                  className="block font-display text-base text-teal-700 hover:text-terracotta-400 break-all"
                >
                  @jebri_safaris
                </a>
                <p className="text-xs text-teal-700/65 mt-1 leading-relaxed">
                  Real-time wildlife sightings, trip photos, and deals.
                </p>
              </div>
            </div>
          </div>

          {/* Facebook card */}
          <div className="glass-card overflow-hidden hover:-translate-y-1 transition-transform duration-300">
            <div className="p-8 pb-5">
              <h3 className="font-display text-2xl text-teal-800 mb-1">Find us on Facebook</h3>
              <p className="text-sm text-teal-700/70">
                Travel inspiration, safari stories, and special offers.
              </p>
            </div>
            <div className="px-8 pb-8 flex items-center gap-5">
              <div className="w-[124px] h-[124px] rounded-xl bg-[#1877F2] flex items-center justify-center shrink-0">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.884 9.888 11.891v-8.448H7.077v-3.491h3.111V9.86c0-3.075 1.822-4.787 4.619-4.787 1.335 0 2.726.238 2.726.238v3.001h-1.535c-1.515 0-1.993.94-1.993 1.906v2.262h3.355l-.534 3.491h-2.821v8.448C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </div>
              <div className="min-w-0">
                <a
                  href="https://www.facebook.com/jebrisafaris"
                  target="_blank" rel="noreferrer"
                  className="block font-display text-base text-teal-700 hover:text-terracotta-400 break-all"
                >
                  facebook.com/jebrisafaris
                </a>
                <p className="text-xs text-teal-700/65 mt-1 leading-relaxed">
                  Real-time wildlife sightings, trip photos, and deals.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card overflow-hidden shadow-md">
            <iframe
              title="Office location map"
              src="https://www.openstreetmap.org/export/embed.html?bbox=36.66%2C-3.41%2C36.74%2C-3.36&layer=mapnik&marker=-3.3869%2C36.6829"
              className="w-full h-72 border-0 opacity-90 mix-blend-multiply filter contrast-125 grayscale-[20%]"
              loading="lazy"
            />
            <div className="px-4 py-3 text-xs text-teal-700/70">
              Old Moshi Road, Arusha · Open in <a href="https://www.openstreetmap.org/?mlat=-3.3869&mlon=36.6829#map=14/-3.3869/36.6829" target="_blank" rel="noreferrer" className="text-terracotta-400 hover:underline">OpenStreetMap</a>
            </div>
          </div>
        </aside>
      </section>
    </>
  );
}
