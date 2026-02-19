"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft, MapPin, Building2, Calendar, Clock, User,
    CheckCircle, CheckCircle2, Zap, AlertTriangle, Activity,
    MessageSquare, Send, FileText, Hash, ShieldCheck, Play,
    ChevronRight, XCircle, MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useComplaintById, useUpdateComplaint, useAddComplaintComment } from "@/hooks/usecomplaints";
import useAuthStore from "@/hooks/Authstate";
import { format, formatDistanceToNow } from "date-fns";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const priorityConfig = {
    URGENT: { color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200", label: "Urgent", icon: AlertTriangle },
    HIGH: { color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", label: "High", icon: Activity },
    MEDIUM: { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", label: "Medium", icon: Clock },
    LOW: { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", label: "Low", icon: CheckCircle },
};

const statusConfig = {
    PENDING: { color: "text-gray-700", bg: "bg-gray-100", border: "border-gray-200", label: "Pending" },
    IN_PROGRESS: { color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200", label: "In Progress" },
    RESOLVED: { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", label: "Resolved" },
    REJECTED: { color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200", label: "Rejected" },
};

const categoryIcons = {
    MAINTENANCE: "🔧", CLEANLINESS: "🧹", NOISE: "🔊",
    SECURITY: "🔒", INTERNET: "📶", OTHER: "📋",
};

const StaffTaskDetailPage = ({ params }) => {
    const resolvedParams = React.use(params);
    const { complaintId } = resolvedParams;

    const user = useAuthStore((state) => state.user);
    const { data: complaint, isLoading, error } = useComplaintById(complaintId);
    const updateMutation = useUpdateComplaint();
    const addCommentMutation = useAddComplaintComment();

    const [responseNotes, setResponseNotes] = useState("");
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleUpdateStatus = (status) => {
        setIsSubmitting(true);
        updateMutation.mutate({
            id: complaintId,
            status,
            resolutionNotes: responseNotes || undefined
        }, {
            onSuccess: () => { setResponseNotes(""); setIsSubmitting(false); },
            onError: () => setIsSubmitting(false)
        });
    };

    const handleSendComment = () => {
        if (!newComment.trim()) return;
        addCommentMutation.mutate({
            complaintId,
            userId: user?.id,
            message: newComment
        }, {
            onSuccess: () => setNewComment("")
        });
    };

    if (isLoading) return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 border-[3px] border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Loading Task Details...</p>
            </div>
        </div>
    );

    if (error || !complaint) return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="text-center">
                <AlertTriangle className="h-10 w-10 text-rose-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900">Task Not Found</h3>
                <p className="text-sm text-gray-500 mb-6">This task doesn't exist or you don't have access.</p>
                <Link href="/staff/complaints">
                    <Button variant="outline" className="rounded-xl">Back to Tasks</Button>
                </Link>
            </div>
        </div>
    );

    const priority = priorityConfig[complaint.priority] || priorityConfig.MEDIUM;
    const status = statusConfig[complaint.status] || statusConfig.PENDING;
    const PriorityIcon = priority.icon;
    const isActive = complaint.status !== "RESOLVED" && complaint.status !== "REJECTED";

    // Build a workflow timeline
    const workflowSteps = [
        { key: "PENDING", label: "Assigned", desc: "Task received", done: true },
        { key: "IN_PROGRESS", label: "In Progress", desc: "Work started", done: complaint.status === "IN_PROGRESS" || complaint.status === "RESOLVED" },
        { key: "RESOLVED", label: "Completed", desc: "Task resolved", done: complaint.status === "RESOLVED" },
    ];

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Sticky Header */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-50 h-16 shadow-sm shadow-black/5">
                <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/staff/complaints">
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-gray-100">
                                <ArrowLeft className="h-4 w-4 text-gray-500" />
                            </Button>
                        </Link>
                        <div className="h-6 w-px bg-gray-200" />
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Task Details</h1>
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${status.bg} ${status.color} ${status.border}`}>
                                    {status.label}
                                </span>
                            </div>
                            <p className="text-[10px] font-mono font-bold text-gray-400">
                                {complaint.uid || `#${complaint.id.slice(-8).toUpperCase()}`}
                            </p>
                        </div>
                    </div>

                    {isActive && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider gap-2">
                                    Update Status <MoreVertical className="h-3.5 w-3.5 opacity-70" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl border-gray-100 shadow-xl p-1 w-52 bg-white">
                                {complaint.status === "PENDING" && (
                                    <DropdownMenuItem
                                        className="rounded-lg text-[10px] font-bold uppercase tracking-wider py-2.5 cursor-pointer focus:bg-indigo-50 focus:text-indigo-700 gap-2"
                                        onClick={() => handleUpdateStatus("IN_PROGRESS")}
                                    >
                                        <Play className="h-3.5 w-3.5" /> Start Working
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                    className="rounded-lg text-[10px] font-bold uppercase tracking-wider py-2.5 cursor-pointer focus:bg-emerald-50 focus:text-emerald-700 gap-2"
                                    onClick={() => handleUpdateStatus("RESOLVED")}
                                >
                                    <CheckCircle className="h-3.5 w-3.5" /> Mark Completed
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Main Content */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Task Header Card */}
                    <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                        <div className={`p-6 border-b ${priority.bg} ${priority.border} border-opacity-50`}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="text-4xl">{categoryIcons[complaint.category] || "📋"}</div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase border ${priority.bg} ${priority.color} ${priority.border}`}>
                                                <PriorityIcon className="h-2.5 w-2.5" /> {priority.label} Priority
                                            </span>
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider bg-white/60 px-2 py-0.5 rounded-full border border-gray-200">
                                                {complaint.category}
                                            </span>
                                        </div>
                                        <h2 className="text-xl font-bold text-gray-900 leading-tight">{complaint.title}</h2>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Description</p>
                                <p className="text-sm text-gray-600 font-medium leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                    {complaint.description}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Location</p>
                                        <p className="text-sm font-bold text-gray-900">Room {complaint.roomNumber || "N/A"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <Building2 className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Hostel</p>
                                        <p className="text-sm font-bold text-gray-900">{complaint.Hostel?.name || "N/A"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <Calendar className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Assigned On</p>
                                        <p className="text-sm font-bold text-gray-900">{format(new Date(complaint.createdAt), "MMM dd, yyyy")}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <Clock className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Age</p>
                                        <p className="text-sm font-bold text-gray-900">{formatDistanceToNow(new Date(complaint.createdAt))}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Progress Workflow */}
                    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Activity className="h-4 w-4 text-indigo-500" /> Task Progress
                        </h3>
                        <div className="flex items-center gap-0">
                            {workflowSteps.map((step, i) => (
                                <React.Fragment key={step.key}>
                                    <div className="flex flex-col items-center gap-2 flex-1">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all ${step.done
                                            ? "bg-indigo-600 border-indigo-600 text-white"
                                            : "bg-white border-gray-200 text-gray-300"
                                            }`}>
                                            {step.done ? <CheckCircle className="h-5 w-5" /> : <span className="text-xs font-bold">{i + 1}</span>}
                                        </div>
                                        <div className="text-center">
                                            <p className={`text-[10px] font-bold uppercase tracking-wider ${step.done ? "text-indigo-600" : "text-gray-400"}`}>{step.label}</p>
                                            <p className="text-[9px] text-gray-400">{step.desc}</p>
                                        </div>
                                    </div>
                                    {i < workflowSteps.length - 1 && (
                                        <div className={`h-0.5 flex-1 mb-8 transition-all ${workflowSteps[i + 1].done ? "bg-indigo-600" : "bg-gray-200"}`} />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    {/* Completion Report */}
                    <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-gray-50 flex items-center gap-3">
                            <div className="h-9 w-9 bg-emerald-50 rounded-xl flex items-center justify-center">
                                <CheckCircle className="h-4.5 w-4.5 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Completion Report</h3>
                                <p className="text-[10px] text-gray-400 font-medium mt-0.5">Document your work done</p>
                            </div>
                        </div>
                        <div className="p-6">
                            {(complaint.status === "RESOLVED" || complaint.status === "REJECTED") ? (
                                <div className={`p-5 rounded-2xl border ${complaint.status === "RESOLVED" ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"}`}>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${complaint.status === "RESOLVED" ? "text-emerald-600" : "text-rose-600"}`}>
                                        Final Status: {complaint.status}
                                    </p>
                                    <p className={`text-sm font-medium leading-relaxed ${complaint.status === "RESOLVED" ? "text-emerald-900" : "text-rose-900"}`}>
                                        {complaint.resolutionNotes || "No resolution notes provided."}
                                    </p>
                                    {complaint.resolvedAt && (
                                        <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mt-4 flex items-center gap-1.5">
                                            <Clock className="h-3 w-3" /> Closed on {format(new Date(complaint.resolvedAt), "MMM dd, yyyy HH:mm")}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Work Done / Notes</Label>
                                        <Textarea
                                            placeholder="Describe what action was taken to resolve this issue..."
                                            className="min-h-[120px] rounded-2xl border-gray-200 bg-gray-50 focus:bg-white font-medium text-sm resize-none"
                                            value={responseNotes}
                                            onChange={(e) => setResponseNotes(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {complaint.status === "PENDING" && (
                                            <Button
                                                className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl gap-2"
                                                onClick={() => handleUpdateStatus("IN_PROGRESS")}
                                                disabled={isSubmitting}
                                            >
                                                <Play className="h-3.5 w-3.5" /> Start Working
                                            </Button>
                                        )}
                                        <Button
                                            className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl gap-2 shadow-lg shadow-emerald-600/20"
                                            onClick={() => handleUpdateStatus("RESOLVED")}
                                            disabled={isSubmitting || !responseNotes.trim()}
                                        >
                                            <CheckCircle className="h-3.5 w-3.5" /> Complete & Close
                                        </Button>
                                    </div>
                                    {!responseNotes.trim() && (
                                        <p className="text-[10px] text-gray-400 text-center">Add work notes before marking as complete</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Reporter & Chat */}
                <div className="space-y-6">
                    {/* Reporter Card */}
                    <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                        <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-black p-8 text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/5 skew-y-6 scale-150 origin-bottom-left" />
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="h-16 w-16 rounded-2xl bg-white/10 border border-white/20 shadow-xl mb-3 flex items-center justify-center">
                                    <User className="h-7 w-7 text-white" />
                                </div>
                                <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1">Reported By</p>
                                <h3 className="text-base font-bold text-white">{complaint.User_Complaint_userIdToUser?.name}</h3>
                                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-0.5">
                                    {complaint.User_Complaint_userIdToUser?.role || "Resident"}
                                </p>
                            </div>
                        </div>
                        <div className="p-5 space-y-3">
                            <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone</span>
                                <span className="text-xs font-bold text-gray-900">{complaint.User_Complaint_userIdToUser?.phone || "N/A"}</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assigned To</span>
                                <span className="text-xs font-bold text-indigo-600">You</span>
                            </div>
                        </div>
                    </div>

                    {/* Chat / Discussion */}
                    <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm flex flex-col" style={{ height: 480 }}>
                        <div className="p-5 border-b border-gray-50 flex items-center gap-2 flex-shrink-0">
                            <MessageSquare className="h-4 w-4 text-indigo-500" />
                            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Discussion</h3>
                            {complaint.comments?.length > 0 && (
                                <span className="ml-auto text-[9px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                                    {complaint.comments.length}
                                </span>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/30">
                            {complaint.comments && complaint.comments.length > 0 ? (
                                complaint.comments.map((comment, index) => {
                                    const isStaff = comment.User.role === "ADMIN" || comment.User.role === "WARDEN" || comment.User.role === "STAFF";
                                    return (
                                        <div key={index} className={`flex gap-3 ${isStaff ? "flex-row-reverse" : ""}`}>
                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 border text-[10px] font-black ${isStaff ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200"}`}>
                                                {comment.User.name?.charAt(0)}
                                            </div>
                                            <div className={`p-3 rounded-2xl max-w-[85%] text-xs font-medium leading-relaxed ${isStaff ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-white text-gray-700 border border-gray-100 shadow-sm rounded-tl-sm"}`}>
                                                <div className={`flex items-center gap-2 mb-1 ${isStaff ? "flex-row-reverse" : ""}`}>
                                                    <span className={`text-[8px] font-bold uppercase tracking-widest ${isStaff ? "text-indigo-300" : "text-gray-400"}`}>{comment.User.name}</span>
                                                    <span className="text-[8px] opacity-40">{format(new Date(comment.createdAt), "HH:mm")}</span>
                                                </div>
                                                {comment.message}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
                                    <MessageSquare className="h-8 w-8 text-gray-300 mb-2" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">No messages yet</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-white border-t border-gray-100 flex-shrink-0">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Type a message..."
                                    className="h-10 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-xs font-medium"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendComment();
                                        }
                                    }}
                                />
                                <Button
                                    size="icon"
                                    className="h-10 w-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 flex-shrink-0"
                                    onClick={handleSendComment}
                                    disabled={addCommentMutation.isPending || !newComment.trim()}
                                >
                                    <Send className="h-4 w-4 text-white" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffTaskDetailPage;
