'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { CustomMultiSelect, MultiSelectOption } from '@/components/ui/CustomMultiSelect';
import { User, Send, Users, Search, Shield, User as UserIcon } from 'lucide-react';
import { useGlobal } from '@/context/GlobalContext';
import { Role } from '@/types';

const STABLE_EMPTY_ARRAY: string[] = [];

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onChatCreated?: (chatId: string) => void;
    mode?: 'CREATE' | 'ADD_PARTICIPANTS';
    chatId?: string;
    existingParticipantIds?: string[];
}

export function NewChatModal({ isOpen, onClose, onChatCreated, mode = 'CREATE', chatId, existingParticipantIds = STABLE_EMPTY_ARRAY }: Props) {
    const { token, user } = useAuth();
    const { dispatch } = useGlobal();

    const [type, setType] = useState<'DIRECT' | 'GROUP'>(mode === 'ADD_PARTICIPANTS' ? 'GROUP' : 'DIRECT');
    const [recipientId, setRecipientId] = useState('');
    const [participantIds, setParticipantIds] = useState<string[]>([]);
    const [groupName, setGroupName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const [contactableUsers, setContactableUsers] = useState<MultiSelectOption[]>([]);
    const [isFetchingUsers, setIsFetchingUsers] = useState(false);
    
    // For Teachers: Quick add from Section
    const [sections, setSections] = useState<{ value: string; label: string }[]>([]);
    const [selectedSectionId, setSelectedSectionId] = useState('');
    const [isFetchingSections, setIsFetchingSections] = useState(false);
    const [isApplyingPreset, setIsApplyingPreset] = useState(false);

    useEffect(() => {
        if (!isOpen || !token || user?.role !== Role.TEACHER) return;
        
        const fetchSections = async () => {
            setIsFetchingSections(true);
            try {
                const res = await api.org.getSections(token, { my: true });
                setSections(res.data.map(s => ({ value: s.id, label: s.name })));
            } catch (err) {
                console.error('Failed to fetch sections', err);
            } finally {
                setIsFetchingSections(false);
            }
        };
        fetchSections();
    }, [isOpen, token, user?.role]);

    const handleSectionSelect = async (sectionId: string) => {
        setSelectedSectionId(sectionId);
        if (!sectionId || !token) return;
        
        setIsFetchingUsers(true);
        try {
            const section = await api.org.getSection(sectionId, token);
            if (section.students) {
                const studentIds = section.students.map(s => s.userId);
                // Merge with existing
                setParticipantIds(prev => Array.from(new Set([...prev, ...studentIds])));
                dispatch({ type: 'TOAST_ADD', payload: { message: `Added ${section.students.length} students from ${section.name}`, type: 'success' } });
            }
        } catch (err) {
            console.error('Failed to fetch section students', err);
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Failed to add section students', type: 'error' } });
        } finally {
            setIsFetchingUsers(false);
        }
    };

    useEffect(() => {
        if (!isOpen || !token) return;

        const fetchUsers = async () => {
            setIsFetchingUsers(true);
            try {
                // Fetch explicitly from chat endpoint instead of mail contacts
                const users = await api.chat.searchUsers(token);
                // Filter out existing participants if in add mode
                let filteredUsers = mode === 'ADD_PARTICIPANTS' 
                    ? users.filter(u => !existingParticipantIds.includes(u.id))
                    : users;

                // POLICY: No 1-to-1 chats with students. 
                // Exclude students if we are in DIRECT mode
                if (type === 'DIRECT') {
                    filteredUsers = filteredUsers.filter(u => u.role !== Role.STUDENT);
                }

                setContactableUsers(filteredUsers.map(u => ({
                    value: u.id,
                    label: `${u.name || u.email}${u.role ? ` (${u.role.replace('_', ' ')})` : ''}`,
                    icon: u.role && (u.role.includes('ADMIN') || u.role.includes('MANAGER')) ? Shield : UserIcon
                })));
            } catch (error) {
                console.error('Failed to fetch contactable users', error);
                dispatch({ type: 'TOAST_ADD', payload: { message: 'Failed to load contacts', type: 'error' } });
            } finally {
                setIsFetchingUsers(false);
            }
        };

        fetchUsers();
    }, [isOpen, token, dispatch, mode, existingParticipantIds, type]);

    const applyPresetGroup = async (preset: { label: string; role?: string; source?: 'TEACHERS' | 'STUDENTS' }) => {
        if (!token) return;
        setIsApplyingPreset(true);
        try {
            let ids: string[] = [];

            if (preset.source === 'TEACHERS') {
                const res = await api.org.getTeachers(token, { page: 1, limit: 1000 });
                ids = res.data.map(t => t.user.id);
            } else if (preset.source === 'STUDENTS') {
                const res = await api.org.getStudents(token, { page: 1, limit: 1000 });
                ids = res.data.map(s => s.userId || s.user?.id).filter(Boolean) as string[];
            } else if (preset.role) {
                const users = await api.chat.searchUsers(token);
                ids = users.filter(u => u.role === preset.role).map(u => u.id);
            }

            // Merge into participants
            setParticipantIds(prev => Array.from(new Set([...prev, ...ids])));
            dispatch({ type: 'TOAST_ADD', payload: { message: `Added ${ids.length} users to the group`, type: 'success' } });
            setGroupName(prev => prev || preset.label.replace('[GROUP] ', ''));
        } catch (err) {
            console.error('Failed to apply group preset', err);
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Failed to add preset members', type: 'error' } });
        } finally {
            setIsApplyingPreset(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        try {
            setIsLoading(true);

            if (mode === 'ADD_PARTICIPANTS') {
                if (!chatId) throw new Error('Chat ID is missing');
                if (participantIds.length === 0) throw new Error('Please select at least one person');
                await api.chat.addParticipants(chatId, participantIds, token);
                dispatch({ type: 'TOAST_ADD', payload: { message: 'Participants added successfully', type: 'success' } });
                onChatCreated?.(chatId);
                onClose();
                return;
            }

            let newChatId: string;
            if (type === 'DIRECT') {
                if (!recipientId) throw new Error('Please select a recipient');
                const chat = await api.chat.createDirectChat(recipientId, token);
                newChatId = chat.id;
            } else {
                if (!groupName) throw new Error('Please enter a group name');
                if (participantIds.length === 0) throw new Error('Please select at least one participant');
                const chat = await api.chat.createGroupChat(groupName, participantIds, token);
                newChatId = chat.id;
            }

            dispatch({ type: 'TOAST_ADD', payload: { message: 'Chat created successfully', type: 'success' } });
            onChatCreated?.(newChatId);
            onClose();
        } catch (error) {
            const err = error as Error;
            dispatch({ type: 'TOAST_ADD', payload: { message: err.message || 'Failed to process request', type: 'error' } });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === 'ADD_PARTICIPANTS' ? "Add Participants" : "Start New Conversation"}
            maxWidth="max-w-md"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {mode === 'CREATE' && (
                    <div>
                        <Label>Chat Type</Label>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <button
                                type="button"
                                onClick={() => setType('DIRECT')}
                                className={`flex flex-col items-center justify-center p-4 rounded-sm border transition-all ${
                                    type === 'DIRECT' 
                                        ? 'border-primary bg-primary/5 ring-2 ring-primary/10 text-primary' 
                                        : 'border-white/10 bg-primary/5 text-card-text/40 hover:border-white/20'
                                }`}
                            >
                                <UserIcon className="w-6 h-6 mb-2" />
                                <span className="text-xs font-black uppercase tracking-widest">Direct Message</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('GROUP')}
                                className={`flex flex-col items-center justify-center p-4 rounded-sm border transition-all ${
                                    type === 'GROUP' 
                                        ? 'border-primary bg-primary/5 ring-2 ring-primary/10 text-primary' 
                                        : 'border-white/10 bg-primary/5 text-card-text/40 hover:border-white/20'
                                }`}
                            >
                                <Users className="w-6 h-6 mb-2" />
                                <span className="text-xs font-black uppercase tracking-widest">Group Chat</span>
                            </button>
                        </div>
                    </div>
                )}

                {type === 'GROUP' && mode === 'CREATE' && (
                    <div>
                        <Label>Group Name <span className="text-red-500">*</span></Label>
                        <Input
                            required
                            value={groupName}
                            onChange={e => setGroupName(e.target.value)}
                            placeholder={user?.role === Role.PLATFORM_ADMIN || user?.role === Role.SUPER_ADMIN ? "e.g. Platform Announcement" : "e.g. Study Group"}
                            icon={Users}
                        />
                        {/* Quick group presets based on role/permissions */}
                        <div className="mt-3">
                            <Label className="text-[10px] uppercase font-black text-primary/70 mb-2">Quick Groups</Label>
                            <div className="flex flex-wrap gap-2">
                                {/* Org-level presets for admins/managers */}
                                {(user?.role === Role.ORG_ADMIN || user?.role === Role.ORG_MANAGER) && (
                                    <>
                                        <button type="button" disabled={isApplyingPreset} onClick={() => applyPresetGroup({ label: '[GROUP] All Teachers', source: 'TEACHERS' })} className="px-3 py-1 bg-gray-100 rounded-sm text-sm font-bold">[GROUP] All Teachers</button>
                                        <button type="button" disabled={isApplyingPreset} onClick={() => applyPresetGroup({ label: '[GROUP] All Students', source: 'STUDENTS' })} className="px-3 py-1 bg-gray-100 rounded-sm text-sm font-bold">[GROUP] All Students</button>
                                        <button type="button" disabled={isApplyingPreset} onClick={() => applyPresetGroup({ label: '[GROUP] Org Managers', role: Role.ORG_MANAGER })} className="px-3 py-1 bg-gray-100 rounded-sm text-sm font-bold">[GROUP] Org Managers</button>
                                        <button type="button" disabled={isApplyingPreset} onClick={() => applyPresetGroup({ label: '[GROUP] Org Admins', role: Role.ORG_ADMIN })} className="px-3 py-1 bg-gray-100 rounded-sm text-sm font-bold">[GROUP] Org Admins</button>
                                    </>
                                )}

                                {/* Platform admins can message other platform admins */}
                                {(user?.role === Role.PLATFORM_ADMIN || user?.role === Role.SUPER_ADMIN) && (
                                    <button type="button" disabled={isApplyingPreset} onClick={() => applyPresetGroup({ label: '[GROUP] Platform Admins', role: Role.PLATFORM_ADMIN })} className="px-3 py-1 bg-gray-100 rounded-sm text-sm font-bold">[GROUP] Platform Admins</button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div>
                    <Label>{type === 'DIRECT' ? 'Recipient' : 'Participants'} <span className="text-red-500">*</span></Label>
                    
                    {type === 'GROUP' && user?.role === Role.TEACHER && sections.length > 0 && (
                        <div className="mb-4">
                            <Label className="text-[10px] text-primary/60 font-black uppercase mb-1.5 flex items-center">
                                <Users className="w-3 h-3 mr-1" />
                                Add whole section
                            </Label>
                            <CustomSelect
                                options={sections}
                                value={selectedSectionId}
                                onChange={handleSectionSelect}
                                placeholder="Select section to add all students..."
                                icon={Users}
                            />
                        </div>
                    ) }

                    {type === 'DIRECT' ? (
                        <CustomSelect
                            value={recipientId}
                            onChange={setRecipientId}
                            options={contactableUsers.map(u => ({ ...u, value: u.value }))}
                            placeholder={isFetchingUsers ? "Loading..." : "Select a person..."}
                            searchable
                            disabled={isFetchingUsers}
                            required
                            icon={UserIcon}
                        />
                    ) : (
                        <CustomMultiSelect
                            values={participantIds}
                            onChange={setParticipantIds}
                            options={contactableUsers}
                            placeholder={isFetchingUsers ? "Loading..." : "Select people..."}
                            disabled={isFetchingUsers}
                            icon={Users}
                        />
                    )}
                    <p className="text-[10px] text-card-header font-bold uppercase tracking-widest mt-2 ml-1">
                        {mode === 'ADD_PARTICIPANTS'
                            ? "Select collaborators to join the current group."
                            : type === 'DIRECT' 
                                ? "Start a private one-on-one conversation." 
                                : "Create a group to chat with multiple people at once."}
                    </p>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-white/5 bg-gray-50/5 -mx-8 -mb-8 px-8 pb-8">
                    <Button variant="secondary" onClick={onClose} type="button" px="px-8" py="py-2.5">
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" icon={mode === 'ADD_PARTICIPANTS' ? Users : Send} isLoading={isLoading} px="px-8" py="py-2.5">
                        {mode === 'ADD_PARTICIPANTS' ? 'Add to Group' : 'Start Chat'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
