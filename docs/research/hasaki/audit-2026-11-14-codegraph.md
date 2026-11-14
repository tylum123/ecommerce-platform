# Audit mã nguồn điều hướng và tương tác — 14/11/2026

Phạm vi: khảo sát có mục tiêu bằng Codegraph trước khi đọc mã; bổ sung riêng đoạn bị cắt của ProductView và header. Đã đọc AGENTS.md, ENGINEERING_RULES.md và phần bàn giao/gap report mới nhất. Không sửa ứng dụng, không chạy browser/test/build trong nhánh audit này. Các dòng bên dưới là bằng chứng tĩnh tại thời điểm khảo sát, không phải kết quả click thực tế hay xác nhận giao dịch server.

## Tình trạng route và điều hướng từ trên xuống

`rg --files src/app -g page.tsx -g route.ts` ghi nhận **29 page.tsx template** và **17 route.ts API module**. Dynamic route tạo nhiều URL; số này không phải tổng số màn hình hợp lệ hoặc màn hình đã nghiệm thu.

| Vùng | Điều đã xác minh trong mã | Cần kiểm tra tiếp |
|---|---|---|
| Header/logo | Logo về `/`; form tìm kiếm GET `/tim-kiem?q=...`; autocomplete lọc catalog trong browser (`header.tsx:153`, `177-198`, `49-51`) | Search keyboard, Escape, loading/error, kết quả sau refresh/back và so khớp nguồn |
| Menu chính | Deals, WOW, thương hiệu, hàng mới, bán chạy, Clinic, Dermahair, bảng giá, cẩm nang đều href local (`header.tsx:662-672`) | Không giữ kết luận cũ rằng campaign/booking chưa có route hoặc menu chính đi hết sang nguồn |
| Tài khoản/địa điểm/giỏ | Có handler mở panel, đồng bộ local session/location/cart và href giỏ (`header.tsx:61-102`, `644-646`, `679-681`) | Auth server/ownership phải nghiệm thu riêng; local state không chứng minh đăng nhập thật |
| Quản trị | Menu công khai luôn render `/quan-tri` (`header.tsx:673-678`) | Việc có link không chứng minh rò dữ liệu; cần kiểm tra guard server/API với guest/customer |
| Lối tắt trang chủ | Tám href local, gồm booking (`src/app/page.tsx:11-20`) | Kiểm tra nội dung đích; fallback category/product có thể che link sai |
| Trang chủ | Thẻ → sản phẩm; nút thêm giỏ dùng `addToCart`; tab gợi ý và xem thêm có state (`page.tsx:85-99`, `134-138`, `339-351`) | Không có bằng chứng danh sách/lượt bán/đếm ngược là live |
| Footer | Liên kết local tới hỗ trợ, cửa hàng, bảo hành, Clinic, booking; app link `https://hotro.hasaki.vn/app` mở tab ngoài; hotline dùng `tel:` (`footer.tsx:53-96`) | App/hotline là hành động ra dịch vụ nguồn; không tính là màn hình clone. Chưa kiểm tra từng support slug trả đúng nội dung |

## Lỗi/gap đã xác minh trong mã và ưu tiên đề xuất

Đường dẫn component trong bảng viết gọn tương đối với `src/components/sites/hasaki/`, trừ khi ghi rõ `src/`.

