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
    LucideIcon
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
    DialogFooter
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
            return <Badge className="bg-emerald-50 text-emerald-600 border-none text-[9px] uppercase font-bold tracking-wider px-2 py-0.5">Resolved</Badge>;
        case 'IN_PROGRESS':
        case 'PROGRESS':
        case 'PROCESSING':
            return <Badge className="bg-blue-50 text-blue-600 border-none text-[9px] uppercase font-bold tracking-wider px-2 py-0.5">In Progress</Badge>;
        case 'PENDING':
        case 'SENT':
            return <Badge className="bg-amber-50 text-amber-600 border-none text-[9px] uppercase font-bold tracking-wider px-2 py-0.5">Pending</Badge>;
        case 'REJECTED':
            return <Badge className="bg-rose-50 text-rose-600 border-none text-[9px] uppercase font-bold tracking-wider px-2 py-0.5">Rejected</Badge>;
        default:
            return <Badge className="bg-gray-50 text-gray-500 border-none text-[9px] uppercase font-bold tracking-wider px-2 py-0.5">{status}</Badge>;
    }
};

const PriorityBadge = ({ priority }) => {
    switch (priority?.toLowerCase()) {
        case 'high':
        case 'urgent':
            return <div className="flex items-center gap-1 text-[9px] font-bold uppercase text-rose-600 tracking-wider"><AlertTriangle className="h-3 w-3" /> High Priority</div>;
        case 'medium':
            return <div className="flex items-center gap-1 text-[9px] font-bold uppercase text-amber-600 tracking-wider">Medium Priority</div>;
        default:
            return <div className="flex items-center gap-1 text-[9px] font-bold uppercase text-gray-400 tracking-wider">Low Priority</div>;
    }
};

