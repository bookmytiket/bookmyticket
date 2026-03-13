"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
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

    // Fetch Active Banners for the left panel
    const activeBanners = useQuery(api.banners.getActiveBanners);
    const [displaySlides, setDisplaySlides] = useState(FALLBACK_BANNER_SLIDES);

    useEffect(() => {
        if (activeBanners && activeBanners.length > 0) {
            const mapped = activeBanners.map(b => ({
                image: b.imageUrl,
                title: "",
                subtitle: ""
            }));
            setDisplaySlides(mapped);
        }
    }, [activeBanners]);

    // Sign In
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [isStaff, setIsStaff] = useState(false);
    const [loginError, setLoginError] = useState("");

    // Sign Up
    const [signupName, setSignupName] = useState("");
    const [signupEmail, setSignupEmail] = useState("");
    const [signupPass, setSignupPass] = useState("");
    const [showSignupPass, setShowSignupPass] = useState(false);
    const [signupConfirm, setSignupConfirm] = useState("");
    const [signupError, setSignupError] = useState("");
    const [signupSuccess, setSignupSuccess] = useState(false);

    // Forgot Password
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotSuccess, setForgotSuccess] = useState(false);
    const [forgotError, setForgotError] = useState("");

    const createUser = useMutation(api.users.create);
    const forgotPassMutation = useMutation(api.auth.forgotPassword);

    const [ssoConfigs, setSsoConfigs] = useState({ facebook: false, google: false, facebookConfig: {}, googleConfig: {} });
    const convexSsoSettings = useQuery(api.ssoSettings.get);
    useEffect(() => {
        if (convexSsoSettings) {
            setSsoConfigs({
                facebook: convexSsoSettings.facebookEnabled || false,
                google: convexSsoSettings.googleEnabled || false,
                facebookConfig: convexSsoSettings.facebookConfig || {},
                googleConfig: convexSsoSettings.googleConfig || {},
            });
        }
    }, [convexSsoSettings]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError("");

        const rawId = identifier.trim();
        const id = rawId.toLowerCase();
        const hashed = await hashPassword(password);

        // 1. Admin login check (Raw ID and Raw Password)
        if (rawId === "bookmyticket-admin") {
            const ok = await login(rawId, password, "admin", null, redirectPath);
            if (ok) return;
            setLoginError("Invalid admin credentials.");
            return;
        }

        // 2. Public User check (Lowercased ID, Hashed Password)
        try {
            const user = await convex.query(api.users.getByIdentifier, { identifier: id });
            if (user) {
                if (user.password === hashed) {
                    await login(id, hashed, "user", user, redirectPath);
                    return;
                } else {
                    setLoginError("Invalid password. Please try again.");
                    return;
                }
            }
        } catch (err) {
            console.error("User login error:", err);
        }

        // 3. Staff check (Lowercased ID, Hashed Password)
        const staffOk = await login(id, hashed, "staff", null, redirectPath);
        if (staffOk) return;

        // 4. Organiser check fallback (Lowercased ID, Hashed Password)
        const orgOk = await login(id, hashed, "organiser", null, redirectPath);
        if (orgOk) return;

        setLoginError("Invalid username / email or password. Please try again.");
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setSignupError("");
        if (signupPass !== signupConfirm) { setSignupError("Passwords do not match."); return; }
        if (signupPass.length < 6) { setSignupError("Password must be at least 6 characters."); return; }

        try {
            const hashed = await hashPassword(signupPass);
            await createUser({
                name: signupName,
                email: signupEmail,
                password: hashed,
                role: "user",
                createdAt: new Date().toISOString()
            });
            setSignupSuccess(true);
        } catch (err) {
            const msg = err.message || "";
            if (msg.includes("ACCOUNT_EXISTS")) {
                setSignupError("An account with this email already exists. Please Sign In instead.");
            } else {
                // Strip raw Convex error prefix if present
                const cleanMsg = msg.replace(/^\[CONVEX M\(.*\)\] \[Request ID: .*\] Server Error Uncaught Error: /, "");
                setSignupError(cleanMsg || "An error occurred during signup. Please try again.");
            }
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

            {/* ══ LEFT PANEL — Hero Banner ══ */}
            <div style={{ flex: 1.1, position: "relative", overflow: "hidden", padding: "24px" }} className="hide-on-mobile signin-left-banner">
                <div style={{ width: "100%", height: "100%", position: "relative", borderRadius: "20px", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
                        <HeroBanner slides={displaySlides} showDetails={false} showPromo={false} />
                    </div>
                </div>
            </div>

            {/* ══ RIGHT PANEL — Auth Form ══ */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", position: "relative" }}>

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

                </div>
            </div>
        </div>
    );
}
