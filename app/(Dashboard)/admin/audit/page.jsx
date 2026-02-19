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
                    toast.error("No matching records found");
                } else {
                    toast.success(`Found ${data.total} matching record(s)`);
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
            'CANCELLED': 'bg-gray-50 text-gray-600'
        };

        return (
            <Badge className={`${colors[status?.toUpperCase()] || 'bg-gray-50 text-gray-600'} border-none text-[10px] font-bold uppercase tracking-wider px-3 py-1`}>
                {status}
            </Badge>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Simple Header */}
            <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 py-6">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Search Records</h1>
                        <p className="text-sm text-gray-500 mt-1">Find users, bookings, payments, and more</p>
                    </div>

                    <form onSubmit={handleSearch} className="max-w-2xl relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by UID, email, name, or ID..."
                            className="h-14 pl-12 pr-32 rounded-xl border-gray-200 focus:ring-2 ring-indigo-500/20 font-medium"
                        />
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="absolute right-2 top-2 h-10 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Searching...
                                </>
                            ) : (
                                'Search'
                            )}
                        </Button>
                    </form>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                {!results && !isLoading && (
                    <div className="text-center py-32">
                        <div className="h-20 w-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Search className="h-10 w-10 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Start Searching</h3>
                        <p className="text-sm text-gray-500 max-w-md mx-auto">
                            Enter a UID, email, name, or ID above to search across all records
                        </p>
                    </div>
                )}

                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-32">
                        <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
                        <p className="text-sm font-medium text-gray-500">Searching records...</p>
                    </div>
                )}

                {results && (
                    <div className="space-y-8">
                        {/* Users */}
                        {results.users?.length > 0 && (
                            <section>
                                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <User className="h-4 w-4 text-indigo-600" />
                                    Users ({results.users.length})
                                </h2>
                                <div className="grid gap-4">
                                    {results.users.map((user) => (
                                        <Link key={user.id} href={`/admin/users-records/${user.id}`}>
                                            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-gray-200">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-4">
                                                        <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                                            {user.image ? (
                                                                <img src={user.image} alt="" className="h-full w-full rounded-xl object-cover" />
                                                            ) : (
                                                                <User className="h-6 w-6" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <h3 className="font-bold text-gray-900">{user.name}</h3>
                                                                {user.uid && (
                                                                    <Badge className="bg-gray-100 text-gray-600 border-none text-[10px] font-mono font-bold px-2 py-0.5">
                                                                        {user.uid}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                                <span className="flex items-center gap-1">
                                                                    <Mail className="h-3.5 w-3.5" />
                                                                    {user.email}
                                                                </span>
                                                                {user.phone && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Phone className="h-3.5 w-3.5" />
                                                                        {user.phone}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <StatusBadge status={user.isActive ? 'Active' : 'Inactive'} />
                                                        <Badge className="bg-indigo-50 text-indigo-600 border-none text-[10px] uppercase font-bold px-2 py-0.5">
                                                            {user.role}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </Card>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Bookings */}
                        {results.bookings?.length > 0 && (
                            <section>
                                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-indigo-600" />
                                    Bookings ({results.bookings.length})
                                </h2>
                                <div className="grid gap-4">
                                    {results.bookings.map((booking) => (
                                        <Link key={booking.id} href={`/admin/bookings/${booking.id}`}>
                                            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-gray-200">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h3 className="font-bold text-gray-900">{booking.Room?.Hostel?.name}</h3>
                                                            {booking.uid && (
                                                                <Badge className="bg-gray-100 text-gray-600 border-none text-[10px] font-mono font-bold px-2 py-0.5">
                                                                    {booking.uid}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                                            <span>{booking.User?.name}</span>
                                                            <span>•</span>
                                                            <span>Room {booking.Room?.roomNumber}</span>
                                                            <span>•</span>
                                                            <span>{format(new Date(booking.checkIn), 'MMM dd, yyyy')}</span>
                                                        </div>
                                                    </div>
                                                    <StatusBadge status={booking.status} />
                                                </div>
                                            </Card>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Payments */}
                        {results.payments?.length > 0 && (
                            <section>
                                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-indigo-600" />
                                    Payments ({results.payments.length})
                                </h2>
                                <div className="grid gap-4">
                                    {results.payments.map((payment) => (
                                        <Card key={payment.id} className="p-6 border-gray-200">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="font-bold text-gray-900">PKR {payment.amount.toLocaleString()}</h3>
                                                        {payment.uid && (
                                                            <Badge className="bg-gray-100 text-gray-600 border-none text-[10px] font-mono font-bold px-2 py-0.5">
                                                                {payment.uid}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                                        <span>{payment.User?.name}</span>
                                                        <span>•</span>
                                                        <span>{payment.method}</span>
                                                        <span>•</span>
                                                        <span>{format(new Date(payment.date), 'MMM dd, yyyy')}</span>
                                                    </div>
                                                </div>
                                                <StatusBadge status={payment.status} />
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Complaints */}
                        {results.complaints?.length > 0 && (
                            <section>
                                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-indigo-600" />
                                    Complaints ({results.complaints.length})
                                </h2>
                                <div className="grid gap-4">
                                    {results.complaints.map((complaint) => (
                                        <Link key={complaint.id} href={`/admin/complaints/${complaint.id}`}>
                                            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-gray-200">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="font-bold text-gray-900">{complaint.title}</h3>
                                                        {complaint.uid && (
                                                            <Badge className="bg-gray-100 text-gray-600 border-none text-[10px] font-mono font-bold px-2 py-0.5">
                                                                {complaint.uid}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <StatusBadge status={complaint.status} />
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{complaint.description}</p>
                                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                                    <span>{complaint.User_Complaint_userIdToUser?.name}</span>
                                                    <span>•</span>
                                                    <span>{complaint.Hostel?.name}</span>
                                                    <span>•</span>
                                                    <span>{complaint.priority}</span>
                                                </div>
                                            </Card>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Maintenance */}
                        {results.maintenance?.length > 0 && (
                            <section>
                                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Wrench className="h-4 w-4 text-indigo-600" />
                                    Maintenance ({results.maintenance.length})
                                </h2>
                                <div className="grid gap-4">
                                    {results.maintenance.map((task) => (
                                        <Link key={task.id} href={`/admin/maintenances/${task.id}`}>
                                            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-gray-200">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="font-bold text-gray-900">{task.title}</h3>
                                                        {task.uid && (
                                                            <Badge className="bg-gray-100 text-gray-600 border-none text-[10px] font-mono font-bold px-2 py-0.5">
                                                                {task.uid}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <StatusBadge status={task.status} />
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                                    <span>{task.Hostel?.name}</span>
                                                    <span>•</span>
                                                    <span>{task.priority}</span>
                                                </div>
                                            </Card>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* No Results */}
                        {results && Object.values(results).every(arr => !arr || arr.length === 0) && (
                            <div className="text-center py-20">
                                <div className="h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Search className="h-8 w-8 text-gray-300" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">No Results Found</h3>
                                <p className="text-sm text-gray-500">Try searching with a different term</p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default SearchPage;
