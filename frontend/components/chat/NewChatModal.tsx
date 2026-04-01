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

    useEffect(() => {
        if (!isOpen || !token) return;

        const fetchUsers = async () => {
            setIsFetchingUsers(true);
            try {
                // Fetch explicitly from chat endpoint instead of mail contacts
                const users = await api.chat.searchUsers(token);
                // Filter out existing participants if in add mode
                const filteredUsers = mode === 'ADD_PARTICIPANTS' 
                    ? users.filter(u => !existingParticipantIds.includes(u.id))
                    : users;

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
    }, [isOpen, token, dispatch, mode, existingParticipantIds]);

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
                    </div>
                )}

                <div>
                    <Label>{type === 'DIRECT' ? 'Recipient' : 'Participants'} <span className="text-red-500">*</span></Label>
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
