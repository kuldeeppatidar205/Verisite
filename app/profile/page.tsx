'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'OWNER' | 'GUEST';
  phoneNumber?: string;
  collegeEmail: string;
  verified: boolean;
  hostelName?: string;
  roomNumber?: string;
  studentId: string;
  idCardImageUrl?: string;
  favoriteCollege?: {
    name: string;
    lat: number;
    lng: number;
  };
  createdAt: string;
}

interface Listing {
  _id: string;
  roomDetails: string;
  price: number;
  availableDate: string;
  status: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    phoneNumber: '',
    hostelName: '',
    roomNumber: '',
    collegeName: '',
  });
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) {
      router.push('/login');
      return;
    }
    setToken(t);
    fetchProfile(t);
    fetchMyListings(t);
  }, []);

  const fetchProfile = async (authToken: string) => {
    try {
      const res = await fetch('/api/users/profile', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
        }
        return;
      }

      const data = await res.json();
      setProfile(data);
      setEditData({
        name: data.name,
        phoneNumber: data.phoneNumber || '',
        hostelName: data.hostelName || '',
        roomNumber: data.roomNumber || '',
        collegeName: data.favoriteCollege?.name || '',
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setUpdateLoading(true);

    try {
      const body: any = {
        name: editData.name,
        phoneNumber: editData.phoneNumber,
        hostelName: editData.hostelName,
        roomNumber: editData.roomNumber,
      };

      if (editData.collegeName && editData.collegeName !== profile?.favoriteCollege?.name) {
        try {
          const searchRes = await fetch(`/api/geocode/search?q=${encodeURIComponent(editData.collegeName)}`);
          const searchData = await searchRes.json();
          if (searchRes.ok && searchData.lat && searchData.lon) {
            body.favoriteCollege = {
              name: searchData.name || editData.collegeName,
              lat: searchData.lat,
              lng: searchData.lon
            };
          }
        } catch (err) {
          console.error('Geocoding error during profile update:', err);
        }
      }

      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        setProfile(data.user);
        setIsEditing(false);
        alert('Profile updated successfully');
      } else {
        alert(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('An error occurred');
    } finally {
      setUpdateLoading(false);
    }
  };

  const fetchMyListings = async (authToken: string) => {
    try {
      const res = await fetch('/api/users/listings', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        setMyListings(data);
      }
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteListing = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setMyListings(myListings.filter((l) => l._id !== id));
        alert('Listing deleted successfully');
      } else {
        alert('Failed to delete listing');
      }
    } catch (error) {
      console.error('Failed to delete listing:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('WARNING: Are you sure you want to delete your account? This will permanently remove your profile and all your listings. This action cannot be undone.')) return;

    try {
      const res = await fetch('/api/users/profile', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        alert('Account deleted successfully');
        handleLogout();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-slate-600 dark:text-slate-400 animate-pulse font-medium text-lg">Loading profile...</div>
      </div>
    );
  }

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
            <Link
              href="/browse"
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Browse
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {profile && (
          <div className="space-y-8">
            {/* Profile Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-8 transition-colors duration-200">
              <div className="flex flex-col sm:flex-row items-start justify-between mb-8 gap-6">
                <div className="flex items-center gap-6">
                   <div className="w-20 h-20 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 text-3xl font-bold">
                      {profile.name.charAt(0)}
                   </div>
                   <div>
                    <h1 className="text-3xl font-semibold text-slate-900 dark:text-white mb-2 tracking-tight">
                      {profile.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 rounded-md text-[11px] font-semibold bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                        {profile.role}
                      </span>
                      {profile.role === 'STUDENT' && (
                        <span className={`px-3 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider ${
                          profile.verified
                            ? 'bg-accent-emerald/10 text-accent-emerald'
                            : 'bg-accent-amber/10 text-accent-amber'
                        }`}>
                          {profile.verified ? '✓ Verified Student' : '⏳ Verification Pending'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full sm:w-auto px-6 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition btn-press"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-6 border-t border-slate-100 dark:border-slate-800 pt-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white transition focus:ring-2 focus:ring-primary-500/50 outline-none text-[15px]"
                        required
                      />
                    </div>

                    {profile.role === 'OWNER' && (
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={editData.phoneNumber}
                          onChange={(e) => setEditData({ ...editData, phoneNumber: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white transition focus:ring-2 focus:ring-primary-500/50 outline-none text-[15px]"
                          required
                        />
                      </div>
                    )}

                    {profile.role !== 'OWNER' && (
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                          College/University Name
                        </label>
                        <input
                          type="text"
                          value={editData.collegeName}
                          onChange={(e) => setEditData({ ...editData, collegeName: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white transition focus:ring-2 focus:ring-primary-500/50 outline-none text-[15px]"
                          required
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="submit"
                      disabled={updateLoading}
                      className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition disabled:opacity-50 shadow-lg shadow-primary-500/20 btn-press"
                    >
                      {updateLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition btn-press"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 border-t border-slate-100 dark:border-slate-800 pt-8">
                  <div className="space-y-1">
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Email
                    </h3>
                    <p className="text-[15px] text-slate-900 dark:text-white font-medium break-all">{profile.email}</p>
                  </div>

                  {profile.role === 'OWNER' && (
                    <div className="space-y-1">
                      <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        Phone Number
                      </h3>
                      <p className="text-[15px] text-slate-900 dark:text-white font-medium break-all">{profile.phoneNumber || 'Not provided'}</p>
                    </div>
                  )}

                  {profile.role === 'STUDENT' && (
                    <div className="space-y-1">
                      <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        College Email
                      </h3>
                      <p className="text-[15px] text-slate-900 dark:text-white font-medium break-all">{profile.collegeEmail}</p>
                    </div>
                  )}

                  {profile.role !== 'OWNER' && (
                    <div className="space-y-1">
                      <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        College/University
                      </h3>
                      <p className="text-[15px] text-slate-900 dark:text-white font-medium break-all">{profile.favoriteCollege?.name || 'Not provided'}</p>
                    </div>
                  )}

                  <div className="space-y-1">
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Member Since
                    </h3>
                    <p className="text-[15px] text-slate-900 dark:text-white font-medium">
                      {new Date(profile.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* My Listings */}
            {profile.role !== 'GUEST' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-8 transition-colors duration-200">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">My Listings</h2>
                  <Link
                    href="/create-listing"
                    className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-semibold text-[13px] hover:bg-slate-800 dark:hover:bg-slate-100 transition btn-press"
                  >
                    + Add New
                  </Link>
                </div>

                {myListings.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {myListings.map((listing) => (
                      <div
                        key={listing._id}
                        className="border border-slate-100 dark:border-slate-800 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                      >
                        <div className="flex-1 min-w-0 w-full">
                          <div className="flex items-center gap-3 mb-2">
                            {listing.price !== undefined && (
                              <h4 className="font-semibold text-slate-900 dark:text-white text-lg">
                                ₹{(listing.price ?? 0).toLocaleString('en-IN')}/mo
                              </h4>
                            )}
                            <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-md font-bold ${
                              listing.status === 'available'
                                ? 'bg-accent-emerald/10 text-accent-emerald'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}>
                              {listing.status}
                            </span>
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 text-[15px] line-clamp-1 mb-1">
                            {listing.roomDetails}
                          </p>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                          <Link
                            href={`/listings/${listing._id}`}
                            className="flex-1 md:flex-none px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold text-[13px] hover:bg-slate-100 dark:hover:bg-slate-700 transition text-center"
                          >
                            View
                          </Link>
                          <Link
                            href={`/create-listing?id=${listing._id}`}
                            className="flex-1 md:flex-none px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold text-[13px] hover:bg-slate-100 dark:hover:bg-slate-700 transition text-center"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDeleteListing(listing._id)}
                            className="flex-1 md:flex-none px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-semibold text-[13px] hover:bg-red-100 dark:hover:bg-red-900/30 transition btn-press"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors duration-200">
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-[15px]">No active listings found.</p>
                  </div>
                )}
              </div>
            )}

            {/* Verification Status */}
            {profile.role === 'STUDENT' && !profile.verified && (
              <div className="bg-accent-amber/5 dark:bg-accent-amber/10 border border-accent-amber/20 rounded-2xl p-6 sm:p-8 transition-colors duration-200">
                <h3 className="text-lg font-semibold text-accent-amber mb-2">
                  ⏳ Verification Required
                </h3>
                <p className="text-slate-600 dark:text-slate-300/80 mb-4 text-[15px]">
                  Check your college email (<span className="font-semibold">{profile.collegeEmail}</span>) for the verification link.
                </p>
                <div className="space-y-1 text-[13px] text-slate-500 dark:text-slate-400 font-medium">
                  <p>• Only institutional emails are accepted</p>
                  <p>• Check your spam/junk folder if missing</p>
                </div>
              </div>
            )}

            {/* Account Info */}
            <div className="bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl p-6 sm:p-8 transition-colors duration-200 border border-slate-100 dark:border-slate-800">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="flex-1 w-full">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                    Account Settings
                  </h3>
                  <p className="text-[15px] text-slate-500 dark:text-slate-400">
                    Your student identity and data are encrypted.
                  </p>
                </div>
                <div className="w-full md:w-auto">
                  <button
                    onClick={handleDeleteAccount}
                    className="w-full px-6 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition btn-press text-sm"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
