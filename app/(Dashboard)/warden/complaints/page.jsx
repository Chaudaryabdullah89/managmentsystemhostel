"use client"
import React, { useState } from "react";
import Link from "next/link";
import {
    ChevronRight,
    Search,
    AlertTriangle,
    CheckCircle,
    Clock,
    XCircle,
    User,
    Building2,
    MessageSquare,
    Download,
    Filter,
    MoreVertical,
    BarChart3,
    ShieldCheck,
    ArrowUpRight,
    Zap,
    Info,
    Calendar,
    ChevronLeft,
    Hash
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useComplaints, useUpdateComplaint, useAddComplaintComment } from "@/hooks/usecomplaints";
import { useHostel } from "@/hooks/usehostel";
import { useStaffList } from "@/hooks/useSalaries";
import { format } from "date-fns";
import { toast } from "sonner";
import useAuthStore from "@/hooks/Authstate";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Loader from "@/components/ui/Loader";

const ComplaintsPage = () => {
    const user = useAuthStore((state) => state.user);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterPriority, setFilterPriority] = useState("all");
    const [filterHostel, setFilterHostel] = useState("all");
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [responseNotes, setResponseNotes] = useState("");
    const [newComment, setNewComment] = useState("");
    const [assignedStaffId, setAssignedStaffId] = useState("");

    const { data: complaintsData, isLoading: isComplaintsLoading } = useComplaints({
        hostelId: filterHostel !== "all" ? filterHostel : (user?.hostelId || undefined)
    });

    const { data: statsData, isLoading: isStatsLoading } = useComplaints({ stats: "true", hostelId: user?.hostelId });
    const { data: hostelsData } = useHostel();
    const { data: staffData } = useStaffList(user?.hostelId);

    const updateMutation = useUpdateComplaint();
    const addCommentMutation = useAddComplaintComment();

    const complaints = complaintsData || [];
    const stats = statsData || { total: 0, pending: 0, inProgress: 0, resolved: 0, urgent: 0, resolutionRate: 0 };
    const hostels = hostelsData?.data || [];
    const staffMembers = staffData || [];

    const getStatusTheme = (status) => {
        switch (status) {
            case "RESOLVED": return "bg-emerald-50 text-emerald-700 border-emerald-100";
            case "REJECTED": return "bg-rose-50 text-rose-700 border-rose-100";
            case "IN_PROGRESS": return "bg-amber-50 text-amber-700 border-amber-100";
            case "PENDING": return "bg-gray-100 text-gray-700 border-gray-200";
            default: return "bg-gray-50 text-gray-600 border-gray-100";
        }
    };

    const getPriorityTheme = (priority) => {
        switch (priority) {
            case "URGENT": return "bg-rose-500 text-white border-rose-600";
            case "HIGH": return "bg-rose-50 text-rose-600 border-rose-100";
            case "MEDIUM": return "bg-amber-50 text-amber-600 border-amber-100";
            case "LOW": return "bg-emerald-50 text-emerald-600 border-emerald-100";
            default: return "bg-gray-100 text-gray-600 border-gray-200";
        }
    };

    const handleUpdateStatus = (id, status, assignedToId = undefined) => {
        updateMutation.mutate({
            id,
            status,
            resolutionNotes: responseNotes,
            assignedToId
        }, {
            onSuccess: () => {
                setResponseNotes("");
                setAssignedStaffId("");
                setSelectedComplaint(null);
            }
        });
    };

    const handleSendComment = (complaintId) => {
        if (!newComment.trim()) return;
        addCommentMutation.mutate({
            complaintId,
            userId: user?.id,
            message: newComment
        }, {
            onSuccess: () => {
                setNewComment("");
            }
        });
    };

    const filteredComplaints = complaints.filter(complaint => {
        const matchesSearch =
            complaint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            complaint.User_Complaint_userIdToUser?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            complaint.id.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = filterStatus === "all" || complaint.status === filterStatus;
        const matchesPriority = filterPriority === "all" || complaint.priority === filterPriority;
        const matchesWardenHostel = user?.hostelId ? complaint?.Hostel?.id === user.hostelId : true;

        return matchesSearch && matchesStatus && matchesPriority && matchesWardenHostel;
    });

    const [isExporting, setIsExporting] = useState(false);

    const handleExportPDF = async () => {
        if (!filteredComplaints || filteredComplaints.length === 0) {
            toast.error("No complaints found to export");
            return;
        }

        setIsExporting(true);
        try {
            const doc = new jsPDF('landscape');
            doc.setFont("helvetica", "bold");

            // Header Section
            doc.setFillColor(31, 41, 55); // gray-800/black-ish
            doc.rect(0, 0, doc.internal.pageSize.width, 35, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.text("GRIEVANCE REGISTRY REPORT", doc.internal.pageSize.width / 2, 18, { align: "center" });
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Official Audit Record | Hostel: ${user?.Hostel?.name} | Records: ${filteredComplaints.length}`, doc.internal.pageSize.width / 2, 26, { align: "center" });

            doc.setTextColor(80, 80, 80);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(`Generated On: ${format(new Date(), 'PPP p')}`, 14, 45);
            doc.text(`Resolution Rate: ${stats.resolutionRate}%`, doc.internal.pageSize.width - 14, 45, { align: "right" });

            // Draw Line
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.5);
            doc.line(14, 49, doc.internal.pageSize.width - 14, 49);

            const headers = [
                ["S.No", "Token ID", "Resident", "Category", "Priority", "Status", "Filed Date"]
            ];

            const rows = filteredComplaints.map((c, index) => [
                index + 1,
                c.uid || `GRV-${c.id.slice(-8).toUpperCase()}`,
                c.User_Complaint_userIdToUser?.name || 'N/A',
                c.category,
                c.priority,
                c.status,
                format(new Date(c.createdAt), 'dd/MM/yyyy HH:mm')
            ]);

            autoTable(doc, {
                startY: 55,
                head: headers,
                body: rows,
                theme: 'grid',
                headStyles: {
                    fillColor: [31, 41, 55],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 8,
                    halign: 'center'
                },
                bodyStyles: {
                    fontSize: 8,
                    textColor: [50, 50, 50]
                },
                columnStyles: {
                    0: { cellWidth: 10, halign: 'center' },
                    1: { cellWidth: 25 },
                    6: { cellWidth: 35 }
                },
                styles: {
                    overflow: 'linebreak',
                    cellPadding: 3,
                    valign: 'middle'
                },
                didDrawPage: function (data) {
                    doc.setFontSize(8);
                    doc.setTextColor(150, 150, 150);
                    doc.text("Page " + doc.internal.getNumberOfPages(), doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: "center" });
                    doc.text("Official GreenView Resolution Metadata", 14, doc.internal.pageSize.height - 10);
                }
            });

            doc.save(`Grievance_Report_${format(new Date(), 'dd_MM_yyyy')}.pdf`);
            toast.success("Grievance report exported successfully!");
        } catch (error) {
            toast.error("Failed to export grievance report");
            console.error(error);
        } finally {
            setIsExporting(false);
        }
    };

    const handleExport = () => {
        const headers = ["Token ID", "Resident", "Hostel", "Category", "Priority", "Status", "Filed Date"];
        const rows = filteredComplaints.map(complaint => [
            `GRV-${complaint.id.slice(-8).toUpperCase()}`,
            complaint.User_Complaint_userIdToUser?.name,
            complaint.Hostel?.name,
            complaint.category,
            complaint.priority,
            complaint.status,
            format(new Date(complaint.createdAt), 'yyyy-MM-dd HH:mm')
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Grievance_Registry_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Grievance registry exported successfully");
    };

    if (isComplaintsLoading || isStatsLoading) return (
        <Loader label="Loading Complaints" subLabel="Fetching complaint records..." fullScreen={false} />
    );

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight leading-relaxed">
            {/* Minimal Premium Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-full flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                        <div className="h-8 w-1 bg-black rounded-full shrink-0" />
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-sm md:text-lg font-bold text-gray-900 tracking-tight uppercase truncate">Grievances</h1>
                            <div className="flex items-center gap-1.5 md:gap-2">
                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-gray-400 truncate">Registry Hub</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500 shrink-0 hidden sm:block" />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 shrink-0">
                        <div className="relative group hidden lg:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-black transition-colors" />
                            <Input
                                placeholder="Audit ID or Resident..."
                                className="h-9 w-[280px] pl-9 rounded-xl border-gray-100 bg-gray-50/50 font-bold text-[10px] uppercase tracking-wider text-gray-600 shadow-sm transition-all focus:bg-white focus:ring-0 placeholder:text-gray-300"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button
                            className="h-9 md:h-10 px-4 md:px-6 rounded-xl bg-black hover:bg-gray-800 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all active:scale-95 shrink-0 flex items-center gap-2"
                            onClick={handleExportPDF}
                            disabled={isExporting}
                        >
                            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            <span className="hidden sm:inline">Export Report</span>
                            <span className="sm:hidden">PDF</span>
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8 min-w-0">
                {/* Search Bar Mobile */}
                <div className="lg:hidden relative group w-full px-0.5">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-black transition-colors" />
                    <Input
                        placeholder="Search grievances..."
                        className="h-12 w-full pl-11 rounded-2xl border-gray-100 bg-white font-bold text-[11px] uppercase tracking-wider text-gray-600 shadow-sm focus:bg-white focus:ring-0"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Metrics Matrix */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {[
                        { label: 'Pulse', value: stats.total, sub: 'Total', icon: MessageSquare, color: 'text-gray-900', bg: 'bg-white' },
                        { label: 'Pending', value: stats.pending, sub: 'Needs Act', icon: Clock, color: 'text-rose-500', bg: 'bg-rose-50/50' },
                        { label: 'Urgent', value: stats.urgent, sub: 'Tokens', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50/50' },
                        { label: 'Res. Rate', value: `${stats.resolutionRate}%`, sub: 'Efficiency', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50/50' }
                    ].map((node, i) => (
                        <div key={i} className={`border border-gray-100 rounded-2xl p-3 md:p-5 flex items-center gap-3 md:gap-4 shadow-sm hover:shadow-md transition-all group min-w-0 ${node.bg}`}>
                            <div className={`h-10 w-10 md:h-12 md:w-12 rounded-xl bg-white flex items-center justify-center shrink-0 border border-gray-100 group-hover:scale-110 transition-transform ${node.color}`}>
                                <node.icon className="h-4 w-4 md:h-5 md:w-5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest italic truncate">{node.label}</span>
                                <div className="flex items-baseline gap-1.5 md:gap-2 min-w-0">
                                    <span className={`text-base md:text-xl font-bold tracking-tight truncate ${node.color}`}>{node.value}</span>
                                    <span className="text-[7px] md:text-[8px] font-black text-gray-400 uppercase tracking-wider truncate mb-0.5">{node.sub}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-center min-w-0 w-full bg-white md:bg-transparent p-4 md:p-0 rounded-2xl md:rounded-none border md:border-none border-gray-100 shadow-sm md:shadow-none">
                    <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                        <Filter className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Filters</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5 w-full min-w-0">
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="flex-1 md:flex-none h-10 md:h-9 md:w-[140px] rounded-xl border-gray-100 bg-white font-bold text-[9px] md:text-[10px] uppercase tracking-wider text-gray-600 shadow-sm focus:ring-0">
                                <SelectValue placeholder="STATUS" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                                <SelectItem value="all" className="text-[10px] font-bold uppercase tracking-widest p-2">Global Status</SelectItem>
                                <SelectItem value="PENDING" className="text-[10px] font-bold uppercase tracking-widest p-2">Pending</SelectItem>
                                <SelectItem value="IN_PROGRESS" className="text-[10px] font-bold uppercase tracking-widest p-2">In Progress</SelectItem>
                                <SelectItem value="RESOLVED" className="text-[10px] font-bold uppercase tracking-widest p-2">Resolved</SelectItem>
                                <SelectItem value="REJECTED" className="text-[10px] font-bold uppercase tracking-widest p-2">Rejected</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filterPriority} onValueChange={setFilterPriority}>
                            <SelectTrigger className="flex-1 md:flex-none h-10 md:h-9 md:w-[140px] rounded-xl border-gray-100 bg-white font-bold text-[9px] md:text-[10px] uppercase tracking-wider text-gray-600 shadow-sm focus:ring-0">
                                <SelectValue placeholder="PRIORITY" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                                <SelectItem value="all" className="text-[10px] font-bold uppercase tracking-widest p-2">Global Priority</SelectItem>
                                <SelectItem value="URGENT" className="text-[10px] font-bold uppercase tracking-widest p-2 text-rose-600 italic">Urgent Focus</SelectItem>
                                <SelectItem value="HIGH" className="text-[10px] font-bold uppercase tracking-widest p-2">High Magnitude</SelectItem>
                                <SelectItem value="MEDIUM" className="text-[10px] font-bold uppercase tracking-widest p-2">Medium Scale</SelectItem>
                                <SelectItem value="LOW" className="text-[10px] font-bold uppercase tracking-widest p-2">Nominal Low</SelectItem>
                            </SelectContent>
                        </Select>

                        {user?.role === 'ADMIN' && (
                            <Select value={filterHostel} onValueChange={setFilterHostel}>
                                <SelectTrigger className="flex-1 md:flex-none h-10 md:h-9 md:w-[180px] rounded-xl border-gray-100 bg-white font-bold text-[9px] md:text-[10px] uppercase tracking-wider text-gray-600 shadow-sm focus:ring-0">
                                    <SelectValue placeholder="HOSTELS" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-gray-100 shadow-2xl max-h-[300px]">
                                    <SelectItem value="all" className="text-[10px] font-bold uppercase tracking-widest italic p-2">All Properties</SelectItem>
                                    {hostels.map((h) => (
                                        <SelectItem key={h.id} value={h.id} className="text-[10px] font-bold uppercase tracking-widest p-2">{h.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {(filterStatus !== 'all' || filterPriority !== 'all' || filterHostel !== 'all' || searchQuery) && (
                            <Button
                                variant="ghost"
                                className="h-9 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest text-rose-500 hover:bg-rose-50 shrink-0"
                                onClick={() => {
                                    setFilterStatus('all');
                                    setFilterPriority('all');
                                    setFilterHostel('all');
                                    setSearchQuery('');
                                }}
                            >
                                <Zap className="h-3.5 w-3.5 mr-2" /> Reset
                            </Button>
                        )}
                    </div>
                </div>

                {/* Registry View */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <div className="h-5 w-1 bg-black rounded-full" />
                            <h3 className="text-xs md:text-sm font-bold uppercase tracking-widest text-gray-900">Grievance Registry</h3>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:gap-4">
                        {filteredComplaints.length > 0 ? filteredComplaints.map((complaint) => (
                            <div key={complaint.id} className="bg-white border border-gray-100 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden min-w-0">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6">
                                    <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                                        <div className={`h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 ${getPriorityTheme(complaint.priority)} shadow-sm`}>
                                            <AlertTriangle className="h-4 w-4 md:h-5 md:w-5" />
                                        </div>
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <Badge variant="outline" className={`${getStatusTheme(complaint.status)} text-[7px] md:text-[8px] font-black px-2 py-0.5 rounded-full border shrink-0 uppercase tracking-widest`}>
                                                    {complaint.status}
                                                </Badge>
                                                <span className="text-[8px] md:text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest truncate">
                                                    {complaint.uid || `#GRV-${complaint.id.slice(-8).toUpperCase()}`}
                                                </span>
                                            </div>
                                            <h3 className="text-[13px] md:text-sm font-black text-gray-900 uppercase tracking-tight line-clamp-1 group-hover:text-black transition-colors">{complaint.title}</h3>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 min-w-0">
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <User className="h-3 w-3 text-gray-400" />
                                                    <span className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-tight">{complaint.User_Complaint_userIdToUser?.name}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <Building2 className="h-3 w-3 text-gray-400 shrink-0" />
                                                    <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-tight truncate">Room {complaint.roomNumber || 'Common'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between lg:justify-end gap-4 md:gap-6 border-t lg:border-t-0 pt-4 lg:pt-0">
                                        <div className="flex flex-col lg:items-end shrink-0">
                                            <span className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest italic">{complaint.category}</span>
                                            <span className="text-[9px] md:text-[10px] font-bold text-gray-500 mt-0.5 uppercase tracking-tighter">{format(new Date(complaint.createdAt), 'MMM dd, HH:mm')}</span>
                                        </div>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button className="h-10 md:h-12 px-6 rounded-xl bg-black hover:bg-gray-800 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all active:scale-95 group-hover:px-8">
                                                    Audit
                                                    <ArrowUpRight className="h-3.5 w-3.5 ml-2" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="w-[95vw] md:max-w-xl p-0 overflow-hidden border-none rounded-[2rem] md:rounded-3xl shadow-2xl bg-white">
                                                <div className="bg-white max-h-[90vh] flex flex-col min-w-0">
                                                    <div className="p-6 md:p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/20 shrink-0">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-black flex items-center justify-center text-white shadow-lg shadow-black/10 shrink-0">
                                                                <BarChart3 className="h-5 w-5" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h3 className="text-base md:text-lg font-black text-gray-900 uppercase tracking-tight italic truncate">Audit Review</h3>
                                                                <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 italic truncate">Grievance Node Lifecycle</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 md:space-y-8 scrollbar-hide">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-1.5 md:space-y-2">
                                                                <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                                    <User className="h-3 w-3 md:h-3.5 md:w-3.5" /> Identity
                                                                </span>
                                                                <p className="text-[11px] md:text-sm font-black text-gray-900 uppercase italic truncate">{complaint.User_Complaint_userIdToUser?.name}</p>
                                                            </div>
                                                            <div className="space-y-1.5 md:space-y-2">
                                                                <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                                    <Calendar className="h-3 w-3 md:h-3.5 md:w-3.5" /> Date Log
                                                                </span>
                                                                <p className="text-[11px] md:text-sm font-black text-gray-900 uppercase italic truncate">{format(new Date(complaint.createdAt), 'MMM dd, yyyy')}</p>
                                                            </div>
                                                        </div>

                                                        <div className="p-4 md:p-6 bg-gray-50 rounded-2xl md:rounded-3xl border border-gray-100 space-y-2.5">
                                                            <h4 className="text-[10px] md:text-[11px] font-black text-gray-900 uppercase tracking-widest italic">{complaint.title}</h4>
                                                            <p className="text-xs md:text-sm text-gray-500 font-medium leading-relaxed italic">"{complaint.description}"</p>
                                                        </div>

                                                        {complaint.resolutionNotes && (
                                                            <div className="p-4 md:p-6 bg-emerald-50/50 rounded-2xl md:rounded-3xl border border-emerald-100 space-y-2.5">
                                                                <div className="flex items-center gap-2">
                                                                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                                                                    <h4 className="text-[10px] md:text-[11px] font-black text-emerald-700 uppercase tracking-widest italic">Resolution Artifact</h4>
                                                                </div>
                                                                <p className="text-xs md:text-sm text-emerald-800 font-medium leading-relaxed italic">"{complaint.resolutionNotes}"</p>
                                                            </div>
                                                        )}

                                                        {(complaint.status === 'PENDING' || complaint.status === 'IN_PROGRESS') && (
                                                            <div className="space-y-5 md:space-y-6">
                                                                <div className="space-y-2">
                                                                    <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 italic px-1">Assign Staff</Label>
                                                                    <Select
                                                                        defaultValue={complaint.assignedToId}
                                                                        onValueChange={(val) => setAssignedStaffId(val)}
                                                                    >
                                                                        <SelectTrigger className="h-11 rounded-xl border-gray-100 font-bold text-[10px] uppercase tracking-widest text-gray-600 shadow-sm focus:ring-0">
                                                                            <SelectValue placeholder="SELECT OPERATIONAL STAFF" />
                                                                        </SelectTrigger>
                                                                        <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                                                                            {staffMembers.map((staff) => (
                                                                                <SelectItem key={staff.userId} value={staff.userId} className="text-[10px] font-bold uppercase tracking-widest">
                                                                                    {staff.User.name} - {staff.designation}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 italic px-1">Response Notes</Label>
                                                                    <Textarea
                                                                        placeholder="Enter technical resolution metadata..."
                                                                        value={responseNotes}
                                                                        onChange={(e) => setResponseNotes(e.target.value)}
                                                                        className="min-h-[100px] rounded-xl border-gray-100 font-medium text-xs shadow-sm focus:ring-0 p-4"
                                                                    />
                                                                </div>
                                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                                    <Button
                                                                        variant="outline"
                                                                        className="h-11 rounded-xl font-bold text-[9px] uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 border-emerald-100 order-2 sm:order-1"
                                                                        onClick={() => handleUpdateStatus(complaint.id, 'RESOLVED', assignedStaffId || undefined)}
                                                                        disabled={updateMutation.isPending}
                                                                    >
                                                                        <CheckCircle className="h-3.5 w-3.5 mr-2" /> Resolve
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        className="h-11 rounded-xl font-bold text-[9px] uppercase tracking-widest text-amber-600 hover:bg-amber-50 border-amber-100 order-1 sm:order-2"
                                                                        onClick={() => handleUpdateStatus(complaint.id, 'IN_PROGRESS', assignedStaffId || undefined)}
                                                                        disabled={updateMutation.isPending}
                                                                    >
                                                                        <Zap className="h-3.5 w-3.5 mr-2" /> Assign
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        className="h-11 rounded-xl font-bold text-[9px] uppercase tracking-widest text-rose-500 hover:bg-rose-50 border-rose-100 order-3"
                                                                        onClick={() => handleUpdateStatus(complaint.id, 'REJECTED')}
                                                                        disabled={updateMutation.isPending}
                                                                    >
                                                                        <XCircle className="h-3.5 w-3.5 mr-2" /> Reject
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="border-t border-gray-100 pt-6 md:pt-8 min-w-0 pb-6 md:pb-8">
                                                            <h4 className="text-[10px] md:text-[11px] font-black text-gray-900 uppercase tracking-widest italic mb-5 md:mb-6">Communication Hub</h4>

                                                            <div className="space-y-4 md:space-y-5 mb-6 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide min-w-0">
                                                                {complaint.comments?.map((comment) => (
                                                                    <div key={comment.id} className={`flex gap-3 md:gap-4 ${comment.User.role === 'RESIDENT' || comment.User.role === 'GUEST' ? '' : 'flex-row-reverse'} min-w-0`}>
                                                                        <div className={`h-9 w-9 md:h-10 md:w-10 rounded-full flex items-center justify-center shrink-0 border-2 ${comment.User.role === 'RESIDENT' || comment.User.role === 'GUEST' ? 'bg-gray-50 border-gray-100 text-gray-400' : 'bg-black border-black text-white'} shadow-sm`}>
                                                                            <span className="text-[11px] md:text-xs font-black">{comment.User.name?.charAt(0)}</span>
                                                                        </div>
                                                                        <div className={`p-4 md:p-5 rounded-2xl md:rounded-3xl max-w-[85%] min-w-0 shadow-sm ${comment.User.role === 'RESIDENT' || comment.User.role === 'GUEST' ? 'bg-gray-50 border border-gray-100 rounded-tl-none' : 'bg-black text-white rounded-tr-none'}`}>
                                                                            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap min-w-0">
                                                                                <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest truncate ${comment.User.role === 'RESIDENT' || comment.User.role === 'GUEST' ? 'text-gray-900' : 'text-gray-400'}`}>{comment.User.name}</span>
                                                                                <span className={`text-[8px] md:text-[9px] font-bold uppercase tracking-widest opacity-40 shrink-0`}>{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                            </div>
                                                                            <p className="text-xs md:text-[13px] font-medium leading-relaxed break-words">{comment.message}</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                {(!complaint.comments || complaint.comments.length === 0) && (
                                                                    <div className="py-10 md:py-16 text-center bg-gray-50/50 rounded-2xl md:rounded-3xl border border-dashed border-gray-200">
                                                                        <p className="text-[10px] md:text-[11px] text-gray-400 font-black uppercase tracking-widest italic">Silent Channel</p>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center gap-3 sticky bottom-0 bg-white pt-2">
                                                                <Input
                                                                    placeholder="Type response..."
                                                                    className="h-11 md:h-12 rounded-xl md:rounded-2xl border-gray-100 bg-gray-50/50 font-bold text-[10px] md:text-xs shadow-sm focus:bg-white focus:ring-0 px-5"
                                                                    value={newComment}
                                                                    onChange={(e) => setNewComment(e.target.value)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                                            e.preventDefault();
                                                                            handleSendComment(complaint.id);
                                                                        }
                                                                    }}
                                                                />
                                                                <Button
                                                                    size="icon"
                                                                    className="h-11 w-11 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-black hover:bg-gray-800 shrink-0 shadow-xl shadow-black/10 transition-all active:scale-90"
                                                                    onClick={() => handleSendComment(complaint.id)}
                                                                    disabled={addCommentMutation.isPending || !newComment.trim()}
                                                                >
                                                                    <Zap className="h-4 w-4 md:h-5 md:w-5 text-white" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="py-20 md:py-32 flex flex-col items-center justify-center bg-white border border-dashed border-gray-200 rounded-[2rem] md:rounded-[3rem] text-center px-6">
                                <div className="h-16 w-16 md:h-20 md:w-20 rounded-[2rem] bg-gray-50 flex items-center justify-center mb-6">
                                    <MessageSquare className="h-8 w-8 md:h-10 md:w-10 text-gray-200" />
                                </div>
                                <h3 className="text-lg md:text-xl font-bold text-gray-900 uppercase tracking-tight">Registry Node Empty</h3>
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px] mt-2 italic max-w-[280px]">No grievance tokens currently meet the identification criteria in this matrix</p>
                                <Button
                                    variant="outline"
                                    className="mt-8 rounded-xl border-gray-200 uppercase tracking-widest text-[9px] font-bold h-11 px-10 hover:bg-gray-50 transition-all text-gray-500"
                                    onClick={() => {
                                        setFilterStatus('all');
                                        setFilterPriority('all');
                                        setFilterHostel('all');
                                        setSearchQuery('');
                                    }}
                                >
                                    Reset Discovery Matrix
                                </Button>
                            </div>
                        )}
                    </div >
                </div >
            </main >
        </div >
    );
};

export default ComplaintsPage;
