"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import {
    Users, Search, ClipboardList, CheckCircle2, AlertCircle,
    Clock, Zap, ChevronRight, UserCheck, Building2, Filter,
    BarChart3, TrendingUp, Star, Flame, Activity, X,
    UserPlus, ArrowUpRight, MapPin, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStaffList } from "@/hooks/useSalaries";
import { useComplaints, useUpdateComplaint } from "@/hooks/usecomplaints";
import { useHostel } from "@/hooks/usehostel";
import { toast } from "sonner";

const AdminStaffPage = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedHostel, setSelectedHostel] = useState("all");
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [assignComplaintId, setAssignComplaintId] = useState("");
    const [assignNotes, setAssignNotes] = useState("");

    const { data: staffData, isLoading: isStaffLoading } = useStaffList();
    const { data: complaintsData } = useComplaints({});
    const { data: hostelsData } = useHostel();
    const updateMutation = useUpdateComplaint();

    const staffMembers = staffData || [];
    const complaints = complaintsData || [];
    const hostels = hostelsData?.data || [];

    // Compute per-staff task stats
    const staffWithStats = useMemo(() => {
        return staffMembers.map(staff => {
            const assigned = complaints.filter(c => c.assignedToId === staff.userId);
            const active = assigned.filter(c => c.status === "PENDING" || c.status === "IN_PROGRESS").length;
            const resolved = assigned.filter(c => c.status === "RESOLVED").length;
            const urgent = assigned.filter(c => c.priority === "URGENT" && c.status !== "RESOLVED").length;
            const total = assigned.length;
            const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;
            return { ...staff, stats: { active, resolved, urgent, total, rate } };
        });
    }, [staffMembers, complaints]);

    const unassignedComplaints = useMemo(() =>
        complaints.filter(c => !c.assignedToId && c.status !== "RESOLVED" && c.status !== "REJECTED"),
        [complaints]
    );

    const filteredStaff = useMemo(() => {
        return staffWithStats.filter(staff => {
            const name = staff.User?.name?.toLowerCase() || "";
            const designation = staff.designation?.toLowerCase() || "";
            const matchesSearch = name.includes(searchQuery.toLowerCase()) || designation.includes(searchQuery.toLowerCase());
            const matchesHostel = selectedHostel === "all" || staff.User?.hostelId === selectedHostel;
            return matchesSearch && matchesHostel;
        });
    }, [staffWithStats, searchQuery, selectedHostel]);

    const handleAssignTask = () => {
        if (!assignComplaintId || !selectedStaff) return;
        updateMutation.mutate({
            id: assignComplaintId,
            status: "IN_PROGRESS",
            assignedToId: selectedStaff.userId,
        }, {
            onSuccess: () => {
                toast.success(`Task assigned to ${selectedStaff.User?.name}`);
                setIsAssignOpen(false);
                setAssignComplaintId("");
                setAssignNotes("");
                setSelectedStaff(null);
            }
        });
    };

    const totalActive = staffWithStats.reduce((acc, s) => acc + s.stats.active, 0);
    const totalResolved = staffWithStats.reduce((acc, s) => acc + s.stats.resolved, 0);

    if (isStaffLoading) return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 border-[3px] border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Loading Staff...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-1.5 bg-indigo-600 rounded-full" />
                        <div>
                            <h1 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Staff Management</h1>
                            <p className="text-[10px] text-gray-400 font-medium">{staffMembers.length} staff members</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <Input
                                placeholder="Search staff..."
                                className="h-9 pl-9 w-[220px] rounded-xl border-gray-200 bg-gray-50 text-xs font-medium"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value={selectedHostel} onValueChange={setSelectedHostel}>
                            <SelectTrigger className="h-9 w-[160px] rounded-xl border-gray-200 bg-white text-[10px] font-bold uppercase tracking-wider">
                                <SelectValue placeholder="All Hostels" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-gray-100 shadow-xl">
                                <SelectItem value="all" className="text-[10px] font-bold uppercase">All Hostels</SelectItem>
                                {hostels.map(h => (
                                    <SelectItem key={h.id} value={h.id} className="text-[10px] font-bold uppercase">{h.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

                {/* Overview Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: "Total Staff", value: staffMembers.length, icon: Users, color: "text-gray-700", bg: "bg-white", iconBg: "bg-gray-100" },
                        { label: "Active Tasks", value: totalActive, icon: Activity, color: "text-indigo-600", bg: "bg-indigo-50", iconBg: "bg-indigo-100" },
                        { label: "Unassigned", value: unassignedComplaints.length, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50", iconBg: "bg-amber-100" },
                        { label: "Resolved Today", value: totalResolved, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", iconBg: "bg-emerald-100" },
                    ].map((stat, i) => (
                        <div key={i} className={`${stat.bg} border border-gray-100 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all`}>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                            </div>
                            <div className={`h-12 w-12 ${stat.iconBg} rounded-2xl flex items-center justify-center`}>
                                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Unassigned Tasks Alert */}
                {unassignedComplaints.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <AlertCircle className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-amber-900">{unassignedComplaints.length} complaints need staff assignment</p>
                                <p className="text-xs text-amber-700 font-medium mt-0.5">These complaints have no assigned staff member yet</p>
                            </div>
                        </div>
                        <Link href="/admin/complaints">
                            <Button className="h-9 px-4 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold rounded-xl gap-2 flex-shrink-0">
                                Manage <ArrowUpRight className="h-3.5 w-3.5" />
                            </Button>
                        </Link>
                    </div>
                )}

                {/* Staff Grid */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Staff Members</h2>
                        <p className="text-[10px] text-gray-400 font-medium">{filteredStaff.length} shown</p>
                    </div>

                    {filteredStaff.length === 0 ? (
                        <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-3xl">
                            <Users className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                            <p className="text-sm font-bold text-gray-400">No staff members found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {filteredStaff.map(staff => (
                                <div key={staff.id} className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
                                    {/* Card Header */}
                                    <div className="p-6 border-b border-gray-50">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg shadow-indigo-200">
                                                    {staff.User?.name?.charAt(0) || "S"}
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-gray-900">{staff.User?.name}</h3>
                                                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{staff.designation}</p>
                                                    {staff.department && (
                                                        <p className="text-[9px] text-gray-400 font-medium mt-0.5">{staff.department}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 mt-1 ${staff.stats.urgent > 0 ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}`} />
                                        </div>

                                        {staff.User?.Hostel_User_hostelIdToHostel && (
                                            <div className="flex items-center gap-1.5 mt-3 text-[10px] text-gray-400 font-medium">
                                                <Building2 className="h-3 w-3" />
                                                {staff.User.Hostel_User_hostelIdToHostel.name}
                                            </div>
                                        )}
                                    </div>

                                    {/* Stats */}
                                    <div className="px-6 py-4 grid grid-cols-3 gap-3">
                                        <div className="text-center">
                                            <p className="text-xl font-bold text-gray-900">{staff.stats.active}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Active</p>
                                        </div>
                                        <div className="text-center border-x border-gray-100">
                                            <p className="text-xl font-bold text-emerald-600">{staff.stats.resolved}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Resolved</p>
                                        </div>
                                        <div className="text-center">
                                            <p className={`text-xl font-bold ${staff.stats.urgent > 0 ? "text-rose-600" : "text-gray-300"}`}>{staff.stats.urgent}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Urgent</p>
                                        </div>
                                    </div>

                                    {/* Resolution Rate Bar */}
                                    <div className="px-6 pb-4">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Resolution Rate</span>
                                            <span className="text-[10px] font-bold text-gray-700">{staff.stats.rate}%</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-700"
                                                style={{ width: `${staff.stats.rate}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="px-6 pb-6 flex items-center gap-2">
                                        <Button
                                            className="flex-1 h-9 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-xl gap-1.5"
                                            onClick={() => {
                                                setSelectedStaff(staff);
                                                setIsAssignOpen(true);
                                            }}
                                        >
                                            <ClipboardList className="h-3.5 w-3.5" /> Assign Task
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-9 w-9 rounded-xl border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
                                            onClick={() => setSelectedStaff(selectedStaff?.id === staff.id ? null : staff)}
                                        >
                                            <ChevronRight className="h-4 w-4 text-gray-500" />
                                        </Button>
                                    </div>

                                    {/* Expanded Task List */}
                                    {selectedStaff?.id === staff.id && !isAssignOpen && (
                                        <div className="border-t border-gray-100 bg-gray-50/50">
                                            <div className="px-6 py-4">
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">Current Tasks</p>
                                                {complaints.filter(c => c.assignedToId === staff.userId && c.status !== "RESOLVED").length === 0 ? (
                                                    <p className="text-xs text-gray-400 text-center py-3">No active tasks</p>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {complaints.filter(c => c.assignedToId === staff.userId && c.status !== "RESOLVED").slice(0, 4).map(task => (
                                                            <div key={task.id} className="flex items-center justify-between gap-2 p-2.5 bg-white rounded-xl border border-gray-100">
                                                                <div className="flex items-center gap-2 min-w-0">
                                                                    <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${task.priority === "URGENT" ? "bg-rose-500" : task.priority === "HIGH" ? "bg-orange-500" : "bg-amber-400"}`} />
                                                                    <p className="text-[10px] font-bold text-gray-700 truncate">{task.title}</p>
                                                                </div>
                                                                <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full flex-shrink-0 ${task.status === "IN_PROGRESS" ? "bg-indigo-50 text-indigo-600" : "bg-gray-100 text-gray-500"}`}>
                                                                    {task.status.replace("_", " ")}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Assign Task Dialog */}
            <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                <DialogContent className="max-w-md rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
                    <div className="bg-gradient-to-br from-indigo-900 to-black p-8 text-white">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center">
                                <ClipboardList className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold uppercase tracking-tight">Assign Task</h2>
                                <p className="text-[10px] text-indigo-300 font-medium">to {selectedStaff?.User?.name}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 space-y-5 bg-white">
                        <div className="space-y-2">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Select Complaint / Task</Label>
                            <Select value={assignComplaintId} onValueChange={setAssignComplaintId}>
                                <SelectTrigger className="h-11 rounded-xl border-gray-200 font-medium text-xs focus:ring-0">
                                    <SelectValue placeholder="Choose a complaint to assign..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-gray-100 shadow-2xl max-h-[300px]">
                                    {unassignedComplaints.length === 0 ? (
                                        <div className="px-4 py-3 text-xs text-gray-400 text-center">No unassigned complaints</div>
                                    ) : (
                                        unassignedComplaints.map(c => (
                                            <SelectItem key={c.id} value={c.id} className="text-xs font-medium">
                                                <div className="flex items-center gap-2">
                                                    <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${c.priority === "URGENT" ? "bg-rose-500" : c.priority === "HIGH" ? "bg-orange-500" : "bg-amber-400"}`} />
                                                    {c.title} — Room {c.roomNumber || "N/A"}
                                                </div>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {assignComplaintId && (
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                {(() => {
                                    const c = unassignedComplaints.find(x => x.id === assignComplaintId);
                                    if (!c) return null;
                                    return (
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-gray-900">{c.title}</p>
                                            <p className="text-[10px] text-gray-500 font-medium line-clamp-2">{c.description}</p>
                                            <div className="flex items-center gap-3 mt-2 text-[9px] text-gray-400 font-bold uppercase">
                                                <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> Room {c.roomNumber || "N/A"}</span>
                                                <span className={`px-2 py-0.5 rounded-full ${c.priority === "URGENT" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}>{c.priority}</span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Assignment Notes (Optional)</Label>
                            <Textarea
                                placeholder="Add any specific instructions for the staff member..."
                                className="min-h-[80px] rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-xs font-medium resize-none"
                                value={assignNotes}
                                onChange={(e) => setAssignNotes(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <Button
                                variant="outline"
                                className="flex-1 h-11 rounded-xl border-gray-200 text-[10px] font-bold uppercase"
                                onClick={() => setIsAssignOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold uppercase gap-2 shadow-lg shadow-indigo-200"
                                onClick={handleAssignTask}
                                disabled={!assignComplaintId || updateMutation.isPending}
                            >
                                <UserCheck className="h-3.5 w-3.5" />
                                {updateMutation.isPending ? "Assigning..." : "Assign Task"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminStaffPage;
