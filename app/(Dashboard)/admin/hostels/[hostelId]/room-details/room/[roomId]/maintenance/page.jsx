"use client"
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Wrench,
    Calendar,
    Clock,
    CheckCircle2,
    Search,
    AlertTriangle,
    LayoutGrid,
    History as HistoryIcon,
    Plus,
    Loader2,
    CheckCircle,
    Edit2,
    MoreVertical,
    Activity
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
import { useSingleRoomByHostelId, useCreateMaintenance, useUpdateMaintenance } from "@/hooks/useRoom";
import Loader from "@/components/ui/Loader";

const MaintenancePage = () => {
    const params = useParams();
    const router = useRouter();
    const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const hostelId = searchParams.get('hostelId');
    const { roomId, hostelId: hostelName } = params;

    const { data: roomData, isLoading } = useSingleRoomByHostelId(hostelId, roomId);
    const createMaintenance = useCreateMaintenance();
    const updateMaintenance = useUpdateMaintenance();

    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        priority: "MEDIUM",
        status: "PENDING",
        resolutionNotes: ""
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const resolvedHostelId = roomData?.data?.hostelId;
            if (!resolvedHostelId) {
                console.error("Missing hostelId for maintenance creation");
                return;
            }

            await createMaintenance.mutateAsync({
                ...formData,
                roomId: roomId,
                hostelId: resolvedHostelId
            });
            setIsDialogOpen(false);
            setFormData({ title: "", description: "", priority: "MEDIUM", status: "PENDING", resolutionNotes: "" });
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await updateMaintenance.mutateAsync({
                id: selectedLog.id,
                status: formData.status,
                resolutionNotes: formData.resolutionNotes
            });
            setIsUpdateDialogOpen(false);
            setSelectedLog(null);
        } catch (error) {
            console.error(error);
        }
    };

    const openUpdate = (log) => {
        setSelectedLog(log);
        setFormData({
            ...formData,
            status: log.status,
            resolutionNotes: log.resolutionNotes || ""
        });
        setIsUpdateDialogOpen(true);
    };

    if (isLoading) return <Loader label="Loading Maintenance Records" subLabel="Fetching records..." icon={Wrench} fullScreen={false} />;

    const logs = roomData?.data?.maintanance || [];

    const stats = {
        total: logs.length,
        pending: logs.filter(l => l.status === 'PENDING').length,
        resolved: logs.filter(l => l.status === 'RESOLVED').length,
        urgent: logs.filter(l => l.priority === 'URGENT' || l.priority === 'HIGH').length
    };

    const filteredLogs = logs.filter(log =>
        log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getPriorityColor = (p) => {
        switch (p) {
            case "URGENT": return "bg-rose-50 text-rose-700 border-none";
            case "HIGH": return "bg-orange-50 text-orange-700 border-none";
            case "MEDIUM": return "bg-indigo-50 text-indigo-700 border-none";
            default: return "bg-gray-50 text-gray-700 border-none";
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/30 pb-20">
            <header className="bg-white border-b sticky top-0 z-40 py-2 md:h-16">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-full flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl hover:bg-gray-100 h-9 w-9 shrink-0">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="h-6 w-px bg-gray-100 hidden md:block" />
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-sm md:text-lg font-black text-gray-900 tracking-tight leading-none truncate uppercase">Maintenance Ledger</h1>
                            <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 truncate">
                                Unit {roomData?.data?.roomNumber} • <span className="text-amber-500">{decodeURIComponent(hostelName)}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative hidden lg:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <Input
                                className="pl-9 h-9 w-48 xl:w-64 bg-gray-50/50 border-none text-[10px] font-black uppercase tracking-widest focus:bg-white transition-all rounded-xl shadow-inner"
                                placeholder="Scan Logs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="h-9 px-4 md:px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95 gap-2">
                                    <Plus className="h-4 w-4" />
                                    <span className="hidden sm:inline">Issue Ticket</span>
                                    <span className="sm:hidden">Issue</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[400px] rounded-3xl p-0 overflow-hidden gap-0 border-none shadow-2xl">
                                <div className="p-6 bg-gray-50 border-b border-gray-100">
                                    <DialogTitle className="text-lg font-black tracking-tight uppercase">System Request</DialogTitle>
                                    <DialogDescription className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Submit maintenance for Unit {roomData?.data?.roomNumber}</DialogDescription>
                                </div>
                                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Subject Vector</Label>
                                        <Input
                                            placeholder="Component failure details..."
                                            className="h-10 rounded-xl font-bold text-sm"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Urgency Level</Label>
                                            <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                                                <SelectTrigger className="h-10 rounded-xl font-black text-[10px] uppercase tracking-widest">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-gray-100 shadow-2xl">
                                                    <SelectItem value="LOW" className="text-[10px] font-black uppercase tracking-widest">Low</SelectItem>
                                                    <SelectItem value="MEDIUM" className="text-[10px] font-black uppercase tracking-widest">Medium</SelectItem>
                                                    <SelectItem value="HIGH" className="text-[10px] font-black uppercase tracking-widest">High</SelectItem>
                                                    <SelectItem value="URGENT" className="text-[10px] font-black uppercase tracking-widest">Urgent</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Initial State</Label>
                                            <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                                                <SelectTrigger className="h-10 rounded-xl font-black text-[10px] uppercase tracking-widest">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-gray-100 shadow-2xl">
                                                    <SelectItem value="PENDING" className="text-[10px] font-black uppercase tracking-widest">Pending</SelectItem>
                                                    <SelectItem value="IN_PROGRESS" className="text-[10px] font-black uppercase tracking-widest">In Progress</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Technical Details</Label>
                                        <Textarea
                                            placeholder="Detailed diagnostic report..."
                                            className="min-h-[100px] rounded-xl font-medium text-sm resize-none pt-3 focus:ring-1 focus:ring-indigo-500"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                    <Button type="submit" className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg mt-2 transition-all active:scale-[0.98]" disabled={createMaintenance.isPending}>
                                        {createMaintenance.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Initiate Protocol"}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </header>

            <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-8">
                {/* Metrics Matrix */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-10">
                    {[
                        { label: 'Total Tickets', value: stats.total, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: LayoutGrid, sub: 'All Logs' },
                        { label: 'Pending Ops', value: stats.pending, color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock, sub: 'Active Queue' },
                        { label: 'Resolved', value: stats.resolved, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2, sub: 'Ops Complete' },
                        { label: 'Critical Ops', value: stats.urgent, color: 'text-rose-600', bg: 'bg-rose-50', icon: AlertTriangle, sub: 'High Urgency' },
                    ].map((s, i) => (
                        <Card key={i} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all active:scale-[0.98] cursor-default relative overflow-hidden">
                            <div className={`absolute top-0 right-0 h-12 w-12 ${s.bg} opacity-10 rounded-bl-full translate-x-6 -translate-y-6`} />
                            <div className={`h-11 w-11 rounded-xl ${s.bg} ${s.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                                <s.icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest truncate">{s.label}</p>
                                <p className="text-xl font-black text-gray-900 leading-tight truncate">{s.value}</p>
                                <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mt-0.5 truncate">{s.sub}</p>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Asset Ribbon Feed */}
                <div className="space-y-3">
                    {filteredLogs.length > 0 ? (
                        filteredLogs.map((log) => (
                            <Card key={log.id} className="group bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden active:scale-[0.99] cursor-pointer" onClick={() => openUpdate(log)}>
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${log.status === 'RESOLVED' ? 'bg-emerald-500' : log.priority === 'URGENT' ? 'bg-rose-500' : log.priority === 'HIGH' ? 'bg-orange-500' : 'bg-indigo-500'} opacity-70`} />
                                <div className="flex items-start gap-4 flex-1">
                                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 ${log.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white' : 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white'}`}>
                                        {log.status === 'RESOLVED' ? <CheckCircle2 className="h-6 w-6" /> : <Wrench className="h-6 w-6" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight truncate">{log.title}</h3>
                                            <Badge variant="outline" className={`h-5 border-none rounded-full text-[8px] font-black uppercase tracking-widest px-2 shadow-sm ${getPriorityColor(log.priority)}`}>
                                                {log.priority}
                                            </Badge>
                                        </div>
                                        <p className="text-[11px] font-medium text-gray-500 line-clamp-1 italic">{log.description || "System diagnostic incomplete."}</p>
                                        <div className="flex items-center gap-3 mt-2">
                                            <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                                <Calendar className="h-3 w-3" />
                                                Node: {roomData?.data?.roomNumber}
                                            </div>
                                            <span className="h-1 w-1 rounded-full bg-gray-200" />
                                            <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                                <Clock className="h-3 w-3" />
                                                {new Date(log.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-6 md:gap-10 border-t md:border-t-0 border-gray-50 pt-4 md:pt-0">
                                    <div className="flex flex-col items-start md:items-end">
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Artifact State</span>
                                        <Badge className={`mt-0.5 h-6 text-[8px] font-black px-3 py-0 border-none rounded-full shadow-sm ${log.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                            {log.status}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <div className="h-9 w-9 rounded-xl flex items-center justify-center text-gray-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all border border-transparent group-hover:border-indigo-100 hidden sm:flex">
                                            <Edit2 className="h-4 w-4" />
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-gray-100 text-gray-400">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-gray-100 shadow-2xl bg-white/95 backdrop-blur-xl">
                                                <DropdownMenuItem className="p-3 gap-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-gray-600 focus:bg-gray-50 cursor-pointer" onClick={() => openUpdate(log)}>
                                                    <Edit2 className="h-4 w-4" /> Update Diagnostics
                                                </DropdownMenuItem>
                                                {log.status !== 'RESOLVED' && (
                                                    <DropdownMenuItem
                                                        className="p-3 gap-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-emerald-600 focus:bg-emerald-50 cursor-pointer"
                                                        onClick={() => updateMaintenance.mutate({ id: log.id, status: 'RESOLVED' })}
                                                    >
                                                        <CheckCircle className="h-4 w-4" /> Execute Resolve
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-gray-100">
                            <Wrench className="h-10 w-10 text-gray-100 mb-4 animate-pulse" />
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Maintenance logs void of active tickets</p>
                        </div>
                    )}
                </div>
            </div>


            {/* RESOLUTION DIALOG */}
            <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
                <DialogContent className="sm:max-w-[400px] rounded-3xl p-0 overflow-hidden gap-0 border-none shadow-2xl">
                    <div className="p-6 bg-gray-50 border-b border-gray-100">
                        <DialogTitle className="text-lg font-black tracking-tight uppercase">Status Update</DialogTitle>
                        <DialogDescription className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Modify ticket state for Unit {roomData?.data?.roomNumber}</DialogDescription>
                    </div>
                    <form onSubmit={handleUpdate} className="p-6 space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Lifecycle State</Label>
                            <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                                <SelectTrigger className="h-10 rounded-xl font-black text-[10px] uppercase tracking-widest border-gray-100">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-gray-100 shadow-2xl">
                                    <SelectItem value="PENDING" className="text-[10px] font-black uppercase tracking-widest">Pending</SelectItem>
                                    <SelectItem value="IN_PROGRESS" className="text-[10px] font-black uppercase tracking-widest">In Progress</SelectItem>
                                    <SelectItem value="RESOLVED" className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Resolved</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Resolution Protocol</Label>
                            <Textarea
                                placeholder="Describe actions taken to restore component..."
                                className="min-h-[100px] rounded-xl font-medium text-sm resize-none pt-3 border-gray-100 focus:ring-1 focus:ring-amber-500"
                                value={formData.resolutionNotes}
                                onChange={(e) => setFormData({ ...formData, resolutionNotes: e.target.value })}
                            />
                        </div>
                        <Button type="submit" className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg mt-2 transition-all active:scale-[0.98]" disabled={updateMaintenance.isPending}>
                            {updateMaintenance.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Resolution"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MaintenancePage;
