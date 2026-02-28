"use client";
import React, { useState, useRef, useMemo } from 'react';
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useUpdatePayment } from "@/hooks/usePayment";
import {
    Loader2,
    Send,
    ImageIcon,
    CheckCircle,
    AlertCircle,
    Upload,
    X,
    Wallet,
    CreditCard,
    Bell
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";

export default function PaymentNotificationModal({ booking, children }) {
    const [open, setOpen] = useState(false);
    const fileInputRef = useRef(null);

    // PENDING payments that haven't been notified yet, OR payments that were REJECTED
    const pendingPayments = useMemo(() => {
        return (booking.Payment || []).filter(
            p => (p.status === 'PENDING' && !p.receiptUrl) || p.status === 'REJECTED'
        );
    }, [booking.Payment]);

    // Already submitted (PENDING + has receiptUrl = waiting admin review)
    const submittedPayments = useMemo(() => {
        return (booking.Payment || []).filter(
            p => p.status === 'PENDING' && p.receiptUrl
        );
    }, [booking.Payment]);

    const [selectedPaymentId, setSelectedPaymentId] = useState("");
    const [method, setMethod] = useState("BANK_TRANSFER");
    const [notes, setNotes] = useState("");
    const [receiptUrl, setReceiptUrl] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    const selectedPayment = useMemo(
        () => pendingPayments.find(p => p.id === selectedPaymentId),
        [pendingPayments, selectedPaymentId]
    );

    const { mutate: updatePayment, isPending } = useUpdatePayment();

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File too large. Max 5MB.");
            return;
        }
        setIsUploading(true);
        const toastId = toast.loading("Processing receipt...");
        try {
            const reader = new FileReader();
            reader.onloadend = () => {
                setReceiptUrl(reader.result);
                setIsUploading(false);
                toast.success("Receipt ready", { id: toastId });
            };
            reader.readAsDataURL(file);
        } catch {
            toast.error("Upload failed", { id: toastId });
            setIsUploading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedPaymentId) {
            toast.error("Please select which payment you are notifying about.");
            return;
        }
        if (!receiptUrl) {
            toast.error("Please attach your payment proof (screenshot/receipt).");
            return;
        }

        const finalNotes = notes.trim()
            ? `[GUEST_NOTIFICATION] ${notes.trim()}`
            : "[GUEST_NOTIFICATION]";

        updatePayment(
            {
                id: selectedPaymentId,
                receiptUrl,
                method,
                notes: finalNotes,
                status: 'PENDING', // Send back to pending for re-review
            },
            {
                onSuccess: () => {
                    setOpen(false);
                    setSelectedPaymentId("");
                    setNotes("");
                    setReceiptUrl("");
                    toast.success("Warden Notified! ✅", {
                        description: "Your receipt has been submitted for review."
                    });
                },
                onError: (err) => toast.error(err.message || "Something went wrong.")
            }
        );
    };

    const noPendingDues = pendingPayments.length === 0;

    // If no pending dues at all — either all settled or all already submitted
    if (noPendingDues && !open) {
        const alreadySubmitted = submittedPayments.length > 0;
        return (
            <div
                className="relative group inline-block"
                onClick={() => {
                    toast.info(
                        alreadySubmitted
                            ? "Receipt already submitted — waiting for admin review."
                            : "No pending dues to notify about."
                    );
                }}
            >
                <div className="opacity-50 grayscale pointer-events-none">{children}</div>
            </div>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-[420px] p-0 border-0 shadow-2xl rounded-[1.5rem] bg-white overflow-hidden ring-1 ring-black/[0.05]">

                {/* Header */}
                <DialogHeader className="p-6 bg-slate-900 text-white flex flex-row items-center gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-full bg-white/[0.03] skew-x-[30deg] translate-x-10" />
                    <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                        <Bell className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex flex-col text-left">
                        <DialogTitle className="text-sm font-bold uppercase tracking-widest">
                            Notify Warden
                        </DialogTitle>
                        <DialogDescription className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-1">
                            Confirm you have paid — attach your proof
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {/* Already submitted notice */}
                    {submittedPayments.length > 0 && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-start gap-3">
                            <CheckCircle className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[10px] font-black text-indigo-800 uppercase tracking-tight">
                                    {submittedPayments.length} payment{submittedPayments.length > 1 ? 's' : ''} already under review
                                </p>
                                <p className="text-[9px] text-indigo-500 mt-0.5">You have additional unpaid dues below.</p>
                            </div>
                        </div>
                    )}

                    {/* Rejected Warning Alert */}
                    {selectedPayment && selectedPayment.status === 'REJECTED' && (
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[10px] font-black text-rose-800 uppercase tracking-tight">
                                    Previous notification rejected
                                </p>
                                <p className="text-[9px] text-rose-600 mt-0.5 leading-relaxed font-bold">
                                    Your last receipt for this payment was rejected by the warden. Please upload a clear, valid payment proof to resubmit for review.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Select which pending payment to notify about */}
                    <div className="space-y-1.5">
                        <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                            Which payment did you make? *
                        </Label>
                        <Select value={selectedPaymentId} onValueChange={setSelectedPaymentId}>
                            <SelectTrigger className="h-11 rounded-xl border-slate-100 bg-slate-50/50 font-bold text-[10px] px-3">
                                <SelectValue placeholder="Select a pending due..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl p-1 shadow-2xl border-slate-100">
                                {pendingPayments.map(p => (
                                    <SelectItem key={p.id} value={p.id} className="rounded-lg text-[10px] font-bold py-2.5">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="h-3 w-3 text-slate-400" />
                                            <span>
                                                PKR {Number(p.amount).toLocaleString()} — {p.month || p.type} {p.year || ""}
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Show selected payment details */}
                    {selectedPayment && (
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 grid grid-cols-2 gap-2">
                            <div>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Amount Due</p>
                                <p className="text-sm font-black text-slate-900">PKR {Number(selectedPayment.amount).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Period</p>
                                <p className="text-sm font-black text-slate-900">{selectedPayment.month || selectedPayment.type} {selectedPayment.year || ""}</p>
                            </div>
                        </div>
                    )}

                    {/* Payment Method */}
                    <div className="space-y-1.5">
                        <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Payment Method Used *</Label>
                        <Select value={method} onValueChange={setMethod}>
                            <SelectTrigger className="h-10 rounded-xl border-slate-100 bg-slate-50/50 font-bold text-[10px] px-4">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl p-1 shadow-2xl border-slate-100">
                                <SelectItem value="BANK_TRANSFER" className="rounded-lg text-[10px] font-bold py-2">Bank Transfer</SelectItem>
                                <SelectItem value="EASYPAISA" className="rounded-lg text-[10px] font-bold py-2">EasyPaisa</SelectItem>
                                <SelectItem value="JAZZCASH" className="rounded-lg text-[10px] font-bold py-2">JazzCash</SelectItem>
                                <SelectItem value="CASH" className="rounded-lg text-[10px] font-bold py-2">Cash (Hand-Delivered)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Receipt Upload */}
                    <div className="space-y-1.5">
                        <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                            Attach Payment Proof *
                        </Label>
                        {receiptUrl ? (
                            <div className="relative h-12 flex items-center justify-between px-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-lg bg-white flex items-center justify-center border border-emerald-100">
                                        <ImageIcon className="h-3.5 w-3.5 text-emerald-500" />
                                    </div>
                                    <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-tighter">Receipt Attached ✓</span>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setReceiptUrl("")}
                                    className="h-6 w-6 p-0 text-emerald-900 hover:bg-emerald-100 rounded-lg"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        ) : (
                            <div
                                className={`h-12 border border-dashed rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all ${isUploading ? 'bg-slate-50' : 'hover:bg-slate-50 border-slate-200 hover:border-indigo-400 group'}`}
                                onClick={() => !isUploading && fileInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    className="hidden"
                                    ref={fileInputRef}
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                />
                                {isUploading
                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />
                                    : <Upload className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-500" />
                                }
                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-indigo-600">
                                    {isUploading ? 'Processing...' : 'Upload Screenshot / Receipt'}
                                </span>
                            </div>
                        )}
                        <p className="text-[7px] font-bold text-slate-400 uppercase tracking-[0.2em] px-1 text-center">
                            Screenshot, bank slip, or JazzCash/EasyPaisa confirmation
                        </p>
                    </div>

                    {/* Notes */}
                    <div className="space-y-1.5">
                        <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Additional Note (Optional)</Label>
                        <Textarea
                            className="rounded-xl border-slate-100 bg-slate-50/50 min-h-[60px] font-medium p-3 text-xs resize-none focus:ring-1 focus:ring-indigo-600"
                            placeholder="e.g. Transfer ID: 12345, paid on 1st March"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={isPending || isUploading || !selectedPaymentId || !receiptUrl}
                            className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isPending
                                ? <Loader2 className="h-4 w-4 animate-spin text-white" />
                                : <><Send className="h-3.5 w-3.5" /> Notify Warden Now</>
                            }
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
