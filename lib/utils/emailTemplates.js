/**
 * GreenView Hostels — Email Templates
 * Centralized HTML email templates for all transactional emails.
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

const baseWrapper = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GreenView Hostels</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:32px 40px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:12px;padding:10px 18px;margin-bottom:12px;">
                <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">🏢 GreenView</span>
              </div>
              <p style="color:rgba(255,255,255,0.7);font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin:0;">Hostel Management System</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8faff;border-top:1px solid #e8ecf4;padding:24px 40px;text-align:center;">
              <p style="color:#9ca3af;font-size:11px;margin:0 0 4px;">© 2024 GreenView Hostels · All rights reserved</p>
              <p style="color:#c4c9d4;font-size:10px;margin:0;">This is an automated message. Please do not reply to this email.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const badge = (text, color = "#4f46e5", bg = "#eef2ff") =>
    `<span style="display:inline-block;background:${bg};color:${color};font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:4px 12px;border-radius:20px;">${text}</span>`;

const infoRow = (label, value) => `
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid #f0f2f8;">
      <span style="color:#9ca3af;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${label}</span>
    </td>
    <td style="padding:10px 0;border-bottom:1px solid #f0f2f8;text-align:right;">
      <span style="color:#111827;font-size:13px;font-weight:700;">${value}</span>
    </td>
  </tr>
`;

const ctaButton = (text, url, color = "#4f46e5") => `
  <div style="text-align:center;margin:28px 0 8px;">
    <a href="${url}" style="display:inline-block;background:${color};color:#ffffff;font-size:13px;font-weight:700;letter-spacing:0.5px;padding:14px 32px;border-radius:12px;text-decoration:none;">${text}</a>
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
    <h2 style="color:#111827;font-size:22px;font-weight:800;margin:0 0 6px;">Welcome to GreenView! 👋</h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 28px;">Your account has been created by the administration. Here are your login credentials:</p>

    <div style="background:#f8faff;border:1px solid #e8ecf4;border-radius:12px;padding:24px;margin-bottom:24px;">
      <div style="margin-bottom:16px;">${badge(role, rc.color, rc.bg)}</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${infoRow("Full Name", name)}
        ${infoRow("Email", email)}
        ${infoRow("Password", `<code style="background:#f0f2f8;padding:2px 8px;border-radius:6px;font-family:monospace;">${password}</code>`)}
        ${hostelName ? infoRow("Hostel", hostelName) : ""}
      </table>
    </div>

    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;margin-bottom:24px;">
      <p style="color:#92400e;font-size:12px;font-weight:600;margin:0;">⚠️ Please change your password after your first login for security purposes.</p>
    </div>

    ${ctaButton("Sign In to Your Account", `${BASE_URL}/auth/login`)}
  `);
}

// ─────────────────────────────────────────────
// 2. BOOKING CREATED
// ─────────────────────────────────────────────
export function bookingCreatedEmail({ name, bookingId, roomNumber, hostelName, checkIn, checkOut, amount }) {
    return baseWrapper(`
    <h2 style="color:#111827;font-size:22px;font-weight:800;margin:0 0 6px;">Booking Confirmed ✅</h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 28px;">Hello <strong>${name}</strong>, your room booking has been successfully created.</p>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:24px;margin-bottom:24px;">
      <div style="margin-bottom:16px;">${badge("Booking Created", "#059669", "#f0fdf4")}</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${infoRow("Booking ID", bookingId || "—")}
        ${infoRow("Hostel", hostelName || "—")}
        ${infoRow("Room", roomNumber || "—")}
        ${checkIn ? infoRow("Check-In", new Date(checkIn).toLocaleDateString("en-PK", { dateStyle: "long" })) : ""}
        ${checkOut ? infoRow("Check-Out", new Date(checkOut).toLocaleDateString("en-PK", { dateStyle: "long" })) : ""}
        ${amount ? infoRow("Amount", `PKR ${Number(amount).toLocaleString()}`) : ""}
      </table>
    </div>

    <p style="color:#6b7280;font-size:13px;">Please contact the hostel administration if you have any questions about your booking.</p>
    ${ctaButton("View Booking Details", `${BASE_URL}/auth/login`, "#059669")}
  `);
}

// ─────────────────────────────────────────────
// 3. BOOKING STATUS CHANGED (APPROVED / REJECTED / CANCELLED)
// ─────────────────────────────────────────────
export function bookingStatusEmail({ name, bookingId, status, roomNumber, hostelName, notes }) {
    const statusMap = {
        APPROVED: { label: "Approved", color: "#059669", bg: "#f0fdf4", border: "#bbf7d0", emoji: "✅" },
        CONFIRMED: { label: "Confirmed", color: "#059669", bg: "#f0fdf4", border: "#bbf7d0", emoji: "✅" },
        REJECTED: { label: "Rejected", color: "#dc2626", bg: "#fef2f2", border: "#fecaca", emoji: "❌" },
        CANCELLED: { label: "Cancelled", color: "#d97706", bg: "#fffbeb", border: "#fde68a", emoji: "⚠️" },
        PENDING: { label: "Pending Review", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", emoji: "⏳" },
    };
    const s = statusMap[status] || statusMap.PENDING;

    return baseWrapper(`
    <h2 style="color:#111827;font-size:22px;font-weight:800;margin:0 0 6px;">Booking ${s.label} ${s.emoji}</h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 28px;">Hello <strong>${name}</strong>, your booking status has been updated.</p>

    <div style="background:${s.bg};border:1px solid ${s.border};border-radius:12px;padding:24px;margin-bottom:24px;">
      <div style="margin-bottom:16px;">${badge(s.label, s.color, s.bg)}</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${infoRow("Booking ID", bookingId || "—")}
        ${infoRow("Hostel", hostelName || "—")}
        ${infoRow("Room", roomNumber || "—")}
        ${infoRow("Status", s.label)}
        ${notes ? infoRow("Notes", notes) : ""}
      </table>
    </div>

    ${ctaButton("View Your Booking", `${BASE_URL}/auth/login`, s.color)}
  `);
}

// ─────────────────────────────────────────────
// 4. PAYMENT APPROVED / RECEIVED
// ─────────────────────────────────────────────
export function paymentApprovedEmail({ name, paymentId, amount, type, method, hostelName, date }) {
    return baseWrapper(`
    <h2 style="color:#111827;font-size:22px;font-weight:800;margin:0 0 6px;">Payment Received ✅</h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 28px;">Hello <strong>${name}</strong>, your payment has been approved and recorded successfully.</p>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:24px;margin-bottom:24px;">
      <div style="margin-bottom:16px;">${badge("Payment Approved", "#059669", "#f0fdf4")}</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${infoRow("Payment ID", paymentId || "—")}
        ${infoRow("Amount", `<strong style="color:#059669;font-size:16px;">PKR ${Number(amount).toLocaleString()}</strong>`)}
        ${infoRow("Type", type || "—")}
        ${infoRow("Method", method || "—")}
        ${infoRow("Hostel", hostelName || "—")}
        ${infoRow("Date", date ? new Date(date).toLocaleDateString("en-PK", { dateStyle: "long" }) : new Date().toLocaleDateString("en-PK", { dateStyle: "long" }))}
      </table>
    </div>

    <div style="background:#f8faff;border:1px solid #e8ecf4;border-radius:10px;padding:14px 18px;margin-bottom:24px;">
      <p style="color:#6b7280;font-size:12px;font-weight:600;margin:0;">💡 Please keep this email as your payment receipt. Contact administration for any discrepancies.</p>
    </div>

    ${ctaButton("View Payment History", `${BASE_URL}/auth/login`, "#059669")}
  `);
}

// ─────────────────────────────────────────────
// 5. MONTHLY RENT / SALARY GENERATED
// ─────────────────────────────────────────────
export function monthlyRentEmail({ name, amount, month, year, dueDate, hostelName, type = "RENT" }) {
    const isRent = type === "RENT";
    return baseWrapper(`
    <h2 style="color:#111827;font-size:22px;font-weight:800;margin:0 0 6px;">${isRent ? "Monthly Rent Due 🏠" : "Salary Generated 💰"}</h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 28px;">Hello <strong>${name}</strong>, your ${isRent ? "monthly rent" : "salary"} for <strong>${month} ${year}</strong> has been generated.</p>

    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:24px;margin-bottom:24px;">
      <div style="margin-bottom:16px;">${badge(isRent ? "Rent Due" : "Salary Ready", "#2563eb", "#eff6ff")}</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${infoRow("Period", `${month} ${year}`)}
        ${infoRow("Amount", `<strong style="color:#2563eb;font-size:16px;">PKR ${Number(amount).toLocaleString()}</strong>`)}
        ${hostelName ? infoRow("Hostel", hostelName) : ""}
        ${dueDate ? infoRow("Due Date", new Date(dueDate).toLocaleDateString("en-PK", { dateStyle: "long" })) : ""}
      </table>
    </div>

    ${isRent ? `
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;margin-bottom:24px;">
      <p style="color:#92400e;font-size:12px;font-weight:600;margin:0;">⚠️ Please ensure payment is made before the due date to avoid any late fees.</p>
    </div>` : ""}

    ${ctaButton(isRent ? "Pay Now" : "View Salary Details", `${BASE_URL}/auth/login`, "#2563eb")}
  `);
}

// ─────────────────────────────────────────────
// 6. COMPLAINT STATUS UPDATE
// ─────────────────────────────────────────────
export function complaintStatusEmail({ name, complaintId, title, status, assignedTo, notes }) {
    const statusMap = {
        OPEN: { label: "Opened", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", emoji: "📋" },
        IN_PROGRESS: { label: "In Progress", color: "#d97706", bg: "#fffbeb", border: "#fde68a", emoji: "🔧" },
        RESOLVED: { label: "Resolved", color: "#059669", bg: "#f0fdf4", border: "#bbf7d0", emoji: "✅" },
        CLOSED: { label: "Closed", color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb", emoji: "🔒" },
    };
    const s = statusMap[status] || statusMap.OPEN;

    return baseWrapper(`
    <h2 style="color:#111827;font-size:22px;font-weight:800;margin:0 0 6px;">Complaint Update ${s.emoji}</h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 28px;">Hello <strong>${name}</strong>, there's an update on your complaint.</p>

    <div style="background:${s.bg};border:1px solid ${s.border};border-radius:12px;padding:24px;margin-bottom:24px;">
      <div style="margin-bottom:16px;">${badge(s.label, s.color, s.bg)}</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${infoRow("Complaint ID", complaintId || "—")}
        ${infoRow("Subject", title || "—")}
        ${infoRow("Status", s.label)}
        ${assignedTo ? infoRow("Assigned To", assignedTo) : ""}
        ${notes ? infoRow("Notes", notes) : ""}
      </table>
    </div>

    ${ctaButton("View Complaint", `${BASE_URL}/auth/login`, s.color)}
  `);
}
