"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { logoutUser, syncUserSession } from "@/app/bakery/actions";

const USER_STORAGE_KEY = "vvip_bakery_user";
const USER_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 2;

interface User {
    id: string | number;
    phone: string;
    name: string;
    email: string;
    payment_type?: string;
}

interface StoredUserSession {
    user: User;
    expiresAt: number;
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

    const persistUser = (userData: User) => {
        const payload: StoredUserSession = {
            user: userData,
            expiresAt: Date.now() + USER_SESSION_TTL_MS,
        };
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(payload));
    };

    useEffect(() => {
        let isMounted = true;
        const savedUser = localStorage.getItem(USER_STORAGE_KEY);

        const loadUser = async () => {
            if (!savedUser) {
                if (isMounted) setIsLoading(false);
                return;
            }

            try {
                const parsed = JSON.parse(savedUser);
                const userData: User = parsed?.user || parsed;
                const expiresAt = Number(parsed?.expiresAt || 0);

                if (!expiresAt || Date.now() > expiresAt) {
                    localStorage.removeItem(USER_STORAGE_KEY);
                    if (isMounted) {
                        setUser(null);
                        setIsLoading(false);
                    }
                    return;
                }

                const res = await syncUserSession(userData);
                if (!isMounted) return;

                if (res?.success && res.user) {
                    setUser(res.user);
                    persistUser(res.user);
                } else {
                    setUser(null);
                    localStorage.removeItem(USER_STORAGE_KEY);
                }
            } catch (e) {
                console.error("Failed to restore saved user", e);
                localStorage.removeItem(USER_STORAGE_KEY);
                if (isMounted) {
                        setUser(null);
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        void loadUser();

        return () => {
            isMounted = false;
        };
    }, []);

    const login = (userData: User) => {
        setUser(userData);
        persistUser(userData);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem(USER_STORAGE_KEY);
        void logoutUser();
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
