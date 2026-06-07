'use client';

import { useEffect, useState, useRef, useLayoutEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { calculateDistance } from '@/lib/utils/geo';
import { 
  MapPin, 
  Calendar, 
  Star, 
  Trash2, 
  Edit3, 
  Mail, 
  Phone, 
  Users, 
  Utensils, 
  Zap, 
  Package,
  Search,
  CheckCircle2,
  Info,
  Clock,
  ArrowLeft,
  X,
  Maximize2,
  Bike,
  Bus,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface Listing {
  _id: string;
  listingType: 'handover' | 'pg' | 'roommate';
  pgName?: string;
  roomDetails: string;
  price: number;
  availableRooms?: number;
  totalRooms?: number;
  createdAt: string;
  availableDate?: string;
  address?: string;
  amenities?: string[];
  images?: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
  isOwnerListing: boolean;
  handoverMode: boolean;
  reviewCount: number;
  sharingType?: string;
  foodIncluded?: boolean;
  billsIncluded?: boolean;
  genderCategory?: string;
  aiSummary?: string;
  legacyBundle?: {
    mattress?: boolean;
    cooler?: boolean;
    shelf?: boolean;
    lamp?: boolean;
    other?: string;
  };
  userId?: {
    _id: string;
    name: string;
    hostelName?: string;
    roomNumber?: string;
    role: string;
    email?: string;
    phoneNumber?: string;
  };
}

interface Review {
  _id: string;
  rating: number;
  wifiRating?: number;
  foodRating?: number;
  securityRating?: number;
  behaviorRating?: number;
  backupRating?: number;
  responsivenessRating?: number;
  comment: string;
  aiSummary?: string;
  geofenceVerified: boolean;
  createdAt: string;
  userId?: {
    name: string;
  };
}

function DistanceResult({ dist, collegeName, lat, lng, userProfile, onSave }: { 
  dist: number; 
  collegeName: string; 
  lat: number; 
  lng: number; 
  userProfile: any;
  onSave?: () => void;
}) {
  const km = (dist / 1000).toFixed(2);
  const scootyMins = Math.round(dist / 416); // 25km/h avg
  const busMins = Math.round(dist / 250); // 15km/h avg incl stops
  
  let badge = "";
  if (dist < 1000) {
    badge = "Walkable";
  }

  const handleSave = async () => {
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          favoriteCollege: { name: collegeName, lat, lng }
        }),
      });
      if (res.ok) {
        alert('College preference updated!');
        if (onSave) onSave();
      }
    } catch (err) {
      console.error('Failed to save college:', err);
    }
  };

  return (
    <div className={`p-4 rounded-2xl border animate-in fade-in slide-in-from-top-2 bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white`}>
      <div className="flex justify-between items-start mb-2">
        <p className="text-micro text-slate-400">Commute</p>
        {badge && (
          <span className="flex items-center gap-1 text-micro bg-brand-success/10 text-brand-success rounded px-2 py-0.5">
            {badge}
          </span>
        )}
      </div>
      <p className="text-card-title text-gray-900 dark:text-white">
        {km} km <span className="text-micro text-gray-400 dark:text-slate-500 ml-1">away</span>
      </p>
      <div className="mt-3 space-y-2">
        <div className="text-meta text-gray-600 dark:text-slate-400 flex items-center gap-2">
           <Bike className="w-3.5 h-3.5 text-brand-primary" /> ~{scootyMins}m scooty
        </div>
        <div className="text-meta text-gray-600 dark:text-slate-400 flex items-center gap-2">
           <Bus className="w-3.5 h-3.5 text-brand-primary" /> ~{busMins}m bus
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-800">
        <p className="text-sm text-gray-500 dark:text-slate-500 line-clamp-1 italic font-medium">{collegeName}</p>
      </div>
      
      {userProfile && (!userProfile.favoriteCollege || userProfile.favoriteCollege.name !== collegeName) && (
        <button
          onClick={handleSave}
          className="mt-3 text-micro font-black text-brand-primary dark:text-primary-400 hover:underline"
        >
          Set Default
        </button>
      )}
    </div>
  );
}

