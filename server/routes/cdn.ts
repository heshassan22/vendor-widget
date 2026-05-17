import fs from 'node:fs';
import path from 'node:path';
import type { FastifyInstance } from 'fastify';
import type { DB } from '../db.ts';
import { env, getPublicOrigin } from '../env.ts';

type ConfigRow = {
  primary_color: string;
  welcome_message: string;
  button_text: string;
  launcher_label: string;
  allowed_origins_json: string;
  product_rules_json: string;
  environment: string;
  channel: string;
  points_per_currency_unit: number;
};

type ApiKeyRow = {
  public_key: string;
  secret: string;
};

export function registerCdnRoutes(app: FastifyInstance, db: DB): void {
  const widgetDir = path.join(env.projectRoot, 'public', 'widget');

  app.get('/widget/loader.js', async (_request, reply) => {
    const filePath = path.join(widgetDir, 'loader.js');
    return sendBundle(reply, filePath, 'application/javascript; charset=utf-8');
  });

  app.get('/widget/widget.js', async (_request, reply) => {
    const filePath = path.join(widgetDir, 'widget.js');
    return sendBundle(reply, filePath, 'application/javascript; charset=utf-8');
  });

  app.get<{ Params: { domainScript: string } }>(
    '/configs/:domainScript.json',
    async (request, reply) => {
      const { domainScript } = request.params;
      const parsed = parseDomainScript(domainScript);
      if (parsed === null) {
        return reply.code(400).send({ error: 'invalid domain script' });
      }
      const tenant = db
        .prepare('SELECT id, name, brand FROM tenants WHERE id = ?')
        .get(parsed.tenantId) as { id: string; name: string; brand: string } | undefined;
      if (tenant === undefined) {
        return reply.code(404).send({ error: 'unknown tenant' });
      }
      const config = db
        .prepare(
          `SELECT primary_color, welcome_message, button_text, launcher_label,
                  allowed_origins_json, product_rules_json, environment, channel,
                  points_per_currency_unit
           FROM tenant_configs WHERE tenant_id = ? AND domain = ?`,
        )
        .get(parsed.tenantId, parsed.domain) as ConfigRow | undefined;
      if (config === undefined) {
        return reply.code(404).send({ error: 'unknown domain' });
      }
      const apiKey = db
        .prepare(
          `SELECT public_key, secret FROM api_keys
           WHERE tenant_id = ? AND revoked_at IS NULL
           ORDER BY created_at DESC LIMIT 1`,
        )
        .get(parsed.tenantId) as ApiKeyRow | undefined;

      reply
        .header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
        .header('Access-Control-Allow-Origin', '*')
        .header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        .send({
          tenantId: parsed.tenantId,
          domain: parsed.domain,
          tenantName: tenant.name,
          brand: tenant.brand,
          theme: {
            primaryColor: config.primary_color,
            welcomeMessage: config.welcome_message,
            buttonText: config.button_text,
            launcherLabel: config.launcher_label,
          },
          allowedOrigins: safeParseJson<string[]>(config.allowed_origins_json, []),
          productRules: safeParseJson<unknown[]>(config.product_rules_json, []),
          environment: config.environment,
          channel: config.channel,
          eventsUrl: `${getPublicOrigin(request)}/api/v1/events`,
          publicKey: apiKey?.public_key ?? null,
          publishableSecret: apiKey?.secret ?? null,
          pointsPerCurrencyUnit: config.points_per_currency_unit,
        });
    },
  );
}

function sendBundle(reply: import('fastify').FastifyReply, filePath: string, contentType: string) {
  if (fs.existsSync(filePath) === false) {
    return reply.code(503).send({ error: 'widget bundle not built' });
  }
  const body = fs.readFileSync(filePath);
  return reply
    .header('Content-Type', contentType)
    .header('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400')
    .header('Access-Control-Allow-Origin', '*')
    .send(body);
}

function parseDomainScript(input: string): { tenantId: string; domain: string } | null {
  const dash = input.indexOf('-');
  if (dash === -1) {
    return null;
  }
  const tenantId = input.slice(0, dash);
  const domain = input.slice(dash + 1);
  if (tenantId.length === 0 || domain.length === 0) {
    return null;
  }
  return { tenantId, domain };
}

function safeParseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
