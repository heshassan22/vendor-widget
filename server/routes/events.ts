import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { DB } from '../db.ts';
import { hmacVerify, randomId } from '../hmac.ts';
import type { EventBus } from '../bus.ts';

const eventBodySchema = z.object({
  tenantId: z.string().min(1).max(64),
  publicKey: z.string().min(1).max(128),
  type: z.enum(['page_view', 'launcher_open', 'identify', 'add_to_cart', 'checkout_success']),
  sku: z.string().max(128).optional(),
  customerId: z.string().max(128).optional(),
  points: z.number().int().min(0).max(100000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.number().int(),
  signature: z.string().min(1).max(256),
});

const POINTS_BY_TYPE: Record<string, number> = {
  page_view: 0,
  launcher_open: 0,
  identify: 0,
  add_to_cart: 5,
  checkout_success: 50,
};

const TIMESTAMP_SKEW_SECONDS = 5 * 60;

type ApiKeyRow = { secret: string };

export function registerEventRoutes(app: FastifyInstance, db: DB, bus: EventBus): void {
  app.options('/api/v1/events', async (_request, reply) => {
    reply
      .header('Access-Control-Allow-Origin', '*')
      .header('Access-Control-Allow-Methods', 'POST, OPTIONS')
      .header('Access-Control-Allow-Headers', 'Content-Type')
      .header('Access-Control-Max-Age', '86400')
      .code(204)
      .send();
  });

  app.post('/api/v1/events', {
    config: {
      rateLimit: { max: 120, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    reply.header('Access-Control-Allow-Origin', '*');

    const parsed = eventBodySchema.safeParse(request.body);
    if (parsed.success === false) {
      return reply.code(400).send({ error: 'invalid body', details: parsed.error.flatten() });
    }
    const body = parsed.data;

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSeconds - body.timestamp) > TIMESTAMP_SKEW_SECONDS) {
      return reply.code(400).send({ error: 'timestamp out of range' });
    }

    const apiKey = db
      .prepare(
        `SELECT secret FROM api_keys
         WHERE tenant_id = ? AND public_key = ? AND revoked_at IS NULL`,
      )
      .get(body.tenantId, body.publicKey) as ApiKeyRow | undefined;
    if (apiKey === undefined) {
      return reply.code(401).send({ error: 'unknown api key' });
    }

    const message = [
      body.tenantId,
      body.type,
      body.sku ?? '',
      body.customerId ?? '',
      String(body.timestamp),
    ].join(':');
    if (hmacVerify(message, apiKey.secret, body.signature) === false) {
      return reply.code(401).send({ error: 'invalid signature' });
    }

    const id = randomId('e');
    const points = body.points ?? POINTS_BY_TYPE[body.type] ?? 0;
    const ip = request.ip;
    const origin = request.headers.origin ?? null;

    db.prepare(
      `INSERT INTO events (id, tenant_id, type, sku, customer_id, points, metadata_json, ip, origin)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      body.tenantId,
      body.type,
      body.sku ?? null,
      body.customerId ?? null,
      points,
      body.metadata === undefined ? null : JSON.stringify(body.metadata),
      ip,
      origin,
    );

    if (body.customerId !== undefined && points > 0) {
      db.prepare(
        `INSERT INTO customer_points (tenant_id, customer_id, total_points, updated_at)
         VALUES (?, ?, ?, datetime('now'))
         ON CONFLICT(tenant_id, customer_id)
         DO UPDATE SET total_points = total_points + excluded.total_points, updated_at = datetime('now')`,
      ).run(body.tenantId, body.customerId, points);
    }

    bus.publish(body.tenantId, {
      id,
      tenantId: body.tenantId,
      type: body.type,
      sku: body.sku ?? null,
      customerId: body.customerId ?? null,
      points,
      origin,
      ip,
      createdAt: new Date().toISOString(),
    });

    return reply.code(202).send({ ok: true, id });
  });

  app.get<{ Params: { customerId: string }; Querystring: { tenantId?: string } }>(
    '/api/v1/customer/:customerId/points',
    async (request, reply) => {
      reply.header('Access-Control-Allow-Origin', '*');
      const tenantId = request.query.tenantId;
      if (tenantId === undefined) {
        return reply.code(400).send({ error: 'tenantId required' });
      }
      const row = db
        .prepare(
          'SELECT total_points FROM customer_points WHERE tenant_id = ? AND customer_id = ?',
        )
        .get(tenantId, request.params.customerId) as { total_points: number } | undefined;
      return reply.send({
        tenantId,
        customerId: request.params.customerId,
        totalPoints: row?.total_points ?? 0,
      });
    },
  );
}
