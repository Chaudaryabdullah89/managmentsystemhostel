"use client"
import React, { useState, useMemo } from 'react';
import {
    CreditCard,
    ShieldCheck,
    Download,
    History,
    Wallet,
    FileText,
    Loader2,
    AlertCircle,
    Undo2,
    Bell
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useAuthStore from "@/hooks/Authstate";
import { useAllPayments } from "@/hooks/usePayment";
import { useBookings } from "@/hooks/useBooking";
import { format } from "date-fns";
import PaymentNotificationModal from "../bookings/PaymentNotificationModal";
import UnifiedReceipt from "@/components/receipt/UnifiedReceipt";
import RefundRequestModal from "./RefundRequestModal";


const PaymentStatusBadge = ({ status, hasReceipt }) => {
    const getStyle = (s) => {
        switch (s) {
            case 'PAID': return "bg-emerald-50 text-emerald-700 border-emerald-100";
            case 'PENDING': return hasReceipt
                ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                : "bg-amber-50 text-amber-700 border-amber-100";
            case 'REFUNDED': return "bg-blue-50 text-blue-700 border-blue-100";
            case 'REJECTED': return "bg-rose-50 text-rose-700 border-rose-100";
            default: return "bg-slate-50 text-slate-600 border-slate-100";
        }
    };
    const getLabel = (s) => {
        if (s === 'PAID') return 'Verified';
        if (s === 'PENDING') return hasReceipt ? 'Under Review' : 'Unpaid';
        if (s === 'REFUNDED') return 'Refunded';
        return s;
    };
    return (
        <Badge variant="outline" className={`${getStyle(status)} px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border group-hover:bg-white transition-colors flex items-center gap-1`}>
            {hasReceipt && status === 'PENDING' && <Bell className="h-2.5 w-2.5" />}
            {getLabel(status)}
        </Badge>
    );
};

const GuestPayments = () => {
    const user = useAuthStore((state) => state.user);
    const [filter, setFilter] = useState("all");

    const { data: bookings = [], isLoading: isBookingsLoading } = useBookings({ userId: user?.id });
    const { data: paymentsData, isLoading: isPaymentsLoading } = useAllPayments({ userId: user?.id, limit: 100 });

    const isCheckedOut = bookings.length > 0 &&
        bookings.some(b => b.status === 'CHECKED_OUT') &&
        !bookings.some(b => ['CONFIRMED', 'CHECKED_IN', 'Active'].includes(b.status));

    const activeBooking = bookings?.find(b => ['CONFIRMED', 'CHECKED_IN', 'Active'].includes(b.status)) || bookings?.[0];
    const payments = paymentsData?.payments || [];

    // Merge fresh payments into booking so modal always sees up-to-date data
    const bookingWithPayments = useMemo(() => {
        if (!activeBooking) return null;
        return { ...activeBooking, Payment: payments };
    }, [activeBooking, payments]);

    const stats = useMemo(() => {
        const total = activeBooking ? (activeBooking.totalAmount || 0) + (activeBooking.securityDeposit || 0) : 0;
        const paid = payments.filter(p => p.status === 'PAID' && p.type !== 'SECURITY_REFUND').reduce((sum, p) => sum + p.amount, 0);
        const refunded = payments.filter(p => p.status === 'REFUNDED' || p.type === 'SECURITY_REFUND').reduce((sum, p) => sum + p.amount, 0);
        const pending = payments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0);
        const balance = Math.max(0, total - (paid - refunded));
        return { total, paid, refunded, balance, pending };
    }, [activeBooking, payments]);

    const filteredPayments = useMemo(() => {
        if (filter === "all") return payments;
        if (filter === "refunded") return payments.filter(p => p.status === 'REFUNDED' || p.type === 'SECURITY_REFUND');
        return payments.filter(p => p.status.toLowerCase() === filter.toLowerCase());
    }, [payments, filter]);

    if (isPaymentsLoading || isBookingsLoading) return (
        <div className="flex h-screen items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Loading Ledger...</p>
            </div>
        </div>
    );

    const canNotify = !!bookingWithPayments && !isCheckedOut;

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20 font-sans tracking-tight print:hidden">
            <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Wallet className="h-5 w-5 text-slate-900" />
                        <h1 className="text-base font-bold text-slate-900 uppercase tracking-tight">
                            {isCheckedOut ? 'Old Payment History' : 'Payment Ledger'}
                        </h1>
                    </div>
                    <div className="flex gap-2">
                        {canNotify && (
                            <PaymentNotificationModal booking={bookingWithPayments}>
                                <Button size="sm" className="h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-[11px] font-bold uppercase tracking-wider px-4">
                                    <Bell className="h-3.5 w-3.5 mr-2" /> Notify Warden
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
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Total Remaining</p>
                                    <h2 className="text-5xl font-bold text-slate-900 tracking-tighter">PKR {stats.balance.toLocaleString()}</h2>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Total Amount</p>
                                    <p className="text-xl font-bold text-slate-600 tracking-tight">PKR {stats.total.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100/50">
                                    <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Net Paid</p>
                                    <p className="text-base font-bold text-emerald-900 tracking-tight">PKR {stats.paid.toLocaleString()}</p>
                                </div>
                                <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100/50">
                                    <p className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">Refunded</p>
                                    <p className="text-base font-bold text-blue-900 tracking-tight">PKR {stats.refunded.toLocaleString()}</p>
                                </div>
                                <div className="bg-amber-50/50 rounded-2xl p-5 border border-amber-100/50">
                                    <p className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">In Review</p>
                                    <p className="text-base font-bold text-amber-900 tracking-tight">PKR {stats.pending.toLocaleString()}</p>
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
                            <h3 className="text-xl font-bold mb-3 tracking-tight">How to Notify</h3>
                            <p className="text-sm text-slate-400 leading-relaxed font-medium">
                                Made a payment? Tap <strong className="text-white">Notify Warden</strong> on any unpaid due — attach your receipt and it goes straight to the warden for approval.
                            </p>
                        </div>
                        <div className="relative z-10 mt-10 pt-6 border-t border-white/10 flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Reviewed in 24–48 hrs</span>
                        </div>
                    </Card>
                </div>

                {/* Transaction History */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <History className="h-5 w-5 text-slate-400" />
                            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-[0.2em]">All Payments</h2>
                        </div>
                        <Tabs defaultValue="all" className="bg-slate-100/80 p-1 rounded-2xl" onValueChange={setFilter}>
                            <TabsList className="bg-transparent h-9 gap-1">
                                {['all', 'pending', 'paid', 'refunded'].map((val) => (
                                    <TabsTrigger
                                        key={val}
                                        value={val}
                                        className="text-[10px] font-bold px-5 h-full uppercase tracking-wider rounded-xl data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all"
                                    >
                                        {val === 'all' ? 'All' : val === 'pending' ? 'Pending' : val === 'paid' ? 'Verified' : 'Refunds'}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                    </div>

                    <div className="space-y-3">
                        {filteredPayments.length > 0 ? filteredPayments.map((p) => {
                            const hasReceipt = !!p.receiptUrl;
                            const isNotified = p.status === 'PENDING' && hasReceipt;
                            const isUnpaid = (p.status === 'PENDING' && !hasReceipt) || p.status === 'REJECTED';

                            return (
                                <div
                                    key={p.id}
                                    className={`bg-white border rounded-3xl p-6 hover:shadow-md transition-all flex flex-col md:flex-row items-center justify-between gap-6 group relative overflow-hidden
                                        ${isNotified ? 'border-indigo-100' : isUnpaid ? (p.status === 'REJECTED' ? 'border-rose-100' : 'border-amber-100') : 'border-slate-100 hover:border-slate-200'}`}
                                >
                                    {/* Left accent ribbon */}
                                    <div className={`absolute top-0 left-0 w-1 h-full rounded-l-3xl
                                        ${isNotified ? 'bg-indigo-400' : isUnpaid ? (p.status === 'REJECTED' ? 'bg-rose-400' : 'bg-amber-400') : p.status === 'PAID' ? 'bg-emerald-400' : 'bg-slate-400'}`}
                                    />

                                    <div className="flex items-center gap-6 w-full md:w-auto">
                                        <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all duration-300 shrink-0">
                                            {isNotified
                                                ? <Bell className="h-6 w-6 text-indigo-400 group-hover:text-white" />
                                                : <CreditCard className="h-6 w-6" />
                                            }
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                                                    {p.notes?.replace('[GUEST_NOTIFICATION]', '').trim() || (p.month ? `${p.month} ${p.year || ''} Rent` : 'Room Rent')}
                                                </h4>
                                                <PaymentStatusBadge status={p.status} hasReceipt={hasReceipt} />
                                            </div>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                                                    {p.method?.replace('_', ' ') || 'Direct Transfer'}
                                                </p>
                                                <span className="h-1 w-1 rounded-full bg-slate-200" />
                                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                                                    {format(new Date(p.date), 'MMM dd, yyyy')}
                                                </p>
                                            </div>
                                            {isNotified && (
                                                <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-widest mt-1">
                                                    ✓ Receipt submitted — awaiting warden review
                                                </p>
                                            )}
                                            {p.status === 'REJECTED' && (
                                                <p className="text-[9px] text-rose-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" /> Warden rejected previous receipt
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-6">
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Amount</p>
                                            <p className="text-xl font-black text-slate-900 tracking-tight">PKR {p.amount.toLocaleString()}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* Per-card Notify button for unpaid or rejected dues */}
                                            {isUnpaid && canNotify && (
                                                <PaymentNotificationModal booking={bookingWithPayments}>
                                                    <Button
                                                        size="sm"
                                                        className={`h-10 px-4 rounded-xl text-white font-bold text-[9px] uppercase tracking-wider shadow-md flex items-center gap-1.5 ${p.status === 'REJECTED' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                                    >
                                                        <Bell className="h-3.5 w-3.5" /> {p.status === 'REJECTED' ? 'Resubmit' : 'Notify'}
                                                    </Button>
                                                </PaymentNotificationModal>
                                            )}
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
                            );
                        }) : (
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
