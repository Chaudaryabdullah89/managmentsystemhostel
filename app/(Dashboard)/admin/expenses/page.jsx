"use client"
import React from "react";
import Link from "next/link";
import {
    ChevronRight,
    Wallet,
    CheckCircle2,
    Clock,
    BarChart3,
    Receipt,
    AlertCircle,
    Utensils,
    ClipboardList,
    Zap,
    Wrench,
    BadgeDollarSign,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useExpenseStats, useExpenses } from "@/hooks/useExpenses";
import Loader from "@/components/ui/Loader";
import useAuthStore from "@/hooks/Authstate";

const CATEGORIES = [
    {
        key: 'MESS',
        label: 'Mess',
        slug: 'mess',
        Icon: Utensils,
        description: 'Meals, groceries & kitchen',
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-100',
        activeTab: 'bg-orange-600',
    },
    {
        key: 'GENERAL',
        label: 'General',
        slug: 'general',
        Icon: ClipboardList,
        description: 'Miscellaneous operations',
        color: 'text-slate-600',
        bg: 'bg-slate-50',
        border: 'border-slate-100',
        activeTab: 'bg-slate-600',
    },
    {
        key: 'UTILITY_BILL',
        label: 'Utility Bill',
        slug: 'utility-bill',
        Icon: Zap,
        description: 'Electricity, gas, water & internet',
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-100',
        activeTab: 'bg-blue-600',
    },
    {
        key: 'MAINTENANCE',
        label: 'Maintenance',
        slug: 'maintenance',
        Icon: Wrench,
        description: 'Repairs & infrastructure',
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-100',
        activeTab: 'bg-amber-600',
    },
    {
        key: 'SALARY',
        label: 'Salary',
        slug: 'salary',
        Icon: BadgeDollarSign,
        description: 'Staff wages & disbursements',
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        border: 'border-purple-100',
        activeTab: 'bg-purple-600',
    },
];

const ExpensesPage = () => {
    const user = useAuthStore((state) => state.user);
    const isWarden = user?.role === 'WARDEN';
    const hostelId = isWarden ? user?.hostelId : 'all';

    const { data: statsData, isLoading: statsLoading } = useExpenseStats(hostelId);
    const { data: allExpenses, isLoading: expensesLoading } = useExpenses({ hostelId: hostelId === 'all' ? undefined : hostelId });
    const expenses = allExpenses || [];

    const allowedCategories = React.useMemo(() => {
        if (!isWarden || user?.canManageExpenses) return CATEGORIES;

        return CATEGORIES.filter(cat => {
            if (cat.key === 'MESS') return user?.canManageMess;
            if (cat.key === 'GENERAL') return user?.canManageGeneral;
            if (cat.key === 'UTILITY_BILL') return user?.canManageUtilities;
            if (cat.key === 'MAINTENANCE') return user?.canManageMaintenance;
            if (cat.key === 'SALARY') return user?.canManageSalaries;
            return false;
        });
    }, [isWarden, user]);

    if (statsLoading || expensesLoading) return <Loader label="Loading" subLabel="Getting expense data..." icon={Receipt} fullScreen={false} />;

    const stats = statsData?.summary || { totalAmount: 0, paidAmount: 0, pendingAmount: 0, totalCount: 0 };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight">
            {/* Header — matches dashboard/payments/bookings pattern exactly */}
            <div className="bg-white border-b sticky top-0 z-50 py-2 md:h-16">
                <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-full flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="h-8 w-1 bg-blue-600 rounded-full shrink-0" />
                        <div className="flex flex-col">
                            <h1 className="text-sm md:text-lg font-bold text-gray-900 tracking-tight uppercase">Expenses</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-gray-400">Overview</span>
                                <div className="h-1 w-1 rounded-full bg-blue-500 animate-pulse" />
                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-blue-600">Live</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8">
                {/* Stats — same card style as all other pages */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {[
                        { label: 'Total Spent', value: `PKR ${(stats.totalAmount / 1000).toFixed(1)}k`, icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Paid / Approved', value: `PKR ${(stats.paidAmount / 1000).toFixed(1)}k`, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Pending', value: `PKR ${(stats.pendingAmount / 1000).toFixed(1)}k`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Records', value: stats.totalCount || 0, icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 flex items-center gap-3 md:gap-4 shadow-sm hover:shadow-md transition-shadow cursor-default min-w-0">
                            <div className={`h-9 w-9 md:h-11 md:w-11 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                                <stat.icon className="h-4 w-4 md:h-5 md:w-5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{stat.label}</span>
                                <span className="text-sm md:text-xl font-bold text-gray-900 tracking-tight truncate">{stat.value}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Section header — matches dashboard "Hostels", "Actions" pattern */}
                <div className="flex items-center gap-3 px-1">
                    <div className="h-5 w-1 bg-blue-600 rounded-full" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">Categories</h3>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-auto">Select to manage</span>
                </div>

                {/* Category cards — same grid density/pattern as Quick Actions but with more substance */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
                    {allowedCategories.map(cat => {
                        const catExpenses = expenses.filter(e => e.category === cat.key);
                        const catTotal = catExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
                        const catCount = catExpenses.length;
                        const catPending = catExpenses.filter(e => e.status === 'PENDING').length;

                        return (
                            <Link
                                key={cat.key}
                                href={`/admin/expenses/${cat.slug}`}
                                className="bg-white border border-gray-100 rounded-[2rem] p-5 flex flex-col gap-4 shadow-sm hover:shadow-md hover:border-gray-200 transition-all group relative overflow-hidden"
                            >
                                {/* Subtle bg accent — same as dashboard stat cards */}
                                <div className="absolute top-0 right-0 w-20 h-full bg-gray-50/50 skew-x-12 translate-x-8 group-hover:translate-x-6 transition-transform hidden md:block" />

                                {/* Icon — same size/style as dashboard action icons */}
                                <div className={`relative z-10 h-10 w-10 md:h-11 md:w-11 rounded-xl ${cat.bg} ${cat.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                                    <cat.Icon className="h-5 w-5" />
                                </div>

                                {/* Label & description */}
                                <div className="relative z-10 flex flex-col min-w-0">
                                    <h3 className={`text-[11px] md:text-[13px] font-bold uppercase tracking-tight ${cat.color}`}>{cat.label}</h3>
                                    <p className="text-[9px] font-bold text-gray-400 leading-relaxed mt-0.5">{cat.description}</p>
                                </div>

                                {/* Mini stats */}
                                <div className="relative z-10 flex flex-col gap-1.5 pt-2 border-t border-gray-50">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest">Spent</span>
                                        <span className={`text-[11px] md:text-[13px] font-bold tracking-tight ${cat.color}`}>
                                            PKR {(catTotal / 1000).toFixed(1)}k
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest">Records</span>
                                        <Badge variant="outline" className="text-[8px] md:text-[9px] font-black rounded-full px-2 py-0.5 border-gray-100 bg-white shadow-sm">
                                            {catCount}
                                        </Badge>
                                    </div>
                                    {catPending > 0 && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-[8px] md:text-[9px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1">
                                                <AlertCircle className="h-2.5 w-2.5" /> Pending
                                            </span>
                                            <Badge className="bg-amber-50 text-amber-700 border-none text-[8px] font-bold px-2 py-0">
                                                {catPending}
                                            </Badge>
                                        </div>
                                    )}
                                </div>

                                {/* CTA row */}
                                <div className={`relative z-10 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest ${cat.color} group-hover:gap-2 transition-all`}>
                                    View All
                                    <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </main>
        </div>
    );
};

export default ExpensesPage;
