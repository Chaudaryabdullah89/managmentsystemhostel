import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET(request: NextRequest) {
    const authResult = await requireAuth();
    if (!authResult.success) {
        return errorResponse(authResult.error || "Unauthorized", authResult.status || 401);
    }

    try {
        const { searchParams } = new URL(request.url);
        const hostelId = searchParams.get("hostelId");

        if (!hostelId) {
            return errorResponse("hostelId is required", 400);
        }

        // Fetch expenses from the last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const expenses = await prisma.expense.findMany({
            where: {
                hostelId,
                date: { gte: sixMonthsAgo },
                status: 'APPROVED' // Only count approved expenses
            },
            select: {
                amount: true,
                date: true,
                category: true
            }
        });

        // Group expenses by month
        const monthlyExpenses: Record<string, { total: number, categories: Record<string, number> }> = {};
        
        expenses.forEach(exp => {
            const monthYear = exp.date.toISOString().substring(0, 7); // YYYY-MM
            if (!monthlyExpenses[monthYear]) {
                monthlyExpenses[monthYear] = { total: 0, categories: {} };
            }
            const amt = Number(exp.amount);
            monthlyExpenses[monthYear].total += amt;
            
            const cat = exp.category.toString();
            monthlyExpenses[monthYear].categories[cat] = (monthlyExpenses[monthYear].categories[cat] || 0) + amt;
        });

        // Fetch active bookings in the last 6 months for occupancy
        const bookings = await prisma.booking.findMany({
            where: {
                Room: { hostelId },
                createdAt: { gte: sixMonthsAgo }
            },
            select: { createdAt: true }
        });

        const monthlyOccupancy: Record<string, number> = {};
        bookings.forEach(b => {
            const monthYear = b.createdAt.toISOString().substring(0, 7);
            monthlyOccupancy[monthYear] = (monthlyOccupancy[monthYear] || 0) + 1;
        });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return errorResponse("AI services are not configured (GEMINI_API_KEY missing).", 503);
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
You are an AI financial analyst for a hostel management system. Your job is to analyze the historical expense and occupancy data over the last 6 months and forecast the expected expenses and occupancy trends for the next month.

Historical Monthly Expenses:
${JSON.stringify(monthlyExpenses, null, 2)}

Historical Monthly New Bookings (Proxy for occupancy/turnover):
${JSON.stringify(monthlyOccupancy, null, 2)}

Provide a predictive analysis containing:
- "predictedTotalExpense": Estimated total expenses for next month (Number).
- "predictedOccupancyTrend": A brief sentence indicating if occupancy is expected to rise, fall, or stay stable.
- "keyInsights": An array of 2-3 strings highlighting unusual spikes in expenses or actionable advice to cut costs.

Return STRICTLY a JSON object without any markdown wrapping. 
Example Format:
{
  "predictedTotalExpense": 150000,
  "predictedOccupancyTrend": "Expected to rise due to seasonal trends.",
  "keyInsights": ["Electricity expenses spiked in August.", "Consider bulk purchasing mess supplies."]
}
`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const cleanJsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJsonStr);

        return successResponse({ data: parsed });

    } catch (error) {
        console.error("Predictive analytics failed:", error);
        return errorResponse("Failed to generate predictive analytics.", 500);
    }
}
