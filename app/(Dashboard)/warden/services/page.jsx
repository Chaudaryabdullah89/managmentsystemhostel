"use client"
import React, { useState, useEffect } from "react";
import {
    Activity,
    Sparkles,
    ClipboardList,
    Building2,
    CheckCircle2,
    Clock,
    Search,
    Filter,
    ChevronRight,
    ArrowUpRight,
    Loader2,
    RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminDueServices } from "@/hooks/useWarden";
import { useSyncAutomation, useCreateCleaningLog, useCreateLaundryLog } from "@/hooks/useRoom";
import { format } from "date-fns";
import { GridPageSkeleton } from "@/components/ui/skeletons";
import { toast } from "sonner";

const AdminServiceOversight = () => {
    const { data: dueServices, isLoading, refetch } = useAdminDueServices();
    const syncAutomation = useSyncAutomation();
    const createCleaning = useCreateCleaningLog();
    const createLaundry = useCreateLaundryLog();

    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("cleaning");

    useEffect(() => {
        syncAutomation.mutate();
    }, []);

    if (isLoading) return <GridPageSkeleton />;

    const hostels = Object.entries(dueServices || {}).map(([id, data]) => ({
        id,
        ...data
    })).filter(h => h.hostelName.toLowerCase().includes(searchQuery.toLowerCase()));

    const totalCleaningDue = hostels.reduce((acc, h) => acc + h.dueCleaning.length, 0);
    const totalLaundryDue = hostels.reduce((acc, h) => acc + h.dueLaundry.length, 0);

    const handleSync = async () => {
        const promise = syncAutomation.mutateAsync();
        toast.promise(promise, {
            loading: 'Checking for automated cycles...',
            success: 'Logs updated',
            error: 'Failed to sync'
        });
        await promise;
        refetch();
    };

    const handleMarkCleaning = async (room, hostelId) => {
        createCleaning.mutate({
            roomId: room.id,
            hostelId: hostelId,
            status: "COMPLETED",
            notes: "Logged by Admin",
            performedAt: new Date().toISOString()
        }, {
            onSuccess: () => {
                toast.success(`Room ${room.roomNumber} marked as clean`);
                refetch();
            }
        });
    };

    const handleMarkLaundry = async (room, hostelId) => {
        createLaundry.mutate({
            roomId: room.id,
            hostelId: hostelId,
            status: "DELIVERED",
            notes: "Logged by Admin",
            receivedAt: new Date().toISOString()
        }, {
            onSuccess: () => {
                toast.success(`Room ${room.roomNumber} laundry recorded`);
                refetch();
            }
        });
    };

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
                            <h1 className="text-lg font-black text-gray-900 dark:text-foreground uppercase tracking-widest leading-none">Services</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest">Admin Dashboard</span>
                                <div className="h-1 w-1 bg-gray-400 rounded-full" />
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Sync Active</span>
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
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-muted-foreground group-focus-within:text-black transition-colors" />
                            <Input
                                placeholder="Search hostels..."
                                className="h-10 pl-10 w-64 bg-gray-50 dark:bg-muted/10 border-none rounded-xl text-[10px] font-black uppercase tracking-widest focus-visible:ring-1 focus-visible:ring-gray-100 placeholder:text-gray-300"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
                {/* Stats Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-white dark:bg-card border-none shadow-sm rounded-3xl p-6 relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute -right-4 -top-4 text-gray-50 group-hover:text-gray-100 transition-colors duration-500">
                            <Sparkles size={120} />
                        </div>
                        <div className="relative z-10 space-y-4">
                            <div className="h-11 w-11 bg-gray-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-gray-200">
                                <Activity size={20} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-[0.2em]">Pending Tasks</span>
                                <span className="text-3xl font-black text-gray-900 dark:text-foreground tracking-tighter leading-none">{totalCleaningDue + totalLaundryDue}</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-white dark:bg-card border-none shadow-sm rounded-3xl p-6 relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="relative z-10 space-y-4">
                            <div className="h-11 w-11 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                                <Sparkles size={20} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-[0.2em]">Cleaning</span>
                                <span className="text-3xl font-black text-gray-900 dark:text-foreground tracking-tighter leading-none">{totalCleaningDue} <span className="text-sm font-bold text-gray-300 italic">DUE</span></span>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-white dark:bg-card border-none shadow-sm rounded-3xl p-6 relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="relative z-10 space-y-4">
                            <div className="h-11 w-11 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                                <ClipboardList size={20} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-[0.2em]">Laundry</span>
                                <span className="text-3xl font-black text-gray-900 dark:text-foreground tracking-tighter leading-none">{totalLaundryDue} <span className="text-sm font-bold text-gray-300 italic">DUE</span></span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Operations Feed */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <TabsList className="bg-white dark:bg-card border border-gray-100 dark:border-border p-1 rounded-2xl h-12 shadow-sm font-black text-[10px] uppercase tracking-widest">
                            <TabsTrigger value="cleaning" className="rounded-xl px-8 focus:bg-black focus:text-white data-[state=active]:bg-black data-[state=active]:text-white">
                                Cleaning
                            </TabsTrigger>
                            <TabsTrigger value="laundry" className="rounded-xl px-8 focus:bg-black focus:text-white data-[state=active]:bg-black data-[state=active]:text-white">
                                Laundry
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="cleaning" className="space-y-8">
                        {hostels.filter(h => h.dueCleaning.length > 0).map((hostel) => (
                            <div key={hostel.id} className="space-y-4">
                                <div className="flex items-center gap-3 px-2">
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-muted-foreground">{hostel.hostelName}</h3>
                                    <Badge className="bg-red-50 text-red-600 border-none font-black text-[9px] px-2.5 rounded-lg">{hostel.dueCleaning.length} PENDING</Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {hostel.dueCleaning.map((room) => (
                                        <Card key={room.id} className="bg-white dark:bg-card border-gray-100 dark:border-border rounded-2xl p-5 shadow-sm hover:border-black transition-all group">
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest leading-none mb-1">Room</span>
                                                        <span className="text-xl font-black text-gray-900 dark:text-foreground tracking-tighter uppercase">R-{room.roomNumber}</span>
                                                    </div>
                                                    <Badge variant="outline" className="border-red-100 bg-red-50 text-red-600 text-[8px] font-black tracking-widest px-2 py-0.5 rounded-lg">
                                                        -{room.overdueHours}H
                                                    </Badge>
                                                </div>

                                                <div className="h-px bg-gray-50 dark:bg-muted/10" />

                                                <Button
                                                    className="w-full h-10 bg-gray-50 dark:bg-muted/10 text-gray-900 dark:text-foreground hover:bg-black hover:text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-all border border-gray-100 dark:border-border hover:border-black"
                                                    onClick={() => handleMarkCleaning(room, hostel.id)}
                                                    disabled={createCleaning.isPending}
                                                >
                                                    Mark Cleaned
                                                </Button>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {hostels.every(h => h.dueCleaning.length === 0) && (
                            <div className="py-20 flex flex-col items-center justify-center bg-white dark:bg-card border border-dashed border-gray-100 dark:border-border rounded-[3rem]">
                                <CheckCircle2 className="h-12 w-12 text-emerald-100 mb-4" />
                                <h3 className="text-sm font-black text-gray-900 dark:text-foreground uppercase tracking-[0.2em]">All Clean!</h3>
                                <p className="text-[10px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest mt-2">Every room is currently clean</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="laundry" className="space-y-8">
                        {hostels.filter(h => h.dueLaundry.length > 0).map((hostel) => (
                            <div key={hostel.id} className="space-y-4">
                                <div className="flex items-center gap-3 px-2">
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-muted-foreground">{hostel.hostelName}</h3>
                                    <Badge className="bg-blue-50 text-blue-600 border-none font-black text-[9px] px-2.5 rounded-lg">{hostel.dueLaundry.length} PENDING</Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {hostel.dueLaundry.map((room) => (
                                        <Card key={room.id} className="bg-white dark:bg-card border-gray-100 dark:border-border rounded-2xl p-5 shadow-sm hover:border-black transition-all group">
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest leading-none mb-1">Room</span>
                                                        <span className="text-xl font-black text-gray-900 dark:text-foreground tracking-tighter uppercase">R-{room.roomNumber}</span>
                                                    </div>
                                                    <Badge variant="outline" className="border-blue-100 bg-blue-50 text-blue-600 text-[8px] font-black tracking-widest px-2 py-0.5 rounded-lg">
                                                        -{room.overdueHours}H
                                                    </Badge>
                                                </div>

                                                <div className="h-px bg-gray-50 dark:bg-muted/10" />

                                                <Button
                                                    className="w-full h-10 bg-gray-50 dark:bg-muted/10 text-gray-900 dark:text-foreground hover:bg-black hover:text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-all border border-gray-100 dark:border-border hover:border-black"
                                                    onClick={() => handleMarkLaundry(room, hostel.id)}
                                                    disabled={createLaundry.isPending}
                                                >
                                                    Mark Delivered
                                                </Button>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {hostels.every(h => h.dueLaundry.length === 0) && (
                            <div className="py-20 flex flex-col items-center justify-center bg-white dark:bg-card border border-dashed border-gray-100 dark:border-border rounded-[3rem]">
                                <CheckCircle2 className="h-12 w-12 text-emerald-100 mb-4" />
                                <h3 className="text-sm font-black text-gray-900 dark:text-foreground uppercase tracking-[0.2em]">All Complete!</h3>
                                <p className="text-[10px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest mt-2">No pending laundry items found across any hostel</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};

export default AdminServiceOversight;
