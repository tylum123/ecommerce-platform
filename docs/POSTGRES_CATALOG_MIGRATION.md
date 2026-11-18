# Catalog và kho trên Supabase PostgreSQL

## Checkpoint 17/11/2026 — runtime tùy chọn và nền tảng local

Đã thêm driver `pg` ở `src/lib/server/postgres-database.ts`, service nội bộ `postgres-catalog-service.ts` và adapter Supabase Storage `catalog-storage.ts`. Chưa kết nối hoặc ghi database/bucket cloud; chưa cấp quyền runtime, chưa thực hiện import/cutover. Mọi API quản trị vẫn phải qua auth hiện có; service/repository không tự cấp quyền.

- `NARI_CATALOG_BACKEND=postgres` bật đọc PostgreSQL tại server entries storefront (home/category/product/search/brand/cart/checkout/listings/sitemap). Các entry này force-dynamic, không đọc database khi prerender. Development mặc định SQLite; production bắt buộc chọn PostgreSQL. Giá trị thiếu/sai ở production hoặc chọn SQLite bị từ chối. Lỗi cấu hình/kết nối/schema không fallback; lỗi public được rút gọn `CATALOG_POSTGRES_UNAVAILABLE`.
- DTO PostgreSQL có `source: postgres`, là catalog authoritative: database rỗng trả danh sách rỗng; sản phẩm không có/ẩn không sống lại từ snapshot. Chi tiết runtime bỏ nhánh rich snapshot và escape nội dung biên tập thành text an toàn trước HTML rendering. Danh mục/thương hiệu điều hướng vẫn có metadata snapshot; campaign/ranking/new-arrival membership chưa migrate nên các listing này rỗng trong chế độ PostgreSQL. Không khẳng định mọi landing đã hoàn tất.
- `readLiveCatalog`/`writeLiveCatalog` đồng bộ cũ từ chối trong chế độ PostgreSQL. Vì vậy luồng admin/ERP SQLite cũ không được ghi chéo nguồn. Mutation catalog PostgreSQL có service riêng, nhưng chưa nối admin route; phải tiếp tục rewrite/kiểm quyền trước khi mở API ghi. Inventory/orders chưa cutover.
- URL `NARI_POSTGRES_URL` chỉ nhận postgres/postgresql có host/user/database, không nhận query string (bao gồm `sslmode`) để tránh override TLS của pg. `NARI_POSTGRES_SSL_MODE=verify-full` mặc định, TLS kiểm chứng certificate; custom CA qua `NARI_POSTGRES_CA`. `disable` chỉ cho loopback ngoài production. `NARI_POSTGRES_POOL_MAX` từ 1–20, mặc định 5; connection/statement/lock/idle-transaction timeout có giới hạn. Pool được dùng chung trong module; transaction pin một client, rollback/release và loại client khi rollback hỏng; CLI có close idempotent. Chưa kiểm pooler/serverless trên staging.
- Storage là factory nhận cấu hình server riêng và bucket public đã được duyệt; origin public phải trùng origin HTTPS của project. Upload giới hạn 6 MiB, kiểm signature PNG/JPEG/WebP và MIME, từ chối SVG, tạo key UUID mới và `upsert:false`; lỗi không trả URL giả hay lưu filesystem thay thế. Signature không phải giải mã ảnh đầy đủ. Chưa nối `/api/admin/upload`, chưa provision bucket/policy, chưa xác minh GET ảnh sau upload/restart. Object được upload thành công nhưng chưa gắn catalog cần quy trình đối soát orphan; không tự xóa object cloud.

Kiểm chứng local: `node --test test/postgres-foundation.test.cjs` đạt 5/5 (TLS/config, pool transaction/lifecycle, PG fail-closed không mở SQLite, Storage validation/error, authoritative empty/tombstone và HTML output escaped). `node scripts/verify-postgres-catalog.cjs ABSOLUTE_PGLITE_DIST_INDEX_JS` đạt trên PGlite cục bộ, gồm CRUD/album/banner, stale version, rollback, bigint precision, duplicate SKU và inventory âm/reserved vượt total. `node scripts/test-catalog-storage.cjs` đạt cả readback qua tiến trình mới cho SQLite. Đây không phải kiểm PostgreSQL TCP/Supabase thật hoặc browser nghiệm thu PG. Một lượt tsc sau wiring có lỗi thuộc `supabase-session.ts` được giao worker identity; root chạy kiểm tích hợp cuối sau freeze, không build song song dev.

