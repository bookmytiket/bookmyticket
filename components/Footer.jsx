"use client";

import React from "react";
import { useSupabaseQuery } from "@/hooks/useSupabase";
import { motion } from "framer-motion";

const QUICK_LINKS = [
    { title: "About Us", slug: "about" },
    { title: "Our Blogs", slug: "blogs" },
    { title: "Event Listing", slug: "events" },
    { title: "Careers", slug: "careers" },
    { title: "Contact Us", slug: "contact" }
];
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
    copyrightText: "© Copyright 2026 – bookmyticket. All Rights Reserved.",
    privacyUrl: "/privacy",
    termsUrl: "/terms"
};

export default function Footer() {
    const { data: allConfig } = useSupabaseQuery('system_config', (q) => q, []);
    const rawCopyright = allConfig?.find(c => c.key === "admin_footer_copyright")?.value;
    const { data: dynamicPagesRaw, error: pagesError } = useSupabaseQuery('pages', (q) => q.eq('show_in_footer', true).order('sort_order'), []);
    const { data: activeJobs = [] } = useSupabaseQuery('jobs', (q) => q.eq('status', 'open'), []);
    const { data: bannerConfigRaw } = useSupabaseQuery('system_config', (q) => q.eq('key', 'careers_banner_settings'), []);
    
    const bannerConfig = bannerConfigRaw?.[0]?.value || { is_enabled: true };
    const isPortalEnabled = bannerConfig.is_enabled === true || bannerConfig.is_enabled === 'true';
    const hasActiveJobs = activeJobs.length > 0 && isPortalEnabled;
    const dynamicPages = dynamicPagesRaw || [];
    const [isMobile, setIsMobile] = React.useState(false);
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const [brandingLogo, setBrandingLogo] = React.useState("/logo.png");

    React.useEffect(() => {
        fetch('/api/branding')
          .then(res => res.json())
          .then(data => {
            if (data.logo_url) setBrandingLogo(data.logo_url);
          })
          .catch(console.error);
    }, []);

    const copyright = (() => {
        if (rawCopyright == null) return DEFAULT_COPYRIGHT;
        try {
            const parsed = typeof rawCopyright === "string" ? JSON.parse(rawCopyright) : rawCopyright;
            const final = typeof parsed === "object" && parsed !== null ? { ...DEFAULT_COPYRIGHT, ...parsed } : DEFAULT_COPYRIGHT;
            // Force the name change if it matches the old one
            if (final.copyrightText && final.copyrightText.includes("Nexvant Technologies")) {
                final.copyrightText = final.copyrightText.replace("Nexvant Technologies", "bookmyticket");
            }
            return final;
        } catch (_) {
            return DEFAULT_COPYRIGHT;
        }
    })();

    const allLinks = dynamicPages.length > 0 ? dynamicPages : QUICK_LINKS;
    const quickLinks = allLinks.filter((v, i, a) => a.findIndex(t => (t.title === v.title)) === i);

    return (
        <footer style={{ width: "100%", position: "relative", background: "#000000", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ maxWidth: "1240px", margin: "0 auto", padding: isMobile ? "20px 20px" : "20px 20px 10px" }}>
                
                {/* Upper Footer: Branding & Apps */}
                <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: isMobile ? "1fr" : "1.5fr 1fr 1fr", 
                    gap: "40px",
                    marginBottom: "20px"
                }}>
                    {/* Brand & Get the App */}
                    <div>
                        <div style={{ marginBottom: "20px" }}>
                            <img src={brandingLogo} alt="BookMyTicket" style={{ height: "45px", width: "auto", display: "block", filter: "invert(1) brightness(2)" }} />
                        </div>
                        
                        <h4 style={{ fontSize: "14px", fontWeight: 800, color: "#ffffff", letterSpacing: "0.1em", marginBottom: "16px", textTransform: "uppercase" }}>
                            Get the App
                        </h4>
                        <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.6)", lineHeight: 1.5, marginBottom: "12px", maxWidth: "400px" }}>
                            Book tickets faster and enjoy a seamless event experience on our mobile app.
                        </p>
                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px" }}>
                            {/* Google Play White Badge */}
                            <a href="#" style={{ transition: "transform 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                                <div style={{ 
                                    width: "140px", 
                                    height: "42px", 
                                    background: "#ffffff", 
                                    borderRadius: "8px", 
                                    display: "flex", 
                                    alignItems: "center", 
                                    padding: "0 12px",
                                    gap: "8px"
                                }}>
                                    <img src="https://img.icons8.com/color/48/google-play.png" alt="Google" style={{ width: "24px", height: "24px" }} />
                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                        <span style={{ color: "#000000", fontSize: "7px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>GET IT ON</span>
                                        <span style={{ color: "#000000", fontSize: "14px", fontWeight: 800, lineHeight: 1.2 }}>Google Play</span>
                                    </div>
                                </div>
                            </a>
                            
                            {/* App Store White Badge */}
                            <a href="#" style={{ transition: "transform 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                                <div style={{ 
                                    width: "140px", 
                                    height: "42px", 
                                    background: "#ffffff", 
                                    borderRadius: "8px", 
                                    display: "flex", 
                                    alignItems: "center", 
                                    padding: "0 12px",
                                    gap: "8px"
                                }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M17.0571 11.2386C17.042 9.07345 18.8251 8.02641 18.9059 7.97341C17.8931 6.49502 16.3195 6.27533 15.7613 6.25263C14.4179 6.11633 13.1368 7.0522 12.4537 7.0522C11.7707 7.0522 10.7107 6.27041 9.5857 6.29132C8.10648 6.31302 6.75168 7.15545 5.9899 8.47953C4.45096 11.1554 5.59604 15.1118 7.08643 17.2662C7.81523 18.3182 8.67895 19.4975 9.81938 19.4542C10.9171 19.4109 11.331 18.7461 12.656 18.7461C13.981 18.7461 14.3541 19.4542 15.5133 19.4316C16.7118 19.4109 17.464 18.3752 18.1895 17.3115C19.03 16.084 19.3789 14.897 19.3975 14.841C19.3582 14.825 17.0819 13.9515 17.0571 11.2386ZM14.9362 4.49883C15.5458 3.76106 15.9554 2.73523 15.8427 1.7094C14.9592 1.74542 13.8893 2.30058 13.2543 3.03835C12.6868 3.68943 12.1906 4.73712 12.323 5.74106C13.3101 5.81734 14.3267 5.2366 14.9362 4.49883Z" fill="black"/>
                                    </svg>
                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                        <span style={{ color: "#000000", fontSize: "6px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Download on the</span>
                                        <span style={{ color: "#000000", fontSize: "12px", fontWeight: 800, lineHeight: 1.2 }}>App Store</span>
                                    </div>
                                </div>
                            </a>
                        </div>
                        {/* Payment Options */}
                        <div style={{ 
                            display: "grid", 
                            gridTemplateColumns: "repeat(2, 1fr)", 
                            gap: "16px 20px",
                            maxWidth: "500px"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ color: "#ffffff", fontSize: "13px", fontWeight: 700 }}>UPI</span>
                                <div style={{ display: "flex", gap: "4px" }}>
                                    {[
                                        "https://img.icons8.com/color/48/google-pay.png",
                                        "https://img.icons8.com/color/48/phone-pe.png",
                                        "https://img.icons8.com/color/48/paytm.png"
                                    ].map((url, i) => (
                                        <div key={i} style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", padding: "6px", border: "1px solid rgba(255,255,255,0.05)" }}>
                                            <img src={url} alt="UPI" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ color: "#ffffff", fontSize: "15px", fontWeight: 700 }}>CARD</span>
                                <div style={{ display: "flex", gap: "-4px" }}>
                                    {[
                                        "https://img.icons8.com/color/48/visa.png",
                                        "https://img.icons8.com/color/48/mastercard.png",
                                        "https://img.icons8.com/color/48/amex.png"
                                    ].map((url, i) => (
                                        <div key={i} style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", padding: "6px", border: "1px solid rgba(255,255,255,0.05)" }}>
                                            <img src={url} alt="Card" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ color: "#ffffff", fontSize: "15px", fontWeight: 700 }}>BANK</span>
                                <div style={{ display: "flex", gap: "-4px" }}>
                                    {[
                                        "https://img.icons8.com/fluency/48/bank.png",
                                        "https://img.icons8.com/fluency/48/museum.png",
                                        "https://img.icons8.com/fluency/48/library.png"
                                    ].map((url, i) => (
                                        <div key={i} style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", padding: "6px", border: "1px solid rgba(255,255,255,0.05)" }}>
                                            <img src={url} alt="Bank" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ color: "#ffffff", fontSize: "15px", fontWeight: 700 }}>WALLET</span>
                                <div style={{ display: "flex", gap: "-4px" }}>
                                    {[
                                        "https://img.icons8.com/fluency/48/safe.png",
                                        "https://img.icons8.com/color/48/wallet--v1.png",
                                        "https://img.icons8.com/color/48/phone-pe.png"
                                    ].map((url, i) => (
                                        <div key={i} style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", padding: "6px", border: "1px solid rgba(255,255,255,0.05)" }}>
                                            <img src={url} alt="Wallet" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 style={{ fontSize: "14px", fontWeight: 800, color: "#ffffff", letterSpacing: "0.1em", marginBottom: "24px", textTransform: "uppercase" }}>
                            Company
                        </h4>
                        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "14px" }}>
                            {quickLinks.map(page => (
                                <li key={page.title}>
                                    <a href={page.slug === "events" ? "/events" : (["about", "contact", "privacy", "terms", "careers"].includes(page.slug) ? `/${page.slug}` : (page.slug === "#" ? "#" : `/p/${page.slug}`))} style={{
                                        fontSize: "14px", color: "rgba(255,255,255,0.5)",
                                        textDecoration: "none", transition: "all 0.2s",
                                        fontWeight: 500,
                                        display: "inline-block"
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.color = "#ffffff"}
                                        onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
                                    >
                                        {page.title}
                                        {page.slug === 'careers' && mounted && hasActiveJobs && (
                                            <motion.span 
                                                animate={{ 
                                                    opacity: [1, 0.5, 1],
                                                    scale: [1, 1.05, 1],
                                                    color: ['#f84464', '#c026d3', '#f84464']
                                                }}
                                                transition={{ 
                                                    duration: 3,
                                                    repeat: Infinity,
                                                    ease: "easeInOut"
                                                }}
                                                style={{ 
                                                    marginLeft: "12px", 
                                                    fontSize: "10px", 
                                                    fontWeight: 900,
                                                    textTransform: "uppercase",
                                                    verticalAlign: "middle",
                                                    letterSpacing: "0.1em",
                                                    whiteSpace: "nowrap",
                                                    display: "inline-block",
                                                    background: "linear-gradient(135deg, #f84464 0%, #c026d3 100%)",
                                                    WebkitBackgroundClip: "text",
                                                    WebkitTextFillColor: "transparent",
                                                }}
                                            >
                                                {bannerConfig.text?.includes('!!!') ? 'Join Our Team' : 'We Are Hiring'}
                                            </motion.span>
                                        )}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 style={{ fontSize: "14px", fontWeight: 800, color: "#ffffff", letterSpacing: "0.1em", marginBottom: "24px", textTransform: "uppercase" }}>
                            Connect
                        </h4>
                        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>
                            Coimbatore, Tamil Nadu<br />
                            India<br /><br />
                            <a href="mailto:hello@bookmyticket.net" style={{ color: "#ffffff", textDecoration: "none" }}>hello@bookmyticket.net</a>
                        </p>
                    </div>
                </div>

                    {/* Back to Top Button - Moved to Fixed Position */}
                    <button 
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        style={{
                            position: "fixed",
                            right: "30px",
                            bottom: "30px",
                            width: "50px",
                            height: "50px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #f84464 0%, #c026d3 100%)",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 10px 30px rgba(248, 68, 100, 0.4)",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            zIndex: 1000,
                            opacity: "1",
                            transform: "translateY(0)"
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = "translateY(-5px) scale(1.1)"}
                        onMouseLeave={e => e.currentTarget.style.transform = "translateY(0) scale(1)"}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 19V5M5 12l7-7 7 7" />
                        </svg>
                    </button>

                {/* Bottom Bar: Socials & Copyright */}
                <div style={{ 
                    paddingTop: "20px", 
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "15px"
                }}>
                    <div style={{ display: "flex", gap: "24px" }}>
                        {SOCIALS.map((s, i) => (
                            <a key={i} href="#" style={{
                                color: "rgba(255,255,255,0.6)",
                                transition: "all 0.2s ease",
                                textDecoration: "none"
                            }}
                                onMouseEnter={e => e.currentTarget.style.color = "#ffffff"}
                                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
                            >
                                <svg width="20" height="20" viewBox={s.viewBox} fill="currentColor">
                                    <path d={s.d} />
                                </svg>
                            </a>
                        ))}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap", justifyContent: "center" }}>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
                            {copyright.copyrightText || DEFAULT_COPYRIGHT.copyrightText}
                        </div>
                        <a href="/terms" style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px", fontWeight: 600, textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.15)", paddingBottom: "1px", transition: "color 0.2s" }}
                            onMouseEnter={e => e.currentTarget.style.color = "#f844a4"}
                            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.45)"}
                        >Terms &amp; Conditions</a>
                        <a href="/privacy" style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px", fontWeight: 600, textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.15)", paddingBottom: "1px", transition: "color 0.2s" }}
                            onMouseEnter={e => e.currentTarget.style.color = "#f844a4"}
                            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.45)"}
                        >Privacy Policy</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
