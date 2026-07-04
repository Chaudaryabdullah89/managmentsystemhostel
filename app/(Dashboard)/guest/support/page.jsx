"use client";

import React, { useState, useEffect } from 'react';
import {
    LifeBuoy,
    Plus,
    Clock,
    AlertTriangle,
    ChevronRight,
    Search,
    Activity,
    Send,
    CheckCircle2,
    Calendar,
    Zap,
    Wind,
    ShieldCheck,
    Wrench,
    MessageSquare,
    ClipboardList,
    PhoneCall,
    MessageCircle,
    Droplets,
    Wifi,
    Sparkles,
    Utensils,
    Layers,
    Filter
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import useAuthStore from "@/hooks/Authstate";
import { useUserDetailedProfile } from "@/hooks/useusers";
import { useCreateComplaint, useAddComplaintComment } from "@/hooks/usecomplaints";
import { format } from "date-fns";

const StatusBadge = ({ status }) => {
    const formattedStatus = status?.toUpperCase();
    switch (formattedStatus) {
        case 'RESOLVED':
        case 'COMPLETED':
        case 'FIXED':
            return (
                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-lg">
                    Resolved ✓
                </Badge>
            );
        case 'IN_PROGRESS':
        case 'PROGRESS':
        case 'PROCESSING':
            return (
                <Badge className="bg-blue-50 text-blue-700 border border-blue-200/80 text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-lg animate-pulse">
                    In Progress ⚙️
                </Badge>
            );
        case 'PENDING':
        case 'SENT':
            return (
                <Badge className="bg-amber-50 text-amber-700 border border-amber-200/80 text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-lg">
                    Pending
                </Badge>
            );
        case 'REJECTED':
            return (
                <Badge className="bg-rose-50 text-rose-700 border border-rose-200/80 text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-lg">
                    Rejected
                </Badge>
            );
        default:
            return (
                <Badge className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-lg">
                    {status}
                </Badge>
            );
    }
};

const PriorityBadge = ({ priority }) => {
    switch (priority?.toLowerCase()) {
        case 'high':
        case 'urgent':
            return (
                <div className="flex items-center gap-1 text-[9.5px] font-black uppercase text-rose-600 tracking-wider bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                    <AlertTriangle className="h-3 w-3" /> Urgent
                </div>
            );
        case 'medium':
            return (
                <div className="flex items-center gap-1 text-[9.5px] font-black uppercase text-amber-600 tracking-wider bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Medium
                </div>
            );
        default:
            return (
                <div className="flex items-center gap-1 text-[9.5px] font-black uppercase text-slate-400 tracking-wider bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                    Normal
                </div>
            );
    }
};

const ServiceCard = ({ icon: Icon, title, status, date, notes, color }) => (
    <div className="bg-white/90 dark:bg-card border border-slate-100 dark:border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex items-start gap-4">
        <div className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center shrink-0 shadow-sm`}>
            <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-foreground tracking-tight">{title}</h4>
                <StatusBadge status={status} />
            </div>
            <p className="text-[11px] text-slate-500 font-medium">{notes || 'Standard service cycle performed.'}</p>
            <div className="flex items-center gap-2 pt-1">
                <Clock className="h-3 w-3 text-slate-300" />
                <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest">
                    {date ? format(new Date(date), 'MMM dd, yyyy • hh:mm a') : 'N/A'}
                </span>
            </div>
        </div>
    </div>
);

const GuestSupportPage = () => {
    const user = useAuthStore((state) => state.user);
    const { data: userData, isLoading, refetch } = useUserDetailedProfile(user?.id);
    const createComplaintMutation = useCreateComplaint();
    const addCommentMutation = useAddComplaintComment();

    const [activeTab, setActiveTab] = useState("issues");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [newComment, setNewComment] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "MAINTENANCE",
        priority: "MEDIUM"
    });

    const bookings = userData?.bookings || [];
    const activeBooking = bookings.find(b => b.status === 'CONFIRMED' || b.status === 'CHECKED_IN');
    const isCheckedOut = bookings.length > 0 && !activeBooking;
    const room = activeBooking?.room || bookings[0]?.Room;

    // RBAC & System Settings
    const sysSettings = user?.systemSettings || {};
    const isComplaintsEnabled = sysSettings.enableComplaintsSystem !== false;
    const isLaundryEnabled = sysSettings.enableLaundry !== false;
    const isCleaningEnabled = sysSettings.enableCleaningLogs !== false;
    const isRoomServicesEnabled = isLaundryEnabled || isCleaningEnabled;
    const isAdmin = user?.role === 'ADMIN';

    useEffect(() => {
        if (!isComplaintsEnabled && activeTab === "issues") {
            setActiveTab("services");
        }
    }, [isComplaintsEnabled, activeTab]);

    // Combine complaints and maintenance tasks
    const issues = [
        ...(userData?.complaints || []).map(c => ({ ...c, type: 'COMPLAINT' })),
        ...(userData?.maintenanceTasks || []).map(m => ({ ...m, type: 'MAINTENANCE' }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const categoryFilters = [
        { id: 'ALL', label: 'All Requests', icon: Layers },
        { id: 'ELECTRICAL', label: 'Electrical', icon: Zap },
        { id: 'PLUMBING', label: 'Plumbing', icon: Droplets },
        { id: 'INTERNET', label: 'WiFi / Net', icon: Wifi },
        { id: 'CLEANLINESS', label: 'Cleaning', icon: Sparkles },
        { id: 'MESS', label: 'Mess Food', icon: Utensils },
        { id: 'MAINTENANCE', label: 'Furniture', icon: Wrench },
        { id: 'SECURITY', label: 'Security', icon: ShieldCheck },
    ];

    const filteredIssues = issues.filter(issue => {
        const matchesSearch =
            issue.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            issue.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory =
            selectedCategoryFilter === "ALL" ||
            issue.category?.toUpperCase() === selectedCategoryFilter;
        return matchesSearch && matchesCategory;
    });

    const activeIssue = selectedIssue ? (issues.find(i => i.id === selectedIssue.id) || selectedIssue) : null;

    const handleSendComment = (complaintId) => {
        if (!newComment.trim() || isCheckedOut) return;
        addCommentMutation.mutate({
            complaintId,
            userId: user?.id,
            message: newComment
        }, {
            onSuccess: () => {
                setNewComment("");
                refetch();
                toast.success("Comment posted successfully!");
            }
        });
    };

    const handleInputChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isCheckedOut) {
            toast.error("Account Restricted", { description: "Checked-out residents cannot submit new requests." });
            return;
        }
        if (!formData.title || !formData.description) {
            toast.error("Please fill in all required fields.");
            return;
        }

        try {
            await createComplaintMutation.mutateAsync({
                ...formData,
                userId: user?.id,
                hostelId: activeBooking?.Room?.hostelId || userData?.residentProfile?.currentHostelId,
                status: "PENDING"
            });
            setIsDialogOpen(false);
            setFormData({ title: "", description: "", category: "MAINTENANCE", priority: "MEDIUM" });
            refetch();
            toast.success("Support ticket submitted successfully!", { description: "Our maintenance warden will review your request shortly." });
        } catch (error) {
            console.error("Failed to submit support request", error);
            toast.error("Submission failed", { description: error.message || "Something went wrong." });
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50/50 dark:bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Activity className="h-8 w-8 text-indigo-600 animate-spin" />
                    <p className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-[0.2em]">Syncing Support Desk...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-background pb-20">
            {/* Top Glassmorphic Header */}
            <header className="bg-white/80 dark:bg-card/80 backdrop-blur-md border-b sticky top-0 z-40 h-20 shadow-xs">
                <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                            <LifeBuoy className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-base font-black text-slate-900 dark:text-foreground tracking-tight uppercase">
                                    Support & Maintenance Hub
                                </h1>
                                <span className="px-2 py-0.5 text-[8.5px] font-extrabold bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200/60 uppercase">
                                    Live Desk
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider">
                                    {isCheckedOut ? 'Archived Records' : `Room #${room?.roomNumber || 'N/A'}`}
                                </span>
                                <div className={`h-1.5 w-1.5 rounded-full ${isCheckedOut ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
                                <span className={`text-[10.5px] font-extrabold uppercase tracking-wider ${isCheckedOut ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    {isCheckedOut ? 'Residency Ended' : 'Active Resident'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {isComplaintsEnabled || isAdmin ? (
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button
                                        className={`h-11 px-6 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md ${isCheckedOut ? 'bg-gray-100 text-gray-400 dark:text-muted-foreground cursor-not-allowed border' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20 active:scale-95'}`}
                                        onClick={(e) => {
                                            if (isCheckedOut) {
                                                e.preventDefault();
                                                toast.error("Action Restricted", { description: "You cannot submit requests after checkout." });
                                            }
                                        }}
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> New Support Ticket
                                    </Button>
                                </DialogTrigger>

                                <DialogContent className="sm:max-w-[500px] rounded-3xl border-none p-0 overflow-hidden shadow-2xl bg-white dark:bg-card">
                                    <DialogHeader className="p-6 bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex flex-row items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
                                            <LifeBuoy className="h-6 w-6 text-indigo-200" />
                                        </div>
                                        <div className="text-left">
                                            <DialogTitle className="text-base font-black text-white uppercase tracking-wide">Log Maintenance Ticket</DialogTitle>
                                            <DialogDescription className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mt-1">Our warden team will resolve your issue promptly</DialogDescription>
                                        </div>
                                    </DialogHeader>

                                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Category</Label>
                                                <Select value={formData.category} onValueChange={(val) => handleInputChange("category", val)}>
                                                    <SelectTrigger className="h-11 rounded-xl border-slate-200 font-bold uppercase text-[10.5px] tracking-wider bg-slate-50/50">
                                                        <SelectValue placeholder="Select Category" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl p-1 shadow-2xl border-slate-100">
                                                        <SelectItem value="MAINTENANCE" className="rounded-xl text-[10px] uppercase font-bold py-2.5">Room Maintenance</SelectItem>
                                                        <SelectItem value="ELECTRICAL" className="rounded-xl text-[10px] uppercase font-bold py-2.5">Electrical / Power</SelectItem>
                                                        <SelectItem value="PLUMBING" className="rounded-xl text-[10px] uppercase font-bold py-2.5">Plumbing / Water</SelectItem>
                                                        <SelectItem value="INTERNET" className="rounded-xl text-[10px] uppercase font-bold py-2.5">WiFi & Internet</SelectItem>
                                                        <SelectItem value="CLEANLINESS" className="rounded-xl text-[10px] uppercase font-bold py-2.5">Housekeeping</SelectItem>
                                                        <SelectItem value="SECURITY" className="rounded-xl text-[10px] uppercase font-bold py-2.5">Security & Keys</SelectItem>
                                                        <SelectItem value="OTHER" className="rounded-xl text-[10px] uppercase font-bold py-2.5">Other Support</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Urgency Level</Label>
                                                <Select value={formData.priority} onValueChange={(val) => handleInputChange("priority", val)}>
                                                    <SelectTrigger className="h-11 rounded-xl border-slate-200 font-bold uppercase text-[10.5px] tracking-wider bg-slate-50/50">
                                                        <SelectValue placeholder="Select Urgency" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl p-1 shadow-2xl border-slate-100">
                                                        <SelectItem value="LOW" className="rounded-xl text-[10px] uppercase font-bold py-2.5">Low - Routine</SelectItem>
                                                        <SelectItem value="MEDIUM" className="rounded-xl text-[10px] uppercase font-bold py-2.5">Medium - Normal</SelectItem>
                                                        <SelectItem value="HIGH" className="rounded-xl text-[10px] uppercase font-bold py-2.5 text-rose-600">High - Priority</SelectItem>
                                                        <SelectItem value="URGENT" className="rounded-xl text-[10px] uppercase font-bold py-2.5 text-rose-600">Emergency 🚨</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Subject / Title</Label>
                                            <Input
                                                className="h-11 rounded-xl border-slate-200 font-bold text-xs bg-slate-50/50"
                                                placeholder="e.g., Light bulb is fused in Room 204"
                                                value={formData.title}
                                                onChange={(e) => handleInputChange("title", e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Problem Description</Label>
                                            <Textarea
                                                className="rounded-xl border-slate-200 font-semibold text-xs min-h-[100px] bg-slate-50/50"
                                                placeholder="Describe the issue clearly so maintenance staff can resolve it quickly..."
                                                value={formData.description}
                                                onChange={(e) => handleInputChange("description", e.target.value)}
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={createComplaintMutation.isPending}
                                            className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                                        >
                                            {createComplaintMutation.isPending ? "Submitting Ticket..." : "Submit Maintenance Ticket"}
                                        </Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        ) : (
                            <Badge className="bg-amber-50 text-amber-700 border border-amber-200 px-4 py-2 rounded-xl text-[10px] uppercase font-bold tracking-wider">
                                Complaints Desk Offline
                            </Badge>
                        )}
                    </div>
                </div>
            </header>

            {/* Quick Emergency Banner */}
            <div className="max-w-6xl mx-auto px-6 mt-6">
                <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-5 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
                            <PhoneCall className="h-5 w-5 text-blue-300" />
                        </div>
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-wide">Emergency Assistance & Warden Connect</h3>
                            <p className="text-[11px] text-blue-200 font-medium">Need immediate help? Call the hostel office or warden desk directly.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <a
                            href="tel:+923001234567"
                            className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-[10.5px] font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                        >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>Call Warden</span>
                        </a>
                        <a
                            href="https://wa.me/923001234567"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-[10.5px] font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                        >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp Desk</span>
                        </a>
                    </div>
                </div>
            </div>

            {/* Main Content & Tabs */}
            <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                        <TabsList className="bg-white dark:bg-card border border-slate-200 dark:border-border p-1 rounded-2xl shadow-2xs h-13 w-fit">
                            {(isComplaintsEnabled || isAdmin) && (
                                <TabsTrigger value="issues" className="rounded-xl px-6 data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-extrabold text-[10.5px] uppercase tracking-wider h-full transition-all">
                                    Support Tickets ({filteredIssues.length})
                                </TabsTrigger>
                            )}
                            {(isRoomServicesEnabled || isAdmin) && (
                                <TabsTrigger value="services" className="rounded-xl px-6 data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-extrabold text-[10.5px] uppercase tracking-wider h-full transition-all">
                                    Room Services Logs
                                </TabsTrigger>
                            )}
                        </TabsList>

                        <div className="flex items-center gap-3 w-full md:w-auto min-w-[280px]">
                            <div className="relative flex-1">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search tickets by title or description..."
                                    className="h-11 pl-10 rounded-xl bg-white dark:bg-card border-slate-200 shadow-2xs font-semibold text-xs placeholder:text-slate-400"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Category Filter Pills (when on issues tab) */}
                    {activeTab === "issues" && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-4 custom-scrollbar">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 shrink-0 mr-1">
                                <Filter className="h-3 w-3" /> Filter:
                            </span>
                            {categoryFilters.map((cat) => {
                                const IconComp = cat.icon;
                                const isSelected = selectedCategoryFilter === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setSelectedCategoryFilter(cat.id)}
                                        className={`px-3 py-1.5 rounded-xl border text-[10.5px] font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-all ${isSelected
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                                            }`}
                                    >
                                        <IconComp className="h-3.5 w-3.5" />
                                        <span>{cat.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <TabsContent value="issues" className="mt-0 focus-visible:outline-none">
                        <div className="grid grid-cols-1 gap-4">
                            {filteredIssues.length > 0 ? filteredIssues.map((issue) => (
                                <div
                                    key={issue.id}
                                    onClick={() => setSelectedIssue(issue)}
                                    className="bg-white dark:bg-card border border-slate-200/80 dark:border-border rounded-2xl p-6 shadow-2xs hover:shadow-md transition-all group cursor-pointer relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6"
                                >
                                    <div className="flex items-start gap-4 relative z-10">
                                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 ${issue.type === 'MAINTENANCE' ? 'bg-amber-50 border-amber-200 text-amber-600 group-hover:bg-amber-600 group-hover:text-white' : 'bg-indigo-50 border-indigo-200 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                                            {issue.type === 'MAINTENANCE' ? <Wrench className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
                                        </div>
                                        <div className="space-y-1 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                                                    #{issue.uid || issue.id.slice(-6).toUpperCase()}
                                                </span>
                                                <span className="h-3 w-px bg-slate-200" />
                                                <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest">
                                                    {issue.category?.replace('_', ' ') || 'GENERAL'}
                                                </span>
                                            </div>
                                            <h3 className="text-base font-extrabold text-slate-900 dark:text-foreground tracking-tight group-hover:text-indigo-600 transition-colors">
                                                {issue.title}
                                            </h3>
                                            <p className="text-xs text-slate-500 font-medium line-clamp-1 max-w-xl">
                                                {issue.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-6 md:min-w-[240px] relative z-10">
                                        <div className="flex flex-col items-end gap-1.5">
                                            <StatusBadge status={issue.status} />
                                            <PriorityBadge priority={issue.priority} />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right hidden sm:block">
                                                <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Date</span>
                                                <span className="block text-[10px] font-bold text-slate-600 uppercase">
                                                    {issue.updatedAt || issue.createdAt ? format(new Date(issue.updatedAt || issue.createdAt), 'MMM dd, yyyy') : 'N/A'}
                                                </span>
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-20 bg-white dark:bg-card rounded-3xl border border-dashed border-slate-200">
                                    <div className="bg-slate-50 h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                        <ShieldCheck className="h-8 w-8 text-slate-400" />
                                    </div>
                                    <h3 className="text-base font-extrabold text-slate-900 uppercase">No Support Tickets Found</h3>
                                    <p className="text-xs text-slate-400 font-semibold mt-1 max-w-xs mx-auto">You have no active maintenance issues or complaints matching your filter.</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="services" className="mt-0 focus-visible:outline-none">
                        <div className="space-y-8">
                            {/* Stats Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-6 text-white relative overflow-hidden group shadow-md">
                                    <p className="text-[10px] font-extrabold uppercase tracking-widest opacity-80 mb-1">Room Status</p>
                                    <h3 className="text-2xl font-black tracking-tight uppercase mb-4">{room?.status || 'Active'}</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">Room Operational</span>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-card border border-slate-200 rounded-3xl p-6 relative overflow-hidden shadow-2xs group">
                                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Last Cleaning</p>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase mb-4">
                                        {room?.CleaningLog?.[0]?.createdAt ? format(new Date(room.CleaningLog[0].createdAt), 'MMM dd, yyyy') : 'N/A'}
                                    </h3>
                                    <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-[9.5px] font-black uppercase tracking-wider">Confirmed Done</span>
                                </div>

                                <div className="bg-white dark:bg-card border border-slate-200 rounded-3xl p-6 relative overflow-hidden shadow-2xs group">
                                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Laundry Status</p>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase mb-4">
                                        {room?.LaundryLog?.[0]?.status || 'Idle'}
                                    </h3>
                                    <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-[9.5px] font-black uppercase tracking-wider">Latest Update</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Housekeeping & Cleaning History</h4>
                                        <Badge variant="outline" className="text-[9px] uppercase tracking-wider border-slate-200">{room?.CleaningLog?.length || 0} Cycles</Badge>
                                    </div>
                                    <div className="space-y-3">
                                        {room?.CleaningLog?.length > 0 ? room.CleaningLog.map((log) => (
                                            <ServiceCard
                                                key={log.id}
                                                icon={CheckCircle2}
                                                title="Room Housekeeping"
                                                status={log.status}
                                                date={log.createdAt}
                                                notes={log.notes}
                                                color="bg-emerald-50 text-emerald-600"
                                            />
                                        )) : (
                                            <p className="text-center py-10 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest border border-dashed rounded-2xl bg-white">No housekeeping records found</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Laundry Cycles History</h4>
                                        <Badge variant="outline" className="text-[9px] uppercase tracking-wider border-slate-200">{room?.LaundryLog?.length || 0} Batches</Badge>
                                    </div>
                                    <div className="space-y-3">
                                        {room?.LaundryLog?.length > 0 ? room.LaundryLog.map((log) => (
                                            <ServiceCard
                                                key={log.id}
                                                icon={Wind}
                                                title={`Laundry Batch (${log.itemsCount || 0} Items)`}
                                                status={log.status}
                                                date={log.createdAt}
                                                notes={log.notes}
                                                color="bg-indigo-50 text-indigo-600"
                                            />
                                        )) : (
                                            <p className="text-center py-10 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest border border-dashed rounded-2xl bg-white">No laundry records found</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>

            {/* Ticket Interaction & Discussion Modal */}
            <Dialog open={!!selectedIssue} onOpenChange={(open) => !open && setSelectedIssue(null)}>
                <DialogContent className="max-w-xl p-0 overflow-hidden border-none rounded-3xl shadow-2xl bg-white dark:bg-card">
                    {activeIssue && (
                        <div>
                            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center text-white shadow-md ${activeIssue.type === 'MAINTENANCE' ? 'bg-amber-600' : 'bg-indigo-600'}`}>
                                        {activeIssue.type === 'MAINTENANCE' ? <Wrench className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black uppercase tracking-tight">Ticket #{activeIssue.uid || activeIssue.id.slice(-6).toUpperCase()}</h3>
                                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">
                                            {activeIssue.category?.replace('_', ' ') || 'GENERAL'} • Priority: {activeIssue.priority}
                                        </p>
                                    </div>
                                </div>
                                <StatusBadge status={activeIssue.status} />
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                                    <h4 className="text-xs font-black text-indigo-700 uppercase tracking-wider">{activeIssue.title}</h4>
                                    <p className="text-xs text-slate-600 font-medium leading-relaxed italic">"{activeIssue.description}"</p>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conversation & Ticket Updates</h4>

                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {activeIssue.comments?.map((comment) => (
                                            <div key={comment.id} className={`flex gap-2.5 ${comment.User.id === user?.id ? 'flex-row-reverse' : ''}`}>
                                                <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 border text-[10px] font-black ${comment.User.id === user?.id ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                                                    {comment.User.name?.charAt(0)}
                                                </div>
                                                <div className={`p-3 rounded-2xl max-w-[85%] text-xs ${comment.User.id === user?.id ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
                                                    <div className="flex items-center gap-2 mb-1 justify-between text-[9px] font-bold uppercase tracking-wider opacity-80">
                                                        <span>{comment.User.name}</span>
                                                        <span>{comment.createdAt ? new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                                    </div>
                                                    <p className="font-medium leading-relaxed">{comment.message}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {(!activeIssue.comments || activeIssue.comments.length === 0) && (
                                            <div className="text-center py-8 opacity-40">
                                                <ClipboardList className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">No updates logged yet on this ticket</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 pt-2">
                                        <Input
                                            placeholder="Type a message or response..."
                                            className="h-12 rounded-xl bg-slate-50 border-slate-200 font-medium text-xs"
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendComment(activeIssue.id);
                                                }
                                            }}
                                        />
                                        <Button
                                            className="h-12 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shrink-0 shadow-sm"
                                            onClick={() => handleSendComment(activeIssue.id)}
                                            disabled={addCommentMutation.isPending || !newComment.trim()}
                                        >
                                            <Send className="h-4 w-4 mr-1" /> Send
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default GuestSupportPage;
