/**
 * MGH — Email Templates
 * Slim, professional HTML templates for all transactional emails.
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

// Low‑level wrapper: single white card, subtle header, neutral colors
const baseWrapper = (content, branding = {}) => {
  const companyName = branding.companyName || "Hostel Managment System";
  const companyShortName = branding.companyShortName || "HMS";
  const currentYear = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${companyShortName} - ${companyName}</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
      <tr>
        <td align="center" style="padding:0 12px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
            <tr>
              <td style="padding:18px 24px;border-bottom:1px solid #e5e7eb;background:#f9fafb;">
                <div style="font-size:13px;font-weight:600;color:#111827;">${companyName} (${companyShortName})</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 24px 20px;">
                ${content}
              </td>
            </tr>
            <tr>
              <td style="padding:14px 24px 18px;border-top:1px solid #e5e7eb;background:#f9fafb;text-align:center;">
                <div style="font-size:11px;color:#9ca3af;margin-bottom:2px;">
                  © ${currentYear} ${companyName}. All rights reserved.
                </div>
                <div style="font-size:10px;color:#9ca3af;">
                  This is an automated message; replies to this address are not monitored.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
};

// Generic section‑style wrapper when you just have bodyHtml
export function buildEmailTemplate({
  title,
  subtitle,
  bodyHtml,
  branding = {},
}) {
  const header = `
    <h2 style="margin:0 0 6px;font-size:18px;font-weight:600;color:#111827;">${title}</h2>
    ${
      subtitle
        ? `<p style="margin:0 0 16px;font-size:13px;color:#4b5563;">${subtitle}</p>`
        : ""
    }
  `;

  const inner = `
    ${header}
    <div style="font-size:14px;line-height:1.6;color:#374151;">
      ${bodyHtml}
    </div>
  `;

  return baseWrapper(inner, branding);
}

const badge = (text, color = "#2563eb", bg = "#eff6ff") =>
  `<span style="display:inline-block;background:${bg};color:${color};font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;padding:3px 10px;border-radius:999px;">${text}</span>`;

const infoRow = (label, value) => `
  <tr>
    <td style="padding:6px 0;color:#6b7280;font-size:12px;">${label}</td>
    <td style="padding:6px 0;color:#111827;font-size:13px;font-weight:600;text-align:right;">${value}</td>
  </tr>
`;

const ctaButton = (text, url, color = "#111827") => `
  <div style="text-align:center;margin:20px 0 4px;">
    <a href="${url}" style="display:inline-block;padding:10px 20px;border-radius:999px;background:${color};color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;">
      ${text}
    </a>
  </div>
`;

// ─────────────────────────────────────────────
// 1. WELCOME / ACCOUNT CREATED
// ─────────────────────────────────────────────
export function welcomeEmail({ name, email, password, role, hostelName }) {
  const roleColors = {
    ADMIN: { color: "#dc2626", bg: "#fef2f2" },
    WARDEN: { color: "#d97706", bg: "#fffbeb" },
    STAFF: { color: "#2563eb", bg: "#eff6ff" },
    RESIDENT: { color: "#059669", bg: "#f0fdf4" },
    GUEST: { color: "#7c3aed", bg: "#f5f3ff" },
  };
  const rc = roleColors[role] || roleColors.RESIDENT;

  return baseWrapper(`
    <h2 style="margin:0 0 6px;font-size:18px;font-weight:600;color:#111827;">Welcome to MGH </h2>
    <p style="margin:0 0 18px;font-size:13px;color:#4b5563;">
      Your account has been created. Here are your sign‑in details:
    </p>

    <div style="border:1px solid #e5e7eb;border-radius:10px;padding:16px 16px 12px;margin-bottom:16px;background:#f9fafb;">
      <div style="margin-bottom:10px;">${badge(role, rc.color, rc.bg)}</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${infoRow("Name", name)}
        ${infoRow("Email", email)}
        ${infoRow("Temporary password", `<span style="font-family:monospace;">${password}</span>`)}
        ${hostelName ? infoRow("Hostel", hostelName) : ""}
      </table>
    </div>

    <p style="margin:0 0 8px;font-size:12px;color:#6b7280;">
      For security, please change your password after your first login.
    </p>

    ${ctaButton("Sign in to your account", `${BASE_URL}/auth/login`)}
  `);
}

// ─────────────────────────────────────────────
// 2. BOOKING CREATED
// ─────────────────────────────────────────────
export function bookingCreatedEmail({
  name,
  bookingId,
  roomNumber,
  hostelName,
  checkIn,
  checkOut,
  amount,
}) {
  return baseWrapper(`
    <h2 style="margin:0 0 6px;font-size:18px;font-weight:600;color:#111827;">Booking confirmed</h2>
    <p style="margin:0 0 16px;font-size:13px;color:#4b5563;">
      Hello <strong>${name}</strong>, your room booking has been created.
    </p>

    <div style="border:1px solid #e5e7eb;border-radius:10px;padding:16px 16px 12px;margin-bottom:14px;background:#f9fafb;">
      <div style="margin-bottom:10px;">${badge("Booking", "#059669", "#ecfdf3")}</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${infoRow("Booking ID", bookingId.split("-")[0] || "—")}
        ${infoRow("Hostel", hostelName || "—")}
        ${infoRow("Room", roomNumber || "—")}
        ${checkIn ? infoRow("Check‑in", new Date(checkIn).toLocaleDateString("en-PK", { dateStyle: "medium" })) : ""}
        ${checkOut ? infoRow("Check‑out", new Date(checkOut).toLocaleDateString("en-PK", { dateStyle: "medium" })) : ""}
        ${amount ? infoRow("Amount", `PKR ${Number(amount).toLocaleString()}`) : ""}
      </table>
    </div>

    <p style="margin:0 0 8px;font-size:12px;color:#6b7280;">
      For any questions about your stay, please contact the hostel management.
    </p>
    ${ctaButton("View booking", `${BASE_URL}/auth/login`, "#059669")}
  `);
}

// ─────────────────────────────────────────────
// 3. BOOKING STATUS CHANGED (APPROVED / REJECTED / CANCELLED)
// ─────────────────────────────────────────────
export function bookingStatusEmail({
  name,
  bookingId,
  status,
  roomNumber,
  hostelName,
  notes,
}) {
  const statusMap = {
    APPROVED: {
      label: "Approved",
      color: "#059669",
      bg: "#f0fdf4",
      border: "#bbf7d0",
      emoji: "✅",
    },
    CONFIRMED: {
      label: "Confirmed",
      color: "#059669",
      bg: "#f0fdf4",
      border: "#bbf7d0",
      emoji: "✅",
    },
    REJECTED: {
      label: "Rejected",
      color: "#dc2626",
      bg: "#fef2f2",
      border: "#fecaca",
      emoji: "❌",
    },
    CANCELLED: {
      label: "Cancelled",
      color: "#d97706",
      bg: "#fffbeb",
      border: "#fde68a",
      emoji: "⚠️",
    },
    PENDING: {
      label: "Pending Review",
      color: "#7c3aed",
      bg: "#f5f3ff",
      border: "#ddd6fe",
      emoji: "⏳",
    },
  };
  const s = statusMap[status] || statusMap.PENDING;

  return baseWrapper(`
    <h2 style="margin:0 0 6px;font-size:18px;font-weight:600;color:#111827;">Booking ${s.label.toLowerCase()}</h2>
    <p style="margin:0 0 16px;font-size:13px;color:#4b5563;">
      Hello <strong>${name}</strong>, your booking status has been updated.
    </p>

    <div style="border:1px solid ${s.border};border-radius:10px;padding:16px 16px 12px;margin-bottom:14px;background:${s.bg};">
      <div style="margin-bottom:10px;">${badge(s.label, s.color, s.bg)}</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${infoRow("Booking ID", bookingId.split("-")[0] || "—")}
        ${infoRow("Hostel", hostelName || "—")}
        ${infoRow("Room", roomNumber || "—")}
        ${infoRow("Status", s.label)}
        ${notes ? infoRow("Notes", notes) : ""}
      </table>
    </div>

    ${ctaButton("View booking", `${BASE_URL}/auth/login`, s.color)}
  `);
}

// ─────────────────────────────────────────────
// 4. PAYMENT APPROVED / RECEIVED
// ─────────────────────────────────────────────
export function paymentApprovedEmail({
  name,
  paymentId,
  amount,
  type,
  method,
  hostelName,
  date,
}) {
  return baseWrapper(`
    <h2 style="margin:0 0 6px;font-size:18px;font-weight:600;color:#111827;">Payment received</h2>
    <p style="margin:0 0 16px;font-size:13px;color:#4b5563;">
      Hello <strong>${name}</strong>, your payment has been recorded successfully.
    </p>

    <div style="border:1px solid #e5e7eb;border-radius:10px;padding:16px 16px 12px;margin-bottom:14px;background:#f9fafb;">
      <div style="margin-bottom:10px;">${badge("Payment approved", "#059669", "#ecfdf3")}</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${infoRow("Payment ID", paymentId.split("-")[0] || "—")}
        ${infoRow("Amount", `<span style="color:#059669;font-weight:700;">PKR ${Number(amount).toLocaleString()}</span>`)}
        ${infoRow("Type", type || "—")}
        ${infoRow("Method", method || "—")}
        ${infoRow("Hostel", hostelName || "—")}
        ${infoRow("Date", date ? new Date(date).toLocaleDateString("en-PK", { dateStyle: "medium" }) : new Date().toLocaleDateString("en-PK", { dateStyle: "medium" }))}
      </table>
    </div>

    <p style="margin:0 0 8px;font-size:12px;color:#6b7280;">
      Please keep this email as your receipt. Contact the accounts office if anything looks incorrect.
    </p>

    ${ctaButton("View payments", `${BASE_URL}/auth/login`, "#059669")}
  `);
}

// ─────────────────────────────────────────────
// 5. MONTHLY RENT / SALARY GENERATED
// ─────────────────────────────────────────────
export function monthlyRentEmail({
  name,
  amount,
  month,
  year,
  dueDate,
  hostelName,
  type = "RENT",
}) {
  const isRent = type === "RENT";
  return baseWrapper(`
    <h2 style="margin:0 0 6px;font-size:18px;font-weight:600;color:#111827;">
      ${isRent ? "Monthly rent invoice" : "Salary generated"}
    </h2>
    <p style="margin:0 0 16px;font-size:13px;color:#4b5563;">
      Hello <strong>${name}</strong>, your ${isRent ? "rent" : "salary"} for <strong>${month} ${year}</strong> has been created.
    </p>

    <div style="border:1px solid #e5e7eb;border-radius:10px;padding:16px 16px 12px;margin-bottom:14px;background:#f9fafb;">
      <div style="margin-bottom:10px;">${badge(isRent ? "Rent" : "Salary", "#2563eb", "#eff6ff")}</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${infoRow("Period", `${month} ${year}`)}
        ${infoRow("Amount", `<span style="color:#2563eb;font-weight:700;">PKR ${Number(amount).toLocaleString()}</span>`)}
        ${hostelName ? infoRow("Hostel", hostelName) : ""}
        ${dueDate ? infoRow("Due date", new Date(dueDate).toLocaleDateString("en-PK", { dateStyle: "medium" })) : ""}
      </table>
    </div>

    ${
      isRent
        ? `<p style="margin:0 0 8px;font-size:12px;color:#6b7280;">
             Please arrange payment before the due date to avoid any late charges.
           </p>`
        : ""
    }

    ${ctaButton(isRent ? "View invoice" : "View salary", `${BASE_URL}/auth/login`, "#2563eb")}
  `);
}

// ─────────────────────────────────────────────
// 6. COMPLAINT STATUS UPDATE
// ─────────────────────────────────────────────
export function complaintStatusEmail({
  name,
  complaintId,
  title,
  status,
  assignedTo,
  notes,
}) {
  const statusMap = {
    OPEN: {
      label: "Opened",
      color: "#7c3aed",
      bg: "#f5f3ff",
      border: "#ddd6fe",
      emoji: "📋",
    },
    IN_PROGRESS: {
      label: "In Progress",
      color: "#d97706",
      bg: "#fffbeb",
      border: "#fde68a",
      emoji: "🔧",
    },
    RESOLVED: {
      label: "Resolved",
      color: "#059669",
      bg: "#f0fdf4",
      border: "#bbf7d0",
      emoji: "✅",
    },
    CLOSED: {
      label: "Closed",
      color: "#6b7280",
      bg: "#f9fafb",
      border: "#e5e7eb",
      emoji: "🔒",
    },
  };
  const s = statusMap[status] || statusMap.OPEN;

  return baseWrapper(`
    <h2 style="margin:0 0 6px;font-size:18px;font-weight:600;color:#111827;">Complaint update</h2>
    <p style="margin:0 0 16px;font-size:13px;color:#4b5563;">
      Hello <strong>${name}</strong>, there is an update on your complaint.
    </p>

    <div style="border:1px solid ${s.border};border-radius:10px;padding:16px 16px 12px;margin-bottom:14px;background:${s.bg};">
      <div style="margin-bottom:10px;">${badge(s.label, s.color, s.bg)}</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${infoRow("Complaint ID", complaintId || "—")}
        ${infoRow("Title", title || "—")}
        ${infoRow("Status", s.label)}
        ${assignedTo ? infoRow("Assigned to", assignedTo) : ""}
        ${notes ? infoRow("Notes", notes) : ""}
      </table>
    </div>

    ${ctaButton("View complaint", `${BASE_URL}/auth/login`, s.color)}
  `);
}
