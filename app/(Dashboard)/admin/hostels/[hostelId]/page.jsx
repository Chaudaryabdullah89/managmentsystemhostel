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
import Loader from "@/components/ui/Loader";

const HostelOverviewPage = () => {
    const { hostelId } = useParams();
    const router = useRouter();
    const { data, isLoading } = useHostelById(hostelId);
    const hostel = data?.hostel;

    if (isLoading) return <Loader label="Loading Hostel Details" subLabel="Fetching the latest information..." icon={Building2} fullScreen={false} />;

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
            <div className="bg-white border-b sticky top-0 z-50 py-2 md:h-16">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-full flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                    <div className="flex items-center gap-3 md:gap-4">
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100 h-9 w-9 shrink-0" onClick={() => router.push('/admin/hostels')}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="h-6 w-px bg-gray-200 shrink-0" />
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-sm md:text-lg font-bold text-gray-900 tracking-tight uppercase truncate">{hostel.name}</h1>
                            <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 md:gap-2">
                                <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="truncate">Node Details • {hostel.type}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="hidden xs:block">
                            <Badge variant="outline" className={`${getStatusTheme(hostel.status || 'ACTIVE')} px-3 md:px-4 py-1.5 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest border shadow-sm`}>
                                {hostel.status || 'ACTIVE'}
                            </Badge>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 shrink-0">
                                    <MoreVertical className="h-4 w-4 text-gray-400" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 p-1 rounded-xl border-gray-100 shadow-xl">
                                <DropdownMenuItem className="p-2.5 gap-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider text-gray-600 cursor-pointer" onClick={() => router.push(`/admin/hostels/${encodeURIComponent(hostel.name)}/edithostel?hostelId=${hostelId}`)}>
                                    <Settings className="h-3.5 w-3.5" /> Registry Config
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="p-2.5 gap-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider text-rose-500 focus:bg-rose-50 focus:text-rose-600 cursor-pointer">
                                    <ShieldCheck className="h-3.5 w-3.5" /> Force Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                            className="h-9 px-4 md:px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[9px] md:text-[10px] uppercase tracking-widest shadow-sm active:scale-95 flex items-center gap-2 whitespace-nowrap"
                            onClick={() => router.push(`/admin/hostels/${encodeURIComponent(hostel.name)}/rooms?hostelId=${hostelId}`)}
                        >
                            <LayoutGrid className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Manage Registry</span>
                            <span className="sm:hidden">Blocks</span>
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
                {/* Quick Statistics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 px-1 md:px-0">
                    {[
                        { label: 'Occupancy', value: `${occupancyRate}%`, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { label: 'Beds Total', value: roomStats.total, icon: BedDouble, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Locality', value: hostel.city, icon: MapPin, color: 'text-purple-600', bg: 'bg-purple-50' },
                        { label: 'Registry Admin', value: hostel.User_Hostel_managerIdToUser?.name?.split(' ')[0] || 'Unassigned', icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-50' }
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Hostel Identity */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Hostel Details Card */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 text-indigo-600">
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm md:text-base font-black text-gray-900 uppercase">Hostel Identity</h2>
                                        <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-wider">Property Registry Data</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-gray-100 text-gray-400 shrink-0">
                                    NODE: {hostelId.slice(-6).toUpperCase()}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                                <div className="space-y-6">
                                    <div className="flex flex-col gap-1.5 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <MapPin className="h-3 w-3" /> Location Trace
                                        </span>
                                        <p className="text-[11px] font-black text-gray-900 uppercase italic">
                                            {hostel.completeaddress || `${hostel.address}, ${hostel.city}`}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                <Phone className="h-3 w-3" /> Contact
                                            </span>
                                            <span className="text-[11px] font-black text-gray-900 uppercase">{hostel.phone || 'N/A'}</span>
                                        </div>
                                        <div className="flex flex-col gap-1 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                <Calendar className="h-3 w-3" /> Updated
                                            </span>
                                            <span className="text-[11px] font-black text-gray-900 uppercase tabular-nums">
                                                {format(new Date(hostel.updatedAt), 'dd/MM/yy')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-indigo-600 text-white rounded-[1.5rem] p-5 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10" />
                                        <div className="relative z-10 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Zap className="h-3.5 w-3.5 text-indigo-200" />
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-100">Registry Deck</span>
                                            </div>
                                            <h4 className="text-xs font-black uppercase tracking-tight italic">Action Node</h4>
                                            <div className="grid grid-cols-2 gap-2 mt-4">
                                                <Button size="sm" className="h-9 bg-white/10 hover:bg-white/20 text-[9px] font-black uppercase tracking-widest rounded-lg border-none" onClick={() => router.push(`/admin/hostels/${encodeURIComponent(hostel.name)}/residents?hostelId=${hostelId}`)}>
                                                    Residents
                                                </Button>
                                                <Button size="sm" className="h-9 bg-white text-indigo-600 hover:bg-indigo-50 text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg border-none" onClick={() => router.push(`/admin/hostels/${encodeURIComponent(hostel.name)}/rooms?hostelId=${hostelId}`)}>
                                                    Blocks
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Rooms Table */}
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                            <div className="px-6 md:px-8 py-6 border-b border-gray-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-sm font-black text-gray-900 uppercase">Recent Blocks</h3>
                                    <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-wider mt-0.5">Inventory Status Node</p>
                                </div>
                                <Button variant="outline" className="h-8 rounded-lg px-4 font-black text-[9px] uppercase tracking-widest border-gray-100 hover:bg-gray-50" onClick={() => router.push(`/admin/hostels/${encodeURIComponent(hostel.name)}/rooms?hostelId=${hostelId}`)}>
                                    Registry Ledger
                                </Button>
                            </div>
                            <div className="overflow-x-auto scrollbar-hide">
                                <table className="w-full text-left min-w-[600px]">
                                    <thead>
                                        <tr className="bg-gray-50/50 text-[9px] font-black uppercase tracking-widest text-gray-400 border-b">
                                            <th className="px-8 py-4">Block ID</th>
                                            <th className="px-8 py-4">Status</th>
                                            <th className="px-8 py-4">Category</th>
                                            <th className="px-8 py-4 text-right">Access</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {(hostel.Room || []).slice(0, 5).map((room, i) => (
                                            <tr key={i} className="group hover:bg-gray-50/30 transition-colors">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-all duration-300">
                                                            <BedDouble className="h-5 w-5 text-indigo-600 group-hover:text-white transition-colors" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black text-gray-900 uppercase">UNIT {room.roomNumber}</span>
                                                            <span className="text-[9px] font-black text-gray-400 uppercase">SYS_REF: {room.roomNumber}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <Badge className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border-none ${room.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-600' :
                                                        room.status === 'OCCUPIED' ? 'bg-indigo-50 text-indigo-600' :
                                                            'bg-amber-50 text-amber-600'
                                                        }`}>
                                                        {room.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-tighter">{room.type} SEATER</td>
                                                <td className="px-8 py-5 text-right">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-indigo-600 hover:text-white transition-all p-0" onClick={() => router.push(`/admin/hostels/${encodeURIComponent(hostel.name)}/room-details/room/${room.id}?hostelId=${hostelId}`)}>
                                                        <ArrowUpRight className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {(hostel.Room || []).length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-8 py-20 text-center">
                                                    <LayoutGrid className="h-10 w-10 text-gray-100 mx-auto mb-4" />
                                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Registry Empty</p>
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
                                        <div className="min-w-0">
                                            <p className="text-sm font-black text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight truncate">{node.title}</p>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5 truncate">{node.sub}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-gray-200 group-hover:text-indigo-600 transition-colors shrink-0" />
                                </div>
                            ))}
                        </div>

                        {/* Registration Info Card */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 right-0 p-6 opacity-5">
                                <ShieldCheck className="h-20 w-20 text-blue-600" />
                            </div>
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-6">More Info</h3>
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
                                        <span className="text-[11px] font-bold text-gray-600 uppercase italic">Online</span>
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-gray-100">
                                    <p className="text-[9px] font-bold text-gray-400 leading-relaxed uppercase">
                                        All records are securely managed for hostel staff.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Summary Bar */}

            </main>
        </div>
    );
};

export default HostelOverviewPage;
