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
    Zap
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
    { value: "RESIDENT", label: "Resident", icon: User, color: "text-emerald-600", bg: "bg-emerald-50", desc: "Hostel resident / tenant" },
    { value: "GUEST", label: "Guest", icon: Users, color: "text-blue-600", bg: "bg-blue-50", desc: "Short-term / temporary guest" },
    { value: "STAFF", label: "Staff", icon: Briefcase, color: "text-indigo-600", bg: "bg-indigo-50", desc: "Hostel staff member" },
    { value: "WARDEN", label: "Warden", icon: UserCog, color: "text-amber-600", bg: "bg-amber-50", desc: "Hostel warden / manager" },
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
    password: "hostel@123",
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

    const handleSubmit = async () => {
        try {
            await createUser.mutateAsync({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                cnic: formData.cnic,
                address: formData.address,
                role: formData.role,
                hostelId: formData.hostelId || null,
                designation: formData.designation || null,
                basicSalary: formData.basicSalary ? Number(formData.basicSalary) : 0,
                password: formData.password,
            });
            // Navigate back after success
            if (isAdmin) router.push("/admin/users-records");
            else router.push("/warden/residents");
        } catch (err) {
            // Error handled by hook
        }
    };

    const selectedRole = ROLES.find(r => r.value === formData.role);
    const selectedHostel = hostels.find(h => h.id === formData.hostelId);

    const isStaffLike = formData.role === "STAFF" || formData.role === "WARDEN";

    return (
        <div className="min-h-screen bg-gray-50/30 pb-24">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1100px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 hover:bg-gray-100" onClick={() => router.back()}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-base font-bold text-gray-900 uppercase tracking-tight leading-none">Register New User</h1>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                {isAdmin ? "Admin Panel" : "Warden Panel"} · Authorized Access
                            </p>
                        </div>
                    </div>

                    {/* Step indicators */}
                    <div className="flex items-center gap-1.5">
                        {STEPS.map((s) => {
                            const Icon = s.icon;
                            const isActive = step === s.id;
                            const isDone = step > s.id;
                            return (
                                <div key={s.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${isActive ? 'bg-indigo-600 text-white' : isDone ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                    {isDone ? <CheckCircle2 className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                                    <span className="text-[9px] font-bold uppercase tracking-widest hidden sm:block">{s.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="max-w-[900px] mx-auto px-6 py-10">
                <div className="bg-white border border-gray-100 rounded-[3rem] shadow-2xl shadow-black/5 overflow-hidden">
                    {/* Progress bar */}
                    <div className="h-1 bg-gray-100">
                        <div
                            className="h-full bg-indigo-600 transition-all duration-700 ease-out"
                            style={{ width: `${(step / STEPS.length) * 100}%` }}
                        />
                    </div>

                    <div className="p-12">
                        {/* ─── STEP 1: Role Selection ─── */}
                        {step === 1 && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div>
                                    <h2 className="text-3xl font-bold tracking-tight">Select Role</h2>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
                                        Choose the account type for the new user
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {availableRoles.map(role => {
                                        const Icon = role.icon;
                                        const isSelected = formData.role === role.value;
                                        return (
                                            <button
                                                key={role.value}
                                                onClick={() => handleChange("role", role.value)}
                                                className={`relative p-6 rounded-3xl border-2 text-left transition-all duration-200 group ${isSelected
                                                    ? "border-indigo-600 bg-indigo-50/50 shadow-lg shadow-indigo-600/10"
                                                    : "border-gray-100 bg-gray-50/30 hover:border-gray-200 hover:bg-gray-50"
                                                    }`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${isSelected ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : `${role.bg} ${role.color}`}`}>
                                                        <Icon className="h-6 w-6" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className={`font-bold text-sm uppercase tracking-wider ${isSelected ? "text-indigo-600" : "text-gray-900"}`}>{role.label}</p>
                                                        <p className="text-[10px] text-gray-400 font-medium mt-1">{role.desc}</p>
                                                    </div>
                                                    {isSelected && (
                                                        <CheckCircle2 className="h-5 w-5 text-indigo-600 absolute top-4 right-4" />
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
                                    <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                        <ShieldCheck className="h-4 w-4 text-amber-600 flex-shrink-0" />
                                        <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">
                                            Warden access: You can only register Residents and Guests for your assigned hostel.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ─── STEP 2: Identity ─── */}
                        {step === 2 && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div>
                                    <h2 className="text-3xl font-bold tracking-tight">Identity Details</h2>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Personal information for the new {selectedRole?.label}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2 md:col-span-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Full Legal Name *</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={e => handleChange("name", e.target.value)}
                                            placeholder="Muhammad Ahmed Khan"
                                            className={`h-14 rounded-xl border-gray-100 font-bold text-sm ${errors.name ? "border-rose-400" : ""}`}
                                        />
                                        {errors.name && <p className="text-xs text-rose-500 font-bold">{errors.name}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Email Address *</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                type="email"
                                                value={formData.email}
                                                onChange={e => handleChange("email", e.target.value)}
                                                placeholder="user@example.com"
                                                className={`h-14 pl-11 rounded-xl border-gray-100 font-bold text-sm ${errors.email ? "border-rose-400" : ""}`}
                                            />
                                        </div>
                                        {errors.email && <p className="text-xs text-rose-500 font-bold">{errors.email}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Phone Number *</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={e => handleChange("phone", e.target.value)}
                                                placeholder="0321-1234567"
                                                className={`h-14 pl-11 rounded-xl border-gray-100 font-bold text-sm ${errors.phone ? "border-rose-400" : ""}`}
                                            />
                                        </div>
                                        {errors.phone && <p className="text-xs text-rose-500 font-bold">{errors.phone}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">CNIC Number *</Label>
                                        <div className="relative">
                                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                value={formData.cnic}
                                                onChange={e => handleChange("cnic", e.target.value)}
                                                placeholder="XXXXX-XXXXXXX-X"
                                                className={`h-14 pl-11 rounded-xl border-gray-100 font-bold text-sm ${errors.cnic ? "border-rose-400" : ""}`}
                                            />
                                        </div>
                                        {errors.cnic && <p className="text-xs text-rose-500 font-bold">{errors.cnic}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">City</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                value={formData.city}
                                                onChange={e => handleChange("city", e.target.value)}
                                                placeholder="Lahore"
                                                className="h-14 pl-11 rounded-xl border-gray-100 font-bold text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Residential Address</Label>
                                        <Textarea
                                            value={formData.address}
                                            onChange={e => handleChange("address", e.target.value)}
                                            placeholder="Full permanent address..."
                                            className="min-h-[90px] rounded-xl border-gray-100 font-bold text-sm resize-none pt-4"
                                        />
                                    </div>

                                    {/* Resident/Guest extra fields */}
                                    {(formData.role === "RESIDENT" || formData.role === "GUEST") && (
                                        <>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Guardian Name</Label>
                                                <div className="relative">
                                                    <Contact2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <Input
                                                        value={formData.guardianName}
                                                        onChange={e => handleChange("guardianName", e.target.value)}
                                                        placeholder="Parent / Guardian Name"
                                                        className="h-14 pl-11 rounded-xl border-gray-100 font-bold text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Guardian Phone</Label>
                                                <div className="relative">
                                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <Input
                                                        value={formData.guardianPhone}
                                                        onChange={e => handleChange("guardianPhone", e.target.value)}
                                                        placeholder="03XX-XXXXXXX"
                                                        className="h-14 pl-11 rounded-xl border-gray-100 font-bold text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Emergency Contact</Label>
                                                <div className="relative">
                                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <Input
                                                        value={formData.emergencyContact}
                                                        onChange={e => handleChange("emergencyContact", e.target.value)}
                                                        placeholder="Emergency contact number"
                                                        className="h-14 pl-11 rounded-xl border-gray-100 font-bold text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ─── STEP 3: Assignment ─── */}
                        {step === 3 && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div>
                                    <h2 className="text-3xl font-bold tracking-tight">Hostel Assignment</h2>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
                                        Assign the user to a hostel {isStaffLike && "and set their role details"}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2 md:col-span-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Assigned Hostel *</Label>
                                        {isWarden ? (
                                            <div className="h-14 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center px-4 gap-3">
                                                <Building2 className="h-4 w-4 text-gray-400" />
                                                <span className="font-bold text-sm text-gray-700">
                                                    {hostels.find(h => h.id === currentUser?.hostelId)?.name || "Your Assigned Hostel"}
                                                </span>
                                                <Badge className="ml-auto text-[9px] font-bold uppercase bg-indigo-50 text-indigo-600 border-indigo-100">Auto-Assigned</Badge>
                                            </div>
                                        ) : (
                                            <Select value={formData.hostelId} onValueChange={v => handleChange("hostelId", v)}>
                                                <SelectTrigger className={`h-14 rounded-xl border-gray-100 font-bold ${errors.hostelId ? "border-rose-400" : ""}`}>
                                                    <SelectValue placeholder="Select a hostel..." />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-gray-100 shadow-2xl p-2">
                                                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 p-3">Available Hostels</div>
                                                    <div className="h-px bg-gray-50 mb-2" />
                                                    {hostelsLoading ? (
                                                        <div className="p-4 text-center text-xs text-gray-400">Loading...</div>
                                                    ) : hostels.map(h => (
                                                        <SelectItem key={h.id} value={h.id} className="p-3 font-bold text-xs uppercase tracking-wider rounded-xl">
                                                            {h.name} — {h.city}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                        {errors.hostelId && <p className="text-xs text-rose-500 font-bold">{errors.hostelId}</p>}
                                    </div>

                                    {/* Staff / Warden specific fields */}
                                    {isStaffLike && (
                                        <>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Designation *</Label>
                                                <div className="relative">
                                                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <Input
                                                        value={formData.designation}
                                                        onChange={e => handleChange("designation", e.target.value)}
                                                        placeholder={formData.role === "WARDEN" ? "Hostel Warden" : "e.g. Security Guard"}
                                                        className={`h-14 pl-11 rounded-xl border-gray-100 font-bold text-sm ${errors.designation ? "border-rose-400" : ""}`}
                                                    />
                                                </div>
                                                {errors.designation && <p className="text-xs text-rose-500 font-bold">{errors.designation}</p>}
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Basic Salary (PKR)</Label>
                                                <div className="relative">
                                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <Input
                                                        type="number"
                                                        value={formData.basicSalary}
                                                        onChange={e => handleChange("basicSalary", e.target.value)}
                                                        placeholder="25000"
                                                        className="h-14 pl-11 rounded-xl border-gray-100 font-bold text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ─── STEP 4: Security / Password ─── */}
                        {step === 4 && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div>
                                    <h2 className="text-3xl font-bold tracking-tight">Access Credentials</h2>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Set the initial login password for this account</p>
                                </div>

                                <div className="space-y-6 max-w-md">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Initial Password *</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                value={formData.password}
                                                onChange={e => handleChange("password", e.target.value)}
                                                className={`h-14 pl-11 pr-12 rounded-xl border-gray-100 font-bold text-sm ${errors.password ? "border-rose-400" : ""}`}
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

                                    <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-amber-600" />
                                            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Important Notice</p>
                                        </div>
                                        <p className="text-xs text-amber-700 leading-relaxed">
                                            Share this password securely with the user. They should change it upon first login. The default password is <span className="font-bold font-mono">hostel@123</span>.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ─── STEP 5: Review ─── */}
                        {step === 5 && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div>
                                    <h2 className="text-3xl font-bold tracking-tight">Review & Confirm</h2>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Verify all details before creating the account</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Role card */}
                                    <div className="p-6 rounded-3xl bg-gray-50/50 border border-gray-100 flex items-center gap-4">
                                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${selectedRole?.bg}`}>
                                            {selectedRole && <selectedRole.icon className={`h-6 w-6 ${selectedRole.color}`} />}
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Account Type</p>
                                            <p className="font-bold text-gray-900 text-sm uppercase">{selectedRole?.label}</p>
                                        </div>
                                    </div>

                                    {/* Name / Email */}
                                    <div className="p-6 rounded-3xl bg-gray-50/50 border border-gray-100 flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                                            <User className="h-6 w-6 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Identity</p>
                                            <p className="font-bold text-gray-900 text-sm">{formData.name}</p>
                                            <p className="text-[10px] text-gray-500 font-medium">{formData.email}</p>
                                        </div>
                                    </div>

                                    {/* Phone / CNIC */}
                                    <div className="p-6 rounded-3xl bg-gray-50/50 border border-gray-100 flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                                            <Phone className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Contact</p>
                                            <p className="font-bold text-gray-900 text-sm">{formData.phone}</p>
                                            <p className="text-[10px] text-gray-500 font-medium">CNIC: {formData.cnic}</p>
                                        </div>
                                    </div>

                                    {/* Hostel */}
                                    <div className="p-6 rounded-3xl bg-gray-50/50 border border-gray-100 flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                                            <Building2 className="h-6 w-6 text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Hostel</p>
                                            <p className="font-bold text-gray-900 text-sm">{selectedHostel?.name || "—"}</p>
                                            <p className="text-[10px] text-gray-500 font-medium">{selectedHostel?.city}</p>
                                        </div>
                                    </div>

                                    {isStaffLike && (
                                        <div className="p-6 rounded-3xl bg-gray-50/50 border border-gray-100 flex items-center gap-4 md:col-span-2">
                                            <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                                                <Briefcase className="h-6 w-6 text-amber-600" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Staff Details</p>
                                                <p className="font-bold text-gray-900 text-sm">{formData.designation}</p>
                                                {formData.basicSalary && <p className="text-[10px] text-gray-500 font-medium">Salary: PKR {Number(formData.basicSalary).toLocaleString()}</p>}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
                                    <ShieldCheck className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                                    <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest leading-relaxed">
                                        By confirming, you take responsibility for this account creation. The user will be able to log in with the provided credentials.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-gray-50/50 border-t px-12 py-8 flex items-center justify-between">
                        <Button
                            variant="outline"
                            className="h-14 px-10 rounded-2xl border-gray-200 bg-white font-bold text-xs uppercase tracking-widest hover:bg-gray-100 disabled:opacity-30"
                            onClick={handleBack}
                            disabled={step === 1}
                        >
                            Back
                        </Button>

                        {step < 5 ? (
                            <Button
                                className="h-14 px-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/10 group"
                                onClick={handleNext}
                            >
                                Continue
                                <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        ) : (
                            <Button
                                className="h-14 px-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/20 group active:scale-95 transition-all"
                                onClick={handleSubmit}
                                disabled={createUser.isPending}
                            >
                                {createUser.isPending ? (
                                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating Account...</>
                                ) : (
                                    <><UserPlus className="h-4 w-4 mr-2" /> Create Account</>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom status bar */}
            <div className="fixed bottom-0 left-0 w-full z-40 px-6 pb-4 pointer-events-none">
                <div className="max-w-[900px] mx-auto bg-indigo-600/90 backdrop-blur-xl text-white h-12 rounded-2xl shadow-2xl flex items-center justify-between px-6 pointer-events-auto">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-white" />
                            <span className="text-[10px] font-bold tracking-widest uppercase">Authorized Registration</span>
                        </div>
                        <div className="h-3 w-px bg-white/20" />
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-200">
                                {currentUser?.role} · {currentUser?.name}
                            </span>
                        </div>
                    </div>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-gray-300">Step {step} of {STEPS.length}</span>
                </div>
            </div>
        </div>
    );
}
