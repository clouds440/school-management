'use client';

import { useState, useRef, useEffect } from "react";
import { LucideIcon, ChevronDown } from "lucide-react";

export interface DropdownOption<T extends string = string> {
    value: T;
    label: string;
    icon?: LucideIcon;
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
}

export function CustomSelect<T extends string = string>({
    options,
    value,
    onChange,
    placeholder = "Select an option",
    icon: Icon,
    className = "",
    disabled = false,
    required = false
}: CustomSelectProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (val: T) => {
        onChange(val);
        setIsOpen(false);
    };

    return (
        <div className={`relative group ${className}`} ref={containerRef}>
            {/* Hidden native select for form accessibility/validation if needed */}
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
                className={`
                    flex items-center w-full px-4 py-3 rounded-sm border transition-all duration-200 outline-none
                    ${isOpen
                        ? 'border-primary ring-4 ring-primary/10 bg-card'
                        : 'border-white/10 bg-primary/5 hover:border-white/20'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    text-card-text font-bold text-left
                `}
            >
                {Icon && (
                    <Icon className={`h-5 w-5 mr-3 transition-colors ${isOpen ? 'text-primary' : 'text-card-text/40 group-focus-within:text-primary'}`} />
                )}

                <span className={`flex-1 truncate ${!selectedOption ? 'text-card-text/40' : ''}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>

                <ChevronDown className={`h-4 w-4 ml-2 transition-transform duration-200 text-card-text/40 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 py-2 bg-card border border-white/10 rounded-sm shadow-2xl max-h-64 overflow-y-auto animate-in fade-in zoom-in duration-100">
                    {options.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-card-text/40 italic">No options available</div>
                    ) : (
                        options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleSelect(option.value)}
                                className={`
                                    flex items-center w-full px-4 py-3 text-sm font-bold transition-all
                                    ${option.value === value
                                        ? 'bg-primary text-white'
                                        : 'text-card-text hover:bg-primary/10'
                                    }
                                    text-left
                                `}
                            >
                                {option.icon && <option.icon className="h-4 w-4 mr-2" />}
                                {option.label}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
