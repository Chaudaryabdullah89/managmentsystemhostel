"use client"
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
    DollarSign, Calendar, CheckCircle2, XCircle, AlertCircle,
    Clock, Search, Filter, Download, Eye, User, Building2,
    CreditCard, TrendingUp, Briefcase, Plus, ShieldCheck,
    PieChart, Wallet, History, FileText, Boxes, Scan,
    ArrowRight, Send, Loader2, ExternalLink, CheckCircle,
    Settings2, Trash2, Save, MoreVertical, ChevronRight,
    ArrowUpRight, UserCheck, Coins, Calculator, Zap,
    MessageSquare, Wallet2, Mail, Users, Star, MapPin, Activity, ClipboardList
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    useAllWardenSalaries, useGenerateWardenPayroll, usePayWarden,
    useDeleteWardenSalary, useUpdateWardenSalary
} from "@/hooks/useWardenSalaries";
import { useuserbyrole } from "@/hooks/useusers";
import { useHostel } from "@/hooks/usehostel";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import SalarySlip from "@/components/SalarySlip";
import Loader from "@/components/ui/Loader";

const WardenSalariesPage = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("current");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");
    const [filterHostel, setFilterHostel] = useState("All");
    const [isSlipDialogOpen, setIsSlipDialogOpen] = useState(false);

    const currentMonth = format(new Date(), 'MMMM yyyy');
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);

    // Mutation states
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isAddSalaryDialogOpen, setIsAddSalaryDialogOpen] = useState(false);
    const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
    const [isExportingSalaries, setIsExportingSalaries] = useState(false);
    const [selectedSalary, setSelectedSalary] = useState(null);

    const [resolveFormData, setResolveFormData] = useState({
        appealStatus: "RESOLVED",
        appealResponse: ""
    });

    const [addSalaryForm, setAddSalaryForm] = useState({
        wardenId: "",
        month: currentMonth,
        basicSalary: "",
        bonuses: "0",
        deductions: "0",
        notes: "",
        paymentMethod: "BANK_TRANSFER"
    });

    const { data: salaries, isLoading: salariesLoading } = useAllWardenSalaries({
        month: activeTab === "current" ? currentMonth : null
    });
    const { data: wardensData } = useuserbyrole('WARDEN');
    const wardens = wardensData?.users || [];
    const { data: hostelsData } = useHostel();
    const hostels = hostelsData?.data || [];

    const generatePayroll = useGenerateWardenPayroll();
    const payWarden = usePayWarden();
    const deleteSalary = useDeleteWardenSalary();
    const updateSalary = useUpdateWardenSalary();

    // Filtering Logic
    const filteredSalaries = useMemo(() => {
        const data = salaries || [];
        return data.filter(item => {
            const name = item.Warden?.name?.toLowerCase() || "";
            const email = item.Warden?.email?.toLowerCase() || "";
            const id = item.id?.toLowerCase() || "";
            const matchesSearch = !searchQuery ||
                name.includes(searchQuery.toLowerCase()) ||
                email.includes(searchQuery.toLowerCase()) ||
                id.includes(searchQuery.toLowerCase());

            const matchesHostel = filterHostel === "All" || item.Warden?.hostelId === filterHostel;
            const matchesStatus = filterStatus === "All" || item.status === filterStatus;

            return matchesSearch && matchesHostel && matchesStatus;
        });
    }, [salaries, searchQuery, filterHostel, filterStatus]);

    const stats = useMemo(() => {
        const data = salaries || [];
        const total = data.reduce((acc, curr) => acc + (curr.amount || 0), 0);
        const paidVolume = data.filter(s => s.status === 'PAID' || s.status === 'COMPLETED').reduce((acc, curr) => acc + (curr.amount || 0), 0);
        const pendingReserve = data.filter(s => s.status === 'PENDING').reduce((acc, curr) => acc + (curr.amount || 0), 0);
        const appealCount = data.filter(s => s.appealStatus === 'PENDING').length;
        return { total, paidVolume, pendingReserve, count: data.length, appealCount };
    }, [salaries]);

    const handleExportCSV = () => {
        const headers = ["ID", "Warden Name", "Month", "Basic Salary", "Bonuses", "Deductions", "Net Amount", "Status", "Method", "Date"];
        const rows = filteredSalaries.map(s => [
            s.id,
            s.Warden?.name,
            s.month,
            s.basicSalary,
            s.bonuses,
            s.deductions,
            s.amount,
            s.status,
            s.paymentMethod || 'N/A',
            s.paymentDate ? format(new Date(s.paymentDate), 'yyyy-MM-dd') : 'N/A'
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Warden_Payroll_${selectedMonth.replace(' ', '_')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Warden Payroll CSV Exported!");
    };

    const handleExportPDF = async () => {
        setIsExportingSalaries(true);
        try {
            const doc = new jsPDF('landscape');
            doc.setFont("helvetica", "bold");

            doc.setFillColor(31, 41, 55);
            doc.rect(0, 0, doc.internal.pageSize.width, 35, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.text("WARDEN PAYROLL REPORT", doc.internal.pageSize.width / 2, 18, { align: "center" });
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Month: ${selectedMonth} | Total Wardens: ${filteredSalaries.length}`, doc.internal.pageSize.width / 2, 26, { align: "center" });

            doc.setTextColor(80, 80, 80);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(`Generated On: ${format(new Date(), 'PPP p')}`, 14, 45);
            doc.text(`Total Amount: PKR ${stats.total.toLocaleString()}`, doc.internal.pageSize.width - 14, 45, { align: "right" });

            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.5);
            doc.line(14, 49, doc.internal.pageSize.width - 14, 49);

            const headers = [
                ["S.No", "Warden Name", "Month", "Basic", "Bonuses", "Deductions", "Net", "Status", "Date"]
            ];

            const rows = filteredSalaries.map((s, index) => [
                index + 1,
                s.Warden?.name || 'N/A',
                s.month,
                (s.basicSalary || 0).toLocaleString(),
                (s.bonuses || 0).toLocaleString(),
                (s.deductions || 0).toLocaleString(),
                (s.amount || 0).toLocaleString(),
                s.status,
                s.paymentDate ? format(new Date(s.paymentDate), 'dd/MM/yy') : 'N/A'
            ]);

            autoTable(doc, {
                startY: 55,
                head: headers,
                body: rows,
                theme: 'grid',
                headStyles: { fillColor: [31, 41, 55], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, halign: 'center' },
                bodyStyles: { fontSize: 8, textColor: [50, 50, 50] },
                alternateRowStyles: { fillColor: [249, 250, 251] },
                styles: { overflow: 'linebreak', cellPadding: 3, valign: 'middle' },
                didDrawPage: (data) => {
                    let str = "Page " + doc.internal.getNumberOfPages();
                    doc.setFontSize(8);
                    doc.setTextColor(150, 150, 150);
                    doc.text(str, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: "center" });
                    doc.text("Official GreenView Warden Records", 14, doc.internal.pageSize.height - 10);
                }
            });

            doc.save(`Warden_Payroll_${selectedMonth.replace(' ', '_')}.pdf`);
            toast.success("Warden Payroll PDF Exported!");
        } catch (error) {
            toast.error("Failed to export PDF");
        } finally {
            setIsExportingSalaries(false);
        }
    };

    const handleGeneratePayroll = async () => {
        try {
            await generatePayroll.mutateAsync({ month: currentMonth });
        } catch (err) { }
    };

    const handleAddSalary = async (e) => {
        e.preventDefault();
        try {
            await payWarden.mutateAsync({
                ...addSalaryForm,
                amount: Number(addSalaryForm.basicSalary) + Number(addSalaryForm.bonuses) - Number(addSalaryForm.deductions)
            });
            setIsAddSalaryDialogOpen(false);
            setAddSalaryForm({ wardenId: "", month: currentMonth, basicSalary: "", bonuses: "0", deductions: "0", notes: "", paymentMethod: "BANK_TRANSFER" });
        } catch (err) { }
    };

    const handleResolveAppeal = async () => {
        if (!selectedSalary) return;
        try {
            await updateSalary.mutateAsync({
                id: selectedSalary.id,
                ...resolveFormData
            });
            setIsResolveDialogOpen(false);
            setResolveFormData({ appealStatus: "RESOLVED", appealResponse: "" });
        } catch (err) { }
    };

    if (salariesLoading) return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 border-[3px] border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Loading Payroll...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight">
            {/* Header - Staff Management Style */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-1.5 bg-indigo-600 rounded-full" />
                        <div>
                            <h1 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Warden Payroll</h1>
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
                                <p className="text-sm font-bold text-amber-900">{stats.appealCount} payroll appeals need administrative resolution</p>
                                <p className="text-xs text-amber-700 font-medium mt-0.5">Appeals require immediate review for fiscal accuracy</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => setFilterStatus("PENDING")}
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
                                onClick={() => setActiveTab('history')}
                                className={`h-8 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'}`}
                            >
                                Ledger History
                            </Button>
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium">{filteredSalaries.length} records shown</p>
                    </div>

                    {filteredSalaries.length === 0 ? (
                        <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-3xl">
                            <Wallet className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                            <p className="text-sm font-bold text-gray-400">No payroll records found</p>
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
                                                    {salary.Warden?.name?.charAt(0) || "W"}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-sm font-bold text-gray-900">{salary.Warden?.name}</h3>
                                                        {salary.status === "PAID" && (
                                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">WARDEN STAFF</p>
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
                                            {salary.Warden?.Hostel_User_hostelIdToHostel?.name || "Global / Unassigned"}
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="px-6 py-4 grid grid-cols-3 gap-3">
                                        <div className="text-center">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Base</p>
                                            <p className="text-sm font-bold text-gray-900">{(salary.basicSalary || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="text-center border-x border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Bonus</p>
                                            <p className="text-sm font-bold text-emerald-600">{(salary.bonuses || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Ded.</p>
                                            <p className="text-sm font-bold text-rose-600">{(salary.deductions || 0).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {/* Efficiency Profile Bar (Payout Ratio) */}
                                    <div className="px-6 pb-4">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Net Disbursement</span>
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
                                        <Button
                                            className="flex-1 h-9 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-xl gap-1.5"
                                            onClick={() => {
                                                setSelectedSalary(salary);
                                                setIsSlipDialogOpen(true);
                                            }}
                                        >
                                            <Eye className="h-3.5 w-3.5" /> View Slip
                                        </Button>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-gray-200 hover:border-indigo-300 hover:bg-indigo-50">
                                                    <MoreVertical className="h-4 w-4 text-gray-400" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-52 rounded-2xl p-2 shadow-xl border-gray-100">
                                                {salary.appealStatus === 'PENDING' && (
                                                    <DropdownMenuItem onClick={() => { setSelectedSalary(salary); setIsResolveDialogOpen(true); }} className="p-3 rounded-xl gap-3 text-[10px] font-bold uppercase text-amber-600 hover:bg-amber-50 cursor-pointer">
                                                        <MessageSquare className="h-4 w-4" /> Resolve Appeal
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem className="p-3 rounded-xl gap-3 text-[10px] font-bold uppercase cursor-pointer">
                                                    <Settings2 className="h-4 w-4" /> Edit Record
                                                </DropdownMenuItem>
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
                </div>
            </div>

            {/* Slip Dialog */}
            <Dialog open={isSlipDialogOpen} onOpenChange={setIsSlipDialogOpen}>
                <DialogContent className="max-w-3xl p-0 bg-transparent border-none overflow-y-auto max-h-[95vh]">
                    {selectedSalary && (
                        <SalarySlip
                            salary={{
                                ...selectedSalary,
                                StaffProfile: {
                                    User: selectedSalary.Warden,
                                    designation: "Warden"
                                }
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Resolve Appeal Dialog */}
            <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
                    <div className="bg-gradient-to-br from-indigo-900 to-black p-8 text-white">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center">
                                <MessageSquare className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold uppercase tracking-tight">Appeal Resolution</h2>
                                <p className="text-[10px] text-indigo-300 font-medium">for {selectedSalary?.Warden?.name}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 space-y-5 bg-white">
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block mb-2">Original Appeal Note</Label>
                            <p className="text-xs font-bold text-gray-600 leading-relaxed italic">"{selectedSalary?.appealText || 'No description provided'}"</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Response Status</Label>
                                <Select value={resolveFormData.appealStatus} onValueChange={v => setResolveFormData({ ...resolveFormData, appealStatus: v })}>
                                    <SelectTrigger className="h-11 rounded-xl border-gray-100 bg-gray-50 font-bold text-xs focus:ring-0">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                                        <SelectItem value="RESOLVED" className="text-xs font-bold uppercase text-emerald-600">Resolved</SelectItem>
                                        <SelectItem value="REJECTED" className="text-xs font-bold uppercase text-rose-600">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Resolution Memo</Label>
                                <Textarea
                                    className="rounded-2xl border-gray-100 bg-gray-50 font-medium text-xs min-h-[120px] resize-none"
                                    placeholder="Enter details about the resolution..."
                                    value={resolveFormData.appealResponse}
                                    onChange={e => setResolveFormData({ ...resolveFormData, appealResponse: e.target.value })}
                                />
                            </div>
                        </div>

                        <Button
                            onClick={handleResolveAppeal}
                            disabled={updateSalary.isPending}
                            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-[0.98]"
                        >
                            {updateSalary.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Finalize Resolution"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Manual Add Record Dialog */}
            <Dialog open={isAddSalaryDialogOpen} onOpenChange={setIsAddSalaryDialogOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white">
                    <div className="bg-emerald-600 p-8 text-white text-center">
                        <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/10">
                            <Wallet2 className="h-6 w-6" />
                        </div>
                        <h2 className="text-xl font-bold uppercase tracking-tight">Manual Ingress</h2>
                        <p className="text-[9px] text-white/70 font-bold tracking-widest mt-1 uppercase">Initialize manual salary record</p>
                    </div>
                    <form onSubmit={handleAddSalary} className="p-8 space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Target Warden</Label>
                            <Select value={addSalaryForm.wardenId} onValueChange={(v) => {
                                const w = wardens.find(u => u.id === v);
                                setAddSalaryForm({ ...addSalaryForm, wardenId: v, basicSalary: w?.basicSalary || "" });
                            }}>
                                <SelectTrigger className="h-11 rounded-xl border-gray-100 bg-gray-50 font-bold text-xs">
                                    <SelectValue placeholder="Select Warden" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    {wardens.map(w => (
                                        <SelectItem key={w.id} value={w.id} className="text-xs font-bold">{w.name} — {w.email}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Base Salary</Label>
                                <Input type="number" required value={addSalaryForm.basicSalary} onChange={e => setAddSalaryForm({ ...addSalaryForm, basicSalary: e.target.value })} className="h-11 rounded-xl border-gray-100 bg-gray-50 font-bold" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Cycle Month</Label>
                                <Input required value={addSalaryForm.month} onChange={e => setAddSalaryForm({ ...addSalaryForm, month: e.target.value })} className="h-11 rounded-xl border-gray-100 bg-gray-50 font-bold" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Bonuses</Label>
                                <Input type="number" value={addSalaryForm.bonuses} onChange={e => setAddSalaryForm({ ...addSalaryForm, bonuses: e.target.value })} className="h-11 rounded-xl border-emerald-50 bg-emerald-50/30 text-emerald-600 font-bold" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[9px] font-black uppercase tracking-widest text-rose-500">Deductions</Label>
                                <Input type="number" value={addSalaryForm.deductions} onChange={e => setAddSalaryForm({ ...addSalaryForm, deductions: e.target.value })} className="h-11 rounded-xl border-rose-50 bg-rose-50/30 text-rose-600 font-bold" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Method</Label>
                            <Select value={addSalaryForm.paymentMethod} onValueChange={v => setAddSalaryForm({ ...addSalaryForm, paymentMethod: v })}>
                                <SelectTrigger className="h-11 rounded-xl border-gray-100 bg-gray-50 font-bold text-[10px] uppercase">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    <SelectItem value="BANK_TRANSFER" className="text-[10px] font-bold uppercase tracking-widest">Bank Transfer</SelectItem>
                                    <SelectItem value="CASH" className="text-[10px] font-bold uppercase tracking-widest">Cash</SelectItem>
                                    <SelectItem value="ONLINE" className="text-[10px] font-bold uppercase tracking-widest">Online</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button disabled={payWarden.isPending} type="submit" className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg mt-2">
                            {payWarden.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Initiate Settlement"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Alert */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl p-10 max-w-sm text-center">
                    <div className="h-16 w-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Trash2 className="h-8 w-8 text-rose-500" />
                    </div>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black uppercase text-gray-900 tracking-tight">Evict Record?</AlertDialogTitle>
                        <AlertDialogDescription className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed mt-2">
                            This will permanently remove the disbursement entry from the ledger. This action is IRREVERSIBLE.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 mt-8">
                        <AlertDialogCancel className="h-12 w-full rounded-2xl bg-gray-50 border-none font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-colors">Abort</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteSalary.mutate(selectedSalary.id)}
                            className="h-12 w-full rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-200"
                        >
                            Confirm Eviction
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default WardenSalariesPage;
