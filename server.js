// server.js
// Root entry point for Hostinger Node.js Web App deployment
console.log("🚀 Server starting...");

const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ SQLite connection
const dbPath = path.resolve(__dirname, process.env.SQLITE_DB || 'data/realestate.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Failed to connect to SQLite DB:', err.message);
  } else {
    console.log('✅ Connected to SQLite database at', dbPath);
  }
});

// Example table creation
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    price INTEGER
  )`);
});

// ✅ Middleware
app.use(express.json());

// ✅ API route example
app.get('/api/properties', (req, res) => {
  db.all("SELECT * FROM properties", [], (err, rows) => {
    if (err) {
      console.error("DB error:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// ✅ Serve frontend build
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
