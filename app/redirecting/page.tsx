"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldX, Clock, Loader2, Home } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Config ──────────────────────────────────────────────────────────────────

const COUNTDOWN_MS = 1800;

type ReasonKey = "access-denied" | "expired" | "no-session" | string;

interface ReasonConfig {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  ringFrom: string;
  ringTo: string;
  barColor: string;
  title: string;
  subtitle: (from: string | null, to: string | null) => string;
}

const reasons: Record<string, ReasonConfig> = {
  "access-denied": {
    icon: ShieldX,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
    ringFrom: "from-rose-500",
    ringTo: "to-rose-400",
    barColor: "bg-rose-500",
    title: "Access Denied",
    subtitle: (_from, _to) =>
      "You don't have permission to view that page. Redirecting you to your dashboard…",
  },
  expired: {
    icon: Clock,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    ringFrom: "from-amber-400",
    ringTo: "to-orange-400",
    barColor: "bg-amber-500",
    title: "Session Expired",
    subtitle: (_from, _to) =>
      "Your session has ended. Redirecting you to login…",
  },
  "no-session": {
    icon: Clock,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    ringFrom: "from-indigo-500",
    ringTo: "to-violet-500",
    barColor: "bg-indigo-500",
    title: "Login Required",
    subtitle: (_from, _to) =>
      "Please log in to continue. Redirecting you now…",
  },
};

const defaultReason: ReasonConfig = {
  icon: Loader2,
  iconBg: "bg-indigo-50",
  iconColor: "text-indigo-600",
  ringFrom: "from-indigo-500",
  ringTo: "to-violet-500",
  barColor: "bg-indigo-500",
  title: "Redirecting",
  subtitle: (_from, to) => `Taking you to ${to ?? "your dashboard"}…`,
};

// ─── Inner component (uses useSearchParams — must be inside Suspense) ─────────

function RedirectingContent() {
  const router = useRouter();
  const params = useSearchParams();

  const to = params.get("to") || "/auth/login";
  const reason = (params.get("reason") || "default") as ReasonKey;
  const from = params.get("from");

  const cfg = reasons[reason] || defaultReason;
  const Icon = cfg.icon;
  const isSpinIcon = reason === "default";

  const [progress, setProgress] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(
    Math.ceil(COUNTDOWN_MS / 1000)
  );
  const startTime = useRef(Date.now());
  const frameRef = useRef<number | null>(null);
  const redirected = useRef(false);

  useEffect(() => {
    const tick = () => {
      const elapsed = Date.now() - startTime.current;
      const pct = Math.min(100, (elapsed / COUNTDOWN_MS) * 100);
      const sLeft = Math.max(0, Math.ceil((COUNTDOWN_MS - elapsed) / 1000));

      setProgress(pct);
      setSecondsLeft(sLeft);

      if (elapsed >= COUNTDOWN_MS) {
        if (!redirected.current) {
          redirected.current = true;
          router.replace(to);
        }
        return;
      }
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [router, to]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div
        className="relative flex flex-col items-center gap-7 rounded-[2.5rem] bg-white dark:bg-card
                   shadow-2xl border border-white/60 dark:border-border/40 
                   px-10 py-12 max-w-sm w-full mx-4
                   animate-in zoom-in-95 fade-in duration-300"
      >
        {/* Spinning gradient ring */}
        <div className="relative flex items-center justify-center">
          <div
            className={cn(
              "absolute h-24 w-24 rounded-full bg-gradient-to-r animate-spin",
              cfg.ringFrom,
              cfg.ringTo
            )}
            style={{ animationDuration: "1.4s" }}
          />
          <div className="absolute h-20 w-20 rounded-full bg-white dark:bg-card" />
          <div
            className={cn(
              "relative z-10 h-16 w-16 rounded-full flex items-center justify-center",
              cfg.iconBg
            )}
          >
            <Icon
              className={cn(
                "h-7 w-7",
                cfg.iconColor,
                isSpinIcon && "animate-spin"
              )}
            />
          </div>
        </div>

        {/* Text */}
        <div className="text-center space-y-2 px-2">
          <p className="text-lg font-black uppercase tracking-tight text-gray-900 dark:text-foreground">
            {cfg.title}
          </p>
          <p className="text-sm text-gray-500 dark:text-muted-foreground leading-relaxed">
            {cfg.subtitle(from, to)}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full space-y-2">
          <div className="w-full h-1.5 bg-gray-100 dark:bg-muted/20 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-none", cfg.barColor)}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">
            Redirecting in {secondsLeft}s
          </p>
        </div>

        {/* Source info (if from path present and reason is access-denied) */}
        {from && reason === "access-denied" && (
          <div className="w-full px-4 py-2.5 bg-gray-50 dark:bg-muted/10 rounded-xl border border-gray-100 dark:border-border/50 flex items-center gap-2">
            <Home className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-wider truncate">
              Tried to access:{" "}
              <span className="text-gray-600 dark:text-foreground">{from}</span>
            </p>
          </div>
        )}

        {/* Animated dots */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 w-1.5 rounded-full animate-bounce",
                cfg.barColor
              )}
              style={{
                animationDelay: `${i * 0.15}s`,
                animationDuration: "0.8s",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page export (wraps inner component in Suspense as required by Next.js) ───

export default function RedirectingPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-950/80 backdrop-blur-md">
          <div className="h-16 w-16 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <RedirectingContent />
    </Suspense>
  );
}
