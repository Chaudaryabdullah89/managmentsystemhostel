"use client";

import React from "react";
import { cn } from "@/lib/utils";

// ─── Base Shimmer Block ────────────────────────────────────────
export const Bone = ({ className, style }) => (
    <div
        className={cn(
            "rounded-xl bg-gradient-to-r from-gray-100 via-gray-200/70 to-gray-100 dark:from-muted/20 dark:via-muted/40 dark:to-muted/20 bg-[length:200%_100%] animate-[shimmer_1.8s_ease-in-out_infinite]",
            className
        )}
        style={style}
    />
);

// ─── Shared Pieces ─────────────────────────────────────────────

/** Mimics the sticky PageHeader bar */
const HeaderSkeleton = ({ accentColor = "bg-indigo-600" }) => (
    <div className="bg-white dark:bg-card border-b border-gray-100 dark:border-border sticky top-0 z-40 py-2 md:h-16">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-full flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className={`h-8 w-1 ${accentColor} rounded-full`} />
                <div className="flex flex-col gap-1.5">
                    <Bone className="h-4 w-28 rounded-lg" />
                    <Bone className="h-2.5 w-16 rounded-md" />
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Bone className="h-9 w-20 rounded-xl hidden sm:block" />
                <Bone className="h-9 w-24 rounded-xl" />
            </div>
        </div>
    </div>
);

/** 4-column stat cards grid */
const StatCardsSkeleton = ({ count = 4 }) => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {Array.from({ length: count }).map((_, i) => (
            <div
                key={i}
                className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-4 md:p-5 flex items-center gap-3 md:gap-4 shadow-sm"
            >
                <Bone className="h-10 w-10 md:h-11 md:w-11 rounded-xl shrink-0" />
                <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                    <Bone className="h-2.5 w-14 rounded-md" />
                    <Bone className="h-5 w-20 rounded-lg" />
                </div>
            </div>
        ))}
    </div>
);

/** Search + filter toolbar */
const FilterBarSkeleton = () => (
    <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-2 flex flex-col md:flex-row items-center gap-2 md:gap-4 shadow-sm">
        <div className="flex-1 w-full px-2">
            <Bone className="h-11 md:h-12 w-full rounded-xl" />
        </div>
        <div className="h-8 w-px bg-gray-100 dark:bg-border/50 mx-2 hidden md:block" />
        <div className="flex items-center gap-1.5 p-1 bg-gray-50 dark:bg-muted/10 rounded-xl w-full md:w-auto">
            <Bone className="h-9 w-20 rounded-lg" />
            <Bone className="h-9 w-20 rounded-lg" />
            <Bone className="h-9 w-20 rounded-lg" />
        </div>
    </div>
);

/** Complaint / list-item card */
const ListCardSkeleton = ({ count = 5 }) => (
    <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
            <div
                key={i}
                className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-4 md:p-5 flex flex-col lg:flex-row items-center justify-between gap-4 md:gap-6 relative overflow-hidden"
                style={{ animationDelay: `${i * 80}ms` }}
            >
                <Bone className="absolute top-0 left-0 w-1.5 h-full rounded-none" />
                <div className="flex items-center gap-4 md:gap-5 flex-1 min-w-0 w-full lg:w-auto pl-3">
                    <Bone className="h-11 w-11 md:h-14 md:w-14 rounded-xl shrink-0" />
                    <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                        <Bone className="h-4 w-40 rounded-lg" />
                        <Bone className="h-2.5 w-24 rounded-md" />
                    </div>
                </div>
                <div className="flex items-center gap-4 w-full lg:w-auto justify-end">
                    <Bone className="h-7 w-20 rounded-full hidden md:block" />
                    <Bone className="h-7 w-16 rounded-full hidden xl:block" />
                    <Bone className="h-9 w-24 rounded-xl" />
                </div>
            </div>
        ))}
    </div>
);

