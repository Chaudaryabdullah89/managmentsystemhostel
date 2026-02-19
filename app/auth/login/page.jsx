"use client"
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Loader2, Building2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import Cookies from 'js-cookie';

export default function LoginPage() {
    const router = useRouter();
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
            Cookies.set('token', data.token, { expires: 7, secure: true, sameSite: 'strict' });
            toast.success('Welcome back!');
            setTimeout(() => router.push('/admin/dashboard'), 400);
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="py-10 flex items-center justify-center px-8 relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100" style={{ minHeight: '100vh' }}>

            {/* Dot grid */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: "radial-gradient(circle at 1px 1px, #1d4ed8 1px, transparent 0)",
                    backgroundSize: "36px 36px",
                }}
            />

            {/* Ambient glows */}
            <div className="absolute -top-52 left-1/4 w-[700px] h-[500px] bg-blue-300/20 rounded-full blur-[160px] pointer-events-none" />
            <div className="absolute -bottom-52 right-1/4 w-[600px] h-[500px] bg-indigo-300/20 rounded-full blur-[140px] pointer-events-none" />

            {/* Decorative rings */}
            <div className="absolute top-16 left-16 w-20 h-20 rounded-2xl border border-blue-200/60 rotate-12 pointer-events-none" />
            <div className="absolute bottom-20 right-16 w-28 h-28 rounded-full border border-indigo-200/60 pointer-events-none" />
            <div className="absolute top-1/2 right-12 w-10 h-10 rounded-xl border border-blue-300/40 rotate-45 pointer-events-none" />

            {/* Card */}
            <div className="relative w-full max-w-[420px]">
                <div className="bg-white/85 backdrop-blur-2xl border border-white/60 rounded-[32px] shadow-[0_32px_80px_-12px_rgba(37,99,235,0.12)] overflow-hidden">

                    {/* Top accent bar */}
                    <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600" />

                    <div className="px-10 pt-10 pb-10">

                        {/* Brand */}
                        <div className="flex flex-col items-center mb-9">
                            <div className="relative mb-5">
                                <div className="absolute inset-0 rounded-2xl bg-blue-500/15 blur-xl scale-150" />
                                <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/25">
                                    <Building2 className="h-8 w-8 text-white" />
                                </div>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">GreenView Hostels</h1>
                            <p className="text-[11px] font-bold text-blue-600 uppercase tracking-[0.2em] mt-1.5">Management Portal</p>
                        </div>

                        {/* Heading */}
                        <div className="mb-7">
                            <h2 className="text-xl font-bold text-gray-900">Welcome back 👋</h2>
                            <p className="text-sm text-gray-400 mt-1">Sign in to access your dashboard</p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4" noValidate>

                            {/* Email */}
                            <div className="space-y-1.5">
                                <label htmlFor="email" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Email
                                </label>
                                <div className="relative group">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-blue-600 transition-colors duration-200" />
                                    <input
                                        id="email"
                                        type="email"
                                        autoComplete="email"
                                        placeholder="you@greenview.com"
                                        value={formData.email}
                                        onChange={(e) => { setFormData(p => ({ ...p, email: e.target.value })); setError(''); }}
                                        className="w-full h-12 pl-10 pr-4 rounded-2xl bg-gray-50/80 border border-gray-200 text-sm font-medium text-gray-900 placeholder:text-gray-300 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="password" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Password
                                    </label>
                                    <Link href="/auth/forgot-password" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-blue-600 transition-colors duration-200" />
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        placeholder="••••••••••"
                                        value={formData.password}
                                        onChange={(e) => { setFormData(p => ({ ...p, password: e.target.value })); setError(''); }}
                                        className="w-full h-12 pl-10 pr-11 rounded-2xl bg-gray-50/80 border border-gray-200 text-sm font-medium text-gray-900 placeholder:text-gray-300 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(v => !v)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Remember me */}
                            <div className="flex items-center gap-2">
                                <input id="remember" type="checkbox" className="h-4 w-4 rounded accent-blue-600 cursor-pointer" />
                                <label htmlFor="remember" className="text-sm text-gray-500 cursor-pointer select-none">Remember me</label>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-red-50 border border-red-100">
                                    <div className="h-1.5 w-1.5 rounded-full bg-red-400 flex-shrink-0" />
                                    <p className="text-sm font-medium text-red-500">{error}</p>
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 mt-1 rounded-2xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <><Loader2 className="h-4 w-4 animate-spin" /><span>Signing in...</span></>
                                ) : (
                                    <><span>Sign In</span><ArrowRight className="h-4 w-4" /></>
                                )}
                            </button>
                        </form>

                        {/* Footer note */}

                    </div>
                </div>

                <p className="text-center text-[11px] text-gray-400 mt-6">
                    © 2024 GreenView Hostels · All rights reserved
                </p>
            </div>
        </div>
    );
}
