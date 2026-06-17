"use client";
import React, { useState, useMemo } from "react";
import { ProfileSkeleton } from "@/components/ui/skeletons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Mail,
  Phone,
  MapPin,
  Shield,
  LogOut,
  FileText,
  Camera,
  UserCircle,
  Building2,
  Home,
  Calendar,
  Contact,
  HeartPulse,
  CreditCard,
  Fingerprint,
  CheckCircle2,
  User,
  History,
  Lock,
  Key,
  MailCheck,
  ShieldCheck,
  Smartphone,
  AlertTriangle,
  Eye,
  EyeOff,
  Trash2,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
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
import useAuthStore from "@/hooks/Authstate";
import { toast } from "sonner";
import Link from "next/link";

const GuestProfile = () => {
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ["guestFullProfile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const res = await fetch(`/api/users/${user.id}/full-profile`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data.data;
    },
    enabled: !!user?.id,
  });

  // ── Security State ──────────────────────────────────────────────────────
  const [activeSecurityTab, setActiveSecurityTab] = useState(false); // false = profile view, true = security view
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "", logoutAll: false });
  const [newEmail, setNewEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [emailChangeLoading, setEmailChangeLoading] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
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

  // ── Security Handlers ────────────────────────────────────────────────────
  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword)
      return toast.error("Passwords do not match");
    if (passwordData.newPassword.length < 6)
      return toast.error("Password must be at least 6 characters");
    setChangingPass(true);
    try {
      const res = await fetch(`/api/auth/changepassword/${user?.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword, logoutAll: passwordData.logoutAll }),
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
    if (!newEmail || !newEmail.includes("@")) return toast.error("Enter a valid email");
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
        body: JSON.stringify({ email: newEmail, otp, userId: user?.id }),
      });
      if (!res.ok) throw new Error("Invalid verification code");
      toast.success("Email updated successfully");
      setShowEmailDialog(false);
      setOtp("");
      setShowOtpInput(false);
      if (user?.id) await queryClient.invalidateQueries({ queryKey: ["guestFullProfile", user.id] });
      if (user) useAuthStore.getState().setUser({ ...user, email: newEmail });
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
      if (method === "TOTP") { setQrCodeUrl(data.qrCodeUrl); setTwoFactorSecret(data.secret); }
      else if (method === "BACKUP_CODES") setBackupCodes(data.codes || []);
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
      toast.success("2FA disabled");
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRegisterPasskey = async () => {
    setPasskeyRegistering(true);
    try {
      const optRes = await fetch("/api/auth/passkey/register-options", { method: "POST", headers: { "Content-Type": "application/json" } });
      const optData = await optRes.json();
      if (!optRes.ok) throw new Error(optData.message || "Failed to start registration");
      const { startRegistration } = await import("@simplewebauthn/browser");
      const credential = await startRegistration({ optionsJSON: optData.options });
      const ua = navigator.userAgent;
      let deviceLabel = "Passkey Device";
      if (/android/i.test(ua)) deviceLabel = "Android Device";
      else if (/iPad|iPhone|iPod/.test(ua)) deviceLabel = "iOS Device";
      else if (/macintosh/i.test(ua)) deviceLabel = "Mac Device";
      else if (/windows/i.test(ua)) deviceLabel = "Windows Device";
      deviceLabel = prompt("Label for this passkey:", deviceLabel) || deviceLabel;
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

  if (isLoading) return <ProfileSkeleton />;

  const userData = profile?.basic || user || {};
  const resident = profile?.resident || {};
  const hostel = profile?.hostel || {};
  const residency = profile?.residency || {};
  const history = profile?.history || [];
  const additionalImages = userData?.additionalImages || [];

  // Logic: Only show "Checked Out" styling if they have NO active stay but DO have history
  const isCheckedOut = !residency.roomNumber && history.length > 0;

  const downloadSmartCard = async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 600;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 600);
    grad.addColorStop(0, "#0f172a"); // slate-900
    grad.addColorStop(0.5, "#1e1b4b"); // indigo-950
    grad.addColorStop(1, "#020617"); // slate-950
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 400, 600);

    // Draw decor circles/effects
    ctx.fillStyle = "rgba(99, 102, 241, 0.08)"; // indigo-500 with opacity
    ctx.beginPath();
    ctx.arc(0, 0, 200, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(400, 600, 150, 0, Math.PI * 2);
    ctx.fill();

    // Draw card border/header bar
    ctx.fillStyle = "#6366f1"; // indigo-500
    ctx.fillRect(0, 0, 400, 12);

    // Draw Title / Hostel Name
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(hostel.name || "HOSTEL PORTAL", 200, 50);

    ctx.fillStyle = "#a5b4fc"; // indigo-300
    ctx.font = "bold 10px sans-serif";
    ctx.fillText("DIGITAL RESIDENT SMART CARD", 200, 75);

    // Draw Avatar (load image, fallback to initials if CORS/error)
    const avatarSize = 120;
    const avatarX = 140;
    const avatarY = 110;

    try {
      if (userData.image) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise((resolve, reject) => {
          img.onload = () => {
            ctx.save();
            ctx.beginPath();
            ctx.arc(
              avatarX + avatarSize / 2,
              avatarY + avatarSize / 2,
              avatarSize / 2,
              0,
              Math.PI * 2,
            );
            ctx.clip();
            ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize);
            ctx.restore();
            resolve();
          };
          img.onerror = () => {
            reject();
          };
          img.src = userData.image;
        });
      } else {
        throw new Error("No image");
      }
    } catch (e) {
      // Draw Fallback Initials Circle
      ctx.fillStyle = "#1e1b4b"; // indigo-950
      ctx.beginPath();
      ctx.arc(
        avatarX + avatarSize / 2,
        avatarY + avatarSize / 2,
        avatarSize / 2,
        0,
        Math.PI * 2,
      );
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 44px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        userData.name?.charAt(0) || "U",
        avatarX + avatarSize / 2,
        avatarY + avatarSize / 2,
      );
      ctx.textBaseline = "alphabetic"; // reset
    }

    // Draw Border around Avatar
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(
      avatarX + avatarSize / 2,
      avatarY + avatarSize / 2,
      avatarSize / 2 + 2,
      0,
      Math.PI * 2,
    );
    ctx.stroke();

    // Draw Resident Info
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(userData.name || "Resident Name", 200, 275);

    ctx.fillStyle = "#94a3b8"; // slate-400
    ctx.font = "12px sans-serif";
    ctx.fillText(`Reg #: ${userData.regNumber || "N/A"}`, 200, 300);

    // Draw Details Table (Room, CNIC, Phone)
    const drawDetail = (label, value, y) => {
      ctx.fillStyle = "#a5b4fc";
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(label.toUpperCase(), 50, y);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(value || "N/A", 350, y);

      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(50, y + 8);
      ctx.lineTo(350, y + 8);
      ctx.stroke();
    };

    drawDetail(
      "Room Assignment",
      residency.roomNumber
        ? `Room ${residency.roomNumber} (Floor ${residency.floor || 0})`
        : "Unassigned",
      340,
    );
    drawDetail("CNIC Number", userData.cnic, 375);
    drawDetail("Phone Number", userData.phone, 410);

    // Draw QR Code
    const qrSize = 100;
    const qrX = 150;
    const qrY = 445;

    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(userData.uid || userData.email || "guest")}`;
      const qrImg = new Image();
      qrImg.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
        qrImg.onload = () => {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);
          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
          resolve();
        };
        qrImg.onerror = () => {
          reject();
        };
        qrImg.src = qrUrl;
      });
    } catch (e) {
      // Draw Fallback QR block
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(qrX, qrY, qrSize, qrSize);
      ctx.fillStyle = "#ffffff";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("QR Code Error", 200, qrY + qrSize / 2);
    }

    // Trigger download
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `${userData.name?.replace(/\s+/g, "_")}_ID_Pass.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background pb-20 font-sans tracking-tight">
      {/* Header */}
      <div className="bg-white dark:bg-card border-b sticky top-0 z-40 h-16">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`h-8 w-8 ${isCheckedOut ? "bg-rose-600" : "bg-black"} rounded-lg flex items-center justify-center text-white`}
            >
              <User className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 dark:text-foreground tracking-tight uppercase">
                My Profile
              </h1>
              <p
                className={`text-[9px] font-bold uppercase tracking-widest ${isCheckedOut ? "text-rose-500" : "text-gray-400 dark:text-muted-foreground"}`}
              >
                {isCheckedOut
                  ? "Archived Resident Account"
                  : "Your Account Details"}
              </p>
            </div>
          </div>
          <Button
            onClick={logout}
            variant="ghost"
            className="h-8 px-4 rounded-lg hover:bg-rose-50 text-rose-600 font-bold text-[10px] uppercase tracking-widest"
          >
            <LogOut className="h-3.5 w-3.5 mr-2" /> Logout
          </Button>
          <Button
            onClick={() => setActiveSecurityTab(!activeSecurityTab)}
            variant="ghost"
            size="sm"
            className={`h-8 px-4 rounded-lg font-bold text-[10px] uppercase tracking-widest ${
              activeSecurityTab
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "hover:bg-indigo-50 text-indigo-600"
            }`}
          >
            <Lock className="h-3.5 w-3.5 mr-2" />
            {activeSecurityTab ? "← Profile" : "Security"}
          </Button>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Main Profile Card */}
        <div className="bg-white dark:bg-card rounded-[2rem] p-1 shadow-sm border border-gray-100 dark:border-border">
          <div
            className={`${isCheckedOut ? "bg-slate-900" : "bg-gray-900"} rounded-[1.8rem] p-8 text-white relative overflow-hidden`}
          >
            {/* <div className="absolute top-0 right-0 w-96 h-96 bg-white dark:bg-card/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" /> */}

            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
              <div className="relative group/avatar">
                <Avatar className="h-32 w-32 border-4 border-white/20 shadow-2xl">
                  <AvatarImage
                    src={userData.image || "/avatar-placeholder.png"}
                  />
                  <AvatarFallback className="text-4xl font-bold text-gray-900 dark:text-foreground bg-white dark:bg-card">
                    {userData.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`absolute bottom-0 right-0 h-8 w-8 ${isCheckedOut ? "bg-rose-500" : "bg-emerald-500"} rounded-full border-4 border-gray-900 flex items-center justify-center`}
                >
                  {isCheckedOut ? (
                    <LogOut className="h-4 w-4 text-white" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  )}
                </div>
              </div>

              <div className="flex-1 text-center md:text-left space-y-4">
                <div>
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                    <h2 className="text-3xl font-bold tracking-tight">
                      {userData.name}
                    </h2>
                    <Badge
                      className={`${isCheckedOut ? "bg-rose-500/20 text-rose-300" : "bg-white/10 text-white"} hover:bg-white/20 border-0 text-[9px] uppercase font-bold tracking-widest backdrop-blur-md`}
                    >
                      {isCheckedOut
                        ? "Past Resident"
                        : userData.role || "Resident"}
                    </Badge>
                    {userData.regNumber && (
                      <Badge className="bg-indigo-500/20 text-indigo-300 border-0 text-[10px] uppercase font-black tracking-widest backdrop-blur-md">
                        Reg # {userData.regNumber}
                      </Badge>
                    )}
                    {userData.uid && (
                      <Badge className="bg-white/10 hover:bg-white/20 text-white border-0 text-[9px] uppercase font-bold tracking-widest backdrop-blur-md font-mono">
                        ID: {userData.uid}
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-400 dark:text-muted-foreground font-medium">
                    {userData.email}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
                  <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-2 flex items-center gap-3 border border-white/10">
                    <Phone className="h-4 w-4 text-white/70" />
                    <div>
                      <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">
                        Phone
                      </p>
                      <p className="text-xs font-bold">
                        {userData.phone || "Not Added"}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-2 flex items-center gap-3 border border-white/10">
                    <CreditCard className="h-4 w-4 text-white/70" />
                    <div>
                      <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">
                        CNIC No.
                      </p>
                      <p className="text-xs font-bold">
                        {userData.cnic || "Not Added"}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-2 flex items-center gap-3 border border-white/10">
                    <Calendar className="h-4 w-4 text-white/70" />
                    <div>
                      <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">
                        Joined On
                      </p>
                      <p className="text-xs font-bold">
                        {userData.joinedAt
                          ? new Date(userData.joinedAt).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Stay Details, Guardian Info, Home Address */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stay Details */}
            <Card className="rounded-[2rem] border-gray-100 dark:border-border shadow-sm overflow-hidden group">
              <CardHeader className="bg-gray-50 dark:bg-background border-b border-gray-50 py-4 px-6">
                <h3 className="text-xs font-bold text-gray-900 dark:text-foreground uppercase tracking-widest flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-500 dark:text-muted-foreground" />{" "}
                  {isCheckedOut ? "Past Residency" : "My Stay Details"}
                </h3>
              </CardHeader>
              <CardContent className="p-6">
                {residency.roomNumber ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div
                        className={`h-14 w-14 rounded-2xl ${isCheckedOut ? "bg-rose-600" : "bg-black"} flex items-center justify-center text-white shadow-lg shrink-0`}
                      >
                        <Home className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">
                          {isCheckedOut ? "Checked Out From" : "Current Room"}
                        </p>
                        <h4 className="text-xl font-bold text-gray-900 dark:text-foreground tracking-tight">
                          Room {residency.roomNumber}
                        </h4>
                        <p
                          className={`text-xs font-bold uppercase tracking-wide ${isCheckedOut ? "text-rose-500" : "text-emerald-600"}`}
                        >
                          {isCheckedOut
                            ? "Residency Inactive"
                            : `Floor ${residency.floor} • ${residency.roomType}`}
                        </p>
                      </div>
                    </div>

                    <Separator className="bg-gray-100" />

                    <div>
                      <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest mb-3">
                        Hostel Name
                      </p>
                      <div className="bg-gray-50 dark:bg-muted/10 rounded-xl p-4 border border-gray-100 dark:border-border">
                        <h5 className="font-bold text-gray-900 dark:text-foreground">
                          {hostel.name || "Our Hostel"}
                        </h5>
                        <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
                          {hostel.address || "Address not available"}
                        </p>
                        {hostel.phone && (
                          <p className="text-xs text-gray-400 dark:text-muted-foreground mt-2 font-mono">
                            {hostel.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className="h-12 w-12 bg-gray-50 dark:bg-muted/10 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400 dark:text-muted-foreground">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">
                      No active stay found
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Guardian Info */}
            <Card className="rounded-[2rem] border-gray-100 dark:border-border shadow-sm overflow-hidden">
              <CardHeader className="bg-gray-50 dark:bg-background border-b border-gray-50 py-4 px-6">
                <h3 className="text-xs font-bold text-gray-900 dark:text-foreground uppercase tracking-widest flex items-center gap-2">
                  <Contact className="h-4 w-4 text-gray-500 dark:text-muted-foreground" />{" "}
                  Guardian Info
                </h3>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-wider">
                      Guardian Name
                    </Label>
                    <p className="font-bold text-sm text-gray-900 dark:text-foreground">
                      {resident.guardianName || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-wider">
                      Phone Number
                    </Label>
                    <p className="font-bold text-sm text-gray-900 dark:text-foreground">
                      {resident.guardianPhone || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="bg-rose-50 rounded-xl p-4 border border-rose-100 flex items-start gap-3">
                  <HeartPulse className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest">
                      Emergency Contact
                    </p>
                    <p className="font-bold text-sm text-rose-900">
                      {resident.emergencyContact || "Not Added"}
                    </p>
                    <p className="text-[10px] text-rose-400 mt-1">
                      This person will be called in case of emergency.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Home Address */}
            <Card className="rounded-[2rem] border-gray-100 dark:border-border shadow-sm overflow-hidden">
              <CardHeader className="bg-gray-50 dark:bg-background border-b border-gray-50 py-4 px-6">
                <h3 className="text-xs font-bold text-gray-900 dark:text-foreground uppercase tracking-widest flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500 dark:text-muted-foreground" />{" "}
                  Home Address
                </h3>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground leading-relaxed">
                  {resident.address ||
                    userData.address ||
                    "Your home address will appear here."}
                </p>
                <div className="mt-4 flex gap-2">
                  <Badge
                    variant="outline"
                    className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-wider border-gray-200 dark:border-border"
                  >
                    {resident.city || userData.city || "Not Specified"}
                  </Badge>
                </div>
                {resident.currentResidence && (
                  <p className="mt-3 text-xs font-bold text-gray-600 dark:text-muted-foreground">
                    Current Residence: {resident.currentResidence}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Digital Smart Card */}
          <div className="lg:col-span-1">
            <Card className="rounded-[2rem] border-gray-100 dark:border-border shadow-sm overflow-hidden sticky top-24">
              <CardHeader className="bg-gray-50 dark:bg-background border-b border-gray-50 py-4 px-6 flex flex-row items-center justify-between">
                <h3 className="text-xs font-bold text-gray-900 dark:text-foreground uppercase tracking-widest flex items-center gap-2">
                  <Fingerprint className="h-4 w-4 text-indigo-500" /> Digital ID
                  Card
                </h3>
                <Badge
                  className={`${isCheckedOut ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-600"} border-none text-[8px] font-bold uppercase tracking-wider px-2 py-0`}
                >
                  {isCheckedOut ? "Inactive" : "Active Pass"}
                </Badge>
              </CardHeader>
              <CardContent className="p-6 flex flex-col items-center">
                {/* Visual Card */}
                <div
                  id="smart-id-card"
                  className="w-[280px] h-[420px] rounded-[1.8rem] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-5 relative overflow-hidden shadow-2xl border border-white/10 flex flex-col justify-between select-none"
                >
                  <div className="absolute -top-12 -left-12 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                  {/* Header */}
                  <div className="text-center relative z-10 border-b border-white/10 pb-2.5">
                    <p className="text-[10px] font-black tracking-widest text-indigo-400 uppercase truncate">
                      {hostel.name || "HOSTEL PORTAL"}
                    </p>
                    <p className="text-[7px] font-bold text-slate-400 tracking-[0.2em] uppercase mt-0.5">
                      Resident Smart ID Pass
                    </p>
                  </div>

                  {/* Avatar and Primary Details */}
                  <div className="flex flex-col items-center my-3 relative z-10">
                    <div className="relative">
                      <Avatar className="h-20 w-20 border-2 border-indigo-500/40 shadow-xl">
                        <AvatarImage
                          src={userData.image || "/avatar-placeholder.png"}
                        />
                        <AvatarFallback className="text-2xl font-bold text-slate-900 bg-white">
                          {userData.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-slate-900 flex items-center justify-center ${isCheckedOut ? "bg-rose-500" : "bg-emerald-500"}`}
                      >
                        {isCheckedOut ? (
                          <LogOut className="h-3 w-3 text-white" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3 text-white" />
                        )}
                      </div>
                    </div>
                    <h4 className="text-sm font-bold tracking-tight mt-2 text-center truncate w-full">
                      {userData.name}
                    </h4>
                    <p className="text-[8px] text-indigo-300 font-mono tracking-wider mt-0.5">
                      Reg: {userData.regNumber || "N/A"}
                    </p>
                  </div>

                  {/* Key Fields Grid */}
                  <div className="space-y-1.5 text-[10px] border-t border-white/5 pt-2.5 relative z-10">
                    <div className="flex justify-between items-center">
                      <span className="text-[7px] text-slate-400 uppercase tracking-wider">
                        Room Assignment
                      </span>
                      <span className="font-bold text-indigo-300">
                        {residency.roomNumber
                          ? `Room ${residency.roomNumber} (Fl. ${residency.floor})`
                          : "Unassigned"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[7px] text-slate-400 uppercase tracking-wider">
                        CNIC Number
                      </span>
                      <span className="font-mono font-medium text-slate-200">
                        {userData.cnic || "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Footer and QR Code */}
                  <div className="flex items-center justify-between border-t border-white/10 pt-2.5 mt-auto relative z-10">
                    <div className="text-left">
                      <p className="text-[6px] text-slate-400 uppercase tracking-widest">
                        Issued On
                      </p>
                      <p className="text-[8px] font-bold text-slate-200">
                        {userData.joinedAt
                          ? new Date(userData.joinedAt).toLocaleDateString()
                          : "N/A"}
                      </p>
                      <p className="text-[6px] text-slate-500 uppercase tracking-widest mt-1">
                        UID
                      </p>
                      <p className="text-[7px] font-mono text-slate-400">
                        {userData.uid?.slice(0, 12) || "N/A"}
                      </p>
                    </div>
                    <div className="bg-white p-1 rounded-lg shadow-md shrink-0">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(userData.uid || userData.email || "guest")}`}
                        alt="QR Pass"
                        className="h-12 w-12"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={downloadSmartCard}
                  className="w-full max-w-[280px] mt-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider py-2 flex items-center justify-center gap-2"
                >
                  <CreditCard className="h-4 w-4" /> Download ID Pass (PNG)
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Residency History Log */}
        {profile?.history?.length > 0 && (
          <Card className="rounded-[2rem] border-gray-100 dark:border-border shadow-sm overflow-hidden group">
            <CardHeader className="bg-gray-50 dark:bg-background border-b border-gray-50 py-4 px-6 flex flex-row items-center justify-between">
              <h3 className="text-xs font-bold text-gray-900 dark:text-foreground uppercase tracking-widest flex items-center gap-2">
                <History className="h-4 w-4 text-gray-500 dark:text-muted-foreground" />{" "}
                Residency Timeline
              </h3>
              <Badge
                variant="outline"
                className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest bg-white dark:bg-card border-gray-200 dark:border-border px-3"
              >
                {profile.history.length} Record
                {profile.history.length > 1 ? "s" : ""}
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-50 dark:divide-border/20">
                {profile.history.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-muted/5 dark:bg-muted/10/30 transition-all cursor-default group/item"
                  >
                    <div className="flex items-center gap-5">
                      <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover/item:bg-slate-900 group-hover/item:text-white transition-all">
                        <Home className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-bold text-gray-900 dark:text-foreground">
                            Room {item.roomNumber || "N/A"}
                          </p>
                          <Badge className="bg-rose-50 text-rose-500 border-none text-[8px] font-bold uppercase tracking-wider px-2 py-0">
                            Completed
                          </Badge>
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest mt-0.5">
                          {item.hostelName || "Unknown Hostel"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-bold text-gray-900 dark:text-foreground uppercase tracking-widest leading-none">
                            {item.checkIn
                              ? new Date(item.checkIn).toLocaleDateString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )
                              : "N/A"}
                          </span>
                          <span className="text-[8px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-[0.15em] mt-1">
                            Arrival
                          </span>
                        </div>
                        <div className="h-4 w-[1px] bg-gray-200 mx-1" />
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-bold text-gray-900 dark:text-foreground uppercase tracking-widest leading-none">
                            {item.checkOut
                              ? new Date(item.checkOut).toLocaleDateString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )
                              : "N/A"}
                          </span>
                          <span className="text-[8px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-[0.15em] mt-1">
                            Departed
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {additionalImages.length > 0 && (
          <Card className="rounded-[2rem] border-gray-100 dark:border-border shadow-sm overflow-hidden">
            <CardHeader className="bg-gray-50 dark:bg-background border-b border-gray-50 py-4 px-6">
              <h3 className="text-xs font-bold text-gray-900 dark:text-foreground uppercase tracking-widest">
                Additional Documents
              </h3>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {additionalImages.map((src, idx) => (
                  <a
                    key={`${src}-${idx}`}
                    href={src}
                    target="_blank"
                    rel="noreferrer"
                    className="block border border-gray-100 dark:border-border rounded-xl overflow-hidden bg-white dark:bg-card"
                  >
                    <img
                      src={src}
                      alt={`additional-${idx}`}
                      className="h-28 w-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Account Security Panel ── */}
        {!activeSecurityTab ? (
          <Card className="rounded-[2rem] border-gray-100 dark:border-border shadow-sm overflow-hidden bg-gray-900 text-white">
            <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                  <Shield className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-tight">Account Safety</h3>
                  <p className="text-xs text-gray-400 dark:text-muted-foreground mt-1">Your data is secured and only visible to you and the admin.</p>
                </div>
              </div>
              <Button
                onClick={() => setActiveSecurityTab(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 px-6 font-bold text-xs uppercase tracking-wider"
              >
                <Lock className="h-4 w-4 mr-2" /> Manage Security
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-300">

            {/* Security Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-6 w-6 text-indigo-300" />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-widest">Account Security</p>
                <p className="text-xs text-white/60 mt-0.5">Manage your login credentials, two-factor authentication, and registered passkeys.</p>
              </div>
              {user?.twoFactorEnabled && (
                <Badge className="ml-auto bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider px-3">
                  2FA Active
                </Badge>
              )}
            </div>

            {/* Main Security Card */}
            <Card className="border border-slate-100 dark:border-border rounded-2xl shadow-sm bg-white dark:bg-card overflow-hidden">
              <CardHeader className="p-6 pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-foreground flex items-center gap-2">
                  <Lock className="h-4.5 w-4.5 text-indigo-600" /> Security Settings
                </CardTitle>
                <CardDescription className="text-xs">Manage your password, email, and two-factor authentication.</CardDescription>
              </CardHeader>
              <div className="divide-y divide-slate-100 dark:divide-border">

                {/* Password */}
                <div className="p-6 flex items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                      <Key className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-foreground">Update Password</p>
                      <p className="text-xs text-slate-450 dark:text-muted-foreground mt-0.5">Regularly change your password to keep your account safe.</p>
                    </div>
                  </div>
                  <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="h-9 rounded-xl text-xs font-bold uppercase tracking-wider bg-white dark:bg-card shrink-0">Change Password</Button>
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
                          <Input type={showCurrentPass ? "text" : "password"} placeholder="Current Password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} className="rounded-xl h-11 pr-10" />
                          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-450" onClick={() => setShowCurrentPass(!showCurrentPass)}>
                            {showCurrentPass ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                          </button>
                        </div>
                        <div className="space-y-2">
                          <div className="relative">
                            <Input type={showNewPass ? "text" : "password"} placeholder="New Password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} className="rounded-xl h-11 pr-10" />
                            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-455" onClick={() => setShowNewPass(!showNewPass)}>
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
                        <Input type="password" placeholder="Confirm Password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} className="rounded-xl h-11" />
                        {passwordData.newPassword && passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                          <p className="text-[11px] text-rose-500 font-bold flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5" /> Passwords do not match
                          </p>
                        )}
                        <label className="flex items-center gap-2.5 cursor-pointer mt-1">
                          <input type="checkbox" checked={passwordData.logoutAll} onChange={(e) => setPasswordData({ ...passwordData, logoutAll: e.target.checked })} className="rounded border-slate-300" />
                          <span className="text-xs text-slate-450 font-bold select-none">Log out other devices</span>
                        </label>
                      </div>
                      <DialogFooter>
                        <Button onClick={handlePasswordChange} disabled={changingPass || (passwordData.newPassword !== passwordData.confirmPassword)} className="w-full bg-slate-950 hover:bg-slate-900 text-white rounded-xl h-11 font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95">
                          {changingPass ? "Updating..." : "Update Password"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Email */}
                <div className="p-6 flex items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <MailCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-foreground">Email Address</p>
                      <p className="text-xs text-slate-450 dark:text-muted-foreground mt-0.5">Current: {user?.email}</p>
                    </div>
                  </div>
                  <Dialog open={showEmailDialog} onOpenChange={(open) => { setShowEmailDialog(open); if (!open) { setShowOtpInput(false); setOtp(""); setNewEmail(""); } }}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="h-9 rounded-xl text-xs font-bold uppercase tracking-wider bg-white dark:bg-card shrink-0">Change Email</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md rounded-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 font-bold uppercase tracking-wider">
                          <MailCheck className="h-4.5 w-4.5 text-blue-600" /> Change Email
                        </DialogTitle>
                        <DialogDescription>{!showOtpInput ? "Enter your new email address below." : `Enter the code sent to ${newEmail}.`}</DialogDescription>
                      </DialogHeader>
                      <div className="py-2">
                        {!showOtpInput ? (
                          <div className="space-y-4">
                            <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="New Email Address" className="rounded-xl h-11 text-center font-bold" />
                            <Button onClick={handleSendOtp} disabled={emailChangeLoading} className="w-full bg-slate-950 hover:bg-slate-900 text-white rounded-xl h-11 font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95">{emailChangeLoading ? "Sending..." : "Send Code"}</Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="000000" className="rounded-xl text-center text-xl font-black tracking-[0.4em] h-12" maxLength={6} />
                            <Button onClick={handleVerifyOtp} disabled={emailChangeLoading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11 font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95">{emailChangeLoading ? "Verifying..." : "Verify & Apply"}</Button>
                            <button type="button" className="w-full text-center text-[9px] text-slate-400 font-black uppercase tracking-wider hover:text-slate-650" onClick={() => setShowOtpInput(false)}>← Back</button>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* 2FA */}
                <div className="p-6 space-y-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                        <Shield className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-foreground">Two-Factor Authentication</p>
                        <p className="text-xs text-slate-450 dark:text-muted-foreground mt-0.5 font-bold uppercase tracking-tight">
                          {user?.twoFactorEnabled ? `Active: ${user.twoFactorMethod === "TOTP" ? "Authenticator App" : user.twoFactorMethod === "EMAIL" ? "Email OTP" : "Backup Codes"}` : "Add an extra layer of security to your account."}
                        </p>
                      </div>
                    </div>
                    {user?.twoFactorEnabled && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl text-xs font-bold border-rose-200 text-rose-600 hover:bg-rose-50/50 uppercase tracking-wider">Disable 2FA</Button>
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                    {[
                      { method: "TOTP", title: "Authenticator App", desc: "Google Authenticator or Authy", icon: Smartphone, activeColor: "border-indigo-200 bg-indigo-50/10", iconBg: "bg-indigo-100 text-indigo-700" },
                      { method: "EMAIL", title: "Email Code", desc: "Verification codes via email", icon: MailCheck, activeColor: "border-blue-200 bg-blue-50/10", iconBg: "bg-blue-100 text-blue-700" },
                      { method: "BACKUP_CODES", title: "Backup Codes", desc: "One-time recovery codes", icon: Key, activeColor: "border-amber-200 bg-amber-50/10", iconBg: "bg-amber-100 text-amber-700" },
                    ].map((m) => {
                      const isActive = user?.twoFactorMethod === m.method;
                      return (
                        <div key={m.method} className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${isActive ? m.activeColor : "border-slate-100 hover:border-slate-200"}`}>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${m.iconBg}`}><m.icon className="h-4 w-4" /></div>
                              {isActive && <Badge className="bg-slate-900 text-white text-[8px] font-black uppercase tracking-wider rounded">Active</Badge>}
                            </div>
                            <h5 className="text-xs font-bold text-slate-800 dark:text-foreground">{m.title}</h5>
                            <p className="text-[10px] text-slate-450 mt-0.5 leading-relaxed">{m.desc}</p>
                          </div>
                          <div className="mt-3">
                            {!isActive && (
                              <Button onClick={() => handleEnable2FAInit(m.method)} size="sm" variant="outline" className="w-full h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white shadow-sm">
                                {user?.twoFactorEnabled ? "Switch" : "Enable"}
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

            {/* Passkeys Card */}
            <Card className="border border-slate-100 dark:border-border rounded-2xl shadow-sm bg-white dark:bg-card overflow-hidden">
              <CardHeader className="p-6 pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-foreground flex items-center gap-2">
                  <Fingerprint className="h-4.5 w-4.5 text-indigo-600" /> Passkeys (Login Keys)
                </CardTitle>
                <CardDescription className="text-xs">Register your device fingerprint or face unlock to sign in without a password.</CardDescription>
              </CardHeader>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <p className="text-xs text-slate-450">Passkeys use cryptographic authentication — more secure than passwords.</p>
                  <Button onClick={handleRegisterPasskey} disabled={passkeyRegistering} className="h-9 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white shrink-0">
                    {passkeyRegistering ? (<><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Registering...</>) : "Add Passkey"}
                  </Button>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-foreground mb-3">Registered Keys</h4>
                  {user?.passkeys && user.passkeys.length > 0 ? (
                    <div className="space-y-3">
                      {user.passkeys.map((pk) => (
                        <div key={pk.id} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:bg-slate-50/50 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                              <Fingerprint className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{pk.deviceName}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">Added {new Date(pk.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                            </div>
                          </div>
                          <Button onClick={() => handleDeletePasskey(pk.id)} disabled={passkeyDeleting === pk.id} variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 shrink-0">
                            {passkeyDeleting === pk.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-4.5 w-4.5" />}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl">
                      <Fingerprint className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-medium text-slate-450">No passkeys registered yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* 2FA SETUP MODAL */}
      <Dialog open={show2FADialog} onOpenChange={(open) => { setShow2FADialog(open); if (!open) { setTwoFactorOtp(""); setBackupCodes([]); setBackupCodesSaved(false); } }}>
        <DialogContent className="max-w-md rounded-xl bg-white dark:bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold uppercase tracking-wider text-sm">
              <Shield className="h-4.5 w-4.5 text-indigo-600" />
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
              {qrCodeUrl && (<div className="p-2.5 bg-white border border-slate-100 rounded-xl shadow-sm"><img src={qrCodeUrl} alt="2FA Setup Code" className="w-40 h-40" /></div>)}
              <div className="w-full text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Secret Key</p>
                <p className="text-xs font-mono font-bold bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg mt-1 select-all break-all">{twoFactorSecret}</p>
              </div>
              <div className="w-full space-y-2">
                <Label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest ml-1">Enter Code</Label>
                <Input value={twoFactorOtp} onChange={(e) => setTwoFactorOtp(e.target.value)} placeholder="000000" className="rounded-lg text-center text-base font-bold tracking-[0.2em] h-11" maxLength={6} />
                <Button onClick={handleVerify2FA} disabled={verifying2FA} className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg h-10 text-xs font-bold uppercase tracking-wider">{verifying2FA ? "Verifying..." : "Verify & Enable"}</Button>
              </div>
            </div>
          )}
          {active2FAMethod === "EMAIL" && (
            <div className="space-y-3 py-2">
              <div className="bg-blue-50/50 border border-blue-100/50 rounded-xl p-4 text-center">
                <MailCheck className="h-7 w-7 text-blue-500 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-slate-800">Code sent to your email</p>
                <p className="text-[10px] text-slate-450 font-bold uppercase mt-0.5">Enter the 6-digit code sent to your inbox.</p>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest ml-1">Enter Code</Label>
                <Input value={twoFactorOtp} onChange={(e) => setTwoFactorOtp(e.target.value)} placeholder="000000" className="rounded-lg text-center text-base font-bold tracking-[0.2em] h-11" maxLength={6} />
                <Button onClick={handleVerify2FA} disabled={verifying2FA} className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg h-10 text-xs font-bold uppercase tracking-wider">{verifying2FA ? "Checking..." : "Verify & Enable"}</Button>
              </div>
            </div>
          )}
          {active2FAMethod === "BACKUP_CODES" && (
            <div className="space-y-4 py-2">
              <div className="bg-amber-50/50 border border-amber-100/50 rounded-xl p-3.5">
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, i) => (
                    <div key={i} className="bg-white border border-amber-200/50 rounded-lg px-2.5 py-1.5 text-center font-mono text-xs font-bold text-slate-800 select-all shadow-sm">{code}</div>
                  ))}
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-100/50 rounded-xl">
                <AlertTriangle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-700 font-bold leading-relaxed">Save these codes. You will not be able to see them again.</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={backupCodesSaved} onChange={(e) => setBackupCodesSaved(e.target.checked)} className="rounded border-slate-355" />
                <span className="text-xs text-slate-700 font-semibold select-none">I have saved these backup codes.</span>
              </label>
              <Button onClick={handleVerify2FA} disabled={verifying2FA || !backupCodesSaved} className="w-full bg-slate-950 hover:bg-slate-800 text-white rounded-lg h-10 text-xs font-bold uppercase tracking-wider">{verifying2FA ? "Activating..." : "Confirm & Enable"}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GuestProfile;
