const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const twilio = require('twilio');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '5mb' }));

// ─── Serve Frontend Build (React dist folder) ─────────────────────────────────
const frontendDistPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  console.log(`✅ Frontend serving enabled from: ${frontendDistPath}`);
} else {
  console.warn(`⚠️  Frontend dist folder not found at: ${frontendDistPath}`);
}

// ─── SQLite Connection & Initialization ───────────────────────────────────────
const dbPath = path.join(__dirname, 'data', 'realestate.db');
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ SQLite connection error:', err.message);
  } else {
    console.log('✅ Connected to SQLite database:', dbPath);
    initializeDatabase();
  }
});

// Helper to parse SQLite property rows
function parsePropertyRow(row) {
  if (!row) return null;
  const parseJsonArray = (value) => {
    try {
      const parsed = JSON.parse(value || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  return {
    ...row,
    isSold: row.isSold === 1,
    isApproved: row.isApproved === 1,
    isAiMatch: row.isAiMatch === 1,
    isLiked: row.isLiked === 1,
    images: parseJsonArray(row.images),
    amenities: parseJsonArray(row.amenities)
  };
}

const INITIAL_PROPERTIES = [
  { 
    id: 1, title: "Emaar Luxury Villas", location: "Arera Colony, Bhopal", price: "2.5 Cr", priceNumeric: 250, beds: 4, baths: 4, sqft: 3500, type: "villa", isSold: 0, isApproved: 1,
    image: "https://images.unsplash.com/photo-1613490908592-fd5e23f572f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", 
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1613490908592-fd5e23f572f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ]),
    isAiMatch: 1, matchScore: 98, isLiked: 1,
    description: "Experience ultra-luxury living in the heart of Arera Colony. This magnificent villa features state-of-the-art smart home technology, a private pool, and imported Italian marble flooring. Perfect for those who seek the finest things in life.",
    amenities: JSON.stringify(["Private Pool", "Smart Home System", "Italian Marble", "2 Car Parking", "Servant Quarter", "24/7 Security", "Clubhouse Access"]),
    ownerName: "Rahul Sharma", ownerPhone: "+91 98765 43210",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },
  { 
    id: 2, title: "Skyline Apartments", location: "Bawadiya Kalan, Bhopal", price: "85 Lacs", priceNumeric: 85, beds: 3, baths: 2, sqft: 1800, type: "apartment", isSold: 0, isApproved: 1,
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", 
    images: JSON.stringify(["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"]),
    isAiMatch: 1, matchScore: 92, isLiked: 0,
    description: "A premium 3BHK apartment offering a spectacular view of the city skyline. Comes with fully furnished modular kitchen and central air conditioning.",
    amenities: JSON.stringify(["Gymnasium", "Swimming Pool", "Modular Kitchen", "Power Backup", "Park View"]),
    ownerName: "Priya Patel", ownerPhone: "+91 87654 32109",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },
  { 
    id: 3, title: "Greenwood Estate Plot", location: "Kolar Road, Bhopal", price: "45 Lacs", priceNumeric: 45, beds: 0, baths: 0, sqft: 1200, type: "plot", isSold: 0, isApproved: 1,
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", 
    images: JSON.stringify(["https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"]),
    isAiMatch: 0, matchScore: null, isLiked: 0,
    description: "A prime residential plot situated in a rapidly developing gated community on Kolar Road. Ready for immediate construction with all necessary approvals.",
    amenities: JSON.stringify(["Gated Community", "Water Supply", "Paved Roads", "Street Lighting"]),
    ownerName: "Amit Verma", ownerPhone: "+91 76543 21098"
  },
  { 
    id: 4, title: "Shalimar Oasis", location: "Hoshangabad Road, Bhopal", price: "1.2 Cr", priceNumeric: 120, beds: 3, baths: 3, sqft: 2200, type: "villa", isSold: 0, isApproved: 1,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", 
    images: JSON.stringify(["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"]),
    isAiMatch: 1, matchScore: 85, isLiked: 1,
    description: "A beautiful independent house with modern architecture. Features a private garden and ample natural light throughout the day.",
    amenities: JSON.stringify(["Private Garden", "Vastu Compliant", "Corner Property", "Visitor Parking"]),
    ownerName: "Sunita Gupta", ownerPhone: "+91 65432 10987",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },
  { 
    id: 5, title: "Lakeview Residencies", location: "Shamla Hills, Bhopal", price: "3.5 Cr", priceNumeric: 350, beds: 5, baths: 5, sqft: 4500, type: "villa", isSold: 0, isApproved: 1,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", 
    images: JSON.stringify(["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"]),
    isAiMatch: 1, matchScore: 99, isLiked: 0,
    description: "An ultra-premium property in the VIP area of Shamla Hills offering uninterrupted views of the Upper Lake. Designed by renowned architects.",
    amenities: JSON.stringify(["Lake View", "Private Elevator", "Home Theatre", "Jacuzzi", "Central AC"]),
    ownerName: "Rajesh Joshi", ownerPhone: "+91 99887 76655"
  },
  { 
    id: 6, title: "Comfort Homes", location: "Ayodhya Bypass, Bhopal", price: "60 Lacs", priceNumeric: 60, beds: 2, baths: 2, sqft: 1100, type: "apartment", isSold: 0, isApproved: 1,
    image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", 
    images: JSON.stringify(["https://images.unsplash.com/photo-1484154218962-a197022b5858?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"]),
    isAiMatch: 0, matchScore: null, isLiked: 0,
    description: "An affordable yet luxurious 2BHK flat ideal for small families. Strategically located near major schools and hospitals on Ayodhya Bypass.",
    amenities: JSON.stringify(["Kids Play Area", "Covered Parking", "24/7 Water", "Proximity to Highway"]),
    ownerName: "Deepak Chouhan", ownerPhone: "+91 88776 65544"
  }
];

function initializeDatabase() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS properties (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        location TEXT NOT NULL,
        price TEXT NOT NULL,
        priceNumeric REAL NOT NULL,
        beds INTEGER NOT NULL,
        baths INTEGER NOT NULL,
        sqft INTEGER NOT NULL,
        type TEXT NOT NULL,
        isSold INTEGER DEFAULT 0,
        isApproved INTEGER DEFAULT 0,
        image TEXT NOT NULL,
        images TEXT NOT NULL,
        isAiMatch INTEGER DEFAULT 0,
        matchScore INTEGER,
        isLiked INTEGER DEFAULT 0,
        description TEXT,
        amenities TEXT NOT NULL,
        ownerName TEXT NOT NULL,
        ownerPhone TEXT NOT NULL,
        ownerEmail TEXT,
        videoUrl TEXT,
        listingType TEXT
      )
    `, (err) => {
      if (err) console.error('❌ Error creating properties table:', err.message);
      else {
        console.log('✅ SQLite properties table ready');
        ensurePropertyColumns(migrateProperties);
      }
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS owner_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        propertyId TEXT NOT NULL,
        propertyTitle TEXT DEFAULT '',
        ownerPhone TEXT DEFAULT '',
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('❌ Error creating owner_requests table:', err.message);
      else {
        console.log('✅ SQLite owner_requests table ready');
        ensureOwnerRequestColumns(migrateOwnerRequests);
      }
    });
  });
}

function ensureColumns(tableName, columns, done) {
  db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
    if (err) {
      console.error(`Error reading ${tableName} schema:`, err.message);
      return done?.();
    }

    const existing = new Set(rows.map(row => row.name));
    const missing = Object.entries(columns).filter(([name]) => !existing.has(name));
    if (missing.length === 0) return done?.();

    let remaining = missing.length;
    for (const [name, definition] of missing) {
      db.run(`ALTER TABLE ${tableName} ADD COLUMN ${name} ${definition}`, (alterErr) => {
        if (alterErr) {
          console.error(`Error adding ${tableName}.${name}:`, alterErr.message);
        } else {
          console.log(`Added missing SQLite column ${tableName}.${name}`);
        }

        remaining -= 1;
        if (remaining === 0) done?.();
      });
    }
  });
}

function ensurePropertyColumns(done) {
  ensureColumns('properties', {
    ownerEmail: 'TEXT DEFAULT ""',
    videoUrl: 'TEXT DEFAULT ""',
    listingType: 'TEXT DEFAULT ""'
  }, done);
}

function ensureOwnerRequestColumns(done) {
  ensureColumns('owner_requests', {
    propertyTitle: 'TEXT DEFAULT ""',
    ownerPhone: 'TEXT DEFAULT ""'
  }, done);
}

function migrateProperties() {
  db.get('SELECT COUNT(*) as count FROM properties', (err, row) => {
    if (err) return console.error('Error checking properties count:', err.message);
    if (row.count === 0) {
      console.log('🌱 Seeding initial properties to SQLite properties table...');
      const stmt = db.prepare(`
        INSERT INTO properties (
          id, title, location, price, priceNumeric, beds, baths, sqft, type,
          isSold, isApproved, image, images, isAiMatch, matchScore, isLiked,
          description, amenities, ownerName, ownerPhone, ownerEmail, videoUrl, listingType
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const p of INITIAL_PROPERTIES) {
        stmt.run(
          p.id, p.title, p.location, p.price, p.priceNumeric, p.beds, p.baths, p.sqft, p.type,
          p.isSold, p.isApproved, p.image, p.images, p.isAiMatch, p.matchScore, p.isLiked,
          p.description, p.amenities, p.ownerName, p.ownerPhone, p.ownerEmail || '', p.videoUrl || '', p.listingType || ''
        );
      }
      stmt.finalize((err) => {
        if (err) console.error('❌ Error seeding properties:', err.message);
        else console.log('✅ Seeded initial properties successfully.');
      });
    }
  });
}

