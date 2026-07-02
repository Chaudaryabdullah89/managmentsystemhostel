"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  Shield,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle2,
  Receipt,
  MoreVertical,
  ChevronLeft,
  ShieldCheck,
  Eye,
  Settings2,
  Trash2,
  ChevronRight,
  Boxes,
  Scan,
  ArrowRight,
  Search,
  Filter,
  Activity,
  Wallet,
  Globe,
  ExternalLink,
  Power,
  Briefcase,
  Zap,
  Download,
  History,
  MessageSquare,
  Fingerprint,
  Info,
  UserCheck,
  ArrowUpRight,
  PhoneCall,
  Printer,
  Loader2,
  Smartphone,
  Sparkles,
  ShieldAlert,
  FileText,
  DollarSign,
  ArrowDownRight,
  Layers,
  Lock,
  BadgeCheck,
  Home,
  Copy,
  Check,
  ChevronDown,
  RefreshCw,
  XCircle,
  HelpCircle,
  CheckCircle,
  Tag,
  AlertTriangle,
  Bell,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useUserById,
  useUserDetailedProfile,
  useUserUpdate,
} from "@/hooks/useusers";
import { useResetPassword, useDeleteUser } from "@/hooks/useUsers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { DetailPageSkeleton } from "@/components/ui/skeletons";
import { toast } from "sonner";
import { useCreatePayment } from "@/hooks/usePayment";
import { useReports } from "@/hooks/useReports";
import { OccupancyDonutChart } from "@/components/ui/Charts";
import SalarySlip from "@/components/SalarySlip";

