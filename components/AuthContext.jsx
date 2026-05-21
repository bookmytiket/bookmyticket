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
    const [selectedDistrict, setSelectedDistrict] = useState("");
    const [locationHierarchy, setLocationHierarchy] = useState({ country: "", state: "", district: "", city: "", pincode: "" });
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
                    // Check device session if staff
                    if (parsed.role === 'staff') {
                        checkStaffSession(parsed.id);
                    }
                    setLoading(false);
                } catch (e) {
                    console.error("Error parsing cached user:", e);
                }
            }

            const storedCity = localStorage.getItem("selectedCity");
            const storedDistrict = localStorage.getItem("selectedDistrict");
            if (storedCity) {
                setSelectedCity(storedCity);
                if (storedDistrict) setSelectedDistrict(storedDistrict);
                try {
                    const storedHierarchy = localStorage.getItem("locationHierarchy");
                    if (storedHierarchy) setLocationHierarchy(JSON.parse(storedHierarchy));
                } catch (err) {
                    console.error("Error parsing stored hierarchy:", err);
                }
            } else {
                // First visit logic: Try geo-detection, then default
                setSelectedCity("Coimbatore");
                setSelectedDistrict("Coimbatore");
                localStorage.setItem("selectedCity", "Coimbatore");
                localStorage.setItem("selectedDistrict", "Coimbatore");
                
                // Fire and forget geo-detection to improve initial experience
                if ("geolocation" in navigator) {
                    navigator.geolocation.getCurrentPosition(
                        async (pos) => {
                            const { latitude, longitude } = pos.coords;
                            try {
                                const { reverseGeocode } = await import("@/lib/googleMaps");
                                const geo = await reverseGeocode(latitude, longitude);
                                if (geo.city) {
                                    const hierarchy = {
                                        city: geo.city,
                                        state: geo.state,
                                        country: geo.country,
                                        lat: latitude,
                                        lng: longitude,
                                        address: `${geo.city}, ${geo.state}, ${geo.country}`
                                    };
                                    updateCity(geo.city, hierarchy, geo.district);
                                }
                            } catch (e) {}
                        },
                        null,
                        { enableHighAccuracy: false, timeout: 5000 }
                    );
                }
            }
        };

        initializeAuth();

        let subscription = null;
        if (supabase) {
            // onAuthStateChange handles initial session load automatically
            const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(async (event, session) => {
                console.log(`[AuthContext] Auth Event: ${event}`);
                
                if (session) {
                    await fetchAndSetUser(session.user);
                } else {
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
    
    // Real-time Staff Session Monitoring & Heartbeat
    useEffect(() => {
        if (!user || user.role !== 'staff') return;

        const sessionToken = localStorage.getItem("bt_staff_session_token");
        if (!sessionToken) return;
        
        const channel = supabase
            .channel('staff_session_monitoring_v2')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'staff_active_sessions',
                filter: `staff_user_id=eq.${user.id}`
            }, (payload) => {
                if (payload.new.session_token === sessionToken && payload.new.session_status === 'terminated') {
                    console.log("SESSION TERMINATED: Logged in from another device.");
                    logout();
                    alert("SESSION TERMINATED: You have been logged out because a new login was detected on another device.");
                } else if (payload.new.session_token === sessionToken && payload.new.session_status === 'blocked') {
                    logout();
                    alert("ACCESS REVOKED: Your scanner access has been blocked by an administrator.");
                }
            })
            .subscribe();

        // Heartbeat mechanism - sends ping every 30 seconds
        const heartbeatInterval = setInterval(async () => {
            if (sessionToken) {
                await supabase
                    .from('staff_active_sessions')
                    .update({ last_seen: new Date().toISOString() })
                    .eq('session_token', sessionToken)
                    .eq('session_status', 'active');
            }
        }, 30000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(heartbeatInterval);
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
                (async () => {
                    try { return await supabase.from('brand_kyc').select('*').eq('brand_id', supabaseUser.id).maybeSingle(); }
                    catch (e) { return { data: null, error: e }; }
                })(),
            ]);

            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Database timeout")), 10000)
            );

            let profileResult, adminResult, organiserResult, vendorResult, providerResult, brandResult;
            try {
                const results = await Promise.race([fetchPromise, timeoutPromise]);
                if (!Array.isArray(results)) throw new Error("Database timeout");
                [profileResult, adminResult, organiserResult, vendorResult, providerResult, brandResult] = results;
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
            const brandRecord     = brandResult?.data || null;

            let role = (profile?.role || supabaseUser.user_metadata?.role || 'user').toLowerCase().replace(/\s+/g, '_');
            if (role === 'organizer') role = 'organiser';
            if (role === 'user') role = 'public';

            let specializedData = {};

            if (adminRecord) {
                role = (adminRecord.role || 'admin').toLowerCase().replace(/\s+/g, '_');
                specializedData = adminRecord;
            } else if (organiserRecord) {
                // ORGANISER takes priority over Vendor
                role = 'organiser';
                specializedData = { ...(vendorRecord || {}), ...(providerRecord || {}), ...organiserRecord };
            } else if (role === 'staff' || specializedData?.role === 'staff') {
                role = 'staff';
                try {
                    const { data } = await supabase.from('staff').select('*').eq('id', supabaseUser.id).maybeSingle();
                    if (data) specializedData = data;
                } catch (_) {}
            } else if (vendorRecord || providerRecord) {
                role = 'vendor';
                specializedData = { ...(vendorRecord || {}), ...(providerRecord || {}) };
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

            // ENFORCE BANNED STATUS
            const isBanned = 
                (userData.kyc_status || "").toLowerCase() === 'banned' || 
                (userData.status || "").toLowerCase() === 'banned';

            if (isBanned && role !== 'admin') {
                console.warn("AuthContext: User is banned. Terminating session.");
                setUser(null);
                localStorage.removeItem("user");
                supabase.auth.signOut();
                return null;
            }

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

    const updateCity = async (city, hierarchy = null, district = null) => {
        setSelectedCity(city);
        localStorage.setItem("selectedCity", city);
        
        const finalDistrict = district || hierarchy?.district || city; // Fallback to city name if district missing
        setSelectedDistrict(finalDistrict);
        localStorage.setItem("selectedDistrict", finalDistrict);

        if (hierarchy) {
            setLocationHierarchy(hierarchy);
            localStorage.setItem("locationHierarchy", JSON.stringify(hierarchy));
        }
        if (user?.id && supabase) {
            try {
                // Update profile for quick access
                await supabase.from('profiles').update({ selected_city: city, location_hierarchy: hierarchy || undefined }).eq('id', user.id);
                
                // Update user_locations for shared tracking with mobile
                if (hierarchy) {
                    const [countryRes, stateRes, districtRes, cityRes] = await Promise.all([
                        hierarchy.country ? supabase.from('countries').select('id').eq('name', hierarchy.country).maybeSingle() : Promise.resolve({ data: null }),
                        hierarchy.state ? supabase.from('states').select('id').eq('name', hierarchy.state).maybeSingle() : Promise.resolve({ data: null }),
                        hierarchy.district ? supabase.from('districts').select('id').eq('name', hierarchy.district).maybeSingle() : Promise.resolve({ data: null }),
                        hierarchy.city ? supabase.from('cities').select('id').eq('name', hierarchy.city).maybeSingle() : Promise.resolve({ data: null }),
                    ]);

                    await supabase.from('user_locations').upsert({
                        user_id: user.id,
                        country_id: countryRes.data?.id,
                        state_id: stateRes.data?.id,
                        district_id: districtRes.data?.id,
                        city_id: cityRes.data?.id,
                        address: hierarchy.address,
                        latitude: hierarchy.lat,
                        longitude: hierarchy.lng,
                        is_default: true,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id, is_default' });
                }
            } catch (err) { console.error(err); }
        }
    };

    const getDeviceId = () => {
        let id = localStorage.getItem("bt_device_id");
        if (!id) {
            id = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            localStorage.setItem("bt_device_id", id);
        }
        return id;
    };

    const checkStaffSession = async (staffId) => {
        const sessionToken = localStorage.getItem("bt_staff_session_token");
        if (!sessionToken) return;

        const { data: session } = await supabase
            .from('staff_active_sessions')
            .select('*')
            .eq('session_token', sessionToken)
            .maybeSingle();

        if (session && session.session_status !== 'active') {
            console.log("Device restriction: Session is no longer active.");
            logout();
            alert("Your session has expired or was terminated. Please log in again.");
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
            
                // DEVICE RESTRICTION LOGIC
                if (userData && userData.role === 'staff') {
                    const deviceId = getDeviceId();
                    const userAgent = navigator.userAgent;
                    
                    // Check admin policy
                    const { data: settings } = await supabase.from('admin_security_settings').select('*').maybeSingle();
                    const policy = settings?.login_policy || 'replace_existing';
                    const isEnabled = settings?.single_device_login_enabled !== false;

                    if (isEnabled) {
                        const { data: existingSession } = await supabase
                            .from('staff_active_sessions')
                            .select('*')
                            .eq('staff_user_id', userData.id)
                            .eq('session_status', 'active')
                            .maybeSingle();

                        if (existingSession && existingSession.device_id !== deviceId) {
                            if (policy === 'strict_block') {
                                // Block new login
                                await supabase.auth.signOut();
                                await supabase.from('staff_login_history').insert({
                                    staff_user_id: userData.id,
                                    device_id: deviceId,
                                    login_status: 'blocked',
                                    reason: 'Strict Block: Active session on another device.'
                                });
                                return { success: false, error: "This staff account is already active on another device. Please logout from the current device first." };
                            } else {
                                // Replace existing
                                await supabase
                                    .from('staff_active_sessions')
                                    .update({ session_status: 'terminated' })
                                    .eq('id', existingSession.id);
                                    
                                await supabase.from('staff_login_history').insert({
                                    staff_user_id: userData.id,
                                    device_id: deviceId,
                                    login_status: 'terminated_old_session',
                                    reason: 'New login replaced old session.'
                                });
                            }
                        }

                        // Create new session
                        const sessionToken = Math.random().toString(36).substring(2) + Date.now();
                        await supabase.from('staff_active_sessions').insert({
                            staff_user_id: userData.id,
                            session_token: sessionToken,
                            device_id: deviceId,
                            device_type: navigator.platform || "Unknown",
                            browser_name: userAgent.split(' ').pop() || "Unknown",
                            user_agent: userAgent,
                            session_status: 'active'
                        });

                        localStorage.setItem("bt_staff_session_token", sessionToken);
                        
                        await supabase.from('staff_login_history').insert({
                            staff_user_id: userData.id,
                            device_id: deviceId,
                            login_status: 'success',
                            reason: 'Login approved'
                        });
                    }
                }

            if (userData) {
                // ENFORCE BANNED STATUS
                const isBanned = 
                    (userData.kyc_status || "").toLowerCase() === 'banned' || 
                    (userData.status || "").toLowerCase() === 'banned';

                if (isBanned && userData.role !== 'admin') {
                    await logout();
                    return { success: false, error: "Your account has been restricted. Please contact support." };
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
        const sessionToken = localStorage.getItem("bt_staff_session_token");
        if (sessionToken) {
            try {
                await supabase
                    .from('staff_active_sessions')
                    .update({ session_status: 'logged_out' })
                    .eq('session_token', sessionToken);
            } catch (err) {}
        }
        
        localStorage.removeItem("user");
        localStorage.removeItem("bt_staff_session_token");
        setUser(null);
        if (supabase) {
            try { await supabase.auth.signOut(); } catch (err) { console.error(err); }
        }
        
        // Use path based on role
        if (user && user.role === 'staff') {
            router.replace("/signin");
        } else {
            router.replace("/");
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loginWithGoogle, loading, selectedCity, selectedDistrict, updateCity, locationHierarchy, fetchAndSetUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
