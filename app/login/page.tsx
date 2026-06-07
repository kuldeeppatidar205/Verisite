'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import ClientOnly from '@/components/ClientOnly';

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
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-8 backdrop-blur-md animate-slide-up">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl text-red-700 dark:text-red-400 text-[13px] font-medium animate-slide-down">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-brand-success/10 border border-brand-success/20 rounded-xl text-brand-success text-[13px] font-medium animate-slide-down">
            {success}
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
            Personal Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-900 dark:text-white transition-all duration-200 font-medium text-sm"
            placeholder="example.gmail.com"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center ml-1">
            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Password
            </label>
            <Link href="/forgot-password" className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest hover:text-primary-700 transition-colors">
              Forgot?
            </Link>
          </div>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-900 dark:text-white transition-all duration-200 font-medium text-sm"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white rounded-xl font-black transition-all shadow-lg shadow-primary-500/20 mt-4 uppercase tracking-widest text-[10px] btn-press"
        >
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
        <div className="absolute top-[-20%] right-[-20%] w-[50%] h-[50%] rounded-full bg-primary-500/10 blur-[120px] animate-float" />
        <div className="absolute bottom-[-20%] left-[-20%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md animate-scale-in">
        <div className="text-center mb-8 animate-slide-down">
          <Link href="/" className="flex items-center justify-center gap-2 mb-4 group">
            <div className="w-12 h-12 flex items-center justify-center transition-transform group-hover:scale-105">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo image short.png" alt="Verisite Logo" className="w-full h-full object-cover rounded-full" />
            </div>
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Verisite</span>
          </Link>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter">Welcome Back</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Sign in to your account</p>
        </div>

        <ClientOnly>
          <Suspense fallback={
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-8 flex items-center justify-center min-h-[300px] border border-slate-100 dark:border-slate-800 shimmer">
              <div className="text-slate-400 dark:text-slate-600 animate-pulse font-medium">Loading form...</div>
            </div>
          }>
            <LoginForm />
          </Suspense>
        </ClientOnly>

        <p className="text-center text-slate-500 dark:text-slate-400 mt-8 font-medium text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-primary-600 dark:text-primary-400 hover:underline font-black uppercase tracking-widest text-[10px]">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
