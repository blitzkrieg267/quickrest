import React, { useState, useEffect, useCallback } from 'react';
import { DocumentData, GeoPoint } from 'firebase/firestore';
import API_BASE_URL from '../config/api';
import { GoogleMap, useJsApiLoader, Marker, StandaloneSearchBox } from '@react-google-maps/api';

interface Location extends DocumentData {
  id: string;
  name: string;
  description: string;
  coordinates: GeoPoint;
  imageUrl: string;
}

const ManageLocations: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [form, setForm] = useState({ name: '', description: '', latitude: '', longitude: '', imageUrl: '' });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = API_BASE_URL;

  const containerStyle = {
    width: '100%',
    height: '400px',
  };
  const libraries: "places"[] = ["places"];

  const [mapCenter, setMapCenter] = useState({ lat: -24.6282, lng: 25.9231 }); // Default: Gaborone
  const [markerPosition, setMarkerPosition] = useState(mapCenter);
  const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null);
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const fetchLocations = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/locations`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setLocations(data);
    } catch (error: any) {
      console.error("Error fetching locations:", error);
      setMessage(`Failed to fetch locations: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.latitude || !form.longitude) {
      setMessage("Location name, latitude, and longitude are required.");
      return;
    }
    setMessage('Adding location...');
    try {
      const coordinates = {
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
      };

      const response = await fetch(`${API_URL}/admin/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          imageUrl: form.imageUrl,
          coordinates,
        })
      });

      if (!response.ok) {
        const resData = await response.json();
        throw new Error(resData.message || 'Failed to add location');
      }

      setMessage('Location added successfully!');
      setForm({ name: '', description: '', latitude: '', longitude: '', imageUrl: '' });
      fetchLocations(); // Refresh list
    } catch (error: any) {
      console.error("Error adding location:", error);
      setMessage(error.message);
    }
  };

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const pos = e.latLng.toJSON();
      setMarkerPosition(pos);
      setForm(prev => ({ ...prev, latitude: pos.lat.toString(), longitude: pos.lng.toString() }));
    }
  }, []);

  const onSearchBoxLoad = useCallback((ref: google.maps.places.SearchBox) => setSearchBox(ref), []);

  const onPlacesChanged = useCallback(() => {
    const place = searchBox?.getPlaces()?.[0];
    if (place?.geometry?.location) {
      const location = place.geometry.location.toJSON();
      setMapCenter(location);
      setMarkerPosition(location);
      setForm(prev => ({ ...prev, latitude: location.lat.toString(), longitude: location.lng.toString() }));
    }
  }, [searchBox]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Manage Locations</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-semibold mb-4">Add New Location</h3>
          <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white rounded-lg shadow">
            <input name="name" value={form.name} onChange={handleChange} placeholder="Location Name (e.g., London)" className="input-field w-full" required />
            <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="input-field w-full" />
            <input name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="Image URL (optional)" className="input-field w-full" />
            {isLoaded ? (
              <div className="space-y-2">
                <StandaloneSearchBox onLoad={onSearchBoxLoad} onPlacesChanged={onPlacesChanged}>
                  <input type="text" placeholder="Search for a location" className="input-field w-full" />
                </StandaloneSearchBox>
                <GoogleMap mapContainerStyle={containerStyle} center={mapCenter} zoom={12} onClick={handleMapClick}>
                  <Marker position={markerPosition} draggable onDragEnd={handleMapClick} />
                </GoogleMap>
                <div className="text-sm text-gray-600">
                  Lat: {markerPosition.lat.toFixed(6)}, Lng: {markerPosition.lng.toFixed(6)}
                </div>
              </div>
            ) : loadError ? <p>Error loading map. Check your API key.</p> : <p>Loading map...</p>}
            <button type="submit" className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600" disabled={isLoading}>
              Add Location
            </button>
            {message && <p className="mt-4 text-center">{message}</p>}
          </form>
        </div>
        
        <div>
          <h3 className="text-xl font-semibold mb-4">Existing Locations</h3>
          {isLoading ? (
            <p>Loading locations...</p>
          ) : (
            <div className="space-y-3">
              {locations.length > 0 ? (
                locations.map(location => (
                  <div key={location.id} className="p-4 bg-white rounded-lg shadow">
                    <h4 className="font-bold">{location.name}</h4>
                    <p className="text-sm text-gray-600">{location.description}</p>
                    {location.coordinates &&
                      <p className="text-xs text-gray-500">
                        Coords: {location.coordinates.latitude.toFixed(4)}, {location.coordinates.longitude.toFixed(4)}
                      </p>
                    }
                  </div>
                ))
              ) : (
                <p>No locations found. Add one to get started.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageLocations;
