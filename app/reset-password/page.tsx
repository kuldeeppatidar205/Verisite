'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import ClientOnly from '@/components/ClientOnly';
import { CheckCircle2, Eye, EyeOff } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl text-red-700 dark:text-red-400 text-sm font-medium">
          Invalid reset link. Please request a new one.
        </div>
        <Link href="/forgot-password" className="block text-primary-600 dark:text-primary-400 font-bold uppercase tracking-widest text-xs">
          Request new link
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-8 backdrop-blur-md animate-slide-up">
      {message ? (
        <div className="text-center space-y-6 py-4">
          <div className="w-16 h-16 bg-brand-success/10 text-brand-success rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Success!</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              {message} Redirecting to login...
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl text-red-700 dark:text-red-400 text-[13px] font-medium animate-slide-down">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-900 dark:text-white transition-all duration-200 font-medium text-[15px]"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
              Confirm Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-900 dark:text-white transition-all duration-200 font-medium text-[15px]"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary-500/10 hover:bg-primary-500/20 text-primary-600 dark:text-primary-400 border border-primary-500/20 backdrop-blur-md disabled:bg-slate-300 rounded-xl font-semibold transition-all mt-4 uppercase tracking-widest text-[13px] btn-press"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
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
            <div className="relative w-12 h-12 flex items-center justify-center transition-transform group-hover:scale-105 overflow-hidden rounded-full border border-gray-200/50 dark:border-slate-800">
              <Image 
                src="/logo image short.png" 
                alt="Verisite Logo" 
                fill
                priority
                sizes="48px"
                className="object-cover" 
              />
            </div>
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Verisite</span>
          </Link>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter">Set New Password</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Create a strong password for your account</p>
        </div>

        <ClientOnly>
          <Suspense fallback={
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-8 flex items-center justify-center min-h-[300px] border border-slate-100 dark:border-slate-800 shimmer">
              <div className="text-slate-400 dark:text-slate-600 animate-pulse font-medium">Loading...</div>
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>
        </ClientOnly>
      </div>
    </div>
  );
}
