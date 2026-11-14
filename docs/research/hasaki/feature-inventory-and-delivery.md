# Inventory tính năng và phương án triển khai Hasaki

Ghi nhận ngày 13/11/2026. Mục tiêu là clone frontend và chuẩn bị kết nối backend sau; tài liệu này không coi dữ liệu mẫu hay hành vi mô phỏng là dịch vụ thật. Các subagent khảo sát song song qua nội dung nguồn và tài liệu hỗ trợ; do xung đột phiên Playwright, phần do subagent thu thập chưa được xác minh click/mobile. Những tương tác đã kiểm tra trực tiếp được ghi riêng trong `docs/clone-gap-report.md`.

## Inventory theo luồng

| Khu vực | Các trạng thái/chức năng cần có | Nguồn và trạng thái hiện tại |
|---|---|---|
| Header/trang chủ | Tìm kiếm, danh mục, thương hiệu, deals, hàng mới, bán chạy, Clinic, tài khoản, vị trí, hỗ trợ, giỏ; các banner, tab, liên kết và carousel | [Trang chủ](https://hasaki.vn/). Đã có một phần local; tài khoản/vị trí là placeholder, nhiều trang còn mở nguồn. |
| Danh mục/tìm kiếm | Breadcrumb, cây danh mục, khoảng giá, thương hiệu, facets theo loại hàng, sắp xếp, số lượng mỗi trang, phân trang, thẻ và điều hướng chi tiết | [Nước hoa](https://hasaki.vn/danh-muc/nuoc-hoa-c103.html), [thời trang](https://hasaki.vn/danh-muc/thoi-trang-c2351.html), [ví dụ query lọc](https://hasaki.vn/danh-muc/dau-xit-duong-toc-c102.html?filter_origin=209). Dữ liệu và filter local hiện rất hạn chế. |
| Thương hiệu | Danh sách, chữ cái, giới thiệu, tab sản phẩm/deals, tìm trong thương hiệu, lọc và sắp xếp | [Danh sách](https://hasaki.vn/thuong-hieu), [ví dụ](https://hasaki.vn/thuong-hieu/viet-nu.html). Local có mẫu nhưng nhiều thương hiệu chưa có sản phẩm. |
| Sản phẩm | Ảnh và biến thể, giá, số lượng, giỏ/mua ngay, mô tả, thông số, hướng dẫn, đánh giá, hỏi đáp, thông tin giao hàng và hàng liên quan | [Ví dụ Cocoon](https://hasaki.vn/san-pham/bo-goi-xa-cocoon-dau-goi-bo-ket-sach-gau-500ml-dau-xa-buoi-cung-cap-duong-chat-310ml-322057.html). Bản local có chi tiết cơ bản và thông số 28/40 sản phẩm mới; nhiều nội dung chưa có. |
| Giỏ và checkout | Thêm/xóa/đổi số lượng, tiếp tục mua, thông tin nhận hàng, địa chỉ, giao hàng, phương thức thanh toán, xác nhận và theo dõi đơn | [Hướng dẫn đặt hàng](https://hotro.hasaki.vn/huong-dan-dat-hang.html), [giao 2H](https://hotro.hasaki.vn/huong-dan-dat-hang-2h.html). Local chỉ mô phỏng và không tạo đơn thực. |
| Tài khoản | Đăng nhập/đăng ký, Google, quên mật khẩu, OTP, thông tin người dùng và địa chỉ | [Tài khoản](https://hotro.hasaki.vn/tai-khoan.html), [OTP](https://hotro.hasaki.vn/cau-hoi-thuong-gap-ve-ma-xac-thuc-otp.html). Local có modal thử nghiệm; chưa có xác thực/backend, OAuth, captcha hoặc OTP. |
| Clinic/booking/cửa hàng | Trang dịch vụ; đặt lịch theo SĐT, chi nhánh, dịch vụ, ngày giờ; tìm cửa hàng theo khu vực, loại và bản đồ | [Booking](https://hasaki.vn/booking), [hệ thống cửa hàng](https://hotro.hasaki.vn/he-thong-cua-hang.html). Có danh mục và 42 trang chi tiết dịch vụ snapshot, form local thử nghiệm và 19 chi nhánh snapshot; chưa có khả dụng thực hoặc gửi lịch. |

Đây là inventory khởi đầu, chưa phải danh sách đầy đủ của toàn bộ URL hoặc mọi trạng thái. Không sử dụng dữ liệu cửa hàng, giá, ưu đãi và tồn kho cũ như dữ liệu thời gian thực.

## Phương án và thứ tự làm nhanh

1. **Ưu tiên: hoàn thiện frontend theo luồng dọc, dùng adapter dữ liệu.** Chuẩn hóa kiểu sản phẩm, danh mục, giá, giỏ và API contract; giữ adapter snapshot để làm giao diện ngay. Phân công độc lập theo template sau khi thống nhất component chung: catalog/search, product, cart/checkout, clinic/booking. Tích hợp từng luồng và đối chiếu browser; không chờ toàn bộ backend. Đây là đường nhanh nhất để tiến gần mục tiêu frontend hiện tại và giảm sửa lại khi kết nối backend.
2. **Backend thương mại có sẵn:** đánh giá một nền tảng commerce hỗ trợ catalog, giỏ, đơn, tồn kho và quản trị; viết adapter nối Next.js vào API. Có thể giảm lượng code tự viết nhưng cần khảo sát khả năng triển khai, chi phí, tích hợp vận chuyển/thanh toán Việt Nam và mức tùy biến trước khi chọn sản phẩm cụ thể.
3. **Backend tự xây:** Next.js Route Handlers hoặc service riêng, database quan hệ, xác thực, catalog, tồn kho, giỏ, đơn, tích hợp thanh toán và vận chuyển. Linh hoạt nhất nhưng phạm vi kiểm thử và vận hành lớn nhất; nên tách làm giai đoạn sau khi contracts ổn định.

Trong cả ba phương án: giữ giá snapshot và trạng thái demo có nhãn; không nhận thanh toán hay tạo đơn thật cho đến khi có backend, nhà cung cấp và kiểm thử end-to-end. Lần lượt kiểm tra các luồng chính, cả desktop/mobile, route lạ, trạng thái rỗng/lỗi, bàn phím và bảo toàn các thay đổi hiện có. Không có đủ dữ liệu để cam kết thời gian hoàn thành.

## CodeGraph

Đã cài `@colbymchenry/codegraph` 1.6.2 cục bộ, chạy `init --yes` và đăng ký MCP Codex dùng package tại dự án, `CODEGRAPH_TELEMETRY=0`. Index ban đầu: 88 tệp, 223 nodes, 455 edges; đã truy vấn được `NewProductView`, `CartView` và `addToCart`, bao gồm tệp chưa commit. Dùng `node node_modules/@colbymchenry/codegraph/npm-shim.js status --json`, `query <symbol>`, `sync` để kiểm tra/cập nhật. MCP hỗ trợ phân tích code; không tạo backend. Tài liệu: [cài đặt](https://colbymchenry.github.io/codegraph/getting-started/installation/), [CLI](https://colbymchenry.github.io/codegraph/reference/cli/).
