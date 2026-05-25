/**
 * Simple JSON-based Database
 * Replaces sqlite3 for Hostinger compatibility
 */

const fs = require('fs');
const path = require('path');

class SimpleDB {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.dbDir = path.dirname(dbPath);
    
    // Ensure data directory exists
    if (!fs.existsSync(this.dbDir)) {
      fs.mkdirSync(this.dbDir, { recursive: true });
    }

    // Initialize data file
    this.dataFile = dbPath.replace('.db', '.json');
    if (!fs.existsSync(this.dataFile)) {
      this.saveData({ properties: [], owner_requests: [] });
    }

    console.log(`✅ JSON Database initialized at: ${this.dataFile}`);
  }

  loadData() {
    try {
      if (fs.existsSync(this.dataFile)) {
        const data = fs.readFileSync(this.dataFile, 'utf8');
        return JSON.parse(data || '{"properties":[],"owner_requests":[]}');
      }
    } catch (err) {
      console.error('Error loading data:', err.message);
    }
    return { properties: [], owner_requests: [] };
  }

  saveData(data) {
    try {
      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error('Error saving data:', err.message);
    }
  }

  // Mimic sqlite3 run() method
  run(sql, params, callback) {
    try {
      const data = this.loadData();

      if (sql.includes('CREATE TABLE')) {
        // Ignore - tables don't need to be created in JSON
        if (callback) callback(null);
        return;
      }

      if (sql.includes('INSERT INTO properties')) {
        const values = params;
        const newProp = {
          id: data.properties.length + 1,
          title: values[0], location: values[1], price: values[2], priceNumeric: values[3],
          beds: values[4], baths: values[5], sqft: values[6], type: values[7],
          image: values[8], images: values[9], isSold: values[10] || 0,
          isApproved: values[11] || 0, isAiMatch: values[12] || 0, matchScore: values[13],
          isLiked: values[14] || 0, description: values[15], amenities: values[16],
          ownerName: values[17], ownerPhone: values[18], videoUrl: values[19],
          timestamp: new Date().toISOString()
        };
        data.properties.push(newProp);
        this.saveData(data);
        if (callback) callback(null);
        return;
      }

      if (sql.includes('INSERT INTO owner_requests')) {
        const newRequest = {
          id: data.owner_requests.length + 1,
          ...Object.fromEntries(
            Object.entries(params).map(([k, v]) => [k.toLowerCase(), v])
          )
        };
        data.owner_requests.push(newRequest);
        this.saveData(data);
        if (callback) callback(null);
        return;
      }

      if (callback) callback(null);
    } catch (err) {
      if (callback) callback(err);
    }
  }

  // Mimic sqlite3 all() method
  all(sql, params, callback) {
    try {
      const data = this.loadData();

      if (sql.includes('SELECT') && sql.includes('FROM properties')) {
        let results = data.properties;
        
        if (sql.includes('WHERE')) {
          // Simple WHERE parsing
          if (sql.includes('isApproved = 1')) {
            results = results.filter(p => p.isApproved === 1);
          }
          if (sql.includes('isSold = 0')) {
            results = results.filter(p => p.isSold === 0);
          }
        }

        if (sql.includes('ORDER BY')) {
          if (sql.includes('isAiMatch DESC')) {
            results = results.sort((a, b) => (b.isAiMatch || 0) - (a.isAiMatch || 0));
          }
        }

        if (callback) callback(null, results);
        return;
      }

      if (sql.includes('SELECT') && sql.includes('FROM owner_requests')) {
        if (callback) callback(null, data.owner_requests);
        return;
      }

      if (callback) callback(null, []);
    } catch (err) {
      if (callback) callback(err, []);
    }
  }

  // Mimic sqlite3 get() method
  get(sql, params, callback) {
    try {
      const data = this.loadData();

      if (sql.includes('SELECT') && sql.includes('FROM properties')) {
        const id = params?.[0];
        const result = data.properties.find(p => p.id == id);
        if (callback) callback(null, result);
        return;
      }

      if (callback) callback(null, null);
    } catch (err) {
      if (callback) callback(err, null);
    }
  }

  // For async/await support
  serialize(callback) {
    if (callback) callback();
  }

  close(callback) {
    if (callback) callback(null);
  }
}

module.exports = SimpleDB;
