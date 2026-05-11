'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

interface Listing {
  _id: string;
  listingType: 'handover' | 'pg';
  roomDetails: string;
  price: number;
  availableDate: string;
  address?: string;
  userId: {
    name: string;
    hostelName?: string;
    role: string;
  };
  legacyBundle?: {
    mattress?: boolean;
    cooler?: boolean;
    shelf?: boolean;
    lamp?: boolean;
  };
}

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem('token'));
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const res = await fetch('/api/listings?limit=6');
      const data = await res.json();
      setListings(data.data || []);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors duration-200">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              CP
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CampusPass</h1>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/browse"
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
            >
              Browse
            </Link>
            {token ? (
              <>
                <Link
                  href="/create-listing"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Post Room
                </Link>
                <Link
                  href="/profile"
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
                >
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
          Find Your Perfect Hostel Room or PG
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          CampusPass connects verified students for secure room handovers and whitelisted PG owners for quality accommodation.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/browse"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg transition shadow-lg shadow-blue-200 dark:shadow-none"
          >
            Browse Rooms
          </Link>
          {!token && (
            <Link
              href="/register"
              className="px-8 py-3 border-2 border-blue-600 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 font-semibold text-lg transition"
            >
              Get Started
            </Link>
          )}
        </div>
      </section>

      {/* Featured Listings */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center sm:text-left">Featured Rooms</h3>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-800 rounded-xl h-64 animate-pulse" />
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <Link
                key={listing._id}
                href={`/listings/${listing._id}`}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg dark:hover:border-gray-600 transition group"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        ₹{(listing.price ?? 0).toLocaleString('en-IN')}/month
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {listing.listingType === 'handover' 
                          ? (listing.userId?.hostelName || 'Hostel') 
                          : (listing.address || 'PG Accommodation')}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter ${
                      listing.listingType === 'handover' 
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30' 
                        : 'bg-purple-50 text-purple-600 dark:bg-purple-900/30'
                    }`}>
                      {listing.listingType === 'handover' ? 'Handover' : 'PG'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                    {listing.roomDetails}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {listing.listingType === 'handover' ? (
                      <>
                        {listing.legacyBundle?.mattress && (
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                            🛏️ Mattress
                          </span>
                        )}
                        {listing.legacyBundle?.cooler && (
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                            ❄️ Cooler
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                        🏠 Private PG
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Available: {new Date(listing.availableDate).toLocaleDateString()}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-6">No rooms listed yet.</p>
            {token && (
              <Link
                href="/create-listing"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition"
              >
                Post the first room
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 dark:bg-gray-800/50 py-20 mt-8 transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">
            Why Choose CampusPass?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="text-5xl mb-6">✅</div>
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Verified Students
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                Only college email addresses verified through your institution can list or browse.
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-6">🏫</div>
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Multi-University Support
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                Connecting students within and across institutions seamlessly.
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-6">⚡</div>
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Quick & Easy
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                Simple interface designed for busy students. Post or find rooms in minutes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-gray-300 py-12 mt-auto transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
             <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">
              CP
            </div>
            <span className="font-bold text-white tracking-tight">CampusPass</span>
          </div>
          <p className="text-sm opacity-60">&copy; 2024 CampusPass. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
