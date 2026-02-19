import prisma from "@/lib/prisma";
import { generateUID, UID_PREFIXES } from "@/lib/uid-generator";

export default class ComplaintServices {
    async getComplaints(filter = {}) {
        try {
            return await prisma.complaint.findMany({
                where: filter,
                include: {
                    User_Complaint_userIdToUser: {
                        select: { id: true, name: true, email: true, image: true, role: true }
                    },
                    Hostel: {
                        select: { id: true, name: true, city: true }
                    },
                    User_Complaint_assignedToIdToUser: {
                        select: { id: true, name: true }
                    },
                    comments: {
                        include: {
                            User: {
                                select: { id: true, name: true, image: true, role: true }
                            }
                        },
                        orderBy: {
                            createdAt: 'asc'
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
        } catch (error) {
            console.error("Error fetching complaints:", error);
            throw error;
        }
    }

    async getComplaintStats(hostelId) {
        const where = hostelId ? { hostelId } : {};

        const total = await prisma.complaint.count({ where });
        const pending = await prisma.complaint.count({ where: { ...where, status: 'PENDING' } });
        const inProgress = await prisma.complaint.count({ where: { ...where, status: 'IN_PROGRESS' } });
        const resolved = await prisma.complaint.count({ where: { ...where, status: 'RESOLVED' } });
        const urgent = await prisma.complaint.count({
            where: {
                ...where,
                priority: 'URGENT',
                status: { not: 'RESOLVED' }
            }
        });

        return {
            total,
            pending,
            inProgress,
            resolved,
            urgent,
            resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0
        };
    }

    async createComplaint(data) {
        try {
            let { hostelId, roomNumber } = data;

            // If hostelId or roomNumber is missing, try to fetch from active booking
            if (!hostelId || !roomNumber) {
                const activeBooking = await prisma.booking.findFirst({
                    where: {
                        userId: data.userId,
                        status: { notIn: ['CANCELLED', 'CHECKED_OUT'] }
                    },
                    include: {
                        Room: true
                    },
                    orderBy: { createdAt: 'desc' }
                });

                if (activeBooking && activeBooking.Room) {
                    if (!hostelId) hostelId = activeBooking.Room.hostelId;
                    if (!roomNumber) roomNumber = activeBooking.Room.roomNumber;
                }
            }

            if (!hostelId) {
                throw new Error("Cannot retrieve specific residency location. Please contact administration.");
            }

            // Map category to enum (handle basic mapping)
            const categoryMap = {
                'maintenance': 'MAINTENANCE',
                'internet': 'INTERNET',
                'plumbing': 'MAINTENANCE', // Map plumbing to maintenance as general category
                'electrical': 'MAINTENANCE',
                'cleaning': 'CLEANLINESS',
                'security': 'SECURITY',
                'noise': 'NOISE',
                'other': 'OTHER'
            };

            const mappedCategory = categoryMap[data.category?.toLowerCase()] || 'OTHER';
            const mappedPriority = (data.priority || 'MEDIUM').toUpperCase();

            // Additional check for valid enum values if direct string was passed
            // This is a failsafe if the frontend sends something not in the map but valid in Prisma

            const newComplaint = await prisma.complaint.create({
                data: {
                    userId: data.userId,
                    hostelId: hostelId, // Use the resolved hostelId
                    roomNumber: roomNumber, // Use the resolved roomNumber
                    title: data.title,
                    description: data.description,
                    category: mappedCategory,
                    priority: mappedPriority,
                    status: 'PENDING',
                    updatedAt: new Date()
                }
            });

            // Generate and assign UID
            const uid = generateUID(UID_PREFIXES.COMPLAINT, newComplaint.id);
            const updatedComplaint = await prisma.complaint.update({
                where: { id: newComplaint.id },
                data: { uid }
            });

            return updatedComplaint;
        } catch (error) {
            console.error("Error creating complaint:", error);
            throw error;
        }
    }

    async updateComplaintStatus(id, status, resolutionNotes = "", assignedToId = null) {
        try {
            return await prisma.complaint.update({
                where: { id },
                data: {
                    status,
                    resolutionNotes,
                    assignedToId: assignedToId || undefined,
                    resolvedAt: status === 'RESOLVED' ? new Date() : null,
                    updatedAt: new Date()
                }
            });
        } catch (error) {
            console.error("Error updating complaint:", error);
            throw error;
        }
    }

    async getComplaintsByUser(userId) {
        return await this.getComplaints({ userId });
    }

    async getComplaintsByHostel(hostelId) {
        return await this.getComplaints({ hostelId });
    }

    async addComment(data) {
        try {
            return await prisma.complaintComment.create({
                data: {
                    complaintId: data.complaintId,
                    userId: data.userId,
                    message: data.message,
                    createdAt: new Date()
                },
                include: {
                    User: {
                        select: { id: true, name: true, image: true, role: true }
                    }
                }
            });
        } catch (error) {
            console.error("Error adding comment:", error);
            throw error;
        }
    }
}
