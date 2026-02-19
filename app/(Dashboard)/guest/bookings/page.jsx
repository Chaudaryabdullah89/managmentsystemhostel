"use client"
import React, { useState, useMemo, useEffect } from "react";
import {
    Calendar,
    DollarSign,
    User,
    Home,
    BedDouble,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Search,
    Filter,
    Eye,
    Download,
    Phone,
    Mail,
    MapPin,
    CreditCard,
    FileText,

    ChevronDown,
    ChevronUp,
    ChevronRight,
    Plus,
    Building2,
    ShieldCheck,
    RefreshCw,
    Layers,
    ArrowUpRight,
    UserCheck,
    Printer,
    Hash,
    Building,
    User as UserIcon,
    ChevronRight as ArrowRight,
    Zap,
    Activity,
    Blocks
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import useAuthStore from "@/hooks/Authstate";
import { useBookings } from "@/hooks/useBooking";
import PaymentNotificationModal from './PaymentNotificationModal';
import UnifiedReceipt from '@/components/receipt/UnifiedReceipt';
import { format } from "date-fns";

const BookingStatusBadge = ({ status }) => {
    const getStatusStyle = (status) => {
        switch (status) {
            case "CONFIRMED": return "bg-blue-50 text-blue-700 border-blue-100";
            case "PENDING": return "bg-amber-50 text-amber-700 border-amber-100";
            case "CHECKED_IN":
            case "Active": return "bg-emerald-50 text-emerald-700 border-emerald-100";
            case "CHECKED_OUT": return "bg-gray-100 text-gray-700 border-gray-200";
            case "CANCELLED": return "bg-rose-50 text-rose-700 border-rose-100";
            default: return "bg-gray-50 text-gray-600 border-gray-100";
        }
    };

    return (
        <Badge variant="outline" className={`${getStatusStyle(status)} px-4 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border shadow-sm`}>
            {status.replace('_', ' ')}
        </Badge>
    );
};

const BookingDetailCard = ({ booking }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const financialData = useMemo(() => {
        const totalPaid = booking.Payment?.filter(p => p.status === 'PAID').reduce((acc, curr) => acc + curr.amount, 0) || 0;
        const totalDue = (booking.totalAmount || 0) + (booking.securityDeposit || 0);
        const balance = totalDue - totalPaid;
        const progress = totalDue > 0 ? ((totalPaid / totalDue) * 100).toFixed(0) : 0;

        return { totalPaid, totalDue, balance, progress };
    }, [booking]);

    const getRibbonColor = (status) => {
        switch (status) {
            case "CONFIRMED": return "bg-blue-600";
            case "PENDING": return "bg-amber-500";
            case "CHECKED_IN":
            case "Active": return "bg-emerald-500";
            case "CHECKED_OUT": return "bg-gray-900";
            case "CANCELLED": return "bg-rose-500";
            default: return "bg-gray-400";
        }
    };

    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 pb-14 flex flex-col hover:shadow-md transition-shadow group relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${getRibbonColor(booking.status)} opacity-70`} />

            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
                {/* 1. Hostel Details */}
                <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div className="h-14 w-14 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-sm shrink-0 group-hover:bg-indigo-600 transition-colors">
                        <Building2 className="h-6 w-6 text-gray-400 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex flex-col min-w-0 text-left">
                        <h4 className="text-base font-bold text-gray-900 uppercase tracking-tight truncate">{booking.Room?.Hostel?.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">UNIT {booking.Room?.roomNumber}</span>
                            <span className="h-1 w-1 rounded-full bg-gray-200" />
                            {booking.uid ? (
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">ID: {booking.uid}</span>
                            ) : (
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">ID: {booking.id.slice(0, 8).toUpperCase()}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Booking Dates */}
                <div className="hidden xl:flex items-center gap-8 min-w-[280px]">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Check-in</span>
                        <span className="text-xs font-bold text-gray-900 uppercase">{format(new Date(booking.checkIn), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="h-4 w-px bg-gray-100" />
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Check-out</span>
                        <span className="text-xs font-bold text-gray-900 uppercase">{booking.checkOut ? format(new Date(booking.checkOut), 'MMM dd, yyyy') : 'Ongoing'}</span>
                    </div>
                </div>

                {/* Status */}
                <div className="min-w-[140px] flex justify-center">
                    <BookingStatusBadge status={booking.status} />
                </div>

                {/* 4. Actions */}
                <div className="flex items-center gap-2 lg:ml-auto">
                    <UnifiedReceipt data={booking} type="booking">
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-gray-50 text-gray-400 transition-colors">
                            <Printer className="h-4 w-4" />
                        </Button>
                    </UnifiedReceipt>

                    {['Active', 'CONFIRMED', 'CHECKED_IN'].includes(booking.status) && (
                        <PaymentNotificationModal booking={booking}>
                            <Button className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm flex items-center gap-2 group/btn">
                                <Zap className="h-3.5 w-3.5 text-white" />
                                Notify Payment
                            </Button>
                        </PaymentNotificationModal>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        className={`h-10 w-10 rounded-full transition-all ${isExpanded ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100 text-gray-300'}`}
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {/* Bottom Bar: Payment Summary */}
            <div className="absolute bottom-0 left-0 w-full h-[38px] bg-gray-50/80 backdrop-blur-sm border-t border-gray-100 flex items-center justify-between px-6 group-hover:bg-white transition-colors duration-300">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <CreditCard className="h-3 w-3 text-gray-400" />
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Payment Summary</span>
                    </div>
                    <div className="h-3 w-px bg-gray-200" />
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-rose-500 uppercase tracking-tight">Unpaid Balance</span>
                        <span className="text-[10px] font-bold text-gray-900 tracking-tighter">PKR {financialData.balance.toLocaleString()}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-24 h-1 bg-gray-200 rounded-full overflow-hidden hidden md:block">
                        <div className="h-full bg-emerald-500" style={{ width: `${financialData.progress}%` }} />
                    </div>
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                        {financialData.progress}% Paid
                    </span>
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="mt-8 pt-8 border-t border-gray-100 space-y-8 animate-in slide-in-from-top-4 relative z-10">
                    <Tabs defaultValue="operations" className="w-full">
                        <TabsList className="bg-gray-50/50 p-1 rounded-xl h-11 w-fit mb-8 border border-gray-100">
                            {[
                                { id: 'operations', label: 'Room Services', icon: Blocks },
                                { id: 'finance', label: 'Payments', icon: CreditCard },
                                { id: 'identity', label: 'My Profile', icon: UserCheck }
                            ].map(tab => (
                                <TabsTrigger key={tab.id} value={tab.id} className="rounded-lg px-6 font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all h-full">
                                    <tab.icon className="h-3.5 w-3.5 mr-2" /> {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <TabsContent value="operations" className="mt-0 grid grid-cols-1 md:grid-cols-3 gap-6 pb-6">
                            {[
                                { l: 'Cleaning', v: booking.Room?.CleaningLog?.[0]?.status || 'CLEAN', i: CheckCircle2, c: 'text-blue-600', bg: 'bg-blue-50' },
                                { l: 'Laundry', v: booking.Room?.LaundryLog?.[0]?.status || 'READY', i: Layers, c: 'text-purple-600', bg: 'bg-purple-50' },
                                { l: 'Repairs', v: booking.Room?.maintanance?.[0]?.status || 'NONE', i: ShieldCheck, c: 'text-amber-600', bg: 'bg-amber-50' }
                            ].map((op, i) => (
                                <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4 hover:border-indigo-600 transition-colors">
                                    <div className={`h-10 w-10 rounded-lg ${op.bg} ${op.c} flex items-center justify-center shrink-0`}>
                                        <op.i className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{op.l}</span>
                                        <span className="text-xs font-bold text-gray-900 uppercase">{op.v}</span>
                                    </div>
                                </div>
                            ))}
                        </TabsContent>

                        <TabsContent value="finance" className="mt-0 grid grid-cols-1 md:grid-cols-2 gap-10 pb-6">
                            <div className="space-y-4">
                                <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-l-2 border-indigo-600 pl-3 mb-4">Payment History</h5>
                                <div className="space-y-2">
                                    {booking.Payment?.slice(0, 5).map((p) => (
                                        <div key={p.id} className="bg-white border border-gray-100 rounded-xl p-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${p.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                    <CreditCard className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-900 uppercase">{p.notes || 'RENT_SETTLEMENT'}</p>
                                                    <p className="text-[8px] font-medium text-gray-400 uppercase tracking-widest mt-0.5">{format(new Date(p.date), 'MMM dd, yyyy')}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-gray-900">PKR {p.amount.toLocaleString()}</p>
                                                <span className={`text-[7px] font-bold uppercase tracking-tighter ${p.status === 'PAID' ? 'text-emerald-500' : 'text-amber-500'}`}>{p.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {(!booking.Payment || booking.Payment.length === 0) && (
                                        <div className="p-12 border-2 border-dashed border-gray-100 rounded-2xl text-center">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No payments yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
                                <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 underline decoration-indigo-600 decoration-2 underline-offset-4">Payment Summary</h5>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-white/50">
                                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Total Bill</span>
                                        <span className="text-xs font-bold text-gray-900">PKR {financialData.totalDue.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-white/50">
                                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Amount Paid</span>
                                        <span className="text-xs font-bold text-emerald-700">PKR {financialData.totalPaid.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-4">
                                        <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest">Remaining Balance</span>
                                        <span className="text-2xl font-bold text-gray-900 tracking-tighter">PKR {financialData.balance.toLocaleString()}</span>
                                    </div>
                                    <UnifiedReceipt data={booking} type="booking">
                                        <Button className="w-full h-10 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-bold text-[9px] uppercase tracking-widest mt-6 flex items-center gap-2 transition-all">
                                            <Download className="h-3.5 w-3.5" /> View Statement
                                        </Button>
                                    </UnifiedReceipt>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="identity" className="mt-0 pb-6">
                            <div className="bg-white border border-gray-100 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                                            <UserCheck className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Full Name</p>
                                            <h4 className="text-lg font-bold text-gray-900 uppercase">{booking.User?.name}</h4>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">CNIC Number</p>
                                            <p className="text-[10px] font-bold text-gray-800 uppercase leading-none">{booking.User?.cnic || 'NOT PROVIDED'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Phone Number</p>
                                            <p className="text-[10px] font-bold text-gray-800 leading-none">{booking.User?.phone}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4 bg-gray-50/80 p-5 rounded-xl border border-gray-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                                        <span className="text-[9px] font-bold text-gray-900 uppercase tracking-widest">Security Protocols</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Guardian Name</span>
                                            <span className="text-[10px] font-bold text-gray-900 uppercase">{booking.User?.ResidentProfile?.guardianName || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Guardian Contact</span>
                                            <span className="text-[10px] font-bold text-gray-900 tracking-widest">{booking.User?.ResidentProfile?.guardianPhone || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            )}
        </div>
    );
};

const GuestBookings = () => {
    const user = useAuthStore((state) => state.user);
    const { data: bookings, isLoading } = useBookings(user?.id);

    if (isLoading) return (
        <div className="flex h-screen items-center justify-center bg-white font-sans">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="h-20 w-20 border-[3px] border-gray-100 border-t-indigo-600 rounded-full animate-spin" />
                    <Building2 className="h-8 w-8 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center">
                    <p className="text-lg font-bold text-gray-900 tracking-tight uppercase">Loading Stays...</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-2">Checking hostel records</p>
                </div>
            </div>
        </div>
    );

    const activeCount = bookings?.filter(b => b.status === 'Active' || b.status === 'CHECKED_IN').length || 0;
    const totalPayments = bookings?.reduce((acc, b) => acc + (b.Payment?.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0) || 0), 0) || 0;

    return (
        <div className="min-h-screen bg-gray-50/50 pb-32 font-sans tracking-tight">
            {/* Minimal Premium Header (Admin style) */}
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-2 w-2 rounded-full bg-indigo-600" />
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight uppercase">My Bookings</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Your Stays</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Active Now</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => window.location.href = '/guest/payments'}
                            variant="outline"
                            className="h-9 px-4 rounded-xl border-gray-200 bg-white font-bold text-[10px] uppercase tracking-wider text-gray-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm group"
                        >
                            <Download className="h-3.5 w-3.5 mr-2 text-gray-400 group-hover:text-white" />
                            Financial Exports
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
                {/* Minimal Metrics Matrix */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Active Stays', value: activeCount, icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { label: 'Total Bookings', value: bookings?.length || 0, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Total Paid', value: `PKR ${(totalPayments / 1000).toFixed(1)}k`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Security', value: 'Verified', icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-50' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className={`h-11 w-11 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</span>
                                <span className="text-xl font-bold text-gray-900 tracking-tight">{stat.value}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Operations Feed */}
                <div className="space-y-4">
                    <div className="flex items-center gap-4 px-2">
                        <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em] leading-none mb-4">Bookings List</h3>
                    </div>

                    {bookings && bookings.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {[...bookings]
                                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                .map((booking) => (
                                    <BookingDetailCard key={booking.id} booking={booking} />
                                ))}
                        </div>
                    ) : (
                        <div className="bg-white border border-gray-100 rounded-3xl p-24 text-center shadow-sm border-dashed">
                            <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-6 border border-gray-100">
                                <Search className="h-8 w-8 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">No bookings found</h3>
                            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">No hostel stay records found in the system</p>
                        </div>
                    )}
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
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-100">Secure System</h4>
                                <p className="text-[11px] font-bold mt-0.5 uppercase">Booking Data Synced</p>
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

                        <div className="flex items-center gap-3 pr-6 relative z-10">
                            <span className="text-[9px] font-bold uppercase text-white tracking-widest">Online</span>
                            <div className="h-2 w-2 rounded-full bg-white animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.4)]" />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default GuestBookings;
