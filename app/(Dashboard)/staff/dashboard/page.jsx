"use client";
import React, { useMemo, useState } from "react";
import {
    DollarSign, TrendingUp, Calendar, ArrowUpRight,
    FileText, History, Wallet, UserCircle, CreditCard,
    Star,
    ShieldCheck, Clock, Loader2, Fingerprint, Signal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import useAuthStore from "@/hooks/Authstate";
import { useAttendance } from "@/hooks/useAttendance";
import { useAllSalaries } from "@/hooks/useSalaries";
import { useStaffProfile } from "@/hooks/useStaffProfile";
import SalarySlip from "@/components/SalarySlip";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";

const StaffDashboard = () => {
    const user = useAuthStore((state) => state.user);
    const { data: salaries, isLoading: salariesLoading } = useAllSalaries({ userId: user?.id });
    const { data: staffProfile, isLoading: profileLoading } = useStaffProfile(user?.id);
    const { activeCheckIn, punchIn, punchOut, isPunching } = useAttendance(user?.id);

    const [selectedSalary, setSelectedSalary] = useState(null);
    const [isSlipOpen, setIsSlipOpen] = useState(false);

    const latest = salaries?.[0];
    const totalEarned = salaries?.reduce((acc, curr) => acc + curr.amount, 0) || 0;

    if (salariesLoading || profileLoading) return (
        <div className="flex h-screen items-center justify-center bg-white font-sans">
            <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 border-2 border-gray-100 border-t-black rounded-full animate-spin" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Loading Dashboard...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-white pb-20 font-sans tracking-tight selection:bg-black selection:text-white">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-40 bg-white/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Hello, {user?.name?.split(' ')[0]}</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Staff Portal</span>
                            <span className="h-1 w-1 rounded-full bg-gray-200" />
                            <div className={`flex items-center gap-1.5`}>
                                <div className={`h-1.5 w-1.5 rounded-full ${activeCheckIn ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gray-300'}`} />
                                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                                    {activeCheckIn ? 'On Duty' : 'Off Duty'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            className={`h-9 px-5 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-sm ${activeCheckIn
                                ? 'bg-black hover:bg-gray-800 text-white'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                }`}
                            onClick={() => activeCheckIn ? punchOut("End shift") : punchIn("Start shift")}
                            disabled={isPunching}
                        >
                            {isPunching ? <Loader2 className="h-3 w-3 animate-spin" /> : <Fingerprint className="h-4 w-4" />}
                            {activeCheckIn ? 'Check Out' : 'Check In'}
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Salary Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Earned', value: `PKR ${totalEarned.toLocaleString()}`, icon: Wallet, color: 'text-emerald-600', from: 'from-emerald-50' },
                        { label: 'Latest Pay', value: latest ? `PKR ${latest.amount.toLocaleString()}` : '--', icon: TrendingUp, color: 'text-indigo-600', from: 'from-indigo-50' },
                        { label: 'Base Pay', value: latest?.basicSalary ? `PKR ${latest.basicSalary.toLocaleString()}` : '--', icon: CreditCard, color: 'text-blue-600', from: 'from-blue-50' },
                        { label: 'Rating', value: staffProfile?.performanceRating?.toFixed(1) || "5.0", icon: Star, color: 'text-amber-600', from: 'from-amber-50' },
                    ].map((stat, i) => (
                        <Card key={i} className="bg-white border-gray-100 shadow-sm rounded-3xl overflow-hidden group hover:shadow-md transition-all">
                            <div className={`h-1 px-4 bg-gradient-to-r ${stat.from} to-white`} />
                            <div className="p-5 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{stat.label}</p>
                                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-3xl font-bold text-gray-900 tracking-tighter">{stat.value}</p>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Financial Metric</span>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* User Profile Summary */}
                    <Card className="bg-white border-gray-100 shadow-sm rounded-3xl overflow-hidden flex flex-col h-full">
                        <div className="p-1 bg-gray-900">
                            <div className="bg-gray-800 rounded-[1.4rem] p-6 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="h-16 w-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl font-bold backdrop-blur-md">
                                        {user?.name?.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold tracking-tight">{user?.name}</h3>
                                        <Badge className="bg-white/10 text-white border-0 text-[8px] uppercase font-bold tracking-widest mt-1">
                                            {user?.role || 'Staff'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 flex-1 space-y-6">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Employment Info</p>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                            <Calendar className="h-3.5 w-3.5" /> Start Date
                                        </span>
                                        <span className="text-xs font-bold text-gray-900">{user?.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                            <ShieldCheck className="h-3.5 w-3.5" /> ID Status
                                        </span>
                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-600 text-[8px] font-bold border-none px-2">Verified</Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-50">
                                <Link href="/staff/profile">
                                    <Button variant="outline" className="w-full h-10 rounded-xl border-gray-100 text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all">
                                        View Full Profile
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </Card>

                    {/* Salary Feed */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                                <History className="h-5 w-5 text-gray-400" />
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Recent Payments</h3>
                            </div>
                            <Link href="/staff/salary">
                                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:underline cursor-pointer">View All</span>
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {(!salaries || salaries.length === 0) ? (
                                <div className="py-20 bg-white border border-gray-100 rounded-[2rem] flex flex-col items-center justify-center text-center shadow-sm">
                                    <History className="h-8 w-8 text-gray-200 mb-3" />
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">No Records Yet</p>
                                </div>
                            ) : (
                                salaries.slice(0, 5).map(salary => (
                                    <div
                                        key={salary.id}
                                        className="bg-white border border-gray-100 rounded-[1.8rem] p-5 hover:bg-gray-50 transition-all flex items-center justify-between shadow-sm cursor-pointer group"
                                        onClick={() => {
                                            setSelectedSalary(salary);
                                            setIsSlipOpen(true);
                                        }}
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="h-12 w-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:text-black transition-colors">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-900 tracking-tight uppercase">
                                                    {salary.month} Slip
                                                </h4>
                                                <div className="flex items-center gap-3 mt-0.5">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">#{salary.id.slice(-6).toUpperCase()}</span>
                                                    <span className="h-1 w-1 rounded-full bg-gray-200" />
                                                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Paid</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center gap-6">
                                            <div>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Amount</p>
                                                <p className="text-lg font-bold text-gray-900 tracking-tighter">PKR {salary.amount.toLocaleString()}</p>
                                            </div>
                                            <Button variant="ghost" size="sm" className="h-10 w-10 rounded-2xl p-0 text-gray-300 group-hover:text-black group-hover:bg-white transition-all">
                                                <ArrowUpRight className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Slip Dialog */}
            <Dialog open={isSlipOpen} onOpenChange={setIsSlipOpen}>
                <DialogContent className="max-w-4xl p-0 bg-transparent border-none">
                    <SalarySlip salary={selectedSalary} />
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default StaffDashboard;