/** Grid of cards (for bookings, rooms, salaries etc.) */
const GridCardSkeleton = ({ count = 6, cols = "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" }) => (
    <div className={`grid ${cols} gap-4 md:gap-5`}>
        {Array.from({ length: count }).map((_, i) => (
            <div
                key={i}
                className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-3xl overflow-hidden shadow-sm"
                style={{ animationDelay: `${i * 100}ms` }}
            >
                <div className="p-5 md:p-6 border-b border-gray-50 dark:border-border/50 flex items-center gap-3">
                    <Bone className="h-12 w-12 rounded-2xl shrink-0" />
                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                        <Bone className="h-4 w-32 rounded-lg" />
                        <Bone className="h-2.5 w-20 rounded-md" />
                    </div>
                    <Bone className="h-6 w-16 rounded-full shrink-0" />
                </div>
                <div className="px-5 md:px-6 py-4 grid grid-cols-3 gap-3">
                    {Array.from({ length: 3 }).map((_, j) => (
                        <div key={j} className="flex flex-col items-center gap-1">
                            <Bone className="h-2 w-10 rounded-sm" />
                            <Bone className="h-4 w-14 rounded-md" />
                        </div>
                    ))}
                </div>
                <div className="px-5 md:px-6 pb-5 flex items-center gap-2">
                    <Bone className="h-9 flex-1 rounded-xl" />
                    <Bone className="h-9 w-9 rounded-xl shrink-0" />
                </div>
            </div>
        ))}
    </div>
);

/** Category cards (5-column, for expenses) */
const CategoryCardSkeleton = ({ count = 5 }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
        {Array.from({ length: count }).map((_, i) => (
            <div
                key={i}
                className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-[2rem] p-5 flex flex-col gap-4 shadow-sm"
            >
                <Bone className="h-10 w-10 md:h-11 md:w-11 rounded-xl" />
                <div className="flex flex-col gap-1.5">
                    <Bone className="h-3.5 w-20 rounded-md" />
                    <Bone className="h-2 w-full rounded-sm" />
                </div>
                <div className="flex flex-col gap-2 pt-2 border-t border-gray-50 dark:border-border/50">
                    <div className="flex items-center justify-between">
                        <Bone className="h-2 w-10 rounded-sm" />
                        <Bone className="h-3 w-16 rounded-md" />
                    </div>
                    <div className="flex items-center justify-between">
                        <Bone className="h-2 w-14 rounded-sm" />
                        <Bone className="h-5 w-8 rounded-full" />
                    </div>
                </div>
                <Bone className="h-3 w-16 rounded-md" />
            </div>
        ))}
    </div>
);

/** Dashboard charts area */
const ChartsSkeleton = () => (
    <div className="space-y-4">
        <div className="flex items-center gap-3 px-1">
            <Bone className="h-5 w-1 rounded-full" />
            <Bone className="h-4 w-20 rounded-md" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white dark:bg-card border border-gray-100 dark:border-border rounded-3xl p-5 md:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col gap-1">
                        <Bone className="h-2.5 w-24 rounded-sm" />
                        <Bone className="h-4 w-14 rounded-md" />
                    </div>
                    <div className="flex items-center gap-3">
                        <Bone className="h-3 w-16 rounded-sm" />
                        <Bone className="h-3 w-16 rounded-sm" />
                    </div>
                </div>
                <Bone className="h-56 w-full rounded-2xl" />
            </div>
            <div className="space-y-4">
                <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-3xl p-5 shadow-sm">
                    <Bone className="h-2.5 w-16 rounded-sm mb-3" />
                    <Bone className="h-32 w-full rounded-2xl" />
                </div>
                <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-3xl p-5 shadow-sm">
                    <Bone className="h-2.5 w-20 rounded-sm mb-3" />
                    <Bone className="h-24 w-full rounded-2xl" />
                </div>
            </div>
        </div>
    </div>
);

