"use client"
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Loader2, Building2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import Cookies from 'js-cookie';
import useAuthStore from '@/hooks/Authstate';

export default function LoginPage() {
    const router = useRouter();
    const { setToken, setUser } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.email || !formData.password) {
            setError('Please enter your email and password.');
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            const response = await fetch('/api/auth/signin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
                credentials: 'include',
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                setError(data.message || 'Invalid email or password.');
                return;
            }

            // Set session and update store
            Cookies.set('token', data.token, { expires: 7, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
            setToken(data.token);
            if (data.User) {
                await setUser({ ...data.User, id: data.User.id });
            }

            toast.success('Welcome back!');

            // Role-based redirection
            const role = data.User?.role;
            let redirectPath = '/admin/dashboard';

            if (role === 'WARDEN') {
                redirectPath = '/warden';
            } else if (role === 'STAFF') {
                redirectPath = '/staff/dashboard';
            } else if (role === 'RESIDENT' || role === 'GUEST') {
                redirectPath = '/guest/dashboard';
            }

            setTimeout(() => router.push(redirectPath), 400);
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white font-sans antialiased text-slate-900 relative overflow-hidden">

            {/* Subtle Grid Background */}
            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px] opacity-40 pointer-events-none" />

            {/* LEFT SIDE — Structured Visual */}
            <div className="hidden lg:flex w-1/2 relative items-center justify-center overflow-hidden">

                {/* Soft lighting */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-3xl rounded-full" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 blur-3xl rounded-full" />

                {/* Floating Glass Panels */}
                <div className="relative w-[420px] h-[420px]">

                    <div className="absolute top-0 left-0 w-64 h-40 bg-white/70 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl" />

                    <div className="absolute bottom-10 right-0 w-72 h-44 bg-white/70 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl" />

                    <div className="absolute top-32 left-24 w-80 h-52 bg-slate-900 rounded-3xl shadow-2xl flex items-center justify-center">
                        <Building2 className="h-10 w-10 text-white opacity-90" />
                    </div>

                </div>

            </div>

            {/* RIGHT SIDE — LOGIN */}
            <div className="flex w-full lg:w-1/2 items-center justify-center p-6 lg:p-16 relative z-10">

                <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-10 shadow-[0_30px_80px_rgba(0,0,0,0.04)]">

                    {/* Brand */}
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight">GreenView</h1>
                            <p className="text-[10px] uppercase tracking-widest text-slate-400">
                                Management Node
                            </p>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-xl font-semibold">Sign In</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Enter your credentials to continue
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Email */}
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Email Address
                            </label>
                            <div className="relative mt-2">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="email"
                                    placeholder="you@greenview.io"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData((p) => ({ ...p, email: e.target.value }))
                                    }
                                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Password
                                </label>
                                <Link
                                    href="/auth/forgot-password"
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Forgot?
                                </Link>
                            </div>

                            <div className="relative mt-2">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData((p) => ({ ...p, password: e.target.value }))
                                    }
                                    className="w-full h-12 pl-12 pr-12 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 mt-4 rounded-xl bg-slate-950 text-white text-sm font-semibold hover:bg-slate-800 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    Authenticate <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </button>

                    </form>

                </div>
            </div>
        </div>
    );
}
