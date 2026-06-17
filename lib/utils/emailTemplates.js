/**
 * MGH — Email Templates
 * Slim, professional HTML templates for all transactional emails.
 */

export function getBaseUrl() {
  let url = process.env.NEXT_PUBLIC_BASE_URL;
  if (!url) {
    return "http://localhost:3000";
  }
  url = url.replace(/['"]/g, "").trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    if (url.includes("localhost") || url.includes("127.0.0.1")) {
      url = `http://${url}`;
    } else {
      url = `https://${url}`;
    }
  }
  return url;
}

const BASE_URL = getBaseUrl(); // Keep a fallback at load time, but we will call getBaseUrl() dynamically where possible to avoid load-time undefined issues


// Low‑level wrapper: single white card, subtle header, neutral colors
const baseWrapper = (content, branding = {}) => {
  const companyName = branding.companyName || "Hostel Management System";
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
  <body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 0;background-color:#f5f5f7;">
      <tr>
        <td align="center" style="padding:0 16px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.04);border:1px solid #e8e8ed;">
            <tr>
              <td style="padding:32px 32px 0;">
                <div style="font-size:11px;font-weight:600;color:#86868b;letter-spacing:0.04em;text-transform:uppercase;">${companyName}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px;">
                ${content}
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;border-top:1px solid #f5f5f7;background:#fafafa;text-align:center;">
                <div style="font-size:11px;color:#86868b;line-height:1.5;margin-bottom:4px;">
                  © ${currentYear} ${companyName}. All rights reserved.
                </div>
                <div style="font-size:10px;color:#b5b5b9;line-height:1.5;">
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
    <h2 style="margin:0 0 6px;font-size:20px;font-weight:600;letter-spacing:-0.02em;color:#1d1d1f;">${title}</h2>
    ${
      subtitle
        ? `<p style="margin:0 0 20px;font-size:14px;color:#86868b;line-height:1.4;">${subtitle}</p>`
        : ""
    }
  `;

  const inner = `
    ${header}
    <div style="font-size:14px;line-height:1.6;color:#1d1d1f;">
      ${bodyHtml}
    </div>
  `;

  return baseWrapper(inner, branding);
}

const badge = (text, color = "#0071e3", bg = "#e8f2fc") =>
  `<span style="display:inline-block;background:${bg};color:${color};font-size:10px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;padding:2px 8px;border-radius:4px;">${text}</span>`;

const infoRow = (label, value) => `
  <tr>
    <td style="padding:8px 0;color:#86868b;font-size:13px;line-height:1.4;text-align:left;">${label}</td>
    <td style="padding:8px 0;color:#1d1d1f;font-size:13px;font-weight:500;text-align:right;line-height:1.4;">${value}</td>
  </tr>
`;

const ctaButton = (text, url, color = "#0071e3") => `
  <div style="text-align:center;margin:24px 0 8px;">
    <a href="${url}" style="display:inline-block;padding:10px 22px;border-radius:8px;background:${color};color:#ffffff;font-size:13px;font-weight:500;text-decoration:none;letter-spacing:-0.01em;">
      ${text}
    </a>
  </div>
`;

// ─────────────────────────────────────────────
// 1. WELCOME / ACCOUNT CREATED
// ─────────────────────────────────────────────
export function welcomeEmail({ name, email, password, role, hostelName, loginUrl, branding = {} }) {
  const roleColors = {
    ADMIN: { color: "#d21e1e", bg: "#faebeb" },
    WARDEN: { color: "#b25e00", bg: "#fdf3e7" },
    STAFF: { color: "#0066cc", bg: "#eef5fc" },
    RESIDENT: { color: "#1d8a42", bg: "#ebf7ee" },
    GUEST: { color: "#693ccb", bg: "#f3effa" },
  };
  const rc = roleColors[role] || roleColors.RESIDENT;
  const companyName = branding.companyName || "Hostel Management System";

  const targetLoginUrl = loginUrl || `${getBaseUrl()}/auth/login`;

  return baseWrapper(`
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:600;letter-spacing:-0.02em;color:#1d1d1f;">Welcome to ${companyName}</h2>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.5;color:#4b4b4f;">
      Your account has been created. Here are your sign‑in details:
    </p>

    <div style="border:1px solid #e8e8ed;border-radius:12px;padding:16px 20px 12px;margin-bottom:20px;background:#f5f5f7;">
      <div style="margin-bottom:12px;">${badge(role, rc.color, rc.bg)}</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${infoRow("Name", name)}
        ${infoRow("Email", email)}
        ${password ? infoRow("Temporary password", `<span style="font-family:monospace;font-size:12px;background:#e8e8ed;padding:2px 6px;border-radius:4px;color:#1d1d1f;">${password}</span>`) : ""}
        ${hostelName ? infoRow("Hostel", hostelName) : ""}
      </table>
    </div>

    <p style="margin:0 0 16px;font-size:12px;color:#86868b;line-height:1.5;">
      ${password ? "For security, please change your password after your first login." : "Please use the 'Forgot Password' option on the login page to set your password for the first time."}
    </p>

    ${ctaButton("Sign in to your account", targetLoginUrl)}
  `, branding);
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
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:600;letter-spacing:-0.02em;color:#1d1d1f;">Booking confirmed</h2>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.5;color:#4b4b4f;">
      Hello <strong>${name}</strong>, your room booking has been created successfully.
    </p>

    <div style="border:1px solid #e8e8ed;border-radius:12px;padding:16px 20px 12px;margin-bottom:20px;background:#f5f5f7;">
      <div style="margin-bottom:12px;">${badge("Booking", "#1d8a42", "#ebf7ee")}</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${infoRow("Booking ID", bookingId.split("-")[0] || "—")}
        ${infoRow("Hostel", hostelName || "—")}
        ${infoRow("Room", roomNumber || "—")}
        ${checkIn ? infoRow("Check‑in", new Date(checkIn).toLocaleDateString("en-PK", { dateStyle: "medium" })) : ""}
        ${checkOut ? infoRow("Check‑out", new Date(checkOut).toLocaleDateString("en-PK", { dateStyle: "medium" })) : ""}
        ${amount ? infoRow("Amount", `PKR ${Number(amount).toLocaleString()}`) : ""}
      </table>
    </div>

    <p style="margin:0 0 16px;font-size:12px;color:#86868b;line-height:1.5;">
      For any questions about your stay, please contact the hostel management.
    </p>
    ${ctaButton("View booking", `${getBaseUrl()}/auth/login`, "#1d8a42")}
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
      color: "#1d8a42",
      bg: "#ebf7ee",
      border: "#d2ecd9",
      emoji: "✅",
    },
    CONFIRMED: {
      label: "Confirmed",
      color: "#1d8a42",
      bg: "#ebf7ee",
      border: "#d2ecd9",
      emoji: "✅",
    },
    REJECTED: {
      label: "Rejected",
      color: "#d21e1e",
      bg: "#faebeb",
      border: "#f5d2d2",
      emoji: "❌",
    },
    CANCELLED: {
      label: "Cancelled",
      color: "#b25e00",
      bg: "#fdf3e7",
      border: "#f9e2c7",
      emoji: "⚠️",
    },
    PENDING: {
      label: "Pending Review",
      color: "#0071e3",
      bg: "#e8f2fc",
      border: "#d0e3f8",
      emoji: "⏳",
    },
  };
  const s = statusMap[status] || statusMap.PENDING;

  return baseWrapper(`
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:600;letter-spacing:-0.02em;color:#1d1d1f;">Booking ${s.label.toLowerCase()}</h2>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.5;color:#4b4b4f;">
      Hello <strong>${name}</strong>, your booking status has been updated.
    </p>

    <div style="border:1px solid ${s.border};border-radius:12px;padding:16px 20px 12px;margin-bottom:20px;background:${s.bg};">
      <div style="margin-bottom:12px;">${badge(s.label, s.color, s.bg)}</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${infoRow("Booking ID", bookingId.split("-")[0] || "—")}
        ${infoRow("Hostel", hostelName || "—")}
        ${infoRow("Room", roomNumber || "—")}
        ${infoRow("Status", s.label)}
        ${notes ? infoRow("Notes", notes) : ""}
      </table>
    </div>

    ${ctaButton("View booking", `${getBaseUrl()}/auth/login`, s.color)}
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
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:600;letter-spacing:-0.02em;color:#1d1d1f;">Payment received</h2>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.5;color:#4b4b4f;">
      Hello <strong>${name}</strong>, your payment has been recorded successfully.
    </p>

    <div style="border:1px solid #e8e8ed;border-radius:12px;padding:16px 20px 12px;margin-bottom:20px;background:#f5f5f7;">
      <div style="margin-bottom:12px;">${badge("Payment approved", "#1d8a42", "#ebf7ee")}</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${infoRow("Payment ID", paymentId.split("-")[0] || "—")}
        ${infoRow("Amount", `<span style="color:#1d8a42;font-weight:600;">PKR ${Number(amount).toLocaleString()}</span>`)}
        ${infoRow("Type", type || "—")}
        ${infoRow("Method", method || "—")}
        ${infoRow("Hostel", hostelName || "—")}
        ${infoRow("Date", date ? new Date(date).toLocaleDateString("en-PK", { dateStyle: "medium" }) : new Date().toLocaleDateString("en-PK", { dateStyle: "medium" }))}
      </table>
    </div>

    <p style="margin:0 0 16px;font-size:12px;color:#86868b;line-height:1.5;">
      Please keep this email as your receipt. Contact the accounts office if anything looks incorrect.
    </p>

    ${ctaButton("View payments", `${getBaseUrl()}/auth/login`, "#1d8a42")}
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
  const accentColor = "#0071e3";
  const badgeBg = "#e8f2fc";

  return baseWrapper(`
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:600;letter-spacing:-0.02em;color:#1d1d1f;">
      ${isRent ? "Monthly rent invoice" : "Salary generated"}
    </h2>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.5;color:#4b4b4f;">
      Hello <strong>${name}</strong>, your ${isRent ? "rent" : "salary"} for <strong>${month} ${year}</strong> has been created.
    </p>

    <div style="border:1px solid #e8e8ed;border-radius:12px;padding:16px 20px 12px;margin-bottom:20px;background:#f5f5f7;">
      <div style="margin-bottom:12px;">${badge(isRent ? "Rent" : "Salary", accentColor, badgeBg)}</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${infoRow("Period", `${month} ${year}`)}
        ${infoRow("Amount", `<span style="color:${accentColor};font-weight:600;">PKR ${Number(amount).toLocaleString()}</span>`)}
        ${hostelName ? infoRow("Hostel", hostelName) : ""}
        ${dueDate ? infoRow("Due date", new Date(dueDate).toLocaleDateString("en-PK", { dateStyle: "medium" })) : ""}
      </table>
    </div>

    ${
      isRent
        ? `<p style="margin:0 0 16px;font-size:12px;color:#86868b;line-height:1.5;">
             Please arrange payment before the due date to avoid any late charges.
           </p>`
        : ""
    }

    ${ctaButton(isRent ? "View invoice" : "View salary", `${getBaseUrl()}/auth/login`, accentColor)}
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
      color: "#0071e3",
      bg: "#e8f2fc",
      border: "#d0e3f8",
      emoji: "📋",
    },
    IN_PROGRESS: {
      label: "In Progress",
      color: "#b25e00",
      bg: "#fdf3e7",
      border: "#f9e2c7",
      emoji: "🔧",
    },
    RESOLVED: {
      label: "Resolved",
      color: "#1d8a42",
      bg: "#ebf7ee",
      border: "#d2ecd9",
      emoji: "✅",
    },
    CLOSED: {
      label: "Closed",
      color: "#86868b",
      bg: "#f5f5f7",
      border: "#e8e8ed",
      emoji: "🔒",
    },
  };
  const s = statusMap[status] || statusMap.OPEN;

  return baseWrapper(`
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:600;letter-spacing:-0.02em;color:#1d1d1f;">Complaint update</h2>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.5;color:#4b4b4f;">
      Hello <strong>${name}</strong>, there is an update on your complaint.
    </p>

    <div style="border:1px solid ${s.border};border-radius:12px;padding:16px 20px 12px;margin-bottom:20px;background:${s.bg};">
      <div style="margin-bottom:12px;">${badge(s.label, s.color, s.bg)}</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${infoRow("Complaint ID", complaintId || "—")}
        ${infoRow("Title", title || "—")}
        ${infoRow("Status", s.label)}
        ${assignedTo ? infoRow("Assigned to", assignedTo) : ""}
        ${notes ? infoRow("Notes", notes) : ""}
      </table>
    </div>

    ${ctaButton("View complaint", `${getBaseUrl()}/auth/login`, s.color)}
  `);
}
