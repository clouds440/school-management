'use client';

import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Send, Clock, Paperclip, X, FileText, ImageIcon, Download, MessageSquare } from 'lucide-react';
import { MailDetail, MailMessage as MailMessageType, MailActionLog, Attachment } from '@/types';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { MarkdownEditor, MarkdownEditorHandle } from '@/components/ui/MarkdownEditor';
import { getPublicUrl } from '@/lib/utils';
import Image from 'next/image';
import { BrandIcon } from '@/components/ui/Brand';
import { ADMIN_REPLY_TEMPLATES } from './MailTemplates';
import { Button } from '@/components/ui/Button';

interface MailThreadProps {
    mail: MailDetail;
    currentUserId: string;
    currentUserRole?: string;
    onReply: (content: string, files?: File[]) => Promise<void>;
    isClosed?: boolean;
}

export interface MailThreadHandle {
    scrollToReply: () => void;
}

function AttachmentPreview({ file }: { file: Attachment }) {
    const isImage = file.mimeType.startsWith('image/');
    const url = getPublicUrl(file.path);

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-2 bg-white/50 border border-black/5 rounded-full hover:bg-white hover:shadow-sm transition-all group max-w-sm"
        >
            {isImage ? (
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-black/5 relative shadow-sm hover:scale-105 transition-transform duration-300">
                    <Image src={url} alt={file.filename} fill className="object-cover" unoptimized />
                </div>
            ) : (
                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center shrink-0 border border-indigo-100 shadow-sm">
                    <FileText className="w-5 h-5 text-indigo-500" />
                </div>
            )}
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-gray-700 truncate">{file.filename}</p>
                <p className="text-[9px] font-bold text-gray-400 uppercase">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <Download className="w-3 h-3 text-gray-300 group-hover:text-indigo-500 transition-colors" />
        </a>
    );
}

