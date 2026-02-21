"use client"
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ChevronLeft,
    ShieldCheck,
    Calendar,
    User,
    Home,
    CreditCard,
    FileText,
    Receipt,
    Printer,
    Download,
    Check,
    X,
    TrendingUp,
    Clock,
    Activity,
    AlertCircle,
    ArrowRight,
    MapPin,
    Phone,
    Mail,
    Building2,
    CheckCircle2,
    Eye,
    ChevronRight,
    ExternalLink,
    XCircle,
    Loader2,
    CheckCircle,
    Building,
    UserCircle,
    Settings,
    Edit3,
    Trash2,
    Info,
    ArrowUpRight,
    Shirt,
    Wrench,
    Sparkle,
    LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { useBookingById, useUpdateBookingStatus } from "@/hooks/useBooking";
import { format } from "date-fns";
import { toast } from "sonner";
import useAuthStore from "@/hooks/Authstate";
import CheckoutModal from "../CheckoutModal";


const BookingDetailsPage = () => {
    const { bookingId } = useParams();
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const { data: booking, isLoading } = useBookingById(bookingId);

    const updateStatus = useUpdateBookingStatus();
    const handlePrint = () => {
        window.print();
    };

    const handleStatusUpdate = async (newStatus) => {
        try {
            await updateStatus.mutateAsync({ id: bookingId, status: newStatus });
            toast.success(`Booking status updated to ${newStatus}`);
        } catch (error) {
            toast.error("Status update failed");
        }
    };

    if (isLoading) return (
        <div className="flex h-screen items-center justify-center bg-white font-sans">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="h-20 w-20 border-[3px] border-gray-100 border-t-indigo-600 rounded-full animate-spin" />
                    <Calendar className="h-8 w-8 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center">
                    <p className="text-lg font-bold text-gray-900 tracking-tight">Loading Booking...</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">Fetching records</p>
                </div>
            </div>
        </div>
    );

    if (!booking) return (
        <div className="flex flex-col items-center justify-center min-h-screen p-20 text-center">
            <div className="h-16 w-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-6">
                <AlertCircle className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Booking Not Found</h3>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-2">The requested booking does not exist in the system.</p>
            <Button onClick={() => router.back()} variant="outline" className="mt-8 rounded-xl h-10 px-8 font-bold uppercase tracking-widest text-[9px]">Go Back</Button>
        </div>
    );

    const totalPaid = booking.Payment?.filter(p => p.status === 'PAID').reduce((acc, curr) => acc + curr.amount, 0) || 0;
    const totalPayable = (booking.totalAmount || 0) + (booking.securityDeposit || 0);
    const balance = totalPayable - totalPaid;
    const paymentProgress = ((totalPaid / totalPayable) * 100).toFixed(0);

    const getStatusStyle = (status) => {
        switch (status?.toUpperCase()) {
            case "CONFIRMED": return "bg-emerald-50 text-emerald-700 border-emerald-100";
            case "PENDING": return "bg-indigo-50 text-indigo-700 border-indigo-100";
            case "CHECKED_IN": return "bg-blue-50 text-blue-700 border-blue-100";
            case "CHECKED_OUT": return "bg-slate-50 text-slate-700 border-slate-100";
            case "CANCELLED": return "bg-rose-50 text-rose-700 border-rose-100";
            default: return "bg-gray-50 text-gray-600 border-gray-100";
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-32 font-sans tracking-tight print:bg-transparent print:pb-0">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16 shadow-sm shadow-black/5 print:hidden">
                <div className="max-w-[1400px] mx-auto px-8 h-full flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100 h-9 w-9" onClick={() => router.back()}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="h-6 w-px bg-gray-100" />
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-indigo-600" />
                            <div className="flex flex-col">
                                <h1 className="text-base font-bold text-gray-900 tracking-tight uppercase">Booking Details</h1>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">ID: {booking.uid || bookingId.slice(-12).toUpperCase()}</span>
                                    <Badge variant="outline" className={`${getStatusStyle(booking.status)} text-[8px] px-2 py-0 border`}>
                                        {booking.status}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="h-9 px-5 rounded-xl border-gray-100 text-gray-600 font-bold text-[9px] uppercase tracking-widest hover:bg-gray-50 transition-all bg-white"
                            onClick={() => router.push(`/admin/bookings/${bookingId}/edit`)}
                        >
                            <Edit3 className="h-3.5 w-3.5 mr-2" />
                            Edit Booking
                        </Button>

                        <Button
                            onClick={handlePrint}
                            className="h-9 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[9px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
                        >
                            <Printer className="h-4 w-4" />
                            Print Receipt
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1400px] mx-auto px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Summary Stats Card */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-8 relative overflow-hidden shadow-sm">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50 rounded-full -mr-24 -mt-24 opacity-60 blur-3xl pointer-events-none" />

                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                            <div className="flex items-center gap-6">
                                <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-sm">
                                    <Home className="h-8 w-8 text-indigo-600" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Total Amount</span>
                                    <div className="flex items-baseline gap-3">
                                        <h2 className="text-4xl font-bold text-gray-900 tracking-tighter">PKR {totalPayable.toLocaleString()}</h2>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
                                <div className="flex flex-col items-end">
                                    <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-1">{paymentProgress}% Paid</p>
                                    <div className="w-32 h-1.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                        <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${paymentProgress}%` }} />
                                    </div>
                                </div>
                                <Badge variant="outline" className={`${getStatusStyle(booking.status)} px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border shadow-sm`}>
                                    {booking.status}
                                </Badge>
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-gray-100">
                            {[
                                { label: 'Check-In', value: booking.checkIn ? format(new Date(booking.checkIn), 'MMM dd, yyyy') : 'N/A', icon: Calendar, sub: 'Start Date' },
                                { label: 'Check-Out', value: booking.checkOut ? format(new Date(booking.checkOut), 'MMM dd, yyyy') : 'No End Date', icon: Clock, sub: 'End Date' },
                                { label: 'Monthly Rent', value: `PKR ${booking.totalAmount.toLocaleString()}`, icon: Receipt, sub: 'Per Month' },
                                { label: 'Security Deposit', value: `PKR ${booking.securityDeposit?.toLocaleString() || '0'}`, icon: CreditCard, sub: 'Refundable' }
                            ].map((item, i) => (
                                <div key={i} className="flex flex-col gap-2 group">
                                    <div className="flex items-center gap-2">
                                        <div className="h-7 w-7 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 border border-gray-100">
                                            <item.icon className="h-3.5 w-3.5 text-gray-400 group-hover:text-white transition-colors" />
                                        </div>
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{item.label}</span>
                                    </div>
                                    <div className="pl-0.5">
                                        <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">{item.value}</p>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{item.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Resident Profile Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Occupant Information */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm relative overflow-hidden group">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                                <div className="h-1 w-3 bg-indigo-600 rounded-full" /> Resident Information
                            </h3>
                            <div className="space-y-6 relative z-10">
                                <div className="flex items-center gap-5">
                                    <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-lg font-bold text-indigo-600 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                        {booking.User?.name?.charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Name</span>
                                        <p className="text-base font-bold text-gray-900 uppercase tracking-tight">{booking.User?.name}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-gray-100">
                                    <div className="flex items-center justify-between p-3.5 bg-gray-50/50 rounded-xl border border-gray-100/50 hover:bg-white transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Phone className="h-3.5 w-3.5 text-indigo-500" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Phone</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900 font-mono">{booking.User?.phone || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3.5 bg-gray-50/50 rounded-xl border border-gray-100/50 hover:bg-white transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Mail className="h-3.5 w-3.5 text-indigo-500" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Email</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900 truncate max-w-[160px]">{booking.User?.email || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3.5 bg-gray-50/50 rounded-xl border border-gray-100/50 hover:bg-white transition-colors">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-3.5 w-3.5 text-indigo-500" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">CNIC</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900 font-mono">{booking.User?.cnic || 'PENDING'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Room & Building */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm relative overflow-hidden group">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                                <div className="h-1 w-3 bg-indigo-600 rounded-full" /> Room & Building
                            </h3>
                            <div className="space-y-6 relative z-10">
                                <div className="p-5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/20 group-hover:scale-[1.01] transition-transform duration-300">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                                            <Home className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest">Hostel Name</p>
                                            <p className="text-base font-bold uppercase">{booking.Room?.Hostel?.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-bold tracking-tighter">ROOM {booking.Room?.roomNumber}</span>
                                        </div>
                                        <Badge className="bg-white/20 text-white border-none rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase">
                                            Floor {booking.Room?.floor}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3.5 bg-gray-50/50 rounded-xl border border-gray-100/50">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Room Type</span>
                                        <span className="text-sm font-bold text-gray-900 uppercase">{booking.Room?.type || 'Standard'}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3.5 bg-gray-50/50 rounded-xl border border-gray-100/50">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Status</span>
                                        <span className="text-sm font-bold text-emerald-600 uppercase">Active</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3.5 bg-gray-50/50 rounded-xl border border-gray-100/50">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">City</span>
                                        <span className="text-sm font-bold text-gray-900 uppercase truncate max-w-[120px]">{booking.Room?.Hostel?.city || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Access Services */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-3">
                                <Settings className="h-4 w-4 text-gray-400" />
                                Room Services
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { icon: Shirt, label: 'Laundry', sub: `History`, color: 'text-purple-500', bg: 'bg-purple-50', link: `/admin/hostels/${booking.Room?.Hostel?.id}/room-details/room/${booking.Room?.id}/laundry` },
                                { icon: Wrench, label: 'Maintenance', sub: `Tickets`, color: 'text-amber-500', bg: 'bg-amber-50', link: `/admin/hostels/${booking.Room?.Hostel?.id}/room-details/room/${booking.Room?.id}/maintenance` },
                                { icon: Sparkle, label: 'Cleaning', sub: `Logs`, color: 'text-blue-500', bg: 'bg-blue-50', link: `/admin/hostels/${booking.Room?.Hostel?.id}/room-details/room/${booking.Room?.id}/cleaning` }
                            ].map((service, i) => (
                                <div key={i} className="flex flex-col gap-4 bg-gray-50/50 border border-gray-100 rounded-2xl p-5 hover:bg-white hover:border-indigo-100 hover:shadow-md transition-all group cursor-pointer" onClick={() => router.push(service.link)}>
                                    <div className={`h-10 w-10 rounded-xl ${service.bg} flex items-center justify-center group-hover:bg-indigo-600 transition-colors`}>
                                        <service.icon className={`h-5 w-5 ${service.color} group-hover:text-white transition-colors`} />
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="text-xs font-bold text-gray-900 uppercase">{service.label}</span>
                                            <ChevronRight className="h-3 w-3 text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                                        </div>
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{service.sub}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-8">
                    {/* Financial Summary */}
                    <div className="bg-indigo-600 text-white rounded-2xl p-8 shadow-2xl shadow-indigo-600/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-24 -mt-24 transition-transform duration-700 group-hover:scale-125" />
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-100 mb-8 flex items-center gap-2">
                            <TrendingUp className="h-3.5 w-3.5" /> Financial Summary
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <span className="text-[9px] font-bold text-indigo-200 uppercase block mb-2 tracking-widest">Outstanding Balance</span>
                                <div className="flex items-center justify-between">
                                    <p className="text-3xl font-bold text-white tracking-tighter">PKR {balance.toLocaleString()}</p>
                                    <div className="h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white hover:text-indigo-600 transition-all cursor-pointer" onClick={() => router.push(`/admin/bookings/${bookingId}/payments`)}>
                                        <ChevronRight className="h-5 w-5" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/10">
                                <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-indigo-200 uppercase tracking-widest block">Total Payable</span>
                                    <p className="text-sm font-bold text-white">PKR {totalPayable.toLocaleString()}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-indigo-200 uppercase tracking-widest block">Total Paid</span>
                                    <p className="text-sm font-bold text-emerald-300 tracking-tighter">PKR {totalPaid.toLocaleString()}</p>
                                </div>
                            </div>

                            <Button className="w-full h-11 bg-white/10 border border-white/20 hover:bg-white hover:text-indigo-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all mt-2 shadow-md" onClick={() => router.push(`/admin/bookings/${bookingId}/payments`)}>
                                View All Payments <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm space-y-6">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                            <Activity className="h-3.5 w-3.5" /> Manage Status
                        </h3>

                        <div className="space-y-3">
                            {booking.status === 'PENDING' && (
                                <Button className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2" onClick={() => handleStatusUpdate('CONFIRMED')}>
                                    <CheckCircle className="h-4 w-4" /> Confirm Booking
                                </Button>
                            )}
                            {booking.status === 'CONFIRMED' && (
                                <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2" onClick={() => handleStatusUpdate('CHECKED_IN')}>
                                    <CheckCircle2 className="h-4 w-4" /> Check In
                                </Button>
                            )}
                            {booking.status === 'CHECKED_IN' && (
                                <CheckoutModal
                                    booking={booking}
                                    wardenId={user?.id}
                                    onComplete={() => router.refresh()}
                                >
                                    <Button className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
                                        <LogOut className="h-4 w-4" /> Check Out
                                    </Button>
                                </CheckoutModal>
                            )}


                            <Button variant="outline" className="w-full h-11 border-rose-100 text-rose-600 hover:bg-rose-50 font-bold text-[10px] uppercase tracking-widest rounded-xl flex items-center gap-2" onClick={() => handleStatusUpdate('CANCELLED')} disabled={booking.status === 'CANCELLED' || booking.status === 'CHECKED_OUT'}>
                                <XCircle className="h-4 w-4" /> Cancel Booking
                            </Button>
                        </div>
                    </div>

                    {/* Activity Timeline */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm space-y-6 group/audit">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                <Activity className="h-3.5 w-3.5" /> Activity Logs
                            </h3>
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
                            {[
                                { event: 'Booking Created', date: booking.createdAt, desc: 'Initial entry in system' },
                                { event: 'Payment Scheduled', date: booking.checkIn, desc: 'Amount calculated for stay' },
                                { event: 'Current Status', date: new Date(), desc: 'Last system check' },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-6 relative z-10 group/step">
                                    <div className="h-6 w-6 rounded-full bg-white border-2 border-indigo-500 flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300">
                                        <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-900 uppercase tracking-tight">{item.event}</span>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{item.desc}</p>
                                        <span className="text-[9px] font-bold text-indigo-600 mt-1.5 bg-indigo-50 self-start px-2 py-0.5 rounded-full">
                                            {format(new Date(item.date), 'MMM dd, HH:mm')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {/* Printable Receipt */}
            <div className="hidden print:block bg-white text-black p-8 max-w-3xl mx-auto">
                {/* Header */}
                <div className="border-b-2 border-gray-900 pb-6 mb-6 flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">Hostel Management</h1>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Official Payment Receipt</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Receipt No.</p>
                        <p className="text-sm font-bold text-gray-900 font-mono">{booking.uid || bookingId.slice(-12).toUpperCase()}</p>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Date</p>
                        <p className="text-sm font-bold text-gray-900">{format(new Date(), 'MMM dd, yyyy')}</p>
                    </div>
                </div>

                {/* Resident Details */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-2 mb-3">Billed To</h3>
                        <p className="font-bold text-gray-900 uppercase text-sm">{booking.User?.name}</p>
                        <p className="text-xs text-gray-600 mt-1">Phone: {booking.User?.phone || 'N/A'}</p>
                        <p className="text-xs text-gray-600 mt-0.5">CNIC: {booking.User?.cnic || 'N/A'}</p>
                    </div>
                    <div>
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-2 mb-3">Room Information</h3>
                        <p className="font-bold text-gray-900 uppercase text-sm">{booking.Room?.Hostel?.name || 'N/A'}</p>
                        <p className="text-xs text-gray-600 mt-1">Room {booking.Room?.roomNumber || 'N/A'} (Floor {booking.Room?.floor || 'N/A'})</p>
                        <p className="text-xs text-gray-600 mt-0.5">Stay: {booking.checkIn ? format(new Date(booking.checkIn), 'MMM dd, yyyy') : 'N/A'} - {booking.checkOut ? format(new Date(booking.checkOut), 'MMM dd, yyyy') : 'N/A'}</p>
                    </div>
                </div>

                {/* Payment Breakdown */}
                <div className="mb-8">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-2 mb-3">Payment Summary</h3>
                    <table className="w-full text-left text-sm mb-4">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="py-2 text-xs font-bold text-gray-400 uppercase tracking-widest">Description</th>
                                <th className="py-2 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Amount (PKR)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-gray-100">
                                <td className="py-3 font-medium">Monthly Rent</td>
                                <td className="py-3 text-right font-mono">{booking.totalAmount?.toLocaleString() || '0'}</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                                <td className="py-3 font-medium">Security Deposit</td>
                                <td className="py-3 text-right font-mono">{booking.securityDeposit?.toLocaleString() || '0'}</td>
                            </tr>
                            <tr>
                                <td className="py-3 font-bold text-gray-900">Total Payable</td>
                                <td className="py-3 text-right font-bold font-mono text-gray-900">{totalPayable.toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td className="py-2 font-bold text-gray-900">Total Paid</td>
                                <td className="py-2 text-right font-bold font-mono text-gray-900">{totalPaid.toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                    <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <span className="font-black uppercase tracking-tight text-gray-900">Balance Due</span>
                        <span className="font-black font-mono text-xl text-gray-900">PKR {balance.toLocaleString()}</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-16 pt-8 border-t border-gray-200 text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Thank you for your business</p>
                    <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-1">This is a system generated receipt and does not require a physical signature.</p>
                </div>
            </div>
        </div>
    );
};

export default BookingDetailsPage;
