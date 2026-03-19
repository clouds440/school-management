'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Section, Role } from '@/types';
import { useToast } from '@/context/ToastContext';
import { useParams } from 'next/navigation';
import AssessmentList from '@/components/sections/AssessmentList';

export default function SectionAssessmentsPage() {
    const { token, user } = useAuth();
    const params = useParams();
    const { showToast } = useToast();
    const [section, setSection] = useState<Section | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const sectionId = params.id as string;

    const fetchSection = useCallback(async () => {
        if (!token || !sectionId) return;
        setIsLoading(true);
        try {
            const data = await api.org.getSection(sectionId, token);
            setSection(data);
        } catch (error) {
            console.error('Failed to fetch section:', error);
            showToast('Failed to load section details', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [token, sectionId, showToast]);

    useEffect(() => {
        fetchSection();
    }, [fetchSection]);

    if (isLoading) {
        return (
            <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!section) return null;

    return (
        <div className="space-y-8 mt-8">
             <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
                <div className="p-8">
                    <AssessmentList section={section} role={user?.role as Role} />
                </div>
            </div>
        </div>
    );
}
