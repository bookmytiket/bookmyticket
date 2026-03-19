"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail } from "lucide-react";
import HeroBanner from "@/components/HeroBanner";
import { useAuth } from "@/components/AuthContext";
import { useQuery, useMutation, useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import { hashPassword } from "@/app/utils/hashPassword";

const FALLBACK_BANNER_SLIDES = [
    { image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1080&h=1080&fit=crop", title: "Live Events & Experiences", subtitle: "Book tickets for concerts, sports & more" },
    { image: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1080&h=1080&fit=crop", title: "Sports & Marathons", subtitle: "Events & activities near you" },
    { image: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1080&h=1080&fit=crop", title: "Comedy & Live Shows", subtitle: "Laugh out loud experiences" }
];

export default function SignInPage() {
    const { login } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectPath = searchParams.get("redirect");
    const [mode, setMode] = useState("signin"); // "signin" | "signup" | "forgot"
    const convex = useConvex();


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

    const inp = { width: "100%", padding: "13px 16px", borderRadius: "10px", border: "1.5px solid #d1d5db", fontSize: "14px", color: "#1e293b", outline: "none", background: "#fff", boxSizing: "border-box", marginBottom: "18px", transition: "border-color .2s" };
    const lbl = { display: "block", fontSize: "14px", fontWeight: 600, color: "#374151", marginBottom: "6px" };
    const fr = e => { e.target.style.borderColor = "#c026d3"; };
    const bg = e => { e.target.style.borderColor = "#d1d5db"; };
    const submitBtn = { width: "100%", padding: "14px", borderRadius: "50px", border: "none", background: "linear-gradient(135deg, #f84464 0%, #c026d3 100%)", color: "#fff", fontWeight: 800, fontSize: "15px", cursor: "pointer", boxShadow: "0 6px 20px rgba(192,38,211,0.3)", marginBottom: "20px", marginTop: "4px" };
    const linkBtn = { background: "none", border: "none", color: "#0f172a", fontWeight: 700, cursor: "pointer", fontSize: "14px", textDecoration: "underline", padding: 0 };

    return (
        <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Inter','Roboto',sans-serif", background: "#f8fafc" }}>

            {/* ══ LEFT PANEL — Hero Banner (Hidden on Mobile) ══ */}
            <div style={{ flex: 1.1, position: "relative", overflow: "hidden", padding: "24px" }} className="hide-on-mobile signin-left-banner">
                <div style={{ width: "100%", height: "100%", position: "relative", borderRadius: "20px", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
                        <HeroBanner slides={FALLBACK_BANNER_SLIDES} showDetails={false} showPromo={false} />
                    </div>
                </div>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", position: "relative", background: "#fff" }}>
                
                {/* Mobile-only Hero Banner at the very top */}
                <div className="show-on-mobile" style={{ width: "100%", marginBottom: "0" }}>
                    <HeroBanner slides={FALLBACK_BANNER_SLIDES} showDetails={false} showPromo={false} />
                </div>

                <div style={{ width: "100%", maxWidth: "420px", padding: "40px 24px" }}>

                    {/* ══ SIGN IN ══ */}
                    {mode === "signin" && (
                        <>
                            <div style={{ textAlign: "center", marginBottom: "32px" }}>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                                    <Link href="/">
                                        <img src="/logo.png" alt="BookMyTicket" style={{ height: "60px", width: "auto" }} />
                                    </Link>
                                    <p style={{ fontSize: "16px", fontWeight: 600, color: "#64748b", margin: 0 }}>Welcome to bookmyticket</p>
                                </div>
                            </div>


                            <form onSubmit={handleLogin}>
                                <label style={lbl}>Username / Email</label>
                                <input
                                    type="text" required
                                    placeholder="yourname or name@example.com"
                                    value={identifier}
                                    onChange={e => setIdentifier(e.target.value)}
                                    style={inp} onFocus={fr} onBlur={bg}
                                />

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                    <label style={{ ...lbl, marginBottom: 0 }}>Password</label>
                                    <button type="button" onClick={() => setMode("forgot")} style={{ background: "none", border: "none", fontSize: "13px", color: "#64748b", textDecoration: "underline", cursor: "pointer" }}>Forgot password?</button>
                                </div>
                                <div style={{ position: "relative" }}>
                                    <input
                                        type={showPass ? "text" : "password"} required
                                        placeholder="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        style={{ ...inp, paddingRight: "48px" }} onFocus={fr} onBlur={bg}
                                    />
                                    <button type="button" onClick={() => setShowPass(p => !p)}
                                        style={{ position: "absolute", right: "14px", top: "18px", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}>
                                        {showPass ? <Eye size={18} /> : <EyeOff size={18} />}
                                    </button>
                                </div>

                                {loginError && (
                                    <p style={{ fontSize: "13px", color: "#ef4444", marginBottom: "12px", marginTop: "-10px" }}>⚠ {loginError}</p>
                                )}

                                <button type="submit" style={submitBtn}
                                    onMouseOver={e => e.currentTarget.style.opacity = ".88"}
                                    onMouseOut={e => e.currentTarget.style.opacity = "1"}>
                                    Log in
                                </button>
                            </form>

                            {(ssoConfigs?.google || ssoConfigs?.facebook) && (
                                <>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "0 0 16px", color: "#94a3b8", fontSize: "12px" }}>
                                        <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} /> OR <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                        {ssoConfigs.google && (
                                            <button style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", padding: "13px 16px", borderRadius: "10px", border: "1.5px solid #e2e8f0", background: "#fff", fontSize: "14px", fontWeight: 600, color: "#1e293b", cursor: "pointer" }}>
                                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" style={{ width: "18px" }} /> Continue with Google
                                            </button>
                                        )}
                                        {ssoConfigs.facebook && (
                                            <button style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", padding: "13px 16px", borderRadius: "10px", border: "1.5px solid #e2e8f0", background: "#fff", fontSize: "14px", fontWeight: 600, color: "#1e293b", cursor: "pointer" }}>
                                                <div style={{ width: "18px", height: "18px", background: "#1877F2", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "4px", color: "#fff", fontSize: "11px", fontWeight: 900 }}>f</div> Continue with Facebook
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}

                            <p style={{ marginTop: "24px", fontSize: "11px", color: "#94a3b8", textAlign: "center" }}>
                                By continuing you agree to our{" "}
                                <a href="#" style={{ color: "#475569", textDecoration: "underline" }}>Terms</a> &amp;{" "}
                                <a href="#" style={{ color: "#475569", textDecoration: "underline" }}>Privacy Policy</a>
                            </p>

                            <p style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: "#64748b" }}>
                                Don&apos;t have an account?{" "}
                                <button onClick={() => setMode("signup")} style={linkBtn}>Create one now</button>
                            </p>
                        </>
                    )}

                    {/* ══ SIGN UP ══ */}
                    {mode === "signup" && (
                        <>
                            <div style={{ textAlign: "center", marginBottom: "28px" }}>
                                <h2 style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", marginBottom: "10px" }}>Create an account</h2>
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
                                    <button type="submit" disabled={signupOtpSending} style={submitBtn}
                                        onMouseOver={e => e.currentTarget.style.opacity = ".88"}
                                        onMouseOut={e => e.currentTarget.style.opacity = "1"}>
                                        {signupOtpSending ? "Sending OTP..." : "Send OTP →"}
                                    </button>
                                </form>
                            )}

                            {/* ── Step 2: Verify OTP ── */}
                            {!signupSuccess && signupStep === 2 && (
                                <>
                                    <div style={{ textAlign: "center", padding: "16px", background: "#fdf2f8", borderRadius: "12px", marginBottom: "24px", border: "1.5px solid #f0abfc" }}>
                                        <p style={{ margin: 0, fontSize: "13px", color: "#86198f" }}>✉ OTP sent to <strong>{signupEmail}</strong></p>
                                        <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#a21caf" }}>Valid for 10 minutes — check your inbox/spam</p>
                                    </div>
                                    <form onSubmit={handleSignupVerifyOTP}>
                                        <label style={lbl}>Enter 8-Digit OTP</label>
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
                                        <button type="submit" disabled={signupOtpVerifying} style={submitBtn}
                                            onMouseOver={e => e.currentTarget.style.opacity = ".88"}
                                            onMouseOut={e => e.currentTarget.style.opacity = "1"}>
                                            {signupOtpVerifying ? "Verifying..." : "Verify OTP →"}
                                        </button>
                                    </form>
                                    <p style={{ textAlign: "center", fontSize: "13px", color: "#64748b", marginTop: "8px" }}>
                                        Didn&apos;t receive it?{" "}
                                        <button type="button" onClick={() => handleSignupSendOTP({ preventDefault: () => {} })} style={{ ...linkBtn, color: "#c026d3", fontSize: "13px" }}>Resend OTP</button>
                                        {" · "}
                                        <button type="button" onClick={() => { setSignupStep(1); setSignupError(""); }} style={{ ...linkBtn, fontSize: "13px", color: "#64748b" }}>Change Email</button>
                                    </p>
                                </>
                            )}

                            {/* ── Step 3: Name + Password ── */}
                            {!signupSuccess && signupStep === 3 && (
                                <>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: "#f0fdf4", borderRadius: "10px", marginBottom: "20px", border: "1.5px solid #bbf7d0" }}>
                                        <span style={{ fontSize: "18px" }}>✅</span>
                                        <p style={{ margin: 0, fontSize: "13px", color: "#15803d", fontWeight: 600 }}>Email verified: {signupEmail}</p>
                                    </div>
                                    <form onSubmit={handleSignup}>
                                        <label style={lbl}>Full Name</label>
                                        <input type="text" required placeholder="John Doe" value={signupName} onChange={e => setSignupName(e.target.value)} style={inp} onFocus={fr} onBlur={bg} />

                                        <label style={lbl}>Password</label>
                                        <div style={{ position: "relative" }}>
                                            <input type={showSignupPass ? "text" : "password"} required placeholder="Min. 6 characters" value={signupPass} onChange={e => setSignupPass(e.target.value)} style={{ ...inp, paddingRight: "48px" }} onFocus={fr} onBlur={bg} />
                                            <button type="button" onClick={() => setShowSignupPass(p => !p)}
                                                style={{ position: "absolute", right: "14px", top: "18px", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}>
                                                {showSignupPass ? <Eye size={18} /> : <EyeOff size={18} />}
                                            </button>
                                        </div>

                                        <label style={lbl}>Confirm Password</label>
                                        <input type="password" required placeholder="Re-enter password" value={signupConfirm} onChange={e => setSignupConfirm(e.target.value)} style={inp} onFocus={fr} onBlur={bg} />

                                        {signupError && <p style={{ fontSize: "13px", color: "#ef4444", marginBottom: "12px", marginTop: "-10px" }}>⚠ {signupError}</p>}

                                        <button type="submit" style={submitBtn}
                                            onMouseOver={e => e.currentTarget.style.opacity = ".88"}
                                            onMouseOut={e => e.currentTarget.style.opacity = "1"}>
                                            Create Account
                                        </button>
                                    </form>
                                </>
                            )}

                            {/* ── Success ── */}
                            {signupSuccess && (
                                <div style={{ textAlign: "center", padding: "32px 16px", background: "#f0fdf4", borderRadius: "16px", border: "1.5px solid #bbf7d0" }}>
                                    <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
                                    <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#16a34a", marginBottom: "8px" }}>Account Created!</h3>
                                    <p style={{ fontSize: "14px", color: "#15803d", marginBottom: "20px" }}>
                                        Welcome, <strong>{signupName}</strong>! You can now log in.
                                    </p>
                                    <button onClick={() => { setMode("signin"); setSignupSuccess(false); setSignupStep(1); }}
                                        style={{ padding: "12px 28px", borderRadius: "50px", border: "none", background: "linear-gradient(135deg, #f84464, #c026d3)", color: "#fff", fontWeight: 800, fontSize: "14px", cursor: "pointer" }}>
                                        Go to Sign In
                                    </button>
                                </div>
                            )}

                            <p style={{ marginTop: "16px", fontSize: "11px", color: "#94a3b8", textAlign: "center" }}>
                                By signing up you agree to our{" "}
                                <a href="#" style={{ color: "#475569", textDecoration: "underline" }}>Terms</a> &amp;{" "}
                                <a href="#" style={{ color: "#475569", textDecoration: "underline" }}>Privacy Policy</a>
                            </p>
                        </>
                    )}

                    {/* ══ FORGOT PASSWORD ══ */}
                    {mode === "forgot" && (
                        <>
                            <div style={{ textAlign: "center", marginBottom: "28px" }}>
                                <h2 style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", marginBottom: "10px" }}>Reset Password</h2>
                                <p style={{ fontSize: "14px", color: "#475569", margin: 0 }}>
                                    Remember your password?{" "}
                                    <button style={linkBtn} onClick={() => { setMode("signin"); setForgotError(""); setForgotSuccess(false); }}>
                                        Sign in
                                    </button>
                                </p>
                            </div>

                            {forgotSuccess ? (
                                <div style={{ textAlign: "center", padding: "32px 16px", background: "#f0fdf4", borderRadius: "16px", border: "1.5px solid #bbf7d0" }}>
                                    <div style={{ fontSize: "48px", marginBottom: "12px" }}>✉</div>
                                    <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#16a34a", marginBottom: "8px" }}>Check your email</h3>
                                    <p style={{ fontSize: "14px", color: "#15803d", marginBottom: "20px" }}>
                                        We&apos;ve sent a password reset link to <strong>{forgotEmail}</strong>.
                                    </p>
                                    <button onClick={() => { setMode("signin"); setForgotSuccess(false); }}
                                        style={{ padding: "12px 28px", borderRadius: "50px", border: "none", background: "#FCE15D", color: "#000", fontWeight: 800, fontSize: "14px", cursor: "pointer", boxShadow: "0 4px 15px rgba(252,225,93,0.3)" }}>
                                        Back to Log In
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleForgotPassword}>
                                    <label style={lbl}>Email Address</label>
                                    <input type="email" required placeholder="you@example.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} style={inp} onFocus={fr} onBlur={bg} />

                                    {forgotError && (
                                        <p style={{ fontSize: "13px", color: "#ef4444", marginBottom: "12px", marginTop: "-10px" }}>⚠ {forgotError}</p>
                                    )}

                                    <button type="submit" style={submitBtn}
                                        onMouseOver={e => e.currentTarget.style.opacity = ".88"}
                                        onMouseOut={e => e.currentTarget.style.opacity = "1"}>
                                        Send Reset Link
                                    </button>
                                </form>
                            )}
                        </>
                    )}

                    {/* ══ VERIFY OTP ══ */}
                    {mode === "verify-otp" && (
                        <>
                            <div style={{ textAlign: "center", marginBottom: "32px" }}>
                                <div style={{ width: "64px", height: "64px", background: "#fdf2f8", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                                    <Mail size={32} color="#ff007f" />
                                </div>
                                <h2 style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", marginBottom: "10px" }}>Check your mail</h2>
                                <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
                                    We&apos;ve sent an 8-digit verification code to<br />
                                    <strong style={{ color: "#0f172a" }}>{otpEmail}</strong>
                                </p>
                            </div>

                            <form onSubmit={handleVerifyOTP}>
                                <label style={lbl}>8-Digit Code</label>
                                <input
                                    type="text" required
                                    placeholder="00000000"
                                    maxLength={8}
                                    value={otpCode}
                                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, ""))}
                                    style={{ ...inp, letterSpacing: "4px", fontSize: "24px", textAlign: "center", fontWeight: 700 }}
                                    onFocus={fr} onBlur={bg}
                                />

                                {otpError && (
                                    <p style={{ fontSize: "13px", color: "#ef4444", marginBottom: "12px", marginTop: "-10px" }}>⚠ {otpError}</p>
                                )}

                                <button type="submit" style={submitBtn}>
                                    Verify Code
                                </button>
                            </form>

                            <p style={{ textAlign: "center", fontSize: "14px", color: "#64748b" }}>
                                Didn&apos;t receive it?{" "}
                                <button type="button" 
                                    onClick={async () => {
                                        try {
                                            await sendOTPMutation({ email: otpEmail, purpose: otpPurpose });
                                        } catch (e) {
                                            setOtpError("Failed to resend code.");
                                        }
                                    }}
                                    style={{ ...linkBtn, color: "#ff007f", textDecoration: "none" }}>
                                    Resend Code
                                </button>
                            </p>

                            <button onClick={() => setMode(otpPurpose === "signup" ? "signup" : "signin")} 
                                style={{ ...linkBtn, width: "100%", marginTop: "24px", textDecoration: "none", color: "#64748b", fontWeight: 500 }}>
                                ← Back to {otpPurpose === "signup" ? "Sign Up" : "Log In"}
                            </button>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
}
