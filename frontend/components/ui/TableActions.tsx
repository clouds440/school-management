import React from 'react';
import { Pencil, Trash2, Eye, UserPen, Check, X, ShieldAlert, CheckCircle2, MessageSquareText } from 'lucide-react';

export type AdminActionVariant = 'approve' | 'reject' | 'suspend' | 'unsuspend' | 'resolve' | 'reapprove' | 'editMessage';

export interface AdminAction {
    variant: AdminActionVariant;
    onClick: () => void;
    title?: string;
    loading?: boolean;
    disabled?: boolean;
}

interface TableActionsProps {
    onEdit?: () => void;
    onDelete?: () => void;
    editTitle?: string;
    deleteTitle?: string;
    isDeleting?: boolean;
    isViewAndEdit?: boolean;
    variant?: 'user' | 'default';
    extraActions?: AdminAction[];
    className?: string;
}

const adminActionConfig: Record<AdminActionVariant, { icon: React.ElementType, color: string, defaultTitle: string }> = {
    approve: { icon: Check, color: 'text-emerald-600 hover:bg-emerald-600', defaultTitle: 'Approve' },
    reject: { icon: X, color: 'text-red-600 hover:bg-red-600', defaultTitle: 'Reject' },
    suspend: { icon: ShieldAlert, color: 'text-orange-600 hover:bg-orange-600', defaultTitle: 'Suspend' },
    unsuspend: { icon: Check, color: 'text-indigo-600 hover:bg-indigo-600', defaultTitle: 'Unsuspend' },
    reapprove: { icon: Check, color: 'text-indigo-600 hover:bg-indigo-600', defaultTitle: 'Re-approve' },
    resolve: { icon: CheckCircle2, color: 'text-indigo-600 hover:bg-indigo-600', defaultTitle: 'Resolve' },
    editMessage: { icon: MessageSquareText, color: 'text-blue-600 hover:bg-blue-600', defaultTitle: 'Edit Message' }
};

export const TableActions: React.FC<TableActionsProps> = ({
    onEdit,
    onDelete,
    editTitle = "View / Edit",
    deleteTitle = "Delete",
    isDeleting = false,
    isViewAndEdit = false,
    variant = 'default',
    extraActions = [],
    className = ""
}) => {
    // Select the appropriate icon based on variant
    const EditIcon = variant === 'user' ? UserPen : Pencil;

    return (
        <div className={`flex gap-3 items-center ${className}`}>
            {onEdit && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                    }}
                    className="text-primary hover:text-white p-2.5 hover:bg-primary border border-primary/10 rounded-sm transition-all shadow-sm hover:shadow-[0_8px_16px_var(--shadow-color)] active:scale-90 group relative"
                    title={editTitle}
                >
                    <div className="flex items-center gap-2">
                        {isViewAndEdit &&
                            <div className="flex items-center gap-1.5 px-1 opacity-70">
                                <Eye className="w-4 h-4" /> <span className="text-current/30 text-xs">/</span>
                            </div>
                        }
                        <EditIcon className="w-5 h-5" />
                    </div>
                </button>
            )}

            {extraActions.map((action, idx) => {
                const config = adminActionConfig[action.variant];
                const Icon = config.icon;
                return (
                    <button
                        key={idx}
                        onClick={(e) => {
                            e.stopPropagation();
                            action.onClick();
                        }}
                        disabled={action.disabled || action.loading}
                        className={`${config.color} hover:text-white p-2.5 border border-current/10 rounded-sm transition-all shadow-sm active:scale-90 disabled:opacity-50 group relative`}
                        title={action.title || config.defaultTitle}
                    >
                        {action.loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent"></div>
                        ) : (
                            <Icon className="w-5 h-5" />
                        )}
                    </button>
                );
            })}

            {onDelete && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    disabled={isDeleting}
                    className="text-red-600 hover:text-white p-2.5 hover:bg-red-600 border border-red-600/10 rounded-sm transition-all shadow-sm hover:shadow-red-200 active:scale-90 disabled:opacity-50 group"
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
