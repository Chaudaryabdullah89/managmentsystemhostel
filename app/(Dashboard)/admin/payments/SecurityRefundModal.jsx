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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Loader2,
    ShieldCheck,
    AlertCircle,
    CheckCircle2,
    Wallet,
    Undo2
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { PaymentQueryKeys } from "@/hooks/usePayment";
import { BookingQueryKeys } from "@/hooks/useBooking";

export default function SecurityRefundModal({ booking, children }) {
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState(booking?.securityDeposit || 0);
    const [notes, setNotes] = useState("");
    const [isPending, setIsPending] = useState(false);
    const queryClient = useQueryClient();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (amount <= 0) {
            toast.error("Please enter a valid amount.");
            return;
        }

        if (amount > booking.securityDeposit) {
            toast.error(`Amount exceeds available security deposit (PKR ${booking.securityDeposit}).`);
            return;
        }

        setIsPending(true);
        try {
            const response = await fetch('/api/payments/security-refund', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId: booking.id,
                    amount,
                    notes: `[SECURITY_REFUND] ${notes}`
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Security Refunded", {
                    description: `PKR ${amount.toLocaleString()} has been processed.`
                });
                queryClient.invalidateQueries({ queryKey: PaymentQueryKeys.all() });
                queryClient.invalidateQueries({ queryKey: BookingQueryKeys.all() });
                setOpen(false);
                setNotes("");
            } else {
                throw new Error(data.error || "Failed to process refund.");
            }
        } catch (error) {
            toast.error(error.message);
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
                <DialogHeader className="p-6 bg-amber-500 text-white flex flex-row items-center gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-full bg-white/[0.05] skew-x-[30deg] translate-x-10" />
                    <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md shrink-0">
                        <Wallet className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex flex-col text-left">
                        <DialogTitle className="text-sm font-bold uppercase tracking-widest">
                            Security Refund
                        </DialogTitle>
                        <p className="text-[9px] font-medium text-amber-50 uppercase tracking-widest mt-1">Direct Deposit Reversal</p>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-amber-900 uppercase">Available Security</p>
                            <p className="text-lg font-black text-amber-600 tracking-tighter">PKR {booking?.securityDeposit?.toLocaleString() || 0}</p>
                            <p className="text-[9px] font-medium text-amber-400 uppercase tracking-wider">Booking Ref: {booking?.uid || booking?.id?.slice(-8)}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Refund Amount (PKR)</Label>
                            <Input
                                type="number"
                                className="h-11 rounded-xl border-slate-100 bg-slate-50/50 font-bold text-xs focus:ring-1 focus:ring-amber-500"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                max={booking?.securityDeposit}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Internal Notes</Label>
                            <Textarea
                                className="rounded-xl border-slate-100 bg-slate-50/50 min-h-[80px] font-medium p-3 text-xs resize-none focus:ring-1 focus:ring-amber-500"
                                placeholder="Reason for security refund (e.g. resident checkout)..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={isPending || amount <= 0 || amount > booking.securityDeposit}
                            className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            {isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin text-white" />
                            ) : (
                                <>
                                    <Undo2 className="h-3.5 w-3.5" />
                                    Confirm Security Refund
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
