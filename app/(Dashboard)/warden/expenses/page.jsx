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
    ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import useAuthStore from "@/hooks/Authstate";
import { useExpenseStats, useExpenses } from "@/hooks/useExpenses";
import { GridPageSkeleton } from "@/components/ui/skeletons";
import ErrorState from "@/components/ui/states/ErrorState";
import { exportToExcel } from "@/lib/utils/exportToExcel";
import { format } from "date-fns";
import { toast } from "sonner";

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
        perm: 'canManageMess'
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
        perm: 'canManageGeneral'
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
        perm: 'canManageUtilities'
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
        perm: 'canManageMaintenance'
    },
];

const ExpensesPage = () => {
    const { user } = useAuthStore();

    // Permission check for warden (Needs at least one granular permission or master access)
    const hasAnyExpensePermission = user?.canManageExpenses ||
        user?.canManageMess ||
        user?.canManageGeneral ||
        user?.canManageUtilities ||
        user?.canManageMaintenance;

    const {
        data: statsData,
        isLoading: statsLoading,
        isError: isStatsError,
        refetch: refetchStats,
    } = useExpenseStats(user?.hostelId || 'all');
    const {
        data: allExpenses,
        isLoading: expensesLoading,
        isError: isExpensesError,
        refetch: refetchExpenses,
    } = useExpenses({ hostelId: user?.hostelId });
    const expenses = allExpenses || [];

    // We no longer trigger early return for permissions before hooks, we just place it below any potential hidden hooks (although we don't see any).

    if (statsLoading || expensesLoading) return <GridPageSkeleton />;
    if (isStatsError || isExpensesError) {
        return (
            <div className="max-w-[1400px] mx-auto px-6 py-8">
                <ErrorState
                    title="Unable to load expenses"
                    description="Expense stats or records could not be fetched right now."
                    onRetry={() => {
                        refetchStats?.();
                        refetchExpenses?.();
                    }}
                    retryLabel="Retry"
                />
            </div>
        );
    }

    if (user && user.role === 'WARDEN' && !hasAnyExpensePermission) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gray-50 dark:bg-muted/10/50 dark:bg-background p-6 font-sans">
                <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-[3rem] p-12 shadow-xl flex flex-col items-center text-center max-w-md animate-in fade-in zoom-in duration-500">
                    <div className="h-20 w-20 rounded-[2rem] bg-rose-50 flex items-center justify-center mb-6">
                        <ShieldCheck className="h-10 w-10 text-rose-500" />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-foreground tracking-tight uppercase">Access Restricted</h1>
                    <p className="text-gray-400 dark:text-muted-foreground font-bold text-[10px] uppercase tracking-[0.2em] mt-2 mb-8 leading-relaxed">
                        Your account does not have permission to view or manage hostel expenses.
                    </p>
                    <Link href="/warden">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 h-12 font-bold uppercase tracking-wider text-[10px] shadow-lg shadow-blue-100 flex items-center gap-2">
                            Return Home
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const stats = statsData?.summary || { totalAmount: 0, paidAmount: 0, pendingAmount: 0, totalCount: 0 };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-muted/10/50 dark:bg-background pb-20 font-sans tracking-tight">
            {/* Header */}
            <div className="bg-white dark:bg-card border-b sticky top-0 z-50 py-2 md:h-16">
                <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-full flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="h-8 w-1 bg-blue-600 rounded-full shrink-0" />
                        <div className="flex flex-col">
                            <h1 className="text-sm md:text-lg font-bold text-gray-900 dark:text-foreground tracking-tight uppercase">Hostel Expenses</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-muted-foreground">Overview</span>
                                <div className="h-1 w-1 rounded-full bg-blue-500 animate-pulse" />
                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-blue-600">Live</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            className="h-9 px-4 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black text-[10px] uppercase tracking-widest transition-all shadow-sm flex items-center gap-2"
                            onClick={() => {
                                if (!expenses.length) return toast.error("No expenses to export");
                                const rows = expenses.map(e => ({
                                    "Expense ID": e.uid || e.id,
                                    "Date": e.date ? format(new Date(e.date), 'dd/MM/yyyy') : '—',
                                    "Category": e.category,
                                    "Title": e.title || '—',
                                    "Amount": e.amount,
                                    "Status": e.status,
                                    "Payer": e.userName || '—'
                                }));
                                exportToExcel(rows, `Expenses_Export_${format(new Date(), 'yyyy-MM-dd')}`, "Expenses");
                            }}
                        >
                            <Download className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Excel Report</span>
                            <span className="sm:hidden">Excel</span>
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8">
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {[
                        { label: 'Total Spent', value: `PKR ${(stats.totalAmount / 1000).toFixed(1)}k`, icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Paid / Approved', value: `PKR ${(stats.paidAmount / 1000).toFixed(1)}k`, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Pending', value: `PKR ${(stats.pendingAmount / 1000).toFixed(1)}k`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Records', value: stats.totalCount || 0, icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-4 md:p-5 flex items-center gap-3 md:gap-4 shadow-sm hover:shadow-md transition-shadow cursor-default min-w-0">
                            <div className={`h-9 w-9 md:h-11 md:w-11 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                                <stat.icon className="h-4 w-4 md:h-5 md:w-5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[8px] md:text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest truncate">{stat.label}</span>
                                <span className="text-sm md:text-xl font-bold text-gray-900 dark:text-foreground tracking-tight truncate">{stat.value}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Section header */}
                <div className="flex items-center gap-3 px-1">
                    <div className="h-5 w-1 bg-blue-600 rounded-full" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-foreground">Categories</h3>
                    <span className="text-[9px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest ml-auto">Manage Items</span>
                </div>

                {/* Category cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
                    {CATEGORIES.map(cat => {
                        const hasPermission = user?.canManageExpenses || (cat.perm && user?.[cat.perm]);
                        if (!hasPermission) return null;

                        const catExpenses = expenses.filter(e => e.category === cat.key);
                        const catTotal = catExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
                        const catCount = catExpenses.length;
                        const catPending = catExpenses.filter(e => e.status === 'PENDING').length;

                        return (
                            <Link
                                key={cat.key}
                                href={`/warden/expenses/${cat.slug}`}
                                className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-[2rem] p-5 flex flex-col gap-4 shadow-sm hover:shadow-md hover:border-gray-200 dark:border-border transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-20 h-full bg-gray-50 dark:bg-muted/10/50 dark:bg-background skew-x-12 translate-x-8 group-hover:translate-x-6 transition-transform hidden md:block" />

                                <div className={`relative z-10 h-10 w-10 md:h-11 md:w-11 rounded-xl ${cat.bg} ${cat.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                                    <cat.Icon className="h-5 w-5" />
                                </div>

                                <div className="relative z-10 flex flex-col min-w-0">
                                    <h3 className={`text-[11px] md:text-[13px] font-bold uppercase tracking-tight ${cat.color}`}>{cat.label}</h3>
                                    <p className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground leading-relaxed mt-0.5">{cat.description}</p>
                                </div>

                                <div className="relative z-10 flex flex-col gap-1.5 pt-2 border-t border-gray-50">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[8px] md:text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">Spent</span>
                                        <span className={`text-[11px] md:text-[13px] font-bold tracking-tight ${cat.color}`}>
                                            PKR {(catTotal / 1000).toFixed(1)}k
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[8px] md:text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">Records</span>
                                        <Badge variant="outline" className="text-[8px] md:text-[9px] font-black rounded-full px-2 py-0.5 border-gray-100 dark:border-border bg-white dark:bg-card shadow-sm">
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

                                <div className={`relative z-10 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest ${cat.color} group-hover:gap-2 transition-all`}>
                                    Manage
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
