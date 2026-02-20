"use client";
import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Loader2,
    LogOut,
    AlertCircle,
    Wallet,
    TrendingDown,
    ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { BookingQueryKeys } from "@/hooks/useBooking";
import { PaymentQueryKeys } from "@/hooks/usePayment";

export default function CheckoutModal({ booking, wardenId, children, onComplete }) {
    const [open, setOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [refundSecurity, setRefundSecurity] = useState(true);
    const queryClient = useQueryClient();

    const securityAmount = booking?.securityDeposit || 0;

    const handleCheckout = async () => {
        setIsPending(true);
        try {
            // 1. Update Booking Status to CHECKED_OUT
            const statusResponse = await fetch('/api/bookings/status', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: booking.id, status: 'CHECKED_OUT' })
            });
            const statusData = await statusResponse.json();
            if (!statusData.success) throw new Error(statusData.error || "Failed to update status");

            // 2. Process Security Refund & Expense if requested
            if (refundSecurity && securityAmount > 0) {
                // A. Process Payment Refund record
                const refundResponse = await fetch('/api/payments/security-refund', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        bookingId: booking.id,
                        amount: securityAmount,
                        notes: `[AUTO_CHECKOUT_REFUND] Security returned during checkout.`
                    })
                });
                const refundData = await refundResponse.json();
                if (!refundData.success) throw new Error(refundData.error || "Failed to process security refund record");

                // B. Create Expense Record
                const expenseResponse = await fetch('/api/expenses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        hostelId: booking.Room?.hostelId,
                        title: `Security Refund: ${booking.User?.name}`,
                        description: `Automatic refund of security deposit during checkout for room ${booking.Room?.roomNumber}.`,
                        amount: securityAmount,
                        category: 'OTHER',
                        status: 'PAID',
                        submittedById: wardenId,
                        date: new Date()
                    })
                });
                const expenseData = await expenseResponse.json();
                if (!expenseData.success) throw new Error(expenseData.error || "Failed to record refund as expense");
            }

            toast.success("Guest Checked Out", {
                description: refundSecurity && securityAmount > 0
                    ? `Status updated and security PKR ${securityAmount.toLocaleString()} recorded as expense.`
                    : "Resident status updated to Checked Out."
            });

            // Invalidate Queries
            queryClient.invalidateQueries({ queryKey: BookingQueryKeys.all() });
            queryClient.invalidateQueries({ queryKey: PaymentQueryKeys.all() });

            setOpen(false);
            if (onComplete) onComplete();

        } catch (error) {
            toast.error("Checkout Protocol Failed", {
                description: error.message
            });
        } finally {
            setIsPending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-[420px] p-0 border-0 shadow-2xl rounded-[1.5rem] bg-white overflow-hidden">
                <DialogHeader className="p-8 bg-slate-900 text-white flex flex-row items-center gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-full bg-white/[0.05] skew-x-[30deg] translate-x-10" />
                    <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md shrink-0 border border-white/20">
                        <LogOut className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex flex-col text-left">
                        <DialogTitle className="text-lg font-bold uppercase tracking-tight">
                            Confirm Checkout
                        </DialogTitle>
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">Finalizing Residency</p>
                    </div>
                </DialogHeader>

                <div className="p-8 space-y-6">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-sm font-bold text-slate-900 uppercase">{booking?.User?.name}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Room {booking?.Room?.roomNumber} • {booking?.Room?.Hostel?.name}</p>
                    </div>

                    {securityAmount > 0 ? (
                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                                    <Wallet className="h-5 w-5 text-amber-600" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-amber-900 uppercase">Held Security Deposit</span>
                                    <span className="text-xl font-black text-amber-600 tracking-tighter">PKR {securityAmount.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 p-3 bg-white rounded-xl border border-amber-200">
                                <Checkbox
                                    id="refund"
                                    checked={refundSecurity}
                                    onCheckedChange={setRefundSecurity}
                                    className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                                />
                                <div className="grid gap-1 leading-none">
                                    <label htmlFor="refund" className="text-[11px] font-bold text-slate-900 uppercase cursor-pointer">
                                        Refund Security Deposit
                                    </label>
                                    <p className="text-[9px] font-medium text-slate-400 uppercase leading-none">
                                        Mark as returned & record as expense
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex items-center gap-4">
                            <ShieldCheck className="h-5 w-5 text-slate-400" />
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                                No security deposit found for this booking.
                            </p>
                        </div>
                    )}

                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] font-medium text-rose-900 leading-relaxed uppercase">
                            Checking out will release the room for new bookings. This action cannot be undone.
                        </p>
                    </div>

                    <DialogFooter className="flex-col sm:flex-col gap-3">
                        <Button
                            onClick={handleCheckout}
                            disabled={isPending}
                            className="w-full h-12 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            {isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin text-white" />
                            ) : (
                                <>
                                    <LogOut className="h-4 w-4" />
                                    Complete Checkout
                                </>
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            disabled={isPending}
                            className="w-full h-10 rounded-xl font-bold text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900"
                        >
                            Cancel
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
