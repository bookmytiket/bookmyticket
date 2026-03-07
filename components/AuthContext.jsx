"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedCity, setSelectedCity] = useState("Coimbatore");
    const router = useRouter();

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        const storedCity = localStorage.getItem("selectedCity");
        if (storedCity) {
            setSelectedCity(storedCity);
        }
        setLoading(false);
    }, []);

    const updateCity = (city) => {
        setSelectedCity(city);
        localStorage.setItem("selectedCity", city);
    };

    const convexOrganisers = useQuery(api.organisers.list) || [];

    const login = (identifier, password, role, userData = null) => {
        // Master Admin remains hardcoded
        if (role === "admin") {
            if (identifier === "bookmyticket-admin" && password === "D0n+$h@rE2k26") {
                const mockUser = { identifier, role, name: "Master Admin" };
                setUser(mockUser);
                localStorage.setItem("user", JSON.stringify(mockUser));
                router.push("/admin");
                return true;
            }
            return false;
        }

        // Public User (passed from signin page after convex check)
        if (role === "user" && userData) {
            const authUser = { identifier, role: "user", name: userData.name, id: userData._id };
            setUser(authUser);
            localStorage.setItem("user", JSON.stringify(authUser));
            router.push("/");
            return true;
        }

        // Validate Organiser against Convex Database
        if (role === "organiser") {
            const organiserMatch = convexOrganisers.find(
                (org) => org.userId === identifier && org.password === password && org.kycStatus === "Active"
            );

            // Fallback for default demo organiser if it hasn't been added to DB yet
            const isDemoMatch = identifier === "organiser@bookmyticket.com" && password === "organiser123";

            if (organiserMatch) {
                const authUser = { identifier, role: "organiser", name: organiserMatch.name, id: organiserMatch._id };
                setUser(authUser);
                localStorage.setItem("user", JSON.stringify(authUser));
                router.push("/organiser");
                return true;
            } else if (isDemoMatch) {
                const mockUser = { identifier, role: "organiser", name: "Event Organiser (Demo)" };
                setUser(mockUser);
                localStorage.setItem("user", JSON.stringify(mockUser));
                router.push("/organiser");
                return true;
            }
        }

        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("user");
        if (typeof window !== "undefined") {
            window.location.href = "/signin";
        } else {
            router.replace("/signin");
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, selectedCity, updateCity }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
