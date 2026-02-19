import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { generateUID, UID_PREFIXES } from "@/lib/uid-generator";
import { sendEmail } from "@/lib/utils/sendmail";
import { welcomeEmail } from "@/lib/utils/emailTemplates";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const role = searchParams.get("role");
        const query = searchParams.get("query");
        const hostelId = searchParams.get("hostelId");

        const where = {};
        if (role && role !== "all") where.role = role;
        if (hostelId && hostelId !== "null" && hostelId !== "undefined") {
            where.OR = [
                { hostelId: hostelId },
                { ResidentProfile: { currentHostelId: hostelId } }
            ];
        }

        if (query) {
            const searchQuery = {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                    { phone: { contains: query, mode: 'insensitive' } },
                    { cnic: { contains: query, mode: 'insensitive' } }
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
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, email, password, phone, role, hostelId, cnic, designation, basicSalary } = body;

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

        // Generate and assign UID
        const uid = generateUID(UID_PREFIXES.USER, newUser.id);
        const updatedUser = await prisma.user.update({
            where: { id: newUser.id },
            data: { uid }
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
            subject: "Welcome to GreenView Hostels — Your Account Details",
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

