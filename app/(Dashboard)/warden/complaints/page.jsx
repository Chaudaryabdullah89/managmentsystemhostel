"use client"
import React, { useState } from "react";
import Link from "next/link";
import {
    Search, AlertTriangle, CheckCircle, Clock, XCircle, User,
    MessageSquare, Download, Filter, BarChart3, ShieldCheck,
    Zap, Info, Calendar, Hash, Send, Building2, ChevronRight,
    ArrowUpRight, CheckCircle2, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
    Dialog, DialogContent, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useComplaints, useUpdateComplaint, useAddComplaintComment } from "@/hooks/usecomplaints";
import { useHostel } from "@/hooks/usehostel";
import { useStaffList } from "@/hooks/useSalaries";
import { format } from "date-fns";
import { toast } from "sonner";
import useAuthStore from "@/hooks/Authstate";
import Loader from "@/components/ui/Loader";

// ─── Status & Priority helpers ───────────────────────────────
// ─────────────────
const getStatusStyle = (status) => {
    switch (status) {
        case "RESOLVED": return "bg-emerald-50 text-emerald-700 border-emerald-100";
        case "REJECTED": return "bg-rose-50 text-rose-700 border-rose-100";
        case "IN_PROGRESS": return "bg-indigo-50 text-indigo-700 border-indigo-100";
        case "PENDING": return "bg-amber-50 text-amber-700 border-amber-100";
        default: return "bg-gray-100 text-gray-600 border-gray-200";
    }
};

const getRibbonColor = (status) => {
    switch (status) {
        case "RESOLVED": return "bg-emerald-500";
        case "REJECTED": return "bg-rose-500";
        case "IN_PROGRESS": return "bg-indigo-600";
        case "PENDING": return "bg-amber-400";
        default: return "bg-gray-300";
    }
};

const getPriorityStyle = (priority) => {
    switch (priority) {
        case "URGENT": return "bg-rose-500 text-white border-rose-500";
        case "HIGH": return "bg-rose-50 text-rose-600 border-rose-100";
        case "MEDIUM": return "bg-amber-50 text-amber-600 border-amber-100";
        case "LOW": return "bg-gray-100 text-gray-500 border-gray-200";
        default: return "bg-gray-100 text-gray-500 border-gray-200";
    }
};

