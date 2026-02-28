"use client"
import React, { useState, useMemo } from "react";
import { format, parseISO, isSameMonth, isValid, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import {
    Activity,
    DollarSign,
    TrendingUp,
    PieChart as PieChartIcon,
    Wallet,
    Download,
    Calendar,
    Building2,
    ShieldCheck,
    CheckCircle2,
    Undo2,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    Zap,
    Banknote,
    Layers,
    RefreshCcw,
    Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAllPayments } from "@/hooks/usePayment";
import Loader from "@/components/ui/Loader";
import { useHostel } from "@/hooks/usehostel";
// Dynamically import recharts to avoid SSR hydration issues
import dynamic from "next/dynamic";
import { toast } from "sonner";

const RechartsResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const RechartsXAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const RechartsYAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const RechartsCartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const RechartsTooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const RechartsAreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const RechartsArea = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false });
const RechartsPieChart = dynamic(() => import('recharts').then(mod => mod.PieChart), { ssr: false });
const RechartsPie = dynamic(() => import('recharts').then(mod => mod.Pie), { ssr: false });
const RechartsCell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false });

const COLORS = {
    indigo: '#4f46e5',
    emerald: '#10b981',
    amber: '#f59e0b',
    rose: '#ef4444',
    blue: '#3b82f6',
    purple: '#8b5cf6',
    gray: '#9ca3af'
};

const PIE_COLORS = [COLORS.indigo, COLORS.emerald, COLORS.blue, COLORS.purple];

