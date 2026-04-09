#!/usr/bin/env node
/**
 * bulk-rebrand.mjs — Final pass replacer
 * Replaces all remaining hardcoded branding strings with dynamic equivalents
 */

import { readFileSync, writeFileSync } from 'fs';

const ROOT = '/Users/macbook/Documents/Abdullah/Hostel-app/mangmentsystem/my-app';

const ops = [
  // ── noticeservices.js ─────────────────────────────────────────────────────
  {
    file: 'lib/services/noticeservices/noticeservices.js',
    replacements: [
      [
        `import crypto from "crypto";`,
        `import crypto from "crypto";\nimport { getBranding } from "@/lib/permissions";`
      ],
    ]
  },

  // ── bookingservices.js ────────────────────────────────────────────────────
  {
    file: 'lib/services/bookingservices/bookingservices.js',
    replacements: [
      [
        `async sendBookingConfirmation(booking) {\n        const { sendEmail } = await import("@/lib/utils/sendmail");\n\n        const html = \``,
        `async sendBookingConfirmation(booking) {\n        const { sendEmail } = await import("@/lib/utils/sendmail");\n        const branding = await getBranding();\n\n        const html = \``
      ],
      [
        `Welcome to Mubarak Group of Hostels (MGH)`,
        `Welcome to \${branding.companyName}`
      ],
      [
        `© 2026 Mubarak Group of Hostels<br>`,
        `© \${new Date().getFullYear()} \${branding.companyName}<br>`
      ],
    ]
  },

  // ── payments/[paymentId]/route.js ─────────────────────────────────────────
  {
    file: 'app/api/(Backend)/payments/[paymentId]/route.js',
    replacements: [
      [
        // remove duplicate import added by error
        `import { getBranding } from "@/lib/permissions";\nimport { getBranding } from "@/lib/permissions";`,
        `import { getBranding } from "@/lib/permissions";`
      ],
      [
        `const payment = await paymentServices.updatePayment(paymentId, updateData);\n        const hostelName = payment.Booking?.Room?.Hostel?.name\n            || payment.User?.Hostel_User_hostelIdToHostel?.name\n            || "Mubarak Group of Hostels";`,
        `const payment = await paymentServices.updatePayment(paymentId, updateData);\n        const branding = await getBranding();\n        const hostelName = payment.Booking?.Room?.Hostel?.name\n            || payment.User?.Hostel_User_hostelIdToHostel?.name\n            || branding.companyName;`
      ],
      [
        `subject: "Payment Approved ✅ — Mubarak Group of Hostels",`,
        `subject: \`Payment Approved ✅ — \${branding.companyName}\`,`
      ],
      [
        `subject: "Payment Rejected ❌ — Mubarak Group of Hostels",`,
        `subject: \`Payment Rejected ❌ — \${branding.companyName}\`,`
      ],
    ]
  },

  // ── payments/route.js ─────────────────────────────────────────────────────
  {
    file: 'app/api/(Backend)/payments/route.js',
    replacements: [
      [
        `Mubarak Group of Hostels`,
        `Mubarak Group of Hostels` // Keep as fallback — will be updated via getBranding in the route
      ],
    ]
  },

  // ── auth/change-email/send-otp/route.ts ───────────────────────────────────
  {
    file: 'app/api/(Backend)/auth/change-email/send-otp/route.ts',
    replacements: [
      [
        `import { getBranding } from "@/lib/permissions";\nimport { getBranding } from "@/lib/permissions";`,
        `import { getBranding } from "@/lib/permissions";`
      ],
      [
        `You requested to update the email address associated with your Mubarak Group of Hostels account.`,
        `You requested to update the email address associated with your hostel management account.`
      ],
      [
        `    const html = buildEmailTemplate({\n      title: "Confirm your new email",\n      subtitle: "Security verification for your account",\n      bodyHtml,\n    });\n\n        // console.log(\`[API] POST /api/auth/change-email/send-otp - Sending email\`);\n        await sendEmail({ to: email, subject: "Verify your new email - Mubarak Group of Hostels", html });`,
        `    const branding = await getBranding();\n    const html = buildEmailTemplate({\n      title: "Confirm your new email",\n      subtitle: "Security verification for your account",\n      bodyHtml,\n      branding,\n    });\n\n        // console.log(\`[API] POST /api/auth/change-email/send-otp - Sending email\`);\n        await sendEmail({ to: email, subject: \`Verify your new email - \${branding.companyName}\`, html });`
      ],
    ]
  },

  // ── UnifiedReceipt.jsx ────────────────────────────────────────────────────
  {
    file: 'components/receipt/UnifiedReceipt.jsx',
    replacements: [
      [
        `brand: "Mubarak Group Of Hostels (MGH)",`,
        `brand: companyName + " (" + companyShortName + ")",`
      ],
      [
        `const UnifiedReceipt = ({ data, type, children }) => {`,
        `const UnifiedReceipt = ({ data, type, children }) => {\n    const { companyName, companyShortName } = useBranding();`
      ],
    ]
  },

  // ── invoice-generator.js ──────────────────────────────────────────────────
  {
    file: 'lib/utils/invoice-generator.js',
    replacements: [
      [
        `export const generateInvoice = (payment, booking) => {`,
        `export const generateInvoice = (payment, booking, branding = { companyName: "Mubarak Group of Hostels", companyShortName: "MGH" }) => {`
      ],
      [
        `brand: "Mubarak Group of Hostels (MGH)",`,
        `brand: \`\${branding.companyName} (\${branding.companyShortName})\`,`
      ],
      [
        `<p>Verified Digital Ledger Record • MGH</p>`,
        `<p>Verified Digital Ledger Record • \${branding.companyShortName}</p>`
      ],
    ]
  },

  // ── SalarySlip.jsx ────────────────────────────────────────────────────────
  {
    file: 'components/SalarySlip.jsx',
    replacements: [
      [
        `const SalarySlip = ({ salary }) => {`,
        `const SalarySlip = ({ salary, branding = { companyName: "Mubarak Group of Hostels", companyShortName: "MGH" } }) => {`
      ],
      [
        `<p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">MGH - Mubarak Group Of Hostels</p>`,
        `<p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">{branding.companyShortName} - {branding.companyName}</p>`
      ],
    ]
  },

  // ── guest/bookings/ReceiptModal.jsx ───────────────────────────────────────
  {
    file: 'app/(Dashboard)/guest/bookings/ReceiptModal.jsx',
    replacements: [
      [
        `<h1>Mubarak Group of Hostels</h1>`,
        `<h1>Hostel Management System</h1>`
      ],
      [
        `This document serves as an official summary of your stay at Mubarak Group of Hostels.</p>`,
        `This document serves as an official summary of your stay at our hostel.</p>`
      ],
      [
        `<h1 className="text-2xl font-black uppercase tracking-tight text-indigo-600">Mubarak Group of Hostels</h1>`,
        `<h1 className="text-2xl font-black uppercase tracking-tight text-indigo-600">Official Receipt</h1>`
      ],
      [
        `<p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">This document serves as an official summary of your stay at Mubarak Group of Hostels.</p>`,
        `<p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">This document serves as an official summary of your stay at our hostel.</p>`
      ],
    ]
  },

  // ── not-found.jsx ─────────────────────────────────────────────────────────
  {
    file: 'app/not-found.jsx',
    replacements: [
      [
        `Mubarak Group of Hostels (MGH)`,
        `Hostel Management System`
      ],
    ]
  },

  // ── admin/bookings/page.jsx ───────────────────────────────────────────────
  {
    file: 'app/(Dashboard)/admin/bookings/page.jsx',
    replacements: [
      [
        `"Official Mubarak Group of Hostels Records",`,
        `\`Official \${companyName} Records\`,`
      ],
    ]
  },

  // ── admin/mess/page.jsx ───────────────────────────────────────────────────
  {
    file: 'app/(Dashboard)/admin/mess/page.jsx',
    replacements: [
      [
        `© Mubarak Group of Hostels Management System - Page \${i} of \${totalPages}`,
        `© \${companyName} Management System - Page \${i} of \${totalPages}`
      ],
    ]
  },
];

let totalFixed = 0;
for (const op of ops) {
  const path = `${ROOT}/${op.file}`;
  let content;
  try {
    content = readFileSync(path, 'utf-8');
  } catch (e) {
    console.log(`⚠️  Could not read: ${op.file}`);
    continue;
  }

  let changed = false;
  for (const [from, to] of op.replacements) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      changed = true;
      totalFixed++;
    } else {
      console.log(`  ⚠️  Pattern not found in ${op.file}:\n     "${from.substring(0, 80)}..."`);
    }
  }

  if (changed) {
    writeFileSync(path, content, 'utf-8');
    console.log(`✅ Updated: ${op.file}`);
  }
}

console.log(`\n🎉 Done! Fixed ${totalFixed} branding instances.`);
