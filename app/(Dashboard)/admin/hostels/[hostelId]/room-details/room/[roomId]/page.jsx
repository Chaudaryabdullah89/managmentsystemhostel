"use client"
import React, { Suspense } from "react";
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
    ArrowUpRight,
    Activity
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
import Loader from "@/components/ui/Loader";

const RoomDetailsContent = () => {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { hostelId: pathHostelId, roomId } = params;
    const searchHostelId = searchParams.get('hostelId');
    const hostelId = searchHostelId || pathHostelId;

    const { data: roomResponse, isLoading } = useSingleRoomByHostelId(hostelId, roomId);
    const room = roomResponse?.data;

    if (isLoading) return <Loader label="Accessing Suite Registry" subLabel={`Retrieving configuration for Unit_${room?.roomNumber || '...'}`} icon={BedDouble} />;

    if (!room) return (
        <div className="min-h-screen flex items-center justify-center bg-white font-sans">
            <div className="text-center space-y-6">
                <div className="h-20 w-20 rounded-[2rem] bg-gray-50 flex items-center justify-center mx-auto border border-gray-100 shadow-inner">
                    <Info className="h-10 w-10 text-gray-200" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">Node Not Found</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">The requested unit identifier is invalid or purged</p>
                </div>
                <Button onClick={() => router.back()} className="h-11 px-8 rounded-xl border-gray-100 bg-black text-white font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg">Restore Connection</Button>
            </div>
        </div>
    );

    const getStatusTheme = (status) => {
        switch (status) {
            case "AVAILABLE": return "bg-emerald-50 text-emerald-700 border-none";
            case "OCCUPIED": return "bg-indigo-50 text-indigo-700 border-none";
            case "MAINTENANCE": return "bg-amber-50 text-amber-700 border-none";
            default: return "bg-gray-50 text-gray-700 border-none";
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/30 pb-20 font-sans">
            {/* Minimal Premium Header */}
            <header className="bg-white border-b sticky top-0 z-40 py-2 md:h-16">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-full flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100 h-9 w-9 shrink-0" onClick={() => router.back()}>
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div className="h-6 w-px bg-gray-100 hidden md:block" />
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-sm md:text-lg font-black text-gray-900 leading-none truncate uppercase tracking-tight italic">Suite Node {room.roomNumber}</h1>
                            <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 truncate italic">
                                {room.Hostel?.name} • <span className="text-indigo-500">{room.type} MODULE</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`${getStatusTheme(room.status)} px-3 h-8 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest shadow-sm hidden sm:flex`}>
                            {room.status}
                        </Badge>
                        <div className="flex items-center gap-1.5 md:gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 hover:bg-gray-100 border-transparent">
                                        <MoreVertical className="h-4 w-4 text-gray-400" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-gray-100 shadow-2xl bg-white/95 backdrop-blur-xl">
                                    <DropdownMenuItem className="p-3 gap-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-gray-600 focus:bg-gray-50 cursor-pointer" onClick={() => router.push(`/admin/hostels/${hostelId}/room-details/room/${roomId}/edit-room?hostelId=${hostelId}`)}>
                                        <Edit className="h-4 w-4" /> Update Configuration
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-gray-50 my-1" />
                                    <DropdownMenuItem className="p-3 gap-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-rose-500 focus:bg-rose-50 focus:text-rose-600 cursor-pointer">
                                        <Trash className="h-4 w-4" /> Purge Asset Node
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button className="h-9 px-4 md:px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all active:scale-95 gap-2" onClick={() => router.push(`/admin/hostels/${hostelId}/room-details/room/${roomId}/add-guest?hostelId=${hostelId}`)}>
                                <Plus className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Provision Node</span>
                                <span className="sm:hidden">Provision</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8">
                {/* Minimal Metrics Matrix */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 overflow-x-auto pb-2 scrollbar-none">
                    {[
                        { label: 'Asset Load', value: `${room.currentGuests?.length || 0}/${room.capacity}`, sub: 'Occupancy Vector', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { label: 'Unit Yield', value: `PKR ${room.pricepernight}`, sub: 'Per Night Delta', icon: Coins, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Elevation', value: `Floor ${room.floor}`, sub: 'Building Tier', icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50' },
                        { label: 'Sec Status', value: 'Verified', sub: 'Integrity Check', icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-50' }
                    ].map((stat, i) => (
                        <Card key={i} className="bg-white border border-gray-100 rounded-[1.5rem] md:rounded-3xl p-4 md:p-5 flex items-center gap-3 md:gap-4 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-default group overflow-hidden relative shrink-0 min-w-[160px]">
                            <div className={`absolute top-0 right-0 h-16 w-16 ${stat.bg} opacity-10 rounded-bl-full translate-x-8 -translate-y-8`} />
                            <div className={`h-10 w-10 md:h-11 md:w-11 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                                <stat.icon className="h-4 w-4 md:h-5 md:w-5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">{stat.label}</span>
                                <span className="text-sm md:text-lg font-black text-gray-900 tracking-tight truncate uppercase italic leading-none md:leading-normal mt-0.5 md:mt-0">{stat.value}</span>
                                <span className="text-[7px] md:text-[8px] font-black text-gray-400 uppercase tracking-widest mt-0.5 truncate hidden md:block">{stat.sub}</span>
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                    {/* Left Column: Occupants & Specs */}
                    <div className="lg:col-span-2 space-y-6 md:space-y-8">
                        {/* Occupant Identity Feed */}
                        <Card className="bg-white border border-gray-100 rounded-[2rem] p-6 md:p-8 shadow-sm overflow-hidden">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                                        <Users className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-black text-gray-900 uppercase tracking-tight italic">Active Occupants</h2>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Resident nodes assigned to unit</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-indigo-100 text-indigo-500 bg-indigo-50/30 px-4 h-8 rounded-xl w-fit">
                                    {room.currentGuests?.length || 0} Nodes Linked
                                </Badge>
                            </div>

                            <div className="space-y-3">
                                {room.currentGuests?.length > 0 ? (
                                    room.currentGuests.map((guest) => (
                                        <div key={guest.bookingId} className="bg-gray-50/50 border border-transparent rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 hover:bg-white hover:shadow-xl hover:border-indigo-100 transition-all group relative overflow-hidden active:scale-[0.99] cursor-pointer" onClick={() => router.push(`/admin/users-records/${guest.id}`)}>
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${guest.rentStatus === 'Paid' ? 'bg-emerald-500' : 'bg-amber-500'} opacity-70`} />
                                            <div className="flex items-center gap-4 flex-1 w-full">
                                                <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center border border-gray-100 text-gray-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all shrink-0 shadow-sm">
                                                    <UserIcon className="h-5 w-5" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight truncate italic">{guest.name}</h4>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5 truncate italic">{guest.contact}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-10 w-full sm:w-auto px-1 sm:px-0 bg-white/50 sm:bg-transparent rounded-xl p-2 sm:p-0">
                                                <div className="flex flex-col items-start sm:items-end">
                                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Commencement</span>
                                                    <span className="text-[9px] md:text-[10px] font-black text-gray-700 italic uppercase">{guest.checkInDate}</span>
                                                </div>
                                                <div className="flex flex-col items-start sm:items-end">
                                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Audit Status</span>
                                                    <Badge className={`mt-0.5 h-6 text-[8px] font-black px-3 py-0 border-none rounded-full shadow-sm ${guest.rentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {guest.rentStatus === 'Paid' ? 'CLEARED' : 'PENDING'}
                                                    </Badge>
                                                </div>
                                                <div className="h-9 w-9 rounded-xl flex items-center justify-center text-gray-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all shrink-0 border border-transparent group-hover:border-indigo-100 hidden sm:flex">
                                                    <ArrowUpRight className="h-5 w-5" />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-20 flex flex-col items-center justify-center border border-dashed border-gray-100 rounded-3xl bg-gray-50/20">
                                        <Users className="h-12 w-12 text-gray-100 mb-4 animate-pulse" />
                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Unit node void of data</p>
                                        <Button variant="ghost" className="mt-6 h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:bg-white hover:shadow-lg hover:border-indigo-100 transition-all group border border-transparent" onClick={() => router.push(`/admin/hostels/${hostelId}/room-details/room/${roomId}/add-guest?hostelId=${hostelId}`)}>
                                            <Plus className="h-3.5 w-3.5 mr-2 group-hover:rotate-90 transition-transform" />
                                            Initialize Protocol
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Specs & Amenities */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                            <Card className="bg-white border border-gray-100 rounded-[2rem] p-6 md:p-8 shadow-sm">
                                <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-2 italic">
                                    <Info className="h-4 w-4 text-indigo-400" />
                                    Technical Specs
                                </h3>
                                <div className="space-y-2.5">
                                    {[
                                        { label: 'Fiscal Load', value: `PKR ${room.monthlyrent}`, icon: Coins, sub: 'Monthly Yield' },
                                        { label: 'Asset Class', value: room.type, icon: BedDouble, sub: 'Module Config' },
                                        { label: 'Volume', value: `${room.capacity} SLOTS`, icon: Users, sub: 'Bed Capacity' }
                                    ].map((spec, i) => (
                                        <div key={i} className="flex justify-between items-center bg-gray-50/50 p-4 rounded-2xl border border-transparent transition-all hover:bg-white hover:border-indigo-100 group shadow-inner md:shadow-none">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest group-hover:text-indigo-400 transition-colors italic">{spec.label}</span>
                                                <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest italic">{spec.sub}</span>
                                            </div>
                                            <span className="text-xs md:text-sm font-black text-gray-900 italic tracking-tight uppercase">{spec.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            <Card className="bg-white border border-gray-100 rounded-[2rem] p-6 md:p-8 shadow-sm">
                                <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-2 italic">
                                    <Sparkle className="h-4 w-4 text-indigo-400" />
                                    Utility Deck
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {room.amenities?.length > 0 ? (
                                        room.amenities.map((a, i) => (
                                            <Badge key={i} variant="outline" className="bg-gray-50/50 border-gray-100 text-gray-600 text-[9px] font-black uppercase tracking-widest px-4 h-9 rounded-xl shadow-sm transition-all hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 cursor-default">
                                                {a}
                                            </Badge>
                                        ))
                                    ) : (
                                        <div className="py-12 w-full text-center border border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center gap-2">
                                            <Sparkle className="h-4 w-4 text-gray-100" />
                                            <p className="text-[9px] font-black text-gray-300 italic uppercase tracking-[0.2em]">Standard Module Setup</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Right Column: Service Hub & Audit */}
                    <div className="space-y-6">
                        {/* Service Hub */}
                        <div className="space-y-3">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1 italic ml-2">Services Hub</p>
                            {[
                                { title: 'Engineering Ops', sub: `${room.maintanance?.length || 0} issues logged`, icon: Wrench, color: 'text-amber-500', bg: 'bg-amber-50', link: `/admin/hostels/${hostelId}/room-details/room/${roomId}/maintenance?hostelId=${hostelId}` },
                                { title: 'Logistics Hub', sub: `${room.LaundryLog?.length || 0} cycles cached`, icon: Shirt, color: 'text-purple-500', bg: 'bg-purple-50', link: `/admin/hostels/${hostelId}/room-details/room/${roomId}/laundry?hostelId=${hostelId}` },
                                { title: 'Hygiene Protocols', sub: `${room.CleaningLog?.length || 0} sessions complete`, icon: Sparkle, color: 'text-indigo-500', bg: 'bg-indigo-50', link: `/admin/hostels/${hostelId}/room-details/room/${roomId}/cleaning?hostelId=${hostelId}` }
                            ].map((service, i) => (
                                <Card
                                    key={i}
                                    className="bg-white border border-gray-100 rounded-2xl md:rounded-3xl p-4 flex items-center justify-between cursor-pointer group hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all active:scale-[0.98] relative overflow-hidden"
                                    onClick={() => router.push(service.link)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`h-10 w-10 rounded-xl ${service.bg} flex items-center justify-center border border-transparent group-hover:bg-gray-950 group-hover:text-white transition-all duration-500`}>
                                            <service.icon className={`h-5 w-5 ${service.color} group-hover:text-inherit transition-colors`} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[11px] md:text-sm font-black text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight italic truncate">{service.title}</p>
                                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-0.5 truncate">{service.sub}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-gray-200 group-hover:text-indigo-600 transition-all group-hover:translate-x-1 shrink-0" />
                                </Card>
                            ))}
                        </div>

                        {/* Lifecycle Persistence */}
                        <Card className="bg-gray-950 text-white rounded-[2rem] p-8 md:p-10 relative overflow-hidden shadow-2xl border-none group transition-all hover:scale-[1.01]">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <ShieldCheck className="h-24 w-24 text-white group-hover:scale-110 transition-transform duration-700" />
                            </div>
                            <div className="flex items-center gap-2 mb-8">
                                <Activity className="h-4 w-4 text-indigo-400" />
                                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] italic">Persistence Layer</h3>
                            </div>
                            <div className="space-y-6 relative z-10">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Creation delta</span>
                                    <span className="text-xs md:text-sm font-black text-white mt-1 uppercase italic tracking-tight">{format(new Date(room.createdAt), 'MMM dd, yyyy')}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Synchronization pulse</span>
                                    <span className="text-xs md:text-sm font-black text-indigo-400 mt-1 uppercase italic tracking-tight">{format(new Date(room.updatedAt), 'HH:mm • MMM dd')}</span>
                                </div>
                                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Active monitor</span>
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                        <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">Live Sync</span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </main>

            {/* Architecture Bar */}
            <div className="fixed bottom-0 w-full z-40 px-4 md:px-6 pb-4 pointer-events-none left-0">
                <div className="max-w-[1600px] mx-auto bg-gray-950/90 backdrop-blur-xl border border-white/5 text-white h-12 rounded-2xl shadow-2xl flex items-center justify-between px-6 pointer-events-auto">
                    <div className="flex items-center gap-4 md:gap-8">
                        <div className="flex items-center gap-2.5">
                            <BedDouble className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-[9px] font-black tracking-[0.2em] uppercase text-indigo-400 shrink-0 italic">Core Suite Node</span>
                        </div>
                        <div className="h-4 w-px bg-white/10 hidden md:block"></div>
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Active session</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-[9px] font-black tracking-widest uppercase text-gray-500">
                        <span className="hidden sm:block">CID: {roomId?.slice(-10).toUpperCase()}</span>
                        <div className="h-1.5 w-1.5 rounded-full bg-white/10 animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function RoomDetailsPage() {
    return (
        <Suspense fallback={<Loader label="Accessing Suite Registry" subLabel="Decrypting room configuration and resident nodes" icon={BedDouble} />}>
            <RoomDetailsContent />
        </Suspense>
    );
}
