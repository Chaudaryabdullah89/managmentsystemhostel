"use client"
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    DollarSign,
    Calendar,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Clock,
    Search,
    Filter,
    Download,
    Eye,
    User,
    Building2,
    CreditCard,
    TrendingUp,
    Briefcase,
    Plus,
    ShieldCheck,
    PieChart,
    Wallet,
    History,
    FileText,
    Boxes,
    Scan,
    ArrowRight,
    Send,
    Loader2,
    ExternalLink,
    CheckCircle,
    Settings2,
    Trash2,
    Save,
    MoreVertical,
    ChevronRight,
    ArrowUpRight,
    UserCheck,
    Coins,
    Calculator,
    Zap,
    MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
    DropdownMenuLabel,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAllSalaries, useGeneratePayroll, useUpdateSalary, useDeleteSalary, useStaffList, useCreateSalary } from "@/hooks/useSalaries";
import { useHostel } from "@/hooks/usehostel";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import SalarySlip from "@/components/SalarySlip";
import Loader from "@/components/ui/Loader";

const SalariesPage = () => {
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
    const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
    const [isAddSalaryDialogOpen, setIsAddSalaryDialogOpen] = useState(false);
    const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
    const [isExportingSalaries, setIsExportingSalaries] = useState(false);
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

    const { data: salaries, isLoading: salariesLoading } = useAllSalaries({
        month: activeTab === "current" ? currentMonth : null
    });
    const { data: staffList, isLoading: staffLoading } = useStaffList();
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
                item.StaffProfile?.User?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.id.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesHostel = filterHostel === "All" || item.StaffProfile?.User?.hostelId === filterHostel;
            const matchesStatus = filterStatus === "All" || item.status === filterStatus;

            return matchesSearch && matchesHostel && matchesStatus;
        });
    }, [salaries, searchQuery, filterHostel, filterStatus]);

    const stats = useMemo(() => {
        const data = salaries || [];
        const total = data.reduce((acc, curr) => acc + curr.amount, 0);
        const paid = data.filter(s => s.status === 'PAID').reduce((acc, curr) => acc + curr.amount, 0);
        const pending = data.filter(s => s.status === 'PENDING').reduce((acc, curr) => acc + curr.amount, 0);
        return { total, paid, pending, count: data.length };
    }, [salaries]);

    const handleExportCSV = () => {
        const headers = ["ID", "Staff Name", "Month", "Basic Salary", "Allowances", "Bonuses", "Deductions", "Net Amount", "Status", "Payment Method", "Date"];
        const rows = filteredSalaries.map(s => [
            s.id,
            s.StaffProfile?.User?.name,
            s.month,
            s.basicSalary,
            s.allowances,
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
        link.setAttribute("download", `Staff_Payroll_${selectedMonth.replace(' ', '_')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Payroll CSV Exported!");
    };

    const handleExportPDF = async () => {
        setIsExportingSalaries(true);
        try {
            const doc = new jsPDF('landscape');
            doc.setFont("helvetica", "bold");

            // Header Section
            doc.setFillColor(31, 41, 55); // gray-800
            doc.rect(0, 0, doc.internal.pageSize.width, 35, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.text("STAFF PAYROLL REPORT", doc.internal.pageSize.width / 2, 18, { align: "center" });
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Month: ${selectedMonth} | Total Staff: ${filteredSalaries.length}`, doc.internal.pageSize.width / 2, 26, { align: "center" });

            doc.setTextColor(80, 80, 80);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(`Generated On: ${format(new Date(), 'PPP p')}`, 14, 45);
            doc.text(`Total Amount: PKR ${stats.total.toLocaleString()}`, doc.internal.pageSize.width - 14, 45, { align: "right" });

            // Draw Line
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.5);
            doc.line(14, 49, doc.internal.pageSize.width - 14, 49);

            const headers = [
                ["S.No", "Staff Name", "Month", "Basic", "Allowances", "Bonuses", "Deductions", "Net", "Status", "Date"]
            ];

            const rows = filteredSalaries.map((s, index) => [
                index + 1,
                s.StaffProfile?.User?.name || 'N/A',
                s.month,
                s.basicSalary.toLocaleString(),
                s.allowances.toLocaleString(),
                s.bonuses.toLocaleString(),
                s.deductions.toLocaleString(),
                s.amount.toLocaleString(),
                s.status,
                s.paymentDate ? format(new Date(s.paymentDate), 'dd/MM/yy') : 'N/A'
            ]);

            autoTable(doc, {
                startY: 55,
                head: headers,
                body: rows,
                theme: 'grid',
                headStyles: {
                    fillColor: [31, 41, 55],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 8,
                    halign: 'center'
                },
                bodyStyles: {
                    fontSize: 8,
                    textColor: [50, 50, 50]
                },
                alternateRowStyles: {
                    fillColor: [249, 250, 251]
                },
                styles: {
                    overflow: 'linebreak',
                    cellPadding: 3,
                    valign: 'middle'
                },
                didDrawPage: function (data) {
                    let str = "Page " + doc.internal.getNumberOfPages();
                    doc.setFontSize(8);
                    doc.setTextColor(150, 150, 150);
                    doc.text(str, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: "center" });
                    doc.text("Official GreenView Staff Records", 14, doc.internal.pageSize.height - 10);
                }
            });

            doc.save(`Payroll_Report_${selectedMonth.replace(' ', '_')}.pdf`);
            toast.success("Payroll PDF Exported! \uD83D\uDCC4");
        } catch (error) {
            toast.error("Failed to export PDF");
            console.error(error);
        } finally {
            setIsExportingSalaries(false);
        }
    };

    const handleGeneratePayroll = async () => {
        try {
            await generatePayroll.mutateAsync({ month: currentMonth });
        } catch (error) {
            // Error handled by hook
        }
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

    const handleEditSubmit = async () => {
        try {
            await updateSalary.mutateAsync({
                id: selectedSalary.id,
                ...editFormData
            });
            setIsEditDialogOpen(false);
        } catch (error) { }
    };

    const handlePayOpen = (salary) => {
        setSelectedSalary(salary);
        setIsPayDialogOpen(true);
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
        } catch (error) { }
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteSalary.mutateAsync(selectedSalary.id);
            setIsDeleteDialogOpen(false);
        } catch (error) { }
    };

    if (salariesLoading) return <Loader label="Synchronizing Payroll" subLabel="Accessing financial records node" icon={Coins} />;

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight print:hidden">
            {/* Premium Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-1 bg-indigo-600 rounded-full" />
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight uppercase">Staff Payroll</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Payroll System</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Online</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="h-9 px-4 rounded-xl border-gray-200 bg-white font-bold text-[10px] uppercase tracking-wider text-gray-600 flex items-center gap-2"
                            onClick={handleExportCSV}
                        >
                            <Download className="h-3.5 w-3.5 text-gray-400" /> Export CSV
                        </Button>
                        <Button
                            variant="outline"
                            className="h-9 px-4 rounded-xl border-indigo-200 bg-indigo-50 font-bold text-[10px] uppercase tracking-wider text-indigo-700 hover:bg-indigo-100 transition-all shadow-sm flex items-center gap-2"
                            onClick={handleExportPDF}
                            disabled={isExportingSalaries}
                        >
                            {isExportingSalaries ? <Loader2 className="h-3.5 w-3.5 text-indigo-700 animate-spin" /> : <Download className="h-3.5 w-3.5 text-indigo-700" />}
                            EXPORT PAYROLL
                        </Button>
                        <Button
                            variant="outline"
                            className="h-9 px-4 rounded-xl border-gray-200 bg-white font-bold text-[10px] uppercase tracking-wider text-indigo-600 hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
                            onClick={() => setIsAddSalaryDialogOpen(true)}
                        >
                            <Plus className="h-3.5 w-3.5 text-indigo-600" /> Add Salary
                        </Button>
                        <Button
                            className="h-9 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all"
                            onClick={handleGeneratePayroll}
                            disabled={generatePayroll.isPending}
                        >
                            {generatePayroll.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                            Generate {currentMonth.split(' ')[0]} Payroll
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
                {/* Metrics Matrix */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Payroll', value: `PKR ${(stats.total / 1000).toFixed(1)}k`, icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Paid This Month', value: `PKR ${(stats.paid / 1000).toFixed(1)}k`, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Pending Salaries', value: `PKR ${(stats.pending / 1000).toFixed(1)}k`, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Total Staff', value: stats.count, icon: UserCheck, color: 'text-purple-600', bg: 'bg-purple-50' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className={`h-11 w-11 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</span>
                                <span className="text-xl font-bold text-gray-900 tracking-tight">{stat.value}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Operations Bar */}
                <div className="bg-white border border-gray-100 rounded-2xl p-2 flex flex-col md:flex-row items-center gap-4 shadow-sm">
                    <div className="flex-1 relative w-full group px-2">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by Staff Name or ID..."
                            className="w-full h-12 pl-10 bg-transparent border-none shadow-none font-bold text-sm focus-visible:ring-0 placeholder:text-gray-300"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="h-8 w-px bg-gray-100 mx-2 hidden md:block" />

                    <div className="flex items-center gap-2 p-1 bg-gray-50 rounded-xl w-full md:w-auto">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-10 px-4 rounded-lg font-bold text-[10px] uppercase tracking-wider text-gray-500">
                                    <Filter className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                    {filterStatus === 'All' ? 'Status: All' : filterStatus}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[200px] rounded-xl">
                                {["All", "PAID", "PENDING", "PARTIAL", "FAILED"].map(s => (
                                    <DropdownMenuItem key={s} onClick={() => setFilterStatus(s)} className="text-[10px] font-bold uppercase tracking-wider">
                                        {s}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-10 px-4 rounded-lg font-bold text-[10px] uppercase tracking-wider text-gray-500">
                                    <Building2 className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                    {filterHostel === 'All' ? 'All Hostels' : hostels.find(h => h.id === filterHostel)?.name}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[240px] rounded-xl">
                                <DropdownMenuItem onClick={() => setFilterHostel("All")}>All Hostels</DropdownMenuItem>
                                {hostels.map(h => (
                                    <DropdownMenuItem key={h.id} onClick={() => setFilterHostel(h.id)} className="text-[10px] font-bold uppercase tracking-wider">
                                        {h.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
                    <TabsList className="bg-white border border-gray-100 p-1 rounded-xl h-11 shadow-sm">
                        <TabsTrigger value="current" className="h-full px-8 rounded-lg font-bold text-[10px] uppercase tracking-wider data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                            <Zap className="h-3.5 w-3.5 mr-2" /> This Month ({currentMonth})
                        </TabsTrigger>
                        <TabsTrigger value="appeals" className="h-full px-8 rounded-lg font-bold text-[10px] uppercase tracking-wider data-[state=active]:bg-rose-600 data-[state=active]:text-white">
                            <MessageSquare className="h-3.5 w-3.5 mr-2" /> Salary Appeals
                            {salaries?.filter(s => s.appealStatus === 'PENDING').length > 0 && (
                                <span className="ml-2 bg-white text-rose-600 rounded-full px-1.5 py-0.5 text-[8px] font-black">
                                    {salaries?.filter(s => s.appealStatus === 'PENDING').length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="history" className="h-full px-8 rounded-lg font-bold text-[10px] uppercase tracking-wider data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                            <History className="h-3.5 w-3.5 mr-2" /> All Time
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="appeals" className="space-y-4">
                        {salaries?.filter(s => s.appealStatus !== 'NONE').length === 0 ? (
                            <div className="bg-white border border-dashed border-gray-200 rounded-[2rem] p-24 text-center">
                                <MessageSquare className="h-16 w-16 text-gray-200 mx-auto mb-6" />
                                <h3 className="text-xl font-bold text-gray-900 uppercase">No Active Appeals</h3>
                                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">All salary records are currently verified by node personnel.</p>
                            </div>
                        ) : (
                            salaries?.filter(s => s.appealStatus !== 'NONE').map(salary => (
                                <div key={salary.id} className="bg-white border border-rose-100 rounded-2xl p-6 flex flex-col items-center gap-6 hover:shadow-md transition-all group relative overflow-hidden">
                                    <div className="flex w-full justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 font-black">
                                                <AlertCircle className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">{salary.StaffProfile?.User?.name} • {salary.month}</h4>
                                                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mt-1">Appeal Status: {salary.appealStatus}</p>
                                            </div>
                                        </div>
                                        <Badge className="bg-rose-100 text-rose-600 hover:bg-rose-100 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                                            DISCREPANCY CLAIMED
                                        </Badge>
                                    </div>

                                    <div className="w-full bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                        <div className="flex items-start gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                                                <User className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Staff Observation</span>
                                                <p className="text-xs font-bold text-gray-700 italic leading-relaxed uppercase">{salary.appealText || "No context provided."}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {salary.appealResponse && (
                                        <div className="w-full bg-indigo-50/30 rounded-2xl p-6 border border-indigo-100/50">
                                            <div className="flex items-start gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-white border border-indigo-100 flex items-center justify-center shrink-0">
                                                    <ShieldCheck className="h-4 w-4 text-indigo-600" />
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Admin Resolution</span>
                                                    <p className="text-xs font-bold text-indigo-900 leading-relaxed uppercase">{salary.appealResponse}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex w-full justify-end gap-3 pt-4 border-t border-gray-50">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-10 rounded-xl px-6 font-black text-[10px] uppercase tracking-widest border-gray-100"
                                            onClick={() => {
                                                setSelectedSalary(salary);
                                                setIsSlipDialogOpen(true);
                                            }}
                                        >
                                            <FileText className="h-3.5 w-3.5 mr-2" /> View Slip
                                        </Button>
                                        {salary.appealStatus === 'PENDING' && (
                                            <Button
                                                className="h-10 rounded-xl px-6 bg-black text-white hover:bg-gray-800 font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                                                onClick={() => {
                                                    setSelectedSalary(salary);
                                                    setIsResolveDialogOpen(true);
                                                }}
                                            >
                                                <Settings2 className="h-3.5 w-3.5 mr-2" /> Resolve Appeal
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="current" className="space-y-4">
                        {filteredSalaries.map(salary => (
                            <div key={salary.id} className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col lg:flex-row items-center gap-8 hover:shadow-md transition-shadow group relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-1.5 h-full ${salary.status === 'PAID' ? 'bg-emerald-500' : 'bg-amber-500'} opacity-70`} />

                                <div className="flex items-center gap-6 flex-1 min-w-0">
                                    <div className="h-14 w-14 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:bg-indigo-600 transition-colors shrink-0">
                                        <Briefcase className="h-6 w-6 text-gray-400 group-hover:text-white transition-colors" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <h4 className="text-base font-bold text-gray-900 uppercase tracking-tight">{salary.StaffProfile?.User?.name}</h4>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{salary.StaffProfile?.designation}</span>
                                            <div className="h-1 w-1 rounded-full bg-gray-200" />
                                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{salary.StaffProfile?.User?.Hostel_User_hostelIdToHostel?.name || 'All Hostels'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 flex-[1.5]">
                                    <div>
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Basic Salary</span>
                                        <p className="text-sm font-bold text-gray-900">PKR {salary.basicSalary.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Adjustments</span>
                                        <p className="text-sm font-bold text-emerald-600">+{salary.bonuses.toLocaleString()} <span className="text-rose-500 ml-1">-{salary.deductions.toLocaleString()}</span></p>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Net Salary</span>
                                        <p className="text-sm font-bold text-gray-900">PKR {salary.amount.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Badge variant="outline" className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${salary.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                        {salary.status}
                                    </Badge>

                                    <div className="flex items-center gap-2">
                                        {salary.status === 'PENDING' && (
                                            <Button
                                                onClick={() => handlePayOpen(salary)}
                                                className="h-10 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider"
                                            >
                                                Pay Staff
                                            </Button>
                                        )}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full hover:bg-gray-50 border border-gray-100">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 rounded-xl p-2">
                                                <DropdownMenuItem onClick={() => { setSelectedSalary(salary); setIsSlipDialogOpen(true); }} className="font-bold text-[10px] uppercase tracking-wider p-3 rounded-lg cursor-pointer">
                                                    <FileText className="h-4 w-4 mr-2" /> View Salary Slip
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => router.push(`/admin/salaries/${salary.staffId}`)} className="font-bold text-[10px] uppercase tracking-wider p-3 rounded-lg cursor-pointer">
                                                    <History className="h-4 w-4 mr-2" /> View Salary History
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleEditOpen(salary)} className="font-bold text-[10px] uppercase tracking-wider p-3 rounded-lg cursor-pointer">
                                                    <Settings2 className="h-4 w-4 mr-2" /> Edit Salary
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => { setSelectedSalary(salary); setIsDeleteDialogOpen(true); }} className="font-bold text-[10px] uppercase tracking-wider p-3 rounded-lg cursor-pointer text-rose-600 hover:bg-rose-50">
                                                    <Trash2 className="h-4 w-4 mr-2" /> Delete Salary
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {filteredSalaries.length === 0 && (
                            <div className="bg-white border border-dashed border-gray-200 rounded-[2rem] p-24 text-center">
                                <Calculator className="h-16 w-16 text-gray-200 mx-auto mb-6" />
                                <h3 className="text-xl font-bold text-gray-900 uppercase">No records found</h3>
                                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Generate payroll for {currentMonth} to see staff records.</p>
                                <Button onClick={handleGeneratePayroll} className="mt-8 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl px-8 h-12 font-bold uppercase text-[10px] tracking-widest">
                                    Generate Payroll Now
                                </Button>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </main>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white">
                    <div className="bg-indigo-600 p-10 text-white text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/10 skew-x-12 translate-x-20" />
                        <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/10 shadow-lg">
                            <Calculator className="h-8 w-8" />
                        </div>
                        <h2 className="text-2xl font-bold uppercase tracking-tight">Edit Salary</h2>
                        <p className="text-[10px] text-indigo-100 font-bold tracking-widest mt-2 uppercase">Adjusting components for {selectedSalary?.StaffProfile?.User?.name}</p>
                    </div>
                    <div className="p-10 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Basic Salary</Label>
                                <Input type="number" value={editFormData.basicSalary} onChange={e => setEditFormData({ ...editFormData, basicSalary: Number(e.target.value) })} className="rounded-xl border-gray-100 bg-gray-50 font-bold h-11" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Allowances</Label>
                                <Input type="number" value={editFormData.allowances} onChange={e => setEditFormData({ ...editFormData, allowances: Number(e.target.value) })} className="rounded-xl border-gray-100 bg-gray-50 font-bold h-11" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Bonuses</Label>
                                <Input type="number" value={editFormData.bonuses} onChange={e => setEditFormData({ ...editFormData, bonuses: Number(e.target.value) })} className="rounded-xl border-emerald-100 bg-emerald-50/50 font-bold h-11 text-emerald-600" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-rose-500">Deductions</Label>
                                <Input type="number" value={editFormData.deductions} onChange={e => setEditFormData({ ...editFormData, deductions: Number(e.target.value) })} className="rounded-xl border-rose-100 bg-rose-50/50 font-bold h-11 text-rose-600" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Notes</Label>
                            <Textarea value={editFormData.notes} onChange={e => setEditFormData({ ...editFormData, notes: e.target.value })} className="rounded-xl border-gray-100 bg-gray-50 font-medium text-xs resize-none h-24" placeholder="Specify reason for adjustments..." />
                        </div>
                        <div className="flex gap-4 pt-4">
                            <Button variant="ghost" className="flex-1 rounded-xl h-11 font-bold text-[10px] uppercase tracking-wider text-gray-400" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                            <Button className="flex-1 h-11 bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl shadow-lg" onClick={handleEditSubmit} disabled={updateSalary.isPending}>
                                {updateSalary.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Pay Dialog */}
            <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white">
                    <div className="bg-emerald-600 p-10 text-white text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/10 skew-x-12 translate-x-20" />
                        <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/10 shadow-lg">
                            <ShieldCheck className="h-8 w-8" />
                        </div>
                        <h2 className="text-2xl font-bold uppercase tracking-tight">Pay Salary</h2>
                        <p className="text-[10px] text-emerald-100 font-bold tracking-widest mt-2 uppercase">Authorizing PKR {selectedSalary?.amount.toLocaleString()} Payment</p>
                    </div>
                    <div className="p-10 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Payment Method</Label>
                            <select
                                className="w-full h-11 rounded-xl border-gray-100 bg-gray-50 text-[10px] font-bold uppercase px-4"
                                value={payFormData.paymentMethod}
                                onChange={e => setPayFormData({ ...payFormData, paymentMethod: e.target.value })}
                            >
                                <option value="BANK_TRANSFER">Bank Transfer</option>
                                <option value="CASH">Cash</option>
                                <option value="ONLINE">Online Transfer</option>
                                <option value="CHEQUE">Cheque</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Payment Date</Label>
                            <Input type="date" value={payFormData.paymentDate} onChange={e => setPayFormData({ ...payFormData, paymentDate: e.target.value })} className="rounded-xl border-gray-100 bg-gray-50 font-bold h-11" />
                        </div>
                        <div className="flex gap-4 pt-4">
                            <Button variant="ghost" className="flex-1 rounded-xl h-11 font-bold text-[10px] uppercase tracking-wider text-gray-400" onClick={() => setIsPayDialogOpen(false)}>Cancel</Button>
                            <Button className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl shadow-lg" onClick={handlePaySubmit} disabled={updateSalary.isPending}>
                                {updateSalary.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Payment'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Alert */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-[2rem] border-none p-10 max-w-md">
                    <AlertDialogHeader>
                        <div className="h-16 w-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 border border-rose-100">
                            <Trash2 className="h-8 w-8 text-rose-600" />
                        </div>
                        <AlertDialogTitle className="text-xl font-bold uppercase tracking-tight">Delete Salary Record?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm font-medium text-gray-500 leading-relaxed mt-2 uppercase tracking-wide text-[10px]">
                            This operation will delete the salary record. Total amounts will be recalculated.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-10 gap-3">
                        <AlertDialogCancel className="h-12 px-8 rounded-xl font-bold text-[10px] uppercase tracking-widest border-gray-100">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="h-12 px-8 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-rose-600/20">Confirm Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Add Salary Entry Dialog */}
            <Dialog open={isAddSalaryDialogOpen} onOpenChange={setIsAddSalaryDialogOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white">
                    <div className="bg-indigo-600 p-10 text-white text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/10 skew-x-12 translate-x-20" />
                        <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/10 shadow-lg">
                            <Plus className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold uppercase tracking-tight">Add Salary Entry</h2>
                        <p className="text-[10px] text-indigo-100 font-bold tracking-widest mt-2 uppercase">Manually add a staff member salary to the record</p>
                    </div>
                    <div className="p-10 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Staff Selection</Label>
                            <select
                                className="w-full h-11 rounded-xl border-gray-100 bg-gray-50 text-[10px] font-bold uppercase px-4 focus:ring-1 focus:ring-indigo-600 outline-none"
                                value={addSalaryForm.staffId}
                                onChange={e => setAddSalaryForm({ ...addSalaryForm, staffId: e.target.value })}
                            >
                                <option value="">Select Staff Member</option>
                                {staffList?.map(staff => (
                                    <option key={staff.id} value={staff.id}>
                                        {staff.User.name} ({staff.designation})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Month</Label>
                            <Input
                                placeholder="e.g. February 2026"
                                value={addSalaryForm.month}
                                onChange={e => setAddSalaryForm({ ...addSalaryForm, month: e.target.value })}
                                className="rounded-xl border-gray-100 bg-gray-50 font-bold h-11 uppercase text-[10px] focus:ring-1 focus:ring-indigo-600"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Custom Bonuses</Label>
                                <Input type="number" value={addSalaryForm.customBonuses} onChange={e => setAddSalaryForm({ ...addSalaryForm, customBonuses: Number(e.target.value) })} className="rounded-xl border-emerald-100 bg-emerald-50 font-bold h-11 text-emerald-600" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-rose-500">Custom Deductions</Label>
                                <Input type="number" value={addSalaryForm.customDeductions} onChange={e => setAddSalaryForm({ ...addSalaryForm, customDeductions: Number(e.target.value) })} className="rounded-xl border-rose-100 bg-rose-50 font-bold h-11 text-rose-600" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Notes</Label>
                            <Textarea value={addSalaryForm.customNotes} onChange={e => setAddSalaryForm({ ...addSalaryForm, customNotes: e.target.value })} className="rounded-xl border-gray-100 bg-gray-50 font-medium text-xs resize-none h-20" placeholder="Reason for manual entry..." />
                        </div>
                        <div className="flex gap-4 pt-4">
                            <Button variant="ghost" className="flex-1 rounded-xl h-11 font-bold text-[10px] uppercase tracking-wider text-gray-400" onClick={() => setIsAddSalaryDialogOpen(false)}>Cancel</Button>
                            <Button
                                className="flex-1 h-11 bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all hover:bg-indigo-700 active:scale-95"
                                onClick={handleAddSalarySubmit}
                                disabled={createSalary.isPending || !addSalaryForm.staffId || !addSalaryForm.month}
                            >
                                {createSalary.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-3.5 w-3.5" /> Save Salary</>}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Resolve Appeal Dialog */}
            <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white">
                    <div className="bg-rose-600 p-10 text-white text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/10 skew-x-12 translate-x-20" />
                        <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/10 shadow-lg">
                            <ShieldCheck className="h-8 w-8" />
                        </div>
                        <h2 className="text-2xl font-bold uppercase tracking-tight">Audit Resolution</h2>
                        <p className="text-[10px] text-rose-100 font-bold tracking-widest mt-2 uppercase">Responding to {selectedSalary?.StaffProfile?.User?.name}'s Claim</p>
                    </div>
                    <div className="p-10 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Resolution Status</Label>
                            <Select
                                value={resolveFormData.appealStatus}
                                onValueChange={v => setResolveFormData({ ...resolveFormData, appealStatus: v })}
                            >
                                <SelectTrigger className="h-11 rounded-xl border-gray-100 bg-gray-50 font-black text-[10px] uppercase tracking-widest">
                                    <SelectValue placeholder="SELECT STATUS" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="RESOLVED">RESOLVED</SelectItem>
                                    <SelectItem value="REJECTED">REJECTED</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Official Response</Label>
                            <Textarea
                                value={resolveFormData.appealResponse}
                                onChange={e => setResolveFormData({ ...resolveFormData, appealResponse: e.target.value })}
                                className="rounded-xl border-gray-100 bg-gray-50 font-medium text-xs resize-none h-24"
                                placeholder="Explain the audit outcome..."
                            />
                        </div>
                        <div className="flex gap-4 pt-4">
                            <Button variant="ghost" className="flex-1 rounded-xl h-11 font-bold text-[10px] uppercase tracking-wider text-gray-400" onClick={() => setIsResolveDialogOpen(false)}>Abort</Button>
                            <Button className="flex-1 h-11 bg-rose-600 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl shadow-lg" onClick={handleResolveSubmit} disabled={updateSalary.isPending}>
                                {updateSalary.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply Resolution'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Salary Slip Dialog */}
            <Dialog open={isSlipDialogOpen} onOpenChange={setIsSlipDialogOpen}>
                <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white bg-transparent">
                    <SalarySlip salary={selectedSalary} />
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SalariesPage;
