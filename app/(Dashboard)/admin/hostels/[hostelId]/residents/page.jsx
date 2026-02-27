"use client"
import React, { useState, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ArrowLeft, Filter, Phone, Mail, Home, User, Users, MoreVertical, ShieldCheck, RefreshCw, LayoutGrid, Plus, Edit } from "lucide-react"
import Link from 'next/link'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useBookings, useUpdateBookingStatus } from "@/hooks/useBooking"
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
import { Trash } from "lucide-react"
import Loader from '../../../../../../components/ui/Loader'

const ResidentActions = ({ resident, params, hostelId, router, updateStatus }) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 w-9 p-0 rounded-xl hover:bg-gray-100 text-gray-400">
                <MoreVertical className="h-4 w-4" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-gray-100 shadow-2xl">
            <DropdownMenuItem asChild className="p-3 gap-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-gray-600 cursor-pointer">
                <Link href={`/admin/hostels/${params?.hostelId}/residents/${resident.id}?hostelId=${hostelId}`}>
                    <User className="h-4 w-4" /> Access Profile
                </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
                className="p-3 gap-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-gray-600 cursor-pointer"
                onClick={() => router.push(`/admin/users/${resident.id}`)}
            >
                <Edit className="h-4 w-4" /> Configure Node
            </DropdownMenuItem>
            <div className="h-px bg-gray-50 my-1 mx-2" />
            <DropdownMenuItem
                className="p-3 gap-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-rose-500 focus:bg-rose-50 focus:text-rose-600 cursor-pointer"
                onSelect={(e) => e.preventDefault()}
            >
                <AlertDialog>
                    <AlertDialogTrigger className="w-full text-left flex items-center gap-3">
                        <Trash className="h-4 w-4" /> Decommission Node
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-3xl border-none shadow-2xl overflow-hidden p-0 max-w-lg mx-4 sm:mx-0">
                        <div className="bg-gray-950 p-8 text-white">
                            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center mb-4"><Trash size={20} className="text-rose-500" /></div>
                            <AlertDialogTitle className="text-xl font-black tracking-tight mb-2 uppercase">Purge Resident Node?</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-400 font-black text-[10px] uppercase tracking-widest">
                                Wiping <span className="text-white font-black">{resident.name}</span> from the registry. This will terminate their active occupancy protocol. Permanent action.
                            </AlertDialogDescription>
                        </div>
                        <div className="p-6 flex items-center justify-end gap-3 bg-white">
                            <AlertDialogCancel className="rounded-xl border-gray-100 bg-gray-50 font-black px-6 h-11 uppercase tracking-widest text-[9px] text-gray-500">Abort</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-rose-600 hover:bg-rose-700 rounded-xl font-black px-6 h-11 uppercase tracking-widest text-[9px] shadow-sm"
                                onClick={() => updateStatus({ id: resident.bookingId, status: 'CANCELLED' })}
                            >
                                Execute Purge
                            </AlertDialogAction>
                        </div>
                    </AlertDialogContent>
                </AlertDialog>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
);