/** Table skeleton */
const TableSkeleton = ({ rows = 5, cols = 5 }) => (
    <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="bg-gray-50/50 dark:bg-muted/10 px-6 py-4 flex items-center gap-6">
            {Array.from({ length: cols }).map((_, i) => (
                <Bone key={i} className="h-2.5 w-16 rounded-sm flex-1" />
            ))}
        </div>
        <div className="divide-y divide-gray-50">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-6" style={{ animationDelay: `${i * 60}ms` }}>
                    {Array.from({ length: cols }).map((_, j) => (
                        <Bone key={j} className="h-3.5 w-full rounded-md flex-1" />
                    ))}
                </div>
            ))}
        </div>
    </div>
);

/** Bottom status banner */
const BannerSkeleton = () => (
    <div className="pt-4 px-2 md:px-0">
        <div className="bg-gray-200/60 dark:bg-muted/10 rounded-[2rem] p-5 md:p-4 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm animate-pulse">
            <div className="flex items-center gap-4">
                <Bone className="h-10 w-10 rounded-xl" />
                <div className="flex flex-col gap-1.5">
                    <Bone className="h-2.5 w-14 rounded-sm" />
                    <Bone className="h-3 w-10 rounded-md" />
                </div>
            </div>
            <div className="flex-1 grid grid-cols-3 gap-4 px-8">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-1 items-center">
                        <Bone className="h-2 w-10 rounded-sm" />
                        <Bone className="h-3 w-6 rounded-md" />
                    </div>
                ))}
            </div>
            <Bone className="h-3 w-14 rounded-md" />
        </div>
    </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMPOSITE PAGE SKELETONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Dashboard skeleton – header, stats, charts, table, actions
 */
export const DashboardSkeleton = () => (
    <div className="min-h-screen bg-gray-50/50 dark:bg-background pb-20 font-sans">
        <HeaderSkeleton accentColor="bg-blue-600" />
        <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
            <StatCardsSkeleton />
            <ChartsSkeleton />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <TableSkeleton rows={5} cols={4} />
                </div>
                <div className="space-y-4">
                    <Bone className="h-64 w-full rounded-3xl" />
                    <Bone className="h-48 w-full rounded-3xl" />
                </div>
            </div>
        </main>
    </div>
);

/**
 * List page skeleton – header, stats, filter bar, list cards, banner
 * Used for: complaints, bookings, notices, users, payments, mess, leaves
 */
export const ListPageSkeleton = ({ accentColor = "bg-indigo-600", cardCount = 5, statCount = 4 }) => (
    <div className="min-h-screen bg-gray-50/50 dark:bg-background pb-20 font-sans">
        <HeaderSkeleton accentColor={accentColor} />
        <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
            <StatCardsSkeleton count={statCount} />
            <FilterBarSkeleton />
            <ListCardSkeleton count={cardCount} />
            <BannerSkeleton />
        </div>
    </div>
);

/**
 * Grid page skeleton – header, stats, grid cards
 * Used for: salaries, staff, warden rooms etc.
 */
export const GridPageSkeleton = ({ accentColor = "bg-indigo-600", cardCount = 6, cols }) => (
    <div className="min-h-screen bg-gray-50/50 dark:bg-background pb-20 font-sans">
        <HeaderSkeleton accentColor={accentColor} />
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
            <StatCardsSkeleton />
            <FilterBarSkeleton />
            <GridCardSkeleton count={cardCount} cols={cols} />
        </div>
    </div>
);

/**
 * Category page skeleton – header, stats, category cards
 * Used for: expenses
 */
export const CategoryPageSkeleton = ({ accentColor = "bg-blue-600", categoryCount = 5 }) => (
    <div className="min-h-screen bg-gray-50/50 dark:bg-background pb-20 font-sans">
        <HeaderSkeleton accentColor={accentColor} />
        <main className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8">
            <StatCardsSkeleton />
            <div className="flex items-center gap-3 px-1">
                <Bone className="h-5 w-1 rounded-full" />
                <Bone className="h-4 w-20 rounded-md" />
            </div>
            <CategoryCardSkeleton count={categoryCount} />
        </main>
    </div>
);

