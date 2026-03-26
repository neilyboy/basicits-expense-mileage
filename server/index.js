const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploads
app.use('/uploads', express.static(UPLOADS_DIR));

// Multer config for receipt photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${uuidv4()}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// ── Admin PIN Auth Middleware ──
function requirePin(req, res, next) {
  const pin = req.headers['x-admin-pin'] || req.query.pin;
  const stored = db.prepare("SELECT value FROM settings WHERE key = 'admin_pin'").get();
  if (!stored || pin !== stored.value) {
    return res.status(401).json({ error: 'Invalid admin PIN' });
  }
  next();
}

// ══════════════════════════════════════════
// SETTINGS API
// ══════════════════════════════════════════
app.get('/api/settings', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const obj = {};
  for (const r of rows) {
    if (r.key === 'admin_pin') continue; // never expose PIN
    obj[r.key] = r.value;
  }
  res.json(obj);
});

app.put('/api/settings', requirePin, (req, res) => {
  const upsert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  const tx = db.transaction(() => {
    for (const [k, v] of Object.entries(req.body)) {
      upsert.run(k, String(v));
    }
  });
  tx();
  res.json({ ok: true });
});

app.post('/api/admin/verify-pin', (req, res) => {
  const { pin } = req.body;
  const stored = db.prepare("SELECT value FROM settings WHERE key = 'admin_pin'").get();
  if (stored && pin === stored.value) {
    res.json({ valid: true });
  } else {
    res.status(401).json({ valid: false });
  }
});

// ══════════════════════════════════════════
// CATEGORIES API
// ══════════════════════════════════════════
app.get('/api/categories', (req, res) => {
  const rows = db.prepare('SELECT * FROM categories WHERE active = 1 ORDER BY sort_order ASC').all();
  res.json(rows);
});

app.get('/api/categories/all', requirePin, (req, res) => {
  const rows = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all();
  res.json(rows);
});

app.post('/api/categories', requirePin, (req, res) => {
  const { name, icon, sort_order, follow_up_type } = req.body;
  const r = db.prepare('INSERT INTO categories (name, icon, sort_order, follow_up_type) VALUES (?, ?, ?, ?)').run(
    name, icon || '📋', sort_order || 0, follow_up_type || 'none'
  );
  res.json({ id: r.lastInsertRowid });
});

app.put('/api/categories/:id', requirePin, (req, res) => {
  const { name, icon, sort_order, follow_up_type, active } = req.body;
  db.prepare('UPDATE categories SET name=?, icon=?, sort_order=?, follow_up_type=?, active=? WHERE id=?').run(
    name, icon, sort_order, follow_up_type, active ?? 1, req.params.id
  );
  res.json({ ok: true });
});

