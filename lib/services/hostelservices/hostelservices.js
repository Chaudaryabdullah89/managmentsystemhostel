import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server";

export default class HostelServices {
    async createhostel(data) {
        try {
            console.log("[API] POST /api/hostels/createhostel - Data received:", data);
            const {
                hostelname,
                type,
                street,
                city,
                state,
                country,
                phone,
                contact,
                email,
                description,
                floors,
                floorCount,
                rooms,
                roomCount,
                status,
                monthlyRent,
                montlyrent,
                perNightRent,
                pernightrent,
                laundryAvailable,
                laundaryavailable,
                isLaundry,
                messAvailable,
                messavailable,
                isMess,
                zip,
                completeAddress,
                completeaddress,
                cleaningInterval,
                laundryInterval,
                warden
            } = data;

            const hostel = await prisma.hostel.create({
                data: {
                    name: hostelname || data.name,
                    type: type || "BOYS",
                    address: street || data.address || "",
                    city: city,
                    state: state || "Punjab",
                    country: country || "Pakistan",
                    phone: phone || contact || data.phone,
                    email: email,
                    description: description,
                    floors: parseInt(floors || floorCount) || 1,
                    rooms: parseInt(rooms || roomCount) || 0,
                    status: status || "ACTIVE",
                    monthlyRent: parseFloat(monthlyRent || montlyrent || data.monthlyRent) || 0,
                    perNightRent: parseFloat(perNightRent || pernightrent || data.perNightRent) || 0,
                    laundryAvailable: laundryAvailable !== undefined ? !!laundryAvailable : (laundaryavailable !== undefined ? !!laundaryavailable : !!isLaundry),
                    messAvailable: messAvailable !== undefined ? !!messAvailable : (messavailable !== undefined ? !!messavailable : !!isMess),
                    zip: zip,
                    completeAddress: completeAddress || completeaddress,
                    cleaningInterval: parseInt(cleaningInterval) || 24,
                    laundryInterval: parseInt(laundryInterval) || 48,
                    wardens: Array.isArray(warden) ? warden : []
                }
            });

            // Sync wardens' hostelId
            if (Array.isArray(warden) && warden.length > 0) {
                await prisma.user.updateMany({
                    where: { id: { in: warden } },
                    data: { hostelId: hostel.id }
                });
            }

            console.log("[API] POST /api/hostels/createhostel - Hostel created successfully");
            return NextResponse.json({ message: "Hostel created successfully", status: 200, data: hostel, success: true });

        } catch (error) {
            console.error("[API] POST /api/hostels/createhostel - Error:", error);
            return NextResponse.json({ message: "Failed to create hostel", error: error.message }, { status: 500 });
        }
    }

    async gethostels(skip = 0, limit = 10) {
        try {
            const hostels = await prisma.hostel.findMany({
                skip: skip,
                take: limit,
                include: {
                    Room: {
                        include: {
                            maintanance: true,
                            laundry: true,
                            cleaning: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            })
            const total = await prisma.hostel.count();
            return NextResponse.json({
                message: "Hostels fetched successfully",
                status: 200,
                data: hostels,
                success: true,
                pagination: {
                    total,
                    page: (skip / limit) + 1,
                    limit,
                    totalPages: Math.ceil(total / limit),
                    hasNextPage: skip + hostels.length < total
                }
            })
        } catch (error) {
            console.error("[API] GET /api/hostels/gethostels - Error:", error);
            return NextResponse.json({ message: "Failed to fetch hostels", error: error.message }, { status: 500 });
        }
    }

    async gethostelById(id) {
        try {
            const hostel = await prisma.hostel.findUnique({
                where: { id: id },
                include: {
                    Room: {
                        include: {
                            maintanance: true,
                            laundry: true,
                            cleaning: true
                        }
                    },
                    Manager: {
                        select: { name: true, email: true, phone: true }
                    }
                }
            })
            return NextResponse.json({ message: "Hostel fetched successfully", status: 200, data: hostel, success: true })
        } catch (error) {
            console.error("[API] GET /api/hostels/gethostelById - Error:", error);
            return NextResponse.json({ message: "Failed to fetch hostel", error: error.message }, { status: 500 });
        }
    }

    async updatehostel(id, data) {
        try {
            console.log(`[API] PUT /api/hostels/updatehostel - Updating hostel: ${id}`);
            const {
                id: _,
                updatedAt,
                createdAt,
                Room,
                hostelname,
                phone,
                rooms,
                totalRooms,
                monthlyRent,
                montlyrent,
                perNightRent,
                pernightrent,
                laundryAvailable,
                laundaryavailable,
                messAvailable,
                messavailable,
                completeAddress,
                completeaddress,
                warden,
                wardens,
                ...rest
            } = data;

            // Map incoming fields to schema fields if they differ
            const updatePayload = {
                ...rest,
                name: hostelname || rest.name,
                phone: phone || data.contact || rest.phone,
                rooms: rooms !== undefined ? parseInt(rooms) : undefined,
                monthlyRent: (monthlyRent !== undefined ? parseFloat(monthlyRent) : (montlyrent !== undefined ? parseFloat(montlyrent) : undefined)),
                perNightRent: (perNightRent !== undefined ? parseFloat(perNightRent) : (pernightrent !== undefined ? parseFloat(pernightrent) : undefined)),
                laundryAvailable: (laundryAvailable !== undefined ? !!laundryAvailable : (laundaryavailable !== undefined ? !!laundaryavailable : undefined)),
                messAvailable: (messAvailable !== undefined ? !!messAvailable : (messavailable !== undefined ? !!messavailable : undefined)),
                completeAddress: completeAddress || completeaddress || data.completeAddress || rest.completeAddress,
                updatedAt: new Date()
            };

            // Remove undefined fields
            Object.keys(updatePayload).forEach(key => updatePayload[key] === undefined && delete updatePayload[key]);

            const hostel = await prisma.hostel.update({
                where: { id },
                data: updatePayload
            });

            if (hostel && (warden || wardens)) {
                const newWardens = Array.isArray(wardens) ? wardens : (Array.isArray(warden) ? warden : []);

                // 1. Clear hostelId for wardens who were assigned to this hostel but are not in the new list
                await prisma.user.updateMany({
                    where: {
                        hostelId: id,
                        role: 'WARDEN',
                        id: { notIn: newWardens }
                    },
                    data: { hostelId: null }
                });

                // 2. Set hostelId for new wardens
                if (newWardens.length > 0) {
                    await prisma.user.updateMany({
                        where: { id: { in: newWardens } },
                        data: { hostelId: id }
                    });
                }
            }

            console.log("[API] PUT /api/hostels/updatehostel - Hostel updated successfully");
            return NextResponse.json({ message: "Hostel updated successfully", status: 200, data: hostel, success: true });
        } catch (error) {
            console.error("[API] POST /api/hostels/updatehostel - Error:", error);
            return NextResponse.json({ message: "Failed to update hostel", error: error.message }, { status: 500 });
        }
    }

    async deletehostel(id) {
        try {
            const hostel = await prisma.hostel.delete({
                where: {
                    id: id
                }
            })
            console.log(`[API] DELETE /api/hostels/deletehostel - Deleted hostel: ${id}`);
            return NextResponse.json({ message: "Hostel deleted successfully", status: 200, data: hostel, success: true })
        } catch (error) {
            console.error("[API] DELETE /api/hostels/deletehostel - Error:", error);
            return NextResponse.json({ message: "Failed to delete hostel", error: error.message }, { status: 500 });
        }
    }
}