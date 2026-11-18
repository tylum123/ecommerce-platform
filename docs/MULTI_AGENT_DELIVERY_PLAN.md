# Kế hoạch thực thi nhiều agent — Nari Home

Ngày bắt đầu: 17/11/2026. Đây là kế hoạch và nhật ký nghiệm thu có giới hạn; không phải xác nhận hệ thống đã sẵn sàng production. Các checkpoint mới trong `SESSION_HANDOFF.md`, `clone-gap-report.md` và `PROGRESS.md` thay thế kết luận cũ khi mâu thuẫn.

## Quy trình áp dụng từ nay — cập nhật theo yêu cầu người dùng

Quy trình chính thức nằm trong `AGENTS.md`: kế hoạch ngắn → chỉ huy duyệt phạm vi/kiến trúc → một worker thực thi → kiểm chứng liên quan → báo cáo và bàn giao. Tối đa **một worker thực thi** đồng thời. Dùng model nhẹ cho tài liệu, `gpt-6.1-sol` medium cho code thường quy; `gpt-6-astra` chỉ duyệt các mốc quan trọng, không viết application code và kết thúc ngay sau review. Các bảng phân công nhiều worker/high bên dưới là lịch sử đợt trước, không phải mặc định tiếp tục.

Task tiếp nối: luồng quản trị sản phẩm PostgreSQL/Storage trên staging. Chỉ huy đã duyệt gate catalog riêng; không mở lại auth chung hoặc ERP/orders legacy. Worker `catalog_e2e` (`gpt-6.1-sol`, medium) sở hữu phần auth catalog/API/UI liên quan và `docs/CATALOG_STAGING_PLAN.md`. Root giữ baseline, kiểm chứng tích hợp và bàn giao. Cloud acceptance cần kết nối Supabase và xác định staging tách production; không thay thế bằng kết quả mocks/PGlite.

## 1. Phân công và quyền sở hữu

| Vai trò | Model theo phân công phiên | Trách nhiệm | Phạm vi ghi |
| --- | --- | --- | --- |
| Root | Điều phối phiên và kiểm chứng tích hợp | Giao tiếp người dùng, giữ baseline, kiểm tra lint/typecheck/build/browser, nghiệm thu cuối | Không sửa mã ứng dụng |
| Commander | `gpt-6-astra`, reasoning `xhigh` | Chốt kiến trúc, phụ thuộc, rủi ro, review, điều phối workers | Tài liệu này; checkpoint `docs/SESSION_HANDOFF.md`, `docs/clone-gap-report.md`, `PROGRESS.md` |
| Identity | `gpt-6.1-sol`, reasoning `high` | Supabase session, cấu hình, input/origin/rate limit/cookie; kiểm thử boundary | Mã identity/session/login, identity SQL và tài liệu; sở hữu `package.json`, lockfile, tên cấu hình `.env.example` trong wave đầu |
| Catalog | `gpt-6.1-sol`, reasoning `high` | PostgreSQL pool/repository staging, schema constraints, Storage adapter và kiểm chứng dữ liệu | Mã catalog/database/storage, migration tương ứng, harness và tài liệu migration |

Tối đa bốn agent cùng hoạt động. Workers không sửa cùng file đồng thời; thay đổi package hoặc biến môi trường đi qua owner Identity. Tái sử dụng worker đã hoàn thành cho wave tiếp theo. Commander không viết mã ứng dụng.

## 2. Baseline và quyết định kiến trúc

