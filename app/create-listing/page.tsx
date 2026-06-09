'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import ClientOnly from '@/components/ClientOnly';
import ThemeToggle from '@/components/ThemeToggle';
import LocationPicker from '@/components/LocationPicker';
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  Upload, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Plus,
  Trash2,
  Lock
} from 'lucide-react';

function CreateListingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'STUDENT' | 'OWNER' | 'ADMIN' | 'GUEST'>('STUDENT');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [originalListingType, setOriginalListingType] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    pgName: '',
    roomDetails: '',
    price: '',
    availableDate: '',
    mattress: false,
    cooler: false,
    shelf: false,
    lamp: false,
    other: '',
    addressPrefix: '',
    baseAddress: '',
    amenities: '',
    lat: null as number | null,
    lng: null as number | null,
    totalRooms: '',
    availableRooms: '',
    studentListingType: 'RATING' as 'RATING' | 'HANDOVER' | 'ROOMMATE',
    sharingType: '',
    foodIncluded: false,
    billsIncluded: false,
    genderCategory: '' as 'boys' | 'girls' | 'both' | '',
    rating: 5,
    wifiRating: 0,
    foodRating: 0,
    securityRating: 0,
    behaviorRating: 0,
    backupRating: 0,
    responsivenessRating: 0,
    comment: '',
  });

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) {
      router.push('/login');
      return;
    }
    setToken(t);
    fetchUserRole(t);
    
    if (editId) {
      fetchListing(editId);
    } else {
      captureLocation();
    }
  }, []);

  const captureLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          setFormData(prev => ({
            ...prev,
            lat,
            lng
          }));

          try {
            const res = await fetch(`/api/geocode?lat=${lat}&lon=${lng}`);
            const data = await res.json();
            
            if (res.ok && data) {
              const addressParts = [];
              if (data.street) addressParts.push(data.street);
              if (data.locality && data.locality !== data.city) addressParts.push(data.locality);
              if (data.city) addressParts.push(data.city);
              if (data.state) addressParts.push(data.state);
              
              const detectedAddress = addressParts.filter(Boolean).join(', ');
              
              if (detectedAddress) {
                setFormData(prev => ({
                  ...prev,
                  baseAddress: prev.baseAddress || detectedAddress
                }));
              }
            } else {
              console.warn("Geocoding API error:", data.error);
            }
          } catch (error) {
            console.warn("Error reverse geocoding:", error);
          }
        },
        (error) => {
          console.error("Error capturing location:", error);
          setError("Location access is required to post a listing. Please enable location permissions.");
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };

  const handleMapChange = async (lat: number, lng: number) => {
    setFormData(prev => ({ ...prev, lat, lng }));
    try {
      const res = await fetch(`/api/geocode?lat=${lat}&lon=${lng}`);
      const data = await res.json();
      
      if (res.ok && data) {
        const addressParts = [];
        if (data.street) addressParts.push(data.street);
        if (data.locality && data.locality !== data.city) addressParts.push(data.locality);
        if (data.city) addressParts.push(data.city);
        if (data.state) addressParts.push(data.state);
        
        const detectedAddress = addressParts.filter(Boolean).join(', ');
        
        if (detectedAddress) {
          setFormData(prev => ({
            ...prev,
            baseAddress: detectedAddress
          }));
        }
      }
    } catch (error) {
      console.warn("Error reverse geocoding map selection:", error);
    }
  };

  const fetchUserRole = async (t: string) => {
    try {
      const res = await fetch('/api/users/me', {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (data.user) {
        const normalizedRole = data.user.role?.toUpperCase() || 'STUDENT';
        setUserRole(normalizedRole as 'STUDENT' | 'OWNER' | 'ADMIN' | 'GUEST');
      }
    } catch (error) {
      console.error('Failed to fetch user role:', error);
    }
  };

  const fetchListing = async (id: string) => {
    try {
      const res = await fetch(`/api/listings/${id}`);
      const data = await res.json();
      
      let sType: 'RATING' | 'HANDOVER' | 'ROOMMATE' = 'RATING';
      if (data.listingType === 'roommate') sType = 'ROOMMATE';
      else if (data.listingType === 'handover') sType = 'HANDOVER';
      else if (data.listingType === 'pg') sType = 'RATING';

      setFormData(prev => ({
        ...prev,
        pgName: data.pgName || '',
        roomDetails: data.roomDetails || '',
        price: data.price ? data.price.toString() : '',
        availableDate: data.availableDate ? new Date(data.availableDate).toISOString().split('T')[0] : '',
        mattress: data.legacyBundle?.mattress || false,
        cooler: data.legacyBundle?.cooler || false,
        shelf: data.legacyBundle?.shelf || false,
        lamp: data.legacyBundle?.lamp || false,
        other: data.legacyBundle?.other || '',
        addressPrefix: '',
        baseAddress: data.address || '',
        amenities: data.amenities?.join(', ') || '',
        lat: data.coordinates?.lat || null,
        lng: data.coordinates?.lng || null,
        totalRooms: data.totalRooms?.toString() || '',
        availableRooms: data.availableRooms?.toString() || '',
        studentListingType: sType,
        sharingType: data.sharingType || '',
        foodIncluded: data.foodIncluded || false,
        billsIncluded: data.billsIncluded || false,
        genderCategory: data.genderCategory || '',
        rating: 5,
        comment: '',
      }));
      setOriginalListingType(data.listingType);
      setExistingImages(data.images || []);

      // If it's a student rating, fetch the review content too
      if (data.listingType === 'pg' && userRole === 'STUDENT') {
        try {
          const reviewRes = await fetch(`/api/reviews?listingId=${id}`);
          const reviewData = await reviewRes.json();
          const myReview = reviewData.data?.find((r: any) => r.isMyReview); 
          if (myReview) {
            setFormData(prev => ({
              ...prev,
              rating: myReview.rating,
              comment: myReview.comment
            }));
          }
        } catch (e) {
          console.warn("Failed to fetch review for editing:", e);
        }
      }
    } catch (error) {
      console.error('Failed to fetch listing:', error);
      setError('Failed to load listing');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (formData.lat === null || formData.lng === null) {
      setError('Waiting for location coordinates... Please ensure location is enabled.');
      return;
    }

    setLoading(true);

    const isStudent = userRole === 'STUDENT';
    const isRating = isStudent && formData.studentListingType === 'RATING';
    
    let price: number | undefined = undefined;
    if (!isRating) {
      price = parseInt(formData.price, 10);
      if (isNaN(price)) {
        setError('Please enter a valid price');
        setLoading(false);
        return;
      }

      if (!formData.roomDetails) {
        setError('Please fill in the property details');
        setLoading(false);
        return;
      }
    } else {
      if (!formData.rating || formData.rating < 1 || formData.rating > 5) {
         setError('Please provide a valid rating between 1 and 5');
         setLoading(false);
         return;
      }
      if (!formData.comment || formData.comment.length < 5) {
         setError('Please provide a review comment of at least 5 characters');
         setLoading(false);
         return;
      }
    }

    if (userRole === 'OWNER' && !formData.availableDate) {
      setError('Available From date is required for owner listings');
      setLoading(false);
      return;
    }

    try {
      let uploadedImageUrls: string[] = [];

      // Only process images if not a rating
      if (!isRating && selectedFiles.length > 0) {
        const imageFormData = new FormData();
        selectedFiles.forEach((file) => {
          imageFormData.append('images', file);
        });

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: imageFormData,
        });

        const uploadData = await uploadRes.json();

        if (!uploadRes.ok) {
          setError(uploadData.error || 'Failed to upload images.');
          setLoading(false);
          return;
        }

        uploadedImageUrls = uploadData.urls;
      }

      const finalAddress = formData.addressPrefix 
        ? `${formData.addressPrefix.trim()}, ${formData.baseAddress}` 
        : formData.baseAddress;

      const payload: any = {
        pgName: formData.pgName,
        roomDetails: isRating ? undefined : formData.roomDetails,
        price: price,
        availableDate: formData.availableDate ? new Date(formData.availableDate).toISOString() : undefined,
        address: finalAddress,
        lat: formData.lat,
        lng: formData.lng,
        images: uploadedImageUrls.length > 0 ? uploadedImageUrls : existingImages,
        listingType: editId ? (originalListingType || 'pg') : undefined
      };

      if (userRole === 'STUDENT') {
        if (formData.studentListingType === 'HANDOVER') {
          payload.listingType = 'handover';
          payload.handoverMode = true;
          payload.legacyBundle = {
            mattress: formData.mattress,
            cooler: formData.cooler,
            shelf: formData.shelf,
            lamp: formData.lamp,
            other: formData.other || undefined,
          };
          payload.sharingType = formData.sharingType;
          payload.foodIncluded = formData.foodIncluded;
          payload.billsIncluded = formData.billsIncluded;
        } else if (formData.studentListingType === 'ROOMMATE') {
          payload.listingType = 'roommate';
          payload.handoverMode = false;
          payload.legacyBundle = {};
          payload.sharingType = formData.sharingType;
          payload.foodIncluded = formData.foodIncluded;
          payload.billsIncluded = formData.billsIncluded;
        } else {
          // RATING
          payload.listingType = 'pg';
          payload.handoverMode = false;
          payload.legacyBundle = {};
          payload.rating = formData.rating;
          payload.wifiRating = formData.wifiRating || undefined;
          payload.foodRating = formData.foodRating || undefined;
          payload.securityRating = formData.securityRating || undefined;
          payload.behaviorRating = formData.behaviorRating || undefined;
          payload.backupRating = formData.backupRating || undefined;
          payload.responsivenessRating = formData.responsivenessRating || undefined;
          payload.comment = formData.comment;
        }
      } else if (userRole === 'OWNER') {
        payload.listingType = 'pg';
        payload.address = finalAddress;
        payload.amenities = formData.amenities.split(',').map(s => s.trim()).filter(s => s !== '');
        
        const totalRooms = parseInt(formData.totalRooms);
        if (!isNaN(totalRooms)) {
          payload.totalRooms = totalRooms;
        }
        
        const availableRooms = parseInt(formData.availableRooms);
        if (!isNaN(availableRooms)) {
          payload.availableRooms = availableRooms;
        } else if (!isNaN(totalRooms)) {
          payload.availableRooms = totalRooms;
        }
      } else if (userRole === 'ADMIN' && !editId) {
         // Admins creating new listings default to PG
         payload.listingType = 'pg';
      }

      const url = editId ? `/api/listings/${editId}` : '/api/listings';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to save listing');
        setLoading(false);
        return;
      }

      router.push(`/listings/${data.listing._id}`);
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
      setLoading(false);
    }
  };

  const isRatingMode = userRole === 'STUDENT' && formData.studentListingType === 'RATING';

  if (userRole === 'GUEST') {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-8 sm:p-12 text-center transition-colors duration-200">
        <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter uppercase">Verification Required</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto font-medium">
          Only verified student or owner accounts can post listings. Verify your student identity in your profile to unlock this feature.
        </p>
        <Link 
          href="/profile"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
        >
          Go to Profile <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-8 transition-colors duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white leading-tight">
          {editId ? 'Edit Specs' : userRole === 'STUDENT' ? 'Post to Student Truth Ledger' : 'List Marketplace Property'}
        </h1>
        <div className="flex items-center gap-2 text-[10px] font-semibold px-3 py-1 bg-brand-success/10 text-brand-success rounded-full">
           <span className="w-2 h-2 bg-brand-success rounded-full animate-pulse"></span>
           {formData.lat ? 'Location Captured' : 'Capturing Location...'}
        </div>
      </div>

      <ClientOnly>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl text-red-700 dark:text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          {userRole === 'STUDENT' && (
            <div className={`flex flex-col gap-2 mb-6 ${editId ? 'opacity-60 pointer-events-none' : ''}`}>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                What kind of post are you making? {editId && <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded ml-2 font-normal text-slate-500">Locked after creation</span>}
              </label>
              <div className="flex flex-col sm:flex-row gap-4">
                <label className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.studentListingType === 'RATING' ? 'border-primary-600 bg-primary-50/50 dark:bg-primary-900/10' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}>
                  <input type="radio" name="studentListingType" value="RATING" checked={formData.studentListingType === 'RATING'} onChange={handleChange} className="hidden" disabled={!!editId} />
                  <div className="font-semibold text-slate-900 dark:text-white">Rate Current Accommodation</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Share an honest review of your PG/Hostel without any handover.</div>
                </label>
                <label className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.studentListingType === 'HANDOVER' ? 'border-primary-600 bg-primary-50/50 dark:bg-primary-900/10' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}>
                  <input type="radio" name="studentListingType" value="HANDOVER" checked={formData.studentListingType === 'HANDOVER'} onChange={handleChange} className="hidden" disabled={!!editId} />
                  <div className="font-semibold text-slate-900 dark:text-white">Handover Room</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pass your room and items to another student.</div>
                </label>
                <label className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.studentListingType === 'ROOMMATE' ? 'border-primary-600 bg-primary-50/50 dark:bg-primary-900/10' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}>
                  <input type="radio" name="studentListingType" value="ROOMMATE" checked={formData.studentListingType === 'ROOMMATE'} onChange={handleChange} className="hidden" disabled={!!editId} />
                  <div className="font-semibold text-slate-900 dark:text-white">Find Roommate</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Looking for a roommate to share your flat/room.</div>
                </label>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              PG / Hostel / Building Name *
            </label>
            <input
              type="text"
              name="pgName"
              value={formData.pgName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-900 dark:text-white text-sm"
              placeholder="e.g. Skyline PG or Raman Hostel"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Property Location *
            </label>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                name="addressPrefix"
                value={formData.addressPrefix}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-900 dark:text-white text-sm"
                placeholder="Specific details (e.g. House No., Building Name)"
              />
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-100/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                <span className="text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">Auto-captured:</span>
                <span className="text-slate-900 dark:text-white text-sm font-medium truncate">
                  {formData.baseAddress || "Waiting for location..."}
                </span>
                {formData.lat && formData.lng && (
                  <button 
                    type="button" 
                    onClick={() => {
                      if (editId && userRole === 'STUDENT') {
                        alert('Location cannot be changed after creation for student listings.');
                        return;
                      }
                      setShowMap(!showMap);
                    }}
                    className={`ml-auto text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 whitespace-nowrap ${editId && userRole === 'STUDENT' ? 'opacity-50' : ''}`}
                  >
                    {showMap ? 'Hide Map' : 'Edit on Map'}
                  </button>
                )}
              </div>
              
              {showMap && formData.lat && formData.lng && (
                <div className="mt-2 animate-in fade-in slide-in-from-top-2">
                  <LocationPicker 
                    lat={formData.lat} 
                    lng={formData.lng} 
                    onChange={handleMapChange} 
                  />
                </div>
              )}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              The base location is auto-captured based on your current coordinates. You can click "Edit on Map" to refine the exact pin location.
            </p>
          </div>

          {isRatingMode ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: 'Wi-Fi Speed & Reliability', key: 'wifiRating' },
                  { label: 'Food Quality & Menu Cycle', key: 'foodRating' },
                  { label: 'Security', key: 'securityRating' },
                  { label: 'Warden and owner behaviour', key: 'behaviorRating' },
                  { label: 'Water & Power Backup', key: 'backupRating' },
                  { label: 'Management Responsiveness', key: 'responsivenessRating' },
                ].map((field) => (
                  <div key={field.key} className="space-y-3">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {field.label}
                    </label>
                    <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, [field.key]: val }))}
                          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                            (formData as Record<string, unknown>)[field.key] === val
                              ? 'bg-primary-600 text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Overall Experience Rating *</label>
                <div className="flex max-w-sm bg-slate-100 dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, rating: val }))}
                      className={`flex-1 py-3 text-lg font-black rounded-xl transition-all ${
                        formData.rating === val
                          ? 'bg-primary-600 text-white shadow-md scale-[1.02]'
                          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Review / Feedback *</label>
                <textarea
                  name="comment"
                  value={formData.comment}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm"
                  placeholder="Share your honest experience..."
                />
              </div>

              
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Property Details * 
                </label>
                <textarea
                  name="roomDetails"
                  value={formData.roomDetails}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm"
                  placeholder={userRole === 'STUDENT' ? "Be honest about the pros and cons..." : "Highlight the best features of your property..."}
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Minimum 10 characters
                </p>
              </div>

              {userRole === 'OWNER' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Total Rooms *
                    </label>
                    <input
                      type="number"
                      name="totalRooms"
                      value={formData.totalRooms}
                      onChange={handleChange}
                      required={userRole === 'OWNER'}
                      min="1"
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-900 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Available Rooms *
                    </label>
                    <input
                      type="number"
                      name="availableRooms"
                      value={formData.availableRooms}
                      onChange={handleChange}
                      required={userRole === 'OWNER'}
                      min="0"
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-900 dark:text-white text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Monthly Rent (₹) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="1"
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-900 dark:text-white text-sm"
                  />
                </div>

                {(userRole === 'OWNER' || formData.studentListingType === 'HANDOVER' || formData.studentListingType === 'ROOMMATE') && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Available From {userRole === 'OWNER' ? '*' : '(Optional)'}
                    </label>
                    <input
                      type="date"
                      name="availableDate"
                      value={formData.availableDate}
                      onChange={handleChange}
                      required={userRole === 'OWNER'}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-900 dark:text-white text-sm"
                    />
                  </div>
                )}
              </div>

              {userRole === 'STUDENT' && (formData.studentListingType === 'HANDOVER' || formData.studentListingType === 'ROOMMATE') && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category *</label>
                    <div className="flex flex-wrap gap-3">
                      {['boys', 'girls', 'both'].map((cat) => (
                        <label 
                          key={cat}
                          className={`px-4 py-2 rounded-lg border-2 cursor-pointer transition-all text-sm font-semibold capitalize ${
                            formData.genderCategory === cat 
                              ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' 
                              : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-200'
                          }`}
                        >
                          <input 
                            type="radio" 
                            name="genderCategory" 
                            value={cat} 
                            checked={formData.genderCategory === cat} 
                            onChange={handleChange} 
                            className="hidden" 
                            required={!isRatingMode}
                          />
                          {cat === 'both' ? 'Both (Co-living)' : `${cat} Only`}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Sharing Type</label>
                    <select
                      name="sharingType"
                      value={formData.sharingType}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-900 dark:text-white text-sm"
                    >
                      <option value="">Select Sharing Type</option>
                      <option value="single">Single Sharing</option>
                      <option value="double">Double Sharing</option>
                      <option value="triple">Triple Sharing</option>
                      <option value="multiple">Multiple (3+)</option>
                    </select>
                  </div>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        name="foodIncluded"
                        checked={formData.foodIncluded}
                        onChange={handleChange}
                        className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Food Included</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        name="billsIncluded"
                        checked={formData.billsIncluded}
                        onChange={handleChange}
                        className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Bills Included (Elec, Water)</span>
                    </label>
                  </div>
                </div>
              )}

              {userRole === 'STUDENT' && formData.studentListingType === 'HANDOVER' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-widest text-[10px]">
                    Included Items (Handover)
                  </label>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <label className="flex items-center gap-3 cursor-pointer group p-3 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <input
                        type="checkbox"
                        name="mattress"
                        checked={formData.mattress}
                        onChange={handleChange}
                        className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Mattress</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group p-3 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <input
                        type="checkbox"
                        name="cooler"
                        checked={formData.cooler}
                        onChange={handleChange}
                        className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Cooler</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group p-3 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <input
                        type="checkbox"
                        name="shelf"
                        checked={formData.shelf}
                        onChange={handleChange}
                        className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Shelf</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group p-3 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <input
                        type="checkbox"
                        name="lamp"
                        checked={formData.lamp}
                        onChange={handleChange}
                        className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Lamp</span>
                    </label>
                  </div>
                  <div className="mb-8">
                    <input
                      type="text"
                      name="other"
                      value={formData.other}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-900 dark:text-white text-sm"
                      placeholder="Other items (e.g. Study table)"
                    />
                  </div>
                </div>
              )}

              {userRole === 'OWNER' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Amenities (comma separated)
                  </label>
                  <input
                    type="text"
                    name="amenities"
                    value={formData.amenities}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-900 dark:text-white text-sm"
                    placeholder="WiFi, AC, Food, Laundry"
                  />
                </div>
              )}

              {/* Image Upload Section */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mt-6">
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Room Images <span className="text-slate-400 font-normal ml-1">(Up to 3)</span>
                  </label>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="relative group">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) {
                          const files = Array.from(e.target.files);
                          if (files.length > 3) {
                            alert('Maximum 3 images allowed total.');
                            e.target.value = '';
                            return;
                          }
                          // Validation
                          for (const file of files) {
                            if (!file.type.startsWith('image/')) {
                              alert(`File "${file.name}" is not an image.`);
                              e.target.value = '';
                              return;
                            }
                            if (file.size > 5 * 1024 * 1024) {
                              alert(`File "${file.name}" exceeds the 5MB limit.`);
                              e.target.value = '';
                              return;
                            }
                          }
                          setSelectedFiles(files);
                        }
                      }}
                      className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/20 dark:file:text-primary-400 transition"
                    />
                  </div>
                  
                  {selectedFiles.length > 0 ? (
                    <div className="flex flex-wrap gap-2 items-center">
                      <div className="text-[11px] font-bold text-brand-success uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 
                        {selectedFiles.length} selected
                      </div>
                      <button 
                        type="button" 
                        onClick={() => { setSelectedFiles([]); }}
                        className="text-[10px] font-bold text-brand-danger hover:text-red-600 uppercase tracking-wider ml-auto"
                      >
                        Clear All
                      </button>
                    </div>
                  ) : existingImages.length > 0 ? (
                    <div className="text-[11px] font-bold text-primary-500 uppercase tracking-wider flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5" /> 
                      Keeping {existingImages.length} existing
                    </div>
                  ) : null}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-3 flex items-center gap-1">
                  <Upload className="w-3 h-3" /> Upload real photos to increase trust and transparency.
                </p>
              </div>
            </>
          )}

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 font-semibold transition shadow-lg shadow-primary-500/20 order-1 sm:order-2 btn-press"
            >
              {loading ? 'Saving...' : editId ? 'Update Listing' : 'Post Listing'}
            </button>
            <Link
              href="/browse"
              className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-center transition order-2 sm:order-1 btn-press"
            >
              Cancel
            </Link>
          </div>
        </form>
      </ClientOnly>
    </div>
  );
}

export default function CreateListingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 transition-colors duration-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-105">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo image short.png" alt="Verisite Logo" className="w-full h-full object-cover rounded-full" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Verisite</h1>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/browse" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              ← Back to listings
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Suspense fallback={
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-8 flex items-center justify-center min-h-100 shimmer">
            <div className="text-slate-400 dark:text-slate-600 animate-pulse font-medium">Loading form...</div>
          </div>
        }>
          <CreateListingForm />
        </Suspense>
      </div>
    </div>
  );
}
