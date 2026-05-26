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
  ChevronLeft, 
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
  Maximize2
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
  comment: string;
  geofenceVerified: boolean;
  createdAt: string;
}

function DistanceResult({ dist, collegeName, lat, lng, userProfile, listing, onSave }: { 
  dist: number; 
  collegeName: string; 
  lat: number; 
  lng: number; 
  userProfile: any;
  listing: Listing;
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
    <div className={`p-4 rounded-xl border animate-in fade-in slide-in-from-top-2 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white`}>
      <div className="flex justify-between items-start mb-2">
        <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Distance</p>
        {badge && (
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-md">
            <CheckCircle2 className="w-3 h-3" /> {badge}
          </span>
        )}
      </div>
      <p className="text-2xl font-semibold text-gray-900 dark:text-white">
        {km} km <span className="text-[15px] font-normal text-gray-500 dark:text-slate-400">away</span>
      </p>
      <div className="mt-3 space-y-1.5">
        <p className="text-[14px] text-gray-600 dark:text-slate-300 flex items-center gap-2">
           <span className="opacity-70 text-base">🛵</span> ~{scootyMins} mins by scooty
        </p>
        <p className="text-[14px] text-gray-600 dark:text-slate-300 flex items-center gap-2">
           <span className="opacity-70 text-base">🚌</span> ~{busMins} mins by bus
        </p>
      </div>
      <p className="text-[13px] text-gray-500 dark:text-slate-400 mt-3 line-clamp-1 italic">{collegeName}</p>
      
      {userProfile && (!userProfile.favoriteCollege || userProfile.favoriteCollege.name !== collegeName) && (
        <button
          onClick={handleSave}
          className="mt-4 text-[14px] font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
        >
          Set as default college
        </button>
      )}
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
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
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
    if (loading || profileLoading) return;

    if (listing?.coordinates && userProfile?.favoriteCollege) {
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
        lng: userProfile.favoriteCollege.lng
      });
      setShowSearch(false);
    } else {
      setShowSearch(true);
    }
  }, [listing, userProfile, loading, profileLoading]);

  useLayoutEffect(() => {
    const calculateLayout = () => {
      if (!loading && listing && mainContentRef.current && sidebarRef.current) {
        const mainHeight = mainContentRef.current.offsetHeight;
        const sidebarHeight = sidebarRef.current.offsetHeight;
        if (mainHeight > (sidebarHeight * 0.5)) {
          setShouldMoveToSidebar(true);
        } else {
          setShouldMoveToSidebar(false);
        }
      }
    };
    calculateLayout();
    window.addEventListener('resize', calculateLayout);
    return () => window.removeEventListener('resize', calculateLayout);
  }, [loading, listing]);

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
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

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
              comment: newReview.comment,
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }),
          });

          const data = await res.json();
          if (res.ok) {
            setNewReview({ rating: 5, comment: '' });
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
        <div className="text-gray-400 dark:text-slate-600 animate-pulse font-medium text-lg">Loading...</div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-3xl font-semibold mb-4 text-gray-900 dark:text-white">Listing not found</h1>
        <Link href="/browse" className="bg-primary-600 text-white px-6 py-3 rounded-lg font-bold">Back to listings</Link>
      </div>
    );
  }

  const isOwner = userProfile && listing?.userId && userProfile.id === (typeof listing.userId === 'string' ? listing.userId : listing.userId._id);
  const canReview = userProfile && userProfile.role === 'STUDENT' && userProfile.verified && !isOwner;
  const isRatingPost = listing.listingType === 'pg' && !listing.isOwnerListing;

  const CommuteDistanceModule = () => (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
           <Search className="w-5 h-5 text-gray-400" /> Commute Distance
        </h2>
        {autoDist && (
          <button 
            onClick={() => setShowSearch(!showSearch)} 
            className="text-[13px] font-medium text-primary-600 dark:text-primary-400 hover:underline"
          >
            {showSearch ? 'Cancel' : 'Change Location'}
          </button>
        )}
      </div>
      
      <div className="w-full">
        {autoDist && !showSearch && (
          <DistanceResult 
            dist={autoDist.dist} 
            collegeName={autoDist.name} 
            lat={autoDist.lat} 
            lng={autoDist.lng}
            userProfile={userProfile}
            listing={listing}
            onSave={() => fetchUserProfile(token!)}
          />
        )}

        {showSearch && (
          <div>
            <div className="relative max-w-md">
              <input
                type="text"
                placeholder="Enter college/university name..."
                disabled={distLoading}
                className="w-full px-4 py-2.5 text-[15px] bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
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
                        alert('College not found.');
                      }
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setDistLoading(false);
                    }
                  }
                }}
              />
              {distLoading && <div className="absolute right-3 top-3"><div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>}
            </div>
          </div>
        )}

        {searchResult && (
          <div className="mt-4">
            <DistanceResult 
              dist={searchResult.dist} 
              collegeName={searchResult.name} 
              lat={searchResult.lat} 
              lng={searchResult.lng}
              userProfile={userProfile}
              listing={listing}
              onSave={() => {
                setSearchResult(null);
                fetchUserProfile(token!);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500">
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-105">
              <img src="/logo image short.png" alt="Logo" className="w-full h-full object-cover rounded-full" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Verisite</h1>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/browse" className="text-[15px] font-medium text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Listings
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header Section */}
        <div className="mb-8 border-b border-gray-200 dark:border-slate-800 pb-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-6">
            <div className="w-full">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400 mb-3">
                 <span className="px-2 py-0.5 bg-primary-50 dark:bg-primary-900/20 rounded">
                   {listing.listingType === 'roommate' ? 'Roommate Search' : listing.listingType === 'handover' ? 'Room Handover' : 'PG Listing'}
                 </span>
                 {!listing.isOwnerListing && <span className="text-gray-400">• Verified by Student</span>}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight leading-tight">
                {listing.pgName || listing.userId?.hostelName || 'Verified Property'}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-[15px] text-gray-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5 font-medium">
                   <MapPin className="w-4 h-4 text-gray-400" /> {listing.address || 'Location Verified'}
                </span>
                {listing.coordinates && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${listing.coordinates.lat},${listing.coordinates.lng}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:underline text-primary-600 font-semibold"
                  >
                    Google Maps <Info className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
            {isOwner && (
              <div className="flex gap-2 w-full md:w-auto">
                <Link href={`/create-listing?id=${id}`} className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 transition-colors text-center text-sm font-semibold flex items-center justify-center gap-2 text-gray-900 dark:text-white">
                  <Edit3 className="w-4 h-4" /> Edit
                </Link>
                <button onClick={handleDeleteListing} disabled={!listing.isOwnerListing && listing.reviewCount > 1} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-30">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
          
          {!isRatingPost && (
            <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center justify-between">
              <div className="flex flex-col">
                 <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                   ₹{(listing.price ?? 0).toLocaleString('en-IN')} <span className="text-lg font-normal text-gray-500">/ month</span>
                 </span>
              </div>
              {listing.isOwnerListing && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 rounded-full border border-slate-100 dark:border-slate-800">
                   <Users className="w-4 h-4 text-primary-500" />
                   <span className="text-xs font-bold text-gray-700 dark:text-slate-300">
                     {listing.availableRooms}/{listing.totalRooms} Rooms Available
                   </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Image Gallery */}
        {listing.images && listing.images.length > 0 && (
          <div className="mb-12 group">
            <div className={`grid gap-4 ${listing.images.length === 1 ? 'grid-cols-1' : listing.images.length === 2 ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
              {listing.images.map((imgUrl, index) => (
                <div 
                  key={index} 
                  onClick={() => setFullScreenImage(imgUrl)}
                  className={`relative rounded-2xl overflow-hidden bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-800 cursor-zoom-in shadow-sm transition-all duration-300 hover:shadow-xl ${listing.images!.length === 3 && index === 0 ? 'md:col-span-2 md:row-span-2 aspect-[4/3] md:aspect-auto' : 'aspect-square md:aspect-[4/3]'}`}
                >
                  <img
                    src={imgUrl}
                    alt={`Room Image ${index + 1}`}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                     <div className="bg-white/90 p-3 rounded-full shadow-lg transform scale-90 hover:scale-100 transition-transform">
                        <Maximize2 className="w-6 h-6 text-gray-900" />
                     </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full Screen Overlay */}
        {fullScreenImage && (
          <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-in fade-in" onClick={() => setFullScreenImage(null)}>
            <button className="absolute top-6 right-6 text-white hover:opacity-70 transition-opacity"><X className="w-8 h-8" /></button>
            <img src={fullScreenImage} alt="Full View" className="max-w-full max-h-full object-contain rounded-lg animate-in zoom-in-95" />
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16 pb-12">
          <div className="md:col-span-2 space-y-12">
            <div ref={mainContentRef} className="space-y-12">
              <section>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
                   <Info className="w-5 h-5 text-primary-500" /> About this place
                </h2>
                <p className="text-gray-600 dark:text-slate-300 text-[16px] leading-relaxed whitespace-pre-wrap">{listing.roomDetails}</p>
              </section>

              {/* Specs */}
              {(listing.sharingType || listing.foodIncluded || listing.billsIncluded) && (
                <section>
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
                    <Users className="w-5 h-5 text-primary-500" /> Accommodation Details
                  </h2>
                  <div className="grid grid-cols-2 gap-6">
                    {listing.genderCategory && (
                      <div className="flex items-center gap-3 text-gray-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        <Users className="w-5 h-5 text-gray-400" />
                        <span className="font-semibold capitalize text-sm">
                          {listing.genderCategory === 'both' ? 'Co-living (Both)' : `${listing.genderCategory} only`}
                        </span>
                      </div>
                    )}
                    {listing.sharingType && (
                      <div className="flex items-center gap-3 text-gray-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        <Users className="w-5 h-5 text-gray-400" />
                        <span className="font-semibold capitalize text-sm">{listing.sharingType} Sharing</span>
                      </div>
                    )}
                    {listing.foodIncluded && (
                      <div className="flex items-center gap-3 text-gray-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        <Utensils className="w-5 h-5 text-gray-400" />
                        <span className="font-semibold text-sm">Food Included</span>
                      </div>
                    )}
                    {listing.billsIncluded && (
                      <div className="flex items-center gap-3 text-gray-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        <Zap className="w-5 h-5 text-gray-400" />
                        <span className="font-semibold text-sm">Bills Included</span>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {listing.listingType === 'handover' && listing.legacyBundle && (
                  <section>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
                      <Package className="w-5 h-5 text-primary-500" /> Handover Items
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      {listing.legacyBundle.mattress && <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">✅ Mattress</div>}
                      {listing.legacyBundle.cooler && <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">✅ Cooler</div>}
                      {listing.legacyBundle.shelf && <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">✅ Shelf</div>}
                      {listing.legacyBundle.lamp && <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">✅ Lamp</div>}
                    </div>
                  </section>
              )}
            </div>

            {userProfile?.role === 'STUDENT' && !shouldMoveToSidebar && (
              <section className="pt-10 border-t border-gray-100 dark:border-slate-800">
                <CommuteDistanceModule />
              </section>
            )}
          </div>

          <div ref={sidebarRef} className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-800 shadow-sm  top-24">
              <div className="mb-6">
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Availability</h3>
                 <div className="flex items-center gap-2 text-[15px] font-bold text-gray-900 dark:text-white">
                   <Calendar className="w-4 h-4 text-primary-500" />
                   {listing.availableDate ? new Date(listing.availableDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Ready Now'}
                 </div>
              </div>
              
              <div className="pt-6 border-t border-gray-200 dark:border-slate-800">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Listed by</h3>
                <p className="text-gray-900 dark:text-white font-bold mb-1 text-[16px]">
                  {listing.isOwnerListing || listing.handoverMode || listing.listingType === 'roommate' ? listing.userId?.name || 'Verified User' : 'Anonymous Student'}
                </p>
                <div className="flex items-center gap-1.5 text-[13px] text-gray-500 dark:text-slate-400 mb-6">
                   <Clock className="w-3.5 h-3.5" /> Since {new Date(listing.createdAt).getFullYear()}
                </div>

                {token ? (
                  (listing.isOwnerListing || listing.handoverMode || listing.listingType === 'roommate') ? (
                    listing.userId?.email ? (
                      <div className="space-y-3">
                        <a href={`mailto:${listing.userId.email}`} className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary-500/20">
                          <Mail className="w-4 h-4" /> Send Email
                        </a>
                        <div className="text-[14px] space-y-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-slate-300 font-medium">
                             <Mail className="w-4 h-4 opacity-50" /> {listing.userId.email}
                          </div>
                          {listing.userId.phoneNumber && (
                             <div className="flex items-center gap-2 text-gray-600 dark:text-slate-300 font-medium">
                                <Phone className="w-4 h-4 opacity-50" /> {listing.userId.phoneNumber}
                             </div>
                          )}
                        </div>
                      </div>
                    ) : null
                  ) : (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-[13px] text-center text-gray-500 border border-dashed border-slate-200 dark:border-slate-700">
                      Identity protected for review integrity.
                    </div>
                  )
                ) : (
                  <Link href="/login" className="flex items-center justify-center gap-2 w-full py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold transition-colors">
                    <Zap className="w-4 h-4" /> Sign in to contact
                  </Link>
                )}
              </div>
            </div>

            {userProfile?.role === 'STUDENT' && shouldMoveToSidebar && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-800 shadow-sm">
                <CommuteDistanceModule />
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="pt-20">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              Reviews <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-md text-sm">{reviews.length}</span>
            </h2>
          </div>

          {canReview && (
            <form onSubmit={handleReviewSubmit} className="mb-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-white">Write a review</h3>
              <div className="flex gap-2 mb-8">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setNewReview({ ...newReview, rating: star })} className={`text-3xl transition-transform hover:scale-110 ${star <= newReview.rating ? 'text-amber-500' : 'text-slate-200'}`}><Star className={`w-8 h-8 ${star <= newReview.rating ? 'fill-current' : ''}`} /></button>
                ))}
              </div>
              <textarea required value={newReview.comment} onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })} className="w-full p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none ring-primary-500 focus:ring-2 mb-6 text-gray-900 dark:text-white" placeholder="Your experience..." rows={4} />
              <button type="submit" disabled={reviewLoading} className="bg-primary-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary-500/20 disabled:opacity-50">
                Post Review
              </button>
            </form>
          )}

          <div className="grid gap-8">
            {reviews.map((review) => (
              <div key={review._id} className="bg-white dark:bg-slate-950/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400"><Users className="w-6 h-6" /></div>
                  <div>
                    <div className="font-bold flex items-center gap-2 text-gray-900 dark:text-white">Anonymous {review.geofenceVerified && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}</div>
                    <div className="text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="flex text-amber-500 mb-3 gap-0.5">
                  {[...Array(5)].map((_, i) => (<Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'opacity-20'}`} />))}
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