app.delete('/api/categories/:id', requirePin, (req, res) => {
  db.prepare('DELETE FROM categories WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ══════════════════════════════════════════
// VEHICLES API
// ══════════════════════════════════════════
app.get('/api/vehicles', (req, res) => {
  const rows = db.prepare('SELECT * FROM vehicles WHERE active = 1 ORDER BY label ASC').all();
  res.json(rows);
});

app.get('/api/vehicles/all', requirePin, (req, res) => {
  const rows = db.prepare('SELECT * FROM vehicles ORDER BY label ASC').all();
  res.json(rows);
});

app.post('/api/vehicles', requirePin, (req, res) => {
  try {
    const { label, make, model, year, license_plate, color, track_mileage } = req.body;
    if (!label) return res.status(400).json({ error: 'Label is required' });
    const r = db.prepare('INSERT INTO vehicles (label, make, model, year, license_plate, color, track_mileage) VALUES (?,?,?,?,?,?,?)').run(
      label, make || '', model || '', year || '', license_plate || '', color || '', track_mileage || 0
    );
    res.json({ id: r.lastInsertRowid });
  } catch (err) {
    console.error('Create vehicle error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/vehicles/:id', requirePin, (req, res) => {
  try {
    const { label, make, model, year, license_plate, color, track_mileage, active } = req.body;
    db.prepare('UPDATE vehicles SET label=?, make=?, model=?, year=?, license_plate=?, color=?, track_mileage=?, active=? WHERE id=?').run(
      label, make, model, year, license_plate, color, track_mileage, active ?? 1, req.params.id
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Update vehicle error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/vehicles/:id', requirePin, (req, res) => {
  db.prepare('DELETE FROM vehicles WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ══════════════════════════════════════════
// UPLOAD API
// ══════════════════════════════════════════
app.post('/api/upload', upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ filename: req.file.filename, path: `/uploads/${req.file.filename}` });
});

// ══════════════════════════════════════════
// EXPENSES API
// ══════════════════════════════════════════
app.get('/api/expenses', (req, res) => {
  const { start, end, category_id, vehicle_id, limit: lim, offset } = req.query;
  let sql = `SELECT e.*, c.name as category_name, c.icon as category_icon, v.label as vehicle_label 
    FROM expenses e 
    LEFT JOIN categories c ON e.category_id = c.id 
    LEFT JOIN vehicles v ON e.vehicle_id = v.id WHERE 1=1`;
  const params = [];
  if (start) { sql += ' AND e.purchase_date >= ?'; params.push(start); }
  if (end) { sql += ' AND e.purchase_date <= ?'; params.push(end); }
  if (category_id) { sql += ' AND e.category_id = ?'; params.push(category_id); }
  if (vehicle_id) { sql += ' AND e.vehicle_id = ?'; params.push(vehicle_id); }
  sql += ' ORDER BY e.purchase_date DESC, e.created_at DESC';
  if (lim) { sql += ' LIMIT ?'; params.push(parseInt(lim)); }
  if (offset) { sql += ' OFFSET ?'; params.push(parseInt(offset)); }
  res.json(db.prepare(sql).all(...params));
});

app.get('/api/expenses/:id', (req, res) => {
  const row = db.prepare(`SELECT e.*, c.name as category_name, c.icon as category_icon, v.label as vehicle_label 
    FROM expenses e 
    LEFT JOIN categories c ON e.category_id = c.id 
    LEFT JOIN vehicles v ON e.vehicle_id = v.id 
    WHERE e.id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

app.post('/api/expenses', (req, res) => {
  const { category_id, vehicle_id, amount, description, notes, receipt_photo, purchase_date, purchase_time, mileage_reading, custom_fields } = req.body;
  const r = db.prepare(`INSERT INTO expenses (category_id, vehicle_id, amount, description, notes, receipt_photo, purchase_date, purchase_time, mileage_reading, custom_fields)
    VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
    category_id || null, vehicle_id || null, amount || null, description || '',
    notes || '', receipt_photo || null,
    purchase_date || new Date().toISOString().split('T')[0],
    purchase_time || new Date().toTimeString().split(' ')[0],
    mileage_reading || null, JSON.stringify(custom_fields || {})
  );
  res.json({ id: r.lastInsertRowid });
});

app.put('/api/expenses/:id', (req, res) => {
  const { category_id, vehicle_id, amount, description, notes, receipt_photo, purchase_date, purchase_time, mileage_reading, custom_fields } = req.body;
  db.prepare(`UPDATE expenses SET category_id=?, vehicle_id=?, amount=?, description=?, notes=?, receipt_photo=?, purchase_date=?, purchase_time=?, mileage_reading=?, custom_fields=? WHERE id=?`).run(
    category_id, vehicle_id, amount, description, notes, receipt_photo, purchase_date, purchase_time, mileage_reading, JSON.stringify(custom_fields || {}), req.params.id
  );
  res.json({ ok: true });
});

app.delete('/api/expenses/:id', requirePin, (req, res) => {
  db.prepare('DELETE FROM expenses WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ══════════════════════════════════════════
// MILEAGE API
// ══════════════════════════════════════════
app.get('/api/mileage', (req, res) => {
  const { start, end, vehicle_id } = req.query;
  let sql = `SELECT m.*, v.label as vehicle_label FROM mileage_entries m LEFT JOIN vehicles v ON m.vehicle_id = v.id WHERE 1=1`;
  const params = [];
  if (start) { sql += ' AND m.date >= ?'; params.push(start); }
  if (end) { sql += ' AND m.date <= ?'; params.push(end); }
  if (vehicle_id) { sql += ' AND m.vehicle_id = ?'; params.push(vehicle_id); }
  sql += ' ORDER BY m.date DESC, m.created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

app.post('/api/mileage', (req, res) => {
  const { vehicle_id, date, start_mileage, end_mileage, notes } = req.body;
  const r = db.prepare('INSERT INTO mileage_entries (vehicle_id, date, start_mileage, end_mileage, notes) VALUES (?,?,?,?,?)').run(
    vehicle_id, date || new Date().toISOString().split('T')[0], start_mileage != null ? start_mileage : null, end_mileage != null ? end_mileage : null, notes || ''
  );
  res.json({ id: r.lastInsertRowid });
});

app.put('/api/mileage/:id', (req, res) => {
  const { vehicle_id, date, start_mileage, end_mileage, notes } = req.body;
  db.prepare('UPDATE mileage_entries SET vehicle_id=?, date=?, start_mileage=?, end_mileage=?, notes=? WHERE id=?').run(
    vehicle_id, date, start_mileage, end_mileage, notes, req.params.id
  );
  res.json({ ok: true });
});

app.delete('/api/mileage/:id', requirePin, (req, res) => {
  db.prepare('DELETE FROM mileage_entries WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// Latest mileage for a vehicle
app.get('/api/mileage/latest/:vehicleId', (req, res) => {
  const row = db.prepare('SELECT * FROM mileage_entries WHERE vehicle_id = ? ORDER BY date DESC, created_at DESC LIMIT 1').get(req.params.vehicleId);
  res.json(row || null);
});

// ══════════════════════════════════════════
// EMAIL PRESETS API
// ══════════════════════════════════════════
app.get('/api/email-presets', (req, res) => {
  res.json(db.prepare('SELECT * FROM email_presets WHERE active = 1 ORDER BY is_default DESC, label ASC').all());
});

app.post('/api/email-presets', requirePin, (req, res) => {
  const { label, email_address, subject_template, is_default } = req.body;
  if (is_default) db.prepare('UPDATE email_presets SET is_default = 0').run();
  const r = db.prepare('INSERT INTO email_presets (label, email_address, subject_template, is_default) VALUES (?,?,?,?)').run(
    label, email_address, subject_template || '', is_default ? 1 : 0
  );
  res.json({ id: r.lastInsertRowid });
});

app.put('/api/email-presets/:id', requirePin, (req, res) => {
  const { label, email_address, subject_template, is_default, active } = req.body;
  if (is_default) db.prepare('UPDATE email_presets SET is_default = 0').run();
  db.prepare('UPDATE email_presets SET label=?, email_address=?, subject_template=?, is_default=?, active=? WHERE id=?').run(
    label, email_address, subject_template, is_default ? 1 : 0, active ?? 1, req.params.id
  );
  res.json({ ok: true });
});

app.delete('/api/email-presets/:id', requirePin, (req, res) => {
  db.prepare('DELETE FROM email_presets WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ══════════════════════════════════════════
// SUMMARY / STATS API
// ══════════════════════════════════════════
app.get('/api/stats', (req, res) => {
  const { start, end } = req.query;
  let dateFilter = '';
  const params = [];
  if (start) { dateFilter += ' AND purchase_date >= ?'; params.push(start); }
  if (end) { dateFilter += ' AND purchase_date <= ?'; params.push(end); }
  
  const total = db.prepare(`SELECT COALESCE(SUM(amount),0) as total, COUNT(*) as count FROM expenses WHERE 1=1 ${dateFilter}`).get(...params);
  const byCategory = db.prepare(`SELECT c.name, c.icon, COALESCE(SUM(e.amount),0) as total, COUNT(*) as count 
    FROM expenses e LEFT JOIN categories c ON e.category_id = c.id WHERE 1=1 ${dateFilter} GROUP BY e.category_id`).all(...params);
  
  res.json({ ...total, byCategory });
});

// ══════════════════════════════════════════
// Serve React SPA
// ══════════════════════════════════════════
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 PocketLedger running on port ${PORT}`);
});
