"use client"
import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import {
    DollarSign, Calendar, CheckCircle2, AlertCircle,
    Search, Filter, Download, Eye, Building2,
    CreditCard, TrendingUp, Briefcase, Plus, ShieldCheck,
    Wallet, History, FileText, Boxes,
    ArrowUpRight, Loader2, Calculator, Zap,
    MessageSquare, MoreVertical, Settings2, Trash2,
    Coins, MoreHorizontal, ChevronRight, UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
    Dialog, DialogContent,
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    useAllSalaries, useGeneratePayroll, useUpdateSalary,
    useDeleteSalary, useStaffList, useCreateSalary
} from "@/hooks/useSalaries";
import { useHostel } from "@/hooks/usehostel";
import useAuthStore from "@/hooks/Authstate";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import SalarySlip from "@/components/SalarySlip";
import Loader from "@/components/ui/Loader";

const WardenSalariesPage = () => {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState("current");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");
    const [filterHostel, setFilterHostel] = useState("All");

    const currentMonth = format(new Date(), 'MMMM yyyy');
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);

    // Mutation & Dialog states
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
    const [isAddSalaryDialogOpen, setIsAddSalaryDialogOpen] = useState(false);
    const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
    const [isSlipDialogOpen, setIsSlipDialogOpen] = useState(false);
    const [selectedSalary, setSelectedSalary] = useState(null);

    const [resolveFormData, setResolveFormData] = useState({
        appealStatus: "RESOLVED",
        appealResponse: ""
    });

    const [addSalaryForm, setAddSalaryForm] = useState({
        staffId: "",
        month: currentMonth,
        customBonuses: 0,
        customDeductions: 0,
        customNotes: ""
    });

    const [editFormData, setEditFormData] = useState({
        basicSalary: 0,
        allowances: 0,
        bonuses: 0,
        deductions: 0,
        notes: ""
    });

    const [payFormData, setPayFormData] = useState({
        paymentMethod: "BANK_TRANSFER",
        paymentDate: format(new Date(), 'yyyy-MM-dd'),
        notes: ""
    });

    // Queries
    const { data: salaries, isLoading: salariesLoading } = useAllSalaries({
        month: activeTab === "current" ? currentMonth : null,
        hostelId: user?.role === 'ADMIN' ? (filterHostel === 'All' ? null : filterHostel) : user?.hostelId
    });

    const { data: staffList } = useStaffList(user?.hostelId);
    const { data: hostelsData } = useHostel();
    const hostels = hostelsData?.data || [];

    const generatePayroll = useGeneratePayroll();
    const createSalary = useCreateSalary();
    const updateSalary = useUpdateSalary();
    const deleteSalary = useDeleteSalary();

    // Filtering Logic
    const filteredSalaries = useMemo(() => {
        const data = salaries || [];
        return data.filter(item => {
            const matchesSearch = !searchQuery ||
                item.StaffProfile?.User?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.id.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = filterStatus === "All" || item.status === filterStatus;
            const matchesHostel = filterHostel === "All" || item.StaffProfile?.User?.hostelId === filterHostel;

            return matchesSearch && matchesStatus && matchesHostel;
        });
    }, [salaries, searchQuery, filterStatus, filterHostel]);

    // Derived stats
    const stats = useMemo(() => {
        const data = filteredSalaries || [];
        const total = data.reduce((acc, curr) => acc + (curr.amount || 0), 0);
        const paidVolume = data.filter(s => s.status === 'PAID').reduce((acc, curr) => acc + (curr.amount || 0), 0);
        const appealCount = data.filter(s => s.appealStatus === 'PENDING').length;
        return { total, paidVolume, appealCount, count: data.length };
    }, [filteredSalaries]);

    const handleGeneratePayroll = async () => {
        try {
            await generatePayroll.mutateAsync({
                month: currentMonth,
                hostelId: user?.hostelId
            });
            toast.success("Payroll generation initiated");
        } catch (error) { }
    };

    const handlePayOpen = (salary) => {
        setSelectedSalary(salary);
        setIsPayDialogOpen(true);
    };

    const handleEditOpen = (salary) => {
        setSelectedSalary(salary);
        setEditFormData({
            basicSalary: salary.basicSalary,
            allowances: salary.allowances,
            bonuses: salary.bonuses,
            deductions: salary.deductions,
            notes: salary.notes || ""
        });
        setIsEditDialogOpen(true);
    };

    const handlePaySubmit = async () => {
        try {
            await updateSalary.mutateAsync({
                id: selectedSalary.id,
                status: 'PAID',
                ...payFormData,
                paymentDate: new Date(payFormData.paymentDate).toISOString()
            });
            setIsPayDialogOpen(false);
            toast.success("Payment confirmed successfully");
        } catch (error) { }
    };

    const handleEditSubmit = async () => {
        try {
            await updateSalary.mutateAsync({
                id: selectedSalary.id,
                ...editFormData
            });
            setIsEditDialogOpen(false);
            toast.success("Record updated");
        } catch (error) { }
    };

    const handleAddSalarySubmit = async () => {
        try {
            await createSalary.mutateAsync(addSalaryForm);
            setIsAddSalaryDialogOpen(false);
            setAddSalaryForm({
                staffId: "",
                month: currentMonth,
                customBonuses: 0,
                customDeductions: 0,
                customNotes: ""
            });
            toast.success("Manual entry authorized");
        } catch (error) { }
    };

    const handleResolveSubmit = async () => {
        try {
            await updateSalary.mutateAsync({
                id: selectedSalary.id,
                ...resolveFormData
            });
            setIsResolveDialogOpen(false);
            setResolveFormData({ appealStatus: "RESOLVED", appealResponse: "" });
            toast.success("Dispute resolved successfully");
        } catch (error) { }
    };

    const handleExportPDF = async () => {
        try {
            const doc = new jsPDF('landscape');
            doc.setFont("helvetica", "bold");
            doc.setFillColor(31, 41, 55);
            doc.rect(0, 0, doc.internal.pageSize.width, 35, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.text("STAFF PAYROLL REPORT", doc.internal.pageSize.width / 2, 18, { align: "center" });

            const rows = filteredSalaries.map((s, i) => [
                i + 1,
                s.StaffProfile?.User?.name || 'N/A',
                s.month,
                s.basicSalary.toLocaleString(),
                s.amount.toLocaleString(),
                s.status
            ]);

            autoTable(doc, {
                startY: 45,
                head: [["S.No", "Staff Name", "Month", "Basic", "Net", "Status"]],
                body: rows,
                theme: 'grid'
            });

            doc.save(`Payroll_${selectedMonth}.pdf`);
            toast.success("PDF Exported");
        } catch (error) {
            toast.error("Export failed");
        }
    };

    const handleExportCSV = () => {
        const headers = ["Staff Name,Month,Basic Salary,Net Pay,Status"];
        const rows = filteredSalaries.map(s =>
            `"${s.StaffProfile?.User?.name}","${s.month}",${s.basicSalary},${s.amount},"${s.status}"`
        );
        const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Payroll_${selectedMonth}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("CSV Exported");
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteSalary.mutateAsync(selectedSalary.id);
            setIsDeleteDialogOpen(false);
            toast.success("Record deleted");
        } catch (error) { }
    };

    if (salariesLoading) return (
        <Loader label="Syncing Ledger" subLabel="Fetching latest payroll records" icon={History} fullScreen={true} />
    );

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight print:hidden">
            {/* Header - Staff Management Style */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-1.5 bg-indigo-600 rounded-full" />
                        <div>
                            <h1 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Staff Payroll</h1>
                            <p className="text-[10px] text-gray-400 font-medium">{filteredSalaries.length} distribution records</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <Input
                                placeholder="Search namesake or ID..."
                                className="h-9 pl-9 w-[220px] rounded-xl border-gray-200 bg-gray-50 text-xs font-medium"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value={filterHostel} onValueChange={setFilterHostel}>
                            <SelectTrigger className="h-9 w-[160px] rounded-xl border-gray-200 bg-white text-[10px] font-bold uppercase tracking-wider">
                                <SelectValue placeholder="All Hostels" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-gray-100 shadow-xl">
                                <SelectItem value="All" className="text-[10px] font-bold uppercase">All Hostels</SelectItem>
                                {hostels.map(h => (
                                    <SelectItem key={h.id} value={h.id} className="text-[10px] font-bold uppercase">{h.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-gray-200 bg-white">
                                    <MoreVertical className="h-4 w-4 text-gray-400" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-xl border-gray-100 p-2">
                                <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-gray-400 p-3">Payroll Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={handleGeneratePayroll} className="p-3 rounded-xl gap-3 text-[10px] font-bold uppercase cursor-pointer">
                                    <Calculator className="h-4 w-4 text-indigo-600" /> Auto Generate
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsAddSalaryDialogOpen(true)} className="p-3 rounded-xl gap-3 text-[10px] font-bold uppercase cursor-pointer">
                                    <Plus className="h-4 w-4 text-emerald-600" /> Manual Record
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleExportPDF} className="p-3 rounded-xl gap-3 text-[10px] font-bold uppercase cursor-pointer text-rose-600">
                                    <FileText className="h-4 w-4" /> Export as PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleExportCSV} className="p-3 rounded-xl gap-3 text-[10px] font-bold uppercase cursor-pointer text-emerald-600">
                                    <Boxes className="h-4 w-4" /> Export as CSV
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Overview Stats - Staff Management Card Style */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: "Gross Payroll", value: `PKR ${(stats.total / 1000).toFixed(1)}k`, icon: Wallet, color: "text-gray-700", bg: "bg-white", iconBg: "bg-gray-100" },
                        { label: "Paid Volume", value: `PKR ${(stats.paidVolume / 1000).toFixed(1)}k`, icon: CheckCircle2, color: "text-indigo-600", bg: "bg-indigo-50", iconBg: "bg-indigo-100" },
                        { label: "Appeals Pending", value: stats.appealCount, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50", iconBg: "bg-amber-100" },
                        { label: "Active Cycles", value: stats.count, icon: Calendar, color: "text-emerald-600", bg: "bg-emerald-50", iconBg: "bg-emerald-100" },
                    ].map((stat, i) => (
                        <div key={i} className={`${stat.bg} border border-gray-100 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all`}>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                            </div>
                            <div className={`h-12 w-12 ${stat.iconBg} rounded-2xl flex items-center justify-center`}>
                                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pending Appeals Alert */}
                {stats.appealCount > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <MessageSquare className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-amber-900">{stats.appealCount} payroll appeals need staff resolution</p>
                                <p className="text-xs text-amber-700 font-medium mt-0.5">Staff members have reported discrepancies in their payouts</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => { setActiveTab("appeals"); }}
                            className="h-9 px-4 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold rounded-xl gap-2 flex-shrink-0"
                        >
                            Review Appeals <ArrowUpRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                )}

                {/* Ledger Grid */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3 p-1.5 bg-white border border-gray-100 rounded-2xl shadow-sm">
                            <Button
                                variant="ghost"
                                onClick={() => setActiveTab('current')}
                                className={`h-8 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'current' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'}`}
                            >
                                Active Cycle
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setActiveTab('appeals')}
                                className={`h-8 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'appeals' ? 'bg-rose-600 text-white shadow-lg' : 'text-gray-400 hover:text-rose-600'}`}
                            >
                                Appeals Desk
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setActiveTab('history')}
                                className={`h-8 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'}`}
                            >
                                History Ledger
                            </Button>
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium">{filteredSalaries.length} records shown</p>
                    </div>

                    <Tabs value={activeTab} className="mt-0 space-y-0">
                        <TabsContent value="current" className="mt-0">
                            {filteredSalaries.length === 0 ? (
                                <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-3xl">
                                    <Wallet className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                                    <p className="text-sm font-bold text-gray-400">No payroll records for this cycle</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                    {filteredSalaries.map(salary => (
                                        <div key={salary.id} className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
                                            {/* Card Header */}
                                            <div className="p-6 border-b border-gray-50">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg shadow-indigo-200">
                                                            {salary.StaffProfile?.User?.name?.charAt(0) || "S"}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="text-sm font-bold text-gray-900">{salary.StaffProfile?.User?.name}</h3>
                                                                {salary.status === "PAID" && (
                                                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                                )}
                                                            </div>
                                                            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{salary.StaffProfile?.designation}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <p className="text-[9px] text-gray-400 font-medium uppercase">{salary.month}</p>
                                                                <div className="h-1 w-1 rounded-full bg-gray-200" />
                                                                <div className="flex items-center gap-0.5">
                                                                    <CreditCard className="h-2.5 w-2.5 text-gray-400" />
                                                                    <span className="text-[9px] font-bold text-gray-600">{salary.paymentMethod?.replace('_', ' ') || "PENDING"}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Badge className={`${salary.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'} text-[8px] font-black uppercase border`}>
                                                        {salary.status}
                                                    </Badge>
                                                </div>

                                                <div className="flex items-center gap-1.5 mt-3 text-[10px] text-gray-400 font-medium">
                                                    <Building2 className="h-3 w-3" />
                                                    {salary.StaffProfile?.User?.Hostel_User_hostelIdToHostel?.name || "Global / Unassigned"}
                                                </div>
                                            </div>

                                            {/* Stats Grid */}
                                            <div className="px-6 py-4 grid grid-cols-3 gap-3">
                                                <div className="text-center">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Basic</p>
                                                    <p className="text-sm font-bold text-gray-900">{(salary.basicSalary || 0).toLocaleString()}</p>
                                                </div>
                                                <div className="text-center border-x border-gray-100">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Adjust.</p>
                                                    <p className="text-sm font-bold text-emerald-600">{(salary.bonuses || 0).toLocaleString()}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Net Pay</p>
                                                    <p className="text-sm font-bold text-gray-900">{(salary.amount || 0).toLocaleString()}</p>
                                                </div>
                                            </div>

                                            {/* Payout Bar */}
                                            <div className="px-6 pb-4">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Disbursement Progress</span>
                                                    <span className="text-[10px] font-bold text-gray-900 tracking-tight">PKR {(salary.amount || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-700"
                                                        style={{ width: `${Math.min(((salary.amount || 0) / (salary.basicSalary || 1)) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="px-6 pb-6 flex items-center gap-2">
                                                {salary.status === 'PENDING' ? (
                                                    <Button
                                                        className="flex-1 h-9 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-xl gap-1.5 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                                                        onClick={() => handlePayOpen(salary)}
                                                    >
                                                        <Coins className="h-3.5 w-3.5" /> Pay Staff
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        className="flex-1 h-9 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 text-[10px] font-bold rounded-xl gap-1.5 transition-all"
                                                        onClick={() => {
                                                            setSelectedSalary(salary);
                                                            setIsSlipDialogOpen(true);
                                                        }}
                                                    >
                                                        <Eye className="h-3.5 w-3.5" /> View Slip
                                                    </Button>
                                                )}

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-gray-200 hover:border-indigo-300 hover:bg-indigo-50">
                                                            <MoreVertical className="h-4 w-4 text-gray-400" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-52 rounded-2xl p-2 shadow-xl border-gray-100">
                                                        <DropdownMenuItem onClick={() => { setSelectedSalary(salary); setIsSlipDialogOpen(true); }} className="p-3 rounded-xl gap-3 text-[10px] font-bold uppercase cursor-pointer">
                                                            <FileText className="h-4 w-4" /> Complete Slip
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleEditOpen(salary)} className="p-3 rounded-xl gap-3 text-[10px] font-bold uppercase cursor-pointer">
                                                            <Settings2 className="h-4 w-4" /> Adjust Ledger
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => { setSelectedSalary(salary); setIsDeleteDialogOpen(true); }} className="p-3 rounded-xl gap-3 text-[10px] font-bold uppercase text-rose-600 hover:bg-rose-50 cursor-pointer">
                                                            <Trash2 className="h-4 w-4" /> Evict Record
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="appeals" className="mt-0">
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                                {salaries?.filter(s => s.appealStatus && s.appealStatus !== 'NONE').length === 0 ? (
                                    <div className="col-span-full py-20 bg-white border border-dashed border-gray-200 rounded-3xl text-center">
                                        <MessageSquare className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                                        <p className="text-sm font-bold text-gray-400">No active staff appeals</p>
                                    </div>
                                ) : (
                                    salaries?.filter(s => s.appealStatus && s.appealStatus !== 'NONE').map(salary => (
                                        <div key={salary.id} className="bg-white border-2 border-rose-50 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                                            <div className="p-6 bg-rose-50/30 border-b border-rose-50">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 bg-rose-100 rounded-xl flex items-center justify-center">
                                                            <AlertCircle className="h-5 w-5 text-rose-600" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-bold text-gray-900">{salary.StaffProfile?.User?.name}</h4>
                                                            <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Discrepancy Reported</p>
                                                        </div>
                                                    </div>
                                                    <Badge className="bg-rose-600 text-white border-none text-[8px] font-black uppercase px-2.5 py-1">
                                                        {salary.appealStatus}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="p-6 space-y-4">
                                                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Staff Message</p>
                                                    <p className="text-xs font-bold text-gray-700 italic">"{salary.appealText || "No context provided."}"</p>
                                                </div>
                                                {salary.appealResponse && (
                                                    <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                                                        <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-2">Admin Resolution</p>
                                                        <p className="text-xs font-bold text-emerald-900">{salary.appealResponse}</p>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-3 pt-2">
                                                    <Button
                                                        variant="outline"
                                                        className="flex-1 h-10 rounded-xl border-gray-200 text-[10px] font-bold uppercase"
                                                        onClick={() => { setSelectedSalary(salary); setIsSlipDialogOpen(true); }}
                                                    >
                                                        <Eye className="h-3.5 w-3.5 mr-2" /> View Slip
                                                    </Button>
                                                    {salary.appealStatus === 'PENDING' && (
                                                        <Button
                                                            className="flex-1 h-10 bg-gray-900 hover:bg-black text-white rounded-xl text-[10px] font-bold uppercase gap-2"
                                                            onClick={() => { setSelectedSalary(salary); setIsResolveDialogOpen(true); }}
                                                        >
                                                            <Settings2 className="h-3.5 w-3.5" /> Resolve Appeal
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="history" className="mt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                {filteredSalaries.filter(s => s.month !== currentMonth).length === 0 ? (
                                    <div className="col-span-full py-20 bg-white border border-dashed border-gray-200 rounded-3xl text-center">
                                        <History className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                                        <p className="text-sm font-bold text-gray-400">No historical traces</p>
                                    </div>
                                ) : (
                                    filteredSalaries.filter(s => s.month !== currentMonth).map(salary => (
                                        <div key={salary.id} className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group opacity-75 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                                            {/* Card Header */}
                                            <div className="p-6 border-b border-gray-50">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-12 w-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-500 font-bold text-lg flex-shrink-0">
                                                            {salary.StaffProfile?.User?.name?.charAt(0) || "S"}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-sm font-bold text-gray-900">{salary.StaffProfile?.User?.name}</h3>
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{salary.StaffProfile?.designation}</p>
                                                            <p className="text-[9px] text-gray-400 font-medium uppercase mt-0.5">{salary.month}</p>
                                                        </div>
                                                    </div>
                                                    <Badge className="bg-gray-50 text-gray-600 border-gray-200 text-[8px] font-black uppercase border">
                                                        ARCHIVED
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="px-6 py-4 flex items-center justify-between">
                                                <div>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Final Net</p>
                                                    <p className="text-sm font-black text-gray-900 tabular-nums">PKR {(salary.amount || 0).toLocaleString()}</p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-9 w-9 rounded-xl"
                                                    onClick={() => { setSelectedSalary(salary); setIsSlipDialogOpen(true); }}
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Global Dialogs */}
            <WardenDialogs
                {...{
                    selectedSalary, isEditDialogOpen, setIsEditDialogOpen, isPayDialogOpen, setIsPayDialogOpen,
                    isAddSalaryDialogOpen, setIsAddSalaryDialogOpen, isResolveDialogOpen, setIsResolveDialogOpen,
                    isDeleteDialogOpen, setIsDeleteDialogOpen, isSlipDialogOpen, setIsSlipDialogOpen,
                    editFormData, setEditFormData, payFormData, setPayFormData, addSalaryForm, setAddSalaryForm,
                    resolveFormData, setResolveFormData, handleEditSubmit, handlePaySubmit, handleAddSalarySubmit,
                    handleResolveSubmit, handleDeleteConfirm, staffList, updatePending: updateSalary.isPending, createPending: createSalary.isPending
                }}
            />
        </div>
    );
};

// --- Sub Components ---

const WardenDialogs = ({
    selectedSalary, isEditDialogOpen, setIsEditDialogOpen, isPayDialogOpen, setIsPayDialogOpen,
    isAddSalaryDialogOpen, setIsAddSalaryDialogOpen, isResolveDialogOpen, setIsResolveDialogOpen,
    isDeleteDialogOpen, setIsDeleteDialogOpen, isSlipDialogOpen, setIsSlipDialogOpen,
    editFormData, setEditFormData, payFormData, setPayFormData, addSalaryForm, setAddSalaryForm,
    resolveFormData, setResolveFormData, handleEditSubmit, handlePaySubmit, handleAddSalarySubmit,
    handleResolveSubmit, handleDeleteConfirm, staffList, updatePending, createPending
}) => (
    <>
        <Dialog open={isSlipDialogOpen} onOpenChange={setIsSlipDialogOpen}>
            <DialogContent className="max-w-4xl p-0 bg-transparent border-none overflow-y-auto max-h-[90vh]">
                {selectedSalary && <SalarySlip salary={selectedSalary} />}
            </DialogContent>
        </Dialog>

        {/* Adjust Entry */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white">
                <div className="bg-indigo-600 p-8 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/10 skew-x-12 translate-x-20" />
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                            <Calculator className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold uppercase tracking-tight">Adjust Ledger</h2>
                            <p className="text-[10px] text-indigo-100 font-medium">for {selectedSalary?.StaffProfile?.User?.name}</p>
                        </div>
                    </div>
                </div>
                <div className="p-8 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Basic Salary</Label>
                            <Input type="number" value={editFormData.basicSalary} onChange={e => setEditFormData({ ...editFormData, basicSalary: Number(e.target.value) })} className="rounded-xl border-gray-100 bg-gray-50 font-bold h-11 focus:ring-0" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Allowances</Label>
                            <Input type="number" value={editFormData.allowances} onChange={e => setEditFormData({ ...editFormData, allowances: Number(e.target.value) })} className="rounded-xl border-gray-100 bg-gray-50 font-bold h-11 focus:ring-0" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-emerald-500">Bonuses</Label>
                            <Input type="number" value={editFormData.bonuses} onChange={e => setEditFormData({ ...editFormData, bonuses: Number(e.target.value) })} className="rounded-xl border-emerald-50 bg-emerald-50/30 font-bold h-11 text-emerald-600 focus:ring-0" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-rose-500">Deductions</Label>
                            <Input type="number" value={editFormData.deductions} onChange={e => setEditFormData({ ...editFormData, deductions: Number(e.target.value) })} className="rounded-xl border-rose-50 bg-rose-50/30 font-bold h-11 text-rose-600 focus:ring-0" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Adjustment Memo</Label>
                        <Textarea value={editFormData.notes} onChange={e => setEditFormData({ ...editFormData, notes: e.target.value })} className="rounded-xl border-gray-100 bg-gray-50 font-medium text-xs resize-none h-24 focus:ring-0" placeholder="Specify reason for adjustments..." />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button variant="outline" className="flex-1 rounded-xl h-11 font-bold text-[10px] uppercase tracking-widest border-gray-100" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button className="flex-1 h-11 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-100" onClick={handleEditSubmit} disabled={updatePending}>
                            {updatePending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Adjustment'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        {/* Pay Confirm */}
        <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
            <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white">
                <div className="bg-emerald-600 p-8 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/10 skew-x-12 translate-x-20" />
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                            <ShieldCheck className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold uppercase tracking-tight">Pay Authorization</h2>
                            <p className="text-[10px] text-emerald-100 font-medium">for {selectedSalary?.StaffProfile?.User?.name}</p>
                        </div>
                    </div>
                </div>
                <div className="p-8 space-y-5">
                    <div className="space-y-2">
                        <Label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Payment Method</Label>
                        <Select value={payFormData.paymentMethod} onValueChange={v => setPayFormData({ ...payFormData, paymentMethod: v })}>
                            <SelectTrigger className="h-11 rounded-xl border-gray-100 bg-gray-50 font-bold text-[10px] uppercase focus:ring-0">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                                <SelectItem value="BANK_TRANSFER" className="text-[10px] font-bold uppercase tracking-widest">Bank Transfer</SelectItem>
                                <SelectItem value="CASH" className="text-[10px] font-bold uppercase tracking-widest">Cash</SelectItem>
                                <SelectItem value="ONLINE" className="text-[10px] font-bold uppercase tracking-widest">Online Transfer</SelectItem>
                                <SelectItem value="CHEQUE" className="text-[10px] font-bold uppercase tracking-widest">Cheque</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Authorization Date</Label>
                        <Input type="date" value={payFormData.paymentDate} onChange={e => setPayFormData({ ...payFormData, paymentDate: e.target.value })} className="rounded-xl border-gray-100 bg-gray-50 font-bold h-11 focus:ring-0" />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button variant="outline" className="flex-1 rounded-xl h-11 font-bold text-[10px] uppercase tracking-widest border-gray-100" onClick={() => setIsPayDialogOpen(false)}>Cancel</Button>
                        <Button className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-100" onClick={handlePaySubmit} disabled={updatePending}>
                            {updatePending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Payment'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        {/* Manual Record */}
        <Dialog open={isAddSalaryDialogOpen} onOpenChange={setIsAddSalaryDialogOpen}>
            <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white">
                <div className="bg-gray-900 p-8 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/5 skew-x-12 translate-x-20" />
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                            <Plus className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold uppercase tracking-tight">Manual Ingress</h2>
                            <p className="text-[10px] text-gray-400 font-medium">Authorize specific staff ledger entry</p>
                        </div>
                    </div>
                </div>
                <div className="p-8 space-y-5">
                    <div className="space-y-2">
                        <Label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Target Personnel</Label>
                        <Select value={addSalaryForm.staffId} onValueChange={v => setAddSalaryForm({ ...addSalaryForm, staffId: v })}>
                            <SelectTrigger className="h-11 rounded-xl border-gray-100 bg-gray-50 font-bold text-xs focus:ring-0">
                                <SelectValue placeholder="Choose staff member..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-gray-100 shadow-2xl max-h-[300px]">
                                {staffList?.map(s => (
                                    <SelectItem key={s.id} value={s.id} className="text-xs font-bold">{s.User?.name} — {s.designation}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-emerald-500">Bonus Component</Label>
                            <Input type="number" value={addSalaryForm.customBonuses} onChange={e => setAddSalaryForm({ ...addSalaryForm, customBonuses: Number(e.target.value) })} className="rounded-xl border-emerald-50 bg-emerald-50/30 font-bold h-11 text-emerald-600" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-rose-500">Deduction Component</Label>
                            <Input type="number" value={addSalaryForm.customDeductions} onChange={e => setAddSalaryForm({ ...addSalaryForm, customDeductions: Number(e.target.value) })} className="rounded-xl border-rose-50 bg-rose-50/30 font-bold h-11 text-rose-600" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Fiscal Memo</Label>
                        <Textarea value={addSalaryForm.customNotes} onChange={e => setAddSalaryForm({ ...addSalaryForm, customNotes: e.target.value })} className="rounded-xl border-gray-100 bg-gray-50 font-medium text-xs resize-none h-24 focus:ring-0" placeholder="Add relevant notes for this entry..." />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button variant="outline" className="flex-1 rounded-xl h-11 font-bold text-[10px] uppercase tracking-widest border-gray-100" onClick={() => setIsAddSalaryDialogOpen(false)}>Cancel</Button>
                        <Button className="flex-1 h-11 bg-gray-900 hover:bg-black text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-xl" onClick={handleAddSalarySubmit} disabled={createPending}>
                            {createPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Authorize Entry'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        {/* Resolve Dispute */}
        <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
            <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white">
                <div className="bg-rose-600 p-8 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/10 skew-x-12 translate-x-20" />
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                            <MessageSquare className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold uppercase tracking-tight">Appeal Resolution</h2>
                            <p className="text-[10px] text-rose-100 font-medium">for {selectedSalary?.StaffProfile?.User?.name}</p>
                        </div>
                    </div>
                </div>
                <div className="p-8 space-y-5">
                    <div className="space-y-2">
                        <Label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Fiscal Status</Label>
                        <Select value={resolveFormData.appealStatus} onValueChange={v => setResolveFormData({ ...resolveFormData, appealStatus: v })}>
                            <SelectTrigger className="h-11 rounded-xl border-gray-100 bg-gray-50 font-bold text-[10px] uppercase focus:ring-0">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                                <SelectItem value="RESOLVED" className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Resolved</SelectItem>
                                <SelectItem value="REJECTED" className="text-[10px] font-bold uppercase tracking-widest text-rose-600">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Administrative Response</Label>
                        <Textarea value={resolveFormData.appealResponse} onChange={e => setResolveFormData({ ...resolveFormData, appealResponse: e.target.value })} className="rounded-xl border-gray-100 bg-gray-50 font-medium text-xs resize-none h-32 focus:ring-0" placeholder="Enter details about the resolution..." />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button variant="outline" className="flex-1 rounded-xl h-11 font-bold text-[10px] uppercase tracking-widest border-gray-100" onClick={() => setIsResolveDialogOpen(false)}>Cancel</Button>
                        <Button className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-rose-100" onClick={handleResolveSubmit} disabled={updatePending}>
                            {updatePending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Finalize Resolution'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        {/* Delete Record */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent className="rounded-3xl border-none shadow-2xl p-8 max-w-sm text-center">
                <div className="h-16 w-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Trash2 className="h-8 w-8 text-rose-600" />
                </div>
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-bold uppercase tracking-tight">Evict Ledger Entry?</AlertDialogTitle>
                    <AlertDialogDescription className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed mt-2">
                        This operation will permanently remove the salary record from the system. This is irreversible.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 mt-8">
                    <AlertDialogCancel className="h-11 w-full rounded-xl bg-gray-50 border-none font-bold text-[10px] uppercase tracking-widest">Abort</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteConfirm} className="h-11 w-full rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-rose-100">Confirm Eviction</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
);

export default WardenSalariesPage;
