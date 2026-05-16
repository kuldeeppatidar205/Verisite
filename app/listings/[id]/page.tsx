'use client';

import { useEffect, useState, useRef, useLayoutEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { calculateDistance } from '@/lib/utils/geo';

interface Listing {
  _id: string;
  listingType: 'handover' | 'pg';
  pgName?: string;
  roomDetails: string;
  price: number;
  availableRooms?: number;
  totalRooms?: number;
  createdAt: string;
  availableDate?: string;
  address?: string;
  amenities?: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
  isOwnerListing: boolean;
  handoverMode: boolean;
  reviewCount: number;
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
  
  let colorClass = "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white";
  let badge = "";

  if (dist < 1000) {
    badge = "🚶 Walkable";
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
    <div className={`p-4 rounded-xl border animate-in fade-in slide-in-from-top-2 ${colorClass}`}>
      <div className="flex justify-between items-start mb-2">
        <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Distance</p>
        {badge && <span className="text-[10px] font-semibold uppercase px-2 py-1 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-md">{badge}</span>}
      </div>
      <p className="text-2xl font-semibold text-gray-900 dark:text-white">
        {km} km <span className="text-[15px] font-normal text-gray-500 dark:text-slate-400">away</span>
      </p>
      <div className="mt-3 space-y-1">
        <p className="text-[15px] text-gray-600 dark:text-slate-300">🛵 ~{scootyMins} mins by scooty</p>
        <p className="text-[15px] text-gray-600 dark:text-slate-300">🚌 ~{busMins} mins by bus</p>
      </div>
      <p className="text-[13px] text-gray-500 dark:text-slate-400 mt-3 line-clamp-1">{collegeName}</p>
      
      {userProfile && (!userProfile.favoriteCollege || userProfile.favoriteCollege.name !== collegeName) && (
        <button
          onClick={handleSave}
          className="mt-4 text-[15px] font-medium text-gray-900 dark:text-white hover:underline flex items-center gap-1"
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
  const [error, setError] = useState('');
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

  // Dynamic layout check
  useLayoutEffect(() => {
    const calculateLayout = () => {
      if (!loading && listing && mainContentRef.current && sidebarRef.current) {
        const mainHeight = mainContentRef.current.offsetHeight;
        const sidebarHeight = sidebarRef.current.offsetHeight;
        
        // If main content height > 50% of sidebar height, move to sidebar
        if (mainHeight > (sidebarHeight * 0.5)) {
          setShouldMoveToSidebar(true);
        } else {
          setShouldMoveToSidebar(false);
        }
      }
    };

    calculateLayout();
    
    // Optional: Re-calculate on window resize
    window.addEventListener('resize', calculateLayout);
    return () => window.removeEventListener('resize', calculateLayout);
  }, [loading, listing]); // Re-run if listing or loading state changes

  const fetchListing = async () => {
    try {
      const res = await fetch(`/api/listings/${id}`);
      const data = await res.json();
      if (!res.ok) {
        console.error('API Error:', data.error);
        setListing(null);
      } else {
        setListing(data);
      }
    } catch (error) {
      console.error('Failed to fetch listing:', error);
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
      alert('Community Ownership Rule: This listing has significant community interaction and cannot be deleted by the publisher.');
      return;
    }
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        alert('Listing deleted successfully');
        router.push('/browse');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete listing');
      }
    } catch (error) {
      console.error('Failed to delete listing:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center transition-colors duration-500">
        <div className="text-gray-400 dark:text-slate-600 animate-pulse font-medium text-lg">Loading details...</div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center transition-colors duration-500 px-4 text-center">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-4">Listing not found</h1>
        <p className="text-gray-500 dark:text-slate-400 mb-8">This room might have been taken or removed.</p>
        <Link href="/browse" className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
          Back to listings
        </Link>
      </div>
    );
  }

  const isOwner = userProfile && listing?.userId && userProfile.id === (typeof listing.userId === 'string' ? listing.userId : listing.userId._id);
  const canReview = userProfile && userProfile.role === 'STUDENT' && userProfile.verified && !isOwner;

  const CommuteDistanceModule = () => (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Commute Distance</h2>
        {autoDist && (
          <button 
            onClick={() => setShowSearch(!showSearch)} 
            className="text-[13px] font-medium text-gray-900 dark:text-white underline hover:text-primary-600 transition-colors"
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
                className="w-full px-4 py-2.5 text-[15px] bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-gray-900 dark:text-white transition disabled:opacity-50"
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
                        alert(data.error || 'College not found.');
                      }
                    } catch (err) {
                      console.error(err);
                      alert('Failed to calculate distance.');
                    } finally {
                      setDistLoading(false);
                    }
                  }
                }}
              />
              {distLoading && <div className="absolute right-3 top-3"><div className="w-4 h-4 border-2 border-gray-900 dark:border-white border-t-transparent rounded-full animate-spin"></div></div>}
            </div>
            <p className="text-[13px] text-gray-500 dark:text-slate-400 mt-2">Press Enter to search</p>
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
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold transition-transform group-hover:scale-105">
              PP
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Verisite</h1>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/browse" className="text-[15px] font-medium text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors">
              ← Back to listings
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header Section */}
        <div className="mb-8 border-b border-gray-200 dark:border-slate-800 pb-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-6">
            <div className="w-full">
              <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white mb-2 tracking-tight">
                {listing.pgName || listing.userId?.hostelName || 'Verified Property'}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-[15px] text-gray-600 dark:text-slate-400 mb-4">
                <span className="font-medium flex items-center gap-1">
                   {listing.address || 'Location Verified'}
                </span>
                {listing.coordinates && (
                  <>
                    <span>•</span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${listing.coordinates.lat},${listing.coordinates.lng}`}
                      target="_blank" rel="noopener noreferrer"
                      className="hover:underline text-gray-900 dark:text-white font-medium"
                    >
                      View on Map
                    </a>
                  </>
                )}
              </div>
            </div>
            {isOwner && (
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <Link href={`/create-listing?id=${id}`} className="flex-1 px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 font-medium transition-colors text-center text-sm">Edit Specs</Link>
                <button onClick={handleDeleteListing} disabled={!listing.isOwnerListing && listing.reviewCount > 1} className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors text-sm ${!listing.isOwnerListing && listing.reviewCount > 1 ? 'bg-gray-50 dark:bg-slate-900 text-gray-400' : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40'}`}>
                  Delete
                </button>
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center justify-between">
            <div className="flex flex-col">
               <span className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">
                 ₹{(listing.price ?? 0).toLocaleString('en-IN')} <span className="text-[15px] font-normal text-gray-500 dark:text-slate-400">month</span>
               </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-gray-100 dark:bg-slate-800 rounded-md text-xs font-medium text-gray-900 dark:text-white">
                {listing.isOwnerListing ? 'Marketplace Listing' : 'Student Verified'}
              </span>
              {listing.isOwnerListing && (
                <span className="px-3 py-1 bg-gray-100 dark:bg-slate-800 rounded-md text-xs font-medium text-gray-900 dark:text-white">
                  {listing.availableRooms}/{listing.totalRooms} Rooms Available
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16 pb-12 border-b border-gray-200 dark:border-slate-800">
          <div className="md:col-span-2 space-y-10">
            <div ref={mainContentRef} className="space-y-10">
              {/* Description */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">About this place</h2>
                <p className="text-gray-600 dark:text-slate-300 text-[15px] leading-relaxed whitespace-pre-wrap">{listing.roomDetails}</p>
              </section>

              {/* Amenities/Items */}
              {listing.listingType === 'handover' ? (
                listing.legacyBundle && (listing.legacyBundle.mattress || listing.legacyBundle.cooler || listing.legacyBundle.shelf || listing.legacyBundle.lamp || listing.legacyBundle.other) && (
                  <section>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Handover Items Included</h2>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                      {listing.legacyBundle.mattress && <div className="flex items-center gap-3 text-gray-700 dark:text-slate-300"><span className="text-xl w-6">🛏️</span> <span className="font-medium">Mattress</span></div>}
                      {listing.legacyBundle.cooler && <div className="flex items-center gap-3 text-gray-700 dark:text-slate-300"><span className="text-xl w-6">❄️</span> <span className="font-medium">Cooler</span></div>}
                      {listing.legacyBundle.shelf && <div className="flex items-center gap-3 text-gray-700 dark:text-slate-300"><span className="text-xl w-6">📦</span> <span className="font-medium">Shelf</span></div>}
                      {listing.legacyBundle.lamp && <div className="flex items-center gap-3 text-gray-700 dark:text-slate-300"><span className="text-xl w-6">💡</span> <span className="font-medium">Lamp</span></div>}
                      {listing.legacyBundle.other && <div className="col-span-2 flex items-center gap-3 text-gray-700 dark:text-slate-300"><span className="text-xl w-6">📌</span> <span className="font-medium">{listing.legacyBundle.other}</span></div>}
                    </div>
                  </section>
                )
              ) : (
                listing.amenities && listing.amenities.length > 0 && (
                  <section>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">What this place offers</h2>
                    <div className="grid grid-cols-2 gap-y-4">
                      {listing.amenities.map((amenity: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 text-gray-700 dark:text-slate-300 font-medium">✨ {amenity}</div>
                      ))}
                    </div>
                  </section>
                )
              )}
            </div>

            {/* College Distance Calculator (Horizontal Version) */}
            {userProfile?.role === 'STUDENT' && !shouldMoveToSidebar && (
            <section className="pt-4 border-t border-gray-100 dark:border-slate-800">
              <CommuteDistanceModule />
            </section>
            )}
          </div>

          {/* Sidebar */}
          <div ref={sidebarRef} className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-gray-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-2">Availability</h3>
              <p className="text-gray-600 dark:text-slate-400 font-medium mb-6 text-[15px]">
                {listing.availableDate ? new Date(listing.availableDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'TBA'}
              </p>
              
              <div className="pt-6 border-t border-gray-200 dark:border-slate-800">
                <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-2">Listed by</h3>
                <p className="text-gray-900 dark:text-white font-medium mb-1 text-[15px]">
                  {listing.isOwnerListing || listing.handoverMode ? listing.userId?.name || 'Verified User' : 'Anonymous Student'}
                </p>
                <p className="text-[13px] text-gray-500 dark:text-slate-400 mb-6">
                  Joined in {new Date(listing.createdAt).getFullYear()}
                </p>

                {token ? (
                  (listing.isOwnerListing || listing.handoverMode) ? (
                    listing.userId?.email ? (
                      <div className="space-y-3">
                        <a href={`mailto:${listing.userId.email}`} className="block w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium text-center text-[15px] transition-colors hover:bg-gray-800 dark:hover:bg-gray-100">
                          Email {listing.isOwnerListing ? 'Owner' : 'Student'}
                        </a>
                        <div className="text-[13px] space-y-2 mt-4 pt-4 border-t border-gray-200 dark:border-slate-800">
                          <p className="text-gray-500 dark:text-slate-400"><span className="font-medium text-gray-900 dark:text-white">Email:</span> {listing.userId.email}</p>
                          {listing.userId.phoneNumber && (
                            <p className="text-gray-500 dark:text-slate-400"><span className="font-medium text-gray-900 dark:text-white">Phone:</span> {listing.userId.phoneNumber}</p>
                          )}
                        </div>
                      </div>
                    ) : null
                  ) : (
                    <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg text-[13px] text-center text-gray-500 dark:text-slate-400">
                      Contact info hidden by publisher to maintain anonymity.
                    </div>
                  )
                ) : (
                  <Link href="/login" className="block w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium text-center text-[15px] transition-colors hover:bg-gray-800 dark:hover:bg-gray-100">
                    Log in to Contact
                  </Link>
                )}
              </div>
            </div>

            {/* College Distance Calculator (Sidebar Version) */}
            {userProfile?.role === 'STUDENT' && shouldMoveToSidebar && (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-gray-200 dark:border-slate-800 shadow-sm">
              <CommuteDistanceModule />
            </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="pt-12">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
            </h2>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-md">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Location Verified
            </div>
          </div>

          {canReview ? (
            <form onSubmit={handleReviewSubmit} className="mb-10 bg-gray-50 dark:bg-slate-900 rounded-xl p-6 border border-gray-200 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Leave a review</h3>
              {reviewError && <p className="text-red-500 text-sm mb-4 font-medium">{reviewError}</p>}
              <div className="mb-4">
                <label className="block text-[15px] font-medium text-gray-700 dark:text-slate-300 mb-2">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setNewReview({ ...newReview, rating: star })} className={`text-2xl focus:outline-none transition-colors ${star <= newReview.rating ? 'text-accent-amber' : 'text-gray-200 dark:text-slate-700'}`}>★</button>
                  ))}
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-[15px] font-medium text-gray-700 dark:text-slate-300 mb-2">Feedback</label>
                <textarea required value={newReview.comment} onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })} className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-gray-900 dark:text-white resize-none text-[15px]" placeholder="Share your experience..." rows={3} />
              </div>
              <button type="submit" disabled={reviewLoading} className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-[15px] font-medium hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors">
                {reviewLoading ? 'Verifying...' : 'Submit Review'}
              </button>
            </form>
          ) : userProfile?.role === 'OWNER' ? (
            <div className="mb-10 p-4 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 text-gray-500 text-[15px]">Owners cannot interact with the review system.</div>
          ) : userProfile?.role === 'STUDENT' && !userProfile.verified ? (
            <div className="mb-10 p-4 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 text-gray-500 text-[15px]">Please verify your college email to add a review.</div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review._id} className="flex flex-col">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-gray-500 dark:text-slate-400 font-semibold text-lg">
                      A
                    </div>
                    <div>
                      <div className="font-semibold text-[15px] text-gray-900 dark:text-white flex items-center gap-2">
                        Anonymous
                        {review.geofenceVerified && <span className="text-[10px] bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-medium text-gray-600 dark:text-slate-300">Verified Location</span>}
                      </div>
                      <div className="text-[13px] text-gray-500 dark:text-slate-400 mt-0.5">
                        {new Date(review.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <div className="flex text-accent-amber mb-2 text-sm">
                    {[...Array(5)].map((_, i) => (<span key={i} className={i < review.rating ? 'opacity-100' : 'opacity-20'}>★</span>))}
                  </div>
                  <p className="text-gray-700 dark:text-slate-300 text-[15px] leading-relaxed">
                    {review.comment}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-slate-400 text-[15px]">No reviews yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
