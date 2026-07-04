"use client";

import React, { useState, useMemo } from "react";
import {
  Utensils,
  Coffee,
  Clock,
  Building2,
  Calendar,
  Star,
  Sun,
  Moon,
  CheckCircle2,
  ChevronDown
} from "lucide-react";
import useAuthStore from "@/hooks/Authstate";
import { Button } from "@/components/ui/button";
import {
  useMessMenu,
  useMessFeedback,
  useSubmitMessFeedback,
} from "@/hooks/useMess";
import { useBookings } from "@/hooks/useBooking";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DetailPageSkeleton } from "@/components/ui/skeletons";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const formatTime12h = (time24) => {
  if (!time24) return "";
  const [h, m] = time24.split(":");
  if (!h || !m) return time24;
  let hours = parseInt(h, 10);
  const suffix = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours.toString().padStart(2, "0")}:${m} ${suffix}`;
};

const displayTimeRange = (timeStr) => {
  if (!timeStr || !timeStr.includes("~")) return timeStr || "---";
  const [start, end] = timeStr.split("~");
  if (!start && !end) return "---";
  return `${formatTime12h(start)} - ${formatTime12h(end)}`;
};

const GuestMessMenu = () => {
  const { user } = useAuthStore();
  const { data: bookingsData, isLoading: bookingsLoading } = useBookings({
    userId: user?.id,
  });

  const currentBooking = useMemo(() => {
    return (
      bookingsData?.find((b) =>
        ["CONFIRMED", "CHECKED_IN"].includes(b.status),
      ) || bookingsData?.[0]
    );
  }, [bookingsData]);

  const hostelId = user?.hostelId || currentBooking?.Room?.hostelId;

  const { data: messMenus, isLoading: messLoading } = useMessMenu(hostelId);
  const { data: feedbackData, refetch: refetchFeedback } =
    useMessFeedback(hostelId);
  const submitFeedback = useSubmitMessFeedback();

  const [selectedMeal, setSelectedMeal] = useState("BREAKFAST");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comments, setComments] = useState("");

  const today = new Date()
    .toLocaleDateString("en-US", { weekday: "long" })
    .toUpperCase();
  const isLoading = bookingsLoading || messLoading;

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!hostelId) {
      toast.error("Hostel ID is not resolved.");
      return;
    }

    try {
      await submitFeedback.mutateAsync({
        hostelId,
        mealType: selectedMeal,
        rating,
        comments,
      });
      toast.success("Thank you for rating today's meal!");
      setComments("");
      refetchFeedback();
    } catch (err) {
      toast.error(err.message || "Failed to submit meal rating.");
    }
  };

  if (isLoading) return <DetailPageSkeleton />;

  if (!hostelId) {
    return (
      <div className="min-h-screen bg-slate-50/50 dark:bg-background flex flex-col items-center justify-center p-6">
        <div className="bg-white dark:bg-card border border-slate-200/80 dark:border-border rounded-3xl p-12 text-center max-w-md w-full shadow-sm">
          <Building2 className="h-16 w-16 text-amber-300 mx-auto mb-6" />
          <h2 className="text-lg font-black text-slate-900 dark:text-foreground uppercase tracking-tight">
            No Active Hostel Room
          </h2>
          <p className="text-slate-500 dark:text-muted-foreground text-xs font-medium mt-2 leading-relaxed">
            You are currently not assigned to an active hostel property. Please contact administration to view your weekly mess planner.
          </p>
        </div>
      </div>
    );
  }

  const todaysMenu = messMenus?.find((m) => m.dayOfWeek === today);
  const otherDays = DAYS.filter((d) => d !== today);

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background pb-20 font-sans tracking-tight">
      {/* Vibrant Header */}
      <header className="bg-white/80 dark:bg-card/80 backdrop-blur-md border-b sticky top-0 z-40 h-20 shadow-xs">
        <div className="max-w-[1050px] mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Utensils className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-slate-900 dark:text-foreground tracking-tight uppercase">
                  Hostel Mess Planner
                </h1>
                <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[9px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-lg">
                  Weekly Menu
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Today is {today}
                </span>
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10.5px] font-extrabold text-emerald-600 uppercase tracking-wider">
                  Dining Hall Operational
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1050px] mx-auto px-6 py-8 space-y-8">
        {/* Vibrant Warm Hero Banner */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-amber-600/15">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-white mb-3 border border-white/20">
              <Calendar className="h-3.5 w-3.5" /> Weekly Dining Schedule
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-2">
              Welcome, {user?.name || "Resident"}! 🍽️
            </h2>
            <p className="text-amber-100 font-semibold max-w-xl text-xs leading-relaxed">
              Explore today's freshly prepared meals below. Please visit the dining hall within the designated time windows for warm, fresh servings!
            </p>
          </div>
        </div>

        {/* Today's Meal Focus Section */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-7 w-1.5 bg-amber-500 rounded-full" />
            <h3 className="text-base font-black text-slate-900 dark:text-foreground uppercase tracking-wide">
              Today's Meals Schedule <span className="text-amber-600">({today})</span>
            </h3>
          </div>

          <Card className="rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden bg-white dark:bg-card">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-border">
                {/* Breakfast */}
                <div className="p-7 hover:bg-amber-50/40 transition-colors">
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-11 w-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
                          <Coffee className="h-5 w-5" />
                        </div>
                        <span className="text-[9.5px] font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 uppercase">
                          Morning
                        </span>
                      </div>
                      <h4 className="text-base font-black text-slate-900 dark:text-foreground uppercase tracking-tight mb-1">
                        Breakfast
                      </h4>

                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-muted/10 border border-slate-200 text-slate-600 text-[10.5px] font-bold uppercase tracking-wider mb-4">
                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                        {displayTimeRange(todaysMenu?.breakfastTime)}
                      </div>

                      <p className="text-sm font-semibold text-slate-800 dark:text-foreground leading-relaxed bg-amber-50/50 p-3.5 rounded-2xl border border-amber-100/60">
                        {todaysMenu?.breakfast || (
                          <span className="text-slate-400 italic font-normal">
                            No menu items scheduled for breakfast
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lunch */}
                <div className="p-7 hover:bg-emerald-50/40 transition-colors">
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-11 w-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                          <Sun className="h-5 w-5" />
                        </div>
                        <span className="text-[9.5px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 uppercase">
                          Afternoon
                        </span>
                      </div>
                      <h4 className="text-base font-black text-slate-900 dark:text-foreground uppercase tracking-tight mb-1">
                        Lunch
                      </h4>

                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-muted/10 border border-slate-200 text-slate-600 text-[10.5px] font-bold uppercase tracking-wider mb-4">
                        <Clock className="h-3.5 w-3.5 text-emerald-500" />
                        {displayTimeRange(todaysMenu?.lunchTime)}
                      </div>

                      <p className="text-sm font-semibold text-slate-800 dark:text-foreground leading-relaxed bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100/60">
                        {todaysMenu?.lunch || (
                          <span className="text-slate-400 italic font-normal">
                            No menu items scheduled for lunch
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dinner */}
                <div className="p-7 hover:bg-indigo-50/40 transition-colors">
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-11 w-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-xs">
                          <Moon className="h-5 w-5" />
                        </div>
                        <span className="text-[9.5px] font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 uppercase">
                          Evening
                        </span>
                      </div>
                      <h4 className="text-base font-black text-slate-900 dark:text-foreground uppercase tracking-tight mb-1">
                        Dinner
                      </h4>

                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-muted/10 border border-slate-200 text-slate-600 text-[10.5px] font-bold uppercase tracking-wider mb-4">
                        <Clock className="h-3.5 w-3.5 text-indigo-500" />
                        {displayTimeRange(todaysMenu?.dinnerTime)}
                      </div>

                      <p className="text-sm font-semibold text-slate-800 dark:text-foreground leading-relaxed bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100/60">
                        {todaysMenu?.dinner || (
                          <span className="text-slate-400 italic font-normal">
                            No menu items scheduled for dinner
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feedback & Ratings System */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          {/* Feedback Form */}
          <Card className="lg:col-span-2 rounded-3xl border border-slate-200/80 shadow-2xs p-7 bg-white dark:bg-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Star className="h-5 w-5 fill-white text-white" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-foreground uppercase tracking-tight">
                  Rate Today's Meal Quality
                </h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Share feedback to help mess staff improve food taste</span>
              </div>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "BREAKFAST", label: "Breakfast 🍳" },
                  { id: "LUNCH", label: "Lunch 🍛" },
                  { id: "DINNER", label: "Dinner 🌙" },
                ].map((meal) => (
                  <button
                    type="button"
                    key={meal.id}
                    onClick={() => setSelectedMeal(meal.id)}
                    className={`py-3 rounded-xl font-bold text-xs uppercase tracking-wider border transition-all cursor-pointer ${selectedMeal === meal.id
                      ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-amber-50"
                      }`}
                  >
                    {meal.label}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                  Your Rating
                </label>
                <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 w-fit">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="focus:outline-none transition-transform active:scale-95 cursor-pointer"
                    >
                      <Star
                        className={`h-7 w-7 transition-colors ${star <= (hoverRating || rating)
                          ? "text-amber-500 fill-amber-500"
                          : "text-slate-300 dark:text-border"
                          }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-black text-amber-600 uppercase tracking-wider">
                    {rating} / 5 Stars
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                  Comments (Optional)
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Tell us about the food quality, taste, or portion size..."
                  className="w-full min-h-[90px] p-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:border-amber-500 text-xs font-semibold text-slate-800 bg-slate-50/50"
                />
              </div>

              <Button
                type="submit"
                disabled={submitFeedback.isPending}
                className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95"
              >
                {submitFeedback.isPending ? "Submitting Rating..." : "Submit Meal Rating"}
              </Button>
            </form>
          </Card>

          {/* Feedback Stats & Recent Comments */}
          <div className="space-y-6">
            <Card className="rounded-3xl border border-slate-200/80 shadow-2xs p-6 bg-white dark:bg-card">
              <h4 className="text-[10.5px] font-extrabold text-slate-400 uppercase tracking-widest mb-4">
                Meal Average Ratings
              </h4>
              <div className="space-y-3">
                {["BREAKFAST", "LUNCH", "DINNER"].map((meal) => {
                  const avgInfo = feedbackData?.averages?.[meal] || {
                    avg: 0,
                    count: 0,
                  };
                  return (
                    <div
                      key={meal}
                      className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100"
                    >
                      <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                        {meal}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-amber-500 font-black text-xs">
                          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                          {avgInfo.avg > 0 ? avgInfo.avg : "---"}
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          ({avgInfo.count} ratings)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Recent Reviews Panel */}
            <Card className="rounded-3xl border border-slate-200/80 shadow-2xs p-6 bg-white dark:bg-card flex flex-col max-h-[300px]">
              <h4 className="text-[10.5px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">
                Resident Reviews
              </h4>
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                {feedbackData?.feedbacks?.length > 0 ? (
                  feedbackData.feedbacks.slice(0, 5).map((f) => (
                    <div
                      key={f.id}
                      className="border-b border-slate-100 pb-2.5 last:border-0 last:pb-0"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wide">
                          {f.User?.name}
                        </span>
                        <span className="text-[8.5px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded uppercase">
                          {f.mealType}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mb-1">
                        {[...Array(f.rating)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-3 w-3 fill-amber-500 text-amber-500"
                          />
                        ))}
                      </div>
                      {f.comments && (
                        <p className="text-[11px] text-slate-600 font-medium leading-relaxed italic">
                          "{f.comments}"
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    No reviews submitted today
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Weekly Menu Schedule */}
        <div className="pt-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-7 w-1.5 bg-amber-500 rounded-full" />
            <h3 className="text-base font-black text-slate-900 dark:text-foreground uppercase tracking-wide">
              Full Weekly Mess Menu
            </h3>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-3">
            {otherDays.map((day) => {
              const dayMenu = messMenus?.find((m) => m.dayOfWeek === day);

              return (
                <AccordionItem
                  key={day}
                  value={day}
                  className="bg-white dark:bg-card border border-slate-200/80 dark:border-border rounded-2xl px-5 py-1 shadow-2xs data-[state=open]:border-amber-300 transition-all"
                >
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center font-black text-xs text-slate-600 uppercase tracking-widest">
                        {day.substring(0, 3)}
                      </div>
                      <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex-1 text-left">
                        {day}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
                      {/* Breakfast */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Coffee className="h-3.5 w-3.5 text-amber-500" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Breakfast
                          </span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <p className="text-xs font-semibold text-slate-800 mb-2">
                            {dayMenu?.breakfast || (
                              <span className="text-slate-400 italic">
                                Not defined
                              </span>
                            )}
                          </p>
                          <div className="inline-flex items-center gap-1.5 text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">
                            <Clock className="h-3 w-3 text-amber-500" />
                            {displayTimeRange(dayMenu?.breakfastTime)}
                          </div>
                        </div>
                      </div>

                      {/* Lunch */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Sun className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Lunch
                          </span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <p className="text-xs font-semibold text-slate-800 mb-2">
                            {dayMenu?.lunch || (
                              <span className="text-slate-400 italic">
                                Not defined
                              </span>
                            )}
                          </p>
                          <div className="inline-flex items-center gap-1.5 text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">
                            <Clock className="h-3 w-3 text-emerald-500" />
                            {displayTimeRange(dayMenu?.lunchTime)}
                          </div>
                        </div>
                      </div>

                      {/* Dinner */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Moon className="h-3.5 w-3.5 text-indigo-500" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Dinner
                          </span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <p className="text-xs font-semibold text-slate-800 mb-2">
                            {dayMenu?.dinner || (
                              <span className="text-slate-400 italic">
                                Not defined
                              </span>
                            )}
                          </p>
                          <div className="inline-flex items-center gap-1.5 text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">
                            <Clock className="h-3 w-3 text-indigo-500" />
                            {displayTimeRange(dayMenu?.dinnerTime)}
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
