import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Settings, LogIn, User as UserIcon, Menu, X, LogOut as LogOutIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import AuthModal from "@/components/auth/AuthModal";
import CartDrawer from "@/components/bakery/CartDrawer";

export default function BakeryNavbar() {
    const { user, logout } = useAuth();
    const { totalItems } = useCart();
    const router = useRouter();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const pathname = usePathname();
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

    const navLinks = [
        { name: "Home", href: "/bakery" },
        { name: "Order", href: "/bakery/order" },
        { name: "About", href: "/bakery#about" },
        { name: "Contact", href: "/bakery#contact" },
    ];

    return (
        <>
            <nav
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6 py-6",
                    showSolidNav ? "py-4" : "py-8"
                )}
            >
                <div
                    className={cn(
                        "max-w-7xl mx-auto rounded-full transition-all duration-700 flex items-center justify-between px-10 py-4 border",
                        showSolidNav
                            ? "bg-white/90 backdrop-blur-2xl shadow-premium py-3 border-gray-100"
                            : "bg-transparent border-transparent"
                    )}
                >
                    {/* Logo */}
                    <Link href="/bakery" className="flex items-center gap-4 group">
                        <div className="relative w-12 h-12 overflow-hidden rounded-full shadow-2xl group-hover:rotate-[360deg] transition-transform duration-1000 border-2 border-white/20">
                            <Image
                                src="/images/bakery_logo.jpeg"
                                alt="Swiss Affaire Logo"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <span className={cn(
                            "font-serif font-black text-2xl tracking-tighter transition-colors duration-500",
                            showSolidNav ? "text-brand-olive-dark" : "text-white"
                        )}>Swiss Affaire</span>
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
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className={cn(
                                "p-3 transition-colors relative",
                                showSolidNav ? "text-brand-olive-dark/60 hover:text-brand-gold-bright" : "text-white/60 hover:text-white"
                            )}
                        >
                            <ShoppingCart size={22} strokeWidth={2.5} />
                            {totalItems > 0 && (
                                <span className="absolute top-2 right-2 w-5 h-5 bg-brand-gold-bright rounded-full border-2 border-white text-[9px] flex items-center justify-center text-white font-black shadow-lg">
                                    {totalItems}
                                </span>
                            )}
                        </button>

                        <div className={cn(
                            "h-6 w-[1.5px] mx-2 hidden sm:block transition-colors",
                            showSolidNav ? "bg-brand-olive-dark/10" : "bg-white/10"
                        )} />

                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                                    className="flex items-center gap-3 pl-2 group"
                                >
                                    <div className="hidden sm:flex flex-col items-end">
                                        <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Account</span>
                                        <span className={cn(
                                            "text-xs font-black leading-none transition-colors",
                                            showSolidNav ? "text-brand-olive-dark" : "text-white"
                                        )}>{user.name}</span>
                                    </div>
                                    <div className={cn(
                                        "w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-premium",
                                        showSolidNav ? "bg-brand-soft-gray text-brand-olive-dark" : "bg-white/10 text-white border border-white/20"
                                    )}>
                                        <UserIcon size={20} />
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
                                                    <Settings size={18} />
                                                    Settings
                                                </Link>
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-red-50 text-red-500 transition-all text-xs font-black uppercase tracking-widest"
                                                >
                                                    <LogOutIcon size={18} />
                                                    Logout
                                                </button>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsAuthModalOpen(true)}
                                className={cn(
                                    "flex items-center gap-3 px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 group",
                                    showSolidNav 
                                        ? "bg-brand-olive-dark text-white hover:bg-brand-gold-bright" 
                                        : "bg-white text-brand-olive-dark hover:bg-brand-gold-bright hover:text-white"
                                )}
                            >
                                <LogIn size={16} className="group-hover:translate-x-1 transition-transform" />
                                <span className="hidden sm:inline">Partner Login</span>
                            </button>
                        )}

                        {/* Mobile Toggle */}
                        <button
                            className={cn(
                                "md:hidden p-3 transition-colors",
                                showSolidNav ? "text-brand-olive-dark" : "text-white"
                            )}
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
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
                        className="fixed inset-0 z-40 bg-white pt-32 px-10 md:hidden"
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
                            {user ? (
                                <div className="flex flex-col gap-6">
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
                                    onClick={() => { setIsAuthModalOpen(true); setIsMobileMenuOpen(false); }}
                                    className="text-left text-xl font-black text-brand-gold-bright uppercase tracking-widest"
                                >
                                    Login
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
            />

            <CartDrawer
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
            />
        </>
    );
}
