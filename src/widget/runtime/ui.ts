import type { ProductContext, WidgetTenantConfig } from '@/widget/types';

export type UiHandlers = {
  onLauncherOpen: () => void;
  onCtaClick: () => void;
};

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatPrice(price: number, currency: string | null): string {
  const symbol = currency === 'USD' || currency === null ? '$' : `${currency} `;
  return `${symbol}${price.toFixed(2)}`;
}

export function renderWidget(
  shadowRoot: ShadowRoot,
  config: WidgetTenantConfig,
  product: ProductContext,
  handlers: UiHandlers,
): void {
  const productLabel = product.title ?? product.sku ?? product.brand ?? null;
  const safeProductLabel = productLabel === null ? null : escapeHtml(productLabel);
  const priceLine = product.price !== null ? formatPrice(product.price, product.currency) : null;

  const pointsBlock =
    product.matchedPoints > 0
      ? `<div class="points-headline">Earn <b>${product.matchedPoints}</b> pts</div>`
      : '';
  const productBlock =
    safeProductLabel === null
      ? `<div class="body">${escapeHtml(config.theme.welcomeMessage)}</div>`
      : `<div class="product-line"><div class="product-title">${safeProductLabel}</div>${
          priceLine !== null ? `<div class="product-price">${escapeHtml(priceLine)}</div>` : ''
        }</div>`;

  shadowRoot.innerHTML = `
    <style>
      :host { all: initial; }
      .launcher {
        position: fixed;
        right: 24px;
        bottom: 24px;
        min-width: 56px;
        height: 56px;
        padding: 0 18px;
        border-radius: 999px;
        border: 0;
        background: ${config.theme.primaryColor};
        color: #fff;
        cursor: pointer;
        box-shadow: 0 10px 24px rgba(0, 0, 0, 0.2);
        font: 600 13px sans-serif;
        z-index: 2147483646;
      }
      .panel {
        position: fixed;
        right: 24px;
        bottom: 90px;
        width: 300px;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        background: #fff;
        padding: 14px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
        font: 500 13px sans-serif;
        z-index: 2147483647;
        display: none;
      }
      .panel.open { display: block; }
      .title { font-weight: 700; color: #0f172a; margin-bottom: 6px; }
      .body { color: #475569; margin-bottom: 10px; line-height: 1.4; }
      .points-headline {
        color: #0f172a;
        font-size: 18px;
        font-weight: 700;
        margin-bottom: 8px;
      }
      .points-headline b { color: ${config.theme.primaryColor}; font-size: 22px; }
      .product-line {
        margin-bottom: 12px;
        padding: 8px 10px;
        border-radius: 8px;
        background: #f8fafc;
      }
      .product-title {
        color: #0f172a;
        font-size: 13px;
        font-weight: 600;
        line-height: 1.3;
      }
      .product-price {
        color: #64748b;
        font-size: 12px;
        margin-top: 2px;
      }
      .cta {
        width: 100%;
        border: 0;
        border-radius: 8px;
        color: #fff;
        padding: 10px;
        font-weight: 600;
        background: ${config.theme.primaryColor};
        cursor: pointer;
      }
      .balance {
        margin-top: 10px;
        padding: 8px 10px;
        border-radius: 8px;
        background: #f1f5f9;
        color: #0f172a;
        font-weight: 600;
        font-size: 12px;
        display: none;
      }
      .balance.visible { display: block; }
      .footer {
        font-size: 10px;
        color: #94a3b8;
        margin-top: 10px;
        text-align: right;
      }
    </style>
    <div class="panel" data-ui="panel" role="dialog" aria-label="${config.brand} rewards">
      <div class="title">${config.brand} rewards</div>
      ${pointsBlock}
      ${productBlock}
      <button class="cta" data-ui="cta">${config.theme.buttonText}</button>
      <div class="balance" data-ui="balance"></div>
      <div class="footer">${config.tenantName}</div>
    </div>
    <button class="launcher" data-ui="launcher" aria-label="Open ${config.brand} rewards">
      ${config.theme.launcherLabel}
    </button>
  `;

  const panel = shadowRoot.querySelector('[data-ui="panel"]');
  const launcher = shadowRoot.querySelector('[data-ui="launcher"]');
  const cta = shadowRoot.querySelector('[data-ui="cta"]');
  if (panel instanceof HTMLElement && launcher instanceof HTMLButtonElement) {
    launcher.addEventListener('click', () => {
      const willOpen = panel.classList.contains('open') === false;
      panel.classList.toggle('open');
      if (willOpen) {
        handlers.onLauncherOpen();
      }
    });
  }
  if (cta instanceof HTMLButtonElement) {
    cta.addEventListener('click', () => {
      handlers.onCtaClick();
    });
  }
}

export function updateBalance(shadowRoot: ShadowRoot, totalPoints: number | null): void {
  const balance = shadowRoot.querySelector('[data-ui="balance"]');
  if (balance instanceof HTMLElement) {
    if (totalPoints === null) {
      balance.classList.remove('visible');
      balance.textContent = '';
    } else {
      balance.classList.add('visible');
      balance.textContent = `Your balance: ${totalPoints} pts`;
    }
  }
}
