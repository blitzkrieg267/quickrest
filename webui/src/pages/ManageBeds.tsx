import React, { useState, useEffect, useCallback } from 'react';
import API_BASE_URL from '../config/api';
import { useCurrency } from '../contexts/CurrencyContext';

interface Bed {
  id: string;
  roomRef: string;
  color: string;
  pricePerNight: number;
}
interface Room {
  id: string;
  roomNumberOrName: string;
}

const currencySymbols: Record<string, string> = {
  BWP: 'P',
  USD: '$',
  GBP: '£',
  EUR: '€',
  JPY: '¥',
  ZAR: 'R',
};

const ManageBeds: React.FC = () => {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [form, setForm] = useState({ roomRef: '', color: '#00bcd4', pricePerNight: '' });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { currency, convert } = useCurrency();

  const API_URL = API_BASE_URL;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [roomsRes, bedsRes] = await Promise.all([
        fetch(`${API_URL}/admin/rooms`),
        fetch(`${API_URL}/admin/beds`)
      ]);
      if (!roomsRes.ok || !bedsRes.ok) throw new Error('Failed to fetch data.');
      setRooms(await roomsRes.json());
      setBeds(await bedsRes.json());
    } catch (error: any) {
      setMessage(`Failed to fetch data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.roomRef || !form.pricePerNight) {
      setMessage('Room and price are required.');
      return;
    }
    setMessage('Adding bed...');
    try {
      const payload = {
        roomRef: `rooms/${form.roomRef}`,
        color: form.color,
        pricePerNight: parseFloat(form.pricePerNight),
      };
      const response = await fetch(`${API_URL}/admin/beds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const resData = await response.json();
        throw new Error(resData.message || 'Failed to add bed.');
      }
      setMessage('Bed added successfully!');
      setForm({ roomRef: '', color: '#00bcd4', pricePerNight: '' });
      fetchData();
    } catch (error: any) {
      setMessage(error.message);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Manage Beds</h2>
      {message && <p className="mb-4 text-center p-2 bg-blue-100 rounded-md">{message}</p>}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Add New Bed</h3>
          {isLoading ? <p>Loading form data...</p> : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <select name="roomRef" value={form.roomRef} onChange={handleChange} className="input-field w-full" required>
                <option value="">Select a Room*</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.roomNumberOrName}</option>)}
              </select>
              <input type="color" name="color" value={form.color} onChange={handleChange} className="w-16 h-10 border rounded" />
              <input type="number" name="pricePerNight" value={form.pricePerNight} onChange={handleChange} placeholder="Price per Night (BWP)*" className="input-field w-full" required />
              <button type="submit" className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600" disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Add Bed'}
              </button>
            </form>
          )}
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Existing Beds</h3>
          {isLoading ? <p>Loading beds...</p> : (
            <div className="space-y-3 h-[600px] overflow-y-auto">
              {beds.length > 0 ? beds.map(bed => (
                <div key={bed.id} className="p-3 bg-gray-50 rounded-lg border flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: bed.color }} title={bed.color}></div>
                    <span className="font-bold">{rooms.find(r => `rooms/${r.id}` === bed.roomRef)?.roomNumberOrName || 'Unknown Room'}</span>
                  </div>
                  <div className="text-sm text-gray-700">
                    {currencySymbols[currency]} {convert(Number(bed.pricePerNight)).toFixed(2)} {currency}
                  </div>
                </div>
              )) : <p>No beds found. Add one to get started.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageBeds; 