Gates trước cutover thực tế: staging PostgreSQL riêng + role không owner/BYPASSRLS; grant/RLS và auth/CSRF theo API; backup/restore; import không quarantine còn sót; đối chiếu SKU/slug/ảnh/banner/provenance; test PG restart, transaction cạnh tranh và client TLS; admin mutations cùng nguồn PostgreSQL; Storage upload/readback/restart và đối soát orphan; hoàn thiện presentation/empty states, loại bỏ statistics/campaign fallback demo còn ở UI; desktop/mobile theo vai trò. Không dùng trạng thái factory/service hay PGlite để đánh dấu các gate này đạt.

Tham chiếu driver: [transactions](https://node-postgres.com/features/transactions), [pooling](https://node-postgres.com/features/pooling), [TLS connection strings](https://node-postgres.com/features/ssl); Storage: [standard uploads](https://supabase.com/docs/guides/storage/uploads/standard-uploads).

Ngày 16/11/2026. Trạng thái: bản thiết kế và DDL ứng viên, **chưa áp dụng, chưa kiểm thử trên PostgreSQL server hoặc Supabase**. Đã thử trong PGlite bộ nhớ; không kết nối, nhập hoặc thay đổi database hiện tại. Không phải schema nội bộ Hasaki đã xác minh.

## Phạm vi và căn cứ

`db/migrations/202611160001_catalog_inventory.sql` tạo schema riêng `nari_catalog`, không sửa bảng `public`, `auth`, `storage` hoặc schema SQL cũ. Có transaction, timeout và không dùng `IF NOT EXISTS` để tránh che giấu schema khác biệt. File không được đưa vào runner tự động.

Căn cứ đọc: `docs/ENGINEERING_RULES.md`, `src/lib/db/schema.sql`, phần DDL trong `src/lib/sqlite-db.ts`, `src/lib/live-catalog.ts`, `src/lib/server/live-catalog-store.ts`, hợp đồng `/api/admin/products` và `/api/admin/upload`.

Schema SQL cũ đã mô tả products/brands/categories/branches/inventory, nhưng thiếu album, nội dung chi tiết, banner, provenance, quan hệ SKU của kho và ràng buộc reserved≤total. Runtime đang dùng SQLite cùng JSON `system_settings.live_catalog_overrides`; SQL cũ chưa chứng minh runtime PostgreSQL.

## Các quyết định trong DDL

- Giữ ID dạng text để nhập lại ID hiện có; SKU và slug sản phẩm unique. Category/brand dùng FK, không giữ thêm tên rời dễ sai lệch.
- Giá VND `bigint`, giới hạn miền số nguyên an toàn JavaScript. Repository PostgreSQL phải đổi chuỗi bigint sang Number có kiểm tra; không gửi bigint thẳng vào JSON.
- Ảnh trong `product_images`, thứ tự 0 làm ảnh chính; tối đa 30 vị trí. Cột bucket/path chỉ lưu tham chiếu asset, không sửa `storage.objects` hay tạo bucket.
- Banner có placement hero/side và thứ tự. Tổng tối đa 40 banner cần validate trong transaction tại service; CHECK hiện chỉ giới hạn chỉ số từng nhóm.
- Nội dung HTML là đầu vào thô, **không tự an toàn khi render**. Cần sanitizer ở biên ghi/đọc hoặc render text an toàn trước mở public.
- `hidden_at` thay xóa cứng, phục vụ ẩn/khôi phục. Tombstone snapshot chưa có product phải được giải quyết trong staging/import, không bỏ mất.
- Kho tham chiếu product ID và branch ID, available là cột sinh từ total−reserved. Nhật ký có khóa idempotency; ràng buộc không tự thực hiện transaction cập nhật kho/ghi log.
- Snapshot rating/review/sold là trường `observed_*`, nullable; không đặt mặc định đánh giá hoặc lượt bán giả. Nguồn nhập có URL, thời điểm và phạm vi xác minh. Seed demo phải được gắn `is_demo` và nguồn demo.
- Bảng có RLS, không policy và không grant cho API roles. Schema không được thêm vào Exposed schemas. Runtime chưa có quyền truy cập cho đến migration phân quyền riêng. Table owner/BYPASSRLS không bị policy bảo vệ như người dùng thường; API vẫn phải xác thực/kiểm quyền và chi nhánh.

Supabase mô tả schema riêng chỉ vào Data API sau khi được expose và cấp quyền trong [Tables and data](https://supabase.com/docs/guides/database/tables), và yêu cầu kết hợp grants/RLS trong [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security). Thiết kế này dùng truy cập từ repository server, không mở database trực tiếp từ client.

## Mapping nhập dữ liệu, chưa thực thi

### Công cụ chuẩn bị import cục bộ

`scripts/prepare-catalog-import.mjs` mở đúng tệp SQLite đã tồn tại ở chế độ chỉ đọc, lấy snapshot trong transaction và không gọi hàm seed/khởi tạo của ứng dụng. Chạy bằng Node 24:

```powershell
node scripts/prepare-catalog-import.mjs 'C:\duong-dan-rieng\hasaki-store.db' 'C:\duong-dan-rieng\export-moi'
```

Thư mục đích phải chưa tồn tại. Kết quả gồm `source.json` (cả variants và audit logs nguồn để bảo toàn), `plan.json`, `manifest.json` với SHA-256 snapshot và số dòng. Mặc định không nhập dữ liệu `is_seed`; chỉ thêm `--include-demo` nếu chủ động muốn giữ fixture với nhãn demo. Không xuất artifact vào Git hoặc thư mục public. `source.json` có thể chứa thông tin nhân viên trong audit logs nên cần lưu riêng tư.

Công cụ chỉ sinh `import.sql` khi không có lỗi mapping; mã thoát 2 là có lỗi cần giải quyết. SQL yêu cầu schema đích đã được tạo bằng migration và dữ liệu đích trống; không upsert, xóa hoặc ghi đè nguồn. Không tự kết nối/chạy SQL trên PostgreSQL. Override chưa có dòng SQLite, FK không xác định, tombstone mồ côi và tồn kho sai đều chặn việc xuất SQL. Ratings/lượt bán cũ không được biến thành quan sát đã xác minh; nguồn import luôn ghi unverified. Ảnh mới chỉ là URL/path, file chưa được tải lên Storage; variants/audit logs chưa được nhập thành dữ liệu nghiệp vụ. Cần review provenance, cycle category, lịch sử thời gian ẩn và import staging trước áp dụng.

Nếu không có SQLite, `scripts/prepare-snapshot-catalog.mjs` chỉ tạo danh sách review từ bốn snapshot category-products/deals/bestsellers/brand-catalog ngày 13/11/2026:

```powershell
node scripts/prepare-snapshot-catalog.mjs docs/research/hasaki 'C:\duong-dan-rieng\snapshot-review-moi'
```

Mọi candidate được đánh dấu `is_demo=true`, `verification_state=unverified`, không gán thời gian chụp suy đoán. SKU thiếu, giá sai và duplicate slug khác nội dung vào quarantine; không tạo SKU hoặc giá thay thế. Công cụ luôn báo `readyForImport=false`, không sinh SQL, không tải ảnh hoặc ghi cloud. Lượt audit hiện tại: 300 candidate và 145 mục quarantine; đây không phải số sản phẩm đã xác minh hay sẵn sàng import. Cần giải quyết quan hệ brand/category, duplicate và provenance trước khi tạo dữ liệu nhập staging. Không coi các trường đánh giá/lượt bán/khuyến mãi trong raw là sự thật đã kiểm chứng.

| Nguồn hiện tại | Đích / quy tắc |
| --- | --- |
| SQLite branches/categories/brands | Giữ ID, chuyển boolean 0/1 và timestamp hợp lệ; đối chiếu slug/code trùng |
| SQLite products + JSON overrides | Join theo slug, SKU phải khớp; override thắng từng trường có mặt; không dùng fallback `value || default` cho số 0 |
| brand_name/category_slug chưa có FK | Đối chiếu và tạo danh mục có provenance sau review; không tự gán vào thương hiệu mặc định |
| image/thumbnail_url + images[] | Chuẩn hóa, khử trùng; ảnh chính vị trí 0, giữ thứ tự gallery |
| overviewHtml/ingredientsHtml/usageHtml/specs | Nhập nguyên văn vào staging; sanitize trước công bố |
| banners.heroSlides/sideBanners | placement hero/side, thứ tự theo array; giải quyết ID trùng giữa hai nhóm |
| deletedSlugs | Import đúng sản phẩm rồi đặt hidden_at; slug không có nguồn sản phẩm vào danh sách lỗi cần review |
| inventory_balances SKU | Join chính xác products.sku→product_id; không nhập SKU mồ côi hoặc variant vào parent tùy đoán |
| available_stock | Đối chiếu total−reserved; nếu khác, cách ly dòng, không ghi đè âm thầm |
| inventory_audit_logs | Giữ bản xuất gốc; chỉ nhập movement khi giải quyết được FK, actor và idempotency key; snapshot tổng kho không biến thành bán hàng |
| is_seed | Chuyển sang is_demo sau phân loại; không coi mọi dòng có is_seed=0 là dữ liệu merchant đã xác minh |

Một SKU hiện tại trong `product_variants` chưa đủ căn cứ thống nhất tồn parent/variant. Migration này **chưa tạo variants**, chưa chuyển orders/order_items, booking hoặc identity. Nếu có kho cho variant, dừng import các dòng đó và bổ sung mô hình sellable SKU riêng sau khi chốt nghiệp vụ; không cộng dồn vào parent.

## Quy trình áp dụng sau review

1. Chọn project Supabase staging tách production, kiểm phiên bản PostgreSQL≥15 và schema đích chưa tồn tại. Xác định database owner, role server riêng, giới hạn quyền và provider auth. Không dùng owner/service key trong browser.
2. Backup SQLite, JSON overrides và assets; xuất manifest hash, số dòng, SKU/slug trùng, FK mồ côi, tồn âm/reserved>total, nguồn demo và nguồn không rõ. Bản backup phải được thử khôi phục.
3. Review DDL này, thiết kế runtime-role và policies theo quyền/chi nhánh. Đã thử sơ bộ với PGlite trong bộ nhớ; cần chạy tiếp trên PostgreSQL staging dùng một lần.
4. Chỉ sau phê duyệt mới chạy migration bằng runner/version history đã thống nhất; không tự chạy từ Next startup. Import staging và báo lỗi trước khi ghi bảng chuẩn. Không đưa bản SQLite nguyên xi vào public Supabase.
5. Đối chiếu số dòng, tổng giá, số ảnh/banner, trạng thái ẩn, từng SKU/branch/stock, provenance và retry idempotency. Test transaction cạnh tranh cùng SKU; total/reserved/log phải nhất quán.
6. Test anon/customer/staff sai chi nhánh/admin; mọi đường API/MCP và database client phải chặn đúng. Kiểm RLS/grants thực tế từ non-owner, không chỉ SQL Editor chạy quyền owner.
7. Viết repository PostgreSQL, chuyển storefront và admin cùng nguồn trong một lần cutover có cửa sổ dừng ghi. Không duy trì dual-write SQLite/JSON/Postgres không có cơ chế đồng bộ và đối soát. Xác minh dữ liệu còn sau restart, rồi mới bật ghi.

Không có file down migration xóa bảng. Nếu DDL lỗi, transaction rollback; nếu chưa cutover, ngừng sử dụng schema mới và giữ nguyên nguồn cũ. Sau cutover đã có ghi mới, rollback cần backup đã thử restore và đối soát/replay ghi mới; không trỏ lại SQLite cũ rồi bỏ mất giao dịch. Không DROP schema hoặc dữ liệu production tự động.

## Kiểm chứng và giới hạn

Đã thử DDL trong PGlite 0.5.16 (PostgreSQL 18.6 WASM) hoàn toàn trong bộ nhớ, không kết nối Supabase: tạo thành công 10 bảng, cả 10 bật RLS; thử dữ liệu hợp lệ và ràng buộc giá, slug, tồn kho; các role anon/authenticated/service_role không có quyền dùng schema hay SELECT bảng. Dự án Supabase hiện dùng PostgreSQL 17.11, nên cần kiểm tra lại trên phiên bản đó. Đây là thử nghiệm cô lập, chưa thay thế PostgreSQL/Supabase thật, chưa kiểm thử owner/BYPASSRLS, cạnh tranh giao dịch, import, Storage hay các quyền runtime. DDL không tự ngăn vòng cây category dài, không đảm bảo sản phẩm có ít nhất một ảnh, không cưỡng chế immutable SKU, không auto-update updated_at, không sanitize HTML, không bảo đảm nhật ký append-only khi owner ghi. Những điều này cần domain service/role grants và kiểm thử trước nghiệm thu.
