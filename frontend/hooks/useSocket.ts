'use client';

import { useEffect, useCallback, useState } from 'react';
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
// Use a singleton socket so multiple components don't open duplicate connections
let socketSingleton: Socket | null = null;
const listenersSingleton: Map<string, Set<EventCallback>> = new Map();
let connected = false;

export function useSocket(options: UseSocketOptions) {
    const { token, userId, userRole, orgId, enabled = true } = options;
    const [isConnected, setIsConnected] = useState(connected);

    useEffect(() => {
        if (!enabled || !token) return;

        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || API_BASE_URL.replace(/\/api$/, '').replace(/\/$/, '');
        if (!socketUrl.startsWith('http')) {
            console.warn('[WS] Invalid socket URL:', socketUrl);
            return;
        }

        if (!socketSingleton) {
            socketSingleton = io(socketUrl, {
                auth: { token },
                transports: ['websocket', 'polling'],
                autoConnect: true,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 2000,
            });

            socketSingleton.on('connect', () => {
                connected = true;
                setIsConnected(true);
            });
            socketSingleton.on('disconnect', () => {
                connected = false;
                setIsConnected(false);
            });
            socketSingleton.on('connect_error', () => {
                connected = false;
                setIsConnected(false);
            });
        } else {
            // If socket exists but token changed, update auth by reconnecting
            // (socket.io doesn't support changing auth token on the fly reliably)
            if (socketSingleton && socketSingleton.io && socketSingleton.auth?.token !== token) {
                try {
                    socketSingleton.auth = { token };
                } catch {
                    // Ignore auth update failures and keep the existing socket alive.
                }
            }
        }

        // Attach any existing listeners to the socket singleton
        listenersSingleton.forEach((callbacks, event) => {
            callbacks.forEach(cb => socketSingleton?.on(event, cb));
        });

        // Auto-join rooms for this caller
        if (socketSingleton) {
            if (userId) socketSingleton.emit('joinRoom', { roomId: `user:${userId}` });
            if (userRole) socketSingleton.emit('joinRoom', { roomId: `role:${userRole}` });
            if (orgId) socketSingleton.emit('joinRoom', { roomId: `org:${orgId}` });
        }

        return () => {
            // Do not disconnect singleton here; keep it alive for other consumers.
        };
    }, [token, userId, userRole, orgId, enabled]);

    const subscribe = useCallback((event: string, callback: EventCallback) => {
        if (!listenersSingleton.has(event)) listenersSingleton.set(event, new Set());
        listenersSingleton.get(event)!.add(callback);
        socketSingleton?.on(event, callback);

        return () => {
            listenersSingleton.get(event)?.delete(callback);
            socketSingleton?.off(event, callback);
        };
    }, []);

    const joinRoom = useCallback((room: string) => {
        socketSingleton?.emit('joinRoom', { roomId: room });
    }, []);

    const leaveRoom = useCallback((room: string) => {
        socketSingleton?.emit('leaveRoom', { roomId: room });
    }, []);

    return { socket: socketSingleton, subscribe, joinRoom, leaveRoom, isConnected };
}
