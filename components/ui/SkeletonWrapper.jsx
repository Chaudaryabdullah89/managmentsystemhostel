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
            >
                <div className={`${transitionClass} ${visibilityClass}`}>{children}</div>
            </BoneyardSkeleton>
        </div>
    );
};

export default React.memo(SkeletonWrapper);
