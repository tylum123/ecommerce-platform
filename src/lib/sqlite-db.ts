/**
 * White-Label Retail + Clinic SQLite Engine for Hasaki Clone.
 * Powered by Node.js built-in `node:sqlite` (DatabaseSync).
 * Supports seamless multi-branch inventory, zero-dependency embedded transactions,
 * brand/catalog white-label isolation, and the Seed Data Switch.
 */

import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

// ---------------------------------------------------------------------------
// 1. Database Connection Management
// ---------------------------------------------------------------------------

let dbInstance: DatabaseSync | null = null;

function resolveDatabasePath(): string {
  if (process.env.SQLITE_DB_PATH && process.env.SQLITE_DB_PATH.trim()) {
    return process.env.SQLITE_DB_PATH.trim();
  }

  // Use OS temp dir or local folder to avoid OneDrive file-locking issues on Windows
  const targetDir = path.join(os.tmpdir(), "hasaki-db");
  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    return path.join(targetDir, "hasaki-store.db");
  } catch {
    return ":memory:";
  }
}

export function getSqliteDb(): DatabaseSync {
  if (!dbInstance) {
    const dbPath = resolveDatabasePath();
    try {
      dbInstance = new DatabaseSync(dbPath);
    } catch {
      // In case of any filesystem lock, fallback safely to memory
      dbInstance = new DatabaseSync(":memory:");
    }

    // Enable WAL mode & foreign keys for optimal speed and reliability
    try {
      dbInstance.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
    } catch {
      // Memory db pragma tolerance
    }

    initializeDatabaseSchema(dbInstance);
    seedInitialDataIfNecessary(dbInstance);
  }
  return dbInstance;
}

// ---------------------------------------------------------------------------
// 2. Schema DDL & Indexes
// ---------------------------------------------------------------------------

