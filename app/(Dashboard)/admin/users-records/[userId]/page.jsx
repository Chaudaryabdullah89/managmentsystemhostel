"use client"
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
    User,
    Mail,
    Phone,
    MapPin,
    Building2,
    Calendar,
    Shield,
    CreditCard,
    TrendingUp,
    AlertCircle,
    Clock,
    CheckCircle2,
    Receipt,
    MoreVertical,
    ChevronLeft,
    ShieldCheck,
    Eye,
    Settings2,
    Trash2,
    ChevronRight,
    Boxes,
    Scan,
    ArrowRight,
    Search,
    Filter,
    Activity,
    Wallet,
    Globe,
    ExternalLink,
    Power,
    Briefcase,
    Zap,
    Download,
    History,
    MessageSquare,
    Fingerprint,
    Info,
    UserCheck,
    ArrowUpRight,
    PhoneCall,
    Printer,
    Loader2,
    Smartphone,
    Activity as ActivityIcon
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserById, useUserDetailedProfile, useUserUpdate } from "@/hooks/useusers";
import { useResetPassword, useDeleteUser } from "@/hooks/useUsers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import ActivityFeed from "@/components/admin/ActivityFeed";
import { DetailPageSkeleton } from "@/components/ui/skeletons";
import { toast } from "sonner";
import { useCreatePayment } from "@/hooks/usePayment";
import { useReports } from "@/hooks/useReports";
import { OccupancyDonutChart } from "@/components/ui/Charts";
import SalarySlip from "@/components/SalarySlip";

const DetailItem = ({ icon: Icon, label, value, color = "text-indigo-600" }) => (
    <div className="flex items-start gap-4">
        <div className={`h-10 w-10 rounded-xl bg-gray-50 dark:bg-muted/10 border border-gray-100 dark:border-border flex items-center justify-center shrink-0 ${color}`}>
            <Icon className="h-4 w-4" />
        </div>
        <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest leading-none mb-1">{label}</span>
            <span className="text-sm font-bold text-gray-900 dark:text-foreground wrap-break-word tracking-tight">{value || "Not Provided"}</span>
        </div>
    </div>
);

const formatFieldLabel = (key = "") =>
    key
        .replace(/([A-Z])/g, " $1")
        .replace(/_/g, " ")
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase());

const KeyValueGrid = ({ title, data = {} }) => {
    const rows = Object.entries(data).filter(([, value]) => value !== undefined);
    if (!rows.length) return null;
    return (
        <Card className="rounded-[2.5rem] bg-white dark:bg-card p-8 border border-gray-100 dark:border-border shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-foreground mb-6 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                {title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rows.map(([key, value]) => (
                    <div key={key} className="p-4 rounded-2xl border border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/10/40 hover:bg-white dark:bg-card transition-colors">
                        <p className="text-[9px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest mb-1">{formatFieldLabel(key)}</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-foreground wrap-break-word">
                            {typeof value === "object" ? JSON.stringify(value) : String(value || "—")}
                        </p>
                    </div>
                ))}
            </div>
        </Card>
    );
};

