"use client";
import React from "react";
import { MapPin, Calendar, Users2, Trophy, ArrowRight, Zap, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { getEventPath } from "@/app/utils/seo";

export default function TournamentCard({ event }) {
    if (!event) return null;

    const tournament = event.tournament_data || event.tournament_events?.[0] || event.tournament_events || {};
    const teamCount = tournament.metadata?.registeredTeamsCount || 0;
    const isFreeAudience = tournament.audience_free_access !== false;
    const registrationEndDate = event.registration_end_date || tournament.registration_end_at || tournament.registration_end_date;

    return (
        <div
            className="group relative bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] hover:shadow-[0_40px_80px_-20px_rgba(248,68,100,0.15)] transition-all duration-500 hover:-translate-y-2 flex flex-col h-full"
        >
            {/* Image Section */}
            <div className="relative aspect-[4/3] overflow-hidden">
                <img
                    src={event.img || "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80"}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                
                {/* Overlay Badges */}
                <div className="absolute top-6 left-6 flex flex-col gap-2">
                    <div className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-2xl flex items-center gap-2 shadow-xl border border-white/20">
                        <Trophy size={14} className="text-pink-600" />
                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{tournament.sport_type || event.sportType || "Tournament"}</span>
                    </div>
                </div>

                {/* Free Entry Badge */}
                {isFreeAudience && (
                    <div className="absolute bottom-6 left-6 px-4 py-2 bg-emerald-500 text-white rounded-2xl flex items-center gap-2 shadow-xl animate-pulse">
                        <CheckCircle2 size={14} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Audience Free Entry</span>
                    </div>
                )}

                {/* Live Status */}
                <div className="absolute top-6 right-6 px-4 py-2 bg-pink-600 text-white rounded-2xl flex items-center gap-2 shadow-xl">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Registration Open</span>
                </div>

                {/* Registration End Date Badge */}
                {registrationEndDate && (
                    <div className="absolute bottom-6 right-6 px-4 py-2 bg-slate-900/80 backdrop-blur-md text-white rounded-2xl flex items-center gap-2 border border-white/10 shadow-2xl">
                        <Calendar size={12} className="text-pink-400" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Ends: {new Date(registrationEndDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="p-8 flex-1 flex flex-col gap-6">
                <div className="space-y-2">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic leading-none line-clamp-2 min-h-[2.5rem]">
                        {event.title}
                    </h3>
                    <div className="flex items-center gap-4 text-slate-400">
                        <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-pink-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{event.city || event.location || "TBA"}</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                        <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-purple-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{event.date?.split(' ')[0]}</span>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100/50">
                        <div className="flex items-center gap-2 text-pink-600 mb-1">
                            <Users2 size={14} />
                            <span className="text-[8px] font-black uppercase tracking-widest">Registered</span>
                        </div>
                        <p className="text-sm font-black text-slate-900">{teamCount} <span className="text-[10px] text-slate-400 italic">Teams</span></p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100/50">
                        <div className="flex items-center gap-2 text-purple-600 mb-1">
                            <Zap size={14} />
                            <span className="text-[8px] font-black uppercase tracking-widest">Team Fee</span>
                        </div>
                        <p className="text-sm font-black text-slate-900">₹{tournament.registration_fee || event.price || "Free"}</p>
                    </div>
                </div>

                {/* CTA */}
                <div className="pt-2">
                    <Link href={getEventPath(event)} className="block">
                        <button className="w-full py-5 bg-slate-900 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 group-hover:bg-pink-600 transition-all duration-300 shadow-xl group-hover:shadow-pink-500/30">
                            Register Your Team <ArrowRight size={18} />
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