function initializeDatabaseSchema(db: DatabaseSync): void {
  db.exec(`
    -- Branches: Multi-Branch architecture (1..N branches)
    CREATE TABLE IF NOT EXISTS branches (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      district TEXT NOT NULL,
      phone TEXT NOT NULL,
      supports_nowfree_2h INTEGER NOT NULL DEFAULT 1,
      supports_clinic INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      is_seed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    -- Categories: Hierarchical retail & clinic catalog categories
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      parent_id TEXT,
      icon TEXT,
      display_order INTEGER DEFAULT 0,
      is_seed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    -- Brands: White-label brand management
    CREATE TABLE IF NOT EXISTS brands (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      logo_url TEXT,
      country TEXT,
      is_seed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    -- Products: Retail products catalog
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      sku TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      english_name TEXT,
      brand_id TEXT,
      brand_name TEXT,
      category_id TEXT,
      category_slug TEXT,
      price INTEGER NOT NULL,
      market_price INTEGER,
      discount_percent INTEGER DEFAULT 0,
      rating REAL DEFAULT 5.0,
      review_count INTEGER DEFAULT 0,
      sold_count INTEGER DEFAULT 0,
      description TEXT,
      thumbnail_url TEXT,
      is_seed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    -- Product Variants: Capacities, shades, sizes
    CREATE TABLE IF NOT EXISTS product_variants (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      option_name TEXT,
      option_value TEXT,
      price INTEGER NOT NULL,
      market_price INTEGER,
      thumbnail_url TEXT,
      is_seed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    -- Multi-Branch Inventory Balances
    CREATE TABLE IF NOT EXISTS inventory_balances (
      branch_id TEXT NOT NULL,
      sku TEXT NOT NULL,
      total_stock INTEGER NOT NULL DEFAULT 0,
      reserved_stock INTEGER NOT NULL DEFAULT 0,
      available_stock INTEGER NOT NULL DEFAULT 0,
      reorder_point INTEGER NOT NULL DEFAULT 10,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (branch_id, sku)
    );

    -- Clinic / Spa Dermatology Services
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price INTEGER NOT NULL,
      market_price INTEGER,
      duration_minutes INTEGER DEFAULT 60,
      description TEXT,
      steps_count INTEGER DEFAULT 7,
      is_seed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    -- Users & Staff RBAC
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      phone TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      role_label TEXT,
      tier TEXT NOT NULL DEFAULT 'Member',
      loyalty_points INTEGER NOT NULL DEFAULT 0,
      total_spent INTEGER NOT NULL DEFAULT 0,
      orders_count INTEGER NOT NULL DEFAULT 0,
      address TEXT,
      branch_id TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      is_seed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    -- Customer & Staff Orders
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_code TEXT UNIQUE NOT NULL,
      user_id TEXT,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      shipping_address TEXT NOT NULL,
      branch_id TEXT NOT NULL,
      branch_name TEXT NOT NULL,
      delivery_type TEXT NOT NULL DEFAULT 'NowFree 2H',
      payment_method TEXT NOT NULL DEFAULT 'COD',
      payment_status TEXT NOT NULL DEFAULT 'unpaid',
      status TEXT NOT NULL DEFAULT 'pending',
      subtotal INTEGER NOT NULL DEFAULT 0,
      shipping_fee INTEGER NOT NULL DEFAULT 0,
      discount INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL DEFAULT 0,
      vietqr_payload TEXT,
      vietqr_url TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Order Line Items
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      sku TEXT NOT NULL,
      product_name TEXT NOT NULL,
      variant_name TEXT,
      price INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      subtotal INTEGER NOT NULL,
      slug TEXT,
      image TEXT
    );

    -- Clinic Appointments / Bookings
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      service_name TEXT NOT NULL,
      branch_name TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed',
      notes TEXT,
      created_at TEXT NOT NULL
    );

    -- Inventory Audit Logs
    CREATE TABLE IF NOT EXISTS inventory_audit_logs (
      id TEXT PRIMARY KEY,
      sku TEXT NOT NULL,
      product_name TEXT NOT NULL,
      delta INTEGER NOT NULL,
      previous_stock INTEGER NOT NULL,
      new_stock INTEGER NOT NULL,
      reason TEXT NOT NULL,
      staff_code TEXT NOT NULL,
      branch_id TEXT NOT NULL,
      branch_name TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );

    -- System Configuration Settings (e.g. Seed Data switch)
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Indexes for high-frequency queries
    CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
    CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
    CREATE INDEX IF NOT EXISTS idx_products_is_seed ON products(is_seed);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_code ON orders(order_code);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory_balances(sku);
    CREATE INDEX IF NOT EXISTS idx_inventory_branch ON inventory_balances(branch_id);
    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);
}

// ---------------------------------------------------------------------------
// 3. Types
// ---------------------------------------------------------------------------

export interface DbBranch {
  id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  district: string;
  phone: string;
  supportsNowFree2H: boolean;
  supportsClinic: boolean;
  isActive: boolean;
  isSeed: boolean;
  createdAt: string;
}

export interface DbCategory {
  id: string;
  slug: string;
  name: string;
  parentId: string | null;
  icon: string | null;
  displayOrder: number;
  isSeed: boolean;
  createdAt: string;
}

export interface DbBrand {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  country: string | null;
  isSeed: boolean;
  createdAt: string;
}

export interface DbProduct {
  id: string;
  sku: string;
  slug: string;
  name: string;
  englishName: string | null;
  brandId: string | null;
  brandName: string | null;
  categoryId: string | null;
  categorySlug: string | null;
  price: number;
  marketPrice: number | null;
  discountPercent: number;
  rating: number;
  reviewCount: number;
  soldCount: number;
  description: string | null;
  thumbnailUrl: string | null;
  isSeed: boolean;
  createdAt: string;
}

export interface DbProductVariant {
  id: string;
  productId: string;
  sku: string;
  name: string;
  optionName: string | null;
  optionValue: string | null;
  price: number;
  marketPrice: number | null;
  thumbnailUrl: string | null;
  isSeed: boolean;
  createdAt: string;
}

export interface DbBranchStock {
  branchId: string;
  branchName: string;
  sku: string;
  totalStock: number;
  reservedStock: number;
  availableStock: number;
  reorderPoint: number;
  updatedAt: string;
}

export interface DbService {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  marketPrice: number | null;
  durationMinutes: number;
  description: string | null;
  stepsCount: number;
  isSeed: boolean;
  createdAt: string;
}

export interface DbUser {
  id: string;
  email: string | null;
  phone: string;
  passwordHash: string;
  salt: string;
  fullName: string;
  role: "admin" | "store_manager" | "warehouse_staff" | "clinic_doctor" | "cs_agent" | "customer";
  roleLabel: string;
  tier: "Member" | "Silver" | "Gold" | "Diamond";
  loyaltyPoints: number;
  totalSpent: number;
  ordersCount: number;
  address: string | null;
  branchId: string | null;
  status: "active" | "locked";
  isSeed: boolean;
  createdAt: string;
}

export interface DbOrderItem {
  id: string;
  orderId: string;
  sku: string;
  productName: string;
  variantName?: string | null;
  price: number;
  quantity: number;
  subtotal: number;
  slug?: string | null;
  image?: string | null;
}

export interface DbOrder {
  id: string;
  orderCode: string;
  userId: string | null;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  branchId: string;
  branchName: string;
  deliveryType: "NowFree 2H" | "Tiêu chuẩn";
  paymentMethod: string;
  paymentStatus: "unpaid" | "paid" | "refunded";
  status: "pending" | "confirmed" | "packing" | "shipping" | "delivered" | "cancelled";
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  vietQrPayload: string | null;
  vietQrUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: DbOrderItem[];
}

export interface DbBooking {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  branchName: string;
  appointmentTime: string;
  status: "confirmed" | "Sắp tới" | "Đã hoàn thành" | "Đã hủy";
  notes: string | null;
  createdAt: string;
}

export interface DbInventoryAuditLog {
  id: string;
  sku: string;
  productName: string;
  delta: number;
  previousStock: number;
  newStock: number;
  reason: string;
  staffCode: string;
  branchId: string;
  branchName: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// 4. Seed Data Helpers & Switch
// ---------------------------------------------------------------------------

export function isSeedDataEnabled(): boolean {
  const db = getSqliteDb();
  const row = db.prepare("SELECT value FROM system_settings WHERE key = 'seed_hasaki_enabled'").get() as { value: string } | undefined;
  if (!row) {
    return process.env.SEED_HASAKI_DATA !== "false";
  }
  return row.value === "1";
}

export function setSeedDataEnabled(enabled: boolean): void {
  const db = getSqliteDb();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO system_settings (key, value, updated_at)
    VALUES ('seed_hasaki_enabled', ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(enabled ? "1" : "0", now);
}

export function clearSeedData(): { deletedProducts: number; deletedServices: number; deletedBrands: number } {
  const db = getSqliteDb();
  let deletedProducts = 0;
  let deletedServices = 0;
  let deletedBrands = 0;

  db.exec("BEGIN TRANSACTION;");
  try {
    const resProd = db.prepare("DELETE FROM products WHERE is_seed = 1").run();
    deletedProducts = Number(resProd.changes);

    db.prepare("DELETE FROM product_variants WHERE is_seed = 1").run();
    db.prepare("DELETE FROM inventory_balances WHERE sku IN (SELECT sku FROM products WHERE is_seed = 1)").run();

    const resServ = db.prepare("DELETE FROM services WHERE is_seed = 1").run();
    deletedServices = Number(resServ.changes);

    const resBrand = db.prepare("DELETE FROM brands WHERE is_seed = 1").run();
    deletedBrands = Number(resBrand.changes);

    db.prepare("DELETE FROM categories WHERE is_seed = 1").run();
    db.prepare("DELETE FROM branches WHERE is_seed = 1").run();

    setSeedDataEnabled(false);
    db.exec("COMMIT;");
  } catch (err) {
    db.exec("ROLLBACK;");
    throw err;
  }

  return { deletedProducts, deletedServices, deletedBrands };
}

function seedInitialDataIfNecessary(db: DatabaseSync): void {
  // Ensure default setting exists
  const existingSetting = db.prepare("SELECT value FROM system_settings WHERE key = 'seed_hasaki_enabled'").get();
  if (!existingSetting) {
    const defaultEnabled = process.env.SEED_HASAKI_DATA !== "false" ? "1" : "0";
    db.prepare("INSERT INTO system_settings (key, value, updated_at) VALUES ('seed_hasaki_enabled', ?, ?)")
      .run(defaultEnabled, new Date().toISOString());
  }

  // 1. Seed Branches (4 primary strategic branches: HCM, HN, DN)
  const branchCount = (db.prepare("SELECT COUNT(*) as count FROM branches").get() as { count: number }).count;
  if (branchCount === 0) {
    const now = new Date().toISOString();
    const branchStmt = db.prepare(`
      INSERT INTO branches (id, code, name, address, city, district, phone, supports_nowfree_2h, supports_clinic, is_active, is_seed, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);

    branchStmt.run("CN1", "BR-HCM-01", "CN1 - 71 Hoàng Hoa Thám, Tân Bình", "71 Hoàng Hoa Thám, Phường 13, Quận Tân Bình", "Hồ Chí Minh", "Tân Bình", "1800 6324", 1, 1, 1, now);
    branchStmt.run("CN2", "BR-HCM-02", "CN2 - 555 Đường 3/2, Quận 10", "555 Đường 3/2, Phường 8, Quận 10", "Hồ Chí Minh", "Quận 10", "1800 6324", 1, 1, 1, now);
    branchStmt.run("CN15", "BR-HAN-01", "CN15 - 182 Cầu Giấy, Hà Nội", "182 Cầu Giấy, Phường Quan Hoa, Quận Cầu Giấy", "Hà Nội", "Cầu Giấy", "1800 6324", 1, 0, 1, now);
    branchStmt.run("CN28", "BR-DAN-01", "CN28 - Nguyễn Văn Linh, Đà Nẵng", "120 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu", "Đà Nẵng", "Hải Châu", "1800 6324", 0, 0, 1, now);
  }

  // 2. Seed Default Staff & Demo Users
  const userCount = (db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number }).count;
  if (userCount === 0) {
    const now = new Date().toISOString();
    // Default password hash for "Hasaki@123" with salt "hasaki_salt_2026"
    // Using deterministic hash for fast seed initialization
    const defaultSalt = "hasaki_salt_2026";
    const defaultHash = "f9a463cbbcb071e61ea460df6a2665e31eb27cf2cb7e0b1f2e519c72e2cfbc39";

    const userStmt = db.prepare(`
      INSERT INTO users (id, email, phone, password_hash, salt, full_name, role, role_label, tier, loyalty_points, total_spent, orders_count, address, branch_id, status, is_seed, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);

    // Super Admin
    userStmt.run("usr-admin", "admin@hasaki.vn", "0903112233", defaultHash, defaultSalt, "Trần Đình Khoa (Admin)", "admin", "Quản Trị Viên Hệ Thống", "Diamond", 5000, 50000000, 20, "Trụ sở Hasaki, Q. Tân Bình", "CN1", "active", now);
    // Warehouse Staff
    userStmt.run("usr-warehouse", "kho@hasaki.vn", "0903334455", defaultHash, defaultSalt, "Nguyễn Văn Thành (Quản Lý Kho)", "warehouse_staff", "Nhân Viên Quản Lý Kho", "Gold", 800, 8000000, 5, "Kho Tổng Tân Bình", "CN1", "active", now);
    // Clinic Doctor
    userStmt.run("usr-doctor", "bacsi@hasaki.vn", "0903445566", defaultHash, defaultSalt, "BS. CKI Nguyễn Thị Mai", "clinic_doctor", "Bác Sĩ Da Liễu Hasaki Clinic", "Diamond", 1200, 15000000, 10, "Hasaki Clinic Q.10", "CN2", "active", now);
    // VIP Customer
    userStmt.run("usr-customer-vip", "khachhang@hasaki.vn", "0901234567", defaultHash, defaultSalt, "Nguyễn Minh Anh (VIP)", "customer", "Khách Hàng Thân Thiết", "Diamond", 2850, 28500000, 15, "71 Hoàng Hoa Thám, Tân Bình, TP.HCM", "CN1", "active", now);
  }

  // 3. Seed Hasaki Catalog Products & Inventory (30 initial flagship SKUs)
  const productCount = (db.prepare("SELECT COUNT(*) as count FROM products").get() as { count: number }).count;
  if (productCount === 0) {
    const now = new Date().toISOString();
    const prodStmt = db.prepare(`
      INSERT INTO products (id, sku, slug, name, english_name, brand_id, brand_name, category_id, category_slug, price, market_price, discount_percent, rating, review_count, sold_count, description, thumbnail_url, is_seed, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);

    const invStmt = db.prepare(`
      INSERT INTO inventory_balances (branch_id, sku, total_stock, reserved_stock, available_stock, reorder_point, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const sampleProducts = [
      {
        sku: "10023401",
        slug: "gel-rua-mat-la-roche-posay-tao-bot-cho-da-dau-nhay-cam-400ml.html",
        name: "Gel Rửa Mặt La Roche-Posay Tạo Bọt Cho Da Dầu Nhạy Cảm 400ml",
        englishName: "La Roche-Posay Effaclar Purifying Foaming Gel 400ml",
        brand: "La Roche-Posay",
        category: "cham-soc-da-mat-c4.html",
        price: 435000,
        marketPrice: 585000,
        discount: 26,
        rating: 4.9,
        reviews: 320,
        sold: 2150,
        image: "https://media.hasaki.vn/catalog/product/p/r/promotions-auto-gel-rua-mat-la-roche-posay-tao-bot-cho-da-dau-nhay-cam-400ml_5G5kQ19yK3s2b2vP.jpg",
      },
      {
        sku: "10023402",
        slug: "nuoc-tay-trang-bioderma-danh-cho-da-nhay-cam-500ml.html",
        name: "Nước Tẩy Trang Bioderma Dành Cho Da Nhạy Cảm 500ml",
        englishName: "Bioderma Sensibio H2O Micellar Water 500ml",
        brand: "Bioderma",
        category: "cham-soc-da-mat-c4.html",
        price: 369000,
        marketPrice: 525000,
        discount: 30,
        rating: 5.0,
        reviews: 450,
        sold: 4800,
        image: "https://media.hasaki.vn/catalog/product/p/r/promotions-auto-nuoc-tay-trang-bioderma-danh-cho-da-nhay-cam-500ml_5W9Z383vK3s2b2vP.jpg",
      },
      {
        sku: "10023403",
        slug: "kem-chong-nang-la-roche-posay-kiem-soat-dau-spf50-50ml.html",
        name: "Kem Chống Nắng La Roche-Posay Kiểm Soát Dầu SPF50+ 50ml",
        englishName: "La Roche-Posay Anthelios Oil Correct SPF50+ 50ml",
        brand: "La Roche-Posay",
        category: "cham-soc-da-mat-c4.html",
        price: 389000,
        marketPrice: 535000,
        discount: 27,
        rating: 4.8,
        reviews: 210,
        sold: 3100,
        image: "https://media.hasaki.vn/catalog/product/p/r/promotions-auto-kem-chong-nang-la-roche-posay-kiem-soat-dau-spf50-50ml_5G5kQ19yK3s2b2vP.jpg",
      },
      {
        sku: "10023404",
        slug: "tinh-chat-duong-am-phuc-hoi-da-klairs-midnight-blue-30ml.html",
        name: "Serum Klairs Midnight Blue Phục Hồi Dịu Da Ban Đêm 30ml",
        englishName: "Dear Klairs Midnight Blue Youth Activating Drop 30ml",
        brand: "Klairs",
        category: "cham-soc-da-mat-c4.html",
        price: 345000,
        marketPrice: 495000,
        discount: 30,
        rating: 4.9,
        reviews: 180,
        sold: 1450,
        image: "https://media.hasaki.vn/catalog/product/p/r/promotions-auto-tinh-chat-klairs-midnight-blue-30ml_5G5kQ19yK3s2b2vP.jpg",
      },
      {
        sku: "10023405",
        slug: "tay-te-bao-chet-ca-phe-dak-lak-cocoon-lam-sang-da-200ml.html",
        name: "Tẩy Tế Bào Chết Cơ Thể Cà Phê Đắk Lắk Cocoon 200ml",
        englishName: "Cocoon Dak Lak Coffee Body Polish 200ml",
        brand: "Cocoon",
        category: "cham-soc-co-the-c14.html",
        price: 115000,
        marketPrice: 145000,
        discount: 21,
        rating: 4.9,
        reviews: 580,
        sold: 6200,
        image: "https://media.hasaki.vn/catalog/product/p/r/promotions-auto-tay-te-bao-chet-ca-phe-dak-lak-cocoon-200ml_5G5kQ19yK3s2b2vP.jpg",
      },
      {
        sku: "10023406",
        slug: "sua-chong-nang-anessa-duong-da-kiem-dau-spf50-60ml.html",
        name: "Sữa Chống Nắng Anessa Dưỡng Da Kiềm Dầu SPF50+ PA++++ 60ml",
        englishName: "Anessa Perfect UV Sunscreen Skincare Milk 60ml",
        brand: "Anessa",
        category: "cham-soc-da-mat-c4.html",
        price: 520000,
        marketPrice: 715000,
        discount: 27,
        rating: 5.0,
        reviews: 390,
        sold: 3500,
        image: "https://media.hasaki.vn/catalog/product/p/r/promotions-auto-sua-chong-nang-anessa-60ml_5G5kQ19yK3s2b2vP.jpg",
      },
      {
        sku: "10023407",
        slug: "serum-loreal-paris-cap-am-chuyen-sau-1-5-hyaluronic-acid-30ml.html",
        name: "Serum L'Oreal Paris Cấp Ẩm Sáng Da 1.5% Hyaluronic Acid 30ml",
        englishName: "L'Oreal Paris Revitalift 1.5% Hyaluronic Acid Serum 30ml",
        brand: "L'Oreal",
        category: "cham-soc-da-mat-c4.html",
        price: 299000,
        marketPrice: 429000,
        discount: 30,
        rating: 4.8,
        reviews: 410,
        sold: 4300,
        image: "https://media.hasaki.vn/catalog/product/p/r/promotions-auto-serum-loreal-hyaluronic-acid-30ml_5G5kQ19yK3s2b2vP.jpg",
      },
      {
        sku: "10023408",
        slug: "kem-duong-am-cerave-cho-da-kho-den-rat-kho-454g.html",
        name: "Kem Dưỡng Ẩm CeraVe Moisturising Cream Cho Da Khô 454g",
        englishName: "CeraVe Moisturising Cream For Dry to Very Dry Skin 454g",
        brand: "CeraVe",
        category: "cham-soc-da-mat-c4.html",
        price: 395000,
        marketPrice: 495000,
        discount: 20,
        rating: 4.9,
        reviews: 290,
        sold: 2800,
        image: "https://media.hasaki.vn/catalog/product/p/r/promotions-auto-kem-duong-am-cerave-454g_5G5kQ19yK3s2b2vP.jpg",
      },
    ];

    for (let i = 0; i < sampleProducts.length; i++) {
      const p = sampleProducts[i];
      const prodId = `prod-${p.sku}`;
      prodStmt.run(
        prodId,
        p.sku,
        p.slug,
        p.name,
        p.englishName,
        `brand-${p.brand.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
        p.brand,
        "cat-skincare",
        p.category,
        p.price,
        p.marketPrice,
        p.discount,
        p.rating,
        p.reviews,
        p.sold,
        `${p.name} chính hãng 100% có tem phụ Tiếng Việt và hóa đơn VAT. Phục vụ giao hàng nhanh NowFree 2H.`,
        p.image,
        now
      );

      // Distribute stock across branches: CN1 (40), CN2 (30), CN15 (20), CN28 (15)
      invStmt.run("CN1", p.sku, 40, 2, 38, 10, now);
      invStmt.run("CN2", p.sku, 30, 1, 29, 10, now);
      invStmt.run("CN15", p.sku, 20, 0, 20, 10, now);
      invStmt.run("CN28", p.sku, 15, 0, 15, 5, now);
    }
  }

  // 4. Seed Clinic Services (Hasaki Clinic & Spa Dermatology)
  const serviceCount = (db.prepare("SELECT COUNT(*) as count FROM services").get() as { count: number }).count;
  if (serviceCount === 0) {
    const now = new Date().toISOString();
    const srvStmt = db.prepare(`
      INSERT INTO services (id, slug, name, category, price, market_price, duration_minutes, description, steps_count, is_seed, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);

    const clinicServicesSeed = [
      {
        slug: "lay-mun-chuan-y-khoa-khong-seo-tham-7-buoc.html",
        name: "Lấy Mụn Chuẩn Y Khoa Kháng Khuẩn 7 Bước",
        category: "Điều trị mụn",
        price: 199000,
        marketPrice: 350000,
        duration: 60,
        steps: 7,
        desc: "Làm sạch sâu bã nhờn, gắp nhân mụn vô khuẩn, chiếu ánh sáng sinh học Blue Light kháng viêm giảm sưng đỏ.",
      },
      {
        slug: "peel-da-tri-mun-sang-da-bha-salicylic-acid.html",
        name: "Peel Da BHA Salicylic Acid Trị Mụn Kiểm Soát Nhờn",
        category: "Peel da hóa học",
        price: 390000,
        marketPrice: 600000,
        duration: 45,
        steps: 8,
        desc: "Tẩy tế bào chết tầng sâu, thông thoáng lỗ chân lông, kiềm dầu và gom cồi mụn nhanh chóng.",
      },
      {
        slug: "triet-long-diode-laser-vung-nach-bao-hanh-5-nam.html",
        name: "Triệt Lông Diode Laser Công Nghệ Lạnh Vùng Nách",
        category: "Triệt lông",
        price: 99000,
        marketPrice: 250000,
        duration: 30,
        steps: 6,
        desc: "Đầu lạnh âm 5 độ C không đau rát, triệt tiêu nang lông tận gốc, se khít chân lông và sáng mịn vùng nách.",
      },
      {
        slug: "dien-di-tinh-chat-vitamin-c-sang-da-mo-tham.html",
        name: "Điện Di Tinh Chất Vitamin C Sáng Mịn Mờ Thâm",
        category: "Chăm sóc & Phục hồi",
        price: 249000,
        marketPrice: 450000,
        duration: 50,
        steps: 9,
        desc: "Đẩy sâu ion Vitamin C nguyên chất vào tầng trung bì, nuôi dưỡng da căng bóng và làm mờ các vết thâm sau mụn.",
      },
    ];

    for (let i = 0; i < clinicServicesSeed.length; i++) {
      const s = clinicServicesSeed[i];
      srvStmt.run(`srv-00${i + 1}`, s.slug, s.name, s.category, s.price, s.marketPrice, s.duration, s.desc, s.steps, now);
    }
  }
}

// ---------------------------------------------------------------------------
// 5. High-Level Repository Operations
// ---------------------------------------------------------------------------

// --- Branch Operations ---
export function listAllBranches(onlyActive = true): DbBranch[] {
  const db = getSqliteDb();
  const sql = onlyActive
    ? "SELECT * FROM branches WHERE is_active = 1 ORDER BY id ASC"
    : "SELECT * FROM branches ORDER BY id ASC";
  const rows = db.prepare(sql).all() as Array<{
    id: string;
    code: string;
    name: string;
    address: string;
    city: string;
    district: string;
    phone: string;
    supports_nowfree_2h: number;
    supports_clinic: number;
    is_active: number;
    is_seed: number;
    created_at: string;
  }>;

  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    address: r.address,
    city: r.city,
    district: r.district,
    phone: r.phone,
    supportsNowFree2H: r.supports_nowfree_2h === 1,
    supportsClinic: r.supports_clinic === 1,
    isActive: r.is_active === 1,
    isSeed: r.is_seed === 1,
    createdAt: r.created_at,
  }));
}

export function createCustomBranch(input: {
  code: string;
  name: string;
  address: string;
  city: string;
  district: string;
  phone: string;
  supportsNowFree2H?: boolean;
  supportsClinic?: boolean;
}): DbBranch {
  const db = getSqliteDb();
  const id = `BR-${Date.now().toString(36).toUpperCase()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO branches (id, code, name, address, city, district, phone, supports_nowfree_2h, supports_clinic, is_active, is_seed, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?)
  `).run(
    id,
    input.code.trim().toUpperCase(),
    input.name.trim(),
    input.address.trim(),
    input.city.trim(),
    input.district.trim(),
    input.phone.trim(),
    input.supportsNowFree2H ? 1 : 0,
    input.supportsClinic ? 1 : 0,
    now
  );

  return {
    id,
    code: input.code.trim().toUpperCase(),
    name: input.name.trim(),
    address: input.address.trim(),
    city: input.city.trim(),
    district: input.district.trim(),
    phone: input.phone.trim(),
    supportsNowFree2H: Boolean(input.supportsNowFree2H),
    supportsClinic: Boolean(input.supportsClinic),
    isActive: true,
    isSeed: false,
    createdAt: now,
  };
}

// --- Product & Catalog Operations ---
export function listProducts(filter?: {
  search?: string;
  category?: string;
  brand?: string;
  limit?: number;
  offset?: number;
}): { items: DbProduct[]; total: number } {
  const db = getSqliteDb();
  const seedFilter = isSeedDataEnabled() ? "" : "AND is_seed = 0";

  const whereClauses = [`1=1 ${seedFilter}`];
  const params: Array<string | number> = [];

  if (filter?.search && filter.search.trim()) {
    whereClauses.push("(name LIKE ? OR sku LIKE ? OR brand_name LIKE ?)");
    const q = `%${filter.search.trim()}%`;
    params.push(q, q, q);
  }

  if (filter?.category && filter.category.trim()) {
    whereClauses.push("category_slug = ?");
    params.push(filter.category.trim());
  }

  if (filter?.brand && filter.brand.trim()) {
    whereClauses.push("brand_name = ?");
    params.push(filter.brand.trim());
  }

  const whereSql = whereClauses.join(" AND ");
  const countRow = db.prepare(`SELECT COUNT(*) as total FROM products WHERE ${whereSql}`).get(...params) as { total: number };
  const total = countRow ? countRow.total : 0;

  const limit = Math.max(1, filter?.limit || 20);
  const offset = Math.max(0, filter?.offset || 0);

  const queryParams = [...params, limit, offset];
  const rows = db.prepare(`SELECT * FROM products WHERE ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...queryParams) as Array<{
    id: string;
    sku: string;
    slug: string;
    name: string;
    english_name: string | null;
    brand_id: string | null;
    brand_name: string | null;
    category_id: string | null;
    category_slug: string | null;
    price: number;
    market_price: number | null;
    discount_percent: number;
    rating: number;
    review_count: number;
    sold_count: number;
    description: string | null;
    thumbnail_url: string | null;
    is_seed: number;
    created_at: string;
  }>;

  const items: DbProduct[] = rows.map((r) => ({
    id: r.id,
    sku: r.sku,
    slug: r.slug,
    name: r.name,
    englishName: r.english_name,
    brandId: r.brand_id,
    brandName: r.brand_name,
    categoryId: r.category_id,
    categorySlug: r.category_slug,
    price: r.price,
    marketPrice: r.market_price,
    discountPercent: r.discount_percent,
    rating: r.rating,
    reviewCount: r.review_count,
    soldCount: r.sold_count,
    description: r.description,
    thumbnailUrl: r.thumbnail_url,
    isSeed: r.is_seed === 1,
    createdAt: r.created_at,
  }));

  return { items, total };
}

export function getProductBySkuOrSlug(key: string): DbProduct | null {
  const db = getSqliteDb();
  const seedFilter = isSeedDataEnabled() ? "" : "AND is_seed = 0";
  const row = db.prepare(`SELECT * FROM products WHERE (sku = ? OR slug = ?) ${seedFilter} LIMIT 1`).get(key, key) as {
    id: string;
    sku: string;
    slug: string;
    name: string;
    english_name: string | null;
    brand_id: string | null;
    brand_name: string | null;
    category_id: string | null;
    category_slug: string | null;
    price: number;
    market_price: number | null;
    discount_percent: number;
    rating: number;
    review_count: number;
    sold_count: number;
    description: string | null;
    thumbnail_url: string | null;
    is_seed: number;
    created_at: string;
  } | undefined;

  if (!row) return null;
  return {
    id: row.id,
    sku: row.sku,
    slug: row.slug,
    name: row.name,
    englishName: row.english_name,
    brandId: row.brand_id,
    brandName: row.brand_name,
    categoryId: row.category_id,
    categorySlug: row.category_slug,
    price: row.price,
    marketPrice: row.market_price,
    discountPercent: row.discount_percent,
    rating: row.rating,
    reviewCount: row.review_count,
    soldCount: row.sold_count,
    description: row.description,
    thumbnailUrl: row.thumbnail_url,
    isSeed: row.is_seed === 1,
    createdAt: row.created_at,
  };
}

export function createCustomProduct(input: {
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
}): DbProduct {
  const db = getSqliteDb();
  const now = new Date().toISOString();
  const slug = `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${input.sku}.html`;
  const id = `prod-${input.sku}`;
  const discount = input.marketPrice && input.marketPrice > input.price
    ? Math.round(((input.marketPrice - input.price) / input.marketPrice) * 100)
    : 0;

  db.exec("BEGIN TRANSACTION;");
  try {
    db.prepare(`
      INSERT INTO products (id, sku, slug, name, english_name, brand_name, category_slug, price, market_price, discount_percent, description, thumbnail_url, is_seed, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(
      id,
      input.sku.trim(),
      slug,
      input.name.trim(),
      input.name.trim(),
      (input.brandName || "Thương Hiệu Độc Quyền").trim(),
      (input.categorySlug || "cham-soc-da-mat-c4.html").trim(),
      input.price,
      input.marketPrice || input.price,
      discount,
      input.description || `${input.name} chính hãng 100%`,
      input.thumbnailUrl || "/hasaki-logo.png",
      now
    );

    // Initialize stock for all active branches or chosen branch
    const branches = listAllBranches(true);
    const targetBranch = input.branchId || (branches[0] ? branches[0].id : "CN1");
    const stock = input.initialStock ?? 50;

    for (const b of branches) {
      const q = b.id === targetBranch ? stock : 0;
      db.prepare(`
        INSERT INTO inventory_balances (branch_id, sku, total_stock, reserved_stock, available_stock, reorder_point, updated_at)
        VALUES (?, ?, ?, 0, ?, 10, ?)
      `).run(b.id, input.sku.trim(), q, q, now);
    }

    db.exec("COMMIT;");
  } catch (err) {
    db.exec("ROLLBACK;");
    throw err;
  }

  return {
    id,
    sku: input.sku.trim(),
    slug,
    name: input.name.trim(),
    englishName: input.name.trim(),
    brandId: null,
    brandName: input.brandName || "Thương Hiệu Độc Quyền",
    categoryId: null,
    categorySlug: input.categorySlug || "cham-soc-da-mat-c4.html",
    price: input.price,
    marketPrice: input.marketPrice || input.price,
    discountPercent: discount,
    rating: 5.0,
    reviewCount: 0,
    soldCount: 0,
    description: input.description || null,
    thumbnailUrl: input.thumbnailUrl || null,
    isSeed: false,
    createdAt: now,
  };
}

// --- Multi-Branch Inventory Operations ---
export function getProductStockByBranch(sku: string): DbBranchStock[] {
  const db = getSqliteDb();
  const rows = db.prepare(`
    SELECT b.id as branch_id, b.name as branch_name, ib.sku, ib.total_stock, ib.reserved_stock, ib.available_stock, ib.reorder_point, ib.updated_at
    FROM branches b
    LEFT JOIN inventory_balances ib ON b.id = ib.branch_id AND ib.sku = ?
    WHERE b.is_active = 1
    ORDER BY b.id ASC
  `).all(sku) as Array<{
    branch_id: string;
    branch_name: string;
    sku: string | null;
    total_stock: number | null;
    reserved_stock: number | null;
    available_stock: number | null;
    reorder_point: number | null;
    updated_at: string | null;
  }>;

  return rows.map((r) => ({
    branchId: r.branch_id,
    branchName: r.branch_name,
    sku,
    totalStock: r.total_stock ?? 0,
    reservedStock: r.reserved_stock ?? 0,
    availableStock: r.available_stock ?? 0,
    reorderPoint: r.reorder_point ?? 10,
    updatedAt: r.updated_at || new Date().toISOString(),
  }));
}

export function adjustInventoryStockSqlite(params: {
  branchId: string;
  sku: string;
  delta: number;
  reason: string;
  staffCode: string;
}): { previousStock: number; newStock: number; auditLogId: string } {
  const db = getSqliteDb();
  const now = new Date().toISOString();
  let previousStock = 0;
  let newStock = 0;
  const auditLogId = `log-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  db.exec("BEGIN TRANSACTION;");
  try {
    const current = db.prepare("SELECT * FROM inventory_balances WHERE branch_id = ? AND sku = ?").get(
      params.branchId,
      params.sku
    ) as { total_stock: number; reserved_stock: number; available_stock: number } | undefined;

    previousStock = current ? current.total_stock : 0;
    newStock = Math.max(0, previousStock + params.delta);
    const reserved = current ? Math.min(current.reserved_stock, newStock) : 0;
    const available = Math.max(0, newStock - reserved);

    db.prepare(`
      INSERT INTO inventory_balances (branch_id, sku, total_stock, reserved_stock, available_stock, reorder_point, updated_at)
      VALUES (?, ?, ?, ?, ?, 10, ?)
      ON CONFLICT(branch_id, sku) DO UPDATE SET
        total_stock = excluded.total_stock,
        reserved_stock = excluded.reserved_stock,
        available_stock = excluded.available_stock,
        updated_at = excluded.updated_at
    `).run(params.branchId, params.sku, newStock, reserved, available, now);

    // Fetch branch & product info for log
    const branch = db.prepare("SELECT name FROM branches WHERE id = ?").get(params.branchId) as { name: string } | undefined;
    const prod = db.prepare("SELECT name FROM products WHERE sku = ?").get(params.sku) as { name: string } | undefined;

    db.prepare(`
      INSERT INTO inventory_audit_logs (id, sku, product_name, delta, previous_stock, new_stock, reason, staff_code, branch_id, branch_name, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      auditLogId,
      params.sku,
      prod ? prod.name : params.sku,
      params.delta,
      previousStock,
      newStock,
      params.reason.trim(),
      params.staffCode || "SYSTEM",
      params.branchId,
      branch ? branch.name : params.branchId,
      now
    );

    db.exec("COMMIT;");
  } catch (err) {
    db.exec("ROLLBACK;");
    throw err;
  }

  return { previousStock, newStock, auditLogId };
}

// --- Order Operations with Atomic Branch Stock Reservation ---
export function createOrderWithBranchStockSqlite(input: {
  userId?: string | null;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  branchId?: string;
  deliveryType?: "NowFree 2H" | "Tiêu chuẩn";
  paymentMethod?: string;
  items: Array<{ sku: string; quantity: number; name?: string; price?: number; slug?: string; image?: string }>;
  notes?: string;
  vietQrPayload?: string;
  vietQrUrl?: string;
}): DbOrder {
  const db = getSqliteDb();
  const now = new Date().toISOString();
  const orderId = `ord-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
  const orderCode = `HSK-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Date.now().toString().slice(-5)}`;

  const branches = listAllBranches(true);
  let branch = branches.find((b) => b.id === input.branchId);
  if (!branch) {
    // Default to branch 1
    branch = branches[0] || {
      id: "CN1",
      code: "BR-HCM-01",
      name: "CN1 - 71 Hoàng Hoa Thám, Tân Bình",
      address: "71 Hoàng Hoa Thám, Tân Bình",
      city: "Hồ Chí Minh",
      district: "Tân Bình",
      phone: "1800 6324",
      supportsNowFree2H: true,
      supportsClinic: true,
      isActive: true,
      isSeed: false,
      createdAt: now,
    };
  }

  const deliveryType = input.deliveryType || "NowFree 2H";
  const paymentMethod = input.paymentMethod || "Thanh toán khi nhận hàng (COD)";

  db.exec("BEGIN TRANSACTION;");
  try {
    let subtotal = 0;
    const orderItems: DbOrderItem[] = [];

    for (const item of input.items) {
      // Lookup product by SKU
      const prod = db.prepare("SELECT * FROM products WHERE sku = ?").get(item.sku) as {
        name: string;
        price: number;
        slug: string;
        thumbnail_url: string;
      } | undefined;

      const itemName = item.name || (prod ? prod.name : `Sản phẩm ${item.sku}`);
      const itemPrice = typeof item.price === "number" && item.price > 0 ? item.price : (prod ? prod.price : 100000);
      const lineSubtotal = itemPrice * item.quantity;
      subtotal += lineSubtotal;

      const itemId = `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      orderItems.push({
        id: itemId,
        orderId,
        sku: item.sku,
        productName: itemName,
        price: itemPrice,
        quantity: item.quantity,
        subtotal: lineSubtotal,
        slug: item.slug || (prod ? prod.slug : undefined),
        image: item.image || (prod ? prod.thumbnail_url : undefined),
      });

      // Insert line item
      db.prepare(`
        INSERT INTO order_items (id, order_id, sku, product_name, price, quantity, subtotal, slug, image)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        itemId,
        orderId,
        item.sku,
        itemName,
        itemPrice,
        item.quantity,
        lineSubtotal,
        item.slug || (prod ? prod.slug : null),
        item.image || (prod ? prod.thumbnail_url : null)
      );

      // Atomic branch stock reservation/deduction
      const curStock = db.prepare("SELECT * FROM inventory_balances WHERE branch_id = ? AND sku = ?").get(
        branch.id,
        item.sku
      ) as { total_stock: number; reserved_stock: number; available_stock: number } | undefined;

      const prevAvail = curStock ? curStock.available_stock : 100;
      const prevRes = curStock ? curStock.reserved_stock : 0;
      const totalStock = curStock ? curStock.total_stock : 100;
      const newAvail = Math.max(0, prevAvail - item.quantity);
      const newRes = prevRes + item.quantity;

      db.prepare(`
        INSERT INTO inventory_balances (branch_id, sku, total_stock, reserved_stock, available_stock, reorder_point, updated_at)
        VALUES (?, ?, ?, ?, ?, 10, ?)
        ON CONFLICT(branch_id, sku) DO UPDATE SET
          reserved_stock = excluded.reserved_stock,
          available_stock = excluded.available_stock,
          updated_at = excluded.updated_at
      `).run(branch.id, item.sku, totalStock, newRes, newAvail, now);

      // Audit Log
      db.prepare(`
        INSERT INTO inventory_audit_logs (id, sku, product_name, delta, previous_stock, new_stock, reason, staff_code, branch_id, branch_name, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'ORDER_CHECKOUT', ?, ?, ?)
      `).run(
        `log-${orderId}-${item.sku}`,
        item.sku,
        itemName,
        -item.quantity,
        prevAvail,
        newAvail,
        `Giữ hàng cho đơn hàng mới ${orderCode} tại chi nhánh ${branch.name}`,
        branch.id,
        branch.name,
        now
      );
    }

    const shippingFee = deliveryType === "NowFree 2H" && subtotal >= 90000 ? 0 : 25000;
    const total = subtotal + shippingFee;

    db.prepare(`
      INSERT INTO orders (id, order_code, user_id, customer_name, customer_phone, shipping_address, branch_id, branch_name, delivery_type, payment_method, payment_status, status, subtotal, shipping_fee, discount, total, vietqr_payload, vietqr_url, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', 'pending', ?, ?, 0, ?, ?, ?, ?, ?, ?)
    `).run(
      orderId,
      orderCode,
      input.userId || null,
      input.customerName.trim(),
      input.customerPhone.trim(),
      input.shippingAddress.trim(),
      branch.id,
      branch.name,
      deliveryType,
      paymentMethod,
      subtotal,
      shippingFee,
      total,
      input.vietQrPayload || null,
      input.vietQrUrl || null,
      input.notes?.trim() || null,
      now,
      now
    );

    db.exec("COMMIT;");

    return {
      id: orderId,
      orderCode,
      userId: input.userId || null,
      customerName: input.customerName.trim(),
      customerPhone: input.customerPhone.trim(),
      shippingAddress: input.shippingAddress.trim(),
      branchId: branch.id,
      branchName: branch.name,
      deliveryType,
      paymentMethod,
      paymentStatus: "unpaid",
      status: "pending",
      subtotal,
      shippingFee,
      discount: 0,
      total,
      vietQrPayload: input.vietQrPayload || null,
      vietQrUrl: input.vietQrUrl || null,
      notes: input.notes?.trim() || null,
      createdAt: now,
      updatedAt: now,
      items: orderItems,
    };
  } catch (err) {
    db.exec("ROLLBACK;");
    throw err;
  }
}

export function listOrdersSqlite(filter?: {
  search?: string;
  status?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}): { items: DbOrder[]; total: number } {
  const db = getSqliteDb();
  const whereClauses = ["1=1"];
  const params: Array<string | number> = [];

  if (filter?.search && filter.search.trim()) {
    whereClauses.push("(order_code LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)");
    const q = `%${filter.search.trim()}%`;
    params.push(q, q, q);
  }

  if (filter?.status && filter.status.trim()) {
    whereClauses.push("status = ?");
    params.push(filter.status.trim());
  }

  if (filter?.userId && filter.userId.trim()) {
    whereClauses.push("user_id = ?");
    params.push(filter.userId.trim());
  }

  const whereSql = whereClauses.join(" AND ");
  const countRow = db.prepare(`SELECT COUNT(*) as total FROM orders WHERE ${whereSql}`).get(...params) as { total: number };
  const total = countRow ? countRow.total : 0;

  const limit = Math.max(1, filter?.limit || 50);
  const offset = Math.max(0, filter?.offset || 0);

  const queryParams = [...params, limit, offset];
  const rows = db.prepare(`SELECT * FROM orders WHERE ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...queryParams) as Array<{
    id: string;
    order_code: string;
    user_id: string | null;
    customer_name: string;
    customer_phone: string;
    shipping_address: string;
    branch_id: string;
    branch_name: string;
    delivery_type: "NowFree 2H" | "Tiêu chuẩn";
    payment_method: string;
    payment_status: "unpaid" | "paid" | "refunded";
    status: "pending" | "confirmed" | "packing" | "shipping" | "delivered" | "cancelled";
    subtotal: number;
    shipping_fee: number;
    discount: number;
    total: number;
    vietqr_payload: string | null;
    vietqr_url: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
  }>;

  const items: DbOrder[] = rows.map((r) => {
    const itemRows = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(r.id) as Array<{
      id: string;
      order_id: string;
      sku: string;
      product_name: string;
      variant_name: string | null;
      price: number;
      quantity: number;
      subtotal: number;
      slug: string | null;
      image: string | null;
    }>;

    return {
      id: r.id,
      orderCode: r.order_code,
      userId: r.user_id,
      customerName: r.customer_name,
      customerPhone: r.customer_phone,
      shippingAddress: r.shipping_address,
      branchId: r.branch_id,
      branchName: r.branch_name,
      deliveryType: r.delivery_type,
      paymentMethod: r.payment_method,
      paymentStatus: r.payment_status,
      status: r.status,
      subtotal: r.subtotal,
      shippingFee: r.shipping_fee,
      discount: r.discount,
      total: r.total,
      vietQrPayload: r.vietqr_payload,
      vietQrUrl: r.vietqr_url,
      notes: r.notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      items: itemRows.map((i) => ({
        id: i.id,
        orderId: i.order_id,
        sku: i.sku,
        productName: i.product_name,
        variantName: i.variant_name,
        price: i.price,
        quantity: i.quantity,
        subtotal: i.subtotal,
        slug: i.slug,
        image: i.image,
      })),
    };
  });

  return { items, total };
}

export function getOrderByIdOrCodeSqlite(key: string): DbOrder | null {
  const db = getSqliteDb();
  const r = db.prepare("SELECT * FROM orders WHERE id = ? OR order_code = ? LIMIT 1").get(key, key) as {
    id: string;
    order_code: string;
    user_id: string | null;
    customer_name: string;
    customer_phone: string;
    shipping_address: string;
    branch_id: string;
    branch_name: string;
    delivery_type: "NowFree 2H" | "Tiêu chuẩn";
    payment_method: string;
    payment_status: "unpaid" | "paid" | "refunded";
    status: "pending" | "confirmed" | "packing" | "shipping" | "delivered" | "cancelled";
    subtotal: number;
    shipping_fee: number;
    discount: number;
    total: number;
    vietqr_payload: string | null;
    vietqr_url: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
  } | undefined;

  if (!r) return null;

  const itemRows = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(r.id) as Array<{
    id: string;
    order_id: string;
    sku: string;
    product_name: string;
    variant_name: string | null;
    price: number;
    quantity: number;
    subtotal: number;
    slug: string | null;
    image: string | null;
  }>;

  return {
    id: r.id,
    orderCode: r.order_code,
    userId: r.user_id,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    shippingAddress: r.shipping_address,
    branchId: r.branch_id,
    branchName: r.branch_name,
    deliveryType: r.delivery_type,
    paymentMethod: r.payment_method,
    paymentStatus: r.payment_status,
    status: r.status,
    subtotal: r.subtotal,
    shippingFee: r.shipping_fee,
    discount: r.discount,
    total: r.total,
    vietQrPayload: r.vietqr_payload,
    vietQrUrl: r.vietqr_url,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    items: itemRows.map((i) => ({
      id: i.id,
      orderId: i.order_id,
      sku: i.sku,
      productName: i.product_name,
      variantName: i.variant_name,
      price: i.price,
      quantity: i.quantity,
      subtotal: i.subtotal,
      slug: i.slug,
      image: i.image,
    })),
  };
}
