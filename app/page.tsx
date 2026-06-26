'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { Search, User, Key, ArrowRight, Shield, MapPin, Zap, GraduationCap, Users, Home as HomeIcon } from 'lucide-react';

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

function decodeJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
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
      const payload = decodeJwt(t);
      if (payload) {
        setIsVerified(payload.personalEmailVerified);
        setUserEmail(payload.role === 'STUDENT' ? (payload.collegeEmail || '') : (payload.email || ''));
      }
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
        setIsVerified(data.personalEmailVerified);
        setUserEmail(data.role === 'STUDENT' ? data.collegeEmail : data.email);
      }
    } catch (error) {
      console.error('Failed to check verification:', error);
    }
  };

  const fetchListings = async () => {
    try {
      const res = await fetch('/api/listings?limit=20');
      const data = await res.json();
      const allListings: Listing[] = data.data || [];
      // Filter listings to only those that have at least one image
      const listingsWithImages = allListings.filter(l => l.images && l.images.length > 0);
      setListings(listingsWithImages.slice(0, 3));
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
      router.push(`/verify-email?email=${encodeURIComponent(userEmail)}&type=personal`);
    } else {
      router.push(href);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 transition-colors duration-500 overflow-x-hidden">
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
          <div className="flex items-center gap-2 sm:gap-6">
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-6">
              <button
                onClick={() => handleProtectedAction('/browse')}
                className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Browse
              </button>
              {token ? (
                <>
                  <button
                    onClick={() => handleProtectedAction('/create-listing')}
                    className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    Post Room
                  </button>
                  <button
                    onClick={() => handleProtectedAction('/profile')}
                    className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-slate-800/50 border border-gray-200/30 dark:border-slate-700/30 flex items-center justify-center text-sm hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    title="Profile"
                  >
                    <User className="w-4 h-4 text-gray-600 dark:text-slate-300" />
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 bg-indigo-500/10 dark:bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 backdrop-blur-md text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-95"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
            {/* Mobile Navigation Icons */}
            <div className="sm:hidden flex items-center gap-1">
               <button onClick={() => handleProtectedAction('/browse')} className="p-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100/50 dark:hover:bg-slate-900/50 rounded-xl transition-colors">
                  <Search className="w-5 h-5" />
               </button>
               {token ? (
                 <button onClick={() => handleProtectedAction('/profile')} className="p-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100/50 dark:hover:bg-slate-900/50 rounded-xl transition-colors">
                   <User className="w-5 h-5" />
                 </button>
               ) : (
                 <Link href="/login" className="p-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100/50 dark:hover:bg-slate-900/50 rounded-xl transition-colors">
                   <Key className="w-5 h-5" />
                 </Link>
               )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-36 text-center relative z-10">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-87.5 sm:w-150 h-87.5 sm:h-100nded-full bg-indigo-500/10 dark:bg-indigo-600/10 blur-[100px] pointer-events-none -z-10" />
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-6 animate-fade-in shadow-xs">
          <Shield className="w-3.5 h-3.5" />Student Community
        </div>
        
        <h2 className="text-4xl sm:text-6xl font-black text-gray-900 dark:text-white mb-6 sm:mb-8 tracking-tighter leading-tight sm:leading-none animate-fade-in">
          Find your next place <br className="hidden sm:block" />
          <span className="text-indigo-600 dark:text-indigo-400">near campus.</span>
        </h2>
        
        <p className="text-sm sm:text-base text-gray-500 dark:text-slate-400 mb-8 sm:mb-12 max-w-xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.1s' }}>
          Verisite is a secure PGvault built exclusively for verified students. Discover premium rooms, find matching roommates, or list your PG space with ease.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={() => handleProtectedAction('/browse')}
            className="w-full sm:w-auto px-8 py-4 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 backdrop-blur-md rounded-2xl font-black uppercase tracking-widest text-micro transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            Explore Rooms <ArrowRight className="w-3.5 h-3.5" />
          </button>
          {!token && (
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 bg-white/40 dark:bg-slate-900/40 border border-slate-250/20 dark:border-slate-800/50 hover:bg-white/60 dark:hover:bg-slate-900/60 text-gray-900 dark:text-white rounded-2xl backdrop-blur-md font-black uppercase tracking-widest text-micro transition-all active:scale-95 flex items-center justify-center"
            >
              Sign Up
            </Link>
          )}
        </div>
      </section>

      {/* Featured Listings */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end mb-10 gap-4 animate-fade-in">
          <div className="text-center sm:text-left">
            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter uppercase mb-2">Featured Rooms</h3>
            <p className="text-xs sm:text-xs uppercase tracking-widest font-bold text-gray-400 dark:text-slate-500">Handpicked near your institution</p>
          </div>
          <button 
            onClick={() => handleProtectedAction('/browse')}
            className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black hover:underline flex items-center gap-1.5 uppercase tracking-widest cursor-pointer"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex flex-col gap-3 p-3 bg-white dark:bg-slate-900/10 border border-slate-100 dark:border-slate-900/60 rounded-3xl animate-pulse">
                <div className="w-full aspect-4/3 bg-slate-100 dark:bg-slate-800/50 rounded-2xl" />
                <div className="h-4 w-2/3 bg-slate-100 dark:bg-slate-800/50 rounded mt-2" />
                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800/50 rounded" />
                <div className="h-3 w-1/4 bg-slate-100 dark:bg-slate-800/50 rounded" />
              </div>
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing, idx) => (
              <div
                key={listing._id}
                onClick={() => handleProtectedAction(`/listings/${listing._id}`)}
                className="group flex flex-col bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 rounded-3xl p-3 transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl hover:shadow-slate-100 dark:hover:shadow-none cursor-pointer"
                style={{ animation: `fadeIn 0.5s ease-out ${idx * 0.1}s both` }}
              >
                {/* Image layout */}
                <div className="w-full aspect-4/3 bg-gray-50 dark:bg-slate-950 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden border border-gray-100 dark:border-slate-900">
                  <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 dark:bg-slate-900/90 rounded-md text-[9px] uppercase tracking-widest font-black text-gray-900 dark:text-white backdrop-blur-sm shadow-sm z-10">
                     {listing.listingType === 'handover' ? 'Handover' : listing.listingType === 'roommate' ? 'Roommate' : 'PG'}
                  </div>
                  
                  {listing.images && listing.images.length > 0 ? (
                    <Image 
                      src={listing.images[0]} 
                      alt="Room Preview" 
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 opacity-20 group-hover:scale-110 transition-transform duration-300 text-gray-500">
                      {listing.listingType === 'handover' ? (
                        <GraduationCap className="w-12 h-12" />
                      ) : listing.listingType === 'roommate' ? (
                        <Users className="w-12 h-12" />
                      ) : (
                        <HomeIcon className="w-12 h-12" />
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col mt-2 px-1 pb-1">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white truncate uppercase tracking-tight">
                    {listing.pgName || listing.userId?.hostelName || listing.address || 'Verified Location'}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-1 mt-1 font-semibold leading-relaxed">
                    {listing.roomDetails}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-black uppercase tracking-widest">
                    By {listing.userId?.name ? listing.userId.name.split(' ')[0] : 'Anonymous'}
                  </p>
                  {listing.price !== undefined && (
                    <p className="text-sm font-black text-gray-900 dark:text-white mt-2">
                      ₹{listing.price.toLocaleString('en-IN')} <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">/ month</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/30 rounded-3xl border border-slate-100 dark:border-slate-800/80 animate-fade-in">
            <p className="text-gray-500 dark:text-slate-400 text-sm font-semibold mb-6">No rooms listed yet.</p>
            <button
              onClick={() => handleProtectedAction('/create-listing')}
              className="inline-block bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 backdrop-blur-md px-6 py-3 rounded-xl text-micro font-black uppercase tracking-widest transition-all cursor-pointer"
            >
              Be the first to post
            </button>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="bg-white dark:bg-slate-950 py-24 sm:py-36 border-t border-gray-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-20 text-center animate-fade-in">
            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.25em]">PurePG Trust Ledger</span>
            <h3 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase mt-2">
              Engineered for Students
            </h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm sm:text-base font-medium max-w-xl mx-auto mt-2 leading-relaxed">
              Built to solve the friction of finding verified accommodation.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            {[
              { icon: <Shield className="w-7 h-7 text-indigo-500" />, title: 'Verified Identity', desc: 'We use institutional email verification to ensure every user is a legitimate student at your campus.' },
              { icon: <MapPin className="w-7 h-7 text-indigo-500" />, title: 'Geofenced Reviews', desc: 'Reviews are only accepted if you\'re physically near the property, ensuring 100% authentic feedback.' },
              { icon: <Zap className="w-7 h-7 text-indigo-500" />, title: 'Instant Listing', desc: 'Post your room handover items in under 60 seconds with our optimized student-focused interface.' }
            ].map((feature, idx) => (
              <div key={idx} className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/80 rounded-4xl p-6 sm:p-8 hover:-translate-y-1 transition-all duration-300 group" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="w-12 h-12 bg-white dark:bg-slate-950 rounded-xl flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-900 shadow-sm transition-colors group-hover:bg-indigo-500 group-hover:text-white text-indigo-500">
                  {feature.icon}
                </div>
                <h4 className="text-lg font-black text-gray-900 dark:text-white mb-2 tracking-tight uppercase">
                  {feature.title}
                </h4>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-xs font-semibold">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-slate-900/30 py-16 border-t border-gray-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 overflow-hidden rounded-xl border border-gray-200/50 dark:border-slate-800/50">
                <Image 
                  src="/logo image short.png" 
                  alt="Verisite" 
                  fill
                  sizes="32px"
                  className="object-contain" 
                />
              </div>
              <span className="font-black text-gray-900 dark:text-white text-xs uppercase tracking-widest">Verisite</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-8 text-micro font-black uppercase tracking-widest text-gray-500 dark:text-slate-400">
              <button onClick={() => handleProtectedAction('/browse')} className="hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">Browse</button>
              <Link href="/login" className="hover:text-gray-900 dark:hover:text-white transition-colors">Login</Link>
              <Link href="/register" className="hover:text-gray-900 dark:hover:text-white transition-colors">Register</Link>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-100 dark:border-slate-800/80 flex flex-col md:flex-row justify-between items-center gap-4 text-micro font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
             <p>&copy; {new Date().getFullYear()} Verisite</p>
             <div className="flex gap-4">
                Made by students for students
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
