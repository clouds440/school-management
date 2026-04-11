'use client';
import { Reveal } from '@/components/ui/Reveal';
import { Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { PLATFORM_NAME } from '@/lib/constants';

export default function PricingPage() {
  return (
    <div className="flex flex-col bg-background">
      {/* Hero */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-40 bg-card border-b border-border">
        <div className="container mx-auto px-6 text-center max-w-4xl">
          <Reveal>
            <h1 className="text-4xl md:text-6xl font-black text-foreground mb-6 tracking-tight">Simple, Transparent <span className="text-primary">Pricing</span></h1>
          </Reveal>
          <Reveal delay={200}>
            <p className="text-xl text-muted-foreground font-medium leading-relaxed">
              Choose the plan that fits your institution&apos;s size. No hidden fees, no complex contracts.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PricingCard
              tier="Starter"
              price="$99"
              description="Perfect for small academies and private tutoring centers."
              features={['Up to 50 Students', 'Core Academic Modules', 'Global Chat Support', 'Standard Analytics']}
              delay={0}
            />
            <PricingCard
              tier="Professional"
              price="$299"
              description="Designed for growing schools needing advanced automation."
              features={['Unlimited Students', 'Full Module Suite', 'Priority Admin Support', 'Advanced Financials', 'Custom Branding']}
              highlighted={true}
              delay={200}
            />
            <PricingCard
              tier="Enterprise"
              price="Custom"
              description="Tailored solutions for massive university complexes and school chains."
              features={['Multi-Tenant Management', 'Dedicated Account Manager', 'SLA Guarantees', 'On-Premise Options', 'API Access']}
              delay={400}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-card border-t border-border">
        <div className="container mx-auto px-6 text-center space-y-8">
          <Reveal>
            <h2 className="text-3xl font-bold text-foreground">Still have questions?</h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our team is ready to help you find the perfect fit for your institution.
              Join 100+ schools scaling with {PLATFORM_NAME}.
            </p>
          </Reveal>
          <Reveal delay={400}>
            <Link href="/contact" className="inline-flex items-center px-8 py-4 bg-primary text-foreground rounded-xl font-bold hover:bg-primary-hover transition-all">
              Contact Sales <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

function PricingCard({ tier, price, description, features, highlighted = false, delay }: { tier: string, price: string, description: string, features: string[], highlighted?: boolean, delay: number }) {
  return (
    <Reveal delay={delay}>
      <div className={`p-8 rounded-3xl border ${highlighted ? 'border-primary ring-4 ring-primary/5 bg-primary/60  shadow-2xl' : 'border-border bg-card'} space-y-8 h-full flex flex-col`}>
        <div className="space-y-4">
          <h3 className="text-sm font-black text-primary uppercase tracking-widest">{tier}</h3>
          <div className="flex items-baseline space-x-1">
            <span className="text-5xl font-black text-foreground">{price}</span>
            {price !== 'Custom' && <span className="text-muted-foreground font-bold">/mo</span>}
          </div>
          <p className="text-muted-foreground font-medium leading-relaxed">{description}</p>
        </div>

        <ul className="space-y-4 flex-1">
          {features.map((f, i) => (
            <li key={i} className="flex items-center text-muted-foreground font-bold text-sm">
              <Check className="w-5 h-5 text-green-500 mr-3 shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        <Link
          href="/register"
          className={`w-full py-4 rounded-xl font-bold text-center transition-all ${highlighted ? 'bg-primary text-foreground hover:bg-primary-hover shadow-xl shadow-primary/20' : 'bg-card text-foreground hover:bg-card'}`}
        >
          {price === 'Custom' ? 'Contact Us' : 'Get Started'}
        </Link>
      </div>
    </Reveal>
  );
}
