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
    SearchX,
    Download
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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { toast } from "sonner";
import Loader from "@/components/ui/Loader";

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

    const [isExporting, setIsExporting] = useState(false);

    const handleExportPDF = async () => {
        if (!filteredResidents || filteredResidents.length === 0) {
            toast.error("No residents found to export");
            return;
        }

        setIsExporting(true);
        try {
            const doc = new jsPDF('landscape');
            doc.setFont("helvetica", "bold");

            // Header Section
            doc.setFillColor(30, 58, 138); // blue-900
            doc.rect(0, 0, doc.internal.pageSize.width, 35, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.text("RESIDENT DIRECTORY", doc.internal.pageSize.width / 2, 18, { align: "center" });
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Official Branch Record | Total Residents: ${filteredResidents.length}`, doc.internal.pageSize.width / 2, 26, { align: "center" });

            doc.setTextColor(80, 80, 80);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(`Generated On: ${format(new Date(), 'PPP p')}`, 14, 45);
            doc.text(`Status: Active Directory`, doc.internal.pageSize.width - 14, 45, { align: "right" });

            // Draw Line
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.5);
            doc.line(14, 49, doc.internal.pageSize.width - 14, 49);

            const headers = [
                ["S.No", "Name", "UID", "Room", "Email", "Phone", "CNIC", "Join Date", "Status"]
            ];

            const rows = filteredResidents.map((res, index) => {
                const activeBooking = res.Booking?.[0];
                return [
                    index + 1,
                    res.name || 'N/A',
                    res.uid || res.id.slice(-8).toUpperCase(),
                    activeBooking?.Room?.roomNumber ? `Room ${activeBooking.Room.roomNumber}` : 'N/A',
                    res.email || 'N/A',
                    res.phone || 'N/A',
                    res.cnic || 'N/A',
                    format(new Date(res.createdAt), 'dd/MM/yyyy'),
                    res.isActive ? 'Active' : 'Offline'
                ];
            });

            autoTable(doc, {
                startY: 55,
                head: headers,
                body: rows,
                theme: 'grid',
                headStyles: {
                    fillColor: [30, 58, 138],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 8,
                    halign: 'center'
                },
                bodyStyles: {
                    fontSize: 8,
                    textColor: [50, 50, 50]
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252]
                },
                columnStyles: {
                    0: { cellWidth: 10, halign: 'center' },
                },
                styles: {
                    overflow: 'linebreak',
                    cellPadding: 3,
                    valign: 'middle'
                },
                didDrawPage: function (data) {
                    doc.setFontSize(8);
                    doc.setTextColor(150, 150, 150);
                    doc.text("Page " + doc.internal.getNumberOfPages(), doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: "center" });
                    doc.text("Official GreenView Resident Registry", 14, doc.internal.pageSize.height - 10);
                }
            });

            doc.save(`Resident_Directory_${format(new Date(), 'dd_MM_yyyy')}.pdf`);
            toast.success("Resident Directory Exported!");
        } catch (error) {
            toast.error("Failed to export residents");
            console.error(error);
        } finally {
            setIsExporting(false);
        }
    };

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
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-gray-100 h-8 w-8 md:h-9 md:w-9">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="h-6 w-px bg-gray-200 hidden sm:block" />
                        <div className="flex flex-col">
                            <h1 className="text-sm md:text-lg font-bold text-gray-900 tracking-tight flex items-center gap-1.5 md:gap-2 uppercase">
                                <User className="h-4 w-4 md:h-5 md:w-5 text-indigo-600" />
                                Residents
                            </h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-0.5">Warden Panel</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500 hidden sm:block" />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="hidden lg:flex flex-col items-end mr-4">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Residents</span>
                            <span className="text-sm font-bold text-gray-900 leading-none">{residents?.filter(r => r.isActive).length || 0} Total</span>
                        </div>
                        <Button
                            variant="outline"
                            className="h-8 md:h-10 px-3 md:px-4 rounded-xl border-gray-100 bg-white font-bold gap-1.5 md:gap-2 text-[9px] md:text-xs uppercase tracking-widest shrink-0"
                            onClick={handleExportPDF}
                            disabled={isExporting}
                        >
                            <Download className="h-3.5 w-3.5 text-gray-400" />
                            <span className="hidden sm:inline">Export</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 md:h-10 px-3 md:px-6 rounded-xl border-gray-100 bg-white font-bold gap-1.5 md:gap-2 text-[9px] md:text-xs uppercase tracking-widest shrink-0"
                            onClick={handleSync}
                        >
                            <RefreshCw className={`h-3.5 w-3.5 text-gray-400 ${isFetching ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                            <span className="sm:hidden">Sync</span>
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 min-w-0">
                {/* Search & Action Bar */}
                <div className="flex flex-col md:flex-row items-center gap-3 w-full min-w-0">
                    <div className="relative flex-1 group w-full min-w-0">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                        <Input
                            placeholder="Search residents..."
                            className="h-11 md:h-12 pl-11 bg-white border-gray-100 rounded-2xl shadow-sm text-xs md:text-sm font-bold focus:ring-1 focus:ring-indigo-600 placeholder:text-gray-300 uppercase tracking-tight min-w-0 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                        <Button variant="outline" className="flex-1 md:flex-none h-11 md:h-12 px-4 md:px-6 rounded-2xl border-gray-100 bg-white font-bold gap-2 text-[10px] uppercase tracking-widest shadow-sm">
                            <Filter className="h-4 w-4 text-gray-400 shrink-0" />
                            Filters
                        </Button>
                        <Button
                            className="flex-1 md:flex-none h-11 md:h-12 px-4 md:px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-widest gap-2 shadow-sm whitespace-nowrap"
                            onClick={() => router.push('/warden/residents/register')}
                        >
                            <Plus className="h-4 w-4 shrink-0" />
                            <span>Register</span>
                        </Button>
                    </div>
                </div>

                {/* Registry View */}
                <Card className="border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] bg-white overflow-hidden rounded-[24px] min-w-0">
                    <div className="overflow-x-auto min-w-0 scrollbar-hide">
                        <Table className="min-w-[800px] md:min-w-full">
                            <TableHeader>
                                <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-100">
                                    <TableHead className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Resident</TableHead>
                                    <TableHead className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap hidden md:table-cell">Communication</TableHead>
                                    <TableHead className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Asset Node</TableHead>
                                    <TableHead className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap hidden lg:table-cell">Identity</TableHead>
                                    <TableHead className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap hidden lg:table-cell">Joined</TableHead>
                                    <TableHead className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">State</TableHead>
                                    <TableHead className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Audit</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-gray-50">
                                {filteredResidents.length > 0 ? filteredResidents.map((resident) => {
                                    const activeBooking = resident.Booking?.[0]
                                    return (
                                        <TableRow key={resident.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <TableCell className="px-4 md:px-6 py-4 md:py-5 min-w-0">
                                                <Link href={`/warden/residents/${resident.id}`} className="flex items-center gap-3 md:gap-4 group/item min-w-0">
                                                    <Avatar className="h-10 w-10 md:h-12 md:w-12 border-2 border-white shadow-sm ring-1 ring-gray-100 group-hover/item:ring-indigo-200 transition-all shrink-0">
                                                        <AvatarImage src={resident.image} />
                                                        <AvatarFallback className="bg-indigo-50 text-indigo-700 font-bold text-xs md:text-sm">
                                                            {resident.name?.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-bold text-[13px] md:text-sm text-gray-900 group-hover/item:text-indigo-600 transition-colors uppercase tracking-tight truncate">{resident.name}</span>
                                                        <div className="flex items-center gap-1.5 mt-0.5 md:mt-1">
                                                            <Badge variant="outline" className="bg-gray-50 text-gray-400 border-none text-[8px] font-mono font-bold px-1.5 md:px-2 py-0.5 truncate uppercase">
                                                                {resident.uid || resident.id.slice(-8).toUpperCase()}
                                                            </Badge>
                                                        </div>
                                                        {/* Tablet/Mobile secondary info */}
                                                        <div className="flex flex-col md:hidden mt-1 gap-0.5">
                                                            <span className="text-[9px] font-bold text-gray-400 truncate">{resident.phone || 'No Phone'}</span>
                                                        </div>
                                                    </div>
                                                </Link>
                                            </TableCell>
                                            <TableCell className="py-4 px-6 hidden md:table-cell">
                                                <div className="flex flex-col gap-1.5 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-3 w-3 text-gray-300 shrink-0" />
                                                        <span className='text-[10px] font-bold text-gray-600 truncate'>{resident.phone || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="h-3 w-3 text-gray-300 shrink-0" />
                                                        <span className='text-[10px] font-bold text-gray-600 truncate max-w-[120px] md:max-w-[150px]'>{resident.email}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-4 md:px-6 text-center lg:text-left">
                                                <div className="flex items-center gap-1.5 md:gap-2 bg-indigo-50/50 px-2 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl border border-indigo-100 w-fit">
                                                    <Home className="h-3 w-3 md:h-3.5 md:w-3.5 text-indigo-500 shrink-0" />
                                                    <span className="text-[10px] md:text-xs font-black text-indigo-900 uppercase whitespace-nowrap">
                                                        {activeBooking?.Room?.roomNumber ? `R-${activeBooking.Room.roomNumber}` : 'PENDING'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-6 hidden lg:table-cell">
                                                <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100 whitespace-nowrap">
                                                    {resident.cnic || 'NOT RECORDED'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-4 px-6 text-[10px] font-bold text-gray-900 hidden lg:table-cell whitespace-nowrap">
                                                {format(new Date(resident.createdAt), 'MMM dd, yyyy')}
                                            </TableCell>
                                            <TableCell className="py-4 px-4 md:px-6">
                                                <Badge
                                                    className={`rounded-full px-2 md:px-3 py-0.5 text-[8px] md:text-[9px] font-black uppercase tracking-wider border-none shadow-sm whitespace-nowrap ${resident.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}
                                                >
                                                    {resident.isActive ? 'Active' : 'Offline'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-4 px-4 md:px-6 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 md:h-9 md:w-9 p-0 rounded-full hover:bg-gray-100 text-gray-400">
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
                                        <TableCell colSpan={7} className="py-16 md:py-20 text-center">
                                            <SearchX className="h-10 w-10 md:h-12 md:w-12 text-gray-100 mx-auto mb-4" />
                                            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">No residents found</p>
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
