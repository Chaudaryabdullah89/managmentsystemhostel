/**
 * HostelAI Memory Engine
 * Builds a compressed, token-efficient conversation memory string.
 * - Returns last 20 messages as a clear turn-by-turn log.
 * - If there are > 20 messages, prefixes a 1-sentence rolling summary.
 */

import prisma from "@/lib/prisma";

export async function buildConversationMemory(userId: string): Promise<string> {
    try {
        const allMessages = await prisma.chatMessage.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 40,
            select: {
                role: true,
                content: true,
                createdAt: true,
                cardType: true
            }
        });

        const messages = allMessages.reverse();

        if (messages.length === 0) return "";

        // Build recent 20 turns
        const recentTurns = messages.slice(-20);
        const recentHistory = recentTurns
            .map(m => {
                const speaker = m.role === "user" ? "User" : "HostelAI";
                const cardNote = m.cardType ? ` [${m.cardType} card shown]` : "";
                return `${speaker}: ${m.content.slice(0, 200)}${cardNote}`;
            })
            .join("\n");

        // If older context exists, generate a summary line
        const olderMessages = messages.slice(0, -20);
        if (olderMessages.length > 0) {
            const topics = new Set<string>();
            for (const m of olderMessages) {
                if (m.cardType) topics.add(m.cardType.replace("_CARD", "").toLowerCase());
            }
            const topicList = Array.from(topics).slice(0, 4).join(", ");
            const summary = `[Earlier conversation covered: ${topicList || "general hostel queries"}. ${olderMessages.length} older messages summarized.]`;
            return `${summary}\n\n${recentHistory}`;
        }

        return recentHistory;
    } catch (err) {
        console.error("[aiMemory] buildConversationMemory error:", err);
        return "";
    }
}
