// scratch/test-1bill-endpoints.js
// Run this script to test the 1Bill Enquiry and Webhook endpoints locally.
// Usage: node scratch/test-1bill-endpoints.js

const http = require('http');

const PORT = 3000;
const API_KEY = "daf80c8a3c4be9e1760617bab8b2f134";
const SECRET = "64909ce0a8c322ce2d0c68c16d837df4";
// Replace this with a generated invoice number from your database or terminal log
const TEST_INVOICE_ID = "100123549660976678"; 

console.log("\x1b[36m=== Starting 1Link 1Bill Local Integration Tests ===\x1b[0m\n");

// Helper function to send requests
function makeRequest(path, payload) {
    return new Promise((resolve, reject) => {
        const bodyData = JSON.stringify(payload);
        const options = {
            hostname: 'localhost',
            port: PORT,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(bodyData),
                'Authorization': `Bearer ${API_KEY}`
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    body: data ? JSON.parse(data) : {}
                });
            });
        });

        req.on('error', (err) => reject(err));
        req.write(bodyData);
        req.end();
    });
}

async function runTests() {
    try {
        // Test 1: Bill Enquiry (Simulates customer searching invoice in banking app)
        console.log(`[TEST 1] Sending Bill Enquiry for Invoice: "${TEST_INVOICE_ID}"...`);
        const enquiryPayload = {
            ConsumerNumber: TEST_INVOICE_ID,
            username: API_KEY
        };
        
        const enquiryResult = await makeRequest('/api/payments/onebill-enquiry', enquiryPayload);
        console.log(`Response Code: ${enquiryResult.statusCode}`);
        console.log("Response Body:", JSON.stringify(enquiryResult.body, null, 2));
        
        if (enquiryResult.body.ResponseCode === "00") {
            console.log("\x1b[32m✔ Test 1 passed: Bill details fetched successfully!\x1b[0m\n");
        } else {
            console.log("\x1b[31m✘ Test 1 failed: " + (enquiryResult.body.ResponseMessage || "Unknown error") + "\x1b[0m\n");
        }

        // Test 2: Webhook Payment Confirmation (Simulates customer completing payment)
        console.log(`[TEST 2] Sending Webhook Payment Notification...`);
        const webhookPayload = {
            consumerNumber: TEST_INVOICE_ID,
            transactionAuthID: "TXN-" + Math.floor(Math.random() * 100000000),
            transactionAmount: enquiryResult.body.BillAmount || "22000.00",
            responseCode: "00",
            bankMnemonic: "HBL",
            username: API_KEY,
            secret: SECRET
        };

        const webhookResult = await makeRequest('/api/payments/onebill-webhook', webhookPayload);
        console.log(`Response Code: ${webhookResult.statusCode}`);
        console.log("Response Body:", JSON.stringify(webhookResult.body, null, 2));

        if (webhookResult.body.success) {
            console.log("\x1b[32m✔ Test 2 passed: Payment successfully recorded & set to PAID!\x1b[0m\n");
        } else {
            console.log("\x1b[31m✘ Test 2 failed: " + (webhookResult.body.message || "Unknown error") + "\x1b[0m\n");
        }

    } catch (err) {
        console.error("\x1b[31m❌ Error during tests:\x1b[0m", err.message);
        console.log("Please make sure your dev server is running on localhost:3000.");
    }
}

runTests();
