import React, { useState, useEffect, useCallback } from 'react';
import { DocumentData } from 'firebase/firestore';
import API_BASE_URL from '../config/api';
import { useCurrency } from '../contexts/CurrencyContext';

// --- Interfaces ---
interface SelectableItem extends DocumentData {
  id: string;
  name: string;
}
interface Room extends DocumentData {
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

const ManageRooms: React.FC = () => {
  // --- State Management ---
  const [rooms, setRooms] = useState<Room[]>([]);
  const [houses, setHouses] = useState<SelectableItem[]>([]);
  const [amenities, setAmenities] = useState<SelectableItem[]>([]);
  const [services, setServices] = useState<SelectableItem[]>([]);
  const [extras, setExtras] = useState<SelectableItem[]>([]);
  
  const [form, setForm] = useState({
    houseRef: '',
    roomNumberOrName: '',
    description: '',
    pricePerNight: '',
    capacity: '',
    genderPreference: 'mixed',
    imageUrls: '',
    amenityRefs: [] as string[],
    serviceRefs: [] as string[],
    extraRefs: [] as string[],
    isAvailable: true,
  });

  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = API_BASE_URL;
  const { currency, convert } = useCurrency();

  // --- Data Fetching ---
  const fetchRequiredData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [housesRes, amenitiesRes, servicesRes, extrasRes, roomsRes] = await Promise.all([
        fetch(`${API_URL}/admin/houses`),
        fetch(`${API_URL}/admin/amenities`),
        fetch(`${API_URL}/admin/services`),
        fetch(`${API_URL}/admin/extras`),
        fetch(`${API_URL}/admin/rooms`),
      ]);

      if (!housesRes.ok || !amenitiesRes.ok || !servicesRes.ok || !extrasRes.ok || !roomsRes.ok) {
        throw new Error('Failed to fetch all required data.');
      }

      const housesData = await housesRes.json();
      const amenitiesData = await amenitiesRes.json();
      const servicesData = await servicesRes.json();
      const extrasData = await extrasRes.json();
      const roomsData = await roomsRes.json();

      setHouses(housesData);
      setAmenities(amenitiesData);
      setServices(servicesData);
      setExtras(extrasData);
      setRooms(roomsData);

    } catch (error: any) {
      console.error("Error fetching data:", error);
      setMessage(`Failed to fetch required data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequiredData();
  }, [fetchRequiredData]);

  // --- Form Handlers ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setForm(prev => ({...prev, [name]: checked}));
    } else {
        setForm(prev => ({...prev, [name]: value}));
    }
  };
  
  const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>, field: 'amenityRefs' | 'serviceRefs' | 'extraRefs') => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setForm(prev => ({ ...prev, [field]: selectedOptions }));
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.houseRef || !form.roomNumberOrName) {
      setMessage("House and Room Number/Name are required.");
      return;
    }
    setMessage('Adding room...');
    try {
      const payload = {
        ...form,
        houseRef: `houses/${form.houseRef}`,
        pricePerNight: parseFloat(form.pricePerNight),
        capacity: parseInt(form.capacity, 10),
        imageUrls: form.imageUrls.split(',').map(s => s.trim()).filter(Boolean),
        amenityRefs: form.amenityRefs.map(id => `amenities/${id}`),
        serviceRefs: form.serviceRefs.map(id => `services/${id}`),
        extraRefs: form.extraRefs.map(id => `extras/${id}`),
      };

      const response = await fetch(`${API_URL}/admin/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const resData = await response.json();
        throw new Error(resData.message || 'Failed to add room.');
      }

      setMessage('Room added successfully!');
      fetchRequiredData(); // Refresh all data
    } catch (error: any) {
      console.error("Error adding room:", error);
      setMessage(error.message);
    }
  }, [form, fetchRequiredData]);

  const multiSelectClasses = "input-field w-full h-32";
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Manage Rooms</h2>
      {message && <p className="mb-4 text-center p-2 bg-blue-100 rounded-md">{message}</p>}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Add New Room</h3>
          {isLoading ? <p>Loading form data...</p> : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <select name="houseRef" value={form.houseRef} onChange={handleChange} className="input-field w-full" required>
                <option value="">Select a House*</option>
                {houses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
              <input name="roomNumberOrName" value={form.roomNumberOrName} onChange={handleChange} placeholder="Room Number or Name*" className="input-field w-full" required />
              <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="input-field w-full" />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" name="pricePerNight" value={form.pricePerNight} onChange={handleChange} placeholder="Price/Night (BWP)*" className="input-field" required />
                <input type="number" name="capacity" value={form.capacity} onChange={handleChange} placeholder="Capacity*" className="input-field" required />
              </div>
              <select name="genderPreference" value={form.genderPreference} onChange={handleChange} className="input-field w-full">
                <option value="mixed">Mixed</option>
                <option value="male-only">Male Only</option>
                <option value="female-only">Female Only</option>
              </select>
              <input name="imageUrls" value={form.imageUrls} onChange={handleChange} placeholder="Image URLs (comma-separated)" className="input-field w-full" />
              
              <div>
                  <label htmlFor="amenities" className="block text-sm font-medium text-gray-700">Amenities (Ctrl+Click to multi-select)</label>
                  <select id="amenities" multiple value={form.amenityRefs} onChange={(e) => handleMultiSelectChange(e, 'amenityRefs')} className={multiSelectClasses}>
                      {amenities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
              </div>
              <div>
                  <label htmlFor="services" className="block text-sm font-medium text-gray-700">Services</label>
                  <select id="services" multiple value={form.serviceRefs} onChange={(e) => handleMultiSelectChange(e, 'serviceRefs')} className={multiSelectClasses}>
                      {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
              </div>
              <div>
                  <label htmlFor="extras" className="block text-sm font-medium text-gray-700">Extras</label>
                  <select id="extras" multiple value={form.extraRefs} onChange={(e) => handleMultiSelectChange(e, 'extraRefs')} className={multiSelectClasses}>
                      {extras.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                  </select>
              </div>

              <div className="flex items-center">
                <input type="checkbox" id="isAvailable" name="isAvailable" checked={form.isAvailable} onChange={handleChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-900">Room is Available</label>
              </div>

              <button type="submit" className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600" disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Add Room'}
              </button>
            </form>
          )}
        </div>
        
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Existing Rooms</h3>
          {isLoading ? <p>Loading rooms...</p> : (
            <div className="space-y-3 h-[600px] overflow-y-auto">
              {rooms.length > 0 ? (
                rooms.map(room => (
                  <div key={room.id} className="p-3 bg-gray-50 rounded-lg border">
                    <h4 className="font-bold">{room.roomNumberOrName}</h4>
                    <p>{currencySymbols[currency]} {convert(Number(room.pricePerNight)).toFixed(2)} {currency}</p>
                  </div>
                ))
              ) : (
                <p>No rooms found. Add one to get started.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageRooms;