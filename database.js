/*
 * ============================================================
 *   © 2026 PPSZ NW Pasangkayu. All Rights Reserved.
 *   Dilarang menyalin, mengubah, atau mendistribusikan tanpa izin.
 * ============================================================
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'keuangan.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nama TEXT NOT NULL DEFAULT 'Administrator',
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS santri (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    kelas TEXT DEFAULT '',
    asrama TEXT DEFAULT '',
    nama_ortu TEXT DEFAULT '',
    kontak_ortu TEXT DEFAULT '',
    kode_akses TEXT UNIQUE NOT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS transaksi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    santri_id INTEGER NOT NULL,
    jenis TEXT NOT NULL CHECK (jenis IN ('masuk','keluar')),
    jumlah INTEGER NOT NULL,
    kategori TEXT DEFAULT '',
    keterangan TEXT DEFAULT '',
    tanggal TEXT NOT NULL,
    admin_id INTEGER,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (santri_id) REFERENCES santri(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_transaksi_santri ON transaksi(santri_id);
  CREATE INDEX IF NOT EXISTS idx_transaksi_tanggal ON transaksi(tanggal);
`);

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return salt + ':' + hash;
}

function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const test = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(test, 'hex'));
}

// Seed admin default: username = admin, password = admin123
const adminCount = db.prepare('SELECT COUNT(*) AS c FROM admin').get().c;
if (adminCount === 0) {
  db.prepare('INSERT INTO admin (username, password_hash, nama) VALUES (?, ?, ?)')
    .run('admin', hashPassword('admin123'), 'Administrator');
}

module.exports = { db, hashPassword, verifyPassword };

