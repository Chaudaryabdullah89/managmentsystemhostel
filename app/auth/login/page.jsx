"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Building2,
  ArrowRight,
  AlertCircle,
  Fingerprint,
  KeyRound,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import useAuthStore from "@/hooks/Authstate";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [branding, setBranding] = useState({ companyName: "Hostel Management", companyShortName: "HMS" });

  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState("TOTP");
  const [tempToken, setTempToken] = useState("");
  const [otp, setOtp] = useState("");
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  // True when the top-level "Sign in with Passkey" button is running
  const [passkeyDirectLoading, setPasskeyDirectLoading] = useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("reason") === "expired") {
      setError("Your session has expired or was terminated. Please login again.");
    }

    fetch("/api/settings/public")
      .then(res => res.json())
      .then(data => {
        if (data.success && (data.data || data.settings || data.companyName)) {
          setBranding(data.data || data.settings || data);
        }
      })
      .catch((err) => console.error("Branding fetch error:", err));
  }, []);

  const handleRedirect = (data) => {
    if (data.User) {
      setUser({ ...data.User, id: data.User.id });
    }
    toast.success("Welcome back!");
    const role = data.User?.role;
    let redirectPath = "/admin/dashboard";
    if (role === "WARDEN") redirectPath = "/warden";
    else if (role === "STAFF") redirectPath = "/staff/dashboard";
    else if (role === "RESIDENT" || role === "GUEST") redirectPath = "/guest/dashboard";
    setTimeout(() => router.push(redirectPath), 400);
  };

  // ── Passwordless passkey login (no password needed) ────────────────────────
  const handleDirectPasskeyLogin = async () => {
    setPasskeyDirectLoading(true);
    setError("");
    try {
      // 1. Get challenge — pass email if filled in to narrow credentials
      const optRes = await fetch("/api/auth/passkey/login-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email || undefined }),
      });
      const optData = await optRes.json();
      if (!optRes.ok) throw new Error(optData.message || "Could not start passkey login.");

      // 2. Prompt browser passkey UI
      const { startAuthentication } = await import("@simplewebauthn/browser");
      const credential = await startAuthentication({ optionsJSON: optData.options });

      // 3. Verify on server and get session
      const verRes = await fetch("/api/auth/passkey/login-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential, challengeKey: optData.challengeKey }),
        credentials: "include",
      });
      const verData = await verRes.json();
      if (!verRes.ok) throw new Error(verData.message || "Passkey verification failed.");

      handleRedirect(verData);
    } catch (err) {
      if (err.name === "NotAllowedError") {
        setError("Passkey prompt was cancelled or timed out.");
      } else {
        setError(err.message || "Passkey sign-in failed. Try your password instead.");
      }
    } finally {
      setPasskeyDirectLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.message || "Invalid email or password.");
        return;
      }

      if (data.requires2FA) {
        setTempToken(data.tempToken);
        setTwoFactorMethod(data.twoFactorMethod || "TOTP");
        setRequires2FA(true);
        setError("");
        setIsLoading(false);

        // Auto-send email OTP if method is EMAIL
        if (data.twoFactorMethod === "EMAIL") {
          sendEmailOTP(data.tempToken);
        }
        return;
      }

      handleRedirect(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const sendEmailOTP = async (token) => {
    setEmailSending(true);
    try {
      const res = await fetch("/api/auth/2fa/send-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempToken: token || tempToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Verification code sent to your email");
    } catch (err) {
      toast.error(err.message || "Failed to send email code");
    } finally {
      setEmailSending(false);
    }
  };


  const handle2FASubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setError("Please enter a valid code.");
      return;
    }
    setError("");
    setVerifying2FA(true);
    try {
      const method = useBackupCode ? "BACKUP_CODES" : twoFactorMethod;
      const response = await fetch("/api/auth/2fa/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempToken, otp, method }),
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.message || "Invalid verification code.");
        return;
      }
      handleRedirect(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setVerifying2FA(false);
    }
  };

  const handleBackToLogin = () => {
    setRequires2FA(false);
    setTempToken("");
    setOtp("");
    setError("");
    setUseBackupCode(false);
    setTwoFactorMethod("TOTP");
  };

  const getMethodTitle = () => {
    if (useBackupCode) return "Use Backup Code";
    switch (twoFactorMethod) {
      case "TOTP": return "Authenticator App";
      case "EMAIL": return "Email Verification";
      case "BACKUP_CODES": return "Backup Code";
      default: return "2-Step Verification";
    }
  };

  const getMethodDescription = () => {
    if (useBackupCode) return "Enter one of your 8-character backup codes";
    switch (twoFactorMethod) {
      case "TOTP": return "Enter the 6-digit code from your authenticator app";
      case "EMAIL": return "Enter the 6-digit code sent to your email";
      case "BACKUP_CODES": return "Enter one of your backup codes";
      default: return "Enter your verification code";
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-background font-sans antialiased text-slate-900 dark:text-foreground relative overflow-hidden">
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] opacity-40 pointer-events-none" />

      {/* LEFT SIDE — Structured Visual */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center overflow-hidden">
        {/* Soft lighting */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 blur-3xl rounded-full" />

        {/* Floating Glass Panels */}
        <div className="relative w-[420px] h-[420px]">
          <div className="absolute top-0 left-0 w-64 h-40 bg-white/70 dark:bg-card/40 backdrop-blur-xl border border-slate-200 dark:border-border rounded-2xl shadow-xl" />
          <div className="absolute bottom-10 right-0 w-72 h-44 bg-white/70 dark:bg-card/40 backdrop-blur-xl border border-slate-200 dark:border-border rounded-2xl shadow-xl" />
          <div className="absolute top-32 left-24 w-80 h-52 bg-slate-900 dark:bg-card rounded-3xl shadow-2xl flex items-center justify-center">
            <Building2 className="h-10 w-10 text-white opacity-90" />
          </div>
        </div>
      </div>

      {/* RIGHT SIDE — LOGIN */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 lg:p-16 relative z-10">
        <div className="w-full max-w-md bg-white dark:bg-card border border-slate-200 dark:border-border rounded-3xl p-10 shadow-[0_30px_80px_rgba(0,0,0,0.04)]">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-slate-950 dark:bg-white rounded-2xl flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white dark:text-slate-950" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                {branding.companyShortName} Portal
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-400">
                {branding.companyName}
              </p>
            </div>
          </div>

          {requires2FA ? (
            <div>
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{getMethodTitle()}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {getMethodDescription()}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex items-start gap-3 animate-in fade-in">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-900 dark:text-red-200">{error}</p>
                </div>
              )}


                <form onSubmit={handle2FASubmit} className="space-y-5">
                  {/* Email OTP header */}
                  {twoFactorMethod === "EMAIL" && !useBackupCode && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 text-center">
                      <Mail className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Code sent to your email</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Check your inbox for the verification code</p>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {useBackupCode ? "Backup Code" : "Verification Code"}
                    </label>
                    <div className="relative mt-2">
                      {useBackupCode ? (
                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      ) : (
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      )}
                      <input
                        type="text"
                        placeholder={useBackupCode ? "8-character code" : "000000"}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        maxLength={useBackupCode ? 8 : 6}
                        className="w-full h-12 pl-12 pr-4 rounded-xl bg-slate-50 dark:bg-muted/30 border border-slate-200 dark:border-border text-lg font-bold text-center tracking-[0.4em] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:tracking-normal placeholder:font-normal"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={verifying2FA}
                    className="w-full h-12 mt-4 rounded-xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {verifying2FA ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Verify &amp; Sign In <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  {/* Resend Email OTP */}
                  {twoFactorMethod === "EMAIL" && !useBackupCode && (
                    <button
                      type="button"
                      onClick={() => sendEmailOTP()}
                      disabled={emailSending}
                      className="w-full text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-center font-medium flex items-center justify-center gap-1"
                    >
                      <RefreshCw className={`h-3 w-3 ${emailSending ? "animate-spin" : ""}`} />
                      {emailSending ? "Sending..." : "Resend Code"}
                    </button>
                  )}
                </form>

              {/* Toggle Backup Code / Back */}
              <div className="mt-4 space-y-2">
                {!useBackupCode && twoFactorMethod !== "BACKUP_CODES" && (
                  <button
                    type="button"
                    onClick={() => { setUseBackupCode(true); setOtp(""); setError(""); }}
                    className="w-full text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 text-center font-medium flex items-center justify-center gap-1"
                  >
                    <KeyRound className="h-3 w-3" /> Use a backup code instead
                  </button>
                )}
                {useBackupCode && (
                  <button
                    type="button"
                    onClick={() => { setUseBackupCode(false); setOtp(""); setError(""); }}
                    className="w-full text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 text-center font-medium"
                  >
                    ← Back to {twoFactorMethod === "TOTP" ? "authenticator" : twoFactorMethod === "EMAIL" ? "email" : "passkey"} verification
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="w-full text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 text-center font-medium block"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Sign In</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Enter your credentials to continue
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex items-start gap-3 animate-in fade-in">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-900 dark:text-red-200">{error}</p>
                </div>
              )}

              {/* ── PASSKEY SIGN-IN BUTTON (prominent, above the form) ── */}
              <button
                type="button"
                id="passkey-login-btn"
                onClick={handleDirectPasskeyLogin}
                disabled={passkeyDirectLoading}
                className="w-full h-12 mb-6 rounded-xl border border-violet-200 dark:border-violet-900/50 bg-gradient-to-r from-violet-50/50 via-white/50 to-indigo-50/50 dark:from-violet-950/20 dark:via-card/50 dark:to-indigo-950/20 hover:from-violet-100/60 hover:via-white/60 hover:to-indigo-100/60 dark:hover:from-violet-950/30 dark:hover:via-card/60 dark:hover:to-indigo-950/30 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 text-sm font-semibold text-violet-700 dark:text-violet-300 shadow-sm hover:shadow-[0_4px_20px_rgba(124,58,237,0.08)] cursor-pointer group"
              >
                {passkeyDirectLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-violet-500 dark:text-violet-400" />
                ) : (
                  <>
                    <Fingerprint className="h-5 w-5 text-violet-600 dark:text-violet-400 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300" />
                    <span>Sign in with Passkey</span>
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-slate-200 dark:bg-border" />
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">or sign in with password</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-border" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="you@gmail.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, email: e.target.value }))
                      }
                      className="w-full h-12 pl-12 pr-4 rounded-xl bg-slate-50 dark:bg-muted/30 border border-slate-200 dark:border-border text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Password
                    </label>
                    <Link
                      href="/auth/forgot-password"
                      className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <div className="relative mt-2">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, password: e.target.value }))
                      }
                      className="w-full h-12 pl-12 pr-12 rounded-xl bg-slate-50 dark:bg-muted/30 border border-slate-200 dark:border-border text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 mt-4 rounded-xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Authenticate <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
