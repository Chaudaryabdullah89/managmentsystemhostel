"use client"
import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
    ChevronRight,
    User,
    Mail,
    Phone,
    MapPin,
    Building2,
    Calendar,
    Shield,
    Edit3,
    Save,
    X,
    Key,
    Camera,
    Clock,
    UserCheck,
    Monitor,
    Laptop,
    Smartphone,
    Globe,
    Lock,
    Settings,
    LogOut,
    Fingerprint,
    Bell,
    MailCheck,
    ChevronLeft,
    ShieldCheck,
    History,
    CreditCard,
    Zap,
    Boxes,
    CheckCircle
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useAuthStore from "@/hooks/Authstate";
import { useUserById, useUserUpdate, useSessions, useTerminateSessions, useTerminateAllSessions } from "@/hooks/useusers";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import Loader from "@/components/ui/Loader";

const ProfilePage = () => {
    const authUser = useAuthStore((state) => state.user)
    const { data: fetchedUser, isLoading, error } = useUserById(authUser?.id)
    const { mutateAsync: updateUserData, isLoading: updateLoading } = useUserUpdate()
    const { data: sessionsData, isLoading: sessionsLoading } = useSessions();
    const terminateSession = useTerminateSessions();
    const terminateAllSessions = useTerminateAllSessions();

    const [isEditing, setIsEditing] = useState(false);
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [showEmailDialog, setShowEmailDialog] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [newEmail, setNewEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [emailChangeLoading, setEmailChangeLoading] = useState(false);
    const [changingpass, setchangingpass] = useState(false);

    const [editedData, setEditedData] = useState({});

    const user = useMemo(() => fetchedUser || {}, [fetchedUser]);

    const handleEdit = () => {
        setEditedData({ ...user });
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    const handleSave = async () => {
        try {
            await updateUserData({
                id: authUser?.id,
                data: editedData
            });
            setIsEditing(false);
            toast.success('Profile updated successfully');
        } catch (err) {
            toast.error('Failed to update profile');
        }
    };

    const handlePasswordChange = async () => {
        setchangingpass(true);
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("New passwords do not match!");
            return setchangingpass(false);
        }
        if (passwordData.newPassword.length < 6) {
            toast.error("Password must be at least 6 characters long!");
            return setchangingpass(false);
        }
        try {
            const response = await fetch(`/api/auth/changepassword/${authUser?.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to change password");

            toast.success("Password updated successfully!");
            setShowPasswordDialog(false);
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err) {
            toast.error(err.message);
        } finally {
            setchangingpass(false);
        }
    };

    const handleSendOtp = async () => {
        if (!newEmail || !newEmail.includes("@")) {
            toast.error("Please enter a valid email");
            return;
        }
        setEmailChangeLoading(true);
        try {
            const res = await fetch('/api/auth/change-email/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: newEmail })
            });
            if (!res.ok) throw new Error("Failed to send verification code");
            toast.success("Verification code sent to your new email");
            setShowOtpInput(true);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setEmailChangeLoading(false);
        }
    };

    const queryClient = useQueryClient();

    const handleVerifyOtp = async () => {
        setEmailChangeLoading(true);
        try {
            const res = await fetch('/api/auth/change-email/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: newEmail, otp, userId: authUser?.id })
            });
            if (!res.ok) throw new Error("Invalid verification code");

            toast.success("Email updated successfully");
            setShowEmailDialog(false);
            setOtp("");
            setShowOtpInput(false);
            if (authUser?.id) await queryClient.invalidateQueries({ queryKey: ['users', 'byid', authUser.id] });
            if (authUser) useAuthStore.getState().setUser({ ...authUser, email: newEmail });
        } catch (err) {
            toast.error(err.message);
        } finally {
            setEmailChangeLoading(false);
        }
    };

    const getDeviceIcon = (device) => {
        const lower = device?.toLowerCase() || "";
        if (lower.includes("mobile") || lower.includes("iphone")) return <Smartphone className="w-5 h-5 text-gray-400" />;
        if (lower.includes("laptop")) return <Laptop className="w-5 h-5 text-gray-400" />;
        return <Monitor className="w-5 h-5 text-gray-400" />;
    };

    if (isLoading) return <Loader label="Loading Profile" subLabel="Fetching your account details..." icon={User} fullScreen={false} />;

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight">
            {/* Header: Payment Page Design */}
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-1 bg-black rounded-full" />
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight uppercase">My Profile</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Account Registry</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Active Session</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {!isEditing ? (
                            <Button
                                onClick={handleEdit}
                                className="h-9 px-6 rounded-xl bg-black hover:bg-gray-800 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all active:scale-95"
                            >
                                <Edit3 className="h-3.5 w-3.5 mr-2" /> Edit Profile
                            </Button>
                        ) : (
                            <>
                                <Button
                                    onClick={handleCancel}
                                    variant="outline"
                                    className="h-9 px-6 rounded-xl border-gray-200 bg-white font-bold text-[10px] uppercase tracking-wider text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
                                >
                                    <X className="h-3.5 w-3.5 mr-2" /> Discard
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={updateLoading}
                                    className="h-9 px-6 rounded-xl bg-black hover:bg-gray-800 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all"
                                >
                                    <Save className="h-3.5 w-3.5 mr-2" /> {updateLoading ? "Saving..." : "Save Changes"}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
                {/* Profile Identity Bar */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Login Status', value: 'Active', icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Role Access', value: user.role, icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Active Sessions', value: sessionsData?.sessions?.length || 0, icon: Globe, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Joined Date', value: format(new Date(user.createdAt || Date.now()), 'MMM yyyy'), icon: Calendar, color: 'text-rose-600', bg: 'bg-rose-50' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow cursor-default">
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
                    {/* Sidebar Identity */}
                    <div className="lg:col-span-3 space-y-6">
                        <Card className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-black opacity-70" />
                            <div className="flex flex-col items-center">
                                <div className="h-32 w-32 rounded-[2.5rem] bg-gray-50 border border-gray-100 shadow-sm p-1 mb-6 relative group">
                                    <div className="h-full w-full rounded-[2.2rem] bg-white flex items-center justify-center overflow-hidden">
                                        {user?.image ? (
                                            <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="h-14 w-14 text-gray-200" />
                                        )}
                                    </div>
                                    {isEditing && (
                                        <button className="absolute bottom-2 right-2 h-10 w-10 bg-black text-white rounded-2xl flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
                                            <Camera className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 tracking-tight uppercase">{user.name}</h2>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mt-2 italic">{user.role}</p>
                                {user.uid && (
                                    <Badge className="mt-3 bg-gray-100 text-gray-700 border-none text-[10px] font-mono font-bold px-3 py-1">
                                        {user.uid}
                                    </Badge>
                                )}

                                <div className="w-full mt-8 space-y-2">
                                    <Link href={`/admin/users-records/${user.id}/history`}>
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start h-12 rounded-2xl px-6 font-bold text-[10px] uppercase tracking-wider text-gray-500 hover:bg-gray-50 hover:text-black transition-all"
                                        >
                                            <History className="h-4 w-4 mr-4 text-gray-400" />
                                            Activity Log
                                        </Button>
                                    </Link>
                                    <Separator className="my-2 opacity-10" />
                                    <Button
                                        variant="ghost"
                                        onClick={() => useAuthStore.getState().logout()}
                                        className="w-full justify-start h-12 rounded-2xl px-6 font-bold text-[10px] uppercase tracking-wider text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all"
                                    >
                                        <LogOut className="h-4 w-4 mr-4" />
                                        Logout
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-9 space-y-8">
                        <Tabs defaultValue="overview" className="space-y-6">
                            <TabsList className="bg-white border border-gray-100 p-1 rounded-xl h-11 shadow-sm">
                                <TabsTrigger value="overview" className="h-full px-10 rounded-lg font-bold text-[10px] uppercase tracking-wider data-[state=active]:bg-black data-[state=active]:text-white transition-all">
                                    <Boxes className="h-3.5 w-3.5 mr-2" /> General details
                                </TabsTrigger>
                                <TabsTrigger value="security" className="h-full px-10 rounded-lg font-bold text-[10px] uppercase tracking-wider data-[state=active]:bg-black data-[state=active]:text-white transition-all">
                                    <ShieldCheck className="h-3.5 w-3.5 mr-2" /> Security Details
                                </TabsTrigger>
                                <TabsTrigger value="sessions" className="h-full px-10 rounded-lg font-bold text-[10px] uppercase tracking-wider data-[state=active]:bg-black data-[state=active]:text-white transition-all">
                                    <Clock className="h-3.5 w-3.5 mr-2" /> Active Sessions
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="m-0 space-y-6 animate-in fade-in duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card className="bg-white border border-gray-100 rounded-[2rem] shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-black/5 opacity-70 group-hover:bg-black transition-colors" />
                                        <CardHeader className="p-8 pb-4">
                                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-gray-900 flex items-center gap-3">
                                                <Fingerprint className="h-4 w-4 text-gray-400" /> Personal Details
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-8 pt-0 space-y-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name</Label>
                                                {isEditing ? <Input value={editedData.name} onChange={e => setEditedData({ ...editedData, name: e.target.value })} className="h-12 rounded-xl border-gray-100 bg-gray-50 font-bold px-4" /> : <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">{user.name}</p>}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone Number</Label>
                                                    {isEditing ? <Input value={editedData.phone} onChange={e => setEditedData({ ...editedData, phone: e.target.value })} className="h-12 rounded-xl border-gray-100 bg-gray-50 font-bold px-4" /> : <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">{user.phone || 'N/A'}</p>}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">CNIC No</Label>
                                                    {isEditing ? <Input value={editedData.cnic} onChange={e => setEditedData({ ...editedData, cnic: e.target.value })} className="h-12 rounded-xl border-gray-100 bg-gray-50 font-bold px-4" /> : <p className="text-sm font-mono font-bold text-gray-900 bg-gray-50 px-3 py-1.5 rounded-lg w-fit">{user.cnic || 'N/A'}</p>}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-white border border-gray-100 rounded-[2rem] shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-black/5 opacity-70 group-hover:bg-emerald-500 transition-colors" />
                                        <CardHeader className="p-8 pb-4">
                                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-gray-900 flex items-center gap-3">
                                                <MapPin className="h-4 w-4 text-gray-400" /> Address Details
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-8 pt-0 space-y-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Home Address</Label>
                                                {isEditing ? <Textarea value={editedData.address} onChange={e => setEditedData({ ...editedData, address: e.target.value })} className="rounded-xl border-gray-100 bg-gray-50 font-medium text-sm p-4 min-h-[100px]" /> : <p className="text-sm font-bold text-gray-900 leading-relaxed uppercase tracking-tight">{user.address || 'N/A'}</p>}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current City</Label>
                                                    {isEditing ? <Input value={editedData.city} onChange={e => setEditedData({ ...editedData, city: e.target.value })} className="h-12 rounded-xl border-gray-100 bg-gray-50 font-bold px-4" /> : <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">{user.city || 'N/A'}</p>}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hostel Node</Label>
                                                    <Badge variant="outline" className="h-7 px-3 bg-gray-50 text-[9px] font-bold border-gray-200 uppercase tracking-widest">{user?.Hostel_User_hostelIdToUser?.name || 'CENTRAL'}</Badge>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            <TabsContent value="security" className="m-0 space-y-4 animate-in fade-in duration-500">
                                <Card className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                                    <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-gray-50/50 transition-colors group">
                                        <div className="flex items-center gap-6">
                                            <div className="h-14 w-14 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center border border-gray-100 group-hover:bg-black group-hover:text-white transition-all shadow-sm">
                                                <Lock className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-gray-900 uppercase tracking-tight italic">Security Protocol</h3>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Manage your login credentials</p>
                                            </div>
                                        </div>
                                        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                                            <DialogTrigger asChild>
                                                <Button size="sm" className="h-10 px-6 rounded-xl bg-black hover:bg-gray-800 text-white font-bold text-[9px] uppercase tracking-wider shadow-lg transition-all active:scale-95">Change Password</Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-md p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl bg-white ring-1 ring-gray-100">
                                                <div className="bg-black p-8 text-white text-center relative overflow-hidden">
                                                    <div className="absolute inset-0 bg-white/10 skew-x-12 translate-x-20" />
                                                    <div className="h-14 w-14 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/10 shadow-lg relative z-10">
                                                        <Key className="h-7 w-7" />
                                                    </div>
                                                    <h2 className="text-xl font-bold uppercase tracking-tight italic relative z-10">Password Sync</h2>
                                                    <p className="text-[9px] text-white/50 font-bold tracking-widest mt-1 uppercase relative z-10">Update your account key</p>
                                                </div>
                                                <div className="p-8 space-y-4">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1 italic">Current Key</Label>
                                                        <Input type="password" value={passwordData.currentPassword} onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })} className="h-12 rounded-xl border-gray-100 bg-gray-50 px-4 font-bold" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1 italic">New Key</Label>
                                                        <Input type="password" value={passwordData.newPassword} onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })} className="h-12 rounded-xl border-gray-100 bg-gray-50 px-4 font-bold" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1 italic">Confirm Key</Label>
                                                        <Input type="password" value={passwordData.confirmPassword} onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} className="h-12 rounded-xl border-gray-100 bg-gray-50 px-4 font-bold" />
                                                    </div>
                                                    <Button onClick={handlePasswordChange} disabled={changingpass} className="w-full bg-black text-white h-12 rounded-xl font-black uppercase tracking-[0.2em] text-[9px] mt-2 shadow-xl active:scale-95">Update Key</Button>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                    <Separator className="bg-gray-100 mx-6 w-auto" />
                                    <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-gray-50/50 transition-colors group">
                                        <div className="flex items-center gap-6">
                                            <div className="h-14 w-14 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
                                                <MailCheck className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-gray-900 uppercase tracking-tight italic">Email Vector</h3>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-tight mt-1">{user.email}</p>
                                            </div>
                                        </div>
                                        <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm" className="h-10 px-6 rounded-xl border-gray-200 bg-white text-gray-900 font-bold text-[9px] uppercase tracking-wider shadow-sm hover:bg-gray-50">Change Email</Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-md p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl bg-white ring-1 ring-gray-100">
                                                <div className="bg-emerald-600 p-8 text-white text-center relative overflow-hidden">
                                                    <div className="absolute inset-0 bg-white/10 skew-x-12 translate-x-20" />
                                                    <div className="h-14 w-14 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/10 shadow-lg relative z-10">
                                                        <Fingerprint className="h-7 w-7" />
                                                    </div>
                                                    <h2 className="text-xl font-bold uppercase tracking-tight italic relative z-10">Email Update</h2>
                                                    <p className="text-[9px] text-white/70 font-bold tracking-widest mt-1 uppercase relative z-10">Verify your new node vector</p>
                                                </div>
                                                <div className="p-8 space-y-6 text-center font-sans tracking-tight">
                                                    {!showOtpInput ? (
                                                        <div className="space-y-4">
                                                            <div className="space-y-2">
                                                                <Label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest italic block text-left ml-1">New Email Address</Label>
                                                                <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="EMAIL@NODE.LOCAL" className="h-12 rounded-xl border-gray-100 bg-gray-50 px-4 font-bold uppercase text-center placeholder:text-gray-300" />
                                                            </div>
                                                            <Button onClick={handleSendOtp} disabled={emailChangeLoading} className="w-full h-12 bg-black text-white rounded-xl font-bold uppercase tracking-[0.1em] text-[9px] shadow-lg active:scale-95">Verify Channel</Button>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-6 animate-in zoom-in-95 duration-300">
                                                            <div className="space-y-2 px-4">
                                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Code Verification</p>
                                                                <p className="text-xs font-black text-gray-900 uppercase italic underline decoration-emerald-500 decoration-2 underline-offset-4">{newEmail}</p>
                                                            </div>
                                                            <Input value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} className="h-16 text-3xl text-center font-black tracking-[0.4em] rounded-xl bg-gray-50 border-gray-100 transition-all focus:ring-emerald-500" placeholder="000000" />
                                                            <Button onClick={handleVerifyOtp} disabled={emailChangeLoading} className="w-full h-12 bg-emerald-600 text-white rounded-xl font-bold uppercase tracking-[0.1em] text-[9px] shadow-xl shadow-emerald-500/20 active:scale-95">Complete Sync</Button>
                                                            <p onClick={() => setShowOtpInput(false)} className="text-[8px] font-bold uppercase tracking-widest text-gray-400 hover:text-black cursor-pointer">Discard Update</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </Card>

                            </TabsContent>

                            <TabsContent value="sessions" className="m-0 space-y-4 animate-in fade-in duration-500">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-1 bg-black rounded-full" />
                                        <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight italic">Active Node Access</h2>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        onClick={() => terminateAllSessions.mutate()}
                                        disabled={terminateAllSessions.isPending}
                                        className="rounded-xl font-bold text-[8px] uppercase tracking-widest text-gray-400 hover:text-black hover:bg-white h-9 border border-transparent hover:border-gray-100 transition-all"
                                    >
                                        {terminateAllSessions.isPending ? "Terminating..." : "Terminate All"}
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {sessionsData?.sessions?.map((session, idx) => (
                                        <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between hover:shadow-md transition-shadow group relative overflow-hidden">
                                            <div className={`absolute top-0 left-0 w-1 h-full ${session.isActive ? 'bg-emerald-500' : 'bg-gray-200'} opacity-70`} />
                                            <div className="flex items-center gap-5">
                                                <div className={`h-12 w-12 rounded-xl ${session.isActive ? 'bg-black text-white shadow-lg shadow-black/10' : 'bg-gray-50 text-gray-400'} flex items-center justify-center transition-all border border-gray-100`}>
                                                    {getDeviceIcon(session.device)}
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-tight italic leading-none">{session.device || 'GLOBAL_NODE'}</h4>
                                                        {session.isActive && <Badge className="bg-emerald-500 text-white font-bold text-[7px] uppercase tracking-widest border-none px-1.5 py-0.5">THIS_SESSION</Badge>}
                                                    </div>
                                                    <div className="flex items-center gap-6 font-sans">
                                                        <div className="flex flex-col">
                                                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Vector IP</span>
                                                            <span className="text-[11px] font-bold text-gray-600 font-mono tracking-tighter">{session.ipAddress || '0.0.0.0'}</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Time Trace</span>
                                                            <span className="text-[11px] font-bold text-gray-600 font-mono tracking-tighter uppercase">{format(new Date(session.lastActive), 'MMM dd | HH:mm')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => terminateSession.mutate(session.id)}
                                                disabled={terminateSession.isPending}
                                                className="h-10 w-10 rounded-xl hover:bg-rose-50 hover:text-rose-500 text-gray-200 transition-all opacity-0 group-hover:opacity-100 active:scale-95"
                                            >
                                                <LogOut className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {(!sessionsData || sessionsData.sessions?.length === 0) && (
                                        <div className="p-16 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                                            <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest italic">No active sessions located</p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </main>

        </div>
    );
};

export default ProfilePage;
