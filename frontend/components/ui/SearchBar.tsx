import React from 'react';

interface SearchBarProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search...' }: SearchBarProps) {
    return (
        <div className="relative w-full sm:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
            </div>
            <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-sm leading-5 bg-gray-50/50 placeholder-gray-400 text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors shadow-sm"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}
