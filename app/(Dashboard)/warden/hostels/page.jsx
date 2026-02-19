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
            <div className="p-8 space-y-6 animate-pulse">
                <div className="h-20 bg-gray-100 rounded-3xl" />
                <div className="h-96 bg-gray-50 rounded-[3rem]" />
            </div>
        );
    }

    if (!hostel) {
        return (
            <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Building2 className="h-16 w-16 text-gray-200 mx-auto" />
                    <h2 className="text-xl font-bold text-gray-900 uppercase">No Hostel Assigned</h2>
                    <p className="text-sm text-gray-400">Please contact the administrator to assign a hostel to your account.</p>
                </div>
            </div>
        );
    }

    const roomStats = {
        total: hostel.totalRooms || hostel.Room?.length || 0,
        occupied: hostel.Room?.filter(r => r.status === 'OCCUPIED').length || 0,
        available: hostel.Room?.filter(r => r.status === 'AVAILABLE').length || 0
    };

    return (
        <div className="min-h-screen bg-gray-50/30 pb-20">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-1 bg-indigo-600 rounded-full" />
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight uppercase">My Hostel</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Assigned Property</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
                {/* Hostel Overview Card */}
                <Card className="bg-white border border-gray-100 rounded-[3rem] shadow-sm overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-3">
                        {/* Main Info */}
                        <div className="lg:col-span-2 p-10 space-y-8">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="h-14 w-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                            <Building2 className="h-7 w-7" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">{hostel.name}</h2>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID: {hostel.id.slice(-8).toUpperCase()}</p>
                                        </div>
                                    </div>
                                </div>
                                <Badge className={`text-[10px] font-bold uppercase px-4 py-1.5 rounded-full ${hostel.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-100 text-gray-500'}`}>
                                    {hostel.status || 'ACTIVE'}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-5 rounded-2xl bg-gray-50/50 border border-gray-100">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Type</p>
                                    <p className="text-lg font-bold text-gray-900 uppercase">{hostel.type}</p>
                                </div>
                                <div className="p-5 rounded-2xl bg-gray-50/50 border border-gray-100">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Floors</p>
                                    <p className="text-lg font-bold text-gray-900">{hostel.floors}</p>
                                </div>
                                <div className="p-5 rounded-2xl bg-gray-50/50 border border-gray-100">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Monthly Rent</p>
                                    <p className="text-lg font-bold text-gray-900">PKR {hostel.montlyrent?.toLocaleString() || '--'}</p>
                                </div>
                                <div className="p-5 rounded-2xl bg-gray-50/50 border border-gray-100">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Nightly Rent</p>
                                    <p className="text-lg font-bold text-gray-900">PKR {hostel.pernightrent?.toLocaleString() || '--'}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Contact Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50/50 border border-gray-50">
                                        <MapPin className="h-4 w-4 text-gray-400" />
                                        <span className="text-xs font-medium text-gray-700">{hostel.address}, {hostel.city}</span>
                                    </div>
                                    {hostel.phone && (
                                        <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50/50 border border-gray-50">
                                            <Phone className="h-4 w-4 text-gray-400" />
                                            <span className="text-xs font-medium text-gray-700">{hostel.phone}</span>
                                        </div>
                                    )}
                                    {hostel.email && (
                                        <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50/50 border border-gray-50">
                                            <Mail className="h-4 w-4 text-gray-400" />
                                            <span className="text-xs font-medium text-gray-700">{hostel.email}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {hostel.description && (
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Description</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">{hostel.description}</p>
                                </div>
                            )}
                        </div>

                        {/* Stats Sidebar */}
                        <div className="bg-gray-50/50 border-l border-gray-100 p-10 space-y-8">
                            <div className="space-y-6">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Room Statistics</h3>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                                <Bed className="h-5 w-5" />
                                            </div>
                                            <span className="text-xs font-bold text-gray-500 uppercase">Total Rooms</span>
                                        </div>
                                        <span className="text-xl font-bold text-gray-900">{roomStats.total}</span>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                                <Users className="h-5 w-5" />
                                            </div>
                                            <span className="text-xs font-bold text-gray-500 uppercase">Occupied</span>
                                        </div>
                                        <span className="text-xl font-bold text-emerald-600">{roomStats.occupied}</span>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                                <CheckCircle2 className="h-5 w-5" />
                                            </div>
                                            <span className="text-xs font-bold text-gray-500 uppercase">Available</span>
                                        </div>
                                        <span className="text-xl font-bold text-blue-600">{roomStats.available}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Quick Actions</h3>
                                <div className="space-y-2">
                                    <Link href="/warden/rooms">
                                        <Button className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl">
                                            <Bed className="h-4 w-4 mr-2" /> Manage Rooms
                                        </Button>
                                    </Link>
                                    <Link href="/warden/residents">
                                        <Button variant="outline" className="w-full h-12 border-gray-200 font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-gray-50">
                                            <Users className="h-4 w-4 mr-2" /> View Residents
                                        </Button>
                                    </Link>
                                </div>
                            </div>

                            {/* Amenities */}
                            {hostel.amenities?.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Amenities</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {hostel.amenities.map((amenity, i) => (
                                            <Badge key={i} variant="outline" className="text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white">
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
