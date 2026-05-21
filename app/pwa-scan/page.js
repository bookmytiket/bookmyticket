"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseQuery, useSupabaseMutation } from "@/hooks/useSupabase";
import { useAuth } from "@/components/AuthContext";
import { useToast } from "@/context/ToastContext";
import RequireAuth from "@/components/RequireAuth";
import { 
    Camera, CheckCircle, AlertCircle, XCircle, QrCode, 
    Search, UserCheck, LogOut, Home, RefreshCw, X, 
    ShieldAlert, Clock, MapPin, Zap
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
    const [gateName, setGateName] = useState("Main Entrance");
    const [isExpired, setIsExpired] = useState(false);
    const [isActioning, setIsActioning] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [showRejectModal, setShowRejectModal] = useState(false);


    // Fetch Staff Record for restrictions
    const { data: staffRecord } = useSupabaseQuery(
        "staff",
        (q) => q.eq("auth_user_id", user?.id).maybeSingle(),
        [user?.id],
        { enabled: user?.role === "staff" }
    );

    const assignedEventId = useMemo(() => staffRecord?.assigned_event_id || user?.user_metadata?.assigned_event_id, [staffRecord, user]);
    const expiryDate = useMemo(() => staffRecord?.expiry_date || user?.user_metadata?.expiry_date, [staffRecord, user]);
    const organiserId = useMemo(() => staffRecord?.organiser_id || user?.id, [staffRecord, user]);

    // Fetch Subscription Features
    const { data: organiserSub } = useSupabaseQuery(
        "organiser_subscriptions",
        (q) => q.eq("organiser_id", organiserId).eq("payment_status", "active").maybeSingle(),
        [organiserId]
    );

    const { data: staffPackages = [] } = useSupabaseQuery("staff_packages", q => q);
    
    const currentPackage = useMemo(() => {
        if (!organiserSub) return staffPackages.find(p => p.package_name === "Free Plan") || { features: {} };
        return staffPackages.find(p => p.id === organiserSub.package_id) || { features: {} };
    }, [organiserSub, staffPackages]);

    const features = currentPackage.features || {};

    useEffect(() => {
        if (expiryDate && new Date(expiryDate) < new Date()) {
            setIsExpired(true);
            showToast("Your scan access has expired", "error");
        }
    }, [expiryDate]);

    // Fetch Events for context
    const { data: events = [] } = useSupabaseQuery(
        "events",
        (q) => {
            const orgId = user?.role === "staff" ? (staffRecord?.organiser_id || user?.organiser_id) : user?.id;
            let query = q.eq("organiser_id", orgId);
            if (assignedEventId) {
                query = query.eq("id", assignedEventId);
            }
            return query;
        },
        [user, staffRecord, assignedEventId]
    );

    // Fetch recent scan logs for this scanner
    const { data: scanLogs = [], refetch: refetchScanLogs } = useSupabaseQuery(
        "ticket_scan_logs",
        (q) => {
            if (!user?.id) return q.eq("id", "00000000-0000-0000-0000-000000000000");
            return q.eq("scanned_by", user.id).order('created_at', { ascending: false }).limit(20);
        },
        [user?.id]
    );

    const [updateBooking] = useSupabaseMutation("bookings", "update", (q, p) => q.eq("id", p.id));
    const [logScan] = useSupabaseMutation("ticket_scans", "insert");
    const [logDuplicate] = useSupabaseMutation("duplicate_scan_logs", "insert");
    const [logValidation] = useSupabaseMutation("ticket_validation_logs", "insert");

    // Scanner Logic
    useEffect(() => {
        let scanner = null;
        if (isScannerOpen && !isExpired) {
            scanner = new Html5Qrcode("pwa-qr-reader");
            scanner.start(
                { facingMode: "environment" },
                { fps: 15, qrbox: { width: 280, height: 280 } },
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
    }, [isScannerOpen, isExpired]);

    const handleAction = async (actionType) => {
        if (!scanResult || !scanResult.ticket_id) return;
        setIsActioning(true);

        try {
            const res = await fetch("/api/scanner/action", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ticketId: scanResult.ticket_id,
                    bookingId: scanResult.booking_id,
                    ticketCode: scanResult.ticket_code,
                    action: actionType,
                    idType: "Visual Match",
                    rejectionReason: actionType === 'reject' ? rejectionReason : null,
                    deviceUuid: navigator.userAgent,
                    deviceName: "Staff Scanner Portal",
                    gateName: gateName,
                    scannerUserId: user?.id
                })
            });

            const data = await res.json();
            if (res.ok && data.status === "valid") {
                showToast("Entry Approved", "success");
                setScanResult({
                    ...scanResult,
                    status: "valid",
                    message: "TICKET APPROVED • WELCOME TO THE EVENT!"
                });
                refetchScanLogs();
            } else if (res.ok && data.status === "rejected") {
                showToast("Entry Rejected", "error");
                setScanResult({
                    ...scanResult,
                    status: "rejected",
                    message: "ENTRY REJECTED • " + rejectionReason
                });
                setShowRejectModal(false);
                setRejectionReason("");
                refetchScanLogs();
            } else {
                showToast(data.message || "Action failed", "error");
            }
        } catch (err) {
            showToast("Network error", "error");
        } finally {
            setIsActioning(false);
        }
    };

    const handleValidate = async (id, isHistoryClick = false) => {
        if (!id || isExpired) return;
        setIsValidating(true);
        setScanResult(null);

        try {
            const res = await fetch("/api/scanner/lookup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    qrPayload: id,
                    deviceUuid: navigator.userAgent,
                    deviceName: "Staff Scanner Portal",
                    gateName: gateName,
                    scannerUserId: user?.id
                })
            });

            const data = await res.json();

            if (res.ok) {
                if (data.status === "requires_action") {
                    setScanResult(data);
                } else if (data.status === "already_used") {
                    setScanResult({ ...data, isHistoryClick });
                    showToast("Already Checked-In", "warning");
                } else {
                    setScanResult({
                        status: data.status,
                        message: data.message || "Invalid Ticket"
                    });
                }
            } else {
                setScanResult({
                    status: "error",
                    title: "NETWORK ERROR",
                    message: "Could not connect to validation server.",
                    color: "red",
                    isHistoryClick
                });
            }
        } catch (err) {
            setScanResult({ status: "error", message: err.message });
        } finally {
            setIsValidating(false);
            setScanInput("");
        }
    };

    const recentScans = useMemo(() => {
        return scanLogs.slice(0, 15);
    }, [scanLogs]);

    if (isExpired) {
        return (
            <div className="min-h-screen bg-[#0A0A0E] flex flex-col items-center justify-center p-8 text-center">
                <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-6">
                    <ShieldAlert size={48} />
                </div>
                <h2 className="text-2xl font-black italic uppercase tracking-tight text-white mb-2">Access Expired</h2>
                <p className="text-zinc-400 text-sm mb-8">Your scan access period has ended. Please contact your organiser for renewal.</p>
                <button onClick={() => logout()} className="px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px]">Log Out</button>
            </div>
        );
    }

    return (
        <div className="h-[100dvh] bg-[#0A0A0E] text-white font-sans selection:bg-pink-500/50 flex flex-col overflow-hidden">
            <header className="flex-none bg-[#0A0A0E]/80 backdrop-blur-xl border-b border-[#1F1F2E] px-6 py-4 flex items-center justify-between z-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Zap size={20} className="text-white fill-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-black italic uppercase tracking-tighter leading-none">Scanner</h1>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Portal v2.0</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => window.location.reload()} className="p-2.5 rounded-xl bg-white/5 border border-[#1F1F2E] text-zinc-400 hover:text-white transition-all">
                        <RefreshCw size={18} />
                    </button>
                    <button onClick={() => logout()} className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 w-full max-w-lg mx-auto pb-8">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-purple-600 rounded-[2rem] opacity-20 blur group-hover:opacity-30 transition-all"></div>
                    <div className="relative p-5 rounded-[2rem] bg-[#13131A] border border-[#1F1F2E] flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-[#1F1F2E] flex items-center justify-center text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
                                {user?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-sm font-black italic uppercase tracking-tight">{user?.full_name || "Staff Member"}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Live • {gateName}</p>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Restricted</p>
                            <div className="px-2 py-1 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600/10 border border-[#1F1F2E] text-[9px] font-bold text-pink-400 uppercase">
                                {assignedEventId ? "One Event" : "Global"}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {["Main Entrance", "VIP Gate", "Marathon Start", "Gate B"].map(g => (
                        <button 
                            key={g}
                            onClick={() => {
                                if (!features.multi_gate && g !== "Main Entrance") {
                                    showToast("Multi-gate access requires a premium plan", "info");
                                    return;
                                }
                                setGateName(g);
                            }}
                            className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                gateName === g ? "bg-gradient-to-r from-pink-600 to-purple-600 text-white" : (features.multi_gate || g === "Main Entrance" ? "bg-white/5 text-zinc-400 border border-[#1F1F2E]" : "bg-white/5 text-zinc-400 border border-[#1F1F2E] cursor-not-allowed opacity-50")
                            }`}
                        >
                            {g} {!features.multi_gate && g !== "Main Entrance" && "🔒"}
                        </button>
                    ))}
                    {features.offline_scan && (
                        <div className="whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-green-500/10 text-green-500 border border-green-500/20 flex items-center gap-2">
                            <Zap size={12} /> Offline Ready
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    {!isScannerOpen ? (
                        <button 
                            onClick={() => setIsScannerOpen(true)}
                            className="w-full h-48 sm:h-64 rounded-[2rem] bg-[#13131A] border-2 border-dashed border-[#1F1F2E] flex flex-col items-center justify-center gap-3 group hover:border-pink-500/50 transition-all shadow-xl"
                        >
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/5 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-all border border-pink-500/30 shadow-xl shadow-pink-500/10">
                                <Camera size={32} />
                            </div>
                            <div className="text-center">
                                <span className="block text-xl font-black italic uppercase tracking-tight text-white mb-1">Start Scanning</span>
                                <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-8">Point camera at the attendee's QR ticket for instant validation</span>
                            </div>
                        </button>
                    ) : (
                        <div className="relative w-full h-64 sm:h-72 rounded-[2rem] overflow-hidden border-2 border-pink-500/50 shadow-2xl shadow-purple-500/20">
                            <div id="pwa-qr-reader" className="w-full h-full bg-black"></div>
                            <button 
                                onClick={() => setIsScannerOpen(false)}
                                className="absolute top-6 right-6 p-4 bg-red-500 rounded-2xl text-white shadow-2xl active:scale-95 transition-all"
                            >
                                <X size={24} />
                            </button>
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-56 sm:h-56 border-2 border-pink-500/50 rounded-3xl"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 sm:w-56 h-1 bg-gradient-to-r from-pink-500 to-purple-600/50 shadow-[0_0_15px_rgba(236,72,153,0.5)] animate-scan"></div>
                            </div>
                            <div className="absolute inset-x-0 bottom-10 flex justify-center">
                                <div className="px-6 py-3 bg-black/60 backdrop-blur-md rounded-full border border-[#1F1F2E] text-[10px] font-black uppercase tracking-widest text-white shadow-2xl">
                                    Align QR in Frame
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 rounded-3xl bg-[#13131A] border border-[#1F1F2E] text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600/5 rounded-bl-[2rem]"></div>
                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Session Scans</p>
                            <p className="text-3xl font-black italic text-white">{recentScans.length}</p>
                        </div>
                        <div className="p-5 rounded-3xl bg-[#13131A] border border-[#1F1F2E] text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-12 h-12 bg-purple-500/5 rounded-bl-[2rem]"></div>
                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Events</p>
                            <p className="text-3xl font-black italic text-white">{events.length}</p>
                        </div>
                    </div>
                </div>

                {scanResult && (
                    <div className={`p-8 rounded-[3rem] border shadow-2xl animate-in fade-in zoom-in duration-300 ${
                        scanResult.status === "valid" ? "bg-green-500/10 border-green-500/20" : 
                        scanResult.status === "already_used" ? "bg-amber-500/10 border-amber-500/20" : 
                        "bg-red-500/10 border-red-500/20"
                    }`}>
                        <div className="flex items-center gap-5 mb-8">
                            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-xl ${
                                scanResult.status === "valid" ? "bg-green-500 text-white shadow-green-500/20" : 
                                scanResult.status === "already_used" ? "bg-amber-500 text-white shadow-amber-500/20" : 
                                "bg-red-500 text-white shadow-red-500/20"
                            }`}>
                                {scanResult.status === "valid" ? <CheckCircle size={36} /> : 
                                 scanResult.status === "requires_action" ? <AlertCircle size={36} /> :  
                                 scanResult.status === "already_used" ? <AlertCircle size={36} /> : 
                                 <XCircle size={36} />}
                            </div>
                            <div>
                                <h3 className="text-2xl font-black italic uppercase leading-tight tracking-tight">
                                    {scanResult.isHistoryClick && scanResult.status === "already_used" ? "TICKET DETAILS" : (scanResult.status === "valid" ? "Access Granted" : 
                                     scanResult.status === "requires_action" ? "Verify ID" : 
                                     scanResult.status === "rejected" ? "Entry Rejected" :  
                                     scanResult.status === "already_used" ? "Ticket Scanned" : 
                                     scanResult.status === "wrong_event" ? "Wrong Event" :
                                     scanResult.status === "unpaid" ? "Payment Pending" :
                                     "Invalid QR")}
                                </h3>
                                <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${
                                    scanResult.status === "valid" ? "text-green-500" : 
                                    scanResult.status === "requires_action" ? "text-blue-500" : 
                                    scanResult.status === "already_used" ? (scanResult.isHistoryClick ? "text-white/60" : "text-amber-500") : 
                                    "text-red-400"
                                }`}>
                                    {scanResult.status === "valid" ? "Verified & Checked-In" : 
                                     scanResult.status === "requires_action" ? "Action Required • Awaiting Approval" :  
                                     scanResult.status === "already_used" ? (scanResult.isHistoryClick ? "Previously Scanned" : "Duplicate Scan Blocked") : 
                                     "Security Alert • Blocked"}
                                </p>
                            </div>
                        </div>

                        {scanResult.attendee && (
                            <div className="space-y-4">
                                <div className="p-5 rounded-3xl bg-white/5 border border-[#1F1F2E] space-y-4">
                                    <div>
                                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Attendee</p>
                                        <p className="text-lg font-black italic uppercase text-white">{scanResult.attendee || "Guest Attendee"}</p>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Ticket ID</p>
                                            <p className="text-xs font-bold text-zinc-400">#{(scanResult.ticket_code || scanResult.booking_id || "00000000").slice(-8).toUpperCase()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Quantity</p>
                                            <p className="text-xs font-bold text-zinc-400">{1} Person(s)</p>
                                        </div>
                                    </div>

                                    {scanResult.marathon_details && (
                                        <div className="pt-4 border-t border-[#1F1F2E] grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[9px] font-black text-pink-400 uppercase tracking-widest mb-1">Bib Number</p>
                                                <p className="text-sm font-black italic text-white">{scanResult.marathon_details.bib_number || "TBD"}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-pink-400 uppercase tracking-widest mb-1">T-Shirt Size</p>
                                                <p className="text-sm font-black italic text-white">{scanResult.marathon_details.tshirt_size || "N/A"}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {scanResult.status === "requires_action" && (
                                    <div className="pt-4 border-t border-[#1F1F2E] space-y-4">
                                        <div className="p-4 rounded-2xl bg-[#13131A] border border-[#1F1F2E] space-y-2">
                                            <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest flex items-center gap-2">
                                                <ShieldAlert size={14} /> ID Verification Required
                                            </p>
                                            <div className="space-y-1">
                                                {(scanResult.verificationSettings?.accepted_id_types || []).map((idType, idx) => (
                                                    <label key={idx} className="flex items-center gap-2 text-xs font-bold text-white">
                                                        <input type="checkbox" className="w-3 h-3 accent-[#8C7B6B]" /> 
                                                        Check {idType}
                                                    </label>
                                                ))}
                                                <label className="flex items-center gap-2 text-xs font-bold text-white">
                                                    <input type="checkbox" className="w-3 h-3 accent-[#8C7B6B]" /> 
                                                    Match Photo & Name
                                                </label>
                                            </div>
                                        </div>

                                        {!showRejectModal ? (
                                            <div className="grid grid-cols-2 gap-3">
                                                <button 
                                                    onClick={() => handleAction('approve')}
                                                    disabled={isActioning}
                                                    className="py-4 rounded-2xl bg-green-500 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-green-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                                >
                                                    <CheckCircle size={16} /> Approve
                                                </button>
                                                <button 
                                                    onClick={() => setShowRejectModal(true)}
                                                    disabled={isActioning}
                                                    className="py-4 rounded-2xl bg-red-500 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                                >
                                                    <XCircle size={16} /> Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-3">
                                                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Rejection Reason</p>
                                                <select 
                                                    value={rejectionReason}
                                                    onChange={e => setRejectionReason(e.target.value)}
                                                    className="w-full bg-white border border-red-500/20 rounded-xl px-4 py-3 text-white text-sm font-bold outline-none"
                                                >
                                                    <option value="">Select a reason...</option>
                                                    <option value="Invalid ID Proof">Invalid ID Proof</option>
                                                    <option value="Name Mismatch">Name Mismatch</option>
                                                    <option value="Underage">Underage</option>
                                                    <option value="Suspicious Booking">Suspicious Booking</option>
                                                    <option value="Intoxicated/Unruly">Intoxicated/Unruly</option>
                                                </select>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => setShowRejectModal(false)}
                                                        className="flex-1 py-3 rounded-xl bg-white border border-[#1F1F2E] text-zinc-400 font-black uppercase tracking-widest text-[10px]"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button 
                                                        onClick={() => handleAction('reject')}
                                                        disabled={!rejectionReason || isActioning}
                                                        className="flex-1 py-3 rounded-xl bg-red-500 text-white font-black uppercase tracking-widest text-[10px] disabled:opacity-50"
                                                    >
                                                        Confirm Reject
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {scanResult.status === "already_used" && (
                                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex gap-3 items-start">
                                        <Clock size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-0.5">First Scan History</p>
                                            <p className="text-[10px] text-amber-500/80">
                                                Time: {new Date(scanResult.scanned_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <button 
                            onClick={() => setScanResult(null)}
                            className="w-full mt-6 py-4 rounded-2xl bg-white/5 border border-[#1F1F2E] text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all"
                        >
                            Dismiss & Clear
                        </button>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Manual Audit</label>
                        <Search size={14} className="text-zinc-400" />
                    </div>
                    <div className="relative group">
                        <input 
                            type="text" 
                            placeholder="Enter Booking ID or Ticket Code..." 
                            value={scanInput}
                            onChange={(e) => setScanInput(e.target.value)}
                            className="w-full bg-[#13131A] border border-[#1F1F2E] rounded-2xl px-6 py-5 text-white font-bold outline-none focus:border-pink-500/50 transition-all placeholder:text-zinc-400"
                        />
                        <button 
                            onClick={() => handleValidate(scanInput)}
                            disabled={isValidating || !scanInput}
                            className="absolute right-2 top-2 bottom-2 px-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-95 disabled:opacity-30 transition-all shadow-lg shadow-purple-500/20"
                        >
                            {isValidating ? "..." : "Verify"}
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Live Activity</h3>
                        <div className="px-2 py-0.5 rounded bg-green-500/10 text-[8px] font-bold text-green-500 uppercase tracking-widest">Syncing</div>
                    </div>
                    <div className="space-y-3">
                        {recentScans.map((scan) => (
                            <button 
                                key={scan.id} 
                                onClick={() => handleValidate(scan.ticket_code || scan.ticket_id, true)}
                                className="w-full text-left group p-4 rounded-3xl bg-[#13131A] border border-[#1F1F2E] flex items-center justify-between hover:border-pink-500/50 hover:bg-pink-500/5 transition-all cursor-pointer"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                        scan.scan_status?.toLowerCase() === 'success' ? 'bg-green-500/10 text-green-500' :
                                        scan.scan_status?.toLowerCase() === 'rejected' ? 'bg-red-500/10 text-red-500' :
                                        'bg-amber-500/10 text-amber-500'
                                    }`}>
                                        {scan.scan_status?.toLowerCase() === 'success' ? <UserCheck size={18} /> : 
                                         scan.scan_status?.toLowerCase() === 'rejected' ? <XCircle size={18} /> : 
                                         <AlertCircle size={18} />}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black italic uppercase text-white leading-none mb-1">
                                            {scan.scan_status?.toLowerCase() === 'success' ? 'Entry Approved' :
                                             scan.scan_status?.toLowerCase() === 'rejected' ? 'Entry Rejected' :
                                             scan.scan_status}
                                        </p>
                                        <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">
                                            Gate: {scan.gate_name || gateName} • {new Date(scan.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Ticket ID</p>
                                    <p className="text-[10px] font-mono text-zinc-400">#{scan.ticket_code?.slice(-6).toUpperCase() || scan.ticket_id?.slice(-6).toUpperCase()}</p>
                                </div>
                            </button>
                        ))}
                        {recentScans.length === 0 && (
                            <div className="text-center py-16 bg-white/5 rounded-[3rem] border border-dashed border-pink-500/50 text-zinc-400">
                                <QrCode size={64} className="mx-auto mb-4 opacity-30" />
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Awaiting First Scan</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Bottom Nav Simulation */}
            <div className="flex-none w-full border-t border-[#1F1F2E] bg-[#0A0A0E]">
                <div className="max-w-lg mx-auto p-4">
                    <button 
                        onClick={() => router.push('/')}
                        className="w-full py-4 rounded-[1.5rem] bg-gradient-to-r from-pink-600 to-purple-600 text-white text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-purple-500/20 active:scale-95 transition-all"
                    >
                        <Home size={18} /> Exit to Portal Home
                    </button>
                </div>
            </div>

            {/* Custom Scan Animation Keyframes */}
            <style jsx global>{`
                @keyframes scan {
                    0% { top: 0%; opacity: 0; }
                    5% { opacity: 1; }
                    95% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                .animate-scan {
                    position: absolute;
                    animation: scan 2s linear infinite;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
