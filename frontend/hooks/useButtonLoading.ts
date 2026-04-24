import { useCallback } from 'react';
import { useGlobal } from '@/context/GlobalContext';

/**
 * Hook to manage button loading state with unique IDs
 * Ensures only one button shows loading spinner at a time
 * Disables all buttons when any button is loading
 */
export function useButtonLoading() {
    const { dispatch } = useGlobal();

    const startLoading = useCallback((id: string) => {
        dispatch({ 
            type: 'UI_SET_PROCESSING', 
            payload: { isProcessing: true, id } 
        });
    }, [dispatch]);

    const stopLoading = useCallback(() => {
        dispatch({ 
            type: 'UI_SET_PROCESSING', 
            payload: false 
        });
    }, [dispatch]);

    const withLoading = useCallback(async <T>(
        id: string,
        fn: () => Promise<T>
    ): Promise<T> => {
        startLoading(id);
        try {
            return await fn();
        } finally {
            stopLoading();
        }
    }, [startLoading, stopLoading]);

    return { startLoading, stopLoading, withLoading };
}
