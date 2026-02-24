import { useState, useEffect } from "react";
import Link from "next/link";
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
                    isScrolled ? "py-4" : "py-8"
                )}
            >
                <div
                    className={cn(
                        "max-w-7xl mx-auto rounded-[2rem] transition-all duration-500 flex items-center justify-between px-8 py-4 border border-white/20",
                        isScrolled
                            ? "bg-white/80 backdrop-blur-xl shadow-premium py-3"
                            : "bg-white/40 backdrop-blur-md"
                    )}
                >
                    {/* Logo */}
                    <Link href="/bakery" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-brand-olive-dark rounded-xl flex items-center justify-center text-brand-gold-bright group-hover:rotate-12 transition-transform shadow-lg">
                            <span className="font-serif font-black text-xl">V</span>
                        </div>
                        <span className="text-brand-olive-dark font-serif font-black text-xl tracking-tight">VVIP Bakery</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-10">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={cn(
                                    "text-sm font-black uppercase tracking-widest transition-all hover:text-brand-gold-bright",
                                    pathname === link.href ? "text-brand-gold-bright" : "text-brand-olive-dark/60"
                                )}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="p-3 text-brand-olive-dark/60 hover:text-brand-gold-bright transition-colors relative"
                        >
                            <ShoppingCart size={20} strokeWidth={2.5} />
                            {totalItems > 0 && (
                                <span className="absolute top-2 right-2 w-4 h-4 bg-brand-gold-bright rounded-full border-2 border-white text-[8px] flex items-center justify-center text-white font-black">
                                    {totalItems}
                                </span>
                            )}
                        </button>

                        <div className="h-6 w-[1.5px] bg-brand-olive-dark/10 mx-2 hidden sm:block" />

                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                                    className="flex items-center gap-3 pl-2 group"
                                >
                                    <div className="hidden sm:flex flex-col items-end">
                                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Welcome</span>
                                        <span className="text-sm font-black text-brand-olive-dark leading-none">{user.name}</span>
                                    </div>
                                    <div className="w-10 h-10 bg-brand-soft-gray group-hover:bg-brand-olive-dark group-hover:text-white rounded-xl flex items-center justify-center text-brand-olive-dark transition-all shadow-sm">
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
                                className="flex items-center gap-3 px-6 py-3 bg-brand-olive-dark text-white rounded-xl font-black text-sm hover:bg-brand-gold-bright transition-all shadow-lg active:scale-95 group"
                            >
                                <LogIn size={18} className="group-hover:translate-x-1 transition-transform" />
                                <span className="hidden sm:inline">Login</span>
                            </button>
                        )}

                        {/* Mobile Toggle */}
                        <button
                            className="md:hidden p-3 text-brand-olive-dark"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
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
