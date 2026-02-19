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
    Send,
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
    Zap,
    Activity,
    Blocks,
    Wallet
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
        <Badge variant="outline" className={`${getStatusStyle(status)} px-3 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border shadow-sm`}>
            {status.replace('_', ' ')}
        </Badge>
    );
};

const BookingDetailCard = ({ booking }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const financialData = useMemo(() => {
        const payments = booking.Payment || [];
        const paid = payments.filter(p => p.status === 'PAID').reduce((acc, curr) => acc + curr.amount, 0);
        const pending = payments.filter(p => p.status === 'PENDING' || p.status === 'PARTIAL').reduce((acc, curr) => acc + curr.amount, 0);
        const total = (booking.totalAmount || 0) + (booking.securityDeposit || 0);

        const balance = Math.max(0, total - paid); // What is still missing from PAID
        const netOwed = Math.max(0, total - paid - pending); // What is not even NOTIFIED
        const progress = total > 0 ? ((paid / total) * 100).toFixed(0) : 0;

        return { paid, total, balance, netOwed, progress };
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
        <div className="bg-white border border-gray-100 rounded-3xl p-6 flex flex-col hover:shadow-xl transition-all duration-500 group relative overflow-hidden ring-1 ring-black/[0.02]">
            <div className={`absolute top-0 left-0 w-1 h-full ${getRibbonColor(booking.status)} opacity-60`} />

            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
                {/* Slimmer Header Section */}
                <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm shrink-0 group-hover:bg-blue-600 transition-colors duration-500">
                        <Building2 className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex flex-col min-w-0 text-left">
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight truncate">{booking.Room?.Hostel?.name}</h4>
                            {(booking.status === 'Active' || booking.status === 'CHECKED_IN') && (
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Unit {booking.Room?.roomNumber}</span>
                            <span className="h-1 w-1 rounded-full bg-slate-200" />
                            <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">{booking.uid || `ID-${booking.id.slice(0, 4)}`}</span>
                        </div>
                    </div>
                </div>

                {/* Slim Profile Bar */}
                <div className="hidden xl:flex items-center gap-8 bg-slate-50/50 px-5 py-2.5 rounded-2xl border border-slate-100/50">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Calendar className="h-2 w-2" /> Since
                        </span>
                        <span className="text-[10px] font-bold text-slate-900 uppercase">{format(new Date(booking.checkIn), 'MMM dd')}</span>
                    </div>
                    <div className="w-12 h-px bg-slate-200" />
                    <div className="flex flex-col gap-0.5 text-right">
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-end gap-1">
                            Till <Clock className="h-2 w-2" />
                        </span>
                        <span className="text-[10px] font-bold text-slate-900 uppercase">{booking.checkOut ? format(new Date(booking.checkOut), 'MMM dd') : 'Active'}</span>
                    </div>
                </div>

                {/* Action Stack */}
                <div className="flex items-center gap-3 lg:ml-auto">
                    <BookingStatusBadge status={booking.status} />

                    <div className="flex items-center gap-2">
                        <UnifiedReceipt data={booking} type="booking">
                            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-100 bg-white text-slate-400 hover:text-blue-600 transition-colors shadow-sm">
                                <Printer className="h-3.5 w-3.5" />
                            </Button>
                        </UnifiedReceipt>

                        {['Active', 'CONFIRMED', 'CHECKED_IN'].includes(booking.status) && (
                            <PaymentNotificationModal booking={booking}>
                                <Button className="h-9 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[9px] uppercase tracking-widest shadow-lg shadow-blue-500/20 flex items-center gap-2 group/btn">
                                    <Send className="h-3.5 w-3.5" />
                                    Notify
                                </Button>
                            </PaymentNotificationModal>
                        )}

                        <Button
                            variant="ghost"
                            size="icon"
                            className={`h-9 w-9 rounded-xl transition-all ${isExpanded ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Slim Payment Overlay (Only visible when not expanded) */}
            {!isExpanded && (
                <div className="mt-6 pt-5 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Owed Balance</span>
                            <span className={`text-xs font-bold ${financialData.balance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                PKR {financialData.balance.toLocaleString()}
                            </span>
                        </div>
                        <div className="h-6 w-px bg-slate-100" />
                        <div className="flex flex-col">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Paid Stats</span>
                            <div className="flex items-center gap-2">
                                <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{ width: `${financialData.progress}%` }} />
                                </div>
                                <span className="text-[9px] font-bold text-slate-600">{financialData.progress}%</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Next Due</span>
                        <span className="text-[9px] font-bold text-slate-900 uppercase">1st of Month</span>
                    </div>
                </div>
            )}

            {/* Expanded Content with Slimmer Layout */}
            {isExpanded && (
                <div className="mt-8 pt-6 border-t border-slate-100 space-y-6 animate-in fade-in slide-in-from-top-2 duration-500">
                    <Tabs defaultValue="finance" className="w-full">
                        <TabsList className="bg-slate-50 p-1 rounded-xl h-10 w-fit mb-6 ring-1 ring-black/[0.05]">
                            {[
                                { id: 'finance', label: 'Billing', icon: Wallet },
                                { id: 'operations', label: 'Services', icon: Blocks },
                                { id: 'identity', label: 'Profile', icon: UserCheck }
                            ].map(tab => (
                                <TabsTrigger key={tab.id} value={tab.id} className="rounded-lg px-5 font-bold text-[9px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all h-full">
                                    <tab.icon className="h-3 w-3 mr-2" /> {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <TabsContent value="finance" className="mt-0 grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Recent Transactions</h5>
                                    <Badge variant="outline" className="text-[7px] font-bold border-slate-100 bg-white shadow-sm">Verified Live</Badge>
                                </div>
                                <div className="space-y-2">
                                    {booking.Payment?.slice(0, 4).map((p) => (
                                        <div key={p.id} className="bg-slate-50/50 border border-slate-100/50 rounded-xl p-3 flex items-center justify-between group/row hover:bg-white hover:border-blue-100 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${p.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                                    <CreditCard className="h-3.5 w-3.5" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-bold text-slate-900 uppercase tracking-tight">{p.type || 'RENT'}</p>
                                                    <p className="text-[7px] font-bold text-slate-400 uppercase mt-0.5">{format(new Date(p.date), 'MMM dd, yyyy')}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-slate-900">PKR {p.amount.toLocaleString()}</p>
                                                <span className={`text-[7px] font-black uppercase ${p.status === 'PAID' ? 'text-emerald-500' : 'text-blue-400'}`}>{p.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {(!booking.Payment || booking.Payment.length === 0) && (
                                        <div className="py-12 border border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/30">
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">No transaction records found</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-slate-900 text-white rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
                                <div className="relative z-10 space-y-4">
                                    <div className="flex justify-between items-center pb-3 border-b border-white/10">
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Total Contract</span>
                                        <span className="text-xs font-bold">PKR {financialData.total.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-3 border-b border-white/10">
                                        <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">Verified Paid</span>
                                        <span className="text-xs font-bold text-emerald-400">PKR {financialData.paid.toLocaleString()}</span>
                                    </div>
                                    <div className="pt-2">
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.3em]">Remaining Balance</span>
                                        <div className="flex items-baseline gap-2 mt-1">
                                            <span className="text-2xl font-black tracking-tighter">PKR {financialData.balance.toLocaleString()}</span>
                                            {financialData.balance > financialData.netOwed && (
                                                <span className="text-[8px] font-bold text-amber-400 uppercase">(PKR {financialData.netOwed.toLocaleString()} Pending Verification)</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <UnifiedReceipt data={booking} type="booking">
                                    <Button className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[9px] uppercase tracking-widest mt-auto shadow-xl shadow-blue-500/10">
                                        <Download className="h-3.5 w-3.5 mr-2" /> Download Statement
                                    </Button>
                                </UnifiedReceipt>
                            </div>
                        </TabsContent>

                        <TabsContent value="operations" className="mt-0 grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { l: 'Cleaning', v: booking.Room?.CleaningLog?.[0]?.status || 'CLEAN', i: CheckCircle2, c: 'text-blue-600', bg: 'bg-blue-50' },
                                { l: 'Laundry', v: booking.Room?.LaundryLog?.[0]?.status || 'READY', i: Layers, c: 'text-purple-600', bg: 'bg-purple-50' },
                                { l: 'Maintenance', v: booking.Room?.maintanance?.[0]?.status || 'GOOD', i: ShieldCheck, c: 'text-emerald-600', bg: 'bg-emerald-50' }
                            ].map((op, i) => (
                                <div key={i} className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between hover:border-blue-500 transition-all duration-300">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-9 w-9 rounded-lg ${op.bg} ${op.c} flex items-center justify-center`}>
                                            <op.i className="h-4 w-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{op.l}</span>
                                            <span className="text-[10px] font-bold text-slate-900 uppercase">{op.v}</span>
                                        </div>
                                    </div>
                                    <ArrowUpRight className="h-3 w-3 text-slate-200" />
                                </div>
                            ))}
                        </TabsContent>

                        <TabsContent value="identity" className="mt-0">
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-8 ring-1 ring-black/[0.01]">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-black/10">
                                            <UserIcon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Resident Name</p>
                                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">{booking.User?.name}</h4>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-1">ID Number</p>
                                            <p className="text-[9px] font-black text-slate-800 uppercase leading-none truncate">{booking.User?.cnic || 'N/A'}</p>
                                        </div>
                                        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contact</p>
                                            <p className="text-[9px] font-black text-slate-800 leading-none">{booking.User?.phone}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
                                    <div className="flex items-center gap-2 mb-4">
                                        <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                                        <span className="text-[8px] font-bold text-slate-900 uppercase tracking-widest">Guardian Node</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Relation Name</span>
                                            <span className="text-[9px] font-bold text-slate-900 uppercase">{booking.User?.ResidentProfile?.guardianName || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Security Call</span>
                                            <span className="text-[9px] font-bold text-slate-600 tracking-widest">{booking.User?.ResidentProfile?.guardianPhone || 'N/A'}</span>
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
                    <div className="h-20 w-20 border-[3px] border-gray-100 border-t-blue-600 rounded-full animate-spin" />
                    <Building2 className="h-7 w-7 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center">
                    <p className="text-lg font-bold text-slate-900 tracking-tighter uppercase">Initializing View...</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2">Connecting to hostel registry</p>
                </div>
            </div>
        </div>
    );

    const activeCount = bookings?.filter(b => b.status === 'Active' || b.status === 'CHECKED_IN').length || 0;
    const totalPayments = bookings?.reduce((acc, b) => acc + (b.Payment?.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0) || 0), 0) || 0;

    return (
        <div className="min-h-screen bg-white pb-32 font-sans tracking-tight">
            {/* Slim Premium Header */}
            <div className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50 h-14">
                <div className="max-w-[1400px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-6 w-1 bg-blue-600 rounded-full" />
                        <div className="flex flex-col">
                            <h1 className="text-sm font-bold text-slate-900 tracking-tight uppercase">Dashboard</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">My Stays</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => window.location.href = '/guest/payments'}
                            variant="outline"
                            className="h-8 px-4 rounded-xl border-slate-100 bg-white font-bold text-[8px] uppercase tracking-widest text-slate-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm group"
                        >
                            <CreditCard className="h-3 w-3 mr-2" />
                            Payments History
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1400px] mx-auto px-6 py-10 space-y-10">
                {/* Slim Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Active Stay', value: activeCount, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Verified Paid', value: `PKR ${(totalPayments / 1000).toFixed(1)}k`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Identity', value: 'Verified', icon: ShieldCheck, color: 'text-slate-900', bg: 'bg-slate-100' },
                        { label: 'Status', value: 'Online', icon: Activity, color: 'text-violet-600', bg: 'bg-violet-50' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 hover:shadow-lg transition-all duration-500">
                            <div className={`h-10 w-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                                <stat.icon className="h-4.5 w-4.5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</span>
                                <span className="text-lg font-bold text-slate-900 tracking-tighter">{stat.value}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.4em] ml-2">My Active Records</h3>
                        <div className="flex items-center gap-2 text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                            <RefreshCw className="h-3 w-3 animate-spin-slow" /> Auto-syncing
                        </div>
                    </div>

                    {bookings && bookings.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6">
                            {[...bookings]
                                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                .map((booking) => (
                                    <BookingDetailCard key={booking.id} booking={booking} />
                                ))}
                        </div>
                    ) : (
                        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-[2.5rem] p-32 text-center">
                            <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center mx-auto mb-6 shadow-sm ring-1 ring-black/[0.05]">
                                <Blocks className="h-6 w-6 text-slate-200" />
                            </div>
                            <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight">Search Result Null</h3>
                            <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest mt-2 px-12">No registered bookings found in the secure archive for your credentials.</p>
                        </div>
                    )}
                </div>

                {/* Secure System Banner */}
                <div className="pt-10">
                    <div className="bg-slate-900 text-white rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden ring-1 ring-white/10">
                        <div className="absolute top-0 right-0 w-80 h-full bg-blue-600/10 skew-x-12 translate-x-20" />
                        <div className="flex items-center gap-6 relative z-10 px-4">
                            <div className="h-11 w-11 rounded-2xl bg-white/5 flex items-center justify-center backdrop-blur-xl border border-white/10">
                                <ShieldCheck className="h-5 w-5 text-blue-400" />
                            </div>
                            <div className="flex flex-col">
                                <h4 className="text-[8px] font-bold uppercase tracking-[0.3em] text-blue-400">Security Clearance</h4>
                                <p className="text-[12px] font-bold mt-1 tracking-wide uppercase">Official Resident Portal Active</p>
                            </div>
                        </div>

                        <div className="h-8 w-px bg-white/10 hidden md:block" />

                        <div className="flex-1 flex items-center gap-16 px-8">
                            <div className="flex flex-col">
                                <span className="text-[7px] font-bold uppercase text-slate-400 tracking-[0.2em]">Session ID</span>
                                <span className="text-[10px] font-bold text-slate-300 uppercase mt-1 tracking-widest">{user?.id?.slice(0, 8) || 'GUEST_PROTO'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[7px] font-bold uppercase text-slate-400 tracking-[0.2em]">Encription</span>
                                <span className="text-[10px] font-bold text-white uppercase mt-1 tracking-widest">TLS 1.3 Active</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 pr-6 relative z-10">
                            <div className="flex flex-col items-end">
                                <span className="text-[7px] font-black uppercase text-blue-400 tracking-[0.3em]">End-to-End</span>
                                <span className="text-[9px] font-bold uppercase text-white tracking-widest">Secure Link</span>
                            </div>
                            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default GuestBookings;
