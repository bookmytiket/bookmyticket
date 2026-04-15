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
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                await fetchAndSetUser(session.user);
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
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("Supabase Auth Event:", event);
            if (session) {
                await fetchAndSetUser(session.user);
            } else {
                setUser(null);
                localStorage.removeItem("user");
            }
        });

        return () => subscription.unsubscribe();
    }, [router]);

    const fetchAndSetUser = async (supabaseUser) => {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*, is_temporary_password')
                .eq('id', supabaseUser.id)
                .single();

            // If the profile row doesn't exist yet (e.g. trigger hasn't fired),
            // construct minimal user data from the auth record so login still succeeds.
            const userData = {
                id: supabaseUser.id,
                identifier: supabaseUser.email,
                email: supabaseUser.email,
                role: profile?.role || supabaseUser.user_metadata?.role || 'user',
                name: profile?.full_name || profile?.username ||
                      supabaseUser.user_metadata?.full_name ||
                      supabaseUser.email?.split('@')[0],
                ...(profile || {}),
            };

            if (error && error.code !== 'PGRST116') {
                // PGRST116 = "no rows returned" — acceptable for brand-new users
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
        if (user?.id) {
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

                // Apply role-based defaults ONLY if no valid redirect was provided
                if (isInvalidRedirect) {
                    if (userData.role === "admin") destination = "/admin";
                    else if (userData.role === "organiser") {
                        const isProfessionalService = isServiceProvider(userData.category);
                        destination = isProfessionalService ? "/vendor/dashboard" : "/organiser";
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
        
        try {
            await supabase.auth.signOut();
        } catch (err) {
            console.error("Supabase signOut error:", err);
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
