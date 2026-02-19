"use client";
import React from 'react';
import {
    Bed,
    CreditCard,
    MessageSquare,
    ChevronRight,
    AlertCircle,
    Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import useAuthStore from "@/hooks/Authstate";
import { useBookings } from "@/hooks/useBooking";
import { useAllPayments } from "@/hooks/usePayment";
import { useComplaints } from "@/hooks/usecomplaints";

const GuestDashboard = () => {
    const user = useAuthStore((state) => state.user);

    // Fetch Data
    const { data: bookingsData, isLoading: bookingsLoading } = useBookings(user?.id);
    const { data: paymentsData, isLoading: paymentsLoading } = useAllPayments({ userId: user?.id, limit: 10 });
    const { data: complaintsData, isLoading: complaintsLoading } = useComplaints({ userId: user?.id });

    const isLoading = bookingsLoading || paymentsLoading || complaintsLoading;

    // Derived State
    const currentBooking = bookingsData?.length > 0 ? bookingsData[0] : null;
    const pendingPayment = paymentsData?.payments?.find(p => p.status === 'PENDING' || p.status === 'OVERDUE');
    const activeComplaints = complaintsData?.filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED') || [];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
                <Activity className="h-8 w-8 text-gray-400 animate-pulse" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Welcome, {user?.name?.split(' ')[0]}</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Guest Dashboard</span>
                            {user?.uid && (
                                <>
                                    <span className="h-1 w-1 rounded-full bg-gray-200" />
                                    <Badge className="bg-gray-100 text-gray-500 border-none text-[8px] font-mono font-bold px-1.5 py-0">
                                        {user.uid}
                                    </Badge>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Room Info */}
                    <Card className="bg-white border-gray-100 shadow-sm rounded-3xl overflow-hidden group hover:shadow-md transition-all">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-br from-emerald-50 to-white border-b border-emerald-50/50">
                            <CardTitle className="text-sm font-bold text-gray-900 uppercase tracking-widest">My Room</CardTitle>
                            <Bed className="h-5 w-5 text-emerald-600" />
                        </CardHeader>
                        <CardContent className="pt-6">
                            {currentBooking ? (
                                <div className="flex flex-col gap-1">
                                    <span className="text-3xl font-bold text-gray-900 tracking-tighter">Room {currentBooking.Room?.roomNumber || 'N/A'}</span>
                                    <span className="text-xs font-bold text-gray-500">{currentBooking.Room?.Hostel?.name || 'Assigned'}</span>
                                    <Badge className="w-fit mt-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none rounded-full text-[10px] uppercase font-bold tracking-wider">
                                        Stay Active
                                    </Badge>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-1">
                                    <span className="text-lg font-bold text-gray-400 italic">No Active Room</span>
                                    <Link href="/guest/bookings">
                                        <Button variant="link" className="p-0 text-emerald-600 font-bold text-[10px] uppercase">
                                            Apply for a room
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Pending Dues */}
                    <Card className="bg-white border-gray-100 shadow-sm rounded-3xl overflow-hidden group hover:shadow-md transition-all">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-br from-indigo-50 to-white border-b border-indigo-50/50">
                            <CardTitle className="text-sm font-bold text-gray-900 uppercase tracking-widest">Amount Due</CardTitle>
                            <CreditCard className="h-5 w-5 text-indigo-600" />
                        </CardHeader>
                        <CardContent className="pt-6">
                            {pendingPayment ? (
                                <div className="flex flex-col gap-1">
                                    <span className="text-3xl font-bold text-gray-900 tracking-tighter">PKR {pendingPayment.amount?.toLocaleString()}</span>
                                    <span className="text-xs font-bold text-gray-500">For {pendingPayment.notes || 'Current Month'}</span>
                                    <Badge className="w-fit mt-2 bg-rose-100 text-rose-700 border-none rounded-full text-[10px] uppercase font-bold tracking-wider">
                                        Payment Pending
                                    </Badge>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-1">
                                    <span className="text-lg font-bold text-gray-400 italic">No Dues</span>
                                    <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">All payments cleared</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Reported Issues */}
                    <Card className="bg-white border-gray-100 shadow-sm rounded-3xl overflow-hidden group hover:shadow-md transition-all">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-br from-amber-50 to-white border-b border-amber-50/50">
                            <CardTitle className="text-sm font-bold text-gray-900 uppercase tracking-widest">Active Issues</CardTitle>
                            <MessageSquare className="h-5 w-5 text-amber-600" />
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="flex flex-col gap-1">
                                <span className="text-3xl font-bold text-gray-900 tracking-tighter">{activeComplaints.length} Shared</span>
                                <span className="text-xs font-bold text-gray-500">
                                    {activeComplaints.length > 0 ? 'Team is working on it' : 'Everything looks good'}
                                </span>
                                <Link href="/guest/support">
                                    <Button variant="link" className="p-0 h-auto text-amber-600 font-bold text-[10px] uppercase tracking-wider mt-2 group-hover:underline">
                                        Check Progress <ChevronRight className="h-3 w-3 ml-1" />
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Recent Payments Summary */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Recent Payments</h3>
                            <Link href="/guest/payments">
                                <Button variant="ghost" size="sm" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-black">
                                    History
                                </Button>
                            </Link>
                        </div>
                        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
                            {paymentsData?.payments?.length > 0 ? paymentsData.payments.slice(0, 3).map((payment) => (
                                <div key={payment.id} className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition-colors -mx-2">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${payment.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                            <CreditCard className="h-4 w-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900">{payment.notes || 'Stay Payment'}</span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{new Date(payment.date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-gray-900">PKR {payment.amount?.toLocaleString()}</div>
                                        <span className={`text-[9px] font-bold uppercase tracking-wider ${payment.status === 'PAID' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                            {payment.status === 'PAID' ? 'Done' : 'Pending'}
                                        </span>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-gray-400 text-xs font-bold uppercase tracking-widest">No payments yet</div>
                            )}
                        </div>
                    </div>

                    {/* Recent Issues Summary */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Recent Issues</h3>
                            <Link href="/guest/support">
                                <Button variant="ghost" size="sm" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-black">
                                    Support hub
                                </Button>
                            </Link>
                        </div>
                        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
                            {complaintsData && complaintsData.length > 0 ? complaintsData.slice(0, 3).map((complaint) => (
                                <div key={complaint.id} className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition-colors -mx-2">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-gray-50 text-gray-500 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                                            <AlertCircle className="h-4 w-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900">{complaint.title}</span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{new Date(complaint.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className={`border-none rounded-full text-[9px] font-bold uppercase tracking-wider
                                        ${complaint.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}
                                    `}>
                                        {complaint.status === 'RESOLVED' ? 'Fixed' : 'Sent'}
                                    </Badge>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-gray-400 text-xs font-bold uppercase tracking-widest">No issues reported</div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default GuestDashboard;
