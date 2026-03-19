'use client';

import { useEffect, useState } from 'react';
import { User, Clock, Search, Book, LayoutDashboard } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { Section } from '@/types';

interface CoursesTabProps {
    token: string;
}

export default function CoursesTab({ token }: CoursesTabProps) {
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
        <div className="space-y-8 mt-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 text-left">
                <div>
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Course Enrollment</h2>
                    <p className="text-slate-500 mt-1 font-bold text-[10px] uppercase tracking-widest">Manage your active classes and academic schedule</p>
                </div>
                <div className="w-full md:w-80">
                    <Input 
                        icon={Search} 
                        placeholder="Search courses..." 
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
                        <div key={sec.id} className="bg-white border border-slate-200 rounded-sm overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col h-full border-t-4 border-t-primary">
                            <div className="p-6 flex flex-col flex-1">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="text-left">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{sec.course?.name}</p>
                                        <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 group-hover:text-primary transition-colors leading-tight">{sec.name}</h3>
                                    </div>
                                    <div className="p-3 bg-primary/5 rounded-sm border border-primary/10 shadow-inner">
                                        <Book className="w-5 h-5 text-primary" />
                                    </div>
                                </div>
                                
                                <div className="space-y-4 mb-10 flex-1">
                                    <div className="flex items-center gap-3 text-slate-600 font-black uppercase text-[10px] tracking-tight">
                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
                                            <User className="w-4 h-4 text-slate-300" />
                                        </div>
                                        <span className="text-left">{sec.teachers?.[0]?.user?.name || 'Assigned Professor'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-600 font-black uppercase text-[10px] tracking-tight">
                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
                                            <Clock className="w-4 h-4 text-slate-300" />
                                        </div>
                                        <span className="text-left">{sec.room || 'TBD'}</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
                                        <span>Progress</span>
                                        <span className="text-slate-900">75%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden shadow-inner">
                                        <div
                                            className="bg-primary h-full transition-all duration-1000 ease-out"
                                            style={{ width: '75%' }}
                                        ></div>
                                    </div>
                                </div>

                                <button className="mt-8 w-full py-4 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-sm shadow-md hover:bg-primary transition-all flex items-center justify-center gap-2 italic">
                                    <LayoutDashboard className="w-4 h-4" />
                                    Internal Access
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredSections.length === 0 && (
                        <div className="col-span-full text-center py-20 bg-slate-50 rounded-sm border-2 border-dashed border-slate-200">
                            <Book className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] italic">No filtered results found</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
