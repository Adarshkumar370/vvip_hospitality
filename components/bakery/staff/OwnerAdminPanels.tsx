"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users2,
    Activity,
    AlertCircle,
    CheckCircle2,
    Loader2,
    ShoppingBag,
    Plus,
    Trash2,
    Camera,
    Settings,
    X,
    Pencil,
    RefreshCw,
    User as UserIcon,
    Wallet,
    History,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { RupeeAmount, RupeeIcon } from "@/components/ui/RupeeAmount";
import {
    getProducts,
    addProduct,
    deleteProduct,
    getCategories,
    addCategory,
    deleteCategory,
    updateCategory,
    updateProduct,
    uploadImage,
    getStaffMembers,
    addStaff,
    updateStaff,
    deleteStaff,
    setStaffStatus,
    getUsers,
    getUserPrices,
    setUserPrice,
    updateUserBillingSettings,
    recordManualPayment,
    getManualPaymentRecords,
    updateManualPaymentRecord,
    getManualPaymentRecordHistory,
} from "@/app/bakery/actions";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------
interface Category {
    id: string | number;
    name: string;
}

interface Product {
    id: string | number;
    name: string;
    category: string;
    price: number;
    image: string;
    description: string;
    unit: string;
    max_daily_limit: number;
    created_at?: string;
}

interface StaffMember {
    id: string | number;
    name: string;
    email: string;
    phone: string;
    role: "baker" | "manager" | "admin" | "accountant" | "delivery";
    status?: "active" | "inactive";
    created_at?: string;
}

interface EditProductModalProps {
    product: Product;
    categories: Category[];
    onClose: () => void;
    onSave: (updated: Omit<Product, "id" | "created_at">) => void;
    isSubmitting: boolean;
}

interface AddProductModalProps {
    categories: Category[];
    onClose: () => void;
    onAdd: (product: Omit<Product, "id" | "created_at">) => void;
    isSubmitting: boolean;
}

interface EditCategoryModalProps {
    category: Category;
    onClose: () => void;
    onSave: (name: string) => void;
    isSubmitting: boolean;
}

