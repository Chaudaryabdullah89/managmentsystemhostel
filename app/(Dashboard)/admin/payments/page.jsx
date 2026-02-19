"use client"
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    DollarSign,
    Calendar,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Clock,
    Search,
    Filter,
    Download,
    Eye,
    User,
    Home,
    CreditCard,
    TrendingUp,
    TrendingDown,
    Info,
    FileText,
    ChevronRight,
    Receipt,
    Building2,
    RefreshCw,
    LayoutGrid,
    Table as TableIcon,
    ArrowUpRight,
    ArrowRight,
    CheckCircle,
    Loader2,
    ExternalLink,
    Building,
    Settings2,
    Trash2,
    Save,
    MoreVertical,
    Activity,
    ShieldCheck,
    Zap,
    Boxes,
    Scan,
    Plus,
    Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    useAllPayments,
    useFinancialStats,
    useUpdatePayment,
    useDeletePayment
} from "@/hooks/usePayment";
import { useHostel } from "@/hooks/usehostel";
import { format } from "date-fns";
import { toast } from "sonner";
import UnifiedReceipt from "@/components/receipt/UnifiedReceipt";

const PaymentManagementPage = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("ledger");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");
    const [filterHostel, setFilterHostel] = useState("All");

    // Approval Logic States
    const [rejectionReason, setRejectionReason] = useState("");
    const [selectedPaymentId, setSelectedPaymentId] = useState(null);
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

    // Edit & Delete States
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({
        amount: 0,
        status: "",
        method: "",
        notes: ""
    });

    const { data: paymentsData, isLoading: paymentsLoading } = useAllPayments({ limit: 1000 });
    const { data: stats, isLoading: statsLoading } = useFinancialStats();
    const { data: hostelsData } = useHostel();
    const updatePayment = useUpdatePayment();
    const deletePayment = useDeletePayment();

    const hostels = hostelsData?.data || [];

    // Unified Filtering Logic
    const filteredPayments = useMemo(() => {
        const payments = paymentsData?.payments || [];
        return payments.filter(payment => {
            const matchesSearch = !searchQuery ||
                payment.User?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                payment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                payment.Booking?.Room?.roomNumber?.toString().includes(searchQuery);

            const matchesHostel = filterHostel === "All" || payment.Booking?.Room?.Hostel?.name === filterHostel;

            if (activeTab === "verification") {
                return (payment.status === 'PENDING' || payment.status === 'PARTIAL') && matchesSearch && matchesHostel;
            }

            const matchesStatus = filterStatus === "All" || payment.status === filterStatus;
            return matchesStatus && matchesHostel && matchesSearch;
        });
    }, [paymentsData, filterStatus, filterHostel, searchQuery, activeTab]);

    const handleApprove = async (paymentId) => {
        try {
            await updatePayment.mutateAsync({
                id: paymentId,
                status: 'PAID'
            });
            toast.success("Payment approved");
        } catch (error) {
            toast.error("Failed to approve payment");
        }
    };

    const handleReject = async () => {
        if (!selectedPaymentId || !rejectionReason) return;
        try {
            await updatePayment.mutateAsync({
                id: selectedPaymentId,
                status: 'REJECTED',
                notes: rejectionReason
            });
            toast.success("Payment rejected");
            setIsRejectDialogOpen(false);
            setRejectionReason("");
            setSelectedPaymentId(null);
        } catch (error) {
            toast.error("Failed to reject payment");
        }
    };

    const handleEditOpen = (payment) => {
        setSelectedPaymentId(payment.id);
        setEditFormData({
            amount: payment.amount,
            status: payment.status,
            method: payment.method,
            notes: payment.notes || ""
        });
        setIsEditDialogOpen(true);
    };

    const handleEditSubmit = async () => {
        try {
            await updatePayment.mutateAsync({
                id: selectedPaymentId,
                ...editFormData
            });
            setIsEditDialogOpen(false);
            toast.success("Changes saved");
        } catch (error) {
            // Error handled by hook
        }
    };

    const handleDeleteClick = (paymentId) => {
        setSelectedPaymentId(paymentId);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            await deletePayment.mutateAsync(selectedPaymentId);
            setIsDeleteDialogOpen(false);
            setSelectedPaymentId(null);
            toast.success("Payment deleted");
        } catch (error) {
            // Error handled by hook
        }
    };

    const getStatusStyle = (status) => {
        switch (status?.toUpperCase()) {
            case "PAID": return "bg-emerald-50 text-emerald-700 border-emerald-100";
            case "PARTIAL": return "bg-amber-50 text-amber-700 border-amber-100";
            case "PENDING": return "bg-blue-50 text-blue-700 border-blue-100";
            case "OVERDUE": return "bg-rose-50 text-rose-700 border-rose-100";
            case "REJECTED": return "bg-gray-100 text-gray-700 border-gray-200";
            default: return "bg-gray-50 text-gray-600 border-gray-100";
        }
    };

    const getRibbonColor = (status) => {
        switch (status?.toUpperCase()) {
            case "PAID": return "bg-emerald-500";
            case "PARTIAL": return "bg-amber-500";
            case "PENDING": return "bg-blue-600";
            case "OVERDUE": return "bg-rose-500";
            case "REJECTED": return "bg-gray-900";
            default: return "bg-gray-400";
        }
    };

    if (paymentsLoading || statsLoading) return (
        <div className="flex h-screen items-center justify-center bg-white font-sans">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="h-20 w-20 border-[3px] border-gray-100 border-t-blue-600 rounded-full animate-spin" />
                    <Wallet className="h-8 w-8 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center">
                    <p className="text-lg font-bold text-gray-900 tracking-tight">Loading Payments...</p>
                    <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-widest">Searching records...</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-1 bg-blue-600 rounded-full" />
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight uppercase">Payments</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">All Records</span>
                                <div className="h-1 w-1 rounded-full bg-blue-500 animate-pulse" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Updated Live</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="h-9 px-4 rounded-xl border-gray-200 bg-white font-bold text-[10px] uppercase tracking-wider text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
                            <Download className="h-3.5 w-3.5 mr-2 text-gray-400" /> Export
                        </Button>
                        <Button
                            className="h-9 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all active:scale-95"
                            onClick={() => router.push('/admin/bookings')}
                        >
                            <Plus className="h-4 w-4 mr-2" /> New Payment
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Money', value: `PKR ${(stats?.totalRevenue / 1000).toFixed(1)}k`, icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Collection %', value: `${((stats?.monthlyRevenue / (stats?.monthlyRevenue + stats?.pendingReceivables)) * 100 || 0).toFixed(0)}%`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Unpaid Payments', value: paymentsData?.payments?.filter(p => (p.status === 'PENDING' || p.status === 'PARTIAL')).length || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Late Fees', value: `PKR ${(stats?.overdueLiability / 1000).toFixed(1)}k`, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' }
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

                {/* Search and Filters */}
                <div className="bg-white border border-gray-100 rounded-2xl p-2 flex flex-col md:flex-row items-center gap-4 shadow-sm">
                    <div className="flex-1 relative w-full group px-2">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-blue-600 transition-colors" />
                        <Input
                            placeholder="Search by student, room or ID..."
                            className="w-full h-12 pl-12 bg-transparent border-none shadow-none font-bold text-sm focus-visible:ring-0 placeholder:text-gray-300"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase animate-in fade-in zoom-in">
                                {filteredPayments.length} results
                            </span>
                        )}
                    </div>

                    <div className="h-8 w-px bg-gray-100 mx-2 hidden md:block" />

                    <div className="flex items-center gap-2 p-1 bg-gray-50 rounded-xl w-full md:w-auto">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-10 px-4 rounded-lg font-bold text-[10px] uppercase tracking-wider text-gray-500 hover:bg-white hover:text-black hover:shadow-sm">
                                    <Filter className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                    {filterStatus === 'All' ? 'All Statuses' : filterStatus}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[220px] rounded-xl border-gray-100 shadow-xl p-2">
                                <DropdownMenuLabel className="text-[9px] font-bold uppercase tracking-widest text-gray-400 p-2">Search Status</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-gray-50 mb-1" />
                                {["All", "PAID", "PENDING", "PARTIAL", "OVERDUE", "REJECTED"].map(status => (
                                    <DropdownMenuItem key={status} onClick={() => setFilterStatus(status)} className="p-2.5 font-bold text-[10px] uppercase tracking-wider rounded-lg cursor-pointer">
                                        {status}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-10 px-4 rounded-lg font-bold text-[10px] uppercase tracking-wider text-gray-500 hover:bg-white hover:text-black hover:shadow-sm">
                                    <Building2 className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                    {filterHostel === 'All' ? 'All Hostels' : filterHostel}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[280px] rounded-xl border-gray-100 shadow-xl p-2">
                                <DropdownMenuLabel className="text-[9px] font-bold uppercase tracking-widest text-gray-400 p-2">Hostels</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-gray-50 mb-1" />
                                <DropdownMenuItem onClick={() => setFilterHostel("All")} className="p-2.5 font-bold text-[10px] uppercase tracking-wider rounded-lg">Show All</DropdownMenuItem>
                                {hostels.map(h => (
                                    <DropdownMenuItem key={h.id} onClick={() => setFilterHostel(h.name)} className="p-2.5 font-bold text-[10px] uppercase tracking-wider rounded-lg">
                                        {h.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <TabsList className="bg-white border border-gray-100 p-1 rounded-xl h-11 w-full lg:w-auto shadow-sm">
                            <TabsTrigger
                                value="ledger"
                                className="h-full px-8 rounded-lg font-bold text-[10px] uppercase tracking-wider data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all"
                            >
                                <Boxes className="h-3.5 w-3.5 mr-2" /> All Payments
                            </TabsTrigger>
                            <TabsTrigger
                                value="verification"
                                className="h-full px-8 rounded-lg font-bold text-[10px] uppercase tracking-wider data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all relative"
                            >
                                <CheckCircle className="h-3.5 w-3.5 mr-2" /> Pending Approval
                                {(paymentsData?.payments?.filter(p => (p.status === 'PENDING' || p.status === 'PARTIAL')).length > 0) && (
                                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                )}
                            </TabsTrigger>
                        </TabsList>

                        <div className="hidden lg:flex items-center gap-3">
                            <div className="flex items-center -space-x-1">
                                <div className="h-5 w-5 rounded-full border-2 border-white bg-blue-50 flex items-center justify-center">
                                    <Activity className="h-2 w-2 text-blue-600" />
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Record Count:</span>
                            <span className="text-[10px] font-black text-gray-900 uppercase tracking-tight">{filteredPayments.length} Payments Found</span>
                        </div>
                    </div>

                    <TabsContent value="ledger" className="space-y-4 outline-none">
                        {filteredPayments.map((payment) => (
                            <div
                                key={payment.id}
                                className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col lg:flex-row items-center justify-between gap-6 hover:shadow-md transition-shadow group relative overflow-hidden"
                            >
                                <div className={`absolute top-0 left-0 w-1.5 h-full ${getRibbonColor(payment.status)} opacity-70`} />

                                <div className="flex items-center gap-6 flex-1 min-w-0">
                                    <div className="flex items-center gap-5 min-w-[280px]">
                                        <div className="h-14 w-14 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-sm shrink-0 group-hover:bg-blue-600 transition-colors">
                                            <User className="h-6 w-6 text-gray-400 group-hover:text-white transition-colors" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <h4 className="text-base font-bold text-gray-900 uppercase tracking-tight truncate">{payment.User?.name}</h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{payment.Booking?.Room?.Hostel?.name}</span>
                                                {payment.uid && (
                                                    <>
                                                        <span className="h-1 w-1 rounded-full bg-gray-200" />
                                                        <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{payment.uid}</span>
                                                    </>
                                                )}
                                            </div>
                                            {payment.notes && (
                                                <div className="flex items-center gap-1.5 mt-2 py-0.5 px-2 bg-blue-50/30 rounded-md border border-blue-100/20 w-fit">
                                                    <FileText className="h-2.5 w-2.5 text-blue-400" />
                                                    <span className="text-[9px] font-bold text-blue-600/60 uppercase tracking-widest truncate max-w-[200px]">
                                                        {payment.notes}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="hidden md:flex flex-col gap-1 min-w-[160px]">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="h-3.5 w-3.5 text-blue-500" />
                                            <span className="text-xs font-bold text-gray-900 uppercase">PKR {payment.amount.toLocaleString()}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-0.5">{payment.method}</span>
                                    </div>

                                    <div className="hidden xl:flex items-center gap-8 min-w-[220px]">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                                                <Calendar className="h-3.5 w-3.5" />
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Date</span>
                                                <span className="text-xs font-bold text-gray-900 uppercase">{format(new Date(payment.date), 'MMM dd, yyyy')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="min-w-[140px] flex justify-center">
                                        <Badge variant="outline" className={`${getStatusStyle(payment.status)} px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border shadow-sm`}>
                                            {payment.status}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 lg:ml-auto">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full hover:bg-gray-50 text-gray-400 transition-colors">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 rounded-xl border-gray-100 shadow-xl p-2">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/admin/payments/${payment.id}`} className="p-2.5 font-bold text-[10px] uppercase tracking-wider rounded-lg cursor-pointer flex items-center gap-2">
                                                    <Eye className="h-3.5 w-3.5" /> View Details
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <UnifiedReceipt data={payment} type="payment">
                                                    <div className="w-full p-2.5 font-bold text-[10px] uppercase tracking-wider rounded-lg cursor-pointer flex items-center gap-2 hover:bg-slate-50 transition-colors">
                                                        <Receipt className="h-3.5 w-3.5" /> View Receipt
                                                    </div>
                                                </UnifiedReceipt>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleEditOpen(payment)} className="p-2.5 font-bold text-[10px] uppercase tracking-wider rounded-lg cursor-pointer flex items-center gap-2">
                                                <Settings2 className="h-3.5 w-3.5" /> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-gray-50" />
                                            <DropdownMenuItem onClick={() => handleDeleteClick(payment.id)} className="p-2.5 font-bold text-[10px] uppercase tracking-wider rounded-lg cursor-pointer flex items-center gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                                                <Trash2 className="h-3.5 w-3.5" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <Button asChild className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm flex items-center gap-2 group/btn">
                                        <Link href={`/admin/payments/${payment.id}`}>
                                            View
                                            <ChevronRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </TabsContent>

                    <TabsContent value="verification" className="space-y-6 outline-none">
                        {filteredPayments.length > 0 ? (
                            filteredPayments.map((payment) => (
                                <div key={payment.id} className="bg-white border border-gray-100 rounded-3xl p-6 flex flex-col lg:flex-row items-center justify-between gap-8 hover:shadow-md transition-shadow group relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500 opacity-70" />
                                    <div className="flex items-center gap-8 flex-1 w-full">
                                        <div className="h-24 w-20 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center gap-3 shrink-0 overflow-hidden relative group/img">
                                            {payment.receiptUrl ? (
                                                <>
                                                    <img src={payment.receiptUrl} alt="Proof" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover/img:opacity-100 transition-opacity" />
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button size="icon" variant="ghost" className="h-full w-full relative z-10 hover:bg-black/20"><Scan className="h-6 w-6 text-white drop-shadow-md" /></Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-4xl bg-white p-0 border-gray-200 overflow-hidden rounded-3xl shadow-2xl">
                                                            <div className="relative aspect-[16/10] bg-gray-50">
                                                                <img src={payment.receiptUrl} alt="Proof of Payment" className="w-full h-full object-contain p-8" />
                                                                <div className="absolute top-6 left-6 flex flex-col gap-2">
                                                                    <Badge className="bg-blue-600 text-white font-bold uppercase text-[9px] tracking-widest px-3">PAYMENT PROOF</Badge>
                                                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{payment.uid ? `REF: ${payment.uid}` : `ID: ${payment.id.slice(-8)}`}</span>
                                                                </div>
                                                                <Link href={payment.receiptUrl} target="_blank" className="absolute bottom-6 right-6">
                                                                    <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 h-10 font-bold uppercase text-[10px] tracking-wider shadow-lg"><ExternalLink className="h-3.5 w-3.5 mr-2" /> View Original</Button>
                                                                </Link>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                </>
                                            ) : (
                                                <XCircle className="h-6 w-6 text-gray-300" />
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-4 flex-1">
                                            <div className="flex items-center gap-3">
                                                <h4 className="text-lg font-bold text-gray-900 uppercase tracking-tight">{payment.User?.name}</h4>
                                                <Badge className="bg-amber-50 text-amber-600 border-amber-100 font-bold uppercase text-[9px] tracking-widest px-3">New Payment sent</Badge>
                                            </div>
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                                <div>
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Amount</span>
                                                    <p className="text-sm font-bold text-gray-900 uppercase">PKR {payment.amount.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Method</span>
                                                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">{payment.method}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Hostel</span>
                                                    <p className="text-xs font-bold text-gray-900 uppercase tracking-widest truncate">{payment.Booking?.Room?.Hostel?.name}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Date Sent</span>
                                                    <p className="text-xs font-bold text-gray-900 uppercase tracking-tight">{format(new Date(payment.date), 'dd/MM/yy HH:mm')}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 w-full lg:w-auto">
                                        <Button
                                            variant="outline"
                                            className="flex-1 h-12 rounded-xl border-rose-100 bg-rose-50 text-rose-600 font-bold text-[10px] uppercase tracking-wider hover:bg-rose-600 hover:text-white transition-all order-2 lg:order-1"
                                            onClick={() => {
                                                setSelectedPaymentId(payment.id);
                                                setIsRejectDialogOpen(true);
                                            }}
                                        >
                                            Reject
                                        </Button>
                                        <Button
                                            className="flex-1 h-12 rounded-xl bg-blue-600 text-white hover:bg-blue-700 border-none font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 order-1 lg:order-2 active:scale-95"
                                            onClick={() => handleApprove(payment.id)}
                                        >
                                            <CheckCircle className="h-4 w-4" />
                                            Approve
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white border border-gray-100 rounded-3xl p-24 text-center group border-dashed shadow-sm">
                                <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-6 border border-emerald-100">
                                    <CheckCircle className="h-8 w-8 text-emerald-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">All caught up!</h3>
                                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1 max-w-[320px] mx-auto leading-relaxed">No payments waiting for approval.</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                <div className="pt-10">
                    <div className="bg-blue-600 text-white rounded-[2rem] p-4 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-full bg-white/5 skew-x-12 translate-x-20" />
                        <div className="flex items-center gap-6 relative z-10 px-4">
                            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                                <ShieldCheck className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100">System Status</h4>
                                <p className="text-[11px] font-bold mt-0.5">Ready</p>
                            </div>
                        </div>

                        <div className="h-6 w-px bg-white/10 hidden md:block" />

                        <div className="flex-1 flex items-center gap-12 px-8">
                            <div className="flex flex-col">
                                <span className="text-[8px] font-bold uppercase text-blue-100 tracking-widest">Today</span>
                                <span className="text-[10px] font-bold text-gray-200 uppercase mt-1">{new Date().toLocaleDateString()}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[8px] font-bold uppercase text-blue-100 tracking-widest">Total Collected</span>
                                <span className="text-[10px] font-bold text-white uppercase mt-1">PKR {stats?.totalRevenue?.toLocaleString()} Collected</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pr-6 relative z-10">
                            <span className="text-[9px] font-bold uppercase text-white tracking-widest">System Online</span>
                            <div className="h-2 w-2 rounded-full bg-white animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.4)]" />
                        </div>
                    </div>
                </div>
            </main>

            {/* Modals */}
            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white ring-1 ring-gray-100">
                    <div className="bg-rose-600 p-10 text-white text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/10 skew-x-12 translate-x-20" />
                        <div className="h-16 w-16 bg-black/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-black/10 shadow-lg">
                            <XCircle className="h-8 w-8" />
                        </div>
                        <h2 className="text-2xl font-bold uppercase tracking-tight">Reject Payment</h2>
                        <p className="text-[10px] text-white/70 font-bold tracking-widest mt-2 uppercase">Stop this payment</p>
                    </div>
                    <div className="p-10 space-y-8">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Why reject this?</Label>
                            <Textarea
                                placeholder="Write reason..."
                                className="rounded-2xl border-gray-100 bg-gray-50 p-6 font-medium text-sm min-h-[120px] focus:ring-rose-500 text-gray-900 resize-none pt-4 placeholder:text-gray-300"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-4">
                            <Button variant="ghost" className="flex-1 rounded-xl h-11 font-bold text-[10px] uppercase tracking-wider text-gray-400" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
                            <Button
                                className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl shadow-lg transition-all"
                                onClick={handleReject}
                                disabled={updatePayment.isPending || !rejectionReason}
                            >
                                {updatePayment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reject Now'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white ring-1 ring-gray-100">
                    <div className="bg-blue-600 p-10 text-white text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/10 skew-x-12 translate-x-20" />
                        <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/10 shadow-lg">
                            <Settings2 className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold uppercase tracking-tight">Edit Payment</h2>
                        <p className="text-[10px] text-blue-100 font-bold tracking-widest mt-2 uppercase">Update payment details</p>
                    </div>
                    <div className="p-10 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Amount (PKR)</Label>
                                <Input
                                    type="number"
                                    value={editFormData.amount}
                                    onChange={(e) => setEditFormData({ ...editFormData, amount: Number(e.target.value) })}
                                    className="rounded-xl border-gray-100 bg-gray-50 font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</Label>
                                <select
                                    className="w-full h-10 rounded-xl border-gray-100 bg-gray-50 text-[10px] font-bold uppercase px-3"
                                    value={editFormData.status}
                                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                                >
                                    {["PAID", "PENDING", "PARTIAL", "OVERDUE", "REJECTED"].map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Payment Method</Label>
                            <Input
                                value={editFormData.method}
                                onChange={(e) => setEditFormData({ ...editFormData, method: e.target.value })}
                                className="rounded-xl border-gray-100 bg-gray-50 font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Notes</Label>
                            <Textarea
                                value={editFormData.notes}
                                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                                className="rounded-xl border-gray-100 bg-gray-50 font-medium text-xs resize-none h-24"
                                placeholder="..."
                            />
                        </div>
                        <div className="flex gap-4 pt-4">
                            <Button variant="ghost" className="flex-1 rounded-xl h-11 font-bold text-[10px] uppercase tracking-wider text-gray-400" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                            <Button
                                className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                                onClick={handleEditSubmit}
                                disabled={updatePayment.isPending}
                            >
                                {updatePayment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-3.5 w-3.5" /> Save Changes</>}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-[2.5rem] border-none p-10 max-w-md">
                    <AlertDialogHeader>
                        <div className="h-16 w-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 border border-rose-100">
                            <Trash2 className="h-8 w-8 text-rose-600" />
                        </div>
                        <AlertDialogTitle className="text-xl font-bold uppercase tracking-tight">Delete Payment?</AlertDialogTitle>
                        <AlertDialogDescription className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed mt-2">
                            Are you sure you want to permanently delete this payment record?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-10 gap-3">
                        <AlertDialogCancel className="h-12 px-8 rounded-xl font-bold text-[10px] uppercase tracking-widest border-gray-100">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="h-12 px-8 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-rose-600/20"
                        >
                            Confirm Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default PaymentManagementPage;