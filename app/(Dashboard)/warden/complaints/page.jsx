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
        <div className="flex h-screen items-center justify-center bg-white font-sans">
            <div className="flex flex-col items-center gap-6">
                <div className="h-10 w-10 border-[3px] border-gray-100 border-t-black rounded-full animate-spin" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 italic">Accessing Grievance Registry...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight leading-relaxed">
            {/* Minimal Premium Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-1 bg-black rounded-full" />
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight uppercase">Grievance Hub</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Resolution Network</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Active Monitoring</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative group mr-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-black transition-colors" />
                            <Input
                                placeholder="Audit ID or Resident..."
                                className="h-9 w-[280px] pl-9 rounded-xl border-gray-100 bg-gray-50/50 font-bold text-[10px] uppercase tracking-wider text-gray-600 shadow-sm transition-all focus:bg-white focus:ring-0"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button
                            className="h-9 px-6 rounded-xl bg-black hover:bg-gray-800 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all active:scale-95"
                            onClick={handleExport}
                        >
                            <Download className="h-3.5 w-3.5 mr-2" /> Export Protocol
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
                {/* Metrics Matrix */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Grievance Pulse', value: stats.total, sub: 'Total Logged', icon: MessageSquare, color: 'text-gray-900', bg: 'bg-white' },
                        { label: 'Pending Escalations', value: stats.pending, sub: 'Needs Attention', icon: Clock, color: 'text-rose-500', bg: 'bg-rose-50/50' },
                        { label: 'Operational Load', value: stats.urgent, sub: 'Urgent Tokens', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50/50' },
                        { label: 'Resolution Rate', value: `${stats.resolutionRate}%`, sub: 'Efficiency Index', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50/50' }
                    ].map((node, i) => (
                        <div key={i} className={`border border-gray-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all group ${node.bg}`}>
                            <div className={`h-12 w-12 rounded-xl bg-white flex items-center justify-center shrink-0 border border-gray-100 group-hover:scale-110 transition-transform ${node.color}`}>
                                <node.icon className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest italic">{node.label}</span>
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-xl font-bold tracking-tight ${node.color}`}>{node.value}</span>
                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em]">{node.sub}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <Filter className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Domain Filters</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="h-9 w-[140px] rounded-xl border-gray-100 bg-white font-bold text-[9px] uppercase tracking-[0.15em] text-gray-600 shadow-sm focus:ring-0">
                                <SelectValue placeholder="All STATUS" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                                <SelectItem value="all" className="text-[9px] font-bold uppercase tracking-widest">Global Status</SelectItem>
                                <SelectItem value="PENDING" className="text-[9px] font-bold uppercase tracking-widest">Pending</SelectItem>
                                <SelectItem value="IN_PROGRESS" className="text-[9px] font-bold uppercase tracking-widest">In Progress</SelectItem>
                                <SelectItem value="RESOLVED" className="text-[9px] font-bold uppercase tracking-widest">Resolved</SelectItem>
                                <SelectItem value="REJECTED" className="text-[9px] font-bold uppercase tracking-widest">Rejected</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filterPriority} onValueChange={setFilterPriority}>
                            <SelectTrigger className="h-9 w-[140px] rounded-xl border-gray-100 bg-white font-bold text-[9px] uppercase tracking-[0.15em] text-gray-600 shadow-sm focus:ring-0">
                                <SelectValue placeholder="All PRIORITY" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                                <SelectItem value="all" className="text-[9px] font-bold uppercase tracking-widest">Global Priority</SelectItem>
                                <SelectItem value="URGENT" className="text-[9px] font-bold uppercase tracking-widest text-rose-600 italic">Urgent Focus</SelectItem>
                                <SelectItem value="HIGH" className="text-[9px] font-bold uppercase tracking-widest">High Magnitude</SelectItem>
                                <SelectItem value="MEDIUM" className="text-[9px] font-bold uppercase tracking-widest">Medium Scale</SelectItem>
                                <SelectItem value="LOW" className="text-[9px] font-bold uppercase tracking-widest">Nominal Low</SelectItem>
                            </SelectContent>
                        </Select>

                        {user?.role === 'ADMIN' && (
                            <Select value={filterHostel} onValueChange={setFilterHostel}>
                                <SelectTrigger className="h-9 w-[180px] rounded-xl border-gray-100 bg-white font-bold text-[9px] uppercase tracking-[0.15em] text-gray-600 shadow-sm focus:ring-0">
                                    <SelectValue placeholder="All HOSTELS" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-gray-100 shadow-2xl max-h-[300px]">
                                    <SelectItem value="all" className="text-[9px] font-bold uppercase tracking-widest italic">All Property Nodes</SelectItem>
                                    {hostels.map((h) => (
                                        <SelectItem key={h.id} value={h.id} className="text-[9px] font-bold uppercase tracking-widest">{h.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {(filterStatus !== 'all' || filterPriority !== 'all' || filterHostel !== 'all' || searchQuery) && (
                            <Button
                                variant="ghost"
                                className="h-8 px-3 rounded-lg text-[9px] font-bold uppercase tracking-widest text-rose-500 hover:bg-rose-50"
                                onClick={() => {
                                    setFilterStatus('all');
                                    setFilterPriority('all');
                                    setFilterHostel('all');
                                    setSearchQuery('');
                                }}
                            >
                                <Zap className="h-3 w-3 mr-2" /> Reset Matrix
                            </Button>
                        )}
                    </div>
                </div>

                {/* Registry Table */}
                <Card className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-black flex items-center justify-center text-white shadow-lg shadow-black/10">
                                <MessageSquare className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight italic">Grievance Registry</h3>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">Real-time concern identification & lifecycle audit</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-0 overflow-x-auto">
                        <table className="w-full text-left min-w-[1200px]">
                            <thead>
                                <tr className="bg-gray-50/70 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 border-b">
                                    <th className="px-8 py-5 italic">Token & Registry</th>
                                    <th className="px-8 py-5">Residual Node</th>
                                    <th className="px-8 py-5">Domain Context</th>
                                    <th className="px-8 py-5">Magnitude</th>
                                    <th className="px-8 py-5">Operational State</th>
                                    <th className="px-8 py-5 text-right">Audit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredComplaints.map((complaint) => (
                                    <tr key={complaint.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-bold text-gray-900 uppercase tracking-tight italic line-clamp-1">{complaint.title}</span>
                                                {complaint.uid ? (
                                                    <span className="text-[8px] font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md mt-1 w-fit uppercase tracking-wider">
                                                        {complaint.uid}
                                                    </span>
                                                ) : (
                                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mt-0.5 flex items-center gap-1.5">
                                                        <Hash className="h-2 w-2" /> #GRV-{complaint.id.slice(-8).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-bold text-gray-900 uppercase tracking-tight italic">{complaint.User_Complaint_userIdToUser?.name}</span>
                                                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-[0.2em] mt-0.5">{complaint.roomNumber || 'COMMON'} AREA</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tight italic">{complaint.Hostel?.name}</span>
                                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mt-0.5 italic">{complaint.category} MODULE</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <Badge variant="outline" className={`${getPriorityTheme(complaint.priority)} px-3 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border shadow-sm`}>
                                                {complaint.priority}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-6">
                                            <Badge variant="outline" className={`${getStatusTheme(complaint.status)} px-3 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border shadow-sm`}>
                                                {complaint.status}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-black hover:text-white transition-all" onClick={() => setSelectedComplaint(complaint)}>
                                                        <ArrowUpRight className="h-4 w-4" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-xl p-0 overflow-hidden border-none rounded-3xl shadow-2xl">
                                                    <div className="bg-white">
                                                        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-10 w-10 rounded-xl bg-black flex items-center justify-center text-white shadow-lg shadow-black/10">
                                                                    <BarChart3 className="h-5 w-5" />
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight italic">Audit Review</h3>
                                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">Lifecycle Management Node</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="p-8 space-y-6">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="space-y-1.5">
                                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                                        <User className="h-3 w-3" /> Grievant Identity
                                                                    </span>
                                                                    <p className="text-sm font-bold text-gray-900 uppercase italic truncate">{complaint.User_Complaint_userIdToUser?.name}</p>
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                                        <Calendar className="h-3 w-3" /> Log Persistence
                                                                    </span>
                                                                    <p className="text-sm font-bold text-gray-900 uppercase italic truncate">{format(new Date(complaint.createdAt), 'MMM dd, yyyy')}</p>
                                                                </div>
                                                            </div>

                                                            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                                                                <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest italic">{complaint.title}</h4>
                                                                <p className="text-xs text-gray-500 font-medium leading-relaxed italic">"{complaint.description}"</p>
                                                            </div>

                                                            {complaint.resolutionNotes && (
                                                                <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <ShieldCheck className="h-3 w-3 text-emerald-600" />
                                                                        <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest italic">Resolution Artifact</h4>
                                                                    </div>
                                                                    <p className="text-xs text-emerald-800 font-medium leading-relaxed italic">"{complaint.resolutionNotes}"</p>
                                                                </div>
                                                            )}

                                                            {(complaint.status === 'PENDING' || complaint.status === 'IN_PROGRESS') && (
                                                                <div className="space-y-4">
                                                                    <div className="space-y-2">
                                                                        <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 italic px-1">Assign Staff Node</Label>
                                                                        <Select
                                                                            defaultValue={complaint.assignedToId}
                                                                            onValueChange={(val) => setAssignedStaffId(val)}
                                                                        >
                                                                            <SelectTrigger className="h-10 rounded-xl border-gray-100 font-bold text-[10px] uppercase tracking-widest text-gray-600 shadow-sm focus:ring-0">
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
                                                                            className="min-h-[100px] rounded-xl border-gray-100 font-medium text-xs shadow-sm focus:ring-0"
                                                                        />
                                                                    </div>
                                                                    <div className="grid grid-cols-3 gap-3">
                                                                        <Button
                                                                            variant="outline"
                                                                            className="h-10 rounded-xl font-bold text-[9px] uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 border-emerald-100"
                                                                            onClick={() => handleUpdateStatus(complaint.id, 'RESOLVED', assignedStaffId || undefined)}
                                                                            disabled={updateMutation.isPending}
                                                                        >
                                                                            <CheckCircle className="h-3.5 w-3.5 mr-2" /> Resolve
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline"
                                                                            className="h-10 rounded-xl font-bold text-[9px] uppercase tracking-widest text-amber-600 hover:bg-amber-50 border-amber-100"
                                                                            onClick={() => handleUpdateStatus(complaint.id, 'IN_PROGRESS', assignedStaffId || undefined)}
                                                                            disabled={updateMutation.isPending}
                                                                        >
                                                                            <Zap className="h-3.5 w-3.5 mr-2" /> Assign/Update
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline"
                                                                            className="h-10 rounded-xl font-bold text-[9px] uppercase tracking-widest text-rose-500 hover:bg-rose-50 border-rose-100"
                                                                            onClick={() => handleUpdateStatus(complaint.id, 'REJECTED')}
                                                                            disabled={updateMutation.isPending}
                                                                        >
                                                                            <XCircle className="h-3.5 w-3.5 mr-2" /> Reject
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <div className="border-t border-gray-100 pt-6">
                                                                <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest italic mb-4">Communication Channel</h4>

                                                                <div className="space-y-4 mb-4 max-h-[300px] overflow-y-auto pr-2">
                                                                    {complaint.comments?.map((comment) => (
                                                                        <div key={comment.id} className={`flex gap-3 ${comment.User.role === 'RESIDENT' || comment.User.role === 'GUEST' ? '' : 'flex-row-reverse'}`}>
                                                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border ${comment.User.role === 'RESIDENT' || comment.User.role === 'GUEST' ? 'bg-gray-100 border-gray-200 text-gray-500' : 'bg-black border-black text-white'}`}>
                                                                                <span className="text-xs font-black">{comment.User.name?.charAt(0)}</span>
                                                                            </div>
                                                                            <div className={`p-3 rounded-2xl max-w-[80%] ${comment.User.role === 'RESIDENT' || comment.User.role === 'GUEST' ? 'bg-gray-50 border border-gray-100 rounded-tl-none' : 'bg-black text-white rounded-tr-none'}`}>
                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                    <span className={`text-[8px] font-black uppercase tracking-widest ${comment.User.role === 'RESIDENT' || comment.User.role === 'GUEST' ? 'text-gray-400' : 'text-gray-400'}`}>{comment.User.name}</span>
                                                                                    <span className={`text-[8px] uppercase tracking-widest opacity-50`}>{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                                </div>
                                                                                <p className="text-xs font-medium leading-relaxed">{comment.message}</p>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                    {(!complaint.comments || complaint.comments.length === 0) && (
                                                                        <p className="text-center text-xs text-gray-400 italic py-4">No recent activity in this channel</p>
                                                                    )}
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    <Input
                                                                        placeholder="Type your reply here..."
                                                                        className="rounded-xl border-gray-100 font-medium text-xs shadow-sm focus:ring-0"
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
                                                                        className="rounded-xl bg-black hover:bg-gray-800 shrink-0"
                                                                        onClick={() => handleSendComment(complaint.id)}
                                                                        disabled={addCommentMutation.isPending || !newComment.trim()}
                                                                    >
                                                                        <Zap className="h-4 w-4 text-white" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </td>
                                    </tr>
                                ))}
                                {filteredComplaints.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center">
                                                    <Info className="h-6 w-6 text-gray-200" />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-bold text-gray-900 uppercase">No Grievance Tokens Identified</p>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">Registry matrix is currently clear for this domain</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>


            </main>
        </div>
    );
};

export default ComplaintsPage;
