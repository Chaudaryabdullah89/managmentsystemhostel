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
    Layers,
    ArrowUpRight,
    ChevronRight,
    Activity,
    CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import useAuthStore from '@/hooks/Authstate';
import { useHostelById } from '@/hooks/usehostel';
import Loader from '@/components/ui/Loader';

const WardenHostelsPage = () => {
    const { user } = useAuthStore();
    const { data: hostelData, isLoading } = useHostelById(user?.hostelId);
    const hostel = hostelData?.hostel;

    if (isLoading) return <Loader label="Loading" subLabel="Fetching hostel details..." icon={Building2} fullScreen={false} />;

    if (!hostel) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="h-20 w-20 rounded-3xl bg-white border border-gray-100 flex items-center justify-center mb-6 shadow-sm">
                    <Building2 className="h-10 w-10 text-gray-200" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">No hostel found</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2 max-w-xs">
                    You are not currently assigned to any hostel.
                </p>
            </div>
        );
    }

    const roomStats = {
        total: hostel.totalRooms || hostel.Room?.length || 0,
        occupied: hostel.Room?.filter(r => r.status === 'OCCUPIED').length || 0,
        available: hostel.Room?.filter(r => r.status === 'AVAILABLE').length || 0
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1400px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-1 bg-indigo-600 rounded-full" />
                        <div className="flex flex-col">
                            <h1 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Profile</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">System</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Active</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="h-7 px-4 rounded-full bg-emerald-50/50 text-emerald-700 border-emerald-100 text-[9px] font-black uppercase tracking-widest shadow-sm">
                            {hostel.status || 'ACTIVE'}
                        </Badge>
                    </div>
                </div>
            </div>

            <main className="max-w-[1400px] mx-auto px-6 py-8 space-y-8">
                {/* Stats Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 bg-white border-gray-100 rounded-3xl p-8 md:p-10 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                            <Building2 className="h-40 w-40 -mr-10 -mt-10 rotate-12" />
                        </div>

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="flex items-center gap-6">
                                <div className="h-16 w-16 md:h-20 md:w-20 rounded-3xl bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-200 shrink-0">
                                    <Building2 className="h-8 md:h-10 w-8 md:w-10" />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-2xl md:text-4xl font-black text-gray-900 uppercase tracking-tighter leading-none">{hostel.name}</h2>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="h-3 w-3 text-indigo-500" />
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{hostel.city}</span>
                                        </div>
                                        <div className="h-1 w-1 rounded-full bg-gray-200" />
                                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{hostel.type}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 md:gap-8 border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-8">
                                <div className="text-center md:text-left">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1">Monthly Rent</span>
                                    <span className="text-lg md:text-2xl font-black text-gray-900 tracking-tight">PKR {hostel.montlyrent?.toLocaleString()}</span>
                                </div>
                                <div className="text-center md:text-left">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1">Nightly Rent</span>
                                    <span className="text-lg md:text-2xl font-black text-gray-900 tracking-tight">PKR {hostel.pernightrent?.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-gray-950 text-white rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16" />
                        <div className="relative z-10">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-6">Availability</h3>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        <span className="text-sm font-bold uppercase tracking-tight">Free</span>
                                    </div>
                                    <span className="text-2xl font-black">{roomStats.available}</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${(roomStats.available / (roomStats.total || 1)) * 100}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[9px] font-black text-gray-500 uppercase tracking-widest">
                                    <span>{roomStats.occupied} Occupied</span>
                                    <span>{roomStats.total} Total</span>
                                </div>
                            </div>
                        </div>
                        <Link href="/warden/rooms" className="mt-8 relative z-10 overflow-hidden">
                            <Button className="w-full h-12 bg-white text-black hover:bg-gray-100 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all active:scale-95 group">
                                Rooms
                                <ChevronRight className="h-3.5 w-3.5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Details */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Information Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { label: 'Phone', value: hostel.phone || 'N/A', icon: Phone, color: 'text-blue-600', bg: 'bg-blue-50' },
                                { label: 'Floors', value: `Floor ${hostel.floors}`, icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                { label: 'Status', value: hostel.status || 'Active', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                { label: 'In', value: `${roomStats.occupied} Active`, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' }
                            ].map((item, i) => (
                                <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-all group">
                                    <div className={`h-10 w-10 rounded-xl ${item.bg} ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                        <item.icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.label}</span>
                                        <span className="text-xs font-black text-gray-900 uppercase italic tracking-tight">{item.value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Location Detail */}
                        <Card className="bg-white border border-gray-100 rounded-3xl p-8 relative overflow-hidden shadow-sm">
                            <div className="flex items-start gap-6">
                                <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 shadow-inner">
                                    <MapPin className="h-6 w-6 text-indigo-500" />
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Address</h3>
                                        <p className="text-sm md:text-lg font-bold text-gray-900 italic uppercase">
                                            {hostel.address}, {hostel.city}
                                        </p>
                                    </div>
                                    <Button variant="ghost" className="h-8 px-0 text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:bg-transparent hover:text-indigo-700 flex items-center gap-2 group">
                                        Map <ArrowUpRight className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        {/* Description Section */}
                        {hostel.description && (
                            <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Description</h3>
                                <p className="text-xs md:text-sm text-gray-600 font-medium leading-relaxed italic border-l-4 border-indigo-600/10 pl-6">
                                    "{hostel.description}"
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Amenities & Quick Actions */}
                    <div className="space-y-8">
                        {/* Amenities */}
                        <Card className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Amenities</h3>
                                <div className="h-6 w-6 rounded-lg bg-indigo-50 flex items-center justify-center">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {hostel.amenities?.length > 0 ? (
                                    hostel.amenities.map((amenity, i) => (
                                        <Badge key={i} variant="outline" className="h-8 px-4 rounded-xl font-bold text-[9px] uppercase tracking-widest border-gray-100 bg-gray-50/50 text-gray-500 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all cursor-default">
                                            {amenity}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-[10px] font-bold text-gray-300 italic">None</span>
                                )}
                            </div>
                        </Card>

                        {/* Quick Navigation */}
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2 mb-4 block">Links</h3>
                            {[
                                { label: 'Residents', icon: Users, href: '/warden/residents', color: 'bg-indigo-600' },
                                { label: 'Complaints', icon: Phone, href: '/warden/complaints', color: 'bg-indigo-600' },
                                { label: 'Profile', icon: Activity, href: '/warden/profile', color: 'bg-indigo-600' }
                            ].map((action, i) => (
                                <Link key={i} href={action.href}>
                                    <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between hover:border-indigo-200 hover:shadow-md transition-all group cursor-pointer mb-3 last:mb-0">
                                        <div className="flex items-center gap-4">
                                            <div className="h-9 w-9 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                <action.icon className="h-4 w-4" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">{action.label}</span>
                                        </div>
                                        <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default WardenHostelsPage;
