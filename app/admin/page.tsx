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
  Edit3,
  Clock
} from 'lucide-react';

interface Stats {
  users: number;
  listings: number;
  reviews: number;
  reports: number;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  personalEmailVerified: boolean;
  collegeEmailVerified: boolean;
  collegeEmail?: string;
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

interface Report {
  _id: string;
  reporterId: {
    name: string;
    email: string;
  };
  reviewId: {
    _id: string;
    comment: string;
    userId: {
      name: string;
      email: string;
    };
  };
  reason: string;
  status: string;
  createdAt: string;
}

export default function AdminPanel() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'listings' | 'reviews' | 'reports'>('stats');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
      if (tab === 'reports') setReports(data.data);
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
        <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row transition-colors duration-500">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out shadow-xl md:shadow-none`}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">Admin Central</h1>
          </div>

          <nav className="flex-1 space-y-2">
            {[
              { id: 'stats', label: 'Dashboard', icon: BarChart3 },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'listings', label: 'Listings', icon: Home },
              { id: 'reviews', label: 'Reviews', icon: Star },
              { id: 'reports', label: 'Reports', icon: ShieldAlert },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                  activeTab === tab.id 
                    ? 'bg-brand-primary/15 text-brand-primary border-brand-primary/20 backdrop-blur-sm' 
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
             <Link href="/" className="flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:text-brand-primary transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Verisite
             </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen">
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
           <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-slate-500 dark:text-slate-400">
              <Menu className="w-6 h-6" />
           </button>
           
           <div className="flex items-center gap-4 ml-auto">
             <ThemeToggle />
             <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2"></div>
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-warning flex items-center justify-center text-[10px] font-black text-white uppercase">AD</div>
                <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest hidden sm:block">Super Admin</span>
             </div>
           </div>
        </header>

        <div className="p-6 sm:p-10 max-w-7xl mx-auto">
          {activeTab === 'stats' && stats && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                 {[
                   { label: 'Users', value: stats.users, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                   { label: 'Listings', value: stats.listings, icon: Home, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                   { label: 'Reviews', value: stats.reviews, icon: Star, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                   { label: 'Reports', value: stats.reports, icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
                 ].map((card, i) => (
                   <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-4xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:scale-[1.02] hover:shadow-xl">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-2">{card.label}</p>
                          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{card.value}</h2>
                        </div>
                        <div className={`p-3 ${card.bg} rounded-2xl ${card.color}`}>
                           <card.icon className="w-6 h-6" />
                        </div>
                      </div>
                   </div>
                 ))}
               </div>

               <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-4xl p-6 flex items-start gap-4">
                  <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xs font-black text-amber-900 dark:text-amber-400 uppercase tracking-widest mb-1">Administrative Privilege</h3>
                    <p className="text-sm font-medium text-amber-800/80 dark:text-brand-warning/80 leading-relaxed">
                      You are in full control of the Verisite platform. Exercise caution when performing destructive actions.
                    </p>
                  </div>
               </div>
            </div>
          )}

          {activeTab !== 'stats' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white capitalize flex items-center gap-3 tracking-tight">
                      {activeTab} Management
                    </h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                      {activeTab === 'users' ? users.length : activeTab === 'listings' ? listings.length : activeTab === 'reviews' ? reviews.length : reports.length} Total Records
                    </p>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder={`Search by name or email...`} 
                      className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium outline-none ring-brand-primary focus:ring-2 shadow-xs transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
               </div>

               <div className="bg-white dark:bg-slate-900 rounded-4xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    {loading ? (
                      <div className="p-20 flex justify-center"><Loader2 className="w-8 h-8 text-brand-primary animate-spin" /></div>
                    ) : (
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                          <tr>
                            {activeTab === 'users' && (
                              <>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">User Identity</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Personal</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Institutional</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                              </>
                            )}
                            {activeTab === 'listings' && (
                              <>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Property Details</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Owner</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Pricing</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                              </>
                            )}
                            {activeTab === 'reviews' && (
                              <>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Property</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reviewer</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Rating</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                              </>
                            )}
                            {activeTab === 'reports' && (
                              <>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Report Detail</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reporter</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {activeTab === 'users' && users && users.filter(u => 
                            (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
                          ).map((user) => (
                            <tr key={user._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-bold text-slate-900 dark:text-white text-sm">{user.name}</div>
                                <div className="text-[11px] font-medium text-slate-400 mt-0.5">{user.email}</div>
                                {user.collegeEmail && (
                                  <div className="text-[9px] font-black text-indigo-500 mt-1 uppercase tracking-tighter">🎓 {user.collegeEmail}</div>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${
                                  user.role === 'ADMIN' ? 'bg-amber-100 text-amber-700' : 
                                  user.role === 'OWNER' ? 'bg-blue-100 text-blue-700' : 
                                  user.role === 'STUDENT' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {user.role === 'STUDENT' 
                                    ? (user.collegeEmailVerified ? 'VERIFIED STUDENT' : 'STUDENT (UNVERIFIED)') 
                                    : user.role}
                                </span>
                              </td>
                              {/* Personal Verification Column */}
                              <td className="px-6 py-4 text-center">
                                <div className="flex flex-col items-center justify-center gap-1">
                                  {user.personalEmailVerified ? (
                                    <>
                                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                      <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-tighter">Verified</span>
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-4 h-4 text-slate-300" />
                                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Pending</span>
                                    </>
                                  )}
                                </div>
                              </td>
                              {/* Institutional Verification Column */}
                              <td className="px-6 py-4 text-center">
                                <div className="flex flex-col items-center justify-center gap-1">
                                  {(user.role === 'STUDENT' || user.collegeEmail) ? (
                                    user.collegeEmailVerified ? (
                                      <>
                                        <ShieldCheck className="w-4 h-4 text-indigo-500" />
                                        <span className="text-[8px] font-bold text-indigo-600 uppercase tracking-tighter">Verified</span>
                                      </>
                                    ) : (
                                      <>
                                        <Clock className="w-4 h-4 text-amber-400" />
                                        <span className="text-[8px] font-bold text-amber-500 uppercase tracking-tighter">Pending</span>
                                      </>
                                    )
                                  ) : (
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">N/A</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button 
                                  onClick={() => handleDelete('users', user._id)}
                                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
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
                            <tr key={listing._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                  {listing.pgName || 'Unnamed PG'}
                                  <Link href={`/listings/${listing._id}`} target="_blank" className="text-brand-primary hover:text-brand-hover"><ExternalLink className="w-3.5 h-3.5" /></Link>
                                </div>
                                <div className="text-[11px] font-medium text-slate-400 mt-0.5 truncate max-w-50">{listing.address}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-[13px] font-bold text-slate-600 dark:text-slate-400">{listing.userId?.name || 'Unknown'}</div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="text-body text-slate-900 dark:text-white">₹{(listing.price ?? 0).toLocaleString()}</div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded">
                                  {listing.listingType || 'N/A'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Link 
                                    href={`/create-listing?id=${listing._id}`}
                                    className="p-2 text-brand-primary hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-colors"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </Link>
                                  <button onClick={() => handleDelete('listings', listing._id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}

                          {activeTab === 'reviews' && reviews && reviews.filter(r => 
                            (r.listingId?.pgName || '').toLowerCase().includes(searchQuery.toLowerCase())
                          ).map((review) => (
                            <tr key={review._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-6 py-4 font-bold text-slate-900 dark:text-white text-sm">
                                {review.listingId?.pgName || 'Removed Property'}
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-[13px] font-bold text-slate-600 dark:text-slate-400">{review.userId?.name || 'Anonymous'}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-1.5 bg-amber-50 dark:bg-amber-900/10 py-1 rounded-lg border border-amber-100 dark:border-amber-900/20">
                                  <Star className="w-3 h-3 fill-brand-warning text-brand-warning" />
                                  <span className="text-xs font-black text-amber-700 dark:text-amber-400">{review.rating}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-[13px] font-medium text-slate-500">
                                {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button onClick={() => handleDelete('reviews', review._id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}

                          {activeTab === 'reports' && reports && reports.map((report) => (
                            <tr key={report._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-bold text-slate-900 dark:text-white text-sm">Reason: {report.reason}</div>
                                <div className="text-[11px] font-medium text-slate-500 mt-1 italic">
                                  Review: "{report.reviewId?.comment}"
                                  <div className="text-slate-400 mt-0.5">by {report.reviewId?.userId?.name}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-[13px] font-bold text-slate-600 dark:text-slate-400">{report.reporterId?.name}</div>
                                <div className="text-[10px] text-slate-400">{report.reporterId?.email}</div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                                  report.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                                  report.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {report.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-[13px] font-medium text-slate-500">
                                {new Date(report.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button 
                                    onClick={() => handleDelete('reviews', report.reviewId._id)}
                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                    title="Delete Reported Review"
                                  >
                                    <ShieldAlert className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleDelete('reports', report._id)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
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
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
