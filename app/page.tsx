'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

interface Listing {
  _id: string;
  listingType: 'handover' | 'pg' | 'roommate';
  pgName?: string;
  roomDetails: string;
  price: number;
  availableDate: string;
  address?: string;
  images?: string[];
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
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
    fetchListings();
    if (t) {
      checkVerification(t);
    }
  }, []);

  const checkVerification = async (authToken: string) => {
    try {
      const res = await fetch('/api/users/profile', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIsVerified(data.verified);
        setUserEmail(data.role === 'STUDENT' ? data.collegeEmail : data.email);
      }
    } catch (error) {
      console.error('Failed to check verification:', error);
    }
  };

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

  const handleProtectedAction = (href: string) => {
    if (!token) {
      router.push('/login');
    } else if (!isVerified) {
      router.push(`/verify-email?email=${encodeURIComponent(userEmail)}`);
    } else {
      router.push(href);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 transition-colors duration-500 overflow-x-hidden">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-105">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo image short.png" alt="Verisite Logo" className="w-full h-full object-cover rounded-full" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Verisite</h1>
          </Link>
          <div className="flex items-center gap-2 sm:gap-6">
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-6">
              <button
                onClick={() => handleProtectedAction('/browse')}
                className="text-md font-medium text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Browse
              </button>
              {token ? (
                <>
                  <button
                    onClick={() => handleProtectedAction('/create-listing')}
                    className="text-md font-medium text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Post Room
                  </button>
                  <button
                    onClick={() => handleProtectedAction('/profile')}
                    className="w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-sm hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                    title="Profile"
                  >
                    👤
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
            {/* Mobile Navigation Icons */}
            <div className="sm:hidden flex items-center gap-2">
               <button onClick={() => handleProtectedAction('/browse')} className="p-2 text-gray-600 dark:text-slate-300">
                  <span className="text-lg">🔍</span>
               </button>
               {token ? (
                 <button onClick={() => handleProtectedAction('/profile')} className="p-2 text-gray-600 dark:text-slate-300">
                   <span className="text-lg">👤</span>
                 </button>
               ) : (
                 <Link href="/login" className="p-2 text-gray-600 dark:text-slate-300">
                   <span className="text-lg">🔑</span>
                 </Link>
               )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 text-center relative">
        <h2 className="text-5xl sm:text-7xl font-extrabold text-gray-900 dark:text-white mb-8 tracking-tighter leading-[1.1] animate-fade-in">
          Find your next place <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-primary-600 to-indigo-500">near campus.</span>
        </h2>
        <p className="text-lg text-gray-500 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.1s' }}>
          Verisite - A True PGvault. The secure platform for verified students to discover,list rooms, and for owners to list PGs.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center px-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={() => handleProtectedAction('/browse')}
            className="w-full sm:w-auto px-8 py-3.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-base transition-colors flex items-center justify-center gap-2"
          >
            Explore Rooms
          </button>
          {!token && (
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 font-medium text-base transition-colors flex items-center justify-center"
            >
              Sign Up
            </Link>
          )}
        </div>
      </section>

      {/* Featured Listings */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex flex-col sm:flex-row justify-between items-end mb-10 gap-4 animate-fade-in">
          <div className="text-left">
            <h3 className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight mb-2">Featured Rooms</h3>
            <p className="text-base text-gray-500 dark:text-slate-400">Handpicked near your institution</p>
          </div>
          <button 
            onClick={() => handleProtectedAction('/browse')}
            className="text-sm text-gray-900 dark:text-white font-medium hover:underline flex items-center gap-1"
          >
            View all <span>→</span>
          </button>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-100 dark:bg-slate-800/50 rounded-xl h-72 animate-pulse" />
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing, idx) => (
              <div
                key={listing._id}
                onClick={() => handleProtectedAction(`/listings/${listing._id}`)}
                className="group flex flex-col gap-3 transition-transform duration-300 hover:-translate-y-1 cursor-pointer"
                style={{ animation: `fadeIn 0.5s ease-out ${idx * 0.1}s both` }}
              >
                {/* Minimal Card Header/Image placeholder */}
                <div className="w-full aspect-4/3 bg-gray-100 dark:bg-slate-800 rounded-xl flex flex-col items-center justify-center relative overflow-hidden border border-gray-200 dark:border-slate-700/50">
                  <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 dark:bg-slate-900/90 rounded text-xs font-semibold text-gray-900 dark:text-white backdrop-blur-sm shadow-sm z-10">
                     {listing.listingType === 'handover' ? 'Handover' : listing.listingType === 'roommate' ? 'Roommate' : 'PG'}
                  </div>
                  
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
                  <div className="flex justify-between items-start">
                    <p className="text-[15px] font-semibold text-gray-900 dark:text-white truncate">
                      {listing.pgName || listing.userId?.hostelName || listing.address || 'Verified Location'}
                    </p>
                  </div>
                  <p className="text-[15px] text-gray-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {listing.roomDetails}
                  </p>
                  <p className="text-[15px] text-gray-500 dark:text-slate-400 mt-0.5">
                    {listing.userId?.name ? listing.userId.name.split(' ')[0] : 'Anonymous'}
                  </p>
                  {listing.price !== undefined && (
                    <p className="text-[15px] font-medium text-gray-900 dark:text-white mt-1">
                      <span className="font-semibold">₹{listing.price.toLocaleString('en-IN')}</span> month
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 dark:bg-slate-900/30 rounded-xl border border-gray-200 dark:border-slate-800 animate-fade-in">
            <p className="text-gray-500 dark:text-slate-400 text-base mb-6">No rooms listed yet.</p>
            <button
              onClick={() => handleProtectedAction('/create-listing')}
              className="inline-block bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              Be the first to post
            </button>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="bg-white dark:bg-slate-950 py-24 sm:py-32 border-t border-gray-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 animate-fade-in">
            <h3 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white tracking-tight mb-4">
              Engineered for Students
            </h3>
            <p className="text-gray-500 dark:text-slate-400 text-lg">
              Built to solve the friction of finding verified accommodation.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 sm:gap-16">
            {[
              { icon: '🛡️', title: 'Verified Identity', desc: 'We use institutional email verification to ensure every user is a legitimate student at your campus.' },
              { icon: '📍', title: 'Geofenced Reviews', desc: 'Reviews are only accepted if you\'re physically near the property, ensuring 100% authentic feedback.' },
              { icon: '⚡', title: 'Instant Listing', desc: 'Post your room handover items in under 60 seconds with our optimized student-focused interface.' }
            ].map((feature, idx) => (
              <div key={idx} className="group animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="text-3xl mb-6">
                  {feature.icon}
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 tracking-tight">
                  {feature.title}
                </h4>
                <p className="text-gray-500 dark:text-slate-400 leading-relaxed text-sm">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-slate-900/50 py-12 border-t border-gray-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
                 <div className="w-8 h-8 flex items-center justify-center">
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                   <img src="/logo image short.png" alt="Verisite" className="w-full h-full object-contain" />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white text-sm">Verisite</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500 dark:text-slate-400">
              <button onClick={() => handleProtectedAction('/browse')} className="hover:text-gray-900 dark:hover:text-white transition-colors">Browse</button>
              <Link href="/login" className="hover:text-gray-900 dark:hover:text-white transition-colors">Login</Link>
              <Link href="/register" className="hover:text-gray-900 dark:hover:text-white transition-colors">Register</Link>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500 dark:text-slate-400">
             <p>&copy; {new Date().getFullYear()} Verisite</p>
             <div className="flex gap-4">
                Made by student for the students
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
