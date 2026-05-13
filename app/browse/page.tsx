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
  listingType: 'handover' | 'pg';
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
  const [activeStream, setActiveStream] = useState<'STUDENT' | 'OWNER' | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    // Fetch user role to set default stream
    const fetchUserRole = async () => {
      try {
        const res = await fetch('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.user?.role === 'OWNER') {
          setActiveStream('OWNER');
        } else {
          setActiveStream('STUDENT');
        }
      } catch (error) {
        setActiveStream('STUDENT');
      }
    };

    fetchUserRole();
  }, []);

  useEffect(() => {
    if (activeStream) {
      fetchListings(page, activeStream);
    }
  }, [page, activeStream]);

  const fetchListings = async (pageNum: number, stream: string) => {
    setLoading(true);
    try {
      const isOwnerListing = stream === 'OWNER';
      const res = await fetch(`/api/listings?page=${pageNum}&limit=12&isOwnerListing=${isOwnerListing}`);
      const data = await res.json();
      setListings(data.data || []);
      setTotalPages(data.pagination.pages);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
      setLoading(false);
    }
  };

  if (!activeStream) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-gray-400 animate-pulse font-bold tracking-tighter text-2xl">PUREPG</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500 overflow-x-hidden">
      {/* ... (Dynamic Background and Navigation same as before) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-500/5 blur-[120px] animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px] animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <nav className="glass sticky top-0 z-50 border-b border-gray-200/50 dark:border-slate-800/50 transition-all duration-300 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-primary-500/30 group-hover:scale-110 transition-transform">
              PP
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tighter">PurePG</h1>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-4">
              <Link
                href="/create-listing"
                className="px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-bold transition shadow-lg shadow-primary-500/20 active:scale-95"
              >
                Post Room
              </Link>
              <Link
                href="/profile"
                className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-gray-200 dark:border-slate-700 shadow-sm"
              >
                👤
              </Link>
            </div>
            <div className="sm:hidden flex items-center gap-1">
              <Link href="/create-listing" className="p-2 text-gray-700 dark:text-slate-300">
                <span className="text-xl">✍️</span>
              </Link>
              <Link href="/profile" className="p-2 text-gray-700 dark:text-slate-300">
                <span className="text-xl">👤</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-12 gap-6">
          <div className="text-center sm:text-left">
             <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tighter mb-2">
               {activeStream === 'STUDENT' ? 'Student Truth' : 'Marketplace'}
             </h1>
             <p className="text-gray-500 dark:text-slate-400 font-medium">
               {activeStream === 'STUDENT' 
                 ? 'Crowdsourced data from verified students' 
                 : 'Marketing listings from verified owners'}
             </p>
          </div>
          <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
             <button 
               onClick={() => setActiveStream('STUDENT')}
               className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activeStream === 'STUDENT' ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' : 'text-gray-500 dark:text-slate-400 hover:text-primary-600'}`}
             >
               Student Verified
             </button>
             <button 
               onClick={() => setActiveStream('OWNER')}
               className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activeStream === 'OWNER' ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' : 'text-gray-500 dark:text-slate-400 hover:text-primary-600'}`}
             >
               Owner Listings
             </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-slate-200/50 dark:bg-slate-900/50 rounded-3xl h-80 shimmer border border-gray-200 dark:border-slate-800" style={{ animation: `slideUp 0.5s ease-out ${i * 0.05}s both` }} />
            ))}
          </div>
        ) : listings.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {listings.map((listing) => (
                <Link
                  key={listing._id}
                  href={`/listings/${listing._id}`}
                  className="group bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden card-hover"
                >
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-2xl">
                         <span className="text-2xl">{listing.listingType === 'handover' ? '🎓' : '🏠'}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        {activeStream === 'STUDENT' && (
                          <span className="px-3 py-1 mb-2 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-full text-[8px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800">
                            Truth Verified
                          </span>
                        )}
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          listing.listingType === 'handover' 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' 
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                        }`}>
                          {listing.listingType === 'handover' ? 'Handover' : 'PG'}
                        </span>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h4 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter mb-1">
                        ₹{listing.price.toLocaleString('en-IN')}<span className="text-sm text-gray-500 font-normal">/mo</span>
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-slate-400 font-bold flex items-center gap-1">
                        <span className="text-primary-600 text-base">📍</span>
                        {listing.userId?.hostelName || 'Anonymous Location'}
                      </p>
                    </div>

                    <p className="text-gray-600 dark:text-slate-300 text-sm mb-8 line-clamp-2 leading-relaxed font-medium">
                      {listing.roomDetails}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-8">
                      {listing.legacyBundle?.mattress && (
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-lg">
                          Mattress
                        </span>
                      )}
                      {listing.legacyBundle?.cooler && (
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-lg">
                          Cooler
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-center border-t border-gray-50 dark:border-slate-800 pt-6">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                         Available {new Date(listing.availableDate).toLocaleDateString()}
                       </span>
                       <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white scale-0 group-hover:scale-100 transition-transform duration-300 shadow-lg shadow-primary-500/40">
                          →
                       </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {/* ... (Pagination logic) */}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-20">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-slate-800 transition shadow-sm active:scale-90"
                >
                  ←
                </button>
                <div className="flex gap-2">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setPage(i + 1)}
                      className={`w-12 h-12 rounded-2xl font-black transition-all ${
                        page === i + 1
                          ? 'bg-primary-600 text-white shadow-xl shadow-primary-500/30'
                          : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-slate-800 transition shadow-sm active:scale-90"
                >
                  →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-32 bg-white dark:bg-slate-900 rounded-[40px] border-2 border-dashed border-gray-200 dark:border-slate-800">
             <div className="text-8xl mb-8 opacity-20">🛋️</div>
            <p className="text-gray-500 dark:text-slate-400 text-2xl font-black tracking-tighter mb-8">No listings match your criteria.</p>
            <Link
              href="/create-listing"
              className="inline-block px-10 py-4 bg-primary-600 text-white rounded-2xl font-black hover:bg-primary-700 transition shadow-2xl shadow-primary-500/40"
            >
              Post a listing
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
