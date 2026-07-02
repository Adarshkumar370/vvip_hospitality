"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Database, Users, Activity, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getHealthStatus } from "@/app/bakery/actions";

type HealthData = {
    database?: {
        connected: boolean;
        latency?: string;
        userCount?: number;
        dbName?: string;
        host?: string;
    };
    firebase?: {
        configured: boolean;
        projectId: string | null;
    };
} | null;

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

export function DeveloperDashboard() {
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
                    <HealthItem
                        label="PostgreSQL Pool"
                        status={healthData?.database?.connected}
                        detail={
                            healthData?.database?.connected
                                ? `${healthData.database.dbName || "unknown"} @ ${healthData.database.host || "unknown host"}`
                                : (healthData?.database?.host ? `Unreachable @ ${healthData.database.host}` : "Unreachable")
                        }
                    />
                    <HealthItem
                        label="Firebase Auth"
                        status={healthData?.firebase?.configured}
                        detail={healthData?.firebase?.configured ? `Project: ${healthData.firebase.projectId}` : "Project ID not configured"}
                    />
                    <HealthItem label="Auth Context" status={true} detail="LocalStorage Sync Active" />
                </div>
            </div>
        </motion.div>
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