function MessageBubble({ message, isOwn }: { message: MailMessageType; isOwn: boolean }) {
    return (
        <div className="flex gap-3">
            <BrandIcon variant="user" size="sm" user={message.sender} className={`w-8 h-8 ${isOwn ? 'ring-2 ring-indigo-500/20' : ''}`} />
            <div className="flex-1 max-w-[90%]">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-black text-gray-700">
                        {message.sender?.name || message.sender?.email}
                    </span>
                    {message.sender?.role && (
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                            {message.sender.role.replace('_', ' ')}
                        </span>
                    )}
                    {isOwn && (
                        <span className="text-[8px] font-black text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">You</span>
                    )}
                </div>
                <div className={`inline-block p-4 rounded-sm shadow-sm ${isOwn ? 'bg-indigo-50/50 border border-indigo-100/50' : 'bg-white border border-gray-100'} text-left w-full`}>
                    <MarkdownRenderer content={message.content} className="text-sm text-gray-800" />

                    {message.files && message.files.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-2">
                            {message.files.map(file => (
                                <AttachmentPreview key={file.id} file={file} />
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-gray-300" />
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                        {new Date(message.createdAt).toLocaleString()}
                    </span>
                </div>
            </div>
        </div>
    );
}

function ActionLogItem({ log }: { log: MailActionLog }) {
    const getActionLabel = (action: string) => {
        switch (action) {
            case 'CREATED': return 'sent this mail';
            case 'STATUS_CHANGED': {
                const from = (log.details as Record<string, string>)?.statusFrom || '';
                const to = (log.details as Record<string, string>)?.statusTo || '';
                return `changed status from ${from.replace('_', ' ')} to ${to.replace('_', ' ')}`;
            }
            case 'ASSIGNED': return 'assigned this mail';
            case 'MESSAGE_SENT': return 'sent a message';
            case 'UPDATED': return 'updated this mail';
            default: return action.toLowerCase().replace('_', ' ');
        }
    };

    return (
        <div className="flex items-center gap-2 py-2 px-4 bg-gray-50/50 rounded-sm border border-gray-100/50 mx-8">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
            <span className="text-[10px] text-gray-500 font-medium">
                <span className="font-black uppercase text-gray-700">{log.performer?.name || 'System'}</span>
                {' '}{getActionLabel(log.action)}
            </span>
            <span className="text-[9px] text-gray-400 ml-auto font-bold uppercase">
                {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
    );
}

export const MailThread = forwardRef<MailThreadHandle, MailThreadProps>(
    ({ mail, currentUserId, currentUserRole, onReply, isClosed }, ref) => {
        const [replyContent, setReplyContent] = useState('');
        const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
        const [sending, setSending] = useState(false);
        const fileInputRef = useRef<HTMLInputElement>(null);
        const replyAreaRef = useRef<HTMLDivElement>(null);
        const editorRef = useRef<MarkdownEditorHandle>(null);

        useImperativeHandle(ref, () => ({
            scrollToReply: () => {
                replyAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setTimeout(() => editorRef.current?.focus(), 500); // Wait for scroll
            }
        }));

        const isPlatformAdmin = currentUserRole === 'PLATFORM_ADMIN' || currentUserRole === 'SUPER_ADMIN';

        const orgData = isPlatformAdmin ? {
            name: mail.organization?.name || mail.creator.name || 'User',
            id: mail.organization?.id || mail.creator.id,
            admin: 'Platform Support Team',
            role: currentUserRole || 'Administrator',
            date: new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }),
            signature: 'EduManage @ Support Team'
        } : {};

        const handleSend = async () => {
            if ((!replyContent.trim() && selectedFiles.length === 0) || sending) return;
            try {
                setSending(true);
                await onReply(replyContent, selectedFiles);
                setReplyContent('');
                setSelectedFiles([]);
            } finally {
                setSending(false);
            }
        };

        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files) {
                const filesArray = Array.from(e.target.files);
                const validFiles = filesArray.filter(file =>
                    file.type.startsWith('image/') || file.type === 'application/pdf'
                );
                setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 3));
            }
        };

        const removeFile = (index: number) => {
            setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        };

        type TimelineItem =
            | { type: 'message'; data: MailMessageType; time: string }
            | { type: 'action'; data: MailActionLog; time: string };

        const timeline: TimelineItem[] = [
            ...mail.messages.map((m): TimelineItem => ({ type: 'message', data: m, time: m.createdAt })),
            ...mail.actionLogs
                .filter(l => l.action !== 'MESSAGE_SENT')
                .map((l): TimelineItem => ({ type: 'action', data: l, time: l.createdAt })),
        ].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

        return (
            <div className="flex flex-col h-full">
                <div className="px-6 py-2 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                            <BrandIcon variant="user" size="sm" user={mail.creator} className="border-2 border-white/80 shadow-sm" />
                            {mail.assignees.length > 0 ? (
                                mail.assignees.slice(0, 2).map((a) => (
                                    <BrandIcon key={a.id} variant="user" size="sm" user={a} className="border-2 border-white/80 shadow-sm" />
                                ))
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center text-orange-600 text-[10px] font-black uppercase shadow-sm font-mono">
                                    {mail.targetRole ? 'GRP' : 'ALL'}
                                </div>
                            )}
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Conversation Between</p>
                            <p className="text-sm font-bold text-gray-700">
                                {mail.creator.name || mail.creator.email}
                                <span className="mx-2 text-gray-300">→</span>
                                {mail.assignees.length > 0 ? (
                                    mail.assignees.length > 3
                                        ? `${mail.assignees.slice(0, 2).map(a => a.name || a.email).join(', ')} and ${mail.assignees.length - 2} others`
                                        : mail.assignees.map(a => a.name || a.email).join(', ')
                                ) : mail.targetRole === 'ORG_STAFF' ? 'All Employees' :
                                    mail.targetRole === 'PLATFORM_ADMIN' || mail.targetRole === 'SUPER_ADMIN' ? 'Platform Administrative Team' :
                                        (mail.targetRole?.replace('_', ' ') || 'Platform Support Team')}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Priority</p>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${mail.priority === 'URGENT' ? 'bg-red-100 text-red-600' :
                            mail.priority === 'HIGH' ? 'bg-orange-100 text-orange-600' :
                                'bg-blue-100 text-blue-600'
                            }`}>
                            {mail.priority}
                        </span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-6 py-6 px-4 custom-scrollbar min-h-[300px]">
                    {timeline.length === 0 && (
                        <div className="flex items-center justify-center py-12 text-gray-400">
                            <MessageSquare className="w-12 h-12 opacity-10 mb-2" />
                            <p className="text-sm font-medium">No messages yet</p>
                        </div>
                    )}
                    {timeline.map((item, i) =>
                        item.type === 'message' ? (
                            <MessageBubble
                                key={`msg-${item.data.id}`}
                                message={item.data}
                                isOwn={item.data.senderId === currentUserId}
                            />
                        ) : (
                            <ActionLogItem key={`log-${i}`} log={item.data} />
                        )
                    )}

                    {!isClosed && <div ref={replyAreaRef} className="pt-4 mt-8 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Post a Reply</h3>

                            <div className="flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2 text-gray-400 hover:text-indigo-600 transition-colors p-1"
                                >
                                    <Paperclip className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Attach Files</span>
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept="image/*,.pdf"
                                    multiple
                                />
                            </div>
                        </div>

                        {selectedFiles.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4 animate-in fade-in slide-in-from-top-1">
                                {selectedFiles.map((file, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-sm">
                                        {file.type.startsWith('image/') ? <ImageIcon className="w-3 h-3 text-indigo-400" /> : <FileText className="w-3 h-3 text-indigo-400" />}
                                        <span className="text-[10px] font-bold text-indigo-900 truncate max-w-[150px]">{file.name}</span>
                                        <button onClick={() => removeFile(i)} className="p-0.5 hover:bg-indigo-200 rounded-full text-indigo-400 transition-colors">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <MarkdownEditor
                            ref={editorRef}
                            value={replyContent}
                            onChange={setReplyContent}
                            placeholder="Write a reply..."
                            rows={5}
                            templates={isPlatformAdmin ? ADMIN_REPLY_TEMPLATES.map((t: { name: string; content: string }) => ({ label: t.name, content: t.content })) : []}
                            orgData={orgData as Record<string, string>}
                        />

                        <div className="flex items-center justify-end mt-3">
                            <Button
                                onClick={handleSend}
                                isLoading={sending}
                                loadingId="reply-submit"
                                className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white rounded-sm font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all border-none shadow-lg shadow-indigo-200"
                                icon={Send}
                            >
                                SEND REPLY
                            </Button>
                        </div>
                    </div>}

                    {isClosed && (
                        <div className="border-t border-gray-100 py-6 text-center bg-gray-50/50 rounded-b-sm font-black text-gray-400 uppercase text-[10px] tracking-widest">
                            This mail is closed — no further replies
                        </div>
                    )}
                </div>
            </div>
        );
    }
);

MailThread.displayName = 'MailThread';
