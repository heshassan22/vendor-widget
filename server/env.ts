import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..');
const envPath = path.join(projectRoot, '.env');

if (fs.existsSync(envPath)) {
  for (const rawLine of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith('#')) {
      continue;
    }
    const equalsIndex = line.indexOf('=');
    if (equalsIndex === -1) {
      continue;
    }
    const key = line.slice(0, equalsIndex).trim();
    const value = line.slice(equalsIndex + 1).trim();
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function readNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.length === 0) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function readString(name: string, fallback: string): string {
  const raw = process.env[name];
  return raw === undefined || raw.length === 0 ? fallback : raw;
}

export const env = {
  port: readNumber('PORT', 3000),
  cookieSecret: readString('COOKIE_SECRET', 'dev-cookie-secret-change-me'),
  dbPath: readString('DB_PATH', path.join(projectRoot, 'data.db')),
  publicBaseUrl: readString('PUBLIC_BASE_URL', 'http://localhost:3000'),
  adminEmail: readString('ADMIN_EMAIL', 'admin@uniwidget.local'),
  adminPassword: readString('ADMIN_PASSWORD', 'admin'),
  projectRoot,
} as const;
