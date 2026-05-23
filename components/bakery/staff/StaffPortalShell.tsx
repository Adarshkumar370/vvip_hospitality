"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowRight,
    CheckCircle2,
    ChefHat,
    ClipboardList,
    Clock,
    FileText,
    Loader2,
    LogOut,
    MapPin,
    Save,
    Package,
    Phone,
    Shield,
    Truck,
    User,
    Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RupeeAmount } from "@/components/ui/RupeeAmount";
import { getAddresses, getOrders, getProducts, getProductsForUser, getStaffSession, getUserBillingSummary, getUsers, logoutStaff, retryStaffInvoiceGeneration, staffLogin, staffPlaceOrder, updateOrderStatus, updateProductDailyLimitForStaff } from "@/app/bakery/actions";

type StaffRole = "baker" | "delivery" | "manager" | "accountant" | "admin";
type PortalKey = "baker" | "delivery-agent" | "manager" | "accountant" | "owner";
type StaffMember = {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: StaffRole;
};

type PortalConfig = {
    key: PortalKey;
    label: string;
    route: string;
    shortDescription: string;
    allowedRoles: StaffRole[];
};

type OrderItem = {
    id: string | number;
    product_name: string;
    product_image: string;
    quantity: number;
};

type OrderRecord = {
    id: number;
    order_number?: string;
    created_at: string;
    total_price?: number;
    payment_status: string;
    payment_received_at?: string | null;
    invoice_number?: string | null;
    invoice_pdf_url?: string | null;
    status: string;
    acknowledged_by?: string | null;
    user_name?: string;
    user_phone: string;
    address_line1?: string;
    city?: string;
    pincode?: string;
    items: OrderItem[];
};

type ProductRecord = {
    id: string;
    name: string;
    category: string;
    unit: string;
    price: number;
    image?: string;
    max_daily_limit: number;
};

type UserRecord = {
    id: string;
    name: string;
    email: string;
    phone: string;
    payment_type?: "prepaid_user" | "postpaid_user";
};

type AddressRecord = {
    id: string;
    receiver_name: string;
    receiver_phone: string;
    address_line1: string;
    address_line2?: string | null;
    city: string;
    pincode: string;
    is_default?: boolean;
};

type BillingSummaryRecord = {
    isPostpaid: boolean;
    creditLimit: number;
    pendingAmount: number;
    availableCredit: number;
};

const ORDERS_PER_PAGE = 50;
const ACCOUNTANT_FILTER_DAYS = [1, 7, 30] as const;

function isOperationallyClearedPayment(status: string) {
    return status === "paid" || status === "postpaid-pending";
}

function getDisplayOrderNumber(order: OrderRecord) {
    if (order.order_number) {
        const match = order.order_number.match(/(\d+)$/);
        if (match) {
            return String(Number(match[1]));
        }
        return order.order_number;
    }

    return String(order.id);
}

function isWithinLastDays(dateValue: string | null | undefined, days: number) {
    if (!dateValue) return false;
    const date = new Date(dateValue);
    const now = new Date();
    const threshold = new Date(now);
    threshold.setHours(0, 0, 0, 0);
    threshold.setDate(threshold.getDate() - (days - 1));
    return date >= threshold && date <= now;
}

const PORTALS: PortalConfig[] = [
    {
        key: "baker",
        label: "Baker",
        route: "/bakery/staff/baker",
        shortDescription: "Accept baking tasks and mark orders prepared.",
        allowedRoles: ["baker"],
    },
    {
        key: "delivery-agent",
        label: "Delivery Agent",
        route: "/bakery/staff/delivery-agent",
        shortDescription: "Pick up prepared orders and close deliveries.",
        allowedRoles: ["delivery"],
    },
    {
        key: "manager",
        label: "Manager",
        route: "/bakery/staff/manager",
        shortDescription: "Monitor paid orders and operational flow.",
        allowedRoles: ["manager"],
    },
    {
        key: "accountant",
        label: "Accountant",
        route: "/bakery/staff/accountant",
        shortDescription: "Review paid orders with audit-style visibility.",
        allowedRoles: ["accountant"],
    },
    {
        key: "owner",
        label: "Owner",
        route: "/bakery/staff/owner",
        shortDescription: "Access the owner queue and admin controls.",
        allowedRoles: ["admin"],
    },
];

function getPortalForRole(role: StaffRole) {
    return PORTALS.find((portal) => portal.allowedRoles.includes(role)) ?? PORTALS[0];
}

function getRoleLabel(role: StaffRole) {
    switch (role) {
        case "delivery":
            return "Delivery Agent";
        case "admin":
            return "Owner";
        default:
            return role.charAt(0).toUpperCase() + role.slice(1);
    }
}

