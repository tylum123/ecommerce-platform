# Tiến độ dự án E-Commerce Platform (Nari Home) & Quản Trị Doanh Nghiệp

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