const ResidentsContent = () => {
    const params = useParams()
    const searchParams = useSearchParams()
    const router = useRouter()

    // Prioritize UUID from query param if path has a readable name
    const hostelId = searchParams.get('hostelId') || params?.hostelId

    const { data: bookingsData, isLoading, isFetching, refetch } = useBookings();
    const { mutate: updateStatus } = useUpdateBookingStatus()
    const [searchTerm, setSearchTerm] = useState('')

    const residents = React.useMemo(() => {
        if (!bookingsData) return [];

        // Filter bookings for this hostel and map them to resident objects
        // Filter bookings for this hostel and map them to resident objects
        return bookingsData
            .filter(booking => {
                const bookingHostelId = booking.Room?.Hostel?.id;
                const bookingHostelName = booking.Room?.Hostel?.name;

                // Match by ID primarily, fallback to Name if needed (e.g. from params if ID is missing)
                return bookingHostelId === hostelId || decodeURIComponent(params?.hostelId) === bookingHostelName;
            })
            .map(booking => ({
                id: booking.User?.id || booking.id,
                bookingId: booking.id,
                uid: booking.User?.uid,
                name: booking.User?.name || "Anonymous",
                room: booking.Room?.roomNumber || "N/A",
                contact: booking.User?.phone || "N/A",
                email: booking.User?.email || "N/A",
                cnic: booking.User?.cnic || "N/A",
                joinDate: booking.checkIn,
                status: booking.status === 'CONFIRMED' || booking.status === 'CHECKED_IN' ? 'Active' : booking.status,
                avatar: booking.User?.image || ""
            }));
    }, [bookingsData, hostelId, params?.hostelId]);

    const filteredResidents = residents.filter(resident =>
        resident.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resident.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(resident.id).toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (isLoading) return <Loader label="Loading Residents" subLabel="Fetching resident list..." icon={Users} fullScreen={false} />;

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Slim Header */}
            <div className="bg-white border-b sticky top-0 z-40 py-2 md:h-16">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-full flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                    <div className="flex items-center gap-3 md:gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl hover:bg-gray-100 shrink-0">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="h-6 w-px bg-gray-200 shrink-0" />
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-sm md:text-lg font-black text-gray-900 tracking-tight flex items-center gap-2 truncate">
                                <User className="h-4 w-4 md:h-5 md:w-5 text-indigo-600" />
                                <span className="truncate">Resident Registry</span>
                            </h1>
                            <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest truncate mt-0.5">{decodeURIComponent(params?.hostelId || hostelId)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex flex-col items-end mr-2 md:mr-4">
                            <span className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Active nodes</span>
                            <span className="text-xs md:text-sm font-black text-gray-900 leading-none">{residents.filter(r => r.status === 'Active').length} UNIT_PPL</span>
                        </div>
                        <Button
                            variant="outline"
                            className="h-9 md:h-10 rounded-xl border-gray-100 bg-white font-black gap-2 text-[10px] uppercase tracking-widest"
                            onClick={() => refetch()}
                        >
                            <RefreshCw className={`h-3.5 w-3.5 text-gray-400 ${isFetching ? 'animate-spin' : ''}`} />
                            <span className="hidden xs:inline">Sync Data</span>
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
                {/* Search & Action Bar */}
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative flex-1 group w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                        <Input
                            placeholder="TRACE (ID, NAME, ROOM)..."
                            className="h-12 pl-11 bg-white border-gray-100 rounded-2xl shadow-sm text-[11px] md:text-sm font-black focus:ring-1 focus:ring-indigo-600 placeholder:text-gray-300 uppercase tracking-tight"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button variant="outline" className="h-12 flex-1 sm:flex-none px-6 rounded-2xl border-gray-100 bg-white font-black gap-2 text-[10px] uppercase tracking-widest shadow-sm">
                            <Filter className="h-4 w-4 text-gray-400" />
                            FILTERS
                        </Button>
                        <Button className="h-12 flex-1 sm:flex-none px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest gap-2 shadow-sm" onClick={() => router.push(`/admin/hostels/${params?.hostelId}/rooms?hostelId=${hostelId}`)}>
                            <Plus className="h-4 w-4" />
                            PROVISION
                        </Button>
                    </div>
                </div>

                {/* Registry Table */}
                <Card className="border border-gray-100 shadow-sm bg-white md:overflow-hidden rounded-[24px]">
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-100">
                                    <TableHead className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Resident Details</TableHead>
                                    <TableHead className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Trace</TableHead>
                                    <TableHead className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Access Node</TableHead>
                                    <TableHead className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">ID Card</TableHead>
                                    <TableHead className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Commencement</TableHead>
                                    <TableHead className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</TableHead>
                                    <TableHead className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ops</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-gray-50">
                                {filteredResidents.map((resident) => (
                                    <TableRow key={resident.id} className="hover:bg-gray-50/30 transition-colors group">
                                        <TableCell className="py-4 px-6">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-gray-100">
                                                    <AvatarImage src={resident.avatar} alt={resident.name} />
                                                    <AvatarFallback className="bg-indigo-50 text-indigo-400 font-black text-xs">{resident.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{resident.name}</span>
                                                    {resident.uid ? (
                                                        <Badge className="w-fit mt-1 bg-gray-50 text-gray-500 border-none text-[8px] font-mono font-black px-1.5 py-0">
                                                            {resident.uid}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">REF: {resident.id.slice(0, 8)}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-3 w-3 text-gray-300" />
                                                    <span className='text-[11px] font-black text-gray-600 uppercase'>{resident.contact}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-3 w-3 text-gray-300" />
                                                    <span className='text-[10px] font-black text-gray-400 uppercase truncate max-w-[150px]'>{resident.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="flex items-center gap-2 bg-indigo-50/50 px-3 py-1.5 rounded-xl border border-indigo-100 w-fit">
                                                <Home className="h-3.5 w-3.5 text-indigo-600" />
                                                <span className="text-[10px] font-black text-indigo-700 uppercase">SYS {resident.room}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <span className="text-[10px] font-mono font-black text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">{resident.cnic}</span>
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-[10px] font-black text-gray-900 uppercase">
                                            {new Date(resident.joinDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <Badge
                                                className={`rounded-full px-3 py-0.5 text-[8px] font-black uppercase tracking-widest border-none shadow-sm ${resident.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}
                                            >
                                                {resident.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-right">
                                            <ResidentActions resident={resident} params={params} hostelId={hostelId} router={router} updateStatus={updateStatus} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y divide-gray-100">
                        {filteredResidents.map((resident) => (
                            <div key={resident.id} className="p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-gray-100">
                                            <AvatarImage src={resident.avatar} alt={resident.name} />
                                            <AvatarFallback className="bg-indigo-50 text-indigo-400 font-black text-xs">{resident.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-black text-gray-900 uppercase tracking-tight truncate max-w-[150px]">{resident.name}</span>
                                            <span className="text-[9px] font-black text-gray-400 uppercase">REF: {resident.id.slice(0, 8)}</span>
                                        </div>
                                    </div>
                                    <ResidentActions resident={resident} params={params} hostelId={hostelId} router={router} updateStatus={updateStatus} />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex flex-col gap-1">
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Access Node</span>
                                        <div className="flex items-center gap-2">
                                            <Home className="h-3 w-3 text-indigo-600" />
                                            <span className="text-[10px] font-black text-gray-900">SYS {resident.room}</span>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex flex-col gap-1">
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Status</span>
                                        <Badge
                                            className={`w-fit rounded-full px-2 py-0 text-[8px] font-black uppercase tracking-widest border-none shadow-sm ${resident.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}
                                        >
                                            {resident.status}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 space-y-2">
                                    <div className="flex items-center justify-between text-[9px] font-black uppercase">
                                        <span className="text-gray-400">Contact Trace</span>
                                        <span className="text-gray-900">{resident.contact}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[9px] font-black uppercase">
                                        <span className="text-gray-400">Commencement</span>
                                        <span className="text-gray-900">{new Date(resident.joinDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[9px] font-black uppercase">
                                        <span className="text-gray-400">ID Verification</span>
                                        <span className="text-gray-900 font-mono">{resident.cnic}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredResidents.length === 0 && (
                        <div className="py-20 flex flex-col items-center border-t border-gray-50 border-dashed mx-6">
                            <User className="h-10 w-10 text-gray-200 mb-4 animate-pulse" />
                            <h3 className="text-base font-black text-gray-900 uppercase">No Matches</h3>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1 text-center">No resident nodes detected for the current query</p>
                        </div>
                    )}
                </Card>


            </main>
        </div>
    )
}

export default function ResidentsPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-6">
                    <div className="h-24 w-24 border-[3px] border-gray-100 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-xl font-black text-gray-900 tracking-tighter uppercase italic">Loading Residents</p>
                </div>
            </div>
        }>
            <ResidentsContent />
        </Suspense>
    );
}
