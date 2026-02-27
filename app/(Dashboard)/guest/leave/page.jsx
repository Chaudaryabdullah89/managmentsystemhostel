"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft, Calendar, Clock, CheckCircle, AlertCircle,
    XCircle, Send, Plane, PlusCircle, Info, CalendarRange,
    PhoneCall, FileText, Loader2, Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import useAuthStore from "@/hooks/Authstate";
import { useBookings } from "@/hooks/useBooking";
import { format, differenceInDays } from "date-fns";

const StatusBadge = ({ status }) => {
    switch (status?.toUpperCase().replace('[LEAVE] ', '')) {
        case 'APPROVED':
            return <Badge className="bg-emerald-50 text-emerald-700 border-none text-[9px] font-bold uppercase px-3">Approved</Badge>;
        case 'REJECTED':
            return <Badge className="bg-rose-50 text-rose-700 border-none text-[9px] font-bold uppercase px-3">Rejected</Badge>;
        case 'PENDING':
            return <Badge className="bg-amber-50 text-amber-700 border-none text-[9px] font-bold uppercase px-3">Pending Review</Badge>;
        case 'IN_PROGRESS':
            return <Badge className="bg-blue-50 text-blue-700 border-none text-[9px] font-bold uppercase px-3">In Progress</Badge>;
        default:
            return <Badge className="bg-gray-50 text-gray-600 border-none text-[9px] font-bold uppercase px-3">{status}</Badge>;
    }
};

