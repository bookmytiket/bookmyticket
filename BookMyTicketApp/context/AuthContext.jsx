import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { useConvex } from "convex/react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../convex/_generated/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedCity, setSelectedCity] = useState("");
    const router = useRouter();
    const convex = useConvex();

    useEffect(() => {
        async function loadStorage() {
            try {
                const storedUser = await AsyncStorage.getItem("user");
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
                const storedCity = await AsyncStorage.getItem("selectedCity");
                if (storedCity) {
                    setSelectedCity(storedCity);
                }
            } catch (err) {
                console.error("Error loading storage:", err);
            } finally {
                setLoading(false);
            }
        }
        loadStorage();
    }, []);

    const updateCity = async (city) => {
        setSelectedCity(city);
        await AsyncStorage.setItem("selectedCity", city);
    };

    const login = async (identifier, password, role, userData = null) => {
        if (role === "admin") {
            if (identifier === "bookmyticket-admin" && password === "D0n+$h@rE2k26") {
                const mockUser = { identifier, role, name: "Master Admin" };
                setUser(mockUser);
                await AsyncStorage.setItem("user", JSON.stringify(mockUser));
                router.replace("/(tabs)");
                return true;
            }
            return false;
        }

        if (role === "user" && userData) {
            const authUser = { identifier, role: "user", name: userData.name, id: userData._id };
            setUser(authUser);
            await AsyncStorage.setItem("user", JSON.stringify(authUser));
            router.replace("/(tabs)");
            return true;
        }

        if (role === "organiser") {
            try {
                const result = await convex.query(api.organisers.verifyCredentials, {
                    identifier,
                    password: password
                });

                if (result.success) {
                    const org = result.organiser;
                    const authUser = { identifier, role: "organiser", name: org.name, id: org._id };
                    setUser(authUser);
                    await AsyncStorage.setItem("user", JSON.stringify(authUser));
                    router.replace("/(tabs)");
                    return true;
                }
            } catch (err) {
                console.error("Organiser login error:", err);
            }
        }

        return false;
    };

    const logout = async () => {
        await AsyncStorage.removeItem("user");
        setUser(null);
        router.replace("/(auth)/signin");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, selectedCity, updateCity }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
