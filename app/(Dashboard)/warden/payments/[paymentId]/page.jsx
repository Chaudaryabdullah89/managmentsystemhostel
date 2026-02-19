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
    Scale
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
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async () => {
        try {
            await deletePayment.mutateAsync(paymentId);
            router.push("/warden/payments");
        } catch (error) {
            console.error(error);
        }
    };

    const getStatusStyle = (status) => {
        switch (status?.toUpperCase()) {
            case "PAID": return "bg-emerald-50 text-emerald-700 border-emerald-100";
            case "PARTIAL": return "bg-amber-50 text-amber-700 border-amber-100";
            case "PENDING": return "bg-blue-50 text-blue-700 border-blue-100";
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
                            <h1>GreenView Hostels</h1>
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
                            <p>GreenView Management Office</p>
                            <p>Sector D, Phase 2, Islamabad</p>
                            <p>Contact: +92 300 1234567</p>
                        </div>
                        <div class="details-block">
                            <h3>BILL TO</h3>
                            <p>${payment.User?.name || 'N/A'}</p>
                            <p>${booking.Room?.Hostel?.name || 'N/A'} - Room ${booking.Room?.roomNumber || 'N/A'}</p>
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
                                    <div>${payment.type?.replace('_', ' ')} PAYMENT</div>
                                    <div style="font-size: 10px; color: #999; margin-top: 5px;">${payment.notes || 'Monthly service fee settlement.'}</div>
                                </td>
                                <td>${payment.method?.replace('_', ' ')}</td>
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
                            <div class="summary-row">
                                <span>Tax (0%)</span>
                                <span>PKR 0</span>
                            </div>
                            <div class="summary-row total">
                                <span>Total</span>
                                <span>PKR ${Number(payment.amount).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>Thank you for choosing GreenView Hostels. For any queries, contact support@greenview.io</p>
                        <p style="margin-top: 10px;">THIS IS A SYSTEM GENERATED RECEIPT AND DOES NOT REQUIRE A SIGNATURE.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    };

    // Handle Receipt Download
    const handleDownloadReceipt = () => {
        const receiptWindow = window.open('', '_blank', 'width=800,height=900');
        receiptWindow.document.write(generateReceiptHTML());
        receiptWindow.document.close();
        toast.success("Receipt opened in new window");
    };

    // Handle Print
    const handlePrint = () => {
        const printWindow = window.open('', '_blank', 'width=800,height=900');
        printWindow.document.write(generateReceiptHTML());
        printWindow.document.close();
        printWindow.onload = () => {
            printWindow.print();
        };
    };

    // Handle Notify User
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
                                        <td style="padding: 8px 0; font-weight: 600; text-align: right;">${format(new Date(payment.date), 'MMMM dd, yyyy')}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #999; font-size: 12px; text-transform: uppercase;">Transaction ID</td>
                                        <td style="padding: 8px 0; font-weight: 600; text-align: right; font-family: monospace;">${payment.id.slice(-12).toUpperCase()}</td>
                                    </tr>
                                </table>
                            </div>
                            <p style="color: #666; font-size: 14px;">If you have any questions about this payment, please contact our support team.</p>
                            <p style="color: #999; font-size: 12px; margin-top: 40px;">GreenView Hostels - Advanced Housing Solutions</p>
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
            toast.error("Failed to send notification");
        } finally {
            setIsNotifying(false);
        }
    };

    if (isLoading) return (
        <div className="flex h-screen items-center justify-center bg-white font-sans">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="h-20 w-20 border-[3px] border-gray-100 border-t-black rounded-full animate-spin" />
                    <Wallet className="h-8 w-8 text-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center">
                    <p className="text-lg font-bold text-gray-900 tracking-tight">Accessing Fiscal Node...</p>
                    <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-widest">Retrieving Transaction Data</p>
                </div>
            </div>
        </div>
    );

    if (!payment) return (
        <div className="p-24 text-center text-gray-400 font-bold uppercase tracking-widest bg-gray-50 h-screen">
            Transaction Node Not Found
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight">
            {/* Minimal Premium Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1400px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100 h-9 w-9" onClick={() => router.back()}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="h-6 w-px bg-gray-200" />
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight uppercase">Payment Detail</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">ID: {payment.id.slice(-12).toUpperCase()}</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="h-9 px-4 rounded-xl border-gray-200 bg-white font-bold text-[10px] uppercase tracking-wider text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
                            onClick={handleDownloadReceipt}
                        >
                            <Download className="h-3.5 w-3.5 mr-2 text-gray-400" />
                            Receipt
                        </Button>
                        <Button
                            variant="outline"
                            className="h-9 px-4 rounded-xl border-gray-200 bg-white font-bold text-[10px] uppercase tracking-wider text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
                            onClick={handlePrint}
                        >
                            <Printer className="h-3.5 w-3.5 mr-2 text-gray-400" />
                            Print
                        </Button>
                        <Button
                            className="h-9 px-6 rounded-xl bg-black hover:bg-gray-800 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all active:scale-95"
                            onClick={handleNotify}
                            disabled={isNotifying}
                        >
                            {isNotifying ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4 mr-2" />
                            )}
                            {isNotifying ? "Sending..." : "Notify"}
                        </Button>

                        <div className="h-6 w-px bg-gray-200 mx-2" />

                        {/* Edit Transaction */}
                        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="h-9 w-9 rounded-xl border-gray-200 hover:bg-gray-50 shadow-sm p-0">
                                    <Settings className="h-4 w-4 text-gray-500" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] rounded-2xl">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-bold uppercase tracking-tight">Edit Transaction Node</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-6 py-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Settlement Amount</Label>
                                        <Input
                                            type="number"
                                            value={editForm.amount}
                                            onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                                            className="h-10 rounded-xl border-gray-200 focus:ring-black"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Status Protocol</Label>
                                            <Select value={editForm.status} onValueChange={(val) => setEditForm({ ...editForm, status: val })}>
                                                <SelectTrigger className="h-10 rounded-xl border-gray-200">
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
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Payment Method</Label>
                                            <Select value={editForm.method} onValueChange={(val) => setEditForm({ ...editForm, method: val })}>
                                                <SelectTrigger className="h-10 rounded-xl border-gray-200">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="CASH">CASH</SelectItem>
                                                    <SelectItem value="BANK_TRANSFER">BANK TRANSFER</SelectItem>
                                                    <SelectItem value="JAZZCASH">JAZZ CASH</SelectItem>
                                                    <SelectItem value="EASYPAISA">EASYPAISA</SelectItem>
                                                    <SelectItem value="OTHERS">OTHERS</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Fiscal Type</Label>
                                        <Select value={editForm.type} onValueChange={(val) => setEditForm({ ...editForm, type: val })}>
                                            <SelectTrigger className="h-10 rounded-xl border-gray-200">
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
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Audit Notes</Label>
                                        <Textarea
                                            value={editForm.notes}
                                            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                            className="rounded-xl border-gray-200 focus:ring-black min-h-[100px]"
                                            placeholder="Enter administrative notes..."
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="ghost" className="rounded-xl font-bold text-xs" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                                    <Button
                                        className="rounded-xl bg-black text-white hover:bg-gray-800 font-bold text-xs"
                                        onClick={handleUpdate}
                                        disabled={updatePayment.isPending}
                                    >
                                        {updatePayment.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Save className="h-3 w-3 mr-2" />}
                                        Override Node
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* Delete Transaction */}
                        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="h-9 w-9 rounded-xl border-rose-100 hover:bg-rose-50 shadow-sm p-0">
                                    <Trash2 className="h-4 w-4 text-rose-500" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[400px] rounded-2xl">
                                <DialogHeader>
                                    <XCircle className="h-12 w-12 text-rose-500 mb-4" />
                                    <DialogTitle className="text-xl font-bold uppercase tracking-tight text-gray-900">Terminate Transaction?</DialogTitle>
                                    <p className="text-sm text-gray-500 mt-2">This action will permanently purge this fiscal record from the global ledger. This action cannot be reversed.</p>
                                </DialogHeader>
                                <DialogFooter className="mt-6 flex gap-3">
                                    <Button variant="ghost" className="flex-1 rounded-xl font-bold text-xs" onClick={() => setIsDeleteDialogOpen(false)}>Abort</Button>
                                    <Button
                                        variant="destructive"
                                        className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold text-xs"
                                        onClick={handleDelete}
                                        disabled={deletePayment.isPending}
                                    >
                                        {deletePayment.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Trash2 className="h-3 w-3 mr-2" />}
                                        Terminate Node
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            <main className="max-w-[1400px] mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Settlement Magnitude Card */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="flex items-center gap-6">
                                <div className="h-16 w-16 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                                    <CreditCard className="h-8 w-8 text-emerald-600" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Settlement Magnitude</span>
                                    <span className="text-4xl font-bold text-gray-900 tracking-tight mt-1">PKR {payment.amount.toLocaleString()}</span>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">{payment.method} Protocol</span>
                                </div>
                            </div>

                            <Badge variant="outline" className={`${getStatusStyle(payment.status)} px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border-2 shadow-sm`}>
                                {payment.status}
                            </Badge>
                        </div>
                    </div>

                    {/* Human Asset Identity */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-3">
                            <User className="h-4 w-4 text-gray-400" />
                            Resident Information
                        </h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Name</span>
                                <p className="text-sm font-bold text-gray-900">{payment.User?.name}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</span>
                                <p className="text-sm font-bold text-gray-900">{payment.User?.email}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone</span>
                                <p className="text-sm font-bold text-gray-900">{payment.User?.phone || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Spatial Allocation */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-3">
                            <Home className="h-4 w-4 text-gray-400" />
                            Property Details
                        </h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Property</span>
                                <p className="text-sm font-bold text-gray-900">{payment.Booking?.Room?.Hostel?.name || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Unit Number</span>
                                <p className="text-sm font-bold text-gray-900">{payment.Booking?.Room?.roomNumber || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Location</span>
                                <p className="text-sm font-bold text-gray-900">{payment.Booking?.Room?.Hostel?.city || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type</span>
                                <p className="text-sm font-bold text-gray-900">{payment.Booking?.Room?.type || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Audit Registry Notes */}
                    {payment.notes && (
                        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-3">
                                <FileText className="h-4 w-4 text-gray-400" />
                                Transaction Notes
                            </h3>
                            <p className="text-sm text-gray-600 leading-relaxed">{payment.notes}</p>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-8">
                    {/* Booking Context */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">Booking Context</h3>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Booking ID</span>
                                <p className="text-xs font-bold text-gray-900 font-mono">{payment.bookingId?.slice(-12).toUpperCase() || 'N/A'}</p>
                            </div>
                            <Separator />
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Check-in</span>
                                <p className="text-xs font-bold text-gray-900">{payment.Booking?.checkIn ? format(new Date(payment.Booking.checkIn), 'MMM dd, yyyy') : 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Check-out</span>
                                <p className="text-xs font-bold text-gray-900">{payment.Booking?.checkOut ? format(new Date(payment.Booking.checkOut), 'MMM dd, yyyy') : 'Ongoing'}</p>
                            </div>
                            <Separator />
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Amount</span>
                                <p className="text-xs font-bold text-gray-900">PKR {payment.Booking?.totalAmount?.toLocaleString() || '0'}</p>
                            </div>
                        </div>

                        {payment.bookingId && (
                            <Link href={`/warden/bookings/${payment.bookingId}/payments`}>
                                <Button variant="outline" className="w-full mt-6 h-10 rounded-xl border-gray-200 font-bold text-[10px] uppercase tracking-wider hover:bg-gray-50 transition-all shadow-sm">
                                    View Full Ledger
                                    <ArrowRight className="h-3.5 w-3.5 ml-2" />
                                </Button>
                            </Link>
                        )}
                    </div>

                    {/* Execution Timeline */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">Timeline</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Transaction Date</span>
                                    <p className="text-xs font-bold text-gray-900">{format(new Date(payment.date), 'MMMM dd, yyyy')}</p>
                                    <p className="text-[10px] text-gray-400">{format(new Date(payment.date), 'hh:mm a')}</p>
                                </div>
                            </div>

                            {payment.dueDate && (
                                <>
                                    <Separator />
                                    <div className="flex items-start gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center border border-amber-100 shrink-0">
                                            <Calendar className="h-4 w-4 text-amber-600" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Due Date</span>
                                            <p className="text-xs font-bold text-gray-900">{format(new Date(payment.dueDate), 'MMMM dd, yyyy')}</p>
                                        </div>
                                    </div>
                                </>
                            )}

                            <Separator />
                            <div className="flex items-start gap-3">
                                <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0">
                                    <TrendingUp className="h-4 w-4 text-gray-400" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Updated</span>
                                    <p className="text-xs font-bold text-gray-900">{format(new Date(payment.updatedAt), 'MMM dd, yyyy')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>


        </div>
    );
};

export default PaymentDetailPage;
