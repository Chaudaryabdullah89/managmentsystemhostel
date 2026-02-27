"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Bed, Calendar, CreditCard, Building2, ChevronLeft, MapPin,
    ShieldCheck, Users, Wifi, Coffee, Wind, Zap, CheckCircle,
    Phone, Mail, Clock, AlertCircle, FileText, Download, Receipt,
    Star, Sparkle, ArrowRight, ChevronRight, Info, Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import useAuthStore from "@/hooks/Authstate";
import { useBookings } from "@/hooks/useBooking";
import { useAllPayments } from "@/hooks/usePayment";
import { format } from "date-fns";
import Link from "next/link";
import Loader from "@/components/ui/Loader";

const amenityIcons = {
    'WiFi': Wifi, 'Internet': Wifi, 'AC': Wind, 'Air Conditioning': Wind,
    'Mess': Coffee, 'Food': Coffee, 'Laundry': Wind, 'Security': ShieldCheck,
    'Electricity': Zap, 'Power': Zap,
};

const GuestRoomPage = () => {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const { data: bookingsData, isLoading } = useBookings({ userId: user?.id });
    const { data: paymentsData } = useAllPayments({ userId: user?.id, limit: 50 });

    const currentBooking = bookingsData?.find(b => ['CONFIRMED', 'CHECKED_IN'].includes(b.status)) || bookingsData?.[0];
    const room = currentBooking?.Room;
    const hostel = room?.Hostel;

    const payments = paymentsData?.payments || [];
    const paidPayments = payments.filter(p => p.status === 'PAID');
    const pendingPayments = payments.filter(p => ['PENDING', 'OVERDUE'].includes(p.status));
    const totalPaid = paidPayments.reduce((s, p) => s + p.amount, 0);
    const totalPending = pendingPayments.reduce((s, p) => s + p.amount, 0);

    const checkInDate = currentBooking?.checkIn ? new Date(currentBooking.checkIn) : null;
    const today = new Date();
    const daysStayed = checkInDate ? Math.floor((today - checkInDate) / (1000 * 60 * 60 * 24)) : 0;

    if (isLoading) return <Loader label="Loading Your Room" subLabel="Fetching residency details..." icon={Bed} fullScreen={false} />;

    if (!currentBooking || !room) {
        return (
            <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center gap-6 p-8">
                <div className="h-20 w-20 rounded-3xl bg-gray-100 flex items-center justify-center">
                    <Bed className="h-10 w-10 text-gray-300" />
                </div>
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">No Active Residency</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">You don't have an active room assignment</p>
                </div>
                <Link href="/guest/bookings">
                    <Button className="h-12 px-8 rounded-2xl bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest">
                        View My Bookings
                    </Button>
                </Link>
            </div>
        );
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'AVAILABLE': return 'bg-emerald-500';
            case 'OCCUPIED': return 'bg-blue-500';
            case 'MAINTENANCE': return 'bg-amber-500';
            default: return 'bg-gray-400';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/30 pb-20 font-sans">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-40 h-16">
                <div className="max-w-5xl mx-auto px-4 md:px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl h-9 w-9 hover:bg-gray-100">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="h-5 w-px bg-gray-100" />
                        <div>
                            <h1 className="text-base font-bold text-gray-900 uppercase tracking-tight">My Room</h1>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Residency Details</p>
                        </div>
                    </div>
                    <Badge className={`${currentBooking.status === 'CHECKED_IN' ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'} border-none text-[9px] font-bold uppercase px-3`}>
                        {currentBooking.status.replace('_', ' ')}
                    </Badge>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-6">
                {/* Hero Room Card */}
                <div className="bg-gray-950 text-white rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/50 via-transparent to-transparent" />
                    <div className="absolute bottom-0 right-0 opacity-5 p-8">
                        <Bed className="h-40 w-40" />
                    </div>

                    <div className="relative z-10">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] mb-3">{hostel?.name}</p>
                        <div className="flex items-end gap-4 mb-6">
                            <h2 className="text-5xl md:text-7xl font-black tracking-tighter">
                                Room {room.roomNumber}
                            </h2>
                            <div className="mb-2">
                                <span className={`inline-block h-2.5 w-2.5 rounded-full ${getStatusColor(room.status)} shadow-lg`} />
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div className="flex items-center gap-2 text-gray-400">
                                <Building2 className="h-4 w-4" />
                                <span className="font-bold text-xs uppercase tracking-wider">Floor {room.floor}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                                <Users className="h-4 w-4" />
                                <span className="font-bold text-xs uppercase tracking-wider">{room.type} Room • {room.capacity} Beds</span>
                            </div>
                            {hostel?.city && (
                                <div className="flex items-center gap-2 text-gray-400">
                                    <MapPin className="h-4 w-4" />
                                    <span className="font-bold text-xs uppercase tracking-wider">{hostel.city}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Booking Stats Strip */}
                    <div className="relative z-10 grid grid-cols-3 gap-4 mt-10 pt-8 border-t border-white/10">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Check-in</span>
                            <span className="text-sm md:text-base font-bold text-white">{checkInDate ? format(checkInDate, 'MMM dd, yyyy') : 'N/A'}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Days Stayed</span>
                            <span className="text-sm md:text-base font-bold text-emerald-400">{daysStayed} Days</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Monthly Rent</span>
                            <span className="text-sm md:text-base font-bold text-white">PKR {(room.monthlyrent || room.montlyrent || room.price || 0).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Paid', value: `PKR ${totalPaid.toLocaleString()}`, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
                        { label: 'Pending Due', value: `PKR ${totalPending.toLocaleString()}`, icon: AlertCircle, color: 'text-amber-600 bg-amber-50' },
                        { label: 'Booking ID', value: currentBooking.uid || currentBooking.id?.slice(-8).toUpperCase(), icon: FileText, color: 'text-indigo-600 bg-indigo-50' },
                        { label: 'Security Deposit', value: `PKR ${(currentBooking.securityDeposit || 0).toLocaleString()}`, icon: ShieldCheck, color: 'text-purple-600 bg-purple-50' },
                    ].map((item, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col gap-3 hover:shadow-md transition-all">
                            <div className={`h-10 w-10 rounded-xl ${item.color} flex items-center justify-center`}>
                                <item.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</p>
                                <p className="text-sm font-bold text-gray-900 mt-0.5 truncate">{item.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Amenities + Hostel Info */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Amenities */}
                        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-5">Room Amenities</h3>
                            <div className="flex flex-wrap gap-2">
                                {(room.amenities || []).length > 0 ? room.amenities.map((amenity, i) => {
                                    const Icon = amenityIcons[amenity] || Star;
                                    return (
                                        <div key={i} className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                                            <Icon className="h-3.5 w-3.5 text-indigo-500" />
                                            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">{amenity}</span>
                                        </div>
                                    );
                                }) : (
                                    <p className="text-[10px] font-bold text-gray-300 uppercase italic">Standard configuration</p>
                                )}
                            </div>
                        </div>

                        {/* Hostel Info */}
                        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hostel Info</h3>
                            {[
                                { label: 'Name', value: hostel?.name, icon: Building2 },
                                { label: 'Address', value: hostel?.completeaddress || hostel?.address, icon: MapPin },
                                { label: 'City', value: hostel?.city, icon: Home },
                                { label: 'Phone', value: hostel?.phone, icon: Phone },
                                { label: 'Email', value: hostel?.email, icon: Mail },
                            ].filter(i => i.value).map((item, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                                        <item.icon className="h-3.5 w-3.5 text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</p>
                                        <p className="text-xs font-bold text-gray-700 mt-0.5">{item.value}</p>
                                    </div>
                                </div>
                            ))}
                            {hostel?.messavailable && (
                                <div className="flex items-center gap-2 mt-2 p-3 bg-emerald-50 rounded-xl">
                                    <Coffee className="h-4 w-4 text-emerald-600" />
                                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Mess / Cafeteria Available</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Payment History */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Payment Summary */}
                        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payment History</h3>
                                <Link href="/guest/payments">
                                    <Button variant="ghost" className="h-8 px-4 rounded-xl text-[9px] font-bold uppercase tracking-widest text-indigo-600 hover:bg-indigo-50">
                                        View All <ChevronRight className="h-3 w-3 ml-1" />
                                    </Button>
                                </Link>
                            </div>

                            {/* Progress bar */}
                            {(totalPaid + totalPending) > 0 && (
                                <div className="mb-6 p-4 bg-gray-50 rounded-2xl">
                                    <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                        <span>Paid: PKR {totalPaid.toLocaleString()}</span>
                                        <span>Pending: PKR {totalPending.toLocaleString()}</span>
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${Math.min(100, (totalPaid / (totalPaid + totalPending)) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Payment list */}
                            <div className="space-y-3">
                                {payments.length > 0 ? payments.slice(0, 8).map((payment) => (
                                    <div key={payment.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-50 hover:bg-gray-50 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${payment.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : payment.status === 'OVERDUE' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                                                <Receipt className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{payment.notes || payment.type || 'Monthly Rent'}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{format(new Date(payment.date), 'MMM dd, yyyy')}</p>
                                                    {payment.month && (
                                                        <span className="text-[9px] font-bold text-gray-300">• {payment.month}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-gray-900">PKR {payment.amount?.toLocaleString()}</p>
                                            <Badge className={`mt-1 text-[8px] font-bold border-none px-2 ${payment.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : payment.status === 'OVERDUE' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                                                {payment.status}
                                            </Badge>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-12 text-gray-300">
                                        <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-50" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest">No payment records yet</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Lease Summary Card */}
                        <div className="bg-indigo-600 text-white rounded-3xl p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 opacity-10 p-6"><FileText className="h-24 w-24" /></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                                        <ShieldCheck className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-indigo-200 uppercase tracking-widest">Booking Summary</p>
                                        <p className="text-sm font-bold">{currentBooking.uid || 'BK-' + currentBooking.id?.slice(-8).toUpperCase()}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-[9px] text-indigo-300 uppercase tracking-widest font-bold">Check-in</p>
                                        <p className="font-bold mt-0.5">{checkInDate ? format(checkInDate, 'MMM dd, yyyy') : 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-indigo-300 uppercase tracking-widest font-bold">Monthly Rent</p>
                                        <p className="font-bold mt-0.5">PKR {(room.monthlyrent || room.montlyrent || room.price || 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-indigo-300 uppercase tracking-widest font-bold">Security Bond</p>
                                        <p className="font-bold mt-0.5">PKR {(currentBooking.securityDeposit || 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-indigo-300 uppercase tracking-widest font-bold">Status</p>
                                        <p className="font-bold mt-0.5">{currentBooking.status.replace('_', ' ')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default GuestRoomPage;
