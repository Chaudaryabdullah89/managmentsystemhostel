"use client"
import React, { useState, useMemo } from "react";
import Link from "next/link";
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
    CheckCircle
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useUserById, useUserUpdate } from "@/hooks/useusers";
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
    const { data: fetchedUser, isLoading } = useUserById(authUser?.id)
    const { mutateAsync: updateUserData, isLoading: updateLoading } = useUserUpdate()

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

    if (isLoading) return (
        <div className="flex h-screen items-center justify-center bg-gray-50 scale-100">
            <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 border-[3px] border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Loading Profile...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/30 pb-20 font-sans tracking-tight">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16 shadow-sm shadow-black/5">
                <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 tracking-tight uppercase">My Profile</h1>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Manage your information
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {!isEditing ? (
                            <Button
                                onClick={handleEdit}
                                className="h-9 px-6 rounded-xl bg-black hover:bg-gray-800 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all active:scale-95"
                            >
                                <Edit3 className="h-3.5 w-3.5 mr-2" /> Edit Details
                            </Button>
                        ) : (
                            <>
                                <Button
                                    onClick={handleCancel}
                                    variant="outline"
                                    className="h-9 px-6 rounded-xl border-gray-200 bg-white font-bold text-[10px] uppercase tracking-wider text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
                                >
                                    <X className="h-3.5 w-3.5 mr-2" /> Cancel
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={updateLoading}
                                    className="h-9 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all"
                                >
                                    <Save className="h-3.5 w-3.5 mr-2" /> {updateLoading ? "Saving..." : "Save Changes"}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
                {/* Profile Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Sidebar / Photo */}
                    <Card className="md:col-span-1 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden p-8 flex flex-col items-center text-center">
                        <div className="h-32 w-32 rounded-[2rem] bg-gray-50 border-4 border-white shadow-xl mb-6 overflow-hidden flex items-center justify-center">
                            {user?.image ? (
                                <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User className="h-12 w-12 text-gray-300" />
                            )}
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">{user.name}</h2>
                        <Badge className="mt-2 bg-indigo-50 text-indigo-600 border-indigo-100 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider">{user.role}</Badge>

                        <div className="w-full mt-8 space-y-3">
                            <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3 text-left">
                                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-gray-400 shrink-0 shadow-sm">
                                    <Calendar className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Joined On</p>
                                    <p className="text-xs font-bold text-gray-900 uppercase">{format(new Date(user.createdAt || Date.now()), 'MMM yyyy')}</p>
                                </div>
                            </div>

                            <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="w-full h-12 rounded-2xl border-gray-200 text-gray-600 font-bold text-[10px] uppercase tracking-wider hover:bg-gray-50 flex items-center gap-2 justify-center">
                                        <Lock className="h-4 w-4" /> Change Password
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md p-6 rounded-[2rem] border-gray-100 bg-white shadow-2xl">
                                    <h2 className="text-lg font-bold uppercase tracking-tight mb-6">Update Password</h2>
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Current Password</Label>
                                            <Input type="password" value={passwordData.currentPassword} onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })} className="h-12 rounded-xl border-gray-100 bg-gray-50 px-4 font-bold" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">New Password</Label>
                                            <Input type="password" value={passwordData.newPassword} onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })} className="h-12 rounded-xl border-gray-100 bg-gray-50 px-4 font-bold" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Confirm Password</Label>
                                            <Input type="password" value={passwordData.confirmPassword} onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} className="h-12 rounded-xl border-gray-100 bg-gray-50 px-4 font-bold" />
                                        </div>
                                        <Button onClick={handlePasswordChange} disabled={changingpass} className="w-full bg-black text-white h-12 rounded-xl font-bold uppercase tracking-[0.1em] text-[10px] mt-4 shadow-xl active:scale-95">Update Security Key</Button>
                                    </div>
                                </DialogContent>
                            </Dialog>

                            <Button
                                variant="ghost"
                                onClick={() => useAuthStore.getState().logout()}
                                className="w-full h-12 rounded-2xl text-rose-500 font-bold text-[10px] uppercase tracking-wider hover:bg-rose-50 hover:text-rose-600 flex items-center gap-2 justify-center"
                            >
                                <LogOut className="h-4 w-4" /> Logout
                            </Button>
                        </div>
                    </Card>

                    {/* Main Details */}
                    <div className="md:col-span-2 space-y-6">
                        <Card className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm p-8">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <User className="h-4 w-4 text-indigo-500" /> Personal Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</Label>
                                    {isEditing ? <Input value={editedData.name} onChange={e => setEditedData({ ...editedData, name: e.target.value })} className="h-12 rounded-xl border-gray-100 bg-gray-50 px-4 font-bold" /> : <div className="h-12 flex items-center px-4 rounded-xl bg-gray-50 border border-gray-50 text-sm font-bold text-gray-900">{user.name}</div>}
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</Label>
                                    <div className="h-12 flex items-center px-4 rounded-xl bg-gray-50 border border-gray-50 text-sm font-bold text-gray-500 cursor-not-allowed opacity-70">{user.email} (Locked)</div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Phone Number</Label>
                                    {isEditing ? <Input value={editedData.phone} onChange={e => setEditedData({ ...editedData, phone: e.target.value })} className="h-12 rounded-xl border-gray-100 bg-gray-50 px-4 font-bold" /> : <div className="h-12 flex items-center px-4 rounded-xl bg-gray-50 border border-gray-50 text-sm font-bold text-gray-900">{user.phone || 'N/A'}</div>}
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">CNIC / ID</Label>
                                    {isEditing ? <Input value={editedData.cnic} onChange={e => setEditedData({ ...editedData, cnic: e.target.value })} className="h-12 rounded-xl border-gray-100 bg-gray-50 px-4 font-bold" /> : <div className="h-12 flex items-center px-4 rounded-xl bg-gray-50 border border-gray-50 text-sm font-bold text-gray-900 font-mono tracking-tight">{user.cnic || 'N/A'}</div>}
                                </div>
                            </div>

                            <div className="my-8 h-px bg-gray-100" />

                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-emerald-500" /> Address & Location
                            </h3>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Home Address</Label>
                                    {isEditing ? <Textarea value={editedData.address} onChange={e => setEditedData({ ...editedData, address: e.target.value })} className="rounded-xl border-gray-100 bg-gray-50 p-4 font-medium" /> : <div className="p-4 rounded-xl bg-gray-50 border border-gray-50 text-sm font-bold text-gray-900">{user.address || 'N/A'}</div>}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">City</Label>
                                        {isEditing ? <Input value={editedData.city} onChange={e => setEditedData({ ...editedData, city: e.target.value })} className="h-12 rounded-xl border-gray-100 bg-gray-50 px-4 font-bold" /> : <div className="h-12 flex items-center px-4 rounded-xl bg-gray-50 border border-gray-50 text-sm font-bold text-gray-900">{user.city || 'N/A'}</div>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Assigned Hostel</Label>
                                        <div className="h-12 flex items-center px-4 rounded-xl bg-gray-50 border border-gray-50 text-sm font-bold text-gray-900">{user?.Hostel_User_hostelIdToUser?.name || 'Central Head Office'}</div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StaffProfilePage;
