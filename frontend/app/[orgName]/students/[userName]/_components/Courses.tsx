'use client';

import { useState } from 'react';
import { User, MapPinHouse, Book, LayoutDashboard } from 'lucide-react';
import { Section } from '@/types';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { SearchBar } from '@/components/ui/SearchBar';

export default function Courses({ sections }: { sections: Section[] }) {
    const [search, setSearch] = useState('');

    const filteredSections = sections.filter(sec =>
        sec.name.toLowerCase().includes(search.toLowerCase()) ||
        sec.course?.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-16 px-4 sm:px-6">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-4 mb-10">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none italic uppercase">My Courses</h1>
                    <p className="text-slate-500 mt-3 font-bold max-w-md tracking-tight">Access your classroom materials and track syllabus progress.</p>
                </div>
                <div className="w-full md:w-80">
                    <SearchBar
                        placeholder="Search your courses..."
                        value={search}
                        onChange={setSearch}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredSections.map((sec, index) => (
                    <Card
                        key={sec.id}
                        accentColor="bg-indigo-500"
                        padding="lg"
                        delay={index * 100}
                    >
                        <CardHeader>
                            <div className="text-left">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{sec.course?.name}</p>
                                <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight leading-tight italic">{sec.name}</h3>
                            </div>
                            <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 shadow-sm">
                                <Book className="w-6 h-6 text-indigo-500" />
                            </div>
                        </CardHeader>

                        <CardContent>
                            <div className="space-y-4 mb-4 flex-1">
                                <div className="flex items-center gap-4 text-[11px] text-slate-600 font-bold uppercase tracking-widest">
                                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-xs">
                                        <User className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <span className="text-left">{sec.teachers?.[0]?.user?.name || 'Assigned Professor'}</span>
                                </div>
                                <div className="flex items-center gap-4 text-[11px] text-slate-600 font-bold uppercase tracking-widest">
                                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-xs">
                                        <MapPinHouse className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <span className="text-left">{sec.room || 'Learning Lab C-1'}</span>
                                </div>
                            </div>

                            <div className="space-y-3 mt-8">
                                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                                    <span>Syllabus Completion</span>
                                    <span className="text-slate-900 px-2 py-0.5 bg-slate-100 rounded">75%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden shadow-inner p-0.5 border border-slate-200/50">
                                    <div
                                        className="bg-indigo-500 h-full transition-all duration-1000 ease-out rounded-full shadow-lg"
                                        style={{ width: '75%' }}
                                    ></div>
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="pt-8">
                            <button className="w-full py-4 bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-slate-200/50 hover:bg-indigo-600 hover:shadow-indigo-200 transition-all duration-500 flex items-center justify-center gap-3 active:scale-95">
                                <LayoutDashboard className="w-5 h-5" />
                                Enter Classroom
                            </button>
                        </CardFooter>
                    </Card>
                ))}
                {filteredSections.length === 0 && (
                    <div className="col-span-full text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <Book className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No courses found matching your search</p>
                    </div>
                )}
            </div>
        </div>
    );
}
