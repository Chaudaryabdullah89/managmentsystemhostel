"use client";
import React, { useEffect, useState, Suspense } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Save,
  ArrowLeft,
  Building2,
  LayoutGrid,
  Coins,
  Sparkle,
  ShieldCheck,
  Clock,
  Image as ImageIcon,
  Loader2,
  BedDouble,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";

const CreateRoomForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedHostelId = searchParams.get("hostelId");

  const [hostels, setHostels] = useState([]);
  const [selectedHostelId, setSelectedHostelId] = useState(
    preSelectedHostelId || "",
  );
  const [roomNumber, setRoomNumber] = useState("");
  const [floor, setFloor] = useState("");
  const [type, setType] = useState("SINGLE");
  const [capacity, setCapacity] = useState("1");
  const [status, setStatus] = useState("AVAILABLE");
  const [price, setPrice] = useState("");
  const [pricepernight, setPricepernight] = useState("");
  const [monthlyrent, setMonthlyrent] = useState("");
  const [description, setDescription] = useState("");
  const [amenities, setAmenities] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [cleaningInterval, setCleaningInterval] = useState("24");
  const [laundryInterval, setLaundryInterval] = useState("48");

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchHostels = async () => {
      try {
        const response = await fetch("/api/hostels");
        const data = await response.json();
        if (data.success && data.data) {
          setHostels(data.data);
          if (preSelectedHostelId) {
            setSelectedHostelId(preSelectedHostelId);
          } else if (data.data.length > 0) {
            setSelectedHostelId(data.data[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching hostels:", error);
        toast.error("Error loading property registry");
      }
    };
    fetchHostels();
  }, [preSelectedHostelId]);

  const handleCreateRoom = async () => {
    if (
      !selectedHostelId ||
      !roomNumber ||
      floor === "" ||
      !price ||
      !monthlyrent ||
      !pricepernight
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setIsSubmitting(true);

    try {
      const roomPayload = {
        hostelId: selectedHostelId,
        roomNumber,
        floor: parseInt(floor),
        type,
        capacity: parseInt(capacity),
        status,
        price: parseFloat(price),
        pricepernight: parseFloat(pricepernight),
        monthlyrent: parseFloat(monthlyrent),
        cleaningInterval: parseInt(cleaningInterval),
        laundryInterval: parseInt(laundryInterval),
        description,
        amenities: amenities
          ? amenities
              .split(",")
              .map((a) => a.trim())
              .filter(Boolean)
          : [],
        images: imageUrl ? [imageUrl] : [],
      };

      const response = await fetch("/api/rooms/createroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roomPayload),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Room registered successfully!");
        router.push(`/admin/hostels/${selectedHostelId}/rooms`);
      } else {
        toast.error(data.error || "Failed to register room.");
      }
    } catch (error) {
      console.error("Error creating room:", error);
      toast.error("An internal error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const parsedAmenities = amenities
    ? amenities
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background font-sans pb-24">
      {/* Sticky Header */}
      <div className="bg-white dark:bg-card border-b border-slate-200/80 dark:border-border sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="rounded-xl hover:bg-slate-100 dark:hover:bg-muted/10 h-9 w-9 shrink-0 text-slate-600 dark:text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="h-5 w-px bg-slate-200 dark:bg-border hidden sm:block" />
            <div className="flex flex-col min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-foreground tracking-tight truncate">
                Add New Room
              </h1>
              <p className="text-xs text-slate-500 dark:text-muted-foreground truncate">
                Room Management • Register new room unit and set pricing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="h-9 px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-muted-foreground hover:bg-slate-100 dark:hover:bg-muted/10 hidden sm:flex"
            >
              Cancel
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-5 rounded-xl text-xs font-semibold shadow-sm gap-2 transition-all active:scale-95"
              onClick={handleCreateRoom}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Room</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Primary Left Columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Parent Building Selection */}
            <Card className="border border-slate-200/80 dark:border-border shadow-xs bg-white dark:bg-card rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-border bg-slate-50/50 dark:bg-muted/10 px-6 py-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-foreground">
                  <Building2 className="h-4 w-4 text-indigo-600" />
                  Property Placement
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Select the hostel branch where this new room is located.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Target Hostel Branch *
                  </Label>
                  <Select
                    value={selectedHostelId}
                    onValueChange={setSelectedHostelId}
                  >
                    <SelectTrigger className="h-10 w-full bg-slate-50/50 dark:bg-muted/10 border-slate-200 dark:border-border rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-600">
                      <SelectValue placeholder="Select a hostel" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200">
                      {hostels.map((h) => (
                        <SelectItem key={h.id} value={h.id}>
                          🏢 {h.name} ({h.city})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Room Specifications */}
            <Card className="border border-slate-200/80 dark:border-border shadow-xs bg-white dark:bg-card rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-border bg-slate-50/50 dark:bg-muted/10 px-6 py-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-foreground">
                  <LayoutGrid className="h-4 w-4 text-indigo-600" />
                  Room Specifications
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Room number, floor placement, suite type, and bed capacity.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Room Number *
                    </Label>
                    <Input
                      placeholder="e.g. 101 or B-102"
                      className="h-10 bg-slate-50/50 dark:bg-muted/10 border-slate-200 dark:border-border rounded-xl text-sm font-medium focus-visible:ring-2 focus-visible:ring-indigo-600"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Floor Level *
                    </Label>
                    <Input
                      type="number"
                      placeholder="0 for Ground, 1 for 1st Floor"
                      className="h-10 bg-slate-50/50 dark:bg-muted/10 border-slate-200 dark:border-border rounded-xl text-sm font-medium focus-visible:ring-2 focus-visible:ring-indigo-600"
                      value={floor}
                      onChange={(e) => setFloor(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Room Suite Type *
                    </Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger className="h-10 w-full bg-slate-50/50 dark:bg-muted/10 border-slate-200 dark:border-border rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-600">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200">
                        <SelectItem value="SINGLE">SINGLE SUITE</SelectItem>
                        <SelectItem value="DOUBLE">DOUBLE SUITE</SelectItem>
                        <SelectItem value="TRIPLE">TRIPLE SUITE</SelectItem>
                        <SelectItem value="DORMITORY">DORMITORY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Bed Capacity (Total Beds) *
                    </Label>
                    <Input
                      type="number"
                      placeholder="1"
                      className="h-10 bg-slate-50/50 dark:bg-muted/10 border-slate-200 dark:border-border rounded-xl text-sm font-medium focus-visible:ring-2 focus-visible:ring-indigo-600"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Operational Status & Intervals */}
            <Card className="border border-slate-200/80 dark:border-border shadow-xs bg-white dark:bg-card rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-border bg-slate-50/50 dark:bg-muted/10 px-6 py-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-foreground">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Operational Status & Automation
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Set initial room status and cleaning/laundry interval timers.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Initial Room Status *
                  </Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-10 w-full bg-slate-50/50 dark:bg-muted/10 border-slate-200 dark:border-border rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-600">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200">
                      <SelectItem value="AVAILABLE">
                        🟢 AVAILABLE (Ready for resident)
                      </SelectItem>
                      <SelectItem value="OCCUPIED">
                        🔵 OCCUPIED (Residents living)
                      </SelectItem>
                      <SelectItem value="MAINTENANCE">
                        🟡 MAINTENANCE (Under repair)
                      </SelectItem>
                      <SelectItem value="CLEANING">
                        🟣 CLEANING (Housekeeping in progress)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-indigo-500" />
                      Cleaning Interval (Hours)
                    </Label>
                    <Input
                      type="number"
                      placeholder="24"
                      className="h-10 bg-slate-50/50 dark:bg-muted/10 border-slate-200 dark:border-border rounded-xl text-sm font-medium focus-visible:ring-2 focus-visible:ring-indigo-600"
                      value={cleaningInterval}
                      onChange={(e) => setCleaningInterval(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-blue-500" />
                      Laundry Interval (Hours)
                    </Label>
                    <Input
                      type="number"
                      placeholder="48"
                      className="h-10 bg-slate-50/50 dark:bg-muted/10 border-slate-200 dark:border-border rounded-xl text-sm font-medium focus-visible:ring-2 focus-visible:ring-indigo-600"
                      value={laundryInterval}
                      onChange={(e) => setLaundryInterval(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Amenities & Description */}
            <Card className="border border-slate-200/80 dark:border-border shadow-xs bg-white dark:bg-card rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-border bg-slate-50/50 dark:bg-muted/10 px-6 py-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-foreground">
                  <Sparkle className="h-4 w-4 text-indigo-600" />
                  Amenities & Room Description
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Room Description
                  </Label>
                  <Textarea
                    rows={3}
                    placeholder="Add description of room amenities and view..."
                    className="bg-slate-50/50 dark:bg-muted/10 border-slate-200 dark:border-border rounded-xl text-sm font-medium focus-visible:ring-2 focus-visible:ring-indigo-600 resize-none"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Amenities (Comma Separated)
                  </Label>
                  <Input
                    placeholder="WiFi, AC, Attached Bath, Study Table"
                    className="h-10 bg-slate-50/50 dark:bg-muted/10 border-slate-200 dark:border-border rounded-xl text-sm font-medium focus-visible:ring-2 focus-visible:ring-indigo-600"
                    value={amenities}
                    onChange={(e) => setAmenities(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Commercial Pricing */}
          <div className="space-y-6">
            <Card className="border border-slate-200/80 dark:border-border shadow-xs bg-white dark:bg-card rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-border bg-slate-50/50 dark:bg-muted/10 px-6 py-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-foreground">
                  <Coins className="h-4 w-4 text-emerald-600" />
                  Commercial Pricing Rates
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Set monthly rent and daily rates for this room.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Monthly Rent (PKR/month) *
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      PKR
                    </span>
                    <Input
                      type="number"
                      placeholder="15000"
                      className="pl-12 h-10 bg-slate-50/50 dark:bg-muted/10 border-slate-200 dark:border-border rounded-xl text-sm font-semibold focus-visible:ring-2 focus-visible:ring-indigo-600"
                      value={monthlyrent}
                      onChange={(e) => setMonthlyrent(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Base / Security Rate (PKR) *
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      PKR
                    </span>
                    <Input
                      type="number"
                      placeholder="15000"
                      className="pl-12 h-10 bg-slate-50/50 dark:bg-muted/10 border-slate-200 dark:border-border rounded-xl text-sm font-medium focus-visible:ring-2 focus-visible:ring-indigo-600"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Per Night Rate (PKR/night) *
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      PKR
                    </span>
                    <Input
                      type="number"
                      placeholder="1200"
                      className="pl-12 h-10 bg-slate-50/50 dark:bg-muted/10 border-slate-200 dark:border-border rounded-xl text-sm font-medium focus-visible:ring-2 focus-visible:ring-indigo-600"
                      value={pricepernight}
                      onChange={(e) => setPricepernight(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function CreateRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-card">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        </div>
      }
    >
      <CreateRoomForm />
    </Suspense>
  );
}
