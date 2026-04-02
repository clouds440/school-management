import { useState, useRef, forwardRef, useImperativeHandle, useId } from 'react';
import { Bold, Link as LinkIcon, Eye, Type, Zap, User, Hash, Mail, Calendar, PenTool, ShieldCheck } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { CustomSelect } from './CustomSelect';

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
    className?: string;
    templates?: { label: string; content: string }[];
    orgData?: Record<string, string>;
    onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    onFocus?: () => void;
}

export interface MarkdownEditorHandle {
    focus: () => void;
}

export const MarkdownEditor = forwardRef<MarkdownEditorHandle, MarkdownEditorProps>(({
    value,
    onChange,
    placeholder = 'Enter message (Markdown supported)...',
    rows = 6,
    className = '',
    templates = [],
    orgData = {},
    onKeyDown,
    onFocus
}, ref) => {
    const [previewMode, setPreviewMode] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const editorId = useId();

    useImperativeHandle(ref, () => ({
        focus: () => {
            if (previewMode) setPreviewMode(false);
            setTimeout(() => textareaRef.current?.focus(), 0);
        }
    }));

    const insertText = (before: string, after: string = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selected = text.substring(start, end);

        // Save current scroll position
        const scrollTop = textarea.scrollTop;

        const newValue = text.substring(0, start) + before + selected + after + text.substring(end);
        onChange(newValue);

        // Refocus and restore scroll/selection
        setTimeout(() => {
            textarea.focus();
            textarea.scrollTop = scrollTop;
            textarea.setSelectionRange(start + before.length, end + before.length);
        }, 0);
    };

    const applyTemplate = (content: string) => {
        let finalContent = content;
        // Replace placeholders with orgData
        Object.entries(orgData).forEach(([key, val]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            finalContent = finalContent.replace(regex, val || '');
        });
        onChange(finalContent);
    };

    return (
        <div className={`flex flex-col border border-gray-200 rounded-sm overflow-hidden bg-white shadow-inner ${className}`}>
            <div className="flex flex-wrap items-center justify-between px-3 bg-gray-50 border-b border-gray-100 gap-2">
                <div className="flex items-center gap-1 flex-wrap">
                    {!previewMode && (
                        <>
                            <button
                                type="button"
                                onClick={() => insertText('**', '**')}
                                className="p-1.5 hover:bg-white rounded-sm text-gray-600 transition-colors border border-transparent hover:border-gray-200"
                                title="Bold"
                            >
                                <Bold className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => insertText('[', '](url)')}
                                className="p-1.5 hover:bg-white rounded-sm text-gray-600 transition-colors border border-transparent hover:border-gray-200"
                                title="Link"
                            >
                                <LinkIcon className="w-4 h-4" />
                            </button>

                            <div className="h-6 w-px bg-gray-200 mx-1"></div>

                            {templates.length > 0 && (
                                <CustomSelect
                                    options={templates.map((t, i) => ({
                                        value: i.toString(),
                                        label: t.label,
                                        icon: Zap,
                                        iconClassName: 'text-amber-500'
                                    }))}
                                    value=""
                                    onChange={(val: string) => {
                                        const index = parseInt(val);
                                        if (!isNaN(index)) applyTemplate(templates[index].content);
                                    }}
                                    placeholder="Templates"
                                    icon={Zap}
                                    className="w-auto py-0!"
                                />
                            )}

                            {Object.keys(orgData).length > 0 && (
                                <CustomSelect
                                    options={[
                                        ...['name', 'id', 'email'].filter(k => orgData[k]).map(key => ({
                                            value: `org-${key}`,
                                            label: key.toUpperCase(),
                                            icon: key === 'name' ? User : key === 'id' ? Hash : Mail,
                                            iconClassName: key === 'name' ? 'text-indigo-500' : key === 'id' ? 'text-rose-500' : 'text-blue-500'
                                        })),
                                        ...['admin', 'role', 'date', 'signature'].filter(k => orgData[k]).map(key => ({
                                            value: `gen-${key}`,
                                            label: key.toUpperCase(),
                                            icon: key === 'admin' ? PenTool : key === 'role' ? ShieldCheck : key === 'date' ? Calendar : Zap,
                                            iconClassName: key === 'admin' ? 'text-emerald-500' : key === 'role' ? 'text-teal-500' : key === 'date' ? 'text-orange-500' : 'text-amber-500'
                                        }))
                                    ]}
                                    value=""
                                    onChange={(val: string) => {
                                        const [type, ...rest] = val.split('-');
                                        const key = rest.join('-');
                                        if (orgData[key]) insertText(orgData[key]);
                                    }}
                                    placeholder="Insert Data"
                                    icon={Hash}
                                    className="w-auto py-0!"
                                />
                            )}
                        </>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => setPreviewMode(!previewMode)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all border ${previewMode
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200'
                        : 'text-gray-500 border-gray-200 hover:bg-white'
                        }`}
                >
                    {previewMode ? (
                        <>
                            <Type className="w-3.5 h-3.5" />
                            Edit Mode
                        </>
                    ) : (
                        <>
                            <Eye className="w-3.5 h-3.5" />
                            Preview
                        </>
                    )}
                </button>
            </div>

            <div className="relative min-h-auto">
                {previewMode ? (
                    <div className="p-5 overflow-y-auto max-h-[400px] bg-white">
                        {value.length > 0 ? (
                            <MarkdownRenderer content={value} />
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 opacity-30 select-none">
                                <Eye className="w-12 h-12 mb-2" />
                                <p className="font-black uppercase tracking-widest text-xs">Nothing to preview</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <textarea
                        id={editorId}
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={onKeyDown}
                        onFocus={onFocus}
                        placeholder={placeholder}
                        rows={rows + (value.length > 100 ? 3 : 0) + (value.length > 300 ? 3 : 0) + (value.length > 600 ? 3 : 0)}
                        className="w-full p-2.5 outline-none resize-y border-none focus:ring-0 bg-transparent custom-scrollbar max-h-80 min-h-10 font-medium leading-relaxed text-gray-800 placeholder:text-gray-300"
                    />
                )}
            </div>

            {!previewMode && (
                <div className="px-4 py-0.5 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                        Markdown Supported
                    </span>
                    <span className="text-[10px] text-gray-500 font-black tracking-tighter">
                        {value.length} CHARS
                    </span>
                </div>
            )}
        </div>
    );
});

MarkdownEditor.displayName = 'MarkdownEditor';
