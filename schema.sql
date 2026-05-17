CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_admin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  name      TEXT    NOT NULL,
  slug      TEXT    NOT NULL UNIQUE,
  parent_id INTEGER REFERENCES categories(id),
  level     INTEGER NOT NULL,
  type      TEXT    NOT NULL CHECK (type IN ('income', 'expense'))
);

CREATE TABLE IF NOT EXISTS monthly_budgets (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id     INTEGER NOT NULL REFERENCES categories(id),
  month           INTEGER NOT NULL,
  year            INTEGER NOT NULL,
  user_id         INTEGER REFERENCES users(id),
  expected_amount REAL    NOT NULL DEFAULT 0,
  UNIQUE (category_id, month, year, user_id)
);

CREATE TABLE IF NOT EXISTS transactions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  description TEXT,
  amount      REAL    NOT NULL,
  date        TEXT    NOT NULL,
  month       INTEGER NOT NULL,
  year        INTEGER NOT NULL,
  user_id     INTEGER REFERENCES users(id),
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
