import { decodeJwt, JWTPayload } from 'jose';

interface DecodedToken extends JWTPayload {
    id?: string;
    userId?: string;
    email?: string;
    name?: string;
    role?: string;
    hostelId?: string | null;
}

const verifyToken = (token: string): DecodedToken | null => {
    try {
        // We only decode on the client to get the ID.
        // The server validates the token authenticity via Middleware/API.
        const decoded = decodeJwt(token) as DecodedToken;
        return decoded;
    } catch (error) {
        console.error("Token decoding failed:", error);
        return null;
    }
};

export default verifyToken;
