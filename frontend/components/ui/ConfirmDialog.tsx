import React from 'react';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: React.ReactNode;
    description: React.ReactNode;
    confirmText?: string;
    isDestructive?: boolean;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirm',
    isDestructive = false,
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md transition-opacity duration-300">
            <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] p-10 w-full max-w-md mx-4 transform animate-scale-in border border-white">
                <h3 className="text-2xl font-black text-gray-900 mb-4 leading-tight">{title}</h3>
                <p className="text-gray-600 text-lg mb-10 leading-relaxed font-medium">{description}</p>

                <div className="flex gap-4 justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-3.5 text-sm font-bold text-gray-700 bg-gray-100/80 hover:bg-gray-200 rounded-2xl transition-all hover:scale-105 active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-8 py-3.5 text-sm font-bold text-white rounded-2xl transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 ${isDestructive
                            ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30'
                            : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
