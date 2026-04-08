'use client';
import { Reveal } from '@/components/ui/Reveal';
import { BookOpen, Clock, Tag, Search, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function BlogPage() {
  return (
    <div className="flex flex-col bg-background">
      {/* Hero */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-40 bg-card border-b border-border">
        <div className="container mx-auto px-6 text-center max-w-4xl space-y-6">
          <Reveal>
            <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tight leading-tight">Insightful Articles for <span className="text-primary">Modern Educators</span></h1>
          </Reveal>
          <Reveal delay={200}>
            <p className="text-xl text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto">
              Explore our latest updates, industry trends, and guides to institutional excellence.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Grid */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            <BlogCard
              title="Scaling Multi-Tenant School Architectures in 2026"
              excerpt="Discover the challenges and solutions of managing thousands of isolated school databases securely."
              author="Alex Rivers"
              date="Apr 12, 2026"
              category="Engineering"
              delay={0}
            />
            <BlogCard
              title="Top 5 Trends in AI-Driven Student Assessments"
              excerpt="How automated grading and peer-feedback loops are revolutionizing classroom workflows."
              author="Jamie Chen"
              date="Apr 08, 2026"
              category="Academia"
              delay={200}
            />
            <BlogCard
              title="Building Transparent School-Parent Communication"
              excerpt="A deep-dive into real-time messaging and the psychology of institutional transparency."
              author="Sarah Loft"
              date="Apr 02, 2026"
              category="User Experience"
              delay={400}
            />
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-24 md:py-32 bg-primary/5 border-y border-primary/10">
        <div className="container mx-auto px-6 max-w-3xl text-center space-y-8">
          <Reveal>
            <h2 className="text-3xl font-black text-foreground">Stay Ahead of the Curve</h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="text-muted-foreground font-medium text-lg leading-relaxed">
              Get the latest institutional insights and platform updates delivered straight to your inbox.
            </p>
          </Reveal>
          <Reveal delay={400}>
            <div className="flex flex-col sm:flex-row gap-4 p-2 bg-card rounded-2xl shadow-xl shadow-primary/5 border border-border">
              <input
                type="email"
                placeholder="Enter your work email"
                className="flex-1 px-6 py-4 rounded-xl text-foreground border-none focus:outline-none focus:ring-0 font-medium"
              />
              <button className="px-8 py-4 bg-primary text-white rounded-xl font-black hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all">
                Subscribe
              </button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

function BlogCard({ title, excerpt, author, date, category, delay }: { title: string, excerpt: string, author: string, date: string, category: string, delay: number }) {
  return (
    <Reveal delay={delay}>
      <div className="group cursor-pointer space-y-6 h-full flex flex-col">
        <div className="aspect-video bg-accent rounded-3xl overflow-hidden relative border border-border shadow-sm transition-all duration-500 group-hover:shadow-xl group-hover:scale-[1.02]">
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-black text-primary uppercase tracking-widest border border-border shadow-sm">
            {category}
          </div>
          <div className="w-full h-full bg-linear-to-br from-primary/5 to-secondary/10 flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-primary/20 group-hover:scale-110 transition-transform duration-500" />
          </div>
        </div>
        <div className="space-y-4 flex-1 flex flex-col">
          <div className="flex items-center space-x-4 text-xs font-black text-muted-foreground uppercase tracking-widest">
            <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {date}</span>
            <span className="hidden sm:block text-muted-foreground">•</span>
            <span>By {author}</span>
          </div>
          <h3 className="text-2xl font-black text-foreground leading-tight group-hover:text-primary transition-colors">{title}</h3>
          <p className="text-muted-foreground font-medium leading-relaxed flex-1">{excerpt}</p>
          <div className="pt-2">
            <div className="inline-flex items-center text-primary font-black text-xs uppercase tracking-widest group-hover:translate-x-2 transition-transform">
              Read Entire Article <ArrowRight className="ml-2 w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
