'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, CheckCircle, LayoutTemplate, Users, BookOpen, Key } from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
    const { user: payload, loading } = useAuth();
    const router = useRouter();

    // Guards are now handled globally in AuthContext
    useEffect(() => {
        // Any organization-specific initialization can go here
    }, []);

    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!payload) return null;

    return (
        <div className="flex flex-1 flex-col p-6 sm:p-10 max-w-7xl mx-auto w-full">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-gray-300">Dashboard</h1>
                <div className="flex items-center gap-3">
                    <Link
                        href={`/${payload.orgSlug}/change-password`}
                        className="text-sm font-medium px-4 py-2 rounded-full border border-gray-200 bg-white/70 shadow-sm hover:bg-gray-50 flex items-center space-x-2 transition-colors text-gray-700 hover:text-indigo-600"
                    >
                        <Key className="w-4 h-4" />
                        <span>Change Password</span>
                    </Link>
                    <div className="text-sm font-medium px-4 py-2 rounded-full border border-gray-200 bg-white/70 shadow-sm flex items-center space-x-2">
                        <span className="text-gray-700">Logged in as:</span>
                        <span className="text-indigo-600 font-semibold truncate max-w-[200px]">{payload.email}</span>
                    </div>
                </div>
            </div>

            {!payload.approved ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/40 text-center max-w-2xl mx-auto mt-10">
                    <Clock className="w-16 h-16 text-yellow-500 mb-6" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Waiting for Approval</h2>
                    <p className="text-gray-600 mb-6">
                        Your registration is currently under review by our administrators.
                        Once you are approved, you will get full access to the dashboard.
                    </p>
                    <div className="bg-yellow-50 text-yellow-800 px-6 py-4 rounded-lg font-medium border border-yellow-200 w-full animate-pulse">
                        Status: Pending Validation
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="p-6 bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/40 mb-8 border-l-4 border-l-green-500 flex items-center space-x-4">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Organization Approved</h2>
                            <p className="text-gray-600 text-sm">Welcome to your administrative dashboard.</p>
                        </div>
                    </div>

                    {/* Dummy Dashboard Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/40 hover:-translate-y-1 transition-transform group">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg group-hover:scale-110 transition-transform">
                                    <Users className="w-6 h-6" />
                                </div>
                                <h3 className="font-semibold text-gray-700">Total Students</h3>
                            </div>
                            <p className="text-4xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-indigo-400">0</p>
                        </div>

                        <div className="p-6 bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/40 hover:-translate-y-1 transition-transform group">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="p-3 bg-purple-100 text-purple-600 rounded-lg group-hover:scale-110 transition-transform">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <h3 className="font-semibold text-gray-700">Active Courses</h3>
                            </div>
                            <p className="text-4xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-purple-400">0</p>
                        </div>

                        <div className="p-6 bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/40 hover:-translate-y-1 transition-transform group">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="p-3 bg-pink-100 text-pink-600 rounded-lg group-hover:scale-110 transition-transform">
                                    <LayoutTemplate className="w-6 h-6" />
                                </div>
                                <h3 className="font-semibold text-gray-700">Today's Schedule</h3>
                            </div>
                            <p className="text-xl font-bold text-gray-400 italic">No Events scheduled</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
