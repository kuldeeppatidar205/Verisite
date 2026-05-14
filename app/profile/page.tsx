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
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editData),
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
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-gray-600 dark:text-gray-400 animate-pulse font-medium text-lg">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm sm:text-base">
              PP
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">PurePG</h1>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <Link
              href="/browse"
              className="px-2 sm:px-4 py-2 text-sm sm:text-base text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
            >
              Browse
            </Link>
            <button
              onClick={handleLogout}
              className="px-2 sm:px-4 py-2 text-sm sm:text-base text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {profile && (
          <div className="space-y-6 sm:space-y-8">
            {/* Profile Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-none border border-transparent dark:border-gray-700 p-5 sm:p-8 transition-colors duration-200">
              <div className="flex flex-col sm:flex-row items-start justify-between mb-6 sm:mb-8 gap-4">
                <div>
                  <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 wrap-break-word">
                    {profile.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 uppercase tracking-widest">
                      {profile.role}
                    </span>
                    {profile.role === 'STUDENT' && (
                      <span className={`px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest ${
                        profile.verified
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                      }`}>
                        {profile.verified ? '✓ Verified' : '⏳ Pending'}
                      </span>
                    )}
                  </div>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl font-bold text-sm hover:bg-blue-100 transition"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-6 border-t border-gray-100 dark:border-gray-700 pt-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white transition focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={editData.phoneNumber}
                        onChange={(e) => setEditData({ ...editData, phoneNumber: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white transition focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                      />
                    </div>

                    {profile.role === 'STUDENT' && (
                      <>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Hostel Name
                          </label>
                          <input
                            type="text"
                            value={editData.hostelName}
                            onChange={(e) => setEditData({ ...editData, hostelName: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white transition focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Room Number
                          </label>
                          <input
                            type="text"
                            value={editData.roomNumber}
                            onChange={(e) => setEditData({ ...editData, roomNumber: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white transition focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-gray-50 dark:border-gray-700/50">
                    <button
                      type="submit"
                      disabled={updateLoading}
                      className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50 shadow-lg shadow-blue-500/20"
                    >
                      {updateLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 border-t border-gray-100 dark:border-gray-700 pt-6 sm:pt-8">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Email
                    </h3>
                    <p className="text-gray-900 dark:text-white font-medium break-all">{profile.email}</p>
                    <p className="text-[9px] text-gray-400 font-medium uppercase tracking-tighter">Cannot be changed</p>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Phone Number
                    </h3>
                    <p className="text-gray-900 dark:text-white font-medium break-all">{profile.phoneNumber || 'Not provided'}</p>
                  </div>

                  {profile.role === 'STUDENT' && (
                    <>
                      <div className="space-y-1">
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          College Email
                        </h3>
                        <p className="text-gray-900 dark:text-white font-medium break-all">{profile.collegeEmail}</p>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Student ID
                        </h3>
                        <p className="text-gray-900 dark:text-white font-medium break-all">{profile.studentId}</p>
                      </div>
                    </>
                  )}

                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Member Since
                    </h3>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {new Date(profile.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  {profile.role === 'STUDENT' && profile.hostelName && (
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Hostel Name
                      </h3>
                      <p className="text-gray-900 dark:text-white font-medium">{profile.hostelName}</p>
                    </div>
                  )}

                  {profile.role === 'STUDENT' && profile.roomNumber && (
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Room Number
                      </h3>
                      <p className="text-gray-900 dark:text-white font-medium">{profile.roomNumber}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* My Listings */}
            {profile.role !== 'GUEST' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-none border border-transparent dark:border-gray-700 p-5 sm:p-8 transition-colors duration-200">
                <div className="flex justify-between items-center mb-6 sm:mb-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">My Listings</h2>
                  <Link
                    href="/create-listing"
                    className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-xs sm:text-sm transition shadow-md shadow-blue-100 dark:shadow-none"
                  >
                    + Add New
                  </Link>
                </div>

                {myListings.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {myListings.map((listing) => (
                      <div
                        key={listing._id}
                        className="border border-gray-100 dark:border-gray-700 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 hover:border-gray-200 dark:hover:border-gray-600 transition"
                      >
                        <div className="flex-1 min-w-0 w-full">
                          <div className="flex items-center justify-between sm:justify-start gap-3 mb-2">
                            <h4 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg">
                              ₹{(listing.price ?? 0).toLocaleString('en-IN')}/mo
                            </h4>
                            <span className={`text-[9px] sm:text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-bold ${
                              listing.status === 'available'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}>
                              {listing.status}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm line-clamp-2 mb-1 italic">
                            "{listing.roomDetails}"
                          </p>
                          <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                            📅 {new Date(listing.availableDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2 sm:gap-3 w-full md:w-auto">
                          <Link
                            href={`/listings/${listing._id}`}
                            className="flex-1 md:flex-none px-3 sm:px-4 py-2 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 text-xs sm:text-sm font-bold transition text-center"
                          >
                            View
                          </Link>
                          <Link
                            href={`/create-listing?id=${listing._id}`}
                            className="flex-1 md:flex-none px-3 sm:px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 text-xs sm:text-sm font-bold transition text-center"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDeleteListing(listing._id)}
                            className="flex-1 md:flex-none px-3 sm:px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 text-xs sm:text-sm font-bold transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 sm:py-12 bg-gray-50 dark:bg-gray-900/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 transition-colors duration-200">
                    <p className="text-gray-500 dark:text-gray-400 font-medium text-sm sm:text-base">No active room listings found.</p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className={`grid grid-cols-1 ${profile.role === 'GUEST' ? 'md:grid-cols-1' : 'md:grid-cols-2'} gap-4 sm:gap-6`}>
              <Link
                href="/browse"
                className="block p-6 sm:p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-none border border-transparent dark:border-gray-700 hover:shadow-md dark:hover:border-gray-600 transition text-center group"
              >
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform">🏠</div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                  Browse Rooms
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Find available rooms across campus</p>
              </Link>

              {profile.role !== 'GUEST' && (
                <Link
                  href="/create-listing"
                  className="block p-6 sm:p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-none border border-transparent dark:border-gray-700 hover:shadow-md dark:hover:border-gray-600 transition text-center group"
                >
                  <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform">✍️</div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                    Post a Room
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">List your room for handover instantly</p>
                </Link>
              )}
            </div>

            {/* Verification Status */}
            {profile.role === 'STUDENT' && !profile.verified && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800/50 rounded-2xl p-6 sm:p-8 transition-colors duration-200">
                <h3 className="text-lg sm:text-xl font-bold text-yellow-900 dark:text-yellow-400 mb-2 sm:mb-3">
                  ⏳ Verification Required
                </h3>
                <p className="text-yellow-800 dark:text-yellow-300/80 mb-4 sm:mb-6 text-sm sm:text-base">
                  Check your college email (**{profile.collegeEmail}**) for the verification link. You can't post rooms until verified.
                </p>
                <div className="space-y-2 text-[11px] sm:text-sm text-yellow-700 dark:text-yellow-400/70 font-medium">
                  <p>• Only institutional emails are accepted</p>
                  <p>• Check your spam/junk folder if missing</p>
                  <p>• Links expire after 24 hours</p>
                </div>
              </div>
            )}

            {/* Account Info */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-none border border-transparent dark:border-gray-700 p-6 sm:p-8 transition-colors duration-200">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 sm:gap-8">
                <div className="flex-1 w-full">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                    Account Control Center
                  </h3>
                  <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                    <p>
                      <strong>Access Level:</strong> {profile.role}
                    </p>
                    <p>
                      <strong>Privacy:</strong> Your data is protected and visible only to verified users.
                    </p>
                  </div>
                </div>
                <div className="w-full md:w-auto flex flex-col items-center">
                  <button
                    onClick={handleDeleteAccount}
                    className="w-full px-6 sm:px-8 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold transition shadow-lg shadow-red-100 dark:shadow-none text-xs sm:text-sm"
                  >
                    Delete My Account
                  </button>
                  <p className="text-[9px] sm:text-[10px] text-red-400 dark:text-red-500/60 mt-3 font-bold uppercase tracking-widest">
                    Permanent Deletion
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
