'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { 
  Users, 
  Home, 
  Star, 
  Trash2, 
  ShieldCheck, 
  ArrowLeft, 
  BarChart3,
  Search,
  ExternalLink,
  ShieldAlert,
  Loader2,
  Menu,
  X,
  Edit3
} from 'lucide-react';

interface Stats {
  users: number;
  listings: number;
  reviews: number;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  verified: boolean;
  createdAt: string;
}

interface Listing {
  _id: string;
  pgName: string;
  price: number;
  listingType: string;
  address: string;
  createdAt: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
}

interface Review {
  _id: string;
  rating: number;
  comment: string;
  createdAt: string;
  userId: {
    name: string;
    email: string;
  };
  listingId: {
    pgName: string;
  };
}

export default function AdminPanel() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'listings' | 'reviews'>('stats');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isSidebarOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    const verifyAdmin = async () => {
      try {
        const res = await fetch('/api/admin', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          router.push('/');
          return;
        }
        const data = await res.json();
        setStats(data.stats);
        setLoading(false);
      } catch (err) {
        router.push('/');
      }
    };

    verifyAdmin();
  }, [token]);

  const fetchData = async (tab: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/${tab === 'stats' ? '' : tab}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (tab === 'users') setUsers(data.data);
      if (tab === 'listings') setListings(data.data);
      if (tab === 'reviews') setReviews(data.data);
      if (tab === 'stats') setStats(data.stats);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch data');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading || activeTab !== 'stats') {
      fetchData(activeTab);
    }
  }, [activeTab]);

  const handleDelete = async (type: string, id: string) => {
    if (!confirm(`Are you sure you want to delete this ${type.slice(0, -1)}? This action is irreversible.`)) return;

    try {
      const res = await fetch(`/api/admin/${type}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Deleted successfully');
        fetchData(activeTab);
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      alert('Delete failed');
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row transition-colors duration-500">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out shadow-xl md:shadow-none`}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Admin Central</h1>
          </div>

          <nav className="flex-1 space-y-2">
            {[
              { id: 'stats', label: 'Dashboard', icon: BarChart3 },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'listings', label: 'Listings', icon: Home },
              { id: 'reviews', label: 'Reviews', icon: Star },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setIsSearchOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
             <Link href="/" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-primary-600 transition-colors">
                <ArrowLeft className="w-5 h-5" /> Back to Verisite
             </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen">
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
           <button onClick={() => setIsSearchOpen(true)} className="md:hidden p-2 text-slate-500 dark:text-slate-400">
              <Menu className="w-6 h-6" />
           </button>
           
           <div className="flex items-center gap-4 ml-auto">
             <ThemeToggle />
             <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2"></div>
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-xs font-bold text-white uppercase">AD</div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 hidden sm:block">Super Admin</span>
             </div>
           </div>
        </header>

        <div className="p-6 sm:p-10 max-w-7xl mx-auto">
          {activeTab === 'stats' && stats && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                 {[
                   { label: 'Total Users', value: stats.users, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                   { label: 'Live Listings', value: stats.listings, icon: Home, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                   { label: 'Total Reviews', value: stats.reviews, icon: Star, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                 ].map((card, i) => (
                   <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-transform hover:scale-[1.02]">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
                          <h2 className="text-4xl font-black text-slate-900 dark:text-white">{card.value}</h2>
                        </div>
                        <div className={`p-3 ${card.bg} rounded-xl ${card.color}`}>
                           <card.icon className="w-6 h-6" />
                        </div>
                      </div>
                   </div>
                 ))}
               </div>

               <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-6 flex items-start gap-4">
                  <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0" />
                  <div>
                    <h3 className="font-bold text-amber-900 dark:text-amber-400 mb-1">High Privilege Access</h3>
                    <p className="text-sm text-amber-700 dark:text-amber-500/80 leading-relaxed">
                      You are logged in as the Super Admin. You have complete control over the platform's data. Please exercise caution when deleting entities as these actions cannot be undone.
                    </p>
                  </div>
               </div>
            </div>
          )}

          {activeTab !== 'stats' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white capitalize flex items-center gap-3">
                    {activeTab} Management
                    <span className="text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded uppercase">
                      {activeTab === 'users' ? users.length : activeTab === 'listings' ? listings.length : reviews.length} Total
                    </span>
                  </h2>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder={`Search ${activeTab}...`} 
                      className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none ring-primary-500 focus:ring-2"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
               </div>

               <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    {loading ? (
                      <div className="p-20 flex justify-center"><Loader2 className="w-8 h-8 text-primary-600 animate-spin" /></div>
                    ) : (
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            {activeTab === 'users' && (
                              <>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Name</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Role</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Verified</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Joined</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Action</th>
                              </>
                            )}
                            {activeTab === 'listings' && (
                              <>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">PG Name</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Owner</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Price</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Type</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Action</th>
                              </>
                            )}
                            {activeTab === 'reviews' && (
                              <>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Property</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">User</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Rating</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Action</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {activeTab === 'users' && users && users.filter(u => 
                            (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
                          ).map((user) => (
                            <tr key={user._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-bold text-slate-900 dark:text-white">{user.name}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${
                                  user.role === 'ADMIN' ? 'bg-amber-100 text-amber-700' : 
                                  user.role === 'OWNER' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {user.role}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {user.verified ? (
                                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                ) : (
                                  <X className="w-5 h-5 text-slate-300" />
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                {new Date(user.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4">
                                <button 
                                  onClick={() => handleDelete('users', user._id)}
                                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                  disabled={user.email === 'admin@verisitee.com'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}

                          {activeTab === 'listings' && listings && listings.filter(l => 
                            (l.pgName || '').toLowerCase().includes(searchQuery.toLowerCase())
                          ).map((listing) => (
                            <tr key={listing._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                  {listing.pgName || 'Unnamed PG'}
                                  <Link href={`/listings/${listing._id}`} target="_blank" className="text-primary-600"><ExternalLink className="w-3.5 h-3.5" /></Link>
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">{listing.address}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{listing.userId?.name || 'Unknown'}</div>
                              </td>
                              <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                                ₹{(listing.price ?? 0).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 uppercase text-[10px] font-black text-slate-500">
                                {listing.listingType || 'N/A'}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <Link 
                                    href={`/create-listing?id=${listing._id}`}
                                    className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                    title="Edit Listing"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </Link>
                                  <button 
                                    onClick={() => handleDelete('listings', listing._id)} 
                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Delete Listing"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}

                          {activeTab === 'reviews' && reviews && reviews.filter(r => 
                            (r.listingId?.pgName || '').toLowerCase().includes(searchQuery.toLowerCase())
                          ).map((review) => (
                            <tr key={review._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                                {review.listingId?.pgName || 'Removed Property'}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                                {review.userId?.name || 'Anonymous'}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-1">
                                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                  <span className="font-black">{review.rating}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-500">
                                {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="px-6 py-4">
                                <button onClick={() => handleDelete('reviews', review._id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSearchOpen(false)}
        ></div>
      )}
    </div>
  );
}
