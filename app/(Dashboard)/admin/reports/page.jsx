"use client"
import React, { useState } from "react";
import Link from "next/link";
import {
    ChevronRight,
    Download,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Users,
    Home,
    Calendar,
    FileText,
    Activity,
    CheckCircle,
    Clock,
    AlertCircle,
    Building2,
    CreditCard,
    Receipt,
    ArrowUpRight,
    ArrowDownRight,
    Zap,
    Wallet,
    Boxes,
    BarChart3,
    History,
    ShieldCheck
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Loader from "../../../../components/ui/Loader"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useReports } from "@/hooks/useReports";
import { format } from "date-fns";

const ReportsPage = () => {
    const [selectedPeriod, setSelectedPeriod] = useState("month");
    const { data, isLoading } = useReports(selectedPeriod);

    if (isLoading) return <Loader label="Loading Reports" subLabel="Fetching analytics data..." icon={Activity} fullScreen={false} />;

    const stats = data?.overall || {
        totalRevenue: 0,
        revenueChange: 0,
        totalExpenses: 0,
        expenseChange: 0,
        netProfit: 0,
        profitChange: 0,
        occupancyRate: 0,
        occupancyChange: 0
    };

    const performance = data?.hostelPerformance || [];
    const trends = data?.monthlyTrends || [];

    const handleExport = () => {
        if (!data) return;

        const headers = ["Hostel Name", "Rooms", "Occupied", "Occupancy %", "Revenue", "Expenses", "Profit"];
        const rows = performance.map(h => [
            h.name,
            h.rooms,
            h.occupied,
            h.occupancy,
            h.revenue,
            h.expenses,
            h.profit
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `hostel_report_${selectedPeriod}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight leading-relaxed">
            {/* Minimal Premium Header */}
            <div className="bg-white border-b sticky top-0 z-50 py-2 md:h-16">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-full flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="h-8 w-1 bg-black rounded-full shrink-0" />
                        <div className="flex flex-col">
                            <h1 className="text-sm md:text-lg font-bold text-gray-900 tracking-tight uppercase">Business Analytics</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-gray-400">Network Registry</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-emerald-600">Live Insights</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                            <SelectTrigger className="h-9 w-full md:w-[140px] rounded-xl border-gray-100 bg-white font-bold text-[9px] md:text-[10px] uppercase tracking-wider text-gray-600 shadow-sm transition-all focus:ring-0">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                                <SelectItem value="week" className="text-[10px] font-bold uppercase tracking-widest">This Week</SelectItem>
                                <SelectItem value="month" className="text-[10px] font-bold uppercase tracking-widest">This Month</SelectItem>
                                <SelectItem value="quarter" className="text-[10px] font-bold uppercase tracking-widest">This Quarter</SelectItem>
                                <SelectItem value="year" className="text-[10px] font-bold uppercase tracking-widest">This Year</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            className="h-9 px-4 md:px-6 rounded-xl bg-black hover:bg-gray-800 text-white font-bold text-[9px] md:text-[10px] uppercase tracking-wider shadow-sm transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
                            onClick={handleExport}
                        >
                            <Download className="h-3.5 w-3.5" /> <span className="hidden xs:inline">Export</span> Protocol
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
                {/* Metrics Matrix */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    <div className="bg-white border border-gray-100 rounded-2xl p-3 md:p-5 flex flex-col sm:flex-row items-center sm:items-center gap-2 md:gap-4 shadow-sm hover:shadow-md transition-all group text-center sm:text-left">
                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/50 group-hover:scale-110 transition-transform">
                            <Wallet className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest italic flex items-center justify-center sm:justify-start gap-1 md:gap-1.5 shrink-0">
                                Gross Revenue <TrendingUp className="h-2.5 w-2.5" />
                            </span>
                            <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-1 md:gap-2">
                                <span className="text-sm md:text-xl font-bold text-gray-900 tracking-tight truncate w-full">PKR {stats.totalRevenue.toLocaleString()}</span>
                                <span className={`text-[8px] md:text-[9px] font-bold ${Number(stats.revenueChange) >= 0 ? 'text-emerald-500' : 'text-rose-500'} shrink-0`}>
                                    {Number(stats.revenueChange) >= 0 ? '+' : ''}{stats.revenueChange}%
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-2xl p-3 md:p-5 flex flex-col sm:flex-row items-center sm:items-center gap-2 md:gap-4 shadow-sm hover:shadow-md transition-all group text-center sm:text-left">
                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100/50 group-hover:scale-110 transition-transform">
                            <CreditCard className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest italic flex items-center justify-center sm:justify-start gap-1 md:gap-1.5 shrink-0">
                                Operating Costs <TrendingDown className="h-2.5 w-2.5" />
                            </span>
                            <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-1 md:gap-2">
                                <span className="text-sm md:text-xl font-bold text-gray-900 tracking-tight truncate w-full">PKR {stats.totalExpenses.toLocaleString()}</span>
                                <span className="text-[8px] md:text-[9px] font-bold text-emerald-500 shrink-0">{stats.expenseChange}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-2xl p-3 md:p-5 flex flex-col sm:flex-row items-center sm:items-center gap-2 md:gap-4 shadow-sm hover:shadow-md transition-all group text-center sm:text-left">
                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/50 group-hover:scale-110 transition-transform">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest italic shrink-0">Net Performance</span>
                            <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-1 md:gap-2">
                                <span className="text-sm md:text-xl font-bold text-blue-600 tracking-tight truncate w-full">PKR {stats.netProfit.toLocaleString()}</span>
                                <span className="text-[8px] md:text-[9px] font-bold text-emerald-500 shrink-0">+{stats.profitChange}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-2xl p-3 md:p-5 flex flex-col sm:flex-row items-center sm:items-center gap-2 md:gap-4 shadow-sm hover:shadow-md transition-all group text-center sm:text-left">
                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100/50 group-hover:scale-110 transition-transform">
                            <Home className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest italic shrink-0">Network Occupancy</span>
                            <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-1 md:gap-2">
                                <span className="text-sm md:text-xl font-bold text-gray-900 tracking-tight truncate w-full">{stats.occupancyRate}%</span>
                                <span className="text-[8px] md:text-[9px] font-bold text-emerald-500 shrink-0">+{stats.occupancyChange}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Audit Registry: Hostel Performance */}
                <Card className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-black flex items-center justify-center text-white shadow-lg shadow-black/10">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight italic">Domain Performance Matrix</h3>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">Real-time property-level settlements</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-0 overflow-x-auto">
                        <table className="w-full text-left min-w-[1000px]">
                            <thead>
                                <tr className="bg-gray-50/70 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 border-b">
                                    <th className="px-8 py-5 italic">Hostel Node</th>
                                    <th className="px-8 py-5">Occupancy Delta</th>
                                    <th className="px-8 py-5 text-right">Revenue Settlement</th>
                                    <th className="px-8 py-5 text-right">Expenditure</th>
                                    <th className="px-8 py-5 text-right">Net Magnitude</th>
                                    <th className="px-8 py-5 text-center">Protocol</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {performance.map((hostel) => (
                                    <tr key={hostel.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-bold text-gray-900 uppercase tracking-tight italic">{hostel.name}</span>
                                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mt-0.5">{hostel.occupied}/{hostel.rooms} NODE_SLOTS</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 bg-gray-100/50 rounded-full h-1.5 w-24 overflow-hidden border border-gray-100">
                                                    <div
                                                        className="bg-black h-full rounded-full transition-all duration-1000"
                                                        style={{ width: `${hostel.occupancy}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-600">{hostel.occupancy}%</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right text-xs font-bold text-gray-900">PKR {hostel.revenue.toLocaleString()}</td>
                                        <td className="px-8 py-6 text-right text-xs font-bold text-rose-500">PKR {hostel.expenses.toLocaleString()}</td>
                                        <td className="px-8 py-6 text-right text-sm font-black text-emerald-600 italic">PKR {hostel.profit.toLocaleString()}</td>
                                        <td className="px-8 py-6 text-center">
                                            <Link href={`/admin/hostels/${hostel.id}`}>
                                                <Button variant="ghost" className="h-8 w-8 rounded-lg p-0 hover:bg-black hover:text-white transition-all">
                                                    <Zap className="h-3.5 w-3.5" />
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Monthly Trend Log */}
                    <div className="lg:col-span-8">
                        <Card className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden h-full">
                            <div className="p-8 border-b border-gray-50 bg-gray-50/20 flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                    <BarChart3 className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Temporal Settlement Trend</h3>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1 italic">6-Month financial trajectory</p>
                                </div>
                            </div>
                            <div className="p-0 overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 border-b">
                                            <th className="px-8 py-4">Time Delta</th>
                                            <th className="px-8 py-4 text-right">Revenue</th>
                                            <th className="px-8 py-4 text-right">Magnitude</th>
                                            <th className="px-8 py-4 text-center">Delta</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {trends.map((data, index) => (
                                            <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-8 py-4 text-xs font-bold text-gray-900 uppercase tracking-tighter italic">{data.month}</td>
                                                <td className="px-8 py-4 text-right text-xs font-bold text-gray-900">PKR {data.revenue.toLocaleString()}</td>
                                                <td className="px-8 py-4 text-right text-xs font-black text-emerald-600">PKR {data.profit.toLocaleString()}</td>
                                                <td className="px-8 py-4 text-center">
                                                    <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] font-black px-2 py-0.5 rounded-full">+12%</Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>

                    {/* Operational Summary Bento */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="bg-black text-white rounded-3xl p-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 h-full w-24 bg-white/5 skew-x-12 translate-x-10" />
                            <div className="flex items-center gap-4 mb-6 relative z-10">
                                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                                </div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 italic">Audit Summary</h4>
                            </div>
                            <div className="space-y-6 relative z-10">
                                <div className="flex justify-between items-end border-b border-white/10 pb-4">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest italic">Collection Rate</span>
                                        <span className="text-2xl font-bold tracking-tighter italic">94.2%</span>
                                    </div>
                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[8px] font-black mb-1">OPTIMIZED</Badge>
                                </div>
                                <div className="flex justify-between items-end border-b border-white/10 pb-4">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest italic">Network Growth</span>
                                        <span className="text-2xl font-bold tracking-tighter italic">+18.5%</span>
                                    </div>
                                    <TrendingUp className="h-5 w-5 text-blue-400 mb-1" />
                                </div>
                                <Link href="/admin/payments">
                                    <Button className="w-full h-12 mt-4 bg-white text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-3">
                                        Open Ledger Hub <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </Card>

                        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 italic">Quick Vectors</h4>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Fiscal', icon: Receipt, link: '/admin/payments' },
                                    { label: 'Booking', icon: Calendar, link: '/admin/bookings' },
                                    { label: 'Salary', icon: Users, link: '/admin/salaries' },
                                    { label: 'Hostel', icon: Building2, link: '/admin/hostels' }
                                ].map((node, i) => (
                                    <Link key={i} href={node.link}>
                                        <Button variant="outline" className="w-full h-12 rounded-xl border-gray-100 font-bold text-[9px] uppercase tracking-widest flex items-center justify-start px-4 hover:bg-black hover:text-white transition-all group">
                                            <node.icon className="h-3.5 w-3.5 mr-3 text-gray-400 group-hover:text-white" /> {node.label}
                                        </Button>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ReportsPage;
