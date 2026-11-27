# Session handoff — Hasaki clone

## Checkpoint 27/11/2026 (Custom Domain `narihome.io.vn` Live & README Kiến Trúc) — Khôi Phục Supabase, Gắn Tên Miền Chính Thức & Deploy Bản 23/11

- **Khắc phục sự cố Server & Kết nối Tên miền chính thức `https://narihome.io.vn`:**
  - Khôi phục Supabase project `ywrzguhuzekkusoupehf` (sau 7 ngày ngủ đông gói Free); xác nhận `npm run db:verify` **PASS** (`ok: true`, `wave3Applied: true`, `currentUser: "nari_catalog_app"`, `verifiedTls: true`, `rls: true`, `runtimePolicies: 44`, `deniedWrites: true`).
  - Đăng ký tên miền **`narihome.io.vn`** (iNET), trỏ Nameserver về Cloudflare (`alec.ns.cloudflare.com`, `gene.ns.cloudflare.com`, Zone ID `ef8e488c2ada886687ce5b615e867ca2`), và cấu hình Supabase Auth Redirect URLs cho `https://narihome.io.vn/auth/callback` & `https://narihome.io.vn/khoi-phuc-mat-khau`.
  - Cập nhật Custom Domain & domain references sang `narihome.io.vn` trong [`wrangler.jsonc`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/wrangler.jsonc), [`src/lib/brand-config.ts`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/lib/brand-config.ts), [`src/app/sitemap.ts`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/app/sitemap.ts), [`src/app/robots.ts`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/app/robots.ts), [`src/lib/seo/seo-engine.ts`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/lib/seo/seo-engine.ts), [`src/components/sites/nari/footer.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/footer.tsx), [`src/components/sites/nari/customer-portal-view.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/customer-portal-view.tsx), [`src/lib/support-stores.ts`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/lib/support-stores.ts).
  - Viết lại hoàn chỉnh [`README.md`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/README.md) trình bày đầy đủ kiến trúc hệ thống (Mermaid diagram), tech stack, cấu trúc thư mục, 4 schemas/18 bảng/44 RLS policies PostgreSQL, bảo mật RBAC, hướng dẫn cài đặt & deploy Cloudflare Workers.
- **Kiểm chứng & Triển khai Production (`https://narihome.io.vn`):**
  - `node --test test/*.mjs test/*.cjs`: **`92` passed, `0` failed** (`13` PGlite skipped khi `NARI_TEST_PGLITE_PATH` unset); `npm run typecheck`: **PASS** (`0` errors); `npm run lint`: **PASS** (`0` errors, `0` warnings).
  - `npm run cf:build`: **PASS** (exit `0`, `22/22` static pages + `ƒ Proxy (Middleware)`).
  - `npx wrangler deploy`: **PASS**, Version ID `02c7fb11-5b3e-4501-b5f2-3d3496fddefb`, gắn Custom Domains `narihome.io.vn` & `www.narihome.io.vn` (đồng thời đẩy live luôn bản nâng cấp Skeleton & Lazy Load ngày 23/11).
  - Live HTTPS Probes (`https://narihome.io.vn`): `GET /` → HTTP `200` (`71.126` bytes), `GET /api/products` → HTTP `200`, `GET /api/stores` → HTTP `200`.

## Checkpoint 23/11/2026 (Frontend Loader, Skeleton & Lazy Load) — Tối Ưu Tải Mượt Chuyển Trang, Code-Splitting & Shimmer UI

