"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
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
    Calendar,
    ShieldCheck,
    Send,
    ImageIcon,
    CheckCircle,
    Upload,
    Badge,
    X,
    Receipt,
    Wallet,
    AlertCircle,
    UserCheck
} from "lucide-react";
import { toast } from "sonner";

export default function PaymentNotificationModal({ booking, children }) {
    const [open, setOpen] = useState(false);
    const fileInputRef = useRef(null);

    // Optimized Financial State
    const stats = useMemo(() => {
        const payments = booking.Payment || [];
        const paid = payments.filter(p => p.status === 'PAID').reduce((acc, curr) => acc + curr.amount, 0);
        const pending = payments.filter(p => p.status === 'PENDING' || p.status === 'PARTIAL').reduce((acc, curr) => acc + curr.amount, 0);

        // Robust Total Calculation: Use Room Rent if Booking Total is 0
        const roomRent = booking.Room?.monthlyrent || booking.Room?.price || 0;
        const bookingTotal = (booking.totalAmount || 0) + (booking.securityDeposit || 0);
        const total = bookingTotal > 0 ? bookingTotal : roomRent;

        return {
            total,
            paid,
            pending,
            verifiedBalance: Math.max(0, total - paid),
            availableToNotify: Math.max(0, total - paid - pending)
        };
    }, [booking]);

    const isSettled = stats.verifiedBalance <= 0;

    // Form State
    const [amount, setAmount] = useState("");
    const [method, setMethod] = useState("BANK_TRANSFER");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState("");
    const [receiptUrl, setReceiptUrl] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    // Initialize amount when modal opens
    useEffect(() => {
        if (open) {
            setAmount(stats.availableToNotify > 0 ? stats.availableToNotify.toString() : "");
        }
    }, [open, stats.availableToNotify]);

    const { mutate: createPayment, isPending } = useCreatePayment();

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File is too large! Max 5MB allowed.");
            return;
        }

        setIsUploading(true);
        const toastId = toast.loading("Processing Proof...");

        try {
            const reader = new FileReader();
            reader.onloadend = () => {
                // For demo/testing, we use the Base64 data as the URL.
                // In production, you would upload this to S3/Cloudinary and store the response URL.
                const base64String = reader.result;
                setReceiptUrl(base64String);
                setIsUploading(false);
                toast.success("Payment Proof Ready", { id: toastId });
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
            toast.error("Please enter a valid amount.");
            return;
        }

        if (numericAmount > stats.availableToNotify + 0.01) { // small buffer
            toast.error(`Amount exceeds remaining fee.`, {
                description: `Max PKR ${stats.availableToNotify.toLocaleString()} allowed.`
            });
            return;
        }

        // Method validation
        if (method !== 'CASH' && !receiptUrl) {
            toast.error("Proof of payment required.");
            return;
        }

        // Add explicit Guest Notification marker in notes
        const finalNotes = `[GUEST_NOTIFICATION] ${notes}`.trim();

        const paymentData = {
            userId: booking.userId,
            bookingId: booking.id,
            amount: numericAmount,
            date: new Date(date),
            method,
            notes: finalNotes,
            receiptUrl: receiptUrl || null,
            status: "PENDING",
            type: "RENT"
        };

        createPayment(paymentData, {
            onSuccess: () => {
                setOpen(false);
                setAmount("");
                setNotes("");
                setReceiptUrl("");
                toast.success("Warden Notified", {
                    description: "Your proof has been submitted for verification."
                });
            },
            onError: (error) => {
                toast.error(error.message || "Something went wrong.");
            }
        });
    };

    if (isSettled && !open) {
        return (
            <div className="relative group inline-block" onClick={(e) => {
                e.preventDefault();
                toast.info("Account is already settled.");
            }}>
                <div className="opacity-50 grayscale pointer-events-none">
                    {children}
                </div>
            </div>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-[420px] p-0 border-0 shadow-2xl rounded-[1.5rem] bg-white overflow-hidden ring-1 ring-black/[0.05]">
                {/* Slim Design Header */}
                <DialogHeader className="p-6 bg-slate-900 text-white flex flex-row items-center gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-full bg-white/[0.03] skew-x-[30deg] translate-x-10" />
                    <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                        <Wallet className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex flex-col text-left">
                        <DialogTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                            Notify Warden
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[8px] px-1.5 py-0">Guest Mode</Badge>
                        </DialogTitle>
                        <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-1">Directly Alart management</p>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Compact Balance Cards */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col gap-1">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Amount Due</span>
                            <span className="text-xs font-bold text-slate-900">PKR {stats.verifiedBalance.toLocaleString()}</span>
                        </div>
                        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 flex flex-col gap-1">
                            <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest">Net Payable</span>
                            <span className="text-xs font-bold text-indigo-600">PKR {stats.availableToNotify.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Paid Amount</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">Rs</span>
                                    <Input
                                        type="number"
                                        className="h-10 pl-8 rounded-xl border-slate-100 bg-slate-50/50 font-bold text-xs focus:ring-1 focus:ring-indigo-600"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Transfer Date</Label>
                                <Input
                                    type="date"
                                    className="h-10 rounded-xl border-slate-100 bg-slate-50/50 font-bold text-xs px-3"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Payment Method</Label>
                            <Select value={method} onValueChange={setMethod}>
                                <SelectTrigger className="h-10 rounded-xl border-slate-100 bg-slate-50/50 font-bold text-[10px] px-4">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl p-1 shadow-2xl border-slate-100">
                                    <SelectItem value="BANK_TRANSFER" className="rounded-lg text-[10px] font-bold py-2">Bank Transfer</SelectItem>
                                    <SelectItem value="EASYPAISA" className="rounded-lg text-[10px] font-bold py-2">EasyPaisa</SelectItem>
                                    <SelectItem value="JAZZCASH" className="rounded-lg text-[10px] font-bold py-2">JazzCash</SelectItem>
                                    <SelectItem value="CASH" className="rounded-lg text-[10px] font-bold py-2">Manual Cash</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Attach Transfer Proof</Label>
                            {receiptUrl ? (
                                <div className="relative h-12 flex items-center justify-between px-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <div className="h-7 w-7 rounded-lg bg-white flex items-center justify-center border border-emerald-100">
                                            <ImageIcon className="h-3.5 w-3.5 text-emerald-500" />
                                        </div>
                                        <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-tighter">Receipt Attached</span>
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
                                    {isUploading ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />
                                    ) : (
                                        <Upload className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-500" />
                                    )}
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-indigo-600">
                                        {isUploading ? 'Uploading...' : 'Upload Image Receipt'}
                                    </span>
                                </div>
                            )}
                            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-[0.2em] px-1 text-center">Auto-tagged as "Notified by Guest"</p>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Additional Notes</Label>
                            <Textarea
                                className="rounded-xl border-slate-100 bg-slate-50/50 min-h-[60px] font-medium p-3 text-xs resize-none focus:ring-1 focus:ring-indigo-600"
                                placeholder="Describe the payment..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={isPending || isUploading || stats.availableToNotify <= 0}
                            className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            {isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin text-white" />
                            ) : (
                                <>
                                    <Send className="h-3.5 w-3.5" />
                                    Notify Warden Now
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