// ─── Detail Dialog ─────────────────────────────────────────────────────────────
const ComplaintDetailDialog = ({ complaint, staffMembers, updateMutation, addCommentMutation, user }) => {
    const [notes, setNotes] = useState(complaint.resolutionNotes ?? "");
    const [assignedStaffId, setAssignedStaffId] = useState(complaint.assignedToId ?? "");
    const [newComment, setNewComment] = useState("");

    const handleUpdate = (status) => {
        updateMutation.mutate(
            { id: complaint.id, status, resolutionNotes: notes, assignedToId: assignedStaffId || undefined },
            { onSuccess: () => toast.success(`Complaint marked as ${status}`) }
        );
    };

    const handleSendComment = () => {
        if (!newComment.trim()) return;
        addCommentMutation.mutate(
            { complaintId: complaint.id, userId: user?.id, message: newComment },
            { onSuccess: () => setNewComment("") }
        );
    };

    const age = Math.floor((Date.now() - new Date(complaint.createdAt)) / 86400000);

    return (
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-none rounded-3xl shadow-2xl">
            <div className="bg-white">
                {/* Modal Header */}
                <div className="p-7 border-b border-gray-50 flex items-center gap-4 bg-gray-50/40">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-lg ${getRibbonColor(complaint.status)}`}>
                        <MessageSquare className="h-4.5 w-4.5 h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-gray-900 uppercase tracking-tight truncate">{complaint.title}</h3>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                            #{complaint.uid ?? complaint.id.slice(-8).toUpperCase()} &nbsp;·&nbsp; {complaint.category}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`${getPriorityStyle(complaint.priority)} px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border`}>
                            {complaint.priority}
                        </Badge>
                        <Badge variant="outline" className={`${getStatusStyle(complaint.status)} px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border`}>
                            {complaint.status.replace("_", " ")}
                        </Badge>
                    </div>
                </div>

                <div className="p-7 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Meta Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { icon: User, label: "Resident", value: complaint.User_Complaint_userIdToUser?.name },
                            { icon: Calendar, label: "Filed", value: format(new Date(complaint.createdAt), "MMM dd, yyyy") },
                            { icon: Building2, label: "Hostel", value: complaint.Hostel?.name ?? "N/A" },
                            { icon: Clock, label: "Age", value: age === 0 ? "Today" : `${age} days ago` },
                        ].map(({ icon: Icon, label, value }) => (
                            <div key={label} className="flex flex-col gap-1 p-4 bg-gray-50/60 rounded-2xl border border-gray-100">
                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                                    <Icon className="h-3 w-3" /> {label}
                                </span>
                                <span className="text-sm font-bold text-gray-900 truncate">{value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Description */}
                    <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Description</p>
                        <p className="text-sm text-gray-600 font-medium leading-relaxed">"{complaint.description}"</p>
                    </div>

                    {/* Resolution notes (read‑only) */}
                    {complaint.resolutionNotes && (
                        <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <div className="flex items-center gap-2 mb-2">
                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700">Resolution Details</span>
                            </div>
                            <p className="text-sm text-emerald-800 font-medium leading-relaxed">{complaint.resolutionNotes}</p>
                        </div>
                    )}

                    {/* Action Controls */}
                    {(complaint.status === "PENDING" || complaint.status === "IN_PROGRESS") && (
                        <div className="space-y-4 pt-2 border-t border-gray-100">
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Update Status</p>
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black uppercase tracking-wider text-gray-400">Assign To Staff</Label>
                                <Select defaultValue={complaint.assignedToId} onValueChange={setAssignedStaffId}>
                                    <SelectTrigger className="h-10 rounded-xl border-gray-100 text-xs font-bold uppercase tracking-wider shadow-sm focus:ring-indigo-300">
                                        <SelectValue placeholder="Select staff member..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl shadow-2xl">
                                        {staffMembers.map((s) => (
                                            <SelectItem key={s.userId} value={s.userId} className="text-xs font-bold uppercase">
                                                {s.User.name} — {s.designation}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black uppercase tracking-wider text-gray-400">Resolution Notes</Label>
                                <Textarea
                                    placeholder="Write details of the fix here..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="min-h-[80px] text-xs font-medium rounded-xl border-gray-100 resize-none focus:ring-indigo-300"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <Button onClick={() => handleUpdate("RESOLVED")} disabled={updateMutation.isPending}
                                    className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider shadow-lg shadow-emerald-600/20">
                                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Resolve
                                </Button>
                                <Button onClick={() => handleUpdate("IN_PROGRESS")} disabled={updateMutation.isPending}
                                    variant="outline" className="h-10 rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-[10px] font-black uppercase tracking-wider">
                                    <Zap className="h-3.5 w-3.5 mr-1.5" /> Assign
                                </Button>
                                <Button onClick={() => handleUpdate("REJECTED")} disabled={updateMutation.isPending}
                                    variant="outline" className="h-10 rounded-xl border-rose-200 text-rose-500 hover:bg-rose-50 text-[10px] font-black uppercase tracking-wider">
                                    <XCircle className="h-3.5 w-3.5 mr-1.5" /> Reject
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Chat Thread */}
                    <div className="space-y-4 pt-2 border-t border-gray-100">
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Message Thread</p>
                        <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
                            {complaint.comments?.length > 0 ? complaint.comments.map((c) => {
                                const isAdmin = c.User.role !== "RESIDENT" && c.User.role !== "GUEST";
                                return (
                                    <div key={c.id} className={`flex gap-2.5 ${isAdmin ? "flex-row-reverse" : ""}`}>
                                        <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${isAdmin ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                                            {c.User.name?.charAt(0)}
                                        </div>
                                        <div className={`p-3 rounded-2xl max-w-[78%] ${isAdmin ? "bg-indigo-600 text-white rounded-tr-none" : "bg-gray-50 border border-gray-100 rounded-tl-none"}`}>
                                            <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${isAdmin ? "text-white/60" : "text-gray-400"}`}>
                                                {c.User.name} · {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                            <p className="text-xs font-medium leading-relaxed">{c.message}</p>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="text-center py-8 text-gray-400 text-xs font-bold uppercase tracking-widest">No messages yet</div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="Write a reply..."
                                className="rounded-xl border-gray-100 text-xs font-medium"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendComment(); } }}
                            />
                            <Button size="icon" onClick={handleSendComment}
                                disabled={addCommentMutation.isPending || !newComment.trim()}
                                className="h-9 w-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 shrink-0 shadow-lg shadow-indigo-600/20">
                                <Send className="h-3.5 w-3.5 text-white" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </DialogContent>
    );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
