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
            <div className="flex h-[100dvh] items-center justify-center bg-white font-sans">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="h-20 w-20 border-[3px] border-indigo-50 border-t-indigo-600 rounded-full animate-spin" />
                        <Building2 className="h-8 w-8 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    <div className="flex flex-col items-center gap-1.5 text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-900">Synchronizing Units</p>
                        <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400 italic">Retrieving Property Registry</p>
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
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-full flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                        <div className="h-8 w-1 bg-indigo-600 rounded-full shrink-0" />
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-sm md:text-lg font-bold text-gray-900 tracking-tight uppercase truncate">Rooms</h1>
                            <div className="flex items-center gap-1.5 md:gap-2">
                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-gray-400 truncate">Inventory</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500 shrink-0 hidden sm:block" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3 shrink-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl hover:bg-gray-100 h-8 w-8 md:h-10 md:w-10 shrink-0 hidden sm:flex"
                            onClick={handleRefresh}
                            disabled={isFetching}
                        >
                            <RefreshCw className={`h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400 ${isFetching ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 md:h-10 px-2.5 md:px-5 rounded-xl border-gray-200 bg-white font-bold text-[9px] md:text-[10px] uppercase tracking-wider text-gray-600 hover:bg-gray-50 transition-all shadow-sm shrink-0"
                            onClick={() => router.push('/warden/rooms/create')}
                        >
                            <Plus className="h-3.5 w-3.5 md:mr-2" />
                            <span className="hidden sm:inline">New Room</span>
                        </Button>
                        <Button
                            className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 md:h-10 px-3 md:px-6 rounded-xl font-bold text-[9px] md:text-[10px] uppercase tracking-wider shadow-sm transition-all active:scale-95 shrink-0"
                            onClick={() => router.push('/warden/bookings/create')}
                        >
                            <Plus className="h-3.5 w-3.5 md:mr-2" />
                            <span className="hidden sm:inline">Booking</span>
                            <span className="sm:hidden text-[7px]">Book</span>
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 md:py-10 space-y-6 md:space-y-10 min-w-0">
                {/* Minimal Metrics Matrix */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {[
                        { label: 'Units', value: stats.total, icon: Building2, color: 'text-gray-900', bg: 'bg-gray-100' },
                        { label: 'Beds', value: `${stats.totalCapacity}`, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Available', value: stats.available, icon: DoorOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Maint', value: stats.maintenance, icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 flex items-center gap-3 md:gap-4 shadow-sm hover:shadow-md transition-all cursor-default group min-w-0">
                            <div className={`h-10 w-10 md:h-11 md:w-11 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                                <stat.icon className="h-4 w-4 md:h-5 md:w-5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{stat.label}</span>
                                <span className="text-sm md:text-xl font-bold text-gray-900 tracking-tight truncate">{stat.value}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Operations Bar */}
                <div className="bg-white border border-gray-100 rounded-2xl md:rounded-[2rem] p-2 flex flex-col md:flex-row items-center gap-2 shadow-sm w-full min-w-0">
                    <div className="flex-1 relative w-full group px-2 min-w-0">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                        <Input
                            placeholder="Identify unit node..."
                            className="w-full h-10 md:h-14 pl-10 md:pl-12 bg-transparent border-none shadow-none font-bold text-[10px] md:text-sm focus-visible:ring-0 placeholder:text-gray-300 min-w-0"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="h-8 w-px bg-gray-100 mx-2 hidden md:block" />

                    <div className="flex items-center gap-1 p-1 bg-gray-50/50 rounded-xl md:rounded-2xl w-full md:w-auto overflow-x-auto min-w-0 scrollbar-hide shrink-0">
                        {['All', 'Available', 'Occupied', 'Maintenance'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`flex-1 md:flex-none px-4 md:px-8 py-2 md:py-3 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${statusFilter === s ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Minimal Ribbon Feed */}
                <div className="space-y-3 md:space-y-4">
                    {filteredRooms?.length > 0 ? (
                        filteredRooms.map((room) => (
                            <div key={room.id} className="bg-white border border-gray-100 rounded-[2rem] flex flex-col items-stretch shadow-sm hover:shadow-md transition-all relative overflow-hidden group min-w-0">
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${room.status === 'AVAILABLE' ? 'bg-emerald-500' : room.status === 'OCCUPIED' ? 'bg-blue-600' : 'bg-amber-500'} opacity-70`} />

                                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 md:gap-8 p-5 md:p-6 min-w-0">
                                    <div className="flex items-center gap-4 md:gap-5 flex-1 min-w-0 w-full">
                                        <div className={`h-11 w-11 md:h-14 md:w-14 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 border border-gray-100 group-hover:bg-black group-hover:text-white transition-colors ${room.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                            <BedDouble className="h-5 w-5 md:h-7 md:w-7" />
                                        </div>
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                                <h3 className="text-sm md:text-base font-black text-gray-900 uppercase tracking-tight truncate">Room {room.roomNumber}</h3>
                                                <Badge variant="outline" className={`${getStatusTheme(room.status)} text-[7px] md:text-[8px] font-black px-2 md:px-3 py-0.5 rounded-full border shadow-sm shrink-0 whitespace-nowrap uppercase tracking-widest`}>
                                                    {room.status}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-1 min-w-0">
                                                <Layers className="h-3 w-3 text-gray-400 shrink-0" />
                                                <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Floor {room.floor} • {room.type}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex items-center gap-6 md:gap-10 min-w-0 shrink-0 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-gray-50">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Capacity</span>
                                            <div className="flex items-center gap-1.5 mt-1.5">
                                                <Users className="h-3 w-3 text-gray-400" />
                                                <span className="text-[10px] md:text-xs font-black text-gray-900 tracking-tighter">{room.capacity} Nodes</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Rental Rate</span>
                                            <span className="text-[10px] md:text-xs font-black text-emerald-600 mt-1.5 tracking-tighter">PKR {room.monthlyrent?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex flex-col sm:col-span-2 lg:min-w-[160px] min-w-0">
                                            <span className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-1.5 truncate">
                                                <UserCircle2 className="h-3 w-3 shrink-0" />
                                                Occupancy
                                            </span>
                                            <div className="mt-2 flex flex-wrap gap-1.5 min-w-0">
                                                {room.Booking?.length > 0 ? (
                                                    room.Booking.filter(b => b.status === 'CHECKED_IN' || b.status === 'CONFIRMED').map((b) => (
                                                        <Badge key={b.id} variant="secondary" className="bg-gray-100 text-gray-800 border-none text-[7px] md:text-[8px] font-bold px-2 py-0.5 rounded-md uppercase tracking-tight truncate max-w-[100px]">
                                                            {b.User?.name}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-[9px] font-bold text-gray-300 italic uppercase tracking-wider">Empty Node</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 lg:ml-auto shrink-0 w-full lg:w-auto pt-4 lg:pt-0">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-10 md:h-12 w-10 md:w-12 rounded-xl md:rounded-2xl hover:bg-gray-100 text-gray-400 transition-all shrink-0">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-2xl border-gray-100 shadow-2xl">
                                                <DropdownMenuItem className="p-3 gap-3 rounded-xl font-bold text-[10px] uppercase tracking-wider text-gray-600 cursor-pointer" onClick={() => router.push(`/warden/rooms/${room.id}`)}>
                                                    <Eye className="h-4 w-4" /> View Profile
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="p-3 gap-3 rounded-xl font-bold text-[10px] uppercase tracking-wider text-gray-600 cursor-pointer" onClick={() => router.push(`/warden/rooms/${room.id}/maintenance`)}>
                                                    <Wrench className="h-4 w-4" /> Maintenance
                                                </DropdownMenuItem>
                                                {room.status === 'AVAILABLE' && (
                                                    <DropdownMenuItem className="p-3 gap-3 rounded-xl font-bold text-[10px] uppercase tracking-wider text-indigo-600 focus:bg-indigo-50 cursor-pointer" onClick={() => router.push(`/warden/bookings/create?roomId=${room.id}`)}>
                                                        <Plus className="h-4 w-4" /> New Booking
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <Button
                                            className="flex-1 lg:flex-none h-10 md:h-12 px-6 md:px-8 rounded-xl md:rounded-2xl bg-black hover:bg-gray-800 text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-lg flex items-center justify-center gap-2 group/btn active:scale-95 transition-all"
                                            onClick={() => router.push(`/warden/rooms/${room.id}`)}
                                        >
                                            Profile
                                            <ChevronRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="bg-gray-50/50 border-t border-gray-100 px-4 md:px-6 py-2 flex items-center gap-3 overflow-x-auto min-w-0 scrollbar-hide">
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest">Amens</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0 pr-4">
                                        {(room.amenities || []).slice(0, 6).map((amenity, i) => (
                                            <span key={i} className="text-[7.5px] md:text-[9px] font-bold text-gray-500 uppercase tracking-tight bg-white border border-gray-100 px-2 py-0.5 rounded-md shadow-sm whitespace-nowrap">
                                                {amenity}
                                            </span>
                                        ))}
                                        {(!room.amenities || room.amenities.length === 0) && (
                                            <span className="text-[8px] md:text-[9px] font-bold text-gray-300 italic uppercase">Base</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-20 md:py-32 flex flex-col items-center justify-center bg-white border border-gray-100 rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm border-dashed mx-auto px-6 text-center min-w-0">
                            <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl md:rounded-[2rem] bg-gray-50 flex items-center justify-center mb-8 shadow-inner">
                                <Search className="h-8 w-8 md:h-10 md:w-10 text-gray-200" />
                            </div>
                            <h3 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tighter italic">Registry Null</h3>
                            <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px] md:text-[11px] mt-2 italic">Zero units found in this vector branch</p>
                            <Button
                                variant="outline"
                                className="mt-10 rounded-xl md:rounded-2xl border-gray-100 uppercase tracking-[0.2em] text-[10px] font-black h-12 md:h-14 px-10 md:px-14 hover:bg-gray-50 transition-all text-gray-400 shadow-sm active:scale-95"
                                onClick={() => { setSearchTerm(''); setStatusFilter('All'); }}
                            >
                                Reset Node
                            </Button>
                        </div>
                    )}
                </div>


            </main>
        </div>
    );
};

export default WardenRoomsPage;

