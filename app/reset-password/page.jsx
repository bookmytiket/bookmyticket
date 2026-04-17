"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

import { hashPassword } from "@/app/utils/hashPassword";

// ── Request Reset Link Form (shown when no token in URL) ──────────────────
function RequestResetForm() {
    const [reqEmail, setReqEmail]   = useState("");
    const [sending, setSending]     = useState(false);
    const [sent, setSent]           = useState(false);
    const [reqError, setReqError]   = useState("");

    const handleRequest = async (e) => {
        e.preventDefault();
        setReqError("");
        setSending(true);
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "send", email: reqEmail.trim().toLowerCase() }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || "Failed to send reset link.");
            setSent(true);
        } catch (err) {
            setReqError(err.message || "Something went wrong. Please try again.");
        } finally {
            setSending(false);
        }
    };

    if (sent) {
        return (
            <div style={cardStyle}>
                <div style={{ fontSize: "52px", marginBottom: "16px" }}>📬</div>
                <h2 style={titleStyle}>Check Your Inbox</h2>
                <p style={subStyle}>
                    A password reset link has been sent to <strong>{reqEmail}</strong>.
                    Please check your email (and spam folder) and click the link to reset your password.
                </p>
                <Link href="/signin" style={buttonStyle}>Back to Sign In</Link>
            </div>
        );
    }

    return (
        <div style={cardStyle}>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "28px" }}>
                <div style={{
                    width: "64px", height: "64px", borderRadius: "50%",
                    background: "linear-gradient(135deg,#f84464 0%,#a855f7 100%)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 16px", fontSize: "28px",
                    boxShadow: "0 8px 20px rgba(168,85,247,0.3)"
                }}>🔒</div>
                <h2 style={titleStyle}>Reset Your Password</h2>
                <p style={subStyle}>
                    Enter the email address linked to your account and we'll send you a reset link.
                </p>
            </div>

            <form onSubmit={handleRequest} style={{ width: "100%" }}>
                <label style={labelStyle}>Email Address</label>
                <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={reqEmail}
                    onChange={(e) => setReqEmail(e.target.value)}
                    style={{ ...inputStyle, marginBottom: "8px" }}
                />

                {reqError && (
                    <p style={{ color: "#ef4444", fontSize: "13px", marginBottom: "16px" }}>
                        ⚠ {reqError}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={sending}
                    style={{ ...buttonStyle, marginTop: "12px", opacity: sending ? 0.7 : 1 }}
                >
                    {sending ? "Sending…" : "Send Reset Link →"}
                </button>
            </form>

            <p style={{ marginTop: "20px", fontSize: "13px", color: "#94a3b8" }}>
                Remembered your password?{" "}
                <Link href="/signin" style={{ color: "#a855f7", fontWeight: 700, textDecoration: "none" }}>
                    Sign In
                </Link>
            </p>
        </div>
    );
}

