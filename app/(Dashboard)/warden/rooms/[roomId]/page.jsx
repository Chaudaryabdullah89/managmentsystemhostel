"use client"
import React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ChevronLeft,
    Users,
    BedDouble,
    DoorOpen,
    Wrench,
    Calendar,
    Clock,
    ChevronRight,
    Sparkle,
    Shirt,
    ShieldCheck,
    Coins,
    Building2,
    Info,
    User,
    ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useSingleRoomByHostelId } from "@/hooks/useRoom";
import useAuthStore from "@/hooks/Authstate";
import { format } from "date-fns";
import Loader from "@/components/ui/Loader";

const WardenRoomDetailsPage = () => {
    const params = useParams();
    const router = useRouter();
    const { roomId } = params;
    const { user } = useAuthStore();
    const hostelId = user?.hostelId;

    const { data: roomResponse, isLoading } = useSingleRoomByHostelId(hostelId, roomId);
    const room = roomResponse?.data;

    if (isLoading) return (
        <Loader
            label="Loading Room Details"
            subLabel="Fetching information..."
            icon={BedDouble}
            fullScreen={false}
        />
    );

    if (!room) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
            <div className="text-center space-y-4">
                <Info className="h-10 w-10 text-gray-300 mx-auto" />
                <h2 className="text-xl font-bold text-gray-900 uppercase">Room Not Found</h2>
                <Button onClick={() => router.back()} variant="outline" className="rounded-xl">Back to Rooms</Button>
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
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight tracking-widest">Room {room.roomNumber}</h1>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="h-1 w-1 rounded-full bg-indigo-500 animate-pulse" />
                                {room.Hostel?.name} • Warden Panel
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className={`${getStatusTheme(room.status)} px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border shadow-sm`}>
                            {room.status}
                        </Badge>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
                {/* Minimal Metrics Matrix */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Occupancy', value: `${room.currentGuests?.length || 0}/${room.capacity}`, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { label: 'Floor', value: `Level ${room.floor}`, icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50' },
                        { label: 'Room Type', value: room.type, icon: DoorOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Safety Check', value: 'Verified', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' }
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
                                    <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 text-indigo-600">
                                        <Users className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-gray-900 uppercase">Active Residents</h2>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current occupants in this room</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest border-gray-100 text-gray-400 px-3 py-1">
                                    {room.currentGuests?.length || 0} Occupants
                                </Badge>
                            </div>

                            <div className="space-y-3">
                                {room.currentGuests?.length > 0 ? (
                                    room.currentGuests.map((guest) => (
                                        <div key={guest.bookingId} className="bg-gray-50/50 border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-white hover:shadow-md transition-all group relative overflow-hidden">
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${guest.rentStatus === 'Paid' ? 'bg-emerald-500' : 'bg-amber-500'} opacity-70`} />
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center border border-gray-100 text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                    <User className="h-5 w-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-tight truncate">{guest.name}</h4>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{guest.contact || 'No Contact Info'}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-10">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Enrolled</span>
                                                    <span className="text-[11px] font-bold text-gray-700">{guest.checkInDate}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Payment</span>
                                                    <Badge variant="outline" className={`mt-0.5 h-5 text-[8px] font-bold px-2 py-0 border-px ${guest.rentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                                        {guest.rentStatus?.toUpperCase()}
                                                    </Badge>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                                                    onClick={() => router.push(`/warden/residents/${guest.id}`)}
                                                >
                                                    <ArrowUpRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-12 flex flex-col items-center justify-center border border-dashed border-gray-100 rounded-xl bg-gray-50/30">
                                        <Users className="h-8 w-8 text-gray-200 mb-3" />
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No residents in this room</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Specs & Configuration */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
                                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2 text-indigo-600">
                                    <Info className="h-3.5 w-3.5" />
                                    Room Details
                                </h3>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Monthly Rent', value: `PKR ${room.monthlyrent?.toLocaleString()}`, icon: Coins },
                                        { label: 'Room Type', value: room.type, icon: BedDouble },
                                        { label: 'Bed Capacity', value: `${room.capacity}`, icon: Users }
                                    ].map((spec, i) => (
                                        <div key={i} className="flex justify-between items-center bg-gray-50/30 p-4 rounded-xl border border-gray-100">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{spec.label}</span>
                                            <span className="text-xs font-bold text-gray-900 uppercase">{spec.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
                                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2 text-blue-500">
                                    <Sparkle className="h-3.5 w-3.5" />
                                    Amenities
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {room.amenities?.length > 0 ? (
                                        room.amenities.map((a, i) => (
                                            <Badge key={i} variant="outline" className="bg-blue-50/30 border-blue-100 text-blue-600 text-[9px] font-bold uppercase tracking-tight px-3 h-9 rounded-lg shadow-sm">
                                                {a}
                                            </Badge>
                                        ))
                                    ) : (
                                        <div className="w-full py-4 text-center">
                                            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest italic">No amenities listed</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Service Hub & Logs */}
                    <div className="space-y-6">
                        {/* Operational Services */}
                        <div className="space-y-3">
                            {[
                                { title: 'Maintenance', sub: `${room.maintanance?.length || 0} Records`, icon: Wrench, color: 'text-amber-500', bg: 'bg-amber-50', link: `/warden/complaints` },
                                { title: 'Laundry', sub: `${room.LaundryLog?.length || 0} Batches`, icon: Shirt, color: 'text-purple-500', bg: 'bg-purple-50', link: `/warden/laundry` },
                                { title: 'Cleaning', sub: `${room.CleaningLog?.length || 0} Cycles`, icon: Sparkle, color: 'text-blue-500', bg: 'bg-blue-50', link: `/warden/cleaning` }
                            ].map((service, i) => (
                                <Link
                                    key={i}
                                    href={service.link}
                                    className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center justify-between group hover:border-indigo-100 hover:shadow-md transition-all relative overflow-hidden"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`h-11 w-11 rounded-xl ${service.bg} flex items-center justify-center border border-transparent group-hover:scale-105 transition-transform`}>
                                            <service.icon className={`h-5 w-5 ${service.color}`} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{service.title}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{service.sub}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-gray-200 group-hover:text-indigo-600 transition-colors" />
                                </Link>
                            ))}
                        </div>

                        {/* Room Info Card */}
                        <div className="bg-indigo-900 text-white rounded-[2rem] p-8 relative overflow-hidden shadow-xl">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <ShieldCheck className="h-24 w-24 text-white" />
                            </div>
                            <h3 className="text-[10px] font-bold text-indigo-300 uppercase tracking-[0.3em] mb-8 border-b border-white/10 pb-4">Room Info</h3>
                            <div className="space-y-6">
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em]">Created On</span>
                                    <span className="text-[11px] font-bold text-white mt-1 uppercase tracking-widest italic">{format(new Date(room.createdAt), 'MMM dd, yyyy')}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em]">Last Updated</span>
                                    <span className="text-[11px] font-bold text-indigo-100 mt-1 uppercase tracking-widest italic">{format(new Date(room.updatedAt), 'HH:mm • MMM dd')}</span>
                                </div>
                                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Active</span>
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


            </main>
        </div>
    );
};

export default WardenRoomDetailsPage;
