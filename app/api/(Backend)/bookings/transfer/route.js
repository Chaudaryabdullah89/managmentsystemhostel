import { checkRole } from '@/lib/checkRole';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req) {
    const auth = await checkRole(['ADMIN', 'WARDEN', 'SUPER_ADMIN']);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const { bookingId, newRoomId, reason, adjustAmount } = await req.json();

        if (!bookingId || !newRoomId) {
            return NextResponse.json({ success: false, error: 'bookingId and newRoomId are required' }, { status: 400 });
        }

        // Fetch current booking with room info
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { Room: true }
        });

        if (!booking) {
            return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
        }

        if (['CANCELLED', 'CHECKED_OUT', 'COMPLETED'].includes(booking.status)) {
            return NextResponse.json({ success: false, error: 'Cannot transfer an inactive booking' }, { status: 400 });
        }

        // Fetch new room
        const newRoom = await prisma.room.findUnique({ where: { id: newRoomId } });
        if (!newRoom) {
            return NextResponse.json({ success: false, error: 'Target room not found' }, { status: 404 });
        }

        if (newRoom.status === 'OCCUPIED' || newRoom.status === 'MAINTENANCE') {
            return NextResponse.json({ success: false, error: `Target room is ${newRoom.status.toLowerCase()} and cannot be assigned` }, { status: 400 });
        }

        if (newRoom.id === booking.roomId) {
            return NextResponse.json({ success: false, error: 'Guest is already in this room' }, { status: 400 });
        }

        const oldRoomId = booking.roomId;

        // Execute transfer in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Update booking's room
            const updatedBooking = await tx.booking.update({
                where: { id: bookingId },
                data: {
                    roomId: newRoomId,
                    ...(adjustAmount !== undefined ? { totalAmount: adjustAmount } : {}),
                }
            });

            // Check if old room still has active bookings
            const remainingBookingsInOldRoom = await tx.booking.count({
                where: {
                    roomId: oldRoomId,
                    status: { in: ['CONFIRMED', 'CHECKED_IN', 'PENDING'] },
                    id: { not: bookingId }
                }
            });

            // Free old room if no more active bookings
            if (remainingBookingsInOldRoom === 0) {
                await tx.room.update({
                    where: { id: oldRoomId },
                    data: { status: 'AVAILABLE' }
                });
            }

            // Mark new room as occupied
            await tx.room.update({
                where: { id: newRoomId },
                data: { status: 'OCCUPIED' }
            });

            return updatedBooking;
        });

        return NextResponse.json({
            success: true,
            message: 'Room transfer completed successfully',
            booking: result
        });

    } catch (error) {
        console.error('Room transfer error:', error);
        return NextResponse.json({ success: false, error: 'Transfer failed. Please try again.' }, { status: 500 });
    }
}
