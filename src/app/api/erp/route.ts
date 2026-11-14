import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  extractSessionTokenFromCookieHeader,
  verifySignedSessionToken,
  isStaffOrAdminRole,
} from "@/lib/auth";
import {
  isSeedActive,
  toggleSeedData,
  purgeSeedData,
  createProduct,
  createBranch,
  adjustInventoryStock,
  getBranches,
  getProducts,
  listOrders,
} from "@/lib/db/repository";
import { getSqliteDb } from "@/lib/sqlite-db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get("cookie");
    const token = extractSessionTokenFromCookieHeader(cookieHeader);
    const session = token ? await verifySignedSessionToken(token) : null;

    if (!session || !isStaffOrAdminRole(session.role)) {
      return NextResponse.json(
        { success: false, error: "Yêu cầu quyền Quản trị viên hoặc Nhân viên để truy cập ERP" },
        { status: 401 }
      );
    }

    const branches = await getBranches(false);
    const products = await getProducts({ limit: 10 });
    const orders = await listOrders({ limit: 10 });
    const seedActive = isSeedActive();

    return NextResponse.json({
      success: true,
      erp: {
        session: {
          user: session.fullName,
          role: session.role,
          roleLabel: session.roleLabel,
          branchId: session.branchId,
        },
        seedDataEnabled: seedActive,
        branchesCount: branches.length,
        totalProducts: products.total,
        totalOrders: orders.total,
        branches,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Lỗi kiểm tra ERP" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get("cookie");
    const token = extractSessionTokenFromCookieHeader(cookieHeader);
    const session = token ? await verifySignedSessionToken(token) : null;

    if (!session || !isStaffOrAdminRole(session.role)) {
      return NextResponse.json(
        { success: false, error: "Yêu cầu quyền Quản trị viên hoặc Nhân viên để thực hiện thao tác ERP" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const action = url.searchParams.get("action") || body.action;

    // 1. ACTION: TOGGLE SEED DATA
    if (action === "toggle_seed_data") {
      const currentState = isSeedActive();
      const newState = typeof body.enabled === "boolean" ? body.enabled : !currentState;
      toggleSeedData(newState);
      return NextResponse.json({
        success: true,
        seedDataEnabled: newState,
        message: newState
          ? "Đã BẬT hiển thị dữ liệu mẫu Nari Home."
          : "Đã TẮT hiển thị dữ liệu mẫu Nari Home. Hệ thống hiện chỉ hiển thị các sản phẩm, chi nhánh và dịch vụ độc quyền do bạn nhập.",
      });
    }

    // 2. ACTION: CLEAR SEED DATA (Permanently wipe Nari Home sample catalog)
    if (action === "clear_seed_data") {
      const result = purgeSeedData();
      return NextResponse.json({
        success: true,
        message: "Đã xóa toàn bộ dữ liệu mẫu Nari Home khỏi cơ sở dữ liệu. Toàn bộ sản phẩm và dịch vụ hiện tại là dữ liệu độc quyền của bạn.",
        purged: result,
      });
    }

    // 3. ACTION: CREATE CUSTOM PRODUCT
    if (action === "create_product") {
      const sku = (body.sku || "").trim();
      const name = (body.name || "").trim();
      const price = Number(body.price);

      if (!sku || !name || isNaN(price) || price < 0) {
        return NextResponse.json(
          { success: false, error: "Vui lòng nhập SKU, tên sản phẩm và giá bán hợp lệ" },
          { status: 400 }
        );
      }

      const product = await createProduct({
        sku,
        name,
        price,
        marketPrice: body.marketPrice ? Number(body.marketPrice) : undefined,
        brandName: body.brandName,
        categorySlug: body.categorySlug,
        description: body.description,
        thumbnailUrl: body.thumbnailUrl,
        initialStock: body.initialStock ? Number(body.initialStock) : 50,
        branchId: body.branchId,
      });

      return NextResponse.json({
        success: true,
        message: "Tạo sản phẩm thương hiệu riêng thành công!",
        product,
      });
    }

    // 4. ACTION: CREATE CUSTOM BRANCH
    if (action === "create_branch") {
      const code = (body.code || "").trim();
      const name = (body.name || "").trim();
      const address = (body.address || "").trim();
      const city = (body.city || "").trim();
      const district = (body.district || "").trim();
      const phone = (body.phone || "").trim();

      if (!code || !name || !address || !city) {
        return NextResponse.json(
          { success: false, error: "Vui lòng cung cấp mã chi nhánh, tên, địa chỉ và thành phố" },
          { status: 400 }
        );
      }

      const branch = await createBranch({
        code,
        name,
        address,
        city,
        district,
        phone: phone || "1800 6324",
        supportsNowFree2H: body.supportsNowFree2H !== false,
        supportsClinic: Boolean(body.supportsClinic),
      });

      return NextResponse.json({
        success: true,
        message: "Tạo chi nhánh cửa hàng mới thành công!",
        branch,
      });
    }

    // 5. ACTION: CREATE CUSTOM CLINIC SERVICE
    if (action === "create_service") {
      const name = (body.name || "").trim();
      const price = Number(body.price);
      const category = (body.category || "Chăm sóc da").trim();

      if (!name || isNaN(price) || price < 0) {
        return NextResponse.json(
          { success: false, error: "Vui lòng nhập tên dịch vụ và giá liệu trình" },
          { status: 400 }
        );
      }

      const db = getSqliteDb();
      const id = `srv-${Date.now().toString(36)}`;
      const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}.html`;
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO services (id, slug, name, category, price, market_price, duration_minutes, description, steps_count, is_seed, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `).run(
        id,
        slug,
        name,
        category,
        price,
        body.marketPrice ? Number(body.marketPrice) : price,
        body.durationMinutes ? Number(body.durationMinutes) : 60,
        body.description || `Dịch vụ ${name} chuẩn chuyên khoa`,
        body.stepsCount ? Number(body.stepsCount) : 7,
        now
      );

      return NextResponse.json({
        success: true,
        message: "Tạo dịch vụ Clinic & Spa riêng thành công!",
        service: { id, slug, name, category, price },
      });
    }

    // 6. ACTION: ADJUST INVENTORY STOCK
    if (action === "adjust_stock") {
      const branchId = (body.branchId || "CN1").trim();
      const sku = (body.sku || "").trim();
      const delta = Number(body.delta);
      const reason = (body.reason || "Kiểm kê kho từ Admin ERP").trim();

      if (!sku || isNaN(delta)) {
        return NextResponse.json(
          { success: false, error: "Vui lòng cung cấp mã SKU và số lượng điều chỉnh delta" },
          { status: 400 }
        );
      }

      const result = await adjustInventoryStock({
        branchId,
        sku,
        delta,
        reason,
        staffCode: session.id,
      });

      return NextResponse.json({
        success: true,
        message: `Đã điều chỉnh tồn kho SKU ${sku} thành công`,
        ...result,
      });
    }

    return NextResponse.json({ success: false, error: `Hành động ERP không hợp lệ: ${action}` }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Lỗi xử lý thao tác ERP" },
      { status: 500 }
    );
  }
}
