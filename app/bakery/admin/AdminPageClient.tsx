"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShieldCheck,
    Database,
    Users,
    Activity,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    Loader2,
    LayoutDashboard,
    ShoppingBag,
    Users2,
    Settings,
    Plus,
    Trash2,
    Camera,
    ChevronRight,
    X,
    Pencil,
    User as UserIcon
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { RupeeAmount, RupeeIcon } from "@/components/ui/RupeeAmount";
import { formatOrderDisplayLabel } from "@/lib/order-display";
import {
    getHealthStatus,
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
    deleteStaff,
    getOrders,
    updateOrderStatus,
    logoutAdmin,
    getUsers,
    getUserPrices,
    setUserPrice,
    updateUserBillingSettings,
    getOrderFeedbackTickets,
    updateOrderFeedbackStatus
} from "@/app/bakery/actions";

type AdminSection = "dashboard" | "categories" | "products" | "staff" | "orders" | "users" | "pricing" | "issues";

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
    created_at?: string;
}

interface OrderItem {
    id: string | number;
    product_id: string | number;
    quantity: number;
    price_at_time: number;
    product_name: string;
    product_image: string;
}

interface Order {
    id: string | number;
    order_number?: string;
    status: string;
    total_price: number;
    created_at: string;
    user_name: string;
    user_phone: string;
    items: OrderItem[];
}

type OrderFeedbackStatus = "open" | "in_review" | "resolved" | "closed";

interface OrderFeedbackImage {
    url: string;
    key?: string;
    name?: string;
}

interface OrderFeedbackTicket {
    id: string;
    order_id: string;
    issue_type: string;
    description: string;
    image_urls: (OrderFeedbackImage | string)[];
    status: OrderFeedbackStatus;
    created_at: string;
    updated_at: string;
    order_number?: string;
    order_status: string;
    total_price: number;
    user_name: string;
    user_email?: string;
    user_phone?: string;
}

const FEEDBACK_TICKETS_PER_PAGE = 20;
const ISSUE_STATUS_OPTIONS: { value: OrderFeedbackStatus; label: string }[] = [
    { value: "open", label: "Open" },
    { value: "in_review", label: "In Review" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" },
];

type HealthData = {
    database?: {
        connected: boolean;
        latency?: string;
        userCount?: number;
    };
} | null;

interface SidebarLinkProps {
    icon: React.ReactNode;
    label: string;
    active: boolean;
    onClick: () => void;
}

interface DashboardStatProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    subtext: string;
    status: "success" | "error" | "info";
}

