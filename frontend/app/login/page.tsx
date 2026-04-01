'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Mail, Lock, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useGlobal } from '@/context/GlobalContext';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const { login } = useAuth();
  const { state, dispatch } = useGlobal();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state.ui.isProcessing) return;
    dispatch({ type: 'UI_SET_PROCESSING', payload: true });

    try {
      const res = await api.auth.login(formData);
      login(res.access_token || '');
      dispatch({ type: 'TOAST_ADD', payload: { message: 'Welcome back!', type: 'success' } });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      dispatch({ type: 'TOAST_ADD', payload: { message: errorMessage, type: 'error' } });
    } finally {
      dispatch({ type: 'UI_SET_PROCESSING', payload: false });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };


  return (
    <div className="flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-y-auto min-h-full">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-3xl pointer-events-none">
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 left-0 w-72 h-72 bg-secondary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-lg space-y-10 bg-white/80 backdrop-blur-xl p-10 sm:p-14 rounded-sm shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-white relative z-10 transition-all duration-300">
        <div className="text-center">
          <div className="mx-auto bg-primary/5 w-16 h-16 rounded-sm flex items-center justify-center mb-6 shadow-sm border border-primary/10">
            <LogIn className="w-8 h-8 text-primary" />
          </div>
          <h2 className="mt-2 text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-gray-900 to-gray-700 tracking-tight">
            Welcome back
          </h2>
          <p className="mt-3 text-sm text-gray-500 font-medium tracking-tight">
            Don&apos;t have an account?
            <Link href="/register" className="font-bold text-primary hover:text-primary/80 transition-colors">
              &nbsp;Register a new school
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <Label htmlFor="email-address">Email Address</Label>
              <Input
                id="email-address"
                name="email"
                type="email"
                required
                icon={Mail}
                placeholder="admin@school.edu"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                icon={Lock}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex items-center justify-between py-1">
            <label className="flex items-center group cursor-pointer select-none">
              <div className="relative">
                <input
                  id="remember-me"
                  name="rememberMe"
                  type="checkbox"
                  className="peer sr-only"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <div className="w-5 h-5 bg-gray-100 border-2 border-gray-200 rounded-sm peer-checked:bg-primary peer-checked:border-primary transition-all duration-200 group-hover:border-primary/40 shadow-sm flex items-center justify-center">
                  <svg
                    className={`w-3.5 h-3.5 text-white transition-opacity duration-200 ${formData.rememberMe ? 'opacity-100' : 'opacity-0'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="3.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <span className="ml-3 text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                Stay logged in (30 days)
              </span>
            </label>
          </div>

          <div>
            <Button
              type="submit"
              loadingText="Signing in..."
              className="w-full"
            >
              Sign in
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}