'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { ShieldCheck, CheckCircle2, Clock, Lock } from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'OWNER' | 'GUEST' | 'ADMIN';
  phoneNumber?: string;
  collegeEmail: string;
  personalEmailVerified: boolean;
  collegeEmailVerified: boolean;
  hostelName?: string;
  roomNumber?: string;
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
    email: '',
    collegeEmail: '',
    phoneNumber: '',
    hostelName: '',
    roomNumber: '',
    collegeName: '',
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeData, setUpgradeData] = useState({
    collegeEmail: '',
    collegeName: '',
  });
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState<string | null>(null);

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

      // Auto-redirect if college email is unverified (in update phase), unless bypassed via query param
      const searchParams = new URLSearchParams(window.location.search);
      if (data.collegeEmail && !data.collegeEmailVerified && !searchParams.get('bypass')) {
        router.push(`/verify-email?email=${encodeURIComponent(data.collegeEmail)}&type=college`);
        return;
      }

      setEditData({
        name: data.name,
        email: data.email,
        collegeEmail: data.collegeEmail || '',
        phoneNumber: data.phoneNumber || '',
        hostelName: data.hostelName || '',
        roomNumber: data.roomNumber || '',
        collegeName: data.favoriteCollege?.name || '',
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const handleResendVerification = async (type: 'personal' | 'college') => {
    if (!token) return;
    setResendLoading(type);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Verification OTP sent!');
        const targetEmail = type === 'college' ? (profile?.collegeEmail || '') : (profile?.email || '');
        router.push(`/verify-email?email=${encodeURIComponent(targetEmail)}&type=${type}`);
      } else {
        alert(data.error || 'Failed to resend verification OTP');
      }
    } catch (error) {
      alert('An error occurred while resending the verification OTP.');
    } finally {
      setResendLoading(null);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setUpdateLoading(true);

    try {
      const body: any = {
        name: editData.name,
        email: editData.email,
        collegeEmail: editData.collegeEmail,
        phoneNumber: editData.phoneNumber,
        hostelName: editData.hostelName,
        roomNumber: editData.roomNumber,
      };

      if (editData.collegeName && editData.collegeName !== profile?.favoriteCollege?.name) {
        // Fallback: update name, but keep existing coordinates (or use 0 if none)
        body.favoriteCollege = {
          name: editData.collegeName,
          lat: profile?.favoriteCollege?.lat ?? 0,
          lng: profile?.favoriteCollege?.lng ?? 0
        };

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
        setEditData({
          name: data.user.name,
          email: data.user.email,
          collegeEmail: data.user.collegeEmail || '',
          phoneNumber: data.user.phoneNumber || '',
          hostelName: data.user.hostelName || '',
          roomNumber: data.user.roomNumber || '',
          collegeName: data.user.favoriteCollege?.name || '',
        });
        setIsEditing(false);
        alert('Profile updated successfully');

        // If college email is unverified (in update phase), redirect to OTP page
        if (data.user.collegeEmail && !data.user.collegeEmailVerified) {
          router.push(`/verify-email?email=${encodeURIComponent(data.user.collegeEmail)}&type=college`);
        }
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

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setUpgradeLoading(true);

    try {
      const body: any = {
        collegeEmail: upgradeData.collegeEmail,
        collegeName: upgradeData.collegeName,
      };

      // Geocode college with fallback
      body.favoriteCollege = {
        name: upgradeData.collegeName,
        lat: 0,
        lng: 0
      };

      try {
        const searchRes = await fetch(`/api/geocode/search?q=${encodeURIComponent(upgradeData.collegeName)}`);
        const searchData = await searchRes.json();
        if (searchRes.ok && searchData.lat && searchData.lon) {
          body.favoriteCollege = {
            name: searchData.name || upgradeData.collegeName,
            lat: searchData.lat,
            lng: searchData.lon
          };
        }
      } catch (err) {
        console.error('Geocoding error during upgrade:', err);
      }

      const res = await fetch('/api/users/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Upgrade initiated! Please check your institutional email for the OTP.');
        // Redirect to verification page or refresh
        router.push(`/verify-email?email=${encodeURIComponent(upgradeData.collegeEmail)}&type=college`);
      } else {
        alert(data.error || 'Failed to upgrade account');
      }
    } catch (error) {
      console.error('Failed to upgrade profile:', error);
      alert('An error occurred');
    } finally {
      setUpgradeLoading(false);
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

  if (loading || !profile) {
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
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">Verisite</h1>
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle />
            <Link
              href="/browse"
              className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Browse
            </Link>
            <button
              onClick={handleLogout}
              className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        {profile && (
          <div className="space-y-6 sm:space-y-8">
            {/* Profile Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-5 sm:p-8 transition-colors duration-200">
              <div className="flex flex-col sm:flex-row items-start justify-between mb-8 gap-6">
                <div className="flex items-center gap-4 sm:gap-6">
                   <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 text-2xl sm:text-3xl font-black">
                      {profile.name.charAt(0)}
                   </div>
                   <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter uppercase">
                      {profile.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Base Role Badge */}
                      <span className="px-3 py-1 rounded-md text-[9px] font-black bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 uppercase tracking-widest border border-primary-100 dark:border-primary-900/20">
                        {profile.role === 'GUEST' ? 'STUDENT' : (profile.role === 'STUDENT' ? 'VERIFIED STUDENT' : profile.role)}
                      </span>

                      {/* Admin Access */}
                      {profile.role === 'ADMIN' && (
                        <Link 
                          href="/admin"
                          className="px-3 py-1 rounded-md text-[9px] font-black bg-brand-warning text-white uppercase tracking-widest hover:bg-amber-600 transition-colors flex items-center gap-1 shadow-lg shadow-brand-warning/20"
                        >
                          <ShieldCheck className="w-3 h-3" /> Admin Panel
                        </Link>
                      )}

                      {/* Verification Level: Personal */}
                      <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1 border ${
                        profile.personalEmailVerified
                          ? 'bg-brand-success/5 text-brand-success border-brand-success/10'
                          : 'bg-brand-warning/5 text-brand-warning border-brand-warning/10'
                      }`}>
                        {profile.personalEmailVerified ? (
                          <><CheckCircle2 className="w-3 h-3" /> Personal Email Verified</>
                        ) : (
                          <><Clock className="w-3 h-3" /> Personal Verification Pending</>
                        )}
                      </span>

                      {/* Verification Level: Institutional (Only for Student Path) */}
                      {(profile.role === 'STUDENT' || profile.role === 'ADMIN' || profile.collegeEmail) && (
                        <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1 border ${
                          profile.collegeEmailVerified
                            ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}>
                          {profile.collegeEmailVerified ? (
                            <><ShieldCheck className="w-3 h-3" /> Institutional Verified</>
                          ) : (
                            <><Lock className="w-3 h-3" /> Institutional Verification Required</>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => {
                      setEditData({
                        name: profile.name,
                        email: profile.email,
                        collegeEmail: profile.collegeEmail || '',
                        phoneNumber: profile.phoneNumber || '',
                        hostelName: profile.hostelName || '',
                        roomNumber: profile.roomNumber || '',
                        collegeName: profile.favoriteCollege?.name || '',
                      });
                      setIsEditing(true);
                    }}
                    className="w-full sm:w-auto px-6 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-6 border-t border-slate-100 dark:border-slate-800 pt-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white transition focus:ring-2 focus:ring-primary-500/50 outline-none text-sm font-medium"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
                        <span>Personal Email</span>
                        {profile.personalEmailVerified && <span className="text-emerald-500 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Verified</span>}
                      </label>
                      <input
                        type="email"
                        value={editData.email}
                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                        disabled={profile.personalEmailVerified}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white transition focus:ring-2 focus:ring-primary-500/50 outline-none text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                        required
                      />
                      {!profile.personalEmailVerified && <p className="text-[9px] font-black text-brand-warning uppercase tracking-widest ml-1">You can correct this email before verifying.</p>}
                    </div>

                    {profile.role === 'OWNER' && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={editData.phoneNumber}
                          onChange={(e) => setEditData({ ...editData, phoneNumber: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white transition focus:ring-2 focus:ring-primary-500/50 outline-none text-sm font-medium"
                          required
                        />
                      </div>
                    )}

                    {(profile.role === 'STUDENT' || profile.role === 'GUEST') && (
                      <>
                        {profile.collegeEmail && (
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
                              <span>Institutional Email</span>
                              {profile.collegeEmailVerified && <span className="text-indigo-500 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Verified</span>}
                            </label>
                            <input
                              type="email"
                              value={editData.collegeEmail}
                              onChange={(e) => setEditData({ ...editData, collegeEmail: e.target.value })}
                              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white transition focus:ring-2 focus:ring-primary-500/50 outline-none text-sm font-medium"
                            />
                            <p className="text-[9px] font-black text-brand-warning uppercase tracking-widest ml-1">
                              {profile.collegeEmailVerified 
                                ? "Note: Changing your verified college email will require re-verification." 
                                : "You can correct this email before verifying."}
                            </p>
                          </div>
                        )}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Campus/Institution
                          </label>
                          <input
                            type="text"
                            value={editData.collegeName}
                            onChange={(e) => setEditData({ ...editData, collegeName: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white transition focus:ring-2 focus:ring-primary-500/50 outline-none text-sm font-medium"
                            required
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="submit"
                      disabled={updateLoading}
                      className="flex-1 py-3.5 bg-primary-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-primary-700 transition disabled:opacity-50 shadow-lg shadow-primary-500/20 active:scale-95"
                    >
                      {updateLoading ? 'UPDATING...' : 'Save Profile Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-3.5 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-95"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 border-t border-slate-100 dark:border-slate-800 pt-8">
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Personal Email
                    </h3>
                    <p className="text-sm text-slate-900 dark:text-white font-black tracking-tight break-all uppercase">{profile.email}</p>
                  </div>

                  {profile.role === 'OWNER' && (
                    <div className="space-y-1">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Official Phone
                      </h3>
                      <p className="text-sm text-slate-900 dark:text-white font-black tracking-tight break-all">{profile.phoneNumber || 'Not provided'}</p>
                    </div>
                  )}

                  {profile.role === 'STUDENT' && (
                    <div className="space-y-1">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Institutional Email
                      </h3>
                      <p className="text-sm text-slate-900 dark:text-white font-black tracking-tight break-all uppercase">{profile.collegeEmail}</p>
                    </div>
                  )}

                  {profile.role !== 'OWNER' && (
                    <div className="space-y-1">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Campus
                      </h3>
                      <p className="text-sm text-slate-900 dark:text-white font-black tracking-tight break-all uppercase">{profile.favoriteCollege?.name || 'Not provided'}</p>
                    </div>
                  )}

                  <div className="space-y-1">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Account Tier
                    </h3>
                    <p className="text-sm text-slate-900 dark:text-white font-black uppercase tracking-tight">
                      {profile.role === 'GUEST' ? 'STUDENT' : (profile.role === 'STUDENT' ? 'VERIFIED STUDENT' : profile.role)} Since {new Date(profile.createdAt).getFullYear()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Upgrade Section for Students (GUEST role) */}
            {profile.role === 'GUEST' && (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-[2rem] p-6 sm:p-8 transition-all">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-indigo-900 dark:text-indigo-400 tracking-tighter uppercase mb-2">Upgrade to Verified Student</h2>
                    <p className="text-indigo-700/70 dark:text-indigo-300/60 text-sm font-medium">Verify your student identity to list rooms or rate accommodations.</p>
                  </div>
                  {!isUpgrading && (
                    <button 
                      onClick={() => setIsUpgrading(true)}
                      className="w-full md:w-auto px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
                    >
                      Verify Now
                    </button>
                  )}
                </div>

                {isUpgrading && (
                  <form onSubmit={handleUpgrade} className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Institutional Email</label>
                        <input
                          type="email"
                          required
                          placeholder="name@university.edu"
                          value={upgradeData.collegeEmail}
                          onChange={(e) => setUpgradeData({ ...upgradeData, collegeEmail: e.target.value })}
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/50 rounded-xl text-slate-900 dark:text-white transition focus:ring-2 focus:ring-indigo-500/50 outline-none text-sm font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Campus/Institution Name</label>
                        <input
                          type="text"
                          required
                          placeholder="Search your college..."
                          value={upgradeData.collegeName}
                          onChange={(e) => setUpgradeData({ ...upgradeData, collegeName: e.target.value })}
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/50 rounded-xl text-slate-900 dark:text-white transition focus:ring-2 focus:ring-indigo-500/50 outline-none text-sm font-medium"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="submit"
                        disabled={upgradeLoading}
                        className="flex-1 py-3.5 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 transition disabled:opacity-50 shadow-lg shadow-indigo-600/20 active:scale-95"
                      >
                        {upgradeLoading ? 'PROCESSING...' : 'Verify & Upgrade Account'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsUpgrading(false)}
                        className="flex-1 py-3.5 border border-indigo-200 dark:border-indigo-900/50 text-indigo-500 dark:text-indigo-400 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-white dark:hover:bg-slate-800 transition active:scale-95"
                      >
                        Cancel
                      </button>
                    </div>
                    <p className="text-[10px] font-black text-indigo-400/60 text-center uppercase tracking-widest">A verification link will be sent to your institutional email</p>
                  </form>
                )}
              </div>
            )}

            {/* My Listings */}
            {profile.role !== 'GUEST' && (
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-8 transition-colors duration-200">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">My Listings</h2>
                  <Link
                    href="/create-listing"
                    className="px-4 py-2 bg-primary-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 active:scale-95"
                  >
                    + Add New
                  </Link>
                </div>

                {myListings.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {myListings.map((listing) => (
                      <div
                        key={listing._id}
                        className="border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20 rounded-[1.5rem] p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-slate-200 dark:hover:border-slate-700 transition-all group"
                      >
                        <div className="flex-1 min-w-0 w-full">
                          <div className="flex items-center gap-3 mb-2">
                            {listing.price !== undefined && (
                              <h4 className="text-body text-slate-900 dark:text-white">
                                ₹{(listing.price ?? 0).toLocaleString('en-IN')}
                                <span className="text-micro text-slate-400 ml-1">/mo</span>
                              </h4>
                            )}
                            <span className={`text-[8px] uppercase tracking-[0.2em] px-2 py-0.5 rounded font-black border ${
                              listing.status === 'available'
                                ? 'bg-brand-success/5 text-brand-success border-brand-success/10'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent'
                            }`}>
                              {listing.status}
                            </span>
                          </div>
                          <p className="text-body text-slate-500 dark:text-slate-400 line-clamp-1 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                            {listing.roomDetails}
                          </p>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                          <Link
                            href={`/listings/${listing._id}`}
                            className="flex-1 md:flex-none px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-center"
                          >
                            View
                          </Link>
                          <Link
                            href={`/create-listing?id=${listing._id}`}
                            className="flex-1 md:flex-none px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-center"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDeleteListing(listing._id)}
                            className="flex-1 md:flex-none px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-red-100 transition-all active:scale-95"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-50/50 dark:bg-slate-950/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 border-dashed">
                    <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No Active Listings</p>
                  </div>
                )}
              </div>
            )}

            {/* Verification Status */}
            {(!profile.personalEmailVerified || (!profile.collegeEmailVerified && profile.collegeEmail)) && (
              <div className="bg-brand-warning/5 dark:bg-brand-warning/10 border border-brand-warning/20 rounded-[2rem] p-6 sm:p-8 transition-colors duration-200">
                <h3 className="text-sm font-black text-brand-warning mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Verification Required
                </h3>
                
                <div className="space-y-6">
                  {!profile.personalEmailVerified && (
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-white/50 dark:bg-slate-900/50 rounded-xl border border-brand-warning/10">
                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Personal Email</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{profile.email}</p>
                      </div>
                      <button
                        onClick={() => handleResendVerification('personal')}
                        disabled={resendLoading === 'personal'}
                        className="px-4 py-2 bg-brand-warning text-white rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-amber-600 transition-all disabled:opacity-50 active:scale-95"
                      >
                        {resendLoading === 'personal' ? 'Sending...' : 'Resend OTP'}
                      </button>
                    </div>
                  )}

                  {!profile.collegeEmailVerified && profile.collegeEmail && (
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-white/50 dark:bg-slate-900/50 rounded-xl border border-brand-warning/10">
                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Institutional Email</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{profile.collegeEmail}</p>
                      </div>
                      <button
                        onClick={() => handleResendVerification('college')}
                        disabled={resendLoading === 'college'}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50 active:scale-95"
                      >
                        {resendLoading === 'college' ? 'Sending...' : 'Resend OTP'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-6 space-y-2 text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">
                  <p>• Check your Spam folder if you don't see the email</p>
                  <p>• Personal verification is required for site access</p>
                  <p>• Institutional verification is required for listing rooms</p>
                </div>
              </div>
            )}

            {/* Account Settings */}
            <div className="bg-slate-100/50 dark:bg-slate-900/50 rounded-[2rem] p-6 sm:p-8 transition-colors duration-200 border border-slate-100 dark:border-slate-800">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="flex-1 w-full">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.25em] mb-2">
                    Security
                  </h3>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 tracking-tight">
                    Your student identity and data are geofenced and encrypted.
                  </p>
                </div>
                <div className="w-full md:w-auto">
                  <button
                    onClick={handleDeleteAccount}
                    className="w-full px-8 py-3 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 active:scale-95"
                  >
                    Terminate Account
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
