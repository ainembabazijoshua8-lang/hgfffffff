import { Link } from 'react-router-dom';
import CurrencySelector from './CurrencySelector.jsx';
import { openWhatsApp } from '../utils/whatsapp.js';
import TripadvisorBadge from './TripadvisorBadge.jsx';

// Social handles — populated as we get them
const HANDLE_IG    = 'jebri_safaris';
const INSTAGRAM_URL = 'https://www.instagram.com/jebri_safaris?utm_source=qr&igsi=MWwzZDIydXp5aDl6bQ==';
const HANDLE_FB    = 'jebrisafaris';
const HANDLE_TIKTOK = null; // placeholder

export default function Footer() {
  return (
    <footer className="relative mt-32 bg-gradient-to-br from-teal-900 via-acacia to-teal-900 pt-16 text-cream-100">
      {/* Decorative top wave/divider */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-0 rotate-180 -translate-y-[99%]">
        <svg className="block w-full h-[40px] md:h-[60px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z" fill="currentColor" className="text-teal-800"></path>
        </svg>
      </div>

      <div className="container-x pb-16 grid gap-12 md:grid-cols-2 lg:grid-cols-5 relative z-10">

        {/* Brand */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
             <img src="/assets/images/logo.jpg" alt="Jebri Safaris logo" width={48} height={48} className="rounded-full ring-2 ring-terracotta-400/50" loading="lazy" />
            <div>
              <div className="font-display text-xl">Jebri Safaris</div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-cream-100/70">Explore · Experience · Remember</div>
            </div>
          </div>
          <p className="text-cream-100/80 leading-relaxed max-w-sm">
            Locally-rooted, internationally-trusted. East African safaris that fund conservation and communities.
          </p>

          {/* Social + email block */}
          <div className="mt-6">
            <div className="text-[10px] uppercase tracking-[0.18em] text-cream-100/60 mb-2">Follow our journeys</div>
            <div className="flex flex-wrap items-center gap-3">
              {/* WhatsApp — active */}
              <a href="https://wa.me/255657253723" target="_blank" rel="noreferrer"
                 aria-label="WhatsApp"
                 className="w-10 h-10 rounded-full bg-cream-50/10 hover:bg-terracotta-400 hover:shadow-glow hover:-translate-y-1 flex items-center justify-center transition-all duration-300">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/></svg>
              </a>
              {/* Instagram — active */}
                <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer"
                  aria-label="Instagram @jebri_safaris"
                 className="w-10 h-10 rounded-full bg-cream-50/10 hover:bg-terracotta-400 hover:shadow-glow hover:-translate-y-1 flex items-center justify-center transition-all duration-300">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              {/* Facebook — active */}
              <a href={`https://www.facebook.com/${HANDLE_FB}`} target="_blank" rel="noreferrer"
                 aria-label="Facebook @jebrisafaris"
                 className="w-10 h-10 rounded-full bg-cream-50/10 hover:bg-terracotta-400 hover:shadow-glow hover:-translate-y-1 flex items-center justify-center transition-all duration-300">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.884 9.888 11.891v-8.448H7.077v-3.491h3.111V9.86c0-3.075 1.822-4.787 4.619-4.787 1.335 0 2.726.238 2.726.238v3.001h-1.535c-1.515 0-1.993.94-1.993 1.906v2.262h3.355l-.534 3.491h-2.821v8.448C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              {/* TikTok — disabled until handle exists */}
              <button type="button" aria-disabled="true" tabIndex={-1} aria-label="TikTok — coming soon" title="TikTok — coming soon" className="w-10 h-10 rounded-full bg-cream-50/5 flex items-center justify-center opacity-40 cursor-not-allowed">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.55a8.16 8.16 0 0 0 4.77 1.52V6.69a4.85 4.85 0 0 1-1.84 0z"/></svg>
              </button>
            </div>
            <div className="mt-4 text-sm text-cream-100/80">
              <div className="text-[10px] uppercase tracking-[0.18em] text-cream-100/60 mb-1">Scan to follow</div>
              <div className="flex items-center gap-3">
                <img
                  src="/assets/images/instagram-qr.png"
                  alt="Scan to follow @jebri_safaris on Instagram"
                   width={72} height={72}
                   loading="lazy"
                   className="rounded-lg ring-1 ring-cream-50/20 w-[72px] h-[72px]"
                />
                <div className="min-w-0">
                  <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer"
                     className="text-cream-50 font-display hover:text-terracotta-300 break-all">
                    @{HANDLE_IG}
                  </a>
                  <div className="text-[11px] text-cream-100/60 mt-0.5">Wildlife sightings & trip photos, weekly.</div>
                </div>
              </div>
            </div>
            <div className="mt-5 text-sm">
              <div className="text-[10px] uppercase tracking-[0.18em] text-cream-100/60 mb-1">WhatsApp</div>
              <a href="https://wa.me/255657253723" target="_blank" rel="noreferrer" className="text-cream-50 hover:text-terracotta-300 font-display">
                Chat with our safari team
              </a>
              <div className="text-[11px] text-cream-100/60 mt-0.5">Fast answers during office hours.</div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-display text-lg mb-4">Explore</h4>
          <ul className="space-y-2 text-cream-100/80">
            <li><Link to="/tours" className="hover:text-terracotta-300 transition">All Tours</Link></li>
            <li><Link to="/tours?category=Wildlife+Safari" className="hover:text-terracotta-300 transition">Wildlife Safaris</Link></li>
            <li><Link to="/tours?category=Cultural+Tour" className="hover:text-terracotta-300 transition">Cultural Tours</Link></li>
            <li><Link to="/activities" className="hover:text-terracotta-300 transition">Activities & Add-ons</Link></li>
            <li><Link to="/gallery" className="hover:text-terracotta-300 transition">Photo Gallery</Link></li>
            <li><Link to="/blog" className="hover:text-terracotta-300 transition">Travel Journal</Link></li>
            <li><Link to="/faq" className="hover:text-terracotta-300 transition">Packing Checklist</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-lg mb-4">Company</h4>
          <ul className="space-y-2 text-cream-100/80">
            <li><Link to="/about" className="hover:text-terracotta-300 transition">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-terracotta-300 transition">Contact</Link></li>
            <li><Link to="/faq" className="hover:text-terracotta-300 transition">FAQ & Advice</Link></li>
            <li><Link to="/booking" className="hover:text-terracotta-300 transition">Trip Planner</Link></li>
<li><Link to="/terms" className="hover:text-terracotta-300 transition">Terms &amp; Conditions</Link></li>
          <li><Link to="/privacy" className="hover:text-terracotta-300 transition">Privacy Policy</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-lg mb-2">Stay close to the wild</h4>
          <p className="text-cream-100/80 text-sm mb-4">Ask about seasonal sightings, fresh routes, and last-minute spaces on WhatsApp.</p>
          <button type="button" onClick={() => openWhatsApp('Jebri Safaris - I would like updates about new safari routes and seasonal experiences.')} className="w-full rounded-full bg-terracotta-400 py-3 font-semibold text-cream-50 transition-all duration-300 hover:scale-[1.02] hover:bg-terracotta-500 hover:shadow-glow">
            Get WhatsApp updates
          </button>

          <div className="mt-6 pt-4 border-t border-cream-50/10 flex items-center justify-between">
            <span className="text-xs text-cream-100/70">Currency:</span>
            <CurrencySelector align="left" />
          </div>
        </div>
      </div>

      {/* Global review band: the footer is mounted once in the app shell, so the
          Tripadvisor award, badge and QR code appear on every route. */}
      <div className="border-t border-cream-50/10">
        <div className="container-x py-10">
          <TripadvisorBadge />
        </div>

        <div className="container-x py-6 flex flex-col md:flex-row gap-3 items-center justify-between text-sm text-cream-100/60">
          <p>© {new Date().getFullYear()} Jebri Safaris. All rights reserved. Registered Tanzania tour operator.</p>
          <p>Made with care on the slopes of Mount Meru.</p>
        </div>
      </div>
    </footer>
  );
}
