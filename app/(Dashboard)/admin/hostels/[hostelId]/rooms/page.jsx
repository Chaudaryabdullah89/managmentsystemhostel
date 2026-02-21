"use client"
import React, { useState, useEffect, use, Suspense } from 'react'
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useSearchParams, useRouter } from 'next/navigation'
import {
    RefreshCw,
    ChevronLeft,
    Plus,
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
    Navigation,
    Globe,
    Phone,
    Info,
    Layers,
    Users,
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
import { useRoomByHostelId } from "@/hooks/useRoom"
import { useHostelById } from "@/hooks/usehostel"
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

const RoomsContent = ({ params: paramsPromise }) => {
    const params = use(paramsPromise);
    const searchParams = useSearchParams()
    const router = useRouter()
    const queryClient = useQueryClient()
    const role = searchParams.get('role') || 'admin'
    const hostelId = searchParams.get('hostelId');

    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('All')
    const [typeFilter, setTypeFilter] = useState('All')
    const [isDeleting, setIsDeleting] = useState(null)

    const { data: hostel, isLoading: hostelLoading } = useHostelById(hostelId);
    const { data: roomsResponse, isLoading: roomsLoading, isFetching: isFetchingRooms } = useRoomByHostelId(hostelId);
    const syncAutomation = useSyncAutomation();

    useEffect(() => {
        syncAutomation.mutate();
    }, []);

    const rooms = roomsResponse?.data || [];

    const filteredRooms = rooms.filter(room => {
        const matchesSearch = room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All' || room.status === statusFilter.toUpperCase();
        const matchesType = typeFilter === 'All' || room.type === typeFilter.toUpperCase();
        return matchesSearch && matchesStatus && matchesType;
    });

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: QueryKeys.Roombyhostelid(hostelId) });
        queryClient.invalidateQueries({ queryKey: [...QueryKeys.hostellist(), hostelId] });
        toast.success("Refreshed");
    };

    const handleDeleteRoom = async (roomId) => {
        setIsDeleting(roomId);
        try {
            const response = await fetch(`/api/rooms/deleteroom?roomId=${roomId}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (data.success) {
                toast.success("Unit Decommissioned");
                queryClient.invalidateQueries({ queryKey: QueryKeys.Roombyhostelid(hostelId) });
            } else {
                toast.error(data.error || "Failed to decommission unit");
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
    };

    if (roomsLoading || hostelLoading) return <Loader label="Accessing Registry" subLabel={`Retrieving Unit Registry for ${hostel?.name || 'Asset'}`} icon={Building2} />;

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans">
            {/* Minimal Premium Header */}
            <div className="bg-white border-b sticky top-0 z-50 py-2 md:h-16">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-full flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                    <div className="flex items-center gap-3 md:gap-4">
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100 h-9 w-9 shrink-0" onClick={() => router.back()}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="h-6 w-px bg-gray-200 shrink-0" />
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-sm md:text-lg font-bold text-gray-900 tracking-tight truncate">{hostel?.name || 'Property Registry'}</h1>
                            <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 md:gap-2">
                                <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="truncate">INVENTORY LEDGER • UNIT DATA ACTIVE</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl hover:bg-gray-100 h-9 w-9 shrink-0"
                            onClick={handleRefresh}
                            disabled={isFetchingRooms}
                        >
                            <RefreshCw className={`h-4 w-4 text-gray-400 ${isFetchingRooms ? 'animate-spin' : ''}`} />
                        </Button>
                        <Link href={`/admin/hostels/createroom?role=${role}&hostelId=${hostelId}`}>
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-4 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest shadow-sm flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap">
                                <Plus className="h-3.5 w-3.5" />
                                Provisional Code
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
                {/* Minimal Metrics Matrix */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 px-1 md:px-0">
                    {[
                        { label: 'Units', value: rooms.length, icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { label: 'Network Coverage', value: rooms.reduce((acc, r) => acc + r.capacity, 0), icon: Bed, color: 'text-purple-600', bg: 'bg-purple-50' },
                        { label: 'Capital Logic', value: `PKR ${rooms.reduce((acc, r) => acc + (r.monthlyrent || 0), 0).toLocaleString()}`, icon: Coins, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Security Node', value: 'Shielded', icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row items-center sm:items-center gap-2 md:gap-4 shadow-sm hover:shadow-md transition-all group text-center sm:text-left">
                            <div className={`h-10 w-10 md:h-11 md:w-11 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform shrink-0`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">{stat.label}</span>
                                <span className="text-sm md:text-xl font-black text-gray-900 tracking-tight uppercase truncate">{stat.value}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Operations Bar */}
                <div className="bg-white border border-gray-100 rounded-2xl p-2 flex flex-col sm:flex-row items-center gap-4 shadow-sm">
                    <div className="flex-1 relative w-full group px-2 min-w-0">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                        <Input
                            placeholder="Search unit identifiers or registry tags..."
                            className="w-full h-12 pl-10 bg-transparent border-none shadow-none font-black text-[11px] md:text-sm focus-visible:ring-0 placeholder:text-gray-300 min-w-0"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="hidden sm:block h-8 w-px bg-gray-100" />

                    <div className="flex items-center gap-1.5 p-1 bg-gray-50 rounded-xl w-full sm:w-auto overflow-x-auto scrollbar-hide">
                        {['All', 'Available', 'Occupied', 'Maintenance'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`flex-1 sm:flex-none whitespace-nowrap px-4 md:px-6 py-2 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === s ? 'bg-white text-indigo-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Minimal Ribbon Feed */}
                <div className="space-y-3">
                    {filteredRooms.length > 0 ? (
                        filteredRooms.map((room, index) => (
                            <div key={room.id || index} className="bg-white border border-gray-100 rounded-2xl flex flex-col items-stretch shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${room.status === 'AVAILABLE' ? 'bg-emerald-500' : room.status === 'OCCUPIED' ? 'bg-blue-600' : 'bg-amber-500'} opacity-70`} />

                                <div className="flex flex-col lg:flex-row items-stretch lg:items-center p-5 md:p-6 gap-6 md:gap-8">
                                    {/* Section 1: Visual Identity */}
                                    <div className="flex items-center gap-5 min-w-0 flex-1 lg:flex-none lg:min-w-[280px]">
                                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border border-gray-100 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 ${room.status === 'AVAILABLE' ? 'bg-emerald-50/50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                            <BedDouble className="h-6 w-6" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-sm md:text-base font-black text-gray-900 uppercase tracking-tight truncate">UNIT_{room.roomNumber}</h3>
                                                <Badge variant="outline" className={`${getStatusTheme(room.status)} text-[8px] font-black px-2 py-0.5 rounded-full border shadow-sm shrink-0 whitespace-nowrap`}>
                                                    {room.status}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <Layers className="h-3 w-3 text-gray-400" />
                                                <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">DECK {room.floor} • {room.type} TYPE</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 2: Infrastructure */}
                                    <div className="flex items-center gap-8 min-w-0 lg:min-w-[160px] border-t border-gray-50 pt-4 lg:pt-0 lg:border-t-0">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Logic Class</span>
                                            <span className="text-[10px] font-black text-gray-700 uppercase">{room.type} SEATER</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Load Limit</span>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <Users className="h-3 w-3 text-gray-400" />
                                                <span className="text-[10px] font-black text-gray-900 uppercase">{room.capacity} BEDS</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 3: Current Occupancy */}
                                    <div className="flex-1 flex flex-col lg:flex-row lg:items-center gap-4 min-w-0 lg:min-w-[200px] border-t border-gray-50 lg:border-t-0 pt-4 lg:pt-0">
                                        <div className="h-4 w-px bg-gray-100 hidden lg:block" />
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                                <UserCircle2 className="h-3 w-3" />
                                                Registry Nodes
                                            </span>
                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                {room.Booking?.length > 0 ? (
                                                    room.Booking.map((b) => (
                                                        <Badge key={b.id} variant="secondary" className="bg-gray-100 text-gray-700 border-none text-[8px] md:text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-tighter">
                                                            {b.User?.name}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-[9px] md:text-[10px] font-black text-gray-300 italic uppercase">Vacant Block</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 4: Commercial */}
                                    <div className="flex items-center gap-8 md:gap-10 min-w-0 lg:min-w-[200px] border-t border-gray-50 lg:border-t-0 pt-4 lg:pt-0">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Asset Value</span>
                                            <span className="text-[11px] font-black text-gray-900 italic tracking-tight">PKR {room.price?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Yield Curve</span>
                                            <span className="text-[11px] font-black text-indigo-600 italic">PKR {room.monthlyrent?.toLocaleString()}/MO</span>
                                        </div>
                                    </div>

                                    {/* Section 5: Operational */}
                                    <div className="flex items-center gap-2 lg:ml-auto border-t border-gray-50 lg:border-t-0 pt-4 lg:pt-0 justify-between sm:justify-end">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10 rounded-xl hover:bg-gray-100 text-gray-400 transition-all">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 p-1 rounded-xl border-gray-100 shadow-xl">
                                                <DropdownMenuItem className="p-2.5 gap-2.5 rounded-lg font-black text-[10px] uppercase tracking-wider text-gray-600 cursor-pointer" onClick={() => router.push(`/admin/hostels/${hostelId}/room-details/room/${room.id}/edit-room?hostelId=${hostelId}`)}>
                                                    <Edit className="h-3.5 w-3.5" /> Registry Update
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="p-2.5 gap-2.5 rounded-lg font-black text-[10px] uppercase tracking-wider text-gray-600 cursor-pointer" onClick={() => router.push(`/admin/hostels/${hostelId}/room-details/room/${room.id}/maintenance`)}>
                                                    <Wrench className="h-3.5 w-3.5" /> Maintenance Flow
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="p-2.5 gap-2.5 rounded-lg font-black text-[10px] uppercase tracking-wider text-rose-500 focus:bg-rose-50 focus:text-rose-600 cursor-pointer" onSelect={(e) => e.preventDefault()}>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger className="w-full text-left flex items-center gap-2.5">
                                                            <Trash className="h-3.5 w-3.5" /> Purge Registry
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent className="rounded-3xl border-0 shadow-2xl overflow-hidden p-0 max-w-lg mx-4 sm:mx-0">
                                                            <div className="bg-gray-950 p-8 text-white relative">
                                                                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center mb-4"><Trash size={20} className="text-rose-500" /></div>
                                                                <AlertDialogTitle className="text-xl font-black tracking-tight mb-2 uppercase">Purge Unit Node?</AlertDialogTitle>
                                                                <AlertDialogDescription className="text-gray-400 font-black text-[10px] uppercase tracking-widest">
                                                                    Wiping <span className="text-white font-black">UNIT_{room.roomNumber}</span> from memory. All sub-data will be archived. Permanent protocol.
                                                                </AlertDialogDescription>
                                                            </div>
                                                            <div className="p-6 flex items-center justify-end gap-3 bg-white">
                                                                <AlertDialogCancel className="rounded-xl border-gray-100 bg-gray-50 font-black px-6 h-11 uppercase tracking-widest text-[9px] text-gray-500">Abort</AlertDialogCancel>
                                                                <AlertDialogAction className="bg-rose-600 hover:bg-rose-700 rounded-xl font-black px-6 h-11 uppercase tracking-widest text-[9px] shadow-sm" onClick={() => handleDeleteRoom(room.id)}>Execute</AlertDialogAction>
                                                            </div>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <Button
                                            size="sm"
                                            className="h-10 md:h-11 px-4 md:px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[9px] md:text-[10px] shadow-sm flex items-center gap-2 group/btn active:scale-95 transition-all whitespace-nowrap"
                                            onClick={() => router.push(`/admin/hostels/${encodeURIComponent(hostel?.name || params.hostelId)}/room-details/room/${room.id}?role=${role}&hostelId=${hostelId}`)}
                                        >
                                            Access Node
                                            <ChevronRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Service Shelf */}
                                <div className="bg-gray-50/30 border-t border-gray-100 px-5 md:px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Sparkle className="h-3 w-3 text-indigo-400" />
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Deployment Package</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {(room.amenities || []).slice(0, 6).map((amenity, i) => (
                                            <span key={i} className="text-[9px] font-black text-gray-600 uppercase tracking-tighter bg-white border border-gray-100 px-2.5 py-1 rounded-md shadow-sm">
                                                {amenity}
                                            </span>
                                        ))}
                                        {(!room.amenities || room.amenities.length === 0) && (
                                            <span className="text-[9px] font-black text-gray-300 italic uppercase tracking-widest">Standard Spec Node</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-20 flex flex-col items-center justify-center bg-white border border-gray-100 rounded-3xl shadow-sm border-dashed mx-4">
                            <Layers className="h-10 w-10 text-gray-200 mb-4 animate-pulse" />
                            <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">Registry Void</h3>
                            <p className="text-gray-400 font-black uppercase tracking-widest text-[9px] mt-1">No unit nodes active for current filter</p>
                            <Button
                                variant="outline"
                                className="mt-8 rounded-xl border-gray-100 uppercase tracking-widest text-[9px] font-black h-11 px-8 hover:bg-gray-50 transition-all text-gray-400 hover:text-indigo-600 shadow-sm"
                                onClick={() => { setSearchQuery(''); setStatusFilter('All'); }}
                            >
                                Re-sync Registry
                            </Button>
                        </div>
                    )}
                </div>


            </main>
        </div>
    );
};

export default function RoomsPage(props) {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center bg-white font-sans">
                <div className="flex flex-col items-center gap-6">
                    <div className="h-20 w-20 border-[3px] border-gray-100 border-t-black rounded-full animate-spin" />
                    <p className="text-lg font-bold text-gray-900 tracking-tight">Accessing Property Registry...</p>
                </div>
            </div>
        }>
            <RoomsContent {...props} />
        </Suspense>
    );
}
