export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSelfOrRoles } from "@/lib/apiAuth";


export async function GET(req, { params }) {

    const { Id } = await params;


    if (!Id) {
        return NextResponse.json({ error: "User ID is required" });
    }

    const guard = await requireSelfOrRoles(Id, ["ADMIN"]);
    if (!guard.ok) return guard.response;

    try {
        const user = await prisma.user.findUnique({
            where: { id: Id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                cnic: true,
                phone: true,
                address: true,
                city: true,
                image: true,
                isActive: true,
                lastLogin: true,
                createdAt: true,
                updatedAt: true,
                hostelId: true,
                canManageExpenses: true,
                twoFactorEnabled: true,
                twoFactorMethod: true,
                backupCodes: true,
                ResidentProfile: {
                    select: {
                        id: true,
                        guardianName: true,
                        guardianPhone: true,
                        emergencyContact: true,
                        address: true,
                        city: true,
                        currentHostelId: true,
                        currentRoomId: true,
                        documents: true,
                    }
                },
                Hostel_User_hostelIdToHostel: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        city: true,
                        phone: true,
                        email: true
                    }
                },
                webauthnCredentials: {
                    select: {
                        id: true,
                        deviceName: true,
                        createdAt: true,
                    }
                }
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Transform response — don't expose raw backup codes
        const { backupCodes, webauthnCredentials, ...rest } = user;
        return NextResponse.json({
            ...rest,
            hasBackupCodes: backupCodes.length > 0,
            backupCodesRemaining: backupCodes.length,
            passkeys: webauthnCredentials,
            passkeyCount: webauthnCredentials.length,
        });
    } catch (err) {
        console.error("Error fetching user:", err);
        return NextResponse.json({ error: "Internal server error" });
    }
}