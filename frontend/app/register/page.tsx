'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, OrganizationType } from '@/src/lib/api';
import { School, MapPin, Building, Mail, Lock, UserPlus, Phone } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';

export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useToast();
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
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        contactEmail: sameAsLoginEmail ? formData.email : formData.contactEmail
      };
      await api.auth.register(payload);
      showToast('Registration successful! Please login.', 'success');
      router.push('/login');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      showToast(errorMessage, 'error');
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
          <h2 className="mt-2 text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 tracking-tight">
            Register Organization
          </h2>
          <p className="mt-3 text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
              Sign in here
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                icon={School}
                placeholder="Greenwood High School"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="type">Organization Type</Label>
                <Select
                  id="type"
                  name="type"
                  required
                  icon={Building}
                  value={formData.type}
                  onChange={handleChange}
                >
                  <option value={OrganizationType.HIGH_SCHOOL}>High School</option>
                  <option value={OrganizationType.UNIVERSITY}>University</option>
                  <option value={OrganizationType.PRIMARY_SCHOOL}>Primary School</option>
                  <option value={OrganizationType.OTHER}>Other</option>
                </Select>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  type="text"
                  required
                  icon={MapPin}
                  placeholder="New York, NY"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email-address">Admin Login Email</Label>
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
              <div className="flex items-center justify-between mb-2 pl-1 pr-1">
                <Label className="mb-0">
                  Organization Contact Email
                </Label>
                <label className="flex items-center group cursor-pointer select-none">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={sameAsLoginEmail}
                      onChange={(e) => setSameAsLoginEmail(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 bg-gray-100 border-2 border-gray-200 rounded-lg peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all duration-200 group-hover:border-indigo-300 shadow-sm flex items-center justify-center">
                      <svg
                        className={`w-3.5 h-3.5 text-white transition-opacity duration-200 ${sameAsLoginEmail ? 'opacity-100' : 'opacity-0'}`}
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
                    Same as login
                  </span>
                </label>
              </div>
              {!sameAsLoginEmail && (
                <Input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  required={!sameAsLoginEmail}
                  icon={Mail}
                  placeholder="contact@school.edu"
                  value={formData.contactEmail}
                  onChange={handleChange}
                />
              )}
            </div>

            <div>
              <Label htmlFor="phone">Organization Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="text"
                required
                icon={Phone}
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
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

          <div>
            <Button
              type="submit"
              isLoading={loading}
              loadingText="REGISTERING..."
              className="w-full py-4 text-lg"
            >
              CREATE ORGANIZATION ACCOUNT
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}