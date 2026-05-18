import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { DB } from '../db.ts';
import type { EventBus, LiveEvent } from '../bus.ts';
import { getPublicOrigin } from '../env.ts';
import { randomId, randomToken } from '../hmac.ts';
import { requireSession } from '../auth.ts';

type TenantRow = {
  id: string;
  name: string;
  brand: string;
  plan: string;
  created_at: string;
};

type ConfigRow = {
  tenant_id: string;
  domain: string;
  primary_color: string;
  welcome_message: string;
  button_text: string;
  launcher_label: string;
  allowed_origins_json: string;
  product_rules_json: string;
  environment: string;
  channel: string;
};

type ApiKeyRow = {
  id: string;
  public_key: string;
  secret: string;
  created_at: string;
  revoked_at: string | null;
};

type EventRow = {
  id: string;
  tenant_id: string;
  type: string;
  sku: string | null;
  customer_id: string | null;
  points: number;
  origin: string | null;
  ip: string | null;
  created_at: string;
};

function normalizeDomain(input: string): string {
  return input
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/[/?#].*$/, '')
    .toLowerCase();
}

const domainSchema = z
  .string()
  .min(3)
  .max(200)
  .transform(normalizeDomain)
  .refine((v) => v.length >= 3 && v.includes('.'), {
    message: 'domain must be a hostname like example.com',
  });

const tenantBodySchema = z.object({
  id: z.string().min(2).max(64).optional(),
  name: z.string().min(1).max(120),
  brand: z.string().min(1).max(120),
  plan: z.enum(['starter', 'growth', 'enterprise']).optional(),
  domain: domainSchema,
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  welcomeMessage: z.string().max(280).optional(),
  buttonText: z.string().max(60).optional(),
  launcherLabel: z.string().max(60).optional(),
  allowedOrigins: z.array(z.string()).optional(),
  productRules: z.array(z.unknown()).optional(),
  channel: z.enum(['stable', 'beta', 'dev']).optional(),
});

const configPatchSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  welcomeMessage: z.string().max(280).optional(),
  buttonText: z.string().max(60).optional(),
  launcherLabel: z.string().max(60).optional(),
  allowedOrigins: z.array(z.string()).optional(),
  productRules: z.array(z.unknown()).optional(),
  environment: z.enum(['production', 'staging']).optional(),
  channel: z.enum(['stable', 'beta', 'dev']).optional(),
});

const bulkBodySchema = z.object({
  rows: z
    .array(
      z.object({
        name: z.string().min(1),
        brand: z.string().min(1),
        domain: domainSchema,
        plan: z.enum(['starter', 'growth', 'enterprise']).optional(),
      }),
    )
    .min(1)
    .max(500),
});

