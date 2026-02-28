"use client";
import { useState } from "react";

export default function RSVPPage() {
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <main>
            {/* Page Hero Banner */}
            <div style={{
                paddingTop: "140px",
                paddingBottom: "4rem",
                background: "linear-gradient(135deg, #1a044e 0%, #2d0f6e 50%, #4f46e5 100%)",
                textAlign: "center",
                color: "white",
                position: "relative",
                overflow: "hidden",
            }}>
                <div style={{
                    position: "absolute", inset: 0,
                    backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                    <h1 style={{ fontSize: "3.5rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", marginBottom: "0.75rem" }}>
                        RSVP
                    </h1>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "rgba(255,255,255,0.7)", fontSize: "0.95rem" }}>
                        <a href="/" style={{ color: "rgba(255,255,255,0.7)" }}>Home</a>
                        <span>›</span>
                        <span style={{ color: "white" }}>RSVP</span>
                    </div>
                </div>
            </div>

            {/* Form Section */}
            <section style={{ background: "#f1f5f9", padding: "5rem 0" }}>
                <div className="container">
                    {submitted ? (
                        <div style={{
                            maxWidth: "560px", margin: "0 auto", textAlign: "center",
                            background: "white", borderRadius: "20px", padding: "4rem 3rem",
                            boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
                        }}>
                            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🎉</div>
                            <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "1rem" }}>You&apos;re Registered!</h2>
                            <p style={{ color: "#64748b", lineHeight: 1.7 }}>
                                Thank you for your RSVP. We&apos;ll send you a confirmation email with your ticket details and event information shortly.
                            </p>
                        </div>
                    ) : (
                        <div className="rsvp-form-wrap">
                            <h2 className="rsvp-form-title">Reserve Your Seat</h2>
                            <p className="rsvp-form-subtitle">
                                Secure your spot at the Business Forward 2025 Innovation Summit — January 15–16, New York City.
                            </p>

                            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>First Name</label>
                                        <input type="text" placeholder="John" required />
                                    </div>
                                    <div className="form-group">
                                        <label>Last Name</label>
                                        <input type="text" placeholder="Doe" required />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input type="email" placeholder="john@example.com" required />
                                </div>

                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input type="tel" placeholder="+1 (555) 000-0000" />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Select Event</label>
                                        <select required>
                                            <option value="">Choose an event…</option>
                                            <option>Innovation Summit — Day 1 (Jan 15)</option>
                                            <option>Innovation Summit — Day 2 (Jan 16)</option>
                                            <option>Innovation Workshop — Evening (Jan 15)</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Number of Tickets</label>
                                        <select>
                                            {[1, 2, 3, 4, 5].map((n) => (
                                                <option key={n}>{n}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Message (optional)</label>
                                    <textarea
                                        rows={4}
                                        placeholder="Any special requirements or questions?"
                                        style={{ resize: "vertical" }}
                                    />
                                </div>

                                <button type="submit" className="form-submit">
                                    Register Now →
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}
