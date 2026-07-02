"use client"
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    ChevronRight,
    User,
    Mail,
    Phone,
    Lock,
    Building2,
    Briefcase,
    ShieldCheck,
    CheckCircle2,
    AlertCircle,
    Eye,
    EyeOff,
    UserPlus,
    CreditCard,
    MapPin,
    Users,
    UserCog,
    Shield,
    Loader2,
    Home,
    DollarSign,
    Contact2,
    Zap,
    Upload,
    X,
    Calendar,
    Bed,
    Receipt
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
import { Badge } from "@/components/ui/badge";
import { useCreateUser } from "@/hooks/useUsers";
import { useHostel } from "@/hooks/usehostel";
import useAuthStore from "@/hooks/Authstate";
import { toast } from "sonner";

const ROLES = [
    { value: "RESIDENT", label: "Resident", icon: User, color: "text-slate-800 dark:text-slate-200", bg: "bg-slate-100 dark:bg-muted", desc: "Hostel resident / tenant" },
    { value: "GUEST", label: "Guest", icon: Users, color: "text-slate-800 dark:text-slate-200", bg: "bg-slate-100 dark:bg-muted", desc: "Short-term / temporary guest" },
    { value: "STAFF", label: "Staff", icon: Briefcase, color: "text-slate-800 dark:text-slate-200", bg: "bg-slate-100 dark:bg-muted", desc: "Hostel staff member" },
    { value: "WARDEN", label: "Warden", icon: UserCog, color: "text-slate-800 dark:text-slate-200", bg: "bg-slate-100 dark:bg-muted", desc: "Hostel warden / manager" },
];

const ADMIN_ONLY_ROLES = ["WARDEN", "ADMIN"];

const STEPS = [
    { id: 1, label: "Role", icon: Shield },
    { id: 2, label: "Identity", icon: User },
    { id: 3, label: "Assignment", icon: Building2 },
    { id: 4, label: "Security", icon: Lock },
    { id: 5, label: "Review", icon: CheckCircle2 },
];

const defaultForm = {
    name: "",
    email: "",
    phone: "",
    cnic: "",
    address: "",
    city: "",
    role: "",
    hostelId: "",
    designation: "",
    basicSalary: "",
    guardianName: "",
    guardianPhone: "",
    emergencyContact: "",
    currentResidence: "",
    otherImages: [],
    password: "hostel@123",
    canManageExpenses: false,
    canManageMess: false,
    canManageGeneral: false,
    canManageUtilities: false,
    canManageMaintenance: false,
    canManageSalaries: false,

    // Initial Booking Creation Fields
    createBooking: false,
    roomId: "",
    monthlyRent: "",
    securityDeposit: "",
    checkIn: new Date().toISOString().split("T")[0],
    paymentStatus: "PAID",
    paymentMethod: "CASH",
};

