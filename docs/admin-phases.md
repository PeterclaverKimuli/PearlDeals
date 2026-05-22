# PearlDeals Admin Phases

This document is the single source of truth for the PearlDeals admin rollout.

## Phase 1: Admin Access Foundation

Status: implemented.

Phase 1 adds the hidden admin route and token-based access gate.

### Environment

Use the same route segment value for the frontend and server:

```text
ADMIN_ROUTE_SEGMENT=23234
VITE_ADMIN_ROUTE_SEGMENT=23234
ADMIN_TOKEN=replace-with-a-long-random-secret
```

If the route segment variables are not set, local builds use `23234`.

### Routes

- Admin UI: `/23234/admin`
- Admin session API: `/api/admin/session`
- Protected admin health API: `/api/admin/health`

The plain `/admin` path is not an admin route.

## Phase 2: Database Safety And Visibility

Status: implemented in code; database schema must be applied.

Phase 2 adds the data foundation for admin catalog safety.

### Schema

- `Product.hidden` soft-hides products from the public catalog.
- `AdminAuditLog` records future admin mutations.

### Public Catalog Behavior

Database-backed public catalog reads now require:

- product is not hidden
- product has at least one offer whose `scrapeStatus` is not `failed`

Static fallback deals are unchanged.

### Applying The Schema

Apply the Prisma schema to the target database before later admin write phases use `Product.hidden` or `AdminAuditLog`:

```powershell
npm.cmd run db:push:dev
```

Local app/API runtime prefers `DATABASE_URL_DEV` when it is configured and the app is not running in production. Production uses `DATABASE_URL`.

Use the existing production database workflow for production.

## Phase 3: Read-Only Admin Dashboard

Status: implemented.

Build the first admin dashboard using protected read-only APIs.

### APIs

- `GET /api/admin/summary`
- `GET /api/admin/products`
- `GET /api/admin/offers`
- `GET /api/admin/merchants`
- `GET /api/admin/scrape-runs`

### UI

Show:

- catalog counts
- product listing counts:
  - `visible`: product is not hidden and has at least one non-failed offer
  - `hidden`: product is manually hidden
  - `not listed`: product is not hidden but has no public-visible offers
- offer status counts
- merchant scrape health
- recent scrape runs and failures
- operational scrape/import command guidance

## Phase 4: Safe Admin Writes

Status: implemented.

Add guarded mutations for small direct Prisma updates.

### Actions

- hide/unhide product
- hide/unhide offer
- enable/disable merchant

Every mutation must:

- require an explicit confirmation payload
- write an `AdminAuditLog` entry
- refresh the relevant admin table after success

Production scrape/import jobs stay outside the web UI.

## Phase 5: Scrape Probe

Status: implemented.

Add an admin-only URL probe that checks whether a merchant product URL can be scraped before saving anything.

### API

- `POST /api/admin/scrape-probe`

Input:

```json
{ "url": "https://example.com/product" }
```

Output includes:

- scrapeable
- merchant candidate
- strategy used
- title
- image
- price
- original price
- status
- availability
- canonical URL
- warnings
- errors

### Behavior

- Try known merchant adapters first.
- If no adapter matches, try generic parsing from JSON-LD Product data, OpenGraph/meta tags, visible UGX/USh prices, availability text, and canonical URL.
- Reject unsafe URLs, private/internal network targets, localhost, invalid protocols, oversized responses, and slow responses.
- Do not write probe results to the database in v1.

## Phase 6: Product Creation Flow

Status: implemented.

Add the admin product creation workflow.

### Flow

- Admin pastes merchant product URLs.
- Each URL runs through scrape probe.
- Successful probes prefill offer fields.
- Admin can manually correct extracted values.
- Product can only be created once at least 3 valid visible merchant offers are present; admins may add more offers when available.
- Product and offers are created in one transaction.
- Creation writes an `AdminAuditLog` entry.

### API

- `POST /api/admin/products`

## Phase 7: Verification And Hardening

Status: planned.

Before treating admin v1 as ready:

- run `npm run build`
- verify admin auth rejects missing/invalid tokens
- verify `/admin` does not expose the admin UI
- verify `/${ADMIN_ROUTE_SEGMENT}/admin` requires auth
- verify scrape probe success and failure cases
- verify unsafe URL rejection
- verify product creation requires exactly 3 valid offers
- verify hidden products disappear from public catalog, search, and recommendations
- verify every admin mutation creates an audit log
- smoke test public storefront routes

## Assumptions

- Admin and storefront stay in the same repo.
- The hidden route is fixed per environment and stored in env.
- `ADMIN_TOKEN` is the real security mechanism.
- Product creation requires at least 3 visible merchant offers in v1.
- Generic scraping is for admin-assisted discovery, not guaranteed scheduled scraping.
- Scheduled production scraping remains limited to reviewed merchants.
