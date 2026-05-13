import type { ProductContext, WidgetTenantConfig } from '@/widget/types';

type JsonLdProduct = {
  '@type'?: string;
  sku?: string;
  name?: string;
  brand?: string | { name?: string };
};

function readMeta(name: string): string | null {
  const el = document.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
  if (el instanceof HTMLMetaElement && el.content.length > 0) {
    return el.content;
  }
  return null;
}

function readJsonLdProduct(): Omit<ProductContext, 'matchedPoints'> {
  const scripts = document.querySelectorAll<HTMLScriptElement>(
    'script[type="application/ld+json"]',
  );

  for (const script of scripts) {
    try {
      const parsed = JSON.parse(script.textContent ?? '{}') as JsonLdProduct;
      if (parsed['@type'] === 'Product') {
        const brandValue =
          typeof parsed.brand === 'string'
            ? parsed.brand
            : parsed.brand?.name ?? null;
        return {
          sku: parsed.sku ?? null,
          brand: brandValue,
          title: parsed.name ?? null,
        };
      }
    } catch {
      // ignore malformed schemas
    }
  }

  const ogType = readMeta('og:type');
  if (ogType === 'product') {
    return {
      sku: null,
      brand: readMeta('og:brand'),
      title: readMeta('og:title'),
    };
  }

  return { sku: null, brand: null, title: null };
}

export function detectProduct(config: WidgetTenantConfig): ProductContext | null {
  const context = readJsonLdProduct();
  if (context.sku === null && context.brand === null && context.title === null) {
    return null;
  }
  const matchedRule = config.productRules.find((rule) => {
    if (rule.match === 'sku') {
      return context.sku !== null && rule.value === context.sku;
    }
    return context.brand !== null && rule.value === context.brand;
  });
  if (matchedRule === undefined && config.productRules.length > 0) {
    return null;
  }
  return {
    ...context,
    matchedPoints: matchedRule?.points ?? 0,
  };
}
