import { requireAuth } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/apiResponse";

export async function POST(request) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;
    const userId = guard.user?.id || guard.user?.userId || guard.user?.sub;

    try {
        const { hostelId, mealType, rating, comments } = await request.json();

        if (!hostelId || !mealType || !rating) {
            return errorResponse("Missing required fields: hostelId, mealType, rating", 400);
        }

        const numericRating = parseInt(rating, 10);
        if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
            return errorResponse("Rating must be an integer between 1 and 5", 400);
        }

        const feedback = await prisma.messFeedback.create({
            data: {
                userId,
                hostelId,
                mealType: mealType.toUpperCase(),
                rating: numericRating,
                comments: comments || null,
            }
        });

        return successResponse({
            message: "Feedback submitted successfully",
            feedback
        });

    } catch (error) {
        console.error("POST /api/guest/mess/feedback error:", error);
        return errorResponse("Failed to submit feedback", 500);
    }
}

export async function GET(request) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;

    try {
        const { searchParams } = new URL(request.url);
        const hostelId = searchParams.get("hostelId");

        if (!hostelId) {
            return errorResponse("Missing required query param: hostelId", 400);
        }

        // Fetch recent feedbacks
        const feedbacks = await prisma.messFeedback.findMany({
            where: { hostelId },
            include: {
                User: {
                    select: { name: true, image: true }
                }
            },
            orderBy: { createdAt: "desc" },
            take: 30
        });

        // Compute average ratings
        const stats = await prisma.messFeedback.groupBy({
            by: ["mealType"],
            where: { hostelId },
            _avg: {
                rating: true
            },
            _count: {
                id: true
            }
        });

        const averages = stats.reduce((acc, curr) => {
            acc[curr.mealType] = {
                avg: curr._avg.rating ? parseFloat(curr._avg.rating.toFixed(1)) : 0,
                count: curr._count.id
            };
            return acc;
        }, { BREAKFAST: { avg: 0, count: 0 }, LUNCH: { avg: 0, count: 0 }, DINNER: { avg: 0, count: 0 } });

        return successResponse({
            feedbacks,
            averages
        });

    } catch (error) {
        console.error("GET /api/guest/mess/feedback error:", error);
        return errorResponse("Failed to load feedback", 500);
    }
}
