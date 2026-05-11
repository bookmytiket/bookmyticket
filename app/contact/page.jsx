"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Mail, Phone, MapPin, Send, MessageCircle, Clock, CheckCircle2, Shield, Globe, Linkedin, Instagram, Facebook, Twitter, ChevronDown, AlertTriangle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

export default function ContactPage() {
    const [status, setStatus] = useState(null);
    const [step, setStep] = useState("form"); // 'form' or 'otp'
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formValues, setFormValues] = useState({});
    const [queryType, setQueryType] = useState("General Inquiry");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [config, setConfig] = useState({
        header: { title: "Get in Support", description: "Have a general question for us? We're here to help with any inquiries about our services." },
        general_support: { email: "support@bookmyticket.net", phone: "+91 90420 29927" },
        sales_team: { india: "+91 97907 62727", uae: "+971 55 747 2927", singapore: "+60 14-210 7199" },
        address: { line1: "4th Floor, Ramani's West Gate,", line2: "No: 402C, Viswanathapuram,", line3: "Thudiyalur, Coimbatore, Tamil Nadu", pincode: "641034" },
        hours: { mon_fri: "9:30 AM - 6:30 PM IST", sat: "9:30 AM - 1:30 PM IST", sun: "We're offline ( Day Off )" },
        social: { linkedin: "#", instagram: "#", facebook: "#", twitter: "#" }
    });

    useEffect(() => {
        const fetchConfig = async () => {
            const { data } = await supabase.from('contact_settings').select('*').eq('id', 1).single();
            if (data) {
                // Map the flat table structure to the nested object structure the UI expects
                setConfig({
                    header: { title: data.header_title, description: data.header_description },
                    general_support: { email: data.support_email, phone: data.support_phone },
                    sales_team: { india: data.sales_india, uae: data.sales_uae, singapore: data.sales_singapore },
                    address: { line1: data.address_line1, line2: data.address_line2, line3: data.address_line3, pincode: data.address_pincode },
                    hours: { mon_fri: data.hours_mon_fri, sat: data.hours_sat, sun: data.hours_sun },
                    social: { linkedin: data.social_linkedin, instagram: data.social_instagram, facebook: data.social_facebook, twitter: data.social_twitter }
                });
            }
        };
        fetchConfig();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const QUERY_TYPES = [
        "General Inquiry",
        "Sales Inquiry",
        "Technical Support",
        "Partnership",
        "Media & PR",
        "Career Opportunities"
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const formData = new FormData(e.target);
        const data = {
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            company: formData.get('company'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            query_type: queryType,
            message: formData.get('message'),
        };
        setFormValues(data);

        try {
            const res = await fetch("/api/contact/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: data.email, phone: data.phone }),
            });
            const result = await res.json();
            if (result.success) {
                setStep("otp");
            } else {
                setError(result.error || "Failed to send OTP. Please try again.");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (otp.length < 6) return;
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/contact/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formValues.email,
                    phone: formValues.phone,
                    otp,
                    messageData: formValues
                }),
            });
            const result = await res.json();
            if (result.success) {
                setStatus('success');
            } else {
                setError(result.error || "Invalid OTP. Please try again.");
            }
        } catch (err) {
            setError("Verification failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#fafbfc]">
            <Navbar compact={true} />
            
            {/* Header Section */}
            <section className="pt-28 pb-10 px-6">
                <div className="max-w-[1240px] mx-auto text-center">
                    <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tighter leading-tight italic uppercase py-2">
                        {config.header?.title.split(' ').slice(0, -1).join(' ')} <span className="bg-gradient-to-r from-[#f43f5e] to-[#9333ea] bg-clip-text text-transparent px-2">{config.header?.title.split(' ').slice(-1)}</span>
                    </h1>
                    <p className="text-sm text-slate-500 font-medium mt-4 max-w-2xl mx-auto">
                        {config.header?.description}
                    </p>
                </div>
            </section>

            {/* Main Content Grid */}
            <section className="pb-20 px-6">
                <div className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    
                    {/* Left Column - Contact Details */}
                    <div className="lg:col-span-5 space-y-6">
                        
                        {/* General Support */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                                <Shield className="w-6 h-6" />
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 leading-none">General Support</h3>
                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">For general inquiries</p>
                                </div>
                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Email</p>
                                            <p className="text-sm font-black text-slate-900">{config.general_support?.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Phone</p>
                                            <p className="text-sm font-black text-slate-900">{config.general_support?.phone}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sales Team */}
                        <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                                <Globe className="w-20 h-20" />
                            </div>
                            <div className="flex gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-pink-500 flex items-center justify-center text-white shrink-0">
                                    <MessageCircle className="w-6 h-6" />
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-lg font-black leading-none">Sales Team</h3>
                                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Contact our sales representatives</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-pink-500" /> India
                                            </p>
                                            <p className="text-xs font-black">{config.sales_team?.india}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> UAE
                                            </p>
                                            <p className="text-xs font-black">{config.sales_team?.uae}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Singapore
                                            </p>
                                            <p className="text-xs font-black">{config.sales_team?.singapore}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mailing Address */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 leading-none">Mailing Address</h3>
                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Our corporate office</p>
                                </div>
                                <div className="flex gap-3 pt-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 shrink-0" />
                                    <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                                        {config.address?.line1}<br />
                                        {config.address?.line2}<br />
                                        {config.address?.line3}<br />
                                        {config.address?.pincode}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Business Hours */}
                        <div className="bg-orange-50/50 p-6 rounded-3xl border border-orange-100 shadow-sm flex gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white shrink-0">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div className="space-y-4 flex-1">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 leading-none">Business Hours</h3>
                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">When we're available</p>
                                </div>
                                <div className="space-y-3 pt-1">
                                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                                        <span className="text-slate-500">Monday - Friday</span>
                                        <span className="text-slate-900">{config.hours?.mon_fri}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                                        <span className="text-slate-500">Saturday</span>
                                        <span className="text-slate-900">{config.hours?.sat}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                                        <span className="text-slate-500">Sunday</span>
                                        <span className={`text-orange-600 ${config.hours?.sun.toLowerCase().includes('off') ? 'text-orange-600' : 'text-slate-900'}`}>
                                            {config.hours?.sun}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Column - Contact Form */}
                    <div className="lg:col-span-7 bg-white rounded-[40px] border border-slate-100 shadow-xl p-8 md:p-10 relative overflow-hidden">
                        
                        <div className="relative mb-8">
                            <h2 className="text-2xl font-black italic tracking-tighter uppercase text-slate-900">Send us a Message</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Fill out the form below and our team will get back to you within 24 hours.</p>
                        </div>

                        {status === 'success' ? (
                            <div className="py-20 text-center space-y-6 animate-in fade-in zoom-in duration-500">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-500 shadow-lg shadow-green-500/20">
                                    <CheckCircle2 className="w-10 h-10" />
                                </div>
                                <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight italic">Message Sent!</h3>
                                <p className="text-slate-500 font-medium max-w-[300px] mx-auto">
                                    Thank you for reaching out. Our team will get back to you shortly via {formValues.email || formValues.phone}.
                                </p>
                                <button onClick={() => { setStatus(null); setStep("form"); setOtp(""); }} className="text-pink-500 font-black uppercase tracking-widest text-[10px] hover:underline cursor-pointer">Send another message</button>
                            </div>
                        ) : step === 'otp' ? (
                            <div className="py-12 space-y-8 animate-in slide-in-from-right-4 duration-500">
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black italic tracking-tighter uppercase text-slate-900">Verify it's you</h3>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                        We've sent a 6-digit verification code to <br/>
                                        <span className="text-slate-900 font-black">{formValues.email || formValues.phone}</span>
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Shield size={10} className="text-pink-500" /> Enter 6-Digit Code
                                        </label>
                                        <input 
                                            type="text" 
                                            maxLength={6}
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                            placeholder="000000" 
                                            className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-3xl tracking-[0.5em] text-center text-slate-900 focus:outline-none focus:border-pink-500/30 focus:ring-4 focus:ring-pink-500/5 transition-all" 
                                        />
                                    </div>

                                    {error && (
                                        <div className="flex items-center gap-3 p-4 bg-pink-50 border border-pink-100 rounded-2xl text-pink-600 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <AlertTriangle size={18} className="shrink-0" />
                                            <p className="text-[11px] font-black uppercase tracking-widest">{error}</p>
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-4">
                                        <button 
                                            onClick={handleVerifyOtp}
                                            disabled={loading || otp.length < 6}
                                            className={`w-full py-5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs italic shadow-xl shadow-pink-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            {loading ? "Verifying..." : "Verify & Send Message"} <CheckCircle2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => { setStep("form"); setError(""); }}
                                            className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all cursor-pointer"
                                        >
                                            ← Edit Contact Details
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-slate-50 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <Shield size={12} className="text-pink-500" />
                                    Secure Verification Protocol Active
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <MessageCircle size={10} /> First Name *
                                        </label>
                                        <input type="text" name="first_name" required placeholder="John" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/10 transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Last Name *</label>
                                        <input type="text" name="last_name" required placeholder="Doe" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/10 transition-all" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Globe size={10} /> Company *
                                        </label>
                                        <input type="text" name="company" required placeholder="Your company" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/10 transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Mail size={10} /> Email *
                                        </label>
                                        <input type="email" name="email" required placeholder="john@example.com" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/10 transition-all" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Phone size={10} /> Phone *
                                        </label>
                                        <input type="tel" name="phone" required placeholder="+91 12345 67890" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/10 transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Shield size={10} /> Query Type *
                                        </label>
                                        <div className="relative" ref={dropdownRef}>
                                            <button 
                                                type="button"
                                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 text-sm flex items-center justify-between hover:bg-slate-100 transition-all focus:ring-2 focus:ring-pink-500/10"
                                            >
                                                {queryType}
                                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                            </button>

                                            {isDropdownOpen && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                    {QUERY_TYPES.map((type) => (
                                                        <div 
                                                            key={type}
                                                            onClick={() => {
                                                                setQueryType(type);
                                                                setIsDropdownOpen(false);
                                                            }}
                                                            className={`p-4 text-sm font-bold cursor-pointer transition-all ${queryType === type ? 'bg-pink-50 text-pink-600' : 'text-slate-600 hover:bg-slate-50'}`}
                                                        >
                                                            {type}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <MessageCircle size={10} /> Message *
                                    </label>
                                    <textarea name="message" rows={4} required placeholder="Please provide details about your inquiry..." className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/10 transition-all resize-none"></textarea>
                                </div>

                                <div className="flex items-start gap-3 py-2">
                                    <input type="checkbox" required className="mt-1 w-4 h-4 rounded border-slate-300 text-pink-500 focus:ring-pink-500" />
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Communication consent</p>
                                        <p className="text-[9px] font-medium text-slate-400">I agree to be contacted by BookMyTicket regarding my inquiry.</p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-slate-100">
                                    <div className="flex flex-col gap-4 w-full sm:w-auto">
                                        {error && (
                                            <div className="flex items-center gap-2 p-3 bg-pink-50 border border-pink-100 rounded-xl text-pink-600 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                <AlertTriangle size={14} className="shrink-0" />
                                                <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            <Shield size={12} className="text-pink-500" />
                                            Your information is secure and encrypted
                                        </div>
                                    </div>
                                    <button 
                                        type="submit" 
                                        disabled={loading}
                                        className="w-full sm:w-auto px-12 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs italic shadow-xl shadow-pink-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
                                    >
                                        {loading ? "Sending..." : "Send Message"} <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                </div>
            </section>

            {/* Social Media Section */}
            <section className="py-20 border-t border-slate-100 bg-white">
                <div className="max-w-[1240px] mx-auto text-center">
                    <h2 className="text-3xl font-black italic tracking-tighter uppercase text-slate-900 mb-2">Follow BookMyTicket</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-10 max-w-xl mx-auto leading-relaxed">
                        Stay updated with our latest news, offers, and industry insights through our social media channels.
                    </p>
                    <div className="flex justify-center gap-5">
                        <SocialIcon icon={<Linkedin size={20} />} href={config.social?.linkedin} color="bg-[#0077b5]" />
                        <SocialIcon icon={<Instagram size={20} />} href={config.social?.instagram} color="bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]" />
                        <SocialIcon icon={<Facebook size={20} />} href={config.social?.facebook} color="bg-[#1877f2]" />
                        <SocialIcon icon={<Twitter size={20} />} href={config.social?.twitter} color="bg-black" />
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}

function SocialIcon({ icon, href, color }) {
    if (!href || href === "#") return null;
    return (
        <a 
            href={href} 
            target="_blank"
            rel="noopener noreferrer"
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 hover:rotate-6 shadow-lg ${color}`}
        >
            {icon}
        </a>
    );
}
