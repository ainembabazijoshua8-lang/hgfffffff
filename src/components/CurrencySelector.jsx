import { useState, useRef, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext.jsx';

export default function CurrencySelector({ className = '', align = 'right' }) {
  const { currencyCode, setCurrency, currencies } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const current = currencies[currencyCode] || currencies.USD;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold border border-savanna-200 bg-cream-50 text-teal-800 hover:bg-cream-100 hover:border-terracotta-300 transition shadow-sm focus:outline-none focus:ring-2 focus:ring-terracotta-300"
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Change currency"
      >
        <span className="hidden 2xl:inline text-sm leading-none">{current.flag}</span>
        <span className="font-bold text-teal-700">{current.code}</span>
        <span className="text-teal-500/80">{current.symbol.trim()}</span>
        <svg
          className={`w-3.5 h-3.5 text-teal-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} mt-2 w-48 rounded-2xl bg-white border border-savanna-200 shadow-cardHover py-2 z-50 animate-fade-up`}
          role="menu"
        >
          <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-teal-500/80 border-b border-savanna-100 mb-1">
            Display Currency
          </div>
          {Object.values(currencies).map((curr) => {
            const isSelected = curr.code === currencyCode;
            return (
              <button
                key={curr.code}
                type="button"
                onClick={() => {
                  setCurrency(curr.code);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition ${
                  isSelected
                    ? 'bg-terracotta-50 text-terracotta-500 font-bold'
                    : 'text-teal-800 hover:bg-cream-100'
                }`}
                role="menuitem"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{curr.flag}</span>
                  <div>
                    <div className="font-semibold">{curr.code}</div>
                    <div className="text-[10px] text-teal-500/80">{curr.name}</div>
                  </div>
                </div>
                <span className="font-mono text-xs font-semibold text-teal-600">
                  {curr.symbol.trim()}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
