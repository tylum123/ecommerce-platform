import "server-only";
import { randomUUID } from "node:crypto";
import type { AuthRole } from "@/lib/auth";
import {
  ORDER_STATUS_LABELS,
  STAFF_DEPARTMENTS,
  STAFF_ROLE_LABELS,
  type BranchStock,
  type ErpBranchSummary,
  type ErpDashboardKpis,
  type ErpOrderItem,
  type ErpOrderRecord,
  type ErpOrderStatus,
  type InventoryAuditLog,
  type InventoryRecord,
  type PaymentStatus,
  type StaffRecord,
  type StaffRole,
  type UserRecord,
  type UserTier,
  type WarehouseStatus,
} from "@/lib/erp-types";
import { getRolePermissions } from "@/lib/server/access-policy";
import type { CatalogSqlDatabase } from "@/lib/server/postgres-catalog-repository";
import {
  OrderInputError,
  transitionPostgresOrderStatus,
  type OrderStatus,
} from "@/lib/server/postgres-order-service";

export type ErpServiceErrorStatus = 400 | 403 | 404 | 409 | 501;

/** Domain or authorization error thrown by PostgreSQL ERP operations. */
export class ErpServiceError extends Error {
  readonly status: ErpServiceErrorStatus;
  readonly code: string;

