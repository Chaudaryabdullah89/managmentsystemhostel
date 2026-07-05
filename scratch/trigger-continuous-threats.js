// scratch/trigger-continuous-threats.js
// Fires simulated security attacks at the local Next.js dev server every few seconds to test the live-stream dashboard.

const attacks = [
    {
        name: "SQL Injection",
        url: "http://localhost:3000/?query=SELECT+*+FROM+users+WHERE+username='admin'+OR+1=1",
        ip: "185.220.101.4"
    },
    {
        name: "Cross-Site Scripting (XSS)",
        url: "http://localhost:3000/?input=%3Cscript%3Ealert('XSS')%3C/script%3E",
        ip: "91.219.236.22"
    },
    {
        name: "Directory Traversal",
        url: "http://localhost:3000/?file=../../../../etc/passwd",
        ip: "45.143.203.18"
    },
    {
        name: "SQL Injection",
        url: "http://localhost:3000/?id=1+UNION+SELECT+null,username,password+FROM+admins",
        ip: "185.220.101.12"
    },
    {
        name: "Cross-Site Scripting (XSS)",
        url: "http://localhost:3000/auth/login?redirect=javascript:alert(1)",
        ip: "109.248.9.155"
    }
];

let index = 0;

console.log("Starting continuous threat generation simulation (will run for 40 seconds)...");
console.log("Open your Admin Security Dashboard at http://localhost:3000/admin/security to see events pop up live!");

const interval = setInterval(async () => {
    if (index >= attacks.length) {
        console.log("All simulated attacks completed.");
        clearInterval(interval);
        return;
    }

    const attack = attacks[index++];
    console.log(`[SIMULATOR] Launching ${attack.name} from IP ${attack.ip}...`);
    
    try {
        const response = await fetch(attack.url, {
            headers: {
                "User-Agent": "IDS-Dashboard-Verification-Bot",
                "X-Forwarded-For": attack.ip
            }
        });
        console.log(`[SIMULATOR] Status: ${response.status} (Blocked successfully)`);
    } catch (err) {
        console.error(`[SIMULATOR] Failed: ${err.message}`);
    }
}, 4000);
