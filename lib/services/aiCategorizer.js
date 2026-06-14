import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

export async function categorizeComplaintWithAI(title, description) {
    if (!apiKey) {
        console.warn("GEMINI_API_KEY not found. Skipping AI categorization.");
        return null;
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
You are an AI assistant for a hostel management system. Your job is to categorize maintenance complaints and assign a priority level based on the title and description provided by the resident.

Valid Categories:
- MAINTENANCE (Broken furniture, plumbing, structural issues, etc.)
- ELECTRICAL (Lights, fans, AC, wiring, appliances)
- INTERNET (WiFi issues, connectivity)
- CLEANLINESS (Room cleaning, dirty washrooms, mess hygiene)
- SECURITY (Theft, unauthorized access, broken locks)
- NOISE (Loud neighbors, disturbances)
- OTHER (Anything that doesn't fit above)

Valid Priorities:
- LOW (Minor inconveniences, no immediate action needed)
- MEDIUM (Standard issues, needs to be fixed within a few days)
- HIGH (Important issues affecting daily life, e.g., fan not working, minor leaks)
- URGENT (Safety hazards, complete power outage, major flooding, security breaches)

Given the following complaint, return a JSON object with strictly two keys: "category" and "priority".
Do not return any markdown formatting, only the raw JSON.

Title: ${title}
Description: ${description || "No description provided."}
`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // Clean up any potential markdown formatting from the response
        const cleanJsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJsonStr);

        return {
            category: parsed.category?.toUpperCase() || 'OTHER',
            priority: parsed.priority?.toUpperCase() || 'MEDIUM'
        };

    } catch (error) {
        console.error("AI Categorization failed:", error);
        return null;
    }
}
