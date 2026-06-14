import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
    const authResult = await requireAuth();
    if (!authResult.success) {
        return errorResponse(authResult.error || "Unauthorized", authResult.status || 401);
    }

    try {
        const body = await request.json();
        const { userId, hostelId } = body;

        if (!userId) {
            return errorResponse("userId is required", 400);
        }

        const targetProfile = await prisma.residentProfile.findUnique({
            where: { userId },
            include: { User: { select: { name: true } } }
        });

        if (!targetProfile || !targetProfile.lifestyle) {
            return errorResponse("User does not have a completed lifestyle profile.", 400);
        }

        // Fetch potential roommates in the same hostel
        // Only fetch users who have a lifestyle profile
        const potentialRoommatesRaw = await prisma.residentProfile.findMany({
            where: {
                userId: { not: userId },
                currentHostelId: hostelId, // Can be null or matching
                lifestyle: { not: require("@prisma/client").Prisma.DbNull }
            },
            include: { User: { select: { name: true } } },
            take: 20 // Limit to avoid massive payload
        });

        const potentialRoommates = potentialRoommatesRaw as any[];

        if (potentialRoommates.length === 0) {
            return successResponse({ data: [], message: "No potential roommates with lifestyle profiles found." });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return errorResponse("AI services are not configured (GEMINI_API_KEY missing).", 503);
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const targetData = {
            name: (targetProfile as any).User.name,
            lifestyle: targetProfile.lifestyle
        };

        const candidatesData = potentialRoommates.map(p => ({
            id: p.userId,
            name: (p as any).User.name,
            lifestyle: p.lifestyle
        }));

        const prompt = `
You are an AI matching agent for a hostel. Your goal is to compare the lifestyle preferences of a target resident against a list of candidate residents to find the best roommate matches.

Target Resident:
${JSON.stringify(targetData, null, 2)}

Candidates:
${JSON.stringify(candidatesData, null, 2)}

Analyze their lifestyle profiles (e.g., sleep schedule, study habits, cleanliness, smoking, etc.) and calculate a compatibility score from 0 to 100 for each candidate.
Return a JSON array of objects, where each object contains:
- "userId": The ID of the candidate
- "score": The compatibility score (0-100)
- "reason": A short 1-2 sentence explanation of why they are a good or bad match.

Sort the array from highest score to lowest score.
Output STRICTLY valid JSON. Do not include markdown formatting like \`\`\`json.
`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const cleanJsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJsonStr);

        // Attach candidate details back to the results
        const enrichedResults = parsed.map((match: any) => {
            const candidate = potentialRoommates.find(p => p.userId === match.userId);
            return {
                ...match,
                candidate: candidate ? {
                    name: (candidate as any).User.name,
                    lifestyle: candidate.lifestyle
                } : null
            };
        });

        return successResponse({ data: enrichedResults });

    } catch (error) {
        console.error("Roommate matching failed:", error);
        return errorResponse("Failed to generate roommate matches.", 500);
    }
}
