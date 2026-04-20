'use client';

import React, { useMemo } from 'react';
import { marked } from 'marked';
import { getPublicUrl } from '@/lib/utils';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

const failedMarkdownImageUrls = new Set<string>();

export const MarkdownRenderer = React.memo(function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
    const htmlContent = useMemo(() => {
        try {
            const renderer = new marked.Renderer();

            // Helper to escape HTML in alt/title text
            const escapeHtml = (str?: string) => {
                if (!str) return '';
                return String(str)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
            };

            // Override image rendering to use getPublicUrl and graceful fallback
            renderer.image = ({ href, title, text }) => {
                const url = href ? getPublicUrl(href) : '';
                const alt = escapeHtml(text || title || 'Image');
                const titleAttr = escapeHtml(title || '');

                // Placeholder markup shown when no url or when image fails to load
                const placeholder = `
                                        <div class="inline-block text-center">
                                                <div class="absolute top-2 left-2 text-xs text-muted-foreground">${alt}</div>
                                                <div class="w-35 h-35 border border-border rounded-md bg-card/40 flex flex-col items-center justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image-off-icon lucide-image-off text-foreground"><line x1="2" x2="22" y1="2" y2="22"/><path d="M10.41 10.41a2 2 0 1 1-2.83-2.83"/><line x1="13.5" x2="6" y1="13.5" y2="21"/><line x1="18" x2="21" y1="12" y2="15"/><path d="M3.59 3.59A1.99 1.99 0 0 0 3 5v14a2 2 0 0 0 2 2h14c.55 0 1.052-.22 1.41-.59"/><path d="M21 15V5a2 2 0 0 0-2-2H9"/></svg>
                                                <span class="italic text-[10px] text-muted-foreground">Couldn't load image</span>
                                            </div>
                                        </div>
                                `;

                if (!url || failedMarkdownImageUrls.has(url)) return placeholder;

                // When url exists, render the image with a simple error handler
                return `
                                    <img src="${escapeHtml(url)}" alt="${alt}" title="${titleAttr}" class="max-w-full h-auto rounded-lg shadow-sm my-2 border border-border markdown-image" data-failed-url="${escapeHtml(url)}" />
                                `;
            };

            // Override link rendering for external/internal links
            renderer.link = ({ href, title, text }) => {
                if (!href) return `<a title="${escapeHtml(title || '')}">${text}</a>`;

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
                return `<a href="${escapeHtml(url)}" title="${escapeHtml(title || '')}" ${targetAttr}>${text}</a>`;
            };

            // Configure marked for safe and simple rendering
            marked.setOptions({
                breaks: true, // Support single line breaks
                gfm: true,   // GitHub Flavored Markdown
                renderer,
            });
            // Trim trailing newlines to avoid stray empty lines inside chat bubbles
            const sanitized = (content || '').replace(/\n+$/g, '');
            if (typeof window !== 'undefined') {
                const failedMap = (window as Window & { __eduverseFailedMarkdownImages?: Record<string, boolean> }).__eduverseFailedMarkdownImages;
                if (failedMap) {
                    Object.keys(failedMap).forEach((url) => {
                        if (failedMap[url]) failedMarkdownImageUrls.add(url);
                    });
                }
            }
            return marked.parse(sanitized);
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
});

// Add global CSS for markdown content
if (typeof document !== 'undefined') {
    const styleId = 'markdown-renderer-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
                /* Let the surrounding container (e.g. .message-bubble) control white-space.
                    Use inherit so we avoid conflicting pre-wrap rules that cause extra blank lines. */
                .markdown-content { color: #1f2937; overflow-wrap: anywhere; word-break: break-word; white-space: inherit; }
            /* Remove paragraph bottom margins to avoid extra space inside message bubbles */
            .markdown-content p { margin: 0 0 0 0; line-height: 1.6; }
            .markdown-content p:last-child { margin-bottom: 0; }
            .markdown-content strong, .markdown-content b { font-weight: 800; color: var(--foreground) !important; }
            .markdown-content a { color: #4338ca; text-decoration: underline; font-weight: 700; text-underline-offset: 2px; }
            .markdown-content a:hover { color: #3730a3; opacity: 0.9; }
            .markdown-content ul, .markdown-content ol { margin: 0 0 0 0; padding-left: 1rem; }
            .markdown-content li { margin: 0 0 0 0; }
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
            .markdown-content pre { white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; margin: 0; }
            .markdown-content code { white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; }
            .markdown-content img { margin: 0; display: block; }
        `;
        document.head.appendChild(style);
    }
}
