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
                    <h1 className="text-4xl font-black text-foreground tracking-tighter leading-none italic uppercase">My Courses</h1>
                    <p className="text-muted-foreground mt-3 font-bold max-w-md tracking-tight">Access your classroom materials and track syllabus progress.</p>
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
                                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-2">{sec.course?.name}</p>
                                <h3 className="text-2xl font-black text-foreground group-hover:text-primary transition-colors tracking-tight leading-tight italic">{sec.name}</h3>
                            </div>
                            <div className="p-3 bg-primary/5 rounded-2xl border border-primary/20 shadow-sm">
                                <Book className="w-6 h-6 text-primary" />
                            </div>
                        </CardHeader>

                        <CardContent>
                            <div className="space-y-4 mb-4 flex-1">
                                <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-bold uppercase tracking-widest">
                                    <div className="w-10 h-10 rounded-2xl bg-muted/30 flex items-center justify-center border border-border shadow-xs">
                                        <User className="w-5 h-5 text-muted-foreground/60" />
                                    </div>
                                    <span className="text-left">{sec.teachers?.[0]?.user?.name || 'Assigned Professor'}</span>
                                </div>
                                <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-bold uppercase tracking-widest">
                                    <div className="w-10 h-10 rounded-2xl bg-muted/30 flex items-center justify-center border border-border shadow-xs">
                                        <MapPinHouse className="w-5 h-5 text-muted-foreground/60" />
                                    </div>
                                    <span className="text-left">{sec.room || 'Learning Lab C-1'}</span>
                                </div>
                            </div>

                            <div className="space-y-3 mt-8">
                                <div className="flex justify-between text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.15em]">
                                    <span>Syllabus Completion</span>
                                    <span className="text-foreground px-2 py-0.5 bg-muted rounded">75%</span>
                                </div>
                                <div className="w-full bg-muted h-3 rounded-full overflow-hidden shadow-inner p-0.5 border border-border">
                                    <div
                                        className="bg-primary h-full transition-all duration-1000 ease-out rounded-full shadow-lg"
                                        style={{ width: '75%' }}
                                    ></div>
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="pt-8">
                            <button className="w-full py-4 bg-primary text-primary-foreground font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all duration-500 flex items-center justify-center gap-3 active:scale-95">
                                <LayoutDashboard className="w-5 h-5" />
                                Enter Classroom
                            </button>
                        </CardFooter>
                    </Card>
                ))}
                {filteredSections.length === 0 && (
                    <div className="col-span-full text-center py-20 bg-muted/30 rounded-2xl border-2 border-dashed border-border">
                        <Book className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                        <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">No courses found matching your search</p>
                    </div>
                )}
            </div>
        </div>
    );
}
