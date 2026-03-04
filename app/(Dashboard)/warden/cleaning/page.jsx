"use client";
import React, { useState } from 'react';
import {
    Sparkles,
    CheckCircle2,
    Clock,
    Bed,
    Plus,
    X,
    Filter,
    Calendar,
    ArrowUpRight,
    MoreVertical,
    Check
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import useAuthStore from '@/hooks/Authstate';
import { useWardenLogs } from '@/hooks/useWarden';
import { useRoomByHostelId, useCreateCleaningLog, useUpdateCleaningLog } from '@/hooks/useRoom';
import { format } from 'date-fns';
import { toast } from 'sonner';

const WardenCleaningPage = () => {
    const { user } = useAuthStore();
    const { data: logs, isLoading } = useWardenLogs(user?.id, 'cleaning');
    const { data: roomsResponse } = useRoomByHostelId(user?.hostelId);
    const [statusFilter, setStatusFilter] = useState("all");
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const createMutation = useCreateCleaningLog();
    const updateMutation = useUpdateCleaningLog();

    // Form state
    const [selectedRoomId, setSelectedRoomId] = useState("");
    const [notes, setNotes] = useState("");

    const handleCreate = async () => {
        if (!selectedRoomId) return toast.error("Please select a room");
        createMutation.mutate({
            roomId: selectedRoomId,
            hostelId: user?.hostelId,
            notes,
            status: "COMPLETED",
            performedAt: new Date().toISOString()
        }, {
            onSuccess: () => {
                setIsCreateOpen(false);
                setSelectedRoomId("");
                setNotes("");
            }
        });
    };

    const handleStatusUpdate = (id, status) => {
        updateMutation.mutate({ id, status });
    };

    const filteredLogs = logs?.filter(log =>
        statusFilter === 'all' || log.status === statusFilter
    );

    const rooms = roomsResponse?.data || [];

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white font-sans">
                <div className="flex flex-col items-center gap-6">
                    <div className="h-10 w-10 border-[3px] border-gray-100 border-t-black rounded-full animate-spin" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 italic">Synchronizing Cleanup Records</p>
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
        <div className="min-h-screen bg-gray-50/30 pb-20 font-sans tracking-tight leading-relaxed">
            {/* Minimal Premium Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-full flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                        <div className="h-8 w-1 bg-indigo-600 rounded-full shrink-0" />
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-sm md:text-lg font-black text-gray-900 tracking-tight uppercase truncate">Room Cleaning</h1>
                            <div className="flex items-center gap-1.5 md:gap-2">
                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-gray-400 truncate">Records Management</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500 shrink-0 hidden sm:block" />
                            </div>
                        </div>
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-9 md:h-10 bg-black text-white px-4 md:px-6 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10">
                                <Plus className="h-4 w-4 mr-2" />
                                Log Cleanup
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-3xl border-0 shadow-2xl p-0 overflow-hidden max-w-md w-[95vw]">
                            <div className="bg-gray-950 p-6 md:p-8 text-white relative">
                                <Sparkles className="absolute top-4 right-4 h-12 w-12 text-white/5" />
                                <h3 className="text-lg font-black uppercase tracking-widest mb-1">New Cleanup Task</h3>
                                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest italic">Manual entry for sanitation protocols</p>
                            </div>
                            <div className="p-6 md:p-8 space-y-6 bg-white">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-1">Target Room</label>
                                    <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                                        <SelectTrigger className="h-12 rounded-xl border-gray-100 bg-gray-50/50 font-bold text-[11px] uppercase tracking-wide">
                                            <SelectValue placeholder="SELECT ROOM" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-gray-100 font-bold text-[11px] uppercase">
                                            {rooms.map(room => (
                                                <SelectItem key={room.id} value={room.id}>
                                                    Room {room.roomNumber} ({room.floor} Floor)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-1">Procedure Notes</label>
                                    <Textarea
                                        placeholder="Enter details about the cleaning..."
                                        className="min-h-[100px] rounded-xl border-gray-100 bg-gray-50/50 resize-none p-4 text-[11px] font-medium"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <DialogClose asChild>
                                        <Button variant="outline" className="flex-1 h-12 rounded-xl border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">Cancel</Button>
                                    </DialogClose>
                                    <Button
                                        className="flex-1 h-12 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/10"
                                        onClick={handleCreate}
                                        disabled={createMutation.isPending}
                                    >
                                        {createMutation.isPending ? 'Logging...' : 'Confirm'}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8 min-w-0">
                {/* Stats Matrix */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    {[
                        { label: 'Total Volume', value: stats.total, sub: 'Log Entries', icon: Sparkles, color: 'text-gray-900', bg: 'bg-white' },
                        { label: 'Completed', value: stats.completed, sub: 'Success', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50/30' },
                        { label: 'Pending Cycle', value: stats.pending, sub: 'Check', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50/30' }
                    ].map((node, i) => (
                        <div key={i} className={`border border-gray-100 rounded-2xl p-4 md:p-6 flex items-center gap-4 md:gap-6 shadow-sm hover:shadow-md transition-all group min-w-0 ${node.bg} ${i === 2 ? 'col-span-2 lg:col-span-1' : ''}`}>
                            <div className={`h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-white flex items-center justify-center shrink-0 border border-gray-100 group-hover:scale-110 transition-transform ${node.color} shadow-inner`}>
                                <node.icon className="h-5 w-5 md:h-7 md:w-7" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest italic truncate">{node.label}</span>
                                <div className="flex items-baseline gap-1.5 md:gap-2 min-w-0">
                                    <span className={`text-xl md:text-3xl font-black tracking-tight truncate ${node.color}`}>{node.value}</span>
                                    <span className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest truncate mb-1">{node.sub}</span>
                                </div>
                            </div>
                        </div>
                    ))
                    }
                </div>

                {/* Operations Bar */}
                <div className="flex flex-col md:flex-row gap-4 items-center min-w-0 w-full bg-white p-2 rounded-[1.5rem] border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 shrink-0 self-start md:self-center px-4">
                        <Filter className="h-4 w-4 text-indigo-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Inventory Feed</span>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 w-full scrollbar-hide py-1">
                        {['all', 'COMPLETED', 'PENDING', 'SKIPPED'].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setStatusFilter(filter)}
                                className={`h-10 px-6 md:px-8 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all shrink-0 ${statusFilter === filter
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15'
                                    : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50 font-bold'
                                    }`}
                            >
                                {filter === 'all' ? 'All Activity' : filter}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Registry View */}
                <div className="space-y-3">
                    {filteredLogs?.map((log) => (
                        <Card key={log.id} className="rounded-[1.5rem] md:rounded-[2rem] border-gray-100 shadow-sm hover:shadow-md transition-all group min-w-0 relative overflow-hidden bg-white">
                            <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${log.status === 'COMPLETED' ? 'bg-emerald-500' : log.status === 'PENDING' ? 'bg-amber-500' : 'bg-gray-300'} opacity-70`} />

                            <div className="p-5 md:p-6 flex flex-col md:flex-row items-stretch md:items-center gap-6">
                                {/* Room Identity */}
                                <div className="flex items-center gap-5 min-w-0 md:w-64">
                                    <div className={`h-12 w-12 md:h-14 md:w-14 rounded-2xl flex items-center justify-center shrink-0 border border-gray-50 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 ${log.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' :
                                        log.status === 'PENDING' ? 'bg-amber-50 text-amber-600' :
                                            'bg-gray-50 text-gray-400'
                                        }`}>
                                        <Bed className="h-6 w-6 md:h-7 md:w-7" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm md:text-base font-black text-gray-900 uppercase tracking-tight truncate">Room_{log.Room?.roomNumber}</span>
                                            <Badge variant="outline" className={`text-[7px] font-black px-2 py-0.5 rounded-full border shadow-sm shrink-0 ${log.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                log.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    'bg-gray-50 text-gray-400 border-gray-100'
                                                }`}>
                                                {log.status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-3 w-3 text-gray-300" />
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{format(new Date(log.performedAt), 'MMM dd, yyyy')}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Notes/Content */}
                                <div className="flex-1 min-w-0 md:px-6 py-2 md:py-0 border-t md:border-t-0 md:border-x border-gray-50">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Cleanup Detail</p>
                                    <p className="text-[11px] md:text-xs font-medium text-gray-600 italic line-clamp-2 md:line-clamp-1 leading-relaxed">
                                        "{log.notes || 'Sanitation protocol executed as per scheduled maintenance cycle.'}"
                                    </p>
                                </div>

                                {/* Operational Actions */}
                                <div className="flex items-center justify-between md:justify-end gap-6 md:min-w-[200px]">
                                    <div className="flex flex-col items-end shrink-0">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Timing</span>
                                        <span className="text-[11px] font-black text-gray-900 tracking-tighter uppercase">{format(new Date(log.performedAt), 'HH:mm • z')}</span>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="icon" className="h-10 w-10 md:h-11 md:w-11 rounded-xl md:rounded-2xl border-gray-100 hover:bg-gray-50">
                                                <MoreVertical className="h-4.5 w-4.5 text-gray-400" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-2xl border-gray-100 shadow-xl">
                                            <DropdownMenuItem
                                                className="p-3 gap-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-emerald-600 cursor-pointer focus:bg-emerald-50 focus:text-emerald-700"
                                                onClick={() => handleStatusUpdate(log.id, 'COMPLETED')}
                                            >
                                                <CheckCircle2 className="h-4 w-4" /> COMPLETED
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="p-3 gap-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-amber-600 cursor-pointer focus:bg-amber-50 focus:text-amber-700"
                                                onClick={() => handleStatusUpdate(log.id, 'PENDING')}
                                            >
                                                <Clock className="h-4 w-4" /> PENDING
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="p-3 gap-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-rose-600 cursor-pointer focus:bg-rose-50 focus:text-rose-700"
                                                onClick={() => handleStatusUpdate(log.id, 'SKIPPED')}
                                            >
                                                <X className="h-4 w-4" /> SKIPPED
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="p-3 gap-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-gray-400 cursor-pointer"
                                                onClick={() => toast.info("Room reports coming soon")}
                                            >
                                                <ArrowUpRight className="h-4 w-4" /> Room Profile
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </Card>
                    ))}

                    {filteredLogs?.length === 0 && (
                        <div className="py-20 md:py-32 bg-white border border-dashed border-gray-100 rounded-[2rem] md:rounded-[3rem] text-center px-6">
                            <Sparkles className="h-12 w-12 md:h-20 md:w-20 text-gray-100 mx-auto mb-6 animate-pulse" />
                            <h3 className="text-base md:text-xl font-black text-gray-900 uppercase tracking-[0.2em]">Zero Feed</h3>
                            <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-[0.3em] mt-4 italic max-w-xs mx-auto leading-loose">
                                No active records matching your filter criteria. Try expanding your search.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default WardenCleaningPage;
