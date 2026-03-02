"use client";
import React, { useState, useEffect } from "react";
import { LayoutDashboard, Settings, Video, Image as ImageIcon, Sparkles, CheckCircle, Ticket, Users, Menu, Bell, Save, X, Plus, Trash2 } from "lucide-react";

export default function AdminHomePage() {
    const [activeTab, setActiveTab] = useState("hero");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [slides, setSlides] = useState([
        { id: 1, url: "/events/chennai-concert", alt: "Slide Event 1", img: "https://images.unsplash.com/photo-1540039155733-d71efd44f808?q=80&w=300&h=200&fit=crop" },
        { id: 2, url: "/events/chennai-concert", alt: "Slide Event 2", img: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=300&h=200&q=80" },
        { id: 3, url: "/events/chennai-concert", alt: "Slide Event 3", img: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=300&h=200&q=80" }
    ]);

    const addSlide = () => {
        const newId = slides.length > 0 ? Math.max(...slides.map(s => s.id)) + 1 : 1;
        setSlides([...slides, {
            id: newId,
            url: "",
            alt: `New Slide ${newId}`,
            img: "https://images.unsplash.com/photo-1540039155733-d71efd44f808?q=80&w=300&h=200&fit=crop"
        }]);
    };

    const removeSlide = (id) => {
        setSlides(slides.filter(s => s.id !== id));
    };

    const updateSlide = (id, field, value) => {
        setSlides(slides.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    return (
        <div className="admin-container">
            <style>{`
                .admin-container { 
                    display: flex; 
                    min-height: 100vh; 
                    background-color: #f8fafc; 
                    font-family: var(--font-body), sans-serif;
                }
                .sidebar {
                    width: 280px;
                    background-color: #1e293b;
                    color: #e2e8f0;
                    display: flex;
                    flex-direction: column;
                    position: fixed;
                    height: 100vh;
                    left: 0;
                    top: 0;
                    z-index: 100;
                    transition: transform 0.3s ease;
                }
                .main-content {
                    margin-left: 280px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                }
                .top-header {
                    height: 72px;
                    background-color: #fff;
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 32px;
                    position: sticky;
                    top: 0;
                    z-index: 50;
                }
                .mobile-menu-btn {
                    display: none;
                    background: none;
                    border: none;
                    color: #64748b;
                    cursor: pointer;
                    margin-right: 12px;
                }
                .slide-card {
                    display: flex;
                    gap: 20px;
                    padding: 20px;
                    border: 1px solid #e2e8f0;
                    borderRadius: 8px;
                    background-color: #f8fafc;
                }
                .sidebar-overlay {
                    display: none;
                }

                @media (max-width: 1024px) {
                    .sidebar {
                        transform: translateX(-100%);
                    }
                    .sidebar.open {
                        transform: translateX(0);
                    }
                    .main-content {
                        margin-left: 0;
                    }
                    .mobile-menu-btn {
                        display: block;
                    }
                    .sidebar-overlay {
                        display: block;
                        position: fixed;
                        inset: 0;
                        background: rgba(0,0,0,0.5);
                        z-index: 90;
                        opacity: 0;
                        pointer-events: none;
                        transition: opacity 0.3s;
                    }
                    .sidebar-overlay.visible {
                        opacity: 1;
                        pointer-events: auto;
                    }
                    .slide-card {
                        flex-direction: column;
                        align-items: center;
                        text-align: center;
                    }
                    .slide-card img-container {
                        width: 100% !important;
                    }
                    .slide-inputs {
                        flex-direction: column !important;
                    }
                }
                .save-btn-text { display: inline; }
                @media (max-width: 640px) {
                    .top-header { padding: 0 16px; }
                    .tab-btn span { display: none; }
                    .tab-btn { padding: 12px !important; }
                    .admin-main { padding: 16px !important; }
                    .save-btn-text { display: none; }
                }
            `}</style>

            <div className={`sidebar-overlay ${isSidebarOpen ? 'visible' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>

            {/* Sidebar Navigation */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div style={{ padding: "24px", borderBottom: "1px solid #334155", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "32px", height: "32px", background: "linear-gradient(45deg, #f97316, #ef4444)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ color: "#fff", fontWeight: 800, fontSize: "18px" }}>B</span>
                        </div>
                        <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "#fff" }}>Admin Panel</h2>
                    </div>
                    <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(false)} style={{ display: isSidebarOpen ? 'block' : 'none', color: '#fff' }}>
                        <X size={24} />
                    </button>
                </div>

                <nav style={{ padding: "16px 12px", display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                    <p style={{ fontSize: "12px", textTransform: "uppercase", color: "#94a3b8", fontWeight: 700, paddingLeft: "12px", marginBottom: "4px", marginTop: "12px" }}>Settings</p>
                    <button style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "15px", fontWeight: 600, backgroundColor: "#3b82f6", color: "#fff" }}>
                        <Settings size={18} /> Home Page Settings
                    </button>
                    <button style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "15px", fontWeight: 600, backgroundColor: "transparent", color: "#cbd5e1" }}>
                        <LayoutDashboard size={18} /> Dashboard
                    </button>
                    <p style={{ fontSize: "12px", textTransform: "uppercase", color: "#94a3b8", fontWeight: 700, paddingLeft: "12px", marginBottom: "4px", marginTop: "20px" }}>Management</p>
                    {[{ icon: Ticket, label: "Events" }, { icon: Users, label: "Users & Organizers" }, { icon: Sparkles, label: "Promotions" }].map((item, idx) => (
                        <button key={idx} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "15px", fontWeight: 500, backgroundColor: "transparent", color: "#cbd5e1" }}>
                            <item.icon size={18} /> {item.label}
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
            <div className="main-content">
                <header className="top-header">
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}>
                            <Menu size={24} />
                        </button>
                        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a", margin: 0 }}>Home Page Customization</h1>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <button style={{ backgroundColor: "#10b981", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", fontSize: "14px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                            <Save size={16} /> <span className="save-btn-text">Save Changes</span>
                        </button>
                    </div>
                </header>

                <main className="admin-main" style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
                    <div style={{ display: "flex", gap: "8px", backgroundColor: "#fff", padding: "6px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "32px", overflowX: "auto" }}>
                        {[
                            { id: "hero", label: "Hero Carousel", icon: ImageIcon },
                            { id: "video", label: "Video Banner", icon: Video },
                            { id: "events", label: "Featured Events", icon: Ticket },
                            { id: "sections", label: "Sections Order", icon: Menu },
                        ].map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="tab-btn"
                                style={{ flex: 1, padding: "10px", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", backgroundColor: activeTab === tab.id ? "#eff6ff" : "transparent", color: activeTab === tab.id ? "#2563eb" : "#64748b", whiteSpace: "nowrap" }}>
                                <tab.icon size={18} /> <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                        {activeTab === "hero" && (
                            <div style={{ padding: "24px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
                                    <div>
                                        <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b", margin: 0 }}>Update Hero Carousel</h3>
                                        <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>Manage rotating banner images.</p>
                                    </div>
                                    <button onClick={addSlide} style={{ backgroundColor: "#3b82f6", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", fontSize: "14px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                                        <Plus size={16} /> Add Slide
                                    </button>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                    {slides.map((slide) => (
                                        <div key={slide.id} className="slide-card">
                                            <div style={{ width: "160px", height: "90px", backgroundColor: "#e2e8f0", borderRadius: "6px", overflow: "hidden", flexShrink: 0 }}>
                                                <img src={slide.img} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            </div>
                                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                                                <div className="slide-inputs" style={{ display: "flex", gap: "12px" }}>
                                                    <div style={{ flex: 1 }}>
                                                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>URL</label>
                                                        <input type="text" value={slide.url} onChange={(e) => updateSlide(slide.id, 'url', e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>Alt Text</label>
                                                        <input type="text" value={slide.alt} onChange={(e) => updateSlide(slide.id, 'alt', e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                                                    </div>
                                                </div>
                                                <button onClick={() => removeSlide(slide.id)} style={{ alignSelf: "flex-end", color: "#ef4444", background: "transparent", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                                                    <Trash2 size={14} /> Remove
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === "video" && (
                            <div style={{ padding: "24px" }}>
                                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b", marginBottom: "20px" }}>Video Banner Settings</h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>Video Path</label>
                                        <input type="text" defaultValue="/bookmyticket/videoplayback.mp4" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>Headline</label>
                                        <input type="text" defaultValue="Discover Your Next Experience" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {(activeTab === "events" || activeTab === "sections") && (
                            <div style={{ padding: "64px 32px", textAlign: "center" }}>
                                <Settings color="#64748b" size={48} style={{ marginBottom: "16px" }} />
                                <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Under Construction</h3>
                                <p style={{ color: "#64748b" }}>This feature is coming soon.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

