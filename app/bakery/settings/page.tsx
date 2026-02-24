"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    User,
    MapPin,
    Package,
    ChevronRight,
    Plus,
    Edit2,
    Trash2,
    CheckCircle2,
    Clock,
    Truck,
    Save,
    Loader2,
    ArrowLeft,
    LogOut
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
    updateUserDetails,
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    getUserOrders
} from "@/app/bakery/actions";

type Tab = "profile" | "addresses" | "orders";

export default function SettingsPage() {
    const { user, login, logout, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>("profile");
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Profile State
    const [profileData, setProfileData] = useState({ name: "", email: "" });

    // Addresses State
    const [addresses, setAddresses] = useState<any[]>([]);
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<any>(null);
    const [addressForm, setAddressForm] = useState({
        receiver_name: "",
        receiver_phone: "",
        address_line1: "",
        address_line2: "",
        city: "Delhi",
        pincode: "",
        is_default: false
    });

    // Orders State
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [orderTab, setOrderTab] = useState<"ongoing" | "pending" | "completed">("ongoing");

    useEffect(() => {
        if (!isAuthLoading && !user) {
            router.push("/bakery");
            return;
        }
        if (user) {
            setProfileData({ name: user.name || "", email: user.email || "" });
            loadInitialData();

            // Handle Tab Redirect from URL
            const urlParams = new URLSearchParams(window.location.search);
            const tab = urlParams.get("tab") as Tab;
            if (tab && tabs.some(t => t.id === tab)) {
                setActiveTab(tab);
            }
        }
    }, [user, isAuthLoading, router]);

    const loadInitialData = async () => {
        if (!user) return;
        setIsLoadingData(true);
        const [addrRes, orderRes] = await Promise.all([
            getAddresses(user.id),
            getUserOrders(user.id)
        ]);
        if (addrRes.success) setAddresses(addrRes.addresses || []);
        if (orderRes.success) setOrders(orderRes.orders || []);
        setIsLoadingData(false);
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSaving(true);
        const res = await updateUserDetails(user.id, profileData.name, profileData.email);
        if (res.success) {
            login(res.user as any);
            setMessage({ type: "success", text: "Profile updated successfully!" });
        } else {
            setMessage({ type: "error", text: res.error || "Failed to update profile." });
        }
        setIsSaving(false);
        setTimeout(() => setMessage(null), 3000);
    };

    const handleAddressSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSaving(true);

        let res;
        if (editingAddress) {
            res = await updateAddress(editingAddress.id, user.id, addressForm);
        } else {
            res = await addAddress({ ...addressForm, user_id: user.id });
        }

        if (res.success) {
            loadInitialData();
            setIsAddressModalOpen(false);
            setEditingAddress(null);
            setAddressForm({
                receiver_name: "", receiver_phone: "", address_line1: "",
                address_line2: "", city: "Delhi", pincode: "", is_default: false
            });
            setMessage({ type: "success", text: editingAddress ? "Address updated!" : "Address added!" });
        } else {
            const errorMsg = (res as any).error || "Failed to save address.";
            setMessage({ type: "error", text: errorMsg });
        }
        setIsSaving(false);
        setTimeout(() => setMessage(null), 3000);
    };

    const handleDeleteAddress = async (id: number) => {
        if (!user || !confirm("Are you sure you want to delete this address?")) return;
        const res = await deleteAddress(id, user.id);
        if (res.success) {
            setAddresses(prev => prev.filter(a => a.id !== id));
            setMessage({ type: "success", text: "Address deleted." });
        }
        setTimeout(() => setMessage(null), 3000);
    };

    if (isAuthLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-soft-gray">
                <Loader2 className="animate-spin text-brand-gold-bright" size={48} />
            </div>
        );
    }

    const tabs = [
        { id: "profile", label: "Profile", icon: User },
        { id: "addresses", label: "Addresses", icon: MapPin },
        { id: "orders", label: "Orders", icon: Package },
    ];

    return (
        <div className="min-h-screen bg-brand-soft-gray pt-32 pb-20 px-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div className="space-y-2">
                        <Link href="/bakery" className="inline-flex items-center gap-2 text-brand-gold-bright font-black uppercase tracking-widest text-[10px] hover:gap-3 transition-all mb-4">
                            <ArrowLeft size={14} /> Back to Bakery
                        </Link>
                        <h1 className="text-4xl md:text-6xl font-serif font-black text-brand-olive-dark tracking-tighter">
                            Settings
                        </h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Navigation Sidebar */}
                    <aside className="lg:col-span-1 space-y-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as Tab)}
                                className={cn(
                                    "w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all",
                                    activeTab === tab.id
                                        ? "bg-brand-olive-dark text-white shadow-xl"
                                        : "bg-white/50 text-brand-olive-dark/40 hover:bg-white hover:text-brand-olive-dark"
                                )}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                        <button
                            onClick={() => { logout(); router.push("/bakery"); }}
                            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all mt-8"
                        >
                            <LogOut size={18} />
                            Logout
                        </button>
                    </aside>

                    {/* Main Content */}
                    <main className="lg:col-span-3 bg-white rounded-[2.5rem] p-8 md:p-12 shadow-premium border border-white min-h-[500px]">
                        <AnimatePresence mode="wait">
                            {/* Feedback Message */}
                            {message && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className={cn(
                                        "mb-8 p-4 rounded-xl text-sm font-bold text-center",
                                        message.type === "success" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                                    )}
                                >
                                    {message.text}
                                </motion.div>
                            )}

                            {activeTab === "profile" && (
                                <motion.div
                                    key="profile"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div>
                                        <h2 className="text-2xl font-serif font-black text-brand-olive-dark mb-2">Profile Information</h2>
                                        <p className="text-gray-500 text-sm font-medium">Update your profile details for invoicing and logistics.</p>
                                    </div>

                                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Full Name</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={profileData.name}
                                                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                                                    className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Email Address</label>
                                                <input
                                                    type="email"
                                                    required
                                                    value={profileData.email}
                                                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                                                    className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                                                />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Mobile Number</label>
                                                <input
                                                    type="text"
                                                    disabled
                                                    value={user.phone}
                                                    className="w-full bg-brand-soft-gray border-2 border-transparent rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark/40 cursor-not-allowed"
                                                />
                                                <p className="text-[9px] text-gray-400 italic ml-4">Phone number cannot be changed as it is used for login verification.</p>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="bg-brand-olive-dark text-white px-10 py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-brand-gold-bright transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-3"
                                        >
                                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                            Save Changes
                                        </button>
                                    </form>
                                </motion.div>
                            )}

                            {activeTab === "addresses" && (
                                <motion.div
                                    key="addresses"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <h2 className="text-2xl font-serif font-black text-brand-olive-dark mb-2">Delivery Addresses</h2>
                                            <p className="text-gray-500 text-sm font-medium">Manage multiple delivery locations for your hub.</p>
                                        </div>
                                        <button
                                            onClick={() => { setEditingAddress(null); setAddressForm({ receiver_name: user?.name || "", receiver_phone: user?.phone || "", address_line1: "", address_line2: "", city: "Delhi", pincode: "", is_default: false }); setIsAddressModalOpen(true); }}
                                            className="bg-brand-soft-gray text-brand-olive-dark p-4 rounded-2xl hover:bg-brand-olive-dark hover:text-white transition-all shadow-sm"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>

                                    {isLoadingData ? (
                                        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-brand-gold-bright" /></div>
                                    ) : (
                                        <div className="space-y-4">
                                            {addresses.length === 0 ? (
                                                <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-3xl">
                                                    <MapPin size={40} className="mx-auto text-gray-200 mb-4" />
                                                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">No addresses added yet</p>
                                                </div>
                                            ) : (
                                                addresses.map((addr) => (
                                                    <div key={addr.id} className="bg-brand-soft-gray p-6 rounded-3xl border border-white flex justify-between items-start group hover:shadow-md transition-all">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-3">
                                                                <p className="font-black text-brand-olive-dark">{addr.receiver_name}</p>
                                                                {addr.is_default && <span className="text-[8px] font-black uppercase tracking-widest bg-brand-gold-bright text-white px-2 py-0.5 rounded-full">Primary</span>}
                                                            </div>
                                                            <p className="text-xs text-gray-500 font-bold">{addr.receiver_phone}</p>
                                                            <p className="text-sm text-brand-olive-dark/70 font-medium pt-2">
                                                                {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ""}<br />
                                                                {addr.city} - {addr.pincode}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => { setEditingAddress(addr); setAddressForm({ receiver_name: addr.receiver_name, receiver_phone: addr.receiver_phone, address_line1: addr.address_line1, address_line2: addr.address_line2 || "", city: addr.city, pincode: addr.pincode, is_default: addr.is_default }); setIsAddressModalOpen(true); }}
                                                                className="p-2 text-gray-400 hover:text-brand-gold-bright transition-colors"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteAddress(addr.id)}
                                                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === "orders" && (
                                <motion.div
                                    key="orders"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div>
                                        <h2 className="text-2xl font-serif font-black text-brand-olive-dark mb-2">Order History</h2>
                                        <p className="text-gray-500 text-sm font-medium">Track your recent supplies and past orders.</p>
                                    </div>

                                    <div className="flex bg-brand-soft-gray p-1 rounded-xl">
                                        <button
                                            onClick={() => setOrderTab("ongoing")}
                                            className={cn(
                                                "flex-1 py-2 rounded-lg text-[10px] md:text-sm font-black uppercase tracking-widest transition-all",
                                                orderTab === "ongoing" ? "bg-white text-brand-olive-dark shadow-sm" : "text-gray-400 hover:text-brand-olive-dark"
                                            )}
                                        >
                                            Ongoing
                                        </button>
                                        <button
                                            onClick={() => setOrderTab("pending")}
                                            className={cn(
                                                "flex-1 py-2 rounded-lg text-[8px] md:text-xs font-black uppercase tracking-widest transition-all",
                                                orderTab === "pending" ? "bg-white text-brand-olive-dark shadow-sm" : "text-gray-400 hover:text-brand-olive-dark"
                                            )}
                                        >
                                            Payment Pending
                                        </button>
                                        <button
                                            onClick={() => setOrderTab("completed")}
                                            className={cn(
                                                "flex-1 py-2 rounded-lg text-[10px] md:text-sm font-black uppercase tracking-widest transition-all",
                                                orderTab === "completed" ? "bg-white text-brand-olive-dark shadow-sm" : "text-gray-400 hover:text-brand-olive-dark"
                                            )}
                                        >
                                            Completed
                                        </button>
                                    </div>

                                    {isLoadingData ? (
                                        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-brand-gold-bright" /></div>
                                    ) : (
                                        <div className="space-y-6">
                                            {orders.filter((order) => {
                                                if (orderTab === "pending") return order.status === "pending";
                                                if (orderTab === "ongoing") return order.status === "preparing" || order.status === "prepared";
                                                if (orderTab === "completed") return order.status === "delivered" || order.status === "cancelled";
                                                return true;
                                            }).length === 0 ? (
                                                <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-3xl">
                                                    <Package size={40} className="mx-auto text-gray-200 mb-4" />
                                                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">No orders found</p>
                                                </div>
                                            ) : (
                                                orders.filter((order) => {
                                                    if (orderTab === "pending") return order.status === "pending";
                                                    if (orderTab === "ongoing") return order.status === "preparing" || order.status === "prepared";
                                                    if (orderTab === "completed") return order.status === "delivered" || order.status === "cancelled";
                                                    return true;
                                                }).map((order) => (
                                                    <div key={order.id} className="bg-white border border-brand-soft-gray rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                                                        <div className="bg-brand-soft-gray/50 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                            <div>
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order ID: #{order.id}</p>
                                                                <p className="text-xs font-bold text-brand-olive-dark">{new Date(order.created_at).toLocaleDateString()}</p>
                                                            </div>
                                                            <div className="flex gap-6 w-full md:w-auto justify-between md:justify-end">
                                                                <div className="text-left md:text-right">
                                                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Payment</p>
                                                                    <span className={cn(
                                                                        "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                                                                        order.payment_status === 'paid'
                                                                            ? "bg-green-50 text-green-600 border-green-200"
                                                                            : "bg-orange-50 text-orange-600 border-orange-200"
                                                                    )}>
                                                                        {order.payment_status}
                                                                    </span>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total</p>
                                                                    <p className="text-sm font-black text-brand-gold-bright">₹{order.total_price}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="p-6 space-y-4">
                                                            {/* Items */}
                                                            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                                                {order.items.map((item: any) => (
                                                                    <div key={item.id} className="shrink-0 w-12 h-12 bg-brand-soft-gray rounded-xl overflow-hidden border border-white" title={item.product_name}>
                                                                        <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {/* Tracker */}
                                                            <div className="pt-4">
                                                                <div className="flex justify-between items-center relative mb-2">
                                                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-gray-100 -z-10" />
                                                                    {[
                                                                        { s: "pending", i: Clock, label: "PLACED" },
                                                                        { s: "preparing", i: Package, label: "PREP" },
                                                                        { s: "prepared", i: CheckCircle2, label: "READY" },
                                                                        { s: "delivered", i: Truck, label: "OUT" }
                                                                    ].map((step, idx, arr) => {
                                                                        const getStatusRank = (status: string) => {
                                                                            switch (status) {
                                                                                case "pending": return 0;
                                                                                case "preparing": return 1;
                                                                                case "prepared": return 2;
                                                                                case "in transit":
                                                                                case "delivered": return 3;
                                                                                default: return -1;
                                                                            }
                                                                        };
                                                                        const currentRank = getStatusRank(order.status);
                                                                        const isCompleted = idx <= currentRank;
                                                                        const isActive = idx === currentRank;

                                                                        return (
                                                                            <div key={step.label} className="flex items-center">
                                                                                <div className="flex flex-col items-center gap-2">
                                                                                    <div className={cn(
                                                                                        "w-8 h-8 rounded-full flex items-center justify-center transition-all border-2",
                                                                                        isCompleted
                                                                                            ? "bg-brand-gold-bright border-brand-gold-bright text-white shadow-lg"
                                                                                            : "bg-white border-gray-200 text-gray-300",
                                                                                        isActive && "scale-110"
                                                                                    )}>
                                                                                        <step.i size={14} />
                                                                                    </div>
                                                                                    <span className={cn(
                                                                                        "text-[8px] font-black uppercase tracking-widest",
                                                                                        isCompleted ? "text-brand-olive-dark" : "text-gray-300"
                                                                                    )}>{step.label}</span>
                                                                                </div>
                                                                                {idx < arr.length - 1 && (
                                                                                    <ChevronRight
                                                                                        size={16}
                                                                                        className={cn(
                                                                                            "mx-1 md:mx-4 mb-5",
                                                                                            idx < currentRank ? "text-brand-gold-bright" : "text-gray-200"
                                                                                        )}
                                                                                    />
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </main>
                </div>
            </div>

            {/* Address Modal */}
            <AnimatePresence>
                {isAddressModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddressModalOpen(false)}
                            className="absolute inset-0 bg-brand-olive-dark/40 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-xl bg-white rounded-[3rem] p-10 md:p-12 shadow-2xl overflow-hidden"
                        >
                            <h3 className="text-3xl font-serif font-black text-brand-olive-dark mb-2">
                                {editingAddress ? "Edit" : "New"} <span className="text-brand-gold-bright italic">Address</span>
                            </h3>
                            <p className="text-gray-500 text-sm font-medium mb-8">Please provide accurate delivery coordinates.</p>

                            <form onSubmit={handleAddressSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Receiver Name</label>
                                        <input
                                            type="text" required
                                            value={addressForm.receiver_name}
                                            onChange={(e) => setAddressForm(prev => ({ ...prev, receiver_name: e.target.value }))}
                                            className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Contact Phone</label>
                                        <input
                                            type="text" required
                                            value={addressForm.receiver_phone}
                                            onChange={(e) => setAddressForm(prev => ({ ...prev, receiver_phone: e.target.value }))}
                                            className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Address Line 1</label>
                                        <input
                                            type="text" required
                                            value={addressForm.address_line1}
                                            onChange={(e) => setAddressForm(prev => ({ ...prev, address_line1: e.target.value }))}
                                            className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Address Line 2 (Optional)</label>
                                        <input
                                            type="text"
                                            value={addressForm.address_line2}
                                            onChange={(e) => setAddressForm(prev => ({ ...prev, address_line2: e.target.value }))}
                                            className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">City</label>
                                        <input
                                            type="text" required
                                            value={addressForm.city}
                                            onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                                            className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Pincode</label>
                                        <input
                                            type="text" required
                                            value={addressForm.pincode}
                                            onChange={(e) => setAddressForm(prev => ({ ...prev, pincode: e.target.value }))}
                                            className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                                        />
                                    </div>
                                </div>

                                <label className="flex items-center gap-3 cursor-pointer group mt-4">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            hidden
                                            checked={addressForm.is_default}
                                            onChange={(e) => setAddressForm(prev => ({ ...prev, is_default: e.target.checked }))}
                                        />
                                        <div className={cn(
                                            "w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center",
                                            addressForm.is_default ? "bg-brand-gold-bright border-brand-gold-bright" : "border-gray-200 group-hover:border-brand-gold-bright/50"
                                        )}>
                                            {addressForm.is_default && <CheckCircle2 size={14} className="text-white" />}
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-olive-dark/60">Set as primary address</span>
                                </label>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddressModalOpen(false)}
                                        className="flex-1 py-4 text-brand-olive-dark/40 font-black uppercase tracking-widest text-[10px] hover:text-brand-olive-dark"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-[2] bg-brand-olive-dark text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-gold-bright transition-all shadow-xl active:scale-95 disabled:opacity-50"
                                    >
                                        {isSaving ? "Saving..." : "Save Address"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
