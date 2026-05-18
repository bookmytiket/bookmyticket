"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

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
            className="modal-backdrop fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4"
            onClick={onClose}
        >
            <div
                className="signin-modal relative bg-white w-full max-w-[420px] rounded-2xl p-6 md:p-8 flex flex-col shadow-2xl min-h-[480px]"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors z-10"
                >✕</button>

                <h2 className="text-center mb-8 text-xl font-black text-[#1A1C2E] uppercase tracking-tighter">Get Started</h2>

                <div className="flex flex-col gap-3">
                    <button 
                        className="auth-btn"
                        onClick={async () => {
                            try {
                                const { error } = await supabase.auth.signInWithOAuth({
                                    provider: 'google',
                                    options: {
                                        redirectTo: `${window.location.origin}/auth/callback`
                                    }
                                });
                                if (error) throw error;
                            } catch (error) {
                                console.error("Google login error:", error);
                                alert("Failed to log in with Google.");
                            }
                        }}
                    >
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

                <div className="text-center my-6 text-slate-400 text-xs relative flex items-center justify-center">
                    <div className="absolute inset-x-0 h-px bg-slate-100"></div>
                    <span className="bg-white px-3 relative z-10 font-bold uppercase tracking-widest text-[9px]">OR</span>
                </div>

                <div className="relative mb-8">
                    <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
                        <div
                            onClick={() => setShowCountryList(!showCountryList)}
                            className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer"
                        >
                            <img src={country.flag} alt={country.name} className="w-5" />
                            <span>{country.code}</span>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform duration-200 ${showCountryList ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>
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
                            className="flex-1 border-none outline-none text-sm font-black text-slate-900 bg-transparent placeholder-slate-300 w-full"
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
                    className={`mt-auto transition-all duration-300 ${isPhoneValid ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'}`}
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
                        className="w-full py-4 bg-gradient-to-r from-[#f84464] to-[#c026d3] text-white font-black uppercase tracking-widest text-[11px] rounded-2xl shadow-xl shadow-pink-500/20 hover:scale-[1.02] active:scale-95 transition-all mb-4"
                    >
                        Continue
                    </button>
                </div>

                <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                    By continuing, you agree to our <br />
                    <a href="#" className="text-slate-900 underline underline-offset-4 hover:text-pink-500 transition-colors">Terms of Service</a> & <a href="#" className="text-slate-900 underline underline-offset-4 hover:text-pink-500 transition-colors">Privacy Policy</a>
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
