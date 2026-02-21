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
                <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-full flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
                        <div className="h-8 w-1 bg-indigo-600 rounded-full shrink-0" />
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-sm md:text-base font-bold text-gray-900 tracking-tight uppercase truncate">Payments</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-gray-400 truncate">History</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500 hidden sm:block" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            variant="outline"
                            className="h-8 md:h-9 px-3 md:px-4 rounded-xl border-gray-200 bg-white font-bold text-[9px] md:text-[10px] uppercase tracking-wider text-gray-600 hover:bg-gray-50 transition-all shadow-sm shrink-0"
                            onClick={() => setIsExportDialogOpen(true)}
                        >
                            <Download className="h-3.5 w-3.5 md:mr-2 text-gray-400" />
                            <span className="hidden sm:inline">Export</span>
                        </Button>
                        <Button
                            className="h-8 md:h-9 px-3 md:px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[9px] md:text-[10px] uppercase tracking-wider shadow-sm transition-all active:scale-95 shrink-0"
                            onClick={() => router.push('/warden/bookings')}
                        >
                            <Plus className="h-3.5 w-3.5 md:mr-1.5" />
                            <span className="hidden sm:inline">New Payment</span>
                            <span className="sm:hidden text-[8px]">New</span>
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8 min-w-0">
                {/* Summary Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {[
                        { label: 'Total Revenue', value: `PKR ${(stats?.totalRevenue / 1000).toFixed(1)}k`, icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Paid Ratio', value: `${((stats?.monthlyRevenue / (stats?.monthlyRevenue + stats?.pendingReceivables)) * 100 || 0).toFixed(0)}%`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Pending', value: paymentsData?.payments?.filter(p => (p.status === 'PENDING' || p.status === 'PARTIAL')).length || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Overdue', value: `PKR ${(stats?.overdueLiability / 1000).toFixed(1)}k`, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-3 md:p-5 flex items-center gap-3 md:gap-4 shadow-sm hover:shadow-md transition-shadow cursor-default min-w-0">
                            <div className={`h-8 w-8 md:h-11 md:w-11 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                                <stat.icon className="h-4 w-4 md:h-5 md:w-5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">{stat.label}</span>
                                <span className="text-sm md:text-xl font-black text-gray-900 tracking-tight truncate">{stat.value}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Search & Filter */}
                <div className="bg-white border border-gray-100 rounded-2xl p-1.5 md:p-2 flex flex-col md:flex-row items-center gap-2 md:gap-3 shadow-sm min-w-0">
                    <div className="flex-1 relative w-full group min-w-0">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-black transition-colors" />
                        <Input
                            placeholder="Search Resident, Room or ID..."
                            className="w-full h-10 md:h-12 pl-10 bg-transparent border-none shadow-none font-bold text-xs md:text-sm focus-visible:ring-0 placeholder:text-gray-300 min-w-0"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="h-8 w-px bg-gray-100 mx-2 hidden md:block shrink-0" />

                    <div className="flex items-center gap-2 p-1 bg-gray-50 md:bg-transparent rounded-xl w-full md:w-auto overflow-x-auto scrollbar-hide shrink-0">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="flex-1 md:flex-none h-9 md:h-10 px-3 md:px-4 rounded-lg font-bold text-[9px] md:text-[10px] uppercase tracking-wider text-gray-500 hover:bg-white hover:text-black hover:shadow-sm whitespace-nowrap">
                                    <Filter className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                    {filterStatus === 'All' ? 'Statuses' : filterStatus}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[200px] rounded-xl border-gray-100 shadow-xl p-2">
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
                                    <Button variant="ghost" className="flex-1 md:flex-none h-9 md:h-10 px-3 md:px-4 rounded-lg font-bold text-[9px] md:text-[10px] uppercase tracking-wider text-gray-500 hover:bg-white hover:text-black hover:shadow-sm whitespace-nowrap">
                                        <Building2 className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                        {filterHostel === 'All' ? 'Hostels' : filterHostel}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[240px] rounded-xl border-gray-100 shadow-xl p-2">
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
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4 md:space-y-6 min-w-0">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-2 min-w-0 overflow-hidden">
                        <TabsList className="bg-white border border-gray-100 p-1 rounded-xl h-11 w-full lg:w-auto shadow-sm overflow-x-auto scrollbar-hide shrink-0 flex items-center">
                            <TabsTrigger
                                value="ledger"
                                className="flex-1 lg:flex-none h-full px-3 md:px-8 rounded-lg font-bold text-[9px] md:text-[10px] uppercase tracking-widest data-[state=active]:bg-black data-[state=active]:text-white transition-all whitespace-nowrap"
                            >
                                <Boxes className="h-3.5 w-3.5 md:mr-2" />
                                <span className="hidden sm:inline">Ledger</span>
                                <span className="sm:hidden ml-1">Ledger</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="verification"
                                className="flex-1 lg:flex-none h-full px-3 md:px-8 rounded-lg font-bold text-[9px] md:text-[10px] uppercase tracking-widest data-[state=active]:bg-black data-[state=active]:text-white transition-all relative whitespace-nowrap"
                            >
                                <CheckCircle className="h-3.5 w-3.5 md:mr-2" />
                                <span className="hidden sm:inline">Portal Notifications</span>
                                <span className="sm:hidden ml-1">Portal</span>
                                {(paymentsData?.payments?.filter(p => (p.status === 'PENDING' || p.status === 'PARTIAL')).length > 0) && (
                                    <span className="absolute top-1 right-1 h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                )}
                            </TabsTrigger>
                            <TabsTrigger
                                value="refunds"
                                className="flex-1 lg:flex-none h-full px-3 md:px-8 rounded-lg font-bold text-[9px] md:text-[10px] uppercase tracking-widest data-[state=active]:bg-rose-600 data-[state=active]:text-white transition-all relative whitespace-nowrap"
                            >
                                <Undo2 className="h-3.5 w-3.5 md:mr-2" />
                                <span className="hidden sm:inline">Refund Desk</span>
                                <span className="sm:hidden ml-1">Refunds</span>
                                {(filteredRefunds.filter(r => r.status === 'PENDING').length > 0) && (
                                    <span className="absolute top-1 right-1 h-1.5 w-1.5 bg-rose-500 rounded-full animate-pulse" />
                                )}
                            </TabsTrigger>
                        </TabsList>

                        <div className="hidden lg:flex items-center gap-3">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Activity Gauge:</span>
                            <span className="text-xs font-black text-gray-900 uppercase tracking-tight">{filteredPayments.length} Total Receipts</span>
                        </div>
                    </div>

                    <TabsContent value="ledger" className="space-y-3 outline-none min-w-0">
                        {filteredPayments.map((payment) => (
                            <div
                                key={payment.id}
                                className="bg-white border border-gray-100 rounded-2xl md:rounded-3xl p-4 md:p-5 flex flex-col lg:flex-row items-center justify-between gap-4 md:gap-6 hover:shadow-md transition-shadow group relative overflow-hidden min-w-0"
                            >
                                <div className={`absolute top-0 left-0 w-1.5 h-full ${getRibbonColor(payment.status)} opacity-60`} />

                                <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0 w-full">
                                    {/* Entity Info */}
                                    <div className="flex items-center gap-3 md:gap-5 min-w-0 flex-1">
                                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-sm shrink-0 group-hover:bg-black transition-colors">
                                            <User className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <h4 className="text-sm md:text-base font-black text-gray-900 uppercase tracking-tight truncate">{payment.User?.name}</h4>
                                            <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-0.5">
                                                <span className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest truncate">{payment.Booking?.Room?.Hostel?.name}</span>
                                                {payment.uid && (
                                                    <>
                                                        <span className="h-1 w-1 rounded-full bg-gray-200" />
                                                        <span className="text-[8px] md:text-[9px] font-mono font-black text-emerald-600 truncate uppercase">ID: {payment.uid}</span>
                                                    </>
                                                )}
                                            </div>
                                            {/* Mobile-only fiscal axis */}
                                            <div className="flex md:hidden items-center gap-3 mt-2">
                                                <span className="text-xs font-black text-gray-900 uppercase">PKR {payment.amount.toLocaleString()}</span>
                                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{payment.method}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Fiscal Delta (Tablet/Desktop) */}
                                    <div className="hidden md:flex flex-col gap-0.5 min-w-[140px] lg:min-w-[160px]">
                                        <div className="flex items-center gap-1.5 text-gray-900">
                                            <CreditCard className="h-3.5 w-3.5 text-indigo-500" />
                                            <span className="text-xs md:text-sm font-black uppercase tracking-tight">PKR {payment.amount.toLocaleString()}</span>
                                        </div>
                                        <span className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest truncate">{payment.method} Payment</span>
                                    </div>

                                    {/* Temporal Axis (Desktop) */}
                                    <div className="hidden xl:flex items-center gap-8 min-w-[180px]">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-300 border border-gray-100">
                                                <Calendar className="h-3.5 w-3.5" />
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Entry Date</span>
                                                <span className="text-[10px] md:text-xs font-black text-gray-900 uppercase">{format(new Date(payment.date), 'MMM dd, yyyy')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div className="min-w-0 md:min-w-[100px] lg:min-w-[120px] flex justify-end md:justify-center">
                                        <Badge variant="outline" className={`${getStatusStyle(payment.status)} px-3 md:px-4 py-1 rounded-full text-[7px] md:text-[8px] font-black uppercase tracking-widest border border-current/20 shadow-sm whitespace-nowrap`}>
                                            {payment.status}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Action Deck */}
                                <div className="flex items-center gap-2 lg:ml-auto w-full lg:w-auto shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                className="h-10 w-10 md:h-11 md:w-11 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-400 transition-colors shrink-0"
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-52 rounded-2xl border-gray-100 shadow-xl p-2 font-sans">
                                            <DropdownMenuLabel className="text-[8px] font-black uppercase tracking-widest text-gray-400 px-3 py-2">Fiscal Controls</DropdownMenuLabel>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/warden/payments/${payment.id}`} className="p-3 font-bold text-[10px] uppercase tracking-widest rounded-xl cursor-pointer flex items-center gap-3">
                                                    <Eye className="h-4 w-4 text-gray-400" /> View Detailed
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <div className="w-full">
                                                    <UnifiedReceipt data={payment} type="payment">
                                                        <div className="p-3 font-bold text-[10px] uppercase tracking-widest rounded-xl cursor-pointer flex items-center gap-3 hover:bg-slate-50">
                                                            <Receipt className="h-4 w-4 text-gray-400" /> Generate Slip
                                                        </div>
                                                    </UnifiedReceipt>
                                                </div>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleEditOpen(payment)}
                                                className="p-3 font-bold text-[10px] uppercase tracking-widest rounded-xl cursor-pointer flex items-center gap-3"
                                            >
                                                <Settings2 className="h-4 w-4 text-gray-400" /> Adjust Record
                                            </DropdownMenuItem>

                                            {payment.Booking?.securityDeposit > 0 && (
                                                <SecurityRefundModal booking={payment.Booking}>
                                                    <div className="p-3 font-bold text-[10px] uppercase tracking-widest rounded-xl cursor-pointer flex items-center gap-3 text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                                                        <Wallet className="h-4 w-4" /> Refund Security
                                                    </div>
                                                </SecurityRefundModal>
                                            )}

                                            <DropdownMenuSeparator className="bg-gray-50 my-1 mx-2" />
                                            <DropdownMenuItem
                                                onClick={() => handleDeleteClick(payment.id)}
                                                className="p-3 font-bold text-[10px] uppercase tracking-widest rounded-xl cursor-pointer flex items-center gap-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                            >
                                                <Trash2 className="h-4 w-4" /> Purge Entry
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <Button
                                        asChild
                                        className="h-10 md:h-11 flex-1 lg:flex-none px-6 md:px-8 rounded-xl bg-black hover:bg-gray-900 text-white font-black text-[9px] md:text-[10px] uppercase tracking-widest shadow-sm flex items-center justify-center gap-2"
                                    >
                                        <Link href={`/warden/payments/${payment.id}`}>
                                            Audit
                                            <ArrowRight className="h-3.5 w-3.5" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </TabsContent>

                    <TabsContent value="verification" className="space-y-4 md:space-y-6 outline-none min-w-0">
                        {filteredPayments.length > 0 ? (
                            filteredPayments.map((payment) => (
                                <div
                                    key={payment.id}
                                    className="bg-white border border-gray-100 rounded-2xl md:rounded-[2.5rem] p-4 md:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8 hover:shadow-md transition-shadow group relative overflow-hidden min-w-0"
                                >
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500 opacity-60" />

                                    <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-8 flex-1 w-full min-w-0">
                                        <div className="h-36 w-full sm:w-28 lg:w-24 rounded-2xl md:rounded-3xl bg-gray-50 border border-gray-100 flex flex-col items-center justify-center gap-3 shrink-0 overflow-hidden relative group/img">
                                            {payment.receiptUrl ? (
                                                <>
                                                    <img src={payment.receiptUrl} alt="Proof" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover/img:opacity-100 transition-opacity" />
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button size="icon" variant="ghost" className="h-full w-full relative z-10 hover:bg-black/20 group/scan"><Scan className="h-6 w-6 text-white drop-shadow-md group-hover/scan:scale-110 transition-transform" /></Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="w-[95vw] md:max-w-4xl bg-white p-0 border-none overflow-hidden rounded-[2rem] md:rounded-3xl shadow-2xl">
                                                            <div className="relative aspect-[16/10] bg-gray-50 flex items-center justify-center">
                                                                <img src={payment.receiptUrl} alt="Proof of Payment" className="max-w-full max-h-full object-contain p-4 md:p-12" />
                                                                <div className="absolute top-4 md:top-8 left-4 md:left-8 flex flex-col gap-2">
                                                                    <Badge className="bg-black text-white font-black uppercase text-[10px] tracking-widest px-4 py-1.5 rounded-full border-none">PORTAL RECEIPT</Badge>
                                                                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest px-1">REF: {payment.uid || payment.id.slice(-8)}</span>
                                                                </div>
                                                                <Button asChild className="absolute bottom-4 md:bottom-8 right-4 md:right-8 bg-black hover:bg-gray-900 text-white rounded-full px-8 h-12 font-black uppercase text-[10px] tracking-widest shadow-2xl">
                                                                    <Link href={payment.receiptUrl} target="_blank">
                                                                        <ExternalLink className="h-4 w-4 mr-2" /> Full View
                                                                    </Link>
                                                                </Button>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                </>
                                            ) : (
                                                <XCircle className="h-8 w-8 text-gray-200" />
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-4 flex-1 min-w-0 w-full text-center sm:text-left">
                                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 md:gap-3">
                                                <h4 className="text-base md:text-xl font-black text-gray-900 uppercase tracking-tight truncate max-w-full">{payment.User?.name}</h4>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge className="bg-amber-50 text-amber-600 border-none font-black uppercase text-[8px] md:text-[9px] tracking-widest px-3 py-1 rounded-full">ACTION REQUIRED</Badge>
                                                    {payment.receiptUrl && (
                                                        <Badge className="bg-emerald-50 text-emerald-600 border-none font-black uppercase text-[8px] md:text-[9px] tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5">
                                                            <ShieldCheck className="h-3 w-3" /> ATTACHED
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full px-2 sm:px-0">
                                                <div>
                                                    <span className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Fiscal Amount</span>
                                                    <p className="text-xs md:text-sm font-black text-gray-900 uppercase">PKR {payment.amount.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Method</span>
                                                    <p className="text-[10px] md:text-xs font-black text-emerald-600 uppercase tracking-widest truncate">{payment.method}</p>
                                                </div>
                                                <div className="hidden md:block">
                                                    <span className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1 truncate">Origin</span>
                                                    <p className="text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest truncate">{payment.Booking?.Room?.Hostel?.name}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Timestamp</span>
                                                    <p className="text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-tight">{format(new Date(payment.date), 'dd/MM/yy')}</p>
                                                </div>
                                            </div>
                                            {payment.notes && (
                                                <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-start gap-3 relative overflow-hidden group/note">
                                                    <div className="absolute top-0 right-0 p-1 opacity-10 group-hover/note:opacity-20 transition-opacity">
                                                        <MessageSquare className="h-8 w-8 text-indigo-900" />
                                                    </div>
                                                    <Info className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
                                                    <div className="flex flex-col gap-0.5 min-w-0 text-left">
                                                        <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Resident Comments</span>
                                                        <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wide leading-relaxed line-clamp-2 italic">
                                                            "{payment.notes}"
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 w-full lg:w-auto shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0">
                                        <Button
                                            variant="outline"
                                            className="flex-1 lg:w-32 h-12 rounded-2xl border-rose-100 bg-rose-50 text-rose-600 font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all order-2 lg:order-1"
                                            onClick={() => {
                                                setSelectedPaymentId(payment.id);
                                                setIsRejectDialogOpen(true);
                                            }}
                                        >
                                            Decline
                                        </Button>
                                        <Button
                                            className="flex-1 lg:w-40 h-12 rounded-2xl bg-black text-white hover:bg-gray-900 border-none font-black text-[10px] uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 order-1 lg:order-2 active:scale-95"
                                            onClick={() => handleApprove(payment.id)}
                                        >
                                            <ShieldCheck className="h-4 w-4" />
                                            Authorize
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-20 md:py-32 bg-white border border-dashed border-gray-100 rounded-[2.5rem] md:rounded-[4rem] text-center px-6">
                                <div className="h-20 w-20 md:h-24 md:w-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <ShieldCheck className="h-10 w-10 md:h-12 md:w-12 text-gray-200" />
                                </div>
                                <h3 className="text-sm md:text-lg font-black text-gray-900 uppercase tracking-widest">Clear Authorization Queue</h3>
                                <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest mt-2 max-w-sm mx-auto">All resident payment notifications have been processed for this branch.</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="refunds" className="space-y-3 md:space-y-4 outline-none min-w-0">

                        {filteredRefunds.length > 0 ? (
                            filteredRefunds.map((refund) => (
                                <div
                                    key={refund.id}
                                    className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 flex flex-col lg:flex-row items-center justify-between gap-4 md:gap-6 hover:shadow-md transition-shadow group relative overflow-hidden min-w-0"
                                >
                                    <div className={`absolute top-0 left-0 w-1.5 h-full ${refund.status === 'PENDING' ? 'bg-amber-500' : refund.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-rose-500'} opacity-70`} />

                                    <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0 w-full">
                                        <div className="flex items-center gap-3 md:gap-5 min-w-0 flex-1">
                                            <div className="h-10 w-10 md:h-14 md:w-14 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-sm shrink-0">
                                                <Undo2 className="h-5 w-5 md:h-6 md:w-6 text-rose-400" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <h4 className="text-sm md:text-base font-bold text-gray-900 uppercase tracking-tight truncate">{refund.User?.name}</h4>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{refund.Payment?.Booking?.Room?.Hostel?.name}</span>
                                                    <span className="h-1 w-1 rounded-full bg-gray-200" />
                                                    <span className="text-[8px] md:text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 md:px-2 py-0.5 rounded truncate uppercase">Refund</span>
                                                </div>
                                                <div className="mt-2 py-1 px-3 bg-slate-50 rounded-lg border border-gray-100 min-w-0">
                                                    <p className="text-[8px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 leading-none">Reason</p>
                                                    <p className="text-[10px] md:text-xs font-semibold text-gray-700 leading-relaxed italic line-clamp-2">"{refund.reason}"</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="hidden sm:flex flex-col gap-1 min-w-[120px] md:min-w-[160px]">
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="h-3.5 w-3.5 text-rose-500" />
                                                <span className="text-xs md:text-sm font-black text-rose-600 uppercase">PKR {refund.amount.toLocaleString()}</span>
                                            </div>
                                            <span className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest px-0.5 truncate">Original: {refund.Payment?.uid || refund.Payment?.id.slice(-6).toUpperCase()}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0 w-full lg:w-auto">
                                        {refund.status === 'PENDING' ? (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="flex-1 lg:flex-none h-10 px-4 md:px-6 rounded-xl font-bold text-[9px] md:text-[10px] uppercase tracking-wider text-gray-400 hover:text-rose-600 hover:bg-rose-50 order-2 lg:order-1"
                                                    onClick={() => updateRefundStatus.mutate({ id: refund.id, status: 'REJECTED', notes: 'Refund request declined by warden.' })}
                                                    disabled={updateRefundStatus.isPending}
                                                >
                                                    <XCircle className="h-3.5 w-3.5 mr-2" /> Decline
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="flex-1 lg:flex-none h-10 px-4 md:px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] md:text-[10px] uppercase tracking-wider shadow-lg shadow-emerald-500/20 order-1 lg:order-2"
                                                    onClick={() => updateRefundStatus.mutate({ id: refund.id, status: 'COMPLETED', notes: 'Refund processed and completed.' })}
                                                    disabled={updateRefundStatus.isPending}
                                                >
                                                    {updateRefundStatus.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <><CheckCircle2 className="h-3.5 w-3.5 mr-2" /> Approve</>}
                                                </Button>
                                            </>
                                        ) : (
                                            <Badge variant="outline" className={`${refund.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'} px-4 md:px-5 py-1.5 md:py-2 font-black text-[8px] md:text-[10px] uppercase tracking-widest rounded-xl border-2 w-full lg:w-auto text-center justify-center`}>
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