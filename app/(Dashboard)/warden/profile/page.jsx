"use client";
import React, { useState, useMemo } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  Shield,
  Edit3,
  Save,
  X,
  Key,
  Camera,
  Clock,
  Monitor,
  Laptop,
  Smartphone,
  Globe,
  Lock,
  LogOut,
  Bell,
  MailCheck,
  ShieldCheck,
  History,
  CreditCard,
  Zap,
  CheckCircle,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  Eye,
  EyeOff,
  IdCard,
  Check,
  Server,
  Fingerprint,
  Trash2,
  Loader2,
  Home,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import useAuthStore from "@/hooks/Authstate";
import {
  useUserDetailedProfile,
  useUserUpdate,
  useSessions,
  useTerminateSessions,
  useTerminateAllSessions,
} from "@/hooks/useusers";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import { ProfileSkeleton } from "@/components/ui/skeletons";

// ─── Device Helpers ──────────────────────────────────────────────────────────

function getDeviceIcon(device = "") {
  const d = device.toLowerCase();
  if (d.includes("mobile") || d.includes("iphone") || d.includes("android"))
    return Smartphone;
  if (d.includes("laptop") || d.includes("macbook")) return Laptop;
  return Monitor;
}

function getDeviceLabel(device = "") {
  if (!device) return "Unknown Device";
  if (device.length > 50) return device.slice(0, 50) + "…";
  return device;
}

// ─── Main Component ─────────────────────────────────────────────────────────

