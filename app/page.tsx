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
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 transition-colors duration-500 overflow-x-hidden">
      {/* Dynamic Background Effect with Animation */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-500/10 blur-[120px] animate-float" style={{ animationDelay: '0s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-[30%] h-[30%] rounded-full bg-purple-500/5 blur-[120px] animate-float" style={{ animationDelay: '4s' }} />
      </div>

      {/* Navigation */}
      <nav className="glass sticky top-0 z-50 border-b border-gray-200/50 dark:border-slate-800/50 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-primary-500/30 group-hover:scale-110 transition-transform">
              PP
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">PurePG</h1>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-4">
              <Link
                href="/browse"
                className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 font-semibold transition-colors"
              >
                Browse
              </Link>
              {token ? (
                <>
                  <Link
                    href="/create-listing"
                    className="px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-bold transition shadow-lg shadow-primary-500/20 active:scale-95"
                  >
                    Post Room
                  </Link>
                  <Link
                    href="/profile"
                    className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-gray-200 dark:border-slate-700"
                    title="Profile"
                  >
                    👤
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 font-semibold transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-bold transition shadow-lg shadow-primary-500/20 active:scale-95"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
            {/* Mobile Navigation Icons */}
            <div className="sm:hidden flex items-center gap-1">
               <Link href="/browse" className="p-2 text-gray-700 dark:text-slate-300">
                  <span className="text-xl">🔍</span>
               </Link>
               {token ? (
                 <Link href="/profile" className="p-2 text-gray-700 dark:text-slate-300">
                   <span className="text-xl">👤</span>
                 </Link>
               ) : (
                 <Link href="/login" className="p-2 text-gray-700 dark:text-slate-300">
                   <span className="text-xl">🔑</span>
                 </Link>
               )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 text-center relative">
        <div className="animate-slide-down inline-block px-4 py-1.5 mb-6 rounded-full bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800 text-primary-600 dark:text-primary-400 text-xs font-black uppercase tracking-widest">
          ✨ Designed for Verified Students
        </div>
        <h2 className="text-5xl sm:text-7xl font-black text-gray-900 dark:text-white mb-8 tracking-tighter leading-[1.1] animate-slide-up">
          Seamless <span className="gradient-text">Room Handovers</span> for Campus Life
        </h2>
        <p className="text-lg sm:text-xl text-gray-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
          The all-in-one platform for verified students to securely hand over hostel rooms and for owners to list whitelisted PGs.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center px-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <Link
            href="/browse"
            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-2xl hover:from-primary-700 hover:to-primary-800 font-black text-lg transition-all shadow-2xl shadow-primary-500/40 active:scale-95 hover:shadow-2xl hover:shadow-primary-500/60 flex items-center justify-center gap-2 group btn-press"
          >
            Find a Room <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
          {!token && (
            <Link
              href="/register"
              className="w-full sm:w-auto px-10 py-4 glass border-2 border-primary-600 text-primary-600 dark:text-primary-400 rounded-2xl hover:bg-primary-50 dark:hover:bg-primary-900/20 font-black text-lg transition-all flex items-center justify-center btn-press backdrop-blur-sm"
            >
              Create Account
            </Link>
          )}
        </div>
      </section>

      {/* Featured Listings */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex flex-col sm:flex-row justify-between items-end mb-12 gap-4 animate-slide-up">
          <div className="text-center sm:text-left">
            <h3 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tighter mb-2">Featured Listings</h3>
            <p className="text-gray-500 dark:text-slate-400 font-medium">Handpicked rooms near your institution</p>
          </div>
          <Link href="/browse" className="text-primary-600 dark:text-primary-400 font-bold hover:underline flex items-center gap-1 group smooth-color">
            View all <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-slate-100 dark:bg-slate-900 rounded-3xl h-80 shimmer border border-gray-200 dark:border-slate-800" />
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {listings.map((listing, idx) => (
              <Link
                key={listing._id}
                href={`/listings/${listing._id}`}
                className="group bg-white dark:bg-slate-900 rounded-3xl shadow-md border border-gray-100 dark:border-slate-800 overflow-hidden card-hover transition-all duration-300 hover:border-primary-500/30 hover:shadow-xl"
                style={{ animation: `slideUp 0.5s ease-out ${idx * 0.1}s both` }}
              >
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                      <span className="text-2xl">{listing.listingType === 'handover' ? '🎓' : '🏠'}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                      listing.listingType === 'handover' 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' 
                        : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                    }`}>
                      {listing.listingType === 'handover' ? 'Handover' : 'PG'}
                    </span>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter mb-1">
                      ₹{(listing.price ?? 0).toLocaleString('en-IN')}<span className="text-sm text-gray-500 font-normal">/mo</span>
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-slate-400 font-bold flex items-center gap-1">
                      <span className="text-primary-600 text-base">📍</span>
                      {listing.listingType === 'handover' 
                        ? (listing.userId?.hostelName || 'Hostel') 
                        : (listing.address || 'Accommodation')}
                    </p>
                  </div>
                  
                  <p className="text-gray-600 dark:text-slate-300 text-sm mb-8 line-clamp-2 leading-relaxed font-medium">
                    {listing.roomDetails}
                  </p>

                  <div className="flex justify-between items-center border-t border-gray-50 dark:border-slate-800 pt-6">
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-xs font-black text-white shadow-sm">
                          {listing.userId?.name ? listing.userId.name.charAt(0) : '?'}
                       </div>
                       <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                         {listing.userId?.name ? listing.userId.name.split(' ')[0] : 'Anonymous'}
                       </span>
                    </div>
                    <div className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                      Details <span>→</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[40px] border border-dashed border-gray-200 dark:border-slate-800 animate-slide-up">
            <div className="text-6xl mb-6 opacity-30 animate-float">📭</div>
            <p className="text-gray-500 dark:text-slate-400 text-lg mb-8 font-bold">No rooms listed yet.</p>
            {token && (
              <Link
                href="/create-listing"
                className="inline-block bg-gradient-to-r from-primary-600 to-primary-700 text-white px-10 py-4 rounded-2xl font-black hover:from-primary-700 hover:to-primary-800 transition-all shadow-xl shadow-primary-500/30 btn-press"
              >
                Be the first to post
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-950 py-32 transition-colors duration-500 border-y border-gray-100 dark:border-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 animate-slide-up">
            <h3 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tighter mb-4">
              Engineered for Students
            </h3>
            <p className="text-gray-500 dark:text-slate-400 max-w-xl mx-auto font-medium">
              We built PurePG to solve the friction of finding verified accommodation and handling room handovers.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 sm:gap-16">
            {[
              { icon: '🛡️', title: 'Verified Identity', desc: 'We use institutional email verification to ensure every user is a legitimate student at your campus.', color: 'blue' },
              { icon: '📍', title: 'Geofenced Reviews', desc: 'Reviews are only accepted if you\'re physically near the property, ensuring 100% authentic feedback.', color: 'purple' },
              { icon: '⚡', title: 'Instant Listing', desc: 'Post your room handover items in under 60 seconds with our optimized student-focused interface.', color: 'green' }
            ].map((feature, idx) => (
              <div key={idx} className="p-10 bg-white dark:bg-slate-900 rounded-[32px] border border-gray-100 dark:border-slate-800 shadow-md transition-all duration-300 hover:shadow-xl hover:border-primary-500/30 hover:-translate-y-1 group animate-slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className={`w-16 h-16 bg-${feature.color}-50 dark:bg-${feature.color}-900/20 rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h4 className="text-2xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                  {feature.title}
                </h4>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed font-medium">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-950 text-gray-600 dark:text-slate-400 py-20 border-t border-gray-100 dark:border-slate-900 transition-colors duration-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-6 justify-center sm:justify-start">
                 <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-primary-500/20">
                  PP
                </div>
                <span className="font-black text-gray-900 dark:text-white tracking-tighter text-xl">PurePG</span>
              </div>
              <p className="text-sm max-w-xs mx-auto sm:mx-0 font-medium">
                Making student accommodation safe, transparent, and easy for everyone.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-8 justify-center sm:justify-end font-bold text-sm uppercase tracking-widest text-gray-400 dark:text-slate-600">
              <Link href="/browse" className="hover:text-primary-600 transition-colors">Browse</Link>
              <Link href="/login" className="hover:text-primary-600 transition-colors">Login</Link>
              <Link href="/register" className="hover:text-primary-600 transition-colors">Register</Link>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-gray-100 dark:border-slate-900 flex flex-col sm:flex-row justify-between items-center gap-4">
             <p className="text-xs font-bold opacity-40 uppercase tracking-[0.2em]">&copy; 2024 PurePG Platform</p>
             <div className="flex gap-6 opacity-40 grayscale hover:grayscale-0 transition-all">
                <span className="text-xs font-black">IITK</span>
                <span className="text-xs font-black">DU</span>
                <span className="text-xs font-black">BITS</span>
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
