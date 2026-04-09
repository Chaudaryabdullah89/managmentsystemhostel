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
import { ProfileSkeleton } from "@/components/ui/skeletons";

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
    const additionalImages = Array.isArray(user?.ResidentProfile?.documents?.galleryImages)
        ? user.ResidentProfile.documents.galleryImages
        : [];

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
            toast.success('Updated');
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

            toast.success("Updated");
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
            toast.success("Code sent");
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

            toast.success("Updated");
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
        if (lower.includes("mobile") || lower.includes("iphone")) return <Smartphone className="w-5 h-5 text-gray-400 dark:text-muted-foreground" />;
        if (lower.includes("laptop")) return <Laptop className="w-5 h-5 text-gray-400 dark:text-muted-foreground" />;
        return <Monitor className="w-5 h-5 text-gray-400 dark:text-muted-foreground" />;
    };

    if (isLoading) return <ProfileSkeleton />;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-muted/10/50 dark:bg-background pb-20 font-sans tracking-tight">
            <div className="bg-white dark:bg-card border-b sticky top-0 z-50 h-16">
                <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
                    <h1 className="text-lg font-bold text-gray-900 dark:text-foreground uppercase">Admin Profile</h1>
                    <div className="flex items-center gap-2">
                        {!isEditing ? (
                            <Button onClick={handleEdit} className="h-9 px-5 rounded-xl bg-black text-white text-[10px] uppercase">
                                <Edit3 className="h-3.5 w-3.5 mr-2" /> Edit
                            </Button>
                        ) : (
                            <>
                                <Button onClick={handleCancel} variant="outline" className="h-9 px-5 rounded-xl text-[10px] uppercase">
                                    <X className="h-3.5 w-3.5 mr-2" /> Cancel
                                </Button>
                                <Button onClick={handleSave} disabled={updateLoading} className="h-9 px-5 rounded-xl bg-black text-white text-[10px] uppercase">
                                    <Save className="h-3.5 w-3.5 mr-2" /> {updateLoading ? "Saving" : "Save"}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
                <Card className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl shadow-sm">
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted-foreground">Name</Label>
                            {isEditing ? <Input value={editedData.name || ""} onChange={e => setEditedData({ ...editedData, name: e.target.value })} /> : <p className="font-bold">{user.name || "—"}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted-foreground">Email</Label>
                            <p className="font-bold">{user.email || "—"}</p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted-foreground">Phone</Label>
                            {isEditing ? <Input value={editedData.phone || ""} onChange={e => setEditedData({ ...editedData, phone: e.target.value })} /> : <p className="font-bold">{user.phone || "—"}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted-foreground">CNIC</Label>
                            {isEditing ? <Input value={editedData.cnic || ""} onChange={e => setEditedData({ ...editedData, cnic: e.target.value })} /> : <p className="font-bold">{user.cnic || "—"}</p>}
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted-foreground">Address</Label>
                            {isEditing ? <Textarea value={editedData.address || ""} onChange={e => setEditedData({ ...editedData, address: e.target.value })} /> : <p className="font-bold">{user.address || "—"}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted-foreground">City</Label>
                            {isEditing ? <Input value={editedData.city || ""} onChange={e => setEditedData({ ...editedData, city: e.target.value })} /> : <p className="font-bold">{user.city || "—"}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted-foreground">Role / Status</Label>
                            <p className="font-bold">{user.role || "ADMIN"} / {user.isActive ? "Active" : "Inactive"}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl shadow-sm">
                    <CardContent className="p-6 flex flex-wrap gap-3">
                        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                            <DialogTrigger asChild>
                                <Button className="h-10 rounded-xl bg-black text-white text-[10px] uppercase">Change Password</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Change Password</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-3">
                                    <Input type="password" placeholder="Current password" value={passwordData.currentPassword} onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })} />
                                    <Input type="password" placeholder="New password" value={passwordData.newPassword} onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })} />
                                    <Input type="password" placeholder="Confirm password" value={passwordData.confirmPassword} onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} />
                                    <Button onClick={handlePasswordChange} disabled={changingpass} className="w-full bg-black text-white">Save</Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="h-10 rounded-xl text-[10px] uppercase">Change Email</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Change Email</DialogTitle>
                                </DialogHeader>
                                {!showOtpInput ? (
                                    <div className="space-y-3">
                                        <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="New email" />
                                        <Button onClick={handleSendOtp} disabled={emailChangeLoading} className="w-full bg-black text-white">Send Code</Button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <Input value={otp} onChange={e => setOtp(e.target.value)} placeholder="Verification code" />
                                        <Button onClick={handleVerifyOtp} disabled={emailChangeLoading} className="w-full bg-emerald-600 text-white">Verify</Button>
                                    </div>
                                )}
                            </DialogContent>
                        </Dialog>

                        <Button
                            variant="outline"
                            onClick={() => terminateAllSessions.mutate()}
                            disabled={terminateAllSessions.isPending}
                            className="h-10 rounded-xl text-[10px] uppercase"
                        >
                            {terminateAllSessions.isPending ? "Closing..." : "Sign Out All Devices"}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => useAuthStore.getState().logout()}
                            className="h-10 rounded-xl text-[10px] uppercase text-rose-600"
                        >
                            <LogOut className="h-4 w-4 mr-2" /> Logout
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default ProfilePage;
