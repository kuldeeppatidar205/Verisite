'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import ClientOnly from '@/components/ClientOnly';

export default function LoginPage() {
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-200">Welcome Back</h1>
          <p className="text-gray-600 dark:text-gray-400 transition-colors duration-200">Login to your account</p>
        </div>

        <ClientOnly>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-none border border-transparent dark:border-gray-700 p-8 transition-colors duration-200">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl text-red-700 dark:text-red-400 text-sm font-medium">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 rounded-xl text-green-700 dark:text-green-400 text-sm font-medium">
                  {success}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">
                  Personal Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-colors duration-200"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1 ml-1">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    Password
                  </label>
                  <Link href="#" className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tighter hover:underline">
                    Forgot?
                  </Link>
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-colors duration-200"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400 font-bold transition shadow-lg shadow-blue-100 dark:shadow-none mt-4 uppercase tracking-widest text-xs"
              >
                {loading ? 'Logging in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </ClientOnly>

        <p className="text-center text-gray-600 dark:text-gray-400 mt-8 font-medium">
          Don't have an account?{' '}
          <Link href="/register" className="text-blue-600 dark:text-blue-400 hover:underline font-bold">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
