"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  X,
  User,
  Home,
  Calendar,
  DollarSign,
  ChevronRight,
  Upload,
  FileText,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Search,
  Building2,
  BedDouble,
  ChevronLeft,
  ShieldCheck,
  UserPlus,
  UserCheck,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  Plus,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateBooking } from "@/hooks/useBooking";
import { useHostel } from "@/hooks/usehostel";
import { useRoomByHostelId } from "@/hooks/useRoom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import useAuthStore from "@/hooks/Authstate";

const CreateBookingPage = () => {
  const router = useRouter();
  const createBooking = useCreateBooking();
  const { data: hostelsResponse, isLoading: hostelsLoading } = useHostel();
  const user = useAuthStore((state) => state.user);
  const isWarden = user?.role === "WARDEN";

  const [step, setStep] = useState(1);
  const [existingGuestQuery, setExistingGuestQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);

  const [formData, setFormData] = useState({
    // Guest Info
    userId: "",
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    cnic: "",
    guardianName: "",
    guardianPhone: "",
    emergencyContact: "",
    address: "",
    city: "",
    currentResidence: "",
    otherImages: [],

    // Property Info
    hostelId: "",
    roomId: "",

    // Booking Terms
    checkIn: new Date().toISOString().split("T")[0],
    checkOut: "",
    status: "PENDING",
    paymentStatus: "PENDING",
    paymentMethod: "CASH",
    totalAmount: 0,
    securityDeposit: 0,
    monthlyRent: 0,
    advanceMonths: 1,
  });
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    if (isWarden && user?.hostelId) {
      setFormData((prev) => ({ ...prev, hostelId: user.hostelId }));
    }
  }, [isWarden, user?.hostelId]);

  const hostels =
    isWarden && user?.hostelId
      ? (hostelsResponse?.data || []).filter((h) => h.id === user.hostelId)
      : hostelsResponse?.data || [];

  const { data: roomsResponse, isLoading: roomsLoading } = useRoomByHostelId(
    formData.hostelId,
  );
  const rooms = roomsResponse?.data || [];
  const selectedRoom = rooms.find((r) => r.id === formData.roomId);

  // Guest Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (existingGuestQuery.length > 2) {
        setIsSearching(true);
        try {
          const res = await fetch(
            `/api/users?query=${existingGuestQuery}&role=all`,
          );
          const data = await res.json();
          setSearchResults(data.data || []);
        } catch (error) {
          console.error("Search failed:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [existingGuestQuery]);

  const handleSelectGuest = (user) => {
    const residentDocs = user?.ResidentProfile?.documents || {};
    const residentImages = Array.isArray(residentDocs?.galleryImages)
      ? residentDocs.galleryImages
      : [];
    setSelectedGuest(user);
    setFormData((prev) => ({
      ...prev,
      userId: user.id,
      guestName: user.name,
      guestEmail: user.email,
      guestPhone: user.phone || "",
      cnic: user.cnic || "",
      address: user.address || user.ResidentProfile?.address || "",
      guardianName: user.ResidentProfile?.guardianName || "",
      guardianPhone: user.ResidentProfile?.guardianPhone || "",
      emergencyContact: user.ResidentProfile?.emergencyContact || "",
      city: user.city || user.ResidentProfile?.city || "",
      currentResidence: residentDocs?.currentResidence || "",
      otherImages: residentImages,
    }));
    setExistingGuestQuery("");
    setSearchResults([]);
    toast.success(`Guest profile identified: ${user.name}`);
  };

  const resetGuest = () => {
    setSelectedGuest(null);
    setFormData((prev) => ({
      ...prev,
      userId: "",
      guestName: "",
      guestEmail: "",
      guestPhone: "",
      cnic: "",
      address: "",
      guardianName: "",
      guardianPhone: "",
      emergencyContact: "",
      city: "",
      currentResidence: "",
      otherImages: [],
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) {
      toast.error("Cloudinary is not configured (cloud name/preset missing).");
      return;
    }
    setUploadingImages(true);
    try {
      const uploadToCloudinary = async (file) => {
        const body = new FormData();
        body.append("file", file);
        body.append("upload_preset", uploadPreset.trim());
        body.append("folder", "hostel-app/resident-documents");
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: "POST",
            body,
          },
        );
        const data = await response.json();
        if (!response.ok) {
          const reason = data?.error?.message || "Image upload failed";
          throw new Error(reason);
        }
        return data.secure_url;
      };
      const uploadedUrls = await Promise.all(files.map(uploadToCloudinary));
      setFormData((prev) => ({
        ...prev,
        otherImages: [...(prev.otherImages || []), ...uploadedUrls].slice(0, 8),
      }));
      toast.success("Images uploaded.");
    } catch (error) {
      toast.error(error?.message || "Failed to upload images.");
    } finally {
      setUploadingImages(false);
      e.target.value = "";
    }
  };

  const removeUploadedImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      otherImages: (prev.otherImages || []).filter((_, i) => i !== index),
    }));
  };

  useEffect(() => {
    if (selectedRoom) {
      setFormData((prev) => ({
        ...prev,
        monthlyRent:
          selectedRoom.monthlyrent ||
          selectedRoom.montlyrent ||
          selectedRoom.price ||
          0,
      }));
    }
  }, [selectedRoom]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const calculateTotals = () => {
    if (!selectedRoom) return;
    const rent = parseFloat(formData.monthlyRent) || 0;
    const deposit = parseFloat(formData.securityDeposit) || 0;
    const total = deposit + rent * (parseInt(formData.advanceMonths) || 1);

    setFormData((prev) => ({
      ...prev,
      totalAmount: total,
    }));
  };

  useEffect(() => {
    calculateTotals();
  }, [
    selectedRoom,
    formData.advanceMonths,
    formData.securityDeposit,
    formData.monthlyRent,
  ]);

  const handleNext = () => {
    if (step === 1 && !formData.guestName)
      return toast.error("Guest profile name required");
    if (step === 2 && (!formData.hostelId || !formData.roomId))
      return toast.error("Hostel & Room assignment required");
    setStep((prev) => prev + 1);
  };

  const handleBack = () => setStep((prev) => prev - 1);

  const handleSubmit = async () => {
    if (!formData.checkIn) return toast.error("Check-in date required");

    try {
      await createBooking.mutateAsync(formData);
      router.push("/admin/bookings");
    } catch (error) {
      const msg = error?.message || "Failed to create booking";
      toast.error(msg);
      if (msg.toLowerCase().includes("email") || msg.toLowerCase().includes("phone") || msg.toLowerCase().includes("cnic")) {
        setStep(1);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-background/95 pb-20 font-sans antialiased">
      {/* Slim Top Glassmorphic Navbar */}
      <div className="bg-white/85 dark:bg-card/85 backdrop-blur-md border-b border-gray-200/70 dark:border-border/70 sticky top-0 z-50 h-16 shadow-2xs">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl hover:bg-gray-100 dark:hover:bg-muted h-9 w-9 text-gray-500 dark:text-muted-foreground"
              onClick={() => router.back()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="h-5 w-px bg-gray-200 dark:bg-border hidden sm:block" />
            <div className="flex flex-col">
              <h1 className="text-sm font-black text-gray-900 dark:text-foreground uppercase tracking-tight leading-none">
                Create New Room Booking
              </h1>
              <p className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest mt-1">
                Stay Entry & Payment Initialization Wizard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center -space-x-1.5">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-7 w-7 rounded-full border-2 border-white dark:border-card flex items-center justify-center text-[10px] font-black transition-all ${
                    step >= s
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs"
                      : "bg-gray-100 dark:bg-muted text-gray-400 dark:text-muted-foreground"
                  }`}
                >
                  {s}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-4 md:px-6 py-6 md:py-8 min-w-0">
        <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-3xl shadow-2xs overflow-hidden min-w-0">
          {/* Progress Bar */}
          <div className="h-1 bg-gray-100 dark:bg-muted w-full">
            <div
              className="h-full bg-slate-900 dark:bg-slate-100 transition-all duration-500 ease-out"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>

          <div className="p-6 md:p-10 min-w-0">
            {/* Step 1: Guest Information */}
            {step === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-foreground">
                    Guest Profile Entry
                  </h2>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">
                    Search existing directory or enter new resident details
                  </p>
                </div>

                <div className="space-y-6">
                  {!selectedGuest ? (
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search existing users by Name, Email, or CNIC..."
                        className="h-12 pl-11 pr-4 rounded-xl border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/20 font-bold text-xs focus:bg-white dark:focus:bg-card focus:border-slate-900 transition-all"
                        value={existingGuestQuery}
                        onChange={(e) => setExistingGuestQuery(e.target.value)}
                      />
                      {isSearching && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <Clock className="h-4 w-4 animate-spin text-gray-400" />
                        </div>
                      )}

                      {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl shadow-2xl p-2 z-50">
                          {searchResults.map((u) => (
                            <div
                              key={u.id}
                              className="p-3.5 hover:bg-gray-50 dark:hover:bg-muted/20 rounded-xl cursor-pointer flex items-center justify-between group transition-colors"
                              onClick={() => handleSelectGuest(u)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-muted flex items-center justify-center text-slate-700 dark:text-slate-300 font-black group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                  <User className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="font-black text-xs uppercase tracking-tight text-gray-900 dark:text-foreground">
                                    {u.name}
                                  </p>
                                  <p className="text-[10px] text-gray-400 font-bold">
                                    {u.email} • CNIC: {u.cnic || "N/A"}
                                  </p>
                                </div>
                              </div>
                              <UserCheck className="h-4 w-4 text-emerald-600 opacity-0 group-hover:opacity-100 mr-2" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-slate-50 dark:bg-muted/20 border border-gray-200 dark:border-border rounded-2xl p-6 flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 flex items-center justify-center shadow-2xs font-black">
                          <UserCheck className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-gray-900 dark:text-foreground uppercase tracking-tight">
                            {selectedGuest.name}
                          </h3>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                            Linked Existing User Profile ({selectedGuest.email})
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl text-gray-400 hover:text-rose-600 hover:bg-gray-100 dark:hover:bg-muted"
                        onClick={resetGuest}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {!selectedGuest && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Full Legal Name *
                        </Label>
                        <Input
                          name="guestName"
                          value={formData.guestName}
                          onChange={handleInputChange}
                          className="h-12 rounded-xl border-gray-200 dark:border-border font-bold text-xs bg-gray-50/50 dark:bg-muted/20"
                          placeholder="e.g. Muhammad Ahmed Khan"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Email Address *
                        </Label>
                        <Input
                          name="guestEmail"
                          value={formData.guestEmail}
                          onChange={handleInputChange}
                          className="h-12 rounded-xl border-gray-200 dark:border-border font-bold text-xs bg-gray-50/50 dark:bg-muted/20"
                          placeholder="address@domain.com"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Phone Number *
                        </Label>
                        <Input
                          name="guestPhone"
                          value={formData.guestPhone}
                          onChange={handleInputChange}
                          className="h-12 rounded-xl border-gray-200 dark:border-border font-bold text-xs bg-gray-50/50 dark:bg-muted/20"
                          placeholder="03XX-XXXXXXX"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          CNIC Number *
                        </Label>
                        <Input
                          name="cnic"
                          value={formData.cnic}
                          onChange={handleInputChange}
                          className="h-12 rounded-xl border-gray-200 dark:border-border font-bold text-xs bg-gray-50/50 dark:bg-muted/20"
                          placeholder="35202-XXXXXXX-X"
                        />
                      </div>

                      {/* Expanded Profile Fields */}
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Guardian Name
                        </Label>
                        <Input
                          name="guardianName"
                          value={formData.guardianName}
                          onChange={handleInputChange}
                          className="h-12 rounded-xl border-gray-200 dark:border-border font-bold text-xs bg-gray-50/50 dark:bg-muted/20"
                          placeholder="Parent / Guardian Name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Guardian Phone
                        </Label>
                        <Input
                          name="guardianPhone"
                          value={formData.guardianPhone}
                          onChange={handleInputChange}
                          className="h-12 rounded-xl border-gray-200 dark:border-border font-bold text-xs bg-gray-50/50 dark:bg-muted/20"
                          placeholder="03XX-XXXXXXX"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Emergency Contact Number
                        </Label>
                        <Input
                          name="emergencyContact"
                          value={formData.emergencyContact}
                          onChange={handleInputChange}
                          className="h-12 rounded-xl border-gray-200 dark:border-border font-bold text-xs bg-gray-50/50 dark:bg-muted/20"
                          placeholder="Emergency contact #"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          City
                        </Label>
                        <Input
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="h-12 rounded-xl border-gray-200 dark:border-border font-bold text-xs bg-gray-50/50 dark:bg-muted/20"
                          placeholder="City of Residence"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Current Residence
                        </Label>
                        <Input
                          name="currentResidence"
                          value={formData.currentResidence}
                          onChange={handleInputChange}
                          className="h-12 rounded-xl border-gray-200 dark:border-border font-bold text-xs bg-gray-50/50 dark:bg-muted/20"
                          placeholder="Current residence / where currently staying"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Residential Address
                        </Label>
                        <Textarea
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className="min-h-[80px] rounded-xl border-gray-200 dark:border-border font-bold text-xs resize-none p-3.5 bg-gray-50/50 dark:bg-muted/20"
                          placeholder="Full permanent home address..."
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 pt-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Document Images (Identity / CNIC Photos)
                    </Label>
                    <div className="flex items-center gap-3">
                      <label className="h-10 px-4 rounded-xl border border-gray-200 dark:border-border bg-gray-50 dark:bg-muted/10 font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-muted-foreground hover:bg-gray-100 cursor-pointer inline-flex items-center gap-2 transition-all shadow-2xs">
                        <Upload className="h-3.5 w-3.5" />
                        {uploadingImages ? "Uploading..." : "Upload Photos"}
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </label>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                        Max 8 files
                      </span>
                    </div>
                    {(formData.otherImages || []).length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                        {formData.otherImages.map((src, i) => (
                          <div
                            key={`${src}-${i}`}
                            className="relative border border-gray-200 dark:border-border rounded-xl overflow-hidden bg-white dark:bg-card"
                          >
                            <img
                              src={src}
                              alt={`uploaded-${i}`}
                              className="h-20 w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeUploadedImage(i)}
                              className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Assign Room */}
            {step === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-foreground">
                    Hostel & Room Selection
                  </h2>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">
                    Select target hostel branch and available room
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Hostel Branch *
                    </Label>
                    <select
                      className="w-full h-12 rounded-xl border border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/20 px-3 font-bold text-xs uppercase outline-none focus:ring-2 focus:ring-slate-900"
                      value={formData.hostelId}
                      onChange={(e) => {
                        const v = e.target.value;
                        setFormData((p) => ({ ...p, hostelId: v, roomId: "" }));
                      }}
                    >
                      <option value="">Select Hostel Branch...</option>
                      {hostels.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} — {h.city}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Room *
                    </Label>
                    <select
                      className="w-full h-12 rounded-xl border border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/20 px-3 font-bold text-xs uppercase outline-none focus:ring-2 focus:ring-slate-900 disabled:opacity-50"
                      value={formData.roomId}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, roomId: e.target.value }))
                      }
                      disabled={!formData.hostelId}
                    >
                      <option value="">
                        {formData.hostelId
                          ? "Select Room..."
                          : "Choose a hostel branch first..."}
                      </option>
                      {rooms.map((r) => (
                        <option
                          key={r.id}
                          value={r.id}
                          disabled={r.status === "OCCUPIED"}
                        >
                          Room {r.roomNumber} ({r.type}) — PKR{" "}
                          {(r.monthlyrent || r.montlyrent || r.price || 0).toLocaleString()}/mo{" "}
                          {r.status === "OCCUPIED" ? "• [OCCUPIED]" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedRoom && (
                  <div className="bg-slate-50 dark:bg-muted/20 border border-gray-200 dark:border-border rounded-2xl p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">
                        Room Category
                      </p>
                      <p className="font-black text-xs text-gray-900 dark:text-foreground">
                        {selectedRoom.type}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">
                        Bed Capacity
                      </p>
                      <p className="font-black text-xs text-gray-900 dark:text-foreground">
                        {selectedRoom.capacity} Beds
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">
                        Floor Level
                      </p>
                      <p className="font-black text-xs text-gray-900 dark:text-foreground">
                        Level {selectedRoom.floor}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">
                        Base Monthly Rent
                      </p>
                      <p className="font-black text-xs text-emerald-600 dark:text-emerald-400">
                        PKR{" "}
                        {(selectedRoom.monthlyrent ||
                          selectedRoom.montlyrent ||
                          selectedRoom.price ||
                          0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Payment Details */}
            {step === 3 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-foreground">
                    Financial & Timeline Terms
                  </h2>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">
                    Set stay start date, advance months, security deposit, and payment terms
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Check-in Date *
                      </Label>
                      <Input
                        type="date"
                        name="checkIn"
                        value={formData.checkIn}
                        onChange={handleInputChange}
                        className="h-11 rounded-xl border-gray-200 dark:border-border font-bold text-xs bg-gray-50/50 dark:bg-muted/20"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Check-out Date (Optional)
                      </Label>
                      <Input
                        type="date"
                        name="checkOut"
                        value={formData.checkOut}
                        onChange={handleInputChange}
                        className="h-11 rounded-xl border-gray-200 dark:border-border font-bold text-xs bg-gray-50/50 dark:bg-muted/20"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Advance Rent (Months)
                      </Label>
                      <select
                        className="w-full h-11 rounded-xl border border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/20 px-3 font-bold text-xs outline-none"
                        value={formData.advanceMonths.toString()}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            advanceMonths: parseInt(e.target.value),
                          }))
                        }
                      >
                        {[1, 2, 3, 6, 12].map((m) => (
                          <option key={m} value={m.toString()}>
                            {m} Month{m > 1 ? "s" : ""} Advance
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Booking Status
                        </Label>
                        <select
                          className="w-full h-11 rounded-xl border border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/20 px-3 font-bold text-xs outline-none"
                          value={formData.status}
                          onChange={(e) =>
                            setFormData((p) => ({ ...p, status: e.target.value }))
                          }
                        >
                          <option value="PENDING">Pending</option>
                          <option value="CONFIRMED">Confirmed</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Payment Status
                        </Label>
                        <select
                          className="w-full h-11 rounded-xl border border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/20 px-3 font-bold text-xs outline-none"
                          value={formData.paymentStatus}
                          onChange={(e) =>
                            setFormData((p) => ({ ...p, paymentStatus: e.target.value }))
                          }
                        >
                          <option value="PENDING">Pending</option>
                          <option value="PAID">Paid</option>
                        </select>
                      </div>

                      {formData.paymentStatus === "PAID" && (
                        <div className="space-y-1.5 col-span-2">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            Payment Method
                          </Label>
                          <select
                            className="w-full h-11 rounded-xl border border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/20 px-3 font-bold text-xs outline-none"
                            value={formData.paymentMethod}
                            onChange={(e) =>
                              setFormData((p) => ({ ...p, paymentMethod: e.target.value }))
                            }
                          >
                            <option value="CASH">Cash</option>
                            <option value="BANK_TRANSFER">Bank Transfer</option>
                            <option value="CREDIT_CARD">Credit Card</option>
                            <option value="CHEQUE">Cheque</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Soft Slate Financial Summary Card */}
                  <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 space-y-6 shadow-md dark:bg-card dark:border dark:border-border">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-800 dark:border-border">
                      <div className="h-9 w-9 rounded-xl bg-white/10 dark:bg-muted flex items-center justify-center">
                        <ShieldCheck className="h-5 w-5 text-emerald-400" />
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-wider">
                        Initial Financial Ledger
                      </h4>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                          Monthly Rent (PKR)
                        </span>
                        <Input
                          type="number"
                          name="monthlyRent"
                          value={formData.monthlyRent}
                          onChange={handleInputChange}
                          className="h-10 bg-white/10 border-white/20 text-white dark:bg-muted dark:text-foreground font-bold rounded-xl text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                          Security Deposit (PKR)
                        </span>
                        <Input
                          type="number"
                          name="securityDeposit"
                          value={formData.securityDeposit}
                          onChange={handleInputChange}
                          className="h-10 bg-white/10 border-white/20 text-white dark:bg-muted dark:text-foreground font-bold rounded-xl text-xs"
                        />
                      </div>

                      <div className="flex justify-between items-center text-slate-300 dark:text-muted-foreground text-xs pt-1">
                        <span className="text-[9px] font-black uppercase tracking-wider">
                          Rent ({formData.advanceMonths} mo)
                        </span>
                        <span className="font-bold text-white dark:text-foreground">
                          PKR{" "}
                          {((parseFloat(formData.monthlyRent) || 0) * formData.advanceMonths).toLocaleString()}
                        </span>
                      </div>

                      <div className="h-px bg-slate-800 dark:bg-border my-2" />

                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                          Calculated Total Amount
                        </span>
                        <Input
                          type="number"
                          name="totalAmount"
                          value={formData.totalAmount}
                          onChange={handleInputChange}
                          className="h-12 bg-white/15 border-white/30 text-white dark:bg-muted dark:text-foreground font-black text-xl rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Final Review */}
            {step === 4 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-foreground">
                    Review Booking Summary
                  </h2>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">
                    Verify all booking details before saving to registry
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50/70 dark:bg-muted/20 rounded-2xl p-5 border border-gray-100 dark:border-border flex items-center gap-4">
                    <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-muted flex items-center justify-center text-slate-700 dark:text-slate-300 font-black shrink-0">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                        Resident Guest
                      </p>
                      <h4 className="text-xs font-black text-gray-900 dark:text-foreground truncate uppercase">
                        {formData.guestName}
                      </h4>
                      <p className="text-[10px] font-bold text-gray-500 truncate">
                        {formData.guestEmail}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50/70 dark:bg-muted/20 rounded-2xl p-5 border border-gray-100 dark:border-border flex items-center gap-4">
                    <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-muted flex items-center justify-center text-slate-700 dark:text-slate-300 font-black shrink-0">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                        Hostel & Room
                      </p>
                      <h4 className="text-xs font-black text-gray-900 dark:text-foreground uppercase truncate">
                        Room {selectedRoom?.roomNumber}
                      </h4>
                      <p className="text-[10px] font-bold text-gray-500 truncate">
                        {hostels.find((h) => h.id === formData.hostelId)?.name}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50/70 dark:bg-muted/20 rounded-2xl p-5 border border-gray-100 dark:border-border flex items-center gap-4">
                    <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-muted flex items-center justify-center text-slate-700 dark:text-slate-300 font-black shrink-0">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                        Stay Duration
                      </p>
                      <h4 className="text-xs font-black text-gray-900 dark:text-foreground uppercase">
                        Starts: {formData.checkIn}
                      </h4>
                      <p className="text-[10px] font-bold text-gray-500">
                        {formData.checkOut ? `Ends: ${formData.checkOut}` : "Continuous Stay"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-900 text-white dark:bg-card dark:border dark:border-border rounded-2xl p-5 flex items-center justify-between shadow-2xs">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                        Initial Total Payment
                      </p>
                      <h4 className="text-xl font-black text-white dark:text-foreground">
                        PKR {Number(formData.totalAmount).toLocaleString()}
                      </h4>
                      <p className="text-[9px] font-bold text-slate-300 dark:text-muted-foreground mt-0.5">
                        {formData.advanceMonths} Mo Rent + Deposit (PKR {Number(formData.securityDeposit || 0).toLocaleString()})
                      </p>
                    </div>
                    <ShieldCheck className="h-6 w-6 text-emerald-400 shrink-0" />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-muted/20 rounded-2xl border border-gray-200 dark:border-border">
                  <AlertCircle className="h-4 w-4 text-slate-700 dark:text-slate-300 shrink-0" />
                  <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider leading-relaxed">
                    By confirming, the room status will be updated and automated booking confirmation notifications will be dispatched.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50/80 dark:bg-muted/30 border-t border-gray-100 dark:border-border px-6 md:px-10 py-5 flex items-center justify-between">
            <Button
              variant="outline"
              className="h-11 px-8 rounded-xl border-gray-200 dark:border-border bg-white dark:bg-card font-bold text-xs uppercase tracking-wider hover:bg-gray-100 disabled:opacity-30"
              onClick={handleBack}
              disabled={step === 1}
            >
              Back
            </Button>

            {step < 4 ? (
              <Button
                className="h-11 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 font-black text-xs uppercase tracking-wider shadow-sm group"
                onClick={handleNext}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
              </Button>
            ) : (
              <Button
                className="h-11 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 font-black text-xs uppercase tracking-wider shadow-sm flex items-center gap-2 active:scale-95 transition-all"
                onClick={handleSubmit}
                disabled={createBooking.isPending}
              >
                {createBooking.isPending ? "Saving..." : "Confirm Booking"}
                <ShieldCheck className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBookingPage;
