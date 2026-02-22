import React from 'react';
import {
    Printer,
    Download,
    Wallet,
    Calendar,
    Hash,
    Building2,
    User,
    Info,
    ExternalLink,
    CheckCircle2,
    ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const SalarySlip = ({ salary }) => {
    if (!salary) return null;

    const handlePrint = () => {
        window.print();
    };

    const isPaid = salary.status === 'PAID';

    return (
        <div className="bg-white rounded-[2rem] overflow-hidden shadow-2xl max-w-md mx-auto border border-gray-100 font-sans group">
            {/* Interactive Header */}
            <div className="bg-indigo-600 p-8 text-white relative overflow-hidden transition-all duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-110 transition-transform" />
                <div className="flex justify-between items-start relative z-10">
                    <div className="flex flex-col gap-3">
                        <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/10">
                            <Wallet className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold uppercase tracking-tight text-white">Salary Pay Slip</h2>
                            <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em] mt-0.5">
                                SLR-{salary.id?.slice(-8).toUpperCase()}
                            </p>
                        </div>
                    </div>
                    <Badge className={`${isPaid ? 'bg-emerald-500/20' : 'bg-amber-500/20'} text-white border-none text-[8px] font-bold px-3 py-1 rounded-full uppercase tracking-widest`}>
                        {salary.status || 'Verified'}
                    </Badge>
                </div>
            </div>

            <div className="p-8 space-y-6 bg-white">
                {/* Identity Info */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Recipient</span>
                        <p className="text-xs font-bold text-slate-900 truncate">{salary.StaffProfile?.User?.name}</p>
                        <p className="text-[9px] font-medium text-slate-400 truncate">
                            {salary.StaffProfile?.designation || 'Staff'} • {salary.StaffProfile?.User?.email}
                        </p>
                    </div>
                    <div className="space-y-1 text-right">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Period</span>
                        <p className="text-xs font-bold text-slate-900 truncate">{salary.month}</p>
                        <p className="text-[9px] font-medium text-slate-400 uppercase">
                            {salary.paymentDate ? format(new Date(salary.paymentDate), 'MMM dd, yyyy') : 'Payment Scheduled'}
                        </p>
                    </div>
                </div>

                {/* Ledger */}
                <div className="space-y-3 pt-2">
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">Transaction Ledger</span>
                    <div className="space-y-2">
                        {[
                            { label: "Basic Retainer", value: salary.basicSalary },
                            { label: "Allowances & Perks", value: salary.allowances || 0 },
                            { label: "Performance Bonus", value: salary.bonuses || 0 },
                            { label: "Operational Deductions", value: -(salary.deductions || 0), isDeduction: true }
                        ].map((item, i) => (
                            <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-none">
                                <span className={`text-xs font-semibold ${item.isDeduction ? 'text-rose-400' : 'text-slate-500'}`}>{item.label}</span>
                                <span className={`text-xs font-bold ${item.isDeduction ? 'text-rose-600' : 'text-slate-900'}`}>
                                    PKR {(Number(item.value) || 0).toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Total Box */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col items-center justify-center gap-1 group-hover:bg-slate-100/50 transition-colors relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <ShieldCheck className="h-24 w-24 text-indigo-600" />
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest relative z-10">Net Disbursement</span>
                    <div className="text-2xl font-black text-slate-900 tracking-tighter relative z-10">
                        PKR {(Number(salary.amount) || 0).toLocaleString()}
                    </div>
                </div>

                {/* Verification Seal */}
                <div className="flex justify-between items-center py-2 px-1 border-t border-dashed border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-emerald-50 flex items-center justify-center">
                            <ShieldCheck className="h-3 w-3 text-emerald-500" />
                        </div>
                        <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">Digitally Verified</span>
                    </div>
                    <div className="text-[8px] font-mono text-slate-300">REF: {salary.id?.slice(-12).toUpperCase()}</div>
                </div>

                {/* Footer Note */}
                <div className="flex items-start gap-3 text-slate-400 bg-slate-50/50 p-4 rounded-xl">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <p className="text-[9px] leading-relaxed font-medium">
                        This is a system-generated electronic pay slip. It serves as a verified confirmation of the disbursement period mentioned above.
                    </p>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 pt-4 print:hidden">
                    <Button
                        variant="outline"
                        onClick={() => window.print()}
                        className="h-11 rounded-xl border-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-all"
                    >
                        <Printer className="h-3.5 w-3.5 mr-2 text-slate-400" /> Print Slip
                    </Button>
                    <Button
                        onClick={() => window.print()}
                        className="bg-indigo-600 h-11 rounded-xl text-white text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-indigo-100 transition-all active:scale-95 hover:bg-indigo-700 border-none"
                    >
                        <Download className="h-3.5 w-3.5 mr-2 text-white" /> Download
                    </Button>
                </div>
            </div>

            {/* Printable Content (Hidden on screen) */}
            <div className="hidden print:block bg-white text-black p-10 font-sans">
                <div className="text-center border-b-2 border-black pb-8 mb-8">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">GreenView Hostels</p>
                    <h1 className="text-2xl font-black uppercase">Official Pay Slip</h1>
                    <p className="text-xs font-mono font-bold mt-2">#{salary.id?.toUpperCase()}</p>
                </div>

                <div className="grid grid-cols-2 gap-10 mb-10">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b pb-1 mb-2">Recipient</p>
                        <p className="font-bold text-sm uppercase">{salary.StaffProfile?.User?.name}</p>
                        <p className="text-xs text-gray-600">{salary.StaffProfile?.designation}</p>
                    </div>
                    <div className="space-y-1 text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b pb-1 mb-2 text-right">Payment Details</p>
                        <p className="font-bold text-sm uppercase">Month: {salary.month}</p>
                        <p className="text-xs text-gray-600">Status: {salary.status}</p>
                    </div>
                </div>

                <div className="space-y-4 mb-10">
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-xs font-bold uppercase text-gray-500">Description</span>
                        <span className="text-xs font-bold uppercase text-gray-500">Amount (PKR)</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm">Basic Salary</span>
                        <span className="text-sm font-bold">{(Number(salary.basicSalary) || 0).toLocaleString()}</span>
                    </div>
                    {Number(salary.allowances) > 0 && (
                        <div className="flex justify-between">
                            <span className="text-sm">Allowances</span>
                            <span className="text-sm font-bold text-emerald-600">+{(Number(salary.allowances) || 0).toLocaleString()}</span>
                        </div>
                    )}
                    {Number(salary.bonuses) > 0 && (
                        <div className="flex justify-between">
                            <span className="text-sm">Bonuses</span>
                            <span className="text-sm font-bold text-emerald-600">+{(Number(salary.bonuses) || 0).toLocaleString()}</span>
                        </div>
                    )}
                    {Number(salary.deductions) > 0 && (
                        <div className="flex justify-between">
                            <span className="text-sm text-rose-500">Ductions</span>
                            <span className="text-sm font-bold text-rose-600">-{(Number(salary.deductions) || 0).toLocaleString()}</span>
                        </div>
                    )}
                </div>

                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Net Payable Amount</p>
                    <p className="text-2xl font-black">PKR {(Number(salary.amount) || 0).toLocaleString()}</p>
                </div>

                <p className="text-[9px] text-center text-gray-400 uppercase mt-20">System Generated Record • No Signature Required</p>
            </div>
        </div>
    );
};

export default SalarySlip;
