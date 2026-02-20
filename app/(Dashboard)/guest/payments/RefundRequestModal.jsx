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
import { Textarea } from "@/components/ui/textarea";
import {
    Loader2,
    Undo2,
    AlertCircle,
    CheckCircle2,
    Wallet
} from "lucide-react";
import { toast } from "sonner";
import useAuthStore from "@/hooks/Authstate";

export default function RefundRequestModal({ payment, children }) {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState("");
    const [notes, setNotes] = useState("");
    const [isPending, setIsPending] = useState(false);
    const user = useAuthStore(state => state.user);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!reason || reason.length < 10) {
            toast.error("Please provide a detailed reason (min 10 chars).");
            return;
        }

        setIsPending(true);
        try {
            const response = await fetch('/api/payments/refund', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paymentId: payment.id,
                    userId: user?.id,
                    reason,
                    notes
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Refund Requested", {
                    description: "Your request has been sent for review."
                });
                setOpen(false);
                setReason("");
                setNotes("");
            } else {
                throw new Error(data.error || "Failed to submit request.");
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
                <DialogHeader className="p-6 bg-rose-600 text-white flex flex-row items-center gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-full bg-white/[0.05] skew-x-[30deg] translate-x-10" />
                    <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md shrink-0">
                        <Undo2 className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex flex-col text-left">
                        <DialogTitle className="text-sm font-bold uppercase tracking-widest">
                            Request Refund
                        </DialogTitle>
                        <p className="text-[9px] font-medium text-rose-100 uppercase tracking-widest mt-1">Transaction Reversal Protocol</p>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-rose-900 uppercase">Amount to Refund</p>
                            <p className="text-lg font-black text-rose-600 tracking-tighter">PKR {payment.amount.toLocaleString()}</p>
                            <p className="text-[9px] font-medium text-rose-400 uppercase tracking-wider">Ref: {payment.uid || payment.id.slice(-8)}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Primary Reason</Label>
                            <Textarea
                                className="rounded-xl border-slate-100 bg-slate-50/50 min-h-[80px] font-medium p-3 text-xs resize-none focus:ring-1 focus:ring-rose-600"
                                placeholder="Why are you requesting a refund?"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Evidence/Notes (Optional)</Label>
                            <Textarea
                                className="rounded-xl border-slate-100 bg-slate-50/50 min-h-[60px] font-medium p-3 text-xs resize-none focus:ring-1 focus:ring-rose-600"
                                placeholder="Any additional details..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            {isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin text-white" />
                            ) : (
                                <>
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Submit Request
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
