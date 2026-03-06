'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, OrganizationType } from '@/src/lib/api';
import { School, MapPin, Building, Mail, Lock, UserPlus, AlertCircle, Phone } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    type: OrganizationType.HIGH_SCHOOL,
    email: '',
    contactEmail: '',
    phone: '',
    password: '',
  });
  const [sameAsLoginEmail, setSameAsLoginEmail] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...formData,
        contactEmail: sameAsLoginEmail ? formData.email : formData.contactEmail
      };
      await api.auth.register(payload);
      router.push('/login');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex flex-1 items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl pointer-events-none">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 left-0 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-lg space-y-8 bg-white/70 backdrop-blur-2xl p-10 sm:p-12 rounded-[2.5rem] shadow-[0_30px_70px_rgba(0,0,0,0.15)] border border-white/50 relative z-10 mx-auto transition-all duration-500">
        <div className="text-center">
          <div className="mx-auto bg-indigo-500/10 w-20 h-20 rounded-3xl flex items-center justify-center mb-8 shadow-inner border border-white/20">
            <UserPlus className="w-10 h-10 text-indigo-100 drop-shadow-sm" />
          </div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-4">
            Register School
          </h2>
          <p className="text-gray-600 font-medium text-lg mb-2">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors underline decoration-2 underline-offset-4">
              Sign in here
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl bg-red-50 p-4 border border-red-100 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div className="text-sm text-red-700 font-medium">{error}</div>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5 pl-1">
                School Name
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                  <School className="h-5 w-5" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="block w-full rounded-xl border-gray-200 bg-gray-50/50 pl-11 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 sm:text-sm transition-all duration-200 shadow-sm"
                  placeholder="Greenwood High School"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1.5 pl-1">
                  Institution Type
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                    <Building className="h-5 w-5" />
                  </div>
                  <select
                    id="type"
                    name="type"
                    required
                    className="block w-full rounded-xl border-gray-200 bg-gray-50/50 pl-11 pr-10 py-3 text-gray-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 sm:text-sm transition-all duration-200 shadow-sm appearance-none"
                    value={formData.type}
                    onChange={handleChange}
                  >
                    <option value={OrganizationType.HIGH_SCHOOL}>High School</option>
                    <option value={OrganizationType.UNIVERSITY}>University</option>
                    <option value={OrganizationType.PRIMARY_SCHOOL}>Primary School</option>
                    <option value={OrganizationType.OTHER}>Other</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1.5 pl-1">
                  Location
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    required
                    className="block w-full rounded-xl border-gray-200 bg-gray-50/50 pl-11 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 sm:text-sm transition-all duration-200 shadow-sm"
                    placeholder="New York, NY"
                    value={formData.location}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="email-address" className="block text-sm font-semibold text-gray-700 mb-1.5 pl-1">
                Admin Login Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  required
                  className="block w-full rounded-xl border-gray-200 bg-gray-50/50 pl-11 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 sm:text-sm transition-all duration-200 shadow-sm"
                  placeholder="admin@school.edu"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 pl-1 pr-1">
                <label className="block text-sm font-semibold text-gray-700">
                  School Contact Email
                </label>
                <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sameAsLoginEmail}
                    onChange={(e) => setSameAsLoginEmail(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Same as Login</span>
                </label>
              </div>
              {!sameAsLoginEmail && (
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    required={!sameAsLoginEmail}
                    className="block w-full rounded-xl border-gray-200 bg-gray-50/50 pl-11 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 sm:text-sm transition-all duration-200 shadow-sm"
                    placeholder="contact@school.edu"
                    value={formData.contactEmail}
                    onChange={handleChange}
                  />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1.5 pl-1">
                School Phone Number
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                  <Phone className="h-5 w-5" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  required
                  className="block w-full rounded-xl border-gray-200 bg-gray-50/50 pl-11 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 sm:text-sm transition-all duration-200 shadow-sm"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5 pl-1">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="block w-full rounded-xl border-gray-200 bg-gray-50/50 pl-11 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 sm:text-sm transition-all duration-200 shadow-sm"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center items-center space-x-3 rounded-2xl border border-transparent bg-indigo-600 py-4 px-6 text-lg font-bold text-white hover:bg-indigo-700 hover:shadow-2xl hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:bg-indigo-300 disabled:hover:translate-y-0 transition-all duration-300 shadow-xl"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>REGISTERING...</span>
                </>
              ) : (
                <span>CREATE ACCOUNT</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}