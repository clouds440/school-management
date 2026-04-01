'use client';

import { useState, useEffect } from 'react';
import { X, Camera, UserPlus, UserMinus, Shield, Loader2, Save } from 'lucide-react';
import { Chat, User, Role } from '@/types';
import { api, getPublicUrl } from '@/lib/api';
import { BrandIcon } from '../ui/Brand';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useGlobal } from '@/context/GlobalContext';

interface ChatSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    chat: Chat;
    currentUser: User;
    token: string;
    onUpdate: () => void;
    onAddParticipants: () => void;
}

export function ChatSettingsModal({
    isOpen,
    onClose,
    chat,
    currentUser,
    token,
    onUpdate,
    onAddParticipants
}: ChatSettingsModalProps) {
    const { dispatch } = useGlobal();
    const [name, setName] = useState(chat.name || '');
    const [avatarUrl, setAvatarUrl] = useState(chat.avatarUrl || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName(chat.name || '');
            setAvatarUrl(chat.avatarUrl || '');
        }
    }, [isOpen, chat]);

    if (!isOpen) return null;

    const isGroupAdmin = currentUser.role === Role.ORG_ADMIN || chat.creatorId === currentUser.id;

    const handleSave = async () => {
        if (!name.trim()) return;
        try {
            setIsSaving(true);
            await api.chat.updateChat(chat.id, { name: name.trim(), avatarUrl }, token);
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Chat settings updated', type: 'success' } });
            onUpdate();
            onClose();
        } catch (err) {
            console.error(err);
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Failed to update settings', type: 'error' } });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !currentUser.organizationId) return;

        try {
            setIsUploading(true);
            const res = await api.files.uploadFile(currentUser.organizationId, 'chat_avatar', chat.id, file, token);
            setAvatarUrl(res.url || res.path);
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Image uploaded. Save to apply.', type: 'info' } });
        } catch (err) {
            console.error(err);
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Upload failed', type: 'error' } });
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveParticipant = async (userId: string) => {
        try {
            await api.chat.removeParticipant(chat.id, userId, token);
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Participant removed', type: 'success' } });
            onUpdate();
        } catch (err) {
            console.error(err);
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Failed to remove', type: 'error' } });
        }
    };

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Chat Settings</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Group Management</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-sm transition-colors text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {/* Identification Section */}
                    <div className="space-y-6">
                        <div className="flex flex-col items-center">
                            <div className="relative group/avatar">
                                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100 shadow-inner group-hover/avatar:border-primary/20 transition-all">
                                    {avatarUrl ? (
                                        <img src={getPublicUrl(avatarUrl)} alt={name} className="w-full h-full object-cover" />
                                    ) : (
                                        <BrandIcon variant="user" user={{ name }} size="lg" className="w-full h-full" />
                                    )}
                                </div>
                                {isGroupAdmin && (
                                    <label
                                        className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg cursor-pointer transform hover:scale-110 active:scale-95 transition-all border-2 border-white"
                                        title="Change Image"
                                    >
                                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploading} />
                                        {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Group Name</label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter group name"
                                    disabled={!isGroupAdmin}
                                    className="font-bold text-gray-700 bg-gray-50/50 focus:bg-white"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100" />

                    {/* Participants Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block ml-1">Participants</label>
                            {isGroupAdmin && (
                                <button
                                    onClick={() => { onClose(); onAddParticipants(); }}
                                    className="text-[11px] font-black text-primary hover:text-primary-hover flex items-center bg-primary/5 px-3 py-1 rounded-sm transition-all"
                                >
                                    <UserPlus size={14} className="mr-1.5" />
                                    ADD NEW
                                </button>
                            )}
                        </div>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {chat.participants?.filter(p => p.isActive).map(p => (
                                <div key={p.id} className="flex items-center justify-between p-2 rounded-sm border border-gray-50 bg-gray-50/30 group/item transition-all hover:bg-white hover:border-gray-100 hover:shadow-sm">
                                    <div className="flex items-center space-x-3">
                                        <BrandIcon variant="user" user={p.user} size="sm" className="w-8 h-8" />
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-gray-800 truncate">
                                                {p.user?.name} {p.userId === currentUser.id && '(You)'}
                                            </p>
                                            <div className="flex items-center space-x-2">
                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                                                    {p.user?.role?.toLowerCase().replace('_', ' ')}
                                                </p>
                                                {p.userId === chat.creatorId && (
                                                    <span className="bg-primary/10 text-primary text-[8px] font-black px-1.5 rounded-sm flex items-center">
                                                        <Shield size={8} className="mr-1" />
                                                        CREATOR
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {isGroupAdmin && p.userId !== currentUser.id && p.userId !== chat.creatorId && (
                                        <button
                                            onClick={() => handleRemoveParticipant(p.userId)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-sm opacity-0 group-hover/item:opacity-100 transition-all"
                                            title="Remove from group"
                                        >
                                            <UserMinus size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                {isGroupAdmin && (
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
                        <Button variant="secondary" onClick={onClose} py="py-2" px="px-4">Cancel</Button>
                        <Button
                            variant="primary"
                            onClick={handleSave}
                            disabled={isSaving || !name.trim()}
                            icon={Save}
                            py="py-2"
                            px="px-6"
                            isLoading={isSaving}
                        >
                            Save Changes
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
