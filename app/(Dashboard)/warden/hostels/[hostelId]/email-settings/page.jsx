"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  Settings,
  Mail,
  CheckCircle2,
  XCircle,
  Building2,
  Send,
  ChevronLeft,
  Wrench,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HostelEmailSettingsPage() {
  const { hostelId } = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hostelName, setHostelName] = useState("");

  const [smtpSettings, setSmtpSettings] = useState({
    smtpHost: "",
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: "",
    smtpPass: "",
    smtpSender: "",
  });

  // SMTP Test State
  const [testEmail, setTestEmail] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    fetchData();
  }, [hostelId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch hostel general details to show name
      const hostelRes = await fetch(`/api/hostels/${hostelId}`);
      if (hostelRes.ok) {
        const d = await hostelRes.json();
        if (d.success && d.data) {
          setHostelName(d.data.name);
        }
      }

      // 2. Fetch hostel specific SMTP settings
      const settingsRes = await fetch(`/api/hostels/${hostelId}/email-settings`);
      if (settingsRes.ok) {
        const d = await settingsRes.json();
        if (d.success && d.emailSettings) {
          setSmtpSettings({
            smtpHost: d.emailSettings.smtpHost || "",
            smtpPort: d.emailSettings.smtpPort || 587,
            smtpSecure: !!d.emailSettings.smtpSecure,
            smtpUser: d.emailSettings.smtpUser || "",
            smtpPass: d.emailSettings.smtpPass || "",
            smtpSender: d.emailSettings.smtpSender || "",
          });
        }
      }
    } catch {
      toast.error("Failed to load hostel configuration");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`/api/hostels/${hostelId}/email-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(smtpSettings),
      });
      const d = await res.json();
      if (res.ok && d.success) {
        toast.success("Hostel email settings saved successfully");
      } else {
        toast.error(d.message || "Failed to save settings");
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
      const res = await fetch(`/api/hostels/${hostelId}/email-settings/test`, {
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

  const set = (key, val) => setSmtpSettings((prev) => ({ ...prev, [key]: val }));

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading settings deck...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 pb-24">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-8 text-white shadow-xl border border-indigo-500/10">
        <div className="absolute -top-32 -right-32 h-72 w-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <button
            onClick={() => router.push(`/warden/hostels/${hostelId}`)}
            className="flex items-center gap-1.5 text-xs text-indigo-300 font-bold hover:text-indigo-100 transition-colors mb-4"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back to Hostel Deck
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold tracking-wider uppercase mb-3">
            <Building2 className="h-3.5 w-3.5 text-indigo-400" />
            <span>{hostelName || "Hostel Node"}</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight">
            Warden SMTP Configurator
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Configure a dedicated outgoing mail server for this hostel. All transaction receipts, notices, and complaints generated from this hostel will use these credentials.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Inputs Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-50 dark:border-border/30">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Wrench className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-foreground">
                    Mail server connection
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-muted-foreground mt-0.5">
                    Credentials for SMTP relay authentication
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest pl-1">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    required
                    value={smtpSettings.smtpHost}
                    onChange={(e) => set("smtpHost", e.target.value)}
                    className="mt-1.5 w-full h-10 px-3 text-xs md:text-sm rounded-xl border border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/20 text-gray-800 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-card transition-all"
                    placeholder="e.g. smtp.gmail.com"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest pl-1">
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    required
                    value={smtpSettings.smtpPort || ""}
                    onChange={(e) => set("smtpPort", e.target.value ? parseInt(e.target.value) : "")}
                    className="mt-1.5 w-full h-10 px-3 text-xs md:text-sm rounded-xl border border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/20 text-gray-800 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-card transition-all"
                    placeholder="e.g. 587"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest pl-1">
                    SMTP Username
                  </label>
                  <input
                    type="text"
                    required
                    value={smtpSettings.smtpUser}
                    onChange={(e) => set("smtpUser", e.target.value)}
                    className="mt-1.5 w-full h-10 px-3 text-xs md:text-sm rounded-xl border border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/20 text-gray-800 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-card transition-all"
                    placeholder="e.g. hostel.warden@gmail.com"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest pl-1">
                    SMTP Password
                  </label>
                  <input
                    type="password"
                    required
                    value={smtpSettings.smtpPass}
                    onChange={(e) => set("smtpPass", e.target.value)}
                    className="mt-1.5 w-full h-10 px-3 text-xs md:text-sm rounded-xl border border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/20 text-gray-800 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-card transition-all"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest pl-1">
                    Sender Email
                  </label>
                  <input
                    type="email"
                    value={smtpSettings.smtpSender}
                    onChange={(e) => set("smtpSender", e.target.value)}
                    className="mt-1.5 w-full h-10 px-3 text-xs md:text-sm rounded-xl border border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/20 text-gray-800 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-card transition-all"
                    placeholder="e.g. no-reply@hms.com"
                  />
                </div>
                <div className="flex items-center justify-between pt-5">
                  <span className="text-xs text-gray-500 dark:text-muted-foreground font-semibold">SSL/TLS Connection</span>
                  <button
                    type="button"
                    onClick={() => set("smtpSecure", !smtpSettings.smtpSecure)}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                      smtpSettings.smtpSecure ? "bg-indigo-600" : "bg-gray-200 dark:bg-muted"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white dark:bg-card rounded-full shadow transition-transform duration-200 ${
                        smtpSettings.smtpSecure ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="h-11 px-8 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 active:scale-[0.97] transition-all flex items-center gap-2 disabled:opacity-60 shadow-sm shadow-indigo-600/20"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Save Host Settings
                </>
              )}
            </button>
          </form>
        </div>

        {/* Diagnostic Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-3 pb-2">
              <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <Send className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-foreground">
                  Connection test
                </h3>
                <p className="text-[10px] text-gray-400 dark:text-muted-foreground">
                  Send diagnostic test email
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter test recipient email..."
                className="w-full h-10 px-3 text-xs rounded-xl border border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/20 text-gray-800 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-card transition-all"
              />
              <button
                onClick={handleTestEmail}
                disabled={isTesting}
                className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.97] text-xs"
              >
                {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {isTesting ? "Diagnosing SMTP..." : "Trigger Test Send"}
              </button>
            </div>

            {testResult && (
              <div className={`flex items-start gap-2 p-3 rounded-xl border transition-all ${
                testResult.ok
                  ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                  : "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800"
              }`}>
                {testResult.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                )}
                <p className={`text-[10px] font-semibold ${testResult.ok ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>
                  {testResult.msg}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
