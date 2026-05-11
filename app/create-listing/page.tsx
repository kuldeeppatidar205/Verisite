'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import ClientOnly from '@/components/ClientOnly';
import ThemeToggle from '@/components/ThemeToggle';

export default function CreateListingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'student' | 'pg_owner'>('student');
  const [formData, setFormData] = useState({
    roomDetails: '',
    price: '',
    availableDate: '',
    mattress: false,
    cooler: false,
    shelf: false,
    lamp: false,
    other: '',
    address: '',
    amenities: '',
    lat: null as number | null,
    lng: null as number | null,
    totalRooms: '',
    availableRooms: '',
  });

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) {
      router.push('/login');
      return;
    }
    setToken(t);
    fetchUserRole(t);
    captureLocation();

    if (editId) {
      fetchListing(editId);
    }
  }, []);

  const captureLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }));
          console.log("📍 Location captured:", position.coords.latitude, position.coords.longitude);
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
        setUserRole(data.user.role);
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
        roomDetails: data.roomDetails,
        price: data.price.toString(),
        availableDate: new Date(data.availableDate).toISOString().split('T')[0],
        mattress: data.legacyBundle?.mattress || false,
        cooler: data.legacyBundle?.cooler || false,
        shelf: data.legacyBundle?.shelf || false,
        lamp: data.legacyBundle?.lamp || false,
        other: data.legacyBundle?.other || '',
        address: data.address || '',
        amenities: data.amenities?.join(', ') || '',
        lat: data.coordinates?.lat || null,
        lng: data.coordinates?.lng || null,
        totalRooms: data.totalRooms?.toString() || '',
        availableRooms: data.availableRooms?.toString() || '',
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
    
    if (!formData.lat || !formData.lng) {
      setError('Waiting for location coordinates... Please ensure location is enabled.');
      return;
    }

    setLoading(true);

    if (!formData.roomDetails || !formData.price || !formData.availableDate) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      const payload: any = {
        roomDetails: formData.roomDetails,
        price: parseFloat(formData.price),
        availableDate: new Date(formData.availableDate).toISOString(),
        lat: formData.lat,
        lng: formData.lng,
      };

      if (userRole === 'student') {
        payload.legacyBundle = {
          mattress: formData.mattress,
          cooler: formData.cooler,
          shelf: formData.shelf,
          lamp: formData.lamp,
          other: formData.other || undefined,
        };
      } else {
        payload.address = formData.address;
        payload.amenities = formData.amenities.split(',').map(s => s.trim()).filter(s => s !== '');
        payload.totalRooms = parseInt(formData.totalRooms);
        payload.availableRooms = parseInt(formData.availableRooms || formData.totalRooms);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              CP
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CampusPass</h1>
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 transition-colors duration-200">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {editId ? 'Edit Listing' : userRole === 'student' ? 'Post a Room Handover' : 'List your PG Property'}
            </h1>
            <div className="flex items-center gap-2 text-xs font-medium px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full">
               <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
               {formData.lat ? 'Location Captured' : 'Capturing Location...'}
            </div>
          </div>

          <ClientOnly>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {userRole === 'student' ? 'Room Details * (describe the room, handover items, etc.)' : 'PG Property Details * (describe amenities, rules, environment, etc.)'}
                </label>
                <textarea
                  name="roomDetails"
                  value={formData.roomDetails}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder={userRole === 'student' ? "Describe your room and what's included in the handover..." : "Provide a detailed description of your PG property..."}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Minimum 10 characters
                </p>
              </div>

              {userRole === 'pg_owner' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Address *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required={userRole === 'pg_owner'}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder="Enter the complete address of the PG"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Total Number of Rooms *
                      </label>
                      <input
                        type="number"
                        name="totalRooms"
                        value={formData.totalRooms}
                        onChange={handleChange}
                        required={userRole === 'pg_owner'}
                        min="1"
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                        placeholder="e.g. 50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Currently Available Rooms *
                      </label>
                      <input
                        type="number"
                        name="availableRooms"
                        value={formData.availableRooms}
                        onChange={handleChange}
                        required={userRole === 'pg_owner'}
                        min="0"
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                        placeholder="e.g. 5"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Monthly Rent * (in ₹)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="1"
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="10000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Available From *
                  </label>
                  <input
                    type="date"
                    name="availableDate"
                    value={formData.availableDate}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {userRole === 'student' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                      Included Items (Legacy Bundle)
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          name="mattress"
                          checked={formData.mattress}
                          onChange={handleChange}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-700"
                        />
                        <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">🛏️ Mattress</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          name="cooler"
                          checked={formData.cooler}
                          onChange={handleChange}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-700"
                        />
                        <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">❄️ Cooler</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          name="shelf"
                          checked={formData.shelf}
                          onChange={handleChange}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-700"
                        />
                        <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">📦 Shelf</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          name="lamp"
                          checked={formData.lamp}
                          onChange={handleChange}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-700"
                        />
                        <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">💡 Lamp</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Other Items
                    </label>
                    <input
                      type="text"
                      name="other"
                      value={formData.other}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder="e.g., Study table, Water cooler, etc."
                    />
                  </div>
                </>
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
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="e.g., WiFi, AC, Food, Laundry"
                  />
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold transition shadow-lg shadow-blue-200 dark:shadow-none"
                >
                  {loading ? 'Saving...' : editId ? 'Update Listing' : 'Post Listing'}
                </button>
                <Link
                  href="/browse"
                  className="flex-1 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold text-center transition"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </ClientOnly>
        </div>
      </div>
    </div>
  );
}
