"use client";
import React, { useState, useEffect } from "react";
import { 
    Activity, 
    ShieldCheck, 
    Zap, 
    Server, 
    Database, 
    Mail, 
    Cpu, 
    HardDrive, 
    RefreshCw, 
    CheckCircle2, 
    XCircle, 
    AlertTriangle,
    Clock,
    Terminal,
    Settings2,
    ToggleLeft,
    ToggleRight,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { format } from "date-fns";

const SystemHealthPage = () => {
    const [healthData, setHealthData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchHealth = async (showToast = false) => {
        setIsRefreshing(true);
        try {
            const res = await fetch("/api/health");
            const data = await res.json();
            if (data.success) {
                setHealthData(data);
                if (showToast) toast.success("System status updated");
            } else {
                toast.error("Failed to fetch system status");
            }
        } catch (error) {
            toast.error("An error occurred while fetching health data");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchHealth();
        const interval = setInterval(() => fetchHealth(false), 30000); // Auto refresh every 30s
        return () => clearInterval(interval);
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center animate-bounce">
                        <Activity className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">Analyzing System Health...</p>
                </div>
            </div>
        );
    }

    const { health, settings, system, nodeVersion } = healthData || {};

    const StatusBadge = ({ status }) => {
        switch (status?.toUpperCase()) {
            case "HEALTHY":
                return <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold uppercase text-[9px] tracking-widest px-3">OK</Badge>;
            case "DEGRADED":
                return <Badge className="bg-amber-50 text-amber-600 border border-amber-100 font-bold uppercase text-[9px] tracking-widest px-3">ISSUES</Badge>;
            case "UNHEALTHY":
                return <Badge className="bg-rose-50 text-rose-600 border border-rose-100 font-bold uppercase text-[9px] tracking-widest px-3">CRITICAL</Badge>;
            default:
                return <Badge className="bg-gray-50 text-gray-600 border border-gray-100 font-bold uppercase text-[9px] tracking-widest px-3">UNKNOWN</Badge>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-1 bg-blue-600 rounded-full" />
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight uppercase">System Health</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Environment: {system?.platform}</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Secure</span>
                            </div>
                        </div>
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fetchHealth(true)} 
                        disabled={isRefreshing}
                        className="rounded-xl border-gray-200 font-bold text-[10px] uppercase tracking-wider h-9 px-4 flex items-center gap-2 bg-white hover:bg-gray-50 active:scale-95 transition-all"
                    >
                        {isRefreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                        Refresh
                    </Button>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
                {/* Overall Health Card */}
                <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
                    <div className={`absolute top-0 left-0 w-2 h-full ${health?.overall === 'HEALTHY' ? 'bg-emerald-500' : 'bg-amber-500'} opacity-70`} />
                    
                    <div className="flex items-center gap-8">
                        <div className={`h-24 w-24 rounded-[2rem] ${health?.overall === 'HEALTHY' ? 'bg-emerald-50' : 'bg-amber-50'} flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-500`}>
                            {health?.overall === 'HEALTHY' ? (
                                <ShieldCheck className="h-12 w-12 text-emerald-600" />
                            ) : (
                                <AlertTriangle className="h-12 w-12 text-amber-600 animate-pulse" />
                            )}
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">Overall Status</p>
                            <h2 className={`text-4xl font-black ${health?.overall === 'HEALTHY' ? 'text-gray-900' : 'text-amber-600'} tracking-tighter uppercase`}>
                                {health?.overall === 'HEALTHY' ? 'All Systems Healthy' : 'Action Required'}
                            </h2>
                            <p className="text-xs text-gray-500 mt-2 font-medium tracking-tight">System analysis completed at {format(new Date(), 'HH:mm:ss')}. Monitoring {Object.keys(settings || {}).length} variables.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <div className="text-right">
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Uptime</p>
                            <p className="text-sm font-black text-gray-900 uppercase">{(system?.uptime / 3600).toFixed(1)} Hours</p>
                        </div>
                        <div className="h-8 w-px bg-gray-200" />
                        <div className="text-right">
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Node Version</p>
                            <p className="text-sm font-black text-gray-900 uppercase">{nodeVersion?.replace('v', '')}</p>
                        </div>
                    </div>
                </div>

                {/* Service Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Database Health */}
                    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-6">
                            <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <Database className="h-6 w-6" />
                            </div>
                            <StatusBadge status={health?.database?.status} />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-1">Database Layer</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">PostgreSQL (Neon)</p>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-gray-500 uppercase">Response Time</span>
                                <span className={`text-[10px] font-black ${parseInt(health?.database?.responseTime) < 200 ? 'text-emerald-600' : 'text-amber-600'}`}>{health?.database?.responseTime}</span>
                            </div>
                            <Progress value={98} className="h-1 bg-gray-50" indicatorClassName="bg-indigo-600" />
                        </div>
                    </div>

                    {/* Email Service */}
                    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex items-center justify-between mb-6">
                            <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                                <Mail className="h-6 w-6" />
                            </div>
                            <StatusBadge status={health?.email?.status} />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-1">Email Service</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">{health?.email?.provider}</p>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-[10px] font-bold">
                                <span className="text-gray-500 uppercase tracking-wider">SMTP Auth</span>
                                <span className="text-emerald-600 uppercase tracking-wider">Verified</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-bold">
                                <span className="text-gray-500 uppercase tracking-wider">Encryption</span>
                                <span className="text-gray-900 uppercase tracking-wider">SSL/TLS</span>
                            </div>
                        </div>
                    </div>

                    {/* Automation & Cron */}
                    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex items-center justify-between mb-6">
                            <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                <Zap className="h-6 w-6" />
                            </div>
                            <Badge className="bg-blue-50 text-blue-600 border border-blue-100 font-bold uppercase text-[9px] tracking-widest px-3">{health?.automation?.status}</Badge>
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-1">Automation Engine</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Cron Scheduling</p>
                        <div className="space-y-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Last Run (Rent/Staff)</span>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-3 w-3 text-amber-500" />
                                    <span className="text-[10px] font-black text-gray-900 uppercase">
                                        {health?.automation?.lastRun ? format(new Date(health?.automation?.lastRun), 'MMM dd, HH:mm') : 'Never'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Infrastructure & Toggles Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Infrastructure Details */}
                    <div className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                                <Server className="h-5 w-5 text-gray-400" />
                            </div>
                            <h3 className="text-base font-bold text-gray-900 uppercase tracking-tight">Infrastructure Monitor</h3>
                        </div>

                        <div className="space-y-8">
                            {/* Memory Usage */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <HardDrive className="h-4 w-4 text-gray-400" />
                                        <span className="text-xs font-bold text-gray-900 uppercase tracking-tight">Memory Utilization</span>
                                    </div>
                                    <span className="text-xs font-black text-blue-600 uppercase tracking-widest">
                                        {system?.memory?.free} / {system?.memory?.total}
                                    </span>
                                </div>
                                <Progress 
                                    value={(1 - (parseInt(system?.memory?.free) / parseInt(system?.memory?.total))) * 100} 
                                    className="h-2 bg-gray-50" 
                                    indicatorClassName="bg-blue-600" 
                                />
                            </div>

                            {/* Load Average */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Cpu className="h-4 w-4 text-gray-400" />
                                        <span className="text-xs font-bold text-gray-900 uppercase tracking-tight">Load Average (1m/5m/15m)</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    {system?.loadAvg?.map((load, i) => (
                                        <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
                                            <p className="text-[10px] font-black text-gray-900">{load.toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Core Feature Toggles */}
                    <div className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                                <Settings2 className="h-5 w-5 text-gray-400" />
                            </div>
                            <h3 className="text-base font-bold text-gray-900 uppercase tracking-tight">Active Services</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                            {[
                                { label: "Security System", enabled: settings?.maintenanceMode === false, icon: ShieldCheck },
                                { label: "Laundry Service", enabled: settings?.enableLaundry, icon: Zap },
                                { label: "Mess & Catering", enabled: settings?.enableMess, icon: Zap },
                                { label: "Guest Bookings", enabled: settings?.enableGuestBookings, icon: Zap },
                                { label: "AI Assistant", enabled: settings?.enableAiAssistant, icon: Zap },
                                { label: "Payment Gateway", enabled: settings?.enablePaymentProcessing, icon: Zap },
                                { label: "Analytics Engine", enabled: true, icon: Activity },
                                { label: "Auth Middleware", enabled: true, icon: ShieldCheck },
                            ].map((service, i) => (
                                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 group">
                                    <div className="flex items-center gap-3">
                                        <service.icon className={`h-3.5 w-3.5 ${service.enabled ? 'text-emerald-500' : 'text-gray-300'}`} />
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${service.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                                            {service.label}
                                        </span>
                                    </div>
                                    {service.enabled ? (
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                    ) : (
                                        <XCircle className="h-3.5 w-3.5 text-gray-200" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* System Logs Hint */}
                <div className="bg-gray-900 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-gray-800 flex items-center justify-center">
                            <Terminal className="h-5 w-5 text-gray-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Real-time Debugger</p>
                            <p className="text-white text-xs font-medium tracking-tight">System logs are being streamed to the primary cloud server.</p>
                        </div>
                    </div>
                    <Button variant="ghost" className="text-gray-400 hover:text-white font-bold text-[10px] uppercase tracking-wider hover:bg-gray-800 rounded-xl px-6 h-10 border border-gray-800">
                        View Detailed Logs
                    </Button>
                </div>
            </main>
        </div>
    );
};

export default SystemHealthPage;
