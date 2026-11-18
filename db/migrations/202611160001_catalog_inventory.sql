-- DRAFT, NOT APPLIED. Review docs/POSTGRES_CATALOG_MIGRATION.md first.
-- PostgreSQL 15+ / Supabase. New private schema only; no import or runtime cutover.
-- Intentionally fails if schema already exists: never hide partial/conflicting DDL.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

CREATE SCHEMA nari_catalog;
REVOKE ALL ON SCHEMA nari_catalog FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA nari_catalog REVOKE ALL ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA nari_catalog REVOKE ALL ON SEQUENCES FROM PUBLIC;

CREATE TABLE nari_catalog.sources (
  id text PRIMARY KEY,
  source_url text,
  captured_at timestamptz,
  imported_at timestamptz NOT NULL DEFAULT now(),
  verification_state text NOT NULL CHECK (verification_state IN ('unverified', 'observed', 'merchant', 'demo')),
  scope text NOT NULL CHECK (btrim(scope) <> ''),
  notes text
);

CREATE TABLE nari_catalog.branches (
  id text PRIMARY KEY,
  code text UNIQUE NOT NULL CHECK (btrim(code) <> ''),
  name text NOT NULL CHECK (btrim(name) <> ''),
  address text NOT NULL,
  city text NOT NULL,
  district text NOT NULL,
  phone text NOT NULL,
  supports_nowfree_2h boolean NOT NULL DEFAULT false,
  supports_clinic boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  is_demo boolean NOT NULL DEFAULT false,
  source_id text REFERENCES nari_catalog.sources(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE nari_catalog.categories (
  id text PRIMARY KEY,
  slug text UNIQUE NOT NULL CHECK (btrim(slug) <> ''),
  name text NOT NULL CHECK (btrim(name) <> ''),
  parent_id text REFERENCES nari_catalog.categories(id) ON DELETE RESTRICT,
  display_order integer NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  icon_url text,
  is_demo boolean NOT NULL DEFAULT false,
  source_id text REFERENCES nari_catalog.sources(id) ON DELETE RESTRICT,
  CHECK (parent_id IS NULL OR parent_id <> id)
);
CREATE INDEX categories_parent_idx ON nari_catalog.categories(parent_id);

CREATE TABLE nari_catalog.brands (
  id text PRIMARY KEY,
  slug text UNIQUE NOT NULL CHECK (btrim(slug) <> ''),
  name text NOT NULL CHECK (btrim(name) <> ''),
  logo_url text,
  country text,
  is_demo boolean NOT NULL DEFAULT false,
  source_id text REFERENCES nari_catalog.sources(id) ON DELETE RESTRICT
);

CREATE TABLE nari_catalog.products (
  id text PRIMARY KEY,
  sku text UNIQUE NOT NULL CHECK (sku ~ '^[A-Za-z0-9_-]{1,80}$'),
  slug text UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9][a-z0-9.-]{0,240}\.html$'),
  name text NOT NULL CHECK (btrim(name) <> ''),
  english_name text,
  brand_id text NOT NULL REFERENCES nari_catalog.brands(id) ON DELETE RESTRICT,
  category_id text NOT NULL REFERENCES nari_catalog.categories(id) ON DELETE RESTRICT,
  price bigint NOT NULL CHECK (price BETWEEN 0 AND 9007199254740991),
  market_price bigint NOT NULL CHECK (market_price BETWEEN price AND 9007199254740991),
  description text NOT NULL DEFAULT '',
  -- Raw editorial source, never an assertion of sanitized/render-safe HTML.
  overview_html text NOT NULL DEFAULT '',
  ingredients_html text NOT NULL DEFAULT '',
  usage_html text NOT NULL DEFAULT '',
  observed_rating numeric(3,2) CHECK (observed_rating BETWEEN 0 AND 5),
  observed_review_count bigint CHECK (observed_review_count BETWEEN 0 AND 9007199254740991),
  observed_sold_count bigint CHECK (observed_sold_count BETWEEN 0 AND 9007199254740991),
  is_demo boolean NOT NULL DEFAULT false,
  hidden_at timestamptz,
  source_id text REFERENCES nari_catalog.sources(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_category_visible_idx ON nari_catalog.products(category_id, updated_at DESC) WHERE hidden_at IS NULL;
CREATE INDEX products_brand_visible_idx ON nari_catalog.products(brand_id, updated_at DESC) WHERE hidden_at IS NULL;
CREATE INDEX products_source_idx ON nari_catalog.products(source_id);

CREATE TABLE nari_catalog.product_images (
  id text PRIMARY KEY,
  product_id text NOT NULL REFERENCES nari_catalog.products(id) ON DELETE RESTRICT,
  url text NOT NULL CHECK (url ~ '^(https://|/($|[^/]))' AND position(chr(92) in url) = 0),
  alt_text text NOT NULL DEFAULT '',
  sort_order integer NOT NULL CHECK (sort_order BETWEEN 0 AND 29),
  -- Position 0 is the thumbnail: no second independent thumbnail source.
  storage_bucket text,
  storage_path text,
  source_id text REFERENCES nari_catalog.sources(id) ON DELETE RESTRICT,
  UNIQUE (product_id, sort_order) DEFERRABLE INITIALLY IMMEDIATE,
  UNIQUE (product_id, url),
  CHECK ((storage_bucket IS NULL) = (storage_path IS NULL))
);

CREATE TABLE nari_catalog.product_specs (
  product_id text NOT NULL REFERENCES nari_catalog.products(id) ON DELETE RESTRICT,
  sort_order integer NOT NULL CHECK (sort_order >= 0),
  label text NOT NULL CHECK (btrim(label) <> ''),
  value text NOT NULL CHECK (btrim(value) <> ''),
  PRIMARY KEY (product_id, sort_order)
);

CREATE TABLE nari_catalog.home_banners (
  id text PRIMARY KEY,
  placement text NOT NULL CHECK (placement IN ('hero', 'side')),
  sort_order integer NOT NULL CHECK (sort_order BETWEEN 0 AND 39),
  image_url text NOT NULL CHECK (image_url ~ '^(https://|/($|[^/]))' AND position(chr(92) in image_url) = 0),
  target_url text NOT NULL CHECK (target_url ~ '^(https://|/($|[^/]))' AND position(chr(92) in target_url) = 0),
  alt_text text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  source_id text REFERENCES nari_catalog.sources(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (placement, sort_order) DEFERRABLE INITIALLY IMMEDIATE
);

CREATE TABLE nari_catalog.inventory_balances (
  branch_id text NOT NULL REFERENCES nari_catalog.branches(id) ON DELETE RESTRICT,
  product_id text NOT NULL REFERENCES nari_catalog.products(id) ON DELETE RESTRICT,
  total_stock integer NOT NULL DEFAULT 0 CHECK (total_stock >= 0),
  reserved_stock integer NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0 AND reserved_stock <= total_stock),
  available_stock integer GENERATED ALWAYS AS (total_stock - reserved_stock) STORED,
  reorder_point integer NOT NULL DEFAULT 10 CHECK (reorder_point >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (branch_id, product_id)
);
CREATE INDEX inventory_product_idx ON nari_catalog.inventory_balances(product_id, branch_id);

CREATE TABLE nari_catalog.inventory_movements (
  id text PRIMARY KEY,
  branch_id text NOT NULL,
  product_id text NOT NULL,
  delta integer NOT NULL CHECK (delta <> 0),
  previous_stock integer NOT NULL CHECK (previous_stock >= 0),
  new_stock integer NOT NULL CHECK (new_stock >= 0),
  reason text NOT NULL CHECK (btrim(reason) <> ''),
  actor_id text NOT NULL CHECK (btrim(actor_id) <> ''),
  idempotency_key text UNIQUE NOT NULL CHECK (btrim(idempotency_key) <> ''),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (branch_id, product_id) REFERENCES nari_catalog.inventory_balances(branch_id, product_id) ON DELETE RESTRICT,
  CHECK (previous_stock::bigint + delta::bigint = new_stock::bigint)
);
CREATE INDEX inventory_movements_balance_time_idx ON nari_catalog.inventory_movements(branch_id, product_id, created_at DESC);

-- No client policies: every table is denied by default. A separate reviewed
-- runtime-role migration must supply narrowly scoped access and branch RBAC.
DO $migration$
DECLARE table_name text;
        api_role text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['sources', 'branches', 'categories', 'brands', 'products', 'product_images', 'product_specs', 'home_banners', 'inventory_balances', 'inventory_movements'] LOOP
    EXECUTE format('ALTER TABLE nari_catalog.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON TABLE nari_catalog.%I FROM PUBLIC', table_name);
  END LOOP;
  FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
      EXECUTE format('REVOKE ALL ON SCHEMA nari_catalog FROM %I', api_role);
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA nari_catalog FROM %I', api_role);
      EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA nari_catalog FROM %I', api_role);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA nari_catalog REVOKE ALL ON TABLES FROM %I', api_role);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA nari_catalog REVOKE ALL ON SEQUENCES FROM %I', api_role);
    END IF;
  END LOOP;
END;
$migration$;

COMMIT;
