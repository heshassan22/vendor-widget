export type WidgetTheme = {
  primaryColor: string;
  welcomeMessage: string;
  buttonText: string;
  launcherLabel: string;
};

export type ProductRule = {
  match: 'sku' | 'brand';
  value: string;
  points: number;
};

export type WidgetTenantConfig = {
  tenantId: string;
  domain: string;
  tenantName: string;
  brand: string;
  theme: WidgetTheme;
  allowedOrigins: readonly string[];
  productRules: readonly ProductRule[];
  environment: 'production' | 'staging';
  channel: 'stable' | 'beta' | 'dev';
  eventsUrl: string;
  publicKey: string | null;
  publishableSecret: string | null;
};

export type ProductContext = {
  sku: string | null;
  brand: string | null;
  title: string | null;
  matchedPoints: number;
};

export type LoyaltyEventType =
  | 'page_view'
  | 'launcher_open'
  | 'identify'
  | 'add_to_cart'
  | 'checkout_success';
