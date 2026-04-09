"use client";
import React, { useState, useEffect } from 'react';
import {
    Sparkles,
    CheckCircle2,
    Clock,
    Bed,
    Plus,
    Calendar,
    Search,
    RefreshCw,
    Activity,
    ClipboardList
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
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import useAuthStore from '@/hooks/Authstate';
import { useWardenLogs, useWardenDueServices } from '@/hooks/useWarden';
import { useRoomByHostelId, useCreateCleaningLog, useSyncAutomation } from '@/hooks/useRoom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ListPageSkeleton } from "@/components/ui/skeletons";

const WardenCleaningPage = () => {
    const { user } = useAuthStore();
    const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = useWardenLogs(user?.id, 'cleaning');
    const { data: roomsResponse } = useRoomByHostelId(user?.hostelId);
    const { data: dueData, isLoading: dueLoading, refetch: refetchDue } = useWardenDueServices(user?.id);
    const syncAutomation = useSyncAutomation();
    const createMutation = useCreateCleaningLog();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedRoomId, setSelectedRoomId] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("due");
    const [formData, setFormData] = useState({
        notes: ""
    });

    useEffect(() => {
        syncAutomation.mutate();
    }, []);

    const handleCreate = async (roomId) => {
        const id = roomId || selectedRoomId;
        if (!id) return toast.error("Please select a room");

        createMutation.mutate({
            roomId: id,
            hostelId: user?.hostelId,
            notes: formData.notes || "Standard hygiene protocol applied",
            status: "COMPLETED",
            performedAt: new Date().toISOString()
        }, {
            onSuccess: () => {
                setIsCreateOpen(false);
                setSelectedRoomId("");
                setFormData({ notes: "" });
                toast.success("Area sanitized and verified");
                refetchDue();
                refetchLogs();
            }
        });
    };

    const handleSync = async () => {
        const promise = syncAutomation.mutateAsync();
        toast.promise(promise, {
            loading: 'Synchronizing records...',
            success: 'Registry updated',
            error: 'Sync failed'
        });
        await promise;
        refetchDue();
        refetchLogs();
    };

    if (logsLoading || dueLoading) return <ListPageSkeleton />;

    const rooms = roomsResponse?.data || [];
    const dueRooms = dueData?.dueCleaning || [];
    const recentLogs = logs || [];

    const filteredDue = dueRooms.filter(r => r.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredLogs = recentLogs.filter(l => l.Room?.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="min-h-screen bg-transparent pb-20 font-sans tracking-tight">
            {/* Premium Header */}
            <div className="bg-white dark:bg-card border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-9 w-9 bg-gray-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-gray-200">
                            <Activity size={20} />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-lg font-black text-gray-900 dark:text-foreground uppercase tracking-widest leading-none">Cleaning Log</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest">Dashboard</span>
                                <div className="h-1 w-1 bg-gray-400 rounded-full" />
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Online</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 rounded-xl border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/10 text-gray-400 dark:text-muted-foreground hover:bg-black hover:text-white transition-all shadow-sm"
                            onClick={handleSync}
                            disabled={syncAutomation.isPending}
                        >
                            <RefreshCw size={18} className={syncAutomation.isPending ? "animate-spin" : ""} />
                        </Button>
                        <div className="h-6 w-px bg-gray-100" />

                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button className="h-10 bg-black text-white px-5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg active:scale-95 flex items-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add Log
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="rounded-3xl p-0 overflow-hidden max-w-sm border-none shadow-2xl">
                                <div className="bg-gray-900 p-6 text-white text-center">
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em]">New Cleaning</h3>
                                    <p className="text-[10px] text-gray-400 dark:text-muted-foreground mt-1 uppercase font-black tracking-widest">Record cleaning session</p>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground ml-1">Select Room</label>
                                        <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                                            <SelectTrigger className="h-10 rounded-xl border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/10 font-black text-[10px] uppercase tracking-widest">
                                                <SelectValue placeholder="Which room?" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl font-black text-[10px] uppercase tracking-widest border-gray-100 dark:border-border shadow-2xl">
                                                {rooms.map(room => (
                                                    <SelectItem key={room.id} value={room.id} className="rounded-lg">
                                                        Room {room.roomNumber}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground ml-1">Notes</label>
                                        <Input
                                            placeholder="Example: Floor cleaned..."
                                            className="h-10 rounded-xl border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/10 font-medium text-xs"
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        />
                                    </div>

                                    <Button
                                        className="w-full h-12 rounded-xl bg-black text-white text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all mt-4"
                                        onClick={() => handleCreate()}
                                        disabled={createMutation.isPending}
                                    >
                                        {createMutation.isPending ? "Saving..." : "Save Log"}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
                {/* Metrics Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-white dark:bg-card border-none shadow-sm rounded-[2.5rem] p-8 relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute -right-4 -top-4 text-gray-50 group-hover:text-gray-100 transition-colors duration-500">
                            <Activity size={120} />
                        </div>
                        <div className="relative z-10 space-y-4">
                            <div className="h-12 w-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-gray-200">
                                <Clock size={24} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-[0.2em]">Pending Task</span>
                                <span className="text-3xl font-black text-gray-900 dark:text-foreground tracking-tighter leading-none">{dueRooms.length} <span className="text-sm font-bold text-gray-300 italic">DUE</span></span>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-white dark:bg-card border-none shadow-sm rounded-[2.5rem] p-8 relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="relative z-10 space-y-4">
                            <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                                <Sparkles size={24} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-[0.2em]">Total History</span>
                                <span className="text-3xl font-black text-gray-900 dark:text-foreground tracking-tighter leading-none">{recentLogs.length} <span className="text-sm font-bold text-gray-300 italic">LOGS</span></span>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-white dark:bg-card border-none shadow-sm rounded-[2.5rem] p-8 relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="relative z-10 space-y-4">
                            <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                                <ClipboardList size={24} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-[0.2em]">Sync Status</span>
                                <span className="text-3xl font-black text-gray-900 dark:text-foreground tracking-tighter leading-none">Healthy <span className="text-sm font-bold text-gray-300 italic">SYNC</span></span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Operations Feed */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                        <TabsList className="bg-white dark:bg-card border border-gray-100 dark:border-border p-1 rounded-2xl h-12 shadow-sm w-fit">
                            <TabsTrigger value="due" className="rounded-xl px-8 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-black data-[state=active]:text-white">
                                Due Rooms
                            </TabsTrigger>
                            <TabsTrigger value="registry" className="rounded-xl px-8 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-black data-[state=active]:text-white">
                                History
                            </TabsTrigger>
                        </TabsList>

                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-black transition-colors" />
                            <Input
                                placeholder="Search rooms..."
                                className="h-11 pl-10 w-full md:w-64 bg-white dark:bg-card border-gray-100 dark:border-border rounded-xl text-[10px] font-black uppercase tracking-widest focus:ring-1 focus:ring-gray-200 placeholder:text-gray-300 shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <TabsContent value="due" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredDue.length > 0 ? filteredDue.map((room) => (
                                <Card key={room.id} className="bg-white dark:bg-card border-gray-100 dark:border-border rounded-[2rem] p-6 shadow-sm hover:border-black transition-all group relative overflow-hidden">
                                    <div className="flex flex-col gap-5">
                                        <div className="flex items-start justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest leading-none mb-1">Room</span>
                                                <span className="text-2xl font-black text-gray-900 dark:text-foreground tracking-tighter uppercase whitespace-nowrap">R-{room.roomNumber}</span>
                                            </div>
                                            <Badge variant="outline" className="border-red-100 bg-red-50 text-red-600 text-[10px] font-black tracking-widest px-3 py-1 rounded-xl">
                                                -{room.overdueHours}H
                                            </Badge>
                                        </div>

                                        <div className="h-px bg-gray-50 dark:bg-muted/10 shrink-0" />

                                        <Button
                                            className="w-full h-11 bg-gray-50 dark:bg-muted/10 text-gray-900 dark:text-foreground hover:bg-black hover:text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all border border-gray-100 dark:border-border hover:border-black shadow-sm"
                                            onClick={() => handleCreate(room.id)}
                                            disabled={createMutation.isPending}
                                        >
                                            Mark Cleaned
                                        </Button>
                                    </div>
                                </Card>
                            )) : (
                                <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white dark:bg-card border border-dashed border-gray-100 dark:border-border rounded-[3rem]">
                                    <CheckCircle2 className="h-12 w-12 text-emerald-100 mb-4" />
                                    <h3 className="text-sm font-black text-gray-900 dark:text-foreground uppercase tracking-[0.2em]">All Clean!</h3>
                                    <p className="text-[10px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest mt-2 px-6 text-center">Every room is currently clean</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="registry" className="space-y-4">
                        <div className="space-y-3">
                            {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                                <Card key={log.id} className="p-5 border-none shadow-sm rounded-3xl flex items-center justify-between group transition-all hover:shadow-xl bg-white dark:bg-card relative overflow-hidden transition-all">
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 opacity-70" />
                                    <div className="flex items-center gap-5 flex-1">
                                        <div className="h-14 w-14 rounded-2xl bg-gray-50 dark:bg-muted/10 border border-gray-100 dark:border-border flex items-center justify-center text-gray-400 dark:text-muted-foreground group-hover:bg-black group-hover:text-white transition-all duration-500 shrink-0">
                                            <Sparkles size={24} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-sm font-black text-gray-900 dark:text-foreground uppercase tracking-tight">Room {log.Room?.roomNumber}</h3>
                                                <Badge variant="outline" className="h-5 border-none rounded-full text-[9px] font-black uppercase tracking-widest px-3 bg-emerald-50 text-emerald-700">
                                                    Cleaned
                                                </Badge>
                                            </div>
                                            <p className="text-[11px] font-medium text-gray-500 dark:text-muted-foreground line-clamp-1 italic">{log.notes || "Standard cleaning done."}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-10">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[9px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest">Date</span>
                                            <span className="text-[11px] font-black text-gray-900 dark:text-foreground uppercase whitespace-nowrap">{format(new Date(log.performedAt), 'MMM dd, yyyy')}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[9px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest">Time</span>
                                            <span className="text-[11px] font-black text-gray-900 dark:text-foreground uppercase whitespace-nowrap">{format(new Date(log.performedAt), 'HH:mm')}</span>
                                        </div>
                                    </div>
                                </Card>
                            )) : (
                                <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white dark:bg-card border border-dashed border-gray-100 dark:border-border rounded-[3rem]">
                                    <ClipboardList className="h-10 w-10 text-gray-100 mb-4" />
                                    <h3 className="text-sm font-black text-gray-900 dark:text-foreground uppercase tracking-[0.2em]">No History</h3>
                                    <p className="text-[10px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest mt-2 px-6 text-center">New cleaning logs will appear here</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};

export default WardenCleaningPage;
