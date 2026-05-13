import Database from 'better-sqlite3';
import { env } from './env.ts';

export type DB = ReturnType<typeof openDatabase>;

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'starter',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tenant_configs (
  tenant_id TEXT NOT NULL,
  domain TEXT NOT NULL,
  primary_color TEXT NOT NULL DEFAULT '#2563eb',
  welcome_message TEXT NOT NULL DEFAULT 'Earn loyalty points on this product',
  button_text TEXT NOT NULL DEFAULT 'See my points',
  launcher_label TEXT NOT NULL DEFAULT 'Rewards',
  allowed_origins_json TEXT NOT NULL DEFAULT '[]',
  product_rules_json TEXT NOT NULL DEFAULT '[]',
  environment TEXT NOT NULL DEFAULT 'production',
  channel TEXT NOT NULL DEFAULT 'stable',
  PRIMARY KEY (tenant_id, domain),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  public_key TEXT NOT NULL UNIQUE,
  secret TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  revoked_at TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  tenant_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  type TEXT NOT NULL,
  sku TEXT,
  customer_id TEXT,
  points INTEGER NOT NULL DEFAULT 0,
  metadata_json TEXT,
  ip TEXT,
  origin TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS events_tenant_idx ON events(tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS customer_points (
  tenant_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  total_points INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (tenant_id, customer_id)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

export function openDatabase() {
  const db = new Database(env.dbPath);
  db.exec(SCHEMA);
  return db;
}
