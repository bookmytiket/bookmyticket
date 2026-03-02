"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";

/* ─── Left Banner Slides ─────────────────────── */
const BANNER_SLIDES = [
    {
        id: 1,
        type: "image",
        image: "https://images.unsplash.com/photo-1540039155733-d71efd44f808?q=80&w=900&fit=crop&auto=format",
        title: "Live Concerts",
        sub: "Experience music like never before",
    },
    {
        id: 2,
        type: "image",
        image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=900&fit=crop&auto=format",
        title: "Unforgettable Nights",
        sub: "Book your tickets instantly",
    },
    {
        id: 3,
        type: "promo",
    },
    {
        id: 4,
        type: "image",
        image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=900&fit=crop&auto=format",
        title: "Epic Festivals",
        sub: "Don't miss what's coming",
    },
];

const AUTO_PLAY_MS = 4000;

const FEATURES = [
    { num: "01", title: "Book Event Tickets", sub: "Instant confirmation" },
    { num: "02", title: "Easy Sign-Up", sub: "Super quick activation" },
    { num: "03", title: "Simple Registration", sub: "No hassle, no paperwork" },
    { num: "04", title: "Quick Setup", sub: "No setup cost, zero fee" },
];

/* ─── Left Panel Auto-Scrolling Banner ───────── */
function LeftBanner() {
    const [current, setCurrent] = useState(0);
    const [fading, setFading] = useState(false);
    const timerRef = useRef(null);
    const total = BANNER_SLIDES.length;

    const goTo = useCallback((idx) => {
        setFading(true);
        setTimeout(() => { setCurrent((idx + total) % total); setFading(false); }, 400);
    }, [total]);

    const next = useCallback(() => goTo(current + 1), [current, goTo]);
    const prev = useCallback(() => goTo(current - 1 + total), [current, goTo, total]);

    useEffect(() => {
        timerRef.current = setInterval(next, AUTO_PLAY_MS);
        return () => clearInterval(timerRef.current);
    }, [next]);

    const slide = BANNER_SLIDES[current];

    return (
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#0b0727" }}>
            <div style={{ position: "absolute", inset: 0, opacity: fading ? 0 : 1, transition: "opacity 0.4s ease" }}>
                {slide.type === "image" ? (
                    <>
                        <img src={slide.image} alt={slide.title} crossOrigin="anonymous"
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(11,7,39,0.3) 0%,rgba(11,7,39,0.72) 100%)" }} />
                        <div style={{ position: "absolute", bottom: "80px", left: "36px", right: "36px", color: "#fff" }}>
                            <h2 style={{ margin: 0, fontSize: "clamp(26px,4vw,42px)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-1px", textShadow: "0 2px 12px rgba(0,0,0,0.4)" }}>{slide.title}</h2>
                            <p style={{ margin: "8px 0 0", fontSize: "15px", color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>{slide.sub}</p>
                        </div>
                    </>
                ) : (
                    <div style={{ width: "100%", height: "100%", background: "linear-gradient(160deg,#0b0727 0%,#1a0640 40%,#2d0a6b 70%,#0b0727 100%)", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 36px", position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle,#ff2d7840 0%,transparent 70%)", top: "-60px", left: "-60px", pointerEvents: "none" }} />
                        <div style={{ position: "absolute", width: "350px", height: "350px", borderRadius: "50%", background: "radial-gradient(circle,#7c3aed30 0%,transparent 70%)", bottom: "-80px", right: "-60px", pointerEvents: "none" }} />
                        <p style={{ margin: "0 0 6px", fontSize: "11px", fontWeight: 800, letterSpacing: "3px", color: "#f84464", textTransform: "uppercase" }}>It's time to</p>
                        <h2 style={{ margin: 0, lineHeight: 0.9, fontWeight: 900, textTransform: "uppercase", fontSize: "clamp(44px,7vw,68px)", letterSpacing: "-2px", background: "linear-gradient(90deg,#fff 50%,#f84464 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ROCK<br />Events</h2>
                        <p style={{ margin: "8px 0 28px", fontStyle: "italic", fontSize: "18px", fontWeight: 700, color: "#e2a0ff" }}>Calendar</p>
                        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: "12px" }}>
                            {FEATURES.map(f => (
                                <li key={f.num} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <span style={{ fontWeight: 900, fontSize: "11px", color: "#f84464", minWidth: "22px" }}>{f.num}</span>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 700, fontSize: "11px", color: "#e2d9f3", letterSpacing: "1px", textTransform: "uppercase", lineHeight: 1 }}>{f.title}</p>
                                        <p style={{ margin: 0, fontSize: "10px", color: "#9d8ec2" }}>{f.sub}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "linear-gradient(90deg,#f84464,#c026d3)", padding: "10px 22px", borderRadius: "50px", fontSize: "11px", fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase", color: "#fff", alignSelf: "flex-start", boxShadow: "0 4px 20px rgba(248,68,100,0.4)" }}>
                            🎟 All Events Start Here
                        </div>
                    </div>
                )}
            </div>


        </div>
    );
}

/* ─── Main Sign-In Page ──────────────────────── */
export default function SignInPage() {
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [role, setRole] = useState("organiser");
    const [error, setError] = useState("");

    const handleLogin = (e) => {
        e.preventDefault();
        setError("");
        const ok = login(email, password, role);
        if (!ok) setError("Invalid email or password. Please try again.");
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Inter','Roboto',sans-serif" }}>

            {/* ══ LEFT — auto-scrolling banner ══ */}
            <div style={{ flex: "0 0 42%", position: "relative", overflow: "hidden" }}>
                <LeftBanner />
            </div>

            {/* ══ RIGHT — auth form ══ */}
            <div style={{ flex: 1, background: "#f8fafc", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 40px 40px", position: "relative" }}>

                {/* Centered logo at top — no background */}
                <div style={{ position: "absolute", top: "20px", left: "50%", transform: "translateX(-50%)" }}>
                    <Link href="/">
                        <img src="/logo.png" alt="BookMyTicket" style={{ height: "64px", width: "auto", display: "block" }} />
                    </Link>
                </div>

                <div style={{ width: "100%", maxWidth: "420px" }}>

                    {/* Heading */}
                    <h2 style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px", textAlign: "center" }}>
                        Good to see you again 👋
                    </h2>
                    <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 28px", textAlign: "center" }}>
                        Don't have an account?{" "}
                        <a href="#" style={{ color: "#f84464", fontWeight: 700, textDecoration: "none" }}>Create one now</a>
                    </p>

                    {/* Error */}
                    {error && (
                        <div style={{ background: "#fff5f5", border: "1px solid #fca5a5", color: "#b91c1c", padding: "12px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, marginBottom: "20px" }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin}>
                        {/* Email */}
                        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Email address</label>
                        <input
                            type="email" required
                            placeholder="example@example.com"
                            value={email} onChange={e => setEmail(e.target.value)}
                            style={{ width: "100%", padding: "13px 16px", borderRadius: "10px", border: "1.5px solid #d1d5db", fontSize: "14px", color: "#1e293b", outline: "none", background: "#fff", boxSizing: "border-box", marginBottom: "18px", transition: "border-color .2s" }}
                            onFocus={e => e.target.style.borderColor = "#f84464"}
                            onBlur={e => e.target.style.borderColor = "#d1d5db"}
                        />

                        {/* Password row */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                            <label style={{ fontSize: "14px", fontWeight: 600, color: "#374151" }}>Password</label>
                            <a href="#" style={{ fontSize: "13px", color: "#64748b", textDecoration: "underline" }}>Forgot password?</a>
                        </div>
                        <div style={{ position: "relative", marginBottom: "20px" }}>
                            <input
                                type={showPass ? "text" : "password"} required
                                placeholder="password"
                                value={password} onChange={e => setPassword(e.target.value)}
                                style={{ width: "100%", padding: "13px 48px 13px 16px", borderRadius: "10px", border: "1.5px solid #d1d5db", fontSize: "14px", color: "#1e293b", outline: "none", background: "#fff", boxSizing: "border-box", transition: "border-color .2s" }}
                                onFocus={e => e.target.style.borderColor = "#f84464"}
                                onBlur={e => e.target.style.borderColor = "#d1d5db"}
                            />
                            <button type="button" onClick={() => setShowPass(p => !p)}
                                style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0, lineHeight: 1 }}>
                                {showPass
                                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                }
                            </button>
                        </div>


                        {/* Log in button */}
                        <button type="submit" style={{
                            width: "100%", padding: "14px", borderRadius: "50px", border: "none",
                            background: "linear-gradient(90deg,#f84464,#e11d48)",
                            color: "#fff", fontWeight: 700, fontSize: "16px", cursor: "pointer",
                            boxShadow: "0 6px 20px rgba(248,68,100,0.35)", letterSpacing: ".3px",
                            transition: "opacity .2s", marginBottom: "20px"
                        }}
                            onMouseOver={e => e.currentTarget.style.opacity = ".9"}
                            onMouseOut={e => e.currentTarget.style.opacity = "1"}
                        >
                            Log in
                        </button>
                    </form>

                    {/* OR divider */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "0 0 16px", color: "#94a3b8", fontSize: "12px" }}>
                        <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
                        OR
                        <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
                    </div>

                    {/* Google */}
                    <button style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", padding: "13px 16px", borderRadius: "10px", border: "1.5px solid #e2e8f0", background: "#fff", fontSize: "14px", fontWeight: 600, color: "#1e293b", cursor: "pointer", transition: "border-color .2s" }}
                        onMouseOver={e => e.currentTarget.style.borderColor = "#94a3b8"}
                        onMouseOut={e => e.currentTarget.style.borderColor = "#e2e8f0"}
                    >
                        <img src="https://lh3.googleusercontent.com/COxitqgJr1sICpeqCu7IFH0LqJD9mi_SS9BW9Xm73Yp3eX9XvMSh5AR9Lp5rdKCAd3pXW18mI73R199Xp4G1fG3WvOT5xvBy2P5p" alt="G" style={{ width: "20px" }} />
                        Continue with Google
                    </button>

                    <p style={{ marginTop: "20px", fontSize: "11px", color: "#94a3b8", textAlign: "center", lineHeight: "1.6" }}>
                        By continuing you agree to our{" "}
                        <a href="#" style={{ color: "#475569", textDecoration: "underline" }}>Terms</a> &amp;{" "}
                        <a href="#" style={{ color: "#475569", textDecoration: "underline" }}>Privacy Policy</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
