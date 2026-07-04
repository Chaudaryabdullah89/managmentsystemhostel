import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/apiAuth";
import { generateInvoicePDF } from "@/lib/generateInvoicePDF";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;
    const authUser = guard.user;

    try {
        const { paymentId } = await params;

        if (!paymentId) {
            return NextResponse.json({ success: false, error: "Payment ID parameter is missing" }, { status: 400 });
        }

        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                User: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        cnic: true,
                    }
                },
                Booking: {
                    include: {
                        Room: {
                            include: {
                                Hostel: true
                            }
                        }
                    }
                }
            }
        });

        if (!payment) {
            return NextResponse.json({ success: false, error: `Payment record #${paymentId} not found.` }, { status: 404 });
        }

        // Security: GUEST/RESIDENT can only download their own receipt
        const callerId = authUser.userId || authUser.id;
        const isStaffOrAdmin = ['ADMIN', 'WARDEN', 'STAFF'].includes(authUser.role);

        if (!isStaffOrAdmin && payment.userId !== callerId) {
            return NextResponse.json({ success: false, error: "Access Denied: You can only view receipts for your own payments." }, { status: 403 });
        }

        // Fetch Hostel details if not directly tied through booking
        let hostel = payment.Booking?.Room?.Hostel;
        if (!hostel && payment.userId) {
            const userWithHostel = await prisma.user.findUnique({
                where: { id: payment.userId },
                include: { Hostel_User_hostelIdToHostel: true }
            });
            hostel = userWithHostel?.Hostel_User_hostelIdToHostel;
        }

        // Generate PDF
        const pdfDoc = await generateInvoicePDF({
            payment,
            booking: payment.Booking,
            hostel,
            user: payment.User
        });

        const pdfBuffer = Buffer.from(pdfDoc.output('arraybuffer'));

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `inline; filename="Receipt-${payment.uid || paymentId.slice(-6)}.pdf"`,
                "Cache-Control": "private, max-age=3600",
            },
        });

    } catch (error) {
        console.error("Receipt Generation Error:", error);
        return NextResponse.json({ success: false, error: error.message || "Failed to generate receipt PDF" }, { status: 500 });
    }
}
