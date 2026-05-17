# Vendor Loyalty Widget — full stack

A drop-in loyalty widget for any e-commerce product page plus the dashboard that
manages it. Vendors paste a single `<script>` tag into their store, our widget
detects products via JSON-LD/OpenGraph and tracks loyalty events back to a real
backend you control.

This repo runs on a single machine: one Node process serves the dashboard, the
widget CDN, the per-tenant config endpoint, and event ingestion. Cloudflare
Tunnel exposes it to the public internet so real shoppers on real stores hit
your laptop.

## What's in the box

- `server/` — Fastify + SQLite backend. Stateless except for `data.db`.
- `src/widget/` — the framework-agnostic widget runtime (`loader.js`,
  `widget.js`).
- `src/app/`, `src/lib/`, `src/components/` — the React dashboard SPA.
- `public/demo/` — a static "Vendor Mart" product page used for live demos.

## Quick start

```bash
cp .env.example .env             # tweak COOKIE_SECRET if you want
npm install
npm run dev                      # builds the widget once, then runs vite + tsx watch
```

Two ports come up:

- `http://localhost:3000` — backend (API, widget CDN, config endpoint, demo page).
- `http://localhost:5173` — Vite dev server for the dashboard, with proxies to
  `:3000` for `/api`, `/auth`, `/configs`, `/widget`, `/demo`, `/health`.

Sign in at `http://localhost:5173` with the seeded admin
(`admin@uniwidget.local` / `admin`) and you're in.

The seed script also creates a demo tenant `t_8f3a` mapped to the static demo
page at `http://localhost:3000/demo/after.html`. Open that page and the widget
launcher appears bottom-right.

## Production-ish run (single port)

```bash
npm run start
# builds the dashboard SPA + widget bundles, then serves everything from :3000
```

In this mode there is no Vite dev server. The dashboard, the widget CDN and
ingestion all share one origin so cookies and CORS just work.

## Exposing it to a real vendor

The widget is useful only when a real vendor pastes the snippet into their real
store. Use Cloudflare Tunnel to give them a public HTTPS URL pointing at your
local server.

```bash
# one-time install
npm run tunnel:install           # brew install cloudflared
# every test session
npm run tunnel
# prints something like https://random-words.trycloudflare.com
```

While the tunnel is up:

> The backend derives the public origin from the URL you opened the dashboard
> on (Fastify `trustProxy` honors `x-forwarded-proto` / `x-forwarded-host`).
> So as long as you sign in via the tunnel URL, every snippet, config
> `eventsUrl`, and session cookie is automatically correct for that tunnel.
> No `PUBLIC_BASE_URL` env juggling required when the tunnel URL rotates —
> just refresh the dashboard at the new URL and re-copy the snippet.

1. Open the printed URL in your browser, sign in to the dashboard.
2. Onboarding → fill in the vendor's name/brand/domain → "Continue". A tenant
   is created and a snippet is generated, e.g.

   ```html
   <script src="https://random-words.trycloudflare.com/widget/loader.js"
           data-domain-script="t_xy-mystore.shopify.com"
           type="module"></script>
   ```

3. Send that snippet to the vendor. They paste it inside `<head>` of their
   theme.
4. Open Integration in the dashboard. The page subscribes to a Server-Sent
   Events stream — every shopper page-view, launcher-open, add-to-cart, and
   checkout-success appears live.
5. Customize, Releases, Security Center, Product Mapping all PATCH the same
   tenant config. Vendor browsers pick up new configs after the next
   `stale-while-revalidate` window (≈60s).

For tip-of-the-spear realism, also point a small mock store at the tunnel URL
(or just open `https://<tunnel>/demo/after.html`) and click around — events
flow.

## Deploying to Render (free tier)

A `render.yaml` blueprint at the repo root provisions a single Node web service
on Render. It serves the dashboard, the widget CDN, and the events ingest
from one HTTPS hostname like `https://vendor-widget.onrender.com`.

Steps:

1. Push this repo to GitHub.
2. Render → New → Blueprint → connect the repo. Render reads `render.yaml`
   and creates the service. `COOKIE_SECRET` is auto-generated.
3. First deploy runs `npm install --include=dev && npm run build:widget` then
   `npm run start:prod`. Cold builds take 3–5 minutes.
