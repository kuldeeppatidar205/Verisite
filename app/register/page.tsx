'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ClientOnly from '@/components/ClientOnly';
import ThemeToggle from '@/components/ThemeToggle';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    collegeEmail: '',
    password: '',
    confirmPassword: '',
    studentId: '',
    hostelName: '',
    roomNumber: '',
    phoneNumber: '',
    role: 'STUDENT' as 'STUDENT' | 'OWNER' | 'GUEST',
  });

  const setRole = (role: 'STUDENT' | 'OWNER' | 'GUEST') => {
    setFormData({
      ...formData,
      role,
      // Clear student-specific fields when role changes to non-student
      collegeEmail: role === 'STUDENT' ? formData.collegeEmail : '',
      studentId: role === 'STUDENT' ? formData.studentId : '',
      hostelName: role === 'STUDENT' ? formData.hostelName : '',
      roomNumber: role === 'STUDENT' ? formData.roomNumber : '',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    // Prepare payload by omitting student-specific fields for other roles
    const payload: any = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phoneNumber: formData.phoneNumber,
      role: formData.role,
    };

    if (formData.role === 'STUDENT') {
      payload.collegeEmail = formData.collegeEmail;
      payload.studentId = formData.studentId;
      payload.hostelName = formData.hostelName;
      payload.roomNumber = formData.roomNumber;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      localStorage.setItem('token', data.token);
      
      if (formData.role === 'GUEST') {
        router.push('/browse');
        return;
      }

      const verifyEmail = formData.role === 'STUDENT' ? formData.collegeEmail : formData.email;
      router.push('/verify-email?email=' + encodeURIComponent(verifyEmail));
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSubtitle = () => {
    if (formData.role === 'STUDENT') return 'Join thousands of students';
    if (formData.role === 'OWNER') return 'List your PG and connect with students';
    return 'Browse listings and view ratings anonymously';
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
              PP
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-200">PurePG</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-200">Create Account</h1>
          <p className="text-gray-600 dark:text-gray-400 transition-colors duration-200">
            {getSubtitle()}
          </p>
        </div>

        <ClientOnly>
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-none border border-transparent dark:border-gray-700 p-8 space-y-4 max-h-[85vh] overflow-y-auto transition-colors duration-200 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl text-red-700 dark:text-red-400 text-sm font-medium">
                {error}
              </div>
            )}

            <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl mb-4">
              <button
                type="button"
                onClick={() => setRole('STUDENT')}
                className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition ${
                  formData.role === 'STUDENT' 
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                STUDENT
              </button>
              <button
                type="button"
                onClick={() => setRole('OWNER')}
                className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition ${
                  formData.role === 'OWNER' 
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                PG OWNER
              </button>
              <button
                type="button"
                onClick={() => setRole('GUEST')}
                className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition ${
                  formData.role === 'GUEST' 
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                GUEST
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-colors duration-200"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">
                Personal Email *
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

            {formData.role === 'STUDENT' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">
                    College Email *
                  </label>
                  <input
                    type="email"
                    name="collegeEmail"
                    value={formData.collegeEmail}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-colors duration-200"
                    placeholder="john@iitk.ac.in"
                  />
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 ml-1">
                    Verified through your institution
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">
                    Student ID *
                  </label>
                  <input
                    type="text"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-colors duration-200"
                    placeholder="2024001"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">
                      Hostel
                    </label>
                    <input
                      type="text"
                      name="hostelName"
                      value={formData.hostelName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-colors duration-200"
                      placeholder="Hall 1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">
                      Room
                    </label>
                    <input
                      type="text"
                      name="roomNumber"
                      value={formData.roomNumber}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-colors duration-200"
                      placeholder="A-101"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-colors duration-200"
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-colors duration-200"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">
                Confirm Password *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-colors duration-200"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400 font-bold transition shadow-lg shadow-blue-100 dark:shadow-none mt-4 uppercase tracking-widest text-xs"
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
        </ClientOnly>

        <p className="text-center text-gray-600 dark:text-gray-400 mt-8 font-medium">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-bold">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
