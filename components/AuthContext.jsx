"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = (email, password, role) => {
        // Define Demo Credentials
        const DEMO_CREDENTIALS = {
            admin: { email: "admin@bookmyticket.com", pass: "admin123", name: "Master Admin" },
            organiser: { email: "organiser@bookmyticket.com", pass: "organiser123", name: "Event Organiser" }
        };

        const target = DEMO_CREDENTIALS[role];

        if (email === target.email && password === target.pass) {
            const mockUser = { email, role, name: target.name };
            setUser(mockUser);
            localStorage.setItem("user", JSON.stringify(mockUser));

            if (role === "admin") {
                router.push("/admin");
            } else {
                router.push("/organiser");
            }
            return true;
        }

        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("user");
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
