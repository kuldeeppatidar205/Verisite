'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import ClientOnly from '@/components/ClientOnly';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'your college email';

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
                onClick={() => window.location.reload()} 
                className="text-primary-600 dark:text-primary-400 font-semibold hover:underline"
              >
                click here to resend
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
