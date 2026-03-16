"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const QUICK_LINKS = ["About Us", "Our Blogs", "Event Listing", "Pricing Plan", "Contact Us"];
const GALLERY_IMGS = [];

const SOCIALS = [
    {
        label: "f", viewBox: "0 0 24 24", d: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"
    },
    {
        label: "ig", viewBox: "0 0 24 24",
        d: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2z"
    },
    {
        label: "in", viewBox: "0 0 24 24",
        d: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"
    },
    {
        label: "p", viewBox: "0 0 24 24",
        d: "M12 2C8.1 2 5 5.1 5 9c0 2.7 1.5 5 3.7 6.3-.1.5-.3 1.3-.3 1.9 0 .8.4 1.9.4 1.9s1-.4 1.6-1c.5.1 1.1.2 1.6.2 3.9 0 7-3.1 7-7S15.9 2 12 2z"
    },
];

const DEFAULT_COPYRIGHT = {
    copyrightText: "© Copyright 2026 – BookMyTicket. All Rights Reserved.",
    privacyUrl: "#",
    termsUrl: "#"
};

export default function Footer() {
    const rawCopyright = useQuery(api.systemConfig.getConfig, { key: "admin_footer_copyright" });
    const dynamicPages = useQuery(api.pages.getPublished) || [];

    const copyright = (() => {
        if (rawCopyright == null) return DEFAULT_COPYRIGHT;
        try {
            const parsed = typeof rawCopyright === "string" ? JSON.parse(rawCopyright) : rawCopyright;
            return typeof parsed === "object" && parsed !== null ? { ...DEFAULT_COPYRIGHT, ...parsed } : DEFAULT_COPYRIGHT;
        } catch (_) {
            return DEFAULT_COPYRIGHT;
        }
    })();

    const allLinks = dynamicPages.length > 0 ? dynamicPages : QUICK_LINKS.map(label => ({ title: label, slug: "#" }));
    const quickLinks = allLinks.filter((v, i, a) => a.findIndex(t => (t.title === v.title)) === i);

    return (
        <footer style={{ width: "100%", position: "relative" }}>
            {/* Main footer with background image */}
            <div style={{
                position: "relative",
                backgroundImage: "url('/bottom.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundAttachment: "fixed",
            }}>
                {/* Dark overlay */}
                <div style={{
                    position: "absolute", inset: 0,
                    background: "rgba(10, 10, 20, 0.88)",
                }} />

                {/* Footer content */}
                <div style={{
                    position: "relative", zIndex: 1,
                    maxWidth: "1240px", margin: "0 auto",
                    padding: "60px 20px 40px",
                    display: "grid",
                    gridTemplateColumns: "1.4fr 1fr 1.3fr",
                    gap: "40px",
                }}>

                    {/* Col 1 — Brand */}
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                            <img src="/logo.png" alt="BookMyTicket" style={{ height: "42px", width: "auto", display: "block", filter: "brightness(0) invert(1)" }} />
                        </div>
                        <p style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.6)", lineHeight: 1.75, margin: "0 0 24px", maxWidth: "240px" }}>
                            We are committed to creating a platform where business leaders, innovators, and professionals can come together to exchange ideas and experience unforgettable events.
                        </p>
                        {/* Social Icons */}
                        <div style={{ display: "flex", gap: "10px" }}>
                            {SOCIALS.map((s, i) => (
                                <button key={i} style={{
                                    width: "36px", height: "36px", borderRadius: "50%",
                                    background: "rgba(255,255,255,0.1)",
                                    border: "1px solid rgba(255,255,255,0.15)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    cursor: "pointer", transition: "all 0.25s ease",
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.background = "#6366f1"; e.currentTarget.style.borderColor = "#6366f1"; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
                                >
                                    <svg width="15" height="15" viewBox={s.viewBox} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d={s.d} />
                                    </svg>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Col 2 — Quick Links */}
                    <div>
                        <h4 style={{ fontSize: "16px", fontWeight: 800, color: "#ffffff", margin: "0 0 20px", letterSpacing: "0.01em" }}>
                            Quick Links
                        </h4>
                        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
                            {quickLinks.map(page => (
                                <li key={page.title}>
                                    <a href={page.slug === "#" ? "#" : `/p/${page.slug}`} style={{
                                        fontSize: "14px", color: "rgba(255,255,255,0.6)",
                                        textDecoration: "none", transition: "color 0.2s",
                                        display: "flex", alignItems: "center", gap: "6px",
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.color = "#a5b4fc"}
                                        onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
                                    >
                                        <span style={{ color: "#6366f1", fontSize: "10px" }}>▶</span>
                                        {page.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Col 3 — Contact */}
                    <div>
                        <h4 style={{ fontSize: "16px", fontWeight: 800, color: "#ffffff", margin: "0 0 20px" }}>
                            Contact Us
                        </h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {[
                                { icon: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 11.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z", text: "+91 98765 43210" },
                                { icon: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z", text: "Coimbatore, Tamil Nadu, India" },
                                { icon: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6", text: "hello@bookmyticket.in" },
                                { icon: "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z M2 12h20 M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z", text: "www.bookmyticket.in" },
                            ].map((item, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                                    <div style={{ flexShrink: 0, marginTop: "2px" }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d={item.icon} />
                                        </svg>
                                    </div>
                                    <span style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>


                </div>

                {/* Divider */}
                <div style={{ position: "relative", zIndex: 1, borderTop: "1px solid rgba(255,255,255,0.08)", margin: "0 20px" }} />

                {/* Copyright bar — managed from Admin > Home Page > Copyright & Footer */}
                <div style={{
                    position: "relative", zIndex: 1,
                    textAlign: "center", padding: "20px",
                    color: "rgba(255,255,255,0.45)", fontSize: "13px",
                }}>
                    {copyright.copyrightText || DEFAULT_COPYRIGHT.copyrightText}
                    <span style={{ margin: "0 12px", color: "rgba(255,255,255,0.2)" }}>|</span>
                    <a href="/p/privacy-policy" style={{ color: "rgba(255,255,255,0.45)", textDecoration: "none" }}
                        onMouseEnter={e => e.currentTarget.style.color = "#a5b4fc"}
                        onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.45)"}
                    >Privacy Policy</a>
                    <span style={{ margin: "0 12px", color: "rgba(255,255,255,0.2)" }}>|</span>
                    <a href="/p/terms-of-service" style={{ color: "rgba(255,255,255,0.45)", textDecoration: "none" }}
                        onMouseEnter={e => e.currentTarget.style.color = "#a5b4fc"}
                        onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.45)"}
                    >Terms of Service</a>
                </div>
            </div>
        </footer>
    );
}