| ID / ưu tiên | Nút hoặc màn hình | Bằng chứng và hành vi mã hiện tại | Hướng xử lý |
|---|---|---|---|
| C01 / P1 | URL sản phẩm lạ | `src/app/san-pham/[slug]/page.tsx:52-54` trả sản phẩm đầu catalog cho mọi slug không tìm thấy. Comment ghi rõ fallback tránh 404 | Trả notFound; mapping alias cần xác định rõ. Test slug lạ và slug hợp lệ; HTTP 200 hiện tại không chứng minh link đúng |
| C02 / P1 | URL danh mục lạ | `src/lib/catalog.ts:202-214` trả chăm sóc da mặt cho slug không khớp; route truyền thẳng resolver (`src/app/danh-muc/[slug]/page.tsx:11-13`); CategoryView còn fallback tiêu đề `categories[0]` (`catalog-view.tsx:60`) | Trả notFound cho slug lạ; không biến link sai thành trang khác |
| C03 / P1 | Dung tích/công dụng → giỏ | ProductView lấy swatch/capacity toàn cục (`catalog-view.tsx:914-924`), nhân giá theo hệ số (`977-981`), nhưng handler chỉ lưu `p.slug, quantity` (`997-999`); `src/lib/cart.ts:1-7` không có variant ID/price | SKU variant thật và giá server; giỏ/checkout phải giữ đúng lựa chọn. Hiện thay dung tích có thể đổi giá hiển thị nhưng giỏ vẫn sản phẩm gốc |
| C04 / P1 | Xác nhận đặt hàng | `checkout-view.tsx:135-192` tự sinh code, ghi `hasaki-demo-orders`, POST không await/không xét HTTP status rồi `setReview(true)` | Chỉ hiển thị đã tạo sau response thành công; có pending/error/retry và idempotency. Cần tách order chính thức khỏi draft local |
| C05 / P1 | Đặt lịch | `booking-view.tsx:51-89` bật preview, ghi status `confirmed` local trước POST không await/không xét HTTP status | Backend xác nhận công suất/lịch trống và cấp mã; UI phản ánh lỗi, không tự xác nhận |
| C06 / P1 | Gửi đánh giá | `product-rich-sections.tsx:215-275` thêm review và sửa điểm tổng ngay; fetch không await; luôn báo đã ghi nhận | Chờ server hoặc optimistic có rollback; kiểm tra danh tính/quyền đánh giá và refresh persistence |
| C07 / P1 | Gửi hỏi đáp | `product-rich-sections.tsx:279-322` tự thêm câu trả lời có tên “Dược sĩ / Tư vấn viên Hasaki”, `isAdmin: true`; POST không await, luôn báo thành công | Không tạo lời đáp nhân viên giả; trả trạng thái tiếp nhận từ server và câu trả lời thực có nguồn |
| C08 / P1 | Tra tồn kho | `catalog-view.tsx:940-952` nuốt lỗi request; `1509-1516` khi chưa có dữ liệu vẫn ghi “Còn 186 CH có hàng”, trong khi drawer cần branchStock mới render | Hiển thị loading/unknown/error và retry; không khẳng định còn hàng khi API thất bại |
| C09 / P1 | Tra bảo hành | `src/lib/support-stores.ts:538-612` dùng sampleWarranties; mọi số hợp lệ `0` + 9 chữ số đều trả `found: true`, active, serial DEMO và thông báo hệ thống đã ghi nhận | Chỉ cho fixture ở môi trường demo và ghi rõ; production tra DB có quyền phù hợp, không tìm thấy phải trả đúng |
| C10 / P2 | Sticky menu thông tin SP | Tất cả sectionAnchors đều `href="#description"` (`catalog-view.tsx:1087-1099`) | Mỗi mục trỏ section ID tương ứng và chọn tab đúng; kiểm tra scroll/offset |
| C11 / P2 | Yêu thích / chia sẻ SP | Chỉ là `<p>♡ Yêu thích ... Chia sẻ</p>` (`catalog-view.tsx:1188`), không phải button/link/handler | Implement favorite/share hoặc ẩn/vô hiệu có giải thích |
| C12 / P2 | Gallery thumbnail | `catalog-view.tsx:1170-1185` đổi selectedVariantId; ảnh chính vẫn `p.image` (`1148-1153`) | Dùng gallery ảnh/variant của đúng SKU; hiện thumbnail không thay ảnh chính |
| C13 / P2 | Sort mới nhất/bán chạy | `catalog-view.tsx:176-179`: new dùng sale giảm dần, topsale dùng reviewCount (default 90), không phải ngày đăng/số bán | Dùng trường nghiệp vụ đúng; thiếu dữ liệu thì vô hiệu tùy chọn thay vì mô phỏng thứ hạng |
| C14 / P2 | Bộ lọc chuyên sâu | `src/lib/category-facets.ts:154-218` suy thuộc tính từ text/brand; normal/all skin trả true; origin từ bảng brand, không phải thuộc tính SKU | Nguồn thuộc tính chuẩn có provenance; không coi heuristic là kết quả lọc tương đương Hasaki |
| C15 / P2 | Dữ liệu category | `src/lib/catalog.ts:235-239` bỏ sản phẩm chăm sóc da ngoài 57k–360k để giữ giá mẫu ở cực trị sort | Bỏ ràng buộc phục vụ kết quả mẫu; hiển thị tập dữ liệu thật và test theo dữ liệu, không sửa dữ liệu cho test |
| C16 / P2 | Khuyến mãi quà tặng | `src/lib/interactive-ui.ts:132-195` bảng hardcode; `244-259` tự sinh quà, ngưỡng tiền cho brand khác; ProductView hiển thị “chính hãng” (`catalog-view.tsx:1364-1367`) | Chỉ hiển thị promotion có nguồn và hiệu lực; không sinh quà nghiệp vụ |
| C17 / P2 | Mã công bố/đánh giá/countdown | ProductView dùng defaultMinistryCode toàn cục (`1243-1244`), rating mặc định 4.9/228 (`1265`), countdown chuỗi cố định (`1290`) | Theo đúng SKU/campaign có nguồn; thiếu thì ẩn/unknown. Mã chứng nhận không được áp toàn catalog |
| C18 / P2 | Trang chủ bán chạy/Flash Deal | `src/app/page.tsx:201` timer cố định; `205` dùng core productRoutes; `271` lượt bán tính `(8.4 - i * 0.7)M` | Lấy dữ liệu hợp lệ có timestamp; fixture phải đánh dấu demo, không gọi số tính từ index là số bán thực |
| C19 / P3 | Phân trang category | `catalog-view.tsx:184` chỉ `slice(0,pageSize)` trong phần mã đã xem; chưa xác nhận trang tiếp theo/URL state | Kiểm tra phần JSX còn lại và browser trước kết luận thiếu hoàn toàn; nghiệm thu filter + pagination + back/refresh |
| C20 / P3 | Footer cấu hình | Footer tự hardcode columns và hotline (`footer.tsx:49-101`) dù `getFooterData()` trả columns/hotline (`src/lib/support-stores.ts:627-697`); footer ghi 350+ nhưng badge SP 186 | Một nguồn cấu hình thống nhất; con số phải có cùng định nghĩa/phạm vi/ngày cập nhật |

