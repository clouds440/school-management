'use client';

import { Mail, MessageSquare, Phone, MapPin, ExternalLink } from 'lucide-react';
import { BackButton } from '@/components/ui/BackButton';

export default function SupportPage() {
    return (
        <div className="flex flex-1 flex-col p-6 sm:p-10 max-w-5xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <BackButton />
                    <h1 className="text-4xl font-black text-white tracking-tight mt-6 flex items-center gap-3 drop-shadow-xl">
                        <MessageSquare className="w-10 h-10" />
                        Help & Support
                    </h1>
                    <p className="text-indigo-100 font-bold opacity-80 mt-2">
                        WE ARE HERE TO HELP YOU GET BACK ON TRACK
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/50 shadow-xl flex flex-col items-center text-center space-y-4 hover:shadow-2xl transition-all group">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <Mail className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900">Email Support</h3>
                    <p className="text-gray-500 font-medium h-12">Submit a ticket via email for detailed inquiries</p>
                    <a href="mailto:support@edumanage.com" className="text-indigo-600 font-bold hover:underline flex items-center gap-1">
                        support@edumanage.com
                        <ExternalLink className="w-3 h-3" />
                    </a>
                </div>

                <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/50 shadow-xl flex flex-col items-center text-center space-y-4 hover:shadow-2xl transition-all group">
                    <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all">
                        <Phone className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900">Direct Line</h3>
                    <p className="text-gray-500 font-medium h-12">Talk to a support representative immediately</p>
                    <p className="text-green-600 font-bold">+1 (800) EDU-HELP</p>
                </div>

                <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/50 shadow-xl flex flex-col items-center text-center space-y-4 hover:shadow-2xl transition-all group">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <MapPin className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900">Visit Us</h3>
                    <p className="text-gray-500 font-medium h-12">Headquarters for in-person consultations</p>
                    <p className="text-blue-600 font-bold">New York, NY 10001</p>
                </div>
            </div>

            <div className="bg-white/90 backdrop-blur-2xl rounded-[3rem] shadow-2xl border border-white/60 p-12 text-center overflow-hidden relative">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                    <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Need Immediate Assistance?</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto font-medium text-lg leading-relaxed">
                        Our technical support team is available 24/7 to help resolve account suspensions or technical issues.
                        Please have your organization ID ready for faster processing.
                    </p>
                    <button className="mt-8 bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95">
                        OPEN LIVE CHAT
                    </button>
                    <p className="mt-6 text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Typical response time: <span className="text-indigo-600">under 5 minutes</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
