"use client";
import React from "react";
import { useSupabaseConfig } from "@/hooks/useSupabase";
import { Sparkles, Save, Image as ImageIcon, Layout, Type, Palette } from "lucide-react";
import { useToast } from "@/context/ToastContext";

const CareersBannerSettings = ({ t }) => {
    const { showToast } = useToast();
    const [config, setConfig] = useSupabaseConfig("system_config", {
        key: "careers_banner_settings",
        is_enabled: true,
        text: "We Are Hiring!!!",
        subtext: "Join our world-class team and build the future of live experiences.",
        theme: "pink-purple",
        font_style: "bold",
        bg_image: "",
        button_text: "View Openings"
    });

    const handleSave = async () => {
        try {
            await setConfig(config);
            showToast("Banner settings saved!", "success");
        } catch (err) {
            showToast("Error saving settings", "error");
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <div style={{ marginBottom: "32px" }}>
                <h2 style={{ fontSize: "28px", fontWeight: 900, color: t.textMain, tracking: "-0.02em" }}>Banner Customization</h2>
                <p style={{ fontSize: "14px", color: t.textSub, margin: "4px 0 0" }}>Customize the 'We're Hiring' banner across the platform</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
                {/* Configuration Form */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px", backgroundColor: t.cardBg, padding: "32px", borderRadius: "24px", border: `1px solid ${t.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#f8446415", color: "#f84464", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Layout size={18} />
                        </div>
                        <h3 style={{ fontSize: "16px", fontWeight: 800, color: t.textMain, margin: 0 }}>General Settings</h3>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", borderRadius: "16px", background: t.bg, border: `1px solid ${t.border}` }}>
                        <div>
                            <p style={{ fontSize: "14px", fontWeight: 700, color: t.textMain, margin: 0 }}>Enable Banner</p>
                            <p style={{ fontSize: "12px", color: t.textSub, margin: 0 }}>Show the hiring banner on the homepage and careers page</p>
                        </div>
                        <input 
                            type="checkbox"
                            checked={config.is_enabled}
                            onChange={e => setConfig({ ...config, is_enabled: e.target.checked })}
                            style={{ width: "40px", height: "20px" }}
                        />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "13px", fontWeight: 700, color: t.textSub }}>Banner Main Text</label>
                        <input 
                            value={config.text}
                            onChange={e => setConfig({ ...config, text: e.target.value })}
                            placeholder="e.g. We Are Hiring!!!"
                            style={{ padding: "12px 16px", borderRadius: "12px", border: `1px solid ${t.border}`, background: t.bg, color: t.textMain, fontSize: "14px" }}
                        />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "13px", fontWeight: 700, color: t.textSub }}>Subtitle / Subtext</label>
                        <input 
                            value={config.subtext}
                            onChange={e => setConfig({ ...config, subtext: e.target.value })}
                            placeholder="Brief catchy sentence..."
                            style={{ padding: "12px 16px", borderRadius: "12px", border: `1px solid ${t.border}`, background: t.bg, color: t.textMain, fontSize: "14px" }}
                        />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "13px", fontWeight: 700, color: t.textSub }}>Theme / Color Palette</label>
                        <select 
                            value={config.theme}
                            onChange={e => setConfig({ ...config, theme: e.target.value })}
                            style={{ padding: "12px 16px", borderRadius: "12px", border: `1px solid ${t.border}`, background: t.bg, color: t.textMain, fontSize: "14px" }}
                        >
                            <option value="pink-purple">Pink to Purple Gradient</option>
                            <option value="blue-cyan">Blue to Cyan Gradient</option>
                            <option value="dark-slate">Dark Slate (Professional)</option>
                            <option value="golden">Golden (Premium)</option>
                        </select>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "13px", fontWeight: 700, color: t.textSub }}>Button Text</label>
                        <input 
                            value={config.button_text}
                            onChange={e => setConfig({ ...config, button_text: e.target.value })}
                            style={{ padding: "12px 16px", borderRadius: "12px", border: `1px solid ${t.border}`, background: t.bg, color: t.textMain, fontSize: "14px" }}
                        />
                    </div>

                    <button 
                        onClick={handleSave}
                        style={{ padding: "14px", borderRadius: "14px", background: "linear-gradient(135deg, #f84464 0%, #c026d3 100%)", border: "none", color: "white", fontWeight: 800, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "12px" }}
                    >
                        <Save size={18} /> Save Banner Config
                    </button>
                </div>

                {/* Preview Card */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#3b82f615", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Sparkles size={18} />
                        </div>
                        <h3 style={{ fontSize: "16px", fontWeight: 800, color: t.textMain, margin: 0 }}>Live Preview</h3>
                    </div>

                    <div style={{ 
                        width: "100%", 
                        height: "300px", 
                        borderRadius: "32px", 
                        background: config.theme === 'pink-purple' ? "linear-gradient(135deg, #f84464 0%, #c026d3 100%)" : 
                                   (config.theme === 'blue-cyan' ? "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)" : 
                                   (config.theme === 'golden' ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" : "#0f172a")),
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "40px",
                        textAlign: "center",
                        color: "white",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                        position: "relative",
                        overflow: "hidden"
                    }}>
                        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0.1, background: "url('https://www.transparenttextures.com/patterns/cubes.png')" }}></div>
                        <h2 style={{ fontSize: "40px", fontWeight: 900, marginBottom: "12px", letterSpacing: "-0.02em", position: "relative" }}>{config.text || "We Are Hiring!!!"}</h2>
                        <p style={{ fontSize: "16px", fontWeight: 500, opacity: 0.9, maxWidth: "400px", marginBottom: "24px", position: "relative" }}>{config.subtext || "Join our team today."}</p>
                        <button style={{ padding: "12px 32px", borderRadius: "100px", background: "white", color: "#000", border: "none", fontWeight: 800, fontSize: "14px", position: "relative" }}>
                            {config.button_text}
                        </button>
                    </div>

                    <div style={{ padding: "24px", backgroundColor: "#f8fafc", borderRadius: "24px", border: "1px solid #e2e8f0" }}>
                        <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.6, margin: 0 }}>
                            <strong>Tip:</strong> Use bold, clear text for the main heading. The subtext should briefly mention the primary value proposition of working with you.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CareersBannerSettings;
