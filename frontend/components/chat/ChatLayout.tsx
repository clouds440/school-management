'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useGlobal } from '@/context/GlobalContext';
import { useUI } from '@/context/UIContext';
import { useSocket } from '@/hooks/useSocket';
import Image from 'next/image';
import { api } from '@/lib/api';
import {
    getUserChatsCached,
    insertOrUpdateChatFromMessage,
    markAsReadGuard,
    getCachedChats,
    getCachedMessages,
    setCachedMessages,
    getCachedComposerStates,
    setCachedComposerStates
} from '@/lib/chatStore';
import { BrandIcon } from '../ui/Brand';
import { Chat, ChatMessage, ChatParticipant, ChatType, ChatMessageType, PaginatedResponse, Role, User, ChatParticipantRole } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import {
    Search, Plus, Paperclip, MessageSquarePlus, SendHorizonal as Send, MoreVertical, X, Loader2,
    UserMinus, Trash2, Info, ChevronLeft, Check, CheckCheck, ArrowDown, Pencil, Reply, ArrowUp, Download, RotateCcw,
    Copy, View, Lock as LockIcon
} from 'lucide-react';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { NewChatModal } from './NewChatModal';
import { ChatSettingsModal } from './ChatSettingsModal';
import {
    type ChatTypingEvent,
    type ChatTypingStateMap,
    formatChatDateLabel,
    formatChatTimestamp,
    getDirectChatTarget,
    getChatComposerState,
    getTypingIndicatorLabel,
    getTypingUsersForChat,
    getTruncatedMessagePreview,
    mergeUniqueMessages,
    removeTypingUserFromAllChats,
    reconcileIncomingMessage,
    type PresenceStateEvent,
    type PresenceUpdateEvent,
    type OnlineUserState,
    updateChatTypingState,
    updateChatComposerState,
    updateOnlineUsersFromPresenceEvent,
    updateOnlineUsersFromPresenceState,
    type ChatComposerStateMap,
    type ChatMessageWithMeta
} from './chatLayoutHelpers';

