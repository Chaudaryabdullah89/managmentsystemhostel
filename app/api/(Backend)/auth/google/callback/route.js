import { SignJWT } from "jose";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { generateUID, generateRegNumber, UID_PREFIXES } from "@/lib/uid-generator";
import bcrypt from "bcrypt";

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get("code");
        const state = searchParams.get("state"); // Contains the mobile redirect URI

        if (!code) {
            return new Response("Missing authorization code", { status: 400 });
        }

        // 1. Resolve callback URL dynamically matching the origin
        const host = request.headers.get("host") || "localhost:3000";
        const protocol = host.includes("localhost") ? "http" : "https";
        const callbackUrl = `${protocol}://${host}/api/auth/google/callback`;

        // 2. Exchange authorization code with Google for tokens
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID || "",
                client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
                redirect_uri: callbackUrl,
                grant_type: "authorization_code",
            }),
        });

        if (!tokenRes.ok) {
            const errBody = await tokenRes.text();
            console.error("[Google Callback] Token exchange failed:", errBody);
            return new Response("Failed to authenticate with Google", { status: 401 });
        }

        const tokenData = await tokenRes.json();
        const idToken = tokenData.id_token;

        if (!idToken) {
            return new Response("No identity token returned by Google", { status: 400 });
        }

        // 3. Decode Google ID Token (Payload is part index 1)
        const payloadBase64 = idToken.split(".")[1];
        const payloadJson = Buffer.from(payloadBase64, "base64").toString("utf-8");
        const googleProfile = JSON.parse(payloadJson);

        const email = googleProfile.email;
        const name = googleProfile.name || email.split("@")[0];
        const image = googleProfile.picture || null;

        // 4. Find or auto-provision user account
        let user = await prisma.user.findUnique({
            where: { email },
            include: {
                ResidentProfile: true,
                StaffProfile: true
            }
        });

        if (!user) {
            const userId = randomUUID();
            const uid = generateUID(UID_PREFIXES.USER, userId);
            const regNumber = generateRegNumber();
            const hashedPassword = await bcrypt.hash(randomUUID(), 10);

            user = await prisma.user.create({
                data: {
                    id: userId,
                    name: name,
                    email: email,
                    password: hashedPassword,
                    role: "GUEST",
                    uid: uid,
                    regNumber: regNumber,
                    image: image,
                    updatedAt: new Date()
                },
                include: {
                    ResidentProfile: true,
                    StaffProfile: true
                }
            });
        } else if (image && !user.image) {
            user = await prisma.user.update({
                where: { id: user.id },
                data: { image },
                include: {
                    ResidentProfile: true,
                    StaffProfile: true
                }
            });
        }

        if (!user.isActive) {
            return new Response("Account is deactivated", { status: 403 });
        }

        // 5. Sign HMS JWT session token
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error("JWT_SECRET is not configured on the server.");
        }
        const JWT_SECRET = new TextEncoder().encode(secret);

        const token = await new SignJWT({
                id: user.id,
                userId: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                hostelId: user.hostelId,
            })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("7d")
            .sign(JWT_SECRET);

        // 6. Determine if the request originates from a mobile app.
        // If state does not start with '/' and does not start with the web domain, it's a mobile redirect!
        const isMobile = state && 
            !state.startsWith("/") && 
            !state.startsWith("http://localhost:3000") && 
            !state.startsWith("https://portalhms.vercel.app");

        if (isMobile) {
            let mobileUrl = state;
            const separator = mobileUrl.includes("?") ? "&" : "?";
            const paramsString = new URLSearchParams({
                token,
                userId: user.id,
                userName: user.name,
                userEmail: user.email,
                userRole: user.role
            }).toString();
            
            const finalMobileRedirect = `${mobileUrl}${separator}${paramsString}`;

            return new Response(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Authentication Successful</title>
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            height: 100vh;
                            margin: 0;
                            background-color: #F8FAFC;
                        }
                        .container {
                            text-align: center;
                            padding: 24px;
                            background: white;
                            border-radius: 16px;
                            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                            max-width: 90%;
                            width: 320px;
                        }
                        .icon {
                            font-size: 48px;
                            margin-bottom: 16px;
                        }
                        .title {
                            color: #1E293B;
                            font-size: 20px;
                            font-weight: 600;
                            margin-bottom: 8px;
                        }
                        .subtitle {
                            color: #64748B;
                            font-size: 14px;
                            margin-bottom: 24px;
                        }
                        .button {
                            display: inline-block;
                            background-color: #4F46E5;
                            color: white;
                            padding: 12px 24px;
                            border-radius: 8px;
                            text-decoration: none;
                            font-weight: 500;
                            font-size: 14px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="icon">✅</div>
                        <div class="title">Signed In Successfully</div>
                        <div class="subtitle">Redirecting you back to the application...</div>
                        <a href="${finalMobileRedirect}" class="button">Open Hostel Portal</a>
                        <script>
                            // Auto-redirect back to mobile app
                            setTimeout(function() {
                                window.location.href = "${finalMobileRedirect}";
                            }, 300);
                        </script>
                    </div>
                </body>
                </html>
            `, {
                headers: { "Content-Type": "text/html" }
            });
        }

        // For web login callback fallback
        return new Response(`
            <html>
                <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background-color: #F8FAFC;">
                    <div style="text-align: center;">
                        <h2 style="color: #4F46E5;">Authentication Successful</h2>
                        <p>Redirecting to dashboard...</p>
                        <script>
                            localStorage.setItem("user_token", "${token}");
                            window.location.href = "/guest/dashboard";
                        </script>
                    </div>
                </body>
            </html>
        `, {
            headers: { "Content-Type": "text/html" }
        });

    } catch (error) {
        console.error("[Google Callback API] Error:", error);
        return new Response("Authentication internal server error", { status: 500 });
    }
}
