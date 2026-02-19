"use client"
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Wrench,
    Calendar,
    Clock,
    AlertCircle,
    CheckCircle2,
    Filter,
    Search,
    AlertTriangle,
    Info,
    LayoutGrid,
    History as HistoryIcon,
    Plus,
    Loader2,
    MoreVertical,
    CheckCircle,
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
import { useSingleRoomByHostelId, useCreateMaintenance, useUpdateMaintenance } from "@/hooks/useRoom";

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
            await createMaintenance.mutateAsync({
                ...formData,
                roomId: roomId,
                hostelId: hostelId || roomData?.data?.hostelId
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

    if (isLoading) return (
        <div className="flex h-screen items-center justify-center bg-white font-sans">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="h-24 w-24 border-[3px] border-gray-100 border-t-amber-500 rounded-full animate-spin" />
                    <Wrench className="h-10 w-10 text-amber-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center space-y-1.5">
                    <p className="text-xl font-black text-gray-900 tracking-tighter uppercase italic">Syncing Health Logs</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Retreiving Maintenance History & Diagnostics</p>
                </div>
            </div>
        </div>
    );

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
            case "URGENT": return "bg-red-50 text-red-700 border-red-100";
            case "HIGH": return "bg-orange-50 text-orange-700 border-orange-100";
            case "MEDIUM": return "bg-blue-50 text-blue-700 border-blue-100";
            default: return "bg-gray-50 text-gray-700 border-gray-100";
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
                                <Wrench className="h-4 w-4 text-gray-400" />
                                Maintenance Ledger
                            </h1>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                Unit {roomData?.data?.roomNumber} • {decodeURIComponent(hostelName)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="h-9 px-4 bg-black hover:bg-gray-800 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-black/10">
                                    <Plus className="h-3 w-3 mr-2" />
                                    New Ticket
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[400px] rounded-3xl p-0 overflow-hidden gap-0">
                                <div className="p-6 bg-gray-50 border-b border-gray-100">
                                    <DialogTitle className="text-lg font-black tracking-tight">System Request</DialogTitle>
                                    <DialogDescription className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Submit maintenance for Room {roomData?.data?.roomNumber}</DialogDescription>
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
                                                <SelectTrigger className="h-10 rounded-xl font-bold text-xs uppercase">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="LOW">Low</SelectItem>
                                                    <SelectItem value="MEDIUM">Medium</SelectItem>
                                                    <SelectItem value="HIGH">High</SelectItem>
                                                    <SelectItem value="URGENT">Urgent</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Initial State</Label>
                                            <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                                                <SelectTrigger className="h-10 rounded-xl font-bold text-xs uppercase">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="PENDING">Pending</SelectItem>
                                                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Technical Details</Label>
                                        <Textarea
                                            placeholder="Detailed diagnostic report..."
                                            className="min-h-[100px] rounded-xl font-medium text-sm resize-none pt-3"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                    <Button type="submit" className="w-full h-12 bg-black hover:bg-gray-800 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg mt-2" disabled={createMaintenance.isPending}>
                                        {createMaintenance.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Initiate Protocol"}
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
                        { label: 'Total Tickets', value: stats.total, color: 'text-gray-900', icon: LayoutGrid },
                        { label: 'Pending Action', value: stats.pending, color: 'text-amber-600', icon: Clock },
                        { label: 'Resolved', value: stats.resolved, color: 'text-emerald-600', icon: CheckCircle2 },
                        { label: 'Critical Alert', value: stats.urgent, color: 'text-rose-600', icon: AlertTriangle },
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
                        filteredLogs.map((log) => (
                            <div key={log.id} className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${log.status === 'RESOLVED' ? 'bg-emerald-500' : log.priority === 'URGENT' ? 'bg-red-500' : log.priority === 'HIGH' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                                <div className="flex items-start gap-5">
                                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${log.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                        {log.status === 'RESOLVED' ? <CheckCircle2 className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-sm font-black text-gray-900">{log.title}</h3>
                                            <Badge variant="outline" className={`h-5 border-0 rounded-md text-[9px] font-black uppercase tracking-widest ${getPriorityColor(log.priority)}`}>
                                                {log.priority}
                                            </Badge>
                                        </div>
                                        <p className="text-xs font-medium text-gray-500 line-clamp-1">{log.description || "No technical details provided."}</p>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">{new Date(log.createdAt).toLocaleDateString()}</span>
                                            <span className="h-1 w-1 rounded-full bg-gray-200" />
                                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-6 pl-16 md:pl-0">
                                    <div className="flex flex-col items-end hidden md:flex">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Status Vector</span>
                                        <span className={`text-[10px] font-black uppercase mt-0.5 ${log.status === 'RESOLVED' ? 'text-emerald-600' : 'text-amber-600'}`}>{log.status}</span>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-gray-100 text-gray-400">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 rounded-xl p-2 border-gray-100 shadow-xl">
                                            <DropdownMenuItem className="rounded-lg text-xs font-bold p-2.5 cursor-pointer hover:bg-gray-50 mb-1" onClick={() => openUpdate(log)}>
                                                <Edit2 className="h-3.5 w-3.5 mr-2 text-gray-500" /> Update Status
                                            </DropdownMenuItem>
                                            {log.status !== 'RESOLVED' && (
                                                <DropdownMenuItem
                                                    className="rounded-lg text-xs font-bold p-2.5 cursor-pointer hover:bg-emerald-50 text-emerald-600"
                                                    onClick={() => updateMaintenance.mutate({ id: log.id, status: 'RESOLVED' })}
                                                >
                                                    <CheckCircle className="h-3.5 w-3.5 mr-2" /> Mark Resolved
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                            <Wrench className="h-8 w-8 text-gray-300 mb-3" />
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">System Optimal • No Active Tickets</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Architecture Bar */}
            <div className="fixed bottom-0 w-full z-40 px-6 pb-4 pointer-events-none left-0">
                <div className="max-w-[1600px] mx-auto bg-black/90 backdrop-blur-xl text-white h-12 rounded-2xl shadow-2xl flex items-center justify-between px-6 pointer-events-auto">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Wrench className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-[10px] font-black tracking-widest uppercase text-blue-400">Maintenance Ops</span>
                        </div>
                        <div className="h-3 w-px bg-white/20"></div>
                        <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${stats.urgent > 0 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                            <span className="text-[10px] font-black uppercase text-gray-300 tracking-widest">{stats.urgent > 0 ? 'CRITICAL ALERTS' : 'SYSTEM NOMINAL'}</span>
                        </div>
                    </div>
                    <span className="text-[10px] font-black tracking-widest uppercase text-gray-500 hidden sm:block">Node: ROOM-{roomData?.data?.roomNumber}</span>
                </div>
            </div>

            {/* RESOLUTION DIALOG - Updated Style */}
            <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
                <DialogContent className="sm:max-w-[400px] rounded-3xl p-0 overflow-hidden gap-0">
                    <div className="p-6 bg-gray-50 border-b border-gray-100">
                        <DialogTitle className="text-lg font-black tracking-tight">Status Update</DialogTitle>
                        <DialogDescription className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Modify ticket state</DialogDescription>
                    </div>
                    <form onSubmit={handleUpdate} className="p-6 space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Current State</Label>
                            <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                                <SelectTrigger className="h-10 rounded-xl font-bold text-xs uppercase">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Resolution Protocol</Label>
                            <Textarea
                                placeholder="Actions taken..."
                                className="min-h-[100px] rounded-xl font-medium text-sm resize-none pt-3"
                                value={formData.resolutionNotes}
                                onChange={(e) => setFormData({ ...formData, resolutionNotes: e.target.value })}
                            />
                        </div>
                        <Button type="submit" className="w-full h-12 bg-black hover:bg-gray-800 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg mt-2" disabled={updateMaintenance.isPending}>
                            {updateMaintenance.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Updates"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MaintenancePage;
