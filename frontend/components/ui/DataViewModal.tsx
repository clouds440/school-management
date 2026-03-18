import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { getPublicUrl } from '@/lib/utils';

export interface DataField {
    label: string;
    value: React.ReactNode;
    icon?: React.ElementType | string;
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
        // eslint-disable-next-line react-hooks/set-state-in-effect
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
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div
                className="bg-card text-card-text backdrop-blur-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-sm shadow-[0_30px_70px_rgba(0,0,0,0.2)] border border-white/50 flex flex-col animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-8 py-5 border-b border-card-text/10 bg-card-text/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight uppercase leading-none">{title}</h2>
                        {subtitle && <p className="text-xs font-bold opacity-40 mt-2 uppercase tracking-[0.2em]">{subtitle}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-primary/10 rounded-sm transition-all group"
                    >
                        <X className="w-8 h-8 opacity-40 group-hover:opacity-100 group-hover:text-red-500 transition-all" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-10">
                        {fields.map((field, idx) => (
                            <div key={idx} className={`${field.fullWidth ? 'col-span-1 md:col-span-2' : ''} space-y-3`}>
                                <div className="flex items-center gap-2 text-[11px] font-black opacity-80 uppercase tracking-[0.25em]">
                                    {field.icon && (typeof field.icon === 'string' ? <Image src={getPublicUrl(field.icon)} alt="Org Logo/Icon" width={24} height={24} className="w-6 h-6 rounded-full object-contain" unoptimized /> : <field.icon className="w-3.5 h-3.5" />)}
                                    {field.label}
                                </div>
                                <div className="text-base font-bold wrap-break-word leading-relaxed">
                                    {field.value || <span className="opacity-20 italic font-medium">Not available</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-2 border-t border-card-text/10 bg-card-text/5 flex items-center justify-end gap-4">
                    {actions}
                    <button
                        onClick={onClose}
                        className="px-8 py-3.5 rounded-sm border border-card-text/20 text-xs font-black uppercase tracking-widest hover:bg-card-text/10 transition-all active:scale-95"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
