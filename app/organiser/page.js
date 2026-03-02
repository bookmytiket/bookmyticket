"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    LayoutDashboard, Settings, Video, Image as ImageIcon, Sparkles,
    CheckCircle, Ticket, Users, Menu, Bell, Save, X, Plus, Trash2,
    Mail, Lock, CreditCard, Code, Globe, Shield, Wallet, Upload,
    ArrowRight, FileText, Calendar, Clock, MapPin, Building
} from "lucide-react";

export default function OrganiserPanel() {
    // Stages: mfa, kyc_docs, kyc_form, pending, approved
    const [currentStage, setCurrentStage] = useState("mfa");
    const [activeTab, setActiveTab] = useState("dashboard");
    const [theme, setTheme] = useState("dark");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Organiser Profile State
    const [profile, setProfile] = useState({
        firstName: "",
        lastName: "",
        orgType: "Individual",
        email: "organiser@example.com",
        phone: "",
        kycStatus: "Pending"
    });

    // Mock Wallet State
    const [wallet, setWallet] = useState({
        balance: 15450,
        currency: "₹",
        transactions: [
            { id: 1, type: "Booking", amount: 1200, date: "2026-03-01", status: "Completed" },
            { id: 2, type: "Withdrawal", amount: -5000, date: "2026-02-25", status: "Pending" }
        ]
    });

    const [events, setEvents] = useState([
        { id: 1, title: "Grand Wedding Expo", type: "Venue", venue: "Grand Ballroom, Marriott", date: "2026-04-15", time: "10:00 AM", status: "Active" },
        { id: 2, title: "Tech Innovators Summit", type: "Virtual", venue: "Zoom / Metaverse", date: "2026-05-10", time: "02:00 PM", status: "Active" }
    ]);

    // State for Modals
    const [showCreateEvent, setShowCreateEvent] = useState(false);
    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: "",
        type: "Venue",
        venue: "",
        slots: [{ date: "", time: "" }]
    });

    const addDateSlot = () => {
        setNewEvent({ ...newEvent, slots: [...newEvent.slots, { date: "", time: "" }] });
    };

    const removeDateSlot = (index) => {
        const updated = newEvent.slots.filter((_, i) => i !== index);
        setNewEvent({ ...newEvent, slots: updated });
    };

    const colors = {
        light: {
            bg: "#f0f4f8",
            sidebar: "#ffffff",
            header: "#ffffff",
            textMain: "#1e293b",
            textSub: "#64748b",
            cardBg: "#ffffff",
            border: "#e2e8f0",
            activeLink: "#e0f2fe",
            activeText: "#0369a1",
            sidebarBorder: "#f1f5f9"
        },
        dark: {
            bg: "#0f172a",
            sidebar: "#111827",
            header: "#111827",
            textMain: "#ffffff",
            textSub: "#cbd5e1",
            cardBg: "#1f2937",
            border: "#374151",
            activeLink: "#0ea5e920",
            activeText: "#38bdf8",
            sidebarBorder: "#1f2937"
        }
    };

    const t = colors[theme];
    const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

    const styles = (
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            .admin-container { 
                display: flex; 
                min-height: 100vh; 
                background-color: ${t.bg}; 
                color: ${t.textMain};
                font-family: 'Inter', sans-serif;
                -webkit-font-smoothing: antialiased;
                transition: all 0.3s ease;
            }
            .sidebar {
                width: 250px;
                background-color: ${t.sidebar};
                color: ${t.textSub};
                display: flex;
                flex-direction: column;
                position: fixed;
                height: 100vh;
                left: 0;
                top: 0;
                z-index: 100;
                border-right: 1px solid ${t.sidebarBorder};
                transition: transform 0.3s ease, background-color 0.3s ease;
            }
            .main-content {
                margin-left: 250px;
                flex: 1;
                display: flex;
                flex-direction: column;
                min-width: 0;
            }
            .top-header {
                height: 64px;
                background-color: ${t.header};
                border-bottom: 1px solid ${t.border};
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 24px;
                position: sticky;
                top: 0;
                z-index: 50;
            }
            .sidebar-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 10px 16px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 600;
                border-radius: 0 50px 50px 0;
                margin-right: 16px;
                transition: all 0.2s;
                border: none;
                background: none;
                width: calc(100% - 16px);
                color: ${t.textSub};
                text-align: left;
            }
            .sidebar-item.active {
                background-color: ${t.activeLink};
                color: ${t.activeText};
                font-weight: 600;
            }
            .stat-card {
                background-color: ${t.cardBg};
                padding: 20px;
                border-radius: 12px;
                border: 1px solid ${t.border};
                display: flex;
                flex-direction: column;
                position: relative;
                box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            }
            @media (max-width: 1024px) {
                .sidebar { transform: translateX(-100%); }
                .main-content { margin-left: 0; }
            }
        `}</style>
    );

    // MFA View Component
    const MFAView = () => (
        <div style={{ maxWidth: "450px", margin: "100px auto", textAlign: "center", backgroundColor: t.cardBg, padding: "40px", borderRadius: "20px", border: `1px solid ${t.border}`, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
            <div style={{ backgroundColor: "#3b82f615", width: "80px", height: "80px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                <Shield size={40} color="#3b82f6" />
            </div>
            <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "12px", color: t.textMain }}>Two-Factor Authentication</h2>
            <p style={{ color: t.textSub, fontSize: "14px", lineHeight: "1.6", marginBottom: "32px" }}>For your account security, please setup MFA using your preferred Authenticator App.</p>

            <div style={{ backgroundColor: "#fff", padding: "16px", borderRadius: "12px", width: "200px", height: "200px", margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${t.border}` }}>
                <div style={{ width: "160px", height: "160px", backgroundImage: "url('https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=BookMyTicketOrganizerMFA')", backgroundSize: "cover" }}></div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <input type="text" placeholder="Enter 6-digit MFA Code" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#0f172a', color: t.textMain, textAlign: "center", letterSpacing: "4px", fontWeight: "bold" }} />
                <button
                    onClick={() => setCurrentStage("kyc_docs")}
                    style={{ width: "100%", padding: "14px", borderRadius: "10px", backgroundColor: "#3b82f6", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                >
                    Verify & Continue <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );

    // KYC Document View
    const KYCDocsView = () => (
        <div style={{ maxWidth: "600px", margin: "60px auto", backgroundColor: t.cardBg, padding: "40px", borderRadius: "20px", border: `1px solid ${t.border}` }}>
            <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "8px" }}>Identity Verification (KYC)</h2>
            <p style={{ color: t.textSub, fontSize: "14px", marginBottom: "32px" }}>Step 1: Upload Your Documents</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {[
                    { label: "Aadhar Card (Front & Back)", icon: Shield },
                    { label: "PAN Card", icon: FileText },
                    { label: "Event Venue Booking Copy / License", icon: Building }
                ].map((doc, idx) => (
                    <div key={idx} style={{ padding: "24px", border: `2px dashed ${t.border}`, borderRadius: "12px", textAlign: "center", cursor: "pointer", transition: "0.2s" }} onMouseOver={(e) => e.currentTarget.style.borderColor = "#3b82f6"} onMouseOut={(e) => e.currentTarget.style.borderColor = t.border}>
                        <Upload size={24} color={t.textSub} style={{ marginBottom: "12px" }} />
                        <p style={{ fontSize: "14px", fontWeight: 600, margin: 0 }}>{doc.label}</p>
                        <p style={{ fontSize: "12px", color: t.textSub, marginTop: "4px" }}>Click to upload or drag & drop</p>
                    </div>
                ))}
            </div>

            <button
                onClick={() => setCurrentStage("kyc_form")}
                style={{ width: "100%", padding: "16px", borderRadius: "12px", backgroundColor: "#3b82f6", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", marginTop: "40px" }}
            >
                Start Auto-fill Process
            </button>
        </div>
    );

    // KYC Form View
    const KYCFormView = () => (
        <div style={{ maxWidth: "700px", margin: "50px auto", backgroundColor: t.cardBg, padding: "40px", borderRadius: "20px", border: `1px solid ${t.border}` }}>
            <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "8px" }}>Organiser Details</h2>
            <p style={{ color: t.textSub, fontSize: "14px", marginBottom: "32px" }}>Step 2: Complete Your Profile (Auto-filled from Documents)</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}>First Name</label>
                    <input
                        type="text"
                        defaultValue="John"
                        onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#0f172a', color: t.textMain }}
                    />
                </div>
                <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}>Last Name</label>
                    <input
                        type="text"
                        defaultValue="Doe"
                        onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#0f172a', color: t.textMain }}
                    />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}>Organiser Type</label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
                        {["Individual", "Event Organiser", "Pvt Ltd", "Others"].map(opt => (
                            <button
                                key={opt}
                                onClick={() => setProfile({ ...profile, orgType: opt })}
                                style={{ padding: "12px", borderRadius: "8px", border: `2px solid ${profile.orgType === opt ? "#3b82f6" : t.border}`, backgroundColor: profile.orgType === opt ? "#3b82f615" : "transparent", color: profile.orgType === opt ? "#3b82f6" : t.textSub, fontWeight: 600, cursor: "pointer" }}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
                {profile.orgType === "Others" && (
                    <div style={{ gridColumn: "span 2" }}>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}>Remarks</label>
                        <textarea style={{ width: "100%", padding: "12px", borderRadius: "8px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#0f172a', color: t.textMain }} rows={3} />
                    </div>
                )}
            </div>

            <button
                onClick={() => {
                    alert("KYC Submitted Successfully! Your details have been sent to the Admin Panel for approval.");
                    setCurrentStage("pending");
                }}
                style={{ width: "100%", padding: "16px", borderRadius: "12px", backgroundColor: "#3b82f6", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", marginTop: "40px" }}
            >
                Submit KYC for Approval
            </button>
        </div>
    );

    // Pending View
    const PendingView = () => (
        <div style={{ maxWidth: "550px", margin: "100px auto", textAlign: "center", backgroundColor: t.cardBg, padding: "50px 40px", borderRadius: "20px", border: `1px solid ${t.border}` }}>
            <div style={{ backgroundColor: "#f9731615", width: "90px", height: "90px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 30px" }}>
                <Clock size={45} color="#f97316" className="spin-slow" />
            </div>
            <h2 style={{ fontSize: "26px", fontWeight: 800, marginBottom: "16px" }}>KYC Process Under Review</h2>
            <p style={{ color: t.textSub, fontSize: "15px", lineHeight: "1.7", marginBottom: "40px" }}>
                Your KYC documents have been successfully submitted and are currently being reviewed by our administration team.
                <br /><br />
                <strong>Sidebar menu access is restricted</strong> until your account is approved. You will receive an email confirmation once the process is completed.
            </p>
            <div style={{ padding: "16px", backgroundColor: "#3b82f610", borderRadius: "12px", color: "#3b82f6", fontSize: "13px", fontWeight: 600 }}>
                Estimated Review Time: 12-24 Hours
            </div>

            {/* Backdoor for demo */}
            <button
                onClick={() => setCurrentStage("approved")}
                style={{ marginTop: "30px", fontSize: "12px", color: t.textSub, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
            >
                [Demo Only: Simulate Admin Approval]
            </button>
        </div>
    );

    // Main Dashboard View (Approved)
    const DashboardView = () => {
        const renderTabContent = () => {
            switch (activeTab) {
                case "dashboard":
                    return (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
                            <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "16px", border: `1px solid ${t.border}` }}>
                                <p style={{ fontSize: "14px", color: t.textSub, marginBottom: "8px" }}>Total Ticket Revenue</p>
                                <h2 style={{ fontSize: "28px", fontWeight: 800 }}>{wallet.currency}{wallet.balance.toLocaleString()}</h2>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#22c55e", fontSize: "12px", marginTop: "12px", fontWeight: 600 }}>
                                    <Plus size={14} /> 12% from last month
                                </div>
                            </div>
                            <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "16px", border: `1px solid ${t.border}` }}>
                                <p style={{ fontSize: "14px", color: t.textSub, marginBottom: "8px" }}>Events Managed</p>
                                <h2 style={{ fontSize: "28px", fontWeight: 800 }}>{events.length}</h2>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#3b82f6", fontSize: "12px", marginTop: "12px", fontWeight: 600 }}>
                                    Currently active
                                </div>
                            </div>
                            <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "16px", border: `1px solid ${t.border}` }}>
                                <p style={{ fontSize: "14px", color: t.textSub, marginBottom: "8px" }}>Total Tickets Sold</p>
                                <h2 style={{ fontSize: "28px", fontWeight: 800 }}>1,245</h2>
                            </div>
                        </div>
                    );
                case "manage_events":
                    return (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "16px", border: `1px solid ${t.border}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                                <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Active Events</h3>
                                <button onClick={() => setShowCreateEvent(true)} style={{ padding: "10px 20px", backgroundColor: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                                    <Plus size={18} /> Create New Event
                                </button>
                            </div>
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: "left" }}>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>Event Details</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>Date & Time</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>Venue Type</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>Status</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {events.map(ev => (
                                            <tr key={ev.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                                                <td style={{ padding: "16px" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                        <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "#3b82f620", display: "flex", alignItems: "center", justifyContent: "center" }}><Ticket size={20} color="#3b82f6" /></div>
                                                        <div>
                                                            <p style={{ fontWeight: 700, margin: 0, fontSize: "14px" }}>{ev.title}</p>
                                                            <p style={{ fontSize: "11px", color: t.textSub, margin: 0 }}>{ev.venue}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: "16px" }}>
                                                    <p style={{ fontSize: "13px", margin: 0, fontWeight: 600 }}>{ev.date}</p>
                                                    <p style={{ fontSize: "11px", color: t.textSub, margin: 0 }}>{ev.time}</p>
                                                </td>
                                                <td style={{ padding: "16px" }}>
                                                    <span style={{ fontSize: "12px", color: t.textSub, display: "flex", alignItems: "center", gap: "6px" }}>
                                                        {ev.type === 'Venue' ? <MapPin size={14} /> : <Video size={14} />} {ev.type}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "16px" }}>
                                                    <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, backgroundColor: "#22c55e15", color: "#22c55e" }}>ACTIVE</span>
                                                </td>
                                                <td style={{ padding: "16px" }}>
                                                    <div style={{ display: "flex", gap: "8px" }}>
                                                        <button title="Edit" style={{ background: "none", border: `1px solid ${t.border}`, padding: "8px", borderRadius: "8px", color: t.activeText, cursor: "pointer" }}><Save size={14} /></button>
                                                        <button title="Reschedule" style={{ background: "none", border: `1px solid ${t.border}`, padding: "8px", borderRadius: "8px", color: "#f97316", cursor: "pointer" }}><Clock size={14} /></button>
                                                        <button title="Delete" style={{ background: "none", border: `1px solid ${t.border}`, padding: "8px", borderRadius: "8px", color: "#ef4444", cursor: "pointer" }}><Trash2 size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                case "wallet":
                case "payout":
                    return (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "24px" }}>
                            <div style={{ backgroundColor: t.cardBg, padding: "32px", borderRadius: "20px", border: `1px solid ${t.border}` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
                                    <div>
                                        <p style={{ fontSize: "14px", color: t.textSub, marginBottom: "4px" }}>Available Balance</p>
                                        <h1 style={{ fontSize: "42px", fontWeight: 900 }}>{wallet.currency}{wallet.balance.toLocaleString()}</h1>
                                    </div>
                                    <button
                                        onClick={() => setShowPayoutModal(true)}
                                        style={{ backgroundColor: "#3b82f6", color: "#fff", border: "none", padding: "14px 28px", borderRadius: "12px", fontSize: "15px", fontWeight: 700, cursor: "pointer", transition: "0.2s" }}>
                                        Request Amount
                                    </button>
                                </div>

                                <h4 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "20px" }}>Transaction History</h4>
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    {wallet.transactions.map(tx => (
                                        <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderRadius: "12px", backgroundColor: theme === 'light' ? "#f8fafc" : "#0f172a" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                                <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: tx.amount > 0 ? "#22c55e15" : "#3b82f615", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    {tx.amount > 0 ? <Plus size={18} color="#22c55e" /> : <Wallet size={18} color="#3b82f6" />}
                                                </div>
                                                <div>
                                                    <p style={{ margin: 0, fontWeight: 700, fontSize: "14px" }}>{tx.type}</p>
                                                    <p style={{ margin: 0, fontSize: "12px", color: t.textSub }}>{tx.date}</p>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <p style={{ margin: 0, fontWeight: 800, color: tx.amount > 0 ? "#22c55e" : t.textMain }}>{tx.amount > 0 ? "+" : ""}{wallet.currency}{Math.abs(tx.amount).toLocaleString()}</p>
                                                <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: tx.status === 'Completed' ? '#22c55e' : '#f97316' }}>{tx.status.toUpperCase()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                                <div style={{ backgroundColor: "#3b82f610", padding: "24px", borderRadius: "20px", border: "1px dashed #3b82f6", position: "relative" }}>
                                    <h4 style={{ fontSize: "15px", fontWeight: 700, color: "#3b82f6", marginBottom: "12px" }}>Settlement Info</h4>
                                    <p style={{ fontSize: "12px", color: t.textSub, lineHeight: "1.5" }}>Settlements are processed every Monday. Minimum withdrawal amount is ₹1,000.</p>
                                </div>
                                <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "20px", border: `1px solid ${t.border}` }}>
                                    <h4 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "16px" }}>Linked Bank Account</h4>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div style={{ padding: "10px", backgroundColor: t.bg, borderRadius: "8px" }}><Building size={20} /></div>
                                        <div>
                                            <p style={{ margin: 0, fontSize: "13px", fontWeight: 700 }}>HDFC Bank Ltd</p>
                                            <p style={{ margin: 0, fontSize: "11px", color: t.textSub }}>**** 4421</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                default:
                    return <div>Coming Soon</div>;
            }
        };

        return (
            <div className="admin-container">
                {styles}
                {/* Create Event Modal */}
                {showCreateEvent && (
                    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
                        <div style={{ backgroundColor: t.cardBg, padding: "32px", borderRadius: "24px", width: "100%", maxWidth: "800px", border: `1px solid ${t.border}`, maxHeight: "90vh", overflowY: "auto" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                                <h2 style={{ fontSize: "24px", fontWeight: 800, color: t.textMain }}>Create New Event</h2>
                                <button onClick={() => setShowCreateEvent(false)} style={{ background: "none", border: "none", color: t.textSub, cursor: "pointer" }}><X size={24} /></button>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                                <div style={{ gridColumn: "span 2" }}>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: t.textMain }}>Event Title</label>
                                    <input type="text" placeholder="e.g. Annual Music Festival" style={{ width: "100%", padding: "14px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: t.textMain }}>Event Type</label>
                                    <select style={{ width: "100%", padding: "14px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }}>
                                        <option>Venue Event</option><option>Virtual Event</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: t.textMain }}>Venue / Meeting Link</label>
                                    <input type="text" placeholder="Enter address or URL" style={{ width: "100%", padding: "14px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }} />
                                </div>
                                <div style={{ gridColumn: "span 2" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                        <label style={{ fontSize: "14px", fontWeight: 700, color: t.textMain }}>Schedule (Multi-Date & Time)</label>
                                        <button onClick={addDateSlot} style={{ fontSize: "12px", color: t.activeText, background: "none", border: "none", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}><Plus size={14} /> Add Slot</button>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                        {newEvent.slots.map((slot, idx) => (
                                            <div key={idx} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                                <input type="date" style={{ flex: 1, padding: "12px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }} />
                                                <input type="time" style={{ flex: 1, padding: "12px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }} />
                                                {newEvent.slots.length > 1 && <button onClick={() => removeDateSlot(idx)} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}><Trash2 size={18} /></button>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ gridColumn: "span 2", marginTop: "12px" }}>
                                    <button onClick={() => {
                                        const eventToSave = { ...newEvent, id: Date.now(), date: newEvent.slots[0]?.date || "TBA", time: newEvent.slots[0]?.time || "TBA", status: "Active", img: "https://images.unsplash.com/photo-1540575861501-7ad058c647a0?w=500&h=650&fit=crop" };
                                        const existing = JSON.parse(localStorage.getItem('organiser_events') || '[]');
                                        localStorage.setItem('organiser_events', JSON.stringify([...existing, eventToSave]));
                                        setEvents([...events, eventToSave]);
                                        alert("Event created successfully! It will now appear on the home page.");
                                        setShowCreateEvent(false);
                                    }} style={{ width: "100%", padding: "16px", borderRadius: "12px", backgroundColor: "#3b82f6", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>
                                        Publish Event
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* Payout Modal */}
                {showPayoutModal && (
                    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                        <div style={{ backgroundColor: t.cardBg, padding: "32px", borderRadius: "24px", width: "400px", border: `1px solid ${t.border}`, textAlign: "center" }}>
                            <div style={{ width: "60px", height: "60px", backgroundColor: "#3b82f615", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}><Wallet color="#3b82f6" size={28} /></div>
                            <h3 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px", color: t.textMain }}>Request Amount</h3>
                            <p style={{ fontSize: "14px", color: t.textSub, marginBottom: "24px" }}>Enter the amount you wish to withdraw to your linked bank account.</p>
                            <div style={{ position: "relative", marginBottom: "24px" }}>
                                <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", fontWeight: 800, fontSize: "18px", color: t.textMain }}>₹</span>
                                <input type="number" placeholder="0.00" style={{ width: "100%", padding: "14px 14px 14px 40px", borderRadius: "12px", border: `1.5px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: "20px", fontWeight: 900 }} />
                            </div>
                            <div style={{ display: "flex", gap: "12px" }}>
                                <button onClick={() => setShowPayoutModal(false)} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: `1px solid ${t.border}`, background: "none", color: t.textMain, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                                <button onClick={() => { alert("Payout request submitted!"); setShowPayoutModal(false); }} style={{ flex: 1, padding: "12px", borderRadius: "10px", backgroundColor: "#3b82f6", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>Confirm</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Approved Sidebar — Matches Admin Panel */}
                <aside className="sidebar">
                    <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                        <Link href="/" style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "10px",
                            background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                            padding: '12px 10px',
                            borderRadius: '12px',
                            border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
                            textDecoration: "none",
                            transition: 'all 0.3s ease'
                        }}>
                            <img
                                src="/logo.png"
                                alt="Logo"
                                style={{
                                    height: "44px",
                                    objectFit: "contain",
                                    maxWidth: "100%",
                                    filter: theme === 'dark' ? 'invert(1) brightness(2)' : 'none',
                                    transition: 'filter 0.3s ease'
                                }}
                            />
                        </Link>
                        <div style={{ padding: "10px 12px", backgroundColor: "#3b82f610", borderRadius: "8px", border: "1px solid #3b82f630" }}>
                            <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: t.activeText, textTransform: "uppercase", letterSpacing: "1px" }}>Organiser Hub</p>
                        </div>
                    </div>

                    <nav style={{ flex: 1, overflowY: "auto", paddingBottom: "24px" }}>
                        <p style={{ padding: "20px 20px 8px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 800, color: t.textMain, opacity: 0.5 }}>Main Menu</p>
                        {[
                            { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
                            { id: "manage_events", icon: Calendar, label: "Manage Events" },
                            { id: "wallet", icon: Wallet, label: "Wallet & Earnings" },
                            { id: "payout", icon: CreditCard, label: "Request Amount" },
                        ].map(item => (
                            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`sidebar-item ${activeTab === item.id ? "active" : ""}`}>
                                <item.icon size={20} /> {item.label}
                            </button>
                        ))}

                        <p style={{ padding: "20px 20px 8px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 800, color: t.textMain, opacity: 0.5 }}>Account</p>
                        <button className="sidebar-item"><Users size={20} /> Profile</button>
                        <button className="sidebar-item" style={{ color: "#ef4444" }}><X size={20} /> Logout</button>
                    </nav>

                    <div style={{ padding: "16px", borderTop: `1px solid ${t.sidebarBorder}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", backgroundColor: theme === 'light' ? "#f8fafc" : "#0f172a", borderRadius: "10px" }}>
                            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(45deg, #3b82f6, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "#fff", fontSize: "13px" }}>JD</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: t.textMain }}>John Doe</p>
                                <p style={{ margin: 0, fontSize: "11px", color: "#22c55e", fontWeight: 600 }}>● KYC Approved</p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="main-content">
                    <header className="top-header">
                        <div>
                            <h1 style={{ fontSize: "20px", fontWeight: 800, color: t.textMain, margin: 0 }}>{activeTab.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</h1>
                            <p style={{ fontSize: "12px", color: t.textSub, margin: 0, opacity: 0.8 }}>Welcome back, John! Here's what's happening today.</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <button onClick={toggleTheme} style={{ background: t.activeLink, color: t.activeText, border: "none", padding: "8px", borderRadius: "6px", cursor: "pointer" }}>
                                {theme === 'light' ? <Sparkles size={16} /> : <ImageIcon size={16} />}
                            </button>
                            <button style={{ color: t.activeText, background: t.activeLink, border: `1px solid ${t.activeText}40`, padding: "8px 12px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", position: "relative" }}>
                                <Bell size={16} />
                                <div style={{ position: "absolute", top: "6px", right: "6px", width: "7px", height: "7px", backgroundColor: "#ef4444", borderRadius: "50%", border: `2px solid ${t.header}` }}></div>
                            </button>
                        </div>
                    </header>
                    <main style={{ padding: "24px" }}>
                        {renderTabContent()}
                    </main>
                </div>
            </div>
        );
    };

    // Restricted Sidebar for Stages (MFA/KYC/Pending)
    const RestrictedSidebar = ({ children }) => (
        <div className="admin-container">
            {styles}
            <aside className="sidebar">
                <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <Link href="/" style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                        padding: '12px 10px',
                        borderRadius: '12px',
                        border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
                        textDecoration: "none",
                        transition: 'all 0.3s ease'
                    }}>
                        <img
                            src="/logo.png"
                            alt="Logo"
                            style={{
                                height: "44px",
                                objectFit: "contain",
                                maxWidth: "100%",
                                filter: theme === 'dark' ? 'invert(1) brightness(2)' : 'none',
                                transition: 'filter 0.3s ease'
                            }}
                        />
                    </Link>
                </div>

                <nav style={{ flex: 1, paddingBottom: "24px", opacity: 0.5 }}>
                    <div className="sidebar-item"><LayoutDashboard size={20} /> Dashboard (Locked)</div>
                    <div className="sidebar-item"><Calendar size={20} /> Events (Locked)</div>
                    <div className="sidebar-item"><Wallet size={20} /> Wallet (Locked)</div>
                    <div className="sidebar-item"><Users size={20} /> Profile (Locked)</div>
                </nav>

                <div style={{ marginTop: "auto", padding: "16px", opacity: 0.8 }}>
                    <div style={{ padding: "16px", backgroundColor: theme === 'light' ? "#f1f5f9" : "#0f172a", borderRadius: "16px", border: `1px solid ${t.border}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#f97316" }}></div>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: t.textMain }}>Safety Mode</span>
                        </div>
                        <p style={{ fontSize: "11px", color: t.textSub, marginTop: "8px", margin: 0 }}>Verification required</p>
                    </div>
                </div>
            </aside>
            <main className="main-content">
                <header className="top-header">
                    <div>
                        <h1 style={{ fontSize: "18px", fontWeight: 800, color: t.textMain, margin: 0 }}>Organiser Onboarding</h1>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <button onClick={toggleTheme} style={{ background: t.activeLink, color: t.activeText, border: "none", padding: "8px", borderRadius: "6px", cursor: "pointer" }}>
                            {theme === 'light' ? <Sparkles size={16} /> : <ImageIcon size={16} />}
                        </button>
                    </div>
                </header>
                <div style={{ padding: "40px" }}>{children}</div>
            </main>
        </div>
    );

    // Main Stage Dispatcher
    switch (currentStage) {
        case "mfa":
            return <RestrictedSidebar><MFAView /></RestrictedSidebar>;
        case "kyc_docs":
            return <RestrictedSidebar><KYCDocsView /></RestrictedSidebar>;
        case "kyc_form":
            return <RestrictedSidebar><KYCFormView /></RestrictedSidebar>;
        case "pending":
            return <RestrictedSidebar><PendingView /></RestrictedSidebar>;
        case "approved":
            return <DashboardView />;
        default:
            return <DashboardView />;
    }
}
