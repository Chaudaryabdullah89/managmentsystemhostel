const { getSystemSettings } = require("./lib/permissions.js");
const { prisma } = require("./lib/prisma.js");
const { revalidateTag } = require("next/cache");

async function testCache() {
  console.log("1. Fetching current cached settings...");
  const s1 = await getSystemSettings();
  console.log("Cached enableRefundRequests:", s1.enableRefundRequests);

  const targetVal = !s1.enableRefundRequests;
  console.log(`2. Updating DB enableRefundRequests to ${targetVal}...`);
  await prisma.systemSettings.upsert({
    where: { id: "global" },
    update: { enableRefundRequests: targetVal },
    create: { id: "global", enableRefundRequests: targetVal },
  });

  console.log("3. Revalidating tag 'settings'...");
  revalidateTag("settings");

  console.log("4. Fetching settings again...");
  const s2 = await getSystemSettings();
  console.log("New enableRefundRequests:", s2.enableRefundRequests);

  if (s2.enableRefundRequests === targetVal) {
    console.log("SUCCESS: Cache was successfully invalidated and updated!");
  } else {
    console.log("FAILURE: Cache returned old value!");
  }
}

testCache().catch(console.error);
