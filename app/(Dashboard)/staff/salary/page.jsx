"use client";
import React, { useState } from 'react';
import {
    DollarSign,
    Calendar,
    FileText,
    History,
    ChevronRight,
    ArrowUpRight,
    Clock,
    CheckCircle2,
    TrendingUp,
    ShieldCheck,
    Download,
    Search
} from 'lucide-react';
import { useAllSalaries } from '@/hooks/useSalaries';
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

const StaffSalaryPage = () => {
    const { user } = useAuthStore();
    const [selectedSalary, setSelectedSalary] = useState(null);
    const [isSlipOpen, setIsSlipOpen] = useState(false);

    const { data: salaries, isLoading } = useAllSalaries({
        userId: user?.id
    });

    if (isLoading) return (
        <div className="flex h-screen items-center justify-center bg-white font-sans">
            <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 border-2 border-gray-100 border-t-black rounded-full animate-spin" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Loading Records...</p>
            </div>
        </div>
    );

    const latest = salaries?.[0];

    return (
        <div className="min-h-screen bg-white pb-20 font-sans tracking-tight selection:bg-black selection:text-white">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-40 bg-white/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">My Salary</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Salary History & Details</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button className="h-9 px-5 rounded-2xl bg-black hover:bg-gray-800 text-white font-bold text-[10px] uppercase tracking-widest gap-2 shadow-sm transition-all active:scale-95">
                            <Download className="h-4 w-4" /> Download Slip
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Base Pay', value: latest?.basicSalary ? `PKR ${latest.basicSalary.toLocaleString()}` : '--', icon: ShieldCheck, color: 'text-indigo-600', from: 'from-indigo-50' },
                        { label: 'Latest Pay', value: latest ? `PKR ${latest.amount.toLocaleString()}` : '0.00', icon: TrendingUp, color: 'text-emerald-600', from: 'from-emerald-50' },
                        { label: 'Month', value: latest?.month || 'N/A', icon: Calendar, color: 'text-blue-600', from: 'from-blue-50' },
                        { label: 'Status', value: latest?.status || 'N/A', icon: Clock, color: 'text-gray-400', from: 'from-gray-50' },
                    ].map((stat, i) => (
                        <Card key={i} className="bg-white border-gray-100 shadow-sm rounded-3xl overflow-hidden group hover:shadow-md transition-all">
                            <div className={`h-1 px-4 bg-gradient-to-r ${stat.from} to-white`} />
                            <div className="p-5 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{stat.label}</p>
                                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-3xl font-bold text-gray-900 tracking-tighter tabular-nums">{stat.value}</p>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Salary Detail</span>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* History */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <History className="h-5 w-5 text-gray-400" />
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Payment History</h3>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {salaries?.map((salary) => (
                            <div key={salary.id} className="bg-white border border-gray-100 rounded-[2rem] p-6 hover:shadow-md transition-all flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                                <div className="flex items-center gap-6 w-full md:w-auto">
                                    <div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100">
                                        <FileText className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-tight">{salary.month} Slip</h4>
                                            <Badge variant="outline" className={`${salary.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'} text-[9px] font-bold uppercase px-3 py-1 border-none rounded-full`}>
                                                {salary.status === 'PAID' ? 'Paid' : 'Pending'}
                                            </Badge>
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                                            ID: #{salary.id.slice(-6).toUpperCase()} • {salary.paymentDate ? format(new Date(salary.paymentDate), 'MMM dd, yyyy') : 'Coming Soon'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-12">
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Net Amount</p>
                                        <p className="text-2xl font-bold text-gray-900 tracking-tighter tabular-nums">PKR {salary.amount.toLocaleString()}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-11 w-11 rounded-2xl border border-gray-100 text-gray-400 hover:text-black hover:bg-white transition-all"
                                        onClick={() => {
                                            setSelectedSalary(salary);
                                            setIsSlipOpen(true);
                                        }}
                                    >
                                        <ArrowUpRight className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {(!salaries || salaries.length === 0) && (
                            <div className="py-24 bg-white border-2 border-dashed border-gray-100 rounded-[3rem] flex flex-col items-center justify-center text-center shadow-sm">
                                <History className="h-10 w-10 text-gray-200 mb-4" />
                                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">No records found</p>
                            </div>
                        )}
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

export default StaffSalaryPage;

