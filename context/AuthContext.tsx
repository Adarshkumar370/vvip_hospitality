"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { syncUserSession } from "@/app/bakery/actions";

interface User {
    id: string | number;
    phone: string;
    name: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    login: (user: User) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem("vvip_bakery_user");
        if (savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                setUser(userData);
                // Sync with server cookie and upgrade old numeric IDs to schema UUIDs.
                syncUserSession(userData).then((res: any) => {
                    if (res?.success && res.user) {
                        setUser(res.user);
                        localStorage.setItem("vvip_bakery_user", JSON.stringify(res.user));
                    } else if (res?.error) {
                        setUser(null);
                        localStorage.removeItem("vvip_bakery_user");
                    }
                });
            } catch (e) {
                console.error("Failed to parse saved user", e);
            }
        }
        setIsLoading(false);
    }, []);

    const login = (userData: User) => {
        setUser(userData);
        localStorage.setItem("vvip_bakery_user", JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("vvip_bakery_user");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
