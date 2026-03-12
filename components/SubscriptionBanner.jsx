"use client";
import React, { useState } from "react";

export default function SubscriptionBanner() {
    const [email, setEmail] = useState("");

    const handleSubscribe = (e) => {
        e.preventDefault();
        if (email) {
            alert(`Thank you for subscribing with ${email}!`);
            setEmail("");
        }
    };

    return (
        <section className="sub-banner-container" style={{
            padding: "40px 20px",
            width: "100%",
            maxWidth: "1240px",
            margin: "0 auto",
        }}>
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
                        style={{
                            background: "#ffcc00",
                            color: "#000",
                            border: "none",
                            borderRadius: "100px",
                            padding: "12px 36px",
                            fontSize: "15px",
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#e6b800";
                            e.currentTarget.style.transform = "scale(1.02)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#ffcc00";
                            e.currentTarget.style.transform = "scale(1)";
                        }}
                    >
                        Subscribe
                    </button>
                </form>
            </div>
        </section>
    );
}
