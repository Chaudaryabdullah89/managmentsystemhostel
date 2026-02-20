"use client"
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ChevronLeft,
    ShieldCheck,
    Calendar,
    User,
    Home,
    CreditCard,
    FileText,
    Receipt,
    Printer,
    Download,
    Check,
    X,
    TrendingUp,
    Clock,
    Activity,
    AlertCircle,
    ArrowRight,
    MapPin,
    Phone,
    Mail,
    Building2,
    CheckCircle2,
    Eye,
    ChevronRight,
    ExternalLink,
    XCircle,
    Loader2,
    CheckCircle,
    Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { usePaymentById, useUpdatePayment } from "@/hooks/usePayment";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";

const PaymentApprovalDetailPage = () => {
    const params = useParams();
    const router = useRouter();
    const { paymentId } = params;

    const { data: payment, isLoading } = usePaymentById(paymentId);
    const updatePayment = useUpdatePayment();
    const [rejectionReason, setRejectionReason] = useState("");
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

    const handleAction = async (status) => {
        try {
            await updatePayment.mutateAsync({
                id: paymentId,
                status,
                notes: status === 'REJECTED' ? rejectionReason : (payment.notes || 'Payment verified and approved.')
            });
            toast.success(status === 'PAID' ? "Payment approved successfully" : "Payment rejected");
            if (status === 'PAID' || status === 'REJECTED') {
                router.push('/admin/payments');
            }
            setIsRejectDialogOpen(false);
        } catch (error) {
            toast.error("Failed to update payment status");
        }
    };

    if (isLoading) return (
        <div className="flex h-screen items-center justify-center bg-white font-sans">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="h-20 w-20 border-[3px] border-gray-100 border-t-indigo-600 rounded-full animate-spin" />
                    <ShieldCheck className="h-8 w-8 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center">
                    <p className="text-lg font-bold text-gray-900 tracking-tight uppercase">Loading Payment...</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-2">Checking records</p>
                </div>
            </div>
        </div>
    );

    if (!payment) return (
        <div className="flex flex-col items-center justify-center min-h-screen p-20 text-center">
            <div className="h-16 w-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-6">
                <AlertCircle className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Payment Not Found</h3>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-2">The requested payment does not exist in the system.</p>
            <Button onClick={() => router.back()} variant="outline" className="mt-8 rounded-xl h-10 px-8 font-bold uppercase tracking-widest text-[9px]">Go Back</Button>
        </div>
    );

    const getStatusStyle = (status) => {
        switch (status?.toUpperCase()) {
            case "PAID": return "bg-emerald-50 text-emerald-700 border-emerald-100";
            case "PENDING": return "bg-amber-50 text-amber-700 border-amber-100";
            case "REJECTED": return "bg-rose-50 text-rose-700 border-rose-100";
            default: return "bg-gray-50 text-gray-600 border-gray-100";
        }
    };

    const isGuestNotification = payment.notes?.includes('[GUEST_NOTIFICATION]');

    return (
        <div className="min-h-screen bg-gray-50/50 pb-32 font-sans tracking-tight">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16 shadow-sm shadow-black/5">
                <div className="max-w-[1600px] mx-auto px-8 h-full flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100 h-9 w-9" onClick={() => router.back()}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="h-6 w-px bg-gray-100" />
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-indigo-600" />
                            <div className="flex flex-col">
                                <h1 className="text-base font-bold text-gray-900 tracking-tight uppercase">Payment Review</h1>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">ID: {paymentId.slice(-12).toUpperCase()}</span>
                                    {isGuestNotification && (
                                        <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[8px] px-2 py-0 ml-1">Guest Entry</Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Reject Dialog */}
                        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-9 px-5 rounded-xl border-rose-100 text-rose-600 font-bold text-[9px] uppercase tracking-widest hover:bg-rose-50 transition-all bg-white"
                                >
                                    <XCircle className="h-3.5 w-3.5 mr-2" />
                                    Reject
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
                                <div className="bg-rose-600 p-8 text-white text-center">
                                    <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <XCircle className="h-7 w-7" />
                                    </div>
                                    <h2 className="text-lg font-bold uppercase tracking-tight">Reject Payment</h2>
                                    <p className="text-[10px] text-rose-200 uppercase font-bold tracking-widest mt-1">Provide a reason for rejection</p>
                                </div>
                                <div className="p-8 bg-white space-y-5">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 ml-1">Rejection Reason</Label>
                                        <Textarea
                                            placeholder="Why is this payment being rejected? (Visible to resident)"
                                            className="rounded-xl border-gray-200 bg-gray-50 min-h-[120px] font-medium text-sm p-4 focus:ring-indigo-500 placeholder:text-gray-300 resize-none"
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <Button variant="ghost" className="flex-1 rounded-xl font-bold text-[10px] uppercase tracking-widest h-11" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
                                        <Button
                                            className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-rose-600/20"
                                            onClick={() => handleAction('REJECTED')}
                                            disabled={updatePayment.isPending || !rejectionReason}
                                        >
                                            {updatePayment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Reject'}
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Button
                            className="h-9 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[9px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
                            onClick={() => handleAction('PAID')}
                            disabled={updatePayment.isPending}
                        >
                            {updatePayment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                            Approve Payment
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Amount Card */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-8 relative overflow-hidden shadow-sm">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50 rounded-full -mr-24 -mt-24 opacity-60 blur-3xl pointer-events-none" />
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                            <div className="flex items-center gap-6">
                                <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-sm group hover:bg-indigo-600 transition-colors duration-300">
                                    <TrendingUp className="h-8 w-8 text-indigo-600 group-hover:text-white transition-colors" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-2">Payment Amount</span>
                                    <div className="flex items-baseline gap-3">
                                        <h2 className="text-4xl font-bold text-gray-900 tracking-tighter">PKR {payment.amount.toLocaleString()}</h2>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
                                <Badge variant="outline" className={`${getStatusStyle(payment.status)} px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] border`}>
                                    {payment.status}
                                </Badge>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                                    <Clock className="h-3 w-3" /> {format(new Date(payment.date), 'MMM dd, yyyy')}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-gray-100">
                            {[
                                { label: 'Date', value: format(new Date(payment.date), 'MMMM yyyy'), icon: Calendar, sub: format(new Date(payment.date), 'MMM dd, yyyy') },
                                { label: 'Method', value: payment.method, icon: CreditCard, sub: 'Payment Method' },
                                { label: 'Type', value: payment.type, icon: Receipt, sub: 'Payment Category' },
                                { label: 'Status', value: payment.status, icon: ShieldCheck, sub: 'Current State' }
                            ].map((item, i) => (
                                <div key={i} className="flex flex-col gap-2 group">
                                    <div className="flex items-center gap-2">
                                        <div className="h-7 w-7 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 border border-gray-100">
                                            <item.icon className="h-3.5 w-3.5 text-gray-400 group-hover:text-white transition-colors" />
                                        </div>
                                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">{item.label}</span>
                                    </div>
                                    <div className="pl-0.5">
                                        <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">{item.value}</p>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{item.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Proof of Payment */}
                    {payment.receiptUrl ? (
                        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm space-y-6 group/proof overflow-hidden">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Payment Receipt</h3>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Submitted verification image</span>
                                    </div>
                                </div>
                                <Link href={payment.receiptUrl} target="_blank">
                                    <Button variant="outline" className="rounded-xl h-9 px-5 font-bold uppercase text-[9px] tracking-widest group/btn hover:border-indigo-200 hover:text-indigo-600">
                                        Open Full Image <ExternalLink className="h-3.5 w-3.5 ml-2 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                                    </Button>
                                </Link>
                            </div>

                            <div className="aspect-[16/10] bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden relative group-hover/proof:border-indigo-200 transition-colors">
                                <img
                                    src={payment.receiptUrl}
                                    alt="Payment Proof"
                                    className="w-full h-full object-contain p-4 group-hover/proof:scale-[1.02] transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/proof:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                    <Link href={payment.receiptUrl} target="_blank">
                                        <Button className="bg-white text-gray-900 hover:bg-gray-100 rounded-xl h-11 px-8 font-bold uppercase text-[10px] tracking-widest shadow-2xl">
                                            <Eye className="h-4 w-4 mr-2" /> View Full Image
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm flex items-center justify-center py-20 group">
                            <div className="text-center">
                                <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-5 group-hover:bg-amber-50 transition-colors border border-gray-100">
                                    <AlertCircle className="h-8 w-8 text-gray-300 group-hover:text-amber-400 transition-colors" />
                                </div>
                                <h4 className="text-base font-bold text-gray-900 uppercase tracking-tight">No Receipt Attached</h4>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2 max-w-[260px] leading-relaxed mx-auto">This payment was submitted without an attached image.</p>
                            </div>
                        </div>
                    )}

                    {/* Resident & Room Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Resident Card */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm relative overflow-hidden group">
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-400 mb-6 flex items-center gap-2">
                                <div className="h-1 w-3 bg-indigo-600 rounded-full" /> Resident Info
                            </h3>
                            <div className="space-y-6 relative z-10">
                                <div className="flex items-center gap-5">
                                    <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-lg font-bold text-indigo-600 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                        {payment.User?.name?.charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Resident</span>
                                        <p className="text-base font-bold text-gray-900 uppercase tracking-tight">{payment.User?.name}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-gray-100">
                                    <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl border border-gray-100/50 hover:bg-white transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Phone className="h-3.5 w-3.5 text-indigo-500" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Phone</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900">{payment.User?.phone || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl border border-gray-100/50 hover:bg-white transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Mail className="h-3.5 w-3.5 text-indigo-500" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Email</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900 truncate max-w-[160px]">{payment.User?.email || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Room/Hostel Card */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm relative overflow-hidden group">
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-400 mb-6 flex items-center gap-2">
                                <div className="h-1 w-3 bg-indigo-600 rounded-full" /> Room & Hostel
                            </h3>
                            <div className="space-y-5 relative z-10">
                                <div className="p-5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/20 group-hover:scale-[1.01] transition-transform duration-300">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
                                            <Home className="h-4 w-4 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-indigo-200 uppercase tracking-[0.2em]">Hostel</p>
                                            <p className="text-sm font-bold uppercase">{payment.Booking?.Room?.Hostel?.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-xl font-bold">Room {payment.Booking?.Room?.roomNumber}</span>
                                        </div>
                                        <Badge className="bg-white/20 text-white border-none rounded-lg px-2 py-1 text-[9px] font-bold uppercase tracking-tighter">
                                            Floor {payment.Booking?.Room?.floor}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl border border-gray-100/50">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Room Type</span>
                                        <span className="text-sm font-bold text-gray-900 uppercase">{payment.Booking?.Room?.type || 'Standard'}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl border border-gray-100/50">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Status</span>
                                        <span className="text-sm font-bold text-emerald-600 uppercase">Operational</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-8">
                    {/* Booking Info Card */}
                    <div className="bg-indigo-600 text-white rounded-2xl p-8 shadow-2xl shadow-indigo-600/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-24 -mt-24 transition-transform duration-700 group-hover:scale-125" />
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-indigo-200 mb-8 flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5" /> Booking Info
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <span className="text-[9px] font-bold text-indigo-300 uppercase block mb-2 tracking-widest">Booking REF</span>
                                <div className="flex items-center justify-between">
                                    <p className="text-xl font-bold text-white tracking-tighter">BK-{payment.bookingId?.slice(-8).toUpperCase()}</p>
                                    <Link href={`/admin/bookings/${payment.bookingId}`}>
                                        <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white hover:text-indigo-600 transition-all">
                                            <ChevronRight className="h-4 w-4" />
                                        </div>
                                    </Link>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/10">
                                <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest block">Check-in</span>
                                    <p className="text-sm font-bold text-white">{format(new Date(payment.Booking?.checkIn || new Date()), 'dd MMM yy')}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest block">Status</span>
                                    <p className="text-sm font-bold text-emerald-300 uppercase tracking-tighter leading-none">{payment.Booking?.status}</p>
                                </div>
                            </div>

                            <Link href={`/admin/bookings/${payment.bookingId}`}>
                                <Button className="w-full h-11 bg-white/10 border border-white/20 hover:bg-white hover:text-indigo-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all mt-2 shadow-md">
                                    View Full Booking <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm space-y-6 group/audit">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 flex items-center gap-2">
                                <Activity className="h-3.5 w-3.5" /> Activity Log
                            </h3>
                        </div>
                        <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
                            {[
                                { event: 'Payment Created', date: payment.createdAt, icon: Activity, desc: 'Record initialized' },
                                { event: 'Payment Date', date: payment.date, icon: Clock, desc: 'Date of transaction' },
                                { event: 'Under Review', date: new Date(), icon: ShieldCheck, desc: 'Awaiting verification' },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-6 relative z-10">
                                    <div className="h-6 w-6 rounded-full bg-white border-2 border-indigo-500 flex items-center justify-center shrink-0 shadow-sm">
                                        <div className="h-2 w-2 rounded-full bg-indigo-500" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-900 uppercase tracking-tight">{item.event}</span>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{item.desc}</p>
                                        <span className="text-[9px] font-bold text-indigo-600 mt-1.5 bg-indigo-50 self-start px-2 py-0.5 rounded-full">
                                            {format(new Date(item.date), 'MMM dd, HH:mm')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-3">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-4">Actions</h3>
                        <Button
                            className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                            onClick={() => handleAction('PAID')}
                            disabled={updatePayment.isPending}
                        >
                            {updatePayment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                            Approve
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full h-11 border-rose-100 text-rose-600 hover:bg-rose-50 font-bold text-[10px] uppercase tracking-widest rounded-xl flex items-center gap-2"
                            onClick={() => setIsRejectDialogOpen(true)}
                        >
                            <XCircle className="h-4 w-4" />
                            Reject
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PaymentApprovalDetailPage;