interface EditStaffModalProps {
    staff: StaffMember;
    onClose: () => void;
    onSave: (data: { name: string, email: string, phone: string, role: string, password: string }) => void;
    isSubmitting: boolean;
}

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    message: string;
    isLoading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function UsersView() {
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingUserId, setEditingUserId] = useState<string | number | null>(null);
    const [isSavingBilling, setIsSavingBilling] = useState(false);
    const [billingDraft, setBillingDraft] = useState({
        paymentType: "prepaid_user",
        creditLimit: 0,
        billingCycleDay: 1,
        billingDate: "",
        paymentTermsDays: 30,
        invoiceEmail: "",
        notes: "",
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setIsLoading(true);
        const result = await getUsers();
        if (result.success) setUsers(result.users || []);
        setIsLoading(false);
    };

    const startEditing = (user: any) => {
        const defaultBillingDate = new Date();
        defaultBillingDate.setDate(Number(user.billing_cycle_day || 1));
        setEditingUserId(user.id);
        setBillingDraft({
            paymentType: user.payment_type || "prepaid_user",
            creditLimit: Number(user.credit_limit || 0),
            billingCycleDay: Number(user.billing_cycle_day || 1),
            billingDate: defaultBillingDate.toISOString().slice(0, 10),
            paymentTermsDays: Number(user.payment_terms_days || 30),
            invoiceEmail: user.email || "",
            notes: "",
        });
    };

    const saveBilling = async () => {
        if (!editingUserId) return;
        setIsSavingBilling(true);
        const result = await updateUserBillingSettings({
            userId: String(editingUserId),
            paymentType: billingDraft.paymentType as "prepaid_user" | "postpaid_user",
            creditLimit: billingDraft.creditLimit,
            billingCycleDay: billingDraft.billingCycleDay,
            paymentTermsDays: billingDraft.paymentTermsDays,
            invoiceEmail: billingDraft.invoiceEmail,
            notes: billingDraft.notes,
        });
        if (!result.success) {
            alert(result.error);
            setIsSavingBilling(false);
            return;
        }
        await loadUsers();
        setEditingUserId(null);
        setIsSavingBilling(false);
    };

    const formatCurrency = (value: number | null | undefined) => (
        <RupeeAmount value={Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} />
    );

    const formatBillingDate = (billingCycleDay: number | null | undefined) => {
        const date = new Date();
        date.setDate(Number(billingCycleDay || 1));
        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
        >
            <div>
                <div className="mb-3 flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-brand-gold-bright">
                    <Users2 size={16} />
                    User Directory
                </div>
                <h1 className="text-5xl font-serif font-black tracking-tighter text-brand-olive-dark">Registered Users</h1>
            </div>

            <div className="rounded-[2.5rem] border border-white bg-white p-10 shadow-premium">
                <h3 className="mb-8 text-2xl font-serif font-black text-brand-olive-dark">Active Users ({users.length})</h3>
                {isLoading ? (
                    <div className="flex flex-col items-center gap-4 py-20">
                        <Loader2 className="animate-spin text-brand-gold-bright" size={40} />
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Loading Directory...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="py-20 text-center font-serif italic text-gray-400">No users registered yet.</div>
                ) : (
                    <div className="space-y-5">
                        {users.map((user) => (
                            <div key={user.id} className="rounded-[2rem] border border-brand-olive-dark/10 bg-brand-soft-gray/40 p-6 shadow-sm">
                                <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-brand-olive-dark shadow-sm">
                                            <UserIcon size={24} />
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="font-black text-brand-olive-dark">{user.name}</p>
                                                <p className="text-xs font-bold text-brand-gold-bright">{user.email} • {user.phone}</p>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                <span
                                                    className={cn(
                                                        "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                                                        user.payment_type === "postpaid_user" ? "bg-brand-olive-dark text-white" : "bg-white text-brand-olive-dark"
                                                    )}
                                                >
                                                    {user.payment_type === "postpaid_user" ? "Postpaid" : "Prepaid"}
                                                </span>
                                                {user.payment_type === "postpaid_user" && (
                                                    <span
                                                        className={cn(
                                                            "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                                                            user.billing_status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                                                        )}
                                                    >
                                                        {user.billing_status === "active" ? "Billing Active" : "Billing Inactive"}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 gap-3 text-xs font-bold text-brand-olive-dark/75 sm:grid-cols-3">
                                                <div className="rounded-2xl bg-white px-4 py-3">
                                                    <p className="mb-1 text-[10px] uppercase tracking-widest text-gray-400">Max Amount</p>
                                                    <p>{formatCurrency(user.credit_limit)}</p>
                                                </div>
                                                <div className="rounded-2xl bg-white px-4 py-3">
                                                    <p className="mb-1 text-[10px] uppercase tracking-widest text-gray-400">Bill Date</p>
                                                    <p>{formatBillingDate(user.billing_cycle_day)}</p>
                                                </div>
                                                <div className="rounded-2xl bg-white px-4 py-3">
                                                    <p className="mb-1 text-[10px] uppercase tracking-widest text-gray-400">Billing Cycle</p>
                                                    <p>{user.payment_terms_days || 30} days</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-start gap-4 xl:items-end">
                                        <div className="text-left xl:text-right">
                                            <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Joined</p>
                                            <p className="text-xs font-bold text-brand-olive-dark">{new Date(user.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => startEditing(user)}
                                            className="rounded-2xl bg-brand-olive-dark px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-brand-gold-bright hover:text-brand-olive-dark"
                                        >
                                            {editingUserId === user.id ? "Editing Billing" : "Set Billing"}
                                        </button>
                                    </div>
                                </div>

                                {editingUserId === user.id && (
                                    <div className="mt-6 rounded-[2rem] border border-brand-gold-bright/20 bg-white p-6">
                                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                            <label className="space-y-2">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">User Type</span>
                                                <select
                                                    value={billingDraft.paymentType}
                                                    onChange={(e) => setBillingDraft((prev) => ({ ...prev, paymentType: e.target.value }))}
                                                    className="w-full rounded-2xl border border-brand-olive-dark/10 bg-brand-soft-gray/40 px-4 py-3 text-sm font-bold text-brand-olive-dark outline-none focus:border-brand-gold-bright"
                                                >
                                                    <option value="prepaid_user">Prepaid</option>
                                                    <option value="postpaid_user">Postpaid</option>
                                                </select>
                                            </label>

                                            <label className="space-y-2">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Invoice Email</span>
                                                <input
                                                    type="email"
                                                    value={billingDraft.invoiceEmail}
                                                    onChange={(e) => setBillingDraft((prev) => ({ ...prev, invoiceEmail: e.target.value }))}
                                                    className="w-full rounded-2xl border border-brand-olive-dark/10 bg-brand-soft-gray/40 px-4 py-3 text-sm font-bold text-brand-olive-dark outline-none focus:border-brand-gold-bright"
                                                />
                                            </label>
                                        </div>

                                        {billingDraft.paymentType === "postpaid_user" && (
                                            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                                                <label className="space-y-2">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Max Amount</span>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        value={billingDraft.creditLimit}
                                                        onChange={(e) => setBillingDraft((prev) => ({ ...prev, creditLimit: Number(e.target.value || 0) }))}
                                                        className="w-full rounded-2xl border border-brand-olive-dark/10 bg-brand-soft-gray/40 px-4 py-3 text-sm font-bold text-brand-olive-dark outline-none focus:border-brand-gold-bright"
                                                    />
                                                </label>

                                                <label className="space-y-2">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Bill Date</span>
                                                    <input
                                                        type="date"
                                                        value={billingDraft.billingDate}
                                                        onChange={(e) => {
                                                            const selectedDate = e.target.value;
                                                            const selectedDay = selectedDate ? new Date(selectedDate).getDate() : 1;
                                                            setBillingDraft((prev) => ({
                                                                ...prev,
                                                                billingDate: selectedDate,
                                                                billingCycleDay: selectedDay,
                                                            }));
                                                        }}
                                                        className="w-full rounded-2xl border border-brand-olive-dark/10 bg-brand-soft-gray/40 px-4 py-3 text-sm font-bold text-brand-olive-dark outline-none focus:border-brand-gold-bright"
                                                    />
                                                </label>

                                                <label className="space-y-2">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Billing Cycle Days</span>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={90}
                                                        value={billingDraft.paymentTermsDays}
                                                        onChange={(e) => setBillingDraft((prev) => ({ ...prev, paymentTermsDays: Number(e.target.value || 30) }))}
                                                        className="w-full rounded-2xl border border-brand-olive-dark/10 bg-brand-soft-gray/40 px-4 py-3 text-sm font-bold text-brand-olive-dark outline-none focus:border-brand-gold-bright"
                                                    />
                                                </label>
                                            </div>
                                        )}

                                        <label className="mt-4 block space-y-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Notes</span>
                                            <textarea
                                                rows={3}
                                                value={billingDraft.notes}
                                                onChange={(e) => setBillingDraft((prev) => ({ ...prev, notes: e.target.value }))}
                                                className="w-full rounded-2xl border border-brand-olive-dark/10 bg-brand-soft-gray/40 px-4 py-3 text-sm font-bold text-brand-olive-dark outline-none focus:border-brand-gold-bright"
                                                placeholder="Optional internal notes"
                                            />
                                        </label>

                                        <div className="mt-5 flex flex-wrap gap-3">
                                            <button
                                                type="button"
                                                onClick={saveBilling}
                                                disabled={isSavingBilling}
                                                className="rounded-2xl bg-brand-olive-dark px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-brand-gold-bright hover:text-brand-olive-dark disabled:cursor-not-allowed disabled:bg-gray-300"
                                            >
                                                {isSavingBilling ? "Saving..." : "Save Billing Settings"}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditingUserId(null)}
                                                className="rounded-2xl border border-brand-olive-dark/10 px-5 py-3 text-xs font-black uppercase tracking-widest text-brand-olive-dark transition-all hover:border-brand-gold-bright hover:text-brand-gold-bright"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

export function PricingView() {
    const [users, setUsers] = useState<any[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [userPrices, setUserPrices] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState<string | number | null>(null);
    const [saveStatus, setSaveStatus] = useState<Record<string, "success" | "error" | null>>({});

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setIsLoading(true);
        const [userRes, prodRes] = await Promise.all([getUsers(), getProducts()]);
        if (userRes.success) setUsers(userRes.users || []);
        if (prodRes.success) setProducts((prodRes.products || []) as unknown as Product[]);
        setIsLoading(false);
    };

    const handleUserSelect = async (user: any) => {
        setSelectedUser(user);
        setIsLoading(true);
        const result = await getUserPrices(user.id);
        if (result.success) {
            const priceMap: Record<string, number> = {};
            (result.prices || []).forEach((p: any) => {
                priceMap[String(p.product_id)] = Number(p.price);
            });
            setUserPrices(priceMap);
        }
        setIsLoading(false);
    };

    const handlePriceChange = (productId: string | number, price: string) => {
        const val = parseInt(price) || 0;
        setUserPrices(prev => ({ ...prev, [String(productId)]: val }));
    };

    const savePrice = async (productId: string | number) => {
        if (!selectedUser) return;
        const key = String(productId);
        setIsSaving(productId);
        const price = userPrices[key] || 0;
        const result = await setUserPrice(selectedUser.id, productId, price);
        setIsSaving(null);
        setSaveStatus(prev => ({ ...prev, [key]: result.success ? "success" : "error" }));
        setTimeout(() => {
            setSaveStatus(prev => ({ ...prev, [key]: null }));
        }, 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
        >
            <div>
                <div className="flex items-center gap-3 text-brand-gold-bright font-black uppercase tracking-[0.2em] text-xs mb-3">
                    <Activity size={16} />
                    Dynamic Pricing
                </div>
                <h1 className="text-5xl font-serif font-black text-brand-olive-dark tracking-tighter">Per-User Custom Pricing</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* User Selection */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-[2.5rem] shadow-premium p-10 border border-white sticky top-12">
                        <h3 className="text-2xl font-serif font-black text-brand-olive-dark mb-8">Select User</h3>
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
                            {users.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => handleUserSelect(user)}
                                    className={cn(
                                        "w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-3 group",
                                        selectedUser?.id === user.id
                                            ? "bg-brand-olive-dark border-brand-olive-dark text-white shadow-lg"
                                            : "bg-brand-soft-gray/50 border-transparent hover:border-brand-gold-bright/30"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                        selectedUser?.id === user.id ? "bg-white/10 text-white" : "bg-white text-brand-olive-dark shadow-sm"
                                    )}>
                                        <UserIcon size={18} />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="font-black text-sm truncate">{user.name}</p>
                                        <p className={cn(
                                            "text-[10px] font-bold truncate",
                                            selectedUser?.id === user.id ? "text-brand-gold-bright" : "text-gray-400"
                                        )}>{user.phone}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Price Management */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-[2.5rem] shadow-premium p-10 border border-white min-h-[60vh]">
                        {!selectedUser ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-32">
                                <div className="w-20 h-20 bg-brand-soft-gray rounded-full flex items-center justify-center text-gray-300">
                                    <UserIcon size={40} />
                                </div>
                                <p className="text-gray-400 font-serif italic text-lg">Please select a user to manage their custom pricing.</p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div className="flex items-center justify-between pb-6 border-b border-brand-olive-dark/5">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-gold-bright mb-1">Managing Prices For</p>
                                        <h3 className="text-3xl font-serif font-black text-brand-olive-dark">{selectedUser.name}</h3>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">User Phone</p>
                                        <p className="font-black text-brand-olive-dark">{selectedUser.phone}</p>
                                    </div>
                                </div>

                                {isLoading ? (
                                    <div className="py-20 flex flex-col items-center gap-4">
                                        <Loader2 className="animate-spin text-brand-gold-bright" size={40} />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Syncing Prices...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {products.map((product) => (
                                            <div key={product.id} className="flex items-center justify-between p-4 bg-brand-soft-gray/50 rounded-2xl group border border-transparent hover:border-brand-gold-bright/20 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white rounded-xl overflow-hidden shadow-sm relative">
                                                        <Image src={product.image} alt={product.name} fill sizes="48px" className="object-cover" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-brand-olive-dark">{product.name}</p>
                                                        <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                            Base Price: <RupeeAmount value={product.price} /> {product.unit}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="relative w-32">
                                                        <RupeeIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gold-bright" />
                                                        <input
                                                            type="number"
                                                            value={userPrices[String(product.id)] || ""}
                                                            onChange={(e) => handlePriceChange(product.id, e.target.value)}
                                                            placeholder={product.price.toString()}
                                                            className="w-full bg-white border border-transparent focus:border-brand-gold-bright/30 outline-none rounded-xl py-3 pl-8 pr-4 text-sm font-bold text-brand-olive-dark transition-all shadow-sm"
                                                        />
                                                    </div>
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => savePrice(product.id)}
                                                            disabled={isSaving === product.id}
                                                            className={cn(
                                                                "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2",
                                                                saveStatus[String(product.id)] === "success"
                                                                    ? "bg-emerald-600 text-white shadow-md"
                                                                    : saveStatus[String(product.id)] === "error"
                                                                        ? "bg-red-600 text-white shadow-md"
                                                                        : userPrices[String(product.id)] && userPrices[String(product.id)] !== product.price
                                                                            ? "bg-brand-olive-dark text-white hover:bg-brand-gold-bright shadow-md"
                                                                            : "bg-white text-gray-400 cursor-default"
                                                            )}
                                                        >
                                                            <AnimatePresence mode="wait" initial={false}>
                                                                {isSaving === product.id ? (
                                                                    <motion.span key="loading" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}>
                                                                        <Loader2 className="animate-spin" size={14} />
                                                                    </motion.span>
                                                                ) : saveStatus[String(product.id)] === "success" ? (
                                                                    <motion.span key="success" initial={{ opacity: 0, scale: 0.4, rotate: -45 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
                                                                        <CheckCircle2 size={14} />
                                                                    </motion.span>
                                                                ) : saveStatus[String(product.id)] === "error" ? (
                                                                    <motion.span key="error" initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1, x: [0, -4, 4, -4, 0] }} exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.4 }}>
                                                                        <AlertCircle size={14} />
                                                                    </motion.span>
                                                                ) : (
                                                                    <motion.span key="idle" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}>
                                                                        <CheckCircle2 size={14} />
                                                                    </motion.span>
                                                                )}
                                                            </AnimatePresence>
                                                            {saveStatus[String(product.id)] === "success" ? "Saved" : saveStatus[String(product.id)] === "error" ? "Failed" : "Update"}
                                                        </button>
                                                        <AnimatePresence>
                                                            {saveStatus[String(product.id)] === "error" && (
                                                                <motion.p
                                                                    initial={{ opacity: 0, y: -4 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    exit={{ opacity: 0, y: -4 }}
                                                                    className="absolute -bottom-5 right-0 text-[9px] font-bold text-red-600 whitespace-nowrap"
                                                                >
                                                                    Update failed
                                                                </motion.p>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export function ProductsView() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const [deletingId, setDeletingId] = useState<string | number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [updatingLimitId, setUpdatingLimitId] = useState<string | number | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const [prodRes, catRes] = await Promise.all([getProducts(), getCategories()]);
        if (prodRes.success) setProducts((prodRes.products || []) as unknown as Product[]);
        if (catRes.success) {
            setCategories((catRes.categories || []) as unknown as Category[]);
        }
        setIsLoading(false);
    };

    const handleAdd = async (product: Omit<Product, "id" | "created_at">) => {
        setIsSubmitting(true);
        const result = await addProduct(product as any);
        if (result.success) {
            setIsAddModalOpen(false);
            loadData();
        } else {
            alert("Failed to add product: " + result.error);
        }
        setIsSubmitting(false);
    };

    const handleLimitUpdate = async (product: Product, newLimit: number) => {
        setUpdatingLimitId(product.id);
        const { id, ...updateData } = product;
        delete updateData.created_at;
        const result = await updateProduct(id, { ...updateData, max_daily_limit: newLimit });
        if (result.success) {
            loadData();
        } else {
            alert("Failed to update limit: " + result.error);
        }
        setUpdatingLimitId(null);
    };

    const handleUpdate = async (updatedProduct: Omit<Product, "id" | "created_at">) => {
        if (!editingProduct) return;
        setIsSubmitting(true);
        const result = await updateProduct(editingProduct.id, updatedProduct);
        if (result.success) {
            setEditingProduct(null);
            loadData();
        } else {
            alert("Failed to update product: " + result.error);
        }
        setIsSubmitting(false);
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        setIsDeleting(true);
        const result = await deleteProduct(deletingId);
        setIsDeleting(false);
        setDeletingId(null);
        if (result.success) {
            const prodRes = await getProducts();
            if (prodRes.success) setProducts((prodRes.products || []) as unknown as Product[]);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3 text-brand-gold-bright font-black uppercase tracking-[0.2em] text-xs mb-3">
                        <ShoppingBag size={16} />
                        Catalog Management
                    </div>
                    <h1 className="text-5xl font-serif font-black text-brand-olive-dark tracking-tighter">Bakery Products</h1>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-3 px-8 py-4 bg-brand-olive-dark text-white rounded-2xl font-black hover:bg-brand-gold-bright transition-all shadow-xl active:scale-95 group"
                >
                    <Plus size={20} className="text-brand-gold-bright" />
                    Add New Product
                </button>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-premium p-10 border border-white">
                <div className="flex items-center justify-between mb-8 px-6">
                    <h3 className="text-2xl font-serif font-black text-brand-olive-dark">Existing Products ({products.length})</h3>
                    <div className="hidden md:flex items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <span className="w-[200px] text-center">Daily Max Limit</span>
                        <span className="w-[120px] text-center">Actions</span>
                    </div>
                </div>

                {isLoading ? (
                    <div className="py-20 flex flex-col items-center gap-4">
                        <Loader2 className="animate-spin text-brand-gold-bright" size={40} />
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Loading Catalog...</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="py-20 text-center space-y-4">
                        <div className="w-16 h-16 bg-brand-soft-gray rounded-full flex items-center justify-center text-gray-300 mx-auto">
                            <ShoppingBag size={32} />
                        </div>
                        <p className="text-gray-400 font-serif italic">Your catalog is currently empty.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {products.map((product) => (
                            <ProductRow
                                key={product.id}
                                product={product}
                                onEdit={() => setEditingProduct(product)}
                                onDelete={() => setDeletingId(product.id)}
                                onLimitUpdate={(limit) => handleLimitUpdate(product, limit)}
                                isUpdating={updatingLimitId === product.id}
                            />
                        ))}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {isAddModalOpen && (
                    <AddProductModal
                        categories={categories}
                        onClose={() => setIsAddModalOpen(false)}
                        onAdd={handleAdd}
                        isSubmitting={isSubmitting}
                    />
                )}
                {editingProduct && (
                    <EditProductModal
                        product={editingProduct}
                        categories={categories}
                        onClose={() => setEditingProduct(null)}
                        onSave={handleUpdate}
                        isSubmitting={isSubmitting}
                    />
                )}
            </AnimatePresence>
            <ConfirmDeleteModal
                isOpen={deletingId !== null}
                message="Delete this product permanently?"
                isLoading={isDeleting}
                onConfirm={handleDelete}
                onCancel={() => setDeletingId(null)}
            />
        </motion.div>
    );
}

export function CategoriesView() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [newName, setNewName] = useState("");

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setIsLoading(true);
        const result = await getCategories();
        if (result.success) setCategories((result.categories || []) as unknown as Category[]);
        setIsLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const result = await addCategory(newName);
        if (result.success) {
            setNewName("");
            loadCategories();
        } else {
            alert(result.error);
        }
        setIsSubmitting(false);
    };

    const handleUpdate = async (updatedName: string) => {
        if (!editingCategory) return;
        setIsSubmitting(true);
        const result = await updateCategory(editingCategory.id, updatedName);
        if (result.success) {
            setEditingCategory(null);
            loadCategories();
        }
        setIsSubmitting(false);
    };

    const [deletingId, setDeletingId] = useState<string | number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!deletingId) return;
        setIsDeleting(true);
        const result = await deleteCategory(deletingId);
        setIsDeleting(false);
        setDeletingId(null);
        if (result.success) loadCategories();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
        >
            <div>
                <div className="flex items-center gap-3 text-brand-gold-bright font-black uppercase tracking-[0.2em] text-xs mb-3">
                    <Settings size={16} />
                    Classification
                </div>
                <h1 className="text-5xl font-serif font-black text-brand-olive-dark tracking-tighter">Manage Categories</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-[2.5rem] shadow-premium p-10 border border-white">
                        <h3 className="text-2xl font-serif font-black text-brand-olive-dark mb-8">
                            Create Category
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-4">Category Name</label>
                                <input
                                    required
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="e.g., Seasonal Specials"
                                    className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 focus:bg-white outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-brand-olive-dark text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-brand-gold-bright transition-all shadow-xl active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                                Add Category
                            </button>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-white rounded-[2.5rem] shadow-premium p-10 border border-white">
                        <h3 className="text-2xl font-serif font-black text-brand-olive-dark mb-8">Active Categories ({categories.length})</h3>
                        {isLoading ? (
                            <div className="py-20 flex flex-col items-center gap-4">
                                <Loader2 className="animate-spin text-brand-gold-bright" size={40} />
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Loading...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {categories.map((cat) => (
                                    <div key={cat.id} className="flex items-center justify-between p-4 bg-brand-soft-gray/50 rounded-2xl group border border-transparent hover:border-brand-gold-bright/20 transition-all">
                                        <span className="text-sm font-black text-brand-olive-dark">{cat.name}</span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setEditingCategory(cat)}
                                                className="px-4 py-2 bg-brand-soft-gray hover:bg-brand-gold-bright hover:text-white text-brand-olive-dark rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2"
                                            >
                                                <Pencil size={14} />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => setDeletingId(cat.id)}
                                                className="px-4 py-2 bg-red-50 hover:bg-red-500 hover:text-white text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2"
                                            >
                                                <Trash2 size={14} />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <ConfirmDeleteModal
                isOpen={deletingId !== null}
                message="Delete this category? Products in it won't be deleted, but will have no category."
                isLoading={isDeleting}
                onConfirm={handleDelete}
                onCancel={() => setDeletingId(null)}
            />
            {editingCategory && (
                <EditCategoryModal
                    category={editingCategory}
                    onClose={() => setEditingCategory(null)}
                    onSave={handleUpdate}
                    isSubmitting={isSubmitting}
                />
            )}
        </motion.div>
    );
}

export function StaffView() {
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newStaff, setNewStaff] = useState({
        name: "",
        email: "",
        phone: "",
        role: "baker",
        password: ""
    });
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [statusUpdatingId, setStatusUpdatingId] = useState<string | number | null>(null);

    useEffect(() => {
        loadStaff();
    }, []);

    const loadStaff = async () => {
        const result = await getStaffMembers();
        if (result.success) setStaff((result.staff || []) as unknown as StaffMember[]);
        setIsLoading(false);
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const result = await addStaff(newStaff);
        if (result.success) {
            setNewStaff({ name: "", email: "", phone: "", role: "baker", password: "" });
            loadStaff();
        } else {
            alert(result.error);
        }
        setIsSubmitting(false);
    };

    const handleUpdate = async (data: { name: string, email: string, phone: string, role: string, password: string }) => {
        if (!editingStaff) return;
        setIsUpdating(true);
        const result = await updateStaff(editingStaff.id, data);
        if (result.success) {
            setEditingStaff(null);
            loadStaff();
        } else {
            alert(result.error);
        }
        setIsUpdating(false);
    };

    const [deletingId, setDeletingId] = useState<string | number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!deletingId) return;
        setIsDeleting(true);
        const result = await deleteStaff(deletingId);
        if (!result.success) {
            alert(result.error);
        }
        setIsDeleting(false);
        setDeletingId(null);
        loadStaff();
    };

    const handleReactivate = async (member: StaffMember) => {
        setStatusUpdatingId(member.id);
        const result = await setStaffStatus(member.id, "active");
        if (!result.success) {
            alert(result.error);
        }
        setStatusUpdatingId(null);
        loadStaff();
    };

    const visibleStaff = staff.filter((member) => {
        if (roleFilter !== "all" && member.role !== roleFilter) return false;
        if (statusFilter !== "all" && (member.status || "active") !== statusFilter) return false;
        return true;
    });

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20">
            <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-premium">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold-bright mb-1">Human Resources</p>
                    <h2 className="text-4xl font-serif font-black text-brand-olive-dark">Staff Management</h2>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-premium sticky top-10">
                        <h3 className="text-xl font-serif font-black text-brand-olive-dark mb-6">Add Staff Member</h3>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <input
                                required
                                type="text"
                                placeholder="Full Name"
                                value={newStaff.name}
                                onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                                className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                            />
                            <input
                                required
                                type="email"
                                placeholder="Email"
                                value={newStaff.email}
                                onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                                className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                            />
                            <input
                                required
                                type="tel"
                                placeholder="Phone"
                                value={newStaff.phone}
                                onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                                className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                            />
                            <select
                                value={newStaff.role}
                                onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                                className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                            >
                                <option value="baker">Baker</option>
                                <option value="delivery">Delivery Agent</option>
                                <option value="manager">Manager</option>
                                <option value="accountant">Accountant</option>
                                <option value="admin">Admin / Owner</option>
                            </select>
                            <input
                                required
                                type="password"
                                placeholder="Password"
                                value={newStaff.password}
                                onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                                className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                            />
                            <button
                                disabled={isSubmitting}
                                className="w-full bg-brand-olive-dark text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-gold-bright transition-all shadow-xl disabled:opacity-50"
                            >
                                {isSubmitting ? "Adding..." : "Add Staff Member"}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white p-4 rounded-3xl shadow-sm border border-brand-olive-dark/5 flex flex-wrap items-center gap-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-2">
                            {visibleStaff.length} of {staff.length} member{staff.length === 1 ? "" : "s"}
                        </span>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="ml-auto bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 outline-none rounded-xl py-2 px-4 text-xs font-bold text-brand-olive-dark transition-all"
                        >
                            <option value="all">All Roles</option>
                            <option value="baker">Baker</option>
                            <option value="delivery">Delivery Agent</option>
                            <option value="manager">Manager</option>
                            <option value="accountant">Accountant</option>
                            <option value="admin">Admin / Owner</option>
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
                            className="bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 outline-none rounded-xl py-2 px-4 text-xs font-bold text-brand-olive-dark transition-all"
                        >
                            <option value="all">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center p-20"><Loader2 className="animate-spin text-brand-gold-bright" /></div>
                    ) : visibleStaff.length === 0 ? (
                        <div className="py-16 text-center text-gray-400 font-serif italic bg-white rounded-3xl shadow-sm border border-brand-olive-dark/5">
                            No staff members match these filters.
                        </div>
                    ) : (
                        visibleStaff.map((member) => {
                            const isInactive = member.status === "inactive";
                            return (
                                <div key={member.id} className={cn(
                                    "bg-white p-6 rounded-3xl shadow-sm border flex items-center justify-between group transition-all",
                                    isInactive ? "border-gray-200 opacity-60" : "border-brand-olive-dark/5 hover:border-brand-gold-bright/30"
                                )}>
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-12 h-12 bg-brand-soft-gray rounded-2xl flex items-center justify-center text-brand-olive-dark font-black capitalize shadow-sm shrink-0">
                                            {member.name[0]}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-black text-brand-olive-dark truncate">{member.name}</h4>
                                                <span className={cn(
                                                    "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0",
                                                    isInactive ? "bg-gray-100 text-gray-400" : "bg-green-50 text-green-600"
                                                )}>
                                                    {isInactive ? "Inactive" : "Active"}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                <span>{member.role}</span>
                                                <span aria-hidden="true">-</span>
                                                <span>{member.phone}</span>
                                                <span aria-hidden="true">-</span>
                                                <span className="lowercase truncate">{member.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => setEditingStaff(member)}
                                            className="p-3 text-gray-300 hover:text-brand-gold-bright transition-colors"
                                            aria-label={`Edit ${member.name}`}
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        {isInactive ? (
                                            <button
                                                onClick={() => handleReactivate(member)}
                                                disabled={statusUpdatingId === member.id}
                                                className="p-3 text-gray-300 hover:text-green-600 transition-colors disabled:opacity-50"
                                                aria-label={`Reactivate ${member.name}`}
                                            >
                                                {statusUpdatingId === member.id ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setDeletingId(member.id)}
                                                className="p-3 text-gray-300 hover:text-red-500 transition-colors"
                                                aria-label={`Deactivate ${member.name}`}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <ConfirmDeleteModal
                isOpen={!!deletingId}
                message="Are you sure you want to deactivate this staff member? They will lose portal access, but their records are kept and can be reactivated later."
                isLoading={isDeleting}
                onConfirm={handleDelete}
                onCancel={() => setDeletingId(null)}
            />

            <AnimatePresence>
                {editingStaff && (
                    <EditStaffModal
                        staff={editingStaff}
                        onClose={() => setEditingStaff(null)}
                        onSave={handleUpdate}
                        isSubmitting={isUpdating}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
    cash: "Cash",
    upi: "UPI",
    bank_transfer: "Bank Transfer",
    card: "Card",
    net_banking: "Net Banking",
    wallet: "Wallet",
};

const PAYMENT_RECORD_FILTER_DAYS = [7, 30, 90, 0] as const;

interface PaymentRecord {
    id: string;
    amount: number;
    currencyCode: string;
    paymentMethod: string;
    notes: string | null;
    paymentDate: string;
    createdAt: string;
    userName: string;
    userPhone: string;
    userEmail: string;
    recordedByName: string;
    recordedByRole: string;
}

interface RegisteredUser {
    id: string | number;
    name: string;
    phone: string;
    email: string;
}

interface PaymentRecordHistoryEntry {
    id: string;
    action: "created" | "updated";
    amount: number;
    currencyCode: string;
    paymentMethod: string;
    paymentDate: string;
    notes: string | null;
    createdAt: string;
    changedByName: string;
    changedByRole: string;
}

export function PaymentRecordsView({ staffRole }: { staffRole?: string }) {
    const canEdit = staffRole === "admin";
    const [records, setRecords] = useState<PaymentRecord[]>([]);
    const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState("");
    const [justSaved, setJustSaved] = useState(false);
    const [filterDays, setFilterDays] = useState<number>(30);
    const [userSearch, setUserSearch] = useState("");
    const [selectedUser, setSelectedUser] = useState<RegisteredUser | null>(null);
    const todayIso = new Date().toISOString().slice(0, 10);
    const [newRecord, setNewRecord] = useState({
        amount: "",
        paymentMethod: "cash",
        notes: "",
        paymentDate: todayIso,
    });
    const [editingRecord, setEditingRecord] = useState<PaymentRecord | null>(null);
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [editError, setEditError] = useState("");
    const [historyRecordId, setHistoryRecordId] = useState<string | null>(null);
    const [historyEntries, setHistoryEntries] = useState<PaymentRecordHistoryEntry[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    useEffect(() => {
        loadRecords();
        loadUsers();
    }, []);

    const loadRecords = async () => {
        const result = await getManualPaymentRecords();
        if (result.success) setRecords((result.records || []) as PaymentRecord[]);
        setIsLoading(false);
    };

    const loadUsers = async () => {
        const result = await getUsers();
        if (result.success) setRegisteredUsers((result.users || []) as RegisteredUser[]);
        setIsLoadingUsers(false);
    };

    const filteredUsers = registeredUsers.filter((user) => {
        const term = userSearch.trim().toLowerCase();
        if (!term) return true;
        return [user.name, user.phone, user.email].filter(Boolean).some((value) => value.toLowerCase().includes(term));
    });

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) {
            setFormError("Select a registered user to attribute this payment to.");
            return;
        }
        setFormError("");
        setJustSaved(false);
        setIsSubmitting(true);
        const result = await recordManualPayment({
            userId: String(selectedUser.id),
            amount: newRecord.amount,
            paymentMethod: newRecord.paymentMethod,
            notes: newRecord.notes || undefined,
            paymentDate: newRecord.paymentDate || undefined,
        });
        if (result.success) {
            setNewRecord({ amount: "", paymentMethod: "cash", notes: "", paymentDate: todayIso });
            setSelectedUser(null);
            setUserSearch("");
            setJustSaved(true);
            loadRecords();
        } else {
            setFormError(result.error || "Failed to record payment");
        }
        setIsSubmitting(false);
    };

    const handleSaveEdit = async (updated: { amount: string; paymentMethod: string; paymentDate: string; notes: string }) => {
        if (!editingRecord) return;
        setEditError("");
        setIsSavingEdit(true);
        const result = await updateManualPaymentRecord({
            recordId: editingRecord.id,
            amount: updated.amount,
            paymentMethod: updated.paymentMethod,
            paymentDate: updated.paymentDate,
            notes: updated.notes || undefined,
        });
        if (result.success) {
            setEditingRecord(null);
            loadRecords();
            if (historyRecordId === editingRecord.id) loadHistory(editingRecord.id);
        } else {
            setEditError(result.error || "Failed to update payment record");
        }
        setIsSavingEdit(false);
    };

    const loadHistory = async (recordId: string) => {
        setIsLoadingHistory(true);
        const result = await getManualPaymentRecordHistory(recordId);
        if (result.success) setHistoryEntries((result.history || []) as PaymentRecordHistoryEntry[]);
        setIsLoadingHistory(false);
    };

    const toggleHistory = (recordId: string) => {
        if (historyRecordId === recordId) {
            setHistoryRecordId(null);
            setHistoryEntries([]);
            return;
        }
        setHistoryRecordId(recordId);
        loadHistory(recordId);
    };

    const filteredRecords = records.filter((record) => {
        if (filterDays === 0) return true;
        const recordDate = new Date(record.createdAt);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - filterDays);
        return recordDate >= cutoff;
    });

    const totalInRange = filteredRecords.reduce((sum, record) => sum + record.amount, 0);

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20">
            <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-premium">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold-bright mb-1">Finance</p>
                    <h2 className="text-4xl font-serif font-black text-brand-olive-dark">Payment Records</h2>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-premium sticky top-10">
                        <h3 className="text-xl font-serif font-black text-brand-olive-dark mb-6">Record a Payment</h3>
                        <p className="text-xs text-gray-400 font-bold mb-6">
                            Log a payment received outside the app (cash, UPI, bank transfer, etc.) for a registered user.
                        </p>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <label className="mb-2 block pl-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Registered User</label>
                                {selectedUser ? (
                                    <div className="flex items-center justify-between rounded-2xl border-2 border-brand-olive-dark bg-brand-olive-dark px-5 py-4 text-white">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-black">{selectedUser.name}</p>
                                            <p className="truncate text-[10px] font-bold uppercase tracking-widest text-brand-gold-bright">{selectedUser.phone || selectedUser.email}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedUser(null)}
                                            className="shrink-0 p-2 text-white/70 hover:text-white"
                                            aria-label="Change user"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <input
                                            type="text"
                                            placeholder="Search name, phone, or email"
                                            value={userSearch}
                                            onChange={(e) => setUserSearch(e.target.value)}
                                            className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                                        />
                                        <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-2xl">
                                            {isLoadingUsers ? (
                                                <div className="flex justify-center py-6">
                                                    <Loader2 className="animate-spin text-brand-gold-bright" size={22} />
                                                </div>
                                            ) : filteredUsers.length === 0 ? (
                                                <div className="rounded-2xl bg-brand-soft-gray p-4 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                    No registered users found
                                                </div>
                                            ) : (
                                                filteredUsers.slice(0, 20).map((user) => (
                                                    <button
                                                        type="button"
                                                        key={user.id}
                                                        onClick={() => { setSelectedUser(user); setFormError(""); }}
                                                        className="w-full rounded-2xl border border-transparent bg-brand-soft-gray/60 p-3 text-left text-brand-olive-dark transition-all hover:border-brand-gold-bright/30"
                                                    >
                                                        <p className="truncate text-sm font-black">{user.name}</p>
                                                        <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-widest text-gray-400">{user.phone || user.email}</p>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                            <input
                                required
                                type="number"
                                min="0.01"
                                step="0.01"
                                placeholder="Amount"
                                value={newRecord.amount}
                                onChange={(e) => setNewRecord({ ...newRecord, amount: e.target.value })}
                                className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                            />
                            <select
                                value={newRecord.paymentMethod}
                                onChange={(e) => setNewRecord({ ...newRecord, paymentMethod: e.target.value })}
                                className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                            >
                                {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                            <input
                                required
                                type="date"
                                max={todayIso}
                                value={newRecord.paymentDate}
                                onChange={(e) => setNewRecord({ ...newRecord, paymentDate: e.target.value })}
                                className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                            />
                            <textarea
                                placeholder="Notes (optional)"
                                rows={3}
                                value={newRecord.notes}
                                onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                                className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all resize-none"
                            />

                            {formError ? (
                                <div className="rounded-2xl px-5 py-4 text-sm font-bold bg-red-50 text-red-600">{formError}</div>
                            ) : null}
                            {justSaved ? (
                                <div className="rounded-2xl px-5 py-4 text-sm font-bold bg-green-50 text-green-700">Payment recorded.</div>
                            ) : null}

                            <button
                                disabled={isSubmitting}
                                className="w-full bg-brand-olive-dark text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-gold-bright transition-all shadow-xl disabled:opacity-50"
                            >
                                {isSubmitting ? "Recording..." : "Record Payment"}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-8">
                    <div className="flex w-fit gap-2 rounded-3xl bg-brand-soft-gray/50 p-2">
                        {PAYMENT_RECORD_FILTER_DAYS.map((days) => (
                            <button
                                key={days}
                                onClick={() => setFilterDays(days)}
                                className={cn(
                                    "rounded-2xl px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all",
                                    filterDays === days
                                        ? "bg-brand-olive-dark text-white shadow-lg"
                                        : "text-gray-400 hover:text-brand-olive-dark"
                                )}
                            >
                                {days === 0 ? "All Time" : `Last ${days} Days`}
                            </button>
                        ))}
                    </div>

                    <div className="rounded-[2.5rem] bg-white p-8 shadow-premium">
                        <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Recorded In Range</p>
                        <h3 className="text-4xl font-serif font-black text-brand-olive-dark">
                            <RupeeAmount value={totalInRange.toFixed(2)} />
                        </h3>
                        <p className="mt-1 text-xs font-bold text-gray-400">{filteredRecords.length} payment{filteredRecords.length === 1 ? "" : "s"}</p>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center p-20"><Loader2 className="animate-spin text-brand-gold-bright" /></div>
                    ) : filteredRecords.length === 0 ? (
                        <div className="py-16 text-center text-gray-400 font-serif italic bg-white rounded-3xl shadow-sm border border-brand-olive-dark/5">
                            No payment records in this range.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredRecords.map((record) => (
                                <div key={record.id} className="bg-white p-6 rounded-3xl shadow-sm border border-brand-olive-dark/5 hover:border-brand-gold-bright/30 transition-all">
                                    <div className="flex items-center justify-between group">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-12 h-12 bg-brand-soft-gray rounded-2xl flex items-center justify-center text-brand-olive-dark shrink-0">
                                                <Wallet size={20} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-black text-brand-olive-dark truncate">{record.userName}</h4>
                                                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0 bg-brand-soft-gray text-brand-olive-dark">
                                                        {PAYMENT_METHOD_LABELS[record.paymentMethod] || record.paymentMethod}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                    <span>{new Date(record.paymentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                                                    <span aria-hidden="true">-</span>
                                                    <span>Recorded by {record.recordedByName} ({record.recordedByRole})</span>
                                                    {record.userPhone ? (
                                                        <>
                                                            <span aria-hidden="true">-</span>
                                                            <span>{record.userPhone}</span>
                                                        </>
                                                    ) : null}
                                                </div>
                                                {record.notes ? (
                                                    <p className="mt-2 text-xs text-gray-500 font-medium normal-case truncate">{record.notes}</p>
                                                ) : null}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 shrink-0 pl-4">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleHistory(record.id)}
                                                    className={cn(
                                                        "p-2 rounded-xl transition-colors",
                                                        historyRecordId === record.id ? "bg-brand-soft-gray text-brand-olive-dark" : "text-gray-400 hover:text-brand-olive-dark hover:bg-brand-soft-gray"
                                                    )}
                                                    aria-label="View history"
                                                    title="View history"
                                                >
                                                    <History size={16} />
                                                </button>
                                                {canEdit && (
                                                    <button
                                                        type="button"
                                                        onClick={() => { setEditError(""); setEditingRecord(record); }}
                                                        className="p-2 rounded-xl text-gray-400 hover:text-brand-gold-bright hover:bg-brand-soft-gray transition-colors"
                                                        aria-label="Edit payment"
                                                        title="Edit payment"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="text-lg font-serif font-black text-brand-olive-dark">
                                                <RupeeAmount value={record.amount.toFixed(2)} />
                                            </div>
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {historyRecordId === record.id && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="mt-4 border-t border-brand-soft-gray pt-4">
                                                    <p className="mb-3 text-[9px] font-black uppercase tracking-widest text-gray-400">Change History</p>
                                                    {isLoadingHistory ? (
                                                        <div className="flex justify-center py-6"><Loader2 className="animate-spin text-brand-gold-bright" size={20} /></div>
                                                    ) : historyEntries.length === 0 ? (
                                                        <p className="text-xs text-gray-400 font-medium italic">No history found.</p>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {historyEntries.map((entry) => (
                                                                <div key={entry.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-brand-soft-gray/50 px-4 py-3">
                                                                    <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                                                        <span className={cn(
                                                                            "rounded-full px-2 py-0.5 font-black",
                                                                            entry.action === "created" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-800"
                                                                        )}>
                                                                            {entry.action === "created" ? "Created" : "Edited"}
                                                                        </span>
                                                                        <span>{PAYMENT_METHOD_LABELS[entry.paymentMethod] || entry.paymentMethod}</span>
                                                                        <span>{new Date(entry.paymentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                                                                        <span>by {entry.changedByName} ({entry.changedByRole})</span>
                                                                        <span>{new Date(entry.createdAt).toLocaleString("en-IN")}</span>
                                                                    </div>
                                                                    <div className="text-sm font-serif font-black text-brand-olive-dark">
                                                                        <RupeeAmount value={entry.amount.toFixed(2)} />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {editingRecord && (
                    <EditPaymentRecordModal
                        record={editingRecord}
                        onClose={() => setEditingRecord(null)}
                        onSave={handleSaveEdit}
                        isSubmitting={isSavingEdit}
                        error={editError}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function EditPaymentRecordModal({
    record,
    onClose,
    onSave,
    isSubmitting,
    error,
}: {
    record: PaymentRecord;
    onClose: () => void;
    onSave: (data: { amount: string; paymentMethod: string; paymentDate: string; notes: string }) => void;
    isSubmitting: boolean;
    error: string;
}) {
    const todayIso = new Date().toISOString().slice(0, 10);
    const [data, setData] = useState({
        amount: String(record.amount),
        paymentMethod: record.paymentMethod,
        paymentDate: record.paymentDate.slice(0, 10),
        notes: record.notes || "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(data);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 py-8 sm:items-center sm:p-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-brand-olive-dark/60 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl border border-white/20 sm:rounded-[3rem]"
            >
                <div className="p-6 sm:p-10">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold-bright mb-1">Finance</p>
                            <h3 className="text-3xl font-serif font-black text-brand-olive-dark">Edit Payment</h3>
                            <p className="mt-2 text-xs font-bold text-gray-400">{record.userName} - {record.userPhone || record.userEmail}</p>
                        </div>
                        <button onClick={onClose} className="p-3 bg-brand-soft-gray rounded-2xl text-gray-400 hover:text-brand-olive-dark transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-4">Amount</label>
                            <input
                                required
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={data.amount}
                                onChange={(e) => setData({ ...data, amount: e.target.value })}
                                className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 focus:bg-white outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-4">Payment Method</label>
                            <select
                                value={data.paymentMethod}
                                onChange={(e) => setData({ ...data, paymentMethod: e.target.value })}
                                className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 focus:bg-white outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                            >
                                {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-4">Payment Date</label>
                            <input
                                required
                                type="date"
                                max={todayIso}
                                value={data.paymentDate}
                                onChange={(e) => setData({ ...data, paymentDate: e.target.value })}
                                className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 focus:bg-white outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-4">Notes</label>
                            <textarea
                                rows={3}
                                value={data.notes}
                                onChange={(e) => setData({ ...data, notes: e.target.value })}
                                className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 focus:bg-white outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all resize-none"
                            />
                        </div>

                        {error ? (
                            <div className="rounded-2xl px-5 py-4 text-sm font-bold bg-red-50 text-red-600">{error}</div>
                        ) : null}

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 bg-brand-soft-gray text-brand-olive-dark py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={isSubmitting}
                                className="flex-1 bg-brand-olive-dark text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-gold-bright transition-all shadow-xl disabled:opacity-50"
                            >
                                {isSubmitting ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}

function EditStaffModal({ staff, onClose, onSave, isSubmitting }: EditStaffModalProps) {
    const [data, setData] = useState({
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
        password: ""
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(data);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 py-8 sm:items-center sm:p-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-brand-olive-dark/60 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl border border-white/20 sm:rounded-[3rem]"
            >
                <div className="p-6 sm:p-10">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold-bright mb-1">Human Resources</p>
                            <h3 className="text-3xl font-serif font-black text-brand-olive-dark">Edit Staff Member</h3>
                        </div>
                        <button onClick={onClose} className="p-3 bg-brand-soft-gray rounded-2xl text-gray-400 hover:text-brand-olive-dark transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-4">Full Name</label>
                            <input
                                required
                                type="text"
                                value={data.name}
                                onChange={(e) => setData({ ...data, name: e.target.value })}
                                className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 focus:bg-white outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-4">Email</label>
                            <input
                                required
                                type="email"
                                value={data.email}
                                onChange={(e) => setData({ ...data, email: e.target.value })}
                                className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 focus:bg-white outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-4">Phone</label>
                            <input
                                required
                                type="tel"
                                value={data.phone}
                                onChange={(e) => setData({ ...data, phone: e.target.value })}
                                className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 focus:bg-white outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-4">Role</label>
                            <select
                                value={data.role}
                                onChange={(e) => setData({ ...data, role: e.target.value as StaffMember["role"] })}
                                className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 focus:bg-white outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                            >
                                <option value="baker">Baker</option>
                                <option value="delivery">Delivery Agent</option>
                                <option value="manager">Manager</option>
                                <option value="accountant">Accountant</option>
                                <option value="admin">Admin / Owner</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-4">New Password (optional)</label>
                            <input
                                type="password"
                                placeholder="Leave blank to keep current password"
                                value={data.password}
                                onChange={(e) => setData({ ...data, password: e.target.value })}
                                className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 focus:bg-white outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                            />
                        </div>
                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 bg-brand-soft-gray text-brand-olive-dark py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={isSubmitting}
                                className="flex-1 bg-brand-olive-dark text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-gold-bright transition-all shadow-xl disabled:opacity-50"
                            >
                                {isSubmitting ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}

function EditProductModal({ product, categories, onClose, onSave, isSubmitting }: EditProductModalProps) {
    const [data, setData] = useState({
        name: product.name,
        category: product.category,
        price: product.price,
        image: product.image,
        description: product.description || "",
        unit: product.unit || "per kg",
        max_daily_limit: product.max_daily_limit || 0
    });
    const [isUploading, setIsUploading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(data);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        const result = await uploadImage(formData);
        if (result.success && result.url) {
            setData(prev => ({ ...prev, image: result.url }));
        } else {
            alert("Upload failed: " + result.error);
        }
        setIsUploading(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 py-8 sm:items-center sm:p-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-brand-olive-dark/60 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl border border-white/20 sm:rounded-[3rem]"
            >
                <div className="p-6 sm:p-10">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold-bright mb-1">Catalog Update</p>
                            <h3 className="text-3xl font-serif font-black text-brand-olive-dark">Edit Product</h3>
                        </div>
                        <button onClick={onClose} className="p-3 bg-brand-soft-gray rounded-2xl text-gray-400 hover:text-brand-olive-dark transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="space-y-2 col-span-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-4">Product Name</label>
                                <input
                                    required
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData({ ...data, name: e.target.value })}
                                    className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 focus:bg-white outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-4">Category</label>
                                <select
                                    required
                                    value={data.category}
                                    onChange={(e) => setData({ ...data, category: e.target.value })}
                                    className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 focus:bg-white outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                                >
                                    {categories.map((cat: any) => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-4">Unit</label>
                                <input
                                    required
                                    type="text"
                                    value={data.unit}
                                    onChange={(e) => setData({ ...data, unit: e.target.value })}
                                    className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 focus:bg-white outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-4">Price</label>
                                <input
                                    required
                                    type="number"
                                    value={isNaN(data.price) ? "" : data.price}
                                    onChange={(e) => setData({ ...data, price: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 focus:bg-white outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-4">Daily Max Limit</label>
                                <input
                                    required
                                    type="number"
                                    value={isNaN(data.max_daily_limit) ? "" : data.max_daily_limit}
                                    onChange={(e) => setData({ ...data, max_daily_limit: parseInt(e.target.value) || 0 })}
                                    placeholder="0 = No limit"
                                    className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 focus:bg-white outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                                />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-4">Product Image</label>
                                <div className="relative group p-6 bg-brand-soft-gray rounded-[2rem] border-2 border-dashed border-gray-200 hover:border-brand-gold-bright/30 transition-all text-center">
                                    <div className="relative w-full max-w-sm mx-auto aspect-video rounded-xl overflow-hidden shadow-lg mb-4 bg-white">
                                        <Image src={data.image} alt="Preview" fill sizes="(max-width: 640px) 100vw, 384px" className="object-cover" />
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all flex items-center justify-center">
                                            <div className="bg-white/90 backdrop-blur-sm p-4 rounded-full text-brand-olive-dark transform scale-0 group-hover:scale-100 transition-all duration-300">
                                                <Camera size={24} />
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Click to change product photo</p>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        disabled={isUploading}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    {isUploading && (
                                        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-[2rem] flex flex-col items-center justify-center gap-4">
                                            <Loader2 className="animate-spin text-brand-gold-bright" size={32} />
                                            <p className="text-xs font-black uppercase tracking-widest text-brand-gold-bright">Uploading to Cloud...</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2 col-span-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-4">Description</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={data.description}
                                    onChange={(e) => setData({ ...data, description: e.target.value })}
                                    className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 focus:bg-white outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-5 rounded-2xl font-black text-gray-400 hover:bg-brand-soft-gray transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-[2] bg-brand-olive-dark text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-brand-gold-bright transition-all shadow-xl active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}

function AddProductModal({ categories, onClose, onAdd, isSubmitting }: AddProductModalProps) {
    const [data, setData] = useState({
        name: "",
        category: categories[0]?.name || "",
        price: 0,
        image: "/images/bakery/sourdough.png",
        description: "",
        unit: "per kg",
        max_daily_limit: 100
    });
    const [isUploading, setIsUploading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd(data);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        const result = await uploadImage(formData);
        if (result.success && result.url) {
            setData(prev => ({ ...prev, image: result.url }));
        } else {
            alert("Upload failed: " + result.error);
        }
        setIsUploading(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 py-8 sm:items-center sm:p-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-brand-olive-dark/60 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl border border-white/20 sm:rounded-[3rem]"
            >
                <div className="p-6 sm:p-10">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold-bright mb-1">New Arrival</p>
                            <h3 className="text-3xl font-serif font-black text-brand-olive-dark">Add Product</h3>
                        </div>
                        <button onClick={onClose} className="p-3 bg-brand-soft-gray rounded-2xl text-gray-400 hover:text-brand-olive-dark transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="space-y-2 col-span-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-4">Product Name</label>
                                <input
                                    required
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData({ ...data, name: e.target.value })}
                                    placeholder="e.g., Artisanal Sourdough"
                                    className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 focus:bg-white outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-4">Category</label>
                                <select
                                    required
                                    value={data.category}
                                    onChange={(e) => setData({ ...data, category: e.target.value })}
                                    className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 focus:bg-white outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                                >
                                    {categories.map((cat: any) => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-4">Unit</label>
                                <input
                                    required
                                    type="text"
                                    value={data.unit}
                                    onChange={(e) => setData({ ...data, unit: e.target.value })}
                                    placeholder="per kg"
                                    className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 focus:bg-white outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-4">Price</label>
                                <input
                                    required
                                    type="number"
                                    value={isNaN(data.price) ? "" : data.price}
                                    onChange={(e) => setData({ ...data, price: parseInt(e.target.value) || 0 })}
                                    placeholder="280"
                                    className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 focus:bg-white outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-4">Daily Max Limit</label>
                                <input
                                    required
                                    type="number"
                                    value={isNaN(data.max_daily_limit) ? "" : data.max_daily_limit}
                                    onChange={(e) => setData({ ...data, max_daily_limit: parseInt(e.target.value) || 0 })}
                                    placeholder="0 = No limit"
                                    className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 focus:bg-white outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all"
                                />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-4">Product Image</label>
                                <div className="relative group p-6 bg-brand-soft-gray rounded-[2rem] border-2 border-dashed border-gray-200 hover:border-brand-gold-bright/30 transition-all text-center">
                                    <div className="relative w-full max-w-sm mx-auto aspect-video rounded-xl overflow-hidden shadow-lg mb-4 bg-white">
                                        <Image src={data.image} alt="Preview" fill sizes="(max-width: 640px) 100vw, 384px" className="object-cover" />
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all flex items-center justify-center">
                                            <div className="bg-white/90 backdrop-blur-sm p-4 rounded-full text-brand-olive-dark transform scale-0 group-hover:scale-100 transition-all duration-300">
                                                <Camera size={24} />
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Click to upload product photo</p>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        disabled={isUploading}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    {isUploading && (
                                        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-[2rem] flex flex-col items-center justify-center gap-4">
                                            <Loader2 className="animate-spin text-brand-gold-bright" size={32} />
                                            <p className="text-xs font-black uppercase tracking-widest text-brand-gold-bright">Uploading to Cloud...</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2 col-span-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-4">Description</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={data.description}
                                    onChange={(e) => setData({ ...data, description: e.target.value })}
                                    className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 focus:bg-white outline-none rounded-2xl py-4 px-6 text-sm font-bold text-brand-olive-dark transition-all resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-5 rounded-2xl font-black text-gray-400 hover:bg-brand-soft-gray transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-[2] bg-brand-olive-dark text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-brand-gold-bright transition-all shadow-xl active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                                Add Product
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}

function ProductRow({ product, onEdit, onDelete, onLimitUpdate, isUpdating }: {
    product: Product;
    onEdit: () => void;
    onDelete: () => void;
    onLimitUpdate: (limit: number) => void;
    isUpdating: boolean;
}) {
    const [localLimit, setLocalLimit] = useState(product.max_daily_limit);
    const hasChanged = localLimit !== product.max_daily_limit;

    useEffect(() => {
        setLocalLimit(product.max_daily_limit);
    }, [product.max_daily_limit]);

    return (
        <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-brand-soft-gray/50 rounded-2xl group border border-transparent hover:border-brand-gold-bright/20 transition-all gap-6">
            <div className="flex items-center gap-6 flex-1 w-full">
                <div className="w-16 h-16 bg-white rounded-2xl overflow-hidden shadow-sm relative shrink-0">
                    <Image src={product.image} alt={product.name} fill sizes="64px" className="object-cover" />
                </div>
                <div className="flex-1">
                    <p className="text-lg font-black text-brand-olive-dark">{product.name}</p>
                    <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-brand-gold-bright">{product.category} <span aria-hidden="true">-</span> <RupeeAmount value={product.price} /> {product.unit}</p>
                    {product.description && <p className="text-xs text-gray-400 font-medium line-clamp-1 mt-1">{product.description}</p>}
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 w-full md:w-auto md:justify-end">
                {/* Inline Limit Edit */}
                <div className="flex justify-center">
                    <div className="flex items-center gap-3 bg-white p-2 pr-3 rounded-xl shadow-sm border border-brand-olive-dark/5">
                        <input
                            type="number"
                            value={isNaN(localLimit) ? "" : localLimit}
                            onChange={(e) => setLocalLimit(parseInt(e.target.value) || 0)}
                            className="w-20 bg-transparent outline-none px-3 py-1.5 text-sm font-black text-brand-olive-dark text-center"
                        />
                        <button
                            onClick={() => onLimitUpdate(localLimit)}
                            disabled={!hasChanged || isUpdating}
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                hasChanged
                                    ? "bg-brand-gold-bright text-brand-olive-dark hover:scale-110 shadow-md"
                                    : "text-gray-300 pointer-events-none"
                            )}
                        >
                            {isUpdating ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                        </button>
                    </div>
                </div>

                <div className="flex justify-center gap-2">
                    <button
                        onClick={onEdit}
                        className="p-2.5 bg-white hover:bg-brand-olive-dark hover:text-white text-brand-olive-dark rounded-xl transition-all active:scale-95 shadow-sm"
                        title="Edit Product"
                    >
                        <Pencil size={16} />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2.5 bg-white hover:bg-red-500 hover:text-white text-red-500 rounded-xl transition-all active:scale-95 shadow-sm"
                        title="Delete Product"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

function EditCategoryModal({ category, onClose, onSave, isSubmitting }: EditCategoryModalProps) {
    const [name, setName] = useState(category.name);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(name);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-brand-olive-dark/60 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-white/20"
            >
                <div className="p-10">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold-bright mb-1">Structure Update</p>
                            <h3 className="text-3xl font-serif font-black text-brand-olive-dark">Edit Category</h3>
                        </div>
                        <button onClick={onClose} className="p-3 bg-brand-soft-gray rounded-2xl text-gray-400 hover:text-brand-olive-dark transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-4">Category Name</label>
                            <input
                                required
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 focus:bg-white outline-none rounded-2xl py-5 px-8 text-lg font-bold text-brand-olive-dark transition-all"
                            />
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-5 rounded-2xl font-black text-gray-400 hover:bg-brand-soft-gray transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-[2] bg-brand-olive-dark text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-brand-gold-bright transition-all shadow-xl active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Reusable confirm-delete modal (replaces window.confirm which browsers block)
// ---------------------------------------------------------------------------
function ConfirmDeleteModal({ isOpen, message, isLoading, onConfirm, onCancel }: ConfirmDeleteModalProps) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[2rem] shadow-2xl p-8 max-w-sm w-full border border-white/20"
            >
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 shrink-0">
                        <Trash2 size={22} />
                    </div>
                    <div>
                        <h3 className="text-lg font-serif font-black text-brand-olive-dark">Confirm Delete</h3>
                        <p className="text-sm text-gray-500 font-medium mt-0.5">{message}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-500 font-black text-sm hover:border-gray-300 transition-all active:scale-95 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-black text-sm hover:bg-red-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                        Delete
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
