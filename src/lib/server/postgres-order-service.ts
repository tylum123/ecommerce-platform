import { randomUUID } from "node:crypto";
import type { CatalogSqlConnection, CatalogSqlDatabase } from "@/lib/server/postgres-catalog-repository";

export type OrderErrorStatus = 400 | 404 | 409;

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "packing"
  | "shipping"
  | "delivered"
  | "cancelled"
  | "returned";

export type PaymentStatus = "unpaid" | "paid" | "refunded";

export interface VietQrDetails {
  standard: "VietQR-NAPAS247";
  bankId: string;
  accountNo: string;
  accountName: string;
  amount: number;
  orderCode: string;
  qrUrl: string;
  payload: string;
}

export interface CreateOrderItemInput {
  sku?: string;
  slug?: string;
  quantity: number;
  price?: number;
  name?: string;
}

export interface CreatePostgresOrderInput {
  idempotencyKey: string;
  userId?: string | null;
  branchId?: string | null;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  deliveryType?: string;
  paymentMethod?: string;
  notes?: string;
  items: CreateOrderItemInput[];
}

export interface PostgresOrderItemRecord {
  id: string;
  orderId: string;
  productId: string;
  sku: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface PostgresOrderRecord {
  id: string;
  orderCode: string;
  userId: string | null;
  branchId: string | null;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  deliveryType: string;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  notes: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface PostgresOrderWithItems extends PostgresOrderRecord {
  items: PostgresOrderItemRecord[];
}

export interface CreatePostgresOrderResult {
  code: string;
  orderCode: string;
  order: PostgresOrderRecord;
  items: PostgresOrderItemRecord[];
  replayed: boolean;
}

export interface TransitionPostgresOrderStatusInput {
  orderId: string;
  expectedVersion: number;
  toStatus: OrderStatus;
  actorId?: string | null;
  note?: string;
}

/** Domain validation or state-conflict error mapped directly to HTTP status codes. */
export class OrderInputError extends Error {
  readonly status: OrderErrorStatus;
  readonly code: string;

  constructor(code: string, status: OrderErrorStatus = 400, message?: string) {
    super(message || code);
    this.name = "OrderInputError";
    this.code = code;
    this.status = status;
  }
}

const PHONE_REGEX = /^0\d{9}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_SAFE_MONEY = 9007199254740991;
const FREE_SHIPPING_THRESHOLD = 90000;
const STANDARD_SHIPPING_FEE = 25000;

const VALID_DELIVERY_TYPES = new Set(["NariNow 2H", "Tiêu chuẩn"]);

const ALLOWED_STATUS_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["packing", "cancelled"],
  packing: ["shipping", "cancelled"],
  shipping: ["delivered", "returned"],
  delivered: [],
  cancelled: [],
  returned: [],
};

function asSafeInt(value: unknown, field: string): number {
  const numeric = typeof value === "number" ? value : typeof value === "string" || typeof value === "bigint" ? Number(value) : NaN;
  if (!Number.isSafeInteger(numeric) || numeric < 0 || numeric > MAX_SAFE_MONEY) {
    throw new Error(`Invalid integer column ${field}`);
  }
  return numeric;
}

function asTimestamp(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return typeof value === "string" ? value : "";
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function mapOrderRow(row: Record<string, unknown>): PostgresOrderRecord {
  return {
    id: String(row.id ?? ""),
    orderCode: String(row.order_code ?? ""),
    userId: asNullableString(row.user_id),
    branchId: asNullableString(row.branch_id),
    recipientName: String(row.recipient_name ?? ""),
    recipientPhone: String(row.recipient_phone ?? ""),
    shippingAddress: String(row.shipping_address ?? ""),
    deliveryType: String(row.delivery_type ?? ""),
    paymentMethod: String(row.payment_method ?? ""),
    paymentStatus: String(row.payment_status ?? "unpaid") as PaymentStatus,
    status: String(row.status ?? "pending") as OrderStatus,
    subtotal: asSafeInt(row.subtotal, "subtotal"),
    shippingFee: asSafeInt(row.shipping_fee, "shipping_fee"),
    discountAmount: asSafeInt(row.discount_amount ?? 0, "discount_amount"),
    totalAmount: asSafeInt(row.total_amount, "total_amount"),
    notes: typeof row.notes === "string" ? row.notes : "",
    version: asSafeInt(row.version ?? 1, "version"),
    createdAt: asTimestamp(row.created_at),
    updatedAt: asTimestamp(row.updated_at),
  };
}

function mapOrderItemRow(row: Record<string, unknown>): PostgresOrderItemRecord {
  return {
    id: String(row.id ?? ""),
    orderId: String(row.order_id ?? ""),
    productId: String(row.product_id ?? ""),
    sku: String(row.sku ?? ""),
    productName: String(row.product_name ?? ""),
    unitPrice: asSafeInt(row.unit_price, "unit_price"),
    quantity: asSafeInt(row.quantity, "quantity"),
    lineTotal: asSafeInt(row.line_total, "line_total"),
  };
}

function buildOrderCode(): string {
  const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `NARI-${dateStamp}-${suffix}`;
}

/** Generate VietQR payment image URL and transfer payload for a confirmed order amount. */
export function buildVietQrPaymentDetails(params: {
  amount: number;
  orderCode: string;
  bankId?: string;
  accountNo?: string;
  accountName?: string;
}): VietQrDetails {
  const bankId = params.bankId || process.env.VIETQR_BANK_ID || "MB";
  const accountNo = params.accountNo || process.env.VIETQR_ACCOUNT_NO || "0901234567";
  const accountName =
    params.accountName || process.env.VIETQR_ACCOUNT_NAME || "CONG TY CO PHAN NARI HOME BEAUTY AND CLINIC";
  const template = process.env.VIETQR_TEMPLATE || "compact2";
  const addInfo = encodeURIComponent(params.orderCode);
  const encodedName = encodeURIComponent(accountName);
  const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${params.amount}&addInfo=${addInfo}&accountName=${encodedName}`;
  const payload = `VIETQR|${bankId}|${accountNo}|${params.amount}|${params.orderCode}`;

  return {
    standard: "VietQR-NAPAS247",
    bankId,
    accountNo,
    accountName,
    amount: params.amount,
    orderCode: params.orderCode,
    qrUrl,
    payload,
  };
}

interface NormalizedLookupItem {
  sku: string;
  slug: string;
  quantity: number;
}

interface NormalizedCreateInput {
  idempotencyKey: string;
  userId: string | null;
  branchId: string | null;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  deliveryType: string;
  paymentMethod: string;
  notes: string;
  items: NormalizedLookupItem[];
}

function normalizeCreateOrderInput(input: CreatePostgresOrderInput): NormalizedCreateInput {
  if (!input || typeof input !== "object") {
    throw new OrderInputError("ORDER_INPUT_INVALID", 400);
  }
  const idempotencyKey = typeof input.idempotencyKey === "string" ? input.idempotencyKey.trim() : "";
  if (idempotencyKey.length < 8 || idempotencyKey.length > 128 || /[\r\n\0]/.test(idempotencyKey)) {
    throw new OrderInputError("ORDER_IDEMPOTENCY_KEY_INVALID", 400);
  }

  const recipientName = typeof input.recipientName === "string" ? input.recipientName.trim() : "";
  if (!recipientName || recipientName.length > 160) {
    throw new OrderInputError("ORDER_RECIPIENT_NAME_REQUIRED", 400);
  }

  const recipientPhone = typeof input.recipientPhone === "string" ? input.recipientPhone.trim() : "";
  if (!PHONE_REGEX.test(recipientPhone)) {
    throw new OrderInputError("ORDER_RECIPIENT_PHONE_INVALID", 400);
  }

  const shippingAddress = typeof input.shippingAddress === "string" ? input.shippingAddress.trim() : "";
  if (!shippingAddress || shippingAddress.length > 500) {
    throw new OrderInputError("ORDER_SHIPPING_ADDRESS_REQUIRED", 400);
  }

  const deliveryType =
    typeof input.deliveryType === "string" && input.deliveryType.trim()
      ? input.deliveryType.trim()
      : "NariNow 2H";
  if (!VALID_DELIVERY_TYPES.has(deliveryType)) {
    throw new OrderInputError("ORDER_DELIVERY_TYPE_INVALID", 400);
  }

  const paymentMethod =
    typeof input.paymentMethod === "string" && input.paymentMethod.trim()
      ? input.paymentMethod.trim()
      : "cod";
  if (paymentMethod.length > 64) {
    throw new OrderInputError("ORDER_PAYMENT_METHOD_INVALID", 400);
  }

  const rawBranchId = typeof input.branchId === "string" ? input.branchId.trim() : "";
  if (rawBranchId.length > 128) {
    throw new OrderInputError("ORDER_BRANCH_ID_INVALID", 400);
  }
  const branchId = rawBranchId || null;

  let userId: string | null = null;
  if (typeof input.userId === "string" && input.userId.trim()) {
    const candidate = input.userId.trim();
    if (!UUID_REGEX.test(candidate)) {
      throw new OrderInputError("ORDER_USER_ID_INVALID", 400);
    }
    userId = candidate;
  }

  const notes = typeof input.notes === "string" ? input.notes.trim().slice(0, 1000) : "";

  if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > 50) {
    throw new OrderInputError("ORDER_ITEMS_INVALID", 400);
  }

  const coalesced = new Map<string, NormalizedLookupItem>();
  for (const rawItem of input.items) {
    if (!rawItem || typeof rawItem !== "object") {
      throw new OrderInputError("ORDER_ITEMS_INVALID", 400);
    }
    const sku = typeof rawItem.sku === "string" ? rawItem.sku.trim() : "";
    const slug = typeof rawItem.slug === "string" ? rawItem.slug.trim() : "";
    if (!sku && !slug) {
      throw new OrderInputError("ORDER_ITEM_IDENTIFIER_REQUIRED", 400);
    }
    if (!Number.isInteger(rawItem.quantity) || rawItem.quantity < 1 || rawItem.quantity > 99) {
      throw new OrderInputError("ORDER_ITEM_QUANTITY_INVALID", 400);
    }

    const mapKey = sku ? `sku:${sku}` : `slug:${slug}`;
    const existing = coalesced.get(mapKey);
    if (existing) {
      const nextQty = existing.quantity + rawItem.quantity;
      if (nextQty > 99) {
        throw new OrderInputError("ORDER_ITEM_QUANTITY_INVALID", 400);
      }
      existing.quantity = nextQty;
      if (slug && !existing.slug) existing.slug = slug;
    } else {
      coalesced.set(mapKey, { sku, slug, quantity: rawItem.quantity });
    }
  }

  return {
    idempotencyKey,
    userId,
    branchId,
    recipientName,
    recipientPhone,
    shippingAddress,
    deliveryType,
    paymentMethod,
    notes,
    items: [...coalesced.values()],
  };
}

interface ResolvedProductLine {
  productId: string;
  sku: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

async function resolveMerchantProducts(
  conn: CatalogSqlConnection,
  items: readonly NormalizedLookupItem[],
): Promise<ResolvedProductLine[]> {
  const skus = [...new Set(items.map((item) => item.sku).filter(Boolean))];
  const slugs = [...new Set(items.map((item) => item.slug).filter(Boolean))];

  const productResult = await conn.query(
    `SELECT p.id, p.sku, p.slug, p.name, p.price
     FROM nari_catalog.products p
     WHERE p.hidden_at IS NULL
       AND NOT p.is_demo
       AND (
         p.source_id IS NULL
         OR EXISTS (
           SELECT 1
           FROM nari_catalog.sources s
           WHERE s.id = p.source_id
             AND s.verification_state = 'merchant'
         )
       )
       AND (p.sku = ANY($1::text[]) OR p.slug = ANY($2::text[]))
     ORDER BY p.sku ASC`,
    [skus, slugs],
  );

  const bySku = new Map<string, Record<string, unknown>>();
  const bySlug = new Map<string, Record<string, unknown>>();
  for (const row of productResult.rows) {
    bySku.set(String(row.sku), row);
    bySlug.set(String(row.slug), row);
  }

  const byProductId = new Map<string, ResolvedProductLine>();
  for (const item of items) {
    let matched: Record<string, unknown> | undefined;
    if (item.sku) {
      matched = bySku.get(item.sku);
      if (matched && item.slug && String(matched.slug) !== item.slug) {
        matched = undefined;
      }
    } else if (item.slug) {
      matched = bySlug.get(item.slug);
    }

    if (!matched) {
      throw new OrderInputError("ORDER_PRODUCT_NOT_FOUND", 404);
    }

    const productId = String(matched.id);
    const unitPrice = asSafeInt(matched.price, "price");
    const existing = byProductId.get(productId);
    if (existing) {
      const nextQuantity = existing.quantity + item.quantity;
      if (nextQuantity > 99) {
        throw new OrderInputError("ORDER_ITEM_QUANTITY_INVALID", 400);
      }
      existing.quantity = nextQuantity;
      existing.lineTotal = existing.unitPrice * nextQuantity;
    } else {
      byProductId.set(productId, {
        productId,
        sku: String(matched.sku),
        name: String(matched.name),
        unitPrice,
        quantity: item.quantity,
        lineTotal: unitPrice * item.quantity,
      });
    }
  }

  return [...byProductId.values()].sort((a, b) => (a.sku < b.sku ? -1 : a.sku > b.sku ? 1 : 0));
}

async function reserveBranchInventory(
  conn: CatalogSqlConnection,
  params: {
    branchId: string;
    orderCode: string;
    idempotencyKey: string;
    actorId: string;
    lines: readonly ResolvedProductLine[];
  },
): Promise<void> {
  const branchRes = await conn.query(
    `SELECT b.id
     FROM nari_catalog.branches b
     WHERE b.id = $1
       AND b.is_active = true
       AND NOT b.is_demo
       AND (
         b.source_id IS NULL
         OR EXISTS (
           SELECT 1
           FROM nari_catalog.sources s
           WHERE s.id = b.source_id
             AND s.verification_state = 'merchant'
         )
       )`,
    [params.branchId],
  );
  if (branchRes.rows.length === 0) {
    throw new OrderInputError("ORDER_BRANCH_NOT_FOUND", 404);
  }

  // Acquire locks in canonical product_id ASC order to avoid deadlocks under concurrent orders.
  const linesByProductId = [...params.lines].sort((a, b) =>
    a.productId < b.productId ? -1 : a.productId > b.productId ? 1 : 0,
  );
  const productIds = linesByProductId.map((line) => line.productId);

  const balanceRes = await conn.query(
    `SELECT product_id, total_stock, reserved_stock
     FROM nari_catalog.inventory_balances
     WHERE branch_id = $1 AND product_id = ANY($2::text[])
     ORDER BY product_id ASC
     FOR NO KEY UPDATE`,
    [params.branchId, productIds],
  );

  const balances = new Map<string, { totalStock: number; reservedStock: number }>();
  for (const row of balanceRes.rows) {
    balances.set(String(row.product_id), {
      totalStock: asSafeInt(row.total_stock, "total_stock"),
      reservedStock: asSafeInt(row.reserved_stock, "reserved_stock"),
    });
  }

  for (const line of linesByProductId) {
    const balance = balances.get(line.productId);
    const available = balance ? balance.totalStock - balance.reservedStock : 0;
    if (!balance || available < line.quantity) {
      throw new OrderInputError("ORDER_INSUFFICIENT_STOCK", 409);
    }
  }

  for (const line of linesByProductId) {
    const balance = balances.get(line.productId)!;
    const previousStock = balance.totalStock - balance.reservedStock;
    const delta = -line.quantity;
    const newStock = previousStock + delta;

    const updated = await conn.query(
      `UPDATE nari_catalog.inventory_balances
       SET reserved_stock = reserved_stock + $3,
           updated_at = now()
       WHERE branch_id = $1
         AND product_id = $2
         AND (total_stock - reserved_stock) >= $3
       RETURNING product_id`,
      [params.branchId, line.productId, line.quantity],
    );
    if (updated.rows.length === 0) {
      throw new OrderInputError("ORDER_INSUFFICIENT_STOCK", 409);
    }

    await conn.query(
      `INSERT INTO nari_catalog.inventory_movements (
         id, branch_id, product_id, delta, previous_stock, new_stock, reason, actor_id, idempotency_key
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        randomUUID(),
        params.branchId,
        line.productId,
        delta,
        previousStock,
        newStock,
        `order_reserve:${params.orderCode}`,
        params.actorId,
        `order:${params.idempotencyKey}:reserve:${line.productId}`,
      ],
    );
  }
}

