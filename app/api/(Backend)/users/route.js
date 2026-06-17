export const dynamic = 'force-dynamic';
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { generateUID, generateRegNumber, UID_PREFIXES } from "@/lib/uid-generator";
import { sendEmail } from "@/lib/utils/sendmail";
import { welcomeEmail, getBaseUrl } from "@/lib/utils/emailTemplates";
import { requireAuth, requireRoles } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";
import { getBranding } from "@/lib/permissions";

export async function GET(request) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;
    const auth = { user: guard.user };

    try {
        const { searchParams } = new URL(request.url);
        const role = searchParams.get("role");
        const query = searchParams.get("query");
        const hostelIdInput = searchParams.get("hostelId");

        // 1. Determine Identity & Mandatory Isolation
        const userRole = auth.user.role;
        let isolationHostelId = auth.user.hostelId;

        // If Warden/Staff must be isolated to a hostel, ensure it's fetched reliably
        if (userRole === 'WARDEN' || userRole === 'STAFF') {
            if (!isolationHostelId) {
                // Check direct link on user first
                const profile = await prisma.user.findUnique({
                    where: { id: auth.user.userId || auth.user.id },
                    select: { hostelId: true }
                });
                isolationHostelId = profile?.hostelId;

                // If still null and user is a warden, check the Hostel table via managerId
                // NOTE: The Hostel model has `managerId`, NOT `wardenId`
                if (!isolationHostelId && userRole === 'WARDEN') {
                    const managedHostel = await prisma.hostel.findFirst({
                        where: { managerId: auth.user.userId || auth.user.id },
                        select: { id: true }
                    });
                    isolationHostelId = managedHostel?.id;
                }
            }
        }
        console.log(`[API] GET /api/users - Role: ${userRole}, Isolation: ${isolationHostelId}`);

        const sanitize = (val) => (val === "all" || val === "null" || val === "undefined" || !val) ? null : val;
        const hostelId = sanitize(hostelIdInput);

        const where = {};

        // 2. Role Filtering
        if (role && role !== "all") {
            where.role = role;
        } else if (userRole === 'WARDEN') {
            where.role = { in: ['RESIDENT', 'GUEST'] };
        }

        // 3. Security Isolation Enforcement
        if (userRole === 'WARDEN' || (userRole === 'STAFF' && isolationHostelId)) {
            if (!isolationHostelId) {
                console.warn("[API] GET /api/users - Warden/Staff has no isolationHostelId");
                return successResponse({ data: [] });
            }
            
            where.AND = [
                ...(where.role ? [{ role: where.role }] : []),
                {
                    OR: [
                        { hostelId: isolationHostelId },
                        { ResidentProfile: { currentHostelId: isolationHostelId } }
                    ]
                }
            ];
            // Clear out high-level role if we moved it into AND
            if (where.role) delete where.role;
        } else if (hostelId) {
            // ADMIN or un-isolated STAFF filtering
            where.OR = [
                { hostelId: hostelId },
                { ResidentProfile: { currentHostelId: hostelId } }
            ];
        }

        console.log("[API] GET /api/users - Final Where:", JSON.stringify(where, null, 2));

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

        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true, name: true, email: true, phone: true, cnic: true,
                    role: true, isActive: true, hostelId: true, regNumber: true, uid: true,
                    image: true, createdAt: true, lastLogin: true,
                    ResidentProfile: true,
                    StaffProfile: { select: { designation: true, basicSalary: true, joiningDate: true } },
                    Hostel_User_hostelIdToHostel: { select: { name: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.user.count({ where }),
        ]);

        return successResponse({
            data: users,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error("[API] GET /api/users Error:", error);
        return errorResponse(error.message, 500, { error: error.message });
    }
}

export async function POST(request) {
    const guard = await requireRoles(['ADMIN']);
    if (!guard.ok) return guard.response;

    try {
        const body = await request.json();
        const {
            name, email, password, phone, role, hostelId, cnic, designation, basicSalary,
            city, address, guardianName, guardianPhone, emergencyContact, currentResidence, otherImages,
            canManageExpenses, canManageMess, canManageGeneral, canManageUtilities, canManageMaintenance, canManageSalaries
        } = body;

        // Check if user exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return errorResponse("Email already registered", 400, { error: "Email already registered" });

        // Security: never use a predictable default password.
        // If admin didn't provide one, generate a cryptographically random temp password.
        // The welcome email directs the user to set their own password via forgot-password flow.
        const tempPassword = password || crypto.randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const userId = crypto.randomUUID();
        const uid = generateUID(UID_PREFIXES.USER, userId);
        const regNumber = generateRegNumber();

        const newUser = await prisma.user.create({
            data: {
                id: userId,
                name,
                email,
                password: hashedPassword,
                phone,
                role: role,
                cnic,
                city: city || null,
                address: address || null,
                uid,
                regNumber,
                hostelId: hostelId || null,
                canManageExpenses: !!canManageExpenses,
                canManageMess: !!canManageMess,
                canManageGeneral: !!canManageGeneral,
                canManageUtilities: !!canManageUtilities,
                canManageMaintenance: !!canManageMaintenance,
                canManageSalaries: !!canManageSalaries,
                basicSalary: Number(basicSalary) || 0,
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
                ...((role === 'RESIDENT' || role === 'GUEST') ? {
                    ResidentProfile: {
                        create: {
                            currentHostelId: hostelId,
                            guardianName: guardianName || null,
                            guardianPhone: guardianPhone || null,
                            emergencyContact: emergencyContact || null,
                            city: city || null,
                            address: address || null,
                            documents: {
                                currentResidence: currentResidence || "",
                                galleryImages: Array.isArray(otherImages) ? otherImages.slice(0, 8) : [],
                            },
                        }
                    }
                } : {})
            },
            include: {
                StaffProfile: true,
                ResidentProfile: true
            }
        });

        // Fetch hostel name for email
        let hostelName = null;
        if (hostelId) {
            const hostel = await prisma.hostel.findUnique({ where: { id: hostelId }, select: { name: true } });
            hostelName = hostel?.name || null;
        }

        // Send welcome email with a password-reset link (never send raw passwords via email)
        const branding = await getBranding();
        const baseUrl = getBaseUrl();
        const resetLinkNote = `${baseUrl}/auth/login`;
        sendEmail({
            to: email,
            subject: `Welcome to ${branding.companyName} — Your Account is Ready`,
            html: welcomeEmail({ name, email, role, hostelName, loginUrl: resetLinkNote, branding }),
        }).catch(err => console.error("[Email] Welcome email failed:", err));

        return successResponse({
            message: `User ${name} created successfully as ${role}`,
            user: {
                id: newUser.id, name: newUser.name, email: newUser.email,
                role: newUser.role, uid: newUser.uid,
            },
        });
    } catch (error) {
        console.error("User Creation Error:", error);
        return errorResponse(error.message, 500, { error: error.message });
    }
}

