import { api } from './client';

export type AuthUser = {
  id: string;
  email: string;
  role: 'admin' | 'vendor';
  tenantId: string | null;
};

export type AuthResponse = {
  user: AuthUser;
};

export function loginRequest(email: string, password: string): Promise<AuthResponse> {
  return api<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function logoutRequest(): Promise<{ ok: true }> {
  return api<{ ok: true }>('/auth/logout', { method: 'POST' });
}

export function getMe(): Promise<AuthResponse> {
  return api<AuthResponse>('/auth/me');
}
