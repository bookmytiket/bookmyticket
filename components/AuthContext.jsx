"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery, useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedCity, setSelectedCity] = useState("");
    const [locationHierarchy, setLocationHierarchy] = useState({ country: "", state: "", district: "", city: "" });
    const router = useRouter();
    const convex = useConvex();

    useEffect(() => {
        const storedCity = localStorage.getItem("selectedCity");
        if (storedCity) {
            setSelectedCity(storedCity);
        }

        try {
            const storedHierarchy = localStorage.getItem("locationHierarchy");
            if (storedHierarchy) {
                setLocationHierarchy(JSON.parse(storedHierarchy));
            }
        } catch (err) {
            console.error("Error parsing stored hierarchy:", err);
            localStorage.removeItem("locationHierarchy");
        }

        // Load user from localStorage
        try {
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (err) {
            console.error("Error parsing stored user:", err);
            localStorage.removeItem("user");
        }
        
        setLoading(false);

        // Cross-tab logout synchronization
        const handleStorageChange = (e) => {
            if (e.key === "user") {
                if (!e.newValue) {
                    setUser(null);
                    router.push("/signin");
                } else {
                    try {
                        setUser(JSON.parse(e.newValue));
                    } catch (_) {}
                }
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, [router]);

    const updateCity = (city, hierarchy = null) => {
        setSelectedCity(city);
        localStorage.setItem("selectedCity", city);
        if (hierarchy) {
            setLocationHierarchy(hierarchy);
            localStorage.setItem("locationHierarchy", JSON.stringify(hierarchy));
        }
    };

    const login = async (identifier, password, role, userData = null, redirectPath = null) => {
        // Master Admin remains hardcoded
        if (role === "admin") {
            if (identifier === "bookmyticket-admin" && password === "D0n+$h@rE2k26") {
                const mockUser = { identifier, role, name: "Master Admin" };
                localStorage.setItem("user", JSON.stringify(mockUser));
                setUser(mockUser);
                router.push(redirectPath || "/admin");
                return true;
            }
            return false;
        }

        // Public User (passed from signin page after convex check)
        if (role === "user" && userData) {
            const authUser = { identifier, role: "user", name: userData.fullName || userData.name, id: userData._id };
            localStorage.setItem("user", JSON.stringify(authUser));
            setUser(authUser);
            router.push(redirectPath || "/");
            return true;
        }

        // Validate Organiser against Convex Database
        if (role === "organiser") {
            // If userData is already provided (from signin page), use it immediately
            if (userData) {
                const authUser = { identifier, role: "organiser", name: userData.name, id: userData._id };
                localStorage.setItem("user", JSON.stringify(authUser));
                setUser(authUser);
                router.push(redirectPath || "/organiser");
                return true;
            }

            try {
                const result = await convex.query(api.organisers.verifyCredentials, {
                    identifier,
                    password: password // Now expects hashed password
                });

                if (result.success) {
                    const org = result.organiser;
                    const authUser = { identifier, role: "organiser", name: org.name, id: org._id };
                    localStorage.setItem("user", JSON.stringify(authUser));
                    setUser(authUser);
                    router.push(redirectPath || "/organiser");
                    return true;
                }

                // Fallback for default demo organiser
                if (identifier === "organiser@bookmyticket.com" && (password === "organiser123" || password === "985a539a667140f6b3cfc2398a69e900995c58a5da359740a12e52b2b115eb3d")) {
                    const mockUser = { identifier, role: "organiser", name: "Event Organiser (Demo)" };
                    localStorage.setItem("user", JSON.stringify(mockUser));
                    setUser(mockUser);
                    router.push(redirectPath || "/organiser");
                    return true;
                }
            } catch (err) {
                console.error("Organiser login error:", err);
            }
        }

        // Validate Staff against Convex Database
        if (role === "staff") {
            try {
                const result = await convex.query(api.staff.verifyCredentials, {
                    email: identifier, // Still named 'email' in the mutation, but we pass our generic 'identifier'
                    password: password // Now expects hashed password
                });

                if (result.success) {
                    const staff = result.staff;
                    const authUser = { identifier, role: "staff", name: staff.name, id: staff._id, organiserId: staff.organiserId };
                    localStorage.setItem("user", JSON.stringify(authUser));
                    setUser(authUser);
                    router.push(redirectPath || "/organiser?tab=pwa_scanner");
                    return true;
                }
            } catch (err) {
                console.error("Staff login error:", err);
            }
        }


        // Team Members (Admins, Developers, Testers)
        if (role === "admin_team" && userData) {
            const authUser = { 
                identifier, 
                role: "admin", // They act as admins in the UI
                teamRole: userData.role, // "Admin", "Developer", "Tester"
                name: userData.fullName, 
                id: userData._id 
            };
            localStorage.setItem("user", JSON.stringify(authUser));
            setUser(authUser);
            router.push(redirectPath || "/admin");
            return true;
        }

        // Validate Branding Partner against Convex Database
        if (role === "branding_partner" && userData) {
            const authUser = { 
                identifier, 
                role: "branding_partner", 
                id: userData._id, 
                name: userData.fullName || userData.name 
            };
            localStorage.setItem("user", JSON.stringify(authUser));
            setUser(authUser);
            router.push(redirectPath || "/branding/dashboard");
            return true;
        }

        return false;
    };

    const logout = () => {
        localStorage.removeItem("user");
        setUser(null);
        router.push("/signin");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, selectedCity, updateCity, locationHierarchy }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
