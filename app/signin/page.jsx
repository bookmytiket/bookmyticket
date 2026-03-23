"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail, X, ShieldCheck, Calendar, Gift, Ticket, AlertTriangle, ChevronDown, Check, Copy } from "lucide-react";
import HeroBanner from "@/components/HeroBanner";
import { useAuth } from "@/components/AuthContext";
import { useQuery, useMutation, useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import { hashPassword } from "@/app/utils/hashPassword";
import { BRAND_COUPONS } from "@/app/data/homeEvents";
import CouponModal from "@/components/CouponModal";

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
    const { login } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectPath = searchParams.get("redirect");
    const [mode, setMode] = useState("signin"); // "signin" | "signup" | "forgot"
    const convex = useConvex();
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


    // Sign In
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [isStaff, setIsStaff] = useState(false);
    const [loginError, setLoginError] = useState("");

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

    const createUser = useMutation(api.users.create);
    const sendOTPMutation = useMutation(api.auth.sendOTP);
    const verifySignupOTP = useMutation(api.auth.verifyOTPAndCreateAccount);
    const verifyLoginOTPMutation = useMutation(api.auth.verifyLoginOTP);
    const loginMutation = useMutation(api.auth.login);
    const forgotPassMutation = useMutation(api.auth.forgotPassword);
    const verifyOTPOnlyMutation = useMutation(api.auth.verifyOTPOnly);

    const [ssoConfigs, setSsoConfigs] = useState({ facebook: false, google: false });
    const convexSsoSettings = useQuery(api.ssoSettings.get);
    useEffect(() => {
        if (!convexSsoSettings) return;
        const fb = convexSsoSettings.facebookEnabled || false;
        const goog = convexSsoSettings.googleEnabled || false;
        setSsoConfigs(prev => {
            if (prev.facebook === fb && prev.google === goog) return prev;
            return { facebook: fb, google: goog };
        });
    }, [convexSsoSettings]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError("");

        const rawId = identifier.trim();
        const id = rawId.toLowerCase();
        const hashed = await hashPassword(password);

        // 1. Admin login check
        if (rawId === "bookmyticket-admin") {
            const ok = await login(rawId, password, "admin", null, redirectPath);
            if (ok) return;
            setLoginError("Invalid admin credentials.");
            return;
        }

        // 2. Public User / Staff / Organiser check via auth.login mutation
        try {
            const res = await loginMutation({ identifier: id, password: hashed });
            if (res.success) {
                if (res.needsOtp) {
                    setOtpEmail(res.email);
                    setOtpPurpose("login");
                    setMode("verify-otp");
                    return;
                }
                // Handle Staff/Organiser immediate login
                await login(id, hashed, res.role, res.data, redirectPath);
                return;
            } else {
                setLoginError(res.error || "Invalid username / email or password.");
            }
        } catch (err) {
            console.error("Login error:", err);
            setLoginError(err.message || "An error occurred during login.");
        }
    };

    const handleSignupSendOTP = async (e) => {
        e.preventDefault();
        setSignupError("");
        if (!signupEmail) { setSignupError("Please enter your email."); return; }
        setSignupOtpSending(true);
        try {
            await sendOTPMutation({ email: signupEmail, purpose: "signup" });
            setSignupStep(2);
            setSignupOtpCode("");
        } catch (err) {
            setSignupError(err.message || "Could not send verification code.");
        } finally {
            setSignupOtpSending(false);
        }
    };

    const handleSignupVerifyOTP = async (e) => {
        e.preventDefault();
        setSignupError("");
        if (signupOtpCode.length !== 8) { setSignupError("Please enter the 8-digit code."); return; }
        setSignupOtpVerifying(true);
        try {
            // Strictly verify the OTP against the backend before proceeding
            await verifyOTPOnlyMutation({
                email: signupEmail,
                code: signupOtpCode,
                purpose: "signup"
            });
            
            setSignupOtpVerified(true);
            setSignupStep(3);
            setSignupError("");
        } catch (err) {
            setSignupError("Invalid or expired code. Please check and try again.");
        } finally {
            setSignupOtpVerifying(false);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setSignupError("");
        if (signupPass !== signupConfirm) { setSignupError("Passwords do not match."); return; }
        if (signupPass.length < 6) { setSignupError("Password must be at least 6 characters."); return; }

        try {
            const hashed = await hashPassword(signupPass);
            // verifyOTPAndCreateAccount does final OTP validation + account creation
            await verifySignupOTP({
                fullName: signupName,
                email: signupEmail,
                password: hashed,
                username: signupEmail.split("@")[0] + Math.floor(Math.random() * 1000),
                code: signupOtpCode,
            });
            setSignupSuccess(true);
        } catch (err) {
            setSignupError(err.message?.includes("OTP") ? "Invalid or expired code." : "Could not create account. Please try again.");
            // If OTP expired, go back to step 2
            if (err.message?.includes("OTP") || err.message?.includes("expired")) {
                setSignupStep(2);
                setSignupOtpCode("");
            }
        }
    };


    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setOtpError("");
        if (otpCode.length !== 8) { setOtpError("Please enter a valid 8-digit code."); return; }

        try {
            if (otpPurpose === "signup") {
                const userId = await verifySignupOTP({
                    ...pendingSignupData,
                    code: otpCode,
                });
                if (userId) {
                    setSignupSuccess(true);
                    setMode("signup");
                }
            } else {
                const res = await verifyLoginOTPMutation({ email: otpEmail, code: otpCode });
                if (res.success) {
                    await login(otpEmail, "", "user", res.data, redirectPath);
                }
            }
        } catch (err) {
            setOtpError("Invalid or expired code. Please check and try again.");
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setForgotError("");
        try {
            const ok = await forgotPassMutation({ email: forgotEmail });
            if (ok) {
                setForgotSuccess(true);
            } else {
                setForgotError("Email not found. Please check and try again.");
            }
        } catch (err) {
            setForgotError("An error occurred. Please try again later.");
        }
    };

    const inp = { width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "14px", color: "#1e293b", outline: "none", background: "#fff", boxSizing: "border-box", marginBottom: "12px", transition: "all .2s" };
    const lbl = { display: "block", fontSize: "14px", fontWeight: 700, color: "#1e293b", marginBottom: "6px" };
    const fr = e => { e.target.style.borderColor = "#f84464"; };
    const bg = e => { e.target.style.borderColor = "#e2e8f0"; };
    const submitBtn = { width: "100%", padding: "14px", borderRadius: "12px", border: "none", background: "#f84464", color: "#fff", fontWeight: 700, fontSize: "15px", cursor: "pointer", marginBottom: "15px", marginTop: "8px", transition: "opacity 0.2s" };
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
            <div className="signin-wrapper" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "15px", background: "#f8fafc" }}>
                
                {/* ══ MOBILE PHONE FRAME (iPhone Style) ══ */}
                <div style={{ 
                    width: "350px", 
                    height: "640px", 
                    background: "#ffffff", 
                    borderRadius: "54px", 
                    border: "12px solid #1a1a1a", 
                    position: "relative", 
                    boxShadow: "0 50px 100px rgba(0,0,0,0.15)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden"
                }}>
                    {/* Notch (Dynamic Island Style) */}
                    <div style={{ width: "110px", height: "24px", background: "#101010", position: "absolute", top: "10px", left: "50%", transform: "translateX(-50%)", borderRadius: "18px", zIndex: 10 }}>
                         <div style={{ width: "8px", height: "8px", background: "#1e293b", borderRadius: "50%", position: "absolute", right: "14px", top: "8px" }} />
                    </div>

                    {/* Status Bar */}
                    <div style={{ padding: "14px 28px 4px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", fontWeight: 700, color: "#000", zIndex: 9 }}>
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
                    <div className="no-scrollbar" style={{ flex: 1, overflowY: "hidden", padding: "12px 22px 15px", position: "relative" }}>
                        
                        {/* Header Logo */}
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px", marginTop: "5px" }}>
                            <Link href="/">
                                <img src="/logo.png" alt="BookMyTicket" style={{ height: "75px", width: "auto", display: "block", cursor: "pointer" }} />
                            </Link>
                        </div>

                        {/* ══ SIGN IN ══ */}
                        {mode === "signin" && (
                            <>
                                <div style={{ textAlign: "center", marginBottom: "24px" }}>
                                    <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#1e293b", margin: "0 0 5px" }}>Welcome</h1>
                                    <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Sign in to your account</p>
                                </div>

                                <form onSubmit={handleLogin}>
                                    <input
                                        type="text" required
                                        placeholder="Username / Email"
                                        value={identifier}
                                        onChange={e => setIdentifier(e.target.value)}
                                        style={inp} onFocus={fr} onBlur={bg}
                                    />

                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                        <button type="button" onClick={() => setMode("forgot")} style={{ background: "none", border: "none", fontSize: "12px", color: "#64748b", textDecoration: "underline", cursor: "pointer" }}>Forgot password?</button>
                                    </div>
                                    <div style={{ position: "relative" }}>
                                        <input
                                            type={showPass ? "text" : "password"} required
                                            placeholder="Password"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            style={{ ...inp, paddingRight: "40px" }} onFocus={fr} onBlur={bg}
                                        />
                                        <button type="button" onClick={() => setShowPass(p => !p)}
                                            style={{ position: "absolute", right: "10px", top: "15px", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}>
                                            {showPass ? <Eye size={16} /> : <EyeOff size={16} />}
                                        </button>
                                    </div>

                                    {loginError && (
                                        <p style={{ fontSize: "12px", color: "#ef4444", marginBottom: "12px", marginTop: "-10px" }}>⚠ {loginError}</p>
                                    )}

                                    <button type="submit" style={{ ...submitBtn, background: "#f43f5e" }}>
                                        Log in
                                    </button>
                                </form>

                                {(ssoConfigs?.google || ssoConfigs?.facebook) && (
                                    <div style={{ marginTop: "12px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", color: "#94a3b8", fontSize: "10px" }}>
                                            <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} /> OR <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
                                        </div>
                                        <div style={{ display: "flex", gap: "10px" }}>
                                            {ssoConfigs.google && (
                                                <button style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "10px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer" }}>
                                                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" style={{ width: "16px" }} />
                                                </button>
                                            )}
                                            {ssoConfigs.facebook && (
                                                <button style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "10px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer" }}>
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
                                <div style={{ textAlign: "center", marginBottom: "28px" }}>
                                    <h2 style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", marginBottom: "10px" }}>Create account</h2>
                                    <p style={{ fontSize: "14px", color: "#475569", margin: 0 }}>
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
                                                placeholder="00000000"
                                                maxLength={8}
                                                value={signupOtpCode}
                                                onChange={e => setSignupOtpCode(e.target.value.replace(/\D/g, ""))}
                                                style={{ ...inp, letterSpacing: "6px", fontSize: "22px", textAlign: "center", fontWeight: 700 }}
                                                onFocus={fr} onBlur={bg}
                                            />
                                            {signupError && <p style={{ fontSize: "13px", color: "#ef4444", marginBottom: "12px", marginTop: "-10px" }}>⚠ {signupError}</p>}
                                            <button type="submit" disabled={signupOtpVerifying} style={submitBtn}>
                                                {signupOtpVerifying ? "Verifying..." : "Verify OTP →"}
                                            </button>
                                        </form>
                                    </>
                                )}

                                {/* ── Step 3: Name + Password + Phone ── */}
                                {!signupSuccess && signupStep === 3 && (
                                    <>
                                        <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#1e293b", marginBottom: "24px" }}>Details</h2>
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
                                        placeholder="00000000"
                                        maxLength={8}
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
