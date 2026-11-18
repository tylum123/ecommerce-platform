# Catalog staging acceptance — 17/11/2026

The catalog capability is separate from legacy ERP/orders/customer data. Enable it only with verified Supabase sessions, a provisioned active admin identity, PostgreSQL catalog migrations and the explicit `NARI_CATALOG_ADMIN_ENABLED=true` / `NARI_CATALOG_BACKEND=postgres` gates. Non-admin staff do not have catalog mutation permission. Existing production authentication/shared limiter restrictions remain in force.

## Locally verified

- Admin service uses PostgreSQL for create/update, all editorial fields, English name, up to 30 images, specs, hide/restore and homepage banner replacement. SKU and slug are immutable after creation; stale product writes conflict.
- English name now reaches the product detail DTO and subtitle. The product detail gallery exposes all accepted images, including images 8–30. PostgreSQL detail subtitles do not synthesize a replacement when the English name is empty.
- URLs reject control characters, spaces and backslashes before browser normalization; banner client validation agrees with the server.
- Product and image upload handlers reject unavailable/guest/unauthorized requests before body parsing, database access or uploads. Route conflicts return 409; internal persistence errors remain private.
- Focused Node tests: 9/9 pass, zero skipped, including an in-memory PostgreSQL-compatible PGlite test. It checks field/media readback, storefront detail projection, stale writes, hide/restore, rollback after a second-image failure and banner replacement/clear. PGlite is isolated test data, not cloud acceptance.

Reproduce using an existing local PGlite installation (no application dependency is added):

```powershell
$env:NARI_TEST_PGLITE_PATH='C:/Users/MyPC/AppData/Local/Temp/nari-pg-review/node_modules/@electric-sql/pglite/dist/index.cjs'
node --test test/catalog-admin.test.cjs test/postgres-foundation.test.cjs
```

Without `NARI_TEST_PGLITE_PATH`, the integrated PGlite case explicitly skips; unit boundaries still run. Root runs lint/typecheck/build after the application freeze.

## Required cloud/browser acceptance

1. Configure real project credentials locally, review/apply catalog and identity migrations, provision an active admin identity. Do not paste secrets into chat. Confirm app and Storage target the same project.
2. Test guest, customer, inactive identity and each non-admin staff role: page/API access rejected; cross-origin cookie mutations rejected. Confirm legacy business APIs remain closed.
3. Create/edit a product with English name, 30 images, descriptions, ingredients, usage and specs. Refresh/restart and read back; confirm home/category/search/brand/product/cart/checkout use the authoritative catalog. Check the final image and updated subtitle on desktop/mobile. Verify unknown and hidden products do not fall back to snapshots.
4. Open two edits, save one, and verify the stale second write returns 409 without losing media. Hide/restore with refreshed versions.
5. Upload valid JPEG/PNG/WebP, reject fake MIME/oversize, and anonymously fetch the returned public URL. A successful upload response alone does not establish bucket publicity.
6. Reorder/replace/clear hero and side banners; refresh home. Replacement intentionally overwrites the entire list; concurrent banner editor conflict detection is not implemented.

Real Supabase/PostgreSQL migration, live roles/session lifecycle, durable restart and public Storage readback remain unverified. Product rich text is escaped as safe text until a maintained sanitizer is configured. Orders/inventory and other dependent operations remain disabled.

Rollback: keep the catalog-admin flag disabled; restore the previous approved application version. Database migrations and actual cloud data require their own reviewed backup/restore plan; no destructive rollback is automated here.

## Security follow-up — local verification

Public PostgreSQL reads now exclude demo products, brands and categories. Imported product/reference/image/banner sources must have `verification_state='merchant'` to publish; `observed`, `unverified` and `demo` remain visible to admin inspection only. A null source denotes direct merchant authoring through the admin workflow. Admin editing alone does not convert an imported record's verification state. This is separate from hidden/restore state.

JSON requests are capped at 512 KiB and multipart total requests at 5 MiB + 64 KiB using counted stream bytes before JSON/multipart parsing; `Content-Length` is an optional early rejection, not the enforcement mechanism. Upload file size/type validation still runs afterward.

Prepared `db/migrations/202611170002_catalog_runtime.sql` creates the non-login `nari_catalog_runtime` group with no superuser, database/role creation, replication or RLS bypass rights. It provides schema USAGE; SELECT on catalog sources/references/product/media/spec/banner data and provisioned identities; INSERT/UPDATE on products; INSERT/DELETE on images/specs/banners; and operation-specific server-only RLS policies. It grants no memberships, schema CREATE, identity writes, reference/source writes, branches/inventory/orders or sequence rights. It refuses a pre-existing group rather than silently altering privileges. Catalog and identity migrations must exist first.

After review, a separate non-owner LOGIN with INHERIT may receive membership in this group. Keep that credential private and use it for runtime; do not use the schema owner/superuser. Migration credentials stay separate. Production authentication gates remain unchanged.

```powershell
node scripts/push-supabase-schema.mjs --dry-run --catalog-runtime-only
# Only after explicit target/schema review:
# node --env-file=.env scripts/push-supabase-schema.mjs --apply --catalog-runtime-only
```

`test/catalog-security.test.cjs` adds streamed body tests without Content-Length and a PGlite non-owner test. The latter exercises SELECT/CRUD/hide/banner operations with the actual role, excludes mixed demo/unverified/merchant content, denies identity mutation and inventory/order/schema access, and confirms repeated migration fails safely. PGlite remains local preparation, not cloud acceptance. Root records cloud observations separately.

The public product projection carries `catalogSource: 'postgres'` into storefront cards. Cards display the managed English name and suppress generated gift-bill promotions when no promotion source exists. Empty managed English stays empty. Product detail related-item promotions use the same PostgreSQL guard; legacy development snapshot behavior is retained.

Final focused check for these waves: 16/16 tests passed, zero skipped, with the local PGlite path set, across `catalog-security.test.cjs`, `catalog-admin.test.cjs`, `postgres-foundation.test.cjs` and `campaign-routing.test.cjs`. The runtime-only migration dry run passed without opening a database connection. No cloud operation or environment change was performed by this worker.

## Reference authoring follow-up

The empty merchant catalog can now be bootstrapped explicitly through the admin product page: create a brand or category using an entered display label and slug, optionally select an existing parent category, then use those references in the product editor. No snapshot references are seeded. API actions `create_brand` / `create_category` reject unknown fields (including demo/source claims), malformed/empty labels and slugs. PostgreSQL enforces unique slugs and parent foreign keys; collisions return API 409. Reference updates/deletes are intentionally absent.

Prepared additive migration `202611170003_catalog_reference_authoring.sql` grants runtime INSERT only on brands/categories with RLS `NOT is_demo AND source_id IS NULL`. The previously applied 0002 migration is unchanged. Reference UPDATE/DELETE, provenance changes and business grants remain denied. The live checker now expects these two INSERT grants and 18 runtime policies after applying 0003. Root reviews/applies cloud SQL separately.

Local focused result after authoring changes: 12/12 pass, zero skipped (`catalog-security`, `catalog-admin`, `supabase-live-helper`, PGlite path set). Tests exercise actual nonowner merchant reference creation, category parent, duplicate409 mapping, missing-parent FK, API field rejection, forbidden demo/source inserts and denied reference update/delete. No cloud mutation was performed by this worker.
