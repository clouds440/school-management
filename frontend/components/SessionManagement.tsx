'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useGlobal } from '@/context/GlobalContext';
import { api } from '@/lib/api';
import { Monitor, Smartphone, Laptop, Globe, Shield, Trash2, LogOut, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface Session {
    id: string;
    userId: string;
    deviceId: string;
    deviceName: string;
    os: string;
    token: string;
    lastSeenAt: string;
    expiresAt: string;
    createdAt: string;
}

interface SessionManagementProps {
    userId?: string;
    orgId?: string;
}

export default function SessionManagement({ userId, orgId }: SessionManagementProps) {
    const { token, user } = useAuth();
    const { dispatch } = useGlobal();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(false);
    const [revoking, setRevoking] = useState<string | null>(null);
    const [revokingAll, setRevokingAll] = useState(false);
    const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false);

    const targetUserId = userId || user?.id;

    const fetchSessions = async () => {
        if (!token || !targetUserId) return;
        setLoading(true);
        try {
            const data = await api.auth.getSessions(token);
            setSessions(data);
        } catch (error) {
            console.error('Failed to fetch sessions', error);
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Failed to load sessions', type: 'error' } });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, [token, targetUserId]);

    const handleRevokeSession = async (sessionId: string) => {
        if (!token) return;
        setRevoking(sessionId);
        try {
            const result = await api.auth.revokeSession(sessionId, token);
            if (result && (result as any).shouldLogout) {
                dispatch({ type: 'TOAST_ADD', payload: { message: 'Logging out...', type: 'success' } });
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return;
            }
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Session revoked successfully', type: 'success' } });
            await fetchSessions();
        } catch (error) {
            console.error('Failed to revoke session', error);
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Failed to revoke session', type: 'error' } });
        } finally {
            setRevoking(null);
        }
    };

    const handleRevokeAll = async () => {
        if (!token) return;
        setShowRevokeAllDialog(true);
    };

    const handleConfirmRevokeAll = async () => {
        if (!token) return;
        setRevokingAll(true);
        try {
            await api.auth.revokeAllSessions(token);
            dispatch({ type: 'TOAST_ADD', payload: { message: 'All sessions revoked successfully', type: 'success' } });
            await fetchSessions();
        } catch (error) {
            console.error('Failed to revoke all sessions', error);
            dispatch({ type: 'TOAST_ADD', payload: { message: 'Failed to revoke all sessions', type: 'error' } });
        } finally {
            setRevokingAll(false);
            setShowRevokeAllDialog(false);
        }
    };

    const getDeviceIcon = (os: string) => {
        const osLower = os.toLowerCase();
        if (osLower.includes('android') || osLower.includes('ios')) {
            return <Smartphone className="w-5 h-5" />;
        }
        if (osLower.includes('windows') || osLower.includes('mac') || osLower.includes('linux')) {
            return <Laptop className="w-5 h-5" />;
        }
        return <Monitor className="w-5 h-5" />;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
    };

    const isCurrentSession = (session: Session) => {
        // Compare the session token with the current token
        return session.token === token;
    };

    return (
        <div className="bg-card/80 backdrop-blur-xl rounded-sm shadow-2xl border border-border p-6 md:p-8 text-card-foreground">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-sm border border-primary/20">
                        <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-card-foreground">Active Sessions</h2>
                        <p className="text-sm text-muted-foreground font-medium mt-1">
                            Manage your active devices and login sessions
                        </p>
                    </div>
                </div>
                <Button
                    onClick={fetchSessions}
                    variant="secondary"
                    icon={RefreshCw}
                    disabled={loading}
                    className="shrink-0"
                >
                    Refresh
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : sessions.length === 0 ? (
                <div className="text-center py-12">
                    <Globe className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">No active sessions found</p>
                </div>
            ) : (
                <>
                    <div className="space-y-3 mb-6">
                        {sessions.map((session) => (
                            <div
                                key={session.id}
                                className={`flex items-center justify-between p-4 rounded-sm border transition-all ${
                                    isCurrentSession(session)
                                        ? 'bg-primary/5 border-primary/30'
                                        : 'bg-secondary/30 border-border hover:border-border/80'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-sm ${
                                        isCurrentSession(session)
                                            ? 'bg-primary/20 text-primary'
                                            : 'bg-secondary/50 text-muted-foreground'
                                    }`}>
                                        {getDeviceIcon(session.os)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-card-foreground">{session.deviceName || 'Unknown Device'}</p>
                                            {isCurrentSession(session) && (
                                                <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-sm">
                                                    Current
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                            <span>{session.os}</span>
                                            <span>•</span>
                                            <span>Last active: {formatDate(session.lastSeenAt)}</span>
                                        </div>
                                    </div>
                                </div>
                                {!isCurrentSession(session) && (
                                    <Button
                                        onClick={() => handleRevokeSession(session.id)}
                                        variant="danger"
                                        icon={Trash2}
                                        disabled={revoking === session.id}
                                        className="shrink-0"
                                    >
                                        {revoking === session.id ? 'Revoking...' : 'Revoke'}
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="pt-6 border-t border-border/50 flex justify-end">
                        <Button
                            onClick={handleRevokeAll}
                            variant="danger"
                            icon={LogOut}
                            disabled={revokingAll || sessions.filter(s => !isCurrentSession(s)).length === 0}
                            className="shrink-0"
                        >
                            {revokingAll ? 'Revoking...' : 'Revoke All Other Sessions'}
                        </Button>
                    </div>
                </>
            )}

            <ConfirmDialog
                isOpen={showRevokeAllDialog}
                onClose={() => setShowRevokeAllDialog(false)}
                onConfirm={handleConfirmRevokeAll}
                title="Revoke All Sessions"
                description="Are you sure you want to revoke all sessions? This will sign you out from all devices except this one."
                confirmText="Revoke All"
                isDestructive={true}
            />
        </div>
    );
}
