import { checkRole } from '@/lib/checkRole';
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { generateUID, generateRegNumber, UID_PREFIXES } from "@/lib/uid-generator";
import { sendEmail } from "@/lib/utils/sendmail";
import { welcomeEmail } from "@/lib/utils/emailTemplates";

export async function GET(request) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const { searchParams } = new URL(request.url);
        const role = searchParams.get("role");
        const query = searchParams.get("query");
        const hostelIdInput = searchParams.get("hostelId");

        const sanitize = (val) => (val === 'all' || val === 'null' || val === 'undefined' || !val) ? null : val;
        let hostelId = sanitize(hostelIdInput);
        const where = {};

        // Define if this is a global "Find Account" search (e.g. for bookings)
        const isGlobalSearch = query && (role === 'all' || role === 'GUEST');

        if (isGlobalSearch) {
            // GLOBAL SEARCH: Used mainly for booking lookups
            // Wardens can only lookup RESIDENT or GUEST to prevent probing of STAFF/ADMIN accounts
            if (auth.user.role === 'WARDEN') {
                where.role = { in: ['RESIDENT', 'GUEST'] };
            }
        } else {
            // LIST/FILTERED SEARCH: Apply role and security isolation
            if (role && role !== "all") {
                where.role = role;
            } else if (auth.user.role === 'WARDEN') {
                // If role = 'all', Warden is limited to Residents/Guests only
                where.role = { in: ['RESIDENT', 'GUEST'] };
            }

            if (auth.user.role === 'WARDEN') {
                let wardenHostelId = auth.user.hostelId;

                if (!wardenHostelId) {
                    const wardenProfile = await prisma.user.findUnique({
                        where: { id: auth.user.userId || auth.user.id },
                        select: { hostelId: true }
                    });
                    wardenHostelId = wardenProfile?.hostelId;
                }

                // Apply strict isolation: ONLY my hostel residents/guests
                where.OR = [
                    { hostelId: wardenHostelId },
                    { ResidentProfile: { currentHostelId: wardenHostelId } }
                ];
            } else if (hostelId) {
                // Admin/Global logic
                where.OR = [
                    { hostelId: hostelId },
                    { ResidentProfile: { currentHostelId: hostelId } }
                ];
            }
        }

        if (query) {
            const searchQuery = {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                    { phone: { contains: query, mode: 'insensitive' } },
                    { cnic: { contains: query, mode: 'insensitive' } },
                    { uid: { contains: query, mode: 'insensitive' } },
                    { regNumber: { contains: query, mode: 'insensitive' } }
                ]
            };

            if (where.OR) {
                where.AND = [
                    { OR: where.OR },
                    searchQuery
                ];
                delete where.OR;
            } else {
                Object.assign(where, searchQuery);
            }
        }

        const users = await prisma.user.findMany({
            where,
            include: {
                ResidentProfile: true,
                StaffProfile: true,
                Hostel_User_hostelIdToHostel: {
                    select: { name: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        return NextResponse.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error("[API] GET /api/users Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const body = await request.json();
        const {
            name, email, password, phone, role, hostelId, cnic, designation, basicSalary,
            canManageExpenses, canManageMess, canManageGeneral, canManageUtilities, canManageMaintenance, canManageSalaries
        } = body;

        // Check if user exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return NextResponse.json({ success: false, error: "Email already registered" }, { status: 400 });

        const hashedPassword = await bcrypt.hash(password || "password123", 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                phone,
                role: role,
                cnic,
                hostelId: hostelId || null,
                canManageExpenses: !!canManageExpenses,
                canManageMess: !!canManageMess,
                canManageGeneral: !!canManageGeneral,
                canManageUtilities: !!canManageUtilities,
                canManageMaintenance: !!canManageMaintenance,
                canManageSalaries: !!canManageSalaries,
                updatedAt: new Date(),
                ...(role === 'STAFF' || role === 'WARDEN' ? {
                    StaffProfile: {
                        create: {
                            designation: designation || (role === 'WARDEN' ? 'Hostel Warden' : 'General Staff'),
                            basicSalary: Number(basicSalary) || 0,
                            joiningDate: new Date()
                        }
                    }
                } : {}),
                ...(role === 'RESIDENT' ? {
                    ResidentProfile: {
                        create: {
                            currentHostelId: hostelId
                        }
                    }
                } : {})
            },
            include: {
                StaffProfile: true,
                ResidentProfile: true
            }
        });

        // Generate and assign UID & Registration Number
        const uid = generateUID(UID_PREFIXES.USER, newUser.id);
        const regNumber = generateRegNumber();
        const updatedUser = await prisma.user.update({
            where: { id: newUser.id },
            data: { uid, regNumber }
        });

        // Fetch hostel name for email
        let hostelName = null;
        if (hostelId) {
            const hostel = await prisma.hostel.findUnique({ where: { id: hostelId }, select: { name: true } });
            hostelName = hostel?.name || null;
        }

        // Send welcome email with credentials (fire-and-forget)
        const rawPassword = password || "password123";
        sendEmail({
            to: email,
            subject: "Welcome to Mubarak Group of Hostels — Your Account Details",
            html: welcomeEmail({ name, email, password: rawPassword, role, hostelName }),
        }).catch(err => console.error("[Email] Welcome email failed:", err));

        return NextResponse.json({
            success: true,
            message: `User ${name} created successfully as ${role}`,
            user: updatedUser
        });
    } catch (error) {
        console.error("User Creation Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

