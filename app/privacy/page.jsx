"use client";
import React from 'react';
import { Shield, Lock, Eye, FileText, ChevronRight, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
    const SECTIONS = [
        {
            title: "Information We Collect",
            content: "We collect information you provide directly to us when you create an account, book a ticket, or contact our support team. This may include your name, email address, phone number, and payment information.",
            bullets: [
                "Personal identification information (Name, Email, Phone)",
                "Transactional data (Booking history, Payment records)",
                "Device and usage information (IP address, Browser type)",
                "Location data for event recommendations"
            ]
        },
        {
            title: "How We Use Your Information",
            content: "We use the information we collect to provide, maintain, and improve our services. This includes processing your bookings, sending you updates about your events, and personalizing your discovery experience.",
            bullets: [
                "To process and confirm your event registrations",
                "To send technical notices, updates, and security alerts",
                "To respond to your comments and questions",
                "To monitor and analyze trends and usage"
            ]
        },
        {
            title: "Data Protection & Security",
            content: "We take the security of your data seriously. We use industry-standard encryption and security protocols to protect your information from unauthorized access, disclosure, or destruction.",
            bullets: [
                "SSL encryption for all data transmissions",
                "Secure payment gateway integrations",
                "Regular security audits and updates",
                "Strict access controls for internal data"
            ]
        },
        {
            title: "Your Rights & Choices",
            content: "You have the right to access, update, or delete the personal information we hold about you. You can manage your account settings directly through the platform or contact our support team for assistance.",
            bullets: [
                "Right to access your personal data",
                "Right to correct inaccurate information",
                "Right to request data deletion",
                "Right to opt-out of marketing communications"
            ]
        }
    ];

    return (
        <main className="min-h-screen bg-[#fafbfc]">
            {/* ConditionalNavbar handles the Navbar display logic */}
            
            {/* Header */}
            <section className="pt-28 pb-12 px-6 bg-gradient-to-r from-[#f84464] to-[#c026d3] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/10 rounded-full blur-[120px] -mr-64 -mt-64"></div>
                
                <div className="max-w-[1240px] mx-auto text-center relative z-10 text-slate-950">
                    <Link href="/" className="inline-flex items-center gap-2 text-slate-900 text-[10px] font-bold uppercase tracking-widest mb-6 hover:text-black transition-colors">
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
                    </Link>
                    <div className="w-16 h-16 bg-black/10 backdrop-blur-md border border-black/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Shield className="text-slate-950 w-8 h-8" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-950 mb-4 uppercase tracking-tighter">Privacy Policy</h1>
                    <p className="text-sm md:text-base text-slate-900 max-w-[600px] mx-auto font-medium leading-relaxed">
                        <span className="font-bold text-slate-950">Last Updated: April 29, 2026.</span> <br />
                        Your privacy is our top priority. Learn how we handle and protect your personal information at BookMyTicket.
                    </p>
                </div>
            </section>

            <section className="py-20 px-6 max-w-[900px] mx-auto">
                <div className="space-y-12">
                    {SECTIONS.map((section, idx) => (
                        <div key={idx} className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-8 md:p-12">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 font-black">
                                        0{idx + 1}
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">{section.title}</h2>
                                </div>
                                <p className="text-lg text-slate-600 leading-relaxed mb-8">
                                    {section.content}
                                </p>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {section.bullets.map((bullet, bIdx) => (
                                        <li key={bIdx} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <CheckCircle className="w-5 h-5 text-pink-500 flex-shrink-0" />
                                            <span className="text-sm font-bold text-slate-700 uppercase tracking-tight">{bullet}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}

                    <div className="p-12 bg-pink-50 rounded-[40px] border border-pink-100 text-center">
                        <h3 className="text-2xl font-bold text-pink-600 mb-4 uppercase tracking-tight">Need more clarity?</h3>
                        <p className="text-slate-600 font-medium mb-8">
                            If you have any questions about our privacy practices or your personal data, please don't hesitate to contact us.
                        </p>
                        <Link href="/contact" className="inline-flex items-center gap-3 px-8 py-4 bg-pink-500 text-white rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-lg shadow-pink-500/20">
                            Contact Privacy Team <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
