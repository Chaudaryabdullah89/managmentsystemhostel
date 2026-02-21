"use client"
import React, { useState } from 'react'
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
    RefreshCw,
    Plus,
    Bed,
    Users,
    User,
    Search,
    Filter,
    MapPin,
    Edit,
    Trash,
    ChevronRight,
    MoreVertical,
    Building2,
    Sparkles,
    LayoutGrid,
    CheckCircle2,
    Clock,
    Layers,
    Navigation,
    DoorOpen,
    ArrowLeft,
    ShieldCheck,
    Coins,
    Globe,
    Info,
    Sparkle
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '../../../../lib/queryclient'
import { deletehostel, useHostel } from "../../../../hooks/usehostel"
import { useuserbyrole } from "../../../../hooks/useusers"
import Error from '../../../../components/ui/error'
import WardenNames from '../../../../components/WardenNames'
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const HostelsPage = () => {
    const queryClient = useQueryClient()
    const router = useRouter()
    const { data: apiResponse, error: hosteldataerror, isLoading: hostelsloading, isFetching: isFetchingHostels } = useHostel();

    const [searchterm, setsearchterm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [deletingHostelId, setDeletingHostelId] = useState(null)

    const hostelsToDisplay = (apiResponse?.data || []).map(h => ({
        id: h.id,
        name: h.name,
        type: h.type,
        status: h.status || "ACTIVE",
        location: {
            address: h.address,
            city: h.city,
            state: h.state,
            country: h.country,
            postalCode: h.zip,
            fullAddress: h.completeaddress || `${h.address}, ${h.city}`
        },
        basicInfo: {
            type: h.type,
            floors: h.floors,
            contact: h.phone,
            wardens: h.wardens || []
        },
        roomStats: {
            totalRooms: (h.Room || []).length,
            availableRooms: (h.Room || []).filter(r => r.status === 'AVAILABLE').length,
            occupiedRooms: (h.Room || []).filter(r => r.status === 'OCCUPIED').length,
            maintenanceRooms: (h.Room || []).filter(r => r.status === 'MAINTENANCE').length
        },
        description: h.description,
        rooms: h.Room || [],
        meta: {
            createdOn: new Date(h.createdAt).toLocaleDateString(),
            createdBy: "Admin",
            updatedOn: new Date(h.updatedAt).toLocaleDateString()
        }
    }));

    const matchedData = hostelsToDisplay.filter((item) => {
        const matchesSearch = item.name.toLowerCase().includes(searchterm.toLowerCase()) ||
            item.location.city.toLowerCase().includes(searchterm.toLowerCase()) ||
            item.type.toLowerCase().includes(searchterm.toLowerCase());
        const matchesFilter = filterType === 'All' || item.type === filterType.toUpperCase();
        return matchesSearch && matchesFilter;
    })

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: QueryKeys.hostellist() });
        toast.success("Refreshed");
    };

    const { mutate, isPending: deletehostelloading } = deletehostel()

    const handledelecthostel = async (id) => {
        setDeletingHostelId(id)
        mutate(id)
    }

    const getStatusTheme = (status) => {
        switch (status) {
            case "ACTIVE": return "bg-green-50 text-green-700 border-green-100";
            case "INACTIVE": return "bg-red-50 text-red-700 border-red-100";
            default: return "bg-gray-50 text-gray-700 border-gray-100";
        }
    };

    if (hostelsloading) return (
        <div className="flex h-screen items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="h-20 w-20 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin" />
                    <Building2 className="h-8 w-8 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <div className="text-center">
                    <p className="text-xl font-bold text-gray-900 tracking-tight">Loading Hostels...</p>
                    <p className="text-sm text-gray-500 font-medium mt-1">Getting your records...</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Slim Premium Header */}
            <div className="bg-white border-b sticky top-0 z-40 h-16">
                <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-1 bg-blue-600 rounded-full" />
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight">All Hostels</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Settings</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Active</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-8 mr-4">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</span>
                                <span className="text-sm font-bold text-emerald-600 uppercase">System OK</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</span>
                                <span className="text-sm font-bold text-gray-900">{hostelsToDisplay.length} Hostels</span>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-gray-100 h-9 w-9"
                            onClick={handleRefresh}
                            disabled={isFetchingHostels}
                        >
                            <RefreshCw className={`h-4 w-4 text-gray-500 ${isFetchingHostels ? 'animate-spin' : ''}`} />
                        </Button>
                        <Link href="/admin/hostels/createhostel?role=admin">
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 rounded-xl font-bold text-[11px] uppercase tracking-wider shadow-sm gap-2">
                                <Plus className="h-4 w-4" />
                                Add Hostel
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
                {/* Statistics Overview */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Buildings', value: hostelsToDisplay.length, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Total BEDS', value: hostelsToDisplay.reduce((t, h) => t + h.rooms.length, 0), icon: Bed, color: 'text-purple-600', bg: 'bg-purple-50' },
                        { label: 'Available', value: hostelsToDisplay.reduce((t, h) => t + h.roomStats.availableRooms, 0), icon: DoorOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Occupied', value: `${Math.round((hostelsToDisplay.reduce((t, h) => t + h.roomStats.occupiedRooms, 0) / hostelsToDisplay.reduce((t, h) => t + h.rooms.length, 1)) * 100)}%`, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
                    ].map((s, i) => (
                        <Card key={i} className="border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] bg-white">
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${s.bg} ${s.color}`}>
                                    <s.icon className="h-6 w-6" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{s.label}</span>
                                    <span className="text-xl font-bold text-gray-900 tracking-tight">{s.value}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Search & Filter */}
                <div className="bg-white border border-gray-100 p-2 rounded-2xl flex flex-col md:flex-row gap-4 items-center shadow-sm">
                    <div className="relative flex-1 group w-full px-2">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            className="w-full bg-transparent border-none shadow-none h-12 pl-10 text-sm font-bold text-gray-900 placeholder:text-gray-300 focus-visible:ring-0"
                            placeholder="Search by name, city or type..."
                            value={searchterm}
                            onChange={(e) => setsearchterm(e.target.value)}
                        />
                    </div>
                    <div className="h-8 w-px bg-gray-100 mx-2 hidden md:block" />
                    <div className="flex items-center gap-1.5 p-1 bg-gray-50 rounded-xl w-full md:w-auto">
                        {['All', 'Boys', 'Girls'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${filterType === type ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Hostel List */}
                <div className="space-y-4">
                    {matchedData.length > 0 ? (
                        matchedData.map((hostel, index) => (
                            <Link key={hostel.id || index} className='hover:bg-gray-100 block' href={`/admin/hostels/${hostel.id}`}>
                                <div className="flex flex-col w-full relative">
                                    {/* Hostel Item Content */}
                                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 p-5 pr-6">
                                        {/* Status Indicator */}
                                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl ${hostel.type === 'BOYS' ? 'bg-blue-600 shadow-[2px_0_10px_rgba(37,99,235,0.2)]' : 'bg-pink-500 shadow-[2px_0_10px_rgba(236,72,153,0.2)]'}`} />

                                        {/* Hostel Info */}
                                        <div
                                            className="flex items-center gap-5 min-w-[280px] cursor-pointer group/node"
                                            onClick={() => router.push(`/admin/hostels/${hostel.id}`)}
                                        >
                                            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm transition-all group-hover/node:bg-black group-hover/node:text-white ${hostel.type === 'BOYS' ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-pink-50 border-pink-100 text-pink-600'}`}>
                                                <Building2 className="h-7 w-7" />
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-base font-bold text-gray-900 tracking-tight group-hover/node:text-black transition-colors uppercase">{hostel.name}</h3>
                                                    <Badge variant="outline" className={`${getStatusTheme(hostel.status)} text-[8px] font-bold px-2 py-0 rounded-full border-px`}>
                                                        {hostel.status}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{hostel.location.city} • {hostel.type}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Occupancy Status */}
                                        <div className="flex-1 w-full max-w-sm lg:max-w-md hidden md:block px-4">
                                            <div className="flex justify-between items-end mb-1.5">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Occupancy</span>
                                                <span className="text-xs font-bold text-gray-900">{Math.round((hostel.roomStats.occupiedRooms / hostel.roomStats.totalRooms) * 100 || 0)}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                                <div
                                                    className={`h-full transition-all duration-1000 ${hostel.type === 'BOYS' ? 'bg-blue-600' : 'bg-pink-500'}`}
                                                    style={{ width: `${(hostel.roomStats.occupiedRooms / hostel.roomStats.totalRooms) * 100 || 0}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Management Info */}
                                        <div className="flex items-center gap-10 min-w-[220px]">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Managers</span>
                                                <div className="text-[11px] font-bold text-gray-700 truncate max-w-[120px]">
                                                    <WardenNames wardenIds={hostel.basicInfo.wardens} />
                                                </div>
                                            </div>
                                            <div className="flex flex-col text-right">
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Link</span>
                                                <Button
                                                    variant="ghost"
                                                    className="h-6 p-0 hover:bg-transparent text-emerald-600 text-[9px] font-black uppercase tracking-widest"
                                                    onClick={() => router.push(`/admin/hostels/${hostel.id}`)}
                                                >
                                                    View Details →
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-3 lg:ml-auto">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-gray-100 text-gray-400 transition-all">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl border-gray-100 shadow-xl">
                                                    <DropdownMenuItem className="p-3 gap-3 rounded-lg font-bold text-[11px] uppercase tracking-wider text-gray-600 cursor-pointer" onClick={() => router.push(`/admin/hostels/${hostel.id}`)}>
                                                        <LayoutGrid className="h-3.5 w-3.5" /> View Hostel
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="p-3 gap-3 rounded-lg font-bold text-[11px] uppercase tracking-wider text-gray-600 cursor-pointer" onClick={() => router.push(`/admin/hostels/${encodeURIComponent(hostel.name)}/edithostel?hostelId=${hostel.id}`)}>
                                                        <Edit className="h-3.5 w-3.5" /> Edit Hostel
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="p-3 gap-3 rounded-lg font-bold text-[11px] uppercase tracking-wider text-gray-600 cursor-pointer" onClick={() => router.push(`/admin/hostels/${encodeURIComponent(hostel.name)}/residents?hostelId=${hostel.id}`)}>
                                                        <Users className="h-3.5 w-3.5" /> View Residents
                                                    </DropdownMenuItem>
                                                    <div className="h-px bg-gray-50 my-1 mx-2" />
                                                    <DropdownMenuItem className="p-3 gap-3 rounded-lg font-bold text-[11px] uppercase tracking-wider text-red-500 focus:bg-red-50 focus:text-red-600 cursor-pointer" onSelect={(e) => e.preventDefault()}>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger className="w-full text-left flex items-center gap-3">
                                                                <Trash className="h-3.5 w-3.5" /> Delete Hostel
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent className="rounded-3xl border-none shadow-2xl overflow-hidden p-0 max-w-lg">
                                                                <div className="bg-red-600 p-10 text-white relative">
                                                                    <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center mb-6"><Trash size={24} /></div>
                                                                    <AlertDialogTitle className="text-2xl font-bold tracking-tight mb-2">Delete Hostel?</AlertDialogTitle>
                                                                    <AlertDialogDescription className="text-red-100 font-medium">
                                                                        Deleting <span className="text-white font-bold">{hostel.name}</span> will remove all rooms and resident records permanently. This action cannot be undone.
                                                                    </AlertDialogDescription>
                                                                </div>
                                                                <div className="p-8 flex items-center justify-end gap-3 bg-white">
                                                                    <AlertDialogCancel className="rounded-xl border-none bg-gray-100 font-bold px-6 h-11 uppercase tracking-wider text-[10px] text-gray-500">Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction className="bg-red-600 hover:bg-red-700 rounded-xl font-bold px-6 h-11 uppercase tracking-wider text-[10px] transition-all shadow-sm" onClick={() => handledelecthostel(hostel.id)}>Yes, Delete</AlertDialogAction>
                                                                </div>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <Button
                                                size="sm"
                                                className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-wider text-[10px] shadow-sm flex items-center gap-2 group/btn"
                                                onClick={() => router.push(`/admin/hostels/${encodeURIComponent(hostel.name)}/rooms?role=admin&hostelId=${hostel.id}`)}
                                            >
                                                View Rooms
                                                <ChevronRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Room Preview */}
                                    <div className="bg-gray-50/50 border-t border-gray-100 px-6 py-3.5 flex items-center gap-6">
                                        <div className="flex items-center gap-2">
                                            <LayoutGrid className="h-3 w-3 text-gray-400" />
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Rooms</span>
                                        </div>
                                        <div className="h-4 w-px bg-gray-200" />
                                        <div className="flex flex-wrap gap-2.5">
                                            {hostel.rooms.slice(0, 5).map((room) => (
                                                <div
                                                    key={room.id}
                                                    className="group/tag flex items-center gap-2 bg-white border border-gray-100 px-3 py-1.5 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/admin/hostels/${encodeURIComponent(hostel.name)}/room-details/room/${room.id}?hostelId=${hostel.id}`);
                                                    }}
                                                >
                                                    <div className={`h-1.5 w-1.5 rounded-full ${room.status === 'AVAILABLE' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                                    <span className="text-[10px] font-bold text-gray-900 uppercase">Room {room.roomNumber}</span>
                                                    <span className="text-[8px] font-bold text-gray-300 group-hover/tag:text-blue-500 transition-colors">→</span>
                                                </div>
                                            ))}
                                            {hostel.rooms.length > 5 && (
                                                <div className="flex items-center px-3 py-1.5 rounded-lg bg-gray-200/30 border border-dashed border-gray-200">
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase">{hostel.rooms.length - 5} more rooms</span>
                                                </div>
                                            )}
                                            {hostel.rooms.length === 0 && (
                                                <span className="text-[10px] font-bold text-gray-300 italic uppercase tracking-widest">No rooms added yet</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="py-24 flex flex-col items-center justify-center bg-white border border-gray-100 rounded-2xl shadow-sm border-dashed">
                            <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-6 border border-gray-100">
                                <Search className="h-8 w-8 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 lg:tracking-tight uppercase">No Results</h3>
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1">No hostels match your search</p>
                            <Button
                                variant="outline"
                                className="mt-8 rounded-xl border-gray-200 uppercase tracking-widest text-[10px] font-bold h-10 px-8 hover:bg-blue-600 hover:text-white transition-all"
                                onClick={() => { setsearchterm(''); setFilterType('All'); }}
                            >
                                Clear Filters
                            </Button>
                        </div>
                    )}
                </div>


            </main>
        </div>
    );
};

export default HostelsPage;