export function registerDashboardRoutes(app: FastifyInstance, db: DB, bus: EventBus): void {
  app.get('/api/v1/tenants', async (request, reply) => {
    const session = requireSession(request, reply);
    if (session === null) {
      return;
    }
    const tenants = db
      .prepare('SELECT id, name, brand, plan, created_at FROM tenants ORDER BY created_at DESC')
      .all() as TenantRow[];
    const rows = tenants.map((t) => {
      const config = db
        .prepare(
          `SELECT domain, channel, environment FROM tenant_configs
           WHERE tenant_id = ? LIMIT 1`,
        )
        .get(t.id) as { domain: string; channel: string; environment: string } | undefined;
      const eventCount = db
        .prepare('SELECT COUNT(*) as c FROM events WHERE tenant_id = ?')
        .get(t.id) as { c: number };
      return {
        id: t.id,
        name: t.name,
        brand: t.brand,
        plan: t.plan,
        domain: config?.domain ?? null,
        channel: config?.channel ?? 'stable',
        environment: config?.environment ?? 'production',
        eventCount: eventCount.c,
        createdAt: t.created_at,
      };
    });
    return reply.send({ tenants: rows });
  });

  app.post('/api/v1/tenants', async (request, reply) => {
    const session = requireSession(request, reply);
    if (session === null) {
      return;
    }
    const parsed = tenantBodySchema.safeParse(request.body);
    if (parsed.success === false) {
      return reply.code(400).send({ error: 'invalid body', details: parsed.error.flatten() });
    }
    const id = parsed.data.id ?? `t_${randomToken(2)}`;
    const tenant = createTenant(db, { ...parsed.data, id }, getPublicOrigin(request));
    return reply.code(201).send({ tenant });
  });

  app.post('/api/v1/tenants/bulk', async (request, reply) => {
    const session = requireSession(request, reply);
    if (session === null) {
      return;
    }
    const parsed = bulkBodySchema.safeParse(request.body);
    if (parsed.success === false) {
      return reply.code(400).send({ error: 'invalid body', details: parsed.error.flatten() });
    }
    const created: ReturnType<typeof createTenant>[] = [];
    const publicOrigin = getPublicOrigin(request);
    for (const row of parsed.data.rows) {
      created.push(
        createTenant(db, {
          id: `t_${randomToken(2)}`,
          name: row.name,
          brand: row.brand,
          domain: row.domain,
          plan: row.plan,
        }, publicOrigin),
      );
    }
    return reply.code(201).send({ tenants: created });
  });

  app.get<{ Params: { id: string } }>('/api/v1/tenants/:id', async (request, reply) => {
    const session = requireSession(request, reply);
    if (session === null) {
      return;
    }
    const tenant = loadTenantSummary(db, request.params.id);
    if (tenant === null) {
      return reply.code(404).send({ error: 'unknown tenant' });
    }
    return reply.send({ tenant });
  });

  app.patch<{ Params: { id: string } }>('/api/v1/tenants/:id/config', async (request, reply) => {
    const session = requireSession(request, reply);
    if (session === null) {
      return;
    }
    const parsed = configPatchSchema.safeParse(request.body);
    if (parsed.success === false) {
      return reply.code(400).send({ error: 'invalid body', details: parsed.error.flatten() });
    }
    const existing = db
      .prepare('SELECT * FROM tenant_configs WHERE tenant_id = ? LIMIT 1')
      .get(request.params.id) as ConfigRow | undefined;
    if (existing === undefined) {
      return reply.code(404).send({ error: 'unknown tenant config' });
    }
    const updates = {
      primary_color: parsed.data.primaryColor ?? existing.primary_color,
      welcome_message: parsed.data.welcomeMessage ?? existing.welcome_message,
      button_text: parsed.data.buttonText ?? existing.button_text,
      launcher_label: parsed.data.launcherLabel ?? existing.launcher_label,
      allowed_origins_json:
        parsed.data.allowedOrigins === undefined
          ? existing.allowed_origins_json
          : JSON.stringify(parsed.data.allowedOrigins),
      product_rules_json:
        parsed.data.productRules === undefined
          ? existing.product_rules_json
          : JSON.stringify(parsed.data.productRules),
      environment: parsed.data.environment ?? existing.environment,
      channel: parsed.data.channel ?? existing.channel,
    };
    db.prepare(
      `UPDATE tenant_configs SET
         primary_color = ?, welcome_message = ?, button_text = ?, launcher_label = ?,
         allowed_origins_json = ?, product_rules_json = ?, environment = ?, channel = ?
       WHERE tenant_id = ? AND domain = ?`,
    ).run(
      updates.primary_color,
      updates.welcome_message,
      updates.button_text,
      updates.launcher_label,
      updates.allowed_origins_json,
      updates.product_rules_json,
      updates.environment,
      updates.channel,
      existing.tenant_id,
      existing.domain,
    );
    return reply.send({ tenant: loadTenantSummary(db, request.params.id) });
  });

  app.get<{ Params: { id: string } }>(
    '/api/v1/tenants/:id/api-keys',
    async (request, reply) => {
      const session = requireSession(request, reply);
      if (session === null) {
        return;
      }
      const rows = db
        .prepare(
          `SELECT id, public_key, secret, created_at, revoked_at FROM api_keys
           WHERE tenant_id = ? ORDER BY created_at DESC`,
        )
        .all(request.params.id) as ApiKeyRow[];
      return reply.send({
        apiKeys: rows.map((r) => ({
          id: r.id,
          publicKey: r.public_key,
          secretPreview: `${r.secret.slice(0, 4)}…${r.secret.slice(-4)}`,
          createdAt: r.created_at,
          revokedAt: r.revoked_at,
        })),
      });
    },
  );

  app.post<{ Params: { id: string } }>(
    '/api/v1/tenants/:id/api-keys/rotate',
    async (request, reply) => {
      const session = requireSession(request, reply);
      if (session === null) {
        return;
      }
      const tenant = db
        .prepare('SELECT id FROM tenants WHERE id = ?')
        .get(request.params.id) as { id: string } | undefined;
      if (tenant === undefined) {
        return reply.code(404).send({ error: 'unknown tenant' });
      }
      db.prepare(
        `UPDATE api_keys SET revoked_at = datetime('now')
         WHERE tenant_id = ? AND revoked_at IS NULL`,
      ).run(request.params.id);
      const newSecret = randomToken(24);
      const newPublic = `pk_${randomToken(8)}`;
      db.prepare(
        `INSERT INTO api_keys (id, tenant_id, public_key, secret) VALUES (?, ?, ?, ?)`,
      ).run(randomId('k'), request.params.id, newPublic, newSecret);
      return reply.send({
        apiKey: {
          publicKey: newPublic,
          secret: newSecret,
        },
      });
    },
  );

  app.get<{ Params: { id: string }; Querystring: { limit?: string } }>(
    '/api/v1/tenants/:id/events',
    async (request, reply) => {
      const session = requireSession(request, reply);
      if (session === null) {
        return;
      }
      const limit = Math.min(Number.parseInt(request.query.limit ?? '50', 10), 200);
      const rows = db
        .prepare(
          `SELECT id, tenant_id, type, sku, customer_id, points, origin, ip, created_at
           FROM events WHERE tenant_id = ?
           ORDER BY created_at DESC LIMIT ?`,
        )
        .all(request.params.id, limit) as EventRow[];
      return reply.send({
        events: rows.map((r) => ({
          id: r.id,
          tenantId: r.tenant_id,
          type: r.type,
          sku: r.sku,
          customerId: r.customer_id,
          points: r.points,
          origin: r.origin,
          ip: r.ip,
          createdAt: r.created_at,
        })),
      });
    },
  );

  app.get<{ Params: { id: string } }>(
    '/api/v1/tenants/:id/events/stream',
    async (request, reply) => {
      const session = requireSession(request, reply);
      if (session === null) {
        return;
      }
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      });
      const tenantId = request.params.id;
      reply.raw.write(`: connected to ${tenantId}\n\n`);

      const send = (event: LiveEvent) => {
        reply.raw.write(`event: live\n`);
        reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
      };
      const unsubscribe = bus.subscribe(tenantId, send);

      const heartbeat = setInterval(() => {
        reply.raw.write(`: heartbeat ${Date.now()}\n\n`);
      }, 15000);

      request.raw.on('close', () => {
        clearInterval(heartbeat);
        unsubscribe();
      });
    },
  );

  app.get<{ Params: { id: string } }>(
    '/api/v1/tenants/:id/analytics',
    async (request, reply) => {
      const session = requireSession(request, reply);
      if (session === null) {
        return;
      }
      const tenantId = request.params.id;
      const totals = db
        .prepare(
          `SELECT type, COUNT(*) as c, SUM(points) as p
           FROM events WHERE tenant_id = ? GROUP BY type`,
        )
        .all(tenantId) as { type: string; c: number; p: number | null }[];
      const daily = db
        .prepare(
          `SELECT date(created_at) as day, COUNT(*) as c
           FROM events WHERE tenant_id = ? AND created_at > datetime('now', '-30 days')
           GROUP BY day ORDER BY day ASC`,
        )
        .all(tenantId) as { day: string; c: number }[];
      const customerCount = db
        .prepare('SELECT COUNT(*) as c FROM customer_points WHERE tenant_id = ?')
        .get(tenantId) as { c: number };
      const totalPoints = db
        .prepare('SELECT COALESCE(SUM(total_points), 0) as p FROM customer_points WHERE tenant_id = ?')
        .get(tenantId) as { p: number };
      return reply.send({
        totals: totals.map((t) => ({
          type: t.type,
          count: t.c,
          points: t.p ?? 0,
        })),
        daily,
        customerCount: customerCount.c,
        totalPoints: totalPoints.p,
      });
    },
  );

  app.get('/api/v1/snippet', async (request, reply) => {
    const session = requireSession(request, reply);
    if (session === null) {
      return;
    }
    const tenantId = (request.query as { tenantId?: string }).tenantId;
    if (tenantId === undefined) {
      return reply.code(400).send({ error: 'tenantId required' });
    }
    const tenant = loadTenantSummary(db, tenantId);
    if (tenant === null) {
      return reply.code(404).send({ error: 'unknown tenant' });
    }
    const domainScript = `${tenantId}-${tenant.domain ?? 'localhost'}`;
    const origin = getPublicOrigin(request);
    return reply.send({
      snippet: `<script src="${origin}/widget/loader.js" data-domain-script="${domainScript}" type="module"></script>`,
      domainScript,
      loaderUrl: `${origin}/widget/loader.js`,
    });
  });
}

