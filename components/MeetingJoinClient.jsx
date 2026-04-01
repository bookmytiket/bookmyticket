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
    ArrowLeft, 
    ExternalLink, 
    ShieldCheck, 
    Info,
    Loader2,
    CheckCircle2,
    AlertCircle
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
            <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Preparing your meeting room...</p>
                </div>
            </div>
        );
    }

    if (access.status === "not_found" || access.status === "not_virtual") {
        return (
            <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 text-center border border-slate-100">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 mb-2">Event Not Found</h1>
                    <p className="text-slate-500 mb-8">The meeting you're looking for doesn't exist or isn't a virtual event.</p>
                    <Link href="/">
                        <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20">
                            Return Home
                        </button>
                    </Link>
                </div>
            </div>
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
        <div className="min-h-screen bg-[#F8F9FB] text-slate-900 selection:bg-blue-100 pb-20">
            {/* Nav */}
            <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50 px-6 md:px-12 flex items-center justify-between">

                <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
                </Link>
                <div className="flex items-center gap-4">
                    <Link href="/profile" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                        {user?.imageUrl ? <img src={user.imageUrl} className="w-full h-full object-cover" /> : <ShieldCheck className="w-5 h-5 text-slate-400" />}
                    </Link>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-6 pt-16 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left: Video Preview & Primary Action */}
                <div className="lg:col-span-7 space-y-4">
                    <div className="relative aspect-video bg-slate-900 rounded-[1.25rem] overflow-hidden shadow-xl shadow-blue-900/10 border-4 border-white group">
                        {/* Fake Camera Preview / Branding */}
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950 flex flex-col items-center justify-center text-center p-6">
                            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-3 backdrop-blur-xl border border-white/20 group-hover:scale-110 transition-transform duration-500">
                                <Video className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-white text-xl font-black mb-1 leading-tight">Ready to join?</h2>
                            <p className="text-slate-400 font-medium text-xs max-w-sm">Please check your audio and video settings.</p>
                        </div>



                        {/* Status Overlay */}
                        <div className="absolute top-6 left-6">
                            {meetingStatus === "live" ? (
                                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/30 animate-pulse">
                                    <div className="w-2 h-2 bg-white rounded-full" />
                                    Live Session
                                </div>
                            ) : meetingStatus === "upcoming" ? (
                                <div className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/30">
                                    <Clock className="w-3.5 h-3.5" />
                                    Upcoming
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-full text-xs font-black uppercase tracking-widest">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    Expired
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-100">
                        {status === "success" && meetingStatus === "live" ? (
                            <div className="space-y-3">
                                <button 
                                    onClick={handleJoin}
                                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-sm transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-600/20 hover:-translate-y-0.5 active:scale-95"
                                >
                                    <Video className="w-4.5 h-4.5" />
                                    Join Now
                                    {type === "external" && <ExternalLink className="w-3 h-3 opacity-70" />}
                                </button>
                                <p className="text-center text-slate-400 text-[10px] font-medium">
                                    Clicking join will open the meeting in a new tab.
                                </p>
                            </div>
                        ) : status === "not_booked" ? (
                            <div className="space-y-3">
                                <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                                    <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />


                                    <div>
                                        <h4 className="font-bold text-amber-900 leading-tight">Registration Required</h4>
                                        <p className="text-amber-700/80 text-sm mt-1">You must book a ticket for this event to access the meeting link.</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleBook}
                                    className="w-full py-5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-900/30 border border-slate-800"
                                >
                                    <CheckCircle2 className="w-6 h-6" />
                                    Book to Join
                                </button>
                            </div>
                        ) : meetingStatus === "expired" ? (
                            <div className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-200">
                                <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-slate-900 italic">This meeting link has expired.</h3>
                                <p className="text-slate-500 mt-2 max-w-xs mx-auto">The event session has ended. Check your dashboard for recorded sessions if available.</p>
                            </div>
                        ) : (
                            <div className="text-center p-8 bg-blue-50/50 rounded-2xl border border-blue-100">
                                <Clock className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-slate-900 leading-tight">Waiting for host to start...</h3>
                                <p className="text-blue-600/70 mt-2 font-medium">The meeting room will open on {eventDetails.date} at {eventDetails.time}.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Event Details Sidebar */}
                <div className="lg:col-span-5 space-y-3">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 text-blue-600 font-black uppercase tracking-tighter text-[9px] mb-2">
                            <Info className="w-3 h-3" />
                            Event Details
                        </div>
                        <h1 className="text-xl font-black text-slate-900 leading-tight tracking-tight mb-3">
                            {eventDetails.title}
                        </h1>

                        <div className="space-y-3">
                            <div className="flex items-start gap-2.5">
                                <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center shrink-0 border border-slate-100">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Date</p>
                                    <p className="text-xs font-bold text-slate-700">{eventDetails.date}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2.5">
                                <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center shrink-0 border border-slate-100">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Time</p>
                                    <p className="text-xs font-bold text-slate-700">{eventDetails.time}</p>
                                </div>
                            </div>
                        </div>

                        {eventDetails.description && (
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">About</h4>
                                <p className="text-slate-600 text-[10px] leading-relaxed line-clamp-3">
                                    {eventDetails.description}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Quick Security Tips */}
                    <div className="bg-blue-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-600/10 relative overflow-hidden">
                        <img src="/logo.png" className="absolute -right-5 -bottom-5 w-24 opacity-10 brightness-0 invert" />
                        <h4 className="flex items-center gap-2 font-black text-sm mb-2">
                            <ShieldCheck className="w-4 h-4" />
                            Secure Session
                        </h4>
                        <ul className="space-y-1.5 opacity-90 text-[9px] font-bold">


                            <li className="flex items-center gap-2.5">
                                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                End-to-end encrypted session.
                            </li>
                            <li className="flex items-center gap-2.5">
                                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                Only verified ticket holders.
                            </li>
                            <li className="flex items-center gap-2.5">
                                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                In-app and external support.
                            </li>
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    );
}
