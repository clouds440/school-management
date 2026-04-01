'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useGlobal } from '@/context/GlobalContext';
import { useSocket } from '@/hooks/useSocket';
import { api } from '@/lib/api';
import { getPublicUrl } from '@/lib/utils';
import { Chat, ChatMessage, ChatType, Role, User } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import {
    Search, Plus, Send, MoreVertical, X, Loader2, Image as ImageIcon,
    UserPlus, UserMinus, Trash2, Shield, Info
} from 'lucide-react';
import { MarkdownEditor } from '../ui/MarkdownEditor';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { NewChatModal } from './NewChatModal';

export function ChatLayout() {
    const { token, user } = useAuth();
    const { dispatch } = useGlobal();
    const { socket, subscribe, joinRoom, leaveRoom } = useSocket({ token, userId: user?.id, enabled: !!token });
    const searchParams = useSearchParams();
    const initialChatId = searchParams.get('id');

    const [chats, setChats] = useState<Chat[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(initialChatId);
    const [messages, setMessages] = useState<(ChatMessage & { readBy?: string[] })[]>([]);
    const [isLoadingChats, setIsLoadingChats] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [messageDraft, setMessageDraft] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [stagedFiles, setStagedFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);

    // Modal state for image preview
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

    // Confirm Dialog State
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
        isDestructive?: boolean;
    }>({
        isOpen: false,
        title: '',
        description: '',
        onConfirm: () => { },
    });

    // Refs
    const participantsRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<import('../ui/MarkdownEditor').MarkdownEditorHandle>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Click outside to close participants
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (showParticipants && participantsRef.current && !participantsRef.current.contains(event.target as Node)) {
                const toggleBtn = document.getElementById('participants-toggle');
                if (toggleBtn && !toggleBtn.contains(event.target as Node)) {
                    setShowParticipants(false);
                }
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showParticipants]);

    // Helper: Get avatar with fallback
    const UserAvatar = ({ targetUser, className = "w-8 h-8", groupIcon = false }: { targetUser?: { id?: string; name?: string | null; avatarUrl?: string | null; role?: Role }, className?: string, groupIcon?: boolean }) => {
        const avatarColor = targetUser?.id ? `hsl(${parseInt(targetUser.id.substring(0, 8), 16) % 360}, 70%, 50%)` : '#10b981';

        if (groupIcon) {
            return (
                <div className={`${className} rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20 shadow-sm shrink-0`}>
                    <Plus size={16} />
                </div>
            );
        }

        return (
            <div className={`${className} rounded-full flex items-center justify-center text-white font-bold overflow-hidden border border-gray-100 shadow-sm shrink-0 bg-gray-200`} style={{ backgroundColor: targetUser?.avatarUrl ? 'transparent' : avatarColor }}>
                {targetUser?.avatarUrl ? (
                    <img src={getPublicUrl(targetUser.avatarUrl)} alt="" className="w-full h-full object-cover" />
                ) : (targetUser?.role === Role.ORG_ADMIN || targetUser?.role === Role.ORG_MANAGER) && user?.orgLogoUrl ? (
                    <img src={getPublicUrl(user.orgLogoUrl)} alt="" className="w-full h-full object-cover opacity-90" />
                ) : (
                    <span className="text-[10px] uppercase">{targetUser?.name?.charAt(0) || '?'}</span>
                )}
            </div>
        );
    };

    // 1. Fetch Chat List
    const fetchChats = async () => {
        if (!token) return;
        try {
            const data = await api.chat.getUserChats(token);
            setChats(data);
            setIsLoadingChats(false);
            if (data.length > 0 && !activeChatId) {
                setActiveChatId(data[0].id);
            }
        } catch (err) {
            console.error(err);
            setIsLoadingChats(false);
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Failed to load chats', type: 'error' } });
        }
    };

    useEffect(() => {
        fetchChats();
    }, [token]);

    // 2. Fetch Messages for Active Chat
    useEffect(() => {
        if (!token || !activeChatId) return;
        setIsLoadingMessages(true);
        api.chat.getChatMessages(activeChatId, token, { limit: 50 })
            .then(res => {
                setMessages(res.data);
                setIsLoadingMessages(false);
                setTimeout(scrollToBottom, 100);
                api.chat.markAsRead(activeChatId, '', token).catch(console.error);
            })
            .catch(err => {
                console.error(err);
                setIsLoadingMessages(false);
                dispatch({ type: 'TOAST_ADD', payload: { message: 'Failed to load messages', type: 'error' } });
            });
    }, [token, activeChatId, dispatch]);

    // 3. Setup socket listen
    useEffect(() => {
        if (!subscribe || !token || !user) return;

        const unsubMessage = subscribe('chat:message', (newMsg: unknown) => {
            const message = newMsg as ChatMessage & { sender?: User };

            if (message.chatId === activeChatId) {
                setMessages(prev => {
                    if (prev.some(m => m.id === message.id)) return prev;
                    return [...prev, message];
                });
                setTimeout(scrollToBottom, 50);
                if (message.senderId !== user.id) {
                    api.chat.markAsRead(activeChatId, message.id, token).catch(console.error);
                }
            }

            setChats(prevChats => {
                const chatIndex = prevChats.findIndex(c => c.id === message.chatId);
                if (chatIndex > -1) {
                    const updatedChat = {
                        ...prevChats[chatIndex],
                        updatedAt: new Date().toISOString(),
                        messages: [message]
                    };
                    const newChats = [...prevChats];
                    newChats.splice(chatIndex, 1);
                    newChats.unshift(updatedChat);
                    return newChats;
                } else {
                    fetchChats();
                    return prevChats;
                }
            });
        });

        const unsubRead = subscribe('chat:read', (data: unknown) => {
            const readData = data as { chatId: string; userId: string; messageId: string };
            if (readData.chatId === activeChatId) {
                setMessages(prev => prev.map(m => {
                    if (m.senderId !== readData.userId && readData.messageId && readData.messageId >= m.id) {
                        const readBy = Array.from(new Set([...(m.readBy || []), readData.userId]));
                        return { ...m, readBy };
                    }
                    return m;
                }));
            }
        });

        const unsubDelete = subscribe('chat:message:delete', (deletedMsg: unknown) => {
            const message = deletedMsg as ChatMessage;
            if (message.chatId === activeChatId) {
                setMessages(prev => prev.map(m => m.id === message.id ? { ...m, ...message } : m));
            }
            setChats(prev => prev.map(c => {
                if (c.id === message.chatId && c.messages?.[0]?.id === message.id) {
                    return { ...c, messages: [{ ...c.messages[0], ...message }] };
                }
                return c;
            }));
        });

        return () => {
            unsubMessage();
            unsubRead();
            unsubDelete();
        };
    }, [subscribe, activeChatId, token, user, dispatch]);

    // 4. Join/Leave rooms
    useEffect(() => {
        if (activeChatId && joinRoom && leaveRoom) {
            joinRoom(`chat:${activeChatId}`);
            return () => leaveRoom(`chat:${activeChatId}`);
        }
    }, [activeChatId, joinRoom, leaveRoom]);

    // 5. Image click handler for thumbnails
    useEffect(() => {
        if (!messagesContainerRef.current) return;

        const handleImageClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'IMG' && target.closest('.message-content')) {
                const imgSrc = (target as HTMLImageElement).src;
                if (imgSrc) {
                    setPreviewImageUrl(imgSrc);
                }
            }
        };

        const container = messagesContainerRef.current;
        container.addEventListener('click', handleImageClick);

        return () => container.removeEventListener('click', handleImageClick);
    }, []); // Attach once; images are re-rendered but container remains

    const activeChat = useMemo(() => chats.find(c => c.id === activeChatId), [chats, activeChatId]);
    const activeChatParticipantIds = useMemo(() => activeChat?.participants?.map(p => p.userId) || [], [activeChat]);

    const handleSendMessage = async () => {
        if (!token || !activeChatId || (!messageDraft.trim() && stagedFiles.length === 0)) return;
        try {
            setIsSending(true);
            let finalContent = messageDraft.trim();

            if (stagedFiles.length > 0) {
                setIsUploading(true);
                const orgId = user?.orgId;
                if (!orgId) throw new Error('Organization ID missing');

                const uploadResults = await Promise.all(
                    stagedFiles.map(file => api.files.uploadFile(orgId, 'chat', activeChatId, file, token))
                );

                const attachmentLinks = uploadResults.map((res, i) => {
                    const file = stagedFiles[i];
                    const url = res.url || res.path || '';
                    return file.type.startsWith('image/')
                        ? `\n![${file.name}](${url})`
                        : `\n[${file.name}](${url})`;
                }).join('');

                finalContent += attachmentLinks;
                setStagedFiles([]);
                setIsUploading(false);
            }

            const res = await api.chat.sendMessage(activeChatId, finalContent || 'Sent an attachment', token);
            setMessageDraft('');
            setIsSending(false);
            textareaRef.current?.focus();
            api.chat.markAsRead(activeChatId, '', token).catch(console.error);
        } catch (err) {
            const error = err as Error;
            console.error(error);
            setIsSending(false);
            setIsUploading(false);
            dispatch({ type: 'TOAST_ADD', payload: { message: error.message || 'Failed to send message', type: 'error' } });
        }
    };

    const handleDeleteMessage = (messageId: string) => {
        if (!token || !activeChatId) return;

        setConfirmConfig({
            isOpen: true,
            title: 'Delete Message?',
            description: 'Are you sure you want to delete this message? This action cannot be undone.',
            isDestructive: true,
            onConfirm: async () => {
                try {
                    await api.chat.deleteMessage(activeChatId, messageId, token);
                } catch (err) {
                    console.error(err);
                    dispatch({ type: 'TOAST_ADD', payload: { message: 'Failed to delete message', type: 'error' } });
                }
            }
        });
    };

    const handleRemoveParticipant = (participantUserId: string) => {
        if (!token || !activeChatId) return;

        const participantName = activeChat?.participants?.find(p => p.userId === participantUserId)?.user?.name || 'this participant';

        setConfirmConfig({
            isOpen: true,
            title: 'Remove Participant?',
            description: `Are you sure you want to remove ${participantName} from the group?`,
            isDestructive: true,
            onConfirm: async () => {
                try {
                    await api.chat.removeParticipant(activeChatId, participantUserId, token);
                    dispatch({ type: 'TOAST_ADD', payload: { message: 'Participant removed', type: 'success' } });
                    fetchChats(); // Refresh chat data for participants list
                } catch (err) {
                    console.error(err);
                    dispatch({ type: 'TOAST_ADD', payload: { message: 'Failed to remove participant', type: 'error' } });
                }
            }
        });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        if (stagedFiles.length + files.length > 5) {
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Maximum 5 attachments allowed', type: 'info' } });
            return;
        }

        setStagedFiles(prev => [...prev, ...files]);
        e.target.value = '';
    };

    const removeStagedFile = (index: number) => {
        setStagedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleChatCreated = (newChatId: string) => {
        setActiveChatId(newChatId);
        fetchChats();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter') {
            if (e.ctrlKey) {
                const target = e.currentTarget;
                if (!target) return;
                const start = target.selectionStart || 0;
                const end = target.selectionEnd || 0;
                const value = target.value;
                setMessageDraft(value.substring(0, start) + "\n" + value.substring(end));
                setTimeout(() => {
                    if (target) {
                        try {
                            target.setSelectionRange(start + 1, start + 1);
                        } catch (e) {
                            console.warn('Failed to set selection range', e);
                        }
                    }
                }, 0);
                return;
            }
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleEditorFocus = () => {
        if (token && activeChatId) {
            api.chat.markAsRead(activeChatId, '', token).catch(console.error);
        }
    };

    const isGroupAdmin = useMemo(() => {
        if (!activeChat || !user) return false;
        if (user.role === Role.ORG_ADMIN) return true;
        return activeChat.creatorId === user.id;
    }, [activeChat, user]);

    if (!user) return null;

    return (
        <div className="flex h-full bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
            {/* Sidebar List */}
            <div className={`w-full max-w-xs md:max-w-sm border-r border-gray-100 flex flex-col bg-gray-50/50 ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-100 bg-white flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800 tracking-tight">Chats</h2>
                    {user.role !== Role.STUDENT && (
                        <Button
                            onClick={() => setIsNewChatModalOpen(true)}
                            variant="secondary"
                            px="px-3"
                            py="py-2"
                            className="rounded-sm shadow-none border-none bg-transparent hover:bg-gray-100 text-primary" // rounded-sm instead of rounded-full
                            icon={Plus}
                        />
                    )}
                </div>

                <div className="p-3 bg-white border-b border-gray-100">
                    <Input
                        icon={Search}
                        type="text"
                        placeholder="Search chats..."
                        className="bg-gray-100 border-none py-2! pl-10! shadow-none text-sm focus-within:bg-white transition-all ring-primary/20 rounded-sm" // ensure rounded-sm
                    />
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {isLoadingChats ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-400" /></div>
                    ) : chats.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">No chats found.</div>
                    ) : (
                        chats.map(chat => {
                            const otherUsers = chat.participants?.filter(p => (p.userId !== user.id) && p.isActive) || [];
                            const displayName = chat.type === ChatType.GROUP
                                ? chat.name || 'Unnamed Group'
                                : otherUsers[0]?.user?.name || 'Unknown User';

                            const lastMsg = chat.messages?.[0];
                            const isActive = activeChatId === chat.id;

                            return (
                                <button
                                    key={chat.id}
                                    onClick={() => setActiveChatId(chat.id)}
                                    className={`w-full flex items-center p-4 border-b border-gray-100 transition-colors text-left group ${isActive ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-white border-l-4 border-l-transparent'}`}
                                >
                                    <UserAvatar targetUser={chat.type === ChatType.GROUP ? { name: displayName } : otherUsers[0]?.user} className="w-12 h-12 mr-3" />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h4 className={`font-semibold text-sm truncate pr-2 ${isActive ? 'text-primary' : 'text-gray-900'}`}>
                                                {displayName}
                                            </h4>
                                            {lastMsg && (
                                                <span className="text-[10px] text-gray-400 font-medium shrink-0">
                                                    {formatDistanceToNow(new Date(lastMsg.createdAt), { addSuffix: false })}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 truncate mt-0.5">
                                            {lastMsg ? (
                                                <>
                                                    <span className="font-medium text-gray-400">{lastMsg.senderId === user.id ? 'You: ' : (chat.type === ChatType.GROUP ? `${lastMsg.sender?.name?.split(' ')[0]}: ` : '')}</span>
                                                    {lastMsg.deletedAt ? <span className="italic text-gray-400 text-[11px]">Message deleted</span> : lastMsg.content}
                                                </>
                                            ) : (
                                                <span className="italic">Click to start chatting</span>
                                            )}
                                        </p>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className={`flex-1 flex flex-col bg-white ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
                {activeChat ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between shadow-sm z-20 bg-white/80 backdrop-blur-md">
                            <div className="flex items-center space-x-3">
                                <button className="md:hidden p-2 -ml-2 text-gray-400" onClick={() => setActiveChatId(null)}><X size={20} /></button>
                                <UserAvatar targetUser={activeChat.type === ChatType.GROUP ? { name: activeChat.name } : activeChat.participants?.find(p => p.userId !== user.id)?.user} className="w-10 h-10" />
                                <div>
                                    <div className="flex items-center">
                                        <h3 className="font-bold text-gray-800 leading-tight">
                                            {activeChat.type === ChatType.GROUP ? activeChat.name : activeChat.participants?.find(p => p.userId !== user.id)?.user?.name || 'Unknown'}
                                        </h3>
                                        {activeChat.type === ChatType.GROUP && <Shield size={12} className="ml-1.5 text-primary opacity-60" />}
                                    </div>
                                    <button
                                        id="participants-toggle"
                                        onClick={() => setShowParticipants(!showParticipants)}
                                        className={`text-[11px] font-bold px-2 py-0.5 rounded-sm transition-all flex items-center ${showParticipants ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:text-primary hover:bg-primary/5'}`}
                                    >
                                        {activeChat.type === ChatType.GROUP
                                            ? `${activeChat.participants?.filter(p => p.isActive).length || 0} participants`
                                            : activeChat.participants?.find(p => p.userId !== user.id)?.user?.role?.replace('_', ' ') || 'Member'}
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center space-x-1">
                                {isGroupAdmin && activeChat.type === ChatType.GROUP && (
                                    <Button
                                        variant="secondary"
                                        icon={UserPlus}
                                        px="px-3"
                                        py="py-2"
                                        className="text-primary hover:bg-primary/5 border-none shadow-none rounded-sm" // added rounded-sm
                                        onClick={() => setIsAddUserModalOpen(true)}
                                    />
                                )}
                                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-sm hover:bg-gray-100 transition-colors"> {/* rounded-sm instead of rounded-full */}
                                    <MoreVertical size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 flex overflow-hidden relative">
                            <div
                                ref={messagesContainerRef}
                                className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-[#f8fafc] custom-scrollbar"
                            >
                                {isLoadingMessages ? (
                                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-400" /></div>
                                ) : (
                                    <>
                                        {messages.map((msg, i) => {
                                            if (msg.type === 'SYSTEM') {
                                                return (
                                                    <div key={msg.id} className="flex justify-center py-2">
                                                        <div className="bg-gray-100/80 text-gray-500 px-4 py-1.5 rounded-sm text-[11px] font-medium flex items-center border border-gray-200/50 shadow-sm"> {/* rounded-sm */}
                                                            <Info size={12} className="mr-1.5 opacity-60" />
                                                            {msg.content}
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            const isMine = msg.senderId === user.id;
                                            const showAvatar = !isMine && (i === 0 || messages[i - 1].senderId !== msg.senderId || messages[i - 1].type === 'SYSTEM');
                                            const isDeleted = !!msg.deletedAt;

                                            return (
                                                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} group/msg relative`}>
                                                    {!isMine && (
                                                        <div className="w-8 shrink-0 mr-2 flex flex-col justify-end pb-1">
                                                            {showAvatar ? (
                                                                <UserAvatar targetUser={msg.sender} className="w-8 h-8" />
                                                            ) : <div className="w-8 h-8" />}
                                                        </div>
                                                    )}

                                                    <div className={`flex flex-col max-w-[80%] md:max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
                                                        {activeChat.type === ChatType.GROUP && !isMine && showAvatar && (
                                                            <span className="text-[10px] font-semibold text-gray-500 mb-1 ml-1 truncate">
                                                                {msg.sender?.name}
                                                            </span>
                                                        )}
                                                        <div className="relative">
                                                            <div className={`px-4 py-2.5 rounded-sm shadow-sm text-sm ${isMine ? 'bg-primary text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'} ${isDeleted ? 'bg-gray-50 text-gray-400 border-dashed border-gray-300 shadow-none' : ''}`}>
                                                                {isDeleted ? (
                                                                    <div className="flex items-center space-x-2 italic text-[13px]">
                                                                        <Trash2 size={14} className="opacity-50" />
                                                                        <span>Message deleted by {msg.deletedBy?.name || 'author'}</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className={`prose prose-sm max-w-none ${isMine ? 'prose-invert' : ''} message-content`}>
                                                                        <MarkdownRenderer content={msg.content} />
                                                                        {/* Add custom styling for images inside the message */}
                                                                        <style jsx>{`
                                      .message-content img {
                                        max-width: 200px;
                                        max-height: 200px;
                                        object-fit: cover;
                                        border-radius: 0.125rem; /* rounded-sm */
                                        cursor: pointer;
                                        box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1);
                                        transition: transform 0.1s ease;
                                      }
                                      .message-content img:hover {
                                        transform: scale(1.02);
                                      }
                                    `}</style>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Delete button: always visible on mobile, visible on hover on desktop */}
                                                            {(isMine || user.role === Role.ORG_ADMIN) && !isDeleted && (
                                                                <button
                                                                    onClick={() => handleDeleteMessage(msg.id)}
                                                                    className={`absolute top-0 ${isMine ? '-left-8' : '-right-8'} p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all
                                    opacity-100 sm:opacity-0 sm:group-hover/msg:opacity-100`}
                                                                    title="Delete message"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center mt-1 space-x-2">
                                                            <span className="text-[10px] text-gray-400 font-medium">
                                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>

                                                            {/* Read Receipts */}
                                                            {isMine && msg.readBy && msg.readBy.length > 0 && (
                                                                <div className="flex -space-x-1.5 overflow-hidden p-0.5">
                                                                    {msg.readBy.slice(0, 3).map(uid => {
                                                                        const pUser = activeChat.participants?.find(p => p.userId === uid)?.user;
                                                                        return (
                                                                            <div key={uid} className="w-3.5 h-3.5 rounded-full border border-white overflow-hidden shadow-xs" title={`Read by ${pUser?.name}`}>
                                                                                <UserAvatar targetUser={pUser} className="w-full h-full" />
                                                                            </div>
                                                                        );
                                                                    })}
                                                                    {msg.readBy.length > 3 && (
                                                                        <div className="w-3.5 h-3.5 rounded-full bg-gray-200 border border-white flex items-center justify-center text-[7px] font-bold text-gray-600">
                                                                            +{msg.readBy.length - 3}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </>
                                )}
                            </div>

                            {/* Participants Drawer */}
                            {showParticipants && (
                                <div
                                    ref={participantsRef}
                                    className="absolute top-0 right-0 h-full w-72 bg-white border-l border-gray-200 shadow-2xl z-30 animate-in slide-in-from-right transition-all flex flex-col"
                                >
                                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                        <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Group Members</h4>
                                        <button onClick={() => setShowParticipants(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-sm transition-colors"><X size={18} /></button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
                                        {activeChat.participants?.filter(p => p.isActive).map(p => (
                                            <div key={p.id} className="flex items-center justify-between p-2.5 rounded-sm hover:bg-gray-50 transition-colors group/item border border-transparent hover:border-gray-100">
                                                <div className="flex items-center space-x-3 min-w-0">
                                                    <UserAvatar targetUser={p.user} className="w-9 h-9" />
                                                    <div className="min-w-0">
                                                        <p className="text-[13px] font-bold text-gray-900 truncate">{p.user?.name} {p.userId === user.id && '(You)'}</p>
                                                        <p className="text-[10px] text-primary/70 font-bold uppercase tracking-widest truncate">{p.user?.role?.toLowerCase().replace('_', ' ')}</p>
                                                    </div>
                                                </div>
                                                {isGroupAdmin && p.userId !== user.id && p.userId !== activeChat.creatorId && (
                                                    <button
                                                        onClick={() => handleRemoveParticipant(p.userId)}
                                                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg opacity-60 group-hover/item:opacity-100 transition-all border border-red-100/30 hover:border-red-200 shadow-sm"
                                                        title="Remove from group"
                                                    >
                                                        <UserMinus size={15} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-4 bg-gray-50/50 border-t border-gray-100">
                                        <p className="text-[10px] text-gray-400 font-medium text-center italic">Only admins can manage group members.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-gray-100 z-20">
                            <div className="flex items-end space-x-2">
                                <div className="flex-1">
                                    {/* Staged Files Preview */}
                                    {stagedFiles.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            {stagedFiles.map((file, i) => (
                                                <div key={i} className="group relative flex items-center bg-gray-50 border border-gray-200 pl-2 pr-1 py-1 rounded-sm shadow-sm hover:border-primary/30 transition-all">
                                                    {file.type.startsWith('image/') ? (
                                                        <div className="w-8 h-8 rounded-sm overflow-hidden bg-gray-200 mr-2 border border-gray-100">
                                                            <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-sm bg-primary/10 flex items-center justify-center text-primary mr-2">
                                                            <Plus size={14} />
                                                        </div>
                                                    )}
                                                    <div className="flex flex-col mr-2 max-w-[100px]">
                                                        <span className="text-[10px] font-bold text-gray-700 truncate">{file.name}</span>
                                                        <span className="text-[8px] font-medium text-gray-400">{(file.size / 1024).toFixed(0)} KB</span>
                                                    </div>
                                                    <button
                                                        onClick={() => removeStagedFile(i)}
                                                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <MarkdownEditor
                                        ref={textareaRef}
                                        value={messageDraft}
                                        onChange={setMessageDraft}
                                        onKeyDown={handleKeyDown}
                                        onFocus={handleEditorFocus}
                                        placeholder={stagedFiles.length > 0 ? "Add a caption..." : "Type a message..."}
                                        rows={2}
                                        className="border-gray-200! shadow-none! focus-within:border-primary/50! focus-within:ring-1! focus-within:ring-primary/50! transition-all rounded-sm" // ensure rounded-sm
                                    />
                                </div>
                                <div className="flex flex-col space-y-2 pb-1 relative">
                                    <input
                                        type="file"
                                        id="chat-file-upload"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                    <button
                                        onClick={() => document.getElementById('chat-file-upload')?.click()}
                                        className="p-3 bg-gray-100 text-gray-600 rounded-sm hover:bg-gray-200 transition-colors shadow-sm active:scale-95" // rounded-sm
                                        title="Attach file"
                                    >
                                        <ImageIcon size={20} />
                                    </button>
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={(!messageDraft.trim() && stagedFiles.length === 0) || isSending || isUploading}
                                        isLoading={isSending || isUploading}
                                        loadingText=" "
                                        icon={Send}
                                        px="px-4"
                                        py="py-3"
                                        className="rounded-sm shadow-md hover:shadow-lg active:scale-95 transition-all" // rounded-sm
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/30 text-gray-400">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                            <Send size={40} className="text-gray-300 ml-1" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-600 mb-2">Your Messages</h3>
                        <p className="text-sm">Select a chat to start participating or create a new one.</p>
                    </div>
                )}
            </div>

            {/* Image Preview Modal */}
            {previewImageUrl && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
                    onClick={() => setPreviewImageUrl(null)}
                >
                    <div className="relative max-w-4xl max-h-screen p-4">
                        <img
                            src={previewImageUrl}
                            alt="Preview"
                            className="max-w-full max-h-[90vh] object-contain rounded-sm shadow-2xl"
                        />
                        <button
                            onClick={() => setPreviewImageUrl(null)}
                            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                        >
                            <X size={24} className="text-white" />
                        </button>
                    </div>
                </div>
            )}

            <NewChatModal
                isOpen={isNewChatModalOpen}
                onClose={() => setIsNewChatModalOpen(false)}
                onChatCreated={handleChatCreated}
            />

            {/* Add Participant Modal */}
            {isAddUserModalOpen && activeChatId && (
                <NewChatModal
                    isOpen={isAddUserModalOpen}
                    onClose={() => setIsAddUserModalOpen(false)}
                    onChatCreated={() => {
                        setIsAddUserModalOpen(false);
                        fetchChats();
                    }}
                    mode="ADD_PARTICIPANTS"
                    chatId={activeChatId}
                    existingParticipantIds={activeChatParticipantIds}
                />
            )}

            <ConfirmDialog
                isOpen={confirmConfig.isOpen}
                onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmConfig.onConfirm}
                title={confirmConfig.title}
                description={confirmConfig.description}
                isDestructive={confirmConfig.isDestructive}
                confirmText={confirmConfig.isDestructive ? 'Delete' : 'Confirm'}
            />
        </div>
    );
}