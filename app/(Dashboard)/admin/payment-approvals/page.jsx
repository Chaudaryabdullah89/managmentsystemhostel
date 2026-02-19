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
    Download,
    User,
    Home,
    CreditCard,
    Calendar,
    FileText,
    ChevronRight,
    Receipt,
    Building2,
    Check,
    X,
    Image as ImageIcon,
    RefreshCw,
    ShieldCheck,
    ChevronLeft,
    TrendingUp,
    Filter,
    Activity,
    ArrowRight,
    Loader2
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
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAllPayments, useFinancialStats, useUpdatePayment } from "@/hooks/usePayment";
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
    const { data: statsData, isLoading: statsLoading } = useFinancialStats();
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
            toast.success("Payment approved");
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

    if (paymentsLoading || statsLoading) return (
        <div className="flex h-screen items-center justify-center bg-white font-sans">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="h-14 w-14 border-2 border-gray-100 border-t-blue-600 rounded-full animate-spin" />
                    <ShieldCheck className="h-5 w-5 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-bold text-gray-900 tracking-tight uppercase">Loading Approvals...</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1 animate-pulse">Checking payment records</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/30 pb-24 font-sans tracking-tight">

            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-14 shadow-black/5 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100 h-8 w-8" onClick={() => router.back()}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="h-5 w-px bg-gray-100" />
                        <div className="flex flex-col">
                            <h1 className="text-sm font-bold text-gray-900 tracking-tight uppercase">Payment Approvals</h1>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-600">Pending Approval</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                            </div>
                        </div>
                    </div>
                    <Button variant="outline" className="h-8 px-4 rounded-xl border-gray-100 bg-white font-bold text-[9px] uppercase tracking-widest text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
                        <RefreshCw className="h-3 w-3 mr-1.5 text-gray-400" />
                        Refresh
                    </Button>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Pending Approvals', value: filteredPayments.length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
                        { label: 'Total Amount', value: `PKR ${(filteredPayments.reduce((acc, p) => acc + p.amount, 0) / 1000).toFixed(1)}k`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                        { label: 'Approval Status', value: 'Active', icon: ShieldCheck, color: 'text-blue-500', bg: 'bg-blue-50' },
                        { label: 'System Status', value: 'Running', icon: Activity, color: 'text-violet-500', bg: 'bg-violet-50' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
                            <div className={`h-10 w-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300`}>
                                <stat.icon className="h-4.5 w-4.5" style={{ height: 18, width: 18 }} />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-0.5 truncate">{stat.label}</span>
                                <span className="text-lg font-bold text-gray-900 tracking-tighter leading-none">{stat.value}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Search & Filter */}
                <div className="bg-white border border-gray-100 rounded-2xl p-2 flex flex-col md:flex-row items-center gap-3 shadow-sm">
                    <div className="flex-1 flex items-center px-3 gap-3 w-full">
                        <Search className="h-4 w-4 text-gray-300 flex-shrink-0" />
                        <Input
                            placeholder="Search by resident name, ID or amount..."
                            className="border-none shadow-none font-medium text-sm focus-visible:ring-0 placeholder:text-gray-300 h-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 p-1 bg-gray-50 rounded-xl pr-4 md:w-auto w-full">
                        <Select value={filterHostel} onValueChange={setFilterHostel}>
                            <SelectTrigger className="h-8 px-4 rounded-lg font-bold text-[9px] uppercase tracking-widest text-gray-500 border-none bg-transparent hover:bg-white hover:shadow-sm transition-all min-w-[180px]">
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-3.5 w-3.5 text-gray-400" />
                                    <SelectValue placeholder="Select Hostel" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-gray-100 p-2 shadow-xl">
                                <SelectItem value="all" className="p-2 font-bold text-[9px] uppercase tracking-widest rounded-lg cursor-pointer">All Hostels</SelectItem>
                                {hostelsData?.hostels?.map((h) => (
                                    <SelectItem key={h.id} value={h.id} className="p-2 font-bold text-[9px] uppercase tracking-widest rounded-lg cursor-pointer">{h.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="h-3.5 w-px bg-gray-200 hidden md:block" />
                        <Filter className="h-3 w-3 text-gray-300 hidden md:block" />
                    </div>
                </div>

                {/* Payment List */}
                <div className="space-y-3">
                    {filteredPayments.length > 0 ? (
                        filteredPayments.map((payment) => (
                            <div
                                key={payment.id}
                                className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col lg:flex-row items-center justify-between gap-4 hover:shadow-md transition-all group relative overflow-hidden"
                            >
                                {/* Left accent */}
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 group-hover:w-1.5 transition-all duration-300 rounded-l-2xl" />

                                <div className="flex items-center gap-5 flex-1 min-w-0 pl-2">
                                    {/* Avatar */}
                                    <div className="h-11 w-11 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0 group-hover:bg-blue-600 transition-all duration-300">
                                        <User className="h-5 w-5 text-gray-300 group-hover:text-white transition-colors" />
                                    </div>

                                    {/* Name + ID */}
                                    <div className="flex flex-col min-w-0 min-w-[200px]">
                                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-tight truncate">{payment.User?.name}</h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[9px] font-bold text-blue-600 uppercase tracking-[0.1em] truncate">{payment.Booking?.Room?.Hostel?.name} · Room {payment.Booking?.Room?.roomNumber}</span>
                                            {payment.uid && (
                                                <Badge className="bg-gray-100 text-gray-500 border-none text-[8px] font-mono font-bold px-1.5 py-0">{payment.uid}</Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Amount */}
                                    <div className="hidden md:flex flex-col gap-0.5 min-w-[160px]">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Amount</span>
                                        <span className="text-base font-bold text-gray-900">PKR {payment.amount.toLocaleString()}</span>
                                        <Badge variant="outline" className="w-fit px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-[0.15em] border-gray-100 bg-gray-50/50">{payment.method}</Badge>
                                    </div>

                                    {/* Date */}
                                    <div className="hidden xl:flex flex-col gap-0.5 min-w-[140px]">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Date</span>
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-3 w-3 text-gray-300" />
                                            <span className="text-xs font-bold text-gray-700 uppercase">{format(new Date(payment.date), 'MMM dd, yyyy')}</span>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    {payment.notes && (
                                        <div className="hidden lg:flex flex-col gap-0.5 min-w-[160px] max-w-[240px]">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Notes</span>
                                            <p className="text-[9px] font-medium text-gray-600 truncate bg-gray-50 px-2 py-1 rounded-md border border-gray-100 italic">"{payment.notes}"</p>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 lg:ml-auto">
                                    {payment.receiptUrl && (
                                        <Button
                                            variant="outline"
                                            className="h-9 px-4 rounded-xl border-blue-100 text-blue-600 font-bold text-[9px] uppercase tracking-[0.15em] hover:bg-blue-50 transition-all shadow-sm bg-white flex items-center gap-1.5"
                                            onClick={() => { setViewReceiptUrl(payment.receiptUrl); setIsReceiptDialogOpen(true); }}
                                        >
                                            <ImageIcon className="h-3.5 w-3.5" />
                                            View Proof
                                        </Button>
                                    )}

                                    <Button
                                        variant="outline"
                                        className="h-9 px-4 rounded-xl border-rose-100 text-rose-600 font-bold text-[9px] uppercase tracking-[0.15em] hover:bg-rose-50 transition-all shadow-sm bg-white"
                                        onClick={() => { setSelectedPaymentId(payment.id); setIsRejectDialogOpen(true); }}
                                    >
                                        Reject
                                    </Button>

                                    <Button
                                        className="h-9 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[9px] uppercase tracking-[0.15em] shadow-md shadow-blue-600/15 transition-all flex items-center gap-1.5 active:scale-95"
                                        onClick={() => handleApprove(payment.id)}
                                    >
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                        Approve
                                    </Button>

                                    <Link href={`/admin/payment-approvals/${payment.id}`}>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-gray-100 transition-all text-gray-300 hover:text-black">
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center shadow-sm border-dashed">
                            <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <ShieldCheck className="h-8 w-8 text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 uppercase tracking-tighter">All caught up!</h3>
                            <p className="text-gray-400 font-bold text-[9px] uppercase tracking-[0.25em] mt-2">All pending payments have been approved or rejected.</p>
                            <Button variant="outline" className="mt-8 rounded-xl h-9 px-8 font-bold uppercase tracking-widest text-[9px]" onClick={() => router.back()}>Go Back</Button>
                        </div>
                    )}
                </div>

                {/* Bottom Audit Bar */}
                <div className="fixed bottom-6 left-6 right-6 z-50">
                    <div className="max-w-[1552px] mx-auto bg-blue-600 text-white rounded-2xl px-5 py-3 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_16px_40px_-8px_rgba(37,99,235,0.35)] relative overflow-hidden ring-1 ring-white/10">
                        <div className="absolute top-0 right-0 w-64 h-full bg-white/5 skew-x-12 translate-x-16 blur-2xl" />
                        <div className="flex items-center gap-5 relative z-10">
                            <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                                <ShieldCheck className="h-4.5 w-4.5 text-white" style={{ height: 18, width: 18 }} />
                            </div>
                            <div className="flex flex-col text-left">
                                <h4 className="text-[9px] font-bold uppercase tracking-[0.3em] text-blue-100">System Status</h4>
                                <p className="text-[11px] font-bold mt-0.5 tracking-wider uppercase">Operator Terminal Active</p>
                            </div>
                        </div>
                        <div className="flex-1 hidden xl:flex items-center gap-12 px-10 border-l border-white/10 ml-6">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold uppercase text-blue-200 tracking-[0.25em]">Pending</span>
                                <span className="text-[11px] font-bold text-white uppercase mt-0.5 tracking-widest">{filteredPayments.length} Active Requests</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold uppercase text-blue-200 tracking-[0.25em]">Security</span>
                                <span className="text-[11px] font-bold text-emerald-300 uppercase mt-0.5 tracking-widest">Encrypted Session</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 pr-4 relative z-10">
                            <span className="text-[9px] font-bold uppercase text-white tracking-[0.25em]">Live</span>
                            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                        </div>
                    </div>
                </div>
            </main>

            {/* Reject Dialog */}
            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                <DialogContent className="max-w-sm p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                    <div className="bg-rose-600 p-7 text-white text-center">
                        <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                            <XCircle className="h-6 w-6" />
                        </div>
                        <h2 className="text-lg font-bold uppercase tracking-tight">Reject Payment</h2>
                        <p className="text-[9px] text-rose-200 uppercase font-bold tracking-widest mt-1">Reject this transaction</p>
                    </div>
                    <div className="p-6 bg-white space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Reason for Rejection</Label>
                            <Textarea
                                placeholder="Specify the reason for rejection. This will be shown to the guest."
                                className="rounded-xl border-gray-100 bg-gray-50/50 min-h-[110px] font-medium text-sm p-4 focus:ring-rose-500 placeholder:text-gray-300 resize-none"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" className="flex-1 rounded-xl font-bold text-[9px] uppercase tracking-widest h-10" onClick={() => { setIsRejectDialogOpen(false); setSelectedPaymentId(null); }}>Cancel</Button>
                            <Button
                                className="flex-1 h-10 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[9px] uppercase tracking-widest rounded-xl shadow-lg shadow-rose-600/20"
                                onClick={handleReject}
                                disabled={updatePayment.isPending || !rejectionReason}
                            >
                                {updatePayment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Rejection'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Receipt Dialog */}
            <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
                <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-white">
                    <DialogHeader className="p-5 bg-blue-600 text-white flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                                <ImageIcon className="h-4.5 w-4.5" style={{ height: 18, width: 18 }} />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold uppercase tracking-tight">Payment Proof</DialogTitle>
                                <p className="text-[9px] text-blue-100 uppercase font-bold tracking-widest mt-0.5">Guest Uploaded Screenshot</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-xl h-8 w-8" onClick={() => setIsReceiptDialogOpen(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogHeader>
                    <div className="p-6 flex items-center justify-center bg-gray-50/50">
                        <div className="relative group overflow-hidden rounded-xl border-2 border-white shadow-xl max-h-[55vh] flex items-center justify-center">
                            {viewReceiptUrl ? (
                                <img src={viewReceiptUrl} alt="Payment Receipt" className="max-w-full h-auto object-contain rounded-xl transition-transform duration-700 group-hover:scale-105" />
                            ) : (
                                <div className="p-16 text-center">
                                    <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No image data available</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="p-4 bg-white border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-emerald-500" />
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Official Evidence Logged</span>
                        </div>
                        <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-6 rounded-xl font-bold text-[9px] uppercase tracking-widest shadow-md shadow-blue-100"
                            onClick={() => setIsReceiptDialogOpen(false)}
                        >
                            Close Preview
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PaymentApprovalPage;
