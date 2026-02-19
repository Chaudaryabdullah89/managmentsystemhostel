import AuthService from "@/lib/services/AuthServices/authservices";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

interface RegisterData {
    name: string;
    email: string;
    password: string;
    phone: string;
    role: string;
}

export async function POST(request: NextRequest) {
    const authService = new AuthService();
    const body = await request.json() as RegisterData;
    const { name, email, password, phone, role } = body;
    console.log(`[API] POST /api/auth/signup - Attempting registration for email: ${email}, Role: ${role}`);
    try {
        const response = await authService.register({ name, email, password, phone, role });
        console.log(`[API] POST /api/auth/signup - Registration successful for email: ${email}`);
        return NextResponse.json(response);
    } catch (error: any) {
        console.error(`[API] POST /api/auth/signup - Registration failed for email: ${email}. Error: ${error.message}`);
        throw error;
    }
}
