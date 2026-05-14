import type { DB } from './db.ts';
import { env } from './env.ts';
import { hashPassword, randomId, randomToken } from './hmac.ts';

const DEMO_TENANT_ID = 't_8f3a';
const DEMO_DOMAIN = 'store.vendor.com';

export function seedIfEmpty(db: DB): void {
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number };
  if (userCount.c === 0) {
    const adminId = randomId('u');
    db.prepare(
      'INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)',
    ).run(adminId, env.adminEmail, hashPassword(env.adminPassword), 'admin');
    console.log(`[seed] Created admin user: ${env.adminEmail} / ${env.adminPassword}`);
  }

  const tenantCount = db.prepare('SELECT COUNT(*) as c FROM tenants').get() as { c: number };
  if (tenantCount.c === 0) {
    db.prepare('INSERT INTO tenants (id, name, brand, plan) VALUES (?, ?, ?, ?)').run(
      DEMO_TENANT_ID,
      'Vendor Mart Demo',
      'Vendor Mart',
      'starter',
    );
    db.prepare(
      `INSERT INTO tenant_configs (tenant_id, domain, primary_color, welcome_message, button_text, launcher_label, allowed_origins_json, product_rules_json, environment, channel)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      DEMO_TENANT_ID,
      DEMO_DOMAIN,
      '#2563eb',
      'Earn loyalty points on this purchase',
      'See my points',
      'Rewards',
      JSON.stringify(['*']),
      JSON.stringify([
        { match: 'brand', value: 'Vendor Mart', points: 50 },
        { match: 'brand', value: 'Dove', points: 30 },
      ]),
      'production',
      'stable',
    );

    const secret = randomToken(24);
    const publicKey = `pk_${randomToken(8)}`;
    db.prepare(
      `INSERT INTO api_keys (id, tenant_id, public_key, secret) VALUES (?, ?, ?, ?)`,
    ).run(randomId('k'), DEMO_TENANT_ID, publicKey, secret);
    console.log(`[seed] Created demo tenant: ${DEMO_TENANT_ID} (domain ${DEMO_DOMAIN})`);
    console.log(`[seed] Demo public key: ${publicKey}`);
  }
}
