/**
 * Simple JSON-based Database
 * Replaces sqlite3 for Hostinger compatibility.
 */

const fs = require('fs');
const path = require('path');

function dbLog(level, message, details = {}) {
  const suffix = Object.keys(details).length ? ` ${JSON.stringify(details)}` : '';
  console[level](`[${new Date().toISOString()}] [db] ${message}${suffix}`);
}

class SimpleDB {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.dbDir = path.dirname(dbPath);

    if (!fs.existsSync(this.dbDir)) {
      fs.mkdirSync(this.dbDir, { recursive: true });
      dbLog('log', 'Data directory created', { dir: this.dbDir });
    }

    this.dataFile = dbPath.replace('.db', '.json');
    if (!fs.existsSync(this.dataFile)) {
      this.saveData({ properties: [], owner_requests: [] });
    }

    dbLog('log', 'JSON database initialized', { dataFile: this.dataFile });
  }

  loadData() {
    try {
      if (fs.existsSync(this.dataFile)) {
        const data = fs.readFileSync(this.dataFile, 'utf8');
        const parsed = JSON.parse(data || '{"properties":[],"owner_requests":[]}');
        parsed.properties = Array.isArray(parsed.properties) ? parsed.properties : [];
        parsed.owner_requests = Array.isArray(parsed.owner_requests) ? parsed.owner_requests : [];
        dbLog('log', 'Data loaded', {
          properties: parsed.properties.length,
          ownerRequests: parsed.owner_requests.length
        });
        return parsed;
      }
    } catch (err) {
      dbLog('error', 'Error loading data', { error: err.message, dataFile: this.dataFile });
    }

    return { properties: [], owner_requests: [] };
  }

  saveData(data) {
    try {
      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2), 'utf8');
      dbLog('log', 'Data saved', {
        properties: data.properties?.length || 0,
        ownerRequests: data.owner_requests?.length || 0
      });
    } catch (err) {
      dbLog('error', 'Error saving data', { error: err.message, dataFile: this.dataFile });
      throw err;
    }
  }

  run(sql, params = [], callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }

    try {
      const compactSql = sql.replace(/\s+/g, ' ').trim();
      dbLog('log', 'Run called', { sql: compactSql.slice(0, 140) });
      const data = this.loadData();

      if (sql.includes('CREATE TABLE')) {
        dbLog('log', 'CREATE TABLE ignored for JSON database');
        callback?.(null);
        return;
      }

      if (sql.includes('ALTER TABLE')) {
        dbLog('log', 'ALTER TABLE ignored for JSON database');
        callback?.(null);
        return;
      }

      if (sql.includes('INSERT INTO properties')) {
        const values = params;
        const newProp = {
          id: values[0],
          title: values[1],
          location: values[2],
          price: values[3],
          priceNumeric: values[4],
          beds: values[5],
          baths: values[6],
          sqft: values[7],
          type: values[8],
          isSold: values[9] || 0,
          isApproved: values[10] || 0,
          image: values[11],
          images: values[12],
          isAiMatch: values[13] || 0,
          matchScore: values[14],
          isLiked: values[15] || 0,
          description: values[16],
          amenities: values[17],
          ownerName: values[18],
          ownerPhone: values[19],
          ownerEmail: values[20] || '',
          videoUrl: values[21] || '',
          listingType: values[22] || '',
          timestamp: new Date().toISOString()
        };

        data.properties.push(newProp);
        this.saveData(data);
        dbLog('log', 'Property inserted', { id: newProp.id, title: newProp.title });
        callback?.call({ lastID: newProp.id, changes: 1 }, null);
        return;
      }

      if (sql.includes('INSERT INTO owner_requests')) {
        const values = params;
        const newRequest = {
          id: data.owner_requests.length + 1,
          name: values[0],
          phone: values[1],
          email: values[2],
          propertyId: values[3],
          propertyTitle: values[4] || '',
          ownerPhone: values[5] || '',
          timestamp: values[6] || new Date().toISOString()
        };

        data.owner_requests.push(newRequest);
        this.saveData(data);
        dbLog('log', 'Owner request inserted', { id: newRequest.id, propertyId: newRequest.propertyId });
        callback?.call({ lastID: newRequest.id, changes: 1 }, null);
        return;
      }

      if (sql.includes('UPDATE properties SET')) {
        const id = params[params.length - 1];
        const property = data.properties.find((item) => item.id == id);
        if (!property) {
          dbLog('warn', 'Property update skipped, id not found', { id });
          callback?.call({ changes: 0 }, null);
          return;
        }

        const setClause = compactSql.match(/UPDATE properties SET (.+) WHERE id = \?/i)?.[1] || '';
        const fields = setClause.split(',').map((part) => part.split('=')[0].trim()).filter(Boolean);
        fields.forEach((field, index) => {
          property[field] = params[index];
        });

        this.saveData(data);
        dbLog('log', 'Property updated', { id, fields });
        callback?.call({ changes: 1 }, null);
        return;
      }

      if (sql.includes('DELETE FROM properties')) {
        const id = params[0];
        const before = data.properties.length;
        data.properties = data.properties.filter((item) => item.id != id);
        const changes = before - data.properties.length;
        this.saveData(data);
        dbLog('log', 'Property delete complete', { id, changes });
        callback?.call({ changes }, null);
        return;
      }

      dbLog('warn', 'Run SQL not implemented, treated as success', { sql: compactSql.slice(0, 140) });
      callback?.(null);
    } catch (err) {
      dbLog('error', 'Run failed', { error: err.message });
      callback?.(err);
    }
  }

  all(sql, params = [], callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }

    try {
      const compactSql = sql.replace(/\s+/g, ' ').trim();
      dbLog('log', 'All called', { sql: compactSql.slice(0, 140) });
      const data = this.loadData();

      if (sql.includes('PRAGMA table_info')) {
        callback?.(null, []);
        return;
      }

      if (sql.includes('SELECT') && sql.includes('FROM properties')) {
        let results = [...data.properties];

        if (sql.includes('isApproved = 1')) {
          results = results.filter((p) => p.isApproved === 1);
        }
        if (sql.includes('isSold = 0')) {
          results = results.filter((p) => p.isSold === 0);
        }
        if (sql.includes('isAiMatch DESC')) {
          results.sort((a, b) => (b.isAiMatch || 0) - (a.isAiMatch || 0));
        }
        if (sql.includes('ORDER BY id DESC')) {
          results.sort((a, b) => Number(b.id) - Number(a.id));
        }

        dbLog('log', 'Properties selected', { count: results.length });
        callback?.(null, results);
        return;
      }

      if (sql.includes('SELECT') && sql.includes('FROM owner_requests')) {
        dbLog('log', 'Owner requests selected', { count: data.owner_requests.length });
        callback?.(null, data.owner_requests);
        return;
      }

      callback?.(null, []);
    } catch (err) {
      dbLog('error', 'All failed', { error: err.message });
      callback?.(err, []);
    }
  }

  get(sql, params = [], callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }

    try {
      const compactSql = sql.replace(/\s+/g, ' ').trim();
      dbLog('log', 'Get called', { sql: compactSql.slice(0, 140), params });
      const data = this.loadData();

      if (sql.includes('COUNT(*) as count FROM properties')) {
        callback?.(null, { count: data.properties.length });
        return;
      }

      if (sql.includes('COUNT(*) as count FROM owner_requests')) {
        callback?.(null, { count: data.owner_requests.length });
        return;
      }

      if (sql.includes('SELECT') && sql.includes('FROM properties')) {
        const id = params?.[0];
        const result = data.properties.find((p) => p.id == id);
        dbLog('log', 'Property lookup complete', { id, found: Boolean(result) });
        callback?.(null, result);
        return;
      }

      callback?.(null, null);
    } catch (err) {
      dbLog('error', 'Get failed', { error: err.message });
      callback?.(err, null);
    }
  }

  prepare(sql) {
    const db = this;
    return {
      run(...params) {
        db.run(sql, params, () => {});
      },
      finalize(callback) {
        callback?.(null);
      }
    };
  }

  serialize(callback) {
    callback?.();
  }

  close(callback) {
    callback?.(null);
  }
}

module.exports = SimpleDB;
