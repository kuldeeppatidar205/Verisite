'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    // Check if redirected from verification success
    if (searchParams.get('verified') === 'true') {
      setVerified(true);
    }
  }, [searchParams]);

  const handleResendEmail = async () => {
    alert('Verification email sent to ' + email);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-none border border-transparent dark:border-gray-700 p-8 text-center transition-colors duration-200">
      {verified ? (
        <>
          <div className="text-6xl mb-6">✅</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-200">Email Verified!</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8 transition-colors duration-200">
            Your email has been successfully verified. You can now browse and post listings.
          </p>
          <Link
            href="/browse"
            className="inline-block px-10 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition shadow-lg shadow-blue-100 dark:shadow-none uppercase tracking-widest text-xs"
          >
            Go to Dashboard
          </Link>
        </>
      ) : (
        <>
          <div className="text-6xl mb-6 animate-bounce">📧</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-200">Verify Your Email</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6 transition-colors duration-200">
            A verification link has been sent to:
          </p>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-8 break-all transition-colors duration-200">{email}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-10 transition-colors duration-200">
            Click the link in the email to verify your account. If you don't see it, check your spam folder.
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-xl p-5 mb-8">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 transition-colors duration-200">
              Didn't receive it?
            </p>
            <button
              onClick={handleResendEmail}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold underline transition-colors duration-200"
            >
              Resend verification link
            </button>
          </div>

          <Link
            href="/"
            className="inline-block text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors duration-200"
          >
            Back to Home
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-200 py-12 px-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              CP
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-200">CampusPass</span>
          </Link>
        </div>

        <Suspense fallback={
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 flex flex-col items-center justify-center min-h-[400px]">
            <div className="text-gray-600 dark:text-gray-400 animate-pulse font-medium">Loading verification status...</div>
          </div>
        }>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
