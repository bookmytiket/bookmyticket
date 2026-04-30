"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
    Users, Briefcase, Zap, Globe, ShieldCheck, 
    CheckCircle, ArrowRight, Loader2, Mail, Phone, 
    Building2, MessageSquare, Star
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PartnerRegistrationPage() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        businessName: "",
        category: "Event Organiser",
        details: ""
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase
                .from("partner_requests")
                .insert({
                    first_name: form.firstName,
                    last_name: form.lastName,
                    email: form.email,
                    phone: form.phone,
                    business_name: form.businessName,
                    category: form.category,
                    type: form.category === "Professional Service" ? "professional_service" : "event_organiser",
                    details: form.details,
                    status: "Pending"
                });

            if (error) throw error;
            setSubmitted(true);
            showToast("Request submitted successfully!", "success");
        } catch (err) {
            showToast("Error submitting request: " + err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-[#FAF9F6]">
                <Navbar />
                <div className="pt-40 pb-20 px-4">
                    <div className="max-w-xl mx-auto text-center">
                        <div className="w-24 h-24 bg-green-100 rounded-[32px] flex items-center justify-center mx-auto mb-10 border border-green-200 shadow-xl shadow-green-500/10 text-green-600">
                            <CheckCircle size={48} />
                        </div>
                        <h1 className="text-5xl font-black italic tracking-tighter uppercase text-slate-900 mb-6">Application Received!</h1>
                        <p className="text-slate-500 mb-10 leading-relaxed text-lg font-medium">
                            Thank you for your interest in partnering with BookMyTicket. Our team will review your application and get back to you within 24-48 business hours via email.
                        </p>
                        <button 
                            onClick={() => window.location.href = "/"}
                            className="px-14 py-5 bg-slate-900 text-white font-black uppercase tracking-widest italic rounded-2xl hover:scale-105 transition-all shadow-2xl shadow-slate-900/20"
                        >
                            Return Home
                        </button>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAF9F6] text-slate-900">
            <Navbar />
            
            {/* Hero Section */}
            <div className="relative pt-48 pb-24 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[#f84464]/5 rounded-full blur-[140px]" />
                
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-24 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#f84464]/10 border border-[#f84464]/20 rounded-full mb-8">
                                <Star size={14} className="text-[#f84464] fill-[#f84464]" />
                                <span className="text-[11px] font-black uppercase tracking-widest text-[#f84464]">Partner Program 2026</span>
                            </div>
                            <h1 className="text-7xl lg:text-8xl font-black italic tracking-tighter uppercase leading-[0.85] mb-8 text-slate-900">
                                Scale Your <span className="text-[#f84464]">Events</span> To New Heights
                            </h1>
                            <p className="text-slate-500 text-xl mb-12 leading-relaxed max-w-lg font-medium">
                                Join India's fastest growing event network. Get access to advanced booking tools, real-time analytics, and a massive audience.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <Feature icon={<Zap size={24}/>} title="Instant Payouts" desc="Weekly settlement cycle" />
                                <Feature icon={<Globe size={24}/>} title="Global Reach" desc="Millions of active users" />
                                <Feature icon={<ShieldCheck size={24}/>} title="Safe & Secure" desc="KYC verified partners" />
                                <Feature icon={<Users size={24}/>} title="Support" desc="24/7 dedicated assistance" />
                            </div>
                        </div>

                        {/* Form Card */}
                        <div className="bg-white border border-slate-200 p-10 md:p-16 rounded-[60px] shadow-2xl shadow-slate-200/50">
                            <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-10 text-slate-900">Partner Request</h2>
                            
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">First Name</label>
                                        <input 
                                            required
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 focus:bg-white focus:border-[#f84464] focus:ring-4 focus:ring-[#f84464]/5 outline-none transition-all font-bold text-slate-900"
                                            placeholder="John"
                                            value={form.firstName}
                                            onChange={(e) => setForm({...form, firstName: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Last Name</label>
                                        <input 
                                            required
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 focus:bg-white focus:border-[#f84464] focus:ring-4 focus:ring-[#f84464]/5 outline-none transition-all font-bold text-slate-900"
                                            placeholder="Doe"
                                            value={form.lastName}
                                            onChange={(e) => setForm({...form, lastName: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                                    <div className="relative">
                                        <Mail size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                                        <input 
                                            required
                                            type="email"
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-6 py-5 focus:bg-white focus:border-[#f84464] focus:ring-4 focus:ring-[#f84464]/5 outline-none transition-all font-bold text-slate-900"
                                            placeholder="john@company.com"
                                            value={form.email}
                                            onChange={(e) => setForm({...form, email: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                                    <div className="relative">
                                        <Phone size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                                        <input 
                                            required
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-6 py-5 focus:bg-white focus:border-[#f84464] focus:ring-4 focus:ring-[#f84464]/5 outline-none transition-all font-bold text-slate-900"
                                            placeholder="+91 98765 43210"
                                            value={form.phone}
                                            onChange={(e) => setForm({...form, phone: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Business Name</label>
                                    <div className="relative">
                                        <Building2 size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                                        <input 
                                            required
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-6 py-5 focus:bg-white focus:border-[#f84464] focus:ring-4 focus:ring-[#f84464]/5 outline-none transition-all font-bold text-slate-900"
                                            placeholder="Company or Organisation"
                                            value={form.businessName}
                                            onChange={(e) => setForm({...form, businessName: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Partner Type</label>
                                    <select 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 focus:bg-white focus:border-[#f84464] focus:ring-4 focus:ring-[#f84464]/5 outline-none transition-all font-bold text-slate-900 appearance-none cursor-pointer"
                                        value={form.category}
                                        onChange={(e) => setForm({...form, category: e.target.value})}
                                    >
                                        <option value="Event Organiser">Event Organiser</option>
                                        <option value="Professional Service">Professional Service (Artist/Vendor)</option>
                                        <option value="Venue Partner">Venue Partner (Turf/Pool/Theater)</option>
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Additional Details</label>
                                    <textarea 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 min-h-[120px] focus:bg-white focus:border-[#f84464] focus:ring-4 focus:ring-[#f84464]/5 outline-none transition-all font-bold text-slate-900 resize-none"
                                        placeholder="Briefly describe your events or services..."
                                        value={form.details}
                                        onChange={(e) => setForm({...form, details: e.target.value})}
                                    />
                                </div>

                                <button 
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-6 bg-gradient-to-r from-[#f84464] to-[#c026d3] rounded-3xl text-white font-black uppercase tracking-widest italic text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-[#f84464]/30 flex items-center justify-center gap-4"
                                >
                                    {loading ? <Loader2 size={24} className="animate-spin" /> : <>Send Request <ArrowRight size={20} /></>}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

function Feature({ icon, title, desc }) {
    return (
        <div className="flex gap-5 items-start">
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0 text-[#f84464]">
                {icon}
            </div>
            <div>
                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 mb-1.5">{title}</h4>
                <p className="text-xs text-slate-400 font-semibold leading-tight">{desc}</p>
            </div>
        </div>
    );
}
