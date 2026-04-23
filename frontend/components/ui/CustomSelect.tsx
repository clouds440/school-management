'use client';

import { useState, useRef, useEffect, useMemo, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { LucideIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DropdownOption<T extends string = string> {
    value: T;
    label: string;
    icon?: LucideIcon;
    iconClassName?: string;
    badge?: number | string;
}

export interface CustomSelectProps<T extends string = string> {
    options: DropdownOption<T>[];
    value: T;
    onChange: (value: T) => void;
    placeholder?: string;
    icon?: LucideIcon;
    className?: string;
    disabled?: boolean;
    required?: boolean;
    error?: boolean;
    searchable?: boolean;
}

export function CustomSelect<T extends string = string>({
    options,
    value,
    onChange,
    placeholder = "Select an option",
    icon: Icon,
    className = "",
    disabled = false,
    required = false,
    error = false,
    searchable = false
}: CustomSelectProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

    if (isOpen !== prevIsOpen) {
        setPrevIsOpen(isOpen);
        if (!isOpen) setSearchTerm("");
    }

    const updateCoords = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            // We want to position it relative to the viewport because we portal to body
            setCoords({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    useLayoutEffect(() => {
        if (isOpen) {
            updateCoords();
            // Listen to scroll and resize to keep anchored
            window.addEventListener('scroll', updateCoords, true);
            window.addEventListener('resize', updateCoords);
        }
        return () => {
            window.removeEventListener('scroll', updateCoords, true);
            window.removeEventListener('resize', updateCoords);
        };
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current && !containerRef.current.contains(event.target as Node) &&
                dropdownRef.current && !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = useMemo(() => {
        if (!searchable) return options;
        return options.filter(opt =>
            opt.label.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm, searchable]);

    const handleSelect = (val: T) => {
        onChange(val);
        setIsOpen(false);
    };

    return (
        <div className={`relative group ${className}`} ref={containerRef}>
            <select
                required={required}
                value={value}
                onChange={(e) => onChange(e.target.value as T)}
                className="sr-only"
                aria-hidden="true"
                tabIndex={-1}
            >
                <option value="">{placeholder}</option>
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>

            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={cn(
                    "flex items-center w-full px-3 sm:px-4 py-2.5 rounded-xl border transition-all duration-200 outline-none",
                    isOpen
                        ? 'border-primary ring-4 ring-primary/10 bg-background'
                        : error
                            ? 'border-destructive ring-2 ring-destructive/20 bg-destructive/5'
                            : 'border-border/50 bg-primary/5 hover:border-primary/50',
                    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                    "text-foreground font-semibold text-left text-sm sm:text-base",
                    className
                )}
            >
                {/* Prefix Icon (Prop) or Selected Option Icon */}
                {(selectedOption?.icon || Icon) && (
                    <div className="mr-2 sm:mr-3 shrink-0">
                        {selectedOption?.icon ? (
                            <selectedOption.icon className={cn("h-4 w-4 sm:h-5 sm:w-5", selectedOption.iconClassName || (isOpen ? 'text-primary' : 'text-muted-foreground'))} />
                        ) : (
                            Icon && <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5 transition-colors", isOpen ? 'text-primary' : error ? 'text-destructive' : 'text-muted-foreground group-focus-within:text-primary')} />
                        )}
                    </div>
                )}

                <span className={`flex-1 truncate ${!selectedOption ? 'text-muted-foreground' : ''}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>

                {/* Selected Option Badge (Visible when closed too) */}
                {selectedOption?.badge !== undefined && (
                    <span className="mx-1.5 sm:mx-2 px-1.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-primary/10 text-primary shrink-0">
                        {selectedOption.badge}
                    </span>
                )}

                <ChevronDown className={cn("h-4 w-4 sm:h-4 sm:w-4 ml-2 sm:ml-2.5 transition-transform duration-200 text-muted-foreground", isOpen && "rotate-180")} />
            </button>

            {isOpen && coords && createPortal(
                <div
                    ref={dropdownRef}
                    style={{
                        position: 'absolute',
                        top: coords.top + 8,
                        left: coords.left,
                        width: coords.width,
                        zIndex: 9999
                    }}
                    className="py-2 bg-linear-to-br from-background to-background/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl max-h-80 sm:max-h-96 flex flex-col animate-in fade-in zoom-in duration-100"
                >
                    {searchable && (
                        <div className="px-3 sm:px-4 pb-2 sm:pb-3 border-b border-border/50">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 border border-border/50 rounded-lg text-xs sm:text-sm bg-primary/5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}

                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        {filteredOptions.length === 0 ? (
                            <div className="px-4 py-3 sm:py-4 text-sm sm:text-base text-muted-foreground text-center text-balance">{searchable ? `No results found for "${searchTerm}"` : 'No options available'}</div>
                        ) : (
                            filteredOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSelect(option.value)}
                                    className={`
                                    flex items-center w-full px-3 sm:px-4 rounded-lg py-2.5 sm:py-3 text-sm sm:text-base font-semibold transition-all
                                    ${option.value === value
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-foreground hover:bg-primary/10'
                                        }
                                    text-left
                                `}
                                >
                                    {option.icon && <option.icon className={cn("h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3", option.iconClassName)} />}
                                    <span className="flex-1">{option.label}</span>
                                    {option.badge !== undefined && (
                                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold ${option.value === value ? 'bg-card/20 text-card-text' : 'bg-primary/10 text-primary'
                                            }`}>
                                            {option.badge}
                                        </span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
