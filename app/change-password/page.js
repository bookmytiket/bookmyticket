"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { supabase } from "@/lib/supabase";
import { Shield, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import EmojiBackground from "@/components/EmojiBackground";

export default function ChangePasswordPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/signin");
        } else if (user && !user.is_temporary_password && !user.force_password_change) {
            // Already updated, redirect to dashboard
            if (user.role === "admin" || user.role === "super_admin") {
                router.push("/admin");
            } else if (user.role === "organiser") {
                const isProfessional = user.type === "professional_service";
                router.push(isProfessional ? "/vendor/dashboard" : "/organiser");
            } else {
                router.push("/profile");
            }
        }
    }, [user, authLoading, router]);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setError("");
        
        if (password.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            // 1. Clear Force Flag in Profile FIRST (to avoid AuthContext race condition)
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ 
                    is_temporary_password: false,
                    force_password_change: false 
                })
                .eq('id', user.id);

            // Try all relevant tables to ensure flags are cleared everywhere
            await Promise.allSettled([
                supabase.from('vendors').update({ is_temporary_password: false, force_password_change: false }).eq('id', user.id),
                supabase.from('organisers').update({ is_temporary_password: false, force_password_change: false }).eq('id', user.id)
            ]);

            // 2. Update Password in Auth (This triggers onAuthStateChange which fetches the now-updated profiles)
            const { error: authError } = await supabase.auth.updateUser({
                password: password
            });

            if (authError) throw authError;

            setSuccess(true);
            setTimeout(() => {
                // Redirect based on role
                if (user.role === "admin" || user.role === "super_admin") {
                    router.push("/admin");
                } else if (user.role === "organiser") {
                    const isProfessional = user.type === "professional_service";
                    router.push(isProfessional ? "/vendor/dashboard" : "/organiser");
                } else {
                    router.push("/profile");
                }
            }, 2000);

        } catch (err) {
            console.error("Password change error:", err);
            setError(err.message || "Failed to update password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || !user) return null;

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", position: "relative", overflow: "hidden", fontFamily: "'Inter', sans-serif" }}>
            <EmojiBackground />
            
            <div style={{ 
                width: "min(450px, 92vw)", 
                background: "rgba(255, 255, 255, 0.8)", 
                backdropFilter: "blur(20px)",
                borderRadius: "32px", 
                border: "1px solid rgba(255, 255, 255, 0.5)",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.08)",
                padding: "40px",
                position: "relative",
                zIndex: 10
            }}>
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                    <div style={{ 
                        width: "64px", 
                        height: "64px", 
                        background: "linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)", 
                        borderRadius: "20px", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        margin: "0 auto 20px",
                        boxShadow: "0 10px 15px -3px rgba(139, 92, 246, 0.3)"
                    }}>
                        <Shield color="white" size={32} />
                    </div>
                    <h1 style={{ fontSize: "24px", fontWeight: 900, color: "#1e293b", margin: "0 0 8px" }}>Secure Your Account</h1>
                    <p style={{ fontSize: "14px", color: "#64748b", lineHeight: "1.5" }}>
                        You're using a temporary password. Please set a new strong password to continue to your dashboard.
                    </p>
                </div>

                {success ? (
                    <div style={{ textAlign: "center", padding: "20px" }}>
                        <div style={{ color: "#10b981", marginBottom: "16px" }}>
                            <CheckCircle2 size={64} style={{ margin: "0 auto" }} />
                        </div>
                        <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#065f46", marginBottom: "8px" }}>Password Updated!</h3>
                        <p style={{ fontSize: "14px", color: "#059669" }}>Redirecting you to your dashboard...</p>
                    </div>
                ) : (
                    <form onSubmit={handlePasswordChange}>
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#475569", marginBottom: "8px" }}>New Password</label>
                            <div style={{ position: "relative" }}>
                                <input
                                    type={showPass ? "text" : "password"}
                                    required
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    style={{ 
                                        width: "100%", 
                                        padding: "14px 44px 14px 16px", 
                                        borderRadius: "14px", 
                                        border: "1.5px solid #e2e8f0", 
                                        fontSize: "15px",
                                        outline: "none",
                                        transition: "all 0.2s"
                                    }}
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPass(!showPass)}
                                    style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
                                >
                                    {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div style={{ marginBottom: "24px" }}>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#475569", marginBottom: "8px" }}>Confirm Password</label>
                            <input
                                type={showPass ? "text" : "password"}
                                required
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                style={{ 
                                    width: "100%", 
                                    padding: "14px 16px", 
                                    borderRadius: "14px", 
                                    border: "1.5px solid #e2e8f0", 
                                    fontSize: "15px",
                                    outline: "none"
                                }}
                            />
                        </div>

                        {error && (
                            <div style={{ 
                                display: "flex", 
                                gap: "10px", 
                                padding: "12px", 
                                background: "#fef2f2", 
                                border: "1px solid #fee2e2", 
                                borderRadius: "12px", 
                                marginBottom: "20px" 
                            }}>
                                <AlertCircle color="#ef4444" size={18} style={{ flexShrink: 0 }} />
                                <p style={{ fontSize: "13px", color: "#b91c1c", margin: 0 }}>{error}</p>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={loading}
                            style={{ 
                                width: "100%", 
                                padding: "16px", 
                                borderRadius: "16px", 
                                border: "none", 
                                background: "linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)", 
                                color: "white", 
                                fontWeight: 800, 
                                fontSize: "16px", 
                                cursor: loading ? "not-allowed" : "pointer",
                                boxShadow: "0 10px 20px -5px rgba(139, 92, 246, 0.3)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px"
                            }}
                        >
                            {loading ? (
                                <span style={{ width: "20px", height: "20px", border: "3px solid rgba(255,255,255,0.3)", borderTop: "3px solid white", borderRadius: "50%", display: "inline-block", animation: "spin 1s linear infinite" }} />
                            ) : (
                                <>
                                    Update Password <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>
                )}

                <div style={{ marginTop: "32px", textAlign: "center" }}>
                    <p style={{ fontSize: "12px", color: "#94a3b8" }}>
                        Lost access to your contact methods? <br />
                        <a href="mailto:support@bookmyticket.net" style={{ color: "#8b5cf6", fontWeight: 600, textDecoration: "none" }}>Contact Support</a>
                    </p>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            ` }} />
        </div>
    );
}
