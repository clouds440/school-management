'use client';

import { useState } from 'react';
import { useFloating, useInteractions, useClick, useDismiss, flip, shift, offset } from '@floating-ui/react';
import { ChevronDown, Reply, Copy, Pencil, Download, Trash2 } from 'lucide-react';
import { ChatMessage, Role } from '@/types';
import { JwtPayload } from '@/context/GlobalContext';

interface MessageActionsDropdownProps {
    msg: ChatMessage;
    user: JwtPayload | null;
    isMine: boolean;
    isFailedMessage: boolean;
    onReply: (msg: ChatMessage) => void;
    onCopyText: (msg: ChatMessage) => void;
    onEditMessage: (msg: ChatMessage) => void;
    onDownload: (e: React.MouseEvent, url: string, label: string) => void;
    onDeleteMessage: (msgId: string) => void;
}

export function MessageActionsDropdown({
    msg,
    user,
    isMine,
    isFailedMessage,
    onReply,
    onCopyText,
    onEditMessage,
    onDownload,
    onDeleteMessage,
}: MessageActionsDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);

    const { refs, floatingStyles, context } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        placement: isMine ? 'bottom-start' : 'bottom-end',
        middleware: [
            offset(4),
            flip({ fallbackPlacements: ['top-start', 'top-end'] }),
            shift({ padding: 8 }),
        ],
    });

    const click = useClick(context);
    const dismiss = useDismiss(context);

    const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss]);

    const handleAction = (action: () => void) => {
        setIsOpen(false);
        action();
    };

    const links = Array.from(msg.content.matchAll(/\[([^\]]*)\]\((https?:\/\/[^\)]+)\)/g));

    return (
        <>
            <button
                ref={refs.setReference}
                {...getReferenceProps()}
                className={`py-0.5 px-3 rounded-lg transition-all bg-background shadow-sm more-actions-btn`}
                title="More actions"
            >
                <ChevronDown size={15} className={`${isOpen && 'rotate-180'} text-primary/80 hover:text-primary`} />
            </button>
            {isOpen && (
                <div
                    ref={refs.setFloating}
                    style={floatingStyles}
                    {...getFloatingProps()}
                    className="overflow-hidden w-32 bg-card border border-border rounded-xl shadow-xl z-50 flex flex-col animate-in fade-in zoom-in-95 duration-100 chat-dropdown"
                >
                    {!isFailedMessage && (
                        <button
                            onClick={() => handleAction(() => onReply(msg))}
                            className="w-full rounded-sm text-left px-3 py-2 text-[13px] text-foreground hover:bg-primary/40 flex items-center"
                        >
                            <Reply size={12} className="mr-2 opacity-85 text-purple-700" /> Reply
                        </button>
                    )}
                    <button
                        onClick={() => handleAction(() => onCopyText(msg))}
                        className="w-full rounded-sm text-left px-3 py-2 text-[13px] text-foreground hover:bg-primary/40 flex items-center"
                    >
                        <Copy size={12} className="mr-2 opacity-85 text-yellow-400" /> Copy Text
                    </button>
                    {isMine && !isFailedMessage && (
                        <button
                            onClick={() => handleAction(() => onEditMessage(msg))}
                            className="w-full rounded-sm text-left px-3 py-2 text-[13px] text-foreground hover:bg-primary/40 flex items-center"
                        >
                            <Pencil size={12} className="mr-2 opacity-85 text-green-400" /> Edit
                        </button>
                    )}
                    {links.map((match, idx) => {
                        const label = (match[1] || '').trim();
                        return (
                            <button
                                key={idx}
                                onClick={(e) => handleAction(() => onDownload(e, match[2], label || 'download'))}
                                className="w-full rounded-sm text-left px-3 py-2 text-[13px] text-foreground hover:bg-primary/40 flex items-center"
                            >
                                <Download size={12} className="mr-2 opacity-85 text-blue-400" />
                                Download
                            </button>
                        );
                    })}
                    {(isMine || user?.role === Role.ORG_ADMIN) && (
                        <button
                            onClick={() => handleAction(() => onDeleteMessage(msg.id))}
                            className="w-full rounded-sm text-left px-3 py-2 text-[13px] text-red-600 hover:bg-red-700/30 flex items-center border-t border-border"
                        >
                            <Trash2 size={12} className="mr-2 opacity-85 text-red-500" /> Delete
                        </button>
                    )}
                </div>
            )}
        </>
    );
}
