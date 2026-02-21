"use client";
import React from 'react';
import Link from 'next/link';
import {
    Building2,
    Bed,
    Users,
    MapPin,
    Phone,
    Mail,
    ChevronRight,
    Activity,
    CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import useAuthStore from '@/hooks/Authstate';
import { useHostelById } from '@/hooks/usehostel';

const WardenHostelsPage = () => {
    const { user } = useAuthStore();
    const { data: hostelData, isLoading } = useHostelById(user?.hostelId);
    const hostel = hostelData?.hostel;

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white font-sans">
                <div className="flex flex-col items-center gap-6">
                    <div className="h-10 w-10 border-[3px] border-gray-100 border-t-black rounded-full animate-spin" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 italic">Accessing Property Node...</p>
                </div>
            </div>
        );
    }

    if (!hostel) {
        return (
            <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center p-6 text-center">
                <div className="h-20 w-20 rounded-[2.5rem] bg-gray-100 flex items-center justify-center mb-6 shadow-sm">
                    <Building2 className="h-10 w-10 text-gray-300" />
                </div>
                <h2 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tight italic">No Property Assigned</h2>
                <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-[0.2em] mt-3 max-w-sm leading-relaxed italic">
                    The identification matrix for your profile has no active property association. Please contact central administration.
                </p>
                <Button variant="outline" className="mt-8 rounded-xl border-gray-200 uppercase tracking-widest text-[9px] font-bold h-11 px-10 hover:bg-gray-50 transition-all text-gray-500">
                    Refresh Node State
                </Button>
            </div>
        );
    }

    const roomStats = {
        total: hostel.totalRooms || hostel.Room?.length || 0,
        occupied: hostel.Room?.filter(r => r.status === 'OCCUPIED').length || 0,
        available: hostel.Room?.filter(r => r.status === 'AVAILABLE').length || 0
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans tracking-tight leading-relaxed">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-full flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                        <div className="h-8 w-1 bg-black rounded-full shrink-0" />
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-sm md:text-lg font-black text-gray-900 tracking-tight uppercase truncate">My Hostel</h1>
                            <div className="flex items-center gap-1.5 md:gap-2">
                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-gray-400 truncate">Property Management</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500 shrink-0 hidden sm:block" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8 min-w-0">
                {/* Main Card */}
                <Card className="bg-white border border-gray-100 rounded-2xl md:rounded-3xl shadow-sm overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">

                        {/* Main Hostel Info */}
                        <div className="lg:col-span-2 p-6 md:p-10 space-y-8 md:space-y-12">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                                <div className="flex items-center gap-4 md:gap-6 min-w-0">
                                    <div className="h-14 w-14 md:h-16 md:w-16 rounded-2xl md:rounded-3xl bg-black text-white flex items-center justify-center shadow-lg shrink-0">
                                        <Building2 className="h-7 w-7 md:h-8 md:w-8" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-xl md:text-3xl font-black text-gray-900 uppercase truncate">{hostel.name}</h2>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Node ID: {hostel.id.slice(-8).toUpperCase()}</span>
                                            <div className="h-1 w-1 rounded-full bg-gray-200" />
                                            <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">{hostel.type} MODULE</span>
                                        </div>
                                    </div>
                                </div>
                                <Badge className={`self-start text-[8px] md:text-[10px] font-black uppercase tracking-widest px-5 py-2 rounded-full border-2 ${hostel.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-500 border-gray-200'} shadow-sm`}>
                                    {hostel.status || 'ACTIVE'}
                                </Badge>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
                                {[
                                    { label: 'Floors', value: `F-${hostel.floors}` },
                                    { label: 'Total Nodes', value: roomStats.total },
                                    { label: 'Monthly Rent', value: `PKR ${hostel.montlyrent?.toLocaleString()}` },
                                    { label: 'Nightly Rent', value: `PKR ${hostel.pernightrent?.toLocaleString()}` }
                                ].map((stat, i) => (
                                    <div key={i} className="p-4 md:p-6 rounded-2xl md:rounded-3xl bg-gray-50 border border-gray-100 shadow-sm transition-all hover:bg-white hover:border-indigo-100">
                                        <p className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                        <p className="text-sm md:text-lg font-black text-gray-900">{stat.value || '--'}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-6">
                                <h3 className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-widest">Contact Info</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-4 p-4 md:p-5 rounded-2xl bg-white border border-gray-50 shadow-sm hover:shadow-md">
                                        <div className="h-9 w-9 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center shrink-0">
                                            <MapPin className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Address</p>
                                            <p className="text-[11px] md:text-sm font-bold text-gray-700 truncate">{hostel.address}, {hostel.city}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 md:p-5 rounded-2xl bg-white border border-gray-50 shadow-sm hover:shadow-md">
                                        <div className="h-9 w-9 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center shrink-0">
                                            <Phone className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Phone</p>
                                            <p className="text-[11px] md:text-sm font-bold text-gray-700 truncate">{hostel.phone || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            {hostel.description && (
                                <div className="space-y-4">
                                    <h3 className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-widest">Description</h3>
                                    <p className="text-xs md:text-sm text-gray-500 font-medium border-l-2 border-gray-50 pl-6 md:pl-10">
                                        {hostel.description}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="bg-gray-50 p-6 md:p-10 space-y-10">
                            {/* Inventory */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-widest">Node Inventory</h3>
                                    <Activity className="h-4 w-4 text-emerald-500" />
                                </div>

                                <div className="space-y-3">
                                    {[
                                        { label: 'Operational Nodes', value: roomStats.total, icon: Bed, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                        { label: 'Active Occupancy', value: roomStats.occupied, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                        { label: 'Available Slots', value: roomStats.available, icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50' }
                                    ].map((stat, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 md:p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:scale-[1.02] transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className={`h-10 w-10 md:h-12 md:w-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                                                    <stat.icon className="h-5 w-5 md:h-6 md:w-6" />
                                                </div>
                                                <span className="text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest">{stat.label}</span>
                                            </div>
                                            <span className={`text-lg md:text-2xl font-black ${stat.color}`}>{stat.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Quick Access */}
                            <div className="space-y-5">
                                <h3 className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-widest">Quick Access</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <Link href="/warden/rooms">
                                        <Button className="w-full h-12 md:h-14 bg-black hover:bg-gray-800 text-white font-black text-[10px] uppercase tracking-widest rounded-xl md:rounded-2xl shadow-xl shadow-black/10 transition-all active:scale-95">
                                            <Bed className="h-4 w-4 mr-3" /> Manage Nodes
                                        </Button>
                                    </Link>
                                    <Link href="/warden/residents">
                                        <Button variant="outline" className="w-full h-12 md:h-14 border-gray-200 bg-white font-black text-[10px] uppercase tracking-widest rounded-xl md:rounded-2xl hover:bg-gray-50 transition-all active:scale-95">
                                            <Users className="h-4 w-4 mr-3" /> User Registry
                                        </Button>
                                    </Link>
                                </div>
                            </div>

                            {/* Amenities */}
                            {hostel.amenities?.length > 0 && (
                                <div className="space-y-6">
                                    <h3 className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-widest">System Perks</h3>
                                    <div className="flex flex-wrap gap-2 md:gap-3">
                                        {hostel.amenities.map((amenity, i) => (
                                            <Badge key={i} variant="outline" className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.1em] px-4 py-1.5 rounded-full bg-white border-gray-100 text-gray-500 shadow-sm hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100">
                                                {amenity}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </Card>
            </main>
        </div>
    );
};

export default WardenHostelsPage;
