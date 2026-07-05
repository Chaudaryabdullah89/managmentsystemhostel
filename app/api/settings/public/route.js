import { getBranding } from "@/lib/permissions";
import { successResponse } from "@/lib/apiResponse";

export const dynamic = 'force-dynamic';

export async function GET() {
    const branding = await getBranding();
    const oneBillLiveMode = process.env.ONEBILL_LIVE_MODE === "true";
    return successResponse({ 
        ...branding, 
        data: branding,
        settings: branding,
        oneBillLiveMode
    });
}
