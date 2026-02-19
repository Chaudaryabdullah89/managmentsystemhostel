"use client"
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Search,
    ArrowLeft,
    Filter,
    Phone,
    Mail,
    Home,
    User,
    MoreVertical,
    ShieldCheck,
    RefreshCw,
    LayoutGrid,
    Plus,
    Edit,
    ArrowUpRight,
    SearchX
} from "lucide-react"
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
import { useRouter } from 'next/navigation'
import useAuthStore from '@/hooks/Authstate'
import { useWardenResidents } from '@/hooks/useWarden'

const WardenResidentsPage = () => {
    const { user } = useAuthStore()
    const router = useRouter()
    const { data: residents, isLoading, isFetching, refetch } = useWardenResidents(user?.id)
    const [searchTerm, setSearchTerm] = useState('')

    const filteredResidents = React.useMemo(() => {
        if (!residents) return []
        return residents.filter(res => {
            const term = searchTerm.toLowerCase()
            const activeBooking = res.Booking?.[0]
            return (
                res.name?.toLowerCase().includes(term) ||
                res.email?.toLowerCase().includes(term) ||
                activeBooking?.Room?.roomNumber?.toLowerCase().includes(term) ||
                res.uid?.toLowerCase().includes(term)
            )
        })
    }, [residents, searchTerm])

    const handleSync = async () => {
        const promise = refetch()
        toast.promise(promise, {
            loading: 'Refreshing residents...',
            success: 'Residents refreshed successfully',
            error: 'Failed to refresh residents'
        })
    }

    if (isLoading) return (
        <div className="flex h-screen items-center justify-center bg-white font-sans">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="h-24 w-24 border-[3px] border-gray-100 border-t-indigo-600 rounded-full animate-spin" />
                    <LayoutGrid className="h-10 w-10 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center space-y-1.5">
                    <p className="text-xl font-black text-gray-900 tracking-tighter uppercase italic">Loading Residents</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Fetching resident data</p>
                </div>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50/50 font-sans">
            {/* Slim Header */}
            <div className="bg-white border-b sticky top-0 z-40 h-16">
                <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-gray-100">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="h-6 w-px bg-gray-200" />
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2 uppercase">
                                <User className="h-5 w-5 text-indigo-600" />
                                Residents
                            </h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-0.5">Warden Panel</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex flex-col items-end mr-4">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Residents</span>
                            <span className="text-sm font-bold text-gray-900 leading-none">{residents?.filter(r => r.isActive).length || 0} Total</span>
                        </div>
                        <Button
                            variant="outline"
                            className="h-10 rounded-xl border-gray-100 bg-white font-bold gap-2 text-xs uppercase tracking-widest"
                            onClick={handleSync}
                        >
                            <RefreshCw className={`h-4 w-4 text-gray-400 ${isFetching ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
                {/* Search & Action Bar */}
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="relative flex-1 group w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                        <Input
                            placeholder="Search by name, email, room or ID..."
                            className="h-12 pl-11 bg-white border-gray-100 rounded-2xl shadow-sm text-sm font-bold focus:ring-1 focus:ring-indigo-600 placeholder:text-gray-300 uppercase tracking-tight"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Button variant="outline" className="h-12 px-6 rounded-2xl border-gray-100 bg-white font-bold gap-2 text-[10px] uppercase tracking-[0.2em] shadow-sm">
                            <Filter className="h-4 w-4 text-gray-400" />
                            Filters
                        </Button>
                        <Button
                            className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-[0.2em] gap-2 shadow-sm"
                            onClick={() => router.push('/warden/residents/register')}
                        >
                            <Plus className="h-4 w-4" />
                            Register User
                        </Button>
                    </div>
                </div>

                {/* Registry Table */}
                <Card className="border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] bg-white overflow-hidden rounded-[24px]">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-100">
                                    <TableHead className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Resident</TableHead>
                                    <TableHead className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact</TableHead>
                                    <TableHead className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Room</TableHead>
                                    <TableHead className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">CNIC</TableHead>
                                    <TableHead className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Join Date</TableHead>
                                    <TableHead className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</TableHead>
                                    <TableHead className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-gray-50">
                                {filteredResidents.length > 0 ? filteredResidents.map((resident) => {
                                    const activeBooking = resident.Booking?.[0]
                                    return (
                                        <TableRow key={resident.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <TableCell className="px-6 py-5">
                                                <Link href={`/warden/residents/${resident.id}`} className="flex items-center gap-4 group/item">
                                                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm ring-1 ring-gray-100 group-hover/item:ring-indigo-200 transition-all">
                                                        <AvatarImage src={resident.image} />
                                                        <AvatarFallback className="bg-indigo-50 text-indigo-700 font-bold text-sm">
                                                            {resident.name?.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-900 group-hover/item:text-indigo-600 transition-colors uppercase tracking-tight">{resident.name}</span>
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <Badge variant="outline" className="bg-gray-50 text-gray-400 border-none text-[8px] font-mono font-bold px-2 py-0.5">
                                                                {resident.uid || resident.id.slice(-8).toUpperCase()}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </Link>
                                            </TableCell>
                                            <TableCell className="py-4 px-6">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-3 w-3 text-gray-300" />
                                                        <span className='text-[11px] font-bold text-gray-600'>{resident.phone || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="h-3 w-3 text-gray-300" />
                                                        <span className='text-[11px] font-bold text-gray-600 truncate max-w-[150px]'>{resident.email}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-6">
                                                <div className="flex items-center gap-2 bg-indigo-50/50 px-3 py-1.5 rounded-xl border border-indigo-100 w-fit">
                                                    <Home className="h-3.5 w-3.5 text-indigo-500" />
                                                    <span className="text-xs font-black text-indigo-900 uppercase">
                                                        {activeBooking?.Room?.roomNumber ? `Room ${activeBooking.Room.roomNumber}` : 'PENDING'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-6">
                                                <span className="text-[11px] font-mono font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                                    {resident.cnic || 'NOT RECORDED'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-4 px-6 text-[11px] font-bold text-gray-900">
                                                {new Date(resident.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                            </TableCell>
                                            <TableCell className="py-4 px-6">
                                                <Badge
                                                    className={`rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] border-none shadow-sm ${resident.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}
                                                >
                                                    {resident.isActive ? 'Active' : 'Offline'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-4 px-6 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-9 w-9 p-0 rounded-full hover:bg-gray-100 text-gray-400">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-gray-100 shadow-2xl font-sans">
                                                        <DropdownMenuItem asChild className="p-3 gap-3 rounded-xl font-bold text-[10px] uppercase tracking-wider text-gray-600 cursor-pointer">
                                                            <Link href={`/warden/residents/${resident.id}`}>
                                                                <User className="h-4 w-4 text-indigo-500" /> View Profile
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild className="p-3 gap-3 rounded-xl font-bold text-[10px] uppercase tracking-wider text-gray-600 cursor-pointer">
                                                            <Link href={`/warden/residents/${resident.id}?tab=complaints&action=log-grievance`}>
                                                                <Edit className="h-4 w-4 text-gray-400" /> File Complaint
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <div className="h-px bg-gray-50 my-1 mx-2" />
                                                        <DropdownMenuItem asChild className="p-3 gap-3 rounded-xl font-bold text-[10px] uppercase tracking-wider text-indigo-600 cursor-pointer">
                                                            <Link href={`/warden/residents/${resident.id}?tab=payments`}>
                                                                <ArrowUpRight className="h-4 w-4" /> View Transactions
                                                            </Link>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )
                                }) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-20 text-center">
                                            <SearchX className="h-12 w-12 text-gray-100 mx-auto mb-4" />
                                            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">No residents found</p>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>


            </main>
        </div>
    )
}

export default WardenResidentsPage
