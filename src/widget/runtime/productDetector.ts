import type { ProductContext, WidgetTenantConfig } from '@/widget/types';

type JsonLdOffer = {
  '@type'?: string;
  price?: string | number;
  priceCurrency?: string;
};

type JsonLdProduct = {
  '@type'?: string;
  sku?: string;
  name?: string;
  brand?: string | { name?: string };
  offers?: JsonLdOffer | JsonLdOffer[];
};

function readMeta(name: string): string | null {
  const el = document.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
  if (el instanceof HTMLMetaElement && el.content.length > 0) {
    return el.content;
  }
  return null;
}

function pickOfferPrice(offers: JsonLdProduct['offers']): { price: number | null; currency: string | null } {
  if (offers === undefined) {
    return { price: null, currency: null };
  }
  const first = Array.isArray(offers) ? offers[0] : offers;
  if (first === undefined) {
    return { price: null, currency: null };
  }
  const raw = first.price;
  const parsed = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number.parseFloat(raw) : NaN;
  return {
    price: Number.isFinite(parsed) ? parsed : null,
    currency: first.priceCurrency ?? null,
  };
}

function readJsonLd(): Omit<ProductContext, 'matchedPoints'> | null {
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
        const { price, currency } = pickOfferPrice(parsed.offers);
        return {
          sku: parsed.sku ?? null,
          brand: brandValue,
          title: parsed.name ?? null,
          price,
          currency,
        };
      }
    } catch {
      // ignore malformed schemas
    }
  }
  return null;
}

function readMicrodata(): Omit<ProductContext, 'matchedPoints'> | null {
  const productEl = document.querySelector(
    '[itemtype="https://schema.org/Product"], [itemtype="http://schema.org/Product"]',
  );
  if (productEl === null) {
    return null;
  }
  const readProp = (name: string): string | null => {
    const el = productEl.querySelector(`[itemprop="${name}"]`);
    if (el === null) {
      return null;
    }
    if (el instanceof HTMLMetaElement) {
      return el.content.length > 0 ? el.content : null;
    }
    const contentAttr = el.getAttribute('content');
    if (contentAttr !== null && contentAttr.length > 0) {
      return contentAttr;
    }
    const text = el.textContent?.trim() ?? '';
    return text.length > 0 ? text : null;
  };
  const brandRaw = readProp('brand');
  const priceRaw = readProp('price');
  const priceNum = priceRaw === null ? NaN : Number.parseFloat(priceRaw);
  return {
    sku: readProp('sku'),
    brand: brandRaw,
    title: readProp('name'),
    price: Number.isFinite(priceNum) ? priceNum : null,
    currency: readProp('priceCurrency'),
  };
}

function readOpenGraph(): Omit<ProductContext, 'matchedPoints'> | null {
  if (readMeta('og:type') !== 'product') {
    return null;
  }
  const ogPrice = readMeta('product:price:amount') ?? readMeta('og:price:amount');
  const priceNumber = ogPrice === null ? NaN : Number.parseFloat(ogPrice);
  return {
    sku: null,
    brand: readMeta('og:brand'),
    title: readMeta('og:title'),
    price: Number.isFinite(priceNumber) ? priceNumber : null,
    currency: readMeta('product:price:currency') ?? readMeta('og:price:currency'),
  };
}

function readProductContext(): Omit<ProductContext, 'matchedPoints'> {
  return (
    readJsonLd() ??
    readMicrodata() ??
    readOpenGraph() ?? { sku: null, brand: null, title: null, price: null, currency: null }
  );
}

export function detectProduct(config: WidgetTenantConfig): ProductContext | null {
  const context = readProductContext();
  const hasAnyField =
    context.sku !== null ||
    context.brand !== null ||
    context.title !== null ||
    context.price !== null;
  if (hasAnyField === false) {
    return null;
  }

  const matchedRule = config.productRules.find((rule) => {
    if (rule.match === 'sku') {
      return context.sku !== null && rule.value === context.sku;
    }
    return context.brand !== null && rule.value === context.brand;
  });

  let matchedPoints = 0;
  if (matchedRule !== undefined) {
    matchedPoints = matchedRule.points;
  } else if (context.price !== null && context.price > 0) {
    matchedPoints = Math.round(context.price * config.pointsPerCurrencyUnit);
  }

  return { ...context, matchedPoints };
}
