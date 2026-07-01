import React from "react";
import Link from "next/link";
import { getBranding } from "@/lib/permissions";
import {
  ArrowLeft,
  Shield,
  Lock,
  Eye,
  FileText,
  UserCheck,
  RefreshCw,
  Mail,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function PrivacyPolicy() {
  const branding = await getBranding();

  const sections = [
    {
      icon: UserCheck,
      title: "1. Information We Collect",
      color: "from-blue-500 to-indigo-500",
      content: (
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="space-y-1.5 text-xs text-gray-600 dark:text-muted-foreground">
            <p className="font-bold text-gray-900 dark:text-foreground uppercase tracking-wider text-[10px]">Personal Info</p>
            <p className="flex items-center gap-1.5">• Full & Guardian Name</p>
            <p className="flex items-center gap-1.5">• CNIC / B-Form</p>
            <p className="flex items-center gap-1.5">• Contact Info</p>
            <p className="flex items-center gap-1.5">• Permanent Address</p>
          </div>
          <div className="space-y-1.5 text-xs text-gray-600 dark:text-muted-foreground">
            <p className="font-bold text-gray-900 dark:text-foreground uppercase tracking-wider text-[10px]">Portal Info</p>
            <p className="flex items-center gap-1.5">• Room Booking Details</p>
            <p className="flex items-center gap-1.5">• Check-in / Check-out</p>
            <p className="flex items-center gap-1.5">• Payment Records</p>
            <p className="flex items-center gap-1.5">• Device & Usage Data</p>
          </div>
        </div>
      ),
    },
    {
      icon: Eye,
      title: "2. How We Use Information",
      color: "from-purple-500 to-indigo-500",
      content: (
        <div className="space-y-2 mt-2 text-xs text-gray-600 dark:text-muted-foreground font-medium">
          <p className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500" /> Manage hostel room allocations & records
          </p>
          <p className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500" /> Process hostel fee payments & security audits
          </p>
          <p className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500" /> Emergency communication with guardians
          </p>
          <p className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500" /> System diagnostics & performance upgrades
          </p>
        </div>
      ),
    },
    {
      icon: ShieldAlert,
      title: "3. Security & Monitoring",
      color: "from-amber-500 to-orange-500",
      content: (
        <p className="text-xs text-gray-600 dark:text-muted-foreground leading-relaxed mt-2 font-medium">
          CCTV monitoring is active in designated common areas for community security. Recorded footage is securely archived and only accessed by authorized administrators when required.
        </p>
      ),
    },
    {
      icon: Mail,
      title: "4. Data Sharing Protocol",
      color: "from-rose-500 to-pink-500",
      content: (
        <div className="space-y-2 mt-2 text-xs text-gray-600 dark:text-muted-foreground font-medium">
          <p className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Authorized management personnel only
          </p>
          <p className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Secure third-party payment processors
          </p>
          <p className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Law enforcement & legal authorities if mandated
          </p>
        </div>
      ),
    },
    {
      icon: Lock,
      title: "5. Data Protection Standards",
      color: "from-emerald-500 to-teal-500",
      content: (
        <p className="text-xs text-gray-600 dark:text-muted-foreground leading-relaxed mt-2 font-medium">
          All data within the HMS portal is transmitted using TLS/SSL encryption and stored on secure databases with strict, role-based access controls to prevent unauthorized access.
        </p>
      ),
    },
    {
      icon: FileText,
      title: "6. Your Privacy Rights",
      color: "from-cyan-500 to-blue-500",
      content: (
        <div className="space-y-2 mt-2 text-xs text-gray-600 dark:text-muted-foreground font-medium">
          <p className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" /> Request detailed access to your records
          </p>
          <p className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" /> Correct information discrepancies
          </p>
          <p className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" /> Request account termination and data purge
          </p>
        </div>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-muted/10/30 text-gray-900 dark:text-foreground font-sans antialiased pb-20 relative overflow-hidden">
      {/* Dynamic Background Blurs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Floating Header */}
      <header className="h-20 border-b border-gray-100 dark:border-border/50 bg-white/80 dark:bg-card/85 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-gray-100 dark:hover:bg-muted/10">
                <ArrowLeft className="h-4 w-4 text-gray-500 dark:text-muted-foreground" />
              </Button>
            </Link>
            <div className="h-8 w-1 bg-black rounded-full" />
            <div className="flex flex-col">
              <h1 className="text-sm font-black uppercase tracking-tighter italic">Privacy Policy</h1>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground">
                {branding.companyName} Legal System
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-muted/10 px-4 py-2 rounded-xl border border-gray-100 dark:border-border/50">
            Last Updated: March 4, 2026
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-6 mt-12 space-y-12">
        {/* Intro Hero banner */}
        <section className="bg-gradient-to-r from-gray-900 to-indigo-950 p-8 md:p-12 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-4 max-w-2xl">
            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <Shield className="h-5 w-5 text-indigo-300" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight italic">
              Your Privacy is our Foundation.
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed">
              At {branding.companyName}, we maintain robust operational guidelines to safeguard student, resident, and guardian records. This document delineates our compliance protocols, storage mechanisms, and communication criteria inside our hostel management portal.
            </p>
          </div>
        </section>

        {/* Section Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((sec, idx) => {
            const Icon = sec.icon;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-card border border-gray-100 dark:border-border/50 rounded-[2.25rem] p-6 hover:shadow-lg transition-all group relative overflow-hidden"
              >
                <div className="flex items-start gap-4">
                  <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${sec.color} text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-2 flex-1 min-w-0">
                    <h3 className="text-sm font-black text-gray-900 dark:text-foreground uppercase tracking-tight italic">
                      {sec.title}
                    </h3>
                    {sec.content}
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Policy Updates & Contact Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="bg-gray-50 dark:bg-muted/10/30 border border-gray-100 dark:border-border/50 p-6 rounded-[2.25rem] flex gap-4">
            <div className="h-9 w-9 bg-black text-white rounded-xl flex items-center justify-center shrink-0">
              <RefreshCw className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-tight text-gray-900 dark:text-foreground">Policy Updates</h4>
              <p className="text-[11px] font-medium text-gray-500 dark:text-muted-foreground leading-relaxed">
                This document may change to maintain compliance with regional data policies. We recommend residents periodically view this portal to check for active updates.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-muted/10/30 border border-gray-100 dark:border-border/50 p-6 rounded-[2.25rem] flex gap-4">
            <div className="h-9 w-9 bg-black text-white rounded-xl flex items-center justify-center shrink-0">
              <Mail className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-tight text-gray-900 dark:text-foreground">Contact Administration</h4>
              <p className="text-[11px] font-medium text-gray-500 dark:text-muted-foreground leading-relaxed">
                For questions regarding data logs or correction audits, please contact {branding.companyName} admin directly through the feedback systems of your portal.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
