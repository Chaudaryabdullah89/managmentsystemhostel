"use client";
import React, { useState, useEffect } from 'react';
import {
    Bed,
    Search,
    Users,
    DoorOpen,
    Wrench,
    Building2,
    Plus,
    Eye,
    RefreshCw,
    ChevronLeft,
    Layers,
    UserCircle2,
    MoreVertical,
    ChevronRight,
    ShieldCheck,
    Coins,
    Sparkle,
    BedDouble
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useRouter } from 'next/navigation';
import useAuthStore from '@/hooks/Authstate';
import { useWardenRooms } from '@/hooks/useWarden';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const WardenRoomsPage = () => {
    const { user } = useAuthStore();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { data: rooms, isLoading, isFetching } = useWardenRooms(user?.id);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const filteredRooms = rooms?.filter(room => {
        const matchesSearch = room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || room.status === statusFilter.toUpperCase();
        return matchesSearch && matchesStatus;
    });

    useEffect(() => {
        // Passive automation trigger
        const syncLogs = async () => {
            try {
                await fetch('/api/automation/sync-logs', { method: 'POST' });
            } catch (err) {
                console.warn("Automation sync silent failure:", err);
            }
        };
        syncLogs();
    }, []);

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['warden', 'rooms', user?.id] });
        toast.success("Registry Refreshed");
    };

    const getStatusTheme = (status) => {
        switch (status) {
            case "AVAILABLE": return "bg-emerald-50 text-emerald-700 border-emerald-100";
            case "OCCUPIED": return "bg-blue-50 text-blue-700 border-blue-100";
            case "MAINTENANCE": return "bg-amber-50 text-amber-700 border-amber-100";
            case "CLEANING": return "bg-purple-50 text-purple-700 border-purple-100";
            default: return "bg-gray-50 text-gray-700 border-gray-100";
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white font-sans">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="h-20 w-20 border-[3px] border-gray-100 border-t-black rounded-full animate-spin" />
                        <Building2 className="h-8 w-8 text-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-bold text-gray-900 tracking-tight">Synchronizing Property Records...</p>
                        <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-widest">Retrieving Unit Registry</p>
                    </div>
                </div>
            </div>
        );
    }

    const stats = {
        total: rooms?.length || 0,
        occupied: rooms?.filter(r => r.status === 'OCCUPIED').length || 0,
        available: rooms?.filter(r => r.status === 'AVAILABLE').length || 0,
        maintenance: rooms?.filter(r => r.status === 'MAINTENANCE').length || 0,
        totalCapacity: rooms?.reduce((acc, r) => acc + r.capacity, 0) || 0,
        totalRent: rooms?.reduce((acc, r) => acc + (r.monthlyrent || 0), 0) || 0
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight">
            {/* Minimal Premium Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-1 bg-indigo-600 rounded-full" />
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight uppercase">Room Inventory</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Hostel Registry</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Active Node</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl hover:bg-gray-100 h-9 w-9"
                            onClick={handleRefresh}
                            disabled={isFetching}
                        >
                            <RefreshCw className={`h-4 w-4 text-gray-400 ${isFetching ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                            className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-6 rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all active:scale-95"
                            onClick={() => router.push('/warden/bookings/create')}
                        >
                            <Plus className="h-4 w-4 mr-2" /> New Booking
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
                {/* Minimal Metrics Matrix */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Units', value: stats.total, icon: Building2, color: 'text-gray-900', bg: 'bg-gray-100' },
                        { label: 'Total Capacity', value: `${stats.totalCapacity} Beds`, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Available Units', value: stats.available, icon: DoorOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Under Maintenance', value: stats.maintenance, icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-md transition-all cursor-default group">
                            <div className={`h-11 w-11 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</span>
                                <span className="text-xl font-bold text-gray-900 tracking-tight">{stat.value}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Operations Bar */}
                <div className="bg-white border border-gray-100 rounded-2xl p-2 flex flex-col md:flex-row items-center gap-4 shadow-sm">
                    <div className="flex-1 relative w-full group px-2">
                        <Search className="absolute left-6 top-1/group-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Identify unit node by number..."
                            className="w-full h-12 pl-10 bg-transparent border-none shadow-none font-bold text-sm focus-visible:ring-0 placeholder:text-gray-300"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="h-8 w-px bg-gray-100 mx-2 hidden md:block" />

                    <div className="flex items-center gap-1 p-1 bg-gray-50 rounded-xl w-full md:w-auto overflow-x-auto">
                        {['All', 'Available', 'Occupied', 'Maintenance', 'Cleaning'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${statusFilter === s ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Minimal Ribbon Feed */}
                <div className="space-y-3">
                    {filteredRooms?.length > 0 ? (
                        filteredRooms.map((room) => (
                            <div key={room.id} className="bg-white border border-gray-100 rounded-2xl flex flex-col items-stretch shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${room.status === 'AVAILABLE' ? 'bg-emerald-500' : room.status === 'OCCUPIED' ? 'bg-blue-600' : 'bg-amber-500'} opacity-70`} />

                                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 p-4 pr-6">
                                    {/* Section 1: Visual Identity */}
                                    <div className="flex items-center gap-5 min-w-[280px]">
                                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border border-gray-100 group-hover:bg-black group-hover:text-white transition-colors ${room.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                            <BedDouble className="h-6 w-6" />
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Suite {room.roomNumber}</h3>
                                                <Badge variant="outline" className={`${getStatusTheme(room.status)} text-[8px] font-bold px-2 py-0 rounded-full border shadow-sm`}>
                                                    {room.status}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <Layers className="h-3 w-3 text-gray-400" />
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Floor {room.floor} Node • {room.type}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 2: Infrastructure */}
                                    <div className="flex items-center gap-8 min-w-[160px]">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Capacity</span>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <Users className="h-3 w-3 text-gray-400" />
                                                <span className="text-[10px] font-black text-gray-900">{room.capacity} BEDS</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Yield Factor</span>
                                            <span className="text-[11px] font-bold text-emerald-600 mt-1 italic">PKR {room.monthlyrent?.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* Section 3: Current Occupancy */}
                                    <div className="flex-1 flex items-center gap-4 min-w-[200px]">
                                        <div className="h-4 w-px bg-gray-100 hidden lg:block" />
                                        <div className="flex flex-col flex-1">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                                <UserCircle2 className="h-3 w-3" />
                                                Active Residents
                                            </span>
                                            <div className="mt-1 flex flex-wrap gap-1">
                                                {room.Booking?.length > 0 ? (
                                                    room.Booking.filter(b => b.status === 'CHECKED_IN' || b.status === 'CONFIRMED').map((b) => (
                                                        <Badge key={b.id} variant="secondary" className="bg-gray-100 text-gray-900 border-none text-[8px] font-bold px-2 py-0.5 rounded-md uppercase tracking-tight">
                                                            {b.User?.name}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-[10px] font-bold text-gray-300 italic uppercase">Vacant Unit</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 4: Operational Actions */}
                                    <div className="flex items-center gap-2 lg:ml-auto">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-gray-100 text-gray-400 transition-all">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 p-1 rounded-xl border-gray-100 shadow-xl">
                                                <DropdownMenuItem className="p-2.5 gap-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider text-gray-600 cursor-pointer" onClick={() => router.push(`/warden/rooms/${room.id}`)}>
                                                    <Eye className="h-3.5 w-3.5" /> View Unit Profile
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="p-2.5 gap-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider text-gray-600 cursor-pointer" onClick={() => router.push(`/warden/rooms/${room.id}/maintenance`)}>
                                                    <Wrench className="h-3.5 w-3.5" /> Maintenance Log
                                                </DropdownMenuItem>
                                                {room.status === 'AVAILABLE' && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="p-2.5 gap-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider text-indigo-600 focus:bg-indigo-50 cursor-pointer" onClick={() => router.push(`/warden/bookings/create?roomId=${room.id}`)}>
                                                            <Plus className="h-3.5 w-3.5" /> New Booking
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <Button
                                            size="sm"
                                            className="h-11 px-6 rounded-xl bg-black hover:bg-gray-800 text-white font-bold uppercase tracking-wider text-[10px] shadow-sm flex items-center gap-2 group/btn active:scale-95 transition-all"
                                            onClick={() => router.push(`/warden/rooms/${room.id}`)}
                                        >
                                            View Profile
                                            <ChevronRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Service Shelf */}
                                <div className="bg-gray-50/30 border-t border-gray-100 px-6 py-2 flex items-center gap-5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Unit Features</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {(room.amenities || []).slice(0, 6).map((amenity, i) => (
                                            <span key={i} className="text-[9px] font-bold text-gray-500 uppercase tracking-tight bg-white border border-gray-100 px-2.5 py-0.5 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                                {amenity}
                                            </span>
                                        ))}
                                        {(!room.amenities || room.amenities.length === 0) && (
                                            <span className="text-[9px] font-bold text-gray-300 italic uppercase tracking-widest">Base configuration</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-24 flex flex-col items-center justify-center bg-white border border-gray-100 rounded-[3rem] shadow-sm border-dashed">
                            <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-6">
                                <Search className="h-8 w-8 text-gray-200" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Registry Node Empty</h3>
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1 italic">No units matched your query in the current node</p>
                            <Button
                                variant="outline"
                                className="mt-8 rounded-xl border-gray-200 uppercase tracking-widest text-[9px] font-bold h-11 px-10 hover:bg-gray-50 transition-all text-gray-500"
                                onClick={() => { setSearchTerm(''); setStatusFilter('All'); }}
                            >
                                Reset Registry Node
                            </Button>
                        </div>
                    )}
                </div>


            </main>
        </div>
    );
};

export default WardenRoomsPage;

