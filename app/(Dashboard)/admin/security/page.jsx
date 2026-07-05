"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    Shield, ShieldAlert, ShieldCheck, AlertTriangle,
    Ban, Unlock, RefreshCw, Globe, Activity, Zap,
    Terminal, Wifi, WifiOff, Eye, EyeOff,
    Clock, ChevronDown, ChevronUp, BarChart3,
    Lock, Cpu, CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

// ─── Config ────────────────────────────────────────────────────────────────────
const SEV = {
    LOW:      { color: "text-sky-600",    bg: "bg-sky-50  border-sky-200",      dot: "bg-sky-400",              bar: "bg-sky-400",    label: "LOW",  textBg: "bg-sky-100 text-sky-700" },
    MEDIUM:   { color: "text-amber-600",  bg: "bg-amber-50 border-amber-200",   dot: "bg-amber-400",            bar: "bg-amber-400",  label: "MED",  textBg: "bg-amber-100 text-amber-700" },
    HIGH:     { color: "text-orange-600", bg: "bg-orange-50 border-orange-200", dot: "bg-orange-400",           bar: "bg-orange-400", label: "HIGH", textBg: "bg-orange-100 text-orange-700" },
    CRITICAL: { color: "text-rose-600",   bg: "bg-rose-50  border-rose-200",    dot: "bg-rose-500 animate-pulse", bar: "bg-rose-500", label: "CRIT", textBg: "bg-rose-100 text-rose-700" },
};

const EVENT_COLORS = {
    SQL_INJECTION:  "text-amber-700",
    XSS_ATTEMPT:    "text-orange-700",
    PATH_TRAVERSAL: "text-purple-700",
    BRUTE_FORCE:    "text-rose-700",
    RATE_LIMIT:     "text-sky-700",
    MANUAL_BLOCK:   "text-gray-500",
};