export function StaffLoginGateway() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const checkSession = async () => {
            const staff = await getStaffSession();
            if (staff?.role) {
                router.replace(getPortalForRole(staff.role as StaffRole).route);
                return;
            }
            setIsCheckingSession(false);
        };

        checkSession();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const result = await staffLogin(email, password);
            if (!result.success) {
                setError(result.error || "Login failed");
                return;
            }

            const portal = getPortalForRole(result.staff.role as StaffRole);
            router.replace(portal.route);
        } catch {
            setError("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    if (isCheckingSession) {
        return (
            <div className="min-h-screen bg-brand-olive-dark flex items-center justify-center">
                <Loader2 className="animate-spin text-brand-gold-bright" size={42} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-olive-dark px-6 py-12">
            <div className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                <section className="rounded-[2.5rem] bg-white/8 p-8 text-white backdrop-blur-sm lg:p-12">
                    <div className="mb-10 flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gold-bright text-brand-olive-dark shadow-lg">
                            <ChefHat size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold-bright">Swiss Affaire</p>
                            <h1 className="text-3xl font-serif font-black">Staff Access</h1>
                        </div>
                    </div>

                    <p className="max-w-xl text-sm font-medium leading-7 text-white/75">
                        Sign in once at <span className="font-black text-white">/bakery/staff</span>. Each role is sent to its own workspace after authentication.
                    </p>

                    <div className="mt-10 grid gap-4 md:grid-cols-2">
                        {PORTALS.map((portal) => (
                            <div key={portal.key} className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
                                <div className="mb-3 flex items-center justify-between">
                                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">{portal.label}</h2>
                                    <ArrowRight size={16} className="text-brand-gold-bright" />
                                </div>
                                <p className="text-sm leading-6 text-white/65">{portal.shortDescription}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="flex items-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="w-full rounded-[2.5rem] bg-white p-10 shadow-2xl lg:p-12"
                    >
                        <div className="mb-10 text-center">
                            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-brand-soft-gray text-brand-olive-dark">
                                <User size={38} />
                            </div>
                            <h2 className="text-3xl font-serif font-black text-brand-olive-dark">Team Login</h2>
                            <p className="mt-2 text-[11px] font-black uppercase tracking-[0.28em] text-gray-400">Role-based staff portals</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="pl-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Staff Email</label>
                                <input
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full rounded-2xl border-2 border-transparent bg-brand-soft-gray px-8 py-5 text-sm font-bold text-brand-olive-dark outline-none transition-all focus:border-brand-gold-bright/30"
                                    placeholder="staff@vvip.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="pl-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Access Code</label>
                                <input
                                    required
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-2xl border-2 border-transparent bg-brand-soft-gray px-8 py-5 text-sm font-bold text-brand-olive-dark outline-none transition-all focus:border-brand-gold-bright/30"
                                    placeholder="••••••••"
                                />
                            </div>

                            {error ? (
                                <p className="rounded-xl bg-red-50 py-3 text-center text-[10px] font-black uppercase tracking-widest text-red-500">{error}</p>
                            ) : null}

                            <button
                                disabled={isLoading}
                                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-brand-olive-dark py-5 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all hover:bg-brand-gold-bright disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Enter Workspace"}
                            </button>
                        </form>
                    </motion.div>
                </section>
            </div>
        </div>
    );
}

export function StaffRolePortal({ portalKey }: { portalKey: PortalKey }) {
    const router = useRouter();
    const portal = useMemo(
        () => PORTALS.find((item) => item.key === portalKey) ?? PORTALS[0],
        [portalKey]
    );
    const [staff, setStaff] = useState<StaffMember | null>(null);
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [activeSection, setActiveSection] = useState<"orders" | "limits" | "create">("orders");

    useEffect(() => {
        const checkSession = async () => {
            const sessionStaff = await getStaffSession();
            if (!sessionStaff?.role) {
                router.replace("/bakery/staff");
                return;
            }

            const staffRole = sessionStaff.role as StaffRole;
            if (!portal.allowedRoles.includes(staffRole)) {
                router.replace(getPortalForRole(staffRole).route);
                return;
            }

            setStaff(sessionStaff as StaffMember);
            setIsCheckingSession(false);
        };

        checkSession();
    }, [portal.allowedRoles, router]);

    const handleLogout = async () => {
        const result = await logoutStaff();
        if (result.success) {
            router.replace("/bakery/staff");
        }
    };

    if (isCheckingSession || !staff) {
        return (
            <div className="min-h-screen bg-brand-soft-gray flex items-center justify-center">
                <Loader2 className="animate-spin text-brand-gold-bright" size={42} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-soft-gray flex">
            <aside className="sticky top-0 flex h-screen w-72 flex-col border-r border-brand-olive-dark/5 bg-white shadow-premium">
                <div className="p-8">
                    <div className="mb-10 flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-olive-dark text-brand-gold-bright shadow-lg">
                            {portal.key === "delivery-agent" ? <Truck size={24} /> : portal.key === "accountant" ? <Wallet size={24} /> : portal.key === "owner" ? <Shield size={24} /> : <ChefHat size={24} />}
                        </div>
                        <div>
                            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold-bright">VVIP Staff</p>
                            <h2 className="text-xl font-serif font-black leading-none text-brand-olive-dark">{portal.label} Portal</h2>
                        </div>
                    </div>

                    <div className="mb-8 rounded-2xl bg-brand-soft-gray/50 p-4">
                        <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Logged in as</p>
                        <p className="truncate font-black text-brand-olive-dark">{staff.name}</p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-brand-gold-bright">{getRoleLabel(staff.role)}</p>
                    </div>

                    <nav className="flex flex-col gap-2">
                        {PORTALS.map((item) => {
                            const isActive = item.key === portal.key;
                            const canAccess = item.allowedRoles.includes(staff.role);

                            return canAccess ? (
                                <Link
                                    key={item.key}
                                    href={item.route}
                                    className={cn(
                                        "flex items-center gap-3 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-widest transition-all",
                                        isActive
                                            ? "bg-brand-olive-dark text-brand-gold-bright"
                                            : "text-gray-400 hover:bg-brand-soft-gray hover:text-brand-olive-dark"
                                    )}
                                >
                                    <ClipboardList size={18} />
                                    {item.label}
                                </Link>
                            ) : null;
                        })}

                        {(staff.role === "manager" || staff.role === "admin") ? (
                            <>
                                <button
                                    onClick={() => setActiveSection("orders")}
                                    className={cn(
                                        "flex items-center gap-3 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-widest transition-all",
                                        activeSection === "orders"
                                            ? "bg-brand-olive-dark text-brand-gold-bright"
                                            : "text-gray-400 hover:bg-brand-soft-gray hover:text-brand-olive-dark"
                                    )}
                                >
                                    <ClipboardList size={18} />
                                    Order Queue
                                </button>
                                <button
                                    onClick={() => setActiveSection("limits")}
                                    className={cn(
                                        "flex items-center gap-3 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-widest transition-all",
                                        activeSection === "limits"
                                            ? "bg-brand-olive-dark text-brand-gold-bright"
                                            : "text-gray-400 hover:bg-brand-soft-gray hover:text-brand-olive-dark"
                                    )}
                                >
                                    <Save size={18} />
                                    Daily Product Limits
                                </button>
                            </>
                        ) : null}

                        {["admin", "manager", "accountant"].includes(staff.role) ? (
                            <button
                                onClick={() => setActiveSection("create")}
                                className={cn(
                                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-widest transition-all",
                                    activeSection === "create"
                                        ? "bg-brand-olive-dark text-brand-gold-bright"
                                        : "text-gray-400 hover:bg-brand-soft-gray hover:text-brand-olive-dark"
                                )}
                            >
                                <Package size={18} />
                                Place Order
                            </button>
                        ) : null}

                        {staff.role === "admin" ? (
                            <a
                                href="/bakery/admin"
                                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-400 transition-all hover:bg-brand-soft-gray hover:text-brand-olive-dark"
                            >
                                <Shield size={18} />
                                Admin Panel
                            </a>
                        ) : null}
                    </nav>
                </div>

                <div className="mt-auto border-t border-brand-olive-dark/5 p-8">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-6 py-4 text-xs font-black uppercase tracking-widest text-red-500 shadow-sm transition-all hover:bg-red-500 hover:text-white"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto p-8 lg:p-12">
                <div className="mx-auto max-w-5xl">
                    <StaffDashboard
                        staff={staff}
                        portalLabel={portal.label}
                        activeSection={activeSection}
                    />
                </div>
            </main>
        </div>
    );
}

function StaffDashboard({
    staff,
    portalLabel,
    activeSection,
}: {
    staff: StaffMember;
    portalLabel: string;
    activeSection: "orders" | "limits" | "create";
}) {
    const [orders, setOrders] = useState<OrderRecord[]>([]);
    const [products, setProducts] = useState<ProductRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [activeTab, setActiveTab] = useState<"pending" | "active" | "completed">("pending");
    const [currentPage, setCurrentPage] = useState(1);
    const [accountantFilterDays, setAccountantFilterDays] = useState<1 | 7 | 30>(1);
    const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [activeOrderActionId, setActiveOrderActionId] = useState<string | null>(null);
    const [productLimitDrafts, setProductLimitDrafts] = useState<Record<string, number>>({});
    const [activeProductLimitId, setActiveProductLimitId] = useState<string | null>(null);

    const loadOrders = async () => {
        const result = await getOrders();
        if (result.success) {
            setOrders((result.orders || []) as OrderRecord[]);
            setIsLoading(false);
            return { success: true as const };
        }
        setIsLoading(false);
        return { success: false as const, error: result.error || "Failed to load orders." };
    };

    const loadProducts = async () => {
        const result = await getProducts();
        if (result.success) {
            const list = (result.products || []) as ProductRecord[];
            setProducts(list);
            setProductLimitDrafts(
                Object.fromEntries(list.map((product) => [product.id, Number(product.max_daily_limit || 0)]))
            );
        }
        setIsLoadingProducts(false);
    };

    const runOrderAction = async (
        orderId: string,
        action: () => Promise<{ success: boolean; error?: string }>,
        successMessage: string
    ) => {
        setActiveOrderActionId(orderId);
        setActionMessage(null);

        try {
            const result = await action();
            if (!result.success) {
                setActionMessage({ type: "error", text: result.error || "Order update failed." });
                return;
            }

            const refresh = await loadOrders();
            if (!refresh.success) {
                setActionMessage({ type: "error", text: refresh.error || "Order updated, but refresh failed." });
                return;
            }

            setActionMessage({ type: "success", text: successMessage });
        } finally {
            setActiveOrderActionId(null);
        }
    };

    useEffect(() => {
        const initialLoad = setTimeout(() => {
            void loadOrders();
        }, 0);
        const interval = setInterval(loadOrders, 30000);
        return () => {
            clearTimeout(initialLoad);
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        if (staff.role === "manager" || staff.role === "admin") {
            void loadProducts();
        }
    }, [staff.role]);

    const handleAcknowledge = async (orderId: string) => {
        await runOrderAction(
            orderId,
            () => updateOrderStatus(orderId, "preparing", staff.id),
            "Order acknowledged and moved to active work."
        );
    };

    const handleComplete = async (orderId: string) => {
        await runOrderAction(
            orderId,
            () => updateOrderStatus(orderId, "prepared", staff.id),
            "Order marked as prepared."
        );
    };

    const handleTransit = async (orderId: string) => {
        await runOrderAction(
            orderId,
            () => updateOrderStatus(orderId, "in transit", staff.id),
            "Order moved to delivery."
        );
    };

    const handleDeliver = async (orderId: string) => {
        await runOrderAction(
            orderId,
            () => updateOrderStatus(orderId, "delivered", staff.id),
            "Order marked as delivered."
        );
    };

    const handleGenerateInvoice = async (orderId: string) => {
        await runOrderAction(
            orderId,
            () => retryStaffInvoiceGeneration(orderId),
            "Invoice generated successfully."
        );
    };

    const handleProductLimitSave = async (productId: string) => {
        const limit = Number(productLimitDrafts[productId] ?? 0);
        setActiveProductLimitId(productId);
        setActionMessage(null);

        try {
            const result = await updateProductDailyLimitForStaff(productId, limit);
            if (!result.success) {
                setActionMessage({ type: "error", text: result.error || "Failed to update daily limit." });
                return;
            }

            await loadProducts();
            setActionMessage({ type: "success", text: "Daily limit updated." });
        } finally {
            setActiveProductLimitId(null);
        }
    };

    const accountantOrders = useMemo(
        () => orders.filter((order) => order.payment_status === "paid" && isWithinLastDays(order.payment_received_at, accountantFilterDays)),
        [orders, accountantFilterDays]
    );

    const tabbedOrders = useMemo(() => {
        const clearedOrders = orders.filter((order) => isOperationallyClearedPayment(order.payment_status));

        if (staff.role === "admin" || staff.role === "manager" || staff.role === "accountant") {
            return {
                pending: staff.role === "accountant" ? accountantOrders : clearedOrders,
                active: [],
                completed: [],
            };
        }

        if (staff.role === "baker") {
            return {
                pending: clearedOrders.filter((order) => order.status === "pending"),
                active: clearedOrders.filter((order) => order.status === "preparing" && order.acknowledged_by === staff.id),
                completed: clearedOrders.filter((order) => order.status === "prepared" && order.acknowledged_by === staff.id),
            };
        }

        if (staff.role === "delivery") {
            return {
                pending: clearedOrders.filter((order) => order.status === "prepared"),
                active: clearedOrders.filter((order) => order.status === "in transit" && order.acknowledged_by === staff.id),
                completed: clearedOrders.filter((order) => order.status === "delivered" && order.acknowledged_by === staff.id),
            };
        }

        return { pending: [], active: [], completed: [] };
    }, [accountantOrders, orders, staff.id, staff.role]);

    const filteredOrders = tabbedOrders[activeTab];
    const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));
    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * ORDERS_PER_PAGE,
        currentPage * ORDERS_PER_PAGE
    );
    const stats = {
        pending: tabbedOrders.pending.length,
        active: tabbedOrders.active.length,
        completed: tabbedOrders.completed.length,
    };
    const isReadOnly = staff.role === "accountant";
    const hasTabs = !["accountant", "admin", "manager"].includes(staff.role);
    const filteredCollection = staff.role === "accountant"
        ? accountantOrders.reduce((sum, order) => sum + Number(order.total_price || 0), 0)
        : 0;
    const filteredInvoices = staff.role === "accountant"
        ? accountantOrders.filter((order) => order.invoice_number).length
        : 0;

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, staff.role]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    return (
        <div className="space-y-10">
            <div className="flex items-end justify-between gap-6">
                <div>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold-bright">{portalLabel}</p>
                    <h1 className="text-4xl font-serif font-black tracking-tight text-brand-olive-dark">Order Workspace</h1>
                </div>
                <div className="rounded-2xl bg-white px-5 py-4 shadow-premium">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Session Role</p>
                    <p className="text-sm font-black text-brand-olive-dark">{getRoleLabel(staff.role)}</p>
                </div>
            </div>

            {actionMessage ? (
                <div
                    className={cn(
                        "rounded-2xl px-6 py-4 text-sm font-bold shadow-sm",
                        actionMessage.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                    )}
                >
                    {actionMessage.text}
                </div>
            ) : null}

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="flex items-center gap-6 rounded-[2.5rem] border border-white bg-white p-8 shadow-premium">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-brand-soft-gray text-brand-gold-bright">
                        <Clock size={32} />
                    </div>
                    <div>
                        <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Your Active Load</p>
                        <h3 className="text-4xl font-serif font-black text-brand-olive-dark">{stats.active} Tasks</h3>
                    </div>
                </div>

                <div className="flex items-center gap-6 rounded-[2.5rem] bg-brand-olive-dark p-8 shadow-premium">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-white/10 text-brand-gold-bright">
                        <ClipboardList size={32} />
                    </div>
                    <div>
                        <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-white/50">
                            {staff.role === "accountant" ? "Total Paid Orders" : "Available to Acknowledge"}
                        </p>
                        <h3 className="text-4xl font-serif font-black text-white">
                            {staff.role === "accountant" || staff.role === "admin" || staff.role === "manager"
                                ? orders.filter((order) => isOperationallyClearedPayment(order.payment_status)).length
                                : stats.pending}
                            {staff.role === "baker" || staff.role === "delivery" ? " New" : ""}
                        </h3>
                    </div>
                </div>
            </div>

            {staff.role === "accountant" ? (
                <div className="space-y-8">
                    <div className="flex w-fit gap-2 rounded-3xl bg-brand-soft-gray/50 p-2">
                        {ACCOUNTANT_FILTER_DAYS.map((days) => (
                            <button
                                key={days}
                                onClick={() => setAccountantFilterDays(days)}
                                className={cn(
                                    "rounded-2xl px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all",
                                    accountantFilterDays === days
                                        ? "bg-brand-olive-dark text-white shadow-lg"
                                        : "text-gray-400 hover:text-brand-olive-dark"
                                )}
                            >
                                Last {days} Day{days > 1 ? "s" : ""}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                        <div className="rounded-[2.5rem] bg-white p-8 shadow-premium">
                            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Collection In Range</p>
                            <h3 className="text-4xl font-serif font-black text-brand-olive-dark">
                                <RupeeAmount value={filteredCollection.toFixed(2)} />
                            </h3>
                        </div>
                        <div className="rounded-[2.5rem] bg-white p-8 shadow-premium">
                            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Invoices In Range</p>
                            <h3 className="text-4xl font-serif font-black text-brand-olive-dark">{filteredInvoices}</h3>
                        </div>
                    </div>
                </div>
            ) : null}

            {(staff.role === "manager" || staff.role === "admin") && activeSection === "limits" ? (
                <div className="rounded-[2.5rem] bg-white p-8 shadow-premium">
                    <div className="mb-6 flex items-center justify-between gap-4">
                        <div>
                            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold-bright">Inventory Controls</p>
                            <h3 className="text-2xl font-serif font-black text-brand-olive-dark">Daily Product Limits</h3>
                        </div>
                    </div>

                    {isLoadingProducts ? (
                        <div className="flex justify-center py-16">
                            <Loader2 className="animate-spin text-brand-gold-bright" size={32} />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {products.map((product) => {
                                const draftLimit = productLimitDrafts[product.id] ?? 0;
                                const isSaving = activeProductLimitId === product.id;
                                const hasChanged = draftLimit !== Number(product.max_daily_limit || 0);

                                return (
                                    <div key={product.id} className="grid gap-4 rounded-[2rem] bg-brand-soft-gray/50 p-5 md:grid-cols-[1.4fr_0.8fr_auto] md:items-center">
                                        <div>
                                            <p className="text-sm font-black text-brand-olive-dark">{product.name}</p>
                                            <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                {product.category} · {product.unit}
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="pl-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Daily Limit</label>
                                            <input
                                                type="number"
                                                min={0}
                                                value={draftLimit}
                                                onChange={(e) =>
                                                    setProductLimitDrafts((current) => ({
                                                        ...current,
                                                        [product.id]: parseInt(e.target.value, 10) || 0,
                                                    }))
                                                }
                                                className="w-full rounded-2xl border-2 border-transparent bg-white px-5 py-4 text-sm font-bold text-brand-olive-dark outline-none transition-all focus:border-brand-gold-bright/30"
                                            />
                                        </div>

                                        <button
                                            onClick={() => handleProductLimitSave(product.id)}
                                            disabled={!hasChanged || isSaving}
                                            className="flex items-center justify-center gap-2 rounded-2xl bg-brand-olive-dark px-5 py-4 text-xs font-black uppercase tracking-widest text-white shadow-sm transition-all hover:bg-brand-gold-bright disabled:opacity-50"
                                        >
                                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                            Save
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : null}

            {["admin", "manager", "accountant"].includes(staff.role) && activeSection === "create" ? (
                <StaffCreateOrderPanel
                    onOrderPlaced={async () => {
                        const refresh = await loadOrders();
                        if (!refresh.success) {
                            setActionMessage({ type: "error", text: refresh.error || "Order placed, but refresh failed." });
                        }
                    }}
                />
            ) : null}

            {hasTabs && activeSection === "orders" ? (
                <div className="flex w-fit gap-2 rounded-3xl bg-brand-soft-gray/50 p-2">
                    {[
                        { id: "pending", label: `Pending Queue (${stats.pending})` },
                        { id: "active", label: `Active Work (${stats.active})` },
                        { id: "completed", label: `Completed (${stats.completed})` },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as "pending" | "active" | "completed")}
                            className={cn(
                                "rounded-2xl px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all",
                                activeTab === tab.id
                                    ? "bg-brand-olive-dark text-white shadow-lg"
                                    : "text-gray-400 hover:text-brand-olive-dark"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            ) : null}

            {activeSection === "orders" ? (
                <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <div className="h-[2px] flex-1 bg-brand-olive-dark/10" />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-olive-dark/40">
                        {staff.role === "accountant"
                            ? "Order Details & Audit"
                            : activeTab === "pending"
                                ? "Work Queue"
                                : activeTab === "active"
                                    ? "My Active Tasks"
                                    : "My Historical Load"}
                    </h4>
                    <div className="h-[2px] flex-1 bg-brand-olive-dark/10" />
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-20">
                        <Loader2 className="animate-spin text-brand-gold-bright" size={40} />
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="rounded-[3rem] border-4 border-dashed border-brand-soft-gray bg-white py-32 text-center">
                        <Package className="mx-auto mb-6 text-brand-soft-gray" size={60} />
                        <p className="text-sm font-bold uppercase tracking-widest text-gray-400">
                            {activeTab === "pending"
                                ? "No new orders available"
                                : activeTab === "active"
                                    ? "No active tasks assigned"
                                    : "No completed orders in this session"}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-8 pb-20 lg:grid-cols-2">
                        <AnimatePresence mode="popLayout">
                            {paginatedOrders.map((order) => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    staff={staff}
                                    isReadOnly={isReadOnly}
                                    isMutating={activeOrderActionId === String(order.id)}
                                    onAcknowledge={() => handleAcknowledge(String(order.id))}
                                    onComplete={() => handleComplete(String(order.id))}
                                    onTransit={() => handleTransit(String(order.id))}
                                    onDeliver={() => handleDeliver(String(order.id))}
                                    onGenerateInvoice={() => handleGenerateInvoice(String(order.id))}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {filteredOrders.length > ORDERS_PER_PAGE ? (
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                        {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={cn(
                                    "min-w-10 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest transition-all",
                                    currentPage === page
                                        ? "bg-brand-olive-dark text-white shadow-lg"
                                        : "bg-white text-brand-olive-dark hover:bg-brand-soft-gray"
                                )}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                ) : null}
                </div>
            ) : null}
        </div>
    );
}

function StaffCreateOrderPanel({ onOrderPlaced }: { onOrderPlaced: () => Promise<void> }) {
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [products, setProducts] = useState<ProductRecord[]>([]);
    const [addresses, setAddresses] = useState<AddressRecord[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
    const [selectedAddressId, setSelectedAddressId] = useState("");
    const [paymentMode, setPaymentMode] = useState<"prepaid" | "postpaid">("prepaid");
    const [billingSummary, setBillingSummary] = useState<BillingSummaryRecord | null>(null);
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [isLoadingSelection, setIsLoadingSelection] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        const loadUsers = async () => {
            const result = await getUsers();
            if (result.success) {
                setUsers((result.users || []) as UserRecord[]);
            } else {
                setMessage({ type: "error", text: result.error || "Failed to load users." });
            }
            setIsLoadingUsers(false);
        };

        void loadUsers();
    }, []);

    const filteredUsers = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return users;
        return users.filter((user) =>
            [user.name, user.phone, user.email]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(term))
        );
    }, [searchTerm, users]);

    const selectedItems = useMemo(
        () => products
            .map((product) => ({
                product,
                quantity: Number(quantities[product.id] || 0),
            }))
            .filter((item) => item.quantity > 0),
        [products, quantities]
    );

    const orderTotal = selectedItems.reduce(
        (sum, item) => sum + Number(item.product.price || 0) * item.quantity,
        0
    );

    const handleUserSelect = async (user: UserRecord) => {
        setSelectedUser(user);
        setSelectedAddressId("");
        setProducts([]);
        setAddresses([]);
        setQuantities({});
        setBillingSummary(null);
        setMessage(null);
        setPaymentMode(user.payment_type === "postpaid_user" ? "postpaid" : "prepaid");
        setIsLoadingSelection(true);

        const [addressResult, productResult, billingResult] = await Promise.all([
            getAddresses(user.id),
            getProductsForUser(user.id),
            getUserBillingSummary(user.id),
        ]);

        if (addressResult.success) {
            const addressList = (addressResult.addresses || []) as AddressRecord[];
            setAddresses(addressList);
            const defaultAddress = addressList.find((address) => address.is_default) || addressList[0];
            if (defaultAddress) setSelectedAddressId(String(defaultAddress.id));
        } else {
            setMessage({ type: "error", text: addressResult.error || "Failed to load addresses." });
        }

        if (productResult.success) {
            setProducts((productResult.products || []) as ProductRecord[]);
        } else {
            setMessage({ type: "error", text: productResult.error || "Failed to load products." });
        }

        if (billingResult.success) {
            setBillingSummary(billingResult.summary as BillingSummaryRecord);
        }

        setIsLoadingSelection(false);
    };

    const handleQuantityChange = (productId: string, rawValue: string) => {
        const value = Math.max(0, Math.floor(Number(rawValue) || 0));
        setQuantities((current) => ({
            ...current,
            [productId]: value,
        }));
    };

    const handleSubmit = async () => {
        if (!selectedUser || !selectedAddressId || selectedItems.length === 0) return;

        if (
            paymentMode === "postpaid" &&
            billingSummary?.isPostpaid &&
            orderTotal > Number(billingSummary.availableCredit || 0)
        ) {
            const shouldContinue = window.confirm(
                `This postpaid order exceeds the available budget by INR ${(orderTotal - Number(billingSummary.availableCredit || 0)).toFixed(2)}. Continue with manual entry?`
            );
            if (!shouldContinue) return;
        }

        setIsSubmitting(true);
        setMessage(null);

        try {
            const result = await staffPlaceOrder(
                selectedUser.id,
                selectedItems.map((item) => ({ id: item.product.id, quantity: item.quantity })),
                selectedAddressId,
                paymentMode
            );

            if (!result.success) {
                setMessage({ type: "error", text: ("error" in result ? result.error : null) || "Failed to place order." });
                return;
            }

            setQuantities({});
            setMessage({ type: "success", text: `Order placed successfully. Total INR ${Number("total" in result ? result.total : orderTotal).toFixed(2)}.` });
            await onOrderPlaced();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="rounded-[2.5rem] bg-white p-8 shadow-premium">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="mb-1 text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold-bright">Staff Ordering</p>
                    <h3 className="text-2xl font-serif font-black text-brand-olive-dark">Place Order For User</h3>
                </div>
                <div className="rounded-2xl bg-brand-soft-gray px-5 py-4 text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order Total</p>
                    <RupeeAmount className="text-xl font-black text-brand-olive-dark" value={orderTotal.toFixed(2)} />
                </div>
            </div>

            {message ? (
                <div
                    className={cn(
                        "mb-6 rounded-2xl px-5 py-4 text-sm font-bold",
                        message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                    )}
                >
                    {message.text}
                </div>
            ) : null}

            <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
                <section className="space-y-5">
                    <div>
                        <label className="mb-2 block pl-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Find User</label>
                        <input
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Search name, phone, or email"
                            className="w-full rounded-2xl border-2 border-transparent bg-brand-soft-gray px-5 py-4 text-sm font-bold text-brand-olive-dark outline-none transition-all focus:border-brand-gold-bright/30"
                        />
                    </div>

                    <div className="max-h-[420px] space-y-3 overflow-y-auto pr-2">
                        {isLoadingUsers ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="animate-spin text-brand-gold-bright" size={28} />
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="rounded-2xl bg-brand-soft-gray p-6 text-center text-xs font-black uppercase tracking-widest text-gray-400">
                                No users found
                            </div>
                        ) : (
                            filteredUsers.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => handleUserSelect(user)}
                                    className={cn(
                                        "w-full rounded-2xl border p-4 text-left transition-all",
                                        selectedUser?.id === user.id
                                            ? "border-brand-olive-dark bg-brand-olive-dark text-white shadow-lg"
                                            : "border-transparent bg-brand-soft-gray/60 text-brand-olive-dark hover:border-brand-gold-bright/30"
                                    )}
                                >
                                    <p className="truncate text-sm font-black">{user.name}</p>
                                    <p className={cn("mt-1 truncate text-[10px] font-bold uppercase tracking-widest", selectedUser?.id === user.id ? "text-brand-gold-bright" : "text-gray-400")}>
                                        {user.phone || user.email}
                                    </p>
                                </button>
                            ))
                        )}
                    </div>
                </section>

                <section className="space-y-6">
                    {!selectedUser ? (
                        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[2rem] border-4 border-dashed border-brand-soft-gray text-center">
                            <User className="mb-4 text-brand-soft-gray" size={54} />
                            <p className="text-sm font-black uppercase tracking-widest text-gray-400">Select a user to build an order</p>
                        </div>
                    ) : isLoadingSelection ? (
                        <div className="flex min-h-[420px] items-center justify-center">
                            <Loader2 className="animate-spin text-brand-gold-bright" size={36} />
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block pl-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Delivery Address</label>
                                    <select
                                        value={selectedAddressId}
                                        onChange={(event) => setSelectedAddressId(event.target.value)}
                                        className="w-full rounded-2xl border-2 border-transparent bg-brand-soft-gray px-5 py-4 text-sm font-bold text-brand-olive-dark outline-none transition-all focus:border-brand-gold-bright/30"
                                    >
                                        {addresses.length === 0 ? (
                                            <option value="">No saved address</option>
                                        ) : (
                                            addresses.map((address) => (
                                                <option key={address.id} value={address.id}>
                                                    {address.address_line1}, {address.city} - {address.pincode}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block pl-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Payment</label>
                                    <select
                                        value={paymentMode}
                                        onChange={(event) => setPaymentMode(event.target.value as "prepaid" | "postpaid")}
                                        className="w-full rounded-2xl border-2 border-transparent bg-brand-soft-gray px-5 py-4 text-sm font-bold text-brand-olive-dark outline-none transition-all focus:border-brand-gold-bright/30"
                                    >
                                        <option value="prepaid">Cash collected by staff</option>
                                        {selectedUser.payment_type === "postpaid_user" ? (
                                            <option value="postpaid">Add to postpaid billing</option>
                                        ) : null}
                                    </select>
                                </div>
                            </div>

                            {paymentMode === "postpaid" && billingSummary?.isPostpaid ? (
                                <div
                                    className={cn(
                                        "rounded-2xl border px-5 py-4 text-sm font-bold",
                                        orderTotal > Number(billingSummary.availableCredit || 0)
                                            ? "border-amber-300 bg-amber-50 text-amber-700"
                                            : "border-green-200 bg-green-50 text-green-700"
                                    )}
                                >
                                    Available budget INR {Number(billingSummary.availableCredit || 0).toFixed(2)}. This order will be marked postpaid pending and counted against the user's budget.
                                </div>
                            ) : null}

                            <div className="max-h-[520px] space-y-3 overflow-y-auto pr-2">
                                {products.map((product) => (
                                    <div key={product.id} className="grid gap-4 rounded-[2rem] bg-brand-soft-gray/50 p-4 md:grid-cols-[1fr_8rem] md:items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-white shadow-sm">
                                                <Image src={product.image || "/images/bakery/sourdough.png"} alt={product.name} fill className="object-cover" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-brand-olive-dark">{product.name}</p>
                                                <p className="mt-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                    <RupeeAmount value={Number(product.price || 0)} /> {product.unit}
                                                </p>
                                            </div>
                                        </div>
                                        <input
                                            type="number"
                                            min={0}
                                            value={quantities[product.id] || ""}
                                            onChange={(event) => handleQuantityChange(product.id, event.target.value)}
                                            placeholder="Qty"
                                            className="w-full rounded-2xl border-2 border-transparent bg-white px-5 py-4 text-sm font-black text-brand-olive-dark outline-none transition-all focus:border-brand-gold-bright/30"
                                        />
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !selectedAddressId || selectedItems.length === 0}
                                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-brand-olive-dark py-5 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all hover:bg-brand-gold-bright disabled:cursor-not-allowed disabled:bg-gray-300"
                            >
                                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                                Place Order
                            </button>
                        </>
                    )}
                </section>
            </div>
        </div>
    );
}

function OrderCard({
    order,
    staff,
    isReadOnly,
    isMutating,
    onAcknowledge,
    onComplete,
    onTransit,
    onDeliver,
    onGenerateInvoice,
}: {
    order: OrderRecord;
    staff: StaffMember;
    isReadOnly: boolean;
    isMutating: boolean;
    onAcknowledge: () => void;
    onComplete: () => void;
    onTransit: () => void;
    onDeliver: () => void;
    onGenerateInvoice: () => void;
}) {
    const isMine = order.acknowledged_by === staff.id;

    const getStatusStyles = (status: string) => {
        switch (status) {
            case "pending":
                return "bg-amber-100 text-amber-600";
            case "preparing":
                return "bg-blue-100 text-blue-600";
            case "prepared":
                return "bg-brand-gold-bright/20 text-brand-gold-bright";
            case "in transit":
                return "bg-purple-100 text-purple-600";
            case "delivered":
                return "bg-green-100 text-green-600";
            default:
                return "bg-gray-100 text-gray-600";
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
                "overflow-hidden rounded-[2.5rem] border-2 bg-white shadow-premium transition-all",
                isMine ? "border-brand-gold-bright ring-4 ring-brand-gold-bright/5" : "border-transparent"
            )}
        >
            <div className="p-8">
                <div className="mb-8 flex items-start justify-between">
                    <div>
                        <div className="mb-2 flex items-center gap-3">
                            <span className="text-xl font-black tracking-tighter text-brand-olive-dark">#ORD-{getDisplayOrderNumber(order)}</span>
                            <span className={cn("rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest", getStatusStyles(order.status))}>
                                {order.status}
                            </span>
                        </div>
                        <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            <Clock size={12} /> {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                    </div>
                    {isMine ? (
                        <div className="flex items-center gap-2 rounded-2xl bg-brand-gold-bright/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-brand-gold-bright">
                            <User size={12} /> Your Task
                        </div>
                    ) : null}
                </div>

                <div className="mb-8 space-y-4">
                    {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 rounded-2xl bg-brand-soft-gray/50 p-4">
                            <div className="relative h-12 w-12 overflow-hidden rounded-xl shadow-sm">
                                <Image src={item.product_image} alt={item.product_name} fill className="object-cover" />
                            </div>
                            <div>
                                <p className="text-sm font-black leading-tight text-brand-olive-dark">{item.product_name}</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Quantity: {item.quantity}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mb-8 flex items-center justify-between rounded-[2rem] bg-brand-soft-gray p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-olive-dark shadow-sm">
                            <Phone size={18} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-black text-brand-olive-dark">{order.user_name || "Customer"}</p>
                            <p className="mb-0.5 text-[10px] font-black uppercase tracking-widest text-gray-400">Contact</p>
                            <p className="text-xs font-black text-brand-olive-dark">{order.user_phone}</p>
                        </div>
                    </div>
                </div>

                {staff.role === "accountant" ? (
                    <div className="mb-8 rounded-[2rem] bg-brand-soft-gray p-6">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Invoice</p>
                                <p className="text-sm font-black text-brand-olive-dark">
                                    {order.invoice_number || "Not generated"}
                                </p>
                            </div>

                            {order.invoice_pdf_url ? (
                                <a
                                    href={order.invoice_pdf_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-xl bg-brand-olive-dark px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-sm transition-all hover:bg-brand-gold-bright hover:text-brand-olive-dark"
                                >
                                    <FileText size={14} />
                                    View Invoice
                                </a>
                            ) : order.payment_status === "paid" ? (
                                <button
                                    onClick={onGenerateInvoice}
                                    disabled={isMutating}
                                    className="inline-flex items-center gap-2 rounded-xl bg-brand-olive-dark px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-sm transition-all hover:bg-brand-gold-bright hover:text-brand-olive-dark disabled:opacity-60"
                                >
                                    {isMutating ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                                    Generate Invoice
                                </button>
                            ) : (
                                <div className="rounded-xl bg-white px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 shadow-sm">
                                    Invoice Pending
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}

                {staff.role === "delivery" && order.address_line1 ? (
                    <div className="mb-8 rounded-[2rem] bg-brand-soft-gray p-6">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-olive-dark shadow-sm">
                                <MapPin size={18} />
                            </div>
                            <div>
                                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Delivery Address</p>
                                <p className="text-sm font-black leading-6 text-brand-olive-dark">
                                    {order.address_line1}
                                    {order.city ? `, ${order.city}` : ""}
                                    {order.pincode ? ` - ${order.pincode}` : ""}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : null}

                {!isReadOnly ? (
                    staff.role === "delivery" ? (
                        order.status === "prepared" ? (
                            <button
                                onClick={onTransit}
                                disabled={isMutating}
                                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-brand-olive-dark py-5 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all hover:bg-brand-gold-bright disabled:opacity-60"
                            >
                                {isMutating ? <Loader2 size={20} className="animate-spin" /> : <Package size={20} />}
                                Pick Up Order
                            </button>
                        ) : order.status === "in transit" ? (
                            <button
                                onClick={onDeliver}
                                disabled={isMutating}
                                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-brand-gold-bright py-5 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all hover:bg-brand-olive-dark disabled:opacity-60"
                            >
                                {isMutating ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                                Mark as Delivered
                            </button>
                        ) : null
                    ) : staff.role === "baker" ? (
                        order.status === "pending" ? (
                            <button
                                onClick={onAcknowledge}
                                disabled={isMutating}
                                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-brand-olive-dark py-5 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all hover:bg-brand-gold-bright disabled:opacity-60"
                            >
                                {isMutating ? <Loader2 size={20} className="animate-spin" /> : <ChefHat size={20} />}
                                Acknowledge Order
                            </button>
                        ) : order.status === "preparing" ? (
                            <button
                                onClick={onComplete}
                                disabled={isMutating}
                                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-brand-gold-bright py-5 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all hover:bg-brand-olive-dark disabled:opacity-60"
                            >
                                {isMutating ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                                Mark as Prepared
                            </button>
                        ) : null
                    ) : null
                ) : (
                    <div className="flex items-center justify-center gap-2 rounded-2xl bg-brand-soft-gray p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <FileText size={14} /> View Only Access
                    </div>
                )}
            </div>
        </motion.div>
    );
}
