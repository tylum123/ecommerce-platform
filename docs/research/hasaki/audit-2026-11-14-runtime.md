# Runtime audit — 14/11/2026

Scope: read-only HTTP GET against the existing localhost server, without cookies or Authorization headers. No login, form submission, mutation, server start/restart, application edit or build. Only response status, field names, counts and public page headings were recorded; personal field values were neither printed nor saved. Source inspection used Codegraph. This report does not establish visual parity or browser interaction correctness.

## Runtime identity and limits

- `http://localhost:3000/` returned 200. Ports 3010 and 3020 refused connections (five-second discovery timeout). The initial coverage matrix contains 41 page URLs and 19 API URLs; all completed without timeout (12-second cap each). Five public pages were then re-probed to check their headings/no-result text.
- The running server does not match the expected current route set: `/api/ui-config` and `/api/ui-config?q=Bioderma` returned HTML 404, although `src/app/api/ui-config/route.ts` exists and both current `.next` route manifests contain this route. `.next/BUILD_ID` is `pYKlKdiEjIzp01RqAuDjG`, last written at 11:13:27 local. These observations do not identify the running process/build. `Get-NetTCPConnection` was denied access, so process attribution remains unverified.
- Root browser audit separately observed homepage JavaScript chunks `2s0-q5y4wyfrt.js` and `1nzhd6q8bk4d0.js` returning 500 and a CDN image 404. See `.playwright-mcp/console-2026-11-14T04-15-06-699Z.log`. Treat runtime coherence as a blocker for interactive acceptance. This worker did not use the shared browser or independently reproduce those browser observations.
- HTTP observations below apply to the server running during this audit. They do not prove the current working tree was served in full. No production deployment was audited.

## P0: guest data access is open

All endpoints below returned JSON 200 to a fresh guest request. Authentication/authorization rejection was not observed. The counts describe the current local dataset and do not establish whether records represent real people or fixtures. The protected field categories are exposed either way; this is not acceptable as production authorization.

| GET path | Safe response evidence |
| --- | --- |
| `/api/admin/users` | 8 users; fields include fullName, phone, email, address, tier, loyaltyPoints, totalSpent |
| `/api/admin/staff` | 8 staff; fields include fullName, email, phone, role, permissions, branchId |
| `/api/admin/orders` | 7 orders; fields include customerName, customerPhone, shippingAddress, totals, paymentStatus, assignedStaffName |
| `/api/admin/orders?includeKpis=true` | Same 7 orders plus kpis object |
| `/api/admin/inventory` | 30 inventory records plus 5 auditLogs; stock, branchStock, staffCode and movement fields |
| `/api/admin/seo` | ok, audit, sampleSchemas objects |
| `/api/orders` | 2 records in data; recipientName, recipientPhone, address and transaction fields |
| `/api/bookings` | 2 records in data; customerName, customerPhone, appointmentTime, doctorAssigned, note |
| `/api/auth` | 4 demoAccounts; username, passwordHint, label, badge, user fields plus totalUsers/totalStaff |

No `Cache-Control` header was present on the JSON 200 responses above. This is an observation, not a demonstrated shared-cache exploit.

`/quan-tri`, `/quan-tri?tab=users`, `/quan-tri?tab=orders` and all five known `/khach-hang/*` sections returned HTML 200 without a server redirect. Page HTTP 200 alone would not prove private data exposure, but the guest API responses independently establish that the server data boundary is open. Query variations are HTTP probes only; no ERP tab interaction was exercised.

Codegraph confirms the current source GET handlers for `/api/admin/users`, `/api/admin/orders`, `/api/orders` return repository records without an authentication check. `src/app/quan-tri/page.tsx` renders AdminErpView and `src/app/khach-hang/[section]/page.tsx` renders CustomerPortalView without a server guard in those page functions. The current auth source also contains demo-account login, public staff registration and identifier-based admin fallback; these were inspected only, not executed or accepted as live login tests.

## P1: unknown URLs serve unrelated or fabricated content