const UserDetailsPage = () => {
    const { userId } = useParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("overview");

    const { data: user, isLoading: userLoading } = useUserById(userId);
    const { data: userDetails, isLoading: detailsLoading } = useUserDetailedProfile(userId);
    const { mutateAsync: updateUser, isLoading: isUpdating } = useUserUpdate();
    const resetPassword = useResetPassword();
    const deleteUser = useDeleteUser();

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
    const [isAccessDialogOpen, setIsAccessDialogOpen] = useState(false);
    const [isSlipDialogOpen, setIsSlipDialogOpen] = useState(false);
    const [selectedSalary, setSelectedSalary] = useState(null);

    // If the user is a WARDEN, fetch their hostel level report summary so admins can see their performance
    const isWarden = user?.role === "WARDEN";
    const { data: wardenReports, isLoading: reportsLoading } = useReports("month", isWarden ? user?.hostelId : null);
    const [editData, setEditData] = useState(null);
    const [newPass, setNewPass] = useState("hostel123");

    // Booking & Payment Dialog States
    const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("CASH");
    const additionalImages = Array.isArray(user?.ResidentProfile?.documents?.galleryImages)
        ? user.ResidentProfile.documents.galleryImages
        : [];

    const createPayment = useCreatePayment();

    const handleToggleStatus = async () => {
        try {
            await updateUser({
                id: userId,
                data: { isActive: !user.isActive }
            });
            toast.success(`User status updated to ${!user.isActive ? 'ACTIVE' : 'INACTIVE'}`);
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const handleEditIdentity = async () => {
        try {
            await updateUser({
                id: userId,
                data: editData
            });
            toast.success("Profile updated successfully");
            setIsEditDialogOpen(false);
        } catch (error) {
            toast.error("Failed to update profile");
        }
    };

    const handleResetKey = async () => {
        try {
            await resetPassword.mutateAsync({
                id: userId,
                newPassword: newPass
            });
            toast.success("Password reset successfully");
            setIsAccessDialogOpen(false);
        } catch (error) {
            toast.error("Failed to reset password");
        }
    };

    const handleUpdateRole = async () => {
        try {
            await updateUser({
                id: userId,
                data: {
                    role: editData.role,
                    canManageExpenses: editData.canManageExpenses,
                    canManageMess: editData.canManageMess,
                    canManageGeneral: editData.canManageGeneral,
                    canManageUtilities: editData.canManageUtilities,
                    canManageMaintenance: editData.canManageMaintenance,
                    canManageSalaries: editData.canManageSalaries
                }
            });
            toast.success("User role updated");
            setIsRoleDialogOpen(false);
        } catch (error) {
            toast.error("Failed to update role");
        }
    };

    const handleArchiveRecord = async () => {
        if (confirm("Are you sure you want to delete this user forever?")) {
            try {
                await deleteUser.mutateAsync(userId);
                toast.success("User deleted successfully");
                router.push('/admin/users-records');
            } catch (error) {
                toast.error("Failed to delete user");
            }
        }
    };

    const stats = useMemo(() => {
        if (!userDetails) return { totalPaid: 0, compl: 0, maint: 0 };
        return {
            totalPaid: userDetails.payments?.reduce((acc, curr) => acc + Number(curr.amount || 0), 0) || 0,
            compl: userDetails.complaints?.length || 0,
            maint: userDetails.maintenanceTasks?.length || 0
        };
    }, [userDetails]);

    const permissionsMap = {
        canManageExpenses: user?.canManageExpenses,
        canManageMess: user?.canManageMess,
        canManageGeneral: user?.canManageGeneral,
        canManageUtilities: user?.canManageUtilities,
        canManageMaintenance: user?.canManageMaintenance,
        canManageSalaries: user?.canManageSalaries,
    };

    const activityFeed = useMemo(() => {
        const events = [];
        if (userDetails?.payments) {
            userDetails.payments.forEach(p => events.push({
                type: 'payment',
                title: 'Payment Received',
                description: `Received ${p.amount} PKR via ${p.method}`,
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
                title: 'New Complaint',
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
                title: 'Stay Started',
                description: `Checked in at ${b.room?.Hostel?.name || 'Hostel'} (Room ${b.room?.roomNumber})`,
                date: new Date(b.createdAt || Date.now()),
                status: b.status,
                icon: Building2,
                color: 'text-indigo-600',
                bgColor: 'bg-indigo-50'
            }));
        }
        return events.sort((a, b) => b.date - a.date).slice(0, 10);
    }, [userDetails]);

    if (userLoading || detailsLoading) return <DetailPageSkeleton />;

    if (!user) return (
        <div className="flex h-screen items-center justify-center">
            <div className="text-center space-y-6">
                <div className="h-20 w-20 bg-rose-50 text-rose-600 rounded-4xl flex items-center justify-center mx-auto border border-rose-100 shadow-sm">
                    <User className="h-10 w-10" />
                </div>
                <div className="space-y-1">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-foreground uppercase tracking-tight">User Not Found</h1>
                    <p className="text-sm text-gray-400 dark:text-muted-foreground font-medium">The user you are looking for does not exist.</p>
                </div>
                <Button onClick={() => router.back()} variant="outline" className="h-11 px-8 rounded-xl font-bold text-[10px] uppercase tracking-wider">
                    Go Back
                </Button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-background pb-20 font-sans tracking-tight">
            {/* Minimal Premium Header */}
            <div className="bg-white dark:bg-card border-b sticky top-0 z-50 h-16 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100 h-9 w-9" onClick={() => router.back()}>
                            <ChevronLeft className="h-5 w-5 text-gray-400 dark:text-muted-foreground" />
                        </Button>
                        <div className="h-8 w-px bg-gray-100" />
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold text-gray-900 dark:text-foreground tracking-tight uppercase">{user.name}</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">{user.role}</span>
                                {user.uid && (
                                    <>
                                        <div className="h-1 w-1 rounded-full bg-gray-300" />
                                        <span className="text-[10px] font-mono font-bold tracking-wider text-gray-600 dark:text-muted-foreground bg-gray-100 px-2 py-0.5 rounded">ID: {user.uid}</span>
                                    </>
                                )}
                                {user.regNumber && (
                                    <>
                                        <div className="h-1 w-1 rounded-full bg-gray-300" />
                                        <span className="text-[10px] font-black tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">REG: {user.regNumber}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {user.phone && (
                            <a href={`tel:${user.phone}`}>
                                <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-gray-200 dark:border-border text-gray-500 dark:text-muted-foreground hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-none" title="Call User">
                                    <PhoneCall className="h-4 w-4" />
                                </Button>
                            </a>
                        )}
                        {user.email && (
                            <a href={`mailto:${user.email}`}>
                                <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-gray-200 dark:border-border text-gray-500 dark:text-muted-foreground hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-none" title="Email User">
                                    <Mail className="h-4 w-4" />
                                </Button>
                            </a>
                        )}
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => window.print()}
                            className="h-9 w-9 rounded-xl border-gray-200 dark:border-border text-gray-500 dark:text-muted-foreground hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all hidden md:flex shadow-none print:hidden"
                            title="Print Record"
                        >
                            <Printer className="h-4 w-4" />
                        </Button>
                        <div className="hidden md:block h-6 w-px bg-gray-200 mx-1 border-r border-dashed print:hidden" />
                        <Button
                            variant="outline"
                            onClick={handleToggleStatus}
                            className={`h-9 px-4 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all border ${user.isActive ? 'border-amber-100 text-amber-600 bg-amber-50/50' : 'border-emerald-100 text-emerald-600 bg-emerald-50/50'} print:hidden`}
                        >
                            <Power className="h-3.5 w-3.5 mr-2" />
                            {user.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button className="h-9 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all active:scale-95">
                                    <Settings2 className="h-3.5 w-3.5 mr-2" /> Manage
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-gray-100 dark:border-border bg-white dark:bg-card">
                                <DropdownMenuLabel className="text-[9px] font-black uppercase text-gray-400 dark:text-muted-foreground tracking-widest px-3 py-2">Quick Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => { setEditData(user); setIsEditDialogOpen(true); }} className="rounded-xl px-4 py-3 font-bold text-[10px] uppercase tracking-widest gap-3 focus:bg-slate-50 cursor-pointer">
                                    <User className="h-4 w-4 text-indigo-600" /> Edit Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setEditData(user); setIsRoleDialogOpen(true); }} className="rounded-xl px-4 py-3 font-bold text-[10px] uppercase tracking-widest gap-3 focus:bg-slate-50 cursor-pointer">
                                    <Shield className="h-4 w-4 text-indigo-600" /> Change Role
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsAccessDialogOpen(true)} className="rounded-xl px-4 py-3 font-bold text-[10px] uppercase tracking-widest gap-3 focus:bg-slate-50 cursor-pointer">
                                    <Power className="h-4 w-4 text-indigo-600" /> Reset Password
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="my-2 bg-slate-100" />
                                <DropdownMenuItem onClick={handleArchiveRecord} className="rounded-xl px-4 py-3 font-bold text-[10px] uppercase tracking-widest gap-3 focus:bg-rose-50 text-rose-600 cursor-pointer">
                                    <Trash2 className="h-4 w-4" /> Delete Account
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
                {/* Metrics Matrix */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Payments', value: `PKR ${stats.totalPaid.toLocaleString()}`, icon: Wallet, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { label: 'Complaints', value: stats.compl, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Maintenance', value: stats.maint, icon: Zap, color: 'text-pink-600', bg: 'bg-pink-50' },
                        { label: 'Status', value: user.isActive ? 'Active' : 'Inactive', icon: ShieldCheck, color: user.isActive ? 'text-emerald-600' : 'text-gray-400 dark:text-muted-foreground', bg: user.isActive ? 'bg-emerald-50' : 'bg-gray-50 dark:bg-muted/10' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-5 flex items-center gap-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow">
                            <div className={`h-11 w-11 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">{stat.label}</span>
                                <span className="text-xl font-bold text-gray-900 dark:text-foreground tracking-tight">{stat.value}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Panel: Profile Detail */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="rounded-[2.5rem] border-none shadow-xl shadow-gray-200/50 bg-white dark:bg-card overflow-hidden">
                            <div className="p-8 space-y-8">
                                <div className="flex flex-col items-center">
                                    <div className="h-32 w-32 rounded-[2.5rem] bg-indigo-50 border-4 border-white shadow-2xl shadow-indigo-100 flex items-center justify-center text-indigo-600 overflow-hidden shrink-0 mb-6">
                                        {user.image ? <img src={user.image} alt="" className="h-full w-full object-cover" /> : <User className="h-12 w-12" />}
                                    </div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-foreground uppercase tracking-tight text-center leading-none">{user.name}</h2>
                                    <p className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.3em] mt-3">{user.role}</p>
                                    {user.uid && (
                                        <Badge className="mt-2 bg-gray-100 text-gray-500 dark:text-muted-foreground border-none text-[9px] font-mono font-bold px-3 py-1">
                                            ID: {user.uid}
                                        </Badge>
                                    )}
                                    {user.regNumber && (
                                        <Badge className="mt-2 bg-indigo-600 text-white border-none text-[10px] font-black px-4 py-1.5 shadow-lg shadow-indigo-100 uppercase tracking-[0.2em]">
                                            REG # {user.regNumber}
                                        </Badge>
                                    )}
                                </div>

                                <div className="space-y-6 pt-6 border-t border-gray-50">
                                    <DetailItem icon={Mail} label="Email Address" value={user.email} />
                                    <DetailItem icon={Phone} label="Phone Number" value={user.phone} />
                                    <DetailItem icon={Fingerprint} label="CNIC / ID" value={user.cnic} />
                                    <DetailItem icon={MapPin} label="Address" value={user.address} />
                                    <DetailItem icon={Calendar} label="Member Since" value={user.createdAt ? format(new Date(user.createdAt), 'MMMM dd, yyyy') : '—'} />
                                </div>

                                {additionalImages.length > 0 && (
                                    <div className="pt-6 border-t border-gray-50 space-y-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground">Additional Documents</span>
                                        <div className="grid grid-cols-2 gap-3">
                                            {additionalImages.map((src, idx) => (
                                                <a
                                                    key={`${src}-${idx}`}
                                                    href={src}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="block rounded-xl overflow-hidden border border-gray-100 dark:border-border bg-white dark:bg-card"
                                                >
                                                    <img src={src} alt={`document-${idx}`} className="h-24 w-full object-cover" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {user.ResidentProfile && (
                                    <div className="p-6 bg-gray-50 dark:bg-muted/10 rounded-3xl border border-gray-100 dark:border-border space-y-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="h-8 w-8 rounded-lg bg-white dark:bg-card flex items-center justify-center text-indigo-600 shadow-sm border">
                                                <UserCheck className="h-4 w-4" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase text-gray-900 dark:text-foreground tracking-widest">Emergency Contact</span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest leading-none mb-1">Guardian Name</span>
                                                <span className="text-xs font-bold text-gray-700 dark:text-foreground">{user.ResidentProfile.guardianName}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest leading-none mb-1">Contact No</span>
                                                <span className="text-xs font-bold text-gray-700 dark:text-foreground">{user.ResidentProfile.emergencyContact}</span>
                                            </div>
                                            {user?.ResidentProfile?.documents?.currentResidence && (
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest leading-none mb-1">Current Residence</span>
                                                    <span className="text-xs font-bold text-gray-700 dark:text-foreground">{user.ResidentProfile.documents.currentResidence}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Quick Hostel Box */}
                        <Card className="rounded-[2.5rem] p-8 bg-indigo-600 text-white relative overflow-hidden border-none shadow-xl shadow-indigo-200">
                            <div className="absolute top-0 right-0 h-full w-32 bg-white dark:bg-card/5 skew-x-12 translate-x-16" />
                            <div className="relative z-10 flex flex-col gap-6">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-black text-indigo-200 uppercase tracking-widest opacity-70">Assigned Branch</span>
                                        <h3 className="text-xl font-black text-white uppercase tracking-tight">{user.Hostel_User_hostelIdToHostel?.name || 'Main Office'}</h3>
                                    </div>
                                    <Building2 className="h-6 w-6 text-indigo-300" />
                                </div>
                                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-indigo-200 uppercase tracking-widest">Room</span>
                                        <span className="text-sm font-black text-white">{userDetails?.bookings?.[0]?.room?.roomNumber || 'N/A'}</span>
                                    </div>
                                    <Link href={`/admin/hostels/${user.hostelId}`}>
                                        <Button size="icon" className="h-10 w-10 rounded-xl bg-white dark:bg-card/10 hover:bg-white dark:bg-card/20 border-white/20 text-white shadow-none">
                                            <ArrowUpRight className="h-5 w-5" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Right Panel: Data Tabs */}
                    <div className="lg:col-span-8 space-y-8">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                            <div className="overflow-x-auto pb-1">
                                <TabsList className="bg-white dark:bg-card border border-gray-100 dark:border-border p-1.5 rounded-2xl h-14 shadow-sm inline-flex min-w-max">
                                    <TabsTrigger value="overview" className="h-full px-8 rounded-xl font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">Overview</TabsTrigger>
                                    <TabsTrigger value="database" className="h-full px-8 rounded-xl font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">All Details</TabsTrigger>
                                    {(user.role === 'RESIDENT' || user.role === 'GUEST') ? (
                                        <>
                                            <TabsTrigger value="bookings" className="h-full px-8 rounded-xl font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">Bookings</TabsTrigger>
                                            <TabsTrigger value="payments" className="h-full px-8 rounded-xl font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">Payments</TabsTrigger>
                                        </>
                                    ) : (
                                        <TabsTrigger value="salaries" className="h-full px-8 rounded-xl font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">Salaries</TabsTrigger>
                                    )}
                                    <TabsTrigger value="complaints" className="h-full px-8 rounded-xl font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">Reports</TabsTrigger>
                                    <TabsTrigger value="security" className="h-full px-8 rounded-xl font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">Security</TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="overview" className="m-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card className="rounded-[2.5rem] bg-white dark:bg-card p-8 border-none shadow-sm space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-foreground">Recent Activity</h3>
                                            <History className="h-4 w-4 text-gray-400 dark:text-muted-foreground" />
                                        </div>
                                        <ActivityFeed events={activityFeed} />
                                    </Card>

                                    {isWarden && wardenReports && (
                                        <Card className="rounded-[2.5rem] bg-white dark:bg-card p-8 border-none shadow-sm relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-8">
                                                <Building2 className="h-12 w-12 text-indigo-50 opacity-50 group-hover:scale-110 transition-transform" />
                                            </div>
                                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-foreground mb-8">Warden Performance (Current Month)</h3>
                                            <div className="space-y-6 relative z-10 hidden xs:block">
                                                <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest mb-1">Hostel Revenue</span>
                                                        <span className="text-2xl font-black text-indigo-600 tracking-tight">PKR {(wardenReports.finances?.revenue?.current || 0).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest mb-1">Hostel Expenses</span>
                                                        <span className="text-2xl font-black text-rose-500 tracking-tight">PKR {(wardenReports.finances?.expenses?.current || 0).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 mt-4">
                                                    <div className="h-20 w-20 shrink-0">
                                                        <OccupancyDonutChart occupancyRate={wardenReports.occupancy?.rate || 0} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black uppercase text-gray-400 dark:text-muted-foreground tracking-widest">Occupancy</span>
                                                        <span className="text-sm font-black text-gray-900 dark:text-foreground">{wardenReports.occupancy?.occupiedRooms || 0} / {wardenReports.occupancy?.totalRooms || 0} Rooms occupied</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-6 relative z-10 xs:hidden">
                                                <span className="text-xs font-bold text-gray-500 dark:text-muted-foreground">Summary hidden on narrow screens</span>
                                            </div>
                                        </Card>
                                    )}

                                    <Card className={`rounded-[2.5rem] bg-white dark:bg-card p-8 border-none shadow-sm relative overflow-hidden group ${isWarden ? "md:col-span-2" : ""}`}>
                                        <div className="absolute top-0 right-0 p-8">
                                            <Zap className="h-12 w-12 text-indigo-50 opacity-50 group-hover:scale-110 transition-transform" />
                                        </div>
                                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-foreground mb-8">Performance Summary</h3>
                                        <div className="space-y-6 relative z-10">
                                            <div className="flex justify-between items-end border-b border-gray-50 pb-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest mb-1">Total {(user.role === 'RESIDENT' || user.role === 'GUEST') ? 'Paid' : 'Earned'}</span>
                                                    <span className="text-2xl font-black text-indigo-600 tracking-tight">PKR {stats.totalPaid.toLocaleString()}</span>
                                                </div>
                                                <TrendingUp className="h-5 w-5 text-emerald-500" />
                                            </div>
                                            <div className="flex justify-between items-end border-b border-gray-50 pb-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest mb-1">Issue Count</span>
                                                    <span className="text-2xl font-black text-amber-500 tracking-tight">{stats.compl} Reports</span>
                                                </div>
                                                <AlertCircle className="h-5 w-5 text-amber-500" />
                                            </div>
                                            <div className="pt-4">
                                                <Button
                                                    className="w-full h-12 rounded-2xl bg-gray-50 dark:bg-muted/10 hover:bg-gray-100 text-gray-600 dark:text-muted-foreground font-bold text-[10px] uppercase tracking-widest border border-gray-200 dark:border-border/50 shadow-none"
                                                    onClick={() => {
                                                        const headers = ["Activity", "Description", "Date", "Status"];
                                                        const rows = activityFeed.map(e => [
                                                            e.title,
                                                            e.description,
                                                            (e.date && !isNaN(e.date.getTime())) ? format(e.date, 'yyyy-MM-dd HH:mm') : 'N/A',
                                                            e.status
                                                        ]);
                                                        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
                                                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                                        const link = document.createElement("a");
                                                        const url = URL.createObjectURL(blob);
                                                        link.setAttribute("href", url);
                                                        link.setAttribute("download", `User_History_${user.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.csv`);
                                                        document.body.appendChild(link);
                                                        link.click();
                                                        document.body.removeChild(link);
                                                        toast.success("History exported successfully");
                                                    }}
                                                >
                                                    Download User History
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </TabsContent>

                            <TabsContent value="database" className="m-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <KeyValueGrid
                                    title="Core User Fields"
                                    data={{
                                        id: user?.id,
                                        uid: user?.uid,
                                        regNumber: user?.regNumber,
                                        name: user?.name,
                                        email: user?.email,
                                        phone: user?.phone,
                                        role: user?.role,
                                        cnic: user?.cnic,
                                        city: user?.city,
                                        address: user?.address,
                                        hostelId: user?.hostelId,
                                        isActive: user?.isActive,
                                        createdAt: user?.createdAt ? format(new Date(user.createdAt), "yyyy-MM-dd HH:mm:ss") : "—",
                                        updatedAt: user?.updatedAt ? format(new Date(user.updatedAt), "yyyy-MM-dd HH:mm:ss") : "—",
                                    }}
                                />

                                {(user?.ResidentProfile?.documents?.currentResidence || additionalImages.length > 0) && (
                                    <Card className="rounded-[2.5rem] bg-white dark:bg-card p-8 border border-gray-100 dark:border-border shadow-sm">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-foreground mb-6">Documents</h3>
                                        <div className="space-y-6">
                                            <div className="rounded-2xl border border-gray-100 dark:border-border bg-gray-50 dark:bg-background p-4">
                                                <p className="text-[9px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest mb-1">Current Residence</p>
                                                <p className="text-sm font-bold text-gray-900 dark:text-foreground wrap-break-word">
                                                    {user?.ResidentProfile?.documents?.currentResidence || "—"}
                                                </p>
                                            </div>
                                            {additionalImages.length > 0 && (
                                                <div>
                                                    <p className="text-[9px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest mb-3">Additional Document Images</p>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                                        {additionalImages.map((src, idx) => (
                                                            <a
                                                                key={`${src}-${idx}`}
                                                                href={src}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="block rounded-xl overflow-hidden border border-gray-100 dark:border-border bg-white dark:bg-card"
                                                            >
                                                                <img src={src} alt={`database-document-${idx}`} className="h-24 w-full object-cover" />
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                )}

                                <Card className="rounded-[2.5rem] bg-white dark:bg-card p-8 border border-gray-100 dark:border-border shadow-sm">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-foreground mb-6">Related Records Summary</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { label: "Bookings", value: userDetails?.bookings?.length || 0 },
                                            { label: "Payments", value: userDetails?.payments?.length || 0 },
                                            { label: "Complaints", value: userDetails?.complaints?.length || 0 },
                                            { label: "Maintenance", value: userDetails?.maintenanceTasks?.length || 0 },
                                            { label: "Salaries", value: userDetails?.salaries?.length || 0 },
                                            { label: "Created Expenses", value: userDetails?.createdExpenses?.length || 0 },
                                            { label: "Approved Expenses", value: userDetails?.approvedExpenses?.length || 0 },
                                            { label: "Rejected Expenses", value: userDetails?.rejectedExpenses?.length || 0 },
                                        ].map((item) => (
                                            <div key={item.label} className="rounded-2xl border border-gray-100 dark:border-border bg-gray-50 dark:bg-background p-4">
                                                <p className="text-[9px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest">{item.label}</p>
                                                <p className="text-2xl font-black text-gray-900 dark:text-foreground mt-1">{item.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </TabsContent>

                            <TabsContent value="salaries" className="m-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <Card className="rounded-[2.5rem] bg-white dark:bg-card overflow-hidden border-none shadow-sm">
                                    <Table>
                                        <TableHeader className="bg-gray-50 dark:bg-background">
                                            <TableRow className="border-none hover:bg-transparent">
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-8">Payroll Month</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-4">Amount</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-4">Mode</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-4">Status</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {userDetails?.salaries?.map((s) => (
                                                <TableRow key={s.id} className="border-gray-50 hover:bg-gray-50 dark:hover:bg-muted/5 dark:bg-muted/10 transition-colors">
                                                    <TableCell className="px-8 py-5">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-gray-900 dark:text-foreground">{s.month}</span>
                                                            <span className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">{s.paymentDate ? format(new Date(s.paymentDate), 'MMM dd, yyyy') : 'Processing'}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-5">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-gray-900 dark:text-foreground">PKR {s.amount.toLocaleString()}</span>
                                                            <span className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">Base: {s.basicSalary.toLocaleString()}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-5 font-bold text-gray-700 dark:text-foreground text-xs uppercase tracking-wider">{s.paymentMethod || 'N/A'}</TableCell>
                                                    <TableCell className="px-4 py-5">
                                                        <Badge className={`rounded-lg px-3 py-1 font-bold text-[9px] uppercase tracking-widest border shadow-none ${s.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                            s.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                                'bg-rose-50 text-rose-700 border-rose-100'
                                                            }`}>
                                                            {s.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="px-8 py-5 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedSalary(s);
                                                                setIsSlipDialogOpen(true);
                                                            }}
                                                            className="h-8 px-3 rounded-xl text-[9px] font-bold uppercase tracking-wider text-indigo-600 hover:bg-indigo-50"
                                                        >
                                                            View Slip
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {(!userDetails?.salaries || userDetails.salaries.length === 0) && (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="h-60 text-center">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <Wallet className="h-10 w-10 text-gray-200" />
                                                            <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-[0.2em]">No payroll records detected</p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </Card>
                            </TabsContent>

                            <TabsContent value="bookings" className="m-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <Card className="rounded-[2.5rem] bg-white dark:bg-card overflow-hidden border-none shadow-sm">
                                    <Table>
                                        <TableHeader className="bg-gray-50 dark:bg-background">
                                            <TableRow className="border-none hover:bg-transparent">
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-8">Stay Period</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-4">Hostel & Room</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-4">Cost</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 text-right">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {userDetails?.bookings?.map((b) => (
                                                <TableRow
                                                    key={b.id}
                                                    className="border-gray-50 hover:bg-gray-50 dark:hover:bg-muted/5 dark:bg-muted/10 transition-colors cursor-pointer"
                                                    onClick={() => {
                                                        setSelectedBooking(b);
                                                        setIsBookingDialogOpen(true);
                                                    }}
                                                >
                                                    <TableCell className="px-8 py-5">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-gray-900 dark:text-foreground">{b.checkIn ? format(new Date(b.checkIn), 'MMM dd, yyyy') : '—'}</span>
                                                            <span className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">to {b.checkOut ? format(new Date(b.checkOut), 'MMM dd, yyyy') : 'Present'}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-5">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-gray-700 dark:text-foreground">{b.room?.Hostel?.name}</span>
                                                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider">Room {b.room?.roomNumber}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-5 font-bold text-gray-900 dark:text-foreground text-xs">PKR {b.totalAmount.toLocaleString()}</TableCell>
                                                    <TableCell className="px-8 py-5 text-right">
                                                        <Badge className={`rounded-lg px-3 py-1 font-bold text-[9px] uppercase tracking-widest border shadow-none ${b.status === 'CHECKED_IN' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                            b.status === 'COMPLETED' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                                                'bg-amber-50 text-amber-700 border-amber-100'
                                                            }`}>
                                                            {b.status}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {(!userDetails?.bookings || userDetails.bookings.length === 0) && (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="h-60 text-center">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <Building2 className="h-10 w-10 text-gray-200" />
                                                            <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-[0.2em]">No booking records</p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </Card>
                            </TabsContent>

                            <TabsContent value="payments" className="m-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <Card className="rounded-[2.5rem] bg-white dark:bg-card overflow-hidden border-none shadow-sm">
                                    <Table>
                                        <TableHeader className="bg-gray-50 dark:bg-background">
                                            <TableRow className="border-none hover:bg-transparent">
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-8">Transaction Date</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-4">Method</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-4">Amount</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 text-right">Verification</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {userDetails?.payments?.map((p) => (
                                                <TableRow
                                                    key={p.id}
                                                    className="border-gray-50 hover:bg-gray-50 dark:hover:bg-muted/5 dark:bg-muted/10 transition-colors cursor-pointer"
                                                    onClick={() => router.push(`/admin/payments/${p.id}`)}
                                                >
                                                    <TableCell className="px-8 py-5">
                                                        <span className="text-xs font-bold text-gray-900 dark:text-foreground">{p.date || p.createdAt ? format(new Date(p.date || p.createdAt), 'MMMM dd, yyyy') : '—'}</span>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-5">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-gray-700 dark:text-foreground">{p.method}</span>
                                                            <span className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">ID: #{p.id.slice(-6).toUpperCase()}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-5 font-bold text-gray-900 dark:text-foreground text-sm">PKR {p.amount.toLocaleString()}</TableCell>
                                                    <TableCell className="px-8 py-5 text-right">
                                                        <Badge className={`rounded-lg px-3 py-1 font-bold text-[9px] uppercase tracking-widest border shadow-none ${p.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                            p.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                                'bg-rose-50 text-rose-700 border-rose-100'
                                                            }`}>
                                                            {p.status}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {(!userDetails?.payments || userDetails.payments.length === 0) && (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="h-60 text-center">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <CreditCard className="h-10 w-10 text-gray-200" />
                                                            <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-[0.2em]">No financial data</p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </Card>
                            </TabsContent>

                            <TabsContent value="complaints" className="m-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {userDetails?.complaints?.map((c) => (
                                        <Card key={c.id} className="rounded-[2.5rem] bg-white dark:bg-card p-8 border-none shadow-sm space-y-4 hover:shadow-md transition-shadow group">
                                            <div className="flex justify-between items-start">
                                                <div className="h-10 w-10 rounded-xl bg-gray-50 dark:bg-muted/10 flex items-center justify-center text-gray-400 dark:text-muted-foreground group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                    <AlertCircle className="h-5 w-5" />
                                                </div>
                                                <Badge variant="outline" className="rounded-lg px-2 py-0.5 font-bold text-[8px] uppercase tracking-widest text-gray-400 dark:text-muted-foreground border-gray-100 dark:border-border">{c.status}</Badge>
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-black text-gray-900 dark:text-foreground uppercase tracking-tight">{c.title}</h4>
                                                <p className="text-xs text-gray-500 dark:text-muted-foreground font-medium line-clamp-2 leading-relaxed italic">"{c.description}"</p>
                                            </div>
                                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                                <span className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">{c.createdAt ? format(new Date(c.createdAt), 'MMM dd, yyyy') : '—'}</span>
                                                <Link href={`/admin/complaints/${c.id}`}>
                                                    <Button variant="ghost" className="h-8 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50">View details</Button>
                                                </Link>
                                            </div>
                                        </Card>
                                    ))}
                                    {(!userDetails?.complaints || userDetails.complaints.length === 0) && (
                                        <div className="md:col-span-2 h-60 flex flex-col items-center justify-center bg-white dark:bg-card rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-border">
                                            <MessageSquare className="h-10 w-10 text-gray-200 mb-3" />
                                            <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-[0.2em]">No reports found</p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="security" className="m-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <Card className="rounded-[2.5rem] bg-white dark:bg-card overflow-hidden border-none shadow-sm">
                                    <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                                                <Shield className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black uppercase tracking-tight text-gray-900 dark:text-foreground">Active Sessions</h3>
                                                <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">Global Session Control</p>
                                            </div>
                                        </div>
                                        <Button 
                                            variant="outline" 
                                            className="h-10 px-6 rounded-xl border-rose-100 text-rose-600 hover:bg-rose-50 font-bold text-[10px] uppercase tracking-widest"
                                            onClick={async () => {
                                                if (confirm("Terminate all sessions for this user? They will be logged out everywhere.")) {
                                                    try {
                                                        const res = await fetch(`/api/user/sessions?userId=${user.id}`, { method: 'DELETE' });
                                                        if (res.ok) {
                                                            toast.success("All sessions terminated");
                                                            router.refresh();
                                                        }
                                                    } catch (e) {
                                                        toast.error("Failed to terminate sessions");
                                                    }
                                                }
                                            }}
                                        >
                                            Terminate All
                                        </Button>
                                    </div>
                                    <Table>
                                        <TableHeader className="bg-gray-50 dark:bg-background">
                                            <TableRow className="border-none hover:bg-transparent">
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-8">Device / Client</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-4">Network</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-4">Last Activity</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-4">Status</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 text-right">Control</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {userDetails?.sessions?.map((s) => (
                                                <TableRow key={s.id} className="border-gray-50 hover:bg-gray-50 dark:hover:bg-muted/5 dark:bg-muted/10 transition-colors">
                                                    <TableCell className="px-8 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                                                                <Smartphone className="h-4 w-4" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-bold text-gray-900 dark:text-foreground">{s.device || 'Unknown Device'}</span>
                                                                <span className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">ID: {s.id.slice(-8).toUpperCase()}</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-5 font-bold text-gray-700 dark:text-foreground text-xs font-mono">
                                                        <div className="flex items-center gap-2">
                                                            <Globe className="h-3 w-3 text-gray-300" />
                                                            {s.ipAddress || '0.0.0.0'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-5">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-gray-700 dark:text-foreground">{format(new Date(s.lastActive), 'MMM dd, p')}</span>
                                                            <span className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">Created: {format(new Date(s.createdAt), 'MMM dd')}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-5">
                                                        <Badge className={`rounded-lg px-3 py-1 font-bold text-[9px] uppercase tracking-widest border shadow-none ${s.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                                                            {s.isActive ? 'Active' : 'Revoked'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="px-8 py-5 text-right">
                                                        {s.isActive && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={async () => {
                                                                    try {
                                                                        const res = await fetch(`/api/user/sessions?sessionId=${s.id}`, { method: 'DELETE' });
                                                                        if (res.ok) {
                                                                            toast.success("Session terminated");
                                                                            router.refresh();
                                                                        }
                                                                    } catch (e) {
                                                                        toast.error("Failed to revoke session");
                                                                    }
                                                                }}
                                                                className="h-8 w-8 p-0 rounded-xl text-rose-600 hover:bg-rose-50"
                                                            >
                                                                <Power className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {(!userDetails?.sessions || userDetails.sessions.length === 0) && (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="h-60 text-center">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <ShieldCheck className="h-10 w-10 text-gray-200" />
                                                            <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-[0.2em]">No active sessions found</p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </main>

            {/* Salary Slip Dialog */}
            <Dialog open={isSlipDialogOpen} onOpenChange={setIsSlipDialogOpen}>
                <DialogContent className="max-w-3xl p-0 bg-transparent border-none overflow-y-auto max-h-[95vh] shadow-none">
                    {selectedSalary && (
                        <SalarySlip
                            salary={{
                                ...selectedSalary,
                                StaffProfile: {
                                    User: user,
                                    designation: user.role === 'WARDEN' ? 'Warden' : 'Staff'
                                }
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Management Dialogs */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="rounded-3xl border-none p-10 max-w-lg shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Edit Information</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 pt-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest pl-1 text-gray-400 dark:text-muted-foreground">Full Name</Label>
                                <Input value={editData?.name} onChange={e => setEditData({ ...editData, name: e.target.value })} className="h-12 rounded-xl border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/10 font-bold px-4" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest pl-1 text-gray-400 dark:text-muted-foreground">Email Address</Label>
                                <Input value={editData?.email} onChange={e => setEditData({ ...editData, email: e.target.value })} className="h-12 rounded-xl border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/10 font-bold px-4" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest pl-1 text-gray-400 dark:text-muted-foreground">Phone Number</Label>
                                <Input value={editData?.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} className="h-12 rounded-xl border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/10 font-bold px-4" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest pl-1 text-gray-400 dark:text-muted-foreground">CNIC / ID</Label>
                                <Input value={editData?.cnic} onChange={e => setEditData({ ...editData, cnic: e.target.value })} className="h-12 rounded-xl border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/10 font-bold px-4" />
                            </div>
                        </div>

                        {editData?.role === 'WARDEN' && (
                            <div className="space-y-4 pt-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted-foreground">Expense Permissions</Label>
                                <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 dark:bg-muted/10 rounded-xl border border-gray-100 dark:border-border">
                                    <div className="flex items-center gap-3 col-span-2 pb-2 border-b border-gray-200 dark:border-border">
                                        <input
                                            type="checkbox"
                                            id="edit-manage-expenses-detailed"
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                            checked={editData?.canManageExpenses || false}
                                            onChange={(e) => setEditData({ ...editData, canManageExpenses: e.target.checked })}
                                        />
                                        <Label htmlFor="edit-manage-expenses-detailed" className="text-[11px] font-bold text-gray-700 dark:text-foreground cursor-pointer uppercase">Master Access (All)</Label>
                                    </div>
                                    {[
                                        { id: 'canManageMess', label: 'Mess' },
                                        { id: 'canManageGeneral', label: 'General' },
                                        { id: 'canManageUtilities', label: 'Utilities' },
                                        { id: 'canManageMaintenance', label: 'Maintenance' },
                                        { id: 'canManageSalaries', label: 'Salaries' },
                                    ].map(p => (
                                        <div key={p.id} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id={`edit-detailed-${p.id}`}
                                                disabled={editData?.canManageExpenses}
                                                className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                                checked={editData?.canManageExpenses || editData?.[p.id] || false}
                                                onChange={(e) => setEditData({ ...editData, [p.id]: e.target.checked })}
                                            />
                                            <Label htmlFor={`edit-detailed-${p.id}`} className={`text-[10px] font-bold uppercase cursor-pointer ${editData?.canManageExpenses ? 'text-gray-300' : 'text-gray-600 dark:text-muted-foreground'}`}>{p.label}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="pt-8">
                        <Button onClick={handleEditIdentity} disabled={isUpdating} className="h-14 w-full rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02]">Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
                <DialogContent className="rounded-3xl border-none p-10 max-w-sm shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tighter italic text-center">Set User Role</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-6">
                        {['ADMIN', 'WARDEN', 'STAFF', 'RESIDENT', 'GUEST'].map(r => (
                            <Button
                                key={r}
                                onClick={() => setEditData({ ...editData, role: r })}
                                variant={editData?.role === r ? 'default' : 'outline'}
                                className={`h-12 w-full rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${editData?.role === r ? 'bg-indigo-600 border-indigo-600' : 'border-gray-100 dark:border-border text-gray-400 dark:text-muted-foreground'}`}
                            >
                                {r}
                            </Button>
                        ))}

                        {editData?.role === 'WARDEN' && (
                            <div className="space-y-4 pt-2 text-left">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted-foreground">Expense Permissions</Label>
                                <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 dark:bg-muted/10 rounded-xl border border-gray-100 dark:border-border">
                                    <div className="flex items-center gap-3 col-span-2 pb-2 border-b border-gray-200 dark:border-border">
                                        <input
                                            type="checkbox"
                                            id="role-manage-expenses-detailed"
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                            checked={editData?.canManageExpenses || false}
                                            onChange={(e) => setEditData({ ...editData, canManageExpenses: e.target.checked })}
                                        />
                                        <Label htmlFor="role-manage-expenses-detailed" className="text-[11px] font-bold text-gray-700 dark:text-foreground cursor-pointer uppercase">Master Access (All)</Label>
                                    </div>
                                    {[
                                        { id: 'canManageMess', label: 'Mess' },
                                        { id: 'canManageGeneral', label: 'General' },
                                        { id: 'canManageUtilities', label: 'Utilities' },
                                        { id: 'canManageMaintenance', label: 'Maintenance' },
                                        { id: 'canManageSalaries', label: 'Salaries' },
                                    ].map(p => (
                                        <div key={p.id} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id={`role-detailed-${p.id}`}
                                                disabled={editData?.canManageExpenses}
                                                className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                                checked={editData?.canManageExpenses || editData?.[p.id] || false}
                                                onChange={(e) => setEditData({ ...editData, [p.id]: e.target.checked })}
                                            />
                                            <Label htmlFor={`role-detailed-${p.id}`} className={`text-[10px] font-bold uppercase cursor-pointer ${editData?.canManageExpenses ? 'text-gray-300' : 'text-gray-600 dark:text-muted-foreground'}`}>{p.label}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="pt-8">
                        <Button onClick={handleUpdateRole} disabled={isUpdating} className="h-14 w-full rounded-2xl bg-gray-900 text-white font-black uppercase tracking-widest shadow-xl shadow-gray-200">Update Role</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isAccessDialogOpen} onOpenChange={setIsAccessDialogOpen}>
                <DialogContent className="rounded-3xl border-none p-10 max-w-sm shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tighter italic text-center">Reset Password</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 pt-6">
                        <p className="text-[10px] text-gray-400 dark:text-muted-foreground font-bold uppercase tracking-widest text-center">Set a new temporary password for this user.</p>
                        <Input
                            type="text"
                            placeholder="New password..."
                            value={newPass}
                            onChange={e => setNewPass(e.target.value)}
                            className="h-14 rounded-2xl border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/10 font-black text-center text-lg tracking-widest"
                        />
                    </div>
                    <DialogFooter className="pt-8">
                        <Button onClick={handleResetKey} className="h-14 w-full rounded-2xl bg-rose-600 text-white font-black uppercase tracking-widest shadow-xl shadow-rose-100">Reset Now</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Booking Details & Payment Dialog */}
            <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
                <DialogContent className="rounded-3xl border-none p-10 max-w-2xl shadow-2xl bg-white dark:bg-card">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic text-gray-900 dark:text-foreground flex items-center gap-3">
                            <Building2 className="h-6 w-6 text-indigo-600" />
                            Booking Details
                        </DialogTitle>
                    </DialogHeader>

                    {selectedBooking && (
                        <div className="space-y-8 pt-6">
                            {/* Booking Info Card */}
                            <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 relative overflow-hidden">
                                <div className="absolute right-0 top-0 h-full w-32 bg-indigo-100/50 skew-x-12 translate-x-16" />
                                <div className="relative z-10 grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Hostel</p>
                                        <p className="text-sm font-black text-indigo-900">{selectedBooking.room?.Hostel?.name}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Room</p>
                                        <p className="text-sm font-black text-indigo-900">Room {selectedBooking.room?.roomNumber}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Check-In</p>
                                        <p className="text-sm font-bold text-gray-700 dark:text-foreground">{selectedBooking.checkIn ? format(new Date(selectedBooking.checkIn), 'MMM dd, yyyy') : '—'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Total Amt</p>
                                        <p className="text-lg font-black text-indigo-600">PKR {selectedBooking.totalAmount.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <CreditCard className="h-5 w-5 text-gray-400 dark:text-muted-foreground" />
                                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-foreground">Record Payment</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest pl-1 text-gray-400 dark:text-muted-foreground">Amount (PKR)</Label>
                                        <Input
                                            type="number"
                                            value={paymentAmount}
                                            onChange={e => setPaymentAmount(e.target.value)}
                                            placeholder="e.g. 5000"
                                            className="h-12 rounded-xl border-gray-200 dark:border-border bg-gray-50 dark:bg-background font-bold px-4"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest pl-1 text-gray-400 dark:text-muted-foreground">Method</Label>
                                        <select
                                            className="w-full h-12 rounded-xl border border-gray-200 dark:border-border bg-gray-50 dark:bg-background font-bold px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-600"
                                            value={paymentMethod}
                                            onChange={e => setPaymentMethod(e.target.value)}
                                        >
                                            <option value="CASH">Cash</option>
                                            <option value="CARD">Card</option>
                                            <option value="BANK_TRANSFER">Bank Transfer</option>
                                            <option value="UPI">UPI / Mobile</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="pt-8 flex gap-3 sm:justify-between w-full">
                        {selectedBooking && (
                            <Link href={`/admin/bookings/${selectedBooking.id}`}>
                                <Button variant="outline" className="h-12 px-6 rounded-xl font-bold uppercase text-[10px] tracking-widest w-full sm:w-auto">
                                    Full Details <ArrowUpRight className="h-4 w-4 ml-2" />
                                </Button>
                            </Link>
                        )}
                        <Button
                            onClick={async () => {
                                if (!paymentAmount || isNaN(paymentAmount)) {
                                    toast.error("Please enter a valid amount");
                                    return;
                                }
                                try {
                                    await createPayment.mutateAsync({
                                        bookingId: selectedBooking.id,
                                        userId: userId,
                                        amount: Number(paymentAmount),
                                        method: paymentMethod,
                                        date: new Date().toISOString(),
                                        status: 'PAID',
                                        notes: 'Logged directly from User Record popup'
                                    });
                                    setPaymentAmount("");
                                    setIsBookingDialogOpen(false);
                                } catch (error) {
                                    // Error handled in hook
                                }
                            }}
                            disabled={createPayment.isPending}
                            className={`h-12 px-8 rounded-xl text-white font-black uppercase tracking-widest flex items-center justify-center flex-1 sm:flex-none transition-all ${createPayment.isPending ? 'bg-indigo-400 shadow-none cursor-not-allowed' : 'bg-indigo-600 shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95'}`}
                        >
                            {createPayment.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...
                                </>
                            ) : (
                                "Save Payment"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default UserDetailsPage;
