'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import ClientOnly from '@/components/ClientOnly';
import { UserPlus, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'GUEST' as 'GUEST' | 'OWNER',
    phoneNumber: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      if (formData.role === 'OWNER') {
        payload.phoneNumber = formData.phoneNumber;
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      if (res.ok) {
        router.push(`/verify-email?email=${encodeURIComponent(formData.email)}&type=personal`);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-500 py-12 px-4 relative overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] animate-float" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] rounded-full bg-indigo-600/5 blur-[120px] animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-xl animate-scale-in">
        <div className="text-center mb-8">
          <Link href="/" className="flex items-center justify-center gap-2.5 mb-6 group">
            <div className="relative w-10 h-10 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 overflow-hidden rounded-xl border border-gray-200/50 dark:border-slate-800">
              <Image 
                src="/logo image short.png" 
                alt="Verisite Logo" 
                fill
                priority
                sizes="40px"
                className="object-cover" 
              />
            </div>
            <span className="text-lg font-black text-slate-900 dark:text-white tracking-tighter uppercase">Verisite</span>
          </Link>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight uppercase">Create Account</h1>
          <p className="text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">Join the verified community</p>
        </div>

        <div className="bg-white dark:bg-slate-900/60 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800/80 p-6 sm:p-8 backdrop-blur-lg animate-slide-up">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-bold text-center">
                {error}
              </div>
            )}
            {success && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xs font-bold text-center">
                {success}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                Select Your Role
              </label>
              <div className="flex bg-slate-100/50 dark:bg-slate-950 p-1.5 rounded-2xl gap-1.5 border border-slate-200/20 dark:border-slate-800/60">
                {['GUEST', 'OWNER'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setFormData({ ...formData, role: r as any })}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                      formData.role === r
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/50 dark:border-slate-700/50'
                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350'
                    }`}
                  >
                    {r === 'GUEST' ? 'Student' : 'PG Owner'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-slate-900 dark:text-white transition-all font-semibold text-xs shadow-inner"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                  Email (@gmail.com only)
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  pattern=".*@gmail\.com$"
                  title="Only @gmail.com emails are allowed"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-slate-900 dark:text-white transition-all font-semibold text-xs shadow-inner"
                  placeholder="john@gmail.com"
                />
              </div>
            </div>

            {formData.role === 'OWNER' && (
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                  Phone Number (for contact)
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-slate-900 dark:text-white transition-all font-semibold text-xs shadow-inner"
                  placeholder="+91 98765 43210"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-slate-900 dark:text-white transition-all font-semibold text-xs shadow-inner"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-slate-900 dark:text-white transition-all font-semibold text-xs shadow-inner"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 backdrop-blur-md disabled:opacity-50 rounded-2xl font-black transition-all mt-4 uppercase tracking-widest text-micro btn-press cursor-pointer flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        <div className="text-center mt-8">
          <Link 
            href="/login" 
            className="text-xs text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest hover:text-slate-800 dark:hover:text-white transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Already have an account? Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
