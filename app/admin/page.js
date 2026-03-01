"use client";
import React, { useState } from "react";
import { LayoutDashboard, Settings, Video, Image as ImageIcon, Sparkles, CheckCircle, Ticket, Users, Menu, Bell, Save } from "lucide-react";

export default function AdminHomePage() {
    const [activeTab, setActiveTab] = useState("hero");

    return (
        <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "var(--font-body), sans-serif" }}>
            {/* Sidebar Navigation */}
            <aside style={{
                width: "280px",
                backgroundColor: "#1e293b",
                color: "#e2e8f0",
                display: "flex",
                flexDirection: "column",
                position: "fixed",
                height: "100vh",
                left: 0,
                top: 0
            }}>
                <div style={{ padding: "24px", borderBottom: "1px solid #334155", display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "32px", height: "32px", background: "linear-gradient(45deg, #f97316, #ef4444)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ color: "#fff", fontWeight: 800, fontSize: "18px" }}>B</span>
                    </div>
                    <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "#fff" }}>Admin Panel</h2>
                </div>

                <nav style={{ padding: "16px 12px", display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                    <p style={{ fontSize: "12px", textTransform: "uppercase", color: "#94a3b8", fontWeight: 700, paddingLeft: "12px", marginBottom: "4px", marginTop: "12px" }}>Settings</p>

                    <button style={{
                        display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "15px", fontWeight: 600,
                        backgroundColor: "#3b82f6", color: "#fff", transition: "all 0.2s"
                    }}>
                        <Settings size={18} />
                        Home Page Settings
                    </button>

                    <button style={{
                        display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "15px", fontWeight: 600,
                        backgroundColor: "transparent", color: "#cbd5e1", transition: "all 0.2s"
                    }} className="hover:bg-slate-800 hover:text-white">
                        <LayoutDashboard size={18} />
                        Dashboard
                    </button>

                    <p style={{ fontSize: "12px", textTransform: "uppercase", color: "#94a3b8", fontWeight: 700, paddingLeft: "12px", marginBottom: "4px", marginTop: "20px" }}>Management</p>

                    {[
                        { icon: Ticket, label: "Events" },
                        { icon: Users, label: "Users & Organizers" },
                        { icon: Sparkles, label: "Promotions" },
                    ].map((item, idx) => (
                        <button key={idx} style={{
                            display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "15px", fontWeight: 500,
                            backgroundColor: "transparent", color: "#cbd5e1"
                        }} className="hover:bg-slate-800 hover:text-white">
                            <item.icon size={18} />
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div style={{ padding: "20px", borderTop: "1px solid #334155" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#475569", overflow: "hidden" }}>
                            <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Admin" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#fff" }}>Raja Admin</p>
                            <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>Super Admin</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div style={{ marginLeft: "280px", flex: 1, display: "flex", flexDirection: "column" }}>
                {/* Top Header */}
                <header style={{
                    height: "72px", backgroundColor: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", position: "sticky", top: 0, zIndex: 10
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", margin: 0 }}>Home Page Customization</h1>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                        <button style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b", position: "relative" }}>
                            <Bell size={22} />
                            <span style={{ position: "absolute", top: -2, right: -2, width: "8px", height: "8px", backgroundColor: "#ef4444", borderRadius: "50%" }}></span>
                        </button>
                        <button style={{
                            backgroundColor: "#10b981", color: "#fff", border: "none", padding: "8px 20px", borderRadius: "6px", fontSize: "14px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 2px 4px rgba(16, 185, 129, 0.2)"
                        }}>
                            <Save size={16} /> Save Changes
                        </button>
                    </div>
                </header>

                {/* Dashboard Area */}
                <main style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>

                    {/* Settings Tabs */}
                    <div style={{ display: "flex", gap: "8px", backgroundColor: "#fff", padding: "6px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "32px" }}>
                        {[
                            { id: "hero", label: "Hero Carousel", icon: ImageIcon },
                            { id: "video", label: "Video Banner", icon: Video },
                            { id: "events", label: "Featured Events", icon: Ticket },
                            { id: "sections", label: "Sections Order", icon: Menu },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    flex: 1, padding: "10px", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s",
                                    backgroundColor: activeTab === tab.id ? "#eff6ff" : "transparent",
                                    color: activeTab === tab.id ? "#2563eb" : "#64748b"
                                }}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Editor Sections based on active tab */}
                    <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>

                        {activeTab === "hero" && (
                            <div style={{ padding: "32px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                                    <div>
                                        <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b", margin: "0 0 4px 0" }}>Update Hero Carousel</h3>
                                        <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>Manage the top rotating banner images and text.</p>
                                    </div>
                                    <button style={{ backgroundColor: "#3b82f6", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>+ Add Slide</button>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                    {[1, 2, 3].map((slide) => (
                                        <div key={slide} style={{ display: "flex", gap: "20px", padding: "20px", border: "1px solid #e2e8f0", borderRadius: "8px", backgroundColor: "#f8fafc" }}>
                                            <div style={{ width: "160px", height: "90px", backgroundColor: "#e2e8f0", borderRadius: "6px", overflow: "hidden" }}>
                                                <img src={`https://images.unsplash.com/photo-1540039155733-d71efd44f808?q=80&w=300&h=200&fit=crop`} alt="slide preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            </div>
                                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
                                                <div style={{ display: "flex", gap: "12px" }}>
                                                    <div style={{ flex: 1 }}>
                                                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>Slide Target URL</label>
                                                        <input type="text" defaultValue="/events/chennai-concert" style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px" }} />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>Alt Text</label>
                                                        <input type="text" defaultValue={`Slide Event ${slide}`} style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px" }} />
                                                    </div>
                                                </div>
                                                <button style={{ alignSelf: "flex-end", color: "#ef4444", background: "transparent", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Remove</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === "video" && (
                            <div style={{ padding: "32px" }}>
                                <div style={{ marginBottom: "24px" }}>
                                    <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b", margin: "0 0 4px 0" }}>Update Video Banner</h3>
                                    <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>Configure the central video hero banner settings.</p>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Background Video File</label>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            <input type="text" defaultValue="/bookmyticket/videoplayback.mp4" style={{ flex: 1, padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px" }} />
                                            <button style={{ backgroundColor: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", padding: "10px 16px", borderRadius: "6px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>Upload New</button>
                                        </div>
                                        <span style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", display: "block" }}>Supports .mp4 or YouTube embed URLs</span>
                                    </div>

                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Main Headline</label>
                                        <input type="text" defaultValue="Discover Your Next Unforgettable Experience" style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px" }} />
                                    </div>

                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Subheadline</label>
                                        <textarea defaultValue="Explore concerts, shows, nightlife, and exclusive experiences happening around you." style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", minHeight: "80px", resize: "vertical" }} />
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "12px", padding: "16px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px" }}>
                                        <CheckCircle color="#16a34a" size={20} />
                                        <span style={{ fontSize: "14px", color: "#166534", fontWeight: 500 }}>Video Autoplay & Looping is currently enabled.</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {(activeTab === "events" || activeTab === "sections") && (
                            <div style={{ padding: "64px 32px", textAlign: "center" }}>
                                <div style={{ width: "64px", height: "64px", backgroundColor: "#f1f5f9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px auto" }}>
                                    <Settings color="#64748b" size={32} />
                                </div>
                                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b", margin: "0 0 8px 0" }}>Coming Soon</h3>
                                <p style={{ margin: 0, fontSize: "15px", color: "#64748b", maxWidth: "400px", marginInline: "auto" }}>This section of the admin panel is currently under development.</p>
                            </div>
                        )}

                    </div>
                </main>
            </div>
        </div>
    );
}
