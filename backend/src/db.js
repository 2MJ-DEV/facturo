import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'facturo.db');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

export function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','accountant','employee')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      address TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number INTEGER UNIQUE NOT NULL,
      client_id INTEGER NOT NULL,
      issue_date TEXT NOT NULL,
      due_date TEXT,
      total_ht REAL NOT NULL DEFAULT 0,
      tva_rate REAL NOT NULL DEFAULT 0,
      total_ttc REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'unpaid' CHECK(status IN ('paid','partial','unpaid')),
      deleted_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(client_id) REFERENCES clients(id)
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      unit_price REAL NOT NULL,
      quantity REAL NOT NULL,
      total REAL NOT NULL,
      FOREIGN KEY(invoice_id) REFERENCES invoices(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      method TEXT NOT NULL,
      paid_at TEXT NOT NULL,
      note TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(invoice_id) REFERENCES invoices(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity TEXT,
      entity_id INTEGER,
      details TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
    CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
  `);
}

export function seedAdmin({ email, password }) {
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return exists.id;
  const password_hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare('INSERT INTO users (email, password_hash, role) VALUES (?,?,?)')
    .run(email, password_hash, 'admin');
  return info.lastInsertRowid;
}

function cli() {
  const cmd = process.argv[2];
  if (cmd === 'migrate') {
    migrate();
    console.log('Migrations applied. DB at', dbPath);
    process.exit(0);
  }
  if (cmd === 'seed-admin') {
    const email = process.env.ADMIN_EMAIL || 'admin@facturo.local';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    migrate();
    const id = seedAdmin({ email, password });
    console.log('Admin ensured with id', id, 'email', email);
    process.exit(0);
  }
}

if (import.meta.url === url.pathToFileURL(process.argv[1]).href) {
  cli();
}
