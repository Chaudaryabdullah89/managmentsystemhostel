"use client"
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Search, User, Calendar, CreditCard, AlertTriangle,
    Building2, Wrench, RefreshCw, Activity, CheckCircle,
    Loader2, Download, ChevronRight, Clock, Hash, X,
    ChevronLeft, History, AlertCircle, TrendingUp, Plus, ExternalLink, Phone, Printer, Fingerprint
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import UnifiedReceipt from "@/components/receipt/UnifiedReceipt";
import useAuthStore from '@/hooks/Authstate';

const CATEGORIES = [
    { key: 'all', label: 'All', color: 'gray' },
    { key: 'users', label: 'Residents', color: 'indigo', icon: User },
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
    const configs = {
        users: { color: COLOR_MAP.indigo, icon: User, title: item.name, sub: item.email, meta: item.role, idField: item.uid },
        bookings: { color: COLOR_MAP.blue, icon: Calendar, title: item.Room?.Hostel?.name || 'Booking', sub: `Room ${item.Room?.roomNumber} • ${item.User?.name}`, meta: item.status, idField: item.uid },
        payments: { color: COLOR_MAP.emerald, icon: CreditCard, title: `PKR ${item.amount?.toLocaleString()}`, sub: item.User?.name, meta: item.status, idField: item.uid },
        complaints: { color: COLOR_MAP.rose, icon: AlertTriangle, title: item.title, sub: item.Hostel?.name, meta: item.status, idField: item.uid },
        maintenance: { color: COLOR_MAP.amber, icon: Wrench, title: item.title, sub: item.Hostel?.name, meta: item.status, idField: item.uid },
    };

    const config = configs[type];
    if (!config) return null;
    const Icon = config.icon;

    return (
        <div
            onClick={onClick}
            className={`bg-white border border-gray-100 rounded-2xl p-5 flex items-center justify-between group ${config.color.hover} hover:shadow-lg transition-all cursor-pointer relative overflow-hidden`}
        >
            <div className={`absolute left-0 top-0 w-1 h-full ${config.color.bar} opacity-70 rounded-r`} />
            <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className={`h-11 w-11 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 ${config.color.icon} transition-colors`}>
                    <Icon className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight truncate">{config.title}</h3>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 truncate">{config.sub}</p>
                </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0 ml-4">
                <StatusBadge status={config.meta} />
                {config.idField && <span className="text-[8px] font-mono font-bold text-gray-300">{config.idField}</span>}
            </div>
        </div>
    );
};

