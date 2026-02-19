"use client"
import React from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ChevronLeft,
    Building2,
    Users,
    BedDouble,
    MapPin,
    ShieldCheck,
    LayoutGrid,
    Plus,
    ChevronRight,
    ArrowUpRight,
    TrendingUp,
    MoreVertical,
    Zap,
    Coins,
    Sparkle,
    FileText,
    PieChart,
    Settings,
    Info,
    Calendar,
    Phone,
    MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,

    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useHostelById } from "@/hooks/usehostel";
import { format } from "date-fns";

const HostelOverviewPage = () => {
    const { hostelId } = useParams();
    const router = useRouter();
    const { data, isLoading } = useHostelById(hostelId);
    const hostel = data?.hostel;

    if (isLoading) return (
        <div className="flex h-screen items-center justify-center bg-white font-sans">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="h-20 w-20 border-[3px] border-gray-100 border-t-blue-600 rounded-full animate-spin" />
                    <Building2 className="h-8 w-8 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center">
                    <p className="text-lg font-bold text-gray-900 tracking-tight">Loading Hostel Details...</p>
                    <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-widest">Getting the latest information</p>
                </div>
            </div>
        </div>
    );

    if (!hostel) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50 font-sans">
            <div className="text-center space-y-4">
                <Info className="h-10 w-10 text-gray-300 mx-auto" />
                <h2 className="text-xl font-bold text-gray-900 uppercase">Hostel Not Found</h2>
                <Button onClick={() => router.push('/admin/hostels')} variant="outline" className="rounded-xl">Back to Hostels</Button>
            </div>
        </div>
    );

    const roomStats = {
        total: hostel.Room?.length || 0,
        occupied: hostel.Room?.filter(r => r.status === 'OCCUPIED').length || 0,
        available: hostel.Room?.filter(r => r.status === 'AVAILABLE').length || 0,
        maintenance: hostel.Room?.filter(r => r.status === 'MAINTENANCE').length || 0,
    };

    const occupancyRate = roomStats.total > 0 ? Math.round((roomStats.occupied / roomStats.total) * 100) : 0;

    const getStatusTheme = (status) => {
        switch (status) {
            case "ACTIVE": return "bg-emerald-50 text-emerald-700 border-emerald-100";
            case "INACTIVE": return "bg-red-50 text-red-700 border-red-100";
            default: return "bg-gray-50 text-gray-700 border-gray-100";
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans">
            {/* Minimal Premium Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100 h-9 w-9" onClick={() => router.push('/admin/hostels')}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="h-6 w-px bg-gray-200" />
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight uppercase">{hostel.name}</h1>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                                Hostel Overview • {hostel.type}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className={`${getStatusTheme(hostel.status || 'ACTIVE')} px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border shadow-sm`}>
                            {hostel.status || 'ACTIVE'}
                        </Badge>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9">
                                    <MoreVertical className="h-4 w-4 text-gray-400" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 p-1 rounded-xl border-gray-100 shadow-xl">
                                <DropdownMenuItem className="p-2.5 gap-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider text-gray-600 cursor-pointer" onClick={() => router.push(`/admin/hostels/${encodeURIComponent(hostel.name)}/edithostel?hostelId=${hostelId}`)}>
                                    <Settings className="h-3.5 w-3.5" /> Edit Hostel
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="p-2.5 gap-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider text-rose-500 focus:bg-rose-50 focus:text-rose-600 cursor-pointer">
                                    <ShieldCheck className="h-3.5 w-3.5" /> Deactivate Hostel
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button className="h-9 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all active:scale-95" onClick={() => router.push(`/admin/hostels/${encodeURIComponent(hostel.name)}/rooms?hostelId=${hostelId}`)}>
                            <LayoutGrid className="h-3.5 w-3.5 mr-2" />
                            Manage Rooms
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
                {/* Quick Statistics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Occupancy Rate', value: `${occupancyRate}%`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Total Rooms', value: roomStats.total, icon: BedDouble, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Location', value: hostel.city, icon: MapPin, color: 'text-purple-600', bg: 'bg-purple-50' },
                        { label: 'Manager', value: hostel.User_Hostel_managerIdToUser?.name?.split(' ')[0] || 'Unassigned', icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-50' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow cursor-default">
                            <div className={`h-11 w-11 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</span>
                                <span className="text-xl font-bold text-gray-900 tracking-tight uppercase truncate max-w-[120px]">{stat.value}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Hostel Identity */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Hostel Details Card */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 text-blue-600">
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-gray-900 uppercase">Hostel Information</h2>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">General details and contact info</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-gray-100 text-gray-400">
                                    ID: {hostelId.slice(-6).toUpperCase()}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <div className="flex flex-col gap-1.5 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <MapPin className="h-3 w-3" /> Address
                                        </span>
                                        <p className="text-xs font-bold text-gray-900 italic uppercase">
                                            {hostel.completeaddress || `${hostel.address}, ${hostel.city}`}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                <Phone className="h-3 w-3" /> Phone
                                            </span>
                                            <span className="text-[11px] font-bold text-gray-900 uppercase">{hostel.phone || 'N/A'}</span>
                                        </div>
                                        <div className="flex flex-col gap-1 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                <Calendar className="h-3 w-3" /> Last Updated
                                            </span>
                                            <span className="text-[11px] font-bold text-gray-900 uppercase tabular-nums">
                                                {format(new Date(hostel.updatedAt), 'dd/MM/yy')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-blue-600 text-white rounded-[1.5rem] p-5 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10" />
                                        <div className="relative z-10 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Zap className="h-3.5 w-3.5 text-blue-200" />
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-100">Quick Actions</span>
                                            </div>
                                            <h4 className="text-xs font-bold uppercase tracking-tight italic">Management</h4>
                                            <div className="grid grid-cols-2 gap-2 mt-4">
                                                <Button size="sm" className="h-8 bg-white/10 hover:bg-white/20 text-[8px] font-black uppercase tracking-widest rounded-lg" onClick={() => router.push(`/admin/hostels/${encodeURIComponent(hostel.name)}/residents?hostelId=${hostelId}`)}>
                                                    Residents
                                                </Button>
                                                <Button size="sm" className="h-8 bg-white text-blue-600 hover:bg-gray-100 text-[8px] font-black uppercase tracking-widest rounded-lg shadow-lg" onClick={() => router.push(`/admin/hostels/${encodeURIComponent(hostel.name)}/rooms?hostelId=${hostelId}`)}>
                                                    Rooms
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Rooms Table */}
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                            <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 uppercase">Recent Rooms</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">View status of rooms</p>
                                </div>
                                <Button variant="outline" className="h-8 rounded-lg px-4 font-bold text-[9px] uppercase tracking-widest" onClick={() => router.push(`/admin/hostels/${encodeURIComponent(hostel.name)}/rooms?hostelId=${hostelId}`)}>
                                    View All Rooms
                                </Button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50/50 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 border-b">
                                            <th className="px-8 py-4">Room Number</th>
                                            <th className="px-8 py-4">Status</th>
                                            <th className="px-8 py-4">Type</th>
                                            <th className="px-8 py-4 text-right">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {(hostel.Room || []).slice(0, 5).map((room, i) => (
                                            <tr key={i} className="group hover:bg-gray-50/30 transition-colors">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 transition-all duration-300">
                                                            <BedDouble className="h-5 w-5 text-blue-600 group-hover:text-white transition-colors" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-gray-900 uppercase">Room {room.roomNumber}</span>
                                                            <span className="text-[10px] font-medium text-gray-400 uppercase">Room ID: {room.roomNumber}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <Badge className={`px-3 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border-none ${room.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-600' :
                                                        room.status === 'OCCUPIED' ? 'bg-blue-50 text-blue-600' :
                                                            'bg-amber-50 text-amber-600'
                                                        }`}>
                                                        {room.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase">{room.type}</td>
                                                <td className="px-8 py-5 text-right">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-blue-600 hover:text-white transition-all p-0" onClick={() => router.push(`/admin/hostels/${encodeURIComponent(hostel.name)}/room-details/room/${room.id}?hostelId=${hostelId}`)}>
                                                        <ArrowUpRight className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {(hostel.Room || []).length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-8 py-20 text-center">
                                                    <LayoutGrid className="h-10 w-10 text-gray-100 mx-auto mb-4" />
                                                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em] italic">No rooms available</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Navigation & Info */}
                    <div className="space-y-6">
                        {/* Navigation Grid */}
                        <div className="space-y-3">
                            {[
                                { title: 'Rooms', sub: 'Manage allocations & status', icon: LayoutGrid, color: 'text-blue-500', bg: 'bg-blue-50', link: `/admin/hostels/${encodeURIComponent(hostel.name)}/rooms?hostelId=${hostelId}` },
                                { title: 'Residents', sub: 'View all active residents', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50', link: `/admin/hostels/${encodeURIComponent(hostel.name)}/residents?hostelId=${hostelId}` },
                                { title: 'Payments', sub: 'Financial reports & trends', icon: PieChart, color: 'text-amber-500', bg: 'bg-amber-50', link: `/admin/reports` },
                                { title: 'Complaints', sub: 'Resident issues & feedback', icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-50', link: `/admin/complaints?hostelId=${hostelId}` }
                            ].map((node, i) => (
                                <div
                                    key={i}
                                    className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between cursor-pointer group hover:border-blue-600/10 hover:shadow-md transition-all relative overflow-hidden"
                                    onClick={() => router.push(node.link)}
                                >
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${node.color.replace('text-', 'bg-')}`} />
                                    <div className="flex items-center gap-4">
                                        <div className={`h-10 w-10 rounded-xl ${node.bg} flex items-center justify-center border border-transparent group-hover:scale-110 transition-transform`}>
                                            <node.icon className={`h-5 w-5 ${node.color}`} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{node.title}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{node.sub}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-gray-200 group-hover:text-blue-600 transition-colors" />
                                </div>
                            ))}
                        </div>

                        {/* Registration Info Card */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 right-0 p-6 opacity-5">
                                <ShieldCheck className="h-20 w-20 text-blue-600" />
                            </div>
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-6">Hostel Details</h3>
                            <div className="space-y-5">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Created On</span>
                                    <span className="text-[11px] font-bold text-gray-900 mt-1 uppercase italic">
                                        {format(new Date(hostel.createdAt), 'MMM dd, yyyy')}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">System Status</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[11px] font-bold text-gray-600 uppercase italic">Online / Active</span>
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-gray-100">
                                    <p className="text-[9px] font-bold text-gray-400 leading-relaxed uppercase">
                                        All hostel data is securely managed and monitored for administrative purposes.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Summary Bar */}
                <div className="pt-10">
                    <div className="bg-blue-600 text-white rounded-[2rem] p-4 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-full bg-white/10 skew-x-12 translate-x-20" />
                        <div className="flex items-center gap-6 relative z-10 px-4">
                            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                                <ShieldCheck className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">Admin Panel</h4>
                                <p className="text-[11px] font-bold mt-0.5 whitespace-nowrap">All data is up to date</p>
                            </div>
                        </div>

                        <div className="h-6 w-px bg-white/10 hidden md:block" />

                        <div className="flex-1 flex items-center gap-12 px-8">
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black uppercase text-blue-200 tracking-widest">Hostel ID</span>
                                <span className="text-[10px] font-bold text-white uppercase mt-1">#HST-{hostelId?.slice(-8).toUpperCase()}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black uppercase text-blue-200 tracking-widest">Occupancy</span>
                                <span className="text-[10px] font-bold text-white uppercase mt-1 italic">{roomStats.occupied}/{roomStats.total} Beds Occupied</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pr-6 relative z-10">
                            <div className="h-4 w-px bg-white/10" />
                            <span className="text-[9px] font-black uppercase text-blue-100 tracking-widest whitespace-nowrap">System Secure</span>
                            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.4)]" />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default HostelOverviewPage;
