import { createShadowHost } from '@/widget/runtime/shadowHost';
import { detectProduct } from '@/widget/runtime/productDetector';
import { renderWidget, updateBalance } from '@/widget/runtime/ui';
import { setupIdentityQueue } from '@/widget/runtime/identity';
import { isOriginAllowed } from '@/widget/runtime/security';
import { onRouteChange } from '@/widget/runtime/spaRouter';
import { createEventSender } from '@/widget/runtime/events';
import type { WidgetTenantConfig } from '@/widget/types';

declare global {
  interface Window {
    __uniwidgetConfig?: WidgetTenantConfig | null;
  }
}

let currentCustomerId: string | null = null;
let currentShadowRoot: ShadowRoot | null = null;
let send: ReturnType<typeof createEventSender> | null = null;

function fetchBalance(config: WidgetTenantConfig): void {
  if (currentCustomerId === null || currentShadowRoot === null) {
    return;
  }
  const url = new URL(
    `/api/v1/customer/${encodeURIComponent(currentCustomerId)}/points`,
    config.eventsUrl,
  );
  url.searchParams.set('tenantId', config.tenantId);
  fetch(url.href, { credentials: 'omit' })
    .then((r) => (r.ok ? r.json() : null))
    .then((data: { totalPoints?: number } | null) => {
      if (data !== null && currentShadowRoot !== null) {
        updateBalance(currentShadowRoot, data.totalPoints ?? 0);
      }
    })
    .catch(() => undefined);
}

function bindAddToCart(config: WidgetTenantConfig, sku: string | null): void {
  document.addEventListener(
    'click',
    (event) => {
      const target = event.target;
      if (target instanceof Element === false) {
        return;
      }
      const trigger = target.closest('[data-uniwidget-event="add-to-cart"]');
      if (trigger === null) {
        return;
      }
      send?.({ type: 'add_to_cart', sku, customerId: currentCustomerId });
    },
    { passive: true },
  );
}

function maybeFireCheckoutSuccess(config: WidgetTenantConfig): void {
  const params = new URLSearchParams(window.location.search);
  const flag =
    params.get('uniwidget_checkout') === '1' ||
    /\/order\/(complete|confirm|success)/.test(window.location.pathname);
  if (flag) {
    send?.({
      type: 'checkout_success',
      sku: null,
      customerId: currentCustomerId,
      metadata: { url: window.location.href },
    });
  }
}

function mountWidget(): void {
  const config = window.__uniwidgetConfig;
  if (config === undefined || config === null) {
    return;
  }

  if (isOriginAllowed(config) === false) {
    console.warn('[uniwidget] origin not allowed by tenant config');
    return;
  }

  const productContext = detectProduct(config);
  if (productContext === null) {
    return;
  }

  document.querySelectorAll('uniwidget-host[data-uniwidget="true"]').forEach((node) => node.remove());
  const { shadowRoot } = createShadowHost();
  currentShadowRoot = shadowRoot;

  if (send === null) {
    send = createEventSender(config);
  }

  renderWidget(shadowRoot, config, productContext, {
    onLauncherOpen: () => {
      send?.({
        type: 'launcher_open',
        sku: productContext.sku,
        customerId: currentCustomerId,
      });
      fetchBalance(config);
    },
    onCtaClick: () => {
      send?.({
        type: 'launcher_open',
        sku: productContext.sku,
        customerId: currentCustomerId,
        metadata: { intent: 'cta' },
      });
    },
  });

  send?.({
    type: 'page_view',
    sku: productContext.sku,
    customerId: currentCustomerId,
    metadata: { brand: productContext.brand, title: productContext.title },
  });

  if (currentCustomerId !== null) {
    fetchBalance(config);
  }
  bindAddToCart(config, productContext.sku);
  maybeFireCheckoutSuccess(config);
}

const initialIdentity = setupIdentityQueue((payload) => {
  if (payload.customerId !== undefined) {
    currentCustomerId = payload.customerId;
  }
  const config = window.__uniwidgetConfig;
  if (config !== undefined && config !== null) {
    send?.({
      type: 'identify',
      sku: null,
      customerId: currentCustomerId,
    });
    fetchBalance(config);
  }
});
if (initialIdentity !== null && initialIdentity.customerId !== undefined) {
  currentCustomerId = initialIdentity.customerId;
}

mountWidget();
onRouteChange(mountWidget);
