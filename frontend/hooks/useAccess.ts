import { useAuth } from '@/context/AuthContext';

export function useAccess() {
    const { user } = useAuth();
    
    // accessLevel: 0 (NONE), 1 (READ), 2 (WRITE)
    const accessLevel = user?.accessLevel ?? 2;
    const isUserSuspended = user?.userStatus === 'SUSPENDED';
    
    return {
        accessLevel,
        canRead: accessLevel >= 1,
        canWrite: accessLevel >= 2,
        isBlocked: accessLevel === 0,
        userStatus: user?.userStatus,
    };
}
