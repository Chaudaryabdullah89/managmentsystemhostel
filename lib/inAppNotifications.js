import { prisma } from "@/lib/prisma";

const SYSTEM_AUTHOR_ID_FALLBACK = "system";

function truncate(value, max = 220) {
    if (!value) return "";
    return value.length > max ? `${value.slice(0, max - 3)}...` : value;
}

export async function createInAppNotification({
    title,
    content,
    priority = "MEDIUM",
    category = "SYSTEM",
    targetRoles = [],
    hostelId = null,
    actorId = null,
}) {
    try {
        const authorId = actorId || SYSTEM_AUTHOR_ID_FALLBACK;
        const author = await prisma.user.findUnique({
            where: { id: authorId },
            select: { id: true },
        });

        if (!author) return;

        await prisma.notice.create({
            data: {
                title: truncate(title, 90),
                content: truncate(content, 500),
                priority,
                category,
                targetRoles,
                hostelId,
                authorId: author.id,
                isActive: true,
            },
        });
    } catch (error) {
        // Notification failures must never block business-critical mutations.
        console.error("[NOTIFICATION_FEED] Failed to create in-app notification:", error);
    }
}
