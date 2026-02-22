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
    UserCheck,
    Fingerprint,
    Info,
    ArrowUpRight
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
import Loader from "@/components/ui/Loader";

const DetailItem = ({ icon: Icon, label, value, color = "text-indigo-600" }) => (
    <div className="flex items-start gap-4">
        <div className={`h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 ${color}`}>
            <Icon className="h-4 w-4" />
        </div>
        <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</span>
            <span className="text-sm font-bold text-gray-900 truncate tracking-tight">{value || "Not Provided"}</span>
        </div>
    </div>
);

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
    const [editData, setEditData] = useState(null);
    const [newPass, setNewPass] = useState("hostel123");

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
                data: { role: editData.role }
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
            totalPaid: userDetails.payments?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0,
            compl: userDetails.complaints?.length || 0,
            maint: userDetails.maintenanceTasks?.length || 0
        };
    }, [userDetails]);

    const activityFeed = useMemo(() => {
        const events = [];
        if (userDetails?.payments) {
            userDetails.payments.forEach(p => events.push({
                type: 'payment',
                title: 'Payment Received',
                description: `Received ${p.amount} PKR via ${p.method}`,
                date: new Date(p.date),
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
                date: new Date(c.createdAt),
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
                date: new Date(b.createdAt),
                status: b.status,
                icon: Building2,
                color: 'text-indigo-600',
                bgColor: 'bg-indigo-50'
            }));
        }
        return events.sort((a, b) => b.date - a.date).slice(0, 10);
    }, [userDetails]);

    if (userLoading || detailsLoading) return (
        <Loader label="Syncing Personnel..." subLabel="Fetching detailed profile records" icon={Scan} fullScreen={true} />
    );

    if (!user) return (
        <div className="flex h-screen items-center justify-center">
            <div className="text-center space-y-6">
                <div className="h-20 w-20 bg-rose-50 text-rose-600 rounded-[2rem] flex items-center justify-center mx-auto border border-rose-100 shadow-sm">
                    <User className="h-10 w-10" />
                </div>
                <div className="space-y-1">
                    <h1 className="text-xl font-bold text-gray-900 uppercase tracking-tight">User Not Found</h1>
                    <p className="text-sm text-gray-400 font-medium">The user you are looking for does not exist.</p>
                </div>
                <Button onClick={() => router.back()} variant="outline" className="h-11 px-8 rounded-xl font-bold text-[10px] uppercase tracking-wider">
                    Go Back
                </Button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight">
            {/* Minimal Premium Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100 h-9 w-9" onClick={() => router.back()}>
                            <ChevronLeft className="h-5 w-5 text-gray-400" />
                        </Button>
                        <div className="h-8 w-px bg-gray-100" />
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight uppercase">{user.name}</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">{user.role}</span>
                                {user.uid && (
                                    <>
                                        <div className="h-1 w-1 rounded-full bg-gray-300" />
                                        <span className="text-[10px] font-mono font-bold tracking-wider text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{user.uid}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={handleToggleStatus}
                            className={`h-9 px-4 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all border ${user.isActive ? 'border-amber-100 text-amber-600 bg-amber-50/50' : 'border-emerald-100 text-emerald-600 bg-emerald-50/50'}`}
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
                            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-gray-100 bg-white">
                                <DropdownMenuLabel className="text-[9px] font-black uppercase text-gray-400 tracking-widest px-3 py-2">Quick Actions</DropdownMenuLabel>
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
                        { label: 'Status', value: user.isActive ? 'Active' : 'Inactive', icon: ShieldCheck, color: user.isActive ? 'text-emerald-600' : 'text-gray-400', bg: user.isActive ? 'bg-emerald-50' : 'bg-gray-50' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow">
                            <div className={`h-11 w-11 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</span>
                                <span className="text-xl font-bold text-gray-900 tracking-tight">{stat.value}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Panel: Profile Detail */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="rounded-[2.5rem] border-none shadow-xl shadow-gray-200/50 bg-white overflow-hidden">
                            <div className="p-8 space-y-8">
                                <div className="flex flex-col items-center">
                                    <div className="h-32 w-32 rounded-[2.5rem] bg-indigo-50 border-4 border-white shadow-2xl shadow-indigo-100 flex items-center justify-center text-indigo-600 overflow-hidden shrink-0 mb-6">
                                        {user.image ? <img src={user.image} alt="" className="h-full w-full object-cover" /> : <User className="h-12 w-12" />}
                                    </div>
                                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight text-center leading-none">{user.name}</h2>
                                    <p className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.3em] mt-3">{user.role}</p>
                                    {user.uid && (
                                        <Badge className="mt-2 bg-gray-100 text-gray-500 border-none text-[9px] font-mono font-bold px-3 py-1">
                                            {user.uid}
                                        </Badge>
                                    )}
                                </div>

                                <div className="space-y-6 pt-6 border-t border-gray-50">
                                    <DetailItem icon={Mail} label="Email Address" value={user.email} />
                                    <DetailItem icon={Phone} label="Phone Number" value={user.phone} />
                                    <DetailItem icon={Fingerprint} label="CNIC / ID" value={user.cnic} />
                                    <DetailItem icon={MapPin} label="Address" value={user.address} />
                                    <DetailItem icon={Calendar} label="Member Since" value={format(new Date(user.createdAt), 'MMMM dd, yyyy')} />
                                </div>

                                {user.ResidentProfile && (
                                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-indigo-600 shadow-sm border">
                                                <UserCheck className="h-4 w-4" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase text-gray-900 tracking-widest">Emergency Contact</span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Guardian Name</span>
                                                <span className="text-xs font-bold text-gray-700">{user.ResidentProfile.guardianName}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Contact No</span>
                                                <span className="text-xs font-bold text-gray-700">{user.ResidentProfile.emergencyContact}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Quick Hostel Box */}
                        <Card className="rounded-[2.5rem] p-8 bg-indigo-600 text-white relative overflow-hidden border-none shadow-xl shadow-indigo-200">
                            <div className="absolute top-0 right-0 h-full w-32 bg-white/5 skew-x-12 translate-x-16" />
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
                                        <Button size="icon" className="h-10 w-10 rounded-xl bg-white/10 hover:bg-white/20 border-white/20 text-white shadow-none">
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
                            <TabsList className="bg-white border border-gray-100 p-1.5 rounded-2xl h-14 shadow-sm inline-flex">
                                <TabsTrigger value="overview" className="h-full px-8 rounded-xl font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">Overview</TabsTrigger>
                                {(user.role === 'RESIDENT' || user.role === 'GUEST') ? (
                                    <>
                                        <TabsTrigger value="bookings" className="h-full px-8 rounded-xl font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">Bookings</TabsTrigger>
                                        <TabsTrigger value="payments" className="h-full px-8 rounded-xl font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">Payments</TabsTrigger>
                                    </>
                                ) : (
                                    <TabsTrigger value="salaries" className="h-full px-8 rounded-xl font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">Salaries</TabsTrigger>
                                )}
                                <TabsTrigger value="complaints" className="h-full px-8 rounded-xl font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">Reports</TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="m-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card className="rounded-[2.5rem] bg-white p-8 border-none shadow-sm space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Recent Activity</h3>
                                            <History className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <ActivityFeed events={activityFeed} />
                                    </Card>

                                    <Card className="rounded-[2.5rem] bg-white p-8 border-none shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-8">
                                            <Zap className="h-12 w-12 text-indigo-50 opacity-50 group-hover:scale-110 transition-transform" />
                                        </div>
                                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-8">Performance Summary</h3>
                                        <div className="space-y-6 relative z-10">
                                            <div className="flex justify-between items-end border-b border-gray-50 pb-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total {(user.role === 'RESIDENT' || user.role === 'GUEST') ? 'Paid' : 'Earned'}</span>
                                                    <span className="text-2xl font-black text-indigo-600 tracking-tight">PKR {stats.totalPaid.toLocaleString()}</span>
                                                </div>
                                                <TrendingUp className="h-5 w-5 text-emerald-500" />
                                            </div>
                                            <div className="flex justify-between items-end border-b border-gray-50 pb-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Issue Count</span>
                                                    <span className="text-2xl font-black text-amber-500 tracking-tight">{stats.compl} Reports</span>
                                                </div>
                                                <AlertCircle className="h-5 w-5 text-amber-500" />
                                            </div>
                                            <div className="pt-4">
                                                <Button
                                                    className="w-full h-12 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-[10px] uppercase tracking-widest border border-gray-200/50 shadow-none"
                                                    onClick={() => {
                                                        const headers = ["Activity", "Description", "Date", "Status"];
                                                        const rows = activityFeed.map(e => [
                                                            e.title,
                                                            e.description,
                                                            format(e.date, 'yyyy-MM-dd HH:mm'),
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

                            <TabsContent value="salaries" className="m-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <Card className="rounded-[2.5rem] bg-white overflow-hidden border-none shadow-sm">
                                    <Table>
                                        <TableHeader className="bg-gray-50/50">
                                            <TableRow className="border-none hover:bg-transparent">
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-8">Payroll Month</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-4">Amount</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-4">Mode</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 text-right">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {userDetails?.salaries?.map((s) => (
                                                <TableRow key={s.id} className="border-gray-50 hover:bg-gray-50 transition-colors">
                                                    <TableCell className="px-8 py-5">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-gray-900">{s.month}</span>
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{s.paymentDate ? format(new Date(s.paymentDate), 'MMM dd, yyyy') : 'Processing'}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-5">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-gray-900">PKR {s.amount.toLocaleString()}</span>
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Base: {s.basicSalary.toLocaleString()}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-5 font-bold text-gray-700 text-xs uppercase tracking-wider">{s.paymentMethod || 'N/A'}</TableCell>
                                                    <TableCell className="px-8 py-5 text-right">
                                                        <Badge className={`rounded-lg px-3 py-1 font-bold text-[9px] uppercase tracking-widest border shadow-none ${s.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                            s.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                                'bg-rose-50 text-rose-700 border-rose-100'
                                                            }`}>
                                                            {s.status}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {(!userDetails?.salaries || userDetails.salaries.length === 0) && (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="h-60 text-center">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <Wallet className="h-10 w-10 text-gray-200" />
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">No payroll records detected</p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </Card>
                            </TabsContent>

                            <TabsContent value="bookings" className="m-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <Card className="rounded-[2.5rem] bg-white overflow-hidden border-none shadow-sm">
                                    <Table>
                                        <TableHeader className="bg-gray-50/50">
                                            <TableRow className="border-none hover:bg-transparent">
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-8">Stay Period</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-4">Hostel & Room</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-4">Cost</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 text-right">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {userDetails?.bookings?.map((b) => (
                                                <TableRow key={b.id} className="border-gray-50 hover:bg-gray-50 transition-colors">
                                                    <TableCell className="px-8 py-5">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-gray-900">{format(new Date(b.checkIn), 'MMM dd, yyyy')}</span>
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">to {b.checkOut ? format(new Date(b.checkOut), 'MMM dd, yyyy') : 'Present'}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-5">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-gray-700">{b.room?.Hostel?.name}</span>
                                                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider">Room {b.room?.roomNumber}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-5 font-bold text-gray-900 text-xs">PKR {b.totalAmount.toLocaleString()}</TableCell>
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
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">No booking records</p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </Card>
                            </TabsContent>

                            <TabsContent value="payments" className="m-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <Card className="rounded-[2.5rem] bg-white overflow-hidden border-none shadow-sm">
                                    <Table>
                                        <TableHeader className="bg-gray-50/50">
                                            <TableRow className="border-none hover:bg-transparent">
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-8">Transaction Date</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-4">Method</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-4">Amount</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 text-right">Verification</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {userDetails?.payments?.map((p) => (
                                                <TableRow key={p.id} className="border-gray-50 hover:bg-gray-50 transition-colors">
                                                    <TableCell className="px-8 py-5">
                                                        <span className="text-xs font-bold text-gray-900">{format(new Date(p.date), 'MMMM dd, yyyy')}</span>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-5">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-gray-700">{p.method}</span>
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">ID: #{p.id.slice(-6).toUpperCase()}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-5 font-bold text-gray-900 text-sm">PKR {p.amount.toLocaleString()}</TableCell>
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
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">No financial data</p>
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
                                        <Card key={c.id} className="rounded-[2.5rem] bg-white p-8 border-none shadow-sm space-y-4 hover:shadow-md transition-shadow group">
                                            <div className="flex justify-between items-start">
                                                <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                    <AlertCircle className="h-5 w-5" />
                                                </div>
                                                <Badge variant="outline" className="rounded-lg px-2 py-0.5 font-bold text-[8px] uppercase tracking-widest text-gray-400 border-gray-100">{c.status}</Badge>
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">{c.title}</h4>
                                                <p className="text-xs text-gray-500 font-medium line-clamp-2 leading-relaxed italic">"{c.description}"</p>
                                            </div>
                                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{format(new Date(c.createdAt), 'MMM dd, yyyy')}</span>
                                                <Link href={`/admin/complaints/${c.id}`}>
                                                    <Button variant="ghost" className="h-8 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50">View details</Button>
                                                </Link>
                                            </div>
                                        </Card>
                                    ))}
                                    {(!userDetails?.complaints || userDetails.complaints.length === 0) && (
                                        <div className="md:col-span-2 h-60 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
                                            <MessageSquare className="h-10 w-10 text-gray-200 mb-3" />
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">No reports found</p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </main>

            {/* Management Dialogs */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="rounded-3xl border-none p-10 max-w-lg shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Edit Information</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 pt-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest pl-1 text-gray-400">Full Name</Label>
                                <Input value={editData?.name} onChange={e => setEditData({ ...editData, name: e.target.value })} className="h-12 rounded-xl border-gray-100 bg-gray-50 font-bold px-4" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest pl-1 text-gray-400">Email Address</Label>
                                <Input value={editData?.email} onChange={e => setEditData({ ...editData, email: e.target.value })} className="h-12 rounded-xl border-gray-100 bg-gray-50 font-bold px-4" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest pl-1 text-gray-400">Phone Number</Label>
                                <Input value={editData?.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} className="h-12 rounded-xl border-gray-100 bg-gray-50 font-bold px-4" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest pl-1 text-gray-400">CNIC / ID</Label>
                                <Input value={editData?.cnic} onChange={e => setEditData({ ...editData, cnic: e.target.value })} className="h-12 rounded-xl border-gray-100 bg-gray-50 font-bold px-4" />
                            </div>
                        </div>
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
                    <div className="space-y-3 pt-6">
                        {['ADMIN', 'WARDEN', 'STAFF', 'RESIDENT', 'GUEST'].map(r => (
                            <Button
                                key={r}
                                onClick={() => setEditData({ role: r })}
                                variant={editData?.role === r ? 'default' : 'outline'}
                                className={`h-12 w-full rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${editData?.role === r ? 'bg-indigo-600 border-indigo-600' : 'border-gray-100 text-gray-400'}`}
                            >
                                {r}
                            </Button>
                        ))}
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
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">Set a new temporary password for this user.</p>
                        <Input
                            type="text"
                            placeholder="New password..."
                            value={newPass}
                            onChange={e => setNewPass(e.target.value)}
                            className="h-14 rounded-2xl border-gray-100 bg-gray-50 font-black text-center text-lg tracking-widest"
                        />
                    </div>
                    <DialogFooter className="pt-8">
                        <Button onClick={handleResetKey} className="h-14 w-full rounded-2xl bg-rose-600 text-white font-black uppercase tracking-widest shadow-xl shadow-rose-100">Reset Now</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default UserDetailsPage;
