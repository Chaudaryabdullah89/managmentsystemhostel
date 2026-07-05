// app/api/(Backend)/payments/onebill-webhook/route.js
// 1Link 1Bill Payment Notification Endpoint (IPN/Webhook)
// 1Link POSTs here when a payment is confirmed on their network.
// This endpoint verifies the request and marks the payment as PAID.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/utils/sendmail";
import { paymentApprovedEmail } from "@/lib/utils/emailTemplates";
import { getBranding } from "@/lib/permissions";
import { logNotificationDelivery } from "@/lib/notificationTelemetry";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body =
      (await request.json().catch(() => null)) ||
      Object.fromEntries(new URLSearchParams(await request.text()));

    console.log(`\x1b[32m[1Bill Webhook]\x1b[0m ── Incoming callback ─────────────────────────────`);
    console.log(`\x1b[32m[1Bill Webhook]\x1b[0m Body: ${JSON.stringify(body)}`);

    // ── Verify the request is genuinely from 1Link ─────────────────────────
    // 1Link passes their API key in the Authorization header or as a body field.
    // We check both to be safe.
    const authHeader = request.headers.get("authorization") || "";
    const apiKeyFromHeader = authHeader.replace("Bearer ", "").trim();
    const apiKeyFromBody =
      body?.apiKey || body?.api_key || body?.username || "";

    const expectedKey = process.env.ONEBILL_API_USERNAME;
    const expectedSecret = process.env.ONEBILL_API_PASSWORD;

    const keyMatch =
      apiKeyFromHeader === expectedKey || apiKeyFromBody === expectedKey;
    const secretMatch =
      (body?.secret || body?.password || body?.apiSecret || "") ===
      expectedSecret;

    console.log(`\x1b[32m[1Bill Webhook]\x1b[0m Auth check: keyMatch=${keyMatch} secretMatch=${secretMatch}`);

    // In LIVE mode, reject requests that don't match our credentials
    if (process.env.ONEBILL_LIVE_MODE === "true" && !keyMatch && !secretMatch) {
      console.warn(
        `\x1b[31m[1Bill Webhook] ⛔ Unauthorized request — credential mismatch\x1b[0m`,
      );
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // ── 1Link sends these fields (field names may vary by integration type) ──
    // billerID, consumerNumber, transactionAmount, transactionAuthID,
    // bankMnemonic, reserved, responseCode (00 = success)
    const {
      consumerNumber, // This is our oneBillInvoiceId (18 digits)
      transactionAuthID, // 1Link transaction reference
      transactionAmount, // Amount paid (in PKR)
      responseCode, // "00" = success
      bankMnemonic, // Bank that processed the payment
    } = body;

    console.log(`\x1b[32m[1Bill Webhook]\x1b[0m Payload parameters: consumerNumber="${consumerNumber}" transactionAuthID="${transactionAuthID}" amount=${transactionAmount} code="${responseCode}" bank="${bankMnemonic}"`);

    // Only process successful payments (responseCode "00")
    if (responseCode !== "00") {
      console.log(
        `\x1b[33m[1Bill Webhook] ⚠️ Non-success responseCode: ${responseCode} — ignoring callback.\x1b[0m`,
      );
      return NextResponse.json(
        { success: false, message: "Non-success response code" },
        { status: 200 },
      );
    }

    if (!consumerNumber) {
      console.error("\x1b[31m[1Bill Webhook] ❌ Missing consumerNumber in payload\x1b[0m");
      return NextResponse.json(
        { success: false, message: "Missing consumerNumber" },
        { status: 400 },
      );
    }

    // Find the payment by invoice ID
    console.log(`\x1b[32m[1Bill Webhook]\x1b[0m Fetching payment for invoice ID: "${consumerNumber}"`);
    const payment = await prisma.payment.findUnique({
      where: { oneBillInvoiceId: consumerNumber },
      include: {
        User: { select: { id: true, name: true, email: true } },
        Booking: {
          include: {
            Room: { include: { Hostel: { select: { name: true } } } },
          },
        },
      },
    });

    if (!payment) {
      console.error(
        `\x1b[31m[1Bill Webhook] ❌ No payment record found in database for invoice: "${consumerNumber}"\x1b[0m`,
      );
      // Return 200 to prevent 1Link from retrying — invoice just doesn't exist on our side
      return NextResponse.json(
        { success: false, message: "Invoice not found" },
        { status: 200 },
      );
    }

    if (payment.status === "PAID") {
      console.log(
        `\x1b[33m[1Bill Webhook] ⚠️ Payment is already marked PAID. Skipping duplicate processing for invoice "${consumerNumber}".\x1b[0m`,
      );
      return NextResponse.json(
        { success: true, message: "Already paid" },
        { status: 200 },
      );
    }

    // ── Mark as PAID ───────────────────────────────────────────────────────
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "PAID",
        method: "ONLINE",
        transactionId: transactionAuthID || `1LINK-${consumerNumber}`,
        notes: `Paid via 1Bill. Bank: ${bankMnemonic || "N/A"}. Ref: ${transactionAuthID || "N/A"}`,
        updatedAt: new Date(),
      },
    });

    console.log(
      `[1Bill Webhook] ✅ Payment ${payment.id} marked PAID. TxID: ${transactionAuthID}`,
    );

    // ── Send confirmation email ────────────────────────────────────────────
    if (payment.User?.email) {
      try {
        const branding = await getBranding();
        const hostelName =
          payment.Booking?.Room?.Hostel?.name || "Hostel Branch";
        await sendEmail({
          to: payment.User.email,
          subject: `Payment Confirmed ✅ — ${branding.companyName}`,
          html: paymentApprovedEmail({
            name: payment.User.name,
            paymentId: payment.uid || payment.id,
            amount: payment.amount,
            type: payment.type,
            method: `1Bill Online (${bankMnemonic || "N/A"})`,
            hostelName,
            date: updatedPayment.updatedAt,
            branding,
          }),
        });
        await logNotificationDelivery({
          channel: "EMAIL",
          event: "PAYMENT_APPROVED",
          recipient: payment.User.email,
          status: "DELIVERED",
          actorId: null,
          metadata: {
            paymentId: payment.uid || payment.id,
            source: "1BILL_WEBHOOK",
          },
        });
      } catch (emailErr) {
        console.error("[1Bill Webhook] Email send failed:", emailErr.message);
      }
    }

    // 1Link expects a simple success response
    return NextResponse.json(
      { success: true, message: "Payment recorded" },
      { status: 200 },
    );
  } catch (error) {
    console.error("[1Bill Webhook] Critical error:", error);
    // Always return 200 to 1Link to prevent infinite retries
    return NextResponse.json(
      { success: false, message: "Internal error" },
      { status: 200 },
    );
  }
}

// GET handler for 1Link's initial URL verification ping
export async function GET() {
  return NextResponse.json(
    { success: true, message: "1Bill webhook endpoint active" },
    { status: 200 },
  );
}
