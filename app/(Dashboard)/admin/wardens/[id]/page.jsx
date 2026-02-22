"use client"
import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
    ArrowLeft, User, Mail, Phone, MapPin, Calendar,
    Clock, ShieldCheck, Building2, Hash, CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserById } from "@/hooks/useusers";
import Loader from "@/components/ui/Loader";

const WardenProfilePage = () => {
    const params = useParams();
    const { data: user, isLoading, error } = useUserById(params.id);

    if (isLoading) return (
        <Loader label="Loading Warden Profile" subLabel="Fetching warden details..." icon={User} fullScreen={false} />
    );

    if (error || !user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50 gap-4 font-sans">
                <div className="h-16 w-16 rounded-2xl bg-rose-50 flex items-center justify-center mb-2">
                    <User className="h-8 w-8 text-rose-400" />
                </div>
                <h3 className="text-base font-bold text-gray-900 uppercase tracking-tight">Profile Not Found</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Could not load warden profile</p>
                <Link href="/admin/hostels">
                    <Button className="mt-4 h-10 px-8 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-[10px] uppercase tracking-widest">
                        Go Back
                    </Button>
                </Link>
            </div>
        );
    }

    const getRoleBadge = (role) => {
        switch (role) {
            case "ADMIN": return "bg-rose-50 text-rose-700 border-rose-100";
            case "WARDEN": return "bg-blue-50 text-blue-700 border-blue-100";
            default: return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    const InfoRow = ({ icon: Icon, label, value }) => (
        <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="h-3.5 w-3.5 text-gray-400" />
            </div>
            <div className="flex flex-col min-w-0">
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{label}</span>
                <span className="text-[12px] font-bold text-gray-900 mt-0.5 truncate">{value || "N/A"}</span>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight">

            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-full flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 md:gap-4">
                        <Link href="/admin/hostels">
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-gray-100 text-gray-500 shrink-0">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div className="h-8 w-1 bg-blue-600 rounded-full shrink-0" />
                        <div className="flex flex-col">
                            <h1 className="text-sm md:text-lg font-bold text-gray-900 tracking-tight uppercase">Warden Profile</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-gray-400 truncate">{user.name}</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500 hidden sm:block" />
                                <span className={`text-[9px] font-bold uppercase tracking-wider hidden sm:block ${user.isActive ? 'text-emerald-600' : 'text-rose-500'}`}>
                                    {user.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8">

                {/* Profile Hero Card */}
                <div className="bg-white border border-gray-100 rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start gap-5 md:gap-8">

                        {/* Avatar */}
                        <div className="h-20 w-20 md:h-24 md:w-24 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                            {user.image ? (
                                <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-2xl md:text-3xl font-black text-gray-300 uppercase">
                                    {user.name?.charAt(0)}
                                </span>
                            )}
                        </div>

                        {/* Identity */}
                        <div className="flex flex-col flex-1 min-w-0 gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-lg md:text-2xl font-black text-gray-900 uppercase tracking-tight">{user.name}</h2>
                                <Badge variant="outline" className={`${getRoleBadge(user.role)} text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-widest shrink-0`}>
                                    {user.role}
                                </Badge>
                                <Badge variant="outline" className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-widest shrink-0 ${user.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                    {user.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>

                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                {user.designation || "Warden"}
                            </p>

                            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-1">
                                <div className="flex items-center gap-1.5">
                                    <Hash className="h-3 w-3 text-gray-400" />
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">{user.id?.slice(-10).toUpperCase()}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-3 w-3 text-gray-400" />
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Clock className="h-3 w-3 text-gray-400" />
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        Last Login: {user.lastLogin ? new Date(user.lastLogin).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : "Never"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

                    {/* Personal Info */}
                    <div className="bg-white border border-gray-100 rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-sm space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
                            <div className="h-8 w-1 bg-blue-600 rounded-full" />
                            <h3 className="text-[11px] md:text-xs font-black uppercase tracking-widest text-gray-900">Personal Info</h3>
                        </div>
                        <InfoRow icon={Mail} label="Email Address" value={user.email} />
                        <InfoRow icon={Phone} label="Phone Number" value={user.phone} />
                        <InfoRow icon={CreditCard} label="CNIC Number" value={user.cnic} />
                        <InfoRow icon={ShieldCheck} label="Account Role" value={user.role} />
                    </div>

                    {/* Location Info */}
                    <div className="bg-white border border-gray-100 rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-sm space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
                            <div className="h-8 w-1 bg-blue-600 rounded-full" />
                            <h3 className="text-[11px] md:text-xs font-black uppercase tracking-widest text-gray-900">Location Info</h3>
                        </div>
                        <InfoRow icon={MapPin} label="Address" value={user.address} />
                        <InfoRow icon={Building2} label="City" value={user.city} />
                        <InfoRow icon={MapPin} label="Country" value={user.country || "Pakistan"} />
                        {user.Hostel && (
                            <InfoRow icon={Building2} label="Assigned Hostel" value={user.Hostel?.name} />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default WardenProfilePage;
