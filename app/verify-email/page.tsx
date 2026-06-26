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
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  const email = searchParams.get('email') || 'your college email';
  const type = searchParams.get('type') || 'personal';

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
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ type })
      });
      const data = await res.json();
      if (res.ok) {
        setResendStatus({ type: 'success', message: 'Verification OTP resent! Check your inbox.' });
      } else {
        setResendStatus({ type: 'error', message: data.error || 'Failed to resend OTP.' });
      }
    } catch (err) {
      setResendStatus({ type: 'error', message: 'An error occurred. Please try again.' });
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setVerifyStatus({ type: 'error', message: 'Please enter a 6-digit OTP code.' });
      return;
    }
    setVerifying(true);
    setVerifyStatus(null);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, type })
      });
      const data = await res.json();
      if (res.ok) {
        setVerifyStatus({ type: 'success', message: 'Email verified successfully! Redirecting...' });
        
        // If a new token is returned, store it
        if (data.token) {
          localStorage.setItem('token', data.token);
        }

        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        setVerifyStatus({ type: 'error', message: data.error || 'Verification failed. Please check the code and try again.' });
      }
    } catch (err) {
      setVerifyStatus({ type: 'error', message: 'An error occurred. Please try again.' });
    } finally {
      setVerifying(false);
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
        <p className="text-slate-500 dark:text-slate-400 font-medium text-[15px]">We've sent a 6-digit OTP to your inbox</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-8 backdrop-blur-md animate-slide-up">
        <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">🔑</span>
        </div>
        
        <p className="text-slate-600 dark:text-slate-300 mb-4 text-[15px] leading-relaxed text-center">
          Enter the verification code sent to:
        </p>
        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 mb-6 break-all text-center">
          <p className="text-[15px] font-semibold text-primary-600 dark:text-primary-400">{email}</p>
        </div>

        {verifyStatus && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-medium text-center ${
            verifyStatus.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30' : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30'
          }`}>
            {verifyStatus.message}
          </div>
        )}

        {resendStatus && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-medium text-center ${
            resendStatus.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30' : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30'
          }`}>
            {resendStatus.message}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <label htmlFor="otp" className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 text-center">
              Verification Code (OTP)
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setOtp(val);
                setVerifyStatus(null);
                setResendStatus(null);
              }}
              placeholder="000000"
              className="w-full text-center py-4 px-6 text-3xl font-bold tracking-[0.75em] text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all font-mono"
              required
              disabled={verifying}
              autoComplete="one-time-code"
            />
          </div>

          <button
            type="submit"
            disabled={verifying || otp.length !== 6}
            className="w-full py-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary-500/20 uppercase tracking-widest text-[13px] btn-press flex items-center justify-center gap-2"
          >
            {verifying ? 'Verifying Code...' : 'Verify OTP'}
          </button>
          
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[13px] text-slate-500 dark:text-slate-400">
              Didn't receive the OTP? Check your spam folder or{' '}
              <button 
                type="button"
                onClick={handleResend}
                disabled={resending || verifying}
                className="text-primary-600 dark:text-primary-400 font-semibold hover:underline disabled:opacity-50"
              >
                {resending ? 'Resending...' : 'click here to resend'}
              </button>
            </p>
          </div>
        </form>
      </div>

      <p className="text-center text-slate-500 dark:text-slate-400 mt-8 font-medium text-[15px]">
        Wrong email?{' '}
        {type === 'college' ? (
          <Link href="/profile?bypass=true" className="text-primary-600 dark:text-primary-400 hover:underline font-semibold">
            Change email
          </Link>
        ) : (
          <Link href="/register" className="text-primary-600 dark:text-primary-400 hover:underline font-semibold">
            Register again
          </Link>
        )}
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
