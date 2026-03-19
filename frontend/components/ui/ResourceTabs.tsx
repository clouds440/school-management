'use client';

import { LucideIcon } from 'lucide-react';

export interface Tab {
    id: string;
    label: string;
    icon: LucideIcon;
    href?: string; // Optional for external links
}

interface ResourceTabsProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (id: string) => void;
}

export function ResourceTabs({ tabs, activeTab, onTabChange }: ResourceTabsProps) {
    return (
        <div className="flex items-center gap-1 border-b border-white/10 mb-8 pt-4 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`
                            flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative group whitespace-nowrap
                            ${isActive 
                                ? 'text-primary' 
                                : 'text-card-text/40 hover:text-card-text/70'
                            }
                        `}
                    >
                        <tab.icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-card-text/20 group-hover:text-card-text/40'}`} />
                        {tab.label}
                        
                        {isActive && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary animate-in fade-in slide-in-from-bottom-1 duration-300" />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
