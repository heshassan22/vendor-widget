import type { LoyaltyEventType, WidgetTenantConfig } from '@/widget/types';

type EventInput = {
  type: LoyaltyEventType;
  sku?: string | null;
  customerId?: string | null;
  metadata?: Record<string, unknown>;
};

const textEncoder = new TextEncoder();

async function sign(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function createEventSender(config: WidgetTenantConfig) {
  if (config.publicKey === null || config.publishableSecret === null) {
    return async (_event: EventInput): Promise<void> => {
      // Tenant has no API key; events are dropped silently.
    };
  }
  const publicKey = config.publicKey;
  const secret = config.publishableSecret;

  return async function sendEvent(event: EventInput): Promise<void> {
    const timestamp = Math.floor(Date.now() / 1000);
    const message = [
      config.tenantId,
      event.type,
      event.sku ?? '',
      event.customerId ?? '',
      String(timestamp),
    ].join(':');
    let signature: string;
    try {
      signature = await sign(message, secret);
    } catch (err) {
      console.warn('[uniwidget] sign error', err);
      return;
    }
    const payload = {
      tenantId: config.tenantId,
      publicKey,
      type: event.type,
      sku: event.sku ?? undefined,
      customerId: event.customerId ?? undefined,
      metadata: event.metadata,
      timestamp,
      signature,
    };
    const body = JSON.stringify(payload);
    if (typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      const sent = navigator.sendBeacon(config.eventsUrl, blob);
      if (sent === true) {
        return;
      }
    }
    try {
      await fetch(config.eventsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
        credentials: 'omit',
      });
    } catch (err) {
      console.warn('[uniwidget] event POST failed', err);
    }
  };
}

export type EventSender = ReturnType<typeof createEventSender>;
