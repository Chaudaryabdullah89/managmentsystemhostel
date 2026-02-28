"use client"
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Search, User, Calendar, CreditCard, AlertTriangle,
    Mail, Phone, Building2, FileText, Wrench, ExternalLink,
    RefreshCw, Activity, Blocks, Fingerprint, CheckCircle,
    Loader2, Download, ChevronRight, Clock, Hash, X,
    ArrowRight, Command, Filter, SlidersHorizontal, Trash2, Power, Shield, Printer, History, AlertCircle, TrendingUp,
    Plus, Check, ChevronLeft
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { toast } from "sonner";
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import UnifiedReceipt from "@/components/receipt/UnifiedReceipt";

const CATEGORIES = [
    { key: 'all', label: 'All', color: 'gray' },
    { key: 'users', label: 'Users', color: 'indigo', icon: User },
    { key: 'bookings', label: 'Bookings', color: 'blue', icon: Calendar },
    { key: 'payments', label: 'Payments', color: 'emerald', icon: CreditCard },
    { key: 'complaints', label: 'Complaints', color: 'rose', icon: AlertTriangle },
    { key: 'maintenance', label: 'Maintenance', color: 'amber', icon: Wrench },
];

const COLOR_MAP = {
    indigo: { dot: 'bg-indigo-500', bar: 'bg-indigo-500', hover: 'hover:border-indigo-100', icon: 'group-hover:bg-indigo-600', badge: 'bg-indigo-50 text-indigo-700', tab: 'bg-indigo-600 text-white shadow-indigo-200' },
    blue: { dot: 'bg-blue-500', bar: 'bg-blue-500', hover: 'hover:border-blue-100', icon: 'group-hover:bg-blue-600', badge: 'bg-blue-50 text-blue-700', tab: 'bg-blue-600 text-white shadow-blue-200' },
    emerald: { dot: 'bg-emerald-500', bar: 'bg-emerald-500', hover: 'hover:border-emerald-100', icon: 'group-hover:bg-emerald-600', badge: 'bg-emerald-50 text-emerald-700', tab: 'bg-emerald-600 text-white shadow-emerald-200' },
    rose: { dot: 'bg-rose-500', bar: 'bg-rose-500', hover: 'hover:border-rose-100', icon: 'group-hover:bg-rose-600', badge: 'bg-rose-50 text-rose-700', tab: 'bg-rose-600 text-white shadow-rose-200' },
    amber: { dot: 'bg-amber-500', bar: 'bg-amber-500', hover: 'hover:border-amber-100', icon: 'group-hover:bg-amber-600', badge: 'bg-amber-50 text-amber-700', tab: 'bg-amber-600 text-white shadow-amber-200' },
    gray: { dot: 'bg-gray-400', bar: 'bg-gray-400', hover: 'hover:border-gray-200', icon: 'group-hover:bg-gray-800', badge: 'bg-gray-50 text-gray-700', tab: 'bg-gray-900 text-white shadow-gray-200' },
};

const STATUS_COLORS = {
    PAID: 'bg-emerald-50 text-emerald-700', CONFIRMED: 'bg-emerald-50 text-emerald-700',
    CHECKED_IN: 'bg-indigo-50 text-indigo-700', PENDING: 'bg-amber-50 text-amber-700',
    OVERDUE: 'bg-rose-50 text-rose-700', CANCELLED: 'bg-gray-50 text-gray-600',
    RESOLVED: 'bg-emerald-50 text-emerald-700', OPEN: 'bg-rose-50 text-rose-700',
    IN_PROGRESS: 'bg-blue-50 text-blue-700', COMPLETED: 'bg-emerald-50 text-emerald-700',
    ACTIVE: 'bg-emerald-50 text-emerald-700', INACTIVE: 'bg-gray-50 text-gray-500',
};

const StatusBadge = ({ status }) => (
    <Badge className={`${STATUS_COLORS[status?.toUpperCase()] || 'bg-gray-50 text-gray-600'} border-none text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5`}>
        {status}
    </Badge>
);

const ResultCard = ({ item, type, onClick }) => {
    const colors = {
        users: { color: COLOR_MAP.indigo, icon: User, title: item.name, sub: item.email, meta: item.role, idField: item.uid },
        bookings: { color: COLOR_MAP.blue, icon: Calendar, title: item.Room?.Hostel?.name || 'Booking', sub: `Room ${item.Room?.roomNumber} • ${item.User?.name}`, meta: item.status, idField: item.uid },
        payments: { color: COLOR_MAP.emerald, icon: CreditCard, title: `PKR ${item.amount?.toLocaleString()}`, sub: item.User?.name, meta: item.status, idField: item.uid },
        complaints: { color: COLOR_MAP.rose, icon: AlertTriangle, title: item.title, sub: item.Hostel?.name, meta: item.status, idField: item.uid },
        maintenance: { color: COLOR_MAP.amber, icon: Wrench, title: item.title, sub: item.Hostel?.name, meta: item.status, idField: item.uid },
    }[type];
    if (!colors) return null;
    const Icon = colors.icon;
    return (
        <div
            onClick={onClick}
            className={`bg-white border border-gray-100 rounded-2xl p-5 flex items-center justify-between group ${colors.color.hover} hover:shadow-lg transition-all cursor-pointer relative overflow-hidden`}
        >
            <div className={`absolute left-0 top-0 w-1 h-full ${colors.color.bar} opacity-70 rounded-r`} />
            <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className={`h-11 w-11 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 ${colors.color.icon} transition-colors`}>
                    <Icon className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight truncate">{colors.title}</h3>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 truncate">{colors.sub}</p>
                </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0 ml-4">
                <StatusBadge status={colors.meta} />
                {colors.idField && <span className="text-[8px] font-mono font-bold text-gray-300">{colors.idField}</span>}
            </div>
        </div>
    );
};

