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
    Loader2
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
    const getStyle = (s) => {
        switch (s) {
            case 'PAID': return "bg-emerald-50 text-emerald-700 border-emerald-200";
            case 'PENDING': return "bg-amber-50 text-amber-700 border-amber-200";
            case 'REJECTED': return "bg-rose-50 text-rose-700 border-rose-200";
            default: return "bg-gray-50 text-gray-700 border-gray-200";
        }
    };
    return (
        <Badge variant="outline" className={`${getStyle(status)} px-3 py-1 font-medium`}>
            {status === 'PAID' ? 'Verified' : status === 'PENDING' ? 'Processing' : status}
        </Badge>
    );
};

const GuestPayments = () => {
    const user = useAuthStore((state) => state.user);
    const [filter, setFilter] = useState("all");

    const { data: bookings = [], isLoading: isBookingsLoading } = useBookings(user?.id);
    const { data: paymentsData, isLoading: isPaymentsLoading } = useAllPayments({ userId: user?.id, limit: 100 });

    const activeBooking = bookings.find(b => b.status === 'CONFIRMED' || b.status === 'CHECKED_IN' || b.status === 'Active') || bookings[0];
    const payments = paymentsData?.payments || [];

    const stats = useMemo(() => {
        if (!activeBooking) return { total: 0, paid: 0, balance: 0, pending: 0 };
        const paid = payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0);
        const pending = payments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0);
        const rent = activeBooking.Room?.monthlyrent || activeBooking.Room?.price || 0;
        const total = (activeBooking.totalAmount || 0) + (activeBooking.securityDeposit || 0) || rent;
        return { total, paid, balance: Math.max(0, total - paid), pending };
    }, [activeBooking, payments]);

    const filteredPayments = filter === "all"
        ? payments
        : payments.filter(p => p.status.toLowerCase() === filter.toLowerCase());

    if (isPaymentsLoading || isBookingsLoading) return (
        <div className="flex h-screen items-center justify-center bg-white">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
            <header className="bg-white border-b sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <h1 className="text-lg font-bold text-gray-900">Payments Ledger</h1>
                    <div className="flex gap-3">
                        {activeBooking && (
                            <PaymentNotificationModal booking={activeBooking}>
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 gap-2">
                                    <Send className="h-4 w-4" /> Notify Warden
                                </Button>
                            </PaymentNotificationModal>
                        )}
                        <UnifiedReceipt data={{ payments, user, ...stats }} type="payment">
                            <Button variant="outline" size="sm" className="gap-2">
                                <Download className="h-4 w-4" /> Export Report
                            </Button>
                        </UnifiedReceipt>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
                {/* Financial Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="md:col-span-2 shadow-sm border-none bg-white rounded-3xl overflow-hidden p-8">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Outstanding Balance</p>
                                <h2 className="text-4xl font-black text-gray-900 tracking-tighter">PKR {stats.balance.toLocaleString()}</h2>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Bill</p>
                                <p className="text-lg font-bold text-gray-600">PKR {stats.total.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-emerald-50 rounded-2xl p-4 flex items-center gap-4 border border-emerald-100">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                <div>
                                    <p className="text-[10px] font-bold text-emerald-600/70 uppercase">Total Paid</p>
                                    <p className="font-bold text-emerald-900">PKR {stats.paid.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="bg-amber-50 rounded-2xl p-4 flex items-center gap-4 border border-amber-100">
                                <Clock className="h-5 w-5 text-amber-600" />
                                <div>
                                    <p className="text-[10px] font-bold text-amber-600/70 uppercase">In Review</p>
                                    <p className="font-bold text-amber-900">PKR {stats.pending.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-blue-600 text-white rounded-3xl p-8 shadow-lg shadow-blue-200 border-none flex flex-col justify-between">
                        <div>
                            <ShieldCheck className="h-8 w-8 mb-4 opacity-50" />
                            <h3 className="text-xl font-bold mb-2">Policy Info</h3>
                            <p className="text-sm text-blue-100 leading-relaxed font-medium">Verify your payment proof carefully. All transactions are reviewed within standard business hours.</p>
                        </div>
                        <div className="mt-8 pt-4 border-t border-white/10 flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Portal Secure</span>
                        </div>
                    </Card>
                </div>

                {/* Transaction History */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <History className="h-5 w-5 text-gray-400" />
                            <h2 className="text-base font-bold text-gray-900 uppercase tracking-widest">Payment Logs</h2>
                        </div>
                        <Tabs defaultValue="all" className="bg-gray-100 p-1 rounded-xl" onValueChange={setFilter}>
                            <TabsList className="bg-transparent h-8">
                                <TabsTrigger value="all" className="text-[10px] font-bold px-4 h-full uppercase tracking-wider">All Records</TabsTrigger>
                                <TabsTrigger value="pending" className="text-[10px] font-bold px-4 h-full uppercase tracking-wider">Processing</TabsTrigger>
                                <TabsTrigger value="paid" className="text-[10px] font-bold px-4 h-full uppercase tracking-wider">Verified</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    <div className="space-y-4">
                        {filteredPayments.length > 0 ? filteredPayments.map((p) => (
                            <div key={p.id} className="bg-white border rounded-[2rem] p-6 hover:shadow-md transition-all flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-6 w-full md:w-auto">
                                    <div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center border">
                                        <CreditCard className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h4 className="text-sm font-bold text-gray-900">{p.notes?.replace('[GUEST_NOTIFICATION]', '').trim() || 'Room Rent'}</h4>
                                            <PaymentStatusBadge status={p.status} />
                                        </div>
                                        <p className="text-xs text-gray-500 font-medium mt-1">{p.method?.replace('_', ' ')} • {format(new Date(p.date), 'MMM dd, yyyy')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-12">
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Amount</p>
                                        <p className="text-xl font-black text-gray-900">PKR {p.amount.toLocaleString()}</p>
                                    </div>
                                    <UnifiedReceipt data={p} type="payment">
                                        <Button variant="ghost" size="icon" className="rounded-2xl h-11 w-11 border border-gray-100">
                                            <Download className="h-5 w-5" />
                                        </Button>
                                    </UnifiedReceipt>
                                </div>
                            </div>
                        )) : (
                            <div className="bg-white border-2 border-dashed rounded-[3rem] p-24 text-center">
                                <FileText className="h-10 w-10 text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-400 font-medium">No matching transactions</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default GuestPayments;