function formatTs(iso) {
    return new Date(iso).toLocaleTimeString("en-PK", { hour12: true, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ─── Section Card (matches system-settings style) ─────────────────────────────
function SectionCard({ title, subtitle, icon: Icon, iconColor = "text-indigo-600", iconBg = "bg-indigo-50 dark:bg-indigo-500/10", children, action }) {
    return (
        <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="px-6 py-4 border-b border-gray-50 dark:border-border/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${iconColor}`} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-foreground">{title}</h3>
                        {subtitle && <p className="text-xs text-gray-400 dark:text-muted-foreground mt-0.5">{subtitle}</p>}
                    </div>
                </div>
                {action}
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

// ─── Animated Number ──────────────────────────────────────────────────────────
function AnimatedNum({ value, className }) {
    const [display, setDisplay] = useState(value);
    const prev = useRef(value);
    useEffect(() => {
        if (value === prev.current) return;
        const diff = value - prev.current;
        const steps = 18;
        let i = 0;
        const t = setInterval(() => {
            i++;
            setDisplay(Math.round(prev.current + (diff * i) / steps));
            if (i >= steps) { clearInterval(t); prev.current = value; }
        }, 20);
        return () => clearInterval(t);
    }, [value]);
    return <span className={className}>{display}</span>;
}

// ─── Mini Sparkline ───────────────────────────────────────────────────────────
function Sparkline({ data, color = "#6366f1" }) {
    if (!data || data.length < 2) return null;
    const max = Math.max(...data, 1);
    const w = 72, h = 20;
    const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(" ");
    return (
        <svg width={w} height={h}>
            <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={pts} />
        </svg>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SecurityDashboard() {
    const [connected, setConnected] = useState(false);
    const sseRef = useRef(null);
    const terminalRef = useRef(null);
    const recentEvents = useRef([]);

    const [liveFeed, setLiveFeed] = useState([]);
    const [allLogs, setAllLogs] = useState([]);
    const [stats, setStats] = useState({ LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0, total: 0 });
    const [blockedIps, setBlockedIps] = useState([]);
    const [rateHistory, setRateHistory] = useState(Array(30).fill(0));
    const [eventsPerMin, setEventsPerMin] = useState(0);
    const [topIps, setTopIps] = useState([]);
    const [eventTypes, setEventTypes] = useState({});
    const [expanded, setExpanded] = useState(null);
    const [terminalPaused, setTerminalPaused] = useState(false);
    const [activeTab, setActiveTab] = useState("feed");

    // Block form
    const [blockIp, setBlockIp] = useState("");
    const [blockReason, setBlockReason] = useState("");
    const [blockDuration, setBlockDuration] = useState("2");
    const [isBlocking, setIsBlocking] = useState(false);

    // ── Derived helpers ───────────────────────────────────────────────────────
    const computeDerived = (logs) => {
        const ipCount = {}, evCount = {};
        for (const l of logs) {
            ipCount[l.ip] = (ipCount[l.ip] || 0) + 1;
            evCount[l.event] = (evCount[l.event] || 0) + 1;
        }
        setTopIps(Object.entries(ipCount).sort((a, b) => b[1] - a[1]).slice(0, 5));
        setEventTypes(evCount);
    };

    // ── Initial fetch ─────────────────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        try {
            const [logsRes, blockedRes] = await Promise.all([
                fetch("/api/admin/security/logs?limit=200"),
                fetch("/api/admin/security/blocked-ips")
            ]);
            const logsData = await logsRes.json();
            const blockedData = await blockedRes.json();
            if (logsData.logs) {
                setAllLogs(logsData.logs);
                setLiveFeed(logsData.logs.slice(0, 60));
                computeDerived(logsData.logs);
            }
            if (logsData.stats) setStats({ ...logsData.stats, total: Object.values(logsData.stats).reduce((a, b) => a + b, 0) });
            if (blockedData.blockedIps) setBlockedIps(blockedData.blockedIps);
        } catch {
            toast.error("Failed to load security data");
        }
    }, []);

    // ── SSE Connect ───────────────────────────────────────────────────────────
    const connectSSE = useCallback(() => {
        if (sseRef.current) sseRef.current.close();
        const es = new EventSource("/api/admin/security/stream");
        sseRef.current = es;

        es.addEventListener("connected", () => {
            setConnected(true);
            toast.success("🛡️ Live stream connected", { duration: 2000 });
        });

        es.addEventListener("ids:event", (e) => {
            if (terminalPaused) return;
            const event = JSON.parse(e.data);

            setLiveFeed(prev => [event, ...prev].slice(0, 200));
            setStats(prev => ({ ...prev, [event.severity]: (prev[event.severity] || 0) + 1, total: (prev.total || 0) + 1 }));

            const now = Date.now();
            recentEvents.current = [...recentEvents.current.filter(t => now - t < 60_000), now];
            setEventsPerMin(recentEvents.current.length);

            setEventTypes(prev => ({ ...prev, [event.event]: (prev[event.event] || 0) + 1 }));
            setAllLogs(prev => { const u = [event, ...prev]; computeDerived(u); return u; });
            setRateHistory(prev => [...prev.slice(1), (prev[prev.length - 1] || 0) + 1]);

            if (event.severity === "CRITICAL") {
                toast.error(`🚨 CRITICAL: ${event.event} from ${event.ip}`, { duration: 6000 });
            }
            if (terminalRef.current) terminalRef.current.scrollTop = 0;
        });

        es.addEventListener("heartbeat", () => {
            setRateHistory(prev => [...prev.slice(1), 0]);
        });

        es.onerror = () => {
            setConnected(false);
            es.close();
            setTimeout(connectSSE, 5000);
        };
    }, [terminalPaused]);

    useEffect(() => { fetchData(); connectSSE(); return () => sseRef.current?.close(); }, []);

    // ── Block / Unblock ───────────────────────────────────────────────────────
    const handleBlock = async () => {
        if (!blockIp.trim()) return toast.error("Enter an IP address");
        setIsBlocking(true);
        try {
            const res = await fetch("/api/admin/security/blocked-ips", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ip: blockIp.trim(), reason: blockReason, durationHours: blockDuration || null })
            });
            const data = await res.json();
            if (res.ok) { toast.success(`IP ${blockIp} blocked`); setBlockIp(""); setBlockReason(""); setBlockDuration("2"); const r = await fetch("/api/admin/security/blocked-ips"); const d = await r.json(); if (d.blockedIps) setBlockedIps(d.blockedIps); }
            else toast.error(data.message || "Failed to block");
        } catch { toast.error("Network error"); }
        finally { setIsBlocking(false); }
    };

    const handleUnblock = async (ip) => {
        try {
            await fetch(`/api/admin/security/blocked-ips?ip=${encodeURIComponent(ip)}`, { method: "DELETE" });
            toast.success(`IP ${ip} unblocked`);
            const r = await fetch("/api/admin/security/blocked-ips");
            const d = await r.json();
            if (d.blockedIps) setBlockedIps(d.blockedIps);
        } catch { toast.error("Error unblocking IP"); }
    };

    // ── Threat Level ──────────────────────────────────────────────────────────
    const threatLevel = stats.CRITICAL > 0 ? "CRITICAL" : stats.HIGH > 0 ? "HIGH" : stats.MEDIUM > 0 ? "MEDIUM" : "CLEAR";
    const tlCfg = {
        CLEAR:    { label: "All Clear",  badge: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: ShieldCheck, iconBg: "bg-emerald-50",   iconColor: "text-emerald-600" },
        MEDIUM:   { label: "Elevated",   badge: "bg-amber-100 text-amber-700 border-amber-200",       icon: AlertTriangle, iconBg: "bg-amber-50",   iconColor: "text-amber-600" },
        HIGH:     { label: "High Alert", badge: "bg-orange-100 text-orange-700 border-orange-200",    icon: ShieldAlert, iconBg: "bg-orange-50",     iconColor: "text-orange-600" },
        CRITICAL: { label: "CRITICAL 🚨", badge: "bg-rose-100 text-rose-700 border-rose-200",         icon: Zap,         iconBg: "bg-rose-50",       iconColor: "text-rose-600 animate-pulse" },
    };
    const tl = tlCfg[threatLevel];
    const TLIcon = tl.icon;
    const totalEvTypes = Object.values(eventTypes).reduce((a, b) => a + b, 0);

    return (
        <div className="space-y-6">
            {/* ── Page Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black text-gray-900 dark:text-foreground tracking-tight flex items-center gap-2">
                        <Shield className="h-5 w-5 text-indigo-600" />
                        Security Operations Center
                    </h1>
                    <p className="text-xs text-gray-400 dark:text-muted-foreground mt-0.5 font-medium">
                        Intrusion Detection System · Real-time monitoring
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Live indicator */}
                    <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${connected ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-gray-50 border-gray-200 text-gray-500"}`}>
                        {connected
                            ? <><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /><Wifi className="h-3 w-3" /> Live</>
                            : <><WifiOff className="h-3 w-3" /> Reconnecting...</>
                        }
                    </div>
                    <button
                        onClick={() => { sseRef.current?.close(); connectSSE(); fetchData(); }}
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-200 dark:border-border bg-white dark:bg-card text-gray-600 dark:text-muted-foreground hover:bg-gray-50 transition-colors">
                        <RefreshCw className="h-3.5 w-3.5" /> Refresh
                    </button>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Threat level */}
                <div className={`col-span-2 sm:col-span-1 flex items-center gap-3 rounded-2xl border p-4 shadow-sm ${tl.badge}`}>
                    <div className={`h-10 w-10 rounded-xl ${tl.iconBg} flex items-center justify-center shrink-0`}>
                        <TLIcon className={`h-5 w-5 ${tl.iconColor}`} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-wider opacity-60">Threat Level</p>
                        <p className="text-sm font-black">{tl.label}</p>
                    </div>
                </div>

                {[
                    { label: "Total Events", value: stats.total || 0, icon: Activity, color: "text-indigo-600", bg: "bg-indigo-50" },
                    { label: "Blocked IPs",  value: blockedIps.length, icon: Ban,      color: "text-rose-600",   bg: "bg-rose-50" },
                    { label: "Events / Min", value: eventsPerMin,       icon: Zap,      color: "text-amber-600",  bg: "bg-amber-50" },
                ].map(s => (
                    <div key={s.label} className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border shadow-sm p-4 flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                            <s.icon className={`h-4.5 w-4.5 ${s.color}`} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{s.label}</p>
                            <AnimatedNum value={s.value} className="text-xl font-black text-gray-900 dark:text-foreground" />
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Main Grid ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

                {/* ── Live Terminal Feed ── */}
                <div className="xl:col-span-2">
                    <SectionCard
                        title="Live Event Stream"
                        subtitle="Real-time threats pushed via server-sent events"
                        icon={Terminal}
                        iconColor="text-indigo-600"
                        iconBg="bg-indigo-50 dark:bg-indigo-500/10"
                        action={
                            <button
                                onClick={() => setTerminalPaused(p => !p)}
                                className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border transition-colors ${terminalPaused ? "border-amber-300 bg-amber-50 text-amber-700" : "border-gray-200 dark:border-border bg-gray-50 dark:bg-muted text-gray-500 hover:bg-gray-100"}`}>
                                {terminalPaused ? <><Eye className="h-3 w-3" /> Resume</> : <><EyeOff className="h-3 w-3" /> Pause</>}
                            </button>
                        }
                    >
                        {/* Feed rows */}
                        <div ref={terminalRef} className="space-y-1 max-h-[380px] overflow-y-auto -mx-6 px-6 font-mono text-[11px]">
                            {liveFeed.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-14 text-gray-300">
                                    <ShieldCheck className="h-10 w-10 mb-2" />
                                    <p className="font-bold text-xs tracking-wider uppercase">No events yet — monitoring active</p>
                                </div>
                            )}
                            {liveFeed.map((log, i) => {
                                const sev = SEV[log.severity] || SEV.LOW;
                                const evColor = EVENT_COLORS[log.event] || "text-gray-500";
                                return (
                                    <div key={log.id || i}
                                         className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${i === 0 ? "bg-indigo-50 dark:bg-indigo-500/10 ring-1 ring-indigo-100 dark:ring-indigo-500/20" : "hover:bg-gray-50 dark:hover:bg-muted/40"}`}>
                                        <span className="text-gray-400 shrink-0 w-16 text-[9px]">{formatTs(log.createdAt)}</span>
                                        <span className={`shrink-0 text-[8px] font-black px-1.5 py-0.5 rounded-md border ${sev.textBg} border-current`}>{sev.label}</span>
                                        <span className={`shrink-0 w-28 font-bold text-[10px] truncate ${evColor}`}>{log.event}</span>
                                        <span className="text-gray-500 w-24 shrink-0 text-[9px] truncate">{log.ip}</span>
                                        <span className="text-gray-400 truncate text-[9px] flex-1">{log.description}</span>
                                    </div>
                                );
                            })}
                        </div>
                        {/* Footer */}
                        <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-50 dark:border-border/30 -mx-6 px-6">
                            <span className="text-[10px] text-gray-400 font-semibold">{liveFeed.length} events in buffer</span>
                            <div className="flex items-center gap-2">
                                <Sparkline data={rateHistory} color="#6366f1" />
                                <span className="text-[10px] font-black text-indigo-600">{eventsPerMin}/min</span>
                            </div>
                        </div>
                    </SectionCard>
                </div>

                {/* ── Right Panel ── */}
                <div className="space-y-4">
                    {/* Severity breakdown */}
                    <SectionCard title="Severity Breakdown" icon={BarChart3} iconColor="text-indigo-600" iconBg="bg-indigo-50">
                        <div className="space-y-4">
                            {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map(sev => {
                                const cnt = stats[sev] || 0;
                                const pct = stats.total > 0 ? (cnt / stats.total) * 100 : 0;
                                const cfg = SEV[sev];
                                return (
                                    <div key={sev} className="space-y-1.5">
                                        <div className="flex justify-between text-xs">
                                            <span className={`font-black ${cfg.color}`}>{sev}</span>
                                            <span className="font-bold text-gray-500">{cnt}</span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-muted overflow-hidden">
                                            <div className={`h-full rounded-full ${cfg.bar} transition-all duration-700`} style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </SectionCard>

                    {/* Attack vectors */}
                    <SectionCard title="Attack Vectors" icon={Cpu} iconColor="text-purple-600" iconBg="bg-purple-50">
                        <div className="space-y-3">
                            {Object.entries(eventTypes).length === 0 && (
                                <p className="text-xs text-gray-400">No attacks detected yet.</p>
                            )}
                            {Object.entries(eventTypes).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([ev, cnt]) => {
                                const pct = totalEvTypes > 0 ? (cnt / totalEvTypes) * 100 : 0;
                                return (
                                    <div key={ev} className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className={`font-bold truncate max-w-[140px] ${EVENT_COLORS[ev] || "text-gray-600"}`}>{ev.replace(/_/g, " ")}</span>
                                            <span className="font-bold text-gray-400">{cnt}</span>
                                        </div>
                                        <div className="h-1 rounded-full bg-gray-100 dark:bg-muted overflow-hidden">
                                            <div className="h-full rounded-full bg-indigo-400 transition-all duration-700" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </SectionCard>

                    {/* Top attacker IPs */}
                    <SectionCard title="Top Attacker IPs" icon={Globe} iconColor="text-rose-600" iconBg="bg-rose-50">
                        <div className="space-y-2">
                            {topIps.length === 0 && <p className="text-xs text-gray-400">No data yet.</p>}
                            {topIps.map(([ip, cnt], i) => (
                                <div key={ip} className="flex items-center gap-2 text-xs">
                                    <span className="text-gray-300 font-bold w-4">{i + 1}</span>
                                    <span className="font-mono text-gray-700 dark:text-foreground flex-1">{ip}</span>
                                    <span className="font-black text-indigo-600">{cnt}</span>
                                    <button
                                        onClick={() => { setActiveTab("block"); setBlockIp(ip); setBlockReason(`Top attacker — ${cnt} events`); }}
                                        className="text-[9px] font-black uppercase tracking-wider text-rose-600 border border-rose-200 rounded-lg px-2 py-0.5 hover:bg-rose-50 transition-colors">
                                        Block
                                    </button>
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex border-b border-gray-100 dark:border-border gap-0">
                {[
                    { id: "feed",    label: "All Logs",                        icon: Activity },
                    { id: "blocked", label: `Blocked IPs (${blockedIps.length})`, icon: Ban },
                    { id: "block",   label: "Block IP",                         icon: Lock },
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
                            activeTab === tab.id
                                ? "border-indigo-600 text-indigo-600"
                                : "border-transparent text-gray-400 hover:text-gray-700"
                        }`}>
                        <tab.icon className="h-3.5 w-3.5" />{tab.label}
                    </button>
                ))}
            </div>

            {/* ── All Logs ── */}
            {activeTab === "feed" && (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {allLogs.length === 0 && (
                        <div className="text-center py-12 text-gray-400 text-sm font-bold">No events in database</div>
                    )}
                    {allLogs.map(log => {
                        const sev = SEV[log.severity] || SEV.LOW;
                        const evColor = EVENT_COLORS[log.event] || "text-gray-500";
                        const isOpen = expanded === log.id;
                        return (
                            <div key={log.id} className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border shadow-sm overflow-hidden">
                                <button
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-muted/40 transition-colors"
                                    onClick={() => setExpanded(isOpen ? null : log.id)}>
                                    <div className={`h-2 w-2 rounded-full shrink-0 ${sev.dot}`} />
                                    <span className={`text-[9px] font-black border rounded-md px-1.5 py-0.5 shrink-0 ${sev.textBg} border-current`}>{log.severity}</span>
                                    <span className={`text-xs font-bold shrink-0 w-32 truncate ${evColor}`}>{log.event}</span>
                                    <span className="text-xs font-mono text-gray-400 shrink-0 w-24">{log.ip}</span>
                                    <span className="text-xs text-gray-400 truncate flex-1">{log.description}</span>
                                    <span className="text-[10px] text-gray-300 shrink-0">{formatTs(log.createdAt)}</span>
                                    {isOpen ? <ChevronUp className="h-3.5 w-3.5 text-gray-300 shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-300 shrink-0" />}
                                </button>
                                {isOpen && (
                                    <div className="px-4 pb-4 pt-3 border-t border-gray-50 dark:border-border/30 bg-gray-50/50 dark:bg-muted/20 space-y-2">
                                        {[["IP Address", log.ip], ["Event", log.event], ["Severity", log.severity], ["Description", log.description], ["User Agent", log.userAgent || "—"], ["Timestamp", new Date(log.createdAt).toLocaleString()]].map(([k, v]) => (
                                            <div key={k} className="flex gap-4 text-xs">
                                                <span className="text-gray-400 font-bold w-24 shrink-0">{k}</span>
                                                <span className="text-gray-700 dark:text-foreground break-all font-mono">{v}</span>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => { setActiveTab("block"); setBlockIp(log.ip); setBlockReason(`IDS: ${log.event}`); }}
                                            className="mt-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-rose-600 border border-rose-200 rounded-lg px-3 py-1.5 hover:bg-rose-50 transition-colors">
                                            <Ban className="h-3 w-3" /> Block This IP
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Blocked IPs ── */}
            {activeTab === "blocked" && (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {blockedIps.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                            <CheckCircle2 className="h-10 w-10 mb-2" />
                            <p className="text-sm font-bold text-gray-400">No blocked IPs</p>
                        </div>
                    )}
                    {blockedIps.map(b => (
                        <div key={b.id} className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border shadow-sm flex items-center justify-between p-4">
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <Ban className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                                    <span className="font-black text-gray-900 dark:text-foreground font-mono text-sm">{b.ip}</span>
                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${b.expiresAt ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                                        {b.expiresAt ? "TEMP" : "PERM"}
                                    </span>
                                </div>
                                {b.reason && <p className="text-xs text-gray-400 ml-5">{b.reason}</p>}
                                {b.expiresAt && (
                                    <p className="text-[10px] text-gray-300 ml-5 flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> Expires {new Date(b.expiresAt).toLocaleString()}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => handleUnblock(b.ip)}
                                className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-600 border border-emerald-200 rounded-xl px-3 py-1.5 hover:bg-emerald-50 transition-colors">
                                <Unlock className="h-3.5 w-3.5" /> Unblock
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Block IP ── */}
            {activeTab === "block" && (
                <div className="max-w-md">
                    <SectionCard title="Manual IP Block" subtitle="Manually block an IP address from the system" icon={Lock} iconColor="text-rose-600" iconBg="bg-rose-50">
                        <div className="space-y-4">
                            {[
                                { label: "IP Address *", placeholder: "e.g. 203.0.113.0", value: blockIp, set: setBlockIp, type: "text" },
                                { label: "Reason", placeholder: "e.g. Repeated scan attempts", value: blockReason, set: setBlockReason, type: "text" },
                                { label: "Duration (hours) — leave blank for permanent", placeholder: "e.g. 24", value: blockDuration, set: setBlockDuration, type: "number" },
                            ].map(f => (
                                <div key={f.label} className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{f.label}</label>
                                    <input
                                        type={f.type}
                                        placeholder={f.placeholder}
                                        value={f.value}
                                        onChange={e => f.set(e.target.value)}
                                        className="w-full border border-gray-200 dark:border-border rounded-xl px-3 py-2.5 text-sm font-mono text-gray-800 dark:text-foreground placeholder:text-gray-300 bg-white dark:bg-background outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 transition-all"
                                    />
                                </div>
                            ))}
                            <button
                                onClick={handleBlock}
                                disabled={isBlocking}
                                className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-black transition-colors shadow-sm shadow-rose-600/20">
                                <Ban className="h-4 w-4" />
                                {isBlocking ? "Blocking..." : "Block IP Address"}
                            </button>
                        </div>
                    </SectionCard>
                </div>
            )}
        </div>
    );
}