export default function RegisterUserPage() {
    const router = useRouter();
    const { user: currentUser } = useAuthStore();
    const createUser = useCreateUser();
    const { data: hostelsData, isLoading: hostelsLoading } = useHostel();
    const hostels = hostelsData?.data || [];

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState(defaultForm);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [uploadingImages, setUploadingImages] = useState(false);
    const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

    const isAdmin = currentUser?.role === "ADMIN";
    const isWarden = currentUser?.role === "WARDEN";

    // Wardens can only register RESIDENT and GUEST
    const availableRoles = isAdmin
        ? ROLES
        : ROLES.filter(r => !ADMIN_ONLY_ROLES.includes(r.value));

    // Auto-assign warden's hostel
    useEffect(() => {
        if (isWarden && currentUser?.hostelId && !formData.hostelId) {
            setFormData(prev => ({ ...prev, hostelId: currentUser.hostelId }));
        }
    }, [currentUser, isWarden]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    };

    const validateStep = () => {
        const newErrors = {};
        if (step === 1 && !formData.role) newErrors.role = "Please select a role";
        if (step === 2) {
            if (!formData.name.trim()) newErrors.name = "Full name is required";
            if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Valid email is required";
            if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
            if (!formData.cnic.trim()) newErrors.cnic = "CNIC is required";
        }
        if (step === 3) {
            if (!formData.hostelId) newErrors.hostelId = "Hostel assignment is required";
            if ((formData.role === "STAFF" || formData.role === "WARDEN") && !formData.designation.trim()) {
                newErrors.designation = "Designation is required for staff/warden";
            }
            if (formData.createBooking) {
                if (!formData.roomId) newErrors.roomId = "Please select a room for initial booking";
                if (!formData.monthlyRent || isNaN(formData.monthlyRent)) newErrors.monthlyRent = "Valid monthly rent is required";
            }
        }
        if (step === 4) {
            if (!formData.password || formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep()) setStep(s => s + 1);
    };

    const handleBack = () => setStep(s => s - 1);

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

                const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                    method: "POST",
                    body,
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data?.error?.message || "Image upload failed");
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

    const handleSubmit = async () => {
        try {
            setIsSubmittingBooking(true);
            const createdUser = await createUser.mutateAsync({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                cnic: formData.cnic,
                address: formData.address,
                role: formData.role,
                hostelId: formData.hostelId || null,
                designation: formData.designation || null,
                basicSalary: formData.basicSalary ? Number(formData.basicSalary) : 0,
                city: formData.city || null,
                guardianName: formData.guardianName || null,
                guardianPhone: formData.guardianPhone || null,
                emergencyContact: formData.emergencyContact || null,
                currentResidence: formData.currentResidence || null,
                otherImages: formData.otherImages || [],
                password: formData.password,
                canManageExpenses: formData.role === "WARDEN" ? formData.canManageExpenses : false,
                canManageMess: formData.role === "WARDEN" ? formData.canManageMess : false,
                canManageGeneral: formData.role === "WARDEN" ? formData.canManageGeneral : false,
                canManageUtilities: formData.role === "WARDEN" ? formData.canManageUtilities : false,
                canManageMaintenance: formData.role === "WARDEN" ? formData.canManageMaintenance : false,
                canManageSalaries: formData.role === "WARDEN" ? formData.canManageSalaries : false,
            });

            // Handle optional initial booking creation
            if (formData.createBooking && formData.roomId && createdUser?.id) {
                const bookingRes = await fetch("/api/bookings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId: createdUser.id,
                        roomId: formData.roomId,
                        checkIn: formData.checkIn,
                        monthlyRent: Number(formData.monthlyRent || 0),
                        securityDeposit: Number(formData.securityDeposit || 0),
                        totalAmount: Number(formData.monthlyRent || 0) + Number(formData.securityDeposit || 0),
                        status: "CHECKED_IN",
                        paymentStatus: formData.paymentStatus,
                        paymentMethod: formData.paymentMethod,
                        guestName: formData.name,
                        guestEmail: formData.email,
                        guestPhone: formData.phone,
                        cnic: formData.cnic,
                    }),
                });

                if (bookingRes.ok) {
                    toast.success("Initial room booking registered successfully");
                } else {
                    const bErr = await bookingRes.json();
                    toast.error(bErr.error || "User created, but booking initialization failed");
                }
            }

            if (isAdmin) router.push("/admin/users-records");
            else router.push("/warden/residents");
        } catch (err) {
            const msg = err?.message || "Failed to create user";
            toast.error(msg);
            if (msg.toLowerCase().includes("email")) {
                setErrors(prev => ({ ...prev, email: "Email address is already registered with another user" }));
                setStep(2);
            } else if (msg.toLowerCase().includes("phone")) {
                setErrors(prev => ({ ...prev, phone: "Phone number is already registered with another user" }));
                setStep(2);
            } else if (msg.toLowerCase().includes("cnic")) {
                setErrors(prev => ({ ...prev, cnic: "CNIC is already registered with another user" }));
                setStep(2);
            }
        } finally {
            setIsSubmittingBooking(false);
        }
    };

    const selectedRole = ROLES.find(r => r.value === formData.role);
    const selectedHostel = hostels.find(h => h.id === formData.hostelId);
    const hostelRooms = selectedHostel?.Room || [];

    const isStaffLike = formData.role === "STAFF" || formData.role === "WARDEN";
    const isResidentLike = formData.role === "RESIDENT" || formData.role === "GUEST";

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-background/95 pb-24 font-sans antialiased">
            {/* Top Glassmorphic Navbar */}
            <div className="bg-white/85 dark:bg-card/85 backdrop-blur-md border-b border-gray-200/70 dark:border-border/70 sticky top-0 z-50 h-16 shadow-2xs">
                <div className="max-w-[1100px] mx-auto px-4 md:px-8 h-full flex items-center justify-between gap-4">
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
                        <div>
                            <h1 className="text-sm font-black text-gray-900 dark:text-foreground uppercase tracking-tight leading-none">
                                User Account Registration
                            </h1>
                            <p className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest mt-1">
                                {isAdmin ? "Admin Directory" : "Warden Panel"} · Authorized User Enrollment
                            </p>
                        </div>
                    </div>

                    {/* Stepper indicators */}
                    <div className="flex items-center gap-1.5">
                        {STEPS.map((s) => {
                            const Icon = s.icon;
                            const isActive = step === s.id;
                            const isDone = step > s.id;
                            return (
                                <div
                                    key={s.id}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                                        isActive
                                            ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs font-black'
                                            : isDone
                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                : 'bg-gray-100 text-gray-400 dark:bg-muted dark:text-muted-foreground'
                                    }`}
                                >
                                    {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                                    <span className="text-[9px] font-bold uppercase tracking-wider hidden sm:block">{s.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="max-w-[900px] mx-auto px-4 md:px-8 py-8">
                <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-3xl shadow-2xs overflow-hidden">
                    {/* Progress bar */}
                    <div className="h-1 bg-gray-100 dark:bg-muted">
                        <div
                            className="h-full bg-slate-900 dark:bg-slate-100 transition-all duration-500 ease-out"
                            style={{ width: `${(step / STEPS.length) * 100}%` }}
                        />
                    </div>

                    <div className="p-6 md:p-10">
                        {/* ─── STEP 1: Role Selection ─── */}
                        {step === 1 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-foreground">Select Account Role</h2>
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest mt-1">
                                        Choose the system permission level for this user account
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {availableRoles.map(role => {
                                        const Icon = role.icon;
                                        const isSelected = formData.role === role.value;
                                        return (
                                            <button
                                                key={role.value}
                                                type="button"
                                                onClick={() => handleChange("role", role.value)}
                                                className={`relative p-6 rounded-3xl border text-left transition-all duration-200 group ${
                                                    isSelected
                                                        ? "border-slate-900 bg-slate-50/70 dark:border-border dark:bg-muted/30 shadow-2xs"
                                                        : "border-gray-100 dark:border-border bg-gray-50/50 dark:bg-muted/10 hover:border-gray-200 dark:hover:border-border hover:bg-white dark:hover:bg-card"
                                                }`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${isSelected ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs" : "bg-gray-100 dark:bg-muted text-gray-600 dark:text-muted-foreground"}`}>
                                                        <Icon className="h-6 w-6" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`font-black text-sm uppercase tracking-wider ${isSelected ? "text-slate-900 dark:text-white" : "text-gray-900 dark:text-foreground"}`}>{role.label}</p>
                                                        <p className="text-[10px] text-gray-400 dark:text-muted-foreground font-semibold mt-0.5">{role.desc}</p>
                                                    </div>
                                                    {isSelected && (
                                                        <CheckCircle2 className="h-5 w-5 text-slate-900 dark:text-slate-100 absolute top-4 right-4" />
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {errors.role && (
                                    <div className="flex items-center gap-2 text-rose-600">
                                        <AlertCircle className="h-4 w-4" />
                                        <span className="text-xs font-bold">{errors.role}</span>
                                    </div>
                                )}

                                {!isAdmin && (
                                    <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-muted/20 rounded-2xl border border-gray-200 dark:border-border">
                                        <ShieldCheck className="h-4 w-4 text-slate-700 dark:text-slate-300 shrink-0" />
                                        <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                            Warden Notice: You are authorized to register Residents and Guests for your assigned hostel.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ─── STEP 2: Identity ─── */}
                        {step === 2 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-foreground">Identity Details</h2>
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest mt-1">Personal identity information for {selectedRole?.label}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5 md:col-span-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Full Name *</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={e => handleChange("name", e.target.value)}
                                            placeholder="e.g. Muhammad Ahmed Khan"
                                            className={`h-12 rounded-xl border-gray-200 dark:border-border font-bold text-xs bg-gray-50/50 dark:bg-muted/20 ${errors.name ? "border-rose-400" : ""}`}
                                        />
                                        {errors.name && <p className="text-xs text-rose-500 font-bold">{errors.name}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Email Address *</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                type="email"
                                                value={formData.email}
                                                onChange={e => handleChange("email", e.target.value)}
                                                placeholder="user@example.com"
                                                className={`h-12 pl-11 rounded-xl border-gray-200 dark:border-border font-bold text-xs bg-gray-50/50 dark:bg-muted/20 ${errors.email ? "border-rose-400" : ""}`}
                                            />
                                        </div>
                                        {errors.email && <p className="text-xs text-rose-500 font-bold">{errors.email}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Phone Number *</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={e => handleChange("phone", e.target.value)}
                                                placeholder="0321-1234567"
                                                className={`h-12 pl-11 rounded-xl border-gray-200 dark:border-border font-bold text-xs bg-gray-50/50 dark:bg-muted/20 ${errors.phone ? "border-rose-400" : ""}`}
                                            />
                                        </div>
                                        {errors.phone && <p className="text-xs text-rose-500 font-bold">{errors.phone}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">CNIC Number *</Label>
                                        <div className="relative">
                                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                value={formData.cnic}
                                                onChange={e => handleChange("cnic", e.target.value)}
                                                placeholder="35202-XXXXXXX-X"
                                                className={`h-12 pl-11 rounded-xl border-gray-200 dark:border-border font-bold text-xs bg-gray-50/50 dark:bg-muted/20 ${errors.cnic ? "border-rose-400" : ""}`}
                                            />
                                        </div>
                                        {errors.cnic && <p className="text-xs text-rose-500 font-bold">{errors.cnic}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">City</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                value={formData.city}
                                                onChange={e => handleChange("city", e.target.value)}
                                                placeholder="e.g. Lahore"
                                                className="h-12 pl-11 rounded-xl border-gray-200 dark:border-border font-bold text-xs bg-gray-50/50 dark:bg-muted/20"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 md:col-span-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Permanent Residence Address</Label>
                                        <Textarea
                                            value={formData.address}
                                            onChange={e => handleChange("address", e.target.value)}
                                            placeholder="Full permanent home address..."
                                            className="min-h-[80px] rounded-xl border-gray-200 dark:border-border font-bold text-xs resize-none p-3.5 bg-gray-50/50 dark:bg-muted/20"
                                        />
                                    </div>

                                    {/* Resident/Guest extra identity fields */}
                                    {isResidentLike && (
                                        <>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Guardian / Father Name</Label>
                                                <div className="relative">
                                                    <Contact2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <Input
                                                        value={formData.guardianName}
                                                        onChange={e => handleChange("guardianName", e.target.value)}
                                                        placeholder="Guardian Name"
                                                        className="h-12 pl-11 rounded-xl border-gray-200 dark:border-border font-bold text-xs bg-gray-50/50 dark:bg-muted/20"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Guardian Phone</Label>
                                                <div className="relative">
                                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <Input
                                                        value={formData.guardianPhone}
                                                        onChange={e => handleChange("guardianPhone", e.target.value)}
                                                        placeholder="03XX-XXXXXXX"
                                                        className="h-12 pl-11 rounded-xl border-gray-200 dark:border-border font-bold text-xs bg-gray-50/50 dark:bg-muted/20"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5 md:col-span-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Emergency Contact Number</Label>
                                                <div className="relative">
                                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <Input
                                                        value={formData.emergencyContact}
                                                        onChange={e => handleChange("emergencyContact", e.target.value)}
                                                        placeholder="Emergency contact number"
                                                        className="h-12 pl-11 rounded-xl border-gray-200 dark:border-border font-bold text-xs bg-gray-50/50 dark:bg-muted/20"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5 md:col-span-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Document Uploads (Identity / CNIC Images)</Label>
                                                <div className="rounded-2xl border border-dashed border-gray-200 dark:border-border p-4 bg-gray-50 dark:bg-muted/10">
                                                    <label className="h-10 px-4 rounded-xl bg-white dark:bg-card border border-gray-200 dark:border-border inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-700 dark:text-muted-foreground cursor-pointer hover:bg-gray-100 transition-all shadow-2xs">
                                                        <Upload className="h-3.5 w-3.5" />
                                                        {uploadingImages ? "Uploading..." : "Upload Document Images"}
                                                        <input
                                                            type="file"
                                                            multiple
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={handleImageUpload}
                                                            disabled={uploadingImages}
                                                        />
                                                    </label>
                                                    <p className="text-[9px] text-gray-400 dark:text-muted-foreground font-bold uppercase tracking-wider mt-2">
                                                        Up to 8 document photos (CNIC, Student ID, Passport).
                                                    </p>
                                                </div>
                                                {(formData.otherImages || []).length > 0 && (
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                                                        {formData.otherImages.map((src, idx) => (
                                                            <div key={`${src}-${idx}`} className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-border bg-white dark:bg-card">
                                                                <img src={src} alt={`doc-${idx}`} className="h-20 w-full object-cover" />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeUploadedImage(idx)}
                                                                    className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black"
                                                                >
                                                                    <X className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ─── STEP 3: Assignment & Booking Creation ─── */}
                        {step === 3 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-foreground">Hostel & Room Assignment</h2>
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest mt-1">
                                        Assign hostel branch {isResidentLike && "and optionally register initial room booking"}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5 md:col-span-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Assigned Hostel Branch *</Label>
                                        {isWarden ? (
                                            <div className="h-12 rounded-xl border border-gray-200 dark:border-border bg-gray-50 dark:bg-muted/20 flex items-center px-4 gap-3">
                                                <Building2 className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                                                <span className="font-bold text-xs text-gray-900 dark:text-foreground">
                                                    {hostels.find(h => h.id === currentUser?.hostelId)?.name || "Your Assigned Hostel"}
                                                </span>
                                                <Badge className="ml-auto text-[9px] font-bold uppercase bg-slate-100 text-slate-700 border-gray-200">Auto-Assigned</Badge>
                                            </div>
                                        ) : (
                                            <select
                                                className={`w-full h-12 rounded-xl border border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/20 px-3 font-bold text-xs uppercase outline-none focus:ring-2 focus:ring-slate-900 ${errors.hostelId ? "border-rose-400" : ""}`}
                                                value={formData.hostelId}
                                                onChange={e => handleChange("hostelId", e.target.value)}
                                            >
                                                <option value="">Select a hostel branch...</option>
                                                {hostels.map(h => (
                                                    <option key={h.id} value={h.id}>{h.name} — {h.city}</option>
                                                ))}
                                            </select>
                                        )}
                                        {errors.hostelId && <p className="text-xs text-rose-500 font-bold">{errors.hostelId}</p>}
                                    </div>

                                    {/* Integrated Initial Booking Setup for Residents & Guests */}
                                    {isResidentLike && formData.hostelId && (
                                        <div className="md:col-span-2 p-5 rounded-2xl bg-gray-50/80 dark:bg-muted/20 border border-gray-200 dark:border-border space-y-4">
                                            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-border/60">
                                                <div className="flex items-center gap-2.5">
                                                    <Bed className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                                                    <div>
                                                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-foreground">
                                                            Initial Room Booking System
                                                        </h3>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                                            Register room stay and initial payment during enrollment
                                                        </p>
                                                    </div>
                                                </div>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-900"
                                                        checked={formData.createBooking}
                                                        onChange={(e) => handleChange("createBooking", e.target.checked)}
                                                    />
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-foreground">
                                                        Create Booking Now
                                                    </span>
                                                </label>
                                            </div>

                                            {formData.createBooking && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 animate-in fade-in duration-300">
                                                    <div className="space-y-1.5 md:col-span-2">
                                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Select Room *</Label>
                                                        <select
                                                            className={`w-full h-11 rounded-xl border border-gray-200 dark:border-border bg-white dark:bg-card px-3 font-bold text-xs uppercase outline-none ${errors.roomId ? "border-rose-400" : ""}`}
                                                            value={formData.roomId}
                                                            onChange={e => {
                                                                const rId = e.target.value;
                                                                const rm = hostelRooms.find(r => r.id === rId);
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    roomId: rId,
                                                                    monthlyRent: rm?.price || prev.monthlyRent || "",
                                                                }));
                                                            }}
                                                        >
                                                            <option value="">Choose room...</option>
                                                            {hostelRooms.map(r => (
                                                                <option key={r.id} value={r.id}>
                                                                    Room {r.roomNumber} ({r.type}) — Capacity: {r.capacity} — PKR {r.price?.toLocaleString()}/mo — Status: {r.status}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {errors.roomId && <p className="text-xs text-rose-500 font-bold">{errors.roomId}</p>}
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Monthly Rent (PKR) *</Label>
                                                        <Input
                                                            type="number"
                                                            value={formData.monthlyRent}
                                                            onChange={e => handleChange("monthlyRent", e.target.value)}
                                                            placeholder="18000"
                                                            className={`h-11 rounded-xl border-gray-200 dark:border-border font-bold text-xs bg-white dark:bg-card ${errors.monthlyRent ? "border-rose-400" : ""}`}
                                                        />
                                                        {errors.monthlyRent && <p className="text-xs text-rose-500 font-bold">{errors.monthlyRent}</p>}
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Security Deposit (PKR)</Label>
                                                        <Input
                                                            type="number"
                                                            value={formData.securityDeposit}
                                                            onChange={e => handleChange("securityDeposit", e.target.value)}
                                                            placeholder="5000"
                                                            className="h-11 rounded-xl border-gray-200 dark:border-border font-bold text-xs bg-white dark:bg-card"
                                                        />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Check-In Date</Label>
                                                        <Input
                                                            type="date"
                                                            value={formData.checkIn}
                                                            onChange={e => handleChange("checkIn", e.target.value)}
                                                            className="h-11 rounded-xl border-gray-200 dark:border-border font-bold text-xs bg-white dark:bg-card"
                                                        />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Payment Method</Label>
                                                        <select
                                                            className="w-full h-11 rounded-xl border border-gray-200 dark:border-border bg-white dark:bg-card px-3 font-bold text-xs outline-none"
                                                            value={formData.paymentMethod}
                                                            onChange={e => handleChange("paymentMethod", e.target.value)}
                                                        >
                                                            <option value="CASH">Cash</option>
                                                            <option value="CARD">Card</option>
                                                            <option value="BANK_TRANSFER">Bank Transfer</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Staff / Warden specific fields */}
                                    {isStaffLike && (
                                        <>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Designation *</Label>
                                                <div className="relative">
                                                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <Input
                                                        value={formData.designation}
                                                        onChange={e => handleChange("designation", e.target.value)}
                                                        placeholder={formData.role === "WARDEN" ? "Hostel Warden" : "e.g. Security Supervisor"}
                                                        className={`h-12 pl-11 rounded-xl border-gray-200 dark:border-border font-bold text-xs bg-gray-50/50 dark:bg-muted/20 ${errors.designation ? "border-rose-400" : ""}`}
                                                    />
                                                </div>
                                                {errors.designation && <p className="text-xs text-rose-500 font-bold">{errors.designation}</p>}
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Basic Monthly Salary (PKR)</Label>
                                                <div className="relative">
                                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <Input
                                                        type="number"
                                                        value={formData.basicSalary}
                                                        onChange={e => handleChange("basicSalary", e.target.value)}
                                                        placeholder="35000"
                                                        className="h-12 pl-11 rounded-xl border-gray-200 dark:border-border font-bold text-xs bg-gray-50/50 dark:bg-muted/20"
                                                    />
                                                </div>
                                            </div>

                                            {formData.role === "WARDEN" && (
                                                <div className="space-y-4 pt-2 md:col-span-2 bg-gray-50 dark:bg-muted/20 p-5 rounded-2xl border border-gray-200 dark:border-border">
                                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Expense Permissions</Label>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="flex items-center gap-2.5 col-span-2 pb-2 border-b border-gray-200 dark:border-border">
                                                            <input
                                                                type="checkbox"
                                                                id="canManageExpenses"
                                                                checked={formData.canManageExpenses}
                                                                onChange={(e) => handleChange("canManageExpenses", e.target.checked)}
                                                                className="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-900"
                                                            />
                                                            <Label htmlFor="canManageExpenses" className="text-[11px] font-bold text-gray-900 dark:text-foreground cursor-pointer uppercase">
                                                                Master Access (All Expenses)
                                                            </Label>
                                                        </div>

                                                        {[
                                                            { id: 'canManageMess', label: 'Mess' },
                                                            { id: 'canManageGeneral', label: 'General' },
                                                            { id: 'canManageUtilities', label: 'Utilities' },
                                                            { id: 'canManageMaintenance', label: 'Maintenance' },
                                                            { id: 'canManageSalaries', label: 'Salaries' },
                                                        ].map((perm) => (
                                                            <div key={perm.id} className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    id={perm.id}
                                                                    disabled={formData.canManageExpenses}
                                                                    checked={formData.canManageExpenses || formData[perm.id]}
                                                                    onChange={(e) => handleChange(perm.id, e.target.checked)}
                                                                    className="h-3.5 w-3.5 rounded border-gray-300 text-slate-900 focus:ring-slate-900"
                                                                />
                                                                <Label htmlFor={perm.id} className={`text-[10px] font-bold uppercase cursor-pointer ${formData.canManageExpenses ? 'text-gray-300' : 'text-gray-600 dark:text-muted-foreground'}`}>
                                                                    {perm.label}
                                                                </Label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ─── STEP 4: Security / Password ─── */}
                        {step === 4 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-foreground">Access Credentials</h2>
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest mt-1">Set login password for this account</p>
                                </div>

                                <div className="space-y-4 max-w-md">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Initial Login Password *</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                value={formData.password}
                                                onChange={e => handleChange("password", e.target.value)}
                                                className={`h-12 pl-11 pr-12 rounded-xl border-gray-200 dark:border-border font-bold text-xs bg-gray-50/50 dark:bg-muted/20 ${errors.password ? "border-rose-400" : ""}`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(v => !v)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {errors.password && <p className="text-xs text-rose-500 font-bold">{errors.password}</p>}
                                    </div>

                                    <div className="p-4 bg-slate-50 dark:bg-muted/20 rounded-2xl border border-gray-200 dark:border-border space-y-1">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                                            <p className="text-[10px] font-black text-slate-900 dark:text-foreground uppercase tracking-wider">Default Key Notice</p>
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-muted-foreground leading-relaxed">
                                            Share this password securely with the user. Default key is <span className="font-bold font-mono">hostel@123</span>.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ─── STEP 5: Review ─── */}
                        {step === 5 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-foreground">Review & Confirm</h2>
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest mt-1">Verify all account enrollment details before finalizing</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-5 rounded-2xl bg-gray-50/70 dark:bg-muted/20 border border-gray-100 dark:border-border flex items-center gap-4">
                                        <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-muted flex items-center justify-center text-slate-700 dark:text-slate-300 font-black shrink-0">
                                            {selectedRole && <selectedRole.icon className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Account Role</p>
                                            <p className="font-black text-gray-900 dark:text-foreground text-xs uppercase">{selectedRole?.label}</p>
                                        </div>
                                    </div>

                                    <div className="p-5 rounded-2xl bg-gray-50/70 dark:bg-muted/20 border border-gray-100 dark:border-border flex items-center gap-4">
                                        <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-muted flex items-center justify-center text-slate-700 dark:text-slate-300 font-black shrink-0">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">User Identity</p>
                                            <p className="font-black text-gray-900 dark:text-foreground text-xs truncate">{formData.name}</p>
                                            <p className="text-[10px] text-gray-500 font-bold truncate">{formData.email}</p>
                                        </div>
                                    </div>

                                    <div className="p-5 rounded-2xl bg-gray-50/70 dark:bg-muted/20 border border-gray-100 dark:border-border flex items-center gap-4">
                                        <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-muted flex items-center justify-center text-slate-700 dark:text-slate-300 font-black shrink-0">
                                            <Phone className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Contact Info</p>
                                            <p className="font-black text-gray-900 dark:text-foreground text-xs">{formData.phone}</p>
                                            <p className="text-[10px] text-gray-500 font-bold">CNIC: {formData.cnic}</p>
                                        </div>
                                    </div>

                                    <div className="p-5 rounded-2xl bg-gray-50/70 dark:bg-muted/20 border border-gray-100 dark:border-border flex items-center gap-4">
                                        <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-muted flex items-center justify-center text-slate-700 dark:text-slate-300 font-black shrink-0">
                                            <Building2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Hostel Branch</p>
                                            <p className="font-black text-gray-900 dark:text-foreground text-xs">{selectedHostel?.name || "Global / Unassigned"}</p>
                                            {selectedHostel?.city && <p className="text-[10px] text-gray-500 font-bold">{selectedHostel.city}</p>}
                                        </div>
                                    </div>

                                    {formData.createBooking && (
                                        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-muted/20 border border-gray-200 dark:border-border md:col-span-2 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Bed className="h-4 w-4" /> Initial Booking Summary
                                                </span>
                                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-black text-[8px] uppercase">Ready</Badge>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                                                <div><span className="text-[9px] font-bold text-gray-400 block">Room</span><span className="font-black text-gray-900 dark:text-foreground">Room {hostelRooms.find(r => r.id === formData.roomId)?.roomNumber}</span></div>
                                                <div><span className="text-[9px] font-bold text-gray-400 block">Rent / Mo</span><span className="font-black text-emerald-600">PKR {Number(formData.monthlyRent).toLocaleString()}</span></div>
                                                <div><span className="text-[9px] font-bold text-gray-400 block">Security Deposit</span><span className="font-black text-gray-900 dark:text-foreground">PKR {Number(formData.securityDeposit || 0).toLocaleString()}</span></div>
                                            </div>
                                        </div>
                                    )}

                                    {isStaffLike && (
                                        <div className="p-5 rounded-2xl bg-gray-50/70 dark:bg-muted/20 border border-gray-100 dark:border-border flex items-center gap-4 md:col-span-2">
                                            <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-muted flex items-center justify-center text-slate-700 dark:text-slate-300 font-black shrink-0">
                                                <Briefcase className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Staff Position Details</p>
                                                <p className="font-black text-gray-900 dark:text-foreground text-xs">{formData.designation}</p>
                                                {formData.basicSalary && <p className="text-[10px] text-gray-500 font-bold">Salary: PKR {Number(formData.basicSalary).toLocaleString()}</p>}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-muted/20 rounded-2xl border border-gray-200 dark:border-border">
                                    <ShieldCheck className="h-5 w-5 text-slate-700 dark:text-slate-300 shrink-0" />
                                    <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider leading-relaxed">
                                        By confirming, the user account and initial room booking (if selected) will be initialized immediately.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Navigation Actions */}
                    <div className="bg-gray-50/80 dark:bg-muted/30 border-t border-gray-100 dark:border-border px-6 md:px-10 py-5 flex items-center justify-between">
                        <Button
                            variant="outline"
                            className="h-11 px-8 rounded-xl border-gray-200 dark:border-border bg-white dark:bg-card font-bold text-xs uppercase tracking-wider hover:bg-gray-100 disabled:opacity-30"
                            onClick={handleBack}
                            disabled={step === 1}
                        >
                            Back
                        </Button>

                        {step < 5 ? (
                            <Button
                                className="h-11 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 font-black text-xs uppercase tracking-wider shadow-sm group"
                                onClick={handleNext}
                            >
                                Continue
                                <ChevronRight className="h-4 w-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        ) : (
                            <Button
                                className="h-11 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 font-black text-xs uppercase tracking-wider shadow-sm flex items-center gap-2 active:scale-95 transition-all"
                                onClick={handleSubmit}
                                disabled={createUser.isPending || isSubmittingBooking}
                            >
                                {createUser.isPending || isSubmittingBooking ? (
                                    <><Loader2 className="h-4 w-4 animate-spin" /> Enrolling User...</>
                                ) : (
                                    <><UserPlus className="h-4 w-4" /> Create User & Register</>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
