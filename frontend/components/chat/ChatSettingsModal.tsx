'use client';

import { useState, useEffect } from 'react';
import { X, UserPlus, UserMinus, Shield, Loader2, Save, Lock, Unlock } from 'lucide-react';
import { Chat, User, Role, ChatParticipantRole } from '@/types';
import { api } from '@/lib/api';
import { BrandIcon } from '../ui/Brand';
import { PhotoUploadPicker } from '../ui/PhotoUploadPicker';
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
    const [readOnly, setReadOnly] = useState(chat.readOnly || false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName(chat.name || '');
            setAvatarUrl(chat.avatarUrl || '');
            setReadOnly(chat.readOnly || false);
        }
    }, [isOpen, chat]);

    if (!isOpen) return null;

    const isGroupAdmin = currentUser.role === Role.ORG_ADMIN || chat.creatorId === currentUser.id;

    const handleSave = async () => {
        if (!name.trim()) return;
        try {
            setIsSaving(true);
            await api.chat.updateChat(chat.id, { name: name.trim(), avatarUrl, readOnly }, token);
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

    const handleAvatarUpload = async (file: File) => {
        const uploadOrgId = currentUser.organizationId || chat.organizationId;
        if (!uploadOrgId) {
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Cannot determine organization for upload', type: 'error' } });
            return;
        }

        try {
            setIsUploading(true);
            // 1. Upload the file
            const res = await api.files.uploadFile(uploadOrgId, 'chat_avatar', chat.id, file, token);
            const newAvatarUrl = res.url || res.path;
            setAvatarUrl(newAvatarUrl);

            // 2. Immediate live update to the group chat record
            await api.chat.updateChat(chat.id, { avatarUrl: newAvatarUrl }, token);

            // 3. Notify parent (optional since socket will also trigger it, but good for local snappiness)
            onUpdate();

            dispatch({ type: 'TOAST_ADD', payload: { message: 'Group picture updated successfully', type: 'success' } });
        } catch (err) {
            console.error(err);
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Failed to update group picture', type: 'error' } });
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

    const handleUpdateParticipantRole = async (userId: string, newRole: 'ADMIN' | 'MOD' | 'MEMBER') => {
        try {
            await api.chat.updateParticipantRole(chat.id, userId, newRole, token);
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Participant role updated', type: 'success' } });
            onUpdate();
        } catch (err) {
            console.error(err);
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Failed to update role', type: 'error' } });
        }
    };

    return (
        <div className="fixed inset-0 z-200 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pt-[5h] sm:pt-[8vh] animate-in fade-in duration-300">
            <div className="bg-card w-full max-w-md rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-border">
                {/* Header */}
                <div className="p-4 border-b border-border flex justify-between items-center bg-card/5">
                    <div>
                        <h3 className="text-xl font-bold text-foreground">Chat Settings</h3>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Group Management</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-card/10 rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {/* Identification Section */}
                    <div className="space-y-6">
                        <div className="flex flex-col items-center">
                            <PhotoUploadPicker
                                currentImageUrl={avatarUrl}
                                onFileReady={handleAvatarUpload}
                                type="org"
                                disabled={!isGroupAdmin || isUploading}
                                hint={isGroupAdmin ? "Click to change group picture (256x256 recommended)" : "Only admins can change picture"}
                            />
                            {isUploading && (
                                <div className="mt-2 flex items-center text-[10px] text-primary font-bold animate-pulse">
                                    <Loader2 size={12} className="mr-1.5 animate-spin" />
                                    UPLOADING...
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 block ml-1">Group Name</label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter group name"
                                    disabled={!isGroupAdmin}
                                    className="font-bold text-foreground bg-card/5 focus:bg-card/10"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Read-Only Mode Toggle */}
                    {isGroupAdmin && (
                        <div className="flex items-center justify-between p-3 rounded-lg border border-border/10 bg-card/30">
                            <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg ${readOnly ? 'bg-primary/10 text-primary' : 'bg-muted/10 text-muted-foreground'}`}>
                                    {readOnly ? <Lock size={18} /> : <Unlock size={18} />}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-foreground">Read-Only Mode</p>
                                    <p className="text-[10px] text-muted-foreground">Only admins and moderators can send messages</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setReadOnly(!readOnly)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${readOnly ? 'bg-primary' : 'bg-muted'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${readOnly ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    )}

                    <div className="h-px bg-border" />

                    {/* Participants Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest block ml-1">Participants</label>
                            {isGroupAdmin && (
                                <button
                                    onClick={() => { onClose(); onAddParticipants(); }}
                                    className="text-[11px] font-black text-primary hover:text-primary-hover flex items-center bg-primary/5 px-3 py-1 rounded-lg transition-all"
                                >
                                    <UserPlus size={14} className="mr-1.5" />
                                    ADD NEW
                                </button>
                            )}
                        </div>

                        <div className="space-y-2 max-h-75 overflow-y-auto pr-2 custom-scrollbar">
                            {chat.participants?.filter(p => p.isActive).map(p => {
                                const participantRole = p.role || ChatParticipantRole.MEMBER;
                                const isCreator = p.userId === chat.creatorId;
                                return (
                                    <div key={p.id} className="flex items-center justify-between p-2 rounded-lg border border-border/10 bg-card/30 group/item transition-all hover:bg-card/80 hover:border-border hover:shadow-sm">
                                        <div className="flex items-center space-x-3">
                                            <BrandIcon variant="user" user={p.user} size="sm" className="w-8 h-8" />
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-foreground truncate">
                                                    {p.user?.name} {p.userId === currentUser.id && '(You)'}
                                                </p>
                                                <div className="flex items-center space-x-2">
                                                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">
                                                        {p.user?.role?.toLowerCase().replace('_', ' ')}
                                                    </p>
                                                    {isCreator && (
                                                        <span className="bg-primary/10 text-primary text-[8px] font-black px-1.5 rounded-lg flex items-center">
                                                            <Shield size={8} className="mr-1" />
                                                            CREATOR
                                                        </span>
                                                    )}
                                                    {!isCreator && participantRole !== 'MEMBER' && (
                                                        <span className={`text-[8px] font-black px-1.5 rounded-lg flex items-center ${participantRole === 'MOD' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                                                            {participantRole}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            {isGroupAdmin && !isCreator && p.userId !== currentUser.id && (
                                                <select
                                                    value={participantRole}
                                                    onChange={(e) => handleUpdateParticipantRole(p.userId, e.target.value as 'ADMIN' | 'MOD' | 'MEMBER')}
                                                    className="text-[9px] font-bold bg-card/50 border border-border/30 rounded px-1.5 py-1 focus:outline-none focus:border-primary/50"
                                                >
                                                    <option value="MEMBER">Member</option>
                                                    <option value="MOD">Mod</option>
                                                    <option value="ADMIN">Admin</option>
                                                </select>
                                            )}
                                            {isGroupAdmin && p.userId !== currentUser.id && p.userId !== chat.creatorId && (
                                                <button
                                                    onClick={() => handleRemoveParticipant(p.userId)}
                                                    className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover/item:opacity-100 transition-all"
                                                    title="Remove from group"
                                                >
                                                    <UserMinus size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                {isGroupAdmin && (
                    <div className="p-4 bg-card/5 border-t border-border flex justify-end space-x-3">
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
