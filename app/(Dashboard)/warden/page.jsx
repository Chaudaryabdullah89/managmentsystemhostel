"use client"
import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
    ChevronRight,
    Download,
    DollarSign,
    Building2,
    Receipt,
    TrendingUp,
    RefreshCw,
    Wallet,
    History,
    ArrowUpRight,
    ArrowDownRight,
    Users,
    Bed,
    AlertTriangle,
    MessageSquare,
    ClipboardList,
    Activity,
    ShieldCheck,
    Megaphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useReports } from "@/hooks/useReports";
import { useComplaints } from "@/hooks/usecomplaints";
import { useAllPayments, useFinancialStats } from "@/hooks/usePayment";
import { format } from "date-fns";
import { toast } from "sonner";
import useAuthStore from "@/hooks/Authstate";
import Loader from "@/components/ui/Loader";

const WardenDashboard = () => {
    const { user } = useAuthStore();
    const [selectedPeriod, setSelectedPeriod] = useState("month");

    // Queries - filtered by warden's hostelId
    const { data: reportData, isLoading: reportsLoading, refetch: refetchReports } = useReports(selectedPeriod);
    const { data: complaintsData, isLoading: complaintsLoading } = useComplaints({
        hostelId: user?.hostelId,
        stats: "true"
    });
    const { data: financialStats, isLoading: financialsLoading } = useFinancialStats(user?.hostelId);
    const { data: recentPayments, isLoading: paymentsLoading } = useAllPayments({
        limit: 5,
        hostelId: user?.hostelId
    });

    const handleRefresh = async () => {
        const promise = refetchReports();
        toast.promise(promise, {
            loading: 'Refreshing data...',
            success: 'Data updated successfully',
            error: 'Failed to update data'
        });
    };

    if (reportsLoading || complaintsLoading || financialsLoading) return (
        <Loader label="Loading Dashboard" subLabel="Fetching latest data..." icon={Activity} fullScreen={false} />
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

    // Filter hostel performance to warden's assigned hostel
    const hostelData = (reportData?.hostelPerformance || []).filter(h => h.id === user?.hostelId);
    const complaintStats = complaintsData || { total: 0, pending: 0, inProgress: 0, resolved: 0, urgent: 0 };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-4">
                        <div className="h-8 w-1 bg-blue-600 rounded-full" />
                        <div className="flex flex-col">
                            <h1 className="text-sm md:text-lg font-bold text-gray-900 tracking-tight uppercase">Dashboard</h1>
                            <div className="flex items-center gap-1 md:gap-2">
                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-gray-400">Overview</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500 hidden sm:block" />
                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-emerald-600 hidden sm:block">Active</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                        <Button
                            variant="outline"
                            className="h-8 md:h-9 px-3 md:px-4 rounded-xl border-gray-200 font-bold text-[9px] md:text-[10px] uppercase tracking-wider text-gray-600 hover:bg-gray-50 shrink-0"
                            onClick={handleRefresh}
                        >
                            <RefreshCw className="h-3.5 w-3.5 md:mr-2 text-gray-400" />
                            <span className="hidden md:inline">Refresh</span>
                        </Button>
                        <Button
                            className="h-8 md:h-9 px-3 md:px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[9px] md:text-[10px] uppercase tracking-wider shadow-sm transition-all shrink-0"
                            onClick={() => {
                                if (!hostelData || hostelData.length === 0) {
                                    toast.error("No data available to export");
                                    return;
                                }
                                const headers = ["Hostel Name", "Occupancy (%)", "Revenue (PKR)", "Rooms"];
                                const rows = hostelData.map(h => [h.name, h.occupancy, h.revenue, h.rooms]);
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
                            <Download className="h-3.5 w-3.5 md:mr-2" />
                            <span className="hidden md:inline">Export</span>
                            <span className="md:hidden">Export</span>
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8 min-w-0">
                {/* Performance Summary */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
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
                            label: 'Net Profit',
                            value: `PKR ${(stats.netProfit / 1000).toFixed(1)}k`,
                            change: `${stats.profitChange}%`,
                            isUp: stats.profitChange >= 0,
                            icon: TrendingUp,
                            color: 'text-purple-600',
                            bg: 'bg-purple-50'
                        }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden min-w-0">
                            <div className="absolute top-0 right-0 w-24 h-full bg-gray-50/50 skew-x-12 translate-x-10 group-hover:translate-x-8 transition-transform" />
                            <div className="flex flex-col gap-3 md:gap-4 relative z-10 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                    <div className={`h-9 w-9 md:h-11 md:w-11 rounded-xl md:rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-inner shrink-0`}>
                                        <stat.icon className="h-4 w-4 md:h-5 md:w-5" />
                                    </div>
                                    <div className={`flex items-center gap-1 text-[8px] md:text-[10px] font-bold ${stat.isUp ? 'text-emerald-600' : 'text-rose-600'} shrink-0`}>
                                        {stat.isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                        {stat.change}
                                    </div>
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{stat.label}</span>
                                    <span className="text-base md:text-2xl font-bold text-gray-900 tracking-tighter truncate">{stat.value}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                    {/* Performance Overview */}
                    <div className="lg:col-span-2 space-y-4 md:space-y-6 min-w-0">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                                <div className="h-5 w-1 bg-blue-600 rounded-full" />
                                <h3 className="text-xs md:text-sm font-bold uppercase tracking-widest text-gray-900">Your Hostel</h3>
                            </div>
                            <Link href="/warden/hostels">
                                <Button variant="ghost" size="sm" className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-blue-600">
                                    <span className="hidden sm:inline">View Details</span>
                                    <span className="sm:hidden">View</span>
                                    <ChevronRight className="h-3 w-3 ml-1" />
                                </Button>
                            </Link>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-sm overflow-x-auto scrollbar-hide">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-6 md:px-8 py-4 md:py-5 text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-gray-400">Hostel</th>
                                        <th className="px-6 md:px-8 py-4 md:py-5 text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-gray-400">Occupancy</th>
                                        <th className="px-6 md:px-8 py-4 md:py-5 text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-gray-400">Revenue</th>
                                        <th className="px-6 md:px-8 py-4 md:py-5 text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-gray-400 text-right">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {hostelData.length > 0 ? hostelData.map((hostel) => (
                                        <tr key={hostel.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer">
                                            <td className="px-6 md:px-8 py-4 md:py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-[12px] md:text-[13px] font-bold text-gray-900 uppercase tracking-tight">{hostel.name}</span>
                                                    <span className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest">ID: {hostel.id.slice(-8).toUpperCase()}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 md:px-8 py-4 md:py-5">
                                                <div className="flex items-center gap-2 md:gap-3">
                                                    <div className="flex-1 h-1.5 w-16 md:w-24 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${hostel.occupancy > 80 ? 'bg-emerald-500' : hostel.occupancy > 50 ? 'bg-blue-500' : 'bg-amber-500'} rounded-full`}
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
                                                <Badge variant="outline" className="text-[8px] md:text-[9px] font-bold rounded-full px-2 md:px-3 py-1 border-gray-100 bg-white shadow-sm whitespace-nowrap">
                                                    {hostel.rooms} Rooms
                                                </Badge>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 md:px-8 py-10 text-center">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No hostel assigned yet</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Operations Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pt-2 md:pt-4 min-w-0">
                            <Card className="rounded-[1.5rem] md:rounded-[2.5rem] border-gray-100 shadow-sm overflow-hidden group min-w-0">
                                <CardHeader className="bg-gray-50/50 p-4 md:p-6 flex flex-row items-center justify-between border-b border-gray-50">
                                    <div className="flex items-center gap-2 md:gap-3">
                                        <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                            <AlertTriangle className="h-4 w-4" />
                                        </div>
                                        <CardTitle className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-gray-900 truncate">Complaints</CardTitle>
                                    </div>
                                    <Badge className="bg-rose-500 text-white border-none text-[8px] md:text-[9px] font-bold rounded-full px-2 shrink-0">
                                        {complaintStats.urgent} URGENT
                                    </Badge>
                                </CardHeader>
                                <CardContent className="p-4 md:p-6">
                                    <div className="space-y-3 md:space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</span>
                                            <span className="text-sm md:text-base font-bold text-gray-900">{complaintStats.total}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pending</span>
                                            <span className="text-sm md:text-base font-bold text-amber-600">{complaintStats.pending}</span>
                                        </div>
                                        <div className="pt-2 md:pt-4">
                                            <Link href="/warden/complaints">
                                                <Button className="w-full h-10 md:h-12 bg-blue-600 text-white text-[9px] font-bold uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all">
                                                    Manage
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-[1.5rem] md:rounded-[2.5rem] border-gray-100 shadow-sm overflow-hidden group min-w-0">
                                <CardHeader className="bg-gray-50/50 p-4 md:p-6 flex flex-row items-center justify-between border-b border-gray-50">
                                    <div className="flex items-center gap-2 md:gap-3">
                                        <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                            <ShieldCheck className="h-4 w-4" />
                                        </div>
                                        <CardTitle className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-gray-900 truncate">Status</CardTitle>
                                    </div>
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                </CardHeader>
                                <CardContent className="p-4 md:p-6">
                                    <div className="space-y-3 md:space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Available</span>
                                            <span className="text-sm md:text-base font-bold text-emerald-600">{hostelData[0]?.rooms || 0} Rooms</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">System</span>
                                            <span className="text-sm md:text-base font-bold text-gray-900">OPTIMAL</span>
                                        </div>
                                        <div className="pt-2 md:pt-4">
                                            <Link href="/warden/rooms">
                                                <Button variant="outline" className="w-full h-10 md:h-12 border-gray-200 text-[9px] font-bold uppercase tracking-widest rounded-xl hover:bg-gray-50 transition-all">
                                                    View Rooms
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Quick Access & Movements */}
                    <div className="space-y-6 md:space-y-8 min-w-0">
                        <div className="space-y-4 md:space-y-6">
                            <div className="flex items-center gap-3 px-2">
                                <div className="h-5 w-1 bg-blue-600 rounded-full" />
                                <h3 className="text-xs md:text-sm font-bold uppercase tracking-widest text-gray-900">Quick Actions</h3>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3 md:gap-4">
                                {[
                                    { label: 'Bookings', icon: ClipboardList, href: '/warden/bookings', color: 'text-orange-600', bg: 'bg-orange-50' },
                                    {
                                        label: 'Payments',
                                        icon: DollarSign,
                                        href: '/warden/payments',
                                        color: 'text-emerald-600',
                                        bg: 'bg-emerald-50',
                                        badge: recentPayments?.payments?.filter(p => p.status === 'PENDING').length || 0
                                    },
                                    { label: 'Complaints', icon: MessageSquare, href: '/warden/complaints', color: 'text-rose-600', bg: 'bg-rose-50' },
                                    { label: 'Residents', icon: Users, href: '/warden/residents', color: 'text-blue-600', bg: 'bg-blue-50' },
                                    { label: 'Notices', icon: Megaphone, href: '/warden/notices', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                    { label: 'Rooms', icon: Bed, href: '/warden/rooms', color: 'text-amber-600', bg: 'bg-amber-50' },
                                    { label: 'Service Hub', icon: History, href: '/warden/services', color: 'text-purple-600', bg: 'bg-purple-50' },
                                ].map((item, i) => (
                                    <Link key={i} href={item.href}>
                                        <div className="bg-white border border-gray-100 rounded-xl md:rounded-2xl p-3 md:p-4 flex flex-col items-center gap-2 md:gap-3 shadow-sm hover:shadow-md hover:border-blue-600/20 transition-all text-center relative group min-w-0">
                                            {item.badge > 0 && (
                                                <span className="absolute -top-1 -right-1 h-5 w-5 bg-rose-600 text-white text-[8px] md:text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce shadow-lg">
                                                    {item.badge}
                                                </span>
                                            )}
                                            <div className={`h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl ${item.bg} ${item.color} flex items-center justify-center shrink-0`}>
                                                <item.icon className="h-4 w-4 md:h-5 md:w-5" />
                                            </div>
                                            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-gray-600 truncate w-full">{item.label}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4 md:space-y-6">
                            <div className="flex items-center gap-3 px-2">
                                <div className="h-5 w-1 bg-blue-600 rounded-full" />
                                <h3 className="text-xs md:text-sm font-bold uppercase tracking-widest text-gray-900">Recent Activity</h3>
                            </div>
                            <div className="bg-white border border-gray-100 rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-6 shadow-sm space-y-4 md:space-y-6 min-w-0">
                                {recentPayments?.payments?.length > 0 ? recentPayments.payments.slice(0, 4).map((pmt) => (
                                    <div key={pmt.id} className="flex items-center justify-between group cursor-pointer relative min-w-0 gap-3">
                                        <div className="flex items-center gap-3 md:gap-4 min-w-0">
                                            <div className={`h-9 w-9 md:h-10 md:w-10 rounded-lg md:rounded-xl ${pmt.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'} flex items-center justify-center border border-gray-100 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0`}>
                                                {pmt.receiptUrl && pmt.status === 'PENDING' ? <ShieldCheck className="h-4 w-4 animate-pulse" /> : <DollarSign className="h-4 w-4" />}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] md:text-[11px] font-bold text-gray-900 uppercase tracking-tight truncate">{pmt.User?.name || 'Guest'}</span>
                                                    {pmt.receiptUrl && pmt.status === 'PENDING' && (
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                                    )}
                                                </div>
                                                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest truncate">
                                                    {pmt.receiptUrl && pmt.status === 'PENDING' ? 'New Proof' : format(new Date(pmt.date), 'MMM dd, HH:mm')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end shrink-0">
                                            <span className="text-[10px] md:text-[11px] font-bold text-gray-900 pb-0.5">PKR {pmt.amount.toLocaleString()}</span>
                                            <Badge variant="outline" className={`text-[7px] font-bold rounded-full px-1.5 py-0 border-none ${pmt.status === 'PAID' ? 'text-emerald-500 bg-emerald-50' : 'text-amber-500 bg-amber-50'}`}>
                                                {pmt.status === 'PENDING' && pmt.receiptUrl ? 'NOTIFIED' : pmt.status}
                                            </Badge>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-8 md:py-10 text-center">
                                        <Activity className="h-8 w-8 text-gray-100 mx-auto mb-3" />
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No activity found</p>
                                    </div>
                                )}

                                <div className="pt-2 md:pt-4">
                                    <Link href="/warden/payments">
                                        <Button variant="ghost" className="w-full h-10 md:h-11 text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-blue-600 hover:bg-gray-50 rounded-xl">
                                            Complete Ledger
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default WardenDashboard;
