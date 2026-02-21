"use client";
import React, { useState } from 'react';
import {
    Sparkles,
    CheckCircle2,
    Clock,
    Bed
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import useAuthStore from '@/hooks/Authstate';
import { useWardenLogs } from '@/hooks/useWarden';
import { format } from 'date-fns';

const WardenCleaningPage = () => {
    const { user } = useAuthStore();
    const { data: logs, isLoading } = useWardenLogs(user?.id, 'cleaning');
    const [statusFilter, setStatusFilter] = useState("all");

    const filteredLogs = logs?.filter(log =>
        statusFilter === 'all' || log.status === statusFilter
    );

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white font-sans">
                <div className="flex flex-col items-center gap-6">
                    <div className="h-10 w-10 border-[3px] border-gray-100 border-t-black rounded-full animate-spin" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 italic">Sanitizing Logs...</p>
                </div>
            </div>
        );
    }

    const stats = {
        total: logs?.length || 0,
        completed: logs?.filter(l => l.status === 'COMPLETED').length || 0,
        pending: logs?.filter(l => l.status === 'PENDING').length || 0,
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight leading-relaxed">
            {/* Minimal Premium Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-full flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                        <div className="h-8 w-1 bg-black rounded-full shrink-0" />
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-sm md:text-lg font-bold text-gray-900 tracking-tight uppercase truncate">Hygiene Logs</h1>
                            <div className="flex items-center gap-1.5 md:gap-2">
                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-gray-400 truncate">Records Hub</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500 shrink-0 hidden sm:block" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8 min-w-0">
                {/* Stats Matrix */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    {[
                        { label: 'Cumulative', value: stats.total, sub: 'Total Logs', icon: Sparkles, color: 'text-gray-900', bg: 'bg-white' },
                        { label: 'Sanitized', value: stats.completed, sub: 'Done', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
                        { label: 'Scheduled', value: stats.pending, sub: 'Waiting', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50/50' }
                    ].map((node, i) => (
                        <div key={i} className={`border border-gray-100 rounded-2xl p-3 md:p-5 flex items-center gap-3 md:gap-4 shadow-sm hover:shadow-md transition-all group min-w-0 ${node.bg} ${i === 2 ? 'col-span-2 lg:col-span-1' : ''}`}>
                            <div className={`h-10 w-10 md:h-12 md:w-12 rounded-xl bg-white flex items-center justify-center shrink-0 border border-gray-100 group-hover:scale-110 transition-transform ${node.color}`}>
                                <node.icon className="h-4 w-4 md:h-5 md:w-5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest italic truncate">{node.label}</span>
                                <div className="flex items-baseline gap-1.5 md:gap-2 min-w-0">
                                    <span className={`text-base md:text-xl font-bold tracking-tight truncate ${node.color}`}>{node.value}</span>
                                    <span className="text-[7px] md:text-[8px] font-black text-gray-400 uppercase tracking-wider truncate mb-0.5">{node.sub}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Operations Bar */}
                <div className="flex flex-col md:flex-row gap-4 items-center min-w-0 w-full">
                    <div className="flex items-center gap-2 shrink-0 self-start md:self-center px-1">
                        <Sparkles className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Filters</span>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 w-full scrollbar-hide">
                        {['all', 'COMPLETED', 'PENDING', 'SKIPPED'].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setStatusFilter(filter)}
                                className={`h-9 md:h-10 px-5 md:px-7 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all shrink-0 ${statusFilter === filter
                                    ? 'bg-black text-white shadow-xl shadow-black/10'
                                    : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
                                    }`}
                            >
                                {filter === 'all' ? 'All Records' : filter}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Registry View */}
                <div className="space-y-3 md:space-y-4">
                    {filteredLogs?.map((log) => (
                        <Card key={log.id} className="rounded-2xl md:rounded-3xl border border-gray-50 shadow-sm hover:shadow-md transition-all bg-white p-4 md:p-6 overflow-hidden min-w-0 relative">
                            <div className={`absolute top-0 left-0 w-1 h-full ${log.status === 'COMPLETED' ? 'bg-emerald-500' : log.status === 'PENDING' ? 'bg-amber-500' : 'bg-gray-300'} opacity-60`} />
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
                                <div className="flex items-start gap-4 flex-1 min-w-0 w-full">
                                    <div className={`h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 border border-gray-50 ${log.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' :
                                        log.status === 'PENDING' ? 'bg-amber-50 text-amber-600' :
                                            'bg-gray-50 text-gray-400'
                                        }`}>
                                        {log.status === 'COMPLETED' ? <CheckCircle2 className="h-5 w-5 md:h-7 md:w-7" /> : <Clock className="h-5 w-5 md:h-7 md:w-7" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                            <Badge variant="outline" className={`text-[7px] md:text-[8px] font-black uppercase tracking-widest border-2 py-0.5 rounded-full ${log.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                log.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                    'bg-gray-50 text-gray-500 border-gray-100'
                                                }`}>
                                                {log.status}
                                            </Badge>
                                            <span className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap"><Bed className="h-3 w-3 inline mr-1 mb-0.5" />Room {log.Room?.roomNumber}</span>
                                        </div>
                                        <h3 className="text-sm md:text-base font-black text-gray-900 uppercase tracking-tight truncate">Hygiene Session</h3>
                                        <p className="text-[10px] md:text-xs font-medium text-gray-500 mt-1 line-clamp-1 italic">"{log.notes || 'Standard operational protocol executed successfully.'}"</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between md:justify-end w-full md:w-auto shrink-0 border-t md:border-t-0 pt-4 md:pt-0">
                                    <div className="text-left md:text-right">
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Execution Log</p>
                                        <p className="text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-tighter">{format(new Date(log.performedAt), 'MMM dd, yyyy • HH:mm')}</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}

                    {filteredLogs?.length === 0 && (
                        <div className="py-20 md:py-32 bg-white border border-dashed border-gray-200 rounded-[2rem] md:rounded-[3rem] text-center px-6">
                            <Sparkles className="h-12 w-12 md:h-20 md:w-20 text-gray-100 mx-auto mb-6" />
                            <h3 className="text-lg md:text-xl font-black text-gray-900 uppercase tracking-widest">Sanitation Registry Clear</h3>
                            <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-[0.3em] mt-3 italic max-w-sm mx-auto leading-relaxed">No hygiene records detected within the specified identification criteria.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default WardenCleaningPage;
