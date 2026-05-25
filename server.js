// server.js
// Root entry point for Hostinger Node.js Web App deployment

import('./server/index.js').then(async (module) => {
  const PORT = process.env.PORT || 5000;
  const app = module.default;

  console.log("🚀 Starting Bhopal Real Estate Server...");
  console.log(`📌 Entry point: server.js`);
  console.log(`🔌 Port: ${PORT}`);

  if (!app) {
    console.error("❌ FATAL ERROR: server/index.js did not export app");
    process.exit(1);
  }

  try {
    app.listen(PORT, () => {
      console.log(`✅ Server is now listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ FATAL ERROR: Failed to start server");
    console.error(err);
    process.exit(1);
  }
}).catch((err) => {
  console.error("❌ FATAL ERROR: Failed to load server");
  console.error(err);
  process.exit(1);
});