function CommuteDistanceModule({ 
  autoDist, 
  showSearch, 
  setShowSearch, 
  distLoading, 
  setDistLoading, 
  searchResult, 
  setSearchResult, 
  listing, 
  userProfile, 
  token,
  onProfileUpdate 
}: {
  autoDist: any;
  showSearch: boolean;
  setShowSearch: (v: boolean) => void;
  distLoading: boolean;
  setDistLoading: (v: boolean) => void;
  searchResult: any;
  setSearchResult: (v: any) => void;
  listing: Listing;
  userProfile: any;
  token: string | null;
  onProfileUpdate: () => void;
}) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4 gap-2">
        <h2 className="text-micro text-slate-400 flex items-center gap-2">
           <Search className="w-3.5 h-3.5 text-brand-primary" /> Commute Distance
        </h2>
        <button 
          onClick={() => setShowSearch(!showSearch)} 
          className="text-micro font-black text-brand-primary dark:text-primary-400 hover:underline"
        >
          {showSearch ? 'Cancel' : (autoDist ? 'Change' : 'Check')}
        </button>
      </div>
      
      <div className="w-full space-y-4">
        {autoDist && !showSearch && !searchResult && (
          <DistanceResult 
            dist={autoDist.dist} 
            collegeName={autoDist.name} 
            lat={autoDist.lat} 
            lng={autoDist.lng}
            userProfile={userProfile}
            onSave={onProfileUpdate}
          />
        )}

        {showSearch && (
          <div className="animate-in fade-in slide-in-from-top-1 duration-300">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                autoFocus
                placeholder="College name..."
                disabled={distLoading}
                className="w-full pl-10 pr-10 py-2.5 text-sm font-bold bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-gray-900 dark:text-white"
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    const query = (e.target as HTMLInputElement).value;
                    if (!query || !listing?.coordinates) return;
                    setDistLoading(true);
                    setSearchResult(null);
                    try {
                      const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(query)}`);
                      const data = await res.json();
                      if (res.ok && data.lat && data.lon) {
                        const d = calculateDistance(listing.coordinates.lat, listing.coordinates.lng, data.lat, data.lon);
                        setSearchResult({ dist: d, name: data.name, lat: data.lat, lng: data.lon });
                      } else {
                        alert('Not found.');
                      }
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setDistLoading(false);
                    }
                  }
                }}
              />
              {distLoading && <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="w-3.5 h-3.5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div></div>}
            </div>
          </div>
        )}

        {searchResult && (
          <div className="mt-2">
            <DistanceResult 
              dist={searchResult.dist} 
              collegeName={searchResult.name} 
              lat={searchResult.lat} 
              lng={searchResult.lng}
              userProfile={userProfile}
              onSave={() => {
                setSearchResult(null);
                setShowSearch(false);
                onProfileUpdate();
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [newReview, setNewReview] = useState({ 
    rating: 5, 
    wifiRating: 5,
    foodRating: 5,
    securityRating: 5,
    behaviorRating: 5,
    backupRating: 5,
    responsivenessRating: 5,
    comment: '',
  });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [distLoading, setDistLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<{dist: number, name: string, lat: number, lng: number} | null>(null);
  const [autoDist, setAutoDist] = useState<{dist: number, name: string, lat: number, lng: number} | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [shouldMoveToSidebar, setShouldMoveToSidebar] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  const mainContentRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const id = params.id as string;

  const fetchListing = async () => {
    try {
      const res = await fetch(`/api/listings/${id}`);
      const data = await res.json();
      if (!res.ok) {
        setListing(null);
      } else {
        setListing(data);
      }
    } catch (error) {
      setListing(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/reviews?listingId=${id}`);
      const data = await res.json();
      if (data.data) {
        setReviews(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  const fetchUserProfile = async (authToken: string) => {
    try {
      const res = await fetch('/api/users/profile', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        if (!data.verified) {
          const email = data.role === 'STUDENT' ? data.collegeEmail : data.email;
          router.push(`/verify-email?email=${encodeURIComponent(email)}`);
          return;
        }
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) {
      router.push('/login');
      return;
    }
    setToken(t);
    if (t) fetchUserProfile(t);
    else setProfileLoading(false);
    fetchListing();
    fetchReviews();
  }, []);

  useEffect(() => {
    if (userProfile?.favoriteCollege && listing?.coordinates) {
      const d = calculateDistance(
        listing.coordinates.lat,
        listing.coordinates.lng,
        userProfile.favoriteCollege.lat,
        userProfile.favoriteCollege.lng
      );
      setAutoDist({
        dist: d,
        name: userProfile.favoriteCollege.name,
        lat: userProfile.favoriteCollege.lat,
        lng: userProfile.favoriteCollege.lng,
      });
    }
  }, [userProfile, listing]);

  useLayoutEffect(() => {
    const handleResize = () => {
      setShouldMoveToSidebar(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setReviewLoading(true);
    setReviewError('');

    if (!navigator.geolocation) {
      setReviewError('Geolocation is not supported by your browser.');
      setReviewLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch('/api/reviews', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              listingId: id,
              rating: newReview.rating,
              wifiRating: newReview.wifiRating,
              foodRating: newReview.foodRating,
              securityRating: newReview.securityRating,
              behaviorRating: newReview.behaviorRating,
              backupRating: newReview.backupRating,
              responsivenessRating: newReview.responsivenessRating,
              comment: newReview.comment,
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }),
          });

          const data = await res.json();
          if (res.ok) {
            setNewReview({ 
              rating: 5, 
              wifiRating: 5,
              foodRating: 5,
              securityRating: 5,
              behaviorRating: 5,
              backupRating: 5,
              responsivenessRating: 5,
              comment: '',
            });
            fetchReviews();
            fetchListing();
          } else {
            setReviewError(data.error);
          }
        } catch (error) {
          setReviewError('Failed to submit review');
        } finally {
          setReviewLoading(false);
        }
      },
      (error) => {
        setReviewError('Location access is required to verify your review authenticity.');
        setReviewLoading(false);
      }
    );
  };

  const handleDeleteListing = async () => {
    if (!listing) return;
    if (!listing.isOwnerListing && listing.reviewCount > 1) {
      alert('Community Ownership Rule: This listing has interaction and cannot be deleted.');
      return;
    }
    if (!confirm('Delete this listing?')) return;
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        router.push('/browse');
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-gray-400 dark:text-slate-600 animate-pulse font-medium text-lg text-body">Loading...</div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-section-heading text-gray-900 dark:text-white mb-4">Listing not found</h1>
        <Link href="/browse" className="bg-brand-primary text-white px-6 py-3 rounded-lg font-black uppercase tracking-widest text-micro transition-all active:scale-95">Back to listings</Link>
      </div>
    );
  }

  const isOwner = userProfile && listing?.userId && userProfile.id === (typeof listing.userId === 'string' ? listing.userId : listing.userId._id);
  const canReview = userProfile && userProfile.role === 'STUDENT' && userProfile.verified && !isOwner;
  const isRatingPost = listing.listingType === 'pg' && !listing.isOwnerListing;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500">
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center transition-transform group-hover:scale-105">
              <img src="/logo image short.png" alt="Logo" className="w-full h-full object-cover rounded-full" />
            </div>
            <h1 className="text-card-title font-black tracking-tighter text-gray-900 dark:text-white">Verisite</h1>
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle />
            <Link href="/browse" className="text-micro font-black uppercase tracking-widest text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> <span className="hidden xs:inline">Browse</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header Section - High Density */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="w-full">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                 <span className="px-2 py-0.5 bg-brand-primary/5 dark:bg-brand-primary/20 text-micro font-black text-brand-primary rounded">
                   {listing.listingType === 'roommate' ? 'Roommate Search' : listing.listingType === 'handover' ? 'Room Handover' : 'Student Rating'}
                 </span>
                 {!listing.isOwnerListing && (
                   <span className="flex items-center gap-1 text-micro font-black text-brand-success bg-brand-success/5 px-2 py-0.5 rounded border border-brand-success/10">
                     <ShieldCheck className="w-2.5 h-2.5" /> Verified Truth
                   </span>
                 )}
              </div>
              <h1 className="text-display-hero text-gray-900 dark:text-white mb-2 tracking-tighter leading-tight uppercase">
                {listing.pgName || listing.userId?.hostelName || 'Verified Property'}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-micro font-black text-gray-400 dark:text-slate-500">
                <span className="flex items-center gap-1.5 max-w-[200px] sm:max-w-none">
                   <MapPin className="w-3.5 h-3.5 text-brand-primary shrink-0" /> <span className="truncate">{listing.address || 'Location Verified'}</span>
                </span>
                {listing.coordinates && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${listing.coordinates.lat},${listing.coordinates.lng}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-brand-primary dark:text-primary-400 hover:underline transition-colors whitespace-nowrap uppercase tracking-widest"
                  >
                    View Map <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
            {isOwner && (
              <div className="flex gap-2 w-full md:w-auto shrink-0 mt-2 md:mt-0">
                <Link href={`/create-listing?id=${id}`} className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors text-center text-micro font-black uppercase tracking-widest flex items-center justify-center gap-2 text-gray-900 dark:text-white shadow-sm">
                  <Edit3 className="w-3.5 h-3.5" /> Edit Specs
                </Link>
                <button onClick={handleDeleteListing} disabled={!listing.isOwnerListing && listing.reviewCount > 1} className="p-2 bg-brand-danger/10 text-brand-danger rounded-xl hover:bg-brand-danger/20 transition-colors disabled:opacity-30">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          
          {!isRatingPost && (
            <div className="flex flex-wrap gap-4 items-center justify-between py-3 mt-4 border-y border-slate-100 dark:border-slate-800">
              <div className="flex items-baseline gap-1">
                 <span className="text-display-hero text-gray-900 dark:text-white tracking-tighter">
                   ₹{(listing.price ?? 0).toLocaleString('en-IN')}
                 </span>
                 <span className="text-micro font-black text-gray-400 ml-1">/ month</span>
              </div>
              {listing.isOwnerListing && (
                <div className="flex items-center gap-2 px-3 py-1 bg-brand-primary/5 dark:bg-brand-primary/20 rounded-full border border-brand-primary/10">
                   <Users className="w-3.5 h-3.5 text-brand-primary" />
                   <span className="text-micro font-black text-brand-primary uppercase">
                     {listing.availableRooms}/{listing.totalRooms} Available
                   </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-6">
            {/* Image Gallery - Highly Space Efficient */}
            {listing.images && listing.images.length > 0 && (
              <div className="group relative">
                <div className={`grid gap-1.5 ${listing.images.length === 1 ? 'grid-cols-1' : listing.images.length === 2 ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-4 md:grid-rows-2 h-[280px] sm:h-[380px]'}`}>
                  {listing.images.map((imgUrl, index) => (
                    <div 
                      key={index} 
                      onClick={() => setFullScreenImage(imgUrl)}
                      className={`relative rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 cursor-zoom-in group/img ${
                        listing.images!.length >= 3 
                          ? index === 0 ? 'md:col-span-3 md:row-span-2' : 'hidden md:block'
                          : 'aspect-16/10'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Room Image ${index + 1}`}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                         <div className="bg-white/90 p-2 rounded-full shadow-lg transform scale-90 group-hover/img:scale-100 transition-transform">
                            <Maximize2 className="w-4 h-4 text-gray-900" />
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
                {listing.images.length > 3 && (
                   <button onClick={() => setFullScreenImage(listing.images![0])} className="absolute bottom-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-micro font-black border border-slate-200 dark:border-slate-800 shadow-xl flex items-center gap-2 hover:bg-white transition-all uppercase tracking-widest">
                      <Maximize2 className="w-3 h-3" /> All Photos
                   </button>
                )}
              </div>
            )}

            <div className="space-y-6">
              {/* Description - More Compact */}
              {!isRatingPost && (
                <section>
                  <h2 className="text-micro font-black mb-3 flex items-center gap-2 text-slate-400 uppercase tracking-widest">
                     <Info className="w-3.5 h-3.5 text-brand-primary" /> Property Details
                  </h2>
                  <div className="bg-slate-50/50 dark:bg-slate-900/30 p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-gray-600 dark:text-slate-300 text-body leading-relaxed whitespace-pre-wrap font-medium">{listing.roomDetails}</p>
                  </div>
                </section>
              )}

              {/* Combined Specs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(listing.sharingType || listing.foodIncluded || listing.billsIncluded) && (
                  <section>
                    <h2 className="text-micro font-black mb-3 flex items-center gap-2 text-slate-400 uppercase tracking-widest">
                      <Users className="w-3.5 h-3.5 text-brand-primary" /> Specifications
                    </h2>
                    <div className="grid grid-cols-2 gap-2">
                      {listing.genderCategory && (
                        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col gap-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gender</span>
                          <span className="font-black text-sm capitalize truncate text-slate-900 dark:text-white">{listing.genderCategory === 'both' ? 'Mixed' : listing.genderCategory}</span>
                        </div>
                      )}
                      {listing.sharingType && (
                        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col gap-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sharing</span>
                          <span className="font-black text-sm capitalize truncate text-slate-900 dark:text-white">{listing.sharingType}</span>
                        </div>
                      )}
                      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Food</span>
                        <span className={`text-sm font-black ${listing.foodIncluded ? 'text-brand-success' : 'text-slate-400'}`}>{listing.foodIncluded ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bills</span>
                        <span className={`text-sm font-black ${listing.billsIncluded ? 'text-brand-success' : 'text-slate-400'}`}>{listing.billsIncluded ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </section>
                )}

                {listing.listingType === 'handover' && listing.legacyBundle && (
                  <section>
                    <h2 className="text-micro font-black mb-3 flex items-center gap-2 text-slate-400 uppercase tracking-widest">
                      <Package className="w-3.5 h-3.5 text-brand-primary" /> Bundle Deal
                    </h2>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Mattress', active: listing.legacyBundle.mattress },
                        { label: 'Cooler', active: listing.legacyBundle.cooler },
                        { label: 'Shelf', active: listing.legacyBundle.shelf },
                        { label: 'Lamp', active: listing.legacyBundle.lamp },
                      ].map(item => (
                        <div key={item.label} className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${item.active ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-xs' : 'bg-slate-50/50 dark:bg-slate-900/10 border-transparent opacity-20'}`}>
                           <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{item.label}</span>
                           {item.active && <CheckCircle2 className="w-3 h-3 text-brand-success" />}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>

            {/* Commute Module */}
            {userProfile?.role === 'STUDENT' && !shouldMoveToSidebar && (
              <section className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <CommuteDistanceModule 
                  autoDist={autoDist}
                  showSearch={showSearch}
                  setShowSearch={setShowSearch}
                  distLoading={distLoading}
                  setDistLoading={setDistLoading}
                  searchResult={searchResult}
                  setSearchResult={setSearchResult}
                  listing={listing}
                  userProfile={userProfile}
                  token={token}
                  onProfileUpdate={() => fetchUserProfile(token!)}
                />
              </section>
            )}

            {/* Reviews Section - Modern & Spaced Efficiently */}
            <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
               <div className="flex items-center justify-between mb-6">
                  <h2 className="text-section-heading font-black text-gray-900 dark:text-white flex items-center gap-3 uppercase tracking-tighter">
                    Verified Truth
                    <span className="bg-brand-primary text-white px-2 py-0.5 rounded-md text-micro font-black">{reviews.length}</span>
                  </h2>
                  {canReview && !isRatingPost && (
                    <button onClick={() => {
                      const form = document.getElementById('review-form');
                      form?.scrollIntoView({ behavior: 'smooth' });
                    }} className="text-micro font-black text-brand-primary uppercase tracking-widest hover:underline">Write One</button>
                  )}
               </div>

               {listing.aiSummary && (
                 <div className="mb-10 bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-[2rem] p-6 sm:p-8 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                     <Zap className="w-12 h-12 text-indigo-500" />
                   </div>
                   <div className="relative z-10">
                     <div className="flex items-center gap-2 mb-3">
                       <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                         <Zap className="w-3.5 h-3.5 text-white" />
                       </div>
                       <span className="text-micro font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">Collective AI Insight</span>
                     </div>
                     <p className="text-slate-700 dark:text-indigo-100 text-sm sm:text-base leading-relaxed font-semibold italic">
                       "{listing.aiSummary}"
                     </p>
                   </div>
                 </div>
               )}

               {canReview && (
                <form id="review-form" onSubmit={handleReviewSubmit} className="mb-10 bg-slate-50 dark:bg-slate-900/40 rounded-[2rem] p-5 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-100 dark:shadow-none">
                  <h3 className="text-micro font-black mb-6 text-gray-900 dark:text-white uppercase tracking-[0.25em]">Rate Your Stay</h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                     {[
                      { label: 'Wi-Fi / Network', key: 'wifiRating' },
                      { label: 'Food Quality', key: 'foodRating' },
                      { label: 'Safety / Guard', key: 'securityRating' },
                      { label: 'Owner Behaviour', key: 'behaviorRating' },
                      { label: 'Power Backup', key: 'backupRating' },
                      { label: 'Response Time', key: 'responsivenessRating' },
                    ].map((field) => (
                      <div key={field.key} className="bg-white dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1.5 px-1">
                          {field.label}
                        </label>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setNewReview(prev => ({ ...prev, [field.key]: val }))}
                              className={`flex-1 py-1 text-xs font-black rounded-md transition-all ${
                                (newReview as Record<string, unknown>)[field.key] === val
                                  ? 'bg-brand-primary text-white shadow-sm'
                                  : 'text-slate-300 hover:text-brand-primary'
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-6 items-start mb-6">
                    <div className="shrink-0">
                      <label className="block text-micro font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Overall Score *</label>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setNewReview({ ...newReview, rating: val })}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-black transition-all ${
                              newReview.rating === val
                                ? 'bg-brand-warning text-white scale-105 shadow-lg shadow-brand-warning/30'
                                : 'bg-white dark:bg-slate-950 text-slate-400 border border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1 w-full space-y-2">
                      <label className="block text-micro font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Detailed Commentary *</label>
                      <textarea required value={newReview.comment} onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })} className="w-full p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none ring-brand-primary focus:ring-1 text-gray-900 dark:text-white text-sm font-medium shadow-xs" placeholder="Be honest about food, rules, and owners..." rows={3} />
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {reviewError && (
                      <div className="text-micro font-black text-brand-danger uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5" /> {reviewError}
                      </div>
                    )}
                    <button type="submit" disabled={reviewLoading} className="w-full sm:w-auto bg-brand-primary text-white px-8 py-3.5 rounded-xl font-black uppercase tracking-widest text-micro shadow-xl shadow-brand-primary/30 hover:bg-brand-hover transition-all active:scale-95 disabled:opacity-50 ml-auto">
                      {reviewLoading ? 'VERIFYING...' : 'Post Truth Ledger Review'}
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review._id} className="bg-white dark:bg-slate-900/60 p-5 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-xs hover:shadow-md transition-all">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-brand-primary/5 dark:bg-brand-primary/20 rounded-full flex items-center justify-center text-brand-primary font-black text-xs uppercase">
                          {review.userId?.name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <div className="font-black text-micro flex items-center gap-1.5 text-gray-900 dark:text-white uppercase tracking-widest leading-none">
                            Verified Student {review.geofenceVerified && <ShieldCheck className="w-3 h-3 text-brand-success" />}
                          </div>
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{new Date(review.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-brand-warning/10 dark:bg-brand-warning/5 px-3 py-1 rounded-full border border-brand-warning/20">
                         <Star className="w-3.5 h-3.5 fill-brand-warning text-brand-warning" />
                         <span className="text-sm font-black text-brand-warning dark:text-brand-warning">{review.rating}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                       <div className="md:col-span-3 space-y-4">
                          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed font-medium">{review.comment}</p>
                       </div>

                       <div className="md:col-span-2 bg-slate-50/50 dark:bg-slate-950/20 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-x-4 gap-y-3 h-fit self-start shadow-inner">
                          {[
                            { label: 'Network', val: review.wifiRating },
                            { label: 'Food', val: review.foodRating },
                            { label: 'Safety', val: review.securityRating },
                            { label: 'Owner', val: review.behaviorRating },
                            { label: 'Power backup', val: review.backupRating },
                            { label: 'Response time', val: review.responsivenessRating },
                          ].map(m => m.val ? (
                            <div key={m.label} className="space-y-1">
                              <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <span>{m.label}</span>
                                <span className="text-brand-primary font-black">{m.val}</span>
                              </div>
                              <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full shadow-sm transition-all duration-1000 ease-out ${
                                    m.val >= 4 ? 'bg-brand-success' : 
                                    m.val >= 3 ? 'bg-brand-warning' : 
                                    'bg-brand-danger'
                                  }`} 
                                  style={{ width: `${(m.val / 5) * 100}%` }}
                                />
                              </div>
                            </div>
                          ) : null)}
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div ref={sidebarRef} className="lg:col-span-4 space-y-4">
            <div className="sticky top-20 space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] p-5 border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/20 dark:shadow-none transition-all">
                <div className="flex items-center justify-between mb-5 px-1">
                   <h3 className="text-micro font-black text-slate-400 uppercase tracking-[0.25em]">Dashboard</h3>
                   <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-brand-success rounded-full"></div>
                      <div className="w-1.5 h-1.5 bg-brand-success rounded-full opacity-30 animate-pulse"></div>
                   </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors hover:border-slate-200">
                     <div className="w-9 h-9 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/30 shrink-0">
                        <Calendar className="w-4 h-4 text-white" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Availability</p>
                        <p className="text-sm font-black text-gray-900 dark:text-white tracking-tight">
                          {listing.availableDate ? new Date(listing.availableDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Ready Now'}
                        </p>
                     </div>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors hover:border-slate-200">
                     <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
                        <Users className="w-4 h-4 text-white" />
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Posted By</p>
                        <p className="text-sm font-black text-gray-900 dark:text-white truncate uppercase tracking-tighter">
                          {listing.isOwnerListing || listing.handoverMode || listing.listingType === 'roommate' ? listing.userId?.name || 'Verified User' : 'Anonymous Student'}
                        </p>
                     </div>
                  </div>

                  {token ? (
                    (listing.isOwnerListing || listing.handoverMode || listing.listingType === 'roommate') ? (
                      listing.userId?.email ? (
                        <div className="space-y-5 pt-3">
                          <div className="grid grid-cols-1 gap-2.5">
                            <a href={`mailto:${listing.userId.email}`} className="flex items-center justify-center gap-2.5 w-full py-3.5 bg-brand-primary hover:bg-brand-hover text-white rounded-2xl font-black uppercase tracking-widest text-micro transition-all shadow-xl shadow-brand-primary/25 active:scale-95">
                              <Mail className="w-4 h-4" /> Send Email
                            </a>
                            {listing.userId.phoneNumber && (
                              <a href={`tel:${listing.userId.phoneNumber}`} className="flex items-center justify-center gap-2.5 w-full py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-2xl font-black uppercase tracking-widest text-micro transition-all hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm">
                                <Phone className="w-4 h-4" /> Call Student
                              </a>
                            )}
                          </div>
                          
                          <div className="space-y-3 pt-5 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-4">
                              <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center border border-slate-100 dark:border-slate-800 shrink-0">
                                <Mail className="w-4 h-4 text-slate-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Email ID</p>
                                <p className="text-[13px] font-bold text-slate-700 dark:text-slate-300 truncate uppercase tracking-tighter">{listing.userId.email}</p>
                              </div>
                            </div>
                            {listing.userId.phoneNumber && (
                              <div className="flex items-center gap-4">
                                <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center border border-slate-100 dark:border-slate-800 shrink-0">
                                  <Phone className="w-4 h-4 text-slate-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Mobile No</p>
                                  <p className="text-[13px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tighter">{listing.userId.phoneNumber}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null
                    ) : (
                      <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-micro font-black text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 mt-2 uppercase tracking-[0.2em] leading-loose">
                        Student Identity <br/> Anonymous for Review Integrity
                      </div>
                    )
                  ) : (
                    <Link href="/login" className="flex items-center justify-center gap-3 w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-micro transition-colors shadow-xl">
                      <Zap className="w-4 h-4" /> Authorize Access
                    </Link>
                  )}
                </div>
              </div>

              {userProfile?.role === 'STUDENT' && shouldMoveToSidebar && (
                <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] p-5 border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
                  <CommuteDistanceModule 
                    autoDist={autoDist}
                    showSearch={showSearch}
                    setShowSearch={setShowSearch}
                    distLoading={distLoading}
                    setDistLoading={setDistLoading}
                    searchResult={searchResult}
                    setSearchResult={setSearchResult}
                    listing={listing}
                    userProfile={userProfile}
                    token={token}
                    onProfileUpdate={() => fetchUserProfile(token!)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