// Full Screen User Detail view for auditing a single resident
const FullScreenUserTerminal = ({ user: initialUser, onClose }) => {
    const router = useRouter();
    const [user, setUser] = useState(initialUser);
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");

    const fetchDetails = () => {
        setLoading(true);
        fetch(`/api/users/${user.id}`)
            .then(res => res.json())
            .then(data => { if (data.success) { setDetails(data.user); } setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        if (user.id) fetchDetails();
    }, [user.id]);

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
    const profileDocuments = details?.ResidentProfile?.documents || {};
    const profileGalleryImages = Array.isArray(profileDocuments?.galleryImages) ? profileDocuments.galleryImages : [];

    return (
        <div className="relative w-full h-full bg-white flex overflow-hidden font-sans rounded-[2.5rem]">
            <aside className="w-72 bg-gray-50/50 flex flex-col shrink-0 border-r border-gray-100">
                <div className="p-8 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-indigo-500/20">
                            {user.name?.charAt(0)}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-gray-900 font-bold text-base truncate leading-tight">{user.name}</h2>
                            <p className="text-indigo-600 text-[9px] font-bold uppercase tracking-[0.2em] mt-1">{user.role}</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all group ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-sm'}`}
                        >
                            <tab.icon className={`h-4.5 w-4.5 ${activeTab === tab.id ? 'text-white' : 'text-gray-400 group-hover:text-indigo-600'}`} />
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

            <main className="flex-1 flex flex-col bg-gray-50/50 overflow-hidden relative">
                <header className="bg-white border-b px-10 py-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-8">
                        <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">User ID</p>
                            <p className="text-sm font-bold text-gray-900 mt-1">{user.uid || 'N/A'} • {user.regNumber || 'N/A'}</p>
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
                        <Button onClick={() => window.print()} className="h-10 px-6 rounded-xl bg-gray-900 border-none text-white font-bold text-[10px] uppercase tracking-widest gap-2">
                            <Printer className="h-3.5 w-3.5" /> Print
                        </Button>
                    </div>
                </header>

                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
                        <p className="text-[11px] font-black text-gray-900 uppercase tracking-[0.3em] animate-pulse">Loading Audit Data...</p>
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
                                            <Activity className="h-3.5 w-3.5 text-indigo-600" /> Identity Profile
                                        </h3>
                                        <div className="grid grid-cols-2 gap-y-10">
                                            {[
                                                { label: 'Full name', value: user.name },
                                                { label: 'Email', value: user.email },
                                                { label: 'CNIC / ID', value: user.cnic || '—' },
                                                { label: 'Reg Number', value: user.regNumber || '—' },
                                                { label: 'Emergency', value: details?.ResidentProfile?.emergencyContact || '—' },
                                                { label: 'Address', value: user.address || '—' },
                                                { label: 'Current Residence', value: details?.ResidentProfile?.documents?.currentResidence || '—' },
                                                { label: 'Additional Docs', value: Array.isArray(details?.ResidentProfile?.documents?.galleryImages) ? details.ResidentProfile.documents.galleryImages.length : 0 },
                                                { label: 'Join Date', value: user.createdAt ? format(new Date(user.createdAt), 'MMMM dd, yyyy') : '—' },
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
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-white/60 mb-8">Hostel Unit</h3>
                                        <div className="space-y-10 relative z-10">
                                            <div className="flex items-center gap-5">
                                                <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                                                    <Building2 className="h-7 w-7" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Hostel Name</p>
                                                    <p className="text-lg font-bold text-white mt-1 uppercase">{details?.Hostel_User_hostelIdToHostel?.name || 'Assigned Branch'}</p>
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
                                {profileGalleryImages.length > 0 && (
                                    <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-5">Additional Documents</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {profileGalleryImages.map((src, idx) => (
                                                <a
                                                    key={`${src}-${idx}`}
                                                    href={src}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="block rounded-xl overflow-hidden border border-gray-100 bg-white"
                                                >
                                                    <img src={src} alt={`profile-doc-${idx}`} className="h-28 w-full object-cover" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'bookings' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Booking History</h2>
                                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-gray-50/50 h-16">
                                            <TableRow className="border-none">
                                                <TableHead className="px-10 text-[10px] font-black uppercase tracking-[0.2em]">Check-In</TableHead>
                                                <TableHead className="px-6 text-[10px] font-black uppercase tracking-[0.2em]">Room</TableHead>
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
                                                    <TableCell className="px-6 py-6 font-black text-indigo-600 text-sm">Room {b.Room?.roomNumber}</TableCell>
                                                    <TableCell className="px-6 py-6"><StatusBadge status={b.status} /></TableCell>
                                                    <TableCell className="px-10 py-6 text-right">
                                                        <UnifiedReceipt data={b} type="booking">
                                                            <Button variant="ghost" className="h-8 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 font-bold text-[8px] uppercase tracking-widest">Receipt</Button>
                                                        </UnifiedReceipt>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'payments' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Transactions</h2>
                                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-gray-50/50 h-16">
                                            <TableRow className="border-none">
                                                <TableHead className="px-10 text-[10px] font-black uppercase tracking-[0.2em]">Date</TableHead>
                                                <TableHead className="px-6 text-[10px] font-black uppercase tracking-[0.2em]">Mode</TableHead>
                                                <TableHead className="px-6 text-[10px] font-black uppercase tracking-[0.2em]">Amount</TableHead>
                                                <TableHead className="px-6 text-[10px] font-black uppercase tracking-[0.2em] text-right">Receipt</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {details?.Payment?.map((p) => (
                                                <TableRow key={p.id} className="border-gray-50 group hover:bg-gray-50/50 transition-colors">
                                                    <TableCell className="px-10 py-6 font-black text-gray-900 text-sm">{format(new Date(p.date || p.createdAt), 'MMM dd, yyyy')}</TableCell>
                                                    <TableCell className="px-6 py-6">
                                                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{p.method || 'CASH'}</span>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-6 font-black text-emerald-600 text-sm">PKR {p.amount?.toLocaleString()}</TableCell>
                                                    <TableCell className="px-10 py-6 text-right">
                                                        <UnifiedReceipt data={p} type="payment">
                                                            <Button variant="ghost" className="h-8 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 font-black text-[8px] uppercase tracking-widest">Receipt</Button>
                                                        </UnifiedReceipt>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'activity' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Timeline</h2>
                                <div className="relative pl-8 space-y-10">
                                    <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-100" />
                                    {activities.map((act, i) => (
                                        <div key={i} className="relative group">
                                            <div className="absolute -left-[28px] top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-white border-2 border-gray-200 group-hover:border-indigo-600 transition-colors z-10 shadow-sm" />
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
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

const WardenSearchPage = () => {
    const router = useRouter();
    const { user: currentUser } = useAuthStore();
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [activeCategory, setActiveCategory] = useState('all');
    const [selectedItem, setSelectedItem] = useState(null);
    const [itemType, setItemType] = useState(null);
    const [recentSearches, setRecentSearches] = useState([]);
    const inputRef = useRef(null);

    const handleSearch = async (e, overrideQuery) => {
        e?.preventDefault();
        const q = overrideQuery || query;
        if (!q.trim() || q.trim().length < 3) {
            toast.error("Please enter at least 3 characters");
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch(`/api/warden/search?query=${encodeURIComponent(q)}`);
            const data = await response.json();
            if (data.success) {
                setResults(data.results);
                setActiveCategory('all');
                setRecentSearches(prev => [q, ...prev.filter(s => s !== q)].slice(0, 5));
                if (data.total === 0) toast.error("No matches found in your hostel");
            } else {
                toast.error(data.error || "Search failed");
            }
        } catch {
            toast.error("Network error.");
        } finally {
            setIsLoading(false);
        }
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

    const counts = getCounts();
    const filtered = useMemo(() => {
        if (!results) return {};
        if (activeCategory === 'all') return results;
        return { [activeCategory]: results[activeCategory] || [] };
    }, [results, activeCategory]);

    const totalFiltered = Object.values(filtered).reduce((s, a) => s + (a?.length || 0), 0);

    return (
        <div className="min-h-screen bg-gray-50/30 pb-24 font-sans">
            {/* Page title — no custom sticky header, layout provides the sidebar trigger */}
            <div className="flex items-center gap-3 px-4 md:px-8 pt-6 pb-2 max-w-[1400px] mx-auto">
                <div className="h-8 w-1.5 bg-indigo-600 rounded-full shrink-0" />
                <div>
                    <h1 className="text-base font-bold text-gray-900 uppercase tracking-tight">Audit &amp; Search</h1>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">
                        {currentUser?.Hostel_User_hostelIdToHostel?.name || "Hostel"} Management
                    </p>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-8 space-y-6">
                <div className="bg-white border border-gray-100 rounded-[2rem] shadow-sm overflow-hidden">
                    <form onSubmit={handleSearch} className="flex items-center gap-3 p-3">
                        <div className="flex-1 flex items-center gap-3 px-3">
                            {isLoading ? <Loader2 className="h-5 w-5 text-indigo-600 animate-spin shrink-0" /> : <Search className="h-5 w-5 text-gray-300 shrink-0" />}
                            <Input
                                ref={inputRef}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search residents, bookings, payments..."
                                className="h-14 bg-transparent border-none shadow-none font-bold text-base focus-visible:ring-0 placeholder:text-gray-300"
                            />
                            {query && (
                                <button type="button" onClick={() => { setQuery(''); setResults(null); }} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors shrink-0">
                                    <X className="h-4 w-4 text-gray-400" />
                                </button>
                            )}
                        </div>
                        <Button type="submit" disabled={isLoading} className="h-12 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all">
                            Find Records
                        </Button>
                    </form>

                    {!results && recentSearches.length > 0 && (
                        <div className="border-t border-gray-50 px-6 py-4 flex items-center gap-3 overflow-x-auto scrollbar-hide">
                            <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest shrink-0">Recent:</span>
                            {recentSearches.map((s, i) => (
                                <button key={i} onClick={() => { setQuery(s); handleSearch(null, s); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-indigo-50 rounded-xl border border-gray-100 hover:border-indigo-100 transition-all group shrink-0">
                                    <Clock className="h-3 w-3 text-gray-300 group-hover:text-indigo-400" />
                                    <span className="text-[10px] font-bold text-gray-500 group-hover:text-indigo-600 uppercase">{s}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {results && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            {CATEGORIES.map(cat => {
                                const count = counts[cat.key] || 0;
                                const isActive = activeCategory === cat.key;
                                return (
                                    <button
                                        key={cat.key}
                                        onClick={() => setActiveCategory(cat.key)}
                                        disabled={cat.key !== 'all' && count === 0}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all border shrink-0 shadow-sm ${isActive ? `${COLOR_MAP[cat.color].tab} border-transparent shadow-md` : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200 disabled:opacity-30'}`}
                                    >
                                        {cat.label}
                                        {count > 0 && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${isActive ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>{count}</span>}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Found {totalFiltered} Matches in Hostel Search
                        </p>
                    </div>
                )}
            </div>

            <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 space-y-10">
                {!results && !isLoading && (
                    <div className="flex flex-col items-center justify-center py-32 animate-in fade-in duration-700">
                        <div className="h-24 w-24 bg-white border border-gray-100 rounded-3xl flex items-center justify-center shadow-md mb-8 group overflow-hidden relative">
                            <div className="absolute inset-0 bg-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                            <Search className="h-10 w-10 text-gray-200 relative z-10 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight mb-3">Hostel Audit Database</h3>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center max-w-sm leading-relaxed">
                            Search for any resident or transaction record within your assigned hostel.
                        </p>
                    </div>
                )}

                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-32">
                        <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
                        <p className="text-[10px] font-bold text-gray-900 uppercase tracking-widest animate-pulse">Scanning Hostel Records...</p>
                    </div>
                )}

                {results && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {CATEGORIES.slice(1).map(({ key, label, color, icon: Icon }) => {
                            const items = filtered[key] || [];
                            if (items.length === 0) return null;
                            const c = COLOR_MAP[color];
                            return (
                                <section key={key}>
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className={`h-7 w-7 rounded-lg ${c.badge} flex items-center justify-center`}>
                                            <Icon className="h-3.5 w-3.5" />
                                        </div>
                                        <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.25em]">{label}</h2>
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${c.badge}`}>{items.length}</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {items.map(item => (
                                            <ResultCard key={item.id} item={item} type={key} onClick={() => { setSelectedItem(item); setItemType(key); }} />
                                        ))}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                )}
            </main>

            <Dialog open={!!selectedItem} onOpenChange={(o) => !o && setSelectedItem(null)}>
                <DialogContent className={`!max-w-none border-none p-0 shadow-2xl bg-white overflow-hidden flex flex-col [&>button]:hidden fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[2.5rem] ${selectedItem && itemType === 'users' ? 'w-[94vw] h-[92vh]' : 'w-[90vw] max-w-2xl h-auto max-h-[90vh]'}`}>
                    <DialogHeader className="sr-only">
                        <DialogTitle>Audit Record Details</DialogTitle>
                    </DialogHeader>
                    {selectedItem && itemType === 'users' ? (
                        <FullScreenUserTerminal user={selectedItem} onClose={() => setSelectedItem(null)} />
                    ) : selectedItem && (() => {
                        const config = {
                            bookings: { color: 'text-blue-600', bg: 'bg-blue-50', Icon: Calendar, label: 'Booking Record', link: `/warden/bookings` },
                            payments: { color: 'text-emerald-600', bg: 'bg-emerald-50', Icon: CreditCard, label: 'Payment Record', link: `/warden/payments` },
                            complaints: { color: 'text-rose-600', bg: 'bg-rose-50', Icon: AlertTriangle, label: 'Issue Report', link: `/warden/complaints` },
                            maintenance: { color: 'text-amber-600', bg: 'bg-amber-50', Icon: Wrench, label: 'Maintenance Request', link: `/warden/rooms` },
                        }[itemType];

                        if (!config) return null;
                        const fields = {
                            bookings: [
                                { label: 'Room No', value: selectedItem.Room?.roomNumber ? `Room ${selectedItem.Room.roomNumber}` : 'N/A' },
                                { label: 'Resident', value: selectedItem.User?.name },
                                { label: 'Resident CNIC', value: selectedItem.User?.cnic || 'N/A' },
                                { label: 'Current Residence', value: selectedItem.User?.ResidentProfile?.documents?.currentResidence || 'N/A' },
                                { label: 'Status', value: selectedItem.status },
                                { label: 'Check In', value: selectedItem.checkIn ? format(new Date(selectedItem.checkIn), 'MMM dd, yyyy') : 'N/A' },
                                { label: 'Additional Documents', value: Array.isArray(selectedItem.User?.ResidentProfile?.documents?.galleryImages) ? selectedItem.User.ResidentProfile.documents.galleryImages.length : 0 },
                                { label: 'UID', value: selectedItem.uid || 'N/A' },
                            ],
                            payments: [
                                { label: 'Amount', value: `PKR ${selectedItem.amount?.toLocaleString()}` },
                                { label: 'Status', value: selectedItem.status },
                                { label: 'Resident', value: selectedItem.User?.name },
                                { label: 'Mode', value: selectedItem.method || 'CASH' },
                                { label: 'Type', value: selectedItem.type || 'RENT' },
                                { label: 'Date', value: selectedItem.date ? format(new Date(selectedItem.date), 'MMM dd, yyyy') : 'N/A' },
                            ],
                            complaints: [
                                { label: 'Title', value: selectedItem.title },
                                { label: 'Status', value: selectedItem.status },
                                { label: 'Reported By', value: selectedItem.User_Complaint_userIdToUser?.name || 'N/A' },
                                { label: 'Description', value: selectedItem.description, fullWidth: true },
                            ],
                            maintenance: [
                                { label: 'Request', value: selectedItem.title },
                                { label: 'Status', value: selectedItem.status },
                                { label: 'By', value: selectedItem.User_maintanance_userIdToUser?.name || 'N/A' },
                                { label: 'Description', value: selectedItem.description, fullWidth: true },
                            ]
                        }[itemType] || [];

                        return (
                            <div className="flex-1 flex flex-col bg-gray-50/30">
                                <div className="bg-white px-10 py-8 border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-5">
                                        <div className={`h-12 w-12 rounded-2xl ${config.bg} ${config.color} flex items-center justify-center`}><config.Icon className="h-6 w-6" /></div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Audit Record</h3>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{config.label}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" onClick={() => setSelectedItem(null)} className="h-10 w-10 p-0 rounded-xl border-gray-200 text-gray-400"><X className="h-5 w-5" /></Button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-8">
                                    <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm grid grid-cols-2 gap-8">
                                        {fields.map((f, i) => (
                                            <div key={i} className={f.fullWidth ? 'col-span-2' : ''}>
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">{f.label}</p>
                                                <p className="font-bold text-gray-900 text-sm whitespace-pre-wrap">{f.value || '—'}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="px-10 py-8 bg-white border-t border-gray-100 flex items-center justify-end gap-3">
                                    {(itemType === 'payments' || itemType === 'bookings') && (
                                        <UnifiedReceipt data={selectedItem} type={itemType === 'payments' ? 'payment' : 'booking'}>
                                            <Button variant="outline" className="h-12 px-8 rounded-2xl border-gray-200 font-bold text-[10px] uppercase tracking-widest gap-2"><Printer className="h-4 w-4" /> Export</Button>
                                        </UnifiedReceipt>
                                    )}
                                    <Link href={config.link}><Button variant="ghost" className="h-12 px-8 rounded-2xl text-gray-500 font-bold text-[10px] uppercase tracking-widest gap-2">View History <ExternalLink className="h-4 w-4" /></Button></Link>
                                </div>
                            </div>
                        );
                    })()}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default WardenSearchPage;
