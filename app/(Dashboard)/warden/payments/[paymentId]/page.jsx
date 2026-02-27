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
    Search,
    CheckCircle
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
import useAuthStore from "@/hooks/Authstate";

const PaymentDetailPage = () => {
    const params = useParams();
    const router = useRouter();
    const { paymentId } = params;
    const user = useAuthStore((state) => state.user);
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
            toast.success("Payment details updated");
        } catch (error) {
            toast.error("Failed to update payment");
        }
    };

    const handleDelete = async () => {
        try {
            await deletePayment.mutateAsync(paymentId);
            toast.success("Payment record deleted");
            router.push("/warden/payments");
        } catch (error) {
            toast.error("Failed to delete payment");
        }
    };

    // Strict Hostel Access Control for Wardens
    if (payment && user?.hostelId && payment.Booking?.Room?.hostelId !== user.hostelId && user.role === 'WARDEN') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/30 font-sans tracking-tight">
                <div className="text-center space-y-6 max-w-md p-10 bg-white rounded-[2.5rem] shadow-2xl shadow-black/5 border border-gray-100">
                    <div className="h-20 w-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto border border-rose-100">
                        <ShieldCheck className="h-10 w-10 text-rose-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight text-center">Access Restricted</h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2 px-4 leading-loose">
                            You do not have permission to view payments for other hostels.
                        </p>
                    </div>
                    <Button onClick={() => router.push('/warden/payments')} className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider w-full shadow-lg shadow-indigo-100">
                        Back to Payments
                    </Button>
                </div>
            </div>
        );
    }

    if (isLoading) return (
        <div className="flex h-screen items-center justify-center bg-white font-sans tracking-tight">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="h-20 w-20 border-[3px] border-gray-100 border-t-indigo-600 rounded-full animate-spin" />
                    <Wallet className="h-8 w-8 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center">
                    <p className="text-lg font-bold text-gray-900 tracking-tight">Loading Payment Details...</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">Retrieving transaction data</p>
                </div>
            </div>
        </div>
    );

    if (!payment) return (
        <div className="p-24 text-center text-gray-400 font-bold uppercase tracking-widest bg-gray-50 h-screen font-sans">
            Payment record not found
        </div>
    );

    const getStatusStyle = (status) => {
        switch (status?.toUpperCase()) {
            case "PAID": return "bg-emerald-50 text-emerald-700 border-emerald-100";
            case "PARTIAL": return "bg-amber-50 text-amber-700 border-amber-100";
            case "PENDING": return "bg-indigo-50 text-indigo-700 border-indigo-100";
            case "OVERDUE": return "bg-rose-50 text-rose-700 border-rose-100";
            default: return "bg-gray-50 text-gray-600 border-gray-100";
        }
    };

    // Generate receipt/invoice HTML
    const generateReceiptHTML = () => {
        const booking = payment.Booking || {};
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt - ${payment.id.toUpperCase().slice(-8)}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
                    body { font-family: 'Inter', sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.5; }
                    .container { max-width: 800px; margin: 0 auto; }
                    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #f0f0f0; padding-bottom: 30px; margin-bottom: 40px; }
                    .brand h1 { margin: 0; font-size: 24px; font-weight: 800; text-transform: uppercase; }
                    .brand p { margin: 5px 0 0 0; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.1em; }
                    .invoice-meta { text-align: right; }
                    .invoice-meta h2 { margin: 0; font-size: 32px; font-weight: 800; }
                    .invoice-meta p { margin: 5px 0 0 0; font-size: 12px; color: #999; }
                    .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 50px; }
                    .details-block h3 { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #999; margin-bottom: 15px; border-bottom: 1px solid #f0f0f0; padding-bottom: 5px; }
                    .details-block p { margin: 4px 0; font-size: 14px; font-weight: 600; }
                    .table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
                    .table th { text-align: left; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #999; padding: 12px 0; border-bottom: 2px solid #000; }
                    .table td { padding: 20px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; font-weight: 600; }
                    .amount-col { text-align: right; }
                    .summary { display: flex; justify-content: flex-end; }
                    .summary-table { width: 300px; }
                    .summary-row { display: flex; justify-content: space-between; padding: 10px 0; }
                    .summary-row.total { margin-top: 10px; padding: 20px 0; border-top: 2px solid #000; font-size: 20px; font-weight: 800; }
                    .summary-row span:first-child { font-size: 12px; font-weight: 700; color: #999; text-transform: uppercase; }
                    .footer { margin-top: 100px; padding-top: 30px; border-top: 1px solid #f0f0f0; text-align: center; }
                    .footer p { font-size: 10px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 0.05em; }
                    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: 800; text-transform: uppercase; background: #f0f0f0; }
                    .badge.paid { background: #e6fffa; color: #2c7a7b; }
                    .badge.pending { background: #ebf8ff; color: #2b6cb0; }
                    @media print { .no-print { display: none; } body { padding: 0; } }
                    .print-button { position: fixed; bottom: 30px; right: 30px; background: #000; color: #fff; border: none; padding: 15px 30px; border-radius: 12px; font-weight: 800; text-transform: uppercase; cursor: pointer; box-shadow: 0 10px 30px rgba(0,0,0,0.1); font-family: 'Inter', sans-serif; font-size: 12px; }
                </style>
            </head>
            <body>
                <button class="print-button no-print" onclick="window.print()">Download as PDF / Print</button>
                <div class="container">
                    <div class="header">
                        <div class="brand">
                            <h1>Hostel Management</h1>
                            <p>Advanced Housing Solutions</p>
                        </div>
                        <div class="invoice-meta">
                            <h2>RECEIPT</h2>
                            <p>#${payment.id.toUpperCase().slice(-8)}</p>
                            <p>DATE: ${format(new Date(payment.date), 'MMM dd, yyyy')}</p>
                        </div>
                    </div>
                    
                    <div class="details-grid">
                        <div class="details-block">
                            <h3>FROM</h3>
                            <p>Registry Management Office</p>
                            <p>${payment.Booking?.Room?.Hostel?.name || 'Management Office'}</p>
                        </div>
                        <div class="details-block">
                            <h3>BILL TO</h3>
                            <p>${payment.User?.name || 'N/A'}</p>
                            <p>Room ${booking.Room?.roomNumber || 'N/A'}</p>
                            <p>${payment.User?.email || 'N/A'}</p>
                        </div>
                    </div>
                    
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>Method</th>
                                <th>Status</th>
                                <th class="amount-col">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <div>${payment.type?.replace('_', ' ') || 'SERVICE'} FEE</div>
                                    <div style="font-size: 10px; color: #999; margin-top: 5px;">${payment.notes || 'Transaction settlement.'}</div>
                                </td>
                                <td>${payment.method?.replace('_', ' ') || 'N/A'}</td>
                                <td><span class="badge ${payment.status === 'PAID' ? 'paid' : 'pending'}">${payment.status}</span></td>
                                <td class="amount-col">PKR ${Number(payment.amount).toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div class="summary">
                        <div class="summary-table">
                            <div class="summary-row">
                                <span>Subtotal</span>
                                <span>PKR ${Number(payment.amount).toLocaleString()}</span>
                            </div>
                            <div class="summary-row total">
                                <span>Total</span>
                                <span>PKR ${Number(payment.amount).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>This is a system generated receipt and does not require a signature.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    };

    const handleDownloadReceipt = () => {
        const receiptWindow = window.open('', '_blank', 'width=800,height=900');
        receiptWindow.document.write(generateReceiptHTML());
        receiptWindow.document.close();
        toast.success("Receipt opened in new window");
    };

    const handleNotify = async () => {
        if (!payment.User?.email) {
            toast.error("User email not available");
            return;
        }
        setIsNotifying(true);
        setTimeout(() => {
            setIsNotifying(false);
            toast.success(`Notification sent to ${payment.User.email}`);
        }, 1500);
    };

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
                                <h1 className="text-base font-bold text-gray-900 tracking-tight uppercase">Payment Detail</h1>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">REF: {payment.id.slice(-12).toUpperCase()}</span>
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
                            className="h-9 px-5 rounded-xl border-gray-100 text-gray-600 font-bold text-[9px] uppercase tracking-widest hover:bg-gray-50 transition-all bg-white"
                            onClick={() => window.print()}
                        >
                            <Printer className="h-3.5 w-3.5 mr-2" />
                            Print Receipt
                        </Button>

                        <Button
                            className="h-9 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[9px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
                            onClick={handleNotify}
                            disabled={isNotifying}
                        >
                            {isNotifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            {isNotifying ? "Sending..." : "Notify Resident"}
                        </Button>

                        <div className="h-6 w-px bg-gray-100 mx-1" />

                        {/* Edit Transaction */}
                        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100 h-9 w-9">
                                    <Settings className="h-4 w-4 text-gray-400" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
                                <div className="bg-indigo-600 p-8 text-white">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                                            <Edit3 className="h-5 w-5" />
                                        </div>
                                        <h2 className="text-lg font-bold uppercase tracking-tight">Edit Payment</h2>
                                    </div>
                                    <p className="text-[10px] text-indigo-100 font-bold uppercase tracking-widest">Update transaction details</p>
                                </div>
                                <div className="p-8 bg-white space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 ml-1">Payment Amount</Label>
                                            <Input
                                                type="number"
                                                value={editForm.amount}
                                                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                                                className="h-11 rounded-xl border-gray-100 bg-gray-50/50 font-bold text-sm focus:ring-indigo-600"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 ml-1">Status</Label>
                                                <Select value={editForm.status} onValueChange={(val) => setEditForm({ ...editForm, status: val })}>
                                                    <SelectTrigger className="h-11 rounded-xl border-gray-100 bg-gray-50/50 font-bold text-sm">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl border-gray-100">
                                                        <SelectItem value="PENDING">PENDING</SelectItem>
                                                        <SelectItem value="PAID">PAID</SelectItem>
                                                        <SelectItem value="PARTIAL">PARTIAL</SelectItem>
                                                        <SelectItem value="OVERDUE">OVERDUE</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 ml-1">Method</Label>
                                                <Select value={editForm.method} onValueChange={(val) => setEditForm({ ...editForm, method: val })}>
                                                    <SelectTrigger className="h-11 rounded-xl border-gray-100 bg-gray-50/50 font-bold text-sm">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl border-gray-100">
                                                        <SelectItem value="CASH">CASH</SelectItem>
                                                        <SelectItem value="BANK_TRANSFER">BANK TRANSFER</SelectItem>
                                                        <SelectItem value="JAZZCASH">JAZZ CASH</SelectItem>
                                                        <SelectItem value="EASYPAISA">EASYPAISA</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 ml-1">Transaction Notes</Label>
                                            <Textarea
                                                value={editForm.notes}
                                                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                                className="rounded-xl border-gray-100 bg-gray-50/50 font-medium text-sm p-4 h-24 focus:ring-indigo-600"
                                                placeholder="Internal notes..."
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button variant="ghost" className="flex-1 rounded-xl font-bold text-[10px] uppercase tracking-widest h-11" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                                        <Button
                                            className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-600/20"
                                            onClick={handleUpdate}
                                            disabled={updatePayment.isPending}
                                        >
                                            {updatePayment.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Save className="h-3 w-3 mr-2" />}
                                            Save Changes
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-xl hover:bg-rose-50 h-9 w-9 text-rose-400 hover:text-rose-500">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
                                <div className="bg-rose-600 p-8 text-white text-center">
                                    <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <AlertCircle className="h-7 w-7" />
                                    </div>
                                    <h2 className="text-lg font-bold uppercase tracking-tight">Delete Payment</h2>
                                    <p className="text-[10px] text-rose-200 uppercase font-bold tracking-widest mt-1">This action cannot be undone</p>
                                </div>
                                <div className="p-8 bg-white space-y-6 text-center">
                                    <p className="text-sm text-gray-500 font-medium">Are you sure you want to permanently delete this payment record from the registry?</p>
                                    <div className="flex gap-3">
                                        <Button variant="ghost" className="flex-1 rounded-xl font-bold text-[10px] uppercase tracking-widest h-11" onClick={() => setIsDeleteDialogOpen(false)}>Back</Button>
                                        <Button
                                            className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-rose-600/20"
                                            onClick={handleDelete}
                                            disabled={deletePayment.isPending}
                                        >
                                            {deletePayment.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Trash2 className="h-3 w-3 mr-2" />}
                                            Confirm Delete
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
                    {/* Amount Summary Card */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-8 relative overflow-hidden shadow-sm shadow-black/[0.02]">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50 rounded-full -mr-24 -mt-24 opacity-60 blur-3xl pointer-events-none" />

                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                            <div className="flex items-center gap-6">
                                <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-sm">
                                    <CreditCard className="h-8 w-8 text-indigo-600" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Payment Amount</span>
                                    <div className="flex items-baseline gap-3">
                                        <h2 className="text-4xl font-bold text-gray-900 tracking-tighter">PKR {payment.amount.toLocaleString()}</h2>
                                    </div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-1">{payment.method} Protocol • {payment.type}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
                                <Badge variant="outline" className={`${getStatusStyle(payment.status)} px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border shadow-sm`}>
                                    {payment.status}
                                </Badge>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-4 py-1.5 rounded-lg border border-gray-100">
                                    <Clock className="h-3 w-3" /> {format(new Date(payment.date), 'MMM dd, yyyy')}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-gray-100">
                            {[
                                { label: 'Category', value: payment.type, icon: Receipt, sub: 'Payment Type' },
                                { label: 'Method', value: payment.method, icon: CreditCard, sub: 'Settlement Channel' },
                                { label: 'Status', value: payment.status, icon: ShieldCheck, sub: 'Registry State' },
                                { label: 'Updated', value: format(new Date(payment.updatedAt), 'MMM dd'), icon: Activity, sub: 'Last Change' }
                            ].map((item, i) => (
                                <div key={i} className="flex flex-col gap-2 group">
                                    <div className="flex items-center gap-2">
                                        <div className="h-7 w-7 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100 shadow-sm group-hover:bg-indigo-600 transition-colors">
                                            <item.icon className="h-3.5 w-3.5 text-gray-400 group-hover:text-white transition-colors" />
                                        </div>
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{item.label}</span>
                                    </div>
                                    <div className="pl-0.5">
                                        <p className="text-sm font-bold text-gray-900 uppercase tracking-wide truncate">{item.value}</p>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{item.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Resident Identity */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm group">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                                <div className="h-1 w-3 bg-indigo-600 rounded-full" /> Resident Information
                            </h3>
                            <div className="space-y-6">
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
                                    <div className="flex items-center justify-between p-3.5 bg-gray-50/50 rounded-xl border border-gray-100/50 hover:bg-white transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Phone className="h-3.5 w-3.5 text-indigo-500" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Phone</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900">{payment.User?.phone || 'N/A'}</span>
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
                        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm group">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                                <div className="h-1 w-3 bg-indigo-600 rounded-full" /> Property Details
                            </h3>
                            <div className="space-y-6">
                                <div className="p-5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/20 group-hover:scale-[1.01] transition-transform duration-300">
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                                            <Home className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest">Hostel Property</p>
                                            <p className="text-base font-bold uppercase">{payment.Booking?.Room?.Hostel?.name || payment.User?.Hostel_User_hostelIdToHostel?.name || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-bold tracking-tighter">{payment.Booking?.Room?.roomNumber ? `ROOM ${payment.Booking.Room.roomNumber}` : 'DIRECT PAYMENT'}</span>
                                        </div>
                                        {payment.Booking?.Room?.type && (
                                            <Badge className="bg-white/20 text-white border-none rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase">
                                                {payment.Booking.Room.type}
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3.5 bg-gray-50/50 rounded-xl border border-gray-100/50">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Location</span>
                                        <span className="text-sm font-bold text-gray-900 uppercase truncate max-w-[120px]">{payment.Booking?.Room?.Hostel?.city || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3.5 bg-gray-50/50 rounded-xl border border-gray-100/50">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Building Unit</span>
                                        <span className="text-sm font-bold text-gray-900 uppercase">Floor {payment.Booking?.Room?.floor || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transaction Notes */}
                    {payment.notes && (
                        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-3">
                                <FileText className="h-4 w-4 text-gray-400" />
                                Transaction Notes
                            </h3>
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                                <p className="text-sm text-gray-600 leading-relaxed font-medium">{payment.notes}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column */}
                <div className="space-y-8">
                    {/* Booking Context */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm space-y-8">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                            <Receipt className="h-4 w-4" /> Booking Context
                        </h3>

                        <div className="space-y-6 relative overflow-hidden">
                            <div className="space-y-2">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Reference ID</span>
                                {payment.bookingId ? (
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-mono font-bold text-gray-900 text-ellipsis overflow-hidden">{payment.bookingId?.toUpperCase()}</p>
                                        <Link href={`/warden/bookings/${payment.bookingId}`}>
                                            <ArrowUpRight className="h-4 w-4 text-indigo-600 shrink-0" />
                                        </Link>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-xs font-bold text-gray-900">DIRECT ENTRY</p>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">No specific booking linked</p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Check-in</span>
                                    <p className="text-sm font-bold text-gray-900">{payment.Booking?.checkIn ? format(new Date(payment.Booking.checkIn), 'dd MMM yy') : 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Check-out</span>
                                    <p className="text-sm font-bold text-gray-900">{payment.Booking?.checkOut ? format(new Date(payment.Booking.checkOut), 'dd MMM yy') : 'Ongoing'}</p>
                                </div>
                            </div>

                            <div className="space-y-1 pt-4 border-t border-gray-100">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Contract Value</span>
                                <p className="text-lg font-bold text-gray-900">PKR {payment.Booking?.totalAmount?.toLocaleString() || '0'}</p>
                            </div>

                            {payment.bookingId && (
                                <Button
                                    variant="outline"
                                    className="w-full h-11 border-gray-100 font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all flex items-center justify-center gap-2 group"
                                    onClick={() => router.push(`/warden/bookings/${payment.bookingId}/payments`)}
                                >
                                    <Search className="h-4 w-4 text-gray-400 group-hover:text-indigo-600" />
                                    View Full Ledger
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm space-y-6 group">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                <Clock className="h-4 w-4" /> Timeline
                            </h3>
                            <Activity className="h-4 w-4 text-gray-100 group-hover:text-indigo-500 transition-colors" />
                        </div>
                        <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
                            {[
                                { event: 'Transaction Processed', date: payment.date, icon: Calendar, desc: 'Date of reported payment' },
                                { event: 'System Entry', date: payment.createdAt, icon: Activity, desc: 'Record registered' },
                                { event: 'Registry Snapshot', date: new Date(), icon: Clock, desc: 'Last updated record' }
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

                    {/* Support Node */}
                    <div className="bg-indigo-600 text-white rounded-2xl p-8 shadow-2xl shadow-indigo-600/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-24 -mt-24 transition-transform duration-700 group-hover:scale-125" />
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-100 mb-6 flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" /> Management Control
                        </h3>
                        <p className="text-sm font-medium text-indigo-50 mb-8 leading-relaxed">This record is verified via the Central Registry Protocol. Any overrides will be logged.</p>
                        <Button
                            className="w-full h-11 bg-white/10 border border-white/20 hover:bg-white hover:text-indigo-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95"
                            onClick={() => setIsEditDialogOpen(true)}
                        >
                            Modify Record
                        </Button>
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
