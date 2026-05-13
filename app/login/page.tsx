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
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      localStorage.setItem('token', data.token);
      router.push('/browse');
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl dark:shadow-none border border-gray-100 dark:border-slate-800 p-8 transition-all duration-300 backdrop-blur-sm animate-slide-up">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-2xl text-red-700 dark:text-red-400 text-sm font-bold flex items-center gap-2 animate-slide-down">
            <span>⚠️</span>
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 rounded-2xl text-green-700 dark:text-green-400 text-sm font-bold flex items-center gap-2 animate-slide-down">
            <span>✓</span>
            {success}
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-xs font-black text-gray-600 dark:text-slate-400 uppercase tracking-widest ml-1">
            📧 Personal Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white transition-all duration-200 font-medium placeholder-gray-400"
            placeholder="john@example.com"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center ml-1 gap-2">
            <label className="block text-xs font-black text-gray-600 dark:text-slate-400 uppercase tracking-widest">
              🔒 Password
            </label>
            <Link href="#" className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-tighter hover:text-primary-700 smooth-color transition-colors">
              Forgot?
            </Link>
          </div>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white transition-all duration-200 font-medium placeholder-gray-400"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-2xl font-black transition-all shadow-lg shadow-primary-500/30 hover:shadow-xl mt-6 uppercase tracking-widest text-sm btn-press disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? '⏳ Signing in...' : '✓ Sign In'}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 transition-colors duration-500 py-12 px-4 relative overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-20%] right-[-20%] w-[50%] h-[50%] rounded-full bg-primary-500/10 blur-[120px] animate-float" />
        <div className="absolute bottom-[-20%] left-[-20%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md animate-scale-in">
        <div className="text-center mb-12 animate-slide-down">
          <Link href="/" className="flex items-center justify-center gap-2 mb-6 group">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-primary-500/30 group-hover:scale-110 transition-transform">
              PP
            </div>
            <span className="text-3xl font-black text-gray-900 dark:text-white transition-colors duration-200 tracking-tighter">PurePG</span>
          </Link>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-3 transition-colors duration-200 tracking-tighter">Welcome Back</h1>
          <p className="text-gray-600 dark:text-slate-400 transition-colors duration-200 font-medium">Sign in to your account</p>
        </div>

        <ClientOnly>
          <Suspense fallback={
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 flex items-center justify-center min-h-[300px] border border-gray-100 dark:border-slate-800 shimmer">
              <div className="text-gray-600 dark:text-slate-400 animate-pulse font-medium">Loading form...</div>
            </div>
          }>
            <LoginForm />
          </Suspense>
        </ClientOnly>

        <p className="text-center text-gray-600 dark:text-slate-400 mt-8 font-medium smooth-color transition-colors">
          Don't have an account?{' '}
          <Link href="/register" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-black smooth-color transition-colors">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
