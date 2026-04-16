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
                    if (userData?.force_password_change && !window.location.pathname.includes("/auth/change-password")) {
                        console.log("AuthContext: Enforcing password security on session load.");
                        router.push("/auth/change-password");
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
                if (session) {
                    await fetchAndSetUser(session.user);
                } else {
                    setUser(null);
                    localStorage.removeItem("user");
                }
            });
            subscription = sub;
        }

        return () => subscription?.unsubscribe();
    }, [router]);

    const fetchAndSetUser = async (supabaseUser) => {
        if (!supabase) return null;
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', supabaseUser.id)
                .single();

            let role = (profile?.role || supabaseUser.user_metadata?.role || 'user').toLowerCase().replace(/\s+/g, '_');

            // Fallback: Check admins table if the profile role is not already 'admin'
            if (role !== 'admin') {
                try {
                    const { data: adminRecord, error: adminErr } = await supabase
                        .from('admins')
                        .select('role')
                        .eq('id', supabaseUser.id)
                        .maybeSingle();

                    if (adminErr) {
                        console.error("AuthContext: Admins table lookup error:", adminErr.message);
                    }

                    if (adminRecord) {
                        const adminRole = adminRecord.role?.toLowerCase() || 'admin';
                        console.log("AuthContext: Admin record found, upgrading role. Admin role in DB:", adminRole);
                        role = adminRole.replace(/\s+/g, '_');
                    }
                } catch (err) {
                    console.error("AuthContext: Unexpected error checking admins table:", err);
                }
            }

            // Enhanced role detection: Fetch specific metadata from role-specific tables
            let specializedData = {};
            
            try {
                if (role === 'admin' || role === 'super_admin') {
                    const { data } = await supabase.from('admins').select('*').eq('id', supabaseUser.id).maybeSingle();
                    if (data) specializedData = data;
                } else if (role === 'staff') {
                    const { data } = await supabase.from('staff').select('*').eq('id', supabaseUser.id).maybeSingle();
                    if (data) specializedData = data;
                } else if (role === 'branding_partner') {
                    const { data } = await supabase.from('branding_partners').select('*').eq('id', supabaseUser.id).maybeSingle();
                    if (data) specializedData = data;
                } else if (role === 'organiser') {
                    // Fetch from unified vendors table (consolidated organisers + services)
                    const { data: vendorData } = await supabase.from('vendors').select('*').eq('id', supabaseUser.id).maybeSingle();
                    if (vendorData) {
                        specializedData = vendorData;
                        // For professional services, we might still want to call them 'vendor' in code logic if needed, 
                        // but keeping 'organiser' role is safe as long as data is consistent.
                        if (vendorData.type === 'professional_service') role = 'vendor';
                    }
                } else if (role === 'user') {
                    const { data } = await supabase.from('public_users').select('*').eq('id', supabaseUser.id).maybeSingle();
                    if (data) specializedData = data;
                }
            } catch (err) {
                console.error("AuthContext: Error fetching specialized role data:", err);
            }

            // Construct unified user data
            const userData = {
                id: supabaseUser.id,
                identifier: supabaseUser.email,
                email: supabaseUser.email,
                name: profile?.full_name || profile?.username ||
                      supabaseUser.user_metadata?.full_name ||
                      supabaseUser.email?.split('@')[0],
                ...(profile || {}),
                ...specializedData, // Merge role-specific fields (e.g., business_name, kyc_status)
                role: role, // Final normalized role
            };

            if (error && error.code !== 'PGRST116') {
                console.warn("Profile fetch warning:", error.message);
            }

            setUser(userData);
            localStorage.setItem("user", JSON.stringify(userData));
            return userData;
        } catch (err) {
            console.error("Error fetching profile:", err);
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

    const login = async (identifier, password, redirectPath = null) => {
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
                    throw new Error("Invalid username or email.");
                }
            }

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
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
                // Determine redirect: prioritize explicit redirectPath if valid
                let decodedRedirect = redirectPath ? decodeURIComponent(redirectPath) : null;
                const isInvalidRedirect = !decodedRedirect || decodedRedirect.includes("/signin") || decodedRedirect.includes("/signup");

                let destination = isInvalidRedirect ? "/" : decodedRedirect;

                // CRITICAL SECURITY OVERRIDE: If password change is requested, force it immediately
                if (userData.force_password_change) {
                    console.log("AuthContext: Force password change detected. Redirecting to security portal.");
                    router.push("/auth/change-password");
                    return { success: true, user: userData };
                }

                // Security: Validate authorization for the target destination
                const isAdminPath = destination?.startsWith("/admin");
                const isBrandingPath = destination?.startsWith("/branding");
                const isOrganiserPath = destination?.startsWith("/organiser");
                const isVendorPath = destination?.startsWith("/vendor");

                const isAuthorized = 
                    (!isAdminPath || userData.role === "admin" || userData.role === "super_admin") &&
                    (!isBrandingPath || userData.role === "branding_partner" || userData.role === "admin" || userData.role === "super_admin") &&
                    (!isOrganiserPath || ["organiser", "staff", "admin", "super_admin"].includes(userData.role)) &&
                    (!isVendorPath || ["organiser", "admin", "super_admin"].includes(userData.role));

                // Apply role-based defaults if no valid redirect OR not authorized for target
                if (isInvalidRedirect || !isAuthorized) {
                    if (userData.role === "admin" || userData.role === "super_admin") {
                        destination = "/admin";
                    } else if (userData.role === "staff") {
                        destination = "/organiser?tab=pwa_scanner";
                    } else if (userData.role === "branding_partner") {
                        destination = "/branding/dashboard";
                    } else if (userData.role === "organiser") {
                        const isProfessionalService = isServiceProvider(userData.category) || userData.type === "professional_service";
                        destination = isProfessionalService ? "/vendor/dashboard" : "/organiser";
                    } else {
                        destination = "/profile";
                    }
                }
                
                console.log("AuthContext: Redirecting to", destination);
                router.push(destination);
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
