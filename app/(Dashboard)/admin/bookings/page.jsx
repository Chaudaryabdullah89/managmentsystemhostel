"use client"
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Calendar,
    DollarSign,
    User,
    Home,
    BedDouble,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    History,
    Search,
    Filter,
    Eye,
    Download,
    Phone,
    Mail,
    MapPin,
    CreditCard,
    FileText,
    ChevronRight,
    Plus,
    Building2,
    ShieldCheck,
    RefreshCw,
    Layers,
    ArrowUpRight,
    UserCheck,
    Printer,
    Loader2,
    Hash,
    Building,
    User as UserIcon,
    ChevronRight as ArrowRight
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useBookings } from "@/hooks/useBooking";
import { useHostel } from "@/hooks/usehostel";
import { useRoom } from "@/hooks/useRoom";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { QueryKeys } from '@/lib/queryclient';
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Loader from "../../../../components/ui/Loader";

const useSyncAutomation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const response = await fetch('/api/automation/sync-logs', { method: 'POST' });
            return response.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: [QueryKeys.Rooms] });
            queryClient.invalidateQueries({ queryKey: ["bookings"] });
            // toast.success(`System Synced: ${data.data.cleaning} cleaning cycles updated.`);
        }
    });
};

const GlobalBookingsPage = () => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { data: bookingsResponse, isLoading, isFetching } = useBookings();
    const { data: hostelsResponse } = useHostel();
    const syncAutomation = useSyncAutomation();

    useEffect(() => {
        syncAutomation.mutate();
    }, []);

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [hostelFilter, setHostelFilter] = useState("All");

    const bookings = bookingsResponse || [];
    const hostels = hostelsResponse?.data || [];
    const { data: roomsResponse } = useRoom();
    const rooms = roomsResponse?.data || [];

    const getStatusStyle = (status) => {
        switch (status) {
            case "CONFIRMED": return "bg-blue-50 text-blue-700 border-blue-100";
            case "PENDING": return "bg-amber-50 text-amber-700 border-amber-100";
            case "CHECKED_IN": return "bg-emerald-50 text-emerald-700 border-emerald-100";
            case "CHECKED_OUT": return "bg-gray-100 text-gray-700 border-gray-200";
            case "CANCELLED": return "bg-rose-50 text-rose-700 border-rose-100";
            default: return "bg-gray-50 text-gray-600 border-gray-100";
        }
    };

    const getRibbonColor = (status) => {
        switch (status) {
            case "CONFIRMED": return "bg-blue-600";
            case "PENDING": return "bg-amber-500";
            case "CHECKED_IN": return "bg-emerald-500";
            case "CHECKED_OUT": return "bg-gray-900";
            case "CANCELLED": return "bg-rose-500";
            default: return "bg-gray-400";
        }
    };

    const filteredBookings = bookings.filter(booking => {
        const matchesSearch =
            booking.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            booking.User.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            booking.Room?.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            booking.Room?.Hostel?.name.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === "All" || booking.status === statusFilter;
        const matchesHostel = hostelFilter === "All" || (booking.Room?.Hostel?.name === hostelFilter);

        return matchesSearch && matchesStatus && matchesHostel;
    });

    const activeBookings = bookings.filter(b => b.status === "CHECKED_IN").length;
    const pendingBookings = bookings.filter(b => b.status === "PENDING").length;
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    // Export Data Configuration
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportConfig, setExportConfig] = useState({
        hostelId: "All",
        status: "All",
        roomId: "All",
        dateFrom: "",
        dateTo: "",
        searchQuery: ""
    });

    const handleExportPoliceVerification = async () => {
        setIsExporting(true);

        // Filter the raw bookings based on the EXPORT config
        const customExportList = bookings.filter(b => {
            const passStatus = exportConfig.status === "All" || b.status === exportConfig.status;
            const passHostel = exportConfig.hostelId === "All" || b.Room?.Hostel?.name === exportConfig.hostelId;
            const passRoom = exportConfig.roomId === "All" || b.roomId === exportConfig.roomId;

            // Date Range Logic
            let passDate = true;
            if (exportConfig.dateFrom) {
                passDate = passDate && new Date(b.checkIn) >= new Date(exportConfig.dateFrom);
            }
            if (exportConfig.dateTo) {
                const toDate = new Date(exportConfig.dateTo);
                toDate.setHours(23, 59, 59, 999);
                passDate = passDate && new Date(b.checkIn) <= toDate;
            }

            // Search Logic
            let passSearch = true;
            if (exportConfig.searchQuery) {
                const q = exportConfig.searchQuery.toLowerCase();
                // Safely check fields accounting for null or undefined strings
                passSearch =
                    (b.User?.name?.toLowerCase()?.includes(q)) ||
                    (b.User?.cnic?.toLowerCase()?.includes(q)) ||
                    (b.Room?.roomNumber?.toLowerCase()?.includes(q));
            }

            return passStatus && passHostel && passRoom && passDate && passSearch;
        });

        // Setup mock delay for animation
        await new Promise(resolve => setTimeout(resolve, 2500));

        try {
            const doc = new jsPDF('landscape');

            // PDF Styling and Typography
            doc.setFont("helvetica", "bold");

            // Header Section
            // Dark blue background rect for header
            doc.setFillColor(30, 58, 138);
            doc.rect(0, 0, doc.internal.pageSize.width, 35, 'F');

            // Header Text
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.text("TENANT / RESIDENT VERIFICATION REPORT", doc.internal.pageSize.width / 2, 18, { align: "center" });

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text("(POLICE COPY)", doc.internal.pageSize.width / 2, 26, { align: "center" });

            // Metadata Section Below Header
            doc.setTextColor(80, 80, 80);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(`Generated On: ${format(new Date(), 'PPP p')}`, 14, 45);
            doc.text(`Total Records: ${customExportList.length}`, doc.internal.pageSize.width - 14, 45, { align: "right" });

            // Draw Line
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.5);
            doc.line(14, 49, doc.internal.pageSize.width - 14, 49);

            const headers = [
                ["S.No", "Resident Name", "Father/Guardian", "CNIC", "Phone", "Address", "City", "Hostel", "Room", "Check-In", "Emg Contact", "Emg Phone", "Status"]
            ];

            const rows = customExportList.map((b, index) => {
                const profile = b.User?.ResidentProfile || {};
                return [
                    index + 1,
                    b.User?.name || 'N/A',
                    profile.guardianName || 'N/A',
                    b.User?.cnic || 'N/A',
                    b.User?.phone || 'N/A',
                    profile.address || b.User?.address || 'N/A',
                    profile.city || b.User?.city || 'N/A',
                    b.Room?.Hostel?.name || 'N/A',
                    b.Room?.roomNumber || 'N/A',
                    b.checkIn ? format(new Date(b.checkIn), 'dd/MM/yyyy') : 'N/A',
                    profile.emergencyContact || 'N/A',
                    profile.guardianPhone || 'N/A',
                    b.status
                ];
            });

            autoTable(doc, {
                startY: 55,
                head: headers,
                body: rows,
                theme: 'grid',
                headStyles: {
                    fillColor: [59, 130, 246], // Blue-500
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 8,
                    halign: 'center'
                },
                bodyStyles: {
                    fontSize: 8,
                    textColor: [50, 50, 50]
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252] // Slate-50
                },
                columnStyles: {
                    0: { cellWidth: 10, halign: 'center' }, // S.No
                    5: { cellWidth: 30 }, // Address
                },
                styles: {
                    overflow: 'linebreak',
                    cellPadding: 3,
                    valign: 'middle'
                },
                didDrawPage: function (data) {
                    // Footer
                    let str = "Page " + doc.internal.getNumberOfPages();
                    doc.setFontSize(8);
                    doc.setTextColor(150, 150, 150);
                    doc.text(str, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: "center" });
                    doc.text("Official GreenView Hostels Records", 14, doc.internal.pageSize.height - 10);
                }
            });

            doc.save(`Police_Verification_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
            toast.success("PDF Verification Report Exported ✨");
        } catch (error) {
            toast.error("Failed to export PDF");
            console.error(error);
        } finally {
            setIsExporting(false);
            setIsExportDialogOpen(false); // Close Modal on done
        }
    };

    if (isLoading) return <Loader label="Compiling Bookings" subLabel="Accessing reservation registry node" icon={Calendar} />;

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans">
            {/* Minimal Premium Header */}
            <div className="bg-white border-b sticky top-0 z-50 py-2 md:h-16">
                <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-full flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="h-8 w-1 bg-blue-600 rounded-full shrink-0" />
                        <div className="flex flex-col">
                            <h1 className="text-sm md:text-lg font-bold text-gray-900 tracking-tight uppercase">Reservation Ledger</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Records</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-emerald-600">Active Node</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100 h-9 w-9" onClick={() => syncAutomation.mutate()}>
                            <RefreshCw className={`h-4 w-4 text-gray-500 ${syncAutomation.isPending ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-9 px-3 md:px-4 rounded-xl border-indigo-200 bg-indigo-50 font-bold text-[9px] md:text-[10px] uppercase tracking-wider text-indigo-700 hover:bg-indigo-100 transition-all shadow-sm flex items-center gap-2"
                            onClick={() => setIsExportDialogOpen(true)}
                        >
                            <ShieldCheck className="h-3.5 w-3.5 text-indigo-700" />
                            <span className="hidden xs:inline">Verified PDF</span> <span className="xs:hidden">PDF</span>
                        </Button>
                        <Button
                            className="h-9 px-4 md:px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[9px] md:text-[10px] uppercase tracking-wider shadow-sm transition-all active:scale-95 flex items-center gap-2"
                            onClick={() => router.push('/admin/bookings/create')}
                        >
                            <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            <span className="hidden xs:inline">New Booking</span> <span className="xs:hidden">Add</span>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8 min-w-0">
                {/* Statistics Overview */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {[
                        { label: 'Reservations', value: bookings.length, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Active Guests', value: activeBookings, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Pending Node', value: pendingBookings, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Revenue Stream', value: `PKR ${(totalRevenue / 1000).toFixed(1)}k`, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row items-center sm:items-center gap-2 md:gap-4 shadow-sm hover:shadow-md transition-all group text-center sm:text-left">
                            <div className={`h-10 w-10 md:h-11 md:w-11 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform shrink-0`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">{stat.label}</span>
                                <span className="text-sm md:text-xl font-black text-gray-900 tracking-tight">{stat.value}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Search and Filters */}
                <div className="bg-white border border-gray-100 rounded-2xl p-2 flex flex-col md:flex-row items-center gap-2 md:gap-4 shadow-sm">
                    <div className="flex-1 relative w-full group px-2">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                        <Input
                            placeholder="Filter by Resident, Room or Branch..."
                            className="w-full h-11 md:h-12 pl-10 bg-transparent border-none shadow-none font-bold text-[11px] md:text-sm focus-visible:ring-0 placeholder:text-gray-300"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase transition-all animate-in fade-in zoom-in duration-300 hidden sm:inline">
                                {filteredBookings.length} Matches
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 md:gap-2 p-1 bg-gray-50 rounded-xl w-full md:w-auto overflow-x-auto scrollbar-hide">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-9 px-3 rounded-lg font-black text-[9px] uppercase tracking-wider text-gray-500 hover:bg-white hover:text-black hover:shadow-sm shrink-0">
                                    <Filter className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                    {statusFilter === 'All' ? 'ANY STATUS' : statusFilter.replace('_', ' ')}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[180px] rounded-xl border-gray-100 shadow-xl p-1">
                                {["All", "CONFIRMED", "PENDING", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"].map(status => (
                                    <DropdownMenuItem key={status} onClick={() => setStatusFilter(status)} className="p-2 font-black text-[9px] uppercase tracking-wider rounded-lg cursor-pointer">
                                        {status.replace('_', ' ')}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="h-4 w-px bg-gray-200 shrink-0" />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-9 px-3 rounded-lg font-black text-[9px] uppercase tracking-wider text-gray-500 hover:bg-white hover:text-black hover:shadow-sm shrink-0">
                                    <Building2 className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                    {hostelFilter === 'All' ? 'ALL BRANCHES' : hostelFilter}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[200px] rounded-xl border-gray-100 shadow-xl p-1">
                                <DropdownMenuItem onClick={() => setHostelFilter("All")} className="p-2 font-black text-[9px] uppercase tracking-wider rounded-lg">All Branches</DropdownMenuItem>
                                {hostels.map(h => (
                                    <DropdownMenuItem key={h.id} onClick={() => setHostelFilter(h.name)} className="p-2 font-black text-[9px] uppercase tracking-wider rounded-lg">
                                        {h.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Bookings List:  */}
                <div className="space-y-4">
                    {filteredBookings.length > 0 ? (
                        filteredBookings.map((booking, index) => (
                            <Link
                                href={`/admin/bookings/${booking.id}`}
                                key={booking.id}
                                className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 pb-14 md:pb-14 flex flex-col xl:flex-row items-center justify-between gap-4 md:gap-6 hover:shadow-md transition-shadow group relative overflow-hidden"
                            >
                                <div className={`absolute top-0 left-0 w-1 md:w-1.5 h-full ${getRibbonColor(booking.status)} opacity-70`} />

                                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 flex-1 min-w-0 w-full xl:w-auto text-center md:text-left">
                                    {/* Resident Info */}
                                    <div className="flex items-center gap-3 md:gap-5 min-w-0 md:min-w-[280px] w-full md:w-auto">
                                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-sm shrink-0 group-hover:bg-indigo-600 transition-colors">
                                            <UserIcon className="h-4 w-4 md:h-5 md:w-5 text-gray-400 group-hover:text-white transition-colors" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <h4 className="text-[13px] md:text-sm font-black text-gray-900 uppercase tracking-tight truncate">{booking.User.name}</h4>
                                            <div className="flex items-center justify-center md:justify-start gap-2 mt-0.5">
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest truncate">{booking.Room?.Hostel?.name}</span>
                                                {booking.uid && (
                                                    <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">{booking.uid}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="ml-auto md:hidden">
                                            <Badge variant="outline" className={`${getStatusStyle(booking.status)} px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border shrink-0`}>
                                                {booking.status.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Room Details */}
                                    <div className="flex items-center gap-4 md:flex-col md:items-start md:gap-1 w-full md:w-auto justify-between md:justify-start px-2 md:px-0">
                                        <div className="flex items-center gap-2">
                                            <BedDouble className="h-3.5 w-3.5 text-indigo-500" />
                                            <span className="text-[11px] font-black text-gray-900 uppercase">UNIT {booking.Room?.roomNumber}</span>
                                        </div>
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{booking.Room?.type} SEATER</span>
                                    </div>

                                    {/* Timeline */}
                                    <div className="hidden xl:flex items-center gap-4 min-w-[300px] bg-indigo-50/30 p-2.5 rounded-xl border border-indigo-100/50">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                                <Calendar className="h-2.5 w-2.5" /> IN
                                            </span>
                                            <span className="text-[10px] font-black text-gray-900 uppercase">{format(new Date(booking.checkIn), 'MMM dd, yy')}</span>
                                        </div>
                                        <div className="flex-1 h-[1px] bg-indigo-100 relative mx-2">
                                            <div className="absolute -top-1 left-0 h-2 w-2 rounded-full bg-indigo-200" />
                                            <div className="absolute -top-1 right-0 h-2 w-2 rounded-full bg-indigo-200" />
                                        </div>
                                        <div className="flex flex-col gap-0.5 text-right">
                                            <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-end gap-1.5">
                                                OUT <History className="h-2.5 w-2.5" />
                                            </span>
                                            <span className="text-[10px] font-black text-gray-900 uppercase">{booking.checkOut ? format(new Date(booking.checkOut), 'MMM dd, yy') : 'ACTIVE'}</span>
                                        </div>
                                    </div>

                                    {/* Status (Desktop) */}
                                    <div className="hidden md:flex min-w-[120px] justify-center">
                                        <Badge variant="outline" className={`${getStatusStyle(booking.status)} px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm`}>
                                            {booking.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 w-full xl:w-auto justify-end pt-3 md:pt-0 border-t md:border-none border-gray-50">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-9 w-9 rounded-full hover:bg-gray-50 text-gray-400 hidden sm:flex"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[9px] uppercase tracking-wider shadow-sm flex items-center gap-2 group/btn w-full sm:w-auto justify-center"
                                    >
                                        Open Record
                                        <ChevronRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
                                    </Button>
                                </div>

                                {/* Instant Payment Check */}
                                {booking.Payment && booking.Payment.length > 0 && (
                                    <div className="absolute bottom-0 left-0 w-full h-[36px] bg-gray-50/80 backdrop-blur-sm border-t border-gray-100 flex items-center justify-between px-4 md:px-6 group-hover:bg-white transition-colors duration-300">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5">
                                                <CreditCard className="h-3 w-3 text-gray-400" />
                                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">FISCAL STATUS</span>
                                            </div>
                                            <div className="h-3 w-px bg-gray-200" />
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[9px] font-black uppercase tracking-tight ${booking.Payment[0].status === 'PAID' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {booking.Payment[0].status}
                                                </span>
                                                <span className="text-[9px] font-black text-gray-900">Rs. {booking.Payment[0].amount.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className={`h-1.5 w-1.5 rounded-full ${booking.Payment[0].status === 'PAID' ? 'bg-emerald-400' : 'bg-rose-400'} animate-pulse`} />
                                            <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">
                                                {format(new Date(booking.Payment[0].date), 'MMM dd')}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </Link>
                        ))
                    ) : (
                        <div className="bg-white border border-gray-100 rounded-3xl p-12 sm:p-24 text-center shadow-sm border-dashed">
                            <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-6 border border-gray-100">
                                <Search className="h-8 w-8 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">No bookings found</h3>
                            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Try changing your search or filters</p>
                            <Button
                                variant="outline"
                                className="mt-8 rounded-xl h-10 px-8 font-bold uppercase tracking-widest text-[10px] border-gray-200 hover:bg-black hover:text-white transition-all shadow-sm"
                                onClick={() => { setSearchQuery(""); setStatusFilter("All"); setHostelFilter("All"); }}
                            >
                                Reset Filters
                            </Button>
                        </div>
                    )}
                </div>

                {/* Status Bar */}
                <div className="pt-6 md:pt-10">
                    <div className="bg-blue-600 text-white rounded-3xl md:rounded-[2rem] p-4 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-full bg-white/5 skew-x-12 translate-x-20 hidden md:block" />
                        <div className="flex items-center gap-4 md:gap-6 relative z-10 px-2 md:px-4 w-full md:w-auto justify-between md:justify-start">
                            <div className="flex items-center gap-4 md:gap-6">
                                <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                                    <ShieldCheck className="h-4 w-4 md:h-5 md:w-5 text-white" />
                                </div>
                                <div className="flex flex-col">
                                    <h4 className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-100">System Status</h4>
                                    <p className="text-[10px] md:text-[11px] font-bold mt-0.5">Bookings up to date</p>
                                </div>
                            </div>
                            <div className="flex md:hidden items-center gap-2 relative z-10">
                                <span className="text-[9px] font-bold uppercase text-white tracking-widest">Online</span>
                                <div className="h-2 w-2 rounded-full bg-white animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.4)]" />
                            </div>
                        </div>

                        <div className="h-6 w-px bg-white/10 hidden md:block" />

                        <div className="flex-1 flex items-center justify-around md:justify-start md:gap-12 px-2 md:px-8 w-full md:w-auto">
                            <div className="flex flex-col items-center md:items-start">
                                <span className="text-[7px] md:text-[8px] font-bold uppercase text-indigo-100 tracking-widest">Last Sync</span>
                                <span className="text-[9px] md:text-[10px] font-bold text-gray-200 uppercase mt-1">{new Date().toLocaleDateString()}</span>
                            </div>
                            <div className="flex flex-col items-center md:items-start">
                                <span className="text-[7px] md:text-[8px] font-bold uppercase text-indigo-100 tracking-widest">Total Records</span>
                                <span className="text-[9px] md:text-[10px] font-bold text-white uppercase mt-1">{bookings.length} Verified Records</span>
                            </div>
                        </div>

                        <div className="hidden md:flex items-center gap-3 pr-6 relative z-10">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-[9px] font-bold uppercase tracking-widest text-white gap-2"
                                onClick={() => syncAutomation.mutate()}
                                disabled={syncAutomation.isPending}
                            >
                                <RefreshCw className={`h-3 w-3 ${syncAutomation.isPending ? 'animate-spin' : ''}`} />
                                Sync Data
                            </Button>
                            <div className="h-4 w-px bg-white/10" />
                            <span className="text-[9px] font-bold uppercase text-white tracking-widest">Online</span>
                            <div className="h-2 w-2 rounded-full bg-white animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.4)]" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Export Wizard Dialog */}
            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
                    <div className="bg-indigo-600 p-8 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/10 skew-x-12 translate-x-20" />
                        <div className="mx-auto h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 mb-4 rotate-3">
                            <ShieldCheck className="h-8 w-8 text-white stroke-[1.5]" />
                        </div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight relative z-10">Export Verification Data</h2>
                        <p className="text-indigo-100 text-[11px] font-bold uppercase tracking-widest mt-1 relative z-10">Generate official PDF records</p>
                    </div>

                    <div className="p-8 space-y-6 bg-white overflow-y-auto max-h-[60vh]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Select Hostel</Label>
                                <select
                                    className="w-full h-12 rounded-xl bg-gray-50 border border-gray-100 px-4 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    value={exportConfig.hostelId}
                                    onChange={(e) => setExportConfig(prev => ({ ...prev, hostelId: e.target.value }))}
                                >
                                    <option value="All">All Entities</option>
                                    {hostels.map(h => (
                                        <option key={h.id} value={h.name}>{h.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Select Room</Label>
                                <select
                                    className="w-full h-12 rounded-xl bg-gray-50 border border-gray-100 px-4 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    value={exportConfig.roomId}
                                    onChange={(e) => setExportConfig(prev => ({ ...prev, roomId: e.target.value }))}
                                >
                                    <option value="All">All Rooms</option>
                                    {rooms
                                        .filter(r => exportConfig.hostelId === "All" || r.Hostel?.name === exportConfig.hostelId)
                                        .map(r => (
                                            <option key={r.id} value={r.id}>Room {r.roomNumber} ({r.type})</option>
                                        ))
                                    }
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Booking Status</Label>
                                <select
                                    className="w-full h-12 rounded-xl bg-gray-50 border border-gray-100 px-4 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    value={exportConfig.status}
                                    onChange={(e) => setExportConfig(prev => ({ ...prev, status: e.target.value }))}
                                >
                                    <option value="All">All Residents</option>
                                    <option value="CHECKED_IN">Currently In-House</option>
                                    <option value="CONFIRMED">Confirmed / Verified</option>
                                    <option value="PENDING">Pending Approval</option>
                                    <option value="CHECKED_OUT">Archived / Past</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">From Date</Label>
                                <Input
                                    type="date"
                                    className="h-12 rounded-xl border-gray-100 bg-gray-50 font-bold"
                                    value={exportConfig.dateFrom}
                                    onChange={(e) => setExportConfig(prev => ({ ...prev, dateFrom: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">To Date</Label>
                                <Input
                                    type="date"
                                    className="h-12 rounded-xl border-gray-100 bg-gray-50 font-bold"
                                    value={exportConfig.dateTo}
                                    onChange={(e) => setExportConfig(prev => ({ ...prev, dateTo: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Search Keyword (Name/CNIC/Room)</Label>
                            <Input
                                placeholder="Filter records by name or ID..."
                                className="h-12 rounded-xl border-gray-100 bg-gray-50 font-bold"
                                value={exportConfig.searchQuery}
                                onChange={(e) => setExportConfig(prev => ({ ...prev, searchQuery: e.target.value }))}
                            />
                        </div>

                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                            <p className="text-[10px] text-amber-700 font-medium leading-relaxed italic">
                                Unified Data Export: This configuration allows full override. You can generate reports for specific date ranges and branches regardless of your current dashboard view.
                            </p>
                        </div>
                    </div>

                    <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
                        <Button
                            variant="ghost"
                            className="h-12 px-6 rounded-xl font-bold text-[10px] uppercase tracking-widest text-gray-500 hover:bg-gray-100"
                            onClick={() => setIsExportDialogOpen(false)}
                            disabled={isExporting}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
                            onClick={handleExportPoliceVerification}
                            disabled={isExporting}
                        >
                            {isExporting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Processing PDF...
                                </>
                            ) : (
                                <>
                                    <FileText className="h-4 w-4" />
                                    Generate Output
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default GlobalBookingsPage;