const ServiceCard = ({ icon: Icon, title, status, date, notes, color }) => (
    <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex items-start gap-4">
        <div className={`h-11 w-11 rounded-2xl ${color} flex items-center justify-center shrink-0`}>
            <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-900 tracking-tight">{title}</h4>
                <StatusBadge status={status} />
            </div>
            <p className="text-[10px] text-gray-500 font-medium">{notes || 'Standard service cycle performed.'}</p>
            <div className="flex items-center gap-2 pt-1">
                <Clock className="h-3 w-3 text-gray-300" />
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{format(new Date(date), 'MMM dd, yyyy • hh:mm a')}</span>
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

    // Combine complaints and maintenance tasks
    const issues = [
        ...(userData?.complaints || []).map(c => ({ ...c, type: 'COMPLAINT' })),
        ...(userData?.maintenanceTasks || []).map(m => ({ ...m, type: 'MAINTENANCE' }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const filteredIssues = issues.filter(issue =>
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
            toast.error("Please fill in all fields");
            return;
        }

        try {
            // For now everything goes through complaints with specific category
            await createComplaintMutation.mutateAsync({
                ...formData,
                userId: user?.id,
                hostelId: activeBooking?.Room?.hostelId || userData?.residentProfile?.currentHostelId,
                status: "PENDING"
            });
            setIsDialogOpen(false);
            setFormData({ title: "", description: "", category: "MAINTENANCE", priority: "MEDIUM" });
            refetch();
        } catch (error) {
            console.error("Failed to submit support request", error);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                <div className="flex flex-col items-center gap-4">
                    <Activity className="h-8 w-8 text-indigo-600 animate-spin" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Syncing Support Data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-40 h-16 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-extrabold text-slate-900 tracking-tight uppercase">Services & Support</h1>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {isCheckedOut ? 'Archived Records' : `Room #${room?.roomNumber || 'N/A'}`}
                            </span>
                            <div className={`h-1 w-1 rounded-full ${isCheckedOut ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${isCheckedOut ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {isCheckedOut ? 'Residency Ended' : 'Active Stay'}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    className={`h-10 px-6 rounded-2xl font-bold text-[10px] uppercase tracking-wider transition-all active:scale-95 shadow-lg ${isCheckedOut ? 'bg-gray-100 text-gray-400 cursor-not-allowed border' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'}`}
                                    onClick={(e) => {
                                        if (isCheckedOut) {
                                            e.preventDefault();
                                            toast.error("Action Restricted", { description: "You cannot submit requests after checkout." });
                                        }
                                    }}
                                >
                                    <Plus className="h-4 w-4 mr-2" /> New Request
                                </Button>
                            </DialogTrigger>

                            <DialogContent className="sm:max-w-[480px] rounded-[2.5rem] border-none p-0 overflow-hidden shadow-2xl bg-white">
                                <DialogHeader className="p-8 bg-slate-50 border-b border-slate-100 flex flex-row items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100">
                                        <LifeBuoy className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="text-left">
                                        <DialogTitle className="text-lg font-bold text-slate-900 leading-none uppercase">Submit Request</DialogTitle>
                                        <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1.5">How can we help you today?</DialogDescription>
                                    </div>
                                </DialogHeader>
                                <div className="p-8 space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Category</Label>
                                        <Select value={formData.category} onValueChange={(val) => handleInputChange("category", val)}>
                                            <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-bold uppercase text-[10px] tracking-widest">
                                                <SelectValue placeholder="Select Category" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl p-1 shadow-2xl border-slate-100">
                                                <SelectItem value="MAINTENANCE" className="rounded-xl text-[10px] uppercase font-bold tracking-widest py-3 hover:bg-indigo-50">Room Maintenance</SelectItem>
                                                <SelectItem value="INTERNET" className="rounded-xl text-[10px] uppercase font-bold tracking-widest py-3 hover:bg-indigo-50">WiFi & Internet</SelectItem>
                                                <SelectItem value="CLEANLINESS" className="rounded-xl text-[10px] uppercase font-bold tracking-widest py-3 hover:bg-indigo-50">Housekeeping</SelectItem>
                                                <SelectItem value="SECURITY" className="rounded-xl text-[10px] uppercase font-bold tracking-widest py-3 hover:bg-indigo-50">Security & Keys</SelectItem>
                                                <SelectItem value="OTHER" className="rounded-xl text-[10px] uppercase font-bold tracking-widest py-3 hover:bg-indigo-50">Other Support</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Priority</Label>
                                        <Select value={formData.priority} onValueChange={(val) => handleInputChange("priority", val)}>
                                            <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-bold uppercase text-[10px] tracking-widest">
                                                <SelectValue placeholder="Select Urgency" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl p-1 shadow-2xl border-slate-100">
                                                <SelectItem value="LOW" className="rounded-xl text-[10px] uppercase font-bold tracking-widest py-3">Low - Routine</SelectItem>
                                                <SelectItem value="MEDIUM" className="rounded-xl text-[10px] uppercase font-bold tracking-widest py-3">Medium - Soon</SelectItem>
                                                <SelectItem value="HIGH" className="rounded-xl text-[10px] uppercase font-bold tracking-widest py-3">High - Priority</SelectItem>
                                                <SelectItem value="URGENT" className="rounded-xl text-[10px] uppercase font-bold tracking-widest py-3">Emergency - Urgent</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Summary</Label>
                                        <Input
                                            className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-bold text-xs"
                                            placeholder="What is the issue?"
                                            value={formData.title}
                                            onChange={(e) => handleInputChange("title", e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Detailed Description</Label>
                                        <Textarea
                                            className="rounded-xl border-slate-100 bg-slate-50/50 font-semibold text-xs min-h-[100px]"
                                            placeholder="Describe the problem in detail..."
                                            value={formData.description}
                                            onChange={(e) => handleInputChange("description", e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={createComplaintMutation.isPending}
                                        className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-95"
                                    >
                                        {createComplaintMutation.isPending ? "Sending..." : "Submit Support Ticket"}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
                        <TabsList className="bg-white border border-gray-100 p-1.5 rounded-2xl shadow-sm h-14 w-fit">
                            <TabsTrigger value="issues" className="rounded-xl px-8 data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-bold text-[10px] uppercase tracking-widest h-full transition-all">Support & Issues</TabsTrigger>
                            <TabsTrigger value="services" className="rounded-xl px-8 data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-bold text-[10px] uppercase tracking-widest h-full transition-all">Room Services</TabsTrigger>
                        </TabsList>

                        <div className="flex items-center gap-4 min-w-[300px]">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                <Input
                                    placeholder="Search History..."
                                    className="h-12 pl-12 rounded-2xl bg-white border-none shadow-sm font-medium text-xs placeholder:text-slate-300 focus:ring-2 ring-indigo-500/10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <TabsContent value="issues" className="mt-0 focus-visible:outline-none">
                        <div className="grid grid-cols-1 gap-4">
                            {filteredIssues.length > 0 ? filteredIssues.map((issue) => (
                                <div key={issue.id} onClick={() => setSelectedIssue(issue)} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-lg transition-all group cursor-pointer relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
                                    <div className="flex items-start gap-6 relative z-10">
                                        <div className={`h-14 w-14 rounded-[1.5rem] flex items-center justify-center shrink-0 border transition-all duration-500 ${issue.type === 'MAINTENANCE' ? 'bg-amber-50 border-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white' : 'bg-indigo-50 border-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                                            {issue.type === 'MAINTENANCE' ? <Wrench className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
                                        </div>
                                        <div className="space-y-1.5 flex-1">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">#{issue.id.slice(-6).toUpperCase()}</span>
                                                <span className="h-4 w-px bg-slate-100" />
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{issue.category.replace('_', ' ')}</span>
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors uppercase">{issue.title}</h3>
                                            <p className="text-sm text-slate-500 font-medium line-clamp-1 max-w-xl">{issue.description}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-10 md:min-w-[240px] relative z-10">
                                        <div className="flex flex-col items-end gap-2">
                                            <StatusBadge status={issue.status} />
                                            <PriorityBadge priority={issue.priority} />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <span className="block text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-0.5">Updated At</span>
                                                <span className="block text-[10px] font-bold text-slate-500 uppercase">{format(new Date(issue.updatedAt || issue.createdAt), 'MMM dd, yyyy')}</span>
                                            </div>
                                            <ChevronRight className="h-6 w-6 text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200">
                                    <div className="bg-slate-50 h-24 w-24 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-slate-100">
                                        <ShieldCheck className="h-10 w-10 text-slate-300" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 tracking-tight uppercase">System Status Clear</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2 max-w-xs mx-auto">No maintenance requests or support tickets found.</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="services" className="mt-0 focus-visible:outline-none">
                        <div className="space-y-10">
                            {/* Stats Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                                        <Zap className="h-20 w-20" />
                                    </div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mb-1">Room Status</p>
                                    <h3 className="text-3xl font-extrabold tracking-tighter uppercase mb-6">{room?.status || 'Active'}</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Fully Operational</span>
                                    </div>
                                </div>
                                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 relative overflow-hidden shadow-sm group">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform">
                                        <Calendar className="h-20 w-20" />
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Last Cleaning</p>
                                    <h3 className="text-3xl font-extrabold text-slate-900 tracking-tighter uppercase mb-6">
                                        {room?.CleaningLog?.[0] ? format(new Date(room.CleaningLog[0].createdAt), 'MMM dd') : 'N/A'}
                                    </h3>
                                    <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest">Confirmed Done</span>
                                </div>
                                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 relative overflow-hidden shadow-sm group">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-90 transition-transform">
                                        <Wind className="h-20 w-20" />
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Laundry Status</p>
                                    <h3 className="text-3xl font-extrabold text-slate-900 tracking-tighter uppercase mb-6">
                                        {room?.LaundryLog?.[0]?.status || 'Idle'}
                                    </h3>
                                    <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest leading-none">Latest Update</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between px-2">
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">Cleaning History</h4>
                                        <Badge variant="outline" className="text-[8px] uppercase tracking-widest border-slate-200">{room?.CleaningLog?.length || 0} Cycles</Badge>
                                    </div>
                                    <div className="space-y-4">
                                        {room?.CleaningLog?.length > 0 ? room.CleaningLog.map((log) => (
                                            <ServiceCard
                                                key={log.id}
                                                icon={CheckCircle2}
                                                title="Room Cleaning"
                                                status={log.status}
                                                date={log.createdAt}
                                                notes={log.notes}
                                                color="bg-emerald-50 text-emerald-600"
                                            />
                                        )) : (
                                            <p className="text-center py-10 text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-dashed rounded-3xl">No records found</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between px-2">
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">Laundry History</h4>
                                        <Badge variant="outline" className="text-[8px] uppercase tracking-widest border-slate-200">{room?.LaundryLog?.length || 0} Batches</Badge>
                                    </div>
                                    <div className="space-y-4">
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
                                            <p className="text-center py-10 text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-dashed rounded-3xl">No records found</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>

            {/* Detailed Issue Modal (Same as existing complaint logic but updated style) */}
            <Dialog open={!!selectedIssue} onOpenChange={(open) => !open && setSelectedIssue(null)}>
                <DialogContent className="max-w-xl p-0 overflow-hidden border-none rounded-[3rem] shadow-2xl bg-white">
                    {selectedIssue && (
                        <div>
                            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                                <div className="flex items-center gap-4">
                                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${selectedIssue.type === 'MAINTENANCE' ? 'bg-amber-600 shadow-amber-100' : 'bg-indigo-600 shadow-indigo-100'}`}>
                                        {selectedIssue.type === 'MAINTENANCE' ? <Wrench className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Issue #{selectedIssue.id.slice(-6).toUpperCase()}</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{selectedIssue.category.replace('_', ' ')} • {selectedIssue.status}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 space-y-8">
                                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-3">
                                    <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{selectedIssue.title}</h4>
                                    <p className="text-sm text-slate-600 font-medium leading-relaxed italic">"{selectedIssue.description}"</p>
                                </div>

                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] pl-2">Timeline Details</h4>

                                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-3 custom-scrollbar">
                                        {selectedIssue.comments?.map((comment) => (
                                            <div key={comment.id} className={`flex gap-3 ${comment.User.id === user?.id ? 'flex-row-reverse' : ''}`}>
                                                <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border ${comment.User.id === user?.id ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                                                    <span className="text-xs font-bold leading-none">{comment.User.name?.charAt(0)}</span>
                                                </div>
                                                <div className={`p-4 rounded-[1.5rem] max-w-[85%] ${comment.User.id === user?.id ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-50 border border-slate-100 rounded-tl-none'}`}>
                                                    <div className="flex items-center gap-3 mb-1 justify-between">
                                                        <span className={`text-[8px] font-bold uppercase tracking-widest ${comment.User.id === user?.id ? 'text-indigo-100' : 'text-slate-400'}`}>{comment.User.name}</span>
                                                        <span className={`text-[8px] uppercase tracking-widest opacity-50 font-bold`}>{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <p className="text-xs font-medium leading-relaxed">{comment.message}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {(!selectedIssue.comments || selectedIssue.comments.length === 0) && (
                                            <div className="text-center py-10 opacity-30 select-none">
                                                <ClipboardList className="h-10 w-10 mx-auto mb-2" />
                                                <p className="text-[10px] font-bold uppercase tracking-widest">Awaiting interaction</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 mt-4">
                                        <Input
                                            placeholder="Add an update..."
                                            className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-medium text-sm shadow-inner focus:ring-0"
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendComment(selectedIssue.id);
                                                }
                                            }}
                                        />
                                        <Button
                                            size="icon"
                                            className="h-14 w-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shrink-0 shadow-lg shadow-indigo-100 transition-all hover:scale-105"
                                            onClick={() => handleSendComment(selectedIssue.id)}
                                            disabled={addCommentMutation.isPending || !newComment.trim()}
                                        >
                                            <Send className="h-5 w-5 text-white" />
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
