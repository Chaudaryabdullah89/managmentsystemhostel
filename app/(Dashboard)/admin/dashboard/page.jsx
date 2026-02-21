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
import { useComplaints } from "@/hooks/usecomplaints";
import { useAllPayments, useFinancialStats } from "@/hooks/usePayment";
import { format } from "date-fns";
import { toast } from "sonner";

const AdminDashboard = () => {
    const [selectedPeriod, setSelectedPeriod] = useState("month");

    // Queries
    const { data: reportData, isLoading: reportsLoading, refetch: refetchReports } = useReports(selectedPeriod);
    const { data: complaintsData, isLoading: complaintsLoading } = useComplaints({ stats: "true" });
    const { data: financialStats, isLoading: financialsLoading } = useFinancialStats();
    const { data: recentPayments, isLoading: paymentsLoading } = useAllPayments({ limit: 5 });

    const handleRefresh = async () => {
        const promise = refetchReports();
        toast.promise(promise, {
            loading: 'Refreshing data...',
            success: 'Data updated successfully',
            error: 'Failed to update data'
        });
    };

    if (reportsLoading || complaintsLoading || financialsLoading) return (
        <div className="flex flex-col items-center justify-center min-h-screen py-20">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-4" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Loading Dashboard...</p>
        </div>
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
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-1 bg-blue-600 rounded-full" />
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight uppercase">Dashboard</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Overview</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Online</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="h-9 px-4 rounded-xl border-gray-200 font-bold text-[10px] uppercase tracking-wider text-gray-600 hover:bg-gray-50"
                            onClick={handleRefresh}
                        >
                            <RefreshCw className="h-3.5 w-3.5 mr-2 text-gray-400" /> Refresh
                        </Button>
                        <Button
                            className="h-9 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all"
                        >
                            <Download className="h-3.5 w-3.5 mr-2" /> Export
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
                {/* Statistics Overview */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                        <div key={i} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-full bg-gray-50/50 skew-x-12 translate-x-10 group-hover:translate-x-8 transition-transform" />
                            <div className="flex flex-col gap-4 relative z-10">
                                <div className="flex items-center justify-between">
                                    <div className={`h-11 w-11 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-inner`}>
                                        <stat.icon className="h-5 w-5" />
                                    </div>
                                    <div className={`flex items-center gap-1 text-[10px] font-bold ${stat.isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {stat.isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                        {stat.change}
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{stat.label}</span>
                                    <span className="text-2xl font-bold text-gray-900 tracking-tighter">{stat.value}</span>
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

                        <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-8 py-5 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">Hostel</th>
                                        <th className="px-8 py-5 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">Occupancy</th>
                                        <th className="px-8 py-5 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">Revenue</th>
                                        <th className="px-8 py-5 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 text-right">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {hostels.slice(0, 5).map((hostel) => (
                                        <tr key={hostel.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer">
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-bold text-gray-900 uppercase tracking-tight">{hostel.name}</span>
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">ID: {hostel.id.slice(-8).toUpperCase()}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${hostel.occupancy > 80 ? 'bg-emerald-500' : hostel.occupancy > 50 ? 'bg-blue-500' : 'bg-amber-500'} rounded-full`}
                                                            style={{ width: `${hostel.occupancy}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[11px] font-bold text-gray-600">{hostel.occupancy}%</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-[11px] font-bold text-emerald-600">PKR {(hostel.revenue / 1000).toFixed(1)}k</span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <Badge variant="outline" className="text-[9px] font-bold rounded-full px-3 py-1 border-gray-100 bg-white shadow-sm">
                                                    {hostel.rooms} ROOMS
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* System Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                            <Card className="rounded-[2.5rem] border-gray-100 shadow-sm overflow-hidden group">
                                <CardHeader className="bg-gray-50/50 p-6 flex flex-row items-center justify-between border-b border-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                                            <AlertTriangle className="h-4 w-4" />
                                        </div>
                                        <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-gray-900">Urgent</CardTitle>
                                    </div>
                                    <Badge className="bg-rose-500 text-white border-none text-[9px] font-bold rounded-full px-2">
                                        {complaintStats.urgent} URGENT
                                    </Badge>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Complaints</span>
                                            <span className="text-base font-bold text-gray-900">{complaintStats.total}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pending</span>
                                            <span className="text-base font-bold text-amber-600">{complaintStats.pending}</span>
                                        </div>
                                        <div className="pt-4">
                                            <Link href="/admin/complaints">
                                                <Button className="w-full h-10 bg-blue-600 text-white text-[9px] font-bold uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all">
                                                    Manage
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-[2.5rem] border-gray-100 shadow-sm overflow-hidden group">
                                <CardHeader className="bg-gray-50/50 p-6 flex flex-row items-center justify-between border-b border-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                            <ShieldCheck className="h-4 w-4" />
                                        </div>
                                        <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-gray-900">Approvals</CardTitle>
                                    </div>
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Approval</span>
                                            <span className="text-base font-bold text-emerald-600">98.4%</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">System</span>
                                            <span className="text-base font-bold text-gray-900">OPTIMAL</span>
                                        </div>
                                        <div className="pt-4">
                                            <Link href="/admin/payment-approvals">
                                                <Button variant="outline" className="w-full h-10 border-gray-200 text-[9px] font-bold uppercase tracking-widest rounded-xl hover:bg-gray-50 transition-all">
                                                    View
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
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: 'Bookings', icon: ClipboardList, href: '/admin/bookings', color: 'text-orange-600', bg: 'bg-orange-50' },
                                    { label: 'Payments', icon: DollarSign, href: '/admin/payments', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                    { label: 'Complaints', icon: MessageSquare, href: '/admin/complaints', color: 'text-rose-600', bg: 'bg-rose-50' },
                                    { label: 'Notice Board', icon: Megaphone, href: '/admin/notices', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                    { label: 'Expenses', icon: Receipt, href: '/admin/expenses', color: 'text-blue-600', bg: 'bg-blue-50' },
                                    { label: 'Maintenance', icon: History, href: '/admin/maintenances', color: 'text-amber-600', bg: 'bg-amber-50' },
                                    { label: 'Salaries', icon: Wallet, href: '/admin/salaries', color: 'text-purple-600', bg: 'bg-purple-50' },
                                ].map((item, i) => (
                                    <Link key={i} href={item.href}>
                                        <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center gap-3 shadow-sm hover:shadow-md hover:border-blue-600/20 transition-all text-center">
                                            <div className={`h-10 w-10 rounded-xl ${item.bg} ${item.color} flex items-center justify-center`}>
                                                <item.icon className="h-5 w-5" />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">{item.label}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-3 px-2">
                                <div className="h-5 w-1 bg-blue-600 rounded-full" />
                                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">Recent</h3>
                            </div>
                            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-sm space-y-6">
                                {recentPayments?.payments?.length > 0 ? recentPayments.payments.slice(0, 4).map((pmt) => (
                                    <div key={pmt.id} className="flex items-center justify-between group cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-10 w-10 rounded-xl ${pmt.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'} flex items-center justify-center border border-gray-100 group-hover:bg-blue-600 group-hover:text-white transition-all`}>
                                                <DollarSign className="h-4 w-4" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-bold text-gray-900 uppercase tracking-tight">{pmt.User?.name || 'Guest'}</span>
                                                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{format(new Date(pmt.date), 'MMM dd, HH:mm')}</span>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <span className="text-[11px] font-bold text-gray-900">PKR {pmt.amount.toLocaleString()}</span>
                                            <Badge variant="outline" className={`text-[7px] font-bold rounded-full px-2 py-0 border-none ${pmt.status === 'PAID' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                {pmt.status}
                                            </Badge>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-10 text-center">
                                        <Activity className="h-8 w-8 text-gray-100 mx-auto mb-3" />
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No payments yet</p>
                                    </div>
                                )}

                                <div className="pt-4">
                                    <Link href="/admin/payments">
                                        <Button variant="ghost" className="w-full text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-blue-600 hover:bg-gray-50 rounded-xl">
                                            View Payments
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

export default AdminDashboard;