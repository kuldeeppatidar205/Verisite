'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import ClientOnly from '@/components/ClientOnly';
import ThemeToggle from '@/components/ThemeToggle';

function CreateListingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'STUDENT' | 'OWNER'>('STUDENT');
  const [formData, setFormData] = useState({
    pgName: '',
    roomDetails: '',
    price: '',
    availableDate: '',
    mattress: false,
    cooler: false,
    shelf: false,
    lamp: false,
    other: '',
    addressPrefix: '',
    baseAddress: '',
    amenities: '',
    lat: null as number | null,
    lng: null as number | null,
    totalRooms: '',
    availableRooms: '',
    handoverMode: false,
  });

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) {
      router.push('/login');
      return;
    }
    setToken(t);
    fetchUserRole(t);
    
    if (editId) {
      fetchListing(editId);
    } else {
      captureLocation();
    }
  }, []);

  const captureLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          setFormData(prev => ({
            ...prev,
            lat,
            lng
          }));
          console.log("📍 Location captured:", lat, lng);

          // Reverse geocode to get a human-readable address via backend proxy
          try {
            const res = await fetch(`/api/geocode?lat=${lat}&lon=${lng}`);
            const data = await res.json();
            
            if (res.ok && data) {
              // Construct a detailed address from proxy response
              const addressParts = [];
              if (data.street) addressParts.push(data.street);
              if (data.locality && data.locality !== data.city) addressParts.push(data.locality);
              if (data.city) addressParts.push(data.city);
              if (data.state) addressParts.push(data.state);
              
              const detectedAddress = addressParts.filter(Boolean).join(', ');
              
              if (detectedAddress) {
                setFormData(prev => ({
                  ...prev,
                  baseAddress: prev.baseAddress || detectedAddress // Don't overwrite if user already has an address
                }));
                console.log("🗺️ Detected Address (Proxy):", detectedAddress);
              }
            } else {
              console.error("Geocoding API error:", data.error);
              setError(data.error || "Location service unavailable.");
            }
          } catch (error) {
            console.error("Error reverse geocoding:", error);
            setError("Geocoding service is currently unavailable.");
          }
        },
        (error) => {
          console.error("Error capturing location:", error);
          setError("Location access is required to post a listing. Please enable location permissions.");
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };

  const fetchUserRole = async (t: string) => {
    try {
      const res = await fetch('/api/users/me', {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (data.user) {
        // Normalize role to uppercase to match state types and new schema
        const normalizedRole = data.user.role?.toUpperCase() || 'STUDENT';
        setUserRole(normalizedRole as 'STUDENT' | 'OWNER');
      }
    } catch (error) {
      console.error('Failed to fetch user role:', error);
    }
  };

  const fetchListing = async (id: string) => {
    try {
      const res = await fetch(`/api/listings/${id}`);
      const data = await res.json();
      setFormData({
        pgName: data.pgName || '',
        roomDetails: data.roomDetails,
        price: data.price.toString(),
        availableDate: new Date(data.availableDate).toISOString().split('T')[0],
        mattress: data.legacyBundle?.mattress || false,
        cooler: data.legacyBundle?.cooler || false,
        shelf: data.legacyBundle?.shelf || false,
        lamp: data.legacyBundle?.lamp || false,
        other: data.legacyBundle?.other || '',
        addressPrefix: '',
        baseAddress: data.address || '',
        amenities: data.amenities?.join(', ') || '',
        lat: data.coordinates?.lat || null,
        lng: data.coordinates?.lng || null,
        totalRooms: data.totalRooms?.toString() || '',
        availableRooms: data.availableRooms?.toString() || '',
        handoverMode: data.handoverMode || false,
      });
    } catch (error) {
      console.error('Failed to fetch listing:', error);
      setError('Failed to load listing');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (formData.lat === null || formData.lng === null) {
      setError('Waiting for location coordinates... Please ensure location is enabled.');
      return;
    }

    setLoading(true);

    const price = parseFloat(formData.price);
    if (isNaN(price)) {
      setError('Please enter a valid price');
      setLoading(false);
      return;
    }

    if (!formData.roomDetails) {
      setError('Please fill in the property details');
      setLoading(false);
      return;
    }

    if (userRole === 'OWNER' && !formData.availableDate) {
      setError('Available From date is required for owner listings');
      setLoading(false);
      return;
    }

    try {
      const finalAddress = formData.addressPrefix 
        ? `${formData.addressPrefix.trim()}, ${formData.baseAddress}` 
        : formData.baseAddress;

      const payload: any = {
        pgName: formData.pgName,
        roomDetails: formData.roomDetails,
        price: price,
        availableDate: formData.availableDate ? new Date(formData.availableDate).toISOString() : undefined,
        address: finalAddress,
        lat: formData.lat,
        lng: formData.lng,
      };

      if (userRole === 'STUDENT') {
        // If they checked any included items, it's likely a handover
        const isHandover = formData.mattress || formData.cooler || formData.shelf || formData.lamp || !!formData.other;
        payload.listingType = isHandover ? 'handover' : 'pg';
        payload.handoverMode = formData.handoverMode;

        payload.legacyBundle = {
          mattress: formData.mattress,
          cooler: formData.cooler,
          shelf: formData.shelf,
          lamp: formData.lamp,
          other: formData.other || undefined,
        };
      } else {
        payload.listingType = 'pg';
        payload.address = finalAddress;
        payload.amenities = formData.amenities.split(',').map(s => s.trim()).filter(s => s !== '');
        
        const totalRooms = parseInt(formData.totalRooms);
        if (!isNaN(totalRooms)) {
          payload.totalRooms = totalRooms;
        }
        
        const availableRooms = parseInt(formData.availableRooms);
        if (!isNaN(availableRooms)) {
          payload.availableRooms = availableRooms;
        } else if (!isNaN(totalRooms)) {
          payload.availableRooms = totalRooms;
        }
      }

      const url = editId ? `/api/listings/${editId}` : '/api/listings';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || (editId ? 'Failed to update listing' : 'Failed to create listing'));
        setLoading(false);
        return;
      }

      router.push(`/listings/${data.listing._id}`);
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8 transition-colors duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
          {editId ? 'Edit Specs' : userRole === 'STUDENT' ? 'Post to Student Truth Ledger' : 'List Marketplace Property'}
        </h1>
        <div className="flex items-center gap-2 text-[10px] font-medium px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full">
           <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
           {formData.lat ? 'Location Captured' : 'Capturing Location...'}
        </div>
      </div>

      <ClientOnly>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              PG / Hostel Name *
            </label>
            <input
              type="text"
              name="pgName"
              value={formData.pgName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white text-sm"
              placeholder="e.g. Skyline PG or Raman Hostel"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {userRole === 'STUDENT' ? 'Property Details * (provide honest details for the community)' : 'Property Details * (marketing description)'}
            </label>
            <textarea
              name="roomDetails"
              value={formData.roomDetails}
              onChange={handleChange}
              required
              rows={5}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm"
              placeholder={userRole === 'STUDENT' ? "Be honest about the pros and cons..." : "Highlight the best features of your property..."}
            />
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
              Minimum 10 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Property Location *
            </label>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                name="addressPrefix"
                value={formData.addressPrefix}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white text-sm"
                placeholder="Specific details (e.g. House No., Building Name)"
              />
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
                <span className="text-gray-500 dark:text-gray-400 text-sm whitespace-nowrap">Auto-captured:</span>
                <span className="text-gray-900 dark:text-white text-sm font-medium truncate">
                  {formData.baseAddress || "Waiting for location..."}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
              The base location is auto-captured based on your current coordinates. You can add specific details like a house number or building name.
            </p>
          </div>

          {userRole === 'OWNER' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Total Rooms *
                  </label>
                  <input
                    type="number"
                    name="totalRooms"
                    value={formData.totalRooms}
                    onChange={handleChange}
                    required={userRole === 'OWNER'}
                    min="1"
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Available Rooms *
                  </label>
                  <input
                    type="number"
                    name="availableRooms"
                    value={formData.availableRooms}
                    onChange={handleChange}
                    required={userRole === 'OWNER'}
                    min="0"
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Monthly Rent (₹) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="1"
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Available From {userRole === 'OWNER' ? '*' : '(Optional)'}
              </label>
              <input
                type="date"
                name="availableDate"
                value={formData.availableDate}
                onChange={handleChange}
                required={userRole === 'OWNER'}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>

          {userRole === 'STUDENT' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-widest text-[10px]">
                Included Items (Handover)
              </label>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <label className="flex items-center gap-3 cursor-pointer group p-3 border border-gray-100 dark:border-gray-700 rounded-lg">
                  <input
                    type="checkbox"
                    name="mattress"
                    checked={formData.mattress}
                    onChange={handleChange}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300">Mattress</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group p-3 border border-gray-100 dark:border-gray-700 rounded-lg">
                  <input
                    type="checkbox"
                    name="cooler"
                    checked={formData.cooler}
                    onChange={handleChange}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300">Cooler</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group p-3 border border-gray-100 dark:border-gray-700 rounded-lg">
                  <input
                    type="checkbox"
                    name="shelf"
                    checked={formData.shelf}
                    onChange={handleChange}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300">Shelf</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group p-3 border border-gray-100 dark:border-gray-700 rounded-lg">
                  <input
                    type="checkbox"
                    name="lamp"
                    checked={formData.lamp}
                    onChange={handleChange}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300">Lamp</span>
                </label>
              </div>
              <div className="mb-8">
                <input
                  type="text"
                  name="other"
                  value={formData.other}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white text-sm"
                  placeholder="Other items (e.g. Study table)"
                />
              </div>

              <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl">
                 <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex flex-col">
                       <span className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-1">Pass My Room Mode</span>
                       <span className="text-[10px] text-blue-700/60 dark:text-blue-300/60">Enable this to show your contact details. Keep off for anonymous truth sharing.</span>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        name="handoverMode" 
                        checked={formData.handoverMode} 
                        onChange={handleChange} 
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </div>
                 </label>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amenities (comma separated)
              </label>
              <input
                type="text"
                name="amenities"
                value={formData.amenities}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white text-sm"
                placeholder="WiFi, AC, Food, Laundry"
              />
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400 font-bold transition shadow-lg shadow-blue-100 dark:shadow-none order-1 sm:order-2"
            >
              {loading ? 'Saving...' : editId ? 'Update Listing' : 'Post Listing'}
            </button>
            <Link
              href="/browse"
              className="w-full py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-bold text-center transition order-2 sm:order-1"
            >
              Cancel
            </Link>
          </div>
        </form>
      </ClientOnly>
    </div>
  );
}

export default function CreateListingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              PP
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">PurePG</h1>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/browse" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              ← Back to listings
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Suspense fallback={
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 flex items-center justify-center min-h-[400px]">
            <div className="text-gray-600 dark:text-gray-400 animate-pulse font-medium">Loading form...</div>
          </div>
        }>
          <CreateListingForm />
        </Suspense>
      </div>
    </div>
  );
}
