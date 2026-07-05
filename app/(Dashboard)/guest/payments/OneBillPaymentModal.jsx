"use client";
import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    CreditCard,
    Globe,
    Sparkles,
    ShieldCheck,
    Hourglass
} from "lucide-react";

export default function OneBillPaymentModal({ payment, user, onSuccess, children }) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-[420px] p-0 border-none shadow-2xl rounded-[1.5rem] bg-white overflow-hidden ring-1 ring-black/[0.05]">

                {/* 1Link Branding Header */}
                <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-full bg-white/[0.03] skew-x-[30deg] translate-x-10" />
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
                                <Globe className="h-4 w-4 text-blue-200" />
                            </div>
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-white">1Link 1Bill Payments</h3>
                                <p className="text-[8.5px] font-bold text-blue-200/80 uppercase tracking-widest">
                                    Direct Banking Integration
                                </p>
                            </div>
                        </div>
                        <Badge className="text-[8px] font-black uppercase tracking-wider py-0.5 border bg-amber-500/20 text-amber-300 border-amber-500/30">
                            Coming Soon
                        </Badge>
                    </div>
                </div>

                {/* Coming Soon Body */}
                <div className="p-6 text-center space-y-5">
                    <div className="relative w-16 h-16 mx-auto flex items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                        <Hourglass className="h-7 w-7 text-indigo-600 animate-pulse" />
                        <div className="absolute -top-1 -right-1 h-5 w-5 bg-amber-500 rounded-full flex items-center justify-center text-white border-2 border-white">
                            <Sparkles className="h-2.5 w-2.5" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                            Online Bank Transfers coming soon!
                        </h3>
                        <p className="text-[11.5px] text-slate-500 leading-relaxed max-w-[280px] mx-auto font-medium">
                            We are completing the final integration steps with 1Link. Soon you will be able to pay bills directly via EasyPaisa, JazzCash, or any Pakistani Bank App.
                        </p>
                    </div>

                    {/* Feature Highlights */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left space-y-3">
                        <div className="flex gap-3">
                            <div className="h-5 w-5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Instant Ledger Updates</h4>
                                <p className="text-[10.5px] text-slate-400 font-semibold leading-normal mt-0.5">Auto-marked as Paid in real-time without warden reviews.</p>
                            </div>
                        </div>
                        <div className="h-px bg-slate-200/60" />
                        <div className="flex gap-3">
                            <div className="h-5 w-5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Zero Extra Verification</h4>
                                <p className="text-[10.5px] text-slate-400 font-semibold leading-normal mt-0.5">No need to upload screenshots or notify anyone.</p>
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={() => setOpen(false)}
                        className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-sm"
                    >
                        Close
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    );
}
