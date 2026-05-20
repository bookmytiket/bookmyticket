"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
    QrCode, 
    Search, 
    LogOut, 
    ShieldCheck, 
    Clock, 
    AlertTriangle, 
    UserCheck, 
    CheckCircle2, 
    XCircle, 
    Sparkles, 
    Activity, 
    Smartphone, 
    RefreshCw,
    MapPin,
    Lock,
    Mail
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthContext";

const THEME = {
    bg: "#FAF8F5",       // Rich Sandal White / Cream
    cardBg: "#FFFFFF",   // Pure White
    border: "#EFECE6",   // Warm Cream Border
    borderFocus: "#D2C5B4", // Medium Taupe Focus
    textMain: "#2C2520", // Dark Espresso / Roasted Cocoa
    textSub: "#7A7067",  // Clay Taupe / Warm Grey
    accent: "#8C7B6B",   // Sandal Oak / Earthy Brown
    accentLight: "#F2EDE4", // Light Sandal Glow
    success: "#4B6B55",  // Slate Moss Green
    danger: "#A35252",   // Terracotta Red
    warning: "#C59648"   // Warm Ochre Gold
};

export default function ScannerPortal() {
    const { user, login, logout, loading: authLoading } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    // Login Form State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loginError, setLoginError] = useState("");
    const [loginLoading, setLoginLoading] = useState(false);

    // Portal State
    const [staffDetails, setStaffDetails] = useState(null);
    const [assignedEvent, setAssignedEvent] = useState(null);
    const [stats, setStats] = useState({ success: 0, duplicate: 0, total: 0 });
    const [recentScans, setRecentScans] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(false);

    // QR Scan / Manual State
    const [scanInput, setScanInput] = useState("");
    const [isValidating, setIsValidating] = useState(false);
    const [validationResult, setValidationResult] = useState(null);
    const [scannerMode, setScannerMode] = useState("dashboard"); // "dashboard", "camera", "manual"
    const [cameraActive, setCameraActive] = useState(false);
    
    // Html5Qrcode state
    const qrScannerRef = useRef(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Load Staff Data & Live Stats
    const loadStaffPortalData = async (userId) => {
        if (!userId) return;
        setIsLoadingData(true);
        try {
            // 1. Fetch Staff Profile Gating
            const { data: staff, error: staffErr } = await supabase
                .from('staff')
                .select('*')
                .eq('auth_user_id', userId)
                .maybeSingle();

            if (staffErr) throw staffErr;
            
            if (!staff) {
                // If not registered in staff table, allow Organizer/Admin roles as a convenience
                if (user?.role === 'organiser' || user?.role === 'admin') {
                    setStaffDetails({
                        name: user.name || "Administrator",
                        email: user.email,
                        role: user.role,
                        assigned_event_id: null,
                        gate_name: "Admin Master Gate"
                    });
                } else {
                    setLoginError("Access Denied: Your account does not have staff scan permissions.");
                    logout();
                    return;
                }
            } else {
                setStaffDetails(staff);
            }

            const targetEventId = staff?.assigned_event_id || user?.assigned_event_id;
            
            // 2. Fetch Assigned Event Details
            if (targetEventId) {
                const { data: event } = await supabase
                    .from('events')
                    .select('*')
                    .eq('id', targetEventId)
                    .maybeSingle();
                setAssignedEvent(event);
            }

            // 3. Fetch Recent Scan Logs for this staff member
            const { data: logs } = await supabase
                .from('ticket_scan_logs')
                .select('*')
                .eq('scanned_by', userId)
                .order('created_at', { ascending: false })
                .limit(5);
            setRecentScans(logs || []);

            // 4. Calculate Stats
            const { data: allLogs } = await supabase
                .from('ticket_scan_logs')
                .select('scan_status')
                .eq('scanned_by', userId);
            
            if (allLogs) {
                const successCount = allLogs.filter(l => l.scan_status === 'success' || l.scan_status === 'scanned').length;
                const duplicateCount = allLogs.filter(l => l.scan_status === 'duplicate' || l.scan_status === 'already_used').length;
                setStats({
                    success: successCount,
                    duplicate: duplicateCount,
                    total: allLogs.length
                });
            }
        } catch (err) {
            console.error("[Scanner Portal] Error loading data:", err.message);
        } finally {
            setIsLoadingData(false);
        }
    };

    useEffect(() => {
        if (mounted && user?.id) {
            loadStaffPortalData(user.id);
        }
    }, [mounted, user?.id]);

    // Handle Staff Authentication
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError("");
        setLoginLoading(true);
        try {
            const res = await login(email, password);
            if (!res?.success) {
                setLoginError(res?.error || "Invalid credentials. Please try again.");
            }
        } catch (err) {
            setLoginError("System Connection Error. Please try again.");
        } finally {
            setLoginLoading(false);
        }
    };

    // Handle Scan Ticket Validation (Manual or QR)
    const handleVerifyTicket = async (payload) => {
        if (!payload) return;
        setIsValidating(true);
        setValidationResult(null);
        try {
            const response = await fetch("/api/scanner/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    qrPayload: payload,
                    deviceUuid: "portal-web-scanner",
                    deviceName: "Web Console Scanner",
                    gateName: staffDetails?.gate_name || "Main Gate",
                    scannerUserId: user?.id
                })
            });

            const data = await response.json();
            setValidationResult(data);

            // Play Sound Feedback based on status
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                
                if (data.status === 'scanned' || data.status === 'success') {
                    osc.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch (Success)
                    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                    osc.start();
                    osc.stop(audioCtx.currentTime + 0.15);
                } else {
                    osc.frequency.setValueAtTime(220, audioCtx.currentTime); // Low pitch (Error/Warning)
                    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                    osc.start();
                    osc.stop(audioCtx.currentTime + 0.3);
                }
            } catch (soundErr) {}

            // Reload stats and activity
            loadStaffPortalData(user?.id);
        } catch (err) {
            setValidationResult({
                status: "invalid",
                title: "NETWORK ERROR",
                message: "Failed to connect to the validator service.",
                color: "red"
            });
        } finally {
            setIsValidating(false);
        }
    };

    // Initialize Camera Scanner (Html5Qrcode)
    const startCamera = async () => {
        setScannerMode("camera");
        setCameraActive(true);
        setTimeout(() => {
            const { Html5Qrcode } = require("html5-qrcode");
            const scanner = new Html5Qrcode("reader");
            qrScannerRef.current = scanner;
            scanner.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                (decodedText) => {
                    scanner.stop();
                    setCameraActive(false);
                    setScannerMode("dashboard");
                    handleVerifyTicket(decodedText);
                },
                (errorMessage) => {}
            ).catch(err => {
                console.error("Camera init failed:", err);
            });
        }, 100);
    };

    const stopCamera = () => {
        if (qrScannerRef.current && cameraActive) {
            qrScannerRef.current.stop().then(() => {
                setCameraActive(false);
                setScannerMode("dashboard");
            }).catch(err => console.error(err));
        } else {
            setScannerMode("dashboard");
        }
    };

    if (!mounted) return null;

    // 1. GUEST/UNAUTHENTICATED STAFF LOGIN UI (Sandal White Theme)
    if (!user) {
        return (
            <div className="login-screen">
                <style>{`
                    .login-screen {
                        min-height: 100vh;
                        background: ${THEME.bg};
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-family: 'Inter', sans-serif;
                        padding: 24px;
                        color: ${THEME.textMain};
                    }
                    .login-card {
                        width: 100%;
                        max-width: 420px;
                        background: ${THEME.cardBg};
                        border: 1px solid ${THEME.border};
                        border-radius: 32px;
                        padding: 40px 32px;
                        box-shadow: 0 12px 40px rgba(44, 37, 32, 0.03);
                        text-align: center;
                    }
                    .brand-badge {
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        background: ${THEME.accentLight};
                        color: ${THEME.accent};
                        padding: 8px 16px;
                        border-radius: 50px;
                        font-size: 10px;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.1em;
                        margin-bottom: 24px;
                    }
                    .login-title {
                        font-size: 26px;
                        font-weight: 900;
                        letter-spacing: -0.03em;
                        margin-bottom: 8px;
                        text-transform: uppercase;
                        font-style: italic;
                    }
                    .login-sub {
                        color: ${THEME.textSub};
                        font-size: 13px;
                        margin-bottom: 32px;
                        font-weight: 500;
                    }
                    .input-group {
                        position: relative;
                        margin-bottom: 20px;
                        text-align: left;
                    }
                    .input-label {
                        display: block;
                        font-size: 10px;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        color: ${THEME.textSub};
                        margin-bottom: 8px;
                    }
                    .input-field {
                        width: 100%;
                        background: ${THEME.bg};
                        border: 1px solid ${THEME.border};
                        border-radius: 16px;
                        padding: 16px 20px 16px 48px;
                        color: ${THEME.textMain};
                        font-size: 14px;
                        font-weight: 600;
                        outline: none;
                        transition: all 0.2s;
                    }
                    .input-field:focus {
                        border-color: ${THEME.borderFocus};
                        background: #fff;
                    }
                    .input-icon {
                        position: absolute;
                        left: 18px;
                        bottom: 17px;
                        color: ${THEME.textSub};
                    }
                    .submit-btn {
                        width: 100%;
                        background: ${THEME.accent};
                        color: #fff;
                        border: none;
                        border-radius: 18px;
                        padding: 18px;
                        font-size: 12px;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.1em;
                        cursor: pointer;
                        transition: all 0.2s;
                        box-shadow: 0 8px 24px rgba(140, 123, 107, 0.2);
                        margin-top: 12px;
                    }
                    .submit-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 12px 28px rgba(140, 123, 107, 0.3);
                    }
                    .submit-btn:active {
                        transform: translateY(0);
                    }
                    .error-banner {
                        background: rgba(163, 82, 82, 0.08);
                        border: 1px solid rgba(163, 82, 82, 0.2);
                        color: ${THEME.danger};
                        font-size: 12px;
                        font-weight: 700;
                        padding: 14px;
                        border-radius: 16px;
                        margin-bottom: 24px;
                        text-align: left;
                    }
                `}</style>

                <div className="login-card">
                    <div className="brand-badge">
                        <ShieldCheck size={12} /> SECURE GATE MANAGEMENT
                    </div>
                    <h1 className="login-title">Staff Portal</h1>
                    <p className="login-sub">Access BookMyTicket Scanner Control Room</p>

                    {loginError && (
                        <div className="error-banner flex gap-2 items-center">
                            <AlertTriangle size={14} className="shrink-0" />
                            <span>{loginError}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin}>
                        <div className="input-group">
                            <label className="input-label">Staff Email ID</label>
                            <div className="relative">
                                <Mail size={16} className="input-icon" />
                                <input 
                                    type="email" 
                                    required
                                    placeholder="name@bookmyticket.net"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-field"
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Access Password</label>
                            <div className="relative">
                                <Lock size={16} className="input-icon" />
                                <input 
                                    type="password" 
                                    required
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-field"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loginLoading}
                            className="submit-btn"
                        >
                            {loginLoading ? "Verifying Keys..." : "Authorize Access"}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // 2. STAFF SCANNER PORTAL DASHBOARD (Sandal White Premium Redesign)
    return (
        <div className="portal-container">
            <style>{`
                .portal-container {
                    min-height: 100vh;
                    background: ${THEME.bg};
                    font-family: 'Inter', sans-serif;
                    color: ${THEME.textMain};
                    padding-bottom: 120px;
                }
                .portal-header {
                    background: ${THEME.cardBg};
                    border-bottom: 1px solid ${THEME.border};
                    padding: 20px 24px;
                    position: sticky;
                    top: 0;
                    z-index: 100;
                }
                .header-wrapper {
                    max-width: 600px;
                    margin: 0 auto;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .staff-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .staff-avatar {
                    width: 44px;
                    height: 44px;
                    border-radius: 14px;
                    background: ${THEME.accentLight};
                    color: ${THEME.accent};
                    font-weight: 900;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                }
                .staff-meta h4 {
                    font-size: 14px;
                    font-weight: 900;
                    margin: 0;
                }
                .staff-meta p {
                    font-size: 10px;
                    font-weight: 800;
                    text-transform: uppercase;
                    color: ${THEME.textSub};
                    margin: 0;
                    letter-spacing: 0.05em;
                }
                .logout-btn {
                    padding: 10px;
                    border-radius: 12px;
                    border: 1px solid ${THEME.border};
                    background: ${THEME.cardBg};
                    cursor: pointer;
                    color: ${THEME.textSub};
                    transition: all 0.2s;
                }
                .logout-btn:hover {
                    color: ${THEME.danger};
                    border-color: rgba(163, 82, 82, 0.2);
                    background: rgba(163, 82, 82, 0.05);
                }
                .portal-body {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 24px;
                }
                .event-card {
                    background: ${THEME.cardBg};
                    border: 1px solid ${THEME.border};
                    border-radius: 28px;
                    padding: 24px;
                    margin-bottom: 24px;
                    box-shadow: 0 4px 20px rgba(44, 37, 32, 0.01);
                }
                .stat-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                    margin-bottom: 24px;
                }
                .stat-card {
                    background: ${THEME.cardBg};
                    border: 1px solid ${THEME.border};
                    border-radius: 20px;
                    padding: 16px;
                    text-align: center;
                }
                .stat-value {
                    font-size: 24px;
                    font-weight: 900;
                    margin-bottom: 4px;
                }
                .stat-label {
                    font-size: 9px;
                    font-weight: 800;
                    text-transform: uppercase;
                    color: ${THEME.textSub};
                    letter-spacing: 0.05em;
                }
                .action-card {
                    background: ${THEME.cardBg};
                    border: 1px solid ${THEME.border};
                    border-radius: 28px;
                    padding: 28px;
                    text-align: center;
                    margin-bottom: 24px;
                    box-shadow: 0 6px 24px rgba(44, 37, 32, 0.02);
                }
                .scan-trigger-btn {
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    background: ${THEME.accent};
                    color: #fff;
                    border: 6px solid ${THEME.accentLight};
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    box-shadow: 0 8px 30px rgba(140, 123, 107, 0.3);
                    margin-bottom: 16px;
                }
                .scan-trigger-btn:hover {
                    transform: scale(1.08);
                    box-shadow: 0 12px 36px rgba(140, 123, 107, 0.4);
                }
                .activity-list {
                    background: ${THEME.cardBg};
                    border: 1px solid ${THEME.border};
                    border-radius: 28px;
                    padding: 24px;
                }
                .activity-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 14px 0;
                    border-bottom: 1px solid ${THEME.border};
                }
                .activity-item:last-child {
                    border-bottom: none;
                }
                .activity-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }
                .manual-panel {
                    background: ${THEME.cardBg};
                    border: 1px solid ${THEME.border};
                    border-radius: 28px;
                    padding: 24px;
                    margin-bottom: 24px;
                }
                .manual-input-wrap {
                    display: flex;
                    gap: 8px;
                    margin-top: 12px;
                }
                .manual-input {
                    flex: 1;
                    background: ${THEME.bg};
                    border: 1px solid ${THEME.border};
                    border-radius: 16px;
                    padding: 16px;
                    font-size: 14px;
                    font-weight: 700;
                    outline: none;
                }
                .manual-input:focus {
                    border-color: ${THEME.borderFocus};
                }
                .manual-btn {
                    background: ${THEME.accent};
                    color: #fff;
                    border: none;
                    border-radius: 16px;
                    padding: 0 24px;
                    font-size: 12px;
                    font-weight: 800;
                    text-transform: uppercase;
                    cursor: pointer;
                }
                .camera-viewfinder {
                    position: fixed;
                    inset: 0;
                    background: #000;
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                }
                .camera-header {
                    padding: 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    color: #fff;
                    z-index: 1010;
                }
                .camera-container {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }
                .scan-overlay-box {
                    width: 260px;
                    height: 260px;
                    border: 4px solid #fff;
                    border-radius: 24px;
                    box-shadow: 0 0 0 9999px rgba(0,0,0,0.6);
                    position: relative;
                    z-index: 1005;
                }
                .scan-line {
                    position: absolute;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: ${THEME.accent};
                    box-shadow: 0 0 12px ${THEME.accent};
                    border-radius: 2px;
                    animation: scanLine 2s ease-in-out infinite;
                }
                @keyframes scanLine {
                    0% { top: 0%; }
                    50% { top: 100%; }
                    100% { top: 0%; }
                }
            `}</style>

            {/* A. Camera Viewfinder Overlay */}
            {scannerMode === "camera" && (
                <div className="camera-viewfinder">
                    <div className="camera-header">
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-white/90">Staff Lens active</h3>
                            <p className="text-[10px] text-white/50 uppercase tracking-widest">{staffDetails?.gate_name || "Main Gate"}</p>
                        </div>
                        <button onClick={stopCamera} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white">
                            Close
                        </button>
                    </div>
                    <div className="camera-container">
                        <div id="reader" style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}></div>
                        <div className="scan-overlay-box">
                            <div className="scan-line"></div>
                        </div>
                    </div>
                </div>
            )}

            {/* B. Main Header */}
            <header className="portal-header">
                <div className="header-wrapper">
                    <div className="staff-info">
                        <div className="staff-avatar">
                            {staffDetails?.name?.[0]?.toUpperCase() || "S"}
                        </div>
                        <div className="staff-meta">
                            <h4>{staffDetails?.name || "Staff Member"}</h4>
                            <p>{staffDetails?.role || "Gate Operator"} • {staffDetails?.gate_name || "Main Gate"}</p>
                        </div>
                    </div>
                    <button onClick={logout} className="logout-btn" title="Sign Out">
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            {/* C. Body */}
            <main className="portal-body">
                {/* 1. Validation Modal Overlay */}
                {validationResult && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-6" onClick={() => setValidationResult(null)}>
                        <div className="w-full max-w-sm bg-white rounded-[2rem] p-8 border border-neutral-100 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{
                                background: validationResult.color === 'green' ? `${THEME.success}15` : (validationResult.color === 'yellow' ? `${THEME.warning}15` : `${THEME.danger}15`),
                                color: validationResult.color === 'green' ? THEME.success : (validationResult.color === 'yellow' ? THEME.warning : THEME.danger)
                            }}>
                                {validationResult.color === 'green' ? <CheckCircle2 size={36} /> : (validationResult.color === 'yellow' ? <AlertTriangle size={36} /> : <XCircle size={36} />)}
                            </div>
                            
                            <h2 className="text-xl font-black uppercase tracking-tight mb-2" style={{
                                color: validationResult.color === 'green' ? THEME.success : (validationResult.color === 'yellow' ? THEME.warning : THEME.danger)
                            }}>
                                {validationResult.title || "SCAN RESULT"}
                            </h2>
                            
                            <p className="text-sm font-bold text-neutral-800 mb-6">
                                {validationResult.message}
                            </p>

                            {validationResult.attendee && (
                                <div className="p-4 bg-neutral-50 rounded-2xl text-left border border-neutral-100 space-y-2 mb-6">
                                    <div>
                                        <p className="text-[8px] font-black text-neutral-400 uppercase tracking-widest">Attendee Name</p>
                                        <p className="text-xs font-bold text-neutral-800">{validationResult.attendee}</p>
                                    </div>
                                    {validationResult.event && (
                                        <div>
                                            <p className="text-[8px] font-black text-neutral-400 uppercase tracking-widest">Target Event</p>
                                            <p className="text-xs font-bold text-neutral-800">{validationResult.event}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <button 
                                onClick={() => setValidationResult(null)}
                                className="w-full py-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                            >
                                Dismiss Result
                            </button>
                        </div>
                    </div>
                )}

                {/* 2. Assigned Event Listing */}
                <div className="event-card">
                    <div className="flex gap-2 items-center text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3">
                        <MapPin size={12} className="text-neutral-400" />
                        <span>Active Assigned Station</span>
                    </div>
                    {assignedEvent ? (
                        <div>
                            <h2 className="text-lg font-black uppercase italic tracking-tight mb-1">{assignedEvent.title}</h2>
                            <p className="text-xs text-neutral-500 font-medium">{assignedEvent.venue || assignedEvent.location || "Online Meeting"}</p>
                        </div>
                    ) : (
                        <div>
                            <h2 className="text-lg font-black uppercase italic text-neutral-400 tracking-tight mb-1">Unassigned Console</h2>
                            <p className="text-xs text-neutral-400 font-medium">Please contact supervisor to allocate event</p>
                        </div>
                    )}
                </div>

                {/* 3. Stat Cards */}
                <div className="stat-grid">
                    <div className="stat-card">
                        <div className="stat-value text-slate-800">{stats.total}</div>
                        <div className="stat-label">Total Logs</div>
                    </div>
                    <div className="stat-card" style={{ borderLeft: `3px solid ${THEME.success}` }}>
                        <div className="stat-value" style={{ color: THEME.success }}>{stats.success}</div>
                        <div className="stat-label">Admitted</div>
                    </div>
                    <div className="stat-card" style={{ borderLeft: `3px solid ${THEME.warning}` }}>
                        <div className="stat-value" style={{ color: THEME.warning }}>{stats.duplicate}</div>
                        <div className="stat-label">Duplicate</div>
                    </div>
                </div>

                {/* 4. Action Card */}
                <div className="action-card">
                    <button 
                        onClick={startCamera}
                        className="scan-trigger-btn"
                        title="Scan QR Code"
                    >
                        <QrCode size={36} />
                    </button>
                    <h3 className="text-md font-black uppercase tracking-tight text-neutral-800">Launch Scanner</h3>
                    <p className="text-xs text-neutral-500 font-medium mt-1">Activate device camera to check-in attendee pass</p>
                </div>

                {/* 5. Manual Override Panel */}
                <div className="manual-panel">
                    <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400">Manual Check-In Lookup</h3>
                    <div className="manual-input-wrap">
                        <input 
                            type="text" 
                            placeholder="Enter Ticket Number or Booking Suffix..." 
                            value={scanInput}
                            onChange={(e) => setScanInput(e.target.value)}
                            className="manual-input"
                        />
                        <button 
                            onClick={() => handleVerifyTicket(scanInput)}
                            disabled={isValidating || !scanInput}
                            className="manual-btn"
                        >
                            {isValidating ? "..." : "Verify"}
                        </button>
                    </div>
                </div>

                {/* 6. Live Activity */}
                <div className="activity-list">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400">Station Activity Feed</h3>
                        <Activity size={14} className="text-neutral-300" />
                    </div>
                    <div className="space-y-1">
                        {recentScans.map((log) => (
                            <div key={log.id} className="activity-item">
                                <div className="activity-left">
                                    <div className="status-dot" style={{
                                        background: log.scan_status === 'success' || log.scan_status === 'scanned' ? THEME.success : THEME.danger
                                    }}></div>
                                    <div>
                                        <p className="text-xs font-bold text-neutral-800 uppercase tracking-tight leading-none mb-1">
                                            {log.ticket_code || "PASS SCAN"}
                                        </p>
                                        <p className="text-[9px] text-neutral-400 font-medium">
                                            {new Date(log.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest" style={{
                                    color: log.scan_status === 'success' || log.scan_status === 'scanned' ? THEME.success : THEME.danger
                                }}>
                                    {log.scan_status}
                                </span>
                            </div>
                        ))}
                        {recentScans.length === 0 && (
                            <div className="text-center py-10 opacity-30">
                                <p className="text-[10px] font-black uppercase tracking-widest">No scans recorded on this turn</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
