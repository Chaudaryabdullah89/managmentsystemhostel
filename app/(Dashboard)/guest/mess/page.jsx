"use client";
import React, { useState, useMemo } from "react";
import {
  CalendarRange,
  Loader2,
  Utensils,
  Coffee,
  Clock,
  Building2,
  Info,
  Calendar,
  ChevronDown,
  Star,
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

  // Identify the active or first available booking to get the hostel ID
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
      toast.success("Thank you for your rating!");
      setComments("");
    } catch (err) {
      toast.error(err.message || "Failed to submit feedback");
    }
  };

  if (isLoading) return <DetailPageSkeleton />;

  if (!hostelId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background flex flex-col items-center justify-center p-6">
        <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-3xl p-12 text-center max-w-md w-full shadow-sm">
          <Building2 className="h-16 w-16 text-gray-200 mx-auto mb-6" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-foreground uppercase">
            No Hostel Assigned
          </h2>
          <p className="text-gray-400 dark:text-muted-foreground text-sm mt-2">
            You are currently not assigned to any hostel. Please contact
            administration to view your mess schedule.
          </p>
        </div>
      </div>
    );
  }

  // Find today's menu
  const todaysMenu = messMenus?.find((m) => m.dayOfWeek === today);
  // Filter out today to list the rest below
  const otherDays = DAYS.filter((d) => d !== today);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background pb-20 font-sans tracking-tight">
      {/* Header */}
      <div className="bg-white dark:bg-card border-b sticky top-0 z-50 h-[72px]">
        <div className="max-w-[1000px] mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center">
              <Utensils className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-gray-900 dark:text-foreground tracking-tight uppercase">
                Weekly Mess Schedule
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-muted-foreground">
                  Hostel Branch Active
                </span>
                <div className="h-1 w-1 rounded-full bg-emerald-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-[1000px] mx-auto px-6 py-8 space-y-8">
        {/* Introduction Banner */}
        <div className="bg-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg shadow-indigo-600/20">
          {/* <div className="absolute top-0 right-0 w-64 h-64 bg-white dark:bg-card/10 rounded-full blur-3xl -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/50 rounded-full blur-2xl -ml-10 -mb-10" /> */}

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-card/20 text-[10px] font-bold uppercase tracking-widest text-black mb-4 border border-white/10 backdrop-blur-md">
              <Calendar className="h-3.5 w-3.5" /> This Week's Menu
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">
              Dear , {user?.name?.split(" ")[0] || "Guest"}!
            </h2>
            <p className="text-indigo-100 font-medium max-w-xl text-sm leading-relaxed">
              Discover what's cooking today. Timings are firm so make sure to
              arrive within the scheduled windows to guarantee fresh meals.
            </p>
          </div>
        </div>

        {/* Today's Special Focus Section */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-1 bg-indigo-600 rounded-full" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-foreground uppercase tracking-tight">
              Today's Schedule{" "}
              <span className="text-indigo-600">({today})</span>
            </h3>
          </div>

          <Card className="rounded-[2rem] border-0 shadow-xl shadow-gray-200/50 overflow-hidden bg-white dark:bg-card">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                {/* Breakfast */}
                <div className="p-8 hover:bg-amber-50/30 transition-colors">
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <div className="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center mb-6">
                        <Coffee className="h-6 w-6 text-amber-600" />
                      </div>
                      <h4 className="text-lg font-black text-gray-900 dark:text-foreground uppercase tracking-tight mb-1">
                        Breakfast
                      </h4>

                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-muted/10 border border-gray-100 dark:border-border text-gray-600 dark:text-muted-foreground text-[11px] font-bold uppercase tracking-wider mb-6">
                        <Clock className="h-3.5 w-3.5 text-gray-400 dark:text-muted-foreground" />
                        {displayTimeRange(todaysMenu?.breakfastTime)}
                      </div>

                      <p className="text-base font-medium text-gray-700 dark:text-foreground leading-relaxed">
                        {todaysMenu?.breakfast || (
                          <span className="text-gray-400 dark:text-muted-foreground italic font-normal">
                            No items scheduled
                          </span>
                        )}
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
                      <h4 className="text-lg font-black text-gray-900 dark:text-foreground uppercase tracking-tight mb-1">
                        Lunch
                      </h4>

                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-muted/10 border border-gray-100 dark:border-border text-gray-600 dark:text-muted-foreground text-[11px] font-bold uppercase tracking-wider mb-6">
                        <Clock className="h-3.5 w-3.5 text-gray-400 dark:text-muted-foreground" />
                        {displayTimeRange(todaysMenu?.lunchTime)}
                      </div>

                      <p className="text-base font-medium text-gray-700 dark:text-foreground leading-relaxed">
                        {todaysMenu?.lunch || (
                          <span className="text-gray-400 dark:text-muted-foreground italic font-normal">
                            No items scheduled
                          </span>
                        )}
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
                      <h4 className="text-lg font-black text-gray-900 dark:text-foreground uppercase tracking-tight mb-1">
                        Dinner
                      </h4>

                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-muted/10 border border-gray-100 dark:border-border text-gray-600 dark:text-muted-foreground text-[11px] font-bold uppercase tracking-wider mb-6">
                        <Clock className="h-3.5 w-3.5 text-gray-400 dark:text-muted-foreground" />
                        {displayTimeRange(todaysMenu?.dinnerTime)}
                      </div>

                      <p className="text-base font-medium text-gray-700 dark:text-foreground leading-relaxed">
                        {todaysMenu?.dinner || (
                          <span className="text-gray-400 dark:text-muted-foreground italic font-normal">
                            No items scheduled
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

        {/* Interactive Feedback & Ratings System */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
          {/* Feedback Form */}
          <Card className="lg:col-span-2 rounded-[2rem] border-0 shadow-xl shadow-gray-200/50 p-8 bg-white dark:bg-card">
            <h3 className="text-lg font-black text-gray-900 dark:text-foreground uppercase tracking-tight mb-6">
              Rate Today's Meals
            </h3>
            <form onSubmit={handleFeedbackSubmit} className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                {["BREAKFAST", "LUNCH", "DINNER"].map((meal) => (
                  <button
                    type="button"
                    key={meal}
                    onClick={() => setSelectedMeal(meal)}
                    className={`py-3 rounded-2xl font-bold text-xs uppercase tracking-wider border transition-all cursor-pointer ${
                      selectedMeal === meal
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10"
                        : "bg-gray-50 border-gray-100 text-gray-600 dark:bg-muted/10 dark:text-muted-foreground hover:bg-gray-100"
                    }`}
                  >
                    {meal}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">
                  Select Rating
                </label>
                <div className="flex items-center gap-2">
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
                        className={`h-8 w-8 transition-colors ${
                          star <= (hoverRating || rating)
                            ? "text-amber-500 fill-amber-500"
                            : "text-gray-200 dark:text-border"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">
                  Share Your Thoughts (Optional)
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Tell us how the meal was... (e.g. delicious, cold, salty)"
                  className="w-full min-h-[100px] p-4 rounded-2xl border border-gray-100 focus:outline-indigo-600 text-sm font-medium"
                />
              </div>

              <Button
                type="submit"
                disabled={submitFeedback.isPending}
                className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest cursor-pointer"
              >
                {submitFeedback.isPending ? "Submitting..." : "Submit Review"}
              </Button>
            </form>
          </Card>

          {/* Feedback Stats & Recent Comments */}
          <div className="space-y-6">
            <Card className="rounded-[2rem] border-0 shadow-xl shadow-gray-200/50 p-6 bg-white dark:bg-card">
              <h4 className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest mb-4">
                Meal Averages
              </h4>
              <div className="space-y-4">
                {["BREAKFAST", "LUNCH", "DINNER"].map((meal) => {
                  const avgInfo = feedbackData?.averages?.[meal] || {
                    avg: 0,
                    count: 0,
                  };
                  return (
                    <div
                      key={meal}
                      className="flex justify-between items-center"
                    >
                      <span className="text-xs font-bold text-gray-600 dark:text-muted-foreground uppercase tracking-wider">
                        {meal}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                          <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                          {avgInfo.avg > 0 ? avgInfo.avg : "---"}
                        </div>
                        <span className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">
                          ({avgInfo.count} ratings)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Recent Reviews Panel */}
            <Card className="rounded-[2rem] border-0 shadow-xl shadow-gray-200/50 p-6 bg-white dark:bg-card flex flex-col max-h-[300px]">
              <h4 className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest mb-4">
                Recent Reviews
              </h4>
              <div className="flex-1 overflow-y-auto space-y-4 scrollbar-hide">
                {feedbackData?.feedbacks?.length > 0 ? (
                  feedbackData.feedbacks.slice(0, 5).map((f) => (
                    <div
                      key={f.id}
                      className="border-b border-gray-50 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-gray-700 dark:text-foreground uppercase tracking-wide">
                          {f.User?.name}
                        </span>
                        <span className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest">
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
                        <p className="text-xs text-gray-500 font-medium leading-relaxed italic">
                          "{f.comments}"
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                    No reviews yet today
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Upcoming Schedule Accordion */}
        <div className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-1 bg-gray-300 rounded-full" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-foreground uppercase tracking-tight">
              Full Weekly Overview
            </h3>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {otherDays.map((day) => {
              const dayMenu = messMenus?.find((m) => m.dayOfWeek === day);

              return (
                <AccordionItem
                  key={day}
                  value={day}
                  className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl px-6 py-2 shadow-sm data-[state=open]:border-indigo-200 data-[state=open]:ring-2 data-[state=open]:ring-indigo-50 transition-all"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-gray-50 dark:bg-muted/10 rounded-xl border border-gray-100 dark:border-border flex items-center justify-center font-black text-xs text-gray-500 dark:text-muted-foreground uppercase tracking-widest group-data-[state=open]:bg-indigo-100 group-data-[state=open]:text-indigo-600 group-data-[state=open]:border-indigo-100 transition-colors">
                        {day.substring(0, 3)}
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-foreground uppercase tracking-widest group-data-[state=open]:text-indigo-600 transition-colors flex-1 text-left">
                        {day}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-50">
                      {/* Breakfast */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Coffee className="h-4 w-4 text-amber-500" />
                            <span className="text-[10px] font-bold text-gray-500 dark:text-muted-foreground uppercase tracking-widest">
                              Breakfast
                            </span>
                          </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-muted/10 p-4 rounded-xl border border-gray-100 dark:border-border/50">
                          <p className="text-sm font-medium text-gray-800 dark:text-foreground mb-3">
                            {dayMenu?.breakfast || (
                              <span className="text-gray-400 dark:text-muted-foreground italic">
                                Not defined
                              </span>
                            )}
                          </p>
                          <div className="inline-flex items-center gap-2 text-[10px] font-bold text-gray-500 dark:text-muted-foreground uppercase tracking-wider">
                            <Clock className="h-3 w-3" />{" "}
                            {displayTimeRange(dayMenu?.breakfastTime)}
                          </div>
                        </div>
                      </div>

                      {/* Lunch */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Utensils className="h-4 w-4 text-emerald-500" />
                            <span className="text-[10px] font-bold text-gray-500 dark:text-muted-foreground uppercase tracking-widest">
                              Lunch
                            </span>
                          </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-muted/10 p-4 rounded-xl border border-gray-100 dark:border-border/50">
                          <p className="text-sm font-medium text-gray-800 dark:text-foreground mb-3">
                            {dayMenu?.lunch || (
                              <span className="text-gray-400 dark:text-muted-foreground italic">
                                Not defined
                              </span>
                            )}
                          </p>
                          <div className="inline-flex items-center gap-2 text-[10px] font-bold text-gray-500 dark:text-muted-foreground uppercase tracking-wider">
                            <Clock className="h-3 w-3" />{" "}
                            {displayTimeRange(dayMenu?.lunchTime)}
                          </div>
                        </div>
                      </div>

                      {/* Dinner */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Utensils className="h-4 w-4 text-indigo-500" />
                            <span className="text-[10px] font-bold text-gray-500 dark:text-muted-foreground uppercase tracking-widest">
                              Dinner
                            </span>
                          </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-muted/10 p-4 rounded-xl border border-gray-100 dark:border-border/50">
                          <p className="text-sm font-medium text-gray-800 dark:text-foreground mb-3">
                            {dayMenu?.dinner || (
                              <span className="text-gray-400 dark:text-muted-foreground italic">
                                Not defined
                              </span>
                            )}
                          </p>
                          <div className="inline-flex items-center gap-2 text-[10px] font-bold text-gray-500 dark:text-muted-foreground uppercase tracking-wider">
                            <Clock className="h-3 w-3" />{" "}
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
