"use client";
import React from 'react';
import { useQuery } from "@tanstack/react-query";
import {
    Mail,
    Phone,
    MapPin,
    Shield,
    LogOut,
    FileText,
    Camera,
    UserCircle,
    Building2,
    Home,
    Calendar,
    Contact,
    HeartPulse,
    CreditCard,
    Fingerprint,
    CheckCircle2,
    User,
    History
} from 'lucide-react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import useAuthStore from "@/hooks/Authstate";
import { toast } from "sonner";
import Link from 'next/link';

const GuestProfile = () => {
    const { user, logout } = useAuthStore();

    const { data: profile, isLoading } = useQuery({
        queryKey: ['guestFullProfile', user?.id],
        queryFn: async () => {
            if (!user?.id) return null;
            const res = await fetch(`/api/users/${user.id}/full-profile`);
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            return data.data;
        },
        enabled: !!user?.id
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 border-[3px] border-gray-200 border-t-black rounded-full animate-spin" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Loading Profile...</p>
                </div>
            </div>
        );
    }

    const userData = profile?.basic || user || {};
    const resident = profile?.resident || {};
    const hostel = profile?.hostel || {};
    const residency = profile?.residency || {};
    const history = profile?.history || [];

    // Logic: Only show "Checked Out" styling if they have NO active stay but DO have history
    const isCheckedOut = !residency.roomNumber && history.length > 0;

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-40 h-16">
                <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 ${isCheckedOut ? 'bg-rose-600' : 'bg-black'} rounded-lg flex items-center justify-center text-white`}>
                            <User className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-gray-900 tracking-tight uppercase">My Profile</h1>
                            <p className={`text-[9px] font-bold uppercase tracking-widest ${isCheckedOut ? 'text-rose-500' : 'text-gray-400'}`}>
                                {isCheckedOut ? 'Archived Resident Account' : 'Your Account Details'}
                            </p>
                        </div>
                    </div>
                    <Button onClick={logout} variant="ghost" className="h-8 px-4 rounded-lg hover:bg-rose-50 text-rose-600 font-bold text-[10px] uppercase tracking-widest">
                        <LogOut className="h-3.5 w-3.5 mr-2" /> Logout
                    </Button>
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">

                {/* Main Profile Card */}
                <div className="bg-white rounded-[2rem] p-1 shadow-sm border border-gray-100">
                    <div className={`${isCheckedOut ? 'bg-slate-900' : 'bg-gray-900'} rounded-[1.8rem] p-8 text-white relative overflow-hidden`}>
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

                        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
                            <div className="relative group/avatar">
                                <Avatar className="h-32 w-32 border-4 border-white/20 shadow-2xl">
                                    <AvatarImage src={userData.image || "/avatar-placeholder.png"} />
                                    <AvatarFallback className="text-4xl font-bold text-gray-900 bg-white">{userData.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className={`absolute bottom-0 right-0 h-8 w-8 ${isCheckedOut ? 'bg-rose-500' : 'bg-emerald-500'} rounded-full border-4 border-gray-900 flex items-center justify-center`}>
                                    {isCheckedOut ? <LogOut className="h-4 w-4 text-white" /> : <CheckCircle2 className="h-4 w-4 text-white" />}
                                </div>
                            </div>

                            <div className="flex-1 text-center md:text-left space-y-4">
                                <div>
                                    <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                                        <h2 className="text-3xl font-bold tracking-tight">{userData.name}</h2>
                                        <Badge className={`${isCheckedOut ? 'bg-rose-500/20 text-rose-300' : 'bg-white/10 text-white'} hover:bg-white/20 border-0 text-[9px] uppercase font-bold tracking-widest backdrop-blur-md`}>
                                            {isCheckedOut ? 'Past Resident' : userData.role || 'Resident'}
                                        </Badge>
                                        {userData.uid && (
                                            <Badge className="bg-white/10 hover:bg-white/20 text-white border-0 text-[9px] uppercase font-bold tracking-widest backdrop-blur-md font-mono">
                                                {userData.uid}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-gray-400 font-medium">{userData.email}</p>
                                </div>

                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
                                    <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-2 flex items-center gap-3 border border-white/5">
                                        <Phone className="h-4 w-4 text-white/70" />
                                        <div>
                                            <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Phone</p>
                                            <p className="text-xs font-bold">{userData.phone || "Not Added"}</p>
                                        </div>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-2 flex items-center gap-3 border border-white/5">
                                        <CreditCard className="h-4 w-4 text-white/70" />
                                        <div>
                                            <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">CNIC No.</p>
                                            <p className="text-xs font-bold">{userData.cnic || "Not Added"}</p>
                                        </div>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-2 flex items-center gap-3 border border-white/5">
                                        <Calendar className="h-4 w-4 text-white/70" />
                                        <div>
                                            <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Joined On</p>
                                            <p className="text-xs font-bold">{userData.joinedAt ? new Date(userData.joinedAt).toLocaleDateString() : 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Stay Details */}
                    <Card className="rounded-[2rem] border-gray-100 shadow-sm overflow-hidden group">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-50 py-4 px-6">
                            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-gray-500" /> {isCheckedOut ? 'Past Residency' : 'My Stay Details'}
                            </h3>
                        </CardHeader>
                        <CardContent className="p-6">
                            {residency.roomNumber ? (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-14 w-14 rounded-2xl ${isCheckedOut ? 'bg-rose-600' : 'bg-black'} flex items-center justify-center text-white shadow-lg shrink-0`}>
                                            <Home className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{isCheckedOut ? 'Checked Out From' : 'Current Room'}</p>
                                            <h4 className="text-xl font-bold text-gray-900 tracking-tight">Room {residency.roomNumber}</h4>
                                            <p className={`text-xs font-bold uppercase tracking-wide ${isCheckedOut ? 'text-rose-500' : 'text-emerald-600'}`}>
                                                {isCheckedOut ? 'Residency Inactive' : `Floor ${residency.floor} • ${residency.roomType}`}
                                            </p>
                                        </div>
                                    </div>

                                    <Separator className="bg-gray-100" />

                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Hostel Name</p>
                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                            <h5 className="font-bold text-gray-900">{hostel.name || "GreenView Hostel"}</h5>
                                            <p className="text-xs text-gray-500 mt-1">{hostel.address || "Address not available"}</p>
                                            {hostel.phone && <p className="text-xs text-gray-400 mt-2 font-mono">{hostel.phone}</p>}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                                        <Building2 className="h-6 w-6" />
                                    </div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No active stay found</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Guardian Info */}
                    <div className="space-y-6">
                        <Card className="rounded-[2rem] border-gray-100 shadow-sm overflow-hidden">
                            <CardHeader className="bg-gray-50/50 border-b border-gray-50 py-4 px-6">
                                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                    <Contact className="h-4 w-4 text-gray-500" /> Guardian Info
                                </h3>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Guardian Name</Label>
                                        <p className="font-bold text-sm text-gray-900">{resident.guardianName || "N/A"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Phone Number</Label>
                                        <p className="font-bold text-sm text-gray-900">{resident.guardianPhone || "N/A"}</p>
                                    </div>
                                </div>
                                <div className="bg-rose-50 rounded-xl p-4 border border-rose-100 flex items-start gap-3">
                                    <HeartPulse className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest">Emergency Contact</p>
                                        <p className="font-bold text-sm text-rose-900">{resident.emergencyContact || "Not Added"}</p>
                                        <p className="text-[10px] text-rose-400 mt-1">This person will be called in case of emergency.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-[2rem] border-gray-100 shadow-sm overflow-hidden">
                            <CardHeader className="bg-gray-50/50 border-b border-gray-50 py-4 px-6">
                                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-gray-500" /> Home Address
                                </h3>
                            </CardHeader>
                            <CardContent className="p-6">
                                <p className="text-sm font-medium text-gray-600 leading-relaxed">
                                    {resident.address || userData.address || "Your home address will appear here."}
                                </p>
                                <div className="mt-4 flex gap-2">
                                    <Badge variant="outline" className="text-[9px] font-bold text-gray-400 uppercase tracking-wider border-gray-200">
                                        {resident.city || userData.city || "Not Specified"}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Residency History Log */}
                {profile?.history?.length > 0 && (
                    <Card className="rounded-[2rem] border-gray-100 shadow-sm overflow-hidden group">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-50 py-4 px-6 flex flex-row items-center justify-between">
                            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                <History className="h-4 w-4 text-gray-500" /> Residency Timeline
                            </h3>
                            <Badge variant="outline" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-white border-gray-200 px-3">
                                {profile.history.length} Record{profile.history.length > 1 ? 's' : ''}
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-gray-50">
                                {profile.history.map((item, idx) => (
                                    <div key={item.id} className="p-6 flex items-center justify-between hover:bg-gray-50/30 transition-all cursor-default group/item">
                                        <div className="flex items-center gap-5">
                                            <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover/item:bg-slate-900 group-hover/item:text-white transition-all">
                                                <Home className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <p className="text-sm font-bold text-gray-900">Room {item.roomNumber || 'N/A'}</p>
                                                    <Badge className="bg-rose-50 text-rose-500 border-none text-[8px] font-bold uppercase tracking-wider px-2 py-0">Completed</Badge>
                                                </div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{item.hostelName || 'Unknown Hostel'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-2 justify-end">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest leading-none">
                                                        {item.checkIn ? new Date(item.checkIn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                                    </span>
                                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.15em] mt-1">Arrival</span>
                                                </div>
                                                <div className="h-4 w-[1px] bg-gray-200 mx-1" />
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest leading-none">
                                                        {item.checkOut ? new Date(item.checkOut).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                                    </span>
                                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.15em] mt-1">Departed</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Account Security */}
                <Card className="rounded-[2rem] border-gray-100 shadow-sm overflow-hidden bg-gray-900 text-white">
                    <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                                <Shield className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white uppercase tracking-tight">Account Safety</h3>
                                <p className="text-xs text-gray-400 mt-1">Your data is secured and only visible to you and the admin.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

            </main>
        </div>
    );
};

export default GuestProfile;
