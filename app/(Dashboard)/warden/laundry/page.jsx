"use client";
import React, { useState } from 'react';
import {
    Shirt,
    CheckCircle2,
    Clock,
    Bed,
    Package,
    Plus,
    X,
    Filter,
    Calendar,
    ArrowUpRight,
    MoreVertical,
    History,
    Scale,
    Layers
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import useAuthStore from '@/hooks/Authstate';
import { useWardenLogs } from '@/hooks/useWarden';
import { useRoomByHostelId, useCreateLaundryLog, useUpdateLaundryLog } from '@/hooks/useRoom';
import { format } from 'date-fns';
import { toast } from 'sonner';

const WardenLaundryPage = () => {
    const { user } = useAuthStore();
    const { data: logs, isLoading } = useWardenLogs(user?.id, 'laundry');
    const { data: roomsResponse } = useRoomByHostelId(user?.hostelId);
    const [statusFilter, setStatusFilter] = useState("all");
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const createMutation = useCreateLaundryLog();
    const updateMutation = useUpdateLaundryLog();

    // Form state
    const [selectedRoomId, setSelectedRoomId] = useState("");
    const [itemsCount, setItemsCount] = useState("");
    const [weight, setWeight] = useState("");
    const [notes, setNotes] = useState("");

    const handleCreate = async () => {
        if (!selectedRoomId) return toast.error("Please select a room");
        createMutation.mutate({
            roomId: selectedRoomId,
            hostelId: user?.hostelId,
            itemsCount: parseInt(itemsCount) || 0,
            weight: parseFloat(weight) || 0,
            notes,
            status: "PENDING",
            receivedAt: new Date().toISOString()
        }, {
            onSuccess: () => {
                setIsCreateOpen(false);
                setSelectedRoomId("");
                setItemsCount("");
                setWeight("");
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
                    <div className="h-12 w-12 border-[3px] border-gray-100 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 italic">Accessing Ledger</p>
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
        <div className="min-h-screen bg-gray-50/30 pb-20 font-sans tracking-tight leading-relaxed">
            {/* Minimal Premium Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-full flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                        <div className="h-8 w-1 bg-violet-600 rounded-full shrink-0" />
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-sm md:text-lg font-black text-gray-900 tracking-tight uppercase truncate">Laundry Ops</h1>
                            <div className="flex items-center gap-1.5 md:gap-2">
                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-gray-400 truncate">Fabric Care Records</span>
                                <div className="h-1 w-1 rounded-full bg-violet-500 shrink-0 hidden sm:block" />
                            </div>
                        </div>
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-9 md:h-10 bg-black text-white px-4 md:px-6 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Bag
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-3xl border-0 shadow-2xl p-0 overflow-hidden max-w-md w-[95vw]">
                            <div className="bg-gray-950 p-6 md:p-8 text-white relative">
                                <Shirt className="absolute top-4 right-4 h-12 w-12 text-white/5" />
                                <h3 className="text-lg font-black uppercase tracking-widest mb-1 text-violet-400">Initialize Bag</h3>
                                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest italic tracking-wider">Fabric management entry protocol</p>
                            </div>
                            <div className="p-6 md:p-8 space-y-5 bg-white">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-1 text-violet-600">Source Room</label>
                                    <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                                        <SelectTrigger className="h-12 rounded-xl border-gray-100 bg-gray-50/50 font-bold text-[11px] uppercase">
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

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-1">Item Count</label>
                                        <div className="relative">
                                            <Layers className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                                            <Input
                                                type="number"
                                                placeholder="0"
                                                className="h-12 pl-11 rounded-xl border-gray-100 bg-gray-50/50 font-bold text-[11px]"
                                                value={itemsCount}
                                                onChange={(e) => setItemsCount(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-1">Weight (KG)</label>
                                        <div className="relative">
                                            <Scale className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                                            <Input
                                                type="number"
                                                step="0.1"
                                                placeholder="0.0"
                                                className="h-12 pl-11 rounded-xl border-gray-100 bg-gray-50/50 font-bold text-[11px]"
                                                value={weight}
                                                onChange={(e) => setWeight(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-1">Remarks</label>
                                    <Textarea
                                        placeholder="Specific instructions..."
                                        className="min-h-[80px] rounded-xl border-gray-100 bg-gray-50/50 resize-none p-4 text-[11px] font-medium"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <DialogClose asChild>
                                        <Button variant="outline" className="flex-1 h-12 rounded-xl border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">Cancel</Button>
                                    </DialogClose>
                                    <Button
                                        className="flex-1 h-12 rounded-xl bg-violet-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-violet-600/10"
                                        onClick={handleCreate}
                                        disabled={createMutation.isPending}
                                    >
                                        {createMutation.isPending ? 'Syncing...' : 'Dispatch'}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8 min-w-0">
                {/* Stats Matrix */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {[
                        { label: 'Inventory', value: stats.total, sub: 'Bags', icon: Package, color: 'text-gray-900', bg: 'bg-white' },
                        { label: 'Delivered', value: stats.delivered, sub: 'Cycle', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50/30' },
                        { label: 'Processing', value: stats.processing, sub: 'Active', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50/30' },
                        { label: 'Collection', value: stats.pending, sub: 'Awaiting', icon: Shirt, color: 'text-amber-600', bg: 'bg-amber-50/30' }
                    ].map((node, i) => (
                        <div key={i} className={`border border-gray-100 rounded-[1.5rem] p-4 md:p-6 flex items-center gap-4 md:gap-5 shadow-sm hover:shadow-md transition-all group min-w-0 ${node.bg}`}>
                            <div className={`h-11 w-11 md:h-12 md:w-12 rounded-xl bg-white flex items-center justify-center shrink-0 border border-gray-100 group-hover:scale-110 transition-transform ${node.color} shadow-sm`}>
                                <node.icon className="h-5 w-5 md:h-6 md:w-6" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">{node.label}</span>
                                <div className="flex items-baseline gap-1.5 md:gap-2 min-w-0">
                                    <span className={`text-xl md:text-2xl font-black tracking-tight truncate ${node.color}`}>{node.value}</span>
                                    <span className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest truncate mb-0.5">{node.sub}</span>
                                </div>
                            </div>
                        </div>
                    ))
                    }
                </div>

                {/* Operations Bar */}
                <div className="flex flex-col md:flex-row gap-4 items-center min-w-0 w-full bg-white p-2 rounded-[1.5rem] border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 shrink-0 px-4">
                        <Filter className="h-4 w-4 text-violet-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Flow Status</span>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 w-full scrollbar-hide py-1">
                        {['all', 'PENDING', 'PROCESSING', 'READY', 'DELIVERED'].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setStatusFilter(filter)}
                                className={`h-10 px-5 md:px-7 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all shrink-0 ${statusFilter === filter
                                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/15'
                                    : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50 font-bold'
                                    }`}
                            >
                                {filter === 'all' ? 'All Batches' : filter}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Registry View */}
                <div className="space-y-3 md:space-y-4">
                    {filteredLogs?.map((log) => (
                        <Card key={log.id} className="rounded-[1.5rem] md:rounded-[2rem] border-gray-100 shadow-sm hover:shadow-md transition-all group min-w-0 relative overflow-hidden bg-white">
                            <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${log.status === 'DELIVERED' ? 'bg-emerald-500' :
                                log.status === 'PROCESSING' ? 'bg-blue-500' :
                                    log.status === 'READY' ? 'bg-purple-500' :
                                        'bg-amber-500'} opacity-70`} />

                            <div className="p-5 md:p-6 flex flex-col md:flex-row items-stretch md:items-center gap-6">
                                {/* Batch Identity */}
                                <div className="flex items-center gap-5 min-w-0 md:w-64">
                                    <div className={`h-12 w-12 md:h-14 md:w-14 rounded-2xl flex items-center justify-center shrink-0 border border-gray-50 group-hover:bg-violet-600 group-hover:text-white transition-all duration-300 ${log.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600' :
                                        log.status === 'PROCESSING' ? 'bg-blue-50 text-blue-600' :
                                            log.status === 'READY' ? 'bg-purple-50 text-purple-600' :
                                                'bg-amber-50 text-amber-600'
                                        }`}>
                                        <Shirt className="h-6 w-6 md:h-7 md:w-7" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm md:text-base font-black text-gray-900 uppercase tracking-tight truncate">#BAG_{log.id.slice(-4).toUpperCase()}</span>
                                            <Badge variant="outline" className={`text-[7px] font-black px-2 py-0.5 rounded-full border shadow-sm shrink-0 whitespace-nowrap ${log.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                log.status === 'PROCESSING' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                    log.status === 'READY' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                        'bg-amber-50 text-amber-700 border-amber-100'
                                                }`}>
                                                {log.status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Bed className="h-3 w-3 text-gray-300" />
                                            <span className="text-[9px] font-black text-violet-600 uppercase tracking-widest">RM {log.Room?.roomNumber}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Bag Specifications */}
                                <div className="flex-1 flex flex-col md:flex-row md:items-center gap-6 md:px-6 py-2 md:py-0 border-t md:border-t-0 md:border-x border-gray-50">
                                    <div className="flex gap-8">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                <Layers className="h-2 w-2" /> Items
                                            </span>
                                            <span className="text-[11px] font-black text-gray-900">{log.itemsCount || 0} PCS</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                <Scale className="h-2 w-2" /> Weight
                                            </span>
                                            <span className="text-[11px] font-black text-gray-900">{log.weight || '0.0'} KG</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0 border-t md:border-t-0 md:border-l border-gray-50 pt-3 md:pt-0 md:pl-6">
                                        <p className="text-[10px] md:text-xs font-medium text-gray-500 italic line-clamp-1">
                                            "{log.notes || 'No special handling instructions provided.'}"
                                        </p>
                                    </div>
                                </div>

                                {/* Operational Actions */}
                                <div className="flex items-center justify-between md:justify-end gap-6 md:min-w-[240px]">
                                    <div className="flex items-center gap-6 overflow-hidden">
                                        <div className="flex flex-col shrink-0">
                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">In</span>
                                            <span className="text-[10px] font-black text-gray-900 tracking-tighter uppercase">{format(new Date(log.receivedAt), 'MMM dd • HH:mm')}</span>
                                        </div>
                                        {log.deliveredAt && (
                                            <div className="flex flex-col shrink-0 border-l border-gray-50 pl-4">
                                                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">Out</span>
                                                <span className="text-[10px] font-black text-emerald-600 tracking-tighter uppercase">{format(new Date(log.deliveredAt), 'MMM dd • HH:mm')}</span>
                                            </div>
                                        )}
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="icon" className="h-10 w-10 md:h-11 md:w-11 rounded-xl md:rounded-2xl border-gray-100 hover:bg-gray-50 shrink-0">
                                                <MoreVertical className="h-4.5 w-4.5 text-gray-400" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-2xl border-gray-100 shadow-xl">
                                            <DropdownMenuItem
                                                className="p-3 gap-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-emerald-600 cursor-pointer focus:bg-emerald-50 focus:text-emerald-700"
                                                onClick={() => handleStatusUpdate(log.id, 'DELIVERED')}
                                            >
                                                <CheckCircle2 className="h-4 w-4" /> DELIVERED
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="p-3 gap-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-blue-600 cursor-pointer focus:bg-blue-50 focus:text-blue-700"
                                                onClick={() => handleStatusUpdate(log.id, 'PROCESSING')}
                                            >
                                                <Clock className="h-4 w-4" /> PROCESSING
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="p-3 gap-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-purple-600 cursor-pointer focus:bg-purple-50 focus:text-purple-700"
                                                onClick={() => handleStatusUpdate(log.id, 'READY')}
                                            >
                                                <Package className="h-4 w-4" /> READY
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="p-3 gap-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-gray-400 cursor-pointer"
                                                onClick={() => toast.info("History logs coming soon")}
                                            >
                                                <History className="h-4 w-4" /> Batch History
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </Card>
                    ))}

                    {filteredLogs?.length === 0 && (
                        <div className="py-20 md:py-32 bg-white border border-dashed border-gray-100 rounded-[2.5rem] md:rounded-[3rem] text-center px-6">
                            <Shirt className="h-12 w-12 md:h-20 md:w-20 text-gray-100 mx-auto mb-6 animate-pulse" />
                            <h3 className="text-base md:text-xl font-black text-gray-900 uppercase tracking-[0.2em] italic">Zero Batches</h3>
                            <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-[0.3em] mt-3 italic max-w-sm mx-auto leading-loose text-center">
                                No fabric care records found. Use the "Add Bag" button to initialize a new tracking session.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default WardenLaundryPage;
