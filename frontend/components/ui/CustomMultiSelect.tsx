'use client';

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { LucideIcon, ChevronDown, X, Check } from "lucide-react";

export interface MultiSelectOption {
    value: string;
    label: string;
    icon?: LucideIcon;
}

export interface CustomMultiSelectProps {
    options: MultiSelectOption[];
    values: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
    icon?: LucideIcon;
    className?: string;
    disabled?: boolean;
    error?: boolean;
}

export function CustomMultiSelect({
    options,
    values,
    onChange,
    placeholder = "Select options...",
    icon: Icon,
    className = "",
    disabled = false,
    error = false
}: CustomMultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Derived state for selected options
    const selectedOptions = options.filter(opt => values.includes(opt.value));

    // Filtered options based on search term
    const filteredOptions = React.useMemo(() => {
        return options.filter(opt => 
            opt.label.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm]);

    useEffect(() => {
        if (!isOpen) setSearchTerm("");
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleOption = (val: string) => {
        if (values.includes(val)) {
            onChange(values.filter(v => v !== val));
        } else {
            onChange([...values, val]);
        }
    };

    const removeOption = (val: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(values.filter(v => v !== val));
    };

    return (
        <div className={`relative group ${className}`} ref={containerRef}>
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`
                    flex flex-wrap items-center w-full min-h-[52px] px-4 py-2 rounded-sm border transition-all duration-200 outline-none
                    ${isOpen 
                        ? 'border-primary ring-4 ring-primary/10 bg-card' 
                        : 'border-white/10 bg-primary/5 hover:border-white/20'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    text-card-text font-bold
                `}
            >
                {Icon && (
                    <Icon className={`h-5 w-5 mr-3 shrink-0 transition-colors ${isOpen ? 'text-primary' : 'text-card-text/40'}`} />
                )}
                
                <div className="flex flex-wrap gap-2 flex-1 items-center overflow-hidden">
                    {selectedOptions.length > 0 ? (
                        selectedOptions.map(opt => (
                            <span 
                                key={opt.value}
                                className="inline-flex items-center bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-sm text-xs font-black animate-in zoom-in-95 duration-100"
                            >
                                {opt.label}
                                <button
                                    type="button"
                                    onClick={(e) => removeOption(opt.value, e)}
                                    className="ml-1.5 hover:text-primary-hover p-0.5 rounded-full transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        ))
                    ) : (
                        <span className="text-card-text/40">{placeholder}</span>
                    )}
                </div>

                <div className="flex items-center shrink-0 ml-2">
                    {values.length > 0 && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onChange([]); }}
                            className="mr-2 text-card-text/30 hover:text-red-500 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 text-card-text/40 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 py-2 bg-card border border-white/10 rounded-sm shadow-2xl max-h-80 flex flex-col animate-in fade-in zoom-in duration-100">
                    <div className="px-3 pb-2 border-b border-white/5">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-card-text/40" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-9 pr-3 py-2 border border-white/10 rounded-sm text-xs bg-primary/5 text-card-text placeholder-card-text/40 focus:outline-none focus:ring-1 focus:ring-primary/30"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                            />
                        </div>
                    </div>
                    
                    <div className="overflow-y-auto flex-1">
                        {filteredOptions.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-card-text/40 italic text-center">No options found</div>
                        ) : (
                            filteredOptions.map((option) => {
                                const isSelected = values.includes(option.value);
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => toggleOption(option.value)}
                                        className={`
                                            flex items-center justify-between w-full px-4 py-3 text-sm font-bold transition-all
                                            ${isSelected 
                                                ? 'bg-primary/5 text-primary' 
                                                : 'text-card-text hover:bg-primary/5'
                                            }
                                            text-left
                                        `}
                                    >
                                        <div className="flex items-center truncate">
                                            {option.icon && <option.icon className="h-4 w-4 mr-2" />}
                                            {option.label}
                                        </div>
                                        {isSelected && <Check className="h-4 w-4 text-primary shrink-0 ml-2" />}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
