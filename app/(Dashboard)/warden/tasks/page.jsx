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
import Loader from "@/components/ui/Loader";

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

    if (isTasksLoading) return <Loader label="Loading" subLabel="Getting records..." fullScreen={false} />;

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight leading-relaxed">
            {/* Minimal Premium Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-full flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                        <div className="h-8 w-1 bg-black rounded-full shrink-0" />
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-sm md:text-lg font-bold text-gray-900 tracking-tight uppercase truncate">Tasks</h1>
                            <div className="flex items-center gap-1.5 md:gap-2">
                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-gray-400 truncate">Operations</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500 shrink-0 hidden sm:block" />
                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-emerald-600 truncate hidden xs:block">Online</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 shrink-0">
                        <div className="relative group hidden lg:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-black transition-colors" />
                            <Input
                                placeholder="Search..."
                                className="h-9 w-[280px] pl-9 rounded-xl border-gray-100 bg-gray-50/50 font-bold text-[10px] uppercase tracking-wider text-gray-600 shadow-sm transition-all focus:bg-white focus:ring-0"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    className="h-9 px-4 md:px-6 rounded-xl bg-black hover:bg-gray-800 text-white font-bold text-[9px] md:text-[10px] uppercase tracking-wider shadow-sm transition-all active:scale-95 shrink-0"
                                >
                                    <Plus className="h-3.5 w-3.5 md:mr-2" />
                                    <span className="hidden sm:inline">New Task</span>
                                    <span className="sm:hidden">Task</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="w-[95%] max-w-md p-0 overflow-hidden border-none rounded-[2rem] md:rounded-[2.5rem] shadow-2xl bg-white mx-auto">
                                <div className="bg-white">
                                    <div className="p-6 md:p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-black flex items-center justify-center text-white shadow-lg shadow-black/10 shrink-0">
                                                <ClipboardList className="h-5 w-5 md:h-6 md:w-6" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-base md:text-lg font-bold text-gray-900 uppercase tracking-tight italic truncate">New Task</h3>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic truncate">Add a task.</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6 md:p-8 space-y-4 md:space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 italic px-1">Title</Label>
                                            <Input
                                                placeholder="Task title..."
                                                className="h-11 md:h-12 rounded-xl border-gray-100 font-bold text-xs shadow-sm focus:ring-0"
                                                value={newTaskData.title}
                                                onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 italic px-1">Description (Optional)</Label>
                                            <Textarea
                                                placeholder="Write a note..."
                                                className="min-h-[80px] md:min-h-[100px] rounded-xl border-gray-100 font-medium text-xs shadow-sm focus:ring-0 pt-3"
                                                value={newTaskData.description}
                                                onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 italic px-1">Priority</Label>
                                                <Select value={newTaskData.priority} onValueChange={(v) => setNewTaskData({ ...newTaskData, priority: v })}>
                                                    <SelectTrigger className="h-11 md:h-12 rounded-xl border-gray-100 bg-white font-bold text-[10px] uppercase tracking-widest text-gray-600 shadow-sm focus:ring-0">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                                                        <SelectItem value="LOW" className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Low Priority</SelectItem>
                                                        <SelectItem value="MEDIUM" className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Medium Priority</SelectItem>
                                                        <SelectItem value="HIGH" className="text-[10px] font-bold uppercase tracking-widest text-rose-600">High Priority</SelectItem>
                                                        <SelectItem value="URGENT" className="text-[10px] font-bold uppercase tracking-widest text-white bg-rose-500 rounded-md">Urgent Priority</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 italic px-1">Category</Label>
                                                <Select value={newTaskData.category} onValueChange={(v) => setNewTaskData({ ...newTaskData, category: v })}>
                                                    <SelectTrigger className="h-11 md:h-12 rounded-xl border-gray-100 bg-white font-bold text-[10px] uppercase tracking-widest text-gray-600 shadow-sm focus:ring-0">
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
                                            <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 italic px-1">Assign To</Label>
                                            <Select value={newTaskData.assignedToId} onValueChange={(v) => setNewTaskData({ ...newTaskData, assignedToId: v })}>
                                                <SelectTrigger className="h-11 md:h-12 rounded-xl border-gray-100 bg-white font-bold text-[10px] uppercase tracking-widest text-gray-600 shadow-sm focus:ring-0">
                                                    <SelectValue placeholder="Select Staff" />
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
                                                className="h-11 md:h-12 rounded-xl border-gray-100 font-bold text-xs shadow-sm focus:ring-0 uppercase"
                                                value={newTaskData.dueDate}
                                                onChange={(e) => setNewTaskData({ ...newTaskData, dueDate: e.target.value })}
                                            />
                                        </div>
                                        <Button
                                            className="w-full h-12 md:h-14 rounded-2xl md:rounded-[1.5rem] bg-black hover:bg-gray-800 text-white font-bold text-[11px] uppercase tracking-widest shadow-xl transition-all active:scale-95 mt-4"
                                            onClick={handleCreateTask}
                                            disabled={createMutation.isPending}
                                        >
                                            {createMutation.isPending ? "Saving" : "Create Task"}
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 md:py-10 space-y-6 md:space-y-10">
                {/* Search Bar - Mobile Focus */}
                <div className="lg:hidden relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-black transition-colors" />
                    <Input
                        placeholder="Search tasks or staff..."
                        className="h-11 md:h-14 pl-11 rounded-[1.25rem] border-gray-100 bg-white font-bold text-[10px] md:text-xs uppercase tracking-wider text-gray-900 shadow-sm transition-all focus:ring-0"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Metrics Matrix */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                    {[
                        { label: 'Total', value: stats.total, sub: 'All', icon: ClipboardList, color: 'text-gray-900', bg: 'bg-white' },
                        { label: 'Pending', value: stats.pending, sub: 'Pending', icon: Clock, color: 'text-rose-500', bg: 'bg-rose-50/50' },
                        { label: 'Urgent', value: stats.urgent, sub: 'Urgent', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50/50' },
                        { label: 'Done', value: `${stats.completionRate}%`, sub: 'Quality', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50/50' }
                    ].map((node, i) => (
                        <div key={i} className={`border border-gray-100 rounded-2xl md:rounded-3xl p-4 md:p-6 flex flex-col sm:flex-row items-center sm:items-center gap-3 md:gap-5 shadow-sm hover:shadow-md transition-all group ${node.bg} min-w-0`}>
                            <div className={`h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-white flex items-center justify-center shrink-0 border border-gray-100 group-hover:scale-110 transition-transform ${node.color} shadow-sm`}>
                                <node.icon className="h-5 w-5 md:h-6 md:w-6" />
                            </div>
                            <div className="flex flex-col text-center sm:text-left min-w-0">
                                <span className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest italic truncate">{node.label}</span>
                                <div className="flex items-baseline justify-center sm:justify-start gap-1.5 md:gap-2 mt-0.5 md:mt-1 truncate">
                                    <span className={`text-sm md:text-2xl font-black tracking-tighter ${node.color}`}>{node.value}</span>
                                    <span className="text-[7px] md:text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] hidden xs:block">{node.sub}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col md:flex-row gap-4 lg:items-center">
                    <div className="flex items-center gap-2 px-1">
                        <Filter className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Filter</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="flex-1 md:flex-none h-11 md:h-12 w-[140px] md:w-[160px] rounded-xl md:rounded-[1.25rem] border-gray-100 bg-white font-bold text-[9px] md:text-[10px] uppercase tracking-[0.15em] text-gray-600 shadow-sm focus:ring-0">
                                <SelectValue placeholder="STATUS" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                                <SelectItem value="all" className="text-[10px] font-bold uppercase tracking-widest">All</SelectItem>
                                <SelectItem value="PENDING" className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Pending</SelectItem>
                                <SelectItem value="IN_PROGRESS" className="text-[10px] font-bold uppercase tracking-widest text-blue-600">In Progress</SelectItem>
                                <SelectItem value="COMPLETED" className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Completed</SelectItem>
                                <SelectItem value="CANCELLED" className="text-[10px] font-bold uppercase tracking-widest text-rose-500">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filterPriority} onValueChange={setFilterPriority}>
                            <SelectTrigger className="flex-1 md:flex-none h-11 md:h-12 w-[140px] md:w-[160px] rounded-xl md:rounded-[1.25rem] border-gray-100 bg-white font-bold text-[9px] md:text-[10px] uppercase tracking-[0.15em] text-gray-600 shadow-sm focus:ring-0">
                                <SelectValue placeholder="PRIORITY" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                                <SelectItem value="all" className="text-[10px] font-bold uppercase tracking-widest">All</SelectItem>
                                <SelectItem value="URGENT" className="text-[10px] font-bold uppercase tracking-widest text-rose-600 italic">Urgent Priority</SelectItem>
                                <SelectItem value="HIGH" className="text-[10px] font-bold uppercase tracking-widest">High Priority</SelectItem>
                                <SelectItem value="MEDIUM" className="text-[10px] font-bold uppercase tracking-widest">Medium Priority</SelectItem>
                                <SelectItem value="LOW" className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Low Priority</SelectItem>
                            </SelectContent>
                        </Select>

                        {(filterStatus !== 'all' || filterPriority !== 'all' || searchQuery) && (
                            <Button
                                variant="ghost"
                                className="h-10 md:h-12 px-5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 w-full md:w-auto mt-2 md:mt-0"
                                onClick={() => {
                                    setFilterStatus('all');
                                    setFilterPriority('all');
                                    setSearchQuery('');
                                }}
                            >
                                <Zap className="h-3.5 w-3.5 mr-2" /> Reset
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
                                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight italic">Tasks</h3>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">List of tasks.</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-0">
                        {/* Mobile Card View */}
                        <div className="md:hidden divide-y divide-gray-50">
                            {filteredTasks.map((task) => (
                                <div key={task.id} className="p-5 space-y-4 active:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                <Badge variant="outline" className={`${getStatusTheme(task.status)} text-[7px] font-black px-2 py-0.5 rounded-full border shadow-sm uppercase tracking-widest`}>
                                                    {task.status?.replace('_', ' ')}
                                                </Badge>
                                                <Badge variant="outline" className={`${getPriorityTheme(task.priority)} text-[7px] font-black px-2 py-0.5 rounded-full border shadow-sm uppercase tracking-widest`}>
                                                    {task.priority}
                                                </Badge>
                                            </div>
                                            <h4 className="text-[13px] font-bold text-gray-900 uppercase tracking-tight italic line-clamp-2">{task.title}</h4>
                                            <p className="text-[9px] font-mono font-bold text-gray-400 mt-1 uppercase tracking-wider">
                                                {task.uid || `TSK-${task.id.slice(-6).toUpperCase()}`}
                                            </p>
                                        </div>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-gray-50 text-gray-900 shadow-sm shrink-0" onClick={() => setSelectedTask(task)}>
                                                    <ArrowUpRight className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="w-[95%] max-w-2xl p-0 overflow-hidden border-none rounded-[2rem] shadow-2xl bg-white mx-auto">
                                                <TaskDetailsContent task={task} />
                                            </DialogContent>
                                        </Dialog>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-50/50">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                                                <User className="h-3.5 w-3.5 text-gray-400" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[10px] font-bold text-gray-900 truncate">{task.assignedTo?.name || 'UNASSIGNED'}</span>
                                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest truncate">{task.assignedTo?.role || 'IDLE UNIT'}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end justify-center min-w-0">
                                            <div className="flex items-center gap-1.5 min-w-0 text-right">
                                                <Clock className={`h-2.5 w-2.5 ${new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED' ? 'text-rose-500' : 'text-gray-400'}`} />
                                                <span className={`text-[10px] font-black uppercase tracking-widest truncate ${new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED' ? 'text-rose-500' : 'text-gray-400'}`}>
                                                    {task.dueDate ? format(new Date(task.dueDate), 'MMM dd') : 'No Date'}
                                                </span>
                                            </div>
                                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-0.5 truncate">{task.category} MODULE</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left min-w-[1200px]">
                                <thead>
                                    <tr className="bg-gray-50/70 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 border-b">
                                        <th className="px-8 py-5 italic">Task</th>
                                        <th className="px-8 py-5">Staff</th>
                                        <th className="px-8 py-5">Category</th>
                                        <th className="px-8 py-5">Priority</th>
                                        <th className="px-8 py-5">Status</th>
                                        <th className="px-8 py-5 text-right">Action</th>
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
                                                    <DialogContent className="max-w-2xl p-0 overflow-hidden border-none rounded-[2rem] shadow-2xl bg-white">
                                                        <TaskDetailsContent task={task} />
                                                    </DialogContent>
                                                </Dialog>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Card>
            </main>
        </div>
    );
};

const TaskDetailsContent = ({ task }) => {
    const user = useAuthStore((state) => state.user);
    const [newComment, setNewComment] = useState("");
    const updateMutation = useUpdateTask();
    const addCommentMutation = useAddTaskComment();

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

    const getStatusTheme = (status) => {
        switch (status) {
            case "COMPLETED": return "bg-emerald-50 text-emerald-700 border-emerald-100";
            case "CANCELLED": return "bg-rose-50 text-rose-700 border-rose-100";
            case "IN_PROGRESS": return "bg-amber-50 text-amber-700 border-amber-100";
            case "PENDING": return "bg-gray-100 text-gray-700 border-gray-200";
            default: return "bg-gray-50 text-gray-600 border-gray-100";
        }
    };

    return (
        <div className="bg-white">
            <div className="p-6 md:p-8 border-b border-gray-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-50/20">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-black flex items-center justify-center text-white shadow-lg shadow-black/10 shrink-0">
                        <BarChart3 className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-base md:text-lg font-bold text-gray-900 uppercase tracking-tight italic truncate">Details</h3>
                        <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic truncate">{task.uid} Info</p>
                    </div>
                </div>
                <Badge className={`${getStatusTheme(task.status)} px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm`}>{task.status}</Badge>
            </div>

            <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Left Content */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="space-y-4">
                        <div className="p-5 md:p-6 bg-gray-50 rounded-[1.5rem] md:rounded-[2rem] border border-gray-100 space-y-3 shadow-inner">
                            <h4 className="text-[11px] md:text-xs font-black text-gray-900 uppercase tracking-widest italic leading-tight">{task.title}</h4>
                            <p className="text-xs text-gray-500 font-medium leading-relaxed italic">"{task.description || 'No details.'}"</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-white border border-gray-100 rounded-2xl flex flex-col gap-1 shadow-sm">
                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Created</span>
                                <span className="text-[10px] font-bold text-gray-900 uppercase italic">{format(new Date(task.createdAt), 'MMM dd, HH:mm')}</span>
                            </div>
                            <div className="p-4 bg-white border border-gray-100 rounded-2xl flex flex-col gap-1 shadow-sm">
                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Target</span>
                                <span className="text-[10px] font-bold text-gray-900 uppercase italic">{task.dueDate ? format(new Date(task.dueDate), 'MMM dd, HH:mm') : 'Open'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Task Lifecycle Actions */}
                    <div className="space-y-3">
                        <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 italic px-1">Actions</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Button
                                variant="outline"
                                className="h-11 md:h-12 rounded-xl md:rounded-2xl font-bold text-[9px] md:text-[10px] uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 border-emerald-100 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
                                onClick={() => handleUpdateStatus(task.id, 'COMPLETED')}
                                disabled={updateMutation.isPending || task.status === 'COMPLETED'}
                            >
                                <CheckCircle className="h-4 w-4 shrink-0" /> Done
                            </Button>
                            <Button
                                variant="outline"
                                className="h-11 md:h-12 rounded-xl md:rounded-2xl font-bold text-[9px] md:text-[10px] uppercase tracking-widest text-amber-600 hover:bg-amber-50 border-amber-100 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
                                onClick={() => handleUpdateStatus(task.id, 'IN_PROGRESS')}
                                disabled={updateMutation.isPending || task.status === 'IN_PROGRESS'}
                            >
                                <Zap className="h-4 w-4 shrink-0" /> Start
                            </Button>
                            <Button
                                variant="outline"
                                className="h-11 md:h-12 rounded-xl md:rounded-2xl font-bold text-[9px] md:text-[10px] uppercase tracking-widest text-rose-500 hover:bg-rose-50 border-rose-100 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm sm:col-span-2"
                                onClick={() => handleUpdateStatus(task.id, 'CANCELLED')}
                                disabled={updateMutation.isPending || task.status === 'CANCELLED'}
                            >
                                <XCircle className="h-4 w-4 shrink-0" /> Cancel
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right Content: Comments/Audit Trail */}
                <div className="lg:col-span-2 lg:border-l lg:border-gray-100 lg:pl-8 space-y-6 pt-6 lg:pt-0 border-t lg:border-t-0 border-gray-50">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest italic">Comments</h4>
                        <Badge variant="secondary" className="text-[8px] font-black bg-gray-100 px-2 py-0.5 rounded-md">{task.comments?.length || 0}</Badge>
                    </div>

                    <div className="space-y-4 max-h-[300px] md:max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {task.comments?.map((comment) => (
                            <div key={comment.id} className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-gray-50/50 border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-black text-gray-900 uppercase tracking-tight truncate max-w-[70%]">{comment.User.name}</span>
                                    <span className="text-[8px] font-bold text-gray-400 shrink-0">{format(new Date(comment.createdAt), 'HH:mm')}</span>
                                </div>
                                <p className="text-[11px] text-gray-600 font-medium leading-relaxed italic">"{comment.message}"</p>
                            </div>
                        ))}
                        {(!task.comments || task.comments.length === 0) && (
                            <div className="py-12 text-center space-y-3 opacity-30">
                                <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto">
                                    <MessageSquare className="h-6 w-6 text-gray-400" />
                                </div>
                                <p className="text-[9px] font-black uppercase tracking-widest">Empty</p>
                            </div>
                        )}
                    </div>

                    <div className="relative mt-auto pt-4">
                        <Textarea
                            placeholder="Add a comment..."
                            className="min-h-[90px] rounded-[1.5rem] border-gray-100 bg-gray-50/50 font-medium text-[11px] shadow-sm focus:ring-0 focus:bg-white transition-all pt-4 pb-12 resize-none"
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
                            className="absolute right-3 bottom-3 h-8 w-8 rounded-xl bg-black hover:bg-gray-800 transition-all active:scale-90 shadow-lg"
                            onClick={() => handleSendComment(task.id)}
                            disabled={addCommentMutation.isPending || !newComment.trim()}
                        >
                            <Send className="h-3.5 w-3.5 text-white" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TasksPage;
