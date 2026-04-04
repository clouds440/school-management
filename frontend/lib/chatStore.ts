import { api } from './api';
import { Chat, ChatMessage } from '@/types';

type ChatCache = {
    data: Chat[] | null;
    promise: Promise<Chat[]> | null;
    lastFetched: number | null;
    isFetching: boolean;
};

const CHAT_CACHE_TTL_MS = 3 * 1000; // 3 seconds - keep UI responsive to new messages

const cache: { chats: ChatCache; lastReadByChat: Record<string, string | number> } = {
    chats: { data: null, promise: null, lastFetched: null, isFetching: false },
    lastReadByChat: {}
};

export async function getUserChatsCached(token: string): Promise<Chat[]> {
    if (!token) return [];
    // Return cached if available and fresh
    if (cache.chats.data && cache.chats.lastFetched) {
        const age = Date.now() - cache.chats.lastFetched;
        if (age < CHAT_CACHE_TTL_MS) return cache.chats.data;
    }

    // If a fetch is already in-flight, return its promise
    if (cache.chats.promise) return cache.chats.promise;

    cache.chats.isFetching = true;
    const p = (async () => {
        try {
            const res = await api.chat.getUserChats(token);
            cache.chats.data = res;
            cache.chats.lastFetched = Date.now();
            return res;
        } finally {
            cache.chats.isFetching = false;
            cache.chats.promise = null;
        }
    })();

    cache.chats.promise = p;
    return p;
}

export function invalidateChats() {
    cache.chats.data = null;
    cache.chats.lastFetched = null;
}

export function insertOrUpdateChatFromMessage(message: ChatMessage) {
    if (!cache.chats.data) {
        // create a minimal placeholder list
        cache.chats.data = [{ id: message.chatId, messages: [message], unreadCount: 1, updatedAt: message.createdAt } as Chat];
        return cache.chats.data;
    }

    const idx = cache.chats.data.findIndex((c: Chat) => c.id === message.chatId);
    if (idx > -1) {
        const updated: Chat = { ...cache.chats.data[idx] } as Chat;
        updated.messages = [message];
        updated.updatedAt = message.createdAt;
        updated.unreadCount = (updated.unreadCount || 0) + 1;
        const arr = [...cache.chats.data];
        arr.splice(idx, 1);
        arr.unshift(updated);
        cache.chats.data = arr;
        return arr;
    }

    const newChat: Chat = { id: message.chatId, messages: [message], unreadCount: 1, updatedAt: message.createdAt } as Chat;
    cache.chats.data = [newChat, ...cache.chats.data];
    return cache.chats.data;
}

export function getCachedChats() {
    return cache.chats.data;
}

export function getLastReadMessageId(chatId: string) {
    return cache.lastReadByChat[chatId];
}

export function setLastReadMessageId(chatId: string, messageId: string | number) {
    cache.lastReadByChat[chatId] = messageId;
}

export async function markAsReadGuard(chatId: string, messageId: string | number | '', token: string) {
    if (!token) return;
    // If messageId is empty, we treat it as "mark latest"; skip if we already recorded the latest
    const last = cache.lastReadByChat[chatId];
    if (messageId && last !== undefined) {
        try {
            const numLast = typeof last === 'number' ? last : Number(last);
            const numMsg = typeof messageId === 'number' ? messageId : Number(messageId);
            if (!Number.isNaN(numLast) && !Number.isNaN(numMsg) && numMsg <= numLast) return;
        } catch (e) { }
        if (String(last) === String(messageId)) return;
    }

    try {
        await api.chat.markAsRead(chatId, messageId === '' ? '' : String(messageId), token);
        cache.lastReadByChat[chatId] = messageId || '';
    } catch (err) {
        // don't throw — just log; callers already handle UI
        console.error('markAsReadGuard failed', err);
    }
}
