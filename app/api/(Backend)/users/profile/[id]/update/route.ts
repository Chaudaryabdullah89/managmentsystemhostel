import { userUpdate } from "@/lib/services/UserServices/userservices"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {

    const { id } = await params
    console.log(`[API] PUT /api/users/profile/${id}/update - Request received for profile update`);

    const body = await req.json()
    const data = body
    console.log(`[API] PUT /api/users/profile/${id}/update - Update payload keys: ${Object.keys(data).join(', ')}`);

    try {
        const user = await userUpdate(id, data)
        console.log(`[API] PUT /api/users/profile/${id}/update - Update successful`);
        return Response.json(user)
    } catch (error: any) {
        console.error(`[API] PUT /api/users/profile/${id}/update - Update failed: ${error.message}`);
        return Response.json({ error: error.message }, { status: 500 });
    }
}