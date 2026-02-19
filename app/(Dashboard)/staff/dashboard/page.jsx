"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { format, isToday, isPast, formatDistanceToNow } from "date-fns";
import {
    ClipboardList, CheckCircle2, AlertCircle, ChevronRight,
    MapPin, Play, CheckCircle, Clock, Zap, TrendingUp,
    Calendar, Star, ArrowRight, Flame, Target, Activity,
    User, Building2, MessageSquare, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useComplaints, useUpdateComplaint } from "@/hooks/usecomplaints";
import useAuthStore from "@/hooks/Authstate";

const priorityConfig = {
    URGENT: { color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200", dot: "bg-rose-500", label: "Urgent" },
    HIGH: { color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", dot: "bg-orange-500", label: "High" },
    MEDIUM: { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-400", label: "Medium" },
    LOW: { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500", label: "Low" },
};

const statusConfig = {
    PENDING: { color: "text-gray-600", bg: "bg-gray-100", label: "Pending", icon: Clock },
    IN_PROGRESS: { color: "text-indigo-600", bg: "bg-indigo-50", label: "In Progress", icon: Zap },
    RESOLVED: { color: "text-emerald-600", bg: "bg-emerald-50", label: "Resolved", icon: CheckCircle2 },
    REJECTED: { color: "text-rose-600", bg: "bg-rose-50", label: "Rejected", icon: AlertCircle },
};

const StaffDashboard = () => {
    const user = useAuthStore((state) => state.user);
    const { data: complaintsData, isLoading } = useComplaints(user?.id ? { assignedToId: user.id } : {});
    const complaints = complaintsData || [];
    const updateMutation = useUpdateComplaint();
    const [updatingId, setUpdatingId] = useState(null);

    const stats = useMemo(() => {
        const total = complaints.length;
        const pending = complaints.filter(c => c.status === "PENDING").length;
        const inProgress = complaints.filter(c => c.status === "IN_PROGRESS").length;
        const resolved = complaints.filter(c => c.status === "RESOLVED").length;
        const urgent = complaints.filter(c => c.priority === "URGENT" && c.status !== "RESOLVED").length;
        const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
        return { total, pending, inProgress, resolved, urgent, resolutionRate };
    }, [complaints]);

    const activeTasks = complaints.filter(c => c.status !== "RESOLVED" && c.status !== "REJECTED");
    const urgentTasks = activeTasks.filter(c => c.priority === "URGENT");
    const recentResolved = complaints.filter(c => c.status === "RESOLVED").slice(0, 3);

    const handleAction = (id, status) => {
        setUpdatingId(id);
        updateMutation.mutate({ id, status }, {
            onSettled: () => setUpdatingId(null)
        });
    };

    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    if (isLoading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 border-[3px] border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Loading Dashboard...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Hero Header */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-500">{greeting}</p>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{user?.name || "Staff Member"}</h1>
                            <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5" />
                                {format(new Date(), "EEEE, MMMM dd, yyyy")}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {stats.urgent > 0 && (
                                <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2 rounded-xl">
                                    <Flame className="h-4 w-4" />
                                    <span className="text-xs font-bold">{stats.urgent} Urgent</span>
                                </div>
                            )}
                            <Link href="/staff/complaints">
                                <Button className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold gap-2">
                                    View All Tasks <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: "Total Assigned", value: stats.total, icon: ClipboardList, color: "text-gray-700", bg: "bg-white", iconBg: "bg-gray-100" },
                        { label: "In Progress", value: stats.inProgress, icon: Zap, color: "text-indigo-600", bg: "bg-indigo-50", iconBg: "bg-indigo-100" },
                        { label: "Resolved", value: stats.resolved, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", iconBg: "bg-emerald-100" },
                        { label: "Urgent", value: stats.urgent, icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50", iconBg: "bg-rose-100" },
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

                {/* Performance + Urgent Tasks Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Performance Card */}
                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-8 -translate-x-8" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-6">
                                <Target className="h-4 w-4 text-indigo-300" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">Performance</span>
                            </div>

                            {/* Resolution Ring */}
                            <div className="flex items-center gap-6 mb-6">
                                <div className="relative h-20 w-20 flex-shrink-0">
                                    <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                                        <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                                        <circle
                                            cx="40" cy="40" r="32" fill="none"
                                            stroke="white" strokeWidth="8"
                                            strokeDasharray={`${2 * Math.PI * 32}`}
                                            strokeDashoffset={`${2 * Math.PI * 32 * (1 - stats.resolutionRate / 100)}`}
                                            strokeLinecap="round"
                                            className="transition-all duration-1000"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-lg font-bold">{stats.resolutionRate}%</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.resolved}</p>
                                    <p className="text-xs text-indigo-300 font-medium">Tasks Resolved</p>
                                    <p className="text-[10px] text-indigo-400 mt-1">out of {stats.total} total</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                                <span className="text-xs font-bold text-emerald-300">
                                    {stats.resolutionRate >= 70 ? "Excellent performance!" : stats.resolutionRate >= 40 ? "Good progress" : "Keep going!"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Urgent Tasks */}
                    <div className="lg:col-span-2 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 bg-rose-50 rounded-xl flex items-center justify-center">
                                    <Flame className="h-4 w-4 text-rose-500" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900">Urgent Tasks</h3>
                                    <p className="text-[10px] text-gray-400 font-medium">Needs immediate attention</p>
                                </div>
                            </div>
                            <Badge className="bg-rose-50 text-rose-600 border-rose-200 text-[10px] font-bold">
                                {urgentTasks.length} Active
                            </Badge>
                        </div>

                        <div className="space-y-3">
                            {urgentTasks.length === 0 ? (
                                <div className="text-center py-8">
                                    <CheckCircle2 className="h-10 w-10 text-emerald-200 mx-auto mb-2" />
                                    <p className="text-xs font-bold text-gray-400">No urgent tasks — great work!</p>
                                </div>
                            ) : (
                                urgentTasks.slice(0, 3).map(task => (
                                    <div key={task.id} className="flex items-center justify-between p-4 bg-rose-50/50 border border-rose-100 rounded-2xl gap-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="h-2 w-2 bg-rose-500 rounded-full flex-shrink-0 animate-pulse" />
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-gray-900 truncate">{task.title}</p>
                                                <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                                                    <MapPin className="h-2.5 w-2.5" /> Room {task.roomNumber || "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {task.status === "PENDING" && (
                                                <Button
                                                    size="sm"
                                                    className="h-8 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg gap-1"
                                                    onClick={() => handleAction(task.id, "IN_PROGRESS")}
                                                    disabled={updatingId === task.id}
                                                >
                                                    <Play className="h-2.5 w-2.5" /> Start
                                                </Button>
                                            )}
                                            {task.status === "IN_PROGRESS" && (
                                                <Button
                                                    size="sm"
                                                    className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg gap-1"
                                                    onClick={() => handleAction(task.id, "RESOLVED")}
                                                    disabled={updatingId === task.id}
                                                >
                                                    <CheckCircle className="h-2.5 w-2.5" /> Done
                                                </Button>
                                            )}
                                            <Link href={`/staff/complaints/${task.id}`}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-rose-100">
                                                    <ChevronRight className="h-4 w-4 text-rose-500" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Active Task List */}
                <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                                <Activity className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Active Assignments</h2>
                                <p className="text-[10px] text-gray-400 font-medium mt-0.5">{activeTasks.length} tasks pending completion</p>
                            </div>
                        </div>
                        <Link href="/staff/complaints">
                            <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 gap-1">
                                View All <ChevronRight className="h-3 w-3" />
                            </Button>
                        </Link>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {activeTasks.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="h-16 w-16 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                                </div>
                                <p className="text-sm font-bold text-gray-900">All caught up!</p>
                                <p className="text-xs text-gray-400 mt-1">No pending tasks at the moment.</p>
                            </div>
                        ) : (
                            activeTasks.slice(0, 5).map(task => {
                                const priority = priorityConfig[task.priority] || priorityConfig.MEDIUM;
                                const status = statusConfig[task.status] || statusConfig.PENDING;
                                const StatusIcon = status.icon;
                                return (
                                    <div key={task.id} className="px-8 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors group">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className={`h-10 w-10 ${priority.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                                                <ClipboardList className={`h-5 w-5 ${priority.color}`} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${status.bg} ${status.color}`}>
                                                        <StatusIcon className="h-2.5 w-2.5" /> {status.label}
                                                    </span>
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${priority.bg} ${priority.color} border ${priority.border}`}>
                                                        <span className={`h-1.5 w-1.5 rounded-full ${priority.dot}`} />
                                                        {priority.label}
                                                    </span>
                                                </div>
                                                <h3 className="text-sm font-bold text-gray-900 truncate">{task.title}</h3>
                                                <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400 font-medium">
                                                    <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> Room {task.roomNumber || "N/A"}</span>
                                                    <span className="flex items-center gap-1"><Building2 className="h-2.5 w-2.5" /> {task.Hostel?.name || "Hostel"}</span>
                                                    <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {task.status === "PENDING" && (
                                                <Button
                                                    onClick={() => handleAction(task.id, "IN_PROGRESS")}
                                                    className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-xl gap-1.5"
                                                    disabled={updatingId === task.id}
                                                >
                                                    <Play className="h-3 w-3" /> Start Task
                                                </Button>
                                            )}
                                            {task.status === "IN_PROGRESS" && (
                                                <Button
                                                    onClick={() => handleAction(task.id, "RESOLVED")}
                                                    className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-xl gap-1.5"
                                                    disabled={updatingId === task.id}
                                                >
                                                    <CheckCircle className="h-3 w-3" /> Mark Done
                                                </Button>
                                            )}
                                            <Link href={`/staff/complaints/${task.id}`}>
                                                <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-gray-200 hover:border-indigo-300 hover:bg-indigo-50">
                                                    <ChevronRight className="h-4 w-4 text-gray-500" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Recently Resolved */}
                {recentResolved.length > 0 && (
                    <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-50 flex items-center gap-3">
                            <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                                <Star className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Recently Resolved</h2>
                                <p className="text-[10px] text-gray-400 font-medium mt-0.5">Your completed work</p>
                            </div>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {recentResolved.map(task => (
                                <div key={task.id} className="px-8 py-4 flex items-center justify-between gap-4 hover:bg-gray-50/30 transition-colors">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="h-9 w-9 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-gray-700 truncate">{task.title}</p>
                                            <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                                                Resolved {formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[9px] font-bold flex-shrink-0">
                                        Completed
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StaffDashboard;
