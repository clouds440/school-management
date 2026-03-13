import React from 'react';
import { Pencil, Trash2, Eye, UserPen, LucideIcon } from 'lucide-react';

interface TableActionsProps {
    onEdit?: () => void;
    onDelete?: () => void;
    editTitle?: string;
    deleteTitle?: string;
    isDeleting?: boolean;
    showViewIcon?: boolean; // Legacy prop
    isViewAndEdit?: boolean;
    variant?: 'user' | 'default';
    className?: string;
}

export const TableActions: React.FC<TableActionsProps> = ({
    onEdit,
    onDelete,
    editTitle = "View / Edit",
    deleteTitle = "Delete",
    isDeleting = false,
    showViewIcon = true,
    isViewAndEdit = false,
    variant = 'default',
    className = ""
}) => {
    // Select the appropriate icon based on variant
    const EditIcon = variant === 'user' ? UserPen : Pencil;

    return (
        <div className={`flex gap-4 items-center ${className}`}>
            {onEdit && (
                <button
                    onClick={onEdit}
                    className="text-primary hover:text-white p-2.5 hover:bg-primary rounded-sm transition-all shadow-sm hover:shadow-[0_8px_16px_var(--shadow-color)] active:scale-90 group relative"
                    title={editTitle}
                >
                    <div className="flex items-center gap-2">
                        {isViewAndEdit ? (
                            <div className="flex items-center gap-1.5 px-1">
                                <Eye className="w-4 h-4" />
                                <EditIcon className="w-4 h-4" />
                            </div>
                        ) : showViewIcon ? (
                            <div className="relative">
                                <Eye className="w-5 h-5 group-hover:opacity-0 transition-opacity" />
                                <EditIcon className="w-4 h-4 absolute inset-0 m-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        ) : (
                            <EditIcon className="w-5 h-5" />
                        )}
                    </div>
                </button>
            )}
            
            {onDelete && (
                <button
                    onClick={onDelete}
                    disabled={isDeleting}
                    className="text-red-600 hover:text-white p-2.5 hover:bg-red-600 rounded-sm transition-all shadow-sm hover:shadow-red-200 active:scale-90 disabled:opacity-50 group"
                    title={deleteTitle}
                >
                    {isDeleting ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent"></div>
                    ) : (
                        <Trash2 className="w-5 h-5" />
                    )}
                </button>
            )}
        </div>
    );
};
