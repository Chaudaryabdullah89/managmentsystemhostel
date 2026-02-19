"use client";
import React, { useState } from 'react';
import {
    CreditCard,
    CheckCircle2,
    AlertCircle,
    Clock,
    ShieldCheck,
    Download,
    History,
    Wallet,
    Info,
    ExternalLink,
    Zap,
    TrendingUp,
    FileText,
    ArrowUpRight
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

const PaymentStatusBadge = ({ status }) => {
    switch (status) {
        case 'PAID':
            return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 px-4 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border shadow-sm">Verified</Badge>;
        case 'PENDING':
            return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-100 px-4 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border shadow-sm">Reviewing</Badge>;
        case 'OVERDUE':
            return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-100 px-4 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border shadow-sm">Overdue</Badge>;
        case 'REJECTED':
            return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-100 px-4 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border shadow-sm">Action Needed</Badge>;
        default:
            return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-100 px-4 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border shadow-sm">{status}</Badge>;
    }
};

const GuestPayments = () => {
    const user = useAuthStore((state) => state.user);
    const [filter, setFilter] = useState("all");

    // Fetch Data
    const { data: bookings = [], isLoading: isBookingsLoading } = useBookings(user?.id);
    const { data: paymentsData, isLoading: isPaymentsLoading } = useAllPayments({ userId: user?.id, limit: 50 });

    const activeBooking = bookings.find(b => b.status === 'CONFIRMED' || b.status === 'CHECKED_IN') || bookings[0];
    const payments = paymentsData?.payments || [];

    // Payment Summary
    const totalDue = activeBooking?.totalAmount || 0;
    const paidAmount = payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0);
    const pendingAmount = payments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0);
    const netBalance = totalDue - paidAmount; // Only subtract verified payments for the "Due Amount" display
    const isSettled = paidAmount >= totalDue;
    const availableToPay = totalDue - paidAmount - pendingAmount; // What technically remains to be submitted

    const filteredPayments = filter === "all"
        ? payments
        : payments.filter(p => p.status.toUpperCase() === filter.toUpperCase());


    if (isPaymentsLoading || isBookingsLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Loading Payments...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-32 font-sans selection:bg-indigo-600 selection:text-white">
            {/* Payment Header */}
            <header className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-2 w-2 rounded-full bg-indigo-600" />
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold text-slate-900 tracking-tight uppercase">Payments</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment History</span>
                                <div className={`h-1.5 w-1.5 rounded-full ${isSettled ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isSettled ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {isSettled ? 'Fully Paid' : 'Active Payments'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {activeBooking && (
                            <PaymentNotificationModal booking={activeBooking}>
                                <Button className="h-9 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm flex items-center gap-2">
                                    <Zap className="h-3.5 w-3.5 text-white" />
                                    Initiate Payment
                                </Button>
                            </PaymentNotificationModal>
                        )}
                        <UnifiedReceipt data={{ payments, user, totalDue, paidAmount, pendingAmount, netBalance }} type="payment">
                            <Button
                                variant="outline"
                                className="h-9 px-4 rounded-xl border-gray-200 bg-white font-bold text-[10px] uppercase tracking-wider text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
                            >
                                <Download className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                Statement
                            </Button>
                        </UnifiedReceipt>
                    </div>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-8 py-10 space-y-10">
                {/* Rejection Alert Banner */}
                {/* {payments.some(p => p.status === 'REJECTED') && (
                    <div className="bg-rose-50 border border-rose-100 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top duration-500 shadow-xl shadow-rose-500/5">
                        <div className="flex items-center gap-5">
                            <div className="h-12 w-12 rounded-2xl bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-200 shrink-0">
                                <AlertCircle className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-rose-900 uppercase tracking-tight">Payment Action Required</h3>
                                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-1">One or more of your payments were rejected. Please check the history and resubmit.</p>
                            </div>
                        </div>
                        <PaymentNotificationModal booking={activeBooking}>
                            <Button className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-10 px-6 font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-rose-200">
                                Resubmit Payment
                            </Button>
                        </PaymentNotificationModal>
                    </div>
                )} */}

                {/* Payment Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Payment Details Card */}
                    <Card className="lg:col-span-2 rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
                        <CardContent className="p-10">
                            <div className="flex items-start justify-between mb-10">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                                        <FileText className="h-4 w-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-[0.1em]">Monthly Bill</span>
                                    </div>
                                    <h2 className="text-3xl font-bold text-slate-900 uppercase">Payment Summary</h2>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Due Amount</span>
                                    <div className="text-4xl font-bold text-slate-900 tracking-tighter">
                                        PKR {netBalance > 0 ? netBalance.toLocaleString() : "0"}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100/50 group hover:bg-white hover:border-indigo-600 transition-all cursor-default">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="h-3.5 w-3.5 text-indigo-600" />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest tracking-tighter">Total Bill</span>
                                    </div>
                                    <p className="text-lg font-bold text-slate-800 tracking-tight">PKR {totalDue.toLocaleString()}</p>
                                </div>
                                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100/50 group hover:bg-white hover:border-emerald-100 transition-all cursor-default">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Verified Paid</span>
                                    </div>
                                    <p className="text-lg font-bold text-slate-800 tracking-tight">PKR {paidAmount.toLocaleString()}</p>
                                </div>
                                <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100/50 group hover:bg-white hover:border-amber-100 transition-all cursor-default relative overflow-hidden">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Under Review</span>
                                    </div>
                                    <p className="text-lg font-bold text-slate-800 tracking-tight">PKR {pendingAmount.toLocaleString()}</p>
                                    <div className="absolute top-0 right-0 p-2 opacity-10">
                                        <ShieldCheck className="h-10 w-10 text-indigo-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex items-center justify-between px-2">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Payments are updated twice daily after admin verification.</p>
                                </div>
                                <Button variant="ghost" className="text-[10px] font-bold uppercase text-indigo-600 hover:bg-slate-50 gap-2">
                                    View Payment History <ArrowUpRight className="h-3 w-3" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Status Card */}
                    <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 bg-indigo-600 text-white relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
                        <CardContent className="p-8 relative z-10">
                            <div className="mb-8">
                                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                                    <ShieldCheck className="h-5 w-5 text-white" />
                                </div>
                                <h3 className="text-lg font-bold leading-tight uppercase">Payment Status</h3>
                                <p className="text-[10px] text-indigo-100 font-bold uppercase tracking-wider mt-1">Track your payment verification.</p>
                            </div>

                            <div className="space-y-6">
                                {(() => {
                                    const hasPayments = payments.length > 0;
                                    const hasPending = payments.some(p => p.status === 'PENDING');
                                    const allPaid = hasPayments && payments.every(p => p.status === 'PAID' || p.status === 'REJECTED');
                                    const hasPaid = payments.some(p => p.status === 'PAID');

                                    return [
                                        {
                                            step: 1,
                                            label: 'Payment Submitted',
                                            status: hasPayments ? 'completed' : 'active'
                                        },
                                        {
                                            step: 2,
                                            label: 'Reviewing',
                                            status: hasPending ? 'active' : (hasPaid ? 'completed' : 'pending')
                                        },
                                        {
                                            step: 3,
                                            label: 'System Updated',
                                            status: (hasPaid && !hasPending) ? 'completed' : 'pending'
                                        },
                                    ].map((stepItem, i) => (
                                        <div key={i} className="flex items-center gap-4">
                                            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-500 ${stepItem.status === 'completed' ? 'bg-emerald-500 text-white border-emerald-500' : stepItem.status === 'active' ? 'bg-white text-indigo-600 border-white animate-pulse' : 'bg-transparent text-indigo-300 border-white/20'}`}>
                                                {stepItem.status === 'completed' ? <CheckCircle2 className="h-3 w-3" /> : stepItem.step}
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${stepItem.status === 'pending' ? 'text-indigo-300' : 'text-white'}`}>{stepItem.label}</span>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </CardContent>
                        <div className="p-8 bg-white/5 flex items-center justify-between">
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-6 w-6 rounded-full border-2 border-indigo-600 bg-indigo-400" />
                                ))}
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-200">System Online</span>
                        </div>
                    </Card>
                </div>

                {/* Transaction History Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <History className="h-5 w-5 text-slate-400" />
                            <h2 className="text-lg font-bold text-slate-800">Recent Payments</h2>
                        </div>
                        <Tabs defaultValue="all" className="bg-slate-100 p-1 rounded-xl" onValueChange={setFilter}>
                            <TabsList className="bg-transparent h-8">
                                <TabsTrigger value="all" className="rounded-lg px-4 text-[9px] font-bold uppercase tracking-[0.1em] data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm h-full">All</TabsTrigger>
                                <TabsTrigger value="pending" className="rounded-lg px-4 text-[9px] font-bold uppercase tracking-[0.1em] data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm h-full">Reviewing</TabsTrigger>
                                <TabsTrigger value="paid" className="rounded-lg px-4 text-[9px] font-bold uppercase tracking-[0.1em] data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm h-full">Verified</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    <div className="grid gap-4">
                        {filteredPayments.length > 0 ? filteredPayments.map((payment) => (
                            <div key={payment.id} className="group bg-white border border-slate-100 hover:border-indigo-600 p-6 rounded-[2rem] transition-all hover:shadow-xl hover:shadow-slate-200/50 relative overflow-hidden">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-6 w-full md:w-auto">
                                        <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 transition-all duration-300">
                                            <CreditCard className="h-6 w-6 text-slate-400 group-hover:text-white transition-colors" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">{payment.notes || 'Room Rent Payment'}</h4>
                                                <PaymentStatusBadge status={payment.status} />
                                            </div>
                                            <div className="flex items-center gap-3 mt-1.5 font-mono">
                                                {payment.uid ? (
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {payment.uid}</span>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {payment.id.slice(-8).toUpperCase()}</span>
                                                )}
                                                <div className="h-1 w-1 rounded-full bg-slate-200" />
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{payment.method?.replace('_', ' ') || 'SYSTEM'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-12">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Payment Date</span>
                                            <span className="text-xs font-bold text-slate-700 uppercase">
                                                {format(new Date(payment.date), 'MMM dd, yyyy')}
                                            </span>
                                        </div>

                                        <div className="text-right min-w-[150px]">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Amount Paid</span>
                                            <div className="text-xl font-bold text-slate-900 tracking-tight">PKR {payment.amount?.toLocaleString()}</div>
                                        </div>

                                        <UnifiedReceipt data={payment} type="payment">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-11 w-11 rounded-2xl border border-slate-100 hover:bg-indigo-600 hover:text-white transition-all active:scale-95 shadow-sm"
                                            >
                                                <Download className="h-5 w-5" />
                                            </Button>
                                        </UnifiedReceipt>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="bg-white border-2 border-dashed border-slate-100 rounded-[3rem] py-24 text-center">
                                <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                    <AlertCircle className="h-8 w-8 text-slate-200" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">No payments found</h3>
                                <p className="text-[10px] text-slate-300 uppercase mt-2">No results for the selected filter</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* System Status */}
                <div className="pt-10">
                    <div className="bg-indigo-600 text-white rounded-[2rem] p-4 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-full bg-white/5 skew-x-12 translate-x-20" />
                        <div className="flex items-center gap-6 relative z-10 px-4">
                            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                                <ShieldCheck className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-100">System Status</h4>
                                <p className="text-[11px] font-bold mt-0.5 uppercase">Payments Updated</p>
                            </div>
                        </div>

                        <div className="h-6 w-px bg-white/10 hidden md:block" />

                        <div className="flex-1 flex items-center gap-12 px-8">
                            <div className="flex flex-col">
                                <span className="text-[8px] font-bold uppercase text-indigo-100 tracking-widest">Last Check</span>
                                <span className="text-[10px] font-bold text-slate-200 uppercase mt-1">{new Date().toLocaleDateString()}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[8px] font-bold uppercase text-indigo-100 tracking-widest">Status</span>
                                <span className="text-[10px] font-bold text-white uppercase mt-1">Operational</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 group">
                            <div className="text-right">
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Help Desk</p>
                                <p className="text-[11px] font-bold text-slate-300 uppercase">Open Ticket</p>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all cursor-pointer">
                                <ExternalLink className="h-4 w-4 text-white" />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default GuestPayments;
