"use client"
import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
    ChevronRight,
    Search,
    Download,
    Plus,
    DollarSign,
    CheckCircle2,
    Clock,
    Building2,
    Calendar,
    Receipt,
    TrendingUp,
    FileText,
    Filter,
    ArrowUpRight,
    Zap,
    ShieldCheck,
    Wallet,
    History,
    MoreVertical,
    Trash2,
    Eye,
    BarChart3,
    ArrowDownRight,
    Info,
    RefreshCw,
    Loader2,
    Users,
    Bed,
    AlertTriangle,
    MessageSquare,
    ClipboardList,
    Layers,
    Activity,
    Megaphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useReports } from "@/hooks/useReports";
import { useComplaints, useUpdateComplaint } from "@/hooks/usecomplaints";
import { useAllPayments, useFinancialStats } from "@/hooks/usePayment";
import { format } from "date-fns";
import { toast } from "sonner";
import Loader from "@/components/ui/Loader";

const AdminDashboard = () => {
    const [selectedPeriod, setSelectedPeriod] = useState("month");

    // Queries
    const { data: reportData, isLoading: reportsLoading, refetch: refetchReports } = useReports(selectedPeriod);
    const { data: complaintsData, isLoading: complaintsLoading } = useComplaints({ stats: "true" });
    const { data: pendingComplaints, isLoading: pendingLoading } = useComplaints({ status: "PENDING" });
    const { data: financialStats, isLoading: financialsLoading } = useFinancialStats();
    const { data: recentPayments, isLoading: paymentsLoading } = useAllPayments({ limit: 5 });

    const updateMutation = useUpdateComplaint();

    const handleResolve = async (id) => {
        updateMutation.mutate({ id, status: 'RESOLVED', resolutionNotes: 'Quick resolution from dashboard' });
    };

    const handleRefresh = async () => {
        const promise = refetchReports();
        toast.promise(promise, {
            loading: 'Refreshing data...',
            success: 'Data updated successfully',
            error: 'Failed to update data'
        });
    };

    if (reportsLoading || complaintsLoading || financialsLoading) return (
        <Loader label="Loading Dashboard" subLabel="Fetching latest metrics..." icon={ClipboardList} fullScreen={false} />
    );

    const stats = reportData?.overall || {
        totalRevenue: 0,
        revenueChange: 0,
        totalExpenses: 0,
        expenseChange: 0,
        netProfit: 0,
        profitChange: 0,
        occupancyRate: 0,
        occupancyChange: 0
    };

    const hostels = reportData?.hostelPerformance || [];
    const trends = reportData?.monthlyTrends || [];
    const complaintStats = complaintsData || { total: 0, pending: 0, inProgress: 0, resolved: 0, urgent: 0 };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight">
            {/* Dashboard Header */}
            <div className="bg-white border-b sticky top-0 z-50 py-2 md:h-16">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-full flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="h-8 w-1 bg-blue-600 rounded-full shrink-0" />
                        <div className="flex flex-col">
                            <h1 className="text-sm md:text-lg font-bold text-gray-900 tracking-tight uppercase">Dashboard</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-gray-400">Registry Overview</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-emerald-600">Active Surveillance</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="h-9 px-3 md:px-4 rounded-xl border-gray-200 font-bold text-[9px] md:text-[10px] uppercase tracking-wider text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                            onClick={handleRefresh}
                        >
                            <RefreshCw className="h-3.5 w-3.5 text-gray-400" /> <span className="hidden xs:inline">Refresh Data</span> <span className="xs:hidden">Refresh</span>
                        </Button>
                        <Button
                            className="h-9 px-4 md:px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[9px] md:text-[10px] uppercase tracking-wider shadow-sm transition-all flex items-center gap-2"
                            onClick={() => {
                                if (!hostels || hostels.length === 0) {
                                    toast.error("No data available to export");
                                    return;
                                }
                                const headers = ["Hostel Name", "Occupancy (%)", "Revenue (PKR)", "Rooms"];
                                const rows = hostels.map(h => [h.name, h.occupancy, h.revenue, h.rooms]);
                                const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
                                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                const link = document.createElement("a");
                                const url = URL.createObjectURL(blob);
                                link.setAttribute("href", url);
                                link.setAttribute("download", `Hostel_Performance_${format(new Date(), 'yyyyMMdd')}.csv`);
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                toast.success("Performance report exported");
                            }}
                        >
                            <Download className="h-3.5 w-3.5" /> <span className="hidden xs:inline">Export Analytics</span> <span className="xs:hidden">Export</span>
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
                {/* Statistics Overview */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 px-4 md:px-0">
                    {[
                        {
                            label: 'Revenue',
                            value: `PKR ${(stats.totalRevenue / 1000).toFixed(1)}k`,
                            change: `${stats.revenueChange}%`,
                            isUp: stats.revenueChange >= 0,
                            icon: Wallet,
                            color: 'text-blue-600',
                            bg: 'bg-blue-50'
                        },
                        {
                            label: 'Expenses',
                            value: `PKR ${(stats.totalExpenses / 1000).toFixed(1)}k`,
                            change: `${stats.expenseChange}%`,
                            isUp: stats.expenseChange < 0,
                            icon: Receipt,
                            color: 'text-rose-600',
                            bg: 'bg-rose-50'
                        },
                        {
                            label: 'Occupancy',
                            value: `${stats.occupancyRate}%`,
                            change: `${stats.occupancyChange}%`,
                            isUp: stats.occupancyChange >= 0,
                            icon: Bed,
                            color: 'text-emerald-600',
                            bg: 'bg-emerald-50'
                        },
                        {
                            label: 'Profit',
                            value: `PKR ${(stats.netProfit / 1000).toFixed(1)}k`,
                            change: `${stats.profitChange}%`,
                            isUp: stats.profitChange >= 0,
                            icon: TrendingUp,
                            color: 'text-purple-600',
                            bg: 'bg-purple-50'
                        }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col items-center md:items-start text-center md:text-left">
                            <div className="absolute top-0 right-0 w-24 h-full bg-gray-50/50 skew-x-12 translate-x-10 group-hover:translate-x-8 transition-transform hidden md:block" />
                            <div className="flex flex-col gap-2 md:gap-4 relative z-10 w-full">
                                <div className="flex items-center justify-between">
                                    <div className={`h-9 w-9 md:h-11 md:w-11 rounded-xl md:rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-inner shrink-0 mx-auto md:mx-0`}>
                                        <stat.icon className="h-4 w-4 md:h-5 md:w-5" />
                                    </div>
                                    <div className={`hidden xs:flex items-center gap-1 text-[9px] md:text-[10px] font-bold ${stat.isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {stat.isUp ? <ArrowUpRight className="h-2.5 w-2.5 md:h-3 md:w-3" /> : <ArrowDownRight className="h-2.5 w-2.5 md:h-3 md:w-3" />}
                                        {stat.change}
                                    </div>
                                </div>
                                <div className="flex flex-col min-w-0 mt-1 md:mt-0">
                                    <span className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] md:tracking-[0.2em]">{stat.label}</span>
                                    <span className="text-sm md:text-2xl font-bold text-gray-900 tracking-tighter truncate">{stat.value}</span>
                                </div>
                                <div className={`xs:hidden mt-1 text-[8px] font-bold ${stat.isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {stat.isUp ? '+' : ''}{stat.change}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Hostel Performance */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                                <div className="h-5 w-1 bg-blue-600 rounded-full" />
                                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">Hostels</h3>
                            </div>
                            <Link href="/admin/hostels">
                                <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-blue-600">
                                    View <ChevronRight className="h-3 w-3 ml-1" />
                                </Button>
                            </Link>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-sm">
                            <div className="overflow-x-auto scrollbar-hide">
                                <table className="w-full text-left border-collapse min-w-[600px]">
                                    <thead className="bg-gray-50/50">
                                        <tr>
                                            <th className="px-6 md:px-8 py-4 md:py-5 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">Hostel Branch</th>
                                            <th className="px-6 md:px-8 py-4 md:py-5 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">Capacity Metrics</th>
                                            <th className="px-6 md:px-8 py-4 md:py-5 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">Revenue Stream</th>
                                            <th className="px-6 md:px-8 py-4 md:py-5 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 text-right">Inventory</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {hostels.slice(0, 5).map((hostel) => (
                                            <tr key={hostel.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer">
                                                <td className="px-6 md:px-8 py-4 md:py-5">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] md:text-[13px] font-bold text-gray-900 uppercase tracking-tight">{hostel.name}</span>
                                                        <span className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">#{hostel.id.slice(-6).toUpperCase()}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 md:px-8 py-4 md:py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 h-1.5 w-16 md:w-24 bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full ${hostel.occupancy > 80 ? 'bg-emerald-500' : hostel.occupancy > 50 ? 'bg-indigo-500' : 'bg-amber-500'} rounded-full`}
                                                                style={{ width: `${hostel.occupancy}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[10px] md:text-[11px] font-bold text-gray-600">{hostel.occupancy}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 md:px-8 py-4 md:py-5">
                                                    <span className="text-[10px] md:text-[11px] font-bold text-emerald-600">PKR {(hostel.revenue / 1000).toFixed(1)}k</span>
                                                </td>
                                                <td className="px-6 md:px-8 py-4 md:py-5 text-right">
                                                    <Badge variant="outline" className="text-[8px] md:text-[9px] font-black rounded-full px-2 md:px-3 py-1 border-gray-100 bg-white shadow-sm shrink-0 whitespace-nowrap">
                                                        {hostel.rooms} NODES
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* System Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pt-2 md:pt-4">
                            <Card className="rounded-[2rem] md:rounded-[2.5rem] border-gray-100 shadow-sm overflow-hidden group">
                                <CardHeader className="bg-gray-50/50 p-5 md:p-6 flex flex-row items-center justify-between border-b border-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                            <AlertTriangle className="h-4 w-4" />
                                        </div>
                                        <CardTitle className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-gray-900">Grievances</CardTitle>
                                    </div>
                                    <Badge className="bg-rose-500 text-white border-none text-[8px] md:text-[9px] font-black rounded-full px-2 py-0.5">
                                        {complaintStats.urgent} URGENT
                                    </Badge>
                                </CardHeader>
                                <CardContent className="p-5 md:p-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Active</span>
                                            <span className="text-sm md:text-base font-bold text-gray-900">{complaintStats.total}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Processing</span>
                                            <span className="text-sm md:text-base font-bold text-indigo-600">{complaintStats.pending}</span>
                                        </div>
                                        <div className="pt-2 md:pt-4">
                                            <Link href="/admin/complaints">
                                                <Button className="w-full h-10 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/10">
                                                    Review Ledger
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-[2rem] md:rounded-[2.5rem] border-gray-100 shadow-sm overflow-hidden group">
                                <CardHeader className="bg-gray-50/50 p-5 md:p-6 flex flex-row items-center justify-between border-b border-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                            <ShieldCheck className="h-4 w-4" />
                                        </div>
                                        <CardTitle className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-gray-900">Fiscal Pulse</CardTitle>
                                    </div>
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                </CardHeader>
                                <CardContent className="p-5 md:p-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Collection Rate</span>
                                            <span className="text-sm md:text-base font-bold text-emerald-600">98.4%</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">System Load</span>
                                            <span className="text-sm md:text-base font-bold text-gray-900 uppercase">Optimal</span>
                                        </div>
                                        <div className="pt-2 md:pt-4">
                                            <Link href="/admin/payment-approvals">
                                                <Button variant="outline" className="w-full h-10 border-gray-200 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-50 transition-all">
                                                    Verify Approvals
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-8">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 px-2">
                                <div className="h-5 w-1 bg-blue-600 rounded-full" />
                                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">Quick</h3>
                            </div>
                            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-2 gap-3 md:gap-4 px-2 md:px-0">
                                {[
                                    { label: 'Bookings', icon: ClipboardList, href: '/admin/bookings', color: 'text-orange-600', bg: 'bg-orange-50' },
                                    { label: 'Payments', icon: DollarSign, href: '/admin/payments', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                    { label: 'Grievances', icon: MessageSquare, href: '/admin/complaints', color: 'text-rose-600', bg: 'bg-rose-50' },
                                    { label: 'Notices', icon: Megaphone, href: '/admin/notices', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                    { label: 'Expenses', icon: Receipt, href: '/admin/expenses', color: 'text-blue-600', bg: 'bg-blue-50' },
                                    // { label: 'Asset Log', icon: History, href: '/admin/maintenances', color: 'text-amber-600', bg: 'bg-amber-50' },
                                    { label: 'Salaries', icon: Wallet, href: '/admin/salaries', color: 'text-purple-600', bg: 'bg-purple-50' },
                                ].map((item, i) => (
                                    <Link key={i} href={item.href}>
                                        <div className="bg-white border border-gray-100 rounded-2xl p-3 md:p-4 flex flex-col items-center gap-2 md:gap-3 shadow-sm hover:shadow-md hover:border-indigo-600/20 transition-all text-center group h-full justify-center">
                                            <div className={`h-9 w-9 md:h-10 md:w-10 rounded-xl ${item.bg} ${item.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                                                <item.icon className="h-4.5 w-4.5 md:h-5 md:w-5" />
                                            </div>
                                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-indigo-600 transition-colors line-clamp-1">{item.label}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 px-2">
                            <div className="h-5 w-1 bg-rose-600 rounded-full" />
                            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">Priority Actions</h3>
                        </div>
                        <div className="bg-white border border-rose-100 rounded-[2rem] p-5 md:p-6 shadow-sm space-y-4">
                            {pendingComplaints?.length > 0 ? pendingComplaints.filter(c => c.priority === 'URGENT').slice(0, 3).map((complaint) => (
                                <div key={complaint.id} className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 group">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                                                <h4 className="text-[11px] font-bold text-gray-900 uppercase truncate">{complaint.title}</h4>
                                            </div>
                                            <p className="text-[9px] text-gray-500 font-medium line-clamp-1 mb-2">Room {complaint.roomNumber} — {complaint.Hostel?.name}</p>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 px-3 bg-white border border-gray-100 text-[8px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white hover:border-emerald-600 rounded-lg transition-all"
                                                onClick={() => handleResolve(complaint.id)}
                                                disabled={updateMutation.isPending}
                                            >
                                                {updateMutation.isPending ? 'Processing' : 'Mark Resolved'}
                                            </Button>
                                        </div>
                                        <Badge className="bg-rose-50 text-rose-600 border-rose-100 text-[7px] font-black uppercase rounded-full px-2 py-0 border">
                                            Urgent
                                        </Badge>
                                    </div>
                                </div>
                            )) : (
                                <div className="py-6 text-center">
                                    <CheckCircle2 className="h-8 w-8 text-emerald-100 mx-auto mb-2" />
                                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">No urgent tasks</p>
                                </div>
                            )}
                            <Link href="/admin/complaints" className="block">
                                <Button variant="ghost" className="w-full h-10 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-rose-600 hover:bg-gray-50 rounded-xl border border-transparent hover:border-rose-100 transition-all">
                                    View All Pending
                                </Button>
                            </Link>
                        </div>

                        <div className="flex items-center gap-3 px-2">
                            <div className="h-5 w-1 bg-blue-600 rounded-full" />
                            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">Recent</h3>
                        </div>
                        <div className="bg-white border border-gray-100 rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-6 shadow-sm space-y-5 md:space-y-6">
                            {recentPayments?.payments?.length > 0 ? recentPayments.payments.slice(0, 4).map((pmt) => (
                                <div key={pmt.id} className="flex items-center justify-between group cursor-pointer w-full">
                                    <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                                        <div className={`h-9 w-9 md:h-10 md:w-10 rounded-xl ${pmt.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'} flex items-center justify-center border border-gray-100 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0`}>
                                            <DollarSign className="h-4 w-4" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[10px] md:text-[11px] font-bold text-gray-900 uppercase tracking-tight truncate">{pmt.User?.name || 'Guest User'}</span>
                                            <span className="text-[7px] md:text-[8px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{format(new Date(pmt.date), 'MMM dd, HH:mm')}</span>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end shrink-0 ml-2">
                                        <span className="text-[10px] md:text-[11px] font-bold text-gray-900">Rs. {pmt.amount.toLocaleString()}</span>
                                        <Badge variant="outline" className={`text-[7px] font-black rounded-full px-2 py-0 border-none ${pmt.status === 'PAID' ? 'text-emerald-500 bg-emerald-50/50' : 'text-amber-500 bg-amber-50/50'}`}>
                                            {pmt.status}
                                        </Badge>
                                    </div>
                                </div>
                            )) : (
                                <div className="py-10 text-center">
                                    <Activity className="h-8 w-8 text-gray-100 mx-auto mb-3" />
                                    <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">No recent transactions</p>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;