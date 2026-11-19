# Tiến độ dự án E-Commerce Platform (Nari Home) & Quản Trị Doanh Nghiệp

## Checkpoint 19/11/2026 (Starter Catalog Live) — 2 Sản Phẩm Mẫu, Chi Nhánh Flagship & Dịch Vụ Clinic Đã Live

- Đã tạo script idempotent [`scripts/seed-starter-catalog.mjs`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/scripts/seed-starter-catalog.mjs) (`--dry-run` / `--apply`), upload 2 ảnh sản phẩm lên Supabase Storage `nari-catalog` và nạp thành công: `2` brands, `2` categories, `2` products (`NARI-SRM-001`, `NARI-CLN-002`, `12` specs), `1` branch (`NARI-HCM-Q1`), `2` inventory balances (`50` sp/SKU) + `2` movements, `1` clinic service (`NARI-SVC-001`).
- `npm run lint` (`0` errors), `npm run db:verify` PASS (`wave3Applied: true`), toàn bộ route storefront & `/api/products`, `/api/stores`, `/api/cart/quote`, `/san-pham/*`, `/danh-muc/*`, `/thuong-hieu/*`, `/booking`, `/gio-hang`, `/thanh-toan` trả HTTP `200` trên `https://nari-home.tylum123.workers.dev`.

## Checkpoint 19/11/2026 (Cloudflare Workers Live) — Triển khai OpenNext Workers + Hyperdrive Thành Công

