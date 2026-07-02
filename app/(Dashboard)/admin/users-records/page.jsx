"use client"
import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
    Shield, User, UserCog, UserCheck, ChevronRight, Search, Mail, Phone,
    Building2, Calendar, CheckCircle, FileText, CreditCard, Wrench,
    AlertTriangle, DollarSign, Clock, XCircle, Plus, Filter, MoreVertical,
    Settings2, Trash2, MapPin, Fingerprint, ShieldCheck, Loader2, Zap,
    Briefcase, UserPlus, LayoutGrid, LayoutList, TrendingUp,
    Users, ArrowUpDown, SortAsc, SortDesc, Download, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListPageSkeleton } from "@/components/ui/skeletons";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useAllUsers, useCreateUser, useUpdateAnyUser, useDeleteUser, useResetPassword } from "@/hooks/useUsers";
import { useHostel } from "@/hooks/usehostel";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import useAuthStore from "@/hooks/Authstate";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { exportToExcel } from "@/lib/utils/exportToExcel";

const ROLES = ["all", "ADMIN", "WARDEN", "STAFF", "RESIDENT"];

const ROLE_CONFIG = {
    ADMIN: { color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/40", border: "border-rose-100 dark:border-rose-900/40", icon: Shield, dot: "bg-rose-500" },
    WARDEN: { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40", border: "border-amber-100 dark:border-amber-900/40", icon: UserCog, dot: "bg-amber-500" },
    STAFF: { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40", border: "border-blue-100 dark:border-blue-900/40", icon: Briefcase, dot: "bg-blue-500" },
    RESIDENT: { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-100 dark:border-emerald-900/40", icon: User, dot: "bg-emerald-500" },
    GUEST: { color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-100 dark:border-purple-900/40", icon: User, dot: "bg-purple-500" },
};
const getRoleConfig = (role) => ROLE_CONFIG[role] || { color: "text-gray-600 dark:text-muted-foreground", bg: "bg-gray-50 dark:bg-muted/10", border: "border-gray-100 dark:border-border", icon: User, dot: "bg-gray-400" };

const UserRecordPage = () => {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [filterRole, setFilterRole] = useState("all");
    const [viewMode, setViewMode] = useState("table");
    const [sortBy, setSortBy] = useState("name");
    const [sortDir, setSortDir] = useState("asc");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
    const [isAccessDialogOpen, setIsAccessDialogOpen] = useState(false);
    const [newPassword, setNewPassword] = useState("hostel123");

    const user = useAuthStore((state) => state.user);
    const isAdmin = user?.role === 'ADMIN';
    const isWarden = user?.role === 'WARDEN';

    const { data: users, isLoading } = useAllUsers({
        role: filterRole,
        hostelId: isWarden && !isAdmin ? user?.hostelId : undefined
    });
    const { data: hostelsData } = useHostel();
    const hostels = hostelsData?.data || [];
    const createUser = useCreateUser();
    const updateAnyUser = useUpdateAnyUser();
    const deleteUser = useDeleteUser();
    const resetPassword = useResetPassword();

    const [formData, setFormData] = useState({
        name: "", email: "", password: "", phone: "", cnic: "",
        role: "RESIDENT", hostelId: "", designation: "", basicSalary: 0,
        canManageExpenses: false, canManageMess: false, canManageGeneral: false,
        canManageUtilities: false, canManageMaintenance: false, canManageSalaries: false
    });

    const filteredUsers = useMemo(() => {
        if (!users) return [];
        let list = users.filter(u =>
            (u.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (u.email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (u.phone || "").includes(searchQuery) ||
            (u.cnic || "").includes(searchQuery) ||
            (u.uid?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (u.regNumber?.toLowerCase() || "").includes(searchQuery.toLowerCase())
        );
        list = list.sort((a, b) => {
            let av = a[sortBy] || '', bv = b[sortBy] || '';
            if (typeof av === 'string') av = av.toLowerCase();
            if (typeof bv === 'string') bv = bv.toLowerCase();
            return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
        });
        return list;
    }, [users, searchQuery, sortBy, sortDir]);

    const stats = useMemo(() => {
        if (!users) return {};
        return {
            total: users.length,
            active: users.filter(u => u.isActive).length,
            admin: users.filter(u => u.role === 'ADMIN').length,
            warden: users.filter(u => u.role === 'WARDEN').length,
            staff: users.filter(u => u.role === 'STAFF').length,
            resident: users.filter(u => u.role === 'RESIDENT').length,
        };
    }, [users]);

    const handleSort = (field) => {
        if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortBy(field); setSortDir('asc'); }
    };

    const SortIcon = ({ field }) => {
        if (sortBy !== field) return <ArrowUpDown className="h-3 w-3 text-gray-300" />;
        return sortDir === 'asc' ? <SortAsc className="h-3 w-3 text-slate-700 dark:text-slate-300" /> : <SortDesc className="h-3 w-3 text-slate-700 dark:text-slate-300" />;
    };

    const handleExport = () => {
        if (!filteredUsers.length) return toast.error("No users to export");
        const rows = filteredUsers.map(u => ({
            "Reg #": u.regNumber || '—',
            "Name": u.name,
            "Email": u.email,
            "Phone": u.phone || '',
            "CNIC": u.cnic || '',
            "Role": u.role,
            "Hostel": u.Hostel_User_hostelIdToHostel?.name || 'Global',
            "Status": u.isActive ? 'Active' : 'Inactive',
            "Joined": u.createdAt ? format(new Date(u.createdAt), 'yyyy-MM-dd') : '',
            "System ID": u.uid || u.id
        }));
        exportToExcel(rows, `Users_Directory_${format(new Date(), 'yyyyMMdd')}`, "Users");
    };

    const handleExportPDF = () => {
        if (!filteredUsers.length) return toast.error("No users to export");

        try {
            const doc = new jsPDF('landscape');

            doc.setFillColor(30, 41, 59);
            doc.rect(0, 0, doc.internal.pageSize.width, 30, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.text("USER RECORDS DIRECTORY", doc.internal.pageSize.width / 2, 15, { align: "center" });

            doc.setFontSize(10);
            doc.text(`Generated on: ${format(new Date(), 'PPP p')}`, doc.internal.pageSize.width / 2, 22, { align: "center" });

            const headers = [["Reg #", "Name", "Email", "Phone", "Role", "Hostel", "Status"]];
            const rows = filteredUsers.map(u => [
                u.regNumber || '—',
                u.name,
                u.email,
                u.phone || 'N/A',
                u.role,
                u.Hostel_User_hostelIdToHostel?.name || 'Global',
                u.isActive ? 'Active' : 'Inactive'
            ]);

            autoTable(doc, {
                head: headers,
                body: rows,
                startY: 40,
                theme: 'grid',
                headStyles: {
                    fillColor: [30, 41, 59],
                    textColor: [255, 255, 255],
                    fontSize: 8,
                    fontStyle: 'bold',
                    halign: 'center'
                },
                bodyStyles: {
                    fontSize: 8,
                    textColor: [50, 50, 50]
                },
                alternateRowStyles: {
                    fillColor: [249, 250, 251]
                },
                margin: { top: 40 }
            });

            doc.save(`Users_Report_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
            toast.success("Identity records exported (PDF)");
        } catch (error) {
            console.error("PDF generation failed:", error);
            toast.error("Failed to generate PDF report");
        }
    };

    const handleCreateUser = async () => {
        try {
            await createUser.mutateAsync(formData);
            setIsCreateDialogOpen(false);
            setFormData({
                name: "", email: "", password: "", phone: "", cnic: "",
                role: "RESIDENT", hostelId: "", designation: "", basicSalary: 0,
                canManageExpenses: false, canManageMess: false, canManageGeneral: false,
                canManageUtilities: false, canManageMaintenance: false, canManageSalaries: false
            });
        } catch { }
    };

    const handleEditUser = async () => {
        if (!selectedUser) return;
        try { await updateAnyUser.mutateAsync({ id: selectedUser.id, data: selectedUser }); setIsEditDialogOpen(false); } catch { }
    };

    const handleResetPassword = async () => {
        if (!selectedUser) return;
        try { await resetPassword.mutateAsync({ id: selectedUser.id, newPassword }); setIsAccessDialogOpen(false); setNewPassword("hostel123"); } catch { }
    };

    const handleUpdateRole = async () => {
        if (!selectedUser) return;
        try { await updateAnyUser.mutateAsync({ id: selectedUser.id, data: { role: selectedUser.role, canManageExpenses: selectedUser.canManageExpenses } }); setIsRoleDialogOpen(false); } catch { }
    };

    const handleDelete = (id) => {
        if (confirm("Delete this user? This cannot be undone.")) deleteUser.mutateAsync(id).catch(() => { });
    };

    const UserActions = ({ user }) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-gray-100 dark:hover:bg-muted shrink-0">
                    <MoreVertical className="h-4 w-4 text-gray-400 dark:text-muted-foreground" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-2xl p-2 shadow-2xl border-gray-100 dark:border-border bg-white dark:bg-card">
                <DropdownMenuItem onClick={() => router.push(user.role === 'WARDEN' ? `/admin/wardens/${user.id}` : `/admin/users-records/${user.id}`)}
                    className="h-10 rounded-xl font-bold text-[10px] uppercase tracking-wider cursor-pointer flex items-center gap-2">
                    <Eye className="h-4 w-4 text-gray-400 dark:text-muted-foreground" /> View Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSelectedUser({ ...user }); setIsEditDialogOpen(true); }}
                    className="h-10 rounded-xl font-bold text-[10px] uppercase tracking-wider cursor-pointer flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-gray-400 dark:text-muted-foreground" /> Edit Info
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSelectedUser({ ...user }); setIsRoleDialogOpen(true); }}
                    className="h-10 rounded-xl font-bold text-[10px] uppercase tracking-wider cursor-pointer flex items-center gap-2">
                    <Shield className="h-4 w-4 text-amber-500" /> Set Role
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSelectedUser(user); setIsAccessDialogOpen(true); }}
                    className="h-10 rounded-xl font-bold text-[10px] uppercase tracking-wider cursor-pointer text-blue-600 flex items-center gap-2">
                    <Zap className="h-4 w-4" /> Reset Password
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-100 dark:bg-border/60 mx-2 my-1" />
                <DropdownMenuItem onClick={() => handleDelete(user.id)}
                    className="h-10 rounded-xl font-bold text-[10px] uppercase tracking-wider cursor-pointer text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2">
                    <Trash2 className="h-4 w-4" /> Delete Account
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    return (
        <div className="min-h-screen bg-[#F4F6F9] dark:bg-background pb-20 font-sans antialiased relative overflow-hidden">
            {/* ── Ambient Background Gradient ── */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/[0.04] rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-500/[0.03] rounded-full blur-[100px]" />
            </div>

            {/* Header */}
            <header className="bg-white/80 dark:bg-card/80 backdrop-blur-md border-b border-gray-200/50 dark:border-border/50 sticky top-0 z-50 h-16 shadow-2xs relative z-10">
                <div className="max-w-[1600px] mx-auto px-4 md:px-8 h-full flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-1 bg-gradient-to-b from-indigo-500 to-violet-600 rounded-full shrink-0" />
                        <div>
                            <h1 className="text-sm font-black text-gray-900 dark:text-foreground uppercase tracking-wider">Users Directory</h1>
                            <p className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{stats.total || 0} Accounts Total</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-9 px-4 rounded-xl border border-gray-200 dark:border-border text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-muted-foreground hover:bg-gray-50 dark:hover:bg-muted flex items-center gap-2 bg-white dark:bg-card">
                                    <Download className="h-3.5 w-3.5" /> Export
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 rounded-2xl p-2 shadow-xl border-gray-100 dark:border-border bg-white dark:bg-card">
                                <DropdownMenuItem onClick={handleExport} className="h-10 rounded-xl font-bold text-[10px] uppercase tracking-wider cursor-pointer flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-emerald-500" /> Excel Spreadsheet
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleExportPDF} className="h-10 rounded-xl font-bold text-[10px] uppercase tracking-wider cursor-pointer flex items-center gap-2">
                                    <Download className="h-4 w-4 text-rose-500" /> PDF Report
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(true)} className="h-9 px-4 rounded-xl border-gray-200 dark:border-border text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 bg-white dark:bg-card">
                            <Plus className="h-3.5 w-3.5" /> Quick Add
                        </Button>
                        <Button onClick={() => router.push('/admin/users-records/register')} className="h-9 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-wider shadow-sm flex items-center gap-2 transition-all active:scale-95">
                            <UserPlus className="h-3.5 w-3.5" /> Enroll Resident
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 space-y-6 relative z-10">
                {/* Standardized Uniform Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[
                        { label: 'Total', value: stats.total, icon: Users, bg: "bg-indigo-50 text-indigo-600" },
                        { label: 'Active', value: stats.active, icon: CheckCircle, bg: "bg-emerald-50 text-emerald-600" },
                        { label: 'Admin', value: stats.admin, icon: Shield, bg: "bg-rose-50 text-rose-600" },
                        { label: 'Warden', value: stats.warden, icon: UserCog, bg: "bg-amber-50 text-amber-600" },
                        { label: 'Staff', value: stats.staff, icon: Briefcase, bg: "bg-blue-50 text-blue-600" },
                        { label: 'Student', value: stats.resident, icon: User, bg: "bg-purple-50 text-purple-600" },
                    ].map((s, i) => (
                        <div key={i} className="bg-gradient-to-br from-white to-slate-50/50 dark:from-card dark:to-card/85 border border-indigo-100/40 dark:border-border rounded-2xl p-4 flex items-center gap-3 shadow-2xs hover:shadow-xs transition-all">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100/10 dark:border-border/30 ${s.bg}`}>
                                <s.icon className="h-4.5 w-4.5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[9px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest leading-none mb-1">{s.label}</span>
                                <span className="text-lg font-black text-gray-800 dark:text-foreground tracking-tight">{s.value ?? 0}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Search & Filter Bar */}
                <div className="bg-white dark:bg-card border border-indigo-100/40 dark:border-border rounded-2xl p-2 flex flex-col md:flex-row items-center gap-2 shadow-2xs">
                    <div className="flex-1 relative w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by Name, Email, Phone, Reg # or CNIC..."
                            className="h-11 pl-10 border-none shadow-none font-bold text-xs focus-visible:ring-0 bg-transparent placeholder:text-gray-400 text-gray-700"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="h-7 w-px bg-gray-200 dark:bg-border hidden md:block" />
                    <div className="flex items-center gap-1 p-1 bg-slate-100/80 dark:bg-muted/80 rounded-xl overflow-x-auto w-full md:w-auto scrollbar-hide">
                        {ROLES.map(r => (
                            <button key={r} onClick={() => setFilterRole(r)}
                                className={`h-8 px-3.5 rounded-lg font-bold text-[9px] uppercase tracking-wider shrink-0 transition-all ${filterRole === r ? 'bg-white dark:bg-card text-indigo-600 dark:text-indigo-400 shadow-2xs' : 'text-slate-500 hover:text-slate-900 dark:text-muted-foreground'}`}>
                                {r === 'all' ? 'All Roles' : r === 'RESIDENT' ? 'STUDENT' : r}
                            </button>
                        ))}
                    </div>
                    <div className="items-center gap-1 border-l border-gray-100 dark:border-border pl-2 hidden md:flex">
                        <Button variant="ghost" size="icon" onClick={() => setViewMode('table')} className={`h-8 w-8 rounded-xl ${viewMode === 'table' ? 'bg-gray-100 dark:bg-muted text-slate-900 dark:text-white' : 'text-gray-400'}`}>
                            <LayoutList className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setViewMode('grid')} className={`h-8 w-8 rounded-xl ${viewMode === 'grid' ? 'bg-gray-100 dark:bg-muted text-slate-900 dark:text-white' : 'text-gray-400'}`}>
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {isLoading ? (
                    <ListPageSkeleton />
                ) : filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-card rounded-3xl border border-dashed border-gray-200 dark:border-border">
                        <Fingerprint className="h-10 w-10 text-gray-300 dark:text-muted-foreground mb-3" />
                        <h3 className="text-sm font-black text-gray-900 dark:text-foreground uppercase">No Records Found</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Try adjusting your search filters</p>
                    </div>
                ) : viewMode === 'table' ? (
                    /* TABLE VIEW */
                    <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-3xl shadow-2xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50/80 dark:bg-muted/30 border-b border-gray-100 dark:border-border">
                                        {[
                                            { label: 'Name', field: 'name' },
                                            { label: 'Contact Info', field: 'email' },
                                            { label: 'Role', field: 'role' },
                                            { label: 'Hostel', field: null },
                                            { label: 'Joined', field: 'createdAt' },
                                            { label: 'Status', field: 'isActive' },
                                            { label: '', field: null },
                                        ].map((col, i) => (
                                            <th key={i}
                                                className={`px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground ${col.field ? 'cursor-pointer hover:text-gray-700 dark:hover:text-foreground' : ''}`}
                                                onClick={() => col.field && handleSort(col.field)}>
                                                <div className="flex items-center gap-2">
                                                    {col.label}
                                                    {col.field && <SortIcon field={col.field} />}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-border/40">
                                    {filteredUsers.map(u => {
                                        const rc = getRoleConfig(u.role);
                                        return (
                                            <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-muted/20 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`h-9 w-9 rounded-xl ${rc.bg} flex items-center justify-center text-xs font-black ${rc.color} shrink-0`}>
                                                            {u.name?.charAt(0)?.toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black text-gray-900 dark:text-foreground uppercase tracking-tight">{u.name}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                {u.regNumber && <p className="text-[9px] font-black text-slate-600 bg-slate-100 dark:bg-muted dark:text-slate-300 px-1.5 py-0.2 rounded uppercase tracking-wider">{u.regNumber}</p>}
                                                                {u.uid && <p className="text-[8px] font-mono text-gray-400">{u.uid}</p>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-0.5">
                                                        <p className="text-[11px] font-bold text-gray-700 dark:text-foreground truncate max-w-[200px]">{u.email}</p>
                                                        <p className="text-[10px] font-bold text-gray-400">{u.phone || '—'}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge className={`${rc.bg} ${rc.color} border-none text-[9px] font-bold uppercase px-2.5 py-0.5`}>
                                                        {u.role === 'RESIDENT' ? 'STUDENT' : u.role}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-[11px] font-bold text-gray-600 dark:text-muted-foreground truncate max-w-[140px]">
                                                        {u.Hostel_User_hostelIdToHostel?.name || <span className="text-gray-300 italic">Global</span>}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-[11px] font-bold text-gray-500">
                                                        {u.createdAt && !isNaN(new Date(u.createdAt).getTime()) ? format(new Date(u.createdAt), 'MMM dd, yyyy') : '—'}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className={`flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full ${u.isActive ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-gray-50 dark:bg-muted/20'}`}>
                                                        <div className={`h-1.5 w-1.5 rounded-full ${u.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                                                        <span className={`text-[9px] font-bold uppercase tracking-wider ${u.isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                            {u.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1 justify-end">
                                                        <Link href={u.role === 'WARDEN' ? `/admin/wardens/${u.id}` : `/admin/users-records/${u.id}`}>
                                                            <Button variant="ghost" size="sm" className="h-8 px-3 rounded-xl text-[9px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-muted">
                                                                View <ChevronRight className="h-3 w-3 ml-1" />
                                                            </Button>
                                                        </Link>
                                                        <UserActions user={u} />
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-3 border-t border-gray-100 dark:border-border flex items-center justify-between">
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                Displaying {filteredUsers.length} of {users?.length || 0} user records
                            </p>
                        </div>
                    </div>
                ) : (
                    /* GRID VIEW */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredUsers.map(u => {
                            const rc = getRoleConfig(u.role);
                            return (
                                <div key={u.id} className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-3xl p-5 hover:shadow-md transition-all group relative overflow-hidden flex flex-col">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`h-11 w-11 rounded-2xl ${rc.bg} ${rc.color} flex items-center justify-center border ${rc.border} text-lg font-black shrink-0`}>
                                            {u.name?.charAt(0)?.toUpperCase()}
                                        </div>
                                        <UserActions user={u} />
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        <div>
                                            <h3 className="text-sm font-black text-gray-900 dark:text-foreground uppercase tracking-tight">{u.name}</h3>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                <Badge className={`${rc.bg} ${rc.color} border-none text-[8px] font-bold uppercase px-2 py-0.5`}>{u.role === 'RESIDENT' ? 'STUDENT' : u.role}</Badge>
                                                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${u.isActive ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-gray-50 dark:bg-muted/20'}`}>
                                                    <div className={`h-1.5 w-1.5 rounded-full ${u.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                                                    <span className={`text-[8px] font-bold uppercase ${u.isActive ? 'text-emerald-600' : 'text-gray-400'}`}>{u.isActive ? 'Active' : 'Inactive'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-1 text-[11px] pt-1">
                                            <div className="flex items-center gap-2 text-gray-500"><Mail className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{u.email}</span></div>
                                            <div className="flex items-center gap-2 text-gray-500"><Phone className="h-3.5 w-3.5 shrink-0" /><span>{u.phone || '—'}</span></div>
                                            <div className="flex items-center gap-2 text-gray-500"><Building2 className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{u.Hostel_User_hostelIdToHostel?.name || 'Global'}</span></div>
                                        </div>
                                    </div>
                                    <Separator className="bg-gray-100 dark:bg-border my-3" />
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            {u.regNumber && <span className="text-[9px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">REG: {u.regNumber}</span>}
                                            <span className="text-[8px] font-mono text-gray-400">{u.uid || '#' + u.id?.slice(-8).toUpperCase()}</span>
                                        </div>
                                        <Link href={u.role === 'WARDEN' ? `/admin/wardens/${u.id}` : `/admin/users-records/${u.id}`}>
                                            <Button variant="outline" className="h-8 px-3 rounded-xl font-bold text-[9px] uppercase tracking-wider text-slate-900 dark:text-slate-100 border-gray-200 dark:border-border bg-gray-50 dark:bg-muted hover:bg-slate-900 hover:text-white transition-all">
                                                View <ChevronRight className="h-3 w-3 ml-1" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Edit Profile Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-xl p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white dark:bg-card flex flex-col max-h-[90vh]">
                    <div className="bg-indigo-600 px-8 py-6 flex items-center gap-4 shrink-0">
                        <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center"><Settings2 className="h-6 w-6 text-white" /></div>
                        <div><h2 className="text-lg font-black text-white uppercase tracking-tight">Edit Information</h2><p className="text-[9px] text-white/70 uppercase tracking-widest mt-0.5">Update account profile details</p></div>
                    </div>
                    <div className="p-8 overflow-y-auto space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'Full Name', field: 'name' }, { label: 'Email Address', field: 'email' },
                                { label: 'Phone Number', field: 'phone' }, { label: 'CNIC / Identity', field: 'cnic' },
                            ].map(({ label, field }) => (
                                <div key={field} className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</Label>
                                    <Input className="h-11 rounded-xl border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/20 font-bold text-xs"
                                        value={selectedUser?.[field] || ''} onChange={e => setSelectedUser({ ...selectedUser, [field]: e.target.value })} />
                                </div>
                            ))}
                        </div>
                        {selectedUser?.role === 'WARDEN' && (
                            <div className="space-y-4 pt-2">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Expense Permissions</Label>
                                <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 dark:bg-muted/20 rounded-xl border border-gray-100 dark:border-border">
                                    <div className="flex items-center gap-3 col-span-2 pb-2 border-b border-gray-200 dark:border-border">
                                        <input
                                            type="checkbox"
                                            id="edit-manage-expenses"
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                            checked={selectedUser.canManageExpenses || false}
                                            onChange={(e) => setSelectedUser({ ...selectedUser, canManageExpenses: e.target.checked })}
                                        />
                                        <Label htmlFor="edit-manage-expenses" className="text-[11px] font-bold text-gray-900 dark:text-foreground cursor-pointer uppercase">Master Access (All)</Label>
                                    </div>
                                    {[
                                        { id: 'canManageMess', label: 'Mess' },
                                        { id: 'canManageGeneral', label: 'General' },
                                        { id: 'canManageUtilities', label: 'Utilities' },
                                        { id: 'canManageMaintenance', label: 'Maintenance' },
                                        { id: 'canManageSalaries', label: 'Salaries' },
                                    ].map(p => (
                                        <div key={p.id} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id={`edit-${p.id}`}
                                                disabled={selectedUser.canManageExpenses}
                                                className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                                checked={selectedUser.canManageExpenses || selectedUser[p.id] || false}
                                                onChange={(e) => setSelectedUser({ ...selectedUser, [p.id]: e.target.checked })}
                                            />
                                            <Label htmlFor={`edit-${p.id}`} className={`text-[10px] font-bold uppercase cursor-pointer ${selectedUser.canManageExpenses ? 'text-gray-300' : 'text-gray-600 dark:text-muted-foreground'}`}>{p.label}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="flex gap-3 pt-4">
                            <Button variant="outline" className="flex-1 h-12 rounded-2xl font-bold text-[10px] uppercase tracking-wider" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                            <Button className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-2xl shadow-md" onClick={handleEditUser} disabled={updateAnyUser.isPending}>
                                {updateAnyUser.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Password Reset Dialog */}
            <Dialog open={isAccessDialogOpen} onOpenChange={setIsAccessDialogOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white dark:bg-card">
                    <div className="bg-indigo-600 px-8 py-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center"><ShieldCheck className="h-6 w-6 text-white" /></div>
                        <div><h2 className="text-lg font-black text-white uppercase tracking-tight">Reset Password</h2><p className="text-[9px] text-white/70 uppercase tracking-widest mt-0.5">For {selectedUser?.name}</p></div>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">New Temporary Password</Label>
                            <Input type="text" className="h-12 rounded-xl border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/20 text-center font-black tracking-wider text-base"
                                value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                        </div>
                        <Button className="w-full h-12 bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase tracking-wider rounded-2xl shadow-md" onClick={handleResetPassword} disabled={resetPassword.isPending}>
                            {resetPassword.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reset Password Now'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Role Change Dialog */}
            <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white dark:bg-card">
                    <div className="bg-indigo-600 px-8 py-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center"><UserCog className="h-6 w-6 text-white" /></div>
                        <div><h2 className="text-lg font-black text-white uppercase tracking-tight">User Role & Access</h2><p className="text-[9px] text-white/70 uppercase tracking-widest mt-0.5">For {selectedUser?.name}</p></div>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Selected System Role</Label>
                            <select className="w-full h-12 rounded-xl border border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/20 px-4 font-bold text-sm uppercase outline-none focus:ring-2 focus:ring-indigo-600"
                                value={selectedUser?.role || ''} onChange={e => setSelectedUser({ ...selectedUser, role: e.target.value })}>
                                <option value="ADMIN">Administrator</option>
                                <option value="WARDEN">Hostel Warden</option>
                                <option value="STAFF">Facility Staff</option>
                                <option value="RESIDENT">Student</option>
                            </select>
                        </div>
                        {selectedUser?.role === 'WARDEN' && (
                            <div className="space-y-4 pt-2">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Expense Permissions</Label>
                                <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 dark:bg-muted/20 rounded-xl border border-gray-100 dark:border-border">
                                    <div className="flex items-center gap-3 col-span-2 pb-2 border-b border-gray-200 dark:border-border">
                                        <input
                                            type="checkbox"
                                            id="role-manage-expenses"
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                            checked={selectedUser.canManageExpenses || false}
                                            onChange={(e) => setSelectedUser({ ...selectedUser, canManageExpenses: e.target.checked })}
                                        />
                                        <Label htmlFor="role-manage-expenses" className="text-[11px] font-bold text-gray-900 dark:text-foreground cursor-pointer uppercase">Master Access (All)</Label>
                                    </div>
                                    {[
                                        { id: 'canManageMess', label: 'Mess' },
                                        { id: 'canManageGeneral', label: 'General' },
                                        { id: 'canManageUtilities', label: 'Utilities' },
                                        { id: 'canManageMaintenance', label: 'Maintenance' },
                                        { id: 'canManageSalaries', label: 'Salaries' },
                                    ].map(p => (
                                        <div key={p.id} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id={`role-${p.id}`}
                                                disabled={selectedUser.canManageExpenses}
                                                className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                                checked={selectedUser.canManageExpenses || selectedUser[p.id] || false}
                                                onChange={(e) => setSelectedUser({ ...selectedUser, [p.id]: e.target.checked })}
                                            />
                                            <Label htmlFor={`role-${p.id}`} className={`text-[10px] font-bold uppercase cursor-pointer ${selectedUser.canManageExpenses ? 'text-gray-300' : 'text-gray-600 dark:text-muted-foreground'}`}>{p.label}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <Button className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-2xl shadow-md" onClick={handleUpdateRole} disabled={updateAnyUser.isPending}>
                            {updateAnyUser.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Role'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Create User Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white dark:bg-card flex flex-col max-h-[90vh]">
                    <div className="bg-indigo-600 px-8 py-6 flex items-center gap-4 shrink-0">
                        <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center"><Plus className="h-6 w-6 text-white" /></div>
                        <div><h2 className="text-lg font-black text-white uppercase tracking-tight">Create User Record</h2><p className="text-[9px] text-white/70 uppercase tracking-widest mt-0.5">Enroll new user account</p></div>
                    </div>
                    <div className="p-8 overflow-y-auto space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'Full Name', field: 'name', placeholder: 'Enter full name' },
                                { label: 'Email Address', field: 'email', placeholder: 'email@hostel.com' },
                                { label: 'Phone Number', field: 'phone', placeholder: '03XX-XXXXXXX' },
                                { label: 'CNIC / Identity', field: 'cnic', placeholder: 'XXXXX-XXXXXXX-X' },
                            ].map(({ label, field, placeholder }) => (
                                <div key={field} className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</Label>
                                    <Input placeholder={placeholder} className="h-11 rounded-xl border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/20 font-bold text-xs"
                                        value={formData[field]} onChange={e => setFormData({ ...formData, [field]: e.target.value })} />
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Account Role</Label>
                                <select className="w-full h-11 rounded-xl border border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/20 px-3 font-bold text-xs uppercase outline-none focus:ring-2 focus:ring-indigo-600"
                                    value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                    <option value="ADMIN">Admin</option>
                                    <option value="WARDEN">Hostel Warden</option>
                                    <option value="STAFF">Facility Staff</option>
                                    <option value="RESIDENT">Student / Resident</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Hostel Branch</Label>
                                <select className="w-full h-11 rounded-xl border border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/20 px-3 font-bold text-xs uppercase outline-none focus:ring-2 focus:ring-indigo-600"
                                    value={formData.hostelId} onChange={e => setFormData({ ...formData, hostelId: e.target.value })}>
                                    <option value="">None (Global)</option>
                                    {hostels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                </select>
                            </div>
                        </div>
                        {(formData.role === 'STAFF' || formData.role === 'WARDEN') && (
                            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-muted/20 rounded-2xl border border-gray-100 dark:border-border">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Job Title</Label>
                                    <Input placeholder="e.g. Facility Manager" className="h-11 rounded-xl border-gray-200 dark:border-border bg-white dark:bg-card font-bold text-xs"
                                        value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Basic Salary (PKR)</Label>
                                    <Input type="number" placeholder="45000" className="h-11 rounded-xl border-gray-200 dark:border-border bg-white dark:bg-card font-bold text-xs"
                                        value={formData.basicSalary} onChange={e => setFormData({ ...formData, basicSalary: Number(e.target.value) })} />
                                </div>
                            </div>
                        )}
                        {formData.role === 'WARDEN' && (
                            <div className="space-y-3 pt-2">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Warden Expense Permissions</Label>
                                <div className="grid grid-cols-2 gap-2.5 p-4 bg-gray-50 dark:bg-muted/20 rounded-2xl border border-gray-100 dark:border-border">
                                    <div className="flex items-center gap-2.5 col-span-2 pb-2 border-b border-gray-200 dark:border-border">
                                        <input
                                            type="checkbox"
                                            id="create-manage-expenses"
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                            checked={formData.canManageExpenses || false}
                                            onChange={(e) => setFormData({ ...formData, canManageExpenses: e.target.checked })}
                                        />
                                        <Label htmlFor="create-manage-expenses" className="text-[11px] font-bold text-gray-900 dark:text-foreground cursor-pointer uppercase">Master Access (All Expenses)</Label>
                                    </div>
                                    {[
                                        { id: 'canManageMess', label: 'Mess' },
                                        { id: 'canManageGeneral', label: 'General' },
                                        { id: 'canManageUtilities', label: 'Utilities' },
                                        { id: 'canManageMaintenance', label: 'Maintenance' },
                                        { id: 'canManageSalaries', label: 'Salaries' },
                                    ].map(p => (
                                        <div key={p.id} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id={`create-${p.id}`}
                                                disabled={formData.canManageExpenses}
                                                className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                                checked={formData.canManageExpenses || formData[p.id] || false}
                                                onChange={(e) => setFormData({ ...formData, [p.id]: e.target.checked })}
                                            />
                                            <Label htmlFor={`create-${p.id}`} className={`text-[10px] font-bold uppercase cursor-pointer ${formData.canManageExpenses ? 'text-gray-300' : 'text-gray-600 dark:text-muted-foreground'}`}>{p.label}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" className="flex-1 h-12 rounded-2xl font-bold text-[10px] uppercase tracking-wider" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                            <Button className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-2xl shadow-md flex items-center justify-center gap-2"
                                onClick={handleCreateUser} disabled={createUser.isPending || !formData.name || !formData.email}>
                                {createUser.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ShieldCheck className="h-4 w-4" /> Save User</>}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
};

export default UserRecordPage;
