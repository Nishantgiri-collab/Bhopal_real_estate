// server.js
// Root entry point for Hostinger Node.js Web App deployment
console.log("🚀 Starting Bhopal Real Estate application from root entry point...");
const frontendDistPath = path.join(__dirname, 'dist');
require("./server/index.js");

const path = require('path');
const sqlite3 = require('sqlite3').verbose();
// Point to your DB file inside server/data
const dbPath = path.resolve(__dirname, 'data', 'realestate.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite DB:', err.message);
  } else {
    console.log('Connected to SQLite database at', dbPath);
  }
});