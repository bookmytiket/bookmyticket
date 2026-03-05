"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import LeftBanner from "@/components/LeftBanner";
import { useAuth } from "@/components/AuthContext";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const BANNER_SLIDES = [
    { img: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1080&h=1080&fit=crop", title: "Live Events & Experiences", sub: "Book tickets for concerts, sports & more" },
    { img: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1080&h=1080&fit=crop", title: "Sports & Marathons", sub: "Events & activities near you" },
    { img: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1080&h=1080&fit=crop", title: "Comedy & Live Shows", sub: "Laugh out loud experiences" }
];

export default function SignInPage() {
    const { login } = useAuth();
    const [mode, setMode] = useState("signin"); // "signin" | "signup"

    // Sign In
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loginError, setLoginError] = useState("");

    // Sign Up
    const [signupName, setSignupName] = useState("");
    const [signupEmail, setSignupEmail] = useState("");
    const [signupPass, setSignupPass] = useState("");
    const [showSignupPass, setShowSignupPass] = useState(false);
    const [signupConfirm, setSignupConfirm] = useState("");
    const [signupError, setSignupError] = useState("");
    const [signupSuccess, setSignupSuccess] = useState(false);

    const [ssoConfigs, setSsoConfigs] = useState({ facebook: false, google: false });
    const convexSsoConfig = useQuery(api.systemConfig.getConfig, { key: "sso_configs" });
    useEffect(() => {
        if (convexSsoConfig && typeof convexSsoConfig === "object") setSsoConfigs(convexSsoConfig);
    }, [convexSsoConfig]);

    // Auto-detect role: "admin" → admin portal, anything else → organiser
    const detectRole = (id) => id.trim().toLowerCase() === "admin" ? "admin" : "organiser";

    const handleLogin = (e) => {
        e.preventDefault();
        setLoginError("");
        const ok = login(identifier, password, detectRole(identifier));
        if (!ok) setLoginError("Invalid email or password. Please try again.");
    };

    const handleSignup = (e) => {
        e.preventDefault();
        setSignupError("");
        if (signupPass !== signupConfirm) { setSignupError("Passwords do not match."); return; }
        if (signupPass.length < 6) { setSignupError("Password must be at least 6 characters."); return; }
        const users = JSON.parse(localStorage.getItem("public_users") || "[]");
        if (users.find(u => u.email === signupEmail)) { setSignupError("An account with this email already exists."); return; }
        users.push({ name: signupName, email: signupEmail, password: signupPass, role: "user", createdAt: new Date().toISOString() });
        localStorage.setItem("public_users", JSON.stringify(users));
        setSignupSuccess(true);
    };

    const inp = { width: "100%", padding: "13px 16px", borderRadius: "10px", border: "1.5px solid #d1d5db", fontSize: "14px", color: "#1e293b", outline: "none", background: "#fff", boxSizing: "border-box", marginBottom: "18px", transition: "border-color .2s" };
    const lbl = { display: "block", fontSize: "14px", fontWeight: 600, color: "#374151", marginBottom: "6px" };
    const fr = e => { e.target.style.borderColor = "#FCE15D"; };
    const bg = e => { e.target.style.borderColor = "#d1d5db"; };
    const submitBtn = { width: "100%", padding: "14px", borderRadius: "50px", border: "none", background: "#FCE15D", color: "#000", fontWeight: 800, fontSize: "15px", cursor: "pointer", boxShadow: "0 6px 20px rgba(252,225,93,0.3)", marginBottom: "20px", marginTop: "4px" };
    const linkBtn = { background: "none", border: "none", color: "#0f172a", fontWeight: 700, cursor: "pointer", fontSize: "14px", textDecoration: "underline", padding: 0 };

    return (
        <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Inter','Roboto',sans-serif", background: "#f8fafc" }}>

            {/* ══ LEFT PANEL — Hero Banner ══ */}
            <div style={{ flex: 1.1, position: "relative", overflow: "hidden" }} className="hide-on-mobile">
                <LeftBanner slides={BANNER_SLIDES} />
            </div>

            {/* ══ RIGHT PANEL — Auth Form ══ */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px 40px", position: "relative" }}>

                <div style={{ width: "100%", maxWidth: "420px" }}>

                    {/* ══ SIGN IN ══ */}
                    {mode === "signin" && (
                        <>
                            <div style={{ textAlign: "center", marginBottom: "28px" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
                                    <span style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>Welcome to</span>
                                    <Link href="/"><img src="/logo.png" alt="BookMyTicket" style={{ height: "80px", width: "auto", display: "block" }} /></Link>
                                </div>
                                <p style={{ fontSize: "14px", color: "#475569", margin: 0 }}>
                                    Don&apos;t have an account?{" "}
                                    <button style={linkBtn} onClick={() => { setMode("signup"); setLoginError(""); }}>
                                        Create one now
                                    </button>
                                </p>
                            </div>

                            <form onSubmit={handleLogin}>
                                <label style={lbl}>Email address</label>
                                <input
                                    type="text" required
                                    placeholder="example@example.com"
                                    value={identifier}
                                    onChange={e => setIdentifier(e.target.value)}
                                    style={inp} onFocus={fr} onBlur={bg}
                                />

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                    <label style={{ ...lbl, marginBottom: 0 }}>Password</label>
                                    <a href="#" style={{ fontSize: "13px", color: "#64748b", textDecoration: "underline" }}>Forgot password?</a>
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

                            {(ssoConfigs.google || ssoConfigs.facebook) && (
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
                        </>
                    )}

                    {/* ══ SIGN UP ══ */}
                    {mode === "signup" && (
                        <>
                            <div style={{ textAlign: "center", marginBottom: "28px" }}>
                                <h2 style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", marginBottom: "10px" }}>Create an account</h2>
                                <p style={{ fontSize: "14px", color: "#475569", margin: 0 }}>
                                    Already have an account?{" "}
                                    <button style={linkBtn} onClick={() => { setMode("signin"); setSignupError(""); setSignupSuccess(false); }}>
                                        Sign in
                                    </button>
                                </p>
                            </div>

                            {signupSuccess ? (
                                <div style={{ textAlign: "center", padding: "32px 16px", background: "#f0fdf4", borderRadius: "16px", border: "1.5px solid #bbf7d0" }}>
                                    <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
                                    <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#16a34a", marginBottom: "8px" }}>Account Created!</h3>
                                    <p style={{ fontSize: "14px", color: "#15803d", marginBottom: "20px" }}>
                                        Welcome, <strong>{signupName}</strong>! You can now explore and book events.
                                    </p>
                                    <button onClick={() => { setMode("signin"); setSignupSuccess(false); }}
                                        style={{ padding: "12px 28px", borderRadius: "50px", border: "none", background: "#FCE15D", color: "#000", fontWeight: 800, fontSize: "14px", cursor: "pointer", boxShadow: "0 4px 15px rgba(252,225,93,0.3)" }}>
                                        Go to Sign In
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSignup}>
                                    <label style={lbl}>Full Name</label>
                                    <input type="text" required placeholder="John Doe" value={signupName} onChange={e => setSignupName(e.target.value)} style={inp} onFocus={fr} onBlur={bg} />

                                    <label style={lbl}>Email Address</label>
                                    <input type="email" required placeholder="you@example.com" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} style={inp} onFocus={fr} onBlur={bg} />

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

                                    {signupError && (
                                        <p style={{ fontSize: "13px", color: "#ef4444", marginBottom: "12px", marginTop: "-10px" }}>⚠ {signupError}</p>
                                    )}

                                    <button type="submit" style={submitBtn}
                                        onMouseOver={e => e.currentTarget.style.opacity = ".88"}
                                        onMouseOut={e => e.currentTarget.style.opacity = "1"}>
                                        Create Account
                                    </button>
                                </form>
                            )}

                            <p style={{ marginTop: "8px", fontSize: "11px", color: "#94a3b8", textAlign: "center" }}>
                                By signing up you agree to our{" "}
                                <a href="#" style={{ color: "#475569", textDecoration: "underline" }}>Terms</a> &amp;{" "}
                                <a href="#" style={{ color: "#475569", textDecoration: "underline" }}>Privacy Policy</a>
                            </p>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
}