4. Once it's live, the snippet generator already derives the public origin
   from the request (same machinery as the tunnel flow above) — open the
   dashboard at the `.onrender.com` URL and every copied snippet bakes that
   host automatically.

Caveats specific to Render's free tier:

- **Spin-down after 15 min idle.** The first request after a quiet period
  takes ~30 s to wake the service — vendor widget loads will lag during cold
  starts. Acceptable for a smoke test; not acceptable for production.
- **Ephemeral filesystem.** Each deploy creates a fresh container with no
  persistent disk. `data.db` is recreated from `seedIfEmpty()` on every
  boot, so any tenants you created in the dashboard disappear at the next
  deploy. The demo tenant + admin user are reseeded automatically. For
  persistence, attach Render's $7/mo persistent disk and set `DB_PATH` to
  point at the mounted volume, or move off SQLite.

## Smoke checklist

```bash
# 1. health
curl https://<tunnel>/health

# 2. config endpoint (used by the loader)
curl https://<tunnel>/configs/t_8f3a-store.vendor.com.json

# 3. signed event
node -e "
  const { createHmac } = require('node:crypto');
  const tenantId = 't_8f3a';
  const publicKey = '<from seed log or rotate-key>';
  const secret = '<paired secret>';
  const type = 'page_view';
  const sku = 'UNI-001';
  const customerId = 'demo';
  const timestamp = Math.floor(Date.now() / 1000);
  const message = [tenantId, type, sku, customerId, String(timestamp)].join(':');
  const signature = createHmac('sha256', secret).update(message).digest('hex');
  console.log(JSON.stringify({tenantId, publicKey, type, sku, customerId, timestamp, signature}));
"
```

## Architecture notes

- One Fastify process. Production-ish runs on `:3000`. Dev splits the
  dashboard onto Vite at `:5173` and proxies API calls to `:3000`.
- SQLite via `better-sqlite3`. Schema is created/migrated on boot in
  `server/db.ts`. Swap to Postgres later by replacing one module.
- Auth: argon2 is replaced with Node's built-in `scrypt` to avoid native
  toolchain pain. Sessions are HMAC-signed cookies (no JWT library).
- Widget HMAC: events sign `tenantId:type:sku:customerId:timestamp` with the
  per-tenant publishable secret. The secret is shipped inside the widget
  config — it is a tampering check / lite anti-spam, not real auth. Compromise
  costs only that tenant.
- Widget loader resolves both `widget.js` and the config URL relative to the
  loader's own `src`, so the same script works on `localhost`,
  `random-words.trycloudflare.com` and `mystore.shopify.com`.
- SPA route changes are detected by patching `history.pushState/replaceState`
  and listening for `popstate`.
- Live event stream uses Server-Sent Events via `EventSource`. No WebSocket,
  no Redis, no queue. Sufficient for two test shops.

## Troubleshooting

- **Dashboard says "Loading..." forever** — backend is down. Run
  `npm run server` separately to see logs, or check that `:3000` is bound.
- **Widget never appears on a vendor page** — open DevTools Console:
  - `[uniwidget] config fetch failed` → tunnel URL or `data-domain-script`
    don't match a real tenant.
  - `[uniwidget] origin not allowed` → add the vendor's origin under Security
    Center → Allowed origins (or `*` for testing).
  - No log at all → JSON-LD Product schema is missing or no rule matches; add
    a brand/sku rule under Product Mapping.
- **`Rollup failed to resolve import "/widget/widget.js"`** — already handled
  in `vite.config.ts` via `rollupOptions.external`. If you hit it again, that
  list is the place to look.
- **Events 401 with "invalid signature"** — likely a clock skew of more than
  5 minutes between vendor browser and server. NTP both ends.
- **Cloudflare tunnel URL changes every restart** — that's expected for
  `cloudflared tunnel --url`. For a stable URL, register a named tunnel with
  Cloudflare.
- **Existing `data.db` still has localhost in the demo tenant's allowed
  origins** — the seed only runs on an empty DB. Either edit the demo
  tenant's allowed origins to `*` via Security Center in the dashboard, or
  wipe `data.db data.db-shm data.db-wal` and restart to re-seed.

## What is intentionally out of scope

- Email sending (no password-reset flow).
- Multi-region / horizontal scaling.
- Real CDN. Configs and widget bundles serve from the Fastify process.
- Plugins for Shopify / WordPress. The snippet is just `<script>`.
- Observability. The events table doubles as the debug log.
