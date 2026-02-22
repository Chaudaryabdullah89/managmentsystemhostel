"use client"
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
    Shield,
    User,
    UserCog,
    UserCheck,
    ChevronRight,
    Mail,
    Phone,
    Building2,
    Calendar,
    CheckCircle,
    History,
    FileText,
    CreditCard,
    Home,
    ArrowLeft,
    Edit,
    Save,
    Loader2,
    MapPin,
    Contact2,
    Activity,
    Users
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useUserDetailedProfile, useUserUpdate } from "@/hooks/useusers";
import { toast } from "sonner";
import Loader from "@/components/ui/Loader";

const UserEditPage = () => {
    const params = useParams();
    const router = useRouter();
    const userId = params.userId;

    const { data: user, isLoading, refetch } = useUserDetailedProfile(userId);
    const updateMutation = useUserUpdate();

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        cnic: "",
        address: "",
        role: "",
        residentProfile: {
            guardianName: "",
            emergencyContact: "",
            bloodGroup: "",
            institution: "",
            occupation: "",
            dob: ""
        }
    });

    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || "",
                email: user.email || "",
                phone: user.phone || "",
                cnic: user.cnic || "",
                address: user.address || "",
                role: user.role || "",
                residentProfile: {
                    guardianName: user.residentProfile?.guardianName || "",
                    emergencyContact: user.residentProfile?.emergencyContact || "",
                    bloodGroup: user.residentProfile?.bloodGroup || "",
                    institution: user.residentProfile?.institution || "",
                    occupation: user.residentProfile?.occupation || "",
                    dob: user.residentProfile?.dob ? new Date(user.residentProfile.dob).toISOString().split('T')[0] : ""
                }
            });
        }
    }, [user]);

    const handleBaseChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleProfileChange = (field, value) => {
        setForm(prev => ({
            ...prev,
            residentProfile: { ...prev.residentProfile, [field]: value }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Prepare data for Prisma update
            const updateData = {
                name: form.name,
                email: form.email,
                phone: form.phone,
                cnic: form.cnic,
                address: form.address,
                role: form.role,
            };

            // If it's a resident, handle ResidentProfile update
            if (user.role === 'GUEST' || user.role === 'RESIDENT' || form.role === 'GUEST' || form.role === 'RESIDENT') {
                updateData.ResidentProfile = {
                    upsert: {
                        create: {
                            guardianName: form.residentProfile.guardianName,
                            emergencyContact: form.residentProfile.emergencyContact,
                            bloodGroup: form.residentProfile.bloodGroup,
                            institution: form.residentProfile.institution,
                            occupation: form.residentProfile.occupation,
                            dob: form.residentProfile.dob ? new Date(form.residentProfile.dob) : null,
                        },
                        update: {
                            guardianName: form.residentProfile.guardianName,
                            emergencyContact: form.residentProfile.emergencyContact,
                            bloodGroup: form.residentProfile.bloodGroup,
                            institution: form.residentProfile.institution,
                            occupation: form.residentProfile.occupation,
                            dob: form.residentProfile.dob ? new Date(form.residentProfile.dob) : null,
                        }
                    }
                };
            }

            await updateMutation.mutateAsync({ id: userId, data: updateData });
            refetch();
            router.back();
        } catch (error) {
            console.error("Update failed:", error);
        }
    };

    if (isLoading) return <Loader label="Loading User Profile" subLabel="Fetching user details..." icon={UserCog} fullScreen={false} />;

    if (!user) {
        return (
            <div className="p-8 text-center bg-white min-h-screen">
                <User className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                <h2 className="text-xl font-bold text-gray-900">User Registry Missed</h2>
                <Button onClick={() => router.back()} className="mt-4">Return to Hub</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl h-9 w-9">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="h-6 w-px bg-gray-200" />
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight">Modify Profile</h1>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{user.name} • {user.role}</p>
                        </div>
                    </div>
                    <Button
                        onClick={handleSubmit}
                        disabled={updateMutation.isPending}
                        className="rounded-xl bg-black hover:bg-gray-800 text-white font-bold text-[10px] uppercase tracking-wider px-6"
                    >
                        {updateMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Save className="h-3 w-3 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-6 py-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Info Section */}
                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardHeader className="bg-gray-50/50 border-b">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                <User className="h-3.5 w-3.5" /> Identity & Contact
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 ml-1">Full Name</Label>
                                <Input
                                    className="h-11 rounded-xl bg-gray-50/50 border-gray-100 font-bold"
                                    value={form.name}
                                    onChange={(e) => handleBaseChange('name', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 ml-1">Email Address</Label>
                                <Input
                                    type="email"
                                    className="h-11 rounded-xl bg-gray-50/50 border-gray-100 font-bold"
                                    value={form.email}
                                    onChange={(e) => handleBaseChange('email', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 ml-1">Phone Number</Label>
                                <Input
                                    className="h-11 rounded-xl bg-gray-50/50 border-gray-100 font-bold"
                                    value={form.phone}
                                    onChange={(e) => handleBaseChange('phone', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 ml-1">CNIC / ID Number</Label>
                                <Input
                                    className="h-11 rounded-xl bg-gray-50/50 border-gray-100 font-bold"
                                    value={form.cnic}
                                    onChange={(e) => handleBaseChange('cnic', e.target.value)}
                                />
                            </div>
                            <div className="col-span-1 md:col-span-2 space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 ml-1">Current Address</Label>
                                <Textarea
                                    className="min-h-[80px] rounded-xl bg-gray-50/50 border-gray-100 font-medium resize-none pt-3"
                                    value={form.address}
                                    onChange={(e) => handleBaseChange('address', e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Extended Profile Section (Only for Residents/Guests) */}
                    {(user.role === 'GUEST' || user.role === 'RESIDENT') && (
                        <Card className="border-none shadow-sm overflow-hidden">
                            <CardHeader className="bg-gray-50/50 border-b">
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                    <FileText className="h-3.5 w-3.5" /> Resident Dossier
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 ml-1">Guardian / Father's Name</Label>
                                    <Input
                                        className="h-11 rounded-xl bg-gray-50/50 border-gray-100 font-bold"
                                        value={form.residentProfile.guardianName}
                                        onChange={(e) => handleProfileChange('guardianName', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 ml-1">Emergency Contact Number</Label>
                                    <Input
                                        className="h-11 rounded-xl bg-gray-50/50 border-gray-100 font-bold"
                                        value={form.residentProfile.emergencyContact}
                                        onChange={(e) => handleProfileChange('emergencyContact', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 ml-1">Blood Group</Label>
                                    <Select
                                        value={form.residentProfile.bloodGroup}
                                        onValueChange={(v) => handleProfileChange('bloodGroup', v)}
                                    >
                                        <SelectTrigger className="h-11 rounded-xl bg-gray-50/50 border-gray-100 font-bold">
                                            <SelectValue placeholder="Select Blood Group" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                                                <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 ml-1">Date of Birth</Label>
                                    <Input
                                        type="date"
                                        className="h-11 rounded-xl bg-gray-50/50 border-gray-100 font-bold"
                                        value={form.residentProfile.dob}
                                        onChange={(e) => handleProfileChange('dob', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 ml-1">Institution</Label>
                                    <Input
                                        placeholder="University or College"
                                        className="h-11 rounded-xl bg-gray-50/50 border-gray-100 font-bold"
                                        value={form.residentProfile.institution}
                                        onChange={(e) => handleProfileChange('institution', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 ml-1">Occupation</Label>
                                    <Input
                                        placeholder="Job or Designation"
                                        className="h-11 rounded-xl bg-gray-50/50 border-gray-100 font-bold"
                                        value={form.residentProfile.occupation}
                                        onChange={(e) => handleProfileChange('occupation', e.target.value)}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Role & Access (Admins Only View) */}
                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardHeader className="bg-gray-50/50 border-b">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                <Shield className="h-3.5 w-3.5" /> Registry Role
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="max-w-xs space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 ml-1">System Role</Label>
                                <Select
                                    value={form.role}
                                    onValueChange={(v) => handleBaseChange('role', v)}
                                >
                                    <SelectTrigger className="h-11 rounded-xl bg-gray-50/50 border-gray-100 font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="ADMIN">Administrator</SelectItem>
                                        <SelectItem value="WARDEN">Warden</SelectItem>
                                        <SelectItem value="STAFF">Staff</SelectItem>
                                        <SelectItem value="RESIDENT">Resident</SelectItem>
                                        <SelectItem value="GUEST">Guest</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-end gap-3 pt-6">
                        <Button type="button" variant="ghost" className="rounded-xl font-bold text-[10px] uppercase tracking-wider" onClick={() => router.back()}>
                            Cancel changes
                        </Button>
                        <Button
                            type="submit"
                            disabled={updateMutation.isPending}
                            className="h-12 px-10 rounded-xl bg-black hover:bg-gray-800 text-white font-bold text-xs uppercase tracking-widest shadow-xl shadow-black/10 active:scale-95 transition-all"
                        >
                            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Commit Updates"}
                        </Button>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default UserEditPage;
