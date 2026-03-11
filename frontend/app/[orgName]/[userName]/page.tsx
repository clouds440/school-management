'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { GraduationCap, BookOpen, Clock, Calendar, Bell, Trophy, User, AlertTriangle, ShieldOff, Mail, RefreshCw, XCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { BackButton } from '@/components/ui/BackButton';
import Link from 'next/link';

export default function StudentPersonalizedDashboard() {
    const { user, token, loading } = useAuth();
    const params = useParams();
    const [orgName, setOrgName] = useState('Organization');
    const [orgStatus, setOrgStatus] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!user || !token) return;

        fetch(`${process.env.NEXT_PUBLIC_API_URL}/org/settings`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data?.name) setOrgName(data.name);
                if (data?.status) setOrgStatus(data.status);
                if (data?.statusMessage) setStatusMessage(data.statusMessage);
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

            <div className="flex-1 space-y-8 animate-fade-in-up">
                {(orgStatus || user.status) === 'PENDING' && (
                    <div className="flex flex-col items-center justify-center p-12 bg-white/70 backdrop-blur-md rounded-sm shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] border border-white/40 text-center max-w-2xl mx-auto mt-10 hover:shadow-2xl transition-all duration-500 hover:scale-[1.01]">
                        <div className="p-6 bg-yellow-50 rounded-full mb-6 relative">
                            <Clock className="w-20 h-20 text-yellow-500 animate-pulse" />
                            <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-20"></div>
                        </div>
                        <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Hang Tight!</h2>
                        <p className="text-gray-600 text-lg mb-8 font-medium">
                            Your school's registration is still being processed. Once approved, you'll be able to see your classes and grades here.
                        </p>
                        <div className="bg-yellow-100 text-yellow-800 px-10 py-5 rounded-sm font-black text-xl border border-yellow-200 w-full shadow-inner flex items-center justify-center gap-3">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                            Registration Pending
                        </div>
                    </div>
                )}

                {(orgStatus || user.status) === 'REJECTED' && (
                    <div className="flex flex-col items-center justify-center p-12 bg-white/70 backdrop-blur-md rounded-sm shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] border border-white/40 text-center max-w-2xl mx-auto mt-10 hover:shadow-2xl transition-all duration-500 hover:scale-[1.01]">
                        <div className="p-6 bg-red-50 rounded-full mb-6">
                            <XCircle className="w-20 h-20 text-red-500" />
                        </div>
                        <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Access Unavailable</h2>
                        <p className="text-gray-600 text-lg mb-8 font-medium">
                            The academic portal for your institution is currently unavailable. Please contact your school administration for further information.
                        </p>
                        <div className="bg-red-50 border border-red-100 p-6 rounded-sm mb-8 text-left w-full shadow-inner">
                            <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Institutional Notice</p>
                            <p className="text-red-700 font-medium italic">"{statusMessage || 'No specific reason provided.'}"</p>
                        </div>
                    </div>
                )}

                {(orgStatus || user.status) === 'SUSPENDED' && (
                    <div className="flex flex-col items-center justify-center p-12 bg-white/70 backdrop-blur-md rounded-sm shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] border border-orange-200 text-center max-w-2xl mx-auto mt-10 hover:shadow-2xl transition-all duration-500 hover:scale-[1.01]">
                        <div className="p-6 bg-orange-50 rounded-full mb-6">
                            <ShieldOff className="w-20 h-20 text-orange-500" />
                        </div>
                        <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Account Paused</h2>
                        <p className="text-gray-600 text-lg mb-8 font-medium">
                            Student access for your institution has been temporarily restricted. Your academic records are secure, but you cannot view content at this time.
                        </p>
                        <div className="bg-orange-50 text-orange-800 p-6 rounded-sm border border-orange-100 w-full mb-8 text-left shadow-inner">
                            <h3 className="font-bold mb-2 flex items-center gap-2 text-sm uppercase tracking-wider text-orange-900/60"><AlertTriangle className="w-4 h-4" /> Important Message</h3>
                            <p className="italic font-bold text-orange-900">{statusMessage || 'Please contact your school office for administrative details.'}</p>
                        </div>
                    </div>
                )}

                {(orgStatus || user.status) === 'APPROVED' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Stats/Info */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="p-8 bg-white/80 backdrop-blur-xl rounded-sm shadow-2xl border border-white/50 border-l-12 border-l-emerald-500 overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -mr-32 -mt-32"></div>
                                <div className="relative z-10 flex items-start space-x-6">
                                    <div className="p-5 bg-emerald-50 rounded-sm">
                                        <GraduationCap className="w-12 h-12 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black text-gray-900 leading-tight mb-2">Academic Overview</h2>
                                        <p className="text-gray-600 font-medium mb-6">Your personalized student dashboard is being populated with your class schedules, course materials, and performance tracking.</p>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                            <div className="bg-white/50 p-4 rounded-sm border border-white flex flex-col items-center">
                                                <BookOpen className="w-6 h-6 text-indigo-500 mb-2" />
                                                <span className="text-xs font-bold text-gray-400 uppercase">Courses</span>
                                                <span className="text-xl font-black text-gray-800">0</span>
                                            </div>
                                            <div className="bg-white/50 p-4 rounded-sm border border-white flex flex-col items-center">
                                                <Clock className="w-6 h-6 text-purple-500 mb-2" />
                                                <span className="text-xs font-bold text-gray-400 uppercase">Attendance</span>
                                                <span className="text-xl font-black text-gray-800">100%</span>
                                            </div>
                                            <div className="bg-white/50 p-4 rounded-sm border border-white flex flex-col items-center col-span-2 sm:col-span-1">
                                                <Trophy className="w-6 h-6 text-amber-500 mb-2" />
                                                <span className="text-xs font-bold text-gray-400 uppercase">Rank</span>
                                                <span className="text-xl font-black text-gray-800">N/A</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-8 bg-white/70 backdrop-blur-md rounded-sm shadow-xl border border-white/40 group">
                                    <div className="flex items-center space-x-4 mb-4">
                                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            <Calendar className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800">Events</h3>
                                    </div>
                                    <p className="text-gray-500 text-sm font-medium">Upcoming school events and deadlines will appear here.</p>
                                </div>
                                <div className="p-8 bg-white/70 backdrop-blur-md rounded-sm shadow-xl border border-white/40 group">
                                    <div className="flex items-center space-x-4 mb-4">
                                        <div className="p-3 bg-purple-50 text-purple-600 rounded-sm group-hover:bg-purple-600 group-hover:text-white transition-all">
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
                            <div className="p-8 bg-white/70 backdrop-blur-md rounded-sm shadow-xl border border-white/40">
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
                                        <div className="p-3 bg-gray-50 rounded-sm text-gray-400">
                                            <User className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-400 uppercase tracking-tighter">Email</p>
                                            <p className="text-gray-800 font-bold break-all">{user.email}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-indigo-600 rounded-sm shadow-2xl shadow-indigo-200 text-white relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
                                <h3 className="text-xl font-bold mb-4 relative z-10">Resources</h3>
                                <p className="text-indigo-100 text-sm font-medium mb-6 relative z-10 opacity-90 leading-relaxed">Access textbooks, lecture notes, and online assignments once released by your classes.</p>
                                <button className="w-full py-4 bg-white text-indigo-600 rounded-sm font-black text-sm uppercase tracking-widest shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                                    Library
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
