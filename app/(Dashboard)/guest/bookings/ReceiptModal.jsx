"use client"
import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Printer,
    Download,
    User,
    Building,
    MapPin,
    FileText,
    ShieldCheck,
    Zap,
    ExternalLink,
    Clock,
    Hash,
    Calendar,
    Info,
    Mail,
    Bed,
    Wallet,
    Scale,
    Receipt
} from 'lucide-react';
import { format } from "date-fns";
import { toast } from "sonner";

const ReceiptModal = ({ children, booking }) => {
    const totalPaid = booking.Payment?.filter(p => p.status === 'PAID').reduce((acc, curr) => acc + curr.amount, 0) || 0;
    const isAdvancePaid = totalPaid >= (booking.totalAmount || 0);

    const generateReceiptHTML = () => {
        const room = booking.Room || {};
        const hostel = room.Hostel || {};
        const user = booking.User || {};

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Agreement Summary - ${booking.id?.toUpperCase().slice(-8) || 'N/A'}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
                    body { font-family: 'Outfit', sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; background-color: #fcfdfe; }
                    .container { max-width: 800px; margin: 0 auto; border: 1px solid #f1f5f9; padding: 50px; border-radius: 30px; background: white; box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.05); }
                    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #f8fafc; padding-bottom: 30px; margin-bottom: 40px; align-items: flex-start; }
                    .brand h1 { margin: 0; font-size: 24px; font-weight: 800; color: #4f46e5; letter-spacing: -0.02em; }
                    .brand p { margin: 5px 0 0 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 800; }
                    .invoice-meta { text-align: right; }
                    .invoice-meta h2 { margin: 0; font-size: 14px; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.1em; }
                    .invoice-meta p { margin: 4px 0 0 0; font-size: 10px; color: #cbd5e1; font-weight: 700; text-transform: uppercase; }
                    
                    .summary-card { background: #f8fafc; border-radius: 20px; padding: 30px; border: 1px solid #f1f5f9; margin-bottom: 40px; }
                    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
                    .label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.1em; margin-bottom: 8px; }
                    .value { font-size: 15px; font-weight: 700; color: #1e293b; }
                    
                    .terms-block { border-top: 2px solid #f8fafc; padding-top: 30px; margin-bottom: 40px; }
                    .term-row { display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid #f8fafc; align-items: center; }
                    .term-row:last-child { border-bottom: none; }
                    .term-label { font-size: 13px; font-weight: 600; color: #64748b; }
                    .term-value { font-size: 14px; font-weight: 800; color: #000; }
                    
                    .status-badge { display: inline-flex; align-items: center; padding: 6px 16px; border-radius: 99px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
                    .status-paid { background: #10b981; color: #fff; }
                    .status-pending { background: #f59e0b; color: #fff; }
                    
                    .footer { text-align: center; margin-top: 60px; padding-top: 30px; border-top: 2px solid #f8fafc; }
                    .footer p { font-size: 10px; color: #cbd5e1; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; }
                    @media print { .no-print { display: none; } body { padding: 0; background: white; } .container { border: none; padding: 0; box-shadow: none; } }
                    .print-button { position: fixed; bottom: 30px; right: 30px; background: #000; color: #fff; border: none; padding: 15px 30px; border-radius: 12px; font-weight: 800; cursor: pointer; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
                </style>
            </head>
            <body>
                <button class="print-button no-print" onclick="window.print()">Download / Print Receipt</button>
                <div class="container">
                    <div class="header">
                        <div class="brand">
                            <h1>GreenView Hostel</h1>
                            <p>Agreement Details</p>
                        </div>
                        <div class="invoice-meta">
                            <h2>Official Record</h2>
                            <p>Booking ID: ${booking.id?.toUpperCase().slice(-8) || 'N/A'}</p>
                            <p>ISSUED: ${format(new Date(), 'MMM dd, yyyy')}</p>
                        </div>
                    </div>
                    
                    <div class="summary-card">
                        <div class="grid">
                            <div>
                                <div class="label">Resident Name</div>
                                <div class="value">${user.name || 'N/A'}</div>
                                <div style="font-size: 12px; color: #64748b; margin-top: 2px;">${user.email || ''}</div>
                            </div>
                            <div style="text-align: right;">
                                <div class="label">Hostel Name</div>
                                <div class="value">${hostel.name || 'N/A'}</div>
                                <div style="font-size: 12px; color: #4338ca; font-weight: 700; margin-top: 2px;">Room ${room.roomNumber || 'N/A'}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="terms-block">
                        <div class="label" style="margin-bottom: 16px;">Fee details</div>
                        <div class="term-row">
                            <span class="term-label">Monthly Rent</span>
                            <span class="term-value">PKR ${Number(booking.totalAmount || 0).toLocaleString()}</span>
                        </div>
                        <div class="term-row">
                            <span class="term-label">Security Deposit (Refundable)</span>
                            <span class="term-value">PKR ${Number(booking.securityDeposit || 0).toLocaleString()}</span>
                        </div>
                        <div class="term-row" style="background: #f8fafc; padding: 16px; border-radius: 12px; margin-top: 10px;">
                            <span class="term-label" style="font-weight: 600; color: #1e293b;">1st Month Advance Payment</span>
                            <span class="status-badge ${isAdvancePaid ? 'status-paid' : 'status-pending'}">
                                ${isAdvancePaid ? 'Paid' : 'Not Paid'}
                            </span>
                        </div>
                    </div>
                    
                    <div class="terms-block" style="border-top: none; padding-top: 0;">
                        <div class="label" style="margin-bottom: 16px;">Booking Dates</div>
                        <div class="grid">
                            <div>
                                <div class="label">Check-In Date</div>
                                <div class="value">${booking.startDate ? format(new Date(booking.startDate), 'MMM dd, yyyy') : 'N/A'}</div>
                            </div>
                            <div style="text-align: right;">
                                <div class="label">End Date</div>
                                <div class="value">${booking.endDate ? format(new Date(booking.endDate), 'MMM dd, yyyy') : 'Ongoing'}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>This document serves as an official summary of your stay at GreenView Hostel.</p>
                        <p>Digitally Verified Payment Record</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    };

    const handlePrint = () => {
        window.print();
    };

    const handleViewInvoice = () => {
        const receiptWindow = window.open('', '_blank', 'width=850,height=900');
        receiptWindow.document.write(generateReceiptHTML());
        receiptWindow.document.close();
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="ghost" className="h-10 w-10 p-0 rounded-full hover:bg-slate-100 text-slate-500">
                        <Receipt className="h-5 w-5" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-[460px] p-0 overflow-hidden border-none shadow-xl rounded-2xl bg-white">
                <DialogHeader className="p-0">
                    <div className="print:hidden bg-slate-50 border-b border-slate-100 p-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm shadow-indigo-100">
                                <FileText className="h-5 w-5 text-white" />
                            </div>
                            <div className="text-left">
                                <DialogTitle className="text-base font-bold text-slate-900 uppercase">My Agreement</DialogTitle>
                                <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Official stay record</DialogDescription>
                            </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${booking.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                            {booking.status}
                        </div>
                    </div>
                </DialogHeader>

                <div className="print:hidden flex-1 overflow-y-auto max-h-[75vh] p-6 space-y-6">
                    {/* Compact Term Card */}
                    <div className="bg-indigo-600 rounded-2xl p-6 shadow-xl shadow-indigo-100 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-xl" />
                        <div className="flex justify-between items-start relative z-10">
                            <div className="text-left">
                                <span className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest">Monthly Rent</span>
                                <h1 className="text-2xl font-bold text-white mt-1">PKR {Number(booking.totalAmount || 0).toLocaleString()}</h1>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest">Security</span>
                                <p className="text-lg font-bold text-emerald-300 mt-1">PKR {Number(booking.securityDeposit || 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Advance Status Banner */}
                    <div className={`rounded-xl p-4 flex items-center justify-between border ${isAdvancePaid ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                        <div className="flex items-center gap-3">
                            <ShieldCheck className={`h-5 w-5 ${isAdvancePaid ? 'text-emerald-500' : 'text-amber-500'}`} />
                            <span className="text-xs font-bold uppercase tracking-tight">Advance Payment</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider">
                            {isAdvancePaid ? 'PAID' : 'PENDING'}
                        </span>
                    </div>

                    {/* Allocation Node */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                <Building className="h-4 w-4 text-slate-400" />
                            </div>
                            <div className="text-left">
                                <span className="text-[9px] font-bold text-slate-400 uppercase block">Hostel Name</span>
                                <p className="text-xs font-bold text-slate-800 uppercase">{booking.Room?.Hostel?.name || 'Assigned Hostel'}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Room</span>
                            <p className="text-xs font-bold text-slate-900">Room {booking.Room?.roomNumber || 'N/A'}</p>
                        </div>
                    </div>

                    {/* Temporal Dates */}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Start Date</span>
                            <p className="text-[11px] font-medium text-slate-600">
                                {booking.startDate ? format(new Date(booking.startDate), 'MMM dd, yyyy') : 'N/A'}
                            </p>
                        </div>
                        <div className="space-y-1 text-right">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">End Date</span>
                            <p className="text-[11px] font-medium text-slate-600">
                                {booking.endDate ? format(new Date(booking.endDate), 'MMM dd, yyyy') : 'Ongoing'}
                            </p>
                        </div>
                    </div>

                    {/* Footer Policy */}
                    <div className="bg-slate-50/50 p-4 rounded-xl flex items-start gap-3 text-slate-500">
                        <Info className="h-4 w-4 mt-0.5 shrink-0 text-slate-400" />
                        <p className="text-[10px] leading-relaxed">
                            This document is an official record of your stay at our hostel. Please follow all hostel rules and regulations.
                        </p>
                    </div>
                </div>

                <DialogFooter className="p-6 pt-2 print:hidden">
                    <div className="grid grid-cols-2 gap-3 w-full">
                        <Button
                            variant="outline"
                            onClick={handleViewInvoice}
                            className="h-11 rounded-xl border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 hover:border-indigo-600 transition-all"
                        >
                            <ExternalLink className="h-3.5 w-3.5 mr-2" /> View Details
                        </Button>
                        <Button
                            onClick={handlePrint}
                            className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-indigo-100 active:scale-95 transition-all"
                        >
                            <Printer className="h-3.5 w-3.5 mr-2 text-white" /> Download Receipt
                        </Button>
                    </div>
                </DialogFooter>

                {/* Printable Receipt Block */}
                <div className="hidden print:block p-8 bg-white text-black font-sans w-full max-w-3xl mx-auto absolute top-0 left-0 bg-white">
                    {/* Header */}
                    <div className="border-b-2 border-black pb-6 mb-6 flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-tight text-indigo-600">GreenView Hostel</h1>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Agreement Details</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Official Record</p>
                            <p className="text-sm font-bold text-black font-mono">Booking ID: {booking.id?.toUpperCase().slice(-8) || 'N/A'}</p>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Issued</p>
                            <p className="text-sm font-bold text-black">{format(new Date(), 'MMM dd, yyyy')}</p>
                        </div>
                    </div>

                    {/* Resident Details */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-2 mb-3">Resident Name</h3>
                            <p className="font-bold text-black uppercase text-sm">{booking.User?.name || 'N/A'}</p>
                            <p className="text-xs text-gray-600 mt-1">{booking.User?.email || ''}</p>
                        </div>
                        <div className="text-right">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-2 mb-3">Hostel Name</h3>
                            <p className="font-bold text-black uppercase text-sm">{booking.Room?.Hostel?.name || 'N/A'}</p>
                            <p className="text-xs text-indigo-600 font-bold mt-1">Room {booking.Room?.roomNumber || 'N/A'}</p>
                        </div>
                    </div>

                    {/* Fee Details */}
                    <div className="mb-8">
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-2 mb-3">Fee details</h3>
                        <table className="w-full text-left text-sm mb-4">
                            <tbody>
                                <tr className="border-b border-gray-100">
                                    <td className="py-3 font-medium text-gray-600">Monthly Rent</td>
                                    <td className="py-3 text-right font-bold text-black">PKR {Number(booking.totalAmount || 0).toLocaleString()}</td>
                                </tr>
                                <tr className="border-b border-gray-100">
                                    <td className="py-3 font-medium text-gray-600">Security Deposit (Refundable)</td>
                                    <td className="py-3 text-right font-bold text-black">PKR {Number(booking.securityDeposit || 0).toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td className="py-4 font-black text-black">1st Month Advance Payment</td>
                                    <td className="py-4 text-right font-black uppercase text-black">{isAdvancePaid ? 'Paid' : 'Not Paid'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Booking Dates */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-2 mb-3">Check-In Date</h3>
                            <p className="font-bold text-black text-sm">{booking.startDate ? format(new Date(booking.startDate), 'MMM dd, yyyy') : 'N/A'}</p>
                        </div>
                        <div className="text-right">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-2 mb-3">End Date</h3>
                            <p className="font-bold text-black text-sm">{booking.endDate ? format(new Date(booking.endDate), 'MMM dd, yyyy') : 'Ongoing'}</p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-16 pt-8 border-t border-gray-200 text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">This document serves as an official summary of your stay at GreenView Hostel.</p>
                        <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-1">Digitally Verified Payment Record</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ReceiptModal;
