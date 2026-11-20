import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import type { StoreBranchInfo } from "@/lib/backend-contracts";
import type { ClinicServiceItem } from "@/lib/clinic-services";
import type { CatalogSqlConnection } from "@/lib/server/postgres-catalog-repository";

export class ClinicBookingError extends Error {
  readonly status: 400 | 404 | 409;
  readonly code: string;

  constructor(code: string, status: 400 | 404 | 409, message?: string) {
    super(message || code);
    this.name = "ClinicBookingError";
    this.status = status;
    this.code = code;
  }
}

export interface PostgresBranchFilter {
  city?: string;
  district?: string;
  hasClinic?: boolean;
  query?: string;
}

export interface CreatePostgresBookingInput {
  customerName: string;
  customerPhone: string;
  branchId: string;
  serviceId?: string | null;
  serviceName?: string;
  date: string;
  time: string;
  durationMinutes?: number;
  notes?: string;
  userId?: string | null;
}

export interface PostgresBookingRecord {
  id: string;
  bookingCode: string;
  branchId: string;
  branchName: string;
  branchAddress: string;
  serviceId: string | null;
  serviceName: string;
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  durationMinutes: number;
  startAt: string;
  endAt: string;
  status: string;
  notes: string;
  createdAt: string;
}

function text(value: unknown): string {
  if (typeof value !== "string") throw new Error("CLINIC_ROW_INVALID");
  return value;
}

function integer(value: unknown): number {
  if (typeof value !== "number" && typeof value !== "string" && typeof value !== "bigint") {
    throw new Error("CLINIC_INTEGER_INVALID");
  }
  if (typeof value === "string" && !/^\d+$/.test(value)) {
    throw new Error("CLINIC_INTEGER_INVALID");
  }
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < 0) {
    throw new Error("CLINIC_INTEGER_INVALID");
  }
  return result;
}

function timestamp(value: unknown): string {
  const date = value instanceof Date ? value : new Date(text(value));
  if (!Number.isFinite(date.valueOf())) throw new Error("CLINIC_DATE_INVALID");
  return typeof value === "string" ? value : date.toISOString();
}

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

function extractPgErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  if ("code" in error && typeof error.code === "string") return error.code;
  if (
    "cause" in error &&
    error.cause &&
    typeof error.cause === "object" &&
    "code" in error.cause &&
    typeof error.cause.code === "string"
  ) {
    return error.cause.code;
  }
  return undefined;
}

/** Query active, non-demo branches from PostgreSQL for Store Locator and Clinic Booking. */
export async function listPostgresBranches(
  database: CatalogSqlConnection,
  filter?: PostgresBranchFilter,
): Promise<StoreBranchInfo[]> {
  const conditions: string[] = [
    "b.is_active = true",
    "NOT b.is_demo",
    "(b.source_id IS NULL OR s.verification_state = 'merchant')",
  ];
  const values: unknown[] = [];

  const city = filter?.city?.trim();
  if (city && city !== "Tất cả Tỉnh/Thành") {
    values.push(city);
    conditions.push(`LOWER(b.city) = LOWER($${values.length})`);
  }

  const district = filter?.district?.trim();
  if (district && district !== "Tất cả Quận/Huyện") {
    values.push(district);
    conditions.push(`LOWER(b.district) = LOWER($${values.length})`);
  }

  if (filter?.hasClinic === true) {
    conditions.push("b.supports_clinic = true");
  }

  const queryText = filter?.query?.trim();
  if (queryText) {
    values.push(`%${escapeLikePattern(queryText)}%`);
    const idx = `$${values.length}`;
    conditions.push(
      `(b.name ILIKE ${idx} ESCAPE '\\' OR b.address ILIKE ${idx} ESCAPE '\\' OR b.city ILIKE ${idx} ESCAPE '\\' OR b.district ILIKE ${idx} ESCAPE '\\')`,
    );
  }

  const result = await database.query(
    `SELECT b.id, b.name, b.address, b.city, b.district, b.phone, b.supports_clinic, b.supports_nowfree_2h
     FROM nari_catalog.branches b
     LEFT JOIN nari_catalog.sources s ON s.id = b.source_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY b.city ASC, b.district ASC, b.name ASC, b.id ASC`,
    values,
  );

  return result.rows.map((row) => ({
    id: text(row.id),
    name: text(row.name),
    address: text(row.address),
    city: text(row.city),
    district: text(row.district),
    ...(typeof row.phone === "string" && row.phone.trim() ? { phone: row.phone } : {}),
    hasClinic: Boolean(row.supports_clinic),
    supportsNowfree2h: Boolean(row.supports_nowfree_2h),
  }));
}

