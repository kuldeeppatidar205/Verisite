'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

interface Listing {
  _id: string;
  listingType: 'handover' | 'pg';
  roomDetails: string;
  price: number;
  availableRooms?: number;
  totalRooms?: number;
  createdAt: string;
  availableDate?: string;
  address?: string;
  amenities?: string[];
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
  };
}

interface Review {
  _id: string;
  rating: number;
  comment: string;
  geofenceVerified: boolean;
  createdAt: string;
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

  const id = params.id as string;

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
    if (t) fetchUserProfile(t);
    fetchListing();
    fetchReviews();
  }, []);

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
      const res = await fetch('/api/users/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.user) {
        setUserProfile({
          id: data.user._id,
          name: data.user.name,
          role: data.user.role,
          verified: data.user.verified,
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setReviewLoading(true);
    setReviewError('');

    // Capture location for Geofence check
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
            fetchListing(); // Refresh to update reviewCount
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
    
    // Community Ownership Rule Check
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
  const canReview = userProfile && userProfile.role === 'STUDENT' && userProfile.verified && !isOwner && !listing.isOwnerListing;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              PP
            </div>
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

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-none border border-transparent dark:border-gray-700 p-6 sm:p-8 transition-colors duration-200 mb-8">
          <div className="mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8 sm:mb-10">
              <div className="w-full">
                <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-3 sm:mb-4">
                  ₹{(listing.price ?? 0).toLocaleString('en-IN')}<span className="text-lg sm:text-xl text-gray-500 font-normal">/month</span>
                </h1>
                <p className="text-lg sm:text-2xl text-gray-600 dark:text-gray-300 flex items-center gap-2">
                  <span className="text-blue-600">📍</span>
                  {listing.isOwnerListing 
                    ? listing.address || 'Address Not Provided'
                    : listing.userId?.hostelName || 'Anonymous Location'}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest ${
                    listing.isOwnerListing 
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' 
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  }`}>
                    {listing.isOwnerListing ? 'Marketplace Listing' : 'Student Verified (Truth)'}
                  </span>
                  {listing.isOwnerListing && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                      {listing.availableRooms}/{listing.totalRooms} Rooms Available
                    </span>
                  )}
                  {listing.listingType === 'handover' && (
                     <span className="px-3 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                        Handover Opportunity
                     </span>
                  )}
                </div>
              </div>
              {isOwner && (
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <Link
                    href={`/create-listing?id=${id}`}
                    className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition shadow-lg shadow-blue-100 dark:shadow-none text-center text-sm"
                  >
                    Edit Specs
                  </Link>
                  <button
                    onClick={handleDeleteListing}
                    disabled={!listing.isOwnerListing && listing.reviewCount > 1}
                    className={`flex-1 px-6 py-2.5 rounded-xl font-bold transition text-sm ${
                      !listing.isOwnerListing && listing.reviewCount > 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/40'
                    }`}
                  >
                    {!listing.isOwnerListing && listing.reviewCount > 1 ? 'Locked (Community Owned)' : 'Delete'}
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 border-t border-gray-100 dark:border-gray-700 pt-8 sm:pt-10">
              {/* Main Details */}
              <div className="md:col-span-2 space-y-8 sm:space-y-10">
                <section>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Description</h2>
                  <p className="text-gray-700 dark:text-gray-300 text-base sm:text-lg leading-relaxed whitespace-pre-wrap">
                    {listing.roomDetails}
                  </p>
                </section>

                {/* Amenities / Handover Items */}
                {listing.listingType === 'handover' ? (
                  listing.legacyBundle && (
                    listing.legacyBundle.mattress ||
                    listing.legacyBundle.cooler ||
                    listing.legacyBundle.shelf ||
                    listing.legacyBundle.lamp ||
                    listing.legacyBundle.other
                  ) && (
                    <section>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider">Handover Items</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {listing.legacyBundle.mattress && (
                          <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl font-bold text-sm sm:text-base">
                            <span className="text-xl sm:text-2xl">🛏️</span> Mattress
                          </div>
                        )}
                        {listing.legacyBundle.cooler && (
                          <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl font-bold text-sm sm:text-base">
                            <span className="text-xl sm:text-2xl">❄️</span> Cooler
                          </div>
                        )}
                        {listing.legacyBundle.shelf && (
                          <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl font-bold text-sm sm:text-base">
                            <span className="text-xl sm:text-2xl">📦</span> Shelf
                          </div>
                        )}
                        {listing.legacyBundle.lamp && (
                          <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl font-bold text-sm sm:text-base">
                            <span className="text-xl sm:text-2xl">💡</span> Lamp
                          </div>
                        )}
                        {listing.legacyBundle.other && (
                          <div className="sm:col-span-2 flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 rounded-xl font-bold italic text-sm sm:text-base">
                            <span className="text-xl sm:text-2xl">📌</span> {listing.legacyBundle.other}
                          </div>
                        )}
                      </div>
                    </section>
                  )
                ) : (
                  listing.amenities && listing.amenities.length > 0 && (
                    <section>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider">Facilities</h3>
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        {listing.amenities.map((amenity: string, idx: number) => (
                          <div key={idx} className="px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-xl font-bold text-xs sm:text-sm">
                            ✨ {amenity}
                          </div>
                        ))}
                      </div>
                    </section>
                  )
                )}
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6 sm:space-y-8">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                  <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 sm:mb-4">Availability</h3>
                  <p className="text-gray-900 dark:text-white font-bold text-base sm:text-lg">
                    {listing.availableDate ? new Date(listing.availableDate).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }) : 'TBA'}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6">
                  <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 sm:mb-4">
                    {listing.isOwnerListing ? 'Property Owner' : 'Source'}
                  </h3>
                  <p className="text-gray-900 dark:text-white font-extrabold text-lg sm:text-xl mb-1">
                    {listing.isOwnerListing || listing.handoverMode 
                      ? listing.userId?.name || 'Verified User'
                      : 'Anonymous Student'}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-tighter">
                    {listing.isOwnerListing ? 'Verified Owner' : 'Verified Student'} • Since {new Date(listing.createdAt).toLocaleDateString()}
                  </p>
                  <div className="mt-6">
                    {token ? (
                      (listing.isOwnerListing || listing.handoverMode) ? (
                        <button className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold hover:opacity-90 transition shadow-lg dark:shadow-none text-sm">
                          Contact {listing.isOwnerListing ? 'Owner' : 'Student'}
                        </button>
                      ) : (
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-xs text-center text-gray-500 italic">
                          Contact info hidden by publisher to maintain anonymity.
                        </div>
                      )
                    ) : (
                      <Link href="/login" className="block w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-center hover:bg-blue-700 transition text-sm">
                        Login to Contact
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section - ONLY FOR STUDENT LISTINGS */}
        {!listing.isOwnerListing && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-none border border-transparent dark:border-gray-700 p-8 transition-colors duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Student Truth Ledger</h2>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                Geofence Verified
              </div>
            </div>
            
            {canReview ? (
              <form onSubmit={handleReviewSubmit} className="mb-12 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add to the Ledger</h3>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">Identity Protected</span>
                </div>
                {reviewError && <p className="text-red-500 text-sm mb-4 font-medium">{reviewError}</p>}
                
                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                        className={`text-2xl transition ${star <= newReview.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Your Observation</label>
                  <textarea
                    required
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    placeholder="Provide brutally honest feedback..."
                    rows={3}
                  />
                </div>

                <button
                  type="submit"
                  disabled={reviewLoading}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition shadow-lg shadow-blue-100 dark:shadow-none"
                >
                  {reviewLoading ? 'Verifying Proximity...' : 'Submit to Ledger'}
                </button>
              </form>
            ) : userProfile && userProfile.role === 'OWNER' ? (
              <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-500 text-sm font-medium text-center italic">
                Owners are not permitted to interact with the student rating system.
              </div>
            ) : userProfile && userProfile.role === 'STUDENT' && !userProfile.verified ? (
              <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-xl text-yellow-800 dark:text-yellow-200 text-sm font-medium text-center">
                Please verify your college email to add to the truth ledger.
              </div>
            ) : null}

            <div className="space-y-6">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review._id} className="border-b border-gray-100 dark:border-gray-700 pb-6 last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          Anonymous Student
                          {review.geofenceVerified && <span className="text-[8px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Verified @ Location</span>}
                        </span>
                        <div className="flex text-yellow-400 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={i < review.rating ? 'opacity-100' : 'opacity-20 text-gray-400'}>★</span>
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed italic">
                      "{review.comment}"
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8 italic">No verified truth entries yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
