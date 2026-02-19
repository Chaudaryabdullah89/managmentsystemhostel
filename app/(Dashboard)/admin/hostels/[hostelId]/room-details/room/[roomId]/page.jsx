"use client"
import React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    ChevronLeft,
    Edit,
    Trash,
    UserPlus,
    Users,
    BedDouble,
    DoorOpen,
    Wrench,
    Calendar,
    Clock,
    ChevronRight,
    CheckCircle2,
    Sparkle,
    LayoutGrid,
    MoreVertical,
    Shirt,
    ShieldCheck,
    Coins,
    Building2,
    Info,
    Plus,
    UserIcon,
    ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useSingleRoomByHostelId } from "@/hooks/useRoom";
import { format } from "date-fns";

const RoomDetailsPage = () => {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { hostelId: pathHostelId, roomId } = params;
    const searchHostelId = searchParams.get('hostelId');
    const hostelId = searchHostelId || pathHostelId;

    const { data: roomResponse, isLoading } = useSingleRoomByHostelId(hostelId, roomId);
    const room = roomResponse?.data;

    if (isLoading) return (
        <div className="flex h-screen items-center justify-center bg-white font-sans">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="h-20 w-20 border-[3px] border-gray-100 border-t-black rounded-full animate-spin" />
                    <BedDouble className="h-8 w-8 text-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center">
                    <p className="text-lg font-bold text-gray-900 tracking-tight">Loading Room Details...</p>
                    <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-widest">Getting room and resident information</p>
                </div>
            </div>
        </div>
    );

    if (!room) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
            <div className="text-center space-y-4">
                <Info className="h-10 w-10 text-gray-300 mx-auto" />
                <h2 className="text-xl font-bold text-gray-900 uppercase">Room Not Found</h2>
                <Button onClick={() => router.back()} variant="outline" className="rounded-xl">Go Back</Button>
            </div>
        </div>
    );

    const getStatusTheme = (status) => {
        switch (status) {
            case "AVAILABLE": return "bg-emerald-50 text-emerald-700 border-emerald-100";
            case "OCCUPIED": return "bg-blue-50 text-blue-700 border-blue-100";
            case "MAINTENANCE": return "bg-amber-50 text-amber-700 border-amber-100";
            default: return "bg-gray-50 text-gray-700 border-gray-100";
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans">
            {/* Minimal Premium Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100 h-9 w-9" onClick={() => router.back()}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="h-6 w-px bg-gray-200" />
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight">Room {room.roomNumber}</h1>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="h-1 w-1 rounded-full bg-blue-500 animate-pulse" />
                                {room.Hostel?.name} • {room.type}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className={`${getStatusTheme(room.status)} px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border shadow-sm`}>
                            {room.status}
                        </Badge>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9">
                                    <MoreVertical className="h-4 w-4 text-gray-400" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 p-1 rounded-xl border-gray-100 shadow-xl">
                                <DropdownMenuItem className="p-2.5 gap-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider text-gray-600 cursor-pointer" onClick={() => router.push(`/admin/hostels/${hostelId}/room-details/room/${roomId}/edit-room`)}>
                                    <Edit className="h-3.5 w-3.5" /> Edit Room
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="p-2.5 gap-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider text-rose-500 focus:bg-rose-50 focus:text-rose-600 cursor-pointer">
                                    <Trash className="h-3.5 w-3.5" /> Delete Room
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button className="h-9 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all active:scale-95" onClick={() => router.push(`/admin/hostels/${hostelId}/room-details/room/${roomId}/add-guest`)}>
                            <Plus className="h-3.5 w-3.5 mr-2" />
                            Book Room
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
                {/* Minimal Metrics Matrix */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Occupancy', value: `${room.currentGuests?.length || 0}/${room.capacity}`, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Daily Rate', value: `Rs. ${room.pricepernight}`, icon: Coins, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Unit Floor', value: `Floor ${room.floor}`, icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50' },
                        { label: 'Compliance', value: 'Verified', icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-50' }
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Occupants & Specs */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Occupant Identity Feed */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                                        <Users className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-gray-900 uppercase">Residents</h2>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Residents currently in this room</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-gray-100 text-gray-400">
                                    {room.currentGuests?.length || 0} Residents
                                </Badge>
                            </div>

                            <div className="space-y-3">
                                {room.currentGuests?.length > 0 ? (
                                    room.currentGuests.map((guest) => (
                                        <div key={guest.bookingId} className="bg-gray-50/50 border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-white hover:shadow-md transition-all group relative overflow-hidden">
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${guest.rentStatus === 'Paid' ? 'bg-emerald-500' : 'bg-amber-500'} opacity-70`} />
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center border border-gray-100 text-gray-400 group-hover:bg-black group-hover:text-white transition-colors">
                                                    <UserIcon className="h-5 w-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-tight truncate">{guest.name}</h4>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{guest.contact}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-10">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Check In</span>
                                                    <span className="text-[11px] font-bold text-gray-700">{guest.checkInDate}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Payment</span>
                                                    <Badge variant="outline" className={`mt-0.5 h-5 text-[8px] font-bold px-2 py-0 border-px ${guest.rentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                                        {guest.rentStatus}
                                                    </Badge>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                                    onClick={() => router.push(`/admin/users-records/${guest.id}`)}
                                                >
                                                    <ArrowUpRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-12 flex flex-col items-center justify-center border border-dashed border-gray-100 rounded-xl">
                                        <Users className="h-8 w-8 text-gray-100 mb-3" />
                                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Room is currently empty</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Specs & Amenities */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
                                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Info className="h-3.5 w-3.5 text-gray-400" />
                                    Room Details
                                </h3>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Monthly Rent', value: `Rs. ${room.monthlyrent}`, icon: Coins },
                                        { label: 'Room Type', value: room.type, icon: BedDouble },
                                        { label: 'Capacity', value: `${room.capacity} BEDS`, icon: Users }
                                    ].map((spec, i) => (
                                        <div key={i} className="flex justify-between items-center bg-gray-50/50 p-3.5 rounded-xl border border-gray-100">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{spec.label}</span>
                                            <span className="text-xs font-bold text-gray-900 italic">{spec.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
                                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Sparkle className="h-3.5 w-3.5 text-blue-400" />
                                    Amenities
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {room.amenities?.length > 0 ? (
                                        room.amenities.map((a, i) => (
                                            <Badge key={i} variant="outline" className="bg-gray-50/50 border-gray-100 text-gray-600 text-[9px] font-bold uppercase tracking-tight px-3 h-8 rounded-lg shadow-sm">
                                                {a}
                                            </Badge>
                                        ))
                                    ) : (
                                        <p className="text-[10px] font-bold text-gray-300 italic uppercase tracking-widest">Standard Configuration</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Service Hub & Audit */}
                    <div className="space-y-6">
                        {/* Service Hub */}
                        <div className="space-y-3">
                            {[
                                { title: 'Maintenance', sub: `${room.maintanance?.length || 0} requests`, icon: Wrench, color: 'text-amber-500', bg: 'bg-amber-50', link: `/admin/hostels/${hostelId}/room-details/room/${roomId}/maintenance` },
                                { title: 'Laundry', sub: `${room.LaundryLog?.length || 0} items`, icon: Shirt, color: 'text-purple-500', bg: 'bg-purple-50', link: `/admin/hostels/${hostelId}/room-details/room/${roomId}/laundry` },
                                { title: 'Cleaning', sub: `${room.CleaningLog?.length || 0} sessions`, icon: Sparkle, color: 'text-blue-500', bg: 'bg-blue-50', link: `/admin/hostels/${hostelId}/room-details/room/${roomId}/cleaning` }
                            ].map((service, i) => (
                                <div
                                    key={i}
                                    className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between cursor-pointer group hover:border-black/10 hover:shadow-md transition-all relative overflow-hidden"
                                    onClick={() => router.push(service.link)}
                                >
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${service.color.replace('text-', 'bg-')}`} />
                                    <div className="flex items-center gap-4">
                                        <div className={`h-10 w-10 rounded-xl ${service.bg} flex items-center justify-center border border-transparent group-hover:scale-110 transition-transform`}>
                                            <service.icon className={`h-5 w-5 ${service.color}`} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 group-hover:text-black transition-colors">{service.title}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{service.sub}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-gray-200 group-hover:text-black transition-colors" />
                                </div>
                            ))}
                        </div>

                        {/* Lifecycle Persistence */}
                        <div className="bg-blue-600 text-white rounded-2xl p-6 relative overflow-hidden shadow-xl">
                            <div className="absolute top-0 right-0 p-6 opacity-5">
                                <ShieldCheck className="h-20 w-20 text-white" />
                            </div>
                            <h3 className="text-[10px] font-bold text-blue-100 uppercase tracking-[0.2em] mb-6">Room Info</h3>
                            <div className="space-y-5">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-blue-100 uppercase tracking-widest">Created</span>
                                    <span className="text-[11px] font-bold text-white mt-1 uppercase italic">{format(new Date(room.createdAt), 'MMM dd, yyyy')}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-blue-100 uppercase tracking-widest">Last Updated</span>
                                    <span className="text-[11px] font-bold text-white/80 mt-1 uppercase italic">{format(new Date(room.updatedAt), 'HH:mm • MMM dd')}</span>
                                </div>
                                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-[8px] font-black text-blue-100 uppercase tracking-widest">System verified</span>
                                    <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


            </main>
        </div>
    );
};

export default RoomDetailsPage;