function ResetPasswordForm() {

    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");
    const email = searchParams.get("email");
    const isForced = searchParams.get("force") === "true";

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [status, setStatus] = useState("idle"); // idle, loading, success, error
    const [errorMessage, setErrorMessage] = useState("");

    const [tokenValid, setTokenValid] = useState(null); // null=loading, true/false

    useEffect(() => {
        if (!token || !email || isForced) { setTokenValid(isForced ? true : false); return; }
        const verifyToken = async () => {
            try {
                const res = await fetch('/api/auth/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'verify', email, token })
                });
                const data = await res.json();
                setTokenValid(data.success);
            } catch (err) {
                console.error("Verification error:", err);
                setTokenValid(false);
            }
        };
        verifyToken();
    }, [token, email, isForced]);

    const handleReset = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setErrorMessage("Passwords do not match.");
            return;
        }
        if (newPassword.length < 6) {
            setErrorMessage("Password must be at least 6 characters.");
            return;
        }

        setStatus("loading");
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'update', 
                    email, 
                    token, 
                    newPassword 
                })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || "Failed to update password.");

            setStatus("success");
            
            // Helpful for forced reset: clear the flag in the local user object if present
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                if (parsed.identifier === email) {
                    parsed.forcePasswordChange = false;
                    parsed.is_temporary_password = false;
                    localStorage.setItem("user", JSON.stringify(parsed));
                }
            }
        } catch (err) {
            setStatus("error");
            setErrorMessage(err.message || "Failed to reset password. Link may be expired.");
        }
    };

    // ── No token: show a "Request reset link" form ──────────────────────────
    if (!isForced && (!token || !email)) {
        return <RequestResetForm />;
    }


    if (status === "success") {
        return (
            <div style={cardStyle}>
                <CheckCircle2 size={48} color="#22c55e" style={{ marginBottom: "16px" }} />
                <h2 style={titleStyle}>Password Reset!</h2>
                <p style={subStyle}>Your password has been updated successfully.</p>
                <Link href="/signin" style={buttonStyle}>Go to Sign In</Link>
            </div>
        );
    }

    if (!isForced && tokenValid === false) {
        return (
            <div style={cardStyle}>
                <AlertCircle size={48} color="#ef4444" style={{ marginBottom: "16px" }} />
                <h2 style={titleStyle}>Link Expired</h2>
                <p style={subStyle}>This password reset link has expired (valid for 10 minutes) or has already been used. Please request a new link.</p>
                <Link href="/signin" style={buttonStyle}>Back to Sign In</Link>
            </div>
        );
    }

    return (
        <div style={cardStyle}>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <img src="/logo.png" alt="Logo" style={{ height: "60px", marginBottom: "16px" }} />
                <h2 style={titleStyle}>{isForced ? "Security Update" : "Set New Password"}</h2>
                <p style={subStyle}>
                    {isForced 
                        ? "For your security, you must update the temporary password provided by the administrator."
                        : `Enter a new password for ${email}`}
                </p>
            </div>

            <form onSubmit={handleReset} style={{ width: "100%" }}>
                <label style={labelStyle}>New Password</label>
                <div style={{ position: "relative", marginBottom: "18px" }}>
                    <input
                        type={showPass ? "text" : "password"}
                        required
                        placeholder="Min. 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        style={inputStyle}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} style={eyeButtonStyle}>
                        {showPass ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                </div>

                <label style={labelStyle}>Confirm New Password</label>
                <input
                    type="password"
                    required
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={inputStyle}
                />

                {errorMessage && (
                    <p style={{ color: "#ef4444", fontSize: "13px", marginBottom: "16px" }}>⚠ {errorMessage}</p>
                )}

                <button type="submit" disabled={status === "loading"} style={buttonStyle}>
                    {status === "loading" ? "Resetting..." : "Reset Password"}
                </button>
            </form>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div style={pageStyle}>
            <Suspense fallback={<div>Loading...</div>}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}

// Inline styles for high-fidelity look as per app design
const pageStyle = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f8fafc",
    fontFamily: "'Inter', sans-serif",
    padding: "24px"
};

const cardStyle = {
    width: "100%",
    maxWidth: "400px",
    background: "#fff",
    padding: "40px",
    borderRadius: "20px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
};

const titleStyle = {
    fontSize: "24px",
    fontWeight: 800,
    color: "#0f172a",
    margin: "0 0 8px"
};

const subStyle = {
    fontSize: "14px",
    color: "#64748b",
    margin: "0 0 24px",
    textAlign: "center"
};

const labelStyle = {
    display: "block",
    fontSize: "14px",
    fontWeight: 600,
    color: "#374151",
    marginBottom: "6px"
};

const inputStyle = {
    width: "100%",
    padding: "13px 16px",
    borderRadius: "10px",
    border: "1.5px solid #d1d5db",
    fontSize: "14px",
    color: "#1e293b",
    outline: "none",
    boxSizing: "border-box",
    marginBottom: "18px"
};

const buttonStyle = {
    width: "100%",
    padding: "14px",
    borderRadius: "50px",
    border: "none",
    background: "linear-gradient(135deg, #f84464 0%, #c026d3 100%)",
    color: "#fff",
    fontWeight: 800,
    fontSize: "15px",
    cursor: "pointer",
    boxShadow: "0 6px 20px rgba(192,38,211,0.3)",
    textAlign: "center",
    textDecoration: "none",
    display: "block"
};

const eyeButtonStyle = {
    position: "absolute",
    right: "14px",
    top: "14px",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#94a3b8",
    padding: 0
};
