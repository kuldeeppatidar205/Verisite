'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import ClientOnly from '@/components/ClientOnly';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const email = searchParams.get('email') || 'your college email';

  const handleResend = async () => {
    setResending(true);
    setResendStatus(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setResendStatus({ type: 'error', message: 'Please log in again to resend verification.' });
        return;
      }

      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setResendStatus({ type: 'success', message: 'Verification email resent! Check your inbox.' });
      } else {
        setResendStatus({ type: 'error', message: data.error || 'Failed to resend email.' });
      }
    } catch (err) {
      setResendStatus({ type: 'error', message: 'An error occurred. Please try again.' });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-scale-in">
      <div className="text-center mb-8 animate-slide-down">
        <Link href="/" className="flex items-center justify-center gap-2 mb-4 group">
          <div className="w-12 h-12 flex items-center justify-center transition-transform group-hover:scale-105">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo image short.png" alt="Verisite Logo" className="w-full h-full object-cover rounded-full" />
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Verisite</span>
        </Link>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white mb-2 tracking-tight">Verify Your Email</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-[15px]">We've sent a magic link to your inbox</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-8 backdrop-blur-md animate-slide-up text-center">
        <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">📧</span>
        </div>
        
        <p className="text-slate-600 dark:text-slate-300 mb-6 text-[15px] leading-relaxed">
          Please check your inbox at:
        </p>
        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 mb-8 break-all">
          <p className="text-[15px] font-semibold text-primary-600 dark:text-primary-400">{email}</p>
        </div>

        {resendStatus && (
          <div className={`mb-6 p-3 rounded-lg text-sm font-medium ${
            resendStatus.type === 'success' ? 'bg-accent-emerald/10 text-accent-emerald' : 'bg-red-50 dark:bg-red-900/20 text-red-600'
          }`}>
            {resendStatus.message}
          </div>
        )}

        <div className="space-y-4">
          <Link
            href="/login"
            className="block w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-primary-500/20 uppercase tracking-widest text-[13px] btn-press"
          >
            Go to Login
          </Link>
          
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[13px] text-slate-500 dark:text-slate-400">
              Didn't receive the email? Check your spam folder or{' '}
              <button 
                onClick={handleResend}
                disabled={resending}
                className="text-primary-600 dark:text-primary-400 font-semibold hover:underline disabled:opacity-50"
              >
                {resending ? 'Sending...' : 'click here to resend'}
              </button>
            </p>
          </div>
        </div>
      </div>

      <p className="text-center text-slate-500 dark:text-slate-400 mt-8 font-medium text-[15px]">
        Wrong email?{' '}
        <Link href="/register" className="text-primary-600 dark:text-primary-400 hover:underline font-semibold">
          Register again
        </Link>
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-500 py-12 px-4 relative overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] rounded-full bg-primary-500/10 blur-[120px] animate-float" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <ClientOnly>
        <Suspense fallback={
          <div className="text-slate-400 dark:text-slate-600 animate-pulse font-medium">Loading...</div>
        }>
          <VerifyEmailContent />
        </Suspense>
      </ClientOnly>
    </div>
  );
}