export default function PaymentAnalyticsPage() {
    const [selectedHostel, setSelectedHostel] = useState("all");
    const [timeFilter, setTimeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");

    const { data: paymentsData, isLoading: paymentsLoading } = useAllPayments({ limit: 10000, hostelId: selectedHostel !== 'all' ? selectedHostel : null });
    const { data: hostelsData } = useHostel();
    const hostels = hostelsData?.hostels || [];
    const payments = paymentsData?.payments || [];

    const resetFilters = () => {
        setSelectedHostel("all");
        setTimeFilter("all");
        setStatusFilter("all");
        setTypeFilter("all");
    };

    // Advanced Filtering Logic
    const filteredPayments = useMemo(() => {
        let result = payments;

        if (timeFilter !== "all") {
            const now = new Date();
            result = result.filter(p => {
                const date = p.date ? new Date(p.date) : new Date(p.createdAt);
                if (!isValid(date)) return true;
                if (timeFilter === "this_month") return isSameMonth(date, now);
                if (timeFilter === "last_month") {
                    const last = subMonths(now, 1);
                    return isSameMonth(date, last);
                }
                if (timeFilter === "this_year") return date.getFullYear() === now.getFullYear();
                return true;
            });
        }

        if (statusFilter !== "all") {
            result = result.filter(p => p.status === statusFilter);
        }

        if (typeFilter !== "all") {
            result = result.filter(p => {
                const type = p.type || 'UNKNOWN';
                const normalized = (type === 'MONTHLY' || type === 'RENT') ? 'Rent' :
                    (type === 'SECURITY_DEPOSIT') ? 'Security' :
                        (type === 'OTHERS' || type === 'EXTRA') ? 'Other' : type;
                return normalized === typeFilter;
            });
        }

        return result;
    }, [payments, timeFilter, statusFilter, typeFilter, selectedHostel]);

    // Financial Metrics Calculation
    const financialData = useMemo(() => {
        let grossVolume = 0;
        let pendingVolume = 0;
        let refundVolume = 0;
        let successfulTx = 0;
        let previousPeriodVolume = 0;

        const monthlyRaw = {};
        const methodVolume = {};
        const typeVolume = {};
        const statusCount = { PAID: 0, PENDING: 0, REJECTED: 0, REFUNDED: 0 };
        const residentImpact = {};

        const now = new Date();
        const prevPeriodStart = startOfMonth(subMonths(now, 1));
        const prevPeriodEnd = endOfMonth(subMonths(now, 1));

        filteredPayments.forEach(p => {
            const amount = Number(p.amount) || 0;
            const status = p.status || 'UNKNOWN';
            const type = p.type || 'UNKNOWN';
            const method = p.method || 'UNKNOWN';
            const date = p.date ? new Date(p.date) : new Date(p.createdAt);

            statusCount[status] = (statusCount[status] || 0) + 1;

            if (status === 'PAID') {
                grossVolume += amount;
                successfulTx++;

                // Categorization
                const nType = (type === 'MONTHLY' || type === 'RENT') ? 'Rent' :
                    (type === 'SECURITY_DEPOSIT') ? 'Security' : 'Other';
                typeVolume[nType] = (typeVolume[nType] || 0) + amount;
                methodVolume[method] = (methodVolume[method] || 0) + amount;

                // Timeline
                if (isValid(date)) {
                    const mKey = format(date, 'MMM yyyy');
                    monthlyRaw[mKey] = (monthlyRaw[mKey] || 0) + amount;

                    // Comparative Period
                    if (isWithinInterval(date, { start: prevPeriodStart, end: prevPeriodEnd })) {
                        previousPeriodVolume += amount;
                    }
                }

                // Resident Level
                const uId = p.userId || 'unknown';
                if (!residentImpact[uId]) residentImpact[uId] = { name: p.User?.name || 'Resident', total: 0, count: 0 };
                residentImpact[uId].total += amount;
                residentImpact[uId].count++;
            } else if (status === 'PENDING' || status === 'PARTIAL') {
                pendingVolume += amount;
            } else if (status === 'REFUNDED') {
                refundVolume += amount;
            }
        });

        // Format Charts
        const timeline = Object.keys(monthlyRaw).map(k => {
            const [mon, yr] = k.split(' ');
            return { raw: new Date(`${mon} 1, ${yr}`), name: k, amount: monthlyRaw[k] };
        }).sort((a, b) => a.raw - b.raw).map(d => ({ name: d.name, amount: d.amount }));

        const typeMix = Object.entries(typeVolume).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
        const methodMix = Object.entries(methodVolume).map(([name, value]) => ({ name, value, percentage: (value / grossVolume) * 100 })).sort((a, b) => b.value - a.value);
        const leadingResidents = Object.values(residentImpact).sort((a, b) => b.total - a.total).slice(0, 5);

        // Trend
        const growth = previousPeriodVolume > 0 ? ((grossVolume - previousPeriodVolume) / previousPeriodVolume) * 100 : (grossVolume > 0 ? 100 : 0);

        return {
            grossVolume,
            pendingVolume,
            refundVolume,
            growth,
            successfulTx,
            totalTx: filteredPayments.length,
            timeline,
            typeMix,
            methodMix,
            statusCount,
            leadingResidents
        };
    }, [filteredPayments]);

    const handleExport = () => {
        const headers = ["ID", "Resident", "Hostel", "Type", "Month/Year", "Amount", "Method", "Status", "Date", "Notes"];
        const rows = filteredPayments.map(p => [
            p.id,
            `"${p.User?.name || "Unknown"}"`,
            `"${p.Booking?.Room?.Hostel?.name || "N/A"}"`,
            (p.type === 'MONTHLY' || p.type === 'RENT') ? 'Rent' :
                (p.type === 'SECURITY_DEPOSIT') ? 'Security Deposit' : p.type,
            `${p.month || '-'}/${p.year || '-'}`,
            p.amount,
            p.method || 'CASH',
            p.status,
            p.date ? format(new Date(p.date), 'dd MMM yyyy') : '-',
            `"${(p.notes || "").replace(/"/g, '""')}"`
        ]);

        const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `payment_analytics_${format(new Date(), 'yyyyMMdd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Analytics CSV Exported!");
    };

    if (paymentsLoading) return <Loader label="Crunching ledger data..." subLabel="Applying filters and generating insights..." icon={Layers} fullScreen={false} />;

    const formatCurrency = (val) => {
        if (val >= 10000000) return `PKR ${(val / 10000000).toFixed(1)}Cr`;
        if (val >= 100000) return `PKR ${(val / 100000).toFixed(1)}L`;
        return `PKR ${val.toLocaleString()}`;
    };

    const CustomAreaTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white border border-gray-100 p-3 rounded-2xl shadow-lg">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">{label}</p>
                    <p className="text-sm font-black text-gray-900 tracking-tight">{formatCurrency(payload[0].value)}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight print:hidden">

            {/* Premium Header - Synchronized Design */}
            <div className="bg-white border-b sticky top-0 z-50 py-2 md:h-16">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-full flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="h-8 w-1 bg-indigo-600 rounded-full shrink-0" />
                        <div className="flex flex-col">
                            <h1 className="text-sm md:text-lg font-bold text-gray-900 tracking-tight uppercase">Payment Analytics</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-gray-400">Hostel</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-emerald-600">Live</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                        <Button
                            variant="outline"
                            className="h-9 px-3 md:px-4 rounded-xl border-gray-200 bg-white font-bold text-[9px] md:text-[10px] uppercase tracking-wider text-gray-600 flex-1 sm:flex-none flex items-center justify-center gap-2 hover:bg-gray-50"
                            onClick={handleExport}
                        >
                            <Download className="h-3.5 w-3.5 text-gray-400" /> <span className="hidden sm:inline">Export CSV</span><span className="inline sm:hidden">CSV</span>
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-6 md:space-y-8">

                {/* Metrics Matrix - Standardized Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {[
                        { label: 'Gross Volume', value: `PKR ${(financialData.grossVolume / 1000).toFixed(1)}k`, fullValue: formatCurrency(financialData.grossVolume), icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50', trend: financialData.growth },
                        { label: 'Pending', value: `PKR ${(financialData.pendingVolume / 1000).toFixed(1)}k`, fullValue: formatCurrency(financialData.pendingVolume), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Clearance Rate', value: `${financialData.totalTx > 0 ? ((financialData.successfulTx / financialData.totalTx) * 100).toFixed(1) : 0}%`, fullValue: `${financialData.totalTx > 0 ? ((financialData.successfulTx / financialData.totalTx) * 100).toFixed(1) : 0}%`, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Refunds', value: `PKR ${(financialData.refundVolume / 1000).toFixed(1)}k`, fullValue: formatCurrency(financialData.refundVolume), icon: Undo2, color: 'text-rose-600', bg: 'bg-rose-50' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl md:rounded-3xl p-4 md:p-5 flex items-center justify-between shadow-sm group hover:shadow-md transition-shadow min-w-0">
                            <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                                <div className={`h-9 w-9 md:h-11 md:w-11 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                                    <stat.icon className="h-4 w-4 md:h-5 md:w-5" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{stat.label}</span>
                                    <span className="text-sm md:text-xl font-bold text-gray-900 tracking-tight truncate hidden md:block">{stat.fullValue}</span>
                                    <span className="text-sm md:text-xl font-bold text-gray-900 tracking-tight truncate block md:hidden">{stat.value}</span>
                                </div>
                            </div>
                            {stat.trend !== undefined && (
                                <div className={`shrink-0 ml-2 px-2 py-1 flex items-center rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest ${stat.trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                    {stat.trend >= 0 ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                                    {Math.abs(stat.trend).toFixed(1)}%
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Operations Bar - Unified Search & Filter */}
                <div className="bg-white border border-gray-100 rounded-2xl p-2 flex flex-col md:flex-row items-center gap-2 md:gap-4 shadow-sm w-full relative z-40">
                    <div className="flex-1 w-full pl-2 hidden md:block">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Filter className="w-3.5 h-3.5" /> Data Filters
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 md:gap-2 p-1 bg-gray-50 rounded-xl w-full md:w-auto overflow-x-auto scrollbar-hide">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-9 md:h-10 px-3 md:px-4 rounded-lg font-bold text-[9px] md:text-[10px] uppercase tracking-wider text-gray-500 flex-1 md:flex-none hover:bg-gray-100">
                                    <Building2 className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                    <span className="truncate">{selectedHostel === 'all' ? 'Hostel' : hostels.find(h => h.id === selectedHostel)?.name}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[200px] rounded-xl z-[100]">
                                <DropdownMenuItem onClick={() => setSelectedHostel('all')} className="text-[10px] font-bold uppercase tracking-wider">All Hostels</DropdownMenuItem>
                                {hostels.map(h => (
                                    <DropdownMenuItem key={h.id} onClick={() => setSelectedHostel(h.id)} className="text-[10px] font-bold uppercase tracking-wider">
                                        {h.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-9 md:h-10 px-3 md:px-4 rounded-lg font-bold text-[9px] md:text-[10px] uppercase tracking-wider text-gray-500 flex-1 md:flex-none hover:bg-gray-100">
                                    <Zap className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                    <span className="truncate">{typeFilter === 'all' ? 'Type' : typeFilter}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[180px] rounded-xl z-[100]">
                                <DropdownMenuItem onClick={() => setTypeFilter('all')} className="text-[10px] font-bold uppercase tracking-wider">All Types</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTypeFilter('Rent')} className="text-[10px] font-bold uppercase tracking-wider">Rent</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTypeFilter('Security')} className="text-[10px] font-bold uppercase tracking-wider">Security</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTypeFilter('Other')} className="text-[10px] font-bold uppercase tracking-wider">Other</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-9 md:h-10 px-3 md:px-4 rounded-lg font-bold text-[9px] md:text-[10px] uppercase tracking-wider text-gray-500 flex-1 md:flex-none hover:bg-gray-100">
                                    <ShieldCheck className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                    <span className="truncate">{statusFilter === 'all' ? 'Status' : statusFilter}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[180px] rounded-xl z-[100]">
                                <DropdownMenuItem onClick={() => setStatusFilter('all')} className="text-[10px] font-bold uppercase tracking-wider">All Status</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter('PAID')} className="text-[10px] font-bold uppercase tracking-wider">Paid</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter('PENDING')} className="text-[10px] font-bold uppercase tracking-wider">Pending</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter('REJECTED')} className="text-[10px] font-bold uppercase tracking-wider">Rejected</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter('REFUNDED')} className="text-[10px] font-bold uppercase tracking-wider">Refunded</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-9 md:h-10 px-3 md:px-4 rounded-lg font-bold text-[9px] md:text-[10px] uppercase tracking-wider text-gray-500 flex-1 md:flex-none hover:bg-gray-100">
                                    <Calendar className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                    <span className="truncate">{timeFilter === 'all' ? 'Time' : timeFilter.replace('_', ' ')}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[180px] rounded-xl z-[100]">
                                <DropdownMenuItem onClick={() => setTimeFilter('all')} className="text-[10px] font-bold uppercase tracking-wider">Lifetime</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTimeFilter('this_month')} className="text-[10px] font-bold uppercase tracking-wider">This Month</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTimeFilter('last_month')} className="text-[10px] font-bold uppercase tracking-wider">Last Month</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTimeFilter('this_year')} className="text-[10px] font-bold uppercase tracking-wider">This Year</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="h-5 w-px bg-gray-200 mx-1 hidden md:block" />

                        <Button variant="ghost" size="icon" onClick={resetFilters} className="h-9 w-9 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors shrink-0">
                            <RefreshCcw className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 relative z-30">

                    {/* BIG REVENUE CHART */}
                    <div className="lg:col-span-2 bg-white border border-gray-100 shadow-sm rounded-2xl md:rounded-3xl overflow-hidden min-w-0 flex flex-col">
                        <div className="p-6 md:p-8 border-b border-gray-50 flex items-center justify-between bg-white">
                            <div>
                                <h3 className="text-sm md:text-base font-black text-gray-900 tracking-tight uppercase">Timeline</h3>
                                <p className="text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Monthly collection trajectory</p>
                            </div>
                            <div className="flex items-center gap-4 hidden sm:flex">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-indigo-600" />
                                    <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Revenue</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 md:p-8 pb-4 flex-1">
                            <div className="h-[250px] md:h-[320px] w-full">
                                {financialData.timeline.length > 0 ? (
                                    <RechartsResponsiveContainer width="100%" height="100%">
                                        <RechartsAreaChart data={financialData.timeline} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="premiumGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={COLORS.indigo} stopOpacity={0.15} />
                                                    <stop offset="95%" stopColor={COLORS.indigo} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <RechartsCartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f3f4f6" />
                                            <RechartsXAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }}
                                                dy={15}
                                            />
                                            <RechartsYAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }}
                                                tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : v}
                                            />
                                            <RechartsTooltip content={<CustomAreaTooltip />} cursor={{ stroke: COLORS.indigo, strokeWidth: 1.5, strokeDasharray: '4 4' }} />
                                            <RechartsArea
                                                type="monotone"
                                                dataKey="amount"
                                                stroke={COLORS.indigo}
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#premiumGradient)"
                                                animationDuration={1500}
                                            />
                                        </RechartsAreaChart>
                                    </RechartsResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center space-y-3 opacity-30">
                                        <Activity className="w-12 h-12 text-gray-400" />
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No timeline data</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* REVENUE MIX DOUGHNUT */}
                    <div className="lg:col-span-1 bg-white border border-gray-100 shadow-sm rounded-2xl md:rounded-3xl flex flex-col overflow-hidden min-w-0">
                        <div className="p-6 md:p-8 border-b border-gray-50 flex items-center justify-between">
                            <h3 className="text-sm md:text-base font-black text-gray-900 tracking-tight uppercase">Breakdown</h3>
                            <PieChartIcon className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="p-6 md:p-8 flex-1 space-y-6 md:space-y-8 flex flex-col justify-center">

                            <div className="relative h-[180px] md:h-[200px]">
                                {financialData.typeMix.length > 0 ? (
                                    <>
                                        <RechartsResponsiveContainer width="100%" height="100%">
                                            <RechartsPieChart>
                                                <RechartsPie
                                                    data={financialData.typeMix}
                                                    innerRadius={65}
                                                    outerRadius={85}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {financialData.typeMix.map((_, i) => (
                                                        <RechartsCell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                                    ))}
                                                </RechartsPie>
                                                <RechartsTooltip content={<CustomAreaTooltip />} />
                                            </RechartsPieChart>
                                        </RechartsResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter text-center">Gross<br />Mix</p>
                                        </div>
                                    </>
                                ) : <div className="h-full flex items-center justify-center text-[10px] font-bold text-gray-300 uppercase">Awaiting Data</div>}
                            </div>

                            <div className="space-y-3 md:space-y-4">
                                <div className="grid grid-cols-1 gap-3 md:gap-4">
                                    {financialData.typeMix.map((d, i) => (
                                        <div key={d.name} className="flex items-center justify-between group cursor-default">
                                            <div className="flex items-center gap-3">
                                                <div className="h-2 w-2 md:h-2.5 md:w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                                <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest group-hover:text-gray-900 transition-colors">{d.name}</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[11px] font-black text-gray-900">{((d.value / financialData.grossVolume) * 100).toFixed(1)}%</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* BOTTOM ROW */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 pb-10">

                    {/* PAYMENT METHOD EFFICIENCY */}
                    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl md:rounded-3xl overflow-hidden min-w-0">
                        <div className="p-6 md:p-8 flex items-center justify-between border-b border-gray-50">
                            <div>
                                <h3 className="text-sm md:text-base font-black text-gray-900 tracking-tight uppercase">Channels</h3>
                                <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Gateway performance</p>
                            </div>
                            <Wallet className="w-4 h-4 md:w-5 md:h-5 text-gray-300" />
                        </div>
                        <div className="p-6 md:p-8">
                            <div className="space-y-6">
                                {financialData.methodMix.map((method, i) => (
                                    <div key={method.name} className="flex flex-col gap-2 md:gap-3 group">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 md:gap-3">
                                                <div className="h-6 w-6 md:h-8 md:w-8 rounded-lg md:rounded-xl flex items-center justify-center bg-gray-50 text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                    <Banknote className="h-3 w-3 md:h-4 md:w-4" />
                                                </div>
                                                <span className="text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-tight">{method.name.replace('_', ' ')}</span>
                                            </div>
                                            <span className="text-[10px] md:text-[11px] font-black text-gray-900">{method.percentage.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 h-1.5 md:h-2 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-1000 bg-indigo-500"
                                                style={{ width: `${method.percentage}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                            <p>Volume</p>
                                            <p>{formatCurrency(method.value)}</p>
                                        </div>
                                    </div>
                                ))}
                                {financialData.methodMix.length === 0 && (
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center py-4">No channel data</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* TOP RESIDENTS LIST */}
                    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl md:rounded-3xl overflow-hidden min-w-0">
                        <div className="p-6 md:p-8 pb-4 border-b border-gray-50 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm md:text-base font-black text-gray-900 tracking-tight uppercase">Top Contributors</h3>
                                <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Highest impact</p>
                            </div>
                            <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-gray-300" />
                        </div>
                        <div className="p-4">
                            <div className="space-y-1">
                                {financialData.leadingResidents.map((user, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl hover:bg-gray-50 transition-all group">
                                        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                                            <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-gray-100 flex items-center justify-center font-black text-gray-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors uppercase text-xs md:text-sm shrink-0">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div className="min-w-0 pr-4">
                                                <p className="text-xs md:text-sm font-black text-gray-900 tracking-tight uppercase truncate">{user.name}</p>
                                                <p className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest truncate">{user.count} txns</p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-xs md:text-sm font-black text-gray-900 leading-none">PKR {user.total.toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                                {financialData.leadingResidents.length === 0 && (
                                    <div className="py-10 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">No contributor data</div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
