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
  ToggleLeft,
  Building2,
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
      className={`flex items-center justify-between py-4 border-b border-gray-50 last:border-0 ${disabled ? "opacity-50 pointer-events-none" : ""}`}
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
          value ? (danger ? "bg-rose-500" : "bg-blue-600") : "bg-gray-200"
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
  children,
}) {
  return (
    <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-lg bg-gray-50 dark:bg-muted/10 flex items-center justify-center ${iconColor}`}
        >
          <Icon className="w-4 h-4" />
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

// ─── Default full settings object ────────────────────────────────────────
const DEFAULT_SETTINGS = {
  maintenanceMode: false,
  maintenanceMessage: "",
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
};

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
  WARDEN: "bg-violet-50 text-violet-700 border-violet-100",
  STAFF: "bg-amber-50 text-amber-700 border-amber-100",
  RESIDENT: "bg-emerald-50 text-emerald-700 border-emerald-100",
  GUEST: "bg-sky-50 text-sky-700 border-sky-100",
  ADMIN: "bg-blue-50 text-blue-700 border-blue-100",
};

const DEFAULT_ROLE_PERMISSIONS = {
  WARDEN: {
    view_analytics: true,
    manage_hostels: false,
    manage_rooms: true,
    view_bookings: true,
    manage_bookings: true,
    view_users: true,
    manage_users: true,
    view_payments: true,
    manage_payments: true,
    view_expenses: true,
    manage_expenses: true,
    manage_salaries: true,
    manage_mess: true,
    manage_laundry: true,
    manage_complaints: true,
    manage_maintenance: true,
    manage_notices: true,
    access_warden_hostel: true,
    access_warden_salary: true,
    access_warden_audit: true,
  },
  STAFF: {
    view_bookings: true,
    view_users: true,
    manage_laundry: true,
    manage_complaints: true,
    manage_maintenance: true,
    access_staff_salary: true,
  },
  RESIDENT: {
    view_bookings: true,
    view_payments: true,
    access_guest_room: true,
    access_guest_mess: true,
    access_guest_support: true,
  },
  GUEST: {
    view_bookings: false,
    view_payments: false,
    access_guest_room: true,
    access_guest_mess: false,
    access_guest_support: true,
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

  const set = (key, val) => setSettings((prev) => ({ ...prev, [key]: val }));

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400 dark:text-muted-foreground" />
      </div>
    );
  }

  const TABS = [
    { id: "globals", label: "App Services", icon: Wrench },
    { id: "branding", label: "Branding", icon: Building2 },
    { id: "email", label: "Email Services", icon: Mail },
    { id: "roles", label: "Role Permissions", icon: KeyRound },
  ];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-foreground tracking-tight">
          System Settings & Access Control
        </h1>
        <p className="text-gray-500 dark:text-muted-foreground mt-1 text-sm">
          Control application services, email notifications, and granular
          role-based access for every user type.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl w-fit gap-0.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-white dark:bg-card text-blue-600 shadow-sm"
                  : "text-gray-500 dark:text-muted-foreground hover:text-gray-800 dark:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: App Services ───────────────────────────────────────── */}
      {activeTab === "globals" && (
        <div className="space-y-6 max-w-3xl">
          {/* Maintenance Mode – special card */}
          <div
            className={`flex items-start justify-between p-5 rounded-2xl border-2 transition-colors ${
              settings.maintenanceMode
                ? "bg-rose-50 border-rose-200"
                : "bg-white dark:bg-card border-gray-100 dark:border-border"
            }`}
          >
            <div className="max-w-[70%]">
              <p className="text-sm font-bold text-rose-800 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" /> Maintenance
                Mode
              </p>
              <p className="text-xs text-rose-700/70 mt-1">
                Blocks all non-admin users from accessing the dashboard. Admins
                can still log in.
              </p>
              {settings.maintenanceMode && (
                <input
                  type="text"
                  placeholder="Custom message shown to users..."
                  value={settings.maintenanceMessage || ""}
                  onChange={(e) => set("maintenanceMessage", e.target.value)}
                  className="mt-3 w-full h-10 px-3 text-sm rounded-xl border border-rose-200 bg-white dark:bg-card focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              )}
            </div>
            <button
              type="button"
              onClick={() => set("maintenanceMode", !settings.maintenanceMode)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0 mt-1 ${
                settings.maintenanceMode ? "bg-rose-500" : "bg-gray-200"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white dark:bg-card rounded-full shadow transition-transform duration-200 ${settings.maintenanceMode ? "translate-x-6" : "translate-x-0"}`}
              />
            </button>
          </div>

          {/* Resident / Guest Services */}
          <SectionCard
            title="Resident & Guest Services"
            subtitle="Features used by residents and guest users"
            icon={Settings}
            iconColor="text-blue-500"
          >
            <ToggleRow
              label="Laundry Service"
              desc="Allow staff to log and track laundry requests."
              value={settings.enableLaundry}
              onChange={(v) => set("enableLaundry", v)}
            />
            <ToggleRow
              label="Mess & Dining Menu"
              desc="Display weekly mess schedules to residents."
              value={settings.enableMess}
              onChange={(v) => set("enableMess", v)}
            />
            <ToggleRow
              label="Guest Room Bookings"
              desc="Allow new guests to make online booking requests."
              value={settings.enableGuestBookings}
              onChange={(v) => set("enableGuestBookings", v)}
            />
            <ToggleRow
              label="AI Assistant (Chat Bot)"
              desc="Enable the AI-powered support assistant for residents."
              value={settings.enableAiAssistant}
              onChange={(v) => set("enableAiAssistant", v)}
            />
          </SectionCard>

          {/* Operational Services */}
          <SectionCard
            title="Operational Services"
            subtitle="Core workflows used by staff and wardens"
            icon={Wrench}
            iconColor="text-violet-500"
          >
            <ToggleRow
              label="Complaints System"
              desc="Allow residents to submit and track complaints."
              value={settings.enableComplaintsSystem}
              onChange={(v) => set("enableComplaintsSystem", v)}
            />
            <ToggleRow
              label="Maintenance Requests"
              desc="Enable maintenance ticket creation and tracking."
              value={settings.enableMaintenanceRequests}
              onChange={(v) => set("enableMaintenanceRequests", v)}
            />
            <ToggleRow
              label="Notice Board"
              desc="Allow broadcasting of notices to residents and staff."
              value={settings.enableNoticeBoard}
              onChange={(v) => set("enableNoticeBoard", v)}
            />
            <ToggleRow
              label="Payment Processing"
              desc="Allow payments to be logged, processed, and tracked."
              value={settings.enablePaymentProcessing}
              onChange={(v) => set("enablePaymentProcessing", v)}
            />
            <ToggleRow
              label="Refund Requests"
              desc="Allow users to submit payment refund requests."
              value={settings.enableRefundRequests}
              onChange={(v) => set("enableRefundRequests", v)}
            />
          </SectionCard>

          {/* Finance Automation */}
          <SectionCard
            title="Finance Automation"
            subtitle="Control automated monthly billing cycles"
            icon={Settings}
            iconColor="text-emerald-500"
          >
            <ToggleRow
              label="Auto-Generate Rent Invoices"
              desc="Automatically generate monthly rent invoices for all residents on the 1st of each month."
              value={settings.autoGenerateRentInvoices}
              onChange={(v) => set("autoGenerateRentInvoices", v)}
            />
            <ToggleRow
              label="Auto-Generate Staff Salaries"
              desc="Automatically generate monthly salary slips for all staff members on the 1st of each month."
              value={settings.autoGenerateStaffSalaries}
              onChange={(v) => set("autoGenerateStaffSalaries", v)}
            />
          </SectionCard>

          <button
            onClick={saveSettings}
            disabled={isSaving}
            className="h-11 px-8 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> Save App Services
              </>
            )}
          </button>
        </div>
      )}

      {/* ── TAB 4: Branding ───────────────────────────────────────────── */}
      {activeTab === "branding" && (
        <div className="space-y-6 max-w-3xl">
          <SectionCard
            title="Branding & Identity"
            subtitle="Customize the application name and short name used throughout the portal."
            icon={Building2}
            iconColor="text-blue-600"
          >
            <div className="space-y-4 py-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">
                  Full Company Name
                </label>
                <input
                  type="text"
                  value={settings.companyName || ""}
                  onChange={(e) => set("companyName", e.target.value)}
                  className="mt-1.5 w-full h-11 px-4 text-sm rounded-xl border border-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  placeholder="e.g. Hostel Management System"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">
                  Short Name / Initials
                </label>
                <input
                  type="text"
                  value={settings.companyShortName || ""}
                  onChange={(e) => set("companyShortName", e.target.value)}
                  className="mt-1.5 w-full h-11 px-4 text-sm rounded-xl border border-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  placeholder="e.g. HMS"
                />
              </div>
            </div>
          </SectionCard>

          <button
            onClick={saveSettings}
            disabled={isSaving}
            className="h-11 px-8 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> Save Branding
              </>
            )}
          </button>
        </div>
      )}

      {/* ── TAB 2: Email Services ─────────────────────────────────────── */}
      {activeTab === "email" && (
        <div className="space-y-6 max-w-3xl">
          {/* Master switch */}
          <div
            className={`flex items-start justify-between p-5 rounded-2xl border-2 transition-colors ${
              !settings.enableEmailService
                ? "bg-amber-50 border-amber-200"
                : "bg-white dark:bg-card border-gray-100 dark:border-border"
            }`}
          >
            <div className="max-w-[75%]">
              <p className="text-sm font-bold text-gray-900 dark:text-foreground flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-500" /> Email Service
                (Master Switch)
              </p>
              <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
                Disabling this will block ALL outgoing emails regardless of
                individual settings below. Useful when rotating SMTP
                credentials.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                set("enableEmailService", !settings.enableEmailService)
              }
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0 mt-1 ${
                settings.enableEmailService ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white dark:bg-card rounded-full shadow transition-transform duration-200 ${settings.enableEmailService ? "translate-x-6" : "translate-x-0"}`}
              />
            </button>
          </div>

          {!settings.enableEmailService && (
            <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
              <XCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-800 font-medium">
                All email notifications are currently disabled. Individual
                toggles below are inactive.
              </p>
            </div>
          )}

          {/* Individual email controls */}
          <SectionCard
            title="Authentication Emails"
            subtitle="Emails sent during login and account management"
            icon={KeyRound}
            iconColor="text-indigo-500"
          >
            <ToggleRow
              disabled={!settings.enableEmailService}
              label="Password Reset Emails"
              desc="Send a reset link when a user requests to change their password."
              value={settings.enablePasswordResetEmails}
              onChange={(v) => set("enablePasswordResetEmails", v)}
            />
            <ToggleRow
              disabled={!settings.enableEmailService}
              label="Welcome Emails"
              desc="Send a welcome email when a new user account is created."
              value={settings.enableWelcomeEmails}
              onChange={(v) => set("enableWelcomeEmails", v)}
            />
          </SectionCard>

          <SectionCard
            title="Transactional Emails"
            subtitle="Operational emails tied to bookings and finance"
            icon={Settings}
            iconColor="text-emerald-500"
          >
            <ToggleRow
              disabled={!settings.enableEmailService}
              label="Booking Confirmation Emails"
              desc="Notify users when their booking is created, confirmed, or cancelled."
              value={settings.enableBookingEmails}
              onChange={(v) => set("enableBookingEmails", v)}
            />
            <ToggleRow
              disabled={!settings.enableEmailService}
              label="Payment Receipt Emails"
              desc="Send payment confirmations and due-date reminders to residents."
              value={settings.enablePaymentEmails}
              onChange={(v) => set("enablePaymentEmails", v)}
            />
          </SectionCard>

          <SectionCard
            title="Notification Emails"
            subtitle="Emails for ongoing operational events"
            icon={Mail}
            iconColor="text-blue-500"
          >
            <ToggleRow
              disabled={!settings.enableEmailService}
              label="Complaint Update Emails"
              desc="Alert users when their complaint status changes or a comment is added."
              value={settings.enableComplaintEmails}
              onChange={(v) => set("enableComplaintEmails", v)}
            />
            <ToggleRow
              disabled={!settings.enableEmailService}
              label="Notice Broadcast Emails"
              desc="Email residents and staff when a new notice is published."
              value={settings.enableNoticeEmails}
              onChange={(v) => set("enableNoticeEmails", v)}
            />
          </SectionCard>

          <button
            onClick={saveSettings}
            disabled={isSaving}
            className="h-11 px-8 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> Save Email Config
              </>
            )}
          </button>
        </div>
      )}

      {/* ── TAB 3: Role Permissions ──────────────────────────────────────── */}
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
                    : "text-gray-500 dark:text-muted-foreground border-transparent hover:bg-gray-50 dark:hover:bg-muted/5 dark:bg-muted/10"
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
                className="h-10 px-6 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" /> Save {selectedRole} Perms
                  </>
                )}
              </button>
            </div>

            {/* Special Notice for Admin Bypass */}
            {selectedRole === "ADMIN" && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-900">
                    Administrator Root Access
                  </p>
                  <p className="text-xs text-blue-700/80 mt-1 leading-relaxed">
                    The **ADMIN** role is the primary management account. It
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
                      DEFAULT_ROLE_PERMISSIONS[selectedRole]?.hasOwnProperty(
                        p.key,
                      ),
                    );

              return (
                <div
                  key={group.group}
                  className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border shadow-sm overflow-hidden"
                >
                  <div className="px-6 py-4 border-b border-gray-50 bg-gray-50 dark:bg-background">
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
