
import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { usePathname } from 'next/navigation';

interface SearchBarProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    delay?: number;
}

export function SearchBar({ value, onChange, placeholder = 'Search...', delay = 500 }: SearchBarProps) {
    const [localValue, setLocalValue] = useState(value);
    const debouncedValue = useDebounce(localValue, delay);
    const lastValueRef = useRef(value);
    const pathname = usePathname();

    // Sync from parent prop (external change like route param update)
    useEffect(() => {
        if (value !== lastValueRef.current) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setLocalValue(value);
            lastValueRef.current = value;
        }
    }, [value]);

    // Clear search on route change (unconditional, as per user request)
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLocalValue('');
        lastValueRef.current = '';
        // Note: we don't call onChange('') here to avoid unnecessary router.push 
        // if the route change already cleared the params.
    }, [pathname]);

    // Trigger parent onChange only when debounced value changes 
    // AND it's different from what we last saw from the parent
    useEffect(() => {
        if (debouncedValue !== lastValueRef.current) {
            lastValueRef.current = debouncedValue;
            onChange(debouncedValue);
        }
    }, [debouncedValue, onChange]);

    return (
        <div className="relative w-full sm:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-500 z-50" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
            </div>
            <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-200/50 rounded-sm leading-5 bg-white/30 backdrop-blur-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:bg-white/50 focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-all shadow-sm"
                placeholder={placeholder}
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
            />
        </div>
    );
}
