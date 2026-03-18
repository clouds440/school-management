'use client';

import { useState } from 'react';
import {
    StudentPortalShell,
    StudentCourse
} from '@/components/student/StudentPortalShell';
import { User, Clock, Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';

export default function StudentCoursesPage() {
    const [courses] = useState<StudentCourse[]>([
        { id: '1', name: 'Mathematics 101', teacher: 'Dr. Smith', schedule: 'Mon/Wed 10:00 AM', progress: 75 },
        { id: '2', name: 'Physics 201', teacher: 'Prof. Johnson', schedule: 'Tue/Thu 2:00 PM', progress: 40 },
        { id: '3', name: 'English Literature', teacher: 'Ms. Davis', schedule: 'Fri 9:00 AM', progress: 60 },
    ]);

    return (
        <StudentPortalShell activeTab="courses">
            <div className="space-y-8">
                <div className="bg-card p-6 rounded-sm shadow-sm border border-black/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-2xl font-black text-primary flex items-center gap-3 italic uppercase">
                        My Enrolled Courses
                    </h2>
                    <div className="w-full md:w-72">
                        <Input icon={Search} placeholder="Search courses..." />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {courses.map(course => (
                        <div key={course.id} className="bg-card border border-black/5 rounded-sm overflow-hidden hover:shadow-2xl transition-all duration-500 group flex flex-col h-full">
                            <div className="h-4 w-full bg-primary/20 group-hover:bg-primary transition-colors"></div>
                            <div className="p-8 flex flex-col flex-1">
                                <div className="flex justify-between items-start mb-6">
                                    <h3 className="text-xl font-black text-card-text group-hover:text-primary transition-colors leading-tight">{course.name}</h3>
                                    <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-black italic">{course.progress}%</div>
                                </div>
                                <div className="space-y-3 mb-8 flex-1">
                                    <div className="flex items-center gap-3 text-card-text/60 font-bold italic text-sm">
                                        <User className="w-4 h-4 text-primary" /> {course.teacher}
                                    </div>
                                    <div className="flex items-center gap-3 text-card-text/60 font-bold italic text-sm">
                                        <Clock className="w-4 h-4 text-primary" /> {course.schedule}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-card-text/40">
                                        <span>Course Progress</span>
                                        <span>{course.progress}%</span>
                                    </div>
                                    <div className="w-full bg-black/5 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-primary h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(79,70,229,0.4)]"
                                            style={{ width: `${course.progress}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <button className="mt-8 w-full py-4 bg-theme-bg border border-primary/20 text-primary font-black uppercase tracking-widest text-xs rounded-sm hover:bg-primary hover:text-white transition-all transform group-hover:scale-[1.02]">
                                    Enter Classroom
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </StudentPortalShell>
    );
}
