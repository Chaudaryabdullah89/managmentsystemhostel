import { decodeJwt } from 'jose';

const verifyToken = (token) => {
    try {
        // We only decode on the client to get the ID.
        // The server validates the token authenticity via Middleware/API.
        const decoded = decodeJwt(token);
        return decoded;
    } catch (error) {
        console.error("Token decoding failed:", error);
        return null;
    }
};

export default verifyToken;