function parseCachedOrderResponse(raw: unknown): CreatePostgresOrderResult | null {
  const parsed = typeof raw === "string" ? (JSON.parse(raw) as unknown) : raw;
  if (!parsed || typeof parsed !== "object") return null;
  const record = parsed as Record<string, unknown>;
  if (
    typeof record.orderCode !== "string" ||
    !record.order ||
    typeof record.order !== "object" ||
    !Array.isArray(record.items)
  ) {
    return null;
  }
  return {
    code: record.orderCode,
    orderCode: record.orderCode,
    order: record.order as PostgresOrderRecord,
    items: record.items as PostgresOrderItemRecord[],
    replayed: true,
  };
}

/** Create an order atomically in PostgreSQL with server-side pricing, idempotency, and branch stock reservation. */
export async function createPostgresOrder(
  database: CatalogSqlDatabase,
  input: CreatePostgresOrderInput,
): Promise<CreatePostgresOrderResult> {
  const normalized = normalizeCreateOrderInput(input);

  return database.transaction(async (conn) => {
    const claim = await conn.query(
      `INSERT INTO nari_orders.idempotency_keys (key, scope, status)
       VALUES ($1, 'create_order', 'processing')
       ON CONFLICT (key) DO NOTHING
       RETURNING key`,
      [normalized.idempotencyKey],
    );

    if (claim.rows.length === 0) {
      const existingRes = await conn.query(
        `SELECT scope, status, response_status, response_body
         FROM nari_orders.idempotency_keys
         WHERE key = $1`,
        [normalized.idempotencyKey],
      );
      const existing = existingRes.rows[0];
      if (!existing || existing.scope !== "create_order") {
        throw new OrderInputError("ORDER_IDEMPOTENCY_CONFLICT", 409);
      }
      if (existing.status === "completed" && existing.response_body) {
        const cached = parseCachedOrderResponse(existing.response_body);
        if (cached) return cached;
      }
      throw new OrderInputError("ORDER_IDEMPOTENCY_IN_PROGRESS", 409);
    }

    const resolvedLines = await resolveMerchantProducts(conn, normalized.items);
    const subtotal = resolvedLines.reduce((sum, line) => sum + line.lineTotal, 0);
    const shippingFee =
      normalized.deliveryType === "NariNow 2H" && subtotal >= FREE_SHIPPING_THRESHOLD
        ? 0
        : STANDARD_SHIPPING_FEE;
    const totalAmount = subtotal + shippingFee;
    if (subtotal > MAX_SAFE_MONEY || totalAmount > MAX_SAFE_MONEY) {
      throw new OrderInputError("ORDER_AMOUNT_OUT_OF_RANGE", 400);
    }

    const orderId = randomUUID();
    const orderCode = buildOrderCode();
    const actorId = normalized.userId ?? "customer:checkout";

    if (normalized.branchId) {
      await reserveBranchInventory(conn, {
        branchId: normalized.branchId,
        orderCode,
        idempotencyKey: normalized.idempotencyKey,
        actorId,
        lines: resolvedLines,
      });
    }

    const orderRes = await conn.query(
      `INSERT INTO nari_orders.orders (
         id, order_code, user_id, branch_id, recipient_name, recipient_phone,
         shipping_address, delivery_type, payment_method, payment_status,
         status, subtotal, shipping_fee, discount_amount, total_amount, notes
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'unpaid', 'pending', $10, $11, 0, $12, $13)
       RETURNING id, order_code, user_id, branch_id, recipient_name, recipient_phone,
                 shipping_address, delivery_type, payment_method, payment_status,
                 status, subtotal, shipping_fee, discount_amount, total_amount,
                 notes, version, created_at, updated_at`,
      [
        orderId,
        orderCode,
        normalized.userId,
        normalized.branchId,
        normalized.recipientName,
        normalized.recipientPhone,
        normalized.shippingAddress,
        normalized.deliveryType,
        normalized.paymentMethod,
        subtotal,
        shippingFee,
        totalAmount,
        normalized.notes,
      ],
    );
    const order = mapOrderRow(orderRes.rows[0]);

    const items: PostgresOrderItemRecord[] = [];
    for (const line of resolvedLines) {
      const itemRes = await conn.query(
        `INSERT INTO nari_orders.order_items (
           id, order_id, product_id, sku, product_name, unit_price, quantity, line_total
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, order_id, product_id, sku, product_name, unit_price, quantity, line_total`,
        [
          randomUUID(),
          order.id,
          line.productId,
          line.sku,
          line.name,
          line.unitPrice,
          line.quantity,
          line.lineTotal,
        ],
      );
      items.push(mapOrderItemRow(itemRes.rows[0]));
    }

    await conn.query(
      `INSERT INTO nari_orders.order_events (
         id, order_id, from_status, to_status, actor_id, note
       )
       VALUES ($1, $2, NULL, 'pending', $3, $4)`,
      [randomUUID(), order.id, actorId, "Order created"],
    );

    const responseBody = {
      code: order.orderCode,
      orderCode: order.orderCode,
      order,
      items,
    };

    await conn.query(
      `UPDATE nari_orders.idempotency_keys
       SET status = 'completed',
           response_status = 201,
           response_body = $2::jsonb
       WHERE key = $1`,
      [normalized.idempotencyKey, JSON.stringify(responseBody)],
    );

    return {
      ...responseBody,
      replayed: false,
    };
  });
}

