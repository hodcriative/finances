import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

// `node:sqlite` é nativo do Node (>=22.5), sem dependência externa nem
// build nativo (node-gyp) — importante neste ambiente de prototipagem.
// Ainda é uma API experimental do Node; se isso virar um problema em
// produção, a troca para `better-sqlite3` é direta (mesma API síncrona
// de `.prepare()/.run()/.get()/.all()`), como já é o objetivo declarado
// ao escolher SQLite agora ("fácil trocar depois").
const DB_PATH = process.env.DB_PATH || "./data/finance.sqlite";

mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new DatabaseSync(DB_PATH);

db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  theme TEXT NOT NULL DEFAULT 'light',
  notify_budget_alerts INTEGER NOT NULL DEFAULT 1,
  notify_goal_alerts INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  initial_balance REAL,
  brand TEXT,
  card_limit REAL,
  current_invoice REAL,
  closing_day INTEGER,
  due_day INTEGER,
  color TEXT,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS card_purchases (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  installment_amount REAL NOT NULL,
  installments INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT NOT NULL,
  category_id TEXT,
  account_id TEXT,
  date TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  total_limit REAL NOT NULL DEFAULT 0,
  UNIQUE(user_id, month)
);

CREATE TABLE IF NOT EXISTS budget_categories (
  id TEXT PRIMARY KEY,
  budget_id TEXT NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL,
  limit_amount REAL NOT NULL,
  UNIQUE(budget_id, category_id)
);

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount REAL NOT NULL,
  current_amount REAL NOT NULL DEFAULT 0,
  deadline TEXT,
  icon TEXT,
  color TEXT,
  status TEXT NOT NULL DEFAULT 'active'
);

-- Sessões ativas (uma linha por token emitido). Verificação positiva:
-- um token só é válido se a sessão ainda existir aqui. Logout apaga a
-- linha; logout-all apaga todas as linhas do usuário. expires_at
-- existe só para faxina (o JWT já expira sozinho por conta própria via
-- exp) -- ver cleanupExpiredSessions em utils/token.js.
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
`);
