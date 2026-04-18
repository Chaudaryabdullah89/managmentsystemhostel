"use client";
import React, { useState, useMemo, useCallback } from "react";
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
  UserCheck,
  Monitor,
  Laptop,
  Smartphone,
  Globe,
  Lock,
  Settings,
  LogOut,
  Fingerprint,
  Bell,
  MailCheck,
  ShieldCheck,
  History,
  CreditCard,
  Zap,
  Boxes,
  CheckCircle,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Activity,
  Wifi,
  ChevronDown,
  Eye,
  EyeOff,
  IdCard,
  Hash,
  Home,
  BadgeCheck,
  Power,
  PowerOff,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useAuthStore from "@/hooks/Authstate";
import {
  useUserById,
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
  if (device.length > 60) return device.slice(0, 60) + "…";
  return device;
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
        <Icon className="h-4 w-4 text-gray-500" />
      </div>
      <div>
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

// ─── Session Card ────────────────────────────────────────────────────────────

function SessionCard({ session, isCurrent, onTerminate, isPending }) {
  const DeviceIcon = getDeviceIcon(session.device);
  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        isCurrent
          ? "border-blue-200 bg-blue-50/30"
          : "border-gray-100 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${isCurrent ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"}`}
          >
            <DeviceIcon className="h-5 w-5" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[12px] font-black text-gray-900 uppercase tracking-tight">
                {getDeviceLabel(session.device)}
              </span>
              {isCurrent && (
                <Badge className="bg-blue-600 text-white border-none text-[8px] font-bold rounded-full px-2">
                  Current
                </Badge>
              )}
              {session.isActive && (
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  <span className="text-[9px] font-black text-emerald-600 uppercase">
                    Live
                  </span>
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {session.ipAddress || "Unknown IP"}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {session.lastActive
                  ? formatDistanceToNow(new Date(session.lastActive), {
                      addSuffix: true,
                    })
                  : "Now"}
              </span>
            </div>
            <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">
              Started{" "}
              {session.createdAt
                ? format(new Date(session.createdAt), "MMM dd, yyyy • HH:mm")
                : "N/A"}
            </p>
          </div>
        </div>
        {!isCurrent && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-3 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 text-[10px] font-bold uppercase tracking-tight shrink-0"
            onClick={() => onTerminate(session.id)}
            disabled={isPending}
          >
            Sign Out
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

const ProfilePage = () => {
  const authUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { data: fetchedUser, isLoading } = useUserById(authUser?.id);
  const { mutateAsync: updateUserData, isPending: updateLoading } =
    useUserUpdate();
  const {
    data: sessionsData,
    isLoading: sessionsLoading,
    refetch: refetchSessions,
  } = useSessions();
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

  const user = useMemo(() => fetchedUser || {}, [fetchedUser]);
  const sessions = useMemo(() => sessionsData?.sessions || [], [sessionsData]);
  const activeSessions = useMemo(
    () => sessions.filter((s) => s.isActive),
    [sessions],
  );
  const inactiveSessions = useMemo(
    () => sessions.filter((s) => !s.isActive),
    [sessions],
  );

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
          logoutAll: passwordData.logoutAll
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");
      toast.success("Password changed successfully");
      setShowPasswordDialog(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        logoutAll: false,
      });

      if (passwordData.logoutAll) {
         useAuthStore.getState().logout();
      }
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
      if (authUser?.id)
        await queryClient.invalidateQueries({
          queryKey: ["users", "byid", authUser.id],
        });
      if (authUser)
        useAuthStore.getState().setUser({ ...authUser, email: newEmail });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEmailChangeLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      // logout() handles redirect internally
    }
  };

  const handleTerminateSession = (sessionId) => {
    terminateSession.mutate(sessionId, {
      onSuccess: () => refetchSessions(),
    });
  };

  const handleTerminateAll = () => {
    terminateAllSessions.mutate(undefined, {
      onSuccess: () => {
        toast.success("Other sessions terminated");
        refetchSessions();
      },
    });
  };

  // ── Avatar initials ───────────────────────────────────────────────────────

  const initials = useMemo(() => {
    const name = user.name || authUser?.name || "A";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [user, authUser]);

  if (isLoading) return <ProfileSkeleton />;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white pb-24 font-sans">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="bg-gray-50 border-b border-gray-100 h-32 relative">
        <div className="absolute inset-0 bg-linear-to-b from-gray-100/50 to-transparent" />

        {/* ── Sticky Action Bar ─────────────────────────────────────── */}
        <div className="absolute top-0 left-0 right-0 h-14 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="text-white/80 text-[11px] font-black uppercase tracking-widest">
              Admin Profile
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <Button
                onClick={handleEdit}
                size="sm"
                variant="outline"
                className="h-8 px-4 rounded-lg bg-white text-gray-700 text-[10px] font-bold uppercase tracking-tight"
              >
                <Edit3 className="h-3.5 w-3.5 mr-1.5" /> Edit Profile
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleCancel}
                  size="sm"
                  variant="ghost"
                  className="h-8 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[9px] font-black uppercase tracking-widest"
                >
                  <X className="h-3.5 w-3.5 mr-1.5" /> Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateLoading}
                  size="sm"
                  className="h-8 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-[9px] font-black uppercase tracking-widest"
                >
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  {updateLoading ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Profile Identity ─────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="relative -mt-10 flex items-end gap-5 mb-8">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="h-24 w-24 rounded-2xl bg-gray-900 flex items-center justify-center border-4 border-white text-white text-2xl font-bold">
              {initials}
            </div>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-sm">
              <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
            </div>
          </div>
          {/* Identity text */}
          <div className="pb-2">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              {user.name || authUser?.name || "Admin"}
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge className="bg-gray-100 text-gray-600 border-none text-[9px] font-bold rounded px-3">
                <ShieldCheck className="h-3 w-3 mr-1" />
                {user.role || "ADMIN"}
              </Badge>
              <Badge
                className={`border-none text-[9px] font-bold rounded px-3 ${
                  user.isActive
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {user.isActive ? "Active" : "Inactive"}
              </Badge>
              <span className="text-[10px] text-gray-400 font-semibold">
                {user.email || authUser?.email}
              </span>
            </div>
          </div>
        </div>

        {/* ── Stats Row ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard
            icon={Activity}
            label="Active Sessions"
            value={activeSessions.length}
            color="indigo"
          />
          <StatCard
            icon={History}
            label="Total Sessions"
            value={sessions.length}
            color="amber"
          />
          <StatCard
            icon={BadgeCheck}
            label="Role"
            value={user.role || "ADMIN"}
            color="emerald"
          />
          <StatCard
            icon={Calendar}
            label="Account Status"
            value={user.isActive ? "Active" : "Inactive"}
            color={user.isActive ? "emerald" : "rose"}
          />
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────── */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="bg-gray-100/50 border border-gray-200 rounded-lg p-1 h-auto gap-1">
            {[
              { value: "overview", label: "Overview", icon: User },
              { value: "sessions", label: "Sessions", icon: Monitor },
              { value: "security", label: "Security", icon: Lock },
            ].map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="rounded-lg text-[10px] font-bold uppercase tracking-tight px-5 py-2 data-[state=active]:bg-gray-900 data-[state=active]:text-white flex items-center gap-1.5 transition-all"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                {value === "sessions" && activeSessions.length > 0 && (
                  <span className="ml-1 bg-indigo-500 data-[state=active]:bg-white/30 text-white rounded-full text-[8px] px-1.5 py-0.5 font-black">
                    {activeSessions.length}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── Overview Tab ─────────────────────────────────────── */}
          <TabsContent value="overview" className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Personal Information
                </h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    label: "Full Name",
                    key: "name",
                    icon: User,
                    type: "input",
                  },
                  {
                    label: "Email Address",
                    key: "email",
                    icon: Mail,
                    type: "readonly",
                  },
                  {
                    label: "Phone Number",
                    key: "phone",
                    icon: Phone,
                    type: "input",
                  },
                  {
                    label: "CNIC / ID",
                    key: "cnic",
                    icon: IdCard,
                    type: "input",
                  },
                  { label: "City", key: "city", icon: MapPin, type: "input" },
                  {
                    label: "Role",
                    key: "role",
                    icon: Shield,
                    type: "readonly",
                  },
                ].map(({ label, key, icon: Icon, type }) => (
                  <div key={key} className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                      <Icon className="h-3 w-3" />
                      {label}
                    </Label>
                    {isEditing && type === "input" ? (
                      <Input
                        value={editedData[key] || ""}
                        onChange={(e) =>
                          setEditedData({
                            ...editedData,
                            [key]: e.target.value,
                          })
                        }
                        className="h-9 rounded-lg border-gray-200 text-sm font-medium"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-gray-900 py-1.5">
                        {user[key] || "—"}
                      </p>
                    )}
                  </div>
                ))}

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                    <Home className="h-3 w-3" />
                    Address
                  </Label>
                  {isEditing ? (
                    <Textarea
                      value={editedData.address || ""}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          address: e.target.value,
                        })
                      }
                      className="rounded-xl border-gray-200 text-sm font-semibold resize-none"
                      rows={2}
                    />
                  ) : (
                    <p className="text-sm font-bold text-gray-900 py-1.5">
                      {user.address || "—"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── Sessions Tab ─────────────────────────────────────── */}
          <TabsContent value="sessions" className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-5 flex items-center justify-between">
              <div>
                <h3 className="text-gray-900 font-bold text-sm">
                  Active Sessions
                </h3>
                <p className="text-gray-400 text-xs mt-0.5">
                  Manage your active login sessions across devices
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => refetchSessions()}
                  className="h-8 px-3 rounded-lg text-xs font-medium"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Refresh
                </Button>
                {activeSessions.length > 1 && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleTerminateAll}
                    disabled={terminateAllSessions.isPending}
                    className="h-8 px-3 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-700"
                  >
                    Sign Out Others
                  </Button>
                )}
              </div>
            </div>

            {sessionsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-2xl bg-gray-100" />
                      <div className="space-y-2 flex-1">
                        <div className="h-3.5 bg-gray-100 rounded-full w-1/3" />
                        <div className="h-2.5 bg-gray-100 rounded-full w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center">
                <div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                  <Activity className="h-7 w-7 text-gray-300" />
                </div>
                <p className="text-sm font-black text-gray-900 uppercase">
                  No Sessions
                </p>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">
                  Nothing to show
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Active */}
                {activeSessions.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-1 bg-emerald-500 rounded-full" />
                      <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">
                        Active Sessions
                      </h3>
                      <Badge className="bg-emerald-100 text-emerald-700 border-none text-[8px] font-black rounded-full">
                        {activeSessions.length}
                      </Badge>
                    </div>
                    {activeSessions.map((session) => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        isCurrent={session.isCurrent}
                        onTerminate={handleTerminateSession}
                        isPending={terminateSession.isPending}
                      />
                    ))}
                  </div>
                )}

                {/* Inactive */}
                {inactiveSessions.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-1 bg-gray-300 rounded-full" />
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Past Sessions
                      </h3>
                      <Badge
                        variant="outline"
                        className="text-gray-400 text-[8px] font-black rounded-full"
                      >
                        {inactiveSessions.length}
                      </Badge>
                    </div>
                    {inactiveSessions.slice(0, 8).map((session) => {
                      const DeviceIcon = getDeviceIcon(session.device);
                      return (
                        <div
                          key={session.id}
                          className="bg-white border border-gray-100 rounded-2xl p-4 opacity-60 hover:opacity-100 transition-opacity"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                              <DeviceIcon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-black text-gray-600 uppercase truncate">
                                {getDeviceLabel(session.device)}
                              </p>
                              <div className="flex items-center gap-3 text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                                <span>{session.ipAddress || "Unknown"}</span>
                                <span>·</span>
                                <span>
                                  {session.lastActive
                                    ? formatDistanceToNow(
                                        new Date(session.lastActive),
                                        { addSuffix: true },
                                      )
                                    : "Unknown"}
                                </span>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className="text-[8px] font-black text-gray-400 rounded-full shrink-0"
                            >
                              Expired
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Account Security
                </h2>
              </div>
              <div className="divide-y divide-gray-100">
                <Dialog
                  open={showPasswordDialog}
                  onOpenChange={setShowPasswordDialog}
                >
                  <DialogTrigger asChild>
                    <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center border border-amber-100">
                          <Key className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            Update Password
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Last changed: Never
                          </p>
                        </div>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-300 group-hover:text-gray-400 -rotate-90" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-amber-600" />
                        Change Password
                      </DialogTitle>
                      <DialogDescription>
                        Keep it at least 6 characters long
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div className="relative">
                        <Input
                          type={showCurrentPass ? "text" : "password"}
                          placeholder="Current password"
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              currentPassword: e.target.value,
                            })
                          }
                          className="rounded-xl pr-10"
                        />
                        <button
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                          onClick={() => setShowCurrentPass((v) => !v)}
                        >
                          {showCurrentPass ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <div className="relative">
                        <Input
                          type={showNewPass ? "text" : "password"}
                          placeholder="New password"
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              newPassword: e.target.value,
                            })
                          }
                          className="rounded-xl pr-10"
                        />
                        <button
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                          onClick={() => setShowNewPass((v) => !v)}
                        >
                          {showNewPass ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <Input
                        type="password"
                        placeholder="Confirm new password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="rounded-xl"
                      />
                      {passwordData.newPassword &&
                        passwordData.confirmPassword &&
                        passwordData.newPassword !==
                          passwordData.confirmPassword && (
                          <p className="text-[11px] text-rose-500 flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5" /> Passwords
                            do not match
                          </p>
                        )}
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handlePasswordChange}
                        disabled={changingPass}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                      >
                        {changingPass ? "Updating…" : "Update Password"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Separator className="mx-4" />

                {/* Change Email */}
                <Dialog
                  open={showEmailDialog}
                  onOpenChange={(open) => {
                    setShowEmailDialog(open);
                    if (!open) {
                      setShowOtpInput(false);
                      setOtp("");
                      setNewEmail("");
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                          <MailCheck className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            Change Email
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                             {user.email || authUser?.email || "—"}
                          </p>
                        </div>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-300 group-hover:text-gray-400 -rotate-90" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <MailCheck className="h-4 w-4 text-blue-600" />
                        Change Email
                      </DialogTitle>
                      <DialogDescription>
                        {!showOtpInput
                          ? "Enter your new email address"
                          : `Enter the code sent to ${newEmail}`}
                      </DialogDescription>
                    </DialogHeader>
                    {!showOtpInput ? (
                      <div className="space-y-3">
                        <Input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="New email address"
                          className="rounded-xl"
                        />
                        <Button
                          onClick={handleSendOtp}
                          disabled={emailChangeLoading}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                        >
                          {emailChangeLoading
                            ? "Sending…"
                            : "Send Verification Code"}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Input
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="6-digit verification code"
                          className="rounded-xl text-center text-lg font-bold tracking-widest"
                          maxLength={6}
                        />
                        <Button
                          onClick={handleVerifyOtp}
                          disabled={emailChangeLoading}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                        >
                          {emailChangeLoading
                            ? "Verifying…"
                            : "Verify & Update Email"}
                        </Button>
                        <button
                          className="w-full text-[11px] text-gray-400 hover:text-gray-600 font-semibold"
                          onClick={() => setShowOtpInput(false)}
                        >
                          ← Back
                        </button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>

                <Separator className="mx-4" />

                {/* Sign Out All Devices */}
                <button
                  disabled={terminateAllSessions.isPending}
                  onClick={handleTerminateAll}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-9 w-9 rounded-lg bg-red-50 flex items-center justify-center border border-red-100">
                      <PowerOff className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        Sign Out All Other Devices
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                         Logout from every browser except this one
                      </p>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-300 group-hover:text-gray-400 -rotate-90" />
                </button>
              </div>
            </div>

            {/* Logout */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900">Sign Out</p>
                <p className="text-xs text-gray-400 mt-0.5">
                   End your current session on this device
                </p>
              </div>
              <AlertDialog
                open={showLogoutConfirm}
                onOpenChange={setShowLogoutConfirm}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 px-4 rounded-lg border-gray-200 text-red-600 hover:bg-red-50 hover:border-red-100 text-xs font-medium"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-xl max-w-sm">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                       Logout of your account?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-xs">
                      You will be redirected to the login page.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-lg text-xs">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs"
                    >
                      {loggingOut ? "Signing out…" : "Logout Now"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfilePage;
