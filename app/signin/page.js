"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail, X, Check, Copy, Smartphone, CheckCircle2, Zap, ShieldCheck } from "lucide-react";
import HeroBanner from "@/components/HeroBanner";
import { useAuth } from "@/components/AuthContext";
import { supabase } from "@/lib/supabase";
import { BRAND_COUPONS } from "@/app/data/homeEvents";
import CouponModal from "@/components/CouponModal";

import { isServiceProvider } from "@/app/data/serviceCategories";

const FALLBACK_BANNER_SLIDES = [
    { image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1080&h=1080&fit=crop", title: "Live Events & Experiences", subtitle: "Book tickets for concerts, sports & more" },
    { image: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1080&h=1080&fit=crop", title: "Sports & Marathons", subtitle: "Events & activities near you" },
    { image: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1080&h=1080&fit=crop", title: "Comedy & Live Shows", subtitle: "Laugh out loud experiences" }
];

const PARTNER_DEALS = [
    {
        id: "nykaa",
        logo: "https://nykaa.com/favicon.ico",
        brand: "Nykaa",
        title: "Get ₹250 Off on Nykaa Beauty Products!",
        desc: "From bold lipsticks to skin-loving serums, discover your new favorites...",
        expiry: "69 days left",
        image: "/coupons/nykaa_beauty_deal_1774253312733.png",
        color: "#f43f5e",
        discount: "250% OFF",
        url: "/events"
    },
    {
        id: "amazon",
        logo: "https://amazon.com/favicon.ico",
        brand: "Amazon",
        title: "Up to 50% Off on Premium Electronics",
        desc: "Upgrade your tech with the latest headphones, tablets and more.",
        expiry: "15 days left",
        image: "/coupons/amazon_tech_deal_1774253329075.png",
        color: "#2563eb",
        discount: "50% OFF",
        url: "/events"
    },
    {
        id: "myntra",
        logo: "https://myntra.com/favicon.ico",
        brand: "Myntra",
        title: "Flat 40% Off on Summer Collections",
        desc: "Trendy fashion and accessories to get you ready for the heat!",
        expiry: "30 days left",
        image: "/coupons/myntra_fashion_deal_image_1774253345705.png",
        color: "#f59e0b",
        discount: "40% OFF",
        url: "/events"
    }
];

export default function SignInPage() {
    const { user, login, loading: authLoading, fetchAndSetUser } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectPath = searchParams.get("redirect");
    const [mode, setMode] = useState("signin"); // "signin" | "signup" | "forgot"
    const [dealIdx, setDealIdx] = useState(0);
    const [currentTime, setCurrentTime] = useState("");
    const [selectedCoupon, setSelectedCoupon] = useState(null);
    const [batteryLevel, setBatteryLevel] = useState(85);
    const [isCharging, setIsCharging] = useState(false);
    const [isRealMobile, setIsRealMobile] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Removed mobile detection to keep phone mockup always visible

        const updateTime = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
        };
        updateTime();
        const timer = setInterval(updateTime, 1000);

        // Battery Status
        let batteryObj = null;
        const updateBattery = (bat) => {
            setBatteryLevel(Math.round(bat.level * 100));
            setIsCharging(bat.charging);
        };

        if (typeof navigator !== 'undefined' && navigator.getBattery) {
            navigator.getBattery().then(bat => {
                batteryObj = bat;
                updateBattery(bat);
                bat.addEventListener('levelchange', () => updateBattery(bat));
                bat.addEventListener('chargingchange', () => updateBattery(bat));
            }).catch(err => {
                console.warn("Battery API failed:", err);
                setBatteryLevel(prev => prev || 78);
            });
        } else {
            const simulatedLevel = 70 + Math.floor(Math.random() * 25);
            setBatteryLevel(simulatedLevel);
        }
        
        return () => { 
            clearInterval(timer); 
            if (batteryObj) {
                batteryObj.removeEventListener('levelchange', updateBattery);
                batteryObj.removeEventListener('chargingchange', updateBattery);
            }
        };
    }, []);
    
    const getRedirectDestination = (user, redirectPath) => {
        if (!user) return "/";
        
        // Normalize role
        const role = user?.role?.toLowerCase();

        // Role-based Default Destinations (Primary fallbacks)
        const getRoleDefault = (r) => {
            if (r === 'admin' || r === 'super_admin' || r === 'system_admin') return "/admin";
            if (r === 'staff' || r === 'scanner') return "/pwa-scan";
            if (r === 'organiser') return "/organiser";
            if (r === 'vendor' || r === 'branding_partner') return "/vendor/dashboard";
            return "/profile";
        };

        // 3. Decode and Validate Redirect Path
        let decodedRedirect = redirectPath ? decodeURIComponent(redirectPath) : null;
        if (decodedRedirect && decodedRedirect.toLowerCase().startsWith("/organiser")) {
            decodedRedirect = "/organiser";
        }
        
        
        // Paths considered "generic" or "invalid" that should trigger role-based defaults
        const isGeneric = !decodedRedirect || 
                         decodedRedirect === "/" || 
                         decodedRedirect === "" || 
                         decodedRedirect.includes("/signin") || 
                         decodedRedirect.includes("/signup");

        if (isGeneric) {
            return getRoleDefault(role);
        }

        // 4. Security & Authorization check for specific destinations
        const destination = decodedRedirect;
        const isAdminPath = destination.startsWith("/admin");
        const isBrandingPath = destination.startsWith("/branding");
        const isOrganiserPath = destination.startsWith("/organiser");
        const isVendorPath = destination.startsWith("/vendor");

        const isAuthorized = 
            (!isAdminPath || ["admin", "super_admin", "system_admin"].includes(role)) &&
            (!isBrandingPath || ["branding_partner", "admin", "super_admin", "system_admin"].includes(role)) &&
            (!isOrganiserPath || ["organiser", "staff", "admin", "super_admin", "system_admin"].includes(role)) &&
            (!isVendorPath || ["vendor", "organiser", "admin", "super_admin", "system_admin"].includes(role));

        // If trying to access a restricted path without authorization, go to default
        if (!isAuthorized) {
            console.warn(`SignInPage: Unauthorized access attempt to ${destination} for role ${role}. Redirecting to default.`);
            return getRoleDefault(role);
        }

        // 5. Special UI/UX Overrides
        // BOOKING REDIRECT: Always honor /events/book redirects — user was mid-booking
        if (destination.includes('/events/book') || destination.includes('/events/in') || destination.includes('/events/detail')) {
            return destination;
        }

        // If an organiser is logging in but was previously on a generic page (like home or profile),
        // we should probably steer them to their dashboard anyway for better UX.
        if (role === 'organiser' && (destination === '/' || destination === '/profile')) {
            return '/organiser';
        }

        return destination;
    };

    // Sign In State (moved up to prevent ReferenceError in useEffect)
    const [loading, setLoading] = useState(false);

    // REDIRECT GUARD: If already logged in, go to redirectPath or home
    useEffect(() => {
        // Prevent auto-redirect if we are actively verifying credentials or handling OTP
        if (loading || mode !== "signin") return;
        
        if (!authLoading && user && mounted) {
            const destination = getRedirectDestination(user, redirectPath);
            console.log("SignInPage: Auto-redirecting to:", destination);
            router.replace(destination);
        }
    }, [user, authLoading, router, redirectPath, mounted, mode, loading]);


    // Sign In
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [isStaff, setIsStaff] = useState(false);
    const [loginError, setLoginError] = useState("");
    const [userIp, setUserIp] = useState("Unknown IP");

    useEffect(() => {
        const fetchIp = async () => {
            try {
                const res = await fetch("https://api.ipify.org?format=json");
                const data = await res.json();
                setUserIp(data.ip || "Unknown IP");
            } catch (err) {
                console.error("Could not fetch user IP:", err);
            }
        };
        fetchIp();
    }, []);

    const [signupName, setSignupName] = useState("");
    const [signupEmail, setSignupEmail] = useState("");
    const [signupPass, setSignupPass] = useState("");
    const [showSignupPass, setShowSignupPass] = useState(false);
    const [signupConfirm, setSignupConfirm] = useState("");
    const [signupError, setSignupError] = useState("");
    const [signupSuccess, setSignupSuccess] = useState(false);
    const [signupStep, setSignupStep] = useState(1); // 1=email, 2=otp, 3=details
    const [signupOtpCode, setSignupOtpCode] = useState("");
    const [signupOtpVerified, setSignupOtpVerified] = useState(false);
    const [signupOtpVerifying, setSignupOtpVerifying] = useState(false);
    const [signupPhone, setSignupPhone] = useState("");
    const [signupPhoneOtpCode, setSignupPhoneOtpCode] = useState("");
    const [signupPhoneOtpSent, setSignupPhoneOtpSent] = useState(false);
    const [signupOtpSending, setSignupOtpSending] = useState(false);
    const [otpEnabled, setOtpEnabled] = useState(false);

    // SSO configurations fetched from system settings
    // SSO configurations: Default Google to true to ensure it shows up immediately
    const [ssoConfigs, setSsoConfigs] = useState({ facebook: false, google: true });

    useEffect(() => {
        const checkConfigs = async () => {
            try {
                // Check OTP
                const { data: otpData } = await supabase.from('communicationSettings').select('value').eq('key', 'otp_settings').maybeSingle();
                if (otpData?.value?.enabled) setOtpEnabled(true);

                // Check SSO
                const { data: ssoData } = await supabase.from('sso_settings').select('*').maybeSingle();
                if (ssoData) {
                    setSsoConfigs({
                        google: ssoData.google_enabled !== false, // Show if not explicitly false
                        facebook: !!ssoData.facebook_enabled
                    });
                }
            } catch (err) {
                console.warn("Could not fetch auth configs, using defaults:", err);
            }
        };
        checkConfigs();
    }, []);

    // Forgot Password
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotSuccess, setForgotSuccess] = useState(false);
    const [forgotError, setForgotError] = useState("");

    // OTP Verification
    const [otpCode, setOtpCode] = useState("");
    const [otpEmail, setOtpEmail] = useState("");
    const [otpPurpose, setOtpPurpose] = useState(""); // "login" | "signup"
    const [otpError, setOtpError] = useState("");
    const [pendingSignupData, setPendingSignupData] = useState(null);

    const handleLogin = async (e, skipOtp = false) => {
        if (e && e.preventDefault) e.preventDefault();
        setLoginError("");
        setLoading(true);

        const email = identifier.trim().toLowerCase();

        // Safety net: auto-reset loading after 10s to prevent permanent spinner
        const safetyTimer = setTimeout(() => setLoading(false), 10000);
        
        try {
            const result = await login(email, password, redirectPath, {
                ip: userIp,
                userAgent: navigator.userAgent,
            });
            
            if (!result.success) {
                setLoginError(result.error || "Invalid email or password.");
                return;
            } 
            
            const role = result.user?.role || 'public';
            const isAdmin = ['admin', 'super_admin', 'system_admin'].includes(role);

            if (isAdmin && !skipOtp) {
                // Immediately sign out to prevent session hijacking before OTP verification
                await supabase.auth.signOut();
                
                // Send Email OTP
                const res = await fetch('/api/auth/otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'send', email, purpose: 'login' })
                });
                const data = await res.json();
                
                if (!data.success) {
                    throw new Error(data.error || "Failed to send OTP.");
                }
                
                setOtpEmail(email);
                setOtpCode("");
                setMode("login_otp_verify");
            } else {
                // Immediate redirect on success to bypass useEffect delays
                const dest = getRedirectDestination(result.user, redirectPath);
                console.log("SignInPage: Immediate login success redirect to:", dest);
                
                if (isAdmin) {
                    window.location.href = dest;
                } else {
                    router.replace(dest);
                }
            }
        } catch (err) {
            console.error("Login error:", err);
            setLoginError(err.message || "An error occurred during login.");
        } finally {
            clearTimeout(safetyTimer);
            setLoading(false);
        }
    };

    const handleLoginSendOTP = async (e) => {
        e.preventDefault();
        setLoginError("");
        if (!identifier) { setLoginError("Please enter your email address."); return; }
        setLoading(true);
        try {
            const email = identifier.trim().toLowerCase();

            // Auto-register if user doesn't exist (unified flow)
            const checkRes = await fetch('/api/auth/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'send', email, purpose: 'login' })
            });
            const checkData = await checkRes.json();

            // If user not found, auto-create then send OTP
            if (!checkData.success && (checkData.error?.includes('not found') || checkData.error?.includes('no user') || checkData.error?.includes('does not exist'))) {
                const signupRes = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password: Math.random().toString(36).slice(-12), full_name: email.split('@')[0], role: 'user' })
                });
                const signupData = await signupRes.json();
                if (!signupData.success) throw new Error(signupData.error || "Could not create account.");

                // Retry OTP send after registration
                const retryRes = await fetch('/api/auth/otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'send', email, purpose: 'login' })
                });
                const retryData = await retryRes.json();
                if (!retryData.success) throw new Error(retryData.error || "Failed to send OTP.");
            } else if (!checkData.success) {
                throw new Error(checkData.error || "Failed to send OTP.");
            }

            setOtpEmail(email);
            setOtpCode("");
            setMode("login_otp_verify");
        } catch (err) {
            console.error("Login OTP send error:", err);
            setLoginError(err.message || "Could not send verification code.");
        } finally {
            setLoading(false);
        }
    };


    const handleLoginVerifyOTP = async (e) => {
        e.preventDefault();
        setLoginError("");
        if (otpCode.length !== 6) { setLoginError("Please enter the 6-digit code."); return; }
        setLoading(true);
        try {
            const res = await fetch('/api/auth/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'verify', email: otpEmail, code: otpCode, purpose: 'login' })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || "Invalid OTP.");

            if (data.session) {
                const { error: sessionError } = await supabase.auth.setSession({
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token
                });
                if (sessionError) throw sessionError;
                
                const { data: { session } } = await supabase.auth.getSession();
                let finalUser = session?.user;
                if (fetchAndSetUser) {
                    finalUser = await fetchAndSetUser(finalUser) || finalUser;
                }
                const dest = getRedirectDestination(finalUser, redirectPath);
                
                setTimeout(() => {
                    const isAdmin = ['admin', 'super_admin', 'system_admin'].includes(finalUser?.role);
                    if (isAdmin) {
                        window.location.href = dest;
                    } else {
                        router.replace(dest);
                    }
                }, 150);
            } else {
                throw new Error("Session data missing from server response.");
            }
        } catch (err) {
            console.error("Login OTP verify error:", err);
            const msg = err.message === "Failed to fetch" 
                ? "Network error. Please check your connection and try again."
                : (err.message || "Invalid or expired verification code.");
            setLoginError(msg);
        } finally {
            setTimeout(() => setLoading(false), 200);
        }
    };

    const handlePhoneLoginSendOTP = async (e) => {
        e.preventDefault();
        setLoginError("");
        if (!signupPhone) { setLoginError("Please enter your phone number."); return; }
        setLoading(true);
        try {
            const res = await fetch('/api/auth/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'send', phone: signupPhone, purpose: 'login' })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || "Failed to send SMS OTP.");
            setOtpCode("");
            setMode("phone_otp_verify");
        } catch (err) {
            console.error("Phone OTP send error:", err);
            setLoginError(err.message || "Could not send verification code.");
        } finally {
            setLoading(false);
        }
    };

    const handlePhoneLoginVerifyOTP = async (e) => {
        e.preventDefault();
        setLoginError("");
        if (otpCode.length !== 6) { setLoginError("Please enter the 6-digit code."); return; }
        setLoading(true);
        try {
            const res = await fetch('/api/auth/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'verify', phone: signupPhone, code: otpCode, purpose: 'login' })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || "Invalid OTP.");

            if (data.session) {
                const { error: sessionError } = await supabase.auth.setSession({
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token
                });
                if (sessionError) throw sessionError;
                
                const { data: { session } } = await supabase.auth.getSession();
                let finalUser = session?.user;
                if (fetchAndSetUser) {
                    finalUser = await fetchAndSetUser(finalUser) || finalUser;
                }
                const dest = getRedirectDestination(finalUser, redirectPath);
                
                setTimeout(() => {
                    router.replace(dest);
                }, 150);
            } else {
                throw new Error("Session data missing from server response.");
            }
        } catch (err) {
            console.error("Phone OTP verify error:", err);
            setLoginError(err.message || "Invalid or expired verification code.");
        } finally {
            setTimeout(() => setLoading(false), 200);
        }
    };


    const handleSignupSendOTP = async (e) => {
        e.preventDefault();
        setSignupError("");
        if (!signupEmail) { setSignupError("Please enter your email."); return; }
        if (!signupName) { setSignupError("Please enter your name."); return; }
        const email = signupEmail.trim();
        setSignupOtpSending(true);
        try {
            const res = await fetch('/api/auth/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'send', email, purpose: 'signup' })
            });
            const data = await res.json();
            if (!data.success) {
                if (data.error?.includes('already exists') || data.error?.includes('already registered')) {
                    setMode('signin');
                    setIdentifier(signupEmail);
                    setLoginError("You already have an account. Please continue with your email.");
                    return;
                }
                throw new Error(data.error || "Failed to send OTP.");
            }
            
            setSignupStep(2);
            setSignupOtpCode("");
        } catch (err) {
            console.error("Signup OTP error:", err);
            setSignupError(err.message || "Could not send verification code.");
        } finally {
            setSignupOtpSending(false);
        }
    };

    const handleSignupVerifyOTP = async (e) => {
        e.preventDefault();
        setSignupError("");
        if (signupOtpCode.length !== 6) { setSignupError("Please enter the 6-digit code."); return; }
        setSignupOtpVerifying(true);
        try {
            // 1. Verify OTP
            const res = await fetch('/api/auth/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'verify', email: signupEmail.trim(), code: signupOtpCode, purpose: 'signup' })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || "Invalid OTP.");

            // 2. Create User (Passwordless)
            // We'll use a random password since it's OTP-based signup
            const randomPass = Math.random().toString(36).slice(-12);
            const signupRes = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: signupEmail.trim().toLowerCase(),
                    password: randomPass,
                    full_name: signupName.trim(),
                    role: 'user'
                }),
            });
            const signupData = await signupRes.json();
            if (!signupData.success) throw new Error(signupData.error);
            
            setSignupOtpVerified(true);
            setSignupSuccess(true);
        } catch (err) {
            setSignupError(err.message || "Verification or signup failed.");
        } finally {
            setSignupOtpVerifying(false);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setSignupError("");
        if (signupPass !== signupConfirm) { setSignupError("Passwords do not match."); return; }
        if (signupPass.length < 6) { setSignupError("Password must be at least 6 characters."); return; }
        if (!signupName.trim()) { setSignupError("Please enter your full name."); return; }

        if (otpEnabled && !signupPhoneOtpSent) {
            // Send Phone OTP before finalizing
            if (!signupPhone) { setSignupError("Please enter your phone number."); return; }
            setLoading(true);
            try {
                const res = await fetch('/api/auth/otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'send', phone: signupPhone, purpose: 'signup' })
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.error || "Failed to send SMS OTP.");
                setSignupStep(4);
                setSignupPhoneOtpSent(true);
            } catch (err) {
                setSignupError(err.message);
            } finally {
                setLoading(false);
            }
            return;
        }

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: signupEmail.trim().toLowerCase(),
                    password: signupPass,
                    full_name: signupName.trim(),
                    phone: signupPhone,
                }),
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.error || "Signup failed.");



            setSignupSuccess(true);
        } catch (err) {
            console.error("Signup error:", err);
            setSignupError(err.message || "Could not create account. Please try again.");
        }
    };

    const handleSignupVerifyPhoneOTP = async (e) => {
        e.preventDefault();
        setSignupError("");
        if (signupPhoneOtpCode.length !== 6) { setSignupError("Please enter the 6-digit code."); return; }
        setLoading(true);
        try {
            const res = await fetch('/api/auth/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'verify', phone: signupPhone, code: signupPhoneOtpCode, purpose: 'signup' })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || "Invalid SMS OTP.");
            
            // Now finalize signup (calling handleSignup again but bypass OTP step)
            setSignupPhoneOtpSent(true);
            setSignupStep(3); // Go back but the next click will finish
            setTimeout(() => handleSignup({ preventDefault: () => {} }), 100);
        } catch (err) {
            setSignupError(err.message);
        } finally {
            setLoading(false);
        }
    };


    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setOtpError("");
        if (otpCode.length !== 6) { setOtpError("Please enter a valid 6-digit code."); return; }

        try {
            const res = await fetch('/api/auth/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'verify', email: otpEmail, code: otpCode, purpose: otpPurpose || 'login' })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || "Invalid OTP.");
            
            // Note: Since this is passwordless login via custom OTP, we need a custom token 
            // for the user session, or we rely exclusively on passwords via conventional login.
            // If they are just logging in here, they need a session.
            window.location.reload();
        } catch (err) {
            setOtpError(err.message || "Invalid or expired code. Please check and try again.");
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setForgotError("");
        setLoading(true);
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'send', email: forgotEmail.trim().toLowerCase() })
            });
            
            let data;
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                data = await res.json();
            } else {
                const text = await res.text();
                // If it's HTML or some other junk, provide a readable fallback
                throw new Error(text.includes("<!DOCTYPE") ? "Server error: link is temporarily unavailable." : text);
            }

            if (!data.success) throw new Error(data.error || "Failed to send reset link.");
            
            setForgotSuccess(true);
        } catch (err) {
            console.error("Forgot pass error:", err);
            setForgotError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    
    // ── SSO Login Handler ──
    const handleSSOLogin = async (provider) => {
        setLoading(true);
        setLoginError("");
        try {
            // Build the callback URL, passing the desired final destination as a query parameter
            const nextUrl = redirectPath ? encodeURIComponent(redirectPath) : encodeURIComponent('/');
            const callbackUrl = `${window.location.origin}/auth/callback?next=${nextUrl}`;
            
            const { error } = await supabase.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: callbackUrl
                }
            });
            if (error) throw error;
        } catch (err) {
            console.error(`${provider} login error:`, err);
            setLoginError(`${provider} login is currently unavailable.`);
        } finally {
            setLoading(false);
        }
    };

    const inp = { 
        width: "100%", 
        padding: "12px 16px", 
        borderRadius: "12px", 
        border: "1px solid #e2e8f0", 
        fontSize: "14px", 
        color: "#1e293b", 
        outline: "none", 
        background: "#fff", 
        boxSizing: "border-box", 
        marginBottom: "10px", 
        transition: "all .3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
    };
    const lbl = { display: "block", fontSize: "14px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" };
    const fr = e => { 
        e.target.style.borderColor = "#f84464"; 
        e.target.style.boxShadow = "0 0 0 4px rgba(248, 68, 100, 0.1)";
    };
    const bg = e => { 
        e.target.style.borderColor = "#e2e8f0"; 
        e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.02)";
    };
    const submitBtn = { 
        width: "100%", 
        padding: "14px", 
        borderRadius: "14px", 
        border: "none", 
        background: "linear-gradient(135deg, #f84464 0%, #a855f7 100%)", 
        color: "#fff", 
        fontWeight: 800, 
        fontSize: "15px", 
        cursor: "pointer", 
        marginBottom: "12px", 
        marginTop: "6px", 
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", 
        boxShadow: "0 6px 12px rgba(248, 68, 100, 0.2)" 
    };
    const socialBtn = {
        flex: 1,
        height: "46px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        background: "#fff",
        cursor: "pointer",
        transition: "0.2s"
    };
    const linkBtn = { background: "none", border: "none", color: "#3b82f6", fontWeight: 700, cursor: "pointer", fontSize: "13px", textDecoration: "underline", padding: 0 };

    const activeDeal = PARTNER_DEALS[dealIdx];

    return (
        <div style={{ minHeight: "100vh", display: "flex", width: "100%", fontFamily: "'Inter','Roboto',sans-serif", background: "#f8f5f0", position: "relative" }}>

            <style dangerouslySetInnerHTML={{ __html: `
                @media (max-width: 1200px) {
                    .hide-on-mobile { display: none !important; }
                    .signin-wrapper { justify-content: center !important; }
                }
                @media (max-width: 640px) {
                    .signin-wrapper { padding: 10px !important; background: transparent !important; }
                }
                /* Phone mockup frame stays consistent across all devices */
                body { overflow-x: hidden; margin: 0; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            ` }} />
            
            {/* Render Coupon Modal if selected */}
            {selectedCoupon && (
                <CouponModal 
                    coupon={selectedCoupon} 
                    onClose={() => setSelectedCoupon(null)} 
                />
            )}

            {/* ══ LEFT SIDE: AUTO-SCROLLING COUPONS ══ */}
            <div className="hide-on-mobile" style={{ 
                flex: 1.2, 
                background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)", 
                position: "relative",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                padding: "40px"
            }}>
                {/* Decorative background elements */}
                <div style={{ position: "absolute", top: "-10%", right: "-10%", width: "400px", height: "400px", background: "rgba(244, 63, 94, 0.1)", borderRadius: "50%", filter: "blur(80px)" }} />
                <div style={{ position: "absolute", bottom: "-10%", left: "-10%", width: "300px", height: "300px", background: "rgba(99, 102, 241, 0.1)", borderRadius: "50%", filter: "blur(60px)" }} />

                <div style={{ width: "100%", maxWidth: "500px", zIndex: 2 }}>
                    <div style={{ marginBottom: "40px" }}>
                        <h2 style={{ fontSize: "32px", fontWeight: 900, color: "#fff", marginBottom: "12px", letterSpacing: "-0.02em" }}>Exclusive Partner Deals</h2>
                        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "16px", lineHeight: "1.6" }}>
                            Sign in to unlock amazing offers from our premium brand partners.
                        </p>
                    </div>

                    {/* Auto-scrolling Card Container */}
                    <div style={{ 
                        position: "relative", 
                        height: "380px", 
                        width: "100%",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        gap: "20px"
                    }}>
                        {/* Current Card with animation */}
                        <div 
                            key={dealIdx} 
                            onClick={() => {
                                // Map the local deal structure to match what CouponModal expects
                                setSelectedCoupon({
                                    ...activeDeal,
                                    bannerUrl: activeDeal.image,
                                    brandName: activeDeal.brand,
                                    logoUrl: activeDeal.logo,
                                    description: activeDeal.desc,
                                    discountValue: activeDeal.discount.replace(/[^0-9]/g, '') || "250",
                                    redirectUrl: activeDeal.url || "https://google.com"
                                });
                            }}
                            style={{
                                animation: "slideInVertical 0.8s ease-out forwards",
                                background: "#fff",
                                borderRadius: "24px",
                                overflow: "hidden",
                                boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
                                display: "flex",
                                height: "100%",
                                cursor: "pointer",
                                transition: "all 0.3s ease"
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
                            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                        >
                             <div style={{ flex: 1, padding: "30px", display: "flex", flexDirection: "column" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                                    <img src={activeDeal.logo} alt="" style={{ width: "24px", height: "24px", borderRadius: "6px" }} />
                                    <span style={{ fontWeight: 800, fontSize: "14px", color: "#1e293b", textTransform: "uppercase" }}>{activeDeal.brand}</span>
                                </div>
                                <h3 style={{ fontSize: "22px", fontWeight: 900, color: "#0f172a", marginBottom: "12px", lineHeight: "1.3" }}>{activeDeal.title}</h3>
                                <p style={{ fontSize: "14px", color: "#64748b", flex: 1 }}>{activeDeal.desc}</p>
                                
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "20px", marginBottom: "15px" }}>
                                    <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>🕐 {activeDeal.expiry}</span>
                                    <span style={{ 
                                        padding: "4px 10px", 
                                        borderRadius: "100px", 
                                        background: `${activeDeal.color}15`, 
                                        color: activeDeal.color, 
                                        fontSize: "11px", 
                                        fontWeight: 800 
                                    }}>{activeDeal.discount}</span>
                                </div>

                                <div style={{ 
                                    width: "100%", 
                                    padding: "10px", 
                                    borderRadius: "12px", 
                                    background: "#f84464", 
                                    color: "#fff", 
                                    textAlign: "center", 
                                    fontWeight: 700, 
                                    fontSize: "13px" 
                                }}>
                                    View Deal →
                                </div>
                             </div>
                             <div style={{ flex: 0.8, background: `url(${activeDeal.image}) center/cover` }} />
                        </div>
                    </div>

                    {/* Pagination Indicators */}
                    <div style={{ display: "flex", gap: "8px", marginTop: "30px" }}>
                        {PARTNER_DEALS.map((_, i) => (
                            <div key={i} style={{ 
                                width: i === dealIdx ? "30px" : "8px", 
                                height: "8px", 
                                borderRadius: "4px", 
                                background: i === dealIdx ? "#f43f5e" : "rgba(255,255,255,0.2)",
                                transition: "all 0.3s ease"
                            }} />
                        ))}
                    </div>
                </div>
                <style dangerouslySetInnerHTML={{ __html: `
                    @keyframes slideInVertical {
                        0% { transform: translateY(30px); opacity: 0; }
                        100% { transform: translateY(0); opacity: 1; }
                    }
                    @keyframes pulse {
                        0% { opacity: 0.6; transform: translate(-50%, -50%) scale(0.9); }
                        50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                        100% { opacity: 0.6; transform: translate(-50%, -50%) scale(0.9); }
                    }
                ` }} />
            </div>

            {/* ══ RIGHT SIDE: SIGN IN FORM ══ */}
            <div className="signin-wrapper" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "15px", background: "transparent", position: "relative", overflowY: "auto", overflowX: "hidden" }}>

                {/* Connection Diagnostic Warning */}
                {!supabase && (
                    <div style={{ position: "absolute", top: "20px", left: "50%", transform: "translateX(-50%)", width: "90%", maxWidth: "400px", backgroundColor: "#fef2f2", border: "1px solid #fee2e2", padding: "12px", borderRadius: "12px", color: "#b91c1c", fontSize: "13px", fontWeight: 700, textAlign: "center", zIndex: 1000, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}>
                        ⚠️ Error: Authentication System Offline. <br/>
                        <span style={{ fontWeight: 400, fontSize: "11px" }}>Please configure Supabase environment variables in Vercel.</span>
                    </div>
                )}
                
                <div style={{ width: "100%", maxWidth: "480px", margin: "0 auto", position: "relative", zIndex: 10 }}>
                    
                    {/* Header Logo */}
                    <div className="mobile-header" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "20px" }}>
                        <Link href="/">
                            <img src="/logo.png" alt="BookMyTicket" className="mobile-logo" style={{ height: '60px', width: 'auto', objectFit: 'contain' }} />
                        </Link>
                        <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap", justifyContent: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(16, 185, 129, 0.1)", color: "#059669", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                                <CheckCircle2 size={12} strokeWidth={3} /> Easy
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(245, 158, 11, 0.1)", color: "#d97706", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
                                <Zap size={12} strokeWidth={3} /> Fast
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(59, 130, 246, 0.1)", color: "#2563eb", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
                                <ShieldCheck size={12} strokeWidth={3} /> Secure
                            </div>
                        </div>
                    </div>

                    {/* Toggle Bar */}
                    {(mode === "email_password" || mode === "login_otp" || mode === "login_otp_verify" || mode === "signin") && (
                        <div style={{ display: "flex", background: "#f3f4f6", padding: "6px", borderRadius: "12px", marginBottom: "24px" }}>
                            <button 
                                type="button"
                                onClick={() => { setMode("login_otp"); setLoginError(""); }}
                                style={{ flex: 1, padding: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "14px", transition: "all 0.2s ease", background: mode === "login_otp" || mode === "login_otp_verify" ? "linear-gradient(135deg, #f84464 0%, #c026d3 100%)" : "transparent", color: mode === "login_otp" || mode === "login_otp_verify" ? "#fff" : "#6b7280" }}
                            >
                                <Smartphone size={16} /> Email OTP
                            </button>
                            <button 
                                type="button"
                                onClick={() => { setMode("email_password"); setLoginError(""); }}
                                style={{ flex: 1, padding: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "14px", transition: "all 0.2s ease", background: mode === "email_password" || mode === "signin" ? "linear-gradient(135deg, #f84464 0%, #c026d3 100%)" : "transparent", color: mode === "email_password" || mode === "signin" ? "#fff" : "#6b7280" }}
                            >
                                <Mail size={16} /> Email & Password
                            </button>
                        </div>
                    )}

                    {/* Main Card */}
                    <div className="signin-card" style={{ background: "#ffffff", borderRadius: "16px", padding: "24px 20px", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.08)", border: "1px solid #f1f5f9" }}>
                        
                        {/* ══ LOGIN OTP SEND ══ */}
                        {(mode === "login_otp") && (
                            <>
                                <div style={{ background: "#fffbeb", border: "1px solid #fef3c7", padding: "16px", borderRadius: "12px", display: "flex", gap: "16px", marginBottom: "24px" }}>
                                    <div style={{ color: "#d97706", marginTop: "2px" }}><Mail size={20} /></div>
                                    <div>
                                        <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#92400e", margin: "0 0 4px" }}>Sign in with Email OTP</h3>
                                        <p style={{ fontSize: "13px", color: "#b45309", margin: 0, lineHeight: 1.4 }}>Receive a secure code in your inbox</p>
                                    </div>
                                </div>
                                <form onSubmit={handleLoginSendOTP}>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 800, color: "#1e293b", marginBottom: "8px" }}>Email Address</label>
                                    <input type="email" required placeholder="you@example.com" value={identifier} onChange={e => setIdentifier(e.target.value)} style={{...inp, padding: "12px", borderRadius: "10px", marginBottom: "20px", borderColor: "#e2e8f0"}} />
                                    
                                    {loginError && <div style={{ padding: "12px", background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: "10px", marginBottom: "16px", color: "#b91c1c", fontSize: "13px", fontWeight: 600 }}>⚠ {loginError}</div>}
                                    
                                    <button type="submit" disabled={loading} style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg, #f84464 0%, #c026d3 100%)", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "15px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: loading ? 0.7 : 1 }}>
                                        {loading ? "Sending..." : "Get OTP"}
                                    </button>
                                </form>
                                <div style={{ textAlign: "center", marginTop: "24px" }}>
                                    <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                                        Don't have an account? <Link href="/signup" style={{ color: "#f84464", fontWeight: 700, textDecoration: "none" }}>Sign up</Link>
                                    </p>
                                </div>
                            </>
                        )}

                        {/* ══ LOGIN OTP VERIFY ══ */}
                        {mode === "login_otp_verify" && (
                            <>
                                <div style={{ textAlign: "center", marginBottom: "24px" }}>
                                    <h1 style={{ fontSize: "24px", fontWeight: 900, color: "#1e1b4b", margin: "0 0 8px" }}>Verify OTP</h1>
                                    <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>Enter the code sent to <strong>{otpEmail}</strong></p>
                                </div>
                                <form onSubmit={handleLoginVerifyOTP}>
                                    <input type="text" required placeholder="000000" value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} style={{...inp, textAlign: "center", letterSpacing: "8px", fontSize: "24px", fontWeight: "bold", padding: "16px", borderRadius: "10px", marginBottom: "24px"}} autoFocus />
                                    {loginError && <div style={{ padding: "12px", background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: "10px", marginBottom: "20px", color: "#b91c1c", fontSize: "13px", fontWeight: 600 }}>⚠ {loginError}</div>}
                                    <button type="submit" disabled={loading || otpCode.length !== 6} style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #f84464 0%, #c026d3 100%)", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "15px", cursor: "pointer", opacity: (loading || otpCode.length !== 6) ? 0.7 : 1 }}>
                                        {loading ? "Verifying..." : "Verify & Login"}
                                    </button>
                                </form>
                                <div style={{ textAlign: "center", marginTop: "24px" }}>
                                    <button onClick={() => { setMode("login_otp"); setLoginError(""); }} style={{ background: "none", border: "none", color: "#a855f7", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}>Resend or Change Email</button>
                                </div>
                            </>
                        )}

                        {/* ══ LOGIN EMAIL PASSWORD ══ */}
                        {(mode === "email_password" || mode === "signin") && (
                            <>
                                <div style={{ background: "#fffbeb", border: "1px solid #fef3c7", padding: "12px", borderRadius: "10px", display: "flex", gap: "12px", marginBottom: "16px" }}>
                                    <div style={{ color: "#d97706", marginTop: "2px" }}><Mail size={18} /></div>
                                    <div>
                                        <h3 style={{ fontSize: "14px", fontWeight: 800, color: "#92400e", margin: "0 0 2px" }}>Sign in with Email</h3>
                                        <p style={{ fontSize: "12px", color: "#b45309", margin: 0, lineHeight: 1.3 }}>Use the email address and password you used when registering</p>
                                    </div>
                                </div>
                                
                                <form onSubmit={(e) => handleLogin(e, true)}>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#1e293b", marginBottom: "4px" }}>Email Address</label>
                                    <input type="email" required placeholder="you@example.com" value={identifier} onChange={e => setIdentifier(e.target.value)} style={{...inp, padding: "10px 12px", borderRadius: "8px", marginBottom: "12px", borderColor: "#e2e8f0", fontSize: "14px"}} />

                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                        <label style={{ fontSize: "12px", fontWeight: 800, color: "#1e293b", margin: 0 }}>Password</label>
                                        <button type="button" onClick={() => setMode("forgot")} style={{ background: "none", border: "none", fontSize: "12px", color: "#334155", fontWeight: 700, cursor: "pointer", padding: 0 }}>Forgot password?</button>
                                    </div>
                                    <div style={{ position: "relative", marginBottom: "16px" }}>
                                        <input type={showPass ? "text" : "password"} required placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} style={{ ...inp, padding: "10px 12px", paddingRight: "40px", borderRadius: "8px", margin: 0, borderColor: "#e2e8f0", fontSize: "14px" }} />
                                        <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: "absolute", right: "12px", top: "10px", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}>
                                            {showPass ? <Eye size={16} /> : <EyeOff size={16} />}
                                        </button>
                                    </div>

                                    {loginError && <div style={{ padding: "8px", background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: "8px", marginBottom: "12px", color: "#b91c1c", fontSize: "12px", fontWeight: 600 }}>⚠ {loginError}</div>}

                                    <button type="submit" disabled={loading} style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg, #f84464 0%, #c026d3 100%)", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: loading ? 0.85 : 1 }}>
                                        →] Sign In
                                    </button>
                                </form>
                                <div style={{ textAlign: "center", marginTop: "16px" }}>
                                    <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                                        Don't have an account? <Link href="/signup" style={{ color: "#f84464", fontWeight: 700, textDecoration: "none" }}>Sign up</Link>
                                    </p>
                                </div>
                            </>
                        )}

                        {/* ══ FORGOT PASSWORD ══ */}
                        {mode === "forgot" && (
                            <>
                                <div style={{ textAlign: "center", marginBottom: "28px" }}>
                                    <h2 style={{ fontSize: "24px", fontWeight: 900, color: "#1e1b4b", margin: "0 0 8px" }}>Reset Password</h2>
                                    <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>Enter your email to receive a reset link</p>
                                </div>
                                {forgotSuccess ? (
                                    <div style={{ textAlign: "center", padding: "24px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px" }}>
                                        <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#16a34a", margin: "0 0 16px" }}>Check your email</h3>
                                        <button onClick={() => setMode("email_password")} style={{ width: "100%", padding: "12px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, cursor: "pointer" }}>Back to Log In</button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleForgotPassword}>
                                        <label style={{ display: "block", fontSize: "13px", fontWeight: 800, color: "#1e293b", marginBottom: "8px" }}>Email Address</label>
                                        <input type="email" required placeholder="you@example.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} style={{...inp, padding: "14px", borderRadius: "10px", marginBottom: "24px", borderColor: "#e2e8f0"}} />
                                        {forgotError && <p style={{ fontSize: "13px", color: "#ef4444", marginBottom: "20px" }}>⚠ {forgotError}</p>}
                                        <button type="submit" style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #f84464 0%, #c026d3 100%)", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "15px", cursor: "pointer" }}>Send Reset Link</button>
                                        <div style={{ textAlign: "center", marginTop: "20px" }}>
                                            <button type="button" onClick={() => setMode("email_password")} style={{ background: "none", border: "none", color: "#64748b", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}>← Back to Sign In</button>
                                        </div>
                                    </form>
                                )}
                            </>
                        )}
                        
                        {/* ══ VERIFY OTP ══ */}
                        {mode === "verify-otp" && (
                            <>
                                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                                    <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#1e293b" }}>Verify</h2>
                                    <p style={{ fontSize: "14px", color: "#64748b" }}>OTP sent to {otpEmail}</p>
                                </div>

                                <form onSubmit={handleVerifyOTP}>
                                    <input
                                        type="text" required
                                        placeholder="000000"
                                        maxLength={6}
                                        value={otpCode}
                                        onChange={e => setOtpCode(e.target.value.replace(/\D/g, ""))}
                                        style={{ ...inp, letterSpacing: "4px", fontSize: "24px", textAlign: "center", fontWeight: 700, padding: "16px", borderRadius: "10px", marginBottom: "24px" }}
                                        autoFocus
                                    />
                                    {otpError && <p style={{ fontSize: "13px", color: "#ef4444", marginBottom: "12px" }}>⚠ {otpError}</p>}
                                    <button type="submit" style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #f84464 0%, #c026d3 100%)", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "15px", cursor: "pointer" }}>Verify Code</button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                @media (max-width: 768px) {
                    .signin-wrapper {
                        padding: 10px !important;
                    }
                    .signin-card {
                        padding: 24px 20px !important;
                    }
                    .mobile-header {
                        margin-bottom: 20px !important;
                    }
                    .mobile-logo {
                        height: 60px !important;
                    }
                    .signin-card input, .signin-card button {
                        padding: 12px !important;
                    }
                    .signin-card > div, .signin-card > form > div {
                        margin-bottom: 16px !important;
                    }
                }
            ` }} />
        </div>
    );
}
