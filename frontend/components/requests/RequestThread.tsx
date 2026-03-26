import React, { useState, useRef } from 'react';
import { Send, Clock, User, Paperclip, X, FileText, ImageIcon, Download } from 'lucide-react';
import { RequestDetail, RequestMessage as RequestMessageType, RequestActionLog, Attachment } from '@/types';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { MarkdownEditor } from '@/components/ui/MarkdownEditor';
import { getPublicUrl } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface RequestThreadProps {
    request: RequestDetail;
    currentUserId: string;
    onReply: (content: string, files?: File[]) => Promise<void>;
    isClosed?: boolean;
}

function AttachmentPreview({ file }: { file: Attachment }) {
    const isImage = file.mimeType.startsWith('image/');
    const url = getPublicUrl(file.path);

    return (
        <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-2 bg-white/50 border border-black/5 rounded-sm hover:bg-white hover:shadow-sm transition-all group max-w-sm"
        >
            {isImage ? (
                <div className="w-10 h-10 rounded-sm overflow-hidden shrink-0 border border-black/5">
                    <img src={url} alt={file.filename} className="w-full h-full object-cover" />
                </div>
            ) : (
                <div className="w-10 h-10 bg-indigo-50 rounded-sm flex items-center justify-center shrink-0">
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

function MessageBubble({ message, isOwn }: { message: RequestMessageType; isOwn: boolean }) {
    return (
        <div className="flex gap-3">
            <div className={`w-8 h-8 rounded-full ${isOwn ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'} flex items-center justify-center shrink-0 text-xs font-black uppercase shadow-sm`}>
                {message.sender?.avatarUrl ? (
                    <img src={message.sender.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                    (message.sender?.name || message.sender?.email || '?')[0]
                )}
            </div>
            <div className="flex-1 max-w-[90%]">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-black text-gray-700">
                        {message.sender?.name || message.sender?.email}
                    </span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        {message.sender?.role?.replace('_', ' ')}
                    </span>
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

function ActionLogItem({ log }: { log: RequestActionLog }) {
    const getActionLabel = (action: string) => {
        switch (action) {
            case 'CREATED': return 'sent this mail';
            case 'STATUS_CHANGED': {
                const from = (log.details as Record<string, string>)?.statusFrom || '';
                const to = (log.details as Record<string, string>)?.statusTo || '';
                return `changed status from ${from.replace('_', ' ')} to ${to.replace('_', ' ')}`;
            }
            case 'ASSIGNED': return 'assigned this folder';
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

export function RequestThread({ request, currentUserId, onReply, isClosed }: RequestThreadProps) {
    const { token } = useAuth();
    const [replyContent, setReplyContent] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [sending, setSending] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Merge messages and action logs into a timeline, sorted by date
    type TimelineItem =
        | { type: 'message'; data: RequestMessageType; time: string }
        | { type: 'action'; data: RequestActionLog; time: string };

    const timeline: TimelineItem[] = [
        ...request.messages.map((m): TimelineItem => ({ type: 'message', data: m, time: m.createdAt })),
        ...request.actionLogs
            .filter(l => l.action !== 'MESSAGE_SENT') // don't duplicate message actions
            .map((l): TimelineItem => ({ type: 'action', data: l, time: l.createdAt })),
    ].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    return (
        <div className="flex flex-col h-full">
            {/* Thread Header Info */}
            <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-indigo-600 text-[10px] font-black uppercase shadow-sm" title={`From: ${request.creator.name || request.creator.email}`}>
                            {(request.creator.name || request.creator.email || '?')[0]}
                        </div>
                        {request.assignees.length > 0 ? (
                            request.assignees.slice(0, 2).map((a, i) => (
                                <div key={a.id} className="w-8 h-8 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center text-orange-600 text-[10px] font-black uppercase shadow-sm" title={`To: ${a.name || a.email}`}>
                                    {(a.name || a.email || '?')[0]}
                                </div>
                            ))
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center text-orange-600 text-[10px] font-black uppercase shadow-sm font-mono" title="Group Mail">
                                {request.targetRole ? 'GRP' : 'ALL'}
                            </div>
                        )}
                        {request.assignees.length > 2 && (
                            <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-gray-500 text-[10px] font-black shadow-sm">
                                +{request.assignees.length - 2}
                            </div>
                        )}
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Conversation Between</p>
                        <p className="text-sm font-bold text-gray-700">
                            {request.creator.name || request.creator.email} 
                            <span className="mx-2 text-gray-300">→</span> 
                            {request.assignees.length > 0 ? (
                                request.assignees.length > 3 
                                    ? `${request.assignees.slice(0, 2).map(a => a.name || a.email).join(', ')} and ${request.assignees.length - 2} others`
                                    : request.assignees.map(a => a.name || a.email).join(', ')
                            ) : request.targetRole === 'ORG_STAFF' ? 'All Employees' :
                             (request.targetRole?.replace('_', ' ') || 'Platform Support Team')}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Priority</p>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                        request.priority === 'URGENT' ? 'bg-red-100 text-red-600' :
                        request.priority === 'HIGH' ? 'bg-orange-100 text-orange-600' :
                        'bg-blue-100 text-blue-600'
                    }`}>
                        {request.priority}
                    </span>
                </div>
            </div>

            {/* Thread messages */}
            <div className="flex-1 overflow-y-auto space-y-6 py-6 px-4 custom-scrollbar min-h-[300px]">
                {timeline.length === 0 && (
                    <div className="flex items-center justify-center py-12 text-gray-400">
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
            </div>

            {/* Reply composer */}
            {!isClosed ? (
                <div className="border-t border-gray-100 pt-4 shrink-0 bg-white">
                    <MarkdownEditor
                        value={replyContent}
                        onChange={setReplyContent}
                        placeholder="Write a reply..."
                        rows={3}
                    />
                    
                    {/* Selected Files Preview */}
                    {selectedFiles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {selectedFiles.map((file, i) => (
                                <div key={i} className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1 rounded-sm animate-in fade-in slide-in-from-bottom-2">
                                    {file.type.startsWith('image/') ? <ImageIcon className="w-3 h-3 text-gray-400" /> : <FileText className="w-3 h-3 text-gray-400" />}
                                    <span className="text-[10px] font-bold text-gray-600 truncate max-w-[100px]">{file.name}</span>
                                    <button onClick={() => removeFile(i)} className="p-0.5 hover:bg-gray-200 rounded-full">
                                        <X className="w-2.5 h-2.5 text-gray-400" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-3">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 text-gray-400 hover:text-indigo-600 transition-colors p-1"
                            title="Attach images or PDFs"
                        >
                            <Paperclip className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Attach</span>
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*,.pdf"
                            multiple
                        />

                        <button
                            onClick={handleSend}
                            disabled={(!replyContent.trim() && selectedFiles.length === 0) || sending}
                            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-sm font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
                        >
                            {sending ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            SEND REPLY
                        </button>
                    </div>
                </div>
            ) : (
                <div className="border-t border-gray-100 py-6 text-center bg-gray-50/50 rounded-b-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                        This mail is closed — no further replies
                    </p>
                </div>
            )}
        </div>
    );
}

