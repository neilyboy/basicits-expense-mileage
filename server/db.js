const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'pocketledger.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '📋',
    sort_order INTEGER DEFAULT 0,
    follow_up_type TEXT DEFAULT 'none',
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    make TEXT,
    model TEXT,
    year TEXT,
    license_plate TEXT,
    color TEXT,
    track_mileage INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    vehicle_id INTEGER,
    amount REAL,
    description TEXT,
    notes TEXT,
    receipt_photo TEXT,
    purchase_date TEXT DEFAULT (date('now')),
    purchase_time TEXT DEFAULT (time('now')),
    mileage_reading REAL,
    custom_fields TEXT DEFAULT '{}',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
  );

  CREATE TABLE IF NOT EXISTS mileage_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    date TEXT DEFAULT (date('now')),
    start_mileage REAL,
    end_mileage REAL,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
  );

  CREATE TABLE IF NOT EXISTS workflow_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    step_order INTEGER DEFAULT 0,
    step_type TEXT NOT NULL,
    label TEXT,
    required INTEGER DEFAULT 0,
    options TEXT DEFAULT '{}',
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS email_presets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    email_address TEXT NOT NULL,
    subject_template TEXT DEFAULT '',
    is_default INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1
  );
`);

// Seed default settings if empty
const settingsCount = db.prepare('SELECT COUNT(*) as c FROM settings').get();
if (settingsCount.c === 0) {
  const defaults = {
    home_page: 'expense',
    company_name: process.env.COMPANY_NAME || 'Basic ITS',
    admin_pin: process.env.ADMIN_PIN || '1234',
    default_email_subject: 'Expense Receipt - {date}',
    mileage_reminder_frequency: 'daily',
    mileage_vehicle_id: '',
    date_format: 'MM/DD/YYYY',
    theme_color: '#1e3a5f'
  };
  const insert = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  const tx = db.transaction(() => {
    for (const [k, v] of Object.entries(defaults)) {
      insert.run(k, v);
    }
  });
  tx();
}

// Seed default categories if empty
const catCount = db.prepare('SELECT COUNT(*) as c FROM categories').get();
if (catCount.c === 0) {
  const cats = [
    { name: 'Fuel', icon: '⛽', sort_order: 1, follow_up_type: 'vehicle_mileage' },
    { name: 'Vehicle Maintenance', icon: '🔧', sort_order: 2, follow_up_type: 'vehicle' },
    { name: 'Tool Purchase', icon: '🛠️', sort_order: 3, follow_up_type: 'none' },
    { name: 'Job Expense', icon: '💼', sort_order: 4, follow_up_type: 'none' },
    { name: 'Office Supplies', icon: '📎', sort_order: 5, follow_up_type: 'none' },
    { name: 'Meals', icon: '🍔', sort_order: 6, follow_up_type: 'none' }
  ];
  const insert = db.prepare('INSERT INTO categories (name, icon, sort_order, follow_up_type) VALUES (?, ?, ?, ?)');
  const tx = db.transaction(() => {
    for (const c of cats) {
      insert.run(c.name, c.icon, c.sort_order, c.follow_up_type);
    }
  });
  tx();
}

module.exports = db;
