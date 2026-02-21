"use client"
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ChevronLeft,
    Download,
    CreditCard,
    FileText,
    User,
    Home,
    Receipt,
    Printer,
    Send,
    ShieldCheck,
    Calendar,
    ArrowRight,
    TrendingUp,
    Wallet,
    Loader2,
    Settings,
    Trash2,
    Save,
    X,
    XCircle,
    Building2,
    Activity,
    Clock,
    Eye,
    ChevronRight,
    ExternalLink,
    AlertCircle,
    Mail,
    Phone,
    Edit3,
    ArrowUpRight,
    Zap,
    Boxes,
    Scan,
    Cpu,
    Fingerprint,
    Scale,
    CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePaymentById, useUpdatePayment, useDeletePayment } from "@/hooks/usePayment";
import { format } from "date-fns";
import { toast } from "sonner";

const PaymentDetailPage = () => {
    const params = useParams();
    const router = useRouter();
    const { paymentId } = params;
    const [isNotifying, setIsNotifying] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const { data: payment, isLoading } = usePaymentById(paymentId);
    const updatePayment = useUpdatePayment();
    const deletePayment = useDeletePayment();

    const [editForm, setEditForm] = useState({
        amount: "",
        status: "",
        type: "",
        method: "",
        notes: "",
    });

    useEffect(() => {
        if (payment) {
            setEditForm({
                amount: payment.amount.toString(),
                status: payment.status,
                type: payment.type,
                method: payment.method,
                notes: payment.notes || "",
            });
        }
    }, [payment]);

    const handleUpdate = async () => {
        try {
            await updatePayment.mutateAsync({
                id: paymentId,
                amount: parseFloat(editForm.amount),
                status: editForm.status,
                type: editForm.type,
                method: editForm.method,
                notes: editForm.notes,
            });
            setIsEditDialogOpen(false);
            toast.success("Payment details updated successfully");
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async () => {
        try {
            await deletePayment.mutateAsync(paymentId);
            toast.success("Payment deleted from records");
            router.push("/admin/payments");
        } catch (error) {
            console.error(error);
        }
    };

    const getStatusStyle = (status) => {
        switch (status?.toUpperCase()) {
            case "PAID": return "bg-emerald-50 text-emerald-700 border-emerald-100";
            case "PARTIAL": return "bg-amber-50 text-amber-700 border-amber-100";
            case "PENDING": return "bg-indigo-50 text-indigo-700 border-indigo-100";
            case "OVERDUE": return "bg-rose-50 text-rose-700 border-rose-100";
            default: return "bg-gray-50 text-gray-600 border-gray-100";
        }
    };

    const handleNotify = async () => {
        if (!payment.User?.email) {
            toast.error("User email not available");
            return;
        }

        setIsNotifying(true);
        try {
            const response = await fetch('/api/notifications/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: payment.User.email,
                    subject: `Payment Receipt - ${payment.status === 'PAID' ? 'Confirmed' : 'Pending'} - PKR ${payment.amount.toLocaleString()}`,
                    html: `
                        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                            <h1 style="font-size: 24px; font-weight: 800; margin-bottom: 20px;">Payment ${payment.status === 'PAID' ? 'Receipt' : 'Reminder'}</h1>
                            <p style="color: #666; margin-bottom: 30px;">Dear ${payment.User.name},</p>
                            <div style="background: #f8f8f8; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 8px 0; color: #999; font-size: 12px; text-transform: uppercase;">Amount</td>
                                        <td style="padding: 8px 0; font-weight: 700; text-align: right;">PKR ${payment.amount.toLocaleString()}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #999; font-size: 12px; text-transform: uppercase;">Type</td>
                                        <td style="padding: 8px 0; font-weight: 600; text-align: right;">${payment.type}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #999; font-size: 12px; text-transform: uppercase;">Status</td>
                                        <td style="padding: 8px 0; font-weight: 700; text-align: right; color: ${payment.status === 'PAID' ? '#059669' : '#2563eb'};">${payment.status}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #999; font-size: 12px; text-transform: uppercase;">Date</td>
                                        <ctrl42>(new Date(payment.date), 'MMMM dd, yyyy')</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #999; font-size: 12px; text-transform: uppercase;">Transaction ID</td>
                                        <td style="padding: 8px 0; font-weight: 600; text-align: right; font-family: monospace;">${payment.id.slice(-12).toUpperCase()}</td>
                                    </tr>
                                </table>
                            </div>
                            <p style="color: #666; font-size: 14px;">If you have any questions about this payment, please contact our support team.</p>
                            <p style="color: #999; font-size: 12px; margin-top: 40px;">GreenView Hostels</p>
                        </div>
                    `
                })
            });

            if (response.ok) {
                toast.success(`Receipt sent to ${payment.User.email}`);
            } else {
                toast.error("Failed to send notification");
            }
        } catch (error) {
            console.error("Notification error:", error);
            toast.error("An error occurred while sending notification");
        } finally {
            setIsNotifying(false);
        }
    };

    if (isLoading) return (
        <div className="flex h-screen items-center justify-center bg-white font-sans">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="h-20 w-20 border-[3px] border-gray-100 border-t-indigo-600 rounded-full animate-spin" />
                    <CreditCard className="h-8 w-8 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center">
                    <p className="text-lg font-bold text-gray-900 tracking-tight">Loading Payment...</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">Checking records</p>
                </div>
            </div>
        </div>
    );

    if (!payment) return (
        <div className="flex flex-col items-center justify-center min-h-screen p-20 text-center bg-gray-50/50">
            <div className="h-16 w-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-6">
                <AlertCircle className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Payment Not Found</h3>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-2">This payment record does not exist.</p>
            <Button onClick={() => router.back()} variant="outline" className="mt-8 rounded-xl h-10 px-8 font-bold uppercase tracking-widest text-[9px]">Go Back</Button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 pb-32 font-sans tracking-tight print:bg-transparent print:pb-0">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16 shadow-sm shadow-black/5 print:hidden">
                <div className="max-w-[1600px] mx-auto px-8 h-full flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100 h-9 w-9" onClick={() => router.back()}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="h-6 w-px bg-gray-100" />
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-indigo-600" />
                            <div className="flex flex-col">
                                <h1 className="text-base font-bold text-gray-900 tracking-tight uppercase">Payment Details</h1>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">ID: {payment.id.slice(-12).toUpperCase()}</span>
                                    <Badge variant="outline" className={`${getStatusStyle(payment.status)} text-[8px] px-2 py-0 border`}>
                                        {payment.status}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => window.print()}
                            className="h-9 px-5 rounded-xl border-gray-100 text-gray-600 font-bold text-[9px] uppercase tracking-widest hover:bg-gray-50 transition-all bg-white"
                        >
                            <Printer className="h-3.5 w-3.5 mr-2" />
                            Print Receipt
                        </Button>

                        <Button
                            className="h-9 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[9px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
                            onClick={handleNotify}
                            disabled={isNotifying}
                        >
                            {isNotifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                            Send Notification
                        </Button>

                        <div className="h-6 w-px bg-gray-100 mx-1" />

                        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-gray-100">
                                    <Edit3 className="h-4 w-4 text-gray-500" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md p-0 overflow-hidden border-none rounded-[2rem] shadow-2xl bg-white focus:outline-none">
                                <div className="bg-indigo-600 p-8 text-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/10">
                                            <Settings className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold uppercase tracking-tight">Edit Payment</h3>
                                            <p className="text-[10px] font-medium text-indigo-200 uppercase tracking-widest">Update payment info</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8 space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Payment Amount</Label>
                                        <Input
                                            type="number"
                                            value={editForm.amount}
                                            onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                                            className="h-11 rounded-xl border-gray-100 bg-gray-50/50 font-bold text-xs focus:bg-white transition-all"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Status</Label>
                                            <Select value={editForm.status} onValueChange={(val) => setEditForm({ ...editForm, status: val })}>
                                                <SelectTrigger className="h-11 rounded-xl border-gray-100 font-bold text-[10px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="PENDING">PENDING</SelectItem>
                                                    <SelectItem value="PAID">PAID</SelectItem>
                                                    <SelectItem value="PARTIAL">PARTIAL</SelectItem>
                                                    <SelectItem value="OVERDUE">OVERDUE</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Method</Label>
                                            <Select value={editForm.method} onValueChange={(val) => setEditForm({ ...editForm, method: val })}>
                                                <SelectTrigger className="h-11 rounded-xl border-gray-100 font-bold text-[10px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="CASH">CASH</SelectItem>
                                                    <SelectItem value="BANK_TRANSFER">BANK TRANSFER</SelectItem>
                                                    <SelectItem value="JAZZCASH">JAZZCASH</SelectItem>
                                                    <SelectItem value="EASYPAISA">EASYPAISA</SelectItem>
                                                    <SelectItem value="OTHERS">OTHERS</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Payment Type</Label>
                                        <Select value={editForm.type} onValueChange={(val) => setEditForm({ ...editForm, type: val })}>
                                            <SelectTrigger className="h-11 rounded-xl border-gray-100 font-bold text-[10px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="RENT">RENT</SelectItem>
                                                <SelectItem value="SECURITY_DEPOSIT">SECURITY DEPOSIT</SelectItem>
                                                <SelectItem value="MESS">MESS</SelectItem>
                                                <SelectItem value="UTILITIES">UTILITIES</SelectItem>
                                                <SelectItem value="OTHERS">OTHERS</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Notes</Label>
                                        <Textarea
                                            value={editForm.notes}
                                            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                            className="min-h-[100px] rounded-2xl border-gray-100 bg-gray-50/50 font-medium text-xs focus:bg-white transition-all resize-none"
                                            placeholder="Enter any notes here..."
                                        />
                                    </div>
                                    <div className="pt-4 flex gap-4">
                                        <Button variant="ghost" className="flex-1 rounded-xl h-11 font-bold text-[10px] uppercase tracking-widest text-gray-400" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                                        <Button
                                            className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                                            onClick={handleUpdate}
                                            disabled={updatePayment.isPending}
                                        >
                                            {updatePayment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-rose-50 group">
                                    <Trash2 className="h-4 w-4 text-gray-400 group-hover:text-rose-500 transition-colors" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-[400px] p-0 overflow-hidden border-none rounded-[2rem] shadow-2xl bg-white">
                                <div className="bg-rose-600 p-8 text-white text-center">
                                    <XCircle className="h-16 w-16 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold uppercase tracking-tight">Delete Payment?</h3>
                                    <p className="text-[10px] font-medium text-rose-100 uppercase tracking-widest mt-2">This action cannot be undone</p>
                                </div>
                                <div className="p-8 space-y-6">
                                    <p className="text-sm text-gray-500 font-medium leading-relaxed text-center">Are you sure you want to delete this payment record from the system?</p>
                                    <div className="flex gap-4">
                                        <Button variant="ghost" className="flex-1 rounded-xl h-11 font-bold text-[10px] uppercase tracking-widest text-gray-400" onClick={() => setIsDeleteDialogOpen(false)}>No, Cancel</Button>
                                        <Button
                                            className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-rose-600/20 active:scale-95 transition-all"
                                            onClick={handleDelete}
                                            disabled={deletePayment.isPending}
                                        >
                                            {deletePayment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Yes, Delete'}
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Payment Summary Card */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-8 relative overflow-hidden shadow-sm">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50 rounded-full -mr-24 -mt-24 opacity-60 blur-3xl pointer-events-none" />

                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                            <div className="flex items-center gap-6">
                                <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-sm">
                                    <CreditCard className="h-8 w-8 text-indigo-600" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Payment Amount</span>
                                    <div className="flex items-baseline gap-3">
                                        <h2 className="text-4xl font-bold text-gray-900 tracking-tighter">PKR {payment.amount.toLocaleString()}</h2>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
                                <Badge variant="outline" className={`${getStatusStyle(payment.status)} px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border shadow-sm`}>
                                    {payment.status}
                                </Badge>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Via {payment.method}</p>
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-gray-100">
                            {[
                                { label: 'Payment Date', value: format(new Date(payment.date), 'MMM dd, yyyy'), icon: Calendar, sub: format(new Date(payment.date), 'HH:mm') },
                                { label: 'Payment Type', value: payment.type, icon: Receipt, sub: 'Category' },
                                { label: 'Method', value: payment.method, icon: Building2, sub: 'Channel' },
                                { label: 'Status', value: payment.status === 'PAID' ? 'Confirmed' : 'Pending', icon: Activity, sub: 'Current State' }
                            ].map((item, i) => (
                                <div key={i} className="flex flex-col gap-2 group">
                                    <div className="flex items-center gap-2">
                                        <div className="h-7 w-7 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 border border-gray-100">
                                            <item.icon className="h-3.5 w-3.5 text-gray-400 group-hover:text-white transition-colors" />
                                        </div>
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{item.label}</span>
                                    </div>
                                    <div className="pl-0.5">
                                        <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">{item.value}</p>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{item.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Resident & Room Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Resident Info */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm relative overflow-hidden group">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                                <div className="h-1 w-3 bg-indigo-600 rounded-full" /> Resident Information
                            </h3>
                            <div className="space-y-6 relative z-10">
                                <div className="flex items-center gap-5">
                                    <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-lg font-bold text-indigo-600 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                        {payment.User?.name?.charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Name</span>
                                        <p className="text-base font-bold text-gray-900 uppercase tracking-tight">{payment.User?.name}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-gray-100">
                                    <div className="flex items-center justify-between p-3.5 bg-gray-50/50 rounded-xl border border-gray-100/50 hover:bg-white transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Phone className="h-3.5 w-3.5 text-indigo-500" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Phone</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900 font-mono">{payment.User?.phone || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3.5 bg-gray-50/50 rounded-xl border border-gray-100/50 hover:bg-white transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Mail className="h-3.5 w-3.5 text-indigo-500" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Email</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900 truncate max-w-[160px]">{payment.User?.email || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Property Details */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm relative overflow-hidden group">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                                <div className="h-1 w-3 bg-indigo-600 rounded-full" /> Property Details
                            </h3>
                            <div className="space-y-6 relative z-10">
                                <div className="p-5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/20 group-hover:scale-[1.01] transition-transform duration-300">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                                            <Home className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest">Hostel Name</p>
                                            <p className="text-base font-bold uppercase">{payment.Booking?.Room?.Hostel?.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-bold tracking-tighter">ROOM {payment.Booking?.Room?.roomNumber || 'N/A'}</span>
                                        </div>
                                        <Badge className="bg-white/20 text-white border-none rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase">
                                            Floor {payment.Booking?.Room?.floor || '0'}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3.5 bg-gray-50/50 rounded-xl border border-gray-100/50">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Room Type</span>
                                        <span className="text-sm font-bold text-gray-900 uppercase">{payment.Booking?.Room?.type || 'Standard'}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3.5 bg-gray-50/50 rounded-xl border border-gray-100/50">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">City</span>
                                        <span className="text-sm font-bold text-gray-900 uppercase truncate max-w-[120px]">{payment.Booking?.Room?.Hostel?.city || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Notes */}
                    {payment.notes && (
                        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-3">
                                <FileText className="h-4 w-4 text-gray-400" />
                                Payment Notes
                            </h3>
                            <div className="p-6 bg-gray-50/50 border border-gray-100 rounded-2xl font-medium text-gray-600 leading-relaxed text-sm">
                                {payment.notes}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar */}
                <div className="space-y-8">
                    {/* Booking Reference */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm space-y-6">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                            <Boxes className="h-3.5 w-3.5" /> Booking Reference
                        </h3>

                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Booking ID</span>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-mono font-bold text-gray-900 text-ellipsis overflow-hidden">{payment.bookingId?.toUpperCase()}</p>
                                    <Link href={`/admin/bookings/${payment.bookingId}`}>
                                        <ArrowUpRight className="h-4 w-4 text-indigo-600 shrink-0" />
                                    </Link>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Total Rent</span>
                                    <p className="text-xs font-bold text-gray-900">PKR {payment.Booking?.totalAmount?.toLocaleString()}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Status</span>
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase">Active</p>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Created On</span>
                                    <span className="text-[11px] font-bold text-gray-900">{format(new Date(payment.Booking?.createdAt || Date.now()), 'MMM yyyy')}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Check-In</span>
                                    <span className="text-[11px] font-bold text-gray-900">{payment.Booking?.checkIn ? format(new Date(payment.Booking.checkIn), 'dd/MM/yy') : 'N/A'}</span>
                                </div>
                            </div>

                            <Button className="w-full h-11 bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 border-none font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-sm" onClick={() => router.push(`/admin/bookings/${payment.bookingId}/payments`)}>
                                View Full History <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </div>

                    {/* Payment History Timeline */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm space-y-6 group/audit">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                <Activity className="h-3.5 w-3.5" /> Timeline
                            </h3>
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
                            {[
                                { event: 'Payment Created', date: payment.createdAt, desc: 'Entry added back-office' },
                                { event: 'Amount Confirmed', date: payment.date, desc: 'Funds verified' },
                                { event: 'Last Updated', date: payment.updatedAt, desc: 'Record modifications' },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-6 relative z-10 group/step">
                                    <div className="h-6 w-6 rounded-full bg-white border-2 border-indigo-500 flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300">
                                        <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
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
                </div>
            </main>

            {/* Printable Receipt */}
            <div className="hidden print:block bg-white text-black p-8 max-w-3xl mx-auto">
                {/* Header */}
                <div className="border-b-2 border-gray-900 pb-6 mb-6 flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">Hostel Management</h1>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Official Payment Receipt</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Receipt No.</p>
                        <p className="text-sm font-bold text-gray-900 font-mono">{payment.id.slice(-12).toUpperCase()}</p>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Date</p>
                        <p className="text-sm font-bold text-gray-900">{format(new Date(payment.date), 'MMM dd, yyyy')}</p>
                    </div>
                </div>

                {/* Resident Details */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-2 mb-3">Billed To</h3>
                        <p className="font-bold text-gray-900 uppercase text-sm">{payment.User?.name || payment.Booking?.User?.name || 'N/A'}</p>
                        <p className="text-xs text-gray-600 mt-1">Phone: {payment.User?.phone || payment.Booking?.User?.phone || 'N/A'}</p>
                        <p className="text-xs text-gray-600 mt-0.5">Email: {payment.User?.email || payment.Booking?.User?.email || 'N/A'}</p>
                    </div>
                    <div>
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-2 mb-3">Payment Info</h3>
                        <p className="font-bold text-gray-900 uppercase text-sm">Status: {payment.status}</p>
                        <p className="text-xs text-gray-600 mt-1">Method: {payment.method?.replace('_', ' ')}</p>
                        <p className="text-xs text-gray-600 mt-0.5">Reference: {payment.Booking?.Room?.Hostel?.name || 'N/A'}, Room {payment.Booking?.Room?.roomNumber || 'N/A'}</p>
                    </div>
                </div>

                {/* Payment Breakdown */}
                <div className="mb-8">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-2 mb-3">Transaction Details</h3>
                    <table className="w-full text-left text-sm mb-4">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="py-2 text-xs font-bold text-gray-400 uppercase tracking-widest">Description</th>
                                <th className="py-2 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Amount (PKR)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-gray-100">
                                <td className="py-3 font-medium">{payment.type?.replace('_', ' ') || 'SERVICE'} FEE</td>
                                <td className="py-3 text-right font-mono">{Number(payment.amount).toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td className="py-3 font-bold text-gray-900">Total Paid</td>
                                <td className="py-3 text-right font-bold font-mono text-gray-900">{Number(payment.amount).toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="mt-16 pt-8 border-t border-gray-200 text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Thank you for your business</p>
                    <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-1">This is a system generated receipt and does not require a physical signature.</p>
                </div>
            </div>
        </div>
    );
};

export default PaymentDetailPage;
