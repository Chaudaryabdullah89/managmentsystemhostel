"use client";
import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Save,
  ArrowLeft,
  LayoutGrid,
  Coins,
  Sparkle,
  ShieldCheck,
  Clock,
  Image as ImageIcon,
  Loader2,
  Check,
  BedDouble,
  Users,
  Layers,
  Building2,
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
import { useRouter, useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useSingleRoomByHostelId } from "@/hooks/useRoom";
import { DetailPageSkeleton } from "@/components/ui/skeletons";

const EditRoomPage = () => {
  const router = useRouter();
  const params = useParams();
  const { hostelId: hostelName, roomId } = params;

  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : "",
  );
  const hostelId = searchParams.get("hostelId");

  const { data: roomResponse, isLoading: isFetching } = useSingleRoomByHostelId(
    hostelId,
    roomId,
  );
  const room = roomResponse?.data;

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
    if (room) {
      setRoomNumber(room.roomNumber || "");
      setFloor(room.floor?.toString() || "");
      setType(room.type || "SINGLE");
      setCapacity(room.capacity?.toString() || "1");
      setStatus(room.status || "AVAILABLE");
      setPrice(room.price?.toString() || "");
      setPricepernight(room.pricepernight?.toString() || "");
      setMonthlyrent(room.monthlyrent?.toString() || "");
      setDescription(room.description || "");
      setAmenities(room.amenities?.join(", ") || "");
      setImageUrl(room.images?.[0] || "");
      setCleaningInterval(room.cleaningInterval?.toString() || "24");
      setLaundryInterval(room.laundryInterval?.toString() || "48");
    }
  }, [room]);

  const handleUpdateRoom = async () => {
    if (
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
        id: roomId,
        hostelId: hostelId,
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

      const response = await fetch("/api/rooms/editroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roomPayload),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Room specifications saved successfully!");
        router.push(
          `/admin/hostels/${hostelName}/room-details/room/${roomId}?hostelId=${hostelId}`,
        );
      } else {
        toast.error(data.error || "Failed to update room.");
      }
    } catch (error) {
      console.error("Error updating room:", error);
      toast.error("An internal error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case "AVAILABLE":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "OCCUPIED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "MAINTENANCE":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "CLEANING":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  if (isFetching) return <DetailPageSkeleton />;

  const parsedAmenities = amenities
    ? amenities
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background font-sans pb-24">
      {/* Header */}
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
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-foreground tracking-tight truncate">
                  Edit Room {roomNumber || "Details"}
                </h1>
                <Badge
                  variant="outline"
                  className={`${getStatusBadge(status)} text-[10px] font-semibold px-2 py-0.5 rounded-full`}
                >
                  {status}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-muted-foreground truncate">
                Room Management • Modify parameters and commercial rates
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
              onClick={handleUpdateRoom}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Room Identification */}
            <Card className="border border-slate-200/80 dark:border-border shadow-xs bg-white dark:bg-card rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-border bg-slate-50/50 dark:bg-muted/10 px-6 py-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-foreground">
                  <LayoutGrid className="h-4 w-4 text-indigo-600" />
                  Room Specifications
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Basic suite identifiers, layout floor, and capacity limits.
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

            {/* Operational State & Schedule */}
            <Card className="border border-slate-200/80 dark:border-border shadow-xs bg-white dark:bg-card rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-border bg-slate-50/50 dark:bg-muted/10 px-6 py-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-foreground">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Operational Status & Cleaning Intervals
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Set room availability mode and service interval automation.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Current Room Status *
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
                    <p className="text-[11px] text-slate-400">
                      Automated cleaning log generated every{" "}
                      {cleaningInterval || 24} hours.
                    </p>
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
                    <p className="text-[11px] text-slate-400">
                      Linen laundry cycle every {laundryInterval || 48} hours
                      for occupied beds.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description & Media */}
            <Card className="border border-slate-200/80 dark:border-border shadow-xs bg-white dark:bg-card rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-border bg-slate-50/50 dark:bg-muted/10 px-6 py-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-foreground">
                  <Sparkle className="h-4 w-4 text-indigo-600" />
                  Amenities & Room Media
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Public feature tags, optional room image, and description.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Room Description
                  </Label>
                  <Textarea
                    rows={4}
                    placeholder="Add details about room orientation, window views, or special features..."
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
                    placeholder="WiFi, AC, Attached Bath, Study Desk, Balcony"
                    className="h-10 bg-slate-50/50 dark:bg-muted/10 border-slate-200 dark:border-border rounded-xl text-sm font-medium focus-visible:ring-2 focus-visible:ring-indigo-600"
                    value={amenities}
                    onChange={(e) => setAmenities(e.target.value)}
                  />
                  {parsedAmenities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {parsedAmenities.map((item, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="bg-slate-100 dark:bg-muted/20 text-slate-700 dark:text-slate-300 text-[11px] font-medium px-2.5 py-0.5 rounded-lg"
                        >
                          ✨ {item}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Cover Image URL
                  </Label>
                  <Input
                    placeholder="https://images.unsplash.com/photo-..."
                    className="h-10 bg-slate-50/50 dark:bg-muted/10 border-slate-200 dark:border-border rounded-xl text-sm font-medium focus-visible:ring-2 focus-visible:ring-indigo-600"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                  {imageUrl && (
                    <div className="mt-2 relative h-36 w-full rounded-xl overflow-hidden border border-slate-200 dark:border-border bg-slate-100 dark:bg-muted/10 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt="Room Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <span className="text-xs text-slate-400 absolute">
                        Image Preview
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Pricing & Live Summary Card */}
          <div className="space-y-6">
            {/* Financial Ledger */}
            <Card className="border border-slate-200/80 dark:border-border shadow-xs bg-white dark:bg-card rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-border bg-slate-50/50 dark:bg-muted/10 px-6 py-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-foreground">
                  <Coins className="h-4 w-4 text-emerald-600" />
                  Commercial Pricing Rates
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Base fees used for resident billing and invoicing.
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

            {/* Live Summary Card */}
            <Card className="border border-indigo-100 dark:border-indigo-950/40 bg-linear-to-br from-indigo-50/40 via-white to-slate-50/50 dark:from-muted/10 dark:to-card rounded-2xl overflow-hidden p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                  Card Preview
                </span>
                <Badge
                  variant="outline"
                  className={`${getStatusBadge(status)} text-[10px] font-semibold px-2 py-0.5 rounded-full`}
                >
                  {status}
                </Badge>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <BedDouble className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-foreground">
                    Room {roomNumber || "---"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Floor {floor || "0"} • {type} Suite
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-border grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Capacity
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {capacity || 1} Beds
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Monthly Rent
                  </span>
                  <span className="font-bold text-indigo-600">
                    PKR {Number(monthlyrent || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditRoomPage;
