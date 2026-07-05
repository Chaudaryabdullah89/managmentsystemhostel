// app/api/(Backend)/payments/onebill-enquiry/route.js
// 1Link Bill Enquiry Endpoint
// When a customer enters their 18-digit consumer number in EasyPaisa / JazzCash / HBL etc.,
// 1Link calls THIS endpoint to fetch the bill details before showing the customer.
// 1Link expects a specific JSON response format.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request) {
    try {
        const body = await request.json().catch(() => null)
            || Object.fromEntries(new URLSearchParams(await request.text()));

        const isLiveMode = process.env.ONEBILL_LIVE_MODE === "true";
        const expectedKey = process.env.ONEBILL_API_USERNAME;
        const expectedSecret = process.env.ONEBILL_API_PASSWORD;

        console.log(`\x1b[36m[1Bill Enquiry]\x1b[0m ── Incoming request ──────────────────────────────`);
        console.log(`\x1b[36m[1Bill Enquiry]\x1b[0m Body: ${JSON.stringify(body)}`);
        console.log(`\x1b[36m[1Bill Enquiry]\x1b[0m Live mode: ${isLiveMode}`);
        console.log(`\x1b[36m[1Bill Enquiry]\x1b[0m Has API credentials in .env: username=${!!expectedKey} password=${!!expectedSecret}`);

        // ── Verify the API credentials from 1Link ─────────────────────────────
        const authHeader = request.headers.get("authorization") || "";
        const incomingKey = authHeader.replace("Bearer ", "").trim()
            || body?.username || body?.apiKey || body?.api_key || "";

        if (incomingKey) {
            const keyMatches = incomingKey === expectedKey;
            console.log(`\x1b[36m[1Bill Enquiry]\x1b[0m Auth key received: "${incomingKey.substring(0, 8)}..." match=${keyMatches}`);
            if (!keyMatches) {
                console.warn(`\x1b[33m[1Bill Enquiry] ⚠️  API key mismatch! Received: "${incomingKey.substring(0, 8)}..." Expected first 8 chars: "${(expectedKey || "").substring(0, 8)}..."\x1b[0m`);
            }
        } else {
            console.log(`\x1b[36m[1Bill Enquiry]\x1b[0m No auth key in request headers or body.`);
        }

        // Only enforce in live mode (skip check in sandbox/simulation)
        if (isLiveMode && incomingKey !== expectedKey) {
            console.error(`\x1b[31m[1Bill Enquiry] ❌ UNAUTHORIZED — rejecting request (live mode requires valid API key)\x1b[0m`);
            return NextResponse.json(responsePayload("01", "Unauthorized", null), { status: 401 });
        }

        if (!isLiveMode) {
            console.log(`\x1b[33m[1Bill Enquiry] ⚠️  Simulation mode — auth check skipped. Set ONEBILL_LIVE_MODE=true to enforce.\x1b[0m`);
        }

        // ── Extract the consumer number (18-digit invoice ID) ─────────────────
        // 1Link may send it as: ConsumerNumber, consumerNumber, consumer_number
        const consumerNumber =
            body?.ConsumerNumber || body?.consumerNumber || body?.consumer_number || "";

        console.log(`\x1b[36m[1Bill Enquiry]\x1b[0m Consumer number from request: "${consumerNumber || "(empty)"}"`);

        if (!consumerNumber) {
            console.error(`\x1b[31m[1Bill Enquiry] ❌ No consumer number in request body. Keys received: ${Object.keys(body || {}).join(", ")}\x1b[0m`);
            return NextResponse.json(responsePayload("05", "Consumer number is required", null));
        }

        // ── Find the payment in the database ──────────────────────────────────
        const payment = await prisma.payment.findUnique({
            where: { oneBillInvoiceId: consumerNumber },
            include: {
                User: {
                    select: { name: true, email: true, phone: true }
                }
            }
        });

        console.log(`\x1b[36m[1Bill Enquiry]\x1b[0m Querying DB for invoice: "${consumerNumber}"`);

        if (!payment) {
            console.error(`\x1b[31m[1Bill Enquiry] ❌ Invoice NOT FOUND in DB: "${consumerNumber}"\x1b[0m`);
            console.log(`\x1b[36m[1Bill Enquiry]\x1b[0m ℹ️  This means the invoice was either not generated yet, or the prefix registered with 1Link doesn't match "${consumerNumber?.substring(0, 6)}..."`);
            return NextResponse.json(responsePayload("02", "Consumer number not found", null));
        }

        if (payment.status === "PAID") {
            console.log(`\x1b[36m[1Bill Enquiry]\x1b[0m Invoice "${consumerNumber}" is already PAID — telling 1Link.`);
            // Response code "03" = bill already paid
            return NextResponse.json(responsePayload("03", "Bill already paid", null));
        }

        if (payment.status === "REJECTED" || payment.status === "FAILED") {
            console.log(`\x1b[36m[1Bill Enquiry]\x1b[0m Invoice "${consumerNumber}" has status="${payment.status}" — not payable.`);
            return NextResponse.json(responsePayload("04", "Bill is not payable", null));
        }

        // ── Build the bill details response ───────────────────────────────────
        const amount = parseFloat(payment.amount || 0);
        const dueDate = payment.dueDate
            ? new Date(payment.dueDate).toISOString().split("T")[0]
            : null;

        const billDetails = {
            ConsumerNumber: consumerNumber,
            ConsumerName: payment.User?.name || "Resident",
            BillAmount: amount.toFixed(2),
            BillStatus: "UNPAID",
            DueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            BillMonth: payment.month || new Date().toLocaleString("default", { month: "long" }),
            BillYear: payment.year?.toString() || new Date().getFullYear().toString(),
            BillType: payment.type || "RENT",
            // Additional info banking apps may display
            AmountAfterDueDate: amount.toFixed(2),
            AmountWithinDueDate: amount.toFixed(2),
        };

        console.log(`\x1b[32m[1Bill Enquiry] ✅ Bill found and returned to 1Link:\x1b[0m`);
        console.log(`\x1b[36m[1Bill Enquiry]\x1b[0m   Consumer: ${payment.User?.name} | Amount: PKR ${amount} | Status: ${payment.status}`);
        console.log(`\x1b[36m[1Bill Enquiry]\x1b[0m   DueDate: ${billDetails.DueDate} | Month: ${billDetails.BillMonth} ${billDetails.BillYear}`);
        if (!isLiveMode) {
            console.log(`\x1b[33m[1Bill Enquiry] ⚠️  SIMULATION — this response was returned but 1Link's real network is not connected. No banking app will actually see this.\x1b[0m`);
        }

        // Response code "00" = success
        return NextResponse.json(responsePayload("00", "Bill fetched successfully", billDetails));

    } catch (error) {
        console.error("[1Bill Enquiry] Error:", error);
        return NextResponse.json(responsePayload("06", "Internal server error", null), { status: 500 });
    }
}

// 1Link standard response format
function responsePayload(responseCode, message, billDetails) {
    return {
        ResponseCode: responseCode,
        ResponseMessage: message,
        // "00" = success, anything else = error
        ...(billDetails || {})
    };
}

// GET handler for 1Link URL ping/verification
export async function GET() {
    return NextResponse.json({
        ResponseCode: "00",
        ResponseMessage: "1Bill enquiry endpoint active"
    });
}
