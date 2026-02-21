"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Home,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formData, setFormData] = useState({
        password: "",
        confirmPassword: "",
    });
    const [errors, setErrors] = useState<any>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !email) {
            toast.error("Invalid reset link");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch("/api/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, token, newpassword: formData.password }),
            });

            if (response.status === 200) {
                setIsSuccess(true);
                toast.success("Password reset successfully!");
                setTimeout(() => router.push("/auth/login"), 2000);
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.message || "Something went wrong.");
            setErrors({ submit: err.response?.data?.message || "Failed to reset password" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white relative overflow-hidden">

            {/* LEFT SIDE — Structured Visual */}
            <div className="hidden lg:flex w-1/2 relative items-center justify-center overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-3xl rounded-full" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 blur-3xl rounded-full" />

                <div className="relative w-[420px] h-[420px]">
                    <div className="absolute top-0 left-0 w-64 h-40 bg-white/70 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl" />
                    <div className="absolute bottom-10 right-0 w-72 h-44 bg-white/70 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl" />
                    <div className="absolute top-32 left-24 w-80 h-52 bg-slate-900 rounded-3xl shadow-2xl flex items-center justify-center">
                        <Lock className="h-10 w-10 text-white opacity-90" />
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE — FORM */}
            <div className="flex w-full lg:w-1/2 items-center justify-center p-6 lg:p-16 relative z-10">
                <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-10 shadow-[0_30px_80px_rgba(0,0,0,0.04)]">

                    {/* Brand */}
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
                            <Home className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight">GreenView Hostels</h1>
                            <p className="text-[10px] uppercase tracking-widest text-slate-400">Management System</p>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-xl font-semibold">Reset Password</h2>
                        <p className="text-sm text-slate-500 mt-1">Create a new password for your account</p>
                    </div>

                    {isSuccess ? (
                        <div className="text-center space-y-6">
                            <div className="flex justify-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold">Password Updated</h3>
                                <p className="text-sm text-slate-600">
                                    Your password has been successfully updated. You can now log in with your new credentials.
                                </p>
                            </div>
                            <Button
                                className="w-full h-12 rounded-xl"
                                onClick={() => router.push("/auth/login")}
                            >
                                Proceed to Login
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">

                            {/* New Password */}
                            <div>
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">New Password</Label>
                                <div className="relative mt-2">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter new password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className={`pl-12 pr-12 h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-primary ${errors.password ? "border-red-500" : ""}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Confirm Password</Label>
                                <div className="relative mt-2">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Confirm new password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className={`pl-12 pr-12 h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-primary ${errors.confirmPassword ? "border-red-500" : ""}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
                            </div>

                            {errors.submit && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                                    <p className="text-sm text-red-600">{errors.submit}</p>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-12 rounded-xl"
                                disabled={isLoading}
                            >
                                {isLoading ? "Resetting..." : <>
                                    Reset Password <ArrowRight className="w-4 h-4 ml-2" />
                                </>}
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <Card className="shadow-xl">
                <CardHeader className="space-y-1 text-center py-10">
                    <div className="flex justify-center mb-4">
                        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                    <CardTitle>Initialising...</CardTitle>
                </CardHeader>
            </Card>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}