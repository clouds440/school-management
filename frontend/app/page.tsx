'use client';
// app/page.tsx
import { HeroButtons } from '@/components/HeroButtons';
import Link from 'next/link';
import {
  Twitter,
  Facebook,
  Linkedin,
  Instagram,
  Users,
  MessageSquare,
  Megaphone,
  GraduationCap,
  ShieldCheck,
  LayoutDashboard,
  BookOpen,
  ArrowRight,
  Zap,
  Globe
} from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';
import { Brand } from '@/components/ui/Brand';
import { PLATFORM_NAME } from '@/lib/constants';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-auto bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative pt-10 pb-16 md:pt-20 md:pb-40 overflow-hidden bg-linear-to-br from-primary/10 via-background to-secondary/10"
        style={{
          backgroundImage: `url('/assets/home-banner.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'overlay'
        }}>
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 -left-1/4 w-75 md:w-150 h-75 md:h-150 bg-primary/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 -right-1/4 w-75 md:w-150 h-75 md:h-150 bg-secondary/10 rounded-full blur-3xl animate-pulse animation-delay-2000" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8">
            <Reveal delay={100}>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight text-foreground leading-[1.1] md:leading-tight">
                Empower Your Institution with <Image src={"/assets/eduverse-logo.png"} alt="Eduverse" width={400} height={120} className="mt-6 inline-block h-auto animate-float w-auto" />
              </h1>
            </Reveal>

            <Reveal delay={200}>
              <p className="text-lg md:text-xl text-foreground font-bold max-w-2xl mx-auto leading-relaxed opacity-90">
                A unified, cloud-based ecosystem designed to bridge the gap between
                administration, teachers, and students. Experience seamless school management.
              </p>
            </Reveal>

            <Reveal delay={300}>
              <div className="pt-4 flex flex-col items-center gap-6">
                <HeroButtons />
                <div className="flex flex-wrap justify-center items-center gap-4 text-[10px] md:text-xs text-foreground/80 font-bold tracking-widest">
                  <span className="flex items-center"><ShieldCheck className="w-4 h-4 mr-1 text-emerald-500" /> No Card Required</span>
                  <span className="flex items-center"><Zap className="w-4 h-4 mr-1 text-amber-500" /> 14-Day Free Trial</span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 md:py-20 border-y border-border bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 md:gap-8">
            {[
              { val: '10k+', label: 'Active Students' },
              { val: '500+', label: 'Elite Educators' },
              { val: '100+', label: 'Worldwide Organizations' },
              { val: '99.9%', label: 'Uptime Reliability' }
            ].map((stat, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="space-y-2 text-center group cursor-default">
                  <p className="text-4xl md:text-5xl font-black text-foreground group-hover:text-primary transition-colors">{stat.val}</p>
                  <p className="text-[10px] md:text-xs font-black text-muted-foreground/50 tracking-widest">{stat.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Product Highlight */}
      <section className="py-24 md:py-32 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="flex-1 space-y-10 text-left order-2 lg:order-1">
              <div className="space-y-4">
                <Reveal>
                  <h2 className="text-3xl md:text-5xl font-black text-foreground tracking-tight leading-tight">
                    One Central Intelligence <br className="hidden md:block" />to Manage Everything
                  </h2>
                </Reveal>
                <Reveal delay={200}>
                  <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-medium">
                    Break down silos and unify your school operation. From financial forecasting
                    to student grading, everything is available at your fingertips.
                  </p>
                </Reveal>
              </div>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-2">
                {[
                  'Live Data Syncing',
                  'Instant Smart Alerts',
                  'One-Click Analytics',
                  'Unified Comms'
                ].map((item, i) => (
                  <Reveal key={i} delay={300 + (i * 100)}>
                    <li className="flex items-center text-foreground font-bold text-sm">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-4 shrink-0 shadow-xs border border-primary/5">
                        <Zap className="w-4 h-4 text-primary" />
                      </div>
                      {item}
                    </li>
                  </Reveal>
                ))}
              </ul>

              <Reveal delay={700}>
                <Link href="/docs" className="group inline-flex items-center text-primary font-black text-sm tracking-wider hover:translate-x-2 transition-transform">
                  Read Documentation <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Reveal>
            </div>

            <div className="flex-1 relative order-1 lg:order-2 w-full">
              <Reveal delay={400}>
                <div className="absolute -inset-4 md:-inset-10 bg-primary/5 rounded-[40px] rotate-3 scale-105 blur-2xl" />
                <div className="relative group p-2 md:p-4 bg-muted/50 backdrop-blur-sm rounded-2xl md:rounded-4xl border border-border shadow-2xl hover:shadow-primary/20 transition-all duration-500 overflow-hidden">
                  <div className="aspect-video relative rounded-lg md:rounded-xl overflow-hidden bg-muted">
                    <Image
                      src="/assets/dashboard-preview.png"
                      alt="EduVerse Modern Dashboard Dashboard"
                      fill
                      className="transform transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Features Grid */}
      <section id="features" className="py-24 md:py-32 bg-muted/20 relative">
        <div className="absolute top-0 left-0 right-0 h-32 bg-linear-to-b from-background to-transparent" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <Reveal>
              <h2 className="text-3xl md:text-5xl font-black text-foreground tracking-tighter">Unified Modules</h2>
            </Reveal>
            <Reveal delay={200}>
              <p className="text-muted-foreground text-lg font-medium leading-relaxed">
                Everything you need to automate your institution, scaling from
                small academies to massive university complexes.
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <FeatureCard
              icon={<MessageSquare className="w-6 h-6 text-blue-600" />}
              title="Global Chat"
              description="Real-time localized and global messaging channels for seamless student-teacher interaction."
              color="bg-blue-500/10"
              index={0}
            />
            <FeatureCard
              icon={<Megaphone className="w-6 h-6 text-purple-600" />}
              title="Smart Notices"
              description="Automated broadcasting system with priority levels and read-receipt tracking for admins."
              color="bg-purple-500/10"
              index={1}
            />
            <FeatureCard
              icon={<BookOpen className="w-6 h-6 text-indigo-600" />}
              title="Assessments"
              description="Professional grading engine with support for multimedia submissions and peer feedback loops."
              color="bg-indigo-500/10"
              index={2}
            />
            <FeatureCard
              icon={<Users className="w-6 h-6 text-pink-600" />}
              title="Permissions"
              description="High-security access controls for administrators, managers, educators, and guard-controlled students."
              color="bg-pink-500/10"
              index={3}
            />
            <FeatureCard
              icon={<Globe className="w-6 h-6 text-orange-600" />}
              title="Scalability"
              description="Robust multi-tenant architecture designed to handle thousands of concurrent organizations."
              color="bg-orange-500/10"
              index={4}
            />
            <FeatureCard
              icon={<LayoutDashboard className="w-6 h-6 text-green-600" />}
              title="Analytics"
              description="Deep-dive reporting with exportable data visualizations for financial and academic metrics."
              color="bg-green-500/10"
              index={5}
            />
          </div>
        </div>
      </section>

      {/* Value Prop */}
      <section className="py-24 md:py-40 bg-background">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8">
            {[
              { icon: <ShieldCheck className="w-10 h-10 text-foreground" />, title: 'Enterprise Security', desc: 'Financial-level encryption with daily redundant backups and SOC-2 compliance standards.' },
              { icon: <Zap className="w-10 h-10 text-foreground" />, title: 'Ultra Low Latency', desc: 'Edge-optimized delivery ensuring real-time features work anywhere in the world, instantly.' },
              { icon: <GraduationCap className="w-10 h-10 text-foreground" />, title: 'Human-First UX', desc: 'Minimal learning curve with an interface designed after studying thousands of school workflows.' }
            ].map((item, i) => (
              <Reveal key={i} delay={i * 200}>
                <div className="space-y-6 text-center md:text-left">
                  <div className="w-20 h-20 mx-auto md:ml-0 bg-muted rounded-3xl flex items-center justify-center border border-border shadow-sm">
                    {item.icon}
                  </div>
                  <h3 className="text-2xl font-black text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Ultimate CTA */}
      <section className="py-24 md:py-32 bg-card relative overflow-hidden border-y border-border">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-0 left-0 w-125 h-125 bg-primary/40 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="container mx-auto px-6 text-center max-w-4xl relative z-10 space-y-10">
          <Reveal>
            <h2 className="text-4xl md:text-6xl font-black text-foreground leading-tight tracking-tighter">Ready to Build the Future <br className="hidden md:block" />of Your Institution?</h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="text-xl text-muted-foreground font-medium leading-relaxed">
              Start modernizing your administrative workflow today.
              Join 100+ schools and universities scaling with {PLATFORM_NAME}.
            </p>
          </Reveal>
          <Reveal delay={400}>
            <div className="flex flex-col sm:flex-row gap-5 justify-center pt-6">
              <Link
                href="/register"
                className="px-12 py-5 bg-primary text-foreground rounded-xl font-black text-lg hover:bg-primary-hover shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95"
              >
                Launch Now
              </Link>
              <Link
                href="/login"
                className="px-12 py-5 bg-muted/60 text-foreground backdrop-blur-md rounded-xl font-black text-lg hover:bg-muted border border-border transition-all"
              >
                Access Account
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border">
        <div className="container mx-auto px-6 py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="space-y-6">
              <Brand size="lg" />
              <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                The most comprehensive school management system designed for the modern era.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-sm font-bold text-foreground tracking-wider mb-6">Product</h4>
              <ul className="space-y-4">
                <li><Link href="/docs" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">Documentation</Link></li>
                <li><Link href="/pricing" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">Pricing</Link></li>
                <li><Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-foreground tracking-wider mb-6">Company</h4>
              <ul className="space-y-4">
                <li><Link href="/about" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">About Us</Link></li>
                <li><Link href="/blog" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">Blog</Link></li>
                <li><Link href="/careers" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">Careers</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-foreground tracking-wider mb-6">Legal</h4>
              <ul className="space-y-4">
                <li><Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-16 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm mb-4 md:mb-0">© {new Date().getFullYear()} {PLATFORM_NAME}. All rights reserved.</p>
            <div className="flex space-x-4">
              <SocialButton href="#" icon={<Twitter className="w-4 h-4" />} label="Twitter" />
              <SocialButton href="#" icon={<Facebook className="w-4 h-4" />} label="Facebook" />
              <SocialButton href="#" icon={<Linkedin className="w-4 h-4" />} label="LinkedIn" />
              <SocialButton href="#" icon={<Instagram className="w-4 h-4" />} label="Instagram" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, color, index }: { icon: React.ReactNode, title: string, description: string, color: string, index: number }) {
  return (
    <Reveal delay={index * 100}>
      <div className="group p-8 rounded-2xl border border-border bg-card hover:border-primary/20 hover:shadow-xl transition-all duration-300 h-full">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </Reveal>
  );
}

function SocialButton({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/20 hover:bg-primary/5 hover:-translate-y-1 transition-all duration-300"
    >
      {icon}
    </Link>
  );
}
