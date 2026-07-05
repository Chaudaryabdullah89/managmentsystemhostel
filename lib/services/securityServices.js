// lib/services/securityServices.js
// Intrusion Detection System (IDS) Engine

import { prisma } from "@/lib/prisma";
import { broadcastSecurityEvent } from "@/lib/securityEventBus";

// Malicious payload patterns to inspect
const MALICIOUS_PATTERNS = {
    SQL_INJECTION: [
        /UNION\s+SELECT/i,
        /SELECT\s+.*\s+FROM/i,
        /INSERT\s+INTO/i,
        /UPDATE\s+.*\s+SET/i,
        /DELETE\s+FROM/i,
        /DROP\s+TABLE/i,
        /OR\s+['"]?\d+['"]?\s*=\s*['"]?\d+/i, // e.g. OR '1'='1'
        /--/          // SQL comment delimiter
    ],
    XSS_ATTEMPT: [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript\s*:/i,
        /onload\s*=/i,
        /onerror\s*=/i,
        /onclick\s*=/i
    ],
    PATH_TRAVERSAL: [
        /\.\.\//,          // Directory traversal: ../
        /\/etc\/passwd/i,
        /win\.ini/i
    ]
};

export class SecurityServices {
    /**
     * Checks a request payload (URL params, body, etc.) for intrusion patterns.
     * Returns the detected threat type, or null if clean.
     */
    detectThreats(payloadStr) {
        if (!payloadStr) return null;

        for (const [threatType, regexes] of Object.entries(MALICIOUS_PATTERNS)) {
            for (const regex of regexes) {
                if (regex.test(payloadStr)) {
                    return {
                        type: threatType,
                        matchedPattern: regex.toString()
                    };
                }
            }
        }
        return null;
    }

    /**
     * Records a security incident in the database and manages auto-blocking.
     */
    async logIncident({ ip, event, severity, description, userAgent = null, userId = null }) {
        console.warn(`\x1b[31m[IDS ALERT]\x1b[0m Security Incident detected! IP=${ip} | Event=${event} | Severity=${severity} | ${description}`);
        
        try {
            const log = await prisma.securityLog.create({
                data: {
                    ip,
                    event,
                    severity,
                    description,
                    userAgent,
                    userId
                }
            });

            // ── Broadcast to all live SSE dashboard connections ──────────────
            broadcastSecurityEvent({ ...log, createdAt: log.createdAt.toISOString() });

            // If severity is HIGH or CRITICAL, automatically block the IP for 2 hours
            if (severity === "HIGH" || severity === "CRITICAL") {
                const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours duration
                await this.blockIp(ip, `Automated IDS block: triggered ${severity} event (${event})`, expiresAt);
            }

            return log;
        } catch (err) {
            console.error("[IDS] Failed to write security log to DB:", err.message);
        }
    }

    /**
     * Blocks an IP address.
     */
    async blockIp(ip, reason, expiresAt = null) {
        try {
            console.log(`\x1b[31m[IDS BLOCK]\x1b[0m Blocking IP: ${ip} | Reason: ${reason} | Expires: ${expiresAt || "Permanent"}`);
            return await prisma.blockedIp.upsert({
                where: { ip },
                update: { reason, expiresAt, createdAt: new Date() },
                create: { ip, reason, expiresAt }
            });
        } catch (err) {
            console.error("[IDS] Failed to block IP:", err.message);
        }
    }

    /**
     * Unblocks an IP address.
     */
    async unblockIp(ip) {
        try {
            console.log(`\x1b[32m[IDS UNBLOCK]\x1b[0m Unblocking IP: ${ip}`);
            return await prisma.blockedIp.delete({
                where: { ip }
            });
        } catch (err) {
            console.error("[IDS] Failed to unblock IP:", err.message);
        }
    }

    /**
     * Checks if an IP is currently blocked. Clean up expired blocks on check.
     */
    async isIpBlocked(ip) {
        try {
            // Clean up any expired IP blocks first
            await prisma.blockedIp.deleteMany({
                where: {
                    expiresAt: { lt: new Date() }
                }
            });

            const block = await prisma.blockedIp.findUnique({
                where: { ip }
            });

            return block ? { blocked: true, reason: block.reason, expiresAt: block.expiresAt } : { blocked: false };
        } catch (err) {
            console.error("[IDS] Failed to verify IP block state:", err.message);
            return { blocked: false };
        }
    }
}

export default new SecurityServices();
