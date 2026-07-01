import React from "react";
import Link from "next/link";
import { getBranding } from "@/lib/permissions";
import {
  ArrowLeft,
  Shield,
  FileText,
  RefreshCw,
  Award,
  CreditCard,
  UserCheck,
  Zap,
  Info,
  Scale,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function TermsOfService() {
  const branding = await getBranding();

  const sections = [
    {
      icon: UserCheck,
      title: "1. Eligibility & Registration",
      color: "from-blue-500 to-indigo-500",
      content: (
        <div className="space-y-1.5 mt-2 text-xs text-gray-600 dark:text-muted-foreground font-medium">
          <p className="flex items-start gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1 shrink-0" /> Accurate personal and guardian information must be provided.
          </p>
          <p className="flex items-start gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1 shrink-0" /> A valid government CNIC or registration B-Form is mandatory.
          </p>
          <p className="flex items-start gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1 shrink-0" /> False declarations will result in instant booking forfeiture.
          </p>
        </div>
      ),
    },
    {
      icon: Award,
      title: "2. Room Allocation & Booking",
      color: "from-purple-500 to-indigo-500",
      content: (
        <div className="space-y-1.5 mt-2 text-xs text-gray-600 dark:text-muted-foreground font-medium">
          <p className="flex items-start gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-1 shrink-0" /> Room allocations are subject to portal availability.
          </p>
          <p className="flex items-start gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-1 shrink-0" /> The administration reserves final room reassignment rights.
          </p>
          <p className="flex items-start gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-1 shrink-0" /> Declared check-in and check-out timelines must be met.
          </p>
        </div>
      ),
    },
    {
      icon: CreditCard,
      title: "3. Payments, Fees & Penalties",
      color: "from-emerald-500 to-teal-500",
      content: (
        <div className="space-y-1.5 mt-2 text-xs text-gray-600 dark:text-muted-foreground font-medium">
          <p className="flex items-start gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1 shrink-0" /> All fee bills must be submitted before due dates.
          </p>
          <p className="flex items-start gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1 shrink-0" /> Late fees trigger standardized daily surcharge updates.
          </p>
          <p className="flex items-start gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1 shrink-0" /> Extended arrears may lead to portal access suspensions.
          </p>
        </div>
      ),
    },
    {
      icon: Zap,
      title: "4. Hostel Conduct Guidelines",
      color: "from-amber-500 to-orange-500",
      content: (
        <div className="space-y-1.5 mt-2 text-xs text-gray-600 dark:text-muted-foreground font-medium">
          <p className="flex items-start gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1 shrink-0" /> Residents must respect community guidelines and quiet hours.
          </p>
          <p className="flex items-start gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1 shrink-0" /> Vandalism or property damage will be billed to the resident.
          </p>
          <p className="flex items-start gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1 shrink-0" /> Possession of prohibited items triggers automatic eviction.
          </p>
        </div>
      ),
    },
    {
      icon: Shield,
      title: "5. Safety & Security Protocols",
      color: "from-cyan-500 to-blue-500",
      content: (
        <p className="text-xs text-gray-600 dark:text-muted-foreground leading-relaxed mt-2 font-medium">
          CCTV is active inside common areas. Residents are required to cooperate with regular security checks, visitor declaration records, and emergency drills scheduled by the Warden.
        </p>
      ),
    },
    {
      icon: LogOut,
      title: "6. Termination & Refund Rules",
      color: "from-rose-500 to-pink-500",
      content: (
        <div className="space-y-1.5 mt-2 text-xs text-gray-600 dark:text-muted-foreground font-medium">
          <p className="flex items-start gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-1 shrink-0" /> Eviction for code violation waives refund entitlements.
          </p>
          <p className="flex items-start gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-1 shrink-0" /> Voluntary exits require a 30-day portal checkout notice.
          </p>
          <p className="flex items-start gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-1 shrink-0" /> Security deposit refund is processed post room inspections.
          </p>
        </div>
      ),
    },
    {
      icon: Scale,
      title: "7. Limitation of Liability",
      color: "from-teal-500 to-emerald-500",
      content: (
        <p className="text-xs text-gray-600 dark:text-muted-foreground leading-relaxed mt-2 font-medium">
          {branding.companyName} does not accept liability for the loss, theft, or damage of personal valuables or electronic assets stored inside individual resident dorms.
        </p>
      ),
    },
    {
      icon: Info,
      title: "8. Changes to Terms",
      color: "from-slate-500 to-gray-500",
      content: (
        <p className="text-xs text-gray-600 dark:text-muted-foreground leading-relaxed mt-2 font-medium">
          The administration reserves rights to modify terms at any point. Continued use of the HMS portal constitutes consensus to updated compliance frameworks.
        </p>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-muted/10/30 text-gray-900 dark:text-foreground font-sans antialiased pb-20 relative overflow-hidden">
      {/* Background Blurs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

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
              <h1 className="text-sm font-black uppercase tracking-tighter italic">Terms of Service</h1>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-muted-foreground">
                {branding.companyName} Compliance Code
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-muted/10 px-4 py-2 rounded-xl border border-gray-100 dark:border-border/50">
            Effective Date: March 4, 2026
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-6 mt-12 space-y-12">
        {/* Hero Banner */}
        <section className="bg-gradient-to-r from-gray-900 to-indigo-950 p-8 md:p-12 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-4 max-w-2xl">
            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <FileText className="h-5 w-5 text-indigo-300" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight italic">
              User Agreement & Facility Code
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed">
              These Terms of Service govern accommodations, payment criteria, and conduct at {branding.companyName}. By registering inside our portal or completing bookings, you agree to strictly comply with these facility guidelines.
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

        {/* Legal Contact Bar */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="bg-gray-50 dark:bg-muted/10/30 border border-gray-100 dark:border-border/50 p-6 rounded-[2.25rem] flex gap-4">
            <div className="h-9 w-9 bg-black text-white rounded-xl flex items-center justify-center shrink-0">
              <RefreshCw className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-tight text-gray-900 dark:text-foreground">Changes to terms</h4>
              <p className="text-[11px] font-medium text-gray-500 dark:text-muted-foreground leading-relaxed">
                Guidelines may undergo adjustments to align with facility compliance standards. Revisions take effect immediately upon portal updates.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-muted/10/30 border border-gray-100 dark:border-border/50 p-6 rounded-[2.25rem] flex gap-4">
            <div className="h-9 w-9 bg-black text-white rounded-xl flex items-center justify-center shrink-0">
              <Info className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-tight text-gray-900 dark:text-foreground">Disputes & Inquiries</h4>
              <p className="text-[11px] font-medium text-gray-500 dark:text-muted-foreground leading-relaxed">
                For clarity on facility compliance codes or payment obligations, please raise an inquiry with the admin through the portal dashboard.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