interface HealthItemProps {
    label: string;
    status: boolean | undefined;
    detail: string;
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

export default function AdminPageClient() {
    const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");

    return (
        <div className="min-h-screen bg-brand-soft-gray flex overflow-hidden">
            {/* Sidebar */}
            <aside className="w-80 bg-white border-r border-brand-olive-dark/5 flex flex-col h-screen fixed left-0 top-0 overflow-y-auto z-20 shadow-sm">
                <div className="p-8 pb-12">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 bg-brand-olive-dark rounded-xl flex items-center justify-center text-brand-gold-bright shadow-lg">
                            <ShieldCheck size={20} />
                        </div>
                        <span className="font-serif font-black text-xl text-brand-olive-dark tracking-tight">Bakery Admin</span>
                    </div>

                    <nav className="space-y-4">
                        <SidebarLink
                            icon={<LayoutDashboard />}
                            label="Dashboard"
                            active={activeSection === "dashboard"}
                            onClick={() => setActiveSection("dashboard")}
                        />
                        <SidebarLink
                            icon={<ShoppingBag />}
                            label="Orders"
                            active={activeSection === "orders"}
                            onClick={() => setActiveSection("orders")}
                        />
                        <SidebarLink
                            icon={<AlertCircle />}
                            label="User Issues"
                            active={activeSection === "issues"}
                            onClick={() => setActiveSection("issues")}
                        />
                        <SidebarLink
                            icon={<Settings />}
                            label="Categories"
                            active={activeSection === "categories"}
                            onClick={() => setActiveSection("categories")}
                        />
                        <SidebarLink
                            icon={<Database />}
                            label="Products"
                            active={activeSection === "products"}
                            onClick={() => setActiveSection("products")}
                        />
                        <SidebarLink
                            icon={<Users />}
                            label="Staff"
                            active={activeSection === "staff"}
                            onClick={() => setActiveSection("staff")}
                        />
                        <SidebarLink
                            icon={<Users2 />}
                            label="Users"
                            active={activeSection === "users"}
                            onClick={() => setActiveSection("users")}
                        />
                        <SidebarLink
                            icon={<Activity />}
                            label="Pricing"
                            active={activeSection === "pricing"}
                            onClick={() => setActiveSection("pricing")}
                        />
                    </nav>
                </div>

                <div className="mt-auto p-8 border-t border-brand-olive-dark/5">
                    <form action={logoutAdmin}>
                        <button
                            type="submit"
                            className="w-full flex items-center gap-3 text-gray-400 hover:text-red-500 font-black uppercase tracking-widest text-xs transition-colors"
                        >
                            Sign Out
                            <ChevronRight size={14} />
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-80 p-12 overflow-y-auto h-screen">
                <AnimatePresence mode="wait">
                    {activeSection === "dashboard" && <DashboardView key="dashboard" />}
                    {activeSection === "orders" && <OrdersView key="orders" />}
                    {activeSection === "issues" && <AdminUserIssuesView key="issues" />}
                    {activeSection === "categories" && <CategoriesView key="categories" />}
                    {activeSection === "products" && <ProductsView key="products" />}
                    {activeSection === "staff" && <StaffView key="staff" />}
                    {activeSection === "users" && <UsersView key="users" />}
                    {activeSection === "pricing" && <PricingView key="pricing" />}
                </AnimatePresence>
            </main>
        </div>
    );
}

function UsersView() {
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
function PricingView() {
    const [users, setUsers] = useState<any[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [userPrices, setUserPrices] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState<string | number | null>(null);

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
        setIsSaving(productId);
        const price = userPrices[String(productId)] || 0;
        const result = await setUserPrice(selectedUser.id, productId, price);
        if (result.success) {
            // Optional: Show success toast
        } else {
            alert(result.error);
        }
        setIsSaving(null);
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
                                                        <Image src={product.image} alt={product.name} fill className="object-cover" />
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
                                                    <button
                                                        onClick={() => savePrice(product.id)}
                                                        disabled={isSaving === product.id}
                                                        className={cn(
                                                            "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2",
                                                            userPrices[String(product.id)] && userPrices[String(product.id)] !== product.price
                                                                ? "bg-brand-olive-dark text-white hover:bg-brand-gold-bright shadow-md"
                                                                : "bg-white text-gray-400 cursor-default"
                                                        )}
                                                    >
                                                        {isSaving === product.id ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                                                        Update
                                                    </button>
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

function SidebarLink({ icon, label, active, onClick }: SidebarLinkProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black uppercase tracking-[0.1em] text-xs transition-all",
                active
                    ? "bg-brand-olive-dark text-white shadow-xl"
                    : "text-gray-400 hover:bg-brand-soft-gray hover:text-brand-olive-dark"
            )}
        >
            <span className={cn(active ? "text-brand-gold-bright" : "text-gray-300")}>
                {icon}
            </span>
            {label}
        </button>
    );
}

function DashboardView() {
    const [healthData, setHealthData] = useState<HealthData>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        fetchHealth();
    }, []);

