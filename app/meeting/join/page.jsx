"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/components/AuthContext";
import { 
    Video, 
    ArrowRight, 
    Ticket, 
    Lock, 
    CheckCircle, 
    LogIn, 
    Search,
    ShieldCheck,
    Calendar,
    Clock,
    Zap,
    Loader2
} from "lucide-react";
import Link from "next/link";

export default function JoinMeetingPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [code, setCode] = useState("");
    const [error, setError] = useState("");

    // Fetch user's bookings to find virtual events they've booked
    const allBookings = useQuery(
        api.bookings.getBookings,
        user ? {} : "skip"
    );
    const allEvents = useQuery(api.events.getActiveEvents);

    const virtualBookings = useMemo(() => {
        if (!allBookings || !allEvents || !user) return [];
        return allBookings
            .filter((b) => b.userId === user?.identifier && (b.status === "Confirmed" || b.status === "Paid" || b.status === "Scanned"))
            .map((b) => {
                const event = allEvents.find((e) => String(e._id) === String(b.eventId));
                return event?.virtual ? { booking: b, event } : null;
            })
            .filter(Boolean);
    }, [allBookings, allEvents, user]);

    const handleJoin = () => {
        const trimmed = code.trim().toLowerCase();
        if (!trimmed) { setError("Please enter a meeting code."); return; }
        if (trimmed.length < 4) { setError("Meeting codes are at least 4 characters."); return; }
        
        // If it looks like a meeting code, try to find the event or meeting associated
        router.push(`/meeting/join/${trimmed}`);
    };

    return (
        <div className="min-h-screen bg-[#F8F9FB] text-slate-900 selection:bg-blue-100 pb-20">
            {/* Nav */}
            <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50 px-6 md:px-12 flex items-center justify-between">

                <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
                </Link>
                <div className="flex items-center gap-4">
                    {user ? (
                         <Link href="/profile" className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-full pl-4 pr-1 py-1 hover:border-blue-200 transition-all">
                            <span className="text-xs font-bold text-slate-600">{user.email?.split('@')[0]}</span>
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden">
                                {user.imageUrl ? <img src={user.imageUrl} className="w-full h-full object-cover" /> : <ShieldCheck className="w-4 h-4 text-white" />}
                            </div>
                        </Link>
                    ) : (
                        <Link href="/signin">
                            <button className="px-5 py-2 bg-slate-900 text-white rounded-full text-xs font-black tracking-wider hover:bg-black transition-all">
                                Sign In
                            </button>
                        </Link>
                    )}
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-6 pt-20">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-600/20 transition-transform duration-500">
                        <Video size={20} className="text-white" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-2">
                        Meeting Portal
                    </h1>
                    <p className="text-slate-500 font-medium text-sm max-w-sm mx-auto">
                        Enter a code or jump into your sessions.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    {/* Manual Code Card */}
                    <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
                        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center mb-4 border border-slate-100">
                            <Search className="w-4 h-4 text-slate-400" />
                        </div>
                        <h2 className="text-base font-black mb-1 tracking-tight">Join with Code</h2>
                        <p className="text-slate-400 text-[11px] font-medium mb-4">Enter the code provided by the organiser.</p>
                        
                        <div className="space-y-3">
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => { setCode(e.target.value); setError(""); }}
                                    onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                                    placeholder="E.G. ABC12XYZ"
                                    className="w-full bg-slate-50 border border-slate-100 text-slate-900 px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500/50 transition-all text-xs font-black placeholder:text-slate-200 uppercase tracking-widest"
                                />
                                {error && (
                                    <div className="absolute -bottom-4 left-2 flex items-center gap-1.5 text-red-500 text-[8px] font-black uppercase italic">
                                        <Lock className="w-2 h-2" /> {error}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleJoin}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black text-[11px] tracking-widest uppercase transition-all shadow-md shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2"
                            >
                                Enter Room <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Bookings List Card */}
                    <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100 min-h-full flex flex-col">
                        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center mb-4 border border-indigo-100">
                            <Ticket className="w-4 h-4 text-indigo-500" />
                        </div>
                        <h2 className="text-base font-black mb-1 tracking-tight">Your Sessions</h2>
                        
                        {!user ? (
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center flex-1 flex flex-col justify-center">
                                <p className="text-slate-400 text-[10px] font-medium mb-3">Sign in to view sessions.</p>
                                <Link href="/signin">
                                    <button className="w-full py-2.5 bg-slate-900 text-white rounded-lg font-black text-[9px] tracking-widest uppercase hover:bg-black transition-all">
                                        Sign In
                                    </button>
                                </Link>
                            </div>
                        ) : allBookings === undefined ? (
                            <div className="py-6 flex flex-col items-center justify-center space-y-2">
                                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                                <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Loading...</p>
                            </div>
                        ) : virtualBookings.length === 0 ? (
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center flex-1 flex flex-col justify-center">
                                <Video className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                <p className="text-slate-400 text-[10px] font-medium mb-3">No virtual sessions found.</p>
                                <Link href="/">
                                    <button className="w-full py-2.5 bg-white border border-slate-200 text-slate-800 rounded-lg font-black text-[9px] tracking-widest uppercase hover:bg-slate-50 transition-all">
                                        Discover
                                    </button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-2.5 flex-1">
                                {virtualBookings.map(({ booking, event }) => (
                                    <Link 
                                        key={booking._id} 
                                        href={`/meeting/join/${event._id}`}
                                        className="block p-3 rounded-lg bg-white border border-slate-100 hover:border-blue-500/30 hover:bg-blue-50/20 transition-all group shadow-sm hover:shadow-md"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Confirmed</span>
                                            </div>
                                            <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                                        </div>
                                        <h3 className="text-[11px] font-black text-slate-900 group-hover:text-blue-600 transition-colors truncate">{event.title}</h3>
                                        <div className="flex items-center gap-2 mt-1 opacity-70">
                                            <div className="flex items-center gap-1 text-[8px] text-slate-500 font-bold">
                                                <Calendar className="w-2.5 h-2.5" /> {event.date}
                                            </div>
                                            <div className="flex items-center gap-1 text-[8px] text-slate-500 font-bold">
                                                <Clock className="w-2.5 h-2.5" /> {event.time}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Tip */}
                <div className="mt-8 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-100 shadow-sm lowercase">
                        <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span className="text-[9px] font-bold text-slate-400">sessions appear here 15 mins before.</span>
                    </div>
                </div>
            </div>


        </div>
    );
}
