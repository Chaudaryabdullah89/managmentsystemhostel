"use client";

import React from "react";
import dynamic from "next/dynamic";
import useSkeletonLoader from "@/hooks/useSkeletonLoader";
import { getBoneyardProps } from "@/lib/skeleton/bonyardClient";

const BoneyardSkeleton = dynamic(
    () => import("boneyard-js/react").then((mod) => mod.Skeleton),
    { ssr: false }
);

const SkeletonWrapper = ({
    name,
    isLoading,
    delayMs = 180,
    fadeMs = 220,
    className = "",
    snapshotConfig,
    fallback,
    onReady,
    children,
}) => {
    const { containerRef, isClient, isSkeletonActive, isContentVisible } = useSkeletonLoader({
        isLoading,
        showDelayMs: delayMs,
        fadeDurationMs: fadeMs,
    });

    React.useEffect(() => {
        if (!isLoading && isContentVisible && typeof onReady === "function") {
            onReady();
        }
    }, [isLoading, isContentVisible, onReady]);

    const visibilityClass = isLoading && !isContentVisible
        ? "opacity-0 pointer-events-none select-none"
        : "opacity-100";

    const transitionClass = "transition-opacity duration-200 ease-out";
    const defaultFallback = (
        <div className="space-y-4 animate-pulse">
            <div className="h-10 w-1/3 rounded-xl bg-slate-200/70 dark:bg-muted/30" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-28 rounded-2xl bg-slate-200/70 dark:bg-muted/30" />
                ))}
            </div>
            <div className="h-72 rounded-3xl bg-slate-200/60 dark:bg-muted/10" />
            <div className="h-56 rounded-3xl bg-slate-200/60 dark:bg-muted/10" />
        </div>
    );

    if (!isClient) {
        return (
            <div ref={containerRef} className={className}>
                <div className={`${transitionClass} ${visibilityClass}`}>{children}</div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className={className}>
            <BoneyardSkeleton
                {...getBoneyardProps({
                    name,
                    loading: isSkeletonActive,
                    animate: "shimmer",
                    snapshotConfig,
                })}
                fallback={fallback || defaultFallback}
            >
                <div className={`${transitionClass} ${visibilityClass}`}>{children}</div>
            </BoneyardSkeleton>
        </div>
    );
};

export default React.memo(SkeletonWrapper);
