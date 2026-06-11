const { GET } = require('../app/api/(Backend)/guest/dashboard/route.js');
const { requireAuth } = require('../lib/apiAuth');

console.log("Checking API module imports and structure...");
if (typeof GET === 'function') {
  console.log("GET handler is exported successfully.");
} else {
  console.error("GET handler is NOT exported!");
  process.exit(1);
}
console.log("Success.");
