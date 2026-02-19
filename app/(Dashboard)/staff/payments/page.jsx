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
    CheckCircle2
} from 'lucide-react';
import { useAllSalaries } from '@/hooks/useSalaries';
import useAuthStore from '@/hooks/Authstate';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

    // Specifically fetch PAID salaries for the payments page
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
            <div className="p-8 space-y-4 animate-pulse">
                <div className="h-40 bg-gray-100 rounded-[2.5rem]" />
                <div className="h-64 bg-gray-50 rounded-[2.5rem]" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-gray-50/50 min-h-screen">
            {/* Minimal Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase italic">
                        Received <span className="text-emerald-600">Salaries</span>
                    </h1>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">
                        Audit of successful fiscal disbursements
                    </p>
                </div>

                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                    <Input
                        placeholder="FILTER BY MONTH OR ID..."
                        className="pl-10 h-11 w-[280px] rounded-xl border-gray-200 bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all font-bold text-[10px] uppercase tracking-widest"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Total Earnings Card */}
            <div className="bg-black text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <DollarSign className="h-32 w-32" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <span className="px-4 py-1.5 rounded-full bg-emerald-500 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-500/20">
                            Cumulative Earnings
                        </span>
                        <div>
                            <p className="text-5xl font-black tracking-tighter italic">
                                PKR {salaries?.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString() || '0'}
                            </p>
                            <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-[0.2em] flex items-center gap-2">
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" /> All Node disbursements verified
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Ledger */}
            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex items-center gap-4">
                    <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                        <History className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Disbursement Audit</h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Chronological record of successful payments</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Cycle</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Registry ID</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Terminal Date</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount Ingress</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredPayments?.map((payment) => (
                                <tr key={payment.id} className="group hover:bg-gray-50/50 transition-all duration-300">
                                    <td className="px-8 py-8">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 bg-black rounded-2xl flex items-center justify-center text-white font-black text-xs italic shadow-lg shadow-black/5 group-hover:scale-110 transition-transform">
                                                {payment.month.slice(0, 3).toUpperCase()}
                                            </div>
                                            <span className="text-sm font-black text-gray-900 uppercase tracking-tight">{payment.month}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-8">
                                        <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100 uppercase tracking-widest">
                                            #SLR-{payment.id.slice(-8).toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-8 py-8">
                                        <p className="text-sm font-bold text-gray-600 tracking-tight">
                                            {payment.paymentDate ? format(new Date(payment.paymentDate), 'MMM dd, yyyy') : 'N/A'}
                                        </p>
                                    </td>
                                    <td className="px-8 py-8">
                                        <div className="flex flex-col">
                                            <p className="text-sm font-black text-gray-900 tracking-tight italic">PKR {payment.amount.toLocaleString()}</p>
                                            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mt-1">Status: DISBURSED</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-8 text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-10 rounded-xl px-6 font-black text-[10px] uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 gap-2 transition-all active:scale-95"
                                            onClick={() => {
                                                setSelectedPayment(payment);
                                                setIsSlipOpen(true);
                                            }}
                                        >
                                            <FileText className="h-3.5 w-3.5" /> Manifest <ArrowUpRight className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {filteredPayments?.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <CreditCard className="h-12 w-12" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">No verified disbursements found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

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
