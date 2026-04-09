import React from "react";
import { getBranding } from "@/lib/permissions";

export default async function TermsOfService() {
    const branding = await getBranding();
    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 text-slate-800">

            {/* Top Portal Header */}
            <div className="border-b bg-white/70 backdrop-blur-xl shadow-sm">
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Terms of Service
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">
                        {branding.companyName} • Effective Date: March 4, 2026
                    </p>
                </div>
            </div>

            {/* Content Wrapper */}
            <div className="max-w-6xl mx-auto px-6 py-12">

                <div className="bg-white shadow-xl rounded-3xl border border-slate-200 overflow-hidden">

                    {/* Accent Top Bar */}
                    <div className="h-2 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500" />

                    <div className="p-10 space-y-12">

                        {/* Introduction */}
                        <section>
                            <p className="text-lg leading-relaxed text-slate-600">
                                These Terms of Service govern the use of the{" "}
                                {branding.companyName} Management System (HMS)
                                and hostel accommodation services. By registering,
                                booking, or staying at our hostels, you agree to
                                comply with these terms.
                            </p>
                        </section>

                        {[
                            {
                                title: "1. Eligibility & Registration",
                                content: (
                                    <ul className="space-y-2 text-slate-600">
                                        <li>• Accurate personal and guardian information must be provided.</li>
                                        <li>• Valid CNIC or B-Form is required.</li>
                                        <li>• False information may result in cancellation of booking.</li>
                                    </ul>
                                )
                            },
                            {
                                title: "2. Room Allocation & Booking",
                                content: (
                                    <ul className="space-y-2 text-slate-600">
                                        <li>• Room allocation is subject to availability.</li>
                                        <li>• Management reserves the right to change room assignments.</li>
                                        <li>• Check-in and check-out dates must be followed strictly.</li>
                                    </ul>
                                )
                            },
                            {
                                title: "3. Payments & Fees",
                                content: (
                                    <ul className="space-y-2 text-slate-600">
                                        <li>• Hostel fees must be paid on time.</li>
                                        <li>• Late payments may result in penalties.</li>
                                        <li>• Outstanding dues may lead to suspension of services.</li>
                                    </ul>
                                )
                            },
                            {
                                title: "4. Hostel Rules & Conduct",
                                content: (
                                    <ul className="space-y-2 text-slate-600">
                                        <li>• Residents must maintain discipline and respect others.</li>
                                        <li>• Illegal activities are strictly prohibited.</li>
                                        <li>• Damage to property must be compensated.</li>
                                        <li>• Quiet hours and security rules must be followed.</li>
                                    </ul>
                                )
                            },
                            {
                                title: "5. Safety & Security",
                                content: (
                                    <p className="text-slate-600 leading-relaxed">
                                        CCTV monitoring is active in common areas
                                        for safety purposes. Residents must comply
                                        with security checks and emergency procedures.
                                    </p>
                                )
                            },
                            {
                                title: "6. Termination of Stay",
                                content: (
                                    <ul className="space-y-2 text-slate-600">
                                        <li>• Management may terminate stay for rule violations.</li>
                                        <li>• Residents may request cancellation with proper notice.</li>
                                        <li>• Refunds (if applicable) are subject to hostel policy.</li>
                                    </ul>
                                )
                            },
                            {
                                title: "7. Limitation of Liability",
                                content: (
                                    <p className="text-slate-600 leading-relaxed">
                                        {branding.companyName} is not responsible
                                        for loss of personal belongings. Residents
                                        are advised to secure valuables properly.
                                    </p>
                                )
                            },
                            {
                                title: "8. Changes to Terms",
                                content: (
                                    <p className="text-slate-600 leading-relaxed">
                                        Management reserves the right to modify
                                        these terms at any time. Updated terms will
                                        be published on the HMS portal.
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

                        {/* Contact Section */}
                        <div className="border-t pt-8 mt-10">
                            <h2 className="text-lg font-semibold mb-2">
                                Contact Administration
                            </h2>
                            <p className="text-slate-600 text-sm">
                                For questions regarding these Terms of Service,
                                please contact {branding.companyName}{" "}
                                administration through the official HMS portal.
                            </p>
                        </div>

                    </div>
                </div>

            </div>
        </main>
    );
}
