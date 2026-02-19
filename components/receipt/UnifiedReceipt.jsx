"use client";
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
    FileText,
    Badge,
    ShieldCheck,
    Calendar,
    Hash,
    Receipt,
    ExternalLink,
    Building2,
    User,
    Wallet,
    Info,
    CheckCircle2,
    CreditCard
} from 'lucide-react';
import { format } from "date-fns";
import { toast } from "sonner";

/**
 * UnifiedReceipt Component
 * -----------------------
 * A standardized, compact, and premium receipt UI for:
 * - Bookings
 * - Payments
 * - Salaries (Employees)
 * - Expenses
 * 
 * @param {Object} data - The raw model data
 * @param {string} type - one of: 'booking', 'payment', 'salary', 'expense'
 * @param {ReactNode} children - Trigger element
 */
const UnifiedReceipt = ({ data, type, children }) => {
    if (!data) return null;

    // 1. Data Mapping Logic
    const getReceiptData = () => {
        let mapped = {
            title: "Official Receipt",
            id: "",
            date: new Date(),
            status: "N/A",
            brand: "GreenView Hostels",
            customerName: "N/A",
            customerDetail: "",
            contextLabel: "Property",
            contextValue: "N/A",
            items: [],
            totalLabel: "Grand Total",
            totalAmount: 0,
            footerNote: "This is a system-generated electronic receipt.",
            colorClass: "bg-indigo-600",
            icon: Receipt
        };

        const safeFormat = (date) => date ? format(new Date(date), 'MMM dd, yyyy') : 'N/A';

        switch (type) {
            case 'booking':
                mapped.title = "Booking Agreement";
                mapped.id = `BKG-${data.id?.slice(-8).toUpperCase()}`;
                mapped.date = data.createdAt;
                mapped.status = data.status;
                mapped.customerName = data.User?.name;
                mapped.customerDetail = data.User?.email;
                mapped.contextLabel = "Allocation";
                mapped.contextValue = `${data.Room?.Hostel?.name} - Room ${data.Room?.roomNumber}`;
                mapped.items = [
                    { label: "Monthly Rent", value: data.totalAmount },
                    { label: "Security Deposit (Refundable)", value: data.securityDeposit || 0 }
                ];
                mapped.totalAmount = (Number(data.totalAmount) || 0) + (Number(data.securityDeposit) || 0);
                mapped.colorClass = "bg-indigo-600";
                mapped.icon = FileText;
                break;

            case 'payment':
                mapped.title = "Payment Receipt";
                mapped.id = `TXN-${data.id?.slice(-8).toUpperCase()}`;
                mapped.date = data.date || data.createdAt;
                mapped.status = data.status;
                mapped.customerName = data.User?.name || data.Booking?.User?.name;
                mapped.customerDetail = data.User?.email || data.Booking?.User?.email;
                mapped.contextLabel = "Reference";
                mapped.contextValue = `${data.Booking?.Room?.Hostel?.name || 'Service Payment'}`;
                mapped.items = [
                    { label: `${data.type?.replace('_', ' ')} Settlement`, value: data.amount }
                ];
                mapped.totalLabel = "Amount Paid";
                mapped.totalAmount = data.amount;
                mapped.colorClass = "bg-emerald-600";
                mapped.icon = CreditCard;
                break;

            case 'salary':
                mapped.title = "Salary Pay Slip";
                mapped.id = `SLR-${data.id?.slice(-8).toUpperCase()}`;
                mapped.date = data.month;
                mapped.status = data.status || 'PAID';
                mapped.customerName = data.StaffProfile?.User?.name;
                mapped.customerDetail = `${data.StaffProfile?.designation} - ${data.StaffProfile?.User?.email}`;
                mapped.contextLabel = "Organization";
                mapped.contextValue = data.StaffProfile?.User?.Hostel_User_hostelIdToHostel?.name || "GreenView Networks";
                mapped.items = [
                    { label: "Basic Retainer", value: data.basicSalary },
                    { label: "Allowances & Perks", value: data.allowances || 0 },
                    { label: "Performance Bonus", value: data.bonuses || 0 },
                    { label: "Operational Deductions", value: -(data.deductions || 0) }
                ];
                mapped.totalLabel = "Net Disbursement";
                mapped.totalAmount = data.amount;
                mapped.colorClass = "bg-blue-600";
                mapped.icon = Wallet;
                break;
            case 'expense':
                mapped.title = "Expense Voucher";
                mapped.id = `EXP-${data.id?.slice(-8).toUpperCase()}`;
                mapped.date = data.date;
                mapped.status = data.status;
                mapped.customerName = data.Hostel?.name;
                mapped.customerDetail = data.category;
                mapped.contextLabel = "Submitted By";
                mapped.contextValue = data.User_Expense_submittedByIdToUser?.name || "Administrator";
                mapped.items = [
                    { label: data.title, value: data.amount }
                ];
                mapped.totalAmount = data.amount;
                mapped.colorClass = "bg-slate-800";
                mapped.icon = Receipt;
                break;
        }

        return mapped;
    };

    const rd = getReceiptData();

    // 2. HTML Generation for External View/Print
    const generateHTML = () => {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${rd.title} - ${rd.id}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap');
                    body { font-family: 'Outfit', sans-serif; padding: 40px; color: #1e293b; background: #f8fafc; margin: 0; }
                    .receipt { max-width: 450px; margin: 0 auto; background: white; padding: 40px; border-radius: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.05); }
                    .header { text-align: center; border-bottom: 2px dashed #f1f5f9; padding-bottom: 24px; margin-bottom: 24px; }
                    .brand { font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 4px; }
                    .title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }
                    .meta { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-top: 8px; font-mono: true; }
                    
                    .section { margin-bottom: 24px; }
                    .label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; margin-bottom: 4px; }
                    .value { font-size: 13px; font-weight: 700; color: #1e293b; }
                    
                    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                    
                    .items-table { width: 100%; border-collapse: collapse; margin: 24px 0; }
                    .item-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f8fafc; }
                    .item-label { font-size: 12px; font-weight: 600; color: #64748b; }
                    .item-value { font-size: 12px; font-weight: 700; color: #1e293b; }
                    
                    .total-box { background: #f8fafc; border-radius: 16px; padding: 20px; text-align: center; margin-top: 24px; border: 1px solid #f1f5f9; }
                    .total-label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #94a3b8; }
                    .total-amount { font-size: 24px; font-weight: 800; color: #0f172a; margin-top: 4px; }
                    
                    .footer { text-align: center; font-size: 10px; color: #cbd5e1; font-weight: 700; text-transform: uppercase; margin-top: 40px; }
                    .status { display: inline-block; padding: 4px 12px; border-radius: 99px; background: #f1f5f9; font-size: 10px; font-weight: 800; margin-top: 12px; color: #64748b; }
                    @media print { body { padding: 0; background: white; } .receipt { border: none; box-shadow: none; max-width: 100%; } .no-print { display: none; } }
                    .print-btn { position: fixed; bottom: 30px; left: 50%; translate: -50% 0; background: #000; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 800; cursor: pointer; font-size: 11px; text-transform: uppercase; box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
                </style>
            </head>
            <body>
                <button class="print-btn no-print" onclick="window.print()">Print Receipt</button>
                <div class="receipt">
                    <div class="header">
                        <div class="brand">${rd.brand}</div>
                        <h1 class="title">${rd.title}</h1>
                        <div class="meta">${rd.id} • ${format(new Date(rd.date), 'MMM dd, yyyy')}</div>
                        <div class="status">${rd.status}</div>
                    </div>

                    <div class="grid section">
                        <div>
                            <div class="label">Entity / User</div>
                            <div class="value">${rd.customerName}</div>
                            <div style="font-size: 10px; color: #94a3b8;">${rd.customerDetail}</div>
                        </div>
                        <div style="text-align: right;">
                            <div class="label">${rd.contextLabel}</div>
                            <div class="value">${rd.contextValue}</div>
                        </div>
                    </div>

                    <div style="border-top: 1px solid #f1f5f9; padding-top: 16px;">
                        <div class="label">Summary Details</div>
                        <div class="items-table">
                            ${rd.items.map(item => `
                                <div class="item-row">
                                    <span class="item-label">${item.label}</span>
                                    <span class="item-value">PKR ${Number(item.value).toLocaleString()}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="total-box">
                        <div class="total-label">${rd.totalLabel}</div>
                        <div class="total-amount">PKR ${Number(rd.totalAmount).toLocaleString()}</div>
                    </div>

                    <div class="footer">
                        <p>${rd.footerNote}</p>
                        <p>Verified Digital Ledger Record</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    };

    const handleAction = (actionType) => {
        const win = window.open('', '_blank', 'width=500,height=800');
        win.document.write(generateHTML());
        win.document.close();
        if (actionType === 'print') {
            win.onload = () => win.print();
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="ghost" className="h-9 w-9 p-0 rounded-xl hover:bg-slate-100 text-slate-500">
                        <Receipt className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-[400px] p-0 overflow-hidden border-none shadow-2xl rounded-[2rem] bg-white font-sans">
                <DialogHeader className="p-0">
                    <div className={`${rd.colorClass} p-8 text-white relative overflow-hidden`}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                        <div className="flex justify-between items-start relative z-10">
                            <div className="flex flex-col gap-3">
                                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/10">
                                    <rd.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <DialogTitle className="text-lg font-bold uppercase tracking-tight text-white">{rd.title}</DialogTitle>
                                    <DialogDescription className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em] mt-0.5">{rd.id}</DialogDescription>
                                </div>
                            </div>
                            <Badge className="bg-white/20 text-white border-none text-[8px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                                {rd.status}
                            </Badge>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-8 space-y-6">
                    {/* Compact Identity Info */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{type === 'expense' ? 'Entity' : 'Recipient'}</span>
                            <p className="text-xs font-bold text-slate-900 truncate">{rd.customerName}</p>
                            <p className="text-[9px] font-medium text-slate-400 truncate">{rd.customerDetail}</p>
                        </div>
                        <div className="space-y-1 text-right">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{rd.contextLabel}</span>
                            <p className="text-xs font-bold text-slate-900 truncate">{rd.contextValue}</p>
                            <p className="text-[9px] font-medium text-slate-400 uppercase">{format(new Date(rd.date), 'MMM dd, yyyy')}</p>
                        </div>
                    </div>

                    {/* Minimalist Fee Ledger */}
                    <div className="space-y-3 pt-2">
                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">Transaction Ledger</span>
                        <div className="space-y-2">
                            {rd.items.map((item, i) => (
                                <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-none">
                                    <span className="text-xs font-semibold text-slate-500">{item.label}</span>
                                    <span className="text-xs font-bold text-slate-900">PKR {Number(item.value).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bold Total Section */}
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col items-center justify-center gap-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{rd.totalLabel}</span>
                        <div className="text-2xl font-black text-slate-900 tracking-tighter">
                            PKR {Number(rd.totalAmount).toLocaleString()}
                        </div>
                    </div>

                    {/* Secondary Note */}
                    <div className="flex items-start gap-3 text-slate-400 bg-slate-50/50 p-4 rounded-xl">
                        <Info className="h-4 w-4 shrink-0 mt-0.5" />
                        <p className="text-[9px] leading-relaxed font-medium">
                            {rd.footerNote} This document serves as a verified confirmation of the transaction described above.
                        </p>
                    </div>
                </div>

                <DialogFooter className="p-8 pt-0">
                    <div className="grid grid-cols-2 gap-3 w-full">
                        <Button
                            variant="outline"
                            onClick={() => handleAction('view')}
                            className="h-11 rounded-xl border-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-all font-sans"
                        >
                            <ExternalLink className="h-3.5 w-3.5 mr-2 text-slate-400" /> View Large
                        </Button>
                        <Button
                            onClick={() => handleAction('print')}
                            className={`${rd.colorClass} h-11 rounded-xl text-white text-[10px] font-bold uppercase tracking-wider shadow-lg transition-all active:scale-95 font-sans border-none hover:opacity-90`}
                        >
                            <Printer className="h-3.5 w-3.5 mr-2 text-white" /> Download
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default UnifiedReceipt;