const ROLE_CONFIG = {
  ADMIN: {
    badge:
      "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/50",
    coverGradient: "from-indigo-600 via-indigo-700 to-indigo-900",
    dot: "bg-rose-500",
    iconColor: "text-indigo-600 dark:text-indigo-400",
  },
  WARDEN: {
    badge:
      "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50",
    coverGradient: "from-indigo-600 via-purple-700 to-indigo-900",
    dot: "bg-amber-500",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  STAFF: {
    badge:
      "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/50",
    coverGradient: "from-blue-600 via-indigo-600 to-indigo-900",
    dot: "bg-blue-500",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  RESIDENT: {
    badge:
      "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50",
    coverGradient: "from-indigo-600 via-indigo-700 to-blue-800",
    dot: "bg-emerald-500",
    iconColor: "text-indigo-600 dark:text-indigo-400",
  },
  GUEST: {
    badge:
      "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/50",
    coverGradient: "from-purple-600 via-indigo-700 to-indigo-900",
    dot: "bg-purple-500",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
};

const getRoleConfig = (role) =>
  ROLE_CONFIG[role] || {
    badge:
      "bg-indigo-50 dark:bg-muted text-indigo-700 dark:text-foreground border-indigo-200 dark:border-border",
    coverGradient: "from-indigo-600 via-indigo-700 to-indigo-900",
    dot: "bg-indigo-500",
    iconColor: "text-indigo-600 dark:text-indigo-400",
  };

const CopyBadge = ({ text, label = "" }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label || "Text"} copied to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-muted hover:bg-gray-200 dark:hover:bg-muted/80 text-gray-600 dark:text-muted-foreground text-[10px] font-mono font-medium transition-all"
      title={`Click to copy ${label || text}`}
    >
      <span>{text}</span>
      {copied ? (
        <Check className="h-3 w-3 text-emerald-600 shrink-0" />
      ) : (
        <Copy className="h-3 w-3 text-gray-400 shrink-0 opacity-70 hover:opacity-100" />
      )}
    </button>
  );
};

const DetailRow = ({
  icon: Icon,
  label,
  value,
  copyable = false,
  color = "text-slate-700 dark:text-slate-300",
}) => (
  <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50/70 dark:bg-muted/20 border border-gray-100 dark:border-border/50 hover:bg-white dark:hover:bg-card hover:shadow-2xs transition-all">
    <div
      className={`h-9 w-9 rounded-xl bg-white dark:bg-card border border-gray-100 dark:border-border flex items-center justify-center shrink-0 shadow-2xs ${color}`}
    >
      <Icon className="h-4 w-4" />
    </div>
    <div className="flex flex-col min-w-0 flex-1">
      <span className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-wider leading-none mb-1">
        {label}
      </span>
      <div className="text-xs font-bold text-gray-900 dark:text-foreground truncate tracking-tight">
        {copyable && value ? (
          <CopyBadge text={value} label={label} />
        ) : (
          <span>{value || "Not Provided"}</span>
        )}
      </div>
    </div>
  </div>
);

const formatFieldLabel = (key = "") =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const KeyValueGrid = ({ title, data = {}, icon: Icon = Info }) => {
  const rows = Object.entries(data).filter(([, value]) => value !== undefined);
  if (!rows.length) return null;
  return (
    <Card className="rounded-3xl bg-white dark:bg-card p-6 md:p-8 border border-gray-100 dark:border-border shadow-2xs">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-border/60">
        <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-muted text-slate-700 dark:text-slate-300 flex items-center justify-center">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-foreground">
          {title}
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {rows.map(([key, value]) => (
          <div
            key={key}
            className="p-3.5 rounded-2xl border border-gray-100 dark:border-border/60 bg-gray-50/50 dark:bg-muted/10 hover:bg-white dark:hover:bg-card hover:shadow-2xs transition-all"
          >
            <p className="text-[9px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-wider mb-1">
              {formatFieldLabel(key)}
            </p>
            <div className="text-xs font-bold text-gray-900 dark:text-foreground break-all">
              {typeof value === "object" ? (
                <pre className="text-[10px] font-mono bg-gray-100 dark:bg-muted p-2 rounded-lg overflow-x-auto">
                  {JSON.stringify(value, null, 2)}
                </pre>
              ) : (
                String(value || "—")
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

const QUICK_TEMPLATES = [
  {
    label: "Rent Overdue Reminder",
    subject: "Monthly Rent Payment Outstanding Reminder",
    message:
      "Dear Resident, this is a reminder that your monthly rent payment is outstanding. Please clear the dues and upload the payment receipt on the portal to avoid late surcharge. Thank you.",
    type: "RENT_DUE",
  },
  {
    label: "Mess Charges Dues",
    subject: "Mess Charges Payment Reminder",
    message:
      "Dear Resident, your mess dues for the current billing cycle are pending. Kindly settle the amount at your earliest convenience to ensure uninterrupted mess services. Thank you.",
    type: "GENERAL",
  },
  {
    label: "Room Inspection Alert",
    subject: "Notice of Scheduled Room Inspection",
    message:
      "Dear Resident, a room cleanliness and safety inspection will be conducted tomorrow. Please ensure your room is organized and all safety regulations are followed. Thank you.",
    type: "GENERAL",
  },
  {
    label: "Late Curfew Warning",
    subject: "Official Alert: Violation of Curfew Gate Timings",
    message:
      "Dear Resident, it has been noted that you did not adhere to the gate closing curfew timings. Please be reminded that timings must be strictly followed, and future violations will be reported to guardians.",
    type: "WARNING",
  },
  {
    label: "Discipline Alert",
    subject: "Urgent Warning regarding Hostel Code of Conduct",
    message:
      "Dear Resident, you are advised to maintain absolute discipline and avoid noise or activities that disturb fellow residents. Let this be treated as an official warning regarding code of conduct.",
    type: "URGENT",
  },
];

const UserDetailsPage = () => {
  const { userId } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  const {
    data: user,
    isLoading: userLoading,
    refetch: refetchUser,
  } = useUserById(userId);
  const {
    data: userDetails,
    isLoading: detailsLoading,
    refetch: refetchDetails,
  } = useUserDetailedProfile(userId);
  const { mutateAsync: updateUser, isLoading: isUpdating } = useUserUpdate();
  const resetPassword = useResetPassword();
  const deleteUser = useDeleteUser();

  // Modal Dialog States
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isAccessDialogOpen, setIsAccessDialogOpen] = useState(false);
  const [isSlipDialogOpen, setIsSlipDialogOpen] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState(null);

  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  // Activity Stream Modal State
  const [selectedActivityEvent, setSelectedActivityEvent] = useState(null);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);

  // Complaint Detail Modal State
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isComplaintDialogOpen, setIsComplaintDialogOpen] = useState(false);

  // Session Detail Modal State
  const [selectedSession, setSelectedSession] = useState(null);
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);

  const isWarden = user?.role === "WARDEN";
  const { data: wardenReports } = useReports(
    "month",
    isWarden ? user?.hostelId : null,
  );
  const [editData, setEditData] = useState(null);
  const [newPass, setNewPass] = useState("hostel123");

  // Reminder System State
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [reminderSubject, setReminderSubject] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  const [reminderType, setReminderType] = useState("GENERAL");
  const [sendReminderWhatsApp, setSendReminderWhatsApp] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);

  const handleSendReminder = async () => {
    if (!reminderSubject.trim() || !reminderMessage.trim()) {
      toast.error("Subject and message are required.");
      return;
    }
    setIsSendingReminder(true);
    try {
      const res = await fetch(`/api/users/${userId}/remind`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: reminderSubject,
          message: reminderMessage,
          type: reminderType,
          sendWhatsApp: sendReminderWhatsApp,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Reminder dispatched successfully!");
        setIsReminderDialogOpen(false);
        setReminderSubject("");
        setReminderMessage("");
        setSendReminderWhatsApp(false);
      } else {
        toast.error(data.error || "Failed to send reminder.");
      }
    } catch (err) {
      toast.error("An error occurred while sending the reminder.");
    } finally {
      setIsSendingReminder(false);
    }
  };

  const handleWhatsAppDirect = () => {
    if (!reminderSubject.trim() || !reminderMessage.trim()) {
      toast.error("Subject and message are required.");
      return;
    }
    const cleanPhone = user?.phone ? user.phone.replace(/[^0-9]/g, "") : "";
    let waPhone = cleanPhone;
    if (waPhone.startsWith("0")) {
      waPhone = "92" + waPhone.substring(1);
    }
    const waText = `📌 *${reminderSubject}*\n\n${reminderMessage}`;
    const waUrl = `https://api.whatsapp.com/send?phone=${waPhone}&text=${encodeURIComponent(waText)}`;
    window.open(waUrl, "_blank");
  };

  const additionalImages = Array.isArray(
    user?.ResidentProfile?.documents?.galleryImages,
  )
    ? user.ResidentProfile.documents.galleryImages
    : [];

  const createPayment = useCreatePayment();

  const handleToggleStatus = async () => {
    try {
      await updateUser({
        id: userId,
        data: { isActive: !user.isActive },
      });
      toast.success(
        `User status updated to ${!user.isActive ? "ACTIVE" : "INACTIVE"}`,
      );
      refetchUser();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleEditIdentity = async () => {
    try {
      await updateUser({
        id: userId,
        data: editData,
      });
      toast.success("Profile updated successfully");
      setIsEditDialogOpen(false);
      refetchUser();
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const handleResetKey = async () => {
    try {
      await resetPassword.mutateAsync({
        id: userId,
        newPassword: newPass,
      });
      toast.success("Password reset successfully");
      setIsAccessDialogOpen(false);
    } catch (error) {
      toast.error("Failed to reset password");
    }
  };

  const handleUpdateRole = async () => {
    try {
      await updateUser({
        id: userId,
        data: {
          role: editData.role,
          canManageExpenses: editData.canManageExpenses,
          canManageMess: editData.canManageMess,
          canManageGeneral: editData.canManageGeneral,
          canManageUtilities: editData.canManageUtilities,
          canManageMaintenance: editData.canManageMaintenance,
          canManageSalaries: editData.canManageSalaries,
        },
      });
      toast.success("User role updated successfully");
      setIsRoleDialogOpen(false);
      refetchUser();
    } catch (error) {
      toast.error("Failed to update role");
    }
  };

  const handleArchiveRecord = async () => {
    if (
      confirm("Are you sure you want to delete this user record permanently?")
    ) {
      try {
        await deleteUser.mutateAsync(userId);
        toast.success("User record deleted");
        router.push("/admin/users-records");
      } catch (error) {
        toast.error("Failed to delete user");
      }
    }
  };

  const activeBooking = useMemo(() => {
    if (!userDetails?.bookings) return null;
    return (
      userDetails.bookings.find(
        (b) => b.status === "CHECKED_IN" || b.status === "CONFIRMED",
      ) || userDetails.bookings[0]
    );
  }, [userDetails]);

  const stats = useMemo(() => {
    if (!userDetails)
      return { totalPaid: 0, compl: 0, maint: 0, bookings: 0, salaries: 0 };
    return {
      totalPaid:
        userDetails.payments?.reduce(
          (acc, curr) => acc + Number(curr.amount || 0),
          0,
        ) || 0,
      compl: userDetails.complaints?.length || 0,
      maint: userDetails.maintenanceTasks?.length || 0,
      bookings: userDetails.bookings?.length || 0,
      salaries: userDetails.salaries?.length || 0,
    };
  }, [userDetails]);

  const activityFeed = useMemo(() => {
    const events = [];
    if (userDetails?.payments) {
      userDetails.payments.forEach((p) =>
        events.push({
          id: p.id,
          type: "payment",
          title: "Payment Processed",
          description: `Received PKR ${p.amount.toLocaleString()} via ${p.method}`,
          date: new Date(p.date || p.createdAt || Date.now()),
          status: p.status,
          icon: CreditCard,
          color: "text-emerald-600",
          bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
          raw: p,
          link: `/admin/payments/${p.id}`,
        }),
      );
    }
    if (userDetails?.complaints) {
      userDetails.complaints.forEach((c) =>
        events.push({
          id: c.id,
          type: "complaint",
          title: "Report Filed",
          description: c.title,
          date: new Date(c.createdAt || Date.now()),
          status: c.status,
          icon: AlertCircle,
          color: "text-amber-600",
          bgColor: "bg-amber-50 dark:bg-amber-950/30",
          raw: c,
          link: `/admin/complaints/${c.id}`,
        }),
      );
    }
    if (userDetails?.bookings) {
      userDetails.bookings.forEach((b) =>
        events.push({
          id: b.id,
          type: "booking",
          title: "Stay Registered",
          description: `Checked into ${b.room?.Hostel?.name || "Hostel"} (Room ${b.room?.roomNumber || "N/A"})`,
          date: new Date(b.createdAt || Date.now()),
          status: b.status,
          icon: Building2,
          color: "text-slate-700 dark:text-slate-300",
          bgColor: "bg-slate-100 dark:bg-slate-800/40",
          raw: b,
          link: `/admin/bookings/${b.id}`,
        }),
      );
    }
    return events.sort((a, b) => b.date - a.date).slice(0, 15);
  }, [userDetails]);

  if (userLoading || detailsLoading) return <DetailPageSkeleton />;

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-background">
        <div className="text-center space-y-6 max-w-sm px-6">
          <div className="h-20 w-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900/30 shadow-2xs">
            <User className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-gray-900 dark:text-foreground uppercase tracking-tight">
              User Not Found
            </h1>
            <p className="text-xs text-gray-400 dark:text-muted-foreground font-medium">
              The requested user record could not be located.
            </p>
          </div>
          <Button
            onClick={() => router.push("/admin/users-records")}
            className="h-11 px-8 rounded-2xl font-bold text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white shadow-md"
          >
            Return to Directory
          </Button>
        </div>
      </div>
    );
  }

  const roleConfig = getRoleConfig(user.role);

  return (
    <div className="min-h-screen bg-[#F4F6F9] dark:bg-background pb-24 font-sans antialiased relative overflow-hidden">
      {/* ── Ambient Background Gradient ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-500/[0.03] rounded-full blur-[100px]" />
      </div>

      {/* Top Glassmorphic Navbar */}
      <div className="bg-white/85 dark:bg-card/85 backdrop-blur-md border-b border-gray-200/70 dark:border-border/70 sticky top-0 z-50 h-16 shadow-2xs transition-all">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 h-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl hover:bg-gray-100 dark:hover:bg-muted h-9 w-9 text-gray-500 dark:text-muted-foreground"
              onClick={() => router.push("/admin/users-records")}
              title="Back to Directory"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="h-5 w-px bg-gray-200 dark:bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-400 dark:text-muted-foreground hidden md:inline">
                Users Directory
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-gray-300 dark:text-muted-foreground hidden md:inline" />
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-gray-900 dark:text-foreground tracking-tight uppercase truncate max-w-[180px] sm:max-w-xs">
                  {user.name}
                </span>
                <Badge
                  className={`rounded-lg text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 border ${roleConfig.badge}`}
                >
                  {user.role === "RESIDENT" ? "STUDENT" : user.role}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Account Status Pill */}
            <div
              className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${user.isActive ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-200 dark:border-emerald-900/40" : "bg-gray-50 dark:bg-muted/20 text-gray-400 border-gray-200 dark:border-border"}`}
            >
              <span
                className={`h-2 w-2 rounded-full ${user.isActive ? "bg-emerald-500 animate-pulse" : "bg-gray-300"}`}
              />
              {user.isActive ? "Active Account" : "Disabled"}
            </div>

            <div className="flex items-center gap-1.5">
              {user.phone && (
                <a href={`tel:${user.phone}`}>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-xl border-gray-200 dark:border-border text-gray-600 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground hover:bg-gray-100 transition-all shadow-2xs"
                    title="Call User"
                  >
                    <PhoneCall className="h-4 w-4" />
                  </Button>
                </a>
              )}
              {user.email && (
                <a href={`mailto:${user.email}`}>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-xl border-gray-200 dark:border-border text-gray-600 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground hover:bg-gray-100 transition-all shadow-2xs"
                    title="Email User"
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                </a>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.print()}
                className="h-9 w-9 rounded-xl border-gray-200 dark:border-border text-gray-600 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground hover:bg-gray-100 transition-all hidden md:flex shadow-2xs print:hidden"
                title="Print Summary"
              >
                <Printer className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              onClick={handleToggleStatus}
              className={`h-9 px-3.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all border shadow-2xs print:hidden ${user.isActive ? "border-amber-200 text-amber-700 bg-amber-50/70 hover:bg-amber-100/70 dark:border-amber-900/50 dark:bg-amber-950/30" : "border-emerald-200 text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100/70 dark:border-emerald-900/50 dark:bg-emerald-950/30"}`}
            >
              <Power className="h-3.5 w-3.5 mr-1.5" />
              {user.isActive ? "Deactivate" : "Activate"}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:text-white text-white font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all active:scale-95">
                  <Settings2 className="h-3.5 w-3.5 mr-1.5" /> Manage
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 rounded-2xl p-2 shadow-2xl border-gray-100 dark:border-border bg-white dark:bg-card"
              >
                <DropdownMenuLabel className="text-[9px] font-black uppercase text-gray-400 dark:text-muted-foreground tracking-widest px-3 py-1.5">
                  Account Control
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => {
                    setEditData(user);
                    setIsEditDialogOpen(true);
                  }}
                  className="rounded-xl px-3 py-2.5 font-bold text-[10px] uppercase tracking-wider gap-3 focus:bg-gray-100 dark:focus:bg-muted cursor-pointer"
                >
                  <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />{" "}
                  Edit Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setEditData(user);
                    setIsRoleDialogOpen(true);
                  }}
                  className="rounded-xl px-3 py-2.5 font-bold text-[10px] uppercase tracking-wider gap-3 focus:bg-gray-100 dark:focus:bg-muted cursor-pointer"
                >
                  <Shield className="h-4 w-4 text-amber-500" /> Change Role &
                  Access
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsAccessDialogOpen(true)}
                  className="rounded-xl px-3 py-2.5 font-bold text-[10px] uppercase tracking-wider gap-3 focus:bg-gray-100 dark:focus:bg-muted cursor-pointer"
                >
                  <Lock className="h-4 w-4 text-blue-500" /> Reset Password
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsReminderDialogOpen(true)}
                  className="rounded-xl px-3 py-2.5 font-bold text-[10px] uppercase tracking-wider gap-3 focus:bg-gray-100 dark:focus:bg-muted cursor-pointer"
                >
                  <Bell className="h-4 w-4 text-emerald-500" /> Send Reminder
                  Notice
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1 bg-gray-100 dark:bg-border" />
                <DropdownMenuItem
                  onClick={handleArchiveRecord}
                  className="rounded-xl px-3 py-2.5 font-bold text-[10px] uppercase tracking-wider gap-3 focus:bg-rose-50 dark:focus:bg-rose-950/30 text-rose-600 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" /> Delete Account
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto px-4 md:px-8 py-6 space-y-6 relative z-10">
        {/* Clean Profile Header Section Matching Design Screenshot */}
        <div className="bg-gradient-to-tr from-indigo-50/40 via-white to-white dark:from-muted/10 dark:via-card dark:to-card border border-indigo-100/50 dark:border-border rounded-[2rem] p-6 md:p-8 shadow-xs relative flex flex-col sm:flex-row items-center sm:items-center justify-between gap-6 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/20 via-transparent to-transparent pointer-events-none" />
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6 text-center sm:text-left relative z-10">
            <div className="h-24 w-24 rounded-3xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-md text-3xl font-black uppercase overflow-hidden ring-4 ring-white dark:ring-muted">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                user.name?.charAt(0)
              )}
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-foreground tracking-tight">
                  {user.name}
                </h1>
                <Badge
                  variant="secondary"
                  className="bg-indigo-50 dark:bg-muted text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border-0"
                >
                  {user.role === "RESIDENT" ? "STUDENT" : user.role}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-semibold text-slate-400">
                {user.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>{user.email}</span>
                  </div>
                )}
                {user.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{user.phone}</span>
                  </div>
                )}
                {user.Hostel_User_hostelIdToHostel?.name && (
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-semibold">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    <span>{user.Hostel_User_hostelIdToHostel.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Top KPI Metrics Matrix */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[
            {
              label:
                user.role === "RESIDENT" || user.role === "GUEST"
                  ? "Total Payments Logged"
                  : "Total Earnings",
              value: `PKR ${stats.totalPaid.toLocaleString()}`,
              icon: Wallet,
              accent: "from-indigo-500 to-indigo-600",
              lightBg:
                "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400",
            },
            {
              label: "Reports & Complaints",
              value: stats.compl,
              icon: AlertCircle,
              accent: "from-amber-500 to-amber-600",
              lightBg:
                "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
            },
            {
              label: "Maintenance Tasks",
              value: stats.maint,
              icon: Zap,
              accent: "from-blue-500 to-blue-600",
              lightBg:
                "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
            },
            {
              label: "Account Status",
              value: user.isActive ? "Active Account" : "Disabled",
              icon: ShieldCheck,
              accent: "from-emerald-500 to-emerald-600",
              lightBg:
                "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-gradient-to-br from-white to-slate-50/50 dark:from-card dark:to-card/80 border border-indigo-100/40 dark:border-border rounded-[1.5rem] p-4 md:p-5 flex items-center gap-4 shadow-2xs hover:shadow-xs transition-all group"
            >
              <div
                className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100/20 dark:border-border/30 ${stat.lightBg} transition-transform group-hover:scale-105 duration-300`}
              >
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest leading-none mb-1">
                  {stat.label}
                </span>
                <span className="text-lg md:text-xl font-black text-gray-800 dark:text-foreground tracking-tight truncate">
                  {stat.value}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Main 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Details Cards */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Details List Card */}
            <Card className="rounded-3xl border border-gray-100 dark:border-border shadow-2xs bg-white dark:bg-card p-6 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-foreground flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                Personal Identity
              </h3>

              <div className="space-y-2.5">
                <DetailRow
                  icon={Mail}
                  label="Email Address"
                  value={user.email}
                  copyable
                />
                <DetailRow
                  icon={Phone}
                  label="Phone Contact"
                  value={user.phone}
                  copyable
                />
                <DetailRow
                  icon={Fingerprint}
                  label="CNIC / Identity"
                  value={user.cnic}
                  copyable
                />
                <DetailRow
                  icon={MapPin}
                  label="Address"
                  value={user.address}
                  color="text-amber-500"
                />
                <DetailRow
                  icon={Calendar}
                  label="Registered On"
                  value={
                    user.createdAt
                      ? format(new Date(user.createdAt), "MMMM dd, yyyy")
                      : "—"
                  }
                  color="text-emerald-600"
                />
              </div>
            </Card>

            {/* Emergency Contact Card */}
            {user.ResidentProfile && (
              <Card className="rounded-3xl border border-gray-100 dark:border-border shadow-2xs bg-white dark:bg-card p-6 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-foreground">
                    Emergency Contact
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-3 p-4 bg-gray-50/80 dark:bg-muted/20 rounded-2xl border border-gray-100 dark:border-border/60">
                  <div>
                    <span className="text-[9px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-wider block mb-0.5">
                      Guardian / Contact Person
                    </span>
                    <span className="text-xs font-bold text-gray-900 dark:text-foreground">
                      {user.ResidentProfile.guardianName || "Not Provided"}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-200/60 dark:border-border/40">
                    <span className="text-[9px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-wider block mb-0.5">
                      Emergency Phone
                    </span>
                    <span className="text-xs font-bold text-gray-900 dark:text-foreground">
                      {user.ResidentProfile.emergencyContact || "Not Provided"}
                    </span>
                  </div>
                  {user?.ResidentProfile?.documents?.currentResidence && (
                    <div className="pt-2 border-t border-gray-200/60 dark:border-border/40">
                      <span className="text-[9px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-wider block mb-0.5">
                        Current Residence
                      </span>
                      <span className="text-xs font-bold text-gray-900 dark:text-foreground">
                        {user.ResidentProfile.documents.currentResidence}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Soft-styled Assigned Branch Box */}
            <Card className="rounded-3xl border border-gray-200 dark:border-border bg-slate-50/70 dark:bg-muted/20 p-6 space-y-4 shadow-2xs relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Assigned Hostel Branch
                  </span>
                  <h3 className="text-base font-black text-gray-900 dark:text-foreground uppercase tracking-tight mt-0.5">
                    {user.Hostel_User_hostelIdToHostel?.name ||
                      "Main Head Office"}
                  </h3>
                </div>
                <div className="h-9 w-9 rounded-xl bg-white dark:bg-card border border-gray-200 dark:border-border text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 shadow-2xs">
                  <Building2 className="h-4 w-4" />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200/80 dark:border-border/60 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-wider block">
                    Assigned Room
                  </span>
                  <span className="text-xs font-black text-gray-900 dark:text-foreground">
                    {activeBooking?.room?.roomNumber
                      ? `Room ${activeBooking.room.roomNumber}`
                      : "Not Assigned"}
                  </span>
                </div>
                {user.hostelId && (
                  <Link href={`/admin/hostels/${user.hostelId}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 rounded-xl border-gray-200 dark:border-border text-slate-700 dark:text-slate-300 font-bold text-[9px] uppercase tracking-wider bg-white dark:bg-card hover:bg-slate-900 hover:text-white dark:hover:bg-slate-100 dark:hover:text-slate-900 transition-all shadow-2xs"
                    >
                      View Hostel <ArrowUpRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            </Card>

            {/* Document Gallery Preview */}
            {additionalImages.length > 0 && (
              <Card className="rounded-3xl border border-gray-100 dark:border-border shadow-2xs bg-white dark:bg-card p-6 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                  Attached Documents ({additionalImages.length})
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {additionalImages.map((src, idx) => (
                    <a
                      key={`${src}-${idx}`}
                      href={src}
                      target="_blank"
                      rel="noreferrer"
                      className="group block rounded-2xl overflow-hidden border border-gray-100 dark:border-border/60 bg-gray-50 dark:bg-muted relative"
                    >
                      <img
                        src={src}
                        alt={`document-${idx}`}
                        className="h-24 w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Eye className="h-5 w-5" />
                      </div>
                    </a>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right Column: Dynamic Tabs Section */}
          <div className="lg:col-span-8 space-y-6">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-6"
            >
              {/* Tab Navigation Controls with Soft Indigo Active State */}
              <div className="overflow-x-auto pb-1 scrollbar-none">
                <TabsList className="bg-slate-100/80 dark:bg-muted/80 p-1 rounded-2xl h-12 border border-slate-200/50 dark:border-border/50 inline-flex min-w-max gap-1">
                  <TabsTrigger
                    value="overview"
                    className="h-full px-5 rounded-xl font-bold text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-xs transition-all"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="database"
                    className="h-full px-5 rounded-xl font-bold text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-xs transition-all"
                  >
                    All Details
                  </TabsTrigger>
                  {user.role === "RESIDENT" || user.role === "GUEST" ? (
                    <>
                      <TabsTrigger
                        value="bookings"
                        className="h-full px-5 rounded-xl font-bold text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-xs transition-all"
                      >
                        Bookings ({stats.bookings})
                      </TabsTrigger>
                      <TabsTrigger
                        value="payments"
                        className="h-full px-5 rounded-xl font-bold text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-xs transition-all"
                      >
                        Payments
                      </TabsTrigger>
                    </>
                  ) : (
                    <TabsTrigger
                      value="salaries"
                      className="h-full px-5 rounded-xl font-bold text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-xs transition-all"
                    >
                      Salaries ({stats.salaries})
                    </TabsTrigger>
                  )}
                  <TabsTrigger
                    value="complaints"
                    className="h-full px-5 rounded-xl font-bold text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-xs transition-all"
                  >
                    Reports ({stats.compl})
                  </TabsTrigger>
                  <TabsTrigger
                    value="security"
                    className="h-full px-5 rounded-xl font-bold text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-xs transition-all"
                  >
                    Security
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* OVERVIEW TAB */}
              <TabsContent
                value="overview"
                className="m-0 space-y-6 animate-in fade-in-50 duration-300"
              >
                {/* Stay & Status Summary Cards Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-3xl p-5 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-gray-400 dark:text-muted-foreground">
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        Active Stay
                      </span>
                      <Home className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                    </div>
                    <p className="text-base font-black text-gray-900 dark:text-foreground">
                      {activeBooking?.room?.roomNumber
                        ? `Room ${activeBooking.room.roomNumber}`
                        : "No Active Stay"}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground truncate">
                      {activeBooking?.room?.Hostel?.name || "Unassigned Hostel"}
                    </p>
                  </div>

                  <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-3xl p-5 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-gray-400 dark:text-muted-foreground">
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        Financial Ledger
                      </span>
                      <CreditCard className="h-4 w-4 text-emerald-600" />
                    </div>
                    <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      PKR {stats.totalPaid.toLocaleString()}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground">
                      {userDetails?.payments?.length || 0} Total Transactions
                    </p>
                  </div>

                  <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-3xl p-5 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-gray-400 dark:text-muted-foreground">
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        Issues & Reports
                      </span>
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    </div>
                    <p className="text-base font-black text-gray-900 dark:text-foreground">
                      {stats.compl} Complaints
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground">
                      {stats.maint} Maintenance Requests
                    </p>
                  </div>
                </div>

                {/* Grid layout for Activity Stream & Highlights */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left: Interactive Activity Stream Feed (7 Cols) */}
                  <Card className="lg:col-span-7 rounded-3xl bg-white dark:bg-card p-6 border border-gray-100 dark:border-border shadow-2xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-border/60">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-muted text-slate-700 dark:text-slate-300 flex items-center justify-center">
                          <History className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-foreground">
                            Activity Timeline Stream
                          </h3>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                            Click item to open details
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 rounded-xl text-[9px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-muted"
                        onClick={() => {
                          const headers = [
                            "Activity",
                            "Description",
                            "Date",
                            "Status",
                          ];
                          const rows = activityFeed.map((e) => [
                            e.title,
                            e.description,
                            e.date && !isNaN(e.date.getTime())
                              ? format(e.date, "yyyy-MM-dd HH:mm")
                              : "N/A",
                            e.status,
                          ]);
                          const csvContent = [headers, ...rows]
                            .map((e) => e.join(","))
                            .join("\n");
                          const blob = new Blob([csvContent], {
                            type: "text/csv;charset=utf-8;",
                          });
                          const link = document.createElement("a");
                          const url = URL.createObjectURL(blob);
                          link.setAttribute("href", url);
                          link.setAttribute(
                            "download",
                            `User_History_${user.name.replace(/\s+/g, "_")}_${format(new Date(), "yyyyMMdd")}.csv`,
                          );
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          toast.success("User history exported (CSV)");
                        }}
                      >
                        <Download className="h-3.5 w-3.5 mr-1" /> CSV Log
                      </Button>
                    </div>

                    {/* Interactive Timeline Item Cards */}
                    {activityFeed.length === 0 ? (
                      <div className="py-12 text-center border-2 border-dashed border-gray-100 dark:border-border/60 rounded-2xl">
                        <Clock className="h-8 w-8 text-gray-300 dark:text-muted-foreground mx-auto mb-2" />
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                          No activity events logged
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {activityFeed.map((event, idx) => {
                          const EventIcon = event.icon || History;
                          return (
                            <div
                              key={idx}
                              onClick={() => {
                                setSelectedActivityEvent(event);
                                setIsActivityDialogOpen(true);
                              }}
                              className="group flex items-start gap-3.5 p-3.5 rounded-2xl bg-gray-50/70 dark:bg-muted/20 border border-gray-100 dark:border-border/50 hover:bg-white dark:hover:bg-card hover:border-gray-200 dark:hover:border-border hover:shadow-xs transition-all cursor-pointer"
                            >
                              <div
                                className={`mt-0.5 h-9 w-9 rounded-xl ${event.bgColor} ${event.color} flex items-center justify-center shrink-0 border border-current/10`}
                              >
                                <EventIcon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <h4 className="text-xs font-black text-gray-900 dark:text-foreground group-hover:text-slate-900 dark:group-hover:text-white transition-colors truncate">
                                    {event.title}
                                  </h4>
                                  <span className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground shrink-0">
                                    {event.date && !isNaN(event.date.getTime())
                                      ? format(event.date, "MMM dd, HH:mm")
                                      : "—"}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-muted-foreground mt-0.5 line-clamp-1">
                                  {event.description}
                                </p>
                                <div className="mt-2 flex items-center justify-between">
                                  <Badge
                                    variant="outline"
                                    className="rounded-md text-[8px] font-black uppercase tracking-wider px-2 py-0.5 border-gray-200 dark:border-border"
                                  >
                                    {event.status}
                                  </Badge>
                                  <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                                    Details <ChevronRight className="h-3 w-3" />
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>

                  {/* Right: Warden Overview or Quick Action Panel (5 Cols) */}
                  <div className="lg:col-span-5 space-y-6">
                    {isWarden && wardenReports ? (
                      <Card className="rounded-3xl bg-white dark:bg-card p-6 border border-gray-100 dark:border-border shadow-2xs relative overflow-hidden space-y-5">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-border/60">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                              <Building2 className="h-4 w-4" />
                            </div>
                            <div>
                              <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-foreground">
                                Warden Branch Report
                              </h3>
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                Current Month Metrics
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3.5 rounded-2xl bg-gray-50/80 dark:bg-muted/20 border border-gray-100 dark:border-border/60">
                            <span className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-wider">
                              Hostel Revenue
                            </span>
                            <span className="text-base font-black text-emerald-600 tracking-tight">
                              PKR{" "}
                              {(
                                wardenReports.finances?.revenue?.current || 0
                              ).toLocaleString()}
                            </span>
                          </div>

                          <div className="flex justify-between items-center p-3.5 rounded-2xl bg-gray-50/80 dark:bg-muted/20 border border-gray-100 dark:border-border/60">
                            <span className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-wider">
                              Hostel Expenses
                            </span>
                            <span className="text-base font-black text-rose-500 tracking-tight">
                              PKR{" "}
                              {(
                                wardenReports.finances?.expenses?.current || 0
                              ).toLocaleString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-muted/20 border border-gray-100 dark:border-border">
                            <div className="h-14 w-14 shrink-0">
                              <OccupancyDonutChart
                                occupancyRate={
                                  wardenReports.occupancy?.rate || 0
                                }
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black uppercase text-gray-400 dark:text-muted-foreground tracking-widest">
                                Occupancy
                              </span>
                              <span className="text-xs font-black text-gray-900 dark:text-foreground">
                                {wardenReports.occupancy?.occupiedRooms || 0} /{" "}
                                {wardenReports.occupancy?.totalRooms || 0} Rooms
                                Occupied
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ) : (
                      <Card className="rounded-3xl bg-white dark:bg-card p-6 border border-gray-100 dark:border-border shadow-2xs space-y-4">
                        <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 dark:border-border/60">
                          <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-muted text-slate-700 dark:text-slate-300 flex items-center justify-center">
                            <Sparkles className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-foreground">
                              Quick Operational Actions
                            </h3>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                              User Record Tools
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          {user.role === "RESIDENT" || user.role === "GUEST" ? (
                            <Button
                              onClick={() => {
                                if (userDetails?.bookings?.[0]) {
                                  setSelectedBooking(userDetails.bookings[0]);
                                  setIsBookingDialogOpen(true);
                                } else {
                                  toast.info(
                                    "No active booking to log payment for",
                                  );
                                }
                              }}
                              variant="outline"
                              className="w-full h-11 justify-start px-4 rounded-2xl border-gray-200 dark:border-border font-bold text-[10px] uppercase tracking-wider gap-3 hover:bg-gray-100 dark:hover:bg-muted transition-all"
                            >
                              <CreditCard className="h-4 w-4 text-emerald-600" />
                              Record Payment Log
                            </Button>
                          ) : (
                            <Button
                              onClick={() => {
                                if (userDetails?.salaries?.[0]) {
                                  setSelectedSalary(userDetails.salaries[0]);
                                  setIsSlipDialogOpen(true);
                                } else {
                                  toast.info(
                                    "No salary slip records available",
                                  );
                                }
                              }}
                              variant="outline"
                              className="w-full h-11 justify-start px-4 rounded-2xl border-gray-200 dark:border-border font-bold text-[10px] uppercase tracking-wider gap-3 hover:bg-gray-100 dark:hover:bg-muted transition-all"
                            >
                              <Receipt className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                              View Latest Salary Slip
                            </Button>
                          )}

                          <Button
                            onClick={() => {
                              setEditData(user);
                              setIsRoleDialogOpen(true);
                            }}
                            variant="outline"
                            className="w-full h-11 justify-start px-4 rounded-2xl border-gray-200 dark:border-border font-bold text-[10px] uppercase tracking-wider gap-3 hover:bg-gray-100 dark:hover:bg-muted transition-all"
                          >
                            <Shield className="h-4 w-4 text-amber-500" />
                            Modify Role & Permissions
                          </Button>

                          <Button
                            onClick={() => setIsAccessDialogOpen(true)}
                            variant="outline"
                            className="w-full h-11 justify-start px-4 rounded-2xl border-gray-200 dark:border-border font-bold text-[10px] uppercase tracking-wider gap-3 hover:bg-gray-100 dark:hover:bg-muted transition-all"
                          >
                            <Lock className="h-4 w-4 text-blue-500" />
                            Reset Password Key
                          </Button>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* ALL DETAILS (DATABASE) TAB */}
              <TabsContent
                value="database"
                className="m-0 space-y-6 animate-in fade-in-50 duration-300"
              >
                <KeyValueGrid
                  title="Core Identity Fields"
                  icon={BadgeCheck}
                  data={{
                    id: user?.id,
                    uid: user?.uid,
                    regNumber: user?.regNumber,
                    name: user?.name,
                    email: user?.email,
                    phone: user?.phone,
                    role: user?.role,
                    cnic: user?.cnic,
                    city: user?.city,
                    address: user?.address,
                    hostelId: user?.hostelId,
                    isActive: user?.isActive,
                    createdAt: user?.createdAt
                      ? format(new Date(user.createdAt), "yyyy-MM-dd HH:mm:ss")
                      : "—",
                    updatedAt: user?.updatedAt
                      ? format(new Date(user.updatedAt), "yyyy-MM-dd HH:mm:ss")
                      : "—",
                  }}
                />

                <Card className="rounded-3xl bg-white dark:bg-card p-6 md:p-8 border border-gray-100 dark:border-border shadow-2xs space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-border/60">
                    <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                      <Layers className="h-4 w-4" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-foreground">
                      Related Database Records Summary
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      {
                        label: "Bookings",
                        value: userDetails?.bookings?.length || 0,
                      },
                      {
                        label: "Payments",
                        value: userDetails?.payments?.length || 0,
                      },
                      {
                        label: "Complaints",
                        value: userDetails?.complaints?.length || 0,
                      },
                      {
                        label: "Maintenance",
                        value: userDetails?.maintenanceTasks?.length || 0,
                      },
                      {
                        label: "Salaries",
                        value: userDetails?.salaries?.length || 0,
                      },
                      {
                        label: "Created Expenses",
                        value: userDetails?.createdExpenses?.length || 0,
                      },
                      {
                        label: "Approved Expenses",
                        value: userDetails?.approvedExpenses?.length || 0,
                      },
                      {
                        label: "Rejected Expenses",
                        value: userDetails?.rejectedExpenses?.length || 0,
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-2xl border border-gray-100 dark:border-border/60 bg-gray-50/50 dark:bg-muted/10 p-4"
                      >
                        <p className="text-[9px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest">
                          {item.label}
                        </p>
                        <p className="text-2xl font-black text-gray-900 dark:text-foreground mt-1">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              {/* SALARIES TAB */}
              <TabsContent
                value="salaries"
                className="m-0 animate-in fade-in-50 duration-300"
              >
                <Card className="rounded-3xl bg-white dark:bg-card overflow-hidden border border-gray-100 dark:border-border shadow-2xs">
                  <Table>
                    <TableHeader className="bg-gray-50/80 dark:bg-muted/30">
                      <TableRow className="border-gray-100 dark:border-border/60">
                        <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 py-4">
                          Payroll Month
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest px-4 py-4">
                          Amount
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest px-4 py-4">
                          Payment Mode
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest px-4 py-4">
                          Status
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 py-4 text-right">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userDetails?.salaries?.map((s) => (
                        <TableRow
                          key={s.id}
                          className="border-gray-100 dark:border-border/40 hover:bg-gray-50/50 dark:hover:bg-muted/20 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedSalary(s);
                            setIsSlipDialogOpen(true);
                          }}
                        >
                          <TableCell className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-gray-900 dark:text-foreground">
                                {s.month}
                              </span>
                              <span className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">
                                {s.paymentDate
                                  ? format(
                                      new Date(s.paymentDate),
                                      "MMM dd, yyyy",
                                    )
                                  : "Processing"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-gray-900 dark:text-foreground">
                                PKR {s.amount.toLocaleString()}
                              </span>
                              <span className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">
                                Base: PKR {s.basicSalary.toLocaleString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-4 font-bold text-gray-700 dark:text-foreground text-xs uppercase tracking-wider">
                            {s.paymentMethod || "N/A"}
                          </TableCell>
                          <TableCell className="px-4 py-4">
                            <Badge
                              className={`rounded-lg px-2.5 py-0.5 font-bold text-[9px] uppercase tracking-widest border shadow-none ${
                                s.status === "PAID"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40"
                                  : s.status === "PENDING"
                                    ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40"
                                    : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40"
                              }`}
                            >
                              {s.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-3 rounded-xl text-[9px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-muted"
                            >
                              View Slip
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!userDetails?.salaries ||
                        userDetails.salaries.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={5} className="h-52 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <Wallet className="h-9 w-9 text-gray-300 dark:text-muted-foreground" />
                              <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">
                                No payroll records found
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>

              {/* BOOKINGS TAB */}
              <TabsContent
                value="bookings"
                className="m-0 animate-in fade-in-50 duration-300"
              >
                <Card className="rounded-3xl bg-white dark:bg-card overflow-hidden border border-gray-100 dark:border-border shadow-2xs">
                  <Table>
                    <TableHeader className="bg-gray-50/80 dark:bg-muted/30">
                      <TableRow className="border-gray-100 dark:border-border/60">
                        <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 py-4">
                          Stay Period
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest px-4 py-4">
                          Hostel & Room
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest px-4 py-4">
                          Total Amount
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 py-4 text-right">
                          Status
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userDetails?.bookings?.map((b) => (
                        <TableRow
                          key={b.id}
                          className="border-gray-100 dark:border-border/40 hover:bg-gray-50/50 dark:hover:bg-muted/20 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedBooking(b);
                            setIsBookingDialogOpen(true);
                          }}
                        >
                          <TableCell className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-gray-900 dark:text-foreground">
                                {b.checkIn
                                  ? format(new Date(b.checkIn), "MMM dd, yyyy")
                                  : "—"}
                              </span>
                              <span className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">
                                to{" "}
                                {b.checkOut
                                  ? format(new Date(b.checkOut), "MMM dd, yyyy")
                                  : "Present"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-gray-900 dark:text-foreground">
                                {b.room?.Hostel?.name}
                              </span>
                              <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                Room {b.room?.roomNumber}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-4 font-black text-gray-900 dark:text-foreground text-xs">
                            PKR {b.totalAmount.toLocaleString()}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <Badge
                              className={`rounded-lg px-2.5 py-0.5 font-bold text-[9px] uppercase tracking-widest border shadow-none ${
                                b.status === "CHECKED_IN"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40"
                                  : b.status === "COMPLETED"
                                    ? "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/40"
                                    : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40"
                              }`}
                            >
                              {b.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!userDetails?.bookings ||
                        userDetails.bookings.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={4} className="h-52 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <Building2 className="h-9 w-9 text-gray-300 dark:text-muted-foreground" />
                              <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">
                                No booking history found
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>

              {/* PAYMENTS TAB */}
              <TabsContent
                value="payments"
                className="m-0 animate-in fade-in-50 duration-300"
              >
                <Card className="rounded-3xl bg-white dark:bg-card overflow-hidden border border-gray-100 dark:border-border shadow-2xs">
                  <Table>
                    <TableHeader className="bg-gray-50/80 dark:bg-muted/30">
                      <TableRow className="border-gray-100 dark:border-border/60">
                        <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 py-4">
                          Date
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest px-4 py-4">
                          Method / ID
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest px-4 py-4">
                          Amount
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 py-4 text-right">
                          Status
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userDetails?.payments?.map((p) => (
                        <TableRow
                          key={p.id}
                          className="border-gray-100 dark:border-border/40 hover:bg-gray-50/50 dark:hover:bg-muted/20 transition-colors cursor-pointer"
                          onClick={() => router.push(`/admin/payments/${p.id}`)}
                        >
                          <TableCell className="px-6 py-4">
                            <span className="text-xs font-bold text-gray-900 dark:text-foreground">
                              {p.date || p.createdAt
                                ? format(
                                    new Date(p.date || p.createdAt),
                                    "MMMM dd, yyyy",
                                  )
                                : "—"}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-gray-900 dark:text-foreground">
                                {p.method}
                              </span>
                              <CopyBadge
                                text={`#${p.id.slice(-8).toUpperCase()}`}
                                label="Payment ID"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-4 font-black text-gray-900 dark:text-foreground text-sm">
                            PKR {p.amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <Badge
                              className={`rounded-lg px-2.5 py-0.5 font-bold text-[9px] uppercase tracking-widest border shadow-none ${
                                p.status === "PAID"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40"
                                  : p.status === "PENDING"
                                    ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40"
                                    : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40"
                              }`}
                            >
                              {p.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!userDetails?.payments ||
                        userDetails.payments.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={4} className="h-52 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <CreditCard className="h-9 w-9 text-gray-300 dark:text-muted-foreground" />
                              <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">
                                No payment records found
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>

              {/* REPORTS & COMPLAINTS TAB */}
              <TabsContent
                value="complaints"
                className="m-0 animate-in fade-in-50 duration-300"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userDetails?.complaints?.map((c) => (
                    <Card
                      key={c.id}
                      onClick={() => {
                        setSelectedComplaint(c);
                        setIsComplaintDialogOpen(true);
                      }}
                      className="rounded-3xl bg-white dark:bg-card p-6 border border-gray-100 dark:border-border shadow-2xs space-y-4 hover:shadow-xs hover:border-gray-200 dark:hover:border-border transition-all group cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600">
                          <AlertCircle className="h-4 w-4" />
                        </div>
                        <Badge
                          variant="outline"
                          className="rounded-lg px-2 py-0.5 font-bold text-[8px] uppercase tracking-wider text-gray-500 border-gray-200"
                        >
                          {c.status}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-gray-900 dark:text-foreground uppercase tracking-tight group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                          {c.title}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-muted-foreground line-clamp-2 leading-relaxed italic">
                          "{c.description}"
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-border/60">
                        <span className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-wider">
                          {c.createdAt
                            ? format(new Date(c.createdAt), "MMM dd, yyyy")
                            : "—"}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          View Details <ChevronRight className="h-3 w-3" />
                        </span>
                      </div>
                    </Card>
                  ))}
                  {(!userDetails?.complaints ||
                    userDetails.complaints.length === 0) && (
                    <div className="md:col-span-2 h-52 flex flex-col items-center justify-center bg-white dark:bg-card rounded-3xl border border-dashed border-gray-200 dark:border-border">
                      <MessageSquare className="h-9 w-9 text-gray-300 dark:text-muted-foreground mb-2" />
                      <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">
                        No filed reports found
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* SECURITY & SESSIONS TAB */}
              <TabsContent
                value="security"
                className="m-0 animate-in fade-in-50 duration-300"
              >
                <Card className="rounded-3xl bg-white dark:bg-card overflow-hidden border border-gray-100 dark:border-border shadow-2xs">
                  <div className="p-6 border-b border-gray-100 dark:border-border/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
                        <Shield className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-tight text-gray-900 dark:text-foreground">
                          Active User Sessions
                        </h3>
                        <p className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-wider">
                          Click row for session security detail
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="h-9 px-4 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold text-[10px] uppercase tracking-wider"
                      onClick={async () => {
                        if (
                          confirm(
                            "Terminate all active sessions for this user? They will be logged out immediately.",
                          )
                        ) {
                          try {
                            const res = await fetch(
                              `/api/user/sessions?userId=${user.id}`,
                              { method: "DELETE" },
                            );
                            if (res.ok) {
                              toast.success("All sessions terminated");
                              router.refresh();
                            }
                          } catch (e) {
                            toast.error("Failed to terminate sessions");
                          }
                        }
                      }}
                    >
                      Terminate All Sessions
                    </Button>
                  </div>
                  <Table>
                    <TableHeader className="bg-gray-50/80 dark:bg-muted/30">
                      <TableRow className="border-gray-100 dark:border-border/60">
                        <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 py-4">
                          Device / Client
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest px-4 py-4">
                          Network IP
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest px-4 py-4">
                          Last Activity
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest px-4 py-4">
                          Status
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 py-4 text-right">
                          Revoke
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userDetails?.sessions?.map((s) => (
                        <TableRow
                          key={s.id}
                          className="border-gray-100 dark:border-border/40 hover:bg-gray-50/50 dark:hover:bg-muted/20 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedSession(s);
                            setIsSessionDialogOpen(true);
                          }}
                        >
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-muted flex items-center justify-center text-gray-500">
                                <Smartphone className="h-4 w-4" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-900 dark:text-foreground">
                                  {s.device || "Browser Client"}
                                </span>
                                <CopyBadge
                                  text={`#${s.id.slice(-8).toUpperCase()}`}
                                  label="Session ID"
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-4 font-mono font-bold text-gray-700 dark:text-foreground text-xs">
                            <div className="flex items-center gap-1.5">
                              <Globe className="h-3.5 w-3.5 text-gray-400" />
                              {s.ipAddress || "0.0.0.0"}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-gray-900 dark:text-foreground">
                                {format(new Date(s.lastActive), "MMM dd, p")}
                              </span>
                              <span className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">
                                Created:{" "}
                                {format(new Date(s.createdAt), "MMM dd")}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-4">
                            <Badge
                              className={`rounded-lg px-2.5 py-0.5 font-bold text-[9px] uppercase tracking-widest border shadow-none ${s.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40" : "bg-gray-50 text-gray-400 border-gray-200"}`}
                            >
                              {s.isActive ? "Active" : "Revoked"}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className="px-6 py-4 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {s.isActive && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    const res = await fetch(
                                      `/api/user/sessions?sessionId=${s.id}`,
                                      { method: "DELETE" },
                                    );
                                    if (res.ok) {
                                      toast.success("Session terminated");
                                      router.refresh();
                                    }
                                  } catch (e) {
                                    toast.error("Failed to revoke session");
                                  }
                                }}
                                className="h-8 w-8 p-0 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                title="Revoke Session"
                              >
                                <Power className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!userDetails?.sessions ||
                        userDetails.sessions.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={5} className="h-52 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <ShieldCheck className="h-9 w-9 text-gray-300 dark:text-muted-foreground" />
                              <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">
                                No active session tokens detected
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* ACTIVITY EVENT CLICK DETAIL DIALOG WITH SLATE BUTTON */}
      <Dialog
        open={isActivityDialogOpen}
        onOpenChange={setIsActivityDialogOpen}
      >
        <DialogContent className="rounded-3xl border-none p-6 md:p-8 max-w-lg shadow-2xl bg-white dark:bg-card">
          <DialogHeader className="pb-4 border-b border-gray-100 dark:border-border">
            <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2.5 text-gray-900 dark:text-foreground">
              <History className="h-5 w-5 text-slate-700 dark:text-slate-300" />
              Activity Event Detail
            </DialogTitle>
          </DialogHeader>

          {selectedActivityEvent && (
            <div className="space-y-5 pt-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-muted/20 border border-gray-100 dark:border-border">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-xl ${selectedActivityEvent.bgColor} ${selectedActivityEvent.color} flex items-center justify-center shrink-0 border border-current/10`}
                  >
                    {selectedActivityEvent.icon ? (
                      <selectedActivityEvent.icon className="h-5 w-5" />
                    ) : (
                      <History className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900 dark:text-foreground uppercase tracking-tight">
                      {selectedActivityEvent.title}
                    </h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Type: {selectedActivityEvent.type}
                    </p>
                  </div>
                </div>
                <Badge className="rounded-lg px-2.5 py-0.5 font-bold text-[9px] uppercase tracking-widest">
                  {selectedActivityEvent.status}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Event Description
                  </span>
                  <p className="text-xs font-bold text-gray-900 dark:text-foreground bg-gray-50/50 dark:bg-muted/10 p-3.5 rounded-xl border border-gray-100 dark:border-border">
                    {selectedActivityEvent.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl border border-gray-100 dark:border-border bg-gray-50/50 dark:bg-muted/10">
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-0.5">
                      Logged Date & Time
                    </span>
                    <span className="text-xs font-bold text-gray-900 dark:text-foreground">
                      {selectedActivityEvent.date &&
                      !isNaN(selectedActivityEvent.date.getTime())
                        ? format(selectedActivityEvent.date, "PPP p")
                        : "N/A"}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl border border-gray-100 dark:border-border bg-gray-50/50 dark:bg-muted/10">
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-0.5">
                      Reference Entity ID
                    </span>
                    {selectedActivityEvent.id ? (
                      <CopyBadge
                        text={`#${String(selectedActivityEvent.id).slice(-8).toUpperCase()}`}
                        label="ID"
                      />
                    ) : (
                      <span className="text-xs font-bold text-gray-900 dark:text-foreground">
                        N/A
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-6 flex gap-3 sm:justify-between w-full">
            <Button
              variant="outline"
              onClick={() => setIsActivityDialogOpen(false)}
              className="h-11 px-6 rounded-xl font-bold uppercase text-[10px] tracking-wider"
            >
              Close
            </Button>
            {selectedActivityEvent?.link && (
              <Button
                onClick={() => {
                  setIsActivityDialogOpen(false);
                  router.push(selectedActivityEvent.link);
                }}
                className="h-11 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 text-white font-black uppercase tracking-wider shadow-md transition-all"
              >
                View Target Entity <ArrowUpRight className="h-4 w-4 ml-1.5" />
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* COMPLAINT DETAIL DIALOG */}
      <Dialog
        open={isComplaintDialogOpen}
        onOpenChange={setIsComplaintDialogOpen}
      >
        <DialogContent className="rounded-3xl border-none p-6 md:p-8 max-w-lg shadow-2xl bg-white dark:bg-card">
          <DialogHeader className="pb-4 border-b border-gray-100 dark:border-border">
            <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2.5 text-gray-900 dark:text-foreground">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Complaint / Report Details
            </DialogTitle>
          </DialogHeader>

          {selectedComplaint && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between p-4 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 rounded-2xl">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-600">
                    Category: {selectedComplaint.category || "GENERAL"}
                  </span>
                  <h4 className="text-sm font-black text-amber-950 dark:text-amber-200 uppercase tracking-tight mt-0.5">
                    {selectedComplaint.title}
                  </h4>
                </div>
                <Badge
                  variant="outline"
                  className="text-[9px] font-black uppercase tracking-widest border-amber-200"
                >
                  {selectedComplaint.status}
                </Badge>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                  Description & Evidence
                </span>
                <p className="text-xs font-medium text-gray-700 dark:text-foreground bg-gray-50 dark:bg-muted/20 p-4 rounded-2xl border border-gray-100 dark:border-border italic leading-relaxed">
                  "{selectedComplaint.description}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-gray-100 dark:border-border bg-gray-50/50 dark:bg-muted/10">
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-0.5">
                    Filed Date
                  </span>
                  <span className="font-bold text-gray-900 dark:text-foreground">
                    {selectedComplaint.createdAt
                      ? format(new Date(selectedComplaint.createdAt), "PPP p")
                      : "—"}
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-gray-100 dark:border-border bg-gray-50/50 dark:bg-muted/10">
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-0.5">
                    Report ID
                  </span>
                  <CopyBadge
                    text={`#${selectedComplaint.id.slice(-8).toUpperCase()}`}
                    label="Report ID"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-6 flex gap-3 justify-between">
            <Button
              variant="outline"
              onClick={() => setIsComplaintDialogOpen(false)}
              className="h-11 px-6 rounded-xl font-bold uppercase text-[10px] tracking-wider"
            >
              Close
            </Button>
            {selectedComplaint && (
              <Link href={`/admin/complaints/${selectedComplaint.id}`}>
                <Button className="h-11 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-wider shadow-md">
                  Open Full Report <ArrowUpRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SESSION SECURITY DETAIL DIALOG */}
      <Dialog open={isSessionDialogOpen} onOpenChange={setIsSessionDialogOpen}>
        <DialogContent className="rounded-3xl border-none p-6 md:p-8 max-w-lg shadow-2xl bg-white dark:bg-card">
          <DialogHeader className="pb-4 border-b border-gray-100 dark:border-border">
            <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2.5 text-gray-900 dark:text-foreground">
              <Shield className="h-5 w-5 text-rose-600" />
              Active Session Security Info
            </DialogTitle>
          </DialogHeader>

          {selectedSession && (
            <div className="space-y-4 pt-4">
              <div className="p-4 bg-gray-50 dark:bg-muted/20 border border-gray-100 dark:border-border rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Smartphone className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                    <span className="text-xs font-black uppercase tracking-tight text-gray-900 dark:text-foreground">
                      {selectedSession.device || "Browser Client"}
                    </span>
                  </div>
                  <Badge
                    className={`rounded-lg px-2.5 py-0.5 font-bold text-[9px] uppercase tracking-widest border shadow-none ${selectedSession.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-400"}`}
                  >
                    {selectedSession.isActive ? "Active Session" : "Revoked"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-0.5">
                      IP Address
                    </span>
                    <span className="font-mono font-bold text-gray-900 dark:text-foreground">
                      {selectedSession.ipAddress || "0.0.0.0"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-0.5">
                      Session Token ID
                    </span>
                    <CopyBadge
                      text={`#${selectedSession.id.slice(-8).toUpperCase()}`}
                      label="Session ID"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-0.5">
                      Creation Date
                    </span>
                    <span className="font-bold text-gray-900 dark:text-foreground">
                      {format(new Date(selectedSession.createdAt), "PPP p")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-0.5">
                      Last Active
                    </span>
                    <span className="font-bold text-gray-900 dark:text-foreground">
                      {format(new Date(selectedSession.lastActive), "PPP p")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-6 flex gap-3 justify-between">
            <Button
              variant="outline"
              onClick={() => setIsSessionDialogOpen(false)}
              className="h-11 px-6 rounded-xl font-bold uppercase text-[10px] tracking-wider"
            >
              Close
            </Button>
            {selectedSession?.isActive && (
              <Button
                onClick={async () => {
                  try {
                    const res = await fetch(
                      `/api/user/sessions?sessionId=${selectedSession.id}`,
                      { method: "DELETE" },
                    );
                    if (res.ok) {
                      toast.success("Session revoked");
                      setIsSessionDialogOpen(false);
                      router.refresh();
                    }
                  } catch (e) {
                    toast.error("Failed to revoke session");
                  }
                }}
                className="h-11 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-wider shadow-md"
              >
                Revoke This Session
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Salary Slip Modal */}
      <Dialog open={isSlipDialogOpen} onOpenChange={setIsSlipDialogOpen}>
        <DialogContent className="max-w-3xl p-0 bg-transparent border-none overflow-y-auto max-h-[95vh] shadow-none">
          {selectedSalary && (
            <SalarySlip
              salary={{
                ...selectedSalary,
                StaffProfile: {
                  User: user,
                  designation:
                    user.role === "WARDEN" ? "Hostel Warden" : "Staff",
                },
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="rounded-3xl border-none p-6 md:p-8 max-w-lg shadow-2xl bg-white dark:bg-card">
          <DialogHeader className="pb-4 border-b border-gray-100 dark:border-border">
            <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <User className="h-5 w-5 text-slate-700 dark:text-slate-300" />
              Edit User Profile
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Full Name
                </Label>
                <Input
                  value={editData?.name || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, name: e.target.value })
                  }
                  className="h-11 rounded-xl border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/20 font-bold text-xs"
                />
              </div>
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Email Address
                </Label>
                <Input
                  value={editData?.email || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, email: e.target.value })
                  }
                  className="h-11 rounded-xl border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/20 font-bold text-xs"
                />
              </div>
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Phone Number
                </Label>
                <Input
                  value={editData?.phone || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, phone: e.target.value })
                  }
                  className="h-11 rounded-xl border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/20 font-bold text-xs"
                />
              </div>
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  CNIC / National ID
                </Label>
                <Input
                  value={editData?.cnic || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, cnic: e.target.value })
                  }
                  className="h-11 rounded-xl border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/20 font-bold text-xs"
                />
              </div>
            </div>

            {editData?.role === "WARDEN" && (
              <div className="space-y-3 pt-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Warden Expense Permissions
                </Label>
                <div className="grid grid-cols-2 gap-2.5 p-4 bg-gray-50 dark:bg-muted/20 rounded-2xl border border-gray-100 dark:border-border">
                  <div className="flex items-center gap-2.5 col-span-2 pb-2 border-b border-gray-200 dark:border-border">
                    <input
                      type="checkbox"
                      id="edit-manage-expenses-detailed"
                      className="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-900"
                      checked={editData?.canManageExpenses || false}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          canManageExpenses: e.target.checked,
                        })
                      }
                    />
                    <Label
                      htmlFor="edit-manage-expenses-detailed"
                      className="text-[11px] font-bold text-gray-900 dark:text-foreground cursor-pointer uppercase"
                    >
                      Master Access (All Expenses)
                    </Label>
                  </div>
                  {[
                    { id: "canManageMess", label: "Mess" },
                    { id: "canManageGeneral", label: "General" },
                    { id: "canManageUtilities", label: "Utilities" },
                    { id: "canManageMaintenance", label: "Maintenance" },
                    { id: "canManageSalaries", label: "Salaries" },
                  ].map((p) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`edit-detailed-${p.id}`}
                        disabled={editData?.canManageExpenses}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-slate-900 focus:ring-slate-900"
                        checked={
                          editData?.canManageExpenses ||
                          editData?.[p.id] ||
                          false
                        }
                        onChange={(e) =>
                          setEditData({ ...editData, [p.id]: e.target.checked })
                        }
                      />
                      <Label
                        htmlFor={`edit-detailed-${p.id}`}
                        className={`text-[10px] font-bold uppercase cursor-pointer ${editData?.canManageExpenses ? "text-gray-300" : "text-gray-600 dark:text-muted-foreground"}`}
                      >
                        {p.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="pt-6">
            <Button
              onClick={handleEditIdentity}
              disabled={isUpdating}
              className="h-12 w-full rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 text-white font-black uppercase tracking-wider shadow-md transition-all"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Change Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="rounded-3xl border-none p-6 md:p-8 max-w-sm shadow-2xl bg-white dark:bg-card">
          <DialogHeader className="pb-3 border-b border-gray-100 dark:border-border">
            <DialogTitle className="text-lg font-black uppercase tracking-tight text-center flex items-center justify-center gap-2">
              <Shield className="h-5 w-5 text-amber-500" />
              Set User Role
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            {["ADMIN", "WARDEN", "STAFF", "RESIDENT", "GUEST"].map((r) => (
              <Button
                key={r}
                onClick={() => setEditData({ ...editData, role: r })}
                variant={editData?.role === r ? "default" : "outline"}
                className={`h-11 w-full rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all ${editData?.role === r ? "bg-slate-900 text-white border-slate-900 shadow-sm dark:bg-slate-100 dark:text-slate-900" : "border-gray-200 dark:border-border text-gray-500"}`}
              >
                {r === "RESIDENT" ? "STUDENT" : r}
              </Button>
            ))}

            {editData?.role === "WARDEN" && (
              <div className="space-y-3 pt-2 text-left">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Warden Expense Permissions
                </Label>
                <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 dark:bg-muted/20 rounded-xl border border-gray-100 dark:border-border">
                  <div className="flex items-center gap-2 col-span-2 pb-2 border-b border-gray-200 dark:border-border">
                    <input
                      type="checkbox"
                      id="role-manage-expenses-detailed"
                      className="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-900"
                      checked={editData?.canManageExpenses || false}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          canManageExpenses: e.target.checked,
                        })
                      }
                    />
                    <Label
                      htmlFor="role-manage-expenses-detailed"
                      className="text-[10px] font-bold text-gray-900 dark:text-foreground cursor-pointer uppercase"
                    >
                      Master Access (All)
                    </Label>
                  </div>
                  {[
                    { id: "canManageMess", label: "Mess" },
                    { id: "canManageGeneral", label: "General" },
                    { id: "canManageUtilities", label: "Utilities" },
                    { id: "canManageMaintenance", label: "Maintenance" },
                    { id: "canManageSalaries", label: "Salaries" },
                  ].map((p) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`role-detailed-${p.id}`}
                        disabled={editData?.canManageExpenses}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-slate-900 focus:ring-slate-900"
                        checked={
                          editData?.canManageExpenses ||
                          editData?.[p.id] ||
                          false
                        }
                        onChange={(e) =>
                          setEditData({ ...editData, [p.id]: e.target.checked })
                        }
                      />
                      <Label
                        htmlFor={`role-detailed-${p.id}`}
                        className={`text-[9px] font-bold uppercase cursor-pointer ${editData?.canManageExpenses ? "text-gray-300" : "text-gray-600"}`}
                      >
                        {p.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="pt-6">
            <Button
              onClick={handleUpdateRole}
              disabled={isUpdating}
              className="h-12 w-full rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 text-white font-black uppercase tracking-wider shadow-sm"
            >
              Update User Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={isAccessDialogOpen} onOpenChange={setIsAccessDialogOpen}>
        <DialogContent className="rounded-3xl border-none p-6 md:p-8 max-w-sm shadow-2xl bg-white dark:bg-card">
          <DialogHeader className="pb-3 border-b border-gray-100 dark:border-border">
            <DialogTitle className="text-lg font-black uppercase tracking-tight text-center flex items-center justify-center gap-2">
              <Lock className="h-5 w-5 text-blue-600" />
              Reset Password
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4 text-center">
            <p className="text-xs text-gray-500 dark:text-muted-foreground">
              Enter a new temporary password for this user account.
            </p>
            <Input
              type="text"
              placeholder="New password..."
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              className="h-12 rounded-xl border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/20 font-black text-center text-base tracking-wider"
            />
          </div>
          <DialogFooter className="pt-6">
            <Button
              onClick={handleResetKey}
              className="h-12 w-full rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-wider shadow-md shadow-rose-200 dark:shadow-none"
            >
              Reset Password Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Reminder & Alert Dialog */}
      <Dialog
        open={isReminderDialogOpen}
        onOpenChange={setIsReminderDialogOpen}
      >
        <DialogContent className="rounded-3xl border-none p-6 md:p-8 max-w-md shadow-2xl bg-white dark:bg-card">
          <DialogHeader className="pb-3 border-b border-gray-100 dark:border-border">
            <DialogTitle className="text-lg font-black uppercase tracking-tight text-left flex items-center gap-2">
              <Bell className="h-5 w-5 text-indigo-600 animate-bounce" />
              Send Reminder
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted-foreground">
                Reminder Type
              </Label>
              <select
                value={reminderType}
                onChange={(e) => setReminderType(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/20 text-xs font-bold uppercase tracking-wide focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="GENERAL">General Notice</option>
                <option value="RENT_DUE">Rent Outstanding</option>
                <option value="WARNING">Official Warning</option>
                <option value="URGENT">Urgent Action Required</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted-foreground">
                Quick Template (Optional)
              </Label>
              <select
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "custom") return;
                  const idx = parseInt(val, 10);
                  const template = QUICK_TEMPLATES[idx];
                  if (template) {
                    setReminderSubject(template.subject);
                    setReminderMessage(template.message);
                    setReminderType(template.type);
                  }
                }}
                className="w-full h-11 px-3 rounded-xl border border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/20 text-xs font-bold uppercase tracking-wide focus:outline-none focus:ring-1 focus:ring-indigo-500"
                defaultValue="custom"
              >
                <option value="custom">-- Select Quick Template --</option>
                {QUICK_TEMPLATES.map((item, idx) => (
                  <option key={idx} value={idx}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted-foreground">
                Reminder Subject
              </Label>
              <Input
                type="text"
                placeholder="e.g. Outstanding Hostels Due Notice"
                value={reminderSubject}
                onChange={(e) => setReminderSubject(e.target.value)}
                className="h-11 rounded-xl border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/20 text-xs font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-muted-foreground">
                Message Details
              </Label>
              <Textarea
                placeholder="Write reminder message description..."
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
                className="rounded-xl border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/20 text-xs font-medium min-h-[120px] resize-none"
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50/50 dark:bg-muted/10 rounded-2xl border border-gray-100 dark:border-border/30">
              <input
                type="checkbox"
                id="sendReminderWhatsApp"
                checked={sendReminderWhatsApp}
                onChange={(e) => setSendReminderWhatsApp(e.target.checked)}
                className="h-4.5 w-4.5 rounded-lg border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <div className="flex flex-col">
                <Label
                  htmlFor="sendReminderWhatsApp"
                  className="text-xs font-bold text-gray-900 dark:text-foreground cursor-pointer"
                >
                  Send via WhatsApp also
                </Label>
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                  Needs active mobile number & bot service
                </span>
              </div>
            </div>
          </div>
          <DialogFooter className="pt-6 flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setIsReminderDialogOpen(false)}
              className="h-11 rounded-2xl text-[10px] font-black uppercase tracking-widest border-gray-200 dark:border-border order-3 sm:order-1 flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleWhatsAppDirect}
              className="h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest shadow-md shadow-emerald-100 dark:shadow-none order-2 flex-1 flex items-center justify-center gap-2"
            >
              <Smartphone className="h-4 w-4" /> Open WhatsApp
            </Button>
            <Button
              onClick={handleSendReminder}
              disabled={isSendingReminder}
              className="h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest shadow-md shadow-indigo-100 dark:shadow-none order-1 sm:order-3 flex-1"
            >
              {isSendingReminder ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Send Email"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking & Record Payment Dialog */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent className="rounded-3xl border-none p-6 md:p-8 max-w-xl shadow-2xl bg-white dark:bg-card">
          <DialogHeader className="pb-4 border-b border-gray-100 dark:border-border">
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-gray-900 dark:text-foreground flex items-center gap-2.5">
              <Building2 className="h-5 w-5 text-slate-700 dark:text-slate-300" />
              Booking & Log Payment
            </DialogTitle>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6 pt-4">
              <div className="bg-slate-50 dark:bg-muted/20 border border-gray-200 dark:border-border rounded-2xl p-5 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                    Hostel Branch
                  </p>
                  <p className="text-xs font-black text-slate-900 dark:text-foreground">
                    {selectedBooking.room?.Hostel?.name}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                    Room Number
                  </p>
                  <p className="text-xs font-black text-slate-900 dark:text-foreground">
                    Room {selectedBooking.room?.roomNumber}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                    Check-In Date
                  </p>
                  <p className="text-xs font-bold text-gray-700 dark:text-foreground">
                    {selectedBooking.checkIn
                      ? format(
                          new Date(selectedBooking.checkIn),
                          "MMM dd, yyyy",
                        )
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                    Booking Amount
                  </p>
                  <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    PKR {selectedBooking.totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-foreground">
                    Record Instant Payment
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Amount (PKR)
                    </Label>
                    <Input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="e.g. 5000"
                      className="h-11 rounded-xl border-gray-200 dark:border-border font-bold text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Payment Method
                    </Label>
                    <select
                      className="w-full h-11 rounded-xl border border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/20 font-bold text-xs px-3 outline-none focus:ring-2 focus:ring-slate-900"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="CASH">Cash</option>
                      <option value="CARD">Card</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="UPI">Mobile Wallet</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-6 flex gap-3 sm:justify-between w-full">
            {selectedBooking && (
              <Link href={`/admin/bookings/${selectedBooking.id}`}>
                <Button
                  variant="outline"
                  className="h-11 px-4 rounded-xl font-bold uppercase text-[10px] tracking-wider w-full sm:w-auto"
                >
                  View Full Booking{" "}
                  <ArrowUpRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </Link>
            )}
            <Button
              onClick={async () => {
                if (!paymentAmount || isNaN(paymentAmount)) {
                  toast.error("Please enter a valid amount");
                  return;
                }
                try {
                  await createPayment.mutateAsync({
                    bookingId: selectedBooking.id,
                    userId: userId,
                    amount: Number(paymentAmount),
                    method: paymentMethod,
                    date: new Date().toISOString(),
                    status: "PAID",
                    notes: "Logged directly from User Record popup",
                  });
                  setPaymentAmount("");
                  setIsBookingDialogOpen(false);
                  toast.success("Payment recorded successfully");
                  refetchDetails();
                } catch (error) {
                  // Error handled in hook
                }
              }}
              disabled={createPayment.isPending}
              className="h-11 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-wider flex items-center justify-center flex-1 sm:flex-none shadow-md"
            >
              {createPayment.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
                  Processing...
                </>
              ) : (
                "Save Payment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserDetailsPage;
