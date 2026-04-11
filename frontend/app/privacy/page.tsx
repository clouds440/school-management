import { Reveal } from '@/components/ui/Reveal';
import { Shield, Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { PLATFORM_NAME } from '@/lib/constants';

export default function PrivacyPage() {
  return (
     <div className="flex flex-col bg-background">
      {/* Header */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-40 bg-card border-b border-border">
        <div className="container mx-auto px-6 text-center max-w-4xl space-y-6">
          <Reveal>
              <Shield className="w-16 h-16 text-primary mx-auto mb-8 bg-card p-4 rounded-3xl shadow-sm border border-border" />
              <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tight leading-tight uppercase">Privacy Policy</h1>
          </Reveal>
          <Reveal delay={200}>
            <p className="text-xl text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto">
                Your trust is our most valuable asset. We treat your data with the highest level of security and transparency.
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
            <h2 className="text-3xl font-black text-foreground mb-8 border-b border-border pb-4">1. Data Storage & Multi-Tenancy</h2>
              <p className="text-muted-foreground font-medium leading-relaxed mb-12">
              {PLATFORM_NAME} architecture is built upon a high-performance multi-tenant system. This means your institution&apos;s data is logically isolated in its own dedicated workspace. We use AES-256 encryption at rest and TLS 1.3 for data in transit, ensuring that student and administrative information remains private and secure at all times.
            </p>
          </Reveal>

          <Reveal delay={100}>
            <h2 className="text-3xl font-black text-foreground mb-8 border-b border-border pb-4">2. Collection of Information</h2>
              <p className="text-muted-foreground font-medium leading-relaxed mb-12">
              We collect information necessary to provide and improve the educational experience, including account details, organizational metadata, and interaction logs. We never sell your data to third parties. Our business model is based on subscriptions, not your personal information.
            </p>
          </Reveal>

          <Reveal delay={200}>
            <h2 className="text-3xl font-black text-foreground mb-8 border-b border-border pb-4">3. Security Standards</h2>
              <p className="text-muted-foreground font-medium leading-relaxed mb-12">
              We maintain SOC-2 and GDPR compliance standards. Our engineers perform daily redundant backups across geographically distributed edge locations to ensure zero data loss and persistent availability, even in the event of local infrastructure failures.
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
