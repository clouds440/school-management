'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/hooks/useSocket';
import { api } from '@/lib/api';
import { getPublicUrl } from '@/lib/utils';
import { Chat, ChatMessage, Role } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export function ChatDropdown() {
    const { token, user } = useAuth();
    const { socket, subscribe } = useSocket({ token, userId: user?.id, enabled: !!token });
    
    const [isOpen, setIsOpen] = useState(false);
    const [chats, setChats] = useState<Chat[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    // Determine the base chat route depending on if the user belongs to an org or is a platform admin
    const chatBaseUrl = user?.orgSlug ? `/${user.orgSlug}/chat` : '/admin/chat';

    useEffect(() => {
        if (!token) return;
        const fetchChats = async () => {
            try {
                const data = await api.chat.getUserChats(token);
                setChats(data);
                // Basic unread simulation for dropdown logic
                const lastSeen = localStorage.getItem(`chat_heard_${user?.id}`);
                const count = data.filter(c => {
                    const msg = c.messages?.[0];
                    if (!msg) return false;
                    return msg.senderId !== user?.id && (!lastSeen || new Date(msg.createdAt).getTime() > parseInt(lastSeen, 10));
                }).length;
                
                setUnreadCount(count);
            } catch (err) {
                console.error('Failed to fetch chats', err);
            }
        };
        fetchChats();
    }, [token, user?.id]);

    useEffect(() => {
        if (!subscribe) return;

        const unsubMessage = subscribe('chat:message', (newMsg: unknown) => {
            const message = newMsg as ChatMessage & { chat?: { id: string, name: string, type: string } };
            
            // Update unread count if sender is not current user
            if (message.senderId !== user?.id) {
                setUnreadCount(prev => prev + 1);
            }

            // Update chats state to show last message and move chat to top
            setChats(prevChats => {
                const chatIndex = prevChats.findIndex(c => c.id === message.chatId);
                if (chatIndex === -1) {
                    // If chat not in list, we might need to fetch it or just ignore for now
                    // For safety, let's trigger a re-fetch if a completely new chat message arrives
                    if (token) api.chat.getUserChats(token).then(setChats).catch(console.error);
                    return prevChats;
                }

                const updatedChats = [...prevChats];
                const targetChat = { ...updatedChats[chatIndex] };
                targetChat.messages = [message, ...(targetChat.messages || []).slice(0, 1)];
                targetChat.updatedAt = message.createdAt;
                
                updatedChats.splice(chatIndex, 1);
                updatedChats.unshift(targetChat);
                
                return updatedChats;
            });
        });

        const unsubDelete = subscribe('chat:message:delete', (deletedMsg: unknown) => {
            const message = deletedMsg as ChatMessage;
            setChats(prevChats => {
                return prevChats.map(c => {
                    if (c.id === message.chatId && c.messages?.[0]?.id === message.id) {
                        const updatedChat = { ...c };
                        updatedChat.messages = [message];
                        return updatedChat;
                    }
                    return c;
                });
            });
        });

        return () => {
            unsubMessage();
            unsubDelete();
        };
    }, [subscribe, user?.id, token]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen && unreadCount > 0) {
            setUnreadCount(0);
            if (chats.length > 0) {
                localStorage.setItem(`chat_heard_${user?.id}`, new Date().getTime().toString());
            }
        }
    };

    if (!token || !user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleOpen}
                title="Chats"
                className="relative p-2 text-gray-600 hover:text-primary hover:bg-primary/5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
                aria-label="Messages"
            >
                <MessageSquare className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-[22px] h-[22px] text-[12px] font-bold text-white bg-green-500 rounded-full border-2 border-white shadow-sm animate-in zoom-in">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-100/80 overflow-hidden transform origin-top-right animate-in fade-in slide-in-from-top-2 z-50">
                    <div className="flex items-center justify-between px-4 py-3 bg-green-50/80 border-b border-green-100/50 backdrop-blur-sm">
                        <h3 className="font-semibold text-green-900">Recent Messages</h3>
                        <Link 
                            href={chatBaseUrl}
                            onClick={() => setIsOpen(false)}
                            className="text-xs font-medium text-green-700 hover:text-green-900 transition-colors"
                        >
                            Open Chat &rarr;
                        </Link>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {isLoading ? (
                            <div className="flex justify-center items-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-green-500 opacity-50" />
                            </div>
                        ) : chats.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                                {chats.slice(0, 5).map((chat) => {
                                    const otherParticipant = chat.participants?.find(p => p.userId !== user.id)?.user;
                                    const displayName = chat.type === 'GROUP' ? chat.name : (otherParticipant?.name || 'Unknown User');
                                    const lastMessage = chat.messages?.[0];

                                    return (
                                        <Link
                                            href={`${chatBaseUrl}?id=${chat.id}`}
                                            key={chat.id}
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-start p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                                        >
                                            <div className="relative mr-3">
                                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold overflow-hidden shadow-sm border border-gray-100">
                                                    {otherParticipant?.avatarUrl ? (
                                                        <img src={getPublicUrl(otherParticipant.avatarUrl)} alt="" className="w-full h-full object-cover" />
                                                    ) : (otherParticipant?.role === Role.ORG_ADMIN || otherParticipant?.role === Role.ORG_MANAGER) && user.orgLogoUrl ? (
                                                        <img src={getPublicUrl(user.orgLogoUrl)} alt="" className="w-full h-full object-cover opacity-80" />
                                                    ) : (
                                                        chat.type === 'GROUP' ? 'G' : displayName?.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline mb-0.5">
                                                    <p className="text-sm font-semibold text-gray-900 truncate pr-2">
                                                        {displayName}
                                                    </p>
                                                    {lastMessage && (
                                                        <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                                                            {formatDistanceToNow(new Date(lastMessage.createdAt))}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 truncate mt-0.5">
                                                    {lastMessage ? (
                                                        <span className={lastMessage.senderId !== user.id && lastMessage.createdAt > (localStorage.getItem(`chat_heard_${user.id}`) || '') ? 'font-medium text-gray-800' : ''}>
                                                            {lastMessage.senderId === user.id ? 'You: ' : (chat.type === 'GROUP' ? `${lastMessage.sender?.name || 'Unknown'}: ` : '')}
                                                            {lastMessage.content}
                                                        </span>
                                                    ) : (
                                                        <span className="italic text-gray-400">No messages yet</span>
                                                    )}
                                                </p>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                <MessageSquare className="w-10 h-10 text-gray-200 mb-3" />
                                <p className="text-sm font-medium text-gray-500">No recent chats</p>
                                <p className="text-xs text-gray-400 mt-1">Start a conversation!</p>
                            </div>
                        )}
                        
                        {chats.length > 5 && (
                            <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                                <Link
                                    href={chatBaseUrl}
                                    onClick={() => setIsOpen(false)}
                                    className="text-xs font-semibold text-primary hover:underline"
                                >
                                    View all messages
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
