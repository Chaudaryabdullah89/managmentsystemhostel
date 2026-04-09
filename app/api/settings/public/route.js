import { getBranding } from "@/lib/permissions";
import { successResponse } from "@/lib/apiResponse";

export const dynamic = 'force-dynamic';

export async function GET() {
    const branding = await getBranding();
    return successResponse({ 
        ...branding, 
        data: branding,
        settings: branding 
    });
}
