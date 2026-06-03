'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { Search, MapPin, SlidersHorizontal, X, PlusCircle, User } from 'lucide-react';

interface Listing {
  _id: string;
  roomDetails: string;
  price: number;
  availableDate: string;
  listingType: 'handover' | 'pg' | 'roommate';
  pgName?: string;
  address?: string;
  images?: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
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
  const [userRole, setUserRole] = useState<'STUDENT' | 'OWNER' | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'price' | 'proximity'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    // Fetch user role to set default stream
    const fetchUserRole = async () => {
      try {
        const res = await fetch('/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        
        if (!data.verified) {
          const email = data.role === 'STUDENT' ? data.collegeEmail : data.email;
          router.push(`/verify-email?email=${encodeURIComponent(email)}`);
          return;
        }

        setUserProfile(data);
        const role = data.role?.toUpperCase();
        setUserRole(role);
        if (role === 'OWNER') {
          setActiveStream('OWNER');
        } else {
          setActiveStream('STUDENT');
        }
      } catch (error) {
        setUserRole('STUDENT');
        setActiveStream('STUDENT');
      }
    };

    fetchUserRole();
  }, []);

  useEffect(() => {
    if (activeStream) {
      fetchListings(page, activeStream, searchQuery);
    }
  }, [page, activeStream, sortBy, searchQuery]);

  const fetchListings = async (pageNum: number, stream: string, search: string) => {
    setLoading(true);
    try {
      const isOwnerListing = stream === 'OWNER';
      const res = await fetch(`/api/listings?page=${pageNum}&limit=12&isOwnerListing=${isOwnerListing}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      let fetchedListings = data.data || [];

      // Client-side sorting/filtering
      if (sortBy === 'price') {
        fetchedListings.sort((a: Listing, b: Listing) => a.price - b.price);
      } else if (sortBy === 'proximity' && userProfile?.favoriteCollege?.lat) {
        const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
          const R = 6371e3;
          const φ1 = lat1 * Math.PI/180;
          const φ2 = lat2 * Math.PI/180;
          const Δφ = (lat2-lat1) * Math.PI/180;
          const Δλ = (lon2-lon1) * Math.PI/180;
          const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          return R * c;
        };

        fetchedListings.sort((a: Listing, b: Listing) => {
          if (!a.coordinates || !b.coordinates) return 0;
          const distA = calculateDistance(a.coordinates.lat, a.coordinates.lng, userProfile.favoriteCollege.lat, userProfile.favoriteCollege.lng);
          const distB = calculateDistance(b.coordinates.lat, b.coordinates.lng, userProfile.favoriteCollege.lat, userProfile.favoriteCollege.lng);
          return distA - distB;
        });
      }

      setListings(fetchedListings);
      setTotalPages(data.pagination.pages);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
      setLoading(false);
    }
  };

  if (!activeStream) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-gray-300 dark:text-gray-700 animate-pulse font-bold tracking-tight text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500 overflow-x-hidden">
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-105">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo image short.png" alt="Verisite Logo" className="w-full h-full object-cover rounded-full" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Verisite</h1>
          </Link>
          
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden p-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-4">
              <Link
                href="/create-listing"
                className="text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Post Room
              </Link>
              <Link
                href="/profile"
                className="w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-sm hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
              >
                👤
              </Link>
            </div>
            <div className="sm:hidden flex items-center gap-2">
              <Link href="/create-listing" className="p-2 text-gray-600 dark:text-slate-300">
                <span className="text-lg">✍️</span>
              </Link>
              <Link href="/profile" className="p-2 text-gray-600 dark:text-slate-300">
                <span className="text-lg">👤</span>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Mobile Search Overlay */}
        {isSearchOpen && (
          <div className="md:hidden p-4 bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 animate-in slide-in-from-top duration-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                autoFocus
                type="text"
                placeholder="Search by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-gray-900 dark:text-white"
              />
              <button 
                onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-6">
          <div className="text-center sm:text-left">
             <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white tracking-tight mb-2">
               {activeStream === 'STUDENT' ? 'Student Listings' : 'Owner Listings'}
             </h1>
             <p className="text-gray-500 dark:text-slate-400 text-base">
               {activeStream === 'STUDENT' 
                 ? 'Verified room from students' 
                 : 'Direct listings from PG owners'}
             </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
             <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
                <button 
                  onClick={() => setSortBy('newest')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${sortBy === 'newest' ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
                >
                  Newest
                </button>
                <button 
                  onClick={() => setSortBy('price')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${sortBy === 'price' ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
                >
                  Price: Low to High
                </button>
                {userProfile?.favoriteCollege?.lat && (
                  <button 
                    onClick={() => setSortBy('proximity')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${sortBy === 'proximity' ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
                  >
                    Near Institution
                  </button>
                )}
             </div>

             <div className="flex bg-gray-100 dark:bg-slate-800 p-1.5 rounded-lg">
                <button 
                  onClick={() => setActiveStream('STUDENT')}
                  className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${activeStream === 'STUDENT' ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'}`}
                >
                  Student Verified
                </button>
                <button 
                  onClick={() => setActiveStream('OWNER')}
                  className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${activeStream === 'OWNER' ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'}`}
                >
                  Owner Listings
                </button>
             </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-100 dark:bg-slate-800/50 rounded-xl h-72 animate-pulse" />
            ))}
          </div>
        ) : listings.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.map((listing) => (
                <div
                  key={listing._id}
                  onClick={() => router.push(`/listings/${listing._id}`)}
                  className="group flex flex-col gap-3 cursor-pointer transition-transform duration-300 hover:-translate-y-1"
                >
                  <div className="w-full aspect-4/3 bg-gray-100 dark:bg-slate-800 rounded-xl flex flex-col items-center justify-center relative overflow-hidden border border-gray-200 dark:border-slate-700/50">
                    <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 dark:bg-slate-900/90 rounded text-xs font-semibold text-gray-900 dark:text-white backdrop-blur-sm shadow-sm flex items-center gap-1.5 z-10">
                       {activeStream === 'STUDENT' && <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>}
                       {listing.listingType === 'handover' ? 'Handover' : listing.listingType === 'roommate' ? 'Roommate' : 'PG'}
                    </div>
                    {listing.coordinates && (
                      <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 dark:bg-slate-900/90 rounded text-[11px] font-semibold text-gray-900 dark:text-white backdrop-blur-sm shadow-sm flex items-center z-10">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${listing.coordinates.lat},${listing.coordinates.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="hover:underline flex items-center gap-1"
                        >
                          Map ↗
                        </a>
                      </div>
                    )}
                    
                    {listing.images && listing.images.length > 0 ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img 
                        src={listing.images[0]} 
                        alt="Room Preview" 
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <span className="text-5xl opacity-40 group-hover:scale-110 transition-transform duration-300">
                        {listing.listingType === 'handover' ? '🎓' : listing.listingType === 'roommate' ? '👥' : '🏠'}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col mt-1">
                    <div className="flex justify-between items-start mb-0.5">
                      <p className="text-[15px] font-semibold text-gray-900 dark:text-white truncate">
                        {listing.pgName || listing.userId?.hostelName || listing.address || 'Verified Location'}
                      </p>
                    </div>
                    {listing.address && (
                      <p className="text-[13px] text-gray-500 dark:text-slate-400 truncate mb-0.5">
                        {listing.address}
                      </p>
                    )}
                    <p className="text-[15px] text-gray-500 dark:text-slate-400 line-clamp-1 mb-0.5">
                      {listing.roomDetails}
                    </p>
                    {listing.price !== undefined && (
                      <p className="text-[15px] font-medium text-gray-900 dark:text-white mt-1 mb-1.5">
                        <span className="font-semibold">₹{listing.price.toLocaleString('en-IN')}</span> month
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] text-gray-500 dark:text-slate-400">
                        {new Date(listing.availableDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                      {(listing.legacyBundle?.mattress || listing.legacyBundle?.cooler) && (
                        <div className="flex gap-2 items-center">
                          <span className="text-gray-300 dark:text-slate-600">•</span>
                          <span className="text-[13px] text-gray-500 dark:text-slate-400 truncate">
                            Includes items
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-16">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 dark:border-slate-800 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm"
                >
                  ←
                </button>
                <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setPage(i + 1)}
                      className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                        page === i + 1
                          ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                          : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 dark:border-slate-800 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm"
                >
                  →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-gray-50 dark:bg-slate-900/30 rounded-xl border border-gray-200 dark:border-slate-800">
            <p className="text-gray-500 dark:text-slate-400 text-base mb-6">No listings match your criteria.</p>
            <Link
              href="/create-listing"
              className="inline-block px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              Post a listing
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