- Giữ nguyên toàn bộ thay đổi Git tồn tại từ trước; không reset, checkout hay clean toàn cây. Dùng CodeGraph trước khi đọc mã; phiên này kết quả trả current on-disk source, không có stale banner. Nếu công cụ báo stale thì chỉ đọc bổ sung file bị ảnh hưởng.
- `authorizeRequest` và `verifySignedSessionToken` đang đóng truy cập; không coi việc có session Supabase là đủ để mở API nghiệp vụ. Orders/ERP cũ chưa có ownership và transaction đầy đủ.
- SQLite là runtime đầu phiên; PostgreSQL adapter trước phiên này chưa được nối runtime. Wave B được mở rộng sau review để có public runtime PostgreSQL thực sự: mọi server entry liên quan chuyển async cùng repository; đường SQLite đồng bộ từ legacy phải từ chối khi chọn PostgreSQL. Không tạo hai nguồn ghi hoặc chỉ đổi một nửa storefront.
- Root kiểm tra không có file `.env`, `.env.local`, `.env.development`, `.env.production`, không có biến tên Supabase/PostgreSQL/database/origin/catalog trong process. Không đọc hay xuất giá trị bí mật. Do đó live provider, database, Storage và E2E có tài khoản là điều kiện ngoài repo còn thiếu.
- Tài liệu Next đang cài là `.md`, gồm `node_modules/next/dist/docs/01-app/02-guides/authentication.md`, `01-app/03-api-reference/04-functions/cookies.md` và `01-app/03-api-reference/03-file-conventions/proxy.md`. Worker đọc phần liên quan trước sửa framework.
- PostgreSQL là đích duy nhất cho dữ liệu nghiệp vụ theo `ENGINEERING_RULES.md`. Snapshot chỉ là nguồn nhập có nguồn gốc; không biến giá, đánh giá, lượt bán hay tồn kho mẫu thành dữ liệu đã xác minh.

## 3. Waves và phụ thuộc

| Wave | Ưu tiên / owner | Kết quả cụ thể | Phụ thuộc / điều kiện không được bỏ qua |
| --- | --- | --- | --- |
| A | P0/P1 — Identity | Khai báo dependencies đã pin; provider session có gate cấu hình, strict Origin, input cap, limiter có giới hạn, cookie lifecycle; login được nối khi gate hợp lệ; test lỗi và từ chối | Global business authorization vẫn đóng; `/api/session` báo `businessAccess: false`; production bị chặn nếu chưa có shared limiter và nghiệm thu provider |
| B | P1 — Catalog, song song A | Server-only PostgreSQL pool/transaction adapter; public runtime chọn backend rõ; tất cả server entry await cùng nguồn; schema constraints; Storage adapter; tests local; quy trình nhập/rollback | PG rỗng phải hiển thị rỗng, không hồi sinh snapshot; đường SQLite legacy phải reject khi PG; admin mutations vẫn đóng; không cloud mutation; bucket chưa provision là blocker thật |
| C | P2 — Identity sau A | Nền orders/inventory theo transaction: server lookup SKU/giá, idempotency, không âm tồn, rollback, ownership/branch; giữ route đóng khi chưa có runtime hợp nhất | A+B được review; độc lập fixture/PGlite phải ghi đúng phạm vi; chưa chấp nhận đơn thật |
| D | P2/P4 — Catalog sau B | Campaign/tag slug không biết trả 404; tag/campaign nhận runtime catalog thay snapshot tự thân; sửa CI đúng branch/tests sau xác minh config | Browser trước thay đổi UI; giữ membership có nguồn; template tối đa năm vòng; không mở booking/feedback/payment chỉ vì đã có session |
| E | Nghiệm thu tích hợp — Root + Commander | Lint/typecheck/test tập trung; build output cô lập; browser guest/login/unavailable và probes riêng tư; checkpoint có evidence | Build không đè `.next` đang dùng; không dừng server của người dùng; chỉ ghi pass sau quan sát kết quả |
| F | Cutover staging / ngoài repo | Cấu hình provider và database staging, provision roles/bucket, migrate/import được duyệt, backup/restore, E2E theo vai trò | Cần môi trường và tài khoản được cấp; không thay production hoặc tuyên bố xong bằng mocks |

Wave C/D chỉ chốt phạm vi sau khi A/B có kết quả; không mở rộng làm giảm tính đúng của P0/P1. Booking, thanh toán, vận chuyển, feedback và thao tác nhân viên chỉ được mở từng domain khi service, ownership và dữ liệu thật đã nghiệm thu.

## 4. Acceptance gates

### Identity

- Guest, cookie giả, role trong client và tài khoản không provision không có quyền nghiệp vụ.
- Principal đến từ `auth.getUser()` và role server-owned; không tin `getSession()` hay metadata do người dùng sửa.
- Login/logout khác Origin hoặc thiếu Origin bị từ chối trước provider và body nghiệp vụ; cấu hình sai trả unavailable. Input có giới hạn; lỗi không rò mật khẩu/token/provider raw payload.
- Limiter có TTL, giới hạn số key và nhánh overflow fail-closed; không tin `X-Forwarded-For` chưa xác thực. Process-local limiter không được coi là distributed protection.
- Cookie set/delete và response `private, no-store` được kiểm thử; production gate không gọi provider khi chưa sẵn sàng. Test cookie giả không thay thế kiểm tra phiên thật.

