'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { GraduationCap, BookOpen, Clock, Calendar, Bell, Trophy, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { BackButton } from '@/components/ui/BackButton';

export default function StudentPersonalizedDashboard() {
    const { user, token, loading } = useAuth();
    const params = useParams();
    const [orgName, setOrgName] = useState('Organization');

    useEffect(() => {
        if (!user || !token) return;

        fetch('http://localhost:3000/org/settings', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data?.name) setOrgName(data.name);
            })
            .catch(() => { });
    }, [user, token]);

    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="flex flex-1 flex-col p-6 sm:p-10 max-w-7xl mx-auto w-full">
            <div className="mb-8">
                <BackButton />
                <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-5xl font-black text-white tracking-tight drop-shadow-xl mb-2">
                            Hello, {user.name}
                        </h1>
                        <p className="text-indigo-100 font-bold opacity-80 uppercase tracking-widest text-sm">
                            Student Portal • {orgName}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Stats/Info */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="p-8 bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/50 border-l-[12px] border-l-emerald-500 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -mr-32 -mt-32"></div>
                        <div className="relative z-10 flex items-start space-x-6">
                            <div className="p-5 bg-emerald-50 rounded-3xl">
                                <GraduationCap className="w-12 h-12 text-emerald-600" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-gray-900 leading-tight mb-2">Academic Overview</h2>
                                <p className="text-gray-600 font-medium mb-6">Your personalized student dashboard is being populated with your class schedules, course materials, and performance tracking.</p>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    <div className="bg-white/50 p-4 rounded-2xl border border-white flex flex-col items-center">
                                        <BookOpen className="w-6 h-6 text-indigo-500 mb-2" />
                                        <span className="text-xs font-bold text-gray-400 uppercase">Courses</span>
                                        <span className="text-xl font-black text-gray-800">0</span>
                                    </div>
                                    <div className="bg-white/50 p-4 rounded-2xl border border-white flex flex-col items-center">
                                        <Clock className="w-6 h-6 text-purple-500 mb-2" />
                                        <span className="text-xs font-bold text-gray-400 uppercase">Attendance</span>
                                        <span className="text-xl font-black text-gray-800">100%</span>
                                    </div>
                                    <div className="bg-white/50 p-4 rounded-2xl border border-white flex flex-col items-center col-span-2 sm:col-span-1">
                                        <Trophy className="w-6 h-6 text-amber-500 mb-2" />
                                        <span className="text-xs font-bold text-gray-400 uppercase">Rank</span>
                                        <span className="text-xl font-black text-gray-800">N/A</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-8 bg-white/70 backdrop-blur-md rounded-3xl shadow-xl border border-white/40 group">
                            <div className="flex items-center space-x-4 mb-4">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800">Events</h3>
                            </div>
                            <p className="text-gray-500 text-sm font-medium">Upcoming school events and deadlines will appear here.</p>
                        </div>
                        <div className="p-8 bg-white/70 backdrop-blur-md rounded-3xl shadow-xl border border-white/40 group">
                            <div className="flex items-center space-x-4 mb-4">
                                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-all">
                                    <Bell className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800">Notices</h3>
                            </div>
                            <p className="text-gray-500 text-sm font-medium">Important announcements from your teachers and organization.</p>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-8">
                    <div className="p-8 bg-white/70 backdrop-blur-md rounded-3xl shadow-xl border border-white/40">
                        <h3 className="text-xl font-black text-gray-900 border-b border-gray-100 pb-4 mb-6">Profile Details</h3>
                        <div className="space-y-6">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-xl border-2 border-white shadow-sm">
                                    {user.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-tighter">Student Name</p>
                                    <p className="text-gray-800 font-bold">{user.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-gray-50 rounded-xl text-gray-400">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-tighter">Email</p>
                                    <p className="text-gray-800 font-bold break-all">{user.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-indigo-600 rounded-[2.5rem] shadow-2xl shadow-indigo-200 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
                        <h3 className="text-xl font-bold mb-4 relative z-10">Resources</h3>
                        <p className="text-indigo-100 text-sm font-medium mb-6 relative z-10 opacity-90 leading-relaxed">Access textbooks, lecture notes, and online assignments once released by your classes.</p>
                        <button className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                            Library
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
