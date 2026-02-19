import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server";

export default class HostelServices {
    async createhostel(data) {
        try {
            const {
                hostelname, warden, type, montlypayment, pricePerNight, contact, email,
                floors, rooms, status, laundry, mess, street,
                city, state, country, zip, completeAddress, description,
                cleaningInterval, laundryInterval
            } = data;

            console.log(`[API] POST /api/hostels/createhostel - Payload for: ${hostelname}`);

            const monthlyRent = parseFloat(montlypayment) || 0;
            const nightlyRent = parseFloat(pricePerNight) || 0;
            const floorCount = parseInt(floors) || 1;
            const roomCount = parseInt(rooms) || 0;

            const isLaundry = String(laundry).toLowerCase() === "yes" || laundry === true;
            const isMess = String(mess).toLowerCase() === "yes" || mess === true;

            const wardenIds = (warden && Array.isArray(warden)) ? warden : [];

            const hostel = await prisma.hostel.create({
                data: {
                    name: hostelname,
                    type: type || "BOYS",
                    address: street || "",
                    city: city,
                    state: state || "Punjab",
                    country: country || "Pakistan",
                    phone: contact,
                    email: email,
                    description: description,
                    floors: floorCount,
                    totalRooms: roomCount,
                    status: status || "ACTIVE",
                    montlyrent: monthlyRent,
                    pernightrent: nightlyRent,
                    laundaryavailable: isLaundry,
                    messavailable: isMess,
                    zip: zip,
                    completeaddress: completeAddress,
                    wardens: wardenIds,
                    cleaningInterval: parseInt(cleaningInterval) || 24,
                    laundryInterval: parseInt(laundryInterval) || 48
                }
            });

            if (hostel) {
                // Synchronize warden hostel assignments
                if (wardenIds.length > 0) {
                    await prisma.user.updateMany({
                        where: { id: { in: wardenIds } },
                        data: { hostelId: hostel.id }
                    });
                }
                console.log("[API] POST /api/hostels/createhostel - Hostel created successfully");
                return NextResponse.json({ message: "Hostel created successfully", status: 200, data: hostel, success: true });
            }
        } catch (error) {
            console.error("[API] POST /api/hostels/createhostel - Error:", error);
            return NextResponse.json({ message: "Failed to create hostel", error: error.message }, { status: 500 });
        }
    }
    async gethostels(page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;
            const hostels = await prisma.hostel.findMany({
                skip: skip,
                take: limit,
                include: {
                    Room: {
                        include: {
                            maintanance: true,
                            LaundryLog: true,
                            CleaningLog: true
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
                    page,
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
                where: {
                    id: id
                }
            })
            console.log(hostel)
            return NextResponse.json({ message: "Hostel fetched successfully", status: 200, data: hostel, success: true })
        } catch (error) {
            console.error("[API] GET /api/hostels/gethostelById - Error:", error);
            return NextResponse.json({ message: "Failed to fetch hostel", error: error.message }, { status: 500 });
        }
    }
    async updatehostel(id, data) {
        try {
            const { id: _, updatedAt, createdAt, Room, ...updateData } = data;

            // Get current wardens to check for removals
            const currentHostel = await prisma.hostel.findUnique({
                where: { id },
                select: { wardens: true }
            });
            const oldWardens = currentHostel?.wardens || [];

            const hostel = await prisma.hostel.update({
                where: { id },
                data: {
                    ...updateData,
                    updatedAt: new Date()
                }
            });

            if (hostel) {
                const newWardens = hostel.wardens || [];

                // 1. Clear hostelId for wardens who were removed
                const removedWardens = oldWardens.filter(wid => !newWardens.includes(wid));
                if (removedWardens.length > 0) {
                    await prisma.user.updateMany({
                        where: { id: { in: removedWardens }, hostelId: id },
                        data: { hostelId: null }
                    });
                }

                // 2. Set hostelId for new/current wardens
                if (newWardens.length > 0) {
                    await prisma.user.updateMany({
                        where: { id: { in: newWardens } },
                        data: { hostelId: id }
                    });
                }

                console.log("[API] POST /api/hostels/updatehostel - Hostel updated successfully");
                return NextResponse.json({ message: "Hostel updated successfully", status: 200, data: hostel, success: true });
            }
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
            console.log(hostel)
            return NextResponse.json({ message: "Hostel deleted successfully", status: 200, data: hostel, success: true })
        } catch (error) {
            console.error("[API] GET /api/hostels/deletehostel - Error:", error);
            return NextResponse.json({ message: "Failed to delete hostel", error: error.message }, { status: 500 });
        }
    }
}