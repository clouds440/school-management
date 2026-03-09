import React, { ReactNode } from 'react';

interface ModalFormProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    onSubmit: (e: React.FormEvent) => void;
    submitText?: string;
    isSubmitting?: boolean;
    variant?: 'info' | 'danger' | 'warning' | 'success';
    showCancel?: boolean;
}


export function ModalForm({
    isOpen,
    onClose,
    title,
    children,
    onSubmit,
    submitText = 'Save',
    isSubmitting = false,
    variant = 'info',
    showCancel = true,
}: ModalFormProps) {

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-md transition-all duration-300">
            <div className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_30px_70px_rgba(0,0,0,0.2)] w-full max-w-lg mx-4 transform transition-all p-10 border border-white/50 animate-scale-in">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
                    >
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={onSubmit} className="space-y-6 text-gray-900">
                    <div className="max-h-[70vh] overflow-y-auto px-1 -mx-1 custom-scrollbar">
                        {children}
                    </div>

                    <div className="mt-10 pt-8 border-t border-gray-100 flex justify-end gap-4">
                        {showCancel && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-8 py-3.5 text-sm font-bold text-gray-600 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-all hover:scale-105 active:scale-95"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`px-10 py-3.5 text-sm font-bold text-white rounded-2xl transition-all shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-3 ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30' :
                                    variant === 'warning' ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30' :
                                        variant === 'success' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30' :
                                            'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30'
                                }`}
                        >

                            {isSubmitting && (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {submitText}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