const GuestLeavePage = () => {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const { data: bookingsData } = useBookings({ userId: user?.id });
    const currentBooking = bookingsData?.find(b => ['CONFIRMED', 'CHECKED_IN'].includes(b.status));

    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [formData, setFormData] = useState({
        startDate: '',
        endDate: '',
        reason: '',
        emergencyContact: ''
    });

    const fetchLeaves = async () => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/leave?userId=${user.id}`);
            const data = await res.json();
            if (data.success) setLeaveRequests(data.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchLeaves(); }, [user?.id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.startDate || !formData.endDate || !formData.reason) {
            return toast.error("Please fill all required fields");
        }
        if (!currentBooking) {
            return toast.error("You need an active booking to request leave");
        }
        if (new Date(formData.startDate) >= new Date(formData.endDate)) {
            return toast.error("End date must be after start date");
        }
        if (new Date(formData.startDate) < new Date()) {
            return toast.error("Start date cannot be in the past");
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/leave', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    hostelId: currentBooking.Room?.hostelId,
                    roomId: currentBooking.roomId,
                    ...formData
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Leave request submitted successfully!");
                setIsOpen(false);
                setFormData({ startDate: '', endDate: '', reason: '', emergencyContact: '' });
                fetchLeaves();
            } else {
                toast.error(data.error || "Failed to submit request");
            }
        } catch (e) {
            toast.error("Failed to submit request");
        } finally {
            setIsSubmitting(false);
        }
    };

    const parseLeaveData = (leave) => {
        try {
            const desc = JSON.parse(leave.description);
            return {
                ...leave,
                startDate: desc.startDate,
                endDate: desc.endDate,
                reason: desc.reason,
                emergencyContact: desc.emergencyContact,
                duration: differenceInDays(new Date(desc.endDate), new Date(desc.startDate))
            };
        } catch {
            return { ...leave, startDate: null, endDate: null, reason: leave.description, duration: 0 };
        }
    };

    const parsedLeaves = leaveRequests.map(parseLeaveData);
    const pendingCount = parsedLeaves.filter(l => l.status === 'PENDING').length;
    const approvedCount = parsedLeaves.filter(l => l.status === 'APPROVED').length;

    return (
        <div className="min-h-screen bg-gray-50/30 pb-20 font-sans">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-40 h-16">
                <div className="max-w-4xl mx-auto px-4 md:px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl h-9 w-9 hover:bg-gray-100">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="h-5 w-px bg-gray-100" />
                        <div>
                            <h1 className="text-base font-bold text-gray-900 uppercase tracking-tight">Leave Requests</h1>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Absence Management</p>
                        </div>
                    </div>

                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button
                                className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-200 flex items-center gap-2"
                                disabled={!currentBooking}
                            >
                                <PlusCircle className="h-3.5 w-3.5" /> New Request
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md p-0 overflow-hidden border-none rounded-[2.5rem] shadow-2xl bg-white">
                            <DialogHeader className="p-8 pb-6 border-b border-gray-50 flex flex-row items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center shrink-0">
                                    <Plane className="h-6 w-6 text-white" />
                                </div>
                                <div className="text-left">
                                    <DialogTitle className="text-lg font-bold text-gray-900 uppercase leading-none tracking-tight">Leave Request</DialogTitle>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Submit your absence schedule</p>
                                </div>
                            </DialogHeader>

                            <form onSubmit={handleSubmit} className="p-8 space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">From Date *</Label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                                            <Input
                                                type="date"
                                                className="h-12 pl-10 rounded-xl border-gray-100 font-bold text-sm bg-gray-50"
                                                value={formData.startDate}
                                                onChange={e => setFormData(p => ({ ...p, startDate: e.target.value }))}
                                                min={new Date().toISOString().split('T')[0]}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">To Date *</Label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                                            <Input
                                                type="date"
                                                className="h-12 pl-10 rounded-xl border-gray-100 font-bold text-sm bg-gray-50"
                                                value={formData.endDate}
                                                onChange={e => setFormData(p => ({ ...p, endDate: e.target.value }))}
                                                min={formData.startDate || new Date().toISOString().split('T')[0]}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {formData.startDate && formData.endDate && new Date(formData.endDate) > new Date(formData.startDate) && (
                                    <div className="flex items-center gap-2 px-4 py-3 bg-indigo-50 rounded-xl">
                                        <CalendarRange className="h-4 w-4 text-indigo-500 shrink-0" />
                                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                                            Duration: {differenceInDays(new Date(formData.endDate), new Date(formData.startDate))} days
                                        </span>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Reason *</Label>
                                    <Textarea
                                        className="rounded-xl border-gray-100 font-bold text-sm bg-gray-50 min-h-[100px] resize-none"
                                        placeholder="Why are you going on leave? (Family visit, medical, studies...)"
                                        value={formData.reason}
                                        onChange={e => setFormData(p => ({ ...p, reason: e.target.value }))}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Emergency Contact (optional)</Label>
                                    <div className="relative">
                                        <PhoneCall className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                                        <Input
                                            className="h-12 pl-10 rounded-xl border-gray-100 font-bold text-sm bg-gray-50"
                                            placeholder="Contact number while on leave"
                                            value={formData.emergencyContact}
                                            onChange={e => setFormData(p => ({ ...p, emergencyContact: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                                    <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-[9px] font-bold text-amber-700 uppercase tracking-wide leading-relaxed">
                                        Leave requests require warden approval. Monthly rent applies during leave periods. Leave management does not cancel your booking.
                                    </p>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-200"
                                >
                                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                        <><Send className="h-4 w-4 mr-2" /> Submit Leave Request</>
                                    )}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-6">
                {!currentBooking && (
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                        <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">You need an active booking to submit a leave request</p>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Total Requests', value: parsedLeaves.length, color: 'bg-gray-950 text-white', icon: FileText },
                        { label: 'Pending', value: pendingCount, color: 'bg-amber-50 text-amber-700', icon: Clock },
                        { label: 'Approved', value: approvedCount, color: 'bg-emerald-50 text-emerald-700', icon: CheckCircle },
                    ].map((stat, i) => (
                        <div key={i} className={`${stat.color} rounded-2xl p-5 shadow-sm`}>
                            <stat.icon className={`h-5 w-5 mb-3 opacity-60`} />
                            <p className="text-2xl font-black tracking-tight">{stat.value}</p>
                            <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-1">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Leave List */}
                <div className="space-y-4">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">My Leave Requests</h3>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-16 bg-white rounded-3xl border border-gray-100">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
                        </div>
                    ) : parsedLeaves.length > 0 ? parsedLeaves.map((leave) => (
                        <div key={leave.id} className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${leave.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' :
                                        leave.status === 'REJECTED' ? 'bg-rose-50 text-rose-600' :
                                            'bg-amber-50 text-amber-600'
                                        }`}>
                                        <Plane className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                {leave.uid || leave.id?.slice(-8).toUpperCase()}
                                            </span>
                                            <StatusBadge status={leave.status} />
                                        </div>
                                        <p className="text-base font-bold text-gray-900 mt-1 uppercase tracking-tight">
                                            {leave.duration > 0 ? `${leave.duration}-Day Leave` : 'Leave Request'}
                                        </p>
                                        <p className="text-sm text-gray-500 font-medium mt-1 line-clamp-2">{leave.reason}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4 pt-5 border-t border-gray-50">
                                {[
                                    { label: 'Departure', value: leave.startDate ? format(new Date(leave.startDate), 'MMM dd, yyyy') : 'N/A', icon: Calendar },
                                    { label: 'Return', value: leave.endDate ? format(new Date(leave.endDate), 'MMM dd, yyyy') : 'N/A', icon: Home },
                                    { label: 'Duration', value: `${leave.duration} days`, icon: Clock },
                                    { label: 'Submitted', value: leave.createdAt ? format(new Date(leave.createdAt), 'MMM dd, yyyy') : 'N/A', icon: FileText },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <item.icon className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                                        <div>
                                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</p>
                                            <p className="text-[10px] font-bold text-gray-700">{item.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {leave.resolutionNotes && (
                                <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Admin Note</p>
                                    <p className="text-xs font-medium text-gray-600">{leave.resolutionNotes}</p>
                                </div>
                            )}
                        </div>
                    )) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                            <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                                <Plane className="h-8 w-8 text-gray-200" />
                            </div>
                            <h3 className="text-base font-bold text-gray-900 uppercase tracking-tight">No Leave Requests</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Submit a request when you plan to be absent</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default GuestLeavePage;
