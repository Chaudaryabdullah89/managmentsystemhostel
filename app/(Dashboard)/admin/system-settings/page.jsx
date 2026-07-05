"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { checkAuth } from "@/hooks/Authstate";
import {
  Loader2,
  Settings,
  KeyRound,
  Wrench,
  ShieldAlert,
  Mail,
  CheckCircle2,
  XCircle,
  Building2,
  Brain,
  Sparkles,
  Sliders,
  Cpu,
  Thermometer,
  FileText,
  Send,
  RefreshCw,
  RotateCcw,
  Zap,
  Globe,
  Shield,
  Activity,
  ChevronRight,
  Upload,
  ImageIcon,
} from "lucide-react";

// ─── Reusable toggle row ───────────────────────────────────────────────────
function ToggleRow({
  label,
  desc,
  value,
  onChange,
  danger = false,
  disabled = false,
}) {
  return (
    <div
      className={`flex items-center justify-between py-4 border-b border-gray-50 dark:border-border/30 last:border-0 ${disabled ? "opacity-50 pointer-events-none" : ""}`}
    >
      <div className="max-w-[75%]">
        <p
          className={`text-sm font-semibold ${danger ? "text-rose-700" : "text-gray-900 dark:text-foreground"}`}
        >
          {label}
        </p>
        {desc && (
          <p className="text-xs text-gray-400 dark:text-muted-foreground mt-0.5">
            {desc}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none shrink-0 ${
          value ? (danger ? "bg-rose-500" : "bg-indigo-600") : "bg-gray-200 dark:bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white dark:bg-card rounded-full shadow transition-transform duration-200 ${
            value ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

// ─── Section Card ──────────────────────────────────────────────────────────
function SectionCard({
  title,
  subtitle,
  icon: Icon,
  iconColor = "text-gray-500 dark:text-muted-foreground",
  iconBg = "bg-gray-50 dark:bg-muted/10",
  children,
}) {
  return (
    <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="px-6 py-5 border-b border-gray-50 dark:border-border/30 flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center ${iconColor}`}
        >
          <Icon className="w-4.5 h-4.5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-foreground">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-gray-400 dark:text-muted-foreground mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="px-6 py-2">{children}</div>
    </div>
  );
}

// ─── Save Button ───────────────────────────────────────────────────────────
function SaveButton({ onClick, isSaving, label = "Save Changes" }) {
  return (
    <button
      onClick={onClick}
      disabled={isSaving}
      className="h-11 px-8 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 active:scale-[0.97] transition-all flex items-center gap-2 disabled:opacity-60 shadow-sm shadow-indigo-600/20"
    >
      {isSaving ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" /> Saving...
        </>
      ) : (
        <>
          <CheckCircle2 className="w-4 h-4" /> {label}
        </>
      )}
    </button>
  );
}

// ─── Default full settings object ────────────────────────────────────────
const DEFAULT_SETTINGS = {
  maintenanceMode: false,
  maintenanceMessage: "",
  maintenanceWardenToken: "",
  maintenanceGuestToken: "",
  enableLaundry: true,
  enableMess: true,
  enableGuestBookings: true,
  enableComplaintsSystem: true,
  enableMaintenanceRequests: true,
  enableRefundRequests: true,
  enableNoticeBoard: true,
  enableAiAssistant: true,
  enablePaymentProcessing: true,
  enableEmailService: true,
  enablePasswordResetEmails: true,
  enableBookingEmails: true,
  enablePaymentEmails: true,
  enableComplaintEmails: true,
  enableNoticeEmails: true,
  enableWelcomeEmails: true,
  autoGenerateRentInvoices: true,
  autoGenerateStaffSalaries: true,
  companyName: "Hostel Management System",
  companyShortName: "HMS",
  companyFavicon: "/favicon.ico",
  oneBillPrefix: "100123",
  aiModel: "llama-3.3-70b-versatile",
  aiTemperature: 0.5,
  aiSystemPrompt: "",
};

const AI_MODELS = [
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B Versatile",
    provider: "Groq",
    desc: "High-precision, executive-quality responses. Best for complex queries.",
    badge: "Recommended",
    badgeColor: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  },
  {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B Instant",
    provider: "Groq",
    desc: "Ultra-fast responses. Ideal for quick queries and high traffic.",
    badge: "Fast",
    badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    desc: "Google's latest multimodal model with strong reasoning.",
    badge: "Fallback",
    badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
];

const PERMISSION_KEYS = [
  {
    group: "Dashboard & Reports",
    items: [{ key: "view_analytics", label: "View Analytics Dashboard" }],
  },
  {
    group: "Properties",
    items: [
      { key: "manage_hostels", label: "Manage Hostels (Create/Edit/Delete)" },
      { key: "manage_rooms", label: "Manage Rooms (Create/Edit/Pricing)" },
    ],
  },
  {
    group: "Bookings",
    items: [
      { key: "view_bookings", label: "View Bookings" },
      { key: "manage_bookings", label: "Manage Bookings (Approve/Reject)" },
    ],
  },
  {
    group: "Users",
    items: [
      { key: "view_users", label: "View Users & Residents" },
      { key: "manage_users", label: "Create & Edit User Profiles" },
    ],
  },
  {
    group: "Finance",
    items: [
      { key: "view_payments", label: "View Payment Records" },
      { key: "manage_payments", label: "Process & Edit Payments" },
      { key: "view_expenses", label: "View Expense Sheets" },
      { key: "manage_expenses", label: "Submit / Approve Expenses" },
      { key: "manage_salaries", label: "Generate & Manage Salaries" },
    ],
  },
  {
    group: "Operations",
    items: [
      { key: "manage_mess", label: "Plan & Modify Mess Menu" },
      { key: "manage_laundry", label: "Log & Complete Laundry" },
      { key: "manage_cleaning", label: "Sanitization & Hygiene Logs" },
      { key: "manage_complaints", label: "Assign & Resolve Complaints" },
      { key: "manage_maintenance", label: "Handle Maintenance Tasks" },
      { key: "manage_notices", label: "Broadcast Notices" },
    ],
  },
  {
    group: "Staff & Warden Management",
    items: [
      { key: "access_warden_hostel", label: "Warden: Access 'My Hostel' Data" },
      { key: "access_warden_salary", label: "Warden: View Personal Salary" },
      {
        key: "access_warden_audit",
        label: "Warden: Access Multi-Hostel Audit",
      },
      {
        key: "access_staff_salary",
        label: "Staff: View Personal Salary History",
      },
    ],
  },
  {
    group: "Portal Access",
    items: [
      { key: "access_guest_room", label: "View 'My Room' Dashboard" },
      { key: "access_guest_mess", label: "View 'Mess Schedule' Page" },
      { key: "access_guest_support", label: "View 'Services & Support' Hub" },
    ],
  },
];

const ROLES = ["WARDEN", "STAFF", "RESIDENT", "GUEST", "ADMIN"];

const ROLE_COLORS = {
  WARDEN: "bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800",
  STAFF: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800",
  RESIDENT: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800",
  GUEST: "bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-800",
  ADMIN: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800",
};

const DEFAULT_ROLE_PERMISSIONS = {
  WARDEN: {
    view_analytics: true, manage_hostels: false, manage_rooms: true,
    view_bookings: true, manage_bookings: true, view_users: true,
    manage_users: true, view_payments: true, manage_payments: true,
    view_expenses: true, manage_expenses: true, manage_salaries: true,
    manage_mess: true, manage_laundry: true, manage_complaints: true,
    manage_maintenance: true, manage_notices: true,
    access_warden_hostel: true, access_warden_salary: true, access_warden_audit: true,
  },
  STAFF: {
    view_bookings: true, view_users: true, manage_laundry: true,
    manage_complaints: true, manage_maintenance: true, access_staff_salary: true,
  },
  RESIDENT: {
    view_bookings: true, view_payments: true,
    access_guest_room: true, access_guest_mess: true, access_guest_support: true,
  },
  GUEST: {
    view_bookings: false, view_payments: false,
    access_guest_room: true, access_guest_mess: false, access_guest_support: true,
  },
};

// =============================================================================
export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState("globals");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [permissionsData, setPermissionsData] = useState([]);
  const [selectedRole, setSelectedRole] = useState("WARDEN");

  // SMTP Test State
  const [testEmail, setTestEmail] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Favicon Upload State
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
  const [faviconDragOver, setFaviconDragOver] = useState(false);

  const uploadFavicon = async (file) => {
    if (!file) return;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) {
      toast.error("Cloudinary is not configured. Add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET to .env.");
      return;
    }
    const validTypes = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml", "image/x-icon", "image/vnd.microsoft.icon"];
    if (!validTypes.includes(file.type) && !file.name.endsWith(".ico")) {
      toast.error("Please upload a PNG, JPG, SVG, GIF or ICO file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File must be under 2 MB.");
      return;
    }
    setIsUploadingFavicon(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("upload_preset", uploadPreset.trim());
      body.append("folder", "hostel-app/branding");
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Upload failed");
      set("companyFavicon", data.secure_url);
      toast.success("Favicon uploaded! Click \"Save Branding\" to apply.");
    } catch (err) {
      toast.error(err.message || "Upload failed. Please try again.");
    } finally {
      setIsUploadingFavicon(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [sRes, pRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/permissions"),
      ]);
      if (sRes.ok) {
        const d = await sRes.json();
        if (d.settings) setSettings({ ...DEFAULT_SETTINGS, ...d.settings });
      }
      if (pRes.ok) {
        const d = await pRes.json();
        if (d.permissions) setPermissionsData(d.permissions);
      }
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        toast.success("Settings saved successfully");
        await checkAuth(true);
      } else {
        toast.error("Failed to save settings");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    setSettings({ ...DEFAULT_SETTINGS });
    toast.info("Settings reset to factory defaults. Click Save to apply.");
  };

  const getPermObj = () => {
    const rec = permissionsData.find((p) => p.role === selectedRole);
    if (!rec) return DEFAULT_ROLE_PERMISSIONS[selectedRole] || {};
    return typeof rec.permissions === "object"
      ? rec.permissions
      : JSON.parse(rec.permissions || "{}");
  };

  const togglePerm = (key) => {
    const cur = getPermObj();
    const updated = { ...cur, [key]: !cur[key] };
    setPermissionsData((prev) => {
      const idx = prev.findIndex((p) => p.role === selectedRole);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], permissions: updated };
        return next;
      }
      return [...prev, { role: selectedRole, permissions: updated }];
    });
  };

  const savePermissions = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/permissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole, permissions: getPermObj() }),
      });
      if (res.ok) {
        toast.success(`${selectedRole} permissions saved`);
        await checkAuth(true);
      } else {
        toast.error("Failed to save permissions");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail.trim()) {
      toast.error("Enter a target email address.");
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/settings/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testEmail }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({ ok: true, msg: `Sent! Message ID: ${data.messageId}` });
        toast.success("Test email sent successfully!");
      } else {
        setTestResult({ ok: false, msg: data.error || "SMTP connection failed" });
        toast.error("Test email failed");
      }
    } catch (err) {
      setTestResult({ ok: false, msg: "Network error — could not reach server." });
      toast.error("Test email failed");
    } finally {
      setIsTesting(false);
    }
  };

  const set = (key, val) => setSettings((prev) => ({ ...prev, [key]: val }));

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading system configuration...</p>
        </div>
      </div>
    );
  }

  const TABS = [
    { id: "globals", label: "App Services", icon: Wrench, color: "text-indigo-500" },
    { id: "ai", label: "AI Brain", icon: Brain, color: "text-purple-500" },
    { id: "email", label: "Email & SMTP", icon: Mail, color: "text-sky-500" },
    { id: "branding", label: "Branding", icon: Building2, color: "text-amber-500" },
    { id: "roles", label: "Role Permissions", icon: KeyRound, color: "text-emerald-500" },
  ];

  const enabledCount = Object.entries(settings).filter(
    ([k, v]) => k.startsWith("enable") && v === true
  ).length;
  const totalToggleCount = Object.keys(settings).filter((k) =>
    k.startsWith("enable")
  ).length;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 pb-24">
      {/* ── Header Banner ─────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-8 md:p-10 text-white shadow-xl border border-indigo-500/10">
        <div className="absolute -top-32 -right-32 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold tracking-wider uppercase mb-3">
            <Settings className="h-3.5 w-3.5 text-indigo-400" />
            <span>Admin Control Center</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            System Settings & Access Control
          </h1>
          <p className="text-sm text-slate-300 mt-1.5 max-w-2xl">
            Configure application services, AI brain parameters, email notifications, branding, and granular role-based permissions.
          </p>

          {/* Quick Stats */}
          <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <Activity className="h-3.5 w-3.5 text-emerald-400" />
                <span>Active Services</span>
              </div>
              <div className="mt-1 text-lg font-black text-white">{enabledCount}<span className="text-slate-500 text-sm font-bold">/{totalToggleCount}</span></div>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <Brain className="h-3.5 w-3.5 text-purple-400" />
                <span>AI Model</span>
              </div>
              <div className="mt-1 text-xs font-bold text-white truncate">{AI_MODELS.find((m) => m.id === settings.aiModel)?.name || "Default"}</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <Thermometer className="h-3.5 w-3.5 text-amber-400" />
                <span>AI Temperature</span>
              </div>
              <div className="mt-1 text-lg font-black text-white">{(settings.aiTemperature ?? 0.5).toFixed(1)}</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <Shield className="h-3.5 w-3.5 text-sky-400" />
                <span>Maintenance</span>
              </div>
              <div className={`mt-1 text-xs font-black uppercase ${settings.maintenanceMode ? "text-rose-400" : "text-emerald-400"}`}>
                {settings.maintenanceMode ? "⚠ Active" : "✓ Disabled"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <div className="flex overflow-x-auto scrollbar-none bg-gray-100/80 dark:bg-muted/30 p-1 rounded-2xl gap-0.5 border border-gray-200/50 dark:border-border">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-white dark:bg-card text-gray-900 dark:text-foreground shadow-sm"
                  : "text-gray-500 dark:text-muted-foreground hover:text-gray-800 dark:hover:text-foreground"
              }`}
            >
              <Icon className={`w-4 h-4 ${activeTab === tab.id ? tab.color : ""}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: App Services ───────────────────────────────── */}
      {activeTab === "globals" && (
        <div className="space-y-6 max-w-3xl">
          {/* Maintenance Mode */}
          <div
            className={`flex items-start justify-between p-5 rounded-2xl border-2 transition-colors ${
              settings.maintenanceMode
                ? "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800"
                : "bg-white dark:bg-card border-gray-100 dark:border-border"
            }`}
          >
            <div className="max-w-[70%]">
              <p className="text-sm font-bold text-rose-800 dark:text-rose-300 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" /> Maintenance Mode
              </p>
              <p className="text-xs text-rose-700/70 dark:text-rose-400/60 mt-1">
                Blocks all non-admin users from accessing the dashboard. Admins can still log in.
              </p>
              {settings.maintenanceMode && (
                <input
                  type="text"
                  placeholder="Custom message shown to users..."
                  value={settings.maintenanceMessage || ""}
                  onChange={(e) => set("maintenanceMessage", e.target.value)}
                  className="mt-3 w-full h-10 px-3 text-sm rounded-xl border border-rose-200 dark:border-rose-800 bg-white dark:bg-card focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              )}
            </div>
            <button
              type="button"
              onClick={() => set("maintenanceMode", !settings.maintenanceMode)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0 mt-1 ${
                settings.maintenanceMode ? "bg-rose-500" : "bg-gray-200 dark:bg-muted"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white dark:bg-card rounded-full shadow transition-transform duration-200 ${settings.maintenanceMode ? "translate-x-6" : "translate-x-0"}`}
              />
            </button>
          </div>

          {/* Maintenance Bypass Links */}
          {settings.maintenanceMode && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-4 shadow-lg transition-all animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Shield className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold tracking-tight">Active Maintenance Bypass Links</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Share these links with wardens or guests so they can test features bypass-authenticated.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Warden Link */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-950/40 border border-indigo-800/40 px-2.5 py-1 rounded-full">
                        Warden Bypass
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">24h TTL cookie</span>
                    </div>
                    <p className="text-xs text-slate-400">Allows access to the Warden dashboard and all warden permissions.</p>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-800 rounded-xl p-1.5 pl-3">
                    <span className="text-xs font-mono text-slate-400 truncate flex-1 select-all">
                      {typeof window !== 'undefined' ? `${window.location.origin}/auth/login?bypassMaintenance=${settings.maintenanceWardenToken}` : `loading...`}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const url = `${window.location.origin}/auth/login?bypassMaintenance=${settings.maintenanceWardenToken}`;
                        navigator.clipboard.writeText(url);
                        toast.success("Warden bypass link copied!");
                      }}
                      className="h-8 px-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer text-white"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>

                {/* Guest Link */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-full">
                        Guest & Resident Bypass
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">24h TTL cookie</span>
                    </div>
                    <p className="text-xs text-slate-400">Allows access to the Resident/Guest booking flow and portals.</p>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-800 rounded-xl p-1.5 pl-3">
                    <span className="text-xs font-mono text-slate-400 truncate flex-1 select-all">
                      {typeof window !== 'undefined' ? `${window.location.origin}/auth/login?bypassMaintenance=${settings.maintenanceGuestToken}` : `loading...`}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const url = `${window.location.origin}/auth/login?bypassMaintenance=${settings.maintenanceGuestToken}`;
                        navigator.clipboard.writeText(url);
                        toast.success("Guest bypass link copied!");
                      }}
                      className="h-8 px-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer text-white"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <SectionCard
            title="Resident & Guest Services"
            subtitle="Features used by residents and guest users"
            icon={Globe}
            iconColor="text-indigo-500"
            iconBg="bg-indigo-50 dark:bg-indigo-950/40"
          >
            <ToggleRow label="Laundry Service" desc="Allow staff to log and track laundry requests." value={settings.enableLaundry} onChange={(v) => set("enableLaundry", v)} />
            <ToggleRow label="Mess & Dining Menu" desc="Display weekly mess schedules to residents." value={settings.enableMess} onChange={(v) => set("enableMess", v)} />
            <ToggleRow label="Guest Room Bookings" desc="Allow new guests to make online booking requests." value={settings.enableGuestBookings} onChange={(v) => set("enableGuestBookings", v)} />
            <ToggleRow label="AI Assistant (Chat Bot)" desc="Enable the AI-powered support assistant for residents." value={settings.enableAiAssistant} onChange={(v) => set("enableAiAssistant", v)} />
          </SectionCard>

          <SectionCard
            title="Operational Services"
            subtitle="Core workflows used by staff and wardens"
            icon={Wrench}
            iconColor="text-violet-500"
            iconBg="bg-violet-50 dark:bg-violet-950/40"
          >
            <ToggleRow label="Complaints System" desc="Allow residents to submit and track complaints." value={settings.enableComplaintsSystem} onChange={(v) => set("enableComplaintsSystem", v)} />
            <ToggleRow label="Maintenance Requests" desc="Enable maintenance ticket creation and tracking." value={settings.enableMaintenanceRequests} onChange={(v) => set("enableMaintenanceRequests", v)} />
            <ToggleRow label="Notice Board" desc="Allow broadcasting of notices to residents and staff." value={settings.enableNoticeBoard} onChange={(v) => set("enableNoticeBoard", v)} />
            <ToggleRow label="Payment Processing" desc="Allow payments to be logged, processed, and tracked." value={settings.enablePaymentProcessing} onChange={(v) => set("enablePaymentProcessing", v)} />
            <ToggleRow label="Refund Requests" desc="Allow users to submit payment refund requests." value={settings.enableRefundRequests} onChange={(v) => set("enableRefundRequests", v)} />
          </SectionCard>

          <SectionCard
            title="Finance Automation"
            subtitle="Control automated monthly billing cycles"
            icon={Zap}
            iconColor="text-emerald-500"
            iconBg="bg-emerald-50 dark:bg-emerald-950/40"
          >
            <ToggleRow label="Auto-Generate Rent Invoices" desc="Automatically generate monthly rent invoices for all residents on the 1st of each month." value={settings.autoGenerateRentInvoices} onChange={(v) => set("autoGenerateRentInvoices", v)} />
            <ToggleRow label="Auto-Generate Staff Salaries" desc="Automatically generate monthly salary slips for all staff members on the 1st of each month." value={settings.autoGenerateStaffSalaries} onChange={(v) => set("autoGenerateStaffSalaries", v)} />
          </SectionCard>

          <div className="flex items-center gap-3">
            <SaveButton onClick={saveSettings} isSaving={isSaving} label="Save App Services" />
            <button onClick={resetToDefaults} className="h-11 px-5 border border-gray-200 dark:border-border text-gray-500 dark:text-muted-foreground font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-muted/10 transition-all flex items-center gap-2 text-xs">
              <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
            </button>
          </div>
        </div>
      )}

      {/* ── TAB 2: AI Brain Config ────────────────────────────── */}
      {activeTab === "ai" && (
        <div className="space-y-6 max-w-3xl">
          {/* AI Model Selector */}
          <SectionCard
            title="Primary AI Model"
            subtitle="Select the LLM model powering HostelAI copilot responses"
            icon={Cpu}
            iconColor="text-purple-500"
            iconBg="bg-purple-50 dark:bg-purple-950/40"
          >
            <div className="py-4 space-y-3">
              {AI_MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => set("aiModel", m.id)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                    settings.aiModel === m.id
                      ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 dark:border-indigo-400 shadow-sm"
                      : "border-gray-100 dark:border-border hover:border-gray-200 dark:hover:border-border/80 bg-white dark:bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                        settings.aiModel === m.id ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300" : "bg-gray-100 dark:bg-muted text-gray-500 dark:text-muted-foreground"
                      }`}>
                        <Cpu className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-gray-900 dark:text-foreground">{m.name}</p>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${m.badgeColor}`}>{m.badge}</span>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-muted-foreground mt-0.5">{m.provider} · {m.desc}</p>
                      </div>
                    </div>
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                      settings.aiModel === m.id ? "border-indigo-500 bg-indigo-500" : "border-gray-200 dark:border-border"
                    }`}>
                      {settings.aiModel === m.id && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </SectionCard>

          {/* Temperature Slider */}
          <SectionCard
            title="AI Creativity (Temperature)"
            subtitle="Controls how creative or deterministic the AI responses are"
            icon={Thermometer}
            iconColor="text-amber-500"
            iconBg="bg-amber-50 dark:bg-amber-950/40"
          >
            <div className="py-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Precise</span>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800 rounded-xl px-4 py-2">
                  <span className="text-xl font-black text-indigo-700 dark:text-indigo-300">{(settings.aiTemperature ?? 0.5).toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Creative</span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.aiTemperature ?? 0.5}
                onChange={(e) => set("aiTemperature", parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-muted rounded-full appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                <span>0.0 — Strict & Factual</span>
                <span>0.5 — Balanced</span>
                <span>1.0 — Highly Creative</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50">
                <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                  💡 Tip: For hostel support queries, 0.3–0.5 is recommended. Higher values produce more creative but potentially less accurate responses.
                </p>
              </div>
            </div>
          </SectionCard>

          {/* Custom System Prompt */}
          <SectionCard
            title="Custom System Instructions"
            subtitle="Override the default HostelAI persona with custom instructions (leave empty to use built-in prompt)"
            icon={FileText}
            iconColor="text-indigo-500"
            iconBg="bg-indigo-50 dark:bg-indigo-950/40"
          >
            <div className="py-4 space-y-3">
              <textarea
                value={settings.aiSystemPrompt || ""}
                onChange={(e) => set("aiSystemPrompt", e.target.value)}
                placeholder={`Leave empty to use the default HostelAI executive persona.\n\nExample override:\n"You are HelpBot, a friendly assistant for ABC Hostel. Always respond in Urdu. Be polite and concise."`}
                rows={8}
                className="w-full bg-gray-50 dark:bg-muted/20 border border-gray-200 dark:border-border rounded-xl p-4 text-sm font-mono text-gray-800 dark:text-foreground placeholder:text-gray-300 dark:placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-y"
              />
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">
                  {settings.aiSystemPrompt ? `${settings.aiSystemPrompt.length} characters` : "Using default HostelAI prompt"}
                </p>
                {settings.aiSystemPrompt && (
                  <button
                    onClick={() => set("aiSystemPrompt", "")}
                    className="text-[10px] font-bold text-rose-500 hover:text-rose-700 uppercase tracking-widest flex items-center gap-1"
                  >
                    <XCircle className="w-3 h-3" /> Clear Override
                  </button>
                )}
              </div>
            </div>
          </SectionCard>

          <SaveButton onClick={saveSettings} isSaving={isSaving} label="Save AI Configuration" />
        </div>
      )}

      {/* ── TAB 3: Email & SMTP ───────────────────────────────── */}
      {activeTab === "email" && (
        <div className="space-y-6 max-w-3xl">
          {/* Master switch */}
          <div
            className={`flex items-start justify-between p-5 rounded-2xl border-2 transition-colors ${
              !settings.enableEmailService
                ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                : "bg-white dark:bg-card border-gray-100 dark:border-border"
            }`}
          >
            <div className="max-w-[75%]">
              <p className="text-sm font-bold text-gray-900 dark:text-foreground flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-500" /> Email Service (Master Switch)
              </p>
              <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
                Disabling this will block ALL outgoing emails regardless of individual settings below.
              </p>
            </div>
            <button
              type="button"
              onClick={() => set("enableEmailService", !settings.enableEmailService)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0 mt-1 ${
                settings.enableEmailService ? "bg-indigo-600" : "bg-gray-200 dark:bg-muted"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white dark:bg-card rounded-full shadow transition-transform duration-200 ${settings.enableEmailService ? "translate-x-6" : "translate-x-0"}`}
              />
            </button>
          </div>

          {!settings.enableEmailService && (
            <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <XCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                All email notifications are currently disabled. Individual toggles below are inactive.
              </p>
            </div>
          )}

          <SectionCard
            title="SMTP Server Configuration"
            subtitle="Configure connection credentials for your outgoing mail server"
            icon={Settings}
            iconColor="text-indigo-500"
            iconBg="bg-indigo-50 dark:bg-indigo-950/40"
          >
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-gray-500 dark:text-muted-foreground uppercase tracking-widest pl-1">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    value={settings.smtpHost || ""}
                    onChange={(e) => set("smtpHost", e.target.value)}
                    className="mt-1.5 w-full h-10 px-3 text-sm rounded-xl border border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/20 text-gray-800 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-card transition-all"
                    placeholder="e.g. smtp.gmail.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-muted-foreground uppercase tracking-widest pl-1">
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    value={settings.smtpPort || ""}
                    onChange={(e) => set("smtpPort", e.target.value ? parseInt(e.target.value) : "")}
                    className="mt-1.5 w-full h-10 px-3 text-sm rounded-xl border border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/20 text-gray-800 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-card transition-all"
                    placeholder="e.g. 587"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-muted-foreground uppercase tracking-widest pl-1">
                    SMTP Username / User
                  </label>
                  <input
                    type="text"
                    value={settings.smtpUser || ""}
                    onChange={(e) => set("smtpUser", e.target.value)}
                    className="mt-1.5 w-full h-10 px-3 text-sm rounded-xl border border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/20 text-gray-800 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-card transition-all"
                    placeholder="e.g. user@gmail.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-muted-foreground uppercase tracking-widest pl-1">
                    SMTP Password
                  </label>
                  <input
                    type="password"
                    value={settings.smtpPass || ""}
                    onChange={(e) => set("smtpPass", e.target.value)}
                    className="mt-1.5 w-full h-10 px-3 text-sm rounded-xl border border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/20 text-gray-800 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-card transition-all"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-muted-foreground uppercase tracking-widest pl-1">
                    Sender Email Address
                  </label>
                  <input
                    type="email"
                    value={settings.smtpSender || ""}
                    onChange={(e) => set("smtpSender", e.target.value)}
                    className="mt-1.5 w-full h-10 px-3 text-sm rounded-xl border border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/20 text-gray-800 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-card transition-all"
                    placeholder="e.g. no-reply@myhostel.com"
                  />
                </div>
                <div className="flex items-center justify-between pt-5">
                  <span className="text-xs text-gray-500 dark:text-muted-foreground font-semibold">Use SSL/TLS Connection</span>
                  <button
                    type="button"
                    onClick={() => set("smtpSecure", !settings.smtpSecure)}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                      settings.smtpSecure ? "bg-indigo-600" : "bg-gray-200 dark:bg-muted"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white dark:bg-card rounded-full shadow transition-transform duration-200 ${
                        settings.smtpSecure ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Authentication Emails" subtitle="Emails sent during login and account management" icon={KeyRound} iconColor="text-indigo-500" iconBg="bg-indigo-50 dark:bg-indigo-950/40">
            <ToggleRow disabled={!settings.enableEmailService} label="Password Reset Emails" desc="Send a reset link when a user requests to change their password." value={settings.enablePasswordResetEmails} onChange={(v) => set("enablePasswordResetEmails", v)} />
            <ToggleRow disabled={!settings.enableEmailService} label="Welcome Emails" desc="Send a welcome email when a new user account is created." value={settings.enableWelcomeEmails} onChange={(v) => set("enableWelcomeEmails", v)} />
          </SectionCard>

          <SectionCard title="Transactional Emails" subtitle="Operational emails tied to bookings and finance" icon={Settings} iconColor="text-emerald-500" iconBg="bg-emerald-50 dark:bg-emerald-950/40">
            <ToggleRow disabled={!settings.enableEmailService} label="Booking Confirmation Emails" desc="Notify users when their booking is created, confirmed, or cancelled." value={settings.enableBookingEmails} onChange={(v) => set("enableBookingEmails", v)} />
            <ToggleRow disabled={!settings.enableEmailService} label="Payment Receipt Emails" desc="Send payment confirmations and due-date reminders to residents." value={settings.enablePaymentEmails} onChange={(v) => set("enablePaymentEmails", v)} />
          </SectionCard>

          <SectionCard title="Notification Emails" subtitle="Emails for ongoing operational events" icon={Mail} iconColor="text-sky-500" iconBg="bg-sky-50 dark:bg-sky-950/40">
            <ToggleRow disabled={!settings.enableEmailService} label="Complaint Update Emails" desc="Alert users when their complaint status changes or a comment is added." value={settings.enableComplaintEmails} onChange={(v) => set("enableComplaintEmails", v)} />
            <ToggleRow disabled={!settings.enableEmailService} label="Notice Broadcast Emails" desc="Email residents and staff when a new notice is published." value={settings.enableNoticeEmails} onChange={(v) => set("enableNoticeEmails", v)} />
          </SectionCard>

          {/* SMTP Diagnostic */}
          <SectionCard title="SMTP Connection Diagnostic" subtitle="Verify your Nodemailer SMTP setup by sending a test email" icon={Send} iconColor="text-rose-500" iconBg="bg-rose-50 dark:bg-rose-950/40">
            <div className="py-4 space-y-3">
              <div className="flex gap-3">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Enter target email address..."
                  className="flex-1 h-11 px-4 text-sm rounded-xl border border-gray-200 dark:border-border bg-gray-50 dark:bg-muted/20 text-gray-800 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                />
                <button
                  onClick={handleTestEmail}
                  disabled={isTesting}
                  className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-60 active:scale-[0.97] shrink-0"
                >
                  {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {isTesting ? "Sending..." : "Send Test"}
                </button>
              </div>
              {testResult && (
                <div className={`flex items-start gap-2 p-3 rounded-xl border ${
                  testResult.ok
                    ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                    : "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800"
                }`}>
                  {testResult.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <p className={`text-xs font-semibold ${testResult.ok ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>
                    {testResult.msg}
                  </p>
                </div>
              )}
            </div>
          </SectionCard>

          <SaveButton onClick={saveSettings} isSaving={isSaving} label="Save Email Config" />
        </div>
      )}

      {/* ── TAB 4: Branding ───────────────────────────────────── */}
      {activeTab === "branding" && (
        <div className="space-y-6 max-w-3xl">
          <SectionCard
            title="Branding & Identity"
            subtitle="Customize the application name and short name used throughout the portal."
            icon={Building2}
            iconColor="text-amber-600"
            iconBg="bg-amber-50 dark:bg-amber-950/40"
          >
            <div className="space-y-5 py-4">
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-muted-foreground uppercase tracking-widest pl-1">
                  Full Company Name
                </label>
                <input
                  type="text"
                  value={settings.companyName || ""}
                  onChange={(e) => set("companyName", e.target.value)}
                  className="mt-1.5 w-full h-11 px-4 text-sm rounded-xl border border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/20 text-gray-800 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-card transition-all"
                  placeholder="e.g. Hostel Management System"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-muted-foreground uppercase tracking-widest pl-1">
                  Short Name / Initials
                </label>
                <input
                  type="text"
                  value={settings.companyShortName || ""}
                  onChange={(e) => set("companyShortName", e.target.value)}
                  className="mt-1.5 w-full h-11 px-4 text-sm rounded-xl border border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/20 text-gray-800 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-card transition-all"
                  placeholder="e.g. HMS"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-muted-foreground uppercase tracking-widest pl-1">
                  Favicon / App Icon
                </label>

                {/* Upload Zone */}
                <div
                  className={`mt-2 relative rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
                    faviconDragOver
                      ? "border-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/20"
                      : "border-gray-200 dark:border-border hover:border-indigo-300 dark:hover:border-indigo-700 bg-gray-50/50 dark:bg-muted/10"
                  }`}
                  onClick={() => document.getElementById("favicon-file-input").click()}
                  onDragOver={(e) => { e.preventDefault(); setFaviconDragOver(true); }}
                  onDragLeave={() => setFaviconDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setFaviconDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) uploadFavicon(file);
                  }}
                >
                  <input
                    id="favicon-file-input"
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml,image/x-icon,.ico"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadFavicon(file);
                      e.target.value = "";
                    }}
                  />

                  <div className="flex items-center gap-5 p-4">
                    {/* Preview box */}
                    <div className="w-16 h-16 rounded-xl border border-gray-200 dark:border-border bg-white dark:bg-card flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                      {isUploadingFavicon ? (
                        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                      ) : settings.companyFavicon ? (
                        <img
                          src={settings.companyFavicon}
                          alt="Favicon"
                          className="w-10 h-10 object-contain"
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      ) : (
                        <ImageIcon className="w-7 h-7 text-gray-300 dark:text-muted-foreground/40" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-700 dark:text-foreground">
                        {isUploadingFavicon ? "Uploading…" : "Drop your icon here or click to browse"}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-muted-foreground mt-0.5">
                        PNG, JPG, SVG, ICO · Max 2 MB · Recommended: 32×32 or 64×64 px
                      </p>
                    </div>

                    <div className="shrink-0">
                      <div className="h-9 px-4 flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all pointer-events-none">
                        <Upload className="w-3.5 h-3.5" />
                        Upload
                      </div>
                    </div>
                  </div>
                </div>

                {/* URL override fallback */}
                <div className="mt-3">
                  <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest pl-1 mb-1.5">Or paste a URL directly</p>
                  <input
                    type="text"
                    value={settings.companyFavicon || ""}
                    onChange={(e) => set("companyFavicon", e.target.value)}
                    className="w-full h-10 px-4 text-sm rounded-xl border border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/20 text-gray-700 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-card transition-all font-mono"
                    placeholder="https://res.cloudinary.com/… or /favicon.ico"
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="1Bill Invoice Settings"
            subtitle="Configure payment and invoice generation prefixes for guest and resident online payments."
            icon={Sliders}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-50 dark:bg-indigo-950/40"
          >
            <div className="space-y-5 py-4">
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-muted-foreground uppercase tracking-widest pl-1">
                  Global 1Bill Merchant Prefix (6-8 Digits)
                </label>
                <input
                  type="text"
                  maxLength={8}
                  value={settings.oneBillPrefix || ""}
                  onChange={(e) => set("oneBillPrefix", e.target.value.replace(/\D/g, ""))}
                  className="mt-1.5 w-full h-11 px-4 text-sm rounded-xl border border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/20 text-gray-800 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-card transition-all font-mono"
                  placeholder="e.g. 100123"
                />
                <p className="text-[10px] text-gray-400 dark:text-muted-foreground mt-1.5 pl-1">
                  The merchant billing prefix assigned by 1Link. This is prefixed to all automatically generated 18-digit online payment invoices.
                </p>
              </div>
            </div>
          </SectionCard>

          <SaveButton onClick={saveSettings} isSaving={isSaving} label="Save Branding" />
        </div>
      )}

      {/* ── TAB 5: Role Permissions ──────────────────────────── */}
      {activeTab === "roles" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Role Picker */}
          <div className="lg:col-span-1 space-y-2">
            <p className="text-[10px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest pl-1 mb-4">
              Select Role
            </p>
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRole(r)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold border transition-all ${
                  selectedRole === r
                    ? ROLE_COLORS[r]
                    : "text-gray-500 dark:text-muted-foreground border-transparent hover:bg-gray-50 dark:hover:bg-muted/5"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Permission Matrix */}
          <div className="lg:col-span-3 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-foreground">
                  {selectedRole}
                </h2>
                <p className="text-xs text-gray-400 dark:text-muted-foreground mt-0.5">
                  {selectedRole === "ADMIN"
                    ? "Absolute control level. Permissions cannot be restricted."
                    : "Toggle individual capabilities for this role."}
                </p>
              </div>
              <button
                onClick={savePermissions}
                disabled={isSaving || selectedRole === "ADMIN"}
                className="h-10 px-6 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm shadow-indigo-600/20"
              >
                {isSaving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <><KeyRound className="w-4 h-4" /> Save {selectedRole} Perms</>
                )}
              </button>
            </div>

            {selectedRole === "ADMIN" && (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-6 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-900 dark:text-blue-200">
                    Administrator Root Access
                  </p>
                  <p className="text-xs text-blue-700/80 dark:text-blue-400/70 mt-1 leading-relaxed">
                    The <strong>ADMIN</strong> role is the primary management account. It
                    implicitly bypasses all feature toggles and sub-permissions
                    to allow full hostelling operations management regardless of
                    global settings.
                  </p>
                </div>
              </div>
            )}

            {PERMISSION_KEYS.filter((group) => {
              if (selectedRole === "ADMIN") return true;
              return group.items.some((p) =>
                DEFAULT_ROLE_PERMISSIONS[selectedRole]?.hasOwnProperty(p.key),
              );
            }).map((group) => {
              const permObj = getPermObj();
              const relevantItems =
                selectedRole === "ADMIN"
                  ? group.items
                  : group.items.filter((p) =>
                      DEFAULT_ROLE_PERMISSIONS[selectedRole]?.hasOwnProperty(p.key),
                    );

              return (
                <div
                  key={group.group}
                  className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border shadow-sm overflow-hidden"
                >
                  <div className="px-6 py-4 border-b border-gray-50 dark:border-border/30 bg-gray-50 dark:bg-background">
                    <p className="text-[10px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest">
                      {group.group}
                    </p>
                  </div>
                  <div className="px-6">
                    {relevantItems.map((p) => (
                      <ToggleRow
                        key={p.key}
                        label={p.label}
                        disabled={selectedRole === "ADMIN"}
                        value={
                          selectedRole === "ADMIN" ? true : !!permObj[p.key]
                        }
                        onChange={() => togglePerm(p.key)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
