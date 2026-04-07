"use client";

import { useEffect, useRef, useState } from "react";

export default function useSkeletonLoader({
    isLoading,
    showDelayMs = 180,
    fadeDurationMs = 220,
} = {}) {
    const containerRef = useRef(null);
    const delayTimerRef = useRef(null);
    const fadeTimerRef = useRef(null);

    const [isClient, setIsClient] = useState(false);
    const [isSkeletonActive, setIsSkeletonActive] = useState(false);
    const [isContentVisible, setIsContentVisible] = useState(!isLoading);

    useEffect(() => {
        setIsClient(typeof window !== "undefined");
    }, []);

    useEffect(() => {
        if (!isClient) return undefined;

        clearTimeout(delayTimerRef.current);
        clearTimeout(fadeTimerRef.current);

        if (isLoading) {
            setIsContentVisible(false);
            delayTimerRef.current = setTimeout(() => {
                if (containerRef.current) {
                    setIsSkeletonActive(true);
                }
            }, showDelayMs);
            return undefined;
        }

        setIsSkeletonActive(false);
        fadeTimerRef.current = setTimeout(() => {
            setIsContentVisible(true);
        }, fadeDurationMs);

        return undefined;
    }, [isClient, isLoading, showDelayMs, fadeDurationMs]);

    useEffect(() => () => {
        clearTimeout(delayTimerRef.current);
        clearTimeout(fadeTimerRef.current);
    }, []);

    return {
        containerRef,
        isClient,
        isSkeletonActive,
        isContentVisible,
    };
}
