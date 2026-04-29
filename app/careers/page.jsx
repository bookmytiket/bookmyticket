"use client";
import React from 'react';
import { Briefcase, MapPin, Clock, ArrowRight, Sparkles, Rocket, Users, Heart } from 'lucide-react';
import Link from 'next/link';
import Footer from '@/components/Footer';

export default function CareersPage() {
    const JOBS = [
        {
            title: "Senior Frontend Engineer",
            department: "Engineering",
            location: "Coimbatore / Remote",
            type: "Full-time",
            description: "Lead the development of our next-generation ticketing interface using React 19 and Next.js."
        },
        {
            title: "Event Operations Manager",
            department: "Operations",
            location: "Chennai",
            type: "Full-time",
            description: "Coordinate with organizers and venues to ensure flawless event execution on the ground."
        },
        {
            title: "Product Designer",
            department: "Design",
            location: "Remote",
            type: "Contract",
            description: "Create premium, glassmorphic UI designs that wow our users across mobile and web."
        }
    ];

    return (
        <main className="min-h-screen bg-[#fafbfc]">
            {/* Hero Section */}
            <section className="relative pt-32 pb-24 px-6 overflow-hidden bg-slate-950">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-[120px] -mr-64 -mt-64"></div>
                
                <div className="max-w-[1240px] mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-pink-400 text-xs font-bold uppercase tracking-widest mb-8">
                        <Sparkles className="w-4 h-4" /> We're Hiring
                    </div>
                    <h1 className="text-4xl md:text-7xl font-black text-white mb-8 leading-[1.1] tracking-tight">
                        Build the Future of <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">Live Experiences</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-400 max-w-[800px] mx-auto leading-relaxed mb-12 font-medium">
                        Join a team of creators, engineers, and event enthusiasts dedicated to making every moment count. At BookMyTicket, we're not just selling tickets; we're building memories.
                    </p>
                    <div className="flex flex-wrap justify-center gap-6">
                        <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                            <Users className="text-pink-500 w-5 h-5" />
                            <span className="text-white font-bold text-sm">50+ Team Members</span>
                        </div>
                        <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                            <Heart className="text-purple-500 w-5 h-5" />
                            <span className="text-white font-bold text-sm">Inclusive Culture</span>
                        </div>
                        <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                            <Rocket className="text-indigo-500 w-5 h-5" />
                            <span className="text-white font-bold text-sm">Fast Growth</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why Join Us */}
            <section className="py-24 px-6 max-w-[1240px] mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { title: "Ownership", desc: "We trust our team. You'll have the autonomy to lead projects and make a real impact from day one.", icon: <Rocket className="w-8 h-8" /> },
                        { title: "Innovation", desc: "Work with the latest tech like React 19, Supabase, and Convex in a high-performance environment.", icon: <Sparkles className="w-8 h-8" /> },
                        { title: "Passion", desc: "We love what we do. Our team is united by a shared passion for entertainment and technology.", icon: <Heart className="w-8 h-8" /> }
                    ].map((val, i) => (
                        <div key={i} className="p-10 rounded-[40px] bg-white border border-slate-100 hover:border-pink-500 transition-all hover:shadow-2xl hover:shadow-pink-500/10 group">
                            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 mb-8 group-hover:bg-pink-500 group-hover:text-white transition-all">
                                {val.icon}
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4 uppercase tracking-tight">{val.title}</h3>
                            <p className="text-slate-500 leading-relaxed font-medium">{val.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Open Positions */}
            <section className="py-24 px-6 max-w-[1000px] mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-6xl font-black text-slate-900 mb-4 uppercase tracking-tighter">Open Positions</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Find your place in our growing family</p>
                </div>

                <div className="space-y-6">
                    {JOBS.map((job, i) => (
                        <div key={i} className="group p-8 md:p-12 bg-white rounded-[40px] border border-slate-100 hover:border-purple-500 transition-all hover:shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-2 h-full bg-purple-500 translate-x-full group-hover:translate-x-0 transition-transform"></div>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-purple-100">
                                            {job.department}
                                        </span>
                                        <span className="flex items-center gap-1 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                            <MapPin className="w-3 h-3" /> {job.location}
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight group-hover:text-purple-600 transition-colors">
                                        {job.title}
                                    </h3>
                                    <p className="text-slate-500 font-medium leading-relaxed max-w-[600px]">
                                        {job.description}
                                    </p>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="hidden md:flex flex-col items-end">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Time</span>
                                        <span className="text-sm font-bold text-slate-900">{job.type}</span>
                                    </div>
                                    <button className="px-8 py-4 bg-slate-900 text-white rounded-full font-black uppercase tracking-widest text-xs group-hover:bg-purple-600 transition-all flex items-center gap-2">
                                        Apply Now <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <p className="text-slate-500 font-medium mb-4">Don't see a role that fits?</p>
                    <a href="mailto:careers@bookmyticket.net" className="text-pink-500 font-black uppercase tracking-widest text-sm border-b-2 border-pink-500/20 hover:border-pink-500 transition-all pb-1">
                        Send us an open application →
                    </a>
                </div>
            </section>

            <Footer />
        </main>
    );
}
