"use client"
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    CheckCircle,
    XCircle,
    AlertCircle,
    Clock,
    Search,
    Filter,
    User,
    Building2,
    Calendar,
    ChevronRight,
    ImageIcon,
    RefreshCw,
    ShieldCheck,
    ChevronLeft,
    Activity,
    X,
    Maximize2,
    Loader2,
    CreditCard,
    DollarSign,
    TrendingUp,
    LayoutGrid,
    Scan
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAllPayments, useUpdatePayment } from "@/hooks/usePayment";
import { useHostel } from "@/hooks/usehostel";
import { format } from "date-fns";
import { toast } from "sonner";

const PaymentApprovalPage = () => {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [filterHostel, setFilterHostel] = useState("all");
    const [rejectionReason, setRejectionReason] = useState("");
    const [selectedPaymentId, setSelectedPaymentId] = useState(null);
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [viewReceiptUrl, setViewReceiptUrl] = useState(null);
    const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);

    const { data: paymentsData, isLoading: paymentsLoading } = useAllPayments({ limit: 1000 });
    const { data: hostelsData } = useHostel();

    const filteredPayments = useMemo(() => {
        const payments = paymentsData?.payments || [];
        return payments.filter(payment => {
            const isApprovalNeeded = payment.status === 'PENDING' || payment.status === 'PARTIAL';
            const matchesSearch =
                payment.User?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                payment.id.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesHostel = filterHostel === "all" || payment.Booking?.Room?.Hostel?.id === filterHostel;
            return isApprovalNeeded && matchesSearch && matchesHostel;
        });
    }, [paymentsData, searchQuery, filterHostel]);

    const updatePayment = useUpdatePayment();

    const handleApprove = async (paymentId) => {
        try {
            await updatePayment.mutateAsync({ id: paymentId, status: 'PAID' });
            toast.success("Payment approved successfully");
        } catch {
            toast.error("Failed to approve payment");
        }
    };

    const handleReject = async () => {
        if (!selectedPaymentId || !rejectionReason) return;
        try {
            await updatePayment.mutateAsync({ id: selectedPaymentId, status: 'REJECTED', notes: rejectionReason });
            toast.success("Payment rejected");
            setIsRejectDialogOpen(false);
            setRejectionReason("");
            setSelectedPaymentId(null);
        } catch {
            toast.error("Failed to reject payment");
        }
    };

    const getStatusStyle = (status) => {
        switch (status?.toUpperCase()) {
            case "PAID": return "bg-emerald-50 text-emerald-700 border-emerald-100";
            case "PENDING": return "bg-blue-50 text-blue-700 border-blue-100";
            case "PARTIAL": return "bg-amber-50 text-amber-700 border-amber-100";
            default: return "bg-gray-50 text-gray-600 border-gray-100";
        }
    };

    if (paymentsLoading) return (
        <div className="flex h-screen items-center justify-center bg-white font-sans">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="h-20 w-20 border-[3px] border-gray-100 border-t-indigo-600 rounded-full animate-spin" />
                    <ShieldCheck className="h-8 w-8 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center">
                    <p className="text-lg font-bold text-gray-900 tracking-tight uppercase">Loading Queue...</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-2">Checking pending approvals</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 pb-32 font-sans tracking-tight text-slate-900">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16 shadow-sm shadow-black/5">
                <div className="max-w-[1600px] mx-auto px-8 h-full flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100 h-9 w-9" onClick={() => router.back()}>
                            <ChevronLeft className="h-4 w-4 text-slate-400" />
                        </Button>
                        <div className="h-6 w-px bg-slate-100" />
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-indigo-600" />
                            <div className="flex flex-col">
                                <h1 className="text-base font-bold text-gray-900 tracking-tight uppercase">Approvals</h1>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Verifications Desk</span>
                                    <Badge variant="secondary" className="bg-amber-50 text-amber-600 border-amber-100 text-[9px] px-2 py-0">
                                        {filteredPayments.length} Pending
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="h-9 px-4 rounded-xl border-slate-200 bg-white font-bold text-[10px] uppercase tracking-wider text-slate-600 hover:bg-gray-50 group">
                        <RefreshCw className="h-3.5 w-3.5 mr-2 text-slate-400 group-hover:rotate-180 transition-transform duration-500" /> Refresh
                    </Button>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-8 py-10 space-y-8">
                {/* Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Pending Count', value: filteredPayments.length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Queue Value', value: `PKR ${(filteredPayments.reduce((acc, p) => acc + p.amount, 0) / 1000).toFixed(1)}k`, icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { label: 'Hostels Active', value: hostelsData?.hostels?.length || 0, icon: Building2, color: 'text-slate-900', bg: 'bg-slate-100' },
                        { label: 'System status', value: 'Live', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className={`h-11 w-11 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</span>
                                <span className="text-xl font-bold text-slate-900 tracking-tight">{stat.value}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-white border border-slate-100 rounded-2xl p-2 flex flex-col md:flex-row items-center gap-4 shadow-sm">
                    <div className="flex-1 relative w-full group px-2">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                        <Input
                            placeholder="Search by student name or ID..."
                            className="w-full h-12 pl-12 bg-transparent border-none shadow-none font-bold text-sm focus-visible:ring-0 placeholder:text-slate-300"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="h-8 w-px bg-slate-100 mx-2 hidden md:block" />

                    <div className="w-full md:w-64 px-2">
                        <Select value={filterHostel} onValueChange={setFilterHostel}>
                            <SelectTrigger className="border-none bg-transparent shadow-none font-bold text-[10px] uppercase tracking-wider h-12 focus:ring-0">
                                <Building2 className="h-3.5 w-3.5 mr-2 text-slate-400" />
                                <SelectValue placeholder="Filter Hostel" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-100 shadow-xl p-2">
                                <SelectItem value="all" className="font-bold text-[10px] uppercase p-2.5 rounded-lg">All Hostels</SelectItem>
                                {hostelsData?.hostels?.map((h) => (
                                    <SelectItem key={h.id} value={h.id} className="font-bold text-[10px] uppercase p-2.5 rounded-lg">{h.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* List */}
                <div className="space-y-4">
                    {filteredPayments.length > 0 ? (
                        filteredPayments.map((payment) => (
                            <div key={payment.id} className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col lg:flex-row items-center justify-between gap-6 hover:shadow-md transition-all group relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500 opacity-60" />

                                <div className="flex items-center gap-6 flex-1 min-w-0">
                                    <div className="h-14 w-14 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm shrink-0 group-hover:bg-indigo-600 transition-colors">
                                        <User className="h-6 w-6 text-slate-400 group-hover:text-white transition-colors" />
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <div className="flex items-center gap-3">
                                            <h4 className="text-base font-bold text-slate-900 uppercase tracking-tight truncate">{payment.User?.name}</h4>
                                            {payment.notes?.includes('[GUEST_NOTIFICATION]') && (
                                                <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 text-[8px] font-bold px-2 py-0">Guest Sent</Badge>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-1 gap-x-6 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            <span className="truncate">{payment.Booking?.Room?.Hostel?.name}</span>
                                            <span className="text-indigo-600">Room {payment.Booking?.Room?.roomNumber}</span>
                                            <span className="text-slate-300 hidden md:block">ID: {payment.id.slice(-8).toUpperCase()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8 min-w-fit">
                                    <div className="flex flex-col items-end">
                                        <span className="text-lg font-bold text-slate-900">PKR {payment.amount.toLocaleString()}</span>
                                        <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                                            <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-slate-100 bg-slate-50">{payment.method}</Badge>
                                            <span>{format(new Date(payment.date), 'MMM dd')}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {payment.receiptUrl && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 rounded-xl hover:bg-indigo-50 text-indigo-600 transition-all border border-transparent hover:border-indigo-100"
                                                onClick={() => { setViewReceiptUrl(payment.receiptUrl); setIsReceiptDialogOpen(true); setSelectedPaymentId(payment.id); }}
                                            >
                                                <Scan className="h-5 w-5" />
                                            </Button>
                                        )}

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-10 px-4 rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 border-rose-100 bg-white font-bold text-[10px] uppercase tracking-widest"
                                            onClick={() => { setSelectedPaymentId(payment.id); setIsRejectDialogOpen(true); }}
                                        >
                                            Reject
                                        </Button>

                                        <Button
                                            size="sm"
                                            className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/10 active:scale-95 transition-all"
                                            onClick={() => handleApprove(payment.id)}
                                        >
                                            Approve
                                        </Button>

                                        <Link href={`/admin/payment-approvals/${payment.id}`}>
                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100">
                                                <ChevronRight className="h-5 w-5 text-slate-300" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white border border-slate-100 rounded-3xl py-24 text-center border-dashed shadow-sm">
                            <div className="h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-100">
                                <CheckCircle className="h-8 w-8 text-emerald-500" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 uppercase">Clear Desk</h3>
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">All payments have been reviewed and processed.</p>
                        </div>
                    )}
                </div>

                {/* Footer Banner */}
                <div className="pt-10">
                    <div className="bg-indigo-600 text-white rounded-[2.5rem] p-6 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-indigo-600/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-80 h-full bg-white/5 skew-x-12 translate-x-20" />
                        <div className="flex items-center gap-6 relative z-10 px-4">
                            <div className="h-11 w-11 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-xl border border-white/10">
                                <ShieldCheck className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-100">Audit Ready</h4>
                                <p className="text-[12px] font-bold mt-1 tracking-wide uppercase">Official Finance Desk Active</p>
                            </div>
                        </div>

                        <div className="h-8 w-px bg-white/10 hidden md:block" />

                        <div className="flex-1 flex items-center gap-16 px-8">
                            <div className="flex flex-col">
                                <span className="text-[8px] font-bold uppercase text-indigo-100 tracking-[0.2em]">Pending Total</span>
                                <span className="text-[10px] font-bold text-white uppercase mt-1 tracking-widest">PKR {filteredPayments.reduce((acc, p) => acc + p.amount, 0).toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[8px] font-bold uppercase text-indigo-100 tracking-[0.2em]">Last Sync</span>
                                <span className="text-[10px] font-bold text-white uppercase mt-1 tracking-widest">{format(new Date(), 'HH:mm:ss')}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 pr-6 relative z-10">
                            <span className="text-[9px] font-bold uppercase text-white tracking-widest">Live Node</span>
                            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                        </div>
                    </div>
                </div>
            </main>

            {/* Rejection Dialog */}
            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white ring-1 ring-slate-100">
                    <div className="bg-rose-600 p-10 text-white text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/10 skew-x-12 translate-x-20" />
                        <div className="h-16 w-16 bg-black/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/10 shadow-lg">
                            <XCircle className="h-8 w-8" />
                        </div>
                        <h2 className="text-2xl font-bold uppercase tracking-tight italic">Reject Payment</h2>
                        <p className="text-[10px] text-white/70 font-bold tracking-widest mt-2 uppercase">Stop verification protocol</p>
                    </div>
                    <div className="p-10 space-y-8">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Feedback for Resident</Label>
                            <Textarea
                                placeholder="Specify exactly why this payment cannot be approved..."
                                className="rounded-2xl border-slate-100 bg-slate-50 p-6 font-bold text-sm min-h-[140px] focus:ring-rose-500 text-slate-900 resize-none pt-4 placeholder:text-slate-300"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-4">
                            <Button variant="ghost" className="flex-1 rounded-xl h-12 font-bold text-[10px] uppercase tracking-wider text-slate-400" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
                            <Button
                                className="flex-1 h-12 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl shadow-lg shadow-rose-600/20 active:scale-95 transition-all"
                                onClick={handleReject}
                                disabled={updatePayment.isPending || !rejectionReason}
                            >
                                {updatePayment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reject Now'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Proof Modal */}
            <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
                <DialogContent className="max-w-3xl bg-white p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
                    <div className="bg-indigo-600 p-6 text-white flex items-center justify-between border-b border-white/10">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                                <Scan className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider">Evidence Examination</h3>
                                <p className="text-[9px] text-indigo-100 font-bold uppercase tracking-widest">Verify submitted proof of payment</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setIsReceiptDialogOpen(false)} className="rounded-xl hover:bg-white/10 text-white">
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                    <div className="p-8 bg-slate-50 flex items-center justify-center min-h-[460px] relative overflow-hidden group/zoom">
                        {viewReceiptUrl ? (
                            <img src={viewReceiptUrl} alt="Receipt Proof" className="max-w-full h-auto rounded-2xl shadow-xl transition-transform duration-700 group-hover/zoom:scale-[1.05]" />
                        ) : (
                            <div className="text-center py-12">
                                <AlertCircle className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Evidence missing from registry</p>
                            </div>
                        )}
                    </div>
                    <div className="p-6 border-t border-slate-100 flex justify-between items-center bg-white">
                        <div className="flex flex-col">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Examination Status</span>
                            <span className="text-[10px] font-bold text-indigo-600 uppercase">Verification Active</span>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="ghost" className="rounded-xl h-11 px-6 font-bold text-[10px] uppercase tracking-widest text-slate-400" onClick={() => setIsReceiptDialogOpen(false)}>Close Inspector</Button>
                            <Button
                                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-11 px-8 font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/10 active:scale-95 transition-all"
                                onClick={() => {
                                    handleApprove(selectedPaymentId);
                                    setIsReceiptDialogOpen(false);
                                }}
                            >
                                Approve Transaction
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PaymentApprovalPage;
