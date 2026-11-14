# Tổng hợp khảo sát Hasaki — 14/11/2026

## Kết luận và phạm vi

Đã khảo sát theo ba nhánh subagent: gpt-6-luna/medium cho nguồn công khai, gpt-6.1-sol/medium cho Codegraph, gpt-6.1-sol/medium cho HTTP local. Agent chính kiểm tra browser trong context riêng. Đây là đợt khảo sát và lập backlog, không sửa ứng dụng. Không tạo đơn, đăng nhập hoặc gửi biểu mẫu lên Hasaki.

Không xác nhận hoàn thiện 100%. Các tuyên bố trước đây về toàn bộ gap đã đóng hoặc ERP/auth hoàn chỉnh không được dùng làm nghiệm thu. Nguồn indexed, nguồn browser, mã hiện tại và runtime được phân biệt dưới đây. Crawl nguồn là mẫu đại diện cộng inventory link trang chủ, không phải toàn bộ catalog hay mọi trạng thái.

## Bằng chứng

- [Nguồn công khai và màn hình con](audit-2026-11-14-source.md): dữ liệu indexed có thể cũ; không phải click test.
- [Codegraph: nút và nghiệp vụ](audit-2026-11-14-codegraph.md): bằng chứng mã, vị trí sửa và giới hạn.
- [HTTP local và quyền truy cập](audit-2026-11-14-runtime.md): GET khách chưa đăng nhập; không lưu giá trị thông tin cá nhân.
- `audit-2026-11-14-browser-source-links.json`: inventory DOM link/button nguồn thực tế; khác với seed indexed `audit-source-links-2026-11-14.json`.
- Browser: https://hasaki.vn/ và http://localhost:3000/, desktop 1440×900, mobile 390×844. Ảnh trong `docs/design-references/audit-2026-11-14-{source,local}-{home-desktop,home-mobile,footer-desktop}.png`.
- Local console: `.playwright-mcp/console-2026-11-14T04-15-06-699Z.log`. Hai JS chunks trả 500; nhiều ảnh media.hcdn.vn trả 404. Chưa xác định nguyên nhân server/build. HTTP 200 của HTML không chứng minh client đã hydrate.

## Bản đồ sửa từ trên xuống

| Khu vực | Quan sát / vấn đề | Hành động tiếp theo | Bằng chứng |
|---|---|---|---|
| Runtime | JS chunks 500; runtime/source có dấu hiệu không đồng bộ | Xác định tiến trình/build, chạy bản nhất quán và kiểm tra lại trước click audit | Browser + HTTP |
| Header | Local có thêm ERP công khai, khác nguồn; khung tìm kiếm/icon khác | Tách admin khỏi menu công khai; so khớp search, account, location theo trạng thái | Ảnh desktop + Codegraph |
| Navigation | Các route chính đã có; không tiếp tục báo campaign/booking là thiếu chỉ từ ghi chú cũ | Giữ query params, kiểm tra đích và dữ liệu đúng template | Codegraph + DOM source |
| Hero/shortcuts | Local khối chữ/gradient thay ảnh chiến dịch; icon ký tự và hai shortcut đầu khác nguồn | Asset map nguồn → local, carousel và chiến dịch có provenance/ngày chụp | Ảnh desktop đã xem |
| Flash Deals | Ảnh hỏng, giá/format/đồng hồ và nội dung khác snapshot nguồn | Sửa asset; tách dữ liệu snapshot khỏi live; đồng hồ theo lịch dữ liệu | Browser + Codegraph |
| Category/brand | Bộ lọc/sắp xếp cần khớp semantics; topsale/newest dùng dữ liệu thay thế | Định nghĩa trường dữ liệu thật, test query/back/refresh/empty | Codegraph |
| Product | Slug lạ ra sản phẩm đầu tiên; biến thể đổi giá nhưng giỏ không giữ biến thể | 404 thật; SKU biến thể và giá server; đồng bộ selection → cart | HTTP + Codegraph |
| Product tabs/actions | Các anchor cùng trỏ description; thích/chia sẻ chưa thành hành động đúng | Anchor riêng, handler và kết quả rõ; test từng nút | Codegraph |
| Reviews/Q&A | Thành công và trả lời chuyên viên có thể sinh trước kết quả API | Chỉ báo thành công sau xác nhận; bỏ trả lời giả | Codegraph |
| Cart/checkout | Checkout ghi trạng thái trước API; giá từ client | Await và xử lý lỗi, tính giá server, transaction, idempotency | Codegraph |
| Clinic/booking | Xác nhận local trước kết quả API | Await, lỗi rõ, dữ liệu lịch và công suất server | Codegraph |
| Footer | Source có hợp tác mặt bằng, thanh toán/social, newsletter, bài giới thiệu dài, danh mục cuối trang; local giản lược/đổi nội dung | Map từng link subdomain và local scope, không gom các trang khác nhau vào một nội dung chung | DOM footer + ảnh |
| Account/admin | API trả dữ liệu quản trị khi guest | Auth server, permission/ownership, đóng API nhạy cảm và MCP | HTTP + Codegraph |

Chiều cao DOM desktop tại thời điểm quan sát: source 6466 px, local 4098 px; đây chỉ là tín hiệu khác nội dung/layout, không phải thước đo phần trăm giống. Mobile local không tràn ngang trong mẫu; source có scrollWidth lớn hơn viewport, chưa kết luận đây là lỗi nguồn hay hành vi responsive do resize. Đã click mở account nguồn nhưng chưa thu thập đủ trạng thái để nghiệm thu auth. Một lần selector account exact timeout; không được coi là lỗi Hasaki.

## Backlog ưu tiên và điều kiện đóng

1. **P0 — Runtime + bảo vệ dữ liệu:** không còn JS chunk 500; guest không nhận dữ liệu admin/orders/bookings riêng tư; 401/403 đúng. Không chỉ ẩn menu.
2. **P1 — Định tuyến và trạng thái thật:** slug lạ 404; bỏ fake success/fallback auth; checkout/booking/review xử lý API thất bại; xác nhận bằng test lỗi mạng và response lỗi.
3. **P1 — Database/nghiệp vụ:** PostgreSQL, thống nhất ERP/storefront, giá server, biến thể SKU, giao dịch giữ tồn, ownership. Restart vẫn giữ dữ liệu.
4. **P2 — Header → hero → danh mục → product → footer:** sửa từng template, tối đa năm vòng đối chiếu/template; ảnh cùng viewport và trạng thái, chốt asset trước tinh chỉnh khoảng cách.
5. **P2 — Màn hình con:** search/filter/sort/back/refresh, brand/campaign/deals, cart/checkout, clinic/booking và trang hỗ trợ. Mỗi nút ghi expected/actual/evidence/status.
6. **P3 — Sau đăng nhập:** dùng tài khoản được phép để khảo sát user nguồn; admin nội bộ chưa quan sát được thì thiết kế riêng, không tuyên bố giống nguồn. Nghiệm thu phân quyền và luồng dọc trước production.

## Giới hạn và tiến trình tiếp nối

Chưa click tất cả nút/toàn bộ URL, chưa xác minh màn hình sau đăng nhập Hasaki, chưa đo hiệu năng hay chạy build/test mới. Không tự restart server của người dùng. Báo cáo runtime chỉ mô tả bản đang chạy; mã hiện tại có thể mới hơn. Chưa sửa lỗi ứng dụng trong đợt này. Ưu tiên đợt tiếp theo là P0, sau đó kiểm tra luồng theo ma trận; không mở rộng thêm tính năng trước khi các đường đi hiện tại đáng tin cậy.
