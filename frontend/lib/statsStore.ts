import { api } from './api';
import { AdminStats } from '@/types';

type ChatStats = { unread: number };

const listeners = new Set<() => void>();

const store: {
    admin: AdminStats | null;
    chat: ChatStats | null;
} = {
    admin: null,
    chat: null
};

function notify() {
    listeners.forEach(l => l());
}

export const statsStore = {
    async fetchAll(token?: string) {
        if (!token) return { admin: null, chat: null };
        try {
            const [adminRes, chatRes] = await Promise.all([
                api.admin.getAdminStats(token),
                api.chat.getUnreadCount(token)
            ]);
            store.admin = adminRes;
            store.chat = chatRes;
            notify();
            return { admin: store.admin, chat: store.chat };
        } catch (err) {
            console.error('statsStore.fetchAll error', err);
            throw err;
        }
    },

    getAdmin() {
        return store.admin;
    },

    getChat() {
        return store.chat;
    },

    subscribe(fn: () => void) {
        listeners.add(fn);
        return () => listeners.delete(fn);
    },

    invalidate() {
        store.admin = null;
        store.chat = null;
        notify();
    },

    // Apply lightweight deltas when socket events arrive. Keep conservative updates.
    applyChatMessageDelta(count = 1) {
        try {
            if (!store.chat) store.chat = { unread: 0 };
            const cur = store.chat.unread || 0;
            store.chat.unread = cur + count;
            notify();
        } catch (e) {
            console.error('applyChatMessageDelta', e);
        }
    },

    applyChatReadDelta(count = 1) {
        try {
            if (!store.chat) return;
            const cur = store.chat.unread || 0;
            store.chat.unread = Math.max(0, cur - count);
            notify();
        } catch (e) {
            console.error('applyChatReadDelta', e);
        }
    },

    applyAdminUnreadMailDelta(delta = 1) {
        try {
            if (!store.admin) return;
            const cur = store.admin.UNREAD_MAIL || 0;
            store.admin.UNREAD_MAIL = Math.max(0, cur + delta);
            notify();
        } catch (e) {
            console.error('applyAdminUnreadMailDelta', e);
        }
    }
};

export default statsStore;
