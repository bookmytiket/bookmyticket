"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { isServiceProvider } from "@/app/data/serviceCategories";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedCity, setSelectedCity] = useState("");
    const [locationHierarchy, setLocationHierarchy] = useState({ country: "", state: "", district: "", city: "" });
    const router = useRouter();

    useEffect(() => {
        // Initial session load
        const initializeAuth = async () => {
            if (!supabase) {
                console.warn("AuthContext: Supabase client not initialized. Skipping session check.");
                setLoading(false);
                return;
            }

            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    const userData = await fetchAndSetUser(session.user);
                    if ((userData?.is_temporary_password || userData?.force_password_change) && !window.location.pathname.includes("/change-password")) {
                        console.log("AuthContext: Enforcing password security on session load.");
                        router.push("/change-password");
                    }
                }
            } catch (err) {
                console.error("AuthContext: Error getting session:", err);
            }

            const storedCity = localStorage.getItem("selectedCity");
            if (storedCity) setSelectedCity(storedCity);

            try {
                const storedHierarchy = localStorage.getItem("locationHierarchy");
                if (storedHierarchy) setLocationHierarchy(JSON.parse(storedHierarchy));
            } catch (err) {
                console.error("Error parsing stored hierarchy:", err);
            }
            
            setLoading(false);
        };

        initializeAuth();

        // Auth state listener
        let subscription = null;
        if (supabase) {
            const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(async (event, session) => {
                console.log("Supabase Auth Event:", event);
                
                // If it's a login event, we MUST show loading
                if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                    setLoading(true);
                }

                if (session) {
                    await fetchAndSetUser(session.user);
                } else {
                    setUser(null);
                    localStorage.removeItem("user");
                }
                
                // Always ensure loading is false after a session change is processed
                setLoading(false);
            });
            subscription = sub;
        }

        return () => subscription?.unsubscribe();
    }, [router]);

    const fetchAndSetUser = async (supabaseUser) => {
        if (!supabase) return null;
        try {
            // ── Fail-safe: 5s timeout to prevent hung database queries from blocking the entire app ──
            const fetchPromise = Promise.all([
                supabase.from('profiles').select('*').eq('id', supabaseUser.id).maybeSingle(),
                supabase.from('admins').select('*').eq('id', supabaseUser.id).maybeSingle(),
                supabase.from('organisers').select('*').eq('id', supabaseUser.id).maybeSingle(),
            ]);

            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Database timeout")), 5000)
            );

            let profileResult, adminResult, organiserResult;
            try {
                [profileResult, adminResult, organiserResult] = await Promise.race([fetchPromise, timeoutPromise]);
            } catch (err) {
                console.error("AuthContext: Profile fetch timed out or failed:", err);
                // Return minimal user data so the app doesn't hang
                const minimalUser = {
                    id: supabaseUser.id,
                    email: supabaseUser.email,
                    role: 'user', // Default to base role on timeout
                    name: supabaseUser.email?.split('@')[0],
                    is_pwa_mode: true
                };
                setUser(minimalUser);
                return minimalUser;
            }

            const profile         = profileResult.data;
            const adminRecord     = adminResult.data;
            const organiserRecord = organiserResult.data;

            if (profileResult.error && profileResult.error.code !== 'PGRST116') {
                console.warn("Profile fetch warning:", profileResult.error.message);
            }

            // Role priority: admin table → organisers table → profiles.role → user_metadata → 'user'
            let role = (
                profile?.role ||
                supabaseUser.user_metadata?.role ||
                'user'
            ).toLowerCase().replace(/\s+/g, '_');

            let specializedData = {};

            if (adminRecord) {
                // Admin: reuse already-fetched record — no extra query needed
                role = (adminRecord.role || 'admin').toLowerCase().replace(/\s+/g, '_');
                specializedData = adminRecord;
                console.log("AuthContext: Admin record found, role:", role);

            } else if (organiserRecord) {
                // Organiser/Vendor: use organisers table (real table name in this schema)
                role = organiserRecord.type === 'professional_service' ? 'vendor' : 'organiser';
                specializedData = organiserRecord;
                console.log("AuthContext: Organiser record found, role:", role);

            } else if (role === 'staff') {
                try {
                    const { data } = await supabase
                        .from('staff_details').select('*').eq('id', supabaseUser.id).maybeSingle();
                    if (data) specializedData = data;
                } catch (_) { /* graceful */ }
            }
            // Note: 'user' role doesn't need specialised table queries

            const userData = {
                id: supabaseUser.id,
                identifier: supabaseUser.email,
                email: supabaseUser.email,
                name: profile?.full_name ||
                      organiserRecord?.business_name ||
                      supabaseUser.user_metadata?.full_name ||
                      supabaseUser.email?.split('@')[0],
                ...(profile || {}),
                ...specializedData,
                is_temporary_password: profile?.is_temporary_password || specializedData?.is_temporary_password || false,
                role,
            };

            setUser(userData);
            localStorage.setItem("user", JSON.stringify(userData));
            return userData;
        } catch (err) {
            console.error("AuthContext: Critical error in fetchAndSetUser:", err);
            // In production, we need a way to know if this failed without a white screen
            if (typeof window !== 'undefined') {
                window.auth_error = err.message;
            }
            return null;
        }
    };



    const updateCity = async (city, hierarchy = null) => {
        setSelectedCity(city);
        localStorage.setItem("selectedCity", city);
        if (hierarchy) {
            setLocationHierarchy(hierarchy);
            localStorage.setItem("locationHierarchy", JSON.stringify(hierarchy));
        }

        // Sync to backend if user is logged in
        if (user?.id && supabase) {
            try {
                await supabase
                    .from('profiles')
                    .update({ 
                        selected_city: city, 
                        location_hierarchy: hierarchy || undefined 
                    })
                    .eq('id', user.id);
            } catch (err) {
                console.error("Failed to sync location to backend:", err);
            }
        }
    };

    const login = async (identifier, password, redirectPath = null, meta = {}) => {
        if (!supabase) {
            return { success: false, error: "Authentication system not initialized. Please check configuration." };
        }
        setLoading(true);
        try {
            let email = identifier;
            
            // If identifier is not an email, try to find the email by username
            if (!identifier.includes("@")) {
                const { data: profile, error: profileErr } = await supabase
                    .from('profiles')
                    .select('email')
                    .ilike('username', identifier)
                    .single();
                
                if (profile?.email) {
                    email = profile.email;
                } else {
                    // Fire alert for username-not-found attempts too
                    fetch('/api/auth/security-alert', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: identifier.trim().toLowerCase(),
                            ip: meta.ip || 'Unknown',
                            userAgent: meta.userAgent || navigator.userAgent,
                            timestamp: new Date().toISOString(),
                        }),
                    }).catch(() => {}); // fire and forget
                    throw new Error("Invalid username or email.");
                }
            }

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                // Fire security alert for any credential failure (fire and forget)
                fetch('/api/auth/security-alert', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: email.trim().toLowerCase(),
                        ip: meta.ip || 'Unknown',
                        userAgent: meta.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'),
                        timestamp: new Date().toISOString(),
                    }),
                }).catch(() => {}); // fire and forget — never block the UI

                // Provide a clearer message for the most common failure modes.
                if (error.message?.toLowerCase().includes('email not confirmed')) {
                    throw new Error("Your email address has not been confirmed. Please complete signup first.");
                }
                if (error.message?.toLowerCase().includes('invalid login credentials')) {
                    throw new Error("Invalid email or password. Please check your credentials and try again.");
                }
                throw error;
            }

            const userData = await fetchAndSetUser(data.user);
            
            if (userData) {
                return { success: true, user: userData };
            }
            return { success: false, error: "Profile not found" };
        } catch (err) {
            console.error("Login error:", err);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        // Clear local state immediately to avoid race conditions with redirect guards
        localStorage.removeItem("user");
        setUser(null);
        
        if (supabase) {
            try {
                await supabase.auth.signOut();
            } catch (err) {
                console.error("Supabase signOut error:", err);
            }
        }
        
        router.replace("/signin");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, selectedCity, updateCity, locationHierarchy }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
