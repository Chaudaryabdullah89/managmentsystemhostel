"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft, MapPin, Building2, Calendar, Clock, User,
    CheckCircle, CheckCircle2, Zap, AlertTriangle, Activity,
    MessageSquare, Send, FileText, Hash, ShieldCheck, Play,
    ChevronRight, XCircle, MoreVertical, Loader2, Signal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
    URGENT: { color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100", label: "Urgent", icon: AlertTriangle },
    HIGH: { color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100", label: "High", icon: Activity },
    MEDIUM: { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", label: "Medium", icon: Clock },
    LOW: { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", label: "Low", icon: CheckCircle },
};

const statusConfig = {
    PENDING: { color: "text-gray-500", bg: "bg-gray-50", label: "Awaiting" },
    IN_PROGRESS: { color: "text-black", bg: "bg-gray-100", label: "Processing" },
    RESOLVED: { color: "text-emerald-600", bg: "bg-emerald-50", label: "Handled" },
    REJECTED: { color: "text-rose-600", bg: "bg-rose-50", label: "Dropped" },
};

const StaffComplaintDetailPage = ({ params }) => {
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
        <div className="flex h-screen items-center justify-center bg-white font-sans">
            <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 border-2 border-gray-100 border-t-black rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Syncing Intelligence...</p>
            </div>
        </div>
    );

    if (error || !complaint) return (
        <div className="flex h-screen items-center justify-center bg-white font-sans">
            <div className="text-center">
                <AlertTriangle className="h-8 w-8 text-gray-200 mx-auto mb-4" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Entry Not Found</p>
                <div className="mt-6">
                    <Link href="/staff/complaints">
                        <Button variant="outline" className="h-9 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest border-gray-100">Back to Ledger</Button>
                    </Link>
                </div>
            </div>
        </div>
    );

    const priority = priorityConfig[complaint.priority] || priorityConfig.MEDIUM;
    const status = statusConfig[complaint.status] || statusConfig.PENDING;
    const isActive = complaint.status !== "RESOLVED" && complaint.status !== "REJECTED";

    return (
        <div className="min-h-screen bg-gray-50/30 pb-20 font-sans antialiased">
            {/* Slim Premium Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/staff/complaints">
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-gray-50">
                                <ArrowLeft className="h-4 w-4 text-gray-400" />
                            </Button>
                        </Link>
                        <div className="h-8 w-1 bg-black rounded-full" />
                        <div className="flex flex-col">
                            <h1 className="text-sm font-black text-gray-900 uppercase tracking-tighter italic">Grievance Audit</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Node ID: {complaint.uid || `#${complaint.id.slice(-8).toUpperCase()}`}</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Badge className={`${status.bg} ${status.color} border-none text-[8px] font-black uppercase px-3 py-1 rounded-full px-4`}>
                            {status.label}
                        </Badge>
                        {isActive && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button className="h-9 px-6 rounded-xl bg-black hover:bg-gray-800 text-white font-black text-[10px] uppercase tracking-widest gap-2 shadow-xl shadow-gray-200">
                                        Update <MoreVertical className="h-3.5 w-3.5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-2xl border-gray-100 shadow-2xl p-1.5 w-48 bg-white">
                                    {complaint.status === "PENDING" && (
                                        <DropdownMenuItem
                                            className="rounded-xl text-[9px] font-black uppercase tracking-widest py-3 cursor-pointer focus:bg-gray-50 gap-2"
                                            onClick={() => handleUpdateStatus("IN_PROGRESS")}
                                        >
                                            <Play className="h-3.5 w-3.5 text-indigo-500" /> Process Entry
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                        className="rounded-xl text-[9px] font-black uppercase tracking-widest py-3 cursor-pointer focus:bg-emerald-50 focus:text-emerald-700 gap-2"
                                        onClick={() => handleUpdateStatus("RESOLVED")}
                                    >
                                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Resolve Issue
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Primary Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Manifest Card */}
                        <Card className="bg-white border-none shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] rounded-[2.5rem] overflow-hidden">
                            <div className={`p-8 border-b border-gray-50 flex items-start justify-between ${priority.bg}`}>
                                <div className="flex gap-6">
                                    <div className="h-16 w-16 rounded-[1.5rem] bg-white shadow-sm flex items-center justify-center text-3xl">
                                        {complaint.category === "MAINTENANCE" ? "🔧" : complaint.category === "CLEANLINESS" ? "🧹" : "📋"}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge className={`${priority.bg} ${priority.color} border-none text-[8px] font-black uppercase px-2 py-0`}>
                                                {priority.label} Priority
                                            </Badge>
                                            <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">{complaint.category}</span>
                                        </div>
                                        <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">{complaint.title}</h2>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-1 flex items-center gap-1.5">
                                            <Signal className="h-3 w-3" /> System Broadcast {format(new Date(complaint.createdAt), "MMM dd")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-8 space-y-8">
                                <div className="space-y-3">
                                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] italic">Intelligence Dispatch</p>
                                    <div className="text-sm font-medium text-gray-600 leading-relaxed bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100/50">
                                        {complaint.description}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { label: 'Network Node', value: `Room ${complaint.roomNumber || '00'}`, icon: MapPin },
                                        { label: 'Facility', value: complaint.Hostel?.name || 'Main', icon: Building2 },
                                        { label: 'Registered', value: format(new Date(complaint.createdAt), "MMM dd"), icon: Calendar },
                                        { label: 'Duration', value: formatDistanceToNow(new Date(complaint.createdAt)), icon: Clock },
                                    ].map((item, i) => (
                                        <div key={i} className="bg-white border border-gray-50 p-4 rounded-2xl">
                                            <item.icon className="h-3.5 w-3.5 text-gray-300 mb-2" />
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{item.label}</p>
                                            <p className="text-[10px] font-black text-gray-900 uppercase">{item.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        {/* Resolution Center */}
                        <Card className="bg-white border-none shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] rounded-[2.5rem] overflow-hidden">
                            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-black rounded-xl flex items-center justify-center">
                                        <ShieldCheck className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-0.5">Operation Board</p>
                                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-tighter">Resolution Protocol</h3>
                                    </div>
                                </div>
                            </div>
                            <div className="p-8">
                                {(!isActive) ? (
                                    <div className={`p-6 rounded-[2rem] border ${complaint.status === "RESOLVED" ? "bg-emerald-50/50 border-emerald-100" : "bg-rose-50/50 border-rose-100"}`}>
                                        <p className={`text-[9px] font-black uppercase tracking-widest mb-3 ${complaint.status === "RESOLVED" ? "text-emerald-600" : "text-rose-600"}`}>
                                            Final Diagnostic Archive
                                        </p>
                                        <p className="text-sm font-medium text-gray-700 leading-relaxed italic">
                                            "{complaint.resolutionNotes || "No resolution logs provided."}"
                                        </p>
                                        <div className="mt-6 pt-4 border-t border-black/5 flex items-center gap-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                            <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> Resolved {format(new Date(complaint.resolvedAt || complaint.updatedAt), "MMM dd, HH:mm")}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400 italic">Analytical Notes</Label>
                                            <Textarea
                                                placeholder="Document resolution findings here..."
                                                className="min-h-[140px] rounded-[1.5rem] border-gray-100 bg-gray-50/30 focus:bg-white font-medium text-sm resize-none p-6"
                                                value={responseNotes}
                                                onChange={(e) => setResponseNotes(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {complaint.status === "PENDING" && (
                                                <Button
                                                    className="flex-1 h-12 bg-white border border-gray-100 text-black hover:bg-gray-50 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
                                                    onClick={() => handleUpdateStatus("IN_PROGRESS")}
                                                    disabled={isSubmitting}
                                                >
                                                    Process Entry
                                                </Button>
                                            )}
                                            <Button
                                                className="flex-1 h-12 bg-black hover:bg-gray-800 text-white font-black text-[10px] uppercase tracking-widest rounded-xl gap-2 shadow-xl shadow-gray-200 transition-all"
                                                onClick={() => handleUpdateStatus("RESOLVED")}
                                                disabled={isSubmitting || !responseNotes.trim()}
                                            >
                                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <CheckCircle className="h-4 w-4" />} Complete Resolution
                                            </Button>
                                        </div>
                                        {!responseNotes.trim() && (
                                            <p className="text-[9px] text-gray-400 text-center uppercase font-black tracking-widest">Documentation Required to Resolve</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Reporter Registry */}
                        <div className="bg-[#0a0c12] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                            <div className="relative z-10 space-y-8">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                        <User className="h-6 w-6 text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-indigo-400/60 uppercase tracking-widest mb-0.5">Origin Source</p>
                                        <h3 className="text-base font-black tracking-tighter uppercase italic">{complaint.User_Complaint_userIdToUser?.name}</h3>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Designation</span>
                                        <span className="text-[10px] font-black uppercase text-indigo-300">{complaint.User_Complaint_userIdToUser?.role || "Resident"}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Comm Link</span>
                                        <span className="text-[10px] font-black tabular-nums">{complaint.User_Complaint_userIdToUser?.phone || "Private"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Intelligence Feed (Chat) */}
                        <Card className="bg-white border-none shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] rounded-[2.5rem] overflow-hidden flex flex-col h-[500px]">
                            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-gray-400" />
                                    <h3 className="text-[10px] font-black uppercase tracking-widest">Intelligence Feed</h3>
                                </div>
                                <Badge className="bg-gray-100 text-gray-500 border-none text-[8px] font-black px-2">{complaint.comments?.length || 0}</Badge>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/20">
                                {complaint.comments && complaint.comments.length > 0 ? (
                                    complaint.comments.map((comment, index) => {
                                        const isStaff = ["ADMIN", "WARDEN", "STAFF"].includes(comment.User.role);
                                        return (
                                            <div key={index} className={`flex gap-3 ${isStaff ? "flex-row-reverse" : ""}`}>
                                                <div className={`p-4 rounded-[1.5rem] max-w-[85%] text-xs font-semibold leading-relaxed shadow-sm ${isStaff ? "bg-black text-white rounded-tr-none" : "bg-white text-gray-700 border border-gray-50 rounded-tl-none"}`}>
                                                    <div className={`flex items-center gap-2 mb-1.5 ${isStaff ? "flex-row-reverse text-indigo-300" : "text-gray-400"}`}>
                                                        <span className="text-[8px] font-black uppercase tracking-widest">{comment.User.name}</span>
                                                        <span className="text-[8px] opacity-40 italic">{format(new Date(comment.createdAt), "HH:mm")}</span>
                                                    </div>
                                                    <p className="italic leading-snug">{comment.message}</p>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30 px-8">
                                        <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                            <Signal className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Silent Frequency</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-white border-t border-gray-50">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Transmit data..."
                                        className="h-10 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white text-[10px] font-black uppercase tracking-widest italic"
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
                                        className="h-10 w-10 rounded-xl bg-black hover:bg-gray-800 flex-shrink-0"
                                        onClick={handleSendComment}
                                        disabled={addCommentMutation.isPending || !newComment.trim()}
                                    >
                                        <Send className="h-4 w-4 text-white" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StaffComplaintDetailPage;

