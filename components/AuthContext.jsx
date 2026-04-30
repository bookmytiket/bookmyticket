"use client";
import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { isServiceProvider } from "@/app/data/serviceCategories";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedCity, setSelectedCity] = useState("");
    const [locationHierarchy, setLocationHierarchy] = useState({ country: "", state: "", district: "", city: "" });
    const isProcessingRef = useRef(false);
    const ongoingFetchRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
        const initializeAuth = async () => {
            const cachedUser = localStorage.getItem("user");
            if (cachedUser) {
                try {
                    const parsed = JSON.parse(cachedUser);
                    setUser(parsed);
                    // Optimistic loading: if we have a cached user, let the app render
                    // while we verify the session in the background.
                    setLoading(false);
                } catch (e) {
                    console.error("Error parsing cached user:", e);
                }
            }

            if (!supabase) {
                console.warn("AuthContext: Supabase client not initialized.");
                setLoading(false);
                return;
            }

            try {
                const sessionPromise = supabase.auth.getSession();
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Session fetch timeout")), 8000));
                
                const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
                
                if (session) {
                    const userData = await fetchAndSetUser(session.user);
                    if ((userData?.is_temporary_password || userData?.force_password_change) && !window.location.pathname.includes("/change-password")) {
                        router.push("/change-password");
                    }
                }
            } catch (err) {
                console.error("AuthContext: Error getting initial session:", err.message);
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

        let subscription = null;
        if (supabase) {
            const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(async (event, session) => {
                if (event === 'SIGNED_IN' && !user) {
                    setLoading(true);
                }

                if (session) {
                    await fetchAndSetUser(session.user);
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                    localStorage.removeItem("user");
                }
                
                setLoading(false);
            });
            subscription = sub;
        }

        return () => subscription?.unsubscribe();
    }, [router]);

    // Inactivity Logout Logic (15 Minutes)
    useEffect(() => {
        if (!user) return;

        let inactivityTimer;
        const INACTIVITY_LIMIT = 24 * 60 * 60 * 1000; // 24 Hours (Improved persistence)

        const resetTimer = () => {
            if (inactivityTimer) clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                console.log("[AuthContext] Inactivity timeout reached. Signing out...");
                logout();
            }, INACTIVITY_LIMIT);
        };

        const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        activityEvents.forEach(event => window.addEventListener(event, resetTimer));

        resetTimer(); // Initialize timer

        return () => {
            if (inactivityTimer) clearTimeout(inactivityTimer);
            activityEvents.forEach(event => window.removeEventListener(event, resetTimer));
        };
    }, [user]);

    const fetchAndSetUser = async (supabaseUser) => {
        if (!supabase) return null;
        if (ongoingFetchRef.current) return ongoingFetchRef.current;
        
        ongoingFetchRef.current = (async () => {
            try {
            const fetchPromise = Promise.all([
                (async () => {
                    try { return await supabase.from('profiles').select('*').eq('id', supabaseUser.id).maybeSingle(); }
                    catch (e) { return { data: null, error: e }; }
                })(),
                (async () => {
                    try { return await supabase.from('admins').select('*').eq('id', supabaseUser.id).maybeSingle(); }
                    catch (e) { return { data: null, error: e }; }
                })(),
                (async () => {
                    try { return await supabase.from('organisers').select('*').eq('id', supabaseUser.id).maybeSingle(); }
                    catch (e) { return { data: null, error: e }; }
                })(),
                (async () => {
                    try { return await supabase.from('vendors').select('*').eq('id', supabaseUser.id).maybeSingle(); }
                    catch (e) { return { data: null, error: e }; }
                })(),
                (async () => {
                    try { return await supabase.from('service_providers').select('*').eq('id', supabaseUser.id).maybeSingle(); }
                    catch (e) { return { data: null, error: e }; }
                })(),
            ]);

            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Database timeout")), 10000)
            );

            let profileResult, adminResult, organiserResult, vendorResult, providerResult;
            try {
                const results = await Promise.race([fetchPromise, timeoutPromise]);
                if (!Array.isArray(results)) throw new Error("Database timeout");
                [profileResult, adminResult, organiserResult, vendorResult, providerResult] = results;
            } catch (err) {
                const minimalUser = {
                    id: supabaseUser.id,
                    email: supabaseUser.email,
                    role: user?.role || (localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")).role : 'public'),
                    name: user?.name || (localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")).name : supabaseUser.email?.split('@')[0]),
                    is_pwa_mode: true
                };
                setUser(minimalUser);
                return minimalUser;
            }

            const profile         = profileResult?.data || null;
            const adminRecord     = adminResult?.data || null;
            const organiserRecord = organiserResult?.data || null;
            const vendorRecord    = vendorResult?.data || null;
            const providerRecord  = providerResult?.data || null;

            let role = (profile?.role || supabaseUser.user_metadata?.role || 'user').toLowerCase().replace(/\s+/g, '_');
            if (role === 'organizer') role = 'organiser';
            if (role === 'user') role = 'public';

            let specializedData = {};

            if (adminRecord) {
                role = (adminRecord.role || 'admin').toLowerCase().replace(/\s+/g, '_');
                specializedData = adminRecord;
            } else if (organiserRecord) {
                // Protect admin/super_admin role if already set via profile
                if (role !== 'admin' && role !== 'super_admin') {
                    role = 'organiser';
                }
                specializedData = organiserRecord;
            } else if (vendorRecord || providerRecord) {
                role = 'vendor';
                let finalProviderData = providerRecord;
                if (!providerRecord && vendorRecord) {
                    const { data: newProvider, error: insertError } = await supabase
                        .from('service_providers')
                        .insert({
                            id: supabaseUser.id,
                            organiser_id: supabaseUser.id,
                            business_name: vendorRecord.business_name || profile?.full_name || supabaseUser.email?.split('@')[0],
                            category: vendorRecord.category || 'Professional Service',
                            status: 'active',
                            advanced_settings: { blocked_dates: [] }
                        })
                        .select()
                        .single();
                    
                    if (!insertError) finalProviderData = newProvider;
                }
                specializedData = { ...(vendorRecord || {}), ...(finalProviderData || {}) };
            }
 else if (role === 'staff') {
                try {
                    const { data } = await supabase.from('staff').select('*').eq('id', supabaseUser.id).maybeSingle();
                    if (data) specializedData = data;
                } catch (_) {}
            }

            const userData = {
                id: supabaseUser.id,
                identifier: supabaseUser.email,
                email: supabaseUser.email,
                name: profile?.full_name || organiserRecord?.business_name || supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0],
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
            return user; // Return current state on error rather than null
        } finally {
            ongoingFetchRef.current = null;
        }
    })();
    return ongoingFetchRef.current;
    };

    const updateCity = async (city, hierarchy = null) => {
        setSelectedCity(city);
        localStorage.setItem("selectedCity", city);
        if (hierarchy) {
            setLocationHierarchy(hierarchy);
            localStorage.setItem("locationHierarchy", JSON.stringify(hierarchy));
        }
        if (user?.id && supabase) {
            try {
                await supabase.from('profiles').update({ selected_city: city, location_hierarchy: hierarchy || undefined }).eq('id', user.id);
            } catch (err) { console.error(err); }
        }
    };

    const login = async (identifier, password, redirectPath = null, meta = {}) => {
        if (!supabase) return { success: false, error: "System not initialized." };
        setLoading(true);
        try {
            let email = identifier;
            if (!identifier.includes("@")) {
                const { data: profile } = await supabase.from('profiles').select('email').ilike('username', identifier).single();
                if (profile?.email) email = profile.email;
                else throw new Error("Invalid username or email.");
            }
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            const userData = await fetchAndSetUser(data.user);
            if (userData) {
                // REDIRECTION LOGIC
                if (userData.role === 'organiser') {
                    router.push('/organiser');
                } else if (userData.role === 'admin' || userData.role === 'super_admin') {
                    router.push('/admin');
                } else if (userData.role === 'vendor') {
                    router.push('/vendor');
                }
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

    const loginWithGoogle = async () => {
        if (!supabase) return { success: false, error: "System not initialized." };
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`
                }
            });
            if (error) throw error;
            return { success: true };
        } catch (err) {
            console.error("Google Login error:", err);
            return { success: false, error: err.message };
        }
    };

    const logout = async () => {
        localStorage.removeItem("user");
        setUser(null);
        if (supabase) {
            try { await supabase.auth.signOut(); } catch (err) { console.error(err); }
        }
        router.replace("/signin");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loginWithGoogle, loading, selectedCity, updateCity, locationHierarchy }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
