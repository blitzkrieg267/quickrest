import React from 'react';
import { useCurrency } from '../contexts/CurrencyContext';

const SUPPORTED_CURRENCIES = ['BWP', 'USD', 'GBP', 'EUR', 'JPY', 'ZAR'] as const;

const CurrencySelector: React.FC = () => {
  const { currency, setCurrency } = useCurrency();
  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="currency-select" className="text-sm font-medium">Currency:</label>
      <select
        id="currency-select"
        value={currency}
        onChange={e => setCurrency(e.target.value as typeof SUPPORTED_CURRENCIES[number])}
        className="input-field w-auto px-2 py-1"
      >
        {SUPPORTED_CURRENCIES.map(cur => (
          <option key={cur} value={cur}>{cur}</option>
        ))}
      </select>
    </div>
  );
};

export default CurrencySelector; 