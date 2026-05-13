export type ApiResult<T> = Promise<T>;

const API_BASE = '';

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(status: number, message: string, details: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function api<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined && headers.has('Content-Type') === false) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...init,
    headers,
  });
  const text = await response.text();
  let parsed: unknown = null;
  if (text.length > 0) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }
  if (response.ok === false) {
    const message =
      typeof parsed === 'object' && parsed !== null && 'error' in parsed
        ? String((parsed as { error: unknown }).error)
        : `Request failed: ${response.status}`;
    throw new ApiError(response.status, message, parsed);
  }
  return parsed as T;
}

export type TenantSummary = {
  id: string;
  name: string;
  brand: string;
  plan: 'starter' | 'growth' | 'enterprise';
  domain: string | null;
  channel: 'stable' | 'beta' | 'dev';
  environment: 'production' | 'staging';
  eventCount: number;
  createdAt: string;
};

export type TenantDetail = {
  id: string;
  name: string;
  brand: string;
  plan: 'starter' | 'growth' | 'enterprise';
  domain: string | null;
  primaryColor: string;
  welcomeMessage: string;
  buttonText: string;
  launcherLabel: string;
  allowedOrigins: readonly string[];
  productRules: readonly ProductRule[];
  environment: 'production' | 'staging';
  channel: 'stable' | 'beta' | 'dev';
  createdAt: string;
};

export type ProductRule = {
  match: 'sku' | 'brand';
  value: string;
  points: number;
};

export type CreatedTenant = {
  id: string;
  name: string;
  brand: string;
  plan: string;
  domain: string;
  publicKey: string;
  secret: string;
  snippet: string;
};

export type ApiKey = {
  id: string;
  publicKey: string;
  secretPreview: string;
  createdAt: string;
  revokedAt: string | null;
};

export type LiveEventRow = {
  id: string;
  tenantId: string;
  type: string;
  sku: string | null;
  customerId: string | null;
  points: number;
  origin: string | null;
  ip: string | null;
  createdAt: string;
};

export type AnalyticsResponse = {
  totals: readonly { type: string; count: number; points: number }[];
  daily: readonly { day: string; c: number }[];
  customerCount: number;
  totalPoints: number;
};