- **Triển khai Live (`https://nari-home.tylum123.workers.dev`):**
  - Nâng cấp `next@16.4.6`, `eslint-config-next@16.4.6`, `@opennextjs/cloudflare@1.20.17` (`wrangler@4.164.0`, `supabase@3.2.0`), thêm `open-next.config.ts`, `wrangler.jsonc` (Hyperdrive `nari-supabase-db`: `650301fdebbf4bdfac223cb90ddaa1cd`), `next.config.ts` (`images: { unoptimized: true }`), `eslint.config.mjs`, và sửa 6 lỗi React Compiler ESLint trong `admin-erp-view.tsx` & `admin-products-view.tsx`.
  - Bổ sung `readHyperdriveConnectionString()` và `createHyperdriveDatabase()` (per-request `pg.Client` với `client.end()` trong `finally`) vào [`src/lib/server/postgres-database.ts`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/lib/server/postgres-database.ts) để tránh lỗi cross-request I/O trên `workerd`, cập nhật `scripts/verify-supabase-live.mjs` & `test/postgres-foundation.test.cjs` (`7/7` pass).
  - `npm run cf:build` (`NARI_ISOLATED_BUILD` unset) **PASS** (`exit 0`, `.open-next/worker.js` `2,216` bytes, handler `6,553,506` bytes, `65` new + `3` existing static assets).
  - `npx wrangler deploy` **PASS** (`Total Upload: 10200.13 KiB / gzip: 2114.25 KiB`, `Worker Startup Time: 210 ms`, Version ID `f498b0c4-f468-4005-80b6-3d3dbad8361b`), kèm `8` secrets qua `wrangler secret bulk` (`NARI_POSTGRES_CA`, `NARI_POSTGRES_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `VIETQR_ACCOUNT_NAME`, `VIETQR_ACCOUNT_NO`, `VIETQR_BANK_ID`, `VIETQR_TEMPLATE`).
- **Kiểm chứng:**
  - `node --test test/*.mjs test/*.cjs`: **`77` passed, `0` failed** (`10` PGlite integration tests skipped khi `NARI_TEST_PGLITE_PATH` unset, khớp CI).
  - `npm run lint` (`0` errors, `0` warnings), `npx next typegen` + `npm run typecheck` (`0` errors), `npm run ops:doctor -- --live` **PASS** (`Supabase DB: OK`, `wave3Applied: true`, `runtimePolicies: 44`, `Cloudflare Wrangler: OK` `tylum123@gmail.com`).
  - Live HTTPS Probes (`https://nari-home.tylum123.workers.dev`): `GET /` `200` (`42090` bytes), `GET /api/products` (2 sequential + 2 concurrent `Promise.all`) đều `200`, `GET /api/stores` (2 sequential) đều `200` (`"source":"postgres"`), `GET /api/session` (unauthenticated) `401`, `GET /api/admin/products` (unauthenticated) `401` (`AUTHENTICATION_REQUIRED`), `POST /api/orders` (no origin) `403` (`FORBIDDEN_ORIGIN`).
- **Còn lại & Lộ trình tiếp theo:**
  - `npm run ops:supabase -- login` vẫn cần chủ dự án tự chạy trong TTY (`~/.supabase/access-token` chưa có; `SUPABASE_ACCESS_TOKEN` trống).
  - Roadmap tiếp theo: seed dữ liệu thật (catalog/branches/clinic services) vào Supabase, thay `erp-store.ts` in-memory ở `/api/admin/*`, nối Customer Portal (`/khach-hang/*`) & signup/recovery vào Supabase Auth + `customer_profiles`, bật `/api/payments/webhook` + bộ chọn chi nhánh tại `/thanh-toan`, nối live slot availability + `/api/warranty` + `/api/analytics` + `/api/mcp`, và chuyển `next/font/google` sang `next/font/local`.

## Checkpoint 18/11/2026 (Tạm kết thúc) — Sửa `ops-cli.mjs` TTY & Tạo sẵn Cloudflare Hyperdrive

- Đã sửa [`scripts/ops-cli.mjs`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/scripts/ops-cli.mjs) hỗ trợ `stdio: 'inherit'` cho TTY (gỡ lỗi đứng lệnh `npm run ops:supabase -- login`).
- Đã upload Supabase Root 2021 CA (`42155ffe-bf6d-4040-afac-779588547a18`) và tạo xong **Cloudflare Hyperdrive `nari-supabase-db`** (`650301fdebbf4bdfac223cb90ddaa1cd`, `--sslmode=verify-full`), cập nhật [`.gitignore`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/.gitignore).
- **Còn lại phiên sau:** Chạy `npm run ops:supabase -- login`, cài `next@16.4.6` + `@opennextjs/cloudflare`, viết `wrangler.jsonc` / `open-next.config.ts` / Hyperdrive per-request adapter trong `postgres-database.ts`, rồi deploy `nari-home.tylum123.workers.dev`.

## Checkpoint 18/11/2026 (Cloud Live Wave 3) — Kích hoạt thành công Supabase Wave 3 & Cloudflare Wrangler OAuth

- **Supabase Cloud Live (`ywrzguhuzekkusoupehf`):**
  - Đã thực thi tuần tự 3 file SQL Wave 3 (`202611180001..0003`) qua Supabase SQL Editor trên Chrome (`Success. No rows returned`).
  - `npm run db:verify` PASS với **`wave3Applied: true`**, **`runtimePolicies: 44`**, `rls: true`, `deniedWrites: true`, `verifiedTls: true`.
  - Đã bật `NARI_SHARED_RATE_LIMIT=postgres`, `NARI_ORDERS_ENABLED=true`, `NARI_BOOKINGS_ENABLED=true` trong `.env`.
- **Cloudflare Wrangler CLI (`ops:cf`):**
  - Xác thực thành công OAuth qua Chrome (`tylum123@gmail.com`, Account ID `c0267fa333fa3b1a5b648ebf8a4b419e`), `npm run ops:doctor -- --live` đạt `Supabase DB: OK` + `Cloudflare Wrangler: OK`.
- **Phần chủ dự án tự chạy:** Bước 2 (`npm run ops:supabase -- login` trên TTY) và Bước 3 (triển khai Cloudflare trên `tylum123.workers.dev`).

## Checkpoint 18/11/2026 (Giai đoạn 1–4) — Pure PostgreSQL, Brand Nari Home, CLI Supabase/Cloudflare & FE↔BE End-to-End

- **Giai đoạn 1 & 2 (đã đẩy `5495604..0866457`):**
  - Gỡ hoàn toàn SQLite (`sqlite-db.ts`, `schema.sql`, `hasaki-local.db`) và ép 100% PostgreSQL ở lớp catalog/quote/admin/orders.
  - Gỡ toàn bộ snapshot & định danh Hasaki (`docs/research/hasaki/`, `scripts/scrape-*.mjs`, `hasaki-source.html`), giữ nguyên UI/CSS và di chuyển sang `src/components/sites/nari/` + `src/lib/mcp/nari-mcp.ts`.
  - Cài đặt CLI dự án `supabase` (`3.2.0`) và Cloudflare `wrangler` (`4.164.0`), cấu hình `supabase/config.toml` và `scripts/ops-cli.mjs` (`ops:doctor`, `ops:supabase`, `ops:cf`, `db:push`, `db:verify`).
- **Giai đoạn 3 & 4 (Wave 3 FE↔BE PostgreSQL & Tooling):**
  - **Wave 3.1 (Auth / Next 16 Proxy / Rate Limit):** Migration `202611180001_auth_ratelimit_customers.sql`, `src/proxy.ts` thay `src/middleware.ts`, `src/lib/server/business-access.ts`, PostgreSQL rate limiter, nối `/api/session` và `/khach-hang/*`.
  - **Wave 3.2 (ACID Orders & Kho):** Migration `202611180002_orders_fulfillment.sql`, `src/lib/server/postgres-order-service.ts`, nối `/api/orders`, `checkout-view.tsx`, `tra-cuu-don-hang/page.tsx` (fail-closed `503` nếu `NARI_ORDERS_ENABLED` chưa bật).
  - **Wave 3.3 (Branches & Clinic Booking):** Migration `202611180003_clinic_bookings.sql` (`btree_gist` + `EXCLUDE USING gist`), `src/lib/server/postgres-clinic-service.ts`, nối `/api/stores`, `/api/bookings`, SSR & UI (fail-closed `503` nếu `NARI_BOOKINGS_ENABLED` chưa bật).
  - **Ops & CI:** Cập nhật `scripts/push-supabase-schema.mjs` (`--wave3-backend` + kiểm tra quyền owner trước DDL), `scripts/verify-supabase-live.mjs` (`expectedDatabaseSpec`), `.github/workflows/ci.yml`, `.gitignore`.
- **Kiểm chứng tổng thể sau sửa cuối:**
  - `node --test test/*.mjs test/*.cjs` (PGlite): **`85/85` PASS** (`0` fail, `0` skipped).
  - `next typegen` + `npm run typecheck` + `npm run lint`: **0 lỗi, 0 cảnh báo**.
  - `NARI_ISOLATED_BUILD=1 npm run build`: **PASS** (`34.1s`, `22/22` static pages, `ƒ Proxy (Middleware)`).
  - Live Supabase (`verify-supabase-live.mjs --database`): **PASS** (`ok: true`, `wave3Applied: false`, `runtimePolicies: 18`, `nari_catalog_app`).
  - `git grep` xác nhận `0` tham chiếu SQLite runtime và `0` tham chiếu Hasaki trong mã nguồn/assets.
- **Trạng thái Cloud chờ kích hoạt:** Cần bổ sung `DATABASE_URL` (quyền owner) vào `.env` để chạy `node --env-file=.env scripts/push-supabase-schema.mjs --apply --wave3-backend` trước khi bật `NARI_SHARED_RATE_LIMIT=postgres`, `NARI_ORDERS_ENABLED=true`, `NARI_BOOKINGS_ENABLED=true`.

## Checkpoint 18/11/2026 — Bước 0 & Bước 1 (Chuẩn hóa Skill/Git & Vá API Catalog PostgreSQL)

- **Quy trình & Skill (Bước 0):** Đã tạo [`.agents/skills/nari-fullstack-ba/SKILL.md`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/.agents/skills/nari-fullstack-ba/SKILL.md) và cập nhật [`AGENTS.md`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/AGENTS.md) với quy tắc CodeGraph-First, Plan-First, Fullstack/BA standards, Handoff và đẩy Git liên tục lên `origin/main`.
- **Cloud & API Catalog (Bước 1):**
  - Xác minh live Supabase: `verify-supabase-live.mjs --database` PASS (`nari_catalog_app`, TLS verified, RLS on, `runtimePolicies: 18` — migration `0003` đã áp dụng) và `--storage-check` PASS (`nari-catalog` bucket public 5 MiB JPEG/PNG/WebP).
  - Vá `/api/products`, `/api/products/[slug]`, `/api/cart/quote` sử dụng `readStorefrontCatalog()` (PostgreSQL authoritative, không còn đọc SQLite khi bật `postgres`, bỏ fallback rating/sold giả và bỏ tin `item.price` từ client).
  - Sửa lỗi lint `next/link` trong `supabase-login-form.tsx`, thêm [`test/catalog-api-postgres.test.cjs`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/test/catalog-api-postgres.test.cjs) vào CI.
- **Kiểm chứng:** 53/53 test CI (kèm PGlite) + 10/10 unit tests khác pass; `npm run typecheck` pass; `npm run lint` 0 errors. Toàn bộ thay đổi được phân nhóm commit sạch và đẩy lên `origin/main`.

## Checkpoint 17/11/2026 (Wave F — Chuẩn bị môi trường & cấu hình đẩy Schema lên Supabase)

- **Subagent `hydrogen-env`:** Đã dùng CodeGraph / symbol lookup rà soát toàn bộ biến môi trường trong dự án, cập nhật [`.env.example`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/.env.example) (4 nhóm biến kèm hướng dẫn lấy từ Supabase Dashboard) và tạo file `.env` khung mẫu (đã xác nhận bị ignore qua `git check-ignore -v .env` -> `.gitignore:13`) với placeholder an toàn.
- **Subagent `hydrogen-migration`:** Đã kiểm tra [`db/migrations/202611160001_catalog_inventory.sql`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/db/migrations/202611160001_catalog_inventory.sql) và [`db/migrations/202611170001_identity.sql`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/db/migrations/202611170001_identity.sql), đồng thời tạo script [`scripts/push-supabase-schema.mjs`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/scripts/push-supabase-schema.mjs) (ESM dùng `pg`, hỗ trợ `--dry-run`, `--apply`, `--with-roles`, chặn placeholder, chạy trong transaction `BEGIN/COMMIT/ROLLBACK` và che giấu connection string trong log).
- **Kiểm chứng cục bộ đạt:** `node --test test/postgres-foundation.test.cjs` (5/5 pass), `node scripts/push-supabase-schema.mjs --dry-run` (exit 0), `node scripts/push-supabase-schema.mjs --dry-run --with-roles` (exit 0), `git check-ignore -v .env` (pass).
- **Lệnh sẵn sàng chạy sau khi điền thông tin thật vào `.env`:**
  - Kiểm tra cấu hình: `node --env-file=.env scripts/push-supabase-schema.mjs --dry-run --with-roles`
  - Đẩy schema lên Supabase: `node --env-file=.env scripts/push-supabase-schema.mjs --apply` (thêm `--with-roles` để chạy kèm `202611170001_identity.sql`).
- **Giới hạn / Blocker:** Chưa chạy đẩy schema hay nghiệm thu thực tế trên Supabase cloud do đang chờ người dùng điền thông tin kết nối thật vào `.env`.

## Checkpoint 17/11/2026 — kiểm tra cục bộ đạt, nghiệm thu cloud pending

- **Identity worker report:** focused auth/order tests 15/15 pass; `@supabase/ssr` 0.12.7, `@supabase/supabase-js` 2.119.0 và `@types/pg` 8.23.1 được pin. Worker bỏ production TypeScript check trùng; Root typecheck sau đó pass. `/api/session` local-only với `NARI_AUTH_ENABLED`; production trả 503, `businessAccess: false`; provider roles SQL chưa áp dụng.
- **Catalog worker report:** PostgreSQL pool/transaction, Storage adapter và public catalog async authoritative từ PostgreSQL (`source: 'postgres'`), không fallback khi DB rỗng/lỗi; SQLite mặc định dev, production cần PostgreSQL. Deals/bestseller/new-arrivals membership đang rỗng chờ migrate; admin mutations vẫn đóng. Worker báo 5 foundation tests, PGlite và SQLite storage readback pass.
- **Root kiểm chứng:** `node --test` trên 10 file 36/36 pass; typecheck pass; lint exit 0, 0 errors và 1 warning cũ (`campaigns-location.ts`, unused `brandText`); isolated production build pass exit 0, 369/369 pages. Có cảnh báo middleware deprecated/external lockfile chưa xử lý; build sandbox đầu lỗi fetch Google Fonts, retry được duyệt network pass. Chưa có browser cuối sau freeze. Baseline browser dev cô lập 3035: home desktop/mobile không tràn ngang, login unavailable, console chỉ auth 401. HTTP private APIs denied; unknown tag vẫn 200 và chưa sửa.
- Wave C (orders/inventory) và Wave D (route/CI) **chưa làm**. Không đánh dấu toàn bộ backlog hoàn tất. Chưa có `.env`/provider/database config hoặc credentials, chưa chạy cloud mutation/migration, chưa nghiệm thu PostgreSQL server/Storage staging.
- Chính sách chi phí từ checkpoint này: tối đa 1 worker; model nhẹ cho tài liệu/tác vụ hẹp; Sol medium cho code thường quy; Astra chỉ review mốc trọng yếu, không chạy nền liên tục; CodeGraph targeted, không đọc toàn codebase. Xem `docs/MULTI_AGENT_DELIVERY_PLAN.md` và `docs/SESSION_HANDOFF.md`.

## Checkpoint 16/11/2026 — đang triển khai backend và phân quyền

Đã thêm policy admin toàn quyền, khung màn hình nhân viên, giao diện quản trị sản phẩm và nền catalog SQLite runtime. Đăng nhập và API quản trị vẫn đóng do chưa có provider xác thực; tác vụ nhân viên chưa kết nối. Đã nối runtime nhiều trang storefront nhưng chưa nghiệm thu browser và mọi landing. Người dùng chọn PostgreSQL/Supabase; migration mới ở dạng nháp chưa chạy, đơn hàng an toàn và kiểm thử đầu cuối chưa hoàn tất. Chi tiết tiếp nối: `docs/SESSION_HANDOFF.md`.

## Checkpoint Wave 10 (Chuyển Đổi Hoàn Tất Nhận Diện Thương Hiệu & Tone Màu **Nari Home — Phương Án A**) — 14/11/2026 [HOÀN TẤT & ĐÃ XÁC MINH]

- **Tài liệu kế hoạch chi tiết**: [docs/NARI_HOME_REBRAND_PLAN.md](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/docs/NARI_HOME_REBRAND_PLAN.md)
- **Nhận diện thương hiệu mới**: **Nari Home** — *"Khơi nguồn vẻ đẹp - Kiến tạo khí chất"* (áp dụng chính thức Phương án A — Header nền Kem Lụa Sáng `#F6ECE3`).
- **5 Hạng mục chuyển đổi hoàn tất**:
  1. **Hệ Thống Font Chữ & Metadata (`src/app/layout.tsx`)**:
     - Nạp cặp font `Cormorant_Garamond` (`--font-display`, weight 500/600/700) và `Be_Vietnam_Pro` (`--font-sans`, weight 400/500/600/700) với `subsets: ["latin", "vietnamese"]`.
     - Cập nhật title: `Nari Home — Khơi nguồn vẻ đẹp - Kiến tạo khí chất | Mỹ Phẩm & Clinic Chính Hãng`.
  2. **Design Tokens & Bảng màu Luxury Silk & Pearl Champagne (`src/app/globals.css`)**:
     - Cập nhật biến CSS `:root`: `--bg-page: #faf5f0;`, `--bg-surface-alt: #f6ece3;`, `--brand-green: #3d2e24;` (Deep Espresso), `--brand-accent: #9e7656;` (Champagne Bronze), `--orange: #b86b4b;` (Warm Terracotta), `--text: #1e1b18;` (Obsidian Charcoal), `--muted: #6e5a4f;` (Warm Taupe), `--line: #e6d5c5;` (Silk Border).
     - Định kiểu Header Phương án A (`.header`, `.site-header`, `.header-main-bar`): Nền Kem Lụa Sáng gradient `linear-gradient(135deg, #faf5f0 0%, #f6ece3 52%, #efe2d4 100%)`, viền đáy vàng đồng `#e2ceba`, chữ đen charcoal `#1e1b18`, thanh thông báo Espresso `#3d2e24`, ô tìm kiếm viền `#d4beaa`, thanh điều hướng `#fdfaf7`.
  3. **Component `<NariHomeLogo />` & Hero Banner Trang Chủ**:
     - Tạo component SVG + Typography logo `src/components/sites/hasaki/nari-home-logo.tsx`.
     - Thay thế logo Hasaki cũ trên Header, Footer, Giỏ hàng, Checkout bằng `<NariHomeLogo />`.
     - Đặt banner chính thức `public/nari-home-banner.jpg` làm **Slide đầu tiên** của Hero Banner Carousel trang chủ (`src/app/page.tsx`).
  4. **Thẻ Sản Phẩm, Footer & Các Màn Hình Con**:
     - Thẻ sản phẩm (`src/components/sites/hasaki/product-card.tsx`): Giá & tag quà tặng chuyển sang Warm Terracotta `#b86b4b` và Deep Espresso `#3d2e24`.
     - Footer (`src/components/sites/hasaki/footer.tsx`): Bản quyền © 2026 Nari Home Beauty & Clinic, hotline, email `hotro@narihome.vn`.
     - Đăng nhập/Đăng ký (`/dang-nhap`, `/dang-ky`), Modal tài khoản: Đồng bộ bảng màu và nhãn Nari Home.
  5. **Cập Nhật Theo Yêu Cầu Người Dùng & Hệ Thống Biến Thương Hiệu Tập Trung (`src/lib/brand-config.ts`)**:
     - Tạo [src/lib/brand-config.ts](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/lib/brand-config.ts) và [.env.example](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/.env.example) cung cấp `BRAND_CONFIG`, `brandText()`, `brandDeep()` để quản lý tập trung toàn bộ tên thương hiệu (`Nari Home` / `Nari`), slogan, dịch vụ (`Nari Deals`, `NariNow 2H`, `Nari Clinic & Spa`, `Nari Rewards`) tại 1 nơi duy nhất.
     - Đấu nối `brandDeep()` vào toàn bộ các bộ đọc dữ liệu (`catalog.ts`, `interactive-ui.ts`, `campaigns-location.ts`, `support-stores.ts`, `clinic-services.ts`, `product-details.ts`, `deals-bestsellers.ts`) và đồng bộ **61 files** trong `src/` — kết quả kiểm toán tự động đạt **`Hasaki: 0`** và **`OldGreen: 0`** trên toàn bộ mã nguồn `src/`.
     - Gỡ bỏ nhãn `"TOOL PLAYGROUND"` bên cạnh tab `"AI MCP & SEO Hub"` trong `src/components/sites/hasaki/admin-erp-view.tsx` (dòng 899-901).
     - Khắc phục lỗi kiểu dữ liệu `handleAddToCartFromFav` trong `src/components/sites/hasaki/customer-portal-view.tsx`.
- **Kiểm thử**: `npx tsc --noEmit --incremental false` pass 100% (0 lỗi), `node --test` 14/14 test pass.

---

## Checkpoint Wave 9 (Kiến Trúc White-Label O2O `/grill-me`, GitHub `ecommerce-platform`, Phân Quyền RBAC & Font Tiếng Việt) — 14/11/2026

- **Kiến trúc Database & Backend White-Label (`/grill-me`)**:
  - Xây dựng [src/lib/db/schema.sql](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/lib/db/schema.sql), [src/lib/db/repository.ts](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/lib/db/repository.ts) và tài liệu [docs/DATABASE_ARCHITECTURE.md](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/docs/DATABASE_ARCHITECTURE.md) hỗ trợ PostgreSQL (`DATABASE_URL`) + SQLite fallback, đa chi nhánh linh hoạt (`1..N` kho/cửa hàng) và công tắc bật/tắt hoặc xóa dữ liệu mẫu Hasaki (`ENABLE_HASAKI_SEED`).
  - Bảo mật phiên đăng nhập bằng HTTP-only signed cookie (`hasaki_session`), middleware bảo vệ route ([src/middleware.ts](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/middleware.ts)), và cổng webhook thanh toán ([src/app/api/payments/webhook/route.ts](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/app/api/payments/webhook/route.ts)).
- **Đổi tên Repo & Đẩy lên GitHub**:
  - Đổi tên dự án trong [package.json](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/package.json) thành `ecommerce-platform` và đẩy toàn bộ code lên `https://github.com/tylum123/ecommerce-platform` (nhánh `main`).
- **Phân quyền RBAC Route/Màn hình & Chuẩn hóa Font Tiếng Việt** *(Đang hoàn thiện & kiểm thử bởi subagent `DeepCoder`)*:
  - Phân quyền hiển thị rõ ràng giữa 4 nhóm vai trò (`Guest`, `Customer`, `Staff - Kho/Bác sĩ`, `Super Admin`) trên Header, Account Dialog, `/khach-hang/[section]` và `/quan-tri`.
  - Chuẩn hóa font Tiếng Việt (`subsets: ["latin", "vietnamese"]`) trong `src/app/layout.tsx` và `src/app/globals.css` để không bị lệch dấu hoặc nhảy font.

---

## Checkpoint Wave 8 (Chuẩn Hóa Bố Cục 1:1, Khôi Phục Tailwind CSS v4 & Xóa Sạch 404 Toàn Hệ Thống) — 14/11/2026

- **Khôi phục Tailwind CSS v4 & Sửa 5 màn hình lỗi thiết kế ([src/app/globals.css](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/app/globals.css))**: Bổ sung `@import "tailwindcss";` kèm phân lớp `@layer base` / `@layer components`, cố định kích thước `.cart-thumb` (80×80px) trên `/gio-hang`, và định kiểu đầy đủ cho `/he-thong-cua-hang`, `/bao-hanh`, `/ho-tro` và `<Footer />`.
- **Chuẩn hóa Layout Storefront & Màn hình con**: Đồng bộ `<ProductCard />` và `money(product.price)` trên trang chủ, cấu trúc 2 cột `.detail-lower-grid` và `.detail-gallery` trên trang chi tiết sản phẩm, gỡ bỏ các nút/thanh tiến độ trùng lặp trên Flash Deals và Bestsellers, bổ sung `<Footer />` và `.breadcrumbs` trên toàn bộ các trang con.
- **Xóa sạch 404 trên toàn bộ liên kết UI**: Mở rộng `resolveCategorySlug()` & `getCategoryTitle()` trong `src/lib/catalog.ts`, mở rộng nhận diện thương hiệu trong `/thuong-hieu/[slug]`, và bổ sung các route `/tra-cuu-don-hang`, `/campaign/[slug]`, `/cam-nang/[slug]`, `/dang-ky`.

---

## Checkpoint Wave 7 (Interactive Hover/Click Scraping & Data-Driven Backend) — 14/11/2026

Đã hoàn thành **Wave 7** theo đúng yêu cầu: sử dụng Playwright Chrome thực hiện `hover` và `click` trực tiếp trên các nút và ô tìm kiếm của `https://hasaki.vn/` để cào dữ liệu và giao diện tương tác động, nâng cấp toàn bộ giao diện Storefront / Danh mục / Chi tiết sản phẩm sát 1:1 với bản gốc, phát triển Backend theo hướng **Data-Driven không hardcode** và tối ưu hóa code không dư thừa:
- **Script & Dataset cào tương tác trực tiếp**: [scripts/scrape-hasaki-interactive-ui.mjs](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/scripts/scrape-hasaki-interactive-ui.mjs) và [interactive-ui-2026-11-14.json](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/docs/research/hasaki/interactive-ui-2026-11-14.json) kèm bộ ảnh đối chiếu tại `docs/design-references/02-search-popup-click.png`, `03-category-filters.png`, `04-deals-flash-slots.png`, `05-product-detail-tabs.png`.
- **Data-Driven Backend Service & API**: [src/lib/interactive-ui.ts](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/lib/interactive-ui.ts) và [src/app/api/ui-config/route.ts](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/app/api/ui-config/route.ts) cung cấp cấu hình UI động, gợi ý tìm kiếm thời gian thực (`?q=...`), chương trình quà tặng theo hóa đơn thương hiệu (`computeGiftBillPromo`), dòng phụ đề tiếng Anh (`computeProductEnglishSubtitle`), và tồn kho đa chi nhánh ERP theo từng sản phẩm (`?slug=...`).
- **Giao diện Header, ProductCard, Category & Product Detail**:
  - [header.tsx](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/hasaki/header.tsx): Search Popup tương tác khi click/focus + Mega Menu 3 cột khi hover/click `DANH MỤC`.
  - [product-card.tsx](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/hasaki/product-card.tsx): Phụ đề tiếng Anh, huy hiệu `NOWFREE 2H`, điểm sao màu cam, lượt bán/tháng (`🛒 XX/tháng`), thanh tiến độ deal và tag quà tặng viền cam đứt nét (`🎁 Bill ... Tặng ...`).
  - [catalog-view.tsx](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/hasaki/catalog-view.tsx): Dải 8 Logo Thương hiệu đầu trang Danh mục, cây danh mục `Sức Khỏe - Làm Đẹp`, bộ chọn `Hiển thị 40 / 60 / 80`, thanh Sticky Top Bar khi cuộn trang Chi tiết sản phẩm, huy hiệu `Số công bố với Bộ Y Tế`, biến thể `Công dụng` kèm ảnh, nút `Dung Tích` tự động tính lại giá bán, tra cứu tồn kho thực tế `📍 Còn X/186 CH có hàng`, và cột phải `- MIỄN PHÍ VẬN CHUYỂN -` 4 chính sách.

---

## Checkpoint Toàn Diện (Wave 1 – Wave 6 Hoàn Tất) — 13/11/2026

Dự án đã đạt bước nhảy vọt quan trọng: hoàn thành toàn bộ 6 đợt nâng cấp kiến trúc lớn (Storefront, Live Data Scraping, Multi-Facet Filtering, Detailed Sub-Screens, Unified Auth/RBAC, Enterprise ERP Admin Portal, Technical SEO Engine & Standardized AI MCP Server).

### 🎯 Tóm Tắt Thành Quả Hoàn Thành Theo Từng Task:

1. **Task 1 — Full Live Hasaki Data Scraping (`docs/research/hasaki/`)**:
   - Thu thập và chuẩn hóa thành công 9 bộ dữ liệu JSON thực tế từ `https://hasaki.vn/`:
     - `deals-2026-11-13.json` (Flash Deals, Shock Deals, Deal Tabs theo 4 khung giờ)
     - `bestsellers-2026-11-13.json` (Bán chạy với sales velocity & ratings thực tế)
     - `category-products-2026-11-13.json` (35 danh mục × 8 sản phẩm thật/danh mục)
     - `category-facets-2026-11-13.json` (Ma trận 14 nhóm facet lọc chuẩn Hasaki)
     - `brand-catalog-2026-11-13.json` (488 thương hiệu A-Z + 13 thương hiệu Flagship)
     - `product-rich-details-2026-11-13.json` (Thông số kỹ thuật, thành phần INCI, hướng dẫn, đánh giá verified, Q&A)
     - `clinic-rich-details-2026-11-13.json` (Dịch vụ y khoa, bảng giá niêm yết, quy trình 7-12 bước, cẩm nang)
     - `campaigns-home-2026-11-13.json` (Banner chiến dịch & danh mục 34 tỉnh/thành phố NowFree 2H)
     - `support-footer-2026-11-13.json` (260+ cửa hàng toàn quốc, FAQs, chính sách bảo hành)

2. **Task 2 — Storefront Multi-Facet Filtering (`Bộ lọc 14 nhóm`) & Detailed Sub-screens (`Các màn hình con chi tiết`)**:
   - Xây dựng sidebar lọc đa chiều 14 nhóm facet (`src/lib/category-facets.ts`, `catalog-view.tsx`, `product-card.tsx`), lọc theo giá tùy chỉnh hoặc preset, nhiều thuộc tính cùng lúc, đồng bộ hai chiều với URL search query.
   - Hoàn thiện toàn bộ các màn hình con chi tiết:
     - `/bang-gia-dich-vu.html`: Bảng giá dịch vụ Hasaki Clinic & Spa và công cụ tính toán chi phí đặt hẹn trực tiếp.
     - `/cam-nang.html`: Cẩm nang làm đẹp & chuyên môn da liễu với các tab chuyên đề và modal đọc bài viết chi tiết.
     - `/san-pham/[slug]`: Chi tiết sản phẩm toàn năng phân giải mọi slug trong 9 bộ dataset với giao diện 5 tab phong phú.
     - `/thuong-hieu/[slug]`, `/campaign/[slug]`, `/tag/[slug]`: Các trang thương hiệu, chiến dịch khuyến mãi và hashtag chuyên đề.
     - `/deals-dang-dien-ra.html`, `/san-pham-ban-chay.html`, `/he-thong-cua-hang`, `/ho-tro`, `/bao-hanh`: Phục vụ đầy đủ hành trình trải nghiệm người dùng.

3. **Task 3 — Authentication & Role-Based Access Control (`Đăng nhập & Đăng ký Admin + Khách hàng`)**:
   - Triển khai xác thực đa vai trò thống nhất tại `src/lib/auth.ts`, `/api/auth/route.ts`, `/dang-nhap/page.tsx`, `account-dialog.tsx`, `header.tsx`.
   - Cung cấp sẵn 4 tài khoản Demo 1-Click:
     - `admin@hasaki.vn` (Pass: `Hasaki@123`): Super Admin toàn quyền hệ thống & ERP.
     - `kho@hasaki.vn` (Pass: `Hasaki@123`): Quản lý Kho Tổng & Điều phối đơn NowFree 2H.
     - `bacsi@hasaki.vn` (Pass: `Hasaki@123`): Bác sĩ CKI Da liễu Hasaki Clinic Q.10.
     - `0901234567` (Pass: `Hasaki@123`): Khách hàng thân thiết VIP Diamond.
   - Header session badge thông minh, tự động hiển thị thông tin phiên đăng nhập và định tuyến đến `/quan-tri` hoặc `/khach-hang/tai-khoan`.

4. **Task 4 — CodeGraph-Partitioned Enterprise ERP Backend & Admin Portal (`/quan-tri`)**:
   - Kho lưu trữ và xử lý nghiệp vụ ERP tại `src/lib/server/erp-store.ts` kết hợp portal giao diện `admin-erp-view.tsx` với 4 module:
     - **Module 1: Quản lý Khách hàng (`/api/admin/users`)**: CRM phân hạng, điều chỉnh điểm loyalty có audit log, hồ sơ da, khóa/mở tài khoản.
     - **Module 2: Quản lý Nhân sự (`/api/admin/staff`)**: Phân quyền RBAC granular, trạng thái ca trực, gán chi nhánh công tác.
     - **Module 3: Quản lý Đơn hàng Fulfillment (`/api/admin/orders`)**: Quy trình hoàn tất đơn 7 giai đoạn (`pending` -> `confirmed` -> `packing` -> `shipping` -> `delivered` -> `cancelled` -> `returned`), giám sát SLA giao nhanh NowFree 2H.
     - **Module 4: Quản lý Kho Đa Chi Nhánh (`/api/admin/inventory`)**: Tồn kho 5 chi nhánh phân vùng, kiểm soát tồn khả dụng/giữ chỗ, thực hiện lệnh `adjust_stock` & `transfer_stock` ghi nhận nhật ký kiểm toán.

5. **Task 5 — Technical SEO Engine & Standardized AI MCP Server (`/api/mcp`)**:
   - Technical SEO Engine (`src/lib/seo/seo-engine.ts`, `sitemap.ts`, `robots.ts`, `/api/admin/seo`): Tự động phát sinh sitemap động, Schema.org JSON-LD (Organization, Product, MedicalClinic, Breadcrumbs, FAQs), bộ chấm điểm SEO Health 100 điểm.
   - Standardized AI MCP Server (`src/lib/mcp/hasaki-mcp.ts`, `/api/mcp`): Chuẩn JSON-RPC 2.0 cung cấp 8 Tools, 5 Resources, 3 AI Prompts và tích hợp AI Playground kiểm thử trực quan trong trang Admin.

6. **Task 6 — CodeGraph Architecture Metrics**:
   - Quy mô hệ thống: **160+ files**, **1.757+ nodes**, **3.241+ edges**, **56+ routes**, **266+ functions**, **110+ interfaces**.
   - Phân lớp kiến trúc 4 tầng rõ ràng (Data -> Domain -> State/Store -> Presentation), đạt 100% Type-Safe Strict Mode, **Zero Circular Dependencies**.

---

## Checkpoint Trước Đó (Lịch sử lưu giữ) — 13/11/2026

- Mục tiêu vẫn là hoàn thiện toàn bộ frontend Hasaki, các nút và màn hình con; **chưa hoàn thành**. Giữ nguyên tất cả thay đổi Git hiện có. Chi tiết mới nhất và bằng chứng: `docs/SESSION_HANDOFF.md`, `docs/clone-gap-report.md`, `docs/research/hasaki/feature-inventory-and-delivery.md`.
- Đã có trang chủ, danh mục, tìm kiếm, thương hiệu, sản phẩm, giỏ và checkout thử nghiệm; Deals, bán chạy, hàng mới, Clinic, 42 chi tiết dịch vụ và booking đã có route local. Dữ liệu chỉ gồm mẫu hoặc ảnh chụp giới hạn; nhiều ảnh phụ thuộc CDN nguồn. Các trang, trạng thái, dữ liệu và responsive còn thiếu nhiều.
- Tài khoản là modal thử nghiệm; captcha, OTP, OAuth, đăng nhập thật chưa kết nối. Booking chỉ xem lại, không gửi lịch; checkout chỉ kiểm tra đầu vào và xem lại, không lưu/gửi thông tin nhận hàng hoặc tạo đơn. Giỏ lưu localStorage. Không có thanh toán, vận chuyển, tồn kho hay backend thực.
- Lượt gần nhất: thêm `checkout-view.tsx`, xác minh thông tin bắt buộc, SĐT sai, xem lại và không gửi request; production `http://localhost:3020/` đã chạy nhưng trạng thái tiến trình có thể thay đổi. `npm.cmd run lint` và `npm.cmd run build` đạt. Nguồn yêu cầu đăng nhập để thêm giỏ, chưa đối chiếu được checkout có sản phẩm.
- CodeGraph 1.6.2 đã cài cục bộ và đăng ký MCP, truy vấn được các thành phần chưa commit; telemetry MCP tắt. Npm install từng báo 25 vấn đề trong toàn bộ cây dependency, gồm 2 critical; chưa phân tích nguồn gốc. Không tự chạy `npm audit fix --force`.
- Tiếp tục: đọc handoff/gap report, xác minh trạng thái repo và browser; khảo sát từng template ở viewport/trạng thái tương ứng, ưu tiên dữ liệu catalog/search, chi tiết và tương tác còn thiếu. Dùng subagent để khảo sát khi phù hợp theo yêu cầu người dùng, giới hạn sửa mỗi template theo bàn giao. Chạy kiểm tra sau từng phần tích hợp, cập nhật cả hai tài liệu trước khi gần hết quota.

## Lịch sử ban đầu — các ghi chú sau có thể đã lỗi thời

- Dự án được tạo từ `JCodesMore/ai-website-cloner-template`, đã bỏ remote gốc. Đây là repository Git tại máy, chưa tạo repository GitHub.
- Trang `/` là bản dựng thử, dùng dữ liệu và hình minh họa. Tìm kiếm lọc dữ liệu mẫu; giỏ hàng mẫu lưu trên trình duyệt.
- Đã thêm trang danh mục cho 28 đường dẫn và trang chi tiết cho 8 sản phẩm mẫu. Các danh mục chưa có dữ liệu mẫu hiển thị trạng thái trống. Bộ lọc thương hiệu, sắp xếp và số lượng hoạt động trên dữ liệu mẫu; giao diện giỏ hàng và đặt hàng mẫu không tạo đơn thực.
- Chưa có backend, đăng nhập, giỏ hàng hoàn chỉnh, thanh toán hoặc trang quản trị.
- Đã khảo sát sơ bộ trang chủ bằng Chrome: banner chính dạng carousel, hai banner bên phải, hàng danh mục, Flash Deals, danh mục, thương hiệu và bán chạy. Chưa có ảnh đối chiếu trang danh mục và sản phẩm trên desktop/mobile; chưa thể kết luận độ giống hoàn toàn.
- Môi trường template yêu cầu Node.js 24 trở lên. Cài dependencies bằng `npm install` rồi chạy `npm run dev`.

## Audit 14/11/2026 — kết luận kiểm chứng mới nhất

Đã chia 3 subagent (1 nhẹ, 2 vừa), kết hợp Codegraph, nguồn công khai, HTTP local và browser riêng. Báo cáo tổng hợp: [audit-2026-11-14-summary](docs/research/hasaki/audit-2026-11-14-summary.md) (đường dẫn gốc repo). Các tuyên bố cũ hoàn thiện 100% không còn được coi là nghiệm thu: phát hiện guest API quản trị trả dữ liệu, slug lạ fallback sai, thành công trước API, ảnh 404 và JS chunks 500. Chưa sửa ứng dụng. Runtime/source có thể lệch; chưa nghiệm thu toàn bộ nút hoặc màn hình sau đăng nhập. Ưu tiên P0 runtime/auth → P1 dữ liệu/định tuyến/nghiệp vụ → P2 đối chiếu từng template. Xem báo cáo và ENGINEERING_RULES.md để tiếp nối.

## Chuẩn Hóa Layout & Các Màn Hình Con Header — 14/11/2026

- Đã rà soát và sửa các lỗi lệch bố cục trên Trang chủ, Danh mục, Chi tiết sản phẩm và toàn bộ các màn hình con liên kết từ Header (`deals-dang-dien-ra.html`, `campaign/wow`, `san-pham-ban-chay.html`, `hang-moi-ve.html`, `thuong-hieu`, `thuong-hieu/[slug]`, `tag/[slug]`, `tra-cuu-don-hang`, `khach-hang/[section]`).
- Đã xác minh bằng `node --test test/access-policy.test.mjs test/brand-filter.test.mjs` (7/7 pass), `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run build` và bộ ảnh chụp kiểm toán trực quan `docs/design-references/audit-local-01-home.png` → `audit-local-08-order-lookup.png`.


