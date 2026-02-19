"use client"
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Shirt,
    Clock,
    Calendar,
    Package,
    CheckCircle2,
    Search,
    ShoppingBag,
    TrendingUp,
    Truck,
    Info,
    LayoutGrid,
    Plus,
    Loader2,
    User,
    MoreVertical,
    Edit2
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useSingleRoomByHostelId, useCreateLaundryLog, useUpdateLaundryLog } from "@/hooks/useRoom";

const LaundryPage = () => {
    const params = useParams();
    const router = useRouter();
    const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const hostelId = searchParams.get('hostelId');
    const { roomId, hostelId: hostelName } = params;

    const { data: roomData, isLoading } = useSingleRoomByHostelId(hostelId, roomId);
    const createLaundry = useCreateLaundryLog();
    const updateLaundry = useUpdateLaundryLog();

    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        itemsCount: 1,
        status: "PENDING",
        notes: ""
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createLaundry.mutateAsync({
                ...formData,
                itemsCount: parseInt(formData.itemsCount),
                roomId: roomId,
                receivedAt: new Date().toISOString()
            });
            setIsDialogOpen(false);
            setFormData({ itemsCount: 1, status: "PENDING", notes: "" });
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        try {
            await updateLaundry.mutateAsync({
                id: selectedLog.id,
                ...formData
            });
            setIsUpdateDialogOpen(false);
            setSelectedLog(null);
        } catch (error) {
            console.error(error);
        }
    };

    const openUpdateDialog = (log) => {
        setSelectedLog(log);
        setFormData({
            itemsCount: log.itemsCount,
            status: log.status,
            notes: log.notes || ""
        });
        setIsUpdateDialogOpen(true);
    };

    if (isLoading) return (
        <div className="flex h-screen items-center justify-center bg-white font-sans">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="h-24 w-24 border-[3px] border-gray-100 border-t-purple-600 rounded-full animate-spin" />
                    <Shirt className="h-10 w-10 text-purple-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center space-y-1.5">
                    <p className="text-xl font-black text-gray-900 tracking-tighter uppercase italic">Syncing Fabric Care</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Retreiving Inventory Manifest & Tracking Status</p>
                </div>
            </div>
        </div>
    );

    const logs = roomData?.data?.LaundryLog || [];

    const stats = {
        totalItems: logs.reduce((acc, curr) => acc + (curr.itemsCount || 0), 0),
        pending: logs.filter(l => l.status === 'PENDING').length,
        processing: logs.filter(l => l.status === 'PROCESSING').length,
        delivered: logs.filter(l => l.status === 'DELIVERED').length
    };

    const filteredLogs = logs.filter(log =>
        log.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusTheme = (status) => {
        switch (status) {
            case "DELIVERED": return { bg: "bg-green-50 text-green-700 border-green-100", icon: CheckCircle2 };
            case "READY": return { bg: "bg-blue-50 text-blue-700 border-blue-100", icon: Package };
            case "PROCESSING": return { bg: "bg-purple-50 text-purple-700 border-purple-100", icon: Clock };
            default: return { bg: "bg-amber-50 text-amber-700 border-amber-100", icon: ShoppingBag };
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/30 pb-20">
            {/* Slim Header */}
            <div className="bg-white border-b sticky top-0 z-30 h-16">
                <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl hover:bg-gray-100 h-9 w-9">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex flex-col">
                            <h1 className="text-lg font-black text-gray-900 tracking-tight leading-none flex items-center gap-2">
                                <Shirt className="h-4 w-4 text-gray-400" />
                                Fabric Care Log
                            </h1>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                Unit {roomData?.data?.roomNumber} • {decodeURIComponent(hostelName)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <Input
                                className="pl-9 h-9 w-64 bg-gray-50/50 border-gray-200 text-xs font-medium focus:bg-white transition-all rounded-xl"
                                placeholder="Search inventory..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="h-9 px-4 bg-black hover:bg-gray-800 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-black/10">
                                    <Plus className="h-3 w-3 mr-2" />
                                    Log Items
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[400px] rounded-3xl p-0 overflow-hidden gap-0">
                                <div className="p-6 bg-gray-50 border-b border-gray-100">
                                    <DialogTitle className="text-lg font-black tracking-tight">Record Inventory</DialogTitle>
                                    <DialogDescription className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Log items for cleaning</DialogDescription>
                                </div>
                                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="itemsCount" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Item Count</Label>
                                            <Input
                                                id="itemsCount" type="number" min="1"
                                                className="h-10 rounded-xl font-bold text-sm"
                                                value={formData.itemsCount}
                                                onChange={(e) => setFormData({ ...formData, itemsCount: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="status" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Initial Status</Label>
                                            <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                                                <SelectTrigger className="h-10 rounded-xl font-bold text-xs uppercase">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="PENDING">Pending</SelectItem>
                                                    <SelectItem value="PROCESSING">Processing</SelectItem>
                                                    <SelectItem value="READY">Ready</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="notes" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Inventory Manifest</Label>
                                        <Textarea
                                            id="notes" placeholder="T-shirts, Jeans, etc."
                                            className="min-h-[100px] rounded-xl font-medium text-sm resize-none pt-3"
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        />
                                    </div>
                                    <Button type="submit" className="w-full h-12 bg-black hover:bg-gray-800 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg mt-2" disabled={createLaundry.isPending}>
                                        {createLaundry.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Commit to Log"}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-6 py-8">
                {/* Metrics Matrix */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Volume', value: stats.totalItems, color: 'text-gray-900', icon: LayoutGrid },
                        { label: 'In Queue', value: stats.processing + stats.pending, color: 'text-amber-600', icon: Clock },
                        { label: 'Ready for Pickup', value: logs.filter(l => l.status === 'READY').length, color: 'text-blue-600', icon: Package },
                        { label: 'Dispatched', value: stats.delivered, color: 'text-emerald-600', icon: CheckCircle2 },
                    ].map((s, i) => (
                        <div key={i} className="bg-white rounded-[1.5rem] p-5 border border-gray-100 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
                            <div className={`h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center ${s.color} group-hover:scale-110 transition-transform`}>
                                <s.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{s.label}</p>
                                <p className="text-xl font-black text-gray-900 leading-tight">{s.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Asset Ribbon Feed */}
                <div className="space-y-4">
                    {filteredLogs.length > 0 ? (
                        filteredLogs.map((log) => {
                            const theme = getStatusTheme(log.status);
                            return (
                                <div key={log.id} className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${log.status === 'DELIVERED' ? 'bg-emerald-500' : log.status === 'READY' ? 'bg-blue-500' : 'bg-amber-500'}`} />
                                    <div className="flex items-start gap-5">
                                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${log.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-600'}`}>
                                            {log.status === 'DELIVERED' ? <CheckCircle2 className="h-6 w-6" /> : <Package className="h-6 w-6" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-sm font-black text-gray-900">{log.itemsCount} Unit{log.itemsCount > 1 ? 's' : ''}</h3>
                                                <Badge variant="outline" className={`h-5 border-0 rounded-md text-[9px] font-black uppercase tracking-widest ${theme.bg}`}>
                                                    {log.status}
                                                </Badge>
                                            </div>
                                            <p className="text-xs font-medium text-gray-500 line-clamp-1">{log.notes || "Standard laundry service."}</p>
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">{new Date(log.receivedAt).toLocaleDateString()}</span>
                                                <span className="h-1 w-1 rounded-full bg-gray-200" />
                                                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">{new Date(log.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-6 pl-16 md:pl-0">
                                        <div className="flex flex-col items-end hidden md:flex">
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tracking Status</span>
                                            <span className={`text-[10px] font-black uppercase mt-0.5 ${log.status === 'DELIVERED' ? 'text-emerald-600' : 'text-gray-600'}`}>{log.status}</span>
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-gray-100 text-gray-400">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 rounded-xl p-2 border-gray-100 shadow-xl">
                                                <DropdownMenuItem className="rounded-lg text-xs font-bold p-2.5 cursor-pointer hover:bg-gray-50 mb-1" onClick={() => openUpdateDialog(log)}>
                                                    <Edit2 className="h-3.5 w-3.5 mr-2 text-gray-500" /> Update Status
                                                </DropdownMenuItem>
                                                {log.status !== 'DELIVERED' && (
                                                    <DropdownMenuItem
                                                        className="rounded-lg text-xs font-bold p-2.5 cursor-pointer hover:bg-emerald-50 text-emerald-600"
                                                        onClick={() => updateLaundry.mutate({ id: log.id, status: 'DELIVERED' })}
                                                    >
                                                        <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> Mark Delivered
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                            <Shirt className="h-8 w-8 text-gray-300 mb-3" />
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Inventory Empty • No Active Logs</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Architecture Bar */}
            <div className="fixed bottom-0 w-full z-40 px-6 pb-4 pointer-events-none left-0">
                <div className="max-w-[1600px] mx-auto bg-black/90 backdrop-blur-xl text-white h-12 rounded-2xl shadow-2xl flex items-center justify-between px-6 pointer-events-auto">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Shirt className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-[10px] font-black tracking-widest uppercase text-blue-400">Fabric Care Ops</span>
                        </div>
                        <div className="h-3 w-px bg-white/20"></div>
                        <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${stats.processing > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                            <span className="text-[10px] font-black uppercase text-gray-300 tracking-widest">{stats.processing > 0 ? 'PROCESSING' : 'IDLE'}</span>
                        </div>
                    </div>
                    <span className="text-[10px] font-black tracking-widest uppercase text-gray-500 hidden sm:block">Node: ROOM-{roomData?.data?.roomNumber}</span>
                </div>
            </div>

            {/* Update Status Dialog - Updated Style */}
            <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
                <DialogContent className="sm:max-w-[400px] rounded-3xl p-0 overflow-hidden gap-0">
                    <div className="p-6 bg-gray-50 border-b border-gray-100">
                        <DialogTitle className="text-lg font-black tracking-tight">Status Update</DialogTitle>
                        <DialogDescription className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Modify inventory state</DialogDescription>
                    </div>
                    <form onSubmit={handleUpdateStatus} className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="itemsCountUpdate" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Item Count</Label>
                                <Input
                                    id="itemsCountUpdate" type="number" min="1"
                                    className="h-10 rounded-xl font-bold text-sm"
                                    value={formData.itemsCount}
                                    onChange={(e) => setFormData({ ...formData, itemsCount: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="statusUpdate" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Status</Label>
                                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                                    <SelectTrigger className="h-10 rounded-xl font-bold text-xs uppercase">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="PENDING">Pending</SelectItem>
                                        <SelectItem value="PROCESSING">Processing</SelectItem>
                                        <SelectItem value="READY">Ready</SelectItem>
                                        <SelectItem value="DELIVERED">Delivered</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="notesUpdate" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Update Manifest</Label>
                            <Textarea
                                id="notesUpdate"
                                className="min-h-[100px] rounded-xl font-medium text-sm resize-none pt-3"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                        <Button type="submit" className="w-full h-12 bg-black hover:bg-gray-800 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg mt-2" disabled={updateLaundry.isPending}>
                            {updateLaundry.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Update"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default LaundryPage;
