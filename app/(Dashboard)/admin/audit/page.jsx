"use client"
import React, { useState, useEffect, useRef } from 'react';
import {
    Search, User, Calendar, CreditCard, AlertTriangle,
    Mail, Phone, Building2, FileText, Wrench, ExternalLink,
    RefreshCw, Activity, Blocks, Fingerprint, CheckCircle,
    Loader2, Download, ChevronRight, Clock, Hash, X,
    ArrowRight, Command, Filter, SlidersHorizontal
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import Link from 'next/link';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";

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

const SearchPage = () => {
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [activeCategory, setActiveCategory] = useState('all');
    const [selectedItem, setSelectedItem] = useState(null);
    const [itemType, setItemType] = useState(null);
    const [recentSearches, setRecentSearches] = useState([]);
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
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-3">Search</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center max-w-md leading-relaxed">
                            Find anything in the system. Use <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">⌘K</kbd> to search.
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
                        <p className="text-[11px] font-black text-gray-900 uppercase tracking-widest animate-pulse">Updates...</p>
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
                                                <h2 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.25em]">{label}</h2>
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${c.badge}`}>{items.length}</span>
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
                <DialogContent className="rounded-3xl border-none p-0 max-w-xl shadow-2xl bg-white overflow-hidden flex flex-col max-h-[90vh]">
                    {selectedItem && (() => {
                        const typeConfig = {
                            users: { color: 'bg-indigo-600', Icon: User, title: selectedItem.name, link: `/admin/users-records/${selectedItem.id}` },
                            bookings: { color: 'bg-blue-600', Icon: Calendar, title: selectedItem.Room?.Hostel?.name || 'Booking', link: `/admin/bookings/${selectedItem.id}` },
                            payments: { color: 'bg-emerald-600', Icon: CreditCard, title: `PKR ${selectedItem.amount?.toLocaleString()}`, link: `/admin/payments/${selectedItem.id}` },
                            complaints: { color: 'bg-rose-600', Icon: AlertTriangle, title: selectedItem.title, link: `/admin/complaints/${selectedItem.id}` },
                            maintenance: { color: 'bg-amber-600', Icon: Wrench, title: selectedItem.title, link: `/admin/maintenance` },
                        }[itemType];
                        if (!typeConfig) return null;
                        const { color, Icon, title, link } = typeConfig;

                        const fields = {
                            users: [
                                { label: 'Full Name', value: selectedItem.name }, { label: 'Email', value: selectedItem.email },
                                { label: 'Phone', value: selectedItem.phone || 'N/A' }, { label: 'CNIC', value: selectedItem.cnic || 'N/A' },
                                { label: 'Role', value: selectedItem.role }, { label: 'Status', value: selectedItem.isActive ? 'Active' : 'Inactive' },
                                { label: 'Hostel', value: selectedItem.Hostel_User_hostelIdToHostel?.name || 'Hostel' },
                                { label: 'Joined', value: selectedItem.createdAt ? format(new Date(selectedItem.createdAt), 'MMM dd, yyyy') : 'N/A' },
                            ],
                            bookings: [
                                { label: 'Hostel', value: selectedItem.Room?.Hostel?.name }, { label: 'Room', value: `Room ${selectedItem.Room?.roomNumber}` },
                                { label: 'Resident', value: selectedItem.User?.name }, { label: 'Status', value: selectedItem.status },
                                { label: 'Check In', value: selectedItem.checkIn ? format(new Date(selectedItem.checkIn), 'MMM dd, yyyy') : 'N/A' },
                                { label: 'Total Amount', value: `PKR ${selectedItem.totalAmount?.toLocaleString() || 0}` },
                                { label: 'Security Deposit', value: `PKR ${selectedItem.securityDeposit?.toLocaleString() || 0}` },
                                { label: 'Booking ID', value: selectedItem.uid || selectedItem.id?.slice(-8).toUpperCase() },
                            ],
                            payments: [
                                { label: 'Amount', value: `PKR ${selectedItem.amount?.toLocaleString()}` }, { label: 'Status', value: selectedItem.status },
                                { label: 'Resident', value: selectedItem.User?.name }, { label: 'Method', value: selectedItem.method || 'N/A' },
                                { label: 'Month', value: selectedItem.month || 'N/A' }, { label: 'Type', value: selectedItem.type || 'N/A' },
                                { label: 'Date', value: selectedItem.date ? format(new Date(selectedItem.date), 'MMM dd, yyyy') : 'N/A' },
                                { label: 'Payment ID', value: selectedItem.uid || selectedItem.id?.slice(-8).toUpperCase() },
                            ],
                            complaints: [
                                { label: 'Title', value: selectedItem.title }, { label: 'Status', value: selectedItem.status },
                                { label: 'Category', value: selectedItem.category || 'General' }, { label: 'Priority', value: selectedItem.priority || 'Normal' },
                                { label: 'Hostel', value: selectedItem.Hostel?.name }, { label: 'Reported By', value: selectedItem.User_Complaint_userIdToUser?.name || 'N/A' },
                                { label: 'Description', value: selectedItem.description?.slice(0, 100) + (selectedItem.description?.length > 100 ? '...' : '') },
                                { label: 'Complaint ID', value: selectedItem.uid || selectedItem.id?.slice(-8).toUpperCase() },
                            ],
                            maintenance: [
                                { label: 'Issue', value: selectedItem.title }, { label: 'Status', value: selectedItem.status },
                                { label: 'Hostel', value: selectedItem.Hostel?.name }, { label: 'Room', value: selectedItem.Room?.roomNumber ? `Room ${selectedItem.Room.roomNumber}` : 'N/A' },
                                { label: 'Reported By', value: selectedItem.User_maintanance_userIdToUser?.name || 'N/A' },
                                { label: 'Description', value: selectedItem.description?.slice(0, 100) + (selectedItem.description?.length > 100 ? '...' : '') },
                                { label: 'Created', value: selectedItem.createdAt ? format(new Date(selectedItem.createdAt), 'MMM dd, yyyy') : 'N/A' },
                                { label: 'Issue ID', value: selectedItem.uid || selectedItem.id?.slice(-8).toUpperCase() },
                            ],
                        }[itemType] || [];

                        return (
                            <>
                                <div className={`${color} px-8 py-6 flex items-center gap-4 shrink-0`}>
                                    <div className="h-12 w-12 rounded-2xl bg-white/15 flex items-center justify-center">
                                        <Icon className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest">{itemType}</p>
                                        <h3 className="text-lg font-black text-white uppercase tracking-tight truncate max-w-xs">{title}</h3>
                                    </div>
                                </div>

                                <div className="p-8 overflow-y-auto">
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                                        {fields.map((f, i) => (
                                            <div key={i} className={f.label.includes('Description') || f.label.includes('Title') ? 'col-span-2' : ''}>
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{f.label}</p>
                                                <p className="text-sm font-bold text-gray-900 mt-0.5 break-words">{f.value || 'N/A'}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="px-8 pb-8 shrink-0">
                                    <Link href={link}>
                                        <Button className="w-full h-12 rounded-2xl bg-gray-950 hover:bg-gray-800 text-white font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                                            Check <ExternalLink className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </>
                        );
                    })()}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SearchPage;