const FullScreenUserTerminal = ({ user: initialUser, onClose }) => {
    const router = useRouter();
    const [user, setUser] = useState(initialUser);
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");

    // Modal states for creating payment/booking
    const [showPayModal, setShowPayModal] = useState(false);
    const [payData, setPayData] = useState({ amount: '', method: 'CASH', type: 'RENT', month: format(new Date(), 'MMMM yyyy') });

    const fetchDetails = () => {
        setLoading(true);
        fetch(`/api/users/${user.id}`)
            .then(res => res.json())
            .then(data => { if (data.success) { setDetails(data.user); } setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchDetails();
    }, [user.id]);

    const handleUpdateStatus = async (id, type, status) => {
        setIsUpdating(true);
        try {
            const endpoint = type === 'payment' ? `/api/payments/${id}` : `/api/bookings/status`;
            const method = type === 'payment' ? 'PATCH' : 'PUT';
            const body = type === 'payment' ? { status } : { id, status };

            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (res.ok) {
                toast.success(`${type} updated`);
                fetchDetails();
            } else throw new Error();
        } catch { toast.error("Update failed"); }
        finally { setIsUpdating(false); }
    };

    const handleCreatePayment = async () => {
        if (!payData.amount) return;
        setIsUpdating(true);
        try {
            const res = await fetch("/api/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...payData, userId: user.id, status: 'PAID', date: new Date() }),
            });
            if (res.ok) {
                toast.success("Payment created successfully");
                setShowPayModal(false);
                fetchDetails();
            } else throw new Error();
        } catch { toast.error("Failed to create payment"); }
        finally { setIsUpdating(false); }
    };

    const activities = useMemo(() => {
        if (!details) return [];
        const logs = [
            ...(details.Payment || []).map(p => ({
                id: p.id,
                title: `Paid PKR ${p.amount?.toLocaleString()}`,
                sub: `${p.type} via ${p.method}`,
                date: new Date(p.date || p.createdAt),
                icon: CreditCard,
                color: 'text-emerald-600',
                bg: 'bg-emerald-50'
            })),
            ...(details.Booking || []).map(b => ({
                id: b.id,
                title: `Room ${b.Room?.roomNumber} Booking`,
                sub: `${b.Room?.Hostel?.name}`,
                date: new Date(b.checkIn || b.createdAt),
                icon: Calendar,
                color: 'text-blue-600',
                bg: 'bg-blue-50'
            })),
            ...(details.Complaint_Complaint_userIdToUser || []).map(c => ({
                id: c.id,
                title: `File Complaint: ${c.title}`,
                sub: c.status,
                date: new Date(c.createdAt),
                icon: AlertTriangle,
                color: 'text-rose-600',
                bg: 'bg-rose-50'
            }))
        ];
        return logs.sort((a, b) => b.date - a.date);
    }, [details]);

    const tabs = [
        { id: 'overview', label: 'Info', icon: User },
        { id: 'bookings', label: 'History', icon: Calendar },
        { id: 'payments', label: 'Money', icon: CreditCard },
        { id: 'complaints', label: 'Issues', icon: AlertTriangle },
        { id: 'activity', label: 'Activity', icon: Activity },
    ];

    return (
        <div className="relative w-full h-full bg-white flex overflow-hidden font-sans rounded-[2.5rem]">
            {/* Sidebar Navigation */}
            <aside className="w-72 bg-gray-50/50 flex flex-col shrink-0 border-r border-gray-100">
                <div className="p-8 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-blue-500/20">
                            {user.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-gray-900 font-bold text-base truncate leading-tight">{user.name}</h2>
                            <p className="text-blue-600 text-[9px] font-bold uppercase tracking-[0.2em] mt-1">{user.role}</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all group ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10' : 'text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-sm'}`}
                        >
                            <tab.icon className={`h-4.5 w-4.5 ${activeTab === tab.id ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'}`} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{tab.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-8 mt-auto border-t border-gray-100">
                    <Button variant="outline" onClick={onClose} className="w-full h-11 rounded-2xl border-gray-200 text-gray-400 bg-white hover:bg-gray-50 font-bold text-[10px] uppercase tracking-widest gap-2">
                        <ChevronLeft className="h-4 w-4" /> Exit
                    </Button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col bg-gray-50/50 overflow-hidden relative">
                {/* Top Quick Profile Stats */}
                <header className="bg-white border-b px-10 py-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-8">
                        <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">User ID</p>
                            <p className="text-sm font-bold text-gray-900 mt-1">{user.uid || 'N/A'}</p>
                        </div>
                        <div className="h-8 w-px bg-gray-100" />
                        <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Status</p>
                            <Badge className={`mt-1 font-bold text-[9px] uppercase tracking-widest border-none ${user.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {user.isActive ? 'Active' : 'Stopped'}
                            </Badge>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => setActiveTab('activity')} className="h-10 px-6 rounded-xl border-gray-200 text-gray-500 hover:text-blue-600 hover:bg-blue-50 font-bold text-[10px] uppercase tracking-widest gap-2">
                            <History className="h-3.5 w-3.5" /> Actions
                        </Button>
                        <Button onClick={() => window.print()} className="h-10 px-6 rounded-xl bg-gray-900 border-none text-white font-bold text-[10px] uppercase tracking-widest gap-2">
                            <Printer className="h-3.5 w-3.5" /> Print
                        </Button>
                    </div>
                </header>

                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
                        <p className="text-[11px] font-black text-gray-900 uppercase tracking-[0.3em] animate-pulse">Loading User Info...</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-10">
                        {activeTab === 'overview' && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {[
                                        { label: 'Payments', value: `PKR ${details?.Payment?.reduce((a, c) => a + (c.amount || 0), 0).toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                        { label: 'Total Bookings', value: `${details?.Booking?.length || 0} Records`, icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                        { label: 'Complaints', value: `${details?.Complaint_Complaint_userIdToUser?.length || 0} Items`, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
                                        { label: 'Phone Number', value: user.phone || 'N/A', icon: Phone, color: 'text-amber-600', bg: 'bg-amber-50' },
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
                                            <div className={`h-12 w-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                                                <stat.icon className="h-6 w-6" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                                                <p className="text-base font-bold text-gray-900 truncate mt-1">{stat.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-10">
                                            <Fingerprint className="h-20 w-20 text-gray-50 group-hover:scale-110 transition-transform duration-500" />
                                        </div>
                                        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-10 border-b pb-4 flex items-center gap-3">
                                            <Activity className="h-3.5 w-3.5 text-blue-600" /> User Info
                                        </h3>
                                        <div className="grid grid-cols-2 gap-y-10">
                                            {[
                                                { label: 'Full name', value: user.name },
                                                { label: 'Email', value: user.email },
                                                { label: 'CNIC / ID', value: user.cnic || '—' },
                                                { label: 'Emergency', value: details?.ResidentProfile?.emergencyContact || '—' },
                                                { label: 'Address', value: user.address || '—' },
                                                { label: 'Join Date', value: format(new Date(user.createdAt), 'MMMM dd, yyyy') },
                                            ].map((f, i) => (
                                                <div key={i}>
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{f.label}</p>
                                                    <p className="text-sm font-black text-gray-900 mt-2">{f.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-white/5 -skew-x-12 translate-x-20" />
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-white/60 mb-8">Hostel Info</h3>
                                        <div className="space-y-10 relative z-10">
                                            <div className="flex items-center gap-5">
                                                <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                                                    <Building2 className="h-7 w-7" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Branch Name</p>
                                                    <p className="text-lg font-bold text-white mt-1 uppercase">{details?.Hostel_User_hostelIdToHostel?.name || 'MAIN_BRANCH'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-5">
                                                <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                                                    <Hash className="h-7 w-7" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Room Number</p>
                                                    <p className="text-lg font-bold text-white mt-1 uppercase">{details?.Booking?.[0]?.Room?.roomNumber ? `No. ${details.Booking[0].Room.roomNumber}` : 'UNASSIGNED'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'bookings' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Booking History</h2>
                                    <Button onClick={() => router.push('/admin/bookings/create')} className="h-11 px-6 rounded-2xl bg-gray-900 text-white font-black text-[10px] uppercase tracking-widest gap-2">
                                        <Plus className="h-4 w-4" /> Add Booking
                                    </Button>
                                </div>
                                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-gray-50/50 h-16">
                                            <TableRow className="border-none">
                                                <TableHead className="px-10 text-[10px] font-black uppercase tracking-[0.2em]">Check-In</TableHead>
                                                <TableHead className="px-6 text-[10px] font-black uppercase tracking-[0.2em]">Room / Branch</TableHead>
                                                <TableHead className="px-6 text-[10px] font-black uppercase tracking-[0.2em]">Status</TableHead>
                                                <TableHead className="px-6 text-[10px] font-black uppercase tracking-[0.2em] text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {details?.Booking?.map((b) => (
                                                <TableRow key={b.id} className="border-gray-50 group hover:bg-gray-50/50 transition-colors">
                                                    <TableCell className="px-10 py-6">
                                                        <p className="text-sm font-black text-gray-900">{b.checkIn ? format(new Date(b.checkIn), 'MMM dd, yyyy') : '—'}</p>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">To {b.checkOut ? format(new Date(b.checkOut), 'MMM dd, yyyy') : 'Present'}</p>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-6 font-black text-indigo-600 text-sm">
                                                        Room {b.Room?.roomNumber}
                                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">{b.Room?.Hostel?.name}</p>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-6">
                                                        <Badge className="font-black text-[8px] uppercase px-2 py-0.5 border-none bg-indigo-50 text-indigo-600">{b.status}</Badge>
                                                    </TableCell>
                                                    <TableCell className="px-10 py-6 text-right space-x-1">
                                                        {b.status === 'PENDING' && (
                                                            <Button onClick={() => handleUpdateStatus(b.id, 'booking', 'CHECKED_IN')} size="sm" className="h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[8px] uppercase px-3">Verify</Button>
                                                        )}
                                                        <UnifiedReceipt data={b} type="booking">
                                                            <Button variant="ghost" className="h-8 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 font-bold text-[8px] uppercase px-3">Receipt</Button>
                                                        </UnifiedReceipt>
                                                        <Button onClick={() => { onClose(); router.push(`/admin/bookings/${b.id}`); }} variant="ghost" className="h-8 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 font-bold text-[8px] uppercase px-3">Details</Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {(!details?.Booking || details.Booking.length === 0) && (
                                                <TableRow><TableCell colSpan={4} className="h-64 text-center py-20 text-[10px] font-black uppercase text-gray-300">No active access records found</TableCell></TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'payments' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Payments History</h2>
                                    <Button onClick={() => setShowPayModal(true)} className="h-10 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-widest gap-2 shadow-lg shadow-emerald-500/10">
                                        <Plus className="h-4 w-4" /> Add Payment
                                    </Button>
                                </div>
                                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-gray-50/50 h-16">
                                            <TableRow className="border-none">
                                                <TableHead className="px-10 text-[10px] font-black uppercase tracking-[0.2em]">Transaction Date</TableHead>
                                                <TableHead className="px-6 text-[10px] font-black uppercase tracking-[0.2em]">Reference / Mode</TableHead>
                                                <TableHead className="px-6 text-[10px] font-black uppercase tracking-[0.2em]">Amount</TableHead>
                                                <TableHead className="px-6 text-[10px] font-black uppercase tracking-[0.2em] text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {details?.Payment?.map((p) => (
                                                <TableRow key={p.id} className="border-gray-50 group hover:bg-gray-50/50 transition-colors">
                                                    <TableCell className="px-10 py-6 font-black text-gray-900 text-sm">{p.date ? format(new Date(p.date), 'MMM dd, yyyy') : format(new Date(p.createdAt), 'MMM dd, yyyy')}</TableCell>
                                                    <TableCell className="px-6 py-6">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{p.method || 'CASH'}</span>
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight mt-1">Ref: {p.transactionId || 'INTERNAL'}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-6">
                                                        <p className="text-sm font-black text-emerald-600">PKR {p.amount?.toLocaleString()}</p>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{p.status}</p>
                                                    </TableCell>
                                                    <TableCell className="px-10 py-6 text-right space-x-2">
                                                        {p.status === 'PENDING' && (
                                                            <Button onClick={() => handleUpdateStatus(p.id, 'payment', 'PAID')} size="sm" className="h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[8px] uppercase">Verify</Button>
                                                        )}
                                                        <UnifiedReceipt data={p} type="payment">
                                                            <Button variant="ghost" className="h-8 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 font-black text-[8px] uppercase">Receipt</Button>
                                                        </UnifiedReceipt>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {(!details?.Payment || details.Payment.length === 0) && (
                                                <TableRow><TableCell colSpan={4} className="h-64 text-center py-20 text-[10px] font-black uppercase text-gray-300">No payment history found</TableCell></TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'complaints' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight">User Issues</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {details?.Complaint_Complaint_userIdToUser?.map((c) => (
                                        <div key={c.id} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-4 hover:shadow-md transition-shadow group">
                                            <div className="flex justify-between items-start">
                                                <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                    <AlertCircle className="h-6 w-6" />
                                                </div>
                                                <Badge className="font-black text-[9px] uppercase px-3 py-1 border-none bg-rose-50 text-rose-600">{c.status}</Badge>
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">{c.title}</h4>
                                                <p className="text-xs text-gray-500 leading-relaxed italic line-clamp-3">"{c.description}"</p>
                                            </div>
                                            <div className="flex items-center justify-between pt-6 border-t border-gray-50 mt-4">
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{format(new Date(c.createdAt), 'MMMM dd, yyyy')}</span>
                                                <Link href={`/admin/complaints/${c.id}`} onClick={onClose}>
                                                    <Button variant="ghost" className="h-8 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50">View More</Button>
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                    {(!details?.Complaint_Complaint_userIdToUser || details.Complaint_Complaint_userIdToUser.length === 0) && (
                                        <div className="md:col-span-2 py-20 border-2 border-dashed border-gray-100 rounded-[2.5rem] flex flex-col items-center justify-center text-gray-300 gap-4">
                                            <CheckCircle className="h-12 w-12" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">No issues found</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'activity' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Recent Activity</h2>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-full">
                                        {activities.length} Records
                                    </span>
                                </div>

                                <div className="relative pl-8 space-y-10">
                                    {/* Timeline Line */}
                                    <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-100" />

                                    {activities.map((act, i) => (
                                        <div key={i} className="relative group">
                                            {/* Dot */}
                                            <div className="absolute -left-[28px] top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-white border-2 border-gray-200 group-hover:border-blue-600 transition-colors z-10 shadow-sm" />

                                            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                                                <div className="flex items-center gap-5">
                                                    <div className={`h-11 w-11 rounded-2xl ${act.bg} ${act.color} flex items-center justify-center shrink-0`}>
                                                        <act.icon className="h-4.5 w-4.5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">{act.title}</p>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{act.sub}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-gray-900">{format(act.date, 'MMM dd')}</p>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{format(act.date, 'hh:mm a')}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {activities.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-20 text-gray-300 gap-4 bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
                                            <Clock className="h-10 w-10" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">No activity yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Create Payment Mini-Modal */}
                {showPayModal && (
                    <div className="absolute inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
                        <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Voucher Entry</h3>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">User: {user.name}</p>
                                </div>
                                <Button size="icon" variant="ghost" className="rounded-xl" onClick={() => setShowPayModal(false)}><X className="h-5 w-5" /></Button>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Payment Amount</Label>
                                    <Input
                                        type="number"
                                        value={payData.amount}
                                        onChange={e => setPayData({ ...payData, amount: e.target.value })}
                                        placeholder="0.00"
                                        className="h-14 rounded-2xl border-gray-100 bg-gray-50 px-6 font-bold text-lg focus-visible:ring-blue-600"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Method</Label>
                                        <Select value={payData.method} onValueChange={v => setPayData({ ...payData, method: v })}>
                                            <SelectTrigger className="h-12 rounded-xl bg-gray-50 border-gray-100 font-bold text-[10px] uppercase">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-gray-100 font-bold text-[10px] uppercase">
                                                <SelectItem value="CASH">Cash</SelectItem>
                                                <SelectItem value="BANK_TRANSFER">Bank</SelectItem>
                                                <SelectItem value="CHEQUE">Cheque</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Account Type</Label>
                                        <Select value={payData.type} onValueChange={v => setPayData({ ...payData, type: v })}>
                                            <SelectTrigger className="h-12 rounded-xl bg-gray-50 border-gray-100 font-bold text-[10px] uppercase">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-gray-100 font-bold text-[10px] uppercase">
                                                <SelectItem value="RENT">Rent</SelectItem>
                                                <SelectItem value="SECURITY">Security</SelectItem>
                                                <SelectItem value="MESS">Mess</SelectItem>
                                                <SelectItem value="OTHERS">Others</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <Button onClick={handleCreatePayment} disabled={isUpdating} className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] uppercase tracking-widest shadow-xl shadow-blue-600/10">
                                {isUpdating ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm Payment Entry'}
                            </Button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

const SearchPage = () => {
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [activeCategory, setActiveCategory] = useState('all');
    const [selectedItem, setSelectedItem] = useState(null);
    const [itemType, setItemType] = useState(null);
    const [recentSearches, setRecentSearches] = useState([]);
    const [isUpdating, setIsUpdating] = useState(false);
    const inputRef = useRef(null);

    // Ctrl+K keyboard shortcut
    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const handleSearch = async (e, overrideQuery) => {
        e?.preventDefault();
        const q = overrideQuery || query;
        if (!q.trim() || q.trim().length < 2) {
            toast.error("Please enter at least 2 characters");
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch(`/api/admin/search?query=${encodeURIComponent(q)}`);
            const data = await response.json();
            if (data.success) {
                setResults(data.results);
                setActiveCategory('all');
                setRecentSearches(prev => [q, ...prev.filter(s => s !== q)].slice(0, 5));
                if (data.total === 0) toast.error("No matches found");
                else toast.success(`Found ${data.total} result${data.total !== 1 ? 's' : ''}`);
            } else {
                toast.error(data.error || "Search failed");
            }
        } catch {
            toast.error("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGlobalUpdate = async (id, type, status) => {
        setIsUpdating(true);
        try {
            let endpoint = '';
            let method = 'PUT';
            let body = { id, status };

            if (type === 'payments') {
                endpoint = `/api/payments/${id}`;
                method = 'PATCH';
                body = { status };
            } else if (type === 'bookings') {
                endpoint = `/api/bookings/status`;
                body = { id, status: status === 'CHECKED_IN' ? 'CHECKED_IN' : status };
            } else if (type === 'complaints') {
                endpoint = `/api/admin/complaints/${id}`;
                body = { status };
            } else if (type === 'maintenance') {
                endpoint = `/api/admin/maintenance/${id}`;
                body = { status };
            }

            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                toast.success('Record updated');
                // Refresh search results to reflect changes
                handleSearch(null, query);
                // Close modal or update local state
                setSelectedItem(null);
            } else throw new Error();
        } catch {
            toast.error("Update failed. Check permissions.");
        } finally {
            setIsUpdating(false);
        }
    };

    const getFilteredResults = () => {
        if (!results) return {};
        if (activeCategory === 'all') return results;
        return { [activeCategory]: results[activeCategory] || [] };
    };

    const getCounts = () => {
        if (!results) return {};
        return {
            all: Object.values(results).reduce((s, a) => s + (a?.length || 0), 0),
            users: results.users?.length || 0,
            bookings: results.bookings?.length || 0,
            payments: results.payments?.length || 0,
            complaints: results.complaints?.length || 0,
            maintenance: results.maintenance?.length || 0,
        };
    };

    const handleExport = () => {
        if (!results) return;
        const rows = [];
        rows.push(['Type', 'Name/Title', 'Sub Info', 'Status', 'ID']);
        (results.users || []).forEach(u => rows.push(['User', u.name, u.email, u.isActive ? 'Active' : 'Inactive', u.uid || u.id]));
        (results.bookings || []).forEach(b => rows.push(['Booking', b.Room?.Hostel?.name, b.User?.name, b.status, b.uid || b.id]));
        (results.payments || []).forEach(p => rows.push(['Payment', `PKR ${p.amount}`, p.User?.name, p.status, p.uid || p.id]));
        (results.complaints || []).forEach(c => rows.push(['Complaint', c.title, c.Hostel?.name, c.status, c.uid || c.id]));
        (results.maintenance || []).forEach(m => rows.push(['Maintenance', m.title, m.Hostel?.name, m.status, m.uid || m.id]));
        const csv = rows.map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Search_Results_${query}_${format(new Date(), 'yyyyMMdd')}.csv`;
        link.click();
        toast.success('Results exported');
    };

    const counts = getCounts();
    const filtered = getFilteredResults();
    const totalFiltered = Object.values(filtered).reduce((s, a) => s + (a?.length || 0), 0);

    const openDetail = (item, type) => { setSelectedItem(item); setItemType(type); };

    return (
        <div className="min-h-screen bg-gray-50/30 pb-24 font-sans">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-1.5 bg-indigo-600 rounded-full" />
                        <div>
                            <h1 className="text-base font-bold text-gray-900 uppercase tracking-tight">Search</h1>
                            <div className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Live</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {results && (
                            <Button variant="ghost" onClick={handleExport} className="h-9 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-50 flex items-center gap-2">
                                <Download className="h-3.5 w-3.5" /> Report
                            </Button>
                        )}
                        <Badge variant="outline" className="h-7 px-3 rounded-full border-gray-100 bg-gray-50 text-[9px] font-bold uppercase tracking-widest text-gray-400">
                            SAFE
                        </Badge>
                    </div>
                </div>
            </header>

            <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-8 space-y-6">
                {/* Hero Search Bar */}
                <div className="bg-white border border-gray-100 rounded-[2rem] shadow-sm overflow-hidden">
                    <form onSubmit={handleSearch} className="flex items-center gap-3 p-3">
                        <div className="flex-1 flex items-center gap-3 px-3">
                            {isLoading
                                ? <Loader2 className="h-5 w-5 text-indigo-600 animate-spin shrink-0" />
                                : <Search className="h-5 w-5 text-gray-300 shrink-0" />
                            }
                            <Input
                                ref={inputRef}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search"
                                className="h-14 bg-transparent border-none shadow-none font-bold text-base focus-visible:ring-0 placeholder:text-gray-300"
                            />
                            {query && (
                                <button type="button" onClick={() => { setQuery(''); setResults(null); }} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors shrink-0">
                                    <X className="h-4 w-4 text-gray-400" />
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <kbd className="hidden md:flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[9px] font-bold text-gray-400 uppercase">
                                <Command className="h-3 w-3" />K
                            </kbd>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="h-12 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all"
                            >
                                {isLoading ? 'Search' : 'Search'}
                            </Button>
                        </div>
                    </form>

                    {/* Recent Searches */}
                    {!results && recentSearches.length > 0 && (
                        <div className="border-t border-gray-50 px-6 py-4">
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest shrink-0">Recent:</span>
                                {recentSearches.map((s, i) => (
                                    <button key={i} onClick={() => { setQuery(s); handleSearch(null, s); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-indigo-50 rounded-xl border border-gray-100 hover:border-indigo-100 transition-all group">
                                        <Clock className="h-3 w-3 text-gray-300 group-hover:text-indigo-400" />
                                        <span className="text-[10px] font-bold text-gray-500 group-hover:text-indigo-600 uppercase">{s}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Category Filter Tabs */}
                {results && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {CATEGORIES.map(cat => {
                            const count = counts[cat.key] || 0;
                            const isActive = activeCategory === cat.key;
                            const colors = COLOR_MAP[cat.color];
                            return (
                                <button
                                    key={cat.key}
                                    onClick={() => setActiveCategory(cat.key)}
                                    disabled={cat.key !== 'all' && count === 0}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all whitespace-nowrap border shrink-0 shadow-sm ${isActive ? `${colors.tab} border-transparent shadow-md` : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed'}`}
                                >
                                    {cat.icon && <cat.icon className="h-3.5 w-3.5" />}
                                    {cat.label}
                                    {count > 0 && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${isActive ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>{count}</span>}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Results Summary Bar */}
                {results && (
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {totalFiltered} Total <span className="text-indigo-600">"{query}"</span>
                        </p>
                        <Button variant="ghost" size="sm" onClick={() => { setResults(null); setQuery(''); setActiveCategory('all'); }}
                            className="h-8 px-3 rounded-xl text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:bg-gray-100">
                            <X className="h-3 w-3 mr-1" /> Clear
                        </Button>
                    </div>
                )}
            </div>

            <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 space-y-10">
                {/* Empty State */}
                {!results && !isLoading && (
                    <div className="flex flex-col items-center justify-center py-32 animate-in fade-in duration-700">
                        <div className="h-24 w-24 bg-white border border-gray-100 rounded-3xl flex items-center justify-center shadow-md mb-8 group overflow-hidden relative">
                            <div className="absolute inset-0 bg-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                            <Search className="h-10 w-10 text-gray-200 relative z-10 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight mb-3">Search</h3>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center max-w-sm leading-relaxed">
                            Find anything in our system database. Use <kbd className="px-1.5 py-0.5 bg-gray-50 border border-gray-100 rounded text-gray-500 font-mono">⌘K</kbd> to quick search.
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-10 w-full max-w-2xl">
                            {CATEGORIES.slice(1).map(cat => (
                                <div key={cat.key} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-100 bg-white`}>
                                    <cat.icon className={`h-5 w-5 ${COLOR_MAP[cat.color].badge.split(' ')[1]}`} />
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{cat.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Loader */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-32">
                        <div className="relative mb-8">
                            <div className="h-20 w-20 border-4 border-gray-100 border-t-indigo-600 rounded-full animate-spin" />
                            <Search className="h-8 w-8 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <p className="text-[10px] font-bold text-gray-900 uppercase tracking-widest animate-pulse">Syncing Updates...</p>
                    </div>
                )}

                {/* Results */}
                {results && (() => {
                    const sections = [
                        { key: 'users', label: 'Users', color: 'indigo', icon: User },
                        { key: 'bookings', label: 'Bookings', color: 'blue', icon: Calendar },
                        { key: 'payments', label: 'Payments', color: 'emerald', icon: CreditCard },
                        { key: 'complaints', label: 'Complaints', color: 'rose', icon: AlertTriangle },
                        { key: 'maintenance', label: 'Maintenance', color: 'amber', icon: Wrench },
                    ];

                    return (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {sections.map(({ key, label, color, icon: Icon }) => {
                                const items = filtered[key] || [];
                                if (items.length === 0) return null;
                                const c = COLOR_MAP[color];
                                return (
                                    <section key={key}>
                                        <div className="flex items-center justify-between mb-5">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-7 w-7 rounded-lg ${c.badge} flex items-center justify-center`}>
                                                    <Icon className="h-3.5 w-3.5" />
                                                </div>
                                                <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.25em]">{label}</h2>
                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${c.badge}`}>{items.length}</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {items.map(item => (
                                                <ResultCard key={item.id} item={item} type={key} onClick={() => openDetail(item, key)} />
                                            ))}
                                        </div>
                                    </section>
                                );
                            })}

                            {totalFiltered === 0 && (
                                <div className="text-center py-20">
                                    <Blocks className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                                    <h3 className="text-base font-black text-gray-900 uppercase">Empty</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Clear</p>
                                </div>
                            )}
                        </div>
                    );
                })()}
            </main>

            {/* Unified Detail Modal */}
            <Dialog open={!!selectedItem} onOpenChange={(o) => !o && setSelectedItem(null)}>
                <DialogContent className={`!max-w-none border-none p-0 shadow-2xl bg-white overflow-hidden flex flex-col [&>button]:hidden fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[2.5rem] ${selectedItem && itemType === 'users' ? 'w-[94vw] h-[92vh]' : 'w-[90vw] max-w-2xl h-auto md:h-auto max-h-[90vh]'}`}>
                    {selectedItem && itemType === 'users' ? (
                        <FullScreenUserTerminal user={selectedItem} onClose={() => setSelectedItem(null)} />
                    ) : selectedItem && (() => {
                        const typeConfig = {
                            bookings: { color: 'text-blue-600', bg: 'bg-blue-50', Icon: Calendar, label: 'Booking Record', link: `/admin/bookings/${selectedItem.id}` },
                            payments: { color: 'text-emerald-600', bg: 'bg-emerald-50', Icon: CreditCard, label: 'Payment Record', link: `/admin/payments/${selectedItem.id}` },
                            complaints: { color: 'text-rose-600', bg: 'bg-rose-50', Icon: AlertTriangle, label: 'Issue Report', link: `/admin/complaints/${selectedItem.id}` },
                            maintenance: { color: 'text-amber-600', bg: 'bg-amber-50', Icon: Wrench, label: 'Maintenance Request', link: `/admin/maintenance` },
                        }[itemType];

                        if (!typeConfig) return null;
                        const { color, bg, Icon, label, link } = typeConfig;

                        const fields = {
                            bookings: [
                                { label: 'Hostel Name', value: selectedItem.Room?.Hostel?.name },
                                { label: 'Room No', value: selectedItem.Room?.roomNumber ? `Room ${selectedItem.Room.roomNumber}` : 'N/A' },
                                { label: 'Resident Name', value: selectedItem.User?.name },
                                { label: 'Current Status', value: selectedItem.status },
                                { label: 'Check In Date', value: selectedItem.checkIn ? format(new Date(selectedItem.checkIn), 'MMM dd, yyyy') : 'N/A' },
                                { label: 'Total Amount', value: `PKR ${selectedItem.totalAmount?.toLocaleString() || 0}` },
                                { label: 'Security Fee', value: `PKR ${selectedItem.securityDeposit?.toLocaleString() || 0}` },
                                { label: 'Record UID', value: selectedItem.uid || 'N/A' },
                            ],
                            payments: [
                                { label: 'Total Paid', value: `PKR ${selectedItem.amount?.toLocaleString()}` },
                                { label: 'Payment Status', value: selectedItem.status },
                                { label: 'Resident Name', value: selectedItem.User?.name },
                                { label: 'Payment Mode', value: selectedItem.method || 'CASH' },
                                { label: 'Billing Month', value: selectedItem.month || 'N/A' },
                                { label: 'Account Type', value: selectedItem.type || 'RENT' },
                                { label: 'Voucher Date', value: selectedItem.date ? format(new Date(selectedItem.date), 'MMM dd, yyyy') : 'N/A' },
                                { label: 'Transaction ID', value: selectedItem.transactionId || 'INTERNAL' },
                            ],
                            complaints: [
                                { label: 'Issue Title', value: selectedItem.title },
                                { label: 'Current Status', value: selectedItem.status },
                                { label: 'Category', value: selectedItem.category || 'General' },
                                { label: 'Priority Level', value: selectedItem.priority || 'Normal' },
                                { label: 'Branch Name', value: selectedItem.Hostel?.name },
                                { label: 'Reported By', value: selectedItem.User_Complaint_userIdToUser?.name || 'N/A' },
                                { label: 'Full Description', value: selectedItem.description, fullWidth: true },
                                { label: 'Complaint ID', value: selectedItem.uid || 'N/A' },
                            ],
                            maintenance: [
                                { label: 'Request Type', value: selectedItem.title },
                                { label: 'Current Status', value: selectedItem.status },
                                { label: 'Hostel Name', value: selectedItem.Hostel?.name },
                                { label: 'Room Unit', value: selectedItem.Room?.roomNumber ? `Room ${selectedItem.Room.roomNumber}` : 'N/A' },
                                { label: 'Submitted By', value: selectedItem.User_maintanance_userIdToUser?.name || 'N/A' },
                                { label: 'Problem Details', value: selectedItem.description, fullWidth: true },
                                { label: 'Creation Date', value: selectedItem.createdAt ? format(new Date(selectedItem.createdAt), 'MMM dd, yyyy') : 'N/A' },
                                { label: 'Request ID', value: selectedItem.uid || 'N/A' },
                            ],
                        }[itemType] || [];

                        return (
                            <div className="flex-1 flex flex-col bg-gray-50/30">
                                {/* Header Section */}
                                <div className="bg-white px-10 py-8 border-b border-gray-100 flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-5">
                                        <div className={`h-12 w-12 rounded-2xl ${bg} ${color} flex items-center justify-center`}>
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">
                                                {itemType === 'payments' ? `PKR ${selectedItem.amount?.toLocaleString()}` : selectedItem.title || selectedItem.Room?.Hostel?.name}
                                            </h3>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{label}</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" onClick={() => setSelectedItem(null)} className="h-10 w-10 p-0 rounded-xl border-gray-200 text-gray-400">
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>

                                {/* Content Section */}
                                <div className="flex-1 overflow-y-auto p-8">
                                    <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-8">
                                            {fields.map((f, i) => (
                                                <div key={i} className={f.fullWidth ? 'col-span-2 bg-gray-50/50 p-6 rounded-2xl border border-gray-100' : ''}>
                                                    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">{f.label}</p>
                                                    <p className={`font-bold text-gray-900 ${f.fullWidth ? 'text-sm leading-relaxed' : 'text-base'}`}>
                                                        {f.value || 'N/A'}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="px-10 py-8 bg-white border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
                                    {(itemType === 'payments' || itemType === 'bookings') && (
                                        <UnifiedReceipt data={selectedItem} type={itemType === 'payments' ? 'payment' : 'booking'}>
                                            <Button variant="outline" className="h-12 px-8 rounded-2xl border-gray-200 text-gray-600 font-bold text-[10px] uppercase tracking-widest gap-2">
                                                <Printer className="h-4 w-4" /> Print
                                            </Button>
                                        </UnifiedReceipt>
                                    )}

                                    {/* Action Controls */}
                                    {selectedItem.status !== 'CANCELLED' && selectedItem.status !== 'RESOLVED' && (
                                        <div className="flex gap-2 border-r pr-3 mr-3 border-gray-100">
                                            {itemType === 'payments' && selectedItem.status === 'PENDING' && (
                                                <Button
                                                    onClick={() => handleGlobalUpdate(selectedItem.id, 'payments', 'PAID')}
                                                    disabled={isUpdating}
                                                    className="h-12 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-widest gap-2 border-none shadow-lg shadow-emerald-500/10"
                                                >
                                                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} Verify
                                                </Button>
                                            )}
                                            {itemType === 'bookings' && selectedItem.status === 'PENDING' && (
                                                <Button
                                                    onClick={() => handleGlobalUpdate(selectedItem.id, 'bookings', 'CHECKED_IN')}
                                                    disabled={isUpdating}
                                                    className="h-12 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-widest gap-2 border-none shadow-lg shadow-blue-500/10"
                                                >
                                                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />} Check-In
                                                </Button>
                                            )}
                                            {(itemType === 'complaints' || itemType === 'maintenance') && selectedItem.status !== 'RESOLVED' && (
                                                <Button
                                                    onClick={() => handleGlobalUpdate(selectedItem.id, itemType, 'RESOLVED')}
                                                    disabled={isUpdating}
                                                    className="h-12 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-widest gap-2 border-none shadow-lg shadow-emerald-500/10"
                                                >
                                                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Resolve
                                                </Button>
                                            )}
                                            {(itemType === 'payments' || itemType === 'bookings') && selectedItem.status !== 'CANCELLED' && (
                                                <Button
                                                    onClick={() => handleGlobalUpdate(selectedItem.id, itemType, 'CANCELLED')}
                                                    disabled={isUpdating}
                                                    variant="ghost"
                                                    className="h-12 px-8 rounded-2xl text-rose-600 hover:bg-rose-50 font-bold text-[10px] uppercase tracking-widest gap-2"
                                                >
                                                    Cancel
                                                </Button>
                                            )}
                                        </div>
                                    )}

                                    <Link href={link}>
                                        <Button variant="ghost" className="h-12 px-8 rounded-2xl text-gray-500 hover:bg-gray-50 font-bold text-[10px] uppercase tracking-widest gap-2">
                                            Full Page <ExternalLink className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        );
                    })()}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SearchPage;
