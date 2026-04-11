// app/docs/page.tsx
'use client';

import { Button } from '@/components/ui/Button';
import {
  ChevronDown,
  MessageCircle,
  Shield,
  Settings,
  Users,
  CheckCircle2,
  GraduationCap,
  Info,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { PLATFORM_NAME } from '@/lib/constants';

export default function DocsPage() {
  return (
    <div className="space-y-24 animate-fade-in-up pb-32 w-full">
      {/* Intro */}
      <section id="intro" className="scroll-mt-24 space-y-8">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-6xl font-extrabold text-foreground tracking-tight leading-tight">
            {PLATFORM_NAME} <span className="text-primary">Documentation</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl">
            Welcome to the official {PLATFORM_NAME} documentation. This guide provides everything you need to know about
            configuring, managing, and scaling your educational institution on our platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <QuickLink
            icon={<Shield className="w-5 h-5 text-emerald-600" />}
            title="Safety & Security"
            description="Learn how we protect student data and enforce role-based access control."
            href="#roles"
          />
          <QuickLink
            icon={<Settings className="w-5 h-5 text-indigo-600" />}
            title="Platform Settings"
            description="Configure global institution settings, branding, and billing."
            href="#branding"
          />
        </div>
      </section>

      {/* Account Setup */}
      <section id="setup" className="scroll-mt-24 space-y-8">
        <div className="flex items-center gap-4 border-b border-border pb-6">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-foreground">Account Setup</h2>
        </div>
        <div className="prose prose-slate max-w-none space-y-6">
          <p className="text-muted-foreground text-lg leading-relaxed">
            Every journey on {PLATFORM_NAME} starts with a Platform Admin account. From this central hub, you can launch
            multiple school branches, manage global staff, and oversee institution-wide analytics.
          </p>
          <div className="bg-card border-l-4 border-primary p-8 rounded-r-2xl space-y-4">
            <h4 className="font-bold text-foreground text-lg flex items-center">
              <Info className="w-5 h-5 mr-3 text-primary" />
              Multi-Tenant Architecture
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              Our platform uses a high-performance multi-tenant architecture. This means each organization you create
              is logically isolated with its own dedicated data space, while sharing the robust global infrastructure
              of {PLATFORM_NAME}.
            </p>
          </div>
        </div>
      </section>

      <section id="overview" className="scroll-mt-24 space-y-8">
        <h3 className="text-2xl font-bold text-foreground">Dashboard Overview</h3>
        <p className="text-muted-foreground leading-relaxed">
          The dashboard is divided into several key zones designed for maximum efficiency:
        </p>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0">
          <li className="p-4 bg-card border border-border rounded-xl shadow-sm">
            <strong className="text-primary block mb-1">Global Sidebar</strong>
            Fast access to Mail, Chat, and User Management.
          </li>
          <li className="p-4 bg-card border border-border rounded-xl shadow-sm">
            <strong className="text-primary block mb-1">Contextual Header</strong>
            Breadcrumbs and quick actions tailored to your current view.
          </li>
          <li className="p-4 bg-card border border-border rounded-xl shadow-sm">
            <strong className="text-primary block mb-1">Analytics Hub</strong>
            Real-time data visualization of school performance.
          </li>
          <li className="p-4 bg-card border border-border rounded-xl shadow-sm">
            <strong className="text-primary block mb-1">Notification Center</strong>
            Stay updated with alerts from across all modules.
          </li>
        </ul>
      </section>

      {/* Organization */}
      <section id="org-creation" className="scroll-mt-24 space-y-8">
        <div className="flex items-center gap-4 border-b border-border pb-6">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
            <Settings className="w-6 h-6 text-indigo-600" />
          </div>
          <h2 className="text-3xl font-bold text-foreground">Organization Management</h2>
        </div>
        <div className="space-y-6">
          <p className="text-muted-foreground leading-relaxed">
            As a Platform Admin, you can create new institutions (Organizations) by defining their name,
            unique URL slug, and primary administrative contact.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-card border border-border rounded-2xl shadow-sm">
              <h4 className="font-bold text-foreground mb-2">1. Identity</h4>
              <p className="text-xs text-muted-foreground">Define name, logo, and institution type.</p>
            </div>
            <div className="p-6 bg-card border border-border rounded-2xl shadow-sm">
              <h4 className="font-bold text-foreground mb-2">2. Network</h4>
              <p className="text-xs text-muted-foreground">Configure custom domains and URL slugs.</p>
            </div>
            <div className="p-6 bg-card border border-border rounded-2xl shadow-sm">
              <h4 className="font-bold text-foreground mb-2">3. Admin</h4>
              <p className="text-xs text-muted-foreground">Assign the first master manager to the org.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Role Management */}
      <section id="roles" className="scroll-mt-24 space-y-8">
        <div className="flex items-center gap-4 border-b border-border pb-6">
          <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <h2 className="text-3xl font-bold text-foreground">User Roles & Permissions</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
          <RoleItem
            title="Super Admin"
            role="Platform-wide access to all data, payments, and global system settings."
          />
          <RoleItem
            title="Org Admin"
            role="Full control over their specific institution, branding, and staffing."
          />
          <RoleItem
            title="Teacher"
            role="Manage assigned classes, assessments, and grade student performance."
          />
          <RoleItem
            title="Student"
            role="Participate in courses, submit assessments, and engage in school chat."
          />
        </div>
      </section>

      <section id="branding" className="scroll-mt-24 space-y-6">
        <h3 className="text-2xl font-bold text-foreground">Branding & White-labeling</h3>
        <p className="text-muted-foreground leading-relaxed">
          Make the platform yours. Organization Admins can customize the interface to match their institution&apos;s
          visual identity. Upload high-resolution logos, set CSS color tokens for primary and secondary accents,
          and even customize the login background for a premium user experience.
        </p>
      </section>

      {/* Communication */}
      <section id="chat" className="scroll-mt-24 space-y-8">
        <div className="flex items-center gap-4 border-b border-border pb-6">
          <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-pink-600" />
          </div>
          <h2 className="text-3xl font-bold text-foreground">Communication Suite</h2>
        </div>
        <div className="space-y-6">
          <h4 className="text-xl font-bold text-foreground">Real-time Messaging (Chat)</h4>
          <p className="text-muted-foreground leading-relaxed">
            Our chat system is powered by Socket.io, providing instantaneous communication across your entire school.
            Teachers can create group chats for classes, while staff can maintain private channels for administrative
            coordination. Features include markdown support, file attachments, and read receipts.
          </p>
        </div>
      </section>

      <section id="announcements" className="scroll-mt-24 space-y-6">
        <h4 className="text-xl font-bold text-foreground">School Announcements</h4>
        <p className="text-muted-foreground leading-relaxed">
          Broadcast important updates to targeted audiences. Announcements can be pinned to the dashboard top-shelf
          and sorted by priority. Platform Admins can send global notices, while Org Admins can target specific
          branches or user roles.
        </p>
      </section>

      {/* Academic */}
      <section id="assessments" className="scroll-mt-24 space-y-8">
        <div className="flex items-center gap-4 border-b border-border pb-6">
          <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-sky-600" />
          </div>
          <h2 className="text-3xl font-bold text-foreground">Academic Engine</h2>
        </div>
        <div className="space-y-6">
          <h4 className="text-xl font-bold text-foreground">Assessments & Quizzes</h4>
          <p className="text-muted-foreground leading-relaxed">
            Create robust evaluations using our Assessment Builder. Supports multiple question types, time limits,
            and auto-grading for objective answers. Teachers can provide detailed qualitative feedback using
            markdown and attachments.
          </p>
        </div>
      </section>

      <section id="grading" className="scroll-mt-24 space-y-6">
        <h4 className="text-xl font-bold text-foreground">Grading & Progress Tracking</h4>
        <p className="text-muted-foreground leading-relaxed">
          Monitor student performance with our advanced gradebook. Automated calculations for weighted grades
          ensure accuracy, while visual progress charts help identify students who may need additional support.
        </p>
      </section>

      <section id="timetables" className="scroll-mt-24 space-y-6">
        <h4 className="text-xl font-bold text-foreground">Academic Timetables</h4>
        <p className="text-muted-foreground leading-relaxed">
          The Timetable module allows administrators to map out the entire academic week. Conflict-detection
          algorithms ensure that teachers and rooms are never double-booked, while students receive instant
          notifications if a class schedule changes.
        </p>
      </section>

      {/* User Portals */}
      <section id="teachers" className="scroll-mt-24 space-y-8">
        <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
            <Users className="w-6 h-6 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-bold text-foreground">Teacher Portal</h2>
        </div>
        <p className="text-gray-600 leading-relaxed">
          Teachers have a dedicated environment for classroom management. View schedules, manage attendance,
          and interact with students without the administrative complexity of the full platform dashboard.
        </p>
      </section>

      <section id="students" className="scroll-mt-24 space-y-8">
        <h3 className="text-2xl font-bold text-foreground">Student Portal</h3>
        <p className="text-muted-foreground leading-relaxed">
          A streamlined, focus-oriented interface for students. Easily track assignments, view study materials,
          and join class discussions. The mobile-responsive design ensures students can stay connected on any device.
        </p>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24 space-y-8">
        <div className="text-center md:text-left space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Frequently Asked Questions</h2>
          <p className="text-muted-foreground text-lg">Common questions about using the {PLATFORM_NAME} platform.</p>
        </div>

        <div className="space-y-4">
          <Accordion
            title="How do I create a new assessment?"
            content="Navigate to the Academic module, click 'Assessments', then 'Create New'. Choose between Assignment or Quiz mode and follow the wizard to add questions."
          />
          <Accordion
            title="Can I use custom domains?"
            content="Yes. Platform Admins can configure CNAME records to point your custom URL to our servers, providing a seamless white-label experience."
          />
          <Accordion
            title="Is student data encrypted?"
            content="We use AES-256 encryption for data at rest and TLS 1.3 for data in transit, ensuring maximum security for your institution's sensitive information."
          />
        </div>
      </section>

      {/* Troubleshooting */}
      <section id="troubleshoot" className="scroll-mt-24 space-y-8">
        <h3 className="text-2xl font-bold text-foreground">Troubleshooting</h3>
        <p className="text-muted-foreground leading-relaxed">
          If you encounter issues with real-time features like chat, ensure that your network allows WebSocket
          connections (WSS). Clear your browser cache and refresh if you experience styling inconsistencies after
          a platform update.
        </p>
      </section>

      {/* Footer Support */}
      <section className="pt-20 border-t border-border flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="text-center md:text-left space-y-2">
          <h3 className="text-xl font-bold text-foreground">Need direct assistance?</h3>
          <p className="text-muted-foreground">Our support engineers are ready to help you optimize your school.</p>
        </div>
        <div className="flex gap-4">
          <Link href="/contact">
            <Button variant="primary">Submit a Ticket</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

function QuickLink({ icon, title, description, href }: { icon: React.ReactNode, title: string, description: string, href: string }) {
  return (
    <a
      href={href}
      className="group p-6 rounded-xl border border-border bg-card hover:border-primary/20 hover:shadow-lg transition-all duration-300"
    >
      <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm border border-primary/5">
        {icon}
      </div>
      <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2">{description}</p>
    </a>
  );
}

function RoleItem({ title, role }: { title: string, role: string }) {
  return (
    <div className="p-5 bg-card rounded-xl space-y-2 border border-border">
      <h4 className="font-bold text-foreground">{title}</h4>
      <p className="text-sm text-muted-foreground leading-relaxed">{role}</p>
    </div>
  );
}

function Accordion({ title, content }: { title: string, content: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm transition-all hover:border-primary/20">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left font-bold text-foreground hover:text-primary transition-colors focus:outline-none"
      >
        <span>{title}</span>
        <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : 'text-muted-foreground'}`} />
      </button>
      <div
        className={`px-5 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <p className="text-muted-foreground text-sm leading-relaxed border-t border-border pt-4">
          {content}
        </p>
      </div>
    </div>
  );
}
