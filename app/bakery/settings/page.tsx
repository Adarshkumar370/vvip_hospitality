"use client";

import { useState, useEffect, useCallback } from "react";
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
    LogOut,
    Download
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { RupeeAmount } from "@/components/ui/RupeeAmount";
import { formatOrderDisplayLabel } from "@/lib/order-display";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import {
    updateUserDetails,
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    getUserOrders,
    retryInvoiceGeneration,
    createRazorpayOrder,
    verifyRazorpayPayment,
    validatePendingOrderForPayment,
} from "@/app/bakery/actions";

type Tab = "profile" | "addresses" | "orders";

declare global {
    interface Window {
        Razorpay: new (options: {
            key?: string;
            amount: number;
            currency: string;
            name: string;
            description: string;
            order_id: string;
            handler: (response: {
                razorpay_order_id: string;
                razorpay_payment_id: string;
                razorpay_signature: string;
            }) => Promise<void>;
            prefill: {
                name: string;
                email: string;
                contact: string;
            };
            theme: {
                color: string;
            };
            modal: {
                ondismiss: () => void;
            };
        }) => { open: () => void };
    }
}

function formatInvoiceDisplayNumber(invoiceNumber?: string | null) {
    if (!invoiceNumber) return "";
    const match = invoiceNumber.match(/^([A-Z]+-)(\d+)$/i);
    if (!match) return invoiceNumber;
    return `${match[1]}${Number(match[2])}`;
}

function isOperationallyClearedPayment(status: string) {
    return status === "paid" || status === "postpaid-pending";
}

