"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Shield,
  User,
  UserCog,
  UserCheck,
  ChevronRight,
  Search,
  Mail,
  Phone,
  Building2,
  Calendar,
  CheckCircle,
  FileText,
  CreditCard,
  Wrench,
  AlertTriangle,
  DollarSign,
  Clock,
  XCircle,
  Plus,
  Filter,
  MoreVertical,
  Settings2,
  Trash2,
  MapPin,
  Fingerprint,
  ShieldCheck,
  Loader2,
  Zap,
  Briefcase,
  UserPlus,
  LayoutGrid,
  LayoutList,
  TrendingUp,
  Users,
  ArrowUpDown,
  SortAsc,
  SortDesc,
  Download,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListPageSkeleton } from "@/components/ui/skeletons";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAllUsers,
  useCreateUser,
  useUpdateAnyUser,
  useDeleteUser,
  useResetPassword,
} from "@/hooks/useUsers";
import { useHostel } from "@/hooks/usehostel";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import useAuthStore from "@/hooks/Authstate";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { exportToExcel } from "@/lib/utils/exportToExcel";
import PageHeader from "@/components/Dashboard/PageHeader";
import FilterToolbar from "@/components/Dashboard/FilterToolbar";
import EmptyState from "@/components/ui/states/EmptyState";

const ROLES = ["all", "RESIDENT"];
const GET_ROLES_FOR_USER = (role) => {
  if (role === "WARDEN") return ["all", "RESIDENT"];
  return ["all", "RESIDENT", "STAFF", "WARDEN"];
};

const ROLE_CONFIG = {
  ADMIN: {
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-100",
    icon: Shield,
    dot: "bg-rose-500",
  },
  WARDEN: {
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
    icon: UserCog,
    dot: "bg-amber-500",
  },
  STAFF: {
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
    icon: Briefcase,
    dot: "bg-blue-500",
  },
  RESIDENT: {
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    icon: User,
    dot: "bg-emerald-500",
  },
  GUEST: {
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-100",
    icon: User,
    dot: "bg-purple-500",
  },
};
const getRoleConfig = (role) =>
  ROLE_CONFIG[role] || {
    color: "text-gray-600 dark:text-muted-foreground",
    bg: "bg-gray-50 dark:bg-muted/10",
    border: "border-gray-100 dark:border-border",
    icon: User,
    dot: "bg-gray-400",
  };

