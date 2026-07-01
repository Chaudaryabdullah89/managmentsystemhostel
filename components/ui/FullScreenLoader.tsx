"use client";

import React from "react";
import { ShieldX, Clock, Loader2, ShieldAlert, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type FullScreenLoaderVariant =
  | "default"
  | "error"
  | "warning"
  | "success";

interface FullScreenLoaderProps {
  /** Primary headline shown below the icon */
  title?: string;
  /** Secondary line below the title */
  subtitle?: string;
  /** Controls icon + accent color */
  variant?: FullScreenLoaderVariant;
  /** Optional animated progress bar at bottom (0–100) */
  progress?: number;
  /** Extra className for the outer wrapper */
  className?: string;
}

const variantConfig: Record<
  FullScreenLoaderVariant,
  { Icon: React.ElementType; ring: string; iconBg: string; iconColor: string; dot: string }
> = {
  default: {
    Icon: Loader2,
    ring: "from-indigo-500 via-violet-500 to-indigo-500",
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    dot: "bg-indigo-500",
  },
  error: {
    Icon: ShieldX,
    ring: "from-rose-500 via-red-500 to-rose-500",
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
    dot: "bg-rose-500",
  },
  warning: {
    Icon: Clock,
    ring: "from-amber-400 via-orange-400 to-amber-400",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    dot: "bg-amber-500",
  },
  success: {
    Icon: CheckCircle2,
    ring: "from-emerald-400 via-green-500 to-emerald-400",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    dot: "bg-emerald-500",
  },
};

export function FullScreenLoader({
  title = "Loading",
  subtitle = "Please wait a moment...",
  variant = "default",
  progress,
  className,
}: FullScreenLoaderProps) {
  const { Icon, ring, iconBg, iconColor, dot } = variantConfig[variant];
  const isSpinning = variant === "default";

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center",
        "bg-gray-950/70 backdrop-blur-md",
        "animate-in fade-in duration-300",
        className
      )}
    >
      <div
        className="relative flex flex-col items-center gap-6 rounded-[2rem] bg-white/95 dark:bg-card/95 
                   shadow-2xl border border-white/60 dark:border-border/40 
                   px-10 py-10 max-w-sm w-full mx-4
                   animate-in zoom-in-95 fade-in duration-300"
      >
        {/* Animated gradient ring + icon */}
        <div className="relative flex items-center justify-center">
          {/* Outer spinning gradient ring */}
          <div
            className={cn(
              "absolute h-24 w-24 rounded-full bg-gradient-to-r animate-spin",
              ring
            )}
            style={{ animationDuration: "1.2s" }}
          />
          {/* White mask inner */}
          <div className="absolute h-20 w-20 rounded-full bg-white dark:bg-card" />
          {/* Icon */}
          <div
            className={cn(
              "relative z-10 h-16 w-16 rounded-full flex items-center justify-center",
              iconBg
            )}
          >
            <Icon
              className={cn(
                "h-7 w-7",
                iconColor,
                isSpinning && "animate-spin"
              )}
              style={isSpinning ? { animationDuration: "1.5s" } : undefined}
            />
          </div>
        </div>

        {/* Text */}
        <div className="text-center space-y-1.5">
          <p className="text-base font-black text-gray-900 dark:text-foreground tracking-tight uppercase">
            {title}
          </p>
          {subtitle && (
            <p className="text-xs font-medium text-gray-400 dark:text-muted-foreground leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Progress bar (if provided) */}
        {progress !== undefined && (
          <div className="w-full h-1 bg-gray-100 dark:bg-muted/20 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-150 bg-gradient-to-r",
                ring
              )}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}

        {/* Pulsing dots indicator */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={cn("h-1.5 w-1.5 rounded-full animate-bounce", dot)}
              style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default FullScreenLoader;
