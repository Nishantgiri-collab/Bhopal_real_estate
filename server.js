const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 5000;

const dbPath = path.resolve(__dirname, process.env.SQLITE_DB || 'data/realestate.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('❌ Failed to connect:', err.message);
  else console.log('✅ Connected to SQLite at', dbPath);
});

app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
