import { fetchWidgetConfig } from '@/widget/runtime/api';
import type { WidgetTenantConfig } from '@/widget/types';

declare global {
  interface Window {
    __uniwidgetConfig?: WidgetTenantConfig | null;
    __uniwidgetLoaderUrl?: string;
  }
}

function getCurrentScript(): HTMLScriptElement | null {
  const script = document.currentScript;
  if (script instanceof HTMLScriptElement) {
    return script;
  }
  return document.querySelector('script[data-domain-script]');
}

async function bootstrap(): Promise<void> {
  const script = getCurrentScript();
  if (script === null) {
    console.warn('[uniwidget] no script tag found');
    return;
  }

  const domainScript = script.dataset.domainScript;
  if (domainScript === undefined || domainScript.length === 0) {
    console.warn('[uniwidget] data-domain-script is required');
    return;
  }

  const loaderUrl = new URL(script.src, window.location.href);
  window.__uniwidgetLoaderUrl = loaderUrl.href;

  const configUrl = new URL(`/configs/${domainScript}.json`, loaderUrl).href;
  const widgetUrl = new URL('./widget.js', loaderUrl).href;

  const config = await fetchWidgetConfig(configUrl);
  if (config === null) {
    console.warn('[uniwidget] aborting: no config available');
    return;
  }
  window.__uniwidgetConfig = config;

  await import(/* @vite-ignore */ widgetUrl);
}

void bootstrap();
