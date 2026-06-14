"use client";
import React from 'react';
import { ProfileSkeleton } from "@/components/ui/skeletons";
import { useQuery } from "@tanstack/react-query";
import {
    Mail,
    Phone,
    MapPin,
    Shield,
    LogOut,
    FileText,
    Camera,
    UserCircle,
    Building2,
    Home,
    Calendar,
    Contact,
    HeartPulse,
    CreditCard,
    Fingerprint,
    CheckCircle2,
    User,
    History
} from 'lucide-react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import useAuthStore from "@/hooks/Authstate";
import { toast } from "sonner";
import Link from 'next/link';

const GuestProfile = () => {
    const { user, logout } = useAuthStore();

    const { data: profile, isLoading } = useQuery({
        queryKey: ['guestFullProfile', user?.id],
        queryFn: async () => {
            if (!user?.id) return null;
            const res = await fetch(`/api/users/${user.id}/full-profile`);
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            return data.data;
        },
        enabled: !!user?.id
    });

    if (isLoading) return <ProfileSkeleton />;

    const userData = profile?.basic || user || {};
    const resident = profile?.resident || {};
    const hostel = profile?.hostel || {};
    const residency = profile?.residency || {};
    const history = profile?.history || [];
    const additionalImages = userData?.additionalImages || [];

    // Logic: Only show "Checked Out" styling if they have NO active stay but DO have history
    const isCheckedOut = !residency.roomNumber && history.length > 0;

    const downloadSmartCard = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw background gradient
        const grad = ctx.createLinearGradient(0, 0, 0, 600);
        grad.addColorStop(0, '#0f172a'); // slate-900
        grad.addColorStop(0.5, '#1e1b4b'); // indigo-950
        grad.addColorStop(1, '#020617'); // slate-950
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 400, 600);

        // Draw decor circles/effects
        ctx.fillStyle = 'rgba(99, 102, 241, 0.08)'; // indigo-500 with opacity
        ctx.beginPath();
        ctx.arc(0, 0, 200, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(400, 600, 150, 0, Math.PI * 2);
        ctx.fill();

        // Draw card border/header bar
        ctx.fillStyle = '#6366f1'; // indigo-500
        ctx.fillRect(0, 0, 400, 12);

        // Draw Title / Hostel Name
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(hostel.name || "HOSTEL PORTAL", 200, 50);

        ctx.fillStyle = '#a5b4fc'; // indigo-300
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('DIGITAL RESIDENT SMART CARD', 200, 75);

        // Draw Avatar (load image, fallback to initials if CORS/error)
        const avatarSize = 120;
        const avatarX = 140;
        const avatarY = 110;

        try {
            if (userData.image) {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                await new Promise((resolve, reject) => {
                    img.onload = () => {
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
                        ctx.clip();
                        ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize);
                        ctx.restore();
                        resolve();
                    };
                    img.onerror = () => {
                        reject();
                    };
                    img.src = userData.image;
                });
            } else {
                throw new Error("No image");
            }
        } catch (e) {
            // Draw Fallback Initials Circle
            ctx.fillStyle = '#1e1b4b'; // indigo-950
            ctx.beginPath();
            ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 44px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(userData.name?.charAt(0) || 'U', avatarX + avatarSize / 2, avatarY + avatarSize / 2);
            ctx.textBaseline = 'alphabetic'; // reset
        }

        // Draw Border around Avatar
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 2, 0, Math.PI * 2);
        ctx.stroke();

        // Draw Resident Info
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(userData.name || 'Resident Name', 200, 275);

        ctx.fillStyle = '#94a3b8'; // slate-400
        ctx.font = '12px sans-serif';
        ctx.fillText(`Reg #: ${userData.regNumber || 'N/A'}`, 200, 300);

        // Draw Details Table (Room, CNIC, Phone)
        const drawDetail = (label, value, y) => {
            ctx.fillStyle = '#a5b4fc';
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(label.toUpperCase(), 50, y);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 13px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(value || 'N/A', 350, y);

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(50, y + 8);
            ctx.lineTo(350, y + 8);
            ctx.stroke();
        };

        drawDetail('Room Assignment', residency.roomNumber ? `Room ${residency.roomNumber} (Floor ${residency.floor || 0})` : 'Unassigned', 340);
        drawDetail('CNIC Number', userData.cnic, 375);
        drawDetail('Phone Number', userData.phone, 410);

        // Draw QR Code
        const qrSize = 100;
        const qrX = 150;
        const qrY = 445;

        try {
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(userData.uid || userData.email || 'guest')}`;
            const qrImg = new Image();
            qrImg.crossOrigin = 'anonymous';
            await new Promise((resolve, reject) => {
                qrImg.onload = () => {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);
                    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
                    resolve();
                };
                qrImg.onerror = () => {
                    reject();
                };
                qrImg.src = qrUrl;
            });
        } catch (e) {
            // Draw Fallback QR block
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(qrX, qrY, qrSize, qrSize);
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('QR Code Error', 200, qrY + qrSize / 2);
        }

        // Trigger download
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${userData.name?.replace(/\s+/g, '_')}_ID_Pass.png`;
        link.href = dataUrl;
        link.click();
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-background pb-20 font-sans tracking-tight">
            {/* Header */}
            <div className="bg-white dark:bg-card border-b sticky top-0 z-40 h-16">
                <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 ${isCheckedOut ? 'bg-rose-600' : 'bg-black'} rounded-lg flex items-center justify-center text-white`}>
                            <User className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-gray-900 dark:text-foreground tracking-tight uppercase">My Profile</h1>
                            <p className={`text-[9px] font-bold uppercase tracking-widest ${isCheckedOut ? 'text-rose-500' : 'text-gray-400 dark:text-muted-foreground'}`}>
                                {isCheckedOut ? 'Archived Resident Account' : 'Your Account Details'}
                            </p>
                        </div>
                    </div>
                    <Button onClick={logout} variant="ghost" className="h-8 px-4 rounded-lg hover:bg-rose-50 text-rose-600 font-bold text-[10px] uppercase tracking-widest">
                        <LogOut className="h-3.5 w-3.5 mr-2" /> Logout
                    </Button>
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">

                {/* Main Profile Card */}
                <div className="bg-white dark:bg-card rounded-[2rem] p-1 shadow-sm border border-gray-100 dark:border-border">
                    <div className={`${isCheckedOut ? 'bg-slate-900' : 'bg-gray-900'} rounded-[1.8rem] p-8 text-white relative overflow-hidden`}>
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white dark:bg-card/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

                        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
                            <div className="relative group/avatar">
                                <Avatar className="h-32 w-32 border-4 border-white/20 shadow-2xl">
                                    <AvatarImage src={userData.image || "/avatar-placeholder.png"} />
                                    <AvatarFallback className="text-4xl font-bold text-gray-900 dark:text-foreground bg-white dark:bg-card">{userData.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className={`absolute bottom-0 right-0 h-8 w-8 ${isCheckedOut ? 'bg-rose-500' : 'bg-emerald-500'} rounded-full border-4 border-gray-900 flex items-center justify-center`}>
                                    {isCheckedOut ? <LogOut className="h-4 w-4 text-white" /> : <CheckCircle2 className="h-4 w-4 text-white" />}
                                </div>
                            </div>

                            <div className="flex-1 text-center md:text-left space-y-4">
                                <div>
                                    <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                                        <h2 className="text-3xl font-bold tracking-tight">{userData.name}</h2>
                                        <Badge className={`${isCheckedOut ? 'bg-rose-500/20 text-rose-300' : 'bg-white dark:bg-card/10 text-white'} hover:bg-white dark:bg-card/20 border-0 text-[9px] uppercase font-bold tracking-widest backdrop-blur-md`}>
                                            {isCheckedOut ? 'Past Resident' : userData.role || 'Resident'}
                                        </Badge>
                                        {userData.regNumber && (
                                            <Badge className="bg-indigo-500/20 text-indigo-300 border-0 text-[10px] uppercase font-black tracking-widest backdrop-blur-md">
                                                Reg # {userData.regNumber}
                                            </Badge>
                                        )}
                                        {userData.uid && (
                                            <Badge className="bg-white dark:bg-card/10 hover:bg-white dark:bg-card/20 text-white border-0 text-[9px] uppercase font-bold tracking-widest backdrop-blur-md font-mono">
                                                ID: {userData.uid}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-gray-400 dark:text-muted-foreground font-medium">{userData.email}</p>
                                </div>

                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
                                    <div className="bg-white dark:bg-card/10 backdrop-blur-md rounded-xl px-4 py-2 flex items-center gap-3 border border-white/5">
                                        <Phone className="h-4 w-4 text-white/70" />
                                        <div>
                                            <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Phone</p>
                                            <p className="text-xs font-bold">{userData.phone || "Not Added"}</p>
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-card/10 backdrop-blur-md rounded-xl px-4 py-2 flex items-center gap-3 border border-white/5">
                                        <CreditCard className="h-4 w-4 text-white/70" />
                                        <div>
                                            <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">CNIC No.</p>
                                            <p className="text-xs font-bold">{userData.cnic || "Not Added"}</p>
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-card/10 backdrop-blur-md rounded-xl px-4 py-2 flex items-center gap-3 border border-white/5">
                                        <Calendar className="h-4 w-4 text-white/70" />
                                        <div>
                                            <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Joined On</p>
                                            <p className="text-xs font-bold">{userData.joinedAt ? new Date(userData.joinedAt).toLocaleDateString() : 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Stay Details, Guardian Info, Home Address */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Stay Details */}
                        <Card className="rounded-[2rem] border-gray-100 dark:border-border shadow-sm overflow-hidden group">
                            <CardHeader className="bg-gray-50 dark:bg-background border-b border-gray-50 py-4 px-6">
                                <h3 className="text-xs font-bold text-gray-900 dark:text-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-gray-500 dark:text-muted-foreground" /> {isCheckedOut ? 'Past Residency' : 'My Stay Details'}
                                </h3>
                            </CardHeader>
                            <CardContent className="p-6">
                                {residency.roomNumber ? (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-14 w-14 rounded-2xl ${isCheckedOut ? 'bg-rose-600' : 'bg-black'} flex items-center justify-center text-white shadow-lg shrink-0`}>
                                                <Home className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">{isCheckedOut ? 'Checked Out From' : 'Current Room'}</p>
                                                <h4 className="text-xl font-bold text-gray-900 dark:text-foreground tracking-tight">Room {residency.roomNumber}</h4>
                                                <p className={`text-xs font-bold uppercase tracking-wide ${isCheckedOut ? 'text-rose-500' : 'text-emerald-600'}`}>
                                                    {isCheckedOut ? 'Residency Inactive' : `Floor ${residency.floor} • ${residency.roomType}`}
                                                </p>
                                            </div>
                                        </div>

                                        <Separator className="bg-gray-100" />

                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest mb-3">Hostel Name</p>
                                            <div className="bg-gray-50 dark:bg-muted/10 rounded-xl p-4 border border-gray-100 dark:border-border">
                                                <h5 className="font-bold text-gray-900 dark:text-foreground">{hostel.name || "Our Hostel"}</h5>
                                                <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">{hostel.address || "Address not available"}</p>
                                                {hostel.phone && <p className="text-xs text-gray-400 dark:text-muted-foreground mt-2 font-mono">{hostel.phone}</p>}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-10">
                                        <div className="h-12 w-12 bg-gray-50 dark:bg-muted/10 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400 dark:text-muted-foreground">
                                            <Building2 className="h-6 w-6" />
                                        </div>
                                        <p className="text-xs font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest">No active stay found</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Guardian Info */}
                        <Card className="rounded-[2rem] border-gray-100 dark:border-border shadow-sm overflow-hidden">
                            <CardHeader className="bg-gray-50 dark:bg-background border-b border-gray-50 py-4 px-6">
                                <h3 className="text-xs font-bold text-gray-900 dark:text-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Contact className="h-4 w-4 text-gray-500 dark:text-muted-foreground" /> Guardian Info
                                </h3>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-wider">Guardian Name</Label>
                                        <p className="font-bold text-sm text-gray-900 dark:text-foreground">{resident.guardianName || "N/A"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-wider">Phone Number</Label>
                                        <p className="font-bold text-sm text-gray-900 dark:text-foreground">{resident.guardianPhone || "N/A"}</p>
                                    </div>
                                </div>
                                <div className="bg-rose-50 rounded-xl p-4 border border-rose-100 flex items-start gap-3">
                                    <HeartPulse className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest">Emergency Contact</p>
                                        <p className="font-bold text-sm text-rose-900">{resident.emergencyContact || "Not Added"}</p>
                                        <p className="text-[10px] text-rose-400 mt-1">This person will be called in case of emergency.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Home Address */}
                        <Card className="rounded-[2rem] border-gray-100 dark:border-border shadow-sm overflow-hidden">
                            <CardHeader className="bg-gray-50 dark:bg-background border-b border-gray-50 py-4 px-6">
                                <h3 className="text-xs font-bold text-gray-900 dark:text-foreground uppercase tracking-widest flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-gray-500 dark:text-muted-foreground" /> Home Address
                                </h3>
                            </CardHeader>
                            <CardContent className="p-6">
                                <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground leading-relaxed">
                                    {resident.address || userData.address || "Your home address will appear here."}
                                </p>
                                <div className="mt-4 flex gap-2">
                                    <Badge variant="outline" className="text-[9px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-wider border-gray-200 dark:border-border">
                                        {resident.city || userData.city || "Not Specified"}
                                    </Badge>
                                </div>
                                {resident.currentResidence && (
                                    <p className="mt-3 text-xs font-bold text-gray-600 dark:text-muted-foreground">
                                        Current Residence: {resident.currentResidence}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Digital Smart Card */}
                    <div className="lg:col-span-1">
                        <Card className="rounded-[2rem] border-gray-100 dark:border-border shadow-sm overflow-hidden sticky top-24">
                            <CardHeader className="bg-gray-50 dark:bg-background border-b border-gray-50 py-4 px-6 flex flex-row items-center justify-between">
                                <h3 className="text-xs font-bold text-gray-900 dark:text-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Fingerprint className="h-4 w-4 text-indigo-500" /> Digital ID Card
                                </h3>
                                <Badge className={`${isCheckedOut ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'} border-none text-[8px] font-bold uppercase tracking-wider px-2 py-0`}>
                                    {isCheckedOut ? 'Inactive' : 'Active Pass'}
                                </Badge>
                            </CardHeader>
                            <CardContent className="p-6 flex flex-col items-center">
                                {/* Visual Card */}
                                <div id="smart-id-card" className="w-[280px] h-[420px] rounded-[1.8rem] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-5 relative overflow-hidden shadow-2xl border border-white/10 flex flex-col justify-between select-none">
                                    <div className="absolute -top-12 -left-12 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                                    <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                                    
                                    {/* Header */}
                                    <div className="text-center relative z-10 border-b border-white/10 pb-2.5">
                                        <p className="text-[10px] font-black tracking-widest text-indigo-400 uppercase truncate">{hostel.name || "HOSTEL PORTAL"}</p>
                                        <p className="text-[7px] font-bold text-slate-400 tracking-[0.2em] uppercase mt-0.5">Resident Smart ID Pass</p>
                                    </div>

                                    {/* Avatar and Primary Details */}
                                    <div className="flex flex-col items-center my-3 relative z-10">
                                        <div className="relative">
                                            <Avatar className="h-20 w-20 border-2 border-indigo-500/40 shadow-xl">
                                                <AvatarImage src={userData.image || "/avatar-placeholder.png"} />
                                                <AvatarFallback className="text-2xl font-bold text-slate-900 bg-white">{userData.name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-slate-900 flex items-center justify-center ${isCheckedOut ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                                                {isCheckedOut ? <LogOut className="h-3 w-3 text-white" /> : <CheckCircle2 className="h-3 w-3 text-white" />}
                                            </div>
                                        </div>
                                        <h4 className="text-sm font-bold tracking-tight mt-2 text-center truncate w-full">{userData.name}</h4>
                                        <p className="text-[8px] text-indigo-300 font-mono tracking-wider mt-0.5">Reg: {userData.regNumber || "N/A"}</p>
                                    </div>

                                    {/* Key Fields Grid */}
                                    <div className="space-y-1.5 text-[10px] border-t border-white/5 pt-2.5 relative z-10">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[7px] text-slate-400 uppercase tracking-wider">Room Assignment</span>
                                            <span className="font-bold text-indigo-300">{residency.roomNumber ? `Room ${residency.roomNumber} (Fl. ${residency.floor})` : 'Unassigned'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[7px] text-slate-400 uppercase tracking-wider">CNIC Number</span>
                                            <span className="font-mono font-medium text-slate-200">{userData.cnic || "N/A"}</span>
                                        </div>
                                    </div>

                                    {/* Footer and QR Code */}
                                    <div className="flex items-center justify-between border-t border-white/10 pt-2.5 mt-auto relative z-10">
                                        <div className="text-left">
                                            <p className="text-[6px] text-slate-400 uppercase tracking-widest">Issued On</p>
                                            <p className="text-[8px] font-bold text-slate-200">{userData.joinedAt ? new Date(userData.joinedAt).toLocaleDateString() : 'N/A'}</p>
                                            <p className="text-[6px] text-slate-500 uppercase tracking-widest mt-1">UID</p>
                                            <p className="text-[7px] font-mono text-slate-400">{userData.uid?.slice(0, 12) || "N/A"}</p>
                                        </div>
                                        <div className="bg-white p-1 rounded-lg shadow-md shrink-0">
                                            <img 
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(userData.uid || userData.email || 'guest')}`} 
                                                alt="QR Pass" 
                                                className="h-12 w-12"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button 
                                    onClick={downloadSmartCard} 
                                    className="w-full max-w-[280px] mt-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider py-2 flex items-center justify-center gap-2"
                                >
                                    <CreditCard className="h-4 w-4" /> Download ID Pass (PNG)
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Residency History Log */}
                {profile?.history?.length > 0 && (
                    <Card className="rounded-[2rem] border-gray-100 dark:border-border shadow-sm overflow-hidden group">
                        <CardHeader className="bg-gray-50 dark:bg-background border-b border-gray-50 py-4 px-6 flex flex-row items-center justify-between">
                            <h3 className="text-xs font-bold text-gray-900 dark:text-foreground uppercase tracking-widest flex items-center gap-2">
                                <History className="h-4 w-4 text-gray-500 dark:text-muted-foreground" /> Residency Timeline
                            </h3>
                            <Badge variant="outline" className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest bg-white dark:bg-card border-gray-200 dark:border-border px-3">
                                {profile.history.length} Record{profile.history.length > 1 ? 's' : ''}
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-gray-50 dark:divide-border/20">
                                {profile.history.map((item, idx) => (
                                    <div key={item.id} className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-muted/5 dark:bg-muted/10/30 transition-all cursor-default group/item">
                                        <div className="flex items-center gap-5">
                                            <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover/item:bg-slate-900 group-hover/item:text-white transition-all">
                                                <Home className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-foreground">Room {item.roomNumber || 'N/A'}</p>
                                                    <Badge className="bg-rose-50 text-rose-500 border-none text-[8px] font-bold uppercase tracking-wider px-2 py-0">Completed</Badge>
                                                </div>
                                                <p className="text-[10px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-widest mt-0.5">{item.hostelName || 'Unknown Hostel'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-2 justify-end">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] font-bold text-gray-900 dark:text-foreground uppercase tracking-widest leading-none">
                                                        {item.checkIn ? new Date(item.checkIn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                                    </span>
                                                    <span className="text-[8px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-[0.15em] mt-1">Arrival</span>
                                                </div>
                                                <div className="h-4 w-[1px] bg-gray-200 mx-1" />
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] font-bold text-gray-900 dark:text-foreground uppercase tracking-widest leading-none">
                                                        {item.checkOut ? new Date(item.checkOut).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                                    </span>
                                                    <span className="text-[8px] font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-[0.15em] mt-1">Departed</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {additionalImages.length > 0 && (
                    <Card className="rounded-[2rem] border-gray-100 dark:border-border shadow-sm overflow-hidden">
                        <CardHeader className="bg-gray-50 dark:bg-background border-b border-gray-50 py-4 px-6">
                            <h3 className="text-xs font-bold text-gray-900 dark:text-foreground uppercase tracking-widest">
                                Additional Documents
                            </h3>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {additionalImages.map((src, idx) => (
                                    <a key={`${src}-${idx}`} href={src} target="_blank" rel="noreferrer" className="block border border-gray-100 dark:border-border rounded-xl overflow-hidden bg-white dark:bg-card">
                                        <img src={src} alt={`additional-${idx}`} className="h-28 w-full object-cover" />
                                    </a>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Account Security */}
                <Card className="rounded-[2rem] border-gray-100 dark:border-border shadow-sm overflow-hidden bg-gray-900 text-white">
                    <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="h-12 w-12 rounded-2xl bg-white dark:bg-card/10 flex items-center justify-center backdrop-blur-md">
                                <Shield className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white uppercase tracking-tight">Account Safety</h3>
                                <p className="text-xs text-gray-400 dark:text-muted-foreground mt-1">Your data is secured and only visible to you and the admin.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

            </main>
        </div>
    );
};

export default GuestProfile;
