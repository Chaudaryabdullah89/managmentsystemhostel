import { checkRole } from '@/lib/checkRole';
import { NextResponse } from "next/server";
import BookingServices from "@/lib/services/bookingservices/bookingservices";
import { sendEmail } from "@/lib/utils/sendmail";
import { bookingStatusEmail } from "@/lib/utils/emailTemplates";
import { prisma } from "@/lib/prisma";

const bookingServices = new BookingServices();

export async function PUT(request) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const body = await request.json();
        const { id, status, notes } = body;

        if (!id || !status) {
            return NextResponse.json({ error: "Booking ID and Status are required" }, { status: 400 });
        }

        // Security: Wardens can ONLY update status for their own hostel's bookings
        if (auth.user.role === 'WARDEN') {
            let wardenHostelId = auth.user.hostelId;
            if (!wardenHostelId) {
                const wardenProfile = await prisma.user.findUnique({
                    where: { id: auth.user.userId || auth.user.id },
                    select: { hostelId: true }
                });
                wardenHostelId = wardenProfile?.hostelId;
            }

            const booking = await prisma.booking.findUnique({
                where: { id },
                include: { Room: { select: { hostelId: true } } }
            });

            if (booking && booking.Room?.hostelId !== wardenHostelId) {
                return NextResponse.json({ success: false, error: "Access Denied: You cannot update bookings for other hostels." }, { status: 403 });
            }
        }

        const data = await bookingServices.updateBookingStatus(id, status);

        // Send status update email
        try {
            const fullBooking = await prisma.booking.findUnique({
                where: { id },
                include: {
                    User: { select: { name: true, email: true } },
                    Room: {
                        include: {
                            Hostel: { select: { name: true } }
                        }
                    },
                },
            });

            if (fullBooking?.User?.email) {
                sendEmail({
                    to: fullBooking.User.email,
                    subject: `Booking ${status.charAt(0) + status.slice(1).toLowerCase()} — Mubarak Group of Hostels`,
                    html: bookingStatusEmail({
                        name: fullBooking.User.name,
                        bookingId: fullBooking.uid || fullBooking.id,
                        status,
                        roomNumber: fullBooking.Room?.roomNumber,
                        hostelName: fullBooking.Room?.Hostel?.name,
                        notes: notes || null,
                    }),
                }).catch(err => console.error("[Email] Booking status email failed:", err));
            }
        } catch (emailErr) {
            console.error("[Email] Error fetching booking for status email:", emailErr);
        }

        return NextResponse.json({
            success: true,
            data: data
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
