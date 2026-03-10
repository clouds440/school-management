// app/page.tsx
import { HeroButtons } from '@/components/HeroButtons';
import { Users, Calendar, BookOpen } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 w-full">
      {/* Hero section */}
      <div className="text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-purple-600 mb-4">
          Simplify School Management
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
          All‑in‑one SaaS platform for schools and organizations.
          Streamline administration, communication, and learning – all in one place.
        </p>
        <HeroButtons />
      </div>

      {/* Features grid */}
      <div id="features" className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Feature 1 */}
        <div className="group backdrop-blur-md bg-white/30 border border-white/20 rounded-sm p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
          <div className="w-14 h-14 bg-indigo-100 rounded-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Users className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Student Management</h3>
          <p className="text-gray-300">
            Easily manage student profiles, attendance, behavior records, and academic history.
          </p>
        </div>

        {/* Feature 2 */}
        <div className="group backdrop-blur-md bg-white/30 border border-white/20 rounded-sm p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
          <div className="w-14 h-14 bg-purple-100 rounded-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Calendar className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Class Scheduling</h3>
          <p className="text-gray-300">
            Create and manage timetables, assign teachers, and handle room bookings effortlessly.
          </p>
        </div>

        {/* Feature 3 */}
        <div className="group backdrop-blur-md bg-white/30 border border-white/20 rounded-sm p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
          <div className="w-14 h-14 bg-pink-100 rounded-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <BookOpen className="w-8 h-8 text-pink-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Gradebooks & Reports</h3>
          <p className="text-gray-300">
            Track grades, generate report cards, and share progress with parents in real time.
          </p>
        </div>
      </div>
    </div>
  );
}