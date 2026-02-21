"use client"
import React, { useMemo } from "react";
import {
    CalendarRange,
    Loader2,
    Utensils,
    Coffee,
    Clock,
    Building2,
    Info,
    Calendar,
    ChevronDown
} from "lucide-react";
import useAuthStore from "@/hooks/Authstate";
import { useMessMenu } from "@/hooks/useMess";
import { useBookings } from "@/hooks/useBooking";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

const formatTime12h = (time24) => {
    if (!time24) return "";
    const [h, m] = time24.split(':');
    if (!h || !m) return time24;
    let hours = parseInt(h, 10);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours.toString().padStart(2, '0')}:${m} ${suffix}`;
};

const displayTimeRange = (timeStr) => {
    if (!timeStr || !timeStr.includes('~')) return timeStr || "---";
    const [start, end] = timeStr.split('~');
    if (!start && !end) return "---";
    return `${formatTime12h(start)} - ${formatTime12h(end)}`;
};

const GuestMessMenu = () => {
    const { user } = useAuthStore();
    const { data: bookingsData, isLoading: bookingsLoading } = useBookings({ userId: user?.id });

    // Identify the active or first available booking to get the hostel ID
    const currentBooking = useMemo(() => {
        return bookingsData?.find(b => ['CONFIRMED', 'CHECKED_IN'].includes(b.status)) || bookingsData?.[0];
    }, [bookingsData]);

    const hostelId = user?.hostelId || currentBooking?.Room?.hostelId;

    const { data: messMenus, isLoading: messLoading } = useMessMenu(hostelId);

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    const isLoading = bookingsLoading || messLoading;

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50/50">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!hostelId) {
        return (
            <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center p-6">
                <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center max-w-md w-full shadow-sm">
                    <Building2 className="h-16 w-16 text-gray-200 mx-auto mb-6" />
                    <h2 className="text-xl font-bold text-gray-900 uppercase">No Hostel Assigned</h2>
                    <p className="text-gray-400 text-sm mt-2">You are currently not assigned to any hostel. Please contact administration to view your mess schedule.</p>
                </div>
            </div>
        );
    }

    // Find today's menu
    const todaysMenu = messMenus?.find(m => m.dayOfWeek === today);
    // Filter out today to list the rest below
    const otherDays = DAYS.filter(d => d !== today);

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-[72px]">
                <div className="max-w-[1000px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center">
                            <Utensils className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight uppercase">Weekly Mess Schedule</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Hostel Branch Active</span>
                                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-[1000px] mx-auto px-6 py-8 space-y-8">
                {/* Introduction Banner */}
                <div className="bg-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg shadow-indigo-600/20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/50 rounded-full blur-2xl -ml-10 -mb-10" />

                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-widest text-white mb-4 border border-white/10 backdrop-blur-md">
                            <Calendar className="h-3.5 w-3.5" /> This Week's Menu
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight mb-2">Dear , {user?.name?.split(' ')[0] || 'Guest'}!</h2>
                        <p className="text-indigo-100 font-medium max-w-xl text-sm leading-relaxed">
                            Discover what's cooking today. Timings are firm so make sure to arrive within the scheduled windows to guarantee fresh meals.
                        </p>
                    </div>
                </div>

                {/* Today's Special Focus Section */}
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-8 w-1 bg-indigo-600 rounded-full" />
                        <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Today's Schedule <span className="text-indigo-600">({today})</span></h3>
                    </div>

                    <Card className="rounded-[2rem] border-0 shadow-xl shadow-gray-200/50 overflow-hidden bg-white">
                        <CardContent className="p-0">
                            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                                {/* Breakfast */}
                                <div className="p-8 hover:bg-amber-50/30 transition-colors">
                                    <div className="flex flex-col h-full justify-between">
                                        <div>
                                            <div className="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center mb-6">
                                                <Coffee className="h-6 w-6 text-amber-600" />
                                            </div>
                                            <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-1">Breakfast</h4>

                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-gray-600 text-[11px] font-bold uppercase tracking-wider mb-6">
                                                <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                {displayTimeRange(todaysMenu?.breakfastTime)}
                                            </div>

                                            <p className="text-base font-medium text-gray-700 leading-relaxed">
                                                {todaysMenu?.breakfast || <span className="text-gray-400 italic font-normal">No items scheduled</span>}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Lunch */}
                                <div className="p-8 hover:bg-emerald-50/30 transition-colors">
                                    <div className="flex flex-col h-full justify-between">
                                        <div>
                                            <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center mb-6">
                                                <Utensils className="h-6 w-6 text-emerald-600" />
                                            </div>
                                            <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-1">Lunch</h4>

                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-gray-600 text-[11px] font-bold uppercase tracking-wider mb-6">
                                                <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                {displayTimeRange(todaysMenu?.lunchTime)}
                                            </div>

                                            <p className="text-base font-medium text-gray-700 leading-relaxed">
                                                {todaysMenu?.lunch || <span className="text-gray-400 italic font-normal">No items scheduled</span>}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Dinner */}
                                <div className="p-8 hover:bg-indigo-50/30 transition-colors">
                                    <div className="flex flex-col h-full justify-between">
                                        <div>
                                            <div className="h-12 w-12 rounded-2xl bg-indigo-100 flex items-center justify-center mb-6">
                                                <Utensils className="h-6 w-6 text-indigo-600" />
                                            </div>
                                            <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-1">Dinner</h4>

                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-gray-600 text-[11px] font-bold uppercase tracking-wider mb-6">
                                                <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                {displayTimeRange(todaysMenu?.dinnerTime)}
                                            </div>

                                            <p className="text-base font-medium text-gray-700 leading-relaxed">
                                                {todaysMenu?.dinner || <span className="text-gray-400 italic font-normal">No items scheduled</span>}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Upcoming Schedule Accordion */}
                <div className="pt-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-8 w-1 bg-gray-300 rounded-full" />
                        <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Full Weekly Overview</h3>
                    </div>

                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {otherDays.map((day) => {
                            const dayMenu = messMenus?.find(m => m.dayOfWeek === day);

                            return (
                                <AccordionItem key={day} value={day} className="bg-white border border-gray-100 rounded-2xl px-6 py-2 shadow-sm data-[state=open]:border-indigo-200 data-[state=open]:ring-2 data-[state=open]:ring-indigo-50 transition-all">
                                    <AccordionTrigger className="hover:no-underline py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center font-black text-xs text-gray-500 uppercase tracking-widest group-data-[state=open]:bg-indigo-100 group-data-[state=open]:text-indigo-600 group-data-[state=open]:border-indigo-100 transition-colors">
                                                {day.substring(0, 3)}
                                            </div>
                                            <span className="text-sm font-bold text-gray-900 uppercase tracking-widest group-data-[state=open]:text-indigo-600 transition-colors flex-1 text-left">{day}</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-6">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-50">
                                            {/* Breakfast */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Coffee className="h-4 w-4 text-amber-500" />
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Breakfast</span>
                                                    </div>
                                                </div>
                                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100/50">
                                                    <p className="text-sm font-medium text-gray-800 mb-3">{dayMenu?.breakfast || <span className="text-gray-400 italic">Not defined</span>}</p>
                                                    <div className="inline-flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                                        <Clock className="h-3 w-3" /> {displayTimeRange(dayMenu?.breakfastTime)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Lunch */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Utensils className="h-4 w-4 text-emerald-500" />
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Lunch</span>
                                                    </div>
                                                </div>
                                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100/50">
                                                    <p className="text-sm font-medium text-gray-800 mb-3">{dayMenu?.lunch || <span className="text-gray-400 italic">Not defined</span>}</p>
                                                    <div className="inline-flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                                        <Clock className="h-3 w-3" /> {displayTimeRange(dayMenu?.lunchTime)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Dinner */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Utensils className="h-4 w-4 text-indigo-500" />
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Dinner</span>
                                                    </div>
                                                </div>
                                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100/50">
                                                    <p className="text-sm font-medium text-gray-800 mb-3">{dayMenu?.dinner || <span className="text-gray-400 italic">Not defined</span>}</p>
                                                    <div className="inline-flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                                        <Clock className="h-3 w-3" /> {displayTimeRange(dayMenu?.dinnerTime)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                </div>
            </main>
        </div>
    );
};

export default GuestMessMenu;