const ComplaintsPage = () => {
    const user = useAuthStore((state) => state.user);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [hostelFilter, setHostelFilter] = useState("All");

    const { data: complaintsData, isLoading: isComplaintsLoading } = useComplaints({
        hostelId: hostelFilter !== "All" ? hostelFilter : undefined
    });
    const { data: statsData, isLoading: isStatsLoading } = useComplaints({ stats: "true" });
    const { data: hostelsData } = useHostel();
    const { data: staffData } = useStaffList();

    const updateMutation = useUpdateComplaint();
    const addCommentMutation = useAddComplaintComment();

    const complaints = complaintsData || [];
    const stats = statsData || { total: 0, pending: 0, inProgress: 0, resolved: 0, urgent: 0, resolutionRate: 0 };
    const hostels = hostelsData?.data || [];
    const staffMembers = staffData || [];

    const filteredComplaints = complaints.filter((c) => {
        const q = searchQuery.toLowerCase();
        const matchSearch =
            c.title?.toLowerCase().includes(q) ||
            c.User_Complaint_userIdToUser?.name?.toLowerCase().includes(q) ||
            c.id?.toLowerCase().includes(q);
        return matchSearch &&
            (statusFilter === "All" || c.status === statusFilter) &&
            (priorityFilter === "All" || c.priority === priorityFilter);
    });

    const handleExport = () => {
        const headers = ["Token ID", "Resident", "Hostel", "Category", "Priority", "Status", "Filed Date"];
        const rows = filteredComplaints.map((c) => [
            `GRV-${c.id.slice(-8).toUpperCase()}`, c.User_Complaint_userIdToUser?.name,
            c.Hostel?.name, c.category, c.priority, c.status,
            format(new Date(c.createdAt), "yyyy-MM-dd HH:mm"),
        ]);
        const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
        const link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
        link.download = `Complaints_${format(new Date(), "yyyyMMdd_HHmm")}.csv`;
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Complaints exported successfully");
    };

    if (isComplaintsLoading || isStatsLoading) return <Loader label="Loading Complaints" subLabel="Fetching complaint records..." icon={MessageSquare} fullScreen={false} />;

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans">
            {/* ── Sticky Header ── */}
            <div className="bg-white border-b sticky top-0 z-50 py-2 md:h-16">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-full flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="h-8 w-1 bg-indigo-600 rounded-full shrink-0" />
                        <div className="flex flex-col">
                            <h1 className="text-sm md:text-lg font-bold text-gray-900 tracking-tight uppercase">Complaints</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-gray-400">Complaint List</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-emerald-600">Active Monitoring</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={handleExport}
                            className="h-9 px-4 rounded-xl border-gray-200 bg-white font-bold text-[9px] md:text-[10px] uppercase tracking-wider text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2">
                            <Download className="h-3.5 w-3.5 text-gray-400" /> <span className="hidden xs:inline">Export List</span> <span className="xs:hidden">Export</span>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 animate-in slide-in-from-bottom-6 fade-in duration-500 fill-mode-both">
                    {[
                        { label: "Total Received", value: stats.total, icon: MessageSquare, color: "text-indigo-600", bg: "bg-indigo-50" },
                        { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
                        { label: "Urgent Cases", value: stats.urgent, icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-50" },
                        { label: "Fix Rate", value: `${stats.resolutionRate}%`, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row items-center sm:items-center gap-3 md:gap-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow cursor-default text-center sm:text-left">
                            <div className={`h-10 w-10 md:h-11 md:w-11 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{stat.label}</span>
                                <span className="text-sm md:text-xl font-bold text-gray-900 tracking-tight">{stat.value}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Search + Filter Bar ── */}
                <div className="bg-white border border-gray-100 rounded-2xl p-2 flex flex-col md:flex-row items-center gap-2 md:gap-4 shadow-sm animate-in slide-in-from-bottom-6 fade-in duration-500 fill-mode-both delay-100">
                    <div className="flex-1 relative w-full group">
                        <Search className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                        <Input
                            placeholder="Search by title, resident or ID..."
                            className="w-full h-11 md:h-12 pl-10 md:pl-12 bg-transparent border-none shadow-none font-bold text-xs md:text-sm focus-visible:ring-0 placeholder:text-gray-300"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <span className="hidden sm:inline-flex absolute right-6 top-1/2 -translate-y-1/2 text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full uppercase animate-in fade-in zoom-in duration-300">
                                {filteredComplaints.length} Results
                            </span>
                        )}
                    </div>

                    <div className="h-8 w-px bg-gray-100 mx-2 hidden md:block" />

                    <div className="flex items-center gap-1.5 md:gap-2 p-1 bg-gray-50 rounded-xl w-full md:w-auto overflow-x-auto scrollbar-hide">
                        {/* Status Filter */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-9 md:h-10 px-3 md:px-4 rounded-lg font-bold text-[9px] md:text-[10px] uppercase tracking-wider text-gray-500 hover:bg-white hover:text-black hover:shadow-sm flex-1 md:flex-none">
                                    <Filter className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                    <span className="truncate">{statusFilter === "All" ? "All Status" : statusFilter.replace("_", " ")}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[220px] rounded-xl border-gray-100 shadow-xl p-2">
                                <DropdownMenuLabel className="text-[9px] font-bold uppercase tracking-widest text-gray-400 p-2">Complaint Status</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-gray-50 mb-1" />
                                {["All", "PENDING", "IN_PROGRESS", "RESOLVED", "REJECTED"].map((s) => (
                                    <DropdownMenuItem key={s} onClick={() => setStatusFilter(s)} className="p-2.5 font-bold text-[10px] uppercase tracking-wider rounded-lg cursor-pointer">
                                        {s.replace("_", " ")}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Priority Filter */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-9 md:h-10 px-3 md:px-4 rounded-lg font-bold text-[9px] md:text-[10px] uppercase tracking-wider text-gray-500 hover:bg-white hover:text-black hover:shadow-sm flex-1 md:flex-none">
                                    <AlertTriangle className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                    <span className="truncate">{priorityFilter === "All" ? "All Priority" : priorityFilter}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[200px] rounded-xl border-gray-100 shadow-xl p-2">
                                <DropdownMenuLabel className="text-[9px] font-bold uppercase tracking-widest text-gray-400 p-2">Priority Level</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-gray-50 mb-1" />
                                {["All", "URGENT", "HIGH", "MEDIUM", "LOW"].map((p) => (
                                    <DropdownMenuItem key={p} onClick={() => setPriorityFilter(p)} className="p-2.5 font-bold text-[10px] uppercase tracking-wider rounded-lg cursor-pointer">
                                        {p}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Hostel Filter */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-9 md:h-10 px-3 md:px-4 rounded-lg font-bold text-[9px] md:text-[10px] uppercase tracking-wider text-gray-500 hover:bg-white hover:text-black hover:shadow-sm flex-1 md:flex-none">
                                    <Building2 className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                    <span className="truncate">{hostelFilter === "All" ? "All Hostels" : hostelFilter}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[260px] rounded-xl border-gray-100 shadow-xl p-2">
                                <DropdownMenuLabel className="text-[9px] font-bold uppercase tracking-widest text-gray-400 p-2">Select Hostel</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-gray-50 mb-1" />
                                <DropdownMenuItem onClick={() => setHostelFilter("All")} className="p-2.5 font-bold text-[10px] uppercase tracking-wider rounded-lg">All Hostels</DropdownMenuItem>
                                {hostels.map((h) => (
                                    <DropdownMenuItem key={h.id} onClick={() => setHostelFilter(h.name)} className="p-2.5 font-bold text-[10px] uppercase tracking-wider rounded-lg">
                                        {h.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* ── Complaint Cards ── */}
                <div className="space-y-4 animate-in slide-in-from-bottom-8 fade-in duration-600 fill-mode-both delay-200">
                    {filteredComplaints.length > 0 ? filteredComplaints.map((complaint) => (
                        <Dialog key={complaint.id}>
                            <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 flex flex-col lg:flex-row items-center justify-between gap-4 md:gap-6 hover:shadow-md transition-shadow group relative overflow-hidden">
                                {/* Left color ribbon */}
                                <div className={`absolute top-0 left-0 w-1 md:w-1.5 h-full ${getRibbonColor(complaint.status)} opacity-80`} />

                                <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0 w-full lg:w-auto">
                                    {/* Avatar + Title */}
                                    <div className="flex items-center gap-3 md:gap-5 flex-1 min-w-0">
                                        <div className={`h-11 w-11 md:h-14 md:w-14 rounded-xl flex items-center justify-center border border-gray-100 shadow-sm shrink-0 transition-colors group-hover:border-indigo-100 ${complaint.priority === "URGENT" ? "bg-rose-50" : "bg-gray-50"}`}>
                                            <MessageSquare className={`h-5 w-5 md:h-6 md:w-6 ${complaint.priority === "URGENT" ? "text-rose-400" : "text-gray-400"} group-hover:text-indigo-500 transition-colors`} />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <h4 className="text-sm md:text-base font-bold text-gray-900 uppercase tracking-tight truncate">{complaint.title}</h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate max-w-[120px] md:max-w-[160px]">
                                                    {complaint.User_Complaint_userIdToUser?.name}
                                                </span>
                                                {complaint.uid && (
                                                    <>
                                                        <span className="h-0.5 w-0.5 rounded-full bg-gray-200" />
                                                        <span className="text-[8px] md:text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 md:px-2 py-0.5 rounded">{complaint.uid}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Badge Mobile */}
                                    <div className="lg:hidden">
                                        <Badge variant="outline" className={`${getStatusStyle(complaint.status)} px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest border`}>
                                            {complaint.status.replace("_", " ")}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 md:gap-8 flex-1 w-full lg:w-auto">
                                    {/* Hostel + Category */}
                                    <div className="hidden md:flex flex-col gap-1 min-w-[140px] flex-1">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-3.5 w-3.5 text-indigo-400" />
                                            <span className="text-xs font-bold text-gray-900 uppercase truncate">{complaint.Hostel?.name ?? "N/A"}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-0.5">{complaint.category}</span>
                                    </div>

                                    {/* Date + Priority inline panel */}
                                    <div className="hidden xl:flex items-center gap-6 min-w-[300px] bg-indigo-50/30 p-3 rounded-2xl border border-indigo-100/50">
                                        <div className="flex flex-col gap-0.5 text-left">
                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 pl-0.5">
                                                <Calendar className="h-2.5 w-2.5" /> Filed
                                            </span>
                                            <span className="text-[11px] font-bold text-gray-900 uppercase">
                                                {format(new Date(complaint.createdAt), "MMM dd, yyyy")}
                                            </span>
                                        </div>
                                        <div className="flex-1 flex items-center px-4">
                                            <div className="h-[2px] w-full bg-indigo-100 relative">
                                                <div className="absolute -top-1 left-0 h-2 w-2 rounded-full bg-indigo-200" />
                                                <div className="absolute -top-1 right-0 h-2 w-2 rounded-full bg-indigo-200" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-0.5 text-right">
                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest pr-0.5">Priority</span>
                                            <Badge variant="outline" className={`${getPriorityStyle(complaint.priority)} text-[8px] font-black uppercase tracking-widest border px-2 py-0.5 rounded-full`}>
                                                {complaint.priority}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Status Badge Desktop */}
                                    <div className="hidden lg:flex min-w-[130px] justify-center">
                                        <Badge variant="outline" className={`${getStatusStyle(complaint.status)} px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border shadow-sm`}>
                                            {complaint.status.replace("_", " ")}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 w-full lg:w-auto justify-end pt-3 lg:pt-0 border-t lg:border-none border-gray-50">
                                    <DialogTrigger asChild>
                                        <Button className="h-9 md:h-10 px-4 md:px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[9px] md:text-[10px] uppercase tracking-wider shadow-sm flex items-center gap-2 group/btn flex-1 md:flex-none justify-center">
                                            View Details
                                            <ChevronRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
                                        </Button>
                                    </DialogTrigger>
                                </div>
                            </div>

                            <ComplaintDetailDialog
                                complaint={complaint}
                                staffMembers={staffMembers}
                                updateMutation={updateMutation}
                                addCommentMutation={addCommentMutation}
                                user={user}
                            />
                        </Dialog>
                    )) : (
                        <div className="bg-white border border-dashed border-gray-100 rounded-3xl p-24 text-center shadow-sm">
                            <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-6 border border-gray-100">
                                <Search className="h-8 w-8 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">No complaints found</h3>
                            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Try changing your search or filters</p>
                            <Button variant="outline"
                                className="mt-8 rounded-xl h-10 px-8 font-bold uppercase tracking-widest text-[10px] border-gray-200 hover:bg-black hover:text-white transition-all shadow-sm"
                                onClick={() => { setSearchQuery(""); setStatusFilter("All"); setPriorityFilter("All"); setHostelFilter("All"); }}>
                                Reset Filters
                            </Button>
                        </div>
                    )}
                </div>

                {/* ── Bottom Status Banner ── */}
                <div className="pt-4">
                    <div className="pt-4 px-2 md:px-0">
                        <div className="bg-indigo-600 text-white rounded-[2rem] p-5 md:p-4 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-indigo-600/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-full bg-white/5 skew-x-12 translate-x-20" />
                            <div className="flex items-center gap-4 md:gap-6 relative z-10 w-full md:w-auto px-2 md:px-4">
                                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md shrink-0">
                                    <ShieldCheck className="h-5 w-5 text-white" />
                                </div>
                                <div className="flex flex-col">
                                    <h4 className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-200">System Monitoring</h4>
                                    <p className="text-[10px] md:text-[11px] font-bold mt-0.5">Live tracking active</p>
                                </div>
                            </div>
                            <div className="h-6 w-px bg-white/10 hidden md:block" />
                            <div className="flex-1 grid grid-cols-3 md:flex items-center gap-4 md:gap-12 px-2 md:px-8 w-full md:w-auto text-center md:text-left">
                                <div className="flex flex-col">
                                    <span className="text-[7px] md:text-[8px] font-bold uppercase text-indigo-200 tracking-widest truncate">Open Cases</span>
                                    <span className="text-[9px] md:text-[10px] font-bold text-white uppercase mt-1">{stats.pending}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[7px] md:text-[8px] font-bold uppercase text-indigo-200 tracking-widest truncate">Total Records</span>
                                    <span className="text-[9px] md:text-[10px] font-bold text-white uppercase mt-1">{complaints.length}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[7px] md:text-[8px] font-bold uppercase text-indigo-200 tracking-widest truncate">Solved Rate</span>
                                    <span className="text-[9px] md:text-[10px] font-bold text-white uppercase mt-1">{stats.resolutionRate}%</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 md:pr-6 relative z-10 w-full md:w-auto justify-center md:justify-end border-t md:border-none border-white/10 pt-4 md:pt-0">
                                <span className="text-[8px] md:text-[9px] font-bold uppercase text-white tracking-widest">Network Status</span>
                                <div className="h-2 w-2 rounded-full bg-white animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.4)]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComplaintsPage;
