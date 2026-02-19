"use client"
import React, { useState, use, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    ChevronRight,
    Info,
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
    Loader2
} from "lucide-react"
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useParams, useRouter, useSearchParams } from 'next/navigation'
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
import useAuthStore from '@/hooks/Authstate'

const WardenResidentDetailPage = () => {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const defaultTab = searchParams.get('tab') || 'payments'
    const { residentId } = params || {}
    const { user: currentWarden } = useAuthStore()
    const { data: resident, isLoading, isFetching, refetch } = useUserDetailedProfile(residentId)
    const updateBookingStatus = useUpdateBookingStatus()
    const createComplaint = useCreateComplaint()
    const createPayment = useCreatePayment()

    // Strict Hostel Access Control
    useEffect(() => {
        if (resident && currentWarden?.hostelId && currentWarden.role === 'WARDEN') {
            const residentHostelId = resident.hostelId || resident.ResidentProfile?.currentHostelId || resident.bookings?.find(b => b.status === 'CHECKED_IN' || b.status === 'CONFIRMED')?.Room?.hostelId;
            if (residentHostelId && residentHostelId !== currentWarden.hostelId) {
                toast.error("Security Alert: Data boundary breach detected.");
                router.push('/warden/residents');
            }
        }
    }, [resident, currentWarden, router]);

    const [isCheckingOut, setIsCheckingOut] = useState(false)
    const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false)
    const [isGrievanceDialogOpen, setIsGrievanceDialogOpen] = useState(false)

    // Handle Quick Actions from URL
    useEffect(() => {
        const action = searchParams.get('action')
        if (action === 'log-grievance') {
            setIsGrievanceDialogOpen(true)
        } else if (action === 'issue-invoice') {
            setIsInvoiceDialogOpen(true)
        }
    }, [searchParams])

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

    // Unified Booking Resolution: Priority given to LIVE/CONFIRMED nodes
    const activeBooking = resident?.bookings?.find(b => b.status === 'CONFIRMED' || b.status === 'CHECKED_IN') || resident?.bookings?.[0];
    const currentRoom = activeBooking?.room;

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

        const effectiveHostelId = activeBooking?.room?.Hostel?.id || resident?.residentProfile?.currentHostelId || currentWarden?.hostelId;

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
        if (!activeBooking) {
            toast.error("No active booking identified for checkout.")
            return;
        }

        if (confirm(`Are you sure you want to checkout ${resident.name}? This will mark the room as vacant.`)) {
            setIsCheckingOut(true)
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

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-30 h-16">
                <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="h-6 w-px bg-gray-200" />
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 leading-none uppercase tracking-tight">{resident.name}</h1>
                            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest flex items-center gap-2">
                                <span className="h-1 w-1 rounded-full bg-indigo-500" />
                                Resident ID: {resident.id?.slice(-8).toUpperCase()} • Warden Access
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="h-9 px-4 rounded-xl border-gray-200 font-bold text-[10px] uppercase tracking-wider text-gray-600 hover:bg-gray-50"
                            onClick={() => refetch()}
                            disabled={isFetching}
                        >
                            <RefreshCw className={`h-3.5 w-3.5 mr-2 text-gray-400 ${isFetching ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Basic Info */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white">
                            <CardContent className="p-10 flex flex-col items-center text-center">
                                <Avatar className="h-32 w-32 border-4 border-white shadow-xl mb-6">
                                    <AvatarImage src={resident.image} />
                                    <AvatarFallback className="text-3xl font-bold bg-indigo-50 text-indigo-600">
                                        {resident.name?.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                </Avatar>
                                <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">{resident.name}</h2>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">{resident.email}</p>

                                <div className="w-full space-y-4">
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
                                        <div className="h-9 w-9 rounded-xl bg-white flex items-center justify-center border border-gray-100 text-indigo-600">
                                            <Phone className="h-4 w-4" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Contact</p>
                                            <p className="text-xs font-bold text-gray-900">{resident.phone || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
                                        <div className="h-9 w-9 rounded-xl bg-white flex items-center justify-center border border-gray-100 text-indigo-600">
                                            <MapPin className="h-4 w-4" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Base Address</p>
                                            <p className="text-xs font-bold text-gray-900 line-clamp-1">{resident.address || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
                                        <div className="h-9 w-9 rounded-xl bg-white flex items-center justify-center border border-gray-100 text-indigo-600">
                                            <CreditCard className="h-4 w-4" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Government ID</p>
                                            <p className="text-xs font-bold text-gray-900">CNIC: {resident.cnic || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
                            <CardHeader className="bg-gray-50/50 p-6 border-b border-gray-100">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                    <Zap className="h-3 w-3 text-indigo-600" /> Warden Controls
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-2">
                                <Button
                                    variant="outline"
                                    className="w-full h-12 justify-between px-6 rounded-2xl border-gray-100 font-bold text-[10px] uppercase tracking-widest group"
                                    onClick={() => activeBooking ? router.push(`/warden/bookings/${activeBooking.id}/payments`) : toast.error("No active booking found")}
                                >
                                    <div className="flex items-center gap-3">
                                        <DollarSign className="h-4 w-4 text-emerald-600" />
                                        <span>Financial History</span>
                                    </div>
                                    <ChevronRight className="h-3 w-3 text-gray-300 group-hover:text-indigo-600" />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full h-12 justify-between px-6 rounded-2xl border-gray-100 font-bold text-[10px] uppercase tracking-widest group"
                                    onClick={() => setIsInvoiceDialogOpen(true)}
                                >
                                    <div className="flex items-center gap-3">
                                        <Receipt className="h-4 w-4 text-indigo-600" />
                                        <span>Issue Invoice</span>
                                    </div>
                                    <ChevronRight className="h-3 w-3 text-gray-300 group-hover:text-indigo-600" />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full h-12 justify-between px-6 rounded-2xl border-gray-100 font-bold text-[10px] uppercase tracking-widest text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                    onClick={handleCheckout}
                                    disabled={isCheckingOut || !activeBooking}
                                >
                                    <div className="flex items-center gap-3">
                                        {isCheckingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
                                        <span>Checkout Protocol</span>
                                    </div>
                                    <ChevronRight className="h-3 w-3 text-rose-300" />
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Detailed Info & History */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Card className="rounded-3xl border border-gray-100 shadow-sm p-6 bg-white group cursor-pointer hover:border-indigo-600/20 transition-all" onClick={() => currentRoom?.id && router.push(`/warden/rooms/${currentRoom.id}`)}>
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                                        <Home className="h-5 w-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Unit Registry</span>
                                        <span className="text-base font-bold text-gray-900 uppercase">
                                            {currentRoom?.roomNumber ? `RM-${currentRoom.roomNumber}` : 'NOT ASSIGNED'}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                            <Card className="rounded-3xl border border-gray-100 shadow-sm p-6 bg-white">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                                        <DollarSign className="h-5 w-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fiscal Yield</span>
                                        <span className="text-base font-bold text-gray-900 uppercase">PKR {resident.payments?.reduce((acc, p) => acc + (p.status === 'PAID' ? p.amount : 0), 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </Card>
                            <Card className="rounded-3xl border border-gray-100 shadow-sm p-6 bg-white">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-inner">
                                        <AlertCircle className="h-5 w-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Open Cases</span>
                                        <span className="text-base font-bold text-gray-900 uppercase">{resident.complaints?.filter(c => c.status !== 'RESOLVED').length || 0} ACTIVE</span>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Tabs content */}
                        <Tabs defaultValue={defaultTab} className="w-full">
                            <TabsList className="bg-gray-100/50 p-1.5 rounded-2xl h-14 w-full justify-start gap-2 mb-8 border border-gray-100">
                                <TabsTrigger value="payments" className="rounded-xl px-8 font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Payments</TabsTrigger>
                                <TabsTrigger value="complaints" className="rounded-xl px-8 font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Complaints</TabsTrigger>
                                <TabsTrigger value="profileplus" className="rounded-xl px-8 font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Advanced Profile</TabsTrigger>
                            </TabsList>

                            <TabsContent value="payments" className="mt-0">
                                <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white">
                                    <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Financial Ledger</h3>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Authorized Transaction Stream</p>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-gray-50/50">
                                                <TableRow className="border-gray-50">
                                                    <TableHead className="text-[9px] font-bold uppercase tracking-widest py-6 px-8 text-gray-400">Date Logged</TableHead>
                                                    <TableHead className="text-[9px] font-bold uppercase tracking-widest py-6 px-8 text-gray-400">Node Class</TableHead>
                                                    <TableHead className="text-[9px] font-bold uppercase tracking-widest py-6 px-8 text-gray-400">Amount</TableHead>
                                                    <TableHead className="text-[9px] font-bold uppercase tracking-widest py-6 px-8 text-gray-400">Status</TableHead>
                                                    <TableHead className="text-[9px] font-bold uppercase tracking-widest py-6 px-8 text-gray-400 text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {resident.payments?.length > 0 ? (
                                                    resident.payments.map((p) => (
                                                        <TableRow key={p.id} className="hover:bg-gray-50/50 transition-colors border-gray-50 group">
                                                            <TableCell className="py-6 px-8">
                                                                <div className="flex flex-col">
                                                                    <span className="text-xs font-bold text-gray-900 uppercase">{safeFormat(p.date, 'MMM dd, yyyy')}</span>
                                                                    <span className="text-[9px] font-medium text-gray-400">{safeFormat(p.date, 'HH:mm')}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-6 px-8">
                                                                <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-widest bg-gray-50/50 px-3 py-1 rounded-lg">
                                                                    {p.type}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="py-6 px-8 font-bold text-sm text-gray-900">
                                                                PKR {p.amount.toLocaleString()}
                                                            </TableCell>
                                                            <TableCell className="py-6 px-8">
                                                                <Badge className={`${getStatusTheme(p.status)} border-none rounded-full px-3 py-1 text-[8px] font-bold uppercase tracking-widest shadow-sm`}>
                                                                    {p.status}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="py-6 px-8 text-right">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-9 w-9 rounded-xl hover:bg-white border border-transparent hover:border-gray-100"
                                                                    onClick={() => {
                                                                        const paymentContext = resident.bookings?.find(b => b.id === p.bookingId) || activeBooking;
                                                                        if (!paymentContext) return toast.error("Historical booking context missing");
                                                                        generateInvoice(p, { ...paymentContext, User: resident });
                                                                        toast.success("Invoice generated successfully");
                                                                    }}
                                                                >
                                                                    <Download className="h-4 w-4 text-gray-400" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="py-20 text-center">
                                                            <History className="h-12 w-12 text-gray-100 mx-auto mb-4" />
                                                            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">Zero Balance Recorded</p>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </Card>
                            </TabsContent>

                            <TabsContent value="complaints" className="mt-0">
                                <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white">
                                    <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Grievance registry</h3>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Maintenance Node History</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-11 px-6 rounded-xl border-gray-100 font-bold text-[10px] uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all"
                                            onClick={() => setIsGrievanceDialogOpen(true)}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Report Case
                                        </Button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-gray-50/50">
                                                <TableRow className="border-gray-50">
                                                    <TableHead className="text-[9px] font-bold uppercase tracking-widest py-6 px-8 text-gray-400">Subject File</TableHead>
                                                    <TableHead className="text-[9px] font-bold uppercase tracking-widest py-6 px-8 text-gray-400">Class</TableHead>
                                                    <TableHead className="text-[9px] font-bold uppercase tracking-widest py-6 px-8 text-gray-400">Priority</TableHead>
                                                    <TableHead className="text-[9px] font-bold uppercase tracking-widest py-6 px-8 text-gray-400">Phase</TableHead>
                                                    <TableHead className="text-[9px] font-bold uppercase tracking-widest py-6 px-8 text-gray-400 text-right">Link</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {resident.complaints?.length > 0 ? (
                                                    resident.complaints.map((c) => (
                                                        <TableRow key={c.id} className="hover:bg-gray-50/50 transition-colors border-gray-50 group">
                                                            <TableCell className="py-6 px-8">
                                                                <div className="flex flex-col max-w-[200px]">
                                                                    <span className="text-xs font-bold text-gray-900 uppercase tracking-tight truncate">{c.title}</span>
                                                                    <span className="text-[9px] font-medium text-gray-400 truncate mt-0.5">{c.description}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-6 px-8">
                                                                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{c.category}</span>
                                                            </TableCell>
                                                            <TableCell className="py-6 px-8">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`h-1.5 w-1.5 rounded-full ${c.priority === 'HIGH' || c.priority === 'URGENT' ? 'bg-red-500 animate-pulse' : 'bg-indigo-400'}`} />
                                                                    <span className={`text-[9px] font-bold uppercase tracking-widest ${c.priority === 'HIGH' || c.priority === 'URGENT' ? 'text-red-600' : 'text-indigo-600'}`}>{c.priority}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-6 px-8">
                                                                <Badge className={`${getStatusTheme(c.status)} border-none rounded-full px-3 py-1 text-[8px] font-bold uppercase tracking-widest shadow-sm`}>
                                                                    {c.status}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="py-6 px-8 text-right">
                                                                <Link href={`/warden/complaints`}>
                                                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white border border-transparent hover:border-gray-100">
                                                                        <ChevronRight className="h-4 w-4 text-gray-300" />
                                                                    </Button>
                                                                </Link>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="py-20 text-center">
                                                            <CheckCircle2 className="h-12 w-12 text-gray-100 mx-auto mb-4" />
                                                            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">All Systems Nominal</p>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </Card>
                            </TabsContent>

                            <TabsContent value="profileplus" className="mt-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8">
                                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-8 flex items-center gap-2">
                                            <Info className="h-3 w-3 text-indigo-600" /> Identity Matrix
                                        </h4>
                                        <div className="space-y-6">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Father/Guardian</span>
                                                <span className="text-xs font-bold text-gray-900 mt-1 uppercase italic">{resident.residentProfile?.guardianName || 'N/A'}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Origin Inception</span>
                                                <span className="text-xs font-bold text-gray-900 mt-1 uppercase italic">{safeFormat(resident.residentProfile?.dob, 'MMM dd, yyyy')}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Biological Class</span>
                                                <span className="text-xs font-bold text-rose-600 mt-1 uppercase italic">{resident.residentProfile?.bloodGroup || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </Card>

                                    <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8">
                                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-8 flex items-center gap-2">
                                            <Contact2 className="h-3 w-3 text-indigo-600" /> Node Dossier
                                        </h4>
                                        <div className="space-y-6">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Emergency Pulse</span>
                                                <span className="text-xs font-bold text-emerald-600 mt-1 uppercase italic">{resident.residentProfile?.emergencyContact || 'N/A'}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Institution Root</span>
                                                <span className="text-xs font-bold text-gray-900 mt-1 uppercase italic line-clamp-1">{resident.residentProfile?.institution || 'N/A'}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Occupation Sector</span>
                                                <span className="text-xs font-bold text-gray-900 mt-1 uppercase italic line-clamp-1">{resident.residentProfile?.occupation || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </Card>

                                    <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8 md:col-span-2">
                                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-8 flex items-center gap-2">
                                            <FileText className="h-3 w-3 text-indigo-600" /> Vault Documents
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            {resident.residentProfile?.documents && Object.keys(resident.residentProfile.documents).length > 0 ? (
                                                Object.entries(resident.residentProfile.documents).map(([key, value], idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 border border-gray-100 group hover:border-indigo-600/20 transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center border border-gray-100 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                                                                <FileText className="h-4 w-4" />
                                                            </div>
                                                            <span className="text-[10px] font-bold text-gray-700 uppercase tracking-tight">{key}</span>
                                                        </div>
                                                        <Button variant="ghost" size="sm" className="h-8 text-indigo-600 hover:text-indigo-700 hover:bg-transparent font-bold text-[9px] uppercase tracking-widest" onClick={() => window.open(value, '_blank')}>
                                                            Retrieve
                                                        </Button>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="col-span-full py-8 text-center text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em] bg-gray-50/30 rounded-3xl border border-dashed border-gray-100">
                                                    Zero Documents Anchored
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </main>

            {/* Dialogs ported from Admin */}
            <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] border-none p-10 font-sans">
                    <DialogHeader className="mb-8">
                        <DialogTitle className="text-xl font-bold uppercase tracking-tight">Generate Fiscal Invoice</DialogTitle>
                        <DialogDescription className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Authorized Warden Billing Protocol</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Invoice Amount (PKR)</Label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 font-bold text-lg px-6 focus:ring-indigo-600/20"
                                value={invoiceForm.amount}
                                onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Category</Label>
                                <Select value={invoiceForm.type} onValueChange={(v) => setInvoiceForm({ ...invoiceForm, type: v })}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 font-bold text-xs uppercase px-6">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        <SelectItem value="RENT" className="text-xs font-bold uppercase">Monthly Rent</SelectItem>
                                        <SelectItem value="MESS" className="text-xs font-bold uppercase">Mess Charges</SelectItem>
                                        <SelectItem value="LAUNDRY" className="text-xs font-bold uppercase">Laundry Fee</SelectItem>
                                        <SelectItem value="FINE" className="text-xs font-bold uppercase">Policy Fine</SelectItem>
                                        <SelectItem value="OTHER" className="text-xs font-bold uppercase">Miscellaneous</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Due Date</Label>
                                <Input
                                    type="date"
                                    className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 font-bold text-xs px-6"
                                    value={invoiceForm.dueDate}
                                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Audit Notes</Label>
                            <Textarea
                                placeholder="Details for the resident..."
                                className="min-h-[100px] rounded-2xl bg-gray-50/50 border-gray-100 font-medium p-6 resize-none focus:ring-indigo-600/20"
                                value={invoiceForm.notes}
                                onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-10 gap-3">
                        <Button variant="ghost" className="rounded-2xl font-bold text-[10px] uppercase tracking-widest h-14 px-8" onClick={() => setIsInvoiceDialogOpen(false)}>Abort</Button>
                        <Button
                            className="flex-1 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-widest h-14 transition-all shadow-lg"
                            onClick={handleGenerateInvoice}
                            disabled={createPayment.isPending}
                        >
                            {createPayment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Issue Invoice"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isGrievanceDialogOpen} onOpenChange={setIsGrievanceDialogOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] border-none p-10 font-sans">
                    <DialogHeader className="mb-8">
                        <DialogTitle className="text-xl font-bold uppercase tracking-tight">Log Resident Grievance</DialogTitle>
                        <DialogDescription className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Authorized Maintenance Protocol</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Reporting Subject</Label>
                            <Input
                                placeholder="Quick summary of the issue..."
                                className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 font-bold text-xs px-6 uppercase focus:ring-indigo-600/20"
                                value={grievanceForm.title}
                                onChange={(e) => setGrievanceForm({ ...grievanceForm, title: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Category</Label>
                                <Select value={grievanceForm.category} onValueChange={(v) => setGrievanceForm({ ...grievanceForm, category: v })}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 font-bold text-xs uppercase px-6">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        <SelectItem value="MAINTENANCE" className="text-xs font-bold uppercase">Maintenance</SelectItem>
                                        <SelectItem value="MESS" className="text-xs font-bold uppercase">Mess/Food</SelectItem>
                                        <SelectItem value="CLEANING" className="text-xs font-bold uppercase">Cleaning</SelectItem>
                                        <SelectItem value="LAUNDRY" className="text-xs font-bold uppercase">Laundry</SelectItem>
                                        <SelectItem value="SECURITY" className="text-xs font-bold uppercase">Security</SelectItem>
                                        <SelectItem value="GENERAL" className="text-xs font-bold uppercase">General</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Priority</Label>
                                <Select value={grievanceForm.priority} onValueChange={(v) => setGrievanceForm({ ...grievanceForm, priority: v })}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 font-bold text-xs uppercase px-6">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        <SelectItem value="LOW" className="text-xs font-bold uppercase text-blue-600">Low</SelectItem>
                                        <SelectItem value="MEDIUM" className="text-xs font-bold uppercase text-amber-600">Medium</SelectItem>
                                        <SelectItem value="HIGH" className="text-xs font-bold uppercase text-orange-600">High</SelectItem>
                                        <SelectItem value="URGENT" className="text-xs font-bold uppercase text-rose-600">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Detailed Case Dossier</Label>
                            <Textarea
                                placeholder="Comprehensive description of the grievance..."
                                className="min-h-[120px] rounded-2xl bg-gray-50/50 border-gray-100 font-medium p-6 resize-none focus:ring-indigo-600/20"
                                value={grievanceForm.description}
                                onChange={(e) => setGrievanceForm({ ...grievanceForm, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-10 gap-3">
                        <Button variant="ghost" className="rounded-2xl font-bold text-[10px] uppercase tracking-widest h-14 px-8" onClick={() => setIsGrievanceDialogOpen(false)}>Void</Button>
                        <Button
                            className="flex-1 rounded-2xl bg-indigo-600 hover:bg-rose-600 text-white font-bold text-[10px] uppercase tracking-widest h-14 transition-all shadow-lg"
                            onClick={handleReportGrievance}
                            disabled={createComplaint.isPending}
                        >
                            {createComplaint.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Commit Grievance Log"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default WardenResidentDetailPage