### Database và Storage

- PostgreSQL transaction dùng cùng connection, commit/rollback/release đúng cả khi lỗi; pool có giới hạn và timeout, không ghi connection string vào log.
- Giá/stock có constraints; duplicate SKU và vi phạm tồn kho thất bại đúng; rollback không để state nửa chừng.
- Mọi đường runtime phải dùng cùng repository trước cutover. Không có âm thầm chuyển sang SQLite/JSON khi PostgreSQL lỗi.
- PostgreSQL public projection không lấy lại sản phẩm snapshot khi database rỗng hoặc sản phẩm bị ẩn. Các fallback ở component cũng phải nhận cùng trạng thái; HTML mô tả/thành phần/hướng dẫn phải được làm sạch bằng allowlist đáng tin hoặc render text được escape trước công bố.
- Storage xác thực kích thước, MIME và chữ ký tệp; chỉ định bucket và key mới không ghi đè; thiếu config/remote lỗi không trả URL giả hay data URL fallback.
- PGlite chỉ xác minh SQL/logic ở môi trường cục bộ. PostgreSQL server, TLS, grants/RLS, network, durability và restore phải nghiệm thu staging riêng.

### Nghiệp vụ và storefront

- Orders luôn tra SKU, giá, khuyến mãi/phí từ server; idempotency không tạo đơn hoặc giữ tồn hai lần; ownership/branch nằm ở truy vấn.
- Một chỉnh sửa sản phẩm phải được quan sát sau refresh/restart tại API, chi tiết, danh mục, tìm kiếm, thương hiệu, deals/hàng mới và giỏ/checkout ở phạm vi hỗ trợ; không dùng test helpers để suy ra đã đạt browser E2E.
- Admin là vai trò cao nhất trong policy; từng endpoint vẫn phải enforce. Staff chỉ thấy và thực hiện phạm vi được cấp; ẩn UI không thay cho authorization.
- Slug không tồn tại trả 404; action chưa có backend không báo thành công.

## 5. Rollback và dừng an toàn

1. Nếu identity integration lỗi, tắt gate identity; giữ business APIs fail-closed và legacy token verification disabled. Không sửa policy để bỏ qua lỗi provider.
2. Nếu PostgreSQL/Storage harness lỗi, dừng cutover và giữ runtime hiện có. Sau cutover sau này, rollback phải theo snapshot/backup và phiên bản migration đã nghiệm thu; không tự chuyển nguồn ghi sang SQLite.
3. Chỉ hoàn tác hunk của phiên này theo manifest owner và diff đã review; không dùng `git reset --hard`, `git clean` hay restore file có thay đổi có sẵn.
4. Dừng write/import ngay khi provenance hoặc mapping SKU chưa rõ; giữ quarantine, báo dòng lỗi và cách sửa. Không thử lại cloud mutation tự động.
5. Build dùng output cô lập. Chỉ đóng process do phiên này tạo; không kill process do người dùng sở hữu.

## 6. Nhật ký evidence

### Checkpoint 17/11/2026 — kiểm tra cục bộ đạt, nghiệm thu cloud pending

