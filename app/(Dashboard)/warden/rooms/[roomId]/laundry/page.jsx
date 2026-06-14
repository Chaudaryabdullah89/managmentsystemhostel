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
    LayoutGrid,
    Plus,
    Loader2,
    MoreVertical,
    Edit2
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
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
import useAuthStore from "@/hooks/Authstate";
import { ListPageSkeleton } from "@/components/ui/skeletons";
import { toast } from "sonner";

const WardenRoomLaundryPage = () => {
    const params = useParams();
    const router = useRouter();
    const { roomId } = params;
    const { user } = useAuthStore();
    const hostelId = user?.hostelId;

    const { data: roomResponse, isLoading, refetch } = useSingleRoomByHostelId(hostelId, roomId);
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

    const room = roomResponse?.data;
    const logs = room?.LaundryLog || [];

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
            toast.success("Fabric care session initiated");
            refetch();
        } catch (error) {
            toast.error("Operation failed");
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
            toast.success("Registry updated");
            refetch();
        } catch (error) {
            toast.error("Update failed");
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

    if (isLoading) return <ListPageSkeleton />;

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
            case "DELIVERED": return { bg: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: CheckCircle2 };
            case "READY": return { bg: "bg-purple-50 text-purple-700 border-purple-100", icon: Package };
            case "PROCESSING": return { bg: "bg-amber-50 text-amber-700 border-amber-100", icon: Clock };
            default: return { bg: "bg-gray-50 dark:bg-muted/10 text-gray-700 dark:text-foreground border-gray-100 dark:border-border", icon: ShoppingBag };
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-muted/10/30 pb-20 font-sans tracking-tight">
            <header className="bg-white dark:bg-card border-b sticky top-0 z-40 py-2 md:h-16">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-full flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl hover:bg-gray-100 h-9 w-9 shrink-0">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="h-6 w-px bg-gray-100 hidden md:block" />
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-sm md:text-lg font-black text-gray-900 dark:text-foreground tracking-tight leading-none truncate uppercase">Laundry Log</h1>
                            <p className="text-[9px] md:text-[10px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest mt-1 truncate">
                                Room {room?.roomNumber} • <span className="text-indigo-500">{room?.Hostel?.name}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative hidden lg:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-muted-foreground" />
                            <Input
                                className="pl-9 h-9 w-48 xl:w-64 bg-gray-50 dark:bg-background border-none text-[10px] font-black uppercase tracking-widest focus:bg-white dark:bg-card transition-all rounded-xl shadow-inner"
                                placeholder="Search laundry..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="h-9 px-4 md:px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95 gap-2">
                                    <Plus className="h-4 w-4" />
                                    <span className="hidden sm:inline">Add Laundry</span>
                                    <span className="sm:hidden">Add</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[400px] rounded-3xl p-0 overflow-hidden gap-0 border-none shadow-2xl">
                                <div className="p-6 bg-gray-50 dark:bg-muted/10 border-b border-gray-100 dark:border-border">
                                    <DialogTitle className="text-lg font-black tracking-tight uppercase">New Laundry</DialogTitle>
                                    <DialogDescription className="text-[10px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest mt-1">Record new laundry batch</DialogDescription>
                                </div>
                                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="itemsCount" className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground ml-1">Number of items</Label>
                                            <Input
                                                id="itemsCount" type="number" min="1"
                                                className="h-10 rounded-xl font-bold text-sm border-gray-100 dark:border-border"
                                                value={formData.itemsCount}
                                                onChange={(e) => setFormData({ ...formData, itemsCount: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="status" className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground ml-1">Status</Label>
                                            <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                                                <SelectTrigger className="h-10 rounded-xl font-black text-[10px] uppercase tracking-widest border-gray-100 dark:border-border">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-gray-100 dark:border-border">
                                                    <SelectItem value="PENDING">PENDING</SelectItem>
                                                    <SelectItem value="PROCESSING">PROCESSING</SelectItem>
                                                    <SelectItem value="READY">READY</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="notes" className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground ml-1">Notes</Label>
                                        <Textarea
                                            id="notes" placeholder="T-shirts, Jeans, etc."
                                            className="min-h-[100px] rounded-xl font-medium text-sm resize-none pt-3 border-gray-100 dark:border-border focus:ring-indigo-500"
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        />
                                    </div>
                                    <Button type="submit" className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg mt-2 transition-all active:scale-[0.98]" disabled={createLaundry.isPending}>
                                        {createLaundry.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Log"}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </header>

            <div className="max-w-[1600px] mx-auto px-6 py-8">
                {/* Metrics Matrix */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-10">
                    {[
                        { label: 'Total Items', value: stats.totalItems, sub: 'Items total', color: 'text-indigo-600', bg: 'bg-indigo-50', icon: LayoutGrid },
                        { label: 'In Queue', value: stats.processing + stats.pending, sub: 'In progress', color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
                        { label: 'Ready', value: logs.filter(l => l.status === 'READY').length, sub: 'For pickup', color: 'text-purple-600', bg: 'bg-purple-50', icon: Package },
                        { label: 'Complete', value: stats.delivered, sub: 'Delivered', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
                    ].map((s, i) => (
                        <Card key={i} className="bg-white dark:bg-card rounded-3xl p-5 border border-gray-100 dark:border-border shadow-sm flex items-center gap-4 group hover:shadow-md transition-all active:scale-[0.98] cursor-default relative overflow-hidden">
                            <div className={`absolute top-0 right-0 h-12 w-12 ${s.bg} opacity-10 rounded-bl-full translate-x-6 -translate-y-6`} />
                            <div className={`h-11 w-11 rounded-xl ${s.bg} ${s.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                                <s.icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest truncate">{s.label}</p>
                                <p className="text-xl font-black text-gray-900 dark:text-foreground leading-tight truncate">{s.value}</p>
                                <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mt-0.5 truncate">{s.sub}</p>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* History Feed */}
                <div className="space-y-3">
                    {filteredLogs.length > 0 ? (
                        filteredLogs.map((log) => {
                            const theme = getStatusTheme(log.status);
                            return (
                                <Card key={log.id} className="group bg-white dark:bg-card rounded-3xl p-5 border border-gray-100 dark:border-border shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden active:scale-[0.99] cursor-pointer" onClick={() => openUpdateDialog(log)}>
                                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${log.status === 'DELIVERED' ? 'bg-emerald-500' : log.status === 'READY' ? 'bg-purple-500' : 'bg-amber-500'} opacity-70`} />
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 ${log.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white' : 'bg-gray-50 dark:bg-muted/10 text-gray-400 dark:text-muted-foreground group-hover:bg-indigo-600 group-hover:text-white'}`}>
                                            {log.status === 'DELIVERED' ? <CheckCircle2 className="h-6 w-6" /> : <Package className="h-6 w-6" />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <h3 className="text-sm font-black text-gray-900 dark:text-foreground uppercase tracking-tight truncate">{log.itemsCount} Item{log.itemsCount > 1 ? 's' : ''}</h3>
                                                <Badge variant="outline" className={`h-5 border-none rounded-full text-[8px] font-black uppercase tracking-widest px-2 shadow-sm ${theme.bg}`}>
                                                    {log.status}
                                                </Badge>
                                            </div>
                                            <p className="text-[11px] font-medium text-gray-500 dark:text-muted-foreground line-clamp-1 italic">{log.notes || "No extra notes."}</p>
                                            <div className="flex items-center gap-3 mt-2">
                                                <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(log.receivedAt).toLocaleDateString()}
                                                </div>
                                                <span className="h-1 w-1 rounded-full bg-gray-200" />
                                                <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(log.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-6 md:gap-10 border-t md:border-t-0 border-gray-50 pt-4 md:pt-0">
                                        <div className="flex flex-col items-start md:items-end">
                                            <span className="text-[8px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest">Status</span>
                                            <Badge className={`mt-0.5 h-6 text-[8px] font-black px-3 py-0 border-none rounded-full shadow-sm ${log.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600 dark:text-muted-foreground'}`}>
                                                {log.status}
                                            </Badge>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <div className="h-9 w-9 rounded-xl items-center justify-center text-gray-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all border border-transparent group-hover:border-indigo-100 hidden sm:flex">
                                                <Edit2 className="h-4 w-4" />
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-gray-100 text-gray-400 dark:text-muted-foreground">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-gray-100 dark:border-border shadow-2xl">
                                                    <DropdownMenuItem className="p-3 gap-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-gray-600 dark:text-muted-foreground focus:bg-gray-50 dark:bg-muted/10 cursor-pointer" onClick={() => openUpdateDialog(log)}>
                                                        <Edit2 className="h-4 w-4" /> Edit Details
                                                    </DropdownMenuItem>
                                                    {log.status !== 'DELIVERED' && (
                                                        <DropdownMenuItem
                                                            className="p-3 gap-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-emerald-600 focus:bg-emerald-50 cursor-pointer"
                                                            onClick={() => updateLaundry.mutate({ id: log.id, status: 'DELIVERED' }, { onSuccess: refetch })}
                                                        >
                                                            <CheckCircle2 className="h-4 w-4" /> Complete
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </Card>
                            )
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-card rounded-3xl border border-dashed border-gray-100 dark:border-border">
                            <Shirt className="h-10 w-10 text-gray-100 mb-4 animate-pulse" />
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">No laundry records found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Update Status Dialog - Updated Style */}
            <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
                <DialogContent className="sm:max-w-[400px] rounded-3xl p-0 overflow-hidden gap-0 border-none shadow-2xl">
                    <div className="p-6 bg-gray-50 dark:bg-muted/10 border-b border-gray-100 dark:border-border">
                        <DialogTitle className="text-lg font-black tracking-tight uppercase">Laundry Status</DialogTitle>
                        <DialogDescription className="text-[10px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest mt-1">Update laundry status</DialogDescription>
                    </div>
                    <form onSubmit={handleUpdateStatus} className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="itemsCountUpdate" className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground ml-1">Number of items</Label>
                                <Input
                                    id="itemsCountUpdate" type="number" min="1"
                                    className="h-10 rounded-xl font-bold text-sm border-gray-100 dark:border-border"
                                    value={formData.itemsCount}
                                    onChange={(e) => setFormData({ ...formData, itemsCount: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="statusUpdate" className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground ml-1">Status</Label>
                                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                                    <SelectTrigger className="h-10 rounded-xl font-black text-[10px] uppercase tracking-widest border-gray-100 dark:border-border">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-gray-100 dark:border-border">
                                        <SelectItem value="PENDING">PENDING</SelectItem>
                                        <SelectItem value="PROCESSING">PROCESSING</SelectItem>
                                        <SelectItem value="READY">READY</SelectItem>
                                        <SelectItem value="DELIVERED">DELIVERED</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="notesUpdate" className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground ml-1">Update Notes</Label>
                            <Textarea
                                id="notesUpdate"
                                className="min-h-[100px] rounded-xl font-medium text-sm resize-none pt-3 border-gray-100 dark:border-border"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                        <Button type="submit" className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg mt-2 transition-all active:scale-[0.98]" disabled={updateLaundry.isPending}>
                            {updateLaundry.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default WardenRoomLaundryPage;
