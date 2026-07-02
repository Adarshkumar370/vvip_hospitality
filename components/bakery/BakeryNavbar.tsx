import { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Settings, LogIn, User as UserIcon, Menu, X, LogOut as LogOutIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import AuthModal from "@/components/auth/AuthModal";

export default function BakeryNavbar() {
    const { user, logout } = useAuth();
    const { totalItems } = useCart();
    const router = useRouter();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authRedirectTo, setAuthRedirectTo] = useState("/bakery/order");
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const isHydrated = useSyncExternalStore(
        () => () => {},
        () => true,
        () => false
    );
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isMainBakeryPage = pathname === "/bakery";
    const showSolidNav = isScrolled || !isMainBakeryPage;

    const handleLogout = () => {
        logout();
        setIsUserDropdownOpen(false);
        router.push("/bakery");
    };

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (searchParams.get("login") !== "1") return;

        const next = searchParams.get("next");
        const safeNext = next?.startsWith("/bakery") ? next : "/bakery/order";
        if (user) {
            router.replace(safeNext, { scroll: false });
            return;
        }

        setAuthRedirectTo(safeNext);
        setIsAuthModalOpen(true);
    }, [searchParams, user, router]);

    const openAuthModal = (redirectTo = "/bakery/order") => {
        setAuthRedirectTo(redirectTo);
        setIsAuthModalOpen(true);
    };

    const closeAuthModal = () => {
        setIsAuthModalOpen(false);
        if (searchParams.get("login") === "1") {
            router.replace("/bakery", { scroll: false });
        }
    };

    const navLinks = [
        { name: "Home", href: "/bakery" },
        { name: "Order", href: "/bakery/order" },
        { name: "About", href: "/about-us" },
        { name: "Contact", href: "/contact" },
    ];

    return (
        <>
            <nav
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-4 py-4 md:px-6 md:py-6",
                    showSolidNav ? "py-2 md:py-4" : "py-4 md:py-8"
                )}
            >
                <div
                    className={cn(
                        "max-w-7xl mx-auto rounded-full transition-all duration-700 flex items-center justify-between px-4 py-2.5 sm:px-6 md:px-10 md:py-4 border",
                        showSolidNav
                            ? "bg-white/90 backdrop-blur-2xl shadow-premium py-2 md:py-3 border-gray-100"
                            : "bg-transparent border-transparent"
                    )}
                >
                    {/* Logo */}
                    <Link href="/bakery" className="flex items-center gap-4 group">
                        <div className="relative w-12 h-12 overflow-hidden rounded-full shadow-2xl group-hover:rotate-[360deg] transition-transform duration-1000 border-2 border-white/20">
                            <Image
                                src="/images/bakery_logo.jpeg"
                                alt="Swiss Affaire - The Bake Studio Logo"
                                fill
                                sizes="48px"
                                className="object-cover"
                            />
                        </div>
                        <span className={cn(
                            "font-serif font-black text-lg md:text-2xl tracking-tighter transition-colors duration-500 line-clamp-1",
                            showSolidNav ? "text-brand-olive-dark" : "text-white"
                        )}>
                            Swiss Affaire
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-12">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={cn(
                                    "text-[10px] font-black uppercase tracking-[0.3em] transition-all relative group",
                                    showSolidNav
                                        ? (pathname === link.href ? "text-brand-gold-bright" : "text-brand-olive-dark/60 hover:text-brand-olive-dark")
                                        : (pathname === link.href ? "text-brand-gold-bright" : "text-white/70 hover:text-white")
                                )}
                            >
                                {link.name}
                                <span className={cn(
                                    "absolute -bottom-2 left-0 w-0 h-[2px] bg-brand-gold-bright transition-all group-hover:w-full",
                                    pathname === link.href && "w-full"
                                )} />
                            </Link>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {/* Cart */}
                        <button
                            onClick={() => router.push("/bakery/cart")}
                            aria-label={isHydrated ? `View shopping cart, ${totalItems} items` : "View shopping cart"}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 transition-colors relative cursor-pointer",
                                showSolidNav ? "text-brand-olive-dark/70 hover:text-brand-gold-bright" : "text-white/70 hover:text-white"
                            )}
                        >
                            <div className="relative">
                                <ShoppingCart size={28} strokeWidth={2.5} aria-hidden="true" />
                                {isHydrated && totalItems > 0 && (
                                    <span className="absolute -top-1.5 -right-2 w-5 h-5 bg-brand-gold-bright rounded-full border-2 border-white text-[9px] flex items-center justify-center text-white font-black shadow-lg">
                                        {totalItems}
                                    </span>
                                )}
                            </div>
                            <span className={cn(
                                "text-[11px] font-black uppercase tracking-widest transition-colors",
                                showSolidNav ? "text-brand-olive-dark" : "text-white"
                            )}>Cart</span>
                        </button>

                        {/* Desktop User — hidden on mobile */}
                        <div className="hidden md:flex items-center">
                            <div className={cn(
                                "h-6 w-[1.5px] mx-2 transition-colors",
                                showSolidNav ? "bg-brand-olive-dark/10" : "bg-white/10"
                            )} />
                            {isHydrated && user ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                                        className="flex items-center gap-3 pl-2 group"
                                    >
                                        <div className="flex flex-col items-end">
                                            <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Account</span>
                                            <span className={cn(
                                                "text-xs font-black leading-none transition-colors",
                                                showSolidNav ? "text-brand-olive-dark" : "text-white"
                                            )}>{user.name}</span>
                                        </div>
                                        <div className={cn(
                                            "w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-premium",
                                            showSolidNav ? "bg-brand-soft-gray text-brand-olive-dark" : "bg-white/10 text-white border border-white/20"
                                        )} aria-label="User profile">
                                            <UserIcon size={20} aria-hidden="true" />
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {isUserDropdownOpen && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-0"
                                                    onClick={() => setIsUserDropdownOpen(false)}
                                                />
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    className="absolute right-0 mt-4 w-56 bg-white rounded-3xl shadow-premium border border-brand-olive-dark/5 p-2 z-10"
                                                >
                                                    <Link
                                                        href="/bakery/settings"
                                                        onClick={() => setIsUserDropdownOpen(false)}
                                                        className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-brand-soft-gray text-brand-olive-dark transition-all text-xs font-black uppercase tracking-widest"
                                                    >
                                                        <Settings size={18} aria-hidden="true" />
                                                        Settings
                                                    </Link>
                                                    <button
                                                        onClick={handleLogout}
                                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-red-50 text-red-500 transition-all text-xs font-black uppercase tracking-widest"
                                                    >
                                                        <LogOutIcon size={18} aria-hidden="true" />
                                                        Logout
                                                    </button>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <button
                                    onClick={() => openAuthModal("/bakery/order")}
                                    className={cn(
                                        "flex items-center gap-3 px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 group",
                                        showSolidNav
                                            ? "bg-brand-olive-dark text-white hover:bg-brand-gold-bright"
                                            : "bg-white text-brand-olive-dark hover:bg-brand-gold-bright hover:text-white"
                                    )}
                                    aria-label="Login"
                                >
                                    <LogIn size={16} className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                                    Login
                                </button>
                            )}
                        </div>

                        {/* Mobile Toggle */}
                        <button
                            className={cn(
                                "md:hidden p-3 transition-colors",
                                showSolidNav ? "text-brand-olive-dark" : "text-white"
                            )}
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                        >
                            {isMobileMenuOpen ? <X size={28} aria-hidden="true" /> : <Menu size={28} aria-hidden="true" />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 z-40 bg-white pt-24 pb-12 px-6 sm:px-10 md:hidden overflow-y-auto"
                    >
                        <div className="flex flex-col gap-8">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-3xl font-serif font-black text-brand-olive-dark"
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <div className="h-[1px] bg-brand-olive-dark/10 my-4" />
                            {/* Cart in menu */}
                            <button
                                onClick={() => { router.push("/bakery/cart"); setIsMobileMenuOpen(false); }}
                                className="flex items-center gap-4 text-left text-3xl font-serif font-black text-brand-olive-dark"
                            >
                                <ShoppingCart size={28} strokeWidth={2.5} aria-hidden="true" />
                                Cart
                                {isHydrated && totalItems > 0 && (
                                    <span className="ml-1 w-7 h-7 bg-brand-gold-bright rounded-full text-sm flex items-center justify-center text-white font-black">
                                        {totalItems}
                                    </span>
                                )}
                            </button>
                            <div className="h-[1px] bg-brand-olive-dark/10" />
                            {/* User section in menu */}
                            {isHydrated && user ? (
                                <div className="flex flex-col gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-brand-soft-gray flex items-center justify-center">
                                            <UserIcon size={24} className="text-brand-olive-dark" aria-hidden="true" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Account</p>
                                            <p className="text-lg font-black text-brand-olive-dark">{user.name}</p>
                                        </div>
                                    </div>
                                    <Link
                                        href="/bakery/settings"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="text-left text-xl font-black text-brand-olive-dark uppercase tracking-widest"
                                    >
                                        Settings
                                    </Link>
                                    <button
                                        onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                                        className="text-left text-xl font-black text-red-500 uppercase tracking-widest"
                                    >
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => { openAuthModal("/bakery/order"); setIsMobileMenuOpen(false); }}
                                    className="flex items-center gap-4 text-left text-xl font-black text-brand-olive-dark uppercase tracking-widest"
                                >
                                    <div className="w-12 h-12 rounded-full bg-brand-soft-gray flex items-center justify-center">
                                        <UserIcon size={24} className="text-brand-olive-dark" aria-hidden="true" />
                                    </div>
                                    Login
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={closeAuthModal}
                redirectTo={authRedirectTo}
            />
        </>
    );
}
