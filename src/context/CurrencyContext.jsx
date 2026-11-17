import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const CurrencyContext = createContext();

export const CURRENCIES = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1.0, flag: '🇺🇸' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92, flag: '🇪🇺' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.79, flag: '🇬🇧' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.53, flag: '🇦🇺' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 1.36, flag: '🇨🇦' },
  TZS: { code: 'TZS', symbol: 'TSh ', name: 'Tanzanian Shilling', rate: 2600, flag: '🇹🇿' },
};

const STORAGE_KEY = 'jebri_preferred_currency';

export function CurrencyProvider({ children }) {
  const [currencyCode, setCurrencyCode] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved && CURRENCIES[saved] ? saved : 'USD';
    } catch {
      return 'USD';
    }
  });

  const currency = useMemo(() => CURRENCIES[currencyCode] || CURRENCIES.USD, [currencyCode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, currencyCode);
    } catch (e) {
      console.warn('Could not save currency preference:', e);
    }
  }, [currencyCode]);

  const convert = (usdAmount) => {
    if (!usdAmount || isNaN(usdAmount)) return 0;
    return Math.round(Number(usdAmount) * currency.rate);
  };

  const formatPrice = (usdAmount, options = {}) => {
    if (usdAmount === undefined || usdAmount === null || isNaN(usdAmount)) {
      return `${currency.symbol}0`;
    }
    const converted = convert(usdAmount);
    const formattedNum = converted.toLocaleString();
    return `${currency.symbol}${formattedNum}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencyCode,
        setCurrency: setCurrencyCode,
        currencies: CURRENCIES,
        convert,
        formatPrice,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      currency: CURRENCIES.USD,
      currencyCode: 'USD',
      setCurrency: () => {},
      currencies: CURRENCIES,
      convert: (amt) => amt || 0,
      formatPrice: (amt) => `$${(amt || 0).toLocaleString()}`,
    };
  }
  return context;
}
