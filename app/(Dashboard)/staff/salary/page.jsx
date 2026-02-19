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
    CheckCircle2
} from 'lucide-react';
import { useAllSalaries } from '@/hooks/useSalaries';
import useAuthStore from '@/hooks/Authstate';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

    if (isLoading) {
        return (
            <div className="p-8 space-y-4 animate-pulse">
                <div className="h-40 bg-gray-100 rounded-3xl" />
                <div className="h-64 bg-gray-50 rounded-3xl" />
            </div>
        );
    }

    const latest = salaries?.[0];

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-gray-50/50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Salary & Earnings</h1>
                    <p className="text-sm text-gray-500 font-medium">View your payment history and salary slips</p>
                </div>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-indigo-600 rounded-[2rem] p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <DollarSign className="h-20 w-20" />
                    </div>
                    <div className="relative z-10 space-y-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Latest Disbursement</p>
                        <div>
                            <p className="text-4xl font-bold tracking-tight">
                                PKR {latest ? latest.amount.toLocaleString() : '0'}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge className="bg-white/20 text-white border-none text-[10px] uppercase font-bold">
                                    {latest?.status || 'No Data'}
                                </Badge>
                                <span className="text-[10px] opacity-70 font-bold uppercase tracking-wider">{latest?.month}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Assigned Designation</p>
                        <p className="text-xl font-bold text-gray-900 uppercase">{user?.role || 'Staff Member'}</p>
                    </div>
                    <div className="pt-4 flex items-center gap-4">
                        <div className="flex-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Base Salary</p>
                            <p className="text-lg font-bold text-gray-900">PKR {latest?.basicSalary?.toLocaleString() || '--'}</p>
                        </div>
                        {latest && (
                            <Button
                                variant="outline"
                                className="rounded-xl font-bold text-[10px] uppercase tracking-widest h-10 px-4"
                                onClick={() => {
                                    setSelectedSalary(latest);
                                    setIsSlipOpen(true);
                                }}
                            >
                                <FileText className="h-3.5 w-3.5 mr-2" /> View payslip
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50 flex items-center gap-3">
                    <History className="h-5 w-5 text-gray-400" />
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Payment History</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-8 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Month</th>
                                <th className="px-8 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Amount</th>
                                <th className="px-8 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date Paid</th>
                                <th className="px-8 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {salaries?.map((salary) => (
                                <tr key={salary.id} className="group hover:bg-gray-50/30 transition-colors">
                                    <td className="px-8 py-5">
                                        <p className="text-sm font-bold text-gray-900">{salary.month}</p>
                                    </td>
                                    <td className="px-8 py-5">
                                        <p className="text-sm font-bold text-gray-700">PKR {salary.amount.toLocaleString()}</p>
                                    </td>
                                    <td className="px-8 py-5">
                                        <Badge variant="outline" className={`rounded-full px-3 py-0.5 text-[9px] font-bold uppercase ${salary.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                salary.status === 'PROCESSING' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                    'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}>
                                            {salary.status}
                                        </Badge>
                                    </td>
                                    <td className="px-8 py-5">
                                        <p className="text-[11px] font-medium text-gray-500">
                                            {salary.paymentDate ? format(new Date(salary.paymentDate), 'MMM dd, yyyy') : '--'}
                                        </p>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 rounded-lg px-3 font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600"
                                            onClick={() => {
                                                setSelectedSalary(salary);
                                                setIsSlipOpen(true);
                                            }}
                                        >
                                            Details <ChevronRight className="h-3 w-3 ml-1" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Slip Modal */}
            <Dialog open={isSlipOpen} onOpenChange={setIsSlipOpen}>
                <DialogContent className="max-w-4xl p-0 h-[90vh] bg-transparent border-none">
                    <SalarySlip salary={selectedSalary} />
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default StaffSalaryPage;
