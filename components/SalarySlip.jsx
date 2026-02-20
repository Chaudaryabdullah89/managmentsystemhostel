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
    ArrowUpRight,
    Search,
    Download,
    ShieldCheck,
    CreditCard,
    Activity,
    Signal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

const SalarySlip = ({ salary }) => {
    if (!salary) return null;

    const handlePrint = () => {
        window.print();
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case "PAID": return { color: "text-emerald-600", bg: "bg-emerald-50", ribbon: "bg-emerald-500", label: "Paid" };
            case "PENDING": return { color: "text-amber-600", bg: "bg-amber-50", ribbon: "bg-amber-500", label: "Pending" };
            default: return { color: "text-gray-400", bg: "bg-gray-50", ribbon: "bg-gray-300", label: "Draft" };
        }
    };

    const style = getStatusStyle(salary.status);

    return (
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl overflow-y-auto max-h-[92vh] max-w-3xl mx-auto shadow-[0_20px_60px_rgba(0,0,0,0.08)] print:shadow-none print:m-0 flex flex-col font-sans selection:bg-black selection:text-white print-slip-container relative border border-gray-100">

            {/* Status Ribbon */}
            <div className={`absolute top-0 left-0 w-1.5 h-full ${style.ribbon} opacity-70`} />

            {/* Header */}
            <div className="px-8 py-7 flex justify-between items-center border-b border-gray-100 bg-gradient-to-b from-gray-50/50 to-white">

                <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-2xl bg-black flex items-center justify-center shadow-md">
                        <Building2 className="h-5 w-5 text-white" />
                    </div>

                    <div>
                        <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                            Salary Slip
                        </h1>
                        <p className="text-xs text-gray-400 uppercase tracking-widest">
                            GreenView Hostel
                        </p>
                    </div>
                </div>

                <div className="text-right">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${style.bg} ${style.color}`}>
                        {style.label}
                    </span>

                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
                        #{salary.id.slice(-6).toUpperCase()}
                    </p>
                </div>
            </div>

            {/* Body */}
            <div className="p-8 space-y-10">

                {/* Details */}
                <div className="grid grid-cols-2 gap-8">

                    {/* Staff */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                            <User className="h-4 w-4" />
                            Staff Member
                        </div>

                        <div className="bg-gray-50 p-6 rounded-[1.5rem] border border-gray-100">
                            <h3 className="text-base font-bold text-gray-900">
                                {salary.StaffProfile?.User?.name}
                            </h3>

                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                                {salary.StaffProfile?.designation || "Staff"}
                            </p>

                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
                                {salary.StaffProfile?.User?.email}
                            </p>
                        </div>
                    </div>

                    {/* Month */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                            <Calendar className="h-4 w-4" />
                            Salary Month
                        </div>

                        <div className="bg-gray-50 p-6 rounded-[1.5rem] border border-gray-100">
                            <h3 className="text-base font-bold text-gray-900">
                                {salary.month}
                            </h3>

                            <div className="flex items-center gap-2 mt-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                    Verified Record
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Breakdown */}
                <div className="space-y-4">

                    <div className="flex justify-between items-center px-1">
                        <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest">
                            Earning Breakdown
                        </h2>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Amount in PKR</span>
                    </div>

                    <div className="border border-gray-100 rounded-[2rem] overflow-hidden bg-white shadow-sm">

                        {[
                            { label: "Base Salary", value: salary.basicSalary, icon: ShieldCheck, color: "text-gray-900" },
                            { label: "Allowances", value: salary.allowances, icon: Activity, color: "text-emerald-600" },
                            { label: "Bonus", value: salary.bonuses, icon: ArrowUpRight, color: "text-emerald-600" },
                            { label: "Deductions", value: -salary.deductions, icon: ArrowDownRight, color: "text-rose-600" }
                        ].map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center px-7 py-5 border-b last:border-0 hover:bg-gray-50/50 transition-colors">

                                <div className="flex items-center gap-4">
                                    <div className="h-9 w-9 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                                        <item.icon className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <span className="text-[11px] font-bold text-gray-700 uppercase tracking-widest">
                                        {item.label}
                                    </span>
                                </div>

                                <span className={`text-base font-bold tracking-tight tabular-nums ${item.color}`}>
                                    {item.value >= 0 ? "+" : ""}{item.value.toLocaleString()}
                                </span>
                            </div>
                        ))}

                        {/* Total */}
                        <div className="bg-black px-8 py-7 flex justify-between items-center text-white">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">Total Amount</p>
                                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                                    Ref: GV-{salary.id.slice(-6).toUpperCase()}
                                </p>
                            </div>

                            <span className="text-3xl font-bold tracking-tighter tabular-nums">
                                PKR {salary.amount.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Meta */}
            <div className="px-8 py-6 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">

                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Payment Method</p>
                    <p className="text-xs font-bold text-gray-900 uppercase">
                        {salary.paymentMethod?.replace("_", " ") || "Wait..."}
                    </p>
                </div>

                <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Payment Date</p>
                    <p className="text-xs font-bold text-gray-900 uppercase">
                        {salary.paymentDate
                            ? format(new Date(salary.paymentDate), "MMM dd, yyyy")
                            : "Pending"}
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="px-8 py-6 border-t border-gray-100 flex justify-end gap-3 print:hidden">

                <Button
                    variant="ghost"
                    className="h-10 px-6 rounded-xl font-bold text-[10px] uppercase tracking-widest"
                    onClick={handlePrint}
                >
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                </Button>

                <Button
                    className="h-10 px-8 rounded-xl bg-black text-white hover:bg-gray-800 font-bold text-[10px] uppercase tracking-widest shadow-lg"
                    onClick={handlePrint}
                >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                </Button>

            </div>
        </div>
    );
};

export default SalarySlip;
