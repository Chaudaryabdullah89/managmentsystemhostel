"use client"
import React, { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
    ChevronLeft,
    Download,
    TrendingUp,
    TrendingDown,
    Building2,
    MapPin,
    ShieldCheck,
    Coins,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Wallet,
    CreditCard,
    Home,
    PieChart,
    Users,
    Activity,
    FileText,
    ChevronRight,
    BarChart3,
    Clock,
    Zap,
    Info,
    Phone,
    MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useReports } from "@/hooks/useReports";
import { format } from "date-fns";

const HostelReportPage = () => {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const hostelId = searchParams.get('hostelId') || params.hostelId;

    const [selectedPeriod, setSelectedPeriod] = useState("month");
    const { data, isLoading } = useReports(selectedPeriod, hostelId);

    if (isLoading) return (
        <div className="flex h-screen items-center justify-center bg-white font-sans">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="h-20 w-20 border-[3px] border-gray-100 border-t-black rounded-full animate-spin" />
                    <BarChart3 className="h-8 w-8 text-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center">
                    <p className="text-lg font-bold text-gray-900 tracking-tight">Compiling Property Analytics...</p>
                    <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-widest">Building Fiscal Models & Occupancy Deltas</p>
                </div>
            </div>
        </div>
    );

    if (!data) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50 font-sans">
            <div className="text-center space-y-4">
                <Info className="h-10 w-10 text-gray-300 mx-auto" />
                <h2 className="text-xl font-bold text-gray-900 uppercase">Registry Missing</h2>
                <Button onClick={() => router.back()} variant="outline" className="rounded-xl">Return to Matrix</Button>
            </div>
        </div>
    );

    const { hostel, overall, monthlyTrends } = data;

    const handleExport = () => {
        const headers = ["Month", "Revenue", "Expenses", "Profit"];
        const rows = monthlyTrends.map(t => [t.month, t.revenue, t.expenses, t.profit]);
        const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${hostel.name.replace(/\s+/g, '_')}_Report_${selectedPeriod}.csv`;
        link.click();
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight leading-relaxed">
            {/* Minimal Premium Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100 h-9 w-9" onClick={() => router.back()}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="h-6 w-px bg-gray-200" />
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight uppercase">Audit: {hostel.name}</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Property Node</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Fiscal Integrity</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                            <SelectTrigger className="h-9 w-[140px] rounded-xl border-gray-200 bg-white font-bold text-[10px] uppercase tracking-wider text-gray-600 shadow-sm transition-all focus:ring-0">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                                <SelectItem value="week" className="text-[10px] font-bold uppercase tracking-widest">This Week</SelectItem>
                                <SelectItem value="month" className="text-[10px] font-bold uppercase tracking-widest">This Month</SelectItem>
                                <SelectItem value="quarter" className="text-[10px] font-bold uppercase tracking-widest">This Quarter</SelectItem>
                                <SelectItem value="year" className="text-[10px] font-bold uppercase tracking-widest">This Year</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button className="h-9 px-6 rounded-xl bg-black hover:bg-gray-800 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all active:scale-95" onClick={handleExport}>
                            <Download className="h-3.5 w-3.5 mr-2" /> Export Logs
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
                {/* Property Identity Card */}
                <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="space-y-1.5">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <MapPin className="h-3 w-3" /> Distribution Node
                            </span>
                            <p className="text-xs font-bold text-gray-900 uppercase italic truncate">{hostel.address}</p>
                        </div>
                        <div className="space-y-1.5">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck className="h-3 w-3" /> Personnel Authority
                            </span>
                            <p className="text-xs font-bold text-gray-900 uppercase italic truncate">{hostel.manager}</p>
                        </div>
                        <div className="space-y-1.5">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Phone className="h-3 w-3" /> Contact Prime
                            </span>
                            <p className="text-xs font-bold text-gray-900 uppercase italic truncate">{hostel.phone}</p>
                        </div>
                        <div className="space-y-1.5">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Calendar className="h-3 w-3" /> Registry Date
                            </span>
                            <p className="text-xs font-bold text-gray-900 uppercase italic truncate">{format(new Date(), 'MMM dd, yyyy')}</p>
                        </div>
                    </div>
                </div>

                {/* Metrics Matrix */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Gross Revenue', value: `PKR ${overall.totalRevenue.toLocaleString()}`, change: `${overall.revenueChange}%`, icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Operating Costs', value: `PKR ${overall.totalExpenses.toLocaleString()}`, change: `${overall.expenseChange}%`, icon: CreditCard, color: 'text-rose-600', bg: 'bg-rose-50' },
                        { label: 'Net Performace', value: `PKR ${overall.netProfit.toLocaleString()}`, change: `+${overall.profitChange}%`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Node Occupancy', value: `${overall.occupancyRate}%`, change: `+${overall.occupancyChange}%`, icon: Home, color: 'text-amber-600', bg: 'bg-amber-50' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all group">
                            <div className={`h-12 w-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0 border border-transparent group-hover:scale-110 transition-transform`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest italic">{stat.label}</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl font-bold text-gray-900 tracking-tight">{stat.value}</span>
                                    <span className={`text-[9px] font-bold ${stat.change.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>{stat.change}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Trend Log */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-gray-50 bg-gray-50/20 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-black flex items-center justify-center text-white shadow-lg shadow-black/10">
                                        <BarChart3 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight italic">Fiscal Trajectory</h3>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">6-Month property-level settlement log</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-0 overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50/70 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 border-b">
                                            <th className="px-8 py-5 italic">Time Delta</th>
                                            <th className="px-8 py-5 text-right">Revenue</th>
                                            <th className="px-8 py-5 text-right">Magnitude</th>
                                            <th className="px-8 py-5 text-right">Delta</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {monthlyTrends.map((trend, index) => (
                                            <tr key={index} className="group hover:bg-gray-50/50 transition-colors">
                                                <td className="px-8 py-6 text-xs font-bold text-gray-900 uppercase tracking-tighter italic">{trend.month}</td>
                                                <td className="px-8 py-6 text-right text-xs font-bold text-gray-900">PKR {trend.revenue.toLocaleString()}</td>
                                                <td className="px-8 py-6 text-right text-xs font-black text-emerald-600">PKR {trend.profit.toLocaleString()}</td>
                                                <td className="px-8 py-6 text-right">
                                                    <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] font-black px-2 py-0.5 rounded-full">+12%</Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>

                    {/* Right Column: Operational Bento */}
                    <div className="space-y-6">
                        <Card className="bg-black text-white rounded-3xl p-8 relative overflow-hidden group shadow-xl">
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
                                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest italic">Node Efficiency</span>
                                        <span className="text-2xl font-bold tracking-tighter italic">{overall.occupancyRate}%</span>
                                    </div>
                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[8px] font-black mb-1">OPTIMIZED</Badge>
                                </div>
                                <div className="flex justify-between items-end border-b border-white/10 pb-4">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest italic">Profit Vector</span>
                                        <span className="text-2xl font-bold tracking-tighter italic">+{overall.profitChange}%</span>
                                    </div>
                                    <TrendingUp className="h-5 w-5 text-blue-400 mb-1" />
                                </div>
                                <Button className="w-full h-12 mt-4 bg-white text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-3" onClick={() => router.push(`/admin/hostels/${hostelId}`)}>
                                    Property Control <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </Card>

                        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 italic">Fiscal Vectors</h4>
                            <div className="space-y-3">
                                {[
                                    { label: 'Unit Fleet Ledger', icon: BarChart3, link: `/admin/hostels/${hostelId}/rooms` },
                                    { label: 'Personnel Audit', icon: Users, link: `/admin/hostels/${hostelId}/residents` },
                                    { label: 'Grievance Protocol', icon: MessageSquare, link: `/admin/complaints?hostelId=${hostelId}` },
                                    { label: 'Network Reports', icon: PieChart, link: `/admin/reports` }
                                ].map((node, i) => (
                                    <Button key={i} variant="outline" className="w-full h-12 rounded-xl border-gray-100 font-bold text-[9px] uppercase tracking-widest flex items-center justify-between px-4 hover:bg-black hover:text-white transition-all group" onClick={() => router.push(node.link)}>
                                        <div className="flex items-center">
                                            <node.icon className="h-3.5 w-3.5 mr-3 text-gray-400 group-hover:text-white" /> {node.label}
                                        </div>
                                        <ChevronRight className="h-3 w-3 opacity-30" />
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>


            </main>
        </div>
    );
};

export default HostelReportPage;
