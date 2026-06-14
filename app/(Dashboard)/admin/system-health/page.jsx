"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
    Activity, ShieldCheck, Zap, Server, Database, Mail, Cpu, HardDrive,
    RefreshCw, CheckCircle2, XCircle, AlertTriangle, Clock, Loader2,
    MessageSquare, Wrench, Sparkles, Megaphone, CreditCard, Users,
    Calendar, Building2, Globe, Wifi, WifiOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

// ── Helpers ────────────────────────────────────────────────────────────────
const StatusDot = ({ status }) => {
    const map = {
        HEALTHY: "bg-emerald-500",
        DEGRADED: "bg-amber-500",
        UNHEALTHY: "bg-rose-500",
        OK: "bg-emerald-500",
        ERROR: "bg-rose-500",
    };
    return (
        <span className={`inline-block h-2 w-2 rounded-full ${map[status?.toUpperCase()] ?? "bg-gray-300"} ${status === "HEALTHY" || status === "OK" ? "shadow-[0_0_6px_2px_rgba(16,185,129,0.4)]" : ""}`} />
    );
};

const StatusChip = ({ status }) => {
    const map = {
        HEALTHY: "bg-emerald-50 text-emerald-700 border-emerald-100",
        DEGRADED: "bg-amber-50 text-amber-700 border-amber-100",
        UNHEALTHY: "bg-rose-50 text-rose-700 border-rose-100",
        OK: "bg-emerald-50 text-emerald-700 border-emerald-100",
        ERROR: "bg-rose-50 text-rose-700 border-rose-100",
    };
    const label = { HEALTHY: "OK", OK: "OK", ERROR: "ERROR", UNHEALTHY: "DOWN", DEGRADED: "DEGRADED" };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${map[status?.toUpperCase()] ?? "bg-gray-50 dark:bg-muted/10 text-gray-500 dark:text-muted-foreground border-gray-100 dark:border-border"}`}>
            <StatusDot status={status} />
            {label[status?.toUpperCase()] ?? status}
        </span>
    );
};

const LatencyChip = ({ ms }) => {
    if (ms == null) return null;
    const color = ms < 100 ? "text-emerald-600" : ms < 300 ? "text-amber-600" : "text-rose-600";
    return <span className={`text-[9px] font-black font-mono ${color}`}>{ms}ms</span>;
};

export default function SystemHealthPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastChecked, setLastChecked] = useState(null);

    const fetchHealth = useCallback(async (toast_on_done = false) => {
        setRefreshing(true);
        try {
            const res = await fetch("/api/health");
            const json = await res.json();
            if (json.success) {
                setData(json);
                setLastChecked(new Date());
                if (toast_on_done) toast.success("System status refreshed.");
            } else {
                toast.error(json.message ?? "Failed to load health data.");
            }
        } catch {
            toast.error("Could not reach health endpoint.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchHealth();
        const id = setInterval(() => fetchHealth(), 30_000);
        return () => clearInterval(id);
    }, [fetchHealth]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center animate-pulse">
                        <Activity className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">Running diagnostics…</p>
                </div>
            </div>
        );
    }

    const { health, stats, server } = data ?? {};
    const isHealthy = health?.overall === "HEALTHY";

    const endpoints = Object.entries(health?.endpoints ?? {});
    const allEndpointsOk = endpoints.every(([, v]) => v.status === "OK");

    const services = [
        { label: "Laundry", key: "laundry", icon: Zap },
        { label: "Mess", key: "mess", icon: Megaphone },
        { label: "Guest Bookings", key: "bookings", icon: Calendar },
        { label: "Complaints", key: "complaints", icon: MessageSquare },
        { label: "Maintenance", key: "maintenance", icon: Wrench },
        { label: "Refunds", key: "refunds", icon: CreditCard },
        { label: "Notice Board", key: "notices", icon: Megaphone },
        { label: "AI Assistant", key: "ai", icon: Sparkles },
        { label: "Payments", key: "payments", icon: CreditCard },
        { label: "Email Service", key: "emailService", icon: Mail },
    ];

    return (
        <div className="min-h-screen bg-[#f8f9fa] pb-20 font-sans tracking-tight">
            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div className="bg-white dark:bg-card border-b sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-1 bg-blue-600 rounded-full" />
                        <div>
                            <h1 className="text-base font-bold text-gray-900 dark:text-foreground tracking-tight uppercase">System Health</h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <StatusDot status={health?.overall} />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-muted-foreground">
                                    {lastChecked ? `Last checked ${formatDistanceToNow(lastChecked, { addSuffix: true })}` : "Checking…"}
                                </span>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchHealth(true)}
                        disabled={refreshing}
                        className="rounded-xl border-gray-200 dark:border-border font-bold text-[10px] uppercase tracking-wider h-9 px-4 gap-2"
                    >
                        {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                        Refresh
                    </Button>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">

                {/* ── Overall Banner ──────────────────────────────────────── */}
                <div className={`rounded-2xl p-6 flex items-center gap-6 border ${isHealthy ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100"}`}>
                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 ${isHealthy ? "bg-emerald-100" : "bg-amber-100"}`}>
                        {isHealthy
                            ? <ShieldCheck className="h-7 w-7 text-emerald-600" />
                            : <AlertTriangle className="h-7 w-7 text-amber-600 animate-pulse" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold uppercase tracking-widest ${isHealthy ? "text-emerald-600" : "text-amber-600"}`}>
                            {isHealthy ? "All Systems Operational" : "Some Systems Need Attention"}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-muted-foreground font-medium mt-0.5">
                            {health?.maintenance
                                ? "⚠️ Maintenance Mode is currently ACTIVE — app is in read-only"
                                : `Monitoring ${endpoints.length} API endpoints · ${services.length} features · DB + SMTP verified`}
                        </p>
                    </div>
                    <div className="hidden md:flex items-center gap-6 text-right shrink-0">
                        <div>
                            <p className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">Node</p>
                            <p className="text-sm font-black text-gray-900 dark:text-foreground">{server?.nodeVersion}</p>
                        </div>
                        <div className="h-8 w-px bg-gray-200" />
                        <div>
                            <p className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">Process Uptime</p>
                            <p className="text-sm font-black text-gray-900 dark:text-foreground">{Math.round((server?.uptime ?? 0) / 60)}m</p>
                        </div>
                        <div className="h-8 w-px bg-gray-200" />
                        <div>
                            <p className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">Platform</p>
                            <p className="text-sm font-black text-gray-900 dark:text-foreground uppercase">{server?.platform}/{server?.arch}</p>
                        </div>
                    </div>
                </div>

                {/* ── Core Infrastructure (DB + Email + Automation) ────────── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                    {/* Database */}
                    <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-5">
                            <div className="h-11 w-11 rounded-xl bg-indigo-50 flex items-center justify-center">
                                <Database className="h-5 w-5 text-indigo-600" />
                            </div>
                            <StatusChip status={health?.database?.status} />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-foreground uppercase tracking-wide">PostgreSQL</h3>
                        <p className="text-[10px] text-gray-400 dark:text-muted-foreground font-bold uppercase tracking-widest mb-4">Neon Serverless</p>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-gray-500 dark:text-muted-foreground uppercase">Query latency</span>
                                <LatencyChip ms={health?.database?.latency} />
                            </div>
                            <Progress
                                value={health?.database?.latency ? Math.min((health.database.latency / 500) * 100, 100) : 0}
                                className="h-1.5 bg-gray-100"
                            />
                            {health?.database?.error && (
                                <p className="text-[9px] text-rose-600 font-mono break-all">{health.database.error}</p>
                            )}
                        </div>
                    </div>

                    {/* Email / SMTP */}
                    <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-5">
                            <div className="h-11 w-11 rounded-xl bg-sky-50 flex items-center justify-center">
                                <Mail className="h-5 w-5 text-sky-600" />
                            </div>
                            <StatusChip status={health?.email?.status} />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-foreground uppercase tracking-wide">Email / SMTP</h3>
                        <p className="text-[10px] text-gray-400 dark:text-muted-foreground font-bold uppercase tracking-widest mb-4">Gmail (nodemailer)</p>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-gray-500 dark:text-muted-foreground uppercase">Account</span>
                                <span className="text-[9px] font-bold text-gray-700 dark:text-foreground font-mono truncate max-w-[140px]">{health?.email?.account}</span>
                            </div>
                            {health?.email?.error && (
                                <p className="text-[9px] text-rose-600 font-mono break-all mt-2">{health.email.error}</p>
                            )}
                        </div>
                    </div>

                    {/* Automation */}
                    <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-5">
                            <div className="h-11 w-11 rounded-xl bg-amber-50 flex items-center justify-center">
                                <Zap className="h-5 w-5 text-amber-600" />
                            </div>
                            <StatusChip status={health?.automation?.autoRent || health?.automation?.autoSalary ? "HEALTHY" : "UNHEALTHY"} />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-foreground uppercase tracking-wide">Automation</h3>
                        <p className="text-[10px] text-gray-400 dark:text-muted-foreground font-bold uppercase tracking-widest mb-4">Monthly Cron Jobs</p>
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-bold">
                                <span className="text-gray-500 dark:text-muted-foreground uppercase">Auto Rent</span>
                                <span className={health?.automation?.autoRent ? "text-emerald-600" : "text-gray-400 dark:text-muted-foreground"}>
                                    {health?.automation?.autoRent ? "ENABLED" : "DISABLED"}
                                </span>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold">
                                <span className="text-gray-500 dark:text-muted-foreground uppercase">Auto Salary</span>
                                <span className={health?.automation?.autoSalary ? "text-emerald-600" : "text-gray-400 dark:text-muted-foreground"}>
                                    {health?.automation?.autoSalary ? "ENABLED" : "DISABLED"}
                                </span>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold">
                                <span className="text-gray-500 dark:text-muted-foreground uppercase">Last Run</span>
                                <span className="text-gray-700 dark:text-foreground font-mono">
                                    {health?.automation?.lastRun
                                        ? format(new Date(health.automation.lastRun), "MMM dd, HH:mm")
                                        : "Never"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── API Endpoint Health ──────────────────────────────────── */}
                <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-gray-50 dark:bg-muted/10 border border-gray-100 dark:border-border flex items-center justify-center">
                                <Globe className="h-4 w-4 text-gray-500 dark:text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-foreground uppercase tracking-wide">API Endpoints</h3>
                                <p className="text-[9px] text-gray-400 dark:text-muted-foreground font-bold uppercase tracking-widest">Live latency probe</p>
                            </div>
                        </div>
                        <StatusChip status={allEndpointsOk ? "OK" : "ERROR"} />
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-border/20">
                        {endpoints.map(([key, val]) => (
                            <div key={key} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 dark:hover:bg-muted/5 dark:bg-background transition-colors">
                                <div className="flex items-center gap-3">
                                    {val.status === "OK"
                                        ? <Wifi className="h-4 w-4 text-emerald-500" />
                                        : <WifiOff className="h-4 w-4 text-rose-500" />}
                                    <span className="text-[11px] font-bold text-gray-800 dark:text-foreground uppercase tracking-wide">{val.name}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    {val.count != null && (
                                        <span className="text-[9px] font-black font-mono px-2 py-0.5 rounded-full border bg-gray-50 dark:bg-muted/10 text-gray-600 dark:text-muted-foreground border-gray-100 dark:border-border">
                                            {val.count.toLocaleString()} records
                                        </span>
                                    )}
                                    {val.error && (
                                        <span className="text-[9px] font-mono text-rose-500 truncate max-w-[180px]">{val.error}</span>
                                    )}
                                    <LatencyChip ms={val.latency} />
                                    <StatusChip status={val.status} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Server Resources + Live Stats ───────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Server Resources */}
                    <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-9 w-9 rounded-xl bg-gray-50 dark:bg-muted/10 border border-gray-100 dark:border-border flex items-center justify-center">
                                <Server className="h-4 w-4 text-gray-500 dark:text-muted-foreground" />
                            </div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-foreground uppercase tracking-wide">Server Resources</h3>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <HardDrive className="h-3.5 w-3.5 text-gray-400 dark:text-muted-foreground" />
                                        <span className="text-[10px] font-bold text-gray-700 dark:text-foreground uppercase">Memory</span>
                                    </div>
                                    <span className="text-[10px] font-black text-blue-600">
                                        {server?.memory?.usedPercent}% used · {server?.memory?.free}MB free / {server?.memory?.total}MB
                                    </span>
                                </div>
                                <Progress value={server?.memory?.usedPercent ?? 0} className="h-2 bg-gray-100" />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <Cpu className="h-3.5 w-3.5 text-gray-400 dark:text-muted-foreground" />
                                        <span className="text-[10px] font-bold text-gray-700 dark:text-foreground uppercase">CPU Load Avg (1m · 5m · 15m)</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {(server?.loadAvg ?? []).map((v, i) => (
                                        <div key={i} className="bg-gray-50 dark:bg-muted/10 border border-gray-100 dark:border-border rounded-xl p-3 text-center">
                                            <p className="text-xs font-black text-gray-900 dark:text-foreground font-mono">{v}</p>
                                            <p className="text-[8px] font-bold text-gray-400 dark:text-muted-foreground uppercase mt-0.5">{["1 min", "5 min", "15 min"][i]}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 pt-1">
                                <div className="flex justify-between text-[10px] font-bold text-gray-500 dark:text-muted-foreground bg-gray-50 dark:bg-muted/10 rounded-xl p-3">
                                    <span className="uppercase">OS Uptime</span>
                                    <span className="text-gray-900 dark:text-foreground font-mono">{Math.round((server?.serverUptime ?? 0) / 3600)}h</span>
                                </div>
                                <div className="flex justify-between text-[10px] font-bold text-gray-500 dark:text-muted-foreground bg-gray-50 dark:bg-muted/10 rounded-xl p-3">
                                    <span className="uppercase">Process</span>
                                    <span className="text-gray-900 dark:text-foreground font-mono">{Math.round((server?.uptime ?? 0) / 60)}m</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Live DB Stats */}
                    <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-9 w-9 rounded-xl bg-gray-50 dark:bg-muted/10 border border-gray-100 dark:border-border flex items-center justify-center">
                                <Activity className="h-4 w-4 text-gray-500 dark:text-muted-foreground" />
                            </div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-foreground uppercase tracking-wide">Live Database Stats</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: "Total Users", value: stats?.totalUsers ?? "—", icon: Users, color: "bg-blue-50 text-blue-600" },
                                { label: "Total Hostels", value: stats?.totalHostels ?? "—", icon: Building2, color: "bg-indigo-50 text-indigo-600" },
                                { label: "Total Bookings", value: stats?.totalBookings ?? "—", icon: Calendar, color: "bg-emerald-50 text-emerald-600" },
                                { label: "Total Payments", value: stats?.totalPayments ?? "—", icon: CreditCard, color: "bg-amber-50 text-amber-600" },
                                { label: "Open Complaints", value: stats?.pendingComplaints ?? "—", icon: MessageSquare, color: "bg-rose-50 text-rose-600" },
                            ].map((s, i) => (
                                <div key={i} className="flex items-center gap-3 bg-gray-50 dark:bg-muted/10/80 border border-gray-100 dark:border-border rounded-xl p-4">
                                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${s.color}`}>
                                        <s.icon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">{s.label}</p>
                                        <p className="text-lg font-black text-gray-900 dark:text-foreground leading-none mt-0.5">{s.value.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Feature Service Toggles ──────────────────────────────── */}
                <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-foreground uppercase tracking-wide">Application Services</h3>
                        <p className="text-[9px] text-gray-400 dark:text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Pulled from SystemSettings in database</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y divide-gray-50 dark:divide-border/20">
                        {services.map((svc, i) => {
                            const enabled = health?.services?.[svc.key];
                            return (
                                <div key={i} className={`p-5 flex flex-col items-center gap-2 text-center transition-colors ${enabled ? "hover:bg-emerald-50/30" : "hover:bg-rose-50/20"}`}>
                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${enabled ? "bg-emerald-50" : "bg-gray-100"}`}>
                                        <svc.icon className={`h-4.5 w-4.5 ${enabled ? "text-emerald-600" : "text-gray-300"}`} style={{ height: 18, width: 18 }} />
                                    </div>
                                    <p className={`text-[9px] font-bold uppercase tracking-wider leading-tight ${enabled ? "text-gray-800 dark:text-foreground" : "text-gray-400 dark:text-muted-foreground"}`}>{svc.label}</p>
                                    <StatusChip status={enabled ? "OK" : "ERROR"} />
                                </div>
                            );
                        })}
                    </div>
                </div>

            </main>
        </div>
    );
}