  constructor(code: string, status: ErpServiceErrorStatus, message?: string) {
    super(message || code);
    this.name = "ErpServiceError";
    this.code = code;
    this.status = status;
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PHONE_REGEX = /^0\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_TIERS = new Set<UserTier>(["Member", "Silver", "Gold", "Diamond"]);
const VALID_STAFF_ROLES = new Set<StaffRole>([
  "admin",
  "store_manager",
  "warehouse_staff",
  "clinic_doctor",
  "cs_agent",
]);
const VALID_ORDER_STATUSES = new Set<ErpOrderStatus>([
  "pending",
  "confirmed",
  "packing",
  "shipping",
  "delivered",
  "cancelled",
  "returned",
]);

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

function asInt(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isSafeInteger(value)) return value;
  if (typeof value === "string" || typeof value === "bigint") {
    const num = Number(value);
    if (Number.isSafeInteger(num)) return num;
  }
  return fallback;
}

function asTimestamp(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return typeof value === "string" ? value : "";
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function computeWarehouseStatus(availableStock: number, reorderPoint: number): WarehouseStatus {
  if (availableStock <= 0) return "out_of_stock";
  if (availableStock <= reorderPoint) return "low_stock";
  return "in_stock";
}

function mapUserRow(row: Record<string, unknown>): UserRecord {
  const tierRaw = String(row.tier ?? "Member");
  const tier: UserTier = VALID_TIERS.has(tierRaw as UserTier) ? (tierRaw as UserTier) : "Member";
  return {
    id: String(row.user_id ?? ""),
    fullName: String(row.full_name ?? "") || String(row.email ?? "Khách hàng"),
    phone: typeof row.phone === "string" ? row.phone : "",
    email: String(row.email ?? ""),
    tier,
    loyaltyPoints: asInt(row.loyalty_points, 0),
    totalSpent: asInt(row.total_spent, 0),
    ordersCount: asInt(row.orders_count, 0),
    address: typeof row.default_address === "string" ? row.default_address : "",
    status: "active",
    createdAt: asTimestamp(row.created_at),
  };
}

/** List customer CRM profiles joined with real non-cancelled order totals. */
export async function listPostgresAdminUsers(
  database: CatalogSqlDatabase,
  filter?: { search?: string; tier?: string; status?: string },
): Promise<UserRecord[]> {
  if (filter?.status === "locked") {
    return [];
  }

  const conditions: string[] = [];
  const values: unknown[] = [];

  if (filter?.tier && filter.tier !== "all" && VALID_TIERS.has(filter.tier as UserTier)) {
    values.push(filter.tier);
    conditions.push(`cp.tier = $${values.length}`);
  }

  const search = filter?.search?.trim();
  if (search) {
    values.push(`%${escapeLikePattern(search)}%`);
    const p = `$${values.length}`;
    conditions.push(
      `(cp.full_name ILIKE ${p} ESCAPE '\\' OR cp.email ILIKE ${p} ESCAPE '\\' OR cp.phone ILIKE ${p} ESCAPE '\\')`,
    );
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = await database.query(
    `SELECT cp.user_id, cp.email, cp.full_name, cp.phone, cp.default_address,
            cp.tier, cp.loyalty_points, cp.created_at,
            COALESCE(agg.orders_count, 0)::int AS orders_count,
            COALESCE(agg.total_spent, 0)::bigint AS total_spent
     FROM nari_identity.customer_profiles cp
     LEFT JOIN (
       SELECT user_id,
              COUNT(*)::int AS orders_count,
              COALESCE(SUM(total_amount), 0)::bigint AS total_spent
       FROM nari_orders.orders
       WHERE status <> 'cancelled' AND user_id IS NOT NULL
       GROUP BY user_id
     ) agg ON agg.user_id = cp.user_id
     ${whereClause}
     ORDER BY cp.created_at DESC, cp.user_id ASC
     LIMIT 200`,
    values,
  );

  return result.rows.map(mapUserRow);
}

/** Insert a customer profile record linked to an existing auth.users UUID. */
export async function createPostgresAdminCustomerProfile(
  database: CatalogSqlDatabase,
  input: {
    userId: string;
    email: string;
    fullName: string;
    phone?: string;
    address?: string;
    tier?: UserTier;
    loyaltyPoints?: number;
  },
): Promise<UserRecord> {
  const userId = typeof input.userId === "string" ? input.userId.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const fullName = typeof input.fullName === "string" ? input.fullName.trim() : "";
  const phone = typeof input.phone === "string" ? input.phone.trim() : "";
  const address = typeof input.address === "string" ? input.address.trim().slice(0, 500) : "";
  const tier: UserTier = input.tier && VALID_TIERS.has(input.tier) ? input.tier : "Member";
  const loyaltyPoints = input.loyaltyPoints ?? 0;

  if (!UUID_REGEX.test(userId)) {
    throw new ErpServiceError("USER_ID_INVALID", 400, "Mã UUID người dùng không hợp lệ.");
  }
  if (!email || email.length > 254 || !EMAIL_REGEX.test(email)) {
    throw new ErpServiceError("USER_EMAIL_INVALID", 400, "Email khách hàng không hợp lệ.");
  }
  if (!fullName || fullName.length > 160) {
    throw new ErpServiceError("USER_FULLNAME_REQUIRED", 400, "Vui lòng nhập họ và tên khách hàng hợp lệ.");
  }
  if (phone && !PHONE_REGEX.test(phone)) {
    throw new ErpServiceError("USER_PHONE_INVALID", 400, "Số điện thoại phải gồm 10 chữ số bắt đầu bằng 0.");
  }
  if (!Number.isInteger(loyaltyPoints) || loyaltyPoints < 0 || loyaltyPoints > 100_000_000) {
    throw new ErpServiceError("USER_POINTS_INVALID", 400, "Điểm thưởng không hợp lệ.");
  }

  const inserted = await database.query(
    `INSERT INTO nari_identity.customer_profiles (
       user_id, email, full_name, phone, default_address, tier, loyalty_points
     )
     VALUES ($1::uuid, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id) DO NOTHING
     RETURNING user_id, email, full_name, phone, default_address, tier, loyalty_points, created_at`,
    [userId, email, fullName, phone, address, tier, loyaltyPoints],
  );
  if (inserted.rows.length !== 1) {
    throw new ErpServiceError("CUSTOMER_ALREADY_EXISTS", 409, "Hồ sơ khách hàng này đã tồn tại.");
  }

  return mapUserRow({ ...inserted.rows[0], orders_count: 0, total_spent: 0 });
}

/** Update customer tier, loyalty points, or profile fields inside a row-locked transaction. */
export async function updatePostgresAdminUser(
  database: CatalogSqlDatabase,
  userId: string,
  patch: {
    fullName?: string;
    phone?: string;
    address?: string;
    tier?: UserTier;
    loyaltyPoints?: number;
    loyaltyPointsDelta?: number;
    status?: string;
  },
): Promise<UserRecord> {
  const normalizedId = typeof userId === "string" ? userId.trim() : "";
  if (!UUID_REGEX.test(normalizedId)) {
    throw new ErpServiceError("USER_ID_INVALID", 400, "Mã khách hàng phải là UUID hợp lệ.");
  }
  if (patch.status !== undefined) {
    throw new ErpServiceError(
      "CUSTOMER_LOCK_UNSUPPORTED",
      400,
      "Chức năng khóa/mở khóa tài khoản khách hàng chưa được kích hoạt trên runtime DB.",
    );
  }
  if (patch.tier !== undefined && !VALID_TIERS.has(patch.tier)) {
    throw new ErpServiceError("USER_TIER_INVALID", 400, "Hạng thẻ khách hàng không hợp lệ.");
  }
  if (patch.phone !== undefined) {
    const trimmedPhone = typeof patch.phone === "string" ? patch.phone.trim() : "";
    if (trimmedPhone && !PHONE_REGEX.test(trimmedPhone)) {
      throw new ErpServiceError("USER_PHONE_INVALID", 400, "Số điện thoại phải gồm 10 chữ số bắt đầu bằng 0.");
    }
  }
  if (patch.fullName !== undefined) {
    const trimmedName = typeof patch.fullName === "string" ? patch.fullName.trim() : "";
    if (!trimmedName || trimmedName.length > 160) {
      throw new ErpServiceError("USER_FULLNAME_REQUIRED", 400, "Họ tên khách hàng không hợp lệ.");
    }
  }
  if (
    patch.loyaltyPoints !== undefined &&
    (!Number.isInteger(patch.loyaltyPoints) || patch.loyaltyPoints < 0 || patch.loyaltyPoints > 100_000_000)
  ) {
    throw new ErpServiceError("USER_POINTS_INVALID", 400, "Điểm thưởng không hợp lệ.");
  }
  if (
    patch.loyaltyPointsDelta !== undefined &&
    (!Number.isInteger(patch.loyaltyPointsDelta) ||
      patch.loyaltyPointsDelta < -10_000_000 ||
      patch.loyaltyPointsDelta > 10_000_000)
  ) {
    throw new ErpServiceError("USER_POINTS_INVALID", 400, "Mức điều chỉnh điểm thưởng không hợp lệ.");
  }

  return database.transaction(async (conn) => {
    const existingRes = await conn.query(
      `SELECT user_id, email, full_name, phone, default_address, tier, loyalty_points, created_at
       FROM nari_identity.customer_profiles
       WHERE user_id = $1::uuid
       FOR UPDATE`,
      [normalizedId],
    );
    if (existingRes.rows.length !== 1) {
      throw new ErpServiceError("USER_NOT_FOUND", 404, "Không tìm thấy hồ sơ khách hàng.");
    }

    const row = existingRes.rows[0];
    const currentPoints = asInt(row.loyalty_points, 0);
    const nextPoints =
      patch.loyaltyPointsDelta !== undefined
        ? currentPoints + patch.loyaltyPointsDelta
        : patch.loyaltyPoints !== undefined
          ? patch.loyaltyPoints
          : currentPoints;

    if (nextPoints < 0) {
      throw new ErpServiceError("INSUFFICIENT_POINTS", 400, "Điểm thưởng còn lại không đủ để trừ.");
    }

    const nextFullName = patch.fullName !== undefined ? patch.fullName.trim() : String(row.full_name ?? "");
    const nextPhone = patch.phone !== undefined ? patch.phone.trim() : String(row.phone ?? "");
    const nextAddress =
      patch.address !== undefined ? patch.address.trim().slice(0, 500) : String(row.default_address ?? "");
    const nextTier = patch.tier ?? (String(row.tier ?? "Member") as UserTier);

    const updatedRes = await conn.query(
      `UPDATE nari_identity.customer_profiles
       SET full_name = $2,
           phone = $3,
           default_address = $4,
           tier = $5,
           loyalty_points = $6,
           updated_at = clock_timestamp()
       WHERE user_id = $1::uuid
       RETURNING user_id, email, full_name, phone, default_address, tier, loyalty_points, created_at`,
      [normalizedId, nextFullName, nextPhone, nextAddress, nextTier, nextPoints],
    );

    const aggRes = await conn.query(
      `SELECT COUNT(*)::int AS orders_count,
              COALESCE(SUM(total_amount), 0)::bigint AS total_spent
       FROM nari_orders.orders
       WHERE user_id = $1::uuid AND status <> 'cancelled'`,
      [normalizedId],
    );

    return mapUserRow({
      ...updatedRes.rows[0],
      orders_count: aggRes.rows[0]?.orders_count ?? 0,
      total_spent: aggRes.rows[0]?.total_spent ?? 0,
    });
  });
}

/** Read staff accounts from provisioned_identities joined with branches and server-derived permissions. */
export async function listPostgresAdminStaff(
  database: CatalogSqlDatabase,
  filter?: {
    search?: string;
    role?: string;
    status?: string;
    branchId?: string;
    scopedBranchId?: string | null;
  },
): Promise<StaffRecord[]> {
  if (
    filter?.scopedBranchId &&
    filter?.branchId &&
    filter.branchId !== "all" &&
    filter.branchId !== filter.scopedBranchId
  ) {
    return [];
  }

  const conditions: string[] = ["pi.role <> 'customer'"];
  const values: unknown[] = [];

  if (filter?.scopedBranchId) {
    values.push(filter.scopedBranchId);
    conditions.push(`pi.branch_id = $${values.length}`);
  } else if (filter?.branchId && filter.branchId !== "all") {
    values.push(filter.branchId);
    conditions.push(`pi.branch_id = $${values.length}`);
  }

  if (filter?.role && filter.role !== "all" && VALID_STAFF_ROLES.has(filter.role as StaffRole)) {
    values.push(filter.role);
    conditions.push(`pi.role = $${values.length}`);
  }

  if (filter?.status === "active") {
    conditions.push("pi.active = true");
  } else if (filter?.status === "inactive" || filter?.status === "on_leave") {
    conditions.push("pi.active = false");
  }

  const search = filter?.search?.trim();
  if (search) {
    values.push(`%${escapeLikePattern(search)}%`);
    const p = `$${values.length}`;
    conditions.push(`(pi.full_name ILIKE ${p} ESCAPE '\\' OR COALESCE(cp.email, '') ILIKE ${p} ESCAPE '\\')`);
  }

  const result = await database.query(
    `SELECT pi.user_id, pi.role, pi.active, pi.full_name, pi.branch_id, pi.updated_at,
            b.name AS branch_name,
            COALESCE(cp.email, '') AS email,
            COALESCE(cp.phone, '') AS phone
     FROM nari_identity.provisioned_identities pi
     LEFT JOIN nari_catalog.branches b ON b.id = pi.branch_id
     LEFT JOIN nari_identity.customer_profiles cp ON cp.user_id = pi.user_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY pi.updated_at DESC, pi.user_id ASC`,
    values,
  );

  return result.rows
    .filter((row) => VALID_STAFF_ROLES.has(String(row.role) as StaffRole))
    .map((row) => {
      const userId = String(row.user_id ?? "");
      const role = String(row.role) as StaffRole;
      const branchId = asNullableString(row.branch_id) || "HQ";
      return {
        id: userId,
        employeeCode: `NV-${userId.slice(0, 8).toUpperCase()}`,
        fullName: String(row.full_name ?? ""),
        email: typeof row.email === "string" && row.email ? row.email : "Tài khoản nội bộ Supabase",
        phone: typeof row.phone === "string" && row.phone ? row.phone : "—",
        role,
        roleLabel: STAFF_ROLE_LABELS[role] || role,
        branchId,
        branchName: asNullableString(row.branch_name) || (branchId === "HQ" ? "Toàn hệ thống (HQ)" : branchId),
        department: STAFF_DEPARTMENTS[role] || "Vận Hành",
        status: row.active === true ? "active" : "inactive",
        permissions: getRolePermissions(role as AuthRole),
        joinedAt: asTimestamp(row.updated_at),
      };
    });
}

async function hydrateOrders(
  database: CatalogSqlDatabase,
  orderRows: Record<string, unknown>[],
): Promise<ErpOrderRecord[]> {
  if (orderRows.length === 0) return [];
  const orderIds = orderRows.map((row) => String(row.id ?? "")).filter(Boolean);

  const [itemsRes, eventsRes] = await Promise.all([
    database.query(
      `SELECT oi.order_id, oi.sku, oi.product_name, oi.unit_price, oi.quantity,
              COALESCE(p.slug, '') AS slug,
              COALESCE(br.name, 'Nari Home') AS brand_name
       FROM nari_orders.order_items oi
       LEFT JOIN nari_catalog.products p ON p.id = oi.product_id
       LEFT JOIN nari_catalog.brands br ON br.id = p.brand_id
       WHERE oi.order_id = ANY($1::text[])
       ORDER BY oi.sku ASC, oi.id ASC`,
      [orderIds],
    ),
    database.query(
      `SELECT DISTINCT ON (order_id) order_id, actor_id
       FROM nari_orders.order_events
       WHERE order_id = ANY($1::text[])
       ORDER BY order_id, created_at DESC`,
      [orderIds],
    ),
  ]);

  const itemsByOrder = new Map<string, ErpOrderItem[]>();
  for (const row of itemsRes.rows) {
    const orderId = String(row.order_id ?? "");
    const list = itemsByOrder.get(orderId) ?? [];
    list.push({
      sku: String(row.sku ?? ""),
      name: String(row.product_name ?? ""),
      brand: String(row.brand_name ?? "Nari Home"),
      price: asInt(row.unit_price, 0),
      quantity: asInt(row.quantity, 1),
      slug: String(row.slug ?? ""),
    });
    itemsByOrder.set(orderId, list);
  }

  const actorByOrder = new Map<string, string>();
  for (const row of eventsRes.rows) {
    const actor = asNullableString(row.actor_id);
    if (actor) actorByOrder.set(String(row.order_id ?? ""), actor);
  }

  return orderRows.map((row) => {
    const id = String(row.id ?? "");
    const statusRaw = String(row.status ?? "pending");
    const status: ErpOrderStatus = VALID_ORDER_STATUSES.has(statusRaw as ErpOrderStatus)
      ? (statusRaw as ErpOrderStatus)
      : "pending";
    const paymentRaw = String(row.payment_status ?? "unpaid");
    const paymentStatus: PaymentStatus =
      paymentRaw === "paid" || paymentRaw === "refunded" ? paymentRaw : "unpaid";
    const branchId = asNullableString(row.branch_id);
    const branchName = asNullableString(row.branch_name) || (branchId || "Chưa gán chi nhánh");
    const actorId = actorByOrder.get(id) ?? "";

    return {
      id,
      orderCode: String(row.order_code ?? ""),
      createdAt: asTimestamp(row.created_at),
      customerName: String(row.recipient_name ?? ""),
      customerPhone: String(row.recipient_phone ?? ""),
      shippingAddress: String(row.shipping_address ?? ""),
      items: itemsByOrder.get(id) ?? [],
      subtotal: asInt(row.subtotal, 0),
      shippingFee: asInt(row.shipping_fee, 0),
      total: asInt(row.total_amount, 0),
      status,
      statusLabel: ORDER_STATUS_LABELS[status] || status,
      deliveryType: String(row.delivery_type ?? "NariNow 2H"),
      paymentMethod: String(row.payment_method ?? "cod"),
      paymentStatus,
      branchId,
      branchName,
      assignedStaffCode: actorId,
      assignedStaffName: actorId && actorId !== "customer:checkout" ? actorId : "",
      version: asInt(row.version, 1),
      notes: typeof row.notes === "string" && row.notes ? row.notes : undefined,
    };
  });
}

/** Query orders from PostgreSQL with optional search, status, and branch isolation. */
export async function listPostgresAdminOrders(
  database: CatalogSqlDatabase,
  filter?: {
    search?: string;
    status?: string;
    branchId?: string;
    scopedBranchId?: string | null;
  },
): Promise<ErpOrderRecord[]> {
  if (
    filter?.scopedBranchId &&
    filter?.branchId &&
    filter.branchId !== "all" &&
    filter.branchId !== filter.scopedBranchId
  ) {
    return [];
  }

  const conditions: string[] = [];
  const values: unknown[] = [];

  if (filter?.scopedBranchId) {
    values.push(filter.scopedBranchId);
    conditions.push(`o.branch_id = $${values.length}`);
  } else if (filter?.branchId && filter.branchId !== "all") {
    values.push(filter.branchId);
    conditions.push(`o.branch_id = $${values.length}`);
  }

  if (filter?.status && filter.status !== "all" && VALID_ORDER_STATUSES.has(filter.status as ErpOrderStatus)) {
    values.push(filter.status);
    conditions.push(`o.status = $${values.length}`);
  }

  const search = filter?.search?.trim();
  if (search) {
    values.push(`%${escapeLikePattern(search)}%`);
    const p = `$${values.length}`;
    conditions.push(
      `(o.order_code ILIKE ${p} ESCAPE '\\' OR o.recipient_name ILIKE ${p} ESCAPE '\\' OR o.recipient_phone ILIKE ${p} ESCAPE '\\')`,
    );
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const ordersRes = await database.query(
    `SELECT o.id, o.order_code, o.user_id, o.branch_id, o.recipient_name, o.recipient_phone,
            o.shipping_address, o.delivery_type, o.payment_method, o.payment_status,
            o.status, o.subtotal, o.shipping_fee, o.discount_amount, o.total_amount,
            o.notes, o.version, o.created_at, o.updated_at,
            b.name AS branch_name
     FROM nari_orders.orders o
     LEFT JOIN nari_catalog.branches b ON b.id = o.branch_id
     ${whereClause}
     ORDER BY o.created_at DESC
     LIMIT 200`,
    values,
  );

  return hydrateOrders(database, ordersRes.rows);
}

/** Advance order fulfillment status using optimistic locking and branch isolation. */
export async function advancePostgresAdminOrderStatus(
  database: CatalogSqlDatabase,
  params: {
    orderId: string;
    toStatus: ErpOrderStatus;
    expectedVersion?: number;
    actorId: string;
    scopedBranchId?: string | null;
    note?: string;
  },
): Promise<ErpOrderRecord> {
  const identifier = typeof params.orderId === "string" ? params.orderId.trim() : "";
  if (!identifier) {
    throw new ErpServiceError("ORDER_ID_REQUIRED", 400, "Thiếu mã đơn hàng cần cập nhật.");
  }
  if (!VALID_ORDER_STATUSES.has(params.toStatus)) {
    throw new ErpServiceError("ORDER_STATUS_INVALID", 400, "Trạng thái đơn hàng không hợp lệ.");
  }

  const lookup = await database.query(
    `SELECT id, branch_id, version
     FROM nari_orders.orders
     WHERE id = $1 OR order_code = $1
     LIMIT 1`,
    [identifier],
  );
  if (lookup.rows.length !== 1) {
    throw new ErpServiceError("ORDER_NOT_FOUND", 404, `Không tìm thấy đơn hàng: ${identifier}`);
  }

  const row = lookup.rows[0];
  const orderBranchId = asNullableString(row.branch_id);
  if (params.scopedBranchId && orderBranchId !== params.scopedBranchId) {
    throw new ErpServiceError("PERMISSION_DENIED", 403, "Bạn không có quyền thao tác đơn hàng của chi nhánh khác.");
  }

  const expectedVersion =
    typeof params.expectedVersion === "number" && Number.isInteger(params.expectedVersion)
      ? params.expectedVersion
      : asInt(row.version, 1);

  try {
    await transitionPostgresOrderStatus(database, {
      orderId: String(row.id),
      expectedVersion,
      toStatus: params.toStatus as OrderStatus,
      actorId: params.actorId,
      note: params.note,
    });
  } catch (error) {
    if (error instanceof OrderInputError) {
      throw new ErpServiceError(error.code, error.status, error.message);
    }
    throw error;
  }

  const refreshed = await database.query(
    `SELECT o.id, o.order_code, o.user_id, o.branch_id, o.recipient_name, o.recipient_phone,
            o.shipping_address, o.delivery_type, o.payment_method, o.payment_status,
            o.status, o.subtotal, o.shipping_fee, o.discount_amount, o.total_amount,
            o.notes, o.version, o.created_at, o.updated_at,
            b.name AS branch_name
     FROM nari_orders.orders o
     LEFT JOIN nari_catalog.branches b ON b.id = o.branch_id
     WHERE o.id = $1`,
    [String(row.id)],
  );

  const hydrated = await hydrateOrders(database, refreshed.rows);
  if (hydrated.length !== 1) {
    throw new ErpServiceError("ORDER_NOT_FOUND", 404, "Không thể tải lại thông tin đơn hàng.");
  }
  return hydrated[0];
}

/** Query multi-branch inventory balances, SKU totals, and active merchant branches. */
export async function listPostgresAdminInventory(
  database: CatalogSqlDatabase,
  filter?: {
    search?: string;
    branchId?: string;
    lowStockOnly?: boolean;
    scopedBranchId?: string | null;
    sku?: string;
  },
): Promise<{ inventory: InventoryRecord[]; branches: ErpBranchSummary[] }> {
  const branchConditions: string[] = [
    "b.is_active = true",
    "NOT b.is_demo",
    "(b.source_id IS NULL OR EXISTS (SELECT 1 FROM nari_catalog.sources s WHERE s.id = b.source_id AND s.verification_state = 'merchant'))",
  ];
  const branchValues: unknown[] = [];

  if (filter?.scopedBranchId) {
    branchValues.push(filter.scopedBranchId);
    branchConditions.push(`b.id = $${branchValues.length}`);
  }

  const branchesRes = await database.query(
    `SELECT b.id, b.code, b.name, b.city, b.district
     FROM nari_catalog.branches b
     WHERE ${branchConditions.join(" AND ")}
     ORDER BY b.city ASC, b.name ASC`,
    branchValues,
  );
  const branches: ErpBranchSummary[] = branchesRes.rows.map((row) => ({
    id: String(row.id ?? ""),
    code: String(row.code ?? ""),
    name: String(row.name ?? ""),
    city: String(row.city ?? ""),
    district: String(row.district ?? ""),
  }));

  const prodConditions: string[] = [
    "p.hidden_at IS NULL",
    "NOT p.is_demo",
    "(p.source_id IS NULL OR EXISTS (SELECT 1 FROM nari_catalog.sources s WHERE s.id = p.source_id AND s.verification_state = 'merchant'))",
  ];
  const prodValues: unknown[] = [];

  if (filter?.sku) {
    prodValues.push(filter.sku);
    prodConditions.push(`p.sku = $${prodValues.length}`);
  }

  const search = filter?.search?.trim();
  if (search) {
    prodValues.push(`%${escapeLikePattern(search)}%`);
    const p = `$${prodValues.length}`;
    prodConditions.push(
      `(p.sku ILIKE ${p} ESCAPE '\\' OR p.name ILIKE ${p} ESCAPE '\\' OR br.name ILIKE ${p} ESCAPE '\\')`,
    );
  }

  const productsRes = await database.query(
    `SELECT p.id, p.sku, p.slug, p.name, p.price, p.updated_at,
            br.name AS brand_name,
            c.name AS category_name
     FROM nari_catalog.products p
     JOIN nari_catalog.brands br ON br.id = p.brand_id
     JOIN nari_catalog.categories c ON c.id = p.category_id
     WHERE ${prodConditions.join(" AND ")}
     ORDER BY p.name ASC, p.sku ASC`,
    prodValues,
  );

  if (productsRes.rows.length === 0) {
    return { inventory: [], branches };
  }

  const productIds = productsRes.rows.map((r) => String(r.id));
  const balConditions: string[] = ["ib.product_id = ANY($1::text[])"];
  const balValues: unknown[] = [productIds];

  if (filter?.scopedBranchId) {
    balValues.push(filter.scopedBranchId);
    balConditions.push(`ib.branch_id = $${balValues.length}`);
  } else if (filter?.branchId && filter.branchId !== "all") {
    balValues.push(filter.branchId);
    balConditions.push(`(ib.branch_id = $${balValues.length} OR b.code = $${balValues.length})`);
  }

  const balancesRes = await database.query(
    `SELECT ib.product_id, ib.branch_id, b.code AS branch_code, b.name AS branch_name,
            ib.total_stock, ib.reserved_stock, ib.available_stock, ib.reorder_point, ib.updated_at
     FROM nari_catalog.inventory_balances ib
     JOIN nari_catalog.branches b ON b.id = ib.branch_id
     WHERE ${balConditions.join(" AND ")}
     ORDER BY b.name ASC`,
    balValues,
  );

  const byProduct = new Map<
    string,
    {
      totalStock: number;
      reservedStock: number;
      availableStock: number;
      reorderPoint: number;
      lastRestockedAt: string;
      branchStock: BranchStock[];
    }
  >();

  for (const row of balancesRes.rows) {
    const productId = String(row.product_id ?? "");
    const total = asInt(row.total_stock, 0);
    const reserved = asInt(row.reserved_stock, 0);
    const available = asInt(row.available_stock, Math.max(0, total - reserved));
    const reorder = asInt(row.reorder_point, 10);
    const updatedAt = asTimestamp(row.updated_at);

    const acc = byProduct.get(productId) ?? {
      totalStock: 0,
      reservedStock: 0,
      availableStock: 0,
      reorderPoint: reorder,
      lastRestockedAt: updatedAt,
      branchStock: [],
    };
    acc.totalStock += total;
    acc.reservedStock += reserved;
    acc.availableStock += available;
    acc.reorderPoint = Math.max(acc.reorderPoint, reorder);
    if (updatedAt && (!acc.lastRestockedAt || updatedAt > acc.lastRestockedAt)) {
      acc.lastRestockedAt = updatedAt;
    }
    acc.branchStock.push({
      branchId: String(row.branch_id ?? ""),
      branchCode: typeof row.branch_code === "string" ? row.branch_code : undefined,
      branchName: String(row.branch_name ?? ""),
      quantity: total,
      reservedQuantity: reserved,
      availableQuantity: available,
    });
    byProduct.set(productId, acc);
  }

  let inventory: InventoryRecord[] = productsRes.rows.map((row) => {
    const productId = String(row.id ?? "");
    const stats = byProduct.get(productId);
    const totalStock = stats?.totalStock ?? 0;
    const reservedStock = stats?.reservedStock ?? 0;
    const availableStock = stats?.availableStock ?? 0;
    const reorderPoint = stats?.reorderPoint ?? 10;

    return {
      productId,
      sku: String(row.sku ?? ""),
      productSlug: String(row.slug ?? ""),
      productName: String(row.name ?? ""),
      brand: String(row.brand_name ?? ""),
      category: String(row.category_name ?? ""),
      price: asInt(row.price, 0),
      totalStock,
      reservedStock,
      availableStock,
      reorderPoint,
      warehouseStatus: computeWarehouseStatus(availableStock, reorderPoint),
      branchStock: stats?.branchStock ?? [],
      lastRestockedAt: stats?.lastRestockedAt || asTimestamp(row.updated_at),
    };
  });

  if (filter?.lowStockOnly) {
    inventory = inventory.filter(
      (item) => item.warehouseStatus === "low_stock" || item.warehouseStatus === "out_of_stock",
    );
  }

  return { inventory, branches };
}

/** Query append-only inventory movements audit trail. */
export async function listPostgresAdminInventoryMovements(
  database: CatalogSqlDatabase,
  limit = 50,
  scopedBranchId?: string | null,
): Promise<InventoryAuditLog[]> {
  const safeLimit = Math.min(Math.max(1, limit), 200);
  const values: unknown[] = [safeLimit];
  const whereClause = scopedBranchId ? "WHERE im.branch_id = $2" : "";
  if (scopedBranchId) {
    values.push(scopedBranchId);
  }

  const res = await database.query(
    `SELECT im.id, im.branch_id, im.delta, im.previous_stock, im.new_stock,
            im.reason, im.actor_id, im.created_at,
            p.sku, p.name AS product_name,
            b.name AS branch_name
     FROM nari_catalog.inventory_movements im
     JOIN nari_catalog.products p ON p.id = im.product_id
     JOIN nari_catalog.branches b ON b.id = im.branch_id
     ${whereClause}
     ORDER BY im.created_at DESC
     LIMIT $1`,
    values,
  );

  return res.rows.map((row) => ({
    id: String(row.id ?? ""),
    sku: String(row.sku ?? ""),
    productName: String(row.product_name ?? ""),
    delta: asInt(row.delta, 0),
    previousStock: asInt(row.previous_stock, 0),
    newStock: asInt(row.new_stock, 0),
    reason: String(row.reason ?? ""),
    staffCode: String(row.actor_id ?? ""),
    branchId: String(row.branch_id ?? ""),
    branchName: String(row.branch_name ?? ""),
    timestamp: asTimestamp(row.created_at),
  }));
}

/** Adjust branch inventory balance atomically and append an immutable movement ledger row. */
export async function adjustPostgresAdminInventoryStock(
  database: CatalogSqlDatabase,
  params: {
    sku: string;
    branchId: string;
    delta: number;
    reason: string;
    actorId: string;
    idempotencyKey?: string;
    scopedBranchId?: string | null;
  },
): Promise<{ updatedItem: InventoryRecord; auditLog: InventoryAuditLog }> {
  const sku = typeof params.sku === "string" ? params.sku.trim() : "";
  const branchInput = typeof params.branchId === "string" ? params.branchId.trim() : "";
  const reason = typeof params.reason === "string" ? params.reason.trim().slice(0, 240) : "";
  const actorId = typeof params.actorId === "string" && params.actorId.trim() ? params.actorId.trim() : "admin";

  if (!sku) {
    throw new ErpServiceError("SKU_REQUIRED", 400, "Vui lòng nhập mã SKU sản phẩm.");
  }
  if (!branchInput) {
    throw new ErpServiceError("BRANCH_REQUIRED", 400, "Vui lòng chọn chi nhánh áp dụng.");
  }
  if (!Number.isInteger(params.delta) || params.delta === 0 || params.delta < -100_000 || params.delta > 100_000) {
    throw new ErpServiceError("INVENTORY_DELTA_INVALID", 400, "Số lượng điều chỉnh phải là số nguyên khác 0.");
  }
  if (!reason) {
    throw new ErpServiceError("INVENTORY_REASON_REQUIRED", 400, "Vui lòng nhập lý do điều chỉnh tồn kho.");
  }

  const auditLog = await database.transaction(async (conn) => {
    const branchRes = await conn.query(
      `SELECT b.id, b.name
       FROM nari_catalog.branches b
       WHERE (b.id = $1 OR b.code = $1)
         AND b.is_active = true
         AND NOT b.is_demo
         AND (
           b.source_id IS NULL
           OR EXISTS (
             SELECT 1 FROM nari_catalog.sources s
             WHERE s.id = b.source_id AND s.verification_state = 'merchant'
           )
         )
       LIMIT 1`,
      [branchInput],
    );
    if (branchRes.rows.length !== 1) {
      throw new ErpServiceError("BRANCH_NOT_FOUND", 404, `Không tìm thấy chi nhánh hoạt động: ${branchInput}`);
    }
    const branchId = String(branchRes.rows[0].id);
    const branchName = String(branchRes.rows[0].name);

    if (params.scopedBranchId && branchId !== params.scopedBranchId) {
      throw new ErpServiceError("PERMISSION_DENIED", 403, "Bạn không có quyền điều chỉnh tồn kho chi nhánh khác.");
    }

    const productRes = await conn.query(
      `SELECT p.id, p.sku, p.name
       FROM nari_catalog.products p
       WHERE p.sku = $1
         AND p.hidden_at IS NULL
         AND NOT p.is_demo
         AND (
           p.source_id IS NULL
           OR EXISTS (
             SELECT 1 FROM nari_catalog.sources s
             WHERE s.id = p.source_id AND s.verification_state = 'merchant'
           )
         )
       FOR NO KEY UPDATE`,
      [sku],
    );
    if (productRes.rows.length !== 1) {
      throw new ErpServiceError("PRODUCT_NOT_FOUND", 404, `Không tìm thấy sản phẩm với SKU: ${sku}`);
    }
    const productId = String(productRes.rows[0].id);
    const productName = String(productRes.rows[0].name);

    const balanceRes = await conn.query(
      `SELECT total_stock, reserved_stock
       FROM nari_catalog.inventory_balances
       WHERE branch_id = $1 AND product_id = $2
       FOR NO KEY UPDATE`,
      [branchId, productId],
    );

    const previousStock = balanceRes.rows.length === 1 ? asInt(balanceRes.rows[0].total_stock, 0) : 0;
    const reservedStock = balanceRes.rows.length === 1 ? asInt(balanceRes.rows[0].reserved_stock, 0) : 0;
    const newStock = previousStock + params.delta;

    if (newStock < 0 || newStock < reservedStock) {
      throw new ErpServiceError(
        "INSUFFICIENT_STOCK",
        409,
        `Tồn kho sau điều chỉnh (${newStock}) không thể nhỏ hơn 0 hoặc lượng đang giữ (${reservedStock}).`,
      );
    }

    await conn.query(
      `INSERT INTO nari_catalog.inventory_balances (
         branch_id, product_id, total_stock, reserved_stock, reorder_point, updated_at
       )
       VALUES ($1, $2, $3, 0, 10, now())
       ON CONFLICT (branch_id, product_id) DO UPDATE
         SET total_stock = EXCLUDED.total_stock,
             updated_at = now()`,
      [branchId, productId, newStock],
    );

    const movementId = randomUUID();
    const movementKey = params.idempotencyKey?.trim() || `admin:${randomUUID()}`;
    const movementRes = await conn.query(
      `INSERT INTO nari_catalog.inventory_movements (
         id, branch_id, product_id, delta, previous_stock, new_stock, reason, actor_id, idempotency_key
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING created_at`,
      [movementId, branchId, productId, params.delta, previousStock, newStock, reason, actorId, movementKey],
    );

    return {
      id: movementId,
      sku,
      productName,
      delta: params.delta,
      previousStock,
      newStock,
      reason,
      staffCode: actorId,
      branchId,
      branchName,
      timestamp: asTimestamp(movementRes.rows[0]?.created_at) || new Date().toISOString(),
    };
  });

  const { inventory } = await listPostgresAdminInventory(database, {
    sku,
    scopedBranchId: params.scopedBranchId,
  });
  const updatedItem = inventory[0];
  if (!updatedItem) {
    throw new ErpServiceError("PRODUCT_NOT_FOUND", 404, `Không thể tải tồn kho sau cập nhật cho SKU: ${sku}`);
  }

  return { updatedItem, auditLog };
}

/** Aggregate live PostgreSQL KPIs for the ERP Admin Dashboard. */
export async function getPostgresAdminDashboardKpis(
  database: CatalogSqlDatabase,
  scopedBranchId?: string | null,
): Promise<ErpDashboardKpis> {
  const orderWhere = scopedBranchId ? "WHERE branch_id = $1" : "";
  const orderParams = scopedBranchId ? [scopedBranchId] : [];
  const staffWhere = scopedBranchId
    ? "WHERE role <> 'customer' AND branch_id = $1"
    : "WHERE role <> 'customer'";

  const [orderAggRes, customerAggRes, staffAggRes, invRes, recentAuditLogs] = await Promise.all([
    database.query(
      `SELECT
         COUNT(*)::int AS total_orders,
         COALESCE(SUM(total_amount) FILTER (WHERE status = 'delivered' OR payment_status = 'paid'), 0)::bigint AS total_revenue,
         COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_count,
         COUNT(*) FILTER (WHERE status IN ('confirmed', 'packing', 'shipping'))::int AS packing_shipping_count,
         COUNT(*) FILTER (WHERE status = 'delivered')::int AS delivered_count,
         COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled_count,
         COUNT(*) FILTER (WHERE (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date)::int AS today_orders_count,
         COALESCE(SUM(total_amount) FILTER (
           WHERE status <> 'cancelled'
             AND (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
         ), 0)::bigint AS today_revenue
       FROM nari_orders.orders
       ${orderWhere}`,
      orderParams,
    ),
    database.query(
      `SELECT COUNT(*)::int AS total_customers
       FROM nari_identity.customer_profiles`,
    ),
    database.query(
      `SELECT
         COUNT(*)::int AS total_staff,
         COUNT(*) FILTER (WHERE active = true)::int AS active_staff
       FROM nari_identity.provisioned_identities
       ${staffWhere}`,
      orderParams,
    ),
    listPostgresAdminInventory(database, { scopedBranchId }),
    listPostgresAdminInventoryMovements(database, 6, scopedBranchId),
  ]);

  const orderRow = orderAggRes.rows[0] ?? {};
  const customerRow = customerAggRes.rows[0] ?? {};
  const staffRow = staffAggRes.rows[0] ?? {};

  const inStockCount = invRes.inventory.filter((i) => i.warehouseStatus === "in_stock").length;
  const lowStockCount = invRes.inventory.filter((i) => i.warehouseStatus === "low_stock").length;
  const outOfStockCount = invRes.inventory.filter((i) => i.warehouseStatus === "out_of_stock").length;
  const lowStockItems = invRes.inventory
    .filter((i) => i.warehouseStatus === "low_stock" || i.warehouseStatus === "out_of_stock")
    .slice(0, 8);

  const totalCustomers = asInt(customerRow.total_customers, 0);

  return {
    totalRevenue: asInt(orderRow.total_revenue, 0),
    totalOrders: asInt(orderRow.total_orders, 0),
    pendingOrdersCount: asInt(orderRow.pending_count, 0),
    packingShippingCount: asInt(orderRow.packing_shipping_count, 0),
    deliveredOrdersCount: asInt(orderRow.delivered_count, 0),
    cancelledOrdersCount: asInt(orderRow.cancelled_count, 0),
    totalCustomers,
    activeCustomers: totalCustomers,
    totalStaff: asInt(staffRow.total_staff, 0),
    activeStaff: asInt(staffRow.active_staff, 0),
    totalSkus: invRes.inventory.length,
    inStockCount,
    lowStockCount,
    outOfStockCount,
    recentAuditLogs,
    lowStockItems,
    todayOrdersCount: asInt(orderRow.today_orders_count, 0),
    todayRevenue: asInt(orderRow.today_revenue, 0),
  };
}
