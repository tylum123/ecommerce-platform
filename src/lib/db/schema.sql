-- =============================================================================
-- White-label Retail + Clinic Schema for PostgreSQL 16
-- Multi-Branch, Brand/Catalog White-Label Isolation, Seed Data Switch
-- =============================================================================

-- 1. Branches: Multi-Branch architecture (1..N branches)
CREATE TABLE IF NOT EXISTS branches (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  supports_nowfree_2h BOOLEAN NOT NULL DEFAULT TRUE,
  supports_clinic BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_seed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Categories
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(64) PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  parent_id VARCHAR(64) REFERENCES categories(id) ON DELETE SET NULL,
  icon TEXT,
  display_order INT DEFAULT 0,
  is_seed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Brands
CREATE TABLE IF NOT EXISTS brands (
  id VARCHAR(64) PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  country VARCHAR(100),
  is_seed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Products
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  sku VARCHAR(64) UNIQUE NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  english_name VARCHAR(255),
  brand_id VARCHAR(64) REFERENCES brands(id) ON DELETE SET NULL,
  brand_name VARCHAR(255),
  category_id VARCHAR(64) REFERENCES categories(id) ON DELETE SET NULL,
  category_slug VARCHAR(255),
  price INT NOT NULL CHECK (price >= 0),
  market_price INT,
  discount_percent INT DEFAULT 0,
  rating NUMERIC(2,1) DEFAULT 5.0,
  review_count INT DEFAULT 0,
  sold_count INT DEFAULT 0,
  description TEXT,
  thumbnail_url TEXT,
  is_seed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Product Variants
CREATE TABLE IF NOT EXISTS product_variants (
  id VARCHAR(64) PRIMARY KEY,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  option_name VARCHAR(100),
  option_value VARCHAR(100),
  price INT NOT NULL CHECK (price >= 0),
  market_price INT,
  thumbnail_url TEXT,
  is_seed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Multi-Branch Inventory Balances
CREATE TABLE IF NOT EXISTS inventory_balances (
  branch_id VARCHAR(64) NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  sku VARCHAR(64) NOT NULL,
  total_stock INT NOT NULL DEFAULT 0 CHECK (total_stock >= 0),
  reserved_stock INT NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0),
  available_stock INT NOT NULL DEFAULT 0 CHECK (available_stock >= 0),
  reorder_point INT NOT NULL DEFAULT 10,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (branch_id, sku)
);

-- 7. Clinic & Spa Services
CREATE TABLE IF NOT EXISTS services (
  id VARCHAR(64) PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  price INT NOT NULL CHECK (price >= 0),
  market_price INT,
  duration_minutes INT DEFAULT 60,
  description TEXT,
  steps_count INT DEFAULT 7,
  is_seed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Users & Staff RBAC
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(32) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  salt VARCHAR(64) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'customer',
  role_label VARCHAR(100),
  tier VARCHAR(32) NOT NULL DEFAULT 'Member',
  loyalty_points INT NOT NULL DEFAULT 0,
  total_spent BIGINT NOT NULL DEFAULT 0,
  orders_count INT NOT NULL DEFAULT 0,
  address TEXT,
  branch_id VARCHAR(64) REFERENCES branches(id) ON DELETE SET NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  is_seed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Orders
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  order_code VARCHAR(64) UNIQUE NOT NULL,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(32) NOT NULL,
  shipping_address TEXT NOT NULL,
  branch_id VARCHAR(64) NOT NULL REFERENCES branches(id),
  branch_name VARCHAR(255) NOT NULL,
  delivery_type VARCHAR(64) NOT NULL DEFAULT 'NowFree 2H',
  payment_method VARCHAR(100) NOT NULL DEFAULT 'COD',
  payment_status VARCHAR(32) NOT NULL DEFAULT 'unpaid',
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  subtotal INT NOT NULL DEFAULT 0,
  shipping_fee INT NOT NULL DEFAULT 0,
  discount INT NOT NULL DEFAULT 0,
  total INT NOT NULL DEFAULT 0,
  vietqr_payload TEXT,
  vietqr_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sku VARCHAR(64) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  variant_name VARCHAR(255),
  price INT NOT NULL,
  quantity INT NOT NULL,
  subtotal INT NOT NULL,
  slug VARCHAR(255),
  image TEXT
);

-- 11. Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(64) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(32) NOT NULL,
  service_name VARCHAR(255) NOT NULL,
  branch_name VARCHAR(255) NOT NULL,
  appointment_time VARCHAR(100) NOT NULL,
  status VARCHAR(64) NOT NULL DEFAULT 'confirmed',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Inventory Audit Logs
CREATE TABLE IF NOT EXISTS inventory_audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  sku VARCHAR(64) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  delta INT NOT NULL,
  previous_stock INT NOT NULL,
  new_stock INT NOT NULL,
  reason TEXT NOT NULL,
  staff_code VARCHAR(64) NOT NULL,
  branch_id VARCHAR(64) NOT NULL,
  branch_name VARCHAR(255) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. System Settings
CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(64) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_is_seed ON products(is_seed);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_code ON orders(order_code);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory_balances(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_branch ON inventory_balances(branch_id);
