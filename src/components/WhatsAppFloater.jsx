import { useEffect, useState } from 'react';

const PHONE = '255657253723';
const PHONE_ALT = '255787996608';

const QUICK_MESSAGES = [
  "I'd like to plan a safari to the Serengeti 🦁",
  "What's the best time to visit Tanzania?",
  "Do you offer family-friendly safaris? 👨‍👩‍👧",
  "I need a custom quote for my group",
];

function WhatsAppSVG({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
    </svg>
  );
}

export default function WhatsAppFloater() {
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [badgeSeen, setBadgeSeen] = useState(false);

  useEffect(() => {
    // Show button after 1.5s
    const t1 = setTimeout(() => setShow(true), 1500);
    // Pulse attention after 5s
    const t2 = setTimeout(() => setPulse(true), 5000);
    const t3 = setTimeout(() => setPulse(false), 7500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  if (!show) return null;

  const buildUrl = (msg) =>
    `https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`;

  return (
    // .whatsapp-floater is a hook used by the map drawer's viewport coordination
    // (see src/components/map/drawerViewport.js): when a bottom-sheet drawer is
    // open the floater is translated up by --map-drawer-offset so it stays
    // reachable instead of being buried, and the transition lives in CSS.
    <div className="whatsapp-floater fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {/* Popup chat window */}
      {open && (
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-cardHover w-72 overflow-hidden border border-white/60 animate-fade-up">
          {/* Header */}
          <div className="bg-green-500 px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
              <WhatsAppSVG size={22} />
            </div>
            <div className="flex-1">
              <div className="text-white font-semibold text-sm leading-tight">Jebri Safaris</div>
              <div className="text-green-100 text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-200 rounded-full inline-block animate-pulse" />
                Online · replies in minutes
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/80 hover:text-white text-lg leading-none"
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          {/* Chat bubble */}
          <div className="bg-cream-50/50 px-4 py-4">
            <div className="bg-white rounded-xl rounded-tl-none shadow-sm p-3 text-sm text-teal-800 max-w-[90%]">
              👋 Hi! Ready to plan your dream safari?<br />
              Pick a message or tap to chat directly.
            </div>
            <div className="text-right text-[10px] text-teal-600 mt-1">Jebri Safaris</div>
          </div>

          {/* Quick replies */}
          <div className="px-4 pb-4 bg-gray-50 space-y-2">
            {QUICK_MESSAGES.map((msg) => (
              <a
                key={msg}
                href={buildUrl(msg)}
                target="_blank"
                rel="noreferrer"
                className="block w-full text-left text-sm text-green-700 bg-white border border-green-200 hover:bg-green-50 rounded-xl px-3 py-2 transition-colors"
              >
                {msg}
              </a>
            ))}
          </div>

          {/* Second number */}
          <div className="px-4 pb-4 bg-gray-50">
            <div className="text-center text-xs text-gray-400 mb-2">Also available on</div>
            <a
              href={`https://wa.me/${PHONE_ALT}?text=${encodeURIComponent("Hi Jebri Safaris! I'd like to plan a trip.")}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 text-xs text-green-600 hover:text-green-700"
            >
              <WhatsAppSVG size={13} />
              +255 787 996 608
            </a>
          </div>
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => { setOpen(o => !o); setBadgeSeen(true); }}
        aria-label={open ? 'Close WhatsApp chat' : 'Chat with us on WhatsApp'}
        className={`relative flex items-center gap-2.5 bg-[#25D366] hover:bg-[#1DA851] text-white pl-4 pr-5 py-3.5 rounded-full shadow-cardHover transition-all duration-300 hover:scale-[1.05] active:scale-[0.98] ${
          pulse && !open ? 'animate-glow-pulse' : ''
        }`}
      >
        {/* Ripple ring when pulsing */}
        {pulse && !open && (
          <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
        )}
        <WhatsAppSVG size={22} />
        <span className="hidden sm:inline text-sm font-semibold">Chat with us</span>
        {!open && !badgeSeen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center text-white font-bold">
            1
          </span>
        )}
      </button>
    </div>
  );
}
