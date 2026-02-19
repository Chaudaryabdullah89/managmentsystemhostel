"use client"
import React, { useState, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ArrowLeft, Filter, Phone, Mail, Home, User, MoreVertical, ShieldCheck, RefreshCw, LayoutGrid, Plus, Edit } from "lucide-react"
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

    if (isLoading) return (
        <div className="flex h-screen items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="h-24 w-24 border-[3px] border-gray-100 border-t-blue-500 rounded-full animate-spin" />
                    <LayoutGrid className="h-10 w-10 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center space-y-1.5">
                    <p className="text-xl font-black text-gray-900 tracking-tighter uppercase italic">Loading Residents</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Fetching resident records</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Slim Header */}
            <div className="bg-white border-b sticky top-0 z-40 h-16">
                <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-gray-100">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="h-6 w-px bg-gray-200" />
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
                                <User className="h-5 w-5 text-blue-600" />
                                Residents
                            </h1>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-0.5">{decodeURIComponent(params?.hostelId || hostelId)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex flex-col items-end mr-4">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Residents</span>
                            <span className="text-sm font-bold text-gray-900 leading-none">{residents.filter(r => r.status === 'Active').length} PPL</span>
                        </div>
                        <Button
                            variant="outline"
                            className="h-10 rounded-xl border-gray-100 bg-white font-bold gap-2 text-xs"
                            onClick={() => refetch()}
                        >
                            <RefreshCw className={`h-4 w-4 text-gray-400 ${isFetching ? 'animate-spin' : ''}`} />
                            Refresh Records
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
                {/* Search & Action Bar */}
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="relative flex-1 group w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-black transition-colors" />
                        <Input
                            placeholder="Universal Search (ID, Name, Room)..."
                            className="h-12 pl-11 bg-white border-gray-100 rounded-2xl shadow-sm text-sm font-bold focus:ring-1 focus:ring-black placeholder:text-gray-300"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Button variant="outline" className="h-12 px-6 rounded-2xl border-gray-100 bg-white font-bold gap-2 text-xs shadow-sm">
                            <Filter className="h-4 w-4 text-gray-400" />
                            FILTERS
                        </Button>
                        <Button className="h-12 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-2 shadow-sm" onClick={() => router.push(`/admin/hostels/${params?.hostelId}/rooms?hostelId=${hostelId}`)}>
                            <Plus className="h-4 w-4" />
                            ADD RESIDENT
                        </Button>
                    </div>
                </div>

                {/* Registry Table */}
                <Card className="border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] bg-white overflow-hidden rounded-[24px]">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-100">
                                    <TableHead className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Resident Details</TableHead>
                                    <TableHead className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact</TableHead>
                                    <TableHead className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Room</TableHead>
                                    <TableHead className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">CNIC</TableHead>
                                    <TableHead className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Start Date</TableHead>
                                    <TableHead className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</TableHead>
                                    <TableHead className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-gray-50">
                                {filteredResidents.map((resident) => (
                                    <TableRow key={resident.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <TableCell className="py-4 px-6">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-gray-100">
                                                    <AvatarImage src={resident.avatar} alt={resident.name} />
                                                    <AvatarFallback className="bg-gray-50 text-gray-400 font-bold text-xs">{resident.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{resident.name}</span>
                                                    {resident.uid ? (
                                                        <Badge className="w-fit mt-1 bg-gray-100 text-gray-600 border-none text-[8px] font-mono font-bold px-1.5 py-0">
                                                            {resident.uid}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">#{resident.id.slice(0, 8)}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-3 w-3 text-gray-300" />
                                                    <span className='text-[11px] font-bold text-gray-600'>{resident.contact}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-3 w-3 text-gray-300" />
                                                    <span className='text-[11px] font-bold text-gray-600'>{resident.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 w-fit">
                                                <Home className="h-3.5 w-3.5 text-blue-500" />
                                                <span className="text-xs font-black text-gray-900">Room {resident.room}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <span className="text-[11px] font-mono font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">{resident.cnic}</span>
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-[11px] font-bold text-gray-900">
                                            {new Date(resident.joinDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <Badge
                                                className={`rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] border-none shadow-sm ${resident.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}
                                            >
                                                {resident.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-9 w-9 p-0 rounded-full hover:bg-gray-100 text-gray-400">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-gray-100 shadow-2xl">
                                                    <DropdownMenuItem asChild className="p-3 gap-3 rounded-xl font-bold text-[11px] uppercase tracking-wider text-gray-600 cursor-pointer">
                                                        <Link href={`/admin/hostels/${params?.hostelId}/residents/${resident.id}?hostelId=${hostelId}`}>
                                                            <User className="h-4 w-4" /> View Profile
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="p-3 gap-3 rounded-xl font-bold text-[11px] uppercase tracking-wider text-gray-600 cursor-pointer"
                                                        onClick={() => router.push(`/admin/users/${resident.id}`)}
                                                    >
                                                        <Edit className="h-4 w-4" /> Edit Info
                                                    </DropdownMenuItem>
                                                    <div className="h-px bg-gray-50 my-1 mx-2" />
                                                    <DropdownMenuItem
                                                        className="p-3 gap-3 rounded-xl font-bold text-[11px] uppercase tracking-wider text-red-500 focus:bg-red-50 focus:text-red-600 cursor-pointer"
                                                        onSelect={(e) => e.preventDefault()}
                                                    >
                                                        <AlertDialog>
                                                            <AlertDialogTrigger className="w-full text-left flex items-center gap-3">
                                                                <Trash className="h-4 w-4" /> Remove Resident
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle className="text-xl font-bold">Remove Resident?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Are you sure you want to remove <span className="font-bold text-gray-900">{resident.name}</span> from this hostel? This will cancel their current booking.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        className="bg-red-600 hover:bg-red-700 rounded-xl font-bold"
                                                                        onClick={() => updateStatus({ id: resident.bookingId, status: 'CANCELLED' })}
                                                                    >
                                                                        Yes, Remove
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>

                {/* Audit Layer */}
                <div className="pt-8 border-t border-gray-200 border-dashed">
                    <Card className="border border-gray-200 bg-gray-900 shadow-xl overflow-hidden p-8 relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <ShieldCheck className="h-24 w-24 text-white" />
                        </div>
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10">
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Resident Audit</p>
                                <h3 className="text-2xl font-black text-white tracking-tighter">Resident Records</h3>
                                <p className="text-gray-400 text-xs font-bold leading-relaxed max-w-xl uppercase">All resident records are securely stored. Administrative access is required for sensitive modifications.</p>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
                                <RefreshCw className="h-3.5 w-3.5 text-blue-500" />
                                <span className="text-[10px] font-mono font-bold text-gray-400">LAST SYNC: {new Date().toLocaleTimeString()}</span>
                            </div>
                        </div>
                    </Card>
                </div>
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
