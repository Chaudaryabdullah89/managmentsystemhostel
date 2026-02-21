"use client"
import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
    DollarSign,
    Calendar,
    CheckCircle,
    XCircle,
    Clock,
    Download,
    User,
    ChevronRight,
    Receipt,
    Check,
    Building2,
    Briefcase,
    Mail,
    Phone,
    CreditCard,
    ArrowLeft,
    TrendingUp,
    History,
    ShieldCheck,
    Loader2
} from "lucide-react";
import { Card, CardHeader, CardAction, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import SalarySlip from "@/components/SalarySlip";
import { useStaffSalaryHistory, useUpdateSalary } from "@/hooks/useSalaries";
import { toast } from "sonner";
import { format } from "date-fns";

const EmployeeSalaryHistoryPage = () => {
    const params = useParams();
    const router = useRouter();
    const employeeId = params.employeeId;
    const [filterYear, setFilterYear] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");

    // Pay Salary state
    const [selectedSalaryForPayment, setSelectedSalaryForPayment] = useState(null);
    const [payFormData, setPayFormData] = useState({
        paymentMethod: "BANK_TRANSFER",
        paymentDate: format(new Date(), 'yyyy-MM-dd'),
        notes: "",
        transactionId: ""
    });

    const [selectedSalary, setSelectedSalary] = useState(null);
    const [isSlipOpen, setIsSlipOpen] = useState(false);

    const { data: staffData, isLoading } = useStaffSalaryHistory(employeeId);
    const updateSalary = useUpdateSalary();

    const getStatusColor = (status) => {
        switch (status) {
            case "PAID":
                return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "PENDING":
                return "bg-amber-100 text-amber-700 border-amber-200";
            case "OVERDUE":
                return "bg-rose-100 text-rose-700 border-rose-200";
            default:
                return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "PAID":
                return <CheckCircle className="w-4 h-4" />;
            case "PENDING":
                return <Clock className="w-4 h-4" />;
            case "OVERDUE":
                return <XCircle className="w-4 h-4" />;
            default:
                return <Clock className="w-4 h-4" />;
        }
    };

    if (isLoading) return (
        <div className="flex h-screen items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="h-20 w-20 border-[3px] border-gray-100 border-t-indigo-600 rounded-full animate-spin" />
                    <DollarSign className="h-8 w-8 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-sm font-bold text-gray-900 uppercase tracking-widest">Loading Salary History...</p>
            </div>
        </div>
    );

    if (!staffData) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
                <ShieldCheck className="w-16 h-16 text-gray-400 mb-4" />
                <h1 className="text-2xl font-bold text-gray-800">Staff Record Not Found</h1>
                <Button onClick={() => router.push('/admin/salaries')} className="mt-6 bg-indigo-600">Return to Salaries</Button>
            </div>
        )
    }

    const unformattedSalaryHistory = staffData.Salary || [];

    // Process unique years
    const uniqueYears = [...new Set(unformattedSalaryHistory.map(s => {
        const yearMatch = s.month.match(/\d{4}/);
        return yearMatch ? yearMatch[0] : null;
    }).filter(Boolean))];

    const filteredHistory = unformattedSalaryHistory.filter(record => {
        const recordYearMatch = record.month.match(/\d{4}/);
        const recordYear = recordYearMatch ? recordYearMatch[0] : null;

        const matchesYear = filterYear === "all" || recordYear === filterYear;
        const matchesStatus = filterStatus === "all" || record.status === filterStatus;
        return matchesYear && matchesStatus;
    });

    const stats = {
        totalPaid: unformattedSalaryHistory.filter(s => s.status === "PAID").length,
        totalPending: unformattedSalaryHistory.filter(s => s.status === "PENDING").length,
        totalEarned: unformattedSalaryHistory.filter(s => s.status === "PAID").reduce((sum, s) => sum + s.amount, 0),
        pendingAmount: unformattedSalaryHistory.filter(s => s.status === "PENDING").reduce((sum, s) => sum + s.amount, 0),
        averageSalary: unformattedSalaryHistory.length ? Math.round(unformattedSalaryHistory.reduce((sum, s) => sum + s.amount, 0) / unformattedSalaryHistory.length) : 0
    };

    const handleMarkAsPaid = async () => {
        if (!selectedSalaryForPayment) return;
        try {
            await updateSalary.mutateAsync({
                id: selectedSalaryForPayment.id,
                status: 'PAID',
                ...payFormData,
                paymentDate: new Date(payFormData.paymentDate).toISOString()
            });
            setSelectedSalaryForPayment(null);
            setPayFormData({
                paymentMethod: "BANK_TRANSFER",
                paymentDate: format(new Date(), 'yyyy-MM-dd'),
                notes: "",
                transactionId: ""
            });
        } catch (error) {
            // Error is handled by hook
        }
    };

    const handleExport = () => {
        const headers = ["ID", "Month", "Basic Salary", "Allowances", "Bonuses", "Deductions", "Net Amount", "Status", "Payment Method", "Date"];
        const rows = filteredHistory.map(s => [
            s.id,
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
        link.setAttribute("download", `${staffData.User.name.replace(' ', '_')}_Salary_History.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Personal salary history exported successfully");
    };

    return (
        <div className="print:hidden min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-40 h-16">
                <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <Link href="/admin/salaries">
                                <Button variant="ghost" size="sm" className="h-8 px-2 shrink-0 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all font-bold text-[10px] uppercase tracking-wider">
                                    <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
                                </Button>
                            </Link>
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight uppercase flex items-center gap-3">
                                {staffData.User.name}
                                <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full shadow-sm">
                                    {staffData.User.isActive ? "Active" : "Inactive"}
                                </Badge>
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={handleExport}
                            className="h-9 px-4 rounded-xl border-gray-200 bg-white font-bold text-[10px] uppercase tracking-wider text-gray-600 hover:bg-gray-50"
                        >
                            <Download className="h-3.5 w-3.5 mr-2 text-gray-400" />
                            Export History
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
                {/* Employee Info Card */}
                <Card className="rounded-3xl border-gray-100 shadow-sm overflow-hidden bg-white hover:shadow-md transition-all">
                    <CardHeader className="border-b bg-gradient-to-r from-gray-50/80 to-white pb-6 pt-8">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-gray-900 flex items-center gap-3">
                                <User className="h-5 w-5 text-indigo-600" /> Employee Record
                            </CardTitle>
                            <div className="flex gap-2">
                                <Badge className="bg-indigo-50 text-indigo-600 border-none px-3 py-1 text-[10px] tracking-wider uppercase font-black uppercase shadow-sm">
                                    ID: {staffData.id.slice(0, 8)}
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-8 pb-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                                        <Briefcase className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Designation</p>
                                        <p className="text-sm font-bold text-gray-900 mt-0.5 uppercase">{staffData.designation}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                                        <Building2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Hostel</p>
                                        <p className="text-sm font-bold text-gray-900 mt-0.5 uppercase">{staffData.User.Hostel_User_hostelIdToHostel?.name || "All Locations"}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Phone</p>
                                        <p className="text-sm font-bold text-gray-900 mt-0.5 tracking-wide">{staffData.User.phone || "Not Provided"}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="h-10 w-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Email</p>
                                        <p className="text-sm font-bold text-gray-900 mt-0.5">{staffData.User.email}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">CNIC / ID</p>
                                    <p className="text-sm font-bold text-gray-900 mt-0.5 tracking-wider">{staffData.User.cnic || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Join Date</p>
                                    <p className="text-sm font-bold text-gray-900 mt-0.5">{format(new Date(staffData.joiningDate), 'PPP')}</p>
                                </div>
                            </div>

                            <div className="flex flex-col justify-center items-start lg:items-end border-l border-gray-100 pl-8">
                                <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-2">Base Salary</p>
                                <p className="text-3xl font-black text-indigo-600 tracking-tighter">
                                    <span className="text-sm mr-1 font-bold">PKR</span>
                                    {staffData.basicSalary.toLocaleString()}
                                </p>
                                <Badge className="mt-2 bg-emerald-50 text-emerald-600 border-none font-bold text-[9px] uppercase tracking-widest px-3 py-1 rounded-full">+ PKR {staffData.allowances.toLocaleString()} allowances</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Ledger */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {[
                        { label: 'Paid Cycles', value: stats.totalPaid, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Pending Cycles', value: stats.totalPending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Total Disbursed', value: `PKR ${(stats.totalEarned / 1000).toFixed(1)}k`, icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { label: 'Due Amount', value: `PKR ${(stats.pendingAmount / 1000).toFixed(1)}k`, icon: History, color: 'text-rose-600', bg: 'bg-rose-50' },
                        { label: 'Avg Salary', value: `PKR ${(stats.averageSalary / 1000).toFixed(1)}k`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
                    ].map((s, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className={`h-10 w-10 rounded-xl ${s.bg} ${s.color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                                <s.icon className="h-4 w-4" />
                            </div>
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{s.label}</h4>
                            <p className="text-xl font-bold text-gray-900 tracking-tight">{s.value}</p>
                            <div className={`absolute top-0 right-0 w-24 h-24 ${s.bg} rounded-full -translate-y-12 translate-x-12 opacity-50 pointer-events-none group-hover:scale-150 transition-transform duration-700`}></div>
                        </div>
                    ))}
                </div>

                {/* Ledger Config */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 flex flex-col md:flex-row items-center gap-3 w-full max-w-2xl mx-auto">
                    <div className="w-full md:w-1/2 flex items-center pr-2 border-b md:border-b-0 md:border-r border-gray-100 pb-2 md:pb-0">
                        <Calendar className="h-4 w-4 ml-4 mr-3 text-gray-400 shrink-0" />
                        <Select value={filterYear} onValueChange={setFilterYear}>
                            <SelectTrigger className="border-none shadow-none h-11 w-full bg-transparent font-bold text-[10px] uppercase tracking-widest hover:bg-gray-50 rounded-xl">
                                <SelectValue placeholder="Fiscal Year" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="all" className="font-bold text-[10px] uppercase tracking-wider">All Years</SelectItem>
                                {uniqueYears.map((year) => (
                                    <SelectItem key={year} value={year} className="font-bold text-[10px] uppercase tracking-wider">
                                        {year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-full md:w-1/2 flex items-center pr-2">
                        <CreditCard className="h-4 w-4 ml-4 mr-3 text-gray-400 shrink-0" />
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="border-none shadow-none h-11 w-full bg-transparent font-bold text-[10px] uppercase tracking-widest hover:bg-gray-50 rounded-xl">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="all" className="font-bold text-[10px] uppercase tracking-wider">All Statuses</SelectItem>
                                <SelectItem value="PAID" className="font-bold text-[10px] uppercase tracking-wider text-emerald-600">Paid</SelectItem>
                                <SelectItem value="PENDING" className="font-bold text-[10px] uppercase tracking-wider text-amber-600">Pending</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Salary Timeline Sequence */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-gray-100 pb-2 max-w-max">
                        <History className="h-4 w-4 text-indigo-600" /> Payment Ledger
                    </h3>

                    {filteredHistory.map((record) => (
                        <Card key={record.id} className="border-gray-100 rounded-3xl overflow-hidden hover:shadow-lg transition-all group/card bg-white relative">
                            <div className={`absolute top-0 left-0 w-1.5 h-full ${record.status === 'PAID' ? 'bg-emerald-500' : 'bg-amber-500'} opacity-70 flex`} />

                            <CardContent className="p-6">
                                <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                                    {/* Left Core */}
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-2xl font-black tracking-tight text-gray-900 uppercase">
                                                {record.month}
                                            </h3>
                                            <Badge className={`${getStatusColor(record.status)} border px-3 py-1 rounded-full flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest`}>
                                                {getStatusIcon(record.status)}
                                                {record.status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                            <span>#ID: {record.id.slice(0, 8)}</span>
                                        </div>
                                    </div>

                                    {/* Middle Financials */}
                                    <div className="flex-[2] w-full bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Base Salary</span>
                                                <p className="font-bold text-gray-900 tracking-tight">PKR {record.basicSalary.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest block mb-1">Additives</span>
                                                <p className="font-bold text-emerald-600 tracking-tight">
                                                    +{record.allowances.toLocaleString()} <span className="opacity-50">+</span> {record.bonuses.toLocaleString()}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest block mb-1">Deductions</span>
                                                <p className="font-bold text-rose-600 tracking-tight">- PKR {record.deductions.toLocaleString()}</p>
                                            </div>
                                            <div className="border-l border-gray-200 pl-4">
                                                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest block mb-1">Total Net</span>
                                                <p className="font-black text-lg text-indigo-600 tracking-tight">PKR {record.amount.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Actions */}
                                    <div className="flex flex-col items-end gap-3 min-w-[140px]">
                                        {record.status === "PENDING" && (
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button onClick={() => setSelectedSalaryForPayment(record)} className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 rounded-xl font-bold uppercase text-[10px] tracking-widest">
                                                        <Check className="w-3.5 h-3.5 mr-2" /> Pay Salary
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white">
                                                    <div className="bg-emerald-600 p-10 text-white text-center relative overflow-hidden">
                                                        <div className="absolute inset-0 bg-white/10 skew-x-12 translate-x-20" />
                                                        <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/10 shadow-lg">
                                                            <ShieldCheck className="h-8 w-8" />
                                                        </div>
                                                        <h2 className="text-2xl font-bold uppercase tracking-tight">Pay Salary</h2>
                                                        <p className="text-[10px] text-emerald-100 font-bold tracking-widest mt-2 uppercase">Authorizing PKR {selectedSalaryForPayment?.amount.toLocaleString()} for {selectedSalaryForPayment?.month}</p>
                                                    </div>
                                                    <div className="p-10 space-y-6">
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Payment Method</Label>
                                                            <select
                                                                className="w-full h-11 rounded-xl border-gray-100 bg-gray-50 text-[10px] font-bold uppercase px-4 outline-none focus:ring-1 focus:ring-emerald-500"
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
                                                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Transaction ID (Optional)</Label>
                                                            <Input
                                                                value={payFormData.transactionId}
                                                                onChange={e => setPayFormData({ ...payFormData, transactionId: e.target.value })}
                                                                className="rounded-xl border-gray-100 bg-gray-50 font-bold h-11"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Payment Date</Label>
                                                            <Input type="date" value={payFormData.paymentDate} onChange={e => setPayFormData({ ...payFormData, paymentDate: e.target.value })} className="rounded-xl border-gray-100 bg-gray-50 font-bold h-11" />
                                                        </div>
                                                        <div className="flex gap-4 pt-4">
                                                            <DialogTrigger asChild>
                                                                <Button variant="ghost" className="flex-1 rounded-xl h-11 font-bold text-[10px] uppercase tracking-wider text-gray-400">Cancel</Button>
                                                            </DialogTrigger>
                                                            <Button className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl shadow-lg flex justify-center items-center" onClick={handleMarkAsPaid} disabled={updateSalary.isPending}>
                                                                {updateSalary.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Payment'}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        )}
                                        <Button
                                            variant="outline"
                                            className="w-full h-11 border-gray-200 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all"
                                            onClick={() => {
                                                const formattedSalary = {
                                                    ...record,
                                                    StaffProfile: { User: { name: staffData.User.name, email: staffData.User.email }, designation: staffData.designation }
                                                };
                                                setSelectedSalary(formattedSalary);
                                                setIsSlipOpen(true);
                                            }}
                                        >
                                            <Receipt className="w-3.5 h-3.5 mr-2" />
                                            View Slip
                                        </Button>
                                    </div>
                                </div>

                                {/* Info Footer for Paid Status */}
                                {record.status === "PAID" && record.paymentMethod && (
                                    <div className="mt-4 pt-4 border-t border-gray-50 flex flex-wrap gap-4 items-center">
                                        <div className="flex bg-emerald-50 rounded-lg py-1 px-3 items-center">
                                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 mr-1.5" />
                                            <span className="text-[10px] font-black tracking-widest text-emerald-700 uppercase">Settled on {format(new Date(record.paymentDate || new Date()), 'PP')}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Building2 className="w-3.5 h-3.5 text-gray-400" />
                                            <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase">Via {record.paymentMethod.replace('_', ' ')}</span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}

                    {filteredHistory.length === 0 && (
                        <div className="bg-white border border-dashed border-gray-200 rounded-[2rem] p-24 text-center">
                            <History className="h-16 w-16 text-gray-200 mx-auto mb-6" />
                            <h3 className="text-xl font-bold text-gray-900 uppercase tracking-tight">No Ledgers Found</h3>
                            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Adjust your filters or verify node assignments.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Slip Dialog */}
            <Dialog open={isSlipOpen} onOpenChange={setIsSlipOpen}>
                <DialogContent className="max-w-4xl p-0 bg-transparent border-none shadow-none">
                    <SalarySlip salary={selectedSalary} />
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default EmployeeSalaryHistoryPage;
