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
import { PLATFORM_NAME } from '@/lib/constants';

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
    <div className="flex min-h-full h-screen bg-gray-50 overflow-hidden">
      {/* Left Column: Branding Assets (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12 overflow-hidden bg-gray-900">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary/20 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse delay-700"></div>

        <div className="relative z-10 w-full max-w-lg text-center lg:text-left space-y-8 animate-in fade-in slide-in-from-left duration-1000">
          <div className="inline-flex items-center space-x-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.8)]"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 italic">Enterprise Ready</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl xl:text-6xl font-black text-white leading-tight tracking-tighter">
              The <span className="text-primary italic animate-pulse group-hover:scale-110 transition-transform inline-block">Verse</span> <br />
              of Modern Education.
            </h1>
            <p className="text-lg text-gray-400 font-medium leading-relaxed max-w-md">
              Streamline your school's operations with the ultimate all-in-one management platform. Efficient, secure, and ready for the future.
            </p>
          </div>

          <div className="pt-8">
            <div className="relative w-full aspect-square max-w-md mx-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <img
                src="/_next/static/media/auth_login_bg_1775044022007.png"
                alt="Digital School Gateway"
                className="w-full h-full object-contain animate-float"
                onError={(e) => {
                  // Fallback if the static path isn't mapped yet in dev server
                  e.currentTarget.src = "/api/placeholder/800/800";
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer branding */}
        <div className="absolute bottom-8 left-12 z-10 flex items-center space-x-2 opacity-50 hover:opacity-100 transition-opacity duration-300">
          <p className="text-[10px] font-black text-white uppercase tracking-widest">&copy; 2026 {PLATFORM_NAME} Global Inc.</p>
        </div>
      </div>

      {/* Right Column: Interaction Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white relative animate-in fade-in duration-700">
        <div className="w-full max-w-md space-y-12">
          {/* Mobile Header Branding (Visible only on mobile) */}
          <div className="lg:hidden text-center mb-8">
            <div className="mx-auto bg-primary/5 w-16 h-16 rounded-sm flex items-center justify-center mb-4 border border-primary/10">
              <LogIn className="w-8 h-8 text-primary shadow-sm" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 italic uppercase tracking-tighter">{PLATFORM_NAME}</h2>
          </div>

          <div className="space-y-2">
            <h2 className="text-4xl font-black text-gray-900 tracking-tighter leading-tight italic">
              Welcome back.
            </h2>
            <p className="text-sm text-gray-500 font-medium tracking-tight">
              Sign in to your organization or student portal.
            </p>
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <Label htmlFor="email-address" className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Email</Label>
                <Input
                  id="email-address"
                  name="email"
                  type="email"
                  required
                  icon={Mail}
                  placeholder="admin@school.edu"
                  value={formData.email}
                  onChange={handleChange}
                  className="h-14 font-bold border-gray-100 focus:border-primary/50 transition-all"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2 ml-1">
                  <Label htmlFor="password" className="text-[11px] font-black uppercase tracking-widest text-gray-400">Password</Label>
                  <Link href="#" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline italic">Forgot?</Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  icon={Lock}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="h-14 font-bold border-gray-100 focus:border-primary/50 transition-all"
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
                <span className="ml-3 text-[11px] font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-900 transition-colors">
                  Remember Session
                </span>
              </label>
            </div>

            <div className="space-y-4 pt-4">
              <Button
                type="submit"
                loadingText="Securing access..."
                className="w-full h-16 shadow-lg shadow-primary/20"
              >
                <span className="font-black uppercase tracking-[0.2em] italic text-xs">Enter Portal</span>
              </Button>

              <p className="text-center text-xs text-gray-400 font-bold tracking-tight">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-primary hover:text-primary/80 transition-colors underline underline-offset-4 decoration-2">
                  Create new organization
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}