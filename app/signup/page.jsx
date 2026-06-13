"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, CheckCircle2, Ticket, Trophy, Smartphone, MapPin, Users, Phone, Mail, ChevronLeft , MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function SignUpPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState("email"); // "email" | "mobile"

    // Form State
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        countryCode: "+91",
        mobile: "",
        password: "",
        confirmPassword: "",
        city: "",
        state: "",
        referralCode: "",
        whatsappOptIn: true,
        subscribeUpdates: true,
        agreeTerms: false
    });
    const [showPass, setShowPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);

    // Mobile OTP State
    const [otpStep, setOtpStep] = useState(1); // 1 = enter mobile, 2 = verify OTP
    const [otpCode, setOtpCode] = useState("");

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleEmailSignup = async (e) => {
        e.preventDefault();
        setError("");
        
        if (formData.password.length < 6) return setError("Password must be at least 6 characters.");
        
        setLoading(true);
        try {
            // Call the existing unified signup endpoint
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email.trim().toLowerCase(),
                    password: formData.password,
                    full_name: formData.fullName.trim(),
                    phone: formData.countryCode + formData.mobile.trim(),
                    // Pass additional fields for profile creation
                    meta: {
                        city: formData.city,
                        state: formData.state,
                        referral_code: formData.referralCode,
                        is_whatsapp_opt_in: formData.whatsappOptIn,
                        signup_method: "email"
                    }
                })
            });
            
            const data = await res.json();
            if (!data.success) throw new Error(data.error || "Failed to create account.");
            
            setSuccess(true);
            setTimeout(() => {
                router.push("/signin");
            }, 3000);
        } catch (err) {
            setError(err.message || "An error occurred during registration.");
        } finally {
            setLoading(false);
        }
    };

    const handleSendMobileOTP = async (e) => {
        e.preventDefault();
        setError("");
        if (!formData.mobile) return setError("Please enter your mobile number.");
        
        setLoading(true);
        try {
            const phone = formData.countryCode + formData.mobile.trim();
            const res = await fetch('/api/auth/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'send', phone, purpose: 'signup' })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || "Failed to send OTP.");
            
            setOtpStep(2);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyMobileOTP = async (e) => {
        e.preventDefault();
        setError("");
        if (otpCode.length !== 6) return setError("Please enter the 6-digit OTP.");
        
        setLoading(true);
        try {
            const phone = formData.countryCode + formData.mobile.trim();
            
            // Verify OTP
            const res = await fetch('/api/auth/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'verify', phone, code: otpCode, purpose: 'signup' })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || "Invalid OTP.");
            
            // Create Account passwordlessly
            const randomPass = Math.random().toString(36).slice(-12);
            const signupRes = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email ? formData.email.trim().toLowerCase() : `${formData.mobile}@bookmyticket.tmp`,
                    password: randomPass,
                    full_name: formData.fullName.trim() || "User",
                    phone: phone,
                    meta: {
                        city: formData.city,
                        state: formData.state,
                        referral_code: formData.referralCode,
                        is_whatsapp_opt_in: formData.whatsappOptIn,
                        signup_method: "mobile_otp"
                    }
                })
            });
            const signupData = await signupRes.json();
            if (!signupData.success) throw new Error(signupData.error);
            
            setSuccess(true);
            setTimeout(() => {
                router.push("/");
            }, 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Styling constants
    const inputClass = "w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 transition-all bg-slate-50 focus:bg-white";
    const labelClass = "block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider";

    return (
        <div className="min-h-screen w-full flex bg-slate-50 font-sans">
            
            {/* LEFT SECTION: PROMOTIONAL BANNER */}
            <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden bg-slate-900 text-white">
                <div className="absolute inset-0 z-0">
                    <img 
                        src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80" 
                        alt="Event Crowd" 
                        className="w-full h-full object-cover opacity-40 mix-blend-overlay"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-600/20 to-purple-600/20"></div>
                </div>

                <div className="relative z-10 flex flex-col h-full p-12 justify-between">
                    <div>
                        <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
                            <h1 className="text-4xl font-black tracking-tighter">book<span className="text-pink-500">my</span>ticket</h1>
                        </Link>
                    </div>

                    <div className="max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6 text-sm font-semibold">
                            <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
                            Join the fastest growing event platform
                        </div>
                        <h2 className="text-5xl font-black leading-tight mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
                            Discover. Book. Experience.
                        </h2>
                        <p className="text-lg text-slate-300 mb-10 leading-relaxed font-medium">
                            Join millions of users booking concerts, marathons, and cultural events instantly. Your next great experience starts here.
                        </p>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-pink-500/20 rounded-xl text-pink-400"><Ticket size={24} /></div>
                                <div>
                                    <h4 className="font-bold text-white mb-1">Instant Tickets</h4>
                                    <p className="text-sm text-slate-400">Get digital QR passes immediately after booking.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400"><Trophy size={24} /></div>
                                <div>
                                    <h4 className="font-bold text-white mb-1">Exclusive Events</h4>
                                    <p className="text-sm text-slate-400">Access to premium concerts and sports tournaments.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-10 border-t border-white/10 flex items-center justify-between">
                        <div>
                            <p className="text-3xl font-black">500k+</p>
                            <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">Happy Customers</p>
                        </div>
                        <div>
                            <p className="text-3xl font-black">10k+</p>
                            <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">Live Events</p>
                        </div>
                        <div>
                            <p className="text-3xl font-black">50+</p>
                            <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">Cities Served</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT SECTION: REGISTRATION FORM */}
            <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-y-auto" style={{ background: "#f8f5f0" }}>
                <Link href="/" className="absolute top-8 left-8 text-slate-400 hover:text-slate-800 flex items-center gap-2 font-semibold transition-colors lg:hidden">
                    <ChevronLeft size={20} /> Back
                </Link>

                <div className="w-full max-w-[480px]">
                    {success ? (
                        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center animate-in fade-in zoom-in duration-300 shadow-xl shadow-slate-200/50">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 size={32} />
                            </div>
                            <h3 className="text-2xl font-bold text-green-800 mb-2">Welcome Aboard!</h3>
                            <p className="text-green-600 font-medium mb-6">Your account has been created successfully. Redirecting you...</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden p-6 sm:p-8">
                            
                            {/* Header Info Box */}
                            <div style={{ background: "#fffbeb", border: "1px solid #fef3c7", padding: "12px", borderRadius: "12px", display: "flex", gap: "12px", marginBottom: "20px" }}>
                                <div style={{ color: "#d97706", marginTop: "2px", border: "1px solid #fcd34d", borderRadius: "8px", padding: "6px", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Mail size={20} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#1e293b", margin: "0 0 4px" }}>Sign up with Email and Password</h3>
                                    <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: 1.4 }}>Use the email address and password for registering</p>
                                </div>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-semibold flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div> {error}
                                </div>
                            )}

                            <form onSubmit={handleEmailSignup}>
                                {/* Name Field */}
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#1e293b", marginBottom: "6px" }}>Name</label>
                                <input type="text" name="fullName" required placeholder="Enter your name" value={formData.fullName} onChange={handleInputChange} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "14px", outline: "none" }} />
                                
                                {/* Email Field */}
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#1e293b", marginBottom: "6px", marginTop: "16px" }}>Email Address</label>
                                <input type="email" name="email" required placeholder="you@example.com" value={formData.email} onChange={handleInputChange} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "14px", outline: "none" }} />
                                
                                {/* Mobile Field */}
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#1e293b", marginBottom: "6px", marginTop: "16px" }}>Mobile number</label>
                                <div style={{ display: "flex", alignItems: "center", border: "1px solid #e2e8f0", borderRadius: "10px", paddingRight: "14px", overflow: "hidden" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "12px", borderRight: "1px solid #e2e8f0", background: "#f8fafc" }}>
                                        <span>🇮🇳</span>
                                        <span style={{ fontSize: "14px", color: "#334155", fontWeight: 500 }}>+91</span>
                                    </div>
                                    <input type="tel" name="mobile" required placeholder="9876543210" value={formData.mobile} onChange={handleInputChange} style={{ flex: 1, border: "none", outline: "none", padding: "12px", background: "transparent", fontSize: "14px" }} />
                                    <MessageCircle size={18} color="#22c55e" />
                                </div>

                                {/* Password Field */}
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#1e293b", marginBottom: "6px", marginTop: "16px" }}>Password</label>
                                <div style={{ position: "relative" }}>
                                    <input type={showPass ? "text" : "password"} name="password" required placeholder="Enter your password" value={formData.password} onChange={handleInputChange} style={{ width: "100%", padding: "12px", paddingRight: "50px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "14px", outline: "none" }} />
                                    <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: "16px", top: "12px", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}>
                                        {showPass ? <Eye size={18} /> : <EyeOff size={18} />}
                                    </button>
                                </div>

                                {/* Submit Button */}
                                <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #f84464 0%, #c026d3 100%)", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "14px", cursor: "pointer", marginTop: "20px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: loading ? 0.7 : 1 }}>
                                    {loading ? "Creating..." : "→] sign up"}
                                </button>
                            </form>
                            
                            <div className="mt-6 text-center">
                                <p className="text-slate-500 font-medium text-sm">
                                    Already have an account? <Link href="/signin" className="text-pink-600 font-bold hover:underline">Sign In here</Link>
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
