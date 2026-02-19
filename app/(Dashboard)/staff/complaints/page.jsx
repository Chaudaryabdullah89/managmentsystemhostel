"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import {
    ClipboardList, Search, MapPin, AlertCircle, CheckCircle,
    ChevronRight, Play, CheckCircle2, Clock, Zap, Filter,
    Building2, Calendar, SlidersHorizontal, X, Flame
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useComplaints, useUpdateComplaint } from "@/hooks/usecomplaints";
import useAuthStore from "@/hooks/Authstate";

const priorityConfig = {
    URGENT: { color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200", dot: "bg-rose-500", label: "Urgent", ring: "ring-rose-200" },
    HIGH: { color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", dot: "bg-orange-500", label: "High", ring: "ring-orange-200" },
    MEDIUM: { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-400", label: "Medium", ring: "ring-amber-200" },
    LOW: { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500", label: "Low", ring: "ring-emerald-200" },
};

const statusConfig = {
    PENDING: { color: "text-gray-600", bg: "bg-gray-100", label: "Pending", icon: Clock },
    IN_PROGRESS: { color: "text-indigo-600", bg: "bg-indigo-50", label: "In Progress", icon: Zap },
    RESOLVED: { color: "text-emerald-600", bg: "bg-emerald-50", label: "Resolved", icon: CheckCircle2 },
    REJECTED: { color: "text-rose-600", bg: "bg-rose-50", label: "Rejected", icon: AlertCircle },
};

const categoryIcons = {
    MAINTENANCE: "🔧",
    CLEANLINESS: "🧹",
    NOISE: "🔊",
    SECURITY: "🔒",
    INTERNET: "📶",
    OTHER: "📋",
};

const StaffTasksPage = () => {
    const user = useAuthStore((state) => state.user);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [updatingId, setUpdatingId] = useState(null);

    const { data: complaintsData, isLoading } = useComplaints(user?.id ? { assignedToId: user.id } : {});
    const complaints = complaintsData || [];
    const updateMutation = useUpdateComplaint();

    const handleAction = (id, status) => {
        setUpdatingId(id);
        updateMutation.mutate({ id, status }, {
            onSettled: () => setUpdatingId(null)
        });
    };

    const filteredTasks = useMemo(() => {
        return complaints.filter(task => {
            const matchesSearch =
                task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (task.uid && task.uid.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (task.roomNumber && task.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesStatus = statusFilter === "all" || task.status === statusFilter;
            const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
            return matchesSearch && matchesStatus && matchesPriority;
        });
    }, [complaints, searchQuery, statusFilter, priorityFilter]);

    const counts = useMemo(() => ({
        all: complaints.length,
        PENDING: complaints.filter(c => c.status === "PENDING").length,
        IN_PROGRESS: complaints.filter(c => c.status === "IN_PROGRESS").length,
        RESOLVED: complaints.filter(c => c.status === "RESOLVED").length,
    }), [complaints]);

    const hasFilters = searchQuery || statusFilter !== "all" || priorityFilter !== "all";

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Sticky Header */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-1.5 bg-indigo-600 rounded-full" />
                        <div>
                            <h1 className="text-sm font-bold text-gray-900 uppercase tracking-tight">My Tasks</h1>
                            <p className="text-[10px] text-gray-400 font-medium">{counts.all} total assignments</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <Input
                                placeholder="Search tasks..."
                                className="h-9 pl-9 w-[220px] rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-xs font-medium"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        {hasFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 px-3 text-rose-500 hover:bg-rose-50 rounded-xl text-[10px] font-bold gap-1"
                                onClick={() => { setSearchQuery(""); setStatusFilter("all"); setPriorityFilter("all"); }}
                            >
                                <X className="h-3 w-3" /> Clear
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

                {/* Status Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {[
                        { key: "all", label: "All Tasks", count: counts.all },
                        { key: "PENDING", label: "Pending", count: counts.PENDING },
                        { key: "IN_PROGRESS", label: "In Progress", count: counts.IN_PROGRESS },
                        { key: "RESOLVED", label: "Resolved", count: counts.RESOLVED },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setStatusFilter(tab.key)}
                            className={`flex items-center gap-2 h-10 px-5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${statusFilter === tab.key
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                                : "bg-white text-gray-500 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                                }`}
                        >
                            {tab.label}
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${statusFilter === tab.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}

                    <div className="ml-auto flex items-center gap-2">
                        <SlidersHorizontal className="h-3.5 w-3.5 text-gray-400" />
                        {["all", "URGENT", "HIGH", "MEDIUM", "LOW"].map(p => (
                            <button
                                key={p}
                                onClick={() => setPriorityFilter(p)}
                                className={`h-8 px-3 rounded-lg text-[9px] font-bold uppercase whitespace-nowrap transition-all ${priorityFilter === p
                                    ? "bg-gray-900 text-white"
                                    : "bg-white text-gray-400 border border-gray-200 hover:border-gray-400"
                                    }`}
                            >
                                {p === "all" ? "All Priority" : p}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Task Cards */}
                {isLoading ? (
                    <div className="grid grid-cols-1 gap-4">
                        {Array(4).fill(0).map((_, i) => (
                            <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-3xl" />
                        ))}
                    </div>
                ) : filteredTasks.length === 0 ? (
                    <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-3xl">
                        <ClipboardList className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-sm font-bold text-gray-400">No tasks found</p>
                        <p className="text-xs text-gray-300 mt-1">
                            {hasFilters ? "Try adjusting your filters" : "You have no assigned tasks yet"}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredTasks.map(task => {
                            const priority = priorityConfig[task.priority] || priorityConfig.MEDIUM;
                            const status = statusConfig[task.status] || statusConfig.PENDING;
                            const StatusIcon = status.icon;
                            const isUrgent = task.priority === "URGENT";

                            return (
                                <div
                                    key={task.id}
                                    className={`bg-white border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group ${isUrgent ? "border-rose-200 ring-1 ring-rose-100" : "border-gray-100"}`}
                                >
                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                                        {/* Left: Info */}
                                        <div className="flex items-start gap-4 min-w-0 flex-1">
                                            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl ${priority.bg}`}>
                                                {categoryIcons[task.category] || "📋"}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase border ${priority.bg} ${priority.color} ${priority.border}`}>
                                                        <span className={`h-1.5 w-1.5 rounded-full ${priority.dot} ${isUrgent ? "animate-pulse" : ""}`} />
                                                        {priority.label}
                                                    </span>
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase ${status.bg} ${status.color}`}>
                                                        <StatusIcon className="h-2.5 w-2.5" /> {status.label}
                                                    </span>
                                                    {task.uid && (
                                                        <span className="text-[9px] font-mono font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                                                            {task.uid}
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="text-base font-bold text-gray-900 leading-tight mb-2">{task.title}</h3>
                                                <p className="text-xs text-gray-500 font-medium line-clamp-1 mb-3">{task.description}</p>
                                                <div className="flex flex-wrap items-center gap-4 text-[10px] text-gray-400 font-medium">
                                                    <span className="flex items-center gap-1.5">
                                                        <MapPin className="h-3 w-3" /> Room {task.roomNumber || "N/A"}
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Building2 className="h-3 w-3" /> {task.Hostel?.name || "Hostel"}
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Calendar className="h-3 w-3" /> {format(new Date(task.createdAt), "MMM dd, yyyy")}
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="h-3 w-3" /> {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Actions */}
                                        <div className="flex items-center gap-2 flex-shrink-0 w-full md:w-auto">
                                            {task.status === "PENDING" && (
                                                <Button
                                                    onClick={() => handleAction(task.id, "IN_PROGRESS")}
                                                    className="flex-1 md:flex-none h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-xl gap-2"
                                                    disabled={updatingId === task.id}
                                                >
                                                    <Play className="h-3 w-3" />
                                                    {updatingId === task.id ? "Starting..." : "Start Task"}
                                                </Button>
                                            )}
                                            {task.status === "IN_PROGRESS" && (
                                                <Button
                                                    onClick={() => handleAction(task.id, "RESOLVED")}
                                                    className="flex-1 md:flex-none h-10 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-xl gap-2"
                                                    disabled={updatingId === task.id}
                                                >
                                                    <CheckCircle className="h-3 w-3" />
                                                    {updatingId === task.id ? "Completing..." : "Mark Done"}
                                                </Button>
                                            )}
                                            {task.status === "RESOLVED" && (
                                                <div className="flex-1 md:flex-none h-10 px-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center gap-2">
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                                    <span className="text-[10px] font-bold text-emerald-600">Completed</span>
                                                </div>
                                            )}
                                            <Link href={`/staff/complaints/${task.id}`}>
                                                <Button
                                                    variant="outline"
                                                    className="h-10 px-4 rounded-xl border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-[10px] font-bold gap-1.5 text-gray-600 hover:text-indigo-600"
                                                >
                                                    Details <ChevronRight className="h-3.5 w-3.5" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StaffTasksPage;
