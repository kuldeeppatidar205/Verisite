'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

interface Listing {
  _id: string;
  roomDetails: string;
  price: number;
  availableDate: string;
  userId: {
    name: string;
    hostelName?: string;
  };
  legacyBundle?: {
    mattress?: boolean;
    cooler?: boolean;
    shelf?: boolean;
    lamp?: boolean;
  };
}

export default function BrowsePage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchListings(page);
  }, [page]);

  const fetchListings = async (pageNum: number) => {
    try {
      const res = await fetch(`/api/listings?page=${pageNum}&limit=12`);
      const data = await res.json();
      setListings(data.data || []);
      setTotalPages(data.pagination.pages);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
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
              href="/create-listing"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition shadow-md shadow-blue-100 dark:shadow-none"
            >
              Post Room
            </Link>
            <Link
              href="/profile"
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
            >
              Profile
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-12">Available Rooms</h1>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-800 rounded-xl h-64 animate-pulse" />
            ))}
          </div>
        ) : listings.length > 0 ? (
          <>
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
                          ₹{listing.price.toLocaleString('en-IN')}/month
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {listing.userId?.hostelName || 'Hostel'}
                        </p>
                      </div>
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                      {listing.roomDetails}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
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
                      {listing.legacyBundle?.shelf && (
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                          📦 Shelf
                        </span>
                      )}
                      {listing.legacyBundle?.lamp && (
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                          💡 Lamp
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Available: {new Date(listing.availableDate).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  ← Previous
                </button>
                <div className="flex gap-2">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setPage(i + 1)}
                      className={`w-10 h-10 rounded-lg font-medium transition ${
                        page === i + 1
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none'
                          : 'border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400 text-xl mb-6">No listings available yet.</p>
            <Link
              href="/create-listing"
              className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition shadow-lg shadow-blue-200 dark:shadow-none"
            >
              Be the first to post a room
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
