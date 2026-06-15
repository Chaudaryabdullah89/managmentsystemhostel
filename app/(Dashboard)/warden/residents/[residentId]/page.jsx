"use client"
import React, { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
    User, Mail, Phone, MapPin, Building2, Calendar, Shield, CreditCard,
    TrendingUp, AlertCircle, Clock, CheckCircle2, Receipt, MoreVertical,
    ChevronLeft, ShieldCheck, Eye, Settings2, Trash2, ChevronRight,
    Search, Filter, Activity, Wallet, Globe, ExternalLink, Power,
    Briefcase, Zap, Download, History, MessageSquare, Fingerprint,
    Info, UserCheck, ArrowUpRight, PhoneCall, Printer, Loader2,
    RefreshCw, UserX, Edit, Home, ArrowRight, FileText
} from "lucide-react";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
    DropdownMenuSeparator, DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useUserById, useUserDetailedProfile } from "@/hooks/useusers";
import { useResetPassword, useDeleteUser, useUpdateAnyUser } from "@/hooks/useUsers";
import { useUpdateBookingStatus } from "@/hooks/useBooking";
import { useCreateComplaint } from "@/hooks/usecomplaints";
import { useCreatePayment } from "@/hooks/usePayment";
import useAuthStore from "@/hooks/Authstate";
import { format, isValid } from "date-fns";
import { toast } from "sonner";
import { DetailPageSkeleton } from "@/components/ui/skeletons";
import ActivityFeed from "@/components/admin/ActivityFeed";
import { generateInvoice } from "@/lib/utils/invoice-generator";
import UnifiedReceipt from "@/components/receipt/UnifiedReceipt";

const DetailItem = ({ icon: Icon, label, value, color = "text-indigo-600" }) => (
    <div className="flex items-start gap-4">
        <div className={`h-10 w-10 rounded-xl bg-gray-50 dark:bg-muted/10 flex items-center justify-center shrink-0 ${color}`}>
            <Icon className="h-4 w-4" />
        </div>
        <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest leading-none mb-1">{label}</span>
            <span className="text-sm font-bold text-gray-900 dark:text-foreground truncate tracking-tight">{value || "Not Provided"}</span>
        </div>
    </div>
);

