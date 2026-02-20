"use client";
import React, { useState, useMemo } from "react";
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Shield,
    Edit3,
    Save,
    X,
    Lock,
    LogOut,
    CheckCircle2,
    Fingerprint,
    Building2,
    ShieldCheck,
    CreditCard,
    Briefcase,
    Camera,
    Clock,
    UserCheck,
    Globe,
    Key,
    Monitor,
    Smartphone,
    Laptop,
    History
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserById, useUserUpdate, useSessions, useTerminateSessions, useTerminateAllSessions } from "@/hooks/useusers";
import useAuthStore from "@/hooks/Authstate";
import { toast } from "sonner";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog";

const StaffProfilePage = () => {
    const authUser = useAuthStore((state) => state.user)
    const logout = useAuthStore((state) => state.logout)
    const { data: fetchedUser, isLoading } = useUserById(authUser?.id)
    const { mutateAsync: updateUserData, isLoading: updateLoading } = useUserUpdate()
    const { data: sessionsData, isLoading: sessionsLoading } = useSessions();
    const terminateSession = useTerminateSessions();
    const terminateAllSessions = useTerminateAllSessions();

    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState({});
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [changingpass, setchangingpass] = useState(false);

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

    const getDeviceIcon = (device) => {
        const lower = device?.toLowerCase() || "";
        if (lower.includes("mobile") || lower.includes("iphone")) return <Smartphone className="w-5 h-5" />;
        if (lower.includes("laptop")) return <Laptop className="w-5 h-5" />;
        return <Monitor className="w-5 h-5" />;
    };

    if (isLoading) return (
        <div className="flex h-screen items-center justify-center bg-white font-sans">
            <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 border-2 border-gray-100 border-t-black rounded-full animate-spin" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Loading Profile...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight selection:bg-black selection:text-white">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-40 h-16">
                <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-black rounded-lg flex items-center justify-center text-white">
                            <User className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-gray-900 uppercase">My Profile</h1>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Personal & Work Details</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isEditing ? (
                            <Button onClick={handleEdit} className="h-8 px-4 rounded-lg bg-black text-white font-bold text-[10px] uppercase tracking-widest gap-2">
                                <Edit3 className="h-3 w-3" /> Edit
                            </Button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Button onClick={handleCancel} variant="ghost" className="h-8 px-4 rounded-lg text-gray-400 font-bold text-[10px] uppercase tracking-widest">Cancel</Button>
                                <Button onClick={handleSave} disabled={updateLoading} className="h-8 px-4 rounded-lg bg-black text-white font-bold text-[10px] uppercase tracking-widest">
                                    {updateLoading ? 'Saving...' : 'Save'}
                                </Button>
                            </div>
                        )}
                        <Button onClick={logout} variant="ghost" className="h-8 px-4 rounded-lg hover:bg-rose-50 text-rose-600 font-bold text-[10px] uppercase tracking-widest">
                            <LogOut className="h-3.5 w-3.5 mr-2" /> Logout
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
                {/* Main Profile Card */}
                <div className="bg-white rounded-[2rem] p-1 shadow-sm border border-gray-100">
                    <div className="bg-gray-900 rounded-[1.8rem] p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

                        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
                            <div className="relative group/avatar">
                                <Avatar className="h-32 w-32 border-4 border-white/20 shadow-2xl">
                                    <AvatarImage src={user.image} />
                                    <AvatarFallback className="text-4xl font-bold text-gray-900 bg-white">{user.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="absolute bottom-0 right-0 h-8 w-8 bg-emerald-500 rounded-full border-4 border-gray-900 flex items-center justify-center">
                                    <CheckCircle2 className="h-4 w-4 text-white" />
                                </div>
                            </div>

                            <div className="flex-1 text-center md:text-left space-y-4">
                                <div>
                                    <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                                        <h2 className="text-3xl font-bold tracking-tight">{user.name}</h2>
                                        <Badge className="bg-white/10 hover:bg-white/20 text-white border-0 text-[9px] uppercase font-bold tracking-widest backdrop-blur-md">
                                            {user.role}
                                        </Badge>
                                    </div>
                                    <p className="text-gray-400 font-medium">{user.email}</p>
                                </div>

                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
                                    <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-2 flex items-center gap-3 border border-white/5">
                                        <Phone className="h-4 w-4 text-white/70" />
                                        <div>
                                            <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Phone</p>
                                            <p className="text-xs font-bold">{user.phone || "Not Added"}</p>
                                        </div>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-2 flex items-center gap-3 border border-white/5">
                                        <CreditCard className="h-4 w-4 text-white/70" />
                                        <div>
                                            <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">CNIC No.</p>
                                            <p className="text-xs font-bold">{user.cnic || "Not Added"}</p>
                                        </div>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-2 flex items-center gap-3 border border-white/5">
                                        <Calendar className="h-4 w-4 text-white/70" />
                                        <div>
                                            <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Joined On</p>
                                            <p className="text-xs font-bold">{user.createdAt ? format(new Date(user.createdAt), 'MMM yyyy') : 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="details" className="space-y-8">
                    <TabsList className="bg-white border border-gray-100 p-1 rounded-xl h-11 shadow-sm">
                        <TabsTrigger value="details" className="h-full px-8 rounded-lg font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-black data-[state=active]:text-white transition-all">
                            Personal Details
                        </TabsTrigger>
                        <TabsTrigger value="work" className="h-full px-8 rounded-lg font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-black data-[state=active]:text-white transition-all">
                            Work & Security
                        </TabsTrigger>
                        <TabsTrigger value="sessions" className="h-full px-8 rounded-lg font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-black data-[state=active]:text-white transition-all">
                            Active Sessions
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-8 animate-in fade-in duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Personal Info */}
                            <Card className="rounded-[2.5rem] border-gray-100 shadow-sm overflow-hidden p-8">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <UserCheck className="h-4 w-4 text-gray-400" /> Basic Information
                                </h3>
                                <div className="space-y-5">
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</Label>
                                        {isEditing ? (
                                            <Input value={editedData.name} onChange={e => setEditedData({ ...editedData, name: e.target.value })} className="h-11 rounded-xl border-gray-100 bg-gray-50 px-4 font-bold text-xs focus:bg-white" />
                                        ) : (
                                            <p className="h-11 flex items-center px-4 rounded-xl bg-gray-50/50 text-xs font-bold text-gray-900">{user.name}</p>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Phone</Label>
                                            {isEditing ? (
                                                <Input value={editedData.phone} onChange={e => setEditedData({ ...editedData, phone: e.target.value })} className="h-11 rounded-xl border-gray-100 bg-gray-50 px-4 font-bold text-xs focus:bg-white" />
                                            ) : (
                                                <p className="h-11 flex items-center px-4 rounded-xl bg-gray-50/50 text-xs font-bold text-gray-900">{user.phone || "--"}</p>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">CNIC</Label>
                                            {isEditing ? (
                                                <Input value={editedData.cnic} onChange={e => setEditedData({ ...editedData, cnic: e.target.value })} className="h-11 rounded-xl border-gray-100 bg-gray-50 px-4 font-bold text-xs focus:bg-white" />
                                            ) : (
                                                <p className="h-11 flex items-center px-4 rounded-xl bg-gray-50/50 text-xs font-bold text-gray-900">{user.cnic || "--"}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Location Info */}
                            <Card className="rounded-[2.5rem] border-gray-100 shadow-sm overflow-hidden p-8">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-gray-400" /> Location Details
                                </h3>
                                <div className="space-y-5">
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Home Address</Label>
                                        {isEditing ? (
                                            <Textarea value={editedData.address} onChange={e => setEditedData({ ...editedData, address: e.target.value })} className="rounded-xl border-gray-100 bg-gray-50 p-4 font-bold text-xs focus:bg-white min-h-[100px]" />
                                        ) : (
                                            <p className="p-4 rounded-xl bg-gray-50/50 text-xs font-bold text-gray-900 leading-relaxed min-h-[100px]">{user.address || "No address added."}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">City</Label>
                                        {isEditing ? (
                                            <Input value={editedData.city} onChange={e => setEditedData({ ...editedData, city: e.target.value })} className="h-11 rounded-xl border-gray-100 bg-gray-50 px-4 font-bold text-xs focus:bg-white" />
                                        ) : (
                                            <p className="h-11 flex items-center px-4 rounded-xl bg-gray-50/50 text-xs font-bold text-gray-900">{user.city || "--"}</p>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="work" className="space-y-8 animate-in fade-in duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Employment Details */}
                            <Card className="rounded-[2.5rem] border-gray-100 shadow-sm overflow-hidden p-8">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Briefcase className="h-4 w-4 text-gray-400" /> Work Info
                                </h3>
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 rounded-2xl bg-black flex items-center justify-center text-white shadow-lg shrink-0">
                                            <Fingerprint className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Employee UID</p>
                                            <h4 className="text-xl font-bold text-gray-900 tracking-tight">#{user?.id?.slice(-8).toUpperCase()}</h4>
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-600 text-[8px] font-bold border-none px-2 mt-1">Verified</Badge>
                                        </div>
                                    </div>
                                    <Separator className="bg-gray-100" />
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Assigned Hostel</Label>
                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                            <h5 className="font-bold text-gray-900">{user?.Hostel_User_hostelIdToUser?.name || "GreenView Central"}</h5>
                                            <p className="text-xs text-gray-500 mt-1">{user?.Hostel_User_hostelIdToUser?.address || "Main Branch"}</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Account Security */}
                            <Card className="rounded-[2.5rem] border-gray-100 shadow-sm overflow-hidden p-8">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-gray-400" /> Account Security
                                </h3>
                                <div className="space-y-5">
                                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                                                <Key className="h-4 w-4" />
                                            </div>
                                            <p className="text-xs font-bold text-indigo-900">Sync Password</p>
                                        </div>
                                        <p className="text-[10px] text-indigo-400 font-medium leading-relaxed mb-4">Update your password regularly to keep your work account secure.</p>
                                        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                                            <DialogTrigger asChild>
                                                <Button className="w-full bg-white text-indigo-600 hover:bg-white/80 h-9 rounded-xl font-bold uppercase tracking-widest text-[9px] shadow-sm">
                                                    Update Key
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-md p-8 rounded-[2rem] border-none bg-white shadow-2xl">
                                                <h2 className="text-lg font-bold uppercase tracking-tight mb-6">Change Password</h2>
                                                <div className="space-y-5">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Current Password</Label>
                                                        <Input type="password" value={passwordData.currentPassword} onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })} className="h-11 rounded-xl border-gray-100 bg-gray-50 px-4 font-bold text-xs focus:bg-white" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">New Password</Label>
                                                        <Input type="password" value={passwordData.newPassword} onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })} className="h-11 rounded-xl border-gray-100 bg-gray-50 px-4 font-bold text-xs focus:bg-white" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Confirm Password</Label>
                                                        <Input type="password" value={passwordData.confirmPassword} onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} className="h-11 rounded-xl border-gray-100 bg-gray-50 px-4 font-bold text-xs focus:bg-white" />
                                                    </div>
                                                    <Button onClick={handlePasswordChange} disabled={changingpass} className="w-full bg-black text-white h-11 rounded-xl font-bold uppercase tracking-widest text-[10px] mt-4 shadow-xl">Transform Sequence</Button>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="sessions" className="space-y-6 animate-in fade-in duration-500">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-3">
                                <Globe className="h-4 w-4 text-gray-400" /> Active Connections
                            </h3>
                            <Button
                                variant="ghost"
                                onClick={() => terminateAllSessions.mutate()}
                                className="h-8 rounded-lg text-rose-600 hover:bg-rose-50 font-bold text-[9px] uppercase tracking-widest"
                            >
                                Terminate All
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sessionsData?.sessions?.map((session, i) => (
                                <Card key={i} className="rounded-3xl border-gray-100 shadow-sm p-5 hover:border-gray-200 transition-all group relative overflow-hidden">
                                    <div className={`absolute top-0 left-0 w-1 h-full ${session.isActive ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className={`h-11 w-11 rounded-2xl ${session.isActive ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'} flex items-center justify-center`}>
                                            {getDeviceIcon(session.device)}
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                                                {session.device || "Unknown Device"}
                                                {session.isActive && <Badge className="bg-emerald-500 text-white border-none text-[6px] px-1 h-3">ACTIVE</Badge>}
                                            </h4>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{session.ipAddress || "0.0.0.0"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-3 w-3 text-gray-300" />
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                                {format(new Date(session.lastActive), 'MMM dd, HH:mm')}
                                            </span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => terminateSession.mutate(session.id)}
                                            className="h-8 w-8 rounded-xl hover:bg-rose-50 hover:text-rose-600 text-gray-300 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <LogOut className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Account Safety */}
                <Card className="rounded-[2.5rem] border-gray-100 shadow-sm overflow-hidden bg-gray-900 text-white">
                    <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                                <Shield className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white uppercase tracking-tight">Data Safety</h3>
                                <p className="text-xs text-gray-400 mt-1">Your professional and personal records are encrypted and private.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default StaffProfilePage;
