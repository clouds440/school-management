'use client';
import { Reveal } from '@/components/ui/Reveal';
import { Clock, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { PLATFORM_NAME } from '@/lib/constants';

export default function TermsPage() {
  return (
    <div className="flex flex-col bg-background">
      {/* Header */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-40 bg-muted/30 border-b border-border">
        <div className="container mx-auto px-6 text-center max-w-4xl space-y-6">
          <Reveal>
            <CheckCircle className="w-16 h-16 text-primary mx-auto mb-8 bg-card p-4 rounded-3xl shadow-sm border border-border" />
            <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tight leading-tight uppercase">Terms of Service</h1>
          </Reveal>
          <Reveal delay={200}>
            <p className="text-xl text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto">
              Our commitment to providing a secure and professional educational ecosystem starts with clear, fair terms.
            </p>
          </Reveal>
          <Reveal delay={400}>
            <div className="flex items-center justify-center space-x-2 text-xs font-black text-muted-foreground uppercase tracking-widest">
              <Clock className="w-4 h-4" />
              <span>Last Updated: April 01, 2026</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Content */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-6 max-w-4xl prose prose-slate prose-lg">
          <Reveal>
            <h2 className="text-3xl font-black text-foreground mb-8 border-b border-border pb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground font-medium leading-relaxed mb-12">
              By accessing or using the {PLATFORM_NAME} platform, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, you must not use our services. These terms apply to all administrators, educators, students, and institutional managers who access our platform.
            </p>
          </Reveal>

          <Reveal delay={100}>
            <h2 className="text-3xl font-black text-foreground mb-8 border-b border-border pb-4">2. Subscription & Payments</h2>
            <p className="text-muted-foreground font-medium leading-relaxed mb-12">
              Our services are provided on a subscription basis. Subscriptions automatically renew at the end of each billing cycle unless cancelled by the institutional administrator. We reserve the right to modify our pricing with a 30-day notice to current active organizations.
            </p>
          </Reveal>

          <Reveal delay={200}>
            <h2 className="text-3xl font-black text-foreground mb-8 border-b border-border pb-4">3. User Responsibility & Code of Conduct</h2>
            <p className="text-muted-foreground font-medium leading-relaxed mb-12">
              Organizations are responsible for the actions of their assigned users. {PLATFORM_NAME} is a professional educational tool; we prohibit the transmission of harmful code, harassment, or illegal content. We reserve the right to suspend any organization that violates our security standards or code of conduct.
            </p>
          </Reveal>

          <div className="pt-20 text-center">
            <Reveal delay={400}>
              <Link href="/" className="inline-flex items-center text-primary font-black text-sm uppercase tracking-widest hover:translate-x-2 transition-transform">
                Return to Home <ArrowLeft className="ml-2 w-4 h-4" />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
