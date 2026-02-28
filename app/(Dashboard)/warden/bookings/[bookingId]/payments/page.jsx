"use client"
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ChevronLeft,
    Download,
    Plus,
    ShieldCheck,
    Search,
    Wallet,
    Zap,
    FileText,
    Printer,
    History,
    Receipt,
    TrendingUp,
    AlertCircle,
    ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
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
import { useBookingById } from "@/hooks/useBooking";
import { useCreatePayment, useReconcilePayment } from "@/hooks/usePayment";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { toast } from "sonner";
import { generateInvoice } from "@/lib/utils/invoice-generator";
import useAuthStore from "@/hooks/Authstate";

const PaymentHistoryPage = () => {
    const params = useParams();
    const router = useRouter();
    const { bookingId } = params;

    const { user } = useAuthStore();
    const { data: booking, isLoading } = useBookingById(bookingId);
    const createPayment = useCreatePayment();
    const reconcilePayment = useReconcilePayment();

    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Strict Hostel Access Control
    if (booking && user?.hostelId && booking.Room?.hostelId !== user.hostelId && user.role === 'WARDEN') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/30">
                <div className="text-center space-y-6 max-w-md p-10 bg-white rounded-[2.5rem] shadow-2xl shadow-black/5 border border-gray-100 font-sans">
                    <div className="h-20 w-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto border border-rose-100">
                        <ShieldCheck className="h-10 w-10 text-rose-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight uppercase">Access Restricted</h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2 px-4 leading-loose">
                            YOU ARE ATTEMPTING TO ACCESS FISCAL RECORDS THAT BELONG TO ANOTHER HOSTEL SECTOR. UNAUTHORIZED DATA ACCESS ATTEMPT DETECTED.
                        </p>
                    </div>
                    <Button onClick={() => router.push('/warden/bookings')} className="h-12 px-8 rounded-xl bg-black hover:bg-gray-900 text-white font-bold text-[10px] uppercase tracking-wider w-full shadow-lg">
                        Return to Matrix
                    </Button>
                </div>
            </div>
        );
    }
    const [isReconcileOpen, setIsReconcileOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("ALL");

    const [paymentForm, setPaymentForm] = useState({
        amount: "", type: "RENT", method: "CASH", status: "PENDING", notes: "",
        date: new Date().toISOString().split('T')[0],
        month: new Date().toLocaleString('default', { month: 'long' }),
        year: new Date().getFullYear().toString()
    });

    const [reconcileForm, setReconcileForm] = useState({
        amount: "", method: "BANK_TRANSFER", notes: "Bulk settlement protocol."
    });

    const duplicateWarning = useMemo(() => {
        if (!booking?.Payment) return null;
        const existing = booking.Payment.find(p =>
            (p.type === 'RENT' || p.type === 'MONTHLY_RENT') &&
            p.month === paymentForm.month &&
            p.year === parseInt(paymentForm.year) &&
            !['REJECTED', 'FAILED', 'REFUNDED'].includes(p.status)
        );
        return existing ? `Ledger already has ${paymentForm.month} ${paymentForm.year} (${existing.status})` : null;
    }, [booking?.Payment, paymentForm.month, paymentForm.year]);

    const handleCreatePayment = async (e) => {
        e.preventDefault();
        if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) return toast.error("Valid amount required");
        try {
            await createPayment.mutateAsync({
                bookingId, userId: booking.userId, amount: parseFloat(paymentForm.amount),
                type: paymentForm.type, method: paymentForm.method, status: paymentForm.status,
                notes: paymentForm.notes, date: paymentForm.date,
                month: paymentForm.month, year: paymentForm.year,
                allowDuplicate: !!duplicateWarning
            });
            setIsDialogOpen(false);
            setPaymentForm({
                amount: "", type: "RENT", method: "CASH", status: "PENDING", notes: "",
                date: new Date().toISOString().split('T')[0],
                month: new Date().toLocaleString('default', { month: 'long' }),
                year: new Date().getFullYear().toString()
            });
        } catch (error) { console.error(error); }
    };

    const handleReconcile = async () => {
        if (!reconcileForm.amount || parseFloat(reconcileForm.amount) <= 0) return toast.error("Valid amount required");
        try {
            await reconcilePayment.mutateAsync({
                bookingId, userId: booking.userId, amount: parseFloat(reconcileForm.amount),
                method: reconcileForm.method, notes: reconcileForm.notes
            });
            setIsReconcileOpen(false);
        } catch (error) { console.error(error); }
    };

    const handleExportCSV = () => {
        if (!booking?.Payment) return;
        const headers = ["ID", "Date", "Type", "Amount", "Status", "Method"];
        const rows = booking.Payment.map(p => [p.uid || p.id, new Date(p.date).toLocaleDateString(), p.type, p.amount, p.status, p.method]);
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `ledger_${booking.User.name}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getStatusStyle = (status) => {
        switch (status?.toUpperCase()) {
            case "PAID": return "bg-emerald-50 text-emerald-700 border-emerald-100";
            case "PARTIAL": return "bg-amber-50 text-amber-700 border-amber-100";
            case "PENDING": return "bg-blue-50 text-blue-700 border-blue-100";
            default: return "bg-rose-50 text-rose-700 border-rose-100";
        }
    };

    const getRibbonColor = (status) => {
        switch (status?.toUpperCase()) {
            case "PAID": return "bg-emerald-500";
            case "PARTIAL": return "bg-amber-500";
            case "PENDING": return "bg-blue-500";
            default: return "bg-rose-500";
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
                    <p className="text-lg font-bold text-gray-900 tracking-tight">Syncing Fiscal Ledger...</p>
                    <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-widest text-center">Retrieving Resident Manifest</p>
                </div>
            </div>
        </div>
    );

    if (!booking) return <div className="p-8 text-center text-gray-400 font-bold uppercase tracking-widest">Registry Node Missing</div>;

    const payments = booking.Payment || [];
    const totalContractValue = booking.totalAmount + (booking.securityDeposit || 0);
    const totalPaid = payments.filter(p => p.status === 'PAID').reduce((acc, curr) => acc + curr.amount, 0);
    const outstanding = Math.max(0, totalContractValue - totalPaid);
    const completionRate = totalContractValue > 0 ? Math.round((totalPaid / totalContractValue) * 100) : 0;

    const filteredPayments = payments.filter(p => {
        const matchesSearch = p.id.toLowerCase().includes(searchTerm.toLowerCase()) || p.type.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === "ALL" || p.status === filterStatus;
        return matchesSearch && matchesFilter;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight">
            {/* Minimal Premium Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100 h-9 w-9" onClick={() => router.back()}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="h-6 w-px bg-gray-200" />
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight uppercase">Registry Node</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{booking.User.name}</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={handleExportCSV} className="h-9 px-4 rounded-xl border-gray-200 bg-white font-bold text-[10px] uppercase tracking-wider text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
                            <Download className="h-3.5 w-3.5 mr-2 text-gray-400" />
                            Export CSV
                        </Button>

                        <Dialog open={isReconcileOpen} onOpenChange={setIsReconcileOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="h-9 px-4 rounded-xl border-emerald-200 bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase tracking-wider hover:bg-emerald-100 transition-all shadow-sm">
                                    <Zap className="h-4 w-4 mr-2" />
                                    Bulk Settle
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
                                <div className="bg-emerald-950 p-8 text-white text-center">
                                    <h2 className="text-lg font-bold uppercase tracking-widest mb-1">Waterfall Sync</h2>
                                    <p className="text-[10px] text-emerald-500 uppercase font-black tracking-widest">Autonomous Bulk Reconciliation</p>
                                </div>
                                <div className="p-8 bg-white space-y-6">
                                    <div className="space-y-1.5 text-center">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Settlement PKR</Label>
                                        <Input type="number" className="h-14 rounded-2xl font-black text-2xl text-center border-gray-100 bg-gray-50/50" value={reconcileForm.amount} onChange={(e) => setReconcileForm({ ...reconcileForm, amount: e.target.value })} />
                                    </div>
                                    <Button className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl" onClick={handleReconcile}>Initiate Sync</Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="h-9 px-6 rounded-xl bg-black hover:bg-gray-800 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all active:scale-95">
                                    <Plus className="h-4 w-4 mr-2" />
                                    New Entry
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
                                <div className="bg-gray-950 p-8 text-white text-center">
                                    <h2 className="text-lg font-bold uppercase tracking-widest mb-1">Fiscal Entry</h2>
                                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Manual Transaction Protocol</p>
                                </div>
                                <div className="p-8 bg-white space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold uppercase text-gray-400">Type</Label>
                                            <Select value={paymentForm.type} onValueChange={(v) => setPaymentForm({ ...paymentForm, type: v })}><SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{['RENT', 'DEPOSIT', 'OTHER'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold uppercase text-gray-400">Status</Label>
                                            <Select value={paymentForm.status} onValueChange={(v) => setPaymentForm({ ...paymentForm, status: v })}>
                                                <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                                                <SelectContent>{['PENDING', 'PAID', 'PARTIAL'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5 col-span-2">
                                            <Label className="text-[10px] font-bold uppercase text-gray-400">Amount</Label>
                                            <Input className="h-10 rounded-xl" type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold uppercase text-gray-400">Month</Label>
                                            <Select value={paymentForm.month} onValueChange={(v) => setPaymentForm({ ...paymentForm, month: v })}>
                                                <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                                                        <SelectItem key={m} value={m}>{m}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold uppercase text-gray-400">Year</Label>
                                            <Select value={paymentForm.year} onValueChange={(v) => setPaymentForm({ ...paymentForm, year: v })}>
                                                <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {[2023, 2024, 2025, 2026].map(y => (
                                                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    {(paymentForm.type === 'RENT' || paymentForm.type === 'MONTHLY_RENT') && duplicateWarning && (
                                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 animate-pulse border-2 shadow-sm my-2">
                                            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                                            <div className="space-y-1">
                                                <p className="text-[11px] font-black text-rose-900 uppercase tracking-tight text-left">Duplicate Entry Warning</p>
                                                <p className="text-[10px] font-bold text-rose-600 uppercase leading-snug text-left">{duplicateWarning}</p>
                                            </div>
                                        </div>
                                    )}
                                    <Button className={`w-full h-12 ${duplicateWarning ? 'bg-rose-600 hover:bg-rose-700' : 'bg-black'} text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all`} onClick={handleCreatePayment}>
                                        {duplicateWarning ? 'Commit Duplicate' : 'Commit to Ledger'}
                                    </Button>

                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
                {/* Minimal Metrics Matrix */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Liability', value: `PKR ${totalContractValue.toLocaleString()}`, icon: FileText, color: 'text-black', bg: 'bg-gray-100' },
                        { label: 'Settled Funds', value: `PKR ${totalPaid.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Residual Node', value: `PKR ${outstanding.toLocaleString()}`, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
                        { label: 'Settlement Factor', value: `${completionRate}%`, icon: History, color: 'text-blue-600', bg: 'bg-blue-50' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow cursor-default">
                            <div className={`h-11 w-11 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</span>
                                <span className="text-xl font-bold text-gray-900 tracking-tight">{stat.value}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Operations bar */}
                <div className="bg-white border border-gray-100 rounded-2xl p-2 flex items-center gap-4 shadow-sm">
                    <Search className="h-4 w-4 text-gray-400 ml-4" />
                    <Input placeholder="Identify transaction node..." className="border-none shadow-none font-bold text-sm focus-visible:ring-0 placeholder:text-gray-300" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    <div className="flex items-center gap-2 p-1 bg-gray-50 rounded-xl mr-2">
                        {['ALL', 'PENDING', 'PAID', 'PARTIAL'].map(s => (
                            <Button key={s} variant="ghost" onClick={() => setFilterStatus(s)} className={`h-8 px-4 rounded-lg text-[10px] font-bold uppercase transition-all ${filterStatus === s ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}>{s}</Button>
                        ))}
                    </div>
                </div>

                {/* Transaction Ribbon Feed */}
                <div className="space-y-4">
                    {filteredPayments.length > 0 ? (
                        filteredPayments.map((payment) => (
                            <div key={payment.id} className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col lg:flex-row items-center justify-between gap-6 hover:shadow-md transition-all group relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-1.5 h-full ${getRibbonColor(payment.status)} opacity-70`} />
                                <div className="flex items-center gap-6 flex-1 min-w-0 font-sans">
                                    <div className="h-14 w-14 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-sm shrink-0 group-hover:bg-black transition-colors">
                                        <Receipt className="h-6 w-6 text-gray-400 group-hover:text-white" />
                                    </div>
                                    <div className="flex flex-col min-w-[200px]">
                                        <h4 className="text-base font-bold text-gray-900 uppercase tracking-tight">{format(new Date(payment.date), 'MMMM dd, yyyy')}</h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{payment.type} Node</span>
                                            <span className="h-1 w-1 rounded-full bg-gray-200" />
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{payment.uid || `#${payment.id.slice(-8).toUpperCase()}`}</span>
                                        </div>
                                    </div>
                                    <div className="hidden md:flex flex-col gap-1 min-w-[140px]">
                                        <span className="text-xs font-bold text-gray-900 uppercase">PKR {payment.amount.toLocaleString()}</span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{payment.method} Protocol</span>
                                    </div>
                                    <div className="min-w-[120px] flex justify-center">
                                        <Badge variant="outline" className={`${getStatusStyle(payment.status)} px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border shadow-sm`}>{payment.status}</Badge>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 lg:ml-auto">
                                    <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-400 hover:text-black" onClick={() => generateInvoice(payment, booking)}><Printer className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-400 hover:text-black" onClick={() => generateInvoice(payment, booking)}><Download className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white border border-gray-100 rounded-3xl p-24 text-center border-dashed shadow-sm">
                            <Wallet className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Ledger Node Empty</h3>
                        </div>
                    )}
                </div>


            </main>
        </div>
    );
};

export default PaymentHistoryPage;
