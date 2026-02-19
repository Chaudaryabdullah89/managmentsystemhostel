"use client"
import React from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ChevronLeft,
    Calendar,
    Home,
    User,
    CreditCard,
    Clock,
    ShieldCheck,
    Building2,
    Mail,
    Phone,
    ChevronRight,
    Info,
    MapPin,
    AlertCircle,
    CheckCircle2,
    Printer,
    Edit3,
    Trash2,
    ArrowRightLeft,
    Receipt,
    DollarSign,
    QrCode,
    FileText,
    DoorOpen,
    Shirt,
    Wrench,
    Sparkle,
    ChevronRight as ArrowRight,
    Download,
    Hash,
    Building,
    User as UserIcon,
    ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { useBookingById, useUpdateBookingStatus } from "@/hooks/useBooking";
import { format } from "date-fns";
import { toast } from "sonner";

const BookingDetailsPage = () => {
    const { bookingId } = useParams();
    const router = useRouter();
    const { data: booking, isLoading } = useBookingById(bookingId);
    const updateStatus = useUpdateBookingStatus();

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white font-sans">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="h-20 w-20 border-[3px] border-gray-100 border-t-indigo-600 rounded-full animate-spin" />
                        <ShieldCheck className="h-8 w-8 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-bold text-gray-900 tracking-tight">Loading Booking Details...</p>
                        <p className="text-sm text-gray-500 font-medium mt-1">Getting your records...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/30">
                <div className="text-center space-y-4">
                    <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
                    <h2 className="text-xl font-bold text-gray-900">Booking Not Found</h2>
                    <Button onClick={() => router.push('/admin/bookings')} variant="outline" className="rounded-xl">
                        Back to All Bookings
                    </Button>
                </div>
            </div>
        );
    }

    const totalPaid = booking.Payment?.filter(p => p.status === 'PAID').reduce((acc, curr) => acc + curr.amount, 0) || 0;
    const balance = (booking.totalAmount + (booking.securityDeposit || 0)) - totalPaid;
    const paymentProgress = ((totalPaid / (booking.totalAmount + (booking.securityDeposit || 0))) * 100).toFixed(0);

    const handleStatusUpdate = async (newStatus) => {
        try {
            await updateStatus.mutateAsync({ id: bookingId, status: newStatus });
        } catch (error) {
            console.error("Status update failed:", error);
        }
    };

    const generateReceiptHTML = () => {
        const room = booking.Room || {};
        const hostel = room.Hostel || {};
        const user = booking.User || {};
        const isAdvancePaid = totalPaid >= (booking.totalAmount || 0);

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Agreement Summary - ${booking.id?.toUpperCase().slice(-8) || 'N/A'}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                    body { font-family: 'Inter', sans-serif; padding: 40px; color: #334155; line-height: 1.5; background-color: #f8fafc; }
                    .container { max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 50px; border-radius: 20px; background: white; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
                    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 30px; margin-bottom: 40px; }
                    .brand h1 { margin: 0; font-size: 20px; font-weight: 700; color: #4338ca; }
                    .brand p { margin: 2px 0 0 0; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; }
                    .invoice-meta { text-align: right; }
                    .invoice-meta h2 { margin: 0; font-size: 18px; font-weight: 700; color: #0f172a; }
                    .invoice-meta p { margin: 4px 0 0 0; font-size: 11px; color: #94a3b8; font-weight: 600; }
                    
                    .summary-card { background: #f8fafc; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0; margin-bottom: 30px; }
                    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
                    .label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; margin-bottom: 6px; }
                    .value { font-size: 14px; font-weight: 600; color: #1e293b; }
                    
                    .terms-block { border-top: 1px solid #f1f5f9; padding-top: 30px; margin-bottom: 40px; }
                    .term-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
                    .term-row:last-child { border-bottom: none; }
                    .term-label { font-size: 13px; color: #64748b; }
                    .term-value { font-size: 13px; font-weight: 700; color: #0f172a; }
                    
                    .status-badge { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
                    .status-paid { background: #f0fdf4; color: #15803d; border: 1px solid #dcfce7; }
                    .status-pending { background: #fffbeb; color: #b45309; border: 1px solid #fef3c7; }
                    
                    .footer { text-align: center; margin-top: 60px; padding-top: 24px; border-top: 1px solid #f1f5f9; }
                    .footer p { font-size: 11px; color: #94a3b8; }
                    @media print { .no-print { display: none; } body { padding: 0; background: white; } .container { border: none; padding: 0; box-shadow: none; } }
                    .print-button { position: fixed; bottom: 30px; right: 30px; background: #6366f1; color: #fff; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 12px; }
                </style>
            </head>
            <body>
                <button class="print-button no-print" onclick="window.print()">Print Receipt</button>
                <div class="container">
                    <div class="header">
                        <div class="brand">
                            <h1>GreenView Registry</h1>
                            <p>Residency Agreement Summary</p>
                        </div>
                            <div class="invoice-meta">
                                <h2>BOOKING RECORD</h2>
                                <p>ID: ${booking.uid || booking.id?.toUpperCase().slice(-8) || 'N/A'}</p>
                                <p>ISSUED: ${format(new Date(), 'MMM dd, yyyy')}</p>
                            </div>
                    </div>
                    
                    <div class="summary-card">
                        <div class="grid">
                            <div>
                                <div class="label">Student Name</div>
                                <div class="value">${user.name || 'N/A'}</div>
                                <div style="font-size: 12px; color: #64748b; margin-top: 2px;">${user.email || ''}</div>
                            </div>
                            <div style="text-align: right;">
                                <div class="label">Hostel & Room</div>
                                <div class="value">${hostel.name || 'N/A'}</div>
                                <div style="font-size: 12px; color: #4338ca; font-weight: 700; margin-top: 2px;">Room ${room.roomNumber || 'N/A'}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="terms-block">
                        <div class="label" style="margin-bottom: 16px;">Payment Summary</div>
                        <div class="term-row">
                            <span class="term-label">Monthly Rent</span>
                            <span class="term-value">PKR ${Number(booking.totalAmount || 0).toLocaleString()}</span>
                        </div>
                        <div class="term-row">
                            <span class="term-label">Security Deposit (Refundable)</span>
                            <span class="term-value">PKR ${Number(booking.securityDeposit || 0).toLocaleString()}</span>
                        </div>
                        <div class="term-row" style="background: #f8fafc; padding: 16px; border-radius: 12px; margin-top: 10px;">
                            <span class="term-label" style="font-weight: 600; color: #1e293b;">1st Month Payment</span>
                            <span class="status-badge ${isAdvancePaid ? 'status-paid' : 'status-pending'}">
                                ${isAdvancePaid ? 'Paid' : 'Pending'}
                            </span>
                        </div>
                    </div>
                    
                    <div class="terms-block" style="border-top: none; padding-top: 0;">
                        <div class="label" style="margin-bottom: 16px;">Stay Dates</div>
                        <div class="grid">
                            <div>
                                <div class="label">Check-In Date</div>
                                <div class="value">${booking.checkIn ? format(new Date(booking.checkIn), 'MMM dd, yyyy') : 'N/A'}</div>
                            </div>
                            <div style="text-align: right;">
                                <div class="label">Check-Out Date</div>
                                <div class="value">${booking.checkOut ? format(new Date(booking.checkOut), 'MMM dd, yyyy') : 'No Check-Out Date'}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>This document serves as an official summary of the residency terms for the GreenView Hostel Node.</p>
                        <p>Digitally Authenticated Registry Certificate</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank', 'width=850,height=900');
        printWindow.document.write(generateReceiptHTML());
        printWindow.document.close();
        printWindow.onload = () => printWindow.print();
    };

    const handleViewInvoice = () => {
        const receiptWindow = window.open('', '_blank', 'width=850,height=900');
        receiptWindow.document.write(generateReceiptHTML());
        receiptWindow.document.close();
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case "CONFIRMED": return "bg-blue-50 text-blue-700 border-blue-100";
            case "PENDING": return "bg-amber-50 text-amber-700 border-amber-100";
            case "CHECKED_IN": return "bg-emerald-50 text-emerald-700 border-emerald-100 text-white bg-emerald-500 shadow-emerald-500/20";
            case "CHECKED_OUT": return "bg-gray-100 text-gray-700 border-gray-200 bg-gray-900 text-white";
            case "CANCELLED": return "bg-rose-50 text-rose-700 border-rose-100 text-white bg-rose-500";
            default: return "bg-gray-50 text-gray-600 border-gray-100";
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans">
            {/* Minimal Premium Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100 h-9 w-9" onClick={() => router.back()}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="h-6 w-px bg-gray-200" />
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight">Booking Details</h1>
                            <div className="flex items-center gap-2">
                                {booking.uid ? (
                                    <Badge className="bg-indigo-50 text-indigo-600 border-none text-[10px] font-mono font-bold px-2 py-0.5">
                                        {booking.uid}
                                    </Badge>
                                ) : (
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                                        BOOKING ID: #{booking.id.slice(0, 8).toUpperCase()}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="h-9 px-4 rounded-xl border-gray-200 font-bold text-[10px] uppercase tracking-wider text-gray-600 hover:bg-gray-50">
                                    <Printer className="h-3.5 w-3.5 mr-2" />
                                    Generate Receipt
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-[500px] p-0 overflow-hidden rounded-[2rem] border-0 shadow-2xl bg-white">
                                <div className="p-0 flex flex-col h-full">
                                    {/* Glossy Header */}
                                    <div className="bg-indigo-600 p-8 text-white relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                                        <div className="flex items-center justify-between relative z-10">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/10">
                                                    <Receipt className="h-5 w-5 text-white" />
                                                </div>
                                                <div>
                                                    <h2 className="text-base font-bold uppercase tracking-tight">Payment Receipt</h2>
                                                    <p className="text-[10px] font-medium text-indigo-100 uppercase tracking-widest">Official Record</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold uppercase text-indigo-200 tracking-wider">ID</p>
                                                <p className="font-mono text-sm font-bold">{booking.uid || `#${booking.id.slice(0, 8).toUpperCase()}`}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 space-y-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
                                        {/* Primary Entities */}
                                        <div className="grid grid-cols-2 gap-8">
                                            <div>
                                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Student Info</h3>
                                                <p className="text-sm font-bold text-slate-900">{booking.User.name}</p>
                                                <p className="text-xs text-slate-500 mt-1">{booking.User.email}</p>
                                            </div>
                                            <div className="text-right">
                                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Stay Dates</h3>
                                                <p className="text-sm font-bold text-slate-900">{format(new Date(booking.checkIn), 'MMM dd, yyyy')}</p>
                                                <p className="text-xs text-slate-500 mt-1">{booking.checkOut ? format(new Date(booking.checkOut), 'MMM dd, yyyy') : 'Open Continuity'}</p>
                                            </div>
                                        </div>

                                        {/* Unit Snapshot */}
                                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
                                                    <Building className="h-4 w-4 text-indigo-500" />
                                                </div>
                                                <div>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Room Details</span>
                                                    <p className="text-xs font-bold text-slate-800 uppercase">{booking.Room.Hostel.name}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Location</span>
                                                <p className="text-xs font-bold text-indigo-600">Room {booking.Room.roomNumber}</p>
                                            </div>
                                        </div>

                                        {/* Ledger Itemization */}
                                        <div className="space-y-4">
                                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Payment Details</h3>
                                            <div className="space-y-3">
                                                <div className="flex justify-between text-xs font-semibold">
                                                    <span className="text-slate-500 capitalize">Monthly Rent</span>
                                                    <span className="text-slate-900">PKR {booking.totalAmount.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between text-xs font-semibold">
                                                    <span className="text-slate-500 capitalize">Security Deposit</span>
                                                    <span className="text-slate-900">PKR {booking.securityDeposit?.toLocaleString() || '0'}</span>
                                                </div>
                                                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                                                    <span className="text-[10px] font-bold uppercase text-indigo-500">Total Amount</span>
                                                    <span className="text-2xl font-bold text-slate-900 tracking-tight">PKR {(booking.totalAmount + (booking.securityDeposit || 0)).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Policy Note */}
                                        <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
                                            <Info className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                                            <p className="text-[10px] font-medium text-amber-800 leading-relaxed">
                                                This receipt is an official record of your stay and payments.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-8 pt-0 flex gap-4">
                                        <Button variant="outline" className="flex-1 h-12 rounded-xl border-slate-200 font-bold text-[10px] uppercase tracking-wider text-slate-600 hover:bg-slate-50" onClick={handlePrint}>
                                            Print Receipt
                                        </Button>
                                        <Button onClick={handleViewInvoice} className="flex-1 h-12 rounded-xl bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-wider shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
                                            View Full Receipt
                                        </Button>
                                    </div>
                                    <p className="pb-6 text-center text-[8px] font-bold text-slate-300 uppercase tracking-widest">© 2024 Global Registry Systems • GreenView Node</p>
                                </div>
                            </DialogContent>
                        </Dialog>
                        <Badge variant="outline" className={`${getStatusStyle(booking.status)} px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border shadow-sm`}>
                            {booking.status.replace('_', ' ')}
                        </Badge>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Guest & Housing Intelligence */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Occupant Identity */}
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                                        <UserIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-gray-900 uppercase">Student Information</h2>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Personal & Contact Details</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="rounded-lg h-8 w-8" onClick={() => router.push(`/admin/bookings/${bookingId}/edit`)}>
                                    <Edit3 className="h-3.5 w-3.5 text-gray-400" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="h-9 w-9 rounded-lg bg-gray-50/50 flex items-center justify-center border border-gray-100 shrink-0">
                                            <UserIcon className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1.5">Full Name</p>
                                            <p className="text-sm font-bold text-gray-900">{booking.User.name}</p>
                                            {booking.User.uid && (
                                                <Badge className="mt-2 bg-gray-100 text-gray-600 border-none text-[9px] font-mono font-bold px-2 py-0.5">
                                                    {booking.User.uid}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="h-9 w-9 rounded-lg bg-gray-50/50 flex items-center justify-center border border-gray-100 shrink-0">
                                            <Mail className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1.5">Email</p>
                                            <p className="text-sm font-bold text-gray-900">{booking.User.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="h-9 w-9 rounded-lg bg-gray-50/50 flex items-center justify-center border border-gray-100 shrink-0">
                                            <Phone className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1.5">Phone</p>
                                            <p className="text-sm font-bold text-gray-900">{booking.User.phone || "UNREGISTERED"}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="h-9 w-9 rounded-lg bg-gray-50/50 flex items-center justify-center border border-gray-100 shrink-0">
                                            <FileText className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1.5">CNIC Number</p>
                                            <p className="text-sm font-bold text-gray-900">{booking.User.cnic || "PENDING"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="h-9 w-9 rounded-lg bg-gray-50/50 flex items-center justify-center border border-gray-100 shrink-0">
                                            <MapPin className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1.5">Permanent Address</p>
                                            <p className="text-sm font-bold text-gray-900 truncate max-w-[200px]">{booking.User.ResidentProfile?.address || "NOT PROVIDED"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50">
                                        <ShieldCheck className="h-4 w-4 text-emerald-500 mt-0.5" />
                                        <div>
                                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Authenticated</p>
                                            <p className="text-[10px] font-bold text-emerald-700/70">Verified Registry Member</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Housing Asset Analytics */}
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden p-8">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                                    <Building className="h-5 w-5 text-gray-400" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-gray-900 uppercase">Room Details</h2>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hostel and room information</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100 hover:border-blue-200 transition-all cursor-pointer">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Asset Property</p>
                                    <p className="text-sm font-bold text-gray-900 uppercase truncate">{booking.Room.Hostel.name}</p>
                                    <div className="mt-3 flex items-center gap-2">
                                        <Badge variant="outline" className="text-[8px] font-bold border-gray-200 text-gray-400 bg-white">PREMIUM NODE</Badge>
                                    </div>
                                </div>
                                <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100 hover:border-blue-200 transition-all cursor-pointer" onClick={() => router.push(`/admin/hostels/${booking.Room.Hostel.id}/room-details/room/${booking.Room.id}`)}>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Room</p>
                                    <p className="text-sm font-bold text-gray-900 uppercase">Room {booking.Room.roomNumber}</p>
                                    <p className="text-[10px] font-medium text-gray-400 mt-1 uppercase tracking-wider">{booking.Room.type}</p>
                                </div>
                                <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100 hover:border-blue-200 transition-all cursor-pointer">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Room Status</p>
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <p className="text-sm font-bold text-emerald-600 uppercase">Operational</p>
                                    </div>
                                    <div className="mt-4 flex items-center gap-1.5 text-[9px] font-bold text-blue-600 uppercase tracking-widest group cursor-pointer" onClick={() => router.push(`/admin/hostels/${booking.Room.Hostel.id}/room-details/room/${booking.Room.id}`)}>
                                        Inspect Room <ArrowUpRight className="h-2.5 w-2.5" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-gray-50">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Room Services</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {[
                                        { icon: Shirt, label: 'Laundry', sub: `${booking.Room.LaundryLog?.length || 0} cycles`, color: 'text-purple-500', bg: 'bg-purple-50', link: `/admin/hostels/${booking.Room.Hostel.id}/room-details/room/${booking.Room.id}/laundry?hostelId=${booking.Room.Hostel.id}` },
                                        { icon: Wrench, label: 'Maintenance', sub: `${booking.Room.maintanance?.length || 0} tracks`, color: 'text-amber-500', bg: 'bg-amber-50', link: `/admin/hostels/${booking.Room.Hostel.id}/room-details/room/${booking.Room.id}/maintenance?hostelId=${booking.Room.Hostel.id}` },
                                        { icon: Sparkle, label: 'Cleaning Status', sub: `${booking.Room.CleaningLog?.length || 0} records`, color: 'text-blue-500', bg: 'bg-blue-50', link: `/admin/hostels/${booking.Room.Hostel.id}/room-details/room/${booking.Room.id}/cleaning?hostelId=${booking.Room.Hostel.id}` }
                                    ].map((tool, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-gray-50/50 border border-gray-100 rounded-xl p-3.5 hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer group" onClick={() => router.push(tool.link)}>
                                            <div className={`h-8 w-8 rounded-lg ${tool.bg} flex items-center justify-center`}>
                                                <tool.icon className={`h-4 w-4 ${tool.color}`} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-bold text-gray-900 uppercase tracking-tight">{tool.label}</span>
                                                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{tool.sub}</span>
                                            </div>
                                            <ChevronRight className="h-3 w-3 text-gray-300 ml-auto group-hover:translate-x-0.5 transition-transform" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Fiscal Ledger & Actions */}
                    <div className="space-y-8">
                        {/* Financial Ledger Hub */}
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                                        <DollarSign className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <h2 className="text-base font-bold text-gray-900 uppercase italic">Payment Information</h2>
                                </div>
                                <Button variant="outline" className="h-8 px-4 rounded-lg bg-gray-50 border-gray-100 text-[9px] font-bold uppercase tracking-widest" onClick={() => router.push(`/admin/bookings/${bookingId}/payments`)}>
                                    View All
                                </Button>
                            </div>

                            <div className="space-y-5">
                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                    <span className="text-gray-400">Total Fees</span>
                                    <span className="text-gray-900 font-black">PKR {(booking.totalAmount + (booking.securityDeposit || 0)).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                    <span className="text-gray-400">Total Paid</span>
                                    <span className="text-emerald-600 font-black">PKR {totalPaid.toLocaleString()}</span>
                                </div>
                                <div className="h-px bg-gray-50 my-2" />
                                <div className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Remaining Balance</p>
                                            <p className="text-2xl font-black text-rose-500 tracking-tight italic">PKR {balance.toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-1.5">{paymentProgress}% Verified</p>
                                            <div className="w-24 h-1.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                                <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${paymentProgress}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Lifecycle Control Matrix */}
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden p-8 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                                    <Hash className="h-5 w-5 text-gray-400" />
                                </div>
                                <h2 className="text-base font-bold text-gray-900 uppercase">Manage Status</h2>
                            </div>

                            <div className="space-y-2">
                                {booking.status === 'PENDING' && (
                                    <Button className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] uppercase tracking-widest shadow-sm active:scale-95 transition-all" onClick={() => handleStatusUpdate('CONFIRMED')}>
                                        Confirm Booking
                                    </Button>
                                )}
                                {booking.status === 'CONFIRMED' && (
                                    <Button className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] uppercase tracking-widest shadow-sm active:scale-95" onClick={() => handleStatusUpdate('CHECKED_IN')}>
                                        Mark as Arrived
                                    </Button>
                                )}
                                {booking.status === 'CHECKED_IN' && (
                                    <Button className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] uppercase tracking-widest shadow-sm active:scale-95" onClick={() => handleStatusUpdate('CHECKED_OUT')}>
                                        Check-Out
                                    </Button>
                                )}
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <Button variant="outline" className="h-11 rounded-xl border-gray-100 font-bold text-[10px] uppercase tracking-widest text-gray-500 hover:bg-gray-50" onClick={() => router.push(`/admin/bookings/${bookingId}/payments`)}>
                                        View Payments
                                    </Button>
                                    <Button variant="outline" className="h-11 rounded-xl border-red-50 text-red-500 hover:bg-red-50 font-bold text-[10px] uppercase tracking-widest" onClick={() => handleStatusUpdate('CANCELLED')} disabled={booking.status === 'CANCELLED' || booking.status === 'CHECKED_OUT'}>
                                        Cancel Booking
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


            </main>
        </div>
    );
};

export default BookingDetailsPage;
