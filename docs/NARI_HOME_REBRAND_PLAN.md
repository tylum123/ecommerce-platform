# Kế Hoạch Chuyển Đổi Nhận Diện Thương Hiệu & Tone Màu Chủ Đạo: **Nari Home**

> **Khẩu hiệu thương hiệu (Slogan)**: *"Khơi nguồn vẻ đẹp - Kiến tạo khí chất"*
> **Trạng thái**: ✅ **ĐÃ TRIỂN KHAI VÀ XÁC MINH TOÀN DIỆN PHƯƠNG ÁN A (Header nền Kem Lụa Sáng `#F6ECE3`)** (14/11/2026).

---

## 1. Phân Tích Ngôn Ngữ Thiết Kế Từ Banner Gốc (`Nari Home`)

Từ ấn phẩm thương hiệu **Nari Home** do team cung cấp:
- **Tinh thần chủ đạo**: Sang trọng, thanh lịch, mềm mại như lụa ngọc trai và hoa bách hợp trắng kem, kết hợp nét Á Đông hiện đại (khung cửa gỗ truyền thống đổ bóng nắng nhẹ phía sau và chuỗi ngọc trai quý phái).
- **Khác biệt cốt lõi so với giao diện mẫu cũ (Hasaki)**:
  - Thay thế tông màu bình dân/siêu thị khuyến mãi (**Xanh lá đậm `#306e51` + Cam chói `#ff6600`**) bằng bảng màu **Luxury Silk & Pearl Champagne (Kem Lụa Ngọc Trai — Nâu Espresso Trầm — Vàng Đồng Champagne — Cam Đất Terracotta)**.

---

## 2. Bảng Màu Chủ Đạo Mới (Color Token System)

| Vai trò trong UI | Token CSS (`globals.css`) | Mã màu cũ | Mã màu mới (**Nari Home**) | Mô tả thị giác |
| :--- | :--- | :--- | :--- | :--- |
| **Nền chính toàn trang** | `--bg-page` / `--background` | `#f2f1f6` | `#FAF5F0` *(Ivory Silk)* | Kem sứ ấm áp, sang trọng, làm nổi bật ảnh sản phẩm |
| **Nền khối / Banner / Section** | `--bg-surface-alt` / `--brand-green-soft` | `#e5fbf1` | `#F6ECE3` *(Pearl Champagne)* | Tông màu nền chính xác từ banner Nari Home |
| **Viền & Đường kẻ phân cách** | `--line` / `--border` | `#d8e0dc` | `#E6D5C5` *(Silk Border)* | Viền kem nâu mảnh, tinh tế |
| **Màu thương hiệu chính (Header / Footer / Text chính)** | `--brand-primary` / `--brand-green` | `#306e51` | `#3D2E24` *(Deep Espresso)* hoặc `#F6ECE3` *(Kem Lụa)* | Nâu Espresso trầm sang trọng hoặc nền Kem Lụa chữ Đen Charcoal `#1E1B18` |
| **Màu nhấn kim loại quý (Hover / Icon / Badge)** | `--brand-accent` | `#1f563d` | `#9E7656` *(Champagne Bronze)* | Vàng đồng nhụy hoa lily trên banner |
| **Màu hành động CTA (Giá tiền / Giỏ hàng / Flash Sale)** | `--orange` / `--cta-primary` | `#ff6600` | `#B86B4B` *(Warm Terracotta)* | Cam đất/Hồng đất sang trọng, nổi bật nhưng không chói gắt |
| **Màu chữ tiêu đề & Logo** | `--text` | `#1f2523` | `#1E1B18` *(Obsidian Charcoal)* | Đen nâu than củi sắc nét đúng màu chữ `Nari Home` |
| **Màu chữ phụ & Slogan** | `--muted` | `#67726d` | `#6E5A4F` *(Warm Taupe)* | Nâu khói thanh lịch đúng màu chữ *"Khơi nguồn vẻ đẹp - Kiến tạo khí chất"* |

---

## 3. Hệ Thống Font Chữ (Typography Pairing)

1. **Font Tiêu đề & Logo (`--font-display`)**:
   - **`Cormorant Garamond`** hoặc **`Playfair Display`** (`subsets: ["latin", "vietnamese"]`, weight `500`, `600`, `700`).
   - Áp dụng cho: Cụm chữ thương hiệu **Nari Home**, tiêu đề các khối lớn trên trang chủ (*Flash Deals*, *Thương Hiệu Nổi Bật*, *Dịch Vụ Clinic & Spa*), tiêu đề trang Cẩm nang & Dịch vụ.
