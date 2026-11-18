/**
 * Enterprise Database Repository Layer.
 * Unified interface for White-label Retail + Clinic system.
 * Currently delegates to SQLite. PostgreSQL is planned, not implemented here.
 */

import {
  listAllBranches,
  createCustomBranch,
  listProducts,
  getProductBySkuOrSlug,
  createCustomProduct,
  getProductStockByBranch,
  adjustInventoryStockSqlite,
  createOrderWithBranchStockSqlite,
  listOrdersSqlite,
  getOrderByIdOrCodeSqlite,
  isSeedDataEnabled,
  setSeedDataEnabled,
  clearSeedData,
  type DbBranch,
  type DbProduct,
  type DbBranchStock,
  type DbOrder,
} from "@/lib/sqlite-db";

// ---------------------------------------------------------------------------
// 1. VietQR Generator
// ---------------------------------------------------------------------------

export interface VietQrDetails {
  bankId: string;
  accountNo: string;
  accountName: string;
  amount: number;
  orderCode: string;
  qrUrl: string;
  payload: string;
}

export function generateVietQrPaymentDetails(params: {
  amount: number;
  orderCode: string;
  bankId?: string;
  accountNo?: string;
  accountName?: string;
}): VietQrDetails {
  const bankId = params.bankId || process.env.VIETQR_BANK_ID || "MB";
  const accountNo = params.accountNo || process.env.VIETQR_ACCOUNT_NO || "0901234567";
  const accountName = params.accountName || process.env.VIETQR_ACCOUNT_NAME || "CONG TY CO PHAN NARI HOME BEAUTY AND CLINIC";
  const template = process.env.VIETQR_TEMPLATE || "compact2";

  const addInfo = encodeURIComponent(`Thanh toan don hang ${params.orderCode}`);
  const encodedName = encodeURIComponent(accountName);
  const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${params.amount}&addInfo=${addInfo}&accountName=${encodedName}`;

  const payloadObject = {
    standard: "VietQR-NAPAS247",
    bankId,
    accountNo,
    accountName,
    amount: params.amount,
    currency: "VND",
    orderCode: params.orderCode,
    description: `Thanh toan don hang ${params.orderCode}`,
    qrUrl,
  };

  return {
    bankId,
    accountNo,
    accountName,
    amount: params.amount,
    orderCode: params.orderCode,
    qrUrl,
    payload: JSON.stringify(payloadObject),
  };
}

// ---------------------------------------------------------------------------
// 2. Repository Functions
// ---------------------------------------------------------------------------

// Branches
export async function getBranches(onlyActive = true): Promise<DbBranch[]> {
  return listAllBranches(onlyActive);
}

export async function createBranch(input: {
  code: string;
  name: string;
  address: string;
  city: string;
  district: string;
  phone: string;
  supportsNowFree2H?: boolean;
  supportsClinic?: boolean;
}): Promise<DbBranch> {
  return createCustomBranch(input);
}

// Products
export async function getProducts(filter?: {
  search?: string;
  category?: string;
  brand?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: DbProduct[]; total: number }> {
  return listProducts(filter);
}

export async function getProduct(skuOrSlug: string): Promise<DbProduct | null> {
  return getProductBySkuOrSlug(skuOrSlug);
}

export async function createProduct(input: {
  sku: string;
  name: string;
  price: number;
  marketPrice?: number;
  brandName?: string;
  categorySlug?: string;
  description?: string;
  thumbnailUrl?: string;
  initialStock?: number;
  branchId?: string;
}): Promise<DbProduct> {
  return createCustomProduct(input);
}

// Inventory & Branch Stock
export async function getInventoryStock(sku: string): Promise<DbBranchStock[]> {
  return getProductStockByBranch(sku);
}

export async function adjustInventoryStock(params: {
  branchId: string;
  sku: string;
  delta: number;
  reason: string;
  staffCode: string;
}): Promise<{ previousStock: number; newStock: number; auditLogId: string }> {
  return adjustInventoryStockSqlite(params);
}

// Orders & Checkout with VietQR
export async function createOrder(input: {
  userId?: string | null;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  branchId?: string;
  deliveryType?: "NariNow 2H" | "Tiêu chuẩn";
  paymentMethod?: string;
  items: Array<{ sku: string; quantity: number; name?: string; price?: number; slug?: string; image?: string }>;
  notes?: string;
}): Promise<DbOrder> {
  // Compute provisional subtotal for VietQR generation
  const tempSubtotal = input.items.reduce((sum, item) => sum + (item.price || 100000) * item.quantity, 0);
  const tempShipping = input.deliveryType === "NariNow 2H" && tempSubtotal >= 90000 ? 0 : 25000;
  const tempTotal = tempSubtotal + tempShipping;
  const provisionalCode = `HSK-${Date.now().toString().slice(-6)}`;

  let vietQrPayload: string | undefined;
  let vietQrUrl: string | undefined;

  // Generate VietQR details if payment method is VietQR or bank transfer
  const isQrPayment = !input.paymentMethod ||
    input.paymentMethod.toLowerCase().includes("qr") ||
    input.paymentMethod.toLowerCase().includes("chuyển khoản") ||
    input.paymentMethod.toLowerCase().includes("vietqr");

  if (isQrPayment) {
    const qr = generateVietQrPaymentDetails({
      amount: tempTotal,
      orderCode: provisionalCode,
    });
    vietQrPayload = qr.payload;
    vietQrUrl = qr.qrUrl;
  }

  return createOrderWithBranchStockSqlite({
    ...input,
    vietQrPayload,
    vietQrUrl,
  });
}

export async function listOrders(filter?: {
  search?: string;
  status?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: DbOrder[]; total: number }> {
  return listOrdersSqlite(filter);
}

export async function getOrderByIdOrCode(key: string): Promise<DbOrder | null> {
  return getOrderByIdOrCodeSqlite(key);
}

// Seed Data Switch
export function isSeedActive(): boolean {
  return isSeedDataEnabled();
}

export function toggleSeedData(enabled: boolean): void {
  setSeedDataEnabled(enabled);
}

export function purgeSeedData(): { deletedProducts: number; deletedServices: number; deletedBrands: number } {
  return clearSeedData();
}