function createTenant(
  db: DB,
  input: {
    id: string;
    name: string;
    brand: string;
    plan?: string;
    domain: string;
    primaryColor?: string;
    welcomeMessage?: string;
    buttonText?: string;
    launcherLabel?: string;
    allowedOrigins?: string[];
    productRules?: unknown[];
    channel?: string;
  },
  publicOrigin: string,
) {
  const plan = input.plan ?? 'starter';
  db.prepare(
    'INSERT INTO tenants (id, name, brand, plan) VALUES (?, ?, ?, ?)',
  ).run(input.id, input.name, input.brand, plan);
  db.prepare(
    `INSERT INTO tenant_configs
       (tenant_id, domain, primary_color, welcome_message, button_text, launcher_label,
        allowed_origins_json, product_rules_json, environment, channel)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    input.id,
    input.domain,
    input.primaryColor ?? '#2563eb',
    input.welcomeMessage ?? 'Earn loyalty points on this purchase',
    input.buttonText ?? 'See my points',
    input.launcherLabel ?? 'Rewards',
    JSON.stringify(input.allowedOrigins ?? []),
    JSON.stringify(input.productRules ?? []),
    'production',
    input.channel ?? 'stable',
  );
  const secret = randomToken(24);
  const publicKey = `pk_${randomToken(8)}`;
  db.prepare(
    'INSERT INTO api_keys (id, tenant_id, public_key, secret) VALUES (?, ?, ?, ?)',
  ).run(randomId('k'), input.id, publicKey, secret);
  return {
    id: input.id,
    name: input.name,
    brand: input.brand,
    plan,
    domain: input.domain,
    publicKey,
    secret,
    snippet: `<script src="${publicOrigin}/widget/loader.js" data-domain-script="${input.id}-${input.domain}" type="module"></script>`,
  };
}

function loadTenantSummary(db: DB, id: string) {
  const tenant = db
    .prepare('SELECT id, name, brand, plan, created_at FROM tenants WHERE id = ?')
    .get(id) as TenantRow | undefined;
  if (tenant === undefined) {
    return null;
  }
  const config = db
    .prepare(
      `SELECT domain, primary_color, welcome_message, button_text, launcher_label,
              allowed_origins_json, product_rules_json, environment, channel
       FROM tenant_configs WHERE tenant_id = ? LIMIT 1`,
    )
    .get(id) as
    | (Omit<ConfigRow, 'tenant_id'>)
    | undefined;
  return {
    id: tenant.id,
    name: tenant.name,
    brand: tenant.brand,
    plan: tenant.plan,
    createdAt: tenant.created_at,
    domain: config?.domain ?? null,
    primaryColor: config?.primary_color ?? '#2563eb',
    welcomeMessage: config?.welcome_message ?? '',
    buttonText: config?.button_text ?? '',
    launcherLabel: config?.launcher_label ?? '',
    allowedOrigins: config === undefined ? [] : safeParse<string[]>(config.allowed_origins_json, []),
    productRules: config === undefined ? [] : safeParse<unknown[]>(config.product_rules_json, []),
    environment: config?.environment ?? 'production',
    channel: config?.channel ?? 'stable',
  };
}

function safeParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
