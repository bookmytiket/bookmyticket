"use client";
import React, { useState } from "react";
import { 
    Bell, CheckCircle2, Clock, XCircle, 
    AlertTriangle, IndianRupee, MessageSquare, Ticket,
    Calendar, MoreVertical, Search, Filter, Trash2
} from "lucide-react";
import { useSupabaseQuery } from "@/hooks/useSupabase";
import { useAuth } from "@/components/AuthContext";

const NOTIF_TYPES = {
    booking: { icon: Ticket, color: "text-blue-500", bg: "bg-blue-50" },
    payment: { icon: IndianRupee, color: "text-emerald-500", bg: "bg-emerald-50" },
    cancellation: { icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
    system: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50" },
    message: { icon: MessageSquare, color: "text-purple-500", bg: "bg-purple-50" },
};

export default function NotificationsPage() {
    const { user } = useAuth();
    const [filter, setFilter] = useState("all");

    const { data: notifications = [], reload: reloadNotifs } = useSupabaseQuery('notifications', (q) => 
        q.eq('user_id', user?.id).order('created_at', { ascending: false })
    , [user?.id]);

    const filteredNotifs = filter === "all" ? notifications : notifications.filter(n => n.type === filter);

    return (
        <div className="space-y-12 animate-in slide-in-from-right-8 duration-1000">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 px-4">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[1.8rem] bg-amber-500 flex items-center justify-center text-white shadow-xl shadow-amber-100 shrink-0">
                        <Bell size={28} />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-[#1A1C2E] tracking-tighter uppercase italic leading-none">COMMUNICATION HUB</h2>
                        <p className="text-slate-400 font-bold text-sm mt-2 uppercase tracking-widest">Real-time system and business alerts</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={() => reloadNotifs()} className="px-10 py-5 bg-white border border-slate-100 text-[#1A1C2E] rounded-[2rem] text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                        MARK ALL AS READ
                    </button>
                </div>
            </div>

            {/* Notification Filter Bar */}
            <div className="flex flex-wrap items-center gap-6 px-4">
                {['all', 'booking', 'payment', 'cancellation', 'system'].map(t => (
                    <button 
                        key={t}
                        onClick={() => setFilter(t)}
                        className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            filter === t ? 'bg-[#1A1C2E] text-white shadow-xl' : 'bg-white border border-slate-50 text-slate-300 hover:text-[#1A1C2E]'
                        }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* Notification List */}
            <div className="bg-white rounded-[4rem] border border-slate-50 overflow-hidden shadow-sm">
                {filteredNotifs.length === 0 ? (
                    <div className="p-32 text-center space-y-10">
                        <div className="w-28 h-28 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-100">
                            <Bell size={56} />
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-3xl font-black text-[#1A1C2E] uppercase italic tracking-tighter">ALL CLEAR</h3>
                            <p className="text-slate-300 font-bold uppercase text-[10px] tracking-[0.3em]">No new alerts in the queue</p>
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {filteredNotifs.map((notif) => {
                            const cfg = NOTIF_TYPES[notif.type] || NOTIF_TYPES.system;
                            return (
                                <div key={notif.id} className={`p-10 flex items-center gap-10 hover:bg-slate-50/50 transition-colors group ${!notif.read_at ? 'bg-pink-50/20' : ''}`}>
                                    <div className={`w-16 h-16 rounded-[1.8rem] ${cfg.bg} ${cfg.color} flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110`}>
                                        <cfg.icon size={28} />
                                    </div>
                                    
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-4">
                                            <h4 className="text-xl font-black text-[#1A1C2E] uppercase italic tracking-tighter leading-none">{notif.title}</h4>
                                            {!notif.read_at && (
                                                <span className="w-2.5 h-2.5 bg-pink-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(248,68,100,0.5)]" />
                                            )}
                                        </div>
                                        <p className="text-base font-bold text-slate-500 max-w-3xl leading-relaxed">{notif.message}</p>
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] flex items-center gap-2">
                                            <Clock size={12} /> {new Date(notif.created_at).toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4 shrink-0">
                                        <button className="p-4 bg-slate-50 text-slate-300 rounded-2xl hover:bg-[#1A1C2E] hover:text-white transition-all shadow-sm">
                                            <CheckCircle2 size={18} />
                                        </button>
                                        <button className="p-4 bg-slate-50 text-red-200 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
