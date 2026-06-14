"use client"
import React, { useState } from "react";
import Link from "next/link";
import {
    Download, TrendingUp, TrendingDown, Users, Home, Calendar,
    Activity, Building2, CreditCard, ArrowUpRight, Zap, Wallet,
    BarChart3, Receipt, PieChart as PieChartIcon, DollarSign, FileSpreadsheet
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReportSkeleton } from "@/components/ui/skeletons";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useReports } from "@/hooks/useReports";
import { format } from "date-fns";
import { exportToExcel } from "@/lib/utils/exportToExcel";

// ─── Donut Chart ─────────────────────────────────────────────────────────────
const DonutChart = ({ data = [], colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#a855f7", "#3b82f6"] }) => {
    const total = data.reduce((s, d) => s + (d.value || 0), 0);

    if (!total) return (
        <div className="flex flex-col items-center justify-center h-44 gap-3">
            <PieChartIcon className="h-10 w-10 text-gray-100" />
            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">No Data</span>
        </div>
    );

    let cumulative = 0;
    const segments = data.map((d, i) => {
        const pct = d.value / total;
        const start = cumulative;
        cumulative += pct;
        const startAngle = start * 2 * Math.PI - Math.PI / 2;
        const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
        const r = 40;
        const cx = 50, cy = 50;
        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);
        const largeArc = pct > 0.5 ? 1 : 0;
        const path = pct >= 0.9999
            ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
            : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
        return { path, color: colors[i % colors.length], ...d };
    });

    return (
        <div className="flex flex-col gap-4">
            <div className="relative flex justify-center">
                <svg viewBox="0 0 100 100" className="w-36 h-36">
                    {segments.map((s, i) => (
                        <path key={i} d={s.path} fill={s.color} className="hover:opacity-80 transition-opacity cursor-pointer" />
                    ))}
                    <circle cx="50" cy="50" r="26" fill="white" />
                    <text x="50" y="47" textAnchor="middle" className="text-[6px]" style={{ fontSize: 7, fontWeight: 900, fill: '#111827' }}>
                        {Math.round(total / 1000)}K
                    </text>
                    <text x="50" y="56" textAnchor="middle" style={{ fontSize: 4.5, fontWeight: 700, fill: '#9ca3af', textTransform: 'uppercase' }}>
                        PKR Total
                    </text>
                </svg>
            </div>
            <div className="space-y-2">
                {segments.map((s, i) => (
                    <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                            <span className="text-[9px] font-bold text-gray-500 dark:text-muted-foreground uppercase tracking-tight truncate max-w-[110px]">{s.name}</span>
                        </div>
                        <span className="text-[9px] font-black text-gray-900 dark:text-foreground">PKR {(s.value || 0).toLocaleString()}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── Trend Bar Chart ─────────────────────────────────────────────────────────
const TrendBars = ({ data = [] }) => {
    if (!data.length) return (
        <div className="flex items-center justify-center h-48 text-gray-100">
            <BarChart3 className="h-14 w-14" />
        </div>
    );
    const maxVal = Math.max(...data.flatMap(d => [d.revenue || 0, d.expenses || 0, 1]));
    return (
        <div className="h-52 flex items-end gap-2 md:gap-3">
            {data.map((d, i) => {
                const revH = Math.max((d.revenue / maxVal) * 100, 1);
                const expH = Math.max((d.expenses / maxVal) * 100, 1);
                return (
                    <div key={i} className="flex-1 flex flex-col items-center group">
                        <div className="w-full flex items-end gap-0.5 md:gap-1 h-44">
                            <div
                                title={`Revenue: PKR ${d.revenue?.toLocaleString()}`}
                                className="flex-1 bg-indigo-500 rounded-t-md hover:bg-indigo-600 transition-colors cursor-pointer"
                                style={{ height: `${revH}%` }}
                            />
                            <div
                                title={`Expenses: PKR ${d.expenses?.toLocaleString()}`}
                                className="flex-1 bg-rose-400 rounded-t-md hover:bg-rose-500 transition-colors cursor-pointer"
                                style={{ height: `${expH}%` }}
                            />
                        </div>
                        <span className="mt-2 text-[8px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest">{d.month}</span>
                    </div>
                );
            })}
        </div>
    );
};

// ─── Mini Spark Bar ───────────────────────────────────────────────────────────
const SparkBar = ({ value = 0, color = "bg-indigo-500" }) => (
    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`${color} h-full rounded-full transition-all duration-700`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
);

// ─── Metric Card ─────────────────────────────────────────────────────────────
const MetricCard = ({ label, value, change, icon: Icon, color, subValue = null, subLabel = null }) => {
    const isPositive = Number(change) >= 0;
    return (
        <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group">
            <div className="flex items-center justify-between">
                <div className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-5 w-5" />
                </div>
                <Badge className={`text-[9px] font-black px-2 py-0.5 rounded-lg border-0 ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {isPositive ? '+' : ''}{change}%
                </Badge>
            </div>
            <div className="flex flex-col">
                <span className="text-[8px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest mb-1">{label}</span>
                <span className="text-xl font-black text-gray-900 dark:text-foreground tracking-tight leading-none">PKR {(value || 0).toLocaleString()}</span>
                {subValue !== null && (
                    <span className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground mt-2">
                        {subLabel}: <span className="text-gray-600 dark:text-muted-foreground font-black">PKR {(subValue || 0).toLocaleString()}</span>
                    </span>
                )}
            </div>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const ReportsPage = () => {
    const [selectedPeriod, setSelectedPeriod] = useState("month");
    const { data, isLoading } = useReports(selectedPeriod);

    if (isLoading) return <ReportSkeleton />;

    const stats = data?.overall || {
        totalRevenue: 0, revenueChange: 0,
        totalExpenses: 0, expenseChange: 0,
        netProfit: 0, profitChange: 0,
        occupancyRate: 0, occupancyChange: 0,
        projectedRevenue: 0
    };

    const performance = data?.hostelPerformance || [];
    const trends = data?.monthlyTrends || [];
    const expenseDist = data?.expenseDistribution || [];
    const revenueDist = data?.revenueDistribution || [];
    const utilityData = data?.utilityTrends || [];

    const handleExport = () => {
        if (!data) return;
        const headers = ["Hostel", "Rooms", "Occupied", "Occupancy %", "Revenue (PKR)", "Expenses (PKR)", "Profit (PKR)"];
        const rows = performance.map(h => [h.name, h.rooms, h.occupied, h.occupancy, h.revenue, h.expenses, h.profit]);
        const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        const a = document.createElement("a");
        a.href = url; a.download = `report_${selectedPeriod}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };

    const handleExportExcel = () => {
        if (!performance.length) return;
        const rows = performance.map(h => ({
            "Hostel": h.name,
            "Total Rooms": h.rooms,
            "Occupied": h.occupied,
            "Occupancy %": h.occupancy,
            "Revenue (PKR)": h.revenue,
            "Expenses (PKR)": h.expenses,
            "Net Profit (PKR)": h.profit,
        }));
        exportToExcel(rows, `report_${selectedPeriod}_${format(new Date(), 'yyyy-MM-dd')}`, "Hostel Performance");
    };

    return (
        <div className="min-h-screen bg-[#f5f5f7] pb-24 font-sans">

            {/* ── Header ── */}
            <header className="bg-white dark:bg-card/90 backdrop-blur-md border-b border-gray-100 dark:border-border sticky top-0 z-50">
                <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-6 w-1.5 bg-indigo-600 rounded-full" />
                        <div>
                            <h1 className="text-sm font-black text-gray-900 dark:text-foreground uppercase tracking-widest leading-none">Hostel Reports</h1>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Live Data</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                            <SelectTrigger className="h-9 w-36 rounded-xl border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/10 text-[10px] font-black uppercase tracking-wider text-gray-600 dark:text-muted-foreground shadow-none focus:ring-0">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-gray-100 dark:border-border shadow-2xl">
                                {[
                                    { value: "week", label: "This Week" },
                                    { value: "month", label: "This Month" },
                                    { value: "quarter", label: "This Quarter" },
                                    { value: "year", label: "This Year" },
                                ].map(o => (
                                    <SelectItem key={o.value} value={o.value} className="text-[10px] font-bold uppercase tracking-widest">{o.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            onClick={handleExport}
                            variant="outline"
                            className="h-9 px-5 rounded-xl border-gray-200 dark:border-border text-gray-600 dark:text-muted-foreground text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-muted/5 dark:bg-muted/10"
                        >
                            <Download className="h-3.5 w-3.5" />
                            CSV
                        </Button>
                        <Button
                            onClick={handleExportExcel}
                            className="h-9 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider shadow-md shadow-emerald-200 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <FileSpreadsheet className="h-3.5 w-3.5" />
                            Excel
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">

                {/* ── Hero + KPI Grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                    {/* Revenue Hero Card */}
                    <div className="lg:col-span-4 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-300/40 flex flex-col justify-between min-h-[220px]">
                        <div className="absolute -right-8 -top-8 opacity-10">
                            <TrendingUp className="h-48 w-48" />
                        </div>
                        <div>
                            <span className="text-[9px] font-black uppercase tracking-[0.25em] opacity-60">Total Revenue</span>
                            <div className="mt-3 flex items-baseline gap-3">
                                <span className="text-4xl font-black tracking-tighter leading-none">
                                    PKR {(stats.totalRevenue || 0).toLocaleString()}
                                </span>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${Number(stats.revenueChange) >= 0 ? 'bg-white dark:bg-card/20' : 'bg-rose-400/30'}`}>
                                    {Number(stats.revenueChange) >= 0 ? '+' : ''}{stats.revenueChange}%
                                </span>
                            </div>
                        </div>
                        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-[8px] font-bold uppercase opacity-50 tracking-widest block">Total Profit</span>
                                <span className="text-lg font-black tracking-tight mt-1 block">PKR {(stats.netProfit || 0).toLocaleString()}</span>
                            </div>
                            <div>
                                <span className="text-[8px] font-bold uppercase opacity-50 tracking-widest block">Next Month Estimate</span>
                                <span className="text-lg font-black tracking-tight mt-1 block">PKR {(stats.projectedRevenue || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* KPI Cards Grid */}
                    <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <MetricCard
                            label="Total Expenses"
                            value={stats.totalExpenses}
                            change={stats.expenseChange}
                            icon={CreditCard}
                            color="bg-rose-50 text-rose-600"
                        />
                        <MetricCard
                            label="Net Profit"
                            value={stats.netProfit}
                            change={stats.profitChange}
                            icon={TrendingUp}
                            color="bg-emerald-50 text-emerald-600"
                        />
                        <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-lg transition-all duration-300 group">
                            <div className="flex items-center justify-between">
                                <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <Home className="h-5 w-5" />
                                </div>
                                <Badge className="text-[9px] font-black px-2 py-0.5 rounded-lg border-0 bg-emerald-50 text-emerald-600">
                                    +{stats.occupancyChange}%
                                </Badge>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[8px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest">Occupancy Rate</span>
                                <span className="text-2xl font-black text-gray-900 dark:text-foreground tracking-tight leading-none">{stats.occupancyRate}%</span>
                                <SparkBar value={stats.occupancyRate} color="bg-amber-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Hostel Performance Table ── */}
                <Card className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-3xl shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-50 flex items-center gap-4 bg-gray-50 dark:bg-muted/10/30">
                        <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                            <Building2 className="h-4.5 w-4.5" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-gray-900 dark:text-foreground uppercase tracking-widest">Hostel Insights</h2>
                            <p className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest mt-0.5">Money and occupancy by hostel</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[900px]">
                            <thead>
                                <tr className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-muted-foreground border-b border-gray-50">
                                    <th className="px-8 py-4">Hostel Name</th>
                                    <th className="px-8 py-4">Room Status</th>
                                    <th className="px-8 py-4 text-right">Revenue</th>
                                    <th className="px-8 py-4 text-right">Expenses</th>
                                    <th className="px-8 py-4 text-right">Final Profit</th>
                                    <th className="px-8 py-4 text-center">Open</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-border/20">
                                {performance.length === 0 ? (
                                    <tr><td colSpan={6} className="px-8 py-12 text-center text-[10px] font-bold text-gray-300 uppercase tracking-widest">No hostel data</td></tr>
                                ) : performance.map((h) => (
                                    <tr key={h.id} className="hover:bg-indigo-50/30 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-gray-900 dark:text-foreground uppercase tracking-tight">{h.name}</span>
                                                <span className="text-[8px] font-bold text-gray-400 dark:text-muted-foreground mt-0.5">{h.occupied} / {h.rooms} rooms occupied</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${h.occupancy}%` }} />
                                                </div>
                                                <span className="text-[9px] font-black text-gray-700 dark:text-foreground">{h.occupancy}%</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right text-xs font-black text-gray-900 dark:text-foreground">PKR {h.revenue.toLocaleString()}</td>
                                        <td className="px-8 py-5 text-right text-xs font-black text-rose-500">PKR {h.expenses.toLocaleString()}</td>
                                        <td className="px-8 py-5 text-right">
                                            <span className={`text-sm font-black ${h.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                PKR {h.profit.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <Link href={`/admin/hostels/${h.id}`}>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
                                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* ── Chart Row ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Trend Chart */}
                    <Card className="lg:col-span-8 bg-white dark:bg-card border border-gray-100 dark:border-border rounded-3xl shadow-sm overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-gray-50 dark:bg-muted/10/30">
                            <div className="flex items-center gap-4">
                                <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200">
                                    <BarChart3 className="h-4 w-4" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-gray-900 dark:text-foreground uppercase tracking-widest">6-Month Trend</h2>
                                    <p className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest mt-0.5">Revenue vs Expenses</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-5">
                                <div className="flex items-center gap-2">
                                    <div className="h-2.5 w-2.5 rounded-sm bg-indigo-500" />
                                    <span className="text-[9px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest">Revenue</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-2.5 w-2.5 rounded-sm bg-rose-400" />
                                    <span className="text-[9px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest">Expenses</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-8">
                            <TrendBars data={trends} />
                        </div>
                        {trends.length > 0 && (
                            <div className="border-t border-gray-50">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-background text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-muted-foreground">
                                            <th className="px-8 py-4">Period</th>
                                            <th className="px-8 py-4 text-right">Revenue</th>
                                            <th className="px-8 py-4 text-right">Expenses</th>
                                            <th className="px-8 py-4 text-right">Net Profit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-border/20">
                                        {trends.slice().reverse().map((d, i) => (
                                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-muted/5 dark:bg-background transition-colors">
                                                <td className="px-8 py-3.5 text-xs font-black text-gray-700 dark:text-foreground uppercase">{d.month}</td>
                                                <td className="px-8 py-3.5 text-right text-xs font-bold text-indigo-600">PKR {d.revenue?.toLocaleString()}</td>
                                                <td className="px-8 py-3.5 text-right text-xs font-bold text-rose-500">PKR {d.expenses?.toLocaleString()}</td>
                                                <td className="px-8 py-3.5 text-right text-sm font-black text-gray-900 dark:text-foreground">PKR {d.profit?.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>

                    {/* Distribution Charts */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <Card className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-3xl shadow-sm overflow-hidden flex-1">
                            <div className="px-6 py-5 border-b border-gray-50 bg-gray-50 dark:bg-muted/10/30 flex items-center justify-between">
                                <div>
                                    <h3 className="text-[10px] font-black text-gray-900 dark:text-foreground uppercase tracking-widest">Expense Breakdown</h3>
                                    <p className="text-[8px] font-bold text-gray-400 dark:text-muted-foreground uppercase mt-0.5">By Category</p>
                                </div>
                                <PieChartIcon className="h-4 w-4 text-indigo-400" />
                            </div>
                            <div className="p-6">
                                <DonutChart data={expenseDist} colors={["#6366f1", "#ef4444", "#f59e0b", "#10b981", "#a855f7", "#3b82f6"]} />
                            </div>
                        </Card>

                        <Card className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-3xl shadow-sm overflow-hidden flex-1">
                            <div className="px-6 py-5 border-b border-gray-50 bg-gray-50 dark:bg-muted/10/30 flex items-center justify-between">
                                <div>
                                    <h3 className="text-[10px] font-black text-gray-900 dark:text-foreground uppercase tracking-widest">Revenue Sources</h3>
                                    <p className="text-[8px] font-bold text-gray-400 dark:text-muted-foreground uppercase mt-0.5">By Payment Type</p>
                                </div>
                                <DollarSign className="h-4 w-4 text-emerald-500" />
                            </div>
                            <div className="p-6">
                                <DonutChart data={revenueDist} colors={["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#6366f1"]} />
                            </div>
                        </Card>
                    </div>
                </div>

                {/* ── Infrastructure Trends + Quick Actions ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Utilities vs Maintenance */}
                    <Card className="lg:col-span-8 bg-white dark:bg-card border border-gray-100 dark:border-border rounded-3xl shadow-sm overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-50 flex items-center gap-4 bg-gray-50 dark:bg-muted/10/30">
                            <div className="h-9 w-9 rounded-xl bg-amber-500 flex items-center justify-center text-white">
                                <Zap className="h-4 w-4" />
                            </div>
                            <div>
                                <h2 className="text-sm font-black text-gray-900 dark:text-foreground uppercase tracking-widest">Electricity & Maintenance</h2>
                                <p className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest mt-0.5">Bills and repair costs</p>
                            </div>
                        </div>
                        <div className="p-8">
                            {utilityData.length > 0 ? (
                                <>
                                    <div className="flex items-center gap-5 mb-6">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2.5 w-2.5 rounded-sm bg-amber-400" />
                                            <span className="text-[9px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest">Utilities</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-2.5 w-2.5 rounded-sm bg-gray-700" />
                                            <span className="text-[9px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest">Maintenance</span>
                                        </div>
                                    </div>
                                    <div className="h-40 flex items-end gap-2">
                                        {utilityData.map((d, i) => {
                                            const maxV = Math.max(...utilityData.flatMap(t => [t.utilities, t.maintenance, 1]));
                                            const uH = Math.max((d.utilities / maxV) * 100, 1);
                                            const mH = Math.max((d.maintenance / maxV) * 100, 1);
                                            return (
                                                <div key={i} className="flex-1 flex flex-col items-center">
                                                    <div className="w-full flex items-end gap-0.5 h-32">
                                                        <div className="flex-1 bg-amber-400 rounded-t-md hover:bg-amber-500 transition-colors" style={{ height: `${uH}%` }} />
                                                        <div className="flex-1 bg-gray-700 rounded-t-md hover:bg-gray-800 transition-colors" style={{ height: `${mH}%` }} />
                                                    </div>
                                                    <span className="mt-2 text-[8px] font-black text-gray-400 dark:text-muted-foreground uppercase">{d.month}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-6 grid grid-cols-2 gap-4">
                                        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100/50">
                                            <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest block">Total Utilities (6mo)</span>
                                            <span className="text-lg font-black text-gray-900 dark:text-foreground mt-1 block">
                                                PKR {utilityData.reduce((s, d) => s + d.utilities, 0).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-muted/10 rounded-2xl p-4 border border-gray-100 dark:border-border">
                                            <span className="text-[8px] font-black text-gray-500 dark:text-muted-foreground uppercase tracking-widest block">Total Maintenance (6mo)</span>
                                            <span className="text-lg font-black text-gray-900 dark:text-foreground mt-1 block">
                                                PKR {utilityData.reduce((s, d) => s + d.maintenance, 0).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-40 gap-3">
                                    <Zap className="h-10 w-10 text-gray-100" />
                                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">No infrastructure data</span>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="lg:col-span-4 bg-white dark:bg-card border border-gray-100 dark:border-border rounded-3xl shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-50 bg-gray-50 dark:bg-muted/10/30">
                            <h3 className="text-[10px] font-black text-gray-900 dark:text-foreground uppercase tracking-widest">Go to section</h3>
                            <p className="text-[8px] font-bold text-gray-400 dark:text-muted-foreground uppercase mt-0.5">Quick links</p>
                        </div>
                        <div className="p-6 flex flex-col gap-3">
                            {[
                                { label: 'Payments', icon: Receipt, link: '/admin/payments', color: 'bg-indigo-50 text-indigo-600' },
                                { label: 'Bookings', icon: Calendar, link: '/admin/bookings', color: 'bg-blue-50 text-blue-600' },
                                { label: 'Expenses', icon: CreditCard, link: '/admin/expenses', color: 'bg-rose-50 text-rose-600' },
                                { label: 'Salaries', icon: Wallet, link: '/admin/salaries', color: 'bg-emerald-50 text-emerald-600' },
                                { label: 'Analytics', icon: BarChart3, link: '/admin/advanced-analytics', color: 'bg-purple-50 text-purple-600' },
                                { label: 'Hostels', icon: Building2, link: '/admin/hostels', color: 'bg-amber-50 text-amber-600' },
                            ].map(({ label, icon: Icon, link, color }) => (
                                <Link key={link} href={link}>
                                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 hover:border-indigo-100 border border-transparent transition-all group cursor-pointer">
                                        <div className={`h-8 w-8 rounded-lg ${color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                                            <Icon className="h-3.5 w-3.5" />
                                        </div>
                                        <span className="text-[10px] font-black text-gray-700 dark:text-foreground uppercase tracking-widest group-hover:text-indigo-700 transition-colors">{label}</span>
                                        <ArrowUpRight className="h-3 w-3 text-gray-300 ml-auto group-hover:text-indigo-500 transition-colors" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </Card>
                </div>

            </main>
        </div>
    );
};

export default ReportsPage;
