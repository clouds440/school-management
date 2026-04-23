'use client';
import { Reveal } from '@/components/ui/Reveal';
import { Target, Eye, Heart, Shield, Users } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="flex flex-col bg-background">
      {/* Hero */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-40 bg-theme-bg border-b border-border">
        <div className="container mx-auto px-6 text-center max-w-4xl space-y-6">
          <Reveal>
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4 tracking-wide">
              Our Identity
            </div>
          </Reveal>
          <Reveal delay={200}>
            <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tight">Revolutionizing <span className="text-primary">Institutional Management</span></h1>
          </Reveal>
          <Reveal delay={400}>
            <p className="text-xl text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto">
              We bridge the gap between complex administration and human-first education,
              building tools that empower the next generation of academic excellence.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <Reveal>
              <div className="p-12 rounded-4xl bg-card text-foreground space-y-6 h-full border border-border shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <Target className="w-12 h-12 text-primary" />
                <h2 className="text-3xl font-black">Our Mission</h2>
                <p className="text-muted-foreground text-lg leading-relaxed font-medium">
                  To provide a unified, accessible, and high-performance digital ecosystem for educational institutions worldwide,
                  automating repetitive tasks so educators can focus on what truly matters: teaching.
                </p>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="p-12 rounded-4xl bg-card border border-border space-y-6 h-full shadow-lg relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <Eye className="w-12 h-12 text-primary" />
                <h2 className="text-3xl font-black text-foreground">Our Vision</h2>
                <p className="text-muted-foreground text-lg leading-relaxed font-medium">
                  A future where school administration is seamless and invisible,
                  powered by technologies that foster transparency, accessibility, and excellence
                  across all academic borders.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 md:py-32 bg-theme-bg">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <Reveal>
              <h2 className="text-3xl md:text-5xl font-black text-foreground tracking-tighter">Core Values</h2>
            </Reveal>
            <Reveal delay={200}>
              <p className="text-muted-foreground text-lg font-medium">The principles that guide every feature we build.</p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
            {[
              { icon: <Heart className="w-8 h-8 text-rose-500" />, title: 'Human Centric', desc: 'We build for people, not just for databases. The user experience is our top priority.' },
              { icon: <Shield className="w-8 h-8 text-indigo-500" />, title: 'Radical Security', desc: 'Institutions trust us with sensitive data, and we treat that trust as our highest responsibility.' },
              { icon: <Users className="w-8 h-8 text-emerald-500" />, title: 'Educational Equity', desc: 'Our platform is designed to scale and serve schools regardless of their geographic location or size.' }
            ].map((v, i) => (
              <Reveal key={i} delay={i * 200}>
                <div className="space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center shadow-sm">
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
    </div>
  );
}
