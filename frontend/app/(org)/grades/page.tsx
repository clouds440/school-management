'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, GraduationCap, ChevronRight, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { Section, Role } from '@/types';
import { useGlobal } from '@/context/GlobalContext';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';

export default function GradesPage() {
    const { token, user } = useAuth();
    const params = useParams();
    const { state, dispatch } = useGlobal();
    const [sections, setSections] = useState<Section[]>([]);
    const isLoading = state.ui.isLoading;
    const [searchTerm, setSearchTerm] = useState('');

    const fetchGradesData = useCallback(async () => {
        if (!token || !user) return;
        dispatch({ type: 'UI_SET_LOADING', payload: true });
        try {
            // Admins/Teachers see sections to manage
            const params = user.role === Role.TEACHER ? { my: true } : {};
            const data = await api.org.getSections(token, params);
            setSections(data.data || []);
        } catch (error) {
            console.error('Failed to fetch grades data:', error);
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Failed to load grades information', type: 'error' } });
        } finally {
            dispatch({ type: 'UI_SET_LOADING', payload: false });
        }
    }, [token, user, dispatch]);

    useEffect(() => {
        fetchGradesData();
    }, [fetchGradesData]);

    const filteredSections = sections.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.course?.name && s.course.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12 h-[60vh]">
                <Loading size="lg" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full space-y-8">
            <div className="space-y-6">
                <div className="flex items-center justify-between bg-card/50 p-6 rounded-lg border border-border shadow-inner">
                    <div className="flex-1 max-w-md">
                        <Input
                            placeholder="Search sections or courses..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon={Search}
                        />
                    </div>
                    <div className="hidden md:flex items-center gap-2 text-[10px] font-black uppercase text-card-text/30 tracking-widest">
                        <GraduationCap className="w-4 h-4" />
                        <span>Total Sections: {sections.length}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSections.length === 0 ? (
                        <div className="col-span-full bg-primary/5 border border-dashed border-border rounded-lg p-20 text-center">
                            <BookOpen className="w-16 h-16 text-card-text/20 mx-auto mb-4" />
                            <p className="text-card-text/40 font-bold italic uppercase tracking-widest">No matching sections found.</p>
                        </div>
                    ) : (
                        filteredSections.map(section => (
                            <Link
                                key={section.id}
                                href={`/sections/${section.id}`}
                                className="bg-card border border-border rounded-lg p-8 space-y-4 hover:border-primary/50 transition-all group shadow-sm flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-primary/35 rounded-lg border border-primary/10 group-hover:bg-primary group-hover:text-foreground transition-all duration-300">
                                            <GraduationCap className="w-6 h-6" />
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-card-text/10 group-hover:text-primary transition-all group-hover:translate-x-1" />
                                    </div>
                                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-card-text leading-tight group-hover:text-primary transition-colors">{section.name}</h3>
                                    <p className="text-[10px] font-black text-card-text/40 uppercase tracking-widest mt-2">{section.course?.name || 'GENERIC COURSE'}</p>
                                </div>
                                <div className="mt-8 pt-6 border-t border-border flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-card-text/30">
                                    <span>{section.semester} {section.year}</span>
                                    <span className="bg-primary/5 px-2 py-1 rounded-lg text-primary group-hover:bg-primary group-hover:text-foreground transition-all">MANAGE GRADES</span>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
