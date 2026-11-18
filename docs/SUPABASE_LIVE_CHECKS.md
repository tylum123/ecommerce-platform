# Restricted Supabase operational checks

`scripts/verify-supabase-live.mjs` uses the application's actual `postgresPoolConfig` through the existing TypeScript development dependency. It does not load `.env` itself, install packages, import catalog data, create admin users, enable business gates or print raw errors/credentials/connection URLs. Run from the repository with Node 24 and dependencies installed.

```powershell
node --env-file=.env scripts/verify-supabase-live.mjs --database
node --env-file=.env scripts/verify-supabase-live.mjs --storage-setup
node --env-file=.env scripts/verify-supabase-live.mjs --storage-check
node --env-file=.env scripts/verify-supabase-live.mjs --storage-check --path catalog/EXISTING_OBJECT.png
```

Database mode requires verified TLS and the existing application connection/statement timeouts. It checks the current non-owner role, runtime-group inheritance, dangerous role flags, table grants, schema CREATE denial, RLS/policy presence and current row counts. It probes identity/inventory UPDATE denial using `WHERE false` inside transactions that always roll back. It does not modify rows or grant privileges. Counts contain no customer/identity/product records. A failure exits nonzero with a generic safe error code.

The current checker expects additive migration `202611170003_catalog_reference_authoring.sql` after the original runtime group migration: brand/category INSERT is allowed through merchant-only RLS policies, UPDATE/DELETE remain denied, and total runtime policies are 18. An installation still on 0002 deliberately fails the new grant/policy expectation until 0003 has been reviewed and applied. This helper does not apply that migration.

Storage setup inspects only `nari-catalog`. If absent it creates that bucket as public, limited to 5 MiB and JPEG/PNG/WebP. If an existing bucket differs, it fails instead of overwriting its configuration. The service-role key stays server-side; setup changes cloud bucket configuration and should be run only for the reviewed target project. The helper does not create broad Storage SQL policies.

Storage check verifies the same bucket restrictions without uploads/configuration changes. Optional `--path` anonymously downloads an existing `catalog/NAME.png|jpg|jpeg|webp` object, requires an allowed response MIME and a nonempty body no larger than 5 MiB. It rejects redirects and oversized readback. Without a path it reports `publicReadback:false`; policy inspection alone is not proof of public object retrieval. Upload a valid object through the separately authorized app flow before requesting readback.

These commands report only the checks they actually perform. A successful database/bucket check does not establish provider login, product CRUD, application restart, storefront browser behavior, or production readiness. Root records actual target and live results in handoff; local unit checks are not cloud acceptance.

Local-only checks (no credentials/network):

```powershell
node --check scripts/verify-supabase-live.mjs
node scripts/verify-supabase-live.mjs --help
node --test test/supabase-live-helper.test.mjs
```
