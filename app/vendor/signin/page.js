"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, Briefcase, Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { supabase } from "@/lib/supabase";
import { hashPassword } from "@/app/utils/hashPassword";

export default function VendorSignInPage() {
    const { login, loading: authLoading, user } = useAuth();
    const router = useRouter();

    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Redirect if already logged in as vendor
    useEffect(() => {
        if (!authLoading && user) {
            if (user.role === "organiser") {
                router.replace("/vendor/dashboard");
            } else {
                router.replace("/");
            }
        }
    }, [user, authLoading, router]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const id = identifier.trim().toLowerCase();
            const hashed = await hashPassword(password);

            // Query Supabase for the vendor
            const { data: vendor, error: supabaseError } = await supabase
                .from('service_providers')
                .select('*')
                .eq('organiser_id', id)
                .eq('password', hashed)
                .single();

            if (vendor && !supabaseError) {
                // Use AuthContext to establish session
                await login(id, hashed, "organiser", vendor, "/vendor/dashboard");
            } else {
                setError("Invalid credentials or access restricted.");
            }
        } catch (err) {
            console.error("Vendor login error:", err);
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6 font-syne relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-pink-500/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md z-10">
                {/* Logo & Branding */}
                <div className="text-center mb-10">
                    <Link href="/" className="inline-block mb-6">
                        <img src="/logo.png" alt="BookMyTicket" className="h-14 w-auto mx-auto" />
                    </Link>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/5 border border-slate-900/5 text-slate-600 mb-4">
                        <ShieldCheck size={14} className="text-pink-500" />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em]">Professional Service Portal</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">
                        Vendor <span className="text-pink-500">Access</span>
                    </h1>
                    <p className="text-slate-400 text-sm mt-2 font-medium tracking-wide">
                        The exclusive platform for premium service providers
                    </p>
                </div>

                {/* Login Form Card */}
                <div className="bg-white/70 backdrop-blur-3xl p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5">
                        <Briefcase size={80} className="text-slate-900" />
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Email / Identifier</label>
                            <input
                                type="text"
                                required
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder="Vendor ID"
                                className="w-full px-6 py-4 rounded-[1.2rem] bg-white border border-slate-100 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Secure Password</label>
                            <div className="relative">
                                <input
                                    type={showPass ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-6 py-4 rounded-[1.2rem] bg-white border border-slate-100 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all font-medium"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900 transition-colors"
                                >
                                    {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-500 text-xs font-bold flex items-center gap-3 ">
                                <span className="bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">!</span>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full group relative overflow-hidden py-5 rounded-[1.5rem] bg-slate-900 text-white font-black text-sm uppercase tracking-[0.2em] italic shadow-xl shadow-slate-900/10 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity " />
                            <span className="relative z-10 flex items-center justify-center gap-3">
                                {loading ? "Verifying..." : (
                                    <>
                                        Sign In Now
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </span>
                        </button>
                    </form>
                </div>

                {/* Bottom Links */}
                <div className="mt-8 text-center space-y-4">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                        Not a Professional Service? <Link href="/signin" className="text-pink-500 hover:underline ml-1">Member Login</Link>
                    </p>
                    <div className="flex items-center justify-center gap-6">
                        <Link href="/p/terms" className="text-[10px] font-black text-slate-300 hover:text-slate-900 uppercase tracking-[0.2em] transition-colors">Terms</Link>
                        <div className="w-1 h-1 bg-slate-200 rounded-full" />
                        <Link href="/p/privacy" className="text-[10px] font-black text-slate-300 hover:text-slate-900 uppercase tracking-[0.2em] transition-colors">Privacy</Link>
                        <div className="w-1 h-1 bg-slate-200 rounded-full" />
                        <Link href="/support" className="text-[10px] font-black text-slate-300 hover:text-slate-900 uppercase tracking-[0.2em] transition-colors">Help</Link>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                . {
                    animation: shake 0.3s ease-in-out;
                }
            `}</style>
        </div>
    );
}
