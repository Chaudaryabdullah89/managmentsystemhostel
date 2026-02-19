"use client"
import React, { useState } from 'react';
import {
    Search,
    User,
    Calendar,
    CreditCard,
    AlertTriangle,
    Mail,
    Phone,
    Building2,
    FileText,
    Wrench,
    ExternalLink,
    LayoutGrid,
    History,
    RefreshCw,
    Activity,
    Blocks,
    Fingerprint,
    Scan,
    ArrowUpRight,
    ArrowRight,
    CheckCircle,
    Loader2
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import Link from 'next/link';

const SearchPage = () => {
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState(null);

    const handleSearch = async (e) => {
        e?.preventDefault();
        if (!query.trim() || query.trim().length < 3) {
            toast.error("Please enter at least 3 characters");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`/api/admin/search?query=${encodeURIComponent(query)}`);
            const data = await response.json();

            if (data.success) {
                setResults(data.results);
                if (data.total === 0) {
                    toast.error("No matches found");
                } else {
                    toast.success(`Found ${data.total} results`);
                }
            } else {
                toast.error(data.error || "Search failed");
            }
        } catch (error) {
            toast.error("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const StatusBadge = ({ status }) => {
        const colors = {
            'PAID': 'bg-emerald-50 text-emerald-600',
            'CONFIRMED': 'bg-emerald-50 text-emerald-600',
            'CHECKED_IN': 'bg-indigo-50 text-indigo-600',
            'PENDING': 'bg-amber-50 text-amber-600',
            'OVERDUE': 'bg-rose-50 text-rose-600',
            'CANCELLED': 'bg-gray-50 text-gray-600',
            'RESOLVED': 'bg-emerald-50 text-emerald-600',
            'OPEN': 'bg-rose-50 text-rose-600',
            'IN_PROGRESS': 'bg-blue-50 text-blue-600',
            'COMPLETED': 'bg-emerald-50 text-emerald-600'
        };

        return (
            <Badge className={`${colors[status?.toUpperCase()] || 'bg-gray-50 text-gray-600'} border-none text-[10px] font-bold uppercase tracking-wider px-3 py-1`}>
                {status}
            </Badge>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight">
            {/* Simple Premium Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-1 bg-indigo-600 rounded-full" />
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight uppercase">Search Records</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">System Files</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Online</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100 h-9 w-9 text-gray-400">
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Badge variant="outline" className="h-7 px-3 rounded-full border-gray-100 bg-gray-50 text-[9px] font-bold uppercase tracking-widest text-gray-400">
                            SECURE
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto px-6 pt-10">
                <div className="bg-white border border-gray-100 rounded-[2rem] p-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-full bg-slate-50/50 skew-x-12 translate-x-32 pointer-events-none" />
                    <form onSubmit={handleSearch} className="relative z-10 flex items-center gap-2">
                        <div className="flex-1 relative group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search users, bookings, payments, or IDs..."
                                className="h-16 pl-14 pr-40 bg-transparent border-none shadow-none font-bold text-base focus-visible:ring-0 placeholder:text-gray-300"
                            />
                            {query && (
                                <span className="absolute right-32 top-1/2 -translate-y-1/2 text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full uppercase transition-all animate-in fade-in zoom-in">
                                    {isLoading ? 'Searching...' : 'Ready'}
                                </span>
                            )}
                        </div>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="h-12 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-indigo-100 transition-all active:scale-95"
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                            Search Now
                        </Button>
                    </form>
                </div>
            </div>

            <main className="max-w-[1200px] mx-auto px-6 py-12">
                {!results && !isLoading && (
                    <div className="text-center py-32 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        <div className="h-24 w-24 bg-white border border-slate-100 rounded-3xl flex items-center justify-center shadow-xl shadow-slate-100 mb-8 group overflow-hidden relative">
                            <div className="absolute inset-0 bg-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                            <Search className="h-10 w-10 text-slate-300 relative z-10 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Search Records</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] max-w-sm mx-auto leading-relaxed">
                            Search for any student name, email, or system ID to view their history.
                        </p>
                    </div>
                )}

                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-32">
                        <div className="relative mb-8">
                            <div className="h-20 w-20 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
                            <Search className="h-8 w-8 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest animate-pulse">Searching Records...</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-2">Loading data</p>
                    </div>
                )}

                {results && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        {/* Users */}
                        {results.users?.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                        Found Users ({results.users.length})
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {results.users.map((user) => (
                                        <Link key={user.id} href={`/admin/users-records/${user.id}`}>
                                            <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center justify-between group hover:shadow-xl hover:border-indigo-100 transition-all relative overflow-hidden">
                                                <div className="absolute left-0 top-0 w-1.5 h-full bg-indigo-500 opacity-60" />
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0 group-hover:bg-indigo-600 transition-colors">
                                                        <User className="h-6 w-6 text-gray-400 group-hover:text-white transition-colors" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-900 uppercase tracking-tight flex items-center gap-2">
                                                            {user.name}
                                                            {user.uid && <span className="text-[8px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded leading-none">{user.uid}</span>}
                                                        </h3>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1 truncate max-w-[150px]">{user.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2 shrink-0">
                                                    <StatusBadge status={user.isActive ? 'Active' : 'Inactive'} />
                                                    <span className="text-[8px] font-black text-gray-300 uppercase tracking-[0.2em]">{user.role}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Bookings */}
                        {results.bookings?.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                        Bookings ({results.bookings.length})
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {results.bookings.map((booking) => (
                                        <Link key={booking.id} href={`/admin/bookings/${booking.id}`}>
                                            <div className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between group hover:shadow-xl hover:border-blue-100 transition-all relative overflow-hidden gap-6">
                                                <div className="absolute left-0 top-0 w-1.5 h-full bg-blue-500 opacity-60" />
                                                <div className="flex items-center gap-5 flex-1 w-full">
                                                    <div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0 group-hover:bg-blue-600 transition-colors">
                                                        <Calendar className="h-7 w-7 text-gray-400 group-hover:text-white transition-colors" />
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <h3 className="font-bold text-gray-900 uppercase tracking-tight text-base group-hover:text-blue-600 transition-colors">
                                                            {booking.Room?.Hostel?.name}
                                                        </h3>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Room {booking.Room?.roomNumber}</span>
                                                            <div className="h-1 w-1 rounded-full bg-gray-200" />
                                                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{booking.User?.name}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2 shrink-0 w-full md:w-auto">
                                                    <StatusBadge status={booking.status} />
                                                    {booking.uid && <span className="text-[9px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded leading-none border border-blue-100">{booking.uid}</span>}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Payments */}
                        {results.payments?.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        Payments ({results.payments.length})
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {results.payments.map((payment) => (
                                        <div key={payment.id} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center justify-between group hover:shadow-xl hover:border-emerald-100 transition-all relative overflow-hidden">
                                            <div className="absolute left-0 top-0 w-1.5 h-full bg-emerald-500 opacity-60" />
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0 group-hover:bg-emerald-600 transition-colors">
                                                    <CreditCard className="h-6 w-6 text-gray-400 group-hover:text-white transition-colors" />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-gray-900 text-lg tracking-tighter">
                                                        PKR {payment.amount.toLocaleString()}
                                                    </h3>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1 truncate max-w-[150px]">{payment.User?.name}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2 shrink-0">
                                                <StatusBadge status={payment.status} />
                                                {payment.uid && <span className="text-[9px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{payment.uid}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Complaints */}
                        {results.complaints?.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                        <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                        Complaints ({results.complaints.length})
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {results.complaints.map((complaint) => (
                                        <div key={complaint.id} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center justify-between group hover:shadow-xl hover:border-rose-100 transition-all relative overflow-hidden">
                                            <div className="absolute left-0 top-0 w-1.5 h-full bg-rose-500 opacity-60" />
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="h-12 w-12 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0 group-hover:bg-rose-600 transition-colors">
                                                    <AlertTriangle className="h-6 w-6 text-gray-400 group-hover:text-white transition-colors" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-bold text-gray-900 uppercase tracking-tight truncate">
                                                        {complaint.title}
                                                    </h3>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1 truncate">{complaint.Hostel?.name}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2 shrink-0">
                                                <StatusBadge status={complaint.status} />
                                                {complaint.uid && <span className="text-[9px] font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">{complaint.uid}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Maintenance */}
                        {results.maintenance?.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                        Maintenance ({results.maintenance.length})
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {results.maintenance.map((m) => (
                                        <div key={m.id} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center justify-between group hover:shadow-xl hover:border-amber-100 transition-all relative overflow-hidden">
                                            <div className="absolute left-0 top-0 w-1.5 h-full bg-amber-500 opacity-60" />
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="h-12 w-12 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0 group-hover:bg-amber-600 transition-colors">
                                                    <Wrench className="h-6 w-6 text-gray-400 group-hover:text-white transition-colors" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-bold text-gray-900 uppercase tracking-tight truncate">
                                                        {m.title}
                                                    </h3>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1 truncate">{m.Hostel?.name}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2 shrink-0">
                                                <StatusBadge status={m.status} />
                                                {m.uid && <span className="text-[9px] font-mono font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">{m.uid}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* No Results at all */}
                        {results && Object.values(results).every(arr => !arr || arr.length === 0) && (
                            <div className="text-center py-20 flex flex-col items-center animate-in fade-in zoom-in duration-500">
                                <div className="h-20 w-20 bg-white border border-slate-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm text-slate-300">
                                    <Blocks className="h-10 w-10" />
                                </div>
                                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">No Results Found</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">We couldn't find any records matching your search.</p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Simple Status Bar */}
            <div className="fixed bottom-0 w-full z-40 px-6 pb-4 pointer-events-none left-0">
                <div className="max-w-[1200px] mx-auto bg-slate-900/90 backdrop-blur-xl text-white h-12 rounded-2xl shadow-2xl flex items-center justify-between px-6 pointer-events-auto">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-indigo-400">
                            <Activity className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-black tracking-widest uppercase">System Ready</span>
                        </div>
                        <div className="h-3 w-px bg-white/10 hidden md:block"></div>
                        <div className="hidden md:flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold uppercase text-gray-400 tracking-[0.2em]">Data Up to Date</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {results && (
                            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">
                                {Object.values(results).flat().length} Results found
                            </span>
                        )}
                        <Badge className="bg-white/10 text-white border-none text-[8px] font-bold uppercase py-0.5">V3.2.0</Badge>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchPage;