/**
 * Detail page skeleton – used for single-entity pages (hostel detail, user detail, resident detail)
 */
export const DetailPageSkeleton = ({ accentColor = "bg-indigo-600" }) => (
    <div className="min-h-screen bg-gray-50/50 dark:bg-background pb-20 font-sans">
        <HeaderSkeleton accentColor={accentColor} />
        <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
            <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-3xl p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-5">
                    <Bone className="h-16 w-16 rounded-2xl shrink-0" />
                    <div className="flex flex-col gap-2 flex-1">
                        <Bone className="h-5 w-48 rounded-lg" />
                        <Bone className="h-3 w-32 rounded-md" />
                        <Bone className="h-2.5 w-24 rounded-sm" />
                    </div>
                    <Bone className="h-9 w-24 rounded-xl hidden sm:block" />
                </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-5 shadow-sm">
                        <Bone className="h-2.5 w-16 rounded-sm mb-2" />
                        <Bone className="h-6 w-24 rounded-lg" />
                    </div>
                ))}
            </div>
            <TableSkeleton rows={4} cols={5} />
        </div>
    </div>
);

/**
 * Profile page skeleton
 */
export const ProfileSkeleton = () => (
    <div className="min-h-screen bg-gray-50/50 dark:bg-background pb-20 font-sans">
        <HeaderSkeleton accentColor="bg-indigo-600" />
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
            <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-3xl p-8 shadow-sm flex items-center gap-6">
                <Bone className="h-20 w-20 rounded-full shrink-0" />
                <div className="flex flex-col gap-2 flex-1">
                    <Bone className="h-5 w-40 rounded-lg" />
                    <Bone className="h-3 w-56 rounded-md" />
                    <Bone className="h-2.5 w-32 rounded-sm" />
                </div>
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-6 shadow-sm space-y-4">
                    <Bone className="h-3 w-24 rounded-md" />
                    <div className="grid grid-cols-2 gap-4">
                        {Array.from({ length: 4 }).map((_, j) => (
                            <div key={j} className="flex flex-col gap-1.5">
                                <Bone className="h-2 w-16 rounded-sm" />
                                <Bone className="h-10 w-full rounded-xl" />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

/**
 * Simple report / analytics page skeleton
 */
export const ReportSkeleton = () => (
    <div className="min-h-screen bg-gray-50/50 dark:bg-background pb-20 font-sans">
        <HeaderSkeleton accentColor="bg-blue-600" />
        <main className="max-w-[1400px] mx-auto px-6 py-8 space-y-8">
            <StatCardsSkeleton />
            <ChartsSkeleton />
            <TableSkeleton rows={6} cols={6} />
        </main>
    </div>
);

/**
 * Highly specific skeleton for Booking Detail page
 */
export const BookingDetailSkeleton = () => (
    <div className="min-h-screen bg-gray-50/50 dark:bg-background pb-32 font-sans">
        <HeaderSkeleton accentColor="bg-indigo-600" />
        <main className="max-w-[1400px] mx-auto px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                {/* Summary Stats Card */}
                <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-8 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-8 mb-8">
                        <div className="flex gap-6 items-center">
                            <Bone className="h-16 w-16 rounded-2xl" />
                            <div className="flex flex-col gap-2">
                                <Bone className="h-4 w-24 rounded-md" />
                                <Bone className="h-10 w-48 rounded-xl" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                            <Bone className="h-4 w-20 rounded-md" />
                            <Bone className="h-10 w-28 rounded-xl" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-gray-100 dark:border-border/50">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <Bone className="h-7 w-7 rounded-lg shrink-0" />
                                    <Bone className="h-3 w-16 rounded-md" />
                                </div>
                                <Bone className="h-5 w-24 rounded-lg" />
                                <Bone className="h-2 w-16 rounded-sm mt-1" />
                            </div>
                        ))}
                    </div>
                </div>
                {/* Two Column details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-8 shadow-sm">
                        <Bone className="h-3 w-32 rounded-md mb-6" />
                        <div className="flex items-center gap-5 mb-6">
                            <Bone className="h-14 w-14 rounded-2xl shrink-0" />
                            <div className="flex flex-col gap-2">
                                <Bone className="h-2 w-12 rounded-sm" />
                                <Bone className="h-5 w-32 rounded-lg" />
                            </div>
                        </div>
                        <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-border/50">
                            <Bone className="h-12 w-full rounded-xl" />
                            <Bone className="h-12 w-full rounded-xl" />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-8 shadow-sm">
                        <Bone className="h-3 w-32 rounded-md mb-6" />
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <Bone className="h-3 w-20 rounded-md" />
                                <Bone className="h-3 w-24 rounded-md" />
                            </div>
                            <div className="flex justify-between">
                                <Bone className="h-3 w-20 rounded-md" />
                                <Bone className="h-3 w-16 rounded-md" />
                            </div>
                            <div className="flex justify-between">
                                <Bone className="h-3 w-20 rounded-md" />
                                <Bone className="h-3 w-20 rounded-md" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Right Column */}
            <div className="lg:col-span-1 space-y-8">
                <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-8 shadow-sm">
                    <Bone className="h-3 w-32 rounded-md mb-6" />
                    <Bone className="h-24 w-full rounded-xl mb-4" />
                    <Bone className="h-12 w-full rounded-xl" />
                </div>
                <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-8 shadow-sm">
                    <Bone className="h-3 w-32 rounded-md mb-6" />
                    <Bone className="h-12 w-full rounded-xl mb-3" />
                    <Bone className="h-12 w-full rounded-xl" />
                </div>
            </div>
        </main>
    </div>
);

/**
 * Highly specific skeleton for Room Detail page
 */
export const RoomDetailSkeleton = () => (
    <div className="min-h-screen bg-gray-50/50 dark:bg-background pb-20 font-sans">
        <HeaderSkeleton accentColor="bg-indigo-600" />
        <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
            <StatCardsSkeleton count={4} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Residents block */}
                    <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <Bone className="h-10 w-10 rounded-xl" />
                                <div className="flex flex-col gap-2">
                                    <Bone className="h-4 w-32 rounded-lg" />
                                    <Bone className="h-2.5 w-48 rounded-md" />
                                </div>
                            </div>
                            <Bone className="h-7 w-20 rounded-full" />
                        </div>
                        <div className="space-y-3">
                            <Bone className="h-20 w-full rounded-xl" />
                            <Bone className="h-20 w-full rounded-xl" />
                        </div>
                    </div>
                    {/* Lower cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-8 shadow-sm">
                            <Bone className="h-3 w-32 rounded-md mb-6" />
                            <div className="space-y-3">
                                <Bone className="h-14 w-full rounded-xl" />
                                <Bone className="h-14 w-full rounded-xl" />
                                <Bone className="h-14 w-full rounded-xl" />
                            </div>
                        </div>
                        <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-8 shadow-sm">
                            <Bone className="h-3 w-32 rounded-md mb-6" />
                            <div className="flex flex-wrap gap-2">
                                <Bone className="h-8 w-20 rounded-lg" />
                                <Bone className="h-8 w-24 rounded-lg" />
                                <Bone className="h-8 w-16 rounded-lg" />
                                <Bone className="h-8 w-28 rounded-lg" />
                            </div>
                        </div>
                    </div>
                </div>
                {/* Right Column */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <Bone className="h-3 w-32 rounded-md" />
                            <Bone className="h-4 w-4 rounded-full" />
                        </div>
                        <div className="space-y-4">
                            <Bone className="h-16 w-full rounded-xl" />
                            <Bone className="h-16 w-full rounded-xl" />
                            <Bone className="h-16 w-full rounded-xl" />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
);

// Default export for convenience
export default ListPageSkeleton;
