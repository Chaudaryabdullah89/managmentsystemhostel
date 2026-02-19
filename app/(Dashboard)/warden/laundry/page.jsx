"use client";
import React, { useState } from 'react';
import {
    Shirt,
    CheckCircle2,
    Clock,
    Bed,
    Package
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import useAuthStore from '@/hooks/Authstate';
import { useWardenLogs } from '@/hooks/useWarden';
import { format } from 'date-fns';

const WardenLaundryPage = () => {
    const { user } = useAuthStore();
    const { data: logs, isLoading } = useWardenLogs(user?.id, 'laundry');
    const [statusFilter, setStatusFilter] = useState("all");

    const filteredLogs = logs?.filter(log =>
        statusFilter === 'all' || log.status === statusFilter
    );

    if (isLoading) {
        return (
            <div className="p-8 space-y-4 animate-pulse">
                <div className="h-20 bg-gray-100 rounded-3xl" />
                <div className="grid grid-cols-1 gap-4">
                    {Array(5).fill(0).map((_, i) => (
                        <div key={i} className="h-24 bg-gray-50 rounded-3xl" />
                    ))}
                </div>
            </div>
        );
    }

    const stats = {
        total: logs?.length || 0,
        delivered: logs?.filter(l => l.status === 'DELIVERED').length || 0,
        pending: logs?.filter(l => l.status === 'PENDING').length || 0,
        processing: logs?.filter(l => l.status === 'PROCESSING').length || 0,
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-gray-50/30 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-tight">Laundry Logs</h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                        <Shirt className="h-3 w-3" /> Laundry Service Tracking
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Delivered</p>
                    <p className="text-2xl font-bold text-emerald-600">{stats.delivered}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Processing</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pending</p>
                    <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {['all', 'PENDING', 'PROCESSING', 'READY', 'DELIVERED'].map((filter) => (
                    <button
                        key={filter}
                        onClick={() => setStatusFilter(filter)}
                        className={`h-10 px-6 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${statusFilter === filter
                            ? 'bg-indigo-600 text-white shadow-lg'
                            : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
                            }`}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            {/* Logs List */}
            <div className="space-y-4">
                {filteredLogs?.map((log) => (
                    <Card key={log.id} className="rounded-3xl border-none shadow-sm hover:shadow-md transition-all bg-white p-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${log.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600' :
                                        log.status === 'PROCESSING' ? 'bg-blue-50 text-blue-600' :
                                            log.status === 'READY' ? 'bg-purple-50 text-purple-600' :
                                                'bg-amber-50 text-amber-600'
                                    }`}>
                                    {log.status === 'DELIVERED' ? <CheckCircle2 className="h-6 w-6" /> :
                                        log.status === 'READY' ? <Package className="h-6 w-6" /> :
                                            <Clock className="h-6 w-6" />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge className={`text-[9px] font-bold uppercase ${log.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                log.status === 'PROCESSING' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                    log.status === 'READY' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                        'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}>
                                            {log.status}
                                        </Badge>
                                        <span className="text-[10px] font-bold text-gray-400"><Bed className="h-2.5 w-2.5 inline mr-1" />Room {log.Room?.roomNumber}</span>
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-900">Laundry Request</h3>
                                    <p className="text-[10px] font-medium text-gray-500 mt-0.5">{log.itemsCount} items • {log.weight ? `${log.weight}kg` : 'Weight pending'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Received</p>
                                    <p className="text-xs font-bold text-gray-700">{format(new Date(log.receivedAt), 'MMM dd, HH:mm')}</p>
                                </div>
                                {log.deliveredAt && (
                                    <div className="text-right">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Delivered</p>
                                        <p className="text-xs font-bold text-emerald-600">{format(new Date(log.deliveredAt), 'MMM dd, HH:mm')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}

                {filteredLogs?.length === 0 && (
                    <div className="py-20 bg-white border border-dashed border-gray-200 rounded-[3rem] text-center space-y-4">
                        <Shirt className="h-16 w-16 text-gray-200 mx-auto" />
                        <div>
                            <p className="text-lg font-bold text-gray-900 uppercase">No Laundry Logs</p>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">No records match the current filter</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WardenLaundryPage;
