// app/page.tsx
import Link from 'next/link';
import {
  School,
  Users,
  Calendar,
  BookOpen,
  LogIn,
  UserPlus,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 overflow-hidden">
      {/* Decorative blurred blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />

      {/* Navbar with glass effect */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 md:px-10 backdrop-blur-md bg-white/70 border-b border-white/20 shadow-sm">
        <div className="flex items-center space-x-2">
          <School className="w-8 h-8 text-indigo-600" />
          <span className="text-xl font-semibold text-gray-800">EduManage</span>
        </div>
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
            className="flex items-center space-x-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register</span>
          </Link>
        </div>
      </nav>

      {/* Hero & Features */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
        {/* Hero section */}
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-purple-600 mb-4">
            Simplify School Management
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            All‑in‑one SaaS platform for schools and organizations. 
            Streamline administration, communication, and learning – all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-indigo-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-indigo-700 transition-colors shadow-lg"
            >
              Start Free Trial
            </Link>
            <Link
              href="#features"
              className="bg-white/80 backdrop-blur-sm text-gray-800 px-8 py-3 rounded-full font-semibold border border-gray-200 hover:bg-white transition-colors shadow-lg"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Features grid */}
        <div id="features" className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="group backdrop-blur-md bg-white/30 border border-white/20 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Student Management</h3>
            <p className="text-gray-600">
              Easily manage student profiles, attendance, behavior records, and academic history.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group backdrop-blur-md bg-white/30 border border-white/20 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Class Scheduling</h3>
            <p className="text-gray-600">
              Create and manage timetables, assign teachers, and handle room bookings effortlessly.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group backdrop-blur-md bg-white/30 border border-white/20 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <BookOpen className="w-8 h-8 text-pink-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Gradebooks & Reports</h3>
            <p className="text-gray-600">
              Track grades, generate report cards, and share progress with parents in real time.
            </p>
          </div>
        </div>
      </main>

      {/* Simple footer */}
      <footer className="relative z-10 text-center py-6 text-gray-500 border-t border-white/20 backdrop-blur-sm bg-white/30">
        <p>© 2026 EduManage. All rights reserved.</p>
      </footer>
    </div>
  );
}