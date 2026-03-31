'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Tag, Hash, User, MessageSquare, ArrowUpRight, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { RequestDetail, RequestStatus } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { RequestStatusBadge, RequestPriorityBadge } from '@/components/requests/RequestStatusBadge';
import { RequestThread, RequestThreadHandle } from '@/components/requests/RequestThread';
import { useAuth } from '@/context/AuthContext';
import { useGlobal } from '@/context/GlobalContext';
import { useSocket } from '@/hooks/useSocket';

interface RequestDetailsModalProps {
    requestId: string | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: () => void;
}

export function RequestDetailsModal({ requestId, isOpen, onClose, onUpdate }: RequestDetailsModalProps) {
    const { user, token } = useAuth();
    const { dispatch } = useGlobal();
    const [request, setRequest] = useState<RequestDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const threadRef = useRef<RequestThreadHandle>(null);

    const { subscribe, joinRoom, leaveRoom } = useSocket({
        token: token,
        userId: user?.id || undefined,
        userRole: user?.role || undefined,
        orgId: user?.orgId || undefined
    });

    const fetchRequestDetails = useCallback(async () => {
        if (!requestId || !token) return;
        try {
            setLoading(true);
            const detail = await api.requests.getRequest(requestId, token);
            setRequest(detail);
        } catch (error: unknown) {
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Failed to load request details', type: 'error' } });
        } finally {
            setLoading(false);
        }
    }, [requestId, token, dispatch]);

    useEffect(() => {
        if (isOpen && requestId) {
            fetchRequestDetails();
        } else {
            setRequest(null);
        }
    }, [isOpen, requestId, fetchRequestDetails]);

    useEffect(() => {
        if (!requestId || !isOpen) return;

        joinRoom(`request:${requestId}`);
        const unsubs = [
            subscribe('request:message', async (data: unknown) => {
                const payload = data as { requestId: string };
                if (payload.requestId === requestId && token) {
                    const updated = await api.requests.getRequest(requestId, token);
                    setRequest(updated);
                    onUpdate?.(); // Notify parent to refresh list (unread counts etc)
                }
            }),
            subscribe('request:update', (data: unknown) => {
                const updated = data as RequestDetail;
                if (updated.id === requestId) {
                    setRequest(updated);
                    onUpdate?.();
                }
            })
        ];

        return () => {
            unsubs.forEach(u => u());
            leaveRoom(`request:${requestId}`);
        };
    }, [requestId, isOpen, subscribe, joinRoom, leaveRoom, token, onUpdate]);

    const handleStatusUpdate = async (newStatus: RequestStatus) => {
        if (!request || !token || loading) return;
        try {
            dispatch({ type: 'UI_SET_PROCESSING', payload: true });
            await api.requests.updateRequest(request.id, { status: newStatus }, token);
            const updated = await api.requests.getRequest(request.id, token);
            setRequest(updated);
            onUpdate?.();
            dispatch({ type: 'TOAST_ADD', payload: { message: `Status updated to ${newStatus.replace('_', ' ')}`, type: 'success' } });
        } catch (error: unknown) {
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Failed to update status', type: 'error' } });
        } finally {
            dispatch({ type: 'UI_SET_PROCESSING', payload: false });
        }
    };

    const handleReply = async (content: string, files?: File[]) => {
        if (!request || !token) return;
        try {
            dispatch({ type: 'UI_SET_PROCESSING', payload: true });
            await api.requests.addMessage(request.id, { content }, token, files);
            const updated = await api.requests.getRequest(request.id, token);
            setRequest(updated);
            onUpdate?.();
        } catch (error: unknown) {
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Failed to send reply', type: 'error' } });
        } finally {
            dispatch({ type: 'UI_SET_PROCESSING', payload: false });
        }
    };

    const handleScrollToReply = () => {
        threadRef.current?.scrollToReply();
    };

    const isClosed = request?.status === RequestStatus.CLOSED || request?.status === RequestStatus.RESOLVED;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                request ? (
                    <div className="flex items-center w-full pr-12 text-sm sm:text-base md:text-xl">
                        <span className="text-xl font-black text-gray-900">{request.subject}</span>
                    </div>
                ) : undefined
            }
            subtitle={
                request ? (
                    <div className="block md:flex items-center justify-between w-full pr-12 text-sm sm:text-base md:text-xl">
                        <div className="flex items-center gap-3 flex-wrap text-[10px] text-indigo-500/60 font-bold uppercase tracking-widest">
                            <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{request.category.replace('_', ' ')}</span>
                            <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{request.id.slice(0, 8)}</span>
                            <span className="flex items-center gap-1"><User className="w-3 h-3" />{request.creator.name}</span>
                        </div>
                        <div className="block md:flex md:ml-5">
                            {!isClosed && (
                                <div className="flex items-center mt-3 md:mt-0 gap-2 md:ml-4">
                                    {request.status === RequestStatus.OPEN && (
                                        <Button
                                            onClick={() => handleStatusUpdate(RequestStatus.IN_PROGRESS)}
                                            icon={ArrowUpRight}
                                            variant="warning"
                                            px='px-3'
                                            py='py-1.5'
                                            className="text-[9px] uppercase"
                                        >
                                            Start Progress
                                        </Button>
                                    )}
                                    <Button
                                        onClick={() => handleStatusUpdate(RequestStatus.RESOLVED)}
                                        icon={CheckCircle2}
                                        variant="success"
                                        px='px-3'
                                        py='py-1.5'
                                        className="text-[9px] uppercase"
                                    >
                                        Resolve
                                    </Button>
                                    <Button
                                        onClick={() => handleStatusUpdate(RequestStatus.CLOSED)}
                                        icon={XCircle}
                                        variant="danger"
                                        px='px-3'
                                        py='py-1.5'
                                        className="text-[9px] uppercase"
                                    >
                                        Close Thread
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : undefined
            }
            maxWidth="max-w-5xl"
            footer={
                request ? (
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                            {!isClosed ? (
                                <Button
                                    onClick={handleScrollToReply}
                                    icon={MessageSquare}
                                    variant="primary"
                                    px='px-6'
                                    py='py-2.5'
                                    className="text-[10px] uppercase"
                                >
                                    Reply to Thread
                                </Button>
                            ) : (
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    Thread is {request.status}
                                </div>
                            )}
                        </div>

                        <Button
                            onClick={onClose}
                            variant='secondary'
                            px='px-6'
                            py='py-2.5'
                            className="text-[10px] uppercase"
                        >
                            Close Window
                        </Button>
                    </div>
                ) : undefined
            }
        >
            {request && (
                <div className="flex flex-col h-full overflow-hidden">
                    <div className="flex items-center gap-3 mb-6 shrink-0 flex-wrap">
                        <RequestStatusBadge status={request.status} />
                        <RequestPriorityBadge priority={request.priority} />
                    </div>

                    <div className="flex-1 overflow-hidden">
                        <RequestThread
                            ref={threadRef}
                            request={request}
                            currentUserId={user?.id || ''}
                            currentUserRole={user?.role}
                            onReply={handleReply}
                            isClosed={isClosed}
                        />
                    </div>
                </div>
            )}
        </Modal>
    );
}
