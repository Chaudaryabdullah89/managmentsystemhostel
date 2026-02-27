import { checkRole } from '@/lib/checkRole';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - fetch all leave requests (admin/warden)
export async function GET(req) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const hostelId = searchParams.get('hostelId');
        const status = searchParams.get('status');

        const where = {};
        if (userId) where.userId = userId;
        if (status) where.status = status;

        // Fetch leave requests from a notices-based approach using a specific category
        // We'll use a JSON metadata field in Booking or a dedicated search via maintanance table
        // Since there's no LeaveRequest model yet, we use the existing Prisma structure creatively
        // by storing leave requests as a JSON object in the ResidentProfile via a direct query

        // We'll use the maintanance model with a category 'LEAVE_REQUEST' as a lightweight approach
        const leaves = await prisma.maintanance.findMany({
            where: {
                ...(userId ? { userId } : {}),
                ...(hostelId ? { hostelId } : {}),
                ...(status ? { status } : {}),
                title: { startsWith: '[LEAVE]' }
            },
            include: {
                User_maintanance_userIdToUser: {
                    select: { id: true, name: true, email: true, uid: true, phone: true, image: true }
                },
                Hostel: { select: { id: true, name: true } },
                Room: { select: { id: true, roomNumber: true, floor: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, data: leaves });
    } catch (error) {
        console.error('Leave GET error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch leave requests' }, { status: 500 });
    }
}

// POST - create leave request (resident)
export async function POST(req) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const { userId, hostelId, roomId, startDate, endDate, reason, emergencyContact } = await req.json();

        if (!userId || !hostelId || !startDate || !endDate || !reason) {
            return NextResponse.json({
                success: false,
                error: 'userId, hostelId, startDate, endDate, and reason are required'
            }, { status: 400 });
        }

        if (new Date(startDate) >= new Date(endDate)) {
            return NextResponse.json({ success: false, error: 'End date must be after start date' }, { status: 400 });
        }

        // Check for existing pending leave
        const existing = await prisma.maintanance.findFirst({
            where: {
                userId,
                status: 'PENDING',
                title: { startsWith: '[LEAVE]' }
            }
        });

        if (existing) {
            return NextResponse.json({ success: false, error: 'You already have a pending leave request' }, { status: 400 });
        }

        const leave = await prisma.maintanance.create({
            data: {
                title: `[LEAVE] Leave Request: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`,
                description: JSON.stringify({ startDate, endDate, reason, emergencyContact }),
                status: 'PENDING',
                hostelId,
                userId,
                roomId,
                uid: `LV-${Date.now()}`
            }
        });

        return NextResponse.json({ success: true, data: leave, message: 'Leave request submitted successfully' });
    } catch (error) {
        console.error('Leave POST error:', error);
        return NextResponse.json({ success: false, error: 'Failed to submit leave request' }, { status: 500 });
    }
}

// PUT - update leave request status (admin/warden)
export async function PUT(req) {
    const auth = await checkRole(['ADMIN', 'WARDEN', 'SUPER_ADMIN']);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const { id, status, notes } = await req.json();

        if (!id || !status) {
            return NextResponse.json({ success: false, error: 'id and status are required' }, { status: 400 });
        }

        if (!['APPROVED', 'REJECTED', 'PENDING', 'IN_PROGRESS'].includes(status)) {
            return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
        }

        const updated = await prisma.maintanance.update({
            where: { id },
            data: {
                status,
                resolutionNotes: notes,
                resolvedAt: ['APPROVED', 'REJECTED'].includes(status) ? new Date() : null
            }
        });

        return NextResponse.json({ success: true, data: updated, message: `Leave request ${status.toLowerCase()}` });
    } catch (error) {
        console.error('Leave PUT error:', error);
        return NextResponse.json({ success: false, error: 'Failed to update leave request' }, { status: 500 });
    }
}
