import React, { useState, useEffect, useCallback } from 'react';
import { DocumentData } from 'firebase/firestore';
import API_BASE_URL from '../config/api';

// Interfaces
interface Location extends DocumentData {
  id: string;
  name: string;
}
interface House extends DocumentData {
  id: string;
  name: string;
  address: string;
}

const ManageHouses: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [form, setForm] = useState({ name: '', address: '', description: '', locationRef: '', imageUrls: '' });
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = API_BASE_URL;

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [locationsRes, housesRes] = await Promise.all([
        fetch(`${API_URL}/admin/locations`),
        fetch(`${API_URL}/admin/houses`)
      ]);
      if (!locationsRes.ok || !housesRes.ok) throw new Error('Failed to fetch initial data.');
      
      const locationsData = await locationsRes.json();
      const housesData = await housesRes.json();
      
      setLocations(locationsData);
      setHouses(housesData);
    } catch (error: any) {
      setMessage(`Failed to fetch initial data: ${error.message}`);
      console.error(error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'locationRef') {
      const loc = locations.find(l => l.id === value);
      setSelectedLocation(loc || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.locationRef) {
        setMessage('House name and location are required.');
        return;
    }
    setMessage('Adding house...');
    try {
      const loc = locations.find(l => l.id === form.locationRef);
      const payload = {
        name: form.name,
        address: form.address,
        description: form.description,
        locationRef: `locations/${form.locationRef}`,
        latitude: loc?.coordinates?.latitude,
        longitude: loc?.coordinates?.longitude,
        imageUrls: form.imageUrls.split(',').map(s => s.trim()).filter(Boolean),
      };
      const response = await fetch(`${API_URL}/admin/houses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to add house");
      }
      setMessage('House added successfully!');
      setForm({ name: '', address: '', description: '', locationRef: '', imageUrls: '' });
      setSelectedLocation(null);
      fetchAllData();
    } catch (error: any) {
      setMessage(error.message);
      console.error(error);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Manage Houses</h2>
      {message && <p className="mb-4 text-center p-2 bg-blue-100 rounded-md">{message}</p>}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-semibold mb-4">Add New House</h3>
          <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white rounded-lg shadow">
            <input name="name" value={form.name} onChange={handleChange} placeholder="House Name" className="input-field w-full" required />
            <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="input-field w-full" />
            <select name="locationRef" value={form.locationRef} onChange={handleChange} className="input-field w-full" required>
              <option value="">Select a Location*</option>
              {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
            </select>
            {selectedLocation && (
              <div className="text-sm text-gray-600 mb-2">
                Coords: {selectedLocation.coordinates.latitude.toFixed(6)}, {selectedLocation.coordinates.longitude.toFixed(6)}
              </div>
            )}
            <input name="address" value={form.address} onChange={handleChange} placeholder="Address (optional)" className="input-field w-full" />
            <input name="imageUrls" value={form.imageUrls} onChange={handleChange} placeholder="Image URLs (comma-separated)" className="input-field w-full" />
            <button type="submit" className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600" disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Add House'}
            </button>
          </form>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-4">Existing Houses</h3>
          {isLoading ? <p>Loading houses...</p> : (
            <div className="space-y-3 h-[600px] overflow-y-auto">
              {houses.length > 0 ? houses.map(house => (
                <div key={house.id} className="p-4 bg-white rounded-lg shadow">
                  <h4 className="font-bold">{house.name}</h4>
                  <p className="text-sm text-gray-600">{house.address}</p>
                </div>
              )) : <p>No houses found. Add one to get started.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageHouses; 