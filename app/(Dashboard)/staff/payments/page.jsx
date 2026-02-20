"use client";
import React, { useState } from 'react';
import {
    CreditCard,
    DollarSign,
    Search,
    ChevronRight,
    History,
    FileText,
    ArrowUpRight,
    CheckCircle2,
    Calendar,
    ArrowRight,
    TrendingUp,
    Download
} from 'lucide-react';
import { useAllSalaries } from '@/hooks/useSalaries';
import useAuthStore from '@/hooks/Authstate';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import SalarySlip from '@/components/SalarySlip';

const StaffPaymentsPage = () => {
    const { user } = useAuthStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [isSlipOpen, setIsSlipOpen] = useState(false);

    const { data: salaries, isLoading } = useAllSalaries({
        userId: user?.id,
        status: 'PAID'
    });

    const filteredPayments = salaries?.filter(p =>
        p.month.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 border-2 border-gray-100 border-t-black rounded-full animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Auditing Ledger...</p>
                </div>
            </div>
        );
    }

    const totalEarned = salaries?.reduce((acc, curr) => acc + curr.amount, 0) || 0;

    return (
        <div className="min-h-screen bg-gray-50/30 pb-20 font-sans antialiased">
            {/* Slim Premium Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-1 bg-black rounded-full" />
                        <div className="flex flex-col">
                            <h1 className="text-sm font-black text-gray-900 uppercase tracking-tighter">Financial Audit</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Salary Disbursements</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <Input
                                placeholder="Filter registry..."
                                className="h-9 w-64 pl-9 rounded-xl border-gray-100 bg-gray-50 text-[10px] font-bold uppercase tracking-wider focus:bg-white transition-all shadow-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button className="h-9 px-4 rounded-xl bg-black hover:bg-gray-800 text-white font-bold text-[10px] uppercase tracking-widest gap-2 shadow-xl shadow-gray-200">
                            <Download className="h-3.5 w-3.5" /> Full Audit
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 py-8">
                {/* Board Summary Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Ingress', value: `PKR ${totalEarned.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Last Cycle', value: salaries?.[0] ? `PKR ${salaries[0].amount.toLocaleString()}` : 'N/A', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { label: 'Cycles Paid', value: salaries?.length || 0, icon: History, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Registry ID', value: user?.id?.slice(-8).toUpperCase() || 'N/A', icon: CreditCard, color: 'text-gray-400', bg: 'bg-gray-100' },
                    ].map((stat, i) => (
                        <Card key={i} className="bg-white border-none shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] p-4 rounded-2xl flex items-center gap-4">
                            <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-0.5">{stat.label}</p>
                                <p className="text-base font-black text-gray-900 tracking-tighter">{stat.value}</p>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Ledger Body */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-gray-400" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Transaction History</h3>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredPayments?.map((payment) => (
                            <Card key={payment.id} className="group bg-white border-transparent hover:border-gray-100 shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] hover:shadow-xl transition-all rounded-[1.5rem] overflow-hidden flex flex-col">
                                <div className="p-5 flex-1 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase px-2 py-0 border-none">
                                            DISBURSED
                                        </Badge>
                                        <span className="text-[9px] font-mono font-bold text-gray-300">
                                            #SLR-{payment.id.slice(-6).toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{payment.month}</p>
                                        <h4 className="text-xl font-black text-gray-900 tracking-tighter italic leading-none">
                                            PKR {payment.amount.toLocaleString()}
                                        </h4>
                                    </div>

                                    <div className="flex items-center gap-4 pt-1 border-t border-gray-50">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-3 w-3 text-gray-400" />
                                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                                                {payment.paymentDate ? format(new Date(payment.paymentDate), 'MMM dd, yyyy') : 'Pending'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-5 py-3.5 bg-gray-50/50 flex items-center justify-between border-t border-gray-100/50">
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Digital Auth Verified</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 rounded-lg text-black hover:bg-black hover:text-white text-[9px] font-black uppercase tracking-widest px-3 transition-all gap-1.5 group/btn"
                                        onClick={() => {
                                            setSelectedPayment(payment);
                                            setIsSlipOpen(true);
                                        }}
                                    >
                                        Ticket <ArrowUpRight className="h-3 w-3 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                                    </Button>
                                </div>
                            </Card>
                        ))}

                        {filteredPayments?.length === 0 && (
                            <div className="col-span-full py-20 bg-white rounded-[2rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center gap-4 text-center">
                                <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center">
                                    <History className="h-6 w-6 text-gray-200" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-900">No Transactions Recorded</p>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Registry awaits initial disbursement.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Salary Slip Dialog */}
            <Dialog open={isSlipOpen} onOpenChange={setIsSlipOpen}>
                <DialogContent className="max-w-4xl p-0 bg-transparent border-none overflow-hidden h-[90vh]">
                    <SalarySlip salary={selectedPayment} />
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default StaffPaymentsPage;

