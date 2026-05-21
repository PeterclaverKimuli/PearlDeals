# Admin Phase 1 Setup

Phase 1 adds the admin access foundation only.

## Environment

Use the same route segment value for the frontend and server:

```text
ADMIN_ROUTE_SEGMENT=23234
VITE_ADMIN_ROUTE_SEGMENT=23234
ADMIN_TOKEN=replace-with-a-long-random-secret
```

If the route segment variables are not set, local builds use `23234`.

## Routes

- Admin UI: `/23234/admin`
- Admin session API: `/api/admin/session`
- Protected admin health API: `/api/admin/health`

The plain `/admin` path is not an admin route.
