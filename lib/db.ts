import { readFileSync } from "fs";
import { join } from "path";
import { createClient, type Client } from "@libsql/client";

declare global {
  // eslint-disable-next-line no-var
  var __turso: Client | undefined;
}

function createDbClient(): Client {
  const url = process.env.TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error("TURSO_URL is not set");
  return createClient({ url, authToken });
}

export function getDb(): Client {
  global.__turso ??= createDbClient();
  return global.__turso;
}

let initRan = false;

async function runInit(db: Client) {
  // Schema only — categories are seeded via onboarding or seed.sql manually
  const schema = readFileSync(join(process.cwd(), "schema.sql"), "utf-8");
  const statements = schema.split(";").map((s) => s.trim()).filter(Boolean);
  for (const sql of statements) {
    await db.execute(sql);
  }

  // Create users table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      is_admin INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Add user_id to transactions if missing
  const txInfo = await db.execute("PRAGMA table_info(transactions)");
  if (!txInfo.rows.some((r) => r.name === "user_id")) {
    await db.execute("ALTER TABLE transactions ADD COLUMN user_id INTEGER REFERENCES users(id)");
  }

  // Recreate monthly_budgets with user_id + correct unique constraint if missing
  const mbInfo = await db.execute("PRAGMA table_info(monthly_budgets)");
  if (!mbInfo.rows.some((r) => r.name === "user_id")) {
    await db.batch([
      { sql: "ALTER TABLE monthly_budgets RENAME TO monthly_budgets_old", args: [] },
      {
        sql: `CREATE TABLE monthly_budgets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category_id INTEGER NOT NULL REFERENCES categories(id),
          month INTEGER NOT NULL,
          year INTEGER NOT NULL,
          user_id INTEGER REFERENCES users(id),
          expected_amount REAL NOT NULL DEFAULT 0,
          UNIQUE (category_id, month, year, user_id)
        )`,
        args: [],
      },
      {
        sql: "INSERT INTO monthly_budgets (id, category_id, month, year, expected_amount) SELECT id, category_id, month, year, expected_amount FROM monthly_budgets_old",
        args: [],
      },
      { sql: "DROP TABLE monthly_budgets_old", args: [] },
    ]);
  }

  // Commitments table
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

  // Commitment payments table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS commitment_payments (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      commitment_id  INTEGER NOT NULL REFERENCES commitments(id),
      user_id        INTEGER NOT NULL REFERENCES users(id),
      month          INTEGER NOT NULL,
      year           INTEGER NOT NULL,
      paid_at        TEXT    NOT NULL DEFAULT (datetime('now')),
      UNIQUE (commitment_id, month, year, user_id)
    )
  `);

  // Assign existing unowned data to admin once admin user is created
  const adminRow = await db.execute("SELECT id FROM users WHERE username = 'admin' LIMIT 1");
  if (adminRow.rows.length > 0) {
    const adminId = adminRow.rows[0].id;
    await db.execute({ sql: "UPDATE transactions SET user_id = ? WHERE user_id IS NULL", args: [adminId] });
    await db.execute({ sql: "UPDATE monthly_budgets SET user_id = ? WHERE user_id IS NULL", args: [adminId] });
  }
}

export async function ensureDb(): Promise<Client> {
  const db = getDb();
  if (!initRan) {
    initRan = true;
    await runInit(db);
  }
  return db;
}
