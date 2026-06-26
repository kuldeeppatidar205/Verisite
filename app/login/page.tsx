'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import ClientOnly from '@/components/ClientOnly';
import { LogIn, ArrowLeft } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    if (searchParams.get('verified')) {
      setSuccess('Email verified successfully! You can now login.');
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      localStorage.setItem('token', data.token);

      router.push('/browse');
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
      setLoading(false);
    }
  };

  return (
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
            Personal or College Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-slate-900 dark:text-white transition-all font-semibold text-xs shadow-inner"
            placeholder="example@gmail.com"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center ml-1">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Password
            </label>
            <Link href="/forgot-password" className="text-[10px] font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-widest hover:text-indigo-750 transition-colors">
              Forgot?
            </Link>
          </div>
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

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 backdrop-blur-md disabled:opacity-50 rounded-2xl font-black transition-all mt-4 uppercase tracking-widest text-micro btn-press cursor-pointer flex items-center justify-center gap-2"
        >
          <LogIn className="w-4 h-4" />
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-500 py-12 px-4 relative overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-20%] right-[-20%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] animate-float" />
        <div className="absolute bottom-[-20%] left-[-20%] w-[50%] h-[50%] rounded-full bg-indigo-600/5 blur-[120px] animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md animate-scale-in">
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
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight uppercase">Welcome Back</h1>
          <p className="text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">Sign in to your account</p>
        </div>

        <ClientOnly>
          <Suspense fallback={
            <div className="bg-white dark:bg-slate-900/60 rounded-3xl shadow-2xl p-8 flex items-center justify-center min-h-[300px] border border-slate-100 dark:border-slate-800/80 animate-pulse">
              <div className="text-slate-400 dark:text-slate-600 animate-pulse font-medium">Loading form...</div>
            </div>
          }>
            <LoginForm />
          </Suspense>
        </ClientOnly>

        <div className="text-center mt-8">
          <Link 
            href="/register" 
            className="text-xs text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest hover:text-slate-800 dark:hover:text-white transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Don&apos;t have an account? Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
