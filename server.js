// server.js
// Root entry point for Hostinger Node.js Web App deployment

console.log("🚀 Starting Bhopal Real Estate application...");

const PORT = process.env.PORT || 5000;

// Import server setup from server/index.js
const app = require("./server/index.js");

// Start the server (only needed if not being run by server/index.js directly)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✅ Server listening on port ${PORT}`);
  });
}
