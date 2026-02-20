"use client";
import React from 'react';
import {
    Bed,
    CreditCard,
    MessageSquare,
    ChevronRight,
    AlertCircle,
    Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import useAuthStore from "@/hooks/Authstate";
import { useBookings } from "@/hooks/useBooking";
import { useAllPayments } from "@/hooks/usePayment";
import { useComplaints } from "@/hooks/usecomplaints";

const GuestDashboard = () => {
    const user = useAuthStore((state) => state.user);

    // Fetch Data
    const { data: bookingsData, isLoading: bookingsLoading } = useBookings({ userId: user?.id });
    const { data: paymentsData, isLoading: paymentsLoading } = useAllPayments({ userId: user?.id, limit: 10 });
    const { data: complaintsData, isLoading: complaintsLoading } = useComplaints({ userId: user?.id });

    const isLoading = bookingsLoading || paymentsLoading || complaintsLoading;
    const [showWelcome, setShowWelcome] = React.useState(false);
    const [isExiting, setIsExiting] = React.useState(false);

    const handleContinue = () => {
        setIsExiting(true);
        setTimeout(() => setShowWelcome(false), 1000); // Allow time for closing animations to complete
    };

    React.useEffect(() => {
        if (user) {
            const hasSeenWelcome = sessionStorage.getItem(`hasSeenWelcome_${user.id}`);
            if (!hasSeenWelcome) {
                setShowWelcome(true);
                sessionStorage.setItem(`hasSeenWelcome_${user.id}`, 'true');
            }
        }
    }, [user]);

    // Derived State
    const currentBooking = bookingsData?.find(b => ['CONFIRMED', 'CHECKED_IN'].includes(b.status)) || bookingsData?.[0];
    const hasCheckedOut = bookingsData?.some(b => b.status === 'CHECKED_OUT');
    const hasActiveBooking = bookingsData?.some(b => ['CONFIRMED', 'CHECKED_IN', 'Active'].includes(b.status));
    const isCheckedOut = hasCheckedOut && !hasActiveBooking;
    const pendingPayment = paymentsData?.payments?.find(p => p.status === 'PENDING' || p.status === 'OVERDUE');
    const activeComplaints = complaintsData?.filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED') || [];

    return (
        <React.Fragment>
            {/* Welcome Screen Overlay */}
            {showWelcome && (
                <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#09090b] overflow-hidden transition-opacity duration-1000 ${isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    {/* Dynamic Ambient Background Elements */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/30 via-purple-900/10 to-transparent pointer-events-none"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[800px] md:h-[800px] bg-indigo-600/30 rounded-full blur-[120px] animate-pulse duration-[4000ms]"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-violet-600/20 rounded-full blur-[80px] animate-pulse duration-[3000ms] delay-700"></div>

                    <div className={`text-center relative z-10 flex flex-col items-center transition-all duration-1000 ${isExiting ? 'scale-110 opacity-0 -translate-y-10' : 'scale-100 opacity-100'}`}>
                        {/* Animated Icon Avatar */}
                        <div className="animate-in zoom-in-50 fade-in duration-1000 ease-out fill-mode-both mb-12 relative group">
                            <div className="absolute inset-0 bg-indigo-500 rounded-full blur-2xl opacity-40 animate-pulse duration-[2000ms]"></div>
                            <div className="relative w-32 h-32 md:w-48 md:h-48 bg-white/5 rounded-full flex items-center justify-center backdrop-blur-3xl border border-white/10 shadow-[0_0_100px_rgba(79,70,229,0.3)]">
                                <Bed className="h-16 w-16 md:h-24 md:w-24 text-white/90 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                            </div>
                        </div>

                        {/* Huge Staggered Typography */}
                        <div className="space-y-2 md:space-y-4 overflow-hidden px-4">
                            <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-indigo-200 to-indigo-600 tracking-tighter leading-none animate-in slide-in-from-bottom-[50%] fade-in duration-1000 delay-300 fill-mode-both pb-4">
                                WELCOME
                            </h1>
                            <p className="text-xl md:text-3xl lg:text-4xl font-bold bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-300 to-violet-500 bg-clip-text text-transparent uppercase tracking-[0.5em] animate-in slide-in-from-bottom-10 fade-in duration-1000 delay-1000 fill-mode-both mt-4">
                                {user?.name}
                            </p>
                            <p className="max-w-[80%] mx-auto text-xs md:text-sm font-medium text-indigo-200/60 uppercase tracking-widest leading-loose animate-in slide-in-from-bottom-5 fade-in duration-1000 delay-[1500ms] fill-mode-both mt-8 pt-8 border-t border-indigo-500/20">
                                Step into your sanctuary. <br /> We are thrilled to have you with us. <br className="md:hidden" /> Enjoy your stay.
                            </p>
                        </div>

                        {/* Continue Button */}
                        <div className="mt-16 animate-in slide-in-from-bottom-5 fade-in duration-1000 delay-[2500ms] fill-mode-both relative z-20">
                            <Button
                                onClick={handleContinue}
                                className="h-14 px-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold tracking-widest uppercase text-xs backdrop-blur-md border border-white/20 shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:shadow-[0_0_50px_rgba(79,70,229,0.5)] transition-all group"
                            >
                                Continue to Dashboard
                                <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </div>

                    {/* Cinematic Sparkle Particles */}
                    <div className="absolute inset-0 pointer-events-none">
                        {[...Array(40)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,1)] animate-in fade-in zoom-in"
                                style={{
                                    top: `${Math.random() * 100}%`,
                                    left: `${Math.random() * 100}%`,
                                    width: `${Math.random() * 4 + 1}px`,
                                    height: `${Math.random() * 4 + 1}px`,
                                    opacity: Math.random() * 0.8 + 0.2,
                                    animationDuration: `${Math.random() * 2 + 2}s`,
                                    animationDelay: `${Math.random() * 1}s`,
                                    animationIterationCount: 'infinite',
                                    animationDirection: 'alternate'
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
                    <Activity className="h-8 w-8 text-gray-400 animate-pulse" />
                </div>
            ) : (
                <div className="min-h-screen bg-gray-50/50 pb-20 font-sans tracking-tight relative overflow-hidden">
                    {/* Header */}
                    <header className="bg-white border-b sticky top-0 z-40 animate-in slide-in-from-top-4 fade-in duration-700">
                        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Welcome, {user?.name?.split(' ')[0]}</h1>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        {isCheckedOut ? 'Archived Resident' : 'Guest Dashboard'}
                                    </span>
                                    {user?.uid && (
                                        <>
                                            <span className="h-1 w-1 rounded-full bg-gray-200" />
                                            <Badge className="bg-gray-100 text-gray-500 border-none text-[8px] font-mono font-bold px-1.5 py-0">
                                                {user.uid}
                                            </Badge>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </header>

                    <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                        {/* Info Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Room Info */}
                            <Card className="bg-white border-gray-100 shadow-sm rounded-3xl overflow-hidden group hover:shadow-md transition-all animate-in slide-in-from-bottom-6 fade-in duration-700 fill-mode-both delay-100">
                                <CardHeader className={`flex flex-row items-center justify-between pb-2 border-b ${isCheckedOut ? 'bg-gradient-to-br from-rose-50 to-white border-rose-50/50' : 'bg-gradient-to-br from-emerald-50 to-white border-emerald-50/50'}`}>
                                    <CardTitle className="text-sm font-bold text-gray-900 uppercase tracking-widest">Residency Status</CardTitle>
                                    <Bed className={`h-5 w-5 ${isCheckedOut ? 'text-rose-600' : 'text-emerald-600'}`} />
                                </CardHeader>
                                <CardContent className="pt-6">
                                    {isCheckedOut ? (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-2xl font-bold text-gray-400 tracking-tighter uppercase italic">Checked Out</span>
                                            <span className="text-xs font-bold text-gray-500">History: {currentBooking?.Room?.roomNumber || 'N/A'} • {currentBooking?.Room?.Hostel?.name || 'N/A'}</span>
                                            <Badge className="w-fit mt-2 bg-rose-50 text-rose-500 border-none rounded-full text-[10px] uppercase font-bold tracking-wider">
                                                Access Limited
                                            </Badge>
                                        </div>
                                    ) : currentBooking ? (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-3xl font-bold text-gray-900 tracking-tighter">Room {currentBooking.Room?.roomNumber || 'N/A'}</span>
                                            <span className="text-xs font-bold text-gray-500">{currentBooking.Room?.Hostel?.name || 'Assigned'}</span>
                                            <Badge className="w-fit mt-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none rounded-full text-[10px] uppercase font-bold tracking-wider">
                                                Stay Active
                                            </Badge>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-lg font-bold text-gray-400 italic">No Active Room</span>
                                            <Link href="/guest/bookings">
                                                <Button variant="link" className="p-0 text-emerald-600 font-bold text-[10px] uppercase">
                                                    Apply for a room
                                                </Button>
                                            </Link>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>


                            {/* Pending Dues */}
                            <Card className="bg-white border-gray-100 shadow-sm rounded-3xl overflow-hidden group hover:shadow-md transition-all animate-in slide-in-from-bottom-6 fade-in duration-700 fill-mode-both delay-200">
                                <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-br from-indigo-50 to-white border-b border-indigo-50/50">
                                    <CardTitle className="text-sm font-bold text-gray-900 uppercase tracking-widest">Amount Due</CardTitle>
                                    <CreditCard className="h-5 w-5 text-indigo-600" />
                                </CardHeader>
                                <CardContent className="pt-6">
                                    {pendingPayment ? (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-3xl font-bold text-gray-900 tracking-tighter">PKR {pendingPayment.amount?.toLocaleString()}</span>
                                            <span className="text-xs font-bold text-gray-500">For {pendingPayment.notes || 'Current Month'}</span>
                                            <Badge className="w-fit mt-2 bg-rose-100 text-rose-700 border-none rounded-full text-[10px] uppercase font-bold tracking-wider">
                                                Payment Pending
                                            </Badge>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-lg font-bold text-gray-400 italic">No Dues</span>
                                            <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">All payments cleared</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Reported Issues */}
                            <Card className="bg-white border-gray-100 shadow-sm rounded-3xl overflow-hidden group hover:shadow-md transition-all animate-in slide-in-from-bottom-6 fade-in duration-700 fill-mode-both delay-300">
                                <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-br from-amber-50 to-white border-b border-amber-50/50">
                                    <CardTitle className="text-sm font-bold text-gray-900 uppercase tracking-widest">{isCheckedOut ? 'Support History' : 'Active Issues'}</CardTitle>
                                    <MessageSquare className="h-5 w-5 text-amber-600" />
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-3xl font-bold text-gray-900 tracking-tighter">{activeComplaints.length} {isCheckedOut ? 'Archived' : 'Shared'}</span>
                                        <span className="text-xs font-bold text-gray-500">
                                            {isCheckedOut ? 'Historical records restricted' : activeComplaints.length > 0 ? 'Team is working on it' : 'Everything looks good'}
                                        </span>
                                        <Link href="/guest/support">
                                            <Button variant="link" className="p-0 h-auto text-amber-600 font-bold text-[10px] uppercase tracking-wider mt-2 group-hover:underline">
                                                {isCheckedOut ? 'View Archive' : 'Check Progress'} <ChevronRight className="h-3 w-3 ml-1" />
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>

                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Recent Payments Summary */}
                            <div className="space-y-6 animate-in slide-in-from-bottom-8 fade-in duration-700 fill-mode-both delay-[400ms]">
                                <div className="flex items-center justify-between px-2">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Recent Payments</h3>
                                    <Link href="/guest/payments">
                                        <Button variant="ghost" size="sm" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-black">
                                            History
                                        </Button>
                                    </Link>
                                </div>
                                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
                                    {paymentsData?.payments?.length > 0 ? paymentsData.payments.slice(0, 3).map((payment) => (
                                        <div key={payment.id} className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition-colors -mx-2">
                                            <div className="flex items-center gap-4">
                                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${payment.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                    <CreditCard className="h-4 w-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-900">{payment.notes || 'Stay Payment'}</span>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{new Date(payment.date).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-gray-900">PKR {payment.amount?.toLocaleString()}</div>
                                                <span className={`text-[9px] font-bold uppercase tracking-wider ${payment.status === 'PAID' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                    {payment.status === 'PAID' ? 'Done' : 'Pending'}
                                                </span>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-8 text-gray-400 text-xs font-bold uppercase tracking-widest">No payments yet</div>
                                    )}
                                </div>
                            </div>

                            {/* Recent Issues Summary */}
                            <div className="space-y-6 animate-in slide-in-from-bottom-8 fade-in duration-700 fill-mode-both delay-[500ms]">
                                <div className="flex items-center justify-between px-2">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Recent Issues</h3>
                                    <Link href="/guest/support">
                                        <Button variant="ghost" size="sm" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-black">
                                            Support hub
                                        </Button>
                                    </Link>
                                </div>
                                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
                                    {complaintsData && complaintsData.length > 0 ? complaintsData.slice(0, 3).map((complaint) => (
                                        <div key={complaint.id} className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition-colors -mx-2">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-gray-50 text-gray-500 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                                                    <AlertCircle className="h-4 w-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-900">{complaint.title}</span>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{new Date(complaint.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className={`border-none rounded-full text-[9px] font-bold uppercase tracking-wider
                                        ${complaint.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}
                                    `}>
                                                {complaint.status === 'RESOLVED' ? 'Fixed' : 'Sent'}
                                            </Badge>
                                        </div>
                                    )) : (
                                        <div className="text-center py-8 text-gray-400 text-xs font-bold uppercase tracking-widest">No issues reported</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            )}
        </React.Fragment>
    );
};

export default GuestDashboard;