## Phân loại bằng chứng và giới hạn

Các C01–C18, C20 là hành vi hoặc cấu trúc nhìn thấy trực tiếp trong mã. C03 mô tả hậu quả suy ra từ hai đoạn mã hiển thị giá và lưu giỏ; chưa click tái hiện. C19 là mục cần xác minh bổ sung, không phải kết luận đã thiếu pagination hoàn toàn. Mức ưu tiên theo tác động người dùng; P0 auth/permission được audit riêng và ENGINEERING_RULES.md quy định phải xử lý trước mở production.

Không có kết luận dead link HTTP nào từ audit này: route tồn tại vẫn có thể sai nội dung, đặc biệt khi C01/C02 che lỗi. Không xác minh website nguồn hiện tại, trạng thái login, gửi email/SMS, thanh toán, tồn kho/công suất thật hoặc backend persistence. Mọi tuyên bố “1:1”, “thực tế”, “live”, “đã xác thực” trong handoff cũ phải đối chiếu thêm ma trận browser/API và provenance dữ liệu; việc lấy JSON snapshot hoặc có API route không đủ chứng minh.

Các template route hiện có: `/`, `/tim-kiem`, `/catalogsearch/result`, `/danh-muc/[slug]`, `/danh-muc/hasaki-clinic-spa-c331.html`, `/san-pham/[slug]`, `/thuong-hieu`, `/thuong-hieu/[slug]`, `/tag/[slug]`, `/hang-moi-ve.html`, `/san-pham-ban-chay.html`, `/deals-dang-dien-ra.html`, `/campaign/wow`, `/clinic`, `/dich-vu/[slug]`, `/dich-vu-phong-kham.html`, `/bang-gia-dich-vu.html`, `/booking`, `/dat-lich-kham`, `/cam-nang.html`, `/he-thong-cua-hang`, `/bao-hanh`, `/ho-tro`, `/ho-tro/[slug]`, `/gio-hang`, `/thanh-toan`, `/dang-nhap`, `/khach-hang/[section]`, `/quan-tri`.
