'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { Search, MapPin, SlidersHorizontal, X, PlusCircle, User, ChevronLeft, ChevronRight, GraduationCap, Users, Home, ExternalLink } from 'lucide-react';

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
    
    const fetchUserRole = async () => {
      try {
        const res = await fetch('/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          if (!data.personalEmailVerified) {
            router.push('/profile');
            return;
          }
          setUserProfile(data);
        }
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
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-lg border-b border-gray-100 dark:border-slate-800/80 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-9 h-9 transition-transform duration-300 group-hover:scale-105 overflow-hidden rounded-xl border border-gray-200/50 dark:border-slate-800">
              <Image 
                src="/logo image short.png" 
                alt="Verisite Logo" 
                fill
                priority
                sizes="36px"
                className="object-cover" 
              />
            </div>
            <h1 className="text-lg font-black text-gray-900 dark:text-white tracking-tighter uppercase">Verisite</h1>
          </Link>
          
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search PG name or landmark location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-xs font-bold text-slate-900 dark:text-white transition-all shadow-inner placeholder-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden p-2 text-gray-650 dark:text-slate-350 hover:bg-slate-100/50 dark:hover:bg-slate-900/50 rounded-xl transition-colors cursor-pointer"
            >
              <Search className="w-5 h-5" />
            </button>
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-4">
              <Link
                href="/create-listing"
                className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Post Room
              </Link>
              <Link
                href="/profile"
                className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-slate-800/50 border border-gray-200/30 dark:border-slate-700/30 flex items-center justify-center text-sm hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
              >
                <User className="w-4 h-4 text-gray-600 dark:text-slate-350" />
              </Link>
            </div>
            <div className="sm:hidden flex items-center gap-2">
              <Link href="/create-listing" className="p-2 text-gray-600 dark:text-slate-300">
                <PlusCircle className="w-5 h-5" />
              </Link>
              <Link href="/profile" className="p-2 text-gray-600 dark:text-slate-300">
                <User className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
        
        {/* Mobile Search Overlay */}
        {isSearchOpen && (
          <div className="md:hidden p-4 bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 animate-in slide-in-from-top duration-200">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                autoFocus
                type="text"
                placeholder="Search PG name or landmark location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500/50 text-slate-950 dark:text-white shadow-inner"
              />
              <button 
                onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-650"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="flex flex-col xl:flex-row justify-between items-center mb-10 gap-6">
          <div className="text-center xl:text-left">
             <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase mb-1">
               {activeStream === 'STUDENT' ? 'Student Ledger' : 'Institutional Listings'}
             </h1>
             <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
               {activeStream === 'STUDENT' 
                 ? 'Verified student rooms & roommate matches' 
                 : 'Direct student accommodation & PG listings'}
             </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
             {/* Sort Select Controls */}
             <div className="flex bg-slate-100/50 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200/10 dark:border-slate-850">
                <button 
                  onClick={() => setSortBy('newest')}
                  className={`px-3 py-2 rounded-xl text-[10px] uppercase tracking-widest font-black transition-all cursor-pointer ${sortBy === 'newest' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-250/20 dark:border-slate-700/50' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350'}`}
                >
                  Newest
                </button>
                <button 
                  onClick={() => setSortBy('price')}
                  className={`px-3 py-2 rounded-xl text-[10px] uppercase tracking-widest font-black transition-all cursor-pointer ${sortBy === 'price' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-250/20 dark:border-slate-700/50' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350'}`}
                >
                  Price
                </button>
                <button 
                  onClick={() => {
                    if (userProfile?.favoriteCollege?.lat) {
                      setSortBy('proximity');
                    } else {
                      alert('Please set your Campus/Institution in your profile to sort by proximity.');
                      router.push('/profile');
                    }
                  }}
                  className={`px-3 py-2 rounded-xl text-[10px] uppercase tracking-widest font-black transition-all cursor-pointer ${sortBy === 'proximity' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-250/20 dark:border-slate-700/50' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350'}`}
                >
                  Proximity
                </button>
             </div>

             {/* Tab Stream Selector */}
             <div className="flex bg-slate-100/50 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200/10 dark:border-slate-850">
                <button 
                  onClick={() => setActiveStream('STUDENT')}
                  className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer ${activeStream === 'STUDENT' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-250/20 dark:border-slate-700/50' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                  Student Verified
                </button>
                <button 
                  onClick={() => setActiveStream('OWNER')}
                  className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer ${activeStream === 'OWNER' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-250/20 dark:border-slate-700/50' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                  Owner Listings
                </button>
             </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col gap-3 p-3 bg-white dark:bg-slate-900/10 border border-slate-100 dark:border-slate-900/60 rounded-3xl animate-pulse">
                <div className="w-full aspect-4/3 bg-slate-100 dark:bg-slate-800/50 rounded-2xl" />
                <div className="h-4 w-2/3 bg-slate-100 dark:bg-slate-800/50 rounded mt-2" />
                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800/50 rounded" />
                <div className="h-3 w-1/4 bg-slate-100 dark:bg-slate-800/50 rounded" />
              </div>
            ))}
          </div>
        ) : listings.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.map((listing) => (
                <div
                  key={listing._id}
                  onClick={() => router.push(`/listings/${listing._id}`)}
                  className="group flex flex-col bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 rounded-3xl p-3 transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl hover:shadow-slate-100 dark:hover:shadow-none cursor-pointer"
                >
                  <div className="w-full aspect-4/3 bg-gray-50 dark:bg-slate-950 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden border border-gray-100 dark:border-slate-900">
                    <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 dark:bg-slate-900/90 rounded-md text-[9px] uppercase tracking-widest font-black text-gray-900 dark:text-white backdrop-blur-sm shadow-sm flex items-center gap-1.5 z-10">
                       {activeStream === 'STUDENT' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                       {listing.listingType === 'handover' ? 'Handover' : listing.listingType === 'roommate' ? 'Roommate' : 'PG'}
                    </div>
                    {listing.coordinates && (
                      <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 dark:bg-slate-900/90 rounded-md text-[9px] font-black text-gray-900 dark:text-white backdrop-blur-sm shadow-sm flex items-center z-10 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${listing.coordinates.lat},${listing.coordinates.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5"
                        >
                          <MapPin className="w-3 h-3 text-indigo-500" /> Map
                        </a>
                      </div>
                    )}
                    
                    {listing.images && listing.images.length > 0 ? (
                      <Image 
                        src={listing.images[0]} 
                        alt="Room Preview" 
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 opacity-20 group-hover:scale-110 transition-transform duration-300 text-gray-500">
                        {listing.listingType === 'handover' ? (
                          <GraduationCap className="w-12 h-12" />
                        ) : listing.listingType === 'roommate' ? (
                          <Users className="w-12 h-12" />
                        ) : (
                          <Home className="w-12 h-12" />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col mt-2 px-1 pb-1">
                    <h4 className="text-sm font-black text-gray-900 dark:text-white truncate uppercase tracking-tight">
                      {listing.pgName || listing.userId?.hostelName || listing.address || 'Verified Location'}
                    </h4>
                    {listing.address && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5 font-bold uppercase tracking-wider">
                        {listing.address}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-1 font-semibold leading-relaxed">
                      {listing.roomDetails}
                    </p>
                    {listing.price !== undefined && (
                      <p className="text-sm font-black text-gray-900 dark:text-white mt-2">
                        ₹{listing.price.toLocaleString('en-IN')} <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">/ month</span>
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        {new Date(listing.availableDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                      {(listing.legacyBundle?.mattress || listing.legacyBundle?.cooler) && (
                        <div className="flex gap-1.5 items-center">
                          <span className="text-slate-200 dark:text-slate-800">•</span>
                          <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 truncate">
                            Bundle Available
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
                  className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setPage(i + 1)}
                      className={`w-8 h-8 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                        page === i + 1
                          ? 'bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 backdrop-blur-md'
                          : 'text-gray-600 dark:text-slate-445 border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/30 rounded-3xl border border-slate-100 dark:border-slate-800/80">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold mb-6">No listings match your criteria.</p>
            <Link
              href="/create-listing"
              className="inline-block px-6 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 backdrop-blur-md rounded-xl text-micro font-black uppercase tracking-widest transition-all"
            >
              Post a listing
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
