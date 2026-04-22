'use client';

import Link from 'next/link';
import { ArrowRight, CalendarDays, Sparkles, TrendingUp } from 'lucide-react';
import { DashboardInsights, DashboardInsightItem } from '@/types';

interface InsightsOverviewProps {
    insights: DashboardInsights;
}

const toneClasses: Record<NonNullable<DashboardInsightItem['tone']>, string> = {
    default: 'border-border bg-card text-foreground',
    info: 'border-primary/20 bg-primary/5 text-foreground',
    success: 'border-emerald-500/20 bg-emerald-500/5 text-foreground',
    warning: 'border-amber-500/20 bg-amber-500/5 text-foreground',
    danger: 'border-rose-500/20 bg-rose-500/5 text-foreground',
};

function InsightLinkCard({
    item,
    compact = false,
}: {
    item: DashboardInsightItem;
    compact?: boolean;
}) {
    const content = (
        <div className={`rounded-2xl border p-4 transition-all hover:shadow-lg ${toneClasses[item.tone || 'default']}`}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className={`font-black tracking-tight ${compact ? 'text-sm' : 'text-base'} text-foreground`}>
                        {item.title}
                    </p>
                    {item.description && (
                        <p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            {item.description}
                        </p>
                    )}
                </div>
                {item.badge && (
                    <span className="rounded-full bg-background/80 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground border border-border">
                        {item.badge}
                    </span>
                )}
            </div>
            {(item.meta || item.href) && (
                <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-muted-foreground">{item.meta}</span>
                    {item.href && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                </div>
            )}
        </div>
    );

    if (item.href) {
        return <Link href={item.href}>{content}</Link>;
    }

    return content;
}

export default function InsightsOverview({ insights }: InsightsOverviewProps) {
    return (
        <div className="space-y-8">
            <section className="rounded-3xl border border-border bg-card/70 p-8 shadow-xl">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        {insights.headline.eyebrow && (
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-primary">
                                <Sparkles className="h-3.5 w-3.5" />
                                {insights.headline.eyebrow}
                            </div>
                        )}
                        <h1 className="text-4xl font-black italic tracking-tighter text-foreground">
                            {insights.headline.title}
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm font-bold text-muted-foreground">
                            {insights.headline.subtitle}
                        </p>
                    </div>
                    <div className="inline-flex items-center gap-3 rounded-2xl border border-border bg-background/70 px-4 py-3">
                        <CalendarDays className="h-5 w-5 text-primary" />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">Live snapshot</p>
                            <p className="text-sm font-black text-foreground">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">
                {insights.summaryCards.map((card) => {
                    const content = (
                        <div className={`rounded-2xl border p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg ${toneClasses[card.tone || 'default']}`}>
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">
                                {card.label}
                            </p>
                            <p className="mt-3 text-3xl font-black italic tracking-tighter text-foreground">
                                {card.value}
                            </p>
                            {card.detail && (
                                <p className="mt-3 text-xs font-bold text-muted-foreground">
                                    {card.detail}
                                </p>
                            )}
                        </div>
                    );

                    return card.href ? (
                        <Link key={card.id} href={card.href}>
                            {content}
                        </Link>
                    ) : (
                        <div key={card.id}>{content}</div>
                    );
                })}
            </section>

            {insights.spotlight && (
                <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-xl">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-primary">
                                <TrendingUp className="h-3.5 w-3.5" />
                                Spotlight
                            </div>
                            <h2 className="text-2xl font-black italic tracking-tight text-foreground">
                                {insights.spotlight.title}
                            </h2>
                            {insights.spotlight.description && (
                                <p className="mt-2 text-sm font-bold text-muted-foreground">
                                    {insights.spotlight.description}
                                </p>
                            )}
                            {insights.spotlight.meta && (
                                <p className="mt-3 text-xs font-black uppercase tracking-[0.22em] text-primary/80">
                                    {insights.spotlight.meta}
                                </p>
                            )}
                        </div>
                        {insights.spotlight.href && (
                            <Link
                                href={insights.spotlight.href}
                                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-primary-foreground shadow-lg transition hover:bg-primary/90"
                            >
                                Open Insight
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        )}
                    </div>
                </section>
            )}

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                {insights.groups.map((group) => (
                    <div key={group.id} className="rounded-3xl border border-border bg-card/70 p-6 shadow-lg">
                        <h3 className="text-xl font-black italic tracking-tight text-foreground">
                            {group.title}
                        </h3>
                        {group.description && (
                            <p className="mt-2 text-sm font-bold text-muted-foreground">
                                {group.description}
                            </p>
                        )}
                        <div className="mt-5 space-y-3">
                            {group.items.length > 0 ? (
                                group.items.map((item) => (
                                    <InsightLinkCard key={item.id} item={item} compact />
                                ))
                            ) : (
                                <div className="rounded-2xl border border-dashed border-border bg-background/50 p-6 text-center text-xs font-black uppercase tracking-[0.22em] text-muted-foreground">
                                    Nothing pressing here
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </section>

            <section className="rounded-3xl border border-border bg-card/70 p-6 shadow-lg">
                <h3 className="text-xl font-black italic tracking-tight text-foreground">
                    Recent Activity
                </h3>
                <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
                    {insights.recentActivity.length > 0 ? (
                        insights.recentActivity.map((activity) => (
                            <InsightLinkCard
                                key={activity.id}
                                item={{
                                    id: activity.id,
                                    title: activity.title,
                                    description: activity.description,
                                    meta: new Date(activity.createdAt).toLocaleString(),
                                    href: activity.href,
                                    tone: activity.tone,
                                }}
                            />
                        ))
                    ) : (
                        <div className="rounded-2xl border border-dashed border-border bg-background/50 p-6 text-center text-xs font-black uppercase tracking-[0.22em] text-muted-foreground">
                            No recent activity captured yet
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
