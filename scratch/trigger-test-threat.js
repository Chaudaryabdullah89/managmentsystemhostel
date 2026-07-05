// scratch/trigger-test-threat.js
// Script to seed security logs in the database and hit local server to verify IDS middleware interception.

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    console.log("1. Seeding mock threat logs in database...");
    
    // Clean up old threat logs to start fresh
    await prisma.securityLog.deleteMany({});
    
    const logs = [
        {
            ip: "198.51.100.42",
            event: "SQL_INJECTION",
            severity: "HIGH",
            description: "Payload matched SQL injection pattern: UNION SELECT username, password FROM users",
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        },
        {
            ip: "203.0.113.15",
            event: "XSS_ATTEMPT",
            severity: "CRITICAL",
            description: "Payload matched XSS pattern: <script>alert(document.cookie)</script>",
            userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
        },
        {
            ip: "192.0.2.88",
            event: "PATH_TRAVERSAL",
            severity: "HIGH",
            description: "Payload matched directory traversal signature: ../../../etc/passwd",
            userAgent: "curl/7.68.0"
        },
        {
            ip: "198.51.100.42",
            event: "SQL_INJECTION",
            severity: "MEDIUM",
            description: "Suspicious SQL syntax signature detected in query parameters",
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        },
        {
            ip: "192.0.2.10",
            event: "RATE_LIMIT",
            severity: "LOW",
            description: "IP exceeded rate limit thresholds on auth endpoints",
            userAgent: "Mozilla/5.0 (Linux; Android 10)"
        }
    ];

    for (const log of logs) {
        await prisma.securityLog.create({ data: log });
    }
    console.log("Mock threat logs seeded successfully!");

    console.log("\n2. Triggering actual middleware threat detection...");
    const url = "http://localhost:3000/?test_sqli=UNION+SELECT+1,2,3";
    console.log(`Sending simulated attack request to: ${url}`);
    
    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "IDS-Verification-Test-Agent",
                "X-Forwarded-For": "185.220.101.44"
            }
        });
        
        console.log(`Response Status: ${response.status}`);
        const text = await response.text();
        if (text.includes("Request Blocked") || response.status === 403) {
            console.log("SUCCESS: Middleware successfully detected the attack and blocked the request!");
        } else {
            console.log("WARNING: Request was not blocked. Ensure your Next.js dev server is running on localhost:3000 and middleware is active.");
        }
    } catch (err) {
        console.error("Failed to make request to local server:", err.message);
        console.log("Please ensure the Next.js application is running at http://localhost:3000");
    }

    await prisma.$disconnect();
}

run();
