'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Student } from '@/types';
import StudentForm from '@/components/forms/StudentForm';
import { Settings } from 'lucide-react';

interface ProfileTabProps {
    student: Student;
    orgSlug: string;
}

export default function ProfileTab({ student, orgSlug }: ProfileTabProps) {
    return (
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden mt-8 animate-fade-in-up text-left">
            <div className="p-8 border-b border-primary/10 bg-primary/5 flex items-center gap-4">
                <div className="p-4 bg-primary/10 rounded-sm shadow-inner group transition-all">
                    <Settings className="w-8 h-8 text-primary group-hover:rotate-180 transition-transform duration-700" />
                </div>
                <div>
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Security & Profile</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">
                        Authorized modification of student identification data
                    </p>
                </div>
            </div>

            <div className="p-8 md:p-12">
                <StudentForm 
                    orgSlug={orgSlug} 
                    initialData={student} 
                    isProfile={true} 
                />
            </div>
        </div>
    );
}
