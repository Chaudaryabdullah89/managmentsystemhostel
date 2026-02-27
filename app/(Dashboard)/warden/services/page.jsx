"use client";
import React, { useState, useMemo } from 'react';
import {
    Sparkles,
    Shirt,
    CheckCircle2,
    Clock,
    Bed,
    AlertTriangle,
    ChevronRight,
    Activity,
    ArrowUpRight,
    Settings2,
    Calendar,
    Filter,
    Brush,
    Layers,
    History,
    RefreshCw,
    Plus,
    Package,
    Search
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import useAuthStore from '@/hooks/Authstate';
import { useWardenLogs, useWardenDueServices } from '@/hooks/useWarden';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

const UnifiedServicesPage = () => {
    const { user } = useAuthStore();
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch data with refetch and loading states
    const { data: dueServices, isLoading: dueLoading, refetch: refetchDue } = useWardenDueServices(user?.id);
    const { data: cleaningLogs, isLoading: cleaningLoading, refetch: refetchCleaning } = useWardenLogs(user?.id, 'cleaning');
    const { data: laundryLogs, isLoading: laundryLoading, refetch: refetchLaundry } = useWardenLogs(user?.id, 'laundry');

    const isLoading = dueLoading || cleaningLoading || laundryLoading;

    const refetchAll = () => {
        refetchDue();
        refetchCleaning();
        refetchLaundry();
    };

    const handleSync = async () => {
        const promise = fetch('/api/automation/sync-logs', { method: 'POST' });
        toast.promise(promise, {
            loading: 'Syncing...',
            success: 'Synced',
            error: 'Failed'
        });
        await promise;
        refetchAll();
    };

    const allPendingTasks = useMemo(() => {
        const cleaning = (cleaningLogs?.filter(l => l.status === 'PENDING') || []).map(l => ({ ...l, taskType: 'cleaning' }));
        const laundry = (laundryLogs?.filter(l => ['PENDING', 'PROCESSING', 'READY'].includes(l.status)) || []).map(l => ({ ...l, taskType: 'laundry' }));
        let combined = [...cleaning, ...laundry].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (searchQuery) {
            combined = combined.filter(t => t.Room?.roomNumber?.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        return combined;
    }, [cleaningLogs, laundryLogs, searchQuery]);

    const stats = useMemo(() => {
        const pendingCount = (cleaningLogs?.filter(l => l.status === 'PENDING').length || 0) +
            (laundryLogs?.filter(l => ['PENDING', 'PROCESSING', 'READY'].includes(l.status)).length || 0);
        const overdueCount = (dueServices?.dueCleaning?.length || 0) + (dueServices?.dueLaundry?.length || 0);
        const dailyProductivity = (cleaningLogs?.filter(l => l.status === 'COMPLETED' && new Date(l.performedAt).toDateString() === new Date().toDateString()).length || 0) +
            (laundryLogs?.filter(l => l.status === 'DELIVERED' && new Date(l.deliveredAt).toDateString() === new Date().toDateString()).length || 0);

        return {
            pending: pendingCount,
            overdue: overdueCount,
            productivity: dailyProductivity
        };
    }, [cleaningLogs, laundryLogs, dueServices]);

    if (isLoading) {
        return (
            <div className="flex h-[100dvh] items-center justify-center bg-white font-sans">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="h-16 w-16 border-[3px] border-blue-50 border-t-blue-600 rounded-full animate-spin" />
                        <Activity className="h-6 w-6 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    <div className="flex flex-col items-center gap-1.5 text-center px-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-900">Loading</p>
                        <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400 italic">Waiting...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight">
            {/* Unified Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-full flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                        <div className="h-8 w-1 bg-blue-600 rounded-full shrink-0" />
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-sm md:text-lg font-bold text-gray-900 tracking-tight uppercase truncate">Services</h1>
                            <div className="flex items-center gap-1.5 md:gap-2">
                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</span>
                                <div className="h-1 w-1 rounded-full bg-blue-500 shrink-0 hidden sm:block" />
                                <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-wider text-blue-600 italic truncate hidden xs:block">Optimized</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 shrink-0">
                        <Button
                            variant="outline"
                            className="h-8 md:h-10 px-2.5 md:px-5 rounded-xl border-gray-200 bg-white font-bold text-[9px] md:text-[10px] uppercase tracking-wider text-gray-600 hover:bg-gray-50 transition-all shadow-sm shrink-0"
                            onClick={handleSync}
                        >
                            <RefreshCw className="h-3.5 w-3.5 md:mr-2 text-gray-400" />
                            <span className="hidden sm:inline">Sync</span>
                            <span className="sm:hidden">Sync</span>
                        </Button>
                        <Button onClick={refetchAll} variant="outline" size="icon" className="h-8 w-8 md:h-10 md:w-10 rounded-xl border-gray-200 bg-white shrink-0 sm:flex hidden">
                            <RefreshCw className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400" />
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 md:py-10 space-y-6 md:space-y-10">
                {/* Stats Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    {[
                        { label: 'Active', value: stats.pending, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', sub: 'Tasks in queue' },
                        { label: 'Suggestions', value: stats.overdue, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', sub: 'Calculated suggestions' },
                        { label: 'Done', value: stats.productivity, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: 'Rooms serviced' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-[2rem] p-5 md:p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex-1 min-w-0">
                            <div className="absolute top-0 right-0 w-24 h-full bg-gray-50/50 skew-x-12 translate-x-10 group-hover:translate-x-8 transition-transform" />
                            <div className="flex items-center gap-5 md:gap-6 relative z-10">
                                <div className={`h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform`}>
                                    <stat.icon className="h-6 w-6 md:h-7 md:w-7" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] truncate">{stat.label}</span>
                                    <div className="flex items-baseline gap-2 mt-1 truncate">
                                        <span className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter leading-none">{stat.value}</span>
                                        <span className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest truncate">{stat.sub}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <Tabs defaultValue="operational-tasks" className="space-y-6 md:space-y-8">
                    <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
                        <TabsList className="bg-white p-1 rounded-xl md:rounded-2xl border border-gray-100 h-11 md:h-14 flex shadow-sm overflow-x-auto scrollbar-hide shrink-0 min-w-0">
                            <TabsTrigger value="operational-tasks" className="flex-1 md:flex-none rounded-lg md:rounded-xl px-4 md:px-8 text-[9px] md:text-[11px] font-bold uppercase tracking-[0.15em] data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all whitespace-nowrap">
                                Active
                            </TabsTrigger>
                            <TabsTrigger value="due-alerts" className="flex-1 md:flex-none rounded-lg md:rounded-xl px-4 md:px-8 text-[9px] md:text-[11px] font-bold uppercase tracking-[0.15em] data-[state=active]:bg-blue-600 data-[state=active]:text-white relative transition-all whitespace-nowrap">
                                Suggestions
                                {stats.overdue > 0 && <span className="absolute -top-1 -right-0.5 h-3.5 w-3.5 md:h-4 md:w-4 bg-rose-500 rounded-full border-2 border-white animate-pulse" />}
                            </TabsTrigger>
                            <TabsTrigger value="history" className="flex-1 md:flex-none rounded-lg md:rounded-xl px-4 md:px-8 text-[9px] md:text-[11px] font-bold uppercase tracking-[0.15em] data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all whitespace-nowrap">
                                History
                            </TabsTrigger>
                        </TabsList>

                        <div className="relative w-full lg:w-72 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                            <Input
                                placeholder="SEARCH..."
                                className="pl-10 md:pl-12 h-11 md:h-14 rounded-xl md:rounded-[1.25rem] border-gray-100 bg-white shadow-sm focus:ring-blue-500 transition-all text-[10px] md:text-[11px] font-black uppercase tracking-widest placeholder:text-gray-300"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <TabsContent value="operational-tasks" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {allPendingTasks.map(task => (
                                <TaskCard key={task.id} data={task} refetch={refetchAll} />
                            ))}
                            {allPendingTasks.length === 0 && (
                                <div className="col-span-full py-24 bg-white border border-dashed border-gray-200 rounded-[3rem] text-center space-y-4">
                                    <Sparkles className="h-16 w-16 text-gray-100 mx-auto" />
                                    <div>
                                        <p className="text-lg font-bold text-gray-900 uppercase">Clear</p>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">No active tasks found</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="due-alerts" className="space-y-6">
                        <div className="bg-white border border-gray-100 rounded-[3.5rem] overflow-hidden shadow-sm">
                            <div className="p-10 border-b border-gray-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-gray-50/30">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Suggestions</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Suggestions based on last service time</p>
                                </div>
                                <Badge className="bg-blue-600 text-white border-none text-[10px] font-bold px-4 py-1.5 rounded-full shadow-lg shadow-blue-200">
                                    {stats.overdue} MATCHES
                                </Badge>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 divide-x divide-gray-100">
                                <div className="p-10 space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                            <Brush className="h-5 w-5" />
                                        </div>
                                        <h4 className="text-sm font-bold uppercase tracking-widest text-gray-900">Cleaning</h4>
                                    </div>
                                    <div className="space-y-4">
                                        {dueServices?.dueCleaning?.map((room) => (
                                            <DueItem key={room.id} room={room} type="cleaning" refetch={refetchAll} />
                                        ))}
                                        {dueServices?.dueCleaning?.length === 0 && (
                                            <div className="py-8 text-center bg-gray-50/50 rounded-3xl">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">All Clean</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="p-10 space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                            <Shirt className="h-5 w-5" />
                                        </div>
                                        <h4 className="text-sm font-bold uppercase tracking-widest text-gray-900">Laundry</h4>
                                    </div>
                                    <div className="space-y-4">
                                        {dueServices?.dueLaundry?.map((room) => (
                                            <DueItem key={room.id} room={room} type="laundry" refetch={refetchAll} />
                                        ))}
                                        {dueServices?.dueLaundry?.length === 0 && (
                                            <div className="py-8 text-center bg-gray-50/50 rounded-3xl">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">All Good</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="history" className="space-y-6">
                        <div className="bg-white border border-gray-100 rounded-[3rem] overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-8 py-5 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">Type</th>
                                        <th className="px-8 py-5 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">Room</th>
                                        <th className="px-8 py-5 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">Date</th>
                                        <th className="px-8 py-5 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">Status</th>
                                        <th className="px-8 py-5 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 text-right">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {[...(cleaningLogs || []).map(l => ({ ...l, type: 'Cleaning' })),
                                    ...(laundryLogs || []).map(l => ({ ...l, type: 'Laundry' }))]
                                        .sort((a, b) => new Date(b.createdAt || b.performedAt || b.receivedAt) - new Date(a.createdAt || a.performedAt || a.receivedAt))
                                        .slice(0, 30)
                                        .map((log, i) => (
                                            <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${log.type === 'Cleaning' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                                            {log.type === 'Cleaning' ? <Brush className="h-4 w-4" /> : <Shirt className="h-4 w-4" />}
                                                        </div>
                                                        <span className="text-[11px] font-bold text-gray-900 uppercase">{log.type}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="text-[11px] font-bold text-gray-700">Room {log.Room?.roomNumber}</span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="text-[10px] font-medium text-gray-500">{format(new Date(log.performedAt || log.createdAt || log.receivedAt), 'MMM dd, HH:mm')}</span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <Badge variant="outline" className={`text-[8px] font-bold rounded-full px-3 py-1 border-none shadow-sm ${['COMPLETED', 'DELIVERED'].includes(log.status) ? 'bg-emerald-50 text-emerald-600' :
                                                        log.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                                                        }`}>
                                                        {log.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase italic truncate max-w-[200px] inline-block">
                                                        {log.notes || 'Standard protocol'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};

const TaskCard = ({ data, refetch }) => {
    const [loading, setLoading] = useState(false);

    const handleAction = async (status) => {
        setLoading(true);
        try {
            const endpoint = `/api/rooms/${data.taskType}/update`;
            const response = await fetch(endpoint, {
                method: 'PUT',
                body: JSON.stringify({ id: data.id, status })
            });
            const resData = await response.json();
            if (resData.success) {
                toast.success('Updated');
                refetch();
            } else {
                toast.error(resData.error || 'Failed');
            }
        } catch (err) {
            toast.error('Network error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="rounded-[2.5rem] border-gray-100 shadow-sm hover:shadow-lg hover:border-blue-600/20 transition-all p-6 bg-white group overflow-hidden relative">
            <div className={`absolute top-0 right-0 w-16 h-16 ${data.taskType === 'cleaning' ? 'bg-amber-50' : 'bg-blue-50'} -mr-8 -mt-8 rounded-full transition-transform group-hover:scale-150 group-hover:bg-blue-600/5`} />
            <div className="space-y-6 relative z-10">
                <div className="flex items-center justify-between">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${data.taskType === 'cleaning' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                        {data.taskType === 'cleaning' ? <Brush className="h-6 w-6" /> : <Shirt className="h-6 w-6" />}
                    </div>
                    <Badge className={`text-[8px] font-bold px-3 py-1 rounded-full ${data.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        data.status === 'PROCESSING' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>
                        {data.status}
                    </Badge>
                </div>

                <div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-gray-900 tracking-tight uppercase">Room {data.Room?.roomNumber}</span>
                        <span className={`text-[8px] font-bold uppercase tracking-widest ${data.taskType === 'cleaning' ? 'text-amber-500' : 'text-blue-500'}`}>
                            {data.taskType}
                        </span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Added {formatDistanceToNow(new Date(data.createdAt))} ago</p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                    {data.taskType === 'laundry' && data.status === 'PENDING' && (
                        <Button
                            variant="outline"
                            className="flex-1 h-10 rounded-xl text-[10px] font-bold uppercase tracking-wider border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                            onClick={() => handleAction('PROCESSING')}
                            disabled={loading}
                        >
                            Process
                        </Button>
                    )}
                    <Button
                        className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm disabled:opacity-50"
                        onClick={() => handleAction(data.taskType === 'cleaning' ? 'COMPLETED' : 'DELIVERED')}
                        disabled={loading}
                    >
                        {loading ? '...' : 'Complete'}
                    </Button>
                </div>
            </div>
        </Card>
    );
};

const DueItem = ({ room, type, refetch }) => {
    const handleTrigger = async () => {
        try {
            const endpoint = `/api/rooms/${type}/create`;
            const response = await fetch(endpoint, {
                method: 'POST',
                body: JSON.stringify({
                    roomId: room.id,
                    hostelId: room.hostelId,
                    notes: `Algorithmic trigger: ${room.overdueHours}h overdue`
                })
            });
            const data = await response.json();
            if (data.success) {
                toast.success('Started');
                refetch();
            } else {
                toast.error(data.error || 'Failed');
            }
        } catch (err) {
            toast.error('Network error');
        }
    };

    return (
        <div className="flex items-center justify-between group p-5 rounded-[2rem] bg-gray-50/50 hover:bg-white transition-all border border-transparent hover:border-gray-100 hover:shadow-sm">
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors shadow-sm">
                    <Bed className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[12px] font-bold text-gray-900 uppercase">Room {room.roomNumber}</span>
                    <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest">{room.overdueHours}h OVERDUE</span>
                </div>
            </div>
            <Button
                variant="ghost"
                size="sm"
                className="h-9 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                onClick={handleTrigger}
            >
                Assign <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
        </div>
    );
};

export default UnifiedServicesPage;
