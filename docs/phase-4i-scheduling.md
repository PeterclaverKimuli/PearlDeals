# Phase 4I Scheduling And Monitoring

Phase 4I moves scraping from manual pilots toward a conservative external schedule.
Scraping must stay outside Vercel API routes and frontend flows.

## Production-ready merchants

Use only these merchants for scheduled production scraping:

- `jumia`
- `kanta`
- `tilyexpress`

Do not schedule `jiji`. Jiji offers may stay visible, but Jiji scraping remains disabled.

## Required production environment

The external worker needs:

- `DATABASE_URL`
- `CONFIRM_PROD_WRITE=run-prod-scrape`
- the same Node/npm runtime used by the app

Do not set `DATABASE_URL_DEV` on a production worker unless the worker also runs DEV-only commands.

## Recommended first schedule

Start with one small merchant-scoped job per day:

```powershell
npm.cmd run scrape:prod:merchant -- --merchant=jumia --limit=10
```

Then add the other merchants only after the report stays healthy for a few days:

```powershell
npm.cmd run scrape:prod:merchant -- --merchant=kanta --limit=10
npm.cmd run scrape:prod:merchant -- --merchant=tilyexpress --limit=10
```

For Linux workers, use the equivalent npm command:

```bash
npm run scrape:prod:merchant -- --merchant=jumia --limit=10
```

## Preflight before scheduling

Run these manually before enabling a scheduled job:

```powershell
npm.cmd run phase4h:check:prod
npm.cmd run scrape:prod:merchant:dry-run -- --merchant=jumia --limit=10
npm.cmd run scrape:report:prod
```

## Monitoring

Use the read-only report after each pilot or scheduled run:

```powershell
npm.cmd run scrape:report:prod
```

To focus on one merchant:

```powershell
npm.cmd run scrape:report:prod -- --merchant=kanta
```

Watch for:

- high `failureCount` on recent runs
- growing hidden/failed offers
- repeated `404` URLs
- title mismatch validation failures
- unexpected failures from a merchant that was previously stable

## Rollback / pause

To pause scheduling, disable the external worker job first.

If a merchant starts failing badly, hide its offers only after a deliberate dry run:

```powershell
npm.cmd run offers:hide-merchant:prod:dry-run -- --merchant=kanta
$env:CONFIRM_PROD_WRITE='hide-kanta-offers-prod'; npm.cmd run offers:hide-merchant:prod -- --merchant=kanta
```

To restore manually hidden offers later:

```powershell
npm.cmd run offers:unhide-merchant:prod:dry-run -- --merchant=kanta
$env:CONFIRM_PROD_WRITE='unhide-kanta-offers-prod'; npm.cmd run offers:unhide-merchant:prod -- --merchant=kanta
```
