"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
    ChevronLeft,
    User,
    Calendar,
    MessageSquare,
    AlertTriangle,
    Clock,
    CheckCircle,
    XCircle,
    Building2,
    MapPin,
    ShieldCheck,
    Hash,
    Zap,
    MoreVertical,
    Send,
    Activity,
    FileText,
    ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useComplaintById, useUpdateComplaint, useAddComplaintComment } from "@/hooks/usecomplaints";
import useAuthStore from "@/hooks/Authstate";
import { format } from "date-fns";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ComplaintDetailPage = ({ params }) => {
    const router = useRouter();
    // params is a promise in Next.js 15, but usually available directly in older app dir versions.
    // Ideally await params if it's a promise, or use React.use()
    // For simplicity assuming standard params prop structure or unwrapping if needed.
    // Next.js 15+ sometimes requires awaiting params.
    // Let's assume standard synchronous usage for now or check version. 
    // Wait, previous files used `await params` in API routes, but page components receive props.
    // I'll assume safe access via React.use() or just direct access if Next.js 14- (User said 'my-app', generic).
    // Safest current pattern for Next 13/14 is params.complaintId direct. 
    // IF Next 15, it's async. I'll use `React.use()` pattern if needed but simpler to just use it.
    // I'll wrap in `React.use()` if I see it's needed, but let's go with params prop.

    // Actually, to be safe with Next.js 15 breaking changes, I'll unwrap it.
    const resolvedParams = React.use(params);
    const { complaintId } = resolvedParams;

    const user = useAuthStore((state) => state.user);
    const { data: complaint, isLoading, error } = useComplaintById(complaintId);
    const updateMutation = useUpdateComplaint();
    const addCommentMutation = useAddComplaintComment();

    const [responseNotes, setResponseNotes] = useState("");
    const [newComment, setNewComment] = useState("");

    const getStatusTheme = (status) => {
        switch (status) {
            case "RESOLVED": return "bg-emerald-50 text-emerald-700 border-emerald-100";
            case "REJECTED": return "bg-rose-50 text-rose-700 border-rose-100";
            case "IN_PROGRESS": return "bg-amber-50 text-amber-700 border-amber-100";
            case "PENDING": return "bg-blue-50 text-blue-700 border-blue-100";
            default: return "bg-gray-50 text-gray-600 border-gray-100";
        }
    };

    const getPriorityIcon = (priority) => {
        switch (priority) {
            case "URGENT": return <AlertTriangle className="h-4 w-4 text-rose-500" />;
            case "HIGH": return <Activity className="h-4 w-4 text-orange-500" />;
            default: return <Clock className="h-4 w-4 text-blue-500" />;
        }
    };

    const handleUpdateStatus = (status) => {
        updateMutation.mutate({
            id: complaintId,
            status,
            resolutionNotes: responseNotes || undefined
        }, {
            onSuccess: () => {
                setResponseNotes("");
                // Optionally refresh or handled by query invalidation
            }
        });
    };

    const handleSendComment = () => {
        if (!newComment.trim()) return;
        addCommentMutation.mutate({
            complaintId,
            userId: user?.id,
            message: newComment
        }, {
            onSuccess: () => {
                setNewComment("");
            }
        });
    };

    if (isLoading) return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 border-[3px] border-gray-200 border-t-black rounded-full animate-spin" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Loading Record...</p>
            </div>
        </div>
    );

    if (error || !complaint) return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="text-center">
                <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900">Record Not Found</h3>
                <p className="text-sm text-gray-500 mb-6">The requested grievance record does not exist or has been archived.</p>
                <Button onClick={() => router.back()} variant="outline">Go Back</Button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/30 pb-20 font-sans tracking-tight">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16 shadow-sm shadow-black/5">
                <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-gray-100" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4 text-gray-500" />
                        </Button>
                        <div className="h-6 w-px bg-gray-200" />
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Grievance Record</h1>
                                <Badge variant="outline" className={`${getStatusTheme(complaint.status)} px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md border`}>
                                    {complaint.status.replace('_', ' ')}
                                </Badge>
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ">
                                {complaint.uid || `#${complaint.id.slice(-8).toUpperCase()}`}
                                <span className="h-0.5 w-0.5 rounded-full bg-gray-300" />
                                <span className="text-gray-400">{format(new Date(complaint.createdAt), 'MMM dd, yyyy')}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {complaint.status !== 'RESOLVED' && complaint.status !== 'REJECTED' && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button className="h-9 px-4 rounded-xl bg-black hover:bg-gray-900 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm flex items-center gap-2">
                                        Update Status <MoreVertical className="h-3.5 w-3.5 opacity-70" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl border-gray-100 shadow-xl p-1 w-48 bg-white">
                                    <DropdownMenuItem className="rounded-lg text-[10px] font-bold uppercase tracking-wider py-2.5 cursor-pointer focus:bg-emerald-50 focus:text-emerald-700" onClick={() => handleUpdateStatus('RESOLVED')}>
                                        <CheckCircle className="h-3.5 w-3.5 mr-2" /> Mark Resolved
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="rounded-lg text-[10px] font-bold uppercase tracking-wider py-2.5 cursor-pointer focus:bg-amber-50 focus:text-amber-700" onClick={() => handleUpdateStatus('IN_PROGRESS')}>
                                        <Zap className="h-3.5 w-3.5 mr-2" /> In Progress
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="rounded-lg text-[10px] font-bold uppercase tracking-wider py-2.5 cursor-pointer focus:bg-rose-50 focus:text-rose-700 text-rose-500" onClick={() => handleUpdateStatus('REJECTED')}>
                                        <XCircle className="h-3.5 w-3.5 mr-2" /> Reject
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Details & Resolution (2/3) */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Primary Issue Card */}
                    <Card className="rounded-[2rem] border-gray-100 shadow-sm overflow-hidden bg-white">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-50 p-6 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                                    <FileText className="h-5 w-5 text-gray-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-bold text-gray-900 uppercase tracking-widest">Issue Details</CardTitle>
                                    <CardDescription className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Categorized Report</CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200">
                                    {getPriorityIcon(complaint.priority)}
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">{complaint.priority} Priority</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100">
                                    <Hash className="h-3 w-3 text-indigo-500" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600">{complaint.category}</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                            <h2 className="text-xl font-bold text-gray-900 leading-tight mb-4">{complaint.title}</h2>
                            <p className="text-sm text-gray-600 leading-relaxed font-medium bg-gray-50/50 p-6 rounded-2xl border border-gray-100 border-dashed">
                                "{complaint.description}"
                            </p>

                            <div className="grid grid-cols-2 gap-6 mt-8">
                                <div className="flex gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                    <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Location Node</p>
                                        <p className="text-xs font-bold text-gray-900 uppercase">{complaint.Hostel?.name}</p>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase mt-0.5">Room {complaint.roomNumber || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                    <ShieldCheck className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Assigned To</p>
                                        <p className="text-xs font-bold text-gray-900 uppercase">{complaint.User_Complaint_assignedToIdToUser?.name || 'Unassigned'}</p>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase mt-0.5">{complaint.User_Complaint_assignedToIdToUser ? 'Staff Member' : 'Pending Assignment'}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Resolution Protocol */}
                    <Card className="rounded-[2rem] border-gray-100 shadow-sm overflow-hidden bg-white">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-50 p-6">
                            <CardTitle className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-emerald-500" /> Resolution Protocol
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            {(complaint.status === 'RESOLVED' || complaint.status === 'REJECTED') ? (
                                <div className={`p-6 rounded-2xl border ${complaint.status === 'RESOLVED' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                                    <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${complaint.status === 'RESOLVED' ? 'text-emerald-500' : 'text-rose-500'}`}>Final Status: {complaint.status}</p>
                                    <p className={`text-sm font-bold ${complaint.status === 'RESOLVED' ? 'text-emerald-900' : 'text-rose-900'}`}>
                                        {complaint.resolutionNotes || "No resolution notes provided."}
                                    </p>
                                    {complaint.resolvedAt && (
                                        <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mt-4 flex items-center gap-1.5">
                                            <Clock className="h-3 w-3" /> Closed on {format(new Date(complaint.resolvedAt), 'MMM dd, yyyy HH:mm')}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Update Resolution Notes</Label>
                                        <Textarea
                                            placeholder="Document steps taken or instructions for staff..."
                                            className="min-h-[120px] rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white font-medium text-sm transition-all focus:ring-0 p-4"
                                            value={responseNotes}
                                            onChange={(e) => setResponseNotes(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button
                                            className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/20"
                                            onClick={() => handleUpdateStatus('RESOLVED')}
                                            disabled={updateMutation.isPending}
                                        >
                                            Resolve & Close
                                        </Button>
                                        <Button
                                            className="flex-1 h-11 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 font-bold text-[10px] uppercase tracking-wider rounded-xl"
                                            onClick={() => handleUpdateStatus('IN_PROGRESS')}
                                            disabled={updateMutation.isPending}
                                        >
                                            Update Progress
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Resident & Comments (1/3) */}
                <div className="space-y-8">
                    {/* Resident Profile */}
                    <Card className="rounded-[2.5rem] border-gray-100 shadow-sm overflow-hidden bg-white">
                        <div className="bg-black p-8 text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/5 skew-y-6 scale-150 origin-bottom-left" />
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="h-20 w-20 rounded-2xl bg-white border-4 border-white/10 shadow-xl mb-4 flex items-center justify-center text-black">
                                    <User className="h-8 w-8" />
                                </div>
                                <h3 className="text-lg font-bold text-white uppercase tracking-tight">{complaint.User_Complaint_userIdToUser?.name}</h3>
                                <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mt-1">{complaint.User_Complaint_userIdToUser?.role || 'Resident'}</p>

                                {complaint.User_Complaint_userIdToUser?.email && (
                                    <Badge variant="outline" className="mt-4 bg-white/10 text-white border-white/10 px-3 py-1 rounded-full text-[9px] uppercase tracking-wider backdrop-blur-md">
                                        {complaint.User_Complaint_userIdToUser.email}
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between py-3 border-b border-gray-50">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone</span>
                                <span className="text-xs font-bold text-gray-900">{complaint.User_Complaint_userIdToUser?.phone || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between py-3">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Resident ID</span>
                                <span className="text-xs font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md text-[10px]">{complaint.User_Complaint_userIdToUser?.id?.slice(0, 8).toUpperCase()}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Chat / Comments */}
                    <Card className="rounded-[2.5rem] border-gray-100 shadow-sm overflow-hidden bg-white h-[500px] flex flex-col">
                        <CardHeader className="bg-white border-b border-gray-50 py-4 px-6 shrink-0">
                            <CardTitle className="text-xs font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                <MessageSquare className="h-3.5 w-3.5 text-indigo-500" /> Discussion Feed
                            </CardTitle>
                        </CardHeader>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
                            {complaint.comments && complaint.comments.length > 0 ? (
                                complaint.comments.map((comment, index) => {
                                    const isStaff = comment.User.role === 'ADMIN' || comment.User.role === 'WARDEN' || comment.User.role === 'STAFF';
                                    return (
                                        <div key={index} className={`flex gap-3 ${isStaff ? 'flex-row-reverse' : ''}`}>
                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border z-10 ${isStaff ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200'}`}>
                                                <span className="text-[10px] font-black">{comment.User.name?.charAt(0)}</span>
                                            </div>
                                            <div className={`p-4 rounded-3xl max-w-[85%] text-xs font-medium leading-relaxed relative ${isStaff ? 'bg-black text-white rounded-tr-sm' : 'bg-white text-gray-700 border border-gray-100 shadow-sm rounded-tl-sm'}`}>
                                                <div className={`mb-1.5 flex items-center gap-2 ${isStaff ? 'flex-row-reverse' : ''}`}>
                                                    <span className={`text-[8px] font-black uppercase tracking-widest ${isStaff ? 'text-gray-400' : 'text-gray-400'}`}>{comment.User.name}</span>
                                                    <span className="text-[8px] opacity-40">{format(new Date(comment.createdAt), 'HH:mm')}</span>
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

                        <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Type a message..."
                                    className="h-11 rounded-2xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-0 font-medium text-xs"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendComment();
                                        }
                                    }}
                                />
                                <Button size="icon" className="h-11 w-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shrink-0 shadow-lg shadow-indigo-600/20" onClick={handleSendComment} disabled={addCommentMutation.isPending}>
                                    <Send className="h-4 w-4 text-white" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default ComplaintDetailPage;
