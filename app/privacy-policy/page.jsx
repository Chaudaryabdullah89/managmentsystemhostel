import React from "react";
import { getBranding } from "@/lib/permissions";

export default async function PrivacyPolicy() {
    const branding = await getBranding();
    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 text-slate-800">

            {/* Top Portal Header */}
            <div className="border-b bg-white/70 backdrop-blur-xl shadow-sm">
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Privacy Policy
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">
                        {branding.companyName} • Last Updated: March 4, 2026
                    </p>
                </div>
            </div>

            {/* Content Wrapper */}
            <div className="max-w-6xl mx-auto px-6 py-12">

                <div className="bg-white shadow-xl rounded-3xl border border-slate-200 overflow-hidden">

                    {/* Accent Top Bar */}
                    <div className="h-2 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500" />

                    <div className="p-10 space-y-12">

                        {/* Intro */}
                        <section>
                            <p className="text-lg leading-relaxed text-slate-600">
                                {branding.companyName} is committed to protecting
                                the privacy of students, residents, and guardians.
                                This policy explains how we collect, use, and secure
                                your information within our hostel management system.
                            </p>
                        </section>

                        {/* Reusable Section Block */}
                        {[
                            {
                                title: "1. Information We Collect",
                                content: (
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <ul className="space-y-2 text-slate-600">
                                            <li>• Full Name & Guardian Name</li>
                                            <li>• CNIC / B-Form</li>
                                            <li>• Contact Information</li>
                                            <li>• Permanent Address</li>
                                        </ul>
                                        <ul className="space-y-2 text-slate-600">
                                            <li>• Room Booking Details</li>
                                            <li>• Check-in / Check-out</li>
                                            <li>• Payment Records</li>
                                            <li>• Device & Usage Data</li>
                                        </ul>
                                    </div>
                                )
                            },
                            {
                                title: "2. How We Use Information",
                                content: (
                                    <ul className="space-y-2 text-slate-600">
                                        <li>• Manage hostel room allocations</li>
                                        <li>• Maintain student records</li>
                                        <li>• Process hostel fee payments</li>
                                        <li>• Emergency communication with guardians</li>
                                        <li>• Improve system performance</li>
                                    </ul>
                                )
                            },
                            {
                                title: "3. Security & Monitoring",
                                content: (
                                    <p className="text-slate-600 leading-relaxed">
                                        CCTV monitoring may be used in common areas
                                        for security purposes. Data is securely stored
                                        and accessible only to authorized personnel.
                                    </p>
                                )
                            },
                            {
                                title: "4. Data Sharing",
                                content: (
                                    <ul className="space-y-2 text-slate-600">
                                        <li>• Authorized management staff</li>
                                        <li>• Payment processors</li>
                                        <li>• Legal authorities (if required)</li>
                                        <li>• Guardians in emergency cases</li>
                                    </ul>
                                )
                            },
                            {
                                title: "5. Data Protection",
                                content: (
                                    <p className="text-slate-600 leading-relaxed">
                                        We use secure servers, encrypted connections,
                                        and restricted access controls to protect
                                        personal data within the HMS portal.
                                    </p>
                                )
                            },
                            {
                                title: "6. Your Rights",
                                content: (
                                    <ul className="space-y-2 text-slate-600">
                                        <li>• Request access to your data</li>
                                        <li>• Request correction of errors</li>
                                        <li>• Request deletion (where applicable)</li>
                                        <li>• Withdraw consent</li>
                                    </ul>
                                )
                            },
                            {
                                title: "7. Policy Updates",
                                content: (
                                    <p className="text-slate-600 leading-relaxed">
                                        This Privacy Policy may be updated periodically.
                                        Updates will be reflected on this page.
                                    </p>
                                )
                            }
                        ].map((section, index) => (
                            <div key={index} className="group">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-6 w-1 bg-gradient-to-b from-indigo-600 to-cyan-500 rounded-full" />
                                    <h2 className="text-xl font-semibold tracking-tight">
                                        {section.title}
                                    </h2>
                                </div>
                                <div className="pl-4 border-l border-slate-200">
                                    {section.content}
                                </div>
                            </div>
                        ))}

                        {/* Contact Footer */}
                        <div className="border-t pt-8 mt-10">
                            <h2 className="text-lg font-semibold mb-2">
                                Contact Management
                            </h2>
                            <p className="text-slate-600 text-sm">
                                For any privacy-related concerns, please contact{" "}
                                {branding.companyName} administration directly
                                through the official HMS portal.
                            </p>
                        </div>

                    </div>
                </div>

            </div>
        </main>
    );
}
