"use client"
import React, { useState } from "react";
import {
    ChevronRight,
    Search,
    AlertTriangle,
    CheckCircle,
    Clock,
    XCircle,
    User,
    Building2,
    ClipboardList,
    Download,
    Filter,
    Plus,
    BarChart3,
    ShieldCheck,
    ArrowUpRight,
    Zap,
    Info,
    Calendar,
    Hash,
    MessageSquare,
    Send
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTasks, useUpdateTask, useCreateTask, useAddTaskComment } from "@/hooks/usetasks";
import { useHostel } from "@/hooks/usehostel";
import { useStaffList } from "@/hooks/useSalaries";
import { format } from "date-fns";
import { toast } from "sonner";
import useAuthStore from "@/hooks/Authstate";

const TasksPage = () => {
    const user = useAuthStore((state) => state.user);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterPriority, setFilterPriority] = useState("all");
    const [selectedTask, setSelectedTask] = useState(null);
    const [newComment, setNewComment] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Create Task State
    const [newTaskData, setNewTaskData] = useState({
        title: "",
        description: "",
        priority: "MEDIUM",
        category: "GENERAL",
        assignedToId: "",
        dueDate: ""
    });

    const { data: tasks, isLoading: isTasksLoading } = useTasks({
        hostelId: user?.hostelId
    });

    const { data: statsData } = useTasks({ stats: "true", hostelId: user?.hostelId });
    const { data: staffData } = useStaffList(user?.hostelId);

    const updateMutation = useUpdateTask();
    const createMutation = useCreateTask();
    const addCommentMutation = useAddTaskComment();

    const stats = statsData || { total: 0, pending: 0, inProgress: 0, completed: 0, urgent: 0, completionRate: 0 };
    const staffMembers = staffData || [];

    const getStatusTheme = (status) => {
        switch (status) {
            case "COMPLETED": return "bg-emerald-50 text-emerald-700 border-emerald-100";
            case "CANCELLED": return "bg-rose-50 text-rose-700 border-rose-100";
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

    const handleCreateTask = () => {
        if (!newTaskData.title || !newTaskData.category) {
            toast.error("Please fill in title and category");
            return;
        }

        createMutation.mutate({
            ...newTaskData,
            hostelId: user?.hostelId,
            createdById: user?.id
        }, {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                setNewTaskData({
                    title: "",
                    description: "",
                    priority: "MEDIUM",
                    category: "GENERAL",
                    assignedToId: "",
                    dueDate: ""
                });
            }
        });
    };

    const handleUpdateStatus = (id, status) => {
        updateMutation.mutate({ id, status });
    };

    const handleSendComment = (taskId) => {
        if (!newComment.trim()) return;
        addCommentMutation.mutate({
            taskId,
            userId: user?.id,
            message: newComment
        }, {
            onSuccess: () => {
                setNewComment("");
            }
        });
    };

    const filteredTasks = (tasks || []).filter(task => {
        const matchesSearch =
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.assignedTo?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.uid?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = filterStatus === "all" || task.status === filterStatus;
        const matchesPriority = filterPriority === "all" || task.priority === filterPriority;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    if (isTasksLoading) return (
        <div className="flex h-screen items-center justify-center bg-white font-sans">
            <div className="flex flex-col items-center gap-6">
                <div className="h-10 w-10 border-[3px] border-gray-100 border-t-black rounded-full animate-spin" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 italic">Accessing Task Registry...</p>
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
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight uppercase">Operational Tasks</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Staff Management Node</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Active Sync</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative group mr-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-black transition-colors" />
                            <Input
                                placeholder="Search tasks or staff..."
                                className="h-9 w-[280px] pl-9 rounded-xl border-gray-100 bg-gray-50/50 font-bold text-[10px] uppercase tracking-wider text-gray-600 shadow-sm transition-all focus:bg-white focus:ring-0"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    className="h-9 px-6 rounded-xl bg-black hover:bg-gray-800 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all active:scale-95"
                                >
                                    <Plus className="h-3.5 w-3.5 mr-2" /> New Task
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md p-0 overflow-hidden border-none rounded-3xl shadow-2xl">
                                <div className="bg-white">
                                    <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-black flex items-center justify-center text-white shadow-lg shadow-black/10">
                                                <ClipboardList className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight italic">Provision Task</h3>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">Operational Directive Node</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-8 space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 italic px-1">Task Title</Label>
                                            <Input
                                                placeholder="Enter imperative title..."
                                                className="h-11 rounded-xl border-gray-100 font-bold text-xs shadow-sm focus:ring-0"
                                                value={newTaskData.title}
                                                onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 italic px-1">Description (Optional)</Label>
                                            <Textarea
                                                placeholder="Technical context and specifics..."
                                                className="min-h-[100px] rounded-xl border-gray-100 font-medium text-xs shadow-sm focus:ring-0 pt-3"
                                                value={newTaskData.description}
                                                onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 italic px-1">Priority</Label>
                                                <Select value={newTaskData.priority} onValueChange={(v) => setNewTaskData({ ...newTaskData, priority: v })}>
                                                    <SelectTrigger className="h-11 rounded-xl border-gray-100 bg-white font-bold text-[10px] uppercase tracking-widest text-gray-600 shadow-sm focus:ring-0">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                                                        <SelectItem value="LOW" className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Low Nominal</SelectItem>
                                                        <SelectItem value="MEDIUM" className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Medium Scale</SelectItem>
                                                        <SelectItem value="HIGH" className="text-[10px] font-bold uppercase tracking-widest text-rose-600">High Magnitude</SelectItem>
                                                        <SelectItem value="URGENT" className="text-[10px] font-bold uppercase tracking-widest text-white bg-rose-500 rounded-md">Urgent Focus</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 italic px-1">Category</Label>
                                                <Select value={newTaskData.category} onValueChange={(v) => setNewTaskData({ ...newTaskData, category: v })}>
                                                    <SelectTrigger className="h-11 rounded-xl border-gray-100 bg-white font-bold text-[10px] uppercase tracking-widest text-gray-600 shadow-sm focus:ring-0">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                                                        <SelectItem value="GENERAL" className="text-[10px] font-bold uppercase tracking-widest">General Ops</SelectItem>
                                                        <SelectItem value="CLEANING" className="text-[10px] font-bold uppercase tracking-widest">Cleaning</SelectItem>
                                                        <SelectItem value="MAINTENANCE" className="text-[10px] font-bold uppercase tracking-widest">Maintenance</SelectItem>
                                                        <SelectItem value="SECURITY" className="text-[10px] font-bold uppercase tracking-widest">Security</SelectItem>
                                                        <SelectItem value="MESS" className="text-[10px] font-bold uppercase tracking-widest">Mess/Kitchen</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 italic px-1">Assign Tech Node (Staff)</Label>
                                            <Select value={newTaskData.assignedToId} onValueChange={(v) => setNewTaskData({ ...newTaskData, assignedToId: v })}>
                                                <SelectTrigger className="h-11 rounded-xl border-gray-100 bg-white font-bold text-[10px] uppercase tracking-widest text-gray-600 shadow-sm focus:ring-0">
                                                    <SelectValue placeholder="ASSIGN STAFF UNIT" />
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
                                            <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 italic px-1">Due Date</Label>
                                            <Input
                                                type="datetime-local"
                                                className="h-11 rounded-xl border-gray-100 font-bold text-xs shadow-sm focus:ring-0 uppercase"
                                                value={newTaskData.dueDate}
                                                onChange={(e) => setNewTaskData({ ...newTaskData, dueDate: e.target.value })}
                                            />
                                        </div>
                                        <Button
                                            className="w-full h-12 rounded-2xl bg-black hover:bg-gray-800 text-white font-bold text-[11px] uppercase tracking-widest shadow-xl transition-all active:scale-95 mt-4"
                                            onClick={handleCreateTask}
                                            disabled={createMutation.isPending}
                                        >
                                            {createMutation.isPending ? "Syncing..." : "Initialize Task Lifecycle"}
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
                {/* Metrics Matrix */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Taskload', value: stats.total, sub: 'Inventory Depth', icon: ClipboardList, color: 'text-gray-900', bg: 'bg-white' },
                        { label: 'Pending Units', value: stats.pending, sub: 'In Queue', icon: Clock, color: 'text-rose-500', bg: 'bg-rose-50/50' },
                        { label: 'Priority Escalations', value: stats.urgent, sub: 'Urgent Focal', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50/50' },
                        { label: 'Completion Efficiency', value: `${stats.completionRate}%`, sub: 'Resolution Index', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50/50' }
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
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Registry Filters</span>
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
                                <SelectItem value="COMPLETED" className="text-[9px] font-bold uppercase tracking-widest">Completed</SelectItem>
                                <SelectItem value="CANCELLED" className="text-[9px] font-bold uppercase tracking-widest">Cancelled</SelectItem>
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

                        {(filterStatus !== 'all' || filterPriority !== 'all' || searchQuery) && (
                            <Button
                                variant="ghost"
                                className="h-8 px-3 rounded-lg text-[9px] font-bold uppercase tracking-widest text-rose-500 hover:bg-rose-50"
                                onClick={() => {
                                    setFilterStatus('all');
                                    setFilterPriority('all');
                                    setSearchQuery('');
                                }}
                            >
                                <Zap className="h-3 w-3 mr-2" /> Clear Matrix
                            </Button>
                        )}
                    </div>
                </div>

                {/* Task Registry Card */}
                <Card className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-black flex items-center justify-center text-white shadow-lg shadow-black/10">
                                <ClipboardList className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight italic">Operational Ledger</h3>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">Lifecycle Audit & Directive Tracking</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-0 overflow-x-auto">
                        <table className="w-full text-left min-w-[1200px]">
                            <thead>
                                <tr className="bg-gray-50/70 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 border-b">
                                    <th className="px-8 py-5 italic">Directive & UID</th>
                                    <th className="px-8 py-5">Assigned Target</th>
                                    <th className="px-8 py-5">Operational Context</th>
                                    <th className="px-8 py-5">Priority Magnitude</th>
                                    <th className="px-8 py-5">Lifecycle Node</th>
                                    <th className="px-8 py-5 text-right">Lifecycle Management</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredTasks.map((task) => (
                                    <tr key={task.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-bold text-gray-900 uppercase tracking-tight italic line-clamp-1">{task.title}</span>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className="text-[8px] font-mono font-bold text-black bg-gray-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                        {task.uid || `TSK-${task.id.slice(-6).toUpperCase()}`}
                                                    </span>
                                                    {task.dueDate && (
                                                        <span className={`text-[8px] font-black uppercase tracking-widest flex items-center gap-1 ${new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED' ? 'text-rose-500' : 'text-gray-400'}`}>
                                                            <Clock className="h-2 w-2" /> {format(new Date(task.dueDate), 'MMM dd')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-7 w-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
                                                    <User className="h-3.5 w-3.5 text-gray-400" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-bold text-gray-900 uppercase tracking-tight italic">{task.assignedTo?.name || 'UNASSIGNED'}</span>
                                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mt-0.5">{task.assignedTo?.role || 'IDLE UNIT'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tight italic">{task.category} MODULE</span>
                                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mt-0.5 italic">{task.hostel?.name} PROPERTY</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <Badge variant="outline" className={`${getPriorityTheme(task.priority)} px-3 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border shadow-sm`}>
                                                {task.priority}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-6">
                                            <Badge variant="outline" className={`${getStatusTheme(task.status)} px-3 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border shadow-sm`}>
                                                {task.status?.replace('_', ' ')}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-black hover:text-white transition-all" onClick={() => setSelectedTask(task)}>
                                                        <ArrowUpRight className="h-4 w-4" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-2xl p-0 overflow-hidden border-none rounded-[2rem] shadow-2xl">
                                                    <div className="bg-white">
                                                        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-10 w-10 rounded-xl bg-black flex items-center justify-center text-white shadow-lg shadow-black/10">
                                                                    <BarChart3 className="h-5 w-5" />
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight italic">Lifecycle Audit</h3>
                                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">{task.uid} Directive Hub</p>
                                                                </div>
                                                            </div>
                                                            <Badge className={`${getStatusTheme(task.status)} px-4 py-1.5`}>{task.status}</Badge>
                                                        </div>

                                                        <div className="p-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
                                                            {/* Left Content */}
                                                            <div className="lg:col-span-3 space-y-6">
                                                                <div className="space-y-4">
                                                                    <div className="p-6 bg-gray-50 rounded-[1.5rem] border border-gray-100 space-y-3">
                                                                        <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest italic">{task.title}</h4>
                                                                        <p className="text-xs text-gray-500 font-medium leading-relaxed italic">"{task.description || 'No descriptive metadata provided.'}"</p>
                                                                    </div>

                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        <div className="p-4 bg-white border border-gray-100 rounded-2xl flex flex-col gap-1">
                                                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Initialization</span>
                                                                            <span className="text-[10px] font-bold text-gray-900 uppercase italic">{format(new Date(task.createdAt), 'MMM dd, HH:mm')}</span>
                                                                        </div>
                                                                        <div className="p-4 bg-white border border-gray-100 rounded-2xl flex flex-col gap-1">
                                                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Target Threshold</span>
                                                                            <span className="text-[10px] font-bold text-gray-900 uppercase italic">{task.dueDate ? format(new Date(task.dueDate), 'MMM dd, HH:mm') : 'NO LIMIT'}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Task Lifecycle Actions */}
                                                                <div className="space-y-3">
                                                                    <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 italic px-1">Operational Directives</Label>
                                                                    <div className="grid grid-cols-2 gap-3">
                                                                        <Button
                                                                            variant="outline"
                                                                            className="h-11 rounded-xl font-bold text-[9px] uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 border-emerald-100 flex items-center gap-2"
                                                                            onClick={() => handleUpdateStatus(task.id, 'COMPLETED')}
                                                                            disabled={updateMutation.isPending || task.status === 'COMPLETED'}
                                                                        >
                                                                            <CheckCircle className="h-4 w-4" /> Finalize Lifecycle
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline"
                                                                            className="h-11 rounded-xl font-bold text-[9px] uppercase tracking-widest text-amber-600 hover:bg-amber-50 border-amber-100 flex items-center gap-2"
                                                                            onClick={() => handleUpdateStatus(task.id, 'IN_PROGRESS')}
                                                                            disabled={updateMutation.isPending || task.status === 'IN_PROGRESS'}
                                                                        >
                                                                            <Zap className="h-4 w-4" /> Deploy Operations
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline"
                                                                            className="h-11 rounded-xl font-bold text-[9px] uppercase tracking-widest text-rose-500 hover:bg-rose-50 border-rose-100 flex items-center gap-2 col-span-2"
                                                                            onClick={() => handleUpdateStatus(task.id, 'CANCELLED')}
                                                                            disabled={updateMutation.isPending || task.status === 'CANCELLED'}
                                                                        >
                                                                            <XCircle className="h-4 w-4" /> Terminate Directive
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Right Content: Comments/Audit Trail */}
                                                            <div className="lg:col-span-2 border-l border-gray-100 pl-8 space-y-6">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest italic">Sync Activity</h4>
                                                                    <Badge variant="secondary" className="text-[8px] font-black bg-gray-100">{task.comments?.length || 0}</Badge>
                                                                </div>

                                                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                                                    {task.comments?.map((comment) => (
                                                                        <div key={comment.id} className="flex flex-col gap-1.5 p-3 rounded-2xl bg-gray-50/50 border border-gray-100">
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="text-[9px] font-black text-gray-900 uppercase tracking-tight">{comment.User.name}</span>
                                                                                <span className="text-[8px] text-gray-400">{format(new Date(comment.createdAt), 'HH:mm')}</span>
                                                                            </div>
                                                                            <p className="text-[11px] text-gray-600 font-medium leading-relaxed italic">{comment.message}</p>
                                                                        </div>
                                                                    ))}
                                                                    {(!task.comments || task.comments.length === 0) && (
                                                                        <div className="py-8 text-center space-y-2 opacity-30">
                                                                            <MessageSquare className="h-6 w-6 mx-auto text-gray-400" />
                                                                            <p className="text-[9px] font-black uppercase tracking-widest">No Active Sync Activity</p>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="relative mt-auto">
                                                                    <Textarea
                                                                        placeholder="Broadcast update..."
                                                                        className="min-h-[80px] rounded-2xl border-gray-100 bg-gray-50/50 font-medium text-[11px] shadow-sm focus:ring-0 focus:bg-white transition-all pt-3 pb-10"
                                                                        value={newComment}
                                                                        onChange={(e) => setNewComment(e.target.value)}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                                                e.preventDefault();
                                                                                handleSendComment(task.id);
                                                                            }
                                                                        }}
                                                                    />
                                                                    <Button
                                                                        size="icon"
                                                                        className="absolute right-2 bottom-2 h-7 w-7 rounded-lg bg-black hover:bg-gray-800 transition-all active:scale-90"
                                                                        onClick={() => handleSendComment(task.id)}
                                                                        disabled={addCommentMutation.isPending || !newComment.trim()}
                                                                    >
                                                                        <Send className="h-3 w-3 text-white" />
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
                                {filteredTasks.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center">
                                                    <Info className="h-6 w-6 text-gray-200" />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-bold text-gray-900 uppercase">Operational Registry Node Empty</p>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">No operative directvies match your current matrix focus</p>
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

export default TasksPage;