/** Query active clinic services from PostgreSQL and format them for storefront Clinic views. */
export async function listPostgresClinicServices(
  database: CatalogSqlConnection,
): Promise<ClinicServiceItem[]> {
  const result = await database.query(
    `SELECT id, sku, slug, name, category, price, market_price, duration_minutes, description, image_url
     FROM nari_clinic.services
     WHERE is_active = true
     ORDER BY created_at ASC, id ASC`,
  );

  return result.rows.map((row) => {
    const sku = text(row.sku);
    const slug = text(row.slug);
    const price = integer(row.price);
    const durationMinutes = integer(row.duration_minutes);
    const normalizedSlug = slug.startsWith("/") ? slug.slice(1) : slug;
    return {
      id: text(row.id),
      name: text(row.name),
      url: normalizedSlug.startsWith("dich-vu/") ? `/${normalizedSlug}` : `/dich-vu/${normalizedSlug}`,
      slug,
      image: typeof row.image_url === "string" ? row.image_url : "",
      price: `${new Intl.NumberFormat("vi-VN").format(price)} ₫`,
      duration: `${durationMinutes} phút`,
      booking: `/booking?sku=${sku}`,
      description: typeof row.description === "string" ? row.description : "",
    };
  });
}

/** Safe SSR loader for Store Locator and Booking pages; never throws when DB is absent/unavailable. */
export async function readPostgresBranchesSafely(
  getDatabase: () => CatalogSqlConnection,
  filter?: PostgresBranchFilter,
): Promise<StoreBranchInfo[]> {
  if (!process.env.NARI_POSTGRES_URL?.trim()) return [];
  try {
    return await listPostgresBranches(getDatabase(), filter);
  } catch {
    return [];
  }
}

/** Safe SSR loader for Clinic service pages; returns [] cleanly when DB is absent/unavailable. */
export async function readPostgresClinicServicesSafely(
  getDatabase: () => CatalogSqlConnection,
): Promise<ClinicServiceItem[]> {
  if (!process.env.NARI_POSTGRES_URL?.trim()) return [];
  try {
    return await listPostgresClinicServices(getDatabase());
  } catch {
    return [];
  }
}