- **Chi phí và điều phối:** tối đa 1 worker hoạt động cùng lúc. Dùng model nhẹ cho tài liệu và tác vụ có phạm vi hẹp; dùng `gpt-6.1-sol` mức `medium` cho code thường quy. Chỉ gọi `gpt-6-astra` để review một mốc quan trọng khi cần; không để chạy nền liên tục. Dùng CodeGraph truy vấn đúng thành phần trước khi đọc mã, không đọc toàn bộ codebase. Commander không viết application code.
- Commander Astra đã được dừng. Identity và Catalog đã freeze Wave A/B; không có worker đang triển khai Wave C/D. Giữ nguyên trạng thái và diff hiện có.
- **Identity (worker report; Root kiểm tra tích hợp cục bộ):** worker báo 15/15 focused auth/order tests pass; dependencies pin `@supabase/ssr` 0.12.7, `@supabase/supabase-js` 2.119.0, `@types/pg` 8.23.1. Worker bỏ một production check TypeScript trùng; Root sau đó chạy typecheck pass. `/api/session` chỉ local qua `NARI_AUTH_ENABLED`; production trả 503; `businessAccess: false`; SQL provider roles mới được chuẩn bị, chưa áp dụng.
- **Catalog (worker report, chưa phải nghiệm thu tích hợp):** PostgreSQL pool/transaction, Storage adapter và async authoritative public catalog source `source: 'postgres'`; mặc định dev dùng SQLite, production yêu cầu PostgreSQL; lỗi hoặc rỗng không fallback sang snapshot. Membership deals/bestseller/new-arrivals hiện rỗng chờ migrate; admin mutations vẫn đóng. Worker báo foundation tests 4 pass và PGlite pass.
- **Root integration:** `node --test` trên 10 file: 36/36 pass; `npm run typecheck` pass; `npm run lint` exit 0, 0 errors và 1 warning cũ (`campaigns-location.ts`, unused `brandText`). Isolated production build pass, exit 0, 369/369 pages. Lint/build có cảnh báo middleware deprecated và external lockfile; chưa xử lý. Lần build sandbox đầu không fetch được Google Fonts; retry được duyệt có network pass. Chưa có browser cuối sau freeze; baseline trước đó trên dev cô lập 3035: home desktop/mobile không overflow, login unavailable, console chỉ auth 401. HTTP private endpoints đều denied; unknown tag vẫn trả 200 (lỗi chưa sửa vì Wave D đã hủy). Chưa tuyên bố backlog hoàn tất.
- **Blockers ngoài repo:** không có `.env`/cấu hình Supabase hoặc PostgreSQL trong process; chưa có credential, cloud mutation, migration hoặc xác minh PostgreSQL server thật. Staging/provider, roles và Storage bucket chưa được nghiệm thu.

| Mục | Trạng thái 17/11/2026 | Evidence / giới hạn |
| --- | --- | --- |
| Identity Wave A | Worker freeze; integration pending | 15/15 focused tests theo worker; TypeScript chưa rerun; provider roles SQL chưa áp dụng |
| Catalog Wave B | Worker freeze; integration pending | Worker báo foundation 5 pass, PGlite và SQLite storage readback pass; không có live PostgreSQL/Storage |
| Wave C orders/inventory | Chưa làm | Vẫn đóng; cần transaction, ownership và server pricing |
| Wave D unknown route/CI | Chưa làm | Unknown tag 200 đã tái hiện, chưa sửa |
| Root final checks | Build/type checks đạt | 36/36 tests, typecheck, lint và isolated build 369/369 pages pass; lint có 1 warning cũ; browser sau freeze chưa chạy |
| Staging/cutover | Bị chặn bởi cấu hình ngoài repo | Chưa có credentials, database/Storage provisioning hoặc cloud migration |

Các con số kiểm thử từ phiên trước là baseline lịch sử, chưa phải xác minh phiên này. Root ghi kết quả tích hợp sau khi workers dừng sửa; Commander cập nhật checkpoint kết quả và phần chưa xác minh. Không thêm secret hoặc thông tin tài khoản vào evidence.

| Mục | Trạng thái tại lúc lập kế hoạch | Evidence / giới hạn |
| --- | --- | --- |
| Kiến trúc và blast radius auth | Đã kiểm tra bằng CodeGraph | `authorizeRequest` phục vụ products/upload; legacy admin routes vẫn qua verifier đóng |
| Config cloud/provider | Thiếu trong môi trường cục bộ | Root kiểm tra tên file/biến; không đọc giá trị secret |
| Auth/provider runtime | Đang làm | Chờ worker Identity và integrated tests |
| PostgreSQL/Storage runtime | Đang nối public runtime có gate | Chờ worker Catalog; không chạy cloud mutation; Storage chưa bật upload thật |
| HTTP guest baseline | Đạt theo root trên dev cô lập 3035 | Chín private API 401, hai private page redirect, ba mutation bị chặn; home/products 200; unknown product/category/brand 404 |
| Unknown tag baseline | Lỗi tái hiện | `/tag/unknown-verification` trả 200 thay 404; giao Wave D sửa |
| Browser login baseline | Đã quan sát trạng thái unavailable | `/api/auth` 401 trong console là boundary dự kiến; không thấy JS crash; chưa kiểm tra provider login |
| Build/live CRUD | Chưa kiểm tra phiên này | Root sẽ chạy sau khi wave ổn định |

