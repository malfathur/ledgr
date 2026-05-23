import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
import { readFileSync, unlinkSync, existsSync } from 'fs';
import path from 'path';

const DB_PATH = path.resolve(__dirname, '..', 'test.db');
const DB_URL = `file:${DB_PATH.replace(/\\/g, '/')}`;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function deleteWithRetry(filePath: string, retries = 30, delayMs = 1000): Promise<void> {
  for (let i = 0; i < retries; i++) {
    if (!existsSync(filePath)) return;
    try {
      unlinkSync(filePath);
      return;
    } catch {
      if (i < retries - 1) await sleep(delayMs);
    }
  }
}

export default async function globalSetup() {
  await deleteWithRetry(`${DB_PATH}-wal`);
  await deleteWithRetry(`${DB_PATH}-shm`);
  await deleteWithRetry(DB_PATH);

  const db = createClient({ url: DB_URL, authToken: '' });

  // Apply base schema (users, categories, monthly_budgets, transactions)
  const schema = readFileSync(path.resolve(__dirname, '..', 'schema.sql'), 'utf-8');
  for (const sql of schema.split(';').map(s => s.trim()).filter(Boolean)) {
    await db.execute(sql);
  }

  // Commitments tables (mirrors runInit in lib/db.ts)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS commitments (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL REFERENCES users(id),
      name        TEXT    NOT NULL,
      amount      REAL    NOT NULL,
      due_day     INTEGER NOT NULL,
      category_id INTEGER REFERENCES categories(id),
      is_active   INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS commitment_payments (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      commitment_id INTEGER NOT NULL REFERENCES commitments(id),
      user_id       INTEGER NOT NULL REFERENCES users(id),
      month         INTEGER NOT NULL,
      year          INTEGER NOT NULL,
      paid_at       TEXT    NOT NULL DEFAULT (datetime('now')),
      UNIQUE (commitment_id, month, year, user_id)
    )
  `);

  // Seed categories
  const seed = readFileSync(path.resolve(__dirname, '..', 'seed.sql'), 'utf-8');
  for (const sql of seed.split(';').map(s => s.trim()).filter(Boolean)) {
    await db.execute(sql);
  }

  // Create test regular user
  const hash = bcrypt.hashSync('testpass123', 10);
  await db.execute({
    sql: 'INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, 0)',
    args: ['testuser', hash],
  });

  db.close();
}
