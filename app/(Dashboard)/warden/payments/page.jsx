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
    Plus,
    ShieldCheck,
    PieChart,
    Wallet,
    History,
    Zap,
    Scale,
    Cpu,
    Fingerprint,
    Boxes,
    Scan,
    ArrowRight,
    Send,
    Loader2,
    ExternalLink,
    Building,
    CheckCircle,
    Settings2,
    Trash2,
    Save,
    MoreVertical
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
import {
    useRefundRequests,
    useUpdateRefundStatus
} from "@/hooks/useRefunds";
import { useHostel } from "@/hooks/usehostel";
import { Undo2 } from "lucide-react";

import { format } from "date-fns";
import { toast } from "sonner";
import useAuthStore from "@/hooks/Authstate";
import UnifiedReceipt from "@/components/receipt/UnifiedReceipt";
import SecurityRefundModal from "./SecurityRefundModal";
import { useBookings } from "@/hooks/useBooking";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
    const [isExportingDefaulters, setIsExportingDefaulters] = useState(false);
    const [isExportingPayments, setIsExportingPayments] = useState(false);

    const { user } = useAuthStore();
    const { data: paymentsData, isLoading: paymentsLoading } = useAllPayments({ hostelId: user?.hostelId, limit: 1000 });
    const { data: refundRequests, isLoading: refundsLoading } = useRefundRequests();
    const { data: stats, isLoading: statsLoading } = useFinancialStats(user?.hostelId);
    const { data: hostelsData } = useHostel();
    const { data: bookingsResponse } = useBookings({ hostelId: user?.hostelId });
    const bookings = bookingsResponse || [];
    const updatePayment = useUpdatePayment();
    const deletePayment = useDeletePayment();
    const updateRefundStatus = useUpdateRefundStatus();

    const hostels = hostelsData?.data || [];

    // Filter refunds for currently logged-in warden's hostel
    const filteredRefunds = useMemo(() => {
        if (!refundRequests) return [];
        return refundRequests.filter(r => {
            if (user?.role === 'ADMIN') return true;
            return r.Payment?.Booking?.Room?.hostelId === user?.hostelId;
        });
    }, [refundRequests, user]);


    // Unified Filtering Logic
    const filteredPayments = useMemo(() => {
        const payments = paymentsData?.payments || [];
        return payments.filter(payment => {
            const matchesSearch = !searchQuery ||
                payment.User?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                payment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                payment.Booking?.Room?.roomNumber?.toString().includes(searchQuery);

            const matchesHostel = filterHostel === "All" || payment.Booking?.Room?.Hostel?.name === filterHostel;
            const matchesWardenHostel = user?.hostelId ? payment.Booking?.Room?.Hostel?.id === user.hostelId : true;

            if (activeTab === "verification") {
                return (payment.status === 'PENDING' || payment.status === 'PARTIAL') && matchesSearch && matchesHostel && matchesWardenHostel;
            }

            const matchesStatus = filterStatus === "All" || payment.status === filterStatus;
            return matchesStatus && matchesHostel && matchesSearch && matchesWardenHostel;
        });
    }, [paymentsData, filterStatus, filterHostel, searchQuery, activeTab, user]);

    const handleApprove = async (paymentId) => {
        try {
            await updatePayment.mutateAsync({
                id: paymentId,
                status: 'PAID'
            });
            toast.success("Payment authorized successfully");
        } catch (error) {
            toast.error("Failed to authorize payment");
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
        } catch (error) {
            // Error toast handled by hook
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
        } catch (error) {
            // Error toast handled by hook
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

    const handleExportDefaultersList = async () => {
        setIsExportingDefaulters(true);
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const currentDay = now.getDate();
        const isPastDueDay = currentDay > 5;
        const targetMonth = isPastDueDay ? currentMonth : (currentMonth === 0 ? 11 : currentMonth - 1);
        const targetYear = (isPastDueDay || currentMonth !== 0) ? currentYear : currentYear - 1;

        const defaultersList = bookings.filter(b => {
            if (b.status !== "CHECKED_IN") return false;
            const hasPaidForTargetMonth = b.Payment?.some(p => {
                const pDate = new Date(p.date || p.createdAt);
                return p.status === "PAID" && p.type === "RENT" && pDate.getMonth() === targetMonth && pDate.getFullYear() === targetYear;
            });
            return !hasPaidForTargetMonth;
        });

        try {
            const doc = new jsPDF('landscape');
            doc.setFont("helvetica", "bold");
            doc.setFillColor(153, 27, 27);
            doc.rect(0, 0, doc.internal.pageSize.width, 35, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.text("RENT DEFAULTERS REPORT", doc.internal.pageSize.width / 2, 18, { align: "center" });
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            const monthName = new Date(targetYear, targetMonth, 1).toLocaleString('default', { month: 'long' });
            doc.text(`Defaulters for: ${monthName} ${targetYear}`, doc.internal.pageSize.width / 2, 26, { align: "center" });

            doc.setTextColor(80, 80, 80);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(`Generated On: ${format(new Date(), 'PPP p')}`, 14, 45);
            doc.text(`Total Defaulters: ${defaultersList.length}`, doc.internal.pageSize.width - 14, 45, { align: "right" });

            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.5);
            doc.line(14, 49, doc.internal.pageSize.width - 14, 49);

            const headers = [["S.No", "Resident Name", "Phone", "Room", "Rent Amount", "Last Payment"]];
            const rows = defaultersList.map((b, index) => [
                index + 1,
                b.User?.name || 'N/A',
                b.User?.phone || 'N/A',
                b.Room?.roomNumber || 'N/A',
                `PKR ${b.totalAmount?.toLocaleString() || 'N/A'}`,
                (b.Payment && b.Payment.length > 0) ? format(new Date(b.Payment[0].date), 'dd/MM/yyyy') : 'Never'
            ]);

            autoTable(doc, {
                startY: 55,
                head: headers,
                body: rows,
                theme: 'grid',
                headStyles: { fillColor: [185, 28, 28], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9, halign: 'center' },
                bodyStyles: { fontSize: 9, textColor: [50, 50, 50] },
                alternateRowStyles: { fillColor: [254, 242, 242] },
                didDrawPage: (data) => {
                    doc.setFontSize(8);
                    doc.setTextColor(150, 150, 150);
                    doc.text("Page " + doc.internal.getNumberOfPages(), doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: "center" });
                }
            });

            doc.save(`Defaulters_Report_${monthName}_${targetYear}.pdf`);
            toast.success("Defaulters report exported!");
        } catch (error) {
            toast.error("Export failed");
        } finally {
            setIsExportingDefaulters(false);
        }
    };

    const handleExportPaymentsList = async () => {
        setIsExportingPayments(true);
        try {
            const doc = new jsPDF('landscape');
            doc.setFont("helvetica", "bold");
            doc.setFillColor(37, 99, 235);
            doc.rect(0, 0, doc.internal.pageSize.width, 35, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.text("PAYMENTS REPORT", doc.internal.pageSize.width / 2, 18, { align: "center" });
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Total Payments: ${filteredPayments.length}`, doc.internal.pageSize.width / 2, 26, { align: "center" });

            doc.setTextColor(80, 80, 80);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(`Generated On: ${format(new Date(), 'PPP p')}`, 14, 45);
            doc.text(`Status: ${filterStatus}`, doc.internal.pageSize.width - 14, 45, { align: "right" });

            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.5);
            doc.line(14, 49, doc.internal.pageSize.width - 14, 49);

            const headers = [["S.No", "Date", "Resident Name", "Room", "Amount", "Status", "Method", "Type"]];
            const rows = filteredPayments.map((p, index) => [
                index + 1,
                format(new Date(p.date || p.createdAt), 'dd/MM/yyyy'),
                p.User?.name || 'N/A',
                p.Booking?.Room?.roomNumber || 'N/A',
                `PKR ${p.amount.toLocaleString()}`,
                p.status,
                p.method,
                p.type
            ]);

            autoTable(doc, {
                startY: 55,
                head: headers,
                body: rows,
                theme: 'grid',
                headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9, halign: 'center' },
                didDrawPage: (data) => {
                    doc.setFontSize(8);
                    doc.setTextColor(150, 150, 150);
                    doc.text("Page " + doc.internal.getNumberOfPages(), doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: "center" });
                }
            });

            doc.save(`Payments_Report_${format(new Date(), 'dd_MM_yyyy')}.pdf`);
            toast.success("Payments report exported!");
        } catch (error) {
            toast.error("Export failed");
        } finally {
            setIsExportingPayments(false);
        }
    };

    if (paymentsLoading || statsLoading) return (
        <div className="flex h-screen items-center justify-center bg-white font-sans">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="h-20 w-20 border-[3px] border-gray-100 border-t-indigo-600 rounded-full animate-spin" />
                    <Wallet className="h-8 w-8 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center">
                    <p className="text-lg font-bold text-gray-900 tracking-tight">Loading Records...</p>
                    <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-widest">Checking transaction history</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight print:hidden">
            {/* Minimal Premium Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1400px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-1 bg-indigo-600 rounded-full" />
                        <div className="flex flex-col">
                            <h1 className="text-base font-bold text-gray-900 tracking-tight uppercase">Payment Management</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Transaction History</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="h-9 px-4 rounded-xl border-gray-200 bg-white font-bold text-[10px] uppercase tracking-wider text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
                            onClick={() => setIsExportDialogOpen(true)}
                        >
                            <Download className="h-3.5 w-3.5 mr-2 text-gray-400" /> Export
                        </Button>
                        <Button
                            className="h-9 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all active:scale-95"
                            onClick={() => router.push('/warden/bookings')}
                        >
                            <Plus className="h-4 w-4 mr-2" /> New Payment
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1400px] mx-auto px-6 py-8 space-y-8">
                {/* Summary Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Revenue', value: `PKR ${(stats?.totalRevenue / 1000).toFixed(1)}k`, icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Paid Ratio', value: `${((stats?.monthlyRevenue / (stats?.monthlyRevenue + stats?.pendingReceivables)) * 100 || 0).toFixed(0)}%`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Pending Approvals', value: paymentsData?.payments?.filter(p => (p.status === 'PENDING' || p.status === 'PARTIAL')).length || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Overdue Amount', value: `PKR ${(stats?.overdueLiability / 1000).toFixed(1)}k`, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' }
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

                {/* Search & Filter */}
                <div className="bg-white border border-gray-100 rounded-2xl p-2 flex flex-col md:flex-row items-center gap-4 shadow-sm">
                    <div className="flex-1 relative w-full group px-2">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by Resident, Room or Transaction ID..."
                            className="w-full h-12 pl-10 bg-transparent border-none shadow-none font-bold text-sm focus-visible:ring-0 placeholder:text-gray-300"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
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
                                <DropdownMenuLabel className="text-[9px] font-bold uppercase tracking-widest text-gray-400 p-2">Filter by Status</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-gray-50 mb-1" />
                                {["All", "PAID", "PENDING", "PARTIAL", "OVERDUE", "REJECTED"].map(status => (
                                    <DropdownMenuItem key={status} onClick={() => setFilterStatus(status)} className="p-2.5 font-bold text-[10px] uppercase tracking-wider rounded-lg cursor-pointer">
                                        {status}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {user?.role === 'ADMIN' && (
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
                        )}
                    </div>
                </div>

                {/* Unified Tabbed Registry */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <TabsList className="bg-white border border-gray-100 p-1 rounded-xl h-11 w-full lg:w-auto shadow-sm">
                            <TabsTrigger
                                value="ledger"
                                className="h-full px-8 rounded-lg font-bold text-[10px] uppercase tracking-wider data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all"
                            >
                                <Boxes className="h-3.5 w-3.5 mr-2" /> All Payments
                            </TabsTrigger>
                            <TabsTrigger
                                value="verification"
                                className="h-full px-8 rounded-lg font-bold text-[10px] uppercase tracking-wider data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all relative"
                            >
                                <CheckCircle className="h-3.5 w-3.5 mr-2" /> Guest Notifications
                                {(paymentsData?.payments?.filter(p => (p.status === 'PENDING' || p.status === 'PARTIAL')).length > 0) && (
                                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                )}
                            </TabsTrigger>
                            <TabsTrigger
                                value="refunds"
                                className="h-full px-8 rounded-lg font-bold text-[10px] uppercase tracking-wider data-[state=active]:bg-rose-600 data-[state=active]:text-white transition-all relative"
                            >
                                <Undo2 className="h-3.5 w-3.5 mr-2" /> Refund Requests
                                {(filteredRefunds.filter(r => r.status === 'PENDING').length > 0) && (
                                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                                )}
                            </TabsTrigger>
                        </TabsList>


                        <div className="hidden lg:flex items-center gap-3">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Results:</span>
                            <span className="text-xs font-bold text-gray-900 uppercase tracking-tight">{filteredPayments.length} Entries found</span>
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
                                    {/* Entity Info */}
                                    <div className="flex items-center gap-5 min-w-[280px]">
                                        <div className="h-14 w-14 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-sm shrink-0 group-hover:bg-indigo-600 transition-colors">
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
                                                <div className="flex items-center gap-1.5 mt-2 py-0.5 px-2 bg-indigo-50/30 rounded-md border border-indigo-100/20 w-fit">
                                                    <FileText className="h-2.5 w-2.5 text-indigo-400" />
                                                    <span className="text-[9px] font-bold text-indigo-600/60 uppercase tracking-widest truncate max-w-[200px]">
                                                        {payment.notes}
                                                    </span>
                                                </div>
                                            )}
                                            {payment.receiptUrl && payment.status === 'PENDING' && (
                                                <div className="flex items-center gap-1 mt-2 px-2 py-0.5 bg-emerald-50 rounded-md border border-emerald-100 w-fit">
                                                    <Zap className="h-2.5 w-2.5 text-emerald-500 animate-pulse" />
                                                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">New Notification</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Fiscal Delta */}
                                    <div className="hidden md:flex flex-col gap-1 min-w-[160px]">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="h-3.5 w-3.5 text-blue-500" />
                                            <span className="text-xs font-bold text-gray-900 uppercase">PKR {payment.amount.toLocaleString()}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-0.5">{payment.method} Payment</span>
                                    </div>

                                    {/* Temporal Axis */}
                                    <div className="hidden xl:flex items-center gap-8 min-w-[220px]">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                                                <Calendar className="h-3.5 w-3.5" />
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Received</span>
                                                <span className="text-xs font-bold text-gray-900 uppercase">{format(new Date(payment.date), 'MMM dd, yyyy')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div className="min-w-[140px] flex justify-center">
                                        <Badge variant="outline" className={`${getStatusStyle(payment.status)} px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border shadow-sm`}>
                                            {payment.status}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Action Deck */}
                                <div className="flex items-center gap-2 lg:ml-auto">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-10 w-10 rounded-full hover:bg-gray-50 text-gray-400 transition-colors"
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 rounded-xl border-gray-100 shadow-xl p-2">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/warden/payments/${payment.id}`} className="p-2.5 font-bold text-[10px] uppercase tracking-wider rounded-lg cursor-pointer flex items-center gap-2">
                                                    <Eye className="h-3.5 w-3.5" /> View Details
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <div className="w-full">
                                                    <UnifiedReceipt data={payment} type="payment">
                                                        <div className="p-2.5 font-bold text-[10px] uppercase tracking-wider rounded-lg cursor-pointer flex items-center gap-2 hover:bg-slate-100">
                                                            <Receipt className="h-3.5 w-3.5" /> View Receipt
                                                        </div>
                                                    </UnifiedReceipt>
                                                </div>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleEditOpen(payment)}
                                                className="p-2.5 font-bold text-[10px] uppercase tracking-wider rounded-lg cursor-pointer flex items-center gap-2"
                                            >
                                                <Settings2 className="h-3.5 w-3.5" /> Edit Payment
                                            </DropdownMenuItem>

                                            {payment.Booking?.securityDeposit > 0 && (
                                                <SecurityRefundModal booking={payment.Booking}>
                                                    <div className="p-2.5 font-bold text-[10px] uppercase tracking-wider rounded-lg cursor-pointer flex items-center gap-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                                                        <Wallet className="h-3.5 w-3.5" /> Refund Security
                                                    </div>
                                                </SecurityRefundModal>
                                            )}

                                            <DropdownMenuSeparator className="bg-gray-50" />
                                            <DropdownMenuItem
                                                onClick={() => handleDeleteClick(payment.id)}
                                                className="p-2.5 font-bold text-[10px] uppercase tracking-wider rounded-lg cursor-pointer flex items-center gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" /> Delete Payment
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <Button
                                        asChild
                                        className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm flex items-center gap-2 group/btn"
                                    >
                                        <Link href={`/warden/payments/${payment.id}`}>
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
                                <div
                                    key={payment.id}
                                    className="bg-white border border-gray-100 rounded-3xl p-6 flex flex-col lg:flex-row items-center justify-between gap-8 hover:shadow-md transition-shadow group relative overflow-hidden"
                                >
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
                                                                    <Badge className="bg-indigo-600 text-white font-bold uppercase text-[9px] tracking-widest px-3">PAYMENT PROOF</Badge>
                                                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{payment.uid ? `REF: ${payment.uid}` : `ID: ${payment.id.slice(-8)}`}</span>
                                                                </div>
                                                                <Link href={payment.receiptUrl} target="_blank" className="absolute bottom-6 right-6">
                                                                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 h-10 font-bold uppercase text-[10px] tracking-wider shadow-lg"><ExternalLink className="h-3.5 w-3.5 mr-2" /> View Original</Button>
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
                                                <Badge className="bg-amber-50 text-amber-600 border-amber-100 font-bold uppercase text-[9px] tracking-widest px-3">Sent Notification</Badge>
                                                {payment.receiptUrl && (
                                                    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold uppercase text-[9px] tracking-widest px-3 flex items-center gap-1">
                                                        <Scan className="h-3 w-3" /> Proof Attached
                                                    </Badge>
                                                )}
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
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Received At</span>
                                                    <p className="text-xs font-bold text-gray-900 uppercase tracking-tight">{format(new Date(payment.date), 'dd/MM/yy HH:mm')}</p>
                                                </div>
                                            </div>
                                            {payment.notes && (
                                                <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-2.5">
                                                    <Info className="h-3.5 w-3.5 text-indigo-400 mt-0.5 shrink-0" />
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest">Transaction Comment</span>
                                                        <p className="text-[10px] font-medium text-gray-600 uppercase tracking-wide leading-relaxed">
                                                            {payment.notes}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
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
                                            className="flex-1 h-12 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 border-none font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 order-1 lg:order-2 active:scale-95"
                                            onClick={() => handleApprove(payment.id)}
                                        >
                                            <ShieldCheck className="h-4 w-4" />
                                            Approve
                                        </Button>
                                        <Link href={`/warden/payments/${payment.id}`} className="order-3">
                                            <Button variant="ghost" className="h-10 w-10 rounded-full hover:bg-gray-50 flex items-center justify-center">
                                                <ChevronRight className="h-4 w-4 text-gray-400" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white border border-gray-100 rounded-3xl p-24 text-center group border-dashed shadow-sm">
                                <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-6 border border-emerald-100">
                                    <CheckCircle className="h-8 w-8 text-emerald-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">All caught up!</h3>
                                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1 max-w-[320px] mx-auto leading-relaxed">All pending transactions have been approved. There are no payments waiting.</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="refunds" className="space-y-4 outline-none">

                        {filteredRefunds.length > 0 ? (
                            filteredRefunds.map((refund) => (
                                <div
                                    key={refund.id}
                                    className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col lg:flex-row items-center justify-between gap-6 hover:shadow-md transition-shadow group relative overflow-hidden"
                                >
                                    <div className={`absolute top-0 left-0 w-1.5 h-full ${refund.status === 'PENDING' ? 'bg-amber-500' : refund.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-rose-500'} opacity-70`} />

                                    <div className="flex items-center gap-6 flex-1 min-w-0">
                                        <div className="flex items-center gap-5 min-w-[280px]">
                                            <div className="h-14 w-14 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-sm shrink-0">
                                                <Undo2 className="h-6 w-6 text-rose-400" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <h4 className="text-base font-bold text-gray-900 uppercase tracking-tight truncate">{refund.User?.name}</h4>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{refund.Payment?.Booking?.Room?.Hostel?.name}</span>
                                                    <span className="h-1 w-1 rounded-full bg-gray-200" />
                                                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">Refund Request</span>
                                                </div>
                                                <div className="mt-2 py-1 px-3 bg-slate-50 rounded-lg border border-gray-100">
                                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 leading-none">Reason for Reversal</p>
                                                    <p className="text-xs font-semibold text-gray-700 leading-relaxed italic">"{refund.reason}"</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="hidden md:flex flex-col gap-1 min-w-[160px]">
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="h-3.5 w-3.5 text-rose-500" />
                                                <span className="text-sm font-black text-rose-600 uppercase">PKR {refund.amount.toLocaleString()}</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-0.5">Original: {refund.Payment?.uid || refund.Payment?.id.slice(-6).toUpperCase()}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 shrink-0">
                                        {refund.status === 'PENDING' ? (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-10 px-6 rounded-xl font-bold text-[10px] uppercase tracking-wider text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                                                    onClick={() => updateRefundStatus.mutate({ id: refund.id, status: 'REJECTED', notes: 'Refund request declined by warden.' })}
                                                    disabled={updateRefundStatus.isPending}
                                                >
                                                    <XCircle className="h-3.5 w-3.5 mr-2" /> Decline
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="h-10 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider shadow-lg shadow-emerald-500/20"
                                                    onClick={() => updateRefundStatus.mutate({ id: refund.id, status: 'COMPLETED', notes: 'Refund processed and completed.' })}
                                                    disabled={updateRefundStatus.isPending}
                                                >
                                                    {updateRefundStatus.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <><CheckCircle2 className="h-3.5 w-3.5 mr-2" /> Approve Refund</>}
                                                </Button>
                                            </>
                                        ) : (
                                            <Badge variant="outline" className={`${refund.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'} px-5 py-2 font-black text-[10px] uppercase tracking-widest rounded-xl border-2`}>
                                                {refund.status}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white border border-gray-100 rounded-3xl p-24 text-center border-dashed shadow-sm">
                                <div className="h-16 w-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-6 border border-rose-100">
                                    <Undo2 className="h-8 w-8 text-rose-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">No Refund Requests</h3>
                                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1 max-w-[320px] mx-auto leading-relaxed">There are currently no transaction reversal requests from residents.</p>
                            </div>
                        )}
                    </TabsContent>

                </Tabs>


            </main>

            {/* Export Dialog */}
            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white ring-1 ring-gray-100">
                    <div className="bg-indigo-600 p-10 text-white text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/10 skew-x-12 translate-x-20" />
                        <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/10 shadow-lg">
                            <Download className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold uppercase tracking-tight">Export Records</h2>
                        <p className="text-[10px] text-indigo-100 font-bold tracking-widest mt-2 uppercase">Financial Reporting Protocol</p>
                    </div>
                    <div className="p-10 space-y-4">
                        <Button
                            onClick={handleExportPaymentsList}
                            disabled={isExportingPayments}
                            className="w-full h-14 rounded-2xl bg-white border-2 border-indigo-50 hover:border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-between px-6 group shadow-sm"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[11px] font-black uppercase tracking-tight leading-none mb-1">Payments Ledger</p>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Full transaction history</p>
                                </div>
                            </div>
                            {isExportingPayments ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4 text-gray-300 group-hover:translate-x-1" />}
                        </Button>

                        <Button
                            onClick={handleExportDefaultersList}
                            disabled={isExportingDefaulters}
                            className="w-full h-14 rounded-2xl bg-white border-2 border-rose-50 hover:border-rose-600 text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-between px-6 group shadow-sm"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-rose-100 rounded-xl flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
                                    <AlertCircle className="h-5 w-5" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[11px] font-black uppercase tracking-tight leading-none mb-1">Defaulters List</p>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Active rent discrepancies</p>
                                </div>
                            </div>
                            {isExportingDefaulters ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4 text-gray-300 group-hover:translate-x-1" />}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Rejection Protocol Dialog */}
            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white ring-1 ring-gray-100">
                    <div className="bg-rose-600 p-10 text-white text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/10 skew-x-12 translate-x-20" />
                        <div className="h-16 w-16 bg-black/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-black/10 shadow-lg">
                            <XCircle className="h-8 w-8" />
                        </div>
                        <h2 className="text-2xl font-bold uppercase tracking-tight">Reject Payment</h2>
                        <p className="text-[10px] text-white/70 font-bold tracking-widest mt-2 uppercase">Cancel payment record</p>
                    </div>
                    <div className="p-10 space-y-8">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Reason for rejection</Label>
                            <Textarea
                                placeholder="Specify why this payment is being rejected..."
                                className="rounded-2xl border-gray-100 bg-gray-50 p-6 font-medium text-sm min-h-[120px] focus:ring-rose-500 text-gray-900 resize-none pt-4 placeholder:text-gray-300"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-4">
                            <Button variant="ghost" className="flex-1 rounded-xl h-11 font-bold text-[10px] uppercase tracking-wider text-gray-400 hover:text-gray-900" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
                            <Button
                                className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl shadow-lg transition-all"
                                onClick={handleReject}
                                disabled={updatePayment.isPending || !rejectionReason}
                            >
                                {updatePayment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Rejection'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Protocol Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white ring-1 ring-gray-100">
                    <div className="bg-indigo-600 p-10 text-white text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/10 skew-x-12 translate-x-20" />
                        <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/10 shadow-lg">
                            <Settings2 className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold uppercase tracking-tight">Edit Payment</h2>
                        <p className="text-[10px] text-indigo-100 font-bold tracking-widest mt-2 uppercase">Modify Payment Details</p>
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
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Administrative Notes</Label>
                            <Textarea
                                value={editFormData.notes}
                                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                                className="rounded-xl border-gray-100 bg-gray-50 font-medium text-xs resize-none h-24"
                                placeholder="Reason for update..."
                            />
                        </div>
                        <div className="flex gap-4 pt-4">
                            <Button variant="ghost" className="flex-1 rounded-xl h-11 font-bold text-[10px] uppercase tracking-wider text-gray-400" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                            <Button
                                className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                                onClick={handleEditSubmit}
                                disabled={updatePayment.isPending}
                            >
                                {updatePayment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-3.5 w-3.5" /> Save Changes</>}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Alert Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-[2rem] border-none p-10 max-w-md">
                    <AlertDialogHeader>
                        <div className="h-16 w-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 border border-rose-100">
                            <Trash2 className="h-8 w-8 text-rose-600" />
                        </div>
                        <AlertDialogTitle className="text-xl font-bold uppercase tracking-tight">Delete Payment Record?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm font-medium text-gray-500 leading-relaxed mt-2 uppercase tracking-wide text-[10px]">
                            This action is permanent. Are you sure? This will remove the record forever from the database and updated financial totals.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-10 gap-3">
                        <AlertDialogCancel className="h-12 px-8 rounded-xl font-bold text-[10px] uppercase tracking-widest border-gray-100">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="h-12 px-8 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-rose-600/20"
                        >
                            Delete Now
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default PaymentManagementPage;