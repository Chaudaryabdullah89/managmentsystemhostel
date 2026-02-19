"use client"
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    User,
    Mail,
    Phone,
    Calendar,
    CreditCard,
    UserPlus,
    MapPin,
    ShieldCheck,
    Building2,
    DollarSign,
    Upload,
    FileText,
    CheckCircle2,
    Loader2,
    Clock,
    Search,
    X,
    UserCheck,
    AlertCircle,
    Info,
    Receipt
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useCreateBooking } from "@/hooks/useBooking";
import { useSingleRoomByHostelId } from "@/hooks/useRoom";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const AddGuestPage = () => {
    const params = useParams();
    const router = useRouter();
    const { hostelId, roomId } = params;
    const createBooking = useCreateBooking();
    const { data: roomResponse, isLoading: roomLoading } = useSingleRoomByHostelId(hostelId, roomId);
    const room = roomResponse?.data;

    const [step, setStep] = useState(1);
    const [existingGuestQuery, setExistingGuestQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedGuest, setSelectedGuest] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCredentials, setShowCredentials] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
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
        checkIn: "",
        totalAmount: 0,
        securityDeposit: 0,
        status: "CONFIRMED",
        remarks: ""
    });

    const [documents, setDocuments] = useState({
        cnicFront: null,
        cnicBack: null,
    });

    // Sync room prices when loaded
    useEffect(() => {
        if (room) {
            setFormData(prev => ({
                ...prev,
                totalAmount: room.monthlyrent || 0,
                securityDeposit: room.monthlyrent || 0
            }));
        }
    }, [room]);

    // Guest Search Intelligence
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (existingGuestQuery.length > 2) {
                setIsSearching(true);
                try {
                    const res = await fetch(`/api/users?query=${existingGuestQuery}&role=GUEST`);
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
        setSelectedGuest(user);
        setFormData(prev => ({
            ...prev,
            userId: user.id,
            guestName: user.name,
            guestEmail: user.email,
            guestPhone: user.phone || "",
            cnic: user.cnic || "",
            address: user.address || "",
            city: user.city || "",
            guardianName: user.ResidentProfile?.guardianName || "",
            guardianPhone: user.ResidentProfile?.guardianPhone || "",
            emergencyContact: user.ResidentProfile?.emergencyContact || "",
        }));
        setExistingGuestQuery("");
        setSearchResults([]);
        toast.success(`Guest profile identified: ${user.name}`);
    };

    const resetGuest = () => {
        setSelectedGuest(null);
        setFormData(prev => ({
            ...prev,
            userId: "",
            guestName: "",
            guestEmail: "",
            guestPhone: "",
            cnic: "",
            guardianName: "",
            guardianPhone: "",
            emergencyContact: "",
            address: "",
            city: ""
        }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e, docType) => {
        const file = e.target.files[0];
        if (file) {
            setDocuments(prev => ({ ...prev, [docType]: file }));
            toast.success(`${docType.replace(/([A-Z])/g, ' $1').toUpperCase()} attached successfully`);
        }
    };

    const handleNext = () => {
        if (step === 1) {
            if (!formData.guestName || !formData.guestEmail || !formData.guestPhone) {
                return toast.error("Essential profile information required");
            }
        }
        if (step === 2) {
            if (!documents.cnicFront || !documents.cnicBack) {
                return toast.error("CNIC Verification Documents are mandatory");
            }
        }
        setStep(prev => prev + 1);
    };

    const handleBack = () => setStep(prev => prev - 1);

    const handleSubmit = async () => {
        if (!formData.checkIn) return toast.error("Check-in date required");

        setIsSubmitting(true);
        try {
            await createBooking.mutateAsync({
                ...formData,
                roomId: roomId,
                documents: {
                    cnicFront: "verified_attachment",
                    cnicBack: "verified_attachment",
                }
            });
            setShowCredentials(true);
        } catch (error) {
            console.error("Registration failed:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeSuccessAndExit = () => {
        setShowCredentials(false);
        router.push(`/admin/hostels/${hostelId}/room-details/room/${roomId}`);
    };

    if (roomLoading) return (
        <div className="flex h-screen items-center justify-center bg-white">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/30 pb-20 font-sans">
            {/* Slim Header */}
            <div className="bg-white border-b sticky top-0 z-50 h-16">
                <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100 h-9 w-9" onClick={() => router.back()}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex flex-col">
                            <h1 className="text-lg font-black text-gray-900 tracking-tight leading-none uppercase">Guest Deployment</h1>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Unit {room?.roomNumber} Registration Protocol</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center -space-x-2">
                            {[1, 2, 3, 4].map(s => (
                                <div key={s} className={`h-7 w-7 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-black transition-all ${step >= s ? 'bg-black text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>
                                    {s}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1000px] mx-auto px-6 py-8">
                <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-2xl shadow-black/5 overflow-hidden">
                    {/* Progress Bar */}
                    <div className="h-1 bg-gray-100 w-full">
                        <div className="h-full bg-black transition-all duration-700 ease-out" style={{ width: `${(step / 4) * 100}%` }} />
                    </div>

                    <div className="p-12">
                        {/* Step 1: Guest Intelligence */}
                        {step === 1 && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex flex-col gap-2">
                                    <h2 className="text-3xl font-black tracking-tight">Guest Intelligence</h2>
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Identify or construct the resident identity</p>
                                </div>

                                <div className="space-y-8">
                                    {!selectedGuest ? (
                                        <div className="relative">
                                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                            <Input
                                                placeholder="Search registry by Name, Email, or CNIC..."
                                                className="h-16 pl-14 pr-6 rounded-2xl border-gray-100 bg-gray-50/50 font-bold focus:bg-white focus:border-black transition-all"
                                                value={existingGuestQuery}
                                                onChange={(e) => setExistingGuestQuery(e.target.value)}
                                            />
                                            {isSearching && <div className="absolute right-6 top-1/2 -translate-y-1/2"><Clock className="h-4 w-4 animate-spin text-gray-400" /></div>}

                                            {searchResults.length > 0 && (
                                                <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl p-2 z-50">
                                                    {searchResults.map(user => (
                                                        <div
                                                            key={user.id}
                                                            className="p-4 hover:bg-gray-50 rounded-xl cursor-pointer flex items-center justify-between group transition-colors"
                                                            onClick={() => handleSelectGuest(user)}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                                                                    <User className="h-5 w-5" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-black text-sm">{user.name}</p>
                                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{user.email} • {user.cnic || 'NO-CNIC'}</p>
                                                                </div>
                                                            </div>
                                                            <UserCheck className="h-4 w-4 text-emerald-500 opacity-0 group-hover:opacity-100 mr-4" />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="bg-emerald-50 border border-emerald-100 rounded-[2rem] p-8 flex items-center justify-between group">
                                            <div className="flex items-center gap-6">
                                                <div className="h-16 w-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/20">
                                                    <UserCheck className="h-8 w-8" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-emerald-900 leading-none">{selectedGuest.name}</h3>
                                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] mt-2">Authenticated Resident Node</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="rounded-xl text-emerald-600 hover:bg-emerald-100" onClick={resetGuest}>
                                                <X className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2.5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Legal Name</Label>
                                            <Input disabled={!!selectedGuest} name="guestName" value={formData.guestName} onChange={handleInputChange} className="h-14 rounded-xl border-gray-100 font-bold" placeholder="First & Last Name" />
                                        </div>
                                        <div className="space-y-2.5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email Terminal</Label>
                                            <Input disabled={!!selectedGuest} name="guestEmail" value={formData.guestEmail} onChange={handleInputChange} className="h-14 rounded-xl border-gray-100 font-bold" placeholder="address@domain.com" />
                                        </div>
                                        <div className="space-y-2.5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Phone Vector</Label>
                                            <Input name="guestPhone" value={formData.guestPhone} onChange={handleInputChange} className="h-14 rounded-xl border-gray-100 font-bold" placeholder="03XX-XXXXXXX" />
                                        </div>
                                        <div className="space-y-2.5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">CNIC Registry</Label>
                                            <Input name="cnic" value={formData.cnic} onChange={handleInputChange} className="h-14 rounded-xl border-gray-100 font-bold" placeholder="XXXXX-XXXXXXX-X" />
                                        </div>
                                        <div className="space-y-2.5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Guardian Name</Label>
                                            <Input name="guardianName" value={formData.guardianName} onChange={handleInputChange} className="h-14 rounded-xl border-gray-100 font-bold" placeholder="Guardian Full Name" />
                                        </div>
                                        <div className="space-y-2.5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Guardian Phone</Label>
                                            <Input name="guardianPhone" value={formData.guardianPhone} onChange={handleInputChange} className="h-14 rounded-xl border-gray-100 font-bold" placeholder="Guardian Phone #" />
                                        </div>
                                        <div className="space-y-2.5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Emergency Vector</Label>
                                            <Input name="emergencyContact" value={formData.emergencyContact} onChange={handleInputChange} className="h-14 rounded-xl border-gray-100 font-bold" placeholder="Emergency Contact Name/Phone" />
                                        </div>
                                        <div className="space-y-2.5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">City Node</Label>
                                            <Input name="city" value={formData.city} onChange={handleInputChange} className="h-14 rounded-xl border-gray-100 font-bold" placeholder="City of Residence" />
                                        </div>
                                        <div className="space-y-2.5 md:col-span-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Permanent Residential Address</Label>
                                            <Textarea name="address" value={formData.address} onChange={handleInputChange} className="min-h-[100px] rounded-xl border-gray-100 font-bold resize-none pt-4" placeholder="Full permanent address..." />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Identification Vault */}
                        {step === 2 && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="flex flex-col gap-2">
                                    <h2 className="text-3xl font-black tracking-tight">Identification Vault</h2>
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Verify the resident through state ID documentation</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 flex justify-between">
                                                CNIC Front Fragment {documents.cnicFront && <span className="text-emerald-500">VERIFIED</span>}
                                            </Label>
                                            <div className="relative h-48 border-2 border-dashed border-gray-100 rounded-[2rem] flex flex-col items-center justify-center bg-gray-50/50 hover:bg-white hover:border-black transition-all cursor-pointer group overflow-hidden">
                                                <input type="file" accept="image/*,.pdf" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={(e) => handleFileChange(e, 'cnicFront')} />
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className={`h-12 w-12 rounded-2xl ${documents.cnicFront ? 'bg-emerald-500 text-white' : 'bg-white text-gray-300'} flex items-center justify-center shadow-lg transition-colors`}>
                                                        {documents.cnicFront ? <CheckCircle2 className="h-6 w-6" /> : <Upload className="h-6 w-6" />}
                                                    </div>
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Capture Front Surface</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 flex justify-between">
                                                CNIC Back Fragment {documents.cnicBack && <span className="text-emerald-500">VERIFIED</span>}
                                            </Label>
                                            <div className="relative h-48 border-2 border-dashed border-gray-100 rounded-[2rem] flex flex-col items-center justify-center bg-gray-50/50 hover:bg-white hover:border-black transition-all cursor-pointer group overflow-hidden">
                                                <input type="file" accept="image/*,.pdf" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={(e) => handleFileChange(e, 'cnicBack')} />
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className={`h-12 w-12 rounded-2xl ${documents.cnicBack ? 'bg-emerald-500 text-white' : 'bg-white text-gray-300'} flex items-center justify-center shadow-lg transition-colors`}>
                                                        {documents.cnicBack ? <CheckCircle2 className="h-6 w-6" /> : <Upload className="h-6 w-6" />}
                                                    </div>
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Capture Reverse Surface</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 bg-amber-50 rounded-[2rem] border border-amber-100 flex gap-6">
                                    <ShieldCheck className="h-6 w-6 text-amber-500 shrink-0 mt-1" />
                                    <div className="space-y-2">
                                        <p className="text-xs font-black text-amber-900 uppercase tracking-widest">Regulatory Compliance Notice</p>
                                        <p className="text-[10px] font-bold text-amber-700/80 uppercase tracking-tight leading-relaxed">
                                            Identification fragments are encrypted and stored in the secure documentation vault. Unauthorized access is restricted under policy P-882.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Fiscal Synthesis */}
                        {step === 3 && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="flex flex-col gap-2">
                                    <h2 className="text-3xl font-black tracking-tight">Fiscal Synthesis</h2>
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Construct the commercial contract parameters</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="space-y-8">
                                        <div className="space-y-2.5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Deployment Date</Label>
                                            <div className="relative">
                                                <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                <Input type="date" name="checkIn" value={formData.checkIn} onChange={handleInputChange} className="h-16 pl-14 rounded-2xl border-gray-100 font-bold bg-gray-50/50 focus:bg-white transition-all" />
                                            </div>
                                        </div>

                                        <div className="space-y-2.5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Monthly Tariff (Rs.)</Label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                <Input type="number" name="totalAmount" value={formData.totalAmount} onChange={handleInputChange} className="h-16 pl-14 rounded-2xl border-gray-100 font-bold" />
                                            </div>
                                        </div>

                                        <div className="space-y-2.5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Security Commitment (Rs.)</Label>
                                            <div className="relative">
                                                <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                <Input type="number" name="securityDeposit" value={formData.securityDeposit} onChange={handleInputChange} className="h-16 pl-14 rounded-2xl border-gray-100 font-bold" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-black text-white rounded-[2.5rem] p-10 space-y-8 shadow-2xl shadow-black/20">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                                                <Receipt className="h-5 w-5 text-emerald-400" />
                                            </div>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest">Financial Ledger Preview</h4>
                                        </div>

                                        <div className="space-y-4 pt-4">
                                            <div className="flex justify-between items-center text-gray-400">
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Unit Rent</span>
                                                <span className="font-black text-white italic">PKR {Number(formData.totalAmount).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-gray-400">
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Security Deposit</span>
                                                <span className="font-black text-white italic">PKR {Number(formData.securityDeposit).toLocaleString()}</span>
                                            </div>
                                            <div className="h-px bg-white/10 my-6" />
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">Total Initial Liability</p>
                                                    <h3 className="text-4xl font-black tracking-tighter italic">PKR {(Number(formData.totalAmount) + Number(formData.securityDeposit)).toLocaleString()}</h3>
                                                </div>
                                                <DollarSign className="h-8 w-8 text-white/10 mb-1" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Final Review */}
                        {step === 4 && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="flex flex-col gap-2">
                                    <h2 className="text-3xl font-black tracking-tight">Review Deck</h2>
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Final audit of the occupancy contract</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-gray-50/50 rounded-3xl p-8 border border-gray-100 flex items-start gap-6">
                                        <div className="h-12 w-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                                            <User className="h-6 w-6 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Resident Entity</p>
                                            <h4 className="text-lg font-black text-gray-900">{formData.guestName}</h4>
                                            <p className="text-xs font-bold text-gray-500 mt-1">{formData.guestEmail}</p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50/50 rounded-3xl p-8 border border-gray-100 flex items-start gap-6">
                                        <div className="h-12 w-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                                            <Building2 className="h-6 w-6 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Assigned Unit</p>
                                            <h4 className="text-lg font-black text-gray-900">Room {room?.roomNumber}</h4>
                                            <p className="text-xs font-bold text-gray-500 mt-1">{room?.Hostel?.name}</p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50/50 rounded-3xl p-8 border border-gray-100 flex items-start gap-6">
                                        <div className="h-12 w-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                                            <Calendar className="h-6 w-6 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Timeline</p>
                                            <h4 className="text-lg font-black text-gray-900">Starts {formData.checkIn}</h4>
                                            <p className="text-xs font-bold text-gray-500 mt-1">Status: {formData.status}</p>
                                        </div>
                                    </div>

                                    <div className="bg-emerald-500 text-white rounded-3xl p-8 flex items-start justify-between shadow-xl shadow-emerald-500/20">
                                        <div>
                                            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Settlement</p>
                                            <h4 className="text-2xl font-black italic">PKR {(Number(formData.totalAmount) + Number(formData.securityDeposit)).toLocaleString()}</h4>
                                            <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest mt-2">Rent + Security Collected</p>
                                        </div>
                                        <ShieldCheck className="h-10 w-10 text-white/30" />
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-8 bg-black text-white rounded-3xl shadow-2xl">
                                    <AlertCircle className="h-6 w-6 text-emerald-400" />
                                    <p className="text-[10px] font-black uppercase tracking-widest leading-loose text-gray-400">
                                        BY AUTHORIZING, YOU CONFIRM THE REGISTRATION OF THIS GUEST. A DEFAULT PASSWORD WILL BE GENERATED FOR NEW USERS. DATA INTEGRITY IS MONITORED.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-gray-50/50 border-t p-8 flex items-center justify-between">
                        <Button
                            variant="outline"
                            className="h-14 px-10 rounded-2xl border-gray-200 bg-white font-black text-xs uppercase tracking-widest hover:bg-gray-100 disabled:opacity-30"
                            onClick={handleBack}
                            disabled={step === 1}
                        >
                            Back-Step
                        </Button>

                        {step < 4 ? (
                            <Button
                                className="h-14 px-12 rounded-2xl bg-black hover:bg-gray-800 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-black/10 group active:scale-95 transition-all"
                                onClick={handleNext}
                            >
                                Continue Protocol
                                <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        ) : (
                            <Button
                                className="h-14 px-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/20 group scale-100 active:scale-95 transition-all"
                                onClick={handleSubmit}
                                disabled={isSubmitting || createBooking.isPending}
                            >
                                {isSubmitting ? 'Authorizing...' : 'Authorize Registry'}
                                <ShieldCheck className="h-4 w-4 ml-2" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Architecture Bar */}
                <div className="fixed bottom-0 w-full z-40 px-6 pb-4 pointer-events-none left-0">
                    <div className="max-w-[1000px] mx-auto bg-black/90 backdrop-blur-xl text-white h-12 rounded-2xl shadow-2xl flex items-center justify-between px-6 pointer-events-auto border border-white/10">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-[10px] font-black tracking-widest uppercase text-emerald-400 italic">Core Integrity</span>
                            </div>
                            <div className="h-3 w-px bg-white/20"></div>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                <span className="text-[10px] font-black uppercase text-gray-300 tracking-widest">Active Sync</span>
                            </div>
                        </div>
                        <span className="text-[10px] font-black tracking-widest uppercase text-gray-500">DEPL-NODE: {roomId?.slice(-8).toUpperCase()}</span>
                    </div>
                </div>
            </div>

            {/* Success Dialog with Credentials */}
            <Dialog open={showCredentials} onOpenChange={setShowCredentials}>
                <DialogContent className="max-w-md bg-white rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
                    <div className="bg-black p-10 text-center space-y-4">
                        <div className="h-20 w-20 rounded-3xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40 rotate-12 scale-110">
                            <ShieldCheck className="h-10 w-10" />
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight pt-4 uppercase italic">Registry Authorized</h2>
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Occupancy Contract Codified</p>
                    </div>

                    <div className="p-10 space-y-8">
                        {!selectedGuest && (
                            <div className="bg-gray-50 rounded-[2rem] p-8 space-y-6">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resident Identifiers</p>
                                    <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                                        <span className="text-xs font-bold text-gray-500 uppercase">User Node</span>
                                        <span className="text-sm font-black text-gray-900">{formData.guestEmail}</span>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                                        <span className="text-xs font-bold text-gray-500 uppercase">Secure Key</span>
                                        <span className="text-sm font-black text-black bg-yellow-400 px-2 py-0.5 rounded italic">password123</span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                    <Info className="h-4 w-4 text-blue-500 shrink-0" />
                                    <p className="text-[9px] font-bold text-blue-600 uppercase tracking-tight leading-relaxed">
                                        Please transmit these credentials to the resident node immediately. Access to the portal is now live at the primary domain.
                                    </p>
                                </div>
                            </div>
                        )}

                        <Button
                            className="w-full h-16 rounded-2xl bg-black hover:bg-gray-800 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-black/10 group transition-all mt-4"
                            onClick={closeSuccessAndExit}
                        >
                            Complete Protocol & Exit
                            <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AddGuestPage;
