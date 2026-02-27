"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft, Plane, Clock, CheckCircle, XCircle, AlertCircle,
    Search, Filter, User, Calendar, Home, Phone, Building2,
    Check, X, Loader2, FileText, RefreshCw, ChevronRight,
    SlidersHorizontal, CalendarRange, Info
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
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import Loader from "@/components/ui/Loader";

const StatusBadge = ({ status }) => {
    const s = status?.toUpperCase();
    if (s === 'APPROVED') return <Badge className="bg-emerald-50 text-emerald-700 border-none text-[9px] font-bold uppercase px-3">Done</Badge>;
    if (s === 'REJECTED') return <Badge className="bg-rose-50 text-rose-700 border-none text-[9px] font-bold uppercase px-3">Closed</Badge>;
    if (s === 'PENDING') return <Badge className="bg-amber-50 text-amber-700 border-none text-[9px] font-bold uppercase px-3">Open</Badge>;
    if (s === 'IN_PROGRESS') return <Badge className="bg-blue-50 text-blue-700 border-none text-[9px] font-bold uppercase px-3">In Progress</Badge>;
    return <Badge className="bg-gray-50 text-gray-600 border-none text-[9px] font-bold uppercase px-3">{status}</Badge>;
};

const LeaveManagementPage = () => {
    const router = useRouter();
    const [leaves, setLeaves] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [reviewNotes, setReviewNotes] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchLeaves = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/leave');
            const data = await res.json();
            if (data.success) setLeaves(data.data || []);
        } catch (e) {
            console.error(e);
            toast.error("Failed to load leave requests");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchLeaves(); }, []);

    const parseLeaveData = (leave) => {
        try {
            const desc = JSON.parse(leave.description);
            return {
                ...leave,
                startDate: desc.startDate,
                endDate: desc.endDate,
                reason: desc.reason,
                emergencyContact: desc.emergencyContact,
                duration: differenceInDays(new Date(desc.endDate), new Date(desc.startDate))
            };
        } catch {
            return { ...leave, startDate: null, endDate: null, reason: leave.description, duration: 0 };
        }
    };

    const parsedLeaves = leaves.map(parseLeaveData);

    const filteredLeaves = parsedLeaves.filter(l => {
        const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
        const user = l.User_maintanance_userIdToUser;
        const matchesSearch = !searchQuery ||
            user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.reason?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const handleUpdateStatus = async (id, status) => {
        setIsUpdating(true);
        try {
            const res = await fetch('/api/leave', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status, notes: reviewNotes })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Leave request ${status.toLowerCase()} successfully`);
                setSelectedLeave(null);
                setReviewNotes('');
                fetchLeaves();
            } else {
                toast.error(data.error || "Update failed");
            }
        } catch (e) {
            toast.error("Failed to update status");
        } finally {
            setIsUpdating(false);
        }
    };

    const stats = {
        total: parsedLeaves.length,
        pending: parsedLeaves.filter(l => l.status === 'PENDING').length,
        approved: parsedLeaves.filter(l => l.status === 'APPROVED').length,
        rejected: parsedLeaves.filter(l => l.status === 'REJECTED').length,
    };

    if (isLoading) return <Loader label="Loading" subLabel="Updates..." icon={Plane} fullScreen={false} />;

    return (
        <div className="min-h-screen bg-gray-50/30 pb-20 font-sans">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-40 h-16">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl h-9 w-9 hover:bg-gray-100">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="h-5 w-px bg-gray-100" />
                        <div>
                            <h1 className="text-base font-bold text-gray-900 uppercase tracking-tight">Leaves</h1>
                            <div className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">{stats.pending} Open</p>
                            </div>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={fetchLeaves} className="rounded-xl h-9 w-9 hover:bg-gray-100">
                        <RefreshCw className="h-4 w-4 text-gray-400" />
                    </Button>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-8 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total', value: stats.total, color: 'bg-gray-950 text-white', icon: Plane },
                        { label: 'Open', value: stats.pending, color: 'bg-amber-50 text-amber-800', icon: Clock },
                        { label: 'Done', value: stats.approved, color: 'bg-emerald-50 text-emerald-800', icon: CheckCircle },
                        { label: 'Closed', value: stats.rejected, color: 'bg-rose-50 text-rose-800', icon: XCircle },
                    ].map((stat, i) => (
                        <div key={i} className={`${stat.color} rounded-2xl p-5 shadow-sm flex items-center justify-between`}>
                            <div>
                                <p className="text-2xl font-black tracking-tight">{stat.value}</p>
                                <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-1">{stat.label}</p>
                            </div>
                            <stat.icon className="h-6 w-6 opacity-20" />
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-white border border-gray-100 rounded-2xl p-2 flex flex-col md:flex-row items-center gap-3">
                    <div className="flex-1 relative w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                        <Input
                            placeholder="Search"
                            className="h-12 pl-10 border-none shadow-none font-bold text-sm focus-visible:ring-0"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-1 p-1 bg-gray-50 rounded-xl w-full md:w-auto">
                        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(s => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${statusFilter === s ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {s === 'ALL' ? 'All' : s === 'PENDING' ? 'Open' : s === 'APPROVED' ? 'Done' : 'Closed'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Leave List */}
                <div className="space-y-3">
                    {filteredLeaves.length > 0 ? filteredLeaves.map((leave) => {
                        const user = leave.User_maintanance_userIdToUser;
                        return (
                            <div
                                key={leave.id}
                                className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                onClick={() => { setSelectedLeave(leave); setReviewNotes(leave.resolutionNotes || ''); }}
                            >
                                <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 text-sm font-black ${leave.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                                            leave.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-sm font-bold text-gray-900 uppercase">{user?.name || 'Unknown Resident'}</h3>
                                                <StatusBadge status={leave.status} />
                                            </div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{user?.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 text-sm">
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <Calendar className="h-4 w-4 text-gray-300" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">
                                                {leave.startDate ? format(new Date(leave.startDate), 'MMM dd') : 'N/A'} → {leave.endDate ? format(new Date(leave.endDate), 'MMM dd, yyyy') : 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-indigo-600 uppercase">{leave.duration} Days</span>
                                        </div>
                                        {leave.status === 'PENDING' && (
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    className="h-8 px-4 rounded-xl bg-emerald-600 text-white text-[9px] font-bold uppercase tracking-wider hover:bg-emerald-700 shadow-sm"
                                                    onClick={(e) => { e.stopPropagation(); setSelectedLeave(leave); setReviewNotes(''); }}
                                                >
                                                    <Check className="h-3 w-3 mr-1" /> Check
                                                </Button>
                                            </div>
                                        )}
                                        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-600 hidden md:block transition-colors" />
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-50">
                                    <p className="text-xs text-gray-500 line-clamp-1 font-medium">{leave.reason}</p>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                            <Plane className="h-10 w-10 text-gray-200 mb-4" />
                            <h3 className="text-base font-bold text-gray-900 uppercase tracking-tight">Empty</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
                                {statusFilter !== 'ALL' ? `Clear` : 'Clear'}
                            </p>
                        </div>
                    )}
                </div>
            </main>

            {/* Review Dialog */}
            <Dialog open={!!selectedLeave} onOpenChange={(open) => !open && setSelectedLeave(null)}>
                <DialogContent className="max-w-lg p-0 overflow-hidden border-none rounded-[2.5rem] shadow-2xl bg-white">
                    {selectedLeave && (() => {
                        const u = selectedLeave.User_maintanance_userIdToUser;
                        return (
                            <div>
                                <div className="p-8 border-b border-gray-50 bg-gray-50/50 flex items-center gap-4">
                                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-lg ${selectedLeave.status === 'APPROVED' ? 'bg-emerald-600' : selectedLeave.status === 'REJECTED' ? 'bg-rose-600' : 'bg-amber-600'}`}>
                                        {u?.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">{u?.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <StatusBadge status={selectedLeave.status} />
                                            <span className="text-[10px] font-bold text-gray-400">{selectedLeave.uid || selectedLeave.id?.slice(-8).toUpperCase()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 space-y-6">
                                    <div className="grid grid-cols-2 gap-4 p-5 bg-gray-50 rounded-2xl">
                                        {[
                                            { label: 'Start', value: selectedLeave.startDate ? format(new Date(selectedLeave.startDate), 'MMM dd, yyyy') : 'N/A', icon: Calendar },
                                            { label: 'End', value: selectedLeave.endDate ? format(new Date(selectedLeave.endDate), 'MMM dd, yyyy') : 'N/A', icon: Home },
                                            { label: 'Time', value: `${selectedLeave.duration} days`, icon: CalendarRange },
                                            { label: 'Contact', value: selectedLeave.emergencyContact || 'N/A', icon: Phone },
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-start gap-2">
                                                <item.icon className="h-3.5 w-3.5 text-gray-300 mt-0.5" />
                                                <div>
                                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</p>
                                                    <p className="text-xs font-bold text-gray-700 mt-0.5">{item.value}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reason</Label>
                                        <div className="p-4 bg-gray-50 rounded-xl">
                                            <p className="text-sm text-gray-600 font-medium italic">"{selectedLeave.reason}"</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Notes</Label>
                                        <Textarea
                                            className="rounded-xl border-gray-100 font-medium text-sm bg-gray-50 resize-none min-h-[80px]"
                                            placeholder="Notes"
                                            value={reviewNotes}
                                            onChange={e => setReviewNotes(e.target.value)}
                                        />
                                    </div>

                                    {selectedLeave.status === 'PENDING' ? (
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button
                                                className="h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-widest"
                                                onClick={() => handleUpdateStatus(selectedLeave.id, 'APPROVED')}
                                                disabled={isUpdating}
                                            >
                                                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-2" /> Approve</>}
                                            </Button>
                                            <Button
                                                className="h-14 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] uppercase tracking-widest"
                                                onClick={() => handleUpdateStatus(selectedLeave.id, 'REJECTED')}
                                                disabled={isUpdating}
                                            >
                                                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><X className="h-4 w-4 mr-2" /> Reject</>}
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                                            <Info className="h-4 w-4 text-gray-400" />
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Processed</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default LeaveManagementPage;
