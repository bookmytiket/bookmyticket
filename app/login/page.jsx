"use client";
import { useState } from "react";
import { useAuth } from "@/components/AuthContext";
import Link from "next/link";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("organiser");
    const [error, setError] = useState(false);
    const { login } = useAuth();

    const handleSubmit = (e) => {
        e.preventDefault();
        setError(false);
        const success = login(email, password, role);
        if (!success) setError(true);
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f7fa", fontFamily: "sans-serif" }}>
            <div style={{ background: "#fff", padding: "40px", borderRadius: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", width: "100%", maxWidth: "400px" }}>
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                    <Link href="/">
                        <img src="/logo.png" alt="Logo" style={{ height: "40px", marginBottom: "16px" }} />
                    </Link>
                    <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#334155", margin: 0 }}>Portal Login</h1>
                    <p style={{ color: "#94a3b8", fontSize: "14px", marginTop: "8px" }}>Welcome back! Please enter your details.</p>
                </div>

                {error && (
                    <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "12px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", textAlign: "center", marginBottom: "20px", border: "1px solid #fca5a5" }}>
                        Invalid email or password for {role} role.
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: "20px" }}>
                        <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#334155", marginBottom: "8px" }}>Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", outline: "none", fontSize: "15px", boxSizing: "border-box" }}
                            placeholder="name@company.com"
                        />
                    </div>

                    <div style={{ marginBottom: "20px" }}>
                        <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#334155", marginBottom: "8px" }}>Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", outline: "none", fontSize: "15px", boxSizing: "border-box" }}
                            placeholder="••••••••"
                        />
                    </div>

                    <div style={{ marginBottom: "24px" }}>
                        <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#334155", marginBottom: "8px" }}>Login As</label>
                        <div style={{ display: "flex", gap: "12px" }}>
                            <button
                                type="button"
                                onClick={() => setRole("organiser")}
                                style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1.5px solid", borderColor: role === "organiser" ? "#3b82f6" : "#e2e8f0", background: role === "organiser" ? "#eff6ff" : "#fff", color: role === "organiser" ? "#3b82f6" : "#64748b", fontWeight: "600", cursor: "pointer", fontSize: "13px" }}
                            >Organiser</button>
                            <button
                                type="button"
                                onClick={() => setRole("admin")}
                                style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1.5px solid", borderColor: role === "admin" ? "#3b82f6" : "#e2e8f0", background: role === "admin" ? "#eff6ff" : "#fff", color: role === "admin" ? "#3b82f6" : "#64748b", fontWeight: "600", cursor: "pointer", fontSize: "13px" }}
                            >Admin</button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "none", background: "#3b82f6", color: "#fff", fontWeight: "700", fontSize: "15px", cursor: "pointer", transition: "background 0.2s", marginBottom: "24px" }}
                    >Sign In</button>
                </form>

                <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
                    <p style={{ fontSize: "12px", fontWeight: "700", color: "#475569", margin: "0 0 8px 0", textTransform: "uppercase" }}>Demo Credentials</p>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                        <div style={{ marginBottom: "4px" }}><strong>Admin:</strong> admin@bookmyticket.com / admin123</div>
                        <div><strong>Organiser:</strong> organiser@bookmyticket.com / organiser123</div>
                    </div>
                </div>

                <div style={{ marginTop: "24px", textAlign: "center" }}>
                    <Link href="/" style={{ fontSize: "14px", color: "#64748b", textDecoration: "none" }}>← Back to Main Website</Link>
                </div>
            </div>
        </div>
    );
}
