"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/components/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Video, ArrowRight, Ticket, Lock, CheckCircle, LogIn } from "lucide-react";
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

    const virtualBookings = allBookings
        ?.filter((b) => b.userId === user?.identifier && b.status === "confirmed")
        ?.map((b) => {
            const event = allEvents?.find((e) => String(e._id) === String(b.eventId));
            return event?.virtual ? { booking: b, event } : null;
        })
        .filter(Boolean) || [];

    const handleJoin = () => {
        const trimmed = code.trim().toLowerCase();
        if (!trimmed) { setError("Please enter a meeting code."); return; }
        if (trimmed.length < 6) { setError("Meeting codes are at least 6 characters."); return; }
        router.push(`/${trimmed}`);
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4"
            style={{ background: "#f8fafc", fontFamily: "'Figtree','Inter',sans-serif" }}
        >
            <div className="w-full max-w-2xl space-y-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ background: "linear-gradient(135deg,#3b82f6,#8b5cf6)" }}
                    >
                        <Video size={28} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Join a Meeting</h1>
                    <p className="text-slate-500 text-sm mt-1">Enter a meeting code or join from your bookings below</p>
                </motion.div>

                {/* Code Input Card */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/60 border border-slate-100"
                >
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
                        Meeting Code
                    </label>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => { setCode(e.target.value); setError(""); }}
                            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                            placeholder="e.g. abc12xyz"
                            className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 transition-all text-sm font-mono font-bold placeholder:text-slate-300 uppercase tracking-widest"
                        />
                        <button
                            onClick={handleJoin}
                            className="flex items-center gap-2 px-6 py-4 rounded-2xl text-white text-sm font-black tracking-wider transition-all active:scale-[0.97] hover:opacity-90 shrink-0"
                            style={{ background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", boxShadow: "0 8px 24px -6px rgba(99,102,241,0.4)" }}
                        >
                            Join <ArrowRight size={18} />
                        </button>
                    </div>
                    {error && (
                        <p className="text-red-500 text-xs font-semibold mt-2 ml-1">{error}</p>
                    )}
                </motion.div>

                {/* Virtual Bookings */}
                {user ? (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/60 border border-slate-100"
                    >
                        <div className="flex items-center gap-2 mb-5">
                            <Ticket size={18} className="text-indigo-500" />
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Your Virtual Events</h2>
                        </div>

                        {virtualBookings.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                                <Video size={36} className="mx-auto mb-3 opacity-20" />
                                <p className="text-sm font-semibold">No confirmed virtual event bookings yet.</p>
                                <Link
                                    href="/"
                                    className="inline-block mt-3 text-xs font-black text-blue-600 hover:text-blue-700 underline underline-offset-2"
                                >
                                    Browse Virtual Events →
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {virtualBookings.map(({ booking, event }) => {
                                    const isFree = !event.price || event.price === 0 || 
                                        event.normalTicketPrice === 0 ||
                                        event.seatCategories?.every(c => c.isFree);
                                    const meetingSlug = event.meetingUrl;

                                    return (
                                        <div
                                            key={booking._id}
                                            className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-900 truncate">{event.title}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${isFree ? "bg-green-100 text-green-700" : "bg-indigo-100 text-indigo-700"}`}>
                                                        {isFree ? "Free Event" : "Paid Event"}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-semibold">{event.date || "Ongoing"}</span>
                                                    {meetingSlug && (
                                                        <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Code:</span>
                                                            <span className="text-[10px] font-bold text-slate-700 font-mono tracking-widest">{meetingSlug}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {meetingSlug ? (
                                                <button
                                                    onClick={() => {
                                                        const url = meetingSlug && meetingSlug.startsWith("http") ? meetingSlug : `/${meetingSlug}`;
                                                        window.open(url, '_blank');
                                                    }}
                                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-black shrink-0"
                                                    style={{ background: "linear-gradient(135deg,#3b82f6,#8b5cf6)" }}
                                                >
                                                    <CheckCircle size={14} /> Join Now
                                                </button>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold shrink-0">
                                                    <Lock size={13} /> Link pending
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/60 border border-slate-100 flex items-center gap-4"
                    >
                        <LogIn size={20} className="text-slate-400 shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-slate-700">Sign in to see your virtual event bookings</p>
                            <Link href="/signin" className="text-xs text-blue-600 font-bold hover:underline">Sign In →</Link>
                        </div>
                    </motion.div>
                )}

                <p className="text-center text-xs text-slate-400">
                    Looking for an event?{" "}
                    <Link href="/" className="text-blue-600 font-bold hover:underline">Browse virtual events →</Link>
                </p>
            </div>
        </div>
    );
}
