"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { hashPassword } from "@/app/utils/hashPassword";
import { isServiceProvider } from "@/app/data/serviceCategories";

/* ─── Slider content for the left panel ─── */
const SLIDES = [
  {
    title: "Welcome back to Sponsor Connect",
    badge: "Inside Sponsor Connect",
    desc: "Ticket9's sponsor connect is not just a platform — it's where real-world engagement begins. Every login opens doors to visibility, connection, and impact.",
  },
  {
    title: "Reach Thousands of Event-goers",
    badge: "Targeted Reach",
    desc: "Place your brand directly in front of engaged audiences at live events — music, tech, sports, and arts — across India.",
  },
  {
    title: "Measure Real Impact in Real Time",
    badge: "Analytics Dashboard",
    desc: "Track coupon redemptions, impressions, and campaign ROI from a single powerful dashboard the moment they happen.",
  },
];

/* ─── Left panel illustration ─── */
const LeftIllustration = () => (
  <div style={{ position: "relative", width: "100%", display: "flex", justifyContent: "center", alignItems: "flex-start", paddingTop: 20 }}>
    {/* Background glow */}
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 30%, rgba(99,102,241,0.2) 0%, transparent 70%)", pointerEvents: "none" }} />

    {/* Illustration card */}
    <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 320, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: 24, backdropFilter: "blur(12px)" }}>
      {/* Person with laptop illustration (emoji-based) */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16, fontSize: 64 }}>
        🧑‍💻
      </div>
      {/* Mail graphic */}
      <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 12, padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>📧</span>
          <div>
            <div style={{ fontSize: 11, color: "#a5b4fc", fontWeight: 700 }}>Campaign Live</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>3 coupons activated</div>
          </div>
        </div>
        <div style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, padding: "10px 14px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 20 }}>✅</span>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>KYC Done</div>
        </div>
      </div>
      {/* Stats row */}
      <div style={{ display: "flex", gap: 8 }}>
        {[
          { val: "83%", label: "Availed", color: "#34d399" },
          { val: "5.2x", label: "ROI", color: "#818cf8" },
          { val: "2.4K", label: "Reach", color: "#f472b6" },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "8px 6px", textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function BrandingSignIn() {
  const { login } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState("signin");
  const [slide, setSlide] = useState(0);

  // Mutations
  const sendOTP = useMutation(api.auth.sendOTP);
  const verifyOTPOnly = useMutation(api.auth.verifyOTPOnly);
  const loginMutation = useMutation(api.auth.login);
  const verifyLoginOTP = useMutation(api.auth.verifyLoginOTP);
  const registerPartner = useMutation(api.branding.registerPartner);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const hashed = await hashPassword(password);
      const res = await loginMutation({ identifier: email, password: hashed });
        if (res.success) {
          if (res.needsOtp) {
            setStep(2);
          } else if (res.role === "branding_partner") {
            await login(email, hashed, "branding_partner", res.data);
          } else if (isServiceProvider(res.data?.category)) {
            // If they are an artist/vendor trying to login through branding, redirect them to their dashboard
            await login(email, hashed, res.role, res.data);
          } else {
            setError("This account is not registered as a branding partner.");
          }
        } else {
        setError(res.error || "Invalid credentials.");
      }
    } catch (err) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sendOTP({ email, purpose: "signup" });
      setStep(2);
    } catch {
      setError("Failed to send verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signin") {
        const res = await verifyLoginOTP({ email, code: otp });
        if (res.success) await login(email, "", "branding_partner", res.data);
      } else {
        await verifyOTPOnly({ email, code: otp, purpose: "signup" });
        setStep(3);
      }
    } catch {
      setError("Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const hashed = await hashPassword(password);
      const username = email.split("@")[0] + "_" + Math.floor(Math.random() * 1000);
      const userId = await registerPartner({ email, password: hashed, name, username, code: otp });
      if (userId) {
        await login(email, hashed, "branding_partner", { _id: userId, fullName: name });
      }
    } catch (err) {
      setError(err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "signin" ? "signup" : "signin");
    setStep(1);
    setError("");
    setOtp("");
    setPassword("");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .signin-input {
          width: 100%;
          padding: 12px 16px;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          color: #111827;
          outline: none;
          background: #fff;
          transition: border-color 0.2s;
          font-family: 'Inter', sans-serif;
        }
        .signin-input:focus { border-color: #202548; }
        .signin-input::placeholder { color: #9ca3af; }
        .signin-btn-primary {
          width: 100%;
          padding: 13px;
          background: #1e1b4b;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
          font-family: 'Inter', sans-serif;
        }
        .signin-btn-primary:hover { background: #2d2a5d; }
        .signin-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .signin-label { font-size: 13px; font-weight: 600; color: #374151; display: block; margin-bottom: 6px; }
        .slide-dot { width: 8px; height: 8px; border-radius: 50%; border: none; cursor: pointer; transition: all 0.2s; }
      `}</style>

      {/* ── LEFT PANEL ── */}
      <div style={{
        flex: "0 0 42%",
        background: "linear-gradient(160deg, #0f1535 0%, #1a1f52 50%, #0f172a 100%)",
        display: "flex",
        flexDirection: "column",
        padding: "40px 48px",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Logo removed */}

        {/* Illustration */}
        <LeftIllustration />

        {/* Slide content */}
        <div style={{ marginTop: "auto", paddingTop: 32 }}>
          <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 12, lineHeight: 1.3 }}>
            {SLIDES[slide].title}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid rgba(99,102,241,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#818cf8" }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#818cf8" }}>{SLIDES[slide].badge}</span>
          </div>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: 24 }}>
            {SLIDES[slide].desc}
          </p>
          {/* Prev / Next arrows */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setSlide((slide - 1 + SLIDES.length) % SLIDES.length)}
              style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
            >←</button>
            <button
              onClick={() => setSlide((slide + 1) % SLIDES.length)}
              style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
            >→</button>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{
        flex: 1,
        background: "#f5f7ff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 48px",
        position: "relative",
      }}>
        <div style={{ width: "100%", maxWidth: 400, marginTop: 40 }}>
          {/* Logo moved centrally above text */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
            <Link href="/branding" style={{ textDecoration: "none", display: "inline-block" }}>
              <img src="/logo.png" alt="bookmyticket" style={{ height: 60, width: "auto", objectFit: "contain" }} />
            </Link>
          </div>

          {/* Step 1: Email + Password (signin) or Email (signup) */}
          {step === 1 && (
            <>
              <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 6, color: "#111827", textAlign: "center" }}>
                {mode === "signin" ? "Excited to See You Again! 👋" : "Create Partner Account 🚀"}
              </h2>
              <p style={{ fontSize: 14, color: "#6b7280", textAlign: "center", marginBottom: 32 }}>
                {mode === "signin"
                  ? "Log in to manage your sponsorships, coupons, and events in one place."
                  : "Join 100+ brands already growing with Ticket9 Branding."}
              </p>

              <form onSubmit={mode === "signin" ? handleLogin : handleSignupSendOTP}>
                {mode === "signup" && (
                  <div style={{ marginBottom: 20 }}>
                    <label className="signin-label">Full Name</label>
                    <input
                      className="signin-input"
                      type="text"
                      placeholder="Your brand name or contact name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                )}
                <div style={{ marginBottom: 20 }}>
                  <label className="signin-label">Email</label>
                  <input
                    className="signin-input"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                {mode === "signin" && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <label className="signin-label" style={{ marginBottom: 0 }}>Password</label>
                      <Link href="/reset-password" style={{ fontSize: 13, color: "#4f46e5", textDecoration: "none", fontWeight: 600 }}>
                        Forgot password?
                      </Link>
                    </div>
                    <div style={{ position: "relative" }}>
                      <input
                        className="signin-input"
                        type={showPass ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ paddingRight: 44 }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 18 }}
                      >
                        {showPass ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>
                )}

                {error && (
                  <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626", marginBottom: 16, textAlign: "center" }}>
                    ⚠ {error}
                  </div>
                )}

                <button className="signin-btn-primary" type="submit" disabled={loading}>
                  {loading ? "Please wait..." : (mode === "signin" ? "Sign In" : "Continue →")}
                </button>
              </form>

              <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "#6b7280" }}>
                {mode === "signin" ? "Haven't signed up yet? " : "Already have an account? "}
                <button
                  onClick={switchMode}
                  style={{ background: "none", border: "none", color: "#202548", fontWeight: 700, cursor: "pointer", fontSize: 14, textDecoration: "underline" }}
                >
                  {mode === "signin" ? "Create one now" : "Sign in"}
                </button>
              </p>
            </>
          )}

          {/* Step 2: OTP */}
          {step === 2 && (
            <>
              <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 6, color: "#111827", textAlign: "center" }}>Check Your Email 📬</h2>
              <p style={{ fontSize: 14, color: "#6b7280", textAlign: "center", marginBottom: 32 }}>
                We sent a 6-digit verification code to <strong>{email}</strong>
              </p>
              <form onSubmit={handleVerifyOTP}>
                <div style={{ marginBottom: 24 }}>
                  <label className="signin-label">Verification Code</label>
                  <input
                    className="signin-input"
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    style={{ textAlign: "center", fontSize: 22, fontWeight: 800, letterSpacing: 8 }}
                    required
                  />
                </div>
                {error && (
                  <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626", marginBottom: 16, textAlign: "center" }}>
                    ⚠ {error}
                  </div>
                )}
                <button className="signin-btn-primary" type="submit" disabled={loading}>
                  {loading ? "Verifying..." : "Verify Code →"}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(""); }}
                  style={{ display: "block", width: "100%", marginTop: 12, background: "none", border: "none", color: "#6b7280", fontSize: 14, cursor: "pointer", fontWeight: 500 }}
                >
                  ← Back to Email
                </button>
              </form>
            </>
          )}

          {/* Step 3: Complete signup (name + password) */}
          {step === 3 && (
            <>
              <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 6, color: "#111827", textAlign: "center" }}>Almost There! 🎉</h2>
              <p style={{ fontSize: 14, color: "#6b7280", textAlign: "center", marginBottom: 32 }}>
                Set your password to complete your partner account.
              </p>
              <form onSubmit={handleCompleteSignup}>
                <div style={{ marginBottom: 20 }}>
                  <label className="signin-label">Set a Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      className="signin-input"
                      type={showPass ? "text" : "password"}
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ paddingRight: 44 }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 18 }}
                    >
                      {showPass ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
                {error && (
                  <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626", marginBottom: 16, textAlign: "center" }}>
                    ⚠ {error}
                  </div>
                )}
                <button className="signin-btn-primary" type="submit" disabled={loading}>
                  {loading ? "Creating Account..." : "Create Partner Account →"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
