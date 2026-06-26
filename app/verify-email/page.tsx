'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import ClientOnly from '@/components/ClientOnly';
import { KeyRound, Mail, RefreshCw, ArrowLeft } from 'lucide-react';

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
        setVerifyStatus({ type: 'error', message: data.error || 'Verification failed. Please check the code.' });
      }
    } catch (err) {
      setVerifyStatus({ type: 'error', message: 'An error occurred. Please try again.' });
    } finally {
      setVerifying(false);
    }
  };

  return (
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
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight uppercase">Verify Your Email</h1>
        <p className="text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">A 6-digit OTP code has been dispatched</p>
      </div>

      <div className="bg-white dark:bg-slate-900/60 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800/80 p-6 sm:p-8 backdrop-blur-lg animate-slide-up">
        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl flex items-center justify-center mx-auto mb-6 border border-indigo-100/30 dark:border-indigo-900/30">
          <KeyRound className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        
        <p className="text-slate-500 dark:text-slate-400 mb-2 text-xs font-semibold text-center uppercase tracking-wider">
          Enter code sent to
        </p>
        <div className="p-3 bg-slate-50/50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-2xl mb-6 break-all text-center">
          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            {email}
          </p>
        </div>

        {verifyStatus && (
          <div className={`mb-6 p-4 rounded-2xl text-xs font-bold text-center border ${
            verifyStatus.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30' : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30'
          }`}>
            {verifyStatus.message}
          </div>
        )}

        {resendStatus && (
          <div className={`mb-6 p-4 rounded-2xl text-xs font-bold text-center border ${
            resendStatus.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30' : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30'
          }`}>
            {resendStatus.message}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <label htmlFor="otp" className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 text-center">
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
              className="w-full text-center py-4 px-6 text-3xl font-bold tracking-[0.6em] text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono shadow-inner"
              required
              disabled={verifying}
              autoComplete="one-time-code"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={verifying || otp.length !== 6}
            className="w-full py-4 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 backdrop-blur-md disabled:opacity-50 rounded-2xl font-black transition-all uppercase tracking-widest text-micro btn-press flex items-center justify-center gap-2 cursor-pointer"
          >
            {verifying ? 'Verifying Code...' : 'Verify OTP'}
          </button>
          
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Didn't receive the OTP? Check spam or{' '}
              <button 
                type="button"
                onClick={handleResend}
                disabled={resending || verifying}
                className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline disabled:opacity-50 inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
                {resending ? 'Resending...' : 'Resend OTP'}
              </button>
            </p>
          </div>
        </form>
      </div>

      <div className="text-center mt-8">
        <Link 
          href={type === 'college' ? "/profile?bypass=true" : "/register"} 
          className="text-xs text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest hover:text-slate-800 dark:hover:text-white transition-colors inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {type === 'college' ? "Change college email" : "Register again"}
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
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
