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
    
    // Real-time Staff Session Monitoring
    useEffect(() => {
        if (!user || user.role !== 'staff') return;

        const deviceId = localStorage.getItem("bt_device_id");
        
        const channel = supabase
            .channel('staff_session_monitoring')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'device_sessions',
                filter: `staff_id=eq.${user.id}`
            }, (payload) => {
                if (payload.new.login_status === 'logged_out' && payload.new.device_id === deviceId) {
                    console.log("Session invalidated from server.");
                    logout();
                    alert("You have been logged out because a new login was detected on another device.");
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
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
            } else if (brandRecord && (role === 'public' || role === 'branding_partner')) {
                // Only promote to branding_partner if they aren't already a higher role
                // and if they don't want to remain a public user (usually partners have 'branding_partner' role in profiles)
                if (profile?.role === 'branding_partner') {
                    role = 'branding_partner';
                    specializedData = brandRecord;
                }
            } else if (role === 'organiser' || role === 'staff' || organiserRecord) {
                // Promoted role logic: If they have a record in the vendors table OR are already an organiser
                if (role !== 'admin' && role !== 'super_admin' && role !== 'staff') {
                    role = 'organiser';
                }
                specializedData = { ...(vendorRecord || {}), ...(organiserRecord || {}) };
            } else if ((vendorRecord || providerRecord) && (role === 'public' || role === 'vendor')) {
                if (profile?.role === 'vendor' || role === 'vendor') {
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
            } else if (role === 'staff') {
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
        const deviceId = getDeviceId();
        const { data: session } = await supabase
            .from('device_sessions')
            .select('*')
            .eq('staff_id', staffId)
            .eq('login_status', 'active')
            .maybeSingle();

        if (session && session.device_id !== deviceId) {
            console.log("Device restriction: Logged in on another device.");
            logout();
            alert("Your account has been logged in on another device. This session has been terminated.");
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
                
                // 1. Invalidate other active sessions
                await supabase
                    .from('device_sessions')
                    .update({ login_status: 'logged_out' })
                    .eq('staff_id', userData.id)
                    .eq('login_status', 'active');

                // 2. Create new active session
                await supabase.from('device_sessions').insert({
                    staff_id: userData.id,
                    device_id: deviceId,
                    login_status: 'active'
                });

                // 3. Bind device to staff record
                await supabase.from('staff').update({ device_id: deviceId }).eq('id', userData.id);
            }

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
        router.replace("/");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loginWithGoogle, loading, selectedCity, selectedDistrict, updateCity, locationHierarchy }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
