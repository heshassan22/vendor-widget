import type { FastifyReply, FastifyRequest } from 'fastify';
import type { DB } from './db.ts';
import { env } from './env.ts';
import { hmacSign, hmacVerify } from './hmac.ts';

const SESSION_COOKIE = 'vw_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export type SessionPayload = {
  userId: string;
  email: string;
  role: 'admin' | 'vendor';
  expiresAt: number;
};

function encodeSession(payload: SessionPayload): string {
  const json = JSON.stringify(payload);
  const body = Buffer.from(json).toString('base64url');
  const sig = hmacSign(body, env.cookieSecret);
  return `${body}.${sig}`;
}

function decodeSession(token: string): SessionPayload | null {
  const dot = token.indexOf('.');
  if (dot === -1) {
    return null;
  }
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (hmacVerify(body, env.cookieSecret, sig) === false) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload;
    if (parsed.expiresAt < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setSessionCookie(reply: FastifyReply, payload: Omit<SessionPayload, 'expiresAt'>): void {
  const session: SessionPayload = {
    ...payload,
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const token = encodeSession(session);
  reply.setCookie(SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie(SESSION_COOKIE, { path: '/' });
}

export function readSession(request: FastifyRequest): SessionPayload | null {
  const cookieToken = request.cookies[SESSION_COOKIE];
  if (cookieToken === undefined) {
    return null;
  }
  return decodeSession(cookieToken);
}

export function requireSession(request: FastifyRequest, reply: FastifyReply): SessionPayload | null {
  const session = readSession(request);
  if (session === null) {
    reply.code(401).send({ error: 'unauthenticated' });
    return null;
  }
  return session;
}

export type DashboardDeps = {
  db: DB;
};
