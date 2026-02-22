"use client";
import React, { useState, useMemo } from 'react';
import {
    Calendar, FileText, History, ArrowUpRight,
    Clock, CheckCircle2, TrendingUp, ShieldCheck,
    Download, Wallet, Search, Filter, Mail, CreditCard,
    AlertCircle, MessageSquare, ChevronRight, Zap
} from 'lucide-react';
import { useWardenPayments } from '@/hooks/useWardenSalaries';
import useAuthStore from '@/hooks/Authstate';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import SalarySlip from '@/components/SalarySlip';

const WardenSalaryPortal = () => {
    const { user } = useAuthStore();
    const [selectedSalary, setSelectedSalary] = useState(null);
    const [isSlipOpen, setIsSlipOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const { data: salaries, isLoading } = useWardenPayments(user?.id);

    const filteredSalaries = useMemo(() => {
        if (!salaries) return [];
        return salaries.filter(s =>
            s.month.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.id.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [salaries, searchQuery]);

    if (isLoading) return (
        <div className="flex h-screen items-center justify-center bg-gray-50/50 font-sans">
            <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 border-[3px] border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Loading Records...</p>
            </div>
        </div>
    );

    const latest = salaries?.[0];
    const totalEarnings = salaries?.reduce((acc, s) => acc + (s.amount || 0), 0) || 0;

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight print:hidden">
            {/* Header - Consistent with Staff Management */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-40 h-16">
                <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-1.5 bg-indigo-600 rounded-full" />
                        <div>
                            <h1 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Personal Payroll</h1>
                            <p className="text-[10px] text-gray-400 font-medium font-mono uppercase">Node: {user?.id?.slice(-8).toUpperCase()}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <Input
                                placeholder="Search cycle..."
                                className="h-9 pl-9 w-[180px] rounded-xl border-gray-200 bg-gray-50 text-[10px] font-bold uppercase tracking-wider"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button className="h-9 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-widest gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-95">
                            <Zap className="h-4 w-4" /> Export All
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Statistics Matrix - consistent with Admin view */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Cumulative Pay', value: `PKR ${(totalEarnings / 1000).toFixed(1)}k`, icon: Wallet, color: 'text-gray-700', bg: 'bg-white', iconBg: 'bg-gray-100' },
                        { label: 'Latest Net', value: latest?.amount ? `PKR ${(latest.amount / 1000).toFixed(1)}k` : '--', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50', iconBg: 'bg-indigo-100' },
                        { label: 'Current Cycle', value: latest?.month || 'N/A', icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50', iconBg: 'bg-amber-100' },
                        { label: 'Base Wage', value: user?.basicSalary ? `PKR ${user.basicSalary.toLocaleString()}` : '--', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', iconBg: 'bg-emerald-100' },
                    ].map((stat, i) => (
                        <div key={i} className={`${stat.bg} border border-gray-100 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all`}>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                <p className={`text-2xl md:text-3xl font-bold ${stat.color} tracking-tighter tabular-nums`}>{stat.value}</p>
                            </div>
                            <div className={`h-12 w-12 ${stat.iconBg} rounded-2xl flex items-center justify-center`}>
                                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* History Desk */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Disbursement History</h2>
                            <p className="text-[10px] text-gray-400 font-medium">{filteredSalaries.length} records mapped</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {filteredSalaries.map((salary) => (
                            <div key={salary.id} className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
                                {/* Card Header */}
                                <div className="p-6 border-b border-gray-50">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-4">
                                            <div className="h-14 w-14 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl flex items-center justify-center border border-indigo-100 group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-all duration-500 shadow-inner">
                                                <Calendar className="h-7 w-7 text-indigo-500 group-hover:text-white transition-colors" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-tight">{salary.month} Slip</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono">ID: {salary.id.slice(-6).toUpperCase()}</span>
                                                    <div className="h-1 w-1 rounded-full bg-gray-200" />
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                                                        {salary.paymentDate ? format(new Date(salary.paymentDate), 'MMM dd, yyyy') : 'PENDING'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className={`${salary.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'} text-[8px] font-black uppercase px-2.5 py-1 rounded-full border shadow-sm`}>
                                            {salary.status}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Financial Grid */}
                                <div className="px-6 py-5 grid grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Retainer</p>
                                        <p className="text-xs font-bold text-gray-900">{(salary.basicSalary || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="border-x border-gray-50 px-4">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Bonus</p>
                                        <p className="text-xs font-bold text-emerald-600">+{(salary.bonuses || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Deduct</p>
                                        <p className="text-xs font-bold text-rose-500">-{(salary.deductions || 0).toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Net Indicator */}
                                <div className="px-6 pb-6 mt-1">
                                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-center justify-between group-hover:bg-indigo-50/30 group-hover:border-indigo-100 transition-colors">
                                        <div>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Net Transferred</p>
                                            <p className="text-xl font-black text-gray-900 tracking-tighter tabular-nums">PKR {(salary.amount || 0).toLocaleString()}</p>
                                        </div>
                                        <Button
                                            size="icon"
                                            className="h-10 w-10 rounded-xl bg-white border border-gray-200 hover:bg-gray-900 hover:text-white text-gray-400 transition-all shadow-sm active:scale-95"
                                            onClick={() => {
                                                setSelectedSalary(salary);
                                                setIsSlipOpen(true);
                                            }}
                                        >
                                            <ArrowUpRight className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {(!filteredSalaries || filteredSalaries.length === 0) && (
                            <div className="col-span-full py-24 bg-white border-2 border-dashed border-gray-100 rounded-[3rem] flex flex-col items-center justify-center text-center shadow-sm">
                                <History className="h-12 w-12 text-gray-200 mb-4" />
                                <h3 className="text-lg font-bold text-gray-900 uppercase">No records found</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-3 max-w-xs leading-relaxed">
                                    Your personal payroll history is currently blank. Contact the administration if this is a discrepancy.
                                </p>
                            </div>
                        )}
                    </div>
                </div>


            </main>

            {/* Slip Dialog */}
            <Dialog open={isSlipOpen} onOpenChange={setIsSlipOpen}>
                <DialogContent className="max-w-4xl p-0 bg-transparent border-none">
                    {selectedSalary && <SalarySlip salary={selectedSalary} />}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default WardenSalaryPortal;