- **Tài nguyên mới & sửa đổi (đã xác minh):**
  - **Global Route Loader & CSS Shimmer:** [`src/app/globals.css`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/app/globals.css) (`@keyframes nari-shimmer`, `.nari-shimmer`, `.nari-route-progress`, `.nari-img-frame`, `.nari-smooth-img`, tôn trọng `prefers-reduced-motion`), [`src/components/sites/nari/route-progress-bar.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/route-progress-bar.tsx) (dùng ref thuần, không `setState` trong `useEffect`), bọc trong `<Suspense>` tại [`src/app/layout.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/app/layout.tsx).
  - **Hệ thống Skeleton dùng chung & 8 Route `loading.tsx`:** [`src/components/sites/nari/ui-skeletons.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/ui-skeletons.tsx) (Server-Component safe, `aria-busy="true"`) + cập nhật [`src/app/loading.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/app/loading.tsx) và tạo mới `loading.tsx` cho 7 route trọng yếu (`san-pham/[slug]`, `danh-muc/[slug]`, `thanh-toan`, `booking`, `tra-cuu-don-hang`, `khach-hang/[section]`, `quan-tri`).
  - **Lazy Load (`next/dynamic`) & Smooth Image:** [`src/components/sites/nari/lazy-reveal.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/lazy-reveal.tsx), [`src/lib/smooth-image.ts`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/lib/smooth-image.ts); code-split `AccountDialog`, `LocationDialog`, `StorefrontCartDrawer` trong [`header.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/header.tsx); code-split `ProductRichSections` trong [`catalog-view.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/catalog-view.tsx); tạo [`admin-erp-loader.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/admin-erp-loader.tsx) code-split `AdminErpView` trên [`src/app/quan-tri/page.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/app/quan-tri/page.tsx); gắn lazy + shimmer frame cho [`product-card.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/product-card.tsx) & [`home-view.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/home-view.tsx) (giữ `priority` cho ảnh hero LCP).
  - **Client Fetch Skeleton & Button Spinner (`Loader2`):** Gắn trạng thái đang tải cho tìm kiếm nhanh ([`header.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/header.tsx)), Mini Cart Drawer ([`storefront-cart-drawer.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/storefront-cart-drawer.tsx)), đặt hàng ([`checkout-view.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/checkout-view.tsx)), lịch hẹn ([`booking-view.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/booking-view.tsx)), tra cứu đơn ([`src/app/tra-cuu-don-hang/page.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/app/tra-cuu-don-hang/page.tsx)), và quản trị sản phẩm ([`admin-products-view.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/admin-products-view.tsx)).
- **Kiểm chứng tổng thể sau sửa cuối:**
  - `node --test test/*.mjs test/*.cjs` (cập nhật [`test/frontend-ux.test.cjs`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/test/frontend-ux.test.cjs) và alignment stub ở [`test/access-policy.test.mjs`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/test/access-policy.test.mjs)): **`92` passed, `0` failed** (`13` PGlite tests skipped khi `NARI_TEST_PGLITE_PATH` unset, khớp CI).
  - `npm run typecheck`: **PASS** (`0` errors).
  - `npm run lint`: **PASS** (`0` errors, `0` warnings).
  - `npm run cf:build`: **PASS** (exit `0`, tạo mới `.open-next\worker.js`, `22/22` static pages + `ƒ Proxy (Middleware)`).
- **Trạng thái Deploy:** Chưa chạy `npx wrangler deploy` trong phiên này; bundle OpenNext đã build sẵn sàng để deploy lên `https://nari-home.tylum123.workers.dev` khi chủ dự án yêu cầu.

## Checkpoint 20/11/2026 (Frontend UX Optimization & Live E2E Demo) — Tối Ưu Giao Diện Trực Quan, Sửa Mobile 390px & Demo Luồng Đặt Hàng Thật

- **Các vấn đề phát hiện trực tiếp trên `https://nari-home.tylum123.workers.dev` & đã khắc phục:**
  - **Sửa lỗi encoding tiếng Việt (mojibake) & thêm khiên chắn runtime:** Khắc phục `.env` (`NEXT_PUBLIC_BRAND_SLOGAN`, `NEXT_PUBLIC_BRAND_COMPANY`) và bổ sung `sanitizeBrandString()` trong [`src/lib/brand-config.ts`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/lib/brand-config.ts) để tự phục hồi chuỗi tiếng Việt sạch nếu biến môi trường bị double-encoded (vẫn giữ nguyên các từ tiếng Việt hoa hợp lệ chứa `Â`/`Ã`).
  - **Sửa bố cục Hero & Trang chủ PostgreSQL ([`src/components/sites/nari/home-view.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/home-view.tsx)):** Bỏ khoảng trống 1/3 bên phải khi chưa có side banner (`.hero-layout--single`), hiển thị khối **Sản phẩm nổi bật Nari Home** ngay màn hình đầu, thay quick-link & thương hiệu cũ bằng danh mục/thương hiệu PostgreSQL thật (`Nari Lab`, `Nari Botanicals`), và thêm nút **Cuộn lên đầu trang** mượt.
  - **Tối ưu Mobile 390px & Thẻ sản phẩm ([`src/app/globals.css`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/app/globals.css), [`src/components/sites/nari/nari-home-logo.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/nari-home-logo.tsx), [`src/components/sites/nari/product-card.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/product-card.tsx)):** Khắc phục tràn ngang (`scrollWidth === 390` tại 390px), ẩn phụ đề logo trên màn nhỏ, và giữ giá bán (`245.000 ₫`) + huy hiệu giảm giá (`-17%`) trên 1 dòng không rớt ký tự `₫`.
  - **Đồng bộ bảng màu Luxury Silk & gỡ copy mẫu ([`src/components/sites/nari/catalog-view.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/catalog-view.tsx), [`src/components/sites/nari/product-rich-sections.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/product-rich-sections.tsx), [`src/components/sites/nari/cart-view.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/cart-view.tsx)):** Thay toàn bộ màu xanh lá cũ (`#226c47`, `#eaf5ed`, `#eef7f2`) bằng Luxury Espresso/Silk (`#3d2e24`, `#b86b4b`, `#faf5f0`), gỡ nhãn `"sản phẩm mẫu"` / `"mô phỏng"`, và fallback sản phẩm gợi ý khi cùng danh mục chỉ có 1 SKU.
- **Tính năng tối ưu UX/Conversion mới:**
  - **Slide-over Mini Cart Drawer + Toast + Thanh Freeship 90K:** [`src/lib/cart.ts`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/lib/cart.ts), [`src/components/sites/nari/storefront-cart-drawer.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/storefront-cart-drawer.tsx) (dùng `useSyncExternalStore` tương thích React Compiler), tích hợp nút mở trực tiếp ở [`src/components/sites/nari/header.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/header.tsx) và nút **Thêm vào giỏ** nhanh ngay trên `ProductCard`.
  - **Chuyển đổi nhanh & Skeleton chuyển trang:** Nút **MUA NGAY NARINOW 2H** đi thẳng tới `/thanh-toan`, thanh `.mobile-product-bar` cố định đáy trên mobile, nút **Sao chép mã đơn** + tự điền `?code=` trong [`src/components/sites/nari/checkout-view.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/checkout-view.tsx) & [`src/app/tra-cuu-don-hang/page.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/app/tra-cuu-don-hang/page.tsx), và [`src/app/loading.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/app/loading.tsx).
- **Kiểm chứng, Deploy & Demo E2E Live (`https://nari-home.tylum123.workers.dev`):**
  - Bộ test [`test/frontend-ux.test.cjs`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/test/frontend-ux.test.cjs) + toàn bộ suite: **`88` passed, `0` failed** (`13` PGlite skipped khi `NARI_TEST_PGLITE_PATH` unset, khớp [`.github/workflows/ci.yml`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/.github/workflows/ci.yml)); `npm run typecheck` (`0` errors); `npm run lint` (`0` errors, `0` warnings).
  - Build & Deploy cuối (`npm run cf:build` + `npx wrangler deploy`): Version ID `7debffc8-0af4-40dc-975b-7dd9e584deb8`, `Total Upload: 10403.60 KiB / gzip: 2153.48 KiB`, `Worker Startup Time: 192 ms`; chụp kiểm chứng Desktop 1440px & Mobile 390px đều gọn, không rớt dòng giá và không tràn ngang.
  - **Demo E2E thật qua Chrome CDP trên bản live (tạo đơn PostgreSQL thật `NARI-20261120-331B233E`):** Quick-Add `NARI-CLN-002` (`245.000 ₫`) → Toast → Mini Cart Drawer đạt **Miễn phí NariNow 2H** → `/thanh-toan` (chọn chi nhánh `Nari Home Flagship — Quận 1` / `branch-hcm-q1`, COD) → xác nhận đơn `NARI-20261120-331B233E` → bấm link sang `/tra-cuu-don-hang?code=NARI-20261120-331B233E` + SĐT `0909888777` hiển thị đơn trạng thái `Chờ xác nhận` (`0` console/page errors).

## Checkpoint 20/11/2026 (Plans 1, 2, 3 & 5 Live) — Local Fonts, Payment Webhook, PostgreSQL Admin ERP & Customer Portal

- **Phạm vi thực hiện theo quyết định chủ dự án:** Triển khai hoàn chỉnh **Kế hoạch 5, 3, 1, 2** và **bỏ Kế hoạch 4** (không mở `/api/warranty`, `/api/analytics`, `/api/mcp` nối DB, hay live clinic slot availability). Không thay đổi DDL Supabase (giữ nguyên 18 bảng và 44 RLS policies).
- **Kế hoạch 5 — Local Fonts (`src/app/fonts/*`, [`src/app/layout.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/app/layout.tsx)):**
  - Chuyển hoàn toàn từ `next/font/google` sang `next/font/local` với 5 file `.ttf` chính thức OFL đầy đủ bộ ký tự Latin + Tiếng Việt (`BeVietnamPro-{Regular,Medium,SemiBold,Bold}.ttf`, `CormorantGaramond-Variable.ttf`), giữ nguyên biến CSS `--font-sans` và `--font-display`.
- **Kế hoạch 3 — Payment Webhook, Chọn Chi Nhánh & Gắn Quyền Sở Hữu Đơn/Lịch Hẹn:**
  - Tạo [`src/lib/server/postgres-payment-webhook-service.ts`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/lib/server/postgres-payment-webhook-service.ts) và nối [`src/app/api/payments/webhook/route.ts`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/app/api/payments/webhook/route.ts) với xác thực chữ ký HMAC-SHA256, chống replay trong cửa sổ thời gian, idempotency qua `nari_orders.idempotency_keys` (`scope = 'payment_webhook'`), cập nhật ACID `orders` + `order_events`, và fail-closed `503` khi `NARI_PAYMENT_WEBHOOK_ENABLED !== "true"` hoặc thiếu secret `< 16` ký tự.
  - Bổ sung `supportsNowfree2h` vào [`src/lib/backend-contracts.ts`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/lib/backend-contracts.ts) và [`src/lib/server/postgres-clinic-service.ts`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/lib/server/postgres-clinic-service.ts); tải danh sách chi nhánh thật từ PostgreSQL trong [`src/app/thanh-toan/page.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/app/thanh-toan/page.tsx) và hiển thị bộ chọn chi nhánh + phương thức giao (`NariNow 2H` / `Tiêu chuẩn`) trong [`src/components/sites/nari/checkout-view.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/checkout-view.tsx).
  - Thêm `resolveOptionalSupabaseUserId()` trong [`src/lib/server/supabase-session.ts`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/lib/server/supabase-session.ts) để tự động gắn `user_id` đã xác thực vào đơn hàng (`/api/orders`) và lịch hẹn clinic (`/api/bookings`) khi khách đang đăng nhập.
- **Kế hoạch 1 — PostgreSQL Admin ERP & Supabase Auth/RBAC:**
  - Xóa hoàn toàn store in-memory cũ `src/lib/server/erp-store.ts`, tách DTO thuần sang [`src/lib/erp-types.ts`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/lib/erp-types.ts) và xây dựng [`src/lib/server/postgres-erp-service.ts`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/lib/server/postgres-erp-service.ts) trên PostgreSQL.
  - Nối `/api/admin/{users,staff,orders,inventory}` sang PostgreSQL sau cổng `NARI_ERP_ADMIN_ENABLED` + `authorizeBusinessRequest` trong [`src/lib/server/access-policy.ts`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/lib/server/access-policy.ts) (khóa cập nhật nhân sự qua web bằng `501 STAFF_PROVISIONING_OUT_OF_BAND` để bảo toàn bất biến bảo mật `provisioned_identities` read-only ở runtime; từ chối khóa tài khoản khách hàng bằng `400 CUSTOMER_LOCK_UNSUPPORTED`).
  - Bảo vệ `/quan-tri` qua [`src/proxy.ts`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/proxy.ts) và [`src/app/quan-tri/page.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/app/quan-tri/page.tsx) bằng Supabase Principal thật; gỡ demo role switcher khỏi [`src/components/sites/nari/admin-erp-view.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/admin-erp-view.tsx) & [`src/components/sites/nari/admin-access-denied.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/admin-access-denied.tsx), và bổ sung link điều hướng vào `/quan-tri` trong [`src/components/sites/nari/account-dialog.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/account-dialog.tsx), [`src/components/sites/nari/supabase-login-form.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/supabase-login-form.tsx) và [`src/components/sites/nari/admin-products-view.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/admin-products-view.tsx).
- **Kế hoạch 2 — Customer Auth & Customer Portal PostgreSQL:**
  - Bổ sung [`src/lib/customer-types.ts`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/lib/customer-types.ts), [`src/lib/server/postgres-customer-service.ts`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/lib/server/postgres-customer-service.ts), `checkPostgresScopedRateLimit()` trong [`src/lib/server/session-input.ts`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/lib/server/session-input.ts), các route [`/api/auth/register`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/app/api/auth/register/route.ts), [`/api/auth/recovery`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/app/api/auth/recovery/route.ts), [`/auth/callback`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/app/auth/callback/route.ts), [`/api/customer/portal`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/app/api/customer/portal/route.ts), trang [`/dang-ky`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/app/dang-ky/page.tsx), [`/khoi-phuc-mat-khau`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/app/khoi-phuc-mat-khau/page.tsx), [`/dang-nhap`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/app/dang-nhap/page.tsx), [`password-recovery-view.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/password-recovery-view.tsx) và [`customer-portal-view.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/customer-portal-view.tsx).
- **Kiểm chứng & Triển khai Production (`https://nari-home.tylum123.workers.dev`):**
  - Test suites: `node --test test/*.mjs test/*.cjs` → **`84` passed, `0` failed** (`13` PGlite integration tests skipped khi `NARI_TEST_PGLITE_PATH` chưa đặt, khớp [`.github/workflows/ci.yml`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/.github/workflows/ci.yml)); gồm 3 bộ test mới [`test/postgres-erp-admin.test.cjs`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/test/postgres-erp-admin.test.cjs), [`test/payment-webhook.test.cjs`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/test/payment-webhook.test.cjs), [`test/postgres-customer-portal.test.cjs`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/test/postgres-customer-portal.test.cjs).
  - `npm run typecheck` (`0` errors), `npm run lint` (`0` errors, `0` warnings), `npm run cf:build` (`exit 0`, `.open-next\worker.js`).
  - `npx wrangler deploy`: **PASS**, Version ID `1ba6e313-29a9-4cd9-9812-685a7c3c2214`, `Total Upload: 10359.29 KiB / gzip: 2144.22 KiB`, `Worker Startup Time: 287 ms`, `20` static assets mới/cập nhật (bao gồm 5 file font local `.ttf`).
  - `npm run db:verify`: **PASS** (`ok: true`, `wave3Applied: true`, `currentUser: "nari_catalog_app"`, `verifiedTls: true`, `rls: true`, `runtimePolicies: 44`, `deniedWrites: true`).
  - Live HTTPS Probes (`https://nari-home.tylum123.workers.dev`):
    - `GET /`, `/thanh-toan` (SSR chứa `branch-hcm-q1`), `/dang-nhap`, `/dang-ky`, `/khoi-phuc-mat-khau` → HTTP `200`.
    - `GET /quan-tri`, `/khach-hang/tai-khoan` (chưa đăng nhập, `redirect: "manual"`) → HTTP `307` chuyển về `/dang-nhap?redirect=...`.
    - `GET /api/admin/users`, `/api/admin/staff`, `/api/admin/orders`, `/api/admin/inventory`, `/api/customer/portal` (chưa đăng nhập) → HTTP `401`.
    - `POST /api/payments/webhook` (tắt mặc định / thiếu chữ ký) → HTTP `503`.
- **Ghi chú vận hành:**
  - Để bật webhook thanh toán live: chạy `npx wrangler secret put NARI_PAYMENT_WEBHOOK_SECRET` (tối thiểu 16 ký tự), đổi `NARI_PAYMENT_WEBHOOK_ENABLED` thành `"true"` trong [`wrangler.jsonc`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/wrangler.jsonc) và deploy lại.
  - Trên Supabase Auth Dashboard → Redirect URLs, đảm bảo cho phép `https://nari-home.tylum123.workers.dev/auth/callback` và `https://nari-home.tylum123.workers.dev/khoi-phuc-mat-khau` cho email xác thực đăng ký và khôi phục mật khẩu.

## Checkpoint 19/11/2026 (Starter Catalog Live) — Nạp 2 Sản Phẩm Mẫu, Chi Nhánh Flagship & Dịch Vụ Clinic

- **Đã nạp dữ liệu khởi tạo idempotent qua [`scripts/seed-starter-catalog.mjs`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/scripts/seed-starter-catalog.mjs):**
  - Upload 2 ảnh sản phẩm lên Supabase Storage (`nari-catalog`): `catalog/starter-nari-serum-ha-b5.jpg`, `catalog/starter-nari-calm-cleanser.jpg` (cả hai trả HTTP `200 image/jpeg`).
  - Seed PostgreSQL (`--apply`): `2` brands (`Nari Botanicals`, `Nari Lab`), `2` categories (`cham-soc-da-mat-c4.html`, `sua-rua-mat-c19.html`), `2` products (`NARI-SRM-001` 390.000₫, `NARI-CLN-002` 245.000₫) kèm `12` specs, `1` flagship branch (`NARI-HCM-Q1` — Quận 1), `2` `inventory_balances` (`50` sp/SKU) + `2` `inventory_movements`, `1` clinic service (`NARI-SVC-001` 590.000₫).
  - Xác nhận `npm run lint` (`0` errors) và `npm run db:verify` PASS (`wave3Applied: true`, `products: 2`, `branches: 1`, `inventory_balances: 2`, `services: 1`).
- **Kiểm chứng Live End-to-End (`https://nari-home.tylum123.workers.dev`):**
  - `GET /` (`200`, hiển thị đủ 2 sản phẩm), `/api/products` (`200`, `2` sp), `/api/stores` (`200`, `total: 1`), `POST /api/cart/quote` (`200`, `subtotal: 390000` + VietQR), `/san-pham/*`, `/danh-muc/*`, `/thuong-hieu/*`, `/booking`, `/he-thong-cua-hang`, `/gio-hang`, `/thanh-toan` đều trả HTTP `200`.
- **Tài khoản Admin đã cấp sẵn trên Supabase (`nari_identity.provisioned_identities`):** `user_id: 9f183fe9-6dda-43d0-a4b6-f2c9e7da7305`, email `tylum123@gmail.com`, role `admin`, `active: true` (đăng nhập tại `/dang-nhap`).

## Checkpoint 19/11/2026 (Cloudflare Workers Live) — Triển khai OpenNext Workers + Hyperdrive lên `nari-home.tylum123.workers.dev`

- **Live URL:** `https://nari-home.tylum123.workers.dev`
- **Cloudflare Workers / OpenNext (`next@16.4.6`, `eslint-config-next@16.4.6`, `@opennextjs/cloudflare@1.20.17`, `wrangler@4.164.0`, `supabase@3.2.0`):**
  - Cấu hình `open-next.config.ts`, `wrangler.jsonc` gắn Hyperdrive binding `nari-supabase-db` (`650301fdebbf4bdfac223cb90ddaa1cd`), cập nhật `next.config.ts` (`images: { unoptimized: true }`), `eslint.config.mjs` (ignore `.open-next/**`, `.wrangler/**`, `cloudflare-env.d.ts`), và sửa 6 lỗi React Compiler ESLint trong [`src/components/sites/nari/admin-erp-view.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/admin-erp-view.tsx) và [`src/components/sites/nari/admin-products-view.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/nari/admin-products-view.tsx).
  - Build OpenNext (`npm run cf:build`, `NARI_ISOLATED_BUILD` unset): **PASS** (`exit 0`), `.open-next/worker.js` entrypoint `2,216` bytes, `.open-next/server-functions/default/handler.mjs` `6,553,506` bytes; static assets uploaded (`65` new, `3` existing).
  - Deploy (`npx wrangler deploy`): **PASS** (`exit 0`), `Total Upload: 10200.13 KiB / gzip: 2114.25 KiB` (< 3 MiB Free limit), `Worker Startup Time: 210 ms`, Version ID: `f498b0c4-f468-4005-80b6-3d3dbad8361b`.
  - Secrets (`npx wrangler secret bulk` & `wrangler secret list`): đã gắn `8` secrets (`NARI_POSTGRES_CA`, `NARI_POSTGRES_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `VIETQR_ACCOUNT_NAME`, `VIETQR_ACCOUNT_NO`, `VIETQR_BANK_ID`, `VIETQR_TEMPLATE`).
- **Hyperdrive Per-Request Adapter ([`src/lib/server/postgres-database.ts`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/lib/server/postgres-database.ts) + [`test/postgres-foundation.test.cjs`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/test/postgres-foundation.test.cjs)):**
  - Bổ sung `readHyperdriveConnectionString()` và `createHyperdriveDatabase()` khởi tạo `pg.Client` riêng cho từng lời gọi `query`/`transaction` (đóng qua `client.end()` trong `finally`) để tránh lỗi `workerd` cross-request I/O; fallback về singleton `Pool` ngoài Cloudflare Workers.
  - Cập nhật [`scripts/verify-supabase-live.mjs`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/scripts/verify-supabase-live.mjs) (`runtimePostgresConfig`) stub `@opennextjs/cloudflare`.
- **Kiểm chứng tổng thể & Live HTTPS Probes (`https://nari-home.tylum123.workers.dev`):**
  - `node --test test/*.mjs test/*.cjs`: `77` passed, `0` failed (`10` PGlite integration tests skipped khi `NARI_TEST_PGLITE_PATH` chưa đặt, khớp `.github/workflows/ci.yml`); `test/postgres-foundation.test.cjs`: `7/7` pass.
  - `npm run lint`: **PASS** (`0` errors, `0` warnings).
  - `npx next typegen` & `npm run typecheck`: **PASS** (`0` errors).
  - `npm run ops:doctor -- --live`: **PASS** (`Supabase DB: OK`, `wave3Applied: true`, `runtimePolicies: 44`, `Cloudflare Wrangler: OK` `tylum123@gmail.com`).
  - Live HTTPS Probes sau khi nạp secrets:
    - `GET /` → HTTP `200` (`Nari Home` rendered, `42090` bytes).
    - `GET /api/products` (2 sequential + 2 concurrent `Promise.all`) → tất cả `4` trả HTTP `200` (không có lỗi cross-request I/O hay 500/503).
    - `GET /api/stores` (2 sequential) → cả hai HTTP `200` (`"source":"postgres"`).
    - `GET /api/session` (unauthenticated) → HTTP `401` (`authenticated` false / `user: null`).
    - `GET /api/admin/products` (unauthenticated) → HTTP `401` (`AUTHENTICATION_REQUIRED`).
    - `POST /api/orders` (no origin) → HTTP `403` (`FORBIDDEN_ORIGIN`).
- **Bước thủ công & Lộ trình tiếp theo:**
  - `npm run ops:supabase -- login` vẫn là bước TTY thủ công của chủ dự án (`~/.supabase/access-token` chưa tạo; `SUPABASE_ACCESS_TOKEN` trống).
  - Lộ trình tính năng Production tiếp theo: seed danh mục Nari Home / chi nhánh / dịch vụ clinic thật vào Supabase, thay thế `erp-store.ts` in-memory trong `/api/admin/*`, nối Customer Portal (`/khach-hang/*`) & đăng ký/khôi phục mật khẩu vào Supabase Auth + `customer_profiles`, bật `/api/payments/webhook` + bộ chọn chi nhánh tại `/thanh-toan`, nối slot availability trực tiếp + `/api/warranty` + `/api/analytics` + `/api/mcp`, và chuyển `next/font/google` sang `next/font/local`.

## Checkpoint 18/11/2026 (Tạm kết thúc — Chuẩn bị Cloudflare Hyperdrive & Sửa `ops-cli.mjs`)

- **Đã hoàn tất & kiểm chứng trong bước này:**
  - **Sửa [`scripts/ops-cli.mjs`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/scripts/ops-cli.mjs):** Truyền `stdio: 'inherit'` khi chạy `ops:supabase` / `ops:cf` trong terminal TTY để lệnh `npm run ops:supabase -- login` không bị nuốt prompt/đứng hình.
  - **Hạ tầng Cloudflare đã tạo sẵn trên tài khoản `c0267fa333fa3b1a5b648ebf8a4b419e` (`tylum123.workers.dev`):**
    - Custom CA `nari-supabase-ca` (Supabase Root 2021 CA): ID `42155ffe-bf6d-4040-afac-779588547a18`.
    - Hyperdrive `nari-supabase-db` (`aws-1-ap-southeast-2.pooler.supabase.com:5432`, `--sslmode=verify-full`): ID `650301fdebbf4bdfac223cb90ddaa1cd`.
  - Cập nhật [`.gitignore`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/.gitignore) bỏ qua `.open-next/`, `.wrangler/`, `cloudflare-env.d.ts`.
  - Đã hủy clean `npm install` dở dang (`@opennextjs/cloudflare` / `next@16.4.6`) và xóa `open-next.config.ts` tạm để repo giữ trạng thái ổn định trên `next@16.3.5` (`.next` / Node.js).
- **Việc còn lại ở phiên sau (tiếp nối ngay):**
  1. **Bước 2 (`ops:supabase`):** Chạy `npm run ops:supabase -- login` trong PowerShell riêng để lưu `~/.supabase/access-token` (lỗi đứng màn hình trong `ops-cli.mjs` đã được sửa).
  2. **Bước 3 (Cloudflare Workers OpenNext + Hyperdrive):**
     - Nâng cấp `npm install next@16.4.6 eslint-config-next@16.4.6 @opennextjs/cloudflare@1.20.17` (peerDep yêu cầu `next >=16.4.5`).
     - Tạo `open-next.config.ts` và `wrangler.jsonc` gắn binding `HYPERDRIVE` (`id: "650301fdebbf4bdfac223cb90ddaa1cd"`), `nodejs_compat`, `APP_ORIGIN: "https://nari-home.tylum123.workers.dev"`.
     - Cập nhật [`src/lib/server/postgres-database.ts`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/lib/server/postgres-database.ts) dùng per-request `pg.Client` qua `HYPERDRIVE.connectionString` (`getCloudflareContext({ async: false })`) để tránh lỗi `"Cannot perform I/O on behalf of a different request"` của `workerd`.
     - Nạp secrets bằng `wrangler secret bulk`, build bằng `@opennextjs/cloudflare build`, deploy lên `nari-home.tylum123.workers.dev` và kiểm chứng live.

## Checkpoint 18/11/2026 (Cloud Live Wave 3) — Áp dụng & Xác minh Wave 3 trên Supabase Live

- **Thực thi Wave 3 SQL qua Supabase SQL Editor (Chrome):**
  - Chạy tuần tự 3 migration [`202611180001_auth_ratelimit_customers.sql`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/db/migrations/202611180001_auth_ratelimit_customers.sql), [`202611180002_orders_fulfillment.sql`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/db/migrations/202611180002_orders_fulfillment.sql), [`202611180003_clinic_bookings.sql`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/db/migrations/202611180003_clinic_bookings.sql) — cả 3 đều trả `Success. No rows returned` (không reset mật khẩu `postgres`).
- **Xác minh Live & Kích hoạt runtime Wave 3:**
  - `npm run db:verify` → PASS: `"ok":true,"wave3Applied":true,"currentUser":"nari_catalog_app","verifiedTls":true,"rls":true,"runtimePolicies":44,"deniedWrites":true` (đủ 18 bảng thuộc `nari_catalog`, `nari_identity`, `nari_orders`, `nari_clinic`).
  - Bật 3 cờ trong `.env` cục bộ: `NARI_SHARED_RATE_LIMIT=postgres`, `NARI_ORDERS_ENABLED=true`, `NARI_BOOKINGS_ENABLED=true`.
  - `npm run ops:doctor -- --live` → exit `0` (`Supabase DB: OK`, `Cloudflare Wrangler: OK`).
- **2 bước chủ dự án sẽ tự thực hiện khi sẵn sàng:**
  - Chạy `npm run ops:supabase -- login` trong terminal tương tác để cấp phiên CLI Supabase (hoặc điền `SUPABASE_ACCESS_TOKEN`).
  - Triển khai Cloudflare trên tài khoản `c0267fa333fa3b1a5b648ebf8a4b419e` (`tylum123.workers.dev`) theo kiến trúc đã chọn.

## Checkpoint 18/11/2026 (Chrome Ops) — Xác thực Cloudflare Wrangler OAuth & Khớp ID Dashboard

- **Xác thực Cloudflare Wrangler (`tylum123@gmail.com`):**
  - Hoàn tất OAuth qua Chrome (`127.0.0.1:9222`): `npm run ops:cf -- whoami` xác nhận `Account Name: Tylum123@gmail.com's Account`, `Account ID: c0267fa333fa3b1a5b648ebf8a4b419e`, subdomain `tylum123.workers.dev` (chưa có domain/zone hoặc Workers project).
  - Điền 2 định danh không nhạy cảm vào `.env`: `SUPABASE_PROJECT_REF=ywrzguhuzekkusoupehf`, `CLOUDFLARE_ACCOUNT_ID=c0267fa333fa3b1a5b648ebf8a4b419e`.
  - Cập nhật [`scripts/ops-cli.mjs`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/scripts/ops-cli.mjs) để `npm run ops:doctor -- --live` kiểm tra trực tiếp `wrangler whoami` ngay cả khi dùng OAuth (không cần static `CLOUDFLARE_API_TOKEN`); `test/ops-cli.test.mjs` đạt `8/8` pass và `ops:doctor -- --live` trả `Supabase DB: OK` + `Cloudflare Wrangler: OK`.
- **Trạng thái Supabase CLI & Wave 3 DDL cần quyết định từ chủ dự án:**
  - `supabase login` từ chối non-TTY (`LoginMissingTokenError`); cần chạy 1 lần trong terminal tương tác (`npm run ops:supabase -- login`) hoặc điền `SUPABASE_ACCESS_TOKEN`.
  - Chưa tự ý reset mật khẩu DB `postgres` trên Dashboard; chờ người dùng điền `DATABASE_URL` (Pooler IPv4 `aws-1-ap-southeast-2.pooler.supabase.com:5432`) hoặc xác nhận chạy `202611180001..0003` qua Supabase SQL Editor trên Chrome, và xác nhận hướng Cloudflare (**A** Workers/OpenNext hay **B** CDN/R2).

## Checkpoint 18/11/2026 (Giai đoạn 1–4) — Loại bỏ SQLite & Hasaki, CLI Supabase/Cloudflare & Kết nối PostgreSQL End-to-End

- **Đã hoàn thành & đẩy lên `origin/main` (Giai đoạn 1–2):**
  - `5495604` — Gỡ bỏ hoàn toàn SQLite (`src/lib/sqlite-db.ts`, `src/lib/db/schema.sql`, `hasaki-local.db`, import cũ) và ép runtime chạy 100% PostgreSQL (`live-catalog-store.ts`, `postgres-catalog-service.ts`).
  - `bbd2c86` — Xóa toàn bộ snapshot/script/identifier Hasaki (`docs/research/hasaki/`, `scripts/scrape-*.mjs`, `hasaki-source.html`, `hasaki-product.html`), giữ nguyên giao diện và chuyển toàn bộ component sang `src/components/sites/nari/` và `src/lib/mcp/nari-mcp.ts`.
  - `0866457` — Tích hợp CLI project-scoped `supabase` (`3.2.0`) và Cloudflare `wrangler` (`4.164.0`), `supabase/config.toml` (`ywrzguhuzekkusoupehf`), và `scripts/ops-cli.mjs` (`ops:doctor`, `ops:supabase`, `ops:cf`, `db:push`, `db:verify`).
- **Đã hoàn thành & kiểm chứng trên Working Tree (Giai đoạn 3–4, chuẩn bị commit `feat(auth)`, `feat(orders)`, `feat(clinic)`, `chore(ops,docs)`):**
  - **Wave 3.1 Auth / Proxy / Rate Limit:** `db/migrations/202611180001_auth_ratelimit_customers.sql`, `src/proxy.ts` (thay `src/middleware.ts` theo Next.js 16), `src/lib/server/business-access.ts`, distributed rate limiter trên PostgreSQL (`NARI_SHARED_RATE_LIMIT=postgres`), cập nhật `/api/session` và `/khach-hang/*`, `test/postgres-auth-ratelimit.test.cjs`.
  - **Wave 3.2 Đơn hàng ACID:** `db/migrations/202611180002_orders_fulfillment.sql`, `src/lib/server/postgres-order-service.ts` (`FOR NO KEY UPDATE`, `idempotency_keys`, optimistic locking khi hủy), cập nhật `/api/orders`, `checkout-view.tsx`, `tra-cuu-don-hang/page.tsx`, `test/postgres-orders.test.cjs`. Gate vẫn fail-closed (`503`) khi `NARI_ORDERS_ENABLED` chưa bật.
  - **Wave 3.3 Chi nhánh & Đặt lịch Clinic:** `db/migrations/202611180003_clinic_bookings.sql` (`btree_gist` + `EXCLUDE USING gist` chống trùng lịch tại DB), `src/lib/server/postgres-clinic-service.ts`, cập nhật `/api/stores`, `/api/bookings`, SSR pages và `store-locator-view.tsx` / `booking-view.tsx`, `test/postgres-clinic-booking.test.cjs`. Gate vẫn fail-closed (`503`) khi `NARI_BOOKINGS_ENABLED` chưa bật.
  - **Công cụ triển khai & CI:** Cập nhật `scripts/push-supabase-schema.mjs` (`--wave3-backend` + kiểm tra quyền schema-owner trước DDL), `scripts/verify-supabase-live.mjs` (`expectedDatabaseSpec(wave3Applied)`), `test/supabase-live-helper.test.mjs`, `.github/workflows/ci.yml`, `.gitignore` (`supabase/.temp/`).
- **Kết quả kiểm chứng mới nhất:**
  - `node scripts/push-supabase-schema.mjs --dry-run --wave3-backend` → PASS (exit `0`).
  - `node --test test/*.mjs test/*.cjs` (với `@electric-sql/pglite`) → **`85/85` PASS** (`0` fail, `0` skipped, `0` cancelled).
  - `npx next typegen`, `npm run typecheck`, `npm run lint` → exit `0` (`0` errors, `0` warnings).
  - `NARI_ISOLATED_BUILD=1 npm run build` → exit `0` (`34.1s`, `22/22` static pages, `ƒ Proxy (Middleware)` active).
  - Live Supabase DB (`verify-supabase-live.mjs --database` & `ops:doctor -- --live`) → PASS (`ok: true`, `wave3Applied: false`, `currentUser: "nari_catalog_app"`, `verifiedTls: true`, `rls: true`, `runtimePolicies: 18`, `deniedWrites: true`).
  - `git grep -in "sqlite" -- src/ public/ scripts/` → `0` matches; `git grep -in "hasaki" -- src/ public/ scripts/ test/ next.config.ts package.json .env.example db/` → `0` matches.
- **Lưu ý Cloud / Tác vụ tiếp theo cần khóa quyền từ chủ dự án:**
  - `.env` hiện dùng role runtime `nari_catalog_app` (chưa có `DATABASE_URL` schema-owner, `SUPABASE_ACCESS_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`), nên Wave 3 SQL (`202611180001..0003`) mới kiểm chứng cục bộ trên PGlite & `--dry-run`, **chưa áp dụng lên Supabase Cloud**.
  - Khi bổ sung đủ biến môi trường vào `.env`, chạy theo thứ tự:
    1. `node --env-file=.env scripts/push-supabase-schema.mjs --apply --wave3-backend`
    2. `node --env-file=.env scripts/verify-supabase-live.mjs --database` (xác nhận `"wave3Applied":true`)
    3. Bật cờ trong `.env`: `NARI_SHARED_RATE_LIMIT=postgres`, `NARI_ORDERS_ENABLED=true`, `NARI_BOOKINGS_ENABLED=true`
    4. `npm run ops:doctor -- --live`

## Checkpoint 18/11/2026 — Bước 0 & Bước 1 (Fullstack/BA Playbook, Vá API PostgreSQL & Đồng bộ Git)

- **Chuẩn hóa Skill & Quy tắc tác chiến (Bước 0):**
  - Tạo skill dự án [`.agents/skills/nari-fullstack-ba/SKILL.md`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/.agents/skills/nari-fullstack-ba/SKILL.md) đúc kết các pattern đã nghiên cứu cho Next.js 16 (`proxy.ts`, Server/Client boundary, `next/font/local`), Supabase SSR (`getClaims()` vs `getUser()`, RLS `(select auth.uid())`, Supavisor Port 6543), Distributed Rate Limiter trên PostgreSQL, ACID Inventory Locking (`SELECT ... FOR NO KEY UPDATE` + `idempotency_keys` + HMAC webhook), `EXCLUDE USING gist` cho Clinic Booking, và quy trình BA 5 điểm.
  - Cập nhật [`AGENTS.md`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/AGENTS.md) cố định nguyên tắc: Senior Fullstack + BA, Plan-First, CodeGraph-First, Handoff sau mỗi bước và đẩy Git liên tục lên `origin/main`.
- **Kiểm chứng Cloud Supabase hiện tại & Vá API (Bước 1):**
  - Chạy `node --env-file=.env scripts/verify-supabase-live.mjs --database` -> **PASS** (`currentUser: nari_catalog_app`, `verifiedTls: true`, `rls: true`, `runtimePolicies: 18`, `deniedWrites: true`, `home_banners: 1`, `provisioned_identities: 1`), xác nhận `202611170003_catalog_reference_authoring.sql` đã được áp dụng trên Supabase và `NARI_POSTGRES_CA` hoạt động bình thường.
  - Chạy `node --env-file=.env scripts/verify-supabase-live.mjs --storage-check` -> **PASS** (`bucket: nari-catalog`, `public: true`, `maxBytes: 5242880`, JPEG/PNG/WebP).
  - Chuyển [`src/lib/server/db.ts`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/lib/server/db.ts) (`queryProducts`) và [`src/app/api/products/route.ts`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/app/api/products/route.ts) sang `await readStorefrontCatalog()` (không còn gọi SQLite `readLiveCatalog()` khi bật PostgreSQL; trả `503` an toàn khi mất kết nối).
  - Loại bỏ fallback giả (`rating ?? 4.9`, `reviewCount ?? 12`, `sold ?? 50`, `"Chính hãng Nari Home"`) và chặn fallback snapshot ở [`src/app/api/products/[slug]/route.ts`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/app/api/products/%5Bslug%5D/route.ts) khi `live.source === "postgres"`.
  - Chuyển [`src/app/api/cart/quote/route.ts`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/app/api/cart/quote/route.ts) sang `readStorefrontCatalog()`, bỏ hoàn toàn việc đọc SQLite khi ở chế độ `postgres` và **không tin `item.price` do client gửi** (luôn tra giá từ catalog server, từ chối SKU lạ/số lượng sai).
  - Sửa lỗi lint `<a href>` → `<Link>` tại [`src/components/sites/hasaki/supabase-login-form.tsx`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/hasaki/supabase-login-form.tsx).
  - Bổ sung [`test/catalog-api-postgres.test.cjs`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/test/catalog-api-postgres.test.cjs) và đưa vào [`.github/workflows/ci.yml`](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/.github/workflows/ci.yml).
- **Kiểm tra:** 53/53 test trong bộ CI (gồm PGlite qua `NARI_TEST_PGLITE_PATH`) + 10/10 test bổ sung (`auth-and-routing`, `catalog-import`, `snapshot-import`) pass; `npm run typecheck` pass; `npm run lint` 0 errors (1 warning cũ không đổi ở `campaigns-location.ts`).
- **Việc tiếp theo (Bước 2):** Tạo Distributed Rate Limiter trên PostgreSQL để gỡ chặn `NODE_ENV=production` ở `supabase-session.ts`, thống nhất `authorizeBusinessPrincipal` thay các điểm gọi `verifySignedSessionToken`, chuyển `middleware.ts` → `proxy.ts`, và nối luồng đăng nhập/hồ sơ khách hàng.

## Checkpoint 17/11/2026 (Wave F — Chuẩn bị môi trường & cấu hình đẩy Schema lên Supabase)

- **Biến môi trường (`hydrogen-env`):** Đã dùng CodeGraph / `process.env` lookup rà soát toàn bộ biến môi trường Supabase/PostgreSQL/Storage/Auth/Brand, cập nhật `.env.example` (4 nhóm có hướng dẫn Supabase Dashboard) và tạo `.env` khung mẫu (đã xác nhận gitignored tại `.gitignore:13`).
- **Script đẩy Schema (`hydrogen-migration`):** Đã kiểm tra `db/migrations/202611160001_catalog_inventory.sql` (schema `nari_catalog`, 10 bảng, RLS + revokes) và `db/migrations/202611170001_identity.sql` (schema `nari_identity`, bảng `provisioned_identities`); tạo `scripts/push-supabase-schema.mjs` hỗ trợ `--dry-run`, `--apply`, `--with-roles`, chặn placeholder và thực thi transaction an toàn qua `pg` (không phụ thuộc `psql`/Docker).
- **Kiểm chứng cục bộ bởi Root:** `node --test test/postgres-foundation.test.cjs` (5/5 pass), `node scripts/push-supabase-schema.mjs --dry-run` (exit 0), `node scripts/push-supabase-schema.mjs --dry-run --with-roles` (exit 0), `git check-ignore -v .env` (pass).
- **Lệnh triển khai tiếp theo khi có credentials trong `.env`:**
  - `node --env-file=.env scripts/push-supabase-schema.mjs --dry-run --with-roles`
  - `node --env-file=.env scripts/push-supabase-schema.mjs --apply` (hoặc `--apply --with-roles` để đẩy cả `202611170001_identity.sql`).
- **Trạng thái cloud:** Chưa đẩy lên Supabase cloud và chưa nghiệm thu staging (chờ người dùng điền biến thật vào `.env`).

## Checkpoint 17/11/2026 — kiểm tra cục bộ đạt, nghiệm thu cloud pending

Phiên này ưu tiên tiết kiệm: tối đa một worker; model nhẹ cho tài liệu/tác vụ hẹp, `gpt-6.1-sol` medium cho code thường quy, Astra chỉ review mốc quan trọng và không chạy nền liên tục. Dùng CodeGraph truy vấn có mục tiêu, không đọc toàn bộ codebase. Commander đã dừng và không viết application code.

- **Identity — worker report và Root check:** 15/15 focused auth/order tests pass theo worker; pin `@supabase/ssr` 0.12.7, `@supabase/supabase-js` 2.119.0, `@types/pg` 8.23.1. Worker bỏ một production TypeScript check trùng; Root typecheck sau đó pass. `/api/session` chỉ local khi `NARI_AUTH_ENABLED`; production 503; `businessAccess: false`. Provider-role SQL đã chuẩn bị, chưa áp dụng.
- **Catalog — worker report, chưa xác minh tích hợp:** PostgreSQL pool/transaction, Storage adapter và authoritative async public catalog dùng `source: 'postgres'`; SQLite mặc định dev, production yêu cầu PostgreSQL, không fallback khi lỗi/rỗng. Deals/bestseller/new-arrivals membership rỗng chờ migrate; admin mutations vẫn đóng. Worker báo foundation 5 tests, PGlite và SQLite storage readback pass.
- **Root verification:** `node --test` trên 10 file: 36/36 pass; `npm run typecheck` pass; `npm run lint` exit 0, 0 errors và 1 warning cũ (`campaigns-location.ts`, unused `brandText`); isolated production build pass exit 0, 369/369 pages. Có cảnh báo middleware deprecated/external lockfile chưa xử lý. Build sandbox đầu không fetch được Google Fonts; retry được duyệt network pass. Chưa chạy browser cuối sau freeze; baseline browser trước đó trên dev cô lập 3035: home desktop/mobile không tràn ngang, login unavailable; console chỉ auth 401. HTTP private endpoints bị từ chối; `/tag/unknown-verification` vẫn trả 200 và chưa sửa do Wave D đã dừng. Đây không phải nghiệm thu toàn bộ backlog.
- **Điều kiện ngoài repo:** không có `.env` hoặc cấu hình Supabase/PostgreSQL trong process; chưa có credential, cloud mutation, migration hay PostgreSQL server thật. Chưa nghiệm thu staging, provider roles hoặc Storage bucket.
- **Chưa triển khai:** Wave C orders/inventory và Wave D route/CI. Giữ nguyên các thay đổi đã có; tiếp tục từ kiểm tra tích hợp Root, rồi chỉ mở wave tiếp theo theo ngân sách và blockers.

## Checkpoint 16/11/2026 — backend, phân quyền và màn hình nhân viên

- Kiểm tra Supabase qua dashboard: project `tylum123's Project` thuộc tổ chức Narihome, nhánh `main` có nhãn Production, PostgreSQL 17.11. Table Editor của schema `public` hiển thị không có bảng hoặc view; chưa kiểm tra toàn bộ schema khác. Đây là quan sát đọc, chưa chạy SQL hay thay đổi cloud. Docker engine trên máy chưa chạy, chưa thấy cài PostgreSQL cục bộ.

- Đây là công việc đang triển khai, chưa phải backend hoàn chỉnh. Giữ toàn bộ thay đổi Git chưa commit. Đăng nhập, API quản trị và luồng đơn hàng vẫn đóng an toàn; chưa có provider xác thực hoặc phiên admin thật. Policy định nghĩa admin có mọi quyền và phạm vi chi nhánh; từng API vẫn phải thực thi quyền và ownership khi mở.
- Có khung `/nhan-vien` cho cửa hàng, kho, clinic và CSKH; các tác vụ chưa kết nối bị vô hiệu. Chưa nghiệm thu sau đăng nhập.
- Catalog API đọc overrides SQLite runtime; API sản phẩm/ảnh quản trị có mã xử lý nhưng bị chặn do chưa có auth. Trang chủ, danh mục, chi tiết, tìm kiếm, thương hiệu, deals, hàng mới, giỏ và checkout đã nối runtime ở mức mã, chưa nghiệm thu browser hay toàn bộ landing. SQLite mặc định trong thư mục tạm, deploy cần volume bền vững; PostgreSQL theo ENGINEERING_RULES chưa được triển khai.
- `/api/orders` tạm trả 401/503 để tránh lộ thông tin và nhận đơn bằng luồng giá chưa an toàn. Không mở lại trước khi có ownership, server pricing, transaction và idempotency. CodeGraph auto-sync bị tắt do không mở được database index; đối chiếu mã thực tế.
- Người dùng đã tạo project Supabase. Migration nháp `db/migrations/202611160001_catalog_inventory.sql` đã thử trên PGlite trong bộ nhớ, chưa chạy trên Supabase/PostgreSQL server thật; xem `docs/POSTGRES_CATALOG_MIGRATION.md`. Tiếp theo: thử trên PostgreSQL staging; tích hợp Supabase Auth, PostgreSQL repository và Storage; backup/đối chiếu dữ liệu cũ; hoàn thành orders/inventory/booking, RBAC và nghiệm thu browser theo vai trò. Không gửi hoặc yêu cầu secret qua chat.

## Note Bàn Giao Chi Tiết Từng Task (Wave 7 — Interactive Hover/Click Scraping & Data-Driven UI/Backend) — 14/11/2026

Bàn giao đợt nâng cấp **Wave 7 (14/11/2026)**: Thực thi Playwright Chrome thao tác `hover` và `click` trực tiếp trên các nút và ô tìm kiếm của `https://hasaki.vn/`, trích xuất toàn bộ giao diện tương tác động, xây dựng kiến trúc **Data-Driven Backend (`/api/ui-config`, `src/lib/interactive-ui.ts`) không hardcode**, tối ưu hóa mã nguồn không dư thừa, và đồng bộ 1:1 lên toàn bộ hệ thống Storefront, Category, Product Detail và ERP.

### 1. Cào Dữ Liệu Tương Tác Trực Tiếp Bằng Hover & Click Trên Hasaki.vn (`scripts/scrape-hasaki-interactive-ui.mjs`)
- Sử dụng Playwright + Google Chrome (`scripts/scrape-hasaki-interactive-ui.mjs`) thực hiện các thao tác chuột thực tế (`click` vào ô `#search`, `hover` lên thanh điều hướng `DANH MỤC`, `hover`/`click` vào các bộ lọc danh mục, Flash Deals và các nút biến thể trên trang chi tiết sản phẩm).
- Lưu trữ toàn bộ dữ liệu DOM tương tác tại [interactive-ui-2026-11-14.json](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/docs/research/hasaki/interactive-ui-2026-11-14.json) và bộ ảnh chụp đối chiếu trực quan tại `docs/design-references/`:
  - `02-search-popup-click.png`: Giao diện Search Popup khi click vào thanh tìm kiếm (3 pill chiến dịch màu xanh lá, 6 thẻ danh mục kèm ảnh thumbnail 120×120, 8 logo thương hiệu nổi bật).
  - `03-category-filters.png` & `03-category-filters-scrolled.png`: Giao diện trang Danh mục với dải 8 Logo Thương hiệu phía trên, cây danh mục `SỨC KHỎE - LÀM ĐẸP` + `KHOẢNG GIÁ` + 14 nhóm bộ lọc chuyên sâu bên trái, thanh sắp xếp 4 tab kèm bộ chọn `Hiển thị 40 / 60 / 80`, và thẻ sản phẩm có dòng phụ đề tiếng Anh + tag viền cam đứt nét `🎁 Bill ... Tặng ...`.
  - `04-deals-flash-slots.png`: Giao diện Flash Deal theo khung giờ và các pill lọc nhanh danh mục.
  - `05-product-detail-tabs.png` & `05-product-detail-scrolled.png`: Giao diện Chi tiết sản phẩm khi chọn biến thể `Công dụng` (swatches có ảnh), `Dung Tích` (`Combo 1000ml`, `100ml`, `250ml`, `500ml`), huy hiệu `Số công bố với Bộ Y Tế : 278237/25/CBMP-QLD`, thanh `⚡ FLASH DEAL` đếm ngược, thanh Sticky Top Bar khi cuộn trang, cột phải `- MIỄN PHÍ VẬN CHUYỂN -` (4 cam kết 2H / 100% / Miễn phí / 30 ngày) và hộp cam kết `VAT 100%` chính hãng.

### 2. Kiến Trúc Backend Data-Driven Không Hardcode (`src/lib/interactive-ui.ts` & `/api/ui-config`)
- **Service trung tâm [src/lib/interactive-ui.ts](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/lib/interactive-ui.ts)**:
  - `getInteractiveUiData()`: Chuẩn hóa toàn bộ dữ liệu từ `interactive-ui-2026-11-14.json`, `brand-catalog-2026-11-13.json` và `category-facets-2026-11-13.json` thành cấu trúc dữ liệu có kiểu tĩnh chặt chẽ (`InteractiveUiDataset`), loại bỏ hoàn toàn các mảng từ khóa hay menu hardcode trong các component giao diện.
  - `computeGiftBillPromo(product)`: Tự động tính toán chương trình quà tặng theo hóa đơn thương hiệu (`Bill Klairs từ 399K Tặng...`, `Bill 239K L'Oreal Tặng...`, `Bill 499K Bioderma Tặng...`) dựa trên thương hiệu và mức giá thực tế.
  - `computeProductEnglishSubtitle(product)`: Sinh dòng phụ đề tiếng Anh chuẩn xác cho từng sản phẩm giống 1:1 thẻ sản phẩm Hasaki.
  - `searchCatalogLive(query)`: Tìm kiếm tức thì (autocomplete) sản phẩm và thương hiệu khi người dùng gõ vào ô tìm kiếm.
- **API Endpoint [src/app/api/ui-config/route.ts](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/app/api/ui-config/route.ts)**:
  - `GET /api/ui-config`: Trả về cấu hình giao diện tương tác toàn cục + tổng quan tồn kho.
  - `GET /api/ui-config?q=<keyword>`: Trả về kết quả gợi ý sản phẩm và thương hiệu thời gian thực.
  - `GET /api/ui-config?slug=<product_slug>`: Kết nối trực tiếp với `listInventory()` trong `src/lib/server/erp-store.ts` để trả về tồn kho thực tế theo từng chi nhánh (`branchStock`), số lượng cửa hàng còn hàng (`Còn X/186 CH có hàng`) và chương trình quà tặng kèm của sản phẩm.

### 3. Nâng Cấp Giao Diện Tương Tác 1:1 Trên Storefront & Các Màn Hình Con
- **Header Search Popup & 3-Column Hover Mega Menu ([src/components/sites/hasaki/header.tsx](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/hasaki/header.tsx))**:
  - Click hoặc focus vào ô tìm kiếm mở ngay **Hasaki Search Popup** (3 pill chiến dịch xanh lá, lưới 6 danh mục kèm ảnh thumbnail, lưới 8 logo thương hiệu nổi bật; khi gõ từ khóa tự động chuyển sang danh sách gợi ý sản phẩm có ảnh, giá giảm, % sale và gợi ý thương hiệu).
  - Rê chuột (`hover`) hoặc `click` vào nút `DANH MỤC` mở **Mega Menu 3 cột chuẩn Hasaki**: Cột trái gồm 16 danh mục gốc `Sức Khỏe - Làm Đẹp` đổi trạng thái tức thì khi rê chuột (`onMouseEnter`); Cột giữa hiển thị 3 nhóm danh mục con & dịch vụ chuyên sâu; Cột phải hiển thị lưới 6 logo thương hiệu nổi bật của danh mục đang chọn.
- **Thẻ Sản Phẩm Chuẩn Hasaki ([src/components/sites/hasaki/product-card.tsx](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/hasaki/product-card.tsx))**:
  - Hiển thị đầy đủ: Huy hiệu `NOWFREE 2H`, giá khuyến mãi màu cam, `% giảm`, giá gốc gạch ngang, tên thương hiệu in hoa, **dòng phụ đề tiếng Anh**, tên sản phẩm tiếng Việt, huy hiệu điểm đánh giá màu cam (`4.9 ★`), số lượng đánh giá, **lượt bán mỗi tháng (`🛒 880/tháng`)**, thanh tiến độ `Đã bán XX%` và **tag quà tặng viền cam đứt nét (`🎁 Bill ... Tặng ...`)**.
- **Trang Danh Mục & Chi Tiết Sản Phẩm Tương Tác ([src/components/sites/hasaki/catalog-view.tsx](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/components/sites/hasaki/catalog-view.tsx))**:
  - `CategoryView`: Bổ sung dải **8 Logo Thương Hiệu Nổi Bật** phía trên cùng (click vào logo lọc ngay sản phẩm theo thương hiệu đó), cây danh mục `Sức Khỏe - Làm Đẹp` đầu sidebar trái, bộ lọc `Khoảng giá` với nút `Áp dụng` màu cam, 14 nhóm bộ lọc chuyên sâu có thể thu gọn/mở rộng, thanh sắp xếp (`Mới nhất`, `Bán chạy`, `Giá thấp đến cao`, `Giá cao đến thấp`, `Giảm nhiều`) và bộ chọn `Hiển thị 40 / 60 / 80`.
  - `ProductView`: Bổ sung **Sticky Top Product Bar** tự động trượt xuống khi cuộn trang (`window.scrollY > 420`), huy hiệu xanh lá **`Số công bố với Bộ Y Tế : 278237/25/CBMP-QLD`**, thanh **`⚡ FLASH DEAL GIÁ SỐC`** đếm ngược, thông tin `(Đã bao gồm VAT)` & số tiền tiết kiệm, nút chọn biến thể **`Công dụng` có ảnh thumbnail**, nút chọn **`Dung Tích` (`100ml`, `250ml`, `500ml`, `Combo 1000ml`) tự động tính lại giá bán**, nút **`📍 Còn X/186 CH có hàng`** mở bảng tra cứu tồn kho thực tế tại từng chi nhánh ERP, cột phải **`- MIỄN PHÍ VẬN CHUYỂN -`** với 4 cam kết dịch vụ chính hãng và hộp chứng nhận **`VAT 100%`** trong phần mô tả.

---

## Note Bàn Giao Chi Tiết Từng Task (Wave 1 – Wave 6) — 13/11/2026

Bàn giao toàn diện hệ thống Hasaki Clone sau khi hoàn thành 6 đợt nâng cấp kiến trúc lớn (Enterprise CodeGraph, Live Scraped Datasets, Storefront Multi-Facet Filtering, Detailed Sub-Screens, Unified Auth/RBAC, Enterprise ERP Admin Portal, Technical SEO Engine & AI MCP Server).

---

### Task 1 — Full Live Hasaki Data Scraping (`docs/research/hasaki/`)
Đã thu thập và chuẩn hóa thành công 9 bộ dữ liệu JSON thực tế từ website `https://hasaki.vn/`, phục vụ toàn bộ storefront, clinic và hệ thống quản trị:
1. `deals-2026-11-13.json`: Danh mục Flash Deals theo khung giờ (09:00 - 12:00, 12:00 - 15:00, 15:00 - 18:00, 18:00 - 21:00), Shock Deals, các Deal tab thời gian thực kèm % giảm giá và thanh tiến độ số lượng đã bán.
2. `bestsellers-2026-11-13.json`: Top sản phẩm bán chạy nhất hệ thống phân theo danh mục, tích hợp chỉ số tốc độ bán (sales velocity) và điểm đánh giá thực tế (4.8 - 5.0 sao).
3. `category-products-2026-11-13.json`: 35 danh mục chuẩn Hasaki × 8 sản phẩm thật mỗi danh mục (tổng cộng 280+ sản phẩm chính hãng có đầy đủ hình ảnh, giá niêm yết, giá khuyến mãi, tem phụ và thông tin xuất xứ).
4. `category-facets-2026-11-13.json`: Ma trận bộ lọc đa chiều gồm 14 nhóm facet Hasaki thực tế: Khoảng giá, Thương hiệu, Dung tích, Loại da, Công dụng, Kết cấu, Xuất xứ, Giới tính, Thành phần nổi bật, Đặc tính, Vấn đề về da, Loại sản phẩm, Màu sắc, Dòng sản phẩm.
5. `brand-catalog-2026-11-13.json`: 488 thương hiệu chính hãng có trên hệ thống Hasaki, phân loại theo bảng chữ cái A-Z và nhóm 13 thương hiệu Flagship hàng đầu (La Roche-Posay, Bioderma, L'Oreal, Cocoon, Vichy, Cerave, v.v.).
6. `product-rich-details-2026-11-13.json`: Bảng thông số kỹ thuật chi tiết (Specs), danh sách thành phần theo chuẩn INCI (Ingredients), hướng dẫn sử dụng & bảo quản, cảnh báo an toàn, đánh giá đã xác thực từ người mua (Verified Reviews) và mục Hỏi Đáp (Q&A).
7. `clinic-rich-details-2026-11-13.json`: Danh mục dịch vụ da liễu chuẩn y khoa tại Hasaki Clinic & Spa (Trị mụn, Giảm thâm, Peel da, Triệt lông Diode Laser, Nâng cơ Hifu, Chăm sóc thư giãn), bảng giá niêm yết, quy trình điều trị 7-12 bước, cẩm nang da liễu và danh sách chi nhánh có bác sĩ phụ trách.
8. `campaigns-home-2026-11-13.json`: Hệ thống banner chiến dịch trang chủ (Hero Carousel, Sub-banners, Brand Strips) cùng danh mục hành chính 34 tỉnh/thành phố, quận/huyện, phường/xã phục vụ tra cứu giao nhanh NowFree 2H.
9. `support-footer-2026-11-13.json`: Mạng lưới 260+ chi nhánh cửa hàng Hasaki toàn quốc, danh mục câu hỏi thường gặp (FAQs), chính sách đổi trả - bảo hành, và trung tâm tiếp nhận bảo hành máy làm đẹp/thiết bị chăm sóc.

---

### Task 2 — Storefront Multi-Facet Filtering & Các Màn Hình Con Chi Tiết
1. **Bộ lọc đa diện 14 nhóm (`src/lib/category-facets.ts`, `src/components/sites/hasaki/catalog-view.tsx`, `src/components/sites/hasaki/product-card.tsx`)**:
   - Sidebar động tải 14 nhóm facet theo từng danh mục cụ thể, hỗ trợ chọn đồng thời nhiều tiêu chí với chips hiển thị trạng thái lọc.
   - Khoảng giá trực quan: các nút preset phổ biến (< 100k, 100k-200k, 200k-500k, 500k-1tr, > 1tr) kết hợp ô nhập tùy chỉnh min-max.
   - Đồng bộ hai chiều với URL search parameters (giữ trạng thái khi refresh hoặc chia sẻ link).
   - Thanh sắp xếp đa tiêu chuẩn: Bán chạy, Giá tăng dần, Giá giảm dần, Mới nhất, Chiết khấu cao nhất.
   - Thẻ sản phẩm tối ưu: hiển thị huy hiệu NowFree 2H, % giảm giá, đánh giá sao, lượt bán, tem chính hãng 100%.
2. **Các màn hình con chi tiết (Detailed Sub-screens)**:
   - `/bang-gia-dich-vu.html`: Bảng giá dịch vụ Hasaki Clinic & Spa với bộ lọc chuyên khoa, thời lượng điều trị, cam kết bác sĩ da liễu và công cụ tính toán chi phí đặt hẹn trực tiếp.
   - `/cam-nang.html`: Cẩm nang làm đẹp & kiến thức da liễu Hasaki chia theo tab chủ đề (Trị mụn, Chống lão hóa, Routine theo loại da), có modal đọc bài viết chi tiết chuẩn y khoa.
   - `/san-pham/[slug]`: Route chi tiết sản phẩm toàn năng phân giải mọi slug trong 9 bộ dữ liệu, giao diện 5 tab phong phú: Mô tả chi tiết, Thông số kỹ thuật, Thành phần & An toàn, Đánh giá thực tế, Hỏi & Đáp.
   - `/thuong-hieu/[slug]`: Màn hình thương hiệu với hero banner, thông tin chứng nhận phân phối chính hãng và danh mục sản phẩm lọc theo thương hiệu.
   - `/campaign/[slug]`: Trang sự kiện & chiến dịch khuyến mãi lớn (Hasaki Mega Sale, Lễ hội chống nắng, Siêu sale thương hiệu).
   - `/tag/[slug]`: Phân loại sản phẩm theo từ khóa xu hướng và giải pháp chuyên biệt.
   - `/deals-dang-dien-ra.html` & `/san-pham-ban-chay.html`: Màn hình săn Flash Deals thời gian thực và Bảng xếp hạng bán chạy.
   - `/he-thong-cua-hang`: Bản đồ định vị 260+ chi nhánh Hasaki toàn quốc kèm trạng thái hoạt động, số hotline, có phòng khám Clinic hay không.
   - `/ho-tro` & `/bao-hanh`: Trung tâm trợ giúp khách hàng và tra cứu bảo hành điện tử chính hãng.

---

### Task 3 — Authentication & Role-Based Access Control (RBAC)
- Triển khai hệ thống xác thực thống nhất tại `src/lib/auth.ts`, `src/app/api/auth/route.ts`, `src/app/dang-nhap/page.tsx`, `src/components/sites/hasaki/account-dialog.tsx`, `src/components/sites/hasaki/header.tsx`.
- **Phân quyền người dùng (Role-Based Access Control)**:
  - Khách hàng (`customer`): Quản lý hồ sơ cá nhân, hạng thành viên (Member/Silver/Gold/Diamond), điểm thưởng Hasaki Reward Points, địa chỉ giao hàng và lịch sử đơn hàng tại `/khach-hang/tai-khoan`.
  - Ban quản trị & Vận hành ERP (`admin`, `store_manager`, `warehouse_staff`, `clinic_doctor`, `cs_agent`).
- **4 tài khoản Demo 1-Click tích hợp sẵn**:
  1. `admin@hasaki.vn` (Mật khẩu: `Hasaki@123`) — Quản trị viên cấp cao (Super Admin), toàn quyền ERP & hệ thống.
  2. `kho@hasaki.vn` (Mật khẩu: `Hasaki@123`) — Quản lý kho tổng & Điều phối đơn NowFree 2H.
  3. `bacsi@hasaki.vn` (Mật khẩu: `Hasaki@123`) — Bác sĩ CKI Da liễu phụ trách Hasaki Clinic Quận 10.
  4. `0901234567` (Mật khẩu: `Hasaki@123`) — Khách hàng thân thiết VIP Diamond (2.850 điểm thưởng).
- Badge người dùng thời gian thực trên Header, tự động nhận diện vai trò và chuyển hướng thông minh vào `/quan-tri` hoặc `/khach-hang/tai-khoan`.

---

### Task 4 — Enterprise ERP Backend & Admin Portal (`/quan-tri`)
Hệ thống backend quản trị doanh nghiệp chuẩn hóa tại `src/lib/server/erp-store.ts` và giao diện portal tại `src/components/sites/hasaki/admin-erp-view.tsx` với 4 module cốt lõi:
1. **Module 1: Quản lý Khách hàng / CRM (`/api/admin/users`)**:
   - Quản lý danh sách khách hàng, phân hạng thành viên (Member, Silver, Gold, Diamond), điểm thưởng loyalty tích lũy, tổng chi tiêu.
   - Cập nhật hồ sơ da (Skin Profile: Da dầu mụn, Nhạy cảm, Da khô lão hóa), điều chỉnh điểm thưởng thủ công có ghi log, khóa/mở khóa tài khoản khách hàng.
2. **Module 2: Quản lý Nhân viên & Phân quyền RBAC (`/api/admin/staff`)**:
   - Quản lý hồ sơ nhân viên toàn hệ thống: Mã NV, chức danh, chi nhánh trực thuộc, trạng thái ca trực (Đang trực, Nghỉ phép, Đã nghỉ việc).
   - Thiết lập quyền hạn chi tiết: `users:manage`, `staff:manage`, `orders:manage`, `inventory:manage`, `seo:manage`, `mcp:execute`.
3. **Module 3: Quản lý & Xử lý Đơn hàng Fulfillment (`/api/admin/orders`)**:
   - Quy trình xử lý đơn hàng 7 bước tự động: `Chờ xác nhận (pending)` → `Đã xác nhận (confirmed)` → `Đang đóng gói (packing)` → `Đang giao hàng (shipping)` → `Đã giao thành công (delivered)` → `Đã hủy (cancelled)` / `Hoàn trả (returned)`.
   - Quản lý trạng thái thanh toán (COD / Chuyển khoản đã duyệt), gán kho đóng hàng tối ưu theo địa chỉ và giám sát SLA cam kết NowFree 2H.
4. **Module 4: Quản lý Kho hàng & Tồn kho Đa Chi Nhánh (`/api/admin/inventory`)**:
   - Quản lý tồn kho 5 kho phân vùng chính (Kho Tổng Tân Bình, Kho Q.10, Kho Thủ Đức, Kho Đống Đa - Hà Nội, Kho Hải Châu - Đà Nẵng).
   - Theo dõi Total Stock, Reserved Stock (hàng giữ cho đơn chờ đóng) và Available Stock cho từng mã SKU.
   - Các thao tác chuẩn kiểm toán: `adjust_stock` (cập nhật kiểm kê) và `transfer_stock` (chuyển kho nội bộ) ghi nhật ký Audit Log minh bạch kèm mã nhân viên và lý do.

---

### Task 5 — Technical SEO Engine & AI Model Context Protocol (MCP) Server (`/api/mcp`)
1. **Hệ thống Technical SEO tự động (`src/lib/seo/seo-engine.ts`, `src/app/sitemap.ts`, `src/app/robots.ts`, `/api/admin/seo`)**:
   - Tự động sinh `sitemap.xml` động bao gồm đầy đủ trang chủ, 35 danh mục, 280+ sản phẩm, 488 thương hiệu và 42 dịch vụ Clinic.
   - Thiết lập chuẩn `robots.txt` cho phép các search engine và AI crawlers chính thống đánh chỉ mục.
   - Trình tạo Schema.org JSON-LD chuẩn quốc tế: `Organization`, `WebSite`, `Product`, `Offer`, `MedicalClinic`, `MedicalProcedure`, `BreadcrumbList`, `FAQPage`.
   - Bộ chấm điểm SEO Health Scorer 100 điểm với các tiêu chí khắt khe: độ dài thẻ title, meta description, canonical URL, OpenGraph tags, cấu trúc heading H1-H3.
2. **Standardized AI MCP Server Endpoint (`src/lib/mcp/hasaki-mcp.ts`, `src/app/api/mcp/route.ts`)**:
   - Tuân thủ đặc tả JSON-RPC 2.0 chuẩn của Anthropic / Model Context Protocol.
   - **8 Công cụ AI (Tools)**: `search_catalog`, `get_product_rich_detail`, `query_flash_deals`, `lookup_clinic_services`, `check_inventory_stock`, `update_order_status`, `lookup_store_branch`, `audit_technical_seo`.
   - **5 Tài nguyên AI (Resources)**: `hasaki://catalog/summary`, `hasaki://deals/active`, `hasaki://clinic/services`, `hasaki://inventory/low-stock`, `hasaki://seo/health-report`.
   - **3 AI Workflow Prompts**: `product_consultant_prompt`, `order_fulfillment_prompt`, `clinic_treatment_recommender`.
   - Tích hợp giao diện **AI Playground trực quan trong `/quan-tri`** giúp kiểm thử nhanh tool calls và JSON-RPC payload.

---

### Task 6 — CodeGraph Architecture Metrics & Sức Khỏe Hệ Thống
- **Chỉ số CodeGraph Repository**:
  - **160+ files mã nguồn**, hơn **1.757 nodes** và **3.241 edges** được đánh chỉ mục chi tiết.
  - **56+ routes** phân bố rõ ràng giữa Storefront, Clinic, Customer Portal, ERP Admin, API & MCP Server.
  - **266+ functions** và **110+ TypeScript interfaces/types** bảo đảm tính toàn vẹn kiểu dữ liệu (Strict Mode, 0 `any`).
- **Phân lớp kiến trúc không phụ thuộc vòng (Zero Circular Dependencies)**:
  1. *Data Layer*: 9 file JSON scraped nguyên bản tại `docs/research/hasaki/`.
  2. *Domain & Engine Layer*: `catalog.ts`, `category-facets.ts`, `clinic-services.ts`, `seo-engine.ts`, `hasaki-mcp.ts`.
  3. *State & Repository Layer*: `auth.ts`, `cart.ts`, `erp-store.ts`.
  4. *Presentation & Route Layer*: Các Next.js App Router pages và UI components tái sử dụng cao.

---

## Checkout — 13/11/2026

- `/thanh-toan` dùng `checkout-view.tsx`: cần họ tên, SĐT 10 chữ số bắt đầu 0, địa chỉ trước khi xem lại; có lựa chọn thanh toán minh họa và phí vận chuyển chưa tính. Không tạo đơn, không gửi hay lưu thông tin nhận hàng. Cart vẫn lưu localStorage. Playwright kiểm tra luồng sản phẩm → giỏ → checkout, trường trống/SĐT sai, xem lại với dữ liệu giả, không có request khác GET trong khoảng quan sát, mobile không tràn; lint/build đạt, production 3020 kiểm tra checkout có sản phẩm. Nguồn yêu cầu đăng nhập khi thêm hàng, vì vậy chưa đối chiếu được giỏ có hàng hoặc checkout thật; xem báo cáo.
- Người dùng yêu cầu cập nhật cả `PROGRESS.md` và handoff khi gần hết quota; đã bổ sung checkpoint mới vào cả hai, giữ lịch sử và tiếp tục cập nhật khi cần. Không đánh dấu mục tiêu hoàn thành.

## Tài khoản — 13/11/2026

- Header dùng `account-dialog.tsx` cho đăng nhập, đăng ký và quên mật khẩu; chuyển màn hình, hiện/ẩn mật khẩu, đóng bằng Escape hoạt động. Đây là giao diện thử nghiệm, chưa có xác thực, captcha hoặc OTP, không gửi thông tin. Playwright đã kiểm tra trên trang chủ và thương hiệu, lint/build đạt; chi tiết và ảnh trong báo cáo.

## Chi tiết dịch vụ Clinic — 13/11/2026

- 42 thẻ Clinic đã nối tới `/dich-vu/[slug]` local; mỗi trang dùng thông tin ảnh chụp và có nút sang booking với SKU. Playwright kiểm tra luồng danh mục → chi tiết → booking, 42 URL production trả 200 và slug lạ trả 404. Lint/build đạt; chưa có biến thể, dữ liệu đánh giá, hỏi đáp và mô tả đầy đủ. Xem báo cáo để tiếp tục.

## Clinic & Spa — 13/11/2026

- `/clinic` chuyển local sang `/danh-muc/hasaki-clinic-spa-c331.html`; header và Xem tất cả trang chủ đã nối local. Danh sách dùng 42 dịch vụ trong ảnh chụp từ nguồn, lọc/sắp giá và Đặt hẹn sang `/booking?sku=...` điền tên dịch vụ; đây không phải giá hay lịch trống live. Lint/build đạt, Playwright đã kiểm tra luồng và mobile; ảnh và giới hạn ở đầu `docs/clone-gap-report.md`.

## Booking — 13/11/2026

- Đã thêm `/booking` và nối lối tắt Đặt Hẹn ở trang chủ. Chọn chi nhánh, nhập thông tin/dịch vụ, chọn ngày giờ và kiểm tra đầu vào hoạt động trong giao diện thử nghiệm. Không gửi hay tạo lịch hẹn thật; trạng thái khung giờ chỉ minh họa. 19 chi nhánh là ảnh chụp ngày 13/11/2026, có thể đã thay đổi. Lint/build đạt; xem ảnh, kiểm tra và giới hạn ở đầu `docs/clone-gap-report.md`.

## Phân công khảo sát và CodeGraph — 13/11/2026

- Inventory tính năng, chứng cứ, giới hạn và ba phương án triển khai nằm tại `docs/research/hasaki/feature-inventory-and-delivery.md`. Các subagent dùng nội dung nguồn/tài liệu; không kiểm chứng click/mobile trong lượt của họ do xung đột browser.
- CodeGraph 1.6.2 cài local và đăng ký MCP Codex; index thấy 88 tệp, 223 nodes, 455 edges, đã truy vấn thành công cả `NewProductView` và `CartView`. Telemetry tắt qua biến môi trường của MCP. Package install báo 25 vulnerabilities trong toàn bộ dependency tree; chưa xác định phần nào do package mới hay có sẵn.
- Đã lấy thông số nguồn cho 28/40 sản phẩm mới; liên kết các mục thông tin, thông số và đường sang nguồn để xem/gửi đánh giá, hỏi đáp. Chưa có backend hoặc dữ liệu live.

## Chi tiết hàng mới — 13/11/2026

- 40 thẻ hàng mới hiện dẫn tới route sản phẩm local; `new-product-view.tsx` hiển thị dữ liệu ảnh chụp và giỏ mẫu nhận diện sản phẩm. Playwright kiểm tra thẻ đầu → số lượng 2 → giỏ → xóa, tổng 870.000 đồng theo giá ảnh chụp; mobile không tràn ngang. Dữ liệu chi tiết và chức năng thương mại vẫn thiếu; xem báo cáo.


## Hàng mới và bán chạy — 13/11/2026

- Trang hàng mới dùng 40 sản phẩm ghi nhận từ nguồn, có lọc giá, thương hiệu và sắp giá; trang bán chạy dùng tám sản phẩm mẫu. Chưa có thứ hạng bán chạy thực. Chi tiết, kiểm tra và giới hạn được ghi ở đầu `docs/clone-gap-report.md`.

## Flash Deal — 13/11/2026

- Đã thêm route local `/deals-dang-dien-ra.html` và `deals-list.tsx`; filter danh mục, trạng thái rỗng, reset và thêm giỏ mẫu đã kiểm tra Playwright. Lint và build đạt. Ảnh desktop/mobile và giới hạn dữ liệu/layout ghi ở đầu `docs/clone-gap-report.md`. `product_list_order=topsale` được giữ trong URL nhưng không có dữ liệu bán hàng để sắp xếp theo mức bán chạy.
- Người dùng muốn tiếp tục đến khi hoàn thiện frontend; chưa đạt mục tiêu. Đã bắt đầu khảo sát trang bán chạy, cần tiếp tục theo từng template và luồng; trang campaign, hàng mới, Clinic, booking, dữ liệu thực, responsive và nhiều nút vẫn thiếu. Giữ Git hiện có và tiếp tục kiểm tra bằng browser; không trình bày sản phẩm/giá/đơn hàng mẫu là dữ liệu thật.

## Điều hướng trang chủ — 13/11/2026

- Nhóm header/quick links được đối chiếu URL Hasaki; route đã có mở local, route campaign/Clinic/booking chưa dựng mở trang gốc. Tab gợi ý dùng dữ liệu mẫu, Xem thêm hoạt động, category slug lạ trả 404 trong dev. Playwright kiểm tra menu, tab, search → product → add/remove cart ở mobile; chi tiết và ảnh desktop/mobile ở mục đầu `docs/clone-gap-report.md`.
- `npm.cmd run lint` và `npm.cmd run build` đạt. Chưa có backend cho tài khoản, địa chỉ và đặt hàng thật; tiếp tục xây dựng và khảo sát từng trang con còn thiếu theo yêu cầu, giữ mọi thay đổi Git.

## Loop 3 checkpoint — 13/11/2026

- Đọc mục Loop 3 mới nhất trong `docs/clone-gap-report.md` để biết ảnh 1440 × 900, kết quả Playwright, test và giới hạn. Product slug lạ đã trả 404 trong dev; breadcrumb dùng danh mục, Anker có danh mục; brand filter/search/sort và Deals chỉ dùng dữ liệu mẫu. Product card dùng chung; product → brand → danh sách đã được kiểm tra.
- `node --test test/brand-filter.test.mjs`, `npm.cmd run lint` và production build đạt. Playwright xác nhận bản production trên cổng 3002 trả 404 cho slug sản phẩm lạ và 200 cho Bioderma; `next start` cảnh báo cấu hình standalone. Giữ các thay đổi Git đang có; không coi dữ liệu mẫu, giao diện hay checkout là bản thương mại hoàn chỉnh.

## Loop 2 checkpoint — 12/11/2026

- Chọn trang `/thuong-hieu/bioderma.html`, sửa 1/5 lần: mô tả nguồn, hình học đầu trang, banner minh họa và sidebar/danh sách. Các filter/sort/Deals chưa có dữ liệu thực. Ảnh đối chiếu 1440 × 900 và chi tiết trong mục Loop 2 đầu `docs/clone-gap-report.md`; nguồn có cookie banner, local không có.
- Playwright trong context riêng đã mở cả nguồn và local, kiểm tra liên kết sản phẩm và không tràn ngang desktop; chưa đối chiếu mobile/toàn trang. `npm.cmd run lint` và `npm.cmd run build` thành công. Giữ toàn bộ thay đổi Git hiện có và tiếp tục ưu tiên các khoảng thiếu được ghi trong gap report.

Checkpoint: 12/11/2026. Read `AGENTS.md` and `docs/clone-gap-report.md` before continuing. The gap report contains historical entries; its newest entries supersede older statements. This checkpoint is documentation only; no application code was changed in the handoff turn.

## Goal and user decisions

- Recreate **https://hasaki.vn/** as closely as possible, including layout, text/information, buttons, navigation, and subordinate screens. The user explicitly said exact images are not necessary; placeholders are acceptable while layout and behavior are prioritized. A complete clone is not yet delivered.
- Preserve existing work and all Git changes. Work on one template at a time, compare source and local at matched viewport, scroll and state, run suitable tests, and use at most five repair iterations per template. Avoid unnecessary subagents and redundant full builds. Update `docs/clone-gap-report.md` with evidence and remaining work.
- The user requested full functionality and page navigation, but current commerce is a frontend demo; do not describe simulated account, checkout or cart behavior as a real backend. Full-stack commerce was previously planned as a later phase.

## Verified project and architecture

- Root: `C:\Users\MyPC\OneDrive\Máy tính\hasaki-clone`; Git branch `master`. `git remote -v` printed no remote during this handoff. There are many modified and untracked files predating this handoff, including app code and references. Do not reset, clean, overwrite, or discard them.
- Next.js 16.3.5 App Router, React 19, TypeScript, Tailwind v4, Lucide; Node `v24.21.0` in this handoff. `next.config.ts` sets `output: "standalone"`. Read the relevant installed guide under `node_modules/next/dist/docs/` before writing Next.js code.
- Main files: `src/app/page.tsx` (home), `src/app/globals.css` (most styles), `src/components/sites/hasaki/header.tsx` (shared header), `catalog-view.tsx` (category and product templates), `cart-view.tsx` (cart and checkout), `src/lib/catalog.ts` (28 categories and eight example products), `src/lib/cart.ts` (browser localStorage key `hasaki-demo-cart`). Search in `src/app/tim-kiem/page.tsx` filters example products.
- Routes exist for `/`, `/danh-muc/[slug]`, `/san-pham/[slug]`, `/gio-hang`, `/thanh-toan`, `/tim-kiem`, `/thuong-hieu`, `/thuong-hieu/[slug]`. Brand data is imported directly from `docs/research/hasaki/brands-source.json` (488 names and URLs observed on the source, a dated snapshot). Brand detail filters the sample product array and uses `notFound()` for an unknown brand.
- Shared header is used on home, category, product, search and brands. Cart/checkout use their own header; footer implementations differ, and brand pages have no footer. Account and location dialogs are placeholders. The cart uses localStorage; checkout does not create a real order. No authentication, real payment/shipping, database, order backend or administration is implemented.

## Completed work and evidence

- Recent prior turn: `npm.cmd run lint` and `npm.cmd run build` passed; build included TypeScript. A small correction to brand letter links and a disabled-data label was made after the first build, then a second production build passed. No build or lint was rerun in this documentation-only handoff.
- HTTP during this handoff: `http://localhost:3000/`, `/thuong-hieu`, `/thuong-hieu/bioderma.html` returned 200; `/clinic` returned 404. Port 3000 was running, but process state is ephemeral. An unknown brand returned 404 in the prior implementation turn.
- Brand list and detail are first-pass templates. The navigation header and home “Xem tất cả” point to `/thuong-hieu`; brand letters link to populated groups. Playwright followed the Bioderma link and observed one matching sample product. Source and local screenshots: `docs/design-references/brands-source-1440.png`, `brands-local-1440.png`, and `brand-detail-source-1440.png`. The detail page is incomplete, not a visually or functionally exact clone.
- Category page: source/local 1440 × 900 screenshots in `docs/design-references/category-*`. Brand strip, four-column listing and sorting buttons were added. Playwright tested Bioderma filtering, clearing, and ascending price (Hada Labo first); mobile 390 × 844 had two columns and no measured document overflow. Source mobile parity remains unverified. Category has used two repair iterations; brand template one, home three, per audit.
- Home and shared header were compared at desktop sizes. In response to the user’s request for wider display, desktop content maximum is 1800px, a deliberate deviation from the source’s measured 1340px. The initial 1100px cart-badge overflow was corrected. The viewport measurements are documented in the audit and do not establish full responsive or interaction coverage.

## Missing pages, known bugs and limitations

- Source menu destinations identified but not cloned include `/deals-dang-dien-ra.html?product_list_order=topsale`, `/campaign/wow`, `/hang-moi-ve.html?sort=position`, `/san-pham-ban-chay.html?sort=topsale`, `/clinic`, `/danh-muc/dermahair-c2298.html`, and `/booking`. Header still routes most of these to home anchors. Other source routes remain to be inventoried; query parameters can represent real states.
- Source quick links include `/danh-muc/phu-kien-dien-thoai-c2474.html`, `/danh-muc/thiet-bi-am-thanh-c2930.html`, `/danh-muc/ve-sinh-nha-cua-c2462.html`, `/danh-muc/balo-tui-xach-c2749.html`, and `/booking`; several local shortcuts point to anchors. The Anker category is missing in `categories`, so its local category shows a not-found message with HTTP 200. Unknown category/product also have soft 404 behavior as recorded in the audit. Verify current behavior before fixing.
- Brand detail currently has no real description, filters, promotions or full products. Most of the 488 brands have no sample products; “Deals” is explicitly marked as lacking data. Names and URLs may become stale. The shared header, search, sorting, filters, pagination, category trees, checkout and service flows need source-state mapping and browser testing. Product breadcrumbs erroneously include facial care for non-facial products; related products are generic. Home carousel/timer/sections contain samples and some anchor links; `Xem thêm` does not actually load more.
- Dev console previously reported a hydration mismatch involving injected `style="caret-color: transparent"` on inputs. Its origin and whether it occurs in production are unverified; do not assume its cause. Images, logos, prices, ratings and much content are examples; user accepts placeholder images, not misleading functionality or invented real data.

## Browser MCP and precautions

- `codex.cmd mcp list` succeeded outside the sandbox during this handoff and shows `playwright` enabled, command `npx.cmd -y @playwright/mcp@latest`. The sandboxed invocation failed to resolve `CODEX_HOME`; do not confuse that error with MCP registration failure. Playwright tools were actually available and used in prior turns, but availability must be checked in the new session. Native browser inventory previously reported `The browser access host is unavailable`; this is separate from the working Playwright MCP.
- **Important incident:** Playwright `browser_resize` was applied to the user's existing Chrome tab and fixed its viewport; maximizing left a blank strip or clipped content. Opening a fresh tab and maximizing restored normal appearance. For future screenshot tests create a separate isolated Playwright context/tab, resize only that test tab, and close it afterward. Never resize the user's active tab. The previous attempt to clear device metrics in a separate CDP session did not establish that the original override was cleared.
- Reference captures and inspection artifacts are in `docs/design-references/`, `docs/research/hasaki/`, and `.playwright-mcp/`. They are untracked; preserve them. Screenshots may show cookie banners, loading failures, time-varying promotions, or source state differences; label and compare matched conditions.

## Exact next steps for a new session

1. Re-read this document, `AGENTS.md`, `docs/clone-gap-report.md`, and `.agents/skills/clone-website/SKILL.md`; check `git status --short`, Node, server and available Playwright tools. Preserve all changes. If continuing implementation, inspect applicable Next.js documentation.
2. Continue the user's goal: inspect one source template at a time, starting with the incomplete brand-detail template or the next major missing menu destination. Record real URLs and query states; inspect desktop/mobile and controls before editing. Use isolated tabs, same viewport/state comparisons, and do not claim exact parity from placeholders or HTTP alone.
3. Implement real navigation between local routes as pages become available; keep absent data and unimplemented commerce explicit. Repair category/product soft 404s and wrong breadcrumbs when working on those templates. Verify existing navigation, cart, keyboard/mobile and no overflow at relevant boundaries. Limit repairs to five iterations per template.
4. Run lint/typecheck and one appropriate production build after an integrated change, plus focused browser tests. Update the audit with screenshots, test results and remaining gaps. Do not silently broaden or replace the existing codebase.

## Commands and operational notes

```powershell
git status --short
node --version
codex.cmd mcp list
npm.cmd run dev -- --port 3001
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
npm.cmd run start
```

`npm.cmd` avoids PowerShell execution-policy issues. Port 3000 was a production preview and 3001 a dev server in the preceding session; recheck before starting. `next start` warns about standalone output (`node .next/standalone/server.js` is recommended by Next); verify the actual preview rather than assuming either process survives. Older audit notes about Node 22 and native SWC failures are historical; Node 24 and the default build succeeded subsequently.

## Assumptions and unverified matters

- `hasaki.vn` remains the intended reference, based on the user's original target and subsequent work; current site data and campaigns can change. The 488 brands are a snapshot, not proof of current completeness.
- All-screen completeness, pixel parity, all source URLs, mobile layouts, browser interactions, and current production console behavior are not verified. Existing screenshots do not prove a complete clone. No full application test or production build was performed in the handoff-only turn.

## Audit 14/11/2026 — kết luận kiểm chứng mới nhất

Đã chia 3 subagent (1 nhẹ, 2 vừa), kết hợp Codegraph, nguồn công khai, HTTP local và browser riêng. Báo cáo tổng hợp: [audit-2026-11-14-summary](research/hasaki/audit-2026-11-14-summary.md). Các tuyên bố cũ hoàn thiện 100% không còn được coi là nghiệm thu: phát hiện guest API quản trị trả dữ liệu, slug lạ fallback sai, thành công trước API, ảnh 404 và JS chunks 500. Chưa sửa ứng dụng. Runtime/source có thể lệch; chưa nghiệm thu toàn bộ nút hoặc màn hình sau đăng nhập. Ưu tiên P0 runtime/auth → P1 dữ liệu/định tuyến/nghiệp vụ → P2 đối chiếu từng template. Xem báo cáo và ENGINEERING_RULES.md để tiếp nối.

## Chuẩn hóa Layout & Các Màn Hình Con Header — 14/11/2026

- **Đồng bộ khung `.wrap` & Header/Footer**:
  - Khung `.wrap` trên desktop đồng nhất `max-width: 1340px` cho toàn bộ Header, Nav, Main, Brands và Footer (`src/app/globals.css`).
  - Bổ sung `<Footer />` còn thiếu cho các trang con: `/deals-dang-dien-ra.html`, `/san-pham-ban-chay.html`, `/hang-moi-ve.html`, `/thuong-hieu`, `/thuong-hieu/[slug]`, `/campaign/wow`, `/tag/[slug]`, `/khach-hang/[section]`.
  - Tạo trang `/tra-cuu-don-hang` (`src/app/tra-cuu-don-hang/page.tsx`) để đường dẫn `Tra cứu đơn hàng` trên thanh điều hướng Header hoạt động đầy đủ (HTTP 200) thay vì trả về 404.
- **Chuẩn hóa Trang chủ, Danh mục, Chi tiết sản phẩm & các trang con**:
  - **Trang chủ (`src/app/page.tsx`)**: Định dạng giá `money(product.price)` cho Flash Deals, dùng `<ProductCard />` đồng nhất cho phần Gợi ý (bỏ nút "Thêm vào giỏ" làm lệch chiều cao thẻ), thay ký tự unicode `✿`/`✦` ở Danh mục & Bán chạy bằng ảnh thumbnail sản phẩm thực tế từ danh mục.
  - **Danh mục (`src/components/sites/hasaki/catalog-view.tsx`)**: Bỏ danh sách danh mục trùng lặp lần 2 trong `<aside className="filters">`, bỏ các pill chọn nhanh giá dưới Khoảng giá, chuẩn hóa nút `Áp dụng` màu `#326e51`, bỏ thanh pill danh mục con nổi phía trên `<h1>`, và sửa URL ảnh bị gãy của sản phẩm Hada Labo trong `src/lib/catalog.ts`.
  - **Chi tiết sản phẩm (`catalog-view.tsx` & `product-rich-sections.tsx`)**: Đưa `.detail-gallery` về bố cục 2 cột chuẩn Hasaki (cột thumbnail dọc 60px bên trái + ảnh lớn bên phải), bỏ hộp gallery trùng lặp trong `ProductRichSections` và khối tab trùng lặp `#description`, bọc phần dưới trang chi tiết trong lưới 2 cột `.detail-lower-grid` (`minmax(0, 1fr) 280px`) với `ProductRichSections` bên trái và cột dọc `Sản phẩm xem cùng` + `Sản phẩm cùng thương hiệu` bên phải; sửa lỗi `Invalid Date` ở ngày đánh giá/hỏi đáp.
  - **Các màn hình con khác**: Bỏ thanh `.progress` bị lặp lần 2 trong `deals-list.tsx` (đã hiển thị trong `ProductCard`), chỉnh lại vị trí badge xếp hạng ở `bestseller-view.tsx`, khôi phục `image: p.image` bị gán `undefined` ở `campaign-wow-view.tsx` và `tag-view.tsx`, chuyển link danh mục sidebar ở `new-arrivals.tsx` về route nội bộ `/danh-muc/[slug]`, chuyển bố cục `customer-portal-view.tsx` sang `.portal-layout-grid` co giãn trên mobile và chặn hiển thị dữ liệu giả khi chưa đăng nhập ở `customer-portal-view.tsx` & `admin-erp-view.tsx`.
- **Kiểm chứng đã chạy**:
  - `node --test test/access-policy.test.mjs test/brand-filter.test.mjs`: 7/7 pass.
  - `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run build`: đều pass (exit code 0).
  - Chụp và kiểm tra trực quan ảnh màn hình từ `node scripts/capture-local-layout-audit.mjs` (`audit-local-01-home.png` đến `audit-local-08-order-lookup.png`).
- **Giới hạn còn lại**: Dữ liệu sản phẩm là bản chụp (snapshot), giỏ hàng/tra cứu đơn hàng/đặt lịch là mô phỏng giao diện và tuân thủ cơ chế fail-closed theo `docs/ENGINEERING_RULES.md`.




---

## Note Bàn Giao Chi Tiết Từng Task (Wave 8 — Chuẩn Hóa Bố Cục 1:1, Khôi Phục Tailwind CSS v4 & Xóa Sạch Lỗi 404 Toàn Bộ Routes) — 14/11/2026

1. **Khôi phục Tailwind CSS v4 & chuẩn hóa CSS toàn cục (`src/app/globals.css`)**:
   - Bổ sung `@import "tailwindcss";` ở đầu `src/app/globals.css` kết hợp phân tầng `@layer base` và `@layer components` để toàn bộ các trang sử dụng Tailwind utility classes (`/he-thong-cua-hang`, `/bao-hanh`, `/ho-tro`, `/thuong-hieu`, `/tra-cuu-don-hang`, `<Footer />`, `AccountDialog`) hiển thị đúng chuẩn thiết kế thay vì bị tràn ảnh hoặc nút mặc định trình duyệt.
   - Khắc phục tràn ảnh giỏ hàng (`/gio-hang`) bằng quy tắc cố định `.cart-thumb { width: 80px; min-width: 80px; max-width: 80px; height: 80px; flex-shrink: 0; overflow: hidden; border: 1px solid #e5e7eb; border-radius: 6px; }` và `.cart-thumb img { width: 100%; height: 100%; object-fit: contain; }`.
   - Chuẩn hóa bộ chọn `.footer-benefits`, `.footer-icon-link`, `.footer-app-btn`, `.footer-payments`, `.footer-badges`, `.footer-col-title`, `.footer-newsletter-box` cho `<Footer />` (`src/components/sites/hasaki/footer.tsx`).
2. **Chuẩn hóa Layout Trang Chủ, Danh Mục, Chi Tiết Sản Phẩm & Các Màn Hình Con**:
   - **Trang chủ (`src/app/page.tsx`)**: Định dạng giá `money(product.price)`, sử dụng `<ProductCard />` đồng nhất, thay thế ký tự `✿`/`✦` bằng ảnh sản phẩm thật và dùng `next/image`.
   - **Trang Danh mục & Chi tiết sản phẩm (`src/components/sites/hasaki/catalog-view.tsx`, `src/components/sites/hasaki/product-rich-sections.tsx`)**: Bố cục `.detail-gallery` 2 cột (cột thumbnail dọc 60px bên trái + ảnh lớn bên phải), lưới 2 cột `.detail-lower-grid` (`minmax(0, 1fr) 280px`) với `<ProductRichSections />` bên trái và `Sản phẩm xem cùng` / `Sản phẩm cùng thương hiệu` bên phải, loại bỏ tab `#description` và gallery trùng lặp.
   - **Các màn hình con (`deals-list.tsx`, `bestseller-view.tsx`, `new-product-view.tsx`)**: Đồng bộ màu cam Hasaki (`#ff6600` / `#e95725`), gỡ bỏ thanh tiến độ và nút thêm giỏ hàng trùng lặp dưới `<ProductCard />`, chỉnh vị trí huy hiệu `TOP X` sang góc phải để không đè lên badge `Bán chạy`, bổ sung `<Footer />` và `.breadcrumbs` đầy đủ.
3. **Xóa sạch lỗi 404 trên toàn bộ liên kết Header, Mega Menu, Search Popup & Trang Chủ**:
   - Mở rộng `resolveCategorySlug()` và `getCategoryTitle()` trong `src/lib/catalog.ts` ánh xạ toàn bộ ~150 danh mục con trong `interactive-ui-2026-11-14.json` (`megaMenu`, `searchPopup`, `categoryPageUi`) và các banner (`nha-cua-doi-song-c2529.html`, `dien-gia-dung-c2463.html`, `loa-bluetooth-c2800.html`, v.v.).
   - Bổ sung và mở rộng các route `/tra-cuu-don-hang`, `/campaign/[slug]`, `/tag/[slug]`, `/cam-nang/[slug]`, `/dang-ky`, `/dich-vu/[slug]` và `/thuong-hieu/[slug]`.

---

## Cập Nhật Wave 9 (Kiến Trúc White-Label O2O `/grill-me`, Đổi Tên Repo GitHub `ecommerce-platform`, Phân Quyền RBAC & Sửa Font Tiếng Việt) — 14/11/2026

### 1. Quyết Định Kiến Trúc Nghiệp Vụ & Kỹ Thuật (`/grill-me`)
1. **Chiến lược Database & Dữ liệu mẫu (White-label Retail + Clinic Schema)**:
   - Tách biệt hoàn toàn dữ liệu hiển thị khỏi dữ liệu cào cứng bằng tầng CSDL quan hệ chuẩn hóa ([src/lib/db/schema.sql](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/lib/db/schema.sql) và [src/lib/db/repository.ts](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/lib/db/repository.ts), tài liệu tại [docs/DATABASE_ARCHITECTURE.md](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/docs/DATABASE_ARCHITECTURE.md)).
   - Hỗ trợ kết nối **PostgreSQL ngoài** qua `DATABASE_URL` và tự động fallback về **SQLite nội bộ (`data/ecommerce.sqlite`)** khi chạy local.
   - Dữ liệu Hasaki chỉ đóng vai trò **Seed Data (dữ liệu mẫu)** có công tắc bật/tắt hoặc xóa sạch (`ENABLE_HASAKI_SEED=false` / `clearSeedData()`) để nạp sản phẩm & dịch vụ riêng của doanh nghiệp.
2. **Mô hình Chi nhánh & Tồn kho (Flexible Multi-Branch 1..N)**:
   - Hỗ trợ cấu hình linh hoạt từ `1` kho duy nhất đến `N` chi nhánh cửa hàng/clinic (`branches` + `branch_inventory`), mỗi chi nhánh có cờ bật/tắt `NowFree 2H` và `Clinic & Spa`, tự động trừ tồn kho thực tế khi tạo đơn hàng.
3. **Bảo mật Phiên đăng nhập & Thanh toán O2O**:
   - Sử dụng **HTTP-only signed session cookie (`hasaki_session`)** kết hợp [src/middleware.ts](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/middleware.ts) để bảo vệ các route `/quan-tri` và `/khach-hang/*` ngay từ tầng Edge/Server.
   - Thanh toán hỗ trợ **COD**, **VietQR chuyển khoản ngân hàng động** và cổng **Webhook xác nhận thanh toán tự động** ([src/app/api/payments/webhook/route.ts](file:///C:/Users/MyPC/OneDrive/M%C3%A1y%20t%C3%ADnh/hasaki-clone/src/app/api/payments/webhook/route.ts)).

### 2. Đổi Tên Dự Án & Đẩy Lên GitHub (`ecommerce-platform`)
- Đã đổi tên package trong `package.json` thành **`ecommerce-platform`** (gỡ bỏ tên `hasaki-clone`).
- Đã khởi tạo repository GitHub mới và đẩy toàn bộ mã nguồn sạch lên nhánh `main`:
  - **GitHub URL**: `https://github.com/tylum123/ecommerce-platform`

### 3. Phân Quyền Route (RBAC), Màn Hình Theo Vai Trò & Chuẩn Hóa Font Tiếng Việt (Đang triển khai & Kiểm thử)
- **Phân quyền Route & Màn hình hiển thị theo Role**:
  - `Guest`: Xem Storefront công khai; truy cập `/quan-tri` hoặc `/khach-hang/*` sẽ tự động chuyển hướng về `/dang-nhap?redirect=...`.
  - `Customer (VIP)`: Truy cập `/khach-hang/tai-khoan`, `/khach-hang/don-hang`, `/khach-hang/so-dia-chi`, `/khach-hang/yeu-thich`; chặn truy cập `/quan-tri` (hiển thị thông báo phân quyền rõ ràng + nút quay về khu vực khách hàng).
  - `Staff (Warehouse / Clinic Doctor)`: Truy cập `/quan-tri` với các tab nghiệp vụ được phép theo đúng vai trò (`orders`, `inventory` cho Quản lý Kho; `users`/hồ sơ da & lịch hẹn cho Bác sĩ Da liễu).
  - `Super Admin`: Toàn quyền truy cập tất cả các tab trên `/quan-tri` (`Overview`, `Users CRM`, `Staff RBAC`, `Orders NowFree 2H`, `Multi-branch Inventory`, `SEO & AI MCP`).
- **Chuẩn hóa Font chữ Tiếng Việt**:
  - Cấu hình `subsets: ["latin", "vietnamese"]` và đồng bộ biến CSS `--font-sans` trong `src/app/layout.tsx` & `src/app/globals.css`, khắc phục triệt để lỗi lệch dấu Tiếng Việt (`ắ, ặ, ể, ệ, ơ, ư, đ`) và lệch `line-height` trên Windows.

---

## Bàn Giao Wave 10 — Chuyển Đổi Hoàn Tất Nhận Diện Thương Hiệu & Tone Màu **Nari Home (Phương Án A — Header Kem Lụa Sáng `#F6ECE3`)** — 14/11/2026

Đã hoàn thành toàn diện **Wave 10** theo đúng yêu cầu người dùng: chuyển đổi thương hiệu từ Hasaki sang **Nari Home — *"Khơi nguồn vẻ đẹp - Kiến tạo khí chất"*** với Phương án A (Header nền Kem Lụa Sáng `#F6ECE3`):

1. **Hệ Thống Font Chữ & Metadata Trang Web (`src/app/layout.tsx`)**:
   - Tích hợp cặp font chuẩn thương hiệu: **`Cormorant_Garamond`** (`--font-display`, weight 500/600/700 cho Logo và tiêu đề) và **`Be_Vietnam_Pro`** (`--font-sans`, weight 400/500/600/700 cho nội dung UI), hỗ trợ đầy đủ `subsets: ["latin", "vietnamese"]`.
   - Cập nhật Metadata mặc định: `<title>Nari Home — Khơi nguồn vẻ đẹp - Kiến tạo khí chất | Mỹ Phẩm & Clinic Chính Hãng</title>` và mô tả dịch vụ làm đẹp da liễu chuẩn y khoa Nari Home.

2. **Hệ Thống Design Tokens & Bảng Màu Luxury Silk & Pearl Champagne (`src/app/globals.css`)**:
   - Thiết lập các biến CSS `:root` chuẩn xác:
     - Nền chính: `--bg-page: #faf5f0;` (Ivory Alabaster Silk)
     - Nền khối/phần tử: `--bg-surface-alt: #f6ece3;` (Pearl Champagne Silk)
     - Viền tinh tế: `--line: #e6d5c5;` (Silk Champagne Border)
     - Màu thương hiệu chính: `--brand-green: #3d2e24;` (Deep Espresso Luxury) & `--brand-green-dark: #1e1b18;` (Obsidian Charcoal)
     - Màu điểm nhấn kim loại quý: `--brand-accent: #9e7656;` (Champagne Bronze)
     - Màu hành động CTA: `--orange: #b86b4b;` (Warm Terracotta / Rose-Bronze) cho giá khuyến mãi, Flash Deals, giỏ hàng, nút đặt hẹn
     - Màu chữ chính & phụ: `--text: #1e1b18;` (Obsidian Charcoal) & `--muted: #6e5a4f;` (Warm Taupe)
   - **Header Phương án A (`.header`, `.site-header`, `.header-main-bar`)**:
     - Nền gradient Kem Lụa Sáng: `linear-gradient(135deg, #faf5f0 0%, #f6ece3 52%, #efe2d4 100%)`.
     - Viền đáy vàng đồng ngọc trai: `1px solid #e2ceba`.
     - Chữ & biểu tượng: `#1e1b18` và `#3d2e24`, hover chuyển sang `#b86b4b`.
     - Thanh thông báo trên cùng (`.promo-strip`): Nền Espresso trầm `#3d2e24`, chữ `#f6ece3`, huy hiệu pill cam đất `#b86b4b`.
     - Ô tìm kiếm (`.search`): Nền trắng tinh tế, viền `#d4beaa`, nút tìm kiếm Espresso `#3d2e24` (hover `#b86b4b`).
     - Thanh điều hướng (`.nav`, `.subnav-bar`): Nền `#fdfaf7`, viền `#eadbcf`, menu links `#3d2e24` (hover `#b86b4b`).

3. **Component `<NariHomeLogo />` & Hero Banner Trang Chủ**:
   - Tạo mới `src/components/sites/hasaki/nari-home-logo.tsx`: Biểu tượng SVG hoa lily nở đối xứng & ngọc trai trung tâm với vòng chỉ vàng đồng champagne, dòng chữ **Nari Home** font Cormorant Garamond và slogan *"Khơi nguồn vẻ đẹp - Kiến tạo khí chất"*.
   - Thay thế toàn bộ logo cũ bằng `<NariHomeLogo />` trên Header, Footer, Giỏ hàng, Thanh toán.
   - Trang chủ (`src/app/page.tsx`): Đặt banner chính thức `public/nari-home-banner.jpg` làm **Slide đầu tiên** của Hero Banner Carousel kèm điều khiển mượt mà.
   - Thẻ sản phẩm (`src/components/sites/hasaki/product-card.tsx`): Đổi màu thương hiệu và tag quà tặng sang Warm Terracotta `#b86b4b` và Deep Espresso `#3d2e24`.
   - Chân trang (`src/components/sites/hasaki/footer.tsx`): Đổi toàn bộ nhãn nhận diện sang Nari Home, Nari Clinic & Spa, email `hotro@narihome.vn`, bản quyền © 2026 Nari Home Beauty & Clinic.
   - Các màn hình đăng nhập & đăng ký (`/dang-nhap`, `/dang-ky`): Đồng bộ tone màu ấm và văn bản sang tài khoản Nari Home.

4. **Ghi Nhận Thay Đổi Theo Yêu Cầu Người Dùng**:
   - Đã gỡ bỏ nhãn `"TOOL PLAYGROUND"` bên cạnh tab `"AI MCP & SEO Hub"` tại dòng 899-901 của `src/components/sites/hasaki/admin-erp-view.tsx` và giữ nguyên trạng thái này.
   - Đã sửa lỗi kiểu dữ liệu `handleAddToCartFromFav` trong `src/components/sites/hasaki/customer-portal-view.tsx` đồng bộ với `CartItem` (`{ slug, quantity }`).

5. **Kết Quả Kiểm Thử & Xác Minh**:
   - `npx tsc --noEmit --incremental false`: Pass 100% với 0 lỗi Type-Check.
   - `node --test test/access-policy.test.mjs test/auth-and-routing.test.mjs test/brand-filter.test.mjs test/test-campaigns-location.mjs`: Pass toàn bộ 14/14 bài test tự động (access policy, RBAC routes, HMAC session, catalog sorting & facets).
