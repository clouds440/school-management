import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink, Calendar, MapPin, Mail, Phone, Tag, Hash, Building2 } from 'lucide-react';

export interface DataField {
    label: string;
    value: React.ReactNode;
    icon?: React.ElementType;
    fullWidth?: boolean;
}

interface DataViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    fields: DataField[];
    actions?: React.ReactNode;
}

export function DataViewModal({ isOpen, onClose, title, subtitle, fields, actions }: DataViewModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-999 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div
                className="bg-white dark:bg-gray-900 w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-sm shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight uppercase leading-none">{title}</h2>
                        {subtitle && <p className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-widest">{subtitle}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors group"
                    >
                        <X className="w-6 h-6 text-gray-400 group-hover:text-red-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        {fields.map((field, idx) => (
                            <div key={idx} className={`${field.fullWidth ? 'col-span-1 md:col-span-2' : ''} space-y-2`}>
                                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                    {field.icon && <field.icon className="w-3 h-3" />}
                                    {field.label}
                                </div>
                                <div className="text-sm font-bold text-gray-700 dark:text-gray-300 wrap-break-word">
                                    {field.value || <span className="opacity-30 italic">Not available</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-end gap-3">
                    {actions}
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-sm border border-gray-200 dark:border-gray-700 text-xs font-black uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-gray-600 dark:text-gray-400"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