const ResidentDetailContent = () => {
    const { residentId } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user: currentWarden } = useAuthStore();

    const [activeTab, setActiveTab] = useState("overview");
    const { data: user, isLoading: userLoading, refetch: refetchUser } = useUserById(residentId);
    const { data: userDetails, isLoading: detailsLoading, refetch: refetchDetails } = useUserDetailedProfile(residentId);

    const updateAnyUser = useUpdateAnyUser();
    const resetPassword = useResetPassword();
    const deleteUser = useDeleteUser();
    const updateBookingStatus = useUpdateBookingStatus();
    const createComplaint = useCreateComplaint();
    const createPayment = useCreatePayment();

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isAccessDialogOpen, setIsAccessDialogOpen] = useState(false);
    const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
    const [isGrievanceDialogOpen, setIsGrievanceDialogOpen] = useState(false);

    const [editData, setEditData] = useState(null);
    const [newPass, setNewPass] = useState("hostel123");
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    // Invoice Form State
    const [invoiceForm, setInvoiceForm] = useState({
        amount: "", type: "RENT", dueDate: "", notes: ""
    });

    // Grievance Form State
    const [grievanceForm, setGrievanceForm] = useState({
        title: "", category: "GENERAL", priority: "MEDIUM", description: ""
    });

    // Security check - Warden can only view residents of their hostel
    useEffect(() => {
        if (user && currentWarden?.role === 'WARDEN' && user.role !== 'ADMIN') {
            const userHostelId = user.hostelId || user.ResidentProfile?.currentHostelId;
            if (userHostelId && userHostelId !== currentWarden.hostelId) {
                toast.error("Security Alert: Access restricted to your hostel residents.");
                router.push('/warden/residents');
            }
        }
    }, [user, currentWarden, router]);

    const stats = useMemo(() => {
        if (!userDetails) return { totalPaid: 0, compl: 0, activeStay: false };
        const activeBooking = userDetails.bookings?.find(b => b.status === 'CONFIRMED' || b.status === 'CHECKED_IN');
        return {
            totalPaid: userDetails.payments?.reduce((acc, curr) => acc + (curr.status === 'PAID' ? Number(curr.amount || 0) : 0), 0) || 0,
            compl: userDetails.complaints?.length || 0,
            activeStay: !!activeBooking,
            activeBookingId: activeBooking?.id
        };
    }, [userDetails]);

    const activityFeed = useMemo(() => {
        const events = [];
        if (userDetails?.payments) {
            userDetails.payments.forEach(p => events.push({
                type: 'payment',
                title: 'Payment Recorded',
                description: `Payment of PKR ${p.amount} received`,
                date: new Date(p.date || p.createdAt || Date.now()),
                status: p.status,
                icon: CreditCard,
                color: 'text-emerald-600',
                bgColor: 'bg-emerald-50'
            }));
        }
        if (userDetails?.complaints) {
            userDetails.complaints.forEach(c => events.push({
                type: 'complaint',
                title: 'Complaint Filed',
                description: c.title,
                date: new Date(c.createdAt || Date.now()),
                status: c.status,
                icon: AlertCircle,
                color: 'text-amber-600',
                bgColor: 'bg-amber-50'
            }));
        }
        if (userDetails?.bookings) {
            userDetails.bookings.forEach(b => events.push({
                type: 'booking',
                title: 'Booking Event',
                description: `Room ${b.room?.roomNumber || 'N/A'} Booking`,
                date: new Date(b.createdAt || Date.now()),
                status: b.status,
                icon: Building2,
                color: 'text-indigo-600',
                bgColor: 'bg-indigo-50'
            }));
        }
        return events.sort((a, b) => b.date - a.date).slice(0, 10);
    }, [userDetails]);

    const handleToggleStatus = async () => {
        try {
            await updateAnyUser.mutateAsync({
                id: residentId,
                data: { isActive: !user.isActive }
            });
            toast.success(`Resident status updated`);
            refetchUser();
        } catch (error) { }
    };

    const handleEditIdentity = async () => {
        try {
            await updateAnyUser.mutateAsync({
                id: residentId,
                data: editData
            });
            toast.success("Identity profile updated");
            setIsEditDialogOpen(false);
            refetchUser();
        } catch (error) { }
    };

    const handleResetKey = async () => {
        try {
            await resetPassword.mutateAsync({
                id: residentId,
                newPassword: newPass
            });
            toast.success("Security access updated");
            setIsAccessDialogOpen(false);
        } catch (error) { }
    };

    const handleGenerateInvoice = async () => {
        if (!stats.activeBookingId) return toast.error("No active stay session found");
        if (!invoiceForm.amount || !invoiceForm.dueDate) return toast.error("Required fields missing");

        try {
            await createPayment.mutateAsync({
                userId: residentId,
                bookingId: stats.activeBookingId,
                amount: Number(invoiceForm.amount),
                dueDate: invoiceForm.dueDate,
                type: invoiceForm.type,
                notes: invoiceForm.notes,
                status: "PENDING"
            });
            toast.success("Invoice created");
            setIsInvoiceDialogOpen(false);
            setInvoiceForm({ amount: "", type: "RENT", dueDate: "", notes: "" });
            refetchDetails();
        } catch (error) { }
    };

    const handleReportGrievance = async () => {
        if (!grievanceForm.title || !grievanceForm.description) return toast.error("Evidence details missing");
        const hostelId = user?.hostelId || currentWarden?.hostelId;

        try {
            await createComplaint.mutateAsync({
                userId: residentId,
                hostelId: hostelId,
                roomNumber: userDetails?.bookings?.find(b => b.status === 'CHECKED_IN')?.room?.roomNumber || "N/A",
                title: grievanceForm.title,
                category: grievanceForm.category,
                priority: grievanceForm.priority,
                description: grievanceForm.description
            });
            toast.success("Complaint recorded");
            setIsGrievanceDialogOpen(false);
            setGrievanceForm({ title: "", category: "GENERAL", priority: "MEDIUM", description: "" });
            refetchDetails();
        } catch (error) { }
    };

    const handleCheckout = async () => {
        if (!stats.activeBookingId) return toast.error("No active stay session identified");
        if (confirm(`Check out ${user.name}? This will mark the room as available.`)) {
            setIsCheckingOut(true);
            try {
                await updateBookingStatus.mutateAsync({
                    id: stats.activeBookingId,
                    status: 'COMPLETED'
                });
                toast.success("Checked out successfully");
                refetchDetails();
            } catch (error) { } finally {
                setIsCheckingOut(false);
            }
        }
    };

    const handleArchiveRecord = async () => {
        if (confirm("Permanently delete this resident? This cannot be undone.")) {
            try {
                await deleteUser.mutateAsync(residentId);
                toast.success("Record archived");
                router.push('/warden/residents');
            } catch (error) { }
        }
    };

    if (userLoading || detailsLoading) return <DetailPageSkeleton />;

    if (!user) return (
        <div className="flex h-screen items-center justify-center bg-white dark:bg-card font-sans">
            <div className="text-center space-y-6">
                <div className="h-20 w-20 bg-gray-50 dark:bg-muted/10 text-gray-400 dark:text-muted-foreground rounded-4xl flex items-center justify-center mx-auto border border-gray-100 dark:border-border shadow-sm">
                    <UserX className="h-10 w-10" />
                </div>
                <div className="space-y-1">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-foreground uppercase tracking-tight">Resident Not Found</h1>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">The resident was not found in our records.</p>
                </div>
                <Button onClick={() => router.back()} variant="outline" className="h-11 px-8 rounded-xl font-bold text-[10px] uppercase tracking-wider">
                    Go Back
                </Button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-muted/10/30 pb-20 font-sans tracking-tight">
            {/* Header */}
            <header className="bg-white dark:bg-card border-b sticky top-0 z-50 h-16 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100 h-9 w-9" onClick={() => router.back()}>
                            <ChevronLeft className="h-5 w-5 text-gray-400 dark:text-muted-foreground" />
                        </Button>
                        <div className="h-8 w-px bg-gray-100" />
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold text-gray-900 dark:text-foreground tracking-tight uppercase leading-none">{user.name}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600">{user.role}</span>
                                {user.regNumber && (
                                    <>
                                        <div className="h-1 w-1 rounded-full bg-gray-300" />
                                        <span className="text-[9px] font-black tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">REG: {user.regNumber}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => { refetchUser(); refetchDetails(); }}
                            className="h-9 px-4 rounded-xl border-gray-200 dark:border-border font-bold text-[10px] uppercase tracking-wider text-gray-500 dark:text-muted-foreground hover:bg-gray-50 dark:hover:bg-muted/5 dark:bg-muted/10"
                        >
                            <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button className="h-9 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all active:scale-95">
                                    <Settings2 className="h-3.5 w-3.5 mr-2" /> Actions
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-gray-100 dark:border-border bg-white dark:bg-card">
                                <DropdownMenuLabel className="text-[9px] font-black uppercase text-gray-400 dark:text-muted-foreground tracking-widest px-3 py-2">Warden Menu</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => { setEditData(user); setIsEditDialogOpen(true); }} className="rounded-xl px-4 py-3 font-bold text-[10px] uppercase tracking-widest gap-3 focus:bg-slate-50 cursor-pointer">
                                    <Edit className="h-4 w-4 text-indigo-600" /> Edit Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsAccessDialogOpen(true)} className="rounded-xl px-4 py-3 font-bold text-[10px] uppercase tracking-widest gap-3 focus:bg-slate-50 cursor-pointer">
                                    <Zap className="h-4 w-4 text-indigo-600" /> Reset Pin
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleToggleStatus} className="rounded-xl px-4 py-3 font-bold text-[10px] uppercase tracking-widest gap-3 focus:bg-slate-50 cursor-pointer text-amber-600">
                                    <Power className="h-4 w-4" /> {user.isActive ? 'Suspend access' : 'Restore access'}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="my-2 bg-slate-100" />
                                <DropdownMenuItem onClick={handleArchiveRecord} className="rounded-xl px-4 py-3 font-bold text-[10px] uppercase tracking-widest gap-3 focus:bg-rose-50 text-rose-600 cursor-pointer">
                                    <Trash2 className="h-4 w-4" /> Delete Profile
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
                {/* Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Payments', value: `PKR ${stats.totalPaid.toLocaleString()}`, icon: Wallet, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { label: 'Complaints', value: stats.compl, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Stay Status', value: stats.activeStay ? 'Checked-In' : 'No Stay', icon: CheckCircle2, color: stats.activeStay ? 'text-emerald-600' : 'text-gray-400 dark:text-muted-foreground', bg: stats.activeStay ? 'bg-emerald-50' : 'bg-gray-50 dark:bg-muted/10' },
                        { label: 'Room No', value: userDetails?.bookings?.find(b => b.status === 'CHECKED_IN')?.room?.roomNumber ? `RM-${userDetails.bookings.find(b => b.status === 'CHECKED_IN').room.roomNumber}` : 'N/A', icon: Home, color: 'text-pink-600', bg: 'bg-pink-50' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                            <div className={`h-11 w-11 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">{stat.label}</span>
                                <span className="text-lg font-black text-gray-900 dark:text-foreground tracking-tight uppercase">{stat.value}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Profile */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="rounded-[2.5rem] border-none shadow-xl shadow-gray-200/40 bg-white dark:bg-card overflow-hidden">
                            <div className="p-8 space-y-8">
                                <div className="flex flex-col items-center">
                                    <Avatar className="h-32 w-32 border-4 border-white shadow-2xl mb-6">
                                        <AvatarImage src={user.image} />
                                        <AvatarFallback className="text-3xl font-black bg-indigo-50 text-indigo-600 uppercase">
                                            {user.name?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-foreground uppercase tracking-tight text-center leading-none">{user.name}</h2>
                                    <p className="text-[10px] font-bold uppercase text-gray-400 dark:text-muted-foreground tracking-widest mt-2">{user.email}</p>
                                    {user.regNumber && (
                                        <Badge className="mt-4 bg-indigo-600 text-white border-none text-[10px] font-black px-6 py-2 shadow-lg shadow-indigo-100 uppercase tracking-widest">
                                            {user.regNumber}
                                        </Badge>
                                    )}
                                </div>

                                <div className="space-y-6 pt-6 border-t border-gray-50">
                                    <DetailItem icon={Phone} label="Phone Number" value={user.phone} />
                                    <DetailItem icon={Fingerprint} label="CNIC Number" value={user.cnic} />
                                    <DetailItem icon={Calendar} label="Join Date" value={user.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy') : '—'} />
                                    <DetailItem icon={MapPin} label="Address" value={user.address} />
                                </div>

                                {user.ResidentProfile && (
                                    <div className="p-6 bg-gray-50 dark:bg-background rounded-3xl border border-gray-100 dark:border-border space-y-4">
                                        <div className="flex items-center gap-3">
                                            <Shield className="h-4 w-4 text-emerald-600" />
                                            <span className="text-[9px] font-black uppercase text-gray-900 dark:text-foreground tracking-widest">Emergency Contact</span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">Guardian Name</span>
                                                <span className="text-xs font-bold text-gray-700 dark:text-foreground uppercase">{user.ResidentProfile.guardianName}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">Emergency Number</span>
                                                <span className="text-xs font-bold text-gray-700 dark:text-foreground">{user.ResidentProfile.emergencyContact}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Controls */}
                        <Card className="rounded-[2.5rem] p-8 border-none shadow-sm bg-white dark:bg-card overflow-hidden space-y-4">
                            <h3 className="text-[10px] font-black uppercase text-gray-400 dark:text-muted-foreground tracking-[0.2em] mb-4">Warden Menu</h3>
                            <Button
                                variant="outline"
                                className="w-full h-12 justify-between px-6 rounded-2xl border-gray-100 dark:border-border font-bold text-[10px] uppercase tracking-widest group"
                                onClick={() => setIsInvoiceDialogOpen(true)}
                                disabled={!stats.activeStay}
                            >
                                <div className="flex items-center gap-3">
                                    <Receipt className="h-4 w-4 text-indigo-600" />
                                    <span>Create Bill</span>
                                </div>
                                <ChevronRight className="h-3 w-3 text-gray-300 group-hover:text-indigo-600" />
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full h-12 justify-between px-6 rounded-2xl border-rose-50 font-bold text-[10px] uppercase tracking-widest text-rose-600 hover:bg-rose-50"
                                onClick={handleCheckout}
                                disabled={isCheckingOut || !stats.activeStay}
                            >
                                <div className="flex items-center gap-3">
                                    {isCheckingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
                                    <span>Checkout Resident</span>
                                </div>
                                <ArrowRight className="h-3 w-3" />
                            </Button>
                        </Card>
                    </div>

                    {/* Data Tabs */}
                    <div className="lg:col-span-8 space-y-8">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                            <TabsList className="bg-white dark:bg-card border border-gray-100 dark:border-border p-1.5 rounded-2xl h-14 shadow-sm inline-flex">
                                <TabsTrigger value="overview" className="h-full px-8 rounded-xl font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">Overview</TabsTrigger>
                                <TabsTrigger value="payments" className="h-full px-8 rounded-xl font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">Payments</TabsTrigger>
                                <TabsTrigger value="history" className="h-full px-8 rounded-xl font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">Complaints</TabsTrigger>
                                <TabsTrigger value="profile-plus" className="h-full px-8 rounded-xl font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">Full Profile</TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="m-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card className="rounded-[2.5rem] bg-white dark:bg-card p-8 border-none shadow-sm space-y-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-foreground">Recent Stream</h3>
                                            <History className="h-4 w-4 text-gray-400 dark:text-muted-foreground" />
                                        </div>
                                        <ActivityFeed events={activityFeed} />
                                    </Card>

                                    <Card className="rounded-[2.5rem] bg-white dark:bg-card p-8 border-none shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-8">
                                            <Zap className="h-12 w-12 text-indigo-50 opacity-40" />
                                        </div>
                                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-foreground mb-8">Summary Metrics</h3>
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-end border-b border-gray-50 pb-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest mb-1">Total Paid</span>
                                                    <span className="text-2xl font-black text-indigo-600 tracking-tight">PKR {stats.totalPaid.toLocaleString()}</span>
                                                </div>
                                                <TrendingUp className="h-5 w-5 text-emerald-500" />
                                            </div>
                                            <div className="flex justify-between items-end border-b border-gray-50 pb-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest mb-1">Alert Count</span>
                                                    <span className="text-2xl font-black text-amber-500 tracking-tight">{stats.compl} Reports</span>
                                                </div>
                                                <AlertCircle className="h-5 w-5 text-amber-500" />
                                            </div>
                                            <div className="pt-4">
                                                <Button
                                                    className="w-full h-12 rounded-2xl bg-gray-50 dark:bg-muted/10 hover:bg-gray-100 text-gray-600 dark:text-muted-foreground font-bold text-[10px] uppercase tracking-widest border border-gray-100 dark:border-border shadow-none"
                                                    onClick={() => toast.info("Report downloading...")}
                                                >
                                                    <Download className="h-4 w-4 mr-2" /> Download Full Report
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </TabsContent>

                            <TabsContent value="payments" className="m-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <Card className="rounded-[2.5rem] bg-white dark:bg-card overflow-hidden border-none shadow-sm">
                                    <div className="p-8 border-b border-gray-50">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-foreground">Payment History</h3>
                                    </div>
                                    <Table>
                                        <TableHeader className="bg-gray-50 dark:bg-background">
                                            <TableRow className="border-none">
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-8">Date</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-4">Type</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-4">Amount</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 text-center">Status</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {userDetails?.payments?.map((p) => (
                                                <TableRow key={p.id} className="border-gray-50 hover:bg-gray-50 dark:hover:bg-muted/5 dark:bg-background transition-colors group">
                                                    <TableCell className="px-8 py-5">
                                                        <span className="text-xs font-bold text-gray-900 dark:text-foreground">{safeFormat(p.date || p.createdAt, 'MMM dd, yyyy')}</span>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-5">
                                                        <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-widest bg-gray-50 dark:bg-muted/10/30 px-3 py-1 rounded-lg">
                                                            {p.type}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-5 font-bold text-gray-900 dark:text-foreground text-xs">PKR {p.amount.toLocaleString()}</TableCell>
                                                    <TableCell className="px-8 py-5 text-center">
                                                        <Badge className={`rounded-full px-4 py-1.5 font-bold text-[8px] uppercase tracking-widest border shadow-none ${p.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                                            {p.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="px-8 py-5 text-right">
                                                        <UnifiedReceipt data={p} type="payment">
                                                            <Button variant="ghost" size="sm" className="h-8 px-3 rounded-xl text-[9px] font-bold uppercase tracking-wider text-indigo-600 hover:bg-indigo-50">
                                                                View Receipt
                                                            </Button>
                                                        </UnifiedReceipt>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {(!userDetails?.payments || userDetails.payments.length === 0) && (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="h-60 text-center">
                                                        <History className="h-10 w-10 text-gray-100 mx-auto mb-3" />
                                                        <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-[0.2em]">No Payments Yet</p>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </Card>
                            </TabsContent>

                            <TabsContent value="history" className="m-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {userDetails?.complaints?.map((c) => (
                                        <Card key={c.id} className="rounded-4xl bg-white dark:bg-card p-8 border-none shadow-sm space-y-4 hover:shadow-md transition-shadow group">
                                            <div className="flex justify-between items-start">
                                                <div className="h-10 w-10 rounded-xl bg-gray-50 dark:bg-muted/10 flex items-center justify-center text-gray-400 dark:text-muted-foreground group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                                                    <AlertCircle className="h-5 w-5" />
                                                </div>
                                                <Badge className={`rounded-full px-3 py-1 font-bold text-[8px] uppercase tracking-widest shadow-none ${c.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{c.status}</Badge>
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-black text-gray-900 dark:text-foreground uppercase tracking-tight">{c.title}</h4>
                                                <p className="text-xs text-gray-500 dark:text-muted-foreground font-medium line-clamp-2 leading-relaxed italic">{c.description}</p>
                                            </div>
                                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                                <span className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">{safeFormat(c.createdAt, 'MMM dd, yyyy')}</span>
                                                <Link href={`/warden/complaints`}>
                                                    <Button variant="ghost" className="h-8 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest text-indigo-600">View All</Button>
                                                </Link>
                                            </div>
                                        </Card>
                                    ))}
                                    {(!userDetails?.complaints || userDetails.complaints.length === 0) && (
                                        <div className="md:col-span-2 h-60 flex flex-col items-center justify-center bg-white dark:bg-card rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-border opacity-50">
                                            <MessageSquare className="h-10 w-10 text-gray-200 mb-3" />
                                            <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">No Complaints</p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="profile-plus" className="m-0 space-y-6 animate-in fade-in duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card className="rounded-[2.5rem] bg-white dark:bg-card p-10 border-none shadow-sm space-y-8">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-foreground flex items-center gap-3">
                                            <Info className="h-4 w-4 text-indigo-600" /> Personal Details
                                        </h3>
                                        <div className="grid grid-cols-1 gap-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[8px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest">Father / Guardian</span>
                                                <span className="text-sm font-bold text-gray-800 dark:text-foreground uppercase italic underline decoration-indigo-600/20 underline-offset-4">{user.ResidentProfile?.guardianName || 'N/A'}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[8px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest">Blood Group</span>
                                                <span className="text-sm font-bold text-rose-600 uppercase"> {user.ResidentProfile?.bloodGroup || 'N/A'}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[8px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest">Date of Birth</span>
                                                <span className="text-sm font-bold text-gray-800 dark:text-foreground">{safeFormat(user.ResidentProfile?.dob, 'MMMM dd, yyyy')}</span>
                                            </div>
                                        </div>
                                    </Card>

                                    <Card className="rounded-[2.5rem] bg-white dark:bg-card p-10 border-none shadow-sm space-y-8">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-foreground flex items-center gap-3">
                                            <Building2 className="h-4 w-4 text-indigo-600" /> Institution Info
                                        </h3>
                                        <div className="grid grid-cols-1 gap-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[8px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest">University / College</span>
                                                <span className="text-sm font-bold text-gray-800 dark:text-foreground uppercase italic line-clamp-1">{user.ResidentProfile?.institution || 'N/A'}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[8px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest">Occupation</span>
                                                <span className="text-sm font-bold text-gray-800 dark:text-foreground uppercase italic line-clamp-1">{user.ResidentProfile?.occupation || 'N/A'}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[8px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest">Full Address</span>
                                                <span className="text-sm font-medium text-gray-500 dark:text-muted-foreground line-clamp-2">{user.address || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </Card>

                                    <Card className="md:col-span-2 rounded-[2.5rem] bg-white dark:bg-card p-10 border-none shadow-sm">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-foreground mb-8 flex items-center gap-3">
                                            <FileText className="h-4 w-4 text-indigo-600" /> Documents
                                        </h3>
                                        {user.ResidentProfile?.documents && Object.keys(user.ResidentProfile.documents).length > 0 ? (
                                            <div className="space-y-6">
                                                {user?.ResidentProfile?.documents?.currentResidence && (
                                                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-background border border-gray-100 dark:border-border">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground mb-1">Current Residence</p>
                                                        <p className="text-sm font-bold text-gray-800 dark:text-foreground">{user.ResidentProfile.documents.currentResidence}</p>
                                                    </div>
                                                )}
                                                {Array.isArray(user?.ResidentProfile?.documents?.galleryImages) && user.ResidentProfile.documents.galleryImages.length > 0 && (
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        {user.ResidentProfile.documents.galleryImages.map((src, idx) => (
                                                            <a
                                                                key={`${src}-${idx}`}
                                                                href={src}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="block rounded-xl overflow-hidden border border-gray-100 dark:border-border bg-white dark:bg-card"
                                                            >
                                                                <img src={src} alt={`document-${idx}`} className="h-28 w-full object-cover" />
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="col-span-full py-12 text-center bg-gray-50 dark:bg-muted/10/30 rounded-4xl border-2 border-dashed border-gray-100 dark:border-border">
                                                <span className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.3em]">No Documents Uploaded</span>
                                            </div>
                                        )}
                                    </Card>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </main>

            {/* Dialogs */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="rounded-[2.5rem] border-none p-10 max-w-lg shadow-2xl bg-white dark:bg-card font-sans">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Edit Resident Info</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 pt-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black uppercase tracking-widest pl-1 text-gray-400 dark:text-muted-foreground">Full Name</Label>
                                <Input value={editData?.name} onChange={e => setEditData({ ...editData, name: e.target.value })} className="h-12 rounded-xl border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/10 font-bold px-4" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black uppercase tracking-widest pl-1 text-gray-400 dark:text-muted-foreground">Email Address</Label>
                                <Input value={editData?.email} onChange={e => setEditData({ ...editData, email: e.target.value })} className="h-12 rounded-xl border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/10 font-bold px-4" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black uppercase tracking-widest pl-1 text-gray-400 dark:text-muted-foreground">Phone Number</Label>
                                <Input value={editData?.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} className="h-12 rounded-xl border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/10 font-bold px-4" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black uppercase tracking-widest pl-1 text-gray-400 dark:text-muted-foreground">CNIC Number</Label>
                                <Input value={editData?.cnic} onChange={e => setEditData({ ...editData, cnic: e.target.value })} className="h-12 rounded-xl border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/10 font-bold px-4" />
                            </div>
                        </div>
                        <DialogFooter className="pt-4 gap-3">
                            <Button variant="ghost" className="h-12 rounded-xl font-black text-[9px] uppercase tracking-widest flex-1" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                            <Button className="h-12 rounded-xl bg-indigo-600 text-white font-black text-[9px] uppercase tracking-widest flex-2 shadow-lg" onClick={handleEditIdentity} disabled={updateAnyUser.isPending}>
                                {updateAnyUser.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isAccessDialogOpen} onOpenChange={setIsAccessDialogOpen}>
                <DialogContent className="rounded-[2.5rem] border-none p-10 max-w-sm shadow-2xl bg-white dark:bg-card font-sans">
                    <DialogHeader className="text-center">
                        <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Reset Password</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 pt-6">
                        <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground text-center block w-full">New Password</Label>
                            <Input value={newPass} onChange={e => setNewPass(e.target.value)} className="h-14 rounded-2xl border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/10 text-center font-black tracking-[0.3em] text-lg uppercase" />
                        </div>
                        <Button className="w-full h-14 rounded-2xl bg-indigo-600 text-white font-black text-[9px] uppercase tracking-widest shadow-lg" onClick={handleResetKey} disabled={resetPassword.isPending}>
                            {resetPassword.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Billing Dialog */}
            <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] border-none p-10 font-sans shadow-2xl bg-white dark:bg-card">
                    <DialogHeader className="mb-8">
                        <DialogTitle className="text-xl font-black uppercase tracking-tight">Create Invoice / Bill</DialogTitle>
                        <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted-foreground">Warden Menu</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground ml-1">Invoice Value (PKR)</Label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                className="h-14 rounded-2xl bg-gray-50 dark:bg-background border-gray-100 dark:border-border font-black text-lg px-6 focus:ring-indigo-600/20"
                                value={invoiceForm.amount}
                                onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground ml-1">Category</Label>
                                <Select value={invoiceForm.type} onValueChange={(v) => setInvoiceForm({ ...invoiceForm, type: v })}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-gray-50 dark:bg-background border-gray-100 dark:border-border font-bold text-xs uppercase px-6">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        <SelectItem value="RENT" className="text-[10px] font-black uppercase tracking-widest">Monthly Rent</SelectItem>
                                        <SelectItem value="MESS" className="text-[10px] font-black uppercase tracking-widest">Mess Charges</SelectItem>
                                        <SelectItem value="LAUNDRY" className="text-[10px] font-black uppercase tracking-widest">Laundry Fee</SelectItem>
                                        <SelectItem value="FINE" className="text-[10px] font-black uppercase tracking-widest">Policy Fine</SelectItem>
                                        <SelectItem value="OTHER" className="text-[10px] font-black uppercase tracking-widest">Miscellaneous</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground ml-1">Due Date</Label>
                                <Input
                                    type="date"
                                    className="h-14 rounded-2xl bg-gray-50 dark:bg-background border-gray-100 dark:border-border font-bold text-xs px-6"
                                    value={invoiceForm.dueDate}
                                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground ml-1">Notes</Label>
                            <Textarea
                                placeholder="Log details for reference..."
                                className="min-h-[100px] rounded-2xl bg-gray-50 dark:bg-background border-gray-100 dark:border-border font-medium p-6 resize-none focus:ring-indigo-600/20"
                                value={invoiceForm.notes}
                                onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-10 gap-3">
                        <Button variant="ghost" className="rounded-2xl font-black text-[9px] uppercase tracking-widest h-14 px-8" onClick={() => setIsInvoiceDialogOpen(false)}>Abort</Button>
                        <Button
                            className="flex-1 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[9px] uppercase tracking-widest h-14 transition-all shadow-lg"
                            onClick={handleGenerateInvoice}
                            disabled={createPayment.isPending}
                        >
                            {createPayment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create & Send"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Grievance Dialog */}
            <Dialog open={isGrievanceDialogOpen} onOpenChange={setIsGrievanceDialogOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] border-none p-10 font-sans shadow-2xl bg-white dark:bg-card">
                    <DialogHeader className="mb-8">
                        <DialogTitle className="text-xl font-black uppercase tracking-tight">Report Resident Problem</DialogTitle>
                        <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted-foreground">Warden Menu</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground ml-1">Case Subject</Label>
                            <Input
                                placeholder="Core issue summary..."
                                className="h-14 rounded-2xl bg-gray-50 dark:bg-background border-gray-100 dark:border-border font-black text-xs px-6 uppercase focus:ring-indigo-600/20"
                                value={grievanceForm.title}
                                onChange={(e) => setGrievanceForm({ ...grievanceForm, title: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground ml-1">Category</Label>
                                <Select value={grievanceForm.category} onValueChange={(v) => setGrievanceForm({ ...grievanceForm, category: v })}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-gray-50 dark:bg-background border-gray-100 dark:border-border font-bold text-xs uppercase px-6">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        <SelectItem value="MAINTENANCE" className="text-[10px] font-black uppercase tracking-widest">Maintenance</SelectItem>
                                        <SelectItem value="MESS" className="text-[10px] font-black uppercase tracking-widest">Mess / Food</SelectItem>
                                        <SelectItem value="CLEANING" className="text-[10px] font-black uppercase tracking-widest">Cleaning</SelectItem>
                                        <SelectItem value="LAUNDRY" className="text-[10px] font-black uppercase tracking-widest">Laundry</SelectItem>
                                        <SelectItem value="SECURITY" className="text-[10px] font-black uppercase tracking-widest">Security</SelectItem>
                                        <SelectItem value="GENERAL" className="text-[10px] font-black uppercase tracking-widest">General</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground ml-1">Priority</Label>
                                <Select value={grievanceForm.priority} onValueChange={(v) => setGrievanceForm({ ...grievanceForm, priority: v })}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-gray-50 dark:bg-background border-gray-100 dark:border-border font-bold text-xs uppercase px-6">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        <SelectItem value="LOW" className="text-[10px] font-black uppercase text-blue-600">Low</SelectItem>
                                        <SelectItem value="MEDIUM" className="text-[10px] font-black uppercase text-amber-600">Medium</SelectItem>
                                        <SelectItem value="HIGH" className="text-[10px] font-black uppercase text-orange-600">High</SelectItem>
                                        <SelectItem value="URGENT" className="text-[10px] font-black uppercase text-rose-600">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground ml-1">Dossier Details</Label>
                            <Textarea
                                placeholder="Evidence and context..."
                                className="min-h-[120px] rounded-2xl bg-gray-50 dark:bg-background border-gray-100 dark:border-border font-medium p-6 resize-none focus:ring-indigo-600/20"
                                value={grievanceForm.description}
                                onChange={(e) => setGrievanceForm({ ...grievanceForm, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-10 gap-3">
                        <Button variant="ghost" className="rounded-2xl font-black text-[9px] uppercase tracking-widest h-14 px-8" onClick={() => setIsGrievanceDialogOpen(false)}>Void</Button>
                        <Button
                            className="flex-1 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-[9px] uppercase tracking-widest h-14 transition-all shadow-lg shadow-rose-100"
                            onClick={handleReportGrievance}
                            disabled={createComplaint.isPending}
                        >
                            {createComplaint.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Commit Log"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

const safeFormat = (date, formatStr, fallback = '—') => {
    if (!date) return fallback;
    const d = new Date(date);
    if (!isValid(d)) return fallback;
    return format(d, formatStr);
}

export default function WardenResidentDetailPage() {
    return (
        <Suspense fallback={<DetailPageSkeleton />}>
            <ResidentDetailContent />
        </Suspense>
    );
}
