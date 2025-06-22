import React, { useState, useEffect, useCallback } from 'react';
import { DocumentData } from 'firebase/firestore';
import API_BASE_URL from '../config/api';
import { useCurrency } from '../contexts/CurrencyContext';

interface Service extends DocumentData {
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

const ManageServices: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState({ name: '', description: '', price: '0', iconUrl: '' });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = API_BASE_URL;
  const { currency, convert } = useCurrency();

  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/services`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setServices(data);
    } catch (error: any) {
      console.error("Error fetching services:", error);
      setMessage(`Failed to fetch services: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      setMessage("Service name and price are required.");
      return;
    }
    setMessage('Adding service...');
    try {
      const response = await fetch(`${API_URL}/admin/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price)
        })
      });

      if (!response.ok) {
        const resData = await response.json();
        throw new Error(resData.message || 'Failed to add service');
      }

      setMessage('Service added successfully!');
      setForm({ name: '', description: '', price: '', iconUrl: '' });
      fetchServices(); // Refresh list
    } catch (error: any) {
      console.error("Error adding service:", error);
      setMessage(error.message);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Manage Services</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-semibold mb-4">Add New Service</h3>
          <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white rounded-lg shadow">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Service Name (e.g., Daily Cleaning)"
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
              Add Service
            </button>
            {message && <p className="mt-4 text-center">{message}</p>}
          </form>
        </div>
        
        <div>
          <h3 className="text-xl font-semibold mb-4">Existing Services</h3>
          {isLoading ? (
            <p>Loading services...</p>
          ) : (
            <div className="space-y-3">
              {services.length > 0 ? (
                services.map(service => (
                  <div key={service.id} className="p-4 bg-white rounded-lg shadow">
                    <h4 className="font-bold">{service.name} - {currencySymbols[currency]} {convert(Number(service.price)).toFixed(2)} {currency}</h4>
                    <p className="text-sm text-gray-600">{service.description}</p>
                  </div>
                ))
              ) : (
                <p>No services found. Add one to get started.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageServices; 