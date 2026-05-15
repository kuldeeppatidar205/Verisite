'use client';

import { useEffect, useState } from 'react';
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
  
  let colorClass = "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400";
  let badge = "";

  if (dist < 1000) {
    colorClass = "bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800 text-green-600 dark:text-green-400";
    badge = "🚶 Walkable";
  } else if (dist > 5000) {
    colorClass = "bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800 text-orange-600 dark:text-orange-400";
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
      <div className="flex justify-between items-start mb-1">
        <p className="text-[10px] font-bold uppercase tracking-widest">Calculated Distance</p>
        {badge && <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-green-500 text-white rounded-full">{badge}</span>}
      </div>
      <p className="text-lg font-black text-gray-900 dark:text-white">
        {km} km <span className="text-xs font-normal text-gray-500 dark:text-gray-400">away</span>
      </p>
      <div className="mt-2 space-y-1">
        <p className="text-[10px] text-gray-600 dark:text-gray-300 font-medium">🛵 ~{scootyMins} mins by scooty</p>
        <p className="text-[10px] text-gray-600 dark:text-gray-300 font-medium">🚌 ~{busMins} mins by bus</p>
      </div>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 italic leading-tight line-clamp-1">{collegeName}</p>
      
      {userProfile && (!userProfile.favoriteCollege || userProfile.favoriteCollege.name !== collegeName) && (
        <button
          onClick={handleSave}
          className="mt-3 text-[9px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          ⭐ Set as my default college
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

  const id = params.id as string;

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
    if (t) fetchUserProfile(t);
    else setProfileLoading(false);
    fetchListing();
    fetchReviews();
  }, []);

  useEffect(() => {
    if (loading || profileLoading) return;

    if (listing?.coordinates && userProfile?.favoriteCollege) {
      console.log('Calculating auto-distance to:', userProfile.favoriteCollege.name);
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
      console.log('Auto-distance unavailable:', { coords: !!listing?.coordinates, fav: !!userProfile?.favoriteCollege });
      setShowSearch(true);
    }
  }, [listing, userProfile, loading, profileLoading]);

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
        console.log('Profile loaded:', data);
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
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-gray-600 dark:text-gray-400 animate-pulse font-medium">Loading details...</div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center transition-colors duration-200 px-4 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Listing not found</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">This room might have been taken or removed.</p>
        <Link href="/browse" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
          Back to listings
        </Link>
      </div>
    );
  }

  const isOwner = userProfile && listing?.userId && userProfile.id === (typeof listing.userId === 'string' ? listing.userId : listing.userId._id);
  const canReview = userProfile && userProfile.role === 'STUDENT' && userProfile.verified && !isOwner;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">PP</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">PurePG</h1>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/browse" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition">
              ← Back to listings
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-transparent dark:border-gray-700 p-6 sm:p-8 mb-8">
          <div className="mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8 sm:mb-10">
              <div className="w-full">
                <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-3 sm:mb-4">
                  ₹{(listing.price ?? 0).toLocaleString('en-IN')}<span className="text-lg sm:text-xl text-gray-500 font-normal">/month</span>
                </h1>
                <p className="text-lg sm:text-2xl text-gray-600 dark:text-gray-300 flex items-center flex-wrap gap-2">
                  <span className="text-blue-600">📍</span>
                  <span className="font-bold">{listing.pgName || listing.userId?.hostelName || 'Verified Property'}</span>
                  {listing.address && (
                    <span className="text-gray-500 dark:text-gray-400 text-sm sm:text-lg ml-1">• {listing.address}</span>
                  )}
                  {listing.coordinates && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${listing.coordinates.lat},${listing.coordinates.lng}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-xs sm:text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full font-bold hover:bg-blue-100 transition border border-blue-100 dark:border-blue-800 ml-2"
                    >
                      View on Maps
                    </a>
                  )}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest ${listing.isOwnerListing ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40'}`}>
                    {listing.isOwnerListing ? 'Marketplace Listing' : 'Student Verified (Truth)'}
                  </span>
                  {listing.isOwnerListing && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/40 rounded-full text-[10px] sm:text-xs font-bold uppercase">
                      {listing.availableRooms}/{listing.totalRooms} Rooms Available
                    </span>
                  )}
                </div>
              </div>
              {isOwner && (
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <Link href={`/create-listing?id=${id}`} className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition shadow-lg text-center text-sm">Edit Specs</Link>
                  <button onClick={handleDeleteListing} disabled={!listing.isOwnerListing && listing.reviewCount > 1} className={`flex-1 px-6 py-2.5 rounded-xl font-bold transition text-sm ${!listing.isOwnerListing && listing.reviewCount > 1 ? 'bg-gray-100 text-gray-400' : 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'}`}>
                    Delete
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 border-t border-gray-100 dark:border-gray-700 pt-8 sm:pt-10">
              <div className="md:col-span-2 space-y-8 sm:space-y-10">
                <section>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Description</h2>
                  <p className="text-gray-700 dark:text-gray-300 text-base sm:text-lg leading-relaxed whitespace-pre-wrap">{listing.roomDetails}</p>
                </section>
                {listing.listingType === 'handover' ? (
                  listing.legacyBundle && (listing.legacyBundle.mattress || listing.legacyBundle.cooler || listing.legacyBundle.shelf || listing.legacyBundle.lamp || listing.legacyBundle.other) && (
                    <section>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider">Handover Items</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {listing.legacyBundle.mattress && <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl font-bold text-sm">🛏️ Mattress</div>}
                        {listing.legacyBundle.cooler && <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl font-bold text-sm">❄️ Cooler</div>}
                        {listing.legacyBundle.shelf && <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl font-bold text-sm">📦 Shelf</div>}
                        {listing.legacyBundle.lamp && <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl font-bold text-sm">💡 Lamp</div>}
                        {listing.legacyBundle.other && <div className="sm:col-span-2 flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 rounded-xl font-bold italic text-sm">📌 {listing.legacyBundle.other}</div>}
                      </div>
                    </section>
                  )
                ) : (
                  listing.amenities && listing.amenities.length > 0 && (
                    <section>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider">Facilities</h3>
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        {listing.amenities.map((amenity: string, idx: number) => (
                          <div key={idx} className="px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-xl font-bold text-xs">✨ {amenity}</div>
                        ))}
                      </div>
                    </section>
                  )
                )}
              </div>

              <div className="space-y-6 sm:space-y-8">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Availability</h3>
                  <p className="text-gray-900 dark:text-white font-bold">{listing.availableDate ? new Date(listing.availableDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'TBA'}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{listing.isOwnerListing ? 'Property Owner' : 'Source'}</h3>
                  <p className="text-gray-900 dark:text-white font-extrabold text-lg mb-1">{listing.isOwnerListing || listing.handoverMode ? listing.userId?.name || 'Verified User' : 'Anonymous Student'}</p>
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tighter">{listing.isOwnerListing ? 'Verified Owner' : 'Verified Student'} • Since {new Date(listing.createdAt).toLocaleDateString()}</p>
                  <div className="mt-6">
                    {token ? (
                      (listing.isOwnerListing || listing.handoverMode) ? (
                        listing.userId?.email ? (
                          <div className="space-y-3">
                            <a href={`mailto:${listing.userId.email}`} className="block w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-center text-sm">Email {listing.isOwnerListing ? 'Owner' : 'Student'}</a>
                            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700 text-center space-y-2">
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Personal Email</p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white break-all">{listing.userId.email}</p>
                              </div>
                              {listing.userId.phoneNumber && (
                                <div className="pt-2 border-t border-gray-100 dark:border-gray-600">
                                  <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Phone Number</p>
                                  <p className="text-sm font-bold text-gray-900 dark:text-white">{listing.userId.phoneNumber}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : null
                      ) : (
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-xs text-center text-gray-500 italic">Contact info hidden by publisher to maintain anonymity.</div>
                      )
                    ) : (
                      <Link href="/login" className="block w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-center text-sm">Login to Contact</Link>
                    )}
                  </div>
                </div>

                {/* College Distance Calculator */}
                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Distance to College</h3>
                    {autoDist && (
                      <button 
                        onClick={() => setShowSearch(!showSearch)} 
                        className="text-[9px] font-bold text-blue-600 uppercase hover:underline"
                      >
                        {showSearch ? 'Cancel' : 'Change'}
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-4">
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
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Enter college/university name..."
                            disabled={distLoading}
                            className="w-full px-4 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition disabled:opacity-50"
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
                          {distLoading && <div className="absolute right-3 top-2.5"><div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}
                        </div>
                        <p className="text-[9px] text-gray-400 mt-2 italic">Press Enter to calculate</p>
                      </div>
                    )}

                    {searchResult && (
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
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-none border border-transparent dark:border-gray-700 p-8 transition-colors duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Student Truth Ledger</h2>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Geofence Verified
              </div>
            </div>
            {canReview ? (
              <form onSubmit={handleReviewSubmit} className="mb-12 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add to the Ledger</h3>
                  <span className="text-[10px] font-bold text-gray-400 uppercase italic">Identity Protected</span>
                </div>
                {reviewError && <p className="text-red-500 text-sm mb-4 font-medium">{reviewError}</p>}
                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setNewReview({ ...newReview, rating: star })} className={`text-2xl transition ${star <= newReview.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}>★</button>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Your Observation</label>
                  <textarea required value={newReview.comment} onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })} className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white" placeholder="Provide brutally honest feedback..." rows={3} />
                </div>
                <button type="submit" disabled={reviewLoading} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition shadow-lg">{reviewLoading ? 'Verifying Proximity...' : 'Submit to Ledger'}</button>
              </form>
            ) : userProfile?.role === 'OWNER' ? (
              <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 rounded-xl text-gray-500 text-sm font-medium text-center italic">Owners are not permitted to interact with the student rating system.</div>
            ) : userProfile?.role === 'STUDENT' && !userProfile.verified ? (
              <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-xl text-yellow-800 dark:text-yellow-200 text-sm font-medium text-center">Please verify your college email to add to the truth ledger.</div>
            ) : null}
            <div className="space-y-6">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review._id} className="border-b border-gray-100 dark:border-gray-700 pb-6 last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-bold text-gray-900 dark:text-white flex items-center gap-2">Anonymous Student {review.geofenceVerified && <span className="text-[8px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Verified @ Location</span>}</span>
                        <div className="flex text-yellow-400 mt-1">{[...Array(5)].map((_, i) => (<span key={i} className={i < review.rating ? 'opacity-100' : 'opacity-20 text-gray-400'}>★</span>))}</div>
                      </div>
                      <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed italic">"{review.comment}"</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8 italic">No verified truth entries yet.</p>
              )}
            </div>
          </div>
      </div>
    </div>
  );
}