const WardenProfilePage = () => {
  const authUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const { data: fetchedUser, isLoading, refetch } = useUserDetailedProfile(authUser?.id);
  const { mutateAsync: updateUserData, isPending: updateLoading } = useUserUpdate();
  const { data: sessionsData, refetch: refetchSessions } = useSessions();

  const terminateSession = useTerminateSessions();
  const terminateAllSessions = useTerminateAllSessions();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    logoutAll: false,
  });
  const [newEmail, setNewEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [emailChangeLoading, setEmailChangeLoading] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [editedData, setEditedData] = useState({});

  const [show2FADialog, setShow2FADialog] = useState(false);
  const [active2FAMethod, setActive2FAMethod] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [twoFactorSecret, setTwoFactorSecret] = useState("");
  const [twoFactorOtp, setTwoFactorOtp] = useState("");
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);
  const [backupCodesSaved, setBackupCodesSaved] = useState(false);
  const [passkeyRegistering, setPasskeyRegistering] = useState(false);
  const [passkeyDeleting, setPasskeyDeleting] = useState(null);

  const user = useMemo(() => fetchedUser || {}, [fetchedUser]);
  const sessions = useMemo(() => user.sessions || sessionsData?.sessions || [], [user, sessionsData]);

  const activeSessions = useMemo(
    () => sessions.filter((s) => s.isActive),
    [sessions]
  );
  const inactiveSessions = useMemo(
    () => sessions.filter((s) => !s.isActive),
    [sessions]
  );

  // Password strength logic
  const passwordStrength = useMemo(() => {
    const pass = passwordData.newPassword;
    if (!pass) return { score: 0, label: "", color: "bg-gray-200" };
    let score = 0;
    if (pass.length >= 6) score += 25;
    if (pass.length >= 10) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[0-9!@#$%^&*]/.test(pass)) score += 25;

    if (score <= 25) return { score, label: "Weak", color: "bg-rose-500" };
    if (score <= 50) return { score, label: "Fair", color: "bg-amber-500" };
    if (score <= 75) return { score, label: "Good", color: "bg-indigo-500" };
    return { score, label: "Strong", color: "bg-emerald-500" };
  }, [passwordData.newPassword]);

  // Timeline from sessions
  const timelineItems = useMemo(() => {
    const items = [];
    if (Array.isArray(sessions)) {
      sessions.forEach((s) => {
        items.push({
          type: "session",
          title: "Logged In",
          description: `Logged in from device: ${getDeviceLabel(s.device)} (IP: ${s.ipAddress || "Unknown"})`,
          date: new Date(s.createdAt || s.lastActive || Date.now()),
          icon: Monitor,
          color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/40",
        });
      });
    }
    return items.sort((a, b) => b.date - a.date).slice(0, 10);
  }, [sessions]);

  // Warden permissions
  const wardenPermissions = [
    { label: "Manage Residents", desc: "View, assign, and manage hostel residents and their bookings.", key: "canManageResidents" },
    { label: "Manage Maintenance", desc: "Oversee repairs, plumbing, electrical, and room maintenance.", key: "canManageMaintenance" },
    { label: "Manage Mess & Meals", desc: "Update daily food menus and handle mess feedback.", key: "canManageMess" },
    { label: "Manage Notices", desc: "Post and manage hostel notice board announcements.", key: "canManageNotices" },
    { label: "Manage Complaints", desc: "Review and resolve resident complaints and support tickets.", key: "canManageComplaints" },
    { label: "Manage Room Swaps", desc: "Process and approve resident room swap requests.", key: "canManageRoomSwaps" },
  ];

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleEdit = () => {
    setEditedData({ ...user });
    setIsEditing(true);
  };

  const handleCancel = () => setIsEditing(false);

  const handleSave = async () => {
    try {
      await updateUserData({ id: authUser?.id, data: editedData });
      setIsEditing(false);
      refetch();
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error("New passwords do not match");
    }
    if (passwordData.newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }
    setChangingPass(true);
    try {
      const res = await fetch(`/api/auth/changepassword/${authUser?.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          logoutAll: passwordData.logoutAll,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");
      toast.success("Password changed successfully");
      setShowPasswordDialog(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "", logoutAll: false });
      if (passwordData.logoutAll) useAuthStore.getState().logout();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setChangingPass(false);
    }
  };

  const handleSendOtp = async () => {
    if (!newEmail || !newEmail.includes("@"))
      return toast.error("Enter a valid email");
    setEmailChangeLoading(true);
    try {
      const res = await fetch("/api/auth/change-email/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail }),
      });
      if (!res.ok) throw new Error("Failed to send verification code");
      toast.success("Verification code sent");
      setShowOtpInput(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEmailChangeLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setEmailChangeLoading(true);
    try {
      const res = await fetch("/api/auth/change-email/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, otp, userId: authUser?.id }),
      });
      if (!res.ok) throw new Error("Invalid verification code");
      toast.success("Email updated successfully");
      setShowEmailDialog(false);
      setOtp("");
      setShowOtpInput(false);
      if (authUser?.id) {
        await queryClient.invalidateQueries({ queryKey: ["users", "byid", authUser.id] });
      }
      if (authUser) useAuthStore.getState().setUser({ ...authUser, email: newEmail });
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEmailChangeLoading(false);
    }
  };

  const handleEnable2FAInit = async (method) => {
    setActive2FAMethod(method);
    setTwoFactorOtp("");
    setBackupCodes([]);
    setBackupCodesSaved(false);
    try {
      const res = await fetch("/api/auth/2fa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to start setup");
      if (method === "TOTP") {
        setQrCodeUrl(data.qrCodeUrl);
        setTwoFactorSecret(data.secret);
      } else if (method === "BACKUP_CODES") {
        setBackupCodes(data.codes || []);
      }
      setShow2FADialog(true);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleVerify2FA = async () => {
    if (active2FAMethod === "BACKUP_CODES") {
      if (!backupCodesSaved) return toast.error("Please confirm you have saved the backup codes");
      setVerifying2FA(true);
      try {
        const res = await fetch("/api/auth/2fa/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ otp: "confirmed", method: "BACKUP_CODES" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed");
        toast.success("Backup Codes 2FA enabled!");
        setShow2FADialog(false);
        refetch();
      } catch (err) {
        toast.error(err.message);
      } finally {
        setVerifying2FA(false);
      }
      return;
    }
    if (!twoFactorOtp || twoFactorOtp.length !== 6) return toast.error("Please enter a valid 6-digit code");
    setVerifying2FA(true);
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: twoFactorOtp, method: active2FAMethod }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid code.");
      toast.success(`${active2FAMethod === "TOTP" ? "Authenticator App" : "Email OTP"} 2FA enabled!`);
      setShow2FADialog(false);
      setTwoFactorOtp("");
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setVerifying2FA(false);
    }
  };

  const handleDisable2FA = async () => {
    try {
      const res = await fetch("/api/auth/2fa/disable", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      toast.success("All 2-Step Verification methods have been disabled");
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRegisterPasskey = async () => {
    setPasskeyRegistering(true);
    try {
      const optRes = await fetch("/api/auth/passkey/register-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const optData = await optRes.json();
      if (!optRes.ok) throw new Error(optData.message || "Failed to start registration");
      const { startRegistration } = await import("@simplewebauthn/browser");
      const credential = await startRegistration({ optionsJSON: optData.options });
      const getBrowserDeviceName = () => {
        const ua = navigator.userAgent;
        if (/android/i.test(ua)) return "Android Device";
        if (/iPad|iPhone|iPod/.test(ua)) return "iOS Device";
        if (/macintosh/i.test(ua)) return "Mac Device";
        if (/windows/i.test(ua)) return "Windows Device";
        return "Passkey Device";
      };
      const deviceLabel = prompt("Enter a label for this passkey:", getBrowserDeviceName()) || getBrowserDeviceName();
      const verRes = await fetch("/api/auth/passkey/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential, deviceName: deviceLabel }),
      });
      const verData = await verRes.json();
      if (!verRes.ok) throw new Error(verData.message || "Verification failed");
      toast.success("Passkey registered successfully!");
      refetch();
    } catch (err) {
      if (err.name === "NotAllowedError") toast.error("Passkey registration was cancelled");
      else toast.error(err.message || "Passkey registration failed");
    } finally {
      setPasskeyRegistering(false);
    }
  };

  const handleDeletePasskey = async (passkeyId) => {
    setPasskeyDeleting(passkeyId);
    try {
      const res = await fetch("/api/auth/passkey/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passkeyId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete passkey");
      toast.success("Passkey removed");
      refetch();
    } catch (err) {
      toast.error(err.message || "Failed to delete passkey");
    } finally {
      setPasskeyDeleting(null);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch { }
  };

  const handleTerminateSession = (sessionId) => {
    terminateSession.mutate(sessionId, {
      onSuccess: () => { refetchSessions(); refetch(); },
    });
  };

  const handleTerminateAll = () => {
    terminateAllSessions.mutate(undefined, {
      onSuccess: () => {
        toast.success("Other sessions terminated");
        refetchSessions();
        refetch();
      },
    });
  };

  const initials = useMemo(() => {
    const name = user.name || authUser?.name || "W";
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  }, [user, authUser]);

  if (isLoading) return <ProfileSkeleton />;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background pb-20 font-sans tracking-tight">

      {/* ── Banner Header (Amber/Warden themed) ── */}
      <div className="bg-gradient-to-br from-slate-950 via-amber-950 to-neutral-950 h-56 relative overflow-hidden flex items-end">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20" />
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl" />

        {/* Action Header bar */}
        <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
              <Home className="h-4.5 w-4.5 text-amber-200" />
            </div>
            <span className="text-white/90 text-xs font-black uppercase tracking-widest">
              Warden Settings
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <Button
                onClick={handleEdit}
                size="sm"
                className="h-9 px-5 rounded-xl bg-white text-slate-950 hover:bg-slate-100 text-[11px] font-bold uppercase tracking-wider shadow-md transition-all active:scale-95 flex items-center gap-2"
              >
                <Edit3 className="h-3.5 w-3.5" /> Edit Profile
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleCancel}
                  size="sm"
                  variant="ghost"
                  className="h-9 px-5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 border border-white/10"
                >
                  <X className="h-3.5 w-3.5" /> Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateLoading}
                  size="sm"
                  className="h-9 px-5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold uppercase tracking-wider shadow-lg transition-all active:scale-95 flex items-center gap-2"
                >
                  <Save className="h-3.5 w-3.5" />
                  {updateLoading ? "Saving" : "Save Changes"}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* User Identity Container */}
        <div className="max-w-7xl mx-auto w-full px-6 pb-6 flex items-end gap-6 relative z-10">
          <div className="relative shrink-0 group">
            <div className="h-28 w-28 rounded-3xl bg-slate-900 flex items-center justify-center border-4 border-slate-950 text-white text-3xl font-black shadow-2xl relative overflow-hidden group-hover:scale-105 transition-transform duration-300">
              {user.image ? (
                <img src={user.image} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 h-6.5 w-6.5 rounded-full bg-amber-500 border-3 border-slate-950 flex items-center justify-center shadow-lg">
              <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
            </div>
          </div>
          <div className="flex-1 pb-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-white tracking-tight uppercase">
                {user.name || "Warden"}
              </h1>
              <Badge className="bg-amber-500/20 text-amber-200 border border-amber-500/30 text-[10px] font-black rounded px-2.5 py-0.5 uppercase tracking-wider">
                {user.role}
              </Badge>
              <Badge
                className={`border text-[10px] font-black rounded px-2.5 py-0.5 uppercase tracking-wider ${user.isActive
                  ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/30"
                  : "bg-rose-500/20 text-rose-200 border-rose-500/30"
                  }`}
              >
                {user.isActive ? "ACTIVE" : "INACTIVE"}
              </Badge>
            </div>
            <p className="text-white/60 text-xs mt-1.5 font-medium flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> {user.email}
            </p>
          </div>
        </div>
      </div>

      {/* ── Dashboard Metrics Row ── */}
      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              label: "Security Status",
              value: user.twoFactorEnabled ? "2FA Active" : "Unprotected",
              desc: "Two-step verification status",
              icon: ShieldCheck,
              color: user.twoFactorEnabled ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "text-rose-600 bg-rose-50 border-rose-100",
            },
            {
              label: "Active Devices",
              value: `${activeSessions.length} Devices`,
              desc: "Active logins in system",
              icon: Monitor,
              color: "text-blue-600 bg-blue-50 border-blue-100",
            },
            {
              label: "Your Hostel",
              value: user.hostel?.name || user.assignedHostel?.name || "Assigned",
              desc: "Your managed hostel",
              icon: Building2,
              color: "text-amber-600 bg-amber-50 border-amber-100",
            },
            {
              label: "Warden Access",
              value: "Full Control",
              desc: "Your clearance level",
              icon: Zap,
              color: "text-indigo-600 bg-indigo-50 border-indigo-100",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white dark:bg-card border border-slate-100 dark:border-border rounded-2xl p-5 flex items-center gap-4 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-300"
            >
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">
                  {stat.label}
                </p>
                <p className="text-lg font-bold text-slate-900 dark:text-foreground mt-0.5 tracking-tight">
                  {stat.value}
                </p>
                <p className="text-[9px] font-medium text-slate-400 dark:text-muted-foreground mt-0.5">
                  {stat.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main Tabbed Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Navigation Cockpit */}
          <div className="lg:col-span-3">
            <Card className="border border-slate-100 dark:border-border rounded-2xl shadow-sm p-4 bg-white dark:bg-card">
              <div className="space-y-1">
                {[
                  { value: "overview", label: "Profile Info", icon: User },
                  { value: "timeline", label: "Recent Activity", icon: Clock },
                  { value: "sessions", label: "Devices", icon: Monitor, count: activeSessions.length },
                  { value: "security", label: "Security Settings", icon: Lock },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 ${activeTab === tab.value
                      ? "bg-amber-600 text-white shadow-lg shadow-amber-900/10"
                      : "text-slate-500 hover:text-slate-950 hover:bg-slate-50"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <tab.icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </div>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${activeTab === tab.value ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                        }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <Separator className="my-4" />
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-rose-500 hover:bg-rose-50/50 hover:text-rose-600 transition-all"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </Card>
          </div>

          {/* Workspace Views */}
          <div className="lg:col-span-9 space-y-6">

            {/* Overview / Personal Info */}
            {activeTab === "overview" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <Card className="border border-slate-100 dark:border-border rounded-2xl shadow-sm bg-white dark:bg-card">
                  <CardHeader className="p-6 pb-2">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-foreground flex items-center gap-2">
                      <User className="h-4.5 w-4.5 text-amber-600" /> Personal Details
                    </CardTitle>
                    <CardDescription className="text-xs">Your system contact details and information.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { label: "Full Name", key: "name", type: "input", icon: User },
                        { label: "Email Address", key: "email", type: "readonly", icon: Mail },
                        { label: "Phone Number", key: "phone", type: "input", icon: Phone },
                        { label: "CNIC / ID Number", key: "cnic", type: "input", icon: IdCard },
                        { label: "City", key: "city", type: "input", icon: MapPin },
                        { label: "System Role", key: "role", type: "readonly", icon: Shield },
                      ].map((field) => (
                        <div key={field.key} className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                            <field.icon className="h-3.5 w-3.5" /> {field.label}
                          </Label>
                          {isEditing && field.type === "input" ? (
                            <Input
                              value={editedData[field.key] || ""}
                              onChange={(e) =>
                                setEditedData({ ...editedData, [field.key]: e.target.value })
                              }
                              className="h-11 rounded-xl border-slate-200 dark:border-border text-sm font-medium focus:ring-amber-600 bg-slate-50/50"
                            />
                          ) : (
                            <div className="h-11 flex items-center px-4 rounded-xl border border-transparent bg-slate-50/50 dark:bg-muted/5 text-sm font-bold text-slate-950 dark:text-foreground">
                              {user[field.key] || "—"}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" /> Address
                      </Label>
                      {isEditing ? (
                        <Textarea
                          value={editedData.address || ""}
                          onChange={(e) =>
                            setEditedData({ ...editedData, address: e.target.value })
                          }
                          className="rounded-xl border-slate-200 dark:border-border text-sm font-medium bg-slate-50/50"
                          rows={3}
                        />
                      ) : (
                        <div className="p-4 rounded-xl border border-transparent bg-slate-50/50 dark:bg-muted/5 text-sm font-bold text-slate-950 dark:text-foreground leading-relaxed">
                          {user.address || "—"}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Warden Permissions Matrix */}
                <Card className="border border-slate-100 dark:border-border rounded-2xl shadow-sm bg-white dark:bg-card overflow-hidden">
                  <CardHeader className="p-6 pb-2">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-foreground flex items-center gap-2">
                      <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" /> Access Permissions
                    </CardTitle>
                    <CardDescription className="text-xs">Modules you have permission to manage in this system.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {wardenPermissions.map((perm, i) => {
                        const hasAccess = user[perm.key] === true;
                        return (
                          <div
                            key={i}
                            className={`p-4 rounded-xl border flex items-start gap-4 transition-all ${hasAccess
                              ? "bg-emerald-500/5 border-emerald-100 dark:border-emerald-900/30"
                              : "bg-slate-50 border-slate-100 dark:bg-muted/5 dark:border-border"
                              }`}
                          >
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${hasAccess ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-400"
                              }`}>
                              {hasAccess ? <Check className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-slate-900 dark:text-foreground">{perm.label}</p>
                              <p className="text-[10px] text-slate-400 dark:text-muted-foreground leading-relaxed">{perm.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Assigned Hostel */}
                {(user.hostel || user.assignedHostel) && (
                  <Card className="border border-slate-100 dark:border-border rounded-2xl shadow-sm bg-white dark:bg-card">
                    <CardHeader className="p-6 pb-2">
                      <CardTitle className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-foreground flex items-center gap-2">
                        <Building2 className="h-4.5 w-4.5 text-amber-600" /> Assigned Hostel
                      </CardTitle>
                      <CardDescription className="text-xs">The hostel property you are currently managing.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      {(() => {
                        const hostel = user.hostel || user.assignedHostel;
                        return (
                          <div className="p-5 rounded-2xl border border-slate-100 dark:border-border bg-slate-50/50 dark:bg-muted/5 flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-foreground uppercase">{hostel?.name || "—"}</h4>
                                <Badge className="bg-amber-600 text-white text-[9px] uppercase tracking-wider px-2 py-0.5">{hostel?.type || "Hostel"}</Badge>
                              </div>
                              <p className="text-[11px] text-slate-400 dark:text-muted-foreground mt-2 flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5 shrink-0" /> {hostel?.address || "—"}, {hostel?.city || "—"}
                              </p>
                              <p className="text-[11px] text-slate-400 dark:text-muted-foreground mt-1 flex items-center gap-1">
                                <Phone className="h-3.5 w-3.5 shrink-0" /> {hostel?.phone || "—"}
                              </p>
                            </div>
                            <Separator className="my-3" />
                            <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-muted-foreground uppercase font-black tracking-wider">
                              <span>Floors: {hostel?.floors || "—"}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Timeline */}
            {activeTab === "timeline" && (
              <Card className="border border-slate-100 dark:border-border rounded-2xl shadow-sm bg-white dark:bg-card animate-in fade-in duration-300">
                <CardHeader className="p-6 pb-2">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-foreground flex items-center gap-2">
                    <Clock className="h-4.5 w-4.5 text-amber-600" /> Recent Activity
                  </CardTitle>
                  <CardDescription className="text-xs">A log of recent actions done on this account.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {timelineItems.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                        <History className="h-6 w-6 text-slate-300" />
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-foreground">No recent actions</p>
                    </div>
                  ) : (
                    <div className="relative pl-6 border-l border-slate-100 dark:border-border space-y-8 py-3 ml-3">
                      {timelineItems.map((item, i) => (
                        <div key={i} className="relative">
                          <div className={`absolute -left-[37px] top-0 h-8.5 w-8.5 rounded-full border-4 border-white dark:border-card flex items-center justify-center shadow-sm shrink-0 ${item.color}`}>
                            <item.icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <p className="text-xs font-bold text-slate-900 dark:text-foreground">{item.title}</p>
                              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">
                                {format(item.date, "MMM dd, yyyy · HH:mm")}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 dark:text-muted-foreground leading-relaxed">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Sessions / Devices */}
            {activeTab === "sessions" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <Card className="border border-slate-100 dark:border-border rounded-2xl shadow-sm bg-white dark:bg-card">
                  <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="text-slate-900 dark:text-foreground font-bold text-sm">Logged-in Devices</h3>
                      <p className="text-slate-400 text-xs mt-0.5">Manage the devices currently logged into your account.</p>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => refetchSessions()}
                        className="h-9 px-4 rounded-xl text-xs font-medium bg-white dark:bg-card"
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh
                      </Button>
                      {activeSessions.length > 1 && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleTerminateAll}
                          disabled={terminateAllSessions.isPending}
                          className="h-9 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white uppercase tracking-wider"
                        >
                          Sign Out Others
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>

                <div className="space-y-4">
                  {activeSessions.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-3 w-1 bg-emerald-500 rounded-full" />
                        <h4 className="text-[10px] font-black text-slate-955 dark:text-foreground uppercase tracking-wider">Active Device</h4>
                      </div>
                      {activeSessions.map((session) => {
                        const DeviceIcon = getDeviceIcon(session.device);
                        return (
                          <div
                            key={session.id}
                            className={`p-5 rounded-2xl border bg-white dark:bg-card shadow-sm transition-all ${session.isCurrent
                              ? "border-amber-100 bg-amber-50/10 dark:border-amber-950/30"
                              : "border-slate-100 dark:border-border"
                              }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-4">
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${session.isCurrent ? "bg-amber-600 text-white border-amber-500" : "bg-slate-100 text-slate-400 border-slate-200"
                                  }`}>
                                  <DeviceIcon className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-bold text-slate-900 dark:text-foreground">
                                      {getDeviceLabel(session.device)}
                                    </span>
                                    {session.isCurrent && (
                                      <Badge className="bg-amber-600 hover:bg-amber-600 text-white border-none text-[8px] font-bold rounded-full px-2">
                                        This Device
                                      </Badge>
                                    )}
                                    <span className="flex items-center gap-1">
                                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                      <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">LIVE</span>
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-400 dark:text-muted-foreground font-medium">
                                    <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5 text-slate-300" /> {session.ipAddress || "—"}</span>
                                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-slate-300" /> Active: Just Now</span>
                                  </div>
                                </div>
                              </div>
                              {!session.isCurrent && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-[10px] font-bold uppercase tracking-wider"
                                  onClick={() => handleTerminateSession(session.id)}
                                  disabled={terminateSession.isPending}
                                >
                                  Sign Out Device
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {inactiveSessions.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-3 w-1 bg-slate-300 rounded-full" />
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Previous Devices</h4>
                      </div>
                      {inactiveSessions.slice(0, 5).map((session) => {
                        const DeviceIcon = getDeviceIcon(session.device);
                        return (
                          <div
                            key={session.id}
                            className="bg-white dark:bg-card border border-slate-100 dark:border-border rounded-2xl p-4 opacity-70 hover:opacity-100 transition-all shadow-sm"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="h-9 w-9 rounded-lg bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                                  <DeviceIcon className="h-4.5 w-4.5" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-700 dark:text-foreground">
                                    {getDeviceLabel(session.device)}
                                  </p>
                                  <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-0.5 flex-wrap">
                                    <span>IP: {session.ipAddress || "—"}</span>
                                    <span>·</span>
                                    <span>
                                      {session.lastActive
                                        ? formatDistanceToNow(new Date(session.lastActive), { addSuffix: true })
                                        : "—"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-[8px] font-black text-slate-450 rounded-full uppercase tracking-widest shrink-0">Expired</Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Security tab */}
            {activeTab === "security" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <Card className="border border-slate-100 dark:border-border rounded-2xl shadow-sm bg-white dark:bg-card overflow-hidden">
                  <CardHeader className="p-6 pb-2">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-foreground flex items-center gap-2">
                      <Lock className="h-4.5 w-4.5 text-amber-600" /> Security Settings
                    </CardTitle>
                    <CardDescription className="text-xs">Manage passwords, email verification, and two-factor authentication.</CardDescription>
                  </CardHeader>
                  <div className="divide-y divide-slate-100 dark:divide-border">

                    {/* Password change panel */}
                    <div className="p-6 flex items-center justify-between gap-6 hover:bg-slate-50/50 dark:hover:bg-muted/5 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 flex items-center justify-center text-amber-600 shrink-0">
                          <Key className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-foreground">Update Password</p>
                          <p className="text-xs text-slate-450 dark:text-muted-foreground mt-0.5">Regularly change your password to keep your account safe.</p>
                        </div>
                      </div>
                      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="h-9 rounded-xl text-xs font-bold uppercase tracking-wider bg-white dark:bg-card">Change Password</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md rounded-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 font-bold uppercase tracking-wider">
                              <Key className="h-4.5 w-4.5 text-amber-600" /> Change Password
                            </DialogTitle>
                            <DialogDescription>Enter your new password below (at least 6 characters).</DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4 py-3">
                            <div className="relative">
                              <Input
                                type={showCurrentPass ? "text" : "password"}
                                placeholder="Current Password"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                className="rounded-xl h-11 pr-10"
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-450"
                                onClick={() => setShowCurrentPass(!showCurrentPass)}
                              >
                                {showCurrentPass ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                              </button>
                            </div>

                            <div className="space-y-2">
                              <div className="relative">
                                <Input
                                  type={showNewPass ? "text" : "password"}
                                  placeholder="New Password"
                                  value={passwordData.newPassword}
                                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                  className="rounded-xl h-11 pr-10"
                                />
                                <button
                                  type="button"
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-455"
                                  onClick={() => setShowNewPass(!showNewPass)}
                                >
                                  {showNewPass ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                                </button>
                              </div>

                              {passwordData.newPassword && (
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                                    <span className="text-slate-400">Strength:</span>
                                    <span className={passwordStrength.color.replace("bg-", "text-")}>{passwordStrength.label}</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full ${passwordStrength.color} transition-all duration-300`} style={{ width: `${passwordStrength.score}%` }} />
                                  </div>
                                </div>
                              )}
                            </div>

                            <Input
                              type="password"
                              placeholder="Confirm Password"
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                              className="rounded-xl h-11"
                            />

                            {passwordData.newPassword && passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                              <p className="text-[11px] text-rose-500 font-bold flex items-center gap-1">
                                <AlertTriangle className="h-3.5 w-3.5" /> Passwords do not match
                              </p>
                            )}

                            <label className="flex items-center gap-2.5 cursor-pointer mt-1">
                              <input
                                type="checkbox"
                                checked={passwordData.logoutAll}
                                onChange={(e) => setPasswordData({ ...passwordData, logoutAll: e.target.checked })}
                                className="rounded border-slate-300 text-amber-600 focus:ring-amber-600"
                              />
                              <span className="text-xs text-slate-450 font-bold select-none">Log out other devices</span>
                            </label>
                          </div>

                          <DialogFooter>
                            <Button
                              onClick={handlePasswordChange}
                              disabled={changingPass || (passwordData.newPassword !== passwordData.confirmPassword)}
                              className="w-full bg-slate-950 hover:bg-slate-900 text-white rounded-xl h-11 font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95"
                            >
                              {changingPass ? "Updating..." : "Update Password"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {/* Email configuration */}
                    <div className="p-6 flex items-center justify-between gap-6 hover:bg-slate-50/50 dark:hover:bg-muted/5 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                          <MailCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-foreground">Email Address</p>
                          <p className="text-xs text-slate-450 dark:text-muted-foreground mt-0.5">Your current email address: {user.email}</p>
                        </div>
                      </div>
                      <Dialog
                        open={showEmailDialog}
                        onOpenChange={(open) => {
                          setShowEmailDialog(open);
                          if (!open) { setShowOtpInput(false); setOtp(""); setNewEmail(""); }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="h-9 rounded-xl text-xs font-bold uppercase tracking-wider bg-white dark:bg-card">Change Email</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md rounded-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 font-bold uppercase tracking-wider">
                              <MailCheck className="h-4.5 w-4.5 text-blue-600" /> Change Email
                            </DialogTitle>
                            <DialogDescription>
                              {!showOtpInput ? "Enter your new email address below." : `Enter the code sent to ${newEmail}.`}
                            </DialogDescription>
                          </DialogHeader>

                          <div className="py-2">
                            {!showOtpInput ? (
                              <div className="space-y-4">
                                <Input
                                  type="email"
                                  value={newEmail}
                                  onChange={(e) => setNewEmail(e.target.value)}
                                  placeholder="New Email Address"
                                  className="rounded-xl h-11 text-center font-bold"
                                />
                                <Button
                                  onClick={handleSendOtp}
                                  disabled={emailChangeLoading}
                                  className="w-full bg-slate-950 hover:bg-slate-900 text-white rounded-xl h-11 font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95"
                                >
                                  {emailChangeLoading ? "Sending..." : "Send Code"}
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <Input
                                  value={otp}
                                  onChange={(e) => setOtp(e.target.value)}
                                  placeholder="000000"
                                  className="rounded-xl text-center text-xl font-black tracking-[0.4em] h-12"
                                  maxLength={6}
                                />
                                <Button
                                  onClick={handleVerifyOtp}
                                  disabled={emailChangeLoading}
                                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11 font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95"
                                >
                                  {emailChangeLoading ? "Verifying..." : "Verify & Apply"}
                                </Button>
                                <button
                                  type="button"
                                  className="w-full text-center text-[9px] text-slate-400 font-black uppercase tracking-wider hover:text-slate-650"
                                  onClick={() => setShowOtpInput(false)}
                                >
                                  ← Back
                                </button>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {/* Two-step verification methods */}
                    <div className="p-6 space-y-5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                            <Shield className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-foreground">Two-Factor Authentication</p>
                            <p className="text-xs text-slate-450 dark:text-muted-foreground mt-0.5 font-bold uppercase tracking-tight">
                              {user.twoFactorEnabled
                                ? `Active: ${user.twoFactorMethod === "TOTP" ? "Authenticator app" : user.twoFactorMethod === "EMAIL" ? "Email OTP" : "Backup Codes"}`
                                : "Add an extra layer of security to your account."}
                            </p>
                          </div>
                        </div>

                        {user.twoFactorEnabled && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl text-xs font-bold border-rose-200 text-rose-600 hover:bg-rose-50/50 uppercase tracking-wider">
                                Disable 2FA
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl max-w-sm">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Disable 2FA?</AlertDialogTitle>
                                <AlertDialogDescription className="text-xs">This will remove verification checks. Your account will be less secure.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl text-xs">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDisable2FA} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold">Disable</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>

                      {/* Modular verification options grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        {[
                          {
                            method: "TOTP",
                            title: "Authenticator App",
                            desc: "Google Authenticator or Authy App",
                            icon: Smartphone,
                            activeColor: "border-indigo-200 bg-indigo-50/10 dark:border-indigo-950/30",
                            iconBg: "bg-indigo-100 text-indigo-700",
                          },
                          {
                            method: "EMAIL",
                            title: "Email Code",
                            desc: "Get verification codes sent to email",
                            icon: MailCheck,
                            activeColor: "border-blue-200 bg-blue-50/10 dark:border-blue-950/30",
                            iconBg: "bg-blue-100 text-blue-700",
                          },
                          {
                            method: "BACKUP_CODES",
                            title: "Backup Codes",
                            desc: "One-time backup codes for recovery",
                            icon: Key,
                            activeColor: "border-amber-200 bg-amber-50/10 dark:border-amber-950/30",
                            iconBg: "bg-amber-100 text-amber-700",
                            hasCount: user.hasBackupCodes ? `${user.backupCodesRemaining} left` : null,
                          },
                        ].map((m) => {
                          const isActive = user.twoFactorMethod === m.method;
                          return (
                            <div
                              key={m.method}
                              className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${isActive ? m.activeColor : "border-slate-100 dark:border-border hover:border-slate-200"
                                }`}
                            >
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${m.iconBg}`}>
                                    <m.icon className="h-4 w-4" />
                                  </div>
                                  {isActive && <Badge className="bg-slate-900 text-white text-[8px] font-black uppercase tracking-wider rounded">Active</Badge>}
                                </div>
                                <h5 className="text-xs font-bold text-slate-800 dark:text-foreground">{m.title}</h5>
                                <p className="text-[10px] text-slate-450 mt-0.5 leading-relaxed">{m.desc}</p>
                                {m.hasCount && <p className="text-[9px] text-amber-600 font-bold mt-1 uppercase tracking-wider">{m.hasCount}</p>}
                              </div>
                              <div className="mt-3">
                                {!isActive && (
                                  <Button
                                    onClick={() => handleEnable2FAInit(m.method)}
                                    size="sm"
                                    variant="outline"
                                    className="w-full h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white dark:bg-card shadow-sm"
                                  >
                                    {user.twoFactorEnabled ? "Switch" : "Enable"}
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Passkeys (Login Keys) Card */}
                <Card className="border border-slate-100 dark:border-border rounded-2xl shadow-sm bg-white dark:bg-card overflow-hidden">
                  <CardHeader className="p-6 pb-2">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-foreground flex items-center gap-2">
                      <Fingerprint className="h-4.5 w-4.5 text-amber-600" /> Passkeys (Login Keys)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Register your devices (like your phone's fingerprint/face unlock or hardware security keys) to sign in directly without typing a password.
                    </CardDescription>
                  </CardHeader>
                  <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-border">
                      <div>
                        <p className="text-xs text-slate-450 dark:text-muted-foreground">
                          Passkeys provide passwordless, cryptographic authentication that is highly secure.
                        </p>
                      </div>
                      <Button
                        onClick={handleRegisterPasskey}
                        disabled={passkeyRegistering}
                        className="h-9 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white shrink-0"
                      >
                        {passkeyRegistering ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                            Registering...
                          </>
                        ) : (
                          "Add Passkey"
                        )}
                      </Button>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-foreground mb-3">Registered Keys</h4>
                      {user.passkeys && user.passkeys.length > 0 ? (
                        <div className="space-y-3">
                          {user.passkeys.map((pk) => (
                            <div
                              key={pk.id}
                              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-border hover:bg-slate-50/50 dark:hover:bg-muted/5 transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 flex items-center justify-center text-amber-600 shrink-0">
                                  <Fingerprint className="h-4.5 w-4.5" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-800 dark:text-foreground">{pk.deviceName}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    Added on {new Date(pk.createdAt).toLocaleDateString(undefined, {
                                      year: 'numeric', month: 'short', day: 'numeric',
                                      hour: '2-digit', minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              </div>
                              <Button
                                onClick={() => handleDeletePasskey(pk.id)}
                                disabled={passkeyDeleting === pk.id}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 shrink-0"
                              >
                                {passkeyDeleting === pk.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4.5 w-4.5" />
                                )}
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 border border-dashed border-slate-200 dark:border-border rounded-xl">
                          <Fingerprint className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs font-medium text-slate-450 dark:text-muted-foreground">No passkeys registered yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* 2FA SETUP MODALS */}
      <Dialog open={show2FADialog} onOpenChange={(open) => { setShow2FADialog(open); if (!open) { setTwoFactorOtp(""); setBackupCodes([]); setBackupCodesSaved(false); } }}>
        <DialogContent className="max-w-md rounded-xl bg-white dark:bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold uppercase tracking-wider text-sm">
              <Shield className="h-4.5 w-4.5 text-amber-600" />
              {active2FAMethod === "TOTP" && "App Setup"}
              {active2FAMethod === "EMAIL" && "Email Setup"}
              {active2FAMethod === "BACKUP_CODES" && "Backup Codes"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {active2FAMethod === "TOTP" && "Scan this QR code with Google Authenticator to get your login codes."}
              {active2FAMethod === "EMAIL" && "We sent a 6-digit verification code to your email."}
              {active2FAMethod === "BACKUP_CODES" && "Save these backup codes in a safe place. Each can be used once."}
            </DialogDescription>
          </DialogHeader>

          {active2FAMethod === "TOTP" && (
            <div className="space-y-4 flex flex-col items-center py-2">
              {qrCodeUrl && (
                <div className="p-2.5 bg-white border border-slate-100 rounded-xl shadow-sm">
                  <img src={qrCodeUrl} alt="2FA Setup Code" className="w-40 h-40" />
                </div>
              )}
              <div className="w-full text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Secret Key</p>
                <p className="text-xs font-mono font-bold bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg mt-1 select-all break-all">{twoFactorSecret}</p>
              </div>
              <div className="w-full space-y-2">
                <Label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest ml-1">Enter Code</Label>
                <Input value={twoFactorOtp} onChange={(e) => setTwoFactorOtp(e.target.value)} placeholder="000000" className="rounded-lg text-center text-base font-bold tracking-[0.2em] h-11" maxLength={6} />
                <Button onClick={handleVerify2FA} disabled={verifying2FA} className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg h-10 text-xs font-bold uppercase tracking-wider">
                  {verifying2FA ? "Verifying..." : "Verify & Enable"}
                </Button>
              </div>
            </div>
          )}

          {active2FAMethod === "EMAIL" && (
            <div className="space-y-3 py-2">
              <div className="bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100/50 rounded-xl p-4 text-center">
                <MailCheck className="h-7 w-7 text-blue-500 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-slate-800 dark:text-foreground">Code sent to your email</p>
                <p className="text-[10px] text-slate-450 font-bold uppercase mt-0.5">Enter the 6-digit code sent to your inbox.</p>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest ml-1">Enter Code</Label>
                <Input value={twoFactorOtp} onChange={(e) => setTwoFactorOtp(e.target.value)} placeholder="000000" className="rounded-lg text-center text-base font-bold tracking-[0.2em] h-11" maxLength={6} />
                <Button onClick={handleVerify2FA} disabled={verifying2FA} className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg h-10 text-xs font-bold uppercase tracking-wider">
                  {verifying2FA ? "Checking..." : "Verify & Enable"}
                </Button>
              </div>
            </div>
          )}

          {active2FAMethod === "BACKUP_CODES" && (
            <div className="space-y-4 py-2">
              <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100/50 rounded-xl p-3.5">
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, i) => (
                    <div key={i} className="bg-white dark:bg-card border border-amber-200/50 rounded-lg px-2.5 py-1.5 text-center font-mono text-xs font-bold text-slate-800 dark:text-foreground select-all shadow-sm">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 dark:bg-rose-950/10 border border-rose-100/50 rounded-xl">
                <AlertTriangle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-700 dark:text-rose-350 font-bold leading-relaxed">Save these codes. You will not be able to see them again.</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={backupCodesSaved} onChange={(e) => setBackupCodesSaved(e.target.checked)} className="rounded border-slate-355 text-amber-600 focus:ring-amber-600" />
                <span className="text-xs text-slate-700 font-semibold select-none">I have saved these backup codes.</span>
              </label>
              <Button onClick={handleVerify2FA} disabled={verifying2FA || !backupCodesSaved} className="w-full bg-slate-950 hover:bg-slate-800 text-white rounded-lg h-10 text-xs font-bold uppercase tracking-wider">
                {verifying2FA ? "Activating..." : "Confirm & Enable"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* LOGOUT CONFIRM DIALOG */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent className="rounded-xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold uppercase tracking-widest text-slate-900">Logout?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              You will be redirected back to the login page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg text-xs font-semibold">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              disabled={loggingOut}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider"
            >
              {loggingOut ? "Signing Out..." : "Sign Out"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default WardenProfilePage;
