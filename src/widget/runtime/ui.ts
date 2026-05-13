import type { ProductContext, WidgetTenantConfig } from '@/widget/types';

export type UiHandlers = {
  onLauncherOpen: () => void;
  onCtaClick: () => void;
};

export function renderWidget(
  shadowRoot: ShadowRoot,
  config: WidgetTenantConfig,
  product: ProductContext,
  handlers: UiHandlers,
): void {
  const productLabel = product.title ?? product.sku ?? product.brand ?? 'this product';
  const pointsLabel =
    product.matchedPoints > 0
      ? `Earn <b>${product.matchedPoints}</b> pts on ${productLabel}`
      : config.theme.welcomeMessage;

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
      .points { color: #0f172a; }
      .points b { color: ${config.theme.primaryColor}; }
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
      <div class="body points">${pointsLabel}</div>
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
