# Quy tắc phát triển Hasaki Clone

Ngày: 14/11/2026. Trạng thái: định hướng và yêu cầu áp dụng cho các thay đổi tiếp theo; chưa phải bằng chứng nghiệm thu. Không tự ý viết lại toàn bộ dự án hoặc nâng cấp dependency theo tài liệu này.

## 1. Kiến trúc đích

Giữ Next.js App Router + React + TypeScript strict + Tailwind. Backend dùng Route Handlers/server functions trong cùng ứng dụng, tổ chức thành modular monolith. Chưa tách microservices hoặc thêm NestJS khi chưa có nhu cầu đo được.

- PostgreSQL là nguồn dữ liệu nghiệp vụ duy nhất; Prisma là ORM/migration đề xuất. Kiểm tra phiên bản tương thích với Node/Next hiện tại, pin phiên bản và đọc tài liệu chính thức trước khi cài.
- Luồng phụ thuộc: UI → API/server entry → domain service → repository → PostgreSQL. Entry xác thực và validate đầu vào; service xử lý nghiệp vụ; repository truy cập dữ liệu. Không gọi database từ client component.
- Gom theo domain catalog, identity, orders, inventory, bookings; chia module khi có trách nhiệm riêng, không tạo tầng trừu tượng chỉ để đủ số tầng.
- Server Components mặc định; Client Components chỉ cho tương tác cần thiết. DTO chỉ trả trường được phép hiển thị.
- Chọn thư viện auth được duy trì, tương thích phiên bản đang dùng; không tự phát minh mã hóa/session. Session được xác minh ở server, cookie HttpOnly/Secure/SameSite phù hợp. Không dùng role trong localStorage làm căn cứ cấp quyền.

## 2. Không hardcode dữ liệu nghiệp vụ

- Giá, sản phẩm, tồn kho, đơn, khách hàng, chi nhánh, lịch hẹn và khuyến mãi phải lấy từ database. Hợp nhất kho storefront và ERP; không duy trì hai nguồn đơn hàng độc lập.
- JSON scraped là nguồn nhập có provenance: URL, thời điểm, phạm vi và trạng thái xác minh. Không gọi snapshot là live; không trình bày đánh giá, số bán hoặc tồn kho sinh giả là dữ liệu thật.
- Fixtures/seed demo phải tách và chỉ bật ở môi trường phát triển/kiểm thử. Production thiếu database phải báo lỗi rõ ràng, không fallback sang dữ liệu hoặc đăng nhập giả.
- Bí mật và cấu hình môi trường qua biến môi trường, validate lúc khởi động, chỉ tài liệu hóa tên biến trong .env.example. Không gửi secret sang browser hoặc log.
- Constants nghiệp vụ ổn định, enums và design tokens được phép nằm trong code. Nội dung biên tập, giá và chính sách thay đổi thường xuyên phải có nguồn cấu hình/quản trị thống nhất.

## 3. Quyền truy cập

