// app/register/page.tsx
import Link from 'next/link';
import { School, LogIn, UserPlus, Mail, Lock, User } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="relative min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 md:px-10 backdrop-blur-md bg-white/70 border-b border-white/20 shadow-sm">
        <Link href="/" className="flex items-center space-x-2">
          <School className="w-8 h-8 text-indigo-600" />
          <span className="text-xl font-semibold text-gray-800">EduManage</span>
        </Link>
        <div className="flex items-center space-x-4">
          <Link
            href="/login"
            className="flex items-center space-x-1 text-gray-700 hover:text-indigo-600 transition-colors px-3 py-2 rounded-lg"
          >
            <LogIn className="w-4 h-4" />
            <span>Login</span>
          </Link>
          <Link
            href="/register"
            className="flex items-center space-x-1 text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register</span>
          </Link>
        </div>
      </nav>

      {/* Main content */}
      <main className="relative z-10 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md backdrop-blur-md bg-white/30 border border-white/20 rounded-2xl p-8 shadow-xl">
          <h2 className="text-3xl font-bold text-center mb-2 text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-purple-600">
            Create Account
          </h2>
          <p className="text-center text-gray-600 mb-8">Join EduManage today</p>

          <form className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="name"
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/70 backdrop-blur-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/70 backdrop-blur-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  id="password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/70 backdrop-blur-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  id="confirm-password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/70 backdrop-blur-sm"
                />
              </div>
            </div>

            <div className="flex items-center text-sm">
              <input
                type="checkbox"
                id="terms"
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="terms" className="ml-2 text-gray-600">
                I agree to the{' '}
                <Link href="/terms" className="text-indigo-600 hover:text-indigo-800">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-indigo-600 hover:text-indigo-800">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors shadow-md font-medium"
            >
              Sign Up
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-600 hover:text-indigo-800 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-gray-500 border-t border-white/20 backdrop-blur-sm bg-white/30">
        <p>© 2026 EduManage. All rights reserved.</p>
      </footer>
    </div>
  );
}