/** Look up an order only when both order_code and recipient_phone match. */
export async function lookupPostgresOrder(
  database: CatalogSqlConnection,
  orderCode: string,
  recipientPhone: string,
): Promise<PostgresOrderWithItems | null> {
  const normalizedCode = typeof orderCode === "string" ? orderCode.trim() : "";
  const normalizedPhone = typeof recipientPhone === "string" ? recipientPhone.trim() : "";
  if (!normalizedCode) {
    throw new OrderInputError("ORDER_CODE_REQUIRED", 400);
  }
  if (!PHONE_REGEX.test(normalizedPhone)) {
    throw new OrderInputError("ORDER_RECIPIENT_PHONE_INVALID", 400);
  }

  const orderRes = await database.query(
    `SELECT id, order_code, user_id, branch_id, recipient_name, recipient_phone,
            shipping_address, delivery_type, payment_method, payment_status,
            status, subtotal, shipping_fee, discount_amount, total_amount,
            notes, version, created_at, updated_at
     FROM nari_orders.orders
     WHERE lower(order_code) = lower($1)
       AND recipient_phone = $2
     LIMIT 1`,
    [normalizedCode, normalizedPhone],
  );
  if (orderRes.rows.length === 0) {
    return null;
  }

  const order = mapOrderRow(orderRes.rows[0]);
  const itemsRes = await database.query(
    `SELECT id, order_id, product_id, sku, product_name, unit_price, quantity, line_total
     FROM nari_orders.order_items
     WHERE order_id = $1
     ORDER BY sku ASC, id ASC`,
    [order.id],
  );

  return {
    ...order,
    items: itemsRes.rows.map(mapOrderItemRow),
  };
}

