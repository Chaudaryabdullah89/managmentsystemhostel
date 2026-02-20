"use client"
import React, { useState, useMemo } from 'react';
import {
    CreditCard,
    CheckCircle2,
    AlertCircle,
    Clock,
    ShieldCheck,
    Download,
    History,
    Wallet,
    Send,
    FileText,
    TrendingUp,
    ChevronRight,
    Loader2,
    Undo2
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useAuthStore from "@/hooks/Authstate";
import { useAllPayments } from "@/hooks/usePayment";
import { useBookings } from "@/hooks/useBooking";
import { format } from "date-fns";
import PaymentNotificationModal from "../bookings/PaymentNotificationModal";
import UnifiedReceipt from "@/components/receipt/UnifiedReceipt";
import RefundRequestModal from "./RefundRequestModal";


const PaymentStatusBadge = ({ status }) => {
    const getStyle = (s) => {
        switch (s) {
            case 'PAID': return "bg-emerald-50 text-emerald-700 border-emerald-100";
            case 'PENDING': return "bg-amber-50 text-amber-700 border-amber-100";
            case 'REJECTED': return "bg-rose-50 text-rose-700 border-rose-100";
            default: return "bg-slate-50 text-slate-600 border-slate-100";
        }
    };
    return (
        <Badge variant="outline" className={`${getStyle(status)} px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border group-hover:bg-white transition-colors`}>
            {status === 'PAID' ? 'Verified' : status === 'PENDING' ? 'Processing' : status}
        </Badge>
    );
};

const GuestPayments = () => {
    const user = useAuthStore((state) => state.user);
    const [filter, setFilter] = useState("all");

    // Fixed: Passing userId as an object for the hook
    const { data: bookings = [], isLoading: isBookingsLoading } = useBookings({ userId: user?.id });
    const { data: paymentsData, isLoading: isPaymentsLoading } = useAllPayments({ userId: user?.id, limit: 100 });

    const isCheckedOut = bookings.length > 0 &&
        bookings.some(b => b.status === 'CHECKED_OUT') &&
        !bookings.some(b => ['CONFIRMED', 'CHECKED_IN', 'Active'].includes(b.status));

    const activeBooking = bookings?.find(b => ['CONFIRMED', 'CHECKED_IN', 'Active'].includes(b.status)) || bookings?.[0];
    const payments = paymentsData?.payments || [];

    const stats = useMemo(() => {
        const total = activeBooking ? (activeBooking.totalAmount || 0) + (activeBooking.securityDeposit || 0) : 0;
        const paid = payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0);
        const pending = payments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0);
        return { total, paid, balance: Math.max(0, total - paid), pending };
    }, [activeBooking, payments]);

    const filteredPayments = filter === "all"
        ? payments
        : payments.filter(p => p.status.toLowerCase() === filter.toLowerCase());

    if (isPaymentsLoading || isBookingsLoading) return (
        <div className="flex h-screen items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Loading Ledger...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20 font-sans tracking-tight">
            <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Wallet className="h-5 w-5 text-slate-900" />
                        <h1 className="text-base font-bold text-slate-900 uppercase tracking-tight">
                            {isCheckedOut ? 'Archived Ledger' : 'Payments Ledger'}
                        </h1>
                    </div>
                    <div className="flex gap-2">
                        {!isCheckedOut && activeBooking && (
                            <PaymentNotificationModal booking={activeBooking}>
                                <Button size="sm" className="h-9 rounded-xl bg-slate-900 hover:bg-slate-800 text-[11px] font-bold uppercase tracking-wider px-4">
                                    <Send className="h-3.5 w-3.5 mr-2" /> Notify Warden
                                </Button>
                            </PaymentNotificationModal>
                        )}
                        <UnifiedReceipt data={{ payments, user, ...stats }} type="payment">
                            <Button variant="outline" size="sm" className="h-9 rounded-xl border-slate-200 text-[11px] font-bold uppercase tracking-wider px-4">
                                <Download className="h-3.5 w-3.5 mr-2" /> Report
                            </Button>
                        </UnifiedReceipt>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
                {/* Financial Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="md:col-span-2 shadow-sm border border-slate-100 bg-white rounded-[2.5rem] overflow-hidden">
                        <div className="p-10">
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Net Outstanding</p>
                                    <h2 className="text-5xl font-bold text-slate-900 tracking-tighter">PKR {stats.balance.toLocaleString()}</h2>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Total Invoice</p>
                                    <p className="text-xl font-bold text-slate-600 tracking-tight">PKR {stats.total.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-emerald-50/50 rounded-2xl p-5 flex items-center gap-4 border border-emerald-100/50">
                                    <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                        <CheckCircle2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Total Paid</p>
                                        <p className="text-lg font-bold text-emerald-900 tracking-tight">PKR {stats.paid.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="bg-amber-50/50 rounded-2xl p-5 flex items-center gap-4 border border-amber-100/50">
                                    <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                                        <Clock className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">In Review</p>
                                        <p className="text-lg font-bold text-amber-900 tracking-tight">PKR {stats.pending.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-slate-900 text-white rounded-[2.5rem] p-10 shadow-xl border-none flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-white/10 transition-colors" />
                        <div className="relative z-10">
                            <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                                <ShieldCheck className="h-6 w-6 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 tracking-tight">Payment Policy</h3>
                            <p className="text-sm text-slate-400 leading-relaxed font-medium">Verify your digital receipts carefully. All standard transactions are verified within 24-48 business hours.</p>
                        </div>
                        <div className="relative z-10 mt-10 pt-6 border-t border-white/10 flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Portal Secure</span>
                        </div>
                    </Card>
                </div>

                {/* Transaction History */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <History className="h-5 w-5 text-slate-400" />
                            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-[0.2em]">Transaction History</h2>
                        </div>
                        <Tabs defaultValue="all" className="bg-slate-100/80 p-1 rounded-2xl" onValueChange={setFilter}>
                            <TabsList className="bg-transparent h-9 gap-1">
                                {['all', 'pending', 'paid'].map((val) => (
                                    <TabsTrigger
                                        key={val}
                                        value={val}
                                        className="text-[10px] font-bold px-5 h-full uppercase tracking-wider rounded-xl data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all"
                                    >
                                        {val === 'all' ? 'All' : val === 'pending' ? 'Processing' : 'Verified'}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                    </div>

                    <div className="space-y-3">
                        {filteredPayments.length > 0 ? filteredPayments.map((p) => (
                            <div key={p.id} className="bg-white border border-slate-100 rounded-3xl p-6 hover:shadow-md hover:border-slate-200 transition-all flex flex-col md:flex-row items-center justify-between gap-6 group">
                                <div className="flex items-center gap-6 w-full md:w-auto">
                                    <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all duration-300">
                                        <CreditCard className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                                                {p.notes?.replace('[GUEST_NOTIFICATION]', '').trim() || 'Room Rent'}
                                            </h4>
                                            <PaymentStatusBadge status={p.status} />
                                        </div>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider group-hover:text-slate-500">
                                                {p.method?.replace('_', ' ') || 'Direct Transfer'}
                                            </p>
                                            <span className="h-1 w-1 rounded-full bg-slate-200" />
                                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                                                {format(new Date(p.date), 'MMM dd, yyyy')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-12">
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Amount Paid</p>
                                        <p className="text-xl font-black text-slate-900 tracking-tight">PKR {p.amount.toLocaleString()}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {p.status === 'PAID' && (
                                            <RefundRequestModal payment={p}>
                                                <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 border border-slate-50 text-slate-300 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all">
                                                    <Undo2 className="h-4 w-4" />
                                                </Button>
                                            </RefundRequestModal>
                                        )}
                                        <UnifiedReceipt data={p} type="payment">
                                            <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 border border-slate-100 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </UnifiedReceipt>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-24 text-center">
                                <FileText className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">No matching logs</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Try adjusting your filters</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default GuestPayments;
