"use client"
import React, { useState, useEffect } from 'react'
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import {
    RefreshCw,
    Plus,
    Users,
    Bed,
    Search,
    Filter,
    MapPin,
    Edit,
    Trash,
    BedDouble,
    DoorOpen,
    UserCheck,
    Wrench,
    ChevronRight,
    Loader2,
    LayoutGrid,
    MoreVertical,
    ArrowUpRight,
    Sparkle,
    Coins,
    Building2,
    ShieldCheck,
    Layers,
    ArrowLeft,
    HandCoins,
    UserCircle2
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useRoom } from "@/hooks/useRoom"
import { useHostel } from "@/hooks/usehostel"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { QueryKeys } from '@/lib/queryclient'
import { useQueryClient, useMutation } from '@tanstack/react-query'

const useSyncAutomation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const response = await fetch('/api/automation/sync-logs', { method: 'POST' });
            return response.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: [QueryKeys.Rooms] });
            toast.success(`Sync Complete: ${data.data.cleaning} cleaning & ${data.data.laundry} laundry logs generated.`);
        }
    });
};

const GlobalRoomsPage = () => {
    const router = useRouter()
    const queryClient = useQueryClient()
    const { data: roomsResponse, isLoading: roomsLoading, isFetching: isFetchingRooms } = useRoom()
    const syncAutomation = useSyncAutomation();
    const { data: hostelsResponse } = useHostel()

    useEffect(() => {
        syncAutomation.mutate();
    }, []);

    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('All')
    const [typeFilter, setTypeFilter] = useState('All')
    const [hostelFilter, setHostelFilter] = useState('All')
    const [isDeleting, setIsDeleting] = useState(null)

    const rooms = roomsResponse?.data || []
    const hostels = hostelsResponse?.data || []

    const stats = {
        total: rooms.length,
        available: rooms.filter(r => r.status === 'AVAILABLE').length,
        occupied: rooms.filter(r => r.status === 'OCCUPIED').length,
        maintenance: rooms.filter(r => r.status === 'MAINTENANCE').length
    }

    const filteredRooms = rooms.filter(room => {
        const matchesSearch = room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (room.Hostel?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All' || room.status === statusFilter.toUpperCase();
        const matchesType = typeFilter === 'All' || room.type === typeFilter.toUpperCase();
        const matchesHostel = hostelFilter === 'All' || room.Hostel?.name === hostelFilter;
        return matchesSearch && matchesStatus && matchesType && matchesHostel;
    })

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: QueryKeys.Roomlist() })
        toast.success("Refreshed");
    }

    const handleDeleteRoom = async (roomId) => {
        setIsDeleting(roomId);
        try {
            const response = await fetch(`/api/rooms/deleteroom?roomId=${roomId}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (data.success) {
                toast.success("Unit Decommissioned");
                queryClient.invalidateQueries({ queryKey: QueryKeys.Roomlist() });
            } else {
                toast.error(data.error || "Decommission Protocol Failed");
            }
        } catch (error) {
            console.error("Delete room error:", error);
            toast.error("Internal System Error");
        } finally {
            setIsDeleting(null);
        }
    };

    const getStatusTheme = (status) => {
        switch (status) {
            case "AVAILABLE": return "bg-emerald-50 text-emerald-700 border-emerald-100";
            case "OCCUPIED": return "bg-blue-50 text-blue-700 border-blue-100";
            case "MAINTENANCE": return "bg-amber-50 text-amber-700 border-amber-100";
            case "CLEANING": return "bg-purple-50 text-purple-700 border-purple-100";
            default: return "bg-gray-50 text-gray-700 border-gray-100";
        }
    }

    if (roomsLoading) return (
        <div className="flex h-screen items-center justify-center bg-white font-sans">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="h-20 w-20 border-[3px] border-gray-100 border-t-indigo-600 rounded-full animate-spin" />
                    <Building2 className="h-8 w-8 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center">
                    <p className="text-lg font-bold text-gray-900 tracking-tight">Loading Rooms...</p>
                    <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-widest">Fetching Rooms Data</p>
                </div>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans">
            {/* Minimal Premium Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-4">
                        <div className="h-6 w-px bg-gray-200 hidden md:block" />
                        <div className="flex flex-col">
                            <h1 className="text-base md:text-lg font-bold text-gray-900 tracking-tight">All Rooms</h1>
                            <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 md:gap-2">
                                <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse hidden sm:block" />
                                <span className="hidden sm:inline">ROOMS LIST • UPDATING</span>
                                <span className="sm:hidden">UPDATING</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl hover:bg-gray-100 h-8 w-8 md:h-9 md:w-9"
                            onClick={handleRefresh}
                            disabled={isFetchingRooms}
                        >
                            <RefreshCw className={`h-4 w-4 text-gray-400 ${isFetchingRooms ? 'animate-spin' : ''}`} />
                        </Button>
                        <Link href="/admin/hostels/createroom?role=admin">
                            <Button className="bg-black hover:bg-gray-800 text-white h-8 md:h-9 px-3 md:px-4 rounded-xl font-bold text-[9px] md:text-[10px] uppercase tracking-wider shadow-sm gap-1.5 md:gap-2 flex items-center">
                                <Plus className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Add New Room</span>
                                <span className="sm:hidden">Add</span>
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8 min-w-0">
                {/* Minimal Metrics Matrix */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Rooms', value: stats.total, icon: Building2, color: 'text-gray-900', bg: 'bg-gray-100' },
                        { label: 'Total Capacity', value: rooms.reduce((acc, r) => acc + r.capacity, 0), icon: Bed, color: 'text-purple-600', bg: 'bg-purple-50' },
                        { label: 'Available', value: stats.available, icon: DoorOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Occupancy', value: `${Math.round((stats.occupied / (stats.total || 1)) * 100)}%`, icon: UserCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow cursor-default">
                            <div className={`h-11 w-11 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
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
                <div className="bg-white border border-gray-100 rounded-2xl p-2 flex flex-col md:flex-row items-center gap-4 shadow-sm w-full min-w-0">
                    <div className="flex-1 relative w-full group px-2 min-w-0">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Find room by number, hostel or type..."
                            className="w-full h-12 pl-10 bg-transparent border-none shadow-none font-bold text-[11px] md:text-sm focus-visible:ring-0 placeholder:text-gray-300 min-w-0"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="h-8 w-px bg-gray-100 mx-2 hidden md:block" />

                    <div className="flex items-center gap-2 p-1 w-full md:w-auto overflow-x-auto">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-9 px-4 rounded-xl border-gray-100 font-bold gap-3 hover:bg-gray-50 text-[10px] uppercase tracking-wider text-gray-500 min-w-[160px]">
                                    <Building2 className="h-3.5 w-3.5" />
                                    {hostelFilter === 'All' ? 'All Hostels' : hostelFilter}
                                    <ChevronRight className="h-3 w-3 opacity-30 rotate-90" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64 rounded-2xl p-1 border-gray-100">
                                <DropdownMenuLabel className="text-[9px] font-bold uppercase tracking-widest text-gray-400 px-3 py-2">Hostels</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setHostelFilter('All')} className="rounded-xl font-bold text-xs p-3">ALL HOSTELS</DropdownMenuItem>
                                {hostels.map(h => (
                                    <DropdownMenuItem key={h.id} onClick={() => setHostelFilter(h.name)} className="rounded-xl font-bold text-xs p-3 flex items-center gap-2 uppercase">
                                        <MapPin className="h-3 w-3 text-blue-500" /> {h.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="h-6 w-px bg-gray-100 mx-1 hidden md:block" />

                        <div className="flex items-center gap-1 p-1 bg-gray-50 rounded-xl">
                            {['All', 'Available', 'Occupied', 'Maintenance'].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    className={`flex-none px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${statusFilter === s ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Minimal Ribbon Feed */}
                <div className="space-y-3">
                    {filteredRooms.length > 0 ? (
                        filteredRooms.map((room, index) => (
                            <div key={room.id || index} className="bg-white border border-gray-100 rounded-2xl flex flex-col items-stretch shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${room.status === 'AVAILABLE' ? 'bg-emerald-500' : room.status === 'OCCUPIED' ? 'bg-blue-600' : 'bg-amber-500'} opacity-70`} />

                                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-8 p-4 pr-6">
                                    {/* Section 1: Visual Identity */}
                                    <div className="flex items-center gap-3 md:gap-5 min-w-[200px] md:min-w-[280px]">
                                        <div className={`h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center shrink-0 border border-gray-100 group-hover:bg-black group-hover:text-white transition-colors ${room.status === 'AVAILABLE' ? 'bg-emerald-50/50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                            <BedDouble className="h-5 w-5 md:h-6 md:w-6" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-2 md:gap-3">
                                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight truncate">Room {room.roomNumber}</h3>
                                                <Badge variant="outline" className={`${getStatusTheme(room.status)} text-[8px] font-bold px-2 py-0 rounded-full border shadow-sm`}>
                                                    {room.status}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <Building2 className="h-3 w-3 text-gray-400 min-w-3" />
                                                <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{room.Hostel?.name || 'Asset Registry'} • LVL {room.floor}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 2: Infrastructure */}
                                    <div className="flex items-center gap-6 md:gap-8 min-w-[140px] md:min-w-[160px]">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest">Room Type</span>
                                            <span className="text-[9px] md:text-[10px] font-bold text-gray-700 uppercase">{room.type}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest">Capacity</span>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <Users className="h-3 w-3 text-gray-400" />
                                                <span className="text-[9px] md:text-[10px] font-black text-gray-900">{room.capacity} BEDS</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 3: Current Occupancy */}
                                    <div className="flex-1 flex items-center gap-4 min-w-[150px] md:min-w-[200px] w-full lg:w-auto">
                                        <div className="h-4 w-px bg-gray-100 hidden lg:block" />
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <span className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                                <UserCircle2 className="h-3 w-3" />
                                                Students
                                            </span>
                                            <div className="mt-1 flex flex-wrap gap-1">
                                                {room.Booking?.length > 0 ? (
                                                    room.Booking.map((b) => (
                                                        <Badge key={b.id} variant="secondary" className="bg-gray-100 text-gray-900 border-none text-[8px] font-bold px-2 py-0.5 rounded-md uppercase tracking-tight">
                                                            {b.User?.name}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-[9px] md:text-[10px] font-bold text-gray-300 italic uppercase">Empty Room</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 4: Commercial */}
                                    <div className="flex items-center gap-6 md:gap-10 min-w-[140px] md:min-w-[200px]">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest">Price</span>
                                            <span className="text-[10px] md:text-[11px] font-bold text-gray-900 italic tracking-tight">Rs. {room.price?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest">Rent</span>
                                            <span className="text-[10px] md:text-[11px] font-bold text-emerald-600 italic">Rs. {(room.monthlyrent || room.montlyrent || room.price || 0).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* Section 5: Operational */}
                                    <div className="flex items-center justify-between lg:justify-end gap-2 lg:ml-auto w-full lg:w-auto mt-2 lg:mt-0">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-gray-100 text-gray-400">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 p-1 rounded-xl border-gray-100 shadow-xl">
                                                <DropdownMenuItem className="p-2.5 gap-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider text-gray-600 cursor-pointer" onClick={() => router.push(`/admin/hostels/${room.hostelId}/room-details/room/${room.id}/edit-room?hostelId=${room.hostelId}`)}>
                                                    <Edit className="h-3.5 w-3.5" /> Edit Room
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="p-2.5 gap-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider text-gray-600 cursor-pointer" onClick={() => router.push(`/admin/hostels/${room.hostelId}/room-details/room/${room.id}/maintenance`)}>
                                                    <Wrench className="h-3.5 w-3.5" /> Maintenance Logs
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="p-2.5 gap-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider text-rose-500 focus:bg-rose-50 focus:text-rose-600 cursor-pointer" onSelect={(e) => e.preventDefault()}>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger className="w-full text-left flex items-center gap-2.5">
                                                            <Trash className="h-3.5 w-3.5" /> Delete
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent className="w-[95%] sm:w-full rounded-3xl border-0 shadow-2xl overflow-hidden p-0 max-w-lg mx-auto">
                                                            <div className="bg-gray-950 p-6 md:p-8 text-white">
                                                                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center mb-4"><Trash size={20} className="text-rose-500" /></div>
                                                                <AlertDialogTitle className="text-lg md:text-xl font-bold tracking-tight mb-2 uppercase">Delete Room?</AlertDialogTitle>
                                                                <AlertDialogDescription className="text-gray-400 font-bold text-[10px] md:text-xs uppercase tracking-widest leading-relaxed">
                                                                    Deleting <span className="text-white">Room {room.roomNumber}</span> is permanent.
                                                                </AlertDialogDescription>
                                                            </div>
                                                            <div className="p-4 md:p-6 flex items-center justify-end gap-3 bg-white">
                                                                <AlertDialogCancel className="rounded-xl border-gray-100 bg-gray-50 font-bold px-6 h-11 uppercase tracking-widest text-[9px] text-gray-500">Cancel</AlertDialogCancel>
                                                                <AlertDialogAction className="bg-rose-600 hover:bg-rose-700 rounded-xl font-bold px-6 h-11 uppercase tracking-widest text-[9px] shadow-sm" onClick={() => handleDeleteRoom(room.id)}>Execute</AlertDialogAction>
                                                            </div>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <Button
                                            size="sm"
                                            className="h-9 md:h-11 px-4 md:px-6 rounded-xl bg-black hover:bg-gray-800 text-white font-bold uppercase tracking-wider text-[9px] md:text-[10px] shadow-sm flex items-center gap-2 group/btn active:scale-95 transition-all"
                                            onClick={() => router.push(`/admin/hostels/${encodeURIComponent(room.Hostel?.name || 'asset')}/room-details/room/${room.id}?hostelId=${room.hostelId}`)}
                                        >
                                            View Room
                                            <ChevronRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Service Shelf */}
                                <div className="bg-gray-50/30 border-t border-gray-100 px-6 py-2.5 flex items-center gap-5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Amenities</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {(room.amenities || []).slice(0, 5).map((amenity, i) => (
                                            <span key={i} className="text-[9px] font-bold text-gray-600 uppercase tracking-tight bg-white border border-gray-100 px-2.5 py-1 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                                {amenity}
                                            </span>
                                        ))}
                                        {(!room.amenities || room.amenities.length === 0) && (
                                            <span className="text-[9px] font-bold text-gray-300 italic uppercase tracking-widest">Base configuration</span>
                                        )}
                                        {room.amenities?.length > 5 && (
                                            <span className="text-[9px] font-bold text-gray-400 uppercase bg-gray-100 px-2 py-1 rounded-md">+{room.amenities.length - 5}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-20 flex flex-col items-center justify-center bg-white border border-gray-100 rounded-3xl shadow-sm border-dashed">
                            <Search className="h-10 w-10 text-gray-200 mb-4" />
                            <h3 className="text-lg font-bold text-gray-900 uppercase">Registry Empty</h3>
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px] mt-1">No units matched your query</p>
                            <Button
                                variant="outline"
                                className="mt-8 rounded-xl border-gray-200 uppercase tracking-widest text-[9px] font-bold h-10 px-8 hover:bg-gray-50 transition-all text-gray-400"
                                onClick={() => { setSearchQuery(''); setStatusFilter('All'); }}
                            >
                                Reset Registry
                            </Button>
                        </div>
                    )}
                </div>


            </main>
        </div>
    )
}

export default GlobalRoomsPage