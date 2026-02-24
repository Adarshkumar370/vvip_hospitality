"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChefHat,
    ClipboardList,
    CheckCircle2,
    Clock,
    ChefHat as BakerIcon,
    LogOut,
    Loader2,
    Package,
    Phone,
    User,
    Shield,
    FileText,
    History
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { staffLogin, getOrders, updateOrderStatus, getStaffSession, logoutStaff } from "../actions";

export default function StaffPortal() {
    const [staff, setStaff] = useState<any>(null);
    const [isCheckingSession, setIsCheckingSession] = useState(true);

    useEffect(() => {
        checkSession();
    }, []);

    const checkSession = async () => {
        const sessionStaff = await getStaffSession();
        if (sessionStaff) {
            setStaff(sessionStaff);
        }
        setIsCheckingSession(false);
    };

    const handleLogout = async () => {
        const result = await logoutStaff();
        if (result.success) {
            setStaff(null);
        }
    };

    if (isCheckingSession) return null;

    if (!staff) {
        return <StaffLogin onLogin={setStaff} />;
    }

    return (
        <div className="min-h-screen bg-brand-soft-gray flex">
            {/* Sidebar Navigation */}
            <aside className="w-72 bg-white border-r border-brand-olive-dark/5 shadow-premium flex flex-col h-screen sticky top-0">
                <div className="p-8">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 bg-brand-olive-dark rounded-2xl flex items-center justify-center text-brand-gold-bright shadow-lg">
                            <BakerIcon size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold-bright mb-1">VVIP Staff</p>
                            <h2 className="text-xl font-serif font-black text-brand-olive-dark leading-none">Portal</h2>
                        </div>
                    </div>

                    <div className="bg-brand-soft-gray/50 p-4 rounded-2xl mb-8">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Logged in as</p>
                        <p className="font-black text-brand-olive-dark truncate">{staff.name}</p>
                        <p className="text-[10px] font-bold text-brand-gold-bright uppercase tracking-widest mt-1">{staff.role}</p>
                    </div>

                    <nav className="flex flex-col gap-2">
                        {/* Currently only one main view, but structured for expansion */}
                        <div className="flex items-center gap-3 px-4 py-3 bg-brand-olive-dark text-brand-gold-bright rounded-2xl text-xs font-black uppercase tracking-widest cursor-default">
                            <ClipboardList size={18} />
                            Order Queue
                        </div>

                        {staff.role === 'admin' && (
                            <a
                                href="/bakery/admin"
                                className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-brand-soft-gray hover:text-brand-olive-dark rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                            >
                                <Shield size={18} />
                                Admin Panel
                            </a>
                        )}
                    </nav>
                </div>

                <div className="mt-auto p-8 border-t border-brand-olive-dark/5">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-red-50 text-red-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
                <div className="max-w-5xl mx-auto">
                    <StaffDashboard staff={staff} />
                </div>
            </main>
        </div>
    );
}

function StaffLogin({ onLogin }: { onLogin: (staff: any) => void }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const result = await staffLogin(email, password);
            if (result.success) {
                // The iron-session cookie is now set by the server. 
                // We just update the local state to render the dashboard.
                onLogin(result.staff);
            } else {
                setError(result.error || "Login failed");
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-olive-dark flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-12 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <ChefHat size={120} className="text-brand-olive-dark" />
                </div>

                <div className="text-center mb-10">
                    <div className="inline-flex w-20 h-20 bg-brand-soft-gray rounded-3xl items-center justify-center text-brand-olive-dark mb-6 shadow-sm">
                        <BakerIcon size={40} />
                    </div>
                    <h2 className="text-3xl font-serif font-black text-brand-olive-dark mb-2">Staff Access</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Bakery fulfillment Center</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-4">Staff Email</label>
                        <input
                            required
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 outline-none rounded-2xl py-5 px-8 text-sm font-bold text-brand-olive-dark transition-all"
                            placeholder="staff@vvip.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-4">Access Code</label>
                        <input
                            required
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 outline-none rounded-2xl py-5 px-8 text-sm font-bold text-brand-olive-dark transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <p className="text-center text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-50 py-3 rounded-xl">{error}</p>
                    )}

                    <button
                        disabled={isLoading}
                        className="w-full bg-brand-olive-dark text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-gold-bright transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Enter Workplace"}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}

