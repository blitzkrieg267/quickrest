import React, { useState, useEffect, useCallback } from 'react';
import { DocumentData } from 'firebase/firestore';
import API_BASE_URL from '../config/api';

interface Amenity extends DocumentData {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
}

const ManageAmenities: React.FC = () => {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [form, setForm] = useState({ name: '', description: '', iconUrl: '' });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = API_BASE_URL;

  const fetchAmenities = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/amenities`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAmenities(data);
    } catch (error: any) {
      console.error("Error fetching amenities:", error);
      setMessage(`Failed to fetch amenities: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAmenities();
  }, [fetchAmenities]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      setMessage("Amenity name is required.");
      return;
    }
    setMessage('Adding amenity...');
    try {
      const response = await fetch(`${API_URL}/admin/amenities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add amenity');
      }

      setMessage('Amenity added successfully!');
      setForm({ name: '', description: '', iconUrl: '' }); // Reset form
      fetchAmenities(); // Refresh the list
    } catch (error: any) {
      console.error("Error adding amenity:", error);
      setMessage(error.message);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Manage Amenities</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-semibold mb-4">Add New Amenity</h3>
          <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white rounded-lg shadow">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Amenity Name (e.g., Wi-Fi)"
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
              name="iconUrl"
              value={form.iconUrl}
              onChange={handleChange}
              placeholder="Icon URL (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <button type="submit" className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600" disabled={isLoading}>
              Add Amenity
            </button>
            {message && <p className="mt-4 text-center">{message}</p>}
          </form>
        </div>
        
        <div>
          <h3 className="text-xl font-semibold mb-4">Existing Amenities</h3>
          {isLoading ? (
            <p>Loading amenities...</p>
          ) : (
            <div className="space-y-3">
              {amenities.length > 0 ? (
                amenities.map(amenity => (
                  <div key={amenity.id} className="p-4 bg-white rounded-lg shadow">
                    <h4 className="font-bold">{amenity.name}</h4>
                    <p className="text-sm text-gray-600">{amenity.description}</p>
                    {amenity.iconUrl && <img src={amenity.iconUrl} alt={amenity.name} className="w-8 h-8 mt-2" />}
                  </div>
                ))
              ) : (
                <p>No amenities found. Add one to get started.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageAmenities; 