import prisma from "@/lib/prisma";
import { generateUID, UID_PREFIXES } from "@/lib/uid-generator";

export default class TaskServices {
    async getTasks(filter = {}) {
        try {
            return await prisma.staffTask.findMany({
                where: filter,
                include: {
                    assignedTo: {
                        select: { id: true, name: true, image: true, role: true }
                    },
                    createdBy: {
                        select: { id: true, name: true }
                    },
                    hostel: {
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
            console.error("Error fetching tasks:", error);
            throw error;
        }
    }

    async getTaskStats(hostelId) {
        const where = hostelId ? { hostelId } : {};

        const total = await prisma.staffTask.count({ where });
        const pending = await prisma.staffTask.count({ where: { ...where, status: 'PENDING' } });
        const inProgress = await prisma.staffTask.count({ where: { ...where, status: 'IN_PROGRESS' } });
        const completed = await prisma.staffTask.count({ where: { ...where, status: 'COMPLETED' } });
        const urgent = await prisma.staffTask.count({
            where: {
                ...where,
                priority: 'URGENT',
                status: { not: 'COMPLETED' }
            }
        });

        return {
            total,
            pending,
            inProgress,
            completed,
            urgent,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
        };
    }

    async createTask(data) {
        try {
            const newTask = await prisma.staffTask.create({
                data: {
                    title: data.title,
                    description: data.description,
                    priority: data.priority || 'MEDIUM',
                    category: data.category || 'GENERAL',
                    hostelId: data.hostelId,
                    assignedToId: data.assignedToId || null,
                    createdById: data.createdById,
                    dueDate: data.dueDate ? new Date(data.dueDate) : null,
                }
            });

            // Generate and assign UID
            const uid = generateUID(UID_PREFIXES.TASK, newTask.id);
            const updatedTask = await prisma.staffTask.update({
                where: { id: newTask.id },
                data: { uid }
            });

            return updatedTask;
        } catch (error) {
            console.error("Error creating task:", error);
            throw error;
        }
    }

    async updateTask(id, data) {
        try {
            const updateData = { ...data };
            if (data.completedAt === undefined && data.status === 'COMPLETED') {
                updateData.completedAt = new Date();
            }
            if (data.dueDate) {
                updateData.dueDate = new Date(data.dueDate);
            }

            const updatedTask = await prisma.staffTask.update({
                where: { id },
                data: updateData
            });

            // If task is completed, increment staff's handled count
            if (data.status === 'COMPLETED' && updatedTask.assignedToId) {
                try {
                    await prisma.staffProfile.update({
                        where: { userId: updatedTask.assignedToId },
                        data: {
                            totalTasksHandled: {
                                increment: 1
                            }
                        }
                    });
                } catch (profileError) {
                    console.error("Error updating staff profile performance:", profileError);
                }
            }

            return updatedTask;
        } catch (error) {
            console.error("Error updating task:", error);
            throw error;
        }
    }

    async addTaskComment(data) {
        try {
            return await prisma.taskComment.create({
                data: {
                    taskId: data.taskId,
                    userId: data.userId,
                    message: data.message,
                },
                include: {
                    User: {
                        select: { id: true, name: true, image: true, role: true }
                    }
                }
            });
        } catch (error) {
            console.error("Error adding task comment:", error);
            throw error;
        }
    }
}