2. **Font Giao diện & Nội dung (`--font-sans`)**:
   - **`Be Vietnam Pro`** hoặc **`Plus Jakarta Sans`** (`subsets: ["latin", "vietnamese"]`, weight `400`, `500`, `600`, `700`).
   - Áp dụng cho: Menu điều hướng, tên sản phẩm, bộ lọc, giá tiền, giỏ hàng, trang quản trị ERP — đảm bảo dấu Tiếng Việt tròn trịa, cân đối tuyệt đối.

---

## 4. Lộ Trình Triển Khai Kỹ Thuật (4 Bước)

### Bước 1: Tích hợp Tài nguyên Thương hiệu (`public/` & `<NariHomeLogo />`)
- Lưu ảnh banner chính thức vào `public/nari-home-banner.jpg`.
- Tạo component `<NariHomeLogo />` tại `src/components/sites/hasaki/nari-home-logo.tsx` tái hiện chuẩn xác kiểu chữ Serif nghệ thuật **Nari Home** kèm dòng slogan *"Khơi nguồn vẻ đẹp - Kiến tạo khí chất"* và họa tiết ngọc trai/hoa lily.

### Bước 2: Cập nhật Hệ thống CSS Variables (`src/app/globals.css` & `src/app/layout.tsx`)
- Cập nhật các biến màu gốc trong `:root` của `src/app/globals.css` sang bảng màu **Nari Home**.
- Khai báo cặp font `Cormorant_Garamond` + `Be_Vietnam_Pro` hỗ trợ đầy đủ `vietnamese` subset trong `src/app/layout.tsx`.

### Bước 3: Thay thế Header, Hero Banner & Footer (`header.tsx`, `page.tsx`, `footer.tsx`)
- **Header (`src/components/sites/hasaki/header.tsx`)**:
  - Thay logo Hasaki bằng `<NariHomeLogo />`.
  - Áp dụng phương án màu Header do User chọn (**Phương án A — Nền Kem Lụa Sáng `#F6ECE3` chữ Đen Charcoal `#1E1B18`** hoặc **Phương án B — Nền Nâu Espresso Trầm `#3D2E24` chữ Kem Ngọc Trai `#F6ECE3`**).
- **Hero Banner Trang Chủ (`src/app/page.tsx`)**:
  - Đặt banner **Nari Home — Khơi nguồn vẻ đẹp - Kiến tạo khí chất** làm **Slide đầu tiên (Hero Main Banner)** của trang chủ.
- **Footer (`src/components/sites/hasaki/footer.tsx`)**:
  - Đổi nhận diện chân trang, thông tin liên hệ và bản quyền sang **Nari Home Beauty & Clinic**.

### Bước 4: Đồng bộ White-Label Text trên toàn bộ màn hình con
- Đổi các nhãn `Hasaki Deals` -> `Nari Deals`, `NowFree 2H` -> `NariNow 2H`, `Hasaki Clinic & Spa` -> `Nari Clinic & Spa` trên Header, trang chủ, trang dịch vụ, giỏ hàng, thanh toán và cổng quản trị `/quan-tri`.

---

## 5. Báo Cáo Triển Khai Hoàn Tất (Phương Án A) — 14/11/2026

- **Phương án lựa chọn**: **Phương án A (Header nền Kem Lụa Sáng `#F6ECE3`, chữ Obsidian Charcoal `#1E1B18`)**.
- **Tài nguyên**:
  - Banner chính thức: `public/nari-home-banner.jpg` (hiển thị làm Slide đầu tiên tại Hero Banner trang chủ).
  - Component Logo: `src/components/sites/hasaki/nari-home-logo.tsx` (Logo Serif nghệ thuật Cormorant Garamond kèm biểu tượng hoa lily & ngọc trai).
- **Hệ thống Font**: Khai báo đồng bộ cặp font `Cormorant_Garamond` (`--font-display`) và `Be_Vietnam_Pro` (`--font-sans`) hỗ trợ `vietnamese` subset tại `src/app/layout.tsx`.
- **Hệ thống Màu (CSS Tokens)**: Đồng bộ toàn diện bảng màu Luxury Silk & Pearl Champagne trong `src/app/globals.css`.
- **Storefront & Sub-screens**: Đồng bộ Header, Footer, Hero Banner, ProductCard, Giỏ hàng, Thanh toán, Đăng nhập, Đăng ký sang nhận diện Nari Home.
- **Kiểm thử & Type-Safety**: `npx tsc --noEmit --incremental false` pass 100%, bộ kiểm thử 14 bài `node --test` pass 100%.
