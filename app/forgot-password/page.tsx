'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ThemeToggle from '@/components/ThemeToggle';
import ClientOnly from '@/components/ClientOnly';
import { ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter">Reset Password</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Enter your email to receive a reset link</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-8 backdrop-blur-md animate-slide-up">
          {message ? (
            <div className="text-center space-y-6 py-4">
              <div className="w-16 h-16 bg-brand-success/10 text-brand-success rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Check your email</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">
                  {message}
                </p>
              </div>
              <Link href="/login" className="block w-full py-3.5 bg-primary-500/10 hover:bg-primary-500/20 text-primary-600 dark:text-primary-400 border border-primary-500/20 backdrop-blur-md rounded-xl font-black transition-all text-[10px] uppercase tracking-widest text-center">
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl text-red-700 dark:text-red-400 text-[13px] font-medium animate-slide-down">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                  Your Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-900 dark:text-white transition-all duration-200 font-medium text-sm"
                  placeholder="example@gmail.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary-500/10 hover:bg-primary-500/20 text-primary-600 dark:text-primary-400 border border-primary-500/20 backdrop-blur-md disabled:bg-slate-300 rounded-xl font-black transition-all mt-4 uppercase tracking-widest text-[10px] btn-press"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <Link href="/login" className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-500 hover:text-primary-600 transition-colors uppercase tracking-widest">
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
