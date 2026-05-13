import fs from 'node:fs';
import path from 'node:path';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import { env } from './env.ts';
import { openDatabase } from './db.ts';
import { createEventBus } from './bus.ts';
import { seedIfEmpty } from './seed.ts';
import { registerCdnRoutes } from './routes/cdn.ts';
import { registerEventRoutes } from './routes/events.ts';
import { registerAuthRoutes } from './routes/auth.ts';
import { registerDashboardRoutes } from './routes/dashboard.ts';

async function main() {
  const app = Fastify({
    logger: {
      transport: process.env.NODE_ENV === 'production' ? undefined : {
        target: 'pino-pretty',
        options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
      },
    },
    bodyLimit: 1024 * 1024,
    trustProxy: true,
  });

  await app.register(cookie, { secret: env.cookieSecret });
  await app.register(rateLimit, {
    global: false,
    max: 600,
    timeWindow: '1 minute',
  });
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  const db = openDatabase();
  seedIfEmpty(db);
  const bus = createEventBus();

  app.get('/health', async () => ({ ok: true, ts: Date.now() }));

  registerCdnRoutes(app, db);
  registerEventRoutes(app, db, bus);
  registerAuthRoutes(app, db);
  registerDashboardRoutes(app, db, bus);

  const distDir = path.join(env.projectRoot, 'dist');
  const publicDir = path.join(env.projectRoot, 'public');
  if (fs.existsSync(distDir)) {
    await app.register(fastifyStatic, {
      root: distDir,
      prefix: '/',
      decorateReply: false,
      setHeaders(res, fp) {
        if (fp.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      },
    });
    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith('/api') || request.url.startsWith('/auth')) {
        return reply.code(404).send({ error: 'not found' });
      }
      return reply.sendFile('index.html');
    });
  } else {
    await app.register(fastifyStatic, {
      root: publicDir,
      prefix: '/public-assets/',
      decorateReply: false,
    });
  }

  if (fs.existsSync(path.join(publicDir, 'demo'))) {
    await app.register(fastifyStatic, {
      root: path.join(publicDir, 'demo'),
      prefix: '/demo/',
      decorateReply: false,
    });
  }

  try {
    await app.listen({ port: env.port, host: '0.0.0.0' });
    app.log.info(`server ready on http://localhost:${env.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

void main();