| GET path | Observed result |
| --- | --- |
| `/san-pham/unknown-runtime-audit.html` | 200; h1 is the CeraVe 473ml cleanser product, not an unavailable-product state |
| `/danh-muc/unknown-runtime-audit.html` | 200; h1 is Chăm Sóc Da Mặt |
| `/thuong-hieu/unknown-runtime-audit.html` | 200; heading manufactured from slug: Unknown Runtime Audit |
| `/tag/unknown-runtime-audit.html` | 200; heading manufactured from slug: Unknown Runtime Audit |
| `/khach-hang/unknown-runtime-audit` | 200, no redirect |
| `/api/products/unknown-runtime-audit.html` | JSON 404 with ok/error keys |
| `/dich-vu/unknown-runtime-audit.html` | HTML 404 |
| `/ho-tro/unknown-runtime-audit` | HTML 404 with Next not-found marker |
| `/missing-runtime-audit` | HTML 404 |

Current source explains the product/brand results: `src/app/san-pham/[slug]/page.tsx:52` returns the first catalog product for unknown slugs; `src/app/thuong-hieu/[slug]/page.tsx:32` generates a brand from an unknown slug, lines 70–74 copy default products with that brand, and lines 77–81 construct a brand description. This is stronger than a missing-page status bug: it creates misleading content and can conceal broken links. The API and page disagree about unknown product existence.

## HTTP route coverage

The following routes returned HTML 200. This means HTML was served, not that page controls, responsive layout, loading, client errors, persistence or source parity passed.

| Group | Probed routes |
| --- | --- |
| Catalog | `/`, `/danh-muc/cham-soc-da-mat-c4.html`, `/san-pham/nuoc-tay-trang-bioderma-danh-cho-da-nhay-cam-500ml-9740.html` |
| Brands | `/thuong-hieu`, `/thuong-hieu/bioderma.html` |
| Search | `/tim-kiem?q=Bioderma`, `/catalogsearch/result?q=cocoon`, `/tim-kiem?q=zzzz-runtime-audit` |
| Campaigns | `/deals-dang-dien-ra.html`, `/hang-moi-ve.html`, `/san-pham-ban-chay.html`, `/campaign/wow` |
| Cart | `/gio-hang`, `/thanh-toan` |
| Clinic | `/booking`, `/dat-lich-kham`, `/danh-muc/hasaki-clinic-spa-c331.html`, `/dich-vu-phong-kham.html`, `/bang-gia-dich-vu.html` |
| Information | `/he-thong-cua-hang`, `/cam-nang.html`, `/bao-hanh`, `/ho-tro` |
| Identity | `/dang-nhap`, `/quan-tri`, `/quan-tri?tab=users`, `/quan-tri?tab=orders` |
| Customer | `/khach-hang/tai-khoan`, `/khach-hang/don-hang`, `/khach-hang/lich-hen`, `/khach-hang/so-dia-chi`, `/khach-hang/diem-thuong` |

`/clinic` returned 307 with `Location: /danh-muc/hasaki-clinic-spa-c331.html`; redirects were not automatically followed. The destination was independently probed and returned 200. The no-result search response contained an explicit no-result message. These are server-response observations, without client interaction.

Other guest GET API coverage:

| Path | Status and shape |
| --- | --- |
| `/api/products` | 200; ok/data |
| `/api/stores` | 200; 24 data records, 12 cities, 24 districts |
| `/api/deals` | 200; ok/categories/data; 12 category records |
| `/api/bestsellers` | 200; ok/categories/data; 12 category records |
| `/api/warranty` | 200; ok/data |
| `/api/mcp` | 200; metadata listing 12 tools, 4 resources and 3 prompts; no tools invoked |
| `/api/codegraph` | 200; ok/timestamp/stats/manifest; no mutation tested |
| `/api/ui-config` | HTML 404; runtime/current-source mismatch described above |
| `/api/ui-config?q=Bioderma` | HTML 404 |

## Next acceptance work

1. P0: add server authentication and permission/ownership checks to protected pages, APIs and MCP operations; close guest data access and demo auth bypasses before any public release. Validate guest/customer/staff cases with controlled accounts and safe fixtures.
2. P0: establish which build/process serves port 3000 and obtain a coherent local runtime before interpreting browser failures or signing off the new UI config route. Restart/build decisions belong to the coordinating task; none was attempted here.
3. P1: replace unknown-slug fallbacks with truthful not-found behavior; distinguish unavailable snapshot content from catalog existence. Recheck unknown and known URLs at both page and API boundaries.
4. Re-run matched desktop/mobile visual and interaction checks after runtime coherence is restored. No screenshots, login, account ownership, order creation, checkout, booking, persistence after restart, mutation RBAC, MCP execution or payment acceptance is established by this report.

This audit changed documentation only; no lint/typecheck/build was run for this report.
