'use client';

import React, { useMemo } from 'react';
import { marked } from 'marked';
import { getPublicUrl } from '@/lib/utils';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
    const htmlContent = useMemo(() => {
        try {
            const renderer = new marked.Renderer();

            // Override image rendering to use getPublicUrl
            renderer.image = ({ href, title, text }) => {
                const url = getPublicUrl(href);
                return `<img src="${url}" alt="${text}" title="${title || ''}" class="max-w-full h-auto rounded-lg shadow-sm my-2 border border-gray-100" />`;
            };

            // Override link rendering for external/internal links
            renderer.link = ({ href, title, text }) => {
                if (!href) return `<a title="${title || ''}">${text}</a>`;

                // Comprehensive external link detection
                const isExternal = /^https?:\/\/|^\/\/|^www\.|^mailto:|^tel:/.test(href);
                let url = href;

                if (isExternal) {
                    // Ensure 'www.' links have a protocol, otherwise they are treated as relative paths
                    url = href.startsWith('www.') ? `https://${href}` : href;
                } else if (href.startsWith('/uploads/') || href.startsWith('uploads/') || href.includes('/chat-files/') || href.includes('/mail-files/')) {
                    // Only use getPublicUrl for known backend asset patterns
                    url = getPublicUrl(href);
                } else {
                    // Regular platform internal links (e.g. /dashboard) should stay relative to the frontend
                    url = href;
                }

                const targetAttr = isExternal ? 'target="_blank" rel="noopener noreferrer"' : '';
                return `<a href="${url}" title="${title || ''}" ${targetAttr}>${text}</a>`;
            };

            // Configure marked for safe and simple rendering
            marked.setOptions({
                breaks: true, // Support single line breaks
                gfm: true,   // GitHub Flavored Markdown
                renderer,
            });
            return marked.parse(content || '');
        } catch (error) {
            console.error('Markdown parsing error:', error);
            return content || '';
        }
    }, [content]);

    return (
        <div
            className={`markdown-content ${className}`}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
            dir="auto"
            style={{
                    lineHeight: '1.6',
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere'
                }}
        />
    );
};

// Add global CSS for markdown content
if (typeof document !== 'undefined') {
    const styleId = 'markdown-renderer-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            .markdown-content { color: #1f2937; overflow-wrap: anywhere; word-break: break-word; white-space: pre-wrap; }
            .markdown-content p { margin-bottom: 1rem; line-height: 1.7; }
            .markdown-content p:last-child { margin-bottom: 0; }
            .markdown-content strong { font-weight: 800; color: #111827; }
            .markdown-content a { color: #4338ca; text-decoration: underline; font-weight: 700; text-underline-offset: 2px; }
            .markdown-content a:hover { color: #3730a3; opacity: 0.9; }
            .markdown-content ul, .markdown-content ol { margin-bottom: 1rem; padding-left: 1.5rem; }
            .markdown-content li { margin-bottom: 0.5rem; }
            .markdown-content ul { list-style-type: disc; }
            .markdown-content ol { list-style-type: decimal; }
            .markdown-content h1, .markdown-content h2, .markdown-content h3 { 
                font-weight: 900; 
                line-height: 1.2; 
                margin-top: 1.5rem; 
                margin-bottom: 0.75rem; 
                color: #111827;
                letter-spacing: -0.025em;
            }
            .markdown-content h1 { font-size: 1.5rem; }
            .markdown-content h2 { font-size: 1.25rem; }
            .markdown-content h3 { font-size: 1.125rem; }
            .markdown-content blockquote {
                border-left: 4px solid #e5e7eb;
                padding-left: 1rem;
                font-style: italic;
                color: #4b5563;
                margin: 1.5rem 0;
            }
            .markdown-content code {
                background-color: #f3f4f6;
                padding: 0.2rem 0.4rem;
                border-radius: 0.25rem;
                font-size: 0.875em;
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
                color: #991b1b;
            }
            .markdown-content pre { white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; }
            .markdown-content code { white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; }
        `;
        document.head.appendChild(style);
    }
}
