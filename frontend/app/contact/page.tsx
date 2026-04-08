// app/contact/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import {
  Send,
  CheckCircle,
  AlertCircle,
  BookOpen,
  ArrowRight,
  MessageSquare,
  ShieldHalf,
} from 'lucide-react';
import Link from 'next/link';
import { BackButton } from '@/components/ui/BackButton';
import { MarkdownEditor } from '@/components/ui/MarkdownEditor';
import { Button } from '@/components/ui/Button';
import { PLATFORM_NAME } from '@/lib/constants';
import { MailCategory, Role } from '@/types';

export default function ContactPage() {
  const { user, token } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (!message.trim()) {
        setError('Message cannot be empty.');
        return;
      }

      await api.mail.createMail({
        subject: subject,
        message: message,
        category: MailCategory.PLATFORM_SUPPORT,
        priority: 'NORMAL',
        targetRole: Role.PLATFORM_ADMIN, // Automatically target Platform Admin Role
      }, token);

      setIsSuccess(true);
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-12 px-4 md:px-8">
      <div className="max-w-4xl w-full mb-8 self-start lg:ml-0 overflow-visible">
        <BackButton showHome={true} label="Back to Previous" />
      </div>
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-5 gap-12">

        {/* Left Side: Info */}
        <div className="lg:col-span-2 space-y-8 animate-fade-in-up">
          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight leading-tight">
              Get in <span className="text-primary">Touch</span>
            </h1>
              <p className="text-muted-foreground leading-relaxed text-lg">
              Have a question about the platform or need technical assistance?
              Our administrative team is here to help.
            </p>
          </div>

          <div className="space-y-6">
            <InfoCard
              icon={<ShieldHalf className="w-5 h-5 text-indigo-600" />}
              title="Identity Verified"
              description="Your message will be tied to your official account for faster resolution."
            />
            <InfoCard
              icon={<MessageSquare className="w-5 h-5 text-purple-600" />}
              title="Direct Message"
              description="This message goes directly to our platform support team."
            />
          </div>

          <div className="pt-8 border-t border-gray-200">
            <Link
              href="/docs"
              className="group flex items-center p-6 bg-card rounded-sm shadow-sm border border-border hover:border-primary/20 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-primary/5 rounded-sm flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">Documentation</h4>
                <p className="text-sm text-muted-foreground mt-1">Self-service guides and FAQs</p>
              </div>
              <ArrowRight className="ml-auto w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="lg:col-span-3">
          <div className="bg-card rounded-sm shadow-xl shadow-gray-200/50 border border-border p-8 md:p-10 relative overflow-hidden">
            {!user ? (
              <div className="text-center py-12 space-y-6">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Login Required</h2>
                <p className="text-muted-foreground">
                  To ensure the security and tracking of your support requests,
                  you must be logged in to contact our team.
                </p>
                <div className="pt-4">
                  <Link
                    href="/login"
                    className="px-8 py-3 bg-primary text-foreground rounded-sm font-bold hover:bg-primary-hover shadow-lg transition-all"
                  >
                    Login to Continue
                  </Link>
                </div>
              </div>
            ) : isSuccess ? (
              <div className="text-center py-12 space-y-6 animate-scale-in">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-3xl font-bold text-foreground">Message Sent!</h2>
                <p className="text-muted-foreground text-lg">
                  Thank you for reaching out. Your mail has been logged and assigned to
                  our administrative team. You will receive a notification when they reply.
                </p>
                <button
                  onClick={() => setIsSuccess(false)}
                  className="text-primary font-bold hover:underline py-2"
                >
                  Send another message
                </button>
                <div className="pt-6">
                  <Link
                    href={user.orgSlug ? `/${user.orgSlug}/mail` : '/admin/organizations'}
                    className="px-8 py-3 bg-gray-900 text-foreground rounded-sm font-bold hover:bg-black shadow-lg transition-all"
                  >
                    Go to Your Mailbox
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in-up" noValidate>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief summary of your inquiry"
                    className="w-full px-5 py-4 bg-card border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider ml-1">Message</label>
                  <MarkdownEditor
                    value={message}
                    onChange={setMessage}
                    placeholder="How can we help you today? Please provide as much detail as possible. Markdown is supported."
                    rows={8}
                    orgData={{
                      userName: user?.name || '',
                      role: user?.role || '',
                      orgName: user?.orgName || PLATFORM_NAME
                    }}
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-sm flex items-center text-sm font-medium animate-shake">
                    <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  icon={Send}
                  variant="primary"
                  loadingText="Sending..."
                  className="w-full text-lg"
                >
                  Send Message
                </Button>
                <p className="text-center text-xs text-muted-foreground font-medium">
                  By submitting this form, you agree to our <a href="/terms" className="text-primary hover:underline">Terms of Service</a> and <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex items-start space-x-4">
      <div className="w-10 h-10 bg-card rounded-sm shadow-sm border border-border flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-foreground">{title}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">{description}</p>
      </div>
    </div>
  );
}
