"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { normalizeCartQuantity } from "@/lib/security-validation";

export interface CartItem {
    id: string | number;
    name: string;
    price: number;
    quantity: number;
    image: string;
    category: string;
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
    removeFromCart: (id: string | number) => void;
    updateQuantity: (id: string | number, quantity: number) => void;
    clearCart: () => void;
    totalItems: number;
    totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>(() => {
        if (typeof window === "undefined") return [];

        const savedCart = localStorage.getItem("vvip_bakery_cart");
        if (!savedCart) return [];

        try {
            return JSON.parse(savedCart);
        } catch (e) {
            console.error("Failed to parse saved cart", e);
            return [];
        }
    });

    // Save cart to localStorage
    useEffect(() => {
        localStorage.setItem("vvip_bakery_cart", JSON.stringify(cart));
    }, [cart]);

    const addToCart = (item: Omit<CartItem, "quantity">, quantity = 1) => {
        const normalizedQuantity = normalizeCartQuantity(quantity) ?? 1;
        setCart((prevCart) => {
            const existingItem = prevCart.find((i) => i.id === item.id);
            if (existingItem) {
                const nextQuantity = normalizeCartQuantity(existingItem.quantity + normalizedQuantity) ?? existingItem.quantity;
                return prevCart.map((i) =>
                    i.id === item.id ? { ...i, quantity: nextQuantity } : i
                );
            }
            return [...prevCart, { ...item, quantity: normalizedQuantity }];
        });
    };

    const removeFromCart = (id: string | number) => {
        setCart((prevCart) => prevCart.filter((item) => item.id !== id));
    };

    const updateQuantity = (id: string | number, quantity: number) => {
        const normalizedQuantity = normalizeCartQuantity(quantity);
        if (!normalizedQuantity) {
            removeFromCart(id);
            return;
        }
        setCart((prevCart) =>
            prevCart.map((item) =>
                item.id === id ? { ...item, quantity: normalizedQuantity } : item
            )
        );
    };

    const clearCart = () => setCart([]);

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                cart,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                totalItems,
                totalPrice,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
