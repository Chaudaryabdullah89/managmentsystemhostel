"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import {
    Building2,
    Users,
    MapPin,
    Layers,
    Activity,
    CheckCircle2,
    DollarSign,
    Zap,
    MessageSquare,
    ShieldCheck,
    Sparkles,
    Globe,
    Info,
    RefreshCw,
    Hash,
    ChevronRight,
    LayoutGrid,
    Phone,
    Calendar,
    X,
    CreditCard,
    BedDouble,
    TrendingUp,
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import useAuthStore from '@/hooks/Authstate';
import { useHostelById } from '@/hooks/usehostel';
import Loader from '@/components/ui/Loader';
import { toast } from "sonner";
import { format } from "date-fns";

const WardenHostelsPage = () => {
    const { user } = useAuthStore();
    const { data: hostelData, isLoading, refetch } = useHostelById(user?.hostelId);
    const hostel = hostelData?.data;
    const [showInfo, setShowInfo] = useState(false);

    if (isLoading) return <Loader label="LOADING" subLabel="Getting hostel info..." icon={Activity} fullScreen={false} />;

    if (!hostel) {
        return (
            <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center p-6 text-center">
                <div className="h-12 w-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm mb-4">
                    <Building2 className="h-5 w-5 text-gray-300" />
                </div>
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Access Denied</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5 max-w-xs">
                    Your account is not linked to any hostel.
                </p>
                <Link href="/warden" className="mt-6">
                    <Button variant="outline" className="h-9 px-5 rounded-xl border-gray-200 text-[10px] font-bold uppercase tracking-widest">
                        Go Home
                    </Button>
                </Link>
            </div>
        );
    }

    const roomStats = {
        total: hostel.totalRooms || hostel.Room?.length || 0,
        occupied: hostel.Room?.filter(r => r.status === 'OCCUPIED').length || 0,
        available: hostel.Room?.filter(r => r.status === 'AVAILABLE').length || 0,
        maintenance: hostel.Room?.filter(r => r.status === 'MAINTENANCE').length || 0,
    };

    const occupancyRate = roomStats.total > 0 ? Math.round((roomStats.occupied / roomStats.total) * 100) : 0;

    const handleRefresh = async () => {
        const promise = refetch();
        toast.promise(promise, {
            loading: 'Refreshing...',
            success: 'Updated',
            error: 'Failed to update'
        });
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-1.5 bg-indigo-600 rounded-full shrink-0" />
                        <div className="flex flex-col">
                            <h1 className="text-sm md:text-base font-bold text-gray-900 tracking-tight uppercase">My Hostel</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Manage</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">Live</span>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        className="h-9 px-4 rounded-xl border border-gray-100 font-bold text-[10px] uppercase tracking-wider text-gray-500 hover:bg-gray-50 flex items-center gap-2"
                        onClick={handleRefresh}
                    >
                        <RefreshCw className="h-3.5 w-3.5 text-gray-400" /> Refresh
                    </Button>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 space-y-6">

                {/* Hero / Identity Card */}
                <Card className="bg-white border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                        <div className="flex items-center gap-4">
                            <div className="h-11 w-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <div className="space-y-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <Badge variant="outline" className="bg-gray-50 border-gray-100 text-gray-400 font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-widest">{hostel.type}</Badge>
                                    <Badge variant="outline" className="bg-emerald-50 border-emerald-100 text-emerald-600 font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-widest">Active</Badge>
                                </div>
                                <h2 className="text-base font-black text-gray-900 tracking-tight uppercase leading-none truncate">{hostel.name}</h2>
                                <div className="flex items-center gap-1.5 text-gray-400">
                                    <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider truncate">{hostel.address}, {hostel.city}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-6 md:pl-6 md:border-l border-gray-100">
                            <div className="space-y-0.5">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Monthly Rent</span>
                                <span className="text-base font-black text-gray-900 tracking-tight">PKR {hostel.montlyrent?.toLocaleString()}</span>
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Daily Rate</span>
                                <span className="text-base font-black text-gray-900 tracking-tight">PKR {hostel.pernightrent?.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5 pt-5 border-t border-gray-50">
                        {[
                            { label: 'Rooms', value: roomStats.total, sub: 'Total', icon: LayoutGrid, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                            { label: 'Occupancy', value: `${occupancyRate}%`, sub: 'Full', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            { label: 'Status', value: 'LIVE', sub: 'Ready', icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
                            { label: 'Floors', value: hostel.floors, sub: 'Levels', icon: Layers, color: 'text-amber-600', bg: 'bg-amber-50' }
                        ].map((stat, i) => (
                            <div key={i} className="flex items-center gap-3 group/stat">
                                <div className={`h-10 w-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0 shadow-inner group-hover/stat:scale-110 transition-transform`}>
                                    <stat.icon className="h-[18px] w-[18px]" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{stat.label}</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-sm font-black text-gray-900 tracking-tight uppercase leading-none tabular-nums">{stat.value}</span>
                                        <span className="text-[9px] font-bold text-gray-300 uppercase italic leading-none">{stat.sub}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Main Content */}
                    <div className="lg:col-span-8 space-y-5">

                        {/* Room Status */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 px-1">
                                <div className="h-4 w-1 bg-indigo-600 rounded-full" />
                                <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-900">Room Status</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {[
                                    { label: 'Available', value: roomStats.available, color: 'bg-indigo-600', icon: CheckCircle2, sub: 'Ready' },
                                    { label: 'Occupied', value: roomStats.occupied, color: 'bg-emerald-600', icon: Users, sub: 'Stayers' },
                                    { label: 'Maintenance', value: roomStats.maintenance, color: 'bg-amber-500', icon: Activity, sub: 'Fixing' }
                                ].map((node, i) => (
                                    <Card key={i} className="bg-white border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center justify-between">
                                                <div className="h-9 w-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                    <node.icon className="h-4 w-4" />
                                                </div>
                                                <span className="text-xl font-black text-gray-900 tracking-tight">{node.value}</span>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest leading-none mb-0.5">{node.label}</p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest italic">{node.sub}</p>
                                            </div>
                                            <div className="h-1 w-full bg-gray-50 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${node.color} rounded-full`}
                                                    style={{ width: `${(node.value / (roomStats.total || 1)) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="bg-white border-gray-100 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
                                <MapPin className="absolute top-4 right-4 h-8 w-8 text-gray-50 transition-colors" />
                                <div className="space-y-4 relative z-10">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Address</span>
                                        <p className="text-sm font-bold text-gray-800 leading-tight uppercase">{hostel.address}</p>
                                    </div>
                                    <div className="pt-4 border-t border-gray-50 flex items-center gap-2">
                                        <div className="h-7 w-7 rounded-lg bg-gray-50 flex items-center justify-center">
                                            <Globe className="h-3.5 w-3.5 text-gray-400" />
                                        </div>
                                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{hostel.city} Branch</span>
                                    </div>
                                </div>
                            </Card>

                            <Card className="bg-slate-900 rounded-2xl p-5 shadow-xl relative overflow-hidden group">
                                <div className="space-y-4 relative z-10 flex flex-col h-full justify-between">
                                    <div className="space-y-2">
                                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">About</span>
                                        <p className="text-[11px] text-gray-400 font-medium leading-relaxed italic border-l-2 border-indigo-500/30 pl-3">
                                            "{hostel.description || 'A premium hostel facility managed with high-quality service and security standards.'}"
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-7 w-7 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center">
                                            <Info className="h-3.5 w-3.5 text-white/30" />
                                        </div>
                                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Info</p>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Amenities */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-1 bg-indigo-600 rounded-full" />
                                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-900">Amenities</h3>
                                </div>
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{hostel.amenities?.length || 0} Total</span>
                            </div>
                            <Card className="bg-white border-gray-100 rounded-2xl p-4 shadow-sm">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    {hostel.amenities?.length > 0 ? hostel.amenities.map((amenity, i) => (
                                        <div key={i} className="p-3 bg-gray-50/50 rounded-xl border border-gray-50 hover:border-indigo-100 hover:bg-white hover:shadow-sm transition-all text-center group">
                                            <div className="h-7 w-7 rounded-lg bg-white mx-auto mb-2 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                                            </div>
                                            <span className="text-[9px] font-black text-gray-600 uppercase tracking-tighter group-hover:text-indigo-600 truncate block">{amenity}</span>
                                        </div>
                                    )) : (
                                        <div className="col-span-full py-8 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">No amenities listed</div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4 space-y-5">
                        {/* Management Card */}
                        <Card className="bg-white border-gray-100 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
                            <div className="space-y-5 relative z-10">
                                <div>
                                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Management</span>
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Active Warden</h3>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-indigo-600 font-black text-base uppercase shrink-0">
                                        {user?.name?.charAt(0) || 'D'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Official Warden</p>
                                        <p className="text-sm font-black text-gray-900 uppercase tracking-tight truncate">{user?.name || 'Administrator'}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 px-1">
                                    {[
                                        { label: 'Hostel ID', value: hostel.id.slice(-8).toUpperCase(), icon: Hash },
                                        { label: 'Security', value: 'Live', icon: Activity, color: 'text-emerald-500' },
                                        { label: 'City', value: hostel.city, icon: Globe }
                                    ].map((item, i) => (
                                        <div key={i} className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <item.icon className="h-3.5 w-3.5" />
                                                <span>{item.label}</span>
                                            </div>
                                            <span className={item.color || 'text-gray-900'}>{item.value}</span>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    className="w-full h-10 bg-gray-950 hover:bg-black text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm active:scale-95"
                                    onClick={() => setShowInfo(true)}
                                >
                                    Check Info
                                </Button>
                            </div>
                        </Card>

                        {/* Quick Links */}
                        <div className="space-y-2">
                            <h3 className="text-[9px] font-black uppercase tracking-widest px-1 text-gray-400">Quick Links</h3>
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { title: 'Residents', sub: 'Manage People', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/warden/residents' },
                                    { title: 'Bookings', sub: 'Room Requests', icon: Zap, color: 'text-indigo-600', bg: 'bg-indigo-50', link: '/warden/bookings' },
                                    { title: 'Payments', sub: 'Cash Flow', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/warden/payments' },
                                    { title: 'Complaints', sub: 'Fix Issues', icon: MessageSquare, color: 'text-rose-600', bg: 'bg-rose-50', link: '/warden/complaints' }
                                ].map((item, i) => (
                                    <Link href={item.link} key={i}>
                                        <div className="group bg-white border border-gray-100 rounded-xl p-3.5 flex items-center justify-between hover:shadow-md hover:shadow-indigo-100/50 transition-all cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-9 w-9 rounded-xl ${item.bg} ${item.color} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
                                                    <item.icon className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight">{item.title}</h4>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{item.sub}</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-indigo-600 transition-colors" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* ── Hostel Info Dialog ── */}
            <Dialog open={showInfo} onOpenChange={setShowInfo}>
                <DialogContent className="!max-w-2xl p-0 border-none shadow-2xl rounded-2xl overflow-hidden [&>button]:hidden">
                    {/* Modal Header */}
                    <div className="bg-gray-950 px-6 py-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center">
                                <Building2 className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <h2 className="text-sm font-black text-white uppercase tracking-tight">{hostel.name}</h2>
                                <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-0.5">Hostel Info</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl text-white/40 hover:text-white hover:bg-white/10"
                            onClick={() => setShowInfo(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-4 border-b border-gray-100">
                        {[
                            { label: 'Total Rooms', value: roomStats.total, icon: BedDouble, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                            { label: 'Occupancy', value: `${occupancyRate}%`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            { label: 'Floors', value: hostel.floors ?? '—', icon: Layers, color: 'text-amber-600', bg: 'bg-amber-50' },
                            { label: 'Available', value: roomStats.available, icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50' },
                        ].map((s, i) => (
                            <div key={i} className="flex flex-col items-center gap-1.5 py-4 border-r border-gray-100 last:border-r-0">
                                <div className={`h-8 w-8 rounded-lg ${s.bg} ${s.color} flex items-center justify-center`}>
                                    <s.icon className="h-3.5 w-3.5" />
                                </div>
                                <span className="text-sm font-black text-gray-900 tabular-nums">{s.value}</span>
                                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest text-center">{s.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-4 bg-gray-50/30">
                        {/* Identity */}
                        <div className="bg-white rounded-xl border border-gray-100 p-4 grid grid-cols-2 gap-4">
                            {[
                                { label: 'Hostel Name', value: hostel.name, icon: Building2 },
                                { label: 'Type', value: hostel.type, icon: ShieldCheck },
                                { label: 'City', value: hostel.city, icon: Globe },
                                { label: 'Phone', value: hostel.phone || '—', icon: Phone },
                                { label: 'Monthly Rent', value: `PKR ${hostel.montlyrent?.toLocaleString() || '—'}`, icon: CreditCard },
                                { label: 'Night Rate', value: `PKR ${hostel.pernightrent?.toLocaleString() || '—'}`, icon: CreditCard },
                                { label: 'Address', value: hostel.address || '—', icon: MapPin },
                                { label: 'System ID', value: hostel.id.slice(-10).toUpperCase(), icon: Hash },
                            ].map((f, i) => (
                                <div key={i} className="flex items-start gap-2.5">
                                    <div className="h-7 w-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
                                        <f.icon className="h-3.5 w-3.5 text-gray-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{f.label}</p>
                                        <p className="text-[11px] font-black text-gray-900 uppercase mt-0.5 truncate">{f.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Description */}
                        {hostel.description && (
                            <div className="bg-white rounded-xl border border-gray-100 p-4">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Description</p>
                                <p className="text-[11px] text-gray-600 leading-relaxed italic">"{hostel.description}"</p>
                            </div>
                        )}

                        {/* Amenities */}
                        {hostel.amenities?.length > 0 && (
                            <div className="bg-white rounded-xl border border-gray-100 p-4">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">Amenities ({hostel.amenities.length})</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {hostel.amenities.map((a, i) => (
                                        <span key={i} className="text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg uppercase tracking-tighter">
                                            {a}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Created At */}
                        {hostel.createdAt && (
                            <div className="flex items-center gap-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                <Calendar className="h-3 w-3" />
                                Registered: {format(new Date(hostel.createdAt), 'MMMM dd, yyyy')}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default WardenHostelsPage;
