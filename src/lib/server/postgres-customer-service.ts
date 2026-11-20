import "server-only";
import type {
  CustomerLoyaltySummary,
  CustomerPortalBooking,
  CustomerPortalOrder,
  CustomerPortalPayload,
  CustomerProfileRecord,
} from "@/lib/customer-types";
import {
  ORDER_STATUS_LABELS,
  type ErpOrderItem,
  type ErpOrderStatus,
  type PaymentStatus,
  type UserTier,
} from "@/lib/erp-types";
import type { CatalogSqlDatabase } from "@/lib/server/postgres-catalog-repository";

export type {
  CustomerLoyaltySummary,
  CustomerPortalBooking,
  CustomerPortalOrder,
  CustomerPortalPayload,
  CustomerProfileRecord,
};

export type CustomerProfileErrorStatus = 400 | 404;

/** Validation or lookup error thrown by PostgreSQL Customer Portal operations. */
export class CustomerProfileError extends Error {
  readonly status: CustomerProfileErrorStatus;
  readonly code: string;

  constructor(code: string, status: CustomerProfileErrorStatus, message?: string) {
    super(message || code);
    this.name = "CustomerProfileError";
    this.code = code;
    this.status = status;
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PHONE_REGEX = /^0\d{9}$/;
const VALID_TIERS = new Set<UserTier>(["Member", "Silver", "Gold", "Diamond"]);
const VALID_ORDER_STATUSES = new Set<ErpOrderStatus>([
  "pending",
  "confirmed",
  "packing",
  "shipping",
  "delivered",
  "cancelled",
  "returned",
]);

function asInt(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isSafeInteger(value)) return value;
  if (typeof value === "string" || typeof value === "bigint") {
    const parsed = Number(value);
    if (Number.isSafeInteger(parsed)) return parsed;
  }
  return fallback;
}

function asTimestamp(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return typeof value === "string" ? value : "";
}

function mapProfileRow(row: Record<string, unknown>): CustomerProfileRecord {
  const tierRaw = String(row.tier ?? "Member");
  const tier: UserTier = VALID_TIERS.has(tierRaw as UserTier) ? (tierRaw as UserTier) : "Member";
  return {
    userId: String(row.user_id ?? ""),
    email: String(row.email ?? ""),
    fullName: typeof row.full_name === "string" ? row.full_name : "",
    phone: typeof row.phone === "string" ? row.phone : "",
    defaultAddress: typeof row.default_address === "string" ? row.default_address : "",
    tier,
    loyaltyPoints: asInt(row.loyalty_points, 0),
    createdAt: asTimestamp(row.created_at),
    updatedAt: asTimestamp(row.updated_at),
  };
}

function computeLoyaltySummary(
  tier: UserTier,
  points: number,
  orders: readonly CustomerPortalOrder[],
): CustomerLoyaltySummary {
  const nonCancelled = orders.filter((o) => o.status !== "cancelled" && o.status !== "returned");
  const totalSpent = nonCancelled.reduce((sum, o) => sum + o.totalAmount, 0);

  let nextTier: UserTier | null = null;
  let pointsToNextTier = 0;
  if (tier === "Member") {
    nextTier = "Silver";
    pointsToNextTier = Math.max(0, 500 - points);
  } else if (tier === "Silver") {
    nextTier = "Gold";
    pointsToNextTier = Math.max(0, 1500 - points);
  } else if (tier === "Gold") {
    nextTier = "Diamond";
    pointsToNextTier = Math.max(0, 3000 - points);
  }

  return {
    tier,
    points,
    nextTier,
    pointsToNextTier,
    totalSpent,
    ordersCount: nonCancelled.length,
  };
}

function formatVnDateAndRange(startRaw: unknown, endRaw: unknown): {
  date: string;
  timeRange: string;
  startAt: string;
  endAt: string;
} {
  const startIso = asTimestamp(startRaw);
  const endIso = asTimestamp(endRaw);
  const startDate = startRaw instanceof Date ? startRaw : new Date(startIso);
  const endDate = endRaw instanceof Date ? endRaw : new Date(endIso);
  if (!Number.isFinite(startDate.valueOf())) {
    return { date: "", timeRange: "", startAt: startIso, endAt: endIso };
  }

  const dateFmt = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeFmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const date = dateFmt.format(startDate);
  const startHm = timeFmt.format(startDate);
  const endHm = Number.isFinite(endDate.valueOf()) ? timeFmt.format(endDate) : "";

  return {
    date,
    timeRange: endHm ? `${startHm} - ${endHm}` : startHm,
    startAt: startDate.toISOString(),
    endAt: Number.isFinite(endDate.valueOf()) ? endDate.toISOString() : endIso,
  };
}

/** Idempotently create or fetch a customer profile row in nari_identity.customer_profiles. */
export async function ensureCustomerProfile(
  database: CatalogSqlDatabase,
  input: {
    userId: string;
    email: string;
    fullName?: string;
    phone?: string;
    defaultAddress?: string;
  },
): Promise<CustomerProfileRecord> {
  const userId = typeof input.userId === "string" ? input.userId.trim() : "";
  if (!UUID_REGEX.test(userId)) {
    throw new CustomerProfileError("CUSTOMER_USER_ID_INVALID", 400, "Mã người dùng không hợp lệ.");
  }

  const existing = await database.query(
    `SELECT user_id, email, full_name, phone, default_address, tier, loyalty_points, created_at, updated_at
     FROM nari_identity.customer_profiles
     WHERE user_id = $1::uuid`,
    [userId],
  );
  if (existing.rows.length === 1) {
    return mapProfileRow(existing.rows[0]);
  }

  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const fullName = typeof input.fullName === "string" ? input.fullName.trim().slice(0, 160) : "";
  const phone = typeof input.phone === "string" ? input.phone.trim() : "";
  const defaultAddress =
    typeof input.defaultAddress === "string" ? input.defaultAddress.trim().slice(0, 500) : "";

  if (phone && !PHONE_REGEX.test(phone)) {
    throw new CustomerProfileError("CUSTOMER_PHONE_INVALID", 400, "Số điện thoại phải gồm 10 chữ số bắt đầu bằng 0.");
  }

  await database.query(
    `INSERT INTO nari_identity.customer_profiles (
       user_id, email, full_name, phone, default_address
     )
     VALUES ($1::uuid, $2, $3, $4, $5)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId, email, fullName, phone, defaultAddress],
  );

  const selected = await database.query(
    `SELECT user_id, email, full_name, phone, default_address, tier, loyalty_points, created_at, updated_at
     FROM nari_identity.customer_profiles
     WHERE user_id = $1::uuid`,
    [userId],
  );
  if (selected.rows.length !== 1) {
    throw new CustomerProfileError("CUSTOMER_PROFILE_NOT_FOUND", 404, "Không thể tải hồ sơ khách hàng.");
  }

  return mapProfileRow(selected.rows[0]);
}

/** Update ONLY customer-editable profile fields (fullName, phone, defaultAddress). */
export async function updateCustomerProfile(
  database: CatalogSqlDatabase,
  userId: string,
  patch: {
    fullName?: string;
    phone?: string;
    defaultAddress?: string;
  },
): Promise<CustomerProfileRecord> {
  const normalizedId = typeof userId === "string" ? userId.trim() : "";
  if (!UUID_REGEX.test(normalizedId)) {
    throw new CustomerProfileError("CUSTOMER_USER_ID_INVALID", 400, "Mã người dùng không hợp lệ.");
  }

  if (patch.fullName !== undefined) {
    const trimmed = typeof patch.fullName === "string" ? patch.fullName.trim() : "";
    if (!trimmed || trimmed.length > 160) {
      throw new CustomerProfileError("CUSTOMER_NAME_INVALID", 400, "Vui lòng nhập họ và tên hợp lệ (1 - 160 ký tự).");
    }
  }
  if (patch.phone !== undefined) {
    const trimmed = typeof patch.phone === "string" ? patch.phone.trim() : "";
    if (trimmed && !PHONE_REGEX.test(trimmed)) {
      throw new CustomerProfileError("CUSTOMER_PHONE_INVALID", 400, "Số điện thoại phải gồm 10 chữ số bắt đầu bằng 0.");
    }
  }
  if (patch.defaultAddress !== undefined) {
    if (typeof patch.defaultAddress !== "string" || patch.defaultAddress.trim().length > 500) {
      throw new CustomerProfileError("CUSTOMER_ADDRESS_INVALID", 400, "Địa chỉ mặc định không vượt quá 500 ký tự.");
    }
  }

  const currentRes = await database.query(
    `SELECT user_id, email, full_name, phone, default_address, tier, loyalty_points, created_at, updated_at
     FROM nari_identity.customer_profiles
     WHERE user_id = $1::uuid`,
    [normalizedId],
  );
  if (currentRes.rows.length !== 1) {
    throw new CustomerProfileError("CUSTOMER_PROFILE_NOT_FOUND", 404, "Không tìm thấy hồ sơ khách hàng.");
  }

  const current = mapProfileRow(currentRes.rows[0]);
  const nextFullName = patch.fullName !== undefined ? patch.fullName.trim() : current.fullName;
  const nextPhone = patch.phone !== undefined ? patch.phone.trim() : current.phone;
  const nextAddress = patch.defaultAddress !== undefined ? patch.defaultAddress.trim() : current.defaultAddress;

  const updated = await database.query(
    `UPDATE nari_identity.customer_profiles
     SET full_name = $2,
         phone = $3,
         default_address = $4,
         updated_at = clock_timestamp()
     WHERE user_id = $1::uuid
     RETURNING user_id, email, full_name, phone, default_address, tier, loyalty_points, created_at, updated_at`,
    [normalizedId, nextFullName, nextPhone, nextAddress],
  );

  return mapProfileRow(updated.rows[0]);
}

/** Fetch customer profile, own orders, own clinic bookings, and loyalty summary from PostgreSQL. */
export async function getCustomerPortalData(
  database: CatalogSqlDatabase,
  user: { id: string; email: string; fullName?: string; phone?: string },
): Promise<CustomerPortalPayload> {
  const profile = await ensureCustomerProfile(database, {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
  });

  const [ordersRes, bookingsRes] = await Promise.all([
    database.query(
      `SELECT o.id, o.order_code, o.branch_id, o.recipient_name, o.recipient_phone,
              o.shipping_address, o.delivery_type, o.payment_method, o.payment_status,
              o.status, o.subtotal, o.shipping_fee, o.total_amount, o.created_at,
              b.name AS branch_name
       FROM nari_orders.orders o
       LEFT JOIN nari_catalog.branches b ON b.id = o.branch_id
       WHERE o.user_id = $1::uuid
       ORDER BY o.created_at DESC
       LIMIT 50`,
      [profile.userId],
    ),
    database.query(
      `SELECT a.id, a.booking_code, a.branch_id, a.service_id, a.service_name,
              a.customer_name, a.customer_phone,
              lower(a.during) AS start_at,
              upper(a.during) AS end_at,
              a.status, a.notes, a.created_at,
              b.name AS branch_name, b.address AS branch_address
       FROM nari_clinic.appointments a
       JOIN nari_catalog.branches b ON b.id = a.branch_id
       WHERE a.user_id = $1::uuid
       ORDER BY a.created_at DESC
       LIMIT 50`,
      [profile.userId],
    ),
  ]);

  const orderIds = ordersRes.rows.map((r) => String(r.id ?? "")).filter(Boolean);
  const itemsByOrder = new Map<string, ErpOrderItem[]>();

  if (orderIds.length > 0) {
    const itemsRes = await database.query(
      `SELECT oi.order_id, oi.sku, oi.product_name, oi.unit_price, oi.quantity,
              COALESCE(p.slug, '') AS slug,
              COALESCE(br.name, 'Nari Home') AS brand_name
       FROM nari_orders.order_items oi
       LEFT JOIN nari_catalog.products p ON p.id = oi.product_id
       LEFT JOIN nari_catalog.brands br ON br.id = p.brand_id
       WHERE oi.order_id = ANY($1::text[])
       ORDER BY oi.sku ASC, oi.id ASC`,
      [orderIds],
    );
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
  }

  const orders: CustomerPortalOrder[] = ordersRes.rows.map((row) => {
    const id = String(row.id ?? "");
    const statusRaw = String(row.status ?? "pending");
    const status: ErpOrderStatus = VALID_ORDER_STATUSES.has(statusRaw as ErpOrderStatus)
      ? (statusRaw as ErpOrderStatus)
      : "pending";
    const paymentRaw = String(row.payment_status ?? "unpaid");
    const paymentStatus: PaymentStatus =
      paymentRaw === "paid" || paymentRaw === "refunded" ? paymentRaw : "unpaid";

    return {
      id,
      orderCode: String(row.order_code ?? ""),
      createdAt: asTimestamp(row.created_at),
      status,
      statusLabel: ORDER_STATUS_LABELS[status] || status,
      paymentMethod: String(row.payment_method ?? "cod"),
      paymentStatus,
      deliveryType: String(row.delivery_type ?? "NariNow 2H"),
      branchId: typeof row.branch_id === "string" && row.branch_id ? row.branch_id : null,
      branchName: typeof row.branch_name === "string" && row.branch_name ? row.branch_name : "Kho trung tâm Nari Home",
      recipientName: String(row.recipient_name ?? ""),
      recipientPhone: String(row.recipient_phone ?? ""),
      shippingAddress: String(row.shipping_address ?? ""),
      subtotal: asInt(row.subtotal, 0),
      shippingFee: asInt(row.shipping_fee, 0),
      totalAmount: asInt(row.total_amount, 0),
      items: itemsByOrder.get(id) ?? [],
    };
  });

  const bookings: CustomerPortalBooking[] = bookingsRes.rows.map((row) => {
    const formatted = formatVnDateAndRange(row.start_at, row.end_at);
    return {
      id: String(row.id ?? ""),
      bookingCode: String(row.booking_code ?? ""),
      branchId: String(row.branch_id ?? ""),
      branchName: String(row.branch_name ?? ""),
      branchAddress: String(row.branch_address ?? ""),
      serviceId: typeof row.service_id === "string" && row.service_id ? row.service_id : null,
      serviceName: String(row.service_name ?? ""),
      customerName: String(row.customer_name ?? ""),
      customerPhone: String(row.customer_phone ?? ""),
      date: formatted.date,
      timeRange: formatted.timeRange,
      startAt: formatted.startAt,
      endAt: formatted.endAt,
      status: String(row.status ?? "booked"),
      notes: typeof row.notes === "string" ? row.notes : "",
      createdAt: asTimestamp(row.created_at),
    };
  });

  return {
    profile,
    orders,
    bookings,
    loyalty: computeLoyaltySummary(profile.tier, profile.loyaltyPoints, orders),
  };
}
