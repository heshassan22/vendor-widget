import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { DB } from '../db.ts';
import { verifyPassword } from '../hmac.ts';
import {
  clearSessionCookie,
  readSession,
  setSessionCookie,
} from '../auth.ts';

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'vendor';
  tenant_id: string | null;
};

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(256),
});

export function registerAuthRoutes(app: FastifyInstance, db: DB): void {
  app.post('/auth/login', {
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (parsed.success === false) {
      return reply.code(400).send({ error: 'invalid body' });
    }

    const user = db
      .prepare('SELECT id, email, password_hash, role, tenant_id FROM users WHERE email = ?')
      .get(parsed.data.email) as UserRow | undefined;
    if (user === undefined || verifyPassword(parsed.data.password, user.password_hash) === false) {
      return reply.code(401).send({ error: 'invalid credentials' });
    }

    setSessionCookie(request, reply, {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return reply.send({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id,
      },
    });
  });

  app.post('/auth/logout', async (_request, reply) => {
    clearSessionCookie(reply);
    return reply.send({ ok: true });
  });

  app.get('/auth/me', async (request, reply) => {
    const session = readSession(request);
    if (session === null) {
      return reply.code(401).send({ error: 'unauthenticated' });
    }
    const user = db
      .prepare('SELECT id, email, role, tenant_id FROM users WHERE id = ?')
      .get(session.userId) as Omit<UserRow, 'password_hash'> | undefined;
    if (user === undefined) {
      clearSessionCookie(reply);
      return reply.code(401).send({ error: 'unauthenticated' });
    }
    return reply.send({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id,
      },
    });
  });
}
