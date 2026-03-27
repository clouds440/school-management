'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
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
    const [socket, setSocket] = useState<Socket | null>(null);
    const listenersRef = useRef<Map<string, Set<EventCallback>>>(new Map());
    const [isConnected, setIsConnected] = useState(false);

    // Connect on mount when enabled + token available
    useEffect(() => {
        if (!enabled || !token) return;

        // Derive base URL for WebSocket (same origin as API, but at root)
        const wsUrl = API_BASE_URL.replace(/\/api$/, '').replace(/\/$/, '');

        const newSocket = io(wsUrl, {
            auth: { token },
            transports: ['websocket', 'polling'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        });

        newSocket.on('connect', () => {
            console.log('[WS] Connected:', newSocket.id);
            setIsConnected(true);
            setSocket(newSocket);

            // Auto-join rooms for the user
            if (userId) newSocket.emit('joinRoom', { roomId: `user:${userId}` });
            if (userRole) newSocket.emit('joinRoom', { roomId: `role:${userRole}` });
            if (orgId) newSocket.emit('joinRoom', { roomId: `org:${orgId}` });
        });

        newSocket.on('disconnect', (reason: string) => {
            console.log('[WS] Disconnected:', reason);
            setIsConnected(false);
        });

        newSocket.on('connect_error', (err: Error) => {
            console.warn('[WS] Connection error:', err.message);
            setIsConnected(false);
        });

        // Re-register any existing listeners (for reconnection scenarios)
        listenersRef.current.forEach((callbacks, event) => {
            callbacks.forEach(cb => newSocket.on(event, cb));
        });

        return () => {
            newSocket.removeAllListeners();
            newSocket.disconnect();
            setSocket(null);
            setIsConnected(false);
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
        if (socket) {
            socket.on(event, callback);
        }

        return () => {
            listenersRef.current.get(event)?.delete(callback);
            socket?.off(event, callback);
        };
    }, [socket]);

    /**
     * Join a specific room (e.g., `request:{id}`)
     */
    const joinRoom = useCallback((room: string) => {
        socket?.emit('joinRoom', { roomId: room });
    }, [socket]);

    /**
     * Leave a specific room
     */
    const leaveRoom = useCallback((room: string) => {
        socket?.emit('leaveRoom', { roomId: room });
    }, [socket]);

    return {
        socket,
        subscribe,
        joinRoom,
        leaveRoom,
        isConnected,
    };
}
