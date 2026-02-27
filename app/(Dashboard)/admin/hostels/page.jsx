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
    Download,
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
import Loader from "../../../../components/ui/Loader";

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

    if (hostelsloading) return <Loader label="Loading" subLabel="Updates..." icon={Building2} fullScreen={false} />;

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="bg-white border-b sticky top-0 z-40 py-2 md:h-16">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-full flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="h-8 w-1 bg-blue-600 rounded-full shrink-0" />
                        <div className="flex flex-col">
                            <h1 className="text-sm md:text-lg font-bold text-gray-900 tracking-tight uppercase">Hostels</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-gray-400">Stats</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-emerald-600">Active</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4">
                        <div className="hidden lg:flex items-center gap-8 mr-4">
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Status</span>
                                <span className="text-sm font-bold text-emerald-600 uppercase tracking-tighter">Active</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Total</span>
                                <span className="text-sm font-bold text-gray-900 tracking-tighter">{hostelsToDisplay.length} Total</span>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl hover:bg-gray-100 h-9 w-9 shrink-0"
                            onClick={handleRefresh}
                            disabled={isFetchingHostels}
                        >
                            <RefreshCw className={`h-4 w-4 text-gray-500 ${isFetchingHostels ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-9 px-4 rounded-xl border-gray-200 font-bold text-[9px] md:text-[10px] uppercase tracking-wider text-gray-600 hover:bg-gray-50 gap-2 shrink-0 hidden sm:flex"
                            onClick={() => {
                                if (!hostelsToDisplay || hostelsToDisplay.length === 0) {
                                    toast.error("Empty");
                                    return;
                                }
                                const headers = ["ID", "Name", "Type", "Status", "City", "Total Rooms", "Occupied", "Available"];
                                const rows = hostelsToDisplay.map(h => [
                                    h.id, h.name, h.type, h.status, h.location.city, h.roomStats.totalRooms, h.roomStats.occupiedRooms, h.roomStats.availableRooms
                                ]);
                                const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
                                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                const link = document.createElement("a");
                                link.href = URL.createObjectURL(blob);
                                link.setAttribute("download", `Branch_Registry_${new Date().toISOString().split('T')[0]}.csv`);
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                toast.success("Exported");
                            }}
                        >
                            <Download className="h-4 w-4" />
                            <span className="hidden md:inline">Export</span>
                        </Button>
                        <Link href="/admin/hostels/createhostel?role=admin">
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-4 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-wider shadow-sm gap-2 whitespace-nowrap">
                                <Plus className="h-4 w-4" />
                                <span>New</span>
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8 min-w-0">
                {/* Statistics Overview */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {[
                        { label: 'Total', value: hostelsToDisplay.length, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Capacity', value: hostelsToDisplay.reduce((t, h) => t + h.rooms.length, 0), icon: Bed, color: 'text-purple-600', bg: 'bg-purple-50' },
                        { label: 'Available', value: hostelsToDisplay.reduce((t, h) => t + h.roomStats.availableRooms, 0), icon: DoorOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Usage', value: `${Math.round((hostelsToDisplay.reduce((t, h) => t + h.roomStats.occupiedRooms, 0) / Math.max(hostelsToDisplay.reduce((t, h) => t + h.rooms.length, 1), 1)) * 100)}%`, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
                    ].map((s, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row items-center sm:items-center gap-2 md:gap-4 shadow-sm hover:shadow-md transition-all group text-center sm:text-left">
                            <div className={`h-10 w-10 md:h-11 md:w-11 rounded-xl ${s.bg} ${s.color} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform shrink-0`}>
                                <s.icon className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</span>
                                <span className="text-sm md:text-xl font-black text-gray-900 tracking-tight">{s.value}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Search & Filter */}
                <div className="bg-white border border-gray-100 p-2 rounded-2xl flex flex-col md:flex-row gap-4 items-center shadow-sm">
                    <div className="relative flex-1 group w-full px-2">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                        <Input
                            className="w-full bg-transparent border-none shadow-none h-11 md:h-12 pl-10 text-[11px] md:text-sm font-black text-gray-900 placeholder:text-gray-300 focus-visible:ring-0 uppercase tracking-tight"
                            placeholder="Search"
                            value={searchterm}
                            onChange={(e) => setsearchterm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-1.5 p-1 bg-gray-50 rounded-xl w-full md:w-auto overflow-x-auto scrollbar-hide shrink-0">
                        {['All', 'Boys', 'Girls'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-9px md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterType === type ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {type === 'All' ? 'All' : type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Hostel List */}
                <div className="space-y-4">
                    {matchedData.length > 0 ? (
                        matchedData.map((hostel, index) => (
                            <Link key={hostel.id || index} className='hover:bg-gray-100 block' href={`/admin/hostels/${hostel.id}`}>
                                <div className="flex flex-col w-full relative group">
                                    {/* Hostel Item Content */}
                                    <div className="flex flex-col xl:flex-row items-center gap-6 p-4 md:p-5">
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 md:w-1.5 rounded-l-2xl ${hostel.type === 'BOYS' ? 'bg-blue-600' : 'bg-pink-500'} opacity-80`} />

                                        {/* Branch Identifier */}
                                        <div className="flex items-center gap-4 md:gap-5 min-w-0 md:min-w-[300px] w-full xl:w-auto">
                                            <div className={`h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center shrink-0 border shadow-sm transition-all group-hover:bg-black group-hover:text-white ${hostel.type === 'BOYS' ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-pink-50 border-pink-100 text-pink-600'}`}>
                                                <Building2 className="h-5 w-5 md:h-6 md:w-6" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-sm md:text-base font-black text-gray-900 tracking-tight uppercase truncate">{hostel.name}</h3>
                                                    <Badge variant="outline" className={`${getStatusTheme(hostel.status)} text-[8px] font-black px-1.5 py-0 rounded-full border-px shrink-0`}>
                                                        {hostel.status}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <MapPin className="h-3 w-3 text-gray-400" />
                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest truncate">{hostel.location.city} • {hostel.type}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Performance Metrics */}
                                        <div className="flex-1 w-full max-w-none md:max-w-sm xl:max-w-md hidden md:block">
                                            <div className="flex justify-between items-end mb-1.5">
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Usage</span>
                                                <span className="text-xs font-black text-gray-900">{Math.round((hostel.roomStats.occupiedRooms / hostel.roomStats.totalRooms) * 100 || 0)}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                                <div
                                                    className={`h-full transition-all duration-1000 ${hostel.type === 'BOYS' ? 'bg-blue-600' : 'bg-pink-500'}`}
                                                    style={{ width: `${(hostel.roomStats.occupiedRooms / hostel.roomStats.totalRooms) * 100 || 0}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Custodial Info */}
                                        <div className="hidden lg:flex items-center gap-8 min-w-[200px]">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Staff</span>
                                                <div className="text-[10px] font-black text-gray-700 truncate max-w-[120px] uppercase">
                                                    <WardenNames wardenIds={hostel.basicInfo.wardens} />
                                                </div>
                                            </div>
                                            <div className="flex flex-col text-right">
                                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Rooms</span>
                                                <span className="text-[10px] font-black text-gray-700 uppercase">{hostel.roomStats.totalRooms} Rooms</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 md:gap-3 w-full xl:w-auto justify-end pt-3 xl:pt-0 border-t xl:border-none border-gray-50">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-gray-100 text-gray-400 hidden sm:flex shrink-0">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-52 p-1 rounded-xl border-gray-100 shadow-xl">
                                                    <DropdownMenuItem className="p-2 gap-3 rounded-lg font-black text-[9px] uppercase tracking-wider text-gray-600 cursor-pointer" onClick={() => router.push(`/admin/hostels/${hostel.id}`)}>
                                                        <LayoutGrid className="h-3.5 w-3.5" /> View
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="p-2 gap-3 rounded-lg font-black text-[9px] uppercase tracking-wider text-gray-600 cursor-pointer" onClick={() => router.push(`/admin/hostels/${encodeURIComponent(hostel.name)}/edithostel?hostelId=${hostel.id}`)}>
                                                        <Edit className="h-3.5 w-3.5" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="p-2 gap-3 rounded-lg font-black text-[9px] uppercase tracking-wider text-red-500 focus:bg-red-50 focus:text-red-600 cursor-pointer" onSelect={(e) => e.preventDefault()}>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger className="w-full text-left flex items-center gap-3">
                                                                <Trash className="h-3.5 w-3.5" /> Delete
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent className="rounded-[2.5rem] border-none shadow-3xl overflow-hidden p-0 max-w-md">
                                                                <div className="bg-rose-600 p-8 text-white relative">
                                                                    <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center mb-4"><Trash size={24} /></div>
                                                                    <AlertDialogTitle className="text-xl font-black uppercase tracking-tight mb-2 text-white">Delete?</AlertDialogTitle>
                                                                    <AlertDialogDescription className="text-rose-100 text-xs font-medium uppercase tracking-wider">
                                                                        All data will be lost for {hostel.name}.
                                                                    </AlertDialogDescription>
                                                                </div>
                                                                <div className="p-6 flex items-center justify-end gap-3 bg-white">
                                                                    <AlertDialogCancel className="rounded-xl border-none bg-gray-50 font-black px-6 h-10 uppercase tracking-widest text-[9px] text-gray-400">Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black px-6 h-10 uppercase tracking-widest text-[9px] transition-all" onClick={() => handledelecthostel(hostel.id)}>Confirm</AlertDialogAction>
                                                                </div>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <Button
                                                className="h-9 px-4 md:px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[9px] shadow-sm flex items-center gap-2 group/btn w-full sm:w-auto justify-center"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/admin/hostels/${encodeURIComponent(hostel.name)}/rooms?role=admin&hostelId=${hostel.id}`);
                                                }}
                                            >
                                                Open
                                                <ChevronRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Room Preview */}
                                    <div className="bg-gray-50/50 border-t border-gray-100 px-4 md:px-6 py-3 flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                                        <div className="flex items-center gap-2 shrink-0">
                                            <LayoutGrid className="h-3 w-3 text-gray-400" />
                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Rooms</span>
                                        </div>
                                        <div className="h-px md:h-4 w-full md:w-px bg-gray-200" />
                                        <div className="flex flex-wrap gap-2">
                                            {hostel.rooms.slice(0, 8).map((room) => (
                                                <div
                                                    key={room.id}
                                                    className="group/tag flex items-center gap-1.5 bg-white border border-gray-100 px-2 py-1 rounded-lg hover:border-indigo-300 transition-all cursor-pointer"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        router.push(`/admin/hostels/${encodeURIComponent(hostel.name)}/room-details/room/${room.id}?hostelId=${hostel.id}`);
                                                    }}
                                                >
                                                    <div className={`h-1.5 w-1.5 rounded-full ${room.status === 'AVAILABLE' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                                                    <span className="text-[9px] font-black text-gray-700 uppercase">{room.roomNumber}</span>
                                                </div>
                                            ))}
                                            {hostel.rooms.length > 8 && (
                                                <div className="flex items-center px-2 py-1 rounded-lg bg-gray-100 border border-dashed border-gray-200">
                                                    <span className="text-[8px] font-black text-gray-400 uppercase">+{hostel.rooms.length - 8}</span>
                                                </div>
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
                            <h3 className="text-lg font-bold text-gray-900 lg:tracking-tight uppercase">Empty</h3>
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1">Clear</p>
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