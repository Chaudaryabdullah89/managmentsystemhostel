"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import {
    ClipboardList, Search, MapPin, AlertCircle, CheckCircle,
    ChevronRight, Play, CheckCircle2, Clock, Zap, Filter,
    Building2, Calendar, SlidersHorizontal, X, Flame,
    ArrowUpRight, Activity, Target, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useComplaints, useUpdateComplaint } from "@/hooks/usecomplaints";
import useAuthStore from "@/hooks/Authstate";

const priorityConfig = {
    URGENT: { color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100", dot: "bg-rose-500", label: "Urgent" },
    HIGH: { color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100", dot: "bg-orange-500", label: "High" },
    MEDIUM: { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", dot: "bg-blue-500", label: "Medium" },
    LOW: { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", dot: "bg-emerald-500", label: "Low" },
};

const statusConfig = {
    PENDING: { color: "text-amber-600", bg: "bg-amber-50", label: "Pending", icon: Clock },
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

const StaffComplaintsPage = () => {
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

    const filteredComplaints = useMemo(() => {
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

    const stats = useMemo(() => ({
        total: complaints.length,
        pending: complaints.filter(c => c.status === "PENDING").length,
        active: complaints.filter(c => c.status === "IN_PROGRESS").length,
        resolved: complaints.filter(c => c.status === "RESOLVED").length,
    }), [complaints]);

    if (isLoading) return (
        <div className="flex h-screen items-center justify-center bg-white font-sans">
            <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 border-2 border-gray-100 border-t-black rounded-full animate-spin" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Loading Complaints...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-white pb-20 font-sans tracking-tight selection:bg-black selection:text-white">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-40 bg-white/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Complaints</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assigned Tasks</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search..."
                                className="h-9 w-64 pl-9 rounded-2xl border-gray-100 bg-gray-50 text-[10px] font-bold uppercase tracking-widest focus:bg-white transition-all shadow-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                            {['all', 'PENDING', 'IN_PROGRESS', 'RESOLVED'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    className={`text-[8px] font-bold uppercase tracking-widest transition-all px-2 py-1 rounded-full ${statusFilter === s ? 'text-black bg-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    {s === 'all' ? 'All' : s.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Total', value: stats.total, icon: Activity, color: 'text-indigo-600', from: 'from-indigo-50' },
                        { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600', from: 'from-amber-50' },
                        { label: 'In Progress', value: stats.active, icon: Zap, color: 'text-blue-600', from: 'from-blue-50' },
                        { label: 'Resolved', value: stats.resolved, icon: ShieldCheck, color: 'text-emerald-600', from: 'from-emerald-50' },
                    ].map((stat, i) => (
                        <Card key={i} className="bg-white border-gray-100 shadow-sm rounded-3xl overflow-hidden group hover:shadow-md transition-all">
                            <div className={`h-1 px-4 bg-gradient-to-r ${stat.from} to-white`} />
                            <div className="p-5 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{stat.label}</p>
                                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-3xl font-bold text-gray-900 tracking-tighter tabular-nums">{stat.value}</p>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Complaint Stats</span>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Complaints List */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <ClipboardList className="h-5 w-5 text-gray-400" />
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">My Tasks</h3>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {filteredComplaints.length > 0 ? filteredComplaints.map((task) => {
                            const priority = priorityConfig[task.priority] || priorityConfig.MEDIUM;
                            const status = statusConfig[task.status] || statusConfig.PENDING;
                            const StatusIcon = status.icon;

                            return (
                                <div key={task.id} className="bg-white border border-gray-100 rounded-[2rem] p-6 hover:shadow-md transition-all flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm group">
                                    <div className="flex items-center gap-6 w-full md:w-auto">
                                        <div className={`h-14 w-14 rounded-2xl ${status.bg} flex items-center justify-center border border-gray-100 transition-transform group-hover:scale-110`}>
                                            <span className="text-2xl">{categoryIcons[task.category] || "📋"}</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-tight">{task.title}</h4>
                                                <Badge variant="outline" className={`${priority.bg} ${priority.color} text-[8px] font-bold uppercase px-2 py-0 border-none rounded-full`}>
                                                    {priority.label}
                                                </Badge>
                                                <Badge variant="outline" className={`${status.bg} ${status.color} text-[8px] font-bold uppercase px-2 py-0 border-none rounded-full`}>
                                                    {status.label}
                                                </Badge>
                                            </div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 flex items-center gap-3">
                                                <span>UNIT {task.roomNumber || "00"}</span>
                                                <span className="h-1 w-1 rounded-full bg-gray-200" />
                                                <span>#{task.uid || task.id.slice(-6).toUpperCase()}</span>
                                                <span className="h-1 w-1 rounded-full bg-gray-200" />
                                                <span>{format(new Date(task.createdAt), 'MMM dd, HH:mm')}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4">
                                        {task.status === 'PENDING' && (
                                            <Button
                                                size="sm"
                                                className="h-9 rounded-2xl bg-black text-white text-[9px] font-bold uppercase tracking-widest px-6 hover:bg-gray-800 transition-all shadow-sm"
                                                onClick={() => handleAction(task.id, 'IN_PROGRESS')}
                                                disabled={updatingId === task.id}
                                            >
                                                Start
                                            </Button>
                                        )}
                                        {task.status === 'IN_PROGRESS' && (
                                            <Button
                                                size="sm"
                                                className="h-9 rounded-2xl bg-indigo-600 text-white text-[9px] font-bold uppercase tracking-widest px-6 hover:bg-indigo-700 transition-all shadow-sm"
                                                onClick={() => handleAction(task.id, 'RESOLVED')}
                                                disabled={updatingId === task.id}
                                            >
                                                Resolve
                                            </Button>
                                        )}
                                        <Link href={`/staff/complaints/${task.id}`}>
                                            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-2xl border border-gray-100 text-gray-400 hover:text-black hover:bg-white transition-all">
                                                <ArrowUpRight className="h-5 w-5" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="py-24 bg-white border-2 border-dashed border-gray-100 rounded-[3rem] flex flex-col items-center justify-center text-center shadow-sm">
                                <ShieldCheck className="h-10 w-10 text-gray-200 mb-4" />
                                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">No complaints found</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StaffComplaintsPage;
