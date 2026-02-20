"use client"
import React, { useState } from "react";
import {
    Search,
    AlertTriangle,
    CheckCircle,
    Clock,
    XCircle,
    ClipboardList,
    Filter,
    BarChart3,
    ArrowUpRight,
    Zap,
    Info,
    Calendar,
    MessageSquare,
    Send,
    Play,
    Plus,
    Loader2,
    Building2
} from "lucide-react";
import { Card } from "@/components/ui/card";
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
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTasks, useUpdateTask, useAddTaskComment, useCreateTask } from "@/hooks/usetasks";
import { format } from "date-fns";
import useAuthStore from "@/hooks/Authstate";
import { toast } from "sonner";

const StaffTasksPage = () => {
    const user = useAuthStore((state) => state.user);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterPriority, setFilterPriority] = useState("all");
    const [selectedTask, setSelectedTask] = useState(null);
    const [newComment, setNewComment] = useState("");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [taskForm, setTaskForm] = useState({
        title: "",
        description: "",
        priority: "MEDIUM",
        category: "GENERAL"
    });

    const { data: tasks, isLoading: isTasksLoading } = useTasks({
        assignedToId: user?.id
    });

    const updateMutation = useUpdateTask();
    const createMutation = useCreateTask();
    const addCommentMutation = useAddTaskComment();

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

    const handleCreateTask = () => {
        if (!taskForm.title.trim()) {
            toast.error("Please provide a task title");
            return;
        }
        createMutation.mutate({
            ...taskForm,
            assignedToId: user?.id,
            status: 'PENDING'
        }, {
            onSuccess: () => {
                setIsCreateDialogOpen(false);
                setTaskForm({ title: "", description: "", priority: "MEDIUM", category: "GENERAL" });
                toast.success("Task created successfully");
            }
        });
    };

    const filteredTasks = (tasks || []).filter(task => {
        const matchesSearch =
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.uid?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = filterStatus === "all" || task.status === filterStatus;
        const matchesPriority = filterPriority === "all" || task.priority === filterPriority;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    if (isTasksLoading) return (
        <div className="flex h-screen items-center justify-center bg-white font-sans">
            <div className="flex flex-col items-center gap-6">
                <div className="h-10 w-10 border-[3px] border-gray-100 border-t-black rounded-full animate-spin" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Loading Tasks...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight leading-relaxed">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-1 bg-indigo-600 rounded-full" />
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight uppercase">My Tasks</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Tasks: {filteredTasks.length}</span>
                                <div className="h-1 w-1 rounded-full bg-indigo-500" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Live</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative group mr-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-black transition-colors" />
                            <Input
                                placeholder="Search tasks..."
                                className="h-9 w-[280px] pl-9 rounded-xl border-gray-100 bg-gray-50/50 font-bold text-[10px] uppercase tracking-wider text-gray-600 shadow-sm transition-all focus:bg-white focus:ring-0"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="h-9 px-5 rounded-xl bg-black hover:bg-gray-800 text-white font-bold text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2">
                                    <Plus className="h-3.5 w-3.5" /> Add Task
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md p-0 overflow-hidden border-none rounded-[2rem] shadow-2xl bg-white">
                                <div className="bg-indigo-600 p-8 text-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/10">
                                            <ClipboardList className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold uppercase tracking-tight">Create New Task</h3>
                                            <p className="text-[10px] font-medium text-indigo-200 uppercase tracking-widest">Add a task to your queue</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8 space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Title</Label>
                                        <Input
                                            placeholder="What needs to be done?"
                                            className="h-11 rounded-xl border-gray-100 bg-gray-50/50 font-bold text-xs focus:bg-white transition-all"
                                            value={taskForm.title}
                                            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Description</Label>
                                        <Textarea
                                            placeholder="Provide more details about the task..."
                                            className="min-h-[100px] rounded-2xl border-gray-100 bg-gray-50/50 font-medium text-xs focus:bg-white transition-all resize-none"
                                            value={taskForm.description}
                                            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Priority</Label>
                                            <Select value={taskForm.priority} onValueChange={(val) => setTaskForm({ ...taskForm, priority: val })}>
                                                <SelectTrigger className="h-11 rounded-xl border-gray-100 font-bold text-[10px] uppercase">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="LOW" className="text-[10px] font-bold">LOW</SelectItem>
                                                    <SelectItem value="MEDIUM" className="text-[10px] font-bold">MEDIUM</SelectItem>
                                                    <SelectItem value="HIGH" className="text-[10px] font-bold">HIGH</SelectItem>
                                                    <SelectItem value="URGENT" className="text-[10px] font-bold text-rose-600">URGENT</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Category</Label>
                                            <Select value={taskForm.category} onValueChange={(val) => setTaskForm({ ...taskForm, category: val })}>
                                                <SelectTrigger className="h-11 rounded-xl border-gray-100 font-bold text-[10px] uppercase">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="GENERAL" className="text-[10px] font-bold">GENERAL</SelectItem>
                                                    <SelectItem value="MAINTENANCE" className="text-[10px] font-bold">MAINTENANCE</SelectItem>
                                                    <SelectItem value="CLEANING" className="text-[10px] font-bold">CLEANING</SelectItem>
                                                    <SelectItem value="ADMIN" className="text-[10px] font-bold">ADMIN</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="pt-4 flex gap-4">
                                        <Button variant="ghost" className="flex-1 rounded-xl h-11 font-bold text-[10px] uppercase tracking-wider text-gray-400" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                                        <Button
                                            className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                                            onClick={handleCreateTask}
                                            disabled={createMutation.isPending}
                                        >
                                            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Task'}
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <Filter className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Filters</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="h-9 w-[140px] rounded-xl border-gray-100 bg-white font-bold text-[9px] uppercase tracking-[0.15em] text-gray-600 shadow-sm focus:ring-0">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                                <SelectItem value="all" className="text-[9px] font-bold uppercase tracking-widest">All Status</SelectItem>
                                <SelectItem value="PENDING" className="text-[9px] font-bold uppercase tracking-widest">Pending</SelectItem>
                                <SelectItem value="IN_PROGRESS" className="text-[9px] font-bold uppercase tracking-widest">In Progress</SelectItem>
                                <SelectItem value="COMPLETED" className="text-[9px] font-bold uppercase tracking-widest">Completed</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filterPriority} onValueChange={setFilterPriority}>
                            <SelectTrigger className="h-9 w-[140px] rounded-xl border-gray-100 bg-white font-bold text-[9px] uppercase tracking-[0.15em] text-gray-600 shadow-sm focus:ring-0">
                                <SelectValue placeholder="All Priority" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                                <SelectItem value="all" className="text-[9px] font-bold uppercase tracking-widest">All Priority</SelectItem>
                                <SelectItem value="URGENT" className="text-[9px] font-bold uppercase tracking-widest text-rose-600">Urgent</SelectItem>
                                <SelectItem value="HIGH" className="text-[9px] font-bold uppercase tracking-widest">High</SelectItem>
                                <SelectItem value="MEDIUM" className="text-[9px] font-bold uppercase tracking-widest">Medium</SelectItem>
                                <SelectItem value="LOW" className="text-[9px] font-bold uppercase tracking-widest">Low</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Task Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTasks.map((task) => (
                        <Card key={task.id} className="bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-xl transition-all group overflow-hidden flex flex-col">
                            <div className="p-6 space-y-4 flex-1">
                                <div className="flex items-start justify-between gap-4">
                                    <Badge variant="outline" className={`${getPriorityTheme(task.priority)} px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border-none`}>
                                        {task.priority}
                                    </Badge>
                                    <span className="text-[9px] font-mono font-bold text-gray-400 tracking-tighter bg-gray-50 px-2 py-0.5 rounded-md">
                                        #{task.id.slice(-6).toUpperCase()}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-sm font-bold text-gray-900 line-clamp-2 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{task.title}</h3>
                                    <p className="text-[11px] text-gray-400 line-clamp-2 font-medium leading-relaxed">{task.description || 'No description provided.'}</p>
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                        <Calendar className="h-3 w-3" /> {format(new Date(task.createdAt), 'MMM dd')}
                                    </div>
                                    <div className="h-1 w-1 rounded-full bg-gray-200" />
                                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-ellipsis overflow-hidden">
                                        <Building2 className="h-3 w-3 shrink-0" /> {task.category}
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                                <Badge variant="outline" className={`${getStatusTheme(task.status)} px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm`}>
                                    {task.status}
                                </Badge>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-9 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:bg-black hover:text-white transition-all gap-2" onClick={() => setSelectedTask(task)}>
                                            View Details <ArrowUpRight className="h-3.5 w-3.5" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl p-0 overflow-hidden border-none rounded-[2rem] shadow-2xl">
                                        <div className="bg-white">
                                            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/10">
                                                        <ClipboardList className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Task Details</h3>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Status: {task.status}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
                                                <div className="lg:col-span-3 space-y-6">
                                                    <div className="p-6 bg-gray-50 rounded-[1.5rem] border border-gray-100 space-y-3">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <Badge className={`${getPriorityTheme(task.priority)} px-3 py-0.5 rounded-full border-none`}>{task.priority}</Badge>
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{task.category}</span>
                                                        </div>
                                                        <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">{task.title}</h4>
                                                        <p className="text-xs text-gray-500 font-medium leading-relaxed">{task.description || 'No description provided.'}</p>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3 items-center">
                                                        {task.status === "PENDING" && (
                                                            <Button
                                                                className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[9px] uppercase tracking-widest transition-all col-span-2 flex items-center gap-2"
                                                                onClick={() => handleUpdateStatus(task.id, 'IN_PROGRESS')}
                                                                disabled={updateMutation.isPending}
                                                            >
                                                                <Play className="h-4 w-4" /> Start Task
                                                            </Button>
                                                        )}
                                                        {task.status === "IN_PROGRESS" && (
                                                            <Button
                                                                className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] uppercase tracking-widest transition-all col-span-2 flex items-center gap-2"
                                                                onClick={() => handleUpdateStatus(task.id, 'COMPLETED')}
                                                                disabled={updateMutation.isPending}
                                                            >
                                                                <CheckCircle className="h-4 w-4" /> Complete Task
                                                            </Button>
                                                        )}
                                                        {task.status === "COMPLETED" && (
                                                            <div className="col-span-2 p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center gap-2">
                                                                <CheckCircle className="h-4 w-4 text-emerald-600" />
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Task Completed</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="lg:col-span-2 border-l border-gray-100 pl-8 flex flex-col h-[400px]">
                                                    <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-4">Comments</h4>
                                                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                                                        {task.comments?.map((comment) => (
                                                            <div key={comment.id} className="flex flex-col gap-1.5 p-3 rounded-2xl bg-gray-50/50 border border-gray-100 text-left">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-[9px] font-black text-gray-900 uppercase tracking-tight">{comment.User.name}</span>
                                                                    <span className="text-[8px] text-gray-400">{format(new Date(comment.createdAt), 'HH:mm')}</span>
                                                                </div>
                                                                <p className="text-[11px] text-gray-600 font-medium">{comment.message}</p>
                                                            </div>
                                                        ))}
                                                        {(!task.comments || task.comments.length === 0) && (
                                                            <div className="py-12 text-center opacity-20">
                                                                <MessageSquare className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                                                <p className="text-[9px] font-black uppercase tracking-widest">No comments</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="mt-4 relative">
                                                        <Textarea
                                                            placeholder="Add a comment..."
                                                            className="min-h-[80px] rounded-2xl border-gray-100 bg-gray-50/50 font-medium text-[11px] shadow-sm pt-3 pb-10"
                                                            value={newComment}
                                                            onChange={(e) => setNewComment(e.target.value)}
                                                        />
                                                        <Button
                                                            size="icon"
                                                            className="absolute right-2 bottom-2 h-7 w-7 rounded-lg bg-indigo-600 hover:bg-indigo-700"
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
                            </div>
                        </Card>
                    ))}
                    {filteredTasks.length === 0 && (
                        <div className="col-span-full py-20 bg-white rounded-[3rem] border border-gray-100 flex flex-col items-center justify-center gap-4">
                            <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center">
                                <ClipboardList className="h-8 w-8 text-gray-200" />
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-black uppercase tracking-widest text-gray-900">No tasks found</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">There are no tasks assigned to you at this time.</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default StaffTasksPage;
