'use client';
import { Reveal } from '@/components/ui/Reveal';
import { Briefcase, MapPin, Search, ArrowRight, Zap, Shield, Globe } from 'lucide-react';
import Link from 'next/link';
import { PLATFORM_NAME } from '@/lib/constants';

export default function CareersPage() {
  return (
    <div className="flex flex-col bg-background">
      {/* Hero */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-40 bg-card-bg overflow-hidden relative border-b border-border">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 -left-1/4 w-75 md:w-150 h-75 md:h-150 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        </div>
        <div className="container mx-auto px-6 text-center max-w-4xl space-y-6 relative z-10">
          <Reveal>
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-[rgba(var(--primary-rgb),0.08)] text-primary-text text-xs font-bold mb-4 tracking-wide uppercase border border-border backdrop-blur-md">
              Join the Mission
            </div>
          </Reveal>
          <Reveal delay={200}>
            <h1 className="text-4xl md:text-6xl font-black text-card-text tracking-tight leading-tight">Help Us Build the <span className="text-primary bg-clip-text bg-linear-to-r from-primary via-indigo-400 to-purple-400">Future of Education</span></h1>
          </Reveal>
          <Reveal delay={400}>
            <p className="text-xl text-muted-text font-medium leading-relaxed max-w-2xl mx-auto">
              We&apos;re a distributed team of dreamers and doers building the tools 
              that empower thousands of educational institutions.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Perks */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <Reveal>
              <h2 className="text-3xl md:text-5xl font-black text-foreground tracking-tighter uppercase">Why {PLATFORM_NAME}?</h2>
            </Reveal>
            <Reveal delay={200}>
              <p className="text-muted-foreground text-lg font-medium">Life is better when you build something that matters.</p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
            {[
              { icon: <Globe className="w-8 h-8 text-indigo-500" />, title: 'Full Remote', desc: 'Work from anywhere in the world. We value outcomes over hours at a desk.' },
              { icon: <Shield className="w-8 h-8 text-emerald-500" />, title: 'Ownership', desc: 'Every team member has a voice and the autonomy to drive their own initiatives.' },
              { icon: <Zap className="w-8 h-8 text-purple-500" />, title: 'Fast Scale', desc: 'Experience the thrill of a rapidly scaling platform with new challenges every day.' }
            ].map((v, i) => (
              <Reveal key={i} delay={i * 200}>
                <div className="space-y-6 group cursor-default">
                  <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform group-hover:shadow-lg group-hover:border-border">
                    {v.icon}
                  </div>
                  <h3 className="text-2xl font-black text-foreground">{v.title}</h3>
                  <p className="text-muted-foreground font-medium leading-relaxed">{v.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Jobs */}
      <section className="py-24 md:py-32 bg-gray-50/50">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                <div className="space-y-4 max-w-xl">
              <Reveal>
                <h2 className="text-3xl md:text-5xl font-black text-foreground tracking-tighter uppercase">Open Roles</h2>
              </Reveal>
              <Reveal delay={200}>
                <p className="text-gray-500 text-lg font-medium">Join us in our mission to revolutionize academic management.</p>
              </Reveal>
            </div>
            <Reveal delay={400}>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search positions..." 
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 ring-primary/20 font-medium"
                />
              </div>
            </Reveal>
          </div>

          <div className="space-y-6">
            {[
              { title: 'Senior Full-Stack Engineer', dept: 'Engineering', type: 'Full-time', location: 'Remote (Global)' },
              { title: 'Product Designer', dept: 'Product', type: 'Full-time', location: 'Remote (EMEA)' },
              { title: 'Customer Success Manager', dept: 'Growth', type: 'Full-time', location: 'Remote (US/Americas)' },
            ].map((job, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="group bg-card p-6 md:p-8 rounded-3xl border border-border hover:border-primary/30 transition-all hover:shadow-xl hover:shadow-primary/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3 text-xs font-black text-primary uppercase tracking-widest">
                      <Briefcase className="w-3 h-3" />
                      <span>{job.dept}</span>
                      <span className="text-muted-foreground">•</span>
                      <span>{job.type}</span>
                    </div>
                    <h3 className="text-2xl font-black text-foreground group-hover:text-primary transition-colors">{job.title}</h3>
                    <div className="flex items-center space-x-2 text-muted-foreground text-sm font-medium">
                      <MapPin className="w-4 h-4" />
                      <span>{job.location}</span>
                    </div>
                  </div>
                  <Link href="/contact" className="w-full md:w-auto px-8 py-4 bg-gray-900 text-foreground rounded-xl font-bold hover:bg-primary transition-all text-center">
                    Apply Now
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-20 text-center">
            <Reveal delay={500}>
              <p className="text-muted-foreground font-medium mb-8">Don&apos;t see a role that fits? We&apos;re always looking for talent.</p>
              <Link href="/contact" className="inline-flex items-center text-primary font-black text-sm uppercase tracking-widest hover:translate-x-2 transition-transform">
                Send an Open Application <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
