# Kiểm tra bản sửa riêng

Không build đè vào thư mục output của tiến trình đang phục vụ request. Việc đổi build trong khi server cũ giữ manifest có thể gây chunk không khớp; đây là một khả năng của lỗi trước đó, chưa xác định là nguyên nhân duy nhất.

PowerShell tại root dự án:

```powershell
$env:HASAKI_ISOLATED_BUILD = '1'
npm.cmd run build
```

Output nằm trong `build/verification` (đã được Git/ESLint bỏ qua). Không sửa hoặc xóa `.next` của tiến trình khác. Với standalone, copy `public` vào `build/verification/standalone/public` và `build/verification/static` vào `build/verification/standalone/build/verification/static` trước khi chạy server. Không để lồng thêm thư mục static/static khi copy lại.

```powershell
$env:PORT = '3035'
$env:HOSTNAME = '127.0.0.1'
node build/verification/standalone/server.js
```

Ở terminal khác:

```powershell
$env:HASAKI_TEST_URL = 'http://127.0.0.1:3035'
node scripts/verify-access-boundaries.mjs
```

Phải kiểm tra thêm các chunk được HTML tham chiếu trả 200, mở browser không có JS chunk lỗi, trang công khai còn dùng được và URL sai không chuyển sang sản phẩm khác. Đây không phải kiểm thử auth đăng nhập thật: backend chưa sẵn sàng phải từ chối truy cập riêng tư và ghi dữ liệu, không tự tạo session demo.

Sau khi dừng preview, xóa biến môi trường task trong terminal nếu muốn dùng cấu hình mặc định. Khi triển khai thật dùng artifact bất biến cho mỗi release và chuyển traffic sau health check; không build trực tiếp vào artifact đang được phục vụ.
