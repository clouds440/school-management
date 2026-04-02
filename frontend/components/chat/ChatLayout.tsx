'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useGlobal } from '@/context/GlobalContext';
import { useUI } from '@/context/UIContext';
import { useSocket } from '@/hooks/useSocket';
import { api } from '@/lib/api';
import { BrandIcon } from '../ui/Brand';
import { Chat, ChatMessage, ChatType, Role, User } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import {
    Search, Plus, MessageSquarePlus, Send, MoreVertical, X, Loader2, Image as ImageIcon,
    UserMinus, Trash2, Shield, Info, ChevronLeft, Check, CheckCheck
} from 'lucide-react';
import { MarkdownEditor } from '../ui/MarkdownEditor';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { NewChatModal } from './NewChatModal';
import { ChatSettingsModal } from './ChatSettingsModal';

export function ChatLayout() {
    const { token, user } = useAuth();
    const { dispatch } = useGlobal();
    const { isDesktop, mounted } = useUI();
    const { socket, subscribe, joinRoom, leaveRoom } = useSocket({ token, userId: user?.id, enabled: !!token });
    const searchParams = useSearchParams();
    const initialChatId = searchParams.get('id');

    const [chats, setChats] = useState<Chat[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
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
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
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
    const UserAvatar = ({ targetUser, className = "w-8 h-8", groupIcon = false }: { targetUser?: { id?: string; name?: string | null; avatarUrl?: string | null; role?: Role; orgName?: string; orgLogoUrl?: string | null; avatarUpdatedAt?: string | null; userName?: string }, className?: string, groupIcon?: boolean }) => {
        if (groupIcon) {
            return (
                <div className={`${className} rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20 shadow-sm shrink-0`}>
                    <Plus size={16} />
                </div>
            );
        }

        return (
            <BrandIcon
                variant="user"
                size="sm"
                user={targetUser}
                className={className}
            />
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
                        messages: [message],
                        unreadCount: (message.chatId !== activeChatId && message.senderId !== user.id)
                            ? (prevChats[chatIndex].unreadCount || 0) + 1
                            : 0
                    };
                    const newChats = [...prevChats];
                    newChats.splice(chatIndex, 1);
                    return [updatedChat, ...newChats];
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
            if (readData.userId === user.id) {
                setChats(prev => prev.map(c => {
                    if (c.id === readData.chatId) {
                        return { ...c, unreadCount: 0 };
                    }
                    return c;
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

        const unsubUpdate = subscribe('chat:update', (updatedChat: unknown) => {
            const chat = updatedChat as Chat;
            setChats(prev => prev.map(c => c.id === chat.id ? { ...c, ...chat } : c));
        });

        const unsubRoomLeft = subscribe('roomLeft', (data: unknown) => {
            const leftData = data as { roomId: string; forced?: boolean };
            if (leftData.forced && leftData.roomId === `chat:${activeChatId}`) {
                dispatch({
                    type: 'TOAST_ADD',
                    payload: { message: 'You have been removed from this group.', type: 'info' }
                });
                setActiveChatId(null);
                setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, isActive: false } : c));
            }
        });

        return () => {
            unsubMessage();
            unsubRead();
            unsubDelete();
            unsubUpdate();
            unsubRoomLeft();
        };
    }, [subscribe, activeChatId, token, user, dispatch, setActiveChatId]);

    // 4. Join/Leave rooms and Sync URL
    useEffect(() => {
        if (!activeChatId) return;

        // Join the room
        if (joinRoom && leaveRoom) {
            joinRoom(`chat:${activeChatId}`);
            // Update URL without full page reload
            const url = new URL(window.location.href);
            url.searchParams.set('id', activeChatId);
            window.history.pushState({}, '', url.toString());

            return () => leaveRoom(`chat:${activeChatId}`);
        }
    }, [activeChatId, joinRoom, leaveRoom]);

    // 5. Image click handler for thumbnails
    useEffect(() => {
        if (!messagesContainerRef.current) return;

        const handleImageClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'IMG' && (target.closest('.message-content') || target.closest('.naked-image-container'))) {
                const imgSrc = (target as HTMLImageElement).src;
                if (imgSrc) {
                    setPreviewImageUrl(imgSrc);
                }
            }
        };

        const container = messagesContainerRef.current;
        container.addEventListener('click', handleImageClick);

        return () => container.removeEventListener('click', handleImageClick);
    }, []);

    const activeChat = useMemo(() => chats.find(c => c.id === activeChatId), [chats, activeChatId]);

    const filteredChats = useMemo(() => {
        if (!searchQuery.trim()) return chats;
        const lowerQuery = searchQuery.toLowerCase();
        return chats.filter(chat => {
            if (chat.type === ChatType.GROUP) {
                return (chat.name || '').toLowerCase().includes(lowerQuery);
            }
            const otherUser = chat.participants?.find(p => p.userId !== user?.id)?.user;
            return (otherUser?.name || '').toLowerCase().includes(lowerQuery) ||
                (otherUser?.email || '').toLowerCase().includes(lowerQuery);
        });
    }, [chats, searchQuery, user?.id]);

    const activeChatParticipantIds = useMemo(() => activeChat?.participants?.filter(p => p.isActive).map(p => p.userId) || [], [activeChat]);

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
                    fetchChats();
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
            setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, unreadCount: 0 } : c));
        }
    };

    const isGroupAdmin = useMemo(() => {
        if (!activeChat || !user) return false;
        if (user.role === Role.ORG_ADMIN) return true;
        return activeChat.creatorId === user.id;
    }, [activeChat, user]);

    if (!user) return null;

    return (
        <div className="flex h-full bg-white lg:rounded-sm lg:shadow-sm lg:border border-gray-100 overflow-hidden relative">
            <div className={`
                ${activeChatId && !isDesktop ? 'hidden' : 'flex'} 
                w-full lg:max-w-xs xl:max-w-sm border-r border-gray-100 flex-col bg-gray-50/50 h-full
            `}>
                <div className="p-4 border-b border-gray-100 bg-white flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800 tracking-tight">Chats</h2>
                    {user.role !== Role.STUDENT && (
                        <Button
                            onClick={() => setIsNewChatModalOpen(true)}
                            variant="primary"
                            px="px-3"
                            py="py-2"
                            icon={MessageSquarePlus}
                            title='New Chat'
                        />
                    )}
                </div>

                <div className="p-3 bg-white border-b border-gray-100">
                    <Input
                        icon={Search}
                        type="text"
                        placeholder="Search chats..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-gray-100 border-none py-2! pl-10! shadow-none text-sm focus-within:bg-white transition-all ring-primary/20 rounded-sm"
                    />
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {isLoadingChats ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-400" /></div>
                    ) : filteredChats.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">No chats found.</div>
                    ) : (
                        filteredChats.map(chat => {
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
                                    <UserAvatar
                                        targetUser={chat.type === ChatType.GROUP
                                            ? { name: displayName, avatarUrl: chat.avatarUrl, avatarUpdatedAt: chat.avatarUpdatedAt }
                                            : otherUsers[0]?.user
                                        }
                                        className="w-12 h-12 mr-3"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h4 className={`font-semibold text-sm truncate pr-2 ${isActive ? 'text-primary' : 'text-gray-900'}`}>
                                                {displayName}
                                            </h4>
                                            {lastMsg && (
                                                <div className="flex flex-col items-end shrink-0 ml-2">
                                                    <span className="text-[10px] text-gray-400 font-medium mb-1">
                                                        {formatDistanceToNow(new Date(lastMsg.createdAt), { addSuffix: false })}
                                                    </span>
                                                    {chat.unreadCount !== undefined && chat.unreadCount > 0 && (
                                                        <span className="flex items-center justify-center min-w-[20px] h-[20px] px-1.5 text-[10px] font-black text-white bg-green-500 rounded-full border border-white shadow-sm ring-2 ring-green-500/10">
                                                            {chat.unreadCount}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 truncate mt-0.5">
                                            {lastMsg ? (
                                                <>
                                                    <span className="font-medium text-gray-400">{lastMsg.senderId === user.id ? 'You: ' : (chat.type === ChatType.GROUP ? `${lastMsg.sender?.name}: ` : '')}</span>
                                                    {lastMsg.deletedAt ? (
                                                        <span className="italic text-gray-400 text-[11px]">Message deleted</span>
                                                    ) : (
                                                        (() => {
                                                            const content = lastMsg.content || '';
                                                            if (content.includes('![')) {
                                                                const textPart = content.replace(/!\[.*?\]\(.*?\)/g, '').trim();
                                                                return textPart ? `${textPart} [Image]` : '[Image]';
                                                            }
                                                            return content;
                                                        })()
                                                    )}
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

            <div className={`
                ${!activeChatId && !isDesktop ? 'hidden' : 'flex'} 
                flex-1 flex-col bg-white h-full relative
            `}>
                {activeChat ? (
                    <>
                        <div className="p-3 md:p-4 border-b border-gray-100 flex items-center justify-between shadow-sm z-20 bg-white/80 backdrop-blur-md">
                            <div className="flex items-center space-x-3">
                                {!isDesktop && (
                                    <button
                                        className="p-2 -ml-2 text-primary hover:bg-primary/5 rounded-full transition-colors"
                                        onClick={() => setActiveChatId(null)}
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                )}
                                <UserAvatar
                                    targetUser={activeChat.type === ChatType.GROUP
                                        ? { name: activeChat.name, avatarUrl: activeChat.avatarUrl, avatarUpdatedAt: activeChat.avatarUpdatedAt }
                                        : activeChat.participants?.find(p => p.userId !== user.id)?.user
                                    }
                                    className="w-10 h-10"
                                />
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
                                {activeChat.type === ChatType.GROUP && (
                                    <button
                                        onClick={() => setIsSettingsModalOpen(true)}
                                        className="p-2 text-gray-400 hover:text-primary rounded-sm hover:bg-primary/5 transition-all"
                                        title="Chat Settings"
                                    >
                                        <MoreVertical size={20} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 flex overflow-hidden relative">
                            <div
                                ref={messagesContainerRef}
                                className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar"
                                style={{
                                    backgroundImage: "url('/assets/chat-background.png')",
                                    backgroundSize: "cover",
                                    backgroundRepeat: "no-repeat",
                                    backgroundColor: "rgba(220, 220, 255, 0.9)",
                                    backgroundBlendMode: "overlay"
                                }}
                            >
                                {isLoadingMessages ? (
                                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-400" /></div>
                                ) : (
                                    <>
                                        {messages.map((msg, i) => {
                                            if (msg.type === 'SYSTEM') {
                                                return (
                                                    <div key={msg.id} className="flex justify-center py-2">
                                                        <div className="bg-gray-100/80 text-gray-500 px-4 py-1.5 rounded-sm text-[11px] font-medium flex items-center border border-gray-200/50 shadow-sm">
                                                            <Info size={12} className="mr-1.5 opacity-60" />
                                                            {msg.content}
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            const isMine = msg.senderId === user.id;
                                            const showAvatar = !isMine && (i === 0 || messages[i - 1].senderId !== msg.senderId || messages[i - 1].type === 'SYSTEM');
                                            const isLastInGroup = i === messages.length - 1 || messages[i + 1].senderId !== msg.senderId || messages[i + 1].type === 'SYSTEM';
                                            const isDeleted = !!msg.deletedAt;

                                            return (
                                                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} group/msg relative ${isLastInGroup ? 'mb-3' : 'mb-1'}`}>
                                                    {!isMine && (
                                                        <div className="w-8 shrink-0 mr-2.5 flex flex-col justify-end mb-1">
                                                            {isLastInGroup ? (
                                                                <UserAvatar targetUser={msg.sender} className="w-8 h-8 rounded-full border border-gray-200 shadow-sm" />
                                                            ) : <div className="w-8 h-8" />}
                                                        </div>
                                                    )}

                                                    <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] lg:max-w-[65%] ${isMine ? 'items-end' : 'items-start'}`}>
                                                        {activeChat.type === ChatType.GROUP && !isMine && showAvatar && (
                                                            <span className="text-[10px] font-bold text-primary mb-1 ml-2 tracking-wide uppercase">
                                                                {msg.sender?.name}
                                                            </span>
                                                        )}
                                                        <div className="relative group/content flex flex-col items-inherit">
                                                            {isDeleted ? (
                                                                /* Deleted message bubble stays as-is */
                                                                <div className={`
                                                                    px-4 py-2.5 rounded-2xl shadow-sm text-base leading-relaxed relative
                                                                    bg-gray-50/50 text-gray-400 border-dashed border-gray-200
                                                                    ${isMine ? 'rounded-br-none' : 'rounded-bl-none'}
                                                                `}>
                                                                    <div className="flex items-center space-x-2 italic text-[12px] py-1">
                                                                        <Trash2 size={12} className="opacity-40" />
                                                                        <span>This message was deleted by {msg.sender?.name} at {new Date(msg.deletedAt ?? '').toLocaleTimeString()}</span>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                /* Non-deleted message splitting logic */
                                                                (() => {
                                                                    const imageRegex = /(!\[.*?\]\(.*?\))/g;
                                                                    const segments = msg.content.split(imageRegex).filter(s => s.trim() !== '');

                                                                    return (
                                                                        <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} space-y-1.5`}>
                                                                            {segments.map((segment, idx) => {
                                                                                const isImage = segment.match(/^!\[.*?\]\(.*?\)$/);
                                                                                if (isImage) {
                                                                                    return (
                                                                                        <div key={idx} className="naked-image-container max-w-full">
                                                                                            <MarkdownRenderer content={segment} />
                                                                                            <style jsx>{`
                                                                                                .naked-image-container :global(img) {
                                                                                                    max-width: 100%;
                                                                                                    max-height: 400px;
                                                                                                    object-fit: contain;
                                                                                                    border-radius: 12px;
                                                                                                    cursor: pointer;
                                                                                                    transition: opacity 0.2s;
                                                                                                }
                                                                                                .naked-image-container :global(img:hover) { opacity: 0.95; }
                                                                                            `}</style>
                                                                                        </div>
                                                                                    );
                                                                                }

                                                                                return (
                                                                                    <div
                                                                                        key={idx}
                                                                                        className={`
                                                                                            px-4 py-2.5 rounded-2xl shadow-sm text-base leading-relaxed relative
                                                                                            ${isMine
                                                                                                ? 'bg-linear-to-br from-primary/80 to-primary/60 text-white! rounded-br-none'
                                                                                                : 'bg-white/70 text-gray-800 border border-gray-100 rounded-bl-none'
                                                                                            }
                                                                                        `}
                                                                                    >
                                                                                        <div className={`prose prose-base max-w-none ${isMine ? 'prose-invert prose-p:text-white' : 'prose-p:text-gray-800'}`}>
                                                                                            <MarkdownRenderer content={segment} className={isMine ? 'text-white!' : ''} />
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}

                                                                            {/* Timestamp & Read Receipts attached to the LAST element or as a standalone overlay if it was an image-only message */}
                                                                            <div className={`flex items-center justify-end mt-1 space-x-1 ${isMine ? 'text-white/80' : 'text-gray-400'} text-[9px] font-medium`}>
                                                                                <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                                {isMine && (
                                                                                    <div className="flex">
                                                                                        {msg.readBy && msg.readBy.length > 0 ? (
                                                                                            <CheckCheck className="w-3.5 h-3.5 text-blue-400" strokeWidth={3} />
                                                                                        ) : (
                                                                                            <Check className="w-3.5 h-3.5 text-white/60" strokeWidth={3} />
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })()
                                                            )}

                                                            {/* Actions bar - Hover only */}
                                                            {(isMine || user.role === Role.ORG_ADMIN) && !isDeleted && (
                                                                <div className={`
                                                                    absolute top-1/2 -translate-y-1/2 ${isMine ? '-left-10' : '-right-10'}
                                                                    flex space-x-1 opacity-0 group-hover/msg:opacity-100 transition-opacity
                                                                `}>
                                                                    <button
                                                                        onClick={() => handleDeleteMessage(msg.id)}
                                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
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
                                        rows={1}
                                        className="border-gray-200! shadow-none! focus-within:border-primary/50! focus-within:ring-1! focus-within:ring-primary/50! transition-all rounded-sm"
                                    />
                                </div>
                                <div className="flex flex-col space-y-2.5 pb-0.5 relative">
                                    <input
                                        type="file"
                                        id="chat-file-upload"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                    <Button
                                        onClick={() => document.getElementById('chat-file-upload')?.click()}
                                        title="Attach file"
                                        icon={ImageIcon}
                                        variant="warning"
                                    />
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={(!messageDraft.trim() && stagedFiles.length === 0) || isSending || isUploading}
                                        isLoading={isSending || isUploading}
                                        variant='primary'
                                        loadingText=" "
                                        icon={Send}
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

            {activeChat && (
                <ChatSettingsModal
                    isOpen={isSettingsModalOpen}
                    onClose={() => setIsSettingsModalOpen(false)}
                    chat={activeChat}
                    currentUser={user as any}
                    token={token!}
                    onUpdate={fetchChats}
                    onAddParticipants={() => setIsAddUserModalOpen(true)}
                />
            )}
            {/* Add Participants Modal */}
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
