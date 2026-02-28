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
    useDeletePayment,
    useInitializeRent
} from "@/hooks/usePayment";
import {
    useRefundRequests,
    useUpdateRefundStatus
} from "@/hooks/useRefunds";
import { useHostel } from "@/hooks/usehostel";
import { Undo2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import UnifiedReceipt from "@/components/receipt/UnifiedReceipt";
import SecurityRefundModal from "./SecurityRefundModal";
import { useBookings } from "@/hooks/useBooking";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Loader from "@/components/ui/Loader";

const PaymentManagementPage = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("ledger");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");
    const [filterHostel, setFilterHostel] = useState("All");
    const [filterMonth, setFilterMonth] = useState("All");
    const [filterFromDate, setFilterFromDate] = useState("");
    const [filterToDate, setFilterToDate] = useState("");

    // Approval Logic States
    const [rejectionReason, setRejectionReason] = useState("");
    const [selectedPaymentId, setSelectedPaymentId] = useState(null);
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

    // Edit & Delete States
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
    const [paymentExportOptions, setPaymentExportOptions] = useState({
        fromDate: "",
        toDate: "",
        hostel: "All",
        status: "All",
        type: "All"
    });
    const [isExportingDefaulters, setIsExportingDefaulters] = useState(false);
    const [isExportingPayments, setIsExportingPayments] = useState(false);
    const [isDefaulterOptionsOpen, setIsDefaulterOptionsOpen] = useState(false);
    const [defaulterOptions, setDefaulterOptions] = useState({
        dueDay: 5,
        lateFeePerDay: 0,
        month: new Date().getMonth(),
        year: new Date().getFullYear()
    });
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({
        amount: 0,
        status: "",
        method: "",
        notes: ""
    });

    const { data: paymentsData, isLoading: paymentsLoading } = useAllPayments({ limit: 1000 });
    const { data: refundRequests, isLoading: refundsLoading } = useRefundRequests();
    const { data: stats, isLoading: statsLoading } = useFinancialStats();
    const { data: hostelsData } = useHostel();
    const { data: bookingsResponse } = useBookings();
    const bookings = bookingsResponse || [];
    const updatePayment = useUpdatePayment();
    const deletePayment = useDeletePayment();
    const initializeRent = useInitializeRent();
    const updateRefundStatus = useUpdateRefundStatus();

    const hostels = hostelsData?.data || [];

    // Admin Filtering: Allow filtering by selected hostel
    const filteredRefunds = useMemo(() => {
        if (!refundRequests) return [];
        return refundRequests.filter(r => {
            return filterHostel === "All" || r.Payment?.Booking?.Room?.Hostel?.name === filterHostel;
        });
    }, [refundRequests, filterHostel]);


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

            const pDate = payment.date ? new Date(payment.date) : null;
            const matchesMonth = filterMonth === "All" || (pDate && format(pDate, 'MMMM') === filterMonth);

            const matchesFromDate = !filterFromDate || (pDate && new Date(pDate.setHours(0, 0, 0, 0)) >= new Date(new Date(filterFromDate).setHours(0, 0, 0, 0)));
            const matchesToDate = !filterToDate || (pDate && new Date(pDate.setHours(0, 0, 0, 0)) <= new Date(new Date(filterToDate).setHours(0, 0, 0, 0)));

            const matchesStatus = filterStatus === "All" || payment.status === filterStatus;
            return matchesStatus && matchesHostel && matchesSearch && matchesMonth && matchesFromDate && matchesToDate;
        });
    }, [paymentsData, filterStatus, filterHostel, searchQuery, activeTab, filterMonth, filterFromDate, filterToDate]);

    const dynamicStats = useMemo(() => {
        const totalRevenue = filteredPayments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0);
        const pendingValue = filteredPayments.filter(p => p.status === 'PENDING' || p.status === 'PARTIAL').reduce((sum, p) => sum + p.amount, 0);
        const overdueValue = filteredPayments.filter(p => p.status === 'OVERDUE').reduce((sum, p) => sum + p.amount, 0);
        const totalReceivable = totalRevenue + pendingValue + overdueValue;
        const collectionRate = totalReceivable > 0 ? (totalRevenue / totalReceivable) * 100 : 0;
        const pendingCount = filteredPayments.filter(p => p.status === 'PENDING' || p.status === 'PARTIAL').length;

        return {
            totalRevenue,
            collectionRate,
            pendingCount,
            overdueValue
        };
    }, [filteredPayments]);

    const handleApprove = async (paymentId) => {
        try {
            await updatePayment.mutateAsync({
                id: paymentId,
                status: 'PAID'
            });
            toast.success("Approved");
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
            toast.success("Rejected");
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
            toast.success("Deleted");
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

    const handleExportDefaultersList = async () => {
        setIsDefaulterOptionsOpen(false);
        setIsExportingDefaulters(true);

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const targetMonth = defaulterOptions.month;
        const targetYear = defaulterOptions.year;

        const defaultersList = bookings.filter(b => {
            // Respect UI hostel filter
            if (filterHostel !== "All" && b.Room?.Hostel?.name !== filterHostel) return false;

            // Must be currently staying
            if (b.status !== "CHECKED_IN") return false;

            // Check if paid for target month
            const hasPaidForTargetMonth = b.Payment?.some(p => {
                const pDate = new Date(p.date || p.createdAt);
                return p.status === "PAID" && p.type === "RENT" && pDate.getMonth() === targetMonth && pDate.getFullYear() === targetYear;
            });

            return !hasPaidForTargetMonth;
        });

        // Delay for aesthetic
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            const doc = new jsPDF('landscape');
            doc.setFont("helvetica", "bold");

            // Header Section (Defaulters)
            doc.setFillColor(153, 27, 27);
            doc.rect(0, 0, doc.internal.pageSize.width, 35, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.text("RENT DEFAULTERS REPORT", doc.internal.pageSize.width / 2, 18, { align: "center" });
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            const monthName = new Date(targetYear, targetMonth, 1).toLocaleString('default', { month: 'long' });
            doc.text(`Defaulters for: ${monthName} ${targetYear} (Past ${defaulterOptions.dueDay}th)`, doc.internal.pageSize.width / 2, 26, { align: "center" });
            doc.setTextColor(80, 80, 80);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(`Generated On: ${format(new Date(), 'PPP p')}`, 14, 45);
            doc.text(`Total Defaulters: ${defaultersList.length}`, doc.internal.pageSize.width - 14, 45, { align: "right" });

            // --- New Payment Export Section ---
            // This will be added later after the defaulters section.


            // Draw Line
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.5);
            doc.line(14, 49, doc.internal.pageSize.width - 14, 49);

            const headers = [
                ["S.No", "Resident Name", "Phone", "Hostel", "Room", "Rent", "Delay", "Late Fee", "Total Due", "Last Payment"]
            ];

            const rows = defaultersList.map((b, index) => {
                const lastPayment = (b.Payment && b.Payment.length > 0) ? format(new Date(b.Payment[0].date), 'dd/MM/yyyy') : 'Never';

                // Calculate Overdue Days & Late Fee
                let lateFee = 0;
                let overdueDays = 0;

                const isTargetCurrent = targetMonth === currentMonth && targetYear === currentYear;

                if (isTargetCurrent) {
                    if (currentDay > defaulterOptions.dueDay) {
                        overdueDays = currentDay - defaulterOptions.dueDay;
                    }
                } else {
                    // Past Month: Assume they are overdue for all days past dueDay in that month
                    // (Actually if it's now feb, Jan rent is overdue for whole Jan month - dueDay)
                    const lastDayInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
                    overdueDays = lastDayInTargetMonth - defaulterOptions.dueDay;
                }

                lateFee = Math.max(0, overdueDays) * (defaulterOptions.lateFeePerDay || 0);
                const totalDue = (b.totalAmount || 0) + lateFee;

                return [
                    index + 1,
                    b.User?.name || 'N/A',
                    b.User?.phone || 'N/A',
                    b.Room?.Hostel?.name || 'N/A',
                    b.Room?.roomNumber || 'N/A',
                    `PKR ${(b.totalAmount || 0).toLocaleString()}`,
                    `${Math.max(0, overdueDays)} Days`,
                    `PKR ${lateFee.toLocaleString()}`,
                    `PKR ${totalDue.toLocaleString()}`,
                    lastPayment
                ];
            });

            autoTable(doc, {
                startY: 55,
                head: headers,
                body: rows,
                theme: 'grid',
                headStyles: {
                    fillColor: [185, 28, 28], // red-700
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 9,
                    halign: 'center'
                },
                bodyStyles: {
                    fontSize: 9,
                    textColor: [50, 50, 50]
                },
                alternateRowStyles: {
                    fillColor: [254, 242, 242] // red-50
                },
                columnStyles: {
                    0: { cellWidth: 10, halign: 'center' }, // S.No
                    5: { cellWidth: 25 }, // Rent
                    6: { cellWidth: 15 }, // Delay
                    7: { cellWidth: 25 }, // Late Fee
                    8: { cellWidth: 25 }, // Total Due
                },
                styles: {
                    overflow: 'linebreak',
                    cellPadding: 4,
                    valign: 'middle'
                },
                didDrawPage: function (data) {
                    let str = "Page " + doc.internal.getNumberOfPages();
                    doc.setFontSize(8);
                    doc.setTextColor(150, 150, 150);
                    doc.text(str, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: "center" });
                    doc.text("Official GreenView Hostels Records", 14, doc.internal.pageSize.height - 10);
                }
            });

            doc.save(`Defaulters_Report_${format(now, 'MMM_yyyy')}.pdf`);
            toast.success("Defaulters Report Exported 🚨");
        } catch (error) {
            toast.error("Failed to export Defaulters PDF");
            console.error(error);
        } finally {
            setIsExportingDefaulters(false);
        }
    };

    const handleExportPaymentsList = async () => {
        setIsExportingPayments(true);
        setIsExportDialogOpen(false);
        try {
            const rawPayments = paymentsData?.payments || [];

            // Apply Advanced Export Filters
            const listToExport = rawPayments.filter(p => {
                const pDate = new Date(p.date || p.createdAt);

                // Date Range
                if (paymentExportOptions.fromDate && pDate < new Date(paymentExportOptions.fromDate)) return false;
                if (paymentExportOptions.toDate) {
                    const to = new Date(paymentExportOptions.toDate);
                    to.setHours(23, 59, 59);
                    if (pDate > to) return false;
                }

                // Hostel
                if (paymentExportOptions.hostel !== "All" && p.Booking?.Room?.Hostel?.name !== paymentExportOptions.hostel) return false;

                // Status
                if (paymentExportOptions.status !== "All" && p.status !== paymentExportOptions.status) return false;

                // Type
                if (paymentExportOptions.type !== "All" && p.type !== paymentExportOptions.type) return false;

                return true;
            });

            const doc = new jsPDF('landscape');
            doc.setFont("helvetica", "bold");

            // Header Section
            doc.setFillColor(37, 99, 235); // blue-600
            doc.rect(0, 0, doc.internal.pageSize.width, 35, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.text("PAYMENTS REPORT", doc.internal.pageSize.width / 2, 18, { align: "center" });
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");

            let dateRangeStr = "Full History";
            if (paymentExportOptions.fromDate && paymentExportOptions.toDate) dateRangeStr = `${paymentExportOptions.fromDate} to ${paymentExportOptions.toDate}`;
            else if (paymentExportOptions.fromDate) dateRangeStr = `Since ${paymentExportOptions.fromDate}`;
            else if (paymentExportOptions.toDate) dateRangeStr = `Until ${paymentExportOptions.toDate}`;

            doc.text(`Range: ${dateRangeStr} | Count: ${listToExport.length}`, doc.internal.pageSize.width / 2, 26, { align: "center" });

            doc.setTextColor(80, 80, 80);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(`Generated On: ${format(new Date(), 'PPP p')}`, 14, 45);
            doc.text(`Filters - Hostel: ${paymentExportOptions.hostel} | Status: ${paymentExportOptions.status} | Type: ${paymentExportOptions.type}`, doc.internal.pageSize.width - 14, 45, { align: "right" });

            // Draw Line
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.5);
            doc.line(14, 49, doc.internal.pageSize.width - 14, 49);

            const headers = [
                ["S.No", "Date", "Resident Name", "Hostel", "Room", "Amount", "Status", "Method", "Type"]
            ];

            const rows = listToExport.map((p, index) => [
                index + 1,
                format(new Date(p.date || p.createdAt), 'dd/MM/yyyy'),
                p.User?.name || 'N/A',
                p.Booking?.Room?.Hostel?.name || 'N/A',
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
                headStyles: {
                    fillColor: [37, 99, 235], // blue-600
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 9,
                    halign: 'center'
                },
                bodyStyles: {
                    fontSize: 9,
                    textColor: [50, 50, 50]
                },
                alternateRowStyles: {
                    fillColor: [239, 246, 255] // blue-50
                },
                columnStyles: {
                    0: { cellWidth: 10, halign: 'center' }, // S.No
                },
                styles: {
                    overflow: 'linebreak',
                    cellPadding: 4,
                    valign: 'middle'
                },
                didDrawPage: function (data) {
                    let str = "Page " + doc.internal.getNumberOfPages();
                    doc.setFontSize(8);
                    doc.setTextColor(150, 150, 150);
                    doc.text(str, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: "center" });
                    doc.text("Official GreenView Hostels Records", 14, doc.internal.pageSize.height - 10);
                }
            });

            doc.save(`Payments_Report_${format(new Date(), 'dd_MM_yyyy')}.pdf`);
            toast.success("Payments Report Exported!");
        } catch (error) {
            toast.error("Failed to export Payments PDF");
            console.error(error);
        } finally {
            setIsExportingPayments(false);
        }
    };

    if (paymentsLoading || statsLoading) return (
        <Loader label="Loading" subLabel="Updates..." icon={Wallet} fullScreen={false} />
    );

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight print:hidden">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-50 py-2 md:h-16">
                <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-full flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-1 bg-blue-600 rounded-full shrink-0" />
                        <div className="flex flex-col">
                            <h1 className="text-base md:text-lg font-bold text-gray-900 tracking-tight uppercase">Payments</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total</span>
                                <div className="h-1 w-1 rounded-full bg-blue-500 animate-pulse" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Live</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                        <Button
                            variant="outline"
                            className="h-8 md:h-9 px-3 md:px-4 cursor-pointer rounded-xl border-amber-200 bg-amber-50 font-bold text-[9px] md:text-[10px] uppercase tracking-wider text-amber-700 hover:bg-amber-100 transition-all shadow-sm flex items-center gap-2 flex-1 md:flex-none justify-center"
                            onClick={() => initializeRent.mutate()}
                            disabled={initializeRent.isPending}
                        >
                            {initializeRent.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                            <span className="truncate">Create Monthly Dues</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 md:h-9 px-3 md:px-4 cursor-pointer rounded-xl border-rose-200 bg-rose-50 font-bold text-[9px] md:text-[10px] uppercase tracking-wider text-rose-700 hover:bg-rose-100 transition-all shadow-sm flex items-center gap-2 flex-1 md:flex-none justify-center"
                            onClick={() => setIsDefaulterOptionsOpen(true)}
                            disabled={isExportingDefaulters}
                        >
                            {isExportingDefaulters ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <AlertCircle className="h-3.5 w-3.5" />}
                            <span className="truncate">Late</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 md:h-9 px-3 md:px-4 cursor-pointer rounded-xl border-indigo-200 bg-indigo-50 font-bold text-[9px] md:text-[10px] uppercase tracking-wider text-indigo-700 hover:bg-indigo-100 transition-all shadow-sm flex items-center gap-2 flex-1 md:flex-none justify-center"
                            onClick={() => setIsExportDialogOpen(true)}
                            disabled={isExportingPayments}
                        >
                            {isExportingPayments ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                            <span className="truncate">Report</span>
                        </Button>
                        <Button
                            className="h-8 md:h-9 px-4 md:px-6 cursor-pointer rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[9px] md:text-[10px] uppercase tracking-wider shadow-sm transition-all active:scale-95 flex-1 md:flex-none justify-center"
                            onClick={() => router.push('/admin/bookings')}
                        >
                            <Plus className="h-3.5 w-3.5 mr-1.5 " /> <span className="truncate">Create New Dues</span>
                        </Button>
                    </div>
                </div>
            </div>


            <main className="max-w-[1400px] mx-auto px-6 py-8 space-y-8">
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {[
                        { label: 'Revenue', value: `PKR ${(dynamicStats.totalRevenue / 1000).toFixed(1)}k`, icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Rate', value: `${dynamicStats.collectionRate.toFixed(0)}%`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Pending', value: dynamicStats.pendingCount, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Late', value: `PKR ${(dynamicStats.overdueValue / 1000).toFixed(1)}k`, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 flex items-center gap-3 md:gap-4 shadow-sm hover:shadow-md transition-shadow cursor-default min-w-0">
                            <div className={`h-9 w-9 md:h-11 md:w-11 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                                <stat.icon className="h-4 w-4 md:h-5 md:w-5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{stat.label}</span>
                                <span className="text-sm md:text-xl font-bold text-gray-900 tracking-tight truncate">{stat.value}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Search and Filters */}
                <div className="bg-white border border-gray-100 rounded-2xl p-2 flex flex-col md:flex-row items-center gap-2 md:gap-4 shadow-sm">
                    <div className="flex-1 relative w-full group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-blue-600 transition-colors" />
                        <Input
                            placeholder="Search"
                            className="w-full h-11 md:h-12 pl-12 bg-transparent border-none shadow-none font-bold text-sm focus-visible:ring-0 placeholder:text-gray-300"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase animate-in fade-in zoom-in hidden sm:block">
                                {filteredPayments.length} Total
                            </span>
                        )}
                    </div>

                    <div className="h-4 w-px bg-gray-100 mx-2 hidden md:block" />

                    <div className="flex items-center gap-1 md:gap-2 p-1 bg-gray-50 rounded-xl w-full md:w-auto overflow-x-auto scrollbar-hide">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-9 md:h-10 px-3 md:px-4 rounded-lg font-bold text-[9px] md:text-[10px] uppercase tracking-wider text-gray-500 hover:bg-white hover:text-black hover:shadow-sm flex-1 md:flex-none">
                                    <Filter className="h-3.5 w-3.5 mr-1.5 md:mr-2 text-gray-400" />
                                    <span className="truncate">{filterStatus === 'All' ? 'Status' : filterStatus}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[180px] md:w-[220px] rounded-xl border-gray-100 shadow-xl p-2">
                                <DropdownMenuLabel className="text-[9px] font-bold uppercase tracking-widest text-gray-400 p-2">Status</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-gray-50 mb-1" />
                                {["All", "PAID", "PENDING", "PARTIAL", "OVERDUE", "REJECTED"].map(status => (
                                    <DropdownMenuItem key={status} onClick={() => setFilterStatus(status)} className="p-2.5 font-bold text-[10px] uppercase tracking-wider rounded-lg cursor-pointer">
                                        {status}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="h-4 w-px bg-gray-200 shrink-0 hidden md:block" />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-9 md:h-10 px-3 md:px-4 rounded-lg font-bold text-[9px] md:text-[10px] uppercase tracking-wider text-gray-500 hover:bg-white hover:text-black hover:shadow-sm flex-1 md:flex-none">
                                    <Building2 className="h-3.5 w-3.5 mr-1.5 md:mr-2 text-gray-400" />
                                    <span className="truncate">{filterHostel === 'All' ? 'Hostel' : filterHostel}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[200px] md:w-[280px] rounded-xl border-gray-100 shadow-xl p-2">
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

                        <div className="h-4 w-px bg-gray-200 shrink-0 hidden md:block" />

                        <div className="flex items-center gap-2 px-2">
                            <div className="flex items-center gap-1.5 bg-white border border-gray-100 rounded-lg px-2 h-9 md:h-10">
                                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">From</span>
                                <input
                                    type="date"
                                    className="bg-transparent border-none text-[10px] font-bold focus:outline-none w-24"
                                    value={filterFromDate}
                                    onChange={(e) => setFilterFromDate(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-1.5 bg-white border border-gray-100 rounded-lg px-2 h-9 md:h-10">
                                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">To</span>
                                <input
                                    type="date"
                                    className="bg-transparent border-none text-[10px] font-bold focus:outline-none w-24"
                                    value={filterToDate}
                                    onChange={(e) => setFilterToDate(e.target.value)}
                                />
                            </div>
                            {(filterFromDate || filterToDate) && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-400 hover:text-rose-600"
                                    onClick={() => { setFilterFromDate(""); setFilterToDate(""); }}
                                >
                                    <RefreshCw className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-2">
                        <TabsList className="bg-white border border-gray-100 p-1 rounded-xl h-11 w-full lg:w-auto shadow-sm overflow-x-auto scrollbar-hide flex justify-start lg:justify-center">
                            <TabsTrigger
                                value="ledger"
                                className="h-full px-4 md:px-8 rounded-lg font-bold text-[9px] md:text-[10px] uppercase tracking-wider data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all shrink-0"
                            >
                                <Boxes className="h-3.5 w-3.5 mr-2" /> All Payments
                            </TabsTrigger>
                            <TabsTrigger
                                value="verification"
                                className="h-full px-4 md:px-8 rounded-lg font-bold text-[9px] md:text-[10px] uppercase tracking-wider data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all relative shrink-0"
                            >
                                <CheckCircle className="h-3.5 w-3.5 mr-2" /> Pending Approvals
                                {(paymentsData?.payments?.filter(p => (p.status === 'PENDING' || p.status === 'PARTIAL')).length > 0) && (
                                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                )}
                            </TabsTrigger>
                            <TabsTrigger
                                value="refunds"
                                className="h-full px-4 md:px-8 rounded-lg font-bold text-[9px] md:text-[10px] uppercase tracking-wider data-[state=active]:bg-rose-600 data-[state=active]:text-white transition-all relative shrink-0"
                            >
                                <Undo2 className="h-3.5 w-3.5 mr-2" /> Refunds
                                {(filteredRefunds.filter(r => r.status === 'PENDING').length > 0) && (
                                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                                )}
                            </TabsTrigger>
                        </TabsList>


                        <div className="hidden lg:flex items-center gap-3">
                            <div className="flex items-center -space-x-1">
                                <div className="h-5 w-5 rounded-full border-2 border-white bg-blue-50 flex items-center justify-center">
                                    <Activity className="h-2 w-2 text-blue-600" />
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Total</span>
                            <span className="text-[10px] font-black text-gray-900 uppercase tracking-tight">{filteredPayments.length} Total</span>
                        </div>
                    </div>

                    <TabsContent value="ledger" className="space-y-4 outline-none">
                        {filteredPayments.map((payment) => (
                            <div
                                key={payment.id}
                                className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 md:gap-6 hover:shadow-md transition-shadow group relative overflow-hidden"
                            >
                                <div className={`absolute top-0 left-0 w-1 md:w-1.5 h-full ${getRibbonColor(payment.status)} opacity-70`} />

                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 flex-1 min-w-0 w-full">
                                    <div className="flex items-center gap-3 md:gap-5 min-w-0 lg:min-w-[280px] w-full sm:w-auto">
                                        <div className="h-10 w-10 md:h-14 md:w-14 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-sm shrink-0 group-hover:bg-blue-600 transition-colors">
                                            <User className="h-5 w-5 md:h-6 md:w-6 text-gray-400 group-hover:text-white transition-colors" />
                                        </div>
                                        <div className="flex flex-col min-w-0 flex-1 sm:flex-none">
                                            <h4 className="text-sm md:text-base font-bold text-gray-900 uppercase tracking-tight truncate">{payment.User?.name}</h4>
                                            <div className="flex items-center gap-1.5 md:gap-2 mt-0.5">
                                                <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{payment.Booking?.Room?.Hostel?.name}</span>
                                                {payment.uid && (
                                                    <>
                                                        <span className="h-0.5 w-0.5 rounded-full bg-gray-200" />
                                                        <span className="text-[9px] md:text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded truncate">{payment.uid}</span>
                                                    </>
                                                )}
                                            </div>
                                            {payment.notes && (
                                                <div className="flex items-center gap-1.5 mt-1.5 py-0.5 px-2 bg-blue-50/30 rounded-md border border-blue-100/20 w-fit">
                                                    <FileText className="h-2.5 w-2.5 text-blue-400" />
                                                    <span className="text-[8px] md:text-[9px] font-bold text-blue-600/60 uppercase tracking-widest truncate max-w-[120px] md:max-w-[200px]">
                                                        {payment.notes}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-1 min-w-0 sm:min-w-[140px] md:min-w-[160px]">
                                        <div className="flex items-center gap-1.5 md:gap-2">
                                            <CreditCard className="h-3 w-3 md:h-3.5 md:w-3.5 text-blue-500" />
                                            <span className="text-xs md:text-sm font-bold text-gray-900 uppercase">PKR {payment.amount.toLocaleString()}</span>
                                        </div>
                                        <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest px-0.5 whitespace-nowrap">{payment.method}</span>
                                    </div>

                                    <div className="hidden sm:flex items-center gap-3 min-w-0 md:min-w-[180px] xl:min-w-[220px]">
                                        <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100 shrink-0">
                                            <Calendar className="h-3.5 w-3.5" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-wider">Date</span>
                                            <span className="text-[10px] md:text-xs font-bold text-gray-900 uppercase truncate">{format(new Date(payment.date), 'MMM dd, yyyy')}</span>
                                        </div>
                                    </div>

                                    <div className="flex-1 flex justify-end lg:justify-center w-full lg:w-auto min-w-0 lg:min-w-[140px]">
                                        <Badge variant="outline" className={`${getStatusStyle(payment.status)} px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[8px] md:text-[9px] font-bold uppercase tracking-widest border shadow-sm`}>
                                            {payment.status}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 w-full lg:w-auto lg:ml-auto justify-end pt-2 lg:pt-0 border-t lg:border-none border-gray-50">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button size="icon" variant="ghost" className="h-9 w-9 md:h-10 md:w-10 rounded-full hover:bg-gray-50 text-gray-400 transition-colors">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 rounded-xl border-gray-100 shadow-xl p-2">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/admin/payments/${payment.id}`} className="p-2.5 font-bold text-[10px] uppercase tracking-wider rounded-lg cursor-pointer flex items-center gap-2">
                                                    <Eye className="h-3.5 w-3.5" /> View
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <UnifiedReceipt data={payment} type="payment">
                                                    <div className="w-full p-2.5 font-bold text-[10px] uppercase tracking-wider rounded-lg cursor-pointer flex items-center gap-2 hover:bg-slate-50 transition-colors">
                                                        <Receipt className="h-3.5 w-3.5" /> Receipt
                                                    </div>
                                                </UnifiedReceipt>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleEditOpen(payment)} className="p-2.5 font-bold text-[10px] uppercase tracking-wider rounded-lg cursor-pointer flex items-center gap-2">
                                                <Settings2 className="h-3.5 w-3.5" /> Edit
                                            </DropdownMenuItem>

                                            {payment.Booking?.securityDeposit > 0 && (
                                                <SecurityRefundModal booking={payment.Booking}>
                                                    <div className="p-2.5 font-bold text-[10px] uppercase tracking-wider rounded-lg cursor-pointer flex items-center gap-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                                                        <Wallet className="h-3.5 w-3.5" /> Refund
                                                    </div>
                                                </SecurityRefundModal>
                                            )}

                                            <DropdownMenuSeparator className="bg-gray-50" />
                                            <DropdownMenuItem onClick={() => handleDeleteClick(payment.id)} className="p-2.5 font-bold text-[10px] uppercase tracking-wider rounded-lg cursor-pointer flex items-center gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                                                <Trash2 className="h-3.5 w-3.5" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <Button asChild className="h-9 md:h-10 px-4 md:px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[9px] md:text-[10px] uppercase tracking-wider shadow-sm flex items-center gap-2 group/btn">
                                        <Link href={`/admin/payments/${payment.id}`}>
                                            Check
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
                                <div key={payment.id} className="bg-white border border-gray-100 rounded-3xl p-4 md:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 md:gap-8 hover:shadow-md transition-shadow group relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 md:w-1.5 h-full bg-amber-500 opacity-70" />
                                    <div className="flex flex-col sm:flex-row items-center sm:items-start lg:items-center gap-4 md:gap-8 flex-1 w-full min-w-0">
                                        <div className="h-40 w-full sm:w-20 sm:h-24 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center gap-3 shrink-0 overflow-hidden relative group/img">
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
                                                                    <Badge className="bg-blue-600 text-white font-bold uppercase text-[9px] tracking-widest px-3">CHECK</Badge>
                                                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{payment.uid ? `REF: ${payment.uid}` : `ID: ${payment.id.slice(-8)}`}</span>
                                                                </div>
                                                                <Link href={payment.receiptUrl} target="_blank" className="absolute bottom-6 right-6">
                                                                    <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 h-10 font-bold uppercase text-[10px] tracking-wider shadow-lg"><ExternalLink className="h-3.5 w-3.5 mr-2" /> Open</Button>
                                                                </Link>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                </>
                                            ) : (
                                                <XCircle className="h-6 w-6 text-gray-300" />
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-4 flex-1 min-w-0 w-full">
                                            <div className="flex items-center gap-3">
                                                <h4 className="text-base md:text-lg font-bold text-gray-900 uppercase tracking-tight truncate">{payment.User?.name}</h4>
                                                <Badge className="hidden sm:inline-flex bg-amber-50 text-amber-600 border-amber-100 font-bold uppercase text-[8px] md:text-[9px] tracking-widest px-2 md:px-3">Open</Badge>
                                                <Link href={`/admin/payment-approvals/${payment.id}`} className="ml-auto lg:hidden">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-500"><ExternalLink className="h-4 w-4" /></Button>
                                                </Link>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                                                <div className="min-w-0">
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Total</span>
                                                    <p className="text-sm font-bold text-gray-900 uppercase truncate">PKR {payment.amount.toLocaleString()}</p>
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Method</span>
                                                    <p className="text-[10px] md:text-xs font-bold text-emerald-600 uppercase tracking-widest truncate">{payment.method}</p>
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Hostel</span>
                                                    <p className="text-[10px] md:text-xs font-bold text-gray-900 uppercase tracking-widest truncate">{payment.Booking?.Room?.Hostel?.name}</p>
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Date Sent</span>
                                                    <p className="text-[10px] md:text-xs font-bold text-gray-900 uppercase tracking-tight truncate">{format(new Date(payment.date), 'dd/MM/yy HH:mm')}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0 border-t lg:border-none pt-4 lg:pt-0">
                                        <Button
                                            asChild
                                            variant="ghost"
                                            className="h-11 w-11 md:h-12 md:w-12 rounded-xl hover:bg-gray-100 text-gray-400 order-3 hidden lg:flex items-center justify-center p-0"
                                        >
                                            <Link href={`/admin/payment-approvals/${payment.id}`}>
                                                <ChevronRight className="h-5 w-5" />
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="flex-1 cursor-pointer lg:w-28 h-11 md:h-12 rounded-xl border-rose-100 bg-rose-50 text-rose-600 font-bold text-[10px] uppercase tracking-wider hover:bg-rose-600 hover:text-white transition-all order-2 lg:order-1"
                                            onClick={() => {
                                                setSelectedPaymentId(payment.id);
                                                setIsRejectDialogOpen(true);
                                            }}
                                        >
                                            {updatePayment.isPending && selectedPaymentId === payment.id ? "Rejecting..." : "Reject"}
                                        </Button>
                                        <Button
                                            className="flex-1 lg:w-32 cursor-pointer h-11 md:h-12 rounded-xl bg-blue-600 text-white hover:bg-blue-700 border-none font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 order-1 lg:order-2 active:scale-95"
                                            onClick={() => handleApprove(payment.id)}
                                        >
                                            <CheckCircle className="h-4 w-4" />
                                            {updatePayment.isPending && selectedPaymentId === payment.id ? "Approving..." : "Approve"}
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

                    <TabsContent value="refunds" className="space-y-4 outline-none">
                        {filteredRefunds.length > 0 ? (
                            filteredRefunds.map((refund) => (
                                <div
                                    key={refund.id}
                                    className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 md:gap-6 hover:shadow-md transition-shadow group relative overflow-hidden"
                                >
                                    <div className={`absolute top-0 left-0 w-1 md:w-1.5 h-full ${refund.status === 'PENDING' ? 'bg-amber-500' : refund.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-rose-500'} opacity-70`} />

                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 flex-1 min-w-0 w-full">
                                        <div className="flex items-center gap-3 md:gap-5 min-w-0 lg:min-w-[280px] w-full sm:w-auto">
                                            <div className="h-10 w-10 md:h-14 md:w-14 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-sm shrink-0">
                                                <Undo2 className="h-5 w-5 md:h-6 md:w-6 text-rose-400" />
                                            </div>
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <h4 className="text-sm md:text-base font-bold text-gray-900 uppercase tracking-tight truncate">{refund.User?.name}</h4>
                                                <div className="flex items-center gap-1.5 md:gap-2 mt-0.5">
                                                    <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{refund.Payment?.Booking?.Room?.Hostel?.name}</span>
                                                    <span className="h-0.5 w-0.5 rounded-full bg-gray-200" />
                                                    <span className="text-[9px] md:text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded truncate">Refund</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-1 md:mt-0 py-2 px-3 bg-slate-50 rounded-lg border border-gray-100 flex-1 min-w-0 w-full">
                                            <p className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1 leading-none">Reason</p>
                                            <p className="text-[10px] md:text-xs font-semibold text-gray-700 leading-relaxed italic truncate sm:whitespace-normal">"{refund.reason}"</p>
                                        </div>

                                        <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-1 min-w-0 sm:min-w-[140px] md:min-w-[160px]">
                                            <div className="flex items-center gap-1.5 md:gap-2">
                                                <CreditCard className="h-3 w-3 md:h-3.5 md:w-3.5 text-rose-500" />
                                                <span className="text-xs md:text-sm font-black text-rose-600 uppercase">PKR {refund.amount.toLocaleString()}</span>
                                            </div>
                                            <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest px-0.5 truncate overflow-hidden">UID: {refund.Payment?.uid || refund.Payment?.id.slice(-6).toUpperCase()}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 w-full lg:w-auto mt-2 lg:mt-0 border-t lg:border-none pt-4 lg:pt-0 justify-end">
                                        {refund.status === 'PENDING' ? (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-9 md:h-10 px-4 md:px-6 rounded-xl font-bold text-[9px] md:text-[10px] uppercase tracking-wider text-gray-400 hover:text-rose-600 hover:bg-rose-50 flex-1 sm:grow-0"
                                                    onClick={() => updateRefundStatus.mutate({ id: refund.id, status: 'REJECTED', notes: 'Refund request declined by administration.' })}
                                                    disabled={updateRefundStatus.isPending}
                                                >
                                                    <XCircle className="h-3.5 w-3.5 mr-2" /> Decline
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="h-9 md:h-10 px-4 md:px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] md:text-[10px] uppercase tracking-wider shadow-lg shadow-emerald-500/20 flex-1 sm:grow-0"
                                                    onClick={() => updateRefundStatus.mutate({ id: refund.id, status: 'COMPLETED', notes: 'Refund processed and completed.' })}
                                                    disabled={updateRefundStatus.isPending}
                                                >
                                                    {updateRefundStatus.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <><CheckCircle2 className="h-3.5 w-3.5 mr-2" /> Approve Refund</>}
                                                </Button>
                                            </>
                                        ) : (
                                            <Badge variant="outline" className={`${refund.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'} px-4 md:px-5 py-1.5 md:py-2 font-black text-[9px] md:text-[10px] uppercase tracking-widest rounded-xl border-2`}>
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
                                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1 max-w-[320px] mx-auto leading-relaxed">No reversal requests submitted for the current filters.</p>
                            </div>
                        )}
                    </TabsContent>

                </Tabs>


            </main>

            <Dialog open={isDefaulterOptionsOpen} onOpenChange={setIsDefaulterOptionsOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-white ring-1 ring-gray-100">
                    <div className="bg-rose-600 p-10 text-white text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/10 skew-x-12 translate-x-20" />
                        <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/10 shadow-lg">
                            <Clock className="h-8 w-8 text-white stroke-[1.5]" />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tight">Late Fee Options</h2>
                        <p className="text-[10px] text-rose-100 font-bold tracking-widest mt-2 uppercase">Configure Defaulters Report</p>
                    </div>

                    <div className="p-10 space-y-6">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Rent Due Day (from 1st)</Label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    type="number"
                                    min="1"
                                    max="31"
                                    placeholder="e.g. 5"
                                    value={defaulterOptions.dueDay}
                                    onChange={(e) => setDefaulterOptions({ ...defaulterOptions, dueDay: Number(e.target.value) })}
                                    className="h-14 pl-12 rounded-2xl border-gray-100 bg-gray-50 font-bold text-gray-900 focus:ring-rose-500"
                                />
                            </div>
                            <p className="text-[9px] text-gray-400 font-medium italic ml-1">
                                Residents who haven't paid rent by this day will be marked as defaulters.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Late Fee (per day)</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    type="number"
                                    min="0"
                                    placeholder="e.g. 100"
                                    value={defaulterOptions.lateFeePerDay}
                                    onChange={(e) => setDefaulterOptions({ ...defaulterOptions, lateFeePerDay: Number(e.target.value) })}
                                    className="h-14 pl-12 rounded-2xl border-gray-100 bg-gray-50 font-bold text-gray-900 focus:ring-rose-500"
                                />
                            </div>
                            <p className="text-[9px] text-gray-400 font-medium italic ml-1">
                                Added to the total for each day past the due date.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Target Month</Label>
                                <select
                                    className="w-full h-14 rounded-2xl border-gray-100 bg-gray-50 font-bold text-gray-900 px-4 focus:ring-rose-500"
                                    value={defaulterOptions.month}
                                    onChange={(e) => setDefaulterOptions({ ...defaulterOptions, month: Number(e.target.value) })}
                                >
                                    {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => (
                                        <option key={i} value={i}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Target Year</Label>
                                <select
                                    className="w-full h-14 rounded-2xl border-gray-100 bg-gray-50 font-bold text-gray-900 px-4 focus:ring-rose-500"
                                    value={defaulterOptions.year}
                                    onChange={(e) => setDefaulterOptions({ ...defaulterOptions, year: Number(e.target.value) })}
                                >
                                    {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button
                                variant="ghost"
                                className="flex-1 rounded-2xl h-14 font-bold text-[10px] uppercase tracking-wider text-gray-400 hover:bg-gray-50"
                                onClick={() => setIsDefaulterOptionsOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 h-14 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] uppercase tracking-widest rounded-2xl shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-2"
                                onClick={handleExportDefaultersList}
                            >
                                <Download className="h-4 w-4" /> Export PDF
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-white ring-1 ring-gray-100">
                    <div className="bg-indigo-600 p-10 text-white text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/10 skew-x-12 translate-x-20" />
                        <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/10 shadow-lg">
                            <FileText className="h-8 w-8 text-white stroke-[1.5]" />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tight">Export Payments</h2>
                        <p className="text-[10px] text-indigo-100 font-bold tracking-widest mt-2 uppercase">Custom Payment Report</p>
                    </div>

                    <div className="p-10 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">From Date</Label>
                                <Input
                                    type="date"
                                    className="h-12 rounded-xl border-gray-100 bg-gray-50 font-bold"
                                    value={paymentExportOptions.fromDate}
                                    onChange={(e) => setPaymentExportOptions({ ...paymentExportOptions, fromDate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">To Date</Label>
                                <Input
                                    type="date"
                                    className="h-12 rounded-xl border-gray-100 bg-gray-50 font-bold"
                                    value={paymentExportOptions.toDate}
                                    onChange={(e) => setPaymentExportOptions({ ...paymentExportOptions, toDate: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Hostel</Label>
                            <select
                                className="w-full h-12 rounded-xl border-gray-100 bg-gray-50 font-bold text-sm px-4 focus:ring-indigo-500"
                                value={paymentExportOptions.hostel}
                                onChange={(e) => setPaymentExportOptions({ ...paymentExportOptions, hostel: e.target.value })}
                            >
                                <option value="All">All Hostels</option>
                                {hostels.map(h => <option key={h.id} value={h.name}>{h.name}</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Status</Label>
                                <select
                                    className="w-full h-12 rounded-xl border-gray-100 bg-gray-50 font-bold text-sm px-4 focus:ring-indigo-500"
                                    value={paymentExportOptions.status}
                                    onChange={(e) => setPaymentExportOptions({ ...paymentExportOptions, status: e.target.value })}
                                >
                                    <option value="All">All Status</option>
                                    {["PAID", "PENDING", "PARTIAL", "OVERDUE", "REJECTED"].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Type</Label>
                                <select
                                    className="w-full h-12 rounded-xl border-gray-100 bg-gray-50 font-bold text-sm px-4 focus:ring-indigo-500"
                                    value={paymentExportOptions.type}
                                    onChange={(e) => setPaymentExportOptions({ ...paymentExportOptions, type: e.target.value })}
                                >
                                    <option value="All">All Types</option>
                                    {["RENT", "SECURITY", "MAINTENANCE", "LATE_FEE", "OTHER"].map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button
                                variant="ghost"
                                className="flex-1 rounded-2xl h-14 font-bold text-[10px] uppercase tracking-wider text-gray-400 hover:bg-gray-50"
                                onClick={() => setIsExportDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-widest rounded-2xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                                onClick={handleExportPaymentsList}
                            >
                                <Download className="h-4 w-4" /> Export
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

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
        </div >
    );
};

export default PaymentManagementPage;