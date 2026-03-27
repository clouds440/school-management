import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    delay?: number;
    className?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search...', delay = 500, className }: SearchBarProps) {
    const [localValue, setLocalValue] = useState(value);
    const debouncedValue = useDebounce(localValue, delay);
    const pathname = usePathname();
    const [prevValue, setPrevValue] = useState(value);
    const [prevPathname, setPrevPathname] = useState(pathname);
    const [prevDebouncedValue, setPrevDebouncedValue] = useState(debouncedValue);

    // Sync from parent prop or route change in render (React Compiler preferred pattern)
    if (value !== prevValue || pathname !== prevPathname) {
        setPrevValue(value);
        setPrevPathname(pathname);
        const newValue = pathname !== prevPathname ? '' : value;
        setLocalValue(newValue);
    }

    // Trigger parent onChange only when debounced value changes. This is to prevent the parent component from re-rendering unnecessarily.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (debouncedValue !== prevDebouncedValue) {
            setPrevDebouncedValue(debouncedValue);
            onChange(debouncedValue);
        }
    }, [debouncedValue, prevDebouncedValue, onChange]);

    return (
        <div className={cn("relative group w-full max-w-sm", className)}>
            <input
                type="text"
                className="block w-full pl-11 pr-4 h-12 bg-white/50 backdrop-blur-md border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white transition-all duration-300 shadow-sm"
                placeholder={placeholder}
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                <Search className="h-4 w-4 text-slate-500 group-focus-within:text-slate-700 transition-colors" />
            </div>
        </div>
    );
}
