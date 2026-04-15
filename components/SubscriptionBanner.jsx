"use client";
import React, { useState } from "react";
import { Check } from "lucide-react";

export default function SubscriptionBanner() {
    const [email, setEmail] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async (e) => {
        e.preventDefault();
        if (!email) return;
        setLoading(true);
        try {
            const res = await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Subscription failed.');
            setShowModal(true);
            setEmail("");
        } catch (err) {
            console.error("Subscription error:", err);
            alert(err.message || "An error occurred. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="sub-banner-container" style={{
            padding: "40px 20px",
            width: "100%",
            maxWidth: "1240px",
            margin: "0 auto",
        }}>
            {/* Custom Subscription Success Modal */}
            {showModal && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 9999,
                    backdropFilter: "blur(4px)",
                }} onClick={() => setShowModal(false)}>
                    <div style={{
                        background: "#fff",
                        borderRadius: "16px",
                        padding: "40px 30px",
                        maxWidth: "450px",
                        width: "90%",
                        textAlign: "center",
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                        position: "relative",
                        animation: "modalFadeIn 0.3s ease-out",
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{
                            width: "80px",
                            height: "80px",
                            backgroundColor: "#f0fdf4",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 24px",
                            border: "4px solid #f0fdf4",
                        }}>
                            <div style={{
                                width: "60px",
                                height: "60px",
                                backgroundColor: "#fff",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: "2px solid #bef264",
                            }}>
                                <Check size={36} color="#4ade80" strokeWidth={3} />
                            </div>
                        </div>

                        <h3 style={{
                            fontSize: "18px",
                            color: "#475569",
                            fontWeight: 600,
                            marginBottom: "30px",
                            lineHeight: "1.5",
                        }}>
                            Thank you for subscribing to our newsletter
                        </h3>

                        <button
                            onClick={() => setShowModal(false)}
                            style={{
                                background: "#7dd3fc",
                                color: "#fff",
                                border: "none",
                                borderRadius: "8px",
                                padding: "12px 30px",
                                fontSize: "16px",
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                width: "100px",
                                margin: "0 auto",
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#38bdf8"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "#7dd3fc"}
                        >
                            OK
                        </button>

                        <style>{`
                            @keyframes modalFadeIn {
                                from { opacity: 0; transform: translateY(-20px); }
                                to { opacity: 1; transform: translateY(0); }
                            }
                        `}</style>
                    </div>
                </div>
            )}

            <div style={{
                background: "linear-gradient(135deg, #f844a4 0%, #c026d3 100%)",
                borderRadius: "24px",
                padding: "60px 40px",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "30px",
                boxShadow: "0 20px 40px rgba(248, 68, 164, 0.2)",
            }}>
                <div style={{ flex: "1 1 400px" }}>
                    <p style={{
                        color: "rgba(255, 255, 255, 0.9)",
                        fontSize: "18px",
                        fontWeight: 600,
                        marginBottom: "8px",
                        letterSpacing: "0.01em"
                    }}>
                        Don't Miss Our Future Updates!
                    </p>
                    <h2 style={{
                        color: "#fff",
                        fontSize: "clamp(32px, 4vw, 48px)",
                        fontWeight: 900,
                        margin: 0,
                        lineHeight: 1.1,
                        letterSpacing: "-0.02em"
                    }}>
                        Get Subscribed Today!
                    </h2>
                </div>

                <form
                    onSubmit={handleSubscribe}
                    style={{
                        flex: "1 1 300px",
                        display: "flex",
                        maxWidth: "600px",
                        background: "#fff",
                        borderRadius: "100px",
                        padding: "4px",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                    }}
                >
                    <input
                        type="email"
                        placeholder="your e-mail address"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{
                            flex: 1,
                            border: "none",
                            outline: "none",
                            padding: "12px 24px",
                            fontSize: "16px",
                            color: "#1e293b",
                            background: "transparent",
                            width: "100%",
                        }}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            background: loading ? "#cca800" : "#ffcc00",
                            color: "#000",
                            border: "none",
                            borderRadius: "100px",
                            padding: "12px 36px",
                            fontSize: "15px",
                            fontWeight: 700,
                            cursor: loading ? "not-allowed" : "pointer",
                            transition: "all 0.3s ease",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            opacity: loading ? 0.7 : 1,
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) { e.currentTarget.style.background = "#e6b800"; e.currentTarget.style.transform = "scale(1.02)"; }
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) { e.currentTarget.style.background = "#ffcc00"; e.currentTarget.style.transform = "scale(1)"; }
                        }}
                    >
                        {loading ? "Subscribing..." : "Subscribe"}
                    </button>
                </form>
            </div>
        </section>
    );
}
