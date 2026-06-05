import Database from 'better-sqlite3';

const db = new Database('cureforge.db');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS targets (
    id TEXT PRIMARY KEY,
    symbol TEXT,
    area TEXT,
    disease TEXT,
    score REAL,
    safety TEXT,
    tractability TEXT,
    infoGain REAL
  );

  CREATE TABLE IF NOT EXISTS audit_records (
    id TEXT PRIMARY KEY,
    data TEXT
  );

  CREATE TABLE IF NOT EXISTS daemon_logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT,
    type TEXT,
    message TEXT
  );
`);

export default db;
