"use client"
import React, { useState, use } from 'react'
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    ArrowLeft,
    User,
    Phone,
    Mail,
    CreditCard,
    Calendar,
    Home,
    FileText,
    ArrowUpRight,
    MapPin,
    Building2,
    DollarSign,
    AlertCircle,
    Wrench,
    CheckCircle2,
    Clock,
    Download,
    Edit,
    RefreshCw,
    ShieldCheck,
    Contact2,
    History,
    Zap,
    Plus,
    Receipt,
    ExternalLink,
    Eye,
    Activity,
    Trash2,
    UserX,
    Loader2,
    Trash
} from "lucide-react"
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useParams, useRouter } from 'next/navigation'
import { useUserDetailedProfile } from "@/hooks/useusers"
import { useUpdateBookingStatus } from "@/hooks/useBooking"
import { useCreateComplaint } from "@/hooks/usecomplaints"
import { useCreatePayment } from "@/hooks/usePayment"
import { format, isValid } from "date-fns"
import { toast } from "sonner"
import { generateInvoice } from "@/lib/utils/invoice-generator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const ResidentDetailPage = ({ params: paramsPromise }) => {
    const params = use(paramsPromise)
    const router = useRouter()
    const { hostelId, residentId } = params || {}
    const { data: resident, isLoading, isFetching, refetch } = useUserDetailedProfile(residentId)
    const updateBookingStatus = useUpdateBookingStatus()
    const createComplaint = useCreateComplaint()
    const createPayment = useCreatePayment()

    const [isCheckingOut, setIsCheckingOut] = useState(false)
    const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false)
    const [isGrievanceDialogOpen, setIsGrievanceDialogOpen] = useState(false)

    // Invoice Form State
    const [invoiceForm, setInvoiceForm] = useState({
        amount: "",
        type: "RENT",
        dueDate: "",
        notes: ""
    })

    // Grievance Form State
    const [grievanceForm, setGrievanceForm] = useState({
        title: "",
        category: "GENERAL",
        priority: "MEDIUM",
        description: ""
    })

    const safeFormat = (date, formatStr, fallback = 'N/A') => {
        if (!date) return fallback;
        const d = new Date(date);
        if (!isValid(d)) return fallback;
        return format(d, formatStr);
    }

    const getStatusTheme = (status) => {
        const s = status?.toUpperCase()
        if (s === 'ACTIVE' || s === 'COMPLETED' || s === 'RESOLVED' || s === 'PAID')
            return "bg-green-50 text-green-700 border-green-100"
        if (s === 'IN_PROGRESS' || s === 'CONFIRMED' || s === 'CHECKED_IN')
            return "bg-blue-50 text-blue-700 border-blue-100"
        if (s === 'PENDING' || s === 'PARTIAL')
            return "bg-yellow-50 text-yellow-700 border-yellow-100"
        if (s === 'CANCELLED' || s === 'OVERDUE' || s === 'REJECTED')
            return "bg-red-50 text-red-700 border-red-100"
        return "bg-gray-50 text-gray-700 border-gray-100"
    }

    const handleGenerateInvoice = async () => {
        if (!activeBooking) return toast.error("No active booking found");
        if (!invoiceForm.amount || !invoiceForm.dueDate) return toast.error("Please fill all required fields");

        try {
            await createPayment.mutateAsync({
                userId: residentId,
                bookingId: activeBooking.id,
                amount: invoiceForm.amount,
                dueDate: invoiceForm.dueDate,
                type: invoiceForm.type,
                notes: invoiceForm.notes,
                status: "PENDING"
            });
            setIsInvoiceDialogOpen(false);
            setInvoiceForm({ amount: "", type: "RENT", dueDate: "", notes: "" });
            refetch();
        } catch (error) {
            console.error("Invoice generation failed:", error);
        }
    }

    const handleReportGrievance = async () => {
        if (!grievanceForm.title || !grievanceForm.description) return toast.error("Please fill all required fields");

        const effectiveHostelId = activeBooking?.room?.Hostel?.id || resident.residentProfile?.currentHostelId || hostelId;

        try {
            await createComplaint.mutateAsync({
                userId: residentId,
                hostelId: effectiveHostelId,
                roomNumber: currentRoom?.roomNumber || "N/A",
                title: grievanceForm.title,
                category: grievanceForm.category,
                priority: grievanceForm.priority,
                description: grievanceForm.description
            });
            setIsGrievanceDialogOpen(false);
            setGrievanceForm({ title: "", category: "GENERAL", priority: "MEDIUM", description: "" });
            refetch();
        } catch (error) {
            console.error("Grievance logging failed:", error);
        }
    }

    const handleCheckout = async () => {
        const activeBooking = resident.bookings?.find(b => b.status === 'CONFIRMED' || b.status === 'CHECKED_IN')
        if (!activeBooking) {
            toast.error("No active booking identified for checkout.")
            return;
        }

        try {
            await updateBookingStatus.mutateAsync({
                id: activeBooking.id,
                status: 'COMPLETED'
            })
            toast.success("Resident checked out successfully")
            refetch()
        } catch (error) {
            console.error("Checkout failed:", error)
        } finally {
            setIsCheckingOut(false)
        }
    }

    if (isLoading) return (
        <div className="flex h-screen items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                <p className="text-sm font-medium text-gray-500">Loading resident details...</p>
            </div>
        </div>
    )

    if (!resident) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900">Resident not found</h2>
                <Button onClick={() => router.back()} className="mt-4">Back to List</Button>
            </div>
        </div>
    )

    const activeBooking = resident.bookings?.find(b => b.status === 'CONFIRMED' || b.status === 'CHECKED_IN')
    const currentRoom = activeBooking?.room

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 leading-none">{resident.name}</h1>
                            <p className="text-xs text-gray-500 mt-1">Resident ID: {resident.id?.slice(-8).toUpperCase()}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refetch()}
                            disabled={isFetching}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button size="sm" onClick={() => router.push(`/admin/users/${residentId}`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Profile
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Basic Info */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="overflow-hidden border-none shadow-sm">
                            <CardContent className="p-8 flex flex-col items-center text-center">
                                <Avatar className="h-32 w-32 border-4 border-white shadow-md mb-6">
                                    <AvatarImage src={resident.image} />
                                    <AvatarFallback className="text-3xl font-bold bg-gray-100 text-gray-600">
                                        {resident.name?.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                </Avatar>
                                <h2 className="text-xl font-bold text-gray-900">{resident.name}</h2>
                                <p className="text-sm text-gray-500 mb-6">{resident.email}</p>

                                <div className="w-full space-y-4 text-left">
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                        <span>{resident.phone || 'No phone provided'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <MapPin className="h-4 w-4 text-gray-400" />
                                        <span className="line-clamp-2">{resident.address || 'No address provided'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <CreditCard className="h-4 w-4 text-gray-400" />
                                        <span>CNIC: {resident.cnic || 'N/A'}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-xs font-bold uppercase tracking-wider"
                                    onClick={() => activeBooking ? router.push(`/admin/bookings/${activeBooking.id}/payments`) : toast.error("No active booking found")}
                                >
                                    <DollarSign className="h-4 w-4 mr-2 text-green-600" /> Manage Payments
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-xs font-bold uppercase tracking-wider group"
                                    onClick={() => setIsInvoiceDialogOpen(true)}
                                >
                                    <Receipt className="h-4 w-4 mr-2 text-blue-600" />
                                    <span>Generate Invoice</span>
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-xs font-bold uppercase tracking-wider text-red-600 hover:text-red-700 hover:bg-red-50"
                                            disabled={isCheckingOut || !activeBooking}
                                        >
                                            {isCheckingOut ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserX className="h-4 w-4 mr-2" />}
                                            Checkout Resident
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="text-xl font-bold">Checkout Resident?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to checkout <span className="font-bold text-gray-900">{resident.name}</span>? This will mark the room as vacant and end their stay.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                className="bg-red-600 hover:bg-red-700 rounded-xl font-bold"
                                                onClick={() => {
                                                    setIsCheckingOut(true)
                                                    handleCheckout()
                                                }}
                                            >
                                                Yes, Checkout
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Detailed Info & History */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Card className="border-none shadow-sm py-2 group cursor-pointer hover:bg-white transition-colors" onClick={() => currentRoom?.id && router.push(`/admin/hostels/${hostelId}/room-details/room/${currentRoom.id}`)}>
                                <CardContent className="flex items-center gap-4 py-4">
                                    <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                                        <Home className="h-5 w-5 text-blue-600 group-hover:text-white transition-colors" />
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-xs font-medium text-gray-500">Room</p>
                                        <p className="text-base font-bold text-gray-900 flex items-center gap-1">
                                            {currentRoom?.roomNumber ? `Room ${currentRoom.roomNumber}` : 'Not Assigned'}
                                            <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-none shadow-sm py-2">
                                <CardContent className="flex items-center gap-4 py-4">
                                    <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center">
                                        <DollarSign className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500">Total Paid</p>
                                        <p className="text-base font-bold text-gray-900">Rs. {resident.payments?.reduce((acc, p) => acc + (p.status === 'PAID' ? p.amount : 0), 0).toLocaleString()}</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-none shadow-sm py-2">
                                <CardContent className="flex items-center gap-4 py-4">
                                    <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center">
                                        <AlertCircle className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500">Complaints</p>
                                        <p className="text-base font-bold text-gray-900">{resident.complaints?.filter(c => c.status !== 'RESOLVED').length || 0} Active</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Tabs content */}
                        <Tabs defaultValue="payments" className="w-full bg-transparent">
                            <TabsList className="bg-white border p-1 rounded-xl h-12 w-full justify-start gap-2 mb-6 shadow-sm overflow-x-auto">
                                <TabsTrigger value="payments" className="rounded-lg px-6 font-bold text-xs uppercase tracking-wider">Payment History</TabsTrigger>
                                <TabsTrigger value="complaints" className="rounded-lg px-6 font-bold text-xs uppercase tracking-wider">Maintenance & Complaints</TabsTrigger>
                                <TabsTrigger value="profileplus" className="rounded-lg px-6 font-bold text-xs uppercase tracking-wider">Additional Profile</TabsTrigger>
                            </TabsList>

                            <TabsContent value="payments" className="mt-0">
                                <Card className="border-none shadow-sm overflow-hidden bg-white rounded-2xl">
                                    <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                                        <div>
                                            <h3 className="font-black text-gray-900 uppercase tracking-tighter text-lg">Payments</h3>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">All payment records</p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="rounded-xl border-gray-100 font-bold text-[10px] uppercase tracking-widest h-10 px-4"
                                            onClick={() => activeBooking ? router.push(`/admin/bookings/${activeBooking.id}/payments`) : toast.error("No active booking found")}
                                        >
                                            <Plus className="h-3.5 w-3.5 mr-2 text-blue-600" /> New Transaction
                                        </Button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-gray-50/50">
                                                <TableRow className="hover:bg-transparent border-gray-50">
                                                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 px-6 text-gray-400">Date</TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 px-6 text-gray-400">Type</TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 px-6 text-gray-400">Amount</TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 px-6 text-gray-400">Method</TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 px-6 text-gray-400">Status</TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 px-6 text-gray-400 text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {resident.payments?.length > 0 ? (
                                                    resident.payments.map((p) => (
                                                        <TableRow key={p.id} className="hover:bg-gray-50/30 transition-colors group">
                                                            <TableCell className="py-5 px-6">
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-bold text-gray-900 italic tracking-tight">{safeFormat(p.date, 'MMM dd, yyyy')}</span>
                                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{safeFormat(p.date, 'HH:mm:ss')}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-5 px-6">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                                                                        <Receipt className="h-4 w-4 text-gray-400" />
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-xs font-black text-gray-800 uppercase tracking-tight">{p.type}</span>
                                                                        <span className="text-[10px] font-mono font-bold text-blue-500 uppercase tracking-tighter cursor-pointer hover:underline">#{p.id.slice(-8).toUpperCase()}</span>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-5 px-6">
                                                                <span className="text-sm font-black text-gray-900">Rs. {p.amount.toLocaleString()}</span>
                                                            </TableCell>
                                                            <TableCell className="py-5 px-6">
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider bg-gray-50/50 border-gray-100 px-2 py-0.5 rounded-md">
                                                                        {p.method === 'CASH' ? 'Physical' : 'Digital'}
                                                                    </Badge>
                                                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{p.method}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-5 px-6">
                                                                <Badge className={`${getStatusTheme(p.status)} border-none rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.1em] shadow-sm`}>
                                                                    {p.status}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="py-5 px-6 text-right">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 rounded-lg hover:bg-gray-100"
                                                                        onClick={() => activeBooking && router.push(`/admin/bookings/${activeBooking.id}/payments`)}
                                                                    >
                                                                        <Eye className="h-4 w-4 text-gray-400" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 rounded-lg hover:bg-gray-100"
                                                                        onClick={() => {
                                                                            if (!activeBooking) return toast.error("Booking context missing");
                                                                            generateInvoice(p, { ...activeBooking, User: resident });
                                                                            toast.success("Invoice generated successfully");
                                                                        }}
                                                                    >
                                                                        <Download className="h-4 w-4 text-gray-400" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="py-20 text-center">
                                                            <div className="flex flex-col items-center gap-3 opacity-20">
                                                                <History className="h-12 w-12" />
                                                                <span className="text-xs font-black uppercase tracking-[0.2em]">No payments found</span>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </Card>
                            </TabsContent>

                            <TabsContent value="complaints" className="mt-0">
                                <Card className="border-none shadow-sm overflow-hidden bg-white rounded-2xl">
                                    <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                                        <div>
                                            <h3 className="font-black text-gray-900 uppercase tracking-tighter text-lg">Complaints</h3>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Support & Maintenance</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-dashed border-gray-200 font-black text-[10px] uppercase tracking-widest h-10 px-4 rounded-xl hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all"
                                            onClick={() => setIsGrievanceDialogOpen(true)}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Complaint
                                        </Button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-gray-50/50">
                                                <TableRow className="hover:bg-transparent border-gray-50">
                                                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 px-6 text-gray-400">Issue</TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 px-6 text-gray-400">Category</TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 px-6 text-gray-400">Date Logged</TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 px-6 text-gray-400">Priority</TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 px-6 text-gray-400">Status</TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 px-6 text-gray-400 text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {resident.complaints?.length > 0 ? (
                                                    resident.complaints.map((c) => (
                                                        <TableRow key={c.id} className="hover:bg-gray-50/30 transition-colors group">
                                                            <TableCell className="py-5 px-6">
                                                                <div className="flex flex-col">
                                                                    <p className="text-sm font-black text-gray-900 uppercase tracking-tight line-clamp-1">{c.title || 'Untitled Issue'}</p>
                                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter line-clamp-1">{c.description || 'No detailed dossier provided.'}</p>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-5 px-6">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-6 w-6 rounded-md bg-gray-50 flex items-center justify-center border border-gray-100">
                                                                        <Activity className="h-3 w-3 text-gray-400" />
                                                                    </div>
                                                                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-wider">
                                                                        {c.category || 'General'}
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-5 px-6 text-xs font-bold text-gray-700 italic">
                                                                {safeFormat(c.createdAt, 'MMM dd, yyyy')}
                                                            </TableCell>
                                                            <TableCell className="py-5 px-6 text-xs font-bold">
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${c.priority === 'HIGH' || c.priority === 'URGENT' ? 'bg-red-500' :
                                                                        c.priority === 'MEDIUM' ? 'bg-orange-500' : 'bg-blue-500'
                                                                        }`} />
                                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${c.priority === 'HIGH' || c.priority === 'URGENT' ? 'text-red-600' :
                                                                        c.priority === 'MEDIUM' ? 'text-orange-600' : 'text-blue-600'
                                                                        }`}>
                                                                        {c.priority || 'NORMAL'}
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-5 px-6">
                                                                <Badge className={`${getStatusTheme(c.status)} border-none rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.1em] shadow-sm`}>
                                                                    {c.status || 'PENDING'}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="py-5 px-6 text-right">
                                                                <Button variant="ghost" size="icon" className="h-9 w-9 p-0 rounded-full hover:bg-gray-100 text-gray-400 group-hover:text-black transition-colors" onClick={() => toast.info("Authenticating detailed view...")}>
                                                                    <ArrowUpRight className="h-4 w-4" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="py-20 text-center">
                                                            <div className="flex flex-col items-center gap-3 opacity-20">
                                                                <ShieldCheck className="h-12 w-12" />
                                                                <span className="text-xs font-black uppercase tracking-[0.2em]">No complaints yet</span>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </Card>
                            </TabsContent>

                            <TabsContent value="profileplus" className="mt-0 space-y-4">
                                <Card className="border-none shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-base font-bold text-gray-900">Personal Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Father's Name</p>
                                            <p className="text-sm font-semibold text-gray-900">{resident.residentProfile?.guardianName || 'Not entered'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Date of Birth</p>
                                            <p className="text-sm font-semibold text-gray-900">{safeFormat(resident.residentProfile?.dob, 'MMM dd, yyyy')}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Blood Group</p>
                                            <p className="text-sm font-semibold text-gray-900">{resident.residentProfile?.bloodGroup || 'Not entered'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Emergency Contact</p>
                                            <p className="text-sm font-semibold text-gray-900">{resident.residentProfile?.emergencyContact || 'Not entered'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Institution / Employer</p>
                                            <p className="text-sm font-semibold text-gray-900">{resident.residentProfile?.institution || resident.residentProfile?.occupation || 'Not entered'}</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-sm pb-4">
                                    <CardHeader>
                                        <CardTitle className="text-base font-bold text-gray-900">Documents</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {resident.residentProfile?.documents && Object.keys(resident.residentProfile.documents).length > 0 ? (
                                            Object.entries(resident.residentProfile.documents).map(([key, value], idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="h-4 w-4 text-gray-400" />
                                                        <span className="text-sm font-semibold text-gray-700">{key}</span>
                                                    </div>
                                                    <Button variant="ghost" size="sm" className="h-8 text-blue-600 hover:text-blue-700 font-bold text-xs uppercase" onClick={() => toast.info(`Viewing ${key}`)}>
                                                        View
                                                    </Button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-6 text-center text-gray-400 text-sm italic">No documents uploaded</div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </main>
            {/* Invoice Dialog */}
            <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">Generate Invoice</DialogTitle>
                        <DialogDescription className="text-xs uppercase tracking-widest font-bold text-gray-400">Administrative Billing Details</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Invoice Amount (PKR)</Label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                className="h-11 rounded-xl bg-gray-50 border-gray-100 font-bold"
                                value={invoiceForm.amount}
                                onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Payment Type</Label>
                                <Select value={invoiceForm.type} onValueChange={(v) => setInvoiceForm({ ...invoiceForm, type: v })}>
                                    <SelectTrigger className="h-11 rounded-xl bg-gray-50 border-gray-100 font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="RENT">Monthly Rent</SelectItem>
                                        <SelectItem value="MESS">Mess Charges</SelectItem>
                                        <SelectItem value="LAUNDRY">Laundry Fee</SelectItem>
                                        <SelectItem value="FINE">Policy Violation Fine</SelectItem>
                                        <SelectItem value="OTHER">Miscellaneous</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Due Date</Label>
                                <Input
                                    type="date"
                                    className="h-11 rounded-xl bg-gray-50 border-gray-100 font-bold"
                                    value={invoiceForm.dueDate}
                                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Notes</Label>
                            <Textarea
                                placeholder="Details for the resident..."
                                className="min-h-[80px] rounded-xl bg-gray-50 border-gray-100 font-medium resize-none shadow-none focus:ring-1 focus:ring-black"
                                value={invoiceForm.notes}
                                onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" className="rounded-xl font-bold text-[10px] uppercase tracking-widest" onClick={() => setIsInvoiceDialogOpen(false)}>Cancel</Button>
                        <Button
                            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-widest px-8 h-11 transition-all"
                            onClick={handleGenerateInvoice}
                            disabled={createPayment.isPending}
                        >
                            {createPayment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Invoice"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Grievance Dialog */}
            <Dialog open={isGrievanceDialogOpen} onOpenChange={setIsGrievanceDialogOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">Add Resident Complaint</DialogTitle>
                        <DialogDescription className="text-xs uppercase tracking-widest font-bold text-gray-400">Complaint Details</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Subject</Label>
                            <Input
                                placeholder="Quick summary of the issue..."
                                className="h-11 rounded-xl bg-gray-50 border-gray-100 font-bold"
                                value={grievanceForm.title}
                                onChange={(e) => setGrievanceForm({ ...grievanceForm, title: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Category</Label>
                                <Select value={grievanceForm.category} onValueChange={(v) => setGrievanceForm({ ...grievanceForm, category: v })}>
                                    <SelectTrigger className="h-11 rounded-xl bg-gray-50 border-gray-100 font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                                        <SelectItem value="MESS">Mess/Food</SelectItem>
                                        <SelectItem value="CLEANING">Cleaning</SelectItem>
                                        <SelectItem value="LAUNDRY">Laundry</SelectItem>
                                        <SelectItem value="SECURITY">Security</SelectItem>
                                        <SelectItem value="GENERAL">General</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Priority</Label>
                                <Select value={grievanceForm.priority} onValueChange={(v) => setGrievanceForm({ ...grievanceForm, priority: v })}>
                                    <SelectTrigger className="h-11 rounded-xl bg-gray-50 border-gray-100 font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="LOW">Low</SelectItem>
                                        <SelectItem value="MEDIUM">Medium</SelectItem>
                                        <SelectItem value="HIGH">High</SelectItem>
                                        <SelectItem value="URGENT">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Description</Label>
                            <Textarea
                                placeholder="Comprehensive description of the grievance..."
                                className="min-h-[100px] rounded-xl bg-gray-50 border-gray-100 font-medium resize-none shadow-none focus:ring-1 focus:ring-black"
                                value={grievanceForm.description}
                                onChange={(e) => setGrievanceForm({ ...grievanceForm, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" className="rounded-xl font-bold text-[10px] uppercase tracking-widest" onClick={() => setIsGrievanceDialogOpen(false)}>Cancel</Button>
                        <Button
                            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-widest px-8 h-11 transition-all"
                            onClick={handleReportGrievance}
                            disabled={createComplaint.isPending}
                        >
                            {createComplaint.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Complaint"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default ResidentDetailPage
