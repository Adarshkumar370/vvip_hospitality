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

            let userData: User;
            try {
                const parsed = JSON.parse(savedUser);
                userData = parsed?.user || parsed;
                const expiresAt = Number(parsed?.expiresAt || 0);

                if (!expiresAt || Date.now() > expiresAt) {
                    localStorage.removeItem(USER_STORAGE_KEY);
                    if (isMounted) {
                        setUser(null);
                        setIsLoading(false);
                    }
                    return;
                }
            } catch (e) {
                console.error("Failed to parse saved user", e);
                localStorage.removeItem(USER_STORAGE_KEY);
                if (isMounted) {
                    setUser(null);
                    setIsLoading(false);
                }
                return;
            }

            // Show the cached session immediately so the navbar reflects the real
            // (httpOnly-cookie-backed) login state without waiting on a round trip.
            // The actual data-access gate is always the server-side session check
            // (getUserSession) on protected pages, so this is safe to show optimistically.
            if (isMounted) setUser(userData);

            try {
                const res = await syncUserSession(userData);
                if (!isMounted) return;

                if (res?.success && res.user) {
                    setUser(res.user);
                    persistUser(res.user);
                } else if (!("alreadySynced" in (res || {}))) {
                    // Server explicitly confirmed the session is expired/invalid.
                    setUser(null);
                    localStorage.removeItem(USER_STORAGE_KEY);
                }
                // "alreadySynced" means the confirmation call couldn't refresh the
                // record (e.g. a transient lookup hiccup) but didn't invalidate the
                // session either — keep the optimistic cached user as-is.
            } catch (e) {
                // Network/DB error while confirming the session — don't log the user
                // out over a transient failure; keep the optimistic cached user.
                console.error("Failed to confirm session, keeping cached session", e);
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
