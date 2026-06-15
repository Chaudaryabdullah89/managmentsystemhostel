"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft, Sparkles, Clock, CheckCircle, XCircle, AlertCircle,
    Search, Filter, User, Calendar, Home, Phone, Building2,
    Check, X, Loader2, RefreshCw, ArrowLeftRight, Inbox, HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { ListPageSkeleton } from "@/components/ui/skeletons";

const StatusBadge = ({ status }) => {
    const s = status?.toUpperCase();
    if (s === 'APPROVED') return <Badge className="bg-emerald-50 text-emerald-700 border-none text-[9px] font-bold uppercase px-3">Approved</Badge>;
    if (s === 'REJECTED') return <Badge className="bg-rose-50 text-rose-700 border-none text-[9px] font-bold uppercase px-3">Rejected</Badge>;
    if (s === 'PENDING') return <Badge className="bg-amber-50 text-amber-700 border-none text-[9px] font-bold uppercase px-3">Pending</Badge>;
    return <Badge className="bg-gray-50 dark:bg-muted/10 text-gray-600 dark:text-muted-foreground border-none text-[9px] font-bold uppercase px-3">{status}</Badge>;
};

const parseReason = (reason) => {
    if (reason?.startsWith("[DIRECT_TRANSFER]")) {
        const cleaned = reason.replace("[DIRECT_TRANSFER]", "").trim();
        return {
            isDirect: true,
            displayReason: cleaned || "Direct room transfer by management"
        };
    }
    return {
        isDirect: false,
        displayReason: reason || "No reason specified"
    };
};

