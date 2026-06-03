"use client";

import React from "react";
import { useSupabaseQuery } from "@/hooks/useSupabase";
import { motion } from "framer-motion";

const QUICK_LINKS = [
    { title: "About Us", slug: "about-us" },
    { title: "Contact Us", slug: "contact-us" },
    { title: "Organizer Information", slug: "organizer-information" },
    { title: "Terms & Conditions", slug: "terms-and-conditions" },
    { title: "Privacy Policy", slug: "privacy-policy" },
    { title: "Refund Policy", slug: "refund-policy" }
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
        label: "x", viewBox: "0 0 24 24",
        d: "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"
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
    const { data: bannerConfigRaw } = useSupabaseQuery('system_config', (q) => q.eq('key', 'careers_banner_settings'), []);
    
    const { data: contactDataArr = [] } = useSupabaseQuery('contact_settings');
    const contactSettings = contactDataArr?.[0] || null;

    const [activeJobs, setActiveJobs] = React.useState([]);
    const bannerConfig = bannerConfigRaw?.[0]?.value || { is_enabled: true };
    const isPortalEnabled = bannerConfig.is_enabled === true || bannerConfig.is_enabled === 'true';
    const hasActiveJobs = activeJobs?.length > 0 && isPortalEnabled;
    const dynamicPages = dynamicPagesRaw || [];
    const [isMobile, setIsMobile] = React.useState(false);
    const [mounted, setMounted] = React.useState(false);


    React.useEffect(() => {
        setMounted(true);
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener("resize", handleResize);

        fetch('/api/careers/jobs')
            .then(res => res.json())
            .then(json => {
                if (json.success) setActiveJobs(json.data || []);
            })
            .catch(console.error);

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

    const allLinks = [...(dynamicPages.length > 0 ? dynamicPages : QUICK_LINKS)];
    if (!allLinks.find(l => l.slug === 'careers')) {
        allLinks.push({ title: "Careers", slug: "careers" });
    }
    const quickLinks = allLinks.filter((v, i, a) => a.findIndex(t => (t.title === v.title)) === i);

    const socialLinks = [
        { key: 'social_facebook', icon: SOCIALS[0] },
        { key: 'social_instagram', icon: SOCIALS[1] },
        { key: 'social_linkedin', icon: SOCIALS[2] },
        { key: 'social_twitter', icon: SOCIALS[3] }
    ];

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
                            <img src={brandingLogo} alt="BookMyTicket" style={{ height: "80px", width: "auto", display: "block", filter: "invert(1) brightness(2)" }} />
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
                                    <a href={["about-us", "contact-us", "terms-and-conditions", "privacy-policy", "refund-policy", "organizer-information"].includes(page.slug) ? `/${page.slug}` : `/p/${page.slug}`} style={{
                                        fontSize: "14px", color: "rgba(255,255,255,0.5)",
                                        textDecoration: "none", transition: "all 0.2s",
                                        fontWeight: 500,
                                        display: "inline-block"
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.color = "#ffffff"}
                                        onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
                                    >
                                        {page.title}
                                        {page.slug === 'careers' && mounted && (
                                            <motion.span 
                                                animate={hasActiveJobs ? { 
                                                    opacity: [1, 0.8, 1],
                                                    scale: [1, 1.05, 1]
                                                } : {}}
                                                transition={hasActiveJobs ? { 
                                                    duration: 3,
                                                    repeat: Infinity,
                                                    ease: "easeInOut"
                                                } : {}}
                                                style={{ 
                                                    marginLeft: "12px", 
                                                    padding: "2px 8px",
                                                    borderRadius: "8px 8px 8px 0px",
                                                    fontSize: "9px", 
                                                    fontWeight: 900,
                                                    color: "#ffffff",
                                                    textTransform: "uppercase",
                                                    verticalAlign: "middle",
                                                    letterSpacing: "0.1em",
                                                    whiteSpace: "nowrap",
                                                    display: "inline-block",
                                                    background: hasActiveJobs ? "linear-gradient(135deg, #f84464 0%, #c026d3 100%)" : "#475569",
                                                    opacity: hasActiveJobs ? 1 : 0.6,
                                                    position: "relative"
                                                }}
                                            >
                                                <span style={{
                                                    position: "absolute",
                                                    left: "-6px",
                                                    bottom: "0px",
                                                    width: "0",
                                                    height: "0",
                                                    borderTop: "6px solid transparent",
                                                    borderRight: `6px solid ${hasActiveJobs ? '#f84464' : '#475569'}`,
                                                    borderBottom: "0px solid transparent"
                                                }} />
                                                <span style={{ position: "relative", zIndex: 1 }}>
                                                    {hasActiveJobs 
                                                        ? (bannerConfig.text?.includes('!!!') ? 'Join Our Team' : 'We Are Hiring')
                                                        : 'Closed'}
                                                </span>
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
                            {contactSettings?.address_line1 || "Coimbatore, Tamil Nadu"}<br />
                            {contactSettings?.address_line2 || ""}<br />
                            {contactSettings?.address_line3 || "India"}<br /><br />
                            <a href={`mailto:${contactSettings?.support_email || "hello@bookmyticket.net"}`} style={{ color: "#ffffff", textDecoration: "none" }}>{contactSettings?.support_email || "hello@bookmyticket.net"}</a>
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
                            display: isMobile ? "none" : "flex",
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
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
                    alignItems: "center",
                    gap: "15px"
                }}>
                    <div style={{ display: "flex", gap: "24px", justifyContent: isMobile ? "center" : "flex-start" }}>
                        {socialLinks.map((s, i) => {
                            const url = contactSettings?.[s.key] || "#";
                            return (
                                <a key={i} href={url} target={url !== "#" ? "_blank" : "_self"} rel="noopener noreferrer" style={{
                                    color: "rgba(255,255,255,0.6)",
                                    transition: "all 0.2s ease",
                                    textDecoration: "none"
                                }}
                                    onMouseEnter={e => e.currentTarget.style.color = "#ffffff"}
                                    onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
                                >
                                    <svg width="20" height="20" viewBox={s.icon.viewBox} fill="currentColor">
                                        <path d={s.icon.d} />
                                    </svg>
                                </a>
                            );
                        })}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap", justifyContent: "center" }}>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", textAlign: "center" }}>
                            {copyright.copyrightText || DEFAULT_COPYRIGHT.copyrightText}
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap", justifyContent: isMobile ? "center" : "flex-end" }}>
                        <a href="/terms-and-conditions" style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px", fontWeight: 600, textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.15)", paddingBottom: "1px", transition: "color 0.2s" }}
                            onMouseEnter={e => e.currentTarget.style.color = "#f844a4"}
                            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.45)"}
                        >Terms &amp; Conditions</a>
                        <a href="/privacy-policy" style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px", fontWeight: 600, textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.15)", paddingBottom: "1px", transition: "color 0.2s" }}
                            onMouseEnter={e => e.currentTarget.style.color = "#f844a4"}
                            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.45)"}
                        >Privacy Policy</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