const WardenUserRecordPage = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [viewMode, setViewMode] = useState("table"); // "table" | "grid"
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isAccessDialogOpen, setIsAccessDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("hostel123");

  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "ADMIN";
  const isWarden = user?.role === "WARDEN";

  const { data: users, isLoading } = useAllUsers({
    role: filterRole,
    query: searchQuery,
    hostelId: isWarden && !isAdmin ? user?.hostelId : undefined,
  });

  const { data: hostelsData } = useHostel();
  const hostels = hostelsData?.data || [];

  const createUser = useCreateUser();
  const updateAnyUser = useUpdateAnyUser();
  const deleteUser = useDeleteUser();
  const resetPassword = useResetPassword();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "password123",
    phone: "",
    cnic: "",
    role: "RESIDENT",
    hostelId: user?.hostelId || "",
    designation: "",
    basicSalary: 0,
    canManageExpenses: false,
    canManageMess: false,
    canManageGeneral: false,
    canManageUtilities: false,
    canManageMaintenance: false,
    canManageSalaries: false,
  });

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    let list = users.filter(
      (u) =>
        (u.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (u.email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (u.phone || "").includes(searchQuery) ||
        (u.cnic || "").includes(searchQuery) ||
        (u.uid?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (u.regNumber?.toLowerCase() || "").includes(searchQuery.toLowerCase()),
    );
    list = list.sort((a, b) => {
      let av = a[sortBy] || "",
        bv = b[sortBy] || "";
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      return sortDir === "asc" ? (av > bv ? 1 : -1) : av < bv ? 1 : -1;
    });
    return list;
  }, [users, searchQuery, sortBy, sortDir]);

  const stats = useMemo(() => {
    if (!users) return {};
    return {
      total: users.length,
      active: users.filter((u) => u.isActive).length,
      warden: users.filter((u) => u.role === "WARDEN").length,
      staff: users.filter((u) => u.role === "STAFF").length,
      resident: users.filter((u) => u.role === "RESIDENT").length,
    };
  }, [users]);

  const handleSort = (field) => {
    if (sortBy === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field)
      return <ArrowUpDown className="h-3 w-3 text-gray-300" />;
    return sortDir === "asc" ? (
      <SortAsc className="h-3 w-3 text-indigo-600" />
    ) : (
      <SortDesc className="h-3 w-3 text-indigo-600" />
    );
  };

  const handleExport = () => {
    if (!filteredUsers.length) return toast.error("No users to export");
    const rows = filteredUsers.map((u) => ({
      "Reg #": u.regNumber || "—",
      "Name": u.name,
      "Email": u.email,
      "Phone": u.phone || "",
      "CNIC": u.cnic || "",
      "Role": u.role === "RESIDENT" ? "STUDENT" : u.role,
      "Hostel": u.Hostel_User_hostelIdToHostel?.name || "Assigned",
      "Status": u.isActive ? "Active" : "Inactive",
      "System ID": u.uid || u.id,
      "Room": u.Room_User_idToRoom?.roomNumber || "N/A",
      "Joined": u.createdAt ? format(new Date(u.createdAt), "yyyy-MM-dd") : "",
    }));
    exportToExcel(rows, `Residents_Directory_${format(new Date(), "yyyyMMdd")}`, "Residents");
  };

  const handleExportPDF = () => {
    if (!filteredUsers.length) return toast.error("No users to export");

    try {
      const doc = new jsPDF("landscape");

      // Header
      doc.setFillColor(63, 63, 70);
      doc.rect(0, 0, doc.internal.pageSize.width, 30, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(
        "RESIDENT & USER DIRECTORY",
        doc.internal.pageSize.width / 2,
        15,
        { align: "center" },
      );

      doc.setFontSize(10);
      doc.text(
        `Generated on: ${format(new Date(), "PPP p")}`,
        doc.internal.pageSize.width / 2,
        22,
        { align: "center" },
      );

      const headers = [
        ["Reg #", "Name", "Email", "Phone", "Role", "Room", "Status"],
      ];
      const rows = filteredUsers.map((u) => [
        u.regNumber || "—",
        u.name,
        u.email,
        u.phone || "N/A",
        u.role === "RESIDENT" ? "STUDENT" : u.role,
        u.Room_User_idToRoom?.roomNumber || "N/A",
        u.isActive ? "Active" : "Inactive",
      ]);

      autoTable(doc, {
        head: headers,
        body: rows,
        startY: 40,
        theme: "grid",
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: "bold",
          halign: "center",
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [50, 50, 50],
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
        margin: { top: 40 },
      });

      doc.save(`Users_Report_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`);
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
        name: "",
        email: "",
        password: "password123",
        phone: "",
        cnic: "",
        role: "RESIDENT",
        hostelId: user?.hostelId || "",
        designation: "",
        basicSalary: 0,
        canManageExpenses: false,
      });
    } catch {}
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    try {
      await updateAnyUser.mutateAsync({
        id: selectedUser.id,
        data: selectedUser,
      });
      setIsEditDialogOpen(false);
    } catch {}
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    try {
      await resetPassword.mutateAsync({ id: selectedUser.id, newPassword });
      setIsAccessDialogOpen(false);
      setNewPassword("hostel123");
    } catch {}
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    try {
      await updateAnyUser.mutateAsync({
        id: selectedUser.id,
        data: {
          role: selectedUser.role,
          canManageExpenses: selectedUser.canManageExpenses,
        },
      });
      setIsRoleDialogOpen(false);
    } catch {}
  };

  const handleDelete = (id) => {
    if (confirm("Delete this user? This cannot be undone."))
      deleteUser.mutateAsync(id).catch(() => {});
  };

  const UserActions = ({ user: itemUser }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-xl hover:bg-gray-100 shrink-0"
        >
          <MoreVertical className="h-4 w-4 text-gray-400 dark:text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-52 rounded-2xl p-2 shadow-2xl border-gray-100 dark:border-border"
      >
        <DropdownMenuItem
          onClick={() => router.push(`/warden/residents/${itemUser.id}`)}
          className="h-10 rounded-xl font-bold text-[10px] uppercase tracking-widest cursor-pointer flex items-center gap-2"
        >
          <Eye className="h-4 w-4 text-gray-400 dark:text-muted-foreground" /> View
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setSelectedUser({ ...itemUser });
            setIsEditDialogOpen(true);
          }}
          className="h-10 rounded-xl font-bold text-[10px] uppercase tracking-widest cursor-pointer flex items-center gap-2"
        >
          <Settings2 className="h-4 w-4 text-gray-400 dark:text-muted-foreground" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setSelectedUser(itemUser);
            setIsAccessDialogOpen(true);
          }}
          className="h-10 rounded-xl font-bold text-[10px] uppercase tracking-widest cursor-pointer text-blue-600 flex items-center gap-2"
        >
          <Zap className="h-4 w-4" /> Reset
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-gray-50 dark:bg-muted/10 mx-2 my-1" />
        <DropdownMenuItem
          onClick={() => handleDelete(itemUser.id)}
          className="h-10 rounded-xl font-bold text-[10px] uppercase tracking-widest cursor-pointer text-rose-600 hover:bg-rose-50 flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-muted/10/30 pb-20 font-sans">
      <PageHeader
        title="Records"
        subtitleStart={`${stats.total || 0} Total People`}
        subtitleEnd=""
        maxWidthClass="max-w-[1600px]"
        accentColorClass="bg-indigo-600"
        dotColorClass="bg-gray-200"
        subtitleEndClass="text-gray-400 dark:text-muted-foreground"
        rightSlot={(
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-9 px-4 rounded-xl border border-gray-100 dark:border-border text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-muted-foreground hover:bg-gray-50 dark:hover:bg-muted/5 dark:bg-muted/10 flex items-center gap-2"
                >
                  <Download className="h-3.5 w-3.5" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-40 rounded-xl p-2 shadow-xl border-gray-100 dark:border-border"
              >
                <DropdownMenuItem
                  onClick={handleExport}
                  className="h-10 rounded-lg font-bold text-[10px] uppercase tracking-widest cursor-pointer flex items-center gap-2"
                >
                  <FileText className="h-4 w-4 text-emerald-500" /> Excel Directory
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleExportPDF}
                  className="h-10 rounded-lg font-bold text-[10px] uppercase tracking-widest cursor-pointer flex items-center gap-2"
                >
                  <Download className="h-4 w-4 text-emerald-500" /> PDF Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(true)}
              className="h-9 px-4 rounded-xl border-gray-200 dark:border-border text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"
            >
              <Plus className="h-3.5 w-3.5" /> New
            </Button>
            <Button
              onClick={() => router.push("/warden/residents/register")}
              className="h-9 px-5 rounded-xl bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-200 flex items-center gap-2"
            >
              <UserPlus className="h-3.5 w-3.5" /> Enroll
            </Button>
          </div>
        )}
      />

      <main className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: "Total Records",
              value: stats.total,
              color: "bg-gray-950 text-white",
              dot: "",
            },
            {
              label: "Active Stay",
              value: stats.active,
              color: "bg-emerald-50 text-emerald-800",
              dot: "bg-emerald-500",
            },
            {
              label: "Students",
              value: stats.resident,
              color: "bg-purple-50 text-purple-800",
              dot: "bg-purple-500",
            },
          ].map((s, i) => (
            <div
              key={i}
              className={`${s.color} rounded-2xl p-4 shadow-sm ${i === 0 ? "col-span-2 md:col-span-1" : ""}`}
            >
              {s.dot && (
                <div className={`h-2 w-2 rounded-full ${s.dot} mb-3`} />
              )}
              <p className="text-2xl font-black tracking-tight">
                {s.value ?? 0}
              </p>
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-1">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        <FilterToolbar
          containerClassName="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-2 flex flex-col md:flex-row items-center gap-2 shadow-sm"
          searchSlot={(
          <div className="flex-1 relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
            <Input
              placeholder="Search Residents..."
              className="h-12 pl-10 border-none shadow-none font-bold text-sm focus-visible:ring-0 bg-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          )}
          dividerClassName="h-8 w-px bg-gray-100 hidden md:block"
          filtersSlot={(
          <div className="flex items-center gap-1 p-1 bg-gray-50 dark:bg-muted/10 rounded-xl overflow-x-auto w-full md:w-auto scrollbar-hide">
            {GET_ROLES_FOR_USER(user?.role).map((r) => (
              <button
                key={r}
                onClick={() => setFilterRole(r)}
                className={`h-9 px-4 rounded-lg font-bold text-[9px] uppercase tracking-widest shrink-0 transition-all ${filterRole === r ? "bg-white dark:bg-card text-indigo-600 shadow-sm border border-gray-100 dark:border-border" : "text-gray-400 dark:text-muted-foreground hover:text-gray-600 dark:text-muted-foreground"}`}
              >
                {r === "all" ? "Type" : r === "RESIDENT" ? "STUDENT" : r}
              </button>
            ))}
          </div>
          )}
          rightSlot={(
          <div className="flex items-center gap-1 border-l border-gray-100 dark:border-border pl-2 hidden md:flex">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("table")}
              className={`h-9 w-9 rounded-xl ${viewMode === "table" ? "bg-indigo-50 text-indigo-600" : "text-gray-400 dark:text-muted-foreground"}`}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("grid")}
              className={`h-9 w-9 rounded-xl ${viewMode === "grid" ? "bg-indigo-50 text-indigo-600" : "text-gray-400 dark:text-muted-foreground"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          )}
        />

        {isLoading ? (
          <ListPageSkeleton />
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            icon={Fingerprint}
            title="Clear"
            description="No users found in this hostel."
            containerClassName="flex flex-col items-center justify-center py-24 bg-white dark:bg-card rounded-3xl border border-dashed border-gray-200 dark:border-border"
            iconWrapperClassName="bg-transparent border-transparent mb-0"
            iconClassName="text-gray-200"
          />
        ) : viewMode === "table" ? (
          /* ─── TABLE VIEW ─── */
          <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 dark:bg-muted/10 border-b border-gray-100 dark:border-border">
                    {[
                      { label: "Resident", field: "name" },
                      { label: "Info", field: "email" },
                      { label: "Role", field: "role" },
                      { label: "Room", field: null },
                      { label: "Stay Date", field: "createdAt" },
                      { label: "Status", field: "isActive" },
                      { label: "", field: null },
                    ].map((col, i) => (
                      <th
                        key={i}
                        className={`px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground ${col.field ? "cursor-pointer hover:text-gray-700 dark:text-foreground" : ""}`}
                        onClick={() => col.field && handleSort(col.field)}
                      >
                        <div className="flex items-center gap-2">
                          {col.label}
                          {col.field && <SortIcon field={col.field} />}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-border/20">
                  {filteredUsers.map((u) => {
                    const rc = getRoleConfig(u.role);
                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-gray-50 dark:hover:bg-muted/5 dark:bg-muted/10/50 dark:bg-background transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-9 w-9 rounded-xl ${rc.bg} flex items-center justify-center text-xs font-black ${rc.color} shrink-0`}
                            >
                              {u.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-foreground uppercase tracking-tight">
                                {u.name}
                              </p>
                              <div className="flex items-center gap-2">
                                {u.regNumber && (
                                  <p className="text-[9px] font-black text-blue-600 bg-blue-50 px-1 rounded uppercase tracking-widest">
                                    {u.regNumber}
                                  </p>
                                )}
                                {u.uid && (
                                  <p className="text-[8px] font-mono text-gray-400 dark:text-muted-foreground">
                                    {u.uid}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-0.5">
                            <p className="text-[11px] font-bold text-gray-600 dark:text-muted-foreground truncate max-w-[200px]">
                              {u.email}
                            </p>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground">
                              {u.phone || "—"}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            className={`${rc.bg} ${rc.color} border-none text-[9px] font-bold uppercase px-2.5 py-0.5`}
                          >
                            {u.role === "RESIDENT" ? "STUDENT" : u.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-[11px] font-bold text-gray-600 dark:text-muted-foreground truncate max-w-[140px]">
                            {u.Room_User_idToRoom?.roomNumber ? (
                              `ROOM ${u.Room_User_idToRoom.roomNumber}`
                            ) : (
                              <span className="text-gray-300 italic">
                                Unassigned
                              </span>
                            )}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-[11px] font-bold text-gray-500 dark:text-muted-foreground">
                            {u.createdAt &&
                            !isNaN(new Date(u.createdAt).getTime())
                              ? format(new Date(u.createdAt), "MMM dd, yyyy")
                              : "—"}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div
                            className={`flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full ${u.isActive ? "bg-emerald-50" : "bg-gray-50 dark:bg-muted/10"}`}
                          >
                            <div
                              className={`h-1.5 w-1.5 rounded-full ${u.isActive ? "bg-emerald-500 animate-pulse" : "bg-gray-300"}`}
                            />
                            <span
                              className={`text-[9px] font-bold uppercase tracking-widest ${u.isActive ? "text-emerald-600" : "text-gray-400 dark:text-muted-foreground"}`}
                            >
                              {u.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 justify-end">
                            <Link href={`/warden/residents/${u.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-3 rounded-xl text-[9px] font-bold uppercase tracking-wider text-indigo-600 hover:bg-indigo-50"
                              >
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
          </div>
        ) : (
          /* ─── GRID VIEW ─── */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredUsers.map((u) => {
              const rc = getRoleConfig(u.role);
              return (
                <div
                  key={u.id}
                  className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-[2rem] p-6 hover:shadow-xl hover:shadow-indigo-100/50 transition-all group relative overflow-hidden flex flex-col"
                >
                  <div
                    className={`absolute top-0 right-0 w-32 h-32 ${rc.bg} rounded-bl-full opacity-10 -mr-12 -mt-12`}
                  />
                  <div className="flex items-start justify-between mb-5 relative">
                    <div
                      className={`h-12 w-12 rounded-2xl ${rc.bg} ${rc.color} flex items-center justify-center border ${rc.border} text-xl font-black`}
                    >
                      {u.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <UserActions user={u} />
                  </div>
                  <div className="space-y-3 flex-1">
                    <div>
                      <h3 className="text-base font-black text-gray-900 dark:text-foreground uppercase tracking-tight">
                        {u.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge
                          className={`${rc.bg} ${rc.color} border-none text-[8px] font-bold uppercase px-2 py-0.5`}
                        >
                          {u.role === "RESIDENT" ? "STUDENT" : u.role}
                        </Badge>
                        <div
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${u.isActive ? "bg-emerald-50" : "bg-gray-50 dark:bg-muted/10"}`}
                        >
                          <div
                            className={`h-1.5 w-1.5 rounded-full ${u.isActive ? "bg-emerald-500 animate-pulse" : "bg-gray-300"}`}
                          />
                          <span
                            className={`text-[8px] font-bold uppercase ${u.isActive ? "text-emerald-600" : "text-gray-400 dark:text-muted-foreground"}`}
                          >
                            {u.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{u.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500 dark:text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span>{u.phone || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500 dark:text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {u.Room_User_idToRoom?.roomNumber
                            ? `ROOM ${u.Room_User_idToRoom.roomNumber}`
                            : "Hostel Member"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Separator className="bg-gray-50 dark:bg-muted/10 my-4" />
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      {u.regNumber && (
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                          REG: {u.regNumber}
                        </span>
                      )}
                      <span className="text-[8px] font-mono text-gray-300">
                        {u.uid || "#" + u.id?.slice(-8).toUpperCase()}
                      </span>
                    </div>
                    <Link href={`/warden/residents/${u.id}`}>
                      <Button
                        variant="outline"
                        className="h-8 px-3 rounded-xl font-bold text-[9px] uppercase tracking-wider text-indigo-600 border-indigo-100 bg-indigo-50 hover:bg-indigo-600 hover:text-white transition-all"
                      >
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl bg-white dark:bg-card flex flex-col max-h-[90vh]">
          <div className="bg-indigo-600 px-8 py-6 flex items-center gap-4 shrink-0">
            <div className="h-12 w-12 rounded-2xl bg-white dark:bg-card/15 flex items-center justify-center">
              <Settings2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-tight">
                Edit
              </h2>
              <p className="text-[9px] text-white/60 uppercase tracking-widest mt-0.5">
                User Details
              </p>
            </div>
          </div>
          <div className="p-8 overflow-y-auto space-y-5">
            <div className="grid grid-cols-2 gap-5">
              {[
                { label: "Name", field: "name" },
                { label: "Email", field: "email" },
                { label: "Phone", field: "phone" },
                { label: "CNIC", field: "cnic" },
              ].map(({ label, field }) => (
                <div key={field} className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted-foreground">
                    {label}
                  </Label>
                  <Input
                    className="h-11 rounded-xl border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/10 font-bold text-sm"
                    value={selectedUser?.[field] || ""}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        [field]: e.target.value,
                      })
                    }
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="ghost"
                className="flex-1 h-12 rounded-xl font-bold text-[10px] uppercase tracking-widest"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-[2] h-12 bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl shadow-lg"
                onClick={handleEditUser}
                disabled={updateAnyUser.isPending}
              >
                {updateAnyUser.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={isAccessDialogOpen} onOpenChange={setIsAccessDialogOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl bg-white dark:bg-card">
          <div className="bg-indigo-600 px-8 py-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white dark:bg-card/15 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-tight">
                Access
              </h2>
              <p className="text-[9px] text-white/60 uppercase tracking-widest mt-0.5">
                Reset Password for {selectedUser?.name}
              </p>
            </div>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted-foreground">
                New Secure Password
              </Label>
              <Input
                type="text"
                className="h-14 rounded-xl border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/10 text-center font-black tracking-widest text-lg"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <p className="text-[9px] text-gray-400 dark:text-muted-foreground text-center italic">
                User will be able to login with this password immediately.
              </p>
            </div>
            <Button
              className="w-full h-12 bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl"
              onClick={handleResetPassword}
              disabled={resetPassword.isPending}
            >
              {resetPassword.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirm Reset"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl bg-white dark:bg-card flex flex-col max-h-[90vh]">
          <div className="bg-indigo-600 px-8 py-6 flex items-center gap-4 shrink-0">
            <div className="h-12 w-12 rounded-2xl bg-white dark:bg-card/15 flex items-center justify-center">
              <Plus className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-tight">
                Register
              </h2>
              <p className="text-[9px] text-white/60 uppercase tracking-widest mt-0.5">
                Direct Registration
              </p>
            </div>
          </div>
          <div className="p-8 overflow-y-auto space-y-6">
            <div className="grid grid-cols-2 gap-5">
              {[
                { label: "Name", field: "name", placeholder: "Enter name" },
                {
                  label: "Email",
                  field: "email",
                  placeholder: "email@mghostels.com",
                },
                { label: "Phone", field: "phone", placeholder: "03XX-XXXXXXX" },
                {
                  label: "CNIC",
                  field: "cnic",
                  placeholder: "XXXXX-XXXXXXX-X",
                },
              ].map(({ label, field, placeholder }) => (
                <div key={field} className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted-foreground">
                    {label}
                  </Label>
                  <Input
                    placeholder={placeholder}
                    className="h-11 rounded-xl border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/10 font-bold text-sm"
                    value={formData[field]}
                    onChange={(e) =>
                      setFormData({ ...formData, [field]: e.target.value })
                    }
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted-foreground">
                  Account Type
                </Label>
                <select
                  className="w-full h-11 rounded-xl border border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/10 px-4 font-bold text-sm uppercase outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                >
                  <option value="RESIDENT">Student / Resident</option>
                  {!isWarden && (
                    <>
                      <option value="STAFF">Maintenance Staff</option>
                      <option value="WARDEN">Assistant Warden</option>
                    </>
                  )}
                </select>
              </div>
              <div className="space-y-1.5 opacity-50">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted-foreground">
                  Hostel Allocation
                </Label>
                <div className="h-11 rounded-xl border border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/10 px-4 flex items-center font-bold text-xs uppercase text-gray-500 dark:text-muted-foreground">
                  {isWarden ? "Your Managed Hostel" : "Global Assignment"}
                </div>
              </div>
            </div>
            {(formData.role === "STAFF" || formData.role === "WARDEN") && (
              <div className="grid grid-cols-2 gap-5 p-5 bg-gray-50 dark:bg-muted/10 rounded-2xl animate-in fade-in duration-300 border border-gray-100 dark:border-border ">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted-foreground">
                    Designation / Title
                  </Label>
                  <Input
                    placeholder="e.g. Caretaker"
                    className="h-11 rounded-xl border-gray-100 dark:border-border bg-white dark:bg-card font-bold text-sm"
                    value={formData.designation}
                    onChange={(e) =>
                      setFormData({ ...formData, designation: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-muted-foreground">
                    Basic Monthly salary
                  </Label>
                  <Input
                    type="number"
                    placeholder="Enter Amount"
                    className="h-11 rounded-xl border-gray-100 dark:border-border bg-white dark:bg-card font-bold text-sm"
                    value={formData.basicSalary}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        basicSalary: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="ghost"
                className="flex-1 h-12 rounded-xl font-bold text-[10px] uppercase tracking-widest"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-[2] h-12 bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl shadow-lg flex items-center justify-center gap-2"
                onClick={handleCreateUser}
                disabled={
                  createUser.isPending || !formData.name || !formData.email
                }
              >
                {createUser.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" /> Finalize Registration
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WardenUserRecordPage;