const WardenRoomSwapPage = () => {
    const router = useRouter();
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
    const [isActionPending, setIsActionPending] = useState(false);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/guest/room-swap');
            const data = await res.json();
            if (data.success) {
                setRequests(data.requests || []);
            } else {
                toast.error(data.error || "Failed to load room swap requests");
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to load room swap requests");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (status) => {
        if (!selectedRequest) return;
        setIsActionPending(true);
        try {
            const res = await fetch('/api/guest/room-swap', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId: selectedRequest.id, status })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Room swap request ${status.toLowerCase()} successfully`);
                setIsRejectDialogOpen(false);
                setIsApproveDialogOpen(false);
                setSelectedRequest(null);
                fetchRequests();
            } else {
                toast.error(data.error || "Failed to process room swap");
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to process room swap");
        } finally {
            setIsActionPending(false);
        }
    };

    const filteredRequests = requests.filter(req => {
        const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;
        const user = req.User;
        const matchesSearch = !searchQuery ||
            user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.FromRoom?.roomNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.ToRoom?.roomNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.reason?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'PENDING').length,
        approved: requests.filter(r => r.status === 'APPROVED').length,
        rejected: requests.filter(r => r.status === 'REJECTED').length,
    };

    if (isLoading) return <ListPageSkeleton />;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-background pb-32 font-sans tracking-tight text-slate-900 dark:text-foreground">
            {/* Header */}
            <div className="bg-white dark:bg-card border-b sticky top-0 z-50 h-16 shadow-sm shadow-black/5">
                <div className="max-w-[1600px] mx-auto px-8 h-full flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100 dark:hover:bg-sidebar-accent h-9 w-9" onClick={() => router.back()}>
                            <ChevronLeft className="h-4 w-4 text-slate-400" />
                        </Button>
                        <div className="h-6 w-px bg-slate-100 dark:bg-border" />
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-violet-650 animate-pulse" />
                            <div className="flex flex-col">
                                <h1 className="text-base font-bold tracking-tight uppercase">Hostel Room Swaps</h1>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Warden Operations</span>
                                    <Badge variant="secondary" className="bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/10 dark:text-amber-500 text-[9px] px-2 py-0">
                                        {stats.pending} Pending
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={fetchRequests} className="rounded-xl h-9 w-9 hover:bg-gray-100 dark:hover:bg-sidebar-accent">
                        <RefreshCw className="h-4 w-4 text-gray-400 dark:text-muted-foreground" />
                    </Button>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-8 py-10 space-y-10">
                {/* Stats Summary Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { title: "Total Hostel Requests", value: stats.total, icon: ArrowLeftRight, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/10" },
                        { title: "Pending Review", value: stats.pending, icon: Clock, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/10" },
                        { title: "Approved Swaps", value: stats.approved, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/10" },
                        { title: "Rejected Swaps", value: stats.rejected, icon: XCircle, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-900/10" }
                    ].map((card, i) => (
                        <div key={i} className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest block">{card.title}</span>
                                <h3 className="text-3xl font-black tracking-tight">{card.value}</h3>
                            </div>
                            <div className={`h-12 w-12 rounded-xl ${card.bg} flex items-center justify-center`}>
                                <card.icon className={`h-6 w-6 ${card.color}`} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filter and Search Bar */}
                <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-muted-foreground" />
                        <Input
                            placeholder="Search by resident name, room, or reason..."
                            className="pl-11 h-12 rounded-xl bg-gray-50/50 dark:bg-muted/10 border-gray-100 dark:border-border text-sm focus:border-indigo-500 focus:ring-indigo-500/20"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                        <Filter className="h-4 w-4 text-gray-400 dark:text-muted-foreground shrink-0 hidden md:block" />
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full md:w-48 h-12 rounded-xl bg-gray-50/50 dark:bg-muted/10 border-gray-100 dark:border-border text-xs font-bold uppercase tracking-wider">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-gray-100 dark:border-border">
                                <SelectItem value="ALL" className="text-xs uppercase tracking-wider font-bold">All Requests</SelectItem>
                                <SelectItem value="PENDING" className="text-xs uppercase tracking-wider font-bold">Pending</SelectItem>
                                <SelectItem value="APPROVED" className="text-xs uppercase tracking-wider font-bold">Approved</SelectItem>
                                <SelectItem value="REJECTED" className="text-xs uppercase tracking-wider font-bold">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* List Grid */}
                {filteredRequests.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRequests.map((req) => (
                            <div key={req.id} className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 dark:bg-indigo-950/10 rounded-full -mr-16 -mt-16 opacity-60 blur-2xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />
                                
                                <div className="space-y-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center">
                                                <User className="h-5 w-5 text-indigo-600" />
                                            </div>
                                            <div className="flex flex-col">
                                                <h4 className="text-sm font-bold text-gray-900 dark:text-foreground line-clamp-1">{req.User?.name}</h4>
                                                <span className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground line-clamp-1">{req.User?.email}</span>
                                            </div>
                                        </div>
                                        <StatusBadge status={req.status} />
                                    </div>

                                    {/* Room Swap Path */}
                                    <div className="bg-gray-50/50 dark:bg-muted/10 border border-gray-100/50 dark:border-border/30 rounded-xl p-4 flex items-center justify-around gap-2 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted-foreground mb-1">From Room</span>
                                            <span className="text-sm font-black text-gray-900 dark:text-foreground">RM {req.FromRoom?.roomNumber || "N/A"}</span>
                                            <span className="text-[9px] font-bold text-indigo-500 truncate max-w-[90px]">{req.FromRoom?.Hostel?.name}</span>
                                        </div>
                                        <ArrowLeftRight className="h-4 w-4 text-indigo-600 shrink-0" />
                                        <div className="flex flex-col items-center">
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted-foreground mb-1">Requested Room</span>
                                            <span className="text-sm font-black text-gray-900 dark:text-foreground">RM {req.ToRoom?.roomNumber || "N/A"}</span>
                                            <span className="text-[9px] font-bold text-indigo-500 truncate max-w-[90px]">{req.FromRoom?.Hostel?.name}</span>
                                        </div>
                                    </div>

                                    {/* Source Badge & Reason block */}
                                    {(() => {
                                        const { isDirect, displayReason } = parseReason(req.reason);
                                        return (
                                            <div className="space-y-4">
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest block">Requested By</span>
                                                    {isDirect ? (
                                                        <Badge className="bg-violet-50 text-violet-750 dark:bg-violet-900/20 dark:text-violet-450 border-none text-[8px] font-bold uppercase py-1 px-2.5 rounded-lg">
                                                            Warden / Admin (Direct Transfer)
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-blue-50 text-blue-755 dark:bg-blue-900/20 dark:text-blue-450 border-none text-[8px] font-bold uppercase py-1 px-2.5 rounded-lg">
                                                            Resident (Self Requested)
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest block">Reason for Swap</span>
                                                    <p className="text-xs text-gray-600 dark:text-muted-foreground line-clamp-3 bg-gray-50/30 dark:bg-muted/5 p-3 rounded-lg border border-gray-100 dark:border-border/30 min-h-[64px]">
                                                        {displayReason}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                <div className="pt-6 mt-6 border-t border-gray-100 dark:border-border/50 flex flex-col gap-2">
                                    <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-muted-foreground font-bold uppercase mb-2">
                                        <span>Submitted</span>
                                        <span>{format(new Date(req.createdAt), "dd MMM yyyy, HH:mm")}</span>
                                    </div>
                                    
                                    {req.status === 'PENDING' && (
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => {
                                                    setSelectedRequest(req);
                                                    setIsRejectDialogOpen(true);
                                                }}
                                                variant="outline"
                                                className="flex-1 h-10 border-rose-100 dark:border-rose-950 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-bold text-[10px] uppercase tracking-widest rounded-xl"
                                            >
                                                Reject
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    setSelectedRequest(req);
                                                    setIsApproveDialogOpen(true);
                                                }}
                                                className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-600/10"
                                            >
                                                Approve
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-16 text-center shadow-sm max-w-md mx-auto">
                        <div className="h-16 w-16 bg-slate-50 dark:bg-muted/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-100 dark:border-border">
                            <Inbox className="h-8 w-8 text-gray-300 dark:text-muted-foreground" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-foreground uppercase tracking-tight">No Requests Found</h3>
                        <p className="text-gray-400 dark:text-muted-foreground font-bold text-[10px] uppercase tracking-widest mt-2">
                            There are no room swap requests matching the filters for your hostel.
                        </p>
                    </div>
                )}
            </main>

            {/* Reject Confirmation Dialog */}
            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl bg-white dark:bg-zinc-950 ring-1 ring-zinc-100 dark:ring-zinc-900">
                    <div className="bg-gradient-to-br from-red-500 via-rose-600 to-rose-700 p-8 text-white text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_60%)]" />
                        <div className="h-14 w-14 bg-white/10 dark:bg-black/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <XCircle className="h-7 w-7 text-white" />
                        </div>
                        <DialogTitle className="text-xl font-extrabold uppercase tracking-tight text-white">
                            Reject Swap Request
                        </DialogTitle>
                        <DialogDescription className="text-[10px] text-rose-100 font-extrabold tracking-widest mt-1.5 uppercase">
                            Confirm Rejection
                        </DialogDescription>
                    </div>
                    <div className="p-8 space-y-6">
                        <p className="text-xs text-gray-500 dark:text-muted-foreground text-center">
                            Are you sure you want to reject this room swap request for <strong className="text-gray-900 dark:text-foreground">{selectedRequest?.User?.name}</strong>? This will deny the room transfer.
                        </p>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1 rounded-xl h-12 font-bold text-[10px] uppercase tracking-widest border-zinc-200 dark:border-zinc-800"
                                onClick={() => setIsRejectDialogOpen(false)}
                                disabled={isActionPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 h-12 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-rose-600/10"
                                onClick={() => handleAction("REJECTED")}
                                disabled={isActionPending}
                            >
                                {isActionPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    "Confirm Reject"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Approve Confirmation Dialog */}
            <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl bg-white dark:bg-zinc-950 ring-1 ring-zinc-100 dark:ring-zinc-900">
                    <div className="bg-gradient-to-br from-indigo-500 via-blue-600 to-blue-700 p-8 text-white text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_60%)]" />
                        <div className="h-14 w-14 bg-white/10 dark:bg-black/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="h-7 w-7 text-white" />
                        </div>
                        <DialogTitle className="text-xl font-extrabold uppercase tracking-tight text-white">
                            Approve Swap Request
                        </DialogTitle>
                        <DialogDescription className="text-[10px] text-blue-100 font-extrabold tracking-widest mt-1.5 uppercase">
                            Execute Room Swap
                        </DialogDescription>
                    </div>
                    <div className="p-8 space-y-6">
                        <p className="text-xs text-gray-500 dark:text-muted-foreground text-center">
                            This will automatically swap <strong className="text-gray-900 dark:text-foreground">{selectedRequest?.User?.name}</strong> from room <strong className="text-gray-900 dark:text-foreground">{selectedRequest?.FromRoom?.roomNumber}</strong> to room <strong className="text-gray-900 dark:text-foreground">{selectedRequest?.ToRoom?.roomNumber}</strong> and update room occupancies.
                        </p>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1 rounded-xl h-12 font-bold text-[10px] uppercase tracking-widest border-zinc-200 dark:border-zinc-800"
                                onClick={() => setIsApproveDialogOpen(false)}
                                disabled={isActionPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-600/10"
                                onClick={() => handleAction("APPROVED")}
                                disabled={isActionPending}
                            >
                                {isActionPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    "Confirm Approve"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default WardenRoomSwapPage;
