"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

import { hashPassword } from "@/app/utils/hashPassword";

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [status, setStatus] = useState("idle"); // idle, loading, success, error
    const [errorMessage, setErrorMessage] = useState("");

    const verifyToken = useQuery(api.auth.verifyResetToken,
        token && email ? { token, email } : "skip"
    );
    const resetPassMutation = useMutation(api.auth.resetPassword);

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
            const hashed = await hashPassword(newPassword);
            await resetPassMutation({ token, email, newPassword: hashed });
            setStatus("success");
        } catch (err) {
            setStatus("error");
            setErrorMessage(err.message || "Failed to reset password. Link may be expired.");
        }
    };

    if (!token || !email) {
        return (
            <div style={cardStyle}>
                <AlertCircle size={48} color="#ef4444" style={{ marginBottom: "16px" }} />
                <h2 style={titleStyle}>Invalid Link</h2>
                <p style={subStyle}>This password reset link is invalid or incomplete.</p>
                <Link href="/signin" style={buttonStyle}>Go to Sign In</Link>
            </div>
        );
    }

    if (verifyToken === false) {
        return (
            <div style={cardStyle}>
                <AlertCircle size={48} color="#ef4444" style={{ marginBottom: "16px" }} />
                <h2 style={titleStyle}>Link Expired</h2>
                <p style={subStyle}>This password reset link has expired or is invalid.</p>
                <Link href="/signin" style={buttonStyle}>Go to Sign In</Link>
            </div>
        );
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

    return (
        <div style={cardStyle}>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <img src="/logo.png" alt="Logo" style={{ height: "60px", marginBottom: "16px" }} />
                <h2 style={titleStyle}>Set New Password</h2>
                <p style={subStyle}>Enter a new password for <strong>{email}</strong></p>
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
