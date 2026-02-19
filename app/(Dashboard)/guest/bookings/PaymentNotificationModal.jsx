"use client";
import React, { useState, useEffect, useRef } from 'react';
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useCreatePayment } from "@/hooks/usePayment";
import {
    Loader2,
    DollarSign,
    CreditCard,
    Calendar,
    ShieldCheck,
    Send,
    Zap,
    Image as ImageIcon,
    CheckCircle,
    Upload,
    X
} from "lucide-react";
import { toast } from "sonner";

export default function PaymentNotificationModal({ booking, children }) {
    const [open, setOpen] = useState(false);
    const fileInputRef = useRef(null);

    // Financial State
    const totalPaid = booking.Payment?.filter(p => p.status === 'PAID').reduce((acc, curr) => acc + curr.amount, 0) || 0;
    const totalPending = booking.Payment?.filter(p => p.status === 'PENDING').reduce((acc, curr) => acc + curr.amount, 0) || 0;
    const totalDue = booking.totalAmount || 0;
    const remainingBalance = totalDue - totalPaid; // Total amount still owed (verified)
    const netBalance = totalDue - totalPaid - totalPending; // Amount not yet covered by any transaction (submitted or paid)

    const isSettled = remainingBalance <= 0;

    // Form State
    const [amount, setAmount] = useState("");
    const [method, setMethod] = useState("BANK_TRANSFER");
    const [transactionId, setTransactionId] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState("");
    const [receiptUrl, setReceiptUrl] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    // Initialize amount when modal opens
    useEffect(() => {
        if (open) {
            setAmount(netBalance > 0 ? netBalance.toString() : "");
        }
    }, [open, netBalance]);

    const { mutate: createPayment, isPending } = useCreatePayment();

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const toastId = toast.loading("Uploading Photo...");

        try {
            // Mock Upload Logic
            const reader = new FileReader();
            reader.onloadend = () => {
                // In a production app, you would upload to Cloudinary/S3 here
                setReceiptUrl("https://images.unsplash.com/photo-1554224155-169641357599?auto=format");
                setIsUploading(false);
                toast.success("Photo Uploaded!", { id: toastId });
            };
            reader.readAsDataURL(file);
        } catch (error) {
            toast.error("Upload Failed", { id: toastId });
            setIsUploading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const numericAmount = parseFloat(amount);

        if (!numericAmount || numericAmount <= 0) {
            toast.error("Amount required.");
            return;
        }

        if (numericAmount > netBalance) {
            toast.error(`Amount exceeds balance: Max PKR ${netBalance.toLocaleString()}.`);
            return;
        }

        if (!transactionId) {
            toast.error("Transaction ID required.");
            return;
        }

        if (['BANK_TRANSFER', 'EASYPAISA', 'JAZZCASH'].includes(method) && !receiptUrl) {
            toast.error("Please upload proof of payment.");
            return;
        }

        const paymentData = {
            userId: booking.userId,
            bookingId: booking.id,
            amount: numericAmount,
            date: new Date(date),
            method,
            transactionId,
            notes,
            receiptUrl: receiptUrl || null,
            status: "PENDING",
            type: "RENT"
        };

        createPayment(paymentData, {
            onSuccess: () => {
                setOpen(false);
                setNotes("");
                setTransactionId("");
                setReceiptUrl("");
                toast.success("Warden Notified Successfully.");
            },
            onError: (error) => {
                toast.error(error.message || "Failed to send payment.");
            }
        });
    };

    const handleSettledClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toast.info("You already have paid! Wait until next pay cycle.", {
            description: "All payments are up to date for this period.",
            icon: <CheckCircle className="h-4 w-4 text-emerald-500" />
        });
    };

    if (isSettled && !open) {
        return (
            <div className="relative group cursor-pointer" onClick={handleSettledClick}>
                <div className="pointer-events-none opacity-50 grayscale transition-all duration-500">
                    {children}
                </div>
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-xl">
                    Account Settled • Next month required
                </div>
            </div>
        );
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (isSettled && val) {
                toast.info("All clear! No balance left.");
                return;
            }
            setOpen(val);
        }}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-white">
                <DialogHeader className="p-8 bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100">
                            <Zap className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-left">
                            <DialogTitle className="text-lg font-bold text-slate-900 leading-none uppercase">Notify Warden</DialogTitle>
                            <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1.5">Alert management about your payment</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* Financial Summary Snippet */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="h-5 w-5 text-indigo-600 transition-transform group-hover:scale-110" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Remaining Balance</span>
                        </div>
                        <span className="text-sm font-bold text-slate-900 tracking-tighter">PKR {netBalance.toLocaleString()}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Amount to Pay</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    type="number"
                                    className="h-12 pl-10 rounded-xl border-slate-100 bg-slate-50/50 font-bold focus:ring-indigo-600"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Payment Date</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    type="date"
                                    className="h-12 pl-10 rounded-xl border-slate-100 bg-slate-50/50 font-bold"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Payment Method</Label>
                        <Select value={method} onValueChange={setMethod}>
                            <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-bold uppercase text-[10px] tracking-widest">
                                <SelectValue placeholder="Select Method" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl p-1 shadow-2xl border-slate-100">
                                <SelectItem value="BANK_TRANSFER" className="rounded-xl text-[10px] uppercase font-bold tracking-widest py-3">Bank Transfer</SelectItem>
                                <SelectItem value="EASYPAISA" className="rounded-xl text-[10px] uppercase font-bold tracking-widest py-3">EasyPaisa</SelectItem>
                                <SelectItem value="JAZZCASH" className="rounded-xl text-[10px] uppercase font-bold tracking-widest py-3">JazzCash</SelectItem>
                                <SelectItem value="CASH" className="rounded-xl text-[10px] uppercase font-bold tracking-widest py-3">Manual Cash</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Transaction ID</Label>
                        <div className="relative">
                            <CheckCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                className="h-12 pl-10 rounded-xl border-slate-100 bg-slate-50/50 font-bold text-xs"
                                placeholder="TXN-XXXXXX"
                                value={transactionId}
                                onChange={(e) => setTransactionId(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Upload Proof (Photo)</Label>
                        {receiptUrl ? (
                            <div className="relative h-14 flex items-center justify-between px-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                        <ImageIcon className="h-4 w-4 text-emerald-500" />
                                    </div>
                                    <span className="text-[10px] font-bold text-emerald-800 uppercase truncate max-w-[200px]">proof_uploaded.jpg</span>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setReceiptUrl("")}
                                    className="h-8 w-8 p-0 text-emerald-900 hover:bg-emerald-100 rounded-lg"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <div
                                className={`h-14 border border-dashed rounded-xl flex items-center justify-center gap-3 cursor-pointer transition-all ${isUploading ? 'bg-slate-50 border-slate-200' : 'hover:bg-slate-50 border-slate-200 hover:border-indigo-300'}`}
                                onClick={() => !isUploading && fileInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    className="hidden"
                                    ref={fileInputRef}
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                />
                                {isUploading ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                                ) : (
                                    <Upload className="h-4 w-4 text-slate-400" />
                                )}
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    {isUploading ? 'Uploading...' : 'Upload Payment Photo'}
                                </span>
                            </div>
                        )}
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest px-1">Required for verification (Max 5MB)</p>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Extra Notes</Label>
                        <Textarea
                            className="rounded-xl border-slate-100 bg-slate-50/50 min-h-[80px] font-medium p-4 text-xs resize-none focus:ring-indigo-600"
                            placeholder="Add any extra details..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="submit"
                            disabled={isPending || isUploading || netBalance <= 0}
                            className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                        >
                            {isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <Send className="h-4 w-4 text-white" />
                                    Notify Warden
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
