const axios = require("axios");

const BASE_URL = "http://localhost:3000";

async function runTest() {
  console.log("1. Logging in as Admin...");
  const loginRes = await axios.post(`${BASE_URL}/api/auth/signin`, {
    email: "1@gmail.com",
    password: "password123",
  });

  const cookie = loginRes.headers["set-cookie"]?.[0]?.split(";")[0];
  if (!cookie) {
    throw new Error("No token cookie returned");
  }
  console.log("Token cookie retrieved:", cookie);

  const headers = { Cookie: cookie };

  console.log("2. Fetching current settings from GET /api/settings...");
  const settingsRes1 = await axios.get(`${BASE_URL}/api/settings`, { headers });
  console.log("Current enableRefundRequests in response:", settingsRes1.data.settings.enableRefundRequests);

  const targetVal = !settingsRes1.data.settings.enableRefundRequests;
  console.log(`3. Updating settings via PUT /api/settings to enableRefundRequests=${targetVal}...`);
  
  const updatedSettings = {
    ...settingsRes1.data.settings,
    enableRefundRequests: targetVal,
  };

  const putRes = await axios.put(`${BASE_URL}/api/settings`, updatedSettings, { headers });
  console.log("PUT status:", putRes.status, "Success:", putRes.data.success);

  console.log("4. Fetching /api/auth/me to see if change has reflected...");
  const meRes = await axios.get(`${BASE_URL}/api/auth/me`, { headers });
  console.log("System Settings returned by /api/auth/me:", meRes.data.user?.systemSettings);
  console.log("Reflected enableRefundRequests value:", meRes.data.user?.systemSettings?.enableRefundRequests);

  if (meRes.data.user?.systemSettings?.enableRefundRequests === targetVal) {
    console.log("SUCCESS: /api/auth/me settings updated immediately!");
  } else {
    console.log("FAILURE: /api/auth/me settings are still cached!");
  }
}

runTest().catch((err) => {
  console.error("Test failed:", err.message, err.response?.data || "");
});
