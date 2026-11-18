# Campaign/tag route correction — 17/11/2026

Supported metadata currently contains `/campaign/wow` and two tags: `dai-tiec-hang-hieu.html` and `deal-for-men.html`. Extensionless tag URLs normalize to the corresponding observed tag. Other slugs call `notFound()` on the server before reading catalog data; `/campaign/wow.html` is not an observed alias.

Both known templates now await `readStorefrontCatalog()` on the server and accept explicit product props. Their browser components no longer import a separate product/new-arrival pool, invent prices, discounts, ratings or flash-deal membership. Layout, filters, editorial banners and cart controls remain in their existing templates. The highest-discount promotional headline was replaced with neutral program text; the default sort no longer claims to rank bestsellers by price.

The observed editorial dataset has no verified product memberships. Consequently both development and PostgreSQL campaign/tag lists are deliberately empty until a membership source is supplied; catalog existence or brand/price alone does not establish participation. The membership projection accepts only explicit slugs present in current catalog data and filters hidden rows.

Focused validation: `node --test test/campaign-routing.test.cjs` checks supported metadata, unknown 404 before database access, awaited authoritative reads for both campaign entry points and tag page, explicit membership, current zero prices, absent ratings and no hidden/snapshot resurrection. Browser/HTTP observation and integration lint/typecheck/build are performed by Root after freeze.

CI now watches both `main` and `master` for pushes/PRs. Local `branch.main.merge` points to `refs/heads/main`; the existing `master` target is retained. CI executes explicit authorization/catalog/route test files in addition to existing lint/typecheck/build. Existing action versions are unchanged. The PGlite case explicitly skips without its optional local module path and is not reported as cloud acceptance.

Rollback consists of restoring only the route/view/helper/test/workflow changes in this wave; no cloud data, schema or business capability gate is changed.