export function ChatLayout() {
    const { token, user } = useAuth();
    const { dispatch } = useGlobal();
    const { isDesktop } = useUI();
    const { subscribe, joinRoom, leaveRoom, emit } = useSocket({ token, userId: user?.id, enabled: !!token });
    const searchParams = useSearchParams();
    const initialChatId = searchParams.get('id');
    const msgIdParam = searchParams.get('msgId');

    const [chats, setChats] = useState<Chat[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeChatId, setActiveChatId] = useState<string | null>(initialChatId);
    const [targetMessageId, setTargetMessageId] = useState<string | null>(msgIdParam);

    useEffect(() => {
        if (msgIdParam) {
            setTargetMessageId(msgIdParam);
        }
    }, [msgIdParam]);
    // Initialize from persistent store
    const [messages, setMessages] = useState<ChatMessageWithMeta[]>(() => {
        if (initialChatId) {
            return getCachedMessages(initialChatId);
        }
        return [];
    });
    const [isLoadingChats, setIsLoadingChats] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [chatComposerStates, setChatComposerStates] = useState<ChatComposerStateMap>(() => getCachedComposerStates());
    const [isUploading, setIsUploading] = useState(false);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<OnlineUserState>({});
    const [typingByChatId, setTypingByChatId] = useState<ChatTypingStateMap>({});
    const [mentionSearchQuery, setMentionSearchQuery] = useState('');
    const [showMentionDropdown, setShowMentionDropdown] = useState(false);
    const [mentionCursorIndex, setMentionCursorIndex] = useState(0);
    const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);

    // Modal state for image preview
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

    // Mobile: tap-to-show actions
    const [tappedMessageId, setTappedMessageId] = useState<string | null>(null);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    useEffect(() => {
        const handleGlobalClick = (ev: MouseEvent) => {
            const target = ev.target as HTMLElement | null;
            // If click is inside a chat dropdown, ignore
            if (target && target.closest && target.closest('.chat-dropdown')) return;
            // Also ignore clicks on the more actions button itself
            if (target && target.closest && target.closest('.more-actions-btn')) return;
            // If we recently opened a dropdown for this id, suppress immediate close
            if (suppressCloseRef.current && openDropdownId === suppressCloseRef.current) return;
            setOpenDropdownId(null);
        };
        document.addEventListener('click', handleGlobalClick);
        return () => document.removeEventListener('click', handleGlobalClick);
    }, [openDropdownId]);

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

    // Pagination & Smart Scroll States
    const [messagesPage, setMessagesPage] = useState(1);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [hasMoreAfter, setHasMoreAfter] = useState(false);
    const [unreadSinceScroll, setUnreadSinceScroll] = useState(0);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isLoadingNewer, setIsLoadingNewer] = useState(false);
    const [isViewingHistory, setIsViewingHistory] = useState(false);

    // Refs
    const participantsRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const mentionDropdownRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<ResizeObserver | null>(null);

    const [composerHeight, setComposerHeight] = useState(0);
    const longPressTimerRef = useRef<number | null>(null);
    const suppressCloseRef = useRef<string | null>(null);
    const pendingMessageIdRef = useRef<string | null>(null);
    const sendLockRef = useRef(false);
    const typingStateRef = useRef<{ chatId: string | null; isTyping: boolean }>({ chatId: null, isTyping: false });
    const mobileBottomInset = 'env(safe-area-inset-bottom, 0px)';

    const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior });
        setUnreadSinceScroll(0);
        setShowScrollToBottom(false);
        if (activeChatId && token) {
            markAsReadGuard(activeChatId, '', token);
        }
    }, [activeChatId, token]);

    const scrollToMessage = useCallback(async (messageId: string) => {
        const element = document.getElementById(`msg-${messageId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedMessageId(messageId);
            setTimeout(() => setHighlightedMessageId(null), 2500);
        } else {
            // Jump to history context
            if (!token || !activeChatId) return;
            setIsLoadingMessages(true);
            try {
                const res = await api.chat.getChatMessages(activeChatId, token, { aroundId: messageId, limit: 30 });
                setMessages(res.data);
                setIsViewingHistory(true);
                setHasMoreMessages(res.hasMoreBefore ?? false);
                setHasMoreAfter(res.hasMoreAfter ?? false);

                // Wait for render, then scroll to the specific item
                setTimeout(() => {
                    const el = document.getElementById(`msg-${messageId}`);
                    if (el) {
                        el.scrollIntoView({ behavior: 'instant', block: 'center' });
                        setHighlightedMessageId(messageId);
                        setTimeout(() => setHighlightedMessageId(null), 2500);
                    }
                }, 100);
            } catch (err) {
                console.error(err);
                dispatch({ type: 'TOAST_ADD', payload: { message: 'Message not found in history', type: 'error' } });
            } finally {
                setIsLoadingMessages(false);
            }
        }
    }, [token, activeChatId, dispatch]);

    const handleScroll = () => {
        if (!messagesContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

        // Use a 50px threshold for "at bottom"
        const atBottom = distanceFromBottom < 50;
        setIsAtBottom(atBottom);
        setShowScrollToBottom(distanceFromBottom > clientHeight * 2);

        if (atBottom && unreadSinceScroll > 0) {
            setUnreadSinceScroll(0);
            if (activeChatId && token) {
                markAsReadGuard(activeChatId, '', token);
            }
        }
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

    // Track input composer height to adjust FAB and scroll padding dynamically
    const composerRef = useCallback((node: HTMLDivElement | null) => {
        if (observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
        }

        if (node) {
            const observer = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    setComposerHeight((entry.target as HTMLElement).offsetHeight);
                }
            });
            observer.observe(node);
            observerRef.current = observer;
        }
    }, []);

    useEffect(() => {
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, []);

    // Helper: Get avatar with fallback — delegate to `BrandIcon` which now supports initials fallback
    const UserAvatar = ({ targetUser, className = "w-8 h-8", groupIcon = false, isOnline = false }: { targetUser?: { id?: string; name?: string | null; avatarUrl?: string | null; role?: Role; orgName?: string; orgLogoUrl?: string | null; avatarUpdatedAt?: string | null; userName?: string }, className?: string, groupIcon?: boolean, isOnline?: boolean }) => {
        if (groupIcon) {
            return (
                <div className={`${className} rounded-full bg-primary/60 flex items-center justify-center text-primary font-bold border border-primary shadow-sm shrink-0`}>
                    <Plus size={16} />
                </div>
            );
        }

        // Always use BrandIcon; ask it to render initials when no avatar is present
        return (
            <div className="relative shrink-0">
                <BrandIcon
                    variant="user"
                    size="sm"
                    user={targetUser}
                    className={className}
                    initialsFallback
                />
                {isOnline && (
                    <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background shadow-sm" />
                )}
            </div>
        );
    };

    // 1. Fetch Chat List
    const fetchChats = useCallback(async () => {
        if (!token) return;
        try {
            const data = await getUserChatsCached(token);
            setChats(data);
            setIsLoadingChats(false);
        } catch (err) {
            console.error(err);
            setIsLoadingChats(false);
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Failed to load chats', type: 'error' } });
        }
    }, [token, dispatch]);

    useEffect(() => {
        fetchChats();
        if (token) {
            api.notifications.clearCategory('CHAT', token).catch(console.error);
        }
    }, [token, fetchChats]);

    // 2. Fetch Messages for Active Chat (Initial)
    const fetchInitialMessages = useCallback(async (chatId: string, targetMsgId?: string | null) => {
        if (!token) return;
        setIsLoadingMessages(true);
        setMessagesPage(1);
        setHasMoreMessages(true);
        setHasMoreAfter(false);
        setUnreadSinceScroll(0);
        setIsViewingHistory(!!targetMsgId);

        try {
            let res: PaginatedResponse<ChatMessage>;
            if (targetMsgId) {
                res = await api.chat.getChatMessages(chatId, token, { limit: 35, aroundId: targetMsgId });
            } else {
                res = await api.chat.getChatMessages(chatId, token, { limit: 35, page: 1 });
            }

            const messagesData = res.data;
            setMessages(messagesData);
            setCachedMessages(chatId, messagesData);
            setHasMoreMessages(res.hasMoreBefore ?? (res.currentPage < res.totalPages));
            setHasMoreAfter(res.hasMoreAfter ?? false);

            if (targetMsgId) {
                // When deep-linking, scroll to message and highlight
                setTimeout(() => {
                    scrollToMessage(targetMsgId);
                    setHighlightedMessageId(targetMsgId);
                    setTimeout(() => setHighlightedMessageId(null), 3000);
                    // Clear the target so subsequent loads of this chat don't jump
                    setTargetMessageId(null);
                }, 200);
            } else {
                setTimeout(() => scrollToBottom('instant'), 100);
            }

            markAsReadGuard(chatId, '', token);
            setChats(prev => prev.map(chat => chat.id === chatId ? { ...chat, unreadCount: 0 } : chat));
        } catch (err) {
            console.error(err);
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Failed to load messages', type: 'error' } });
        } finally {
            setIsLoadingMessages(false);
        }
    }, [token, dispatch, scrollToBottom, scrollToMessage]);

    useEffect(() => {
        if (!activeChatId) return;
        // Load cached messages if available, otherwise fetch
        const cachedMessages = getCachedMessages(activeChatId);
        if (cachedMessages.length > 0 && !targetMessageId) {
            setMessages(cachedMessages);
            setIsLoadingMessages(false);
            setTimeout(() => scrollToBottom('instant'), 100);
        } else {
            fetchInitialMessages(activeChatId, targetMessageId);
        }
    }, [activeChatId, fetchInitialMessages, targetMessageId, scrollToBottom]);

    // Sync chatComposerStates to cache whenever it changes
    useEffect(() => {
        setCachedComposerStates(chatComposerStates);
    }, [chatComposerStates]);

    // Sync messages state to cache whenever it changes
    useEffect(() => {
        if (activeChatId && messages.length > 0) {
            setCachedMessages(activeChatId, messages);
        }
    }, [messages, activeChatId]);

    useEffect(() => {
        const unread = chats.reduce((total, chat) => total + (chat.unreadCount || 0), 0);
        dispatch({ type: 'STATS_SET_CHAT', payload: { unread } });
    }, [chats, dispatch]);

    useEffect(() => {
        if (!subscribe) return;

        const unsubscribePresenceState = subscribe('presence:state', (payload: unknown) => {
            const event = payload as PresenceStateEvent;
            if (!activeChatId || event.chatId !== activeChatId) return;
            setOnlineUsers(prev => updateOnlineUsersFromPresenceState(prev, event));
        });

        const unsubscribePresenceUpdate = subscribe('presence:update', (payload: unknown) => {
            const event = payload as PresenceUpdateEvent;
            setOnlineUsers(prev => updateOnlineUsersFromPresenceEvent(prev, event));
            if (!event.isOnline) {
                setTypingByChatId(prev => removeTypingUserFromAllChats(prev, event.userId));
            }
        });

        const unsubscribeTyping = subscribe('chat:typing', (payload: unknown) => {
            const event = payload as ChatTypingEvent;
            setTypingByChatId(prev => updateChatTypingState(prev, event));
        });

        return () => {
            unsubscribePresenceState();
            unsubscribePresenceUpdate();
            unsubscribeTyping();
        };
    }, [subscribe, activeChatId]);

    useEffect(() => {
        if (!activeChatId || !emit) return;
        emit('presence:request', { chatId: activeChatId });
    }, [activeChatId, emit]);

    useEffect(() => {
        return () => {
            if (typingStateRef.current.chatId && typingStateRef.current.isTyping) {
                emit('chat:typing', { chatId: typingStateRef.current.chatId, isTyping: false });
            }
        };
    }, [emit]);

    const loadEarlierMessages = async () => {
        if (!token || !activeChatId || isLoadingMore || !hasMoreMessages) return;

        const container = messagesContainerRef.current;
        const previousScrollHeight = container?.scrollHeight || 0;

        setIsLoadingMore(true);

        try {
            let res: PaginatedResponse<ChatMessage>;
            if (isViewingHistory && messages.length > 0) {
                // Fetch context before the first message
                res = await api.chat.getChatMessages(activeChatId, token, {
                    limit: 35,
                    aroundId: messages[0].id
                });
                setMessages(prev => mergeUniqueMessages(prev, res.data, 'prepend'));
                setHasMoreMessages(res.hasMoreBefore ?? false);
            } else {
                const nextPage = messagesPage + 1;
                res = await api.chat.getChatMessages(activeChatId, token, { limit: 35, page: nextPage });
                setMessages(prev => mergeUniqueMessages(prev, res.data, 'prepend'));
                setMessagesPage(nextPage);
                setHasMoreMessages(res.hasMoreBefore ?? (res.currentPage < res.totalPages));
            }

            // Preserve scroll position
            setTimeout(() => {
                if (container) {
                    container.scrollTop = container.scrollHeight - previousScrollHeight;
                }
            }, 0);
        } catch (err) {
            console.error('Failed to load more messages', err);
        } finally {
            setIsLoadingMore(false);
        }
    };

    const loadNewerMessages = async () => {
        if (!token || !activeChatId || isLoadingNewer || !hasMoreAfter || messages.length === 0) return;

        setIsLoadingNewer(true);
        try {
            const res = await api.chat.getChatMessages(activeChatId, token, {
                limit: 35,
                aroundId: messages[messages.length - 1].id
            });
            setMessages(prev => mergeUniqueMessages(prev, res.data, 'append'));
            setHasMoreAfter(res.hasMoreAfter ?? false);
        } catch (err) {
            console.error('Failed to load newer messages', err);
        } finally {
            setIsLoadingNewer(false);
        }
    };

    // 3. Setup socket listen
    useEffect(() => {
        if (!subscribe || !token || !user) return;

        const unsubMessage = subscribe('chat:message', (newMsg: unknown) => {
            const message = newMsg as ChatMessage & { sender?: User };

            if (message.chatId === activeChatId) {
                setMessages(prev => {
                    const pendingId = message.senderId === user.id ? pendingMessageIdRef.current : null;
                    const next = reconcileIncomingMessage(prev, message, user.id, pendingId);
                    if (pendingId && next !== prev) {
                        pendingMessageIdRef.current = null;
                    }
                    return next;
                });

                // Smart scroll: only scroll if user is already at the bottom
                // Also track unread messages if user is scrolled up
                if (isAtBottom || message.senderId === user.id) {
                    setTimeout(() => scrollToBottom(message.senderId === user.id ? 'instant' : 'smooth'), 50);
                } else {
                    setUnreadSinceScroll(prev => prev + 1);
                }

                if (message.senderId !== user.id) {
                    markAsReadGuard(activeChatId, message.id, token);
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
                }

                // If chat isn't present, insert a lightweight placeholder from message
                insertOrUpdateChatFromMessage(message);
                const cached = getCachedChats();
                if (cached) return cached;
                return prevChats;
            });
        });

        const unsubRead = subscribe('chat:read', (data: unknown) => {
            const readData = data as { chatId: string; userId: string; messageId: string };
            if (readData.chatId === activeChatId) {
                setMessages(prev => {
                    const readMessage = prev.find(candidate => candidate.id === readData.messageId);
                    const readAt = readMessage ? new Date(readMessage.createdAt).getTime() : null;
                    return prev.map(m => {
                        const messageAt = new Date(m.createdAt).getTime();
                        if (m.senderId !== readData.userId && readAt !== null && readAt >= messageAt) {
                            const readBy = Array.from(new Set([...(m.readBy || []), readData.userId]));
                            return { ...m, readBy };
                        }
                        return m;
                    });
                });
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

        const unsubEdit = subscribe('chat:message:edit', (editedMsg: unknown) => {
            const message = editedMsg as ChatMessage;
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
            unsubEdit();
            unsubUpdate();
            unsubRoomLeft();
        };
    }, [subscribe, activeChatId, token, user, dispatch, setActiveChatId, isAtBottom, scrollToBottom]);

    // 4. Join/Leave rooms and Sync URL
    useEffect(() => {
        if (!activeChatId) return;

        // Join the room
        if (joinRoom && leaveRoom) {
            joinRoom(`chat:${activeChatId}`);
            // Update URL without full page reload
            const url = new URL(window.location.href);
            if (activeChatId) {
                url.searchParams.set('id', activeChatId);
            } else {
                url.searchParams.delete('id');
            }
            window.history.pushState({}, '', url.toString());

            return () => leaveRoom(`chat:${activeChatId}`);
        }
    }, [activeChatId, joinRoom, leaveRoom]);

    // 5. Image click handler for thumbnails
    useEffect(() => {
        // Attach a document-level click handler and filter clicks that originate from images
        const handleImageClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement | null;
            if (!target) return;

            // Find the nearest <img> element from the event target (covers clicks on children)
            const imgEl = (target.closest && (target.closest('img') as HTMLImageElement | null)) || (target.tagName === 'IMG' ? (target as HTMLImageElement) : null);
            if (!imgEl) return;

            // Ensure the image is inside the messages container and either inside a naked-image-container or message-content
            if (messagesContainerRef.current && messagesContainerRef.current.contains(imgEl) && (imgEl.closest('.message-content') || imgEl.closest('.naked-image-container'))) {
                const imgSrc = imgEl.src;
                if (imgSrc) setPreviewImageUrl(imgSrc);
            }
        };

        document.addEventListener('click', handleImageClick);
        return () => document.removeEventListener('click', handleImageClick);
    }, []);

    const activeChat = useMemo(() => chats.find(c => c.id === activeChatId), [chats, activeChatId]);
    const activeChatComposerState = useMemo(
        () => getChatComposerState(chatComposerStates, activeChatId),
        [chatComposerStates, activeChatId]
    );
    const directChatTarget = useMemo(
        () => getDirectChatTarget(activeChat, user?.id),
        [activeChat, user?.id]
    );
    const typingUsers = useMemo(
        () => getTypingUsersForChat(typingByChatId, activeChatId, user?.id),
        [typingByChatId, activeChatId, user?.id]
    );
    const typingIndicatorLabel = useMemo(
        () => getTypingIndicatorLabel(activeChat, typingUsers),
        [activeChat, typingUsers]
    );
    const { messageDraft, stagedFiles, replyToMessage, editingMessage, mentionedUsers } = activeChatComposerState;

    // Check if user can send messages (not read-only or has admin/mod role)
    const currentUserParticipant = useMemo(
        () => activeChat?.participants?.find(p => p.userId === user?.id),
        [activeChat, user?.id]
    );
    const canSendMessage = useMemo(() => {
        if (!activeChat || !currentUserParticipant) return false;
        if (!activeChat.readOnly) return true;
        // In read-only mode, only ADMIN and MOD can send messages
        return currentUserParticipant.role === ChatParticipantRole.ADMIN || currentUserParticipant.role === ChatParticipantRole.MOD;
    }, [activeChat, currentUserParticipant]);

    useEffect(() => {
        if (!emit) return;

        const hasDraftText = messageDraft.trim().length > 0;
        const previousTypingState = typingStateRef.current;

        if (
            previousTypingState.chatId &&
            previousTypingState.chatId !== activeChatId &&
            previousTypingState.isTyping
        ) {
            emit('chat:typing', { chatId: previousTypingState.chatId, isTyping: false });
            typingStateRef.current = { chatId: previousTypingState.chatId, isTyping: false };
        }

        if (!activeChatId) {
            typingStateRef.current = { chatId: null, isTyping: false };
            return;
        }

        if (
            previousTypingState.chatId === activeChatId &&
            previousTypingState.isTyping === hasDraftText
        ) {
            return;
        }

        emit('chat:typing', { chatId: activeChatId, isTyping: hasDraftText });
        typingStateRef.current = { chatId: activeChatId, isTyping: hasDraftText };
    }, [activeChatId, emit, messageDraft]);

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

    const updateComposerStateForChat = useCallback((chatId: string | null, patch: Parameters<typeof updateChatComposerState>[2]) => {
        setChatComposerStates(prev => updateChatComposerState(prev, chatId, patch));
    }, []);

    const updateActiveComposerState = useCallback((patch: Parameters<typeof updateChatComposerState>[2]) => {
        updateComposerStateForChat(activeChatId, patch);
    }, [activeChatId, updateComposerStateForChat]);

    const filteredMembers = useMemo(() => {
        if (!activeChat || activeChat.type !== ChatType.GROUP) return [];
        const members = activeChat.participants?.filter(p => p.isActive && p.userId !== user?.id) || [];
        if (!mentionSearchQuery) return members;
        return members.filter(m =>
            m.user?.name?.toLowerCase().includes(mentionSearchQuery.toLowerCase())
        );
    }, [activeChat, mentionSearchQuery, user?.id]);

    const handleSelectMember = useCallback((member: ChatParticipant) => {
        if (!member.user || !member.user.name) return;
        const textBefore = messageDraft.slice(0, mentionCursorIndex);
        const textAfter = messageDraft.slice(textareaRef.current?.selectionStart || mentionCursorIndex + 1 + mentionSearchQuery.length);

        // Ensure exactly one trailing space
        const spaceSuffix = ' ';
        const newText = `${textBefore}\`@${member.user.name}\`${spaceSuffix}${textAfter.trimStart()}`;

        updateActiveComposerState({
            messageDraft: newText,
            mentionedUsers: [...mentionedUsers.filter(u => u.id !== (member.user?.id || member.userId)), member.user]
        });
        setShowMentionDropdown(false);
        setMentionSearchQuery('');

        // Focus back
        setTimeout(() => {
            const el = textareaRef.current;
            if (el) {
                el.focus();
                const newPos = textBefore.length + member.user!.name!.length + 3; // +2 for backticks, +1 for @
                el.setSelectionRange(newPos + 1, newPos + 1); // +1 to put cursor AFTER the added space
            }
        }, 10);
    }, [messageDraft, mentionCursorIndex, mentionSearchQuery, mentionedUsers, updateActiveComposerState]);

    useEffect(() => {
        if (showMentionDropdown && mentionDropdownRef.current && mentionSelectedIndex >= 0) {
            const container = mentionDropdownRef.current;
            const children = container.querySelectorAll('.mention-item');
            const activeItem = children[mentionSelectedIndex] as HTMLElement | null;
            if (activeItem) {
                activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }, [mentionSelectedIndex, showMentionDropdown]);

    const handleSendMessage = useCallback(async (retryMessage?: ChatMessageWithMeta) => {
        const chatId = activeChatId;
        const draftText = retryMessage?.retryPayload?.draftText ?? messageDraft.trim();
        const filesToSend = retryMessage?.retryPayload?.stagedFiles ?? stagedFiles;
        const replyTarget = retryMessage?.retryPayload?.replyToMessage ?? replyToMessage;

        if (!token || !user || !chatId || (!draftText && filesToSend.length === 0)) return;
        if (sendLockRef.current || isSending || isUploading) return;
        sendLockRef.current = true;
        try {
            setIsSending(true);
            let tempMessageId = retryMessage?.id;
            const isRetry = !!retryMessage;
            const organizationId = user?.organizationId ?? user?.orgId ?? null;

            if (!editingMessage) {
                if (!tempMessageId) {
                    tempMessageId = `temp-${Date.now()}`;
                    const optimisticMessage: ChatMessageWithMeta = {
                        id: tempMessageId,
                        chatId,
                        senderId: user.id,
                        organizationId,
                        content: draftText || 'Sent an attachment',
                        type: ChatMessageType.TEXT,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        replyToId: replyTarget?.id || null,
                        replyTo: replyTarget || null,
                        clientStatus: 'sending',
                        retryPayload: {
                            draftText,
                            stagedFiles: [...filesToSend],
                            replyToMessage: replyTarget || null,
                            mentionedUsers: [...mentionedUsers]
                        }
                    };
                    setMessages(prev => [...prev, optimisticMessage]);
                    setTimeout(() => scrollToBottom('instant'), 0);
                } else if (isRetry) {
                    setMessages(prev => prev.map(msg => msg.id === tempMessageId ? {
                        ...msg,
                        clientStatus: 'sending',
                        retryPayload: {
                            draftText,
                            stagedFiles: [...filesToSend],
                            replyToMessage: replyTarget || null,
                            mentionedUsers: [...mentionedUsers]
                        }
                    } : msg));
                }
                pendingMessageIdRef.current = tempMessageId;
            }

            if (!isRetry) {
                updateComposerStateForChat(chatId, {
                    messageDraft: '',
                    replyToMessage: null,
                    stagedFiles: [],
                });
            }

            let finalContent = draftText;

            if (filesToSend.length > 0) {
                setIsUploading(true);
                const orgId = user?.organizationId ?? user?.orgId;
                if (!orgId) throw new Error('Organization ID missing');

                const uploadResults = await Promise.all(
                    filesToSend.map(file => api.files.uploadFile(orgId, 'chat', chatId, file, token))
                );

                const attachmentLinks = uploadResults.map((res, i) => {
                    const file = filesToSend[i];
                    const url = res.url || res.path || '';
                    const isImage = file.type.startsWith('image/');
                    const isPdf = file.type === 'application/pdf';
                    const isOffice = [
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
                    ].includes(file.type);

                    if (isImage) return `\n![${file.name}](${url})`;
                    if (isPdf) return `\n[📄 PDF: ${file.name}](${url})`;
                    if (isOffice) return `\n[📝 Doc: ${file.name}](${url})`;
                    return `\n[📎 Attachment: ${file.name}](${url})`;
                }).join('');

                finalContent += attachmentLinks;
                setIsUploading(false);
            }

            if (editingMessage) {
                await api.chat.editMessage(chatId, editingMessage.id, finalContent, token);
                updateComposerStateForChat(chatId, { editingMessage: null });
            } else {
                const mentionedUserIds = mentionedUsers.map(u => u.id);
                const sentMessage = await api.chat.sendMessage(chatId, finalContent || 'Sent an attachment', token, replyTarget?.id || undefined, mentionedUserIds);
                updateComposerStateForChat(chatId, { mentionedUsers: [] });
                if (tempMessageId) {
                    setMessages(prev => reconcileIncomingMessage(prev, sentMessage, user.id, tempMessageId));
                }
                pendingMessageIdRef.current = null;
                setChats(prev => prev.map(chat => chat.id === chatId ? {
                    ...chat,
                    updatedAt: sentMessage.createdAt,
                    messages: [sentMessage]
                } : chat));
            }

            // Reset textarea size back to single-line after sending
            setTimeout(() => {
                const ta = textareaRef.current as unknown as HTMLTextAreaElement | null;
                if (ta) {
                    ta.style.height = 'auto';
                    try { ta.setSelectionRange(0, 0); } catch { /* ignore */ }
                    ta.rows = 1;
                }
            }, 0);
            setTimeout(() => {
                const ta = textareaRef.current as unknown as HTMLTextAreaElement | null;
                ta?.focus();
            }, 0);
            // sender's own message — no need to call markAsRead here (guarded elsewhere)
        } catch (err) {
            console.error(err);
            const error = err as Error;
            const failedMessageId = retryMessage?.id ?? pendingMessageIdRef.current;
            pendingMessageIdRef.current = null;
            if (!editingMessage && failedMessageId) {
                setMessages(prev => prev.map(msg => msg.id === failedMessageId ? {
                    ...msg,
                    clientStatus: 'failed',
                    retryPayload: {
                        draftText,
                        stagedFiles: [...filesToSend],
                        replyToMessage: replyTarget || null,
                        mentionedUsers: [...mentionedUsers]
                    }
                } : msg));
            }
            setIsUploading(false);
            dispatch({ type: 'TOAST_ADD', payload: { message: error.message || 'Failed to send message', type: 'error' } });
        } finally {
            sendLockRef.current = false;
            setIsSending(false);
        }
    }, [messageDraft, stagedFiles, replyToMessage, token, user, activeChatId, isSending, isUploading, editingMessage, dispatch, scrollToBottom, updateComposerStateForChat]);

    const handleDeleteMessage = useCallback((messageId: string) => {
        if (!token || !activeChatId) return;

        // Check if this is a failed message (client-side only)
        const failedMessage = messages.find(m => m.id === messageId && m.clientStatus === 'failed');

        setConfirmConfig({
            isOpen: true,
            title: 'Delete Message?',
            description: 'Are you sure you want to delete this message? This action cannot be undone.',
            isDestructive: true,
            onConfirm: async () => {
                if (failedMessage) {
                    // For failed messages, just remove from local state
                    setMessages(prev => prev.filter(m => m.id !== messageId));
                } else {
                    // For normal messages, call the API
                    try {
                        await api.chat.deleteMessage(activeChatId, messageId, token);
                    } catch (err) {
                        console.error(err);
                        dispatch({ type: 'TOAST_ADD', payload: { message: 'Failed to delete message', type: 'error' } });
                    }
                }
            }
        });
    }, [token, activeChatId, dispatch, messages]);

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
        const chatId = activeChatId;
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        if (!chatId) return;

        if (stagedFiles.length + files.length > 5) {
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Maximum 5 attachments allowed', type: 'info' } });
            return;
        }

        updateComposerStateForChat(chatId, {
            stagedFiles: [...stagedFiles, ...files]
        });
        e.target.value = '';
    };

    const removeStagedFile = (index: number) => {
        updateActiveComposerState({
            stagedFiles: stagedFiles.filter((_, i) => i !== index)
        });
    };

    const handleChatCreated = (newChatId: string) => {
        setActiveChatId(newChatId);
        fetchChats();
    };


    useEffect(() => {
        if (highlightedMessageId) {
            const timer = setTimeout(() => setHighlightedMessageId(null), 2500);
            return () => clearTimeout(timer);
        }
    }, [highlightedMessageId]);

    const handleReply = useCallback((msg: ChatMessageWithMeta) => {
        if (msg.clientStatus === 'failed') return;
        updateActiveComposerState({
            replyToMessage: msg,
            editingMessage: null
        });
        setTimeout(() => {
            textareaRef.current?.focus();
        }, 50);
    }, [updateActiveComposerState]);

    const handleEditMessage = useCallback((msg: ChatMessageWithMeta) => {
        if (msg.clientStatus === 'failed') return;
        updateActiveComposerState({
            editingMessage: msg,
            replyToMessage: null,
            messageDraft: msg.content
        });
        setIsPreviewMode(false);
        requestAnimationFrame(() => {
            const el = document.querySelector('textarea');
            if (el) {
                el.focus();
                const length = el.value.length;
                el.scrollTop = el.scrollHeight;
                el.setSelectionRange(length, length);
            }
        });

    }, [updateActiveComposerState]);


    const handleCopyText = useCallback((msg: ChatMessage) => {
        navigator.clipboard.writeText(msg.content).then(() => {
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Message text copied to clipboard', type: 'success' } });
        }).catch(err => {
            console.error('Failed to copy text', err);
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Failed to copy text', type: 'error' } });
        });
    }, [dispatch]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (isDesktop && e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (sendLockRef.current || isSending || isUploading) return;
            void handleSendMessage();
        }
    };


    const handleEditorFocus = () => {
        if (token && activeChatId) {
            markAsReadGuard(activeChatId, '', token);
            setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, unreadCount: 0 } : c));
        }
    };

    // Keep textarea height in sync when programmatically changing its value
    useEffect(() => {
        const ta = textareaRef.current as unknown as HTMLTextAreaElement | null;
        if (!ta) return;
        try {
            ta.style.height = 'auto';
            ta.style.height = Math.min(ta.scrollHeight, 250) + 'px';
        } catch (err) {
            console.error(err);
        }
    }, [messageDraft]);

    const isGroupAdmin = useMemo(() => {
        if (!activeChat || !user) return false;
        if (user.role === Role.ORG_ADMIN) return true;
        return activeChat.creatorId === user.id;
    }, [activeChat, user]);

    const handleTouchStart = useCallback((e: React.TouchEvent, msgId: string) => {
        e.stopPropagation();
        if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = window.setTimeout(() => {
            setTappedMessageId(msgId);
        }, 10) as unknown as number;
    }, []);

    const handleTouchEnd = useCallback(() => {
        if (longPressTimerRef.current) {
            window.clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    }, []);

    const handleDownload = useCallback((e: React.MouseEvent, url: string, name: string) => {
        e.stopPropagation();
        const link = document.createElement('a');
        link.href = url;
        link.download = name || 'download';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, []);

    const renderedMessages = useMemo(() => messages.map((msg, i) => {
        const showDateSep = i === 0 || formatChatDateLabel(msg.createdAt) !== formatChatDateLabel(messages[i - 1].createdAt);

        if (msg.type === ChatMessageType.SYSTEM) {
            return (
                <div key={msg.id}>
                    {showDateSep && <div className="chat-date-separator"><span>{formatChatDateLabel(msg.createdAt)}</span></div>}
                    <div className="flex justify-center py-2">
                        <div className="bg-card/80 backdrop-blur-sm text-muted-foreground px-4 py-1.5 rounded-full text-[13px] font-medium flex items-center border border-border shadow-sm">
                            <Info size={12} className="mr-1.5 text-primary/80" />
                            {msg.content}
                        </div>
                    </div>
                </div>
            );
        }

        const isMine = msg.senderId === user?.id;
        const showAvatar = !isMine && (i === 0 || messages[i - 1].senderId !== msg.senderId || messages[i - 1].type === ChatMessageType.SYSTEM);
        const isLastInGroup = i === messages.length - 1 || messages[i + 1].senderId !== msg.senderId || messages[i + 1].type === ChatMessageType.SYSTEM;
        const isDeleted = !!msg.deletedAt;
        const showActionsOnMobile = tappedMessageId === msg.id;
        const isSendingMessage = msg.clientStatus === 'sending';
        const isFailedMessage = msg.clientStatus === 'failed';

        return (
            <div key={msg.id}>
                {showDateSep && <div className="chat-date-separator"><span>{formatChatDateLabel(msg.createdAt)}</span></div>}
                <div
                    id={`msg-${msg.id}`}
                    onTouchStart={(e) => handleTouchStart(e, msg.id)}
                    onTouchEnd={handleTouchEnd}
                    onTouchMove={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'} group/msg relative ${isLastInGroup ? 'mb-3.5' : 'mb-0.5'} px-3 md:px-5 -mx-3 md:-mx-5 ${highlightedMessageId === msg.id ? 'bg-primary/30 rounded-sm' : ''}`}
                >
                    {!isMine && (
                        <div className="w-7 shrink-0 mr-2 flex flex-col justify-end mb-1">
                            {isLastInGroup && <UserAvatar targetUser={msg.sender} className="w-7 h-7 rounded-full" isOnline={!!(msg.sender?.id && onlineUsers[msg.sender.id])} />}
                        </div>
                    )}
                    <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] lg:max-w-[65%] min-w-0 ${isMine ? 'items-end' : 'items-start'}`}>
                        {activeChat?.type === ChatType.GROUP && !isMine && showAvatar && (
                            <span className="text-[13px] font-semibold text-primary/70 mb-0.5 ml-1 tracking-wide">
                                {msg.sender?.name}
                            </span>
                        )}
                        <div className={`flex items-end space-x-1.5 relative max-w-full min-w-0 group/content ${isMine ? 'flex-row-reverse space-x-reverse justify-start' : 'flex-row justify-end'}`}>
                            <div className="flex flex-col items-inherit max-w-full min-w-0">
                                {msg.replyTo && !isDeleted && (() => {
                                    const isMineRepliedTo = msg.replyTo.senderId === user?.id;
                                    return (
                                        <div
                                            onClick={(e) => { e.stopPropagation(); void scrollToMessage(msg.replyTo!.id); }}
                                            className={`mb-0.5 mt-3 px-3 py-1.5 rounded-lg border-l-5 text-[14px] bg-muted max-w-full overflow-hidden cursor-pointer hover:opacity-80 transition-opacity text-foreground
                                                        ${isMineRepliedTo ? 'border-primary' : 'border-foreground/70'}`}
                                        >
                                            <p className="font-semibold mb-0.5 text-[14px] flex items-center">
                                                <Reply size={13} className='mr-1 rotate-180' />
                                                {msg.replyTo.sender?.name || 'Someone'}
                                            </p>
                                            <div className="truncate line-clamp-1 opacity-95">
                                                <MarkdownRenderer content={getTruncatedMessagePreview(msg.replyTo.deletedAt ? 'Message deleted' : msg.replyTo.content, isDesktop ? 70 : 35)} className={`${msg.replyTo.deletedAt ? 'italic text-muted-foreground!' : 'text-foreground!'}`} />
                                            </div>
                                        </div>
                                    );
                                })()}
                                {isDeleted ? (
                                    <div className={`px-3.5 py-2 rounded-2xl text-[13px] leading-relaxed my-1 bg-card text-muted-foreground border border-border ${isMine ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
                                        <div className="flex items-center space-x-1.5 italic">
                                            <Trash2 size={13} className="opacity-50 text-red-500" />
                                            <span>Message deleted {msg.deletedBy?.name ? `by ${msg.deletedBy.name} ` : ''} <span className='opacity-70'>{formatChatTimestamp(msg.createdAt!)}</span></span>
                                        </div>
                                    </div>
                                ) : (
                                    (() => {
                                        const imageRegex = /(!\[.*?\]\(.*?\))/g;
                                        const segments = msg.content.split(imageRegex).filter(s => s.trim() !== '');

                                        return (
                                            <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} space-y-3`}>
                                                {segments.map((segment, idx) => {
                                                    const isImage = segment.match(/^!\[.*?\]\(.*?\)$/);
                                                    if (isImage) {
                                                        return (
                                                            <div key={idx} className={`naked-image-container max-w-full rounded-xl relative ${isSendingMessage && isMine ? 'animate-in fade-in slide-in-from-bottom-1 duration-200' : ''}`}>
                                                                <div className="relative">
                                                                    <MarkdownRenderer content={segment} />
                                                                    <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[11px] px-2 py-0.5 rounded-md flex items-center space-x-1">
                                                                        <span className="font-medium">{formatChatTimestamp(msg.createdAt)}</span>
                                                                        {isMine && (
                                                                            isSendingMessage ? (
                                                                                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" strokeWidth={2.5} />
                                                                            ) : isFailedMessage ? (
                                                                                <RotateCcw className="w-3.5 h-3.5 text-white/80" strokeWidth={2.5} />
                                                                            ) : msg.readBy && msg.readBy.length > 0 ? (
                                                                                <CheckCheck className="w-4 h-4 text-white" strokeWidth={2.5} />
                                                                            ) : (
                                                                                <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div
                                                            key={idx}
                                                            className={`message-bubble px-3.5 py-2 rounded-2xl leading-relaxed relative shadow-lg
                                                                        ${isMine
                                                                    ? 'bg-primary text-foreground rounded-br-sm shadow-primary/50'
                                                                    : 'bg-card border border-border rounded-bl-sm shadow-black/10 text-foreground!'
                                                                }
                                                                        ${isSendingMessage && isMine ? 'animate-in fade-in slide-in-from-bottom-1 duration-200' : ''}
                                                                        `}>

                                                            <div className={`prose prose-sm max-w-full prose-p:mb-0 ${isMine && highlightedMessageId !== msg.id ? 'prose-invert' : 'prose-p:text-foreground!'}`}>
                                                                <MarkdownRenderer content={segment} className={`${isMine ? 'text-foreground!' : 'text-(--card-text)!'} whitespace-pre-wrap wrap-break-word text-foreground!`} />
                                                            </div>
                                                            <span className="text-[12px] text-foreground font-medium flex items-center justify-end space-x-1">
                                                                {msg.updatedAt && msg.updatedAt !== msg.createdAt && (
                                                                    <span className="text-[10px] text-foreground font-medium italic opacity-85">Edited</span>
                                                                )}
                                                                <span className='text-[11px] text-foreground/80'>{formatChatTimestamp(msg.createdAt)}</span>
                                                                {isMine && (
                                                                    isSendingMessage ? (
                                                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-foreground/70" strokeWidth={2.5} />
                                                                    ) : isFailedMessage ? (
                                                                        <span className="ml-1 inline-flex items-center gap-1">
                                                                            <span className="text-[10px] text-foreground/60">Failed</span>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => { void handleSendMessage(msg); }}
                                                                                disabled={sendLockRef.current || isSending || isUploading}
                                                                                className="inline-flex items-center gap-1 rounded-full border border-foreground/15 px-1.5 py-0.5 text-[10px] text-foreground/75 hover:bg-foreground/8 disabled:opacity-50"
                                                                                title="Retry send"
                                                                            >
                                                                                <RotateCcw className="w-3 h-3" strokeWidth={2.5} />
                                                                            </button>
                                                                        </span>
                                                                    ) : msg.readBy && msg.readBy.length > 0 ? (
                                                                        <CheckCheck className="w-4 h-4 text-foreground/70" strokeWidth={2.5} />
                                                                    ) : (
                                                                        <Check className="w-4 h-4 text-foreground/70" strokeWidth={2.5} />
                                                                    )
                                                                )}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()
                                )}
                            </div>

                            {!isDeleted && (
                                <div className={`absolute top-1 ${isMine ? '-left-6' : '-right-6'} shrink-0 flex items-center justify-center transition-all mb-4.5
                                                                        ${isDesktop
                                        ? `${openDropdownId !== msg.id ? 'opacity-0 group-hover/content:opacity-100' : 'opacity-100'}`
                                        : `${showActionsOnMobile || openDropdownId === msg.id ? 'opacity-100' : 'opacity-0'}`
                                    }
                                                                    `}>
                                    <button
                                        onClick={(e) => {
                                            try { (e.nativeEvent).stopImmediatePropagation(); } catch (err) { console.error(err); }
                                            e.preventDefault();
                                            e.stopPropagation();
                                            suppressCloseRef.current = msg.id;
                                            window.setTimeout(() => { if (suppressCloseRef.current === msg.id) suppressCloseRef.current = null; }, 300);
                                            setOpenDropdownId(prev => prev === msg.id ? null : msg.id);
                                        }}
                                        className={`p-1.5 rounded-lg transition-all border shadow-sm ${openDropdownId === msg.id ? 'bg-foreground text-primary border-primary/20' : 'text-muted-foreground hover:text-primary hover:bg-foreground/70 border-border bg-foreground/80 backdrop-blur-sm'} more-actions-btn`}
                                        title="More actions"
                                    >
                                        <MoreVertical size={15} className="text-primary/80 hover:text-primary" />
                                    </button>
                                    {openDropdownId === msg.id && (
                                        <div className={`absolute ${isMine ? 'left-0' : 'right-0'} ${i === messages.length - 1 ? 'bottom-full' : 'top-full'} overflow-hidden mb-1 w-32 bg-card border border-border rounded-xl shadow-xl z-99 flex flex-col animate-in fade-in zoom-in-95 duration-100 chat-dropdown`}>
                                            {!isFailedMessage && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); handleReply(msg); }}
                                                    className="w-full rounded-sm text-left px-3 py-2 text-[13px] text-foreground hover:bg-primary/40 flex items-center"
                                                >
                                                    <Reply size={12} className="mr-2 opacity-85 text-purple-700" /> Reply
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); handleCopyText(msg); }}
                                                className="w-full rounded-sm text-left px-3 py-2 text-[13px] text-foreground hover:bg-primary/40 flex items-center"
                                            >
                                                <Copy size={12} className="mr-2 opacity-85 text-yellow-400" /> Copy Text
                                            </button>
                                            {isMine && !isFailedMessage && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); handleEditMessage(msg); }}
                                                    className="w-full rounded-sm text-left px-3 py-2 text-[13px] text-foreground hover:bg-primary/40 flex items-center"
                                                >
                                                    <Pencil size={12} className="mr-2 opacity-85 text-green-400" /> Edit
                                                </button>
                                            )}
                                            {Array.from(msg.content.matchAll(/\[([^\]]*)\]\((https?:\/\/[^\)]+)\)/g)).map((match, idx) => {
                                                const label = (match[1] || '').trim();
                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); handleDownload(e, match[2], label || 'download'); }}
                                                        className="w-full rounded-sm text-left px-3 py-2 text-[13px] text-foreground hover:bg-primary/40 flex items-center"
                                                    >
                                                        <Download size={12} className="mr-2 opacity-85 text-blue-400" />
                                                        Download
                                                    </button>
                                                );
                                            })}
                                            {(isMine || user?.role === Role.ORG_ADMIN) && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); handleDeleteMessage(msg.id); }}
                                                    className="w-full rounded-sm text-left px-3 py-2 text-[13px] text-red-600 hover:bg-red-700/30 flex items-center border-t border-border"
                                                >
                                                    <Trash2 size={12} className="mr-2 opacity-85 text-red-500" /> Delete
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }), [messages, user?.id, user?.role, tappedMessageId, openDropdownId, highlightedMessageId, isDesktop, activeChat?.type, handleTouchStart, handleTouchEnd, scrollToMessage, isSending, isUploading, handleReply, handleCopyText, handleEditMessage, handleDownload, handleDeleteMessage, handleSendMessage, onlineUsers]);

    if (!user) return null;

    const isComposerExpanded =
        messageDraft.length > (isDesktop ? 150 : 30) ||
        messageDraft.includes('\n');

    return (
        <div className="flex h-full bg-card lg:shadow-md lg:border border-border overflow-hidden relative">
            {/* ===== SIDEBAR ===== */}
            <div className={`
            ${activeChatId && !isDesktop ? 'hidden' : 'flex'} 
            w-full sm:max-w-xs md:max-w-sm lg:max-w-[320px] xl:max-w-87.5 2xl:max-w-95 border-r border-border flex-col bg-card h-full transition-all duration-300 ease-in-out
        `}>
                <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-border bg-card/50 flex justify-between items-center">
                    <div>
                        <h2 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight">Messages</h2>
                        <p className="text-[12px] sm:text-[13px] text-muted-foreground font-semibold tracking-wide mt-0.5">{chats.length} conversation{chats.length !== 1 ? 's' : ''}</p>
                    </div>
                    {user.role !== Role.STUDENT && (
                        <button
                            onClick={() => setIsNewChatModalOpen(true)}
                            className="p-2.5 bg-primary/30 text-primary rounded-xl hover:bg-primary-hover transition-all shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-95"
                            title="New Chat"
                        >
                            <MessageSquarePlus size={18} className="text-primary/80 hover:text-primary" />
                        </button>
                    )}
                </div>

                {/* Search */}
                <div className="px-3 sm:px-4 py-2 sm:py-3">
                    <div className="relative">
                        <Search size={isDesktop ? 16 : 14} className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-primary/80 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-background/80 border border-border/50 rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:bg-background focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all"
                        />
                    </div>
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {isLoadingChats ? (
                        <div className="p-4 space-y-1">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center p-3 space-x-3 rounded-xl">
                                    <div className="w-12 h-12 rounded-full skeleton-shimmer shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3.5 w-2/3 rounded-md skeleton-shimmer" />
                                        <div className="h-3 w-full rounded-md skeleton-shimmer" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredChats.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                            <div className="w-16 h-16 bg-primary/30 rounded-2xl flex items-center justify-center mb-4">
                                <MessageSquarePlus size={28} className="text-primary/80" />
                            </div>
                            <p className="text-sm font-semibold text-foreground mb-1">No conversations yet</p>
                            <p className="text-xs text-muted-foreground">Start a new chat to begin messaging</p>
                        </div>
                    ) : (
                        filteredChats.map(chat => {
                            const otherUsers = chat.participants?.filter(p => (p.userId !== user.id) && p.isActive) || [];
                            const displayName = chat.type === ChatType.GROUP
                                ? chat.name || 'Unnamed Group'
                                : otherUsers[0]?.user?.name || 'Unknown User';

                            const lastMsg = chat.messages?.[0];
                            const isActive = activeChatId === chat.id;
                            const hasUnread = chat.unreadCount !== undefined && chat.unreadCount > 0;

                            return (
                                <button
                                    type='button'
                                    key={chat.id}
                                    onClick={() => setActiveChatId(chat.id)}
                                    className={`w-full flex items-center px-3 sm:px-4 py-3 sm:py-3.5 transition-all text-left group relative
                                        ${isActive
                                            ? 'bg-primary/5 border-l-[3px] border-l-primary'
                                            : 'hover:bg-muted/50 border-l-[3px] border-l-transparent'
                                        }`}
                                >
                                    <div className="relative mr-2.5 sm:mr-3 shrink-0">
                                        <UserAvatar
                                            targetUser={chat.type === ChatType.GROUP
                                                ? { name: displayName, avatarUrl: chat.avatarUrl, avatarUpdatedAt: chat.avatarUpdatedAt }
                                                : otherUsers[0]?.user
                                            }
                                            className="w-10 h-10 sm:w-12 sm:h-12"
                                            isOnline={!!(chat.type === ChatType.DIRECT && otherUsers[0]?.user?.id && onlineUsers[otherUsers[0].user.id])}
                                        />
                                        {hasUnread && (
                                            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-primary rounded-full border-2 border-background" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <h4 className={`text-[12px] sm:text-[13.5px] truncate pr-2 ${isActive ? 'font-bold text-primary' : hasUnread ? 'font-bold text-foreground' : 'font-semibold text-foreground/80'}`}>
                                                {displayName}
                                            </h4>
                                            {lastMsg && (
                                                <span className={`text-[11px] sm:text-[13px] shrink-0 ${hasUnread ? 'text-primary font-bold' : 'text-muted-foreground font-medium'}`}>
                                                    {formatDistanceToNow(new Date(lastMsg.createdAt), { addSuffix: false })}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className={`text-[11px] sm:text-[13px] truncate flex-1 ${hasUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                                {lastMsg ? (
                                                    <>
                                                        <span className="text-muted-foreground">{lastMsg.senderId === user.id ? 'You: ' : (chat.type === ChatType.GROUP ? `${lastMsg.sender?.name?.split(' ')[0]}: ` : '')}</span>
                                                        {lastMsg.deletedAt ? (
                                                            <span className="italic text-muted-foreground">Message deleted</span>
                                                        ) : (
                                                            (() => {
                                                                const content = lastMsg.content || '';
                                                                if (content.includes('![')) {
                                                                    const textPart = content.replace(/!\[.*?\]\(.*?\)/g, '').trim();
                                                                    return textPart ? `${textPart} 📷` : '📷 Photo';
                                                                }
                                                                return content;
                                                            })()
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="italic text-muted-foreground">Tap to start chatting</span>
                                                )}
                                            </p>
                                            {hasUnread && (
                                                <span className="ml-1.5 sm:ml-2 flex items-center justify-center min-w-4 h-4 sm:min-w-5 sm:h-5 px-1 sm:px-1.5 text-[11px] sm:text-[13px] font-bold text-foreground bg-primary/30 rounded-full">
                                                    {chat.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
            {/* ===== CHAT PANEL ===== */}
            <div className={`
            ${!activeChatId && !isDesktop ? 'hidden' : 'flex'} 
            flex-1 flex-col bg-background h-full relative overflow-hidden
            ${!isDesktop && activeChatId ? 'animate-in slide-in-from-right duration-300 ease-out' : ''}
        `}>
                {activeChat ? (
                    <>
                        {/* Chat Header */}
                        <div
                            className="relative w-full px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border flex items-center justify-between z-20 bg-background/95 backdrop-blur-md transition-all duration-200"
                        >
                            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                                {!isDesktop && (
                                    <button
                                        type='button'
                                        title='Back'
                                        className="p-1.5 -ml-1 text-foreground/60 hover:text-primary hover:bg-muted rounded-xl transition-all active:scale-95"
                                        onClick={() => setActiveChatId(null)}
                                    >
                                        <ChevronLeft size={22} className="text-primary/80 hover:text-primary" />
                                    </button>
                                )}
                                <UserAvatar
                                    targetUser={activeChat.type === ChatType.GROUP
                                        ? { name: activeChat.name, avatarUrl: activeChat.avatarUrl, avatarUpdatedAt: activeChat.avatarUpdatedAt }
                                        : activeChat.participants?.find(p => p.userId !== user.id)?.user
                                    }
                                    className="w-9 h-9 sm:w-10 sm:h-10"
                                    isOnline={!!(directChatTarget?.id && onlineUsers[directChatTarget.id])}
                                />
                                <div className="min-w-0">
                                    <h3 className="font-bold text-[14px] sm:text-[15px] text-foreground leading-tight truncate">
                                        {activeChat.type === ChatType.GROUP ? activeChat.name : activeChat.participants?.find(p => p.userId !== user.id)?.user?.name || 'Unknown'}
                                    </h3>
                                    <button
                                        type='button'
                                        id="participants-toggle"
                                        onClick={() => setShowParticipants(!showParticipants)}
                                        className={`text-[12px] sm:text-[13px] font-semibold rounded-md transition-all flex items-center gap-1.5 ${showParticipants ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                                    >
                                        {typingIndicatorLabel ? (
                                            <span className="inline-flex items-center gap-1.5">
                                                <span>{typingIndicatorLabel}</span>
                                                <span className="inline-flex items-center gap-0.5">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-primary/80 animate-bounce [animation-delay:-0.2s]" />
                                                    <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.1s]" />
                                                    <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" />
                                                </span>
                                            </span>
                                        ) : activeChat.type === ChatType.GROUP
                                            ? `${activeChat.participants?.filter(p => p.isActive).length || 0} members`
                                            : onlineUsers[directChatTarget?.id || '']
                                                ? 'Online'
                                                : activeChat.participants?.find(p => p.userId !== user.id)?.user?.role?.replace('_', ' ').toLowerCase() || 'member'}
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center space-x-1">
                                {activeChat.type === ChatType.GROUP && (
                                    <Button
                                        type='button'
                                        variant="secondary"
                                        px="px-2"
                                        py="py-2"
                                        onClick={() => setIsSettingsModalOpen(true)}
                                        className="text-muted-foreground hover:text-foreground rounded-xl bg-transparent border-none shadow-none"
                                        title="Chat Settings"
                                        icon={MoreVertical}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 flex overflow-hidden relative">
                            <div
                                ref={messagesContainerRef}
                                onScroll={handleScroll}
                                className="flex-1 overflow-y-auto overflow-x-hidden px-2 sm:px-3 md:px-4 lg:px-5 py-2 sm:py-3 space-y-0.5 custom-scrollbar chat-bg-pattern"
                                style={{
                                    paddingBottom: !isDesktop
                                        ? `calc(${composerHeight + 16}px + env(safe-area-inset-bottom, 0px))`
                                        : composerHeight + 16
                                }}
                            >
                                {isLoadingMessages ? (
                                    <div className="flex flex-col items-center justify-center py-16 space-y-3">
                                        <Loader2 className="w-6 h-6 animate-spin text-primary/80" />
                                        <span className="text-xs text-muted-foreground font-medium">Loading messages...</span>
                                    </div>
                                ) : (
                                    <>
                                        {!hasMoreMessages && (
                                            <div className="flex justify-center py-3">
                                                <div className="bg-card/80 backdrop-blur-sm text-muted-foreground px-4 py-1.5 rounded-full text-[13px] font-medium flex items-center border border-border shadow-sm">
                                                    <Info size={12} className="mr-1.5 text-primary/80" />
                                                    This is the beginning of this chat
                                                </div>
                                            </div>
                                        )}
                                        {hasMoreMessages && (
                                            <div className="flex justify-center py-3">
                                                <Button
                                                    onClick={loadEarlierMessages}
                                                    disabled={isLoadingMore}
                                                    variant="secondary"
                                                    px="px-4"
                                                    py="py-1.5"
                                                    className="bg-card/90 backdrop-blur-sm border border-border rounded-full text-[13px] font-semibold text-muted-foreground hover:text-primary hover:border-primary/30 transition-all shadow-sm active:scale-95 flex items-center"
                                                    icon={isLoadingMore ? Loader2 : ArrowUp}
                                                >
                                                    {isLoadingMore ? 'Loading...' : 'Load earlier'}
                                                </Button>
                                            </div>
                                        )}
                                        {renderedMessages}

                                        <div ref={messagesEndRef} />

                                        {hasMoreAfter && (
                                            <div className="flex justify-center py-3">
                                                <Button
                                                    onClick={loadNewerMessages}
                                                    disabled={isLoadingNewer}
                                                    variant="secondary"
                                                    px="px-4"
                                                    py="py-1.5"
                                                    className="bg-card/90 backdrop-blur-sm border border-border rounded-full text-[11px] font-semibold text-muted-foreground hover:text-primary hover:border-primary/30 transition-all shadow-sm active:scale-95 flex items-center"
                                                    icon={isLoadingNewer ? Loader2 : ArrowDown}
                                                >
                                                    {isLoadingNewer ? 'Loading...' : 'Load newer'}
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* History Mode Banner */}
                            {isViewingHistory && (
                                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-foreground text-background px-4 py-2 rounded-full shadow-lg backdrop-blur-sm flex items-center space-x-3 text-[13px] font-semibold animate-in slide-in-from-top duration-300">
                                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                                    <span>Viewing history</span>
                                    <button
                                        onClick={() => activeChatId && fetchInitialMessages(activeChatId)}
                                        className="bg-background text-foreground px-3 py-1 rounded-full hover:bg-muted transition-colors font-bold text-[13px]"
                                    >
                                        Jump to present
                                    </button>
                                </div>
                            )}

                            {/* Scroll to Bottom FAB */}
                            {((showScrollToBottom && !isLoadingMessages) || isViewingHistory) && (
                                <button
                                    type="button"
                                    onClick={() => isViewingHistory ? (activeChatId && fetchInitialMessages(activeChatId)) : scrollToBottom()}
                                    className="absolute right-5 z-30 p-2.5 bg-card text-foreground/70 rounded-full shadow-lg border border-border hover:bg-card/95 hover:text-primary hover:border-primary transition-all active:scale-95 group"
                                    style={{
                                        bottom: !isDesktop
                                            ? `calc(${composerHeight + 12}px + env(safe-area-inset-bottom, 0px))`
                                            : composerHeight + 12
                                    }}
                                    title={isViewingHistory ? "Jump to Present" : "Scroll to bottom"}
                                >
                                    <ArrowDown size={18} className="group-hover:translate-y-0.5 transition-transform text-primary/80" />
                                    {!isViewingHistory && unreadSinceScroll > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 bg-primary/30 text-primary text-[9px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-card shadow-sm">
                                            {unreadSinceScroll}
                                        </span>
                                    )}
                                </button>
                            )}

                            {/* Participants Drawer */}
                            {showParticipants && (
                                <div
                                    ref={participantsRef}
                                    className="absolute top-0 right-0 h-full w-64 sm:w-72 bg-card border-l border-border shadow-2xl z-30 animate-in slide-in-from-right duration-300 flex flex-col"
                                >
                                    <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border flex justify-between items-center">
                                        <h4 className="font-bold text-foreground text-[12px] sm:text-[13px]">Members</h4>
                                        <button
                                            type="button"
                                            onClick={() => setShowParticipants(false)}
                                            className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-lg transition-colors"
                                            title="Close"
                                        >
                                            <X size={16} className="text-primary/80 hover:text-primary" />
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-0.5 custom-scrollbar">
                                        {activeChat.participants?.filter(p => p.isActive).map(p => (
                                            <div key={p.id} className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl hover:bg-muted transition-colors group/item">
                                                <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0">
                                                    <UserAvatar targetUser={p.user} className="w-7 h-7 sm:w-8 sm:h-8" isOnline={!!onlineUsers[p.userId]} />
                                                    <div className="min-w-0">
                                                        <p className="text-[12px] sm:text-[13px] font-semibold text-foreground truncate">{p.user?.name} {p.userId === user.id && <span className="text-muted-foreground font-normal">(You)</span>}</p>
                                                        <p className="text-[11px] sm:text-[13px] text-muted-foreground font-medium capitalize truncate">{p.user?.role?.toLowerCase().replace('_', ' ')}</p>
                                                    </div>
                                                </div>
                                                {isGroupAdmin && p.userId !== user.id && p.userId !== activeChat.creatorId && (
                                                    <Button
                                                        variant="danger"
                                                        px="p-1.5"
                                                        py="p-1.5"
                                                        onClick={() => handleRemoveParticipant(p.userId)}
                                                        className="text-muted-foreground hover:text-primary rounded-lg opacity-0 group-hover/item:opacity-100 transition-all bg-transparent border-none shadow-none"
                                                        title="Remove from group"
                                                        icon={UserMinus}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* Input Composer - Only show if user can send messages */}
                            {canSendMessage ? (
                            <div
                                ref={composerRef}
                                className="absolute bottom-0 w-full border-border px-2 sm:px-3 py-2 z-20"
                                style={!isDesktop ? { paddingBottom: mobileBottomInset } : undefined}
                            >
                                {/* Reply / Edit Banner */}
                                {(replyToMessage || editingMessage) && (
                                    <div className="mb-1.5 sm:mb-1 px-2.5 sm:px-3 py-2 sm:py-2 mr-2 bg-muted border-l-4 border-primary rounded-lg flex items-center justify-between animate-in slide-in-from-bottom duration-200">
                                        <div className="flex-1 min-w-0 pr-2 sm:pr-3">
                                            <p className="text-[12px] sm:text-[13px] font-semibold text-primary mb-0.5">
                                                {editingMessage ? 'Editing Message' : `Replying to ${replyToMessage?.sender?.name == user.name ? 'Yourself' : replyToMessage?.sender?.name || 'Message'}`}
                                            </p>
                                            <div
                                                onClick={() => { if (replyToMessage) scrollToMessage(replyToMessage.id); else (scrollToMessage(editingMessage!.id)) }}
                                                className="text-[12px] sm:text-[13px] text-muted-foreground! truncate cursor-pointer"
                                            >
                                                <MarkdownRenderer content={getTruncatedMessagePreview(editingMessage?.content || replyToMessage?.content, isDesktop ? 70 : 35)} className='text-muted-foreground!' />
                                            </div>
                                        </div>
                                        <button
                                            title='Cancel'
                                            type="button"
                                            onClick={() => {
                                                updateActiveComposerState({ replyToMessage: null });
                                                if (editingMessage) {
                                                    updateActiveComposerState({
                                                        editingMessage: null,
                                                        messageDraft: ''
                                                    });
                                                }
                                            }}
                                            className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/40 rounded-lg transition-colors"
                                        >
                                            <X size={14} className="text-primary/80 hover:text-primary" />
                                        </button>
                                    </div>
                                )}

                                {/* Mention Banner */}
                                {mentionedUsers.length > 0 && !editingMessage && (
                                    <div className="mb-1.5 sm:mb-1 px-2.5 sm:px-3 py-2 sm:py-2 mr-2 bg-muted border-l-4 border-indigo-500 rounded-lg flex items-center justify-between animate-in slide-in-from-bottom duration-200">
                                        <div className="flex-1 min-w-0 pr-2 sm:pr-3">
                                            <p className="text-[12px] sm:text-[13px] font-semibold text-indigo-500 mb-0.5">
                                                Mentioning
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                                {mentionedUsers.map(u => (
                                                    <span key={u.id} className="text-[11px] sm:text-[12px] bg-indigo-500/10 text-indigo-600 px-1.5 py-0.5 rounded-md font-medium">
                                                        @{u.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <button
                                            title='Clear Mentions'
                                            type="button"
                                            onClick={() => updateActiveComposerState({ mentionedUsers: [] })}
                                            className="p-1 text-muted-foreground hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-colors"
                                        >
                                            <X size={14} className="text-indigo-500/80 hover:text-indigo-500" />
                                        </button>
                                    </div>
                                )}

                                {/* Staged Files */}
                                {stagedFiles.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-1.5 sm:mb-1 mr-2">
                                        {stagedFiles.map((file, i) => (
                                            <div key={i} className="group relative flex items-center bg-muted border border-border pl-2 pr-1 py-1 rounded-xl hover:border-primary/30 transition-all">
                                                {file.type.startsWith('image/') ? (
                                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden bg-muted-foreground/10 mr-1.5 sm:mr-2 relative">
                                                        <Image src={URL.createObjectURL(file)} alt="" fill className="object-cover" unoptimized />
                                                    </div>
                                                ) : (
                                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mr-1.5 sm:mr-2">
                                                        <Pencil size={14} className="text-primary/80" />
                                                    </div>
                                                )}
                                                <div className="flex flex-col mr-1 sm:mr-1.5 max-w-16 sm:max-w-20">
                                                    <span className="text-[11px] sm:text-[13px] font-semibold text-foreground truncate">{file.name}</span>
                                                    <span className="text-[10px] sm:text-[11px] text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    title='Remove'
                                                    onClick={() => removeStagedFile(i)}
                                                    className="p-0.5 text-foreground hover:text-red-500 rounded-full transition-all"
                                                >
                                                    <X size={12} className="text-primary/80 hover:text-primary" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Preview Mode Render - unchanged */}
                                {isPreviewMode && messageDraft.trim() && (
                                    <div className="my-1 px-4 py-3 mx-2 bg-muted rounded-xl border border-border max-h-37.5 overflow-y-auto custom-scrollbar">
                                        <div className="prose prose-sm max-w-none prose-p:text-foreground/80">
                                            <MarkdownRenderer content={messageDraft} className='text-foreground!' />
                                        </div>
                                    </div>
                                )}

                                {/* Composer Row */}
                                <div className={`flex mr-2 flex-col space-y-1.5 sm:space-y-2`}>
                                    <input
                                        title="Upload File"
                                        type="file"
                                        id="chat-file-upload"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                        multiple
                                    />

                                    {/* Main composer container */}
                                    <div className="w-full bg-muted border border-transparent mb-1.5 sm:mb-2 rounded-2xl focus-within:bg-card focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                                        {/* Top row */}
                                        <div className={`flex items-end ${isComposerExpanded ? 'px-2 pt-1' : 'px-2'}`}>
                                            {/* Left buttons only in compact mode */}
                                            {!isComposerExpanded && (
                                                <div className="flex items-center gap-0.5 sm:gap-1 pb-3 sm:pb-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsPreviewMode(!isPreviewMode)}
                                                        className="text-primary/80 hover:text-primary hover:scale-110 transition-all px-1.5 sm:px-2 rounded-lg"
                                                        title={isPreviewMode ? "Write text" : "Preview markdown"}
                                                    >
                                                        {isPreviewMode ? <Pencil size={24} /> : <View size={24} />}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => document.getElementById('chat-file-upload')?.click()}
                                                        className="text-primary/80 hover:text-primary hover:scale-110 transition-all px-1.5 sm:px-2 rounded-lg"
                                                        title="Attach file"
                                                    >
                                                        <Paperclip size={22} className="cursor-pointer -rotate-45" />
                                                    </button>
                                                </div>
                                            )}

                                            {/* Textarea */}
                                            <div className="relative flex-1 py-0.5">
                                                <textarea
                                                    ref={textareaRef}
                                                    value={messageDraft}
                                                    disabled={isUploading}
                                                    onChange={(e) => {
                                                        const el = e.target;
                                                        const newVal = el.value;
                                                        const cursorIdx = el.selectionStart || 0;

                                                        // Auto-deselect mentions if they are erased from text (check specifically for `@name`)
                                                        const remainingMentions = mentionedUsers.filter(u => newVal.includes(`@${u.name}`));
                                                        const wasMentionRemoved = remainingMentions.length !== mentionedUsers.length;

                                                        updateActiveComposerState({
                                                            messageDraft: newVal,
                                                            ...(wasMentionRemoved ? { mentionedUsers: remainingMentions } : {})
                                                        });

                                                        el.style.height = 'auto';
                                                        el.style.height = el.scrollHeight + 'px';
                                                        el.style.height = Math.min(el.scrollHeight, 200) + 'px';

                                                        // @Mention Detection
                                                        const textBeforeCursor = newVal.slice(0, cursorIdx);
                                                        const lastAtIdx = textBeforeCursor.lastIndexOf('@');
                                                        if (lastAtIdx !== -1 && (lastAtIdx === 0 || textBeforeCursor[lastAtIdx - 1] === ' ')) {
                                                            const query = textBeforeCursor.slice(lastAtIdx + 1);
                                                            if (!query.includes(' ')) {
                                                                setMentionSearchQuery(query);
                                                                setShowMentionDropdown(true);
                                                                setMentionCursorIndex(lastAtIdx);
                                                                setMentionSelectedIndex(0); // Reset index
                                                            } else {
                                                                setShowMentionDropdown(false);
                                                            }
                                                        } else {
                                                            setShowMentionDropdown(false);
                                                        }
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (showMentionDropdown && filteredMembers.length > 0) {
                                                            if (e.key === 'ArrowDown') {
                                                                e.preventDefault();
                                                                setMentionSelectedIndex(prev => (prev + 1) % filteredMembers.length);
                                                                return;
                                                            }
                                                            if (e.key === 'ArrowUp') {
                                                                e.preventDefault();
                                                                setMentionSelectedIndex(prev => (prev - 1 + filteredMembers.length) % filteredMembers.length);
                                                                return;
                                                            }
                                                            if (e.key === 'Enter' || e.key === 'Tab') {
                                                                e.preventDefault();
                                                                handleSelectMember(filteredMembers[mentionSelectedIndex]);
                                                                return;
                                                            }
                                                            if (e.key === 'Escape') {
                                                                setShowMentionDropdown(false);
                                                                return;
                                                            }
                                                        }
                                                        handleKeyDown(e);
                                                    }}
                                                    onFocus={handleEditorFocus}
                                                    onBlur={() => setTimeout(() => setShowMentionDropdown(false), 200)}
                                                    placeholder={stagedFiles.length > 0 ? "Add a caption..." : `Message... ${isDesktop ? '(Shift + Enter for new line)' : ''}`}
                                                    rows={1}
                                                    className={`w-full bg-transparent px-1.5 sm:px-2 pb-2 pt-2.5 sm:pt-3 border-none text-[13px] sm:text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 resize-none max-h-60 leading-relaxed`}
                                                />

                                                {/* Mention Dropdown */}
                                                {showMentionDropdown && filteredMembers.length > 0 && (
                                                    <div className="absolute bottom-full left-0 mb-2 w-56 sm:w-64 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                                                        <div className="p-1.5 sm:p-2 border-b border-border">
                                                            <p className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-2">Group Members</p>
                                                        </div>
                                                        <div
                                                            ref={mentionDropdownRef}
                                                            className="max-h-48 sm:max-h-60 overflow-y-auto py-1 custom-scrollbar"
                                                        >
                                                            {filteredMembers.map((member, idx) => (
                                                                <button
                                                                    key={member.userId}
                                                                    type="button"
                                                                    onMouseDown={(e) => {
                                                                        e.preventDefault(); // Prevents textarea from losing focus
                                                                        handleSelectMember(member);
                                                                    }}
                                                                    className={`mention-item w-full flex items-center space-x-2 sm:space-x-3 px-2.5 sm:px-3 py-1.5 sm:py-2 transition-colors ${idx === mentionSelectedIndex ? 'bg-primary/10' : 'hover:bg-muted'}`}
                                                                >
                                                                    <UserAvatar targetUser={member.user} className="w-6 h-6 sm:w-7 sm:h-7" isOnline={!!onlineUsers[member.userId]} />
                                                                    <div className="text-left min-w-0">
                                                                        <p className="text-[12px] sm:text-[13px] font-semibold text-foreground truncate">{member.user?.name}</p>
                                                                        <p className="text-[10px] sm:text-[11px] text-muted-foreground capitalize">{member.user?.role?.toLowerCase().replace('_', ' ')}</p>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Send button only in compact mode */}
                                            {!isComposerExpanded && (messageDraft.trim() || stagedFiles.length > 0) && (
                                                <button
                                                    type="button"
                                                    onClick={() => { void handleSendMessage(); }}
                                                    disabled={(!messageDraft.trim() && stagedFiles.length === 0) || isSending || isUploading}
                                                    className="shrink-0 mr-2 pb-3 sm:pb-4 px-1.5 sm:px-2 rounded-lg text-primary/80 hover:text-primary active:scale-95 transition-all"
                                                    title="Send"
                                                >
                                                    <Send size={24} className="cursor-pointer" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Bottom row actions in expanded mode */}
                                        {isComposerExpanded && (
                                            <div className="flex items-center justify-between px-2 py-1.5 sm:py-2">
                                                <div className="flex items-center gap-0.5 sm:gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsPreviewMode(!isPreviewMode)}
                                                        className="text-primary/80 hover:text-primary hover:scale-110 transition-all px-1.5 sm:px-2 rounded-lg"
                                                        title={isPreviewMode ? "Write text" : "Preview markdown"}
                                                    >
                                                        {isPreviewMode ? <Pencil size={22} /> : <View size={22} />}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => document.getElementById('chat-file-upload')?.click()}
                                                        className="text-primary/80 hover:text-primary hover:scale-110 transition-all px-1.5 sm:px-2 rounded-lg"
                                                        title="Attach file"
                                                    >
                                                        <Paperclip size={22} className="cursor-pointer -rotate-45" />
                                                    </button>
                                                </div>

                                                {(messageDraft.trim() || stagedFiles.length > 0) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => { void handleSendMessage(); }}
                                                        disabled={(!messageDraft.trim() && stagedFiles.length === 0) || isSending || isUploading}
                                                        className="shrink-0 pb-3 sm:pb-4 px-1.5 sm:px-2 rounded-lg text-primary/80 hover:text-primary active:scale-95 transition-all"
                                                        title="Send"
                                                    >
                                                        <Send size={24} className="cursor-pointer" />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>
                            ) : (
                                <div className="absolute bottom-0 left-0 right-0 px-2 sm:px-3 py-2 sm:py-2.5 bg-amber-500/10 border-x-4 border-amber-500 rounded-lg flex items-center justify-center gap-2 animate-in slide-in-from-bottom duration-200">
                                    <LockIcon size={14} className="text-amber-600 shrink-0" />
                                    <p className="text-[11px] sm:text-[12px] md:text-[13px] font-semibold text-amber-600 text-center">
                                        Read-Only Mode - Only admins and moderators can send messages
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    /* Empty State */
                    <div className="flex-1 flex flex-col items-center justify-center chat-bg-pattern px-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-card rounded-2xl flex items-center justify-center shadow-sm border border-border mb-4 sm:mb-5">
                            <MessageSquarePlus size={36} className="text-primary/80" />
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-foreground mb-1">Your Messages</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground max-w-xs sm:max-w-sm text-center">Select a conversation or start a new one to begin chatting</p>
                    </div>
                )}
            </div>

            {/* Image Preview Modal */}
            {previewImageUrl && (
                <div
                    className="absolute w-full h-full z-50 flex items-center justify-center bg-accent/90 backdrop-blur-sm"
                    onClick={() => setPreviewImageUrl(null)}
                >
                    <div className="relative max-w-4xl max-h-screen p-3 sm:p-4 w-full h-full flex items-center justify-center">
                        <div className="relative w-full h-full max-h-[85vh] flex items-center justify-center">
                            <Image
                                src={previewImageUrl}
                                alt="Preview"
                                fill
                                className="object-contain rounded-lg shadow-2xl"
                                unoptimized
                            />
                        </div>
                        <button
                            title='Close'
                            type='button'
                            onClick={() => setPreviewImageUrl(null)}
                            className="absolute top-3 sm:top-4 right-3 sm:right-4 p-2 bg-accent/80 hover:bg-accent/70 rounded-full transition-colors shadow-lg"
                        >
                            <X size={24} className="text-primary/80 hover:text-primary" />
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
                    currentUser={user as User}
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
