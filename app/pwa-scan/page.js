"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseQuery, useSupabaseMutation } from "@/hooks/useSupabase";
import { useAuth } from "@/components/AuthContext";
import { useToast } from "@/context/ToastContext";
import RequireAuth from "@/components/RequireAuth";
import { 
    Camera, CheckCircle, AlertCircle, XCircle, QrCode, 
    Search, UserCheck, LogOut, Home, RefreshCw, X 
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

export default function PWAScanPortal() {
    return (
        <RequireAuth allowedRoles={["staff", "organiser", "admin", "super_admin"]}>
            <PWAScanContent />
        </RequireAuth>
    );
}

function PWAScanContent() {
    const { user, logout } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const [scanInput, setScanInput] = useState("");
    const [scanResult, setScanResult] = useState(null);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isValidating, setIsValidating] = useState(false);

    // Fetch Events for context
    const { data: events = [] } = useSupabaseQuery(
        "events",
        (q) => {
            const orgId = user?.role === "staff" ? user?.organiser_id : user?.id;
            return q.eq("organiser_id", orgId);
        },
        [user]
    );

    // Fetch recent bookings/scans
    const { data: bookings = [], refetch: refetchBookings } = useSupabaseQuery(
        "bookings",
        (q) => {
            if (events.length === 0) return q.eq("id", "none");
            return q.in("event_id", events.map(e => e.id));
        },
        [events]
    );

    const [updateBooking] = useSupabaseMutation("bookings", "update", (q, p) => q.eq("id", p.id));

    // Scanner Logic
    useEffect(() => {
        let scanner = null;
        if (isScannerOpen) {
            scanner = new Html5Qrcode("pwa-qr-reader");
            scanner.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    handleValidate(decodedText);
                    setIsScannerOpen(false);
                    scanner.stop();
                },
                (error) => {}
            ).catch(err => console.error("Scanner start error:", err));
        }
        return () => {
            if (scanner && scanner.isScanning) {
                scanner.stop().catch(err => console.error("Scanner stop error:", err));
            }
        };
    }, [isScannerOpen]);

    const handleValidate = async (id) => {
        if (!id) return;
        setIsValidating(true);
        setScanResult(null);

        try {
            const booking = bookings.find(b => b.id === id || b.ticket_id === id);
            
            if (!booking) {
                setScanResult({ status: "invalid" });
            } else if (booking.checked_in) {
                setScanResult({ status: "already_used", booking });
            } else {
                // Success - Mark as checked in
                await updateBooking({ 
                    id: booking.id, 
                    checked_in: true, 
                    scanned_at: new Date().toISOString(),
                    scanned_by: user?.id
                });
                setScanResult({ status: "valid", booking });
                showToast("Attendee Checked In", "success");
                refetchBookings();
            }
        } catch (err) {
            setScanResult({ status: "error", message: err.message });
        } finally {
            setIsValidating(false);
        }
    };

    const recentScans = useMemo(() => {
        return bookings
            .filter(b => b.checked_in)
            .sort((a, b) => new Date(b.scanned_at || b.created_at) - new Date(a.scanned_at || a.created_at))
            .slice(0, 10);
    }, [bookings]);

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-pink-500/30">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
                <div>
                    <img src="/logo.png" alt="BookMyTicket" style={{ height: "40px" }} />
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => window.location.reload()} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all">
                        <RefreshCw size={18} />
                    </button>
                    <button onClick={() => logout()} className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            <main className="p-6 max-w-lg mx-auto space-y-8 pb-32">
                {/* User Info */}
                <div className="p-4 rounded-3xl bg-white/5 border border-white/10 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-xl font-black italic">
                        {user?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="text-sm font-black italic uppercase tracking-tight">{user?.full_name || "Staff Member"}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{user?.role} Portal</p>
                    </div>
                </div>

                {/* Scanner Interface */}
                <div className="space-y-4">
                    {!isScannerOpen ? (
                        <button 
                            onClick={() => setIsScannerOpen(true)}
                            className="w-full aspect-square rounded-[3rem] bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-6 group hover:border-pink-500/50 transition-all "
                        >
                            <div className="w-20 h-20 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500 group-hover:scale-110 transition-all  shadow-2xl shadow-pink-500/20">
                                <Camera size={36} />
                            </div>
                            <div className="text-center">
                                <span className="block text-lg font-black italic uppercase tracking-tight">Tap to Scan</span>
                                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Supports all QR formats</span>
                            </div>
                        </button>
                    ) : (
                        <div className="relative aspect-square rounded-[3rem] overflow-hidden border-2 border-pink-500 shadow-2xl shadow-pink-500/20">
                            <div id="pwa-qr-reader" className="w-full h-full bg-black"></div>
                            <button 
                                onClick={() => setIsScannerOpen(false)}
                                className="absolute top-4 right-4 p-3 bg-red-500 rounded-2xl text-white shadow-xl"
                            >
                                <X size={20} />
                            </button>
                            <div className="absolute inset-x-0 bottom-8 flex justify-center">
                                <div className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/80 ">
                                    Aim at QR Code
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 rounded-3xl bg-white/5 border border-white/10 text-center">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Scanned</p>
                            <p className="text-2xl font-black italic">{recentScans.length}</p>
                        </div>
                        <div className="p-4 rounded-3xl bg-white/5 border border-white/10 text-center">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Session Role</p>
                            <p className="text-sm font-black italic uppercase text-pink-500">{user?.role}</p>
                        </div>
                    </div>
                </div>

                {/* Manual Validation */}
                <div className="space-y-4">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Manual Audit</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Enter Booking ID..." 
                            value={scanInput}
                            onChange={(e) => setScanInput(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-pink-500/50 transition-all"
                        />
                        <button 
                            onClick={() => handleValidate(scanInput)}
                            disabled={isValidating || !scanInput}
                            className="absolute right-2 top-2 bottom-2 px-6 bg-pink-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-pink-600 disabled:opacity-50 transition-all"
                        >
                            {isValidating ? "..." : "Check"}
                        </button>
                    </div>
                </div>

                {/* Result Area */}
                {scanResult && (
                    <div className={`p-6 rounded-[2.5rem] border    ${
                        scanResult.status === "valid" ? "bg-green-500/10 border-green-500/20" : 
                        scanResult.status === "already_used" ? "bg-amber-500/10 border-amber-500/20" : 
                        "bg-red-500/10 border-red-500/20"
                    }`}>
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                scanResult.status === "valid" ? "bg-green-500 text-white" : 
                                scanResult.status === "already_used" ? "bg-amber-500 text-white" : 
                                "bg-red-500 text-white"
                            }`}>
                                {scanResult.status === "valid" ? <CheckCircle size={28} /> : 
                                 scanResult.status === "already_used" ? <AlertCircle size={28} /> : 
                                 <XCircle size={28} />}
                            </div>
                            <div>
                                <h3 className="text-lg font-black italic uppercase leading-none">
                                    {scanResult.status === "valid" ? "Access Granted" : 
                                     scanResult.status === "already_used" ? "Duplicate Entry" : 
                                     "Invalid Ticket"}
                                </h3>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                                    Status: {scanResult.status.replace('_', ' ')}
                                </p>
                            </div>
                        </div>

                        {scanResult.booking && (
                            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Booking Info</p>
                                <p className="text-xs font-bold">{scanResult.booking.event_name || "Event Title"}</p>
                                <p className="text-[10px] text-slate-500">ID: {scanResult.booking.id}</p>
                                <p className="text-[10px] text-slate-500">Qty: {scanResult.booking.ticket_count || 1} Person(s)</p>
                            </div>
                        )}
                    </div>
                )}

                {/* History */}
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Session History</h3>
                    <div className="space-y-2">
                        {recentScans.map((scan) => (
                            <div key={scan.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold italic uppercase">{scan.event_name || "Event"}</p>
                                    <p className="text-[9px] text-slate-500">#{scan.id.slice(-8).toUpperCase()} • {new Date(scan.scanned_at).toLocaleTimeString()}</p>
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center">
                                    <UserCheck size={16} />
                                </div>
                            </div>
                        ))}
                        {recentScans.length === 0 && (
                            <div className="text-center py-8 opacity-20">
                                <QrCode size={48} className="mx-auto mb-2" />
                                <p className="text-[10px] font-bold uppercase tracking-widest">No scans this session</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Bottom Nav Simulation */}
            <div className="fixed bottom-0 inset-x-0 p-6 bg-gradient-to-t from-slate-950 to-transparent">
                <button 
                    onClick={() => router.push('/')}
                    className="w-full py-4 rounded-2xl bg-white text-slate-950 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-2xl shadow-blue-500/20"
                >
                    <Home size={18} /> Exit to Home
                </button>
            </div>
        </div>
    );
}
