import React from 'react';
import { Pencil, Trash2, Eye, UserPen, Check, X, ShieldAlert, CheckCircle2, MessageSquareText, Send } from 'lucide-react';

export type AdminActionVariant = 'approve' | 'reject' | 'suspend' | 'unsuspend' | 'resolve' | 'reapprove' | 'editMessage' | 'mail';

export interface AdminAction {
    variant: AdminActionVariant;
    onClick: () => void;
    title?: string;
    loading?: boolean;
    disabled?: boolean;
}

interface TableActionsProps {
    onEdit?: () => void;
    onView?: () => void;
    onDelete?: () => void;
    editTitle?: string;
    deleteTitle?: string;
    isDeleting?: boolean;
    isViewAndEdit?: boolean;
    variant?: 'user' | 'default';
    extraActions?: AdminAction[];
    className?: string;
    showLabels?: boolean;
}

const adminActionConfig: Record<AdminActionVariant, { icon: React.ElementType, color: string, defaultTitle: string }> = {
    approve: { icon: Check, color: 'text-emerald-600 hover:bg-emerald-600', defaultTitle: 'Approve' },
    reject: { icon: X, color: 'text-red-600 hover:bg-red-600', defaultTitle: 'Reject' },
    suspend: { icon: ShieldAlert, color: 'text-orange-600 hover:bg-orange-600', defaultTitle: 'Suspend' },
    unsuspend: { icon: Check, color: 'text-indigo-600 hover:bg-indigo-600', defaultTitle: 'Unsuspend' },
    reapprove: { icon: Check, color: 'text-indigo-600 hover:bg-indigo-600', defaultTitle: 'Re-approve' },
    resolve: { icon: CheckCircle2, color: 'text-indigo-600 hover:bg-indigo-600', defaultTitle: 'Resolve' },
    editMessage: { icon: MessageSquareText, color: 'text-blue-600 hover:bg-blue-600', defaultTitle: 'Edit Message' },
    mail: { icon: Send, color: 'text-indigo-600 hover:bg-indigo-600', defaultTitle: 'Send Mail' }
};

export const TableActions: React.FC<TableActionsProps> = ({
    onEdit,
    onView,
    onDelete,
    editTitle = "View / Edit",
    deleteTitle = "Delete",
    isDeleting = false,
    isViewAndEdit = false,
    variant = 'default',
    extraActions = [],
    className = "",
    showLabels = false
}) => {
    // Select the appropriate icon based on variant
    const EditIcon = variant === 'user' ? UserPen : Pencil;

    return (
        <div className={`flex gap-3 items-center ${className}`}>
            {onView && !isViewAndEdit && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onView();
                    }}
                    className="text-primary hover:text-white px-3 py-2.5 hover:bg-primary border border-primary/10 rounded-sm transition-all shadow-sm active:scale-95 group relative flex items-center gap-2"
                    title="View"
                >
                    <Eye className="w-4 h-4" />
                    {showLabels && <span className="text-[10px] font-black uppercase tracking-wider text-inherit">View</span>}
                </button>
            )}

            {onEdit && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                    }}
                    className="text-primary hover:text-white px-3 py-2.5 hover:bg-primary border border-primary/10 rounded-sm transition-all shadow-sm hover:shadow-[0_8px_16px_var(--shadow-color)] active:scale-95 group relative flex items-center gap-2"
                    title={editTitle}
                >
                    <div className="flex items-center gap-2">
                        {isViewAndEdit &&
                            <div className="flex items-center gap-1.5 px-0.5 opacity-70">
                                <Eye className="w-4 h-4" /> <span className="text-current/30 text-[10px]">/</span>
                            </div>
                        }
                        <EditIcon className="w-4 h-4" />
                    </div>
                    {showLabels && <span className="text-[10px] font-black uppercase tracking-wider">{editTitle}</span>}
                </button>
            )}

            {extraActions.map((action, idx) => {
                const config = adminActionConfig[action.variant];
                const Icon = config.icon;
                const label = action.title || config.defaultTitle;
                return (
                    <button
                        key={idx}
                        onClick={(e) => {
                            e.stopPropagation();
                            action.onClick();
                        }}
                        disabled={action.disabled || action.loading}
                        className={`${config.color} hover:text-white px-3 py-2.5 border border-current/10 rounded-sm transition-all shadow-sm active:scale-95 disabled:opacity-50 group relative flex items-center gap-2`}
                        title={label}
                    >
                        {action.loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                        ) : (
                            <Icon className="w-4 h-4" />
                        )}
                        {showLabels && !action.loading && <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>}
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
                    className="text-red-600 hover:text-white px-3 py-2.5 hover:bg-red-600 border border-red-600/10 rounded-sm transition-all shadow-sm hover:shadow-red-200 active:scale-95 disabled:opacity-50 group flex items-center gap-2"
                    title={deleteTitle}
                >
                    {isDeleting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                    ) : (
                        <Trash2 className="w-4 h-4" />
                    )}
                    {showLabels && !isDeleting && <span className="text-[10px] font-black uppercase tracking-wider">{deleteTitle}</span>}
                </button>
            )}
        </div>
    );
};
