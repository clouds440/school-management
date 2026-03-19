'use client';

import { Mail, MessageSquare, Phone, MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function SupportPage() {
    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3 drop-shadow-xl">
                        <MessageSquare className="w-10 h-10" />
                        Help & Support
                    </h1>
                    <p className="text-white/80 font-bold opacity-80 mt-2 uppercase tracking-widest text-[10px]">
                        WE ARE HERE TO HELP YOU GET BACK ON TRACK
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card/80 backdrop-blur-xl p-8 rounded-sm border border-white/20 shadow-xl flex flex-col items-center text-center space-y-4 hover:shadow-2xl transition-all group">
                    <div className="w-16 h-16 bg-primary/10 rounded-sm flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-text transition-all">
                        <Mail className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-black text-card-text">Email Support</h3>
                    <p className="text-card-text/60 font-medium h-12">Submit a ticket via email for detailed inquiries</p>
                    <a href="mailto:support@edumanage.com" className="text-primary font-bold hover:underline flex items-center gap-1">
                        support@edumanage.com
                        <ExternalLink className="w-3 h-3" />
                    </a>
                </div>

                <div className="bg-card/80 backdrop-blur-xl p-8 rounded-sm border border-white/20 shadow-xl flex flex-col items-center text-center space-y-4 hover:shadow-2xl transition-all group">
                    <div className="w-16 h-16 bg-secondary/20 rounded-sm flex items-center justify-center text-secondary-text group-hover:bg-secondary group-hover:text-white transition-all">
                        <Phone className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-black text-card-text">Direct Line</h3>
                    <p className="text-card-text/60 font-medium h-12">Talk to a support representative immediately</p>
                    <p className="text-primary font-bold">+1 (800) EDU-HELP</p>
                </div>

                <div className="bg-card/80 backdrop-blur-xl p-8 rounded-sm border border-white/20 shadow-xl flex flex-col items-center text-center space-y-4 hover:shadow-2xl transition-all group">
                    <div className="w-16 h-16 bg-primary/10 rounded-sm flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-text transition-all">
                        <MapPin className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-black text-card-text">Visit Us</h3>
                    <p className="text-card-text/60 font-medium h-12">Headquarters for in-person consultations</p>
                    <p className="text-primary font-bold">New York, NY 10001</p>
                </div>
            </div>

            <div className="bg-card/90 backdrop-blur-2xl rounded-sm shadow-2xl border border-white/20 p-12 text-center overflow-hidden relative">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                    <h2 className="text-3xl font-black text-card-text mb-4 tracking-tight">Need Immediate Assistance?</h2>
                    <p className="text-card-text/60 max-w-2xl mx-auto font-medium text-lg leading-relaxed">
                        Our technical support team is available 24/7 to help resolve account suspensions or technical issues.
                        Please have your organization ID ready for faster processing.
                    </p>
                    <div className="mt-8 flex justify-center">
                        <Button
                            className="px-12 py-6 rounded-sm text-lg font-black"
                        >
                            OPEN LIVE CHAT
                        </Button>
                    </div>
                    <p className="mt-6 text-xs font-bold text-card-text/40 uppercase tracking-widest">
                        Typical response time: <span className="text-primary">under 5 minutes</span>
                    </p>
                </div>
            </div>
        </>
    );
}
