# Báo cáo kiểm tra clone Hasaki

## Checkpoint 23/11/2026 (Frontend Loader, Skeleton & Lazy Load) — Tối Ưu Tải Mượt Chuyển Trang, Code-Splitting & Shimmer UI

- **Các khoảng cách tải trang & hiệu năng UX đã đóng (đã xác minh qua build & unit tests):**
  - **Global Route Loader & CSS Shimmer:** Bổ sung [`route-progress-bar.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/route-progress-bar.tsx) (dùng ref thuần, không `setState` trong `useEffect`) bọc `<Suspense>` trong [`src/app/layout.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/app/layout.tsx), cùng `@keyframes nari-shimmer`, `.nari-shimmer`, `.nari-route-progress`, `.nari-img-frame`, `.nari-smooth-img` (tôn trọng `prefers-reduced-motion`) trong [`src/app/globals.css`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/app/globals.css).
  - **Route Skeletons đồng bộ 8 route:** Tạo [`ui-skeletons.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/ui-skeletons.tsx) (Server-Component safe, `aria-busy="true"`), cập nhật [`src/app/loading.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/app/loading.tsx) và bổ sung `loading.tsx` cho 7 route trọng yếu (`san-pham/[slug]`, `danh-muc/[slug]`, `thanh-toan`, `booking`, `tra-cuu-don-hang`, `khach-hang/[section]`, `quan-tri`).
  - **Code-Splitting (`next/dynamic`) & Smooth Image:** Tạo [`lazy-reveal.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/lazy-reveal.tsx) và [`smooth-image.ts`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/lib/smooth-image.ts); tách bundle `AccountDialog`, `LocationDialog`, `StorefrontCartDrawer` trong [`header.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/header.tsx), `ProductRichSections` trong [`catalog-view.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/catalog-view.tsx), và `AdminErpView` qua [`admin-erp-loader.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/admin-erp-loader.tsx) tại [`src/app/quan-tri/page.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/app/quan-tri/page.tsx); gắn lazy + shimmer frame cho [`product-card.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/product-card.tsx) & [`home-view.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/home-view.tsx) (giữ `priority` cho ảnh hero LCP).
  - **Client Fetch Skeleton & Button Spinner (`Loader2`):** Phủ trạng thái đang tải cho tìm kiếm nhanh (`header.tsx`), Mini Cart Drawer (`storefront-cart-drawer.tsx`), đặt hàng (`checkout-view.tsx`), lịch hẹn (`booking-view.tsx`), tra cứu đơn (`src/app/tra-cuu-don-hang/page.tsx`) và quản trị sản phẩm (`admin-products-view.tsx`).
- **Bằng chứng kiểm chứng & Trạng thái Deploy:**
  - `node --test test/*.mjs test/*.cjs` (cập nhật [`test/frontend-ux.test.cjs`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/test/frontend-ux.test.cjs) và alignment stub ở [`test/access-policy.test.mjs`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/test/access-policy.test.mjs)): **`92` passed, `0` failed** (`13` PGlite tests skipped khi `NARI_TEST_PGLITE_PATH` unset, khớp CI).
  - `npm run typecheck`: **PASS** (`0` errors); `npm run lint`: **PASS** (`0` errors, `0` warnings).
  - `npm run cf:build`: **PASS** (exit `0`, tạo mới `.open-next\worker.js`, `22/22` static pages + `ƒ Proxy (Middleware)`). Chưa chạy `npx wrangler deploy` trong phiên này; bundle OpenNext đã build sẵn sàng deploy lên `https://nari-home.tylum123.workers.dev` khi chủ dự án yêu cầu.

## Checkpoint 20/11/2026 (Frontend UX Optimization & Live E2E Demo) — Đóng Khoảng Cách Responsive Mobile, Encoding, UX Giỏ Hàng & Xác Minh End-to-End

- **Các khoảng cách giao diện đã đóng trên bản Live (`https://nari-home.tylum123.workers.dev`, Version ID `7debffc8-0af4-40dc-975b-7dd9e584deb8`):**
  - **Encoding Tiếng Việt dưới Logo:** Đã sửa `.env` UTF-8 và thêm `sanitizeBrandString()` trong [`src/lib/brand-config.ts`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/lib/brand-config.ts) để ngăn double-encoded Latin-1 lọt ra UI.
  - **Bố cục Trang chủ & Mobile 390px:** Loại bỏ vùng trống bên phải Hero (`.hero-layout--single`), hiển thị sản phẩm PostgreSQL thật ngay trên đầu trang, bỏ quick-link/thương hiệu mẫu không có dữ liệu, sửa tràn ngang trên viewport 390px (`scrollWidth === 390`), và ngăn rớt ký tự `₫` trên thẻ sản phẩm ở lưới hẹp.
  - **Đồng bộ Bảng màu & Copy Production:** Loại bỏ các nút/chip xanh lá cũ (`#226c47`, `#eaf5ed`, `#eef7f2`) và chữ `"sản phẩm mẫu"` / `"mô phỏng"` còn sót trong `catalog-view.tsx`, `product-rich-sections.tsx`, `cart-view.tsx`, thay bằng đồng nhất Luxury Silk & Espresso (`#3d2e24`, `#b86b4b`, `#faf5f0`).
  - **UX Giỏ hàng & Chuyển đổi:** Bổ sung Toast + Mini Cart Drawer ([`storefront-cart-drawer.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/storefront-cart-drawer.tsx)) kèm thanh tiến độ **Miễn phí giao nhanh NariNow 2H (90K)**, Quick-Add trên thẻ sản phẩm, **MUA NGAY** đi thẳng `/thanh-toan`, thanh CTA cố định mobile, **Sao chép mã đơn** + tự điền `?code=` ở `/tra-cuu-don-hang`, và `src/app/loading.tsx`.
- **Kiểm chứng & Demo E2E Live:** `node --test test/*.mjs test/*.cjs` (**88 passed, 0 failed**, `13` PGlite skipped), `npm run typecheck` (`0` lỗi), `npm run lint` (`0` lỗi), `npx wrangler deploy` (`gzip: 2153.48 KiB`), Chrome CDP Demo E2E tạo & tra cứu đơn thật **`NARI-20261120-331B233E`** (`0909888777`) thành công với `0` console/page errors.

## Checkpoint 20/11/2026 (Plans 1, 2, 3 & 5 Live) — Đóng Khoảng Cách Font, Webhook Thanh Toán, Admin ERP PostgreSQL & Customer Portal

- **Đã đóng trên Production Workers (`https://nari-home.tylum123.workers.dev`, Version ID `1ba6e313-29a9-4cd9-9812-685a7c3c2214`):**
  - **Local Fonts (Plan 5):** Loại bỏ hoàn toàn phụ thuộc mạng Google Fonts lúc build (`next/font/google` = `0` kết quả trong `src/`), sử dụng 5 file `.ttf` local OFL đầy đủ dấu Tiếng Việt tại `src/app/fonts/`.
  - **Checkout & Payment Webhook (Plan 3):** Trang `/thanh-toan` tải danh sách chi nhánh thật từ PostgreSQL (`branch-hcm-q1` xác nhận trong SSR HTML) kèm lựa chọn `NariNow 2H` / `Tiêu chuẩn`; `/api/payments/webhook` xác thực HMAC-SHA256 + chống replay + idempotency + transaction ACID (fail-closed `503` khi chưa bật secret); `/api/orders` & `/api/bookings` tự động gắn `userId` từ phiên Supabase hợp lệ.
  - **Admin ERP PostgreSQL & Supabase RBAC (Plan 1):** Xóa hoàn toàn `src/lib/server/erp-store.ts`; các route `/api/admin/{users,staff,orders,inventory}` và trang `/quan-tri` chuyển sang [`postgres-erp-service.ts`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/lib/server/postgres-erp-service.ts) + `authorizeBusinessRequest` sau cổng `NARI_ERP_ADMIN_ENABLED="true"`; gỡ bỏ demo role switcher và bổ sung lối vào `/quan-tri` trong [`account-dialog.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/account-dialog.tsx), [`supabase-login-form.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/supabase-login-form.tsx) & [`admin-products-view.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/admin-products-view.tsx).
  - **Customer Auth & Customer Portal (Plan 2):** Hoàn thiện đăng ký (`/dang-ky`, `/api/auth/register`), khôi phục mật khẩu (`/khoi-phuc-mat-khau`, `/api/auth/recovery`), `/auth/callback` PKCE, và cổng khách hàng `/khach-hang/*` + `/api/customer/portal` đồng bộ `nari_identity.customer_profiles`, đơn hàng và lịch hẹn clinic.
  - **Bằng chứng kiểm chứng:** `node --test test/*.mjs test/*.cjs` (`84` passed, `0` failed; `13` PGlite skipped khi `NARI_TEST_PGLITE_PATH` unset), `npm run typecheck` (`0` errors), `npm run lint` (`0` errors, `0` warnings), `npm run cf:build` (`exit 0`), `npx wrangler deploy` (`Total Upload: 10359.29 KiB / gzip: 2144.22 KiB`, `Worker Startup Time: 287 ms`), `npm run db:verify` (`ok: true`, `wave3Applied: true`, `runtimePolicies: 44`, `deniedWrites: true`), và live HTTPS probes đều đúng hợp đồng (`200` storefront/auth pages, `307` private pages, `401` admin/customer APIs, `503` webhook).
- **Khoảng cách được chủ dự án chủ động giữ nguyên (ngoài phạm vi — bỏ Kế hoạch 4):**
  - `/api/warranty`, `/api/analytics`, `/api/mcp` nối DB và Clinic live slot availability không triển khai theo yêu cầu bỏ Kế hoạch 4.
  - Quản lý nhân sự qua web (`POST`/`PATCH /api/admin/staff`) giữ trạng thái chỉ đọc (`501 STAFF_PROVISIONING_OUT_OF_BAND`) nhằm giữ nguyên bất biến bảo mật `nari_catalog_app` chỉ có quyền `SELECT` trên `nari_identity.provisioned_identities`.
  - Cấu hình vận hành sau này nếu cần: nạp `NARI_PAYMENT_WEBHOOK_SECRET` qua `wrangler secret put` trước khi bật `NARI_PAYMENT_WEBHOOK_ENABLED="true"`, và khai báo Redirect URLs `/auth/callback`, `/khoi-phuc-mat-khau` trong Supabase Auth Dashboard.

## Checkpoint 19/11/2026 (Cloudflare Workers Live) — Đóng khoảng cách Triển khai Cloudflare Workers & Hyperdrive

- **Đã đóng trên Production Workers (`https://nari-home.tylum123.workers.dev`):**
  - Đã hoàn tất triển khai OpenNext (`@opennextjs/cloudflare@1.20.17` trên `next@16.4.6`, `wrangler@4.164.0`) với Version ID `f498b0c4-f468-4005-80b6-3d3dbad8361b`, bundle `10200.13 KiB` (`gzip: 2114.25 KiB`, `Worker Startup Time: 210 ms`) và `8` Wrangler secrets.
  - Khắc phục lỗi `workerd` cross-request I/O bằng `readHyperdriveConnectionString()` + `createHyperdriveDatabase()` (tạo `pg.Client` riêng mỗi `query`/`transaction` và đóng trong `finally`) gắn Hyperdrive `nari-supabase-db` (`650301fdebbf4bdfac223cb90ddaa1cd`); `test/postgres-foundation.test.cjs` đạt `7/7` pass.
  - Live HTTPS probes sau khi nạp secrets đều pass đúng hợp đồng: `GET /` `200` (`42090` bytes), `GET /api/products` (2 sequential + 2 concurrent `Promise.all`) đều `200`, `GET /api/stores` (2 sequential) đều `200` (`"source":"postgres"`), `GET /api/session` (unauthenticated) `401`, `GET /api/admin/products` (unauthenticated) `401` (`AUTHENTICATION_REQUIRED`), `POST /api/orders` (no origin) `403` (`FORBIDDEN_ORIGIN`).
  - `npm run lint` (`0` errors, `0` warnings), `npx next typegen` + `npm run typecheck` (`0` errors), `node --test test/*.mjs test/*.cjs` (`77` passed, `0` failed; `10` PGlite skipped khi `NARI_TEST_PGLITE_PATH` unset), và `npm run ops:doctor -- --live` (`Supabase DB: OK`, `wave3Applied: true`, `runtimePolicies: 44`, `Cloudflare Wrangler: OK` `tylum123@gmail.com`) đều đạt.
- **Khoảng cách & Hạng mục còn lại:**
  - `npm run ops:supabase -- login` vẫn là bước TTY thủ công của chủ dự án (`~/.supabase/access-token` chưa tạo; `SUPABASE_ACCESS_TOKEN` trống).
  - Các khoảng cách tính năng ứng dụng tiếp theo: seed danh mục sản phẩm / chi nhánh / dịch vụ clinic thật của Nari Home vào Supabase, thay `erp-store.ts` in-memory trong `/api/admin/*`, nối Customer Portal (`/khach-hang/*`) & đăng ký/khôi phục mật khẩu với Supabase Auth + `customer_profiles`, bật `/api/payments/webhook` + bộ chọn chi nhánh ở `/thanh-toan`, nối live slot availability + `/api/warranty` + `/api/analytics` + `/api/mcp`, và chuyển `next/font/google` sang `next/font/local`.

## Checkpoint 18/11/2026 (Cloud Live Wave 3) — Đóng khoảng cách Schema Cloud & Xác thực Wrangler OAuth

- **Đã đóng thêm trên Cloud Live:**
  - Thực thi xong 3 migration Wave 3 (`202611180001..0003`) trên Supabase Project `ywrzguhuzekkusoupehf`; `npm run db:verify` xác nhận `wave3Applied: true`, `runtimePolicies: 44`, `rls: true`, `deniedWrites: true`, `verifiedTls: true` dưới role runtime `nari_catalog_app`.
  - Bật `NARI_SHARED_RATE_LIMIT=postgres`, `NARI_ORDERS_ENABLED=true`, `NARI_BOOKINGS_ENABLED=true` trong `.env` và xác nhận `npm run ops:doctor -- --live` pass cả `Supabase DB` lẫn `Cloudflare Wrangler` (OAuth `tylum123@gmail.com`).
- **Còn lại ngoài phạm vi tự động (chủ dự án tự thao tác):**
  - Chạy `npm run ops:supabase -- login` trong terminal tương tác (CLI từ chối non-TTY) và chọn/triển khai Cloudflare (`tylum123.workers.dev`).

## Checkpoint 18/11/2026 (Giai đoạn 1–4) — Pure PostgreSQL, Nari Home UI & CLI Supabase/Cloudflare

- **Đã đóng triệt để:**
  - Loại bỏ 100% SQLite (`node:sqlite`, `sqlite-db.ts`, `schema.sql`, `hasaki-local.db`) khỏi runtime và test; chỉ còn một assertion âm tính trong `test/postgres-foundation.test.cjs` xác minh hệ thống từ chối `NARI_CATALOG_BACKEND=sqlite`.
  - Xóa sạch toàn bộ dữ liệu cào & định danh Hasaki (`docs/research/hasaki/`, `scripts/scrape-*.mjs`, HTML snapshot), chuyển toàn bộ UI sang `src/components/sites/nari/` và MCP helper sang `src/lib/mcp/nari-mcp.ts`, `git grep -in "hasaki"` trả về `0` kết quả trên `src/ public/ scripts/ test/ next.config.ts package.json .env.example db/`.
  - Hoàn thiện mã nguồn + migration + test cho 3 mạch FE↔BE trên PostgreSQL: Auth/Next 16 `proxy.ts`/Distributed Rate Limit (`202611180001`), ACID Orders + `FOR NO KEY UPDATE` + Idempotency (`202611180002`), Chi nhánh & Clinic Booking `EXCLUDE USING gist` (`202611180003`), với `85/85` test Node/PGlite PASS, `typecheck`/`lint` 0 lỗi, `npm run build` cô lập PASS.
  - Sẵn sàng điều phối đa nền tảng qua `supabase` (`3.2.0`) và `wrangler` (`4.164.0`) (`npm run ops:doctor`, `ops:supabase`, `ops:cf`, `db:push`, `db:verify`).
- **Khoảng cách Cloud còn lại (bị chặn bởi cấu hình `.env` runtime-only):**
  - `.env` hiện kết nối bằng role runtime `nari_catalog_app` (không có quyền `CREATE SCHEMA` / `CREATE EXTENSION`) và chưa có `SUPABASE_ACCESS_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`.
  - Vì vậy Wave 3 SQL (`202611180001..0003`) **chưa được đẩy lên Supabase Cloud** (`verify-supabase-live.mjs --database` xác nhận `wave3Applied: false`, `runtimePolicies: 18`), và các cờ `NARI_SHARED_RATE_LIMIT`, `NARI_ORDERS_ENABLED`, `NARI_BOOKINGS_ENABLED` vẫn tắt có chủ đích (fail-closed `503`) cho đến khi chạy `--apply --wave3-backend` bằng `DATABASE_URL` quyền owner.

## Checkpoint 18/11/2026 — Đóng khoảng cách API Catalog/Quote & Đồng bộ Git

- **Đã đóng:**
  - `/api/products` không còn vấp `CATALOG_LEGACY_SQLITE_DISABLED` khi bật `NARI_CATALOG_BACKEND=postgres` (đã chuyển `queryProducts` sang `await readStorefrontCatalog()`).
  - `/api/products/[slug]` không còn fallback rating/sold/xuất xứ giả lập trong chế độ PostgreSQL.
  - `/api/cart/quote` đã tách khỏi `sqlite-db.ts` khi chạy `postgres` và tính giá 100% từ server (`readStorefrontCatalog()`), từ chối SKU lạ/số lượng sai và bỏ qua `item.price` client gửi.
  - Xác nhận live Supabase (`verify-supabase-live.mjs --database` & `--storage-check`) đạt với 18 runtime policies (`0003` đã có trên cloud).
- **Khoảng cách còn lại:**
  - Sản phẩm thật trong `nari_catalog.products` hiện bằng 0 (chỉ có 1 banner hero; `scripts/prepare-snapshot-catalog.mjs` vẫn còn 145 mục quarantine chưa xử lý provenance/SKU).
  - `NODE_ENV=production` auth gate vẫn bị đóng do chưa có distributed rate limiter trên PostgreSQL; toàn bộ luồng Orders/Inventory/ERP/Booking/Warranty/Webhook/MCP vẫn đóng có chủ đích (Bước 2–4).
  - `src/middleware.ts` vẫn giữ cấu trúc cũ (cần chuyển `src/proxy.ts` + hợp nhất Supabase Principal ở Bước 2).

## Checkpoint 17/11/2026 (Wave F — Chuẩn bị môi trường & cấu hình đẩy Schema lên Supabase)

- **Chuẩn bị môi trường (cục bộ):** `hydrogen-env` đã rà soát toàn bộ `process.env` qua CodeGraph, cập nhật `.env.example` và tạo `.env` mẫu (được `.gitignore` bỏ qua). `hydrogen-migration` đã kiểm tra `db/migrations/202611160001_catalog_inventory.sql` và `db/migrations/202611170001_identity.sql`, tạo `scripts/push-supabase-schema.mjs` (`--dry-run`, `--apply`, `--with-roles`).
- **Kiểm chứng cục bộ đạt:** `node --test test/postgres-foundation.test.cjs` (5/5 pass), `node scripts/push-supabase-schema.mjs --dry-run` (exit 0), `node scripts/push-supabase-schema.mjs --dry-run --with-roles` (exit 0), `git check-ignore -v .env` (pass).
- **Khoảng cách / Blocker còn lại:** Chưa thực thi `--apply` lên Supabase cloud và chưa nghiệm thu PostgreSQL/Storage/Auth thật trên staging do đang chờ người dùng điền thông tin kết nối thật vào `.env`. Lệnh sẵn sàng sau khi điền `.env`: `node --env-file=.env scripts/push-supabase-schema.mjs --dry-run --with-roles` và `node --env-file=.env scripts/push-supabase-schema.mjs --apply` (thêm `--with-roles` nếu áp dụng cả identity SQL).

## Checkpoint bảo mật/backend 17/11/2026 — Wave A/B freeze, chưa nghiệm thu tích hợp

- **Identity (worker report):** focused tests 15/15 pass; Supabase dependencies và `@types/pg` đã pin; `/api/session` local-only qua `NARI_AUTH_ENABLED`, production unavailable 503 và `businessAccess: false`. Production TypeScript check sau khi loại bỏ check trùng chưa chạy lại. Provider role SQL chưa áp dụng.
- **Catalog (worker report):** PostgreSQL pool/transaction và Storage adapter; public catalog async, authoritative từ PostgreSQL, không fallback khi nguồn lỗi/rỗng. SQLite chỉ là default dev; production cần PostgreSQL. Membership cho deals/bestseller/new-arrivals rỗng chờ migrate; admin mutations vẫn đóng. Worker báo 5 foundation tests, PGlite và SQLite storage readback pass.
- **Kiểm tra Root:** 10 file `node --test` đạt 36/36; typecheck pass; lint exit 0, 0 errors và 1 warning cũ (`campaigns-location.ts`, unused `brandText`); isolated production build pass exit 0, 369/369 pages. Cảnh báo middleware deprecated/external lockfile chưa xử lý; build sandbox ban đầu lỗi fetch Google Fonts, retry được duyệt network pass. Chưa có browser cuối sau freeze. Baseline trước đó trên dev cô lập 3035 xác nhận home desktop/mobile không overflow; login unavailable; console có auth 401. HTTP private endpoints đều denied. Unknown tag vẫn 200 và chưa sửa vì Wave D đã dừng.
- **Backlog chưa làm:** Wave C orders/inventory và Wave D route/CI chưa triển khai. Không coi worker reports là nghiệm thu tích hợp hay tuyên bố backlog hoàn tất.
- **Blockers staging:** chưa có cấu hình/credential Supabase hoặc PostgreSQL trong môi trường, chưa áp dụng migration/cloud changes, chưa kiểm tra PostgreSQL server thật hoặc provision Storage bucket/roles.

## Bàn Giao Kiểm Tra Wave 7 — Interactive Hover/Click DOM Scraping & Data-Driven Backend — 14/11/2026

1. **Giải quyết khoảng cách tương tác Hover & Click trên giao diện gốc Hasaki.vn**:
   - Đã xây dựng và chạy script Playwright [scripts/scrape-hasaki-interactive-ui.mjs](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/scripts/scrape-hasaki-interactive-ui.mjs) điều khiển trình duyệt Chrome thao tác `hover` và `click` trực tiếp vào các vùng tương tác trên `https://hasaki.vn/`, lưu kết quả tại [interactive-ui-2026-11-14.json](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/docs/research/hasaki/interactive-ui-2026-11-14.json) và ảnh chụp đối chiếu tại `docs/design-references/02-search-popup-click.png`, `03-category-filters.png`, `04-deals-flash-slots.png`, `05-product-detail-tabs.png`.
   - **Search Popup khi Click**: Khắc phục hoàn toàn việc ô tìm kiếm trước đây chỉ là input tĩnh. Hiện tại khi click/focus mở popup hiển thị 3 pill chiến dịch xanh lá, 6 thẻ danh mục kèm ảnh thumbnail, 8 logo thương hiệu nổi bật, và tự động gợi ý sản phẩm/thương hiệu trực tiếp khi nhập từ khóa.
   - **Mega Menu 3 cột khi Hover `DANH MỤC`**: Khắc phục việc menu danh mục trước đây chỉ là danh sách 1 cột cần phải click. Hiện tại hỗ trợ cả `hover` và `click`, hiển thị 3 cột (Danh mục gốc `Sức Khỏe - Làm Đẹp` bên trái, 3 nhóm danh mục con & dịch vụ ở giữa, 6 logo thương hiệu nổi bật bên phải).
   - **Thẻ Sản Phẩm & Trang Danh Mục**: Bổ sung dải 8 Logo Thương hiệu đầu trang Danh mục, cây danh mục `Sức Khỏe - Làm Đẹp` đầu sidebar, bộ chọn `Hiển thị 40 / 60 / 80`, dòng phụ đề tiếng Anh, chỉ số lượt bán `🛒 XX/tháng` và tag quà tặng viền cam đứt nét `🎁 Bill ... Tặng ...`.
   - **Trang Chi Tiết Sản Phẩm (`/san-pham/[slug]`)**: Bổ sung thanh Sticky Top Bar khi cuộn trang, huy hiệu `Số công bố với Bộ Y Tế : 278237/25/CBMP-QLD`, thanh `⚡ FLASH DEAL GIÁ SỐC`, nút chọn biến thể `Công dụng` có ảnh thumbnail, nút chọn `Dung Tích` (`100ml`, `250ml`, `500ml`, `Combo 1000ml`) tự động tính lại giá bán, nút `📍 Còn X/186 CH có hàng` kết nối trực tiếp tồn kho đa chi nhánh ERP qua `/api/ui-config?slug=...`, và cột phải `- MIỄN PHÍ VẬN CHUYỂN -` với 4 cam kết dịch vụ chính hãng.
2. **Giải quyết khoảng cách Kiến Trúc Backend Data-Driven Không Hardcode**:
   - Mọi dữ liệu từ khóa tìm kiếm, danh mục gợi ý, thương hiệu, cấu trúc Mega Menu, quà tặng theo hóa đơn và chính sách vận chuyển đều được phục vụ tập trung từ [src/lib/interactive-ui.ts](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/lib/interactive-ui.ts) và API [src/app/api/ui-config/route.ts](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/app/api/ui-config/route.ts), đồng bộ với kho ERP (`src/lib/server/erp-store.ts`) và đăng ký đầy đủ trong CodeGraph Manifest (`src/lib/server/db.ts`).

---

## Bàn Giao Kiểm Tra Toàn Diện 6 Wave & Đóng Các Khoảng Cách (Gap Resolution) — 13/11/2026

Báo cáo chi tiết kết quả xử lý các khoảng cách chức năng (gap analysis) qua 6 đợt nâng cấp toàn diện dự án Hasaki Clone, chuyển đổi từ mô hình frontend tĩnh sang hệ thống thương mại điện tử & phòng khám da liễu hoàn chỉnh:

### 1. Giải quyết khoảng cách Dữ liệu (Task 1 — Full Live Hasaki Data Scraping)
- **Trước đây**: Chỉ có 8 sản phẩm mẫu và 28 danh mục với nhiều danh mục trống (soft 404), ảnh placeholder hoặc phụ thuộc snapshot rải rác.
- **Hiện tại**: Đã đóng toàn bộ khoảng cách dữ liệu bằng 9 bộ dataset JSON scraping thực tế từ `https://hasaki.vn/` lưu tại `docs/research/hasaki/`:
  - `deals-2026-11-13.json`: Dữ liệu Flash Deals, Shock Deals, Deal Tabs theo 4 khung giờ thực tế có tỷ lệ bán hàng và countdown timer.
  - `bestsellers-2026-11-13.json`: Top bán chạy thực tế kèm lượt bán và rating sao.
  - `category-products-2026-11-13.json`: 35 danh mục chuẩn Hasaki × 8 sản phẩm thật/danh mục (280+ sản phẩm chi tiết).
  - `category-facets-2026-11-13.json`: 14 nhóm facet lọc thuộc tính đa chiều chuẩn Hasaki.
  - `brand-catalog-2026-11-13.json`: 488 thương hiệu A-Z và 13 thương hiệu Flagship hàng đầu.
  - `product-rich-details-2026-11-13.json`: Bảng thông số, bảng thành phần INCI, hướng dẫn, đánh giá verified và Q&A.
  - `clinic-rich-details-2026-11-13.json`: Bảng giá dịch vụ da liễu, quy trình 7-12 bước, cẩm nang y khoa.
  - `campaigns-home-2026-11-13.json`: Banner chiến dịch trang chủ và danh mục hành chính 34 tỉnh/thành phố, quận/huyện tra cứu NowFree 2H.
  - `support-footer-2026-11-13.json`: Mạng lưới 260+ cửa hàng, FAQs, chính sách đổi trả/bảo hành.

### 2. Giải quyết khoảng cách Storefront & Điều Hướng (Task 2 — Facet Filter 14 Nhóm & Màn Hình Con)
- **Trước đây**: Bộ lọc danh mục chỉ lọc cơ bản theo thương hiệu, thiếu hầu hết các tiêu chí lọc sâu của Hasaki; nhiều màn hình con quan trọng chưa có route local hoặc dẫn về anchor trang chủ.
- **Hiện tại**:
  - `src/lib/category-facets.ts` & `catalog-view.tsx`: Xây dựng bộ lọc đa chiều 14 nhóm facet Hasaki (Loại da, Công dụng, Xuất xứ, Kết cấu, Dung tích, Thành phần nổi bật, Vấn đề về da, Loại sản phẩm, Đặc tính, Giới tính, Màu sắc, Dòng sản phẩm, Khoảng giá, Thương hiệu) đồng bộ URL query params hai chiều.
  - Toàn bộ các route con chính yếu đã được hiện thực hóa và kiểm tra đạt 100%:
    - `/bang-gia-dich-vu.html`: Bảng giá dịch vụ Clinic & Spa trực quan, có bộ lọc nhóm dịch vụ và máy tính dự toán đặt hẹn.
    - `/cam-nang.html`: Cẩm nang làm đẹp & chuyên môn da liễu, tab chuyên đề và modal đọc bài viết chi tiết.
    - `/san-pham/[slug]`: Trang chi tiết sản phẩm 5 tab tích hợp toàn bộ 9 bộ dataset.
    - `/thuong-hieu/[slug]`, `/campaign/[slug]`, `/tag/[slug]`: Trang thương hiệu, sự kiện khuyến mãi và phân nhóm chủ đề.
    - `/deals-dang-dien-ra.html`, `/san-pham-ban-chay.html`, `/he-thong-cua-hang`, `/ho-tro`, `/bao-hanh`: Hoạt động mượt mà, phản hồi HTTP 200.

### 3. Giải quyết khoảng cách Xác Thực & Phân Quyền (Task 3 — Auth & RBAC)
- **Trước đây**: Modal tài khoản chỉ là giao diện thử nghiệm, chưa có lưu trữ phiên, không có đăng nhập/đăng ký thật, không phân quyền.
- **Hiện tại**:
  - Hệ thống Auth thống nhất tại `src/lib/auth.ts`, `/api/auth`, `/dang-nhap`, `account-dialog.tsx`.
  - Hỗ trợ đầy đủ luồng Đăng nhập, Đăng ký cho Khách hàng (`customer`) và Nhân viên Quản trị (`admin`, `warehouse_staff`, `clinic_doctor`).
  - Cung cấp 4 tài khoản Demo 1-Click (`admin@hasaki.vn`, `kho@hasaki.vn`, `bacsi@hasaki.vn`, `0901234567`) thuận tiện cho việc kiểm thử và nghiệm thu.
  - Header badge hiển thị tên, điểm thưởng loyalty, avatar và nút điều hướng tương ứng với vai trò người dùng (`/quan-tri` hoặc `/khach-hang/tai-khoan`).

### 4. Giải quyết khoảng cách Quản Trị & Vận Hành Doanh Nghiệp (Task 4 — Enterprise ERP Portal)
- **Trước đây**: Hoàn toàn chưa có hệ thống quản trị nội bộ; đơn hàng và giỏ hàng chỉ lưu tạm tại client.
- **Hiện tại**: Cung cấp cổng quản trị doanh nghiệp hoàn chỉnh tại `/quan-tri` kết nối với `src/lib/server/erp-store.ts` bao gồm 4 module:
  1. *CRM & Khách hàng (`/api/admin/users`)*: Phân hạng thành viên, tích điểm thưởng, quản lý hồ sơ da, khóa/mở tài khoản.
  2. *Nhân sự & Phân quyền RBAC (`/api/admin/staff`)*: Quản lý nhân viên theo ca trực, phân bổ chi nhánh, cấp quyền chức năng.
  3. *Xử lý Đơn hàng Fulfillment (`/api/admin/orders`)*: Quản lý vòng đời đơn hàng 7 trạng thái, theo dõi SLA NowFree 2H, gán kho xuất hàng.
  4. *Quản lý Tồn kho 5 Chi Nhánh (`/api/admin/inventory`)*: Theo dõi tồn kho thực tế, tồn kho giữ chỗ (reserved), xuất/nhập/điều chuyển kho có ghi audit log.

### 5. Giải quyết khoảng cách Technical SEO & Tích Hợp AI (Task 5 — SEO Engine & MCP Server)
- **Trước đây**: Chưa có sitemap động, thiếu Schema.org chuẩn, chưa có API kết nối các agent AI.
- **Hiện tại**:
  - Technical SEO hoàn thiện: `sitemap.xml` tự động bao phủ toàn bộ URL, `robots.txt` chuẩn, hệ thống tạo Schema.org JSON-LD cho Organization, Product, MedicalClinic, Breadcrumbs, FAQs, và công cụ chấm điểm SEO Health Scorer 100 điểm tại `/api/admin/seo`.
  - Standardized AI MCP Server tại `/api/mcp` tuân thủ chuẩn JSON-RPC 2.0 cung cấp 8 Tools, 5 Resources, 3 Prompts phục vụ tương tác đa tác tử AI và tích hợp sẵn AI Playground trực quan trong trang Admin.

### 6. Thống Kê Kiến Trúc CodeGraph (Task 6 — CodeGraph Metrics)
- **Quy mô codebase**: 160+ files, 1.757+ nodes, 3.241+ edges, 56+ routes, 266+ functions, 110+ interfaces.
- **Chất lượng mã nguồn**: TypeScript Strict Mode 100%, không sử dụng kiểu `any`, không có lỗi phụ thuộc vòng (zero circular dependencies).

### 7. Các điểm lưu ý cho môi trường Production thực tế
- Tích hợp cổng thanh toán thực tế (VNPAY / MoMo / ZaloPay IPN webhook) khi chuyển sang môi trường live merchant.
- Tích hợp dịch vụ SMS Brandname OTP thực tế (hiện tại hỗ trợ mã xác thực tiêu chuẩn trong môi trường test/demo).
- Cấu hình Redis Cache cho dữ liệu tồn kho phân tán khi lượng truy cập vượt ngưỡng 10.000 req/s.

---

## Checkout local — 13/11/2026

- Đối chiếu nguồn: trong context Playwright riêng, thêm Bioderma vào giỏ mở hộp đăng nhập và số giỏ vẫn 0; `/checkout/cart` cũng hiện hộp đăng nhập. Không nhập tài khoản hoặc tạo đơn nguồn, nên chưa quan sát được giỏ có hàng, checkout hay đối chiếu bố cục/tương tác checkout. [Ảnh nguồn trạng thái đăng nhập](design-references/cart-source-empty-desktop.png); tư liệu hướng dẫn luồng nằm trong inventory.
- `/thanh-toan` chuyển sang `src/components/sites/hasaki/checkout-view.tsx`: họ tên, SĐT theo pattern 10 chữ số bắt đầu 0 và địa chỉ bắt buộc; ghi chú, chọn thanh toán COD/trực tuyến minh họa, xem lại, sửa giỏ. Phí/thời gian giao chưa tính, không phát sinh request hay đơn hàng; thông tin chỉ ở state trang, không lưu localStorage. Tên/giá sản phẩm vẫn là mẫu hoặc snapshot.
- Playwright kiểm tra luồng sản phẩm → giỏ → checkout, trường trống, SĐT sai, điền dữ liệu giả, chọn trực tuyến, xem lại, không request khác GET trong thời gian quan sát, không tràn ngang 390px; production 3020 xác nhận có hàng và form trống chưa hợp lệ. Lint/build đạt. Ảnh local [desktop](design-references/checkout-local-desktop.png), [mobile](design-references/checkout-local-mobile.png); không có ảnh checkout nguồn tương ứng nên chưa khẳng định giống nguồn.
- Còn thiếu: địa chỉ theo khu vực, lựa chọn vận chuyển khả dụng, voucher, phí, xác thực và tích hợp backend/đơn hàng/thanh toán; cần khảo sát nguồn có quyền truy cập phù hợp và xác minh luồng thực trước khi đánh giá hoàn thiện.

## Tài khoản local — 13/11/2026

- Nút tài khoản header và nút tài khoản nổi trang chủ mở `src/components/sites/hasaki/account-dialog.tsx`: form đăng nhập, chuyển đăng ký/quên mật khẩu, hiện/ẩn mật khẩu, kiểm tra trường HTML và đóng bằng Escape. Dùng hộp thoại native; nhập và gửi chỉ hiển thị thông báo chưa kết nối. Captcha/OTP bị vô hiệu hóa, không lưu hoặc xác thực thông tin; social login cũng chưa kết nối. Có liên kết sang Hasaki để thực hiện thật.
- Playwright kiểm tra chuyển đăng ký → đăng nhập → quên mật khẩu, OTP bị vô hiệu, nhập dữ liệu giả và gửi thông báo, đóng Escape, nút nổi trên mobile và không tràn ngang 390px. Trên production 3018, gửi đăng nhập giả không phát sinh request khác GET trong thời gian quan sát; nút đóng hoạt động trên trang thương hiệu. Lint/build đạt. Ảnh đăng nhập desktop [nguồn](design-references/account-source-form-desktop.png), [local](design-references/account-local-form-desktop.png); đăng ký desktop [nguồn](design-references/account-source-register-desktop.png), [local](design-references/account-local-register-desktop.png); đăng ký mobile [nguồn](design-references/account-source-register-mobile.png), [local](design-references/account-local-register-mobile.png).
- Còn khác: nguồn có menu tài khoản trước modal, captcha/OTP, OAuth, ngày sinh chọn ba trường và các quy tắc xác thực thực; local mở thẳng modal, dùng trường ngày và chưa có backend. Nguồn ở 390px có chiều rộng tài liệu 1171px. Không thao tác đăng nhập, yêu cầu OTP hoặc gửi dữ liệu trên nguồn.

## Chi tiết dịch vụ Clinic — 13/11/2026

- Tạo 42 route `/dich-vu/[slug]` từ snapshot Clinic; ảnh và phụ đề của 42 trang nguồn được khảo sát, 26 ảnh chi tiết tải được, các trang khác dùng ảnh danh sách. Dữ liệu bổ sung tại `docs/research/hasaki/clinic-service-details-2026-11-13.json`; route/hiển thị do `src/lib/clinic-services.ts`, `src/app/dich-vu/[slug]/page.tsx`, `src/components/sites/hasaki/service-view.tsx` phụ trách. Giá, thời lượng và nội dung chỉ là snapshot.
- Playwright quan sát nút nguồn chuyển `/booking?sku=900130022`; local kiểm tra thẻ Clinic → chi tiết → booking điền đúng dịch vụ, anchor đánh giá, slug lạ 404 và không tràn ngang 390px. Bản production cổng 3017 trả 200 cho 42 URL và 404 slug lạ; lint và build đạt. Ảnh desktop: [nguồn](design-references/service-source-desktop.png), [local](design-references/service-local-desktop.png); mobile: [nguồn](design-references/service-source-mobile.png), [local](design-references/service-local-mobile.png). Các ảnh có thể khác cookie và trạng thái tải.
- Chưa có biến thể, ảnh phụ, breadcrumb đầy đủ, mô tả dài, thống kê, đánh giá/hỏi đáp, sidebar và trạng thái đặt hẹn thật. Các mục đánh giá/hỏi đáp và mô tả đầy đủ dẫn nguồn; không tự tạo dữ liệu. Chưa khảo sát đầy đủ từng trạng thái mobile/toàn trang.

## Clinic & Spa local — 13/11/2026

- Nguồn `/clinic` chuyển sang `/danh-muc/hasaki-clinic-spa-c331.html`; local giữ hành vi route đó. Template `src/components/sites/hasaki/clinic-view.tsx`, route tĩnh ưu tiên trên dynamic category, banner/ảnh từ nguồn. `docs/research/hasaki/clinic-services-2026-11-13.json` chứa 57 thẻ tìm thấy trong DOM; 42 thẻ có link booking được dùng trong danh sách, giá và thông tin là snapshot, có thể thay đổi. Ba nhóm danh mục và chi tiết dịch vụ vẫn mở nguồn.
- Lọc giá áp dụng cho 42 dịch vụ, giá thấp/cao sắp trên snapshot; Mới nhất/Bán chạy giữ thứ tự ghi nhận và được chú thích. Nút Đặt hẹn nối `/booking?sku=...`, điền tên dịch vụ đúng mã; SKU lạ không điền gì. Chưa tạo lịch thật, chưa có API, giá/khả dụng thực hay phân trang.
- Playwright kiểm tra 42 thẻ, khoảng giá sai, lọc 100.000–200.000 còn 10, xóa lọc, giá tăng (49.000, 100.000, 100.000), không tràn ngang 390px; production 3016 xác nhận redirect, SKU hợp lệ và SKU lạ. Lint/build đạt. Ảnh 1440px [nguồn](design-references/clinic-source-desktop.png), [local](design-references/clinic-local-desktop.png); 390px [nguồn](design-references/clinic-source-mobile.png), [local](design-references/clinic-local-mobile.png). Chưa so sánh toàn trang và mọi trạng thái; nguồn hiển thị cookie, header Clinic, thống kê đánh giá/lượt mua, sidebar bài viết và 163 dịch vụ, local còn thiếu.

## Booking local — 13/11/2026

- Nguồn `https://hasaki.vn/booking` → local `/booking`, do `src/app/booking/page.tsx` và `src/components/sites/hasaki/booking-view.tsx` phụ trách; lối tắt Đặt Hẹn trên trang chủ trỏ local. Ghi nhận 19 chi nhánh và URL ảnh tại `docs/research/hasaki/booking-branches-2026-11-13.json`; đây là snapshot, không đảm bảo còn hiện hành.
- Nguồn hiển thị thông tin khách, chi nhánh cuộn ngang, dịch vụ và ngày giờ cùng trang. Local có chọn chi nhánh, tuần, ngày và khung giờ minh họa; kiểm tra số điện thoại, trường bắt buộc và xem lại nội dung mẫu. Không có backend, không gửi thông tin, không xác nhận lịch thật hoặc tình trạng còn chỗ; liên kết Hasaki cho người dùng đặt trực tiếp.
- Playwright dùng dữ liệu thử: kiểm tra lỗi số điện thoại, chọn chi nhánh/dịch vụ, chuyển tuần, chọn giờ, xem lại, cuộn chi nhánh, reset giờ khi đổi tuần, liên kết trang chủ và không tràn ngang ở 390px. Lint và build đạt; production trên cổng 3014 trả 200, có 19 chi nhánh và 7 ngày. Ảnh 1440px: [nguồn](design-references/booking-source-desktop.png), [local](design-references/booking-local-desktop.png); 390px: [nguồn](design-references/booking-source-mobile.png), [local](design-references/booking-local-mobile.png). Các ảnh full-page không phải cùng trạng thái biểu mẫu; nguồn đã chọn chi nhánh trong ảnh mobile và local có dữ liệu thử.
- Còn khác: header Clinic riêng, dữ liệu dịch vụ/khả dụng theo chi nhánh thời gian thực, quy tắc xác thực nguồn, kết quả sau đặt hẹn, liên kết Clinic phụ và responsive cần kiểm tra thêm. Không thao tác gửi lịch trên nguồn. Ảnh chi nhánh tải từ nguồn bên ngoài.

## Thông số chi tiết và inventory — 13/11/2026

- Lấy bảng thông số quan sát được cho 28/40 sản phẩm mới, lưu tại `docs/research/hasaki/new-product-details-2026-11-13.json`; 12 sản phẩm chưa có bảng trong lần đọc. Thêm mục Mô tả, Thông số, HDSD, Đánh giá, Hỏi đáp; phần thiếu dữ liệu chỉ dẫn tới nguồn, không giả lập đánh giá hay thông số. Giá, thông số và ảnh là snapshot; ảnh phụ thuộc CDN.
- Playwright production xác nhận anchor Thông số đưa đến bảng Cocoon chính xác, liên kết đánh giá trỏ nguồn và không tràn ngang 390px; [ảnh local](design-references/new-product-specs-local-desktop.png). Lint và build đạt sau khi cài thêm CodeGraph. Inventory và phương án: `docs/research/hasaki/feature-inventory-and-delivery.md`.

## Chi tiết hàng mới — 13/11/2026

- 40 route ảnh chụp được thêm vào `/san-pham/[slug]`; thẻ hàng mới mở local, chi tiết dùng ảnh, tên và giá đã ghi nhận; giỏ mẫu nhận diện được sản phẩm. Khảo sát nguồn sản phẩm Cocoon: [desktop](design-references/new-product-source-desktop.png), [mobile](design-references/new-product-source-mobile.png); local: [desktop](design-references/new-product-local-desktop.png), [mobile](design-references/new-product-local-mobile.png).
- Playwright xác nhận điều hướng từ thẻ đầu, tăng số lượng lên 2, thêm giỏ, tổng 870.000 đồng, xóa giỏ và không tràn ngang tại 390px. Bản production trên 3011 đã kiểm tra menu Hàng mới và nút Mua ngay đưa sản phẩm vào giỏ; lint và build đạt. `next start` cảnh báo cấu hình standalone. Nguồn tại 390px có chiều rộng tài liệu 1170px. Giá chỉ là dữ liệu ghi nhận, thanh toán là demo.
- Chưa có mô tả và thông số riêng, đánh giá, hỏi đáp, biến thể, tồn kho, hình bổ sung, ưu đãi và dịch vụ; trang khác nhiều so với nguồn. Cần tiếp tục khảo sát template và các nút. Ảnh phụ thuộc CDN.


## Hàng mới về — 13/11/2026

- Route `/hang-moi-ve.html?sort=position` dùng 40 sản phẩm đầu ghi nhận ngày 13/11/2026 tại `docs/research/hasaki/new-arrivals-2026-11-13.json`. Ảnh tải từ CDN Hasaki; dữ liệu giá có thể đã thay đổi.
- Playwright kiểm tra 40 thẻ, lọc Cocoon còn 3, xóa lọc, khoảng giá sai có thông báo, lọc 100.000–400.000 còn 23, sắp giá tăng và URL `?sort=price_asc`, không tràn ngang 390px. Lint và build đạt. Ảnh desktop: [nguồn](design-references/new-arrivals-source-desktop.png), [local](design-references/new-arrivals-local-desktop.png); mobile: [nguồn](design-references/new-arrivals-source-mobile.png), [local](design-references/new-arrivals-local-mobile.png).
- Thiếu phân trang, nhiều bộ lọc, lượng bán, ưu đãi và footer; nút bán chạy giữ thứ tự ảnh chụp vì chưa có dữ liệu thứ hạng. Giá là ảnh chụp; ảnh phụ thuộc CDN.

## Bán chạy local — 13/11/2026

- Route `/san-pham-ban-chay.html?sort=topsale` dùng tám sản phẩm mẫu, chưa có thứ hạng thực; lọc thương hiệu và sắp xếp giá trên mẫu đã kiểm tra. Còn thiếu dữ liệu, bộ lọc, phân trang và footer.

## Flash Deal local — 13/11/2026

- Đã dựng `/deals-dang-dien-ra.html?product_list_order=topsale` từ khảo sát Playwright, header và Xem tất cả trỏ vào local. Lọc theo một số danh mục mẫu dùng `filter_category`, ví dụ `2474` (Phụ Kiện Điện Thoại); `Tất cả` reset. Danh mục chưa có dữ liệu hiển thị rỗng; nút thêm sản phẩm vào giỏ mẫu hoạt động. Mặc định giữ thứ tự dữ liệu mẫu, chưa có dữ liệu bán chạy hay khuyến mãi thực; giá và sản phẩm được ghi rõ là mẫu.
- Playwright xác nhận 8 sản phẩm mẫu, lọc còn một Anker, thêm vào giỏ, trạng thái rỗng, reset về 8 và không tràn ngang ở 390px. Lint và production build đạt. Ảnh 1440 × 900: [nguồn](design-references/deals-source-desktop.png), [local](design-references/deals-local-desktop.png); 390 × 844: [nguồn](design-references/deals-source-mobile.png), [local](design-references/deals-local-mobile.png). Ảnh, nội dung, các danh mục, bộ đếm, thứ tự thực và mobile còn khác; chưa coi template là hoàn thiện.
- Đã bắt đầu khảo sát `/san-pham-ban-chay.html?sort=topsale`; [ảnh nguồn](design-references/bestsellers-source-desktop.png). Trang local bán chạy, hàng mới, campaign, Clinic và booking vẫn chưa dựng; các liên kết đó hiện mở Hasaki. Tài khoản và thanh toán thật chưa có backend; chưa kiểm thử toàn bộ chức năng frontend.

## Tiếp tục điều hướng và nút trang chủ — 13/11/2026

- Khảo sát Playwright trang chủ Hasaki: menu Deals, Hot Deals, Hàng mới, Bán chạy, Clinic, Dermahair và các lối tắt có URL riêng. Header local đã trỏ tới đúng trang nguồn đối với các trang chưa dựng; Thương hiệu và các danh mục đã có vẫn mở local. Lối tắt trang chủ và Xem tất cả Deals/Clinic được sửa tương tự. Các URL ngoài sẽ rời bản clone; chưa phải các trang con local hoàn chỉnh.
- Các tab gợi ý lọc theo danh mục trong bộ dữ liệu mẫu, có trạng thái rỗng; Xem thêm tăng số thẻ từ 6 lên 8. Danh mục không biết trả 404 trong dev. Playwright xác nhận menu danh mục → chăm sóc da, tab phụ kiện điện thoại có một sản phẩm, tab thiết bị âm thanh rỗng, và các href menu/shortcut. Ở 390 × 844, kiểm tra không tràn ngang và luồng tìm kiếm Bioderma → sản phẩm → thêm giỏ → xóa giỏ thành công. Không kiểm tra giao dịch thật.
- Ảnh đầu trang desktop 1440 × 900 [nguồn](design-references/navigation-source-desktop.png), [local](design-references/navigation-local-desktop.png); mobile 390 × 844 [nguồn](design-references/navigation-source-mobile-top.png), [local](design-references/navigation-local-mobile.png). Nguồn có cookie và tài nguyên khác; các ảnh cho thấy mobile và banner còn khác đáng kể. Chưa kiểm tra toàn trang/mọi trạng thái.
- `npm.cmd run lint` và `npm.cmd run build` đạt; build bao gồm TypeScript. Giới hạn: đa số route campaign/Clinic/booking chưa được dựng local; tìm kiếm và sản phẩm dùng dữ liệu mẫu, tài khoản/địa chỉ/checkout vẫn là giao diện mẫu; những nút và trang con khác chưa được kiểm thử đầy đủ. Không khẳng định toàn bộ chức năng đã giống nguồn.

## Loop 3 — sản phẩm và thương hiệu — 13/11/2026

- Playwright đã mở trang nguồn sản phẩm Bioderma và thương hiệu Bioderma; tab Deals nguồn đổi URL thành `?tab=Deal`. Ảnh 1440 × 900 đầu trang: sản phẩm [nguồn](design-references/loop3-product-source-1440.png), [local](design-references/loop3-product-local-1440.png); thương hiệu [nguồn](design-references/loop3-brand-source-1440.png), [local](design-references/loop3-brand-local-1440.png). Ảnh là mẫu tại thời điểm chụp, không chứng minh toàn bộ trạng thái hay mobile giống nguồn.
- Lần sửa 1: product slug không biết trả 404 trong dev; breadcrumb dựa danh mục thay vì luôn gắn chăm sóc da mặt. Đã thêm danh mục Phụ Kiện Điện Thoại có sẵn trong dữ liệu Anker; liên kết breadcrumb tới danh mục được Playwright mở. Product card dùng chung cho danh mục và thương hiệu; sản phẩm liên quan chỉ lấy cùng danh mục, thông báo khi thiếu dữ liệu. Tên thương hiệu trên sản phẩm dẫn tới trang thương hiệu khi có mapping.
- Thương hiệu: lọc giá/danh mục, tìm kiếm, xóa bộ lọc, sắp xếp giá và tab Deals hoạt động với sản phẩm mẫu. Deals chỉ chọn `price < old` trong mẫu, không xác nhận khuyến mãi thực. Playwright xác nhận tìm kiếm có/không có kết quả, lọc giá rỗng, báo khoảng giá sai, reset, chọn danh mục, trạng thái nút sort, tab Deals, điều hướng sản phẩm → thương hiệu → danh sách, và thương hiệu Avène không có sản phẩm. Một thương hiệu hiện chỉ có tối đa một sản phẩm mẫu; thứ tự sort hai chiều được kiểm thử đơn vị với dữ liệu giả lập riêng, không đưa vào catalogue.
- `node --test test/brand-filter.test.mjs`: 2 test đạt. `npm.cmd run lint` và `npm.cmd run build` đạt, build bao gồm TypeScript. Lint ban đầu báo liên kết nội bộ dùng `<a>`; lần sửa 2 đổi sang Next Link. Playwright kiểm tra bản production trên cổng 3002: slug sản phẩm lạ trả 404, Bioderma trả 200. `next start` cảnh báo cấu hình standalone; vẫn xác nhận được các phản hồi trên. Không kiểm tra giao dịch thật.
- Còn thiếu: dữ liệu, giá, khuyến mãi, biến thể, tồn kho và đánh giá thực; Deals chỉ là phép lọc giá mẫu; tìm kiếm/sort/filters chưa được đối chiếu toàn bộ hành vi nguồn; banner, logo, footer, responsive và layout product còn khác. Category slug không biết vẫn có soft 404; nhiều route campaign/Clinic/booking thiếu. Các trang account và checkout vẫn demo. Cảnh báo hydration trong dev chưa xác định nguyên nhân.

## Loop 2: trang chi tiết thương hiệu — 12/11/2026

- Loop 1 đã dùng Playwright kiểm tra cả Hasaki và local; ảnh trang chủ [nguồn](design-references/hasaki-source-1440.png), [trước](design-references/hasaki-local-before-1440.png), [sau](design-references/hasaki-local-after-1440.png); ảnh danh mục [nguồn](design-references/category-source-1440.png), [sau](design-references/category-local-after-1440.png). Các sửa đã kiểm tra gồm khung/trật tự trang chủ, layout danh mục bốn cột, lọc Bioderma, xóa lọc và sắp xếp giá; trang thương hiệu có danh sách và liên kết Bioderma. Xem các mục lịch sử bên dưới để biết phạm vi và hạn chế của từng phép kiểm tra.
- Loop 2 chọn `/thuong-hieu/bioderma.html`: Playwright trong context riêng, 1440 × 900, đầu trang. [Nguồn](design-references/loop2-brand-source-1440.png), [local trước](design-references/loop2-brand-local-before-1440.png), [local sau](design-references/loop2-brand-local-after-1440.png). Nguồn có biểu ngữ cookie; local không có. Ảnh/banner local là minh họa theo lựa chọn của người dùng. Khung desktop rộng 1800px tối đa là chủ ý trước đó, khác nguồn.
- Lần sửa 1/5: đưa mô tả Bioderma đã quan sát vào đầu trang, điều chỉnh thanh điều hướng, thêm vùng banner và bố cục sidebar/danh sách. Bộ lọc, sắp xếp, Deals và thông tin chưa có dữ liệu được ghi rõ thay vì tạo kết quả giả. Playwright xác nhận một liên kết sản phẩm mẫu đi đến trang chi tiết và không tràn ngang tại 1440px. Không kiểm tra đối chiếu mobile hoặc toàn trang trong vòng này.
- `npm.cmd run lint` và `npm.cmd run build` thành công, build bao gồm TypeScript. Cảnh báo workspace root của Turbopack vẫn xuất hiện. Dev console báo một warning; chưa xác định nguyên nhân.
- Ưu tiên còn lại: dữ liệu sản phẩm thực và filter/sort/search/Deals của trang thương hiệu, banner và logo, footer và mobile; các route campaign, Clinic và đặt lịch còn thiếu hoặc dẫn tới anchor; soft 404 category/product và breadcrumb sản phẩm sai; checkout/tài khoản chỉ là demo. Không suy ra độ chính xác hay hoàn thiện từ ảnh chụp đầu trang.

## Tiếp nối: đối chiếu Playwright — 12/11/2026

### Danh sách và trang con thương hiệu — vòng 1/5

- Khảo sát menu nguồn: `/deals-dang-dien-ra.html?product_list_order=topsale`, `/campaign/wow`, `/thuong-hieu`, `/hang-moi-ve.html?sort=position`, `/san-pham-ban-chay.html?sort=topsale`, `/clinic`, `/danh-muc/dermahair-c2298.html`. Các mục chưa triển khai vẫn cần mapping và kiểm thử, không coi là hoàn thành.
- Trang `/thuong-hieu` được tạo theo [ảnh nguồn](design-references/brands-source-1440.png) với danh sách chữ cái và 488 tên/đường dẫn được trích tại thời điểm khảo sát trong [dữ liệu](research/hasaki/brands-source.json). Ảnh và logo là khung tạm. Nút menu và “Xem tất cả” thương hiệu trên trang chủ dẫn đến trang mới. [Ảnh local](design-references/brands-local-1440.png).
- Trang `/thuong-hieu/[slug]` có trang con và liên kết sản phẩm mẫu; Playwright kiểm tra từ danh sách đến Bioderma, hiển thị một sản phẩm mẫu. Đây chưa phải clone hoàn chỉnh trang chi tiết: thiếu mô tả, bộ lọc, khuyến mãi, sản phẩm, footer và các trạng thái thực; các thương hiệu không có dữ liệu mẫu hiện thông báo trống. Các chức năng tài khoản, thanh toán và backend chưa được triển khai. Cần tiếp tục khảo sát và kiểm thử từng template, tối đa năm vòng.
- Cảnh báo hydration dev về caret-color vẫn được ghi nhận. Đã dùng tab Playwright riêng và đóng sau kiểm thử để tránh ảnh hưởng viewport tab người dùng.

### Template danh mục — vòng 1/5

- Vòng 2/5: theo yêu cầu mới, ưu tiên bố cục, nút và thông tin; hình ảnh không cần giống. Đã thay hộp chọn sắp xếp bằng hàng nút giống cấu trúc nguồn, giữ ba lựa chọn có dữ liệu mẫu hỗ trợ. Playwright xác nhận nút giá tăng dần được chọn và Hada Labo 57.000đ lên đầu. Chưa có dữ liệu để thực hiện chính xác các lựa chọn mới nhất/bán chạy của nguồn, số lượng, danh mục sidebar và nội dung sản phẩm thực vẫn chưa đầy đủ. [Ảnh sau sửa](design-references/category-local-sort.png).

- So sánh trang chăm sóc da mặt tại 1440 × 900: [nguồn](design-references/category-source-1440.png), [local trước](design-references/category-local-before-1440.png), [local sau](design-references/category-local-after-1440.png). Nguồn có dải thương hiệu phía trên và lưới bốn cột; đã chuyển local sang bố cục tương tự, giữ bộ lọc và danh sách dữ liệu mẫu. Dải chữ thương hiệu chỉ áp dụng cho danh mục đã khảo sát; chưa phải logo thật.
- Playwright xác nhận lọc Bioderma còn một sản phẩm, xóa lọc và sắp xếp tăng dần đưa Hada Labo 57.000đ lên đầu. Ở viewport 390 × 844, lưới hai cột và không tràn ngang; chưa đối chiếu mobile với nguồn. Lint và production build thành công; cổng 3000 được khởi động lại sau build.
- Còn khác biệt: ảnh sản phẩm/logo là placeholder, danh mục và số lượng là mẫu, thứ tự sidebar, thanh sắp xếp, cookie và dữ liệu thực chưa khớp. Cảnh báo hydration dev về thuộc tính caret-color vẫn xuất hiện; chưa xác định nguyên nhân. Các danh mục khác, route thiếu và template khác chưa được khảo sát/sửa trong vòng này.

### Kiểm tra khi phóng cửa sổ — vòng trang chủ 2/5

- Theo phản hồi nội dung bị nhỏ khi phóng toàn màn hình, vòng 3/5 tăng chiều rộng tối đa của header, navigation và trang chủ từ 1340 lên 1800px. Bản production trên cổng 3000 đã được build và khởi động lại; Playwright đo nội dung rộng 1800px tại viewport 1920 và 1377px tại viewport 1440, không tràn ngang. [Ảnh local 1920px](design-references/hasaki-local-wide-1920.png). Đây là điều chỉnh theo sở thích người dùng, khác khung 1340px quan sát tại trang nguồn.

- Ở viewport 1100 × 900, huy hiệu giỏ hàng tràn 7px khỏi vùng nội dung và tạo thanh cuộn ngang toàn trang. Đã thêm lề cho khung desktop và thu gọn chữ của các liên kết tiện ích thành biểu tượng trong khoảng 1001–1200px; tên liên kết vẫn có trong cây trợ năng. Vị trí và nội dung các liên kết được giữ lại.
- Playwright đo `scrollWidth` bằng `clientWidth` tại các viewport 375, 600, 1000, 1001, 1100, 1200, 1440 và 1920px sau sửa. Tại 1920px, khung chính rộng 1340px và căn giữa. [Trước sửa 1100px](design-references/hasaki-local-1100-before.png), [sau sửa 1100px](design-references/hasaki-local-1100-after.png), [nguồn 1920px](design-references/hasaki-source-1920.png), [local 1920px](design-references/hasaki-local-1920-after.png). Ảnh nguồn 1920px được chụp khi nhiều ảnh nguồn chưa tải, nên chỉ dùng để tham khảo hình học.
- Đo tràn ngang không thay thế kiểm thử đầy đủ responsive và tương tác. Các template khác và các khác biệt đã ghi phía dưới vẫn còn. Lint từ lần kiểm tra trước đã hoàn tất thành công; lần này chỉ sửa CSS và không chạy lại production build.

- Playwright MCP đã tải và điều hướng được cả hai trang. Chụp tại 1440 × 900, đầu trang: [nguồn Hasaki](design-references/hasaki-source-1440.png), [local trước sửa](design-references/hasaki-local-before-1440.png), [local sau sửa](design-references/hasaki-local-after-1440.png). Ảnh nguồn có biểu ngữ cookie; local không có. Ảnh trước dùng localhost:3000 (production checkpoint), ảnh sau dùng localhost:3001 (dev cùng mã hiện tại). Banner và dữ liệu trang nguồn có thể thay đổi theo thời gian.
- Trang chủ, vòng sửa 1/5: mở rộng khung desktop từ 1200 lên 1340px cho header/nav và trang chủ; chỉnh chiều cao các thanh, tỷ lệ banner, khoảng cách shortcut và màu/hình dạng Flash deals. Ảnh sau sửa cho thấy mép nội dung, vị trí banner và đầu Flash deals gần nguồn hơn. Chưa so sánh mobile hoặc các vị trí cuộn khác. Các banner, sản phẩm và biểu tượng vẫn là mẫu; nội dung thanh quảng cáo, ô tìm kiếm, cookie, đồng hồ và các chi tiết khác còn khác nguồn.
- Kiểm tra HTTP local trong phiên này: `/thuong-hieu` và `/clinic` trả 404; `/danh-muc/phu-kien-dien-thoai-c2474.html` và `/san-pham/unknown.html` trả 200 dù trang báo không tìm thấy. Những nhóm campaign, thương hiệu chi tiết và dịch vụ vẫn cần khảo sát route nguồn. Các template khác chưa được sửa hoặc so sánh trong vòng này.
- Console dev ghi một cảnh báo hydration về thuộc tính `style="caret-color: transparent"` trên input tìm kiếm. Chưa xác định nguồn của thuộc tính hoặc tái hiện trong production; cần kiểm tra lại trước khi kết luận nguyên nhân. Chưa kiểm thử toàn bộ tương tác, responsive hoặc các template khác.
- `npm.cmd run typecheck` và `npm.cmd run build` thành công sau thay đổi; lint chưa trả kết quả tại thời điểm ghi nhận. Cần tiếp tục theo từng template với ảnh nguồn/local cùng trạng thái, kiểm thử tương tác và tối đa năm vòng sửa mỗi template.

Ngày kiểm tra: 12/11/2026. Phạm vi: **chỉ audit**, chưa sửa mã triển khai. Nguồn tham chiếu được dùng là `https://hasaki.vn/`, theo yêu cầu và các lần khảo sát trước trong cuộc hội thoại; địa chỉ `haski.vn` trong yêu cầu mới có cách viết khác.

## Giới hạn kiểm tra

- Đã đọc `.agents/skills/clone-website/SKILL.md` và `references/inspection-guide.md`. Workflow yêu cầu so sánh trang nguồn và bản clone ở cùng kích thước, vị trí cuộn và trạng thái, sau đó kiểm tra tương tác.
- Browser MCP **không khả dụng**: inventory trả về `The browser access host is unavailable`; Chrome đang thu nhỏ nên không đọc được cửa sổ qua công cụ điều khiển máy. Không có cặp ảnh chụp mới ở cùng viewport trong lượt audit này. Không thể kết luận mức độ giống pixel, typography, vị trí, responsive hay kiểm chứng tương tác bằng trình duyệt.
- Web read-only truy cập được trang chủ, danh mục chăm sóc da mặt và sản phẩm Bioderma của Hasaki, nhưng phản hồi chỉ chứa header và một phần breadcrumb do nội dung động. Đây không phải kiểm tra ảnh hoặc quan sát trực quan đầy đủ.
- Các nhận xét về tương tác bên dưới là **phân tích mã**, trừ khi đánh dấu đã kiểm tra HTTP. Cần kiểm tra bằng trình duyệt trước khi khẳng định hành vi runtime.
- Theo lựa chọn trước của người dùng, ảnh/banner sản phẩm có thể dùng khung tạm trong giai đoạn frontend; không coi việc thiếu ảnh thật là lỗi cần sửa trước.

## Hiện trạng và route

| Trang nguồn hoặc loại trang | Bản local | Kết quả audit |
| --- | --- | --- |
| `/` | `/` | HTTP 200; trang chủ có cấu trúc và dữ liệu mẫu. |
| `/danh-muc/cham-soc-da-mat-c4.html` | cùng đường dẫn | HTTP 200; template danh mục, 28 đường dẫn được khai báo, nhưng phần lớn không có sản phẩm mẫu. |
| `/san-pham/nuoc-tay-trang-bioderma-danh-cho-da-nhay-cam-500ml-9740.html` | cùng đường dẫn | HTTP 200; template chi tiết và 8 sản phẩm mẫu. |
| Giỏ hàng, thanh toán | `/gio-hang`, `/thanh-toan` | HTTP 200; giao diện mẫu dùng localStorage, không tạo đơn thật. Chưa xác minh mapping URL và bố cục trang nguồn. |
| `/thuong-hieu` | `/thuong-hieu` | HTTP 404; trang danh sách thương hiệu chưa có. |
| `/clinic` | `/clinic` | HTTP 404; trang Clinic chưa có. |
| `/danh-muc/phu-kien-dien-thoai-c2474.html` | cùng đường dẫn | HTTP 200 nhưng nội dung báo không tìm thấy danh mục; trong khi dữ liệu Anker tham chiếu danh mục này. Đây là soft 404. |
| `/san-pham/unknown.html` | cùng đường dẫn | HTTP 200 với nội dung không tìm thấy sản phẩm; cần xử lý mã trạng thái 404 thật. |
| Trang tìm kiếm, thương hiệu chi tiết, deal/campaign, hàng mới, bán chạy, dịch vụ và đặt lịch | Chưa có template/route tương ứng | Chưa khảo sát đầy đủ từng URL; nhiều liên kết trên trang chủ hiện cuộn tới một section thay vì mở trang tương ứng. |

Danh sách trên là điểm khởi đầu, không khẳng định đã liệt kê tất cả route của Hasaki. Cần lập sitemap theo từng nhóm trang và phân biệt URL thật với trạng thái lọc/query.

## Khác biệt giao diện và cấu trúc

1. **Layout dùng chung — ưu tiên cao:** header, navigation và footer được viết riêng trong `src/app/page.tsx` và `src/components/sites/hasaki/catalog-view.tsx`; giỏ hàng có header thứ ba trong `cart-view.tsx`. Các phần dùng chung đã khác về nội dung, điều hướng, trạng thái tài khoản/giỏ và khả năng responsive. Cần so sánh từng trạng thái trước khi hợp nhất.
2. **Trang chủ:** dùng banner CSS và bộ nội dung minh họa; nhiều section có khung thay thế và dữ liệu giả. Có 8 điểm điều khiển banner nhưng chỉ 4 nội dung (`slide % 4`); đồng hồ Flash Deals là văn bản cố định. Không có ảnh đối chiếu mới để đo chính xác khác biệt.
3. **Danh mục:** có breadcrumb, sidebar và lưới, nhưng dữ liệu chỉ bao gồm 8 sản phẩm, phần lớn danh mục trống; thanh giá chỉ là lời nhắc và chưa có bộ lọc giá. Hình học, thứ tự bộ lọc và các trạng thái chưa so với trang nguồn.
4. **Chi tiết sản phẩm:** ảnh/thumbnail là placeholder, thông tin, ưu đãi, đánh giá và sản phẩm liên quan là mẫu. Breadcrumb luôn chèn `Chăm Sóc Da Mặt`, kể cả sản phẩm Anker; các sản phẩm liên quan lấy 6 mục bất kỳ, không dựa danh mục. Chưa có so sánh trực quan theo trạng thái.
5. **Giỏ hàng và checkout:** bố cục và dữ liệu là demo; không có căn cứ trong lượt này để xác nhận có giống trang gốc. Checkout chỉ hiện thông báo mẫu và không lưu/đặt đơn thật, phù hợp giai đoạn chưa làm backend nhưng cần thể hiện rõ trong kế hoạch.

## Tương tác cần sửa hoặc kiểm tra

- **Đã thấy trong mã:** tìm kiếm ở header của trang con gửi `q` đến danh mục chăm sóc da, nhưng `CategoryView` không đọc `q`; kết quả tìm kiếm không được áp dụng.
- **Đã thấy trong mã:** các shortcut, top tìm kiếm, các tab gợi ý và nhiều mục điều hướng chủ yếu trỏ tới anchor/hiển thị cùng tập dữ liệu; chưa đưa đến nội dung tương ứng. Nút `Xem thêm` chỉ đặt lại từ khóa, không tải thêm.
- **Đã thấy trong mã:** nút tài khoản trên trang con liên kết `/#account`, trong khi trang chủ hiện không có phần tử `id="account"`; vị trí chọn khu vực trên trang con là text. Một số link hỗ trợ đi ra Hasaki thật.
- **Đã thấy trong mã:** giỏ hàng thử nghiệm giữ localStorage; xác nhận đặt hàng mẫu không xác thực các trường và không tạo đơn. Cần kiểm tra toàn bộ thao tác thêm/sửa/xóa, refresh và chuyển trang bằng trình duyệt.
- **Đã thấy trong mã:** dùng tên sản phẩm để dò slug ở trang chủ, dẫn tới nguy cơ thẻ biến mất nếu dữ liệu hai nơi lệch; cần dùng một nguồn dữ liệu chung và kiểm tra các link.
- **Cần kiểm thử:** trạng thái menu trên mobile, keyboard/focus, sắp xếp và lọc theo thương hiệu, carousel, chuyển sang chi tiết, thêm vào giỏ, checkout mẫu, back/forward, lỗi console và tràn ngang.

## Ưu tiên sửa sau khi hoàn tất audit

0. Khôi phục môi trường kiểm thử: browser MCP hoặc khả năng so sánh hai trang tại cùng viewport; Node đúng yêu cầu. Ghi rõ nguồn ảnh chụp, viewport, trạng thái, thời điểm và route.
1. Sửa **layout chung** trước: tách header/nav/footer dùng chung mà vẫn giữ các hành vi hiện có; khắc phục điều hướng và tìm kiếm; bảo đảm mobile và trạng thái giỏ thống nhất. Kiểm tra hồi quy trang chủ, danh mục và chi tiết.
2. **Batch 1: tối đa hai template** — trang chủ và danh mục. So sánh desktop/mobile theo cùng viewport, sửa hình học và trạng thái trước; giữ placeholder ảnh theo yêu cầu. Kiểm tra route và liên kết danh mục.
3. **Batch 2: tối đa hai template** — chi tiết sản phẩm và giỏ hàng. Kiểm tra chọn số lượng, thêm/sửa/xóa, giữ dữ liệu qua chuyển trang; sửa breadcrumb và mã 404.
4. **Batch 3: tối đa hai template** — checkout mẫu và tìm kiếm. Sau đó mới đến các nhóm thương hiệu, campaign và Clinic dựa trên khảo sát bổ sung.
5. Mỗi batch: build và kiểm thử trình duyệt phù hợp; tối đa 5 vòng sửa/kiểm tra cho các lỗi phát hiện. Cập nhật báo cáo với kết quả từng vòng, ảnh so sánh và những phần còn thiếu; không tuyên bố hoàn toàn giống khi chưa đối chiếu.

## Bằng chứng kiểm tra lần này

- `node --version`: **v22.17.0**; `package.json` yêu cầu **Node >=24**.
- `npm run lint` và `npm run typecheck`: thành công.
- `npm run build`: **thất bại** trước bước build vì SWC native `not a valid Win32 application`, fallback WASM không được Next.js nạp. Không thay đổi cài đặt/mã để xử lý trong audit.
- Kiểm tra HTTP local: `/`, trang danh mục chăm sóc da, trang sản phẩm Bioderma, `/gio-hang`, `/thanh-toan` trả 200; `/thuong-hieu`, `/clinic` trả 404; hai ví dụ soft 404 được nêu trong bảng.
- Browser MCP: inventory rỗng và báo host không khả dụng; Chrome minimized. Không có screenshot so sánh hoặc browser test thành công trong lượt này.
- Git đã có nhiều thay đổi và file chưa theo dõi trước audit. Không reset, xóa hoặc thay đổi mã triển khai.

## Lần sửa tiếp theo — layout chung, vòng 1

- Đã đưa header và navigation trang chủ, danh mục, sản phẩm về `src/components/sites/hasaki/header.tsx`; nút tài khoản và chọn khu vực có cùng trạng thái mẫu, giỏ hàng liên kết tới `/gio-hang` và đếm sản phẩm từ localStorage.
- Đã tạo `/tim-kiem?q=...` dùng chung cho các header trên và lọc 8 sản phẩm mẫu. Giỏ hàng/checkout vẫn giữ header riêng; footer vẫn chưa được hợp nhất.
- Kiểm tra vòng 1 phát hiện thiếu import `ChevronRight`; đã sửa. Lint đạt; build Webpack với WASM fallback thành công, bao gồm TypeScript. Lệnh build mặc định vẫn chưa được sửa; môi trường còn dùng Node 22.
- Kiểm tra HTTP sau khởi động lại: trang chủ, danh mục và sản phẩm mẫu trả 200. `/tim-kiem?q=Bioderma` có sản phẩm Bioderma; `/tim-kiem?q=zzzz` hiển thị trạng thái không có kết quả.
- Browser MCP tiếp tục báo `The browser access host is unavailable`. Chưa có browser test hoặc so sánh screenshot cùng viewport; kết quả HTTP không chứng minh tương tác hay độ giống. Chưa bắt đầu batch đối chiếu hai template do thiếu bằng chứng trực quan.

## Kiểm tra tiếp nối — 12/11/2026

- Playwright MCP đã được đăng ký và bật (`npx.cmd -y @playwright/mcp@latest`), nhưng công cụ Playwright không xuất hiện trong phiên hiện tại. Inventory trình duyệt vẫn trả `The browser access host is unavailable`; nguyên nhân host chưa được xác định. Cần khởi động lại Codex và kiểm tra công cụ được nạp trước khi kết luận MCP hoạt động.
- `http://localhost:3000/` trả HTTP 200; đây không phải kiểm thử trình duyệt. Chưa chụp được ảnh nguồn hoặc local ở 1440 × 900, chưa đối chiếu hình học hay xác minh tương tác. Chưa sửa template nào trong lượt này; số vòng sửa/kiểm tra là 0.
- Node hiện là 24.21.0. Lỗi SWC native đã được xử lý ở lượt trước bằng cách thay tệp bị cắt cụt bằng tệp từ gói 16.3.5 khớp SHA-512 của lockfile; lint và production build mặc định đã thành công không dùng WASM. Các mô tả Node 22 và lỗi build ở các mục cũ là lịch sử.
- Công việc còn lại: khôi phục công cụ trình duyệt; chụp và so sánh trang chủ cùng viewport, vị trí cuộn và trạng thái; hoàn thiện layout chung rồi xử lý từng template. Các route `/thuong-hieu`, `/clinic`, route soft 404 và các trang campaign/dịch vụ vẫn cần khảo sát hoặc triển khai như đã ghi ở trên; chưa xác minh lại trong lượt này.

## Audit 14/11/2026 — kết luận kiểm chứng mới nhất

Đã chia 3 subagent (1 nhẹ, 2 vừa), kết hợp Codegraph, nguồn công khai, HTTP local và browser riêng. Báo cáo tổng hợp: [audit-2026-11-14-summary](research/hasaki/audit-2026-11-14-summary.md). Các tuyên bố cũ hoàn thiện 100% không còn được coi là nghiệm thu: phát hiện guest API quản trị trả dữ liệu, slug lạ fallback sai, thành công trước API, ảnh 404 và JS chunks 500. Chưa sửa ứng dụng. Runtime/source có thể lệch; chưa nghiệm thu toàn bộ nút hoặc màn hình sau đăng nhập. Ưu tiên P0 runtime/auth → P1 dữ liệu/định tuyến/nghiệp vụ → P2 đối chiếu từng template. Xem báo cáo và ENGINEERING_RULES.md để tiếp nối.

## Chuẩn hóa Layout, Khung `.wrap` 1340px và Các Màn Hình Con — 14/11/2026

- **Đã khắc phục các lỗi lệch bố cục so với ảnh tham chiếu `hasaki.vn`**:
  1. **Khung container & Header/Footer**: Đồng bộ `.wrap` 1340px trên desktop; bổ sung `<Footer />` cho toàn bộ các trang `/deals-dang-dien-ra.html`, `/san-pham-ban-chay.html`, `/hang-moi-ve.html`, `/thuong-hieu`, `/thuong-hieu/[slug]`, `/campaign/wow`, `/tag/[slug]`, `/khach-hang/[section]`; bổ sung route `/tra-cuu-don-hang` cho liên kết trên Header.
  2. **Trang chủ (`/`)**: Định dạng giá `money(product.price)` cho Flash Deals, đồng nhất thẻ sản phẩm Gợi ý bằng `<ProductCard />`, thay icon unicode `✿`/`✦` bằng ảnh sản phẩm thật của từng danh mục. Score kiểm tra trực quan tại [audit-local-01-home.png](design-references/audit-local-01-home.png).
  3. **Danh mục (`/danh-muc/[slug]`)**: Loại bỏ danh sách danh mục lặp lần 2 ở sidebar trái, loại bỏ các nút chọn giá nhanh ngoài thiết kế gốc, đổi nút `Áp dụng` sang màu `#326e51`, bỏ thanh pill danh mục con nổi phía trên tiêu đề, và sửa ảnh sản phẩm Hada Labo bị gãy URL. Xem [audit-local-02-category.png](design-references/audit-local-02-category.png).
  4. **Chi tiết sản phẩm (`/san-pham/[slug]`)**: Chuyển `.detail-gallery` sang bố cục 2 cột (cột thumbnail dọc bên trái + ảnh chính bên phải), loại bỏ khối gallery/tab trùng lặp, chia phần dưới thành lưới 2 cột `.detail-lower-grid` (`minmax(0, 1fr) 280px`) với nội dung chi tiết/đánh giá/hỏi đáp bên trái và `Sản phẩm xem cùng` + `Sản phẩm cùng thương hiệu` bên phải, đồng thời sửa lỗi hiển thị `Invalid Date` của ngày đánh giá. Xem [audit-local-03-product.png](design-references/audit-local-03-product.png) và [audit-local-04-product-scrolled.png](design-references/audit-local-04-product-scrolled.png).
  5. **Các trang con trên Header**: Loại bỏ thanh `.progress` lặp lần 2 trong `deals-list.tsx` ([audit-local-05-deals.png](design-references/audit-local-05-deals.png)), khôi phục ảnh sản phẩm bị gán `undefined` trên `/campaign/wow` ([audit-local-06-campaign-wow.png](design-references/audit-local-06-campaign-wow.png)) và `/tag/[slug]`, căn chỉnh thẻ và huy hiệu xếp hạng trên `/san-pham-ban-chay.html` ([audit-local-07-bestsellers.png](design-references/audit-local-07-bestsellers.png)), và kiểm tra trang `/tra-cuu-don-hang` ([audit-local-08-order-lookup.png](design-references/audit-local-08-order-lookup.png)).
- **Những điểm chưa hoàn chỉnh / phạm vi giới hạn**:
  - Dữ liệu sản phẩm, giá bán, tồn kho chi nhánh và đánh giá là dữ liệu snapshot (ngày 13–14/11/2026), không kết nối cơ sở dữ liệu sản xuất của Hasaki.
  - Các cổng nội bộ (`/quan-tri`, `/khach-hang/[section]`) và các API ghi dữ liệu được khóa fail-closed theo `docs/ENGINEERING_RULES.md`.




---

## Bàn Giao Kiểm Tra Wave 8 — Khôi Phục Tailwind CSS v4, Chuẩn Hóa Bố Cục 1:1 & Xóa Sạch 404 Toàn Hệ Thống — 14/11/2026

- **Khôi phục Tailwind CSS v4 & Sửa lỗi 5 màn hình người dùng phản ánh (`src/app/globals.css`)**:
  - Đã thêm `@import "tailwindcss";` cùng `@layer base` và `@layer components` tại `src/app/globals.css`, khắc phục triệt để tình trạng mất style Tailwind trên `/he-thong-cua-hang`, `/bao-hanh`, `/ho-tro`, `<Footer />`.
  - Đã cố định kích thước `.cart-thumb` (`80px × 80px`, `object-fit: contain`) trên `/gio-hang`, ngăn ảnh sản phẩm 380×380px phóng to tràn hàng.
- **Xóa bỏ hoàn toàn lỗi 404 trên các liên kết UI**:
  - Cập nhật `resolveCategorySlug()` và `getCategoryTitle()` trong `src/lib/catalog.ts` để phân giải mọi danh mục từ `interactive-ui-2026-11-14.json` (`megaMenu`, `searchPopup`, `categoryPageUi`, `nha-cua-doi-song-c2529.html`, `dien-gia-dung-c2463.html`, `loa-bluetooth-c2800.html`).
  - Đảm bảo đầy đủ các route `/tra-cuu-don-hang`, `/campaign/[slug]`, `/tag/[slug]`, `/cam-nang/[slug]`, `/dang-ky`, `/dich-vu/[slug]` và `/thuong-hieu/[slug]`.
