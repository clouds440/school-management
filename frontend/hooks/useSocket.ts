'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '@/lib/api';

interface UseSocketOptions {
    /** JWT token for authentication */
    token: string | null;
    /** User info for auto-joining rooms */
    userId?: string;
    userRole?: string;
    orgId?: string;
    /** Whether to connect */
    enabled?: boolean;
}

type EventCallback = (...args: unknown[]) => void;

/**
 * Custom hook for WebSocket connectivity via Socket.IO.
 * Auto-connects with JWT auth, auto-joins user/role/org rooms, and exposes
 * subscribe/unsubscribe + joinRoom/leaveRoom helpers.
 */
export function useSocket(options: UseSocketOptions) {
    const { token, userId, userRole, orgId, enabled = true } = options;
    const socketRef = useRef<Socket | null>(null);
    const listenersRef = useRef<Map<string, Set<EventCallback>>>(new Map());

    // Connect on mount when enabled + token available
    useEffect(() => {
        if (!enabled || !token) return;

        // Derive base URL for WebSocket (same origin as API, but at root)
        const wsUrl = API_BASE_URL.replace(/\/api$/, '').replace(/\/$/, '');

        const socket = io(wsUrl, {
            auth: { token },
            transports: ['websocket', 'polling'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('[WS] Connected:', socket.id);

            // Auto-join rooms for the user
            // Gateway @MessageBody() expects { roomId: string }
            if (userId) socket.emit('joinRoom', { roomId: `user:${userId}` });
            if (userRole) socket.emit('joinRoom', { roomId: `role:${userRole}` });
            if (orgId) socket.emit('joinRoom', { roomId: `org:${orgId}` });
        });

        socket.on('disconnect', (reason) => {
            console.log('[WS] Disconnected:', reason);
        });

        socket.on('connect_error', (err) => {
            console.warn('[WS] Connection error:', err.message);
        });

        // Re-register any existing listeners (for reconnection scenarios)
        listenersRef.current.forEach((callbacks, event) => {
            callbacks.forEach(cb => socket.on(event, cb));
        });

        return () => {
            socket.removeAllListeners();
            socket.disconnect();
            socketRef.current = null;
        };
    }, [token, userId, userRole, orgId, enabled]);

    /**
     * Subscribe to a socket event. Returns an unsubscribe function.
     */
    const subscribe = useCallback((event: string, callback: EventCallback) => {
        // Track in ref
        if (!listenersRef.current.has(event)) {
            listenersRef.current.set(event, new Set());
        }
        listenersRef.current.get(event)!.add(callback);

        // If socket is already connected, attach immediately
        if (socketRef.current) {
            socketRef.current.on(event, callback);
        }

        return () => {
            listenersRef.current.get(event)?.delete(callback);
            socketRef.current?.off(event, callback);
        };
    }, []);

    /**
     * Join a specific room (e.g., `request:{id}`)
     */
    const joinRoom = useCallback((room: string) => {
        socketRef.current?.emit('joinRoom', { roomId: room });
    }, []);

    /**
     * Leave a specific room
     */
    const leaveRoom = useCallback((room: string) => {
        socketRef.current?.emit('leaveRoom', { roomId: room });
    }, []);

    return {
        socket: socketRef.current,
        subscribe,
        joinRoom,
        leaveRoom,
        isConnected: socketRef.current?.connected ?? false,
    };
}
