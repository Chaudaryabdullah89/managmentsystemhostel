"use client"
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Calendar,
    DollarSign,
    User,
    Home,
    BedDouble,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Search,
    Filter,
    Eye,
    Download,
    Phone,
    Mail,
    MapPin,
    CreditCard,
    FileText,
    ChevronRight,
    Plus,
    Building2,
    ShieldCheck,
    RefreshCw,
    Layers,
    ArrowUpRight,
    UserCheck,
    Printer,
    Hash,
    Building,
    User as UserIcon,
    ChevronRight as ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useBookings } from "@/hooks/useBooking";
import { useHostel } from "@/hooks/usehostel";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { QueryKeys } from '@/lib/queryclient';
import { format } from "date-fns";

const useSyncAutomation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const response = await fetch('/api/automation/sync-logs', { method: 'POST' });
            return response.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: [QueryKeys.Rooms] });
            queryClient.invalidateQueries({ queryKey: ["bookings"] });
            // toast.success(`System Synced: ${data.data.cleaning} cleaning cycles updated.`);
        }
    });
};

const GlobalBookingsPage = () => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { data: bookingsResponse, isLoading, isFetching } = useBookings();
    const { data: hostelsResponse } = useHostel();
    const syncAutomation = useSyncAutomation();

    useEffect(() => {
        syncAutomation.mutate();
    }, []);

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [hostelFilter, setHostelFilter] = useState("All");

    const bookings = bookingsResponse || [];
    const hostels = hostelsResponse?.hostels || [];

    const getStatusStyle = (status) => {
        switch (status) {
            case "CONFIRMED": return "bg-blue-50 text-blue-700 border-blue-100";
            case "PENDING": return "bg-amber-50 text-amber-700 border-amber-100";
            case "CHECKED_IN": return "bg-emerald-50 text-emerald-700 border-emerald-100";
            case "CHECKED_OUT": return "bg-gray-100 text-gray-700 border-gray-200";
            case "CANCELLED": return "bg-rose-50 text-rose-700 border-rose-100";
            default: return "bg-gray-50 text-gray-600 border-gray-100";
        }
    };

    const getRibbonColor = (status) => {
        switch (status) {
            case "CONFIRMED": return "bg-blue-600";
            case "PENDING": return "bg-amber-500";
            case "CHECKED_IN": return "bg-emerald-500";
            case "CHECKED_OUT": return "bg-gray-900";
            case "CANCELLED": return "bg-rose-500";
            default: return "bg-gray-400";
        }
    };

    const filteredBookings = bookings.filter(booking => {
        const matchesSearch =
            booking.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            booking.User.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            booking.Room?.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            booking.Room?.Hostel?.name.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === "All" || booking.status === statusFilter;
        const matchesHostel = hostelFilter === "All" || (booking.Room?.Hostel?.name === hostelFilter);

        return matchesSearch && matchesStatus && matchesHostel;
    });

    const activeBookings = bookings.filter(b => b.status === "CHECKED_IN").length;
    const pendingBookings = bookings.filter(b => b.status === "PENDING").length;
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    if (isLoading) return (
        <div className="flex h-screen items-center justify-center bg-white font-sans">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="h-20 w-20 border-[3px] border-gray-100 border-t-blue-600 rounded-full animate-spin" />
                    <Calendar className="h-8 w-8 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center">
                    <p className="text-lg font-bold text-gray-900 tracking-tight">Loading Bookings...</p>
                    <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-widest">Getting booking data</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans">
            {/* Minimal Premium Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-1 bg-blue-600 rounded-full" />
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight uppercase">All Bookings</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Manage bookings</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Online</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100 h-9 w-9" onClick={() => syncAutomation.mutate()}>
                            <RefreshCw className={`h-4 w-4 text-gray-500 ${syncAutomation.isPending ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button variant="outline" className="h-9 px-4 rounded-xl border-gray-200 bg-white font-bold text-[10px] uppercase tracking-wider text-gray-600 hover:bg-gray-50 transition-all">
                            <Download className="h-3.5 w-3.5 mr-2 text-gray-400" />
                            Export
                        </Button>
                        <Button
                            className="h-9 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all active:scale-95"
                            onClick={() => router.push('/admin/bookings/create')}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Booking
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
                {/* Statistics Overview */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Bookings', value: bookings.length, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Active Guests', value: activeBookings, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Pending Approvals', value: pendingBookings, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Total Revenue', value: `PKR ${(totalRevenue / 1000).toFixed(1)}k`, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow cursor-default">
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

                {/* Search and Filters */}
                <div className="bg-white border border-gray-100 rounded-2xl p-2 flex flex-col md:flex-row items-center gap-4 shadow-sm">
                    <div className="flex-1 relative w-full group px-2">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by Guest, Room or Hostel..."
                            className="w-full h-12 pl-10 bg-transparent border-none shadow-none font-bold text-sm focus-visible:ring-0 placeholder:text-gray-300"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="h-8 w-px bg-gray-100 mx-2 hidden md:block" />

                    <div className="flex items-center gap-2 p-1 bg-gray-50 rounded-xl w-full md:w-auto">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-10 px-4 rounded-lg font-bold text-[10px] uppercase tracking-wider text-gray-500 hover:bg-white hover:text-black hover:shadow-sm">
                                    <Filter className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                    {statusFilter === 'All' ? 'All Status' : statusFilter.replace('_', ' ')}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[220px] rounded-xl border-gray-100 shadow-xl p-2">
                                <DropdownMenuLabel className="text-[9px] font-bold uppercase tracking-widest text-gray-400 p-2">Booking Status</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-gray-50 mb-1" />
                                {["All", "CONFIRMED", "PENDING", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"].map(status => (
                                    <DropdownMenuItem key={status} onClick={() => setStatusFilter(status)} className="p-2.5 font-bold text-[10px] uppercase tracking-wider rounded-lg cursor-pointer">
                                        {status.replace('_', ' ')}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-10 px-4 rounded-lg font-bold text-[10px] uppercase tracking-wider text-gray-500 hover:bg-white hover:text-black hover:shadow-sm">
                                    <Building2 className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                    {hostelFilter === 'All' ? 'All Hostels' : hostelFilter}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[280px] rounded-xl border-gray-100 shadow-xl p-2">
                                <DropdownMenuLabel className="text-[9px] font-bold uppercase tracking-widest text-gray-400 p-2">Select Hostel</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-gray-50 mb-1" />
                                <DropdownMenuItem onClick={() => setHostelFilter("All")} className="p-2.5 font-bold text-[10px] uppercase tracking-wider rounded-lg">All Hostels</DropdownMenuItem>
                                {hostels.map(h => (
                                    <DropdownMenuItem key={h.id} onClick={() => setHostelFilter(h.name)} className="p-2.5 font-bold text-[10px] uppercase tracking-wider rounded-lg">
                                        {h.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Bookings List:  */}
                <div className="space-y-4">
                    {filteredBookings.length > 0 ? (
                        filteredBookings.map((booking, index) => (
                            <Link
                                href={`/admin/bookings/${booking.id}`}
                                key={booking.id}
                                className="bg-white border border-gray-100 rounded-2xl p-5 pb-14 flex flex-col lg:flex-row items-center justify-between gap-6 hover:shadow-md transition-shadow group relative overflow-hidden"
                            >
                                <div className={`absolute top-0 left-0 w-1.5 h-full ${getRibbonColor(booking.status)} opacity-70`} />

                                <div className="flex items-center gap-6 flex-1 min-w-0">
                                    {/* Guest Info */}
                                    <div className="flex items-center gap-5 min-w-[280px]">
                                        <div className="h-14 w-14 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-sm shrink-0 group-hover:bg-blue-600 transition-colors">
                                            <UserIcon className="h-6 w-6 text-gray-400 group-hover:text-white transition-colors" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <h4 className="text-base font-bold text-gray-900 uppercase tracking-tight truncate">{booking.User.name}</h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{booking.Room?.Hostel?.name}</span>
                                                {booking.uid && (
                                                    <>
                                                        <span className="h-1 w-1 rounded-full bg-gray-200" />
                                                        <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{booking.uid}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Room Details */}
                                    <div className="hidden md:flex flex-col gap-1 min-w-[160px]">
                                        <div className="flex items-center gap-2">
                                            <BedDouble className="h-3.5 w-3.5 text-blue-500" />
                                            <span className="text-xs font-bold text-gray-900 uppercase">Room {booking.Room?.roomNumber}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-0.5">{booking.Room?.type} Unit</span>
                                    </div>

                                    {/* Dates */}
                                    <div className="hidden xl:flex items-center gap-8 min-w-[280px]">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Start</span>
                                            <span className="text-xs font-bold text-gray-900 uppercase">{format(new Date(booking.checkIn), 'MMM dd, yyyy')}</span>
                                        </div>
                                        <div className="h-4 w-px bg-gray-100" />
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">End</span>
                                            <span className="text-xs font-bold text-gray-900 uppercase">{booking.checkOut ? format(new Date(booking.checkOut), 'MMM dd, yyyy') : 'Stay'}</span>
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="min-w-[140px] flex justify-center">
                                        <Badge variant="outline" className={`${getStatusStyle(booking.status)} px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border shadow-sm`}>
                                            {booking.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 lg:ml-auto">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-10 w-10 rounded-full hover:bg-gray-50 text-gray-400 transition-colors"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm flex items-center gap-2 group/btn"
                                    >
                                        View Details
                                        <ChevronRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
                                    </Button>
                                </div>

                                {/* Most Recent Payment Instant Check - Absoluted to bottom */}
                                {booking.Payment && booking.Payment.length > 0 && (
                                    <div className="absolute bottom-0 left-0 w-full h-[38px] bg-gray-50/80 backdrop-blur-sm border-t border-gray-100 flex items-center justify-between px-6 group-hover:bg-white transition-colors duration-300">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5">
                                                <CreditCard className="h-3 w-3 text-gray-400" />
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Payment Status</span>
                                            </div>
                                            <div className="h-3 w-px bg-gray-200" />
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-bold uppercase tracking-tight ${booking.Payment[0].status === 'PAID' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {booking.Payment[0].status}
                                                </span>
                                                <span className="text-[10px] font-bold text-gray-900 tracking-tighter">PKR {booking.Payment[0].amount.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                                                {format(new Date(booking.Payment[0].date), 'MMM dd, HH:mm')}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </Link>
                        ))
                    ) : (
                        <div className="bg-white border border-gray-100 rounded-3xl p-24 text-center shadow-sm border-dashed">
                            <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-6 border border-gray-100">
                                <Search className="h-8 w-8 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">No bookings found</h3>
                            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Try changing your search or filters</p>
                            <Button
                                variant="outline"
                                className="mt-8 rounded-xl h-10 px-8 font-bold uppercase tracking-widest text-[10px] border-gray-200 hover:bg-black hover:text-white transition-all shadow-sm"
                                onClick={() => { setSearchQuery(""); setStatusFilter("All"); setHostelFilter("All"); }}
                            >
                                Reset Filters
                            </Button>
                        </div>
                    )}
                </div>

                {/* Status Bar */}
                <div className="pt-10">
                    <div className="bg-blue-600 text-white rounded-[2rem] p-4 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-full bg-white/5 skew-x-12 translate-x-20" />
                        <div className="flex items-center gap-6 relative z-10 px-4">
                            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                                <ShieldCheck className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-100">System Status</h4>
                                <p className="text-[11px] font-bold mt-0.5">Bookings up to date</p>
                            </div>
                        </div>

                        <div className="h-6 w-px bg-white/10 hidden md:block" />

                        <div className="flex-1 flex items-center gap-12 px-8">
                            <div className="flex flex-col">
                                <span className="text-[8px] font-bold uppercase text-indigo-100 tracking-widest">Last Sync</span>
                                <span className="text-[10px] font-bold text-gray-200 uppercase mt-1">{new Date().toLocaleDateString()}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[8px] font-bold uppercase text-indigo-100 tracking-widest">Total Records</span>
                                <span className="text-[10px] font-bold text-white uppercase mt-1">{bookings.length} Verified Records</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pr-6 relative z-10">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-[9px] font-bold uppercase tracking-widest text-white gap-2"
                                onClick={() => syncAutomation.mutate()}
                                disabled={syncAutomation.isPending}
                            >
                                <RefreshCw className={`h-3 w-3 ${syncAutomation.isPending ? 'animate-spin' : ''}`} />
                                Sync Data
                            </Button>
                            <div className="h-4 w-px bg-white/10" />
                            <span className="text-[9px] font-bold uppercase text-white tracking-widest">Online</span>
                            <div className="h-2 w-2 rounded-full bg-white animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.4)]" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlobalBookingsPage;