export default function SettingsPage() {
    const { user, login, logout, isLoading: isAuthLoading } = useAuth();
    const { addToCart, clearCart } = useCart();
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
    const [generatingInvoice, setGeneratingInvoice] = useState<string | null>(null);
    const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
    const [repeatingOrderId, setRepeatingOrderId] = useState<string | null>(null);

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const loadInitialData = useCallback(async () => {
        if (!user) return;
        setIsLoadingData(true);
        const [addrRes, orderRes] = await Promise.all([
            getAddresses(user.id),
            getUserOrders(user.id)
        ]);
        if (addrRes.success) setAddresses(addrRes.addresses || []);
        if (orderRes.success) setOrders(orderRes.orders || []);
        setIsLoadingData(false);
    }, [user]);

    useEffect(() => {
        if (!isAuthLoading && !user) {
            const next = `${window.location.pathname}${window.location.search}`;
            router.replace(`/bakery?login=1&next=${encodeURIComponent(next)}`);
            return;
        }
        if (user) {
            setProfileData({ name: user.name || "", email: user.email || "" });
            loadInitialData();

            // Handle Tab Redirect from URL
            const urlParams = new URLSearchParams(window.location.search);
            const tab = urlParams.get("tab") as Tab;
            if (tab && ["profile", "addresses", "orders"].includes(tab)) {
                setActiveTab(tab);
            }
        }
    }, [user, isAuthLoading, router, loadInitialData]);

    const handleGenerateInvoice = async (orderId: string) => {
        if (!user) return;
        setGeneratingInvoice(orderId);
        const res = await retryInvoiceGeneration(orderId, String(user.id));
        if (res.success) {
            setOrders(prev => prev.map(o =>
                o.id === orderId
                    ? { ...o, invoice_pdf_url: res.invoicePdfUrl, invoice_number: res.invoiceNumber }
                    : o
            ));
        } else {
            setMessage({ type: "error", text: res.error || "Failed to generate invoice." });
            setTimeout(() => setMessage(null), 3000);
        }
        setGeneratingInvoice(null);
    };

    const handleContinueToPayment = async (order: any) => {
        if (!user) return;
        setPayingOrderId(order.id);
        setMessage(null);

        try {
            const validation = await validatePendingOrderForPayment(order.id, String(user.id));
            if (!validation.success) {
                throw new Error(validation.error || "Could not verify the pending order.");
            }
            if (!validation.allowed) {
                throw new Error(validation.violations[0]?.error || "Daily product limit exceeded.");
            }

            const razorpayRes = await createRazorpayOrder(Number(order.total_price || 0), order.id);
            if (!razorpayRes.success) {
                throw new Error(razorpayRes.error || "Failed to initialize payment");
            }

            const options = {
                key: razorpayRes.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: razorpayRes.amount,
                currency: "INR",
                name: "Swiss Affaire - The Bake Studio",
                description: "Pending Order Payment",
                order_id: razorpayRes.orderId,
                handler: async (response: {
                    razorpay_order_id: string;
                    razorpay_payment_id: string;
                    razorpay_signature: string;
                }) => {
                    const verifyRes = await verifyRazorpayPayment(
                        order.id,
                        response.razorpay_order_id,
                        response.razorpay_payment_id,
                        response.razorpay_signature
                    );

                    if (verifyRes.success) {
                        await loadInitialData();
                        setMessage({ type: "success", text: "Payment completed successfully." });
                    } else {
                        setMessage({ type: "error", text: verifyRes.error || "Payment verification failed." });
                    }
                    setPayingOrderId(null);
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                    contact: user.phone,
                },
                theme: {
                    color: "#344B33",
                },
                modal: {
                    ondismiss: () => {
                        setPayingOrderId(null);
                    },
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err: unknown) {
            setMessage({ type: "error", text: err instanceof Error ? err.message : "Could not continue to payment." });
            setPayingOrderId(null);
        }
    };

    const handleRepeatOrder = async (order: any) => {
        setRepeatingOrderId(order.id);
        try {
            clearCart();
            order.items.forEach((item: any) => {
                addToCart(
                    {
                        id: item.product_id,
                        name: item.product_name,
                        price: Number(item.price_at_time || 0),
                        image: item.product_image,
                        category: item.category || "Bakery",
                    },
                    Number(item.quantity || 1)
                );
            });
            router.push("/bakery/order");
        } finally {
            setRepeatingOrderId(null);
        }
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

    const handleDeleteAddress = async (id: string | number) => {
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
                            <ArrowLeft size={14} /> Back to Swiss Affaire
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-serif font-black text-brand-olive-dark tracking-tighter">
                            Swiss Affaire <span className="text-brand-gold-bright italic">- The Bake Studio</span>
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
                                        : "bg-white/50 text-brand-olive-dark/70 hover:bg-white hover:text-brand-olive-dark"
                                )}
                                aria-pressed={activeTab === tab.id}
                            >
                                <tab.icon size={18} aria-hidden="true" />
                                {tab.label}
                            </button>
                        ))}
                        <button
                            onClick={() => { logout(); router.push("/bakery"); }}
                            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all mt-8"
                        >
                            <LogOut size={18} aria-hidden="true" />
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
                                                <label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-gray-600 ml-4">Full Name</label>
                                                <input
                                                    id="name"
                                                    type="text"
                                                    required
                                                    value={profileData.name}
                                                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                                                    className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-gray-600 ml-4">Email Address</label>
                                                <input
                                                    id="email"
                                                    type="email"
                                                    required
                                                    value={profileData.email}
                                                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                                                    className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                                                />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 ml-4">Mobile Number</label>
                                                <input
                                                    type="text"
                                                    disabled
                                                    value={user.phone}
                                                    className="w-full bg-brand-soft-gray border-2 border-transparent rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark/40 cursor-not-allowed"
                                                />
                                                <p className="text-[9px] text-gray-600 italic ml-4">Phone number cannot be changed as it is used for login verification.</p>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="bg-brand-olive-dark text-white px-10 py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-brand-gold-bright transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-3"
                                        >
                                            {isSaving ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <Save size={18} aria-hidden="true" />}
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
                                            aria-label="Add new address"
                                        >
                                            <Plus size={20} aria-hidden="true" />
                                        </button>
                                    </div>

                                    {isLoadingData ? (
                                        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-brand-gold-bright" aria-hidden="true" /></div>
                                    ) : (
                                        <div className="space-y-4">
                                            {addresses.length === 0 ? (
                                                <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-3xl">
                                                    <MapPin size={40} className="mx-auto text-gray-200 mb-4" aria-hidden="true" />
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
                                                                className="p-2 text-gray-500 hover:text-brand-gold-bright transition-colors"
                                                                aria-label={`Edit address for ${addr.receiver_name}`}
                                                            >
                                                                <Edit2 size={16} aria-hidden="true" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteAddress(addr.id)}
                                                                className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                                                                aria-label={`Delete address for ${addr.receiver_name}`}
                                                            >
                                                                <Trash2 size={16} aria-hidden="true" />
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
                                                orderTab === "ongoing" ? "bg-white text-brand-olive-dark shadow-sm" : "text-gray-500 hover:text-brand-olive-dark"
                                            )}
                                        >
                                            Ongoing
                                        </button>
                                        <button
                                            onClick={() => setOrderTab("pending")}
                                            className={cn(
                                                "flex-1 py-2 rounded-lg text-[8px] md:text-xs font-black uppercase tracking-widest transition-all",
                                                orderTab === "pending" ? "bg-white text-brand-olive-dark shadow-sm" : "text-gray-500 hover:text-brand-olive-dark"
                                            )}
                                        >
                                            Payment Pending
                                        </button>
                                        <button
                                            onClick={() => setOrderTab("completed")}
                                            className={cn(
                                                "flex-1 py-2 rounded-lg text-[10px] md:text-sm font-black uppercase tracking-widest transition-all",
                                                orderTab === "completed" ? "bg-white text-brand-olive-dark shadow-sm" : "text-gray-500 hover:text-brand-olive-dark"
                                            )}
                                        >
                                            Completed
                                        </button>
                                    </div>

                                    {isLoadingData ? (
                                        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-brand-gold-bright" aria-hidden="true" /></div>
                                    ) : (
                                        <div className="space-y-6">
                                            {orders.filter((order) => {
                                                if (orderTab === "pending") return order.payment_status === "pending";
                                                if (orderTab === "ongoing") return isOperationallyClearedPayment(order.payment_status) && (order.status === "pending" || order.status === "preparing" || order.status === "prepared" || order.status === "in transit");
                                                if (orderTab === "completed") return order.status === "delivered" || order.status === "cancelled";
                                                return true;
                                            }).length === 0 ? (
                                                <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-3xl">
                                                    <Package size={40} className="mx-auto text-gray-200 mb-4" aria-hidden="true" />
                                                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">No orders found</p>
                                                </div>
                                            ) : (
                                                orders.filter((order) => {
                                                    if (orderTab === "pending") return order.payment_status === "pending";
                                                    if (orderTab === "ongoing") return isOperationallyClearedPayment(order.payment_status) && (order.status === "pending" || order.status === "preparing" || order.status === "prepared" || order.status === "in transit");
                                                    if (orderTab === "completed") return order.status === "delivered" || order.status === "cancelled";
                                                    return true;
                                                }).map((order) => (
                                                    <div key={order.id} className="bg-white border border-brand-soft-gray rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                                                        <div className="bg-brand-soft-gray/50 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                            <div>
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order No: {formatOrderDisplayLabel(order)}</p>
                                                                <p className="text-xs font-bold text-brand-olive-dark">{new Date(order.created_at).toLocaleDateString()}</p>
                                                            </div>
                                                            <div className="flex gap-6 w-full md:w-auto justify-between md:justify-end">
                                                                <div className="text-left md:text-right">
                                                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Payment</p>
                                                                    <span className={cn(
                                                                        "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                                                                        order.payment_status === 'paid'
                                                                            ? "bg-green-100 text-green-700 border-green-200"
                                                                            : order.payment_status === 'postpaid-pending'
                                                                                ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                                                            : "bg-orange-100 text-orange-700 border-orange-200"
                                                                    )}>
                                                                        {order.payment_status}
                                                                    </span>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total</p>
                                                                    <p className="text-sm font-black text-brand-gold-bright">
                                                                        <RupeeAmount value={order.total_price} />
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="p-6 space-y-4">
                                                            {order.invoice_pdf_url ? (
                                                                <a
                                                                    href={order.invoice_pdf_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-2 rounded-xl bg-brand-olive-dark px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-sm transition-all hover:bg-brand-gold-bright hover:text-brand-olive-dark"
                                                                >
                                                                    <Download size={14} aria-hidden="true" />
                                                                    Download Invoice
                                                                    {order.invoice_number ? ` ${formatInvoiceDisplayNumber(order.invoice_number)}` : ""}
                                                                </a>
                                                            ) : isOperationallyClearedPayment(order.payment_status) && (
                                                                <button
                                                                    onClick={() => handleGenerateInvoice(order.id)}
                                                                    disabled={generatingInvoice === order.id}
                                                                    className="inline-flex items-center gap-2 rounded-xl bg-brand-olive-dark px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-sm transition-all hover:bg-brand-gold-bright hover:text-brand-olive-dark disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    {generatingInvoice === order.id
                                                                        ? <><Loader2 size={14} className="animate-spin" aria-hidden="true" /> Download Invoice</>
                                                                        : <><Download size={14} aria-hidden="true" /> Download Invoice</>
                                                                    }
                                                                </button>
                                                            )}

                                                            {isOperationallyClearedPayment(order.payment_status) && (
                                                                <button
                                                                    onClick={() => handleRepeatOrder(order)}
                                                                    disabled={repeatingOrderId === order.id}
                                                                    className="ml-3 inline-flex items-center gap-2 rounded-xl border border-brand-olive-dark/10 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-widest text-brand-olive-dark shadow-sm transition-all hover:border-brand-gold-bright hover:text-brand-gold-bright disabled:cursor-not-allowed disabled:opacity-50"
                                                                >
                                                                    {repeatingOrderId === order.id
                                                                        ? <><Loader2 size={14} className="animate-spin" aria-hidden="true" /> Repeat Order</>
                                                                        : <><Package size={14} aria-hidden="true" /> Repeat Order</>
                                                                    }
                                                                </button>
                                                            )}

                                                            {/* Items */}
                                                            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                                                {order.items.map((item: any) => (
                                                                    <div key={item.id} className="relative shrink-0 w-12 h-12 bg-brand-soft-gray rounded-xl overflow-hidden border border-white" title={item.product_name}>
                                                                        <Image src={item.product_image} alt={item.product_name} fill sizes="48px" className="object-cover" />
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {orderTab === "pending" ? (
                                                                <div className="rounded-2xl bg-brand-soft-gray/50 p-4">
                                                                    <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                                        Awaiting Payment Confirmation
                                                                    </p>
                                                                    <div className="flex flex-wrap gap-3">
                                                                        <button
                                                                            onClick={() => handleContinueToPayment(order)}
                                                                            disabled={payingOrderId === order.id}
                                                                            className="inline-flex items-center gap-2 rounded-xl bg-brand-olive-dark px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-sm transition-all hover:bg-brand-gold-bright hover:text-brand-olive-dark disabled:cursor-not-allowed disabled:opacity-50"
                                                                        >
                                                                            {payingOrderId === order.id
                                                                                ? <><Loader2 size={14} className="animate-spin" aria-hidden="true" /> Continue to Payment</>
                                                                                : <><Clock size={14} aria-hidden="true" /> Continue to Payment</>
                                                                            }
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleRepeatOrder(order)}
                                                                            disabled={repeatingOrderId === order.id}
                                                                            className="inline-flex items-center gap-2 rounded-xl border border-brand-olive-dark/10 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-widest text-brand-olive-dark shadow-sm transition-all hover:border-brand-gold-bright hover:text-brand-gold-bright disabled:cursor-not-allowed disabled:opacity-50"
                                                                        >
                                                                            {repeatingOrderId === order.id
                                                                                ? <><Loader2 size={14} className="animate-spin" aria-hidden="true" /> Repeat Order</>
                                                                                : <><Package size={14} aria-hidden="true" /> Repeat Order</>
                                                                            }
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
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
                                                                                            <step.i size={14} aria-hidden="true" />
                                                                                        </div>
                                                                                        <span className={cn(
                                                                                            "text-[8px] font-black uppercase tracking-widest",
                                                                                            isCompleted ? "text-brand-olive-dark" : "text-gray-400"
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
                                                            )}
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
                            className="relative w-full max-w-xl bg-white rounded-[3rem] p-10 md:p-12 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
                        >
                            <h3 className="text-3xl font-serif font-black text-brand-olive-dark mb-2">
                                {editingAddress ? "Edit" : "New"} <span className="text-brand-gold-bright italic">Address</span>
                            </h3>
                            <p className="text-gray-500 text-sm font-medium mb-8">Please provide accurate delivery coordinates.</p>

                            <form onSubmit={handleAddressSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label htmlFor="receiver_name" className="text-[10px] font-black uppercase tracking-widest text-gray-600 ml-4">Receiver Name</label>
                                        <input
                                            id="receiver_name"
                                            type="text" required
                                            value={addressForm.receiver_name}
                                            onChange={(e) => setAddressForm(prev => ({ ...prev, receiver_name: e.target.value }))}
                                            className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="receiver_phone" className="text-[10px] font-black uppercase tracking-widest text-gray-600 ml-4">Contact Phone</label>
                                        <input
                                            id="receiver_phone"
                                            type="text" required
                                            value={addressForm.receiver_phone}
                                            onChange={(e) => setAddressForm(prev => ({ ...prev, receiver_phone: e.target.value }))}
                                            className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label htmlFor="address_line1" className="text-[10px] font-black uppercase tracking-widest text-gray-600 ml-4">Address Line 1</label>
                                        <input
                                            id="address_line1"
                                            type="text" required
                                            value={addressForm.address_line1}
                                            onChange={(e) => setAddressForm(prev => ({ ...prev, address_line1: e.target.value }))}
                                            className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label htmlFor="address_line2" className="text-[10px] font-black uppercase tracking-widest text-gray-600 ml-4">Address Line 2 (Optional)</label>
                                        <input
                                            id="address_line2"
                                            type="text"
                                            value={addressForm.address_line2}
                                            onChange={(e) => setAddressForm(prev => ({ ...prev, address_line2: e.target.value }))}
                                            className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="city" className="text-[10px] font-black uppercase tracking-widest text-gray-600 ml-4">City</label>
                                        <input
                                            id="city"
                                            type="text" required
                                            value={addressForm.city}
                                            onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                                            className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="pincode" className="text-[10px] font-black uppercase tracking-widest text-gray-600 ml-4">Pincode</label>
                                        <input
                                            id="pincode"
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
                                            id="is_default"
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
                                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-olive-dark/80">Set as primary address</span>
                                </label>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddressModalOpen(false)}
                                        className="flex-1 py-4 text-brand-olive-dark/70 font-black uppercase tracking-widest text-[10px] hover:text-brand-olive-dark"
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
