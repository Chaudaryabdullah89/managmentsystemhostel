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
    Loader2
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
                notes: status === 'REJECTED' ? rejectionReason : (payment.notes || 'Verification protocol successfully authorized.')
            });
            toast.success(`Node ${paymentId.slice(-8).toUpperCase()} updated correctly`);
            if (status === 'PAID' || status === 'REJECTED') {
                router.push('/admin/payment-approvals');
            }
            setIsRejectDialogOpen(false);
        } catch (error) {
            toast.error("Protocol update synchronization failure");
        }
    };

    if (isLoading) return (
        <div className="flex h-screen items-center justify-center bg-white font-sans">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="h-20 w-20 border-[3px] border-gray-100 border-t-black rounded-full animate-spin" />
                    <ShieldCheck className="h-8 w-8 text-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center">
                    <p className="text-lg font-bold text-gray-900 tracking-tight uppercase">Decrypting Transaction Node...</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-2 animate-pulse">Synchronizing Security Tokens</p>
                </div>
            </div>
        </div>
    );

    if (!payment) return (
        <div className="flex flex-col items-center justify-center min-h-screen p-20 text-center">
            <div className="h-16 w-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-6">
                <AlertCircle className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-black text-gray-900 uppercase italic">Transaction Node Void</h3>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-2">The requested ID does not exist in the master ledger.</p>
            <Button onClick={() => router.back()} variant="outline" className="mt-8 rounded-xl h-10 px-8 font-black uppercase tracking-widest text-[9px]">Return to Nexus</Button>
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

    return (
        <div className="min-h-screen bg-gray-50/30 pb-32 font-sans tracking-tight">
            {/* Minimal High-Tech Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16 shadow-black/5 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-8 h-full flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100 h-9 w-9" onClick={() => router.back()}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="h-6 w-px bg-gray-100" />
                        <div className="flex flex-col">
                            <h1 className="text-base font-black text-gray-900 tracking-tight uppercase italic">Verification Console</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600">Active Node Audit</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-10 px-6 rounded-2xl border-rose-100 text-rose-600 font-black text-[9px] uppercase tracking-widest hover:bg-rose-50 transition-all bg-white"
                                >
                                    <XCircle className="h-3.5 w-3.5 mr-2" />
                                    Reject Node
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
                                <div className="bg-rose-600 p-10 text-white text-center">
                                    <div className="h-16 w-16 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
                                        <XCircle className="h-8 w-8" />
                                    </div>
                                    <h2 className="text-2xl font-black uppercase tracking-tight italic">Rejection Protocol</h2>
                                    <p className="text-[10px] text-rose-200 uppercase font-black tracking-widest mt-2">Invalidate Fiscal Transaction Node</p>
                                </div>
                                <div className="p-10 bg-white space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Audit Feedback Required</Label>
                                        <Textarea
                                            placeholder="Specify the exact reason for rejection. This will be visible to the resident node."
                                            className="rounded-2xl border-gray-100 bg-gray-50/50 min-h-[140px] font-bold text-sm p-5 focus:ring-rose-500 placeholder:text-gray-300 resize-none pt-6"
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <Button variant="ghost" className="flex-1 rounded-2xl font-black text-[10px] uppercase tracking-widest h-12" onClick={() => setIsRejectDialogOpen(false)}>Abort Action</Button>
                                        <Button
                                            className="flex-1 h-12 bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-rose-600/20"
                                            onClick={() => handleAction('REJECTED')}
                                            disabled={updatePayment.isPending || !rejectionReason}
                                        >
                                            {updatePayment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Rejection'}
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Button
                            className="h-10 px-8 rounded-2xl bg-black hover:bg-gray-800 text-white font-black text-[9px] uppercase tracking-widest shadow-xl shadow-black/10 transition-all active:scale-95 flex items-center gap-2 group"
                            onClick={() => handleAction('PAID')}
                            disabled={updatePayment.isPending}
                        >
                            {updatePayment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4 group-hover:scale-110 transition-transform" />}
                            Execute Authorization
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                    {/* Primary Fiscal Card */}
                    <div className="bg-white border border-gray-100 rounded-[3rem] p-12 relative overflow-hidden shadow-2xl shadow-black/[0.02]">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -mr-32 -mt-32 opacity-80 blur-3xl pointer-events-none" />

                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                            <div className="flex items-center gap-8">
                                <div className="h-24 w-24 rounded-[2rem] bg-gray-50 flex items-center justify-center border border-gray-100 shadow-inner group transition-all hover:bg-black">
                                    <TrendingUp className="h-12 w-12 text-emerald-500 group-hover:text-white group-hover:scale-110 transition-all duration-500" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Total Magnitude Detected</span>
                                    <div className="flex items-baseline gap-3">
                                        <h2 className="text-6xl font-black text-gray-900 tracking-tighter italic">PKR {payment.amount.toLocaleString()}</h2>
                                        <span className="text-emerald-500 font-bold text-sm uppercase italic">Verified</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-4 shrink-0">
                                <Badge variant="outline" className={`${getStatusStyle(payment.status)} px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border-2 shadow-sm italic`}>
                                    {payment.status}
                                </Badge>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                                    <Clock className="h-3 w-3" /> Registry ID: {paymentId.slice(-12).toUpperCase()}
                                </div>
                            </div>
                        </div>

                        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-12 pt-12 border-t border-gray-50">
                            {[
                                { label: 'Temporal Scale', value: format(new Date(payment.date), 'MMMM yyyy'), icon: Calendar, sub: format(new Date(payment.date), 'MMM dd, yyyy') },
                                { label: 'Audit Interface', value: payment.method, icon: CreditCard, sub: 'Digital Protocol' },
                                { label: 'Node Classification', value: payment.type, icon: Receipt, sub: 'Fiscal Source' },
                                { label: 'System Status', value: 'All Good', icon: ShieldCheck, sub: 'Active' }
                            ].map((item, i) => (
                                <div key={i} className="flex flex-col gap-3 group">
                                    <div className="flex items-center gap-2.5">
                                        <div className="h-8 w-8 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 border border-gray-100">
                                            <item.icon className="h-4 w-4" />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">{item.label}</span>
                                    </div>
                                    <div className="pl-0.5">
                                        <p className="text-base font-black text-gray-900 uppercase italic tracking-wider">{item.value}</p>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{item.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Proof of Registry Section */}
                    {payment.receiptUrl ? (
                        <div className="bg-white border border-gray-100 rounded-[3rem] p-12 shadow-sm space-y-10 group/proof overflow-hidden">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-black flex items-center justify-center text-white">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight italic">Proof of Settlement</h3>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Verified Documentation Fragment</span>
                                    </div>
                                </div>
                                <Link href={payment.receiptUrl} target="_blank">
                                    <Button variant="outline" className="rounded-xl h-10 px-6 font-black uppercase text-[9px] tracking-widest group/btn">
                                        Full Screen Node <ExternalLink className="h-3.5 w-3.5 ml-2 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                                    </Button>
                                </Link>
                            </div>

                            <div className="aspect-[16/10] bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200 overflow-hidden relative group-hover/proof:border-emerald-200 transition-colors">
                                <img
                                    src={payment.receiptUrl}
                                    alt="Payment Proof"
                                    className="w-full h-full object-contain p-4 group-hover/proof:scale-[1.02] transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/proof:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                    <Link href={payment.receiptUrl} target="_blank">
                                        <Button className="bg-white text-black hover:bg-gray-100 rounded-2xl h-12 px-8 font-black uppercase text-[10px] tracking-widest shadow-2xl">
                                            <Eye className="h-4 w-4 mr-2" /> Inspect High Resolution
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white border border-gray-100 rounded-[3rem] p-12 shadow-sm flex items-center justify-center py-24 group">
                            <div className="text-center">
                                <div className="h-20 w-20 rounded-[2rem] bg-gray-50 flex items-center justify-center mx-auto mb-6 group-hover:bg-rose-50 transition-colors border border-gray-100">
                                    <AlertCircle className="h-10 w-10 text-gray-300 group-hover:text-rose-400 transition-colors" />
                                </div>
                                <h4 className="text-lg font-black text-gray-900 uppercase italic tracking-tight">Zero Attachment Registry</h4>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2 max-w-[280px] leading-relaxed mx-auto">This transaction node was initialized without a physical documentation fragment.</p>
                            </div>
                        </div>
                    )}

                    {/* Entity Nexus Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="bg-white border border-gray-100 rounded-[3rem] p-10 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                                <User className="h-32 w-32 text-black" />
                            </div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-10 flex items-center gap-3">
                                <div className="h-1 w-4 bg-emerald-500 rounded-full" /> Resident Profile
                            </h3>
                            <div className="space-y-8 relative z-10">
                                <div className="flex items-center gap-6">
                                    <div className="h-16 w-16 rounded-[1.5rem] bg-gray-50 flex items-center justify-center text-xl font-black text-gray-900 border border-gray-100 group-hover:bg-black group-hover:text-white transition-all duration-300">
                                        {payment.User?.name?.charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Authenticated Entity</span>
                                        <p className="text-xl font-black text-gray-900 uppercase italic tracking-tighter">{payment.User?.name}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-gray-50">
                                    <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50 hover:bg-white transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Phone className="h-4 w-4 text-emerald-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Global Voice</span>
                                        </div>
                                        <span className="text-sm font-black text-gray-900 italic">{payment.User?.phone}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50 hover:bg-white transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Mail className="h-4 w-4 text-emerald-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Digital Node</span>
                                        </div>
                                        <span className="text-sm font-black text-gray-900 italic">{payment.User?.email}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-[3rem] p-10 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                                <Building2 className="h-32 w-32 text-black" />
                            </div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-10 flex items-center gap-3">
                                <div className="h-1 w-4 bg-emerald-500 rounded-full" /> Spatial Nexus
                            </h3>
                            <div className="space-y-8 relative z-10">
                                <div className="p-6 bg-gray-900 text-white rounded-[2rem] shadow-xl group-hover:scale-[1.02] transition-transform duration-300">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                                            <Home className="h-5 w-5 text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Deployment Property</p>
                                            <p className="text-base font-black uppercase italic">{payment.Booking?.Room?.Hostel?.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-black italic">UNIT {payment.Booking?.Room?.roomNumber}</span>
                                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Active</span>
                                        </div>
                                        <Badge className="bg-emerald-500 text-white border-none rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-tighter shadow-lg shadow-emerald-500/20">
                                            Level {payment.Booking?.Room?.floor}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Unit Type</span>
                                        <span className="text-sm font-black text-gray-900 uppercase italic">{payment.Booking?.Room?.type || 'Standard'}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Registry Pulse</span>
                                        <span className="text-sm font-black text-emerald-600 uppercase italic">Operational</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Context Deck */}
                <div className="space-y-10">
                    <div className="bg-black text-white rounded-[3rem] p-12 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-125" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400 mb-12 flex items-center gap-3">
                            Booking Nexus
                        </h3>

                        <div className="space-y-10">
                            <div className="group/item">
                                <span className="text-[9px] font-black text-gray-500 uppercase block mb-3 tracking-widest">Master Registry ID</span>
                                <div className="flex items-center justify-between">
                                    <p className="text-2xl font-black text-white italic tracking-tighter">BK-{payment.bookingId?.slice(-8).toUpperCase()}</p>
                                    <div className="h-8 w-8 rounded-xl bg-white/5 flex items-center justify-center group-hover/item:bg-white group-hover/item:text-black transition-all">
                                        <ChevronRight className="h-4 w-4" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-1">
                                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Contract Commencement</span>
                                    <p className="text-base font-black text-white italic">{format(new Date(payment.Booking?.checkIn || new Date()), 'dd.MM.yy')}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Registry Status</span>
                                    <p className="text-base font-black text-emerald-400 uppercase italic tracking-tighter leading-none">{payment.Booking?.status}</p>
                                </div>
                            </div>

                            <Link href={`/admin/bookings/${payment.bookingId}`}>
                                <Button className="w-full h-14 bg-white/5 border border-white/10 hover:bg-white hover:text-black text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all group/btn mt-4 shadow-xl shadow-black/20">
                                    Inspect Full Contract <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-[3rem] p-10 shadow-sm space-y-10 group/audit">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 flex items-center gap-3">
                                Node Integrity History
                            </h3>
                            <Activity className="h-4 w-4 text-gray-200 group-hover/audit:text-emerald-400 transition-colors" />
                        </div>
                        <div className="space-y-10 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-50">
                            {[
                                { event: 'Node Initialization', date: payment.createdAt, icon: Activity, desc: 'Master Registry Primary Key Created' },
                                { event: 'Fiscal Sync Cycle', date: payment.date, icon: Clock, desc: 'Transaction Reported to Nexus Core' },
                                { event: 'Security Audit', date: new Date(), icon: ShieldCheck, desc: 'Active Synchronization in Progress' },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-8 relative z-10 group/step">
                                    <div className="h-6 w-6 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center shrink-0 shadow-sm group-hover/step:scale-125 transition-transform duration-300">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-gray-900 uppercase italic tracking-tight">{item.event}</span>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{item.desc}</p>
                                        <span className="text-[9px] font-black text-emerald-600 mt-2 bg-emerald-50 self-start px-2 py-0.5 rounded-full">{format(new Date(item.date), 'MMM dd, HH:mm')}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>


        </div>
    );
};

export default PaymentApprovalDetailPage;