function migrateOwnerRequests() {
  db.get('SELECT COUNT(*) as count FROM owner_requests', (err, row) => {
    if (err) return console.error('Error checking owner_requests count:', err.message);
    if (row.count === 0) {
      const backupFile = path.join(__dirname, 'data', 'ownerRequests.json');
      if (fs.existsSync(backupFile)) {
        try {
          const raw = fs.readFileSync(backupFile, 'utf8');
          const data = JSON.parse(raw);
          if (Array.isArray(data) && data.length > 0) {
            console.log('🌱 Migrating ' + data.length + ' existing owner requests from JSON file to SQLite...');
            const stmt = db.prepare(`
              INSERT INTO owner_requests (name, phone, email, propertyId, propertyTitle, ownerPhone, timestamp)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
            for (const r of data) {
              stmt.run(r.name, r.phone, r.email, r.propertyId, r.propertyTitle || '', r.ownerPhone || '', r.createdAt || new Date().toISOString());
            }
            stmt.finalize((err) => {
              if (err) console.error('❌ Error migrating owner requests:', err.message);
              else console.log('✅ Migrated existing owner requests successfully.');
            });
          }
        } catch (e) {
          console.error('❌ Failed to migrate owner requests JSON:', e.message);
        }
      }
    }
  });
}

// ─── In-memory OTP Store (otpStore[sessionKey] = { otp, expiresAt }) ─────────
const otpStore = {};

function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

function storeOTP(key, otp, ttlMs = 5 * 60 * 1000) {
  otpStore[key] = { otp, expiresAt: Date.now() + ttlMs };
}

function verifyOTP(key, inputOtp) {
  const record = otpStore[key];
  if (!record) return { valid: false, reason: 'OTP not found. Please request a new one.' };
  if (Date.now() > record.expiresAt) {
    delete otpStore[key];
    return { valid: false, reason: 'OTP has expired. Please request a new one.' };
  }
  if (record.otp !== inputOtp.trim()) {
    return { valid: false, reason: 'Incorrect OTP. Please try again.' };
  }
  delete otpStore[key];
  return { valid: true };
}

// ─── Twilio Client ────────────────────────────────────────────────────────────
let twilioClient = null;
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID !== 'your_twilio_account_sid_here') {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('✅ Twilio client initialized');
  } else {
    console.warn('⚠️  Twilio credentials not set — SMS/WhatsApp will run in mock mode');
  }
} catch (err) {
  console.error('❌ Twilio init error:', err.message);
}

// ─── Nodemailer (Gmail) Transporter ──────────────────────────────────────────
let mailTransporter = null;
try {
  const gmailUser = (process.env.GMAIL_USER || '').trim();
  const gmailAppPassword = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');

  if (gmailUser && gmailAppPassword && gmailAppPassword !== 'xxxxxxxxxxxxxxxx') {
    mailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });
    console.log('✅ Gmail transporter initialized');
  } else {
    console.warn('Gmail credentials not set - Email OTP is disabled until Gmail is configured');
  }
  const logFile = path.join(__dirname, '..', 'server.log');
function log(message) {
  const line = `${new Date().toISOString()} - ${message}\n`;
  try { fs.appendFileSync(logFile, line); } catch (_) {}
}

process.on('uncaughtException', (err) => {
  console.error('🚨 Uncaught Exception:', err);
  log(`Uncaught Exception: ${err.stack || err}`);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  log(`Unhandled Rejection: ${reason}`);
});

// ─── SPA Fallback Route ──────────────────────────────────────────────────────
// Serve index.html for all unknown routes (for React Router)
app.get('*', (req, res) => {
  const indexPath = path.join(frontendDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// Export app for use in server.js
module.exports = app;

// Only listen if this file is run directly (not when required)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🚀 Bhopal Estates Server running on http://localhost:${PORT}`);
    console.log(`   SQLite   → ${dbPath}`);
    console.log(`   Twilio   → ${twilioClient ? 'Active' : 'Mock mode'}`);
    console.log(`   Gmail    → ${mailTransporter ? 'Active' : 'Not configured'}\n`);
    log('Server started successfully');
  });
}
} catch (err) {
  console.error('❌ Nodemailer init error:', err.message);
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROPERTY ENDPOINTS (SQLite)
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/api/properties', (req, res) => {
  db.all('SELECT * FROM properties ORDER BY id DESC', [], (err, rows) => {
    if (err) {
      console.error('Error fetching properties from SQLite:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    const parsedListings = rows.map(row => parsePropertyRow(row));
    res.json(parsedListings);
  });
});

app.post('/api/properties', (req, res) => {
  const {
    id, title, location, price, priceNumeric, beds, baths, sqft, type,
    isSold, isApproved, image, images, isAiMatch, matchScore, isLiked,
    description, amenities, ownerName, ownerPhone, ownerEmail, videoUrl, listingType
  } = req.body;

  const propId = id || Date.now();

  db.run(`
    INSERT INTO properties (
      id, title, location, price, priceNumeric, beds, baths, sqft, type,
      isSold, isApproved, image, images, isAiMatch, matchScore, isLiked,
      description, amenities, ownerName, ownerPhone, ownerEmail, videoUrl, listingType
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    propId, title, location, price, priceNumeric, beds, baths, sqft, type,
    isSold ? 1 : 0, isApproved ? 1 : 0, image, JSON.stringify(images || []),
    isAiMatch ? 1 : 0, matchScore, isLiked ? 1 : 0,
    description, JSON.stringify(amenities || []), ownerName, ownerPhone, ownerEmail || '', videoUrl || '', listingType || ''
  ], function (err) {
    if (err) {
      console.error('Error inserting property to SQLite:', err.message);
      return res.status(500).json({ error: 'Failed to insert property' });
    }
    db.get('SELECT * FROM properties WHERE id = ?', [propId], (err, row) => {
      if (err || !row) return res.status(500).json({ error: 'Failed to retrieve inserted property' });
      res.status(201).json(parsePropertyRow(row));
    });
  });
});

app.patch('/api/properties/:id', (req, res) => {
  const id = Number(req.params.id);
  const fields = req.body;
  const allowedFields = new Set([
    'title', 'location', 'price', 'priceNumeric', 'beds', 'baths', 'sqft', 'type',
    'isSold', 'isApproved', 'image', 'images', 'isAiMatch', 'matchScore', 'isLiked',
    'description', 'amenities', 'ownerName', 'ownerPhone', 'ownerEmail', 'videoUrl', 'listingType'
  ]);
  const keys = Object.keys(fields).filter(key => allowedFields.has(key));
  if (keys.length === 0) return res.status(400).json({ error: 'No fields to update' });

  const sets = [];
  const values = [];
  for (const key of keys) {
    sets.push(`${key} = ?`);
    let val = fields[key];
    if (typeof val === 'boolean') val = val ? 1 : 0;
    if (Array.isArray(val)) val = JSON.stringify(val);
    values.push(val);
  }
  values.push(id);

  db.run(`
    UPDATE properties SET ${sets.join(', ')} WHERE id = ?
  `, values, function (err) {
    if (err) {
      console.error('Error updating property in SQLite:', err.message);
      return res.status(500).json({ error: 'Failed to update property' });
    }
    if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
    db.get('SELECT * FROM properties WHERE id = ?', [id], (err, row) => {
      if (err || !row) return res.status(500).json({ error: 'Failed to retrieve updated property' });
      res.json(parsePropertyRow(row));
    });
  });
});

app.delete('/api/properties/:id', (req, res) => {
  const id = Number(req.params.id);
  db.run('DELETE FROM properties WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('Error deleting property in SQLite:', err.message);
      return res.status(500).json({ error: 'Failed to delete property' });
    }
    if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// OWNER REQUEST — Save lead to SQLite
// ═══════════════════════════════════════════════════════════════════════════════

app.post('/api/owner-request', (req, res) => {
  const { name, phone, email, propertyId, propertyTitle, ownerPhone } = req.body;
  if (!name || !phone || !email || !propertyId) {
    return res.status(400).json({ error: 'name, phone, email, and propertyId are required.' });
  }
  
  db.run(`
    INSERT INTO owner_requests (name, phone, email, propertyId, propertyTitle, ownerPhone, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [name, phone, email, propertyId, propertyTitle || '', ownerPhone || '', new Date().toISOString()], function (err) {
    if (err) {
      console.error('Error saving owner request to SQLite:', err.message);
      return res.status(500).json({ error: 'Failed to save request.' });
    }
    console.log(`📋 Owner request saved to SQLite: ${name} (${email}) for property ${propertyId}`);
    res.status(201).json({ success: true, requestId: this.lastID });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFY OWNER via WhatsApp
// ═══════════════════════════════════════════════════════════════════════════════

app.post('/api/notify-owner', async (req, res) => {
  try {
    const { ownerPhone, userName, userPhone, userEmail, propertyTitle } = req.body;
    if (!ownerPhone) return res.status(400).json({ error: 'ownerPhone is required.' });

    const cleanPhone = ownerPhone.replace(/[^0-9]/g, '');
    const toWhatsApp = `whatsapp:+${cleanPhone}`;
    const fromWhatsApp = `whatsapp:${process.env.TWILIO_PHONE}`;

    const messageBody =
      `🏠 *New Interest in Your Property*\n\n` +
      `Property: *${propertyTitle || 'Your listed property'}*\n\n` +
      `A potential buyer has requested your details:\n` +
      `👤 Name: ${userName}\n` +
      `📞 Phone: ${userPhone}\n` +
      `📧 Email: ${userEmail}\n\n` +
      `Please reach out to them at your earliest convenience.`;

    if (twilioClient) {
      await twilioClient.messages.create({ body: messageBody, from: fromWhatsApp, to: toWhatsApp });
      console.log(`📲 WhatsApp notification sent to owner: ${ownerPhone}`);
      res.json({ success: true, message: 'WhatsApp notification sent to owner.' });
    } else {
      console.log(`[MOCK] WhatsApp to ${ownerPhone}: ${messageBody}`);
      res.json({ success: true, mock: true, message: 'Mock mode: Twilio not configured. See server logs.' });
    }
  } catch (err) {
    console.error('Error notifying owner:', err.message);
    res.status(500).json({ error: 'Failed to send WhatsApp notification.', details: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SMS OTP — Send
// ═══════════════════════════════════════════════════════════════════════════════

app.post('/api/send-otp/sms', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'phone is required.' });

    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const fullPhone = cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone}`;
    const otp = generateOTP();
    storeOTP(`sms:${cleanPhone}`, otp);

    if (twilioClient) {
      await twilioClient.messages.create({
        body: `Your Bhopal Estates verification code is: ${otp}. Valid for 5 minutes. Do not share with anyone.`,
        from: process.env.TWILIO_PHONE,
        to: fullPhone,
      });
      console.log(`📱 SMS OTP sent to ${fullPhone}`);
      res.json({ success: true, message: 'OTP sent via SMS.' });
    } else {
      console.log(`[MOCK] SMS OTP for ${fullPhone}: ${otp}`);
      res.json({ success: true, mock: true, otp, message: `Mock mode: OTP is ${otp} (shown only because Twilio is not configured).` });
    }
  } catch (err) {
    console.error('Error sending SMS OTP:', err.message);
    res.status(500).json({ error: 'Failed to send SMS OTP.', details: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SMS OTP — Verify
// ═══════════════════════════════════════════════════════════════════════════════

app.post('/api/verify-otp/sms', (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ error: 'phone and otp are required.' });
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const result = verifyOTP(`sms:${cleanPhone}`, otp);
  if (result.valid) {
    console.log(`✅ SMS OTP verified for ${cleanPhone}`);
    res.json({ success: true, message: 'Mobile OTP verified successfully.' });
  } else {
    res.status(400).json({ success: false, error: result.reason });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL OTP — Send
// ═══════════════════════════════════════════════════════════════════════════════

app.post('/api/send-otp/email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email is required.' });
    if (!mailTransporter) {
      return res.status(503).json({
        error: 'Email OTP is not configured. Set GMAIL_USER and a real GMAIL_APP_PASSWORD in server/.env, then restart the backend.'
      });
    }

    const otp = generateOTP();
    storeOTP(`email:${email.toLowerCase()}`, otp);

    if (mailTransporter) {
      await mailTransporter.sendMail({
        from: `"Bhopal Estates" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: '🏠 Bhopal Estates — Email Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; border-radius: 12px; background: #f9f9f9; border: 1px solid #e0e0e0;">
            <h2 style="color: #1a1a2e; margin-bottom: 8px;">Email Verification</h2>
            <p style="color: #555; margin-bottom: 24px;">Use the code below to verify your email address on Bhopal Estates.</p>
            <div style="font-size: 40px; font-weight: 700; letter-spacing: 12px; text-align: center; color: #6c63ff; background: #ededff; padding: 20px; border-radius: 8px;">${otp}</div>
            <p style="color: #888; font-size: 13px; margin-top: 24px;">This code is valid for <strong>5 minutes</strong>. Do not share it with anyone.</p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">
            <p style="color: #aaa; font-size: 12px;">If you didn't request this, please ignore this email.</p>
          </div>
        `,
      });
      console.log(`📧 Email OTP sent to ${email}`);
      res.json({ success: true, message: 'OTP sent to your email.' });
    }
  } catch (err) {
    console.error('Error sending Email OTP:', err.message);
    res.status(500).json({ error: 'Failed to send Email OTP.', details: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL OTP — Verify
// ═══════════════════════════════════════════════════════════════════════════════

app.post('/api/verify-otp/email', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'email and otp are required.' });
  const result = verifyOTP(`email:${email.toLowerCase()}`, otp);
  if (result.valid) {
    console.log(`✅ Email OTP verified for ${email}`);
    res.json({ success: true, message: 'Email OTP verified successfully.' });
  } else {
    res.status(400).json({ success: false, error: result.reason });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SERVE STATIC FILES (PRODUCTION)
// ═══════════════════════════════════════════════════════════════════════════════

const frontendDistPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(frontendDistPath)) {
  console.log(`📦 Serving static frontend files from: ${frontendDistPath}`);
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res) => {
    if (req.originalUrl.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handling to capture uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('🚨 Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
});
