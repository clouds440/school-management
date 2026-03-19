'use client';

import { useEffect, useState } from 'react';
import {
    StudentPortalShell
} from '@/components/student/StudentPortalShell';
import { User, Clock, Search, Book, LayoutDashboard } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Section } from '@/types';

export default function StudentCoursesPage() {
    const { token } = useAuth();
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!token) return;
        setLoading(true);
        api.org.getSections(token, { my: true })
            .then(data => setSections(data.data || []))
            .finally(() => setLoading(false));
    }, [token]);

    const filteredSections = sections.filter(sec => 
        sec.name.toLowerCase().includes(search.toLowerCase()) || 
        sec.course?.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <StudentPortalShell activeTab="courses">
            <div className="max-w-7xl mx-auto space-y-8 pb-10 px-4 sm:px-6">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Courses</h1>
                        <p className="text-slate-500 mt-1">Manage your active enrollments and access course materials.</p>
                    </div>
                    <div className="w-full md:w-80">
                        <Input 
                            icon={Search} 
                            placeholder="Filter courses..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-white border-slate-200 shadow-sm"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredSections.map(sec => (
                            <div key={sec.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col h-full border-t-4 border-t-indigo-500">
                                <div className="p-6 flex flex-col flex-1">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="text-left">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{sec.course?.name}</p>
                                            <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">{sec.name}</h3>
                                        </div>
                                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                                            <Book className="w-5 h-5 text-indigo-500" />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4 mb-8 flex-1">
                                        <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                                                <User className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <span className="text-left">{sec.teachers?.[0]?.user?.name || 'Assigned Professor'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                                                <Clock className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <span className="text-left">{sec.room || 'Main Laboratory C'}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                                            <span>Syllabus Completion</span>
                                            <span className="text-slate-900">75%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                            <div
                                                className="bg-indigo-500 h-full transition-all duration-1000 ease-out"
                                                style={{ width: '75%' }}
                                            ></div>
                                        </div>
                                    </div>

                                    <button className="mt-8 w-full py-3.5 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                                        <LayoutDashboard className="w-4 h-4" />
                                        Enter Classroom
                                    </button>
                                </div>
                            </div>
                        ))}
                        {filteredSections.length === 0 && (
                            <div className="col-span-full text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                <Book className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No courses found matching your search</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </StudentPortalShell>
    );
}
