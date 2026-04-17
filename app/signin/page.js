"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail, X, Check, Copy } from "lucide-react";
import HeroBanner from "@/components/HeroBanner";
import { useAuth } from "@/components/AuthContext";
import { supabase } from "@/lib/supabase";
import { BRAND_COUPONS } from "@/app/data/homeEvents";
import CouponModal from "@/components/CouponModal";
import EmojiBackground from "@/components/EmojiBackground";
import { isServiceProvider } from "@/app/data/serviceCategories";

const FALLBACK_BANNER_SLIDES = [
    { image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1080&h=1080&fit=crop", title: "Live Events & Experiences", subtitle: "Book tickets for concerts, sports & more" },
    { image: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1080&h=1080&fit=crop", title: "Sports & Marathons", subtitle: "Events & activities near you" },
    { image: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1080&h=1080&fit=crop", title: "Comedy & Live Shows", subtitle: "Laugh out loud experiences" }
];

const PARTNER_DEALS = [
    {
        id: "nykaa",
        logo: "https://nykaa.com/favicon.ico",
        brand: "Nykaa",
        title: "Get ₹250 Off on Nykaa Beauty Products!",
        desc: "From bold lipsticks to skin-loving serums, discover your new favorites...",
        expiry: "69 days left",
        image: "/coupons/nykaa_beauty_deal_1774253312733.png",
        color: "#f43f5e",
        discount: "250% OFF",
        url: "/events"
    },
    {
        id: "amazon",
        logo: "https://amazon.com/favicon.ico",
        brand: "Amazon",
        title: "Up to 50% Off on Premium Electronics",
        desc: "Upgrade your tech with the latest headphones, tablets and more.",
        expiry: "15 days left",
        image: "/coupons/amazon_tech_deal_1774253329075.png",
        color: "#2563eb",
        discount: "50% OFF",
        url: "/events"
    },
    {
        id: "myntra",
        logo: "https://myntra.com/favicon.ico",
        brand: "Myntra",
        title: "Flat 40% Off on Summer Collections",
        desc: "Trendy fashion and accessories to get you ready for the heat!",
        expiry: "30 days left",
        image: "/coupons/myntra_fashion_deal_image_1774253345705.png",
        color: "#f59e0b",
        discount: "40% OFF",
        url: "/events"
    }
];

export default function SignInPage() {
    const { user, login, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectPath = searchParams.get("redirect");
    const [mode, setMode] = useState("signin"); // "signin" | "signup" | "forgot"
    const [dealIdx, setDealIdx] = useState(0);
    const [currentTime, setCurrentTime] = useState("");
    const [selectedCoupon, setSelectedCoupon] = useState(null);

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
        };
        updateTime();
        const timer = setInterval(updateTime, 1000);
        
        const dealTimer = setInterval(() => {
            setDealIdx(p => (p + 1) % PARTNER_DEALS.length);
        }, 4000);
        return () => { clearInterval(timer); clearInterval(dealTimer); };
    }, []);
    
    const getRedirectDestination = (user, redirectPath) => {
        if (!user) return "/";
        
        // CRITICAL SECURITY OVERRIDE: If password change is requested, force it immediately
        if (user.is_temporary_password || user.force_password_change) {
            return "/change-password";
        }

        // Determine redirect: prioritize explicit redirectPath if valid
        let decodedRedirect = redirectPath ? decodeURIComponent(redirectPath) : null;
        const isInvalidRedirect = !decodedRedirect || decodedRedirect.includes("/signin") || decodedRedirect.includes("/signup");

        let destination = isInvalidRedirect ? "/" : decodedRedirect;

        // Security: Validate authorization for the target destination
        const isAdminPath = destination?.startsWith("/admin");
        const isBrandingPath = destination?.startsWith("/branding");
        const isOrganiserPath = destination?.startsWith("/organiser");
        const isVendorPath = destination?.startsWith("/vendor");

        const isAuthorized = 
            (!isAdminPath || user.role === "admin" || user.role === "super_admin") &&
            (!isBrandingPath || user.role === "branding_partner" || user.role === "admin" || user.role === "super_admin") &&
            (!isOrganiserPath || ["organiser", "staff", "admin", "super_admin"].includes(user.role)) &&
            (!isVendorPath || ["vendor", "organiser", "admin", "super_admin"].includes(user.role));

        // Apply role-based defaults if no valid redirect OR not authorized for target
        if (isInvalidRedirect || !isAuthorized) {
            if (user.role === "admin" || user.role === "super_admin") {
                destination = "/admin";
            } else if (user.role === "staff") {
                destination = "/organiser?tab=pwa_scanner";
            } else if (user.role === "branding_partner") {
                destination = "/branding/dashboard";
            } else if (user.role === "organiser" || user.role === "vendor") {
                const isProfessional = user.type === "professional_service" || isServiceProvider(user.kyc_details?.category || user.category);
                destination = isProfessional ? "/vendor/dashboard" : "/organiser";
            } else {
                destination = "/profile";
            }
        }
        return destination;
    };

    // REDIRECT GUARD: If already logged in, go to redirectPath or home
    useEffect(() => {
        if (!authLoading && user) {
            const destination = getRedirectDestination(user, redirectPath);
            console.log("SignInPage: Auto-redirect determined as:", destination);
            router.replace(destination);
        }
    }, [user, authLoading, router, redirectPath]);


    // Sign In
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isStaff, setIsStaff] = useState(false);
    const [loginError, setLoginError] = useState("");
    const [userIp, setUserIp] = useState("Unknown IP");

    useEffect(() => {
        const fetchIp = async () => {
            try {
                const res = await fetch("https://api.ipify.org?format=json");
                const data = await res.json();
                setUserIp(data.ip || "Unknown IP");
            } catch (err) {
                console.error("Could not fetch user IP:", err);
            }
        };
        fetchIp();
    }, []);

    const [signupName, setSignupName] = useState("");
    const [signupEmail, setSignupEmail] = useState("");
    const [signupPass, setSignupPass] = useState("");
    const [showSignupPass, setShowSignupPass] = useState(false);
    const [signupConfirm, setSignupConfirm] = useState("");
    const [signupError, setSignupError] = useState("");
    const [signupSuccess, setSignupSuccess] = useState(false);
    const [signupStep, setSignupStep] = useState(1); // 1=email, 2=otp, 3=details
    const [signupOtpCode, setSignupOtpCode] = useState("");
    const [signupOtpVerified, setSignupOtpVerified] = useState(false);
    const [signupOtpSending, setSignupOtpSending] = useState(false);
    const [signupOtpVerifying, setSignupOtpVerifying] = useState(false);

    // Forgot Password
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotSuccess, setForgotSuccess] = useState(false);
    const [forgotError, setForgotError] = useState("");

    // OTP Verification
    const [otpCode, setOtpCode] = useState("");
    const [otpEmail, setOtpEmail] = useState("");
    const [otpPurpose, setOtpPurpose] = useState(""); // "login" | "signup"
    const [otpError, setOtpError] = useState("");
    const [pendingSignupData, setPendingSignupData] = useState(null);

    // SSO configurations - static for now or fetched from profiles/system_config
    const [ssoConfigs, setSsoConfigs] = useState({ facebook: true, google: true });

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError("");
        setLoading(true);

        const email = identifier.trim().toLowerCase();

        // Safety net: auto-reset loading after 10s to prevent permanent spinner
        const safetyTimer = setTimeout(() => setLoading(false), 10000);
        
        try {
            const result = await login(email, password, redirectPath, {
                ip: userIp,
                userAgent: navigator.userAgent,
            });
            if (!result.success) {
                setLoginError(result.error || "Invalid email or password.");
            } else {
                // Immediate redirect on success to bypass useEffect delays
                const dest = getRedirectDestination(result.user, redirectPath);
                console.log("SignInPage: Immediate login success redirect to:", dest);
                router.replace(dest);
            }
        } catch (err) {
            console.error("Login error:", err);
            setLoginError("An error occurred during login.");
        } finally {
            clearTimeout(safetyTimer);
            setLoading(false);
        }
    };


    const handleSignupSendOTP = async (e) => {
        e.preventDefault();
        setSignupError("");
        if (!signupEmail) { setSignupError("Please enter your email."); return; }
        const email = signupEmail.trim();
        setSignupOtpSending(true);
        try {
            const res = await fetch('/api/auth/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'send', email, purpose: 'signup' })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || "Failed to send OTP.");
            
            setSignupStep(2);
            setSignupOtpCode("");
        } catch (err) {
            console.error("Signup OTP error:", err);
            setSignupError(err.message || "Could not send verification code.");
        } finally {
            setSignupOtpSending(false);
        }
    };

    const handleSignupVerifyOTP = async (e) => {
        e.preventDefault();
        setSignupError("");
        if (signupOtpCode.length !== 6) { setSignupError("Please enter the 6-digit code."); return; }
        setSignupOtpVerifying(true);
        try {
            const res = await fetch('/api/auth/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'verify', email: signupEmail.trim(), code: signupOtpCode, purpose: 'signup' })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || "Invalid OTP.");
            
            setSignupOtpVerified(true);
            setSignupStep(3);
        } catch (err) {
            setSignupError(err.message || "Invalid code.");
        } finally {
            setSignupOtpVerifying(false);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setSignupError("");
        if (signupPass !== signupConfirm) { setSignupError("Passwords do not match."); return; }
        if (signupPass.length < 6) { setSignupError("Password must be at least 6 characters."); return; }
        if (!signupName.trim()) { setSignupError("Please enter your full name."); return; }

        try {
            // Use the server-side admin API route so that:
            // 1. email_confirm=true → user is immediately active (we already verified email via OTP)
            // 2. The DB trigger auto-creates the profiles row
            // 3. No client-side supabase.auth.signUp() → no Supabase confirmation email conflict
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: signupEmail.trim().toLowerCase(),
                    password: signupPass,
                    full_name: signupName.trim(),
                }),
            });

            const data = await res.json();

            if (!data.success) {
                throw new Error(data.error || "Signup failed. Please try again.");
            }

            setSignupSuccess(true);
        } catch (err) {
            console.error("Signup error:", err);
            setSignupError(err.message || "Could not create account. Please try again.");
        }
    };


    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setOtpError("");
        if (otpCode.length !== 6) { setOtpError("Please enter a valid 6-digit code."); return; }

        try {
            const res = await fetch('/api/auth/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'verify', email: otpEmail, code: otpCode, purpose: otpPurpose || 'login' })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || "Invalid OTP.");
            
            // Note: Since this is passwordless login via custom OTP, we need a custom token 
            // for the user session, or we rely exclusively on passwords via conventional login.
            // If they are just logging in here, they need a session.
            window.location.reload();
        } catch (err) {
            setOtpError(err.message || "Invalid or expired code. Please check and try again.");
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setForgotError("");
        setLoading(true);
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'send', email: forgotEmail.trim().toLowerCase() })
            });
            
            let data;
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                data = await res.json();
            } else {
                const text = await res.text();
                // If it's HTML or some other junk, provide a readable fallback
                throw new Error(text.includes("<!DOCTYPE") ? "Server error: link is temporarily unavailable." : text);
            }

            if (!data.success) throw new Error(data.error || "Failed to send reset link.");
            
            setForgotSuccess(true);
        } catch (err) {
            console.error("Forgot pass error:", err);
            setForgotError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    
    // ── SSO Login Handler (Mock) ──
    const handleSSOLogin = async (provider) => {
        setLoading(true);
        setLoginError("");
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: `${window.location.origin}${redirectPath || '/'}`
                }
            });
            if (error) throw error;
        } catch (err) {
            console.error(`${provider} login error:`, err);
            setLoginError(`${provider} login is currently unavailable.`);
        } finally {
            setLoading(false);
        }
    };

    const inp = { width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "14px", color: "#1e293b", outline: "none", background: "#fff", boxSizing: "border-box", marginBottom: "8px", transition: "all .2s" };
    const lbl = { display: "block", fontSize: "14px", fontWeight: 700, color: "#1e293b", marginBottom: "6px" };
    const fr = e => { e.target.style.borderColor = "#f84464"; };
    const bg = e => { e.target.style.borderColor = "#e2e8f0"; };
    const submitBtn = { width: "100%", padding: "14px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #f844a4 0%, #a855f7 100%)", color: "#fff", fontWeight: 800, fontSize: "15px", cursor: "pointer", marginBottom: "15px", marginTop: "8px", transition: "all 0.3s ease", boxShadow: "0 4px 15px rgba(248, 68, 164, 0.25)" };
    const linkBtn = { background: "none", border: "none", color: "#000", fontWeight: 800, cursor: "pointer", fontSize: "14px", textDecoration: "none", padding: 0 };

    const activeDeal = PARTNER_DEALS[dealIdx];

    return (
        <div style={{ minHeight: "100vh", display: "flex", width: "100%", fontFamily: "'Inter','Roboto',sans-serif", background: "#f8fafc" }}>
            <style dangerouslySetInnerHTML={{ __html: `
                @media (max-width: 1024px) {
                    .hide-on-mobile { display: none !important; }
                    .signin-wrapper { justify-content: center !important; }
                }
                body { overflow: hidden; margin: 0; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            ` }} />
            
            {/* Render Coupon Modal if selected */}
            {selectedCoupon && (
                <CouponModal 
                    coupon={selectedCoupon} 
                    onClose={() => setSelectedCoupon(null)} 
                />
            )}

            {/* ══ LEFT SIDE: AUTO-SCROLLING COUPONS ══ */}
            <div className="hide-on-mobile" style={{ 
                flex: 1.2, 
                background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)", 
                position: "relative",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                padding: "40px"
            }}>
                {/* Decorative background elements */}
                <div style={{ position: "absolute", top: "-10%", right: "-10%", width: "400px", height: "400px", background: "rgba(244, 63, 94, 0.1)", borderRadius: "50%", filter: "blur(80px)" }} />
                <div style={{ position: "absolute", bottom: "-10%", left: "-10%", width: "300px", height: "300px", background: "rgba(99, 102, 241, 0.1)", borderRadius: "50%", filter: "blur(60px)" }} />

                <div style={{ width: "100%", maxWidth: "500px", zIndex: 2 }}>
                    <div style={{ marginBottom: "40px" }}>
                        <h2 style={{ fontSize: "32px", fontWeight: 900, color: "#fff", marginBottom: "12px", letterSpacing: "-0.02em" }}>Exclusive Partner Deals</h2>
                        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "16px", lineHeight: "1.6" }}>
                            Sign in to unlock amazing offers from our premium brand partners.
                        </p>
                    </div>

                    {/* Auto-scrolling Card Container */}
                    <div style={{ 
                        position: "relative", 
                        height: "380px", 
                        width: "100%",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        gap: "20px"
                    }}>
                        {/* Current Card with animation */}
                        <div 
                            key={dealIdx} 
                            onClick={() => {
                                // Map the local deal structure to match what CouponModal expects
                                setSelectedCoupon({
                                    ...activeDeal,
                                    bannerUrl: activeDeal.image,
                                    brandName: activeDeal.brand,
                                    logoUrl: activeDeal.logo,
                                    description: activeDeal.desc,
                                    discountValue: activeDeal.discount.replace(/[^0-9]/g, '') || "250",
                                    redirectUrl: activeDeal.url || "https://google.com"
                                });
                            }}
                            style={{
                                animation: "slideInVertical 0.8s ease-out forwards",
                                background: "#fff",
                                borderRadius: "24px",
                                overflow: "hidden",
                                boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
                                display: "flex",
                                height: "100%",
                                cursor: "pointer",
                                transition: "all 0.3s ease"
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
                            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                        >
                             <div style={{ flex: 1, padding: "30px", display: "flex", flexDirection: "column" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                                    <img src={activeDeal.logo} alt="" style={{ width: "24px", height: "24px", borderRadius: "6px" }} />
                                    <span style={{ fontWeight: 800, fontSize: "14px", color: "#1e293b", textTransform: "uppercase" }}>{activeDeal.brand}</span>
                                </div>
                                <h3 style={{ fontSize: "22px", fontWeight: 900, color: "#0f172a", marginBottom: "12px", lineHeight: "1.3" }}>{activeDeal.title}</h3>
                                <p style={{ fontSize: "14px", color: "#64748b", flex: 1 }}>{activeDeal.desc}</p>
                                
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "20px", marginBottom: "15px" }}>
                                    <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>🕐 {activeDeal.expiry}</span>
                                    <span style={{ 
                                        padding: "4px 10px", 
                                        borderRadius: "100px", 
                                        background: `${activeDeal.color}15`, 
                                        color: activeDeal.color, 
                                        fontSize: "11px", 
                                        fontWeight: 800 
                                    }}>{activeDeal.discount}</span>
                                </div>

                                <div style={{ 
                                    width: "100%", 
                                    padding: "10px", 
                                    borderRadius: "12px", 
                                    background: "#f84464", 
                                    color: "#fff", 
                                    textAlign: "center", 
                                    fontWeight: 700, 
                                    fontSize: "13px" 
                                }}>
                                    View Deal →
                                </div>
                             </div>
                             <div style={{ flex: 0.8, background: `url(${activeDeal.image}) center/cover` }} />
                        </div>
                    </div>

                    {/* Pagination Indicators */}
                    <div style={{ display: "flex", gap: "8px", marginTop: "30px" }}>
                        {PARTNER_DEALS.map((_, i) => (
                            <div key={i} style={{ 
                                width: i === dealIdx ? "30px" : "8px", 
                                height: "8px", 
                                borderRadius: "4px", 
                                background: i === dealIdx ? "#f43f5e" : "rgba(255,255,255,0.2)",
                                transition: "all 0.3s ease"
                            }} />
                        ))}
                    </div>
                </div>
                <style dangerouslySetInnerHTML={{ __html: `
                    @keyframes slideInVertical {
                        0% { transform: translateY(30px); opacity: 0; }
                        100% { transform: translateY(0); opacity: 1; }
                    }
                ` }} />
            </div>

            {/* ══ RIGHT SIDE: SIGN IN FORM ══ */}
            <div className="signin-wrapper" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "15px", background: "transparent", position: "relative", overflow: "hidden" }}>
                
                {/* WhatsApp Emoji Animation Background for the form area */}
                <EmojiBackground />

                {/* Connection Diagnostic Warning */}
                {!supabase && (
                    <div style={{ position: "absolute", top: "20px", left: "50%", transform: "translateX(-50%)", width: "90%", maxWidth: "400px", backgroundColor: "#fef2f2", border: "1px solid #fee2e2", padding: "12px", borderRadius: "12px", color: "#b91c1c", fontSize: "13px", fontWeight: 700, textAlign: "center", zIndex: 1000, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}>
                        ⚠️ Error: Authentication System Offline. <br/>
                        <span style={{ fontWeight: 400, fontSize: "11px" }}>Please configure Supabase environment variables in Vercel.</span>
                    </div>
                )}
                
                {/* ══ MOBILE PHONE FRAME (Mock-up) ══ */}
                <div style={{ 
                    width: "min(350px, 92vw)", 
                    height: "min(680px, 92vh)", 
                    background: "#ffffff", 
                    borderRadius: "40px", 
                    border: "8px solid #1a1a1a", 
                    position: "relative", 
                    boxShadow: "0 40px 80px rgba(0,0,0,0.15)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    margin: "10px auto"
                }}>
                    {/* Notch (Dynamic Island Style) */}
                    <div style={{ width: "110px", height: "24px", background: "#101010", position: "absolute", top: "10px", left: "50%", transform: "translateX(-50%)", borderRadius: "18px", zIndex: 10 }}>
                         <div style={{ width: "8px", height: "8px", background: "#1e293b", borderRadius: "50%", position: "absolute", right: "14px", top: "8px" }} />
                    </div>

                    {/* Status Bar */}
                    <div style={{ padding: "12px 22px 4px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", fontWeight: 700, color: "#000", zIndex: 9 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span>{currentTime}</span>
                            <span style={{ fontSize: "10px", color: "#64748b" }}>{new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>
                            <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                                <span style={{ fontSize: "10px" }}>85%</span>
                                <div style={{ width: "22px", height: "11px", border: "1.5px solid #000", borderRadius: "3px", position: "relative", padding: "1px", display: "flex" }}>
                                    <div style={{ width: "85%", height: "100%", background: "#22c55e", borderRadius: "1px" }} />
                                    <div style={{ width: "2px", height: "5px", background: "#000", position: "absolute", right: "-3.5px", top: "1.5px", borderRadius: "0 1px 1px 0" }} />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Internal Screen Content */}
                    <div className="no-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "8px 20px 20px", position: "relative" }}>
                        
                        {/* Header Logo */}
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: "4px", marginTop: "12px" }}>
                            <Link href="/">
                                <img src="/logo.png" alt="BookMyTicket" style={{ height: "60px", width: "auto", display: "block", cursor: "pointer" }} />
                            </Link>
                        </div>

                        {/* ══ SIGN IN ══ */}
                        {mode === "signin" && (
                            <>
                                <div style={{ textAlign: "center", marginBottom: "16px" }}>
                                    <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#1e293b", margin: "0 0 2px" }}>Welcome</h1>
                                    <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Sign in to your account</p>
                                </div>

                                <form onSubmit={handleLogin}>
                                    <input
                                        type="text" required
                                        placeholder="Username / Email"
                                        value={identifier}
                                        onChange={e => setIdentifier(e.target.value)}
                                        style={inp} onFocus={fr} onBlur={bg}
                                    />

                                    <div style={{ position: "relative", marginBottom: "16px" }}>
                                        <input
                                            type={showPass ? "text" : "password"} required
                                            placeholder="Password"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            style={{ ...inp, paddingRight: "40px", marginBottom: 0 }} onFocus={fr} onBlur={bg}
                                        />
                                        <button type="button" onClick={() => setShowPass(p => !p)}
                                            style={{ position: "absolute", right: "10px", top: "12px", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}>
                                            {showPass ? <Eye size={16} /> : <EyeOff size={16} />}
                                        </button>
                                    </div>

                                    {loginError && (
                                        <div style={{ padding: "12px", background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: "10px", marginBottom: "16px", color: "#b91c1c", fontSize: "13px", fontWeight: 600 }}>
                                            ⚠ {loginError}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        style={{
                                            ...submitBtn,
                                            marginBottom: "12px",
                                            opacity: loading ? 0.85 : 1,
                                            cursor: loading ? "not-allowed" : "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "8px",
                                        }}
                                    >
                                        {loading ? (
                                            <>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                                    style={{ animation: "spin 0.8s linear infinite" }}>
                                                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.35)" strokeWidth="3"/>
                                                    <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
                                                </svg>
                                                Signing in…
                                            </>
                                        ) : "Log in"}
                                    </button>
                                    
                                    {loading && (
                                        <div style={{ textAlign: "center", animation: "fadeIn 2s" }}>
                                            <button 
                                                type="button" 
                                                onClick={() => window.location.reload()} 
                                                style={{ background: "none", border: "none", fontSize: "11px", color: "#64748b", textDecoration: "underline", cursor: "pointer" }}
                                            >
                                                Taking too long? Click here to reload
                                            </button>
                                        </div>
                                    )}

                                    <style dangerouslySetInnerHTML={{ __html: `
                                        @keyframes spin { to { transform: rotate(360deg); } }
                                        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                                    ` }} />
                                    <div style={{ textAlign: "center", marginBottom: "12px" }}>
                                        <button type="button" onClick={() => setMode("forgot")} style={{ background: "none", border: "none", fontSize: "12px", color: "#64748b", textDecoration: "underline", cursor: "pointer" }}>Forgot password?</button>
                                    </div>
                                </form>

                                {(ssoConfigs?.google || ssoConfigs?.facebook) && (
                                    <div style={{ marginTop: "12px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", color: "#94a3b8", fontSize: "10px" }}>
                                            <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} /> OR <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
                                        </div>
                                        <div style={{ display: "flex", gap: "10px" }}>
                                            {ssoConfigs.google && (
                                                <button 
                                                    onClick={() => handleSSOLogin("google")}
                                                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "10px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer" }}
                                                >
                                                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" style={{ width: "16px" }} />
                                                </button>
                                            )}
                                            {ssoConfigs.facebook && (
                                                <button 
                                                    onClick={() => handleSSOLogin("facebook")}
                                                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "10px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer" }}
                                                >
                                                    <div style={{ width: "16px", height: "16px", background: "#1877F2", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "4px", color: "#fff", fontSize: "10px", fontWeight: 900 }}>f</div>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <p style={{ marginTop: "16px", fontSize: "10px", color: "#94a3b8", textAlign: "center" }}>
                                    <a href="#" style={{ color: "#475569", textDecoration: "underline" }}>Terms</a> &amp; <a href="#" style={{ color: "#475569", textDecoration: "underline" }}>Privacy</a>
                                </p>

                                <p style={{ textAlign: "center", marginTop: "20px", fontSize: "12px", color: "#64748b" }}>
                                    New here? <button onClick={() => setMode("signup")} style={{ ...linkBtn, fontSize: "12px", color: "#f43f5e" }}>Create account</button>
                                </p>
                            </>
                        )}

                        {/* ══ SIGN UP ══ */}
                        {mode === "signup" && (
                            <>
                                <div style={{ textAlign: "center", marginBottom: "14px" }}>
                                    <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", marginBottom: "4px" }}>Create account</h2>
                                    <p style={{ fontSize: "12px", color: "#475569", margin: 0 }}>
                                        Already have an account?{" "}
                                        <button style={linkBtn} onClick={() => { setMode("signin"); setSignupError(""); setSignupSuccess(false); setSignupStep(1); setSignupOtpCode(""); setSignupEmail(""); }}>
                                            Sign in
                                        </button>
                                    </p>
                                </div>

                                {/* ── Step 1: Enter email + Send OTP ── */}
                                {!signupSuccess && signupStep === 1 && (
                                    <form onSubmit={handleSignupSendOTP}>
                                        <label style={lbl}>Email Address</label>
                                        <input
                                            type="email" required
                                            placeholder="you@example.com"
                                            value={signupEmail}
                                            onChange={e => setSignupEmail(e.target.value)}
                                            style={inp} onFocus={fr} onBlur={bg}
                                        />
                                        {signupError && <p style={{ fontSize: "13px", color: "#ef4444", marginBottom: "12px", marginTop: "-10px" }}>⚠ {signupError}</p>}
                                        <button type="submit" disabled={signupOtpSending} style={submitBtn}>
                                            {signupOtpSending ? "Sending OTP..." : "Send OTP →"}
                                        </button>
                                    </form>
                                )}

                                {/* ── Step 2: Verify OTP ── */}
                                {!signupSuccess && signupStep === 2 && (
                                    <>
                                        <div style={{ textAlign: "center", padding: "16px", background: "#fdf2f8", borderRadius: "12px", marginBottom: "24px", border: "1.5px solid #f0abfc" }}>
                                            <p style={{ margin: 0, fontSize: "13px", color: "#86198f" }}>✉ OTP sent to <strong>{signupEmail}</strong></p>
                                        </div>
                                            <form onSubmit={handleSignupVerifyOTP}>
                                                <input
                                                    type="text" required
                                                    placeholder="000000"
                                                    maxLength={6}
                                                    value={signupOtpCode}
                                                    onChange={e => setSignupOtpCode(e.target.value.replace(/\D/g, ""))}
                                                    style={{ ...inp, letterSpacing: "6px", fontSize: "22px", textAlign: "center", fontWeight: 700 }}
                                                    onFocus={fr} onBlur={bg}
                                                />
                                                {signupError && <p style={{ fontSize: "13px", color: "#ef4444", marginBottom: "12px", marginTop: "-10px" }}>⚠ {signupError}</p>}
                                                <button type="submit" disabled={signupOtpVerifying} style={submitBtn}>
                                                    {signupOtpVerifying ? "Verifying..." : "Verify OTP →"}
                                                </button>
                                                <p style={{ textAlign: "center", fontSize: "11px", color: "#64748b", marginTop: "-8px" }}>
                                                    Not received? Check your spam folder or <button type="button" onClick={handleSignupSendOTP} style={{ background: "none", border: "none", color: "#f43f5e", textDecoration: "underline", cursor: "pointer", padding: 0 }}>resend code</button>
                                                </p>
                                            </form>
                                    </>
                                )}

                                {/* ── Step 3: Name + Password + Phone ── */}
                                {!signupSuccess && signupStep === 3 && (
                                    <>
                                        <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#1e293b", marginBottom: "14px" }}>Details</h2>
                                        <form onSubmit={handleSignup}>
                                            <input type="text" required placeholder="Full Name" value={signupName} onChange={e => setSignupName(e.target.value)} style={inp} onFocus={fr} onBlur={bg} />
                                            <input type="email" readOnly value={signupEmail} style={{ ...inp, background: "#f1f5f9", cursor: "not-allowed" }} />
                                            <input type="text" placeholder="Phone" style={inp} onFocus={fr} onBlur={bg} />
                                            <div style={{ position: "relative" }}>
                                                <input type={showSignupPass ? "text" : "password"} required placeholder="Password" value={signupPass} onChange={e => setSignupPass(e.target.value)} style={{ ...inp, paddingRight: "48px" }} onFocus={fr} onBlur={bg} />
                                                <button type="button" onClick={() => setShowSignupPass(p => !p)}
                                                    style={{ position: "absolute", right: "14px", top: "18px", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}>
                                                    {showSignupPass ? <Eye size={18} /> : <EyeOff size={18} />}
                                                </button>
                                            </div>
                                            <div style={{ position: "relative" }}>
                                                <input type={showSignupPass ? "text" : "password"} required placeholder="Confirm Password" value={signupConfirm} onChange={e => setSignupConfirm(e.target.value)} style={{ ...inp, paddingRight: "48px" }} onFocus={fr} onBlur={bg} />
                                            </div>

                                            {signupError && <p style={{ fontSize: "13px", color: "#ef4444", marginBottom: "12px", marginTop: "-10px" }}>⚠ {signupError}</p>}

                                            <button type="submit" style={submitBtn}>
                                                Continue
                                            </button>
                                        </form>
                                    </>
                                )}

                                {/* ── Success ── */}
                                {signupSuccess && (
                                    <div style={{ textAlign: "center", padding: "32px 16px", background: "#f0fdf4", borderRadius: "16px", border: "1.5px solid #bbf7d0" }}>
                                        <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
                                        <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#16a34a", marginBottom: "8px" }}>Account Created!</h3>
                                        <button onClick={() => { setMode("signin"); setSignupSuccess(false); setSignupStep(1); }}
                                            style={{ ...submitBtn, width: "auto", padding: "12px 28px" }}>
                                            Go to Sign In
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        {/* ══ FORGOT PASSWORD ══ */}
                        {mode === "forgot" && (
                            <>
                                <div style={{ textAlign: "center", marginBottom: "28px" }}>
                                    <h2 style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", marginBottom: "10px" }}>Reset Password</h2>
                                    <button style={linkBtn} onClick={() => setMode("signin")}>Back to Sign In</button>
                                </div>

                                {forgotSuccess ? (
                                    <div style={{ textAlign: "center", padding: "32px 16px", background: "#f0fdf4", borderRadius: "16px" }}>
                                        <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#16a34a" }}>Check your email</h3>
                                        <button onClick={() => setMode("signin")} style={{ ...submitBtn, marginTop: "20px" }}>Back to Log In</button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleForgotPassword}>
                                        <label style={lbl}>Email Address</label>
                                        <input type="email" required placeholder="you@example.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} style={inp} onFocus={fr} onBlur={bg} />
                                        {forgotError && <p style={{ fontSize: "13px", color: "#ef4444", marginBottom: "12px" }}>⚠ {forgotError}</p>}
                                        <button type="submit" style={submitBtn}>Send Reset Link</button>
                                    </form>
                                )}
                            </>
                        )}

                        {/* ══ VERIFY OTP ══ */}
                        {mode === "verify-otp" && (
                            <>
                                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                                    <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#1e293b" }}>Verify</h2>
                                    <p style={{ fontSize: "14px", color: "#64748b" }}>OTP sent to {otpEmail}</p>
                                </div>

                                <form onSubmit={handleVerifyOTP}>
                                    <input
                                        type="text" required
                                        placeholder="000000"
                                        maxLength={6}
                                        value={otpCode}
                                        onChange={e => setOtpCode(e.target.value.replace(/\D/g, ""))}
                                        style={{ ...inp, letterSpacing: "4px", fontSize: "24px", textAlign: "center", fontWeight: 700 }}
                                        onFocus={fr} onBlur={bg}
                                    />
                                    {otpError && <p style={{ fontSize: "13px", color: "#ef4444", marginBottom: "12px" }}>⚠ {otpError}</p>}
                                    <button type="submit" style={submitBtn}>Verify Code</button>
                                </form>
                            </>
                        )}
                    </div>

                    {/* Home Bar (iPhone style) */}
                    <div style={{ height: "24px", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: "10px" }}>
                        <div style={{ width: "100px", height: "5px", background: "#e2e8f0", borderRadius: "10px" }} />
                    </div>
                </div>
            </div>
        </div>
    );
}
