import React, { createContext, useContext, useEffect, useState } from 'react';

const SUPPORTED_CURRENCIES = ['BWP', 'USD', 'GBP', 'EUR', 'JPY', 'ZAR'] as const;
type Currency = typeof SUPPORTED_CURRENCIES[number];

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  rates: Record<string, number>;
  convert: (amountBWP: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>('BWP');
  const [rates, setRates] = useState<Record<string, number>>({ BWP: 1 });

  useEffect(() => {
    // Fetch rates from exchangerate.host (base BWP)
    fetch('https://api.exchangerate.host/latest?base=BWP&symbols=' + SUPPORTED_CURRENCIES.join(','))
      .then(res => res.json())
      .then(data => {
        if (data && data.rates) setRates({ ...data.rates, BWP: 1 });
      });
  }, []);

  const convert = (amountBWP: number) => {
    const rate = rates[currency] || 1;
    return amountBWP * rate;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rates, convert }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}; 