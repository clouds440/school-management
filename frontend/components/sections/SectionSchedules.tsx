'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { ApiError, SectionSchedule, Section, Role } from '@/types';
import { useGlobal } from '@/context/GlobalContext';
import { useAuth } from '@/context/AuthContext';
import { ModalForm } from '@/components/ui/ModalForm';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Clock, Plus, MapPin, CalendarDays, ServerCrash, Pencil, Trash2 } from 'lucide-react';
import { Loading } from '@/components/ui/Loading';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

const DAY_OPTIONS = [
    { value: '0', label: 'Sunday' },
    { value: '1', label: 'Monday' },
    { value: '2', label: 'Tuesday' },
    { value: '3', label: 'Wednesday' },
    { value: '4', label: 'Thursday' },
    { value: '5', label: 'Friday' },
    { value: '6', label: 'Saturday' },
];

interface SectionSchedulesProps {
    section: Section;
    role: Role;
}

export default function SectionSchedules({ section, role }: SectionSchedulesProps) {
    const { token } = useAuth();
    const { dispatch } = useGlobal();

    const [schedules, setSchedules] = useState<SectionSchedule[]>([]);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<SectionSchedule | null>(null);
    const [deletingSchedule, setDeletingSchedule] = useState<SectionSchedule | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        day: '1',
        startTime: '09:00',
        endTime: '10:00',
        room: section.room || '',
    });

    const isManagerOrAdmin = role === Role.ORG_ADMIN || role === Role.ORG_MANAGER;

    const fetchSchedules = useCallback(async () => {
        if (!token) return;
        setFetching(true);
        try {
            const data = await api.org.getSchedules(section.id, token);
            setSchedules(data || []);
            setError(null);
        } catch (err: unknown) {
            setError((err as ApiError)?.message || 'Failed to fetch schedules');
        } finally {
            setFetching(false);
        }
    }, [section.id, token]);

    useEffect(() => {
        fetchSchedules();
    }, [fetchSchedules]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        setIsSubmitting(true);
        try {
            const data = {
                day: parseInt(formData.day, 10),
                startTime: formData.startTime,
                endTime: formData.endTime,
                room: formData.room || undefined,
            };

            if (editingSchedule) {
                await api.org.updateSchedule(section.id, editingSchedule.id, data, token);
                dispatch({ type: 'TOAST_ADD', payload: { message: 'Schedule updated successfully', type: 'success' } });
            } else {
                await api.org.createSchedule(section.id, data, token);
                dispatch({ type: 'TOAST_ADD', payload: { message: 'Schedule added successfully', type: 'success' } });
            }

            setIsModalOpen(false);
            setEditingSchedule(null);
            setFormData({
                day: '1',
                startTime: '09:00',
                endTime: '10:00',
                room: section.room || '',
            });
            fetchSchedules();
        } catch (err: unknown) {
            dispatch({
                type: 'TOAST_ADD',
                payload: { message: (err as ApiError)?.message || 'Error saving schedule', type: 'error' }
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!token || !deletingSchedule) return;

        setIsSubmitting(true);
        try {
            await api.org.deleteSchedule(section.id, deletingSchedule.id, token);
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Schedule removed successfully', type: 'success' } });
            setIsDeleteDialogOpen(false);
            setDeletingSchedule(null);
            fetchSchedules();
        } catch (err: unknown) {
            dispatch({
                type: 'TOAST_ADD',
                payload: { message: (err as ApiError)?.message || 'Error deleting schedule', type: 'error' }
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditModal = (schedule: SectionSchedule) => {
        setEditingSchedule(schedule);
        setFormData({
            day: String(schedule.day),
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            room: schedule.room || '',
        });
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        setEditingSchedule(null);
        setFormData({
            day: '1',
            startTime: '09:00',
            endTime: '10:00',
            room: section.room || '',
        });
        setIsModalOpen(true);
    };

    if (fetching && schedules.length === 0) {
        return <div className="py-8 flex justify-center"><Loading size="md" /></div>;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-6 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
                <ServerCrash className="w-8 h-8 text-red-500 mb-2" />
                <p className="text-red-500 font-bold">{error}</p>
                <Button onClick={fetchSchedules} className="mt-4" variant="primary">Try Again</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-foreground">Weekly Timetable</h3>
                    <p className="text-sm font-medium text-muted-foreground mt-1">Class timings and room allocations.</p>
                </div>
                <div className="flex items-center gap-3">
                    {isManagerOrAdmin && (
                        <Button onClick={openCreateModal} icon={Plus}>
                            Add Schedule
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {schedules.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-muted-foreground/60 border border-dashed border-border rounded-xl">
                        No schedules defined.
                    </div>
                ) : (
                    schedules.map((schedule) => {
                        const dayLabel = DAY_OPTIONS.find(d => d.value === String(schedule.day))?.label || 'Unknown';
                        return (
                            <div key={schedule.id} className="bg-card text-card-foreground border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between border-b border-border/50 pb-3 mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <CalendarDays className="w-4 h-4 text-primary" />
                                        </div>
                                        <span className="font-bold text-lg">{dayLabel}</span>
                                    </div>
                                    {isManagerOrAdmin && (
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => openEditModal(schedule)}
                                                className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                                                title="Edit Slot"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => { setDeletingSchedule(schedule); setIsDeleteDialogOpen(true); }}
                                                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                                title="Remove Slot"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <Clock className="w-4 h-4 text-primary" />
                                        <span className="font-medium text-sm">{schedule.startTime} - {schedule.endTime}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <MapPin className="w-4 h-4 text-primary" />
                                        <span className="font-medium text-sm">{schedule.room || section.room || 'TBD'}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <ModalForm
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingSchedule(null); }}
                title={editingSchedule ? "Edit Section Schedule" : "Add Section Schedule"}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                submitText={editingSchedule ? "Update Schedule" : "Save Schedule"}
                showSubmit={true}
            >
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Day of Week</Label>
                        <CustomSelect
                            options={DAY_OPTIONS}
                            value={formData.day}
                            onChange={(val) => setFormData({ ...formData, day: val })}
                            placeholder="Select Day"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startTime">Start Time</Label>
                            <Input
                                id="startTime"
                                type="time"
                                required
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endTime">End Time</Label>
                            <Input
                                id="endTime"
                                type="time"
                                required
                                value={formData.endTime}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="room">Room (Optional)</Label>
                        <Input
                            id="room"
                            type="text"
                            placeholder="Override section room"
                            value={formData.room}
                            onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                            icon={MapPin}
                        />
                    </div>
                </div>
            </ModalForm>

            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={handleDelete}
                title="Remove Schedule Slot"
                description="Are you sure you want to remove this schedule slot? This action cannot be undone."
                confirmText="Remove Slot"
                isDestructive={true}
            />
        </div>
    );
}