function StaffDashboard({ staff }: { staff: any }) {
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'completed'>('pending');

    useEffect(() => {
        loadOrders();
        // Poll for new orders every 30 seconds
        const interval = setInterval(loadOrders, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadOrders = async () => {
        const result = await getOrders();
        if (result.success) {
            setOrders(result.orders || []);
        }
        setIsLoading(false);
    };

    const handleAcknowledge = async (orderId: number) => {
        const result = await updateOrderStatus(orderId, 'preparing', staff.id);
        if (result.success) loadOrders();
    };

    const handleComplete = async (orderId: number) => {
        // Baker marks as 'prepared'
        const result = await updateOrderStatus(orderId, 'prepared');
        if (result.success) loadOrders();
    };

    const handleTransit = async (orderId: number) => {
        // Delivery agent marks as 'in transit'
        const result = await updateOrderStatus(orderId, 'in transit', staff.id);
        if (result.success) loadOrders();
    };

    const handleDeliver = async (orderId: number) => {
        const result = await updateOrderStatus(orderId, 'delivered', staff.id);
        if (result.success) loadOrders();
    };

    const getTabbedOrders = () => {
        const paidOrders = orders.filter(o => o.payment_status === 'paid');

        if (staff.role === 'admin' || staff.role === 'manager' || staff.role === 'accountant') {
            return { pending: paidOrders, active: [], completed: [] };
        }

        if (staff.role === 'baker') {
            return {
                pending: paidOrders.filter(o => o.status === 'pending'),
                active: paidOrders.filter(o => o.status === 'preparing' && o.acknowledged_by === staff.id),
                completed: paidOrders.filter(o => o.status === 'prepared' && o.acknowledged_by === staff.id)
            };
        }

        if (staff.role === 'delivery') {
            return {
                pending: paidOrders.filter(o => o.status === 'prepared'),
                active: paidOrders.filter(o => o.status === 'in transit' && o.acknowledged_by === staff.id),
                completed: paidOrders.filter(o => o.status === 'delivered' && o.acknowledged_by === staff.id)
            };
        }

        return { pending: [], active: [], completed: [] };
    };

    const tabbedOrders = getTabbedOrders();
    const filteredOrders = tabbedOrders[activeTab];

    const stats = {
        pending: tabbedOrders.pending.length,
        active: tabbedOrders.active.length,
        completed: tabbedOrders.completed.length
    };

    const isReadOnly = staff.role === 'accountant';

    return (
        <div className="space-y-10">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-premium border border-white flex items-center gap-6">
                    <div className="w-16 h-16 bg-brand-soft-gray rounded-[1.5rem] flex items-center justify-center text-brand-gold-bright">
                        <Clock size={32} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Your Active Load</p>
                        <h3 className="text-4xl font-serif font-black text-brand-olive-dark">{stats.active} Tasks</h3>
                    </div>
                </div>
                <div className="bg-brand-olive-dark p-8 rounded-[2.5rem] shadow-premium flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center text-brand-gold-bright">
                        <ClipboardList size={32} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">
                            {staff.role === 'accountant' ? 'Total Paid Orders' : 'Available to Acknowledge'}
                        </p>
                        <h3 className="text-4xl font-serif font-black text-white">
                            {staff.role === 'accountant' || staff.role === 'admin' || staff.role === 'manager'
                                ? orders.filter(o => o.payment_status === 'paid').length
                                : stats.pending} {staff.role === 'accountant' ? '' : 'New'}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            {(staff.role !== 'accountant' && staff.role !== 'admin' && staff.role !== 'manager') && (
                <div className="flex gap-2 p-2 bg-brand-soft-gray/50 rounded-3xl w-fit">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={cn(
                            "px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                            activeTab === 'pending'
                                ? "bg-brand-olive-dark text-white shadow-lg"
                                : "text-gray-400 hover:text-brand-olive-dark"
                        )}
                    >
                        Pending Queue ({stats.pending})
                    </button>
                    <button
                        onClick={() => setActiveTab('active')}
                        className={cn(
                            "px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                            activeTab === 'active'
                                ? "bg-brand-olive-dark text-white shadow-lg"
                                : "text-gray-400 hover:text-brand-olive-dark"
                        )}
                    >
                        Active Work ({stats.active})
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={cn(
                            "px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                            activeTab === 'completed'
                                ? "bg-brand-olive-dark text-white shadow-lg"
                                : "text-gray-400 hover:text-brand-olive-dark"
                        )}
                    >
                        Completed ({stats.completed})
                    </button>
                </div>
            )}

            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <div className="h-[2px] flex-1 bg-brand-olive-dark/10" />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-olive-dark/40">
                        {staff.role === 'accountant' ? 'Order Details & Audit' : activeTab === 'pending' ? 'Work Queue' : activeTab === 'active' ? 'My Active Tasks' : 'My Historical Load'}
                    </h4>
                    <div className="h-[2px] flex-1 bg-brand-olive-dark/10" />
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-20">
                        <Loader2 className="animate-spin text-brand-gold-bright" size={40} />
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-32 bg-white rounded-[3rem] border-4 border-dashed border-brand-soft-gray">
                        <Package className="mx-auto text-brand-soft-gray mb-6" size={60} />
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                            {activeTab === 'pending' ? 'No new orders available' : activeTab === 'active' ? 'No active tasks assigned' : 'No completed orders in this session'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20">
                        <AnimatePresence mode="popLayout">
                            {filteredOrders.map((order) => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    staff={staff}
                                    isReadOnly={isReadOnly}
                                    onAcknowledge={() => handleAcknowledge(order.id)}
                                    onComplete={() => handleComplete(order.id)}
                                    onTransit={() => handleTransit(order.id)}
                                    onDeliver={() => handleDeliver(order.id)}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}

function OrderCard({ order, staff, isReadOnly, onAcknowledge, onComplete, onTransit, onDeliver }: any) {
    const isMine = order.acknowledged_by === staff.id;

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'pending': return "bg-amber-100 text-amber-600";
            case 'preparing': return "bg-blue-100 text-blue-600";
            case 'prepared': return "bg-brand-gold-bright/20 text-brand-gold-bright";
            case 'in transit': return "bg-purple-100 text-purple-600";
            case 'delivered': return "bg-green-100 text-green-600";
            default: return "bg-gray-100 text-gray-600";
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
                "bg-white rounded-[2.5rem] shadow-premium overflow-hidden border-2 transition-all",
                isMine ? "border-brand-gold-bright ring-4 ring-brand-gold-bright/5" : "border-transparent"
            )}
        >
            <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-brand-olive-dark font-black tracking-tighter text-xl">#ORD-{order.id}</span>
                            <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                getStatusStyles(order.status)
                            )}>
                                {order.status}
                            </span>
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Clock size={12} /> {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                    {isMine && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-brand-gold-bright/10 text-brand-gold-bright rounded-2xl text-[10px] font-black uppercase tracking-widest">
                            <User size={12} /> Your Task
                        </div>
                    )}
                </div>

                <div className="space-y-4 mb-8">
                    {order.items.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-4 bg-brand-soft-gray/50 p-4 rounded-2xl">
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-sm">
                                <Image src={item.product_image} alt={item.product_name} fill className="object-cover" />
                            </div>
                            <div>
                                <p className="font-black text-brand-olive-dark text-sm leading-tight">{item.product_name}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quantity: {item.quantity}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-6 bg-brand-soft-gray rounded-[2rem] flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-olive-dark shadow-sm">
                            <Phone size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Contact</p>
                            <p className="text-xs font-black text-brand-olive-dark">{order.user_phone}</p>
                        </div>
                    </div>
                </div>

                {!isReadOnly && (
                    staff.role === 'delivery' ? (
                        order.status === 'prepared' ? (
                            <button
                                onClick={onTransit}
                                className="w-full bg-brand-olive-dark text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-gold-bright transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
                            >
                                <Package size={20} />
                                Pick Up Order
                            </button>
                        ) : order.status === 'in transit' ? (
                            <button
                                onClick={onDeliver}
                                className="w-full bg-brand-gold-bright text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-olive-dark transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
                            >
                                <CheckCircle2 size={20} />
                                Mark as Delivered
                            </button>
                        ) : null
                    ) : staff.role === 'baker' ? (
                        order.status === 'pending' ? (
                            <button
                                onClick={onAcknowledge}
                                className="w-full bg-brand-olive-dark text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-gold-bright transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
                            >
                                <ChefHat size={20} />
                                Acknowledge Order
                            </button>
                        ) : order.status === 'preparing' ? (
                            <button
                                onClick={onComplete}
                                className="w-full bg-brand-gold-bright text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-olive-dark transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
                            >
                                <CheckCircle2 size={20} />
                                Mark as Prepared
                            </button>
                        ) : null
                    ) : null
                )}

                {isReadOnly && (
                    <div className="flex items-center justify-center gap-2 p-4 bg-brand-soft-gray rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <FileText size={14} /> View Only Access
                    </div>
                )}
            </div>
        </motion.div>
    );
}
