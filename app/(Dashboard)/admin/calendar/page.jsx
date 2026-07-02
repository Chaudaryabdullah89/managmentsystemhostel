"use client";

// Admin calendar — same component as warden but with hostel selector enabled
import CalendarPage from "@/app/(Dashboard)/warden/calendar/page";

export default function AdminCalendarPage() {
  return <CalendarPage showHostelSelector={true} />;
}
