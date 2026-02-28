"use client";
import { useState, useEffect } from "react";


const COUNTRIES = [
    { code: "+91", flag: "https://flagcdn.com/w20/in.png", name: "India", len: 10 },
    { code: "+1", flag: "https://flagcdn.com/w20/us.png", name: "USA", len: 10 },
    { code: "+44", flag: "https://flagcdn.com/w20/gb.png", name: "UK", len: 10 },
    { code: "+971", flag: "https://flagcdn.com/w20/ae.png", name: "UAE", len: 9 },
    { code: "+65", flag: "https://flagcdn.com/w20/sg.png", name: "Singapore", len: 8 },
];

export default function SignInModal({ isOpen, onClose }) {
    const [phone, setPhone] = useState("");
    const [country, setCountry] = useState(COUNTRIES[0]);
    const [showCountryList, setShowCountryList] = useState(false);

    if (!isOpen) return null;

    const isPhoneValid = phone.length === country.len;

    return (
        <div
            className="modal-backdrop"
            onClick={onClose}
            style={{
                zIndex: 10000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.6)",
                position: "fixed",
                inset: 0
            }}
        >
            <div
                className="signin-modal"
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "#fff",
                    width: "100%",
                    maxWidth: "420px",
                    borderRadius: "8px",
                    padding: "32px 32px 24px",
                    position: "relative",
                    boxShadow: "0 15px 40px rgba(0,0,0,0.25)",
                    fontFamily: "'Roboto', 'Inter', sans-serif",
                    minHeight: "480px",
                    display: "flex",
                    flexDirection: "column"
                }}
            >
                <button
                    onClick={onClose}
                    style={{
                        position: "absolute",
                        top: "16px",
                        right: "16px",
                        background: "none",
                        border: "none",
                        fontSize: "20px",
                        cursor: "pointer",
                        color: "#6b7280",
                        fontWeight: "300",
                        zIndex: 10
                    }}
                >✕</button>

                <h2 style={{
                    textAlign: "center",
                    marginBottom: "36px",
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#333"
                }}>Get Started</h2>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <button className="auth-btn">
                        <img src="https://lh3.googleusercontent.com/COxitqgJr1sICpeqCu7IFH0LqJD9mi_SS9BW9Xm73Yp3eX9XvMSh5AR9Lp5rdKCAd3pXW18mI73R199Xp4G1fG3WvOT5xvBy2P5p" alt="Google" style={{ width: "20px" }} />
                        <span>Continue with Google</span>
                    </button>

                    <button className="auth-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                        </svg>
                        <span>Continue with Email</span>
                    </button>

                    <button className="auth-btn">
                        <svg width="20" height="20" viewBox="0 0 256 315" preserveAspectRatio="xMinYMin">
                            <path d="M213.803 167.03c.442 47.58 41.74 63.413 42.147 63.615-.353.99-6.63 22.813-22.022 45.304-13.27 19.42-27.106 38.74-48.597 39.144-21.103.352-27.896-12.592-52.064-12.592-24.124 0-31.65 12.239-51.71 13.018-20.407.728-36.423-21.05-49.805-40.354-27.352-39.535-48.267-111.758-19.962-161.025 14.032-24.47 39.11-39.948 62.1-40.354 17.584-.352 34.161 11.832 44.864 11.832 10.655 0 30.76-15.012 51.532-12.894 8.707.352 33.153 3.513 48.793 26.42-1.272.772-29.096 17.02-28.718 51.01h.442zM158.462 41.815c10.32-12.213 15.932-29.1 14.072-41.815-11.233.442-24.877 7.551-32.925 17.02-7.23 8.324-13.623 25.323-11.765 37.891 12.553 1.05 25.4-6.843 30.618-13.096z" fill="#000" />
                        </svg>
                        <span>Continue with Apple</span>
                    </button>
                </div>

                <div style={{ textAlign: "center", margin: "24px 0", color: "#999", fontSize: "12px", position: "relative" }}>
                    <span style={{ background: "#fff", padding: "0 10px", position: "relative", zIndex: 1 }}>OR</span>
                    <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "1px", background: "#eee" }}></div>
                </div>

                <div style={{ position: "relative", marginBottom: "30px" }}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        borderBottom: "1px solid #ddd",
                        paddingBottom: "8px",
                    }}>
                        <div
                            onClick={() => setShowCountryList(!showCountryList)}
                            style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", fontWeight: "500", color: "#333", cursor: "pointer" }}
                        >
                            <img src={country.flag} alt={country.name} style={{ width: "20px" }} />
                            <span>{country.code}</span>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ transform: showCountryList ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><polyline points="6 9 12 15 18 9" /></svg>
                        </div>
                        <input
                            type="tel"
                            placeholder="Continue with mobile number"
                            value={phone}
                            autoFocus
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, "");
                                if (val.length <= country.len) setPhone(val);
                            }}
                            style={{ flex: 1, border: "none", outline: "none", fontSize: "14px", color: "#333" }}
                        />
                    </div>

                    {showCountryList && (
                        <div style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            zIndex: 100,
                            background: "#fff",
                            border: "1px solid #eee",
                            borderRadius: "4px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            width: "160px",
                            padding: "4px 0"
                        }}>
                            {COUNTRIES.map((c) => (
                                <div
                                    key={c.code}
                                    onClick={() => { setCountry(c); setShowCountryList(false); setPhone(""); }}
                                    style={{ padding: "8px 12px", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", background: country.code === c.code ? "#f0f0f0" : "transparent" }}
                                    className="country-item"
                                >
                                    <img src={c.flag} alt={c.name} style={{ width: "18px" }} />
                                    <span>{c.code} ({c.name})</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div
                    style={{
                        marginTop: "auto",
                        opacity: isPhoneValid ? 1 : 0,
                        visibility: isPhoneValid ? "visible" : "hidden",
                        transform: isPhoneValid ? "translateY(0)" : "translateY(10px)",
                        transition: "all 0.3s ease-in-out"
                    }}
                >
                    <button
                        onClick={async () => {
                            if (isPhoneValid) {
                                try {
                                    const res = await fetch("/api/otp/send", {
                                        method: "POST",
                                        body: JSON.stringify({ phone, countryCode: country.code }),
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                        alert(`OTP successfully sent to ${country.code} ${phone}\nTransaction ID: ${data.transactionId}`);
                                        onClose();
                                    } else {
                                        alert("Failed to send OTP. Please try again.");
                                    }
                                } catch (e) {
                                    alert("Server error. Please try again later.");
                                }
                            }
                        }}
                        style={{
                            width: "100%",
                            padding: "14px",
                            borderRadius: "8px",
                            border: "none",
                            background: "#f84464", // BMS pink/red color
                            color: "#fff",
                            fontWeight: "600",
                            fontSize: "15px",
                            cursor: "pointer",
                            marginBottom: "20px",
                            boxShadow: "0 4px 12px rgba(248, 68, 100, 0.2)"
                        }}
                    >
                        Continue
                    </button>
                </div>

                <p style={{
                    textAlign: "center",
                    fontSize: "11px",
                    color: "#999",
                    lineHeight: "1.5",
                    margin: "0 0 16px 0"
                }}>
                    By continuing, you agree to our <br />
                    <a href="#" style={{ color: "#333", textDecoration: "underline" }}>Terms of Service</a> & <a href="#" style={{ color: "#333", textDecoration: "underline" }}>Privacy Policy</a>
                </p>
            </div>

            <style jsx>{`
                .auth-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    padding: 10px;
                    border-radius: 4px;
                    border: 1px solid #ddd;
                    background: #fff;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 14px;
                    color: #333;
                    width: 100%;
                }
                .auth-btn:hover {
                    background: #fbfbfb;
                    border-color: #ccc;
                }
                .auth-btn span {
                    flex: 1;
                    text-align: center;
                    margin-left: -20px; /* offset icon for true center text */
                }
                .country-item:hover {
                    background: #f9f9f9 !important;
                }
            `}</style>
        </div>
    );
}
