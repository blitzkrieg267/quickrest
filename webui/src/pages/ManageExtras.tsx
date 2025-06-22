import React, { useState, useEffect, useCallback } from 'react';
import { DocumentData } from 'firebase/firestore';
import API_BASE_URL from '../config/api';
import { useCurrency } from '../contexts/CurrencyContext';

interface Extra extends DocumentData {
  id: string;
  name: string;
  description: string;
  price: number;
  iconUrl: string;
}

const currencySymbols: Record<string, string> = {
  BWP: 'P',
  USD: '$',
  GBP: '£',
  EUR: '€',
  JPY: '¥',
  ZAR: 'R',
};

const ManageExtras: React.FC = () => {
  const [extras, setExtras] = useState<Extra[]>([]);
  const [form, setForm] = useState({ name: '', description: '', price: '0', iconUrl: '' });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { currency, convert } = useCurrency();

  const API_URL = API_BASE_URL;

  const fetchExtras = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/extras`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setExtras(data);
    } catch (error: any) {
      console.error("Error fetching extras:", error);
      setMessage(`Failed to fetch extras: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExtras();
  }, [fetchExtras]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      setMessage("Extra name and price are required.");
      return;
    }
    setMessage('Adding extra...');
    try {
      const response = await fetch(`${API_URL}/admin/extras`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price)
        })
      });

      if (!response.ok) {
        const resData = await response.json();
        throw new Error(resData.message || 'Failed to add extra');
      }

      setMessage('Extra added successfully!');
      setForm({ name: '', description: '', price: '', iconUrl: '' });
      fetchExtras(); // Refresh list
    } catch (error: any) {
      console.error("Error adding extra:", error);
      setMessage(error.message);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Manage Extras</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-semibold mb-4">Add New Extra</h3>
          <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white rounded-lg shadow">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Extra Name (e.g., Bicycle Rental)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              placeholder="Price (BWP)*"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
            <input
              name="iconUrl"
              value={form.iconUrl}
              onChange={handleChange}
              placeholder="Icon URL (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <button type="submit" className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600" disabled={isLoading}>
              Add Extra
            </button>
            {message && <p className="mt-4 text-center">{message}</p>}
          </form>
        </div>
        
        <div>
          <h3 className="text-xl font-semibold mb-4">Existing Extras</h3>
          {isLoading ? (
            <p>Loading extras...</p>
          ) : (
            <div className="space-y-3">
              {extras.length > 0 ? (
                extras.map(extra => (
                  <div key={extra.id} className="p-4 bg-white rounded-lg shadow">
                    <h4 className="font-bold">{extra.name} - {currencySymbols[currency]} {convert(Number(extra.price)).toFixed(2)} {currency}</h4>
                    <p className="text-sm text-gray-600">{extra.description}</p>
                  </div>
                ))
              ) : (
                <p>No extras found. Add one to get started.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageExtras; 