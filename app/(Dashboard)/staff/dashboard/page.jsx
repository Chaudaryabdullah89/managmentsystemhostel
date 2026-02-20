"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import {
    ClipboardList, CheckCircle2, AlertCircle, ChevronRight,
    MapPin, Play, CheckCircle, Clock, Zap, TrendingUp,
    Calendar, Star, ArrowRight, Flame, Target, Activity,
    Building2, Fingerprint, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTasks, useUpdateTask } from "@/hooks/usetasks";
import useAuthStore from "@/hooks/Authstate";
import { useAttendance } from "@/hooks/useAttendance";
import { useStaffProfile } from "@/hooks/useStaffProfile";

const priorityConfig = {
    URGENT: { color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200", dot: "bg-rose-500", label: "Urgent" },
    HIGH: { color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", dot: "bg-orange-500", label: "High" },
    MEDIUM: { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-400", label: "Medium" },
    LOW: { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500", label: "Low" },
};

const statusConfig = {
    PENDING: { color: "text-gray-600", bg: "bg-gray-100", label: "Pending", icon: Clock },
    IN_PROGRESS: { color: "text-indigo-600", bg: "bg-indigo-50", label: "In Progress", icon: Zap },
    COMPLETED: { color: "text-emerald-600", bg: "bg-emerald-50", label: "Completed", icon: CheckCircle2 },
    CANCELLED: { color: "text-rose-600", bg: "bg-rose-50", label: "Cancelled", icon: AlertCircle },
};

const StaffDashboard = () => {
    const user = useAuthStore((state) => state.user);
    const { data: tasksData, isLoading: tasksLoading } = useTasks(user?.id ? { assignedToId: user.id } : {});
    const { data: staffProfile, isLoading: profileLoading } = useStaffProfile(user?.id);
    const { activeCheckIn, punchIn, punchOut, isPunching } = useAttendance(user?.id);

    const tasks = tasksData || [];
    const updateMutation = useUpdateTask();
    const [updatingId, setUpdatingId] = useState(null);

    const activeTasks = useMemo(() =>
        tasks.filter(c => c.status !== "COMPLETED" && c.status !== "CANCELLED"),
        [tasks]);

    const stats = useMemo(() => {
        const total = tasks.length;
        const pending = tasks.filter(c => c.status === "PENDING").length;
        const inProgress = tasks.filter(c => c.status === "IN_PROGRESS").length;
        const completed = tasks.filter(c => c.status === "COMPLETED").length;
        const urgent = tasks.filter(c => c.priority === "URGENT" && c.status !== "COMPLETED").length;

        const handled = staffProfile?.totalTasksHandled || 0;
        const totalLifecycle = handled + activeTasks.length;
        const completionRate = totalLifecycle > 0
            ? Math.round((handled / totalLifecycle) * 100)
            : 0;

        return { total, pending, inProgress, completed, urgent, completionRate };
    }, [tasks, staffProfile, activeTasks]);

    const urgentTasks = activeTasks.filter(c => c.priority === "URGENT");
    const recentCompleted = tasks.filter(c => c.status === "COMPLETED").slice(0, 3);

    const handleAction = (id, status) => {
        setUpdatingId(id);
        updateMutation.mutate({ id, status }, {
            onSettled: () => setUpdatingId(null)
        });
    };

    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    if (tasksLoading || profileLoading) return (
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
                <div className="max-w-7xl mx-auto px-6 py-10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="space-y-2">
                            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-500">{greeting}</p>
                            <div className="flex items-center gap-4">
                                <h1 className="text-4xl font-bold text-gray-900 tracking-tight">{user?.name || "Staff Member"}</h1>
                                <Badge className={`${activeCheckIn ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'} px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm`}>
                                    {activeCheckIn ? 'On Duty' : 'Off Duty'}
                                </Badge>
                            </div>
                            <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(), "EEEE, MMMM dd, yyyy")}
                            </p>
                        </div>

                        {/* Attendance Punch Card */}
                        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 flex items-center gap-8 shadow-xl shadow-gray-200/50 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50 transition-all group-hover:bg-indigo-100" />
                            <div className="flex flex-col relative z-10">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                    <Clock className="h-3 w-3" /> Shift Timer
                                </p>
                                <p className="text-xl font-black text-gray-900 tabular-nums tracking-tight">
                                    {activeCheckIn ? format(new Date(activeCheckIn.checkIn), "hh:mm a") : "--- : ---"}
                                </p>
                            </div>
                            <div className="h-12 w-[1px] bg-gray-100 relative z-10" />
                            <Button
                                className={`h-12 px-10 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 flex items-center gap-3 relative z-10 ${activeCheckIn
                                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                                    }`}
                                onClick={() => activeCheckIn ? punchOut("End shift") : punchIn("Start shift")}
                                disabled={isPunching}
                            >
                                {isPunching ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <Fingerprint className="h-4 w-4" />
                                        {activeCheckIn ? 'Clock Out' : 'Clock In'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    {[
                        { label: "Tasks Handled", value: staffProfile?.totalTasksHandled || 0, icon: ClipboardList, color: "text-gray-700", bg: "bg-white", iconBg: "bg-gray-50" },
                        { label: "Direct Impact", value: stats.inProgress, icon: Zap, color: "text-indigo-600", bg: "bg-indigo-50", iconBg: "bg-indigo-100" },
                        { label: "Efficiency", value: `${stats.completionRate}%`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50", iconBg: "bg-emerald-100" },
                        { label: "Reputation", value: staffProfile?.performanceRating?.toFixed(1) || "5.0", icon: Star, color: "text-amber-600", bg: "bg-amber-50", iconBg: "bg-amber-100" },
                    ].map((stat, i) => (
                        <div key={i} className={`${stat.bg} border border-transparent hover:border-gray-200 rounded-[2rem] p-6 flex items-center justify-between shadow-sm hover:shadow-xl transition-all duration-500`}>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{stat.label}</p>
                                <p className={`text-3xl font-black ${stat.color} tracking-tighter`}>{stat.value}</p>
                            </div>
                            <div className={`h-14 w-14 ${stat.iconBg} rounded-[1.5rem] flex items-center justify-center shadow-inner`}>
                                <stat.icon className={`h-7 w-7 ${stat.color}`} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Performance Profile */}
                    <div className="bg-[#0a0c12] rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group/perf">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none group-hover/perf:bg-indigo-500/20 transition-all duration-1000" />

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-2.5">
                                    <Target className="h-4 w-4 text-indigo-400" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-400">Elite Performance</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-white/5 p-2 rounded-full border border-white/5">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <Star key={s} className={`h-3 w-3 ${s <= (staffProfile?.performanceRating || 5) ? 'text-amber-400 fill-amber-400' : 'text-white/10'}`} />
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 space-y-8">
                                <div className="space-y-4">
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-5xl font-black text-white tracking-tighter mb-1">{staffProfile?.totalTasksHandled || 0}</p>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Total Lifecycle Units</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-emerald-400 mb-1">{stats.completionRate}%</p>
                                            <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Efficiency index</p>
                                        </div>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden p-0.5">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-indigo-600 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-1000"
                                            style={{ width: `${Math.min(((staffProfile?.totalTasksHandled || 0) / 50) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/5">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Active Focus</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xl font-bold text-white">{activeTasks.length}</span>
                                            <span className="text-[10px] text-gray-600 font-bold uppercase">Nodes</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Urgency</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className={`text-xl font-bold ${urgentTasks.length > 0 ? 'text-rose-500' : 'text-indigo-400'}`}>{urgentTasks.length}</span>
                                            <span className="text-[10px] text-gray-600 font-bold uppercase">Critical</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 flex items-center gap-3 bg-indigo-500/10 p-4 rounded-2xl border border-indigo-500/20">
                                <Activity className="h-4 w-4 text-indigo-400" />
                                <p className="text-xs font-medium text-indigo-200">
                                    {stats.completionRate >= 80 ? "Peak operational efficiency achieved." : "Continuing systematic task resolution."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Urgent Tasks Panel */}
                    <div className="lg:col-span-2 bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-rose-50 rounded-2xl flex items-center justify-center">
                                    <Flame className="h-6 w-6 text-rose-500" />
                                </div>
                                <div className="space-y-0.5">
                                    <h3 className="text-lg font-bold text-gray-900 tracking-tight">Priority Intercepts</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">Critical updates required</p>
                                </div>
                            </div>
                            <div className="px-5 py-2 bg-rose-50 border border-rose-100 rounded-full">
                                <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">
                                    {urgentTasks.length} Active Node{urgentTasks.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {urgentTasks.length === 0 ? (
                                <div className="text-center py-20 bg-gray-50/30 border border-dashed border-gray-100 rounded-3xl">
                                    <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                        <CheckCircle2 className="h-8 w-8 text-emerald-300" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">Clean Protocol</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1.5">No immediate intercepts required</p>
                                </div>
                            ) : (
                                urgentTasks.slice(0, 4).map(task => (
                                    <div key={task.id} className="group flex items-center justify-between p-5 bg-white border border-gray-100 rounded-3xl hover:border-rose-200 hover:shadow-xl hover:shadow-rose-500/5 transition-all duration-300">
                                        <div className="flex items-center gap-5 min-w-0">
                                            <div className="h-3 w-3 bg-rose-500 rounded-full flex-shrink-0 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.5)]" />
                                            <div className="min-w-0 space-y-1">
                                                <p className="text-sm font-bold text-gray-900 truncate uppercase tracking-tight">{task.title}</p>
                                                <div className="flex items-center gap-3">
                                                    <span className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded-md">
                                                        <Building2 className="h-3 w-3" /> {task.category}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded-md">
                                                        <MapPin className="h-3 w-3" /> Room {task.roomNumber || "00"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            {task.status === "PENDING" ? (
                                                <Button
                                                    className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-xl gap-2 shadow-lg shadow-indigo-100"
                                                    onClick={() => handleAction(task.id, "IN_PROGRESS")}
                                                    disabled={updatingId === task.id}
                                                >
                                                    <Play className="h-3 w-3" /> Initialize
                                                </Button>
                                            ) : (
                                                <Button
                                                    className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-xl gap-2 shadow-lg shadow-emerald-100"
                                                    onClick={() => handleAction(task.id, "COMPLETED")}
                                                    disabled={updatingId === task.id}
                                                >
                                                    <CheckCircle className="h-3.5 w-3.5" /> Finalize
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Active Task Ledger */}
                <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden">
                    <div className="px-10 py-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                        <div className="flex items-center gap-5">
                            <div className="h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                                <Activity className="h-6 w-6 text-white" />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Active Task Ledger</h2>
                                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">{activeTasks.length} nodes awaiting processing</p>
                            </div>
                        </div>
                        <Link href="/staff/tasks">
                            <Button variant="outline" className="h-10 px-6 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] border-gray-200 hover:bg-gray-50 gap-2">
                                Audit Central <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                        </Link>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {activeTasks.length === 0 ? (
                            <div className="text-center py-24">
                                <div className="h-20 w-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                                </div>
                                <p className="text-base font-bold text-gray-900 uppercase tracking-tight">System Status: Optimal</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] mt-2">All tasks have been successfully processed</p>
                            </div>
                        ) : (
                            activeTasks.slice(0, 6).map(task => {
                                const priority = priorityConfig[task.priority] || priorityConfig.MEDIUM;
                                const status = statusConfig[task.status] || statusConfig.PENDING;
                                const StatusIcon = status.icon;
                                return (
                                    <div key={task.id} className="px-10 py-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-gray-50/50 transition-all group">
                                        <div className="flex items-center gap-6 min-w-0 flex-1">
                                            <div className={`h-12 w-12 ${priority.bg} rounded-2xl flex items-center justify-center flex-shrink-0 border ${priority.border}`}>
                                                <ClipboardList className={`h-6 w-6 ${priority.color}`} />
                                            </div>
                                            <div className="min-w-0 space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${status.bg} ${status.color} border border-transparent`}>
                                                        <StatusIcon className="h-2.5 w-2.5" /> {status.label}
                                                    </span>
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${priority.bg} ${priority.color} border ${priority.border}`}>
                                                        <span className={`h-1.5 w-1.5 rounded-full ${priority.dot}`} />
                                                        {priority.label}
                                                    </span>
                                                </div>
                                                <h3 className="text-base font-bold text-gray-900 truncate uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{task.title}</h3>
                                                <div className="flex items-center gap-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                    <span className="flex items-center gap-1.5"><Building2 className="h-3 w-3" /> {task.Hostel?.name || "Network"}</span>
                                                    <div className="h-1 w-1 rounded-full bg-gray-200" />
                                                    <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {task.status === "PENDING" ? (
                                                <Button
                                                    onClick={() => handleAction(task.id, "IN_PROGRESS")}
                                                    className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-2xl gap-2 shadow-lg shadow-indigo-100"
                                                    disabled={updatingId === task.id}
                                                >
                                                    <Play className="h-3.5 w-3.5" /> Process
                                                </Button>
                                            ) : (
                                                <Button
                                                    onClick={() => handleAction(task.id, "COMPLETED")}
                                                    className="h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-2xl gap-2 shadow-lg shadow-emerald-100"
                                                    disabled={updatingId === task.id}
                                                >
                                                    <CheckCircle className="h-3.5 w-3.5" /> Resolve
                                                </Button>
                                            )}
                                            <Link href={`/staff/tasks`}>
                                                <Button variant="outline" size="icon" className="h-11 w-11 rounded-2xl border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all">
                                                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-600" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StaffDashboard;
