import React, { useState } from 'react';
import { Bold, Link as LinkIcon, Eye, Type, Zap, ChevronDown, User, Hash, Mail, Calendar, PenTool, ShieldCheck, Building2 } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
    className?: string;
    templates?: { label: string; content: string }[];
    orgData?: Record<string, string>;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
    value,
    onChange,
    placeholder = 'Enter message (Markdown supported)...',
    rows = 6,
    className = '',
    templates = [],
    orgData = {}
}) => {
    const [previewMode, setPreviewMode] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [showFields, setShowFields] = useState(false);

    const insertText = (before: string, after: string = '') => {
        const textarea = document.getElementById('md-editor-textarea') as HTMLTextAreaElement;
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
        setShowTemplates(false);
    };

    return (
        <div className={`flex flex-col border border-gray-200 rounded-sm overflow-hidden bg-white shadow-inner ${className}`}>
            <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100 gap-2">
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
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => { setShowTemplates(!showTemplates); setShowFields(false); }}
                                        className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-white rounded-sm text-indigo-600 font-bold text-xs transition-colors border border-transparent hover:border-gray-200"
                                    >
                                        <Zap className="w-3.5 h-3.5" />
                                        Templates
                                        <ChevronDown className={`w-3 h-3 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
                                    </button>
                                    {showTemplates && (
                                        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-sm shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
                                            <div className="py-1">
                                                {templates.map((t, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => applyTemplate(t.content)}
                                                        className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors border-b border-gray-50 last:border-0"
                                                    >
                                                        {t.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {Object.keys(orgData).length > 0 && (
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => { setShowFields(!showFields); setShowTemplates(false); }}
                                        className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-white rounded-sm text-gray-600 font-bold text-xs transition-colors border border-transparent hover:border-gray-200"
                                    >
                                        <Hash className="w-3.5 h-3.5" />
                                        Insert Data
                                        <ChevronDown className={`w-3 h-3 transition-transform ${showFields ? 'rotate-180' : ''}`} />
                                    </button>
                                    {showFields && (
                                        <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-gray-200 rounded-sm shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 max-h-[400px] overflow-y-auto">
                                            <div className="py-1">
                                                <div className="px-4 py-1 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 flex items-center justify-between">
                                                    Organization
                                                    <Building2 className="w-2.5 h-2.5 opacity-50" />
                                                </div>
                                                {['name', 'id', 'email'].map((key) => orgData[key] && (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        onClick={() => { insertText(orgData[key] || ''); setShowFields(false); }}
                                                        className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2 capitalize"
                                                    >
                                                        {key === 'name' ? <User className="w-3 h-3 text-indigo-500" /> : key === 'id' ? <Hash className="w-3 h-3 text-indigo-500" /> : <Mail className="w-3 h-3 text-indigo-500" />}
                                                        {key}
                                                    </button>
                                                ))}

                                                <div className="px-4 py-1 mt-2 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                                                    General
                                                    <Zap className="w-2.5 h-2.5 opacity-50" />
                                                </div>
                                                {['admin', 'role', 'date', 'signature'].map((key) => orgData[key] && (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        onClick={() => { insertText(orgData[key] || ''); setShowFields(false); }}
                                                        className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2 capitalize"
                                                    >
                                                        {key === 'admin' ? <PenTool className="w-3 h-3 text-emerald-500" /> : key === 'role' ? <ShieldCheck className="w-3 h-3 text-emerald-500" /> : key === 'date' ? <Calendar className="w-3 h-3 text-orange-500" /> : <Zap className="w-3 h-3 text-purple-500" />}
                                                        {key}
                                                    </button>
                                                ))}

                                                {/* Fallback for other fields if any */}
                                                {Object.keys(orgData).filter(k => !['name', 'id', 'email', 'admin', 'role', 'date', 'signature'].includes(k)).length > 0 && (
                                                    <>
                                                        <div className="px-4 py-1 mt-2 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 flex items-center justify-between">
                                                            Other
                                                        </div>
                                                        {Object.keys(orgData).filter(k => !['name', 'id', 'email', 'admin', 'role', 'date', 'signature'].includes(k)).map(key => (
                                                            <button
                                                                key={key}
                                                                type="button"
                                                                onClick={() => { insertText(orgData[key] || ''); setShowFields(false); }}
                                                                className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2 capitalize"
                                                            >
                                                                <Hash className="w-3 h-3 text-indigo-500" />
                                                                {key}
                                                            </button>
                                                        ))}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => { setPreviewMode(!previewMode); setShowTemplates(false); setShowFields(false); }}
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

            <div className="relative min-h-[180px]">
                {previewMode ? (
                    <div className="p-5 overflow-y-auto max-h-[400px] bg-white">
                        {value ? (
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
                        id="md-editor-textarea"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        rows={rows}
                        className="w-full p-5 text-sm outline-none resize-y border-none focus:ring-0 bg-transparent font-medium leading-relaxed text-gray-800 placeholder:text-gray-300"
                    />
                )}
            </div>

            {!previewMode && (
                <div className="px-4 py-2 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        Markdown Supported
                    </span>
                    <span className="text-[10px] text-gray-300 font-black tracking-tighter">
                        {value.length} CHARS
                    </span>
                </div>
            )}
        </div>
    );
};
