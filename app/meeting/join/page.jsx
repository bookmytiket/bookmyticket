"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseQuery } from "@/hooks/useSupabase";
import { useAuth } from "@/components/AuthContext";
import { 
    Video, 
    ArrowRight, 
    Ticket, 
    Lock, 
    Search,
    Calendar,
    Clock,
    Zap,
    Loader2,
    ShieldCheck
} from "lucide-react";
import Link from "next/link";

export default function JoinMeetingPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [code, setCode] = useState("");
    const [error, setError] = useState("");

    // Fetch user's bookings to find virtual events they've booked
    const { data: allBookings, loading: bookingsLoading } = useSupabaseQuery(
        "bookings",
        (q) => q.eq("user_id", user?.id),
        [user?.id]
    );

    const { data: allEvents, loading: eventsLoading } = useSupabaseQuery(
        "events",
        (q) => q.eq("status", "Active"),
        []
    );

    const virtualBookings = useMemo(() => {
        if (!allBookings || !allEvents || !user) return [];
        return allBookings
            .filter((b) => (b.status === "Confirmed" || b.status === "Paid" || b.status === "Scanned"))
            .map((b) => {
                const event = allEvents.find((e) => String(e.id) === String(b.event_id));
                return event?.virtual ? { booking: b, event } : null;
            })
            .filter(Boolean);
    }, [allBookings, allEvents, user]);

    const handleJoin = () => {
        const trimmed = code.trim().toLowerCase();
        if (!trimmed) { setError("Please enter a meeting code."); return; }
        if (trimmed.length < 4) { setError("Meeting codes are at least 4 characters."); return; }
        
        router.push(`/meeting/join/${trimmed}`);
    };

    return (
        <main className="min-h-screen w-full relative overflow-hidden bg-[#0a0f1e] flex items-center justify-center font-sans">
            {/* Premium Immersive Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-blue-600/15 rounded-full blur-[140px] animate-pulse" />
                <div className="absolute bottom-[-15%] right-[-5%] w-[55%] h-[55%] bg-indigo-600/15 rounded-full blur-[160px]" />
                <div className="absolute top-[15%] right-[15%] w-[35%] h-[35%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '10s' }} />
                
                {/* Subtle Grid / Grain Overlay */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] contrast-125 brightness-100" />
            </div>

            {/* Main Content Container - Restricted Width for 'Fitted' Look */}
            <div className="relative z-10 w-full max-w-4xl px-6 py-4 pointer-events-none">
                <div className="pointer-events-auto bg-white/[0.98] backdrop-blur-3xl rounded-[2.5rem] shadow-[0_32px_80px_-20px_rgba(0,0,0,0.6)] border border-white/40 overflow-hidden transform transition-all duration-1000 ease-in-out flex flex-col max-h-[92vh]">
                    
                    {/* Header Section - Premium Branding */}
                    <div className="px-10 pt-8 pb-5 text-center border-b border-slate-100/60 bg-slate-50/50">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-blue-500/30 ring-8 ring-blue-50/50 transform hover:scale-110 transition-transform cursor-pointer">
                            <Video size={28} className="text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1.5 antialiased">
                            Meeting Portal
                        </h1>
                        <div className="flex items-center justify-center gap-3">
                            <div className="h-[1px] w-8 bg-slate-200" />
                            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.25em]">
                                Secure • High Fidelity • Seamless 
                            </p>
                            <div className="h-[1px] w-8 bg-slate-200" />
                        </div>
                    </div>

                    {/* Interactive Content Grid */}
                    <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto no-scrollbar bg-white/40">
                        {/* Manual Code Entry Area */}
                        <div className="space-y-4 flex flex-col h-full bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] transition-all hover:shadow-2xl hover:shadow-blue-500/5 group/card">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 group-hover/card:bg-blue-600 group-hover/card:border-blue-600 transition-all duration-500">
                                    <Search className="w-4 h-4 text-slate-400 group-hover/card:text-white transition-colors" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-slate-800 leading-tight tracking-tight">Join with Code</h2>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Entry Key Access</p>
                                </div>
                            </div>
                            
                            <div className="space-y-4 pt-2 mt-auto">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={code}
                                        onChange={(e) => { setCode(e.target.value); setError(""); }}
                                        onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                                        placeholder="E.G. ABC12XYZ"
                                        className="w-full bg-slate-50/50 border-2 border-slate-100 text-slate-900 px-5 py-3.5 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 transition-all text-sm font-black placeholder:text-slate-200 uppercase tracking-widest text-center shadow-inner"
                                    />
                                    {error && (
                                        <div className="absolute -bottom-5 left-0 right-0 flex items-center justify-center gap-2 text-red-500 text-[9px] font-black uppercase italic tracking-wider animate-in fade-in slide-in-from-top-1">
                                            <Lock className="w-2.5 h-2.5" /> {error}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={handleJoin}
                                    className="w-full py-4 bg-slate-900 hover:bg-blue-600 text-white rounded-xl font-black text-[10px] tracking-[0.2em] uppercase transition-all shadow-xl hover:shadow-blue-600/30 active:scale-[0.97] flex items-center justify-center gap-3 group"
                                >
                                    Access Room <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform" />
                                </button>
                            </div>
                        </div>

                        {/* Recent Registrations / Bookings Area */}
                        <div className="space-y-4 flex flex-col h-full bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] transition-all hover:shadow-2xl hover:shadow-indigo-500/5 group/card">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 group-hover/card:bg-indigo-600 group-hover/card:border-indigo-600 transition-all duration-500">
                                    <Ticket className="w-4 h-4 text-slate-400 group-hover/card:text-white transition-colors" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-sm font-black text-slate-800 leading-tight tracking-tight">Your Sessions</h2>
                                        <div className="flex items-center gap-2 px-2 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                                            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                                            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">Live</span>
                                        </div>
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Registrations</p>
                                </div>
                            </div>

                            <div className="mt-2 flex-1 min-h-[140px]">
                                {!user ? (
                                    <div className="h-full bg-slate-25 border-2 border-dashed border-slate-100 rounded-xl flex flex-col items-center justify-center p-4 text-center">
                                        <p className="text-slate-400 text-[10px] font-black mb-4 uppercase tracking-widest">Authentication Required</p>
                                        <Link href="/signin">
                                            <button className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[9px] tracking-widest uppercase hover:bg-indigo-600 transition-all shadow-lg active:scale-95">
                                                Sign In Now
                                            </button>
                                        </Link>
                                    </div>
                                ) : bookingsLoading ? (
                                    <div className="h-full flex flex-col items-center justify-center py-4">
                                        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                                    </div>
                                ) : virtualBookings.length === 0 ? (
                                    <div className="h-full bg-slate-25 border-2 border-dashed border-slate-100 rounded-xl flex flex-col items-center justify-center p-4 text-center">
                                        <Video className="w-6 h-6 text-slate-100 mb-2" />
                                        <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">No sessions</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {virtualBookings.slice(0, 2).map(({ booking, event }) => (
                                            <Link 
                                                key={booking.id} 
                                                href={`/meeting/join/${event.id}`}
                                                className="group/item block p-3.5 rounded-xl bg-white border border-slate-100 hover:border-indigo-500/30 hover:bg-indigo-50 shadow-sm transition-all"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1 min-w-0 pr-3">
                                                        <h3 className="text-[11px] font-black text-slate-900 group-hover/item:text-indigo-600 transition-colors truncate">{event.title}</h3>
                                                        <div className="flex items-center gap-2 mt-0.5 opacity-60">
                                                            <Calendar size={8} className="text-slate-400" />
                                                            <span className="text-[8px] font-bold text-slate-500 uppercase">{new Date(event.date).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                    <ArrowRight className="w-3 h-3 text-slate-300" />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer Utility Branding */}
                    <div className="px-10 py-5 bg-slate-50/80 border-t border-slate-100/60 text-center">
                        <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-white rounded-full border border-slate-100 shadow-lg shadow-slate-200/50">
                            <Zap className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
                            <div className="text-left">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Live sessions open 15m early.</p>
                            </div>
                            <div className="h-4 w-[1px] bg-slate-100 mx-1" />
                            <Link href="/help" className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors">Help</Link>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                @keyframes pulse-custom {
                    0%, 100% { opacity: 0.15; }
                    50% { opacity: 0.25; }
                }
            `}</style>
        </main>
    );
}

