# n8n Workflow Setup — Product Catalog Sync

This document describes how to set up the n8n workflow that automatically
syncs products from all registered source sites on a schedule.

## Architecture

```
n8n (Scheduler + Orchestrator)
  ↓ POST /api/import?adapter=nicecnc
Your Next.js App (Import Logic)
  ↓ fetch products from source
Source Site (nicecnc.com)
  ↓ normalized products
Supabase (Database)
```

The import logic lives in your Next.js codebase, not in n8n. n8n simply
triggers the import via an HTTP request and handles scheduling + alerting.

## Workflow Setup

### 1. Schedule Trigger Node

- **Type**: Schedule Trigger
- **Rule**: Cron — `0 2 * * *` (daily at 2:00 AM)
- Or choose: Every 6 hours, every 12 hours, etc.

### 2. HTTP Request Node — Trigger Import

- **Method**: POST
- **URL**: `https://your-domain.com/api/import?adapter=nicecnc`
- **Headers**:
  - `Authorization`: `Bearer your-import-api-secret`
  - `Content-Type`: `application/json`
- **Timeout**: 300000 (5 minutes, for large catalogs)
- **Options**:
  - ✅ Continue On Fail: true (so the workflow can report errors)

### 3. IF Node — Check Success

- **Condition**: `{{ $json.success }}` equals `true`
- **True branch**: Log success
- **False branch**: Send alert

### 4a. True Branch — Success Notification (Optional)

- **Type**: Slack / Email / Discord
- **Message**: 
  ```
  ✅ Product sync completed
  Adapter: {{ $json.adapterKey }}
  Products: {{ $json.upsertedProducts }}/{{ $json.totalProducts }}
  Duration: {{ $json.durationMs }}ms
  ```

### 4b. False Branch — Error Alert

- **Type**: Slack / Email / Discord
- **Message**:
  ```
  🚨 Product sync FAILED
  Adapter: nicecnc
  Error: {{ $json.error }}
  ```

## Adding More Source Sites

To sync additional sources, either:

1. **Duplicate the HTTP Request node** for each adapter (different `?adapter=` param)
2. **Use a Loop node** with a list of adapter keys:
   - Set Items node: `["nicecnc", "other-store"]`
   - Loop Over Items → HTTP Request with `?adapter={{ $json.value }}`

## Environment Variables Needed

Make sure your deployed Next.js app has these env vars:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `IMPORT_API_SECRET` | Secret token for authenticating n8n requests |

## Testing Manually

You can test the import without n8n using curl:

```bash
curl -X POST "http://localhost:3000/api/import?adapter=nicecnc" \
  -H "Authorization: Bearer your-import-api-secret" \
  -H "Content-Type: application/json"
```

Or using the CLI runner directly:

```bash
npx tsx lib/importers/run-import.ts nicecnc
```