/** Validate booking inputs, verify active clinic branch, and enforce GiST time-slot exclusivity. */
export async function createPostgresBooking(
  database: CatalogSqlConnection,
  input: CreatePostgresBookingInput,
): Promise<PostgresBookingRecord> {
  const customerName = typeof input.customerName === "string" ? input.customerName.trim() : "";
  const customerPhone = typeof input.customerPhone === "string" ? input.customerPhone.trim() : "";
  const branchId = typeof input.branchId === "string" ? input.branchId.trim() : "";
  const rawServiceId = typeof input.serviceId === "string" ? input.serviceId.trim() : "";
  const rawServiceName = typeof input.serviceName === "string" ? input.serviceName.trim() : "";
  const date = typeof input.date === "string" ? input.date.trim() : "";
  const time = typeof input.time === "string" ? input.time.trim() : "";
  const durationMinutes = input.durationMinutes === undefined ? 60 : input.durationMinutes;
  const notes = typeof input.notes === "string" ? input.notes.trim().slice(0, 500) : "";
  const rawUserId = typeof input.userId === "string" ? input.userId.trim() : "";
  const userId = rawUserId || null;

  if (!customerName || customerName.length > 120 || !branchId || branchId.length > 120) {
    throw new ClinicBookingError("BOOKING_INPUT_INVALID", 400);
  }
  if (!/^0\d{9}$/.test(customerPhone)) {
    throw new ClinicBookingError("BOOKING_PHONE_INVALID", 400);
  }
  if (!rawServiceId && !rawServiceName) {
    throw new ClinicBookingError("BOOKING_INPUT_INVALID", 400);
  }
  if (rawServiceName.length > 200) {
    throw new ClinicBookingError("BOOKING_INPUT_INVALID", 400);
  }
  if (userId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    throw new ClinicBookingError("BOOKING_INPUT_INVALID", 400);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw new ClinicBookingError("BOOKING_DATETIME_INVALID", 400);
  }
  if (
    typeof durationMinutes !== "number" ||
    !Number.isInteger(durationMinutes) ||
    durationMinutes < 15 ||
    durationMinutes > 240
  ) {
    throw new ClinicBookingError("BOOKING_DURATION_INVALID", 400);
  }

  const startIso = `${date}T${time}:00+07:00`;
  const startMs = Date.parse(startIso);
  if (!Number.isFinite(startMs)) {
    throw new ClinicBookingError("BOOKING_DATETIME_INVALID", 400);
  }
  const vnTime = new Date(startMs + 7 * 60 * 60 * 1000);
  if (vnTime.toISOString().slice(0, 10) !== date || vnTime.toISOString().slice(11, 16) !== time) {
    throw new ClinicBookingError("BOOKING_DATETIME_INVALID", 400);
  }
  const endMs = startMs + durationMinutes * 60_000;
  if (!Number.isFinite(endMs) || endMs <= startMs) {
    throw new ClinicBookingError("BOOKING_DATETIME_INVALID", 400);
  }
  const endIso = new Date(endMs).toISOString();

  const branchResult = await database.query(
    `SELECT b.id, b.name, b.address
     FROM nari_catalog.branches b
     LEFT JOIN nari_catalog.sources s ON s.id = b.source_id
     WHERE b.id = $1
       AND b.is_active = true
       AND NOT b.is_demo
       AND (b.source_id IS NULL OR s.verification_state = 'merchant')
       AND b.supports_clinic = true`,
    [branchId],
  );
  if (branchResult.rows.length !== 1) {
    throw new ClinicBookingError("CLINIC_BRANCH_NOT_FOUND", 404);
  }
  const branchRow = branchResult.rows[0];

  let resolvedServiceId: string | null = null;
  let resolvedServiceName = rawServiceName;
  if (rawServiceId) {
    const serviceResult = await database.query(
      `SELECT id, name
       FROM nari_clinic.services
       WHERE id = $1 AND is_active = true`,
      [rawServiceId],
    );
    if (serviceResult.rows.length !== 1) {
      throw new ClinicBookingError("CLINIC_SERVICE_NOT_FOUND", 404);
    }
    resolvedServiceId = text(serviceResult.rows[0].id);
    if (!resolvedServiceName) {
      resolvedServiceName = text(serviceResult.rows[0].name);
    }
  }

  const id = randomUUID();
  const bookingCode = `BK-${date.replace(/-/g, "")}-${randomBytes(4).toString("hex").toUpperCase()}`;

  try {
    const inserted = await database.query(
      `INSERT INTO nari_clinic.appointments (
         id, booking_code, branch_id, service_id, service_name,
         user_id, customer_name, customer_phone, during, status, notes
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, tstzrange($9::timestamptz, $10::timestamptz, '[)'), 'booked', $11)
       RETURNING id, booking_code, branch_id, service_id, service_name,
                 customer_name, customer_phone, status, notes, created_at`,
      [
        id,
        bookingCode,
        branchId,
        resolvedServiceId,
        resolvedServiceName,
        userId,
        customerName,
        customerPhone,
        startIso,
        endIso,
        notes,
      ],
    );
    const row = inserted.rows[0];
    return {
      id: text(row.id),
      bookingCode: text(row.booking_code),
      branchId: text(row.branch_id),
      branchName: text(branchRow.name),
      branchAddress: text(branchRow.address),
      serviceId: typeof row.service_id === "string" ? row.service_id : null,
      serviceName: text(row.service_name),
      customerName: text(row.customer_name),
      customerPhone: text(row.customer_phone),
      date,
      time,
      durationMinutes,
      startAt: new Date(startMs).toISOString(),
      endAt: endIso,
      status: text(row.status),
      notes: typeof row.notes === "string" ? row.notes : "",
      createdAt: timestamp(row.created_at),
    };
  } catch (error) {
    if (extractPgErrorCode(error) === "23P01") {
      throw new ClinicBookingError("BOOKING_SLOT_CONFLICT", 409);
    }
    throw error;
  }
}