- Chưa có auth thật: các trang tài khoản/quản trị có thể phát triển bằng fixture nội bộ nhưng không được coi là đã nghiệm thu; môi trường public phải đóng truy cập nhạy cảm ở server.
- Guest: chỉ storefront và đăng nhập; truy cập /quan-tri hoặc /khach-hang/* phải được kiểm tra server và chuyển tới đăng nhập hoặc trang tạm chưa hỗ trợ. Không tải dữ liệu riêng rồi mới ẩn bằng CSS/useEffect.
- Customer: chỉ hồ sơ, địa chỉ, đơn và lịch hẹn thuộc chính mình. Kiểm tra ownership trong truy vấn; customer không truy cập API quản trị.
- Staff/admin: kiểm tra permission từng thao tác và phạm vi chi nhánh nếu có. Người đăng ký công khai không được tự chọn quyền nhân viên/admin.
- Mọi Route Handler, Server Action và đường truy cập dữ liệu nhạy cảm phải kiểm tra quyền; không chỉ bảo vệ menu/layout/proxy. API chưa đăng nhập trả 401, thiếu quyền trả 403 hoặc 404 phù hợp với chính sách tránh tiết lộ tài nguyên.
- MCP phải tuân thủ cùng auth/permission như API, đặc biệt tool thay đổi dữ liệu. Không để đường truy cập phụ bỏ qua service nghiệp vụ.
- Không fallback thành đăng nhập thành công khi API lỗi. Logout phải vô hiệu phiên phía server; chống CSRF phù hợp và giới hạn thử đăng nhập.

## 4. Tính đúng của giao dịch

- Server tra SKU, giá, khuyến mãi và phí giao hàng; không tin giá/tổng tiền/role do client gửi. Tiền VND dùng số nguyên có kiểm tra giới hạn.
- Đơn hàng, dòng hàng, giữ tồn và nhật ký phải nhất quán trong transaction; có ràng buộc không âm và chống tranh chấp tồn kho.
- Tạo đơn/thanh toán có idempotency; webhook kiểm chữ ký, xử lý retry và chống ghi nhận hai lần. Trạng thái chỉ chuyển theo quy tắc cho phép.
- Booking phải kiểm tra lịch trống/công suất trong database, không tự xác nhận lịch giả. Lưu thời gian chuẩn và hiển thị Asia/Ho_Chi_Minh.
- Migration có review, backup và kế hoạch phục hồi; không chạy migration phá dữ liệu production tự động.

## 5. Clean code và hiệu năng

- Dùng Codegraph trước khi đọc mã; chỉ đọc bổ sung những phần cần thiết. Giữ thay đổi Git có sẵn. Đọc hướng dẫn Next cài local trước sửa code liên quan framework.
- TypeScript strict, không any hoặc ép kiểu để che lỗi. Validate runtime ở biên API; dùng error code và thông báo nhất quán.
- Component tập trung hiển thị; tách logic nghiệp vụ khỏi JSX; không sao chép quy tắc giá/quyền giữa UI và API. Tránh refactor diện rộng không phục vụ task.
- Pagination có giới hạn, index theo truy vấn thực tế, tránh N+1; chọn trường cần thiết. Cache chỉ dữ liệu phù hợp, không cache dùng chung dữ liệu riêng của người dùng.
- Tối ưu ảnh/font, hạn chế client bundle và request dư thừa. Đo trước/sau bằng cùng route, dữ liệu và thiết bị; không tuyên bố nhanh hơn chỉ vì build thành công.

## 6. Kiểm chứng giống Hasaki

- Chưa được khẳng định giống hoàn toàn: tồn tại route hoặc HTTP 200 không chứng minh giao diện/tương tác đúng. Admin nội bộ Hasaki chưa quan sát được phải ghi là thiết kế riêng, không gắn nhãn clone đã xác minh.
- Mỗi template cần ma trận: URL nguồn/local, viewport, trạng thái đăng nhập, dữ liệu, nút/tương tác, kết quả mong đợi, kết quả thực tế, screenshot, ngày kiểm tra, blocker.
- Kiểm tra desktop/mobile cùng viewport và trạng thái; gồm loading, empty, error, success, back/refresh và bàn phím. Chỉ đánh dấu đạt những trạng thái đã quan sát.
- Mỗi nút phải có hành động, trạng thái xử lý, lỗi và kết quả kiểm chứng. Chức năng chưa có phải vô hiệu kèm giải thích hoặc ẩn phù hợp; không hiển thị thành công giả.
- Khi nguồn yêu cầu đăng nhập mà chưa có quyền truy cập, ghi blocked/unverified; không suy đoán giao diện sau đăng nhập. Chỉ kiểm thử tài khoản được phép và không tạo giao dịch thật ngoài phạm vi được giao.

## 7. Thứ tự triển khai và điều kiện hoàn thành

1. P0: đóng truy cập nhạy cảm công khai, loại bỏ bypass/fallback auth demo ở production; sửa báo cáo tiến độ quá mức dựa trên bằng chứng.
2. P1: PostgreSQL/schema/migrations, thống nhất repository storefront–ERP; auth/session server và ownership/RBAC. Kiểm tra dữ liệu còn sau restart và guest/customer/staff bị chặn đúng.
3. P2: hoàn thành một luồng dọc catalog → giỏ → tạo đơn → admin thấy đúng đơn → thay đổi trạng thái → user thấy kết quả. Test giao dịch tồn kho, dữ liệu giá bị sửa và gửi lặp.
4. P3: booking, thanh toán, vận chuyển và thông báo qua adapter tích hợp; nghiệm thu sandbox trước production. Không thông báo đã gửi email/SMS nếu chưa gửi.
5. P4: hoàn thiện từng template so với nguồn, tối đa năm vòng sửa/đối chiếu mỗi template rồi ghi blocker; tối ưu hiệu năng theo số đo.
6. P5: staging, CI, migration deployment, giám sát, backup/restore và rollback; mới mở production sau nghiệm thu.

Mỗi phần hoàn thành phải có phạm vi, bằng chứng, giới hạn và cập nhật handoff/gap report. Lint/typecheck/build cho thay đổi ứng dụng; test tập trung vào quyền, ownership, giao dịch và luồng chính. Không chạy lại build nặng khi chỉ sửa tài liệu. Không đổi mẫu dữ liệu thành kết quả kiểm thử thực tế.

## Nguồn tham khảo

- https://nextjs.org/docs/app/guides/authentication
- https://nextjs.org/docs/app/guides/backend-for-frontend
- https://www.prisma.io/docs/orm/fundamentals/transactions

Phiên bản và API cụ thể phải đối chiếu tài liệu của dependency được chọn khi triển khai.