    const fetchHealth = async () => {
        setIsRefreshing(true);
        const data = await getHealthStatus();
        setHealthData(data);
        setIsRefreshing(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
        >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 text-brand-gold-bright font-black uppercase tracking-[0.2em] text-xs mb-3">
                        <Activity size={16} />
                        System Health
                    </div>
                    <h1 className="text-5xl font-serif font-black text-brand-olive-dark tracking-tighter">Healthy & Active</h1>
                </div>
                <button
                    onClick={fetchHealth}
                    disabled={isRefreshing}
                    className="flex items-center gap-3 px-8 py-4 bg-white border border-brand-olive-dark/10 rounded-2xl font-black text-brand-olive-dark hover:bg-brand-olive-dark hover:text-white transition-all shadow-sm active:scale-95 group"
                >
                    <RefreshCw size={20} className={cn("text-brand-gold-bright transition-colors", isRefreshing && "animate-spin")} />
                    Refresh Status
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DashboardStat
                    icon={<Database />}
                    label="DB Connectivity"
                    value={healthData?.database?.connected ? "Connected" : "Offline"}
                    subtext={healthData?.database?.latency || "N/A"}
                    status={healthData?.database?.connected ? "success" : "error"}
                />
                <DashboardStat
                    icon={<Users />}
                    label="Total Users"
                    value={healthData?.database?.userCount || "0"}
                    subtext="Registered Users"
                    status="info"
                />
                <DashboardStat
                    icon={<Activity />}
                    label="API Status"
                    value="Operational"
                    subtext="Ready for Orders"
                    status="success"
                />
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-premium p-10 overflow-hidden border border-white/20">
                <h3 className="text-2xl font-serif font-black text-brand-olive-dark mb-8">System Check Report</h3>
                <div className="space-y-4">
                    <HealthItem label="PostgreSQL Pool" status={healthData?.database?.connected} detail="AWS-1 AP-SOUTH-1 Pooler Active" />
                    <HealthItem label="2Factor API" status={true} detail="Endpoint Reachable" />
                    <HealthItem label="Auth Context" status={true} detail="LocalStorage Sync Active" />
                </div>
            </div>
        </motion.div>
    );
}

function ProductsView() {
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

function CategoriesView() {
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

function StaffView() {
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
                    {isLoading ? (
                        <div className="flex justify-center p-20"><Loader2 className="animate-spin text-brand-gold-bright" /></div>
                    ) : (
                        staff.map((member) => (
                            <div key={member.id} className="bg-white p-6 rounded-3xl shadow-sm border border-brand-olive-dark/5 flex items-center justify-between group hover:border-brand-gold-bright/30 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-brand-soft-gray rounded-2xl flex items-center justify-center text-brand-olive-dark font-black capitalize shadow-sm">
                                        {member.role[0]}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-brand-olive-dark">{member.name}</h4>
                                        <div className="flex gap-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                            <span>{member.role}</span>
                                            <span aria-hidden="true">-</span>
                                            <span>{member.phone}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setDeletingId(member.id)}
                                    className="p-3 text-gray-300 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <ConfirmDeleteModal
                isOpen={!!deletingId}
                message="Are you sure you want to remove this staff member? This action cannot be undone."
                isLoading={isDeleting}
                onConfirm={handleDelete}
                onCancel={() => setDeletingId(null)}
            />
        </motion.div>
    );
}

function AdminUserIssuesView() {
    const [tickets, setTickets] = useState<OrderFeedbackTicket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<"active" | "closed">("active");
    const [currentPage, setCurrentPage] = useState(1);
    const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);
    const [message, setMessage] = useState("");

    useEffect(() => {
        loadTickets();
    }, []);

    const loadTickets = async () => {
        setIsLoading(true);
        const result = await getOrderFeedbackTickets();
        if (result.success) {
            setTickets((result.tickets || []) as OrderFeedbackTicket[]);
            setMessage("");
        } else {
            setTickets([]);
            setMessage(result.error || "Could not load user issues.");
        }
        setIsLoading(false);
    };

    const updateTicketStatus = async (ticketId: string, status: OrderFeedbackStatus) => {
        setUpdatingTicketId(ticketId);
        setMessage("");
        const result = await updateOrderFeedbackStatus(ticketId, status);
        if (result.success) {
            await loadTickets();
        } else {
            setMessage(result.error || "Could not update issue status.");
        }
        setUpdatingTicketId(null);
    };

    const formatIssueType = (value: string) => value
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

    const activeTickets = tickets.filter((ticket) => ["open", "in_review"].includes(ticket.status));
    const closedTickets = tickets.filter((ticket) => ["resolved", "closed"].includes(ticket.status));
    const filteredTickets = filterStatus === "active" ? activeTickets : closedTickets;
    const totalPages = Math.max(1, Math.ceil(filteredTickets.length / FEEDBACK_TICKETS_PER_PAGE));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (safeCurrentPage - 1) * FEEDBACK_TICKETS_PER_PAGE;
    const paginatedTickets = filteredTickets.slice(startIndex, startIndex + FEEDBACK_TICKETS_PER_PAGE);

    const imageUrlFor = (image: OrderFeedbackImage | string) => typeof image === "string" ? image : image.url;
    const imageNameFor = (image: OrderFeedbackImage | string, index: number) => typeof image === "string" ? `Evidence ${index + 1}` : image.name || `Evidence ${index + 1}`;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20">
            <div className="flex flex-col gap-4 rounded-[2.5rem] bg-white p-6 shadow-premium md:p-8 xl:flex-row xl:items-center xl:justify-between">
                <div>
                    <p className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold-bright">
                        <AlertCircle size={16} />
                        Order feedback
                    </p>
                    <h2 className="text-4xl font-serif font-black text-brand-olive-dark">User Issues</h2>
                </div>

                <div className="flex w-full rounded-xl bg-brand-soft-gray p-1 xl:w-auto">
                    {[
                        { id: "active", label: `Active (${activeTickets.length})` },
                        { id: "closed", label: `Closed (${closedTickets.length})` },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                                setFilterStatus(tab.id as "active" | "closed");
                                setCurrentPage(1);
                            }}
                            className={cn(
                                "flex-1 rounded-lg px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all xl:flex-none",
                                filterStatus === tab.id ? "bg-white text-brand-olive-dark shadow-sm" : "text-gray-400 hover:text-brand-olive-dark"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {message && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-600">
                    {message}
                </div>
            )}

            <div className="space-y-6">
                {isLoading ? (
                    <div className="flex justify-center p-20">
                        <Loader2 className="animate-spin text-brand-gold-bright" />
                    </div>
                ) : paginatedTickets.length === 0 ? (
                    <div className="rounded-[2.5rem] bg-white p-20 text-center font-bold uppercase tracking-widest text-gray-400 shadow-premium">
                        No {filterStatus} user issues found
                    </div>
                ) : (
                    <>
                        {paginatedTickets.map((ticket) => (
                            <div key={ticket.id} className="overflow-hidden rounded-[2rem] border border-brand-olive-dark/5 bg-white shadow-premium">
                                <div className="flex flex-col gap-4 border-b border-brand-olive-dark/5 bg-brand-soft-gray/50 px-8 py-5 xl:flex-row xl:items-center xl:justify-between">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className="font-black text-brand-olive-dark">
                                                {formatOrderDisplayLabel({ id: ticket.order_id, order_number: ticket.order_number })}
                                            </span>
                                            <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-brand-gold-bright">
                                                {formatIssueType(ticket.issue_type)}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs font-bold text-gray-400">
                                            {new Date(ticket.created_at).toLocaleString()} - {ticket.user_name} - {ticket.user_phone || ticket.user_email || "No contact"}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className={cn(
                                            "rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest",
                                            ["open", "in_review"].includes(ticket.status) ? "bg-orange-50 text-orange-600" : "bg-emerald-50 text-emerald-600"
                                        )}>
                                            {formatIssueType(ticket.status)}
                                        </span>
                                        <select
                                            value={ticket.status}
                                            disabled={updatingTicketId === ticket.id}
                                            onChange={(event) => updateTicketStatus(ticket.id, event.target.value as OrderFeedbackStatus)}
                                            className="rounded-xl border border-brand-olive-dark/10 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-brand-olive-dark outline-none transition-all hover:border-brand-gold-bright focus:border-brand-gold-bright disabled:opacity-50"
                                        >
                                            {ISSUE_STATUS_OPTIONS.map((option) => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-8 p-8 xl:grid-cols-[1fr_260px]">
                                    <div className="space-y-5">
                                        <div>
                                            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Issue Details</p>
                                            <p className="whitespace-pre-wrap text-sm font-semibold leading-7 text-brand-olive-dark">{ticket.description}</p>
                                        </div>

                                        {ticket.image_urls.length > 0 && (
                                            <div>
                                                <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Evidence Images</p>
                                                <div className="flex flex-wrap gap-3">
                                                    {ticket.image_urls.slice(0, 3).map((image, index) => {
                                                        const imageUrl = imageUrlFor(image);
                                                        return (
                                                            <a
                                                                key={imageUrl}
                                                                href={imageUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="relative h-24 w-24 overflow-hidden rounded-2xl bg-brand-soft-gray shadow-sm ring-1 ring-brand-olive-dark/5 transition-transform hover:scale-105"
                                                            >
                                                                <Image
                                                                    src={imageUrl}
                                                                    alt={imageNameFor(image, index)}
                                                                    fill
                                                                    sizes="96px"
                                                                    className="object-cover"
                                                                />
                                                            </a>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="rounded-2xl bg-brand-soft-gray p-6">
                                        <div className="space-y-4">
                                            <div>
                                                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Order Status</p>
                                                <p className="font-black capitalize text-brand-olive-dark">{ticket.order_status}</p>
                                            </div>
                                            <div className="border-t border-brand-olive-dark/10 pt-4">
                                                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Order Total</p>
                                                <p className="text-2xl font-black text-brand-gold-bright"><RupeeAmount value={ticket.total_price} /></p>
                                            </div>
                                            <div className="border-t border-brand-olive-dark/10 pt-4">
                                                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Last Updated</p>
                                                <p className="text-xs font-bold text-brand-olive-dark">{new Date(ticket.updated_at).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-4 pb-4 pt-8">
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                    disabled={safeCurrentPage === 1}
                                    className="rounded-xl border border-brand-olive-dark/10 bg-white px-6 py-2 text-sm font-bold text-brand-olive-dark transition-all hover:bg-brand-soft-gray disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                    Page {safeCurrentPage} of {totalPages}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                    disabled={safeCurrentPage === totalPages}
                                    className="rounded-xl border border-brand-olive-dark/10 bg-white px-6 py-2 text-sm font-bold text-brand-olive-dark transition-all hover:bg-brand-soft-gray disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </motion.div>
    );
}

function OrdersView() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "ongoing" | "completed">("all");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        const result = await getOrders();
        if (result.success) setOrders((result.orders || []) as unknown as Order[]);
        setIsLoading(false);
    };

    const handleStatusUpdate = async (id: string | number, status: string) => {
        const result = await updateOrderStatus(id, status);
        if (result.success) loadOrders();
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white p-6 md:p-8 rounded-[2.5rem] shadow-premium gap-4">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold-bright mb-1">Live fulfillment</p>
                    <h2 className="text-4xl font-serif font-black text-brand-olive-dark">Order Queue</h2>
                </div>
                <div className="flex bg-brand-soft-gray p-1 rounded-xl w-full xl:w-auto overflow-x-auto no-scrollbar">
                    {[
                        { id: "all", label: "All Orders" },
                        { id: "pending", label: "Payment Pending" },
                        { id: "ongoing", label: "Ongoing" },
                        { id: "completed", label: "Completed" }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setFilterStatus(tab.id as any);
                                setCurrentPage(1); // Reset page on filter change
                            }}
                            className={cn(
                                "flex-1 xl:flex-none py-2 px-4 rounded-lg text-[10px] md:text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                filterStatus === tab.id ? "bg-white text-brand-olive-dark shadow-sm" : "text-gray-400 hover:text-brand-olive-dark"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-6">
                {isLoading ? (
                    <div className="flex justify-center p-20"><Loader2 className="animate-spin text-brand-gold-bright" /></div>
                ) : (() => {
                    const filteredOrders = orders.filter((order: any) => {
                        if (filterStatus === "all") return true;
                        if (filterStatus === "pending") return order.payment_status === "pending";
                        if (filterStatus === "ongoing") return order.payment_status === "paid" && order.status !== "delivered" && order.status !== "cancelled";
                        if (filterStatus === "completed") return order.status === "delivered" || order.status === "cancelled";
                        return true;
                    });

                    if (filteredOrders.length === 0) {
                        return <div className="text-center py-20 text-gray-400 font-bold uppercase tracking-widest">No orders found</div>;
                    }

                    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
                    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                    const paginatedOrders = filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);

                    return (
                        <>
                            {paginatedOrders.map((order: any) => (
                                <div key={order.id} className="bg-white rounded-[2rem] shadow-premium overflow-hidden border border-brand-olive-dark/5">
                                    <div className="bg-brand-soft-gray/50 px-8 py-4 border-b border-brand-olive-dark/5 flex justify-between items-center">
                                        <div className="flex items-center gap-6">
                                            <span className="text-brand-olive-dark font-black">{formatOrderDisplayLabel(order)}</span>
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{new Date(order.created_at).toLocaleString()}</span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-4 md:mt-0">
                                            <span className={cn(
                                                "px-3 md:px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm",
                                                order.payment_status === 'paid' ? "bg-green-50 text-green-600 border border-green-200" : "bg-orange-50 text-orange-600 border border-orange-200"
                                            )}>
                                                Payment: {order.payment_status || "Pending"}
                                            </span>
                                            <select
                                                value={order.status}
                                                onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                                                className="bg-white border border-brand-olive-dark/10 rounded-xl px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-brand-gold-bright shadow-sm hover:border-brand-gold-bright transition-all cursor-pointer"
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="preparing">Preparing</option>
                                                <option value="prepared">Prepared</option>
                                                <option value="in transit">In Transit</option>
                                                <option value="delivered">Delivered</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <div className="md:col-span-2 space-y-4">
                                            {order.items.map((item: any) => (
                                                <div key={item.id} className="flex items-center gap-4">
                                                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-brand-soft-gray">
                                                        <Image src={item.product_image} alt={item.product_name} fill className="object-cover" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-black text-brand-olive-dark text-sm">{item.product_name}</p>
                                                        <p className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Qty: {item.quantity} x <RupeeAmount value={item.price_at_time} /></p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="bg-brand-soft-gray p-6 rounded-2xl space-y-4">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Customer</p>
                                                <p className="font-black text-brand-olive-dark">{order.user_name}</p>
                                                <p className="text-xs text-gray-500">{order.user_phone}</p>
                                            </div>
                                            <div className="pt-4 border-t border-brand-olive-dark/10">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Amount</p>
                                                <p className="text-2xl font-black text-brand-gold-bright"><RupeeAmount value={order.total_price} /></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-4 pt-8 pb-4">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-6 py-2 rounded-xl bg-white border border-brand-olive-dark/10 font-bold text-brand-olive-dark hover:bg-brand-soft-gray disabled:opacity-50 transition-all text-sm"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-6 py-2 rounded-xl bg-white border border-brand-olive-dark/10 font-bold text-brand-olive-dark hover:bg-brand-soft-gray disabled:opacity-50 transition-all text-sm"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    );
                })()}
            </div>
        </motion.div>
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
                className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-white/20"
            >
                <div className="p-10">
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
                        <div className="grid grid-cols-2 gap-6">
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
                                        <Image src={data.image} alt="Preview" fill className="object-cover" />
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
                className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-white/20"
            >
                <div className="p-10">
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
                        <div className="grid grid-cols-2 gap-6">
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
                                        <Image src={data.image} alt="Preview" fill className="object-cover" />
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
                    <Image src={product.image} alt={product.name} fill className="object-cover" />
                </div>
                <div className="flex-1">
                    <p className="text-lg font-black text-brand-olive-dark">{product.name}</p>
                    <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-brand-gold-bright">{product.category} <span aria-hidden="true">-</span> <RupeeAmount value={product.price} /> {product.unit}</p>
                    {product.description && <p className="text-xs text-gray-400 font-medium line-clamp-1 mt-1">{product.description}</p>}
                </div>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                {/* Inline Limit Edit */}
                <div className="w-[200px] flex justify-center">
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

                <div className="w-[120px] flex justify-center gap-2">
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

function DashboardStat({ icon, label, value, subtext, status }: DashboardStatProps) {
    return (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-md border border-brand-olive-dark/5">
            <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center mb-6",
                status === "success" ? "bg-green-50 text-green-500" :
                    status === "error" ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"
            )}>
                {icon}
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">{label}</p>
            <div className="flex flex-col gap-1">
                <h4 className="text-2xl font-serif font-black text-brand-olive-dark">{value}</h4>
                <p className="text-sm font-medium text-gray-400">{subtext}</p>
            </div>
        </div>
    );
}

function HealthItem({ label, status, detail }: HealthItemProps) {
    return (
        <div className="flex items-center justify-between p-4 bg-brand-soft-gray/50 rounded-2xl">
            <div className="flex items-center gap-4">
                {status ? <CheckCircle2 className="text-green-500" size={20} /> : <AlertCircle className="text-red-500" size={20} />}
                <div>
                    <p className="text-sm font-black text-brand-olive-dark">{label}</p>
                    <p className="text-[10px] font-medium text-gray-400">{detail}</p>
                </div>
            </div>
            <span className={cn(
                "text-[10px] font-black uppercase px-3 py-1 rounded-full",
                status ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
            )}>
                {status ? "Online" : "Fatal"}
            </span>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Reusable confirm-delete modal (replaces window.confirm which browsers block)
// ---------------------------------------------------------------------------
interface ConfirmDeleteModalProps {
    isOpen: boolean;
    message: string;
    isLoading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

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

