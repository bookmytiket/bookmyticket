"use client";

import React, { useMemo } from 'react';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from './AuthContext';
import { useRouter } from 'next/navigation';
import { 
    Video, 
    Calendar, 
    Clock, 
    Lock, 
    ExternalLink, 
    ShieldCheck, 
    Info,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Ticket
} from 'lucide-react';
import Link from 'next/link';

export default function MeetingJoinClient({ id }) {
    const { user } = useAuth();
    const router = useRouter();
    const userId = user?.identifier || user?.email;

    const access = useQuery(api.events.getMeetingAccess, { 
        eventId: id, 
        userId: userId || undefined 
    });

    if (access === undefined) {
        return (
            <main className="min-h-screen w-full relative overflow-hidden bg-[#0a0f1e] flex items-center justify-center font-sans">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-blue-600/15 rounded-full blur-[140px] animate-pulse" />
                    <div className="absolute bottom-[-15%] right-[-5%] w-[55%] h-[55%] bg-indigo-600/15 rounded-full blur-[160px]" />
                </div>
                <div className="relative z-10 bg-white/[0.03] backdrop-blur-3xl p-16 rounded-[3rem] border border-white/10 shadow-2xl flex flex-col items-center">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-6" />
                    <p className="text-white font-black uppercase tracking-[0.3em] text-[10px] opacity-60">Syncing meeting room</p>
                </div>
            </main>
        );
    }

    if (access.status === "not_found" || access.status === "not_virtual") {
        return (
            <main className="min-h-screen w-full relative overflow-hidden bg-[#0a0f1e] flex items-center justify-center font-sans">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-red-600/10 rounded-full blur-[140px]" />
                    <div className="absolute bottom-[-15%] right-[-5%] w-[55%] h-[55%] bg-slate-600/10 rounded-full blur-[160px]" />
                </div>
                <div className="relative z-10 w-full max-w-lg px-6">
                    <div className="bg-white/[0.98] backdrop-blur-3xl rounded-[3rem] shadow-2xl border border-white/40 overflow-hidden p-12 text-center">
                        <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-red-500/10">
                            <AlertCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Event Not Found</h1>
                        <p className="text-slate-400 mb-10 font-bold text-xs uppercase tracking-widest leading-relaxed">The requested session key is invalid or not associated with a virtual event.</p>
                        <Link href="/meeting/join">
                            <button className="w-full py-6 bg-slate-900 hover:bg-red-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] transition-all shadow-2xl active:scale-95">
                                Return to Portal
                            </button>
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    const { eventDetails, meetingStatus, status, url, type } = access;

    const handleJoin = () => {
        if (status === "success" && url) {
            const target = url.startsWith("http") ? url : `/${url}`;
            window.open(target, '_blank', 'noopener,noreferrer');
        }
    };

    const handleBook = () => {
        router.push(`/events/detail?id=${id}`);
    };

    return (
        <main className="min-h-screen w-full relative overflow-hidden bg-[#0a0f1e] flex items-center justify-center font-sans selection:bg-blue-500/30">
            {/* Premium Immersive Background (Consistent with Portal) */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-blue-600/15 rounded-full blur-[140px] animate-pulse" />
                <div className="absolute bottom-[-15%] right-[-5%] w-[55%] h-[55%] bg-indigo-600/15 rounded-full blur-[160px]" />
                <div className="absolute top-[15%] right-[15%] w-[35%] h-[35%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '10s' }} />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] contrast-125 brightness-100" />
            </div>

            {/* Main Content Container */}
            <div className="relative z-10 w-full max-w-6xl px-6 py-6 pointer-events-none">
                <div className="pointer-events-auto bg-white/[0.98] backdrop-blur-3xl rounded-[3rem] shadow-[0_32px_80px_-20px_rgba(0,0,0,0.6)] border border-white/40 overflow-hidden transform transition-all duration-1000 ease-in-out flex flex-col max-h-[90vh]">
                    
                    {/* Header: Event Identity */}
                    <div className="px-10 py-6 border-b border-slate-100/60 bg-slate-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Video size={22} className="text-white" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight truncate max-w-xl">
                                    {eventDetails.title}
                                </h1>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <ShieldCheck size={12} className="text-blue-500" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Encrypted Session</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="hidden md:flex items-center gap-4">
                             {meetingStatus === "live" ? (
                                <div className="flex items-center gap-2.5 px-4 py-2 bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 animate-pulse">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                    Live Session
                                </div>
                            ) : (
                                <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">
                                    <Clock size={12} className="text-slate-400" />
                                    {meetingStatus.toUpperCase()}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Interaction Split */}
                    <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-1 lg:grid-cols-12 gap-0">
                        {/* LEFT: Video Preview & Primary Action */}
                        <div className="lg:col-span-12 xl:col-span-7 p-10 border-r border-slate-100/60 flex flex-col justify-center bg-white/40">
                            <div className="relative w-full aspect-video bg-[#0a0f1e] rounded-[2rem] overflow-hidden shadow-2xl border-[6px] border-white ring-1 ring-slate-100/50 group mx-auto">
                                {/* Simulated Preview */}
                                <div className="absolute inset-0 bg-gradient-to-br from-[#1a233a] to-[#0a0f1e] flex flex-col items-center justify-center text-center p-8">
                                    <div className="w-16 h-16 bg-white/[0.03] rounded-full flex items-center justify-center mb-6 backdrop-blur-2xl border border-white/[0.08] group-hover:scale-110 transition-transform duration-1000">
                                        <Video className="w-8 h-8 text-white/80" />
                                    </div>
                                    <h2 className="text-white text-2xl font-black mb-2 tracking-tight uppercase antialiased">Check your settings</h2>
                                    <p className="text-slate-500 font-bold text-[11px] tracking-[0.2em] uppercase">Ensure mic and camera are ready</p>
                                </div>

                                {/* Security Badges Overlay */}
                                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center bg-black/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Camera Ready</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">HD Link Active</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 max-w-2xl mx-auto w-full">
                                {status === "success" && meetingStatus === "live" ? (
                                    <div className="space-y-6">
                                        <button 
                                            onClick={handleJoin}
                                            className="w-full py-6 bg-slate-900 hover:bg-blue-600 text-white rounded-[2rem] font-black text-sm tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-4 shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-1 active:scale-95 group"
                                        >
                                            <Video className="w-6 h-6" />
                                            Enter Meeting Room
                                            {type === "external" && <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />}
                                        </button>
                                        <div className="flex items-center justify-center gap-3 opacity-40">
                                            <div className="h-[1px] w-8 bg-slate-900" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.15em]">Verified Entry Pass Active</p>
                                            <div className="h-[1px] w-8 bg-slate-900" />
                                        </div>
                                    </div>
                                ) : status === "not_booked" ? (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4 p-5 bg-amber-50 rounded-[1.5rem] border border-amber-100/50">
                                            <Lock className="w-6 h-6 text-amber-600 shrink-0" />
                                            <div>
                                                <h4 className="font-black text-amber-900 uppercase tracking-widest text-[11px] mb-1">Pass Required</h4>
                                                <p className="text-amber-800/70 text-[10px] font-bold uppercase tracking-tight">Purchase a ticket to access this virtual session.</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={handleBook}
                                            className="w-full py-6 bg-slate-900 hover:bg-amber-600 text-white rounded-[2rem] font-black text-sm tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95"
                                        >
                                            <Ticket className="w-6 h-6" />
                                            Book Ticket Now
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center p-10 bg-slate-50/50 rounded-[2rem] border border-slate-100">
                                        <Clock className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                        <h3 className="text-xl font-black text-slate-400 uppercase tracking-tighter mb-1">Session on Hold</h3>
                                        <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.1em]">Event {meetingStatus === "expired" ? "is no longer available" : "hasn't started yet"}</p>
                                        <Link href="/meeting/join" className="inline-block mt-6 text-[10px] font-black text-blue-600 uppercase tracking-widest border-b-2 border-blue-600 pb-1">
                                            Return to Portal
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT: Event Details & Meta */}
                        <div className="lg:col-span-12 xl:col-span-5 p-10 bg-slate-50/30 flex flex-col">
                            <div className="flex-1 space-y-8">
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 shadow-sm">
                                            <Calendar className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Scheduled Date</p>
                                            <p className="text-lg font-black text-slate-900 tracking-tight">{eventDetails.date}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 shadow-sm">
                                            <Clock className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Start Time</p>
                                            <p className="text-lg font-black text-slate-900 tracking-tight">{eventDetails.time}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-slate-100">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Briefing Agenda</h4>
                                    </div>
                                    <p className="text-[13px] text-slate-600 leading-relaxed font-medium italic decoration-slate-200 decoration-[6px] underline-offset-4 underline">
                                        {eventDetails.description || "No additional briefing details provided for this virtual session."}
                                    </p>
                                </div>
                            </div>

                            {/* Security Footer Card */}
                            <div className="mt-10 bg-gradient-to-br from-[#1a233a] to-[#0a0f1e] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                                <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-600/10 rounded-full blur-[40px]" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                                            <ShieldCheck className="w-6 h-6 text-emerald-400" />
                                        </div>
                                        <h4 className="font-black text-sm uppercase tracking-widest leading-none">Global Secure</h4>
                                    </div>
                                    <ul className="space-y-3.5">
                                        {["End-to-End Encryption", "Verified Participants", "Low Latency Stream"].map((text, i) => (
                                            <li key={i} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.15em] text-white/70">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                {text}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </main>
    );
}