async function releaseBranchInventory(
  conn: CatalogSqlConnection,
  params: {
    orderId: string;
    orderCode: string;
    branchId: string;
    expectedVersion: number;
    actorId: string;
  },
): Promise<void> {
  const itemRes = await conn.query(
    `SELECT product_id, quantity
     FROM nari_orders.order_items
     WHERE order_id = $1
     ORDER BY product_id ASC`,
    [params.orderId],
  );
  if (itemRes.rows.length === 0) return;

  const qtyByProductId = new Map<string, number>();
  for (const row of itemRes.rows) {
    const productId = String(row.product_id);
    const qty = asSafeInt(row.quantity, "quantity");
    qtyByProductId.set(productId, (qtyByProductId.get(productId) ?? 0) + qty);
  }

  const productIds = [...qtyByProductId.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const balanceRes = await conn.query(
    `SELECT product_id, total_stock, reserved_stock
     FROM nari_catalog.inventory_balances
     WHERE branch_id = $1 AND product_id = ANY($2::text[])
     ORDER BY product_id ASC
     FOR NO KEY UPDATE`,
    [params.branchId, productIds],
  );

  const balances = new Map<string, { totalStock: number; reservedStock: number }>();
  for (const row of balanceRes.rows) {
    balances.set(String(row.product_id), {
      totalStock: asSafeInt(row.total_stock, "total_stock"),
      reservedStock: asSafeInt(row.reserved_stock, "reserved_stock"),
    });
  }

  for (const productId of productIds) {
    const qty = qtyByProductId.get(productId)!;
    const balance = balances.get(productId);
    if (!balance || balance.reservedStock < qty) {
      throw new OrderInputError("ORDER_STOCK_RELEASE_CONFLICT", 409);
    }

    const previousStock = balance.totalStock - balance.reservedStock;
    const delta = qty;
    const newStock = previousStock + delta;

    const released = await conn.query(
      `UPDATE nari_catalog.inventory_balances
       SET reserved_stock = reserved_stock - $3,
           updated_at = now()
       WHERE branch_id = $1
         AND product_id = $2
         AND reserved_stock >= $3
       RETURNING product_id`,
      [params.branchId, productId, qty],
    );
    if (released.rows.length === 0) {
      throw new OrderInputError("ORDER_STOCK_RELEASE_CONFLICT", 409);
    }

    await conn.query(
      `INSERT INTO nari_catalog.inventory_movements (
         id, branch_id, product_id, delta, previous_stock, new_stock, reason, actor_id, idempotency_key
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        randomUUID(),
        params.branchId,
        productId,
        delta,
        previousStock,
        newStock,
        `order_cancel:${params.orderCode}`,
        params.actorId,
        `order:${params.orderId}:cancel:${params.expectedVersion}:${productId}`,
      ],
    );
  }
}

/** Transition an order status with optimistic concurrency and inventory release on cancellation. */
export async function transitionPostgresOrderStatus(
  database: CatalogSqlDatabase,
  input: TransitionPostgresOrderStatusInput,
): Promise<PostgresOrderRecord> {
  const orderId = typeof input.orderId === "string" ? input.orderId.trim() : "";
  if (!orderId) {
    throw new OrderInputError("ORDER_ID_REQUIRED", 400);
  }
  if (!Number.isInteger(input.expectedVersion) || input.expectedVersion < 1) {
    throw new OrderInputError("ORDER_VERSION_INVALID", 400);
  }
  if (!Object.hasOwn(ALLOWED_STATUS_TRANSITIONS, input.toStatus)) {
    throw new OrderInputError("ORDER_STATUS_INVALID", 400);
  }
  const actorId = typeof input.actorId === "string" && input.actorId.trim() ? input.actorId.trim() : "system";
  const note = typeof input.note === "string" ? input.note.trim().slice(0, 1000) : "";

  return database.transaction(async (conn) => {
    const existingRes = await conn.query(
      `SELECT id, order_code, user_id, branch_id, recipient_name, recipient_phone,
              shipping_address, delivery_type, payment_method, payment_status,
              status, subtotal, shipping_fee, discount_amount, total_amount,
              notes, version, created_at, updated_at
       FROM nari_orders.orders
       WHERE id = $1
       FOR UPDATE`,
      [orderId],
    );
    if (existingRes.rows.length === 0) {
      throw new OrderInputError("ORDER_NOT_FOUND", 404);
    }

    const current = mapOrderRow(existingRes.rows[0]);
    if (current.version !== input.expectedVersion) {
      throw new OrderInputError("ORDER_VERSION_CONFLICT", 409);
    }

    const allowedNext = ALLOWED_STATUS_TRANSITIONS[current.status];
    if (!allowedNext.includes(input.toStatus)) {
      throw new OrderInputError("ORDER_INVALID_TRANSITION", 409);
    }

    const updatedRes = await conn.query(
      `UPDATE nari_orders.orders
       SET status = $3,
           version = version + 1,
           updated_at = clock_timestamp()
       WHERE id = $1
         AND version = $2
       RETURNING id, order_code, user_id, branch_id, recipient_name, recipient_phone,
                 shipping_address, delivery_type, payment_method, payment_status,
                 status, subtotal, shipping_fee, discount_amount, total_amount,
                 notes, version, created_at, updated_at`,
      [orderId, input.expectedVersion, input.toStatus],
    );
    if (updatedRes.rows.length === 0) {
      throw new OrderInputError("ORDER_VERSION_CONFLICT", 409);
    }
    const updatedOrder = mapOrderRow(updatedRes.rows[0]);

    if (input.toStatus === "cancelled" && updatedOrder.branchId) {
      await releaseBranchInventory(conn, {
        orderId: updatedOrder.id,
        orderCode: updatedOrder.orderCode,
        branchId: updatedOrder.branchId,
        expectedVersion: input.expectedVersion,
        actorId,
      });
    }

    await conn.query(
      `INSERT INTO nari_orders.order_events (
         id, order_id, from_status, to_status, actor_id, note
       )
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [randomUUID(), updatedOrder.id, current.status, input.toStatus, actorId, note],
    );

    return updatedOrder;
  });
}
