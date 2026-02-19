import React from 'react';
import {
    Printer,
    Building2,
    Calendar,
    Wallet,
    Hash,
    CheckCircle2,
    Clock,
    User,
    ArrowDownRight,
    ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

const SalarySlip = ({ salary }) => {
    if (!salary) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="bg-white rounded-[2rem] overflow-hidden max-w-2xl mx-auto shadow-2xl print:shadow-none print:m-0 flex flex-col font-sans selection:bg-indigo-600 selection:text-white print-slip-container">
            {/* Minimal Header */}
            <div className="bg-slate-900 p-10 text-white flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32" />

                <div className="relative z-10 flex flex-col gap-1">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-6 w-6 rounded-lg bg-indigo-500 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-300">Staff Payroll</span>
                    </div>
                    <h1 className="text-2xl font-black uppercase tracking-tight italic">Salary Pay Slip</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID:</span>
                        <span className="text-[10px] font-mono font-bold text-slate-300">#{salary.id.slice(-8).toUpperCase()}</span>
                    </div>
                </div>

                <div className="text-right flex flex-col items-end relative z-10">
                    <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 backdrop-blur-md">
                        <Wallet className="h-6 w-6 text-indigo-400" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fiscal Cycle</span>
                    <span className="text-xl font-black text-white uppercase italic tracking-tight">{salary.month}</span>
                </div>
            </div>

            <div className="p-10 space-y-10 bg-white">
                {/* Information Matrix */}
                <div className="grid grid-cols-2 gap-10">
                    <div className="space-y-1.5 pt-4 border-t border-slate-100">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Recipient Profile</span>
                        <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight italic">{salary.StaffProfile?.User?.name}</h4>
                        <div className="flex flex-col gap-0.5 mt-1">
                            <p className="text-[11px] font-bold text-slate-500">{salary.StaffProfile?.designation}</p>
                            <p className="text-[11px] font-medium text-slate-400">{salary.StaffProfile?.User?.email}</p>
                        </div>
                    </div>

                    <div className="space-y-1.5 pt-4 border-t border-slate-100 text-right">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Node Information</span>
                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{salary.StaffProfile?.User?.Hostel_User_hostelIdToHostel?.name || "GreenView Networks"}</p>
                        <p className="text-[11px] font-bold text-slate-500 mt-0.5">{salary.StaffProfile?.department || 'Operational Core'}</p>
                        <div className="flex justify-end mt-3">
                            <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${salary.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                                {salary.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Ledger Breakdown */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <Hash className="h-3.5 w-3.5 text-indigo-500" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fiscal Breakdown</span>
                    </div>

                    <div className="border border-slate-100 rounded-[1.5rem] overflow-hidden shadow-sm">
                        <div className="bg-slate-50 border-b border-slate-100 py-4 px-6 flex justify-between">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Component Description</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Magnitude (PKR)</span>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {[
                                { label: 'Base Retainer', value: salary.basicSalary, icon: ArrowUpRight, color: 'text-slate-900' },
                                { label: 'Allowances & Perks', value: salary.allowances, icon: ArrowUpRight, color: 'text-emerald-600' },
                                { label: 'Performance Bonus', value: salary.bonuses, icon: ArrowUpRight, color: 'text-emerald-600' },
                                { label: 'Operational Deductions', value: -salary.deductions, icon: ArrowDownRight, color: 'text-rose-600' }
                            ].map((item, idx) => (
                                <div key={idx} className={`py-5 px-6 flex justify-between items-center ${item.label.includes('Deduction') ? 'bg-rose-50/20' : ''}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`h-6 w-6 rounded-lg ${item.label.includes('Deduction') ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'} flex items-center justify-center shrink-0`}>
                                            <item.icon className="h-3.5 w-3.5" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-700">{item.label}</span>
                                    </div>
                                    <span className={`text-xs font-black ${item.color}`}>
                                        {item.value >= 0 ? '+' : ''}{item.value.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="bg-slate-900 py-8 px-10 flex justify-between items-center">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold uppercase text-indigo-400 tracking-widest italic">Net Ingress</span>
                                <span className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Authorized Disbursement</span>
                            </div>
                            <span className="text-3xl font-black text-white italic tracking-tighter">
                                PKR {salary.amount.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer Logistics */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-10 border-t border-slate-50">
                    <div className="flex items-center gap-4 bg-slate-50 p-4 px-6 rounded-2xl border border-slate-100 min-w-[300px]">
                        <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0">
                            {salary.status === 'PAID' ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Clock className="h-5 w-5 text-amber-500" />}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Disbursement Protocol</span>
                            <span className="text-xs font-bold text-slate-900 uppercase">{salary.paymentMethod?.replace('_', ' ') || 'Authorization Pending'}</span>
                            <span className="text-[9px] font-medium text-slate-400 italic mt-0.5">
                                {salary.paymentDate ? format(new Date(salary.paymentDate), 'PPPP') : 'Verification In Progress'}
                            </span>
                        </div>
                    </div>

                    <div className="text-center md:text-right flex flex-col items-center md:items-end gap-1">
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">Electronic Audit Slip</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[8px] text-slate-300 font-medium">GVH-HUB-${salary.id.toUpperCase()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Disclosure */}
            <div className="p-6 bg-slate-50/50 text-center border-t border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic leading-relaxed">
                    This document serves as an official proof of earnings and tax-verified ledger record.
                    Generated via GreenView Management Systems.
                </p>
            </div>

            {/* Action Bar - Hidden in Print */}
            <div className="p-8 bg-white flex justify-end gap-3 print:hidden border-t border-slate-100">
                <Button variant="outline" className="h-12 rounded-xl px-8 font-black text-[11px] uppercase tracking-widest border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all font-sans" onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" /> Print Document
                </Button>
                <Button className="h-12 rounded-xl px-10 font-black text-[11px] uppercase tracking-widest bg-slate-900 text-white hover:bg-black shadow-xl shadow-slate-900/10 active:scale-95 transition-all font-sans" onClick={handlePrint}>
                    Download Manifest
                </Button>
            </div>

            <style jsx global>{`
                @media print {
                    @page { margin: 0; size: auto; }
                    body {
                        margin: 0;
                        padding: 0;
                        background: white !important;
                    }
                    /* Hide everything by default */
                    body > *:not([data-radix-portal]) {
                        display: none !important;
                    }
                    [data-radix-portal] {
                        display: block !important;
                    }
                    [data-radix-portal] > * {
                        display: none !important;
                    }
                    body [data-radix-portal] .print-slip-container {
                        display: flex !important;
                        position: fixed !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        height: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        z-index: 99999 !important;
                        background: white !important;
                        border: none !important;
                        box-shadow: none !important;
                        border-radius: 0 !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default SalarySlip;

