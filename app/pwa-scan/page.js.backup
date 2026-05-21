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

    const handleValidate = async (id) => {
        if (!id || isExpired) return;
        setIsValidating(true);
        setScanResult(null);

        try {
            const res = await fetch("/api/scanner/validate", {
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
                if (data.status === "valid") {
                    setScanResult({
                        status: "valid",
                        booking: {
                            id: data.ticket_code || id.slice(-8),
                            full_name: data.attendee,
                            event_name: data.event,
                            ticket_category: data.category
                        }
                    });
                    showToast("Entry Approved", "success");
                    refetchScanLogs();
                } else if (data.status === "already_used") {
                    setScanResult({
                        status: "already_used",
                        booking: {
                            id: data.ticket_code || id.slice(-8),
                            full_name: data.attendee,
                            event_name: data.event,
                            scanned_at: data.scanned_at || new Date().toISOString()
                        }
                    });
                    showToast("Already Checked-In", "warning");
                } else {
                    setScanResult({
                        status: data.status,
                        message: data.message || "Invalid Ticket"
                    });
                }
            } else {
                setScanResult({
                    status: data.status || "invalid",
                    message: data.message || "Invalid QR Code"
                });
            }
        } catch (err) {
            setScanResult({ status: "error", message: err.message });
        } finally {
            setIsValidating(false);
        }
    };

    const recentScans = useMemo(() => {
        return scanLogs
            .filter(log => log.scan_status?.toLowerCase() === 'success' || log.scan_status?.toLowerCase() === 'scanned')
            .slice(0, 15);
    }, [scanLogs]);

    if (isExpired) {
        return (
            <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-8 text-center">
                <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-6">
                    <ShieldAlert size={48} />
                </div>
                <h2 className="text-2xl font-black italic uppercase tracking-tight text-[#2C2520] mb-2">Access Expired</h2>
                <p className="text-[#7A7067] text-sm mb-8">Your scan access period has ended. Please contact your organiser for renewal.</p>
                <button onClick={() => logout()} className="px-8 py-4 bg-[#2C2520] text-[#FFFFFF] rounded-2xl font-black uppercase tracking-widest text-[11px]">Log Out</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAF8F5] text-[#2C2520] font-sans selection:bg-pink-500/30">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#FAF8F5]/80 backdrop-blur-xl border-b border-[#EFECE6] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#8C7B6B] flex items-center justify-center shadow-lg shadow-[#8C7B6B]/20">
                        <Zap size={20} className="text-white fill-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-black italic uppercase tracking-tighter leading-none">Scanner</h1>
                        <p className="text-[10px] font-bold text-[#7A7067] uppercase tracking-widest">Portal v2.0</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => window.location.reload()} className="p-2.5 rounded-xl bg-[#F2EDE4] border border-[#EFECE6] text-[#7A7067] hover:text-[#2C2520] transition-all">
                        <RefreshCw size={18} />
                    </button>
                    <button onClick={() => logout()} className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-[#2C2520] transition-all">
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            <main className="p-6 max-w-lg mx-auto space-y-8 pb-32">
                {/* Staff Info Card */}
                <div className="relative group">
                    <div className="absolute -inset-1 bg-[#8C7B6B] rounded-[2rem] opacity-20 blur group-hover:opacity-30 transition-all"></div>
                    <div className="relative p-5 rounded-[2rem] bg-[#FFFFFF] border border-[#EFECE6] flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-[#F2EDE4] border border-[#EFECE6] flex items-center justify-center text-2xl font-black italic text-transparent bg-clip-text bg-[#8C7B6B]">
                                {user?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-sm font-black italic uppercase tracking-tight">{user?.full_name || "Staff Member"}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    <p className="text-[10px] font-bold text-[#7A7067] uppercase tracking-widest">Live • {gateName}</p>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black text-[#7A7067] uppercase tracking-widest mb-1">Restricted</p>
                            <div className="px-2 py-1 rounded-lg bg-[#8C7B6B]/10 border border-[#8C7B6B]/20 text-[9px] font-bold text-[#8C7B6B] uppercase">
                                {assignedEventId ? "One Event" : "Global"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Gate Selector Simulation */}
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
                                gateName === g ? "bg-[#2C2520] text-[#FFFFFF]" : (features.multi_gate || g === "Main Entrance" ? "bg-[#F2EDE4] text-[#7A7067] border border-[#EFECE6]" : "bg-[#F2EDE4] text-[#7A7067] border border-[#EFECE6] cursor-not-allowed opacity-50")
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

                {/* Scanner Interface */}
                <div className="space-y-4">
                    {!isScannerOpen ? (
                        <button 
                            onClick={() => setIsScannerOpen(true)}
                            className="w-full aspect-square rounded-[3.5rem] bg-[#FFFFFF] border-2 border-dashed border-[#EFECE6] flex flex-col items-center justify-center gap-6 group hover:border-[#8C7B6B]/50 transition-all shadow-2xl"
                        >
                            <div className="w-24 h-24 rounded-full bg-[#F2EDE4] flex items-center justify-center text-[#8C7B6B] group-hover:scale-110 transition-all border border-[#8C7B6B]/30 shadow-2xl shadow-[#8C7B6B]/10">
                                <Camera size={40} />
                            </div>
                            <div className="text-center">
                                <span className="block text-xl font-black italic uppercase tracking-tight text-[#2C2520] mb-1">Start Scanning</span>
                                <span className="block text-[10px] font-bold text-[#7A7067] uppercase tracking-widest px-8">Point camera at the attendee's QR ticket for instant validation</span>
                            </div>
                        </button>
                    ) : (
                        <div className="relative aspect-square rounded-[3.5rem] overflow-hidden border-2 border-[#8C7B6B] shadow-2xl shadow-[#8C7B6B]/20">
                            <div id="pwa-qr-reader" className="w-full h-full bg-black"></div>
                            <button 
                                onClick={() => setIsScannerOpen(false)}
                                className="absolute top-6 right-6 p-4 bg-red-500 rounded-2xl text-[#2C2520] shadow-2xl active:scale-95 transition-all"
                            >
                                <X size={24} />
                            </button>
                            {/* Scanning Overlay */}
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 border-2 border-[#D2C5B4] rounded-3xl"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-1 bg-[#8C7B6B]/50 shadow-[0_0_15px_rgba(236,72,153,0.5)] animate-scan"></div>
                            </div>
                            <div className="absolute inset-x-0 bottom-10 flex justify-center">
                                <div className="px-6 py-3 bg-black/60 backdrop-blur-md rounded-full border border-[#EFECE6] text-[10px] font-black uppercase tracking-widest text-[#2C2520] shadow-2xl">
                                    Align QR in Frame
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#EFECE6] text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-12 h-12 bg-[#8C7B6B]/5 rounded-bl-[2rem]"></div>
                            <p className="text-[9px] font-black text-[#7A7067] uppercase tracking-widest mb-1">Session Scans</p>
                            <p className="text-3xl font-black italic text-[#2C2520]">{recentScans.length}</p>
                        </div>
                        <div className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#EFECE6] text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-12 h-12 bg-purple-500/5 rounded-bl-[2rem]"></div>
                            <p className="text-[9px] font-black text-[#7A7067] uppercase tracking-widest mb-1">Total Events</p>
                            <p className="text-3xl font-black italic text-[#2C2520]">{events.length}</p>
                        </div>
                    </div>
                </div>

                {/* Result Area */}
                {scanResult && (
                    <div className={`p-8 rounded-[3rem] border shadow-2xl animate-in fade-in zoom-in duration-300 ${
                        scanResult.status === "valid" ? "bg-green-500/10 border-green-500/20" : 
                        scanResult.status === "already_used" ? "bg-amber-500/10 border-amber-500/20" : 
                        "bg-red-500/10 border-red-500/20"
                    }`}>
                        <div className="flex items-center gap-5 mb-8">
                            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-xl ${
                                scanResult.status === "valid" ? "bg-green-500 text-[#2C2520] shadow-green-500/20" : 
                                scanResult.status === "already_used" ? "bg-amber-500 text-[#2C2520] shadow-amber-500/20" : 
                                "bg-red-500 text-[#2C2520] shadow-red-500/20"
                            }`}>
                                {scanResult.status === "valid" ? <CheckCircle size={36} /> : 
                                 scanResult.status === "already_used" ? <AlertCircle size={36} /> : 
                                 <XCircle size={36} />}
                            </div>
                            <div>
                                <h3 className="text-2xl font-black italic uppercase leading-tight tracking-tight">
                                    {scanResult.status === "valid" ? "Access Granted" : 
                                     scanResult.status === "already_used" ? "Ticket Scanned" : 
                                     scanResult.status === "wrong_event" ? "Wrong Event" :
                                     scanResult.status === "unpaid" ? "Payment Pending" :
                                     "Invalid QR"}
                                </h3>
                                <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${
                                    scanResult.status === "valid" ? "text-green-500" : 
                                    scanResult.status === "already_used" ? "text-amber-500" : 
                                    "text-red-400"
                                }`}>
                                    {scanResult.status === "valid" ? "Verified & Checked-In" : 
                                     scanResult.status === "already_used" ? "Duplicate Scan Blocked" : 
                                     "Security Alert • Blocked"}
                                </p>
                            </div>
                        </div>

                        {scanResult.booking && (
                            <div className="space-y-4">
                                <div className="p-5 rounded-3xl bg-[#F2EDE4] border border-[#EFECE6] space-y-4">
                                    <div>
                                        <p className="text-[9px] font-black text-[#7A7067] uppercase tracking-widest mb-1">Attendee</p>
                                        <p className="text-lg font-black italic uppercase text-[#2C2520]">{scanResult.booking.full_name || scanResult.booking.user_name || "Guest Attendee"}</p>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[9px] font-black text-[#7A7067] uppercase tracking-widest mb-1">Ticket ID</p>
                                            <p className="text-xs font-bold text-[#7A7067]">#{scanResult.booking.id.slice(-8).toUpperCase()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-[#7A7067] uppercase tracking-widest mb-1">Quantity</p>
                                            <p className="text-xs font-bold text-[#7A7067]">{scanResult.booking.ticket_count || 1} Person(s)</p>
                                        </div>
                                    </div>

                                    {/* Marathon Specifics */}
                                    {scanResult.booking.marathon_details && (
                                        <div className="pt-4 border-t border-[#EFECE6] grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[9px] font-black text-[#8C7B6B] uppercase tracking-widest mb-1">Bib Number</p>
                                                <p className="text-sm font-black italic text-[#2C2520]">{scanResult.booking.marathon_details.bib_number || "TBD"}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-[#8C7B6B] uppercase tracking-widest mb-1">T-Shirt Size</p>
                                                <p className="text-sm font-black italic text-[#2C2520]">{scanResult.booking.marathon_details.tshirt_size || "N/A"}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {scanResult.status === "already_used" && (
                                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex gap-3 items-start">
                                        <Clock size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-0.5">First Scan History</p>
                                            <p className="text-[10px] text-amber-500/80">
                                                Time: {new Date(scanResult.booking.scanned_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <button 
                            onClick={() => setScanResult(null)}
                            className="w-full mt-6 py-4 rounded-2xl bg-[#F2EDE4] border border-[#EFECE6] text-[10px] font-black uppercase tracking-widest text-[#7A7067] hover:text-[#2C2520] transition-all"
                        >
                            Dismiss & Clear
                        </button>
                    </div>
                )}

                {/* Manual Audit */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <label className="text-[10px] font-black text-[#7A7067] uppercase tracking-widest">Manual Audit</label>
                        <Search size={14} className="text-[#7A7067]" />
                    </div>
                    <div className="relative group">
                        <input 
                            type="text" 
                            placeholder="Enter Booking ID or Ticket Code..." 
                            value={scanInput}
                            onChange={(e) => setScanInput(e.target.value)}
                            className="w-full bg-[#FFFFFF] border border-[#EFECE6] rounded-2xl px-6 py-5 text-[#2C2520] font-bold outline-none focus:border-[#8C7B6B]/50 transition-all placeholder:text-[#7A7067]"
                        />
                        <button 
                            onClick={() => handleValidate(scanInput)}
                            disabled={isValidating || !scanInput}
                            className="absolute right-2 top-2 bottom-2 px-6 bg-[#8C7B6B] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-95 disabled:opacity-30 transition-all shadow-lg shadow-[#8C7B6B]/20"
                        >
                            {isValidating ? "..." : "Verify"}
                        </button>
                    </div>
                </div>

                {/* Session History */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-[10px] font-black text-[#7A7067] uppercase tracking-widest">Live Activity</h3>
                        <div className="px-2 py-0.5 rounded bg-green-500/10 text-[8px] font-bold text-green-500 uppercase tracking-widest">Syncing</div>
                    </div>
                    <div className="space-y-3">
                        {recentScans.map((scan) => (
                            <div key={scan.id} className="group p-4 rounded-3xl bg-[#FFFFFF] border border-[#EFECE6] flex items-center justify-between hover:border-[#8C7B6B]/30 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center">
                                        <UserCheck size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black italic uppercase text-[#2C2520] leading-none mb-1">Ticket Validated</p>
                                        <p className="text-[9px] text-[#7A7067] font-bold uppercase tracking-widest">
                                            Gate: {scan.gate_name || gateName} • {new Date(scan.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-[#7A7067] uppercase tracking-widest mb-0.5">Ticket ID</p>
                                    <p className="text-[10px] font-mono text-[#7A7067]">#{scan.ticket_code?.slice(-6).toUpperCase() || scan.ticket_id?.slice(-6).toUpperCase()}</p>
                                </div>
                            </div>
                        ))}
                        {recentScans.length === 0 && (
                            <div className="text-center py-16 bg-[#F2EDE4] rounded-[3rem] border border-dashed border-[#D2C5B4] text-[#7A7067]">
                                <QrCode size={64} className="mx-auto mb-4 opacity-30" />
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Awaiting First Scan</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Bottom Nav Simulation */}
            <div className="fixed bottom-0 inset-x-0 p-6 bg-gradient-to-t from-[#FAF8F5] via-[#FAF8F5] to-transparent">
                <button 
                    onClick={() => router.push('/')}
                    className="w-full py-5 rounded-[2rem] bg-[#2C2520] text-[#FFFFFF] text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-[#2C2520]/10 active:scale-95 transition-all"
                >
                    <Home size={18} /> Exit to Portal Home
                </button